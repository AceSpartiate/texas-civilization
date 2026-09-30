// Read aloud through the classroom server (owner, 2026-09-30, D15; docs/READ_ALOUD.md): only a joined page may ask, a class
// with no voice says so, a spoken sentence is served by its key, and the lines the server writes for a family a student plays
// - a rider's words and the family's own person's - are begun at once, in the speaker's voice, behind any line pressed.
//
// A fake synthesiser stands in for Kokoro (tests/read-aloud-service.test.mjs); proven by injection on 2026-09-30
// (scripts/read-aloud-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createWorld } from '../sim/world.mjs';
import { record } from '../sim/events.mjs';
import { createVoice } from '../server/voice/service.mjs';
import { keyOf } from '../server/voice/text.mjs';

const WORDS = new Set(['the', 'soldiers', 'came', 'for', 'cannon', 'did', 'you', 'see', 'them', 'yourself', 'went', 'home']);
function client(port) {
  const jar = new Map();
  return {
    async call(path, data) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: data ? 'POST' : 'GET',
        headers: { ...(data && { 'Content-Type': 'application/json' }), ...(jar.size && { Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') }) },
        ...(data && { body: JSON.stringify(data) }),
      });
      for (const raw of response.headers.getSetCookie()) { const [pair] = raw.split(';'); const at = pair.indexOf('='); jar.set(pair.slice(0, at), pair.slice(at + 1)); }
      const type = response.headers.get('content-type') || '';
      return { status: response.status, type, body: type.includes('json') ? await response.json() : Buffer.from(await response.arrayBuffer()).toString() };
    },
  };
}
/** A class whose first family has a rider standing with its mother, already talking (as sim/encounters.mjs leaves one). */
function worldWithRider(seed, count) {
  const world = createWorld(seed, count);
  const seen = record(world, 'observation', { text: 'The soldiers came for the cannon.', visibility: 'public' });
  world.truth['cannon-request'] = { minute: 0, eventId: seen };
  const carrier = world.households['hh-2'].members[0], listener = world.households['hh-1'].members.find(id => id.endsWith('-elena'));
  world.encounters['enc-1'] = {
    id: 'enc-1', carrierId: carrier, carrierName: world.entities[carrier].name, householdId: 'hh-1', listenerId: listener, topicId: 'cannon-request',
    status: 'open', originSiteId: world.households['hh-2'].homeSiteId, departedMinute: 0, observedMinute: 0, openedMinute: 0, lastSpokenMinute: 0,
    provenance: [], said: [{ speaker: 'rider', text: 'The soldiers came for the cannon.', minute: 0 }, { speaker: 'listener', text: 'Did you see them yourself?', minute: 0 }], asked: [],
  };
  world.nextEncounterId = 2;
  return world;
}
async function classroom({ voice = 'fake', worldFactory } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'read-aloud-server-'));
  const spoken = [];
  const gates = [];
  const synthesiser = async (job, { opus }) => { spoken.push({ role: job.role, text: job.text, priority: job.priority }); await new Promise(resolve => gates.push(resolve)); writeFileSync(opus, 'OggS-fake'); };
  const made = voice === 'fake' ? createVoice({ cacheDir: join(dir, 'voice-cache'), synthesiser, vocabulary: WORDS, log: { warn() {} } }) : null;
  const app = createClassroom({ seed: 'read-aloud', playerCount: 5, tickMs: 10000, savePath: join(dir, 'classroom.json'), voice: made, ...(worldFactory && { worldFactory }) });
  const port = await app.listen(0, '127.0.0.1');
  // Let the sentence being spoken finish; a sentence never begun fails the test rather than waiting for ever.
  const next = async () => {
    const until = Date.now() + 5000;
    while (!gates.length) { if (Date.now() > until) throw new assert.AssertionError({ message: 'no sentence was begun' }); await new Promise(resolve => setTimeout(resolve, 5)); }
    gates.shift()(); await new Promise(resolve => setTimeout(resolve, 20));
  };
  return { app, port, spoken, next, dispose: async () => { await app.close(); rmSync(dir, { recursive: true, force: true }); } };
}

test('only a joined page may ask, and a class tells its pages whether it can read aloud', async () => {
  const { app, port, dispose } = await classroom();
  try {
    const stranger = client(port);
    assert.equal((await stranger.call('/api/voice')).status, 401);
    assert.equal((await stranger.call('/api/voice', { lines: [{ text: 'The soldiers went home.', voice: 'narrator' }] })).status, 401);
    assert.equal((await stranger.call(`/voice/${keyOf('narrator', 'The soldiers went home.')}.opus`)).status, 401);
    const student = client(port);
    assert.equal((await student.call('/api/join', { name: 'Ana', code: app.state.sessionCode })).status, 200);
    const status = await student.call('/api/voice');
    assert.deepEqual(status.body, { available: true, host: true, voices: ['narrator', 'woman', 'man', 'rider'] });
  } finally { await dispose(); }
  const bare = await classroom({ voice: null });
  try {
    const student = client(bare.port);
    await student.call('/api/join', { name: 'Ben', code: bare.app.state.sessionCode });
    assert.equal((await student.call('/api/voice')).body.available, false);
    const asked = await student.call('/api/voice', { lines: [{ text: 'The soldiers went home.', voice: 'narrator' }] });
    assert.equal(asked.status, 503);
    assert.match(asked.body.error, /not installed/);
  } finally { await bare.dispose(); }
});

test('a page\'s line is made and then served by its key as Ogg Opus; a word the game never writes is not', async () => {
  const { app, port, next, dispose } = await classroom();
  try {
    const student = client(port);
    await student.call('/api/join', { name: 'Ana', code: app.state.sessionCode });
    const key = keyOf('narrator', 'The soldiers went home.');
    const asked = await student.call('/api/voice', { lines: [{ text: 'The soldiers went home.', voice: 'narrator' }] });
    assert.deepEqual(asked.body.parts, [{ key, ready: false, making: true }]);
    assert.equal((await student.call(`/voice/${key}.opus`)).status, 404, 'not until it is made');
    await next();
    const again = await student.call('/api/voice', { lines: [{ text: 'The soldiers went home.', voice: 'narrator' }] });
    assert.deepEqual(again.body.parts, [{ key, ready: true }]);
    const sound = await student.call(`/voice/${key}.opus`);
    assert.equal(sound.status, 200);
    assert.match(sound.type, /^audio\/ogg/);
    assert.equal(sound.body, 'OggS-fake');
    const rude = await student.call('/api/voice', { lines: [{ text: 'The soldiers went zorblax.', voice: 'narrator' }] });
    assert.equal(rude.body.parts[0].refused, true);
    assert.equal((await student.call('/api/voice', { lines: [{ text: 'Hello.', voice: 'robot' }] })).status, 400);
    // The class's own names are its words: the family a student plays is spoken of by name.
    const family = app.state.world.households[app.state.clients[Object.keys(app.state.clients)[0]].householdId];
    const named = await student.call('/api/voice', { lines: [{ text: `${app.state.world.entities[family.members[0]].name} went home.`, voice: 'narrator' }] });
    assert.equal(named.body.parts[0].making, true, 'a name in the class was refused');
  } finally { await dispose(); }
});

test('what a rider and the family\'s own person say is begun as the server writes it, each in the speaker\'s voice', async () => {
  const { app, port, spoken, next, dispose } = await classroom({ worldFactory: worldWithRider });
  try {
    assert.equal(spoken.length, 0, 'nothing is begun for a family nobody plays');
    const student = client(port);
    const joined = await student.call('/api/join', { name: 'Ana', code: app.state.sessionCode });
    assert.equal(joined.status, 200, joined.body.error);
    assert.equal(joined.body.world.householdId, 'hh-1');
    await next(); await next();
    assert.deepEqual(spoken, [
      { role: 'rider', text: 'The soldiers came for the cannon.', priority: 'soon' },
      { role: 'woman', text: 'Did you see them yourself?', priority: 'soon' },
    ]);
    // The page asks for the same lines in the same voices, and they are there.
    const asked = await student.call('/api/voice', { lines: [{ text: 'The soldiers came for the cannon.', voice: 'rider' }, { text: 'Did you see them yourself?', voice: 'woman' }] });
    assert.deepEqual(asked.body.parts.map(part => part.ready), [true, true]);
  } finally { await dispose(); }
});

test('two students pressing at once take turns: each page\'s first sentence before either\'s second (the end of the game)', async () => {
  const { app, port, spoken, next, dispose } = await classroom();
  try {
    const ana = client(port), ben = client(port);
    await ana.call('/api/join', { name: 'Ana', code: app.state.sessionCode });
    await ben.call('/api/join', { name: 'Ben', code: app.state.sessionCode });
    await ana.call('/api/voice', { lines: [{ text: 'The soldiers went home.', voice: 'narrator' }, { text: 'The cannon went home.', voice: 'narrator' }] });
    await ben.call('/api/voice', { lines: [{ text: 'The soldiers came for the cannon.', voice: 'narrator' }, { text: 'Did you see them yourself?', voice: 'narrator' }] });
    for (let i = 0; i < 4; i++) await next();
    assert.deepEqual(spoken.map(one => one.text), ['The soldiers went home.', 'The soldiers came for the cannon.', 'The cannon went home.', 'Did you see them yourself?']);
  } finally { await dispose(); }
});

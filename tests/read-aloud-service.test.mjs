// The Host's voice (owner, 2026-09-30, D15; server/voice/service.mjs, docs/READ_ALOUD.md): the line a student pressed first,
// only the game's words, the package's sentences never spoken again, and a server that never waits on a voice.
//
// A fake synthesiser stands in for Kokoro here (it writes a few bytes where the Opus would go, when the test lets it); the real
// one is proved by `npm run test:read-aloud` and measured by scripts/voice-burst.mjs.
//
// Proven by injection on 2026-09-30 (scripts/read-aloud-injections.mjs): `soon` taken before `pressed`, a pressed line left
// in `soon`, the vocabulary check skipped, a class's names not counted as its words, the package's keys not read, the cache
// never pruned, the classroom not asking for the lines it writes, and a student's page able to ask without joining - each
// failed only its own test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Writable } from 'node:stream';
import { createVoice, wordsFrom } from '../server/voice/service.mjs';
import { keyOf } from '../server/voice/text.mjs';

const WORDS = new Set(['a', 'rider', 'has', 'come', 'in', 'the', 'soldiers', 'came', 'for', 'cannon', 'reached', 'gonzales', 'first', 'second', 'third', 'fourth', 'line', 'is', 'here', 'went', 'home']);
function fake() {
  const spoken = [];
  const gates = [];
  const synth = async (job, { wav, opus }) => {
    spoken.push({ role: job.role, text: job.text, priority: job.priority });
    await new Promise(resolve => gates.push(resolve));
    writeFileSync(opus, 'OggS-fake');
  };
  // Let the sentence being spoken finish.
  const next = async () => { const until = Date.now() + 5000; while (!gates.length) { if (Date.now() > until) throw new assert.AssertionError({ message: 'no sentence was begun' }); await new Promise(resolve => setImmediate(resolve)); } gates.shift()(); await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve)); };
  return { synth, spoken, next };
}
function voiceWith(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'voice-test-'));
  const faked = fake();
  const voice = createVoice({ cacheDir: join(dir, 'cache'), synthesiser: faked.synth, vocabulary: WORDS, log: { warn() {} }, ...options(dir) });
  return { voice, dir, ...faked };
}
const options = extra => dir => ({ ...(typeof extra === 'function' ? extra(dir) : extra) });

test('a line a student pressed is spoken before every line the server began on its own', async () => {
  const { voice, spoken, next, dir } = voiceWith(options({}));
  try {
    voice.request([{ text: 'The first line is here.', voice: 'narrator' }], { priority: 'soon' });
    voice.request([{ text: 'The second line is here.', voice: 'narrator' }], { priority: 'soon' });
    voice.request([{ text: 'The third line is here.', voice: 'narrator' }], { priority: 'soon' });
    const asked = voice.request([{ text: 'A rider has come in.', voice: 'rider' }], { priority: 'pressed' });
    assert.equal(asked.parts[0].ready, false);
    assert.equal(asked.parts[0].making, true);
    for (let i = 0; i < 4; i++) await next();
    assert.deepEqual(spoken.map(one => one.text), ['The first line is here.', 'A rider has come in.', 'The second line is here.', 'The third line is here.'],
      'the first was already being spoken; the pressed one goes next, before the rest the server began');
    assert.equal(voice.request([{ text: 'A rider has come in.', voice: 'rider' }]).parts[0].ready, true);
  } finally { voice.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a line waiting in the server\'s own queue moves up when a student presses it', async () => {
  const { voice, spoken, next, dir } = voiceWith(options({}));
  try {
    voice.request([{ text: 'The first line is here.', voice: 'narrator' }], { priority: 'soon' });
    voice.request([{ text: 'The second line is here.', voice: 'narrator' }], { priority: 'soon' });
    voice.request([{ text: 'The third line is here.', voice: 'narrator' }], { priority: 'soon' });
    voice.request([{ text: 'The third line is here.', voice: 'narrator' }], { priority: 'pressed' });
    for (let i = 0; i < 3; i++) await next();
    assert.deepEqual(spoken.map(one => one.text), ['The first line is here.', 'The third line is here.', 'The second line is here.']);
  } finally { voice.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('only the game\'s words are spoken: a word the game never writes is refused, a name in the class is not', async () => {
  const { voice, spoken, next, dir } = voiceWith(options({}));
  try {
    const refused = voice.request([{ text: 'The soldiers came for zorblax.', voice: 'narrator' }]);
    assert.deepEqual(refused.parts.map(part => [part.ready, part.making, part.refused]), [[false, false, true]]);
    const named = voice.request([{ text: 'Ezekiel reached Gonzales.', voice: 'man' }], { names: new Set(['ezekiel']) });
    assert.equal(named.parts[0].making, true);
    const numbered = voice.request([{ text: 'The soldiers came for 2 cannon.', voice: 'narrator' }]);
    assert.equal(numbered.parts[0].making, true, 'a number is anybody\'s word');
    await next(); await next();
    assert.deepEqual(spoken.map(one => one.text), ['Ezekiel reached Gonzales.', 'The soldiers came for 2 cannon.']);
    assert.deepEqual(wordsFrom({ entities: { a: { name: 'Juan Seguín', given: 'Juan' } }, households: { h: { surname: 'Proofwright' } }, map: { sites: { s: { name: 'Béxar' } } } }), new Set(['juan', 'seguín', 'proofwright', 'béxar']));
  } finally { voice.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('the package\'s sentences are ready at once and never spoken on the Host', () => {
  const { voice, spoken, dir } = voiceWith(dir => {
    const pack = join(dir, 'package');
    mkdirSync(pack, { recursive: true });
    const key = keyOf('narrator', 'A rider has come in.');
    writeFileSync(join(pack, `${key}.opus`), 'OggS-package');
    writeFileSync(join(pack, 'manifest.json'), JSON.stringify({ model: 'kokoro-82m-v1.0-fp32', lines: { [key]: { voice: 'narrator' } }, vocabulary: [...WORDS] }));
    return { packageDir: pack };
  });
  try {
    const asked = voice.request([{ text: 'A rider has come in. The soldiers came for the cannon.', voice: 'narrator' }]);
    assert.deepEqual(asked.parts.map(part => part.ready), [true, false], 'the first sentence from the package, the second to be made');
    assert.equal(spoken.length, 1);
    assert.equal(spoken[0].text, 'The soldiers came for the cannon.');
    assert.ok(voice.where(keyOf('narrator', 'A rider has come in.')).includes('package'));
  } finally { voice.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a page may not ask for a voice that is not one, or too much at once', () => {
  const { voice, dir } = voiceWith(options({}));
  try {
    assert.throws(() => voice.request([{ text: 'A rider has come in.', voice: 'robot' }]), error => error.status === 400);
    assert.throws(() => voice.request([]), error => error.status === 400);
    assert.throws(() => voice.request(Array.from({ length: 13 }, () => ({ text: 'A rider has come in.', voice: 'narrator' }))), error => error.status === 400);
    assert.throws(() => voice.request([{ text: 'a '.repeat(2000), voice: 'narrator' }]), error => error.status === 400);
  } finally { voice.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('the server\'s own queue keeps only its newest lines, and the kept sounds are pruned oldest first', async () => {
  const { voice, spoken, next, dir } = voiceWith(options({ soonCap: 2, capBytes: 20 }));
  try {
    for (const word of ['first', 'second', 'third', 'fourth']) voice.request([{ text: `The ${word} line is here.`, voice: 'narrator' }], { priority: 'soon' });
    assert.equal(voice.stats.dropped, 1, 'one line past the cap dropped (the first is being spoken, the second dropped)');
    for (let i = 0; i < 3; i++) await next();
    assert.deepEqual(spoken.map(one => one.text), ['The first line is here.', 'The third line is here.', 'The fourth line is here.']);
    const kept = readdirSync(join(dir, 'cache')).filter(name => name.endsWith('.opus'));
    assert.ok(kept.length <= 2, `the cache holds ${kept.length} sounds of 9 bytes against a cap of 20`);
    assert.ok(existsSync(join(dir, 'cache', `${keyOf('narrator', 'The fourth line is here.')}.opus`)), 'the newest is kept');
  } finally { voice.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a request is answered at once, however long the voice takes', async () => {
  const { voice, dir } = voiceWith(options({}));
  try {
    const started = performance.now();
    for (let i = 0; i < 10; i++) voice.request([{ text: `A rider has come in ${i}.`, voice: 'rider' }]);
    assert.ok(performance.now() - started < 200, 'asking waited on the voice');
    assert.equal(voice.queue().pressed.length, 9);
    assert.ok(voice.queue().busy);
  } finally { voice.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a kept sentence is served as Ogg Opus that never changes, and an unknown one is not', async () => {
  const { voice, next, dir } = voiceWith(options({}));
  try {
    voice.request([{ text: 'The soldiers went home.', voice: 'narrator' }]);
    await next();
    const key = keyOf('narrator', 'The soldiers went home.');
    const response = () => {
      const out = { status: 0, headers: {}, body: '' };
      return Object.assign(new Writable({ write(chunk, _, done) { out.body += chunk; done(); } }), {
        out, writeHead(status, headers) { out.status = status; Object.assign(out.headers, headers); return this; },
      });
    };
    const found = response();
    voice.serve({ method: 'GET' }, found, key);
    await new Promise(resolve => found.on('finish', resolve));
    assert.equal(found.out.status, 200);
    assert.match(found.out.headers['Content-Type'], /^audio\/ogg/);
    assert.match(found.out.headers['Cache-Control'], /immutable/);
    assert.equal(found.out.body, 'OggS-fake');
    const missing = response();
    voice.serve({ method: 'GET' }, missing, '0'.repeat(32));
    assert.equal(missing.out.status, 404);
    const crooked = response();
    voice.serve({ method: 'GET' }, crooked, '../../server/app');
    assert.equal(crooked.out.status, 404);
  } finally { voice.close(); rmSync(dir, { recursive: true, force: true }); }
});

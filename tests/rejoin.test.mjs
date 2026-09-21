// A family key exists so that losing a device is not the same as losing your family, and
// presence exists so that a locked phone is not the same as a student who left. Both came
// out of reading OmniRoute's auth and resilience layers; see docs/REFERENCE_ARCHITECTURES.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';

function classroom() {
  const dir = mkdtempSync(join(tmpdir(), 'texas-rejoin-'));
  const app = createClassroom({ seed: 'rejoin-test', savePath: join(dir, 'save.json'), tickMs: 10 });
  return { app, dispose: async () => { await app.close(); rmSync(dir, { recursive: true, force: true }); } };
}
const caller = port => async (path, data, cookie) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: data ? 'POST' : 'GET',
    headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) },
    ...(data && { body: JSON.stringify(data) }),
  });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
};
// A minimal event stream: this suite only ever needs to know that one is open.
function openStream(port, cookie) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${port}/api/events`, { headers: { Cookie: cookie }, agent: false }, response => {
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`stream returned ${response.statusCode}`)); return; }
      response.resume();
      resolve({ close: () => new Promise(done => { request.on('close', () => done()); request.destroy(); }) });
    });
    request.on('error', reject);
  });
}
async function fiveFamilies(call, app) {
  return Promise.all(Array.from({ length: 5 }, (_, index) => call('/api/join', { name: `Family ${index}`, code: app.state.sessionCode })));
}

test('a family key brings the same family back on a device that has never seen this class', async () => {
  const { app, dispose } = classroom();
  const call = caller(await app.listen());
  try {
    const families = await fiveFamilies(call, app);
    const mine = families[2];
    const key = mine.body.familyKey;
    assert.match(key, /^[0-9A-HJKMNP-TV-Z]{8}$/, 'the key is eight readable symbols');
    // A different device: no cookie at all, and no class code either.
    const recovered = await call('/api/rejoin', { key });
    assert.equal(recovered.status, 200);
    assert.equal(recovered.body.world.householdId, mine.body.world.householdId, 'the same family, not a new one');
    assert.deepEqual(
      recovered.body.world.entities.map(entity => entity.id).sort(),
      mine.body.world.entities.map(entity => entity.id).sort(),
      'the same people, with the same identities',
    );
    assert.equal(Object.keys(app.state.clients).length, 5, 'recovering a family created no sixth household');
    assert.equal(recovered.body.familyKey, key, 'and the key still names this family');
    // The device that was replaced is signed out, so one household is one player.
    assert.equal((await call('/api/state', null, mine.cookie)).status, 401);
    assert.equal((await call('/api/state', null, recovered.cookie)).body.world.householdId, mine.body.world.householdId);
  } finally { await dispose(); }
});

test('a key opens one family and no other, and a mistyped key opens nothing', async () => {
  const { app, dispose } = classroom();
  const call = caller(await app.listen());
  try {
    const families = await fiveFamilies(call, app);
    const keys = families.map(family => family.body.familyKey);
    assert.equal(new Set(keys).size, 5, 'every family has its own key');
    // Someone else's key is someone else's family, never yours and never a refusal to
    // explain itself.
    const neighbour = await call('/api/rejoin', { key: keys[1] });
    assert.equal(neighbour.body.world.householdId, families[1].body.world.householdId);
    assert.notEqual(neighbour.body.world.householdId, families[0].body.world.householdId);
    // One symbol wrong is not a near miss; it is simply not a key.
    const wrong = keys[3].slice(0, 7) + (keys[3][7] === 'Z' ? 'Y' : 'Z');
    const typo = await call('/api/rejoin', { key: wrong });
    assert.ok(typo.status === 403 || typo.status === 200 && typo.body.world.householdId !== families[3].body.world.householdId);
    if (typo.status === 403) assert.match(typo.body.error, /does not match/);
    assert.equal((await call('/api/rejoin', { key: 'SHORT' })).status, 403);
    assert.equal((await call('/api/rejoin', { key: '' })).status, 403);
  } finally { await dispose(); }
});

test('the key is written for a person to type: spacing and the letters that look like digits', async () => {
  const { app, dispose } = classroom();
  const call = caller(await app.listen());
  try {
    const families = await fiveFamilies(call, app);
    const key = families[0].body.familyKey;
    const householdId = families[0].body.world.householdId;
    // The alphabet has no I, L, O or U, so those can only be transcription slips and are
    // read as the digits they were mistaken for.
    const asTyped = `${key.slice(0, 4)} ${key.slice(4)}`.toLowerCase().replaceAll('0', 'o').replaceAll('1', 'l');
    const recovered = await call('/api/rejoin', { key: asTyped });
    assert.equal(recovered.status, 200);
    assert.equal(recovered.body.world.householdId, householdId, 'lower case, a space and O-for-zero still find the family');
  } finally { await dispose(); }
});

test('a family that is being played right now cannot be taken over by its key', async () => {
  const { app, dispose } = classroom();
  const port = await app.listen();
  const call = caller(port);
  let stream = null;
  try {
    const families = await fiveFamilies(call, app);
    const mine = families[0];
    stream = await openStream(port, mine.cookie);
    await delay(30);
    // This is the key read off a neighbour's screen. The neighbour is still playing.
    const stolen = await call('/api/rejoin', { key: mine.body.familyKey });
    assert.equal(stolen.status, 409);
    assert.match(stolen.body.error, /already playing/);
    assert.equal((await call('/api/state', null, mine.cookie)).status, 200, 'and the family that was playing is untouched');
    // Once that device is gone, the same key is the way back in.
    await stream.close(); stream = null;
    await delay(30);
    assert.equal((await call('/api/rejoin', { key: mine.body.familyKey })).status, 200);
  } finally { if (stream) await stream.close(); await dispose(); }
});

test('a family key works after the class has started, where joining does not', async () => {
  const { app, dispose } = classroom();
  const call = caller(await app.listen());
  try {
    const host = await call('/api/host', { key: app.state.hostKey });
    const families = await fiveFamilies(call, app);
    await call('/api/command', { id: 'host-start-rejoin', action: 'start' }, host.cookie);
    await delay(40);
    assert.equal(app.state.world.status, 'running');
    // A new family cannot appear mid-class...
    assert.equal((await call('/api/join', { name: 'Latecomer', code: app.state.sessionCode })).status, 409);
    // ...but an existing one is not a new one, and being locked out mid-class is exactly
    // when getting back in matters.
    const back = await call('/api/rejoin', { key: families[4].body.familyKey });
    assert.equal(back.status, 200);
    assert.equal(back.body.world.householdId, families[4].body.world.householdId);
    assert.ok(back.body.world.tick > 0, 'and the family rejoins the class already in progress');
  } finally { await dispose(); }
});

test('no household is ever told another household\'s key, and the Host is told none of them', async () => {
  const { app, dispose } = classroom();
  const call = caller(await app.listen());
  try {
    const host = await call('/api/host', { key: app.state.hostKey });
    const families = await fiveFamilies(call, app);
    const keys = families.map(family => family.body.familyKey);
    for (let index = 0; index < families.length; index++) {
      const wire = JSON.stringify((await call('/api/state', null, families[index].cookie)).body);
      for (let other = 0; other < keys.length; other++) {
        if (other === index) continue;
        assert.ok(!wire.includes(keys[other]), `household ${index} must not be told household ${other}'s key`);
      }
    }
    // A Host screen is sometimes a projector, so it carries no family's key at all.
    const hostWire = JSON.stringify((await call('/api/state', null, host.cookie)).body);
    for (const key of keys) assert.ok(!hostWire.includes(key), 'the Host page carries no family keys');
    assert.ok(!hostWire.includes(app.state.hostKey), 'and still no host key');
  } finally { await dispose(); }
});

test('guessing keys becomes expensive, and a key from an archived class opens nothing', async () => {
  const { app, dispose } = classroom();
  const call = caller(await app.listen());
  try {
    const host = await call('/api/host', { key: app.state.hostKey });
    const families = await fiveFamilies(call, app);
    const key = families[0].body.familyKey;
    for (let attempt = 0; attempt < 5; attempt++) {
      assert.equal((await call('/api/rejoin', { key: '22222222' })).status, 403, `wrong key ${attempt + 1} is refused`);
    }
    const throttled = await call('/api/rejoin', { key: '33333333' });
    assert.equal(throttled.status, 429);
    assert.match(throttled.body.error, /Too many tries/);
    // A real key is throttled too: the cooldown is on the guessing, not on the guess.
    assert.equal((await call('/api/rejoin', { key })).status, 429);

    // New Class rotates the session, and the key was derived from it.
    await call('/api/command', { id: 'host-new-class-rejoin', action: 'new-class' }, host.cookie);
    assert.equal(Object.keys(app.state.clients).length, 0);
    const stale = await call('/api/rejoin', { key });
    assert.ok(stale.status === 403 || stale.status === 429, 'a key from the archived class opens nothing');
    if (stale.status === 403) assert.match(stale.body.error, /does not match/);
  } finally { await dispose(); }
});

test('the Host is told who is here and who is merely away', async () => {
  const { app, dispose } = classroom();
  const port = await app.listen();
  const call = caller(port);
  const streams = [];
  try {
    const host = await call('/api/host', { key: app.state.hostKey });
    const families = await fiveFamilies(call, app);
    // The counts; the households beside them are each family's own word (tests/absence.test.mjs).
    const counts = ({ here, away, joined }) => ({ here, away, joined });
    assert.deepEqual(counts((await call('/api/state', null, host.cookie)).body.presence), { here: 0, away: 0, joined: 5 });
    for (const family of families.slice(0, 3)) streams.push(await openStream(port, family.cookie));
    await delay(40);
    assert.deepEqual(counts((await call('/api/state', null, host.cookie)).body.presence), { here: 3, away: 0, joined: 5 });
    // A phone that locks its screen closes the stream within seconds. That is not a
    // student who left, and the count the teacher reads must not say it is.
    await streams.pop().close();
    await delay(40);
    const after = (await call('/api/state', null, host.cookie)).body.presence;
    assert.deepEqual(counts(after), { here: 2, away: 1, joined: 5 });
    assert.deepEqual(after.households, { 'hh-1': 'here', 'hh-2': 'here', 'hh-3': 'away', 'hh-4': 'gone', 'hh-5': 'gone' }, 'each family\'s own word');
    assert.equal((await call('/api/state', null, host.cookie)).body.connected, 2, 'the older count still means streams open now');
    // Presence is about this moment and is never written into the class.
    assert.ok(!JSON.stringify(app.state).includes('presence'), 'presence is not saved state');
    // A student is told nothing about it.
    assert.equal((await call('/api/state', null, families[0].cookie)).body.presence, undefined);
  } finally { for (const stream of streams) await stream.close(); await dispose(); }
});

test('a teacher can look up one family key, and a student can look up none', async () => {
  const { app, dispose } = classroom();
  const call = caller(await app.listen());
  try {
    const host = await call('/api/host', { key: app.state.hostKey });
    const families = await fiveFamilies(call, app);
    // A student may not read the roll, and may not read anybody's key including their own
    // by this route: their key arrives in their own projection and nowhere else.
    assert.equal((await call('/api/families', null, families[0].cookie)).status, 403);
    assert.equal((await call('/api/family-key?household=hh-1', null, families[0].cookie)).status, 403);
    assert.equal((await call('/api/family-key?household=hh-1')).status, 401, 'and a stranger is not even asked');

    // The roll is the list a teacher reads to find the student in front of them. It is
    // safe to leave on screen, so it carries no keys at all.
    const roll = await call('/api/families', null, host.cookie);
    assert.equal(roll.status, 200);
    assert.equal(roll.body.families.length, 5);
    assert.deepEqual(roll.body.families.map(family => family.householdId), ['hh-1', 'hh-2', 'hh-3', 'hh-4', 'hh-5']);
    assert.ok(roll.body.families.every(family => family.name), 'each family is named by the name its student chose');
    const rollWire = JSON.stringify(roll.body);
    for (const family of families) assert.ok(!rollWire.includes(family.body.familyKey), 'the roll reveals no key');

    // One key, asked for by name. This is the only way a student who lost both their
    // browser and their key gets back.
    const looked = await call('/api/family-key?household=hh-4', null, host.cookie);
    assert.equal(looked.status, 200);
    assert.equal(looked.body.familyKey, families[3].body.familyKey, 'and it is that family\'s real key');
    assert.equal(looked.body.name, 'Family 3');
    for (let index = 0; index < families.length; index++) {
      if (index === 3) continue;
      assert.ok(!JSON.stringify(looked.body).includes(families[index].body.familyKey), 'one request reveals exactly one key');
    }
    assert.equal((await call('/api/family-key?household=hh-99', null, host.cookie)).status, 404);
    assert.equal((await call('/api/family-key', null, host.cookie)).status, 404);

    // And the key a teacher reads out actually works.
    const recovered = await call('/api/rejoin', { key: looked.body.familyKey });
    assert.equal(recovered.status, 200);
    assert.equal(recovered.body.world.householdId, 'hh-4');
  } finally { await dispose(); }
});

// A class of real students ran on 2026-09-21 and one of them was disconnected and could not get back in, because
// getting back in wanted a family key off a screen they no longer had. A school Chromebook is often a guest session
// that keeps no cookie, and a twelve-year-old has no id, no key and no way to know either. So they read their own name
// off a list of the families whose student is away, and tap it (`FIC-GONZ-186`).
test('a student who knows nothing but the class code and their own name comes back to their family', async () => {
  const { app, dispose } = classroom();
  const call = caller(await app.listen());
  try {
    const code = app.state.sessionCode;
    const families = await fiveFamilies(call, app);
    const mine = families[2], myHousehold = mine.body.world.householdId;
    assert.ok(myHousehold, 'the join did not say which family it was');

    // Everybody is away at this moment: nobody has a stream open, which is what a class looks like a second after Start
    // when a page is reloading. The list names each family by the name its student typed.
    const away = await call('/api/away', { code });
    assert.equal(away.status, 200);
    assert.equal(away.body.families.length, 5, JSON.stringify(away.body));
    const me = away.body.families.find(entry => entry.householdId === myHousehold);
    assert.ok(me, 'the away list does not have my family in it');
    assert.equal(me.name, 'Family 2', 'the list names the student rather than the family id');
    assert.ok(me.family && typeof me.family === 'string', 'the list does not say which family that is');
    assert.ok(!JSON.stringify(away.body).includes('familyKey'), 'the away list gave away a family key');

    // The wrong class code is refused in the same words a join is, and counts against the same cooldown.
    const wrongCode = await call('/api/away', { code: 'NOPE' });
    assert.equal(wrongCode.status, 403);
    assert.match(wrongCode.body.error, /class code/);

    // A device that has never seen this class: no cookie, no key, no id. It taps the name.
    const back = await call('/api/claim', { code, householdId: myHousehold });
    assert.equal(back.status, 200, JSON.stringify(back.body));
    assert.ok(back.cookie, 'coming back set no cookie, so the next request is a stranger again');
    assert.equal(back.body.world.householdId, myHousehold, 'the student came back to somebody else\u2019s family');
    // And the old device is signed out: one credential per family, as the key path has always done.
    const old = await call('/api/state', null, mine.cookie);
    assert.equal(old.status, 401, 'the family was left signed in on the device that lost it');
    const now = await call('/api/state', null, back.cookie);
    assert.equal(now.status, 200);
    assert.equal(now.body.world.householdId, myHousehold);

    // The teacher is told, on the class's own public record: this is the one thing the design trades away, and it is
    // never quiet.
    const said = app.state.world.events.filter(event => event.visibility === 'public' && /came back to the class/.test(event.text || ''));
    assert.equal(said.length, 1, JSON.stringify(said));
    assert.equal(said[0].claimId, 'FIC-GONZ-186');
    assert.match(said[0].text, /Family 2/);
  } finally { await dispose(); }
});

test('a family somebody is playing is not on the away list and cannot be taken from them', async () => {
  const { app, dispose } = classroom();
  const port = await app.listen();
  const call = caller(port);
  try {
    const code = app.state.sessionCode;
    const families = await fiveFamilies(call, app);
    const playing = families[1], playingId = playing.body.world.householdId;
    const stream = await openStream(port, playing.cookie);
    try {
      await delay(50);
      const away = await call('/api/away', { code });
      assert.ok(!away.body.families.some(entry => entry.householdId === playingId), 'a family being played was offered to anybody who asked');
      // And asking for it anyway is refused in the words the key path uses.
      const taken = await call('/api/claim', { code, householdId: playingId });
      assert.equal(taken.status, 409, JSON.stringify(taken.body));
      assert.match(taken.body.error, /already playing that family/);
      // The student holding it is untouched.
      const still = await call('/api/state', null, playing.cookie);
      assert.equal(still.status, 200, 'the student playing was signed out by somebody else asking');
    } finally { await stream.close(); }
  } finally { await dispose(); }
});

test('coming back wants the class code, and working through codes shuts the door', async () => {
  // Its own classroom, because the cooldown is per address and this test deliberately trips it.
  const { app, dispose } = classroom();
  const call = caller(await app.listen());
  try {
    const families = await fiveFamilies(call, app);
    const wanted = families[0].body.world.householdId;
    // Claiming wants the code as much as the list does: knowing a household id is not knowing the class.
    const noCode = await call('/api/claim', { code: 'NOPE', householdId: wanted });
    assert.equal(noCode.status, 403, JSON.stringify(noCode.body));
    assert.match(noCode.body.error, /class code/);
    // And a run of wrong codes costs what a run of guessed keys costs: the door shuts, so the class's names cannot be
    // scraped by working through codes.
    let shut = null;
    for (let tries = 0; tries < 6 && !shut; tries++) {
      const again = await call('/api/away', { code: 'NOPE' });
      if (again.status === 429) shut = again;
    }
    assert.ok(shut, 'a wrong class code can be tried for ever');
    assert.match(shut.body.error, /Too many tries/);
    // Shut for everything that door guards, the right code included, until it reopens.
    const rightCode = await call('/api/away', { code: app.state.sessionCode });
    assert.equal(rightCode.status, 429, 'the cooldown let the next try through');
  } finally { await dispose(); }
});

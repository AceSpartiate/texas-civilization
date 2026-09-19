// Solo Mode: the owner's playtest, one click from the launcher (docs/DEPLOYMENT.md).
// What it has to be is a class of one that is already joined and already running, that
// nobody else can reach, and that can never be the teacher's real class.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { familyMaking, rollRefusal } from '../sim/family.mjs';
import { choicesFor, isParent, LOOK_PARTS } from '../sim/appearance.mjs';
import { stepWorld } from '../sim/world.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { resolveDataDir, resolveSavePath, soloPaths, SOLO_PORT } from '../server/deployment.mjs';

function classroom(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'texas-solo-'));
  const app = createClassroom({ seed: 'solo-test', playerCount: 5, savePath: join(dir, 'save.json'), tickMs: 10000, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { neighbours: true }), ...options });
  return { app, dispose: async () => { await app.close(); rmSync(dir, { recursive: true, force: true }); } };
}
const caller = port => async (path, data, cookie) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: data ? 'POST' : 'GET', redirect: 'manual',
    headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) },
    ...(data && { body: JSON.stringify(data) }),
  });
  const text = await response.text();
  let body = null; try { body = JSON.parse(text); } catch { /* a redirect has no body */ }
  return { status: response.status, body, location: response.headers.get('location'), cookie: response.headers.get('set-cookie')?.split(';')[0] };
};

test('one solo request gives a joined, running family among automatic neighbours, with its own die still to roll', async () => {
  const { app, dispose } = classroom({ solo: true });
  const call = caller(await app.listen());
  try {
    const game = await call('/api/solo', { key: app.state.hostKey });
    assert.equal(game.status, 200, JSON.stringify(game.body));
    const ticket = new URL(game.body.playUrl).searchParams.get('ticket');
    const enter = await call(`/solo/enter?ticket=${ticket}`);
    assert.equal(enter.status, 303);
    assert.equal(enter.location, '/', 'the player lands on the ordinary page');
    assert.ok(enter.cookie?.startsWith(`tr_student_${app.state.sessionId}=`), 'and holds a student cookie for this class');
    const mine = await call('/api/state', null, enter.cookie);
    assert.equal(mine.status, 200);
    assert.equal(mine.body.world.householdId, 'hh-1');
    assert.equal(mine.body.world.status, 'running', 'no Start press was needed');
    const state = app.state;
    assert.equal(Object.keys(state.clients).length, 1, 'exactly one player joined');
    // The die is the player's (owner, 2026-09-17: "when did i roll for family size?"), and may be rolled although the class runs.
    assert.equal(state.world.households['hh-1'].roll, undefined, 'the solo family was rolled for the player');
    assert.equal(rollRefusal(state.world, state.world.households['hh-1']), null, 'the player may not roll their own family');

    assert.equal(state.world.households['hh-1'].played, true, 'and the neighbour director leaves it alone');
    const others = Object.values(state.world.households).filter(household => household.id !== 'hh-1');
    assert.equal(others.length, 4, 'the other families of the class still exist');
    assert.ok(others.every(household => !household.played), 'as automatic neighbours');
  } finally { await dispose(); }
});

// Owner, 2026-09-18, by multiple choice: a Solo game holds its clock until the family is made. Without it the world wrote the
// family's arrival on its second tick, which closes the die, and a page slower than that to open was never offered it.
test('a solo game holds its clock while the family is being made, and goes on the moment it is made', async () => {
  const { app, dispose } = classroom({ solo: true, tickMs: 20 });
  const call = caller(await app.listen());
  const wait = () => new Promise(resolve => setTimeout(resolve, 300));
  try {
    const game = await call('/api/solo', { key: app.state.hostKey });
    const cookie = (await call(`/solo/enter?ticket=${new URL(game.body.playUrl).searchParams.get('ticket')}`)).cookie;
    const command = async (id, input) => assert.equal((await call('/api/command', { id, ...input }, cookie)).status, 200, id);
    await wait();
    assert.equal(app.state.world.status, 'running');
    assert.equal(app.state.world.tick, 0, 'the world went on while the page was opening');
    assert.equal(rollRefusal(app.state.world, app.state.world.households['hh-1']), null, 'the die closed before the player came to it');
    await command('hold-roll', { action: 'roll-family' });
    await wait();
    assert.equal(app.state.world.tick, 0, 'the world went on before the family had its last name');
    await command('hold-name', { action: 'rename', surname: 'Navarro' });
    await wait();
    assert.equal(app.state.world.tick, 0, 'the world went on before the parents\' looks were chosen');
    const world = app.state.world;
    const parents = world.households['hh-1'].members.map(id => world.entities[id]).filter(isParent);
    for (const parent of parents) {
      const choices = choicesFor(parent);
      await command(`hold-looks-${parent.id}`, { action: 'set-appearance', entityId: parent.id, ...Object.fromEntries(LOOK_PARTS.map(part => [part, choices[part][0]])) });
    }
    await wait();
    assert.ok(app.state.world.tick > 0, 'the world did not go on once the family was made');
  } finally { await dispose(); }
});

test('a family that can no longer roll is not held, or its world would never move', () => {
  const world = createGonzalesWorld('solo-hold', 5, { neighbours: true });
  world.status = 'running';
  world.households['hh-1'].played = true;
  assert.equal(familyMaking(world, world.households['hh-1']), true, 'a new solo family is not being made');
  // A game kept from before the hold, which ran past the die unrolled.
  stepWorld(world); stepWorld(world);
  assert.notEqual(rollRefusal(world, world.households['hh-1']), null, 'the arrival no longer closes the die');
  assert.equal(familyMaking(world, world.households['hh-1']), false, 'a family that can never be made holds the world');
});

test('a solo link opens once, and a new solo game signs the last one out', async () => {
  const { app, dispose } = classroom({ solo: true });
  const call = caller(await app.listen());
  try {
    const first = await call('/api/solo', { key: app.state.hostKey });
    const firstTicket = new URL(first.body.playUrl).searchParams.get('ticket');
    const entered = await call(`/solo/enter?ticket=${firstTicket}`);
    assert.equal(entered.status, 303);
    const again = await call(`/solo/enter?ticket=${firstTicket}`);
    assert.equal(again.status, 403, 'a used link is refused');
    assert.equal(again.cookie, undefined, 'and hands out nothing');
    const firstSession = app.state.sessionId, firstSeed = app.state.world.seed;
    const second = await call('/api/solo', { key: app.state.hostKey });
    assert.equal(second.status, 200);
    assert.notEqual(app.state.sessionId, firstSession, 'a new game is a new session');
    assert.notEqual(app.state.world.seed, firstSeed, 'and a new world');
    assert.equal((await call('/api/state', null, entered.cookie)).status, 401, 'the last game\'s player is no longer joined');
    assert.equal(Object.keys(app.state.clients).length, 1);
  } finally { await dispose(); }
});

test('a solo game needs the Host key, and an ordinary class has no solo door at all', async () => {
  const soloRoom = classroom({ solo: true });
  const plain = classroom();
  try {
    const soloCall = caller(await soloRoom.app.listen());
    const refused = await soloCall('/api/solo', { key: 'not-the-key' });
    assert.equal(refused.status, 403);
    assert.equal(soloRoom.app.state.world.status, 'lobby', 'a refused request changes nothing');

    const plainCall = caller(await plain.app.listen());
    const before = plain.app.state;
    const asked = await plainCall('/api/solo', { key: before.hostKey });
    assert.notEqual(asked.status, 200, 'a real class never deals a solo game, even for its own Host key');
    assert.notEqual((await plainCall('/solo/enter?ticket=anything')).status, 303);
    const after = plain.app.state;
    assert.equal(after.sessionId, before.sessionId);
    assert.equal(after.world.status, 'lobby');
    assert.deepEqual(after.clients, {});
    assert.equal((await plainCall('/health')).body.solo, false);
    assert.equal((await soloCall('/health')).body.solo, true);
  } finally { await soloRoom.dispose(); await plain.dispose(); }
});

test('a solo server listens on this computer only, whatever it is asked to bind', async () => {
  const { app, dispose } = classroom({ solo: true });
  try {
    await app.listen(0, '0.0.0.0');
    assert.equal(app.server.address().address, '127.0.0.1');
  } finally { await dispose(); }
});

test('solo keeps its own folder, save and port, and ignores the real class overrides', () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-solo-paths-'));
  try {
    const env = { TEXAS_DATA_DIR: join(dir, 'data'), SAVE_PATH: join(dir, 'real-class.json'), PORT: '4000' };
    const real = resolveDataDir({ env, root: dir }).dir;
    const solo = soloPaths({ env, root: dir });
    assert.equal(solo.dir, join(real, 'solo'));
    assert.equal(solo.savePath, join(real, 'solo', 'classroom.json'));
    assert.notEqual(solo.savePath, resolveSavePath(real, env), 'never the teacher\'s save, even with SAVE_PATH set');
    assert.notEqual(solo.savePath, resolveSavePath(real, {}), 'nor the default one');
    assert.equal(solo.port, SOLO_PORT, 'PORT belongs to the real class');
    assert.notEqual(SOLO_PORT, 1835);
    assert.equal(soloPaths({ env: { ...env, SOLO_PORT: '4100' }, root: dir }).port, 4100);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// Saved games (owner, 2026-09-17: "When pressing Solo Game, a popup should ask if the player wants to start a new game, or
// continue an old one. they can't continue a multiplayer game from there"; by multiple choice, a list of saved games).
test('every solo game is kept: a new game keeps the last, the list names each, and continuing opens it where it was', async () => {
  const { app, dispose } = classroom({ solo: true });
  const call = caller(await app.listen());
  const key = app.state.hostKey;
  try {
    assert.deepEqual((await call('/api/solo/games', { key })).body.games, [], 'a fresh solo server lists a game');
    const first = await call('/api/solo', { key });
    const firstCookie = (await call(`/solo/enter?ticket=${new URL(first.body.playUrl).searchParams.get('ticket')}`)).cookie;
    // The player rolls their own family first (owner, 2026-09-17), and then names it.
    assert.equal((await call('/api/command', { id: 'cmd-roll-first', action: 'roll-family' }, firstCookie)).status, 200);
    await call('/api/command', { id: 'cmd-name-first', action: 'rename', surname: 'Navarro' }, firstCookie);
    const firstId = app.state.sessionId, firstSeed = app.state.world.seed;
    const listed = (await call('/api/solo/games', { key })).body.games;
    assert.equal(listed.length, 1, 'the game being played is not in the list');
    assert.equal(listed[0].id, firstId);
    assert.equal(listed[0].family, 'The Navarro family');
    assert.match(listed[0].date, /^[A-Z][a-z]+ \d{1,2}, 18\d\d$/);
    assert.equal(listed[0].period, 1);

    await call('/api/solo', { key });
    const secondId = app.state.sessionId;
    const both = (await call('/api/solo/games', { key })).body.games.map(game => game.id);
    assert.deepEqual(new Set(both), new Set([firstId, secondId]), 'a new game threw the last one away');

    const back = await call('/api/solo', { key, continue: firstId });
    assert.equal(back.status, 200, JSON.stringify(back.body));
    assert.equal(app.state.sessionId, firstId);
    assert.equal(app.state.world.seed, firstSeed, 'continuing dealt a different world');
    assert.equal(app.state.world.households['hh-1'].surname, 'Navarro', 'continuing lost what was done in the game');
    const cookie = (await call(`/solo/enter?ticket=${new URL(back.body.playUrl).searchParams.get('ticket')}`)).cookie;
    const mine = await call('/api/state', null, cookie);
    assert.equal(mine.status, 200);
    assert.equal(mine.body.world.householdId, 'hh-1', 'the player did not come back to their own family');
    assert.equal((await call('/api/state', null, firstCookie)).status, 401, 'an old link to the game still opens it');
    assert.ok((await call('/api/solo/games', { key })).body.games.some(game => game.id === secondId), 'continuing an old game threw away the newer one');
    // Continuing the game already being played hands out a new way in and changes nothing else.
    const revisionWorld = JSON.stringify(app.state.world);
    const again = await call('/api/solo', { key, continue: firstId });
    assert.equal(again.status, 200);
    assert.equal(JSON.stringify(app.state.world), revisionWorld);
    const againCookie = (await call(`/solo/enter?ticket=${new URL(again.body.playUrl).searchParams.get('ticket')}`)).cookie;
    assert.equal((await call('/api/state', null, againCookie)).status, 200, 'continuing the game being played gave no way back into it');
  } finally { await dispose(); }
});

test('only solo games can be continued: a bad id, a missing game and the wrong key are refused, and a class has no list', async () => {
  const soloRoom = classroom({ solo: true });
  const plain = classroom();
  try {
    const call = caller(await soloRoom.app.listen());
    const key = soloRoom.app.state.hostKey;
    await call('/api/solo', { key });
    const before = soloRoom.app.state.sessionId;
    for (const id of ['../save', 'nothere-000', '']) {
      const refused = await call('/api/solo', { key, continue: id });
      assert.notEqual(refused.status, 200, `continuing "${id}" was not refused`);
      assert.match(refused.body.error, id === 'nothere-000' ? /not there/ : /not a saved solo game/);
    }
    assert.equal(soloRoom.app.state.sessionId, before, 'a refused continue changed the game');
    assert.equal((await call('/api/solo/games', { key: 'not-the-key' })).status, 403);
    const plainCall = caller(await plain.app.listen());
    assert.notEqual((await plainCall('/api/solo/games', { key: plain.app.state.hostKey })).status, 200, 'a class lists games');
    assert.notEqual((await plainCall('/api/solo', { key: plain.app.state.hostKey, continue: before })).status, 200, 'a class continues a solo game');
  } finally { await soloRoom.dispose(); await plain.dispose(); }
});

// Solo Mode: the owner's playtest, one click from the launcher (docs/DEPLOYMENT.md).
// What it has to be is a class of one that is already joined and already running, that
// nobody else can reach, and that can never be the teacher's real class.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import http from 'node:http';
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

test('one solo request gives a joined family in its own lobby among automatic neighbours, with its own die still to roll', async () => {
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
    // In the lobby, not running (owner, 2026-09-21): the wagon and the stock choice are sent only in the lobby, so a
    // solo game that opened `running` never asked either question and always held a labor of land.
    assert.equal(mine.body.world.status, 'lobby', 'a solo game opened running, where it is never asked what it packs');
    assert.ok(mine.body.world.wagon, 'the solo player is never asked what the family packs');
    assert.ok(mine.body.world.land?.stockChoice, 'the solo player is never asked whether the family drives stock in');
    assert.equal(mine.body.solo, true, 'the page cannot tell it is a solo game, so it cannot know its Done packing is the Start');
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
    assert.equal(app.state.world.status, 'lobby');
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
    // The family is made, and the world still waits - it is in its own lobby now, where the wagon and the stock choice
    // are asked (owner, 2026-09-21). The player's own Done packing is what starts it.
    assert.equal(app.state.world.tick, 0, 'the world went on before the player had packed the wagon');
    assert.equal(familyMaking(app.state.world, app.state.world.households['hh-1']), false, 'the family is not made, so this proves nothing about the lobby');
    await command('hold-begin-solo', { action: 'begin-solo' });
    assert.equal(app.state.world.status, 'running');
    await wait();
    assert.ok(app.state.world.tick > 0, 'the world did not go on once the player had packed the wagon');
  } finally { await dispose(); }
});

// Owner, 2026-09-21, by multiple choice: Play Solo asks what a class asks. "There is no teacher, so the player's own
// Done packing is the Start" is the whole of the mechanism, and it is solo's alone.
test('only a solo player may begin their own game, only once, and never a class', async () => {
  const soloRoom = classroom({ solo: true });
  const plain = classroom();
  try {
    const call = caller(await soloRoom.app.listen());
    const game = await call('/api/solo', { key: soloRoom.app.state.hostKey });
    const cookie = (await call(`/solo/enter?ticket=${new URL(game.body.playUrl).searchParams.get('ticket')}`)).cookie;
    assert.equal(soloRoom.app.state.world.status, 'lobby');
    const first = await call('/api/command', { id: 'begin-once', action: 'begin-solo' }, cookie);
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(soloRoom.app.state.world.status, 'running');
    // Pressed again - a second click, or a page that sends it twice - says so and changes nothing.
    const again = await call('/api/command', { id: 'begin-twice', action: 'begin-solo' }, cookie);
    assert.notEqual(again.status, 200, 'a game already begun was begun again');
    assert.match(again.body.error, /already begun/);

    // A class has a teacher, and this is not a second way to start one.
    const plainCall = caller(await plain.app.listen());
    const joined = await plainCall('/api/join', { name: 'Student', code: plain.app.state.sessionCode });
    assert.equal(joined.status, 200);
    const student = joined.cookie;
    const refused = await plainCall('/api/command', { id: 'begin-class', action: 'begin-solo' }, student);
    assert.notEqual(refused.status, 200, 'a student started a class the teacher had not started');
    assert.match(refused.body.error, /teacher/);
    assert.equal(plain.app.state.world.status, 'lobby', 'a refused begin started the class anyway');
  } finally { await soloRoom.dispose(); await plain.dispose(); }
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

// Deleting one (owner, 2026-09-21: "I need a way to delete solo games"; by multiple choice, a trash can beside each save
// in the Play Solo menu, asked about once, and the game *set aside* rather than destroyed).
test('a deleted solo game leaves the list and is kept on the disk, and the game being held goes too', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-solo-delete-'));
  const app = createClassroom({
    seed: 'solo-delete', playerCount: 5, savePath: join(dir, 'save.json'), tickMs: 10000, solo: true,
    worldFactory: (seed, count) => createGonzalesWorld(seed, count, { neighbours: true }),
  });
  const call = caller(await app.listen());
  const key = app.state.hostKey;
  const games = join(dir, 'games');
  try {
    await call('/api/solo', { key });
    const first = app.state.sessionId;
    await call('/api/solo', { key });
    const second = app.state.sessionId;
    assert.deepEqual(new Set((await call('/api/solo/games', { key })).body.games.map(game => game.id)), new Set([first, second]));

    // A game with a file of its own: the file moves, it leaves the list, and nothing about the game being held changes.
    const gone = await call('/api/solo/games/delete', { key, id: first });
    assert.equal(gone.status, 200, JSON.stringify(gone.body));
    assert.deepEqual(gone.body, { deleted: first, already: false });
    assert.equal(app.state.sessionId, second, 'deleting another game changed the game being held');
    assert.deepEqual((await call('/api/solo/games', { key })).body.games.map(game => game.id), [second]);
    assert.equal(existsSync(join(games, `${first}.json`)), false, 'the deleted game is still where the list reads from');
    assert.equal(existsSync(join(games, 'deleted', `${first}.json`)), true, 'the deleted game was destroyed rather than set aside');
    // Asked twice - two clicks on the same trash can - says the same thing and breaks nothing.
    assert.deepEqual((await call('/api/solo/games/delete', { key, id: first })).body, { deleted: first, already: true });

    // The game being *held* has no file of its own yet. It still leaves the list, and the server goes on holding it:
    // the owner's choice was that deleting is not a special case for the live game (2026-09-21).
    const held = await call('/api/solo/games/delete', { key, id: second });
    assert.equal(held.status, 200, JSON.stringify(held.body));
    assert.deepEqual((await call('/api/solo/games', { key })).body.games, [], 'the game being held stayed in the list after it was deleted');
    assert.equal(app.state.sessionId, second, 'deleting the live game interrupted the server that was holding it');
    assert.equal(existsSync(join(games, 'deleted', `${second}.json`)), true, 'the live game was not kept when it was deleted');
    // And it cannot be continued back into the list by accident.
    assert.deepEqual((await call('/api/solo/games', { key })).body.games, []);
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('deleting is refused without the Host key, for anything that is not an id, and on a class', async () => {
  const soloRoom = classroom({ solo: true });
  const plain = classroom();
  try {
    const call = caller(await soloRoom.app.listen());
    const key = soloRoom.app.state.hostKey;
    await call('/api/solo', { key });
    const live = soloRoom.app.state.sessionId;
    assert.equal((await call('/api/solo/games/delete', { key: 'not-the-key', id: live })).status, 403, 'anybody on this computer may delete a game');
    // Nothing a caller sends is allowed to become part of a path.
    for (const id of ['../save', 'games/../../save', '', 'a', null, 42]) {
      const refused = await call('/api/solo/games/delete', { key, id });
      assert.notEqual(refused.status, 200, `deleting "${id}" was not refused`);
      assert.match(refused.body.error, /not a saved solo game/);
    }
    assert.equal((await call('/api/solo/games/delete', { key, id: 'nothere-000' })).body.error, 'That saved solo game is not there.');
    assert.deepEqual((await call('/api/solo/games', { key })).body.games.map(game => game.id), [live], 'a refused delete took a game away anyway');
    const plainCall = caller(await plain.app.listen());
    assert.notEqual((await plainCall('/api/solo/games/delete', { key: plain.app.state.hostKey, id: live })).status, 200, 'a class deletes a solo game');
  } finally { await soloRoom.dispose(); await plain.dispose(); }
});

// ------------------------------------------------------------------------------------------------------------------------
// Closing the game (owner, 2026-09-27: "i shouldn't need to open the class view to pause, save or shut down the server. i
// should be able to just X off the window and it'll automatically save, pause, and shut down"). The window's X, the launcher
// closed, the window killed: each ends the page's event stream, which is what the server watches (server/app.mjs `SOLO_WATCH`).
const WATCH = { leaveMs: 400, enterMs: 400, chooseMs: 1500 };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await check()) return true; await sleep(20); }
  return Boolean(await check());
}
/** A solo server as server/main.mjs starts one: it can stop itself, and it watches its player. */
function watchedRoom(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'texas-solo-watch-'));
  const savePath = join(dir, 'save.json');
  const stops = [];
  const make = () => createClassroom({
    seed: 'solo-watch', playerCount: 5, savePath, tickMs: 20, solo: true, stopDelayMs: 0,
    onStopRequested: () => stops.push(Date.now()), soloWatch: WATCH,
    worldFactory: (seed, count) => createGonzalesWorld(seed, count, { neighbours: true }), ...options,
  });
  const room = { dir, savePath, stops, app: make(), closed: false };
  room.close = async () => { if (!room.closed) { room.closed = true; await room.app.close(); } };
  room.reopen = async () => { await room.close(); room.app = make(); room.closed = false; return room.app; };
  room.dispose = async () => { await room.close(); rmSync(dir, { recursive: true, force: true }); };
  return room;
}
/** The player's page: its event stream, held open until `close()` - which is all a closed window is, to the server. */
function openPage(port, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/api/events', headers: { Cookie: cookie } }, res => {
      if (res.statusCode !== 200) { reject(new Error(`the page was refused: ${res.statusCode}`)); return; }
      res.once('data', () => resolve({ close: () => req.destroy() }));
      res.on('error', () => {});
    });
    req.on('error', () => {});
  });
}
const onDisk = path => JSON.parse(readFileSync(path, 'utf8'));
/** A dealt game, entered and begun: running, with the player's cookie. */
async function begun(app, call) {
  const game = await call('/api/solo', { key: app.state.hostKey });
  const cookie = (await call(`/solo/enter?ticket=${new URL(game.body.playUrl).searchParams.get('ticket')}`)).cookie;
  assert.equal((await call('/api/command', { id: `begin-${Date.now()}`, action: 'begin-solo' }, cookie)).status, 200);
  assert.equal(app.state.world.status, 'running');
  return cookie;
}

test('closing the solo game\'s page pauses and saves it at once, and the server stops itself when the page does not come back', async () => {
  const room = watchedRoom();
  try {
    const port = await room.app.listen();
    const call = caller(port);
    const cookie = await begun(room.app, call);
    const page = await openPage(port, cookie);
    await sleep(WATCH.enterMs + 200);
    assert.equal(room.stops.length, 0, 'the server stopped while the player\'s page was open');
    assert.equal(room.app.state.world.status, 'running');
    const closedAt = Date.now();
    page.close();
    // Paused and on the disk before the wait is over - Windows logging off may not leave the server the rest of it.
    assert.ok(await until(() => onDisk(room.savePath).world.status === 'paused', WATCH.leaveMs - 100), 'the game was not paused and saved when its page closed');
    assert.equal(room.stops.length, 0, 'the server stopped at once, leaving no time for a reload');
    assert.equal(onDisk(room.savePath).revision, room.app.state.revision, 'what was shown was not all written');
    assert.ok(await until(() => room.stops.length === 1, 3000), 'the server never stopped itself once the page had gone');
    assert.ok(room.stops[0] - closedAt >= WATCH.leaveMs - 50, 'the server stopped before the page had had its chance to come back');
    assert.equal((await call('/health')).body.stopping, true, 'the server did not say it was stopping');
    await room.close();
    const kept = onDisk(room.savePath);
    assert.equal(kept.world.status, 'paused', 'the save the server left behind is running');
    assert.equal(existsSync(`${room.savePath}.tmp`), false, 'a half-written save was left behind');
    assert.equal(existsSync(`${room.savePath}.lock`), false, 'the save lock was left behind');

    // Opened again, it is the same game, paused where it was; and continued, it stays paused until the player resumes it.
    const again = await room.reopen();
    const againCall = caller(await again.listen());
    assert.equal(again.state.world.status, 'paused');
    assert.equal(again.state.world.tick, kept.world.tick, 'the game moved while it was closed');
    const back = await againCall('/api/solo', { key: again.state.hostKey, continue: kept.sessionId });
    assert.equal(back.status, 200, JSON.stringify(back.body));
    assert.equal(again.state.world.status, 'paused', 'continuing the game set it running before the player was looking');
    const backCookie = (await againCall(`/solo/enter?ticket=${new URL(back.body.playUrl).searchParams.get('ticket')}`)).cookie;
    assert.equal((await againCall('/api/command', { id: 'resume-after', action: 'solo-resume' }, backCookie)).status, 200);
    assert.equal(again.state.world.status, 'running', 'the player could not resume the game they came back to');
  } finally { await room.dispose(); }
});

test('a continued solo game opens paused even when it was kept running', async () => {
  const room = watchedRoom();
  try {
    const call = caller(await room.app.listen());
    const key = room.app.state.hostKey;
    await begun(room.app, call);
    const first = room.app.state.sessionId;
    await call('/api/solo', { key });
    assert.equal(onDisk(join(room.dir, 'games', `${first}.json`)).world.status, 'running', 'the kept game was not kept running, so this proves nothing');
    assert.equal((await call('/api/solo', { key, continue: first })).status, 200);
    assert.equal(room.app.state.sessionId, first);
    assert.equal(room.app.state.world.status, 'paused', 'a continued game opened running');
  } finally { await room.dispose(); }
});

test('a solo page that comes back in time finds its game going on, and a pause the player pressed stays pressed', async () => {
  const room = watchedRoom();
  try {
    const port = await room.app.listen();
    const call = caller(port);
    const cookie = await begun(room.app, call);
    const page = await openPage(port, cookie);
    page.close();
    assert.ok(await until(() => room.app.state.world.status === 'paused', WATCH.leaveMs - 100));
    const reloaded = await openPage(port, cookie);
    assert.ok(await until(() => room.app.state.world.status === 'running', 300), 'a reloaded page found its game still paused');
    await sleep(WATCH.leaveMs + 300);
    assert.equal(room.stops.length, 0, 'the server stopped although the page came back');

    // The player's own Pause is theirs: a reload does not undo it.
    assert.equal((await call('/api/command', { id: 'pause-own', action: 'solo-pause' }, cookie)).status, 200);
    reloaded.close();
    await sleep(100);
    const third = await openPage(port, cookie);
    await sleep(200);
    assert.equal(room.app.state.world.status, 'paused', 'a page coming back resumed a game the player had paused');
    // Even when the pause pressed follows one the page's leaving made: the stream dropped, the orders still reach the server.
    assert.equal((await call('/api/command', { id: 'resume-own', action: 'solo-resume' }, cookie)).status, 200);
    third.close();
    assert.ok(await until(() => room.app.state.world.status === 'paused', WATCH.leaveMs - 100));
    assert.equal((await call('/api/command', { id: 'resume-away', action: 'solo-resume' }, cookie)).status, 200);
    assert.equal((await call('/api/command', { id: 'pause-away', action: 'solo-pause' }, cookie)).status, 200);
    const fourth = await openPage(port, cookie);
    await sleep(200);
    assert.equal(room.app.state.world.status, 'paused', 'a page coming back undid the pause the player pressed while it was away');
    fourth.close();
  } finally { await room.dispose(); }
});

test('the launcher asking for the saved games holds the stop off while the player chooses, and a game dealt that nobody opens stops', async () => {
  const listing = watchedRoom();
  const dealtRoom = watchedRoom();
  try {
    const port = await listing.app.listen();
    const call = caller(port);
    const cookie = await begun(listing.app, call);
    (await openPage(port, cookie)).close();
    await sleep(50);
    // Play Solo pressed again at once: the launcher lists the games and asks New game or Continue.
    assert.equal((await call('/api/solo/games', { key: listing.app.state.hostKey })).status, 200);
    await sleep(WATCH.leaveMs + 400);
    assert.equal(listing.stops.length, 0, 'the server stopped while the player was choosing a game');
    assert.ok(await until(() => listing.stops.length === 1, WATCH.chooseMs + 1000), 'a server whose player chose nothing never stopped');

    const dealtCall = caller(await dealtRoom.app.listen());
    assert.equal((await dealtCall('/api/solo', { key: dealtRoom.app.state.hostKey })).status, 200);
    assert.ok(await until(() => dealtRoom.stops.length === 1, WATCH.enterMs + 1000), 'a game dealt and never opened kept its server running');
  } finally { await listing.dispose(); await dealtRoom.dispose(); }
});

test('a class never pauses or stops when a student\'s page closes, even given the watch', async () => {
  const room = watchedRoom({ solo: false });
  try {
    const port = await room.app.listen();
    const call = caller(port);
    const joined = await call('/api/join', { name: 'Student', code: room.app.state.sessionCode });
    assert.equal(joined.status, 200);
    const host = (await call('/api/host', { key: room.app.state.hostKey })).cookie;
    assert.equal((await call('/api/command', { id: 'start-class', action: 'start', anyway: true }, host)).status, 200);
    assert.equal(room.app.state.world.status, 'running');
    const page = await openPage(port, joined.cookie);
    page.close();
    await sleep(WATCH.leaveMs + WATCH.enterMs + 400);
    assert.equal(room.stops.length, 0, 'a class stopped because one student closed a window');
    assert.equal(room.app.state.world.status, 'running', 'a class paused because one student closed a window');
  } finally { await room.dispose(); }
});

test('the solo player\'s own Pause, Resume and Save; a student in a class has none of them', async () => {
  // Orders are written within a minute here, so only the Save can be what put them on the disk.
  const room = watchedRoom({ saveWithinMs: 60000 });
  const plain = classroom();
  try {
    const port = await room.app.listen();
    const call = caller(port);
    const cookie = await begun(room.app, call);
    // The player's page is open throughout, as it is when they press these.
    const page = await openPage(port, cookie);
    assert.equal((await call('/api/command', { id: 'order-name', action: 'rename', surname: 'Navarro' }, cookie)).status, 200);
    assert.ok(onDisk(room.savePath).revision < room.app.state.revision, 'the order was written at once, so Save proves nothing');
    const saved = await call('/api/command', { id: 'save-own', action: 'solo-save' }, cookie);
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.equal(saved.body.saved, room.app.state.revision);
    assert.equal(onDisk(room.savePath).revision, room.app.state.revision, 'Save did not write what the player had done');
    assert.equal(onDisk(room.savePath).world.households['hh-1'].surname, 'Navarro');

    assert.equal((await call('/api/command', { id: 'pause-own', action: 'solo-pause' }, cookie)).status, 200);
    assert.equal(onDisk(room.savePath).world.status, 'paused', 'the pause was not written at once');
    const twice = await call('/api/command', { id: 'pause-twice', action: 'solo-pause' }, cookie);
    assert.notEqual(twice.status, 200, 'a paused game was paused again');
    assert.equal((await call('/api/command', { id: 'resume-own', action: 'solo-resume' }, cookie)).status, 200);
    assert.equal(room.app.state.world.status, 'running');
    assert.equal(onDisk(room.savePath).world.status, 'running', 'the resume was not written at once');
    assert.equal(room.stops.length, 0);
    page.close();

    const plainCall = caller(await plain.app.listen());
    const joined = await plainCall('/api/join', { name: 'Student', code: plain.app.state.sessionCode });
    const host = (await plainCall('/api/host', { key: plain.app.state.hostKey })).cookie;
    await plainCall('/api/command', { id: 'start-plain', action: 'start', anyway: true }, host);
    const refused = await plainCall('/api/command', { id: 'pause-class', action: 'solo-pause' }, joined.cookie);
    assert.notEqual(refused.status, 200, 'a student paused the whole class');
    assert.match(refused.body.error, /teacher/);
    assert.equal(plain.app.state.world.status, 'running');
  } finally { await room.dispose(); await plain.dispose(); }
});

test('stopping a solo server writes everything it showed, paused, whole', async () => {
  const room = watchedRoom({ saveWithinMs: 60000 });
  try {
    const call = caller(await room.app.listen());
    const cookie = await begun(room.app, call);
    assert.equal((await call('/api/command', { id: 'order-last', action: 'rename', surname: 'Arocha' }, cookie)).status, 200);
    const shown = room.app.state.revision;
    assert.ok(onDisk(room.savePath).revision < shown, 'the order was written at once, so the stop proves nothing');
    await room.close();
    const kept = onDisk(room.savePath);
    assert.ok(kept.revision >= shown, 'the stop did not write the order the player was shown');
    assert.equal(kept.world.households['hh-1'].surname, 'Arocha');
    assert.equal(kept.world.status, 'paused', 'a stopped solo server left its game running on the disk');
    assert.equal(existsSync(`${room.savePath}.tmp`), false, 'a half-written save was left behind');
  } finally { await room.dispose(); }
});

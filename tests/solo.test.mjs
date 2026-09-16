// Solo Mode: the owner's playtest, one click from the launcher (docs/DEPLOYMENT.md).
// What it has to be is a class of one that is already joined and already running, that
// nobody else can reach, and that can never be the teacher's real class.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
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

test('one solo request gives a joined, rolled, running family among automatic neighbours', async () => {
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
    assert.ok(state.world.households['hh-1'].roll, 'the player family was rolled as Start rolls it');
    assert.equal(state.world.households['hh-1'].played, true, 'and the neighbour director leaves it alone');
    const others = Object.values(state.world.households).filter(household => household.id !== 'hh-1');
    assert.equal(others.length, 4, 'the other families of the class still exist');
    assert.ok(others.every(household => !household.played), 'as automatic neighbours');
  } finally { await dispose(); }
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

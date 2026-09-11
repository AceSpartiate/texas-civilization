import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';
import { resolveDataDir, resolveSavePath } from '../server/deployment.mjs';

function client(port) {
  const jar = new Map();
  const header = () => [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  return {
    jar,
    clear() { jar.clear(); },
    async call(path, data) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: data ? 'POST' : 'GET',
        headers: { ...(data && { 'Content-Type': 'application/json' }), ...(jar.size && { Cookie: header() }) },
        ...(data && { body: JSON.stringify(data) }),
      });
      const cookies = response.headers.getSetCookie();
      for (const raw of cookies) {
        const [pair] = raw.split(';');
        const index = pair.indexOf('=');
        const name = pair.slice(0, index), value = pair.slice(index + 1);
        if (/Max-Age=0/i.test(raw)) jar.delete(name); else jar.set(name, value);
      }
      return { status: response.status, cookies, body: await response.json() };
    },
  };
}
const command = (caller, action, extra = {}) => caller.call('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action, ...extra });

test('class data resolves to a writable folder and falls back when the install directory is read-only', () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-paths-'));
  try {
    const explicit = join(dir, 'chosen');
    assert.deepEqual(resolveDataDir({ env: { TEXAS_DATA_DIR: explicit }, root: dir }), { dir: explicit, origin: 'environment' });

    const installed = join(dir, 'app');
    assert.deepEqual(resolveDataDir({ env: {}, root: installed }), { dir: join(installed, 'data'), origin: 'application' });

    // A file where the data folder would go stands in for an install directory the
    // teacher account cannot write to.
    const readOnlyRoot = join(dir, 'read-only-app');
    writeFileSync(readOnlyRoot, 'not a directory');
    const profile = join(dir, 'profile');
    const fallback = resolveDataDir({ env: { LOCALAPPDATA: profile }, root: readOnlyRoot });
    assert.equal(fallback.origin, 'user-profile');
    assert.equal(fallback.dir, join(profile, 'TexasRevolution', 'data'));
    assert.equal(existsSync(fallback.dir), true);

    assert.equal(resolveSavePath(fallback.dir, {}), join(fallback.dir, 'classroom.json'));
    assert.equal(resolveSavePath(fallback.dir, { SAVE_PATH: join(dir, 'other.json') }), join(dir, 'other.json'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a graceful stop is host-only, checkpoints a real pause and releases the save lease', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-stop-'));
  const savePath = join(dir, 'class.json');
  let requested = 0;
  let app = createClassroom({ savePath, playerCount: 5, tickMs: 40, stopDelayMs: 5, onStopRequested: () => { requested++; } });
  const port = await app.listen();
  try {
    const host = client(port), students = [];
    await host.call('/api/host', { key: app.state.hostKey });
    for (let i = 0; i < 5; i++) {
      const student = client(port);
      await student.call('/api/join', { name: `Family ${i + 1}`, code: app.state.sessionCode });
      students.push(student);
    }
    assert.equal((await command(host, 'start')).status, 200);
    await delay(120);
    assert.equal(app.state.world.status, 'running');

    const principal = students[0].jar.size ? (await students[0].call('/api/state')).body.world.household.principalId : null;
    const refused = await command(students[0], 'stop-server', { entityId: principal });
    assert.equal(refused.status, 400);
    assert.match(refused.body.error, /Action unavailable/);
    assert.equal(requested, 0);
    assert.equal(app.state.world.status, 'running');

    const stopped = await command(host, 'stop-server');
    assert.equal(stopped.status, 200);
    assert.equal(stopped.body.stopping, true);
    // A saved running class starts advancing again on restart, so a deliberate stop
    // must leave a checkpointed pause rather than an in-memory one.
    assert.equal(JSON.parse(readFileSync(savePath, 'utf8')).world.status, 'paused');
    assert.equal((await students[1].call('/api/state')).body.lifecycle.state, 'stopping');
    await delay(60);
    assert.equal(requested, 1);

    await app.close();
    assert.equal(existsSync(`${savePath}.lock`), false);
    app = createClassroom({ savePath, playerCount: 5 });
    assert.equal(app.state.world.status, 'paused');
    assert.equal(Object.keys(app.state.clients).length, 5);
  } finally { await app?.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a live class cannot be discarded, and New Class archives it, clears students and keeps the class size', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-newclass-'));
  const savePath = join(dir, 'class.json');
  const app = createClassroom({ savePath, playerCount: 6, tickMs: 40 });
  const port = await app.listen();
  try {
    const host = client(port), students = [];
    await host.call('/api/host', { key: app.state.hostKey });
    for (let i = 0; i < 5; i++) {
      const student = client(port);
      await student.call('/api/join', { name: `Family ${i + 1}`, code: app.state.sessionCode });
      students.push(student);
    }
    const firstSession = app.state.sessionId, firstCode = app.state.sessionCode;
    await command(host, 'start');
    await delay(100);

    const live = await command(host, 'new-class');
    assert.equal(live.status, 400);
    assert.match(live.body.error, /End the current class/);
    assert.equal(app.state.sessionId, firstSession);

    await command(host, 'end');
    const reset = await command(host, 'new-class');
    assert.equal(reset.status, 200);
    assert.match(reset.body.archived, /^class-.+\.json$/);

    const archived = readdirSync(join(dir, 'archive'));
    assert.equal(archived.length, 1);
    assert.equal(JSON.parse(readFileSync(join(dir, 'archive', archived[0]), 'utf8')).sessionId, firstSession);

    const state = app.state;
    assert.notEqual(state.sessionId, firstSession);
    assert.notEqual(state.sessionCode, firstCode);
    assert.deepEqual(state.clients, {});
    assert.equal(state.world.status, 'lobby');
    assert.equal(state.world.playerCount, 6, 'class size is a kept setting');
    assert.equal(JSON.parse(readFileSync(savePath, 'utf8')).sessionId, state.sessionId);

    // The previous class's credentials belong to the archive, not to the new class.
    assert.equal((await students[0].call('/api/state')).status, 401);
    assert.equal((await students[0].call('/api/join', { name: 'Family 1', code: firstCode })).status, 403);

    // The teacher keeps working without reopening the launcher.
    assert.equal(host.jar.has(`tr_host_${state.sessionId}`), true);
    assert.equal(host.jar.has(`tr_host_${firstSession}`), false);
    const early = await command(host, 'start');
    assert.equal(early.status, 400);
    assert.match(early.body.error, /built for five or more/);
    assert.equal(app.state.world.status, 'lobby', 'and an empty class is still not running');

    const rejoined = client(port);
    assert.equal((await rejoined.call('/api/join', { name: 'Family 1', code: state.sessionCode })).status, 200);
    assert.equal(Object.keys(app.state.clients).length, 1);
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a teacher can begin with fewer than five, but only on purpose', () => {
  // Not a test of the HTTP path - `tests/network.test.mjs` owns that - but of the rule
  // itself, which is that five is a guard with a way through rather than a wall. Without
  // one, this cannot be tried out on a single machine at all.
  const dir = mkdtempSync(join(tmpdir(), 'texas-solo-'));
  return (async () => {
    const app = createClassroom({ seed: 'solo', playerCount: 5, tickMs: 10000, savePath: join(dir, 'class.json') });
    try {
      const port = await app.listen(0, '127.0.0.1');
      const host = client(port);
      await host.call('/api/host', { key: app.state.hostKey });
      const student = client(port);
      assert.equal((await student.call('/api/join', { name: 'Only family', code: app.state.sessionCode })).status, 200);

      const refused = await command(host, 'start');
      assert.equal(refused.status, 400);
      assert.match(refused.body.error, /Only 1 household has joined/, 'and it says how many, rather than a rule number');
      assert.match(refused.body.error, /Press Start again/, 'and how to go ahead');
      assert.equal(app.state.world.status, 'lobby', 'one press does not start it');

      const anyway = await command(host, 'start', { anyway: true });
      assert.equal(anyway.status, 200);
      assert.equal(app.state.world.status, 'running', 'a deliberate second press does');
    } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
  })();
});

test('a family can be set to work before the class begins, and none of it happens early', () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-lobby-'));
  return (async () => {
    // Ticking fast on purpose: a slow clock would let this test pass whether or not the
    // lobby is frozen, which is not evidence of anything. At twenty milliseconds a tick,
    // a lobby that ran would have moved the world several times over by the delay below.
    const app = createClassroom({ seed: 'lobby', playerCount: 5, tickMs: 20, savePath: join(dir, 'class.json') });
    try {
      const port = await app.listen(0, '127.0.0.1');
      const student = client(port);
      assert.equal((await student.call('/api/join', { name: 'Early bird', code: app.state.sessionCode })).status, 200);
      assert.equal(app.state.world.status, 'lobby');
      const thomas = 'hh-1-thomas';

      const assigned = await command(student, 'chore', { entityId: thomas, chore: 'plant-field' });
      assert.equal(assigned.status, 200, assigned.body.error);
      assert.ok(app.state.world.entities[thomas].chore, 'the job is set out');

      // The whole reason the lobby used to be shut: nobody may get ahead by joining early.
      const before = structuredClone(app.state.world.entities[thomas]);
      const minute = app.state.world.minute;
      await delay(200);
      assert.equal(app.state.world.minute, minute, 'no time passes in a lobby');
      assert.deepEqual(app.state.world.entities[thomas], before, 'and the work does not advance by a step');
      assert.equal(app.state.world.households['hh-1'].resources.seed, 2, 'nor is anything spent yet');

      // What reaches another household stays shut: they may not have joined at all.
      const offered = await command(student, 'offer', { entityId: thomas, toEntityId: 'hh-2-thomas', give: { food: 1 }, ask: { seed: 1 } });
      assert.equal(offered.status, 400);
      assert.match(offered.body.error, /neighbours are still arriving/);

      // And it all starts the moment the teacher does.
      const host = client(port);
      await host.call('/api/host', { key: app.state.hostKey });
      assert.equal((await command(host, 'start', { anyway: true })).status, 200);
      await delay(120);
      assert.ok(app.state.world.minute > minute, 'and the moment the teacher begins, the clock does too');
    } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
  })();
});

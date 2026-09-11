import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';
import { createWorld } from '../sim/world.mjs';

test('Gate A: authoritative identity, restart, auth, pause and seed', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-net-'));
  let app = createClassroom({ seed: 'network-test', savePath: join(dir, 'save.json'), tickMs: 10 });
  let port = await app.listen();
  const call = async (path, data, cookie) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: data ? 'POST' : 'GET', headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, ...(data && { body: JSON.stringify(data) }) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    assert.deepEqual(createWorld('same'), createWorld('same'));
    const host = await call('/api/host', { key: app.state.hostKey });
    const clients = await Promise.all(Array.from({ length: 5 }, (_, i) => call('/api/join', { name: `Family ${i}`, code: app.state.sessionCode })));
    assert.equal(new Set(clients.map(c => c.body.world.householdId)).size, 5);
    assert.equal((await call('/api/command', { id: 'student-start', action: 'start' }, clients[0].cookie)).status, 400);
    assert.equal((await call('/api/state')).status, 401);
    await call('/api/command', { id: 'host-start-01', action: 'start' }, host.cookie);
    await delay(60);
    await call('/api/command', { id: 'host-pause-01', action: 'pause' }, host.cookie);
    const tick = app.state.world.tick;
    assert.ok(tick > 0);
    await delay(60);
    assert.equal(app.state.world.tick, tick);
    assert.equal((await call('/api/command', { id: 'host-pause-01', action: 'pause' }, host.cookie)).body.duplicate, true);
    assert.equal((await call('/api/join', { name: 'duplicate', code: app.state.sessionCode }, clients[0].cookie)).body.world.householdId, clients[0].body.world.householdId);
    const before = app.state;
    await app.close();
    app = createClassroom({ savePath: join(dir, 'save.json'), tickMs: 10 }); port = await app.listen();
    assert.deepEqual(app.state, before);
    assert.equal((await call('/api/state', null, clients[0].cookie)).body.world.householdId, clients[0].body.world.householdId);
    assert.equal(Object.keys(app.state.clients).length, 5);
    await call('/api/command', { id: 'host-resume-01', action: 'resume' }, host.cookie);
    await delay(40);
    assert.ok(app.state.world.tick > tick);
    const student = JSON.stringify((await call('/api/state', null, clients[0].cookie)).body);
    assert.ok(!student.includes(app.state.hostKey));
    assert.ok(!student.includes('credentialHash'));
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});
test('separate classes on the same host do not overwrite or accept each other\'s cookies', async () => {
  const a = createClassroom(), b = createClassroom();
  const ports = [await a.listen(), await b.listen()];
  const apps = [a, b];
  try {
    const credentials = await Promise.all(apps.map(async (app, i) => {
      const response = await fetch(`http://127.0.0.1:${ports[i]}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Same student', code: app.state.sessionCode }) });
      return response.headers.get('set-cookie').split(';')[0];
    }));
    assert.notEqual(credentials[0].split('=')[0], credentials[1].split('=')[0]);
    for (let i = 0; i < 2; i++) {
      const both = await fetch(`http://127.0.0.1:${ports[i]}/api/state`, { headers: { Cookie: credentials.join('; ') } });
      assert.equal((await both.json()).sessionId, apps[i].state.sessionId);
      const wrong = await fetch(`http://127.0.0.1:${ports[i]}/api/state`, { headers: { Cookie: credentials[1 - i] } });
      assert.equal(wrong.status, 401);
    }
  } finally { await a.close(); await b.close(); }
});

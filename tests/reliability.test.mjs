import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, rmdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';
import { acquireSaveLock } from '../server/storage.mjs';

test('save ownership excludes another server regardless of port and releases on clean close', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-owner-'));
  const savePath = join(dir, 'class.json');
  let app;
  try {
    app = createClassroom({ savePath });
    await app.listen();
    const original = readFileSync(savePath, 'utf8');
    assert.throws(() => createClassroom({ savePath }), /Save already owned/);
    assert.equal(readFileSync(savePath, 'utf8'), original);
    const lock = JSON.parse(readFileSync(`${savePath}.lock`, 'utf8'));
    assert.equal(lock.processId, process.pid);
    assert.match(lock.token, /^[a-f0-9]{48}$/);
    await app.close(); app = null;
    assert.equal(existsSync(`${savePath}.lock`), false);
    app = createClassroom({ savePath });
    assert.equal(app.state.sessionId, JSON.parse(original).sessionId);
  } finally { await app?.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('stale or malformed locks fail closed without deleting another owner; failed initialization releases its lease', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-stale-'));
  const savePath = join(dir, 'class.json'), lockPath = `${savePath}.lock`;
  try {
    // An exited child gives an actual dead PID, without assuming PID ranges on Windows.
    const child = spawnSync(process.execPath, ['-e', 'process.exit(0)']);
    assert.equal(child.status, 0);
    writeFileSync(lockPath, JSON.stringify({ version: 1, processId: child.pid, token: 'departed' }));
    assert.throws(() => acquireSaveLock(savePath), /Stale save lock|ownership cannot be verified/);
    assert.equal(JSON.parse(readFileSync(lockPath, 'utf8')).token, 'departed');
    writeFileSync(lockPath, 'interrupted lock write');
    assert.throws(() => acquireSaveLock(savePath), /ownership cannot be verified/);
    rmSync(lockPath);
    writeFileSync(savePath, '{broken save');
    assert.throws(() => createClassroom({ savePath }));
    assert.equal(existsSync(lockPath), false);
    assert.equal(readFileSync(savePath, 'utf8'), '{broken save');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a failed tick pauses clients, preserves the last save, rejects failed Resume, then recovers durably', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-fault-'));
  const savePath = join(dir, 'class.json');
  const app = createClassroom({ savePath, playerCount: 5, tickMs: 100 });
  const port = await app.listen();
  const call = async (path, data, credential) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: data ? 'POST' : 'GET',
      headers: { ...(data && { 'Content-Type': 'application/json' }), ...(credential && { Cookie: credential }) },
      ...(data && { body: JSON.stringify(data) }),
    });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    const host = await call('/api/host', { key: app.state.hostKey });
    const clients = [];
    for (let i = 0; i < 5; i++) clients.push(await call('/api/join', { code: app.state.sessionCode, name: `Student ${i}` }));
    assert.equal((await call('/api/command', { id: 'fault-start-01', action: 'start' }, host.cookie)).status, 200);
    // Block the atomic replacement path rather than relying on OS-specific permissions.
    mkdirSync(`${savePath}.tmp`);
    const before = JSON.parse(readFileSync(savePath, 'utf8'));
    for (let i = 0; i < 20 && !app.snapshot({ role: 'host' }).fault; i++) await delay(30);
    const failed = await call('/api/state', null, clients[0].cookie);
    assert.equal(failed.body.world.status, 'paused');
    assert.equal(failed.body.fault.code, 'SAVE_FAILED');
    assert.equal(failed.body.fault.unsaved, true);
    assert.equal(failed.body.fault.lastSavedRevision, before.revision);
    assert.equal(app.state.world.tick, before.world.tick, 'failed tick must roll back');
    assert.deepEqual(JSON.parse(readFileSync(savePath, 'utf8')), before, 'last durable state stays intact');
    assert.equal((await call('/api/command', { id: 'fault-resume-01', action: 'resume' }, host.cookie)).status, 503);
    assert.equal(app.state.world.status, 'paused');
    assert.ok(!app.state.hostCommands.includes('fault-resume-01'), 'failed command must be retryable');
    const pausedTick = app.state.world.tick;
    await delay(160);
    assert.equal(app.state.world.tick, pausedTick);
    rmdirSync(`${savePath}.tmp`);
    assert.equal((await call('/api/command', { id: 'fault-resume-01', action: 'resume' }, host.cookie)).status, 200);
    const durable = JSON.parse(readFileSync(savePath, 'utf8'));
    assert.equal(durable.world.status, 'running');
    assert.ok(durable.hostCommands.includes('fault-resume-01'));
    assert.equal((await call('/api/state', null, host.cookie)).body.fault, null);
    for (let i = 0; i < 20 && app.state.world.tick === pausedTick; i++) await delay(30);
    assert.ok(app.state.world.tick > pausedTick, 'timer continues after recovery');
    const health = await call('/health');
    assert.equal(health.body.application, 'texas-revolution-foundation');
    assert.equal(health.body.pid, process.pid);
    assert.ok('launchId' in health.body);
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a failed lobby write cannot bypass the five-household Start requirement when recovered', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-lobby-fault-'));
  const savePath = join(dir, 'class.json');
  const app = createClassroom({ savePath });
  const port = await app.listen();
  const call = async (path, data, cookie) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(data) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    const host = await call('/api/host', { key: app.state.hostKey });
    mkdirSync(`${savePath}.tmp`);
    assert.equal((await call('/api/join', { code: app.state.sessionCode, name: 'Student' })).status, 503);
    assert.equal(Object.keys(app.state.clients).length, 0);
    assert.equal(app.state.world.status, 'paused');
    rmdirSync(`${savePath}.tmp`);
    assert.equal((await call('/api/command', { id: 'lobby-recover-01', action: 'resume' }, host.cookie)).status, 200);
    assert.equal(app.state.world.status, 'lobby');
    assert.equal((await call('/api/command', { id: 'lobby-start-001', action: 'start' }, host.cookie)).status, 400);
    assert.equal(app.state.world.status, 'lobby');
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

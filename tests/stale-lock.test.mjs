// A class server that did not stop cleanly - the laptop shut with the class up, a Windows Update restart overnight, End
// Task - left a save lock that refused every later start, and only a developer could clear it (2026-09-28,
// docs/audits/2026-09-28-classroom.md B5). A lock whose owner has certainly gone is now taken over, the save backed up
// first; every doubt still refuses, and of several starts racing to recover one lock, exactly one wins.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { acquireSaveLock, ownerGone, processStartedAt } from '../server/storage.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const deadPid = () => { const child = spawnSync(process.execPath, ['-e', 'process.exit(0)']); assert.equal(child.status, 0); return child.pid; };
const lockOf = (pid, createdAt = new Date().toISOString(), token = 'a'.repeat(48)) => JSON.stringify({ version: 1, processId: pid, token, createdAt });
/** A process that stays alive until killed. */
function sleeper() {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  return child;
}

test('a lock whose process has ended is taken over, and the save is backed up first', () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-stale-over-'));
  const savePath = join(dir, 'classroom.json'), lockPath = `${savePath}.lock`;
  try {
    writeFileSync(savePath, '{"the":"class"}');
    const pid = deadPid();
    writeFileSync(lockPath, lockOf(pid));
    const lease = acquireSaveLock(savePath);
    assert.match(lease.recovered.reason, new RegExp(`process ${pid} has ended`));
    const owner = JSON.parse(readFileSync(lockPath, 'utf8'));
    assert.equal(owner.processId, process.pid, 'the lock is this server\'s now');
    assert.ok(lease.recovered.backup && existsSync(lease.recovered.backup), 'the save was backed up');
    assert.match(lease.recovered.backup, /archive[\\/]classroom-before-lock-recovery-.+\.json$/);
    assert.equal(readFileSync(lease.recovered.backup, 'utf8'), '{"the":"class"}');
    assert.equal(readdirSync(dir).filter(file => file.includes('.stale-')).length, 0, 'nothing left beside the save');
    lease.release();
    assert.equal(existsSync(lockPath), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a lock whose number now belongs to a process that began after it was written is taken over; one that began before is not', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-stale-reused-'));
  const savePath = join(dir, 'classroom.json'), lockPath = `${savePath}.lock`;
  const child = sleeper();
  try {
    await delay(300);
    const started = processStartedAt(child.pid);
    assert.ok(Number.isFinite(started), `the start of a running process can be read here (${started})`);
    assert.ok(Math.abs(started - Date.now()) < 60000, 'and it is when it started');
    // Written an hour before this process began: the number was reused, as a restart or a long day does.
    writeFileSync(lockPath, lockOf(child.pid, new Date(Date.now() - 3600000).toISOString()));
    const lease = acquireSaveLock(savePath);
    assert.match(lease.recovered.reason, /began after the lock was written/);
    lease.release();
    // Written after this process began: it may be the server that owns the class. Refused, and the lock left alone.
    const owned = lockOf(child.pid, new Date(Date.now() + 1000).toISOString());
    writeFileSync(lockPath, owned);
    assert.throws(() => acquireSaveLock(savePath), /Save already owned, or ownership cannot be verified/);
    assert.equal(readFileSync(lockPath, 'utf8'), owned);
  } finally { child.kill(); rmSync(dir, { recursive: true, force: true }); }
});

test('every doubt still refuses: a malformed lock, a start time that cannot be read, a lock with no time', () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-stale-doubt-'));
  const savePath = join(dir, 'classroom.json'), lockPath = `${savePath}.lock`;
  try {
    writeFileSync(lockPath, 'interrupted lock write');
    assert.throws(() => acquireSaveLock(savePath), /ownership cannot be verified/);
    assert.equal(readFileSync(lockPath, 'utf8'), 'interrupted lock write');
    // This very process is alive; what cannot be told is not gone.
    const alive = { version: 1, processId: process.pid, token: 'b'.repeat(48), createdAt: new Date(0).toISOString() };
    assert.equal(ownerGone(alive, { startedAt: () => null }), null);
    assert.equal(ownerGone({ ...alive, createdAt: undefined }, { startedAt: () => Date.now() }), null);
    assert.equal(ownerGone({ ...alive, token: undefined }, { startedAt: () => Date.now() }), null);
    assert.match(ownerGone(alive, { startedAt: () => undefined }), /has ended/);
    writeFileSync(lockPath, JSON.stringify(alive));
    assert.throws(() => acquireSaveLock(savePath, { startedAt: () => null }), /ownership cannot be verified/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a start that judged a lock gone, while another start recovered it first, leaves the other\'s new lock alone', () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-stale-between-'));
  const savePath = join(dir, 'classroom.json'), lockPath = `${savePath}.lock`;
  try {
    writeFileSync(savePath, '{}');
    writeFileSync(lockPath, lockOf(deadPid()));
    let first = null;
    // In the instant between this start's judgement and its move, another start does its whole recovery.
    assert.throws(() => acquireSaveLock(savePath, { judged: () => { first = acquireSaveLock(savePath); } }), /ownership changed while it was being recovered/);
    assert.ok(first, 'the other start recovered the lock');
    const held = JSON.parse(readFileSync(lockPath, 'utf8'));
    assert.equal(held.processId, process.pid);
    first.release();
    assert.equal(existsSync(lockPath), false, 'and the lock on the disk was the other start\'s own, which it released');
    assert.equal(readdirSync(dir).filter(file => file.includes('.stale-')).length, 0, 'nothing left beside the save');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('of several starts racing to recover one stale lock, exactly one owns the class', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-stale-race-'));
  const savePath = join(dir, 'classroom.json'), lockPath = `${savePath}.lock`;
  try {
    writeFileSync(savePath, '{}');
    writeFileSync(lockPath, lockOf(deadPid()));
    const script = `import { acquireSaveLock } from ${JSON.stringify(new URL('../server/storage.mjs', import.meta.url).href)};
      try { acquireSaveLock(${JSON.stringify(savePath)}); console.log('won'); setTimeout(() => {}, 1500); }
      catch (error) { console.log('refused: ' + error.message.split('\\n')[0]); }`;
    const racers = Array.from({ length: 6 }, () => new Promise(done => {
      const child = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'inherit'] });
      let out = '';
      child.stdout.on('data', chunk => { out += chunk; });
      child.on('exit', () => done(out.trim()));
    }));
    const results = await Promise.all(racers);
    assert.equal(results.filter(result => result === 'won').length, 1, results.join('\n'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

async function freePort() {
  const probe = createServer();
  await new Promise(done => probe.listen(0, '127.0.0.1', done));
  const { port } = probe.address();
  await new Promise(done => probe.close(done));
  return port;
}
function launch(dataDir, port) {
  const child = spawn(process.execPath, ['server/main.mjs'], { cwd: root, env: { ...process.env, TEXAS_DATA_DIR: dataDir, PORT: String(port), TICK_MS: '200', SAVE_PATH: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const output = { text: '' };
  child.stdout.on('data', chunk => { output.text += chunk; });
  child.stderr.on('data', chunk => { output.text += chunk; });
  const exited = new Promise(done => child.on('exit', code => done(code)));
  return { child, output, exited };
}
async function healthy(port, server, limitMs = 60000) {
  for (const until = Date.now() + limitMs; Date.now() < until;) {
    if (server.child.exitCode !== null) return false;
    try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return true; } catch { /* not yet */ }
    await delay(200);
  }
  return false;
}

test('the real server, killed outright, opens the same class on the next start with every student\'s place', async () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'texas-stale-server-'));
  const port = await freePort();
  let server = launch(dataDir, port);
  try {
    assert.ok(await healthy(port, server), server.output.text);
    const save = JSON.parse(readFileSync(join(dataDir, 'classroom.json'), 'utf8'));
    const joined = await fetch(`http://127.0.0.1:${port}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Sam', code: save.sessionCode }) });
    assert.equal(joined.status, 200);
    const cookie = joined.headers.get('set-cookie').split(';')[0];
    // End Task: no signal handler runs, the lock stays behind.
    server.child.kill('SIGKILL');
    await server.exited;
    assert.ok(existsSync(join(dataDir, 'classroom.json.lock')), 'a forced stop leaves the lock');
    server = launch(dataDir, port);
    assert.ok(await healthy(port, server), `the next start opens the class:\n${server.output.text}`);
    assert.match(server.output.text, /did not stop cleanly \(process \d+ has ended\)\. The class was backed up to .+before-lock-recovery.+ and opened\./);
    const back = await fetch(`http://127.0.0.1:${port}/api/state`, { headers: { Cookie: cookie } });
    assert.equal(back.status, 200, 'the student\'s own browser is still in the class');
    const snapshot = await back.json();
    assert.equal(snapshot.sessionId, save.sessionId, 'the same class, not a new one');
    assert.equal(snapshot.world.householdId, 'hh-1');
  } finally {
    server.child.kill('SIGKILL');
    await server.exited;
    rmSync(dataDir, { recursive: true, force: true });
  }
});

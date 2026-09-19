// Solo Mode, in a real browser, through the real entry point (docs/DEPLOYMENT.md).
//
// tests/solo.test.mjs proves the server's half: one request deals a joined, running family whose
// clock waits until the family is made; the link opens once; only a solo server has the door; loopback only; its own save.
// This runs `npm run solo` itself - scripts/solo.mjs starting `server/main.mjs --solo` - beside
// a real class that is already running in the same data folder, and checks what the owner
// actually sees: the player page opens already joined with the class running, no join form
// and no ticket left in the address bar, and the world held until the family is made (owner,
// 2026-09-18) and going on after; the solo class view opens from its Host address; a
// second `npm run solo` reuses the server and deals a new game; the solo server cannot be
// reached on this computer's network address; and the real class, its save and its port are
// exactly as they were.
//
// Same computer only: headless Chrome. Run: npm run test:solo
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom, PACES } from '../server/app.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { resolveSavePath, joinCandidates } from '../server/deployment.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

const freePort = () => new Promise(resolve => { const probe = createServer().listen(0, '127.0.0.1', () => { const { port } = probe.address(); probe.close(() => resolve(port)); }); });
const dataDir = mkdtempSync(join(tmpdir(), 'texas-solo-proof-'));
const soloPort = await freePort();
const env = { ...process.env, TEXAS_DATA_DIR: dataDir, SOLO_PORT: String(soloPort), PLAYERS: '5' };
delete env.SAVE_PATH; delete env.PORT;

/** Run `npm run solo -- --no-open` and wait for its play address. Resolves with the process still running. */
function runSolo() {
  const child = spawn(process.execPath, ['scripts/solo.mjs', '--no-open'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let text = '';
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`npm run solo printed no address in 90 s:\n${text}`)), 90000);
    const read = chunk => {
      text += chunk;
      const play = text.match(/SOLO PLAY: (\S+)/), host = text.match(/SOLO HOST: (\S+)/);
      if (play && host) { clearTimeout(timer); resolve({ child, play: play[1], host: host[1], output: () => text }); }
    };
    child.stdout.on('data', read); child.stderr.on('data', read);
    child.on('exit', code => { if (!/SOLO PLAY/.test(text)) { clearTimeout(timer); reject(new Error(`npm run solo exited ${code}:\n${text}`)); } });
  });
}

// A real class already running from the same data folder, on its own port, as a teacher's would be.
const realSave = resolveSavePath(dataDir, {});
const real = createClassroom({ seed: 'solo-proof-real-class', playerCount: 5, tickMs: 10000, savePath: realSave, worldFactory: createGonzalesWorld });
const realPort = await real.listen(0, '127.0.0.1');
const realBefore = { sessionId: real.state.sessionId, code: real.state.sessionCode, save: readFileSync(realSave, 'utf8') };

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
let server = null;
try {
  const first = await runSolo();
  server = first.child;
  observed.play = first.play.replace(/ticket=\w+/, 'ticket=…');
  assert.match(first.play, new RegExp(`^http://127\\.0\\.0\\.1:${soloPort}/solo/enter\\?ticket=[0-9a-f]{48}$`));

  // ------------------------------------------------------------------ the player, already joined
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(first.play);
  await page.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 60000 });
  const seen = await page.evaluate(() => ({ status: window.__snapshot.world.status, path: location.pathname + location.search, joinHidden: document.querySelector('#join')?.hidden, familyKey: Boolean(window.__snapshot.familyKey) }));
  assert.equal(seen.status, 'running', 'the class is running with no Start press');
  assert.equal(seen.path, '/', 'the one-use ticket is not left in the address bar');
  assert.equal(seen.joinHidden, true, 'no join form');
  assert.ok(seen.familyKey, 'the page is a family, not a visitor');
  ok('npm run solo opens the player page already joined as hh-1, the class running, no join form, no ticket in the address');
  // Held while the family is made (owner, 2026-09-18, by multiple choice: "hold"): two of the study pace's ticks and more go
  // by, and the world has not moved and the die is still the player's - the world's second tick used to close it.
  const holdMs = PACES.study * 2 + 2000;
  await delay(holdMs);
  const held = await page.evaluate(async () => ({ tick: window.__snapshot.world.tick, canRoll: (await (await fetch('/api/family')).json()).family?.canRoll }));
  assert.equal(held.tick, 0, 'the world went on before the family was made');
  assert.equal(held.canRoll, true, 'the die was closed before the player came to it');
  await meetFamily(page, 'Proofwright', { timeout: 30000 });
  await page.waitForFunction(() => window.__snapshot.world.tick > 0, null, { timeout: 60000 });
  observed.held = { waitedMs: holdMs, tickWhileMaking: held.tick, tickAfter: await page.evaluate(() => window.__snapshot.world.tick) };
  ok(`the world waits while the family is made (tick 0 after ${holdMs / 1000} s, the die still offered) and goes on once it is (tick ${observed.held.tickAfter})`);

  const used = await context.newPage();
  const reused = await used.goto(first.play);
  assert.equal(reused.status(), 403, 'the same link opens nothing twice');
  await used.close();
  ok('the play link is one use: opening it again is refused');

  // ------------------------------------------------------------------ the solo class view
  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const host = await hostContext.newPage();
  host.on('pageerror', error => errors.push(error.message));
  await host.goto(first.host);
  await host.waitForFunction(() => window.__snapshot?.sessionCode && window.__snapshot?.presence, null, { timeout: 60000 });
  const hostSeen = await host.evaluate(() => ({ status: window.__snapshot.world.status, joined: window.__snapshot.presence.joined, households: Object.keys(window.__snapshot.world.households || {}).length }));
  assert.equal(hostSeen.status, 'running');
  assert.equal(hostSeen.joined, 1, 'one player joined');
  observed.hostView = hostSeen;
  ok(`the solo class view opens from its Host address: running, ${hostSeen.joined} family joined`);

  // ------------------------------------------------------------------ only this computer
  const lan = joinCandidates(soloPort)[0];
  if (lan) {
    const reached = await fetch(`http://${lan.address}:${soloPort}/health`, { signal: AbortSignal.timeout(3000) }).then(() => true, () => false);
    assert.equal(reached, false, `the solo server answered on ${lan.address}`);
    ok(`the solo server does not answer on this computer's network address (${lan.label}), only on 127.0.0.1`);
  } else console.log('SKIP no non-loopback interface to try');

  // ------------------------------------------------------------------ npm run solo again
  const firstSession = JSON.parse(readFileSync(join(dataDir, 'solo', 'classroom.json'), 'utf8')).sessionId;
  const second = await runSolo();
  await new Promise(resolve => second.child.exitCode !== null ? resolve() : second.child.on('exit', resolve));
  assert.equal(second.child.exitCode, 0, 'a second npm run solo reuses the running server and exits');
  assert.equal(server.exitCode, null, 'and the first server is still the one running');
  const secondSession = JSON.parse(readFileSync(join(dataDir, 'solo', 'classroom.json'), 'utf8')).sessionId;
  assert.notEqual(secondSession, firstSession, 'with a new game');
  const again = await context.newPage();
  await again.goto(second.play);
  await again.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1' && window.__snapshot.world.status === 'running', null, { timeout: 60000 });
  ok('a second npm run solo reuses the running solo server, deals a new game (new session) and opens it joined');

  // ------------------------------------------------------------------ the real class, untouched
  assert.equal(real.state.sessionId, realBefore.sessionId);
  assert.equal(real.state.sessionCode, realBefore.code);
  assert.equal(readFileSync(realSave, 'utf8'), realBefore.save, 'the real class save is byte-for-byte the same');
  assert.ok(existsSync(join(dataDir, 'solo', 'classroom.json')), 'the solo game saved in its own folder');
  assert.notEqual(realPort, soloPort);
  assert.equal((await (await fetch(`http://127.0.0.1:${realPort}/health`)).json()).solo, false);
  ok(`a real class running from the same data folder is untouched: same session, same code, save unchanged; solo saved to solo\\classroom.json on its own port`);

  // ------------------------------------------------------------------ stop
  const login = await fetch(`http://127.0.0.1:${soloPort}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: first.host.split('#')[1] }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  await fetch(`http://127.0.0.1:${soloPort}/api/command`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ id: `stop-${Date.now()}`, action: 'stop-server' }) });
  for (let i = 0; i < 60 && server.exitCode === null; i++) await delay(250);
  assert.equal(server.exitCode, 0, 'the solo server stops gracefully from its Host');
  assert.equal(existsSync(join(dataDir, 'solo', 'classroom.json.lock')), false, 'and releases its save lock');
  server = null;
  ok('the solo server stops gracefully from its class view and releases its save lock');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/solo-browser.json', JSON.stringify({ recordedAt: new Date().toISOString(), scope: 'same computer, headless Chrome', command: 'npm run test:solo', pass, observed }, null, 2) + '\n');
} finally {
  await browser.close();
  if (server && server.exitCode === null) server.kill();
  await real.close();
  await delay(300);
  rmSync(dataDir, { recursive: true, force: true });
}

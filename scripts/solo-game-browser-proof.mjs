// Solo Mode, end to end: the owner's playtest played through the whole game (owner, 2026-09-16: "Solo Mode end to end").
//
// scripts/solo-browser-proof.mjs proves the entry - a game dealt joined, rolled and running through the real `npm run
// solo`, beside a real class. This proves the game behind that door: the same whole game the class proof plays
// (scripts/support/whole-game.mjs) on a classroom created with `solo: true` and dealt by `newSoloGame`, with no join, no
// roll and no Start press, the family's neighbours all automatic; the solo class view continuing the class twice; and,
// when it has ended, a new solo game dealt while the old pages are open, and opened joined and running.
//
// It also checks the one thing the entry proof could not see: that `server/main.mjs --solo`, the real solo server the
// launcher starts, deals its game on the real land of the colonies. Until 2026-09-16 it dealt the invented Gonzales
// country, which cannot continue past 1835 - so a solo playtest could never reach the winter or the spring.
//
// Same computer only: headless Chrome. Run: npm run test:solo-game
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { playWholeGame } from './support/whole-game.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
const TICK_MS = 100;
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/solo-game-${name}.png`; await page.screenshot({ path }); shots.push(path); };

// ------------------------------------------------------------------ the real solo server deals on the real land
const freePort = () => new Promise(resolve => { const probe = createServer().listen(0, '127.0.0.1', () => { const { port } = probe.address(); probe.close(() => resolve(port)); }); });
const dataDir = mkdtempSync(join(tmpdir(), 'texas-solo-game-'));
const soloPort = await freePort();
const env = { ...process.env, TEXAS_DATA_DIR: dataDir, SOLO_PORT: String(soloPort), PLAYERS: '5', TICK_MS: '10000' };
delete env.SAVE_PATH; delete env.PORT; delete env.MAP;
const real = spawn(process.execPath, ['server/main.mjs', '--solo'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let realOut = '';
real.stdout.on('data', chunk => { realOut += chunk; }); real.stderr.on('data', chunk => { realOut += chunk; });
try {
  const started = Date.now();
  let health = null;
  while (Date.now() - started < 60000 && !health?.solo) { await new Promise(r => setTimeout(r, 300)); health = await fetch(`http://127.0.0.1:${soloPort}/health`).then(r => r.json()).catch(() => null); }
  assert.ok(health?.solo, `the real solo server never answered:\n${realOut}`);
  const key = readFileSync(join(dataDir, 'solo', 'host-url.txt'), 'utf8').trim().split('#')[1];
  const dealt = await fetch(`http://127.0.0.1:${soloPort}/api/solo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
  assert.equal(dealt.status, 200, `no solo game dealt: ${await dealt.text()}`);
  const saved = JSON.parse(readFileSync(join(dataDir, 'solo', 'classroom.json'), 'utf8'));
  measured.realServer = { mapSource: saved.world?.map?.source || null, households: Object.keys(saved.world?.households || {}).length, status: saved.world?.status };
  assert.equal(measured.realServer.mapSource, 'texas-colonies-map', `the real solo server dealt its game on ${measured.realServer.mapSource || 'the invented country'}, which cannot continue past 1835`);
  ok(`server/main.mjs --solo deals its game on the real land of the colonies (${measured.realServer.households} families, ${measured.realServer.status})`);
} finally {
  real.kill();
  await new Promise(resolve => real.exitCode !== null ? resolve() : real.on('exit', resolve));
  rmSync(dataDir, { recursive: true, force: true });
}

// ------------------------------------------------------------------ the whole game behind the solo door
const app = createClassroom({ seed: 'solo-game-1', playerCount: 5, tickMs: TICK_MS, solo: true, worldFactory: (seed, playerCount) => createGonzalesWorld(seed, playerCount, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const world = () => app.state.world;

try {
  const game = app.newSoloGame('Solo reader');
  const student = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url + game.path);
  await student.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1' && window.__snapshot.world.status === 'running', null, { timeout: 30000 });
  const seen = await student.evaluate(() => ({ joinHidden: document.querySelector('#join')?.hidden, path: location.pathname + location.search, rolled: Boolean(window.__snapshot.world.household) }));
  assert.equal(seen.joinHidden, true, 'a join form');
  assert.equal(seen.path, '/', 'the ticket left in the address bar');
  if (await student.locator('#journal-close').isVisible()) await student.locator('#journal-close').click();
  if (await student.locator('#wagon-done').isVisible()) await student.locator('#wagon-done').click();
  if (await student.locator('#tutorial-skip').isVisible()) await student.locator('#tutorial-skip').click();
  assert.equal(Object.values(world().households).filter(h => h.played).length, 1, 'more than one family is played');
  ok(`the solo game opens joined as hh-1 in ${world().households['hh-1'].settlementId}, rolled and running, no join form, no Start press; the other four families automatic`);

  const host = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__snapshot.world.status === 'running', null, { timeout: 15000 });
  ok('the solo class view opens from its Host address with the game already running');

  await playWholeGame({ app, student, host, ok, measured, shot });

  // ------------------------------------------------------------------ a new solo game, with the old one on screen
  const ended = app.state.sessionId;
  const next = app.newSoloGame('Solo reader again');
  assert.notEqual(app.state.sessionId, ended, 'a new game kept the old session');
  await student.waitForTimeout(1500);
  const again = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  again.on('pageerror', error => errors.push(`again: ${error.message}`));
  await again.goto(url + next.path);
  await again.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1' && window.__snapshot.world.status === 'running' && !window.__snapshot.world.ending, null, { timeout: 30000 });
  assert.equal(world().period ?? 1, 1, 'the new game did not start at the beginning');
  ok('after the ending, a new solo game is dealt with the old pages open, and opens joined and running from the beginning');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors on any page across the whole solo game');

  writeFileSync('docs/evidence/solo-game-browser.json', `${JSON.stringify({
    record: 'solo-game-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'Solo Mode end to end: the real solo server dealing on the real land; a solo game played from its dealt start to the road home through all three periods, the solo class view continuing it; a new game dealt after the end.',
    environment: `Same computer: an in-process solo classroom at ${TICK_MS} ms a tick with five families, four automatic, and headless Chrome; server/main.mjs --solo run for real only to check what it deals. Not the launcher's window, a real phone or a weak computer.`,
    checks: pass,
    measured,
    screenshots: shots,
    notProved: [
      'The launcher\'s Play Solo button and its window: proved by scripts/verify-launcher.ps1 and scripts/solo-browser-proof.mjs; this run enters through the same newSoloGame/enter path in process.',
      'The Study pace: the game here runs at 100 ms a tick.',
      'Every branch: one call answered, one winter order, one flight by hand; the period proofs press the rest.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/solo-game-browser.json`);
} finally {
  await browser.close();
  await app.close();
}

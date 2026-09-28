// A server outage in a real browser (2026-09-28, docs/audits/2026-09-28-classroom.md B3 and B5).
//
// Until then a student's page with the server out of reach for more than a second and a half went to the join screen for
// good, saying they were "no longer joined" and sending them for a family key; the projected Host page did the same; and a
// server killed outright left a lock that refused the next start. This proves, against the real server/main.mjs killed with
// no chance to stop cleanly: the student's and the Host's pages saying "Reconnecting" over the game and never going to the
// join screen, for an outage of 5 seconds and one of 30; the server started again on the same class (its lock taken over,
// the save backed up); both pages carrying on by themselves with the same family and the same class; and a student on a
// new Chromebook with no cookie and no family key getting their family back from the class code and their own name.
//
// Same computer only: headless Chrome, loopback. A Chromebook sleeping and waking, and a Wi-Fi roam, need devices.
// Run: npm run test:reconnect
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = { outages: [] };
const shots = [];
const errors = [];
const dataDir = mkdtempSync(join(tmpdir(), 'texas-reconnect-proof-'));
const probe = createServer();
await new Promise(done => probe.listen(0, '127.0.0.1', done));
const port = probe.address().port;
await new Promise(done => probe.close(done));
const url = `http://127.0.0.1:${port}`;

let server = null;
function launch() {
  const child = spawn(process.execPath, ['server/main.mjs'], { cwd: root, env: { ...process.env, TEXAS_DATA_DIR: dataDir, PORT: String(port), PLAYERS: '6', TICK_MS: '1000', SAVE_PATH: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const record = { child, log: '', exited: new Promise(done => child.on('exit', done)) };
  child.stdout.on('data', chunk => { record.log += chunk; });
  child.stderr.on('data', chunk => { record.log += chunk; });
  return record;
}
async function healthy(limitMs = 60000) {
  for (const until = Date.now() + limitMs; Date.now() < until;) {
    if (server.child.exitCode !== null) throw new Error(`the server exited:\n${server.log}`);
    try { if ((await fetch(`${url}/health`)).ok) return; } catch { /* not yet */ }
    await new Promise(done => setTimeout(done, 150));
  }
  throw new Error(`the server did not answer:\n${server.log}`);
}
const post = async (path, body) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${await response.clone().text()}`);
  return response.json();
};
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/reconnect-${name}.png`; await page.screenshot({ path }); shots.push(path); };
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const context = () => browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1366, height: 768 } });
const pageState = page => page.evaluate(() => ({
  banner: document.querySelector('#reconnecting').hidden ? null : document.querySelector('#reconnecting').textContent,
  join: !document.querySelector('#join').hidden, game: !document.querySelector('#game').hidden,
  householdId: window.__snapshot?.world.householdId || null, role: window.__snapshot?.world.role || null,
}));

try {
  server = launch();
  await healthy();
  const hostUrl = readFileSync(join(dataDir, 'host-url.txt'), 'utf8').trim();
  const save = () => JSON.parse(readFileSync(join(dataDir, 'classroom.json'), 'utf8'));
  const code = save().sessionCode, sessionId = save().sessionId;

  const student = await (await context()).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('#join [name=name]').fill('Reader');
  await student.locator('#join [name=code]').fill(code);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (const name of ['Second', 'Third', 'Fourth']) await post('/api/join', { name, code });
  // A student who joined on the first day and whose page is not open now: the one who comes back on a new Chromebook.
  await post('/api/join', { name: 'Cart Chromebook', code });
  const host = await (await context()).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(hostUrl.replace(/^http:\/\/localhost:\d+/, url));
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  ok('a class of five started from the Host page on the real server');

  for (const seconds of [5, 30]) {
    // ----------------------------------------------------------------------------------------- the outage
    server.child.kill('SIGKILL');
    await server.exited;
    const down = Date.now();
    assert.ok(existsSync(join(dataDir, 'classroom.json.lock')), 'killed outright, the server left its lock');
    await student.waitForFunction(() => !document.querySelector('#reconnecting').hidden, null, { timeout: 10000 });
    await host.waitForFunction(() => !document.querySelector('#reconnecting').hidden, null, { timeout: 10000 });
    const seen = [];
    while (Date.now() - down < seconds * 1000) {
      const [mine, teacher] = [await pageState(student), await pageState(host)];
      seen.push({ at: Date.now() - down, student: mine, host: teacher });
      assert.ok(!mine.join && mine.game && mine.banner, `the student's page left the game during the outage: ${JSON.stringify(mine)}`);
      assert.ok(!teacher.join && teacher.game && teacher.banner, `the Host page left the class during the outage: ${JSON.stringify(teacher)}`);
      await new Promise(done => setTimeout(done, 1000));
    }
    const words = [...new Set(seen.map(entry => entry.student.banner))];
    if (seconds === 5) await shot(student, 'outage-student');
    if (seconds === 30) {
      assert.ok(words.some(text => /^Still reconnecting \(\d+ seconds\)\. Your family is safe/.test(text)), `a long outage is not said as one: ${words.join(' | ')}`);
      await shot(host, 'outage-host');
    }
    ok(`${seconds} s with the server gone: both pages kept the game on screen under "${words.join('" then "')}", and never the join screen`);

    // ----------------------------------------------------------------------------------------- back
    server = launch();
    await healthy();
    const up = Date.now();
    assert.match(server.log, /did not stop cleanly \(process \d+ has ended\)\. The class was backed up to .+before-lock-recovery.+ and opened\./);
    await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1' && document.querySelector('#reconnecting').hidden && !document.querySelector('#game').hidden, null, { timeout: 30000 });
    const studentBack = Date.now() - up;
    await host.waitForFunction(() => window.__snapshot?.world.role === 'host' && document.querySelector('#reconnecting').hidden, null, { timeout: 30000 });
    const hostBack = Date.now() - up;
    const tick = await student.evaluate(() => window.__snapshot.world.tick);
    await student.waitForFunction(was => window.__snapshot.world.tick > was, tick, { timeout: 20000 });
    assert.equal(save().sessionId, sessionId, 'the same class');
    measured.outages.push({ seconds, words, studentBackMs: studentBack, hostBackMs: hostBack, samples: seen.length });
    ok(`the server started again on the same class (lock taken over, save backed up); the student's page was back with hh-1 ${studentBack} ms after, the Host's ${hostBack} ms after, and the class went on`);
  }

  // ------------------------------------------------------------------------------------------- a new Chromebook
  const cart = await (await context()).newPage();
  cart.on('pageerror', error => errors.push(`cart: ${error.message}`));
  await cart.goto(url);
  await cart.getByRole('button', { name: 'I was already in this class' }).click();
  await cart.locator('#away [name=away-code]').fill(code.toLowerCase());
  await cart.getByRole('button', { name: 'Show the names' }).click();
  await cart.waitForFunction(() => document.querySelectorAll('#away-names [data-claim]').length > 0);
  const names = await cart.evaluate(() => [...document.querySelectorAll('#away-names [data-claim]')].map(button => button.textContent));
  assert.ok(names.some(name => name.startsWith('Cart Chromebook')), `the student's own name is not on the list: ${names.join(' | ')}`);
  assert.ok(!names.some(name => name.startsWith('Reader')), 'a student playing now is not on the list');
  await shot(cart, 'names');
  await cart.locator('#away-names [data-claim]', { hasText: 'Cart Chromebook' }).click();
  await cart.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-5' && !document.querySelector('#game').hidden, null, { timeout: 30000 });
  measured.awayList = names;
  ok(`a student on a new Chromebook with no cookie and no key typed the class code, saw ${names.length} names (not the student playing), tapped their own and got hh-5 back`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/reconnect-browser.json', `${JSON.stringify({
    record: 'reconnect-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'docs/audits/2026-09-28-classroom.md B3 and B5: a student\'s and the Host\'s pages through a server outage of 5 s and of 30 s, the real server killed outright and started again on the same class, and the away list on a page with no cookie.',
    environment: 'Same computer: the real server/main.mjs as a child process on loopback, killed with TerminateProcess (SIGKILL), 1 s a tick, headless Chrome at 1366x768. Not a physical LAN, a Chromebook asleep, a Wi-Fi roam or the district network.',
    checks: pass,
    measured,
    screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/reconnect-browser.json`);
} finally {
  await browser.close();
  if (server && server.child.exitCode === null) { server.child.kill('SIGKILL'); await server.exited; }
  rmSync(dataDir, { recursive: true, force: true });
}

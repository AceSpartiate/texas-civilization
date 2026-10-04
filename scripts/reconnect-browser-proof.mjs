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
// The port the server is killed and started again on, and the pages reconnect to: kept for the whole proof, so it is chosen
// **below every system's ephemeral range** (Windows and macOS 49152-65535, Linux 32768-60999) and probed on 0.0.0.0, the address
// server/main.mjs takes. Until 2026-10-04 it was an ephemeral port probed on 127.0.0.1: while the server was down between a kill
// and its restart, a proof running beside this one was handed the same port by `listen(0)`, and the restart died with
// "listen EADDRINUSE 0.0.0.0:52700". Nothing else here asks the system for a port in this range, so nobody can be handed it.
const portFree = candidate => new Promise(done => { const probe = createServer(); probe.once('error', () => done(false)); probe.listen(candidate, '0.0.0.0', () => probe.close(() => done(true))); });
let port = 0;
for (let tries = 0; !port && tries < 200; tries++) { const candidate = 20000 + Math.floor(Math.random() * 12000); if (await portFree(candidate)) port = candidate; }
assert.ok(port, 'no free port below the ephemeral range');
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
  let code = save().sessionCode;
  const sessionId = save().sessionId;

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
    // While the server is down the first time, the class is given a code with a 0 and a 1 in it, so the steps below that type
    // it with O and l (classroom audit M2) meet the look-alikes every run; a dealt code has them only by chance. Nothing else
    // reads the code: cookies are named for the session, which is unchanged.
    if (seconds === 5) {
      const saved = save();
      saved.sessionCode = code = 'A0B1C0';
      writeFileSync(join(dataDir, 'classroom.json'), JSON.stringify(saved));
    }
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

  // ------------------------------------------------------------------------------------------- a name already in the class
  // Classroom audit M3 (triaged 2026-09-29 as 1.8): a second "Reader" is refused at the join, in words.
  const twin = await (await context()).newPage();
  twin.on('pageerror', error => errors.push(`twin: ${error.message}`));
  await twin.goto(url);
  await twin.locator('#join [name=name]').fill('reader');
  await twin.locator('#join [name=code]').fill(code);
  await twin.getByRole('button', { name: 'Join', exact: true }).click();
  await twin.waitForFunction(() => /is taken/.test(document.body.innerText), null, { timeout: 10000 });
  measured.duplicateName = await twin.evaluate(() => ({ said: [...document.querySelectorAll('[role=status], .message, #message')].map(one => one.textContent.trim()).find(text => /is taken/.test(text)) || document.body.innerText.match(/[^\n]*is taken[^\n]*/)?.[0], joined: Boolean(window.__snapshot?.world?.householdId) }));
  assert.ok(!measured.duplicateName.joined, 'a second Reader was given a family');
  assert.match(measured.duplicateName.said, /^Reader is taken — add your last initial\./);
  await shot(twin, 'name-taken');
  await twin.close();
  ok(`a second student typing "reader" is refused at the join: "${measured.duplicateName.said}"`);

  // ------------------------------------------------------------------------------------------- a fourth tab
  // Classroom audit M4 (triaged 2026-09-29 as 1.9): three tabs of one family are allowed; a fourth used to be refused (429),
  // and the page read that as a lost connection and said "Reconnecting…" for ever. Now the oldest is let go, says why and
  // stops asking; "Play here" takes it back from the next oldest.
  const readerContext = student.context();
  const tabs = [];
  for (let index = 0; index < 3; index++) {
    const tab = await readerContext.newPage();
    tab.on('pageerror', error => errors.push(`tab ${index + 2}: ${error.message}`));
    await tab.goto(url);
    await tab.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1' && !document.querySelector('#game').hidden, null, { timeout: 30000 });
    tabs.push(tab);
  }
  await student.waitForFunction(() => !document.querySelector('#replaced').hidden, null, { timeout: 10000 });
  const replacedAt = Date.now();
  const tabState = page => page.evaluate(() => ({ replaced: document.querySelector('#replaced').hidden ? null : document.querySelector('#replaced').textContent.trim(), reconnecting: !document.querySelector('#reconnecting').hidden, game: !document.querySelector('#game').hidden, join: !document.querySelector('#join').hidden }));
  // Left for eight seconds: it must not reconnect by itself and take a stream from another tab.
  await student.waitForTimeout(8000);
  const oldest = await tabState(student), newest = await Promise.all(tabs.map(tabState));
  assert.ok(oldest.replaced && /open in another tab or window/.test(oldest.replaced) && !oldest.reconnecting && oldest.game && !oldest.join, `the oldest tab: ${JSON.stringify(oldest)}`);
  assert.ok(newest.every(one => !one.replaced && !one.reconnecting && one.game), `the three newer tabs: ${JSON.stringify(newest)}`);
  const tickNow = await tabs[2].evaluate(() => window.__snapshot.world.tick);
  await tabs[2].waitForFunction(was => window.__snapshot.world.tick > was, tickNow, { timeout: 20000 });
  await shot(student, 'fourth-tab');
  measured.fourthTab = { oldest: oldest.replaced, stillAfterMs: Date.now() - replacedAt };
  ok(`a fourth tab of one family is never refused: the oldest says "${oldest.replaced}" and, left ${Math.round(measured.fourthTab.stillAfterMs / 1000)} s, neither reconnects nor takes a stream back; the newest tab plays on`);
  await student.getByRole('button', { name: 'Play here' }).click();
  await student.waitForFunction(() => document.querySelector('#replaced').hidden && document.querySelector('#reconnecting').hidden, null, { timeout: 10000 });
  await tabs[0].waitForFunction(() => !document.querySelector('#replaced').hidden, null, { timeout: 10000 });
  const backTick = await student.evaluate(() => window.__snapshot.world.tick);
  await student.waitForFunction(was => window.__snapshot.world.tick > was, backTick, { timeout: 20000 });
  ok('"Play here" takes the family back on the oldest tab, which updates again, and the next oldest is the one let go');
  for (const tab of tabs) await tab.close();

  // ------------------------------------------------------------------------------------------- a Chromebook put to sleep
  // Classroom audit M4: a page asleep leaves its socket open on the server, and until it died the family was missing from the
  // away list and its claim refused. Put to sleep here by pausing the page's script in the debugger (nothing of the page runs,
  // its socket stays open): it stops answering the server's ping and is let go within the server's 30 s, and the student
  // takes the family up at another Chromebook with the class code typed O for 0 and l for 1. (Chrome's own "frozen" page
  // lifecycle, tried first, still answered every ping in headless Chrome, so it is not a sleep.)
  const cdp = await cart.context().newCDPSession(cart);
  await cdp.send('Debugger.enable');
  await cdp.send('Debugger.pause');
  const frozenAt = Date.now();
  const typed = code.toLowerCase().replaceAll('0', 'o').replaceAll('1', 'l');
  const other = await (await context()).newPage();
  other.on('pageerror', error => errors.push(`other Chromebook: ${error.message}`));
  await other.goto(url);
  await other.getByRole('button', { name: 'I was already in this class' }).click();
  await other.locator('#away [name=away-code]').fill(typed);
  let listed = [];
  for (const until = Date.now() + 60000; Date.now() < until;) {
    await other.getByRole('button', { name: 'Show the names' }).click();
    await other.waitForTimeout(1500);
    listed = await other.evaluate(() => [...document.querySelectorAll('#away-names [data-claim]')].map(button => button.textContent));
    if (listed.some(name => name.startsWith('Cart Chromebook'))) break;
  }
  const listedAfter = Date.now() - frozenAt;
  assert.ok(listed.some(name => name.startsWith('Cart Chromebook')), `the sleeping Chromebook's family never came onto the away list: ${listed.join(' | ')}`);
  assert.ok(listedAfter < 50000, `it took ${listedAfter} ms`);
  await other.locator('#away-names [data-claim]', { hasText: 'Cart Chromebook' }).click();
  await other.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-5' && !document.querySelector('#game').hidden, null, { timeout: 30000 });
  await shot(other, 'slept-claimed');
  measured.slept = { codeTyped: typed, codeHadLookAlikes: /[01]/.test(code), listedAfterMs: listedAfter };
  ok(`a Chromebook asleep (its page's script paused) is let go: its family was on the away list ${Math.round(listedAfter / 1000)} s after, and taken up at another device with the code typed "${typed}" (the code ${measured.slept.codeHadLookAlikes ? 'has' : 'has no'} 0 or 1)`);
  await cdp.send('Debugger.resume');
  await cart.waitForFunction(() => !document.querySelector('#join').hidden, null, { timeout: 30000 });
  ok('woken, the old Chromebook finds itself signed out and at the join screen, as a family taken up elsewhere does');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/reconnect-browser.json', `${JSON.stringify({
    record: 'reconnect-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'docs/audits/2026-09-28-classroom.md B3 and B5: a student\'s and the Host\'s pages through a server outage of 5 s and of 30 s, the real server killed outright and started again on the same class, and the away list on a page with no cookie. Since 2026-09-29 (M3, M4, M2): a duplicate name refused at the join, a fourth tab letting the oldest go, and a page asleep let go and its family claimed with the code typed O/l.',
    environment: 'Same computer: the real server/main.mjs as a child process on loopback, killed with TerminateProcess (SIGKILL), 1 s a tick, headless Chrome at 1366x768. The sleep is the page\'s script paused in the debugger (CDP Debugger.pause), which stops the page answering with its socket open; a real Chromebook\'s lid, Wi-Fi drop and TCP are not exercised. Not a physical LAN, a Wi-Fi roam or the district network.',
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

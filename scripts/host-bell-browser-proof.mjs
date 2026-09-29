// The bell, on the Host page (design audit 2026-09-28 B2, docs/HOST_PAGE.md §2.8).
//
// tests/lifecycle.test.mjs proves the rules: Stop for today saves the class paused and stops a server that can stop, and the next
// launch opens the same class paused for Resume. This proves what a teacher meets: End Game pressed once does nothing but ask,
// in words that say it ends the whole game for everyone and cannot be undone, and disarms itself; Stop for today, pressed twice,
// tells every page the class was stopped for today and the server stops; the server launched again on the same save opens the
// same class on the same day, paused, with Stop for today, End Game and Resume offered and Stop Server not; and Resume carries
// the class on.
//
// Same computer only: headless Chrome, two classroom servers one after the other in this process on one save file, the way the
// launcher opens the save tomorrow. Run: npm run test:host-bell
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/host-bell-${name}.png`; await page.screenshot({ path }); shots.push(path); };

const dir = mkdtempSync(join(tmpdir(), 'texas-bell-'));
const savePath = join(dir, 'class.json');
let stopAsked = 0;
let app = createClassroom({ savePath, seed: 'host-bell', playerCount: 5, tickMs: 200, stopDelayMs: 50, onStopRequested: () => { stopAsked++; } });
let url = `http://127.0.0.1:${await app.listen(0, '127.0.0.1')}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const button = (page, action) => page.locator(`#host-controls [data-action="${action}"]`);
const shown = page => page.evaluate(() => [...document.querySelectorAll('#host-controls button')].filter(one => !one.hidden).map(one => one.dataset.action));

try {
  for (let i = 1; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Family ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  let host = await context.newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'running');
  await host.waitForFunction(() => (window.__snapshot?.world.minute ?? 0) > 0, null, { timeout: 30000 });
  measured.running = await shown(host);
  assert.ok(measured.running.includes('stop-for-today') && measured.running.includes('end'), `the Host's controls while the class runs: ${measured.running}`);
  assert.ok(!measured.running.includes('stop-server'), 'Stop Server stands beside Stop for today while a class is under way');
  ok(`while the class runs the Host offers ${measured.running.join(', ')}: Stop for today beside End Game, and no bare Stop Server`);

  // ------------------------------------------------------------------------------------------- End Game asks, and says what it does
  await button(host, 'end').click();
  const armed = { label: (await button(host, 'end').textContent()).trim(), notice: (await host.locator('#host-notice').textContent()).trim(), noticeShown: await host.locator('#host-notice').isVisible() };
  measured.endArmed = armed;
  assert.equal(armed.label, 'Confirm: end the whole game');
  assert.ok(armed.noticeShown, 'End Game armed says nothing on the page');
  assert.match(armed.notice, /ends the whole game for everyone and shows everybody the ending\. If it was a mistake, Classes can take the class up again/);
  assert.match(armed.notice, /Stop for today/, 'the words do not point a teacher at the bell to Stop for today');
  await host.waitForTimeout(400);
  assert.equal(app.state.world.status, 'running', 'one press of End Game ended the class');
  await shot(host, 'end-armed');
  ok(`one press of End Game ends nothing: it reads "${armed.label}" and the page says "${armed.notice}"`);
  await host.waitForFunction(() => document.querySelector('#host-controls [data-action="end"]').textContent === 'End Game' && document.querySelector('#host-notice').hidden, null, { timeout: 10000 });
  assert.equal(app.state.world.status, 'running');
  ok('left alone, End Game disarms itself and its words go; the class runs on');

  // ------------------------------------------------------------------------------------------- the pace, kept with the class
  // Classroom audit M1 (triaged 2026-09-29 as 1.5): the pace chosen today comes back next class. Quick rather than Brisk only
  // so the rest of this proof, which waits on ticks, is not slowed further from its 200 ms.
  await host.locator('#host-pace [data-pace="quick"]').click();
  await host.waitForFunction(() => window.__snapshot?.tickMs === 1000 && document.querySelector('#host-pace [data-pace="quick"]').dataset.active === 'true', null, { timeout: 10000 });
  ok('the teacher chose Quick on the Host page, and its button is lit');

  // ------------------------------------------------------------------------------------------- Stop for today
  const before = { minute: app.state.world.minute, session: app.state.sessionId };
  await button(host, 'stop-for-today').click();
  measured.todayArmed = { label: (await button(host, 'stop-for-today').textContent()).trim(), notice: (await host.locator('#host-notice').textContent()).trim() };
  assert.equal(measured.todayArmed.label, 'Confirm: save and stop for today');
  assert.match(measured.todayArmed.notice, /pauses the class and saves it/);
  assert.equal(app.state.world.status, 'running', 'one press of Stop for today stopped the class');
  await button(host, 'stop-for-today').click();
  await host.waitForFunction(() => window.__snapshot?.lifecycle?.state === 'stopping', null, { timeout: 10000 });
  const told = (await host.locator('#lifecycle').textContent()).trim();
  measured.told = told;
  assert.match(told, /stopped the class for today/);
  const saved = JSON.parse(readFileSync(savePath, 'utf8'));
  assert.equal(saved.world.status, 'paused', 'the class was not saved paused');
  await host.waitForTimeout(200);
  assert.equal(stopAsked, 1, 'the server was not asked to stop');
  const stoppedAt = saved.world.minute;
  await shot(host, 'stopped');
  ok(`Stop for today, pressed twice, saves the class paused at minute ${stoppedAt} and stops the server; the page says "${told}"`);

  // ------------------------------------------------------------------------------------------- the next class
  await host.close();
  await app.close();
  app = createClassroom({ savePath, playerCount: 5, tickMs: 200 });
  url = `http://127.0.0.1:${await app.listen(0, '127.0.0.1')}`;
  assert.equal(app.state.sessionId, before.session, 'the next launch opened another class');
  host = await context.newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__snapshot.world.status === 'paused', null, { timeout: 15000 });
  measured.reopened = { minute: app.state.world.minute, controls: await shown(host), date: (await host.locator('#world').textContent()).trim() };
  assert.equal(measured.reopened.minute, stoppedAt, 'the class did not open where it stopped');
  assert.ok(measured.reopened.controls.includes('resume') && measured.reopened.controls.includes('stop-for-today') && measured.reopened.controls.includes('end'), `the Host's controls next class: ${measured.reopened.controls}`);
  assert.ok(!measured.reopened.controls.includes('new-class'), 'a paused class was offered New Class');
  await shot(host, 'next-class');
  ok(`the next launch opens the same class paused where it stopped ("${measured.reopened.date}"), offering ${measured.reopened.controls.join(', ')}`);
  measured.reopened.pace = await host.evaluate(() => ({ tickMs: window.__snapshot.tickMs, lit: [...document.querySelectorAll('#host-pace [data-pace]')].filter(one => one.dataset.active === 'true').map(one => one.dataset.pace) }));
  assert.equal(app.pace, 1000, `the next launch opened at ${app.pace} ms a tick, not the Quick chosen before the stop`);
  assert.deepEqual(measured.reopened.pace, { tickMs: 1000, lit: ['quick'] }, `the Host page next class: ${JSON.stringify(measured.reopened.pace)}`);
  ok('and at the pace chosen before the stop: Quick, lit on the Host page, though this server was launched at 200 ms a tick');
  await button(host, 'resume').click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 10000 });
  await host.waitForFunction(minute => window.__snapshot.world.minute > minute, stoppedAt, { timeout: 30000 });
  ok('Resume carries the class on from where it stopped');

  // ------------------------------------------------------------------------------------------- End Game by mistake, and Continue
  // Owner, 2026-09-28: "Yes, allow Continue" (docs/HOST_PAGE.md §2.8). End Game, asked twice, ends the class and shows the
  // ending; Classes takes it up again where it was, paused, and the ending goes.
  await button(host, 'pause').click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'paused', null, { timeout: 10000 });
  const beforeEnd = { minute: app.state.world.minute, date: (await host.locator('#world').textContent()).trim() };
  await button(host, 'end').click();
  await button(host, 'end').click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'ended' && window.__snapshot.world.ending?.host, null, { timeout: 10000 });
  await host.locator('#ending').waitFor({ state: 'visible', timeout: 10000 });
  if (await host.locator('#ending-close').isVisible()) await host.locator('#ending-close').click();
  await host.locator('#classes-toggle').click();
  const again = host.locator('[data-class-continue]');
  await again.waitFor({ state: 'visible', timeout: 15000 });
  measured.ended = { line: (await host.locator('.class-entry[data-open=true] .class-line').textContent()).trim(), label: (await again.textContent()).trim() };
  assert.match(measured.ended.line, /ended part-way/, `the Classes list does not say the class was ended part-way: ${measured.ended.line}`);
  await shot(host, 'ended-continue');
  await again.click();
  assert.match((await again.textContent()).trim(), /^Confirm: continue /, 'Continue did not ask a second time');
  assert.equal(app.state.world.status, 'ended', 'one press of Continue took the class up again');
  await again.click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'paused' && !window.__snapshot.world.ending, null, { timeout: 15000 });
  assert.equal(app.state.world.minute, beforeEnd.minute, 'the class was not taken up again where it was ended');
  assert.equal(await host.locator('#ending').isVisible(), false, 'the ending is still on the Host page');
  measured.continued = { note: (await host.locator('#classes-note').textContent()).trim(), date: (await host.locator('#world').textContent()).trim(), controls: await shown(host) };
  assert.ok(measured.continued.controls.includes('resume'), `Resume is not offered after Continue: ${measured.continued.controls}`);
  await shot(host, 'continued');
  await button(host, 'resume').click();
  await host.waitForFunction(minute => window.__snapshot?.world.status === 'running' && window.__snapshot.world.minute > minute, beforeEnd.minute, { timeout: 30000 });
  ok(`End Game asked twice ends the class ("${measured.ended.line}"); Classes' "${measured.ended.label}", asked twice, takes it up again where it was (${measured.continued.date}), the ending gone, and Resume goes on`);

  // At phone width the controls wrap and the page does not scroll sideways.
  await host.setViewportSize({ width: 400, height: 800 });
  await host.waitForTimeout(400);
  const overflow = await host.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the Host page scrolls sideways at 400 px by ${overflow}px`);
  ok('at 400 px the Host page does not scroll sideways');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/host-bell-browser.json', `${JSON.stringify({
    record: 'host-bell-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'Design audit 2026-09-28 B2: End Game asked twice in words; Stop for today saves the class paused and stops the server; the next launch opens it paused and Resume goes on; a class ended by mistake continued from Classes (owner 2026-09-28) (docs/HOST_PAGE.md §2.8).',
    environment: 'Same computer: two local classroom servers one after the other on one save file, at 200 ms a tick, five families joined by request, headless Chrome. The server\'s stop is a callback here; the launcher\'s own exit is Stop Server\'s, proved by tests/lifecycle.test.mjs. Not a physical LAN or a classroom.',
    checks: pass,
    measured,
    screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/host-bell-browser.json`);
} finally {
  await browser.close();
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}

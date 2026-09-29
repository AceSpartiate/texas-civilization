// Two of the owner's answers of 2026-09-29 on the Host's page (docs/HOST_PAGE.md §2.11 and §2.12).
//
// tests/lobby-ready.test.mjs and tests/empty-pause.test.mjs prove the rules on the server. This proves what a teacher meets:
//
// - **"Show name + ready"**: in the lobby each row of *The class* names the student playing the family, and a student who walks
//   the die, the name, the looks and presses **Done packing** in their own page is marked *ready* on the Host's row; a student
//   who has done none of it is named and not marked. Start is unchanged, and after it the mark goes and the name stays.
// - **"Pause after 3 min"**: a running class whose last student page closes pauses itself once the span has passed (shortened
//   here to 3 seconds), the Host's page says so plainly in words, and Resume carries the class on and the words go.
//
// Same computer only: headless Chrome, one local classroom server in this process. Run: npm run test:host-lobby
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/host-lobby-${name}.png`; await page.screenshot({ path }); shots.push(path); };

const EMPTY_MS = 3000;
const dir = mkdtempSync(join(tmpdir(), 'texas-host-lobby-'));
const app = createClassroom({ savePath: join(dir, 'class.json'), seed: 'host-lobby', playerCount: 5, tickMs: 200, worldFactory: createGonzalesWorld, emptyPauseMs: EMPTY_MS });
const url = `http://127.0.0.1:${await app.listen(0, '127.0.0.1')}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const rowOf = (page, householdId) => page.evaluate(id => {
  const item = document.querySelector(`#host-families [data-household-id="${id}"]`);
  return item && { student: item.querySelector('.host-student')?.textContent || null, ready: item.querySelector('.host-ready')?.textContent || null, readyTitle: item.querySelector('.host-ready')?.title || null };
}, householdId);

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const host = await context.newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__snapshot.world.status === 'lobby');

  // ------------------------------------------------------------------------------------------- the lobby: name and ready
  // Its own browser context: the Host's cookie is not the student's.
  const student = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Sam Reyes');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => Boolean(window.__snapshot?.world.householdId));
  const sam = await student.evaluate(() => window.__snapshot.world.householdId);
  // A second student, joined and nothing more.
  const ana = (await (await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Ana Cruz', code: app.state.sessionCode }) })).json()).world.householdId;
  await host.waitForFunction(ids => ids.every(id => document.querySelector(`#host-families [data-household-id="${id}"] .host-student`)), [sam, ana], { timeout: 15000 });
  measured.joined = { sam: await rowOf(host, sam), ana: await rowOf(host, ana) };
  assert.equal(measured.joined.sam.student, 'Sam Reyes');
  assert.equal(measured.joined.ana.student, 'Ana Cruz');
  assert.equal(measured.joined.sam.ready, null, 'a family that has done nothing is marked ready');
  ok('in the lobby each joined family\'s row names its student ("Sam Reyes", "Ana Cruz"), and neither is marked ready yet');

  await meetFamily(student, 'Reyes');
  await student.locator('#wagon-load').waitFor({ state: 'visible', timeout: 20000 });
  assert.equal((await rowOf(host, sam)).ready, null, 'a family made but still packing is marked ready');
  await student.locator('#wagon-done').click();
  await host.waitForFunction(id => Boolean(document.querySelector(`#host-families [data-household-id="${id}"] .host-ready`)), sam, { timeout: 15000 });
  measured.ready = { sam: await rowOf(host, sam), ana: await rowOf(host, ana) };
  assert.equal(measured.ready.sam.ready, 'ready');
  assert.equal(measured.ready.sam.readyTitle, 'Rolled, named and packed');
  assert.equal(measured.ready.ana.ready, null, 'a family whose student did nothing is marked ready');
  await host.locator('#host-class').scrollIntoViewIfNeeded();
  await shot(host, 'ready');
  ok('a student who rolls, names, chooses the looks and presses Done packing in their own page is marked "ready" on the Host\'s row; the one who did nothing is not');
  const studentText = await student.evaluate(() => JSON.stringify(window.__snapshot));
  assert.ok(!studentText.includes('Ana Cruz') && !studentText.includes('"students"'), 'a student\'s page was sent the other students\' names');
  ok('the student\'s page is sent no other student\'s name');

  // Start is unchanged: it waits for nobody.
  await host.getByRole('button', { name: 'Start' }).click();
  // Two of five joined: the page asks once more, as it always has ("Press Start again to begin anyway").
  await host.waitForTimeout(500);
  if (app.state.world.status === 'lobby') await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 15000 });
  await host.waitForFunction(id => !document.querySelector(`#host-families [data-household-id="${id}"] .host-ready`), sam, { timeout: 15000 });
  measured.started = { sam: await rowOf(host, sam) };
  assert.equal(measured.started.sam.student, 'Sam Reyes', 'the student\'s name went from the row at Start');
  ok('Start begins the class with one family not ready, as before; after it the ready mark goes and the student\'s name stays');

  // ------------------------------------------------------------------------------------------- the class left empty pauses itself
  // The student's page is still open: the class runs past the span.
  await host.waitForTimeout(EMPTY_MS + 1500);
  assert.equal(app.state.world.status, 'running', 'a class with a student\'s page open paused itself');
  assert.equal(await host.locator('#host-paused').isVisible(), false);
  ok(`with a student's page open the class runs on past ${EMPTY_MS / 1000} s`);
  await student.close();
  const closedAt = Date.now();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'paused', null, { timeout: EMPTY_MS + 15000 });
  measured.pausedAfterMs = Date.now() - closedAt;
  assert.ok(measured.pausedAfterMs >= EMPTY_MS - 250, `the class paused ${measured.pausedAfterMs} ms after the last page closed, inside the span`);
  await host.locator('#host-paused').waitFor({ state: 'visible', timeout: 10000 });
  measured.words = (await host.locator('#host-paused').textContent()).trim();
  measured.status = (await host.locator('#world').textContent()).trim();
  assert.match(measured.words, /^The class paused itself at .+: no student had the game open for 3 seconds, so nothing went on without them\. Press Resume when the class is back\.$/);
  const controls = await host.evaluate(() => [...document.querySelectorAll('#host-controls button')].filter(one => !one.hidden).map(one => one.dataset.action));
  assert.ok(controls.includes('resume'), `Resume is not offered: ${controls}`);
  await shot(host, 'paused-itself');
  ok(`the last student page closed, the class paused itself ${measured.pausedAfterMs} ms later and the Host's page says "${measured.words}" (${measured.status}), with Resume offered`);
  const minute = app.state.world.minute;
  await host.locator('#host-controls [data-action="resume"]').click();
  await host.waitForFunction(at => window.__snapshot?.world.status === 'running' && window.__snapshot.world.minute > at, minute, { timeout: 15000 });
  assert.equal(await host.locator('#host-paused').isVisible(), false, 'the words stayed after Resume');
  ok('Resume carries the class on and the words go');

  // At phone width the Host page does not scroll sideways with the new words.
  await host.setViewportSize({ width: 400, height: 800 });
  await host.waitForTimeout(400);
  const overflow = await host.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the Host page scrolls sideways at 400 px by ${overflow}px`);
  ok('at 400 px the Host page does not scroll sideways');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/host-lobby-browser.json', `${JSON.stringify({
    record: 'host-lobby-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'Owner 2026-09-29: "Show name + ready" (the Host\'s lobby rows) and "Pause after 3 min" (a class left with no student page pauses itself and says so) (docs/HOST_PAGE.md §2.11, §2.12).',
    environment: `Same computer: one local classroom server at 200 ms a tick, the empty span shortened to ${EMPTY_MS} ms, one student page and one student joined by request, headless Chrome. Not a physical LAN or a classroom.`,
    checks: pass,
    measured,
    screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/host-lobby-browser.json`);
} finally {
  await browser.close();
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}

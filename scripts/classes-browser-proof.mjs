// The teacher's class controls in a real browser (2026-09-28, docs/audits/2026-09-28-classroom.md B1, B2, B6 and the owner's
// "Plan for several class days").
//
// tests/late-join.test.mjs, tests/classes.test.mjs and tests/class-days.test.mjs prove the rules over HTTP. This proves what
// a teacher and a student see: the Host's lobby saying how many class days a game takes at each pace and how many families
// the class has; the class made thirty from the Host's page and thirty students joined; after Start, a late student joining
// from the join form into the first family nobody plays, and the next into the family the teacher chose; the thirty-first
// refused in words; where the class is and the days left; and the classes on this computer - a new one made with a name and
// a size, the first opened again with its code and its thirty students, and a student's page that had been signed out by
// the switch carrying on by itself when its class came back.
//
// Same computer only: headless Chrome. Run: npm run test:classes
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
const dir = mkdtempSync(join(tmpdir(), 'texas-classes-proof-'));
const app = createClassroom({ seed: 'classes-proof', playerCount: 15, tickMs: 1500, savePath: join(dir, 'classroom.json'), worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const joinApi = async name => {
  const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, code: app.state.sessionCode }) });
  return { status: response.status, body: await response.json() };
};
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/classes-${name}.png`; await page.screenshot({ path }); shots.push(path); };
const context = () => browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1366, height: 768 } });
async function studentJoins(name) {
  const page = await (await context()).newPage();
  page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
  await page.goto(url);
  await page.locator('#join [name=name]').fill(name);
  await page.locator('#join [name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  return page;
}

try {
  // ------------------------------------------------------------------------------------------- the lobby
  const host = await (await context()).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const lobby = await host.evaluate(() => ({ days: document.querySelector('#class-days').textContent, daysShown: !document.querySelector('#class-days').hidden, connection: document.querySelector('#connection').textContent, sizeShown: !document.querySelector('#class-size-row').hidden }));
  assert.ok(lobby.daysShown, 'the class days are not shown before Start');
  // 1.5 s a tick is no named pace, so none is marked "(now)".
  assert.match(lobby.days, /^A whole game takes about 6–11 class days at Study · 3–5 at Brisk · 1–2 at Quick, counting 40 minutes of play a day\.$/);
  assert.match(lobby.connection, /15 families$/);
  assert.ok(lobby.sizeShown);
  measured.lobby = lobby;
  ok(`before Start the Host says "${lobby.days}" and "${lobby.connection}"`);
  await host.selectOption('#class-size', '30');
  await host.click('#class-size-set');
  await host.waitForFunction(() => window.__snapshot?.classSize === 30 && /30 families$/.test(document.querySelector('#connection').textContent));
  ok('the class made thirty families from the Host\'s page, and the Host says so');
  await shot(host, 'lobby');

  // ------------------------------------------------------------------------------------------- thirty students
  const first = await studentJoins('First student');
  await first.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 24; i++) assert.equal((await joinApi(`Student ${i}`)).status, 200);
  await host.waitForFunction(() => window.__snapshot?.presence?.joined === 24);
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  await host.waitForFunction(() => /^Now: the autumn of 1835 \(period 1 of 3\), about \d+% of the way through\. Left: about .+ class days at Study/.test(document.querySelector('#class-days').textContent), null, { timeout: 20000 });
  measured.running = await host.evaluate(() => document.querySelector('#class-days').textContent);
  ok(`after Start: "${measured.running}"`);
  const rows = await host.evaluate(() => document.querySelectorAll('.host-family').length);
  assert.equal(rows, 30);
  ok('the class panel lists all thirty families');

  // ------------------------------------------------------------------------------------------- late students
  const late = await studentJoins('Late student');
  await late.waitForFunction(() => window.__snapshot?.world.householdId && !document.querySelector('#game').hidden, null, { timeout: 30000 });
  assert.equal(await late.evaluate(() => window.__snapshot.world.householdId), 'hh-25');
  // The class's first tick can still be on its way (1.5 s a tick here) when the late student's page opens: waited for, not raced.
  assert.ok(await late.waitForFunction(() => window.__snapshot?.world.tick > 0, null, { timeout: 15000 }).then(() => true, () => false), 'into the class already going');
  ok('a student who joins from the join form after Start plays hh-25, the first family nobody plays, in the class already going');
  await host.waitForFunction(() => [...document.querySelectorAll('#late-seat option')].some(option => option.value === 'hh-30'));
  assert.equal(await host.evaluate(() => !document.querySelector('#late').hidden), true);
  const choices = await host.evaluate(() => [...document.querySelectorAll('#late-seat option')].map(option => option.textContent));
  measured.lateChoices = choices;
  await host.selectOption('#late-seat', 'hh-30');
  await host.waitForFunction(() => window.__snapshot?.lateSeat === 'hh-30');
  await shot(host, 'late');
  const chosen = await joinApi('Chosen student');
  assert.equal(chosen.body.world.householdId, 'hh-30');
  ok(`the teacher chose hh-30 from "${choices[0]}", …, and the next late student was given it`);
  for (const name of ['A', 'B', 'C', 'D']) assert.equal((await joinApi(`Late ${name}`)).status, 200);
  assert.equal(Object.keys(app.state.clients).length, 30);
  ok('thirty students in thirty families');
  const refused = await studentJoins('Thirty-first');
  await refused.waitForFunction(() => /Every family in this class already has a student/.test(document.querySelector('#join-error').textContent));
  await shot(refused, 'full');
  ok('the thirty-first is told in words that every family has a student and to ask the teacher');
  await refused.close();

  // ------------------------------------------------------------------------------------------- several classes
  await host.getByRole('button', { name: 'Pause' }).click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'paused');
  const firstCode = app.state.sessionCode, firstId = app.state.sessionId;
  await host.click('#classes-toggle');
  await host.waitForFunction(() => document.querySelectorAll('#classes-list .class-entry').length === 1);
  await host.fill('#class-new-name', 'Period 4');
  await host.selectOption('#class-new-size', '8');
  await host.click('#class-new-make');
  assert.match(await host.textContent('#class-new-make'), /^Confirm: new class "Period 4"$/);
  await host.click('#class-new-make');
  await host.waitForFunction(code => window.__snapshot?.sessionCode !== code && window.__snapshot?.classSize === 8 && window.__snapshot?.className === 'Period 4', firstCode);
  await host.waitForFunction(() => document.querySelectorAll('#classes-list .class-entry').length === 2);
  const list = await host.evaluate(() => [...document.querySelectorAll('#classes-list .class-entry')].map(item => item.textContent));
  measured.classes = list;
  assert.match(list[0], /^Period 4 · code \w{6} · 0 of 8 families joined · not startedOpen now$/);
  assert.match(list[1], new RegExp(`^Class ${firstCode} · code ${firstCode} · 30 of 30 families joined · paused, (September|October) \\d+, 1835 \\(period 1\\)OpenDelete$`));
  ok(`a new class "Period 4" of 8 families, and the first kept: ${list[1].replace(/OpenDelete$/, '')}`);
  await shot(host, 'classes');
  // The first class's student was signed out by the switch; their page listens for their class to come back.
  await first.waitForFunction(() => !document.querySelector('#join').hidden, null, { timeout: 20000 });
  measured.signedOutWords = await first.textContent('#join-error');
  ok(`the first class's student is told: "${measured.signedOutWords}"`);

  const open = host.locator(`#classes-list [data-class-open="${firstId}"]`);
  await open.click();
  assert.match(await open.textContent(), /^Confirm: open Class /);
  await open.click();
  await host.waitForFunction(code => window.__snapshot?.sessionCode === code && window.__snapshot?.world.status === 'paused' && window.__snapshot?.presence?.joined === 30, firstCode, { timeout: 20000 });
  ok(`the first class opened again: the same code ${firstCode}, paused, thirty students`);
  const backAt = Date.now();
  await first.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1' && !document.querySelector('#game').hidden && document.querySelector('#join').hidden, null, { timeout: 30000 });
  measured.studentBackMs = Date.now() - backAt;
  ok(`and its student's page, left on the join screen, carried on with hh-1 by itself ${measured.studentBackMs} ms later`);
  await host.getByRole('button', { name: 'Resume' }).click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'running');
  ok('Resume plays the class on');

  // ------------------------------------------------------------------------------------------- deleting a kept class
  // Owner, 2026-09-28: "Yes, with a confirm" (docs/HOST_PAGE.md §2.9). The open class has no Delete; a kept one asks twice, goes
  // off the list and into the archive folder, and the panel says where.
  await host.waitForFunction(() => document.querySelectorAll('#classes-list .class-entry').length === 2);
  assert.equal(await host.locator('#classes-list .class-entry[data-open=true] [data-class-delete]').count(), 0, 'the open class can be deleted');
  const period4 = host.locator('#classes-list .class-entry[data-open=false]').filter({ hasText: 'Period 4' });
  const periodId = await period4.getAttribute('data-class-id');
  const remove = period4.locator('[data-class-delete]');
  await remove.click();
  assert.match(await remove.textContent(), /^Confirm: delete Period 4$/);
  assert.ok(existsSync(join(dir, 'classes', `${periodId}.json`)), 'one press of Delete took the class away');
  await shot(host, 'delete-armed');
  await remove.click();
  await host.waitForFunction(() => document.querySelectorAll('#classes-list .class-entry').length === 1, null, { timeout: 15000 });
  measured.deleted = (await host.textContent('#classes-note')).trim();
  assert.match(measured.deleted, new RegExp(`^Period 4 was taken off the list and kept: its save is now archive/classes-${periodId}-deleted-[\\w-]+\\.json`), `the panel says: ${measured.deleted}`);
  assert.equal(existsSync(join(dir, 'classes', `${periodId}.json`)), false, 'the class is still on the shelf');
  assert.ok(readdirSync(join(dir, 'archive')).some(name => name.startsWith(`classes-${periodId}-deleted-`)), 'the class is not in the archive');
  assert.equal(app.state.world.status, 'running', 'deleting a kept class touched the class being played');
  await shot(host, 'deleted');
  ok(`Delete, asked twice, took "Period 4" off the list and into the archive, and the panel says so: "${measured.deleted}"`);

  // ------------------------------------------------------------------------------------------- phone width
  await host.setViewportSize({ width: 400, height: 800 });
  await host.waitForTimeout(400);
  const scroll = await host.evaluate(() => ({ width: document.documentElement.scrollWidth, inner: window.innerWidth }));
  assert.ok(scroll.width <= scroll.inner, `the Host page scrolls sideways at 400 px: ${scroll.width} > ${scroll.inner}`);
  ok('at 400 px the Host page does not scroll sideways');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/classes-browser.json', `${JSON.stringify({
    record: 'classes-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'docs/audits/2026-09-28-classroom.md B1, B2, B6 and the owner\'s "Plan for several class days": class days on the Host before Start and after; class size 30 from the Host; late students into free and chosen families; the thirty-first refused in words; several classes kept and opened again, a signed-out student page carrying on by itself.',
    environment: 'Same computer: an in-process classroom on the real land, 1.5 s a tick, 30 families, headless Chrome at 1366x768. Not a physical LAN, a classroom or a Chromebook.',
    checks: pass,
    measured,
    screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/classes-browser.json`);
} finally {
  await browser.close();
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}

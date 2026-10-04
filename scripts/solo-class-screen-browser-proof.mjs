// Play Solo's class screen, in a real browser (triage 2026-09-29, 3.17; design audit M35): "Solo is thinner: the spotlight goes only
// to a Host that solo does not have, and the solo window does not say so." The fix the triage suggests: the spotlight's words in the
// solo journal, and one line that says so.
//
// A solo game served in process (server/app.mjs with `solo: true`, entered by its one-use link as the launcher enters it), its world
// made with three moments already lit - a fight, the family's own house burned (already in its own record), and its house burned while
// it is away (`tell: false`, which in a class the projector shows everybody). The player makes the family and packs; then: the
// journal's mark is lit; opened, the journal has *The class screen* with its one line, the two moments newest first with their day,
// apart from what the family has heard, and the mark goes out; the family's own moment is in its remembered story and not said twice.
// And a student in a class has no such section (the server sends a class student nothing of it, tests/solo.test.mjs).
//
// Same computer only: headless Chrome at 1366x768. Run: npm run test:solo-class-screen
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { spotlight } from '../sim/host.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [], observed = {}, shots = [], errors = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
mkdirSync('docs/evidence', { recursive: true });

const FIGHT = 'The fight at the ford above the town: the volunteers go out of the timber against the dragoons.';
const OWN = 'The Texas army sets fire to the family\'s house and field.';
const AWAY = 'Foragers burn the family\'s house and field while it is away.';
const lit = world => {
  const home = world.map.sites[world.households['hh-1'].homeSiteId];
  spotlight(world, { key: 'proof-fight', text: FIGHT, x: home.x, y: home.y, claimId: 'HIST-GONZ-004' });
  world.minute += 60;
  spotlight(world, { key: 'proof-own', text: OWN, siteId: home.id, householdId: 'hh-1' });
  world.minute += 60;
  spotlight(world, { key: 'proof-away', text: AWAY, siteId: home.id, householdId: 'hh-1', tell: false });
  world.minute -= 120;
  return world;
};
const worldFactory = (seed, count) => lit(createGonzalesWorld(seed, count, { neighbours: true }));
const dir = mkdtempSync(join(tmpdir(), 'texas-solo-screen-'));
const solo = createClassroom({ seed: 'solo-class-screen', playerCount: 5, savePath: join(dir, 'solo.json'), tickMs: 400, solo: true, worldFactory });
const plain = createClassroom({ seed: 'solo-class-screen-class', playerCount: 5, savePath: join(dir, 'class.json'), tickMs: 400, worldFactory });
const soloUrl = `http://127.0.0.1:${await solo.listen(0, '127.0.0.1')}`, classUrl = `http://127.0.0.1:${await plain.listen(0, '127.0.0.1')}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
try {
  const game = await (await fetch(`${soloUrl}/api/solo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: solo.state.hostKey }) })).json();
  assert.ok(game.playUrl, `no solo game was dealt: ${JSON.stringify(game)}`);
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${soloUrl}${new URL(game.playUrl).pathname}${new URL(game.playUrl).search}`);
  await page.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1' && window.__snapshot.solo === true, null, { timeout: 60000 });
  await meetFamily(page, 'Proofwright', { timeout: 30000 });
  await page.locator('#wagon-load').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#wagon-done').click();
  await page.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 30000 });
  for (let i = 0; i < 4; i++) { if (await page.locator('#tip:not([hidden]) .tip-close').isVisible()) await page.locator('#tip .tip-close').click(); await page.waitForTimeout(200); }

  // ------------------------------------------------------------------ the journal's mark, then the journal
  observed.before = await page.evaluate(() => ({ unread: !document.querySelector('#journal-unread').hidden, sent: (window.__snapshot.spotlights || []).map(line => line.text) }));
  assert.deepEqual(observed.before.sent, [
    'Foragers burn the family\'s house and field while it is away.',
    'The fight at the ford above the town: the volunteers go out of the timber against the dragoons.',
  ], 'the solo page was not sent the class screen\'s moments, newest first, without the family\'s own');
  assert.equal(observed.before.unread, true, 'the journal\'s mark is not lit for the class screen\'s moments');
  await page.screenshot({ path: 'docs/evidence/solo-class-screen-mark.png' }); shots.push('docs/evidence/solo-class-screen-mark.png');
  ok('the solo page is sent the class screen\'s two moments, newest first, and the journal\'s mark is lit');

  await page.locator('#journal-toggle').click();
  await page.locator('#class-screen').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#class-screen').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  observed.journal = await page.evaluate(() => ({
    heading: document.querySelector('#class-screen h3').textContent,
    note: document.querySelector('#class-screen-note').textContent,
    empty: !document.querySelector('#class-screen-empty').hidden,
    lines: [...document.querySelectorAll('#class-screen-lines li')].map(li => li.textContent),
    edge: getComputedStyle(document.querySelector('#class-screen-lines li')).borderLeftColor,
    afterHeard: document.querySelector('#reports').compareDocumentPosition(document.querySelector('#class-screen')) === Node.DOCUMENT_POSITION_FOLLOWING,
    story: [...document.querySelectorAll('#event-log li')].map(li => li.textContent),
    unread: !document.querySelector('#journal-unread').hidden,
  }));
  await page.screenshot({ path: 'docs/evidence/solo-class-screen-journal.png' }); shots.push('docs/evidence/solo-class-screen-journal.png');
  assert.equal(observed.journal.heading, 'The class screen');
  assert.match(observed.journal.note, /teacher's screen.*Playing alone, they come here/, 'the one line does not say why they are here');
  assert.equal(observed.journal.empty, false);
  assert.equal(observed.journal.lines.length, 2, `the class screen has ${observed.journal.lines.length} lines`);
  assert.match(observed.journal.lines[0], /Foragers burn the family's house and field while it is away\./);
  assert.match(observed.journal.lines[1], /^September \d+ The fight at the ford above the town/, `the moment has no day before it: ${observed.journal.lines[1]}`);
  assert.equal(observed.journal.afterHeard, true, 'the class screen is not set apart after what the family has heard');
  assert.ok(observed.journal.story.some(line => line.startsWith(OWN)), 'the family\'s own moment is not in its remembered story');
  assert.ok(observed.journal.lines.every(line => !line.includes(OWN)), 'the family\'s own moment was said twice');
  assert.equal(observed.journal.unread, false, 'opening the journal did not put the mark out');
  ok(`the journal: "${observed.journal.heading}" with its one line ("${observed.journal.note}"), the two moments newest first with their day, after what the family has heard; the family's own moment once, in its own story; the mark out`);

  // ------------------------------------------------------------------ a class: nothing of it
  const student = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  student.on('pageerror', error => errors.push(`class: ${error.message}`));
  await student.goto(classUrl);
  await student.locator('[name=name]').fill('Class student');
  await student.locator('[name=code]').fill(plain.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  observed.classPage = await student.evaluate(() => ({ section: !document.querySelector('#class-screen').hidden, sent: 'spotlights' in window.__snapshot }));
  assert.deepEqual(observed.classPage, { section: false, sent: false }, 'a student in a class has the class screen in the journal');
  ok('a student in a class: no class screen in the journal, and nothing of it sent - the teacher\'s screen is theirs');

  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page errors');
} finally {
  writeFileSync('docs/evidence/solo-class-screen-browser.json', `${JSON.stringify({ proof: 'npm run test:solo-class-screen', when: new Date().toISOString(), pass, observed, shots, errors, note: 'Same computer only: headless Chrome at 1366x768, the solo game served in process. No Chromebook, launcher window or classroom.' }, null, 2)}\n`);
  await browser.close();
  await solo.close(); await plain.close();
  rmSync(dir, { recursive: true, force: true });
}
console.log(`${pass.length} checks passed`);

// The ending's reveal of the snow march and the surprise at Béxar, on the Host's closing screen and a family's (owner,
// 2026-09-26: the true story of the snow march goes to the teacher "At the ending"; sim/surprise.mjs `surpriseReveal`,
// public/ending.js `revealView`; docs/battle-research/surprise-at-bexar.md §6).
//
// **Where it is shown (owner, 2026-09-30, "Reveal at winter's end").** The standings between periods are coin and land only
// (design audit B4, 06b82e6a, 2026-09-28), with one amendment: when the winter - the second period - closes on March 13, the
// reveal comes with them, as the explanation of how Santa Anna's army arrived so fast; and it comes again at the class's end.
// This proves both:
//   1. a class played in process to the evening of March 13, a few minutes before the second period stops; two students join
//      (1366x768 and 1024x768) and the Host starts it. When it stops, the Host's screen and each family's show the standings so
//      far - coin and land, no glory on the wire - and the reveal with them, readable in the panel, nothing sideways;
//   2. the same class played in process on through the spring (the Host's Continue, `beginThirdPeriod`, as the teacher's
//      button does it) to a day before the class's own end on April 25; two students join, the Host starts it, it ends by itself,
//      and the teacher skips ahead through the end sequence (sim/end-sequence.mjs) to the final numbers. Then the Host's closing
//      view and each family's carry the reveal - the belief in the grass, the warnings, the bell, the snow of February 13-14 in
//      Coahuila with Santa Anna ahead of it at Guerrero, and the Yucatán dead of Urrea's norther - readable in the panel without
//      the page scrolling sideways.
// Same computer, headless Chrome. Run: npm run test:surprise-reveal
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { stepWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { beginThirdPeriod } from '../sim/periods.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { alamoClass } from './support/alamo-class.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const directory = mkdtempSync(join(tmpdir(), 'texas-reveal-'));
/** The class a little before the second period stops on the night of March 13. */
function lateClass(seed, count) {
  const world = alamoClass(seed, count);
  world.status = 'running';
  const end = momentOf(world, 'alamo-end');
  for (let i = 0; i < 20000 && world.status === 'running' && world.minute < end - 1500; i++) stepWorld(world);
  assert.ok(world.director.milestones['alamo-siege'] && !world.director.milestones['alamo-end'], `the class is not between the siege and the period's end: ${world.status} at ${world.minute} of ${end}`);
  world.status = 'lobby';
  return world;
}
/** The same class through the second period's end, continued into the spring, and played to a day before the class's own end. */
function springClass(seed, count) {
  const world = lateClass(seed, count);
  world.status = 'running';
  for (let i = 0; i < 2000 && world.status === 'running'; i++) stepWorld(world);
  assert.ok(world.director.milestones['alamo-end'], 'the second period did not reach its end');
  beginThirdPeriod(world);
  world.status = 'running';
  const end = momentOf(world, 'scrape-end');
  for (let i = 0; i < 20000 && world.status === 'running' && world.minute < end - 1440; i++) stepWorld(world);
  assert.ok(world.status === 'running' && !world.director.complete, `the spring ended before the Host started it: ${world.status} at ${world.minute} of ${end}`);
  world.status = 'lobby';
  return world;
}
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const evidence = { screens: [] };
const apps = [];
async function pageFor(viewport) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
const shot = async (page, name) => { const path = `test-results/surprise-reveal-${name}.png`; await page.screenshot({ path }); evidence.screens.push(path); };
const VIEWPORTS = { 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 } };
/** A classroom on `factory`'s class, its Host page and two students' pages, and the Host's Start pressed. */
async function classOn(factory, label) {
  const app = createClassroom({ seed: 'surprise-reveal', playerCount: 5, tickMs: 300, savePath: join(directory, `${label}.json`), worldFactory: factory });
  apps.push(app);
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const host = await pageFor({ width: 1366, height: 768 });
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const students = {};
  for (const [householdId, viewport] of Object.entries(VIEWPORTS)) {
    const page = await pageFor(viewport);
    await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    await meetFamily(page, { 'hh-1': 'Garrison', 'hh-2': 'Faraway' }[householdId]);
    students[householdId] = page;
  }
  await host.waitForFunction(() => window.__snapshot.connected === 2);
  // Nothing of the reveal while the class runs.
  assert.equal(await host.evaluate(() => 'ending' in window.__snapshot.world), false, 'the Host had an ending before the class stopped');
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  if (!(await host.waitForFunction(() => ['running', 'ended'].includes(window.__snapshot.world.status), null, { timeout: 3000 }).then(() => true, () => false))) {
    await host.getByRole('button', { name: /Start/ }).first().click();
    await host.waitForFunction(() => ['running', 'ended'].includes(window.__snapshot.world.status));
  }
  return { app, host, students, date: await host.evaluate(() => window.__snapshot.world.historicalDate) };
}
/** The ending panel on the screen at this width, and the page not scrolling sideways. */
async function panelOn(page, width) {
  await page.locator('#ending').waitFor({ state: 'visible', timeout: 120000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at ${width}x768 by ${overflow}px`);
  const box = await page.locator('#ending').boundingBox();
  assert.ok(box && box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= 768, `the ending panel is not on the screen at ${width}x768`);
}
/** The reveal as the page drew it, scrolled into view in the ending panel. */
async function revealOn(page, width) {
  await panelOn(page, width);
  await page.locator('#ending .ending-reveal').waitFor({ state: 'attached', timeout: 20000 });
  await page.locator('#ending .ending-reveal').scrollIntoViewIfNeeded();
  const text = (await page.locator('#ending .ending-reveal').innerText()).replace(/\s+/g, ' ');
  await panelOn(page, width);
  return text;
}
const SAID = [/grass/, /Herrera/, /bell/, /snow/, /February 13/, /Coahuila/, /sixteen inches/, /Guerrero/, /Urrea/, /February 25/];
/** Whatever of the reveal is on the page's wire: the Host's closing view's, or a family's. */
const revealOnWire = page => page.evaluate(() => { const ending = window.__snapshot?.world?.ending; return Boolean(ending?.host?.reveal || ending?.family?.reveal); });

try {
  mkdirSync('test-results', { recursive: true });

  // ------------------------------------------- 1. the winter's close on March 13: the standings so far, and the snow march with them
  const winter = await classOn(lateClass, 'winter');
  ok(`a class played in process to ${winter.date}, two students joined, the Host started it; no ending on the wire while it ran`);
  for (const [page, width, who, name] of [[winter.host, 1366, 'the Host', 'host'], [winter.students['hh-1'], 1366, 'hh-1', 'hh-1'], [winter.students['hh-2'], 1024, 'hh-2', 'hh-2']]) {
    await panelOn(page, width);
    await page.waitForFunction(() => window.__snapshot?.world?.ending);
    assert.equal(await page.locator('#ending-eyebrow').textContent(), 'THE STORY SO FAR', `${who}'s screen is not the standings so far`);
    const ending = await page.evaluate(() => window.__snapshot.world.ending.host || window.__snapshot.world.ending.family);
    assert.equal(ending.interim, true, `${who}'s ending is not the interim`);
    // Coin and land, and no glory: the one story the winter's close tells is the snow march (owner, 2026-09-30).
    assert.doesNotMatch(JSON.stringify(ending), /glory|"final"|"awards"|"winners"/i, `${who}'s standings so far carry glory`);
    const text = await revealOn(page, width);
    for (const said of SAID) assert.match(text, said, `${who}'s reveal at the winter's close does not say ${said}`);
    await shot(page, `winter-${name}-${width}`);
  }
  ok('when the winter closes on March 13, the Host\'s screen and both families\' show the standings so far - coin and land, no glory - and the reveal of the snow march with them, in the panel at 1366x768 and 1024x768, nothing sideways (owner, 2026-09-30, "Reveal at winter\'s end")');
  for (const page of [winter.host, ...Object.values(winter.students)]) await page.context().close();

  // ---------------------------------------------------------------- 2. the class's own end: the end sequence, then the reveal
  const spring = await classOn(springClass, 'spring');
  ok(`the same class carried on in process through the spring to ${spring.date}, two students joined, the Host started it; no ending on the wire while it ran`);
  await spring.host.waitForFunction(() => window.__snapshot?.world?.status === 'ended', null, { timeout: 120000 });
  // The end sequence (owner, 2026-09-29, D10): the class video, the families' videos, and then the final numbers. The teacher
  // skips ahead, stage by stage, as test:end-sequence proves a teacher can; the videos themselves are that proof's.
  for (const stage of ['class', 'family']) {
    await spring.host.waitForFunction(stage => window.__snapshot?.endSequence?.stage === stage, stage, { timeout: 30000 });
    assert.equal(await revealOnWire(spring.host), false, `the reveal was on the wire during the ${stage} stage`);
    await spring.host.locator('#finale-skip').click();
  }
  for (const page of [spring.host, ...Object.values(spring.students)]) await page.waitForFunction(() => window.__snapshot?.endSequence?.stage === 'reveal' && window.__snapshot.world.ending, null, { timeout: 30000 });
  assert.equal(await spring.host.evaluate(() => window.__snapshot.world.ending.host.interim), false, 'the class\'s own end came as standings so far');
  const hostText = await revealOn(spring.host, 1366);
  for (const said of SAID) assert.match(hostText, said, `the Host's reveal does not say ${said}`);
  await shot(spring.host, 'host-1366');
  ok(`at the class's own end, after the teacher skipped to the final numbers, the Host's closing view reveals it at 1366x768: "${hostText.slice(0, 200)}…"`);
  for (const [householdId, page] of Object.entries(spring.students)) {
    const width = VIEWPORTS[householdId].width;
    const text = await revealOn(page, width);
    for (const said of SAID) assert.match(text, said, `${householdId}'s reveal does not say ${said}`);
    await shot(page, `${householdId}-${width}`);
    ok(`${householdId}'s ending reveals it too, in its panel at ${width}x768, nothing sideways`);
  }

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  evidence.verdict = 'PASS';
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/surprise-reveal-browser.json`);
} catch (error) {
  evidence.verdict = 'FAIL'; evidence.failure = error.message;
  throw error;
} finally {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync(evidence.verdict === 'PASS' ? 'docs/evidence/surprise-reveal-browser.json' : 'test-results/surprise-reveal-browser-failed.json', `${JSON.stringify({
    record: 'surprise-reveal-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    environment: 'Same computer: local classroom servers and headless Chrome at 1366x768 (Host, hh-1) and 1024x768 (hh-2), 300 ms a tick. A real class on the colonies map with rolled families, played in process through the first period and the second to the evening of March 13, 1836; and the same class continued in process through the spring to April 24, its end sequence skipped by the teacher to the final numbers. Not physical LAN or district acceptance.',
    checks: pass, ...evidence,
  }, null, 2)}\n`);
  await browser.close();
  for (const app of apps) await app.close();
  rmSync(directory, { recursive: true, force: true });
}

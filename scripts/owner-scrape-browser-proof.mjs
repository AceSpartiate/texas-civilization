// The owner's answers of 2026-09-29 to the triage's D9, in the browser (docs/SCRAPE.md §18-§19; tests/owner-scrape.test.mjs proves
// the rules): a student whose family lives at San Felipe, told nothing yet, has no card to leave and no way to make ready; the word of
// the Alamo's fall or of the columns reaches the family by the express, and the main person's card opens early - what it heard, what going now costs, the load with
// the tools, the chest and the spinning wheel each with its room; the hiding is on the bar; the student loads the chest, leaves before
// the order, is asked twice in its own words, and the family is on the road with the crop lost and the chest in the wagon.
//
// The class is a real one on the colonies map with rolled families, played in process through the first two periods and continued
// into the spring; the seed is one whose first family lives at San Felipe, ordered out on March 28, which on the morning of March 14
// has heard nothing yet of the fall or of the columns: the word comes to it in the class, by the game's own riders.
//
// Same computer only: headless Chrome. Run: npm run test:owner-scrape
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { isEarlyTopic } from '../sim/early-word.mjs';
import { goodCount } from '../sim/flight-goods.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const SEED = 'owner-scrape-10';

function inTheSpring(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginThirdPeriod(world);
  const household = world.households['hh-1'];
  // Nothing heard yet of the advance at San Felipe on the morning of March 14: the word comes in the class, by the express.
  const heard = Object.keys(world.knowledge.households['hh-1']).filter(isEarlyTopic);
  if (heard.length) throw new Error(`The first family has heard already: ${heard.join(', ')}`);
  household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  household.resources = { ...household.resources, food: 60, seed: 4, powder: 2, cotton: 0 };
  household.tools = { hoe: 0, axe: 0 };
  household.belongings = ['bedding', 'pot', 'chest', 'spinning-wheel'];
  household.field = { ...household.field, crop: 'corn', state: 'planted', grownMs: 0, changedTick: world.tick };
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 4000, worldFactory: inTheSpring });
assert.equal(app.state.world.period, 3, 'the class did not reach the spring');
assert.equal(app.state.world.households['hh-1'].settlementId, 'san-felipe', 'the first family does not live at San Felipe');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const shots = [];

try {
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Early reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(student);
  for (let i = 2; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  const host = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running');
  // The server's world as it is now (a copy: `app.state` is cloned on every read).
  const hh = () => app.state.world.households['hh-1'];
  const main = hh().mainId || hh().principalId;
  const portrait = student.locator(`.panel-portrait[data-portrait="${main}"]`);

  // Nothing heard: no card, no making ready.
  await student.waitForTimeout(2500);
  await portrait.click();
  await student.waitForTimeout(1200);
  observed.before = await student.evaluate(() => ({ early: Boolean(window.__snapshot.world.early), flight: Boolean(window.__snapshot.world.flight), card: !document.querySelector('#selection-flight')?.hidden, hide: Boolean(document.querySelector('.panel-row[data-focused=true] .panel-icon[data-key="flee-hide"]')) }));
  assert.deepEqual(observed.before, { early: false, flight: false, card: false, hide: false }, `the family could go before it heard anything: ${JSON.stringify(observed.before)}`);
  assert.equal(hh().flight, undefined);
  ok('before any news, the family has no card to leave and no hiding on the bar, and no order');

  // The word reaches it by the game's own riders (sim/expresses.mjs, sim/advance-word.mjs): the card opens early.
  await student.waitForFunction(() => window.__snapshot?.world.early?.status === 'early', null, { timeout: 300000 });
  observed.heard = Object.values(app.state.world.knowledge.households['hh-1']).filter(report => isEarlyTopic(report.topicId)).map(report => ({ topicId: report.topicId, status: report.status, source: report.source, minute: report.receivedMinute }));
  await portrait.click();
  await student.locator('#selection-flight [data-action="flee"]').waitFor({ state: 'visible', timeout: 15000 });
  observed.card = (await student.locator('#selection-flight').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.card, /Nobody has told the family to leave yet, but it has heard: /);
  assert.match(observed.card, /Going now: The crop in the field is left standing with nobody to tend it or bring it in, and is lost; the house is left empty/);
  assert.match(observed.card, /There is corn in the field now\./);
  assert.match(observed.card, /Each tool and thing for the house says its room below\. What is not loaded is left in the house\./);
  assert.match(observed.card, /hoe \(1 in the house, 0\.5 each\)/);
  assert.match(observed.card, /felling axe \(1 in the house, 1 each\)/);
  // The rest of what the wagon brought in, only with a wagon (owner, 2026-09-30), under its own line.
  assert.match(observed.card, /For the house, only in a wagon, if there is room: bedding \(1 in the house, 2\.5 each\)/);
  assert.match(observed.card, /iron pot \(1 in the house, 1\.25 each\)/);
  assert.match(observed.card, /chest \(1 in the house, 4 each\)/);
  assert.match(observed.card, /spinning wheel \(1 in the house, 3 each\)/);
  assert.equal(await student.locator('#selection-flight [data-action="flee"]').textContent(), 'Leave now, before the order');
  await student.waitForTimeout(4500);
  const told = app.state.world.events.filter(event => event.householdId === 'hh-1' && /may make ready and go now, before any order comes/.test(event.text || ''));
  assert.equal(told.length, 1, 'the family was not told once in its journal');
  assert.equal(hh().flight, undefined, 'the family was ordered out');
  ok(`the word comes, and the main person's card opens early: "${observed.card.slice(0, 170)}…"`);
  await student.screenshot({ path: 'docs/evidence/owner-scrape-early-card.png' }); shots.push('docs/evidence/owner-scrape-early-card.png');

  // Making ready on the news: the hiding is on the bar.
  await student.locator('.panel-row[data-focused=true] .panel-icon[data-key="flee-hide"]').waitFor({ state: 'visible', timeout: 15000 });
  await student.locator('.panel-row[data-focused=true] .panel-icon[data-key="flee-hide"]').click();
  await student.waitForFunction(() => window.__snapshot.world.household?.readying?.hid === true, null, { timeout: 120000 });
  ok('the hiding is on the bar on the news, and done before any order: the mark waits for the flight');

  // The load: the chest and the hoe with the food; the axe and the wheel left to the hiding.
  await portrait.click();
  await student.locator('#selection-flight [data-action="flee"]').waitFor({ state: 'visible', timeout: 15000 });
  const room = await student.evaluate(() => window.__snapshot.world.early.room);
  const have = await student.evaluate(() => window.__snapshot.world.early.have);
  const food = Math.min(have.food - 2, Math.floor((room - have.seed - 0.1 * have.powder - 0.5 - 4 + 1e-9) / 0.25));
  const set = async (good, n) => student.locator(`#selection-flight .flight-amount[data-take="${good}"]`).fill(String(n));
  await set('food', food); await set('seed', have.seed); await set('powder', have.powder); await set('cotton', 0); await set('hoe', 1); await set('chest', 1); await set('axe', 0); await set('spinning-wheel', 0);
  observed.tally = await student.locator('#flight-room').evaluate(one => ({ text: one.textContent, over: one.dataset.over }));
  assert.equal(observed.tally.over, 'false', `the load does not fit: ${observed.tally.text}`);
  // No room left, said plainly; and the bedding on top of it is too much, said so (owner, 2026-09-30).
  assert.match(observed.tally.text, /is full: there is no room left for anything more\./, `the full cart was not said to be full: ${observed.tally.text}`);
  await set('bedding', 1);
  observed.overBedding = await student.locator('#flight-room').evaluate(one => ({ text: one.textContent, over: one.dataset.over }));
  assert.equal(observed.overBedding.over, 'true');
  assert.match(observed.overBedding.text, /That is more than there is room for: take something out\./);
  await set('bedding', 0);
  ok(`the tally says plainly when nothing more fits ("${observed.tally.text}") and when the bedding is too much ("${observed.overBedding.text}")`);
  await student.screenshot({ path: 'docs/evidence/owner-scrape-early-load.png' }); shots.push('docs/evidence/owner-scrape-early-load.png');
  await student.locator('#selection-flight [data-action="flee"]').click();
  observed.confirm = await student.locator('#selection-flight [data-action="flee"]').textContent();
  assert.equal(observed.confirm, 'Confirm: leave now, and lose the crop');
  assert.equal(hh().flight, undefined, 'one press sent the family');
  await student.locator('#selection-flight [data-action="flee"]', { hasText: 'Confirm' }).click();
  try { await student.waitForFunction(() => window.__snapshot?.world.flight?.status === 'fled', null, { timeout: 15000 }); }
  catch (error) { throw new Error(`The family did not leave: "${await student.locator('#error').textContent().catch(() => '')}" - ${(await student.locator('#selection-flight').innerText()).replace(/\s+/g, ' ').slice(0, 400)}`); }
  const household = hh();
  assert.ok(isEarlyTopic(household.flight.early?.topicId), 'the flight is not marked early');
  assert.equal(household.flight.early.crop, 'corn');
  assert.equal(household.field.state, 'bare', 'the crop was not lost');
  assert.equal(household.flight.orderedMinute, undefined);
  assert.equal(household.flight.hid, true, 'the hiding did not go onto the flight');
  assert.deepEqual([goodCount(household, 'chest'), goodCount(household, 'hoe'), goodCount(household, 'axe'), goodCount(household, 'spinning-wheel')], [1, 1, 0, 0]);
  assert.deepEqual({ axe: household.flight.cache?.axe, wheel: household.flight.cache?.['spinning-wheel'] }, { axe: 1, wheel: 1 }, 'the axe and the wheel were not hidden');
  observed.left = { cache: household.flight.cache, left: household.flight.left || null, early: household.flight.early };
  ok(`asked twice ("${observed.confirm}"), the family leaves before its order with ${food} food, ${have.seed} seed, the hoe and the chest; the corn is lost; the axe and the wheel are hidden in the river bottom`);
  await student.waitForTimeout(600);
  await student.screenshot({ path: 'docs/evidence/owner-scrape-early-road.png' }); shots.push('docs/evidence/owner-scrape-early-road.png');

  await student.setViewportSize({ width: 400, height: 860 });
  await student.waitForTimeout(600);
  const overflow = await student.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  ok('at phone width the page does not scroll sideways');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/owner-scrape-browser.json', `${JSON.stringify({
    record: 'The Runaway Scrape\'s own choices (owner, 2026-09-29, triage D9), in a browser: docs/SCRAPE.md §18-§19',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map with rolled families, played in process through two periods and continued into the spring, the first family at San Felipe; its hearing of the Alamo\'s fall taken away at the start and given back in the class by the server\'s own learn(). No LAN or district claim.',
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}

// Help between families, remembered and repaid, in the browser: the owner's answer of 2026-09-28 to the design audit's B5 -
// "Yes: they remember and repay" (sim/neighbourly.mjs, public/neighbours.js).
//
// tests/neighbourly.test.mjs proves the rules. This proves what two students do and see: in the autumn of 1835 one family's
// student opens Neighbours, sees a San Felipe family a few miles off (the nearest two the seed deals) raising its walls, presses *Offer a trade* (triage 2026-09-29, 2.6),
// which sends its main person there and opens the trade with somebody of that family when they arrive, makes an offer the other
// student's page is shown, and puts them to the raising; in the spring, told to leave, the family that was helped is asked whether to offer room in its wagon and says yes;
// the helper's student is offered it by name, remembering the walls, and accepts, and its wagon holds more; and when the class
// ends, both families' pages and the Host's say who helped whom.
//
// A real class on the colonies map with rolled families. The raising is played live. The months between are played in process
// (as scripts/scrape-browser-proof.mjs plays them), the two families set down as unplayed while they are so nobody's decision
// holds the calendar, and set back as the students' when the spring's word has come. Planted, and said so: the helped family's
// house set at its last course of walls with the logs for it, so one neighbour's afternoon raises it; and each family's stores at
// the spring (the helper more than its wagon holds, the helped family little), so the one has room to offer and the other needs it.
//
// Same computer only: headless Chrome. Run: npm run test:neighbours
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as joinPath } from 'node:path';
import { readSave, writeSave } from '../server/storage.mjs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { PIECES } from '../sim/houseplot.mjs';
import { flightRoom } from '../sim/scrape.mjs';
import { NEAR_MILES, canHelp, deedsOf, goodsSpace, homeMiles } from '../sim/neighbourly.mjs';
import { meetFamily } from './support/meet-family.mjs';

import { openMore } from './support/short-bar.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const PLAYERS = 8;
/**
 * The class and its two families, chosen by what the proof needs and not by number: the first seed `neighbours-proof-<n>` that
 * deals two San Felipe families homes within `NEAR_MILES` of each other, and the nearest two such (the same seed and count deal the
 * same land, so the class's own deal is read here). The earlier of the two in the join order is the one helped. Until 2026-09-29
 * `neighbours-proof-1` put hh-1 and hh-4 six miles apart; the burn zone's sides shuffled by the seed (owner, D12, `burnSides` in
 * sim/colonies-region.mjs) moved whose land is where, and hh-4 went to eleven miles off with no other San Felipe family near.
 */
function neighbourPair(playerCount) {
  for (let n = 1; n <= 60; n++) {
    const seed = `neighbours-proof-${n}`;
    const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
    for (const household of Object.values(world.households)) rollFamily(world, household);
    const felipe = Object.values(world.households).filter(household => household.settlementId === 'san-felipe');
    const pairs = felipe.flatMap((one, i) => felipe.slice(i + 1).map(other => ({ ids: [one.id, other.id], miles: homeMiles(world, one, other) })))
      .filter(pair => pair.miles <= NEAR_MILES).sort((a, b) => a.miles - b.miles);
    if (pairs.length) return [seed, ...pairs[0].ids.sort((a, b) => seat(a) - seat(b))];
  }
  throw new assert.AssertionError({ message: `no seed deals two San Felipe families within ${NEAR_MILES} miles` });
}
/** A family's place in the join order: students join families in order (server/app.mjs `/api/join`), hh-1 first. */
function seat(id) { return Number(id.split('-')[1]); }
const [SEED, HELPED, HELPER] = neighbourPair(PLAYERS);

function autumn(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let tick = 0; tick < 600 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  // The helped family's house at its last course of walls, with the logs for it (planted: see the head of this file).
  applyAction(world, HELPED, { action: 'plan-house', layout: 'round-log' });
  const household = world.households[HELPED];
  const pen = household.house.pieces[0];
  pen.stage = PIECES[pen.type].stages.findLastIndex(stage => /^course/.test(stage.id));
  household.logs = { wall: 60, sill: 4, poor: 0 };
  world.status = 'lobby';
  return world;
}

/** The months to the spring, in process, and on to San Felipe's word to leave; the two families set down while it runs. */
function toTheSpring(world) {
  const played = Object.values(world.households).filter(household => household.played).map(household => household.id);
  for (const id of played) delete world.households[id].played;
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginThirdPeriod(world); world.status = 'running';
  const told = () => [HELPED, HELPER].every(id => world.households[id].flight?.status === 'ordered');
  for (let i = 0; i < 6000 && !told(); i++) stepWorld(world);
  assert.ok(told(), 'San Felipe was never told to leave');
  for (const id of played) world.households[id].played = true;
  // The stores at the spring (planted: see the head of this file).
  const helped = world.households[HELPED], helper = world.households[HELPER];
  helped.resources = { ...helped.resources, food: 8, seed: 0, cotton: 0, powder: 0 };
  helper.resources = { ...helper.resources, seed: 4, cotton: 0, powder: 0, food: Math.ceil((flightRoom(world, helper).room + 4) / 0.25) };
  // Paused again, as the teacher left it: the Host resumes the class.
  world.status = 'paused';
}

// The class is saved to a file of its own: the months between are played on the save, and the class opened again from it on the
// same address, as a teacher's class is opened the next day (the server's state is its own; `app.state` is a copy).
const directory = mkdtempSync(joinPath(tmpdir(), 'neighbours-proof-'));
const savePath = joinPath(directory, 'class.json');
let app = createClassroom({ seed: SEED, playerCount: PLAYERS, tickMs: 700, savePath, worldFactory: autumn });
const world = () => app.state.world;
assert.ok(homeMiles(world(), world().households[HELPED], world().households[HELPER]) <= NEAR_MILES, 'the two families are not neighbours');
observed.families = { seed: SEED, helped: HELPED, helper: HELPER, miles: Number(homeMiles(world(), world().households[HELPED], world().households[HELPER]).toFixed(2)) };
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const join = async name => {
  const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, code: app.state.sessionCode }) });
  assert.equal(response.status, 200);
};
async function page(name, householdId, surname) {
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`${householdId}: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill(name);
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
  await meetFamily(student, surname);
  return student;
}
/** The Neighbours sheet open, whichever way it is now. */
async function openNeighbours(student) {
  await student.locator('#neighbours-toggle').waitFor({ state: 'visible', timeout: 30000 });
  if (await student.locator('#neighbours').getAttribute('data-open') !== 'true') await student.locator('#neighbours-toggle').click();
  await student.waitForFunction(() => document.querySelector('#neighbours')?.dataset.open === 'true');
}
const text = async (student, selector) => (await student.locator(selector).innerText()).replace(/\s+/g, ' ').trim();

try {
  // Everybody joins in seat order, the two students at their seats and readers at the others, so each lands on their family.
  let helped = null, helper = null;
  for (let i = 1; i <= PLAYERS; i++) {
    if (i === seat(HELPED)) helped = await page('Helped reader', HELPED, 'Walker');
    else if (i === seat(HELPER)) helper = await page('Helper reader', HELPER, 'Hale');
    else await join(`Reader ${i}`);
  }
  const host = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await helper.waitForFunction(() => window.__snapshot?.world.status === 'running');

  // The bar's "Go to a neighbour's homestead" opens this list (owner, 2026-09-29: the card beside a person, with its list of
  // homesteads and "Go there", is gone; docs/FAMILY_PANEL.md, amendment 2026-09-29).
  await helper.locator('#neighbours-toggle').waitFor({ state: 'visible', timeout: 30000 });
  if (await helper.locator('#neighbours').getAttribute('data-open') === 'true') await helper.locator('#neighbours-close').click();
  // The neighbour's homestead waits behind "More" on a short bar (owner, 2026-10-09, "Short bar + More"): opened first, as a student does.
  await helper.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icon[data-visit], .panel-row[data-focused=true] .panel-more'), null, { timeout: 30000 });
  await openMore(helper);
  const visit = helper.locator('.panel-row[data-focused=true] .panel-icon[data-visit]');
  await visit.waitFor({ state: 'attached', timeout: 30000 });
  await visit.evaluate(node => node.click());
  await helper.waitForFunction(() => document.querySelector('#neighbours')?.dataset.open === 'true', null, { timeout: 5000 });
  assert.equal(await helper.locator('#selection').isVisible(), false, 'the bar\'s way to a neighbour opened the card beside the person');
  ok('the bar\'s "Go to a neighbour\'s homestead" opens the Neighbours list, and no card');
  // Autumn: the helper's student finds the raising on its Neighbours list and sends somebody.
  await openNeighbours(helper);
  const row = helper.locator(`#neighbours-list [data-household="${HELPED}"]`);
  await row.waitFor({ state: 'visible', timeout: 30000 });
  observed.row = await row.innerText();
  assert.match(observed.row, /Raising their walls now/);
  const go = row.locator('button[data-go]');
  const goer = await go.getAttribute('data-entity');
  observed.goButton = await go.innerText();
  // *Offer a trade* beside it (triage 2026-09-29, 2.6): it sends the same person, and the trade opens when they arrive.
  const trade = row.locator('button[data-trade]');
  observed.tradeButton = await trade.innerText();
  assert.equal(observed.tradeButton, 'Offer a trade');
  assert.equal(await trade.getAttribute('data-entity'), goer, '"Offer a trade" does not send the person "Send … there" does');
  await trade.click();
  ok(`the Neighbours list shows the family ${observed.row.match(/[\d.]+ miles?/)?.[0]} off raising its walls, with "${observed.goButton}" and "${observed.tradeButton}", which sends them`);
  const homeSite = world().households[HELPED].homeSiteId;
  await helper.waitForFunction(([id, site]) => window.__snapshot?.world.entities.find(e => e.id === id)?.travel?.to === site, [goer, homeSite], { timeout: 30000 });
  observed.onTheWay = (await helper.locator('#neighbours-note').innerText()).trim();
  assert.match(observed.onTheWay, /on the way\. The trade opens when they get there/);
  await helper.waitForFunction(([id, site]) => window.__snapshot?.world.entities.find(e => e.id === id)?.location?.siteId === site, [goer, homeSite], { timeout: 120000 });
  // On arrival: the card beside the neighbour's person with the offer on it, and the sheet put away.
  await helper.locator('#selection-trade .trade-offer').waitFor({ state: 'visible', timeout: 20000 });
  const partner = await helper.locator('#selection').getAttribute('data-entity-id');
  assert.equal(world().entities[partner]?.householdId, HELPED, 'the trade opened with somebody not of the neighbour\'s family');
  assert.notEqual(await helper.locator('#neighbours').getAttribute('data-open'), 'true', 'the sheet was left open over the trade');
  observed.tradeCard = (await helper.locator('#selection-trade').innerText()).replace(/\s+/g, ' ').trim();
  // An offer the family can make: one of something it has, for one of something else.
  const stores = world().households[HELPER].resources;
  const give = ['seed', 'food', 'powder', 'money'].find(good => (stores[good] || 0) >= 1);
  const ask = ['food', 'seed', 'cotton'].find(good => good !== give);
  await helper.locator('#trade-give-good').selectOption(give);
  await helper.locator('#trade-give-amount').fill('1');
  await helper.locator('#trade-ask-good').selectOption(ask);
  await helper.locator('#trade-ask-amount').fill('1');
  await helper.screenshot({ path: 'docs/evidence/neighbours-trade.png' });
  await helper.locator('#selection-trade .trade-offer').click();
  const started0 = Date.now();
  while (!Object.values(world().offers || {}).some(offer => offer.fromHouseholdId === HELPER && offer.toHouseholdId === HELPED) && Date.now() - started0 < 15000) await helper.waitForTimeout(250);
  const made = Object.values(world().offers || {}).find(offer => offer.fromHouseholdId === HELPER && offer.toHouseholdId === HELPED);
  assert.ok(made, 'the offer made from the trade the sheet opened never reached the server');
  await helped.waitForFunction(() => window.__snapshot?.world.offers?.some(offer => offer.direction === 'received'), null, { timeout: 15000 });
  observed.offer = { give: made.give, ask: made.ask, to: world().entities[made.toEntityId].name };
  ok(`on arrival the trade opens with ${observed.offer.to} ("${observed.tradeCard.slice(0, 80)}"), the sheet is put away, and the offer (${JSON.stringify(made.give)} for ${JSON.stringify(made.ask)}) reaches the server and the other family's page`);
  await helper.locator('#selection-close').click().catch(() => {});
  await openNeighbours(helper);
  const help = row.locator('button[data-help]');
  await help.waitFor({ state: 'visible', timeout: 30000 });
  await helper.screenshot({ path: 'docs/evidence/neighbours-raising.png' });
  await help.click();
  await helper.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.chore?.id === 'help-raise', goer, { timeout: 15000 });
  const started = Date.now();
  while (!deedsOf(world()).some(deed => deed.kind === 'raising') && Date.now() - started < 120000) await helper.waitForTimeout(500);
  const raised = deedsOf(world()).find(deed => deed.kind === 'raising');
  assert.ok(raised && raised.fromId === HELPER && raised.toId === HELPED, 'the raising left no deed');
  observed.raised = { hours: raised.hours, person: world().entities[raised.personId].name };
  ok(`there, "Help raise the walls" puts ${observed.raised.person} to it: ${raised.hours} hours, written in the ledger`);

  // The months between, in process; then the spring's word to leave San Felipe.
  await host.getByRole('button', { name: 'Pause' }).click();
  await helper.waitForFunction(() => window.__snapshot?.world.status === 'paused');
  await app.close();
  const saved = readSave(savePath);
  toTheSpring(saved.world);
  writeSave(savePath, saved);
  app = createClassroom({ seed: SEED, playerCount: PLAYERS, tickMs: 700, savePath, worldFactory: autumn });
  assert.equal(await app.listen(port, '127.0.0.1'), port);
  for (const [one, id] of [[helped, HELPED], [helper, HELPER]]) { await one.reload(); await one.waitForFunction(own => window.__snapshot?.world.householdId === own, id, { timeout: 30000 }); }
  await host.reload();
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Resume' }).click();
  await helper.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 30000 });
  observed.own = { helped: flightRoom(world(), world().households[HELPED]).room, helper: flightRoom(world(), world().households[HELPER]).room, helperGoods: goodsSpace(world().households[HELPER]) };

  // The helped family's student is asked whether to offer room, remembering the walls.
  try {
    await helped.waitForFunction(() => window.__snapshot?.world.neighbourly?.asks?.some(ask => ask.side === 'give' && ask.kind === 'room'), null, { timeout: 60000 });
  } catch (error) {
    const w = world(), a = w.households[HELPED], b = w.households[HELPER];
    console.log('DIAG', w.status, w.tick, w.minute, JSON.stringify(w.neighbourly), a.flight?.status, b.flight?.status, a.played, a.absent, b.played, b.absent,
      JSON.stringify(canHelp(w, a, b, 'room')), JSON.stringify(flightRoom(w, a)), JSON.stringify(flightRoom(w, b)), goodsSpace(b),
      JSON.stringify(await helped.evaluate(() => [window.__snapshot?.world.status, window.__snapshot?.world.neighbourly])));
    throw error;
  }
  await openNeighbours(helped);
  const asked = helped.locator('#neighbours-asks [data-side="give"]');
  observed.asked = (await asked.innerText()).replace(/\s+/g, ' ');
  assert.match(observed.asked, /more than their wagon will carry east/);
  assert.match(observed.asked, new RegExp(`Your family remembers ${observed.raised.person} helping raise your walls`));
  await helped.screenshot({ path: 'docs/evidence/neighbours-asked.png' });
  await asked.locator('button[data-answer="yes"]').click();
  ok(`told to leave, the helped family is asked: "${observed.asked.slice(0, 160)}"`);

  // The helper's student is offered it by name, and accepts; its wagon holds more.
  await helper.waitForFunction(() => window.__snapshot?.world.neighbourly?.asks?.some(ask => ask.side === 'take' && ask.kind === 'room'), null, { timeout: 30000 });
  await openNeighbours(helper);
  const offered = helper.locator('#neighbours-asks [data-side="take"]');
  observed.offered = (await offered.innerText()).replace(/\s+/g, ' ');
  assert.match(observed.offered, /offers room for \d+ in their wagon: they remember .* helping raise their walls/);
  const amount = Number(observed.offered.match(/room for (\d+)/)[1]);
  await offered.locator('button[data-answer="yes"]').click();
  await helper.waitForFunction(room => window.__snapshot?.world.flight?.room === room, observed.own.helper + amount, { timeout: 15000 });
  observed.lent = await text(helper, '#neighbours-lent');
  assert.match(observed.lent, /are keeping room for \d+ of your goods in their wagon/);
  assert.equal(flightRoom(world(), world().households[HELPED]).room, observed.own.helped - amount, 'the lender\'s wagon did not lose the room');
  await helper.screenshot({ path: 'docs/evidence/neighbours-room.png' });
  ok(`the helper is offered it by name and accepts: "${observed.offered.slice(0, 140)}"; the wagon's room goes from ${observed.own.helper} to ${observed.own.helper + amount}, the lender's from ${observed.own.helped} to ${observed.own.helped - amount}`);

  // At phone width, the sheet open, the page does not scroll sideways.
  await helper.setViewportSize({ width: 400, height: 860 });
  await openNeighbours(helper);
  await helper.waitForTimeout(400);
  const overflow = await helper.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  await helper.setViewportSize({ width: 1440, height: 950 });
  ok('at phone width, with the Neighbours sheet open, the page does not scroll sideways');

  // The class ends: both families and the Host are told who helped whom.
  // End Game is asked twice (public/app.js `resetConfirm`): pressed, and pressed again while it asks.
  const end = host.locator('#host-controls [data-action="end"]');
  await end.click();
  await host.waitForTimeout(500);
  if (world().status !== 'ended' && await end.isVisible()) await end.click();
  await helper.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  // The end of the class is a sequence (owner, 2026-09-29, D10; sim/end-sequence.mjs): the class's video on the Host's screen,
  // each family's own, and then the reveal with every family's breakdown. The teacher skips ahead to the reveal on the Host's
  // page, as a teacher may (the videos themselves are test:end-sequence's).
  for (let i = 0; i < 4 && await host.evaluate(() => window.__snapshot?.endSequence?.stage) !== 'reveal'; i++) {
    const skip = host.locator('#finale-skip');
    await skip.waitFor({ state: 'visible', timeout: 30000 });
    await skip.click();
    await host.waitForTimeout(1000);
  }
  await helper.waitForFunction(() => window.__snapshot?.endSequence?.stage === 'reveal', null, { timeout: 30000 });
  await helper.locator('.ending-neighbours').waitFor({ state: 'visible', timeout: 30000 });
  observed.helperEnding = await text(helper, '.ending-neighbours');
  observed.helpedEnding = await text(helped, '.ending-neighbours');
  await host.locator('.ending-helped').waitFor({ state: 'visible', timeout: 30000 });
  observed.hostEnding = await text(host, '.ending-helped');
  assert.match(observed.helperEnding, new RegExp(`${observed.raised.person} helped .* raise their walls \\(${observed.raised.hours} hours\\)`));
  assert.match(observed.helperEnding, /kept room for \d+ of the family's goods in their wagon on the road east/);
  assert.match(observed.helpedEnding, new RegExp(`${observed.raised.person} of .* helped raise the family's walls`));
  assert.match(observed.hostEnding, /helped raise their walls/);
  assert.match(observed.hostEnding, /kept room for \d+ in their wagon/);
  // Help earns glory (owner, 2026-09-28, "Any help"): said under What earned glory on each family's page, with its sum (triage
  // 2026-09-29 2.10, sim/ending.mjs `worthLine`: "Helping another family counts 1 × 2 (...) = 2 glory.") where it had "(2)".
  const awardLines = async page => (await page.locator('#ending .ending-awards li').allInnerTexts()).map(line => line.replace(/\s+/g, ' ').trim());
  observed.helperGlory = (await awardLines(helper)).find(line => line.includes(`${observed.raised.person} helped`) && /raise their walls/.test(line));
  observed.helpedGlory = (await awardLines(helped)).find(line => / helped .*with room in the wagon on the road east/.test(line));
  assert.match(observed.helperGlory || '', /Helping another family counts .*= \d+(\.\d+)? glory\.$/, 'the helper\'s raising is not among what earned glory');
  assert.match(observed.helpedGlory || '', /Helping another family counts .*= \d+(\.\d+)? glory\.$/, 'the wagon room is not among what earned glory');
  await helper.screenshot({ path: 'docs/evidence/neighbours-ending.png' });
  await host.screenshot({ path: 'docs/evidence/neighbours-ending-host.png' });
  ok(`the ending names it: family "${observed.helperEnding.slice(0, 200)}"; Host "${observed.hostEnding.slice(0, 200)}"`);
  ok(`and counts it: "${observed.helperGlory}" and "${observed.helpedGlory}" under What earned glory`);

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/neighbours-browser.json', `${JSON.stringify({
    record: 'Help between families, remembered and repaid, in a browser: sim/neighbourly.mjs, owner 2026-09-28 ("Yes: they remember and repay")',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map with rolled families; the raising played live in the browser, the months to the spring played in process with the two families set down as unplayed, and the spring and the ending live. Planted and said: the helped house at its last course with its logs, and each family\'s stores at the spring. No LAN or district claim.',
    checks: pass, observed,
    screenshots: ['docs/evidence/neighbours-trade.png', 'docs/evidence/neighbours-raising.png', 'docs/evidence/neighbours-asked.png', 'docs/evidence/neighbours-room.png', 'docs/evidence/neighbours-ending.png', 'docs/evidence/neighbours-ending-host.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
  rmSync(directory, { recursive: true, force: true });
}

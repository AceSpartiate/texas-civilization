// The errand to town, in a real browser (owner, 2026-09-24; docs/TOWNS.md §4b).
//
// > "When sending someone to town to stores, there should be a popup first asking what they should buy or sell. ... They'll
// > take priority on the wagon and take it so they can carry whatever it is they need to. If someone is using the wagon (or
// > horse, or any item really), then no one else can use it."
//
// tests/errands.test.mjs proves the rules. This proves a student can use them with the controls they have: the "Go to town to
// trade" icon opens the popup instead of sending anybody; the popup lists the town's shops with the server's prices and the
// family's stock; fourteen bales on the list and the popup says, in the server's words, that the wagon goes and why; Enter
// sends the one order and the person drives off with the ox and wagon; a second person's popup is refused the wagon with who
// has it and what to do; Escape sends nobody; and the goods come home. At 1366x768 and 1024x768 (phones unsupported, owner),
// the popup fits the screen, nothing is drawn over its own controls, and it keeps off the family's column. Since the owner's
// request of the same day for animals (docs/TOWNS.md §4d): a second horse is bought at the stock pens, is seen led home beside its
// buyer and standing in the yard with Bess, and two riders go out at once.
//
// Same computer only. Run: npm run test:errand
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createSettledWorld, keepFoundingFamilies, taught } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SHOTS = process.env.ERRAND_SHOTS || 'test-results';
mkdirSync(SHOTS, { recursive: true });
mkdirSync('test-results', { recursive: true });

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

// The family has a crop to sell and nothing much else: fourteen bales, 25 reales put by for a horse, a little seed. Set when the class is made -
// the classroom's world is the server's, and this proof reads it (`app.state`, a copy) but never writes it.
const app = createClassroom({ seed: 'errand-proof', playerCount: 5, tickMs: 200, worldFactory: (seed, count) => {
  const world = taught(keepFoundingFamilies(createSettledWorld(seed, count)));
  world.households['hh-1'].resources = { ...world.households['hh-1'].resources, cotton: 14, money: 25, seed: 2, food: 30 };
  return world;
} });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
};
const popup = page => page.evaluate(() => ({ shown: !document.querySelector('#errand').hidden, how: document.querySelector('#errand-how').textContent, why: document.querySelector('#errand-why').textContent, stock: document.querySelector('#errand-stock').textContent, send: !document.querySelector('#errand-send').disabled, state: window.__errand || null }));
/** Press + on a line until its count reads `n`, waiting for the server's quote each time. */
async function setCount(page, id, n) {
  for (let i = 0; i < 40; i++) {
    const count = Number(await page.locator(`#errand [data-line="${id}"]`).getAttribute('data-count'));
    if (count === n) return;
    await page.locator(`#errand [data-line="${id}"] [data-act="${count < n ? 'more' : 'less'}"]`).click();
  }
  throw new Error(`${id} never reached ${n}`);
}
/** The popup measured against the screen and the furniture it must not cover (docs/FAMILY_PANEL.md §12.11). */
const measure = page => page.evaluate(() => {
  const box = element => { const r = element?.getBoundingClientRect(); return r && r.width > 1 && r.height > 1 ? { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) } : null; };
  const errand = box(document.querySelector('#errand'));
  const overlap = other => other && errand ? Math.max(0, Math.min(errand.r, other.r) - Math.max(errand.x, other.x)) * Math.max(0, Math.min(errand.b, other.b) - Math.max(errand.y, other.y)) : 0;
  const column = box(document.querySelector('#family-rows')), bar = box(document.querySelector('.panel-row[data-focused=true] .panel-icons'));
  // Every control of the popup, sampled at its middle: what is actually drawn there must be the control itself.
  const covered = [...document.querySelectorAll('#errand button')].filter(button => {
    const r = button.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return false;
    const list = document.querySelector('#errand-lines').getBoundingClientRect();
    if (button.closest('#errand-lines') && (r.top < list.top || r.bottom > list.bottom)) return false; // scrolled inside the list
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(hit && (hit === button || button.contains(hit)));
  }).map(button => button.id || button.getAttribute('aria-label') || button.textContent);
  return { screen: { w: innerWidth, h: innerHeight }, errand, fits: Boolean(errand) && errand.x >= 0 && errand.y >= 0 && errand.r <= innerWidth && errand.b <= innerHeight, overColumn: overlap(column), overBar: overlap(bar), covered };
});

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Errand reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  if (await page.locator('#tutorial-skip').isVisible().catch(() => false)) await page.locator('#tutorial-skip').click();

  const family = app.state.world.households['hh-1'];
  const grown = family.members.map(id => app.state.world.entities[id]).filter(one => (one.age ?? 30) >= 16 && one.location.siteId === family.homeSiteId);
  const [first, second] = grown;
  assert.ok(first && second, 'this family has not two grown people at home, so this proves nothing');

  // ------------------------------------------------------------------------------------------ the icon opens the popup
  await asMain(page, first.id);
  const icon = page.locator(`.panel-row[data-entity-id="${first.id}"] .panel-icon[data-key="visit-shop"]`);
  await icon.waitFor({ state: 'visible' });
  await icon.click();
  await page.locator('#errand').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('#errand .errand-line').length > 5);
  assert.equal(app.state.world.entities[first.id].chore, null, 'pressing the icon sent somebody before anything was chosen');
  const listed = await page.evaluate(() => [...document.querySelectorAll('#errand .errand-shop-name')].map(one => one.textContent));
  observed.shops = listed;
  assert.ok(listed.some(name => /^The store/.test(name)) && listed.some(name => /blacksmith/.test(name)), `the popup lists ${listed}`);
  const opened = await popup(page);
  assert.match(opened.stock, /14 cotton/, `the family's stock is not beside the list: ${opened.stock}`);
  assert.equal(opened.send, false, 'Send was open with nothing on the list');
  ok(`the icon opens the popup and sends nobody: ${listed.length} shops of Gonzales listed, "${opened.stock}"`);

  // ------------------------------------------------------------------------------------ fourteen bales takes the wagon
  await setCount(page, 'store:cotton', 14);
  await page.locator('#errand [data-line="store:cotton"] [data-act="pay-coin"]').click();
  await setCount(page, 'store:seed', 1);
  await page.locator('#errand [data-line="store:seed"] [data-act="pay-coin"]').click();
  await page.waitForFunction(() => /Takes the wagon/.test(document.querySelector('#errand-how').textContent) && !document.querySelector('#errand-send').disabled, null, { timeout: 15000 });
  const quoted = await popup(page);
  observed.how = quoted.how;
  assert.equal(quoted.how, 'Takes the wagon: 14 of 20 loads, more than the horse carries (7).');
  const shotWide = join(SHOTS, 'errand-1366.png');
  await page.screenshot({ path: shotWide });
  const wide = await measure(page);
  observed.at1366 = wide;
  assert.ok(wide.fits, `at 1366x768 the popup hangs off the screen: ${JSON.stringify(wide.errand)}`);
  assert.deepEqual(wide.covered, [], `at 1366x768 something is drawn over the popup's own controls: ${wide.covered}`);
  assert.equal(wide.overColumn, 0, 'at 1366x768 the popup covers the family\'s column');
  assert.equal(wide.overBar, 0, 'at 1366x768 the popup is drawn over the ability bar, which steps aside while it is open');
  ok(`the popup says how they will go, in the server's words: "${quoted.how}" (1366x768: ${wide.errand.w}x${wide.errand.h}, clear of the column, nothing over its controls)`);

  // ------------------------------------------------------------------------------------------------- Enter sends it
  await page.locator('#errand [data-line="store:cotton"] [data-act="more"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#errand').waitFor({ state: 'hidden', timeout: 10000 });
  const sent = app.state.world.entities[first.id];
  assert.equal(sent.chore?.id, 'visit-shop', 'Enter did not send the errand');
  assert.equal(sent.travel?.mode, 'wagon', `they went ${sent.travel?.mode}, not with the wagon`);
  assert.equal(app.state.world.entities['hh-1-wagon'].borrowedBy, first.id);
  ok(`Enter sends the one order: ${sent.name} drives off to Gonzales with the ox and wagon`);

  // ------------------------------------------------------------------ a second person is refused the wagon, in words
  await asMain(page, second.id);
  await page.locator(`.panel-row[data-entity-id="${second.id}"] .panel-icon[data-key="visit-shop"]`).click();
  await page.locator('#errand').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('#errand .errand-line').length > 5);
  await setCount(page, 'store:cotton', 10);
  await page.waitForFunction(() => /wants the wagon/.test(document.querySelector('#errand-why').textContent), null, { timeout: 15000 });
  const refused = await popup(page);
  observed.refused = refused.why;
  assert.equal(refused.why, `This wants the wagon: 10 loads, and the horse carries 7. ${sent.name} has the ox and wagon, on the road to Gonzales. Send a smaller load, or wait until the wagon is free.`);
  assert.equal(refused.send, false, 'Send was open on a list the server refuses');
  await page.screenshot({ path: join(SHOTS, 'errand-refused-1366.png') });
  // The same order sent anyway is refused by the server with the same sentence.
  const forged = await page.evaluate(async id => { const r = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `forged-${Date.now()}`, action: 'chore', chore: 'visit-shop', entityId: id, errand: [{ id: 'store:cotton', n: 10, pay: 'coin' }] }) }); return { status: r.status, body: await r.json() }; }, second.id);
  assert.equal(forged.status, 400);
  assert.equal(forged.body.error, refused.why);
  // A smaller load goes on the horse.
  await setCount(page, 'store:cotton', 5);
  await page.waitForFunction(() => /Rides the horse/.test(document.querySelector('#errand-how').textContent), null, { timeout: 15000 });
  observed.smaller = (await popup(page)).how;
  ok(`a second person is refused the wagon with who has it and what to do: "${refused.why}"; five bales go instead: "${observed.smaller}"`);

  // --------------------------------------------------------------------------------------------- Escape sends nobody
  await page.keyboard.press('Escape');
  await page.locator('#errand').waitFor({ state: 'hidden', timeout: 5000 });
  assert.equal(app.state.world.entities[second.id].chore, null, 'Escape sent somebody');
  // The bar is back the instant the list closes, drawn and of real size (docs/FAMILY_PANEL.md §12.13's other half).
  const back = await page.evaluate(() => { const bar = document.querySelector('.panel-row[data-focused=true] .panel-icons'); const r = bar?.getBoundingClientRect(); return Boolean(bar) && getComputedStyle(bar).display !== 'none' && r.width > 20 && r.height > 20; });
  assert.ok(back, 'the ability bar did not come back when the popup closed');
  ok('Escape closes the popup and sends nobody, and the ability bar is back');

  // ----------------------------------------------------------------------------- 1024x768: the popup still fits and works
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.locator(`.panel-row[data-entity-id="${second.id}"] .panel-icon[data-key="visit-shop"]`).click();
  await page.locator('#errand').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('#errand .errand-line').length > 5);
  await setCount(page, 'store:seed', 2);
  await page.waitForFunction(() => /Rides the horse|Goes on foot/.test(document.querySelector('#errand-how').textContent), null, { timeout: 15000 });
  await page.screenshot({ path: join(SHOTS, 'errand-1024.png') });
  const narrow = await measure(page);
  observed.at1024 = narrow;
  assert.ok(narrow.fits, `at 1024x768 the popup hangs off the screen: ${JSON.stringify(narrow.errand)}`);
  assert.deepEqual(narrow.covered, [], `at 1024x768 something is drawn over the popup's own controls: ${narrow.covered}`);
  assert.equal(narrow.overColumn, 0, 'at 1024x768 the popup covers the family\'s column');
  assert.equal(narrow.overBar, 0, 'at 1024x768 the popup is drawn over the ability bar');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1366, height: 768 });
  ok(`at 1024x768 the popup fits (${narrow.errand.w}x${narrow.errand.h}), keeps off the column and has nothing over its controls`);

  // ------------------------------------------------ the way of going is the student's: walk, so the horse stays home
  // Owner, 2026-09-24: the popup suggests the quickest, and the student may choose any slower way that carries the load.
  await page.locator(`.panel-row[data-entity-id="${second.id}"] .panel-icon[data-key="visit-shop"]`).click();
  await page.locator('#errand').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('#errand .errand-line').length > 5);
  // Powder paid in food, so the coin and the seed the first errand brings home are counted clean below.
  await setCount(page, 'store:powder', 1);
  await page.locator('#errand [data-line="store:powder"] [data-act="pay-food"]').click();
  await page.waitForFunction(() => document.querySelector('#errand [data-way="horse"]')?.getAttribute('aria-pressed') === 'true', null, { timeout: 15000 });
  const offeredWays = await page.evaluate(() => [...document.querySelectorAll('#errand [data-way]')].map(button => ({ way: button.dataset.way, label: button.textContent, open: !button.disabled, pressed: button.getAttribute('aria-pressed') === 'true', why: button.title || null })));
  observed.ways = offeredWays;
  assert.deepEqual(offeredWays.map(one => one.way), ['horse', 'foot', 'wagon']);
  assert.match(offeredWays[0].label, /quickest/);
  // The wagon is on the road with Alvin: shut, and the reason under the row in his name.
  const wagonWay = offeredWays.find(one => one.way === 'wagon');
  assert.equal(wagonWay.open, false, 'the wagon was offered while Alvin has it');
  assert.match(wagonWay.why, new RegExp(`^${first.name} has the ox and wagon`));
  await page.locator('#errand [data-way="foot"]').click();
  await page.waitForFunction(() => /as you chose/.test(document.querySelector('#errand-how').textContent) && !document.querySelector('#errand-send').disabled, null, { timeout: 15000 });
  observed.chosen = (await popup(page)).how;
  assert.equal(observed.chosen, 'Goes on foot: 3 of 5 loads, as you chose. The horse would be quicker.');
  await page.screenshot({ path: join(SHOTS, 'errand-ways-1366.png') });
  const chose = await measure(page);
  assert.ok(chose.fits && !chose.covered.length && chose.overColumn === 0, `the popup with its ways does not fit or is covered: ${JSON.stringify(chose)}`);
  await page.locator('#errand-send').click();
  await page.locator('#errand').waitFor({ state: 'hidden', timeout: 10000 });
  const walker = app.state.world.entities[second.id];
  assert.equal(walker.travel?.mode, 'foot', `they went ${walker.travel?.mode}, not the way the student chose`);
  assert.equal(app.state.world.entities['hh-1-horse']?.borrowedBy ?? null, null, 'the horse left the yard although the student chose to walk');
  ok(`the student chooses: the popup marks the horse quickest and the wagon shut ("${wagonWay.why}"); on foot is chosen and said, "${observed.chosen}", and ${walker.name} walks while the horse stays home`);

  // ------------------------------------------------------------------------------------------- and the goods come home
  await page.waitForFunction(id => { const one = window.__snapshot?.world.entities.find(e => e.id === id); return one && !one.chore && !one.travel; }, first.id, { timeout: 120000 });
  const home = await page.evaluate(() => window.__snapshot.world.household.resources);
  observed.home = home;
  assert.equal(home.money, 38, `the fourteen reales, less the one the seed cost, did not come home beside the 25: ${home.money}`);
  assert.equal(home.seed, 4, `the seed did not come home: ${home.seed}`);
  assert.equal(app.state.world.entities['hh-1-wagon'].borrowedBy, null, 'the wagon is still held now it is home');
  const said = await page.evaluate(() => (window.__snapshot?.world.events || []).map(event => event.text).filter(text => /sold 14 cotton|bought 2 seed/.test(text)));
  observed.story = said;
  assert.equal(said.length, 2, `the family's story does not say what was done: ${said}`);
  ok(`the goods come home: 38 reales (the 25 put by, 14 for the cotton, 1 paid for seed) and 2 more seed in the house, the wagon free again, and the story says so: "${said.join('" "')}"`);

  // ----------------------------------------------------------- a second rifle bought, and two hunters out at once
  // Owner, 2026-09-24: "players should be able to send someone to buy more rifles, hoes, tools in general" (docs/TOWNS.md §4c).
  await page.waitForFunction(id => { const one = window.__snapshot?.world.entities.find(e => e.id === id); return one && !one.chore && !one.travel; }, second.id, { timeout: 120000 });
  await asMain(page, first.id);
  await page.locator(`.panel-row[data-entity-id="${first.id}"] .panel-icon[data-key="visit-shop"]`).click();
  await page.locator('#errand').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('#errand [data-line="gunsmith:buy-rifle"]'));
  const rifleLine = await page.evaluate(() => { const line = document.querySelector('#errand [data-line="gunsmith:buy-rifle"]'); return { label: line.querySelector('.errand-label').textContent, price: line.querySelector('.errand-price').textContent, shut: line.dataset.shut === 'true' }; });
  observed.rifleLine = rifleLine;
  assert.equal(rifleLine.shut, false, 'a second rifle was refused to a family that has one');
  await setCount(page, 'gunsmith:buy-rifle', 1);
  await page.locator('#errand [data-line="gunsmith:buy-rifle"] [data-act="pay-coin"]').click();
  await setCount(page, 'blacksmith:tool-axe', 1);
  await page.locator('#errand [data-line="blacksmith:tool-axe"] [data-act="pay-coin"]').click();
  await page.waitForFunction(() => !document.querySelector('#errand-send').disabled && /Rides the horse/.test(document.querySelector('#errand-how').textContent), null, { timeout: 15000 });
  observed.toolsStock = await page.evaluate(() => document.querySelector('#errand-stock').textContent);
  assert.match(observed.toolsStock, /Tools: a rifle · a hoe · a felling axe/);
  await page.locator('#errand [data-line="gunsmith:buy-rifle"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(SHOTS, 'errand-tools-1366.png') });
  await page.locator('#errand-send').click();
  await page.locator('#errand').waitFor({ state: 'hidden', timeout: 10000 });
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.chore?.id === 'visit-shop', first.id, { timeout: 15000 });
  await page.waitForFunction(id => { const one = window.__snapshot?.world.entities.find(e => e.id === id); return one && !one.chore && !one.travel; }, first.id, { timeout: 120000 });
  const bought = app.state.world.households['hh-1'];
  assert.equal(bought.rifles, 2, `the family has ${bought.rifles ?? 1} rifles after buying one`);
  // Both hunt at once, each from their own icon.
  for (const hunter of [first, second]) {
    await asMain(page, hunter.id);
    const hunt = page.locator(`.panel-row[data-entity-id="${hunter.id}"] .panel-icon[data-key="hunt-timber"]`);
    await hunt.waitFor({ state: 'visible', timeout: 15000 });
    await hunt.click();
    // The hunt in the timber asks how they go first (owner, 2026-09-24; public/going.js): Enter sends them the quickest way free.
    await page.locator('#going').waitFor({ state: 'visible' });
    await page.waitForFunction(() => window.__going?.can && document.activeElement?.closest('#going'), null, { timeout: 15000 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.chore?.id === 'hunt-timber', hunter.id, { timeout: 15000 });
  }
  const out = await page.evaluate(ids => ids.map(id => window.__snapshot.world.entities.find(e => e.id === id).chore?.id), [first.id, second.id]);
  assert.deepEqual(out, ['hunt-timber', 'hunt-timber']);
  ok(`a second rifle is bought at the gunsmith ("${rifleLine.label}: ${rifleLine.price}", the stock line "${observed.toolsStock}"), and ${first.name} and ${second.name} are both out hunting at once`);

  // ------------------------------------------ a second horse at the stock pens, led home and drawn, and two riders at once
  // Owner, 2026-09-24: "players should also be able to buy more horses and other animals. they should be relatively expensive
  // though" (docs/TOWNS.md §4d). Both hunters home first, so Bess is in the yard to ride to town.
  const idle = ids => page.waitForFunction(list => list.every(id => { const one = window.__snapshot?.world.entities.find(e => e.id === id); return one && !one.chore && !one.travel; }), ids, { timeout: 180000 });
  await idle([first.id, second.id]);
  await asMain(page, first.id);
  await page.locator(`.panel-row[data-entity-id="${first.id}"] .panel-icon[data-key="visit-shop"]`).click();
  await page.locator('#errand').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('#errand [data-line="stockman:horse"]'));
  const pens = await page.evaluate(() => [...document.querySelectorAll('#errand [data-line^="stockman:"]')].map(line => ({ id: line.dataset.line, label: line.querySelector('.errand-label').textContent, price: line.querySelector('.errand-price').textContent, shut: line.dataset.shut === 'true' })));
  observed.pens = pens;
  assert.deepEqual(pens.map(one => one.id), ['stockman:horse', 'stockman:ox', 'stockman:cattle', 'stockman:hog']);
  assert.deepEqual(pens.map(one => one.price), ['25 reales', '15 reales', '10 reales', '4 reales or 14 food']);
  assert.ok(pens.every(one => !one.shut), `a line at the stock pens is shut: ${JSON.stringify(pens)}`);
  await setCount(page, 'stockman:horse', 1);
  await page.waitForFunction(() => !document.querySelector('#errand-send').disabled && /Leads the new horse home on a halter\./.test(document.querySelector('#errand-how').textContent), null, { timeout: 15000 });
  const buying = await popup(page);
  observed.horseHow = buying.how;
  observed.animalsStock = buying.stock;
  assert.equal(buying.how, 'Rides the horse: 0 of 7 loads. Leads the new horse home on a halter.');
  assert.match(buying.stock, /Animals: a horse · an ox/);
  const horseCards = await page.evaluate(() => [...document.querySelectorAll('#errand [data-way]')].map(button => button.textContent));
  assert.ok(horseCards.every(text => /Leads the new horse home on a halter\./.test(text)), `a way's card does not say what comes home: ${horseCards}`);
  await page.locator('#errand [data-line="stockman:horse"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(SHOTS, 'errand-animals-1366.png') });
  const pensFit = await measure(page);
  observed.animalsAt1366 = pensFit;
  assert.ok(pensFit.fits && !pensFit.covered.length && pensFit.overColumn === 0, `the popup with the stock pens does not fit or is covered: ${JSON.stringify(pensFit)}`);
  await page.locator('#errand-send').click();
  await page.locator('#errand').waitFor({ state: 'hidden', timeout: 10000 });
  // Led home: the new horse on the road beside its buyer, walking, while she rides Bess; drawn on the map as a horse of its own.
  await page.waitForFunction(id => { const w = window.__snapshot?.world; const led = w?.entities.find(e => e.id === 'hh-1-horse-2'); const rider = w?.entities.find(e => e.id === id); return led?.travel && led.travel.mode === 'foot' && rider?.travel?.mode === 'horse'; }, first.id, { timeout: 120000 });
  const onRoad = app.state.world.entities['hh-1-horse-2'];
  observed.led = { name: onRoad.name, purpose: onRoad.travel?.purpose, borrowedBy: onRoad.borrowedBy };
  assert.equal(onRoad.travel?.purpose, 'lead');
  assert.equal(onRoad.borrowedBy, first.id);
  await page.waitForFunction(id => window.__drawnAt?.['hh-1-horse-2'] && window.__seatedDrawn?.[id]?.seat === 'horse', first.id, { timeout: 60000 });
  // Drawn a length behind its rider on the lead, not under her.
  // Measured between where each stands (`__drawnAt` is the middle of the figure, and a rider is drawn taller than a horse).
  const trail = await page.evaluate(id => { const foot = one => one && { x: one.x, y: one.y + one.size * .45 }; const led = foot(window.__drawnAt['hh-1-horse-2']), rider = foot(window.__drawnAt[id]); return led && rider ? Math.round(Math.hypot(led.x - rider.x, led.y - rider.y)) : null; }, first.id);
  observed.ledTrails = trail;
  assert.ok(trail >= 30, `the led horse is drawn under its rider (${trail} px apart)`);
  if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
  await page.screenshot({ path: join(SHOTS, 'errand-led-home-1366.png') });
  await idle([first.id]);
  const inYard = app.state.world.entities['hh-1-horse-2'];
  assert.equal(inYard.location.siteId, family.homeSiteId, 'the horse bought did not come home');
  assert.equal(inYard.borrowedBy, null, 'the horse bought is still held now it is home');
  await page.waitForFunction(() => window.__drawnAt?.['hh-1-horse'] && window.__drawnAt?.['hh-1-horse-2'], null, { timeout: 30000 });
  observed.yard = await page.evaluate(() => ({ bess: window.__drawnAt['hh-1-horse'], bought: window.__drawnAt['hh-1-horse-2'] }));
  const apart = Math.round(Math.hypot(observed.yard.bess.x - observed.yard.bought.x, observed.yard.bess.y - observed.yard.bought.y));
  assert.ok(apart >= 12, `the two horses are drawn one on the other (${apart} px apart)`);
  if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
  await page.screenshot({ path: join(SHOTS, 'errand-two-horses-1366.png') });
  ok(`a second horse is bought at the stock pens (${pens.map(one => `${one.label}: ${one.price}`).join(', ')}): "${buying.how}"; ${inYard.name} is seen led home beside ${first.name}, who rides Bess, and stands drawn in the yard beside her`);
  // Two riders at once, each sent from their own popup on a horse of their own.
  for (const rider of [first, second]) {
    await asMain(page, rider.id);
    await page.locator(`.panel-row[data-entity-id="${rider.id}"] .panel-icon[data-key="visit-shop"]`).click();
    await page.locator('#errand').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelectorAll('#errand .errand-line').length > 5);
    await setCount(page, 'store:seed', 1);
    await page.locator('#errand [data-line="store:seed"] [data-act="pay-coin"]').click();
    await page.waitForFunction(() => !document.querySelector('#errand-send').disabled && /^Rides the horse/.test(document.querySelector('#errand-how').textContent), null, { timeout: 15000 });
    await page.locator('#errand-send').click();
    await page.locator('#errand').waitFor({ state: 'hidden', timeout: 10000 });
    await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.travel?.mode === 'horse', rider.id, { timeout: 15000 });
  }
  const riding = ['hh-1-horse', 'hh-1-horse-2'].map(id => app.state.world.entities[id].borrowedBy).sort();
  assert.deepEqual(riding, [first.id, second.id].sort(), `the two riders are not on two horses: ${riding}`);
  await page.waitForFunction(ids => ids.every(id => window.__seatedDrawn?.[id]?.seat === 'horse'), [first.id, second.id], { timeout: 60000 });
  await page.screenshot({ path: join(SHOTS, 'errand-two-riders-1366.png') });
  ok(`two riders at once: ${first.name} and ${second.name} each ride to Gonzales on a horse of their own, both drawn in the saddle`);

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/errand-browser.json', `${JSON.stringify({
    record: 'The errand to town, in a browser: docs/TOWNS.md §4b',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only, headless Chrome at 1366x768 and 1024x768. A student opened the popup from the family panel, put fourteen bales and a purchase of seed on the list, read the server\'s sentence that the wagon goes, sent it with Enter, was refused the wagon for a second person in the holder\'s name, closed the popup with Escape, and saw the coin and seed come home. No LAN or district claim.',
    checks: pass,
    observed,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}

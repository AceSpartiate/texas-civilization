// The family's means rolled in the creation walk, and a poor and a well-to-do family on the road in, in a real browser (owner,
// 2026-09-25: "introduce rolling for starting wealth. tie it into the extra wagons. part of wealth will be number of wagons. if a
// family doesn't have enough wagons, older family members walk. have this potentially affect travelling speed.";
// docs/FAMILY_CREATION.md and docs/SETTLING_IN.md §4b).
//
// tests/means.test.mjs proves the rules and the page's reading of the projection. This proves a student sees them: the die panel
// throws two dice and says the family's means in the server's words; a poor family of twelve packs a cart ("Pack the cart", 12
// spaces), and on the track in the cart is drawn with its driver on it and two riders in it, and the rest of the family walking in a
// file beside it, apart; a well-to-do family comes in with three wagons, each drawn with its own driver. Same computer only.
// Run: npm run test:means (SHOTS=<dir> for the screenshots).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { eatenADay, familyRoll, meansRoll } from '../sim/family.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SHOTS = process.env.SHOTS || 'test-results';
mkdirSync(SHOTS, { recursive: true });
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const seedFor = (stem, size, lo, hi) => { for (let n = 0; ; n++) { const seed = `${stem}-${n}`, roll = meansRoll(seed, 'hh-1'); if (familyRoll(seed, 'hh-1') === size && roll >= lo && roll <= hi) return seed; } };

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];

/** One class, one student in it who rolls in the browser; the rest join by the API; Start. Returns what the proof needs. */
async function classWith(seed, label) {
  const app = createClassroom({ seed, playerCount: 5, tickMs: 700, worldFactory: (s, count) => createGonzalesWorld(s, count) });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const post = async (path, body, cookie) => {
    const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
    assert.equal(response.status, 200, `${path}: ${response.status}`);
    return response;
  };
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${label}: ${error.message}`));
  await page.goto(url);
  await page.locator('[name=name]').fill(`${label} reader`);
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await page.locator('#creation-begin-button').click();
  await page.locator('#roll-family').waitFor({ state: 'visible', timeout: 15000 });
  return { app, page, post, hostCookie, url };
}
async function rollInTheBrowser({ page }, shot) {
  // Two dice before the throw, and the line saying what the second is for.
  assert.equal(await page.locator('#means-die').isVisible(), true, 'the means die is not drawn before the throw');
  assert.match(await page.locator('#means-roll-text').textContent(), /A second die, thrown with it, decides what the family has to start with/);
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
  await page.locator('#means-result').waitFor({ state: 'visible', timeout: 10000 });
  const shown = { result: await page.locator('#family-roll-result').textContent(), means: await page.locator('#means-result').textContent(), family: await page.locator('#family-die').textContent(), second: await page.locator('#means-die').textContent() };
  if (shot) await page.screenshot({ path: join(SHOTS, shot) });
  return shown;
}
async function startClass({ app, page, post, hostCookie }) {
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  if (await page.locator('#tutorial-skip').isVisible().catch(() => false)) await page.locator('#tutorial-skip').click();
}
/** Wait for the family's wagons to be drawn with drivers, pause, and bring the camera onto the principal as a student does, with
 * their portrait on the family panel (docs/FAMILY_PANEL.md), then closer in with the wheel over them. */
async function closeIn({ app, page, post, hostCookie }, drivers) {
  await page.waitForFunction(n => Object.values(window.__seatedDrawn || {}).filter(one => one.seat === 'wagon').length >= n, drivers, { timeout: 30000 });
  await post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot.world.status === 'paused');
  const principal = app.state.world.households['hh-1'].principalId;
  await page.locator(`.panel-portrait[data-portrait="${principal}"]`).click();
  await page.waitForTimeout(900);
  const wagonAt = () => page.evaluate(() => Object.values(window.__seatedDrawn || {}).find(one => one.seat === 'wagon')?.parts.find(part => part.part === 'wagon'));
  for (let i = 0; i < 6; i++) {
    const at = await wagonAt();
    if (!at || at.height >= 60) break;
    await page.mouse.move(at.x, at.y - at.height / 2);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(400);
  }
  // The person's card closed, so it does not sit over the wagons.
  if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
  await page.waitForTimeout(1500);
}

try {
  // ------------------------------------------------------------------ a poor family of twelve: a cart, and most of them walking
  const poor = await classWith(seedFor('means-poor-shot', 12, 1, 6), 'Poor');
  const rolledPoor = await rollInTheBrowser(poor, 'means-roll-1366.png');
  observed.poorRoll = rolledPoor;
  assert.match(rolledPoor.result, /^You rolled an? \d+ for your family and an? \d+ for what it has\.$/);
  assert.match(rolledPoor.means, /^Poor\. A cart and one ox to draw it, and the family's horse\. \d+ rides? and \d+ walks? beside the cart\.$/);
  ok(`the die panel throws two dice (${rolledPoor.family} and ${rolledPoor.second}) and says "${rolledPoor.means}"`);
  await meetFamily(poor.page);
  const poorFamily = () => poor.app.state.world.households['hh-1'];
  assert.equal(poorFamily().members.length, 12);
  assert.equal(poorFamily().means.band, 'poor');
  await poor.page.locator('#wagon-load').waitFor({ state: 'visible', timeout: 15000 });
  observed.cartPack = { title: await poor.page.locator('#wagon-load-title').textContent(), room: await poor.page.locator('#wagon-room').textContent() };
  assert.equal(observed.cartPack.title, 'Pack the cart');
  assert.match(observed.cartPack.room, /^The cart: \d+ of 12 space filled/);
  // The food carried on foot beside the cart (sim/means.mjs `ARRIVAL_DAYS`), said on the pack screen in the server's number.
  observed.cartPack.packs = await poor.page.locator('#wagon-packs').textContent();
  assert.equal(observed.cartPack.packs, `Besides the cart, the family carries ${poorFamily().packs?.food} food on foot, in sacks and bundles.`);
  const days = poorFamily().resources.food / eatenADay(poor.app.state.world, poorFamily().members.map(id => poor.app.state.world.entities[id]));
  assert.ok(days >= 5, `a poor family of twelve starts with ${days.toFixed(1)} days of food`);
  observed.cartPack.food = poorFamily().resources.food;
  ok(`the pack screen packs the cart: "${observed.cartPack.room}"; "${observed.cartPack.packs}" (${observed.cartPack.food} food, ${days.toFixed(1)} days)`);
  await poor.page.locator('#wagon-done').click();
  await startClass(poor);
  await closeIn(poor, 1);
  const road = await poor.page.evaluate(() => {
    const [id, drawn] = Object.entries(window.__seatedDrawn || {}).find(([, one]) => one.seat === 'wagon');
    const walkers = window.__snapshot.world.entities.filter(one => one.kind === 'person' && one.travel?.afoot).map(one => one.id);
    return { driver: id, passengers: drawn.parts.filter(part => part.part === 'passenger'), wagon: drawn.parts.find(part => part.part === 'wagon'), walkers: walkers.map(one => ({ id: one, at: window.__drawnAt[one] || null })) };
  });
  observed.poorOnTheRoad = road;
  const truth = poorFamily().members.map(id => poor.app.state.world.entities[id]);
  assert.equal(road.driver, poorFamily().principalId, 'the principal is not drawn driving the cart');
  assert.deepEqual(road.passengers.map(one => one.id).sort(), truth.filter(one => one.travel?.rides).map(one => one.id).sort(), 'the riders drawn are not the riders the server seated');
  assert.ok(road.passengers.length >= 2, 'the cart is not drawn with its two riders');
  const drawnWalkers = road.walkers.filter(one => one.at);
  assert.equal(road.walkers.length, truth.filter(one => one.travel?.afoot).length);
  assert.ok(road.walkers.length >= 8 && drawnWalkers.length >= road.walkers.length - 1, `only ${drawnWalkers.length} of the ${road.walkers.length} walkers are drawn`);
  const spots = new Set(drawnWalkers.map(one => `${Math.round(one.at.x / 4)}:${Math.round(one.at.y / 4)}`));
  assert.equal(spots.size, drawnWalkers.length, 'walkers are drawn one on another');
  assert.ok(road.wagon.height >= 30, `the camera never closed in (${road.wagon.height} px)`);
  await poor.page.screenshot({ path: join(SHOTS, 'means-poor-arrival-1366.png') });
  ok(`a poor family of twelve on the track in: the cart driven by its principal, ${road.passengers.length} in it, ${drawnWalkers.length} walking beside it apart, at ${truth[0].travel.speed} a tick`);
  await poor.app.close();

  // ------------------------------------------------------------------ a well-to-do family of eight: three wagons, room for all
  const rich = await classWith(seedFor('means-rich-shot', 8, 19, 20), 'Rich');
  const rolledRich = await rollInTheBrowser(rich, 'means-roll-rich-1366.png');
  observed.richRoll = rolledRich;
  assert.match(rolledRich.means, /^Well-to-do\. Three wagons, an ox to each, and the family's horse\. There is room for all 8 to ride\.$/);
  ok(`a well-to-do roll says "${rolledRich.means}"`);
  await meetFamily(rich.page);
  await rich.page.locator('#wagon-load').waitFor({ state: 'visible', timeout: 15000 });
  observed.richPack = await rich.page.locator('#wagon-room').textContent();
  assert.match(observed.richPack, /^3 wagons: \d+ of 48 space filled/);
  await rich.page.locator('#wagon-done').click();
  await startClass(rich);
  await closeIn(rich, 3);
  const train = await rich.page.evaluate(() => Object.entries(window.__seatedDrawn || {}).filter(([, one]) => one.seat === 'wagon').map(([id, one]) => ({ id, art: one.art, passengers: one.parts.filter(part => part.part === 'passenger').length, wagon: one.parts.find(part => part.part === 'wagon') })));
  observed.richOnTheRoad = train;
  assert.equal(train.length, 3, 'three wagons are not each drawn with a driver');
  assert.equal(train.reduce((sum, one) => sum + one.passengers, 0) + 3, 8, 'the family of eight is not all riding');
  await rich.page.screenshot({ path: join(SHOTS, 'means-rich-arrival-1366.png') });
  ok(`a well-to-do family of eight comes in with three wagons, each drawn driven (${train.map(one => one.art || 'composite').join(', ')}), ${train.map(one => one.passengers).join('+')} riding, nobody walking`);
  await rich.app.close();

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/means-browser.json', JSON.stringify({ record: 'means-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    ownerDirection: '"introduce rolling for starting wealth. tie it into the extra wagons. part of wealth will be number of wagons. if a family doesn\'t have enough wagons, older family members walk. have this potentially affect travelling speed." (2026-09-25)',
    checks: pass, observed, notProved: ['Same computer only: no physical LAN, no Chromebook, no class.', 'The Runaway Scrape with walkers is proved headless (tests/means.test.mjs), not in this browser proof.'] }, null, 2) + '\n');
} finally {
  await browser.close();
}

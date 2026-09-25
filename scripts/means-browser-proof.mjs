// The family's means rolled in the creation walk, and a poor and a well-to-do family on the road in, in a real browser (owner,
// 2026-09-25: "introduce rolling for starting wealth. tie it into the extra wagons. part of wealth will be number of wagons. if a
// family doesn't have enough wagons, older family members walk. have this potentially affect travelling speed.";
// docs/FAMILY_CREATION.md and docs/SETTLING_IN.md §4b).
//
// tests/means.test.mjs proves the rules and the page's reading of the projection. This proves a student sees them: the die panel
// throws two dice and says the family's means in the server's words; a poor family of twelve packs a cart ("Pack the cart", 12
// spaces), and on the track in the cart is drawn with its driver on it and two riders in it, and the rest of the family walking in a
// file beside it, apart; a well-to-do family comes in with three wagons, each drawn with its own driver. Same computer only.
//
// Extended for the owner's second amendment of 2026-09-25 ("families should get some starting coin ... it should be possible to
// start with no wagon ... have it be something families can make at home? ... the horse should carry a rider"): the means line
// says the coin, the horse is drawn with its rider, a family that is hard up packs its ox and walks in in a file with one of it on
// the horse, and a family on the real land makes a carreta from the family panel and it stands in the yard.
// Run: npm run test:means (SHOTS=<dir> for the screenshots).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { eatenADay, familyRoll, meansRoll } from '../sim/family.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';

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
async function classWith(seed, label, map = 'gonzales', prepare = null) {
  const app = createClassroom({ seed, playerCount: 5, tickMs: 700, worldFactory: (s, count) => { const world = createGonzalesWorld(s, count, { map }); prepare?.(world); return world; } });
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
  const poor = await classWith(seedFor('means-poor-shot', 12, 3, 6), 'Poor');
  const rolledPoor = await rollInTheBrowser(poor, 'means-roll-1366.png');
  observed.poorRoll = rolledPoor;
  assert.match(rolledPoor.result, /^You rolled an? \d+ for your family and an? \d+ for what it has\.$/);
  assert.match(rolledPoor.means, /^Poor\. A cart and one ox to draw it, the family's horse, and \d+ reales\. \d+ rides? and \d+ walks? beside the cart\.$/);
  const poorFamily = () => poor.app.state.world.households['hh-1'];
  // The coin (owner, 2026-09-25: "a minimum of 3 coin, and a maximum of 10"), the server's own number, on the line with the band.
  const coin = Number(rolledPoor.means.match(/and (\d+) reales/)[1]);
  assert.equal(coin, poorFamily().means.coin);
  assert.equal(coin, poorFamily().resources.money);
  assert.ok(coin >= 3 && coin <= 4, `a poor family came with ${coin} reales`);
  observed.poorCoin = coin;
  ok(`the die panel throws two dice (${rolledPoor.family} and ${rolledPoor.second}) and says "${rolledPoor.means}", the coin the server gave`);
  await meetFamily(poor.page);
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
  assert.deepEqual(road.passengers.map(one => one.id).sort(), truth.filter(one => one.travel?.rides && !one.travel.saddle).map(one => one.id).sort(), 'the riders drawn are not the riders the server seated');
  // And one on the horse (owner, 2026-09-25: "the horse should carry a rider"), drawn in the saddle.
  const horseman = truth.find(one => one.travel?.saddle && !one.travel.carried);
  assert.ok(horseman, 'the server put nobody on the horse');
  const inSaddle = await poor.page.evaluate(id => window.__seatedDrawn?.[id]?.seat || null, horseman.id);
  assert.equal(inSaddle, 'horse', `${horseman.name} is not drawn on the horse`);
  observed.poorHorseman = { id: horseman.id, age: horseman.age };
  assert.ok(road.passengers.length >= 2, 'the cart is not drawn with its two riders');
  const drawnWalkers = road.walkers.filter(one => one.at);
  assert.equal(road.walkers.length, truth.filter(one => one.travel?.afoot).length);
  assert.ok(road.walkers.length >= 8 && drawnWalkers.length >= road.walkers.length - 1, `only ${drawnWalkers.length} of the ${road.walkers.length} walkers are drawn`);
  const spots = new Set(drawnWalkers.map(one => `${Math.round(one.at.x / 4)}:${Math.round(one.at.y / 4)}`));
  assert.equal(spots.size, drawnWalkers.length, 'walkers are drawn one on another');
  assert.ok(road.wagon.height >= 30, `the camera never closed in (${road.wagon.height} px)`);
  await poor.page.screenshot({ path: join(SHOTS, 'means-poor-arrival-1366.png') });
  ok(`a poor family of twelve on the track in: the cart driven by its principal, ${road.passengers.length} in it, ${horseman.name} (${horseman.age}) on the horse, ${drawnWalkers.length} walking beside it apart, at ${truth[0].travel.speed} a tick`);
  await poor.app.close();

  // ------------------------------------------------------------------ a well-to-do family of eight: three wagons, room for all
  const rich = await classWith(seedFor('means-rich-shot', 8, 19, 20), 'Rich');
  const rolledRich = await rollInTheBrowser(rich, 'means-roll-rich-1366.png');
  observed.richRoll = rolledRich;
  assert.match(rolledRich.means, /^Well-to-do\. Three wagons, an ox to each, the family's horse, and (9|10) reales\. There is room for all 8 to ride\.$/);
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

  // ------------------------------------------------------------------ a family that is hard up: no vehicle, walking in
  const afoot = await classWith(seedFor('means-afoot-shot', 8, 1, 2), 'Afoot');
  const rolledAfoot = await rollInTheBrowser(afoot, 'means-roll-afoot-1366.png');
  observed.afootRoll = rolledAfoot;
  assert.match(rolledAfoot.means, /^Hard up\. No wagon or cart: an ox to carry the packs, the family's horse, and 3 reales\. 1 rides the horse and 7 walk\.$/);
  ok(`a hard-up roll says "${rolledAfoot.means}"`);
  await meetFamily(afoot.page);
  const afootFamily = () => afoot.app.state.world.households['hh-1'];
  await afoot.page.locator('#wagon-load').waitFor({ state: 'visible', timeout: 15000 });
  observed.afootPack = { title: await afoot.page.locator('#wagon-load-title').textContent(), room: await afoot.page.locator('#wagon-room').textContent(), packs: await afoot.page.locator('#wagon-packs').textContent() };
  assert.equal(observed.afootPack.title, "Pack the ox's packs");
  assert.match(observed.afootPack.room, /^No wagon or cart\. The ox's packs: 7 of 7 space filled, 0 left\.$/);
  assert.equal(observed.afootPack.packs, `The family carries its food itself: ${afootFamily().packs.food} food on foot, in sacks and bundles.`);
  const afootDays = afootFamily().resources.food / eatenADay(afoot.app.state.world, afootFamily().members.map(id => afoot.app.state.world.entities[id]));
  assert.ok(afootDays >= 5, `a family on foot starts with ${afootDays.toFixed(1)} days of food`);
  ok(`the pack screen packs the ox: "${observed.afootPack.room}"; "${observed.afootPack.packs}" (${afootDays.toFixed(1)} days of food)`);
  await afoot.page.locator('#wagon-done').click();
  await startClass(afoot);
  const rider = afootFamily().members.map(id => afoot.app.state.world.entities[id]).find(one => one.travel?.saddle && !one.travel.carried);
  await afoot.page.waitForFunction(id => window.__seatedDrawn?.[id]?.seat === 'horse', rider.id, { timeout: 30000 });
  await afoot.post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, afoot.hostCookie);
  await afoot.page.waitForFunction(() => window.__snapshot.world.status === 'paused');
  await afoot.page.locator(`.panel-portrait[data-portrait="${rider.id}"]`).click();
  await afoot.page.waitForTimeout(900);
  for (let i = 0; i < 6; i++) {
    const at = await afoot.page.evaluate(id => window.__drawnAt?.[id] || null, rider.id);
    if (!at || at.size >= 70) break;
    await afoot.page.mouse.move(at.x, at.y);
    await afoot.page.mouse.wheel(0, -300);
    await afoot.page.waitForTimeout(400);
  }
  if (await afoot.page.locator('#selection-close').isVisible().catch(() => false)) await afoot.page.locator('#selection-close').click();
  await afoot.page.waitForTimeout(1500);
  const walking = await afoot.page.evaluate(() => {
    const own = window.__snapshot.world.entities.filter(one => one.householdId === 'hh-1');
    return { walkers: own.filter(one => one.kind === 'person' && one.travel?.afoot && !one.travel.carried).map(one => ({ id: one.id, mode: one.travel.mode, at: window.__drawnAt[one.id] || null })), wagons: own.filter(one => one.kind === 'wagon').length, ox: window.__drawnAt[own.find(one => one.kind === 'animal' && one.species !== 'horse')?.id] || null, horseDrawnAlone: Boolean(window.__drawnAt['hh-1-horse']) };
  });
  observed.afootOnTheRoad = walking;
  assert.equal(walking.wagons, 0, 'a family on foot is sent a wagon');
  assert.ok(walking.walkers.length >= 5 && walking.walkers.every(one => one.mode === 'foot'), 'the family does not walk in');
  const drawnAfoot = walking.walkers.filter(one => one.at);
  assert.ok(drawnAfoot.length >= walking.walkers.length - 1, `only ${drawnAfoot.length} of ${walking.walkers.length} walkers are drawn`);
  assert.equal(new Set(drawnAfoot.map(one => `${Math.round(one.at.x / 4)}:${Math.round(one.at.y / 4)}`)).size, drawnAfoot.length, 'walkers are drawn one on another');
  assert.ok(walking.ox, 'the ox under its packs is not drawn');
  assert.equal(walking.horseDrawnAlone, false, 'the horse is drawn by itself as well as under its rider');
  await afoot.page.screenshot({ path: join(SHOTS, 'means-afoot-arrival-1366.png') });
  ok(`a hard-up family of eight walks in: ${drawnAfoot.length} walking apart, ${rider.name} (${rider.age}) in the saddle, the ox drawn under its packs, no wagon`);
  // In, with its food: five days and more, and the arrival line says what was carried.
  await afoot.post('/api/command', { id: `proof-resume-${crypto.randomUUID()}`, action: 'resume' }, afoot.hostCookie);
  await afoot.page.waitForFunction(() => window.__snapshot.world.status === 'running');
  for (let i = 0; i < 120 && afootFamily().arriving; i++) await afoot.page.waitForTimeout(500);
  assert.equal(afootFamily().arriving, undefined, 'the family on foot never came in');
  const line = afoot.app.state.world.events.find(event => event.type === 'arrival' && event.householdId === 'hh-1').text;
  assert.match(line, /They carried \d+ food on their backs, in sacks and bundles, and the ox carried the rest\./);
  observed.afootArrival = { line, food: afootFamily().resources.food };
  ok(`in on foot: "${line.match(/They carried[^.]*\./)[0]}"`);
  await afoot.app.close();

  // ------------------------------------------------------------------ a carreta made at home, on the real land
  // The fixture, set when the class is made (the server hands proofs a copy of its state, never the state): three logs and one
  // more in the family's pile and a hide in the house - what felling, hauling and a hunt bring, which the woods and hunting proofs
  // drive.
  const maker = await classWith(seedFor('means-carreta-shot', 5, 1, 2), 'Carreta', 'colonies', world => {
    world.households['hh-1'].logs = { wall: 1, sill: 1, poor: 2 };
    world.households['hh-1'].resources.hides = 1;
  });
  await rollInTheBrowser(maker);
  await meetFamily(maker.page);
  if (await maker.page.locator('#wagon-done').isVisible().catch(() => false)) await maker.page.locator('#wagon-done').click();
  await startClass(maker);
  const makerFamily = () => maker.app.state.world.households['hh-1'];
  for (let i = 0; i < 160 && makerFamily().arriving; i++) await maker.page.waitForTimeout(500);
  assert.equal(makerFamily().arriving, undefined, 'the family never came in');
  // The house site chosen, as a student does on the map, sent here as the command because choosing it is proved in its own right
  // (tests/homesite.test.mjs, the biome proof).
  const bounds = holdingOf(maker.app.state.world, makerFamily()).bounds;
  let site = null;
  for (let i = 1; i < 8 && !site; i++) for (let j = 1; j < 8 && !site; j++) {
    const point = { x: bounds.minX + (bounds.maxX - bounds.minX) * i / 8, y: bounds.minY + (bounds.maxY - bounds.minY) * j / 8 };
    if (siteFactsFor(maker.app.state.world, makerFamily(), point).can) site = point;
  }
  assert.ok(site, 'nowhere on the land to put the house');
  const chose = await maker.page.evaluate(async body => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, { id: `proof-${crypto.randomUUID()}`, action: 'choose-site', x: site.x, y: site.y });
  assert.equal(chose, 200);
  for (let i = 0; i < 160 && (makerFamily().choosingSite || makerFamily().arriving); i++) await maker.page.waitForTimeout(500);
  assert.ok(!makerFamily().choosingSite && !makerFamily().arriving, 'the family never came to its house site');
  // The guided start put by as a student does, with its X and "yes" (docs/LESSON.md).
  await maker.page.locator('#lesson-stop').waitFor({ state: 'visible', timeout: 15000 });
  await maker.page.locator('#lesson-stop').click();
  await maker.page.locator('#lesson-stop-yes').click();
  await maker.page.waitForFunction(() => window.__snapshot?.world && !('lesson' in window.__snapshot.world), null, { timeout: 20000 });
  const carpenter = makerFamily().members.map(id => maker.app.state.world.entities[id]).find(one => (one.age ?? 30) >= 16);
  await maker.page.locator(`.panel-portrait[data-portrait="${carpenter.id}"]`).click();
  const icon = maker.page.locator(`.panel-icon[data-key="make-carreta"][data-entity-id="${carpenter.id}"]`);
  // The next tick carries what changed: the site chosen, and the carreta's work open.
  await maker.page.waitForFunction(id => (window.__snapshot.world.work?.[id] || []).some(entry => entry.id === 'make-carreta' && entry.can), carpenter.id, { timeout: 20000 });
  await icon.waitFor({ state: 'visible', timeout: 20000 });
  for (let i = 0; i < 20 && (await icon.getAttribute('aria-disabled')) === 'true'; i++) await maker.page.waitForTimeout(500);
  assert.notEqual(await icon.getAttribute('aria-disabled'), 'true', 'the carreta icon is shut with everything it wants in the house');
  await icon.click();
  // The server's state is read afresh each time: a proof is handed a copy of it.
  const working = () => maker.app.state.world.entities[carpenter.id].chore?.id;
  for (let i = 0; i < 20 && working() !== 'make-carreta'; i++) await maker.page.waitForTimeout(300);
  assert.equal(working(), 'make-carreta', 'pressing the carreta icon did not set anybody to it');
  for (let i = 0; i < 160 && !maker.app.state.world.entities['hh-1-wagon']; i++) await maker.page.waitForTimeout(500);
  const carreta = maker.app.state.world.entities['hh-1-wagon'];
  assert.ok(carreta?.carreta, 'no carreta was made');
  await maker.post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, maker.hostCookie);
  await maker.page.waitForFunction(() => window.__snapshot.world.status === 'paused');
  await maker.page.waitForFunction(() => window.__snapshot.world.entities.some(one => one.id === 'hh-1-wagon' && one.carreta), null, { timeout: 15000 });
  for (let i = 0; i < 8; i++) {
    const at = await maker.page.evaluate(() => window.__drawnAt?.['hh-1-wagon'] || null);
    if (at && at.size >= 50) break;
    if (at) await maker.page.mouse.move(at.x, at.y);
    await maker.page.mouse.wheel(0, -300);
    await maker.page.waitForTimeout(400);
  }
  if (await maker.page.locator('#selection-close').isVisible().catch(() => false)) await maker.page.locator('#selection-close').click();
  await maker.page.waitForTimeout(1200);
  const drawnCarreta = await maker.page.evaluate(() => window.__drawnAt?.['hh-1-wagon'] || null);
  assert.ok(drawnCarreta, 'the carreta is not drawn in the yard');
  observed.carreta = { made: maker.app.state.world.events.findLast(event => event.claimId === 'FIC-GONZ-398')?.text, drawn: drawnCarreta, logs: makerFamily().logs, hides: makerFamily().resources.hides };
  assert.deepEqual(observed.carreta.logs, { wall: 1, sill: 0, poor: 0 });
  await maker.page.screenshot({ path: join(SHOTS, 'means-carreta-1366.png') });
  ok(`${carpenter.name} makes a carreta from the family panel: "${observed.carreta.made}"; it stands in the yard, drawn at ${Math.round(drawnCarreta.size)} px`);
  await maker.app.close();

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/means-browser.json', JSON.stringify({ record: 'means-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    ownerDirection: '"introduce rolling for starting wealth. tie it into the extra wagons. part of wealth will be number of wagons. if a family doesn\'t have enough wagons, older family members walk. have this potentially affect travelling speed." (2026-09-25)',
    checks: pass, observed, notProved: ['Same computer only: no physical LAN, no Chromebook, no class.', 'The Runaway Scrape with walkers is proved headless (tests/means.test.mjs, tests/afoot.test.mjs), not in this browser proof.', 'The carreta proof puts the logs in the pile and the hide in the house on the server, and the site as marked, rather than felling, hauling and hunting in the browser; the woods and hunting proofs drive those.'] }, null, 2) + '\n');
} finally {
  await browser.close();
}

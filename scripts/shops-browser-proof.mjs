// The shops of the towns, in a real browser: docs/TOWNS.md.
//
// tests/shops.test.mjs proves what every trade does. This proves a student can use the street with
// the controls they have: the Go to town to trade icon on a person's row, the popup listing the shops
// that stand there (since 2026-09-24 chosen before anybody leaves, docs/TOWNS.md §4b), every offer
// saying what it costs, a meal at the tavern paid for in food, and the keepers standing in the town
// when one of the family is there. scripts/errand-browser-proof.mjs proves the popup's load and wagon.
//
// Since the owner's request of 2026-10-03 ("we should also add the ability to buy a mule in town. mules were a lot cheaper than
// horses."; docs/TOWNS.md §4h): a mule is bought at the stock pens for less than half a horse, is seen led home and standing in
// the yard as a mule (Claude's stand-in, request 2026-10-03 - riders in every vehicle), and is then chosen on the way card and
// ridden to town, drawn with its rider in the saddle.
//
// Run: npm run test:shops
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';
// docs/FAMILY_PANEL.md §12 (owner, 2026-09-21): a person's work is on the screen only while they are the family's main
// person, so this proof chooses them first, as a student does.
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

// Coin put by for a mule (2026-10-03), set when the class is made; the proof reads the server's world and never writes it.
const app = createClassroom({ seed: 'shops-proof', playerCount: 5, tickMs: 200, worldFactory: (seed, count) => {
  const world = keepFoundingFamilies(createSettledWorld(seed, count));
  world.households['hh-1'].resources = { ...world.households['hh-1'].resources, money: 40 };
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
/** Press + on a line until its count reads `n`, waiting for the server's quote each time. */
async function setCount(page, id, n) {
  for (let i = 0; i < 40; i++) {
    const count = Number(await page.locator(`#errand [data-line="${id}"]`).getAttribute('data-count'));
    if (count === n) return;
    await page.locator(`#errand [data-line="${id}"] [data-act="${count < n ? 'more' : 'less'}"]`).click();
  }
  throw new Error(`${id} never reached ${n}`);
}
/** A box of the screen around where something was drawn this frame, for a close photograph. */
const around = (page, id) => page.evaluate(who => { const at = window.__drawnAt[who]; const s = Math.max(60, at.size * 2.2); const x = Math.min(Math.max(0, at.x - s), innerWidth - 2 * s), y = Math.min(Math.max(0, at.y - s), innerHeight - 2 * s); return { x: Math.max(0, x), y: Math.max(0, y), width: Math.min(s * 2, innerWidth), height: Math.min(s * 2, innerHeight) }; }, id);
/** Whether something was drawn on the screen this frame, inside the window. */
const inView = (page, id, bottom = 40) => page.waitForFunction(([who, below]) => { const at = window.__drawnAt?.[who]; return at && at.x > 40 && at.y > 40 && at.x < innerWidth - 40 && at.y < innerHeight - below; }, [id, bottom], { timeout: 30000 });
const idle = (page, id) => page.waitForFunction(who => { const one = window.__snapshot?.world.entities.find(e => e.id === who); return one && !one.chore && !one.travel; }, id, { timeout: 180000 });
const lines = page => page.locator('#errand .errand-line').evaluateAll(items =>
  items.map(item => ({ id: item.dataset.line, label: item.querySelector('.errand-label')?.textContent, note: item.querySelector('.errand-price')?.textContent, shop: item.closest('.errand-shop')?.querySelector('.errand-shop-name')?.textContent, shut: item.dataset.shut === 'true' })));

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Shops reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  // The title screen and the family made, before the world is drawn (public/creation.js, owner 2026-09-17).
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  const worker = 'hh-1-elena';
  await asMain(page, worker);
  const icon = page.locator(`.panel-row[data-entity-id="${worker}"] .panel-icon[data-key="visit-shop"]`);
  await icon.waitFor({ state: 'visible' });
  observed.icon = await icon.getAttribute('data-summary');
  await icon.click();
  ok(`the family panel offers the street: "${observed.icon}"`);

  // The popup lists the shops that stand in the family's town, before anybody leaves.
  await page.locator('#errand').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('#errand .errand-line').length > 5);
  const street = await lines(page);
  observed.street = [...new Set(street.map(line => line.shop))];
  for (const trade of ['blacksmith', 'gunsmith', 'doctor', 'tavern', 'tanner', 'wheelwright', 'mill', 'weaver']) {
    assert.ok(street.some(line => line.id.startsWith(`${trade}:`)), `the street has no ${trade}: ${street.map(line => line.id)}`);
  }
  for (const line of street) assert.ok(line.note && line.note.length > 4, `${line.id} says nothing of its price or why it is shut`);
  observed.counter = street.filter(line => line.id.startsWith('tavern:'));
  ok(`in Gonzales the popup lists ${observed.street.length} shops, every offer with its price: ${observed.street.join('; ')}`);

  // A meal at the tavern, paid in food, and the person sent with that list.
  await page.locator('#errand [data-line="tavern:meal"] [data-act="more"]').click();
  await page.locator('#errand [data-line="tavern:meal"] [data-act="pay-food"]').click();
  await page.waitForFunction(() => !document.querySelector('#errand-send').disabled, null, { timeout: 15000 });
  await page.locator('#errand-send').click();
  await page.locator('#errand').waitFor({ state: 'hidden', timeout: 10000 });

  // In town, the keepers are standing there with the family's person.
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.location?.siteId === 'gonzales', worker, { timeout: 60000 });
  const keepers = await page.evaluate(() => window.__snapshot.world.others.filter(o => o.resident).map(o => o.name));
  observed.keepers = keepers;
  assert.ok(keepers.length >= 8, `only ${keepers.length} townspeople are in sight: ${keepers}`);
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/shops-street.png' });
  ok(`${keepers.length} townspeople are in sight in Gonzales: ${keepers.join(', ')}`);

  await page.waitForFunction(() => (window.__snapshot?.world.events || []).some(e => /ate at the tavern/.test(e.text)), null, { timeout: 30000 });
  observed.story = await page.evaluate(() => window.__snapshot.world.events.find(e => /ate at the tavern/.test(e.text)).text);
  ok(`a meal at the tavern, paid in food, is in the family's story: "${observed.story}"`);

  // ------------------------------------------------ a mule at the stock pens, led home, standing in the yard, and ridden
  await idle(page, worker);
  await asMain(page, worker);
  await page.locator(`.panel-row[data-entity-id="${worker}"] .panel-icon[data-key="visit-shop"]`).click();
  await page.locator('#errand').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('#errand [data-line="stockman:mule"]'));
  const pens = await page.evaluate(() => [...document.querySelectorAll('#errand [data-line^="stockman:"]')].map(line => ({ id: line.dataset.line, label: line.querySelector('.errand-label').textContent, price: line.querySelector('.errand-price').textContent })));
  observed.pens = pens;
  const muleLine = pens.find(one => one.id === 'stockman:mule'), horseLine = pens.find(one => one.id === 'stockman:horse');
  assert.equal(muleLine.price, '10 reales');
  assert.ok(parseInt(muleLine.price, 10) * 2 <= parseInt(horseLine.price, 10), `a mule (${muleLine.price}) is not a lot cheaper than a horse (${horseLine.price})`);
  await setCount(page, 'stockman:mule', 1);
  await page.waitForFunction(() => !document.querySelector('#errand-send').disabled && /Leads the new mule home on a halter\./.test(document.querySelector('#errand-how').textContent), null, { timeout: 15000 });
  observed.muleHow = await page.locator('#errand-how').textContent();
  await page.locator('#errand-send').click();
  await page.locator('#errand').waitFor({ state: 'hidden', timeout: 10000 });
  // Led home on its halter beside its buyer, drawn as a mule of its own.
  await page.waitForFunction(() => window.__snapshot?.world.entities.find(e => e.id === 'hh-1-mule')?.travel?.mode === 'foot', null, { timeout: 120000 });
  assert.equal(app.state.world.entities['hh-1-mule'].travel?.purpose, 'lead');
  await page.waitForFunction(() => /^mule-walk/.test(window.__mulesDrawn?.['hh-1-mule'] || ''), null, { timeout: 60000 });
  observed.muleLed = await page.evaluate(() => window.__mulesDrawn['hh-1-mule']);
  await idle(page, worker);
  const home = app.state.world;
  assert.equal(home.entities['hh-1-mule'].location.siteId, home.households['hh-1'].homeSiteId, 'the mule did not come home');
  await page.waitForFunction(() => window.__mulesDrawn?.['hh-1-mule'] === 'mule-idle' && window.__drawnAt?.['hh-1-mule'] && window.__drawnAt?.['hh-1-horse'], null, { timeout: 60000 });
  observed.muleYard = await page.evaluate(() => ({ mule: window.__drawnAt['hh-1-mule'], horse: window.__drawnAt['hh-1-horse'], clip: window.__mulesDrawn['hh-1-mule'] }));
  const apart = Math.round(Math.hypot(observed.muleYard.mule.x - observed.muleYard.horse.x, observed.muleYard.mule.y - observed.muleYard.horse.y));
  assert.ok(apart >= 8, `the mule is drawn on the horse (${apart} px apart)`);
  if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
  // The camera to the family's land, as a student presses Land, so the yard is on the screen for its photograph.
  await page.locator('[data-view="home"]').click();
  // The yard stands below the house, behind the action bar at this size: the map dragged up a little, as a student would.
  await page.waitForTimeout(600);
  for (let i = 0; i < 3; i++) {
    const at = await page.evaluate(() => window.__drawnAt?.['hh-1-mule']);
    if (at && at.y < 600) break;
    await page.mouse.move(720, 560); await page.mouse.down(); await page.mouse.move(720, 260, { steps: 10 }); await page.mouse.up();
    await page.waitForTimeout(400);
  }
  await inView(page, 'hh-1-mule', 300);
  await page.screenshot({ path: 'test-results/shops-mule-yard.png' });
  await page.screenshot({ path: 'docs/evidence/mule-yard.png', clip: await around(page, 'hh-1-mule') });
  ok(`a mule is bought at the stock pens for ${muleLine.price} against a horse's ${horseLine.price} ("${observed.muleHow}"), led home drawn ${observed.muleLed}, and stands in the yard drawn ${observed.muleYard.clip}, ${apart} px from the horse`);
  // Ridden: the mule chosen on the way card, and the rider drawn in its saddle.
  const pace = app.pace;
  app.setPace(5000);
  await asMain(page, worker);
  await page.locator(`.panel-row[data-entity-id="${worker}"] .panel-icon[data-key="visit-shop"]`).click();
  await page.locator('#errand').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('#errand .errand-line').length > 5);
  await setCount(page, 'store:seed', 1);
  await page.locator('#errand [data-line="store:seed"] [data-act="pay-coin"]').click();
  await page.locator('#errand [data-way="mule"]').waitFor({ state: 'visible', timeout: 15000 });
  observed.muleCard = await page.locator('#errand [data-way="mule"]').textContent();
  await page.locator('#errand [data-way="mule"]').click();
  await page.waitForFunction(() => !document.querySelector('#errand-send').disabled && /^Rides the mule/.test(document.querySelector('#errand-how').textContent), null, { timeout: 15000 });
  observed.muleRideHow = await page.locator('#errand-how').textContent();
  await page.locator('#errand-send').click();
  await page.locator('#errand').waitFor({ state: 'hidden', timeout: 10000 });
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.travel?.mode === 'mule', worker, { timeout: 30000 });
  await page.waitForFunction(id => window.__seatedDrawn?.[id]?.mount === 'mule' && /^mule-saddled-walk/.test(window.__mulesDrawn?.['hh-1-mule'] || ''), worker, { timeout: 60000 });
  observed.muleRidden = await page.evaluate(id => ({ seat: window.__seatedDrawn[id], clip: window.__mulesDrawn['hh-1-mule'] }), worker);
  assert.equal(app.state.world.entities['hh-1-mule'].borrowedBy, worker);
  if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
  // Closer, and once she has turned onto a leg going east or west, so the mule under her is seen side-on.
  for (let i = 0; i < 2; i++) await page.locator('[data-view="in"]').click();
  await page.waitForFunction(id => ['e', 'w'].includes(window.__seatedDrawn?.[id]?.direction), worker, { timeout: 90000 }).catch(() => {});
  await inView(page, worker);
  observed.muleRiddenSeen = await page.evaluate(id => ({ seat: window.__seatedDrawn[id], clip: window.__mulesDrawn['hh-1-mule'] }), worker);
  assert.equal(observed.muleRiddenSeen.seat.mount, 'mule');
  await page.screenshot({ path: 'test-results/shops-mule-ridden.png' });
  await page.screenshot({ path: 'docs/evidence/mule-ridden.png', clip: await around(page, worker) });
  app.setPace(pace);
  ok(`the mule is chosen on its way card ("${observed.muleCard}"), "${observed.muleRideHow}", and its rider is drawn in the saddle of ${observed.muleRidden.clip}`);

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/shops-browser.json', `${JSON.stringify({
    record: 'The shops of the towns, in a browser: docs/TOWNS.md',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only. A student pressed Go to town to trade on the family panel, read every shop of Gonzales and its prices in the popup, put a meal at the tavern paid in food on the list and sent the person; the keepers were in sight while the person was in Gonzales, and the meal is in the story. Since 2026-10-03 the same person bought a mule at the stock pens, led it home, saw it standing in the yard, and rode it to town chosen on its way card, drawn in its saddle (Claude\'s stand-in mule). Every other trade is proved in tests/shops.test.mjs and tests/mules.test.mjs; the load and the wagon in scripts/errand-browser-proof.mjs. No LAN or district claim.',
    checks: pass,
    observed,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}

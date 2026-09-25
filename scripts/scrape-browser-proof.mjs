// The Runaway Scrape, in the browser: docs/COLONIES.md §7g, build step 10.
//
// tests/scrape.test.mjs proves the rules - the orders, the room, the burning, the rivers, the sickness, the road home. This
// proves what a student does: on the morning of March 14 a "!" on the main person's row opens the card at the family's
// decision; the student loads the wagon, chooses where east to make for, presses Leave and confirms; the family is on the
// road with the wagon, the house is drawn burned, and the record says they watched it burn.
//
// The class is a real one on the colonies map with rolled families, played in process through the first two periods and
// continued into the spring; the seed is one whose first family lives at Gonzales, so the order comes at once.
//
// Same computer only: headless Chrome. Run: npm run test:scrape
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { flightRoom } from '../sim/scrape.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

function inTheSpring(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginThirdPeriod(world);
  const household = world.households['hh-1'];
  household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  household.resources = { ...household.resources, food: 60, seed: 4, cotton: 6 };
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'scrape-proof-1', playerCount: 5, tickMs: 4000, worldFactory: inTheSpring });
assert.equal(app.state.world.period, 3, 'the class did not reach the spring');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });

try {
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Scrape reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  // The family's last name and how the parents look, asked for once the rolled family is the student's (owner, 2026-09-17).
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

  // Told to leave: the "!" on the main person opens the card at the decision.
  await student.waitForFunction(() => window.__snapshot?.world.flight?.status === 'ordered', null, { timeout: 60000 });
  const main = app.state.world.households['hh-1'].mainId || app.state.world.households['hh-1'].principalId;
  const attention = student.locator(`[data-attention="${main}"]`);
  await attention.waitFor({ state: 'visible', timeout: 30000 });
  await attention.click({ force: true });
  await student.locator('#selection-flight [data-action="flee"]').waitFor({ state: 'visible', timeout: 15000 });
  observed.card = (await student.locator('#selection-flight').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.card, /told to leave for the east/);
  // The room of what the family has at home to carry it (sim/scrape.mjs `flightRoom`): a wagon's 20, a cart's 15 or the wagons'
  // together, since a family's means give it a cart or more wagons (sim/means.mjs, 2026-09-25).
  const room = flightRoom(app.state.world, app.state.world.households['hh-1']);
  assert.match(observed.card, new RegExp(`Room for ${room.room} in the ${room.cart ? 'cart' : room.wagons ? `${room.wagons} wagons` : 'wagon'}`));
  ok(`the "!" opens the family's decision: "${observed.card.slice(0, 120)}…"`);

  // Load the wagon and choose where to make for; too much is said to be too much.
  await student.locator('#selection-flight .flight-amount[data-take="food"]').fill('60');
  await student.locator('#selection-flight .flight-amount[data-take="seed"]').fill('4');
  await student.locator('#selection-flight .flight-amount[data-take="cotton"]').fill('6');
  observed.over = await student.locator('#flight-room').evaluate(one => ({ text: one.textContent, over: one.dataset.over }));
  assert.equal(observed.over.over, 'true', 'an overloaded wagon was not marked');
  // As much food as fits beside the seed and the cotton: forty in a wagon, fewer in a cart.
  const fitFood = Math.min(40, Math.floor((room.room - 4 * 1 - 6 * 0.5) / 0.25));
  await student.locator('#selection-flight .flight-amount[data-take="food"]').fill(String(fitFood));
  observed.fits = await student.locator('#flight-room').evaluate(one => ({ text: one.textContent, over: one.dataset.over }));
  assert.equal(observed.fits.over, 'false');
  const refuge = await student.locator('#flight-refuge').evaluate(select => select.value);
  ok(`the load is tallied against the room (${observed.over.text} → ${observed.fits.text}); making for ${refuge}`);

  // Leaving is asked twice; then the family is on the road and the farm burned.
  await student.locator('#selection-flight [data-action="flee"]').click();
  assert.equal(app.state.world.households['hh-1'].flight.status, 'ordered', 'one press sent the family');
  await student.locator('#selection-flight [data-action="flee"]', { hasText: 'Confirm' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.flight?.status === 'fled', null, { timeout: 15000 });
  const household = app.state.world.households['hh-1'];
  assert.deepEqual({ food: household.resources.food, seed: household.resources.seed, cotton: household.resources.cotton }, { food: fitFood, seed: 4, cotton: 6 });
  assert.equal(household.improvements.cabin, 'ruined');
  await student.waitForFunction(() => window.__snapshot?.world.land?.cabin === 'ruined', null, { timeout: 15000 });
  observed.land = await student.evaluate(() => ({ cabin: window.__snapshot.world.land.cabin, wagon: Boolean(window.__snapshot.world.entities.find(e => e.kind === 'wagon')?.travel), card: document.querySelector('#selection-flight')?.innerText }));
  assert.equal(observed.land.wagon, true, 'the wagon is not drawn on the road');
  assert.equal(app.state.world.entities['hh-1-wagon'].travel?.purpose, 'flee', 'the wagon is not fleeing');
  assert.ok(app.state.world.events.some(event => event.householdId === 'hh-1' && /watched it burn/.test(event.text)));
  await student.waitForTimeout(500);
  await student.screenshot({ path: 'docs/evidence/scrape-leaving.png' });
  ok(`asked twice, the family loads ${fitFood} food, 4 seed and 6 cotton and sets out with its ${room.cart ? 'cart' : 'wagon'}; the house is burned behind it`);

  await student.setViewportSize({ width: 400, height: 860 });
  await student.waitForTimeout(600);
  const overflow = await student.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  ok('at phone width the page does not scroll sideways');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/scrape-browser.json', `${JSON.stringify({
    record: 'The Runaway Scrape, in a browser: docs/COLONIES.md §7g, build step 10',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map with rolled families, played in process through two periods and continued into the spring, the seed one whose first family lives at Gonzales; then served live: the student pressed the "!", loaded the wagon, chose a refuge and left. No LAN or district claim.',
    checks: pass, observed, screenshots: ['docs/evidence/scrape-leaving.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}

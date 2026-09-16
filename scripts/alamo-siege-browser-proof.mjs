// The siege of the Alamo, in the browser: docs/COLONIES.md §7f, build step 9.
//
// tests/alamo.test.mjs proves the rules - who is shut in, the couriers chosen, the relief, the fall, the word, the south. This
// proves what a student sees when somebody of theirs is inside: their row has no order but a dimmed "Send for them", the card
// says they are shut in the Alamo, and on the day Travis wants riders a "!" on the row opens the card at the question, whose
// answer the server takes.
//
// The class is a real one on the colonies map with rolled families, played in process through the first period, continued
// into the winter, with hh-1's father set in the garrison at Béxar in process (said so in the record) and run to just after
// the Mexican army arrives on February 23.
//
// Same computer only: headless Chrome. Run: npm run test:alamo-siege
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

function besieged(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world);
  world.status = 'running';
  const household = world.households['hh-1'];
  const father = household.members.map(id => world.entities[id]).find(person => person.kin?.role === 'father') || world.entities[household.members[0]];
  for (let i = 0; i < 400 && !world.director.milestones['winter-news']; i++) stepWorld(world);
  const site = world.map.sites.bexar;
  Object.assign(father, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' }, service: { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar' } });
  for (let i = 0; i < 2000 && !world.director.milestones['alamo-siege']; i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'alamo-siege-proof', playerCount: 5, tickMs: 8000, worldFactory: besieged });
const father = Object.values(app.state.world.entities).find(person => person.householdId === 'hh-1' && person.service?.besieged);
assert.ok(father, 'nobody of hh-1 is shut in the Alamo');
assert.equal(app.state.world.director.milestones['courier-1-opens'], undefined, 'the riders were asked for before the browser could watch');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });

try {
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Alamo reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
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

  // Shut in: the row has nothing to give them, and says why in place of its icons.
  await student.waitForFunction(id => [...document.querySelectorAll('.panel-reason')].some(one => /shut in the Alamo/.test(one.textContent)), father.id, { timeout: 30000 });
  observed.row = await student.evaluate(() => [...document.querySelectorAll('.panel-reason')].map(one => one.textContent).find(text => /shut in the Alamo/.test(text)));
  assert.equal(await student.locator(`.panel-icon[data-entity-id="${father.id}"]:not([aria-disabled="true"])`).count(), 0, 'somebody shut in the Alamo has an order they can be given');
  ok(`${father.name}'s row gives no order and says why: "${observed.row}"`);

  // The day riders go out: a "!" on the row opens the card at Travis's question.
  const attention = student.locator(`[data-attention="${father.id}"]`);
  await attention.waitFor({ state: 'visible', timeout: 120000 });
  // The "!" bobs, so it is pressed where it is rather than waited on to stand still.
  await attention.click({ force: true });
  const offer = student.locator('#selection-work [data-action="alamo-courier"][data-answer="volunteer"]');
  await offer.waitFor({ state: 'visible', timeout: 15000 });
  observed.card = (await student.locator('#selection-work').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.card, /shut in the Alamo/);
  assert.match(observed.card, /Travis wants riders/);
  assert.doesNotMatch(observed.card, /kill|die|death|danger|risk/i, 'the question says what an answer risks');
  await student.screenshot({ path: 'docs/evidence/alamo-siege-courier.png' });
  ok(`the "!" opens the card at Travis's question: "${observed.card}"`);

  await offer.click();
  await student.waitForFunction(() => !document.querySelector('#selection-work [data-action="alamo-courier"]'), null, { timeout: 15000 });
  assert.equal(app.state.world.entities[father.id].service.courier, 'volunteered');
  await student.waitForFunction(id => !document.querySelector(`[data-attention="${id}"]:not([hidden])`), father.id, { timeout: 15000 });
  ok('offering to ride out is taken by the server, and the "!" goes');

  await student.setViewportSize({ width: 400, height: 860 });
  await student.waitForTimeout(600);
  const overflow = await student.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  ok('at phone width the page does not scroll sideways');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/alamo-siege-browser.json', `${JSON.stringify({
    record: 'The siege of the Alamo, in a browser: docs/COLONIES.md §7f, build step 9',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map with rolled families, played in process through the first period and into the winter, hh-1\'s father set in the garrison at Béxar in process, and run to just after February 23; then served live: a student saw the row shut, pressed the "!" on the day riders went out, and offered to ride. No LAN or district claim.',
    checks: pass, observed, screenshots: ['docs/evidence/alamo-siege-courier.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}

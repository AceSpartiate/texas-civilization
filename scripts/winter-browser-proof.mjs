// The winter's choices, in the browser: docs/COLONIES.md §7e, build step 8(b).
//
// tests/winter.test.mjs proves the rules - who may go, one person in one place, desertion, the vote, the land at the end,
// and the families nobody plays. This proves what a student does in the second class period: the winter's orders are on
// the family panel, pressing "Enlist in the regular army" sends the person to San Felipe and they sign on; their card then
// says where they are and what was promised, and sending for them is asked twice before a regular deserts and starts home.
//
// The class is a real one on the colonies map, played in process through the first period and continued into the winter
// to the morning its news comes, because the first period alone is some four hundred ticks.
//
// Same computer only: headless Chrome. Run: npm run test:winter
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

function inTheWinter(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world);
  world.status = 'running';
  for (let i = 0; i < 400 && !world.director.milestones['winter-news']; i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'winter-proof', playerCount: 5, tickMs: 1500, worldFactory: inTheWinter });
assert.equal(app.state.world.period, 2, 'the class did not reach the winter');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });

try {
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Winter reader');
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

  // The winter's orders are on the panel, for somebody who may go.
  const household = app.state.world.households['hh-1'];
  const person = household.members.map(id => app.state.world.entities[id]).find(one => one.kin?.role === 'father' || one.kin?.role === 'mother');
  const icon = key => student.locator(`.panel-icon[data-entity-id="${person.id}"][data-key="${key}"]`);
  await icon('enlist-regular').waitFor({ state: 'visible', timeout: 30000 });
  observed.icons = await student.locator(`.panel-icon[data-entity-id="${person.id}"]`).evaluateAll(buttons => buttons.map(button => button.dataset.key));
  for (const key of ['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros']) assert.ok(observed.icons.includes(key), `${key} is not on the panel`);
  ok(`the winter's orders are on ${person.name}'s row: ${observed.icons.filter(key => /enlist|join/.test(key)).join(', ')}`);

  // Enlisting, from the panel.
  await icon('enlist-regular').click();
  await student.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.service?.status === 'serving', person.id, { timeout: 120000 });
  assert.equal(app.state.world.entities[person.id].location.siteId, 'san-felipe');
  assert.equal(app.state.world.entities[person.id].service.acres, 800);
  ok(`${person.name} rode to San Felipe and enlisted in the regular army on the promise of 800 acres`);

  // Their row has one order now, and their card says where they are.
  await icon('winter-recall').waitFor({ state: 'visible', timeout: 15000 });
  await icon('winter-recall').click();
  const recall = student.locator('#selection-work [data-action="winter-recall"]');
  await recall.waitFor({ state: 'visible', timeout: 15000 });
  observed.card = (await student.locator('#selection-work').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.card, /regular army at San Felipe( de Austin)?, on the promise of 800 acres/);
  assert.match(observed.card, /deserted/);
  await student.screenshot({ path: 'docs/evidence/winter-enlisted.png' });
  ok(`the card says where they are and what leaving costs: "${observed.card}"`);

  // Sending for them is asked twice; the second press deserts.
  await recall.click();
  assert.equal(app.state.world.entities[person.id].service.status, 'serving', 'one press sent for them');
  await student.locator('#selection-work [data-action="winter-recall"]', { hasText: 'Confirm' }).click();
  await student.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.service?.status === 'deserted', person.id, { timeout: 15000 });
  assert.equal(app.state.world.entities[person.id].travel?.to, household.homeSiteId, 'the deserter did not start home');
  ok('sending for a regular is asked twice, and then they have deserted and started home');

  // At phone width.
  await student.setViewportSize({ width: 400, height: 860 });
  await student.waitForTimeout(600);
  const overflow = await student.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  await student.screenshot({ path: 'docs/evidence/winter-phone.png' });
  ok('at phone width the page does not scroll sideways');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/winter-browser.json', `${JSON.stringify({
    record: 'The winter\'s choices, in a browser: docs/COLONIES.md §7e, build step 8(b)',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map with rolled families, played in process through the first period, continued into the winter and run to the morning its news comes; then served live: a student enlisted a parent from the family panel, read the card and sent for them twice. No LAN or district claim.',
    checks: pass, observed, screenshots: ['docs/evidence/winter-enlisted.png', 'docs/evidence/winter-phone.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}

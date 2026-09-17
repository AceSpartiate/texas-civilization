// Houston's camp, in the browser: docs/HOUSTON_CAMP.md. Owner (2026-09-16): "Soldiers in Houston's Army should have things
// to do too. Drilling, etc."
//
// tests/camp.test.mjs proves the rules - the camp's work and who is offered it, drilling counting at San Jacinto, the two
// questions, the director, auto and absence, the Host's words. This proves what a student does: in the spring a father is sent
// from the family panel to join General Houston's army; once he is at the camp his row carries the camp's work and nothing
// else but sending for him; pressing "Drill with the company" sets him drilling and his card says how many days he has
// drilled; with the word of Fannin's defeat a "!" on his row opens his card at the army's question, which says what leaving
// costs, and answering it takes the "!" away; the Host's live page says what he is at in words.
//
// The class is a real one on the colonies map, played in process through the first two periods and into the spring to the
// army's camp on the Colorado, because the first period alone is some four hundred ticks. Seed `camp-proof-3` puts the first
// family at Liberty, whose day to leave (April 13) comes after everything this proves.
//
// Same computer only: headless Chrome. Run: npm run test:camp
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

function atTheColorado(seed, playerCount) {
  // With the neighbours' director, so every family chose its house site and built in the first period: a family that never
  // did is asked to choose the moment its student joins, and that panel would sit over the "!" this proves.
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginThirdPeriod(world); world.status = 'running';
  for (let i = 0; i < 400 && !world.director.milestones['houston-colorado']; i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'camp-proof-3', playerCount: 5, tickMs: 300, worldFactory: atTheColorado });
assert.equal(app.state.world.period, 3, 'the class did not reach the spring');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const world = () => app.state.world;

try {
  // Reduced motion, so the bobbing "!" stands still for the click (the page honours the preference, docs/FAMILY_PANEL.md §11.2).
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 }, reducedMotion: 'reduce' })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Camp reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  // The other four families joined by their key, so the class is five and Start goes ahead on one press.
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

  // The father is sent to join General Houston's army from the panel, and rides to the camp on the Colorado.
  const household = world().households['hh-1'];
  const person = household.members.map(id => world().entities[id]).find(one => one.kin?.role === 'father');
  assert.ok(person && person.health.condition === 'well', 'the first family has no father at home to send');
  const me = () => world().entities[person.id];
  const icon = key => student.locator(`.panel-icon[data-entity-id="${person.id}"][data-key="${key}"]`);
  await icon('join-houston').waitFor({ state: 'visible', timeout: 30000 });
  await icon('join-houston').click();
  await student.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.service?.kind === 'houston', person.id, { timeout: 180000 });
  observed.joined = { name: person.name, at: me().service.siteId, minute: world().minute };
  ok(`${person.name} was sent from the panel and joined Houston's army at ${world().map.sites[me().service.siteId].name}`);

  // His row: the camp's work, then sending for him, and nothing else.
  await icon('camp-drill').waitFor({ state: 'visible', timeout: 30000 });
  observed.icons = await student.locator(`.panel-icon[data-entity-id="${person.id}"]`).evaluateAll(buttons => buttons.map(button => ({ key: button.dataset.key, refused: button.getAttribute('aria-disabled') === 'true' })));
  assert.deepEqual(observed.icons.map(one => one.key), ['camp-drill', 'camp-forage', 'camp-guard', 'camp-scout', 'winter-recall'], JSON.stringify(observed.icons));
  assert.ok(observed.icons.slice(0, 3).every(one => !one.refused), 'the camp\'s work is refused');
  ok(`his row has the camp's work and sending for him: ${observed.icons.map(one => one.key).join(', ')}`);

  // Drill: the icon glows while the server says he is drilling, and the card counts his days.
  await icon('camp-drill').click();
  await student.waitForFunction(id => document.querySelector(`.panel-icon[data-entity-id="${id}"][data-key="camp-drill"]`)?.dataset.active === 'true', person.id, { timeout: 15000 });
  assert.equal(me().chore?.id, 'camp-drill');
  await student.screenshot({ path: 'docs/evidence/camp-drilling.png' });
  ok('pressing "Drill with the company" set him drilling, and the icon glows');
  await student.waitForFunction(id => (window.__snapshot?.world.entities.find(e => e.id === id)?.service?.drilled || 0) >= 1, person.id, { timeout: 60000 });
  await icon('winter-recall').click();
  await student.locator('#selection-work [data-action="winter-recall"]').waitFor({ state: 'visible', timeout: 15000 });
  observed.card = (await student.locator('#selection-work').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.card, /General Houston's army at .*, drilled 1 day/);
  ok(`his card counts the drill: "${observed.card.slice(0, 140)}"`);

  // The word of Fannin's defeat: a "!" on his row opens the card at the army's question, which says what leaving costs.
  const attention = student.locator(`.panel-row[data-entity-id="${person.id}"] .panel-attention`);
  await attention.waitFor({ state: 'visible', timeout: 180000 });
  assert.equal(me().service.leave, 'open');
  observed.need = await student.evaluate(id => window.__familyPanel?.find(row => row.id === id)?.needs || null, person.id);
  await attention.click();
  await student.waitForFunction(id => window.__needOpened?.id === id && window.__needOpened.kind === 'camp', person.id, { timeout: 15000 });
  const stay = student.locator('#selection-work [data-action="houston-answer"][data-answer="no"]');
  await stay.waitFor({ state: 'visible', timeout: 15000 });
  observed.question = (await student.locator('#selection-work').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.question, /Does .* go home\?/);
  assert.match(observed.question, /leaves for home .*Whatever the army does next happens without them|leaves for home .*promise of land|deserted/);
  await student.screenshot({ path: 'docs/evidence/camp-goliad-question.png' });
  ok(`the "!" opened his card at the army's question: "${observed.question.slice(0, 200)}"`);
  await stay.click();
  await student.waitForFunction(id => !window.__snapshot?.world.entities.find(e => e.id === id)?.service?.leave, person.id, { timeout: 15000 });
  assert.equal(me().service.leave, 'no');
  assert.equal(me().service.status, 'serving');
  await student.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.hidden, person.id, { timeout: 15000 });
  ok('answering that he stays took the "!" away, and he is with the army still');

  // The Host reads what he is at, in words.
  await icon('camp-drill').click();
  await student.waitForFunction(id => document.querySelector(`.panel-icon[data-entity-id="${id}"][data-key="camp-drill"]`)?.dataset.active === 'true', person.id, { timeout: 15000 });
  await host.waitForFunction(name => [...document.querySelectorAll('.host-people li')].some(li => li.textContent.includes(name) && /with Houston's army at .*: drilling with the company/.test(li.textContent)), person.name, { timeout: 15000 });
  observed.host = await host.evaluate(name => [...document.querySelectorAll('.host-people li')].map(li => li.textContent).find(text => text.includes(name)), person.name);
  await host.screenshot({ path: 'docs/evidence/camp-host-words.png' });
  ok(`the Host's live page says what he is at: "${observed.host}"`);

  // At phone width.
  await student.setViewportSize({ width: 400, height: 860 });
  await student.waitForTimeout(600);
  const overflow = await student.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  await student.screenshot({ path: 'docs/evidence/camp-phone.png' });
  ok('at phone width the page does not scroll sideways');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/camp-browser.json', `${JSON.stringify({
    record: 'Houston\'s camp, in a browser: docs/HOUSTON_CAMP.md',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map with rolled families, played in process through two periods and into the spring to the army\'s camp on the Colorado; then served live: a student sent the father to join Houston from the family panel, set him drilling from his row, read his card, answered the army\'s question from the "!" when the word of Goliad came, and the Host read what he was at. No LAN or district claim.',
    checks: pass, observed, screenshots: ['docs/evidence/camp-drilling.png', 'docs/evidence/camp-goliad-question.png', 'docs/evidence/camp-host-words.png', 'docs/evidence/camp-phone.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  if (errors.length) console.log('page errors:', errors.join(' | '));
  await browser.close();
  await app.close();
}

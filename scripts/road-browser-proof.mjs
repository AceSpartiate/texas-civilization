// The road east, in the browser: docs/ROAD_EAST.md (owner, 2026-09-16).
//
// tests/road.test.mjs proves the rules - the rain and the bog, the camp, the pursuit, who answers. This proves what a student
// and a teacher see: a wagon bogged on a rain day raises the "!" on the main person, which opens the card at the family's
// question with its three priced answers, and Unload and dig it out is pressed; Hunt from the camp is pressed on a row of the
// panel and the card says the family has halted while the Host's row says so in words; and later, camped at San Felipe as
// Santa Anna's column nears, the "!" opens the warning with Go on east to Lynchburg, which is pressed, and the family is on
// the road again. The class is a real one on the colonies map with rolled families, played in process through the first two
// periods and continued into the spring; the seed is the tests' own, chosen for rain on the family's first days on the road.
//
// Same computer only: headless Chrome. Run: npm run test:road
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
const shots = [];

function inTheSpring(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginThirdPeriod(world);
  const household = world.households['hh-1'];
  assert.equal(household.settlementId, 'gonzales', 'the seed no longer deals the first family to Gonzales');
  household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  household.resources = { ...household.resources, food: 60, seed: 4, cotton: 2, powder: 4, money: 2 };
  world.status = 'lobby';
  return world;
}

// A tick every second and a half: the road's question holds the calendar twelve ticks for a played family, which is time to
// read it and press; the hunt's shot is decided by the family's own patience and is not pressed here.
const app = createClassroom({ seed: 'road-1638', playerCount: 8, tickMs: 1500, worldFactory: inTheSpring });
assert.equal(app.state.world.period, 3, 'the class did not reach the spring');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const world = () => app.state.world;
const household = () => world().households['hh-1'];
const shot = async (page, name) => { const path = `docs/evidence/road-${name}.png`; await page.screenshot({ path }); shots.push(path); };
const hostRow = host => host.evaluate(() => window.__hostLive?.families.find(f => f.id === 'hh-1'));

try {
  const student = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Road reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 8; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  const host = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running');

  // ---------------------------------------------------------------------------------------------- told to leave: go
  await student.waitForFunction(() => window.__snapshot?.world.flight?.status === 'ordered', null, { timeout: 60000 });
  const main = household().mainId || household().principalId;
  await student.locator(`[data-attention="${main}"]`).waitFor({ state: 'visible', timeout: 30000 });
  await student.locator(`[data-attention="${main}"]`).click({ force: true });
  await student.locator('#selection-flight [data-action="flee"]').waitFor({ state: 'visible', timeout: 15000 });
  // Fifty of the sixty: the family has eaten since the morning, and the house is asked for whole amounts it still has.
  await student.locator('#selection-flight .flight-amount[data-take="food"]').fill('50');
  await student.locator('#selection-flight .flight-amount[data-take="powder"]').fill('4');
  await student.locator('#flight-refuge').selectOption('san-felipe');
  await student.locator('#selection-flight [data-action="flee"]').click();
  await student.locator('#selection-flight [data-action="flee"]', { hasText: 'Confirm' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.flight?.status === 'fled', null, { timeout: 15000 });
  assert.equal(household().flight.mode, 'wagon');
  ok('told to leave, the family loaded the wagon and set out for San Felipe');

  // ---------------------------------------------------------------------------------------------- the bog, and digging out
  await student.waitForFunction(() => window.__snapshot?.world.flight?.ask?.id === 'bog', null, { timeout: 60000 });
  assert.ok(household().flight.bog, 'the wagon is not in the mud');
  const attention = student.locator(`[data-attention="${main}"]`);
  await attention.waitFor({ state: 'visible', timeout: 15000 });
  observed.bogNeed = await attention.getAttribute('data-need');
  assert.equal(observed.bogNeed, 'road', `the "!" is for ${observed.bogNeed}, not the road`);
  await attention.click({ force: true });
  await student.locator('#selection-flight [data-action="road-answer"][data-option="dig"]').waitFor({ state: 'visible', timeout: 15000 });
  observed.bogCard = (await student.locator('#selection-flight').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.bogCard, /fast in the mud/);
  assert.match(observed.bogCard, /It is raining/);
  observed.bogAnswers = await student.locator('#selection-flight [data-action="road-answer"]').evaluateAll(buttons => buttons.map(b => ({ option: b.dataset.option, disabled: b.disabled, text: b.innerText.replace(/\s+/g, ' ').trim() })));
  assert.deepEqual(observed.bogAnswers.map(a => a.option), ['dig', 'wait', 'abandon']);
  assert.ok(observed.bogAnswers.every(a => /hours|Nothing spent|carries/.test(a.text)), 'an answer without its price');
  observed.hostBogged = (await hostRow(host))?.people?.map(p => p.where);
  assert.ok(observed.hostBogged?.some(where => /bogged in the mud on the road east to San Felipe/.test(where)), `the Host's row does not say bogged: ${observed.hostBogged}`);
  await shot(student, 'bogged');
  await student.locator('#selection-flight [data-action="road-answer"][data-option="dig"]').click();
  await student.waitForFunction(() => window.__snapshot?.world.flight?.bogged?.freeing === true, null, { timeout: 15000 });
  assert.ok(household().flight.bog?.freeing, 'digging was not begun');
  await student.waitForFunction(() => !window.__snapshot?.world.flight?.bogged, null, { timeout: 30000 });
  assert.ok(Number.isFinite(household().flight.oxSpentUntil), 'the ox was not spent');
  observed.dugOut = (await student.locator('#selection-flight').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.dugOut, /ox is spent/);
  ok(`the wagon bogged on a rain day; the "!" opened the card at the question with three priced answers, and the Host's row read bogged; Unload and dig it out was pressed and the wagon came free with the ox spent`);

  // ---------------------------------------------------------------------------------------------- hunt from the camp
  // Looked up by id each time: the server's world object is replaced between ticks, so a person held from before is stale.
  const hunterId = (household().members.map(id => world().entities[id]).find(one => one.id !== main && one.kind === 'person' && (one.kin?.role === 'father' || one.kin?.role === 'mother' || one.age >= 16)) || world().entities[main]).id;
  const hunter = () => world().entities[hunterId];
  await student.waitForFunction(id => { const icon = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="hunt-road"]`); return icon && !icon.disabled; }, hunterId, { timeout: 60000 });
  await student.locator(`.panel-row[data-entity-id="${hunterId}"] .panel-icon[data-key="hunt-road"]`).click();
  await student.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.chore?.id === 'hunt-road', hunterId, { timeout: 15000 });
  assert.equal(hunter().chore?.id, 'hunt-road');
  assert.ok(household().members.map(id => world().entities[id]).filter(one => one.travel).every(one => one.travel.halted), 'the family went on while the hunter was out');
  observed.huntGlow = await student.evaluate(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="hunt-road"]`)?.dataset.active, hunterId);
  assert.equal(observed.huntGlow, 'true', 'the hunt icon does not glow');
  await student.locator(`.panel-row[data-entity-id="${main}"] .panel-portrait`).click();
  await student.waitForFunction(() => /halted: hunt from the camp/i.test(document.querySelector('#selection-flight')?.innerText || ''), null, { timeout: 15000 });
  observed.hostCamped = (await hostRow(host))?.people?.map(p => p.where);
  assert.ok(observed.hostCamped?.some(where => /camped on the road east to San Felipe de Austin: hunt from the camp/.test(where)), `the Host's row does not say camped: ${observed.hostCamped}`);
  await shot(student, 'camp');
  ok(`Hunt from the camp pressed on ${hunter().name}'s row: the icon glows, the family is halted, the card says so and the Host's row reads camped: hunt from the camp`);
  await student.waitForFunction(id => !window.__snapshot?.world.entities.find(e => e.id === id)?.chore, hunterId, { timeout: 90000 });
  ok('the hunt ended and the family went on');

  // ---------------------------------------------------------------------------------------------- the pursuit, at San Felipe
  // The class is run on fast (`app.setPace`; `app.state` is a copy, so the live world cannot be stepped in process) to the
  // days the column nears San Felipe, the family answering nothing meanwhile (its questions are decided by silence, which
  // digs out and presses on); the moment the warning is put, the pace is the class's again so the pages see it stand.
  app.setPace(300);
  const started = Date.now();
  while (household().flight?.ask?.id !== 'danger') {
    assert.ok(Date.now() - started < 600000, `no warning came at San Felipe in ten minutes: ${JSON.stringify(household().flight)}`);
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  app.setPace(1500);
  observed.pursuitReached = { tick: world().tick, danger: { ...household().flight.danger } };
  assert.equal(household().flight.refuge, 'san-felipe', `the family is not camped at San Felipe: ${household().flight.status} ${household().flight.refuge}`);
  assert.ok(household().flight.danger, 'no warning stands at San Felipe');
  const warned = student.locator(`[data-attention="${main}"]`);
  await warned.waitFor({ state: 'visible', timeout: 15000 });
  await warned.click({ force: true });
  await student.locator('#selection-flight [data-action="road-answer"][data-option="press-on"]').waitFor({ state: 'visible', timeout: 15000 });
  observed.dangerCard = (await student.locator('#selection-flight').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.dangerCard, /Santa Anna.s column is about \d+ miles off/);
  assert.match(observed.dangerCard, /Go on east to Lynchburg/);
  observed.hostWaiting = (await hostRow(host))?.waiting;
  assert.ok(observed.hostWaiting >= 1, 'the Host does not count the warning as waiting on the family');
  await shot(student, 'warned');
  await student.locator('#selection-flight [data-action="road-answer"][data-option="press-on"]').click();
  await student.waitForFunction(() => window.__snapshot?.world.flight?.status === 'fled' && window.__snapshot?.world.flight?.refuge === 'lynchburg', null, { timeout: 15000 });
  assert.equal(household().flight.refuge, 'lynchburg');
  assert.equal(household().flight.overtaken, undefined);
  ok(`camped at San Felipe as Santa Anna's column neared, the "!" opened the warning (${observed.dangerCard.match(/about \d+ miles off/)?.[0]}); Go on east to Lynchburg was pressed and the family is on the road again`);

  await student.setViewportSize({ width: 400, height: 860 });
  await student.waitForTimeout(600);
  const overflow = await student.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  ok('at phone width the page does not scroll sideways');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/road-browser.json', `${JSON.stringify({
    record: 'The road east, in a browser: docs/ROAD_EAST.md',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map with rolled families, played in process through two periods and continued into the spring, the seed chosen for rain on the first family\'s first days on the road; served live at a tick every second and a half. The pursuit was reached by running the paused class on in process to the days Santa Anna\'s column nears San Felipe. No LAN or district claim.',
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}

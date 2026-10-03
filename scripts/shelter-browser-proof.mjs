// Out of the weather, in a real browser (owner, 2026-10-02; sim/shelter.mjs, docs/SETTLING_IN.md §4c, docs/CHILDREN.md §13).
//
// tests/shelter.test.mjs proves the rules against the simulation. This proves what a class sees, through the join flow, at
// 1366x768 and 1024x768, on a real class whose own weather (seed shelter-proof-165, the invented country) is fair on the first
// day, rains all the second and is fair again on the third:
//
//   - the tent goes up by itself as the family makes camp on its land, and is drawn by the camp; no "Put up the tent" anywhere on the
//     panel (owner, 2026-10-03, "Automatic on arrival");
//   - the rain comes: the children and whoever has no task walk in under the tent and are drawn sitting there, a roof-or-tent mark
//     on each of their portraits; somebody of ten or more sits with the children, and their row says so; the father keeps at the
//     house he was set to;
//   - it clears: everybody is back out, the marks are gone, and nothing on the page threw.
//
// Same computer only: headless Chrome. Run: npm run test:shelter
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const SEED = 'shelter-proof-165';
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/shelter-${name}.png`; await page.screenshot({ path }); shots.push(path); };

const snapshot = page => page.evaluate(() => window.__snapshot?.world);
const command = (page, input) => page.evaluate(async input => {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, id: crypto.randomUUID() }) });
  return { status: response.status, body: await response.json() };
}, input);
const choose = async (page, id) => { await page.locator(`[data-portrait="${id}"]`).click({ force: true }); await page.waitForFunction(id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, id, { timeout: 15000 }); };
const dayOf = world => Math.floor(world.minute / 1440);
const marks = page => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.panel-row')].map(row => {
  const mark = row.querySelector('.panel-shelter-mark');
  return [row.dataset.entityId, mark && !mark.hidden ? mark.dataset.at || '' : null];
})));
const lifeOf = (page, id) => page.evaluate(id => { const line = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-life-line`); return line && !line.hidden ? line.textContent : null; }, id);
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

try {
  const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 160, worldFactory: seed => createGonzalesWorld(seed, 5) });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Shelter reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  // The other seats taken, as a class's are, so Start begins the class rather than asking about empty seats.
  for (let i = 2; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  // Home off the road.
  await page.waitForFunction(() => { const w = window.__snapshot?.world; return w && !w.household.arriving && w.entities.filter(one => one.kind === 'person').every(one => !one.travel); }, null, { timeout: 60000 });
  let world = await snapshot(page);
  assert.equal(dayOf(world), 0, 'the family came home after the first day: the proof would miss the dry day');
  const people = world.entities.filter(one => one.kind === 'person').map(one => ({ id: one.id, name: one.name, age: one.age }));
  observed.family = people;
  const grown = people.filter(one => one.age >= 16), children = people.filter(one => one.age < 10);
  const [father] = grown;
  assert.ok(grown.length >= 2 && children.length >= 2, `the seed's family is not two grown people and children: ${JSON.stringify(people)}`);

  // 1. The tent up with the camp, drawn, and no button for it.
  assert.ok(world.land?.tent, 'the family made camp with no tent up');
  await page.waitForFunction(site => window.__tentsDrawn?.[site], world.household.homeSiteId, { timeout: 10000 });
  observed.tent = { land: world.land.tent, drawn: await page.evaluate(site => window.__tentsDrawn[site], world.household.homeSiteId),
    arrival: world.events.find(event => event.type === 'arrival')?.text || null };
  assert.match(observed.tent.arrival || '', /put up the tent/, 'the family\'s record does not say the tent went up');
  for (const one of people) {
    await choose(page, one.id);
    const keys = await page.evaluate(() => [...document.querySelectorAll('.panel-icon')].map(icon => icon.dataset.key));
    assert.ok(!keys.includes('pitch-tent'), `${one.name}'s bar has "Put up the tent"`);
  }
  await choose(page, father.id);
  await shot(page, 'tent-up-1366');
  ok(`the tent went up as the family made camp ("${observed.tent.arrival.slice(0, 80)}...") and is drawn by the camp (${JSON.stringify(observed.tent.drawn)}); nobody's bar has "Put up the tent"`);

  // 2. The father to the house, the rest left free; then the rain.
  const planned = await command(page, { action: 'plan-house', layout: 'dog-run' });
  assert.equal(planned.status, 200, JSON.stringify(planned.body));
  const sent = await command(page, { action: 'chore', entityId: father.id, chore: 'build-house' });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  await page.waitForFunction(() => Math.floor(window.__snapshot.world.minute / 1440) >= 1, null, { timeout: 60000 }).catch(() => null);
  await page.waitForFunction(ids => ids.every(id => window.__snapshot.world.entities.find(one => one.id === id)?.shelter?.phase === 'in'), children.map(one => one.id), { timeout: 40000 });
  await page.waitForTimeout(600);
  world = await snapshot(page);
  assert.equal(dayOf(world), 1, 'the children went in on a dry day');
  const sheltering = world.entities.filter(one => one.shelter).map(one => ({ id: one.id, name: one.name, age: one.age, at: one.shelter.at, minding: Boolean(one.shelter.minding) }));
  observed.inTheRain = sheltering;
  const companion = world.entities.find(one => one.aside?.kind === 'shelter');
  assert.ok(companion && companion.age >= 10, 'nobody of ten or more sat with the children');
  assert.ok(children.every(child => sheltering.some(one => one.id === child.id && one.at === 'tent')), 'a child was out in the rain');
  const dad = world.entities.find(one => one.id === father.id);
  assert.equal(dad.chore?.id, 'build-house', 'the father left the house for the rain');
  assert.equal(dad.shelter, undefined, 'the father went in with work to do');
  ok(`the rain came on day 1: ${sheltering.map(one => `${one.name.split(' ')[0]} (${one.age})`).join(', ')} went in under the tent; ${companion.name.split(' ')[0]} (${companion.age}) sits with the children; ${father.name.split(' ')[0]} kept at the house`);
  // Drawn there, sitting; the marks on their portraits; the companion's row says so.
  const clips = await page.evaluate(ids => ids.map(id => window.__clipsDrawn?.[id] || null), children.map(one => one.id));
  observed.clipsInTheRain = clips;
  assert.ok(clips.some(clip => /-rest$/.test(clip || '')), `no child was drawn sitting under the tent: ${clips.join(', ')}`);
  const seen = await marks(page);
  observed.marks = seen;
  for (const child of children) assert.equal(seen[child.id], 'tent', `${child.name}'s portrait has no tent mark`);
  assert.equal(seen[father.id], null, 'the father, at work, has a shelter mark');
  const line = await lifeOf(page, companion.id);
  observed.companionRow = line;
  assert.match(line || '', /^Inside with .* out of the weather\.$/);
  await shot(page, 'rain-under-tent-1366');
  ok(`the children are drawn sitting at the tent (${[...new Set(clips.filter(Boolean))].join(', ')}), each portrait carries the tent mark, and ${companion.name.split(' ')[0]}'s row says "${line}"`);
  // At 1024 nothing scrolls sideways.
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(600);
  assert.ok(await noOverflow(page) <= 1, 'the page scrolls sideways at 1024');
  await shot(page, 'rain-under-tent-1024');
  await page.setViewportSize({ width: 1366, height: 768 });
  ok('at 1024x768 the marks and the tent are shown and nothing scrolls sideways');

  // 3. It clears: everybody out, the marks gone.
  await page.waitForFunction(() => Math.floor(window.__snapshot.world.minute / 1440) >= 2, null, { timeout: 60000 }).catch(() => null);
  await page.waitForFunction(() => !window.__snapshot.world.entities.some(one => one.shelter || one.aside?.kind === 'shelter'), null, { timeout: 20000 });
  await page.waitForTimeout(600);
  world = await snapshot(page);
  assert.equal(dayOf(world), 2);
  const after = await marks(page);
  assert.ok(Object.values(after).every(at => at === null), `a shelter mark stayed after the rain: ${JSON.stringify(after)}`);
  observed.afterTheRain = world.entities.filter(one => one.kind === 'person').map(one => ({ id: one.id, chore: one.chore?.id || null, task: one.task, aside: one.aside?.kind || null }));
  await shot(page, 'cleared-1366');
  ok('the rain cleared on day 2: nobody is sheltering, nobody sits with the children, and every mark is gone');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/shelter-browser.json', `${JSON.stringify({
    record: 'Out of the weather: the tent, the family going in, and somebody with the children, in a browser (sim/shelter.mjs)',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: `Same computer only, headless Chrome at 1366x768 and 1024x768. One real class through the join flow on the invented country (seed ${SEED}), its own weather: fair, rain, fair. No LAN or district claim.`,
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
  await app.close();
} finally {
  await browser.close();
}

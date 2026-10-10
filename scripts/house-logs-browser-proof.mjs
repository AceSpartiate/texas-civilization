// Builders fell their own, in a real browser (owner, 2026-10-09: "'Work on the house' is always on the bar once the house is placed;
// with no logs on the pile, the builders fell what they need themselves. One name everywhere."; docs/WOODS_AND_BUILDING.md §6.14).
//
// tests/house-logs.test.mjs proves the rule against the simulation. This proves what a student sees, through the join flow at
// 1366x768 on the colonies map: the family's house placed and its log pile empty,
//
//   1. the house card says the builders fell the logs (*"Whoever works on the house fells the logs first."*);
//   2. *Work on the house* is on the father's bar, open to press, under that one name;
//   3. pressed once, he goes out and fells for the house (his row's words, the logs coming onto the pile at the house);
//   4. and, the logs in, he raises the walls from them with nothing more pressed;
//   5. no page errors.
//
// Same computer only: headless Chrome. Run: npm run test:house-logs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { keepFoundingFamilies } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/house-logs-${name}.png`; await page.screenshot({ path }); shots.push(path); };
const dismissTips = async page => { for (let i = 0; i < 4; i++) { const gotIt = page.getByRole('button', { name: 'Got it' }); if (await gotIt.isVisible().catch(() => false)) { await gotIt.click(); await page.waitForTimeout(200); } } };
const post = async (url, path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, await response.clone().text());
  return response;
};

try {
  // hh-1 on its land on the colonies map, its site chosen and a round-log cabin placed, and nothing on its log pile.
  const app = createClassroom({ seed: 'house-logs-browser', playerCount: 5, tickMs: 120, worldFactory(seed, n) {
    const world = createGonzalesWorld(seed, n, { map: 'colonies' });
    world.status = 'running';
    for (let i = 0; i < 200 && Object.values(world.households).some(h => h.arriving); i++) stepWorld(world);
    const household = world.households['hh-1'], bounds = holdingOf(world, household).bounds;
    let point = null;
    for (let y = 0; y < 7 && !point; y++) for (let x = 0; x < 7 && !point; x++) {
      const p = { x: bounds.minX + (bounds.maxX - bounds.minX) * (x + .5) / 7, y: bounds.minY + (bounds.maxY - bounds.minY) * (y + .5) / 7 };
      if (siteFactsFor(world, household, p).can) point = p;
    }
    applyAction(world, household.id, { action: 'choose-site', ...point });
    for (let i = 0; i < 60 && household.members.some(id => world.entities[id].travel); i++) stepWorld(world);
    applyAction(world, household.id, { action: 'plan-house', layout: 'round-log' });
    household.logs = { wall: 0, sill: 0, poor: 0 };
    world.status = 'lobby';
    keepFoundingFamilies(world);
    validateWorld(world);
    return world;
  } });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('House builder');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post(url, '/api/join', { name: `Builder ${i}`, code: app.state.sessionCode });
  await meetFamily(page);
  for (const button of ['#wagon-done', '#tutorial-skip']) if (await page.locator(button).isVisible()) await page.locator(button).click({ timeout: 5000 }).catch(() => {});
  const host = await post(url, '/api/host', { key: app.state.hostKey });
  await post(url, '/api/command', { id: 'house-logs-start', action: 'start' }, host.headers.get('set-cookie').split(';')[0]);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  await dismissTips(page);
  const principal = await page.evaluate(() => window.__snapshot.world.household.principalId);
  const name = await page.evaluate(id => window.__snapshot.world.entities.find(one => one.id === id)?.name, principal);
  assert.equal(await page.evaluate(() => Object.values(window.__snapshot.world.land.logs || {}).reduce((sum, n) => sum + (Number(n) || 0), 0)), 0, 'the pile was not empty');

  // 1. The house card, with the pile empty.
  await page.evaluate(() => document.querySelector('#house-open')?.click());
  await page.waitForFunction(() => [...document.querySelectorAll('#plot-summary .house-line')].length > 0, null, { timeout: 15000 });
  observed.card = await page.evaluate(() => [...document.querySelectorAll('#plot-summary .house-line')].map(line => line.textContent));
  observed.hint = await page.evaluate(() => document.querySelector('#plot-hint')?.textContent || '');
  assert.ok(observed.card.includes('Whoever works on the house fells the logs first.'), `the house card: ${JSON.stringify(observed.card)}`);
  await shot(page, 'card');
  await page.evaluate(() => document.querySelector('#plot-close')?.click());
  ok(`the house card, the pile empty, says "Whoever works on the house fells the logs first." (${observed.card.find(line => line.startsWith('Next:'))})`);

  // 2. On the father's bar, open to press, under its one name.
  await page.locator(`.panel-portrait[data-portrait="${principal}"]`).click();
  await page.waitForFunction(who => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === who, principal, { timeout: 10000 });
  if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click();
  await dismissTips(page);
  const selector = `.panel-row[data-entity-id="${principal}"] .panel-icon[data-key="build-house"]`;
  await page.waitForSelector(selector, { timeout: 20000 });
  observed.icon = await page.evaluate(s => { const b = document.querySelector(s); return { disabled: b.getAttribute('aria-disabled') === 'true' || b.disabled, label: b.getAttribute('aria-label') || b.textContent }; }, selector);
  assert.equal(observed.icon.disabled, false, `Work on the house is greyed with the pile empty: ${JSON.stringify(observed.icon)}`);
  assert.match(observed.icon.label, /Work on the house/);
  await shot(page, 'bar');
  ok(`"Work on the house" is on ${name}'s bar with nothing on the pile, open to press (${observed.icon.label.replace(/\s+/g, ' ').slice(0, 80)})`);

  // 3. Pressed once: he fells for the house, and the logs come onto the pile at the house.
  await page.locator(selector).click();
  await page.waitForFunction(id => { const one = window.__snapshot.world.entities.find(e => e.id === id); return one?.chore?.id === 'build-house' && one.chore.forLogs === 'fell' && / for the house$/.test(one.chore.doing || ''); }, principal, { timeout: 60000 });
  observed.felling = await page.evaluate(id => window.__snapshot.world.entities.find(e => e.id === id).chore.doing, principal);
  await page.waitForFunction(() => Object.values(window.__snapshot.world.land.logs || {}).reduce((sum, n) => sum + (Number(n) || 0), 0) > 0, null, { timeout: 60000 });
  observed.pile = await page.evaluate(() => window.__snapshot.world.land.logs);
  await shot(page, 'felling');
  ok(`pressed once, ${name} is "${observed.felling}" and the logs come onto the pile (${JSON.stringify(observed.pile)})`);

  // 4. The logs in, he raises the walls from them, with nothing more pressed.
  await page.waitForFunction(id => { const one = window.__snapshot.world.entities.find(e => e.id === id); const stage = window.__snapshot.world.land.house?.stage || ''; return one?.chore?.id === 'build-house' && !one.chore.forLogs && /course|rafters|chinking|finished/.test(stage); }, principal, { timeout: 180000 });
  observed.raising = await page.evaluate(() => window.__snapshot.world.land.house?.stage);
  observed.story = await page.evaluate(() => (window.__snapshot.world.events || []).map(event => event.text).filter(text => /felled \d+ trees?/.test(text)));
  assert.ok(observed.story.length, 'the felling was never said in the family\'s story');
  await shot(page, 'raising');
  ok(`the logs in, ${name} raises the walls from them: "${observed.raising}"; the story says "${observed.story.at(-1)}"`);

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/house-logs-browser.json', `${JSON.stringify({
    record: 'Builders fell their own, in a browser (owner, 2026-10-09; docs/WOODS_AND_BUILDING.md §6.14)',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only, headless Chrome at 1366x768. One real class through the join flow on the colonies map. No LAN or district claim.',
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
  await app.close();
} finally {
  await browser.close();
}

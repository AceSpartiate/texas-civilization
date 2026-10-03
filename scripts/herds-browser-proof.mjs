// The real herd, the herder and a sale at the pens, in a real browser (owner, 2026-10-03: "when players bring cattle and hogs, why
// don't we see their real herds? shouldn't a character that's assigned to tend the herd have appropriate skills and abilities for
// that? it should be a path to making food and wealth too."; sim/stock.mjs, public/herd-view.js, docs/STOCK.md §10).
//
// tests/herds.test.mjs proves the rules against the simulation and the drawing's arithmetic. This proves what a class sees, through
// the join flow at 1366x768, on the invented country (seed herds-proof):
//
//   1. the herd on the range: the family's own count drawn, a figure a head, the calves and pigs dropped lately smaller;
//   2. the herder at work: sent out after the stock, on the family's horse, the herd drawn in about them and the horn lit on the row;
//      the hover over the herd says the server's words (the counts, the flesh, who minded it);
//   3. a sale: two head driven in to the stock pens in Gonzales and sold for coin by the flesh, out of the herd on the page;
//   4. a big herd: a few head and a group with its count, never more figures than the cap.
//
// Same computer only: headless Chrome. Run: npm run test:herds
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { HERD_DRAWN_MOST } from '../public/herd-view.js';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const SEED = 'herds-proof';
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/herds-${name}.png`; await page.screenshot({ path }); shots.push(path); };
const snapshot = page => page.evaluate(() => window.__snapshot?.world);
const command = (page, input) => page.evaluate(async input => {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, id: crypto.randomUUID() }) });
  return { status: response.status, body: await response.json() };
}, input);
const drawn = page => page.evaluate(() => window.__herdDrawn || null);

/**
 * A class through the join flow, its first family having driven stock in (the lobby's choice) with `herd` on the range, as a class
 * saved with that herd opens: the world is made so, because the server hands out only copies of its state.
 */
async function openClass(herd, young = null) {
  const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 160, worldFactory: seed => {
    const world = createGonzalesWorld(seed, 5), household = world.households['hh-1'];
    // The herd only: the lobby's stock choice is the student's own, made in the wagon screen, and changes the land and the load.
    household.herd = { ...herd };
    if (young) household.herdYoung = { ...young, day: 0 };
    return world;
  } });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Herd reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
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
  await page.waitForFunction(() => { const w = window.__snapshot?.world; return w && !w.household.arriving && w.entities.filter(one => one.kind === 'person').every(one => !one.travel); }, null, { timeout: 60000 });
  return { app, page, host };
}

try {
  const { app, page } = await openClass({ cattle: 9, hogs: 14 }, { cattle: 2, hogs: 4 });
  const live = () => app.state.world.households['hh-1'];

  for (let i = 0; i < 3; i++) { const gotIt = page.getByRole('button', { name: 'Got it' }); if (await gotIt.isVisible().catch(() => false)) { await gotIt.click(); await page.waitForTimeout(200); } }
  // Nearer, as a student zooms in on the land: the herd is drawn at every zoom from the class's own camera in (`NEAR_SCALE`).
  for (let i = 0; i < 2; i++) { await page.locator('button[data-view=in]').click(); await page.waitForTimeout(250); }
  // 1. The herd on the range: the count the server holds, a figure a head.
  await page.waitForFunction(() => window.__herdDrawn?.cattle === 9 && window.__herdDrawn?.hogs === 14, null, { timeout: 20000 }).catch(async error => { console.log(JSON.stringify(await page.evaluate(() => ({ drawn: window.__herdDrawn, herd: window.__snapshot.world.household.herd, ranch: window.__snapshot.world.household.ranch, camera: window.__camera })))); await page.screenshot({ path: 'docs/evidence/herds-debug.png' }); throw error; });
  await page.waitForTimeout(500);
  observed.range = await drawn(page);
  assert.equal(observed.range.figures, 23, `the herd of 23 was drawn as ${observed.range.figures} figures`);
  assert.equal(observed.range.young, 6, 'the calves and pigs were not drawn as young');
  assert.ok(observed.range.clips.some(clip => /cattle-longhorn|cow-/.test(clip)) && observed.range.clips.some(clip => /hog|pig/.test(clip)), `the herd's clips: ${observed.range.clips}`);
  await shot(page, 'range-1366');
  ok(`the family's herd of 9 cattle and 14 hogs is drawn on its land as ${observed.range.figures} figures, ${observed.range.young} of them young (clips ${observed.range.clips.join(', ')})`);

  // 2. The herder: the best hand of twelve or more who is free, sent out after the stock; on the horse; the herd draws in about them.
  let world = await snapshot(page);
  const hands = world.entities.filter(one => one.kind === 'person' && (one.age ?? 30) >= 12 && Number.isFinite(one.hand)).sort((a, b) => b.hand - a.hand);
  assert.ok(hands.length, 'nobody of the family is told their hand with stock');
  const herder = hands[0];
  // Slowed while the herder is out, so the day on the range is long enough to look at; quick again for the drive to town.
  app.setPace(900);
  const sent = await command(page, { action: 'chore', entityId: herder.id, chore: 'look-to-stock' });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  await page.waitForFunction(id => window.__herdDrawn?.herder === id && document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-herd-mark`)?.dataset.out === 'true', herder.id, { timeout: 30000 });
  await page.waitForTimeout(800);
  observed.herder = { id: herder.id, name: herder.name, hand: herder.hand, mounted: Boolean(app.state.world.entities[herder.id].chore?.mounted), drawn: await drawn(page) };
  const mark = await page.evaluate(id => { const el = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-herd-mark`); return el && !el.hidden ? { hand: el.dataset.hand, out: el.dataset.out, title: el.title } : null; }, herder.id);
  observed.herder.mark = mark;
  assert.ok(mark && mark.out === 'true', `the herder's horn is not lit on the row: ${JSON.stringify(mark)}`);
  await shot(page, 'herder-1366');
  ok(`${herder.name.split(' ')[0]} (a hand of ${herder.hand}) is out after the stock${observed.herder.mounted ? ' on the family\'s horse' : ' on foot'}; the herd is drawn about them and the horn on the row is lit ("${mark.title}")`);
  // The hover: over the herd, the server's words.
  const box = observed.herder.drawn.box;
  const canvas = await page.locator('#world-map').boundingBox();
  const scale = await page.evaluate(() => { const c = document.querySelector('#world-map'); return c.width / c.getBoundingClientRect().width; });
  await page.mouse.move(canvas.x + (box.x + box.w / 2) / scale, canvas.y + (box.y + box.h / 2) / scale);
  await page.waitForFunction(() => window.__herdHoverShown, null, { timeout: 10000 });
  observed.hover = await page.evaluate(() => window.__herdHoverShown);
  assert.match(observed.hover.words, /9 cattle, (thin|fair|fat) · 14 hogs, (thin|fair|fat)/);
  assert.match(observed.hover.words, new RegExp(`minded now by ${herder.name.split(' ')[0]}`), 'the hover does not say who is out after the herd');
  await shot(page, 'hover-1366');
  ok(`hovering the herd says "${observed.hover.words}"`);
  await page.mouse.move(5, 5);
  // The day out finishes: the ride is in the family's record.
  await page.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.chore, herder.id, { timeout: 60000 });
  world = await snapshot(page);
  const told = world.events.find(event => event.actorId === herder.id && /(rode|walked) the range and counted the stock/.test(event.text || ''));
  assert.ok(told, 'the ride is not in the family\'s record');
  observed.rode = told.text;
  ok(`the record says: "${told.text}"`);

  // 3. A sale at the pens: two head of cattle driven in to Gonzales and sold by the flesh.
  app.setPace(160);
  const money = live().resources.money ?? 0;
  const seller = world.entities.find(one => one.kind === 'person' && one.id !== herder.id && (one.age ?? 30) >= 16 && !one.chore) || world.entities.find(one => one.id === herder.id);
  const errand = await command(page, { action: 'chore', entityId: seller.id, chore: 'visit-shop', errand: [{ id: 'stockman:sell-cattle', n: 2 }] });
  assert.equal(errand.status, 200, JSON.stringify(errand.body));
  assert.deepEqual(app.state.world.entities[seller.id].drives, { cattle: 2 }, 'the seller is not driving the two head in');
  await page.waitForFunction(id => window.__snapshot.world.events.some(event => event.actorId === id && /at the stock pens for/.test(event.text || '')), seller.id, { timeout: 180000 });
  await page.waitForTimeout(400);
  world = await snapshot(page);
  const sale = world.events.find(event => event.actorId === seller.id && /at the stock pens for/.test(event.text || ''));
  observed.sale = { text: sale.text, coin: sale.coin, herd: world.household.herd, money: world.household.resources.money };
  assert.equal(world.household.herd.cattle, 7, 'the two head sold are still in the herd on the page');
  assert.ok(world.household.resources.money >= money + 6, `the family was paid ${world.household.resources.money - money}`);
  await shot(page, 'sale-1366');
  ok(`"${sale.text}" - the family has ${world.household.herd.cattle} cattle and ${world.household.resources.money} reales`);
  await page.waitForFunction(() => window.__herdDrawn?.cattle === 7, null, { timeout: 20000 });
  ok('the herd drawn on the land is the herd less the two sold (7 cattle)');

  // 4. A big herd: a few head and a group with its count, never more than the cap.
  await app.close();
  const big = await openClass({ cattle: 60, hogs: 140 });
  await big.page.waitForFunction(() => window.__herdDrawn?.cattle === 60 && window.__herdDrawn?.hogs === 140, null, { timeout: 20000 });
  await big.page.waitForTimeout(400);
  observed.big = await drawn(big.page);
  assert.ok(observed.big.figures <= HERD_DRAWN_MOST, `a big herd drawn as ${observed.big.figures} figures`);
  assert.ok(observed.big.groups.length >= 1, 'a big herd has no group with its count');
  await shot(big.page, 'big-herd-1366');
  ok(`a herd of 60 cattle and 140 hogs is drawn as ${observed.big.figures} figures, with groups of ${observed.big.groups.map(group => `${group.count} ${group.kind}`).join(' and ')}`);

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/herds-browser.json', `${JSON.stringify({
    record: 'The real herd, the herder and a sale at the pens, in a browser (sim/stock.mjs, public/herd-view.js)',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: `Same computer only, headless Chrome at 1366x768. One real class through the join flow on the invented country (seed ${SEED}). No LAN or district claim.`,
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
  await big.app.close();
} finally {
  await browser.close();
}

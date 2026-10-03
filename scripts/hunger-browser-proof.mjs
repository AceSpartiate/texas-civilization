// Hunger, in a real browser (owner, 2026-09-30: "player characters *can* die of starvation ... also update the ui to better
// facilitate player awareness of where the family resources stand and the severity of consequences of running out. do it with
// highlights, colors, etc. don't use text and over explain"; docs/HUNGER.md, sim/hunger.mjs).
//
// tests/hunger.test.mjs proves the rules against the simulation. This proves what a student sees, through the join flow:
//
//   - the food box is a gauge, and its colour changes at every level as the family's food drains: plenty, fair, low, short, then
//     empty (hungry), weak and starving - each a different background or tone, the weak one glowing and the starving one pulsing,
//     and a flash when a worse level is reached;
//   - the portraits of the hungry, the weak and the starving are marked (`data-hunger`, a ring and a bowl), and the starving
//     person carries the "!" with the real time left and the story card;
//   - with reduced motion the starving box does not pulse;
//   - a death by hunger comes only after the starving person's real minute (`QUESTION_BUDGETS.starve`), and a child who starved
//     is not named on the Host's class panel;
//   - nothing of it overlaps at 1366x768, 1024x600 and a phone.
//
// The class is the real land with rolled families, played in process to the campaign of October (a calendar day in two ticks);
// before it is served, the first family's people are set to rest with twenty-four days of their eating in the store, and nobody
// brings anything in. The server holds the world after that (server/app.mjs `state` is a copy): the food drains by the rules.
//
// Same computer only: headless Chrome. Run: npm run test:hunger
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { dailyDraw } from '../sim/hunger.mjs';
import { QUESTION_BUDGETS } from '../sim/decision-budget.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = { levels: {} };
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/hunger-${name}.png`; await page.screenshot({ path }); shots.push(path); };

const cast = {};
function inTheCampaign(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && world.director.phase !== 'campaign'; i++) stepWorld(world);
  assert.equal(world.director.phase, 'campaign', 'the class never reached the campaign');
  // A few days on, past the turning out, so the calendar runs at half a day a tick.
  for (let i = 0; i < 8; i++) stepWorld(world);
  const household = world.households['hh-1'];
  const home = household.members.map(id => world.entities[id]).filter(one => one.location?.siteId === household.homeSiteId && !one.travel && one.health?.condition !== 'dead');
  for (const person of home) { person.task = 'rest'; person.chore = null; delete person.auto; }
  const { eat } = dailyDraw(world, household);
  household.resources.food = Math.round(eat * 24 * 10) / 10;
  Object.assign(cast, { home: home.map(one => one.id), names: Object.fromEntries(home.map(one => [one.id, one.name])), ages: Object.fromEntries(home.map(one => [one.id, one.age ?? null])), food: household.resources.food, eat: Math.round(eat * 1000) / 1000, minute: world.minute });
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'hunger-proof-1', playerCount: 5, tickMs: 1200, worldFactory: inTheCampaign });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const food = page => page.evaluate(() => {
  const box = document.querySelector('#food');
  if (!box || box.hidden) return null;
  const style = getComputedStyle(box), fill = box.querySelector('.food-gauge-fill');
  return { level: box.dataset.level || '', background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow, animation: style.animationName, tone: fill ? getComputedStyle(fill).backgroundColor : null, fillWidth: fill ? Math.round(fill.getBoundingClientRect().width) : null, text: box.querySelector('.food-count')?.textContent || '', label: box.getAttribute('aria-valuetext') || '', flash: box.dataset.flash === 'true' };
});
const portraits = page => page.evaluate(() => [...document.querySelectorAll('.panel-row[data-entity-id]')].map(row => ({ id: row.dataset.entityId, hunger: row.dataset.hunger || 'fed', mark: !row.querySelector('.panel-hunger-mark')?.hidden, ring: getComputedStyle(row.querySelector('.panel-portrait'), '::after').boxShadow })));
const levelIs = (page, level, timeout = 180000) => page.waitForFunction(level => document.querySelector('#food')?.dataset.level === level, level, { timeout, polling: 50 });
const overlaps = page => page.evaluate(() => {
  const box = el => { const node = typeof el === 'string' ? document.querySelector(el) : el; if (!node || node.hidden) return null; const rect = node.getBoundingClientRect(); return rect.width && rect.height ? rect : null; };
  const food = box('#food');
  const others = ['#session', '#world', '#supplies', '#error', '#hud-right', '#map-tools', '#family-panel', '#military-notice', '#selection', '#tip'].map(selector => [selector, box(selector)]).filter(([, rect]) => rect);
  const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  return { inside: Boolean(food && food.left >= 0 && food.top >= 0 && food.right <= innerWidth && food.bottom <= innerHeight), over: others.filter(([, rect]) => food && hit(food, rect)).map(([selector]) => selector), sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    // What stands past the right edge, if anything: the id or class of each, for the record.
    past: [...document.querySelectorAll('body *')].filter(node => { const rect = node.getBoundingClientRect(); return rect.width && rect.right > innerWidth + 1 && getComputedStyle(node).position !== 'fixed'; }).slice(0, 6).map(node => node.id ? `#${node.id}` : `${node.tagName.toLowerCase()}.${String(node.className).split(' ')[0]}`) };
});

try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`student: ${error.message}`));
  await page.goto(url);
  await page.locator('[name=name]').fill('Hunger reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });

  // The column opened to names, as a student opens it with "Show names" (it folds to faces while the family is asked where its
  // house stands), and the first-meeting tip put away, so the rows are seen whole.
  if (await page.evaluate(() => document.querySelector('#family-panel')?.dataset.collapsed === 'true')) {
    await page.locator('#family-collapse').click();
    await page.waitForFunction(() => document.querySelector('#family-panel')?.dataset.collapsed !== 'true', null, { timeout: 10000 });
  }
  const gotIt = page.getByRole('button', { name: 'Got it' });
  if (await gotIt.isVisible().catch(() => false)) await gotIt.click();

  // 1. The gauge at each level as the food drains: a colour for each, and the worse ones marked more heavily.
  const order = ['plenty', 'fair', 'low', 'short', 'empty', 'weak', 'starving'];
  let firstStarving = null;
  for (const level of order) {
    await levelIs(page, level);
    if (level === 'starving') firstStarving = Date.now();
    // The colours ease over 0.6 s (public/style.css): read them once they have settled.
    await page.waitForTimeout(900);
    observed.levels[level] = { ...(await food(page)), portraits: await portraits(page), feeds: await page.evaluate(() => [...document.querySelectorAll('.panel-icon[data-feeds=true]')].map(button => button.dataset.key)) };
    await shot(page, `${level}-1366`);
  }
  const seen = order.map(level => observed.levels[level]);
  // Every level has its own look: the pair (background, gauge tone) differs from the level before it.
  for (let at = 1; at < seen.length; at++) {
    const [was, now] = [seen[at - 1], seen[at]];
    assert.ok(was.background !== now.background || was.tone !== now.tone || was.shadow !== now.shadow, `${order[at - 1]} and ${order[at]} look the same`);
  }
  // The ways to food glow on the bar while the food is low (owner, 2026-10-02; public/family-panel.js `feedsNow`), and not before.
  assert.deepEqual(observed.levels.plenty.feeds, [], `food works glowed while there was plenty: ${observed.levels.plenty.feeds}`);
  for (const level of ['low', 'empty', 'starving']) assert.ok(observed.levels[level].feeds.length, `no food work glowed at ${level}`);
  ok(`the ways to food glowed on the bar from low on (${observed.levels.empty.feeds.join(', ')}), and not while there was plenty`);
  assert.ok(observed.levels.plenty.fillWidth > observed.levels.low.fillWidth && observed.levels.low.fillWidth > observed.levels.short.fillWidth, 'the gauge does not empty as the food goes');
  assert.notEqual(observed.levels.weak.shadow, 'none', 'the weak level does not glow');
  assert.equal(observed.levels.starving.animation.split(',').some(name => /larder-pulse/.test(name)), true, `the starving level does not pulse (${observed.levels.starving.animation})`);
  assert.ok(seen.every(one => /^Food \d/.test(one.text)), 'the number was lost from the food box');
  assert.ok(seen.every(one => one.label.length <= 40), 'the gauge says a sentence');
  ok(`the gauge changed colour at every level: ${order.map(level => `${level} ${observed.levels[level].background}/${observed.levels[level].tone}`).join('; ')}`);

  // 2. The portraits: hungry, weak and starving marked, each more heavily.
  const marked = stage => Object.values(observed.levels).flatMap(one => one.portraits).filter(one => one.hunger === stage);
  for (const stage of ['hungry', 'weak', 'starving']) assert.ok(marked(stage).length && marked(stage).every(one => one.mark && one.ring !== 'none'), `no portrait marked ${stage}`);
  assert.ok(observed.levels.plenty.portraits.every(one => one.hunger === 'fed' && !one.mark), 'a portrait marked while the family had plenty');
  const starving = observed.levels.starving.portraits.find(one => one.hunger === 'starving');
  observed.starving = starving.id;
  ok(`the portraits were marked hungry (${marked('hungry').length}), weak (${marked('weak').length}) and starving (${marked('starving').length}) with a ring and a bowl; none while there was plenty`);

  // 3. The starving person's "!" with its real time left, and the story card.
  await page.waitForFunction(id => { const mark = document.querySelector(`[data-attention="${id}"]`); return mark && !mark.hidden && /starving/.test(mark.getAttribute('aria-label') || ''); }, starving.id, { timeout: 20000 });
  observed.need = await page.locator(`[data-attention="${starving.id}"]`).getAttribute('aria-label');
  const leftMs = await page.evaluate(id => window.__snapshot.world.entities.find(one => one.id === id)?.hunger?.leftMs ?? null, starving.id);
  assert.ok(Number.isFinite(leftMs) && leftMs <= QUESTION_BUDGETS.starve, `no real time left on the starving person (${leftMs})`);
  const cardNow = () => page.evaluate(() => { const card = document.querySelector('#military-notice'); return card && !card.hidden ? { accent: card.dataset.accent, text: card.innerText, icon: document.querySelector('#military-icon')?.dataset.drawn || '' } : null; });
  let card = await cardNow();
  // Another message may stand in front of it (a call, a rider): the card's own "Next message" goes through them.
  for (let tries = 0; tries < 6 && card?.accent !== 'hunger'; tries++) {
    if (await page.locator('#military-next').isVisible()) await page.locator('#military-next').click();
    await page.waitForTimeout(400);
    card = await cardNow();
  }
  observed.card = card;
  assert.ok(card && card.accent === 'hunger', `the story card for somebody starving is not up (${JSON.stringify(card)})`);
  if (!card.icon) { await page.waitForFunction(() => Boolean(document.querySelector('#military-icon')?.dataset.drawn), null, { timeout: 15000 }); card.icon = await page.evaluate(() => document.querySelector('#military-icon').dataset.drawn); }
  assert.match(card.icon, /^icon-sell-food:1$/, 'the story card\'s icon is not drawn');
  assert.match(card.text, /left to find food/, 'the story card does not count the minute down as the time to find food');
  await shot(page, 'starving-card-1366');
  ok(`the starving person's "!" says "${observed.need}" with ${Math.round(leftMs / 1000)} s left, and the story card is up in its own red`);

  // 4. Reduced motion: no pulse, a heavier ring instead.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(300);
  observed.reduced = await food(page);
  assert.equal(observed.reduced.animation, 'none', `the starving box still moves with reduced motion (${observed.reduced.animation})`);
  assert.notEqual(observed.reduced.shadow, 'none');
  await shot(page, 'starving-reduced-motion-1366');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  ok(`with reduced motion the starving box stands still (${observed.reduced.animation}) and keeps its ring`);

  // 5. Clear of everything at 1024x600 and a phone, and at 1366x768.
  observed.fit = {};
  for (const [name, size] of [['1366', { width: 1366, height: 768 }], ['1024x600', { width: 1024, height: 600 }], ['phone', { width: 400, height: 800 }]]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(700);
    const fit = await overlaps(page);
    observed.fit[name] = fit;
    assert.ok(fit.inside, `the food box is off the screen at ${name}`);
    assert.deepEqual(fit.over, [], `the food box stands on ${fit.over.join(', ')} at ${name}`);
    // Nothing of the gauge, the supplies or the rows' hunger marks stands past the edge. The action bar's icons at 400 px can,
    // by a few pixels, depending on how many the main person is offered at that moment (seen 2026-09-30: 11 px, the bar's own
    // buttons) - not this change's, and the phone is not a supported size (docs/FAMILY_PANEL.md §20b); recorded, not held.
    assert.ok(!fit.past.some(one => /#food|#supplies|food-|supply|hunger/.test(one)), `the food or supplies stand past the edge at ${name}: ${fit.past.join(', ')}`);
    if (name !== 'phone') assert.ok(fit.sideways <= 1, `the page scrolls sideways at ${name} by ${fit.sideways}px: ${fit.past.join(', ')}`);
    if (name !== '1366') await shot(page, `starving-${name}`);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  ok(`the food box is on the screen and on nothing else at 1366x768, 1024x600 and a phone of 400x800 (the page itself ${observed.fit.phone.sideways > 1 ? `scrolls ${observed.fit.phone.sideways}px sideways at the phone, by the action bar` : 'does not scroll sideways'})`);

  // 6. A death by hunger comes only after the starving person's real minute.
  await page.waitForFunction(() => (window.__snapshot?.world.entities || []).some(one => one.health?.condition === 'dead' && one.health.starved), null, { timeout: 240000, polling: 100 });
  const diedAfter = Date.now() - firstStarving;
  const dead = await page.evaluate(() => (window.__snapshot.world.entities || []).filter(one => one.health?.condition === 'dead' && one.health.starved).map(one => ({ id: one.id, name: one.name, age: one.age ?? null })));
  observed.died = { ...dead[0], afterRealSeconds: Math.round(diedAfter / 1000) };
  // The page sees starving a tick after the server says it, and the death a tick after it happens: a tick is 1.2 s.
  assert.ok(diedAfter >= QUESTION_BUDGETS.starve - 3000, `somebody died of hunger ${diedAfter} ms after the family was first starving, inside the minute`);
  await page.waitForFunction(() => /died of hunger/.test(document.querySelector('#reports')?.textContent || '') || (window.__snapshot?.world.events || []).some(event => /died of hunger/.test(event.text)), null, { timeout: 20000 });
  observed.journal = await page.evaluate(() => (window.__snapshot.world.events || []).find(event => /died of hunger/.test(event.text))?.text || null);
  await shot(page, 'death-1366');
  if (Number.isFinite(dead[0].age) && dead[0].age < 16) {
    await host.waitForTimeout(2500);
    const panel = await host.locator('#host-families').innerText();
    assert.ok(!panel.includes(dead[0].name), `the Host's class panel names ${dead[0].name}, a child who starved`);
    observed.hostPanelUnnamed = true;
  }
  ok(`the first death by hunger came ${Math.round(diedAfter / 1000)} s after the family was first starving: "${observed.journal}"${observed.hostPanelUnnamed ? '; the child is not named on the Host\'s class panel' : ''}`);

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/hunger-browser.json', `${JSON.stringify({
    record: 'Hunger, in a browser: docs/HUNGER.md', date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only, headless Chrome at 1366x768, 1024x600 and 400x800. The real land with rolled families, played in process to the campaign of October 1835; the first family set to rest with twenty-four days of its eating in the store before it was served, and drained by the rules. No LAN, Chromebook or classroom claim.',
    cast, checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}

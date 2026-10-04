// Men's work, women's work and the wash, in a real browser (owner, 2026-10-03, "Custom, necessity opens"; sim/custom.mjs,
// sim/housework.mjs, docs/CUSTOMARY_WORK.md).
//
// tests/custom-work.test.mjs and tests/housework.test.mjs prove the rules against the simulation. This proves what a class sees,
// through the join flow at 1366x768, on the invented country (seed custom-proof-3: a father, a mother and two small sons):
//
// The class is made as it would be a week after anybody washed (`washBase`), so the father's clothes want washing from the start.
//
//   1. flies over the father at home;
//   2. the mother's bar: the men's work greyed with a fine hatch, its words in the popup ("Building is men's work, and ... is at home.");
//   3. the father's errand popup: the reason, with flies, and the dearer prices in ember;
//   4. the father walking to Gonzales: the same icon lit on her bar, and the line in the family's story once she takes it up;
//   5. in Gonzales, the camera with him: a townsman's words over the townsman's head and in the story, flies over him; home again,
//      the errand to the store, and the dearer price paid;
//   6. the mother keeping house, in the garden (the garden drawn beside the house) and at the wash, each drawn at the work; the wash
//      cleans the father, home again, and the flies go.
//
// Same computer only: headless Chrome. Run: npm run test:custom-work
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const SEED = 'custom-proof-3';
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/custom-work-${name}.png`; await page.screenshot({ path }); shots.push(path); };
const snapshot = page => page.evaluate(() => window.__snapshot?.world);
const command = (page, input) => page.evaluate(async input => {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, id: crypto.randomUUID() }) });
  return { status: response.status, body: await response.json() };
}, input);
const dismissTips = async page => { for (let i = 0; i < 4; i++) { const gotIt = page.getByRole('button', { name: 'Got it' }); if (await gotIt.isVisible().catch(() => false)) { await gotIt.click(); await page.waitForTimeout(200); } } };
/** Give this person the bar, as a student does: their portrait. */
const focus = async (page, id) => {
  await page.locator(`.panel-portrait[data-portrait="${id}"]`).click();
  await page.waitForFunction(who => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === who, id, { timeout: 10000 });
  await page.waitForTimeout(300);
};
const icon = (page, id, key) => page.evaluate(([who, k]) => {
  const button = document.querySelector(`.panel-row[data-entity-id="${who}"] .panel-icon[data-key="${k}"]`);
  return button ? { key: k, custom: button.dataset.custom || '', disabled: button.getAttribute('aria-disabled') === 'true', note: button.dataset.note || '', label: button.getAttribute('aria-label') } : null;
}, [id, key]);

try {
  // The class as it would be a week after anybody washed (the server hands out only copies of its state, so the world is made so):
  // every family's clothes read as washed twenty days before the class began (`washBase`), and powder in hh-1's house for the mark.
  const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 160, worldFactory: seed => {
    const world = createGonzalesWorld(seed, 5);
    world.washBase = -20;
    return world;
  } });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', error => errors.push(error.message + (process.env.STACKS ? error.stack : '')));
  await page.goto(url);
  await page.locator('[name=name]').fill('Custom reader');
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
  await dismissTips(page);
  let world = await snapshot(page);
  const people = world.entities.filter(one => one.kind === 'person');
  const father = people.find(one => one.kin?.role === 'father') || people.find(one => one.id === world.household.principalId);
  const book = await page.evaluate(async () => (await (await fetch('/api/family')).json()));
  const roles = Object.fromEntries((book.family?.people || book.people || []).map(one => [one.id, one.role]));
  const fatherId = Object.keys(roles).find(id => roles[id] === 'father') || father?.id;
  const motherId = Object.keys(roles).find(id => roles[id] === 'mother');
  assert.ok(fatherId && motherId, `the seed did not give a father and a mother: ${JSON.stringify(roles)}`);
  const nameOf = id => people.find(one => one.id === id)?.name || id;
  const him = { id: fatherId, name: nameOf(fatherId) }, her = { id: motherId, name: nameOf(motherId) };
  observed.family = people.map(one => ({ id: one.id, name: one.name, role: roles[one.id], age: one.age }));
  for (let i = 0; i < 2; i++) { await page.locator('button[data-view=in]').click(); await page.waitForTimeout(250); }

  // 1. A dirty man at home: flies over him, and the page told so.
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.dirty === true, him.id, { timeout: 20000 });
  await page.waitForFunction(id => window.__fliesDrawn?.[id], him.id, { timeout: 20000 });
  observed.fliesHome = await page.evaluate(id => window.__fliesDrawn[id], him.id);
  ok(`flies are drawn over ${him.name} at home, his clothes unwashed for a week (${JSON.stringify(observed.fliesHome)})`);

  // 2. The mother's bar: the men's work greyed, with its words. A jacal planned, so the house is work there is to do.
  const planned = await command(page, { action: 'plan-house', layout: 'jacal' });
  assert.equal(planned.status, 200, JSON.stringify(planned.body));
  await focus(page, her.id);
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-custom="men"]`), her.id, { timeout: 20000 });
  const greyed = await page.evaluate(id => [...document.querySelectorAll(`.panel-row[data-entity-id="${id}"] .panel-icon[data-custom="men"]`)].map(button => button.dataset.key), her.id);
  const key = greyed.includes('build-house') ? 'build-house' : greyed[0];
  const before = await icon(page, her.id, key);
  assert.equal(before.disabled, true);
  assert.match(before.note, new RegExp(`men's work, and ${him.name.split(' ')[0]}.* is at home\\.$`));
  await page.locator(`.panel-row[data-entity-id="${her.id}"] .panel-icon[data-key="${key}"]`).hover();
  await page.locator('#panel-tip').waitFor({ state: 'visible' });
  observed.greyed = { keys: greyed, key, note: await page.locator('#panel-tip-note').textContent(), name: await page.locator('#panel-tip-name').textContent() };
  assert.match(observed.greyed.note, /men's work/);
  await shot(page, 'mother-greyed');
  ok(`${her.name}'s bar keeps the men's work greyed with a hatch (${greyed.join(', ')}); hovering ${observed.greyed.name} says "${observed.greyed.note}"`);
  await page.mouse.move(900, 500);

  // 3. The father's errand popup: the reason, with flies, and the prices in ember. Closed again: he goes to town first.
  await focus(page, him.id);
  await page.locator(`.panel-row[data-entity-id="${him.id}"] .panel-icon[data-key="visit-shop"]`).click();
  await page.waitForFunction(() => window.__errand?.lines?.length && window.__errand.dearer, null, { timeout: 20000 });
  observed.popup = await page.evaluate(() => ({ dearer: window.__errand.dearer, seed: window.__errand.lines.find(line => line.id === 'store:seed'), shown: document.querySelector('#errand-dearer')?.hidden === false, ember: [...document.querySelectorAll('.errand-line[data-dear=true]')].length }));
  assert.ok(observed.popup.shown && observed.popup.ember > 3, JSON.stringify(observed.popup));
  assert.match(observed.popup.seed.price, /to a clean customer/);
  await shot(page, 'errand-dearer');
  ok(`the errand popup says "${observed.popup.dearer}", and ${observed.popup.ember} prices are dearer, seed "${observed.popup.seed.price}"`);
  await page.locator('#errand-close').click();
  await page.waitForFunction(() => document.querySelector('#errand')?.hidden, null, { timeout: 10000 });

  // 4. The father walks to Gonzales (his row's Travel to Gonzales); slowed so the road is long enough to look at what changes at home.
  app.setPace(1500);
  const went = await command(page, { action: 'travel', entityId: him.id, destination: 'gonzales' });
  assert.equal(went.status, 200, JSON.stringify(went.body));
  await focus(page, her.id);
  await page.waitForFunction(([id, k]) => { const button = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${k}"]`); return button && !button.dataset.custom; }, [her.id, key], { timeout: 30000 });
  observed.lit = await icon(page, her.id, key);
  await shot(page, 'mother-lit');
  ok(`with ${him.name} on the road to town, ${observed.lit.key} is lit on ${her.name}'s bar (${observed.lit.disabled ? `refused for another reason: "${observed.lit.note}"` : 'open'})`);
  const taken = await command(page, { action: 'chore', entityId: her.id, chore: key });
  assert.equal(taken.status, 200, JSON.stringify(taken.body));
  await page.waitForFunction(id => window.__snapshot.world.events.some(event => event.actorId === id && /^With .* gone to town, .*/.test(event.text || '')), her.id, { timeout: 20000 });
  observed.line = (await snapshot(page)).events.find(event => event.actorId === her.id && /^With /.test(event.text || '')).text;
  ok(`the family's story says: "${observed.line}"`);

  // 5. In Gonzales, the camera with him: the storekeeper's words, in the story and over his head; the flies over the father.
  app.setPace(3000);
  await focus(page, him.id);
  await page.locator('button[data-view=gonzales]').click();
  for (let i = 0; i < 2; i++) { await page.locator('button[data-view=in]').click(); await page.waitForTimeout(250); }
  await page.waitForFunction(id => window.__snapshot.world.events.some(event => event.actorId === id && /wrinkled .* nose at/.test(event.text || '')), him.id, { timeout: 180000 });
  await page.waitForFunction(() => (window.__familySaid || []).some(line => line.id.includes(':remark:')), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(400);
  let world2 = await snapshot(page);
  observed.remark = world2.events.find(event => event.actorId === him.id && /wrinkled/.test(event.text || '')).text;
  observed.said = await page.evaluate(() => (window.__familySaid || []).filter(line => line.id.includes(':remark:')));
  observed.fliesTown = await page.evaluate(id => window.__fliesDrawn?.[id] || null, him.id);
  observed.where = world2.entities.find(one => one.id === him.id).location?.siteId;
  await shot(page, 'town-remark');
  assert.ok(observed.said.some(line => observed.remark.includes(line.text)), `the words were not drawn over the speaker: ${JSON.stringify(observed.said)}`);
  assert.ok(observed.fliesTown, 'no flies over him in town');
  ok(`in ${observed.where}: "${observed.remark}"; drawn over the speaker: "${observed.said[0].text}"; flies over him`);
  // Home, and then to the store on the errand from home (the errand is begun at home): the dearer price paid, still unwashed.
  app.setPace(400);
  const back = await command(page, { action: 'travel', entityId: him.id, destination: world2.household.homeSiteId });
  assert.equal(back.status, 200, JSON.stringify(back.body));
  await page.waitForFunction(id => { const e = window.__snapshot.world.entities.find(one => one.id === id); return !e.travel && e.location?.siteId === window.__snapshot.world.household.homeSiteId; }, him.id, { timeout: 180000 });
  const errand = await command(page, { action: 'chore', entityId: him.id, chore: 'visit-shop', errand: [{ id: 'store:seed', n: 1, pay: 'food' }] });
  assert.equal(errand.status, 200, JSON.stringify(errand.body));
  await page.waitForFunction(id => window.__snapshot.world.events.some(event => event.actorId === id && /bought 2 seed .* to a clean customer/.test(event.text || '')), him.id, { timeout: 120000 });
  observed.paid = (await snapshot(page)).events.find(event => event.actorId === him.id && /bought 2 seed/.test(event.text || '')).text;
  ok(`the story says: "${observed.paid}"`);
  await page.waitForFunction(id => { const e = window.__snapshot.world.entities.find(one => one.id === id); return !e.chore && !e.travel && e.location?.siteId === window.__snapshot.world.household.homeSiteId; }, him.id, { timeout: 180000 });
  await page.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.chore, her.id, { timeout: 180000 }).catch(() => command(page, { action: 'stop-chore', entityId: her.id }));
  await page.waitForTimeout(500);

  // 6. The women's own work, drawn at it. Slowed so a spell lasts long enough to look at. The wash cleans the father, home again.
  await focus(page, her.id);
  app.setPace(700);
  for (const work of ['keep-house', 'work-garden', 'wash-clothes']) {
    // A child with nothing to do stops her to talk (sim/childhood.mjs): the children are given their play first, as a student would.
    let sent = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      sent = await command(page, { action: 'chore', entityId: her.id, chore: work });
      if (sent.status === 200 || !/stopped to talk|holding|baby/.test(sent.body?.error || '')) break;
      const little = (await snapshot(page)).entities.filter(one => one.kind === 'person' && one.age >= 2 && one.age < 10 && !one.chore);
      for (const child of little) await command(page, { action: 'chore', entityId: child.id, chore: 'child-play' });
      await page.waitForTimeout(800);
    }
    assert.equal(sent.status, 200, `${work}: ${JSON.stringify(sent.body)}`);
    await page.waitForFunction(([id, a]) => window.__workDrawn?.[id]?.activity === a && window.__workDrawn[id].stroke, [her.id, work], { timeout: 40000 });
    await page.waitForTimeout(600);
    const drawn = await page.evaluate(id => ({ ...window.__workDrawn[id] }), her.id);
    if (work === 'work-garden') {
      await page.waitForFunction(() => window.__gardenDrawn && Object.keys(window.__gardenDrawn).length, null, { timeout: 30000 });
      observed.garden = await page.evaluate(() => window.__gardenDrawn);
    }
    observed[work] = { stroke: drawn.stroke, clip: drawn.clip, art: drawn.art };
    await shot(page, work);
    ok(`${her.name} at ${work}: drawn ${drawn.stroke} (${drawn.clip})${work === 'work-garden' ? `, and the garden drawn beside the house (${JSON.stringify(Object.values(observed.garden)[0])})` : ''}`);
    await page.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.chore, her.id, { timeout: 120000 });
  }
  app.setPace(160);
  // The garden by itself, the work done and nobody standing in it, the cards put away.
  for (let i = 0; i < 2; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); }
  await page.waitForTimeout(800);
  observed.gardenAfter = await page.evaluate(() => window.__gardenDrawn);
  assert.ok(observed.gardenAfter && Object.keys(observed.gardenAfter).length, 'the garden is not drawn once the work is done');
  await shot(page, 'garden');
  const told =(await snapshot(page)).events.filter(event => event.actorId === her.id && /kept house|kitchen garden|did the wash/.test(event.text || '')).map(event => event.text);
  assert.equal(told.length, 3, `the story: ${told.join(' | ')}`);
  ok(`the story says: ${told.map(text => `"${text}"`).join(' ')}`);
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.dirty === undefined && !window.__fliesDrawn?.[id], him.id, { timeout: 20000 });
  ok(`the wash done, ${him.name}'s clothes are clean and no flies are drawn over him`);

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/custom-work-browser.json', `${JSON.stringify({
    record: "Men's work, women's work and the wash, in a browser (sim/custom.mjs, sim/housework.mjs)",
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: `Same computer only, headless Chrome at 1366x768. One real class through the join flow on the invented country (seed ${SEED}). No LAN or district claim.`,
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
  await app.close();
} finally {
  await browser.close();
}

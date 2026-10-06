// The trees drawn over somebody walking among them are the ground's own, in a real browser (owner, 2026-10-05: "Characters that walk
// through woods sometimes bring the trees with them in a cluster as they walk (graphical glitch)."; public/trees-front.js, public/app.js
// `treesInFront`, docs/WOODS_AND_BUILDING.md §6.13).
//
// tests/trees-front.test.mjs holds the page's own function to the rule. This proves it on the page, at 1366x768, a family's father
// sent across the timber of `land-paths-10` (the land of scripts/land-paths-browser-proof.mjs):
//
//   - close in, with the trees at full strength: every tree drawn again over him is one the ground drew (`window.__groundTrees`), at
//     full strength, and some are - he is seen among the trees;
//   - zoomed out into the band where the trees fade in: none is drawn again over him. The code before drew each near him again at its
//     fading strength over itself, a darker cluster that walked with him - the glitch, which this proof shows when it is run on the code
//     before (`PROOF_BEFORE=1`: the same steps, with nothing asked of the ground's record, which the code before does not keep).
//
// Same computer only: headless Chrome. Run: npm run test:trees-front
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction } from '../sim/world.mjs';
import { settleMeans } from '../sim/means.mjs';
import { keepFoundingFamilies, settle, taught } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BEFORE = process.env.PROOF_BEFORE === '1';

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });

// A house set on open ground with a stand of timber north of it, and a place across the woods (scripts/land-paths-browser-proof.mjs).
const SEED = 'land-paths-10', SITE = { x: 91.213, y: 44.77 }, ACROSS = { x: 91.447, y: 44.595 };
const worldFactory = (seed, count) => {
  const world = createGonzalesWorld(seed, count, { map: 'colonies' });
  settleMeans(world); settle(world);
  world.status = 'running';
  applyAction(world, 'hh-1', { action: 'choose-site', ...SITE });
  settle(world);
  world.status = 'lobby';
  const household = world.households['hh-1'];
  household.improvements = { ...household.improvements, cabin: 'sound' };
  household.resources.powder = Math.max(household.resources.powder || 0, 12);
  return taught(keepFoundingFamilies(world));
};

const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 1500, worldFactory });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/trees-front-${BEFORE ? 'before-' : ''}${name}.png`; await page.screenshot({ path }); shots.push(path); };
const world = () => app.state.world;
const command = (page, body) => page.evaluate(async body => {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `proof-${Math.random().toString(36).slice(2)}`, ...body }) });
  return { status: response.status, body: await response.json().catch(() => null) };
}, body);
/** A place on the map, in miles, as a point on the page. */
const onPage = (page, at) => page.evaluate(at => {
  const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect(), camera = window.__camera;
  const sx = canvas.width / 2 + (at.x - camera.cx) * camera.scale, sy = canvas.height / 2 + (at.y - camera.cy) * camera.scale;
  return { x: rect.left + sx * rect.width / canvas.width, y: rect.top + sy * rect.height / canvas.height };
}, at);
/** How strongly the woods' trees are drawn at this view (public/woods-view.js `woodsLayers`: in over a view of 1 to 0.4 square miles). */
const treesStrength = page => page.evaluate(() => {
  const canvas = document.querySelector('#world-map'), camera = window.__camera;
  const area = (canvas.width / camera.scale) * (canvas.height / camera.scale);
  return { area, strength: Math.max(0, Math.min(1, (area - 1) / (0.4 - 1))) };
});
/** The family's land, the place brought above the bar, zoomed until the trees are drawn at a strength within `[low, high]`. */
async function viewAt(page, at, low, high) {
  await page.locator('[data-view="home"]').click();
  await page.waitForTimeout(300);
  const box = await page.locator('#world-map').boundingBox();
  for (let i = 0; i < 80; i++) {
    const { strength } = await treesStrength(page);
    if (strength >= low && strength <= high) break;
    const where = await onPage(page, at);
    await page.mouse.move(Math.min(box.x + box.width - 5, Math.max(box.x + 5, where.x)), Math.min(box.y + box.height - 5, Math.max(box.y + 5, where.y)));
    await page.mouse.wheel(0, strength < low ? -60 : 60);
    await page.waitForTimeout(120);
  }
  const from = await onPage(page, at), to = { x: box.x + box.width * 0.55, y: box.y + box.height * 0.4 };
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  for (let k = 1; k <= 8; k++) await page.mouse.move(from.x + (to.x - from.x) * k / 8, from.y + (to.y - from.y) * k / 8);
  await page.mouse.up();
  await page.waitForTimeout(600);
  return treesStrength(page);
}
async function tipsAway(page) {
  for (let i = 0; i < 4; i++) {
    const got = page.getByRole('button', { name: 'Got it' });
    if (!(await got.isVisible().catch(() => false))) return;
    await got.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(200);
  }
}
/** The trees drawn again over somebody this frame, each with whether the ground drew it and how strongly. */
const drawnAgain = (page, id) => page.evaluate(id => (window.__treesInFront || []).filter(one => one.over === id).map(one => {
  const key = one.key || null, ground = window.__groundTrees?.get?.(key);
  return { key, x: one.x, y: one.y, ground: ground ? +ground.alpha.toFixed(3) : null };
}), id);
/** Send the father across the woods and sample what is drawn over him while he walks there. */
async function walkAcross(page, father, samples = 40) {
  const sent = await command(page, { action: 'hunt-land', entityId: father, x: ACROSS.x, y: ACROSS.y });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  const seen = [];
  let walking = 0;
  for (let t = 0; t < 300 && walking < samples; t++) {
    const moving = await page.evaluate(id => window.__walking?.[id] !== undefined, father);
    if (moving) { walking++; seen.push(...await drawnAgain(page, father)); if (walking === Math.floor(samples / 2)) await shot(page, `walking-${seen.length ? 'among' : 'clear'}`); }
    await page.waitForTimeout(40);
  }
  await command(page, { action: 'stop-chore', entityId: father });
  return { walking, seen };
}

try {
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Tree reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  for (const button of ['#wagon-done', '#tutorial-skip']) if (await page.locator(button).isVisible()) await page.locator(button).click({ timeout: 5000 }).catch(() => {});
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  await page.locator('#family-panel').waitFor({ state: 'visible' });
  const household = world().households['hh-1'];
  const father = household.members.find(id => world().entities[id].kin?.role === 'father') || household.principalId;
  for (const one of household.members.map(id => world().entities[id]).filter(person => person.kind === 'person' && person.age >= 2 && person.age < 10)) {
    await command(page, { action: 'chore', entityId: one.id, chore: 'child-play' });
  }
  await tipsAway(page);
  const middle = { x: (SITE.x + ACROSS.x) / 2, y: (SITE.y + ACROSS.y) / 2 };

  // 1. Close in, the trees at full strength: what is drawn over him is the ground's own.
  observed.close = await viewAt(page, middle, 0.99, 1);
  assert.ok(observed.close.strength >= 0.99, `close in: the trees at ${observed.close.strength}`);
  const close = await walkAcross(page, father);
  observed.closeWalk = { frames: close.walking, drawnAgain: close.seen.length, notTheGround: close.seen.filter(one => !one.ground || one.ground < 0.98).length };
  assert.ok(close.walking >= 10, `the father was seen walking (${close.walking} frames)`);
  if (!BEFORE) {
    assert.ok(close.seen.length > 0, 'a tree in front of him is drawn over him as he goes among them');
    assert.deepEqual(close.seen.filter(one => !one.ground || one.ground < 0.98), [], 'every tree drawn again over him is one the ground drew, at full strength');
    ok(`close in: ${close.walking} frames of him walking among the trees, ${close.seen.length} trees drawn again over him, every one the ground's own at full strength`);
  }

  // 2. In the band where the trees fade in: nothing drawn again over him.
  await page.waitForFunction(id => !window.__snapshot?.world.entities.find(one => one.id === id)?.chore, father, { timeout: 30000 }).catch(() => {});
  observed.fade = await viewAt(page, middle, 0.15, 0.85);
  assert.ok(observed.fade.strength >= 0.15 && observed.fade.strength <= 0.85, `in the fade band: the trees at ${observed.fade.strength}`);
  const fading = await walkAcross(page, father);
  observed.fadeWalk = { frames: fading.walking, drawnAgain: fading.seen.length };
  assert.ok(fading.walking >= 10, `the father was seen walking (${fading.walking} frames)`);
  if (BEFORE) {
    assert.ok(fading.seen.length > 0, 'the code before draws no tree again over him in the fade band, so the glitch is not shown here');
    ok(`the code before, in the fade band (trees at ${observed.fade.strength.toFixed(2)}): ${fading.seen.length} trees drawn again over him at their fading strength, over themselves - the cluster that walks with him`);
  } else {
    assert.equal(fading.seen.length, 0, 'a tree drawn again over itself while the trees fade in');
    ok(`in the fade band (trees at ${observed.fade.strength.toFixed(2)}): ${fading.walking} frames of him walking, no tree drawn again over him`);
  }

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync(`docs/evidence/trees-front-${BEFORE ? 'before-' : ''}browser.json`, `${JSON.stringify({
    record: BEFORE ? 'The trees drawn over a walker, on the code before 2026-10-05: the fade-band glitch shown' : 'The trees drawn over a walker are the ground\'s own (owner, 2026-10-05)',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only: headless Chrome at 1366x768. No Chromebook, LAN or classroom claim.',
    checks: pass,
    observed,
    shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}

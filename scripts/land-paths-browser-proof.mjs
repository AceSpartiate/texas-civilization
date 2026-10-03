// Paths, the way round the trees, and the fenced yard, in a real browser (owner, 2026-10-02: "it's weird seeing characters walk
// over trees. paths should be cut to facilitate quick, reasonable movement on a families land. there should be an option to fence
// in a yard too. if there's a fenced in yard then kids on auto play will not be disobedient as often."; sim/land-paths.mjs).
//
// tests/land-paths.test.mjs proves the rules. This proves what a student sees on a family's land in the timber, at 1366x768:
//
//   - the ways the family has trodden to its water and its plot, drawn on the land once the house stands;
//   - somebody sent across the woods walks round the trees: every place the page draws them over a tick is on the points the server
//     walked them, and none of those is a standing tree's cell; and a tree in front of them is drawn over them;
//   - *Cut a path* from the bar, the place tapped on the map, the line drawn and what it would take said; the trees in its way come
//     down and the path is drawn; the cutter walks home along it;
//   - *Fence a yard* from the bar, its rails drawn round the house, and a child at play kept inside them.
//
// Same computer only: headless Chrome. Run: npm run test:land-paths
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction } from '../sim/world.mjs';
import { settleMeans } from '../sim/means.mjs';
import { keepFoundingFamilies, settle, taught } from '../tests/support/settled.mjs';
import { treeCellAt } from '../sim/land-paths.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });

// A family on the real land whose house is set on open ground with a stand of timber north of it (found by search, 2026-10-02):
// from it, a place across the woods whose straight line runs over 36 trees and whose way round them over none.
const SEED = 'land-paths-10', SITE = { x: 91.213, y: 44.77 }, ACROSS = { x: 91.447, y: 44.595 };
// The path is cut half way there: into the timber, and short enough to watch.
const CUT_TO = { x: +((SITE.x + ACROSS.x) / 2).toFixed(3), y: +((SITE.y + ACROSS.y) / 2).toFixed(3) };
const worldFactory = (seed, count) => {
  const world = createGonzalesWorld(seed, count, { map: 'colonies' });
  settleMeans(world); settle(world);
  world.status = 'running';
  applyAction(world, 'hh-1', { action: 'choose-site', ...SITE });
  settle(world);
  world.status = 'lobby';
  const household = world.households['hh-1'];
  household.improvements = { ...household.improvements, cabin: 'sound' };
  household.resources.powder = Math.max(household.resources.powder || 0, 6);
  // A little one of the family to play in the yard: the youngest made six, a child of the yard's age.
  const young = household.members.map(id => world.entities[id]).filter(one => one.kind === 'person' && one.kin?.role !== 'father' && one.kin?.role !== 'mother').sort((a, b) => a.age - b.age)[0];
  if (young && !(young.age >= 2 && young.age < 10)) young.age = 6;
  return taught(keepFoundingFamilies(world));
};

const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 700, worldFactory });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/land-paths-${name}.png`; await page.screenshot({ path }); shots.push(path); };
const world = () => app.state.world;
const command = (page, body) => page.evaluate(async body => {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `proof-${Math.random().toString(36).slice(2)}`, ...body }) });
  return { status: response.status, body: await response.json().catch(() => null) };
}, body);
/** A place on the map, in miles, as a point on the page to click. */
const onPage = (page, at) => page.evaluate(at => {
  const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect(), camera = window.__camera;
  const sx = canvas.width / 2 + (at.x - camera.cx) * camera.scale, sy = canvas.height / 2 + (at.y - camera.cy) * camera.scale;
  return { x: rect.left + sx * rect.width / canvas.width, y: rect.top + sy * rect.height / canvas.height };
}, at);
/** Close on a place, with the trees drawn one by one: the family's land, zoomed in, and the map dragged until the place is above the bar. */
async function closeOn(page, at) {
  await page.locator('[data-view="home"]').click();
  for (let i = 0; i < 12 && await page.evaluate(() => { const c = window.__camera, m = document.querySelector('#world-map'); return (m.width / c.scale) * (m.height / c.scale) > 0.25; }); i++) {
    await page.locator('[data-view="in"]').click();
    await page.waitForTimeout(150);
  }
  const from = await onPage(page, at), box = await page.locator('#world-map').boundingBox();
  const to = { x: box.x + box.width * 0.55, y: box.y + box.height * 0.38 };
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  for (let k = 1; k <= 8; k++) await page.mouse.move(from.x + (to.x - from.x) * k / 8, from.y + (to.y - from.y) * k / 8);
  await page.mouse.up();
  await page.waitForTimeout(300);
}
/** The one-time tips put away, as a student does, so nothing covers the land in the pictures. */
async function tipsAway(page) {
  for (let i = 0; i < 4; i++) {
    const got = page.getByRole('button', { name: 'Got it' });
    if (!(await got.isVisible().catch(() => false))) return;
    await got.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(200);
  }
}
/** Where the page drew somebody's feet, in miles: the figure's middle (`drawnAt`) brought down to the ground and off the camera. */
const drawnFeet = (page, id) => page.evaluate(id => {
  const spot = window.__drawnAt?.[id], camera = window.__camera, canvas = document.querySelector('#world-map');
  if (!spot || !camera) return null;
  const feetY = spot.y + spot.size * 0.45;
  return { x: camera.cx + (spot.x - canvas.width / 2) / camera.scale, y: camera.cy + (feetY - canvas.height / 2) / camera.scale, tick: window.__snapshot.world.tick, walked: window.__snapshot.world.entities.find(one => one.id === id)?.walked || null, share: window.__walking?.[id] ?? null };
}, id);
const toSegment = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0; return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t); };
const offLine = (p, points) => Math.min(...points.slice(1).map((b, i) => toSegment(p, points[i], b)));

try {
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Path reader');
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
  const hh = () => world().households['hh-1'];
  const household = hh();
  const father = household.members.find(id => world().entities[id].kin?.role === 'father') || household.principalId;
  const mother = household.members.find(id => world().entities[id].kin?.role === 'mother');
  const child = household.members.map(id => world().entities[id]).find(one => one.kind === 'person' && one.age >= 2 && one.age < 10)?.id;
  assert.ok(mother && child, 'a mother and a little one');
  // The little ones given their play for the day, so none stops a grown-up to talk (docs/CHILDREN.md §3) while this proof sends them.
  for (const one of household.members.map(id => world().entities[id]).filter(person => person.kind === 'person' && person.age >= 2 && person.age < 10)) {
    const playing = await command(page, { action: 'chore', entityId: one.id, chore: 'child-play' });
    assert.equal(playing.status, 200, JSON.stringify(playing.body));
  }

  // Close on the way across the woods, with the trees drawn one by one.
  await tipsAway(page);
  await closeOn(page, { x: (SITE.x + ACROSS.x) / 2, y: (SITE.y + ACROSS.y) / 2 });
  observed.camera = await page.evaluate(() => window.__camera);

  // 1. The ways trodden once the house stands.
  await page.waitForFunction(() => (window.__snapshot?.world.land?.paths || []).some(path => path.kind === 'trodden') && (window.__pathsDrawn || []).some(path => path.kind === 'trodden' && path.worn.length > 1), null, { timeout: 20000 });
  observed.trodden = await page.evaluate(() => window.__pathsDrawn.filter(path => path.kind === 'trodden').map(path => ({ id: path.id, miles: path.miles })));
  ok(`the family's trodden ways are drawn on its land: ${observed.trodden.map(path => `${path.id} ${path.miles} mi`).join(', ')}`);

  // 2. Somebody sent across the woods walks round the trees. The mother is sent to hunt the place across them.
  const sent = await command(page, { action: 'hunt-land', entityId: mother, x: ACROSS.x, y: ACROSS.y });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  const samples = [];
  let bends = 0, inFront = 0;
  for (let t = 0; t < 200 && samples.length < 40; t++) {
    const seen = await drawnFeet(page, mother);
    if (seen?.walked?.length > 1) { samples.push(seen); if (seen.walked.length > 2) bends++; inFront = Math.max(inFront, await page.evaluate(id => (window.__treesInFront || []).filter(one => one.over === id).length, mother)); }
    if (samples.length === 4) await shot(page, 'round-the-trees');
    await page.waitForTimeout(35);
  }
  assert.ok(samples.length >= 4, `the mother was seen walking (${samples.length} samples)`);
  assert.ok(bends > 0, 'a tick\'s walk bends round something');
  // On her way (the first three quarters of a tick's walk, before her place at the work eases in): on the server's points.
  const onTheWay = samples.filter(sample => sample.share !== null && sample.share < 0.75);
  assert.ok(onTheWay.length >= 2, `seen on her way (${onTheWay.length} frames)`);
  const worst = Math.max(...onTheWay.map(sample => offLine(sample, sample.walked)));
  observed.walkedOff = +worst.toFixed(5);
  assert.ok(worst < 0.0025, `the page draws her on the server's points walked (at worst ${worst.toFixed(5)} miles off them)`);
  // Every point of her way but where it set out from and where it was going (the hunt's places in the timber).
  const overTrees = samples.flatMap(sample => sample.walked.slice(1, -1)).filter(point => treeCellAt(world(), point));
  assert.deepEqual(overTrees, [], 'none of the points walked is a standing tree\'s cell');
  observed.inFront = inFront;
  assert.ok(inFront > 0, 'a tree in front of her is drawn over her as she goes among them');
  ok(`walked round the trees: ${onTheWay.length} frames on her way drawn on the server's walked points (at worst ${observed.walkedOff} mi off), ${bends} of them on a bending way, none over a tree; trees in front drawn over her: ${observed.inFront}`);
  await page.waitForFunction(id => !window.__snapshot?.world.entities.find(one => one.id === id)?.walked, mother, { timeout: 30000 }).catch(() => {});
  await command(page, { action: 'stop-chore', entityId: mother });

  // 3. Cut a path from the bar, the place tapped on the map.
  await asMain(page, father);
  const icon = page.locator(`.panel-row[data-entity-id="${father}"] .panel-icon[data-key="cut-path"]`);
  await icon.waitFor({ state: 'visible', timeout: 15000 }).catch(async error => {
    const why = await page.evaluate(id => ({ keys: [...document.querySelectorAll(`.panel-row[data-entity-id="${id}"] .panel-icon`)].map(one => one.dataset.key), work: window.__snapshot.world.work[id]?.filter(entry => ['cut-path', 'fence-yard'].includes(entry.id)) }), father);
    throw new Error(`${error.message}: ${JSON.stringify(why)}`);
  });
  observed.icon = await icon.getAttribute('data-summary');
  await icon.click();
  await page.locator('#survey-choose').waitFor({ state: 'visible' });
  await tipsAway(page);
  await closeOn(page, { x: (SITE.x + ACROSS.x) / 2, y: (SITE.y + ACROSS.y) / 2 });
  const target = await onPage(page, CUT_TO);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(() => /A path of|The rest of the path/.test(document.querySelector('#survey-text')?.textContent || ''), null, { timeout: 15000 });
  observed.chooser = { title: await page.locator('#survey-title').textContent(), text: await page.locator('#survey-text').textContent(), send: await page.locator('#survey-send').textContent() };
  assert.match(observed.chooser.text, /trees? stands? in its way/);
  await shot(page, 'chooser');
  ok(`Cut a path from the bar (${observed.icon}); the place tapped says: "${observed.chooser.text}"`);
  await page.locator('#survey-send').click();
  await page.waitForFunction(() => (window.__snapshot?.world.land?.paths || []).some(path => path.kind === 'cut'), null, { timeout: 15000 });
  await page.waitForTimeout(2500);
  await shot(page, 'cutting');
  await page.waitForFunction(() => { const path = (window.__snapshot?.world.land?.paths || []).find(one => one.kind === 'cut'); return path && path.cut === undefined; }, null, { timeout: 120000, polling: 200 });
  const cut = hh().paths.find(path => path.kind === 'cut');
  observed.cut = { points: cut.points, felled: Object.values(world().woods.felled).filter(one => one.by === 'hh-1').length };
  assert.ok(observed.cut.felled > 0, 'trees came down for it');
  // Walked home along it: every point walked keeps to the path.
  const home = [];
  for (let t = 0; t < 200 && home.length < 30; t++) {
    const seen = await drawnFeet(page, father);
    if (seen?.walked?.length > 1) home.push(seen);
    if (home.length === 3) await shot(page, 'on-the-path');
    await page.waitForTimeout(35);
  }
  assert.ok(home.length >= 2, `seen walking home (${home.length} frames)`);
  // The way home keeps to the path until it turns off for the yard by the door.
  // Every point of every tick's walk home, once each; and along it, at a sixty-fourth of a mile, how much lies on the path.
  const walkedHome = [...new Map(home.flatMap(sample => sample.walked).map(point => [`${point.x},${point.y}`, point])).values()];
  const along = [];
  for (let i = 1; i < walkedHome.length; i++) { const a = walkedHome[i - 1], b = walkedHome[i], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (1 / 64))); for (let k = 0; k < n; k++) along.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n }); }
  // On a path: the one cut, or the trodden way to the water it was cut from.
  const ways = hh().paths.map(path => path.points);
  const onPath = along.filter(point => Math.min(...ways.map(points => offLine(point, points))) < 0.004).length;
  observed.homeOnPath = `${onPath} of ${along.length} sixty-fourths of a mile`;
  assert.ok(onPath >= along.length / 2, `the way home keeps to the paths (${observed.homeOnPath} on them)`);
  assert.ok((await page.evaluate(() => window.__pathsDrawn.find(path => path.kind === 'cut')?.worn.length || 0)) > 1, 'the cut path is drawn');
  ok(`the path is cut (${observed.cut.felled} trees felled onto the pile) and drawn; walked home along the paths, ${observed.homeOnPath} of the way on them`);

  // 4. Fence a yard from the bar, and a child at play inside it.
  const fence = page.locator(`.panel-row[data-entity-id="${father}"] .panel-icon[data-key="fence-yard"]`);
  await page.waitForFunction(id => !window.__snapshot?.world.entities.find(one => one.id === id)?.chore, father, { timeout: 60000 });
  await fence.waitFor({ state: 'visible', timeout: 15000 });
  await fence.click();
  await page.waitForFunction(() => window.__snapshot?.world.land?.yard?.fence === 'sound', null, { timeout: 60000 });
  await page.waitForFunction(() => window.__yardDrawn?.fence === 'sound', null, { timeout: 15000 });
  await tipsAway(page);
  await closeOn(page, SITE);
  await page.waitForFunction(() => window.__yardDrawn?.fence === 'sound', null, { timeout: 15000 });
  observed.yard = { box: hh().yard, drawn: await page.evaluate(() => window.__yardDrawn) };
  ok(`Fence a yard from the bar: rails drawn round the house at ${JSON.stringify(observed.yard.drawn)}`);
  await command(page, { action: 'stop-chore', entityId: child });
  const played = await command(page, { action: 'chore', entityId: child, chore: 'child-tag' });
  assert.equal(played.status, 200, JSON.stringify(played.body));
  const inside = [];
  for (let t = 0; t < 40; t++) {
    const at = await page.evaluate(id => ({ spot: window.__drawnAt?.[id], yard: window.__yardDrawn }), child);
    if (at.spot && at.yard) inside.push(at.spot.x >= at.yard.left - 2 && at.spot.x <= at.yard.right + 2 && at.spot.y + at.spot.size * 0.45 >= at.yard.top - 2 && at.spot.y + at.spot.size * 0.45 <= at.yard.bottom + 2);
    if (t === 20) await shot(page, 'yard');
    await page.waitForTimeout(120);
  }
  const server = world().entities[child].location;
  assert.ok(inside.length >= 20 && inside.every(Boolean), `the child is drawn inside the rails in every frame (${inside.filter(Boolean).length} of ${inside.length})`);
  const yardNow = hh().yard;
  assert.ok(server.x >= yardNow.minX && server.x <= yardNow.maxX && server.y >= yardNow.minY && server.y <= yardNow.maxY, 'and the server has them there');
  ok(`a child at tag stays inside the yard's rails: ${inside.length} frames, all inside`);

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/land-paths-browser.json', `${JSON.stringify({
    record: 'Paths, the way round the trees and the fenced yard, in a browser (owner, 2026-10-02)',
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

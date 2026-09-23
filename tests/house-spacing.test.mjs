// Houses stand as far apart as they are drawn (owner, 2026-09-23: "fix the overlapping houses so spacing matches the
// drawings"). The map draws a house at its symbol size - `CABIN_PEOPLE` people high, a person `PERSON_MILES` of ground,
// an eight-foot cell about 149 feet of the map - and the server checked where it could stand in true feet, an 80 by 64
// foot envelope: two houses it let stand a hundred feet apart were drawn one over the other, and a house on dry ground by a
// creek was drawn over the water. Both now read one footprint (sim/house-footprint.mjs); sim/house-placement.mjs checks it.
//
// These tests hold the server's footprint to the page's own drawing (`drawPlacedHouse` and `placementRefusal`, read out of
// public/app.js, drawing with public/art.js and the real house sheets' measurements), and the check to the rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawHousePlot, houseFootprint, plotCell } from '../public/house-plot.js';
import { CABIN_PEOPLE, CELL_MILES, PERSON_MILES, PICTURE_REACH, SPACE_REFUSAL, houseOnGround, overlaps, spacingRefusal, standingAt } from '../sim/house-footprint.mjs';
import { checkHousePlacement, housesOnLand } from '../sim/house-placement.mjs';
import { plotCatalogue, PIECES } from '../sim/houseplot.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { holdingOf, LABOR_SIDE } from '../sim/grants.mjs';
import { SITE_MARGIN, landAround, siteFacts } from '../sim/ground.mjs';
import { woodsRule } from '../sim/woods.mjs';
import { PLOT_SIDE, squareOf } from '../sim/fields.mjs';
import { plotRefusal } from '../sim/survey.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
globalThis.fetch = async url => {
  const path = String(url);
  if (path === '/assets/frontier-v1/atlas.json') return { ok: true, json: async () => atlas };
  if (/\.png(\?|$)/.test(path)) return { ok: true, blob: async () => ({}) };
  return { ok: false };
};
globalThis.createImageBitmap = async () => ({ stub: 'sheet' });
const { drawSprite, loadArt, spriteFrame } = await import('../public/art.js');
await loadArt({ sheets: ['house-modules', 'houses-settling'] });
const catalogue = plotCatalogue();

const page = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
function declaration(start, end) {
  const from = page.indexOf(start);
  assert.ok(from >= 0, `${start} was not found in public/app.js, so this test checks nothing`);
  return page.slice(from, page.indexOf(end, from) + end.length);
}
const SIZE = new Function('CABIN_PEOPLE', `${declaration('const SIZE = {', '\n};')} return SIZE;`)(CABIN_PEOPLE);
const window = { __placedHousesDrawn: [] };
const { cabinSize, drawPlacedHouse } = new Function('SIZE', 'plotCatalogue', 'drawSprite', 'spriteFrame', 'drawHousePlot', 'houseFootprint', 'plotCell', 'window',
  `${declaration('const cabinSize = ', ';\n')}\n${declaration('function drawPlacedHouse(', '\n}\n')}\nreturn { cabinSize, drawPlacedHouse };`,
)(SIZE, catalogue, drawSprite, spriteFrame, drawHousePlot, houseFootprint, plotCell, window);
/** The page's own prediction of the server's refusal, under the placement being made (`housePlacement` in public/app.js). */
const pageRefusal = (view, sites, placing, placement) => new Function('sitesOf', 'plotCatalogue', 'housePlacement', 'standingAt', 'houseOnGround', 'spacingRefusal',
  `${declaration('function placementRefusal(', '\n}\n')}\nreturn placementRefusal;`,
)(() => sites, catalogue, placing, standingAt, houseOnGround, spacingRefusal)(view, placement);

const ctx = () => ({ globalAlpha: 1, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, transform() {}, fillRect() {}, strokeRect() {}, drawImage() {} });
/** A camera as the page makes one, close enough in that a person is drawn `PERSON_MILES` high (`figure` unfloored). */
const camera = { scale: 2600, figure: 2600 * PERSON_MILES, toScreen: p => ({ x: 720 + (p.x - 50) * 2600, y: 500 + (p.y - 20) * 2600 }) };
const toWorld = (x, y) => ({ x: 50 + (x - 720) / camera.scale, y: 20 + (y - 500) / camera.scale });
const finished = id => catalogue.plans.find(plan => plan.id === id).pieces.map(([type, x, y]) => [type, x, y, PIECES[type].stages.length, 0]);
const PLANS = catalogue.plans.map(plan => plan.id);
const close = (a, b, what) => { for (const k of ['minX', 'minY', 'maxX', 'maxY']) assert.ok(Math.abs(a[k] - b[k]) < 1e-9, `${what}: ${k} ${a[k]} is not ${b[k]}`); };

test('the ground the server checks is the footprint the page draws, every plan at every quarter turn', () => {
  const site = { x: 50.2, y: 20.1 }, world = { map: { sites: { 'home-1': site } } }, household = { homeSiteId: 'home-1' };
  for (const plan of PLANS) for (const rotation of [0, 90, 180, 270]) {
    const placement = { x: 50.03, y: 19.98, rotation }, pieces = finished(plan);
    window.__placedHousesDrawn = [];
    drawPlacedHouse(ctx(), camera, { placement, pieces }, 0.5);
    const [shown] = window.__placedHousesDrawn, at = camera.toScreen(placement);
    const drawn = { ...toWorld(at.x + shown.footprint.x, at.y + shown.footprint.y) };
    const far = toWorld(at.x + shown.footprint.x + shown.footprint.w, at.y + shown.footprint.y + shown.footprint.h);
    const [server] = housesOnLand(world, household, [{ placement, pieces: pieces.map(([type, x, y]) => ({ type, x, y })) }]);
    close(server.footprint, { minX: drawn.x, minY: drawn.y, maxX: far.x, maxY: far.y }, `${plan} at ${rotation}`);
    // And the plan being placed, before it has any pieces of its own, is the same ground.
    close(houseOnGround({ plan }, catalogue, placement).footprint, server.footprint, `${plan} at ${rotation}, as a plan`);
  }
  // A house placed nowhere - an old save, a house planned before placement - is drawn at the family's site
  // (`drawLandHouses`), and the server reads it where it is drawn there.
  const pieces = finished('dog-run'), atSite = [], placed = [];
  const log = into => ({ ...ctx(), drawImage(...args) { into.push(args.slice(5)); } });
  drawHousePlot(log(atSite), camera.toScreen(site).x, camera.toScreen(site).y, cabinSize(camera), { house: { pieces } }, catalogue, drawSprite, spriteFrame);
  drawPlacedHouse(log(placed), camera, { placement: standingAt({ pieces }, site), pieces });
  assert.ok(atSite.length > 0);
  assert.deepEqual(placed.map(each => each.map(n => +n.toFixed(6))), atSite.map(each => each.map(n => +n.toFixed(6))));
});

test('every picture of a house stands on the ground it claims, every plan at every quarter turn', () => {
  for (const plan of PLANS) for (const rotation of [0, 90, 180, 270]) {
    const placement = { x: 50.03, y: 19.98, rotation };
    window.__placedHousesDrawn = [];
    drawPlacedHouse(ctx(), camera, { placement, pieces: finished(plan) });
    const { box } = window.__placedHousesDrawn[0], { claim } = houseOnGround({ plan }, catalogue, placement);
    const top = toWorld(box.left, box.top), bottom = toWorld(box.right, box.bottom);
    assert.ok(top.x >= claim.minX - 1e-9 && top.y >= claim.minY - 1e-9 && bottom.x <= claim.maxX + 1e-9 && bottom.y <= claim.maxY + 1e-9,
      `${plan} at ${rotation}: pictures drawn over ${JSON.stringify({ top, bottom })}, outside the ground it claims ${JSON.stringify(claim)}`);
  }
  // The pictures stay on the family's own land: a house set back from its line never stands over a neighbour's ground, so no
  // neighbour's house can be drawn over it (holdings do not overlap, sim/grants.mjs).
  assert.ok(Math.max(PICTURE_REACH.up, PICTURE_REACH.side, PICTURE_REACH.down) * CELL_MILES < SITE_MARGIN);
});


// ---------------------------------------------------------------- on the real land
//
// "Drawn" below is measured off the page's drawing (`drawPlacedHouse`), never read from sim/house-footprint.mjs, so these
// tests hold the server to the picture rather than to itself.

/** A cell of the house plot as the page draws it, in miles of the map. */
const C = plotCell(cabinSize(camera)) / camera.scale, W = 3 * C, H = 2 * C;
/** Where a finished house of this plan is drawn: its footprint and the box its pictures cover, in miles of the map. */
function drawn(plan, placement) {
  window.__placedHousesDrawn = [];
  drawPlacedHouse(ctx(), camera, { placement, pieces: finished(plan) });
  const [{ x, y, footprint: f, box }] = window.__placedHousesDrawn;
  const [a, b, c, d] = [toWorld(x + f.x, y + f.y), toWorld(x + f.x + f.w, y + f.y + f.h), toWorld(box.left, box.top), toWorld(box.right, box.bottom)];
  return { footprint: { minX: a.x, minY: a.y, maxX: b.x, maxY: b.y }, pictures: { minX: c.x, minY: c.y, maxX: d.x, maxY: d.y } };
}
/** A colonies class, hh-1's house site chosen (tests/house-plot.test.mjs `onTheLand`). */
function onTheLand(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'], bounds = holdingOf(world, household).bounds;
  const grid = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) grid.push({ x: bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 7, y: bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 7 });
  applyAction(world, household.id, { action: 'choose-site', ...grid.find(point => siteFactsFor(world, household, point).can) });
  return { world, household };
}
/** A round-log cabin finished at a placement. */
const cabin = placement => ({ plan: 'round-log', placement, pieces: finished('round-log').map(([type, x, y, stage]) => ({ type, x, y, stage, progress: 0 })) });
const refusal = (world, household, placement) => { try { checkHousePlacement(world, household, placement, 'round-log'); return null; } catch (error) { return error.message; } };
/** A round-log cabin site on hh-1's land where a second one can stand `offsets` away on open ground, each judged alone. */
function pairSite(world, household, offsets) {
  const bounds = holdingOf(world, household).bounds, alone = { ...household, completedHouses: [] };
  for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) {
    const first = { x: bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 24, y: bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 24, rotation: 0 };
    if (refusal(world, alone, first)) continue;
    if (offsets.every(([dx, dy]) => !refusal(world, alone, { x: first.x + dx, y: first.y + dy, rotation: 0 }))) return first;
  }
  return null;
}
// East of the first cabin: footprints over one another; footprints clear by less than two pictures' overhang, so one's
// picture is over the other's ground; just clear. North of it: clear of its footprint and under its roof; just clear of
// that. The rule's numbers (sim/house-footprint.mjs `PICTURE_REACH`) written out, so a change to them is seen here.
const OVER = [W - C / 2, 0], PICTURE_OVER = [W + 0.5 * C, 0], CLEAR = [W + 2 * 0.9 * C + 1e-6, 0];
const UNDER_ROOF = [0, -(H + 0.5 * C)], CLEAR_NORTH = [0, -(H + (1 + 0.2) * C + 1e-6)];
const spacing = onTheLand('house-spacing-pair');
const first = pairSite(spacing.world, spacing.household, [OVER, PICTURE_OVER, CLEAR, UNDER_ROOF, CLEAR_NORTH]);
const beside = ([dx, dy]) => ({ x: first.x + dx, y: first.y + dy, rotation: 0 });

test('a house whose drawn footprint lies over another house is refused, and one just clear of it is not', () => {
  assert.ok(first, 'no place on the land for two houses side by side, so this test checks nothing');
  const household = { ...spacing.household, completedHouses: [cabin(first)] };
  assert.equal(overlaps(drawn('round-log', first).footprint, drawn('round-log', beside(OVER)).footprint), true);
  assert.equal(refusal(spacing.world, household, beside(OVER)), SPACE_REFUSAL);
  // Just clear, east and north, it stands; and drawn, the two do not overlap: not their footprints, not their pictures.
  for (const offset of [CLEAR, CLEAR_NORTH]) {
    assert.equal(refusal(spacing.world, household, beside(offset)), null, `${JSON.stringify(offset)} is refused`);
    const [a, b] = [drawn('round-log', first), drawn('round-log', beside(offset))];
    for (const [one, other] of [[a.footprint, b.pictures], [a.pictures, b.footprint], [a.pictures, b.pictures]]) assert.equal(overlaps(one, other), false, `${JSON.stringify(offset)}: drawn over one another`);
  }
});

test('a house whose picture would stand over another house\'s ground is refused, beside it or behind it', () => {
  assert.ok(first, 'no place on the land for two houses side by side, so this test checks nothing');
  const household = { ...spacing.household, completedHouses: [cabin(first)] };
  for (const offset of [PICTURE_OVER, UNDER_ROOF]) {
    const [a, b] = [drawn('round-log', first), drawn('round-log', beside(offset))];
    assert.equal(overlaps(a.footprint, b.footprint), false, 'the footprints overlap, so this is the other test');
    assert.ok(overlaps(a.pictures, b.footprint) || overlaps(b.pictures, a.footprint), `${JSON.stringify(offset)}: neither is drawn over the other, so this test checks nothing`);
    assert.equal(refusal(spacing.world, household, beside(offset)), SPACE_REFUSAL, `${JSON.stringify(offset)}: a picture stands over the other house`);
  }
});

test('the preview is refused for spacing exactly where the server refuses it', () => {
  assert.ok(first, 'no place on the land for two houses side by side, so this test checks nothing');
  const world = structuredClone(spacing.world), own = world.households['hh-1'];
  own.house = cabin(first);
  own.improvements.cabin = 'sound';
  const view = projectWorld(world, 'hh-1');
  let compared = 0;
  for (let i = -6; i <= 6; i++) for (let j = -5; j <= 5; j++) {
    // In the rule's own cells: page and server are held to each other here, the rule to the drawing in the tests above.
    const placement = { x: first.x + i * CELL_MILES * 0.75, y: first.y + j * CELL_MILES * 0.75, rotation: (i + j) % 2 ? 90 : 0 };
    const server = spacingRefusal(houseOnGround({ plan: 'round-log' }, catalogue, placement), housesOnLand(world, own));
    assert.equal(pageRefusal(view, Object.values(world.map.sites), { command: { layout: 'round-log', additional: true } }, placement), server, `at ${i}, ${j}`);
    compared += server ? 1 : 0;
  }
  assert.ok(compared > 10, 'hardly any refused spots were compared');
});

/** A dog-run site on hh-1's land where nine points of the drawn footprint are dry and a creek runs under it between them. */
function creekBetweenPoints(world, household) {
  const bounds = holdingOf(world, household).bounds;
  const nine = box => [box.minX, (box.minX + box.maxX) / 2, box.maxX].flatMap(x => [box.minY, (box.minY + box.maxY) / 2, box.maxY].map(y => ({ x, y })));
  for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) for (const rotation of [0, 90]) {
    const placement = { x: bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 40, y: bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 40, rotation };
    const { footprint } = drawn('dog-run', placement);
    if (!nine(footprint).every(point => siteFacts(point, bounds, woodsRule(world)).can)) continue;
    const water = landAround(footprint).waterNear(footprint, 0);
    // In true feet (the 80 by 64 foot envelope the server read until 2026-09-23) the site is dry ground all over.
    const envelope = { minX: placement.x - 40 / 5280, maxX: placement.x + 40 / 5280, minY: placement.y - 32 / 5280, maxY: placement.y + 32 / 5280 };
    if (water && !landAround(envelope).waterNear(envelope, 0)) return { placement, footprint, water };
  }
  return null;
}

test('a house whose drawn footprint lies over the water is refused, though every point it is read at is dry', () => {
  const { world, household } = onTheLand('spacing');
  const found = creekBetweenPoints(world, household);
  assert.ok(found, 'no house site with a creek between its points on this land, so this test checks nothing');
  assert.equal(found.water.distance, 0, 'the creek does not run under the house');
  assert.throws(() => checkHousePlacement(world, household, found.placement, 'dog-run'), /in the water/);
});

test('a house is not set on the family\'s field, and the field is not staked over a house', () => {
  assert.ok(first, 'no place on the land for two houses side by side, so this test checks nothing');
  const world = structuredClone(spacing.world), household = world.households['hh-1'];
  const { footprint } = drawn('round-log', first);
  // Ten acres staked just over the house's east wall.
  const over = { x: footprint.maxX + PLOT_SIDE / 2 - C / 2, y: first.y };
  assert.equal(overlaps(squareOf(over), footprint), true);
  household.plots = [{ id: 'plot-1', ...over, ground: 'prairie', state: 'staked' }];
  assert.throws(() => checkHousePlacement(world, household, first, 'round-log'), /field/);
  household.plots = [];
  assert.equal(refusal(world, household, first), null);
  // And the other way: ten acres surveyed over a house's drawn ground are refused, where without the house they are not.
  assert.equal(plotRefusal(world, household, over), null, 'the plot is refused with no house there, so this test checks nothing');
  household.house = cabin(first);
  assert.equal(plotRefusal(world, household, over), 'That would take in the house yard.');
});

test('a class saved with two houses now drawn over one another opens with both where they stood', () => {
  assert.ok(first, 'no place on the land for two houses side by side, so this test checks nothing');
  const world = structuredClone(spacing.world), household = world.households['hh-1'];
  // Placed under the old envelope: half a drawn cabin apart, clear of each other then and one over the other as drawn.
  const second = { x: first.x + W / 2, y: first.y, rotation: 0 };
  assert.ok(W / 2 > 80 / 5280, 'the old envelope would have refused these, so this is not an old save');
  household.completedHouses = [cabin(first)];
  household.house = cabin(second);
  household.improvements.cabin = 'sound';
  assert.equal(overlaps(drawn('round-log', first).footprint, drawn('round-log', second).footprint), true);
  const saved = JSON.parse(JSON.stringify(world));
  validateWorld(saved);
  for (let tick = 0; tick < 3; tick++) stepWorld(saved);
  validateWorld(saved);
  // Standing, both of them, where they were placed: the rule is for a house still to be placed (the tests above).
  const land = projectWorld(saved, 'hh-1').land;
  assert.deepEqual(land.house.placement, second);
  assert.deepEqual(land.completedHouses.map(house => house.placement), [first]);
});

test('a labor still holds a house, two more and the field the automatic families keep, at the drawn size', t => {
  // A labor, set back from its line; a dog-run along the top, two round-log cabins under it, and ten-acre plots below, all
  // laid out by the server's own rule.
  const land = { minX: 0, minY: 0, maxX: LABOR_SIDE, maxY: LABOR_SIDE };
  const inset = { minX: SITE_MARGIN, minY: SITE_MARGIN, maxX: LABOR_SIDE - SITE_MARGIN, maxY: LABOR_SIDE - SITE_MARGIN };
  const { up, side } = PICTURE_REACH, cell = CELL_MILES;
  const dogRun = houseOnGround({ plan: 'dog-run' }, catalogue, { x: SITE_MARGIN + 4 * cell, y: SITE_MARGIN + cell + up * cell, rotation: 0 });
  const row = dogRun.claim.maxY + up * cell + cell + 1e-6;
  const cabins = [0, 1].map(k => houseOnGround({ plan: 'round-log' }, catalogue, { x: SITE_MARGIN + (1 + side) * cell + k * (3 * cell + 2 * side * cell + 1e-6), y: row, rotation: 0 }));
  const houses = [dogRun, ...cabins];
  const top = Math.max(...houses.map(house => house.claim.maxY));
  const plots = [];
  for (let y = top + PLOT_SIDE / 2; y + PLOT_SIDE / 2 <= land.maxY; y += PLOT_SIDE) for (let x = PLOT_SIDE / 2; x + PLOT_SIDE / 2 <= land.maxX; x += PLOT_SIDE) plots.push(squareOf({ x, y }));
  for (const house of houses) assert.ok(house.footprint.minX >= inset.minX && house.footprint.maxX <= inset.maxX && house.footprint.minY >= inset.minY && house.footprint.maxY <= inset.maxY && house.claim.minX >= land.minX);
  for (const [i, house] of houses.entries()) assert.equal(spacingRefusal(house, houses.filter((_, k) => k !== i)), null);
  for (const plot of plots) assert.equal(houses.some(house => overlaps(house.footprint, plot)), false);
  assert.ok(plots.length >= 3, `only ${plots.length} ten-acre plots fit beside the houses`);
  const acres = box => +((box.maxX - box.minX) * (box.maxY - box.minY) * 640).toFixed(1);
  t.diagnostic(`labor ${+(LABOR_SIDE * 5280).toFixed(0)} ft a side; dog-run drawn over ${acres(dogRun.footprint)} acres (claims ${acres(dogRun.claim)}), a cabin ${acres(cabins[0].footprint)} (claims ${acres(cabins[0].claim)}); ${plots.length} ten-acre plots below the three houses`);
});

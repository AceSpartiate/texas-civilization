// Two houses the server keeps apart are drawn apart at every zoom (owner, 2026-09-23: "fix the zoom issue"). The server
// spaces houses by the ground they are drawn over close in (sim/house-footprint.mjs `CELL_MILES`, tests/house-spacing.test.mjs),
// and the page drew a house with the people, whose figure is floored at seven pixels: from about 370 pixels a mile out every
// house grew past its ground, and two houses as close as allowed were drawn into each other. Now a family's house is never
// floored (`houseScale` in public/app.js): it is drawn at its ground's size down to `HOUSE_LEGIBLE` pixels high, and further
// out the family's houses are drawn as one house, its home, that high.
//
// These tests run the page's own `drawLandHouses`, `drawPlacedHouse`, `notePlacedHouse`, `houseAt`, `landHomeBox`,
// `drawnBox` and `keptApart`, read out of public/app.js, drawing with the page's own `drawSprite` (public/art.js, its sheets
// stubbed) against a context that follows the transform and records the screen box of every picture - at zooms from the
// closest the camera goes to the farthest, on both maps.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawHousePlot, houseFootprint, plotCell } from '../public/house-plot.js';
import { CABIN_PEOPLE, PERSON_MILES, houseOnGround, spacingRefusal } from '../sim/house-footprint.mjs';
import { plotCatalogue } from '../sim/houseplot.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { HOUSE_LEGIBLE, declaration, houseScale, pageCamera } from './support/page-camera.mjs';

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

const SIZE = new Function('CABIN_PEOPLE', `${declaration('const SIZE = {', '\n};')} return SIZE;`)(CABIN_PEOPLE);
const window = { __placedHousesDrawn: [] };
const page = new Function('SIZE', 'plotCatalogue', 'drawSprite', 'spriteFrame', 'drawHousePlot', 'houseFootprint', 'plotCell', 'window', 'drawnNow', 'PERSON_MILES', 'sitesOf',
  [declaration('const cabinSize = ', ';\n'), declaration('const housesDrawn = new Map();', ';\n'), declaration('function houseAt(', '\n}\n'),
    declaration('function drawLandHouses(', '\n}\n'), declaration('function keptApart(', '\n}\n'), declaration('const landHome = ', ';\n'),
    declaration('function landHomeBox(', '\n}\n'), declaration('function drawnBox(', '\n}\n'),
    declaration('function notePlacedHouse(', '\n}\n'), declaration('function drawPlacedHouse(', '\n}\n'),
    declaration('const MIN_EXTENT = ', ';\n'), declaration('const CLOSEST_FIGURE = ', ';\n'), declaration('function worldBounds(', '\n}\n'), declaration('function scaleLimits(', '\n}\n'),
    'return { cabinSize, housesDrawn, houseAt, drawLandHouses, keptApart, landHomeBox, drawPlacedHouse, scaleLimits };'].join('\n'),
)(SIZE, catalogue, drawSprite, spriteFrame, drawHousePlot, houseFootprint, plotCell, window, spots => spots, PERSON_MILES, world => Object.values(world.map?.sites || {}));

/** A canvas context that keeps the transform and records the screen box of each picture drawn. */
function recorder() {
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [], pictures = [];
  const times = ([a, b, c, d, e, f], [A, B, C, D, E, F]) => [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  return {
    pictures, globalAlpha: 1,
    save() { stack.push(m); }, restore() { m = stack.pop(); },
    translate(x, y) { m = times(m, [1, 0, 0, 1, x, y]); },
    rotate(t) { m = times(m, [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t), 0, 0]); },
    scale(x, y) { m = times(m, [x, 0, 0, y, 0, 0]); },
    transform(a, b, c, d, e, f) { m = times(m, [a, b, c, d, e, f]); },
    fillRect() {}, strokeRect() {},
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      const xs = [dx, dx + dw].flatMap(x => [dy, dy + dh].map(y => m[0] * x + m[2] * y + m[4]));
      const ys = [dx, dx + dw].flatMap(x => [dy, dy + dh].map(y => m[1] * x + m[3] * y + m[5]));
      pictures.push({ cut: [sx, sy, sw, sh].join(), height: +dh.toFixed(6), left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) });
    },
  };
}
const overlapping = (a, b) => a.left < b.right - 1e-9 && b.left < a.right - 1e-9 && a.top < b.bottom - 1e-9 && b.top < a.bottom - 1e-9;
const union = boxes => ({ left: Math.min(...boxes.map(b => b.left)), top: Math.min(...boxes.map(b => b.top)), right: Math.max(...boxes.map(b => b.right)), bottom: Math.max(...boxes.map(b => b.bottom)) });
const finished = id => catalogue.plans.find(plan => plan.id === id).pieces.map(([type, x, y]) => [type, x, y, catalogue.pieces.find(piece => piece.id === type).stageCount, 0]);
const site = { id: 'home-1', x: 0, y: 0 };
const cameraAt = scale => pageCamera(scale, p => ({ x: 720 + p.x * scale, y: 500 + p.y * scale }));
/** One frame of a family's land, as drawWorld draws it: its site noted for a tap, then its houses drawn. */
function frame(camera, current, completed = []) {
  const ctx = recorder(), q = camera.toScreen(site), size = page.cabinSize(camera);
  page.housesDrawn.clear();
  page.housesDrawn.set(site.id, { x: q.x, y: q.y - size * .35, size });
  window.__placedHousesDrawn = [];
  page.drawLandHouses(ctx, camera, site.id, q, size, current, completed);
  return { ctx, q, size, houses: window.__placedHousesDrawn };
}

// Every zoom the camera goes to, closest first (`scaleLimits` on a 1440 by 1000 map), on both maps, in forty steps each, and
// either side of the switch to one house.
const THRESHOLD = HOUSE_LEGIBLE / (PERSON_MILES * CABIN_PEOPLE);
const limits = ['gonzales', 'colonies'].map(map => page.scaleLimits(createGonzalesWorld('zoom', 5, map === 'gonzales' ? {} : { map }), { width: 1440, height: 1000 }));
const ZOOMS = [...new Set([...limits.flatMap(({ min, max }) => Array.from({ length: 40 }, (_, i) => max * (min / max) ** (i / 39))), THRESHOLD * 1.001, THRESHOLD * .999, 369, 300])].sort((a, b) => b - a);

/** A second house of `plan` at `rotation` just clear of `first` the way `way` goes: the two claims edge to edge, as close as allowed. */
function justClear(first, plan, rotation, way) {
  const a = houseOnGround(first, catalogue, first.placement).claim, unit = houseOnGround({ plan }, catalogue, { x: 0, y: 0, rotation }).claim;
  // A millionth of a mile clear, the width of a rounding.
  const e = 1e-6, at = way === 'east' ? { x: a.maxX - unit.minX + e, y: first.placement.y } : way === 'west' ? { x: a.minX - unit.maxX - e, y: first.placement.y }
    : way === 'south' ? { x: first.placement.x, y: a.maxY - unit.minY + e } : { x: first.placement.x, y: a.minY - unit.maxY - e };
  const second = { pieces: finished(plan), placement: { ...at, rotation } };
  assert.equal(spacingRefusal(houseOnGround(second, catalogue, second.placement), [houseOnGround(first, catalogue, first.placement)]), null, `the server would refuse the second house ${way} of the first`);
  return second;
}
const PAIRS = [];
for (const [firstPlan, secondPlan] of [['round-log', 'round-log'], ['dog-run', 'round-log'], ['round-log', 'dog-run']]) {
  for (const rotation of [0, 90]) {
    const first = { pieces: finished(firstPlan), placement: { x: 0.1, y: -0.05, rotation } };
    for (const way of ['east', 'west', 'south', 'north']) PAIRS.push({ name: `a ${secondPlan} ${way} of a ${firstPlan}, turned ${rotation}`, first, second: justClear(first, secondPlan, rotation, way) });
  }
}

test(`two houses as close as the server allows are never drawn over one another, at ${ZOOMS.length} zooms from the closest to the farthest`, () => {
  for (const { name, first, second } of PAIRS) for (const scale of ZOOMS) {
    const camera = cameraAt(scale), { ctx, houses } = frame(camera, second, [first]);
    const boxes = houses.map(house => house.box);
    assert.ok(boxes.length >= 1 && boxes.every(Boolean), `${name} at ${scale.toFixed(1)} pixels a mile: no house was drawn`);
    // Every picture drawn is inside one of the houses' boxes, so the boxes are all that was drawn.
    for (const picture of ctx.pictures) assert.ok(boxes.some(box => picture.left >= box.left - 1e-6 && picture.right <= box.right + 1e-6 && picture.top >= box.top - 1e-6 && picture.bottom <= box.bottom + 1e-6), `${name} at ${scale.toFixed(1)}: a picture outside every house's box`);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      assert.equal(overlapping(boxes[i], boxes[j]), false, `${name} at ${scale.toFixed(1)} pixels a mile: the houses are drawn over one another, ${JSON.stringify(boxes)}`);
    }
    // Drawn apart, and each no bigger than its ground: a house is `CABIN_PEOPLE` people of `PERSON_MILES` high, unfloored.
    if (houses.length === 2) for (const house of houses) assert.ok(house.size <= scale * PERSON_MILES * CABIN_PEOPLE + 1e-9, `${name} at ${scale.toFixed(1)}: a house drawn ${house.size} pixels high on ground ${scale * PERSON_MILES * CABIN_PEOPLE} high`);
  }
});

test(`from the zoom a house is drawn ${HOUSE_LEGIBLE} pixels high out, a family's houses are drawn as one, its home, and a tap finds only that one`, () => {
  // HOUSE_LEGIBLE is sixteen pixels, looked at on the house sheets; its zoom is about 255 pixels a mile.
  assert.equal(HOUSE_LEGIBLE, 16);
  assert.ok(Math.abs(THRESHOLD - 255.2) < 0.1, `the switch is at ${THRESHOLD} pixels a mile`);
  const { first, second } = PAIRS[0];
  for (const scale of ZOOMS) {
    const camera = cameraAt(scale), one = scale * PERSON_MILES * CABIN_PEOPLE < HOUSE_LEGIBLE, drawnFrame = frame(camera, second, [first]);
    assert.equal(camera.house.one, one, `at ${scale.toFixed(1)} pixels a mile`);
    assert.equal(drawnFrame.houses.length, one ? 1 : 2, `at ${scale.toFixed(1)} pixels a mile ${drawnFrame.houses.length} houses were drawn`);
    // One house, its home - the first it finished - at the size a house still reads; else each at its ground's size.
    const expected = one ? HOUSE_LEGIBLE : scale * PERSON_MILES * CABIN_PEOPLE;
    for (const house of drawnFrame.houses) assert.ok(Math.abs(house.size - expected) < 1e-9, `at ${scale.toFixed(1)} a house drawn ${house.size} pixels high, not ${expected}`);
    const home = camera.toScreen(first.placement);
    assert.ok(Math.abs(drawnFrame.houses[0].x - home.x) < 1e-9 && Math.abs(drawnFrame.houses[0].y - home.y) < 1e-9, `at ${scale.toFixed(1)} the one house is not drawn at the home`);
    // The people keep their floor: only the house changed.
    assert.equal(camera.figure, Math.max(7, Math.min(150, scale * PERSON_MILES)));
    // A tap finds what was drawn: a placed spot for each house drawn, over the box it was drawn in, and none for a house not drawn.
    const spots = [...page.housesDrawn.values()];
    assert.equal(spots.length, drawnFrame.houses.length, `at ${scale.toFixed(1)} ${spots.length} houses answer a tap where ${drawnFrame.houses.length} were drawn`);
    for (const [spot, house] of spots.map((spot, i) => [spot, drawnFrame.houses[i]])) {
      assert.ok(Math.abs(spot.x - (house.box.left + house.box.right) / 2) < 1e-9 && Math.abs(spot.size * spot.reachX - (house.box.right - house.box.left) / 2) < 1e-9, `at ${scale.toFixed(1)} a tap spot is not the house's box`);
      assert.equal(page.houseAt({ x: (house.box.left + house.box.right) / 2, y: (house.box.top + house.box.bottom) / 2 }), site.id);
    }
    // Where the second house stands and only the one house is drawn, a tap there opens nothing, unless within a fingertip of the one.
    if (one) {
      const middle = camera.toScreen(second.placement), box = drawnFrame.houses[0].box, gap = Math.max(box.left - middle.x, middle.x - box.right, box.top - middle.y, middle.y - box.bottom);
      if (gap > 18) assert.equal(page.houseAt(middle), null, `at ${scale.toFixed(1)} a tap where the second house is not drawn opened it`);
    } else {
      const box = drawnFrame.houses[1].box;
      assert.equal(page.houseAt({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 }), site.id);
    }
  }
});

test('the preview is the house that will stand, at every zoom: the same size, pictures and footprint', () => {
  for (const plan of ['round-log', 'dog-run']) for (const rotation of [0, 90, 180, 270]) for (const scale of ZOOMS) {
    const camera = cameraAt(scale), placement = { x: 0.1, y: -0.05, rotation }, pieces = finished(plan);
    window.__placedHousesDrawn = [];
    const preview = recorder();
    page.drawPlacedHouse(preview, camera, { placement, pieces }, 0.5);
    const [shown] = window.__placedHousesDrawn;
    // Built, it is the family's only house: its home, drawn by drawLandHouses as drawWorld draws it.
    const built = frame(camera, { pieces, placement }), [standing] = built.houses;
    assert.ok(built.ctx.pictures.length >= pieces.length, `${plan} at ${scale.toFixed(1)}: the built house drew nothing`);
    assert.deepEqual(preview.pictures, built.ctx.pictures, `${plan} turned ${rotation} at ${scale.toFixed(1)} pixels a mile: the preview is not the house built`);
    assert.equal(shown.size, standing.size); assert.deepEqual(shown.footprint, standing.footprint); assert.deepEqual(shown.box, standing.box);
    // And both are the size a house is drawn at that zoom, never bigger than its ground unless it is the one house.
    assert.equal(shown.size, houseScale(scale).size);
  }
});

test('zoomed out, two families\' houses are never drawn over one another: the family\'s own is kept, a neighbour\'s over it left out', () => {
  // Two families whose leagues lie a tenth of a mile apart (the closest in ten seeds, 0.085 miles), each house built by
  // the line between them, set back the least it may be (`SITE_MARGIN`, 0.05): 0.185 miles apart.
  const ours = { pieces: finished('dog-run'), placement: { x: 0, y: 0, rotation: 0 } }, theirs = { pieces: finished('round-log'), placement: { x: 0.185, y: 0.01, rotation: 0 } };
  let hidden = 0;
  for (const scale of ZOOMS) {
    const camera = cameraAt(scale), q = camera.toScreen(site);
    const families = [{ own: false, siteId: 'home-2', mine: theirs }, { own: true, siteId: 'home-1', mine: ours }]
      .map(each => ({ ...each, item: each.siteId, box: () => page.landHomeBox(camera, q, each.mine, []) }));
    const { kept, hidden: left } = page.keptApart(families, camera.house.one);
    assert.equal(kept.length + left.length, 2);
    // What is kept is drawn apart: each family's house drawn as drawLandHouses draws it, box by box.
    const drawn = kept.map(each => frame(camera, each.mine).houses[0].box);
    if (drawn.length === 2) assert.equal(overlapping(drawn[0], drawn[1]), false, `at ${scale.toFixed(1)} pixels a mile two families' houses are drawn over one another`);
    // The box keptApart judges by is the box the house is drawn in.
    for (const each of kept) {
      const judged = each.box(), pictures = union(frame(camera, each.mine).ctx.pictures);
      for (const side of ['left', 'top', 'right', 'bottom']) assert.ok(Math.abs(judged[side] - pictures[side]) < 1e-6, `at ${scale.toFixed(1)} the box judged (${side} ${judged[side]}) is not where the house is drawn (${pictures[side]})`);
    }
    if (left.length) { assert.equal(left[0].siteId, 'home-2', 'the family\'s own house was left out for a neighbour\'s'); hidden++; }
    if (!camera.house.one) assert.equal(left.length, 0, `at ${scale.toFixed(1)} a house drawn at its ground's size was left out`);
  }
  assert.ok(hidden > 0, 'no zoom put the two houses over one another, so this test checks nothing');
});

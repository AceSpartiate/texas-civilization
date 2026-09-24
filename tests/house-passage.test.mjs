// The dog-run's open passage is twelve feet wide (owner, 2026-09-24). `HIST-GONZ-025` gives "a ten- or fifteen-foot
// passage" between the two pens; the plan's was one eight-foot cell, narrower than the source's narrowest. It is now a
// cell and a half of the plot: the plot's pieces stand to the half cell rather than round the passage to sixteen feet.
//
// These tests hold the server to twelve feet - the piece, the plan, the footprint and what the roof over it costs - and an
// old class, saved with the eight-foot passage, to what docs/WOODS_AND_BUILDING.md §7 says it does: it opens, laid out
// again at twelve feet, every piece at the stage it had reached, and is drawn as a dog-run planned today at those stages.
// The drawn passage at every turn is tests/house-connected.test.mjs (the pens' facing gables a cell and a half apart) and
// tests/house-turn.test.mjs (the pens' feet 28 feet apart).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readSave, writeSave } from '../server/storage.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { setImprovement } from '../sim/improvements.mjs';
import { CELL_MILES, houseFootprint, houseOnGround } from '../sim/house-footprint.mjs';
import { PIECES, PLANS, placeRefusal, planInvalid, planPieces, plotCatalogue, plotNeeds, widenPassages } from '../sim/houseplot.mjs';
import { drawHousePlot } from '../public/house-plot.js';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
globalThis.fetch = async url => {
  const path = String(url);
  if (path === '/assets/frontier-v1/atlas.json') return { ok: true, json: async () => atlas };
  if (/\.png(\?|$)/.test(path)) return { ok: true, blob: async () => ({}) };
  return { ok: false };
};
globalThis.createImageBitmap = async () => ({ stub: 'sheet' });
const art = await import('../public/art.js');
await art.loadArt({ sheets: ['house-modules', 'houses-settling'] });

/** The plot's cells, in feet: written out here, not read from the code, so the test says what twelve feet is. */
const FEET = 8;
const catalogue = plotCatalogue();
const pensOf = pieces => pieces.filter(([type]) => type.startsWith('pen-')).sort((a, b) => a[1] - b[1]);

test('the dog-run\'s passage is twelve feet wide and its pens twelve feet apart, on the server and in what the page is sent', () => {
  assert.equal(PIECES.passage.w * FEET, 12, 'the passage piece');
  for (const [where, plan, piece] of [['the plans', PLANS['dog-run'].pieces, PIECES.passage], ['the catalogue', catalogue.plans.find(each => each.id === 'dog-run').pieces, catalogue.pieces.find(each => each.id === 'passage')]]) {
    const [west, east] = pensOf(plan), passage = plan.find(([type]) => type === 'passage');
    assert.equal((east[1] - (west[1] + 2)) * FEET, 12, `${where}: the pens' facing walls`);
    assert.equal(passage[1], west[1] + 2, `${where}: the passage against the west pen's east wall`);
    assert.equal(piece.w * FEET, 12, `${where}: the passage's width`);
  }
  assert.equal(planInvalid(planPieces('dog-run')), null, 'the plan is a plot');
  // A house of 60 feet: chimney, pen, passage, pen, chimney - 7.5 cells by 2, the ground its footprint covers at every turn.
  const pieces = planPieces('dog-run');
  for (const rotation of [0, 90, 180, 270]) {
    const foot = houseFootprint({ pieces }, catalogue, rotation), [w, h] = rotation % 180 ? [2, 7.5] : [7.5, 2];
    assert.deepEqual([foot.w, foot.h], [w, h], `the footprint at ${rotation}`);
    const { footprint } = houseOnGround({ plan: 'dog-run' }, catalogue, { x: 0, y: 0, rotation });
    assert.ok(Math.abs(footprint.maxX - footprint.minX - w * CELL_MILES) < 1e-12 && Math.abs(footprint.maxY - footprint.minY - h * CELL_MILES) < 1e-12, `the ground the server checks at ${rotation}`);
  }
  // Its roof is four wall logs and four of work a cell of passage: six and six for twelve feet.
  assert.deepEqual(PIECES.passage.stages.map(stage => [stage.logs.wall, stage.work]), [[6, 6]]);
  const pen = plotNeeds([{ type: 'pen-round', x: 0, y: 0, stage: 0, progress: 0 }]).logs.wall, chimney = plotNeeds([{ type: 'chimney', x: 0, y: 0, stage: 0, progress: 0 }]).logs.wall;
  assert.equal(plotNeeds(pieces).logs.wall, 2 * pen + 2 * chimney + 6, 'the dog-run wants the passage\'s six');
  // A passage one cell wide between pens a cell apart is not a passage any more.
  const old = [{ type: 'pen-round', x: 1, y: 2 }, { type: 'pen-round', x: 4, y: 2 }];
  assert.match(placeRefusal(old, { type: 'passage', x: 3, y: 2 }), /already built there/);
  assert.match(placeRefusal([old[0], { type: 'pen-round', x: 5, y: 2 }], { type: 'passage', x: 3, y: 2 }), /between two pens/);
  // Pieces stand to the half cell, and no finer.
  assert.equal(placeRefusal([], { type: 'pen-round', x: 4.5, y: 2 }), null);
  assert.match(placeRefusal([], { type: 'pen-round', x: 4.25, y: 2 }), /runs off the house plot/);
});

test('no other plan or piece moved: the saddlebag, the cabins, the jacal, the porch, the shed room, the double chimney', () => {
  assert.deepEqual(PLANS.saddlebag.pieces, [['pen-round', 1, 2], ['chimney-double', 3, 2], ['pen-round', 4, 2]]);
  assert.deepEqual(PLANS['round-log'].pieces, [['pen-round', 3, 2], ['chimney', 5, 2]]);
  assert.deepEqual(PLANS['hewn-log'].pieces, [['pen-hewn', 3, 2], ['chimney', 5, 2]]);
  assert.deepEqual(PLANS.jacal.pieces, [['pen-jacal', 3, 2]]);
  assert.deepEqual(['porch', 'shed', 'chimney-double', 'chimney', 'pen-round'].map(id => [PIECES[id].w, PIECES[id].h]), [[2, 1], [2, 1], [1, 2], [1, 1], [2, 2]]);
  assert.deepEqual(PIECES.porch.stages.map(stage => [stage.logs, stage.work]), [[{ any: 4 }, 4]]);
  assert.deepEqual(PIECES.shed.stages.map(stage => [stage.logs, stage.work]), [[{ any: 6 }, 4], [{ any: 4 }, 3]]);
  assert.equal(planInvalid(planPieces('saddlebag')), null);
  const house = { pieces: planPieces('saddlebag') };
  assert.equal(widenPassages(house), false, 'a saddlebag has no passage to widen');
  assert.deepEqual(house.pieces.map(p => p.x), [1, 3, 4]);
});

const grid = (bounds, side = 7) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
/** A colonies class, hh-1's house sited and everybody over to it (as tests/house-plot.test.mjs). */
function onTheLand(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  applyAction(world, 'hh-1', { action: 'choose-site', ...grid(holdingOf(world, household).bounds).find(point => siteFactsFor(world, household, point).can) });
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  return { world, household };
}
/** A dog-run as it was saved before 2026-09-24: the east pen one cell past the passage, its chimney beyond. */
const EIGHT_FOOT = [['pen-round', 1, 2], ['passage', 3, 2], ['pen-round', 4, 2], ['chimney', 0, 2], ['chimney', 6, 2]];
const oldDogRun = stages => EIGHT_FOOT.map(([type, x, y], i) => ({ type, x, y, ...stages[i] }));
/** A context that records the name, place and size of every picture drawn. */
const recorder = () => { const drawn = []; return { drawn, globalAlpha: 1, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, transform() {}, fillRect() {}, strokeRect() {}, drawImage(...args) { drawn.push(args.slice(1).map(n => +n.toFixed(6))); } }; };

test('a class saved with an eight-foot dog-run opens with it laid out at twelve feet, every piece where it had got to, and drawn as one planned today', () => {
  const { world, household } = onTheLand('passage-old-save');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'dog-run' });
  const placement = household.house.placement || { x: world.map.sites[household.homeSiteId].x, y: world.map.sites[household.homeSiteId].y, rotation: 90 };
  // Being raised: the west pen roofed and chinked, the east pen on its fourth course, part way through it, the passage and
  // the east chimney not begun, the west chimney built. And one finished dog-run already standing beside it.
  const done = type => ({ stage: PIECES[type].stages.length, progress: 0 });
  household.house = { plan: 'dog-run', placement, pieces: oldDogRun([done('pen-round'), { stage: 0, progress: 0 }, { stage: 4, progress: 2 }, done('chimney'), { stage: 0, progress: 0 }]) };
  household.completedHouses = [{ plan: 'dog-run', placement: { ...placement, x: placement.x + 0.3 }, pieces: oldDogRun(EIGHT_FOOT.map(([type]) => done(type))) }];
  setImprovement(world, household, 'cabin', 'sound');
  // Without the door it would not open: the eight-foot passage is no longer a plot.
  assert.throws(() => validateWorld(structuredClone(world)), /Something is already built there|between two pens|Invalid completed house/);
  const dir = mkdtempSync(join(tmpdir(), 'texas-passage-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const save = readSave(join(dir, 'save.json'));
    assert.equal(save.saveVersion, 3, 'no save version moved');
    const opened = save.world, back = opened.households['hh-1'];
    validateWorld(opened);
    // Laid out again: the east pen and its chimney half a cell east, everything else where it was, every stage kept.
    assert.deepEqual(back.house.pieces.map(p => [p.type, p.x, p.y, p.stage, p.progress]), [
      ['pen-round', 1, 2, PIECES['pen-round'].stages.length, 0], ['passage', 3, 2, 0, 0], ['pen-round', 4.5, 2, 4, 2], ['chimney', 0, 2, 1, 0], ['chimney', 6.5, 2, 0, 0],
    ]);
    assert.deepEqual(back.completedHouses[0].pieces.map(p => [p.x, p.stage]), [[1, PIECES['pen-round'].stages.length], [3, 1], [4.5, PIECES['pen-round'].stages.length], [0, 1], [6.5, 1]]);
    assert.deepEqual([back.house.placement, back.completedHouses[0].placement], [household.house.placement, household.completedHouses[0].placement], 'both houses stand where they were placed');
    // What the page is sent is a dog-run of today, at those stages, and it is drawn exactly as one.
    const land = projectWorld(opened, 'hh-1', 'student', { includeMap: false }).land;
    const today = PLANS['dog-run'].pieces.map(([type, x, y], i) => [type, x, y, back.house.pieces[i].stage, back.house.pieces[i].progress]);
    assert.deepEqual(land.house.pieces, today);
    assert.deepEqual(houseFootprint(land.house, catalogue, 90), houseFootprint({ pieces: today }, catalogue, 90));
    for (const rotation of [0, 90, 180, 270]) {
      const [a, b] = [recorder(), recorder()];
      drawHousePlot(a, 400, 300, 120, { house: land.house, completedHouses: land.completedHouses }, catalogue, art.drawSprite, art.spriteFrame, { rotation });
      drawHousePlot(b, 400, 300, 120, { house: { pieces: today }, completedHouses: [{ pieces: PLANS['dog-run'].pieces.map(([type, x, y]) => [type, x, y, PIECES[type].stages.length, 0]) }] }, catalogue, art.drawSprite, art.spriteFrame, { rotation });
      assert.ok(a.drawn.length > 8, `${a.drawn.length} pictures drawn at ${rotation}: both houses`);
      assert.deepEqual(a.drawn, b.drawn, `drawn at ${rotation} as a dog-run planned today`);
    }
    // And a class saved after, already at twelve feet, is left as it is.
    const again = structuredClone(back.house);
    assert.equal(widenPassages(again), false);
    assert.deepEqual(again, back.house);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an old free-built passage widens east where there is room, west where there is not, and is left alone where neither fits', () => {
  const piece = (type, x, y) => ({ type, x, y, stage: 0, progress: 0 });
  // East of the passage the chimney would run off the plot: the west pen and the passage go half a cell west instead.
  const west = { pieces: [piece('pen-round', 2, 2), piece('passage', 4, 2), piece('pen-round', 5, 2), piece('chimney', 7, 2), piece('porch', 2, 1)] };
  assert.equal(widenPassages(west), true);
  assert.deepEqual(west.pieces.map(p => p.x), [1.5, 3.5, 5, 7, 1.5], 'the porch goes with its pen');
  assert.equal(planInvalid(west.pieces), null);
  // A pen against each end of the plot's rows and a chimney at the west edge: no half cell either way. Left as it was
  // (`ceiling:` in sim/houseplot.mjs `widenPassages`); no plan is one, and nothing offers the grid.
  const full = { pieces: [piece('chimney', 0, 2), piece('pen-round', 1, 2), piece('passage', 3, 2), piece('pen-round', 4, 2), piece('pen-round', 6, 2)] };
  const before = structuredClone(full);
  assert.equal(widenPassages(full), false);
  assert.deepEqual(full, before);
});

// The woods of the real land: docs/WOODS_AND_BUILDING.md §4, build step 1.
//
// Each eighth of a mile is a stand from LANDFIRE's pre-settlement vegetation; each sixteenth of a mile a patch of one of
// its succession classes, in the shares its model gives; each twenty-one feet at most one tree, of the stand's kinds.
// Nothing is stored but what the grid says. A class made since records the woods and reads its timber from them; a
// class saved before keeps timber by the water.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { groundAlong, landAround, siteFacts } from '../sim/ground.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { stepWorld } from '../sim/world.mjs';
import { groundAt } from '../sim/fields.mjs';
import {
  ecoregionAt, gridStandAt, KINDS, PATCH_MILES, patchAt, patchCover, STANDS, standAt, TREE_MILES, treeById, treesIn,
  timberMilesFrom, WOODS_SOURCE, woodsRule,
} from '../sim/woods.mjs';

// The game's miles from longitude and latitude, as scripts/build-terrain.mjs projects them.
const at = (lon, lat) => ({ x: (lon + 97.470919) * 60.257452, y: (29.490953 - lat) * 68.875199 });
const land = landAround();
const woods = { rule: 'landfire', nearCreek: land.nearCreek };
/** Every patch in a square of this many patches a side round a point. */
const patchesRound = (point, side) => {
  const found = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) found.push(patchAt({ x: point.x + (i - side / 2 + 0.5) * PATCH_MILES, y: point.y + (j - side / 2 + 0.5) * PATCH_MILES }, woods));
  return found;
};

test('the woods stand where the vegetation map puts them: pines at Bastrop, bottomland on the lower Brazos, prairie on the coast', () => {
  assert.equal(gridStandAt(at(-97.23, 30.12)), 'pine', 'the Lost Pines at Bastrop');
  assert.equal(ecoregionAt(at(-97.23, 30.12))?.code, '33e');
  assert.match(ecoregionAt(at(-97.23, 30.12)).name, /Lost Pines/);
  assert.equal(gridStandAt(at(-95.6, 29.1)), 'bottomland', 'the Brazos bottom below Columbia');
  assert.equal(gridStandAt(at(-96.1, 29.8)), 'prairie', 'the prairie at San Felipe');
  assert.equal(gridStandAt(at(-98.84, 29.28)), 'brush', 'thornscrub west of Bexar');
  assert.equal(gridStandAt(at(-96.25, 28.58)), 'water', 'Matagorda Bay');
  assert.equal(gridStandAt({ x: 10000, y: 10000 }), 'none');
  // Every stand the grid holds is one the game knows.
  for (const id of ['prairie', 'post-oak', 'bottomland', 'creek', 'pine', 'live-oak', 'hill-savanna', 'brush', 'marsh', 'water', 'none']) assert.ok(STANDS[id], id);
});

test("a stand is a mosaic of patches in its model's shares, and a creek keeps its timber through the prairie", () => {
  // Post oak savanna (LANDFIRE 15190): open mature 58 in 100 of the land, closed 18.
  // 96 in 100 of the grid cells in this two-and-a-half-mile square west of Seguin are post oak savanna.
  const savanna = at(-97.9, 29.45);
  const patches = patchesRound(savanna, 40).filter(patch => patch.stand === 'post-oak');
  const share = name => patches.filter(patch => patch.class === name).length / patches.length;
  assert.ok(patches.length > 1000, `${patches.length} savanna patches`);
  assert.ok(Math.abs(share('open mature') - 0.58) < 0.05, `open mature ${share('open mature')}`);
  assert.ok(Math.abs(share('closed') - 0.18) < 0.04, `closed ${share('closed')}`);
  // Mostly open ground with thickets in it, as the model has it: not an even band of timber.
  const timber = patches.filter(patch => patchCover(patch) === 'timber').length / patches.length;
  assert.ok(timber > 0.12 && timber < 0.3, `timber ${timber}`);
  // A creek the map draws through prairie is creek timber within a tenth of a mile of it, whatever the grid says.
  const courses = land.nearestWater(at(-96.1, 29.8), info => info.kind === 'creek', 6);
  assert.ok(courses, 'a creek near San Felipe');
  assert.equal(standAt(courses.at, woods), 'creek');
  assert.equal(standAt(courses.at, { rule: 'landfire' }), gridStandAt(courses.at), 'without the water, only the grid');
});

test('every tree is one tree with a stable id, the same however it is asked for, and as many to the acre as its patch', () => {
  const pines = at(-97.23, 30.12);
  const box = { minX: pines.x, minY: pines.y, maxX: pines.x + 0.25, maxY: pines.y + 0.25 };
  const trees = treesIn(box, woods);
  assert.ok(trees.length > 100, `${trees.length} trees on forty acres of the Lost Pines`);
  assert.deepEqual(treesIn(box, woods), trees, 'the same trees every time');
  assert.equal(new Set(trees.map(tree => tree.id)).size, trees.length);
  for (const tree of trees.slice(0, 200)) {
    assert.deepEqual(treeById(tree.id, woods), tree, `${tree.id} asked for alone`);
    assert.ok(tree.x >= box.minX && tree.x <= box.maxX && tree.y >= box.minY && tree.y <= box.maxY);
    assert.equal(tree.logs, KINDS[tree.kind].logs[['pole', 'log', 'large'].indexOf(tree.size)]);
  }
  // Across the edge of a creek's strip too, where the patch and the tree's own spot can lie in different stands.
  const creek = land.nearestWater(at(-96.1, 29.8), info => info.kind === 'creek', 6).at;
  for (const tree of treesIn({ minX: creek.x - 0.15, minY: creek.y - 0.15, maxX: creek.x + 0.15, maxY: creek.y + 0.15 }, woods)) assert.deepEqual(treeById(tree.id, woods), tree, tree.id);
  const kinds = new Set(trees.map(tree => tree.kind));
  assert.ok(kinds.has('loblolly'), 'loblolly pine in the Lost Pines');
  assert.ok(!kinds.has('mesquite') && !kinds.has('live-oak'));
  // Density: a closed mature bottomland patch holds about thirty trees an acre (LANDFIRE 14730: 15 to 30 canopy trees).
  let counted = 0, acres = 0;
  const bottom = at(-95.6, 29.1);
  for (const patch of patchesRound(bottom, 30).filter(p => p.stand === 'bottomland' && p.class === 'closed mature').slice(0, 60)) {
    const square = { minX: patch.px * PATCH_MILES, minY: patch.py * PATCH_MILES, maxX: (patch.px + 1) * PATCH_MILES - 1e-9, maxY: (patch.py + 1) * PATCH_MILES - 1e-9 };
    counted += treesIn(square, woods).length;
    acres += PATCH_MILES * PATCH_MILES * 640;
  }
  assert.ok(acres > 50, `${acres} acres of closed mature bottomland`);
  assert.ok(Math.abs(counted / acres - 30) < 3, `${counted / acres} trees an acre`);
  // No tree where no tree stands, and none too many to hand back at once.
  assert.equal(treeById('t:nonsense', woods), null);
  assert.equal(treesIn({ minX: 0, minY: 0, maxX: 5, maxY: 5 }, woods), null);
  assert.ok(TREE_MILES < PATCH_MILES);
});

test('the kinds follow the country: live oak in the coastal bottoms, pine on the eastern creeks, mesquite no log at all', () => {
  const kindsIn = (point, side = 0.5) => new Set((treesIn({ minX: point.x, minY: point.y, maxX: point.x + side, maxY: point.y + side }, woods) || []).map(tree => tree.kind));
  assert.equal(ecoregionAt(at(-95.6, 29.1))?.code, '34c');
  assert.ok(kindsIn(at(-95.6, 29.1)).has('live-oak'), 'live oak in the bottom near the coast (Holley, pp. 49-50)');
  // A creek through the prairie in the eastern pine country (ecoregion 35f) has loblolly in its timber; one at San Felipe none.
  const eastern = { x: 142.8728, y: -46.1124 }, western = land.nearestWater(at(-96.1, 29.8), info => info.kind === 'creek', 6).at;
  const creekTrees = point => treesIn({ minX: point.x - 0.1, minY: point.y - 0.1, maxX: point.x + 0.1, maxY: point.y + 0.1 }, woods).filter(tree => standAt(tree, woods) === 'creek');
  assert.equal(gridStandAt(eastern), 'prairie');
  assert.match(ecoregionAt(eastern).code, /^35/);
  assert.ok(creekTrees(eastern).some(tree => tree.kind === 'loblolly'), 'pine on the eastern creek');
  assert.ok(creekTrees(western).length > 0 && !creekTrees(western).some(tree => tree.kind === 'loblolly'), 'no pine on the creek at San Felipe');
  const brush = treesIn({ minX: at(-98.84, 29.28).x, minY: at(-98.84, 29.28).y, maxX: at(-98.84, 29.28).x + 0.5, maxY: at(-98.84, 29.28).y + 0.5 }, woods);
  assert.ok(brush.some(tree => tree.kind === 'mesquite'), 'mesquite in the brush');
  assert.ok(brush.filter(tree => tree.kind === 'mesquite').every(tree => tree.logs === 0), 'no mesquite gives a log (Holley, p. 21)');
  assert.equal(KINDS.cottonwood.use, 'poor');
  assert.ok(KINDS.cottonwood.fell < KINDS['post-oak'].fell, 'cottonwood yields easily to the axe (Holley, p. 50)');
});

test('a class made on the real land reads its timber from the woods; one saved before keeps timber by the water; the invented map is untouched', () => {
  const world = createGonzalesWorld('woods-new', 5, { map: 'colonies' });
  assert.equal(world.map.woods, WOODS_SOURCE);
  assert.equal(woodsRule(world), 'landfire');
  // Somewhere near the families the two rules disagree, and each world reads its own.
  const home = world.map.sites[world.households['hh-1'].homeSiteId];
  const old = structuredClone(world);
  delete old.map.woods;
  assert.equal(woodsRule(old), 'rivers');
  let differs = 0;
  for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) {
    const point = { x: home.x + i * 0.2, y: home.y + j * 0.2 };
    const now = groundAt(world, point), before = groundAt(old, point);
    assert.equal(now, (c => c === 'open' ? 'prairie' : c)(land.coverAt(point, 'landfire')));
    assert.equal(before, (c => c === 'open' ? 'prairie' : c)(land.coverAt(point, 'rivers')));
    if (now !== before) differs++;
  }
  assert.ok(differs > 0, 'the woods changed some ground near the family');
  // Every lane and track the new map was made with carries the woods' going.
  for (const route of Object.values(world.map.routes).filter(route => route.kind === 'track')) {
    assert.deepEqual(route.ground, groundAlong(route.points, null, 'landfire'), `${route.id}'s going`);
  }
  // A site the family looks at is told the woods' ground and the distance to the woods' timber; a class saved before, the water's.
  world.status = 'running';
  for (let tick = 0; tick < 200 && world.households['hh-1'].arriving; tick++) stepWorld(world);
  const household = world.households['hh-1'];
  const grant = holdingOf(world, household).bounds;
  let spot = null;
  for (let i = 1; i < 12 && !spot; i++) for (let j = 1; j < 12 && !spot; j++) {
    const point = { x: +(grant.minX + (grant.maxX - grant.minX) * i / 12).toFixed(3), y: +(grant.minY + (grant.maxY - grant.minY) * j / 12).toFixed(3) };
    if (land.coverAt(point, 'landfire') !== land.coverAt(point, 'rivers') && siteFacts(point, grant, 'landfire').can) spot = point;
  }
  assert.ok(spot, 'a place on the holding where the woods and the water disagree');
  const facts = siteFactsFor(world, household, spot);
  assert.equal(facts.ground, land.coverAt(spot, 'landfire'));
  assert.equal(facts.timberMiles, timberMilesFrom(spot, woods));
  const saved = structuredClone(world);
  delete saved.map.woods;
  assert.equal(siteFactsFor(saved, saved.households['hh-1'], spot).ground, land.coverAt(spot, 'rivers'));
  const invented = createGonzalesWorld('woods-invented', 5);
  assert.equal(invented.map.woods, undefined);
  assert.equal(woodsRule(invented), 'invented');
});

// Walking about the homestead as people do (owner, 2026-10-05: "Paths don't seem natural around the house."): the ways go round the
// house and keep off its walls, keep to the family's trodden ways and round its fields, begin and end at the door; people working
// beside somebody walk the way they walk, and go in out of the weather round what stands between; and the page draws every way with
// its corners rounded and every walk at a walking pace. sim/land-paths.mjs, sim/survey.mjs `strollTarget`, sim/shelter.mjs,
// sim/chores.mjs `standBeside`, public/motion.js; docs/LAND_GRANTS.md §10.5.
//
// Every test here was watched failing against the exact mistake it guards (scripts/map-fixes-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld } from '../sim/world.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { planHouse } from '../sim/houses.mjs';
import { PIECES } from '../sim/houseplot.mjs';
import { housesOnLand } from '../sim/house-placement.mjs';
import { PLOT_SIDE, plotsOf, squareOf } from '../sim/fields.mjs';
import { strollTarget } from '../sim/survey.mjs';
import { PERSON_MILES } from '../sim/house-footprint.mjs';
import { doorOf, landRoute, stepTo, treeCellAt, treesInBox, walkBeside, walkLand } from '../sim/land-paths.mjs';
import { GAIT_CEILING, LAND_WALK_MILES_A_SECOND, ProjectionMotion, ROUND_MILES, landWalkMs, roundCorners, walkedFrom } from '../public/motion.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const toSegment = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0; return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t); };
const offLine = (p, points) => Math.min(...points.slice(1).map((b, i) => toSegment(p, points[i], b)));
const inBox = (box, p) => p.x > box.minX && p.x < box.maxX && p.y > box.minY && p.y < box.maxY;
/** Every point a polyline passes, a fortieth of a tree cell apart. */
const along = points => points.slice(1).flatMap((b, i) => { const a = points[i], n = Math.max(1, Math.ceil(distance(a, b) / 0.0001)); return Array.from({ length: n }, (_, k) => ({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n })); });

/** A family on the real land, its site chosen, everybody home, and a house of `plan` standing finished at the site. */
function homestead(seed, plan = 'round-log') {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'], bounds = holdingOf(world, household).bounds;
  const sites = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) sites.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 7).toFixed(2), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 7).toFixed(2) });
  applyAction(world, 'hh-1', { action: 'choose-site', ...sites.find(point => siteFactsFor(world, household, point).can) });
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  for (const one of Object.values(world.households)) one.lesson = { step: 'done' };
  household.improvements.cabin = 'none';
  planHouse(world, household, plan);
  for (const piece of household.house.pieces) piece.stage = PIECES[piece.type].stages.length;
  household.improvements.cabin = 'sound';
  return { world, household, site: world.map.sites[household.homeSiteId], bounds };
}

test('a way round the house goes round it - into a place under it by its front - and never through it, however long the house', () => {
  const { world, household, site } = homestead('land-ways-house', 'dog-run');
  const [house] = housesOnLand(world, household), box = house.footprint;
  const door = doorOf(world, household);
  // From the door to the far side of the house, behind it; and to a place under it, where a big house can stand over the stock's ground.
  const behind = { x: (box.minX + box.maxX) / 2 + 0.01, y: box.minY - 0.03 }, under = { x: box.minX + 0.02, y: (box.minY + box.maxY) / 2 };
  for (const to of [behind, under]) {
    const way = landRoute(world, household, door, to);
    // Into a place under it, the last step is in at the front: the rest of the way is all outside it.
    const outside = inBox(box, to) ? way.slice(0, -1) : way;
    if (inBox(box, to)) assert.ok(way.length >= 3 && way.at(-2).y > box.maxY && Math.abs(way.at(-2).x - to.x) < 0.002, `in at the front: ${JSON.stringify(way)}`);
    const through = along(outside).filter(p => inBox(box, p));
    assert.deepEqual(through, [], `the way to ${JSON.stringify(to)} runs through the house: ${JSON.stringify(way)}`);
  }
  assert.ok(box.maxX - box.minX > 0.2, `a dog-run is a fifth of a mile long as the map draws it (${box.maxX - box.minX})`);
  assert.ok(site, 'the site');
});

test('people keep to the family\'s trodden ways, and walk home along them to the door', () => {
  // A family on open prairie, where a way can turn a corner with nothing near it.
  const { world, household, bounds } = homestead('land-ways-keep-2');
  const door = doorOf(world, household);
  // A way that turns a corner, over open ground with no tree, house or field near it: the straight line cuts the corner off by two
  // fifths, so somebody who counted the way no dearer than its walking pace would cut across.
  const houses = housesOnLand(world, household).map(house => house.footprint), fields = plotsOf(world, household).map(squareOf);
  const starts = [];
  for (let x = bounds.minX + 0.02; x < bounds.maxX - 0.1; x += 0.02) for (let y = bounds.minY + 0.02; y < bounds.maxY - 0.1; y += 0.02) starts.push({ x, y });
  const start = starts.find(from => {
    const box = { minX: from.x - 0.012, maxX: from.x + 0.092, minY: from.y - 0.012, maxY: from.y + 0.092 };
    const clear = other => !(other.minX < box.maxX && box.minX < other.maxX && other.minY < box.maxY && box.minY < other.maxY);
    return !treesInBox(world, box).length && houses.every(clear) && fields.every(clear);
  });
  assert.ok(start, 'no open ground on the land for a way with a corner, so this test checks nothing');
  const corner = { x: start.x + 0.08, y: start.y }, end = { x: start.x + 0.08, y: start.y + 0.08 }, open = true;
  household.paths = [{ id: 'path-1', kind: 'trodden', to: 'test', points: [{ ...start }, corner, end] }];
  const way = landRoute(world, household, end, start);
  const off = along(way).filter(p => offLine(p, household.paths[0].points) > 0.006);
  assert.ok(off.length < along(way).length * 0.1, `${open ? 'over open ground ' : ''}the walk home keeps to the way: ${off.length} of ${along(way).length} points off it, ${JSON.stringify(way)}`);
  // And home is the door of the house, where the ways begin, once there is a house.
  assert.deepEqual(strollTarget(world, household, world.entities[household.principalId], 'yard'), door);
});

test('a way goes round the field, not across the crop, and into the plot it goes to', () => {
  const { world, household } = homestead('land-ways-field');
  const first = plotsOf(world, household).find(plot => plot.id === 'plot-1'), square = squareOf(first);
  // From one side of the first ten acres to the other, just outside them.
  const from = { x: square.minX - 0.01, y: first.y }, to = { x: square.maxX + 0.01, y: first.y };
  const way = landRoute(world, household, from, to);
  const across = along(way).filter(p => inBox({ minX: square.minX + 0.008, maxX: square.maxX - 0.008, minY: square.minY + 0.008, maxY: square.maxY - 0.008 }, p));
  assert.deepEqual(across.length, 0, `the way runs across the crop: ${JSON.stringify(way)}`);
  // Into the plot it goes to, once.
  const into = landRoute(world, household, from, { x: first.x, y: first.y });
  const crossings = along(into).filter((p, i, all) => i && inBox(square, p) !== inBox(square, all[i - 1])).length;
  assert.equal(crossings, 1, `into the plot once: ${JSON.stringify(into)}`);
  assert.ok(PLOT_SIDE > 0.1);
});

test('somebody working beside another walks the way they walk; going in out of the weather is walked, not slid', () => {
  const { world, household } = homestead('land-ways-beside');
  const [lead, helper] = household.members.map(id => world.entities[id]).filter(one => one.kind === 'person');
  const door = doorOf(world, household);
  lead.location = { ...door, siteId: household.homeSiteId };
  helper.location = { x: door.x + 0.004, y: door.y + 0.003, siteId: household.homeSiteId };
  // Somewhere the lead's way bends, so walking it again from beside him would not be the same way.
  const far = Array.from({ length: 64 }, (_, i) => ({ x: door.x + Math.cos(i / 64 * Math.PI * 2) * (0.08 + (i % 4) * 0.04), y: door.y + Math.sin(i / 64 * Math.PI * 2) * (0.08 + (i % 4) * 0.04) }))
    .find(point => landRoute(world, household, door, point).length >= 4);
  assert.ok(far, 'nowhere near the house a way bends, so this test checks nothing');
  world.tick += 1;
  walkLand(world, household, lead, far, 1);
  walkBeside(world, household, helper, lead, { x: 0.004, y: 0.003 });
  assert.ok(helper.walked?.points?.length > 1, 'the helper is drawn walking');
  assert.deepEqual(helper.walked.points.map(p => [+(p.x - 0.004).toFixed(4), +(p.y - 0.003).toFixed(4)]), lead.walked.points.map(p => [+p.x.toFixed(4), +p.y.toFixed(4)]), 'along the way the lead walked, a step to the side');
  // A short step over open ground needs no search, and one past a trunk goes round it.
  const near = { minX: door.x - 0.3, maxX: door.x + 0.3, minY: door.y - 0.3, maxY: door.y + 0.3 };
  const tree = treesInBox(world, near).find(one => !treeCellAt(world, { x: one.x - 0.012, y: one.y }) && !treeCellAt(world, { x: one.x + 0.012, y: one.y }));
  assert.ok(tree, 'no tree near the house to step past, so this test checks nothing');
  const step = landRoute(world, household, { x: tree.x - 0.012, y: tree.y }, { x: tree.x + 0.012, y: tree.y });
  assert.ok(!along(step).slice(40, -40).some(p => treeCellAt(world, p)), `a short step past a tree goes round it: ${JSON.stringify(step)}`);
  // In out of the weather: stepped there, walked round what stands between.
  world.tick += 1;
  const before = { ...helper.location };
  stepTo(world, household, helper, door);
  assert.ok(helper.walked.points.length >= 2 && distance(helper.walked.points[0], before) < 1e-4 && distance(helper.walked.points.at(-1), door) < 1e-4);
});

test('the page draws a way with its corners rounded, within a step of the server\'s line, and a walk about the land at a walking pace', () => {
  const zig = [{ x: 0, y: 0 }, { x: 0.004, y: 0 }, { x: 0.004, y: 0.004 }, { x: 0.008, y: 0.004 }, { x: 0.008, y: 0.008 }, { x: 0.05, y: 0.008 }];
  const round = roundCorners(zig);
  assert.deepEqual([round[0], round.at(-1)], [zig[0], zig.at(-1)], 'it begins and ends where the server\'s way does');
  assert.ok(round.length > zig.length, 'its corners are curves');
  assert.ok(round.every(p => offLine(p, zig) <= ROUND_MILES / 2), 'never further off the server\'s line than half a rounding');
  // No turn in it as sharp as the staircase's right angles.
  const turns = round.slice(1, -1).map((p, i) => { const a = round[i], c = round[i + 2]; const u = Math.atan2(p.y - a.y, p.x - a.x), v = Math.atan2(c.y - p.y, c.x - p.x); return Math.abs(((v - u + 3 * Math.PI) % (2 * Math.PI)) - Math.PI); });
  assert.ok(Math.max(...turns) < Math.PI / 4, `its sharpest turn is ${(Math.max(...turns) * 180 / Math.PI).toFixed(0)} degrees`);
  // A walking pace: a grown person's drawn height, 1.2 of it a second (public/motion.js GAIT_CEILING, sim/house-footprint.mjs PERSON_MILES).
  assert.ok(Math.abs(LAND_WALK_MILES_A_SECOND - GAIT_CEILING * PERSON_MILES) < 1e-12);
  assert.ok(Math.abs(landWalkMs(0.0228, 5000) - 1000) < 1e-6, 'a walk across the yard: a second');
  assert.equal(landWalkMs(1, 5000), 5000, 'a walk out to the far field: the whole tick, no more');
  // ProjectionMotion: a short walk is done before the tick is, a long one takes the tick.
  const motion = new ProjectionMotion();
  const walker = (x, walked = null) => ({ id: 'w', location: { x, y: 0, siteId: 'home' }, ...(walked && { walked }) });
  motion.accept({ sessionId: 's', tickMs: 5000, revision: 1, world: { tick: 1, minute: 0, status: 'running', entities: [walker(0)] } }, 0);
  const short = [{ x: 0, y: 0 }, { x: 0.0228, y: 0 }];
  motion.accept({ sessionId: 's', tickMs: 5000, revision: 2, world: { tick: 2, minute: 20, status: 'running', entities: [walker(0.0228, short)] } }, 1000);
  const at = now => motion.position(walker(0.0228, short), now).x;
  assert.ok(Math.abs(at(1500) - 0.0114) < 1e-6, `half way across in half a second: ${at(1500)}`);
  assert.ok(Math.abs(at(2000) - 0.0228) < 1e-9, 'there in a second');
  assert.equal(motion.walkingShare(walker(0.0228, short), 2001), 1, 'and stood there for the rest of the tick');
  assert.ok(walkedFrom({ location: { x: 0, y: 0 } }, walker(0.0228, short)).way.length >= 2);
});

// The going on the real land: docs/LAND_GRANTS.md §8.3 step 3, docs/COLONIES.md §6 item 3.
//
// Slope, timber, brush and creek crossings slow people, horses and the wagon on the lanes and tracks; the roads are the easy
// going; lanes are laid over the easiest ground and never across a big river; and the invented country and every class saved
// before travel exactly as they did.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { beginTravel, progressTravel, validateWorld } from '../sim/world.mjs';
import { findPath, polylineLength } from '../sim/geography.mjs';
import { CROSSING_MILES, COVER_PACE, groundAlong, landAround, layLane, paceOf, segmentPace, slopePace } from '../sim/ground.mjs';
import { groundLeft, moveOnGround } from '../sim/travel.mjs';

const METRES_PER_MILE = 1609.344;
const colonies = (seed, players = 5) => { const world = createGonzalesWorld(seed, players, { map: 'colonies' }); world.status = 'running'; return world; };
const ticksToArrive = (world, entity) => { let ticks = 0; while (entity.travel && ticks < 10000) { progressTravel(world, entity); ticks++; } return ticks; };

test('uphill, timber, brush and a creek each make a mile take longer, and a wagon feels them most', () => {
  const mile = 1, level = [0, 0, 0, 0, 0];
  const climb = [0.05 * METRES_PER_MILE, 0, 0, 0, 0], descent = [-0.05 * METRES_PER_MILE, 0, 0, 0, 0];
  assert.equal(segmentPace(mile, level, 'foot'), 1, 'a level open mile is a mile');
  assert.ok(segmentPace(mile, climb, 'foot') > 1.15, 'a five-in-a-hundred climb is slower going on foot');
  assert.ok(segmentPace(mile, descent, 'foot') < 1, 'and the same slope down is a little quicker');
  assert.ok(segmentPace(mile, descent, 'wagon') >= 1, 'but a wagon is never quicker downhill: the team holds it back');
  assert.ok(segmentPace(mile, climb, 'wagon') > segmentPace(mile, climb, 'foot'), 'and feels a climb more than a walker');
  assert.equal(slopePace(0.02, 'wagon'), slopePace(0.02, 'foot') ** 2);
  for (const mode of ['foot', 'horse', 'wagon']) {
    assert.equal(segmentPace(mile, [0, 1, 0, 0, 0], mode), COVER_PACE[mode].timber, `${mode} in timber`);
    assert.equal(segmentPace(mile, [0, 0, 1, 0, 0], mode), COVER_PACE[mode].brush, `${mode} in brush`);
    assert.equal(segmentPace(mile, [0, 0, 0, 1, 0], mode), 1 + CROSSING_MILES[mode].creek, `${mode} over a creek`);
    assert.equal(segmentPace(mile, [0, 0, 0, 0, 1], mode), 1 + CROSSING_MILES[mode].river, `${mode} over a lesser river`);
  }
  assert.ok(CROSSING_MILES.wagon.creek > CROSSING_MILES.foot.creek && COVER_PACE.wagon.brush > COVER_PACE.foot.brush, 'the wagon has the worst of the ground');
});

test('a journey with no going moves exactly as every journey always has, and one over hard ground takes longer', () => {
  const points = [{ x: 0, y: 0 }, { x: 1.2, y: 0 }, { x: 1.2, y: 2.3 }, { x: 4, y: 2.3 }];
  const distance = polylineLength(points);
  for (let progress = 0; progress < distance; progress += 0.37) {
    for (const budget of [0.1, 0.65, 1, 2.6, 9]) {
      const moved = moveOnGround(points, undefined, distance, progress, budget);
      assert.equal(moved.progress, Math.min(distance, progress + budget), `from ${progress} by ${budget}`);
      assert.equal(moved.left, Math.max(0, progress + budget - distance), 'and what is left over past the end is the same');
    }
  }
  const road = { points, pace: undefined, distance, progress: 0, speed: 1 };
  const hard = { points, pace: [[0, 2], [1, 2], [2, 2]], distance, progress: 0, speed: 1 };
  const walk = travel => { let ticks = 0; while (travel.progress < travel.distance) { travel.progress = moveOnGround(travel.points, travel.pace, travel.distance, travel.progress, travel.speed).progress; ticks++; } return ticks; };
  assert.equal(groundLeft(hard), distance * 2, 'twice as hard is twice the going left');
  assert.equal(walk(hard), Math.ceil(distance * 2), 'and takes twice the ticks');
  assert.equal(walk(road), Math.ceil(distance));
});

test('on the real land every lane is laid round the worst ground, never across a big river, and carries its going', () => {
  const world = colonies('ground-lanes', 8);
  const lanes = Object.values(world.map.routes).filter(route => world.map.sites[route.to]?.kind === 'homestead');
  assert.equal(lanes.length, 8);
  let bent = 0;
  for (const lane of lanes) {
    assert.equal(lane.ground?.length, lane.points.length - 1, `${lane.id} says what lies along every stretch`);
    const land = landAround({ minX: Math.min(...lane.points.map(p => p.x)) - 1, minY: Math.min(...lane.points.map(p => p.y)) - 1, maxX: Math.max(...lane.points.map(p => p.x)) + 1, maxY: Math.max(...lane.points.map(p => p.y)) + 1 });
    for (let i = 1; i < lane.points.length; i++) assert.equal(land.crossings(lane.points[i - 1], lane.points[i]).barrier, false, `${lane.id} does not cross a big river`);
    // The lane is no harder for a wagon than the straight line, wherever the straight line could be driven at all - within a
    // tenth, because the search reads the ground at its grid points and the stored going reads it every sixteenth of a mile.
    const straight = [lane.points[0], lane.points.at(-1)];
    const cost = (points, ground) => points.slice(1).reduce((sum, b, i) => sum + Math.hypot(b.x - points[i].x, b.y - points[i].y) * segmentPace(Math.hypot(b.x - points[i].x, b.y - points[i].y), ground[i], 'wagon'), 0);
    if (!land.crossings(straight[0], straight[1]).barrier) assert.ok(cost(lane.points, lane.ground) <= cost(straight, groundAlong(straight)) * 1.1, `${lane.id} is no harder going than driving straight`);
    if (lane.points.length > 2) bent++;
  }
  assert.ok(bent > 0, 'and some lanes bend');
  // Across the Guadalupe below Gonzales there is no lane at all; along its own bank there is.
  assert.equal(layLane({ x: -3, y: 2 }, { x: 4, y: 3 }), null, 'no lane is laid across a big river');
  assert.ok(layLane({ x: 3, y: -1 }, { x: 6, y: 2 }), 'while one on the same side is');
  for (const route of Object.values(world.map.routes)) if (route.kind === 'road') assert.equal(route.ground, undefined, 'the roads are the easy going');
});

test('walking up a lane takes longer than its miles would on the road, both ways, and the going reverses with the walker', () => {
  const world = colonies('ground-walk', 8);
  // The family whose lane is hardest going on foot, against its length.
  const extra = each => {
    const lane = Object.values(world.map.routes).find(route => route.to === each.homeSiteId);
    const pace = new Map(paceOf(lane.points, lane.ground, 'foot'));
    return lane.points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - lane.points[i].x, p.y - lane.points[i].y) * ((pace.get(i) || 1) - 1), 0);
  };
  const household = Object.values(world.households).sort((a, b) => extra(b) - extra(a))[0];
  assert.ok(extra(household) > 0.5, `some family has a lane with hard going on it (${extra(household).toFixed(2)} miles more)`);
  const lane = Object.values(world.map.routes).find(route => route.to === household.homeSiteId);
  const inbound = findPath(world.map, lane.from, household.homeSiteId), outbound = findPath(world.map, household.homeSiteId, lane.from);
  assert.deepEqual(outbound.ground, [...inbound.ground].reverse().map(g => [-g[0], g[1], g[2], g[3], g[4]]), 'the climb one way is the descent the other');
  const walker = { id: 'walker', name: 'Walker', kind: 'person', householdId: null, location: { x: world.map.sites[lane.from].x, y: world.map.sites[lane.from].y, siteId: lane.from }, travel: null, health: { condition: 'well' } };
  world.entities.walker = walker;
  beginTravel(world, walker, household.homeSiteId, null, 'visit');
  assert.ok(walker.travel.pace?.length, 'the journey carries its going');
  const expected = Math.ceil(groundLeft(walker.travel) / walker.travel.speed - 1e-9);
  assert.ok(groundLeft(walker.travel) > walker.travel.distance, 'there is more going than miles');
  validateWorld(world);
  assert.ok(expected > Math.ceil(walker.travel.distance / walker.travel.speed), 'enough more that a walker would notice');
  assert.equal(ticksToArrive(world, walker), expected, 'and the walk takes the going, not the miles');
});

test('the invented country has no going at all, and a journey saved before the going validates and travels as it did', () => {
  const world = createGonzalesWorld('ground-invented', 5);
  world.status = 'running';
  assert.ok(Object.values(world.map.routes).every(route => route.ground === undefined), 'no route on the invented map has any');
  assert.ok(Object.values(world.households).every(household => household.choosingSite === undefined), 'and no family chooses a site');
  assert.ok(Object.values(world.entities).every(entity => !entity.travel?.pace), 'and nobody on the road in has any');
  const person = world.entities['hh-1-thomas'];
  const travel = person.travel;
  const before = travel.progress;
  progressTravel(world, person);
  assert.equal(person.travel?.progress ?? travel.distance, Math.min(travel.distance, before + travel.speed), 'a tick is a tick of miles at the wagon\'s pace');
  validateWorld(world);
});

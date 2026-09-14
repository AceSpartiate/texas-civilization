// The way somebody goes: by the road, across country, or across country to the road (sim/ways.mjs, FIC-GONZ-029).
//
// Found in play 2026-09-14: people kept strictly to the roads when it made no sense to. A family's man walked out his lane,
// down the road and up a track to timber a straight ten miles off, twenty-three by the roads.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { beginTravel, stepWorld, travelModesFor, travelRefusal, validateWorld } from '../sim/world.mjs';
import { findPath } from '../sim/geography.mjs';
import { landAround, segmentPace } from '../sim/ground.mjs';
import { OFF_ROAD, WAGON_COVER, WAGON_SHORT, findWay, groundAcross } from '../sim/ways.mjs';
import { MODES, propertyId } from '../sim/travel.mjs';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/** What a way costs in miles of open road, read back from its own points and pace. */
const costOf = way => way.points.slice(1).reduce((sum, b, i) => sum + distance(way.points[i], b) * (way.pace.find(([segment]) => segment === i)?.[1] ?? 1), 0);
/** The stretches of a way that follow no road. */
function acrossStretches(world, way) {
  const onRoad = new Set();
  for (const id of way.routeIds) for (const p of world.map.routes[id].points) onRoad.add(`${p.x},${p.y}`);
  return way.points.slice(1).map((b, i) => [way.points[i], b]).filter(([a, b]) => !(onRoad.has(`${a.x},${a.y}`) && onRoad.has(`${b.x},${b.y}`)));
}
const crosses = (a, b, p, q) => {
  const side = (u, v, w) => Math.sign((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x));
  return side(a, b, p) !== side(a, b, q) && side(p, q, a) !== side(p, q, b);
};

test('somebody on foot or horseback cuts across open country when that is quicker, and never goes slower than the road', () => {
  const world = createSettledWorld('ways-across', 15);
  const places = ['gonzales', 'upper-timber', 'lower-timber', 'ford'];
  let across = 0;
  for (const household of Object.values(world.households)) {
    for (const place of places) {
      const road = findPath(world.map, household.homeSiteId, place);
      for (const mode of ['foot', 'horse', 'wagon']) {
        const way = findWay(world, household.homeSiteId, place, mode);
        assert.ok(way, `${household.homeSiteId} has a way to ${place} ${mode}`);
        const roadCost = road.points.slice(1).reduce((sum, b, i) => sum + distance(road.points[i], b) * segmentPace(distance(road.points[i], b), road.ground?.[i], mode), 0);
        assert.ok(costOf(way) <= roadCost + 1e-6, `${mode} from ${household.homeSiteId} to ${place}: ${costOf(way)} against the road's ${roadCost}`);
        if (way.overland && mode !== 'wagon') across++;
      }
    }
  }
  assert.ok(across >= 20, `only ${across} journeys went across country`);
  // The one found in play: a straight ten miles, not twenty-three round by the roads.
  const timber = findWay(world, 'home-1', 'upper-timber', 'foot'), road = findPath(world.map, 'home-1', 'upper-timber');
  assert.ok(timber.distance < road.distance * 0.6, `${timber.distance} against ${road.distance}`);
  // Across country costs more a mile than the road over the same open ground: the road is not simply abandoned. The
  // invented map is level, so every stretch off the road is paid at the off-road rate at least.
  for (const mode of ['foot', 'horse']) {
    const way = findWay(world, 'home-1', 'upper-timber', mode);
    const off = acrossStretches(world, way).map(([a]) => way.points.findIndex(p => p.x === a.x && p.y === a.y));
    assert.ok(off.length);
    for (const index of off) assert.ok((way.pace.find(([segment]) => segment === index)?.[1] ?? 1) >= OFF_ROAD[mode], `${mode} off the road at road pace`);
  }
});

// ceiling: on the invented map some families' own tracks already cross the Guadalupe (sim/geography.mjs), so a family
// there may reach the west bank without the ford; what is tested is that nobody swims a river across country.
test('a big river is crossed only where a road crosses it, on the invented map and on the real land', () => {
  const invented = createSettledWorld('ways-river', 15);
  const rivers = invented.map.terrain.filter(feature => feature.kind === 'river');
  for (const household of Object.values(invented.households)) {
    for (const mode of ['foot', 'horse']) {
      const way = findWay(invented, household.homeSiteId, 'williams-camp', mode);
      for (const [a, b] of acrossStretches(invented, way)) {
        for (const river of rivers) assert.ok(!river.points.slice(1).some((q, i) => crosses(a, b, river.points[i], q)), `${household.homeSiteId} ${mode} swims the ${river.name}`);
      }
    }
  }
  const real = createGonzalesWorld('ways-real', 15, { map: 'colonies' });
  let checked = 0;
  for (const household of Object.values(real.households)) {
    for (const mode of ['foot', 'horse']) {
      const way = findWay(real, household.homeSiteId, household.settlementId, mode);
      if (!way) continue;
      for (const [a, b] of acrossStretches(real, way)) {
        const land = landAround({ minX: Math.min(a.x, b.x) - 1, minY: Math.min(a.y, b.y) - 1, maxX: Math.max(a.x, b.x) + 1, maxY: Math.max(a.y, b.y) + 1 });
        assert.equal(land.crossings(a, b).barrier, false, `${household.homeSiteId} ${mode} crosses a big river off the road`);
        checked++;
      }
    }
  }
  assert.ok(checked >= 5, `${checked} stretches across country on the real land`);
  // And a line straight over the Guadalupe is no way at all.
  const town = invented.map.sites.gonzales, camp = invented.map.sites['williams-camp'];
  assert.equal(groundAcross(invented, town, camp), null);
});

test('a road is chosen by its going, not only its length: the ox team goes round a timbered road', () => {
  // Two roads from A to B: four miles through timber, or seven and a bit in the open by C. Water rings A, so nobody
  // strikes out across country from it.
  const ring = [{ x: -0.5, y: -0.5 }, { x: 0.5, y: -0.5 }, { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 }, { x: -0.5, y: -0.5 }];
  const world = { map: {
    sites: { a: { id: 'a', x: 0, y: 0 }, b: { id: 'b', x: 4, y: 0 }, c: { id: 'c', x: 2, y: 3 } },
    routes: {
      timbered: { id: 'timbered', from: 'a', to: 'b', points: [{ x: 0, y: 0 }, { x: 4, y: 0 }], ground: [[0, 1, 0, 0, 0]] },
      'open-1': { id: 'open-1', from: 'a', to: 'c', points: [{ x: 0, y: 0 }, { x: 2, y: 3 }] },
      'open-2': { id: 'open-2', from: 'c', to: 'b', points: [{ x: 2, y: 3 }, { x: 4, y: 0 }] },
    },
    terrain: [{ id: 'moat', kind: 'river', points: ring }],
  } };
  assert.deepEqual(findWay(world, 'a', 'b', 'foot').routeIds, ['timbered'], 'on foot the timber is quicker');
  assert.deepEqual(findWay(world, 'a', 'b', 'wagon').routeIds, ['open-1', 'open-2'], 'the ox team goes round');
});

test('the wagon leaves the road only over open ground, so a lane through timber is still worth cutting', () => {
  for (const [world, places] of [[createSettledWorld('ways-wagon', 15), ['gonzales', 'upper-timber', 'lower-timber']], [createGonzalesWorld('ways-wagon-real', 15, { map: 'colonies' }), null]]) {
    let differs = 0;
    for (const household of Object.values(world.households)) {
      for (const place of places || [household.settlementId]) {
        const wagon = findWay(world, household.homeSiteId, place, 'wagon'), foot = findWay(world, household.homeSiteId, place, 'foot');
        for (const [a, b] of acrossStretches(world, wagon)) {
          const ground = groundAcross(world, a, b);
          assert.ok(distance(a, b) <= WAGON_SHORT || ground[1] + ground[2] <= WAGON_COVER, `the wagon from ${household.homeSiteId} crosses ${ground[1] + ground[2]} timber and brush off the road`);
        }
        if (JSON.stringify(wagon.points) !== JSON.stringify(foot.points)) differs++;
      }
    }
    if (places) assert.ok(differs >= 3, `the wagon and the walker went the same way in all but ${differs}`);
  }
});

test('a journey is made the way that was found: the person and the beasts with them go it, at its pace', () => {
  const world = createSettledWorld('ways-journey', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  const person = world.entities[household.members.find(id => world.entities[id].principal)];
  const way = findWay(world, household.homeSiteId, 'upper-timber', 'horse');
  assert.ok(way.overland);
  beginTravel(world, person, 'upper-timber', null, 'visit', 'horse');
  const horse = world.entities[propertyId('hh-1', 'horse')];
  const tail = person.travel.points.slice(-way.points.length);
  assert.deepEqual(tail, way.points, 'the person goes the way found');
  assert.deepEqual(horse.travel.points, way.points, 'and the horse under them');
  assert.ok(Math.abs(person.travel.distance - way.distance) < 0.3);
  assert.deepEqual(horse.travel.pace, person.travel.pace, 'the horse goes at its rider\'s pace');
  let ticks = 0;
  for (; ticks < 200 && person.travel; ticks++) {
    stepWorld(world);
    assert.equal(Boolean(horse.travel), Boolean(person.travel), 'the horse arrives when its rider does');
  }
  validateWorld(world);
  assert.equal(person.location.siteId, 'upper-timber');
  const expected = costOf(way) / MODES.horse.speed;
  assert.ok(Math.abs(ticks - expected) <= 1.5, `${ticks} ticks on the way, ${expected} expected from its going`);
  // And home again from where they stood in the timber, half a mile off its point: that half mile first, then the way.
  const back = findWay(world, 'upper-timber', household.homeSiteId, 'horse');
  person.location = { ...person.location, x: person.location.x + 0.5 };
  beginTravel(world, person, household.homeSiteId, null, 'visit', 'horse');
  assert.deepEqual(person.travel.pace, back.pace.map(([segment, factor]) => [segment + 1, factor]), 'the step in from where they stood comes first');
  let home = 0;
  for (; home < 200 && person.travel; home++) stepWorld(world);
  const homeExpected = (0.5 + costOf(back)) / MODES.horse.speed;
  assert.ok(Math.abs(home - homeExpected) <= 1.5, `${home} ticks home, ${homeExpected} expected`);
  assert.equal(travelModesFor(world, person, 'gonzales').length, 3);
});

test('what the student is told about a journey is about the way it would actually go', () => {
  // A wagon is refused a way over the ford (sim/world.mjs); the refusal and the journey must be reckoned on the same way,
  // or a control would refuse what the world would allow, or offer what it would refuse.
  const world = createSettledWorld('ways-river', 15);
  world.status = 'running';
  const verdicts = new Set();
  for (const household of Object.values(world.households)) {
    const person = world.entities[household.members.find(id => world.entities[id].principal)];
    for (const role of ['ox', 'horse', 'wagon']) world.entities[propertyId(household.id, role)].location = { ...person.location };
    for (const mode of ['foot', 'horse', 'wagon']) {
      const refusal = travelRefusal(world, person, 'williams-camp', mode);
      const offered = travelModesFor(world, person, 'williams-camp').find(entry => entry.id === mode);
      const trial = structuredClone(world);
      let went = true;
      try { beginTravel(trial, trial.entities[person.id], 'williams-camp', null, 'visit', mode); } catch { went = false; }
      assert.equal(refusal === null, went, `${household.homeSiteId} ${mode}: told "${refusal}", and the journey ${went ? 'went' : 'did not'}`);
      assert.equal(offered.can, went, `${household.homeSiteId} ${mode} offered ${offered.can}`);
      verdicts.add(went);
    }
  }
  assert.deepEqual([...verdicts].sort(), [false, true]);
});

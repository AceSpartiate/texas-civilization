// A class on the real map: docs/COLONIES.md §5.2, build step 1.
//
// A world made with `{ map: 'colonies' }` has the real places, roads and rivers, keeps the families near
// Gonzales for now (step 2 deals them across the colonies), plays the Gonzales chapter through to its
// documented end, and survives save and reload. A world made without it is the invented map, unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { findPath } from '../sim/geography.mjs';
import { BARRIER_RIVERS, coloniesMap } from '../sim/colonies-map.mjs';
import { runScenario } from '../sim/headless.mjs';

const colonies = (seed = 'colonies-world', players = 15) => createGonzalesWorld(seed, players, { map: 'colonies' });
const cross = (a, b, c, d) => {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
};

test('a class on the real map has the real places and roads, and a class without it keeps the invented map', () => {
  const world = colonies();
  const built = coloniesMap();
  assert.equal(world.map.source, 'texas-colonies-map');
  for (const id of ['gonzales', 'ford', 'williams-camp', 'san-felipe', 'liberty', 'bexar']) {
    assert.deepEqual([world.map.sites[id].x, world.map.sites[id].y], [built.places[id].x, built.places[id].y], `${id} is where the built map puts it`);
  }
  assert.ok(world.map.terrain.some(feature => feature.kind === 'river' && feature.name === 'Guadalupe River'), 'the real Guadalupe blocks sight and earshot');
  assert.ok(findPath(world.map, 'gonzales', 'liberty'), 'Liberty is reachable by road');
  const invented = createGonzalesWorld('colonies-world', 15);
  assert.equal(invented.map.source, undefined);
  assert.ok(!invented.map.sites.liberty, 'the invented map has no Liberty');
});

test('every family on the real map lives near Gonzales, reaches it by road, and its track wades no big river', () => {
  for (const players of [5, 30]) {
    const world = colonies(`colonies-homes-${players}`, players);
    const rivers = world.map.terrain.filter(feature => feature.kind === 'river' && BARRIER_RIVERS.includes(feature.name));
    for (const household of Object.values(world.households)) {
      const home = world.map.sites[household.homeSiteId];
      const path = findPath(world.map, home.id, 'gonzales');
      assert.ok(path && path.distance < 60, `${home.id} is ${path?.distance.toFixed(1)} road miles from Gonzales`);
      const track = Object.values(world.map.routes).find(route => route.kind === 'track' && route.to === home.id);
      assert.ok(track, `${home.id} has a track to the road`);
      for (const river of rivers) {
        for (let i = 1; i < river.points.length; i++) {
          assert.ok(!cross(track.points[0], track.points[1], river.points[i - 1], river.points[i]), `${home.id}'s track crosses the ${river.name}`);
        }
      }
    }
    validateWorld(world);
  }
});

test('the Gonzales chapter plays to its documented end on the real map', () => {
  const { world, metrics } = runScenario({ seed: 'colonies-chapter', playerCount: 5, strategy: 'help', map: 'colonies' });
  assert.equal(metrics.complete, true, 'the directors reach the end');
  assert.match(metrics.historicalOutcome, /withdraws/, 'Castañeda withdraws, as HIST-GONZ-004 fixes');
  assert.ok(Object.keys(world.participation?.gonzales || {}).length > 0, 'families took part');
});

test('a family can ride from its land by the ford to Castañeda\'s camp on the real roads', () => {
  const world = colonies('colonies-camp', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  for (let tick = 0; tick < 60 && household.arriving; tick++) stepWorld(world);
  const rider = world.entities[household.principalId];
  applyAction(world, household.id, { action: 'travel', entityId: rider.id, destination: 'williams-camp', mode: 'horse' });
  const miles = rider.travel.distance;
  assert.ok(rider.travel.points.some(p => Math.hypot(p.x - world.map.sites.ford.x, p.y - world.map.sites.ford.y) < 0.05), 'the way goes over the ford');
  for (let tick = 0; tick < 200 && rider.travel; tick++) stepWorld(world);
  assert.equal(rider.location.siteId, 'williams-camp', `arrived after ${miles.toFixed(1)} miles`);
});

test('a class on the real map survives save and reload and steps identically after', () => {
  const world = colonies('colonies-save', 8);
  world.status = 'running';
  for (let tick = 0; tick < 30; tick++) stepWorld(world);
  const reloaded = JSON.parse(JSON.stringify(world));
  validateWorld(reloaded);
  stepWorld(world); stepWorld(reloaded);
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded)), JSON.parse(JSON.stringify(world)));
});

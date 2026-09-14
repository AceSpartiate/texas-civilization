// Families dealt across the colonies: docs/COLONIES.md §5.1 and §5.3, build step 2.
//
// Who starts where (one at Gonzales, one at Liberty, the rest by 1834 population), the land each is given, the
// store in each family's own town, and the arrival that says where the family turned off the road.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { findPath } from '../sim/geography.mjs';
import { BARRIER_RIVERS, coloniesMap, dealCounts } from '../sim/colonies-map.mjs';
import { LAND_FROM_TOWN, WATER_WITHIN } from '../sim/colonies-region.mjs';
import { townOf } from '../sim/chores.mjs';

const colonies = (seed, players) => createGonzalesWorld(seed, players, { map: 'colonies' });
const segmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
};
const distanceToCourses = (point, courses) => courses.reduce((best, course) =>
  Math.min(best, course.points.slice(1).reduce((b, p, i) => Math.min(b, segmentDistance(point, course.points[i], p)), Infinity)), Infinity);

test('families are dealt one to Gonzales, one to Liberty, and the rest by 1834 population', () => {
  // The table in docs/COLONIES.md §5.1: San Felipe, Columbia, Matagorda, Mina, Liberty, Gonzales, Victoria.
  const order = ['san-felipe', 'columbia', 'matagorda', 'mina', 'liberty', 'gonzales', 'victoria'];
  for (const [families, expected] of [[5, [1, 1, 1, 0, 1, 1, 0]], [10, [2, 2, 1, 1, 2, 2, 0]], [15, [4, 3, 2, 2, 2, 2, 0]], [20, [5, 4, 3, 2, 3, 3, 0]], [30, [8, 6, 4, 3, 4, 4, 1]]]) {
    const counts = dealCounts(families);
    assert.deepEqual(order.map(id => counts[id]), expected, `${families} families`);
  }
  const world = colonies('deal-counts', 15);
  const dealt = {};
  for (const household of Object.values(world.households)) dealt[household.settlementId] = (dealt[household.settlementId] || 0) + 1;
  assert.deepEqual(dealt, Object.fromEntries(Object.entries(dealCounts(15)).filter(([, n]) => n)), 'the world deals exactly those counts');
});

test('each family has land a few miles from its settlement, by a named watercourse, off the big rivers, with a road it can reach', () => {
  const built = coloniesMap();
  const named = built.watercourses.filter(course => course.name);
  const rivers = built.watercourses.filter(course => BARRIER_RIVERS.includes(course.name));
  for (const [seed, players] of [['deal-land-a', 5], ['deal-land-b', 30]]) {
    const world = colonies(seed, players);
    for (const household of Object.values(world.households)) {
      const home = world.map.sites[household.homeSiteId], town = world.map.sites[household.settlementId];
      assert.equal(home.settlementId, household.settlementId);
      const miles = Math.hypot(home.x - town.x, home.y - town.y);
      assert.ok(miles >= LAND_FROM_TOWN.nearest - 0.01 && miles <= LAND_FROM_TOWN.farthest + 0.01, `${home.id} is ${miles.toFixed(1)} miles from ${town.name}`);
      assert.ok(distanceToCourses(home, named) <= WATER_WITHIN + 0.01, `${home.id} stands by a named watercourse`);
      assert.ok(distanceToCourses(home, rivers) > 0.3, `${home.id} is not on a big river`);
      const path = findPath(world.map, home.id, town.id);
      assert.ok(path, `${home.id} can reach ${town.name} by road`);
    }
    validateWorld(world);
  }
});

test('a family trades in its own town: a store at every settlement with families, with coin for the families near it', () => {
  const world = colonies('deal-store', 15);
  const settled = [...new Set(Object.values(world.households).map(h => h.settlementId))];
  for (const settlementId of settled) {
    const keeper = Object.values(world.entities).find(e => e.deals?.includes('cotton') && e.location.siteId === settlementId);
    assert.ok(keeper, `${settlementId} has a store`);
    const families = Object.values(world.households).filter(h => h.settlementId === settlementId).length;
    assert.equal(keeper.purse, 2 * families, `${settlementId}'s purse is for its ${families} families`);
  }
  // A Liberty family's errand goes to Liberty, not Gonzales, and trades there.
  const household = Object.values(world.households).find(h => h.settlementId === 'liberty');
  assert.equal(townOf(household), 'liberty');
  world.status = 'running';
  for (let tick = 0; tick < 80 && household.arriving; tick++) stepWorld(world);
  const person = world.entities[household.principalId];
  household.resources.food = 20;
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'sell-food' });
  assert.match(person.chore.doing, /on the road to Liberty/);
  assert.equal(person.travel.to, 'liberty');
  for (let tick = 0; tick < 200 && person.chore; tick++) stepWorld(world);
  assert.ok(world.events.some(e => e.householdId === household.id && /traded with Amos Whitcomb at Liberty/.test(e.text)), 'traded with the Liberty storekeeper at Liberty');
});

test('the arrival names where the family turned off the road, and the invented map is as it was', () => {
  const world = colonies('deal-arrival', 5);
  for (const household of Object.values(world.households)) {
    const founding = world.events.find(e => e.type === 'household-founded' && e.householdId === household.id);
    assert.match(founding.text, new RegExp(`turned off the road near ${world.map.sites[household.settlementId].name}`));
  }
  const invented = createGonzalesWorld('deal-arrival', 5);
  for (const household of Object.values(invented.households)) {
    assert.equal(household.settlementId, undefined);
    assert.equal(townOf(household), 'gonzales');
    assert.match(invented.events.find(e => e.type === 'household-founded' && e.householdId === household.id).text, /turned off the road with the wagon/);
  }
  assert.ok(!Object.values(invented.entities).some(e => e.id.startsWith('town-store-')), 'no new stores on the invented map');
  // A family that names a settlement that is not a town is refused.
  world.households['hh-1'].settlementId = 'ford';
  assert.throws(() => validateWorld(world), /settlement that is not there/);
});

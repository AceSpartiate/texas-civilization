import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld, applyAction, validateWorld, WALK_SPEED } from '../sim/world.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { findPath, polylineLength } from '../sim/geography.mjs';

const homesteads = world => Object.values(world.map.sites).filter(site => site.kind === 'homestead');
const roadMiles = (world, from, to) => findPath(world.map, from, to).distance;

test('homesteads are scattered along the country, not laid out on a grid', () => {
  const world = createGonzalesWorld('gonzales-1835', 15);
  const homes = homesteads(world);
  assert.equal(homes.length, 15);

  // HIST-GONZ-009: settlement followed the watercourses, so where a family lives must
  // genuinely differ. A grid places families in shared rows and columns — the six-column
  // layout this replaced gave fifteen homes only six distinct x values and three distinct y.
  const distinct = axis => new Set(homes.map(home => Math.round(home[axis] * 10))).size;
  assert.ok(distinct('x') >= homes.length - 2, `only ${distinct('x')} distinct x positions: still a grid`);
  assert.ok(distinct('y') >= homes.length - 1, `only ${distinct('y')} distinct y positions: still a grid`);
  const sharingARow = homes.filter(home => homes.some(other => other.id !== home.id && Math.abs(other.y - home.y) < 0.05)).length;
  assert.ok(sharingARow <= homes.length / 3, `${sharingARow} homesteads sit in shared rows`);

  const miles = homes.map(home => roadMiles(world, home.id, 'gonzales'));
  assert.ok(Math.min(...miles) >= 1, 'a homestead sits unreasonably close to town');
  assert.ok(Math.max(...miles) <= 40, 'a homestead sits beyond a plausible day of travel');
  assert.ok(Math.max(...miles) / Math.min(...miles) > 2.5, 'distance to town barely varies between families');

  // Neighbours are miles apart, consistent with league-sized holdings (HIST-GONZ-010).
  for (const home of homes) {
    const nearest = Math.min(...homes.filter(other => other.id !== home.id).map(other => Math.hypot(other.x - home.x, other.y - home.y)));
    assert.ok(nearest > 0.4, `${home.id} is on top of its neighbour`);
  }
});

test('the river is a real barrier: the far bank is reachable only through the ford', () => {
  const world = createGonzalesWorld('gonzales-1835', 15);
  const river = world.map.terrain.find(feature => feature.kind === 'river');
  assert.ok(river, 'the Guadalupe must exist as map terrain');

  const town = world.map.sites.gonzales, ford = world.map.sites.ford, camp = world.map.sites['williams-camp'];
  // HIST-GONZ-007: the town stood on the east bank; the Mexican force waited on the west.
  assert.ok(town.x > ford.x, 'Gonzales must lie east of the ford');
  assert.ok(camp.x < ford.x, "Williams's land must lie on the west bank");

  // HIST-GONZ-008: the camp sat about seven miles upriver of the contested ford.
  // Measured along the river, between the points of it nearest the ford and the camp.
  const alongRiver = point => {
    let best = { gap: Infinity, at: 0 }, travelled = 0;
    river.points.slice(1).forEach((b, i) => {
      const a = river.points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
      const f = Math.max(0, Math.min(1, ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / (length * length)));
      const gap = Math.hypot(a.x + (b.x - a.x) * f - point.x, a.y + (b.y - a.y) * f - point.y);
      if (gap < best.gap) best = { gap, at: travelled + length * f };
      travelled += length;
    });
    return best.at;
  };
  const upriver = alongRiver(ford) - alongRiver(camp);
  assert.ok(upriver > 6 && upriver < 8, `battle site should be roughly seven miles upriver, measured ${upriver.toFixed(1)}`);
  assert.ok(camp.y < ford.y, 'upriver is north of the ford');

  for (const home of homesteads(world)) {
    const path = findPath(world.map, home.id, 'williams-camp');
    assert.ok(path, `${home.id} cannot reach the far bank at all`);
    assert.ok(path.routeIds.some(id => world.map.routes[id].kind === 'crossing'), `${home.id} reached the west bank without using the ford`);
  }
});

// Found 2026-09-14: families' tracks ran straight over the Guadalupe to the road, and the bank road from the ford crossed
// the Guadalupe and the San Marcos again, so a family reached Williams's land without the ford and its wagon was not
// refused (sim/world.mjs refuses the wagon only a path through the crossing).
test('no track or bank road crosses a river: the crossing is the one way over, and it crosses the Guadalupe once', () => {
  const crosses = (a, b, p, q) => {
    const side = (u, v, w) => Math.sign((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x));
    return side(a, b, p) !== side(a, b, q) && side(p, q, a) !== side(p, q, b);
  };
  const over = (route, river) => route.points.slice(1).reduce((n, b, i) => n + river.points.slice(1).filter((q, j) => crosses(route.points[i], b, river.points[j], q)).length, 0);
  for (const [seed, count] of [['ways-river', 15], ['gonzales-1835', 15], ['range', 5], ['range', 30], ['full-class', 30]]) {
    const world = createGonzalesWorld(seed, count);
    const rivers = world.map.terrain.filter(feature => feature.kind === 'river');
    for (const route of Object.values(world.map.routes)) {
      for (const river of rivers) {
        const expected = route.kind === 'crossing' && river.id === 'guadalupe' ? 1 : 0;
        assert.equal(over(route, river), expected, `${seed}/${count}: ${route.id} (${route.kind}) crosses the ${river.name} ${over(route, river)} times`);
      }
    }
    for (const home of homesteads(world)) {
      assert.ok(findPath(world.map, home.id, 'williams-camp').routeIds.some(id => world.map.routes[id].kind === 'crossing'), `${seed}/${count}: ${home.id} reaches Williams's land without the crossing`);
    }
  }
});

test('geography is reproducible from the seed and survives validation', () => {
  const a = createGonzalesWorld('repeatable', 12), b = createGonzalesWorld('repeatable', 12);
  assert.deepEqual(a.map, b.map);
  assert.notDeepEqual(createGonzalesWorld('other-seed', 12).map, a.map);
  validateWorld(a);
  for (const count of [5, 30]) validateWorld(createGonzalesWorld('range', count));
});

test('a journey to town stays inside classroom pacing and follows the road', () => {
  const world = createWorld('pacing', 15);
  world.status = 'running';
  const home = homesteads(world).reduce((far, site) => roadMiles(world, site.id, 'gonzales') > roadMiles(world, far.id, 'gonzales') ? site : far);
  const householdId = home.ownerHouseholdId;
  const principal = world.households[householdId].principalId;
  applyAction(world, householdId, { action: 'travel', entityId: principal, destination: 'gonzales' });

  // One tick is twenty minutes and a person covers a mile, so the longest journey in the
  // class must still fit inside a lesson rather than running past the end of the slice.
  const expected = Math.ceil(roadMiles(world, home.id, 'gonzales') / WALK_SPEED);
  assert.ok(expected <= 40, `longest journey takes ${expected} ticks`);

  let ticks = 0;
  while (world.entities[principal].travel && ticks < 60) { stepWorld(world); ticks++; }
  assert.equal(world.entities[principal].location.siteId, 'gonzales');
  assert.ok(Math.abs(ticks - expected) <= 1, `arrived in ${ticks} ticks, expected about ${expected}`);
  // The traveller followed the stored path rather than a straight line across country.
  assert.equal(world.events.filter(event => event.actorId === principal && event.type === 'arrival').length, 1);
});

test('the static map is fetched once, not repeated in every snapshot', async () => {
  const { createClassroom } = await import('../server/app.mjs');
  const app = createClassroom({ playerCount: 15, worldFactory: createGonzalesWorld });
  const port = await app.listen();
  try {
    const join = await fetch(`http://127.0.0.1:${port}/api/join`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Tester', code: app.state.sessionCode }),
    });
    const cookie = join.headers.getSetCookie()[0].split(';')[0];
    const snapshot = await join.json();

    // Ground does not change from tick to tick. Sending it every second cost 75% of a
    // student's payload and over a megabyte a second across a class of thirty.
    assert.equal(snapshot.world.map, undefined, 'the map must not ride along in snapshots');
    assert.equal(snapshot.mapId, app.state.sessionId);
    // A new class's first snapshot is the heaviest a fresh family sends: everybody is on the road
    // in (docs/SETTLING_IN.md step 2), so every person carries a journey and a refusal for each
    // piece of work. About 9.2 KB, and gone once they arrive. The map alone is about 58 KB.
    assert.ok(JSON.stringify(snapshot).length < 10240, `snapshot grew to ${JSON.stringify(snapshot).length} bytes`);

    const map = await (await fetch(`http://127.0.0.1:${port}/api/map`, { headers: { Cookie: cookie } })).json();
    assert.equal(map.mapId, snapshot.mapId);
    assert.ok(Object.keys(map.map.sites).length > 15);
    assert.ok(map.map.relief.values.length > 1000, 'relief must reach the client somewhere');
    assert.ok(map.map.terrain.some(feature => feature.kind === 'river'));

    // Public geography only: a household's private state never travels with the ground.
    const text = JSON.stringify(map);
    assert.ok(!text.includes(app.state.hostKey));
    assert.ok(!/"memories"|"resources"|"knowledge"/.test(text));

    const unauthenticated = await fetch(`http://127.0.0.1:${port}/api/map`);
    assert.equal(unauthenticated.status, 401);
  } finally { await app.close(); }
});

// Land grants: docs/LAND_GRANTS.md step 1.
//
// A labor for a family without stock and a league and a labor with it (HIST-GONZ-036), laid out
// for every family when the world is made and never overlapping; the stock chosen in the lobby at
// a cost in wagon space; said once when the family reaches its land. FIC-GONZ-025.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { LABOR_SIDE, LEAGUE_AND_LABOR_ACRES, HOUSE_CLEARANCE, areaAcres, grantOf, holdingOf, layOutGrants } from '../sim/grants.mjs';
import { STOCK_SPACE, WAGON_SPACE, spaceOf } from '../sim/wagon.mjs';

const land = (world, id = 'hh-1') => projectWorld(world, id, 'student', { includeMap: false }).land;
const stock = (world, value, id = 'hh-1') => applyAction(world, id, { action: 'bring-stock', stock: value });
const overlap = (a, b) => a.minX < b.maxX - 1e-3 && b.minX < a.maxX - 1e-3 && a.minY < b.maxY - 1e-3 && b.minY < a.maxY - 1e-3;
const holds = (rect, point, margin = 0) => point.x >= rect.minX + margin - 1e-3 && point.x <= rect.maxX - margin + 1e-3 && point.y >= rect.minY + margin - 1e-3 && point.y <= rect.maxY - margin + 1e-3;

test('a family without stock holds a labor, and one with stock a league and a labor', () => {
  const world = createGonzalesWorld('grant-sizes', 5);
  const household = world.households['hh-1'];
  const home = world.map.sites[household.homeSiteId];
  const labor = land(world).grant;
  assert.equal(labor.kind, 'labor');
  assert.equal(labor.acres, 177);
  assert.ok(Math.abs(areaAcres(labor.bounds) - 177.1) < 1, 'the bounds are a labor, not just the label');
  assert.ok(holds(labor.bounds, home), 'round the family\'s own house');
  applyAction(world, 'hh-1', { action: 'load-wagon', item: 'provisions', amount: 2 });
  stock(world, true);
  const league = land(world).grant;
  assert.equal(league.kind, 'league-and-labor');
  assert.equal(league.acres, Math.round(LEAGUE_AND_LABOR_ACRES), 'five families are never crowded enough to be squeezed');
  assert.ok(holds(league.bounds, { x: labor.bounds.minX, y: labor.bounds.minY }) && holds(league.bounds, { x: labor.bounds.maxX, y: labor.bounds.maxY }), 'the labor lies inside the grant');
  // Changing its mind moves nobody's land: the grant was marked out before there was any choosing.
  stock(world, false);
  assert.deepEqual(land(world).grant, labor);
});

test('no family\'s grant lies on another\'s, or on another family\'s house, in any size of class', () => {
  for (const players of [5, 10, 20, 30]) {
    for (let seed = 0; seed < 6; seed++) {
      const world = createGonzalesWorld(`grant-layout-${seed}`, players);
      const households = Object.values(world.households);
      const grants = households.map(household => grantOf(world, household));
      for (const [i, household] of households.entries()) {
        const home = world.map.sites[household.homeSiteId];
        assert.ok(holds(grants[i], home, LABOR_SIDE / 2), `${players}/${seed}: ${household.id}'s grant holds a labor round its house`);
        assert.ok(areaAcres(grants[i]) >= 177, `${players}/${seed}: ${household.id} holds at least a labor`);
        // A family without stock holds its labor round its own house, wherever on the grant the house stands.
        assert.ok(holds(holdingOf(world, household).bounds, home, LABOR_SIDE / 2), `${players}/${seed}: ${household.id}'s labor is round its house`);
        for (const [j, other] of households.entries()) {
          if (i === j) continue;
          assert.ok(!overlap(grants[i], grants[j]), `${players}/${seed}: ${household.id} and ${other.id} overlap`);
          assert.ok(!holds(grants[i], world.map.sites[other.homeSiteId], -HOUSE_CLEARANCE + 1e-2), `${players}/${seed}: ${other.id}'s house is on ${household.id}'s grant`);
        }
      }
    }
  }
});

test('grants are fixed when the world is made, the same every time, and take nothing from the seed', () => {
  const a = createGonzalesWorld('grant-fixed', 12), b = createGonzalesWorld('grant-fixed', 12);
  assert.deepEqual(Object.values(a.households).map(h => h.grant), Object.values(b.households).map(h => h.grant));
  assert.deepEqual(layOutGrants(a.map.sites)['home-3'], a.households['hh-3'].grant, 'worked out from the map alone');
  // Laying out grants draws nothing from the world's random stream, so crops and loads are as they were.
  const strip = world => JSON.stringify(Object.values(world.households).map(({ grant, ...rest }) => rest));
  assert.equal(strip(a), strip(b));
});

test('driving stock is chosen in the lobby, costs wagon space, and is refused once the class has begun', () => {
  const world = createGonzalesWorld('grant-stock', 5);
  const household = world.households['hh-1'];
  // Fill the wagon to the last space, so there is no room to feed a herd.
  const barrels = () => household.load.find(entry => entry.id === 'provisions').amount;
  applyAction(world, 'hh-1', { action: 'load-wagon', item: 'provisions', amount: barrels() + WAGON_SPACE - spaceOf(household.load) });
  assert.equal(spaceOf(household.load), WAGON_SPACE);
  assert.throws(() => stock(world, true), new RegExp(`leaves the wagon ${WAGON_SPACE - STOCK_SPACE} spaces, and it is loaded with ${WAGON_SPACE}`));
  assert.equal(land(world).stockChoice.can, true, 'the choice itself is open; this one needs room first');
  // Two barrels out makes room for the herd's keep, exactly.
  applyAction(world, 'hh-1', { action: 'load-wagon', item: 'provisions', amount: barrels() - STOCK_SPACE });
  stock(world, true);
  assert.equal(household.stock, true);
  // With the herd, the wagon has two spaces fewer, and the load screen is told so.
  assert.equal(projectWorld(world, 'hh-1', 'student', { includeMap: false }).wagon.space, WAGON_SPACE - STOCK_SPACE);
  assert.equal(spaceOf(household.load), WAGON_SPACE - STOCK_SPACE);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'load-wagon', item: 'provisions', amount: barrels() + 1 }), /no room.*with the stock to feed/);
  assert.throws(() => stock(world, 'yes'), /yes or no/);
  // The land line says what each answer brings before it is chosen (FIC-GONZ-008).
  assert.deepEqual({ ...land(world).stockChoice }, { can: true, laborAcres: 177, stockAcres: 4606, space: STOCK_SPACE });
  world.status = 'running';
  assert.throws(() => stock(world, false), /class has begun/);
  assert.equal(land(world).stockChoice, undefined, 'nothing to choose once the class runs, and nothing sent for it');
  validateWorld(world);
});

test('the family is told what land is theirs when it reaches it, and that no title has been issued', () => {
  const world = createGonzalesWorld('grant-arrival', 5);
  stock(world, true, 'hh-2');
  world.status = 'running';
  for (let tick = 0; tick < 60 && Object.values(world.households).some(h => h.arriving); tick++) stepWorld(world);
  const arrival = id => world.events.find(event => event.type === 'arrival' && event.householdId === id)?.text;
  assert.match(arrival('hh-1'), /A labor of land, 177 acres, is marked out for the family\. No title has been issued\./);
  assert.doesNotMatch(arrival('hh-1'), /cattle/);
  assert.match(arrival('hh-2'), /The cattle and hogs come in behind the wagon\. A league and a labor of land, 4,606 acres, is marked out/);
});

test('a class saved before grants has the land its map gives, holds a labor, and cannot claim a grant that misses its house', () => {
  const world = createGonzalesWorld('grant-old', 8);
  const household = world.households['hh-4'];
  const stored = household.grant;
  const old = JSON.parse(JSON.stringify(world));
  for (const each of Object.values(old.households)) { delete each.grant; delete each.stock; }
  validateWorld(old);
  assert.deepEqual(grantOf(old, old.households['hh-4']), stored);
  assert.equal(holdingOf(old, old.households['hh-4']).kind, 'labor');
  household.grant = { ...stored, minX: stored.maxX - 0.1 };
  assert.throws(() => validateWorld(world), /hold its own house/);
  household.grant = stored;
  household.stock = 'many';
  assert.throws(() => validateWorld(world), /Invalid stock/);
});

test('houses too close for leagues squeeze a grant, never below a labor and never onto another', () => {
  // Nothing this map makes has needed it (measured: none of 2,000 families in 100 worlds of 5-30), so it is set up by hand.
  // Nine houses 0.9 miles apart in a block: the one in the middle has neighbours on every side.
  const sites = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`home-${i + 1}`, { id: `home-${i + 1}`, kind: 'homestead', x: (i % 3) * 0.9, y: Math.floor(i / 3) * 0.9 }]));
  const grants = layOutGrants(sites);
  const rects = Object.values(grants);
  for (const [i, rect] of rects.entries()) {
    const home = Object.values(sites)[i];
    assert.ok(holds(rect, home, LABOR_SIDE / 2), `${home.id} keeps a labor round its house`);
    for (const other of rects.slice(i + 1)) assert.ok(!overlap(rect, other), 'and nobody lies on anybody');
  }
  assert.ok(rects.some(rect => areaAcres(rect) < LEAGUE_AND_LABOR_ACRES - 1), 'somebody was squeezed');
  assert.ok(areaAcres(grants['home-5']) < LEAGUE_AND_LABOR_ACRES / 2, 'the house in the middle is hemmed in (ceiling: first come, first served)');
});
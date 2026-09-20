// Places and roads on the real map: docs/COLONIES.md §5.2, build step 1.
//
// The built map (public/terrain/colonies-map.json.gz) is checked against the claims it rests on and
// against the real rivers, so a road that wades the Brazos, a ford on the wrong river or a camp on the
// town's own bank cannot pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BARRIER_RIVERS, coloniesMap, startsOf } from '../sim/colonies-map.mjs';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { findPath, polylineLength } from '../sim/geography.mjs';

const map = coloniesMap();
const terrain = realTerrain();
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a, b, c, d) => {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
};
// The graph findPath reads: places as sites, roads as routes.
const graph = { sites: map.places, routes: Object.fromEntries(map.roads.map(road => [road.id, road])) };

test('every place stands at the official coordinates its claim gives', () => {
  for (const [id, lon, lat] of [['gonzales', -97.4524926, 29.5016257], ['san-felipe', -96.1007929, 29.7930093], ['liberty', -94.7954784, 30.057993], ['bexar', -98.4936282, 29.4241219], ['victoria', -97.0035982, 28.8052674], ['nacogdoches', -94.6554874, 31.6035129]]) {
    const expected = milesFrom(terrain, lon, lat);
    assert.ok(distance(map.places[id], expected) < 0.01, `${id} at ${map.places[id].x}, ${map.places[id].y}`);
  }
  assert.deepEqual(startsOf(map).map(place => place.id).sort(), ['columbia', 'gonzales', 'liberty', 'matagorda', 'mina', 'san-felipe', 'victoria']);
  for (const place of Object.values(map.places)) assert.match(place.claimId, /^(HIST|FIC)-/, `${place.id} names its claim`);
});

test('the five towns the research moved stand at their 1835 sites, and Liberty has the roads it really had', () => {
  // HIST-TEX-025: each official point is a later town, measured from the 1835 site by the town research.
  for (const [id, lon, lat, officialLon, officialLat] of [
    ['columbia', -95.64884, 29.14190, -95.6157797, 29.1413578],
    ['goliad', -97.3830, 28.6476, -97.3883265, 28.6683252],
    ['velasco', -95.3001, 28.9419, -95.360495, 28.9619144],
    ['harrisburg', -95.2785, 29.7228, -95.2796581, 29.7182845],
    ['refugio', -97.274887, 28.296482, -97.2752704, 28.3052838],
  ]) {
    assert.ok(distance(map.places[id], milesFrom(terrain, lon, lat)) < 0.01, `${id} is not at its 1835 site: ${map.places[id].x}, ${map.places[id].y}`);
    assert.ok(distance(map.places[id], milesFrom(terrain, officialLon, officialLat)) > 0.3, `${id} is still at the later town`);
    assert.equal(map.places[id].claimId, 'HIST-TEX-025');
  }
  // HIST-TEX-046: Brazoria at Old Town, Market × Main, on the bank; the official point is the modern town inland.
  assert.ok(distance(map.places.brazoria, milesFrom(terrain, -95.56016, 29.05593)) < 0.01, 'Brazoria is not at Old Town');
  assert.ok(distance(map.places.brazoria, milesFrom(terrain, -95.5691126, 29.0444147)) > 0.5, 'Brazoria is still at the modern town');
  assert.equal(map.places.brazoria.claimId, 'HIST-TEX-046');
  // The Atascosito road crossed the Trinity about three miles north of Liberty, not at the town.
  const crossing = map.places['atascosito-crossing'];
  const off = distance(crossing, map.places.liberty);
  assert.ok(off > 2.2 && off < 4, `the Atascosito crossing is ${off.toFixed(2)} miles from Liberty`);
  assert.ok(crossing.y < map.places.liberty.y, 'the Atascosito crossing is not north of Liberty');
  // The Old San Antonio Road's own crossing of the Trinity, Robbins's ferry, was opened 2026-09-19 (HIST-TEX-162): before it the
  // road from Washington to Nacogdoches was dragged 120 miles south to cross at the Atascosito crossing.
  assert.deepEqual(Object.keys(map.crossings).filter(key => key.endsWith(':Trinity River')).sort(), ['atascosito-crossing:Trinity River', 'robbins-ferry:Trinity River']);
  const road = (from, to) => map.roads.find(r => r.from === from && r.to === to);
  for (const [from, to] of [['harrisburg', 'atascosito-crossing'], ['atascosito-crossing', 'liberty'], ['harrisburg', 'lynchburg'], ['lynchburg', 'liberty'], ['liberty', 'nacogdoches']]) {
    assert.ok(road(from, to), `no road from ${from} to ${to}`);
  }
  assert.equal(road('harrisburg', 'liberty'), undefined, 'the Atascosito road still goes straight to Liberty');
  // Brazoria sits on the lower Brazos road (mail route No. 4): Columbia, Brazoria, Velasco.
  assert.ok(road('columbia', 'brazoria') && road('brazoria', 'velasco'));
});

test('no road crosses a big river except at a crossing on that river', () => {
  const crossingsOn = river => Object.values(map.crossings).filter(c => c.river === river);
  let checked = 0;
  for (const road of map.roads) {
    for (const river of BARRIER_RIVERS) {
      const allowed = crossingsOn(river);
      for (const course of terrain.courses.filter(c => c.name === river)) {
        for (let i = 1; i < road.points.length; i++) {
          const a = road.points[i - 1], b = road.points[i];
          for (let j = 1; j < course.points.length; j++) {
            if (!cross(a, b, course.points[j - 1], course.points[j])) continue;
            checked++;
            const where = course.points[j];
            assert.ok(allowed.some(c => distance(c, where) < 0.9), `${road.name} (${road.from} to ${road.to}) crosses the ${river} at ${where.x}, ${where.y}, away from any crossing`);
          }
        }
      }
    }
  }
  assert.ok(checked > 5, `the roads do cross rivers where they should (${checked} crossings seen)`);
});

test('Gonzales is across the Guadalupe from the camp, the ford is at the town, and the camp is seven miles upriver', () => {
  const { gonzales, ford } = map.places, camp = map.places['williams-camp'];
  assert.ok(distance(gonzales, ford) < 0.5, 'the ford is at the town (HIST-GONZ-007)');
  assert.ok(camp.riverMiles > 6 && camp.riverMiles < 8, `about seven miles upriver (HIST-GONZ-008): ${camp.riverMiles}`);
  // A straight line from the town to the camp must cross the Guadalupe: they are on opposite banks.
  const guadalupe = terrain.courses.filter(c => c.name === 'Guadalupe River');
  const crossings = guadalupe.reduce((n, course) => n + course.points.slice(1).filter((p, i) => cross(gonzales, camp, course.points[i], p)).length, 0);
  assert.equal(crossings % 2, 1, 'an odd number of river crossings between the town and the camp');
  // And the way there goes by the ford.
  const path = findPath(graph, 'gonzales', 'williams-camp');
  assert.ok(path && path.points.some(p => distance(p, ford) < 0.05), 'the way to the camp goes by the ford');
});

test('every settlement can be reached by road from Gonzales, by a way no shorter than the crow flies and not absurdly longer', () => {
  for (const place of Object.values(map.places)) {
    // Towns: the forks of the rivers is a landmark nobody takes a road to, and crossings are ways, not destinations.
    if (place.id === 'gonzales' || place.kind !== 'town') continue;
    const path = findPath(graph, 'gonzales', place.id);
    assert.ok(path, `${place.name} is reachable by road`);
    const straight = distance(map.places.gonzales, place);
    assert.ok(path.distance >= straight - 0.01, `${place.name}: road ${path.distance.toFixed(1)} is at least the straight ${straight.toFixed(1)}`);
    if (straight > 20) assert.ok(path.distance < straight * 1.8, `${place.name}: road ${path.distance.toFixed(1)} miles for ${straight.toFixed(1)} as the crow flies`);
  }
  // Béxar lies about seventy miles from Gonzales by road (the Handbook gives no figure; see the exclusion on the distance to Béxar).
  const bexar = findPath(graph, 'gonzales', 'bexar').distance;
  assert.ok(bexar > 60 && bexar < 90, `Gonzales to Béxar ${bexar.toFixed(1)} miles`);
  assert.ok(map.roads.every(road => Math.abs(polylineLength(road.points) - road.miles) < 0.05), 'each road knows its own length');
});

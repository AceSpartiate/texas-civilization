// The rivers and the towns where they are on the land: docs/MAP_ACCURACY.md, HIST-TEX-084 and HIST-TEX-085.
//
// Each town is checked against the documented side of its river and a distance to it, on every line the map draws the
// river with: the colonies map's own watercourses, and the province's finest band (sim/province.mjs). The bands are
// checked to nest, so a river drawn zoomed out lies on the river drawn close up.
import test from 'node:test';
import assert from 'node:assert/strict';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';
import { coloniesProvince, mapBounds, mapForPage, provinceBands } from '../sim/province.mjs';
import { findPath } from '../sim/geography.mjs';

const terrain = realTerrain();
const map = coloniesMap();
// The graph findPath reads: places as sites, roads as routes.
const graph = { sites: map.places, routes: Object.fromEntries(map.roads.map(road => [road.id, road])) };
const province = provinceBands();
const at = (lon, lat) => milesFrom(terrain, lon, lat);
const toPoints = flat => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i] / 100, y: flat[i + 1] / 100 }); return out; };

/** The lines each way of drawing a river gives: the colonies map's watercourses, and the province at a band. */
const drawnLines = name => map.watercourses.filter(course => course.name === name).map(course => course.points);
const bandLines = (name, band) => province.rivers.filter(river => river.name === name && river.levels[band]).map(river => toPoints(river.levels[band]));
function crossings(a, b, lines) {
  const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  let count = 0;
  for (const line of lines) for (let i = 1; i < line.length; i++) {
    const c = line[i - 1], d = line[i];
    if (side(a, b, c) !== side(a, b, d) && side(c, d, a) !== side(c, d, b)) count++;
  }
  return count;
}
function distanceTo(p, lines) {
  let best = Infinity;
  for (const line of lines) for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
    best = Math.min(best, Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t));
  }
  return best;
}
const WAYS = { 'the colonies map': drawnLines, "the province's finest band": name => bandLines(name, 0) };
/** A point `miles` from a place on a compass bearing (0 north, 90 east). */
const toward = (place, bearing, miles) => ({ x: place.x + miles * Math.sin(bearing * Math.PI / 180), y: place.y - miles * Math.cos(bearing * Math.PI / 180) });

/** The point of the drawn lines nearest a place. */
function nearestOn(p, lines) {
  let best = { d: Infinity };
  for (const line of lines) for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
    const q = { x: a.x + dx * t, y: a.y + dy * t }, d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < best.d) best = { d, ...q };
  }
  return best;
}

// [place, river, the bank it stands on as a compass bearing from the river to the town, how far the river may be, source]
const BANKS = [
  ['liberty', 'Trinity River', 90, 2, 'Liberty stands east of the Trinity (TSHA, Liberty, TX)'],
  ['san-felipe', 'Brazos River', 270, 1.5, 'San Felipe de Austin on the west bank of the Brazos (TSHA, San Felipe, TX)'],
  ['washington', 'Brazos River', 270, 0.6, 'Washington on the west bank of the Brazos (TSHA, Washington-on-the-Brazos)'],
  ['mina', 'Colorado River', 90, 0.6, 'Mina (Bastrop) on the east bank of the Colorado (TSHA, Bastrop, TX)'],
  ['victoria', 'Guadalupe River', 90, 1.2, 'Victoria on the east bank of the Guadalupe (TSHA, Victoria, TX)'],
  ['goliad', 'San Antonio River', 180, 0.4, 'La Bahía on the south bank of the San Antonio, the present town across it (HIST-TEX-025)'],
  ['bernardo', 'Brazos River', 90, 1, 'Bernardo, the landing of Groce\'s ferry, on the east bank of the Brazos (TSHA, Groce, Jared Ellison; HIST-TEX-088)'],
];

test('each town stands on its documented bank of its river, near it, on every line the map draws', () => {
  for (const [id, river, bank, within, source] of BANKS) {
    const place = map.places[id];
    for (const [way, lines] of Object.entries(WAYS)) {
      const drawn = lines(river);
      assert.ok(drawn.length, `${river} is drawn by ${way}`);
      const near = nearestOn(place, drawn);
      assert.ok(near.d <= within, `${id}: ${river} is ${near.d.toFixed(2)} miles off by ${way}, no more than ${within} (${source})`);
      // From the nearest point of the river the town lies toward its bank: within ninety degrees of the bearing.
      const facing = { x: Math.sin(bank * Math.PI / 180), y: -Math.cos(bank * Math.PI / 180) };
      assert.ok((place.x - near.x) * facing.x + (place.y - near.y) * facing.y > 0, `${id}: on the wrong bank of the ${river} by ${way} (${source})`);
    }
  }
  // Liberty, the owner's example, by a line straight across: west of the town the Trinity is crossed, east of it never.
  const liberty = map.places.liberty;
  for (const [way, lines] of Object.entries(WAYS)) {
    assert.equal(crossings(liberty, toward(liberty, 270, 3), lines('Trinity River')) % 2, 1, `the Trinity is not west of Liberty by ${way}`);
    assert.equal(crossings(liberty, toward(liberty, 90, 3), lines('Trinity River')), 0, `the Trinity runs east of Liberty by ${way}`);
  }
});

test('the San Antonio River runs between the Alamo and the town of Béxar', () => {
  // The Alamo church, 29.42583, -98.48611 (Wikipedia, Alamo Mission in San Antonio): "just across the San Antonio River
  // from the town of San Antonio de Béxar". Béxar is the map's own point, on Main Plaza.
  const alamo = at(-98.48611, 29.42583), bexar = map.places.bexar;
  assert.ok(alamo.x - bexar.x > 0.3 && alamo.x - bexar.x < 0.7, `the Alamo is ${(alamo.x - bexar.x).toFixed(2)} miles east of Béxar`);
  for (const [way, lines] of Object.entries(WAYS)) {
    const river = lines('San Antonio River');
    assert.equal(crossings(bexar, alamo, river) % 2, 1, `the San Antonio River is not between Béxar and the Alamo by ${way}`);
    assert.ok(distanceTo(bexar, river) < 0.3 && distanceTo(alamo, river) < 0.5, `the river is not beside both by ${way}`);
  }
});

test('Gonzales is across the Guadalupe from Castañeda\'s camp, a short walk from its ford, above the forks', () => {
  const gonzales = map.places.gonzales, camp = map.places['williams-camp'], ford = map.places.ford;
  for (const [way, lines] of Object.entries(WAYS)) {
    const river = lines('Guadalupe River');
    assert.equal(crossings(gonzales, camp, river) % 2, 1, `the Guadalupe is not between Gonzales and the camp by ${way} (HIST-GONZ-008)`);
    assert.ok(distanceTo(ford, river) < 0.06, `the ford is ${distanceTo(ford, river).toFixed(2)} miles off the Guadalupe by ${way} (HIST-GONZ-007)`);
  }
  assert.ok(Math.hypot(gonzales.x - ford.x, gonzales.y - ford.y) < 1, 'the ford is within a mile of the town');
  assert.ok(Math.hypot(gonzales.x, gonzales.y) < 2, 'Gonzales stands within two miles of the forks of the rivers');
});

test('Columbus and Harrisburg stand at their water; Lynchburg at Lynch\'s ferry, where Buffalo Bayou meets the San Jacinto', () => {
  assert.ok(distanceTo(map.places['columbus-crossing'], drawnLines('Colorado River')) < 0.3, "Beeson's crossing is on the Colorado");
  assert.ok(distanceTo(map.places.harrisburg, drawnLines('Buffalo Bayou')) < 0.5, 'Harrisburg is on Buffalo Bayou');
  // Lynch's ferry, 29.76361, -95.08000 (Wikipedia, Lynchburg Ferry): the town stood on the north-east side of the crossing
  // (HIST-TEX-084). The present community at Interstate 10, TSHA's point, is 2.3 miles off it.
  const ferry = at(-95.08, 29.76361), lynchburg = map.places.lynchburg;
  const off = Math.hypot(lynchburg.x - ferry.x, lynchburg.y - ferry.y);
  assert.ok(off < 0.6, `Lynchburg is ${off.toFixed(2)} miles from Lynch's ferry`);
  assert.ok(lynchburg.y < ferry.y && lynchburg.x > ferry.x, 'Lynchburg is on the north-east side of the crossing');
  assert.ok(terrain.heightAt(lynchburg.x, lynchburg.y) >= 0.3, 'Lynchburg stands on dry ground');
});

test('Groce\'s ferry crosses the Brazos from the camp to Bernardo, and it is the only way over the Brazos the map has added', () => {
  const ferry = map.roads.find(road => road.from === 'groces' && road.to === 'bernardo');
  assert.ok(ferry, 'there is no road from Groce\'s to Bernardo');
  // The camp was "a half mile from the ferry" (TSHA, Groce's Ferry): the way over is short, not round by another crossing.
  assert.ok(ferry.miles < 3, `Groce's ferry is ${ferry.miles} miles long`);
  for (const [way, lines] of Object.entries(WAYS)) {
    const brazos = lines('Brazos River');
    const over = ferry.points.slice(1).reduce((n, p, i) => n + crossings(ferry.points[i], p, brazos), 0);
    assert.equal(over % 2, 1, `the ferry from Groce's to Bernardo does not cross the Brazos by ${way}`);
  }
  const opened = map.crossings['bernardo:Brazos River'];
  assert.ok(opened && distanceTo(opened, [ferry.points]) < 0.6, 'the ferry does not go over at the crossing opened for it');
  assert.deepEqual(Object.keys(map.crossings).filter(key => key.endsWith(':Brazos River')).sort(),
    ['bernardo', 'brazoria', 'columbia', 'san-felipe', 'washington'].map(id => `${id}:Brazos River`), 'a way over the Brazos was opened that the record does not give');
});

test('from Groce\'s the road to Harrisburg goes over the ferry by Bernardo, not back through San Felipe (HIST-TEX-088)', () => {
  const path = findPath(graph, 'groces', 'harrisburg');
  const by = path.nodes.map(node => node.id);
  assert.ok(by.includes('bernardo'), `from Groce's to Harrisburg goes by ${by.join(', ')}, not Bernardo`);
  assert.ok(!by.includes('san-felipe'), `from Groce's to Harrisburg goes back by San Felipe: ${by.join(', ')}`);
});

test('the road east from Bernardo goes the army\'s way: Donoho\'s, McCarley\'s, the fork at Roberts\', Burnett\'s (HIST-TEX-088)', () => {
  const road = map.roads.find(r => r.from === 'bernardo' && r.to === 'harrisburg');
  assert.ok(road, 'there is no road from Bernardo to Harrisburg');
  // The markers, from their THC atlas positions converted: the road passes each, in order.
  const stops = [["Donoho's", -96.04354, 30.06361], ["McCarley's", -95.80741, 30.06940], ["Roberts'", -95.76074, 30.07926], ["Burnett's", -95.64829, 29.95433]];
  const along = [0];
  for (let i = 1; i < road.points.length; i++) along.push(along[i - 1] + Math.hypot(road.points[i].x - road.points[i - 1].x, road.points[i].y - road.points[i - 1].y));
  const miles = stops.map(([name, lon, lat]) => {
    const marker = at(lon, lat);
    assert.ok(distanceTo(marker, [road.points]) < 0.4, `the road to Harrisburg passes ${distanceTo(marker, [road.points]).toFixed(2)} miles from ${name}`);
    let nearest = 0;
    road.points.forEach((p, i) => { if (Math.hypot(p.x - marker.x, p.y - marker.y) < Math.hypot(road.points[nearest].x - marker.x, road.points[nearest].y - marker.y)) nearest = i; });
    return along[nearest];
  });
  assert.deepEqual([...miles].sort((a, b) => a - b), miles, 'the road does not pass the stops in the army\'s order');
  // McCarley's "some fifteen miles east of Donoho's" (Barker); Roberts' "about three miles east" of McCarley (THC marker).
  assert.ok(miles[1] - miles[0] > 12 && miles[1] - miles[0] < 18, `Donoho's to McCarley's is ${(miles[1] - miles[0]).toFixed(1)} road miles`);
  assert.ok(miles[2] - miles[1] > 2 && miles[2] - miles[1] < 4, `McCarley's to Roberts' is ${(miles[2] - miles[1]).toFixed(1)} road miles`);
});

test('the province drawn zoomed out is the real one: its towns are the map\'s, and every band lies on the band finer than it', () => {
  const towns = Object.values(map.places).filter(place => place.kind === 'town');
  assert.deepEqual(province.settlements.map(s => [s.id, s.x, s.y]).sort(), towns.map(t => [t.id, t.x, t.y]).sort());
  // The finest band of a river the colonies map draws is that very line.
  for (const name of ['Trinity River', 'Brazos River', 'San Antonio River', 'Guadalupe River']) {
    const finest = bandLines(name, 0).map(line => JSON.stringify(line)).sort();
    assert.deepEqual(finest, drawnLines(name).filter(line => line.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - line[i].x, p.y - line[i].y), 0) >= 0.1).map(line => JSON.stringify(line)).sort(), `${name}: the province's finest band is not the colonies map's line`);
  }
  // Nesting: every point of a coarser band is a point of the finer band, and every point of the finer band is within the
  // coarser band's tolerance (and rounding) of the coarser line.
  const key = (flat, i) => `${flat[i]},${flat[i + 1]}`;
  for (const river of province.rivers) {
    for (let band = 1; band < province.bands.length; band++) {
      const fine = river.levels[band - 1], coarse = river.levels[band];
      if (!coarse || !fine) continue;
      const fineKeys = new Set(); for (let i = 0; i < fine.length; i += 2) fineKeys.add(key(fine, i));
      for (let i = 0; i < coarse.length; i += 2) assert.ok(fineKeys.has(key(coarse, i)), `${river.id} band ${band}: a point not on band ${band - 1}`);
      const coarseLine = toPoints(coarse);
      for (const p of toPoints(fine)) assert.ok(distanceTo(p, [coarseLine]) <= province.bands[band] + 0.02, `${river.id} band ${band} strays from band ${band - 1}`);
    }
  }
});

test('the page is sent the real province for a class on the real land, saved with the invented one or not', () => {
  const saved = { source: 'texas-colonies-map', sites: {}, province: { rivers: [{ name: 'Trinity River', points: [{ x: 262, y: -14 }] }] }, bounds: { minX: -340, maxX: 400, minY: -310, maxY: 200 } };
  const sent = mapForPage(saved);
  assert.equal(sent.province, coloniesProvince());
  // The camera's reach is the whole map, out to the Sabine and the Rio Grande (2026-09-18, tests/map-outside.test.mjs); the
  // province's own bounds stay the box's, where its data is.
  assert.deepEqual(sent.bounds, mapBounds());
  assert.deepEqual(coloniesProvince().bounds, province.bounds);
  // The invented Gonzales country keeps its own.
  const invented = { sites: {}, province: { rivers: [] } };
  assert.equal(mapForPage(invented), invented);
  // What an older page draws: the Trinity passing west of Liberty, the San Antonio between Béxar and the Alamo.
  const classic = coloniesProvince();
  const trinity = classic.rivers.filter(river => river.name === 'Trinity River').map(river => river.points);
  const liberty = map.places.liberty;
  assert.equal(crossings(liberty, toward(liberty, 270, 3.5), trinity) % 2, 1, 'the classic Trinity is not west of Liberty');
  assert.equal(crossings(liberty, toward(liberty, 90, 3.5), trinity), 0, 'the classic Trinity is east of Liberty');
  const sanAntonio = classic.rivers.filter(river => river.name === 'San Antonio River').map(river => river.points);
  assert.equal(crossings(map.places.bexar, at(-98.48611, 29.42583), sanAntonio) % 2, 1, 'the classic San Antonio is not between Béxar and the Alamo');
  assert.ok(classic.coast.length > 20 && classic.coast[0].x > classic.coast.at(-1).x, 'the coast runs east to west for the page to fill below it');
});

// Builds the places, crossings and roads of the settled colonies on the real terrain:
// docs/COLONIES.md §5.2, build step 1.
//
//   node scripts/build-colonies-map.mjs
//
// Reads public/terrain (scripts/build-terrain.mjs) and writes public/terrain/colonies-map.json.gz.
// Deterministic and seed-free: every class uses the same places and roads, so the expensive
// routing happens once, here, and never when a world is made.
//
// What is documented and what is not:
//   - Settlement positions are the official coordinates of the present places (HIST-TEX-010, HIST-TEX-013), except five
//     that the town research (docs/town-research/, HIST-TEX-025) found standing on a later town: Columbia, Goliad, Velasco,
//     Harrisburg and Refugio are at their 1835 sites.
//     The Colorado crossings near La Grange (the La Bahía road, HIST-TEX-008) and at Columbus use those
//     towns' official coordinates too (GNIS 1360798 and 1333156).
//   - Which settlements a road joins follows the routes of HIST-TEX-008 and the traffic of HIST-TEX-006.
//   - **Every road course is invented** (FIC-GONZ-027): no surveyed 1835 course was found, so each is the
//     least-effort line over the real ground between its places, crossing the big rivers only at a crossing. A road the
//     record walks stop by stop (the army's from Bernardo, HIST-TEX-088) goes by each stop, leg by leg.
//   - Gonzales's ford is the point of the Guadalupe nearest the town (HIST-GONZ-007); Castañeda's camp is
//     about seven miles upriver of it on the far bank (HIST-GONZ-008), measured along the real river.
//   - Every place a road meets drawn water is a ford, a ferry or a bridge (2026-09-19, docs/MAP_ACCURACY.md §10): the record's
//     crossing where there is one (HIST-TEX-140 to -155), else the game's (FIC-GONZ-090, -091).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { joinReaches } from './terrain/lines.mjs';
import { BEXAR_LAYOUT, bexarToSite } from '../public/bexar-layout.js';

const terrain = realTerrain();
const { header, heights } = terrain;
const { minX, minY, columns, rows, cell, noData } = header.grid;
const METRES_PER_MILE = 1609.344;
const round = value => { const fixed = +value.toFixed(2); return fixed === 0 ? 0 : fixed; };
const at = (lon, lat) => milesFrom(terrain, lon, lat);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ---- Places ---------------------------------------------------------------------------------
// [id, name, kind, lon, lat, claim]. Starts are the colony settlements of docs/COLONIES.md §5.1.
const PLACES = [
  ['gonzales', 'Gonzales', 'town', -97.4524926, 29.5016257, 'HIST-TEX-010', true],
  ['san-felipe', 'San Felipe de Austin', 'town', -96.1007929, 29.7930093, 'HIST-TEX-010', true],
  // West Columbia, where every 1835 letter datelined Columbia was written; the official point is East Columbia (HIST-TEX-025).
  ['columbia', 'Columbia', 'town', -95.64884, 29.14190, 'HIST-TEX-025', true],
  ['matagorda', 'Matagorda', 'town', -95.9674625, 28.6908222, 'HIST-TEX-010', true],
  ['mina', 'Mina', 'town', -97.3152701, 30.1104947, 'HIST-TEX-010', true],
  ['liberty', 'Liberty', 'town', -94.7954784, 30.057993, 'HIST-TEX-013', true],
  ['victoria', 'Victoria', 'town', -97.0035982, 28.8052674, 'HIST-TEX-010', true],
  ['washington', 'Washington', 'town', -96.1566258, 30.3252093, 'HIST-TEX-010', false],
  // Old Town Brazoria, Market × Main, where the 1835 town stood on the bank; the official point is the modern town, about
  // a mile inland (HIST-TEX-046).
  ['brazoria', 'Brazoria', 'town', -95.56016, 29.05593, 'HIST-TEX-046', false],
  // Old Velasco at the old river mouth (Surfside Beach); the official point is the 1891 town in Freeport (HIST-TEX-025).
  ['velasco', 'Velasco', 'town', -95.3001, 28.9419, 'HIST-TEX-025', false],
  // The bayou-front blocks of the 1826 plat (Broadway and Cypress), about 2,400 ft north of the official point (HIST-TEX-025).
  ['harrisburg', 'Harrisburg', 'town', -95.2785, 29.7228, 'HIST-TEX-025', false],
  // Lynchburg, at the mouth of Buffalo Bayou on the east bank of the San Jacinto, by Lynch's ferry (HIST-TEX-025, HIST-TEX-084):
  // the ground a quarter mile north-east of the present ferry landing. The TSHA point, 29.78717, -95.05549, is the present
  // community at Interstate 10, 2.3 miles off and a mile and more from either water (docs/MAP_ACCURACY.md).
  ['lynchburg', 'Lynchburg', 'town', -95.0740, 29.7690, 'HIST-TEX-084', false],
  ['anahuac', 'Anahuac', 'town', -94.6826961, 29.7730001, 'HIST-TEX-010', false],
  ['nacogdoches', 'Nacogdoches', 'town', -94.6554874, 31.6035129, 'HIST-TEX-010', false],
  ['bexar', 'Béxar', 'town', -98.4936282, 29.4241219, 'HIST-TEX-010', false],
  // The 1835 settlement stood against the presidio walls; the present town is across the river, 1.46 miles off (HIST-TEX-025).
  ['goliad', 'Goliad', 'town', -97.3830, 28.6476, 'HIST-TEX-025', false],
  // The plaza of the 1834 plat (King Park); the official point is 0.61 miles north of it (HIST-TEX-025).
  ['refugio', 'Refugio', 'town', -97.274887, 28.296482, 'HIST-TEX-025', false],
  ['la-grange-crossing', 'The Colorado crossing', 'crossing', -96.876647, 29.9055033, 'HIST-TEX-008', false],
  // Beeson's: the 1993 marker "Beason's (Beeson's) Crossing" in Beason's Park - "Sam Houston's Army, camped on the east bank
  // of the Colorado River opposite Beason's crossing" (HIST-TEX-157). The town's official point, 0.31 miles north-west, is on
  // the Gonzales side of the river the map draws, and the army camped over the water from it.
  ['columbus-crossing', "Beeson's crossing", 'crossing', -96.5352167, 29.7043667, 'HIST-TEX-157', false],
  // The Atascosito road's own crossing of the Colorado, nine miles below Columbus: 29°40' N, 96°27' W (TSHA, HIST-TEX-156).
  ['lower-colorado-crossing', 'The lower Colorado crossing', 'ford', -96.45, 29.6666667, 'HIST-TEX-156', false],
  // Robbins's ferry, the Old San Antonio Road's crossing of the Trinity: the 1936 marker on the west bank (HIST-TEX-162).
  ['robbins-ferry', "Robbins's ferry", 'ferry', -95.701596, 31.074923, 'HIST-TEX-162', false],
  // Houston's camp west of the Brazos opposite Groce's plantation, March 30 - April 12, 1836: the 1990 THC marker "Sam Houston's
  // Camp West of the Brazos", Austin County (UTM 14 779049 E 3324235 N, converted). A marker, not a surveyed campsite; the
  // river has moved since (HIST-TEX-086).
  ['groces', "Groce's", 'landing', -96.10685, 30.01736, 'HIST-TEX-086', false],
  // Bernardo, Groce's plantation and the landing of his ferry on the east bank, four miles south of Hempstead (TSHA), where
  // the Yellow Stone put the army across on April 12-13, 1836: the 1936 marker "Site of Groce's Ferry", FM 1887, Waller
  // County (UTM 14 781265 E 3325403 N, converted). A marker, not the landing; "the River has since changed its course" (HIST-TEX-088).
  ['bernardo', 'Bernardo', 'landing', -96.08359, 30.02738, 'HIST-TEX-088', false],
  // The army's four nights on the march east, April 14-17, 1836 (HIST-TEX-088): each a settler's house on the
  // road to Harrisburg, stood at its marker, which says where the house was, not the camp ("in this vicinity", "settled south
  // of here"). A farmstead is a place on the road - a family can be sent there - with nothing to buy and nobody's land.
  ['donohos', "Donoho's", 'farmstead', -96.04354, 30.06361, 'HIST-TEX-088', false], // 1936 marker "In This Vicinity Plantation of Charles Donoho", UTM 14 785025 E 3329520 N
  ['mccarleys', "McCarley's", 'farmstead', -95.80741, 30.06940, 'HIST-TEX-088', false], // 1993 marker "Samuel McCarley Homesite", UTM 15 229366 E 3329799 N
  ['roberts', "Roberts'", 'farmstead', -95.76074, 30.07926, 'HIST-TEX-088', false], // 1993 marker "Abraham Roberts Homesite", UTM 15 233893 E 3330783 N
  ['burnetts', "Burnett's", 'farmstead', -95.64829, 29.95433, 'HIST-TEX-088', false], // 1993 marker "Matthew Burnett Homesite", UTM 15 244416 E 3316675 N
];

// The rivers a road may cross only at a crossing, and the places where each may be crossed.
const BARRIERS = ['Guadalupe River', 'Colorado River', 'Brazos River', 'Trinity River', 'San Antonio River'];
const CROSSINGS = {
  'Guadalupe River': ['ford', 'victoria'],
  'Colorado River': ['la-grange-crossing', 'columbus-crossing', 'lower-colorado-crossing', 'mina', 'matagorda'],
  // Groce's ferry, from the camp to Bernardo: the river nearest the ferry's marker on the east bank (HIST-TEX-088).
  'Brazos River': ['san-felipe', 'washington', 'columbia', 'brazoria', 'bernardo'],
  // The Atascosito road crossed about three miles north of Liberty, not at the town (HIST-TEX-025); the Old San Antonio Road
  // crossed 120 miles above it at Robbins's ferry, which until 2026-09-19 the map had no window for, so the road to
  // Nacogdoches was dragged the length of the Trinity to cross at the Atascosito crossing (HIST-TEX-162).
  'Trinity River': ['atascosito-crossing', 'robbins-ferry'],
  'San Antonio River': ['goliad', 'bexar'],
};
// Watercourses that slow a road across them but are not barriers. Where the record gives a road's crossing of one - Lynch's
// ferry on the San Jacinto, the Harrisburg ferry on Buffalo Bayou (HISTORIC_CROSSINGS below, 2026-09-19) - the road goes over
// there. ceiling: everywhere else a road still crosses wherever the ground is easiest, and the ford or ferry is where it does
// (FIC-GONZ-090); the Lavaca, the Navidad and the San Bernard crossings of 1835 were not found.
const SLOW_WATER = ['San Marcos River', 'Lavaca River', 'Navidad River', 'San Bernard River', 'San Jacinto River', 'Navasota River', 'Buffalo Bayou', 'Peach Creek', 'Sandies Creek', 'Cibolo Creek', 'Plum Creek'];

// The roads: which places each joins (HIST-TEX-006, HIST-TEX-008; courses FIC-GONZ-027).
const ROADS = [
  ['gonzales', 'la-grange-crossing', 'The road to the Colorado'],
  ['la-grange-crossing', 'san-felipe', 'The road to San Felipe'],
  ['washington', 'la-grange-crossing', 'The La Bahía road'],
  ['la-grange-crossing', 'goliad', 'The La Bahía road'],
  ['goliad', 'victoria', 'The Atascosito road'],
  // The road ran "from Refugio and Goliad to the Atascosito Crossing on the Colorado River, on to the Brazos near San Felipe
  // de Austin" (TSHA, HIST-TEX-156): over the Colorado nine miles below Columbus, not at Beeson's.
  ['victoria', 'lower-colorado-crossing', 'The Atascosito road'],
  ['lower-colorado-crossing', 'san-felipe', 'The Atascosito road'],
  // Mail route 13 of 1835 ran "San Felipe, by Beason's and Daniel's, to Gonzales" (Holley, HIST-TEX-146): the way Houston's
  // army took from Beeson's to San Felipe on March 26-28, 1836.
  ['columbus-crossing', 'san-felipe', "The mail road by Beeson's"],
  ['san-felipe', 'harrisburg', 'The Atascosito road'],
  ['harrisburg', 'atascosito-crossing', 'The Atascosito road'],
  ['atascosito-crossing', 'liberty', 'The Atascosito road'],
  // Mail route No. 5 ran San Felipe - Hunter's - Harrisburg - Lynchburg - Liberty (HIST-TEX-025). ceiling: Hunter's has no
  // position in anything read, so the road from San Felipe does not stop there; and the mail road's own Trinity crossing is
  // unknown, so it crosses at the Atascosito crossing like the other road.
  ['harrisburg', 'lynchburg', 'The mail road to Liberty'],
  ['lynchburg', 'liberty', 'The mail road to Liberty'],
  // The road that actually ran through Liberty, north up the east side of the Trinity to Nacogdoches (HIST-TEX-025).
  ['liberty', 'nacogdoches', 'The Liberty-Nacogdoches road'],
  ['ford', 'bexar', 'The road to Béxar'],
  ['gonzales', 'victoria', 'The road to Victoria'],
  ['san-felipe', 'columbia', 'The road to Columbia'],
  ['columbia', 'brazoria', 'The road to Brazoria'],
  ['brazoria', 'velasco', 'The road to Velasco'],
  ['columbia', 'matagorda', 'The road to Matagorda'],
  ['san-felipe', 'mina', 'The road to Mina'],
  ['san-felipe', 'washington', 'The road to Washington'],
  ['washington', 'nacogdoches', 'The road to Nacogdoches'],
  ['liberty', 'anahuac', 'The road to Anahuac'],
  ['goliad', 'refugio', 'The road to Refugio'],
  // Matagorda's volunteers were sent west to rendezvous at James Kerr's on the Lavaca (HIST-TEX-006), so the coast
  // had a way west that did not go round by San Felipe. Its course and its end at Victoria are FIC-GONZ-027.
  ['matagorda', 'victoria', 'The road through the Lavaca country'],
  // Men from the Colorado fought at Gonzales on October 2 (Fisher, HIST-TEX-007): the upper Colorado had a way there. FIC-GONZ-027.
  ['mina', 'gonzales', 'The road to Gonzales from the Colorado'],
  // "The road which led from Beeson's Crossing to Gonzales", where the scouts met the Mexican scouts west of the Navidad in
  // March 1836 (HIST-TEX-087). Houston's army did not take it: it went by Burnam's and down the east bank. Course FIC-GONZ-027.
  ['gonzales', 'columbus-crossing', "The road to Beeson's"],
  // The army marched up the west bank from San Felipe - six miles to Mill Creek, nine more to opposite Bernardo (HIST-TEX-086).
  // Course FIC-GONZ-027.
  ['san-felipe', 'groces', "The road up the Brazos to Groce's"],
  // Groce's ferry, which the army crossed on the steamboat Yellow Stone, April 12-13, 1836 (HIST-TEX-088). A road, not a ford:
  // it took the wagons, their ox teams and some two hundred horses over (Barker).
  ['groces', 'bernardo', "Groce's ferry"],
  // The army's march east, April 14-18, 1836 (HIST-TEX-088): Donoho's "a few miles east of Groce's", McCarley's on Spring Creek
  // "some fifteen miles east of Donoho's" (Barker), the fork at Roberts' three miles on, Burnett's on Cypress Creek, and on
  // "opposite Harrisburg". Places since 2026-09-18, where the army camps each night (sim/houston.mjs); the road is laid leg by
  // leg from one to the next, each leg's course FIC-GONZ-027. ceiling: the fork's other road, to the Trinity at Robbins'
  // ferry, is not on the map; the left-hand road the men may call for goes nowhere a family can follow.
  ['bernardo', 'donohos', 'The road to Harrisburg'],
  ['donohos', 'mccarleys', 'The road to Harrisburg'],
  ['mccarleys', 'roberts', 'The road to Harrisburg'],
  ['roberts', 'burnetts', 'The road to Harrisburg'],
  ['burnetts', 'harrisburg', 'The road to Harrisburg'],
];

// ---- Grid helpers ---------------------------------------------------------------------------
const cellOf = p => {
  const column = Math.floor((p.x - minX) / cell), row = Math.floor((p.y - minY) / cell);
  return column < 0 || row < 0 || column >= columns || row >= rows ? -1 : row * columns + column;
};
const centreOf = index => ({ x: minX + (index % columns + 0.5) * cell, y: minY + (Math.floor(index / columns) + 0.5) * cell });

/** Mark every cell a polyline passes through, four-connected so nothing slips through a corner. */
function rasterise(points, mark) {
  for (let i = 1; i < points.length; i++) {
    let c0 = Math.floor((points[i - 1].x - minX) / cell), r0 = Math.floor((points[i - 1].y - minY) / cell);
    const c1 = Math.floor((points[i].x - minX) / cell), r1 = Math.floor((points[i].y - minY) / cell);
    const stepC = Math.sign(c1 - c0), stepR = Math.sign(r1 - r0);
    let guard = 0;
    while (guard++ < 100000) {
      if (c0 >= 0 && r0 >= 0 && c0 < columns && r0 < rows) mark(r0 * columns + c0);
      if (c0 === c1 && r0 === r1) break;
      // Step along whichever axis keeps closer to the true line.
      const dx = points[i].x - points[i - 1].x, dy = points[i].y - points[i - 1].y;
      const cx = minX + (c0 + 0.5 + stepC) * cell, ry = minY + (r0 + 0.5 + stepR) * cell;
      const offC = stepC ? Math.abs((cx - points[i - 1].x) * dy - (minY + (r0 + 0.5) * cell - points[i - 1].y) * dx) : Infinity;
      const offR = stepR ? Math.abs((minX + (c0 + 0.5) * cell - points[i - 1].x) * dy - (ry - points[i - 1].y) * dx) : Infinity;
      if (c0 !== c1 && (offC <= offR || r0 === r1)) c0 += stepC; else r0 += stepR;
    }
  }
}

const BLOCKED = 1, SLOW = 2, CREEK = 3, SEA = 4;
const water = new Uint8Array(columns * rows);
// Bays and the open water behind the barrier islands are in the elevation data at sea level, not as no-data,
// and a river that ends in a bay could otherwise be walked round across it. Ground under thirty centimetres is water here.
for (let index = 0; index < heights.length; index++) if (heights[index] !== noData && heights[index] < 3) water[index] = SEA;
for (const course of terrain.courses) {
  if (BARRIERS.includes(course.name)) rasterise(course.points, index => { water[index] = BLOCKED; });
}
// Each big river's line breaks once or twice where a modern dam or reservoir interrupts the data (the Guadalupe at
// New Braunfels, the Colorado at Austin). A barrier with a gap is no barrier, so a river's own loose ends within a
// mile of each other are joined.
for (const name of BARRIERS) {
  const lines = terrain.courses.filter(c => c.name === name && c.points.length > 1);
  const loose = [];
  for (const c of lines) {
    for (const [end, isStart] of [[c.points[0], true], [c.points.at(-1), false]]) {
      const joined = lines.some(o => o !== c && distance(isStart ? o.points.at(-1) : o.points[0], end) < 0.05);
      if (!joined) loose.push(end);
    }
  }
  for (let i = 0; i < loose.length; i++) for (let j = i + 1; j < loose.length; j++) {
    if (distance(loose[i], loose[j]) < 1) rasterise([loose[i], loose[j]], index => { water[index] = BLOCKED; });
  }
  // A river that enters from beyond the map starts just inside its edge: carry it out to the edge, or the land
  // could be walked round its end.
  const maxX = minX + columns * cell, maxY = minY + rows * cell;
  for (const end of loose) {
    const toEdge = [[end.x - minX, { x: minX + cell / 2, y: end.y }], [maxX - end.x, { x: maxX - cell / 2, y: end.y }], [end.y - minY, { x: end.x, y: minY + cell / 2 }], [maxY - end.y, { x: end.x, y: maxY - cell / 2 }]]
      .sort((a, b) => a[0] - b[0])[0];
    if (toEdge[0] < 2) rasterise([end, toEdge[1]], index => { water[index] = BLOCKED; });
  }
}
for (const course of terrain.courses) {
  const kind = SLOW_WATER.includes(course.name) ? SLOW : course.flow === 'perennial' ? CREEK : 0;
  if (kind) rasterise(course.points, index => { if (!water[index]) water[index] = kind; });
}

// ---- Places, the ford and the camp ------------------------------------------------------------
const places = {};
for (const [id, name, kind, lon, lat, claimId, start] of PLACES) {
  const p = at(lon, lat);
  places[id] = { id, name, kind, x: round(p.x), y: round(p.y), claimId, ...(start && { start: true }) };
}
const riverPoints = name => terrain.courses.filter(c => c.name === name).flatMap(c => c.points);
function nearestOn(name, p) {
  let best = null, d = Infinity;
  for (const q of riverPoints(name)) { const e = distance(p, q); if (e < d) { d = e; best = q; } }
  return { point: best, distance: d };
}
// The Atascosito road's own crossing of the Colorado (HIST-TEX-156): the river nearest the record's point, which is given to
// the minute. Stood at the point itself it is a quarter mile and more off the water, and the road crosses beside it.
{
  const onRiver = nearestOn('Colorado River', places['lower-colorado-crossing']).point;
  Object.assign(places['lower-colorado-crossing'], { x: round(onRiver.x), y: round(onRiver.y) });
}
// The ford: the Guadalupe nearest the town.
const ford = nearestOn('Guadalupe River', places.gonzales).point;
places.ford = { id: 'ford', name: 'The ford', kind: 'ford', x: round(ford.x), y: round(ford.y), claimId: 'HIST-GONZ-007' };
// The Atascosito crossing of the Trinity: "three miles to the north" of Liberty (TSHA), or four and a half miles west of the
// Atascosito marker, about 3.1 miles north-west (1936 marker); the two agree to a quarter mile. The river nearest a point
// three miles from the town on a bearing of 330 degrees (HIST-TEX-025).
{
  const bearing = 330 * Math.PI / 180;
  const aim = { x: places.liberty.x + 3 * Math.sin(bearing), y: places.liberty.y - 3 * Math.cos(bearing) };
  const crossing = nearestOn('Trinity River', aim).point;
  places['atascosito-crossing'] = { id: 'atascosito-crossing', name: 'The Atascosito crossing', kind: 'crossing', x: round(crossing.x), y: round(crossing.y), claimId: 'HIST-TEX-025' };
}
places.confluence = { id: 'confluence', name: 'The forks of the rivers', kind: 'confluence', x: 0, y: 0, claimId: 'HIST-GONZ-015' };

/**
 * Walk the named river from a point for a distance, upstream or down. NHD draws every flowline in the
 * direction of flow, so upstream is backwards along a segment and then into the segment that ends where
 * this one begins. Heights at an eighth of a mile are too coarse to tell which way a river runs.
 * At a fork going upstream it keeps to the segment of the same name, and of those the longest.
 */
function walkRiver(name, from, miles, upstream) {
  const courses = terrain.courses.filter(c => c.name === name && c.points.length > 1);
  let course = null, index = 0, best = Infinity;
  for (const c of courses) c.points.forEach((p, i) => { const d = distance(p, from); if (d < best) { best = d; course = c; index = i; } });
  let here = course.points[index], travelled = 0;
  const visited = new Set([course]);
  while (travelled < miles) {
    const nextIndex = upstream ? index - 1 : index + 1;
    if (nextIndex >= 0 && nextIndex < course.points.length) {
      const next = course.points[nextIndex];
      travelled += distance(here, next); here = next; index = nextIndex;
      continue;
    }
    // Into the neighbouring segment: one that ends where this begins (upstream) or begins where this ends.
    const joins = courses.filter(c => !visited.has(c) && distance(upstream ? c.points.at(-1) : c.points[0], here) < 0.05);
    if (!joins.length) break;
    course = joins.sort((a, b) => b.points.length - a.points.length)[0];
    visited.add(course);
    index = upstream ? course.points.length - 1 : 0;
  }
  return { point: here, travelled };
}
const campWalk = walkRiver('Guadalupe River', ford, 7, true);
// The far bank is Castañeda's side, the side Béxar is on: every cell reachable from Béxar without crossing any
// barrier at all (crossings are not open yet). The camp is the nearest such cell to the seven-mile point, at
// least a fifth of a mile back from the water.
const westBank = new Uint8Array(columns * rows);
{
  const stack = [cellOf(places.bexar)];
  westBank[stack[0]] = 1;
  while (stack.length) {
    const current = stack.pop(), c = current % columns, r = Math.floor(current / columns);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= columns || nr >= rows) continue;
      const next = nr * columns + nc;
      if (westBank[next] || water[next] === BLOCKED || water[next] === SEA || heights[next] === noData || heights[next] < 10) continue;
      westBank[next] = 1; stack.push(next);
    }
  }
}
const campBank = (() => {
  let best = null, d = Infinity;
  const reach = Math.ceil(1.5 / cell), centre = cellOf(campWalk.point), cc = centre % columns, cr = Math.floor(centre / columns);
  for (let dr = -reach; dr <= reach; dr++) for (let dc = -reach; dc <= reach; dc++) {
    const index = (cr + dr) * columns + (cc + dc);
    if (!westBank[index]) continue;
    const p = centreOf(index), e = distance(p, campWalk.point);
    if (e < 0.2 || e >= d) continue;
    d = e; best = p;
  }
  if (!best) throw new Error('No ground on the far bank near seven miles above the ford');
  return best;
})();
if (westBank[cellOf(places.gonzales)]) throw new Error('Gonzales is on the same side of the Guadalupe as Béxar; the ford rule is wrong');
places['williams-camp'] = { id: 'williams-camp', name: "Ezekiel Williams's land", kind: 'camp', x: round(campBank.x), y: round(campBank.y), claimId: 'HIST-GONZ-008', riverMiles: round(campWalk.travelled) };
// Two stands of timber on the Guadalupe for hunting, about twelve river miles up and down from the ford (FIC-GONZ-008).
for (const [id, name, upstream] of [['upper-timber', 'The upper timber', true], ['lower-timber', 'The lower timber', false]]) {
  const { point } = walkRiver('Guadalupe River', ford, 12, upstream);
  const off = { x: point.x + (places.gonzales.x - ford.x) * 0.8, y: point.y + (places.gonzales.y - ford.y) * 0.8 };
  places[id] = { id, name, kind: 'woods', x: round(off.x), y: round(off.y), claimId: 'FIC-GONZ-008' };
}

// A town on the coast stands on ground the data puts at sea level; clear the sea from round each place.
for (const place of Object.values(places)) {
  const reach = Math.ceil(0.4 / cell), centre = cellOf(place), cc = centre % columns, cr = Math.floor(centre / columns);
  for (let dr = -reach; dr <= reach; dr++) for (let dc = -reach; dc <= reach; dc++) {
    const index = (cr + dr) * columns + (cc + dc);
    if (water[index] === SEA) water[index] = 0;
  }
}

// Two stands of timber near every other start, as Gonzales has: on the nearest named watercourse, about six miles up
// and down it from where it passes closest to the settlement (FIC-GONZ-008; timber follows the water, HIST-GONZ-012).
for (const start of Object.values(places).filter(place => place.start && place.id !== 'gonzales')) {
  let nearest = null;
  // The settlement's own river when it is within three miles (Mina on the Colorado, Liberty on the Trinity), before a
  // nearer branch or bayou.
  const big = new Set([...BARRIERS, ...SLOW_WATER.filter(n => /River/.test(n))]);
  for (const pass of [course => big.has(course.name), course => course.name && course.flow !== 'ephemeral']) {
    if (nearest && nearest.d <= 3) break;
    nearest = null;
  for (const course of terrain.courses) {
    if (!pass(course)) continue;
    for (const point of course.points) {
      const d = distance(point, start);
      if (!nearest || d < nearest.d) nearest = { d, name: course.name, point };
    }
  }
  }
  if (!nearest || nearest.d > 6) throw new Error(`${start.id} has no named watercourse within six miles for its timber`);
  for (const [suffix, name, upstream] of [['upper-timber', 'The upper timber', true], ['lower-timber', 'The lower timber', false]]) {
    const { point, travelled } = walkRiver(nearest.name, nearest.point, 6, upstream);
    const toTown = { x: start.x - point.x, y: start.y - point.y }, length = Math.hypot(toTown.x, toTown.y) || 1;
    const stand = { x: point.x + toTown.x / length * 0.3, y: point.y + toTown.y / length * 0.3 };
    places[`${start.id}-${suffix}`] = { id: `${start.id}-${suffix}`, name: `${name} on the ${nearest.name}`, kind: 'woods', x: round(stand.x), y: round(stand.y), claimId: 'FIC-GONZ-008', settlementId: start.id, riverMiles: round(travelled) };
  }
}

// Open each crossing across its river: the cells of the barrier within 0.6 miles of the crossing point.
const crossingPoints = {};
for (const [river, ids] of Object.entries(CROSSINGS)) {
  for (const id of ids) {
    const { point, distance: off } = nearestOn(river, places[id]);
    if (off > 2.5) throw new Error(`${id} is ${off.toFixed(2)} miles from the ${river}; a crossing must be at the river`);
    crossingPoints[`${id}:${river}`] = { river, x: round(point.x), y: round(point.y) };
    // Wide enough for a river the data draws as two channels (the Colorado at Matagorda: old channel and diversion).
    const reach = Math.ceil(0.6 / cell);
    const centre = cellOf(point), cc = centre % columns, cr = Math.floor(centre / columns);
    for (let dr = -reach; dr <= reach; dr++) for (let dc = -reach; dc <= reach; dc++) {
      const index = (cr + dr) * columns + (cc + dc);
      if (water[index] === BLOCKED) water[index] = SLOW;
    }
  }
}

// ---- Routing ----------------------------------------------------------------------------------
const cost = new Float64Array(columns * rows), cameFrom = new Int32Array(columns * rows), stamp = new Uint32Array(columns * rows);
let generation = 0;
const STEPS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
function route(fromPoint, toPoint) {
  generation++;
  // A road ends on passable ground: an end that falls on water moves to the nearest dry cell within half a mile.
  const passable = index => index >= 0 && heights[index] !== noData && water[index] !== BLOCKED && water[index] !== SEA;
  const settle = point => {
    const centre = cellOf(point);
    if (passable(centre)) return centre;
    const cc = centre % columns, cr = Math.floor(centre / columns), reach = Math.ceil(0.5 / cell);
    let best = -1, d = Infinity;
    for (let dr = -reach; dr <= reach; dr++) for (let dc = -reach; dc <= reach; dc++) {
      const index = (cr + dr) * columns + (cc + dc);
      if (passable(index) && Math.hypot(dr, dc) < d) { d = Math.hypot(dr, dc); best = index; }
    }
    return best;
  };
  const start = settle(fromPoint), goal = settle(toPoint);
  if (start < 0 || goal < 0) throw new Error('A road end is off the terrain or in water');
  const goalC = goal % columns, goalR = Math.floor(goal / columns);
  const heapI = [], heapF = [];
  const push = (index, f) => {
    heapI.push(index); heapF.push(f);
    let i = heapI.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (heapF[p] <= heapF[i]) break; [heapI[p], heapI[i]] = [heapI[i], heapI[p]]; [heapF[p], heapF[i]] = [heapF[i], heapF[p]]; i = p; }
  };
  const pop = () => {
    const top = heapI[0], lastI = heapI.pop(), lastF = heapF.pop();
    if (heapI.length) {
      heapI[0] = lastI; heapF[0] = lastF;
      let i = 0;
      for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heapI.length && heapF[l] < heapF[m]) m = l; if (r < heapI.length && heapF[r] < heapF[m]) m = r; if (m === i) break; [heapI[m], heapI[i]] = [heapI[i], heapI[m]]; [heapF[m], heapF[i]] = [heapF[i], heapF[m]]; i = m; }
    }
    return top;
  };
  const seen = index => stamp[index] === generation;
  stamp[start] = generation; cost[start] = 0; cameFrom[start] = -1;
  push(start, 0);
  const closed = new Set();
  while (heapI.length) {
    const current = pop();
    if (current === goal) break;
    if (closed.has(current)) continue;
    closed.add(current);
    const c = current % columns, r = Math.floor(current / columns);
    const here = heights[current];
    for (const [dc, dr, length] of STEPS) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= columns || nr >= rows) continue;
      const next = nr * columns + nc;
      if (heights[next] === noData || water[next] === BLOCKED || water[next] === SEA) continue;
      // No slipping diagonally between two cells of a barrier.
      if (dc && dr && (water[r * columns + nc] === BLOCKED || water[nr * columns + c] === BLOCKED || water[r * columns + nc] === SEA || water[nr * columns + c] === SEA)) continue;
      const miles = length * cell;
      const grade = Math.abs(heights[next] - here) / 10 / (miles * METRES_PER_MILE);
      let step = miles * (1 + 25 * grade);
      if (water[next] === SLOW) step += 2;
      else if (water[next] === CREEK) step += 0.25;
      const total = cost[current] + step;
      if (!seen(next) || total < cost[next]) {
        stamp[next] = generation; cost[next] = total; cameFrom[next] = current;
        push(next, total + Math.hypot(nc - goalC, nr - goalR) * cell);
      }
    }
  }
  if (!seen(goal)) throw new Error('No road could be found');
  const cells = [];
  for (let index = goal; index !== -1; index = cameFrom[index]) cells.push(index);
  cells.reverse();
  return cells.map(centreOf);
}

/** Whether a straight line stays off every barrier cell (a crossing's opened cells are not barriers). */
function clearLine(a, b) {
  let clear = true;
  rasterise([a, b], index => { if (water[index] === BLOCKED || water[index] === SEA) clear = false; });
  return clear;
}
/**
 * Douglas-Peucker on a routed path, except that a point is never dropped if the shortcut would cross a river or the
 * sea: the route went round a bend for a reason, and a straight simplification can cut the bend and wade the river.
 */
function simplify(points, tolerance, keepOffWater = true) {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length); keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const A = points[a], B = points[b], dx = B.x - A.x, dy = B.y - A.y, length = Math.hypot(dx, dy) || 1e-12;
    let worst = 0, index = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i].x - dx * points[i].y + B.x * A.y - B.y * A.x) / length;
      if (d > worst) { worst = d; index = i; }
    }
    if (index > 0 && (worst > tolerance || (keepOffWater && !clearLine(A, B)))) { keep[index] = 1; stack.push([a, index], [index, b]); }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * A road between two places, the least effort over the ground. Through `via` - points it must pass exactly, such as the
 * crossing of a river where the record puts it - it is laid leg by leg, each leg simplified on its own, so every via point
 * is a point of the road. A road with no via point is laid exactly as it always was.
 */
function layRoad(from, to, name, via = []) {
  const started = Date.now();
  const ends = [places[from], ...via, places[to]];
  const points = [];
  for (let i = 1; i < ends.length; i++) {
    const cells = route(ends[i - 1], ends[i]);
    const leg = simplify([ends[i - 1], ...cells.slice(1, -1), ends[i]], 0.03).map(p => ({ x: round(p.x), y: round(p.y) }));
    points.push(...(i > 1 ? leg.slice(1) : leg));
  }
  const miles = points.slice(1).reduce((sum, p, i) => sum + distance(p, points[i]), 0);
  console.log(`${name}: ${from} to ${to}${via.length ? ` by ${via.map(v => v.name).join(', ')}` : ''}, ${miles.toFixed(1)} miles, ${points.length} points, ${Date.now() - started} ms`);
  return { id: `road-${from}-${to}`, from, to, name, kind: 'road', points, miles: round(miles), ...(via.length && { via: via.map(v => ({ name: v.name, x: round(v.x), y: round(v.y) })) }) };
}
const roads = [];
for (const [from, to, name] of ROADS) roads.push(layRoad(from, to, name));
// Gonzales's own short ways, as the invented map had them: the town down to the ford, and the bank to the camp.
roads.push({ id: 'road-gonzales-ford', from: 'gonzales', to: 'ford', name: 'The crossing', kind: 'crossing', points: [places.gonzales, places.ford].map(p => ({ x: p.x, y: p.y })), miles: round(distance(places.gonzales, places.ford)) });
const bank = simplify(route(places.ford, places['williams-camp']), 0.03).map(p => ({ x: round(p.x), y: round(p.y) }));
roads.push({ id: 'road-ford-williams-camp', from: 'ford', to: 'williams-camp', name: 'Along the bank', kind: 'bank', points: [places.ford, ...bank.slice(1, -1), places['williams-camp']].map(p => ({ x: p.x, y: p.y })), miles: 0 });
for (const stand of Object.values(places).filter(place => place.kind === 'woods')) {
  const town = places[stand.settlementId || 'gonzales'];
  const cells = route(town, stand);
  // A stand set down just across a meander is moved to where the way to it actually ends, on the town's side.
  const end = cells.at(-1);
  if (distance(end, stand) > 0.01) { stand.x = round(end.x); stand.y = round(end.y); }
  const trail = simplify(cells, 0.03).map(p => ({ x: round(p.x), y: round(p.y) }));
  roads.push({ id: `road-${town.id}-${stand.id}`, from: town.id, to: stand.id, name: 'A track to the timber', kind: 'track', points: [town, ...trail.slice(1, -1), stand].map(p => ({ x: p.x, y: p.y })), miles: 0 });
}
for (const road of roads) if (!road.miles) road.miles = round(road.points.slice(1).reduce((sum, p, i) => sum + distance(p, road.points[i]), 0));

// ---- Watercourses for drawing -----------------------------------------------------------------
// The big rivers whole, and the named creeks near any start, simplified for the map a class downloads once.
const RIVERS = new Set([...BARRIERS, ...SLOW_WATER.filter(name => /River|Bayou/.test(name))]);
// The creeks are drawn round the starts, and round the houses of the army's march east and the towns at its end, where the
// record names the creeks the road crossed - Spring Creek at McCarley's, Cypress Creek at Burnett's (HIST-TEX-088), Vince's
// Bayou below Harrisburg - so their crossings can be drawn (2026-09-19).
const starts = Object.values(places).filter(p => p.start || ['donohos', 'mccarleys', 'roberts', 'burnetts', 'harrisburg', 'lynchburg'].includes(p.id));
const drawn = [];
for (const course of joinReaches(terrain.courses)) {
  if (!course.name) continue;
  const river = RIVERS.has(course.name);
  if (!river && !(course.flow === 'perennial' || course.flow === 'intermittent')) continue;
  if (!river && !course.points.some(p => starts.some(s => distance(p, s) < 14))) continue;
  const points = simplify(course.points, river ? 0.05 : 0.04, false).map(p => ({ x: round(p.x), y: round(p.y) }));
  if (points.length < 2) continue;
  drawn.push({ name: course.name, kind: river ? 'river' : 'creek', points });
}

// The San Antonio through Béxar as it ran in 1836 (FIC-GONZ-058). The modern line through the town is the cut-off channel of
// the 1920s, straight through what were the town's lots; in 1836 the river looped east of the Plaza de las Islas round La
// Villita and the Potrero (the owner's Nelson panorama, GLO map 83600). The reconstruction's own river is laid on the map by
// the same frame as its streets (public/bexar-layout.js `BEXAR_FRAME`) and joined to the real line where the town ends,
// so everything that reads the river - the page at every zoom, the province bands, the tests - reads one line.
{
  const bexar = places.bexar;
  const channel = BEXAR_LAYOUT.river.points.map(p => { const o = bexarToSite(p); return { x: round(bexar.x + o.x), y: round(bexar.y + o.y) }; });
  const reach = Math.max(...channel.map(p => distance(p, bexar)));
  const course = drawn.filter(c => c.name === 'San Antonio River').sort((a, b) => b.points.length - a.points.length)[0];
  const inside = course.points.map(p => distance(p, bexar) <= reach);
  const first = inside.indexOf(true), last = inside.lastIndexOf(true);
  if (first < 1 || last >= course.points.length - 1) throw new Error('The San Antonio does not run through Béxar');
  const before = course.points[first - 1];
  const ordered = distance(channel[0], before) <= distance(channel.at(-1), before) ? channel : [...channel].reverse();
  course.points = [...course.points.slice(0, first), ...ordered, ...course.points.slice(last + 1)];
}

// ---- The crossings: a ford, a ferry or a bridge wherever a road meets drawn water ---------------------------------------
// Owner, 2026-09-18: "when the various rivers and creeks are added, we're going to have to have assets ford, or build
// bridges (where they historically were)"; chosen the same day: every place a road crosses a river or creek gets a ford, a
// ferry or a bridge, at the historical crossing where one is known (docs/MAP_ACCURACY.md §10).
//
// Every road (and Gonzales's short way to its ford) is intersected with every watercourse the map draws. A road that wanders
// along a creek bottom meets it again and again; the meetings of one road with one water within CHAIN_MILES of each other
// along it are one crossing, set at the middle meeting. Two roads that share a stretch meet the water at the same point and
// share the place. Where the record gives the crossing, the place is that crossing: a road that meets the water elsewhere near
// it is laid again through it (`layRoad` with a via point), so there is one ferry at San Felipe, not one for each road.
const CHAIN_MILES = 1.5;
const SAME_PLACE_MILES = 0.05;
/**
 * The river crossings a barrier's opened window stands for, keyed `${place}:${river}` as `crossingPoints` is:
 * [id, name, kind, claim]. A window no road crosses in (Columbia's) makes no place.
 */
const WINDOW_CROSSINGS = {
  // Nothing names a ferry at Victoria before the city leased one in 1839, and Urrea had boats built to cross in March 1836
  // (HIST-TEX-154); the game's is a town ferry by the state's rule of 1827 (HIST-TEX-140, FIC-GONZ-091).
  'victoria:Guadalupe River': ['victoria-ferry', 'The ferry at Victoria', 'ferry', 'FIC-GONZ-091'],
  // Smithwick's "sentinel down at the ford" at Mina, spring 1836 (HIST-TEX-147).
  'mina:Colorado River': ['mina-ford', 'The ford at Mina', 'ford', 'HIST-TEX-147'],
  // Nothing found at the town; a town ferry by the rule of 1827 (FIC-GONZ-091).
  'matagorda:Colorado River': ['matagorda-ferry', 'The ferry at Matagorda', 'ferry', 'FIC-GONZ-091'],
  // The town's public ferry, leased yearly (HIST-TEX-142).
  'san-felipe:Brazos River': ['san-felipe-ferry', 'The San Felipe ferry', 'ferry', 'HIST-TEX-142'],
  // Andrew Robinson's ferry at the La Bahía crossing (HIST-TEX-143).
  'washington:Brazos River': ['robinsons-ferry', "Robinson's ferry", 'ferry', 'HIST-TEX-143'],
  'columbia:Brazos River': ['columbia-ferry', 'The ferry at Columbia', 'ferry', 'FIC-GONZ-091'],
  // Asa Brigham's ferry at Brazoria (HIST-TEX-144).
  'brazoria:Brazos River': ['brighams-ferry', "Brigham's ferry", 'ferry', 'HIST-TEX-144'],
  // Groce's ferry at Bernardo, the Coushatta crossing (HIST-TEX-088).
  'bernardo:Brazos River': ['groces-ferry', "Groce's ferry", 'ferry', 'HIST-TEX-088'],
  // The Victoria road's crossing at La Bahía, "the lower ford" (HIST-TEX-148).
  'goliad:San Antonio River': ['lower-ford', 'The lower ford', 'ford', 'HIST-TEX-148'],
  // Horses and wagons crossed at a ford below the town; people on foot had a footbridge (HIST-TEX-149).
  'bexar:San Antonio River': ['bexar-ford', 'The ford at Béxar', 'ford', 'HIST-TEX-149'],
};
/**
 * Crossings the record gives on water that is not a barrier: [id, name, kind, water, lon, lat, claim]. The place is where a
 * road meets the drawn water nearest the point; a road crossing that water further than `ANCHOR_MILES` from it is laid again
 * through it. `water` null is water the map draws as open water and not as a line (the San Jacinto at Lynch's ferry, which
 * the elevation data has at the sea's level): the place is where the road passes nearest the point.
 */
const HISTORIC_CROSSINGS = [
  // The present ferry's crossing (HIST-TEX-084), Lynch's since 1822 (HIST-TEX-150).
  ['lynchs-ferry', "Lynch's ferry", 'ferry', null, -95.08000, 29.76361, 'HIST-TEX-150'],
  // The 1912 marker "Vince's Bridge", N. Richey St., Pasadena, at the bayou: a marker, not a survey (HIST-TEX-153).
  ['vinces-bridge', "Vince's bridge", 'bridge', 'Vince Bayou', -95.22015, 29.71933, 'HIST-TEX-153'],
  // "A ferry across Buffalo Bayo opposite the town of Harrisburg" (1830, HIST-TEX-151): the bayou nearest the town's point.
  ['harrisburg-ferry', 'The Harrisburg ferry', 'ferry', 'Buffalo Bayou', -95.2785, 29.7228, 'HIST-TEX-151'],
];
const ANCHOR_MILES = 0.3;
/** How each place the map already had crosses its water: [kind, water, claim]. They stay where they are. */
const PLACE_CROSSINGS = {
  // "The ford" opposite Gonzales (HIST-GONZ-007, -008; the town's ferry of 1832 was taken off the river in 1835, HIST-TEX-141).
  ford: ['ford', 'Guadalupe River', 'HIST-GONZ-007'],
  // The Trinity ferry of Dilue Harris's crossing, April 1836 (HIST-TEX-152).
  'atascosito-crossing': ['ferry', 'Trinity River', 'HIST-TEX-152'],
  // Burnam's ferry at the La Bahía crossing near La Grange (HIST-TEX-145).
  'la-grange-crossing': ['ferry', 'Colorado River', 'HIST-TEX-145'],
  // Robbins's ferry on the Trinity, at the crossing of the San Antonio and La Bahía roads (HIST-TEX-162).
  'robbins-ferry': ['ferry', 'Trinity River', 'HIST-TEX-162'],
  // Beeson's ferry at Columbus (HIST-TEX-146), its place on the east bank at the marker, where the army camped (HIST-TEX-157).
  'columbus-crossing': ['ferry', 'Colorado River', 'HIST-TEX-146'],
  // The Atascosito road's own crossing, nine miles below Columbus (HIST-TEX-156). Nothing read names a ferry or a ferryman
  // there, and the road's name for it is a crossing: a ford, as the roads' other unnamed crossings are (FIC-GONZ-090).
  'lower-colorado-crossing': ['ford', 'Colorado River', 'HIST-TEX-156'],
};

const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const onWater = water => water.endsWith(' River') ? `the ${water}` : water;
const intersect = (a, b, c, d) => {
  const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den, u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a.x + t * r.x, y: a.y + t * r.y, t, direction: Math.atan2(s.y, s.x) } : null;
};
const boxOf = points => points.reduce((box, p) => ({ minX: Math.min(box.minX, p.x), minY: Math.min(box.minY, p.y), maxX: Math.max(box.maxX, p.x), maxY: Math.max(box.maxY, p.y) }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
const drawnBoxes = drawn.map(course => boxOf(course.points));
const CROSSED = ['road', 'crossing'];
/** Every meeting of a road with drawn water: the road, the water, where, how far along the road, and the water's direction there. */
function meetings(road) {
  const found = [], box = boxOf(road.points);
  let along = 0;
  const lengths = road.points.slice(1).map((p, i) => distance(p, road.points[i]));
  drawn.forEach((course, index) => {
    const w = drawnBoxes[index];
    if (w.maxX < box.minX || w.minX > box.maxX || w.maxY < box.minY || w.minY > box.maxY) return;
    along = 0;
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1], b = road.points[i];
      for (let j = 1; j < course.points.length; j++) {
        const hit = intersect(a, b, course.points[j - 1], course.points[j]);
        if (hit) found.push({ road, water: course.name, waterKind: course.kind, x: hit.x, y: hit.y, along: along + lengths[i - 1] * hit.t, direction: hit.direction });
      }
      along += lengths[i - 1];
    }
  });
  return found;
}
/** One road's meetings with one water, chained into its crossings: each the middle meeting of a run no gap in which is longer than CHAIN_MILES. */
function crossingsOf(road) {
  const byWater = new Map();
  for (const hit of meetings(road)) { if (!byWater.has(hit.water)) byWater.set(hit.water, []); byWater.get(hit.water).push(hit); }
  const out = [];
  for (const hits of byWater.values()) {
    hits.sort((a, b) => a.along - b.along);
    let run = [hits[0]];
    const close = () => { out.push({ ...run[Math.floor((run.length - 1) / 2)], meetings: run.length }); };
    for (const hit of hits.slice(1)) {
      if (hit.along - run.at(-1).along > CHAIN_MILES) { close(); run = [hit]; } else run.push(hit);
    }
    close();
  }
  return out;
}
const crossedRoads = () => roads.filter(road => CROSSED.includes(road.kind));
/** The window of a barrier this crossing is in: the opened crossing point of that river nearest it. */
const windowOf = crossing => Object.entries(crossingPoints).filter(([, point]) => point.river === crossing.water)
  .map(([key, point]) => ({ key, point, d: distance(point, crossing) })).sort((a, b) => a.d - b.d)[0];
/** Lay a road again through a point it must cross at. A road that already ends at the point is left as it is. */
function relay(laid, anchor, name) {
  // The road as it now stands: an earlier crossing may have laid it again already.
  const index = roads.findIndex(road => road.id === laid.id), road = roads[index];
  if ([road.from, road.to].some(id => distance(places[id], anchor) < SAME_PLACE_MILES)) return false;
  const via = [...(road.via || []), { name, x: anchor.x, y: anchor.y }].sort((a, b) => distance(places[road.from], a) - distance(places[road.from], b));
  roads[index] = layRoad(road.from, road.to, road.name, via);
  return true;
}
/** The nearest point on the drawn lines of a water to a point, and how far off it is. */
function nearestOnWater(water, point) {
  let best = null;
  for (const course of drawn.filter(c => c.name === water)) {
    for (let i = 1; i < course.points.length; i++) {
      const a = course.points[i - 1], b = course.points[i], dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
      const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0;
      const q = { x: a.x + dx * t, y: a.y + dy * t, direction: Math.atan2(dy, dx) };
      if (!best || distance(q, point) < distance(best, point)) best = q;
    }
  }
  return best;
}
/** The point on a road nearest a point, with the road's direction there turned a right angle (as a water's would be). */
function nearestOnRoad(road, point) {
  let best = null;
  for (let i = 1; i < road.points.length; i++) {
    const a = road.points[i - 1], b = road.points[i], dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0;
    const q = { x: a.x + dx * t, y: a.y + dy * t, direction: Math.atan2(dy, dx) - Math.PI / 2 };
    if (!best || distance(q, point) < distance(best, point)) best = q;
  }
  return best;
}
/** Every barrier crossing, grouped by the opened window it is in. */
function barrierCrossings() {
  const byWindow = new Map();
  for (const road of crossedRoads()) for (const crossing of crossingsOf(road)) {
    if (!BARRIERS.includes(crossing.water)) continue;
    const window = windowOf(crossing);
    if (!window || window.d > 1.5) throw new Error(`${road.id} crosses the ${crossing.water} away from any crossing`);
    if (!byWindow.has(window.key)) byWindow.set(window.key, []);
    byWindow.get(window.key).push(crossing);
  }
  return byWindow;
}
/** Where a window's crossing is: the place's own point when it stands on the river, else the point the window was opened on. */
const windowAnchor = key => {
  const id = key.split(':')[0];
  return PLACE_CROSSINGS[id] && distance(places[id], crossingPoints[key]) < 0.1 ? places[id] : crossingPoints[key];
};
// One crossing in each opened window of a barrier: where the roads there meet the river at different points, each is laid
// through the window's one point.
for (const [key, list] of barrierCrossings()) {
  if (!list.some(a => list.some(b => distance(a, b) > SAME_PLACE_MILES))) continue;
  const anchor = windowAnchor(key);
  for (const road of new Set(list.map(crossing => crossing.road))) relay(road, anchor, `${onWater(list[0].water)} at ${places[key.split(':')[0]].name}`);
}
// The road to Béxar leaves from the ford itself, and the least-effort line out of it ran down the east bank and over the
// river half a mile below. It goes straight over at the ford: by the nearest ground on the far bank, Castañeda's side.
{
  const road = roads.find(r => r.id === 'road-ford-bexar');
  const over = crossingsOf(road).find(crossing => crossing.water === 'Guadalupe River');
  if (over && distance(over, places.ford) > SAME_PLACE_MILES) {
    let best = null;
    const reach = Math.ceil(0.5 / cell), centre = cellOf(places.ford), cc = centre % columns, cr = Math.floor(centre / columns);
    for (let dr = -reach; dr <= reach; dr++) for (let dc = -reach; dc <= reach; dc++) {
      const index = (cr + dr) * columns + (cc + dc);
      if (!westBank[index]) continue;
      const p = centreOf(index);
      if (!best || distance(p, places.ford) < distance(best, places.ford)) best = p;
    }
    if (!best) throw new Error('No far bank opposite the ford');
    roads[roads.indexOf(road)] = layRoad(road.from, road.to, road.name, [{ name: 'the far bank at the ford', x: round(best.x), y: round(best.y) }]);
  }
}
// The record's crossings of lesser water: the road that crosses that water nearest the point is laid through it - through the
// drawn water nearest the point - if it crosses further off than ANCHOR_MILES.
const historicAt = new Map();
for (const [id, name, , water, lon, lat] of HISTORIC_CROSSINGS) {
  const point = at(lon, lat);
  if (!water) { historicAt.set(id, point); continue; }
  const onLine = nearestOnWater(water, point);
  if (!onLine || distance(onLine, point) > 0.5) throw new Error(`${name} is not on the ${water} the map draws`);
  historicAt.set(id, onLine);
  const nearest = crossedRoads().flatMap(crossingsOf).filter(c => c.water === water).sort((a, b) => distance(a, onLine) - distance(b, onLine))[0];
  if (!nearest || distance(nearest, onLine) > 3) throw new Error(`No road crosses ${water} near ${name}`);
  if (distance(nearest, onLine) > ANCHOR_MILES) relay(nearest.road, onLine, name);
}

// The places. A barrier window's crossing is one place, at its one point; any other crossing of a road with a water is a
// place, shared by another road that meets the same water there. Two crossings closer than CONFLUENCE_MILES are one - a
// road over the mouth of a creek where it joins another - and the record's crossing, or else the first found, is kept. A road
// whose crossing was folded into a place it does not pass through is laid again through that place.
const CONFLUENCE_MILES = 0.15;
function collectCrossings() {
  const found = [];
  for (const [key, list] of barrierCrossings()) {
    const anchor = windowAnchor(key);
    const apart = list.some(a => list.some(b => distance(a, b) > SAME_PLACE_MILES));
    const where = apart ? { ...anchor, direction: nearestOnWater(list[0].water, anchor).direction } : list[0];
    found.push({ x: where.x, y: where.y, water: list[0].water, waterKind: 'river', direction: where.direction, meets: list, window: key });
  }
  for (const road of crossedRoads()) for (const crossing of crossingsOf(road)) {
    if (!BARRIERS.includes(crossing.water)) found.push({ x: crossing.x, y: crossing.y, water: crossing.water, waterKind: crossing.waterKind, direction: crossing.direction, meets: [crossing] });
  }
  for (const [id, name, kind, water, , , claimId] of HISTORIC_CROSSINGS) {
    const point = historicAt.get(id);
    if (!water) {
      // Open water the map draws as sea, not as a line: the place is on the road nearest the point.
      const best = crossedRoads().map(road => ({ road, q: nearestOnRoad(road, point) })).sort((a, b) => distance(a.q, point) - distance(b.q, point))[0];
      if (distance(best.q, point) > ANCHOR_MILES) throw new Error(`${name} is ${distance(best.q, point).toFixed(2)} miles off any road`);
      // The water it spans: the stretch of the road about the point that the elevation data has under thirty centimetres,
      // read every hundredth of a mile. The place is its middle, and `span` its width, so the rope reaches bank to bank.
      const along = [];
      for (let i = 1; i < best.road.points.length; i++) {
        const a = best.road.points[i - 1], b = best.road.points[i], steps = Math.max(1, Math.ceil(distance(a, b) / 0.01));
        for (let k = i > 1 ? 1 : 0; k <= steps; k++) along.push({ x: a.x + (b.x - a.x) * k / steps, y: a.y + (b.y - a.y) * k / steps });
      }
      const wet = p => { const h = terrain.heightAt(p.x, p.y); return !Number.isFinite(h) || h < 0.3; };
      let middle = along.reduce((m, p, i) => distance(p, best.q) < distance(along[m], best.q) ? i : m, 0), first = middle, last = middle;
      while (first > 0 && wet(along[first - 1])) first--;
      while (last < along.length - 1 && wet(along[last + 1])) last++;
      const span = last > first ? along.slice(first + 1, last + 1).reduce((sum, p, k) => sum + distance(along[first + k], p), 0) : 0;
      const centre = along[Math.round((first + last) / 2)];
      found.unshift({ x: centre.x, y: centre.y, water: null, waterKind: 'river', direction: best.q.direction, span, meets: [{ road: best.road, x: centre.x, y: centre.y }], historic: [id, name, kind, claimId] });
      continue;
    }
    const place = found.filter(c => c.water === water && !c.historic).sort((a, b) => distance(a, point) - distance(b, point))[0];
    if (!place || distance(place, point) > ANCHOR_MILES + SAME_PLACE_MILES) throw new Error(`${name}: no crossing of ${water} at the record's point (${place && distance(place, point).toFixed(2)})`);
    place.historic = [id, name, kind, claimId];
    found.splice(found.indexOf(place), 1); found.unshift(place);
  }
  // Barrier windows and the record's crossings come first, so a confluence folds into them.
  found.sort((a, b) => Boolean(b.window || b.historic) - Boolean(a.window || a.historic));
  const kept = [];
  for (const crossing of found) {
    const into = kept.find(place => distance(place, crossing) <= CONFLUENCE_MILES);
    if (into && !(crossing.window || crossing.historic)) { into.meets.push(...crossing.meets); continue; }
    kept.push(crossing);
  }
  const relays = [];
  for (const place of kept) for (const meet of place.meets) {
    if (distance(meet, place) > SAME_PLACE_MILES && distanceToRoad(meet.road, place) > SAME_PLACE_MILES) relays.push({ road: meet.road, place });
  }
  return { places: kept, relays };
}
const distanceToRoad = (road, point) => distance(nearestOnRoad(road, point), point);
let collected = collectCrossings();
for (let pass = 0; collected.relays.length && pass < 3; pass++) {
  for (const { road, place } of collected.relays) relay(road, place, `${place.water ? onWater(place.water) : 'the water'} at the crossing`);
  collected = collectCrossings();
}
if (collected.relays.length) throw new Error(`Roads still miss their crossings: ${collected.relays.map(r => r.road.id).join(', ')}`);
const crossingPlaces = collected.places;
const used = new Set();
const placeId = base => { let id = base, n = 2; while (used.has(id) || places[id]) id = `${base}-${n++}`; used.add(id); return id; };
/** Where nothing in the record gives the crossing, the game's (FIC-GONZ-090): a ferry over the big rivers and the deep tidal water, a ford elsewhere. */
const FERRY_WATER = [...BARRIERS, 'San Jacinto River', 'Buffalo Bayou'];
for (const place of crossingPlaces) {
  // Which way the crossing lies: a ford or a bridge straight across the water, a ferry's rope along its road, bank to bank.
  const across = round(place.direction + Math.PI / 2);
  const alongRoad = round(nearestOnRoad(place.meets[0].road, place).direction + Math.PI / 2);
  const lying = kind => (kind === 'ferry' ? alongRoad : across);
  // A road that meets the water slantwise is longer bank to bank than the water is wide: the ferry's rope is drawn that much longer.
  const slant = place.water ? Math.min(3, 1 / Math.max(1e-6, Math.abs(Math.sin(alongRoad - place.direction)))) : 1;
  const oblique = kind => (kind === 'ferry' && slant > 1.05 ? { oblique: round(slant) } : {});
  const common = { x: round(place.x), y: round(place.y), water: place.water, waterKind: place.waterKind, ...(place.span && { span: round(place.span) }) };
  // A place the map already had keeps its id, name and point; where it stands off the water its crossing is drawn at `over`,
  // where its road meets the water. One that was a `crossing` is a `stage`: the word and the fleeing families stop there.
  const owner = Object.keys(PLACE_CROSSINGS).find(id => place.window === `${id}:${place.water}` || (!place.window && !place.historic && PLACE_CROSSINGS[id][1] === place.water && distance(places[id], place) < 1));
  if (owner) {
    const [kind, water, claimId] = PLACE_CROSSINGS[owner];
    const existing = places[owner];
    if (existing.water) throw new Error(`${owner} is given two crossings of the ${water}`);
    Object.assign(existing, { kind, claimId, water, waterKind: place.waterKind, across: lying(kind), ...oblique(kind), ...(existing.kind === 'crossing' && { stage: true }), ...(distance(existing, common) > CONFLUENCE_MILES && { over: { x: common.x, y: common.y } }) });
    continue;
  }
  const given = place.historic || (place.window && WINDOW_CROSSINGS[place.window]);
  if (given) {
    const [id, name, kind, claimId] = given;
    if (places[id]) throw new Error(`${id} is given twice`);
    used.add(id);
    places[id] = { id, name, kind, ...common, across: lying(kind), ...oblique(kind), claimId };
    continue;
  }
  if (place.window) throw new Error(`The crossing in the window ${place.window} has no kind`);
  const kind = FERRY_WATER.includes(place.water) ? 'ferry' : 'ford';
  const id = placeId(`${kind}-${slug(place.water)}`);
  places[id] = { id, name: `The ${kind} on ${onWater(place.water)}`, kind, ...common, across: lying(kind), ...oblique(kind), claimId: 'FIC-GONZ-090' };
}
for (const [id, [kind]] of Object.entries(PLACE_CROSSINGS)) if (places[id].kind !== kind) throw new Error(`${id} was met by no road`);

// ---- The country outside the box ---------------------------------------------------------------
//
// Where the war came from, drawn but not walked (owner, 2026-09-19): Matamoros and Urrea's road up to San Patricio, the
// Camino Real from Goliad by San Patricio to Laredo, the Presidio del Río Grande and Paso de Francia where Santa Anna's
// army crossed into Texas, and the Old San Antonio Road east from Nacogdoches to Gaines's ferry on the Sabine.
//
// `ceiling:` these roads are straight legs between their places, not least-cost lines over the ground: the heights and the
// water the box's routing reads (`route`) stop at the box's edge, and the country outside is a drawing layer
// (public/terrain/outside-*.gz, docs/MAP_ACCURACY.md §8). Their courses are the game's (`FIC-GONZ-093`), their ends and
// their river crossings the record's.
//
// `ceiling:` a road of kind `outside` is drawn and never travelled: sim/ways.mjs and sim/geography.mjs leave it out of the
// graph, so nothing about a family's journeys, the word's relays or the flight east changes. Nobody walks to Matamoros.
const OUTSIDE_PLACES = [
  ['matamoros', 'Matamoros', 'distant', -97.50417, 25.87972, 'HIST-TEX-158'],
  ['san-patricio', 'San Patricio', 'distant', -97.776421, 27.9771416, 'HIST-TEX-159'],
  ['laredo', 'Laredo', 'distant', -99.49028, 27.52361, 'HIST-TEX-160'],
  ['presidio-rio-grande', 'The Presidio del Río Grande', 'distant', -100.37694, 28.30833, 'HIST-TEX-161'],
];
/** The crossings of the outside roads: [id, name, kind, river, lon, lat, claim]. Each is snapped to the river the map draws. */
const OUTSIDE_CROSSINGS = [
  // Paso de Francia, "six miles southeast of the presidio", where Santa Anna's army crossed in February 1836 (HIST-TEX-161).
  ['paso-de-francia', 'Paso de Francia', 'ford', 'Rio Grande', -100.30721, 28.24683, 'HIST-TEX-161'],
  // The Rio Grande at Matamoros, which Urrea's division crossed in February 1836 (HIST-TEX-158): a ferry by the rule of 1827
  // (HIST-TEX-140, FIC-GONZ-091), nothing read naming a ferryman.
  ['matamoros-crossing', 'The ferry at Matamoros', 'ferry', 'Rio Grande', -97.50417, 25.87972, 'FIC-GONZ-091'],
  // ceiling: Laredo's own crossing of the Rio Grande is not drawn. The town stands on the north bank and the roads the map
  // has end there; nothing on the Mexican side of it is drawn for a road to go to.
  // The Nueces at San Patricio, where the Camino Real and the Atascosito road crossed (HIST-TEX-159).
  ['san-patricio-crossing', 'The crossing at San Patricio', 'ford', 'Nueces River', -97.776421, 27.9771416, 'HIST-TEX-159'],
  // Gaines's ferry on the Sabine, the Old San Antonio Road's crossing and the way in from the United States: the marker at
  // the crossing, 31°27.727' N, 93°45.226' W (HIST-TEX-163).
  ['gaines-ferry', "Gaines's ferry", 'ferry', 'Sabine River', -93.7537667, 31.4621167, 'HIST-TEX-163'],
];
/** [from, to, name, the crossings it goes over, in order from `from`]. */
const OUTSIDE_ROADS = [
  ['matamoros', 'san-patricio', 'The road up from Matamoros', ['matamoros-crossing', 'san-patricio-crossing']],
  ['san-patricio', 'goliad', 'The Camino Real from Goliad to Laredo', []],
  ['san-patricio', 'laredo', 'The Camino Real from Goliad to Laredo', []],
  ['presidio-rio-grande', 'bexar', 'The Camino Real from the Presidio del Río Grande', ['paso-de-francia']],
  ['nacogdoches', 'gaines-ferry', 'The Old San Antonio Road to the Sabine', []],
];
{
  // The rivers the country outside the box draws (scripts/build-outside.mjs), in hundredths of a mile, finest band first.
  const outside = JSON.parse(gunzipSync(readFileSync('public/terrain/outside-province.json.gz')).toString('utf8'));
  const riverLines = name => outside.rivers.filter(river => river.name === name)
    .map(river => { const flat = river.levels[0]; const points = []; for (let i = 0; i < flat.length; i += 2) points.push({ x: flat[i] / 100, y: flat[i + 1] / 100 }); return points; });
  const nearestOnLines = (lines, point) => {
    let best = null;
    for (const points of lines) for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
      const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0;
      const q = { x: a.x + dx * t, y: a.y + dy * t, direction: Math.atan2(dy, dx) };
      if (!best || distance(q, point) < distance(best, point)) best = q;
    }
    return best;
  };
  for (const [id, name, kind, lon, lat, claimId] of OUTSIDE_PLACES) {
    const p = at(lon, lat);
    places[id] = { id, name, kind, x: round(p.x), y: round(p.y), claimId, outside: true };
  }
  for (const [id, name, kind, river, lon, lat, claimId] of OUTSIDE_CROSSINGS) {
    const point = at(lon, lat), lines = riverLines(river);
    if (!lines.length) throw new Error(`The country outside the box draws no ${river}`);
    const onRiver = nearestOnLines(lines, point);
    if (distance(onRiver, point) > 3) throw new Error(`${name} is ${distance(onRiver, point).toFixed(1)} miles from the ${river} the map draws`);
    places[id] = {
      id, name, kind, x: round(onRiver.x), y: round(onRiver.y), claimId,
      water: river, waterKind: 'river', across: round(onRiver.direction + (kind === 'ferry' ? Math.PI / 2 : 0)), outside: true,
    };
  }
  for (const [from, to, name, over] of OUTSIDE_ROADS) {
    const ends = [places[from], ...over.map(id => places[id]), places[to]];
    for (const end of ends) if (!end) throw new Error(`${name}: a place is missing`);
    let points = ends.map(p => ({ x: p.x, y: p.y }));
    // Every other river of the outside country this road goes over is a ford of the game's, as a road coming down to unnamed
    // water inside the box is (`FIC-GONZ-090`): the Camino Real from the presidio crossed the Nueces and the Frio on its way
    // to Béxar, and no name for either crossing was found. The ford goes into the road's line where the road meets the water.
    const found = [];
    for (const river of [...new Set(outside.rivers.map(one => one.name))]) {
      for (const line of riverLines(river)) {
        for (let i = 1; i < points.length; i++) for (let j = 1; j < line.length; j++) {
          const hit = intersect(points[i - 1], points[i], line[j - 1], line[j]);
          if (!hit) continue;
          if (ends.some(place => distance(place, hit) < 3)) continue;
          if (found.some(one => distance(one, hit) < 0.5)) continue;
          found.push({ river, x: hit.x, y: hit.y, direction: hit.direction, leg: i, at: distance(points[i - 1], hit) });
        }
      }
    }
    for (const hit of found.sort((a, b) => b.leg - a.leg || b.at - a.at)) {
      const id = placeId(`ford-${slug(hit.river)}`);
      places[id] = {
        id, name: `The ford on ${onWater(hit.river)}`, kind: 'ford', x: round(hit.x), y: round(hit.y), claimId: 'FIC-GONZ-090',
        water: hit.river, waterKind: 'river', across: round(hit.direction), outside: true,
      };
      points = [...points.slice(0, hit.leg), { x: places[id].x, y: places[id].y }, ...points.slice(hit.leg)];
      console.log(`  a ford on ${onWater(hit.river)} where ${name} comes down to it`);
    }
    const miles = points.slice(1).reduce((sum, p, i) => sum + distance(p, points[i]), 0);
    roads.push({ id: `road-${from}-${to}`, from, to, name, kind: 'outside', points, miles: round(miles) });
    console.log(`${name}: ${from} to ${to}${over.length ? ` over ${over.join(', ')}` : ''}, ${miles.toFixed(1)} miles, outside the box`);
  }
}

const output = {
  kind: 'texas-colonies-map', version: 1, builtFrom: 'scripts/build-colonies-map.mjs over public/terrain',
  places, crossings: crossingPoints, roads, watercourses: drawn,
};
const json = JSON.stringify(output);
mkdirSync('public/terrain', { recursive: true });
writeFileSync('public/terrain/colonies-map.json.gz', gzipSync(json, { level: 9 }));
console.log(`Places ${Object.keys(places).length}, roads ${roads.length}, watercourses drawn ${drawn.length}; ${(json.length / 1e6).toFixed(2)} MB JSON, camp ${places['williams-camp'].riverMiles} river miles above the ford`);

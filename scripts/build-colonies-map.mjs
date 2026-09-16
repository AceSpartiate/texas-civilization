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
//     least-effort line over the real ground between its places, crossing the big rivers only at a crossing.
//   - Gonzales's ford is the point of the Guadalupe nearest the town (HIST-GONZ-007); Castañeda's camp is
//     about seven miles upriver of it on the far bank (HIST-GONZ-008), measured along the real river.
import { mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';

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
  // Lynchburg, at the mouth of Buffalo Bayou: a point on the mail road to Liberty (HIST-TEX-025).
  ['lynchburg', 'Lynchburg', 'town', -95.0554851, 29.7871704, 'HIST-TEX-025', false],
  ['anahuac', 'Anahuac', 'town', -94.6826961, 29.7730001, 'HIST-TEX-010', false],
  ['nacogdoches', 'Nacogdoches', 'town', -94.6554874, 31.6035129, 'HIST-TEX-010', false],
  ['bexar', 'Béxar', 'town', -98.4936282, 29.4241219, 'HIST-TEX-010', false],
  // The 1835 settlement stood against the presidio walls; the present town is across the river, 1.46 miles off (HIST-TEX-025).
  ['goliad', 'Goliad', 'town', -97.3830, 28.6476, 'HIST-TEX-025', false],
  // The plaza of the 1834 plat (King Park); the official point is 0.61 miles north of it (HIST-TEX-025).
  ['refugio', 'Refugio', 'town', -97.274887, 28.296482, 'HIST-TEX-025', false],
  ['la-grange-crossing', 'The Colorado crossing', 'crossing', -96.876647, 29.9055033, 'HIST-TEX-008', false],
  ['columbus-crossing', "Beeson's crossing", 'crossing', -96.5396933, 29.7066232, 'FIC-GONZ-027', false],
];

// The rivers a road may cross only at a crossing, and the places where each may be crossed.
const BARRIERS = ['Guadalupe River', 'Colorado River', 'Brazos River', 'Trinity River', 'San Antonio River'];
const CROSSINGS = {
  'Guadalupe River': ['ford', 'victoria'],
  'Colorado River': ['la-grange-crossing', 'columbus-crossing', 'mina', 'matagorda'],
  'Brazos River': ['san-felipe', 'washington', 'columbia', 'brazoria'],
  // The Atascosito road crossed about three miles north of Liberty, not at the town (HIST-TEX-025).
  'Trinity River': ['atascosito-crossing'],
  'San Antonio River': ['goliad', 'bexar'],
};
// Watercourses that slow a road across them but are not barriers. ceiling: every one of these was crossed
// somewhere particular in 1835; until those fords are found a road crosses wherever the ground is easiest.
const SLOW_WATER = ['San Marcos River', 'Lavaca River', 'Navidad River', 'San Bernard River', 'San Jacinto River', 'Navasota River', 'Buffalo Bayou', 'Peach Creek', 'Sandies Creek', 'Cibolo Creek', 'Plum Creek'];

// The roads: which places each joins (HIST-TEX-006, HIST-TEX-008; courses FIC-GONZ-027).
const ROADS = [
  ['gonzales', 'la-grange-crossing', 'The road to the Colorado'],
  ['la-grange-crossing', 'san-felipe', 'The road to San Felipe'],
  ['washington', 'la-grange-crossing', 'The La Bahía road'],
  ['la-grange-crossing', 'goliad', 'The La Bahía road'],
  ['goliad', 'victoria', 'The Atascosito road'],
  ['victoria', 'columbus-crossing', 'The Atascosito road'],
  ['columbus-crossing', 'san-felipe', 'The Atascosito road'],
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

const roads = [];
for (const [from, to, name] of ROADS) {
  const started = Date.now();
  const cells = route(places[from], places[to]);
  const points = simplify([places[from], ...cells.slice(1, -1), places[to]], 0.03).map(p => ({ x: round(p.x), y: round(p.y) }));
  const miles = points.slice(1).reduce((sum, p, i) => sum + distance(p, points[i]), 0);
  roads.push({ id: `road-${from}-${to}`, from, to, name, kind: 'road', points, miles: round(miles) });
  console.log(`${name}: ${from} to ${to}, ${miles.toFixed(1)} miles, ${points.length} points, ${Date.now() - started} ms`);
}
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
const starts = Object.values(places).filter(p => p.start);
// The data keeps each watercourse as many short reaches drawn downstream; join a name's reaches end to start into
// continuous lines first, so a creek is one line and not forty.
function joinReaches(courses) {
  const byName = new Map();
  for (const course of courses) {
    if (!course.name || course.points.length < 2) continue;
    if (!byName.has(course.name)) byName.set(course.name, []);
    byName.get(course.name).push(course);
  }
  const joined = [];
  const key = p => `${Math.round(p.x * 50)},${Math.round(p.y * 50)}`;
  for (const [name, reaches] of byName) {
    const startsAt = new Map();
    for (const reach of reaches) {
      const k = key(reach.points[0]);
      if (!startsAt.has(k)) startsAt.set(k, []);
      startsAt.get(k).push(reach);
    }
    const hasUpstream = new Set(reaches.flatMap(reach => startsAt.get(key(reach.points.at(-1))) || []));
    const used = new Set();
    const follow = first => {
      const points = [...first.points];
      let reach = first; used.add(reach);
      for (;;) {
        const next = (startsAt.get(key(reach.points.at(-1))) || []).find(r => !used.has(r));
        if (!next) break;
        used.add(next); points.push(...next.points.slice(1)); reach = next;
      }
      joined.push({ name, flow: first.flow, points });
    };
    for (const reach of reaches) if (!hasUpstream.has(reach) && !used.has(reach)) follow(reach);
    for (const reach of reaches) if (!used.has(reach)) follow(reach);
  }
  return joined;
}
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

const output = {
  kind: 'texas-colonies-map', version: 1, builtFrom: 'scripts/build-colonies-map.mjs over public/terrain',
  places, crossings: crossingPoints, roads, watercourses: drawn,
};
const json = JSON.stringify(output);
mkdirSync('public/terrain', { recursive: true });
writeFileSync('public/terrain/colonies-map.json.gz', gzipSync(json, { level: 9 }));
console.log(`Places ${Object.keys(places).length}, roads ${roads.length}, watercourses drawn ${drawn.length}; ${(json.length / 1e6).toFixed(2)} MB JSON, camp ${places['williams-camp'].riverMiles} river miles above the ford`);

// Builds the game's real terrain from USGS data: docs/LAND_GRANTS.md §8, build step 1.
//
//   node scripts/build-terrain.mjs <dem-dir> <nhd-dir>
//
// <dem-dir> holds the 3DEP 1 arc-second GeoTIFFs USGS_1_n{29..32}w{095..099}.tif; <nhd-dir> holds one
// folder per National Hydrography Dataset HU4 (1201 ... 1211), each with NHDFlowline.shp and .dbf.
// Neither is kept in the repository (about 2 GB); where they came from is in
// docs/evidence/terrain-data.json. The output is what the game ships:
//
//   public/terrain/colonies-elevation.bin.gz   the elevation grid: little-endian Uint16 decimetres,
//                                              row by row from the north-west, 0xFFFF where there is no land
//   public/terrain/colonies-water.json.gz      header (grid, projection, origin, sources) and watercourses
//
// **What is real and what is not.** Heights and watercourse courses are measured (USGS, 2021 and
// 2023 releases) and describe the present, not 1835. So this script drops what the present added:
// canals, pipelines, underground conduits and the unnamed paths NHD draws through reservoirs and
// stock tanks. Named rivers keep their path through the modern reservoirs, which is where the river
// ran. It keeps every stream and whether USGS calls it perennial, intermittent or ephemeral today;
// whether a creek ran all year in 1835 is not known and is `FIC-GONZ-026`. The reservoirs' flat
// surfaces stay in the elevation (`ceiling:` at an eighth of a mile they are a flat valley floor).
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { openElevation } from './terrain/geotiff.mjs';
import { readDbf, readShapes } from './terrain/shapefile.mjs';

const [demDir, nhdDir] = process.argv.slice(2);
if (!demDir || !nhdDir) { console.error('usage: node scripts/build-terrain.mjs <dem-dir> <nhd-dir>'); process.exit(2); }

// The settled colonies of 1835 (owner, 2026-09-14): 94-99°W, 28-32°N.
const AREA = { west: -99, east: -94, south: 28, north: 32 };
/** Grid spacing: an eighth of a mile, about 200 m (owner: fine detail everywhere). */
const CELL_MILES = 0.125;
const METRES_PER_MILE = 1609.344;

// Equirectangular about the origin's latitude, in miles: x east, y south, as the game has always used.
// ceiling: at 28° and 32° the east-west scale is off by up to 2.5 per cent; a transverse Mercator or
// per-row scale is the way out if a measured distance on the map ever has to be better than that.
function projection(originLon, originLat) {
  const phi = originLat * Math.PI / 180;
  const milesPerLat = (111132.92 - 559.82 * Math.cos(2 * phi) + 1.175 * Math.cos(4 * phi)) / METRES_PER_MILE;
  const milesPerLon = (111412.84 * Math.cos(phi) - 93.5 * Math.cos(3 * phi)) / METRES_PER_MILE;
  return {
    milesPerLat, milesPerLon,
    toMiles: (lon, lat) => ({ x: (lon - originLon) * milesPerLon, y: (originLat - lat) * milesPerLat }),
  };
}

const FLOW = { 46003: 'intermittent', 46006: 'perennial', 46007: 'ephemeral', 46000: 'unknown' };

function readWatercourses() {
  const lines = [];
  for (const unit of readdirSync(nhdDir).filter(name => /^\d{4}$/.test(name)).sort()) {
    const rows = readDbf(join(nhdDir, unit, 'NHDFlowline.dbf'));
    const shapes = readShapes(join(nhdDir, unit, 'NHDFlowline.shp'));
    let kept = 0;
    rows.forEach((row, index) => {
      const shape = shapes[index];
      if (!shape) return;
      const { box } = shape;
      if (box.maxX < AREA.west || box.minX > AREA.east || box.maxY < AREA.south || box.minY > AREA.north) return;
      const name = row.gnis_name || '';
      const ftype = Number(row.ftype), fcode = Number(row.fcode);
      let flow;
      if (ftype === 460) flow = FLOW[fcode] ?? 'unknown';
      // A path through a waterbody: kept only for a named watercourse, which is a river through a modern reservoir.
      else if (ftype === 558 && name) flow = 'perennial';
      else return; // canals (336), pipelines (428), underground (420), connectors (334), coastline (566), unnamed paths
      // Canals and drainage ditches USGS files as streams or named paths. ceiling: this also drops the mission
      // acequias at Bexar (Espada, San Juan), which did carry water in 1835; add them back with a claim if Bexar is played.
      if (/\b(canal|ditch|outfall|diversion)\b/i.test(name)) return;
      // The smallest unnamed gullies are most of the data and none of the water anybody fetched.
      if (!name && flow !== 'perennial' && Number(row.lengthkm) < 1) return;
      lines.push({ name, flow, parts: shape.parts });
      kept++;
    });
    console.log(`NHD ${unit}: ${rows.length} flowlines, ${kept} kept`);
  }
  return lines;
}

/** Douglas-Peucker on a flat [x0, y0, ...] array, in miles. */
function simplify(flat, tolerance) {
  const count = flat.length / 2;
  if (count <= 2) return Array.from(flat);
  const keep = new Uint8Array(count); keep[0] = keep[count - 1] = 1;
  const stack = [[0, count - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const ax = flat[a * 2], ay = flat[a * 2 + 1], bx = flat[b * 2], by = flat[b * 2 + 1];
    const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy) || 1e-12;
    let worst = 0, at = -1;
    for (let i = a + 1; i < b; i++) {
      const distance = Math.abs(dy * flat[i * 2] - dx * flat[i * 2 + 1] + bx * ay - by * ax) / length;
      if (distance > worst) { worst = distance; at = i; }
    }
    if (worst > tolerance && at > 0) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  const out = [];
  for (let i = 0; i < count; i++) if (keep[i]) out.push(flat[i * 2], flat[i * 2 + 1]);
  return out;
}

/** Where the San Marcos meets the Guadalupe: the origin the game's coordinates have always had. */
function findConfluence(lines) {
  const points = name => lines.filter(line => line.name === name && line.flow === 'perennial')
    .flatMap(line => line.parts.flatMap(part => Array.from({ length: part.length / 2 }, (_, i) => [part[i * 2], part[i * 2 + 1]])))
    .filter(([lon, lat]) => lon > -97.7 && lon < -97.3 && lat > 29.35 && lat < 29.65);
  const guadalupe = points('Guadalupe River'), sanMarcos = points('San Marcos River');
  let best = { distance: Infinity };
  for (const [lon, lat] of sanMarcos) {
    for (const [gLon, gLat] of guadalupe) {
      const distance = Math.hypot((lon - gLon) * Math.cos(29.5 * Math.PI / 180), lat - gLat);
      if (distance < best.distance) best = { distance, lon: gLon, lat: gLat };
    }
  }
  if (!Number.isFinite(best.distance) || best.distance > 0.002) throw new Error('Could not find where the San Marcos meets the Guadalupe');
  return best;
}

const lines = readWatercourses();
const confluence = findConfluence(lines);
const project = projection(confluence.lon, confluence.lat);
console.log(`Origin: the confluence at ${confluence.lat.toFixed(5)}, ${confluence.lon.toFixed(5)}`);

// The grid covers the area's projected box.
const corners = [[AREA.west, AREA.north], [AREA.east, AREA.north], [AREA.west, AREA.south], [AREA.east, AREA.south]].map(([lon, lat]) => project.toMiles(lon, lat));
const minX = Math.floor(Math.min(...corners.map(c => c.x))), maxX = Math.ceil(Math.max(...corners.map(c => c.x)));
const minY = Math.floor(Math.min(...corners.map(c => c.y))), maxY = Math.ceil(Math.max(...corners.map(c => c.y)));
const columns = Math.round((maxX - minX) / CELL_MILES), rows = Math.round((maxY - minY) / CELL_MILES);
console.log(`Grid ${columns} x ${rows} at ${CELL_MILES} mile, x ${minX}..${maxX}, y ${minY}..${maxY}`);

// Each cell is the mean of every 1 arc-second sample whose centre falls in it.
const sum = new Float64Array(columns * rows), count = new Uint16Array(columns * rows);
const tiles = readdirSync(demDir).filter(name => /^USGS_1_n\d\dw\d{3}\.tif$/.test(name)).sort();
for (const name of tiles) {
  const started = Date.now();
  const dem = openElevation(join(demDir, name));
  for (let index = 0; index < dem.tiles; index++) {
    const values = dem.tile(index);
    const tileColumn = index % dem.across, tileRow = Math.floor(index / dem.across);
    for (let y = 0; y < dem.tileHeight; y++) {
      const row = tileRow * dem.tileHeight + y;
      if (row >= dem.height) break;
      const lat = dem.latOf(row);
      if (lat < AREA.south || lat > AREA.north) continue;
      const gy = Math.floor(((confluence.lat - lat) * project.milesPerLat - minY) / CELL_MILES);
      if (gy < 0 || gy >= rows) continue;
      for (let x = 0; x < dem.tileWidth; x++) {
        const column = tileColumn * dem.tileWidth + x;
        if (column >= dem.width) break;
        const value = values[y * dem.tileWidth + x];
        if (!(value > -100)) continue;
        const lon = dem.lonOf(column);
        if (lon < AREA.west || lon > AREA.east) continue;
        const gx = Math.floor(((lon - confluence.lon) * project.milesPerLon - minX) / CELL_MILES);
        if (gx < 0 || gx >= columns) continue;
        const cell = gy * columns + gx;
        sum[cell] += value; if (count[cell] < 65535) count[cell]++;
      }
    }
  }
  console.log(`${name}: ${((Date.now() - started) / 1000).toFixed(1)} s`);
}
const elevation = new Uint16Array(columns * rows);
let land = 0, low = Infinity, high = -Infinity;
for (let cell = 0; cell < elevation.length; cell++) {
  if (!count[cell]) { elevation[cell] = 0xffff; continue; }
  const metres = sum[cell] / count[cell];
  elevation[cell] = Math.max(0, Math.min(65534, Math.round(metres * 10)));
  land++; low = Math.min(low, metres); high = Math.max(high, metres);
}
console.log(`Land cells ${land} of ${elevation.length}; ${low.toFixed(1)} m to ${high.toFixed(1)} m`);

// Watercourses in miles, simplified to about 50 feet and stored in hundredths of a mile.
const names = [], nameIndex = new Map();
const courses = [];
let points = 0;
for (const line of lines) {
  if (line.name && !nameIndex.has(line.name)) { nameIndex.set(line.name, names.length); names.push(line.name); }
  for (const part of line.parts) {
    const miles = new Float64Array(part.length);
    for (let i = 0; i < part.length; i += 2) { const p = project.toMiles(part[i], part[i + 1]); miles[i] = p.x; miles[i + 1] = p.y; }
    const simple = simplify(miles, 0.01);
    const coords = simple.map(value => Math.round(value * 100));
    points += coords.length / 2;
    courses.push([line.name ? nameIndex.get(line.name) : -1, line.flow[0], ...coords]);
  }
}
console.log(`Watercourses: ${courses.length} lines, ${points} points, ${names.length} names`);

const header = {
  kind: 'texas-colonies-terrain', version: 1, builtFrom: 'docs/evidence/terrain-data.json',
  area: AREA, origin: { name: 'confluence of the San Marcos and Guadalupe', lon: +confluence.lon.toFixed(6), lat: +confluence.lat.toFixed(6) },
  projection: { kind: 'equirectangular', milesPerLon: +project.milesPerLon.toFixed(6), milesPerLat: +project.milesPerLat.toFixed(6), xEast: true, ySouth: true },
  grid: { minX, minY, columns, rows, cell: CELL_MILES, units: 'decimetres', noData: 65535, file: 'colonies-elevation.bin.gz' },
  water: { units: 'hundredths of a mile', flow: { p: 'perennial', i: 'intermittent', e: 'ephemeral', u: 'unknown' }, names, courses },
};
mkdirSync('public/terrain', { recursive: true });
const elevationGz = gzipSync(Buffer.from(elevation.buffer), { level: 9 });
const waterGz = gzipSync(JSON.stringify(header), { level: 9 });
writeFileSync('public/terrain/colonies-elevation.bin.gz', elevationGz);
writeFileSync('public/terrain/colonies-water.json.gz', waterGz);
console.log(`Wrote elevation ${(elevationGz.length / 1e6).toFixed(2)} MB and water ${(waterGz.length / 1e6).toFixed(2)} MB (gzip)`);

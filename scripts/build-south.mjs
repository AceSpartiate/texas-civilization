// Builds the country south of the colonies' box to the Nueces, for the simulation: docs/MAP_ACCURACY.md §13.
//
//   node scripts/build-south.mjs <raw-dir>
//
// Owner, 2026-09-25 (docs/BATTLES.md §2b.4): "the map extends south to the Nueces", so a man who went south is really at
// San Patricio and the fights at San Patricio and Agua Dulce are drawn where they happened. The box (94-99°W, 28-32°N) is
// what the simulation reads - heights, water, woods - and its built files stay byte for byte what they were. This writes a
// strip on the box's own lattice below it, 27.6-28°N over the box's longitudes, which sim/terrain-data.mjs and
// sim/woods.mjs lay under the box's grid when they load it:
//
//   public/terrain/south-elevation.bin.gz   heights: little-endian Uint16 decimetres, row by row from the north-west,
//                                           0xFFFF where there is no land - the box's own format
//   public/terrain/south-water.json.gz      its grid (rows of the box's lattice), its watercourses in the box's format,
//                                           and the woods' stand of every cell (base64, the byte order of colonies-woods.bin)
//
// **The same data and the same rules as the box's.** Heights: USGS 3DEP 1 arc-second, each cell the mean of the samples in
// it (scripts/build-terrain.mjs's rule), from the tiles downloaded for the country outside the box (docs/evidence/
// outside-data.json). Water: USGS NHD NHDFlowline, the flowlines scripts/build-terrain.mjs keeps, filtered and simplified as
// it filters and simplifies; only those lying wholly south of 28°N - a flowline crossing 28°N is already in the box's own
// courses, whole, from the box's own download. Woods: the stands scripts/build-outside.mjs filed from LANDFIRE by the box's
// rules for exactly these cells (outside-woods.bin.gz, the same lattice and byte order), copied row for row. Nothing here is
// sent to the page: the page draws this country from the outside layer, which already covered it (docs/MAP_ACCURACY.md §8).
//
// Deterministic: the same raw data gives the same two files, byte for byte.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { openElevation } from './terrain/geotiff.mjs';
import { readDbf, readShapes } from './terrain/shapefile.mjs';
import { boxTerrain } from '../sim/terrain-data.mjs';

const raw = process.argv[2];
if (!raw) { console.error('usage: node scripts/build-south.mjs <raw-dir>'); process.exit(2); }

/** The strip: the box's longitudes, from its south edge at 28°N down to 27.6°N, below Agua Dulce Creek. */
const SOUTH_AREA = Object.freeze({ west: -99, east: -94, south: 27.6, north: 28 });

const box = boxTerrain();
const { origin, projection, grid } = box.header;
const { milesPerLon, milesPerLat } = projection;
const toY = lat => (origin.lat - lat) * milesPerLat;
const latOfRow = row => origin.lat - (grid.minY + (row + 0.5) * grid.cell) / milesPerLat;
// The first row of the box's lattice whose cells' centres are south of 28°N (the box keeps every cell whose centre is in it,
// as scripts/build-outside.mjs's `inBox` does): the box's own last rows there are empty.
let row0 = 0;
while (latOfRow(row0) >= SOUTH_AREA.north) row0++;
const rowEnd = Math.ceil((toY(SOUTH_AREA.south) - grid.minY) / grid.cell);
const columns = grid.columns, rows = rowEnd - row0;
const minY = grid.minY + row0 * grid.cell;
console.log(`The strip: rows ${row0}..${rowEnd - 1} of the box's lattice (${columns} x ${rows}), y ${minY}..${grid.minY + rowEnd * grid.cell}`);

// ---- Heights ------------------------------------------------------------------------------------------------------
const sum = new Float64Array(columns * rows), count = new Uint16Array(columns * rows);
const demDir = join(raw, 'dem');
for (const name of readdirSync(demDir).filter(file => /^USGS_1_n\d\dw\d{3}\.tif$/.test(file)).sort()) {
  // A tile nYYwXXX covers YY-1..YY °N and XXX-1..XXX °W: only those touching the strip are opened.
  const [, n, w] = name.match(/n(\d\d)w(\d{3})/).map(Number);
  if (n - 1 > SOUTH_AREA.north || n < SOUTH_AREA.south || -w > SOUTH_AREA.east || -w + 1 < SOUTH_AREA.west) continue;
  const dem = openElevation(join(demDir, name));
  for (let index = 0; index < dem.tiles; index++) {
    const values = dem.tile(index);
    const tileColumn = index % dem.across, tileRow = Math.floor(index / dem.across);
    for (let y = 0; y < dem.tileHeight; y++) {
      const r = tileRow * dem.tileHeight + y;
      if (r >= dem.height) break;
      const lat = dem.latOf(r);
      if (lat < SOUTH_AREA.south - 0.01 || lat >= SOUTH_AREA.north + 0.01) continue;
      const gy = Math.floor((toY(lat) - minY) / grid.cell);
      if (gy < 0 || gy >= rows) continue;
      for (let x = 0; x < dem.tileWidth; x++) {
        const c = tileColumn * dem.tileWidth + x;
        if (c >= dem.width) break;
        const value = values[y * dem.tileWidth + x];
        if (!(value > -100)) continue;
        const lon = dem.lonOf(c);
        if (lon < SOUTH_AREA.west || lon > SOUTH_AREA.east) continue;
        const gx = Math.floor(((lon - origin.lon) * milesPerLon - grid.minX) / grid.cell);
        if (gx < 0 || gx >= columns) continue;
        const cell = gy * columns + gx;
        sum[cell] += value; if (count[cell] < 65535) count[cell]++;
      }
    }
  }
  console.log(`${name}`);
}
const elevation = new Uint16Array(columns * rows);
let land = 0;
for (let cell = 0; cell < elevation.length; cell++) {
  if (!count[cell]) { elevation[cell] = grid.noData; continue; }
  elevation[cell] = Math.max(0, Math.min(65534, Math.round(sum[cell] / count[cell] * 10)));
  land++;
}
console.log(`Land cells ${land} of ${elevation.length}`);

// ---- Water (scripts/build-terrain.mjs's rules) ----------------------------------------------------------------------
const FLOW = { 46003: 'intermittent', 46006: 'perennial', 46007: 'ephemeral', 46000: 'unknown' };
function simplify(flat, tolerance) {
  const n = flat.length / 2;
  if (n <= 2) return Array.from(flat);
  const keep = new Uint8Array(n); keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const ax = flat[a * 2], ay = flat[a * 2 + 1], bx = flat[b * 2], by = flat[b * 2 + 1];
    const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy) || 1e-12;
    let worst = 0, at = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * flat[i * 2] - dx * flat[i * 2 + 1] + bx * ay - by * ax) / length;
      if (d > worst) { worst = d; at = i; }
    }
    if (worst > tolerance && at > 0) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(flat[i * 2], flat[i * 2 + 1]);
  return out;
}
const names = [], nameIndex = new Map(), courses = [];
const nhdDir = join(raw, 'nhd');
for (const unit of readdirSync(nhdDir).filter(name => /^\d{4}$/.test(name)).sort()) {
  const dbf = readDbf(join(nhdDir, unit, 'NHDFlowline.dbf'));
  const shapes = readShapes(join(nhdDir, unit, 'NHDFlowline.shp'));
  let kept = 0;
  dbf.forEach((record, index) => {
    const shape = shapes[index];
    if (!shape) return;
    const { box: b } = shape;
    // Wholly south of the box: a flowline reaching 28°N is in the box's own courses already, whole.
    if (b.maxX < SOUTH_AREA.west || b.minX > SOUTH_AREA.east || b.maxY < SOUTH_AREA.south || b.maxY >= SOUTH_AREA.north) return;
    const name = record.gnis_name || '';
    const ftype = Number(record.ftype), fcode = Number(record.fcode);
    let flow;
    if (ftype === 460) flow = FLOW[fcode] ?? 'unknown';
    else if (ftype === 558 && name) flow = 'perennial';
    else return;
    if (/\b(canal|ditch|outfall|diversion)\b/i.test(name)) return;
    if (!name && flow !== 'perennial' && Number(record.lengthkm) < 1) return;
    if (name && !nameIndex.has(name)) { nameIndex.set(name, names.length); names.push(name); }
    for (const part of shape.parts) {
      const miles = new Float64Array(part.length);
      for (let i = 0; i < part.length; i += 2) { miles[i] = (part[i] - origin.lon) * milesPerLon; miles[i + 1] = (origin.lat - part[i + 1]) * milesPerLat; }
      courses.push([name ? nameIndex.get(name) : -1, flow[0], ...simplify(miles, 0.01).map(value => Math.round(value * 100))]);
    }
    kept++;
  });
  if (kept) console.log(`NHD ${unit}: ${kept} flowlines south of the box`);
}

// ---- Woods (scripts/build-outside.mjs's stands for these very cells) --------------------------------------------------
const outsideHeader = JSON.parse(gunzipSync(readFileSync('public/terrain/outside-woods.json.gz')).toString('utf8'));
const outsideCells = gunzipSync(readFileSync(`public/terrain/${outsideHeader.grid.file}`));
const boxWoods = JSON.parse(gunzipSync(readFileSync('public/terrain/colonies-woods.json.gz')).toString('utf8'));
if (outsideHeader.stands.map(s => s.id ?? s).join() !== boxWoods.stands.map(s => s.id ?? s).join()) throw new Error('The outside woods are not filed in the box\'s order');
const og = outsideHeader.grid, column0 = Math.round((grid.minX - og.minX) / og.cell), rowOffset = Math.round((minY - og.minY) / og.cell);
const stands = Buffer.alloc(columns * rows);
for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) stands[r * columns + c] = outsideCells[(r + rowOffset) * og.columns + column0 + c];

const header = {
  kind: 'texas-south-strip', version: 1, builtFrom: 'scripts/build-south.mjs over docs/evidence/outside-data.json\'s raw data',
  area: SOUTH_AREA,
  note: 'Rows of the box\'s own lattice below it: sim/terrain-data.mjs and sim/woods.mjs lay them under the box\'s grid. docs/MAP_ACCURACY.md §13.',
  sources: {
    heights: 'USGS 3DEP 1 arc-second (tiles n28w097, n28w098, n28w099), each cell the mean of its samples; public domain',
    water: 'USGS NHD NHDFlowline, flowlines wholly south of 28°N, filtered and simplified as scripts/build-terrain.mjs does; public domain',
    woods: 'LANDFIRE LF2016 Biophysical Settings filed as the biomes of 1836 by scripts/build-outside.mjs (outside-woods.bin.gz); public domain',
  },
  grid: { minX: grid.minX, minY, columns, rows, cell: grid.cell, row0, units: 'decimetres', noData: grid.noData, file: 'south-elevation.bin.gz' },
  water: { units: 'hundredths of a mile', flow: box.header.water.flow, names, courses },
  woods: { order: 'colonies-woods.json.gz stands', cells: stands.toString('base64') },
};
mkdirSync('public/terrain', { recursive: true });
const elevationGz = gzipSync(Buffer.from(elevation.buffer), { level: 9 }), waterGz = gzipSync(JSON.stringify(header), { level: 9 });
writeFileSync('public/terrain/south-elevation.bin.gz', elevationGz);
writeFileSync('public/terrain/south-water.json.gz', waterGz);
console.log(`Watercourses ${courses.length}, ${names.length} names; wrote elevation ${(elevationGz.length / 1e3).toFixed(0)} KB and water ${(waterGz.length / 1e3).toFixed(0)} KB (gzip)`);

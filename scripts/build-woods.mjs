// Builds the country of 1836 on the real land of the colonies: docs/BIOMES.md §7, docs/WOODS_AND_BUILDING.md §4.
//
//   node --max-old-space-size=8192 scripts/build-woods.mjs <landfire-bps.tif> <landfire-bps.tif.vat.dbf> <tx_eco_l4-dir>
//
// <landfire-bps.tif> is LANDFIRE's Biophysical Settings (LF2016_BPS) from the LANDFIRE Product Service, resampled to 240 m in
// geographic coordinates, with its attribute table: since 2026-09-19 the whole map's raster (93.5-100.5°W, 25.8-32°N, job
// 371d8dc9, docs/evidence/outside-data.json), which covers the box too. <tx_eco_l4-dir> holds EPA's Level IV ecoregions of Texas
// (tx_eco_l4.shp and .dbf). Neither is kept in the repository. It also reads the game's own built files: the elevation grid's
// header and watercourses (colonies-water.json.gz, for the Nueces, the canebrakes' creeks, the San Antonio and San Pedro Creek)
// and the towns (colonies-map.json.gz). The output is what the game ships:
//
//   public/terrain/colonies-woods.bin.gz   one byte a cell, on exactly the elevation grid: the stand (the header's `stands`)
//   public/terrain/colonies-woods.json.gz  the stands, where each came from, the rules, and the ecoregions on a one-mile grid
//
// The grid a class of the week of 2026-09-15 was made on is kept beside it, as it was, in colonies-woods-2016.* (sim/woods.mjs).
//
// **What this is.** LANDFIRE models the vegetation "that may have been dominant on the landscape prior to Euro-American
// settlement" from today's soils, climate and a reconstructed fire regime: the pattern, not a survey of 1835. It is read for 1836
// by the travellers' pattern (docs/BIOMES.md, `HIST-TEX-094` to `-108`), by the rules in scripts/terrain/biomes.mjs
// (`FIC-GONZ-060`), and the towns' farmland is laid over it (`FIC-GONZ-062`). What stands in each stand is sim/woods.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { openClasses } from './terrain/geotiff.mjs';
import { joinReaches } from './terrain/lines.mjs';
import { readDbf, readShapes } from './terrain/shapefile.mjs';
import { BEXAR_FIELDS, BY_MODEL, CANEBRAKES, CANE_TAKES, STAND_IDS, TOWN_RING_MILES, modelOf, nuecesSide, standOfSetting } from './terrain/biomes.mjs';
import { realTerrain } from '../sim/terrain-data.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';

const [bpsPath, bpsTablePath, ecoDir] = process.argv.slice(2);
if (!bpsPath || !bpsTablePath || !ecoDir) { console.error('usage: node scripts/build-woods.mjs <landfire-bps.tif> <landfire-bps.tif.vat.dbf> <tx_eco_l4-dir>'); process.exit(2); }
export { STAND_IDS };
const code = id => STAND_IDS.indexOf(id);

const table = readDbf(bpsTablePath);
const modelOfValue = new Map();
const unfiled = new Set();
for (const row of table) {
  const model = modelOf(row);
  if (standOfSetting(model, { lon: 0, lat: 0, eco: '' }) === undefined) unfiled.add(`${row.bps_model} ${row.bps_name}`);
  modelOfValue.set(Number(row.value), model);
}
if (unfiled.size) { console.error(`Settings not filed under a stand:\n  ${[...unfiled].join('\n  ')}`); process.exit(1); }

// The grid and projection the elevation was built on.
const terrain = realTerrain();
const water = terrain.header;
const { minX, minY, columns, rows, cell } = water.grid;
const { milesPerLon, milesPerLat } = water.projection;
const origin = water.origin;
const lonOf = x => origin.lon + x / milesPerLon;
const latOf = y => origin.lat - y / milesPerLat;
const toMiles = (lon, lat) => ({ x: (lon - origin.lon) * milesPerLon, y: (origin.lat - lat) * milesPerLat });

// ---- EPA Level IV ecoregions, on a one-mile grid ------------------------------------------------------------
// The shapefile is in USGS Albers Equal Area (NAD83/GRS80; standard parallels 29.5° and 45.5°, origin 23°N 96°W).
// Snyder, Map Projections - A Working Manual (1987), pp. 101-102, ellipsoidal forward equations.
const A = 6378137, F = 1 / 298.257222101, E2 = 2 * F - F * F, E = Math.sqrt(E2);
const rad = d => d * Math.PI / 180;
const qOf = phi => { const s = Math.sin(phi); return (1 - E2) * (s / (1 - E2 * s * s) - (1 / (2 * E)) * Math.log((1 - E * s) / (1 + E * s))); };
const mOf = phi => Math.cos(phi) / Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
const [phi1, phi2, phi0, lam0] = [rad(29.5), rad(45.5), rad(23), rad(-96)];
const n = (mOf(phi1) ** 2 - mOf(phi2) ** 2) / (qOf(phi2) - qOf(phi1));
const C = mOf(phi1) ** 2 + n * qOf(phi1);
const rho0 = A * Math.sqrt(C - n * qOf(phi0)) / n;
const albers = (lon, lat) => {
  const rho = A * Math.sqrt(C - n * qOf(rad(lat))) / n, theta = n * (rad(lon) - lam0);
  return { x: rho * Math.sin(theta), y: rho0 - rho * Math.cos(theta) };
};

const ecoRows = readDbf(join(ecoDir, 'tx_eco_l4.dbf'));
const ecoShapes = readShapes(join(ecoDir, 'tx_eco_l4.shp'));
const regions = [];
const regionIndex = new Map();
const polygons = ecoShapes.map((shape, i) => {
  const regionCode = ecoRows[i].us_l4code;
  if (!regionIndex.has(regionCode)) { regionIndex.set(regionCode, regions.length + 1); regions.push({ code: regionCode, name: ecoRows[i].us_l4name }); }
  return { shape, region: regionIndex.get(regionCode) };
});
const insideRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const ECO_CELL = 1;
const ecoColumns = Math.ceil(columns * cell / ECO_CELL), ecoRowsCount = Math.ceil(rows * cell / ECO_CELL);
const eco = new Uint8Array(ecoColumns * ecoRowsCount);
for (let row = 0; row < ecoRowsCount; row++) {
  for (let column = 0; column < ecoColumns; column++) {
    const p = albers(lonOf(minX + (column + 0.5) * ECO_CELL), latOf(minY + (row + 0.5) * ECO_CELL));
    for (const { shape, region } of polygons) {
      const { box } = shape;
      if (p.x < box.minX || p.x > box.maxX || p.y < box.minY || p.y > box.maxY) continue;
      // Even-odd over every ring, so holes are holes.
      let inside = false;
      for (const ring of shape.parts) if (insideRing(p.x, p.y, ring)) inside = !inside;
      if (inside) { eco[row * ecoColumns + column] = region; break; }
    }
  }
}
const ecoCodeAt = (x, y) => {
  const c = Math.floor((x - minX) / ECO_CELL), r = Math.floor((y - minY) / ECO_CELL);
  const value = c >= 0 && r >= 0 && c < ecoColumns && r < ecoRowsCount ? eco[r * ecoColumns + c] : 0;
  return value ? regions[value - 1].code : '';
};

// ---- The Nueces line ------------------------------------------------------------------------------------------
// The river the box draws (it enters at the box's west edge near 28.1°N and leaves by its south edge): inside the box, a place
// south of it is the Nueces Strip. scripts/build-outside.mjs draws the same line from the river's head to its mouth.
const courseLonLat = course => course.points.map(p => ({ lon: lonOf(p.x), lat: latOf(p.y) }));
// Its reaches joined end to end (the data holds it as some two hundred short flowlines), and only the main stem: a scrap of a
// side channel a few hundred yards long would flip the side of a line of cells north of it.
const lengthOf = points => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
const nueces = joinReaches(terrain.courses.filter(course => course.name === 'Nueces River')).filter(line => lengthOf(line.points) >= 3).map(courseLonLat);
console.log(`The Nueces: ${nueces.length} lines, ${nueces.map(line => line.length).join(', ')} points`);
const southWestOfNueces = nuecesSide(nueces, null);

// ---- Filing every cell ------------------------------------------------------------------------------------------
const bps = openClasses(bpsPath);
const stands = new Uint8Array(columns * rows);
const settingCells = new Map();
let strip = 0;
for (let row = 0; row < rows; row++) {
  const y = minY + (row + 0.5) * cell, lat = latOf(y);
  for (let column = 0; column < columns; column++) {
    const x = minX + (column + 0.5) * cell, lon = lonOf(x);
    const value = bps.at(lon, lat);
    if (value === null) continue;
    const model = modelOfValue.get(value) ?? '-9999';
    const place = { lon, lat, eco: ecoCodeAt(x, y), southWestOfNueces: false };
    if (model === '13900' || model === '13920') { place.southWestOfNueces = southWestOfNueces(lon, lat); if (place.southWestOfNueces) strip++; }
    const stand = standOfSetting(model, place);
    stands[row * columns + column] = code(stand);
    settingCells.set(model, (settingCells.get(model) || 0) + 1);
  }
}
console.log(`Filed; ${strip} thornscrub cells south-west of the Nueces`);

// ---- What is laid over the data ---------------------------------------------------------------------------------
/** Every cell whose middle is within `miles` of a line (in the game's miles), passed to `mark(index)`. */
function nearLine(points, miles, mark) {
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1], b = points[k];
    const c0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - miles - minX) / cell)), c1 = Math.min(columns - 1, Math.floor((Math.max(a.x, b.x) + miles - minX) / cell));
    const r0 = Math.max(0, Math.floor((Math.min(a.y, b.y) - miles - minY) / cell)), r1 = Math.min(rows - 1, Math.floor((Math.max(a.y, b.y) + miles - minY) / cell));
    const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = minX + (c + 0.5) * cell, py = minY + (r + 0.5) * cell;
      const t = length ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / length)) : 0;
      if (Math.hypot(px - a.x - dx * t, py - a.y - dy * t) <= miles) mark(r * columns + c);
    }
  }
}
const WATER = code('water'), NONE = code('none');
const overlays = {};

// The canebrakes (HIST-TEX-100): the reach of each creek Holley describes, the cane either side of it.
for (const brake of CANEBRAKES) {
  let cells = 0;
  const take = new Set(CANE_TAKES.map(code));
  for (const course of terrain.courses.filter(c => c.name === brake.name)) {
    const inReach = course.points.filter(p => { const lon = lonOf(p.x), lat = latOf(p.y); return lon >= brake.west && lon <= brake.east && lat >= brake.south && lat <= brake.north; });
    // Runs of the course inside the reach, so a line is never drawn across a gap.
    let run = [];
    const flush = () => { if (run.length >= 2) nearLine(run, brake.miles, i => { if (take.has(stands[i])) { stands[i] = code('canebrake'); cells++; } }); run = []; };
    for (const p of course.points) { if (inReach.includes(p)) run.push(p); else flush(); }
    flush();
  }
  overlays[brake.name] = cells;
  console.log(`${brake.name}: ${cells} cells of canebrake`);
}

// Béxar's farmland (HIST-TEX-098, FIC-GONZ-062): the San Antonio from its head to Espada, San Pedro Creek from its springs, the
// Alamo's own fields. Inside it no woods but the bank's (sim/woods.mjs `bank`); the water stays water.
const places = coloniesMap().places;
{
  const fields = code('fields');
  let cells = 0;
  const field = i => { if (stands[i] !== WATER && stands[i] !== NONE && stands[i] !== fields) { stands[i] = fields; cells++; } };
  const { river, creek, alamo } = BEXAR_FIELDS;
  for (const course of terrain.courses.filter(c => c.name === river.name)) {
    let run = [];
    const flush = () => { if (run.length >= 2) nearLine(run, river.miles, field); run = []; };
    for (const p of course.points) { const lat = latOf(p.y); if (lat <= river.north && lat >= river.south) run.push(p); else flush(); }
    flush();
  }
  const springs = toMiles(creek.springs.lon, creek.springs.lat);
  for (const course of terrain.courses.filter(c => c.name === creek.name && c.points.some(p => Math.hypot(p.x - springs.x, p.y - springs.y) < 6))) {
    // The springs to the creek's first drawn point, and on down it.
    const first = course.points.reduce((best, p) => Math.hypot(p.x - springs.x, p.y - springs.y) < Math.hypot(best.x - springs.x, best.y - springs.y) ? p : best);
    nearLine([springs, first], creek.miles, field);
    nearLine(course.points, creek.miles, field);
  }
  const bexar = places.bexar, church = { x: bexar.x + alamo.eastOfPlaza, y: bexar.y };
  nearLine([church, church], alamo.miles, field);
  for (const mission of BEXAR_FIELDS.missions) { const p = toMiles(mission.lon, mission.lat); nearLine([p, p], BEXAR_FIELDS.missionMiles, field); }
  overlays.bexar = cells;
  console.log(`Béxar's fields: ${cells} cells (${(cells * cell * cell).toFixed(1)} square miles)`);
}
// Every other town's cleared ring.
{
  const fields = code('fields');
  const rings = {};
  for (const [id, town] of Object.entries(places)) {
    if (town.kind !== 'town' || id === 'bexar') continue;
    let cells = 0;
    nearLine([town, town], TOWN_RING_MILES, i => { if (stands[i] !== WATER && stands[i] !== NONE && stands[i] !== fields) { stands[i] = fields; cells++; } });
    rings[id] = cells;
  }
  overlays.townRings = rings;
  console.log(`Town rings: ${Object.entries(rings).map(([id, n]) => `${id} ${n}`).join(', ')}`);
}

const tally = new Array(STAND_IDS.length).fill(0);
for (const value of stands) tally[value]++;

const header = {
  kind: 'colonies-woods',
  version: 2,
  builtFrom: {
    vegetation: 'LANDFIRE LF2016_BPS (Biophysical Settings), LANDFIRE Product Service, 100.5-93.5W 25.8-32N, 240 m, EPSG:4326, job 371d8dc9 (2026-09-18), read over the box',
    ecoregions: 'U.S. EPA Level IV Ecoregions of Texas, tx_eco_l4 (2011)',
    rules: 'docs/BIOMES.md §7, scripts/terrain/biomes.mjs (FIC-GONZ-060, FIC-GONZ-062); watercourses and towns from public/terrain',
  },
  grid: { minX, minY, columns, rows, cell, file: 'colonies-woods.bin.gz', note: 'one byte a cell: the index into stands; aligned with colonies-elevation.bin.gz' },
  stands: STAND_IDS.map((id, index) => ({ id, models: BY_MODEL[id] || [], cells: tally[index] })),
  overlays,
  settings: table.filter(row => row.bps_model !== '-9999' && settingCells.has(modelOf(row))).map(row => ({ value: Number(row.value), model: row.bps_model, name: row.bps_name, stand: standOfSetting(modelOf(row), { lon: 0, lat: 0, eco: '' }), cells: settingCells.get(modelOf(row)) })),
  ecoregions: { cell: ECO_CELL, columns: ecoColumns, rows: ecoRowsCount, regions, grid: Buffer.from(eco).toString('base64'), note: 'one byte a one-mile cell: 0 outside Texas, else 1 + index into regions' },
};
const standsGz = gzipSync(Buffer.from(stands.buffer), { level: 9 });
const headerGz = gzipSync(JSON.stringify(header), { level: 9 });
writeFileSync('public/terrain/colonies-woods.bin.gz', standsGz);
writeFileSync('public/terrain/colonies-woods.json.gz', headerGz);
console.log(STAND_IDS.map((id, i) => `${id} ${(100 * tally[i] / stands.length).toFixed(2)}%`).join(', '));
console.log(`Wrote stands ${(standsGz.length / 1e6).toFixed(2)} MB and header ${(headerGz.length / 1e3).toFixed(0)} KB (gzip); ${regions.length} ecoregions`);

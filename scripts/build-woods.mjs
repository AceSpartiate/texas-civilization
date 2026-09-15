// Builds where the woods stood on the real land of the colonies: docs/WOODS_AND_BUILDING.md §4, build step 1.
//
//   node scripts/build-woods.mjs <landfire-bps.tif> <landfire-bps.tif.vat.dbf> <tx_eco_l4-dir>
//
// <landfire-bps.tif> is LANDFIRE's Biophysical Settings (LF2016_BPS) for 99-94°W, 28-32°N from the LANDFIRE
// Product Service, resampled to 240 m in geographic coordinates, with its attribute table; <tx_eco_l4-dir> holds
// EPA's Level IV ecoregions of Texas (tx_eco_l4.shp and .dbf). Neither is kept in the repository; where they came
// from is in docs/evidence/woods-data.json. The output is what the game ships:
//
//   public/terrain/colonies-woods.bin.gz   one byte a cell, on exactly the elevation grid (colonies-water.json.gz
//                                          header: minX, minY, columns, rows, an eighth of a mile): the stand
//   public/terrain/colonies-woods.json.gz  the stands, where each came from, and the ecoregions on a one-mile grid
//
// **What this is.** LANDFIRE models the vegetation "that may have been dominant on the landscape prior to
// Euro-American settlement" from today's soils, climate and a reconstructed fire regime. It is the pattern, not a
// survey of 1835. Which trees stand in each kind of woods, and how many, is sim/woods.mjs (`FIC-GONZ-032`, with the
// floodplain density and the travellers' trees `HIST-TEX-016`).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { openClasses } from './terrain/geotiff.mjs';
import { readDbf, readShapes } from './terrain/shapefile.mjs';

const [bpsPath, bpsTablePath, ecoDir] = process.argv.slice(2);
if (!bpsPath || !bpsTablePath || !ecoDir) { console.error('usage: node scripts/build-woods.mjs <landfire-bps.tif> <landfire-bps.tif.vat.dbf> <tx_eco_l4-dir>'); process.exit(2); }

/**
 * The game's stands, in byte order. 0 is off the land. Keep in step with STANDS in sim/woods.mjs.
 * Each LANDFIRE setting is filed by its model number, the first five digits of `bps_model`.
 */
export const STAND_IDS = ['none', 'prairie', 'post-oak', 'bottomland', 'creek', 'pine', 'live-oak', 'hill-savanna', 'brush', 'marsh', 'water'];
const BY_MODEL = {
  // Grasslands: coastal, blackland, southeastern tallgrass, mixedgrass, saline and calcareous prairie, dunes, sand
  // sheet, Tamaulipan savanna grassland and clay grassland, desert swale, sand prairie.
  prairie: ['14340', '14220', '14230', '11320', '14860', '14290', '14370', '14420', '14380', '14400', '15040', '11480', '10940', '14390'],
  'post-oak': ['15190', '13080', '13040', '14100', '15060', '13230'],
  bottomland: ['14730', '14710', '11620', '14670', '14950'],
  creek: ['14740', '14720', '15250', '14760'],
  pine: ['13580', '13710', '14580', '13780', '13480', '14510'],
  'live-oak': ['13380', '13390'],
  'hill-savanna': ['13830', '15230', '15240', '13930'],
  brush: ['13900', '13920', '11110'],
  marsh: ['14900', '14800'],
  water: ['11'],
  none: ['31', '-9999'],
};
const standOfModel = {};
for (const [stand, models] of Object.entries(BY_MODEL)) for (const model of models) standOfModel[model] = STAND_IDS.indexOf(stand);

const table = readDbf(bpsTablePath);
const standOfValue = new Map();
const unfiled = new Set();
for (const row of table) {
  const model = row.bps_model === '-9999' ? '-9999' : row.bps_model.split('_')[0];
  const stand = standOfModel[model];
  if (stand === undefined) unfiled.add(`${row.bps_model} ${row.bps_name}`);
  standOfValue.set(Number(row.value), stand ?? 0);
}
if (unfiled.size) { console.error(`Settings not filed under a stand:\n  ${[...unfiled].join('\n  ')}`); process.exit(1); }

// The grid and projection the elevation was built on.
const water = JSON.parse(gunzipSync(readFileSync('public/terrain/colonies-water.json.gz')).toString('utf8'));
const { minX, minY, columns, rows, cell } = water.grid;
const { milesPerLon, milesPerLat } = water.projection;
const origin = water.origin;
const lonOf = x => origin.lon + x / milesPerLon;
const latOf = y => origin.lat - y / milesPerLat;

const bps = openClasses(bpsPath);
const stands = new Uint8Array(columns * rows);
const tally = new Array(STAND_IDS.length).fill(0);
for (let row = 0; row < rows; row++) {
  const lat = latOf(minY + (row + 0.5) * cell);
  for (let column = 0; column < columns; column++) {
    const value = bps.at(lonOf(minX + (column + 0.5) * cell), lat);
    const stand = value === null ? 0 : standOfValue.get(value) ?? 0;
    stands[row * columns + column] = stand;
    tally[stand]++;
  }
}

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
  const code = ecoRows[i].us_l4code;
  if (!regionIndex.has(code)) { regionIndex.set(code, regions.length + 1); regions.push({ code, name: ecoRows[i].us_l4name }); }
  return { shape, region: regionIndex.get(code) };
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

const header = {
  kind: 'colonies-woods',
  version: 1,
  builtFrom: {
    vegetation: 'LANDFIRE LF2016_BPS (Biophysical Settings), LANDFIRE Product Service, 99-94W 28-32N, 240 m, EPSG:4326, requested 2026-09-15',
    ecoregions: 'U.S. EPA Level IV Ecoregions of Texas, tx_eco_l4 (2011)',
  },
  grid: { minX, minY, columns, rows, cell, file: 'colonies-woods.bin.gz', note: 'one byte a cell: the index into stands; aligned with colonies-elevation.bin.gz' },
  stands: STAND_IDS.map((id, index) => ({ id, models: BY_MODEL[id], cells: tally[index] })),
  settings: table.filter(row => row.bps_model !== '-9999').map(row => ({ value: Number(row.value), model: row.bps_model, name: row.bps_name, stand: STAND_IDS[standOfValue.get(Number(row.value))] })),
  ecoregions: { cell: ECO_CELL, columns: ecoColumns, rows: ecoRowsCount, regions, grid: Buffer.from(eco).toString('base64'), note: 'one byte a one-mile cell: 0 outside Texas, else 1 + index into regions' },
};
const standsGz = gzipSync(Buffer.from(stands.buffer), { level: 9 });
const headerGz = gzipSync(JSON.stringify(header), { level: 9 });
writeFileSync('public/terrain/colonies-woods.bin.gz', standsGz);
writeFileSync('public/terrain/colonies-woods.json.gz', headerGz);
console.log(STAND_IDS.map((id, i) => `${id} ${(100 * tally[i] / stands.length).toFixed(1)}%`).join(', '));
console.log(`Wrote stands ${(standsGz.length / 1e6).toFixed(2)} MB and header ${(headerGz.length / 1e3).toFixed(0)} KB (gzip); ${regions.length} ecoregions`);

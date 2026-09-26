// Builds the country outside the colonies' box, drawn round it: docs/MAP_ACCURACY.md §2 and §8.
//
//   node --max-old-space-size=8192 scripts/build-outside.mjs <raw-dir>
//
// <raw-dir> holds what docs/evidence/outside-data.json lists, none of it kept in the repository:
//   dem/USGS_1_<tile>.tif                       USGS 3DEP 1 arc-second tiles round the box
//   nhd/<hu4>/NHDFlowline.{shp,dbf}             USGS National Hydrography Dataset, HU4 units round the box
//   landfire/bps/<job>.tif (+ .tif.vat.dbf)     LANDFIRE LF2016 Biophysical Settings over the whole extent
//   eco/tx_eco_l4/tx_eco_l4.{shp,dbf}           U.S. EPA Level IV Ecoregions of Texas
//
// Owner, 2026-09-18, by multiple choice: all three rivers (the map grows to 93.5-100.5°W and 25.8-32°N, east to the Sabine
// and south and west to the Rio Grande from Matamoros to Eagle Pass); USGS NHD with the edge units; full relief and woods
// outside the box, drawn the way the box is drawn. It writes
//
//   public/terrain/outside-province.json.gz   the extent's bounds, rivers, the sea and its shore, the escarpment and a relief
//                                             grid, at the province's bands (the shape of colonies-province.json)
//   public/terrain/outside-land.json.gz       land and relief classes with a hillshade at the land's bands (the shape of
//                                             colonies-land.json)
//   public/terrain/outside-woods.bin.gz       the woods' stand of every eighth-of-a-mile cell (the shape of colonies-woods.bin),
//   public/terrain/outside-woods.json.gz      and its header, read by the server for the map's woods tiles and by nothing else
//
// **The box stays exactly as it is.** The box's own files (colonies-*) feed the simulation - families' land, woods, felling,
// travel - and none of them is read differently or written here. This is a display layer round them, in the same projection
// and origin (the confluence, colonies-water.json's header) on the same eighth-of-a-mile lattice, and wherever it overlaps
// the box the box's own data is used: its heights, its classes, its water, its courses. Rivers the box already draws are
// carried on outside it and meet its line at the edge; rivers it does not (the Nueces, the Frio, the Sabine) are drawn
// inside it from the box's own courses and outside it from the new data.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { openClasses, openElevation } from './terrain/geotiff.mjs';
import { readDbf, readShapes } from './terrain/shapefile.mjs';
import { contours, joinReaches, lineLength, ringArea, simplifyLine, simplifyRing } from './terrain/lines.mjs';
import { BEACH_VIEW_MILES, COASTAL_MARSH_ECOREGIONS, COVER_OF_STAND, ESCARPMENT_MILES, MARSH_PRAIRIES, METRES_PER_MILE, bandShade, facesGulf, openWater, pickVote, reliefKind, slopeAt, windowRange } from './terrain/land-rules.mjs';
import { MEXICO, PALM_DELTA, STAND_IDS, THORNSCRUB, modelOf, nuecesSide, standOfSetting } from './terrain/biomes.mjs';
import { boxTerrain as realTerrain } from '../sim/terrain-data.mjs';
import { LAND, LAND_BANDS, LAND_BITS, RELIEF, landBitsOf, landData } from '../sim/land.mjs';
import { provinceBands } from '../sim/province.mjs';

const raw = process.argv[2];
if (!raw) { console.error('usage: node --max-old-space-size=8192 scripts/build-outside.mjs <raw-dir>'); process.exit(2); }
const started = Date.now();
const seconds = () => ((Date.now() - started) / 1000).toFixed(0);

/** The whole map (owner, 2026-09-18): east to the Sabine, south and west to the Rio Grande. */
const EXTENT = Object.freeze({ west: -100.5, east: -93.5, south: 25.8, north: 32 });

// ---- The box and its lattice ----------------------------------------------------------------------------------
const terrain = realTerrain();
const { header } = terrain;
const box = header.grid;
const { origin, projection, area: AREA } = header;
const { milesPerLon, milesPerLat } = projection;
const toMiles = (lon, lat) => ({ x: (lon - origin.lon) * milesPerLon, y: (origin.lat - lat) * milesPerLat });
const lonOf = x => origin.lon + x / milesPerLon, latOf = y => origin.lat - y / milesPerLat;
const CELL = box.cell, NO_DATA = box.noData;
const round2 = value => { const fixed = +value.toFixed(2); return fixed === 0 ? 0 : fixed; };
const noNegativeZero = value => value === 0 ? 0 : value;
const extentMiles = { minX: toMiles(EXTENT.west, 0).x, maxX: toMiles(EXTENT.east, 0).x, minY: toMiles(0, EXTENT.north).y, maxY: toMiles(0, EXTENT.south).y };
const boxMiles = { minX: toMiles(AREA.west, 0).x, maxX: toMiles(AREA.east, 0).x, minY: toMiles(0, AREA.north).y, maxY: toMiles(0, AREA.south).y };
// The grid is the box's lattice grown by whole cells of the coarsest land band, so every band's cells line up with the box's.
const COARSE = LAND_BANDS.at(-1);
const minX = box.minX - COARSE * Math.ceil((box.minX - extentMiles.minX) / COARSE);
const minY = box.minY - COARSE * Math.ceil((box.minY - extentMiles.minY) / COARSE);
const maxX = box.minX + COARSE * Math.ceil((extentMiles.maxX - box.minX) / COARSE);
const maxY = box.minY + COARSE * Math.ceil((extentMiles.maxY - box.minY) / COARSE);
const columns = Math.round((maxX - minX) / CELL), rows = Math.round((maxY - minY) / CELL), size = columns * rows;
const boxColumn0 = Math.round((box.minX - minX) / CELL), boxRow0 = Math.round((box.minY - minY) / CELL);
console.log(`Grid ${columns} x ${rows} at ${CELL} mile, x ${minX}..${maxX}, y ${minY}..${maxY}; the box's grid at column ${boxColumn0}, row ${boxRow0}`);

const lonOfColumn = c => lonOf(minX + (c + 0.5) * CELL), latOfRow = r => latOf(minY + (r + 0.5) * CELL);
const columnLon = new Float64Array(columns).map((_, c) => lonOfColumn(c)), rowLat = new Float64Array(rows).map((_, r) => latOfRow(r));
/** Whether a cell's centre is in the box - exactly the test scripts/build-land.mjs makes - and in the whole extent. */
const inBox = i => { const lon = columnLon[i % columns], lat = rowLat[Math.floor(i / columns)]; return lon >= AREA.west && lon <= AREA.east && lat >= AREA.south && lat <= AREA.north; };
const inExtent = i => { const lon = columnLon[i % columns], lat = rowLat[Math.floor(i / columns)]; return lon >= EXTENT.west && lon <= EXTENT.east && lat >= EXTENT.south && lat <= EXTENT.north; };
/** The box's own cell under this one, or -1 off the box's grid. */
const boxIndexOf = i => {
  const c = i % columns - boxColumn0, r = Math.floor(i / columns) - boxRow0;
  return c >= 0 && r >= 0 && c < box.columns && r < box.rows ? r * box.columns + c : -1;
};
const IN_BOX = new Uint8Array(size), IN_EXTENT = new Uint8Array(size);
for (let i = 0; i < size; i++) { IN_BOX[i] = inBox(i) ? 1 : 0; IN_EXTENT[i] = inExtent(i) ? 1 : 0; }

const boxLand = landData();
const boxCells = boxLand.cells;
// The box's land file holds its class in the low bits of a cell (five since 2026-09-19) and its relief above; this layer writes the same.
const BOX_BITS = landBitsOf(boxLand.header), BOX_MASK = (1 << BOX_BITS) - 1;
if (BOX_BITS !== LAND_BITS) throw new Error('Build the box\'s land (scripts/build-land.mjs) before the country outside it');
const LAND_IDS = LAND.map(entry => entry.id), code = id => LAND_IDS.indexOf(id), reliefCode = id => RELIEF.findIndex(entry => entry.id === id);
const WATER = code('water'), NONE = code('none');

// ---- Heights ---------------------------------------------------------------------------------------------------
// Each cell is the mean of the 1 arc-second samples in it, as scripts/build-terrain.mjs made the box's; inside the box the
// box's own heights are kept. Samples are read over the whole grid, a little past the extent, so the hillshade at the
// extent's edge has real ground beside it instead of a cliff to nothing.
const sum = new Float64Array(size), count = new Uint16Array(size);
const demDir = join(raw, 'dem'), demTiles = readdirSync(demDir).filter(name => /^USGS_1_n\d\dw\d{3}\.tif$/.test(name)).sort();
for (const name of demTiles) {
  const dem = openElevation(join(demDir, name));
  for (let index = 0; index < dem.tiles; index++) {
    const values = dem.tile(index);
    const tileColumn = index % dem.across, tileRow = Math.floor(index / dem.across);
    for (let y = 0; y < dem.tileHeight; y++) {
      const row = tileRow * dem.tileHeight + y;
      if (row >= dem.height) break;
      const lat = dem.latOf(row);
      const gy = Math.floor(((origin.lat - lat) * milesPerLat - minY) / CELL);
      if (gy < 0 || gy >= rows) continue;
      const latInBox = lat >= AREA.south && lat <= AREA.north;
      for (let x = 0; x < dem.tileWidth; x++) {
        const column = tileColumn * dem.tileWidth + x;
        if (column >= dem.width) break;
        const value = values[y * dem.tileWidth + x];
        if (!(value > -100)) continue;
        const lon = dem.lonOf(column);
        if (latInBox && lon >= AREA.west && lon <= AREA.east) continue; // the box's own heights are kept
        const gx = Math.floor(((lon - origin.lon) * milesPerLon - minX) / CELL);
        if (gx < 0 || gx >= columns) continue;
        const cell = gy * columns + gx;
        sum[cell] += value; if (count[cell] < 65535) count[cell]++;
      }
    }
  }
  console.log(`${name} (${seconds()} s)`);
}
const heights = new Uint16Array(size);
let fromBox = 0, fromTiles = 0;
for (let i = 0; i < size; i++) {
  const b = IN_BOX[i] ? boxIndexOf(i) : -1;
  if (b >= 0) { heights[i] = terrain.heights[b]; fromBox++; continue; }
  if (!count[i]) { heights[i] = NO_DATA; continue; }
  heights[i] = Math.max(0, Math.min(65534, Math.round(sum[i] / count[i] * 10))); fromTiles++;
}
console.log(`Heights: ${fromBox} cells the box's, ${fromTiles} from the tiles`);

// ---- Vegetation --------------------------------------------------------------------------------------------------
// LANDFIRE's settings, read here and filed into the biomes of 1836 below - once the ecoregions and the rivers are read - by
// exactly the rules the box's own are filed by (scripts/terrain/biomes.mjs, scripts/build-woods.mjs), so the seam matches.
const bpsDir = join(raw, 'landfire', 'bps'), bpsName = readdirSync(bpsDir).find(name => /\.tif$/.test(name));
const bpsTable = readDbf(join(bpsDir, `${bpsName}.vat.dbf`));
const MODELS = [...new Set(['-9999', ...bpsTable.map(modelOf)])], modelOfValue = new Map(), unfiled = [];
for (const row of bpsTable) {
  const model = modelOf(row);
  if (standOfSetting(model, { lon: 0, lat: 0, eco: '' }) === undefined) unfiled.push(`${row.bps_model} ${row.bps_name}`);
  modelOfValue.set(Number(row.value), MODELS.indexOf(model));
}
if (unfiled.length) { console.error(`Settings not filed under a stand:\n  ${unfiled.join('\n  ')}`); process.exit(1); }
const bps = openClasses(join(bpsDir, bpsName));
const NO_SETTING = 255;
/** The setting of every cell outside the box, by index into MODELS; NO_SETTING where LANDFIRE has none (Mexico, the Gulf). */
const settings = new Uint16Array(size).fill(65535);
const stands = new Uint8Array(size);
for (let i = 0; i < size; i++) {
  if (IN_BOX[i] || !IN_EXTENT[i]) continue;
  const value = bps.at(columnLon[i % columns], rowLat[Math.floor(i / columns)]);
  if (value === null) stands[i] = NO_SETTING;
  else settings[i] = modelOfValue.get(value) ?? MODELS.indexOf('-9999');
}
console.log(`LANDFIRE read (${seconds()} s)`);

// ---- EPA Level IV ecoregions, a mile at a time -------------------------------------------------------------------
// As scripts/build-woods.mjs reads them: the shapefile's USGS Albers Equal Area (NAD83/GRS80; standard parallels 29.5° and
// 45.5°, origin 23°N 96°W), Snyder (1987) pp. 101-102.
const A = 6378137, F = 1 / 298.257222101, E2 = 2 * F - F * F, E = Math.sqrt(E2);
const rad = d => d * Math.PI / 180;
const qOf = phi => { const s = Math.sin(phi); return (1 - E2) * (s / (1 - E2 * s * s) - (1 / (2 * E)) * Math.log((1 - E * s) / (1 + E * s))); };
const mOf = phi => Math.cos(phi) / Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
const [phi1, phi2, phi0, lam0] = [rad(29.5), rad(45.5), rad(23), rad(-96)];
const nAlbers = (mOf(phi1) ** 2 - mOf(phi2) ** 2) / (qOf(phi2) - qOf(phi1));
const C = mOf(phi1) ** 2 + nAlbers * qOf(phi1);
const rho0 = A * Math.sqrt(C - nAlbers * qOf(phi0)) / nAlbers;
const albers = (lon, lat) => { const rho = A * Math.sqrt(C - nAlbers * qOf(rad(lat))) / nAlbers, theta = nAlbers * (rad(lon) - lam0); return { x: rho * Math.sin(theta), y: rho0 - rho * Math.cos(theta) }; };
const ecoDir = join(raw, 'eco', 'tx_eco_l4');
const ecoRows = readDbf(join(ecoDir, 'tx_eco_l4.dbf')), ecoShapes = readShapes(join(ecoDir, 'tx_eco_l4.shp'));
const regions = [], regionIndex = new Map();
const polygons = ecoShapes.map((shape, i) => {
  const regionCode = ecoRows[i].us_l4code;
  if (!regionIndex.has(regionCode)) { regionIndex.set(regionCode, regions.length + 1); regions.push({ code: regionCode, name: ecoRows[i].us_l4name }); }
  return { shape, region: regionIndex.get(regionCode) };
});
const insideFlat = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const ECO_CELL = 1;
const ecoColumns = Math.round(columns * CELL / ECO_CELL), ecoRowCount = Math.round(rows * CELL / ECO_CELL);
const eco = new Uint8Array(ecoColumns * ecoRowCount);
for (let row = 0; row < ecoRowCount; row++) for (let column = 0; column < ecoColumns; column++) {
  const p = albers(lonOf(minX + (column + 0.5) * ECO_CELL), latOf(minY + (row + 0.5) * ECO_CELL));
  for (const { shape, region } of polygons) {
    const { box: b } = shape;
    if (p.x < b.minX || p.x > b.maxX || p.y < b.minY || p.y > b.maxY) continue;
    let inside = false;
    for (const ring of shape.parts) if (insideFlat(p.x, p.y, ring)) inside = !inside;
    if (inside) { eco[row * ecoColumns + column] = region; break; }
  }
}
const ecoCodeAt = i => {
  const x = minX + (i % columns + 0.5) * CELL, y = minY + (Math.floor(i / columns) + 0.5) * CELL;
  const value = eco[Math.floor((y - minY) / ECO_CELL) * ecoColumns + Math.floor((x - minX) / ECO_CELL)];
  return value ? regions[value - 1].code : '';
};
console.log(`Ecoregions: ${regions.length} (${seconds()} s)`);

// ---- Watercourses --------------------------------------------------------------------------------------------------
// As scripts/build-terrain.mjs reads the box's: StreamRiver flowlines, and ArtificialPath only where named - which is how the
// data draws the Rio Grande, a river wide enough to be mapped as an area with a path down its middle.
const nhdDir = join(raw, 'nhd'), units = readdirSync(nhdDir).filter(name => /^\d{4}$/.test(name)).sort();
const gridBox = { west: lonOf(minX), east: lonOf(maxX), north: latOf(minY), south: latOf(maxY) };
/** Douglas-Peucker on a flat array in miles, as scripts/build-terrain.mjs simplifies the box's courses. */
function simplifyFlat(flat, tolerance) {
  const points = [];
  for (let i = 0; i < flat.length; i += 2) points.push({ x: flat[i], y: flat[i + 1] });
  return simplifyLine(points, tolerance);
}
const courses = [], unitsRead = {};
for (const unit of units) {
  const rowsOf = readDbf(join(nhdDir, unit, 'NHDFlowline.dbf')), shapes = readShapes(join(nhdDir, unit, 'NHDFlowline.shp'));
  let kept = 0;
  rowsOf.forEach((row, index) => {
    const shape = shapes[index];
    if (!shape?.box) return;
    const b = shape.box;
    if (b.maxX < gridBox.west || b.minX > gridBox.east || b.maxY < gridBox.south || b.minY > gridBox.north) return;
    const name = row.gnis_name || '', ftype = Number(row.ftype);
    if (!(ftype === 460 || (ftype === 558 && name))) return;
    if (/\b(canal|ditch|outfall|diversion)\b/i.test(name)) return;
    if (!name) return; // only named courses are drawn or make a bluff out here
    for (const part of shape.parts) {
      const miles = new Float64Array(part.length);
      for (let i = 0; i < part.length; i += 2) { const p = toMiles(part[i], part[i + 1]); miles[i] = p.x; miles[i + 1] = p.y; }
      courses.push({ name, points: simplifyFlat(miles, 0.01).map(p => ({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 })) });
    }
    kept++;
  });
  unitsRead[unit] = { flowlines: rowsOf.length, namedKept: kept };
  console.log(`NHD ${unit}: ${rowsOf.length} flowlines, ${kept} named kept (${seconds()} s)`);
}

// ---- The biomes of 1836 --------------------------------------------------------------------------------------------
// Every cell's setting filed as the box's are (scripts/terrain/biomes.mjs). The Nueces line is the river from its head to its
// mouth: this data's pieces outside the box and the box's own inside it, so no stretch is counted twice; the delta's palms
// stand by the Rio Grande.
/** Every cell whose middle is within `miles` of a line in the game's miles, marked in `mask`. */
function markNear(points, miles, mask) {
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1], b = points[k];
    const c0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - miles - minX) / CELL)), c1 = Math.min(columns - 1, Math.floor((Math.max(a.x, b.x) + miles - minX) / CELL));
    const r0 = Math.max(0, Math.floor((Math.min(a.y, b.y) - miles - minY) / CELL)), r1 = Math.min(rows - 1, Math.floor((Math.max(a.y, b.y) + miles - minY) / CELL));
    const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = minX + (c + 0.5) * CELL, py = minY + (r + 0.5) * CELL;
      const t = length ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / length)) : 0;
      if (Math.hypot(px - a.x - dx * t, py - a.y - dy * t) <= miles) mask[r * columns + c] = 1;
    }
  }
}
const lineLengthOf = points => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
const boxMilesEarly = { minX: toMiles(AREA.west, 0).x, maxX: toMiles(AREA.east, 0).x, minY: toMiles(0, AREA.north).y, maxY: toMiles(0, AREA.south).y };
const inBoxMiles = p => p.x >= boxMilesEarly.minX && p.x <= boxMilesEarly.maxX && p.y >= boxMilesEarly.minY && p.y <= boxMilesEarly.maxY;
/** The pieces of lines whose segments pass `keep` (by their middles), as lines. */
function piecesWhere(lines, keep) {
  const out = [];
  for (const line of lines) {
    let run = [];
    for (let k = 1; k < line.length; k++) {
      const a = line[k - 1], b = line[k];
      if (keep({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })) { if (!run.length) run.push(a); run.push(b); } else if (run.length) { out.push(run); run = []; }
    }
    if (run.length) out.push(run);
  }
  return out;
}
const nuecesLines = [
  ...piecesWhere(joinReaches(courses.filter(c => c.name === 'Nueces River')).map(line => line.points), p => !inBoxMiles(p)),
  ...piecesWhere(joinReaches(terrain.courses.filter(c => c.name === 'Nueces River')).map(line => line.points), inBoxMiles),
].filter(line => lineLengthOf(line) >= 3);
const toLonLat = p => ({ lon: lonOf(p.x), lat: latOf(p.y) });
const nuecesLonLat = nuecesLines.map(line => line.map(toLonLat));
const nuecesHead = nuecesLonLat.flat().reduce((best, p) => (!best || p.lat > best.lat ? p : best), null);
const southWestOfNueces = nuecesSide(nuecesLonLat, nuecesHead);
console.log(`The Nueces: ${nuecesLines.length} pieces, its head at ${nuecesHead.lon.toFixed(3)}°, ${nuecesHead.lat.toFixed(3)}°`);
const rioGrande = joinReaches(courses.filter(c => c.name === 'Rio Grande')).map(line => line.points);
const byRioGrande = new Uint8Array(size);
for (const line of rioGrande) markNear(line, PALM_DELTA.riverMiles, byRioGrande);
let stripCells = 0;
for (let i = 0; i < size; i++) {
  if (settings[i] === 65535) continue;
  const model = MODELS[settings[i]], lon = columnLon[i % columns], lat = rowLat[Math.floor(i / columns)];
  const place = { lon, lat, eco: ecoCodeAt(i), byRioGrande: byRioGrande[i] === 1, southWestOfNueces: false };
  if (THORNSCRUB.includes(model)) { place.southWestOfNueces = southWestOfNueces(lon, lat); if (place.southWestOfNueces) stripCells++; }
  stands[i] = STAND_IDS.indexOf(standOfSetting(model, place));
}
console.log(`Biomes filed: ${stripCells} thornscrub cells south-west of the Nueces (${seconds()} s)`);

// ---- The sea -------------------------------------------------------------------------------------------------------
// As in the box: no land, or ground under 0.3 m, joined to the Gulf; inside the box its own water, which the flood may cross.
const boxClassOf = i => { const b = IN_BOX[i] ? boxIndexOf(i) : -1; return b >= 0 ? boxCells[b] : -1; };
const isLow = i => heights[i] === NO_DATA || heights[i] < 3;
const sea = new Uint8Array(size);
{
  const seed = toMiles(-96.3, 26.6), start = Math.floor((seed.y - minY) / CELL) * columns + Math.floor((seed.x - minX) / CELL);
  if (heights[start] !== NO_DATA) throw new Error('The seed of the Gulf is not open water');
  const open = i => { if (!IN_EXTENT[i]) return false; const own = boxClassOf(i); return own >= 0 ? (own & BOX_MASK) === WATER : isLow(i); };
  const stack = [start]; sea[start] = 1;
  while (stack.length) {
    const current = stack.pop(), c = current % columns, r = (current - c) / columns;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= columns || nr >= rows) continue;
      const next = nr * columns + nc;
      if (sea[next] || !open(next)) continue;
      sea[next] = 1; stack.push(next);
    }
  }
}
const water = openWater(sea, columns, rows, i => IN_BOX[i] === 1);
for (let i = 0; i < size; i++) if (IN_BOX[i]) water[i] = (boxClassOf(i) & BOX_MASK) === WATER ? 1 : 0; else if (!IN_EXTENT[i]) water[i] = 0;
console.log(`The sea (${seconds()} s)`);

// ---- Cover ---------------------------------------------------------------------------------------------------------
// Mexico, south and west of the Rio Grande, has heights (3DEP's 1 arc-second tiles carry the country across the border) but
// no LANDFIRE: it is the land joined to the Rio Grande's far bank with no setting at all.
// Since 2026-09-19 (docs/BIOMES.md §4.12, HIST-TEX-108): chaparral, the Tamaulipan mezquital of the Nueces Strip run on south;
// mesquite prairie on the delta plain round Matamoros; the river woods along the Rio Grande's south bank as on the north, with
// the palms in the delta; and oaks on the Sierra de Picachos above 800 m (scripts/terrain/biomes.mjs `MEXICO`, FIC-GONZ-060).
// ceiling: nothing here says what grew in Mexico; these are the Texas bank's country carried across the river and one line
// of height. INEGI's land-use series (Serie I), or a vegetation model that crosses the border, is the way out.
const mexico = new Uint8Array(size);
{
  const seed = toMiles(-100.0, 26.5), start = Math.floor((seed.y - minY) / CELL) * columns + Math.floor((seed.x - minX) / CELL);
  const open = i => IN_EXTENT[i] && !IN_BOX[i] && stands[i] === NO_SETTING && heights[i] !== NO_DATA && !water[i];
  if (!open(start)) throw new Error('The seed in Mexico has a LANDFIRE setting');
  const stack = [start]; mexico[start] = 1;
  while (stack.length) {
    const current = stack.pop(), c = current % columns, r = (current - c) / columns;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= columns || nr >= rows) continue;
      const next = nr * columns + nc;
      if (mexico[next] || !open(next)) continue;
      mexico[next] = 1; stack.push(next);
    }
  }
}
const land = new Uint8Array(size), relief = new Uint8Array(size);
const UNSET = 255;
const nearMexicanBank = new Uint8Array(size);
for (const line of rioGrande) markNear(line, MEXICO.riverMiles, nearMexicanBank);
/** Mexico's stand at a cell (above). */
const mexicanStand = i => {
  const metres = heights[i] / 10, lon = columnLon[i % columns];
  if (metres > MEXICO.oaksAboveMetres) return 'hill-savanna';
  if (nearMexicanBank[i]) return lon > PALM_DELTA.east ? 'palm-grove' : 'thorn-riparian';
  if (lon > MEXICO.deltaEast && metres < MEXICO.deltaBelowMetres) return 'mesquite-savanna';
  return 'chaparral';
};
for (let i = 0; i < size; i++) {
  const own = boxClassOf(i);
  if (own >= 0) { land[i] = own & BOX_MASK; relief[i] = own >> BOX_BITS; continue; }
  if (!IN_EXTENT[i]) { land[i] = NONE; continue; }
  if (water[i]) { land[i] = WATER; continue; }
  if (heights[i] === NO_DATA) { land[i] = NONE; continue; }
  if (mexico[i]) stands[i] = STAND_IDS.indexOf(mexicanStand(i));
  const stand = STAND_IDS[stands[i] === NO_SETTING ? 0 : stands[i]];
  let cover = COVER_OF_STAND[stand];
  if (MARSH_PRAIRIES.includes(stand) && COASTAL_MARSH_ECOREGIONS.includes(ecoCodeAt(i))) cover = 'marsh';
  land[i] = cover ? code(cover) : UNSET;
}
// Holes - a reservoir, the Rio Grande's own bed, a gap in the settings - take the most common class round them, a ring at
// a time, as in the box.
{
  let holes = [];
  for (let i = 0; i < size; i++) if (land[i] === UNSET) holes.push(i);
  for (let pass = 0; holes.length && pass < 400; pass++) {
    const next = [], left = [];
    for (const i of holes) {
      const c = i % columns, r = (i - c) / columns, votes = new Map();
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if ((!dr && !dc) || rr < 0 || cc < 0 || rr >= rows || cc >= columns) continue;
        const v = land[rr * columns + cc];
        if (v === UNSET || v === WATER || v === NONE) continue;
        votes.set(v, (votes.get(v) || 0) + 1);
      }
      if (votes.size) next.push([i, [...votes].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]]); else left.push(i);
    }
    for (const [i, v] of next) land[i] = v;
    holes = left;
  }
  for (const i of holes) land[i] = code('prairie');
}
// Sand and beach: low land at the water's edge looking out on the open Gulf.
{
  const REACH = 2, OUT = Math.round(BEACH_VIEW_MILES / CELL);
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
    const i = r * columns + c;
    if (IN_BOX[i] || !IN_EXTENT[i] || water[i] || land[i] === NONE || heights[i] >= 50) continue;
    let near = false;
    for (let dr = -REACH; dr <= REACH && !near; dr++) for (let dc = -REACH; dc <= REACH && !near; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < rows && cc < columns && water[rr * columns + cc]) near = true;
    }
    if (near && facesGulf(water, columns, rows, r, c, OUT)) land[i] = code('sand');
  }
}
console.log(`Cover (${seconds()} s)`);

// ---- Relief --------------------------------------------------------------------------------------------------------
// Heights in metres, the sea at 0. Ground with no heights at all (north of 32°N, where no tile was read) takes the nearest
// ground's, a ring at a time, so the grid's edge is not read as a cliff.
const metres = new Float32Array(size);
{
  let missing = [];
  for (let i = 0; i < size; i++) {
    if (heights[i] !== NO_DATA) metres[i] = heights[i] / 10;
    else if (water[i] || sea[i]) metres[i] = 0;
    else { metres[i] = NaN; missing.push(i); }
  }
  for (let pass = 0; missing.length && pass < 16; pass++) {
    const next = [], left = [];
    for (const i of missing) {
      const c = i % columns, r = (i - c) / columns;
      let total = 0, n = 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const cc = c + dc, rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= columns || rr >= rows) continue;
        const v = metres[rr * columns + cc];
        if (!Number.isNaN(v)) { total += v; n++; }
      }
      if (n) next.push([i, total / n]); else left.push(i);
    }
    for (const [i, v] of next) metres[i] = v;
    missing = left;
  }
  for (const i of missing) metres[i] = 0;
}
const range = windowRange(metres, columns, rows);
const besideWater = new Uint8Array(size);
for (const course of courses) {
  if (!/\b(River|Bayou)$|^Rio Grande$/.test(course.name)) continue;
  for (let k = 1; k < course.points.length; k++) {
    const a = course.points[k - 1], b = course.points[k], steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (CELL / 2)));
    for (let s = 0; s <= steps; s++) {
      const x = a.x + (b.x - a.x) * s / steps, y = a.y + (b.y - a.y) * s / steps;
      const c0 = Math.floor((x - minX) / CELL), r0 = Math.floor((y - minY) / CELL);
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const rr = r0 + dr, cc = c0 + dc;
        if (rr >= 0 && cc >= 0 && rr < rows && cc < columns) besideWater[rr * columns + cc] = 1;
      }
    }
  }
}
// The escarpment: EPA's line between the Edwards Plateau (Level III 30) and the plains below it (31, 32, 33), on the same
// one-mile lattice as the box's, so inside the box it is the box's own line point for point.
const ecoField = new Float32Array(eco.length);
for (let i = 0; i < eco.length; i++) {
  const level3 = eco[i] ? regions[eco[i] - 1].code.slice(0, 2) : '';
  ecoField[i] = level3 === '30' ? 1 : ['31', '32', '33'].includes(level3) ? 0 : NaN;
}
const ecoOutline = contours(ecoField, ecoColumns, ecoRowCount, 0.5, (c, r) => ({ x: minX + (c + 0.5) * ECO_CELL, y: minY + (r + 0.5) * ECO_CELL }));
const escarpmentLines = [...ecoOutline.lines, ...ecoOutline.rings.map(ring => [...ring, ring[0]])]
  .filter(line => lineLength(line) >= 20).map(line => simplifyLine(line, 0.25));
const nearEscarpment = new Uint8Array(size);
{
  const reach = Math.ceil(ESCARPMENT_MILES / CELL);
  for (const line of escarpmentLines) for (let k = 1; k < line.length; k++) {
    const a = line[k - 1], b = line[k], steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / CELL));
    for (let s = 0; s <= steps; s++) {
      const x = a.x + (b.x - a.x) * s / steps, y = a.y + (b.y - a.y) * s / steps;
      const c0 = Math.floor((x - minX) / CELL), r0 = Math.floor((y - minY) / CELL);
      for (let dr = -reach; dr <= reach; dr++) for (let dc = -reach; dc <= reach; dc++) {
        if (dr * dr + dc * dc > reach * reach) continue;
        const rr = r0 + dr, cc = c0 + dc;
        if (rr >= 0 && cc >= 0 && rr < rows && cc < columns) nearEscarpment[rr * columns + cc] = 1;
      }
    }
  }
}
for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
  const i = r * columns + c;
  if (boxClassOf(i) >= 0) continue;
  if (land[i] === WATER || land[i] === NONE) { relief[i] = reliefCode('flat'); continue; }
  const slope = slopeAt(metres, columns, rows, c, r, CELL);
  let kind = reliefKind(range[i], slope);
  if (nearEscarpment[i] && (kind === 'hills' || kind === 'steep')) kind = 'escarpment';
  else if (besideWater[i] && slope >= 4) kind = 'bluff';
  relief[i] = reliefCode(kind);
}
console.log(`Relief (${seconds()} s)`);

// ---- Land bands ----------------------------------------------------------------------------------------------------
// The land's bands on the box's own lattice. A band cell is this layer's where any cell of its three-by-three neighbourhood
// reaches out of the box: out there it is the country's most common class, and on the box's edge it is the box's own class
// (the box's data wins) with a hillshade worked from real ground on both sides. The box's band leaned on nothing past its
// edge - the heights there were read as sea level - so its hillshade at the edge is a false cliff; the page draws these
// cells from here instead, and every other cell of the box from the box.
const boxBands = boxLand.header.bands.map(band => ({ ...band, cells: Buffer.from(band.classes, 'base64') }));
const bands = LAND_BANDS.map((miles, k) => {
  const block = Math.round(miles / CELL);
  const bandColumns = columns / block, bandRows = rows / block;
  if (!Number.isInteger(bandColumns) || !Number.isInteger(bandRows)) throw new Error(`The ${miles}-mile band does not tile the grid`);
  const boxBand = boxBands[k];
  if (boxBand.cell !== miles) throw new Error('The box has other bands');
  const offsetColumn = Math.round((boxBand.minX - minX) / miles), offsetRow = Math.round((boxBand.minY - minY) / miles);
  const fullyIn = new Uint8Array(bandColumns * bandRows), mean = new Float32Array(bandColumns * bandRows);
  const classes = new Uint8Array(bandColumns * bandRows);
  for (let br = 0; br < bandRows; br++) for (let bc = 0; bc < bandColumns; bc++) {
    let all = 1, total = 0, n = 0;
    const landVotes = new Uint32Array(1 << LAND_BITS), reliefVotes = new Uint32Array(1 << LAND_BITS);
    for (let r = br * block; r < (br + 1) * block; r++) for (let c = bc * block; c < (bc + 1) * block; c++) {
      const i = r * columns + c;
      if (!IN_BOX[i]) all = 0;
      landVotes[land[i]]++; reliefVotes[relief[i]]++;
      total += metres[i]; n++;
    }
    const at = br * bandColumns + bc;
    fullyIn[at] = all; mean[at] = total / n;
    const landClass = pickVote(landVotes, NONE), reliefClass = pickVote(reliefVotes, -1);
    classes[at] = (landClass < 0 ? NONE : landClass) | (reliefClass << LAND_BITS);
  }
  const shadeAll = bandShade(mean, bandColumns, bandRows, miles, CELL);
  const out = new Uint8Array(bandColumns * bandRows), shade = new Uint8Array(bandColumns * bandRows).fill(128);
  let claimed = 0;
  for (let br = 0; br < bandRows; br++) for (let bc = 0; bc < bandColumns; bc++) {
    let deep = true;
    for (let dr = -1; dr <= 1 && deep; dr++) for (let dc = -1; dc <= 1 && deep; dc++) {
      const rr = br + dr, cc = bc + dc;
      if (rr < 0 || cc < 0 || rr >= bandRows || cc >= bandColumns || !fullyIn[rr * bandColumns + cc]) deep = false;
    }
    if (deep) continue; // the box draws it
    const at = br * bandColumns + bc;
    const boxColumn = bc - offsetColumn, boxRow = br - offsetRow;
    const own = boxColumn >= 0 && boxRow >= 0 && boxColumn < boxBand.columns && boxRow < boxBand.rows ? boxBand.cells[boxRow * boxBand.columns + boxColumn] : 0;
    out[at] = (own & BOX_MASK) !== NONE ? own : classes[at];
    if ((out[at] & BOX_MASK) === NONE) { out[at] = 0; continue; }
    shade[at] = shadeAll[at];
    if (own & BOX_MASK) claimed++;
  }
  console.log(`Band ${miles} mi: ${bandColumns} x ${bandRows}, ${claimed} of the box's own cells drawn from here`);
  return { cell: miles, columns: bandColumns, rows: bandRows, minX, minY, classes: Buffer.from(out).toString('base64'), shade: Buffer.from(shade).toString('base64') };
});

// ---- The woods -----------------------------------------------------------------------------------------------------
// The stand of every eighth-of-a-mile cell outside the box, in the byte order of the box's own (colonies-woods.bin), for the
// map's woods tiles only: sim/woods-view.mjs reads a stand here wherever the box's woods grid has none, so the timber's
// shade, its patches and its trees are drawn outside the box exactly as inside it. Nothing in the simulation reads it -
// hunting, felling, clearing and the going ask sim/woods.mjs, which never looks past the box. 0 inside the box and off the
// extent; the sea is water; Mexico is its chaparral, delta, river woods and oaks (above).
const outsideStands = new Uint8Array(size);
const WATER_STAND = STAND_IDS.indexOf('water');
let standCells = 0;
for (let i = 0; i < size; i++) {
  if (IN_BOX[i] || !IN_EXTENT[i]) continue;
  outsideStands[i] = water[i] ? WATER_STAND : stands[i] === NO_SETTING ? 0 : stands[i];
  if (outsideStands[i]) standCells++;
}
console.log(`Woods: ${standCells} cells with a stand (${seconds()} s)`);

// ---- Rivers ----------------------------------------------------------------------------------------------------------
const province = provinceBands();
const BANDS = province.bands;
const idOf = name => name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '');
/**
 * The rivers drawn outside the box. `inBox` false: the box does not draw it, so it is drawn here inside the box too, from the
 * box's own courses. Channel widths as the province's (FIC-GONZ-057): an order of size, not a measurement of 1835.
 */
const OUTSIDE_RIVERS = [
  ['Rio Grande', 300], ['Nueces River', 150], ['Frio River', 80], ['Sabine River', 300],
  ['Colorado River'], ['Guadalupe River'], ['Medina River'], ['Neches River'],
];
const inBoxPoint = p => p.x >= boxMiles.minX && p.x <= boxMiles.maxX && p.y >= boxMiles.minY && p.y <= boxMiles.maxY;
const inExtentPoint = p => p.x >= extentMiles.minX && p.x <= extentMiles.maxX && p.y >= extentMiles.minY && p.y <= extentMiles.maxY;
/** The runs of a line whose points pass `keep`, each carried one point on across the edge at either end so the pieces meet. */
function runs(points, keep) {
  const out = [];
  let current = null;
  points.forEach((p, i) => {
    if (keep(p)) {
      if (!current) { current = []; if (i > 0) current.push(points[i - 1]); }
      current.push(p);
    } else if (current) { current.push(p); out.push(current); current = null; }
  });
  if (current) out.push(current);
  return out.filter(run => run.length >= 2);
}
const newJoined = joinReaches(courses);
const boxJoined = joinReaches(terrain.courses);
const hundredths = points => points.flatMap(p => [Math.round(p.x * 100), Math.round(p.y * 100)]);
const rivers = [];
const seams = [];
for (const [name, feet] of OUTSIDE_RIVERS) {
  const drawn = province.rivers.filter(river => river.name === name);
  const channelFeet = drawn.length ? drawn[0].channelFeet : feet;
  if (!channelFeet) throw new Error(`${name} has no width`);
  const width = +(2 * channelFeet / 5280).toFixed(4);
  // ids go on from the province's own pieces of the same river, so every piece of a river has one id across both files.
  let part = drawn.reduce((most, river) => Math.max(most, Number(river.id.split('-').pop()) + 1), 0);
  const pieces = [];
  for (const line of newJoined.filter(course => course.name === name)) for (const run of runs(line.points, p => !inBoxPoint(p) && inExtentPoint(p))) pieces.push({ run, where: 'outside' });
  if (!drawn.length) for (const line of boxJoined.filter(course => course.name === name)) for (const run of runs(line.points, inBoxPoint)) pieces.push({ run, where: 'box' });
  if (!pieces.length) throw new Error(`${name} is not in the data`);
  for (const { run, where } of pieces) {
    const length = lineLength(run);
    if (length < 0.1) continue;
    const first = simplifyLine(run, BANDS[0]).map(p => ({ x: round2(p.x), y: round2(p.y) }));
    const levels = [first];
    for (let band = 1; band < BANDS.length; band++) levels.push(simplifyLine(levels[band - 1], BANDS[band]));
    const kept = levels.map((line, band) => (band === 0 || length >= BANDS[band] * 4) && line.length >= 2 ? hundredths(line) : null);
    rivers.push({ id: `${idOf(name)}-${part++}`, name, channelFeet, width, length: round2(length), from: where, levels: kept });
  }
}
// Where a piece crosses the box's edge, how far its crossing is from the river the box draws there (or this layer's own
// piece of it inside the box): the seam, checked again in tests/map-outside.test.mjs.
const crossingOf = (a, b) => {
  let best = null;
  for (const [axis, value] of [['x', boxMiles.minX], ['x', boxMiles.maxX], ['y', boxMiles.minY], ['y', boxMiles.maxY]]) {
    const t = (value - a[axis]) / ((b[axis] - a[axis]) || 1e-12);
    if (t < 0 || t > 1) continue;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (p.x >= boxMiles.minX - 1e-6 && p.x <= boxMiles.maxX + 1e-6 && p.y >= boxMiles.minY - 1e-6 && p.y <= boxMiles.maxY + 1e-6 && (!best || t < best.t)) best = { ...p, t };
  }
  return best;
};
const flatToPoints = flat => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i] / 100, y: flat[i + 1] / 100 }); return out; };
const distanceToLines = (p, lines) => {
  let best = Infinity;
  for (const line of lines) for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
    best = Math.min(best, Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t));
  }
  return best;
};
for (const river of rivers.filter(r => r.from === 'outside')) {
  const line = flatToPoints(river.levels[0]);
  const ends = [[line[0], line[1]], [line.at(-1), line.at(-2)]];
  for (const [end, next] of ends) {
    if (!inBoxPoint(end) || inBoxPoint(next)) continue;
    const crossing = crossingOf(end, next);
    const inside = [...province.rivers.filter(r => r.name === river.name), ...rivers.filter(r => r.name === river.name && r.from === 'box')].map(r => flatToPoints(r.levels[0]));
    seams.push({ id: river.id, name: river.name, x: round2(crossing.x), y: round2(crossing.y), miles: +distanceToLines(crossing, inside).toFixed(3) });
  }
}
for (const seam of seams) console.log(`Seam: ${seam.id} crosses the box's edge at (${seam.x}, ${seam.y}), ${seam.miles} miles from the box's ${seam.name}`);

// ---- The sea's outline ---------------------------------------------------------------------------------------------
// The water outside the box, and the box's own water for two cells inside its edge, so this layer's sea runs a little under
// the box's and no hairline of land shows between them. Closed along the grid's edge by a border of land.
const MARGIN = 2;
const nearOut = new Uint8Array(size);
for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
  const i = r * columns + c;
  if (!IN_BOX[i]) { nearOut[i] = 1; continue; }
  for (let dr = -MARGIN; dr <= MARGIN && !nearOut[i]; dr++) for (let dc = -MARGIN; dc <= MARGIN && !nearOut[i]; dc++) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && cc >= 0 && rr < rows && cc < columns && !IN_BOX[rr * columns + cc]) nearOut[i] = 1;
  }
}
const padded = new Float32Array((columns + 2) * (rows + 2));
for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) { const i = r * columns + c; padded[(r + 1) * (columns + 2) + c + 1] = land[i] === WATER && nearOut[i] ? 1 : 0; }
const seaOutline = contours(padded, columns + 2, rows + 2, 0.5, (c, r) => ({ x: minX + (c - 0.5) * CELL, y: minY + (r - 0.5) * CELL }));
if (seaOutline.lines.length) throw new Error('The sea has an open outline');
function ringLevels(rings, smallest) {
  const out = BANDS.map(() => []);
  for (const ring of rings) {
    let current = simplifyRing(ring, BANDS[0]);
    for (let band = 0; band < BANDS.length; band++) {
      if (band) current = simplifyRing(current, BANDS[band]);
      if (current.length < 3 || Math.abs(ringArea(current)) < smallest[band]) break;
      out[band].push(current);
    }
  }
  return out;
}
const seaRings = ringLevels(seaOutline.rings, [0.05, 0.5, 4, 30]);
// The shore: the sea's outline where it is neither the edge of the extent nor inside the box (the box's shore is its own).
const EDGE = 1.5 * CELL;
const offShore = p => p.x <= extentMiles.minX + EDGE || p.y <= extentMiles.minY + EDGE || p.x >= extentMiles.maxX - EDGE || p.y >= extentMiles.maxY - EDGE
  || (p.x >= boxMiles.minX - EDGE && p.x <= boxMiles.maxX + EDGE && p.y >= boxMiles.minY - EDGE && p.y <= boxMiles.maxY + EDGE);
const shoreLines = [];
for (const ring of seaOutline.rings) {
  const start = ring.findIndex(offShore);
  if (start < 0) { shoreLines.push({ ring, length: lineLength([...ring, ring[0]]) }); continue; }
  const ordered = [...ring.slice(start), ...ring.slice(0, start + 1)];
  let run = [];
  for (const point of ordered) {
    if (offShore(point)) { if (run.length > 1) shoreLines.push({ line: run, length: lineLength(run) }); run = []; } else run.push(point);
  }
  if (run.length > 1) shoreLines.push({ line: run, length: lineLength(run) });
}
shoreLines.sort((a, b) => b.length - a.length);
const shoreLevels = BANDS.map(() => []);
for (const { ring, line, length } of shoreLines) {
  let current = ring ? simplifyRing(ring, BANDS[0]) : simplifyLine(line, BANDS[0]);
  for (let band = 0; band < BANDS.length; band++) {
    if (band) current = ring ? simplifyRing(current, BANDS[band]) : simplifyLine(current, BANDS[band]);
    if (length < BANDS[band] * 10 || current.length < (ring ? 3 : 2)) break;
    shoreLevels[band].push(ring ? [...current, current[0]] : current);
  }
}

// ---- The escarpment outside the box --------------------------------------------------------------------------------
// EPA's line west of the box, on to the Rio Grande at Del Rio, carried one point into the box to meet the box's own line.
const escarpmentPieces = escarpmentLines.flatMap(line => runs(line, p => !inBoxPoint(p) && inExtentPoint(p))).filter(run => lineLength(run) >= 1);
const escarpmentLevels = BANDS.map(() => []);
for (const piece of escarpmentPieces) {
  const levels = [piece, piece];
  for (let band = 2; band < BANDS.length; band++) levels.push(simplifyLine(levels.at(-1), BANDS[band]));
  levels.forEach((line, band) => { if (line.length >= 2) escarpmentLevels[band].push(hundredths(line)); });
}

// ---- The relief tint -----------------------------------------------------------------------------------------------
// The province's relief grid carried on over the extent on its own lattice, with the box's lowest and highest ground, so
// its tint runs on across the edge.
const boxRelief = province.relief;
const kx = Math.ceil((boxRelief.minX - extentMiles.minX) / boxRelief.cellX), ky = Math.ceil((boxRelief.minY - extentMiles.minY) / boxRelief.cellY);
const reliefMinX = boxRelief.minX - kx * boxRelief.cellX, reliefMinY = boxRelief.minY - ky * boxRelief.cellY;
const reliefColumns = Math.ceil((extentMiles.maxX - reliefMinX) / boxRelief.cellX) + 1, reliefRows = Math.ceil((extentMiles.maxY - reliefMinY) / boxRelief.cellY) + 1;
const heightAt = (x, y) => {
  const fx = (x - minX) / CELL - 0.5, fy = (y - minY) / CELL - 0.5, cx = Math.floor(fx), cy = Math.floor(fy), tx = fx - cx, ty = fy - cy;
  let total = 0, weight = 0;
  for (const [dx, dy, w] of [[0, 0, (1 - tx) * (1 - ty)], [1, 0, tx * (1 - ty)], [0, 1, (1 - tx) * ty], [1, 1, tx * ty]]) {
    const column = cx + dx, row = cy + dy;
    if (column < 0 || row < 0 || column >= columns || row >= rows || w === 0) continue;
    total += metres[row * columns + column] * w; weight += w;
  }
  return weight > 0 ? total / weight : 0;
};
const reliefValues = [];
for (let row = 0; row < reliefRows; row++) for (let column = 0; column < reliefColumns; column++) {
  reliefValues.push(noNegativeZero(Math.round(heightAt(reliefMinX + column * boxRelief.cellX, reliefMinY + row * boxRelief.cellY))));
}
const reliefGrid = { columns: reliefColumns, rows: reliefRows, minX: +reliefMinX.toFixed(4), minY: +reliefMinY.toFixed(4), cellX: boxRelief.cellX, cellY: boxRelief.cellY, low: boxRelief.low, high: boxRelief.high, values: reliefValues };

// ---- Write ---------------------------------------------------------------------------------------------------------
const bounds = { minX: round2(extentMiles.minX), maxX: round2(extentMiles.maxX), minY: round2(extentMiles.minY), maxY: round2(extentMiles.maxY) };
const boxBounds = province.bounds;
const sources = {
  rivers: 'USGS National Hydrography Dataset (NHDFlowline), HU4 units 0808, 1114, 1201, 1202, 1206, 1208-1211, 1304, 1308, 1309, 1311, 1312, public domain; inside the box, the box\'s own courses (colonies-water.json)',
  heights: 'USGS 3DEP 1 arc-second, 24 tiles round the box, public domain; inside the box, colonies-elevation.bin',
  vegetation: 'LANDFIRE LF2016 Biophysical Settings, -100.5 25.8 -93.5 32, 240 m, EPSG:4326 (LFPS job 371d8dc9-70c9-4a02-8d29-c94518797dcf), public domain',
  ecoregions: 'U.S. EPA Level IV Ecoregions of Texas (2011), public domain',
  mexico: 'no vegetation data south and west of the Rio Grande: drawn as mesquite and thornscrub brush on its real heights (ceiling)',
  record: 'docs/evidence/outside-data.json',
};
const provinceOut = {
  kind: 'texas-outside-province', version: 1,
  builtFrom: 'scripts/build-outside.mjs over the raw data in docs/evidence/outside-data.json and public/terrain',
  sources,
  units: 'hundredths of a mile, x east and y south of the confluence of the San Marcos and the Guadalupe; every line a flat [x0, y0, x1, y1, ...]',
  bounds, box: boxBounds,
  note: 'the country round the colonies\' box, drawn under nothing and beside everything: inside `box` the box\'s own province is drawn, and this layer only carries on the rivers the box does not draw',
  bands: BANDS,
  rivers,
  sea: { note: 'closed outlines of the water outside the box, and the box\'s own for two cells inside its edge; draw even-odd, before the box\'s sea', levels: seaRings.map(level => level.map(hundredths)) },
  shore: { note: 'the sea outline that is neither the extent\'s edge nor the box\'s, longest first', levels: shoreLevels.map(level => level.map(hundredths)) },
  escarpment: { note: 'EPA\'s line outside the box, in pieces; band 0 is the band 1 line', levels: escarpmentLevels },
  seams,
  relief: reliefGrid,
};
const landOut = {
  kind: 'outside-land', version: 2, landBits: LAND_BITS,
  builtFrom: 'scripts/build-outside.mjs', sources,
  cellByte: `low ${LAND_BITS} bits the land class (index into land), the bits above the relief class (index into relief); 0 where the box draws its own`,
  shadeByte: 'hillshade lit from the north-west, 0 dark to 255 bright, 128 level ground',
  claims: 'a cell here that is not 0 inside the box is drawn from here and not from the box\'s own band: the box\'s edge, where its hillshade leaned on nothing',
  land: LAND, relief: RELIEF,
  bounds, box: boxBounds,
  bands,
};
const woodsOut = {
  kind: 'outside-woods', version: 2,
  builtFrom: 'scripts/build-outside.mjs', sources,
  grid: { minX, minY, columns, rows, cell: CELL, file: 'outside-woods.bin.gz', note: 'one byte a cell: the index into stands, as colonies-woods.bin; 0 inside the box, where the box\'s own grid is read, and off the extent' },
  stands: STAND_IDS, box: boxBounds,
};
const provinceJson = JSON.stringify(provinceOut), landJson = JSON.stringify(landOut);
const provinceGz = gzipSync(provinceJson, { level: 9 }), landGz = gzipSync(landJson, { level: 9 });
const woodsGz = gzipSync(JSON.stringify(woodsOut), { level: 9 }), standsGz = gzipSync(Buffer.from(outsideStands.buffer), { level: 9 });
writeFileSync('public/terrain/outside-province.json.gz', provinceGz);
writeFileSync('public/terrain/outside-land.json.gz', landGz);
writeFileSync('public/terrain/outside-woods.json.gz', woodsGz);
writeFileSync('public/terrain/outside-woods.bin.gz', standsGz);
const tally = {};
for (let i = 0; i < size; i++) if (IN_EXTENT[i] && !IN_BOX[i]) { const id = LAND_IDS[land[i]]; tally[id] = (tally[id] || 0) + 1; }
const outsideCells = Object.values(tally).reduce((a, b) => a + b, 0);
let mexicoCells = 0; for (let i = 0; i < size; i++) mexicoCells += mexico[i];
const points = levels => levels.map(level => level.reduce((n, line) => n + line.length / 2, 0));
console.log(`Land outside the box: ${Object.entries(tally).map(([k, v]) => `${k} ${(100 * v / outsideCells).toFixed(1)}`).join(', ')}; Mexico ${mexicoCells} cells`);
console.log(`Rivers ${rivers.length} pieces; points per band ${BANDS.map((_, band) => rivers.reduce((n, river) => n + (river.levels[band]?.length || 0) / 2, 0)).join(' / ')}`);
console.log(`Sea rings per band ${seaRings.map(l => l.length).join(' / ')}, points ${points(provinceOut.sea.levels).join(' / ')}; shore lines ${shoreLevels.map(l => l.length).join(' / ')}`);
console.log(`Escarpment pieces ${escarpmentPieces.length}; relief ${reliefColumns} x ${reliefRows}`);
console.log(`Bounds ${JSON.stringify(bounds)}`);
console.log(`Wrote outside-province ${(provinceGz.length / 1e3).toFixed(0)} KB (${(provinceJson.length / 1e6).toFixed(2)} MB JSON), outside-land ${(landGz.length / 1e3).toFixed(0)} KB (${(landJson.length / 1e6).toFixed(2)} MB JSON), outside-woods ${(standsGz.length / 1e3).toFixed(0)} KB and its header ${(woodsGz.length / 1e3).toFixed(1)} KB, in ${seconds()} s`);

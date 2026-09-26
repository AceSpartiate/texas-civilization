// Builds what kind of land each part of the colonies is - its cover and its lie - from the data the game already ships:
// docs/MAP_ACCURACY.md §5.
//
//   node scripts/build-land.mjs
//
// Reads public/terrain (scripts/build-terrain.mjs, scripts/build-woods.mjs) and writes
//
//   public/terrain/colonies-land.bin.gz   one byte an eighth-of-a-mile cell, on exactly the elevation grid: the land class
//                                         in the low four bits, the relief class in the high four (LAND and RELIEF below)
//   public/terrain/colonies-land.json.gz  the legend, the Balcones Escarpment line, and the same classes at coarser bands
//                                         with a hillshade for each, for the map zoomed out
//
// **Where each class comes from.**
//   - Cover is the woods' stand - since 2026-09-19 the biomes of 1836 (scripts/build-woods.mjs, docs/BIOMES.md), one class
//     each (scripts/terrain/biomes.mjs `COVER_OF_STAND`) - with three things the stand grid lumps recovered from other data:
//     **the sea and the bays** are the USGS 3DEP elevation's no-data and ground under 0.3 m joined to the Gulf; **coastal
//     marsh** is LANDFIRE's marsh, and its coastal and tallgrass prairie inside EPA's Level IV coastal marsh ecoregions (34g
//     Texas-Louisiana Coastal Marshes, 34h Mid-Coast Barrier Islands and Coastal Marshes); **sand and beach** is the dunes,
//     and land under 5 m within a quarter mile of the open Gulf.
//   - Relief is the elevation's own lie: the slope across a quarter mile and the rise and fall within about a mile, in
//     four classes, with the steep ground beside a watercourse called a bluff and the rough ground along EPA's line
//     between the Edwards Plateau and the plains called the escarpment.
//   - **There is no desert in the colonies.** The driest country in the box is the South Texas brush - LANDFIRE's
//     Tamaulipan thornscrub and mesquite savanna settings, EPA's 31c Texas-Tamaulipan Thornscrub - and it is drawn as
//     mesquite prairie and chaparral. The Chihuahuan Desert (EPA Level III 24) begins beyond the Pecos, some two hundred miles
//     west of the box.
//
// Like the woods, this is LANDFIRE's model of the vegetation before settlement and today's ground, not a survey of 1835.
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { boxTerrain as realTerrain } from '../sim/terrain-data.mjs';
import { contours, lineLength, simplifyLine } from './terrain/lines.mjs';
import { LAND, LAND_BITS, RELIEF, LAND_BANDS } from '../sim/land.mjs';
import { COVER_OF_STAND, MARSH_PRAIRIES } from './terrain/biomes.mjs';

const terrain = realTerrain();
const { header, heights } = terrain;
const { minX, minY, columns, rows, cell, noData } = header.grid;
const { origin, projection, area } = header;
const METRES_PER_MILE = 1609.344;
const toMiles = (lon, lat) => ({ x: (lon - origin.lon) * projection.milesPerLon, y: (origin.lat - lat) * projection.milesPerLat });
const lonOfColumn = c => origin.lon + (minX + (c + 0.5) * cell) / projection.milesPerLon;
const latOfRow = r => origin.lat - (minY + (r + 0.5) * cell) / projection.milesPerLat;
const code = id => LAND.findIndex(entry => entry.id === id);
const reliefCode = id => RELIEF.findIndex(entry => entry.id === id);
const size = columns * rows;

const woodsHeader = JSON.parse(gunzipSync(readFileSync('public/terrain/colonies-woods.json.gz')).toString('utf8'));
const stands = gunzipSync(readFileSync('public/terrain/colonies-woods.bin.gz'));
if (woodsHeader.grid.columns !== columns || woodsHeader.grid.rows !== rows || stands.length !== size) throw new Error('The woods grid is not the elevation grid');
const STAND_IDS = woodsHeader.stands.map(stand => stand.id);
const eco = woodsHeader.ecoregions, ecoGrid = Buffer.from(eco.grid, 'base64');
const ecoCodeAt = index => {
  const x = minX + (index % columns + 0.5) * cell, y = minY + (Math.floor(index / columns) + 0.5) * cell;
  const c = Math.floor((x - minX) / eco.cell), r = Math.floor((y - minY) / eco.cell);
  const value = c >= 0 && r >= 0 && c < eco.columns && r < eco.rows ? ecoGrid[r * eco.columns + c] : 0;
  return value ? eco.regions[value - 1].code : '';
};

// ---- The sea -------------------------------------------------------------------------------------------------
// The open Gulf is where the elevation has no land; a bay stands at sea level. Water is ground under 0.3 m joined to
// the Gulf, filled from open water off Galveston, never out past the colonies' box where there is no data at all.
const isLow = index => heights[index] === noData || heights[index] < 3;
const inBox = index => { const lon = lonOfColumn(index % columns), lat = latOfRow(Math.floor(index / columns)); return lon >= area.west && lon <= area.east && lat >= area.south && lat <= area.north; };
const sea = new Uint8Array(size);
{
  const seed = toMiles(-94.5, 28.5), start = Math.floor((seed.y - minY) / cell) * columns + Math.floor((seed.x - minX) / cell);
  if (heights[start] !== noData) throw new Error('The seed of the Gulf is not open water');
  const stack = [start]; sea[start] = 1;
  while (stack.length) {
    const current = stack.pop(), c = current % columns, r = (current - c) / columns;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= columns || nr >= rows) continue;
      const next = nr * columns + nc;
      if (sea[next] || !isLow(next) || (heights[next] === noData && !inBox(next))) continue;
      sea[next] = 1; stack.push(next);
    }
  }
}
// A pond joined to a bay by a ditch is not the sea: open the sea by a cell, so only water a quarter mile across, or
// joined by a channel that wide, is kept. ceiling: a pass narrower than that through a barrier island closes.
const water = new Uint8Array(size);
{
  const eroded = new Uint8Array(size);
  for (let r = 1; r < rows - 1; r++) for (let c = 1; c < columns - 1; c++) {
    const i = r * columns + c;
    eroded[i] = sea[i] && sea[i - 1] && sea[i + 1] && sea[i - columns] && sea[i + columns] ? 1 : 0;
  }
  for (let r = 1; r < rows - 1; r++) for (let c = 1; c < columns - 1; c++) {
    const i = r * columns + c;
    water[i] = eroded[i] || eroded[i - 1] || eroded[i + 1] || eroded[i - columns] || eroded[i + columns] ? 1 : 0;
  }
  for (let c = 0; c < columns; c++) { water[c] = water[columns + c]; water[(rows - 1) * columns + c] = water[(rows - 2) * columns + c]; }
  for (let r = 0; r < rows; r++) { water[r * columns] = water[r * columns + 1]; water[r * columns + columns - 1] = water[r * columns + columns - 2]; }
}

// ---- Cover ---------------------------------------------------------------------------------------------------
// Each stand's drawn class: since 2026-09-19 the biomes of 1836, one wash each (scripts/terrain/biomes.mjs, docs/BIOMES.md §7.2).
const COASTAL_MARSH_ECOREGIONS = ['34g', '34h', '34i'];
const land = new Uint8Array(size); // cover class
const UNSET = 255;
for (let i = 0; i < size; i++) {
  if (water[i]) { land[i] = code('water'); continue; }
  if (heights[i] === noData || !inBox(i)) { land[i] = code('none'); continue; }
  const stand = STAND_IDS[stands[i]];
  let cover = COVER_OF_STAND[stand];
  if (MARSH_PRAIRIES.includes(stand) && COASTAL_MARSH_ECOREGIONS.includes(ecoCodeAt(i))) cover = 'marsh';
  // Open water inland is a modern reservoir or a river's own bed, and off the vegetation data is a hole: both take the
  // land round them, below.
  land[i] = cover ? code(cover) : UNSET;
}
// Fill each hole from its neighbours, a ring at a time, by the most common class round it.
for (let pass = 0, left = true; left && pass < 400; pass++) {
  left = false;
  const next = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
    const i = r * columns + c;
    if (land[i] !== UNSET) continue;
    const votes = new Map();
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      if ((!dr && !dc) || rr < 0 || cc < 0 || rr >= rows || cc >= columns) continue;
      const v = land[rr * columns + cc];
      if (v === UNSET || v === code('water') || v === code('none')) continue;
      votes.set(v, (votes.get(v) || 0) + 1);
    }
    if (votes.size) next.push([i, [...votes].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]]);
    else left = true;
  }
  for (const [i, v] of next) land[i] = v;
}
for (let i = 0; i < size; i++) if (land[i] === UNSET) land[i] = code('prairie');
// Sand and beach: low land at the water's edge that faces the open Gulf - water all the way out, six miles to the
// south-south-east (the Gulf lies off the whole coast of the box on that bearing), with no island or far shore between.
// The data puts the nearshore Gulf at sea level like a bay, so it is the view out, not the depth, that tells them apart.
// ceiling: a Gulf beach is a band a quarter mile deep; LANDFIRE's dune and sand-sheet settings, filed under prairie in the
// shipped stand grid, would give the real sand if the vegetation raster is read again.
export const BEACH_VIEW_MILES = 6;
{
  const REACH = 2, OUT = Math.round(BEACH_VIEW_MILES / cell), dx = Math.sin(145 * Math.PI / 180), dy = -Math.cos(145 * Math.PI / 180);
  const faces = (r, c) => {
    let wet = 0;
    for (let s = 1; s <= OUT; s++) {
      const rr = Math.round(r + dy * s), cc = Math.round(c + dx * s);
      if (rr < 0 || cc < 0 || rr >= rows || cc >= columns) return wet > 0;
      if (water[rr * columns + cc]) wet++;
      else if (wet) return false; // land again after water: an island or the far shore of a bay
    }
    return wet > 0;
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
    const i = r * columns + c;
    if (water[i] || land[i] === code('none') || heights[i] >= 50) continue;
    let near = false;
    for (let dr = -REACH; dr <= REACH && !near; dr++) for (let dc = -REACH; dc <= REACH && !near; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < rows && cc < columns && water[rr * columns + cc]) near = true;
    }
    if (near && faces(r, c)) land[i] = code('sand');
  }
}

// ---- Relief --------------------------------------------------------------------------------------------------
const metres = new Float32Array(size);
for (let i = 0; i < size; i++) metres[i] = heights[i] === noData ? 0 : heights[i] / 10;
const at = (c, r) => metres[Math.max(0, Math.min(rows - 1, r)) * columns + Math.max(0, Math.min(columns - 1, c))];
/** Rise and fall within a window 2 × RADIUS + 1 cells a side (nine cells: about 1.1 miles), max minus min, separably. */
const RADIUS = 4;
function windowRange() {
  const rowMax = new Float32Array(size), rowMin = new Float32Array(size), range = new Float32Array(size);
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
    let hi = -Infinity, lo = Infinity;
    for (let d = -RADIUS; d <= RADIUS; d++) { const v = at(c + d, r); if (v > hi) hi = v; if (v < lo) lo = v; }
    rowMax[r * columns + c] = hi; rowMin[r * columns + c] = lo;
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
    let hi = -Infinity, lo = Infinity;
    for (let d = -RADIUS; d <= RADIUS; d++) {
      const rr = Math.max(0, Math.min(rows - 1, r + d)), j = rr * columns + c;
      if (rowMax[j] > hi) hi = rowMax[j]; if (rowMin[j] < lo) lo = rowMin[j];
    }
    range[r * columns + c] = hi - lo;
  }
  return range;
}
const range = windowRange();
// Beside a river or bayou, a quarter mile either side: a bluff is a river's. Steep ground along a hill country creek is
// the hills' own, and is drawn as hills.
const besideWater = new Uint8Array(size);
for (const course of terrain.courses) {
  if (!/\b(River|Bayou)$/.test(course.name || '')) continue;
  for (let k = 1; k < course.points.length; k++) {
    const a = course.points[k - 1], b = course.points[k], steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (cell / 2)));
    for (let s = 0; s <= steps; s++) {
      const x = a.x + (b.x - a.x) * s / steps, y = a.y + (b.y - a.y) * s / steps;
      const c0 = Math.floor((x - minX) / cell), r0 = Math.floor((y - minY) / cell);
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const rr = r0 + dr, cc = c0 + dc;
        if (rr >= 0 && cc >= 0 && rr < rows && cc < columns) besideWater[rr * columns + cc] = 1;
      }
    }
  }
}
// The escarpment: EPA's Level IV line between the Edwards Plateau (Level III 30) and the plains below it (31, 32, 33).
const ecoField = new Float32Array(eco.columns * eco.rows);
for (let i = 0; i < ecoField.length; i++) {
  const level3 = ecoGrid[i] ? eco.regions[ecoGrid[i] - 1].code.slice(0, 2) : '';
  ecoField[i] = level3 === '30' ? 1 : ['31', '32', '33'].includes(level3) ? 0 : NaN;
}
const ecoOutline = contours(ecoField, eco.columns, eco.rows, 0.5, (c, r) => ({ x: minX + (c + 0.5) * eco.cell, y: minY + (r + 0.5) * eco.cell }));
const escarpmentLine = simplifyLine([...ecoOutline.lines, ...ecoOutline.rings].sort((a, b) => lineLength(b) - lineLength(a))[0], 0.25);
/** How far the escarpment's rough ground reaches either side of EPA's line, miles. */
export const ESCARPMENT_MILES = 2;
const nearEscarpment = new Uint8Array(size);
for (let k = 1; k < escarpmentLine.length; k++) {
  const a = escarpmentLine[k - 1], b = escarpmentLine[k], steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / cell));
  const reach = Math.ceil(ESCARPMENT_MILES / cell);
  for (let s = 0; s <= steps; s++) {
    const x = a.x + (b.x - a.x) * s / steps, y = a.y + (b.y - a.y) * s / steps;
    const c0 = Math.floor((x - minX) / cell), r0 = Math.floor((y - minY) / cell);
    for (let dr = -reach; dr <= reach; dr++) for (let dc = -reach; dc <= reach; dc++) {
      if (dr * dr + dc * dc > reach * reach) continue;
      const rr = r0 + dr, cc = c0 + dc;
      if (rr >= 0 && cc >= 0 && rr < rows && cc < columns) nearEscarpment[rr * columns + cc] = 1;
    }
  }
}
const relief = new Uint8Array(size);
const run = 2 * cell * METRES_PER_MILE;
for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
  const i = r * columns + c;
  if (land[i] === code('water') || land[i] === code('none')) { relief[i] = reliefCode('flat'); continue; }
  const slope = 100 * Math.hypot(at(c + 1, r) - at(c - 1, r), at(c, r + 1) - at(c, r - 1)) / run;
  const rise = range[i];
  // The thresholds are FIC-GONZ-057: measured where the country is known, not published classes.
  let kind = rise >= 70 || slope >= 7 ? 'steep' : rise >= 35 || slope >= 3 ? 'hills' : rise >= 15 || slope >= 1.5 ? 'rolling' : 'flat';
  if (nearEscarpment[i] && (kind === 'hills' || kind === 'steep')) kind = 'escarpment';
  else if (besideWater[i] && slope >= 4) kind = 'bluff';
  relief[i] = reliefCode(kind);
}

// ---- Bands ---------------------------------------------------------------------------------------------------
/** The most common value of a block's cells, ties to the lower code; off the data only if all of it is. */
function band(miles) {
  const block = Math.round(miles / cell);
  const bandColumns = Math.ceil(columns / block), bandRows = Math.ceil(rows / block);
  const classes = new Uint8Array(bandColumns * bandRows), shade = new Uint8Array(bandColumns * bandRows);
  const mean = new Float32Array(bandColumns * bandRows);
  for (let br = 0; br < bandRows; br++) for (let bc = 0; bc < bandColumns; bc++) {
    const landVotes = new Uint32Array(1 << LAND_BITS), reliefVotes = new Uint32Array(1 << LAND_BITS);
    let total = 0, n = 0;
    for (let r = br * block; r < Math.min(rows, (br + 1) * block); r++) for (let c = bc * block; c < Math.min(columns, (bc + 1) * block); c++) {
      const i = r * columns + c;
      landVotes[land[i]]++; reliefVotes[relief[i]]++; total += metres[i]; n++;
    }
    const pick = (votes, skip) => { let best = -1; for (let v = 0; v < votes.length; v++) if (v !== skip && votes[v] && (best < 0 || votes[v] > votes[best])) best = v; return best; };
    const landClass = pick(landVotes, code('none'));
    const reliefClass = pick(reliefVotes, -1);
    classes[br * bandColumns + bc] = (landClass < 0 ? code('none') : landClass) | (reliefClass << LAND_BITS);
    mean[br * bandColumns + bc] = n ? total / n : 0;
  }
  // Hillshade lit from the north-west at 45°, 128 is level ground; exaggerated more as the cells grow, or the land goes flat.
  const exaggerate = 2 * Math.sqrt(miles / cell);
  const m = (c, r) => mean[Math.max(0, Math.min(bandRows - 1, r)) * bandColumns + Math.max(0, Math.min(bandColumns - 1, c))];
  const step = miles * METRES_PER_MILE;
  const light = { x: -Math.SQRT1_2 * Math.SQRT1_2, y: -Math.SQRT1_2 * Math.SQRT1_2, z: Math.SQRT1_2 };
  for (let r = 0; r < bandRows; r++) for (let c = 0; c < bandColumns; c++) {
    const dx = (m(c + 1, r) - m(c - 1, r)) / (2 * step) * exaggerate, dy = (m(c, r + 1) - m(c, r - 1)) / (2 * step) * exaggerate;
    const length = Math.hypot(dx, dy, 1);
    const lit = (-dx * light.x - dy * light.y + light.z) / length; // normal (-dx, -dy, 1)
    // In steps of eight, which halves the file and is finer than a shade anybody reads.
    shade[r * bandColumns + c] = Math.max(0, Math.min(248, Math.round((128 + (lit - light.z) * 400) / 8) * 8));
  }
  return { cell: miles, columns: bandColumns, rows: bandRows, minX, minY, classes: Buffer.from(classes).toString('base64'), shade: Buffer.from(shade).toString('base64') };
}

const native = new Uint8Array(size);
if (LAND.length > 1 << LAND_BITS || RELIEF.length > 1 << (8 - LAND_BITS)) throw new Error('The classes do not fit a byte');
for (let i = 0; i < size; i++) native[i] = land[i] | (relief[i] << LAND_BITS);
const tally = LAND.map((_, v) => 0), reliefTally = RELIEF.map(() => 0);
for (let i = 0; i < size; i++) { tally[land[i]]++; reliefTally[relief[i]]++; }
const output = {
  kind: 'colonies-land', version: 2, landBits: LAND_BITS,
  builtFrom: 'scripts/build-land.mjs over public/terrain (colonies-elevation, colonies-water, colonies-woods)',
  sources: {
    cover: 'LANDFIRE LF2016 Biophysical Settings read as the biomes of 1836 in colonies-woods.bin.gz (docs/BIOMES.md, docs/evidence/outside-data.json), public domain',
    sea: 'USGS 3DEP 1 arc-second elevation (docs/evidence/terrain-data.json), public domain: no land, or under 0.3 m joined to the Gulf',
    marsh: 'U.S. EPA Level IV Ecoregions of Texas (2011), 34g and 34h, public domain',
    relief: 'USGS 3DEP 1 arc-second elevation, slope and local relief; thresholds FIC-GONZ-057',
    escarpment: 'U.S. EPA Level IV Ecoregions of Texas (2011): Level III 30 against 31, 32 and 33',
  },
  cellByte: `low ${LAND_BITS} bits the land class (index into land), the bits above the relief class (index into relief)`,
  shadeByte: 'hillshade lit from the north-west, 0 dark to 255 bright, 128 level ground',
  land: LAND, relief: RELIEF,
  native: { cell, columns, rows, minX, minY, file: 'colonies-land.bin.gz', note: 'one cellByte an eighth-of-a-mile cell, aligned with colonies-elevation.bin.gz' },
  bands: LAND_BANDS.map(miles => band(miles)),
  escarpment: escarpmentLine.flatMap(p => [Math.round(p.x * 100), Math.round(p.y * 100)]),
  shares: Object.fromEntries([...LAND.map((entry, v) => [entry.id, +(100 * tally[v] / size).toFixed(2)]), ...RELIEF.map((entry, v) => [`relief:${entry.id}`, +(100 * reliefTally[v] / size).toFixed(2)])]),
};
const binGz = gzipSync(Buffer.from(native), { level: 9 });
const json = JSON.stringify(output), jsonGz = gzipSync(json, { level: 9 });
writeFileSync('public/terrain/colonies-land.bin.gz', binGz);
writeFileSync('public/terrain/colonies-land.json.gz', jsonGz);
console.log(Object.entries(output.shares).map(([k, v]) => `${k} ${v}`).join(', '));
console.log(`Bands ${output.bands.map(b => `${b.cell} mi ${b.columns}x${b.rows}`).join(', ')}`);
console.log(`Wrote land ${(binGz.length / 1e3).toFixed(0)} KB and header ${(jsonGz.length / 1e3).toFixed(0)} KB (gzip; ${(json.length / 1e3).toFixed(0)} KB JSON)`);

// Builds the country drawn around the families, zoomed out, from the same real land they live on: docs/MAP_ACCURACY.md.
//
//   node scripts/build-province.mjs
//
// Reads public/terrain (scripts/build-terrain.mjs, scripts/build-woods.mjs, scripts/build-colonies-map.mjs) and writes
// public/terrain/colonies-province.json.gz. No new data is read: the rivers are the USGS National Hydrography Dataset
// flowlines the game already ships, the sea, the coast and the covers are the land layer (scripts/build-land.mjs), the
// woods are LANDFIRE's Biophysical Settings, the Balcones Escarpment is EPA's Level IV ecoregion line, and the towns are
// the colonies map's own places.
//
// It replaces, for a class on the real land, the invented province of sim/texas.mjs (FIC-GONZ-002), whose rivers, coast,
// belts of country and towns were drawn in the right order and at the wrong places - the Trinity a hundred miles east of
// Liberty, the San Antonio a band wider than Béxar laid across the Alamo.
//
// **Bands of detail.** Every line and outline is kept at a few tolerances (`BANDS`, miles), finest first, and each band
// is simplified from the band finer than it, so the points of a coarse band are points of the fine band: a river drawn
// at one band lies on the river drawn at the next, and nothing jumps when the map changes band. The finest river band
// is exactly the line the colonies map draws near the settlements.
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { boxTerrain as realTerrain } from '../sim/terrain-data.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';
import { sampleReliefGrid } from '../sim/terrain.mjs';
import { contours, joinReaches, lineLength, ringArea, simplifyLine, simplifyRing } from './terrain/lines.mjs';

const terrain = realTerrain();
const built = coloniesMap();
const { header } = terrain;
const { minX, minY, columns, rows, cell } = header.grid;
const { origin, projection, area } = header;

/** The tolerance of each band, miles: a town's streets, a county, a few counties, the colonies. */
export const BANDS = [0.05, 0.25, 1, 3];
const hundredths = points => points.flatMap(p => [Math.round(p.x * 100), Math.round(p.y * 100)]);
const toMiles = (lon, lat) => ({ x: (lon - origin.lon) * projection.milesPerLon, y: (origin.lat - lat) * projection.milesPerLat });
const round2 = value => { const fixed = +value.toFixed(2); return fixed === 0 ? 0 : fixed; };

// The land the data covers: the colonies' box, in the game's miles. Nothing is drawn outside it.
const corner = toMiles(area.west, area.north), far = toMiles(area.east, area.south);
const bounds = { minX: round2(corner.x), maxX: round2(far.x), minY: round2(corner.y), maxY: round2(far.y) };

// ---- Rivers ----------------------------------------------------------------------------------------------------
// Each river's channel in feet, for drawing: an order of size, not a measurement of 1835 (FIC-GONZ-057). `width` is
// twice the channel in miles, which is what the page's province stroke has always multiplied by half the scale; the
// invented province's widths (2 to 3) drew every river a mile or more across, a band wider than Béxar.
const RIVERS = [
  ['Brazos River', 400], ['Colorado River', 350], ['Trinity River', 350], ['Guadalupe River', 200], ['Neches River', 250],
  ['San Antonio River', 60], ['San Marcos River', 80], ['Lavaca River', 120], ['Navasota River', 120], ['San Jacinto River', 200],
  ['Angelina River', 150], ['Medina River', 100], ['Navidad River', 100], ['San Bernard River', 120], ['Buffalo Bayou', 150],
  ['Cibolo Creek', 40], ['Plum Creek', 30], ['Peach Creek', 30], ['Sandies Creek', 30], ['Oyster Creek', 40],
];
const idOf = name => name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '');
// The colonies map's own drawn rivers are the finest band where it has them, point for point; the rest are joined and
// simplified the same way here (0.05 miles, as scripts/build-colonies-map.mjs does).
const drawnByName = new Map();
for (const course of built.watercourses) {
  if (!drawnByName.has(course.name)) drawnByName.set(course.name, []);
  drawnByName.get(course.name).push(course.points);
}
const joined = joinReaches(terrain.courses);
const rivers = [];
for (const [name, channelFeet] of RIVERS) {
  const width = +(2 * channelFeet / 5280).toFixed(4);
  const fromMap = drawnByName.get(name) && built.watercourses.some(course => course.name === name && course.kind === 'river');
  const pieces = fromMap ? drawnByName.get(name) : joined.filter(course => course.name === name).map(course => simplifyLine(course.points, BANDS[0]).map(p => ({ x: round2(p.x), y: round2(p.y) })));
  if (!pieces.length) throw new Error(`${name} is not in the data`);
  pieces.forEach((points, part) => {
    const levels = [points];
    for (let band = 1; band < BANDS.length; band++) levels.push(simplifyLine(levels[band - 1], BANDS[band]));
    // A piece shorter than a few tolerances is not drawn at that band: it would be a dot.
    const length = lineLength(points);
    const kept = levels.map((line, band) => (band === 0 || length >= BANDS[band] * 4) && line.length >= 2 ? hundredths(line) : null);
    if (length < 0.1) return;
    rivers.push({ id: `${idOf(name)}-${part}`, name, width, channelFeet, length: round2(length), levels: kept });
  });
}

// ---- The Gulf and its bays -------------------------------------------------------------------------------------
// The water of the land layer (scripts/build-land.mjs): the Gulf and the bays joined to it.
const landHeader = JSON.parse(gunzipSync(readFileSync('public/terrain/colonies-land.json.gz')).toString('utf8'));
const landCells = gunzipSync(readFileSync('public/terrain/colonies-land.bin.gz'));
if (landHeader.native.columns !== columns || landHeader.native.rows !== rows) throw new Error('The land grid is not the elevation grid');
const LAND_IDS = landHeader.land.map(entry => entry.id);
// The land's class is the cell's low bits: four before 2026-09-19, the header's `landBits` (five) since. ceiling: this file
// was last built from the land of 2026-09-18; on the real land its cover belts are drawn only while the land's own classes
// load (public/app.js `drawProvince`), so it was not rebuilt for the biomes. Rebuilding it maps them by `COVER_OF_LAND`.
const landOf = index => LAND_IDS[landCells[index] & ((1 << (landHeader.landBits || 4)) - 1)];
// The sea closes along the edge of the data: a border of land a cell wide all round, so the Gulf is one outline to fill.
const padded = new Float32Array((columns + 2) * (rows + 2));
for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) padded[(r + 1) * (columns + 2) + c + 1] = landOf(r * columns + c) === 'water' ? 1 : 0;
const seaOutline = contours(padded, columns + 2, rows + 2, 0.5, (c, r) => ({ x: minX + (c - 0.5) * cell, y: minY + (r - 0.5) * cell }));
if (seaOutline.lines.length) throw new Error('The sea has an open outline');
// The sea's outline runs along the edge of the data where the Gulf reaches it: that is no shore. Within a cell and a half
// of the colonies' box (the data stops at the box, a fraction of a cell inside the grid's own edge) is the edge.
const EDGE = 1.5 * cell;
const onEdge = p => p.x <= bounds.minX + EDGE || p.y <= bounds.minY + EDGE || p.x >= bounds.maxX - EDGE || p.y >= bounds.maxY - EDGE;
/** Rings kept at each band: nested simplification, and nothing smaller than the band can show. */
function ringLevels(rings, smallest) {
  const out = BANDS.map(() => []);
  for (const ring of rings) {
    let current = simplifyRing(ring, BANDS[0]);
    for (let band = 0; band < BANDS.length; band++) {
      if (band) current = simplifyRing(current, BANDS[band]);
      if (smallest[band] === Infinity) continue; // a band this outline is not drawn at
      if (current.length < 3 || Math.abs(ringArea(current)) < smallest[band]) break;
      out[band].push(current);
    }
  }
  return out;
}
const seaRings = ringLevels(seaOutline.rings, [0.05, 0.5, 4, 30]);
// The shore: the sea's outline where it is not the edge of the data - the Gulf side of the mainland and islands, and the bays.
// An island's whole outline is shore, and is simplified as a ring and closed.
const shoreLines = [];
for (const ring of seaOutline.rings) {
  const start = ring.findIndex(onEdge);
  if (start < 0) { shoreLines.push({ ring, length: lineLength([...ring, ring[0]]) }); continue; }
  const ordered = [...ring.slice(start), ...ring.slice(0, start + 1)];
  let run = [];
  for (const point of ordered) {
    if (onEdge(point)) { if (run.length > 1) shoreLines.push({ line: run, length: lineLength(run) }); run = []; } else run.push(point);
  }
  if (run.length > 1) shoreLines.push({ line: run, length: lineLength(run) });
}
shoreLines.sort((a, b) => b.length - a.length);
if (!shoreLines.length || shoreLines[0].length < 100) throw new Error('No shore found');
const shoreLevels = BANDS.map(() => []);
for (const { ring, line, length } of shoreLines) {
  let current = ring ? simplifyRing(ring, BANDS[0]) : simplifyLine(line, BANDS[0]);
  for (let band = 0; band < BANDS.length; band++) {
    if (band) current = ring ? simplifyRing(current, BANDS[band]) : simplifyLine(current, BANDS[band]);
    if (length < BANDS[band] * 10 || current.length < (ring ? 3 : 2)) break;
    shoreLevels[band].push(ring ? [...current, current[0]] : current);
  }
}

// ---- The woods and the country ---------------------------------------------------------------------------------
// The land layer's classes read a half mile at a time: each cover is the share of the half mile's cells in it, and its
// outline is where that share crosses a half, so an outline and the land grid always agree. Prairie is the ground every
// other cover is drawn over; the water is the sea's.
/** Which cover each land class is drawn as. The ids are the invented province's, which the renderer already colours. */
const COVER_OF_LAND = {
  floodplain: 'forest', pine: 'forest', 'live-oak': 'forest', savanna: 'savannah', 'hill-country': 'plateau', brush: 'brush', marsh: 'marsh', sand: 'sand',
  // The biomes of 1836 (docs/BIOMES.md), into the same six belts.
  longleaf: 'forest', thicket: 'forest', 'cypress-swamp': 'forest', 'palm-grove': 'forest', 'thorn-riparian': 'forest', canebrake: 'forest',
  'cross-timbers': 'savannah', 'cedar-brake': 'plateau', chaparral: 'brush', 'mesquite-savanna': 'brush', 'salt-prairie': 'marsh',
};
const COVERS = ['savannah', 'plateau', 'brush', 'marsh', 'sand', 'forest'];
const COVER_NAMES = { forest: 'Timber: bottomland, floodplain, pine and live oak woods', savannah: 'Post oak savanna', plateau: 'Hill country savanna', brush: 'Mesquite and thornscrub brush', marsh: 'Coastal marsh and salt prairie', sand: 'Sand and beach' };
const BLOCK = 4; // cells a side: half a mile
const blockColumns = Math.floor(columns / BLOCK), blockRows = Math.floor(rows / BLOCK);
const blockCentre = (c, r) => ({ x: minX + (c + 0.5) * BLOCK * cell, y: minY + (r + 0.5) * BLOCK * cell });
const woods = {};
for (const cover of COVERS) {
  const share = new Float32Array(blockColumns * blockRows);
  for (let br = 0; br < blockRows; br++) for (let bc = 0; bc < blockColumns; bc++) {
    let count = 0, land = 0;
    for (let r = br * BLOCK; r < (br + 1) * BLOCK; r++) for (let c = bc * BLOCK; c < (bc + 1) * BLOCK; c++) {
      const kind = landOf(r * columns + c);
      if (kind === 'none') continue;
      land++;
      if (COVER_OF_LAND[kind] === cover) count++;
    }
    share[br * blockColumns + bc] = land ? count / (BLOCK * BLOCK) : 0;
  }
  // A light blur, three by three, so an outline follows the stand rather than the half-mile blocks.
  const smooth = new Float32Array(share.length);
  for (let r = 0; r < blockRows; r++) for (let c = 0; c < blockColumns; c++) {
    let sum = 0, n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= blockRows || cc >= blockColumns) continue;
      const w = dr || dc ? 1 : 2; sum += share[rr * blockColumns + cc] * w; n += w;
    }
    smooth[r * blockColumns + c] = sum / n;
  }
  // Edges: nothing beyond the data, so an outline closes along the edge of the land instead of running off it.
  for (let c = 0; c < blockColumns; c++) smooth[c] = smooth[(blockRows - 1) * blockColumns + c] = 0;
  for (let r = 0; r < blockRows; r++) smooth[r * blockColumns] = smooth[r * blockColumns + blockColumns - 1] = 0;
  const outline = contours(smooth, blockColumns, blockRows, 0.5, blockCentre);
  if (outline.lines.length) throw new Error(`${cover} has an open outline`);
  // The finest band of the woods is the county band: closer in, the woods are the tiles (sim/woods-view.mjs).
  const levels = ringLevels(outline.rings, [Infinity, 0.75, 6, 40]);
  woods[cover] = levels;
}

// ---- The Balcones Escarpment -----------------------------------------------------------------------------------
// EPA's line between the Edwards Plateau and the plains below it, as the land layer traced it (0.25 miles).
const escarpmentFine = [];
for (let i = 0; i < landHeader.escarpment.length; i += 2) escarpmentFine.push({ x: landHeader.escarpment[i] / 100, y: landHeader.escarpment[i + 1] / 100 });
const escarpment = [escarpmentFine];
for (let band = 2; band < BANDS.length; band++) escarpment.push(simplifyLine(escarpment.at(-1), BANDS[band]));

// ---- Towns, ground ---------------------------------------------------------------------------------------------
const WEIGHT = { bexar: 'major', 'san-felipe': 'major', nacogdoches: 'major', goliad: 'major', matagorda: 'port', velasco: 'port' };
const settlements = Object.values(built.places).filter(place => place.kind === 'town')
  .map(place => ({ id: place.id, name: place.name, x: place.x, y: place.y, weight: WEIGHT[place.id] || 'minor', claimId: place.claimId }));
// The shaded relief under everything, at the invented province's grain; the Gulf reads as the lowest ground.
const relief = sampleReliefGrid({ heightAt: (x, y) => { const h = terrain.heightAt(x, y); return Number.isFinite(h) ? h : 0; } }, bounds, 92);

const output = {
  kind: 'texas-colonies-province', version: 1,
  builtFrom: 'scripts/build-province.mjs over public/terrain',
  sources: {
    rivers: 'USGS National Hydrography Dataset (NHDFlowline), public domain; docs/evidence/terrain-data.json',
    coast: 'USGS 3DEP 1 arc-second elevation, public domain: no land, or under 0.3 m and joined to the Gulf',
    woods: 'LANDFIRE LF2016 Biophysical Settings through the land layer, public domain; docs/evidence/woods-data.json',
    escarpment: 'U.S. EPA Level IV Ecoregions of Texas (2011), public domain: Level III 30 against 31, 32 and 33 (colonies-land.json.gz)',
    land: 'public/terrain/colonies-land (scripts/build-land.mjs): the sea and the covers',
    towns: 'public/terrain/colonies-map.json.gz (HIST-TEX-010, -013, -025, -046, -084)',
  },
  units: 'hundredths of a mile, x east and y south of the confluence of the San Marcos and the Guadalupe; every line a flat [x0, y0, x1, y1, ...]',
  bounds,
  bands: BANDS,
  rivers,
  sea: { note: 'closed outlines of the water joined to the Gulf; draw even-odd, islands are holes', levels: seaRings.map(level => level.map(hundredths)) },
  shore: { note: 'the sea outline that runs to the edges of the data, longest first', levels: shoreLevels.map(level => level.map(hundredths)) },
  woods: {
    note: 'closed outlines of each class of country over prairie, even-odd per class; band 0 is empty (close up the woods are the tiles of sim/woods-view.mjs)',
    covers: COVERS.map(id => ({ id, name: COVER_NAMES[id], levels: woods[id].map(level => level.map(hundredths)) })),
  },
  escarpment: { note: 'band 0 is the band 1 line', levels: [escarpment[0], ...escarpment].map(hundredths) },
  settlements,
  relief,
};
const json = JSON.stringify(output);
const gz = gzipSync(json, { level: 9 });
writeFileSync('public/terrain/colonies-province.json.gz', gz);
const count = levels => levels.map(level => level.reduce((sum, line) => sum + line.length / 2, 0));
console.log(`Rivers ${rivers.length} pieces; points per band ${BANDS.map((_, band) => rivers.reduce((sum, river) => sum + (river.levels[band]?.length || 0) / 2, 0)).join(' / ')}`);
console.log(`Sea rings per band ${seaRings.map(level => level.length).join(' / ')}, points ${count(output.sea.levels).join(' / ')}; shore lines ${shoreLevels.map(l => l.length).join(' / ')}`);
for (const cover of output.woods.covers) console.log(`${cover.id}: rings ${cover.levels.map(l => l.length).join(' / ')}, points ${count(cover.levels).join(' / ')}`);
console.log(`Escarpment points ${output.escarpment.levels.map(l => l.length / 2).join(' / ')}; bounds ${JSON.stringify(bounds)}`);
console.log(`Wrote ${(json.length / 1e6).toFixed(2)} MB JSON, ${(gz.length / 1e3).toFixed(0)} KB gzip`);

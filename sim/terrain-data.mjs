// The real land of the settled colonies, from public/terrain (built by scripts/build-terrain.mjs).
//
// docs/LAND_GRANTS.md §8. Heights and watercourses are USGS measurements of the present day,
// projected into the game's miles (x east, y south, origin at the confluence of the San Marcos
// and the Guadalupe). What the game makes of them - which creeks ran in 1835, what slows a
// wagon, where a well is needed - is `FIC-GONZ-026` and lives elsewhere.
//
// Loaded once per process and shared: every class uses the same country, so nothing of it is
// copied into a save. A world records only that it uses this land (`map.terrain`).
//
// Since 2026-09-25 (docs/MAP_ACCURACY.md §13, owner: "the map extends south to the Nueces") the land the simulation reads
// runs on below the box to 27.6°N: the strip scripts/build-south.mjs built on the box's own lattice from the same USGS data
// is laid under the box's grid here, row for row, so San Patricio and Agua Dulce Creek have heights and water like any
// place in the colonies. The box's own files are untouched; `boxTerrain()` is the box alone, which the builds of the
// box's land, province and outside layer read so they give their files back byte for byte.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const ROOT = new URL('../public/terrain/', import.meta.url);
let loadedBox = null, loaded = null;

/** Metres above sea level at a point, bilinear between cell centres; NaN off the land. */
function heightReader({ minX, minY, columns, rows, cell, noData }, heights) {
  return (x, y) => {
    const fx = (x - minX) / cell - 0.5, fy = (y - minY) / cell - 0.5;
    const cx = Math.floor(fx), cy = Math.floor(fy), tx = fx - cx, ty = fy - cy;
    let total = 0, weight = 0;
    for (const [dx, dy, w] of [[0, 0, (1 - tx) * (1 - ty)], [1, 0, tx * (1 - ty)], [0, 1, (1 - tx) * ty], [1, 1, tx * ty]]) {
      const column = cx + dx, row = cy + dy;
      if (column < 0 || row < 0 || column >= columns || row >= rows) continue;
      const value = heights[row * columns + column];
      if (value === noData || w === 0) continue;
      total += value / 10 * w; weight += w;
    }
    return weight > 0 ? total / weight : NaN;
  };
}
function coursesOf(water) {
  return water.courses.map(([name, flow, ...coords]) => {
    const points = [];
    for (let i = 0; i < coords.length; i += 2) points.push({ x: coords[i] / 100, y: coords[i + 1] / 100 });
    return { name: name >= 0 ? water.names[name] : null, flow: water.flow[flow], points };
  });
}

/** The colonies' box alone, exactly as scripts/build-terrain.mjs wrote it. */
export function boxTerrain() {
  if (loadedBox) return loadedBox;
  const header = JSON.parse(gunzipSync(readFileSync(new URL('colonies-water.json.gz', ROOT))).toString('utf8'));
  const raw = gunzipSync(readFileSync(new URL(header.grid.file, ROOT)));
  const { minX, minY, columns, rows, cell } = header.grid;
  const heights = new Uint16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
  if (heights.length !== columns * rows) throw new Error('The terrain grid is not the size its header says');
  loadedBox = { header, heights, heightAt: heightReader(header.grid, heights), courses: coursesOf(header.water), bounds: { minX, minY, maxX: minX + columns * cell, maxY: minY + rows * cell } };
  return loadedBox;
}

/**
 * The strip below the box (scripts/build-south.mjs), or null in a copy of the game without it - which then reads the box
 * alone, exactly as it did before the strip.
 */
export function southStrip() {
  try {
    const header = JSON.parse(gunzipSync(readFileSync(new URL('south-water.json.gz', ROOT))).toString('utf8'));
    const raw = gunzipSync(readFileSync(new URL(header.grid.file, ROOT)));
    const heights = new Uint16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
    if (heights.length !== header.grid.columns * header.grid.rows) throw new Error('The south strip is not the size its header says');
    return { header, heights };
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

/** The land the simulation reads: the box, and under it the strip south to the Nueces. */
export function realTerrain() {
  if (loaded) return loaded;
  const box = boxTerrain(), strip = southStrip();
  if (!strip) { loaded = box; return loaded; }
  const g = box.header.grid, s = strip.header.grid;
  if (s.columns !== g.columns || s.minX !== g.minX || s.cell !== g.cell || s.row0 > g.rows) throw new Error('The south strip is not on the box\'s lattice');
  // The box's rows above the strip, then the strip's: the box's last rows past 28°N are empty, and the strip's are those cells.
  const rows = s.row0 + s.rows;
  const heights = new Uint16Array(g.columns * rows);
  heights.set(box.heights.subarray(0, s.row0 * g.columns));
  heights.set(strip.heights, s.row0 * g.columns);
  const grid = { ...g, rows, south: { row0: s.row0, file: s.file } };
  const water = { ...box.header.water, names: [...box.header.water.names, ...strip.header.water.names], courses: [...box.header.water.courses] };
  const offset = box.header.water.names.length;
  for (const [name, ...rest] of strip.header.water.courses) water.courses.push([name >= 0 ? name + offset : -1, ...rest]);
  const header = { ...box.header, grid, water, south: { area: strip.header.area, builtFrom: strip.header.builtFrom, sources: strip.header.sources } };
  loaded = { header, heights, heightAt: heightReader(grid, heights), courses: [...box.courses, ...coursesOf(strip.header.water)], bounds: { minX: g.minX, minY: g.minY, maxX: g.minX + g.columns * g.cell, maxY: g.minY + rows * g.cell }, south: strip.header };
  return loaded;
}

/** A longitude and latitude in the game's miles. */
export function milesFrom(terrain, lon, lat) {
  const { origin, projection } = terrain.header;
  return { x: (lon - origin.lon) * projection.milesPerLon, y: (origin.lat - lat) * projection.milesPerLat };
}

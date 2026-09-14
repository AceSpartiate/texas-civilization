// The real land of the settled colonies, from public/terrain (built by scripts/build-terrain.mjs).
//
// docs/LAND_GRANTS.md §8. Heights and watercourses are USGS measurements of the present day,
// projected into the game's miles (x east, y south, origin at the confluence of the San Marcos
// and the Guadalupe). What the game makes of them - which creeks ran in 1835, what slows a
// wagon, where a well is needed - is `FIC-GONZ-026` and lives elsewhere.
//
// Loaded once per process and shared: every class uses the same country, so nothing of it is
// copied into a save. A world records only that it uses this land (`map.terrain`).
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const ROOT = new URL('../public/terrain/', import.meta.url);
let loaded = null;

export function realTerrain() {
  if (loaded) return loaded;
  const header = JSON.parse(gunzipSync(readFileSync(new URL('colonies-water.json.gz', ROOT))).toString('utf8'));
  const raw = gunzipSync(readFileSync(new URL(header.grid.file, ROOT)));
  const { minX, minY, columns, rows, cell, noData } = header.grid;
  const heights = new Uint16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
  if (heights.length !== columns * rows) throw new Error('The terrain grid is not the size its header says');

  /** Metres above sea level at a point, bilinear between cell centres; NaN off the land. */
  const heightAt = (x, y) => {
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
  const FLOW = header.water.flow;
  const courses = header.water.courses.map(([name, flow, ...coords]) => {
    const points = [];
    for (let i = 0; i < coords.length; i += 2) points.push({ x: coords[i] / 100, y: coords[i + 1] / 100 });
    return { name: name >= 0 ? header.water.names[name] : null, flow: FLOW[flow], points };
  });
  loaded = { header, heights, heightAt, courses, bounds: { minX, minY, maxX: minX + columns * cell, maxY: minY + rows * cell } };
  return loaded;
}

/** A longitude and latitude in the game's miles. */
export function milesFrom(terrain, lon, lat) {
  const { origin, projection } = terrain.header;
  return { x: (lon - origin.lon) * projection.milesPerLon, y: (origin.lat - lat) * projection.milesPerLat };
}

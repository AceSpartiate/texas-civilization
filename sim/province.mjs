// The country drawn around the families zoomed out, for a class on the real land: docs/MAP_ACCURACY.md.
//
// Built by scripts/build-province.mjs into public/terrain/colonies-province.json.gz from the same rivers, heights, woods
// and places the families live among. It replaces, for such a class, the invented province of sim/texas.mjs
// (FIC-GONZ-002), which put the Trinity a hundred miles east of Liberty and a San Antonio River wider than Béxar across
// the Alamo. A class on the invented Gonzales country keeps the invented province: its home country is invented too.
//
// Two shapes of the same data:
//   - `coloniesProvince()` is the province in the shape the map has always carried (`rivers`, `coast`, `belts`,
//     `escarpment`, `settlements`, `roads`, `relief`, `bounds`), drawn from one middle band, so a page that knows nothing
//     of bands draws the real country. It is small, and it is what `/api/map` carries.
//   - `provinceBands()` is every band of every line and outline (the file itself, served whole at
//     `/terrain/colonies-province.json`), for a renderer that draws the band that fits its zoom.
//
// Nothing of it is saved: a class on the real land is sent the current province whenever its map is asked for, so a
// class saved with the invented one is drawn with the real one too.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

/** What a map's `source` is when it was built on the real land (scripts/build-colonies-map.mjs). */
export const COLONIES_SOURCE = 'texas-colonies-map';
/** The file, as served to the page. */
export const PROVINCE_HREF = '/terrain/colonies-province.json';
export const LAND_HREF = '/terrain/colonies-land.json';
export const PROVINCE_FILE = new URL('../public/terrain/colonies-province.json.gz', import.meta.url);
export const LAND_FILE = new URL('../public/terrain/colonies-land.json.gz', import.meta.url);
/**
 * The bands the classic shape draws: a quarter-mile tolerance for the rivers, so a river drawn under the colonies' own
 * rivers close up lies within a quarter mile of them; a mile for the coast and the escarpment; three miles for the belts
 * of country, which only the map zoomed right out shows (closer in the woods tiles draw the timber), at a fifth the size.
 */
export const CLASSIC_LINE_BAND = 1, CLASSIC_OUTLINE_BAND = 2, CLASSIC_BELT_BAND = 3;

let bands = null, classic = null;
export function provinceBands() {
  if (!bands) bands = JSON.parse(gunzipSync(readFileSync(PROVINCE_FILE)).toString('utf8'));
  return bands;
}

const points = flat => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i] / 100, y: flat[i + 1] / 100 }); return out; };
const area = ring => ring.reduce((sum, p, i) => { const q = ring[(i + 1) % ring.length]; return sum + p.x * q.y - q.x * p.y; }, 0) / 2;
function inside(p, ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}
/**
 * Outlines with holes as single polygons a non-zero fill draws correctly: each hole wound against its outline and
 * joined to it by a bridge there and back, which encloses nothing.
 */
export function keyholes(rings) {
  const depth = rings.map((ring, i) => rings.reduce((n, other, j) => n + (i !== j && inside(ring[0], other) ? 1 : 0), 0));
  const polygons = [];
  rings.forEach((ring, i) => {
    if (depth[i] % 2) return;
    let outline = area(ring) >= 0 ? ring.slice() : ring.slice().reverse();
    const holes = rings.filter((hole, j) => depth[j] === depth[i] + 1 && inside(hole[0], ring));
    for (const hole of holes) {
      const wound = area(hole) < 0 ? hole.slice() : hole.slice().reverse();
      let best = { d: Infinity, o: 0, h: 0 };
      outline.forEach((p, o) => wound.forEach((q, h) => { const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2; if (d < best.d) best = { d, o, h }; }));
      const around = [...wound.slice(best.h), ...wound.slice(0, best.h), wound[best.h]];
      outline = [...outline.slice(0, best.o + 1), ...around, ...outline.slice(best.o)];
    }
    polygons.push(outline);
  });
  return polygons;
}

/** How near a town the classic shape keeps a river's finest band: a town is where a quarter mile shows. */
export const CLASSIC_FINE_NEAR_TOWN = 3;
/**
 * A river for the classic shape: the quarter-mile band, and the finest band within a few miles of a town. Both are points
 * of the finest band, so the mix is itself a nested simplification of it: at Béxar the river passes between the plaza and
 * the Alamo, which a quarter-mile chord across the bend does not.
 */
function classicLine(river, settlements) {
  const fine = points(river.levels[0]), coarse = river.levels[CLASSIC_LINE_BAND];
  const kept = new Set();
  for (let i = 0; i < coarse.length; i += 2) kept.add(`${coarse[i]},${coarse[i + 1]}`);
  return fine.filter((p, i) => i === 0 || i === fine.length - 1 || kept.has(`${river.levels[0][2 * i]},${river.levels[0][2 * i + 1]}`)
    || settlements.some(town => Math.hypot(town.x - p.x, town.y - p.y) <= CLASSIC_FINE_NEAR_TOWN));
}

/** The province in the shape `world.map.province` has always had, from the real land. */
export function coloniesProvince() {
  if (classic) return classic;
  const data = provinceBands();
  const shore = data.shore.levels[CLASSIC_OUTLINE_BAND].map(points).sort((a, b) => b.length - a.length)[0] || [];
  // The page fills everything seaward of the coast as one polygon closed below the screen, east to west.
  const coast = shore.length && shore[0].x < shore.at(-1).x ? shore.slice().reverse() : shore;
  const belts = data.woods.covers.flatMap(cover => keyholes(cover.levels[CLASSIC_BELT_BAND].map(points))
    .map((polygon, index) => ({ id: `${cover.id}-${index}`, name: cover.name, cover: cover.id, points: polygon })));
  classic = Object.freeze({
    source: data.kind,
    rivers: data.rivers.filter(river => river.levels[CLASSIC_LINE_BAND]).map(river => ({ id: river.id, name: river.name, width: river.width, channelFeet: river.channelFeet, points: classicLine(river, data.settlements) })),
    coast,
    belts,
    escarpment: points(data.escarpment.levels[CLASSIC_OUTLINE_BAND]),
    settlements: data.settlements,
    roads: [],
    relief: data.relief,
    bounds: data.bounds,
    levels: { bands: data.bands, href: PROVINCE_HREF, land: LAND_HREF },
  });
  return classic;
}

/** A map as the page is sent it: a class on the real land gets the real province and its bounds, whatever it was saved with. */
export function mapForPage(map) {
  if (map?.source !== COLONIES_SOURCE) return map;
  const province = coloniesProvince();
  return { ...map, province, bounds: province.bounds };
}

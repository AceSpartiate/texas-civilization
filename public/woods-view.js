// The woods on the family's map: docs/WOODS_AND_BUILDING.md §4.3, build step 2.
//
// The server works out the woods (sim/woods.mjs) and hands them over a tile at a time (`/api/woods`, sim/woods-view.mjs):
// a shade of timber a mile at a time when the map is zoomed out, which patches are timber at middle distance, and every
// tree close up. Tiles never change during a class, so each is fetched once and kept. A class that does not read its
// woods from the land gets 404s it never asks for: `woodsShown` is false and the map draws as it always has.

import { smoothCover } from './map-base.js';

/** Fetched tiles by class and key, and those on their way. */
const tiles = new Map();
const pending = new Set();
let classId = null;
/**
 * At most this many requests are out at once, each for up to `BATCH` tiles of one level (`/api/woods?tiles=`), so a fast pan
 * does not queue hundreds. One request a tile was 120-180 requests on every load of a class (docs/PERFORMANCE_LOAD.md).
 */
const IN_FLIGHT = 3;
export const BATCH = 48;
let inFlight = 0;
/** Close enough to draw every tree at full strength when the view covers no more than this many square miles. */
export const TREE_VIEW_SQUARE_MILES = 0.4;
/**
 * The zoom bands the woods hand over across (docs/PERFORMANCE_RENDER.md, "Zoom"). Each layer fades in or out across its
 * band rather than switching at one number, which is what made the woods pop in and out as a student zoomed (owner,
 * 2026-09-17). Trees fade in over `trees` (square miles in view); the patches hand over to the shade over `shade` (miles
 * across); the shade fades out over `shadeOut`, where the province's own cover belts are the woods.
 */
export const WOODS_BANDS = Object.freeze({ trees: [1, TREE_VIEW_SQUARE_MILES], shade: [8, 12], shadeOut: [90, 60] });
/** Under the trees the canopy is kept at this share of its strength, so a stand still reads as woods between its trunks. */
const CANOPY_UNDER_TREES = 0.45;
const band = (value, [from, to]) => Math.max(0, Math.min(1, (value - from) / (to - from)));
/**
 * How strongly each layer of the woods is drawn for a view `wide` miles across its wider side and `area` square miles:
 * `trees` every tree, `patches` the timber and brush canopy, `shade` the mile-by-mile share of timber. Pure, so the bands
 * can be held by a test (tests/map-base.test.mjs): no layer jumps between two neighbouring wheel steps.
 */
export function woodsLayers(wide, area) {
  const trees = band(area, WOODS_BANDS.trees);
  const shade = band(wide, WOODS_BANDS.shade);
  return { trees, patches: (1 - shade) * (1 - (1 - CANOPY_UNDER_TREES) * trees), shade: shade * band(wide, WOODS_BANDS.shadeOut) };
}

/** Whether this class's map draws its woods from the land. */
export const woodsShown = world => world?.map?.woods === 'landfire-2016';

/** Which change to the woods the tiles were fetched at: a tree felled or logs hauled makes the close-up tiles stale. */
let revision = 0;
function reset(mapId, woodsRevision = 0) {
  if (mapId !== classId) { classId = mapId; tiles.clear(); pending.clear(); revision = woodsRevision; return; }
  if (woodsRevision === revision) return;
  revision = woodsRevision;
  // Only the trees change; the patches and the shade are the land's. A stale tile is kept on screen until its fresh one comes.
  for (const key of tiles.keys()) if (key.startsWith('trees:')) stale.add(key);
}
const stale = new Set();

/** The tile keys a box of the map needs at a level. */
function keysFor(level, size, box) {
  const keys = [];
  for (let ty = Math.floor(box.minY / size); ty <= Math.floor(box.maxY / size); ty++) {
    for (let tx = Math.floor(box.minX / size); tx <= Math.floor(box.maxX / size); tx++) keys.push({ key: `${level}:${tx}:${ty}`, tx, ty });
  }
  return keys;
}

function fetchTiles(level, size, box, onLoad) {
  const wanted = keysFor(level, size, box).filter(({ key }) => !((tiles.has(key) && !stale.has(key)) || pending.has(key)));
  for (let at = 0; at < wanted.length && inFlight < IN_FLIGHT; at += BATCH) {
    const group = wanted.slice(at, at + BATCH);
    for (const { key } of group) pending.add(key);
    inFlight++;
    const asked = classId;
    fetch(`/api/woods?level=${level}&tiles=${group.map(({ tx, ty }) => `${tx},${ty}`).join(';')}`)
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        inFlight--;
        if (asked !== classId) return;
        group.forEach(({ key }, index) => { pending.delete(key); stale.delete(key); tiles.set(key, result?.tiles?.[index] || { empty: true }); });
        arrivals[level] = (arrivals[level] || 0) + group.length;
        onLoad();
      })
      .catch(() => { inFlight--; if (asked === classId) for (const { key } of group) pending.delete(key); });
  }
}

/** The part of the map in view, in miles, and how wide it is. */
function viewOf(camera, canvas, margin = 0) {
  const a = camera.toWorld({ x: 0, y: 0 }), b = camera.toWorld({ x: canvas.width, y: canvas.height });
  const pad = (b.x - a.x) * margin;
  return { minX: a.x - pad, minY: a.y - pad, maxX: b.x + pad, maxY: b.y + pad, wide: Math.max(b.x - a.x, b.y - a.y), area: (b.x - a.x) * (b.y - a.y) };
}

/** Ask for whatever tiles the view needs now. `catalogue` is `/api/chores`' `woods`; `onLoad` redraws. */
export function ensureWoods(world, camera, canvas, mapId, catalogue, onLoad, woodsRevision = 0) {
  if (!woodsShown(world) || !catalogue || !mapId) return;
  reset(mapId, woodsRevision);
  const view = viewOf(camera, canvas, 0.15), layers = woodsLayersFor(camera, canvas);
  // Every layer a band draws is asked for, closest first: the trees are what a student zoomed in is looking at.
  if (layers.trees > 0) fetchTiles('trees', catalogue.tiles.trees, view, onLoad);
  if (layers.patches > 0) fetchTiles('patches', catalogue.tiles.patches, view, onLoad);
  if (layers.shade > 0) fetchTiles('shade', catalogue.tiles.shade, view, onLoad);
}

/** Whether the view is close enough for every tree at full strength, rather than scattered detail. */
export const treesInView = (camera, canvas) => viewOf(camera, canvas).area <= TREE_VIEW_SQUARE_MILES;
/** How strongly this view draws each layer of the woods (`woodsLayers`). */
export const woodsLayersFor = (camera, canvas) => { const view = viewOf(camera, canvas); return woodsLayers(view.wide, view.area); };

/**
 * Is this point timber, by the patches fetched: true, false, or null when its tile has not come yet.
 * `size` is the patch tile's miles.
 */
export function timberAt(x, y, size) {
  const tx = Math.floor(x / size), ty = Math.floor(y / size);
  const tile = tiles.get(`patches:${tx}:${ty}`);
  if (!tile) return null;
  if (tile.empty) return false;
  const across = Math.round(Math.sqrt(tile.cells.length));
  const column = Math.min(across - 1, Math.floor((x / size - tx) * across)), row = Math.min(across - 1, Math.floor((y / size - ty) * across));
  return tile.cells[row * across + column] === 't';
}

/** Every tree fetched that stands in view, back to front, as `{ x, y, kind, size }` in miles. */
export function treesVisible(camera, canvas, catalogue) {
  const view = viewOf(camera, canvas, 0.05), found = [];
  for (const { key } of keysFor('trees', catalogue.tiles.trees, view)) {
    for (const [x, y, kind, size] of tiles.get(key)?.trees || []) {
      if (x >= view.minX && x <= view.maxX && y >= view.minY && y <= view.maxY) found.push({ x, y, kind: catalogue.kinds[kind], size });
    }
  }
  return found.sort((a, b) => a.y - b.y);
}

/**
 * The woods under the ground detail, as far as the view needs: the timber and brush patches as a canopy from close up to
 * the middle distance - kept faintly under the trees close in, so a stand reads as woods between its trunks - handing over
 * to the mile-by-mile shade of timber further out, which fades away where the province's cover belts take over.
 *
 * Each is laid down as one small picture of its cells, a pixel a cell, scaled up smoothly. The patches and the shade were
 * squares filled edge to edge, and a square of 330 feet or a mile drawn hard-edged is a checkerboard, not a wood; smoothed,
 * a stand has soft edges that stay put as the camera moves (owner, 2026-09-17).
 * ceiling: a tile that has not arrived is bare until it does, and then appears; fading tiles in as they land is the way out.
 */
export function drawWoodsCover(ctx, camera, canvas, catalogue) {
  const view = viewOf(camera, canvas), layers = woodsLayers(view.wide, view.area);
  const box = viewOf(camera, canvas, 0.05);
  if (layers.patches > 0.01) {
    // Stronger than the squares were (.55): smoothed, a narrow stand spreads its colour and would otherwise read paler than its trees.
    const colours = { t: [86, 116, 56, 0.7], b: [154, 148, 96, 0.35] };
    const size = catalogue.tiles.patches;
    const cover = coverRaster('patches', size, box, tile => Math.round(Math.sqrt(tile.cells.length)), (tile, across, column, row) => colours[tile.cells[row * across + column]]);
    if (cover) layRaster(ctx, camera, cover, size, layers.patches);
  }
  if (layers.shade > 0.01) {
    const size = catalogue.tiles.shade;
    const cover = coverRaster('shade', size, box, () => size, (tile, across, column, row) => {
      const share = Number(tile.cells[row * across + column]);
      return share ? [93, 122, 60, 0.06 * share] : null;
    });
    if (cover) layRaster(ctx, camera, cover, size, layers.shade);
  }
}

/** Tiles arrived, by level: a level's picture of the cover is made again from the tiles on hand when one of its own lands. */
const arrivals = {};
const rasters = new Map();
/**
 * The cells of every tile of a level in a box, a pixel each, as a canvas: `{ canvas, tx, ty, across }`. Made again only when
 * the tiles in the box or the tiles on hand change, so zooming within a box costs a scaled draw and nothing else.
 */
function coverRaster(level, size, box, acrossOf, colourOf) {
  const tx0 = Math.floor(box.minX / size), tx1 = Math.floor(box.maxX / size), ty0 = Math.floor(box.minY / size), ty1 = Math.floor(box.maxY / size);
  const key = `${classId}:${tx0}:${ty0}:${tx1}:${ty1}:${arrivals[level] || 0}`;
  const kept = rasters.get(level);
  if (kept?.key === key) return kept.cover;
  let across = 0;
  for (let ty = ty0; ty <= ty1 && !across; ty++) for (let tx = tx0; tx <= tx1 && !across; tx++) { const tile = tiles.get(`${level}:${tx}:${ty}`); if (tile?.cells) across = acrossOf(tile); }
  let cover = null;
  if (across && typeof document !== 'undefined') {
    const columns = (tx1 - tx0 + 1) * across, rows = (ty1 - ty0 + 1) * across;
    // Four pixels a cell, smoothed about a cell wide; two for a wide view, so the picture stays under a million pixels.
    const upscale = columns * rows * 16 <= 1e6 ? 4 : 2;
    const smooth = smoothCover(columns, rows, (column, row) => {
      const tile = tiles.get(`${level}:${tx0 + Math.floor(column / across)}:${ty0 + Math.floor(row / across)}`);
      return tile?.cells && acrossOf(tile) === across ? colourOf(tile, across, column % across, row % across) : null;
    }, { upscale });
    const canvas = kept?.cover?.canvas || document.createElement('canvas');
    canvas.width = smooth.width; canvas.height = smooth.height;
    canvas.getContext('2d').putImageData(new ImageData(smooth.data, smooth.width, smooth.height), 0, 0);
    cover = { canvas, tx: tx0, ty: ty0, across: across * upscale };
  }
  rasters.set(level, { key, cover });
  return cover;
}

/** A cover picture laid over the map where its tiles stand, smoothly scaled, at `alpha`. */
function layRaster(ctx, camera, { canvas, tx, ty, across }, size, alpha) {
  const a = camera.toScreen({ x: tx * size, y: ty * size });
  const b = camera.toScreen({ x: tx * size + canvas.width / across * size, y: ty * size + canvas.height / across * size });
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, a.x, a.y, b.x - a.x, b.y - a.y);
  ctx.restore();
}

/** Every stump in view, with the logs still lying at it, as `{ x, y, kind, left }`. */
export function stumpsVisible(camera, canvas, catalogue) {
  const view = viewOf(camera, canvas, 0.05), found = [];
  for (const { key } of keysFor('trees', catalogue.tiles.trees, view)) {
    for (const [x, y, kind, left] of tiles.get(key)?.stumps || []) {
      if (x >= view.minX && x <= view.maxX && y >= view.minY && y <= view.maxY) found.push({ x, y, kind: catalogue.kinds[kind], left });
    }
  }
  return found;
}


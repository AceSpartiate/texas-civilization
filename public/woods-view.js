// The woods on the family's map: docs/WOODS_AND_BUILDING.md §4.3, build step 2.
//
// The server works out the woods (sim/woods.mjs) and hands them over a tile at a time (`/api/woods`, sim/woods-view.mjs):
// a shade of timber a mile at a time when the map is zoomed out, which patches are timber at middle distance, and every
// tree close up. Tiles never change during a class, so each is fetched once and kept. A class that does not read its
// woods from the land gets 404s it never asks for: `woodsShown` is false and the map draws as it always has.

/** Fetched tiles by class and key, and those on their way. */
const tiles = new Map();
const pending = new Set();
let classId = null;
/** At most this many tile requests are out at once, so a fast pan does not queue hundreds. */
const IN_FLIGHT = 6;
/** Close enough to draw every tree when the view covers no more than this many square miles. */
export const TREE_VIEW_SQUARE_MILES = 0.4;
/** Patches are fetched for the ground detail when the view is no wider than this, in miles. */
const PATCH_VIEW_MILES = 12;
/** The shade is drawn when the view is no wider than this, in miles; beyond it nothing is. */
const SHADE_VIEW_MILES = 90;

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
  for (const { key, tx, ty } of keysFor(level, size, box)) {
    if ((tiles.has(key) && !stale.has(key)) || pending.has(key)) continue;
    if (pending.size >= IN_FLIGHT) return;
    pending.add(key);
    const asked = classId;
    fetch(`/api/woods?level=${level}&tx=${tx}&ty=${ty}`)
      .then(response => response.ok ? response.json() : null)
      .then(result => { if (asked !== classId) return; pending.delete(key); stale.delete(key); tiles.set(key, result?.tile || { empty: true }); onLoad(); })
      .catch(() => { if (asked === classId) pending.delete(key); });
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
  const view = viewOf(camera, canvas, 0.15);
  if (view.area <= TREE_VIEW_SQUARE_MILES) fetchTiles('trees', catalogue.tiles.trees, view, onLoad);
  else if (view.wide <= PATCH_VIEW_MILES) fetchTiles('patches', catalogue.tiles.patches, view, onLoad);
  else if (view.wide <= SHADE_VIEW_MILES) fetchTiles('shade', catalogue.tiles.shade, view, onLoad);
}

/** Whether the view is close enough for every tree, rather than scattered detail. */
export const treesInView = (camera, canvas) => viewOf(camera, canvas).area <= TREE_VIEW_SQUARE_MILES;

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
 * The woods under the ground detail, as far as the view needs: nothing close up (every tree is drawn), the timber and
 * brush patches as canopy at middle distance (the scattered trees alone read as open savanna where the patch is closed
 * woods), and the shade of timber further out.
 */
export function drawWoodsCover(ctx, camera, canvas, catalogue) {
  const view = viewOf(camera, canvas);
  if (view.area <= TREE_VIEW_SQUARE_MILES) return;
  if (view.wide > PATCH_VIEW_MILES) return drawWoodsShade(ctx, camera, canvas, catalogue);
  const size = catalogue.tiles.patches;
  // One path a cover, filled once, so neighbouring patches do not darken where their edges overlap.
  const paths = { t: new Path2D(), b: new Path2D() };
  for (const { key, tx, ty } of keysFor('patches', size, view)) {
    const tile = tiles.get(key);
    if (!tile?.cells) continue;
    const across = Math.round(Math.sqrt(tile.cells.length)), step = size / across;
    for (let row = 0; row < across; row++) for (let column = 0; column < across; column++) {
      const path = paths[tile.cells[row * across + column]];
      if (!path) continue;
      const a = camera.toScreen({ x: tx * size + column * step, y: ty * size + row * step }), b = camera.toScreen({ x: tx * size + (column + 1) * step, y: ty * size + (row + 1) * step });
      path.rect(Math.floor(a.x), Math.floor(a.y), Math.ceil(b.x) - Math.floor(a.x), Math.ceil(b.y) - Math.floor(a.y));
    }
  }
  ctx.save();
  ctx.globalAlpha = 0.55; ctx.fillStyle = '#5d7a3c'; ctx.fill(paths.t, 'nonzero');
  ctx.globalAlpha = 0.35; ctx.fillStyle = '#9a9460'; ctx.fill(paths.b, 'nonzero');
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

/** Draw the shade of timber for the view, zoomed out: each mile a green wash as strong as its share of timber. */
function drawWoodsShade(ctx, camera, canvas, catalogue) {
  const view = viewOf(camera, canvas);
  if (view.wide > SHADE_VIEW_MILES) return;
  const size = catalogue.tiles.shade;
  // One path a shade, filled once, for the same reason as the patches.
  const paths = Array.from({ length: 10 }, () => new Path2D());
  for (const { key, tx, ty } of keysFor('shade', size, view)) {
    const tile = tiles.get(key);
    if (!tile?.cells) continue;
    for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
      const share = Number(tile.cells[row * size + column]);
      if (!share) continue;
      const a = camera.toScreen({ x: tx * size + column, y: ty * size + row }), b = camera.toScreen({ x: tx * size + column + 1, y: ty * size + row + 1 });
      paths[share].rect(Math.floor(a.x), Math.floor(a.y), Math.ceil(b.x) - Math.floor(a.x), Math.ceil(b.y) - Math.floor(a.y));
    }
  }
  ctx.save();
  ctx.fillStyle = '#5d7a3c';
  paths.forEach((path, share) => { if (share) { ctx.globalAlpha = 0.06 * share; ctx.fill(path); } });
  ctx.restore();
}

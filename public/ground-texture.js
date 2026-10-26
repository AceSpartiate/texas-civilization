// The painted ground a road, a town's street and a family's path are laid in (owner, 2026-10-13: "use our new image generation
// setup to improve roads").
//
// Four tiles painted with the owner's local pipeline (ComfyUI + FLUX.2 klein 4B, repainted 2026-10-26; scripts/road-art/) and delivered on one sheet,
// `ground-roads` (scripts/art-deliveries/local-ground-roads-2026-10-26.mjs): the wagon road's rutted dirt, the town street's packed
// earth, the trodden path and the worn grass verge either side of a road. Two kinds of tile:
//
//   - **laid flat** (the street, the verge): no direction in them, seamless both ways, filled as a pattern pinned to the world's
//     origin so the ground stays where it lies as the map is dragged;
//   - **laid along** (the road, the path): the ruts and the trodden line run down the tile, which repeats only along its length.
//     It is turned to run along each piece of the way and centred on it, the distance already come carried from piece to piece
//     so the ruts run on round a bend (`paveWay`). That is the one thing a flat pattern cannot do, and the ruts were the point.
//
// A way is laid along the same line and to the same widths as before. While the sheet has not arrived nothing here answers and
// every caller draws its flat colours exactly as it did before the tiles (its fallback), which is also what a test without a
// canvas sees. Kept in its own file with no browser imports, so it can be tested (tests/ground-texture.test.mjs): the page
// hands it the art library's pictures (`useTextureSource`, public/landscape-art.js).
import { curveSegment, curveThrough } from './curve.js';

/** The sheet's tiles, by what they are laid on. */
export const TEXTURES = Object.freeze({ road: 'road-tile-wagon', street: 'road-tile-street', path: 'road-tile-path', verge: 'road-tile-verge' });
/** The tiles laid along a way rather than flat. */
export const ALONG = Object.freeze(new Set(['road', 'path']));

/**
 * What each kind of way is laid in once its tiles are here, widest first: a tile's name (a key of `TEXTURES`) or a flat colour,
 * the stroke's width as a share of the way's width, and its alpha. The widest strokes stay the flat colours each way was
 * already edged in, thinned, so the painted ground goes soft into the grass instead of stopping at a kerb. A tile laid along is
 * always whole (alpha 1): its pieces overlap at the bends, and a see-through piece would darken every bend. A street is one
 * painted layer over its flat edges: a town's streets cover much of the screen close in, and a second painted layer there
 * doubled the cost of drawing them (scripts/road-tiles-cost.mjs).
 */
export const LAYERS = Object.freeze({
  road: [['#ac9f71', 1.55, 0.5], ['verge', 1.4, 0.8], ['#c2ac7d', 1.2, 0.55], ['road', 1.08, 1]],
  street: [['#ac9f71', 1.55, 0.85], ['#c2ac7d', 1.2, 0.9], ['street', 1, 1]],
  path: [['verge', 1.4, 0.45], ['#a08056', 1.15, 0.3], ['path', 1, 1]],
});
/** How wide a tile laid along is across the way, as a share of the way's width: a little wider than the stroke, so its edges lie outside it. */
export const ALONG_TILE = 1.25;

let source = () => null;
/** Where the tiles' pictures come from: `name => ({ image, frame: { x, y, w, h } }) | null` (null while the sheet is missing). */
export function useTextureSource(lookup) { source = typeof lookup === 'function' ? lookup : () => null; levels.clear(); }

// A tile kept at a few sizes, halving each time, so a road drawn twenty pixels wide is not sampling a 512-pixel picture
// down by a factor of ten on every stroke (which glitters as the map pans, and costs more). Each is a pattern, made once.
const levels = new Map();
const SIZES = [512, 256, 128, 64, 32];
let makeCanvas = (width, height) => {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  if (typeof document !== 'undefined') { const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas; }
  return null;
};
/** For a test: what a level's picture is drawn on. */
export function useCanvasMaker(maker) { makeCanvas = maker; levels.clear(); }
/** The levels made so far (`<tile>@<size>`), for a test or a proof to count. */
export function levelsMade() { return [...levels.keys()]; }

function level(ctx, name, size) {
  const key = `${name}@${size}`;
  if (levels.has(key)) return levels.get(key);
  const picture = source(name);
  if (!picture?.image || !picture.frame) return null;
  // Each level is drawn from the one above it, halving, as a mip chain is: one step down at a time keeps the painting's
  // texture instead of the speckle a single big step leaves.
  const above = size >= SIZES[0] ? null : level(ctx, name, size * 2);
  const canvas = makeCanvas(size, size);
  const drawn = canvas?.getContext?.('2d');
  if (!drawn || typeof ctx.createPattern !== 'function') return null;
  drawn.imageSmoothingEnabled = true; drawn.imageSmoothingQuality = 'high';
  if (above) drawn.drawImage(above.canvas, 0, 0, size, size);
  else { const { x, y, w, h } = picture.frame; drawn.drawImage(picture.image, x, y, w, h, 0, 0, size, size); }
  const made = { canvas, pattern: ctx.createPattern(canvas, 'repeat') };
  if (!made.pattern) return null;
  levels.set(key, made);
  return made;
}

/**
 * The pattern of one tile, `tile` screen pixels across, pinned to `anchor` (the screen point the world's origin is drawn at)
 * so that the ground stays put under the road while the map is dragged; null while the sheet has not arrived.
 */
export function groundPattern(ctx, kind, tile, anchor = { x: 0, y: 0 }) {
  const name = TEXTURES[kind];
  if (!name || !(tile > 0)) return null;
  const size = SIZES.find((s, i) => s / 2 < tile || i === SIZES.length - 1);
  const made = level(ctx, name, size);
  if (!made) return null;
  // Pinned to whole pixels: a pattern laid at a fraction of a pixel is filtered at every pixel it fills, which measured two and
  // a half times the cost of the same fill on whole pixels (scripts/road-tiles-cost.mjs, 2026-10-13).
  const scale = tile / size, offset = value => Math.round(((value % tile) + tile) % tile);
  made.pattern.setTransform?.({ a: scale, b: 0, c: 0, d: scale, e: offset(anchor.x), f: offset(anchor.y) });
  return made.pattern;
}

/**
 * The strokes a way of this kind is laid in, widest first - `{ style, share, alpha, texture }`, `style` a pattern or a colour
 * and `texture` the tile's kind or null - or null when any of its tiles is missing, and the caller draws its flat colours. A
 * tile laid along has no pattern yet (`style` null): `paveWay` turns it for each piece of the way.
 */
export function wayLayers(ctx, kind, tile, anchor) {
  const layers = [];
  for (const [what, share, alpha] of LAYERS[kind] || []) {
    if (what.startsWith('#')) { layers.push({ style: what, share, alpha, texture: null }); continue; }
    if (ALONG.has(what)) {
      if (!level(ctx, TEXTURES[what], SIZES.at(-1))) return null;
      layers.push({ style: null, share, alpha: 1, texture: what, along: true });
      continue;
    }
    const pattern = groundPattern(ctx, what, tile, anchor);
    if (!pattern) return null;
    layers.push({ style: pattern, share, alpha, texture: what });
  }
  return layers.length ? layers : null;
}

/**
 * Lay a way in its tiles: `points` on the screen, `width` its width in pixels, `tile` the flat tiles' size and `anchor` the
 * world's origin on the screen; `curve` for a way drawn as a curve through its points (the roads, public/curve.js), straight
 * between them otherwise (a family's paths); `visible` the pieces that can reach the screen (`visibleSegments`). Nothing is
 * drawn, and false returned, while any of its tiles is missing.
 */
export function paveWay(ctx, kind, points, width, { tile = 64, anchor, curve = false, visible = null } = {}) {
  if (!(points?.length > 1) || !(width > 0)) return false;
  const layers = wayLayers(ctx, kind, tile, anchor);
  if (!layers) return false;
  const base = ctx.globalAlpha;
  // The whole way as one path, for a flat layer: the same curve `drawRoad` always drew, or straight between the points.
  const trace = () => {
    if (curve) { curveThrough(ctx, points, visible); return; }
    ctx.beginPath(); points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  };
  for (const layer of layers) {
    ctx.lineWidth = width * layer.share;
    if (!layer.along) { ctx.globalAlpha = base * layer.alpha; ctx.strokeStyle = layer.style; trace(); ctx.stroke(); continue; }
    ctx.globalAlpha = base;
    layAlong(ctx, layer.texture, points, width * ALONG_TILE, { curve, visible });
  }
  ctx.globalAlpha = base;
  return true;
}

/**
 * ceiling: turned per chord, between two of the way's points, though a road is drawn as a curve through them: at a sharp bend
 * close in, the ruts kink at the point. Turning the tile per step along the drawn curve is the way out if it is ever noticed.
 *
 * A tile laid along a way, piece by piece: each piece's pattern turned so the tile runs down the piece, centred across it, and
 * moved along by the distance come so far, so that what is painted down the tile runs on from one piece into the next.
 */
function layAlong(ctx, kind, points, across, { curve, visible }) {
  const size = SIZES.find((s, i) => s / 2 < across || i === SIZES.length - 1);
  const made = level(ctx, TEXTURES[kind], size);
  if (!made) return;
  const scale = across / size;
  let travelled = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (!length) continue;
    if (!visible || visible[i]) {
      const dx = (b.x - a.x) / length, dy = (b.y - a.y) / length, back = travelled % across;
      // The tile's x runs across the way (to the right of travel, -dy, dx) and its y along it.
      made.pattern.setTransform?.({ a: -dy * scale, b: dx * scale, c: dx * scale, d: dy * scale,
        e: a.x - dx * back + dy * across / 2, f: a.y - dy * back - dx * across / 2 });
      ctx.strokeStyle = made.pattern;
      if (curve) curveSegment(ctx, points, i);
      else { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
      ctx.stroke();
    }
    travelled += length;
  }
}

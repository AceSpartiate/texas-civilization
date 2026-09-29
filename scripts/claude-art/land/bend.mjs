// A tree in a gale, bent out of Astra's own upright painting (request 2026-09-20 — the country in a norther). The request's
// complaint about the shear it replaces is exact: "a sheared painting is a leaning silhouette, not a tree in a gale: the
// crown does not stream, the branches do not part, and the leaves do not lift off the windward side." So the bend does the
// four things a shear cannot, and nothing else, keeping every pixel of her painting that it moves:
//
//   1. The trunk curves rather than tilts: the offset grows as a power of the height (`power` about 1.7), so the foot and
//      the grass round it stay put and the top goes over by `lean` of the tree's height (the request: "about a sixth").
//   2. The crown streams: above `crownFrom` the leeward half is drawn out by `stream` and the windward half pressed in toward
//      the trunk by `press`, with a ragged wobble (`ripple`) along it, so the crown is pulled downwind, not slid.
//   3. The windward edge is torn: the outermost leaves on the windward side are thinned away through a noise mask (`erode`),
//      and some of the windward leaves show their paler undersides (`flip`), as a hard wind turns them over.
//   4. Loose leaves leave the crown to leeward (`leaves`, drawn by Claude in the tree's own green over the bent painting).
//
// The wind is always to the viewer's right, as her `oak-broad-wind` and the request have it; the page mirrors nothing.
// Scale and anchor are hers exactly: the bent picture keeps her pixels at 1:1, and the frame's logical height is her
// frame's height, so a tree does not change size when the wind gets up.
import { blank, sample, bounds, noise, smooth } from './pixels.mjs';

/** The size of the bent picture for a frame of Astra's `src` ({ w, h, anchorX, anchorY }) under `p`, without bending it. */
export function bentSize(src, p) {
  const ax = src.anchorX * src.w, gy = src.anchorY * src.h, H = gy * 0.97;
  const reach = p.lean * H + (src.w - ax) * p.stream + (p.leaves ? H * 0.34 : 0) + p.ripple * H;
  // Room above: the leeward leaves lift as they stream, and a crown pressed down still rises on that side.
  const above = Math.ceil(H * 0.08);
  return { w: Math.ceil(src.w + reach) + 16, h: src.h + 12 + above, ax: 8 + ax, gy: 8 + above + gy };
}

export function bendTree(src, p) {
  const { img } = src, ax = src.anchorX * src.w, gy = src.anchorY * src.h;
  const b = bounds(img), H = Math.max(10, gy - b.top);
  const size = bentSize(src, p), out = blank(size.w, size.h), px = [0, 0, 0, 0];
  const dax = size.ax, dgy = size.gy, power = p.power ?? 1.7, sq = p.squash || 0;
  const bend = t => p.lean * H * Math.pow(Math.max(0, t), power);
  const crown = t => smooth(p.crownFrom - 0.12, p.crownFrom + 0.2, t);
  const cell = Math.max(3, H * 0.07);
  for (let Y = 0; Y < size.h; Y++) {
    const tau = (dgy - Y) / H;
    // The wind presses the crown down a little: invert Y = t - sq t² for the height the pixel came from.
    const t = sq > 0 && tau > 0 ? (1 - Math.sqrt(Math.max(0, 1 - 4 * sq * tau))) / (2 * sq) : tau;
    // Below the anchor her crop sometimes carries more than the library allows a sprite (a palm's grass patch, 21 pixels):
    // it is pressed up into the eleven pixels a sprite may paint under its ground line rather than cut off.
    const under = src.h - gy, c = crown(t), sy = t >= 0 || under <= 11 ? gy - t * H : gy - t * H * under / 11, shift = bend(t);
    for (let X = 0; X < size.w; X++) {
      const v = X - dax - shift - c * p.ripple * H * (noise(X, Y, cell, 3) - 0.5);
      const u = v > 0 ? v / (1 + p.stream * c) : v / (1 - p.press * c);
      // Leaves on the leeward side lift a little as they stream.
      sample(img, ax + u, sy + (v > 0 ? c * p.stream * 0.05 * v * (p.lift ?? 1) : 0), px);
      const o = (Y * size.w + X) * 4;
      out.d[o] = px[0]; out.d[o + 1] = px[1]; out.d[o + 2] = px[2]; out.d[o + 3] = px[3];
    }
  }
  // The windward edge torn, and some windward leaves turned pale side up.
  const leafSum = [0, 0, 0, 0];
  for (let Y = 0; Y < size.h; Y++) {
    const t = (dgy - Y) / H, c = crown(t);
    if (c < 0.05) continue;
    let left = -1, right = -1;
    for (let X = 0; X < size.w; X++) if (out.d[(Y * size.w + X) * 4 + 3] > 0.5) { if (left < 0) left = X; right = X; }
    if (left < 0) continue;
    const depth = Math.max(2, (right - left) * 0.14), axis = dax + bend(t);
    for (let X = left; X <= right; X++) {
      const o = (Y * size.w + X) * 4, a = out.d[o + 3];
      if (a < 0.02) continue;
      const d = X - left;
      if (p.erode && d < depth) {
        const threshold = p.erode * (1 - d / depth), keep = smooth(threshold - 0.1, threshold + 0.1, noise(X, Y, 4.5, 9));
        for (let k = 0; k < 4; k++) out.d[o + k] *= keep;
      }
      if (p.flip && X < axis) {
        const n = noise(X, Y, 3.2, 17), k = p.flip * c * smooth(0.6, 0.78, n);
        const pale = [0.8, 0.82, 0.5];
        for (let ch = 0; ch < 3; ch++) out.d[o + ch] = out.d[o + ch] * (1 - k) + pale[ch] * out.d[o + 3] * k;
      }
      if (c > 0.6 && out.d[o + 3] > 0.9) { for (let ch = 0; ch < 3; ch++) leafSum[ch] += out.d[o + ch] / out.d[o + 3]; leafSum[3]++; }
    }
  }
  // Her painted trees are almost never quite opaque inside (a pine's body is about 0.93 alpha: the grass shows through by a
  // few in a hundred, which nobody can see). The library's own sprite rule wants solid paint, so the body of the bent tree is
  // made fully opaque; the soft edge is left as she painted it.
  for (let o = 0; o < out.d.length; o += 4) {
    const a = out.d[o + 3];
    if (a >= 0.86 && a < 1) { const k = 1 / a; out.d[o] *= k; out.d[o + 1] *= k; out.d[o + 2] *= k; out.d[o + 3] = 1; }
  }
  const leaf = leafSum[3] ? leafSum.slice(0, 3).map(v => v / leafSum[3]) : [0.35, 0.45, 0.2];
  // Where each loose leaf goes: to leeward of the crown's edge at its height, fewer and smaller further out.
  const loose = [];
  const rand = k => { const s = Math.sin(k * 91.7 + (p.seed || 1) * 37.3) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < (p.leaves || 0); i++) {
    const t = p.crownFrom + (0.95 - p.crownFrom) * rand(i * 3 + 1), Y = Math.round(dgy - t * H);
    let edge = -1;
    for (let X = size.w - 1; X >= 0; X--) if (out.d[(Y * size.w + X) * 4 + 3] > 0.5) { edge = X; break; }
    if (edge < 0) continue;
    const r = rand(i * 3 + 2), x = edge + H * (0.015 + 0.2 * Math.pow(r, 1.3));
    if (x > size.w - 6) continue;
    loose.push({ x, y: Y + H * (rand(i * 3 + 3) - 0.35) * 0.08 - r * H * 0.03, size: H * 0.04 * (1 - 0.4 * r), turn: -30 + rand(i * 7 + 5) * 110 });
  }
  return { img: out, ax: dax, gy: dgy, leaf, loose, H };
}

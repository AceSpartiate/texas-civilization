// Area B's icon pieces (docs/CLAUDE_ART_PLAN.md B5, B9-B11): the panel's action icons are 128 by 128, transparent, one
// silhouette with a thin dark outline, reading at 34-38 CSS px and dimmed to 40% (request 2026-09-15, action icons). Drawn in
// pixels, y down, with the kit's outline and flat shade; people in them are the rig's own figures (little.mjs `figureIn`),
// so a child in an icon has the child's proportions and reads as a child (the children's rule of 2026-09-21).
import { LINE, PALETTE, tone } from './style.mjs';
import { Ink, frameSvg, blob, curve, ellipse, capsule, poly, add, f2 } from './svg.mjs';

export const ICON = 128;
/** One icon: `draw(ink)` in pixels on a 128 cell, the outline about 3 px. Anchored low in the middle as her icons are. */
export function iconFrame(name, note, draw, { cell = ICON, anchorY = 0.92 } = {}) {
  const ink = new Ink(name, 1.4, { yUp: false, shadeOffset: 1.6 });
  draw(ink);
  return { svg: frameSvg({ name, w: cell, h: cell, body: ink.toString(), defs: ink.defs, note }), anchorX: 0.5, anchorY };
}
const P = p => `${f2(p[0])} ${f2(p[1])}`;

/** A patch of ground: a flattened blob of earth or grass under the subject, so it stands on something. */
export function ground(ink, c, rx, ry, colour = '#8a7a4a') {
  ink.shape(ellipse(c, rx, ry), colour, { off: 1.2 });
}
/** A log seen side on (a wall log, a pile's log): bark body and a pale cut end on the right. */
export function logSide(ink, a, b, r, { bark = PALETTE.wood, end = true } = {}) {
  ink.shape(capsule(a, b, r, r), bark, { off: 1.2 });
  ink.line(curve([add(a, [4, -r * 0.35]), add(b, [-6, -r * 0.3])]), { width: LINE.fine, colour: tone(bark, -0.4), opacity: 0.7 });
  if (end) { ink.shape(ellipse(b, r * 0.62, r * 0.98), PALETTE.endGrain, { off: 0.6, outline: LINE.inner + 0.6 }); ink.line(ellipse(b, r * 0.3, r * 0.5), { width: LINE.fine, colour: tone(PALETTE.endGrain, -0.35) }); }
}
/** A little log cabin three-quarter: a front wall of logs, a gable end, a shake roof, a door; `x,y` its front bottom corner. */
export function cabin(ink, [x, y], w, h) {
  const roofH = h * 0.62, side = w * 0.42;
  // Gable end (to the right, receding), the front wall, the roof over both.
  ink.shape(poly([[x + w, y], [x + w + side, y - side * 0.5], [x + w + side, y - h - side * 0.5], [x + w + side / 2, y - h - roofH - side * 0.25], [x + w, y - h]]), tone(PALETTE.wood, -0.15), { off: 1 });
  ink.shape(poly([[x, y], [x + w, y], [x + w, y - h], [x, y - h]]), PALETTE.wood, { off: 1 });
  for (let i = 1; i < 4; i++) ink.line(`M ${P([x, y - (h * i) / 4])} L ${P([x + w, y - (h * i) / 4])}`, { width: LINE.fine, colour: PALETTE.woodDark, opacity: 0.8 });
  ink.shape(poly([[x + w * 0.38, y], [x + w * 0.62, y], [x + w * 0.62, y - h * 0.72], [x + w * 0.38, y - h * 0.72]]), PALETTE.woodDark, { shade: false, outline: LINE.inner });
  ink.shape(poly([[x - w * 0.08, y - h], [x + w + side * 0.1, y - h], [x + w + side / 2 + 2, y - h - roofH - side * 0.25], [x + side / 2 - w * 0.02, y - h - roofH - side * 0.25]]), '#8a6a44', { off: 1.2, lift: true });
  ink.line(`M ${P([x + side / 2, y - h - roofH * 0.5 - side * 0.12])} L ${P([x + w + side * 0.3, y - h - roofH * 0.5 - side * 0.12])}`, { width: LINE.fine, colour: '#5a4028', opacity: 0.7 });
}
/** A canvas wedge tent, three-quarter, its front at `c` (ground middle). */
export function tent(ink, c, s = 1, colour = '#e2d2aa') {
  const [x, y] = c;
  ink.shape(poly([[x + 6 * s, y], [x + 22 * s, y - 6 * s], [x + 12 * s, y - 24 * s], [x - 2 * s, y - 20 * s]]), tone(colour, -0.18), { off: 0.8 });
  ink.shape(poly([[x - 12 * s, y], [x + 8 * s, y], [x - 2 * s, y - 20 * s]]), colour, { off: 0.8, lift: true });
  ink.shape(poly([[x - 4 * s, y], [x + 1 * s, y], [x - 2 * s, y - 9 * s]]), '#6a5a3a', { shade: false, outline: LINE.fine });
}
/** A covered wagon side on, stopped: its box, the bowed canvas, the near wheels; `x,y` the ground under its middle. */
export function wagon(ink, [x, y], s = 1) {
  const box = [[x - 30 * s, y - 14 * s], [x + 26 * s, y - 14 * s], [x + 24 * s, y - 26 * s], [x - 28 * s, y - 26 * s]];
  ink.shape(poly(box), '#7a5634', { off: 1 });
  ink.shape(blob([[x - 30 * s, y - 26 * s], [x - 32 * s, y - 40 * s], [x - 20 * s, y - 50 * s], [x, y - 52 * s], [x + 18 * s, y - 50 * s], [x + 28 * s, y - 40 * s], [x + 25 * s, y - 26 * s]], 0.7), '#eadcb8', { off: 1.4, lift: true });
  for (const t of [-14, 2, 16]) ink.line(curve([[x + t * s, y - 26 * s], [x + t * s + 0.5, y - 40 * s], [x + t * s, y - 51 * s]]), { width: LINE.fine, colour: '#a8966a', opacity: 0.9 });
  ink.line(`M ${P([x + 26 * s, y - 20 * s])} L ${P([x + 44 * s, y - 12 * s])}`, { width: 3, colour: '#5a3a20' });
  for (const wx of [-20, 16]) {
    ink.shape(ellipse([x + wx * s, y - 11 * s], 11 * s, 11 * s), '#6a4a2a', { off: 0.6 });
    ink.shape(ellipse([x + wx * s, y - 11 * s], 7.5 * s, 7.5 * s), '#b89060', { shade: false, outline: LINE.inner });
    for (let a = 0; a < 6; a++) { const t = a * Math.PI / 3; ink.line(`M ${P([x + wx * s, y - 11 * s])} L ${P([x + wx * s + Math.cos(t) * 7 * s, y - 11 * s + Math.sin(t) * 7 * s])}`, { width: LINE.fine, colour: '#5a3a20' }); }
    ink.shape(ellipse([x + wx * s, y - 11 * s], 2 * s, 2 * s), '#3a2a1a', { shade: false, outline: LINE.fine });
  }
}
/** A hen side on facing `f` (1 east, -1 west), pecking when `peck`; `c` her feet. */
export function hen(ink, [x, y], s = 1, { f = 1, peck = false, colour = '#9a4a24' } = {}) {
  const X = dx => x + dx * s * f;
  ink.line(`M ${P([X(-2), y - 7 * s])} L ${P([X(-3), y])} M ${P([X(3), y - 7 * s])} L ${P([X(4), y])}`, { width: 2.4, colour: '#c8902a' });
  ink.shape(blob([[X(-14), y - 20 * s], [X(-12), y - 10 * s], [X(0), y - 6 * s], [X(10), y - 10 * s], [X(11), y - 18 * s], [X(0), y - 22 * s]], 0.8), colour, { off: 1, lift: true });
  ink.shape(blob([[X(-16), y - 18 * s], [X(-19), y - 27 * s], [X(-11), y - 22 * s]], 0.6), tone(colour, -0.25), { off: 0.6 });
  const hx = peck ? X(14) : X(12), hy = peck ? y - 9 * s : y - 26 * s;
  ink.shape(capsule([X(7), y - 18 * s], [hx, hy], 4.4 * s, 3.8 * s), colour, { off: 0.6 });
  ink.shape(ellipse([hx, hy], 5 * s, 4.6 * s), colour, { off: 0.6 });
  ink.shape(poly([[hx + 4 * s * f, hy - 1 * s], [hx + 9 * s * f, hy + (peck ? 3 : 1) * s], [hx + 4 * s * f, hy + 2 * s]]), '#e0a02a', { shade: false, outline: LINE.fine });
  ink.shape(blob([[hx - 3 * s * f, hy - 4 * s], [hx - 1 * s * f, hy - 8 * s], [hx + 2 * s * f, hy - 5 * s], [hx + 3 * s * f, hy - 8 * s], [hx + 4 * s * f, hy - 3.5 * s]], 0.6), '#c83a2a', { shade: false, outline: LINE.fine });
  ink.dot(ellipse([hx + 1.6 * s * f, hy - 0.8 * s], 0.9 * s, 0.9 * s), LINE.ink);
  ink.line(curve([[X(-8), y - 16 * s], [X(-1), y - 12 * s], [X(6), y - 15 * s]]), { width: LINE.fine, colour: tone(colour, -0.4), opacity: 0.8 });
}
/** Corn kernels scattered on the ground about `c`. */
export function kernelsOn(ink, c, n = 7, spread = 14) {
  for (let i = 0; i < n; i++) ink.shape(ellipse([c[0] + Math.sin(i * 5.1) * spread, c[1] + Math.cos(i * 3.7) * spread * 0.3], 1.8, 1.4), '#e8c040', { shade: false, outline: LINE.fine });
}
/** A family's milk cow side on facing east (smaller and plainer than the range longhorn: a fawn dairy cow, short horns, an udder). */
export function milkCow(ink, [x, y], s = 1, { rope = null } = {}) {
  const hide = '#b98a58', dark = tone(hide, -0.28);
  const leg = (lx, far) => { ink.shape(capsule([x + lx * s, y - 22 * s], [x + (lx + (far ? 1 : 0)) * s, y - 2 * s], 3 * s, 2.4 * s), far ? dark : hide, { off: 0.5 }); ink.shape(ellipse([x + (lx + 0.5) * s, y - 1.5 * s], 3 * s, 1.8 * s), '#3a2a1a', { shade: false, outline: LINE.fine }); };
  leg(-19, true); leg(13, true);
  ink.shape(blob([[x - 26 * s, y - 30 * s], [x - 25 * s, y - 42 * s], [x - 8 * s, y - 45 * s], [x + 14 * s, y - 43 * s], [x + 22 * s, y - 36 * s], [x + 20 * s, y - 22 * s], [x - 6 * s, y - 18 * s], [x - 24 * s, y - 20 * s]], 0.8), hide, { off: 1.4, lift: true });
  ink.shape(blob([[x - 12 * s, y - 38 * s], [x - 4 * s, y - 42 * s], [x + 4 * s, y - 36 * s], [x - 4 * s, y - 30 * s]], 0.8), '#f0e0c0', { shade: false, outline: LINE.fine });
  ink.shape(ellipse([x - 8 * s, y - 17 * s], 5 * s, 3.4 * s), '#e8a898', { off: 0.4 });
  leg(-15, false); leg(17, false);
  ink.line(curve([[x - 26 * s, y - 38 * s], [x - 30 * s, y - 30 * s], [x - 29 * s, y - 20 * s]]), { width: 2.2, colour: dark });
  ink.shape(ellipse([x - 29 * s, y - 19 * s], 1.8 * s, 3 * s), '#3a2a1a', { shade: false, outline: LINE.fine });
  // The head, low and forward, a white blaze, short curved horns, the halter.
  ink.shape(blob([[x + 18 * s, y - 42 * s], [x + 28 * s, y - 44 * s], [x + 34 * s, y - 34 * s], [x + 33 * s, y - 28 * s], [x + 26 * s, y - 28 * s], [x + 18 * s, y - 34 * s]], 0.8), hide, { off: 0.8, lift: true });
  ink.shape(blob([[x + 27 * s, y - 42 * s], [x + 31 * s, y - 36 * s], [x + 32 * s, y - 29 * s], [x + 29 * s, y - 31 * s]], 0.7), '#f0e0c0', { shade: false, outline: LINE.fine });
  ink.line(curve([[x + 24 * s, y - 43 * s], [x + 22 * s, y - 48 * s], [x + 26 * s, y - 50 * s]]), { width: 2.6, colour: '#e8dcc0' });
  ink.shape(ellipse([x + 19 * s, y - 41 * s], 3.4 * s, 2 * s, -30), dark, { off: 0.3 });
  ink.dot(ellipse([x + 27 * s, y - 38 * s], 1.1 * s, 1.1 * s), LINE.ink);
  ink.line(`M ${P([x + 22 * s, y - 42 * s])} L ${P([x + 25 * s, y - 29 * s])} M ${P([x + 23 * s, y - 35 * s])} L ${P([x + 32 * s, y - 33 * s])}`, { width: 1.8, colour: '#6a3a1e' });
  if (rope) ink.line(curve([[x + 30 * s, y - 32 * s], [(x + 30 * s + rope[0]) / 2, Math.max(y - 32 * s, rope[1]) + 8 * s], rope]), { width: 2, colour: '#c8a86a' });
}
/** Flames: two or three tongues from `base`. */
export function flames(ink, [x, y], s = 1) {
  ink.shape(blob([[x - 9 * s, y], [x - 8 * s, y - 12 * s], [x - 2 * s, y - 26 * s], [x + 2 * s, y - 14 * s], [x + 7 * s, y - 20 * s], [x + 9 * s, y - 6 * s], [x + 6 * s, y + 1 * s]], 0.8), '#e07a2a', { off: 0.8 });
  ink.shape(blob([[x - 4 * s, y], [x - 3 * s, y - 9 * s], [x, y - 16 * s], [x + 3 * s, y - 8 * s], [x + 4 * s, y]], 0.8), '#f4c850', { shade: false, outline: LINE.fine });
}
/** A hand and forearm reaching in from off the icon's edge: the sleeve from `from` to the wrist, a hand `open` or gripping. */
export function hand(ink, from, wrist, { sleeve = '#8b432b', skin = '#e0a070', open = false, size = 1 } = {}) {
  ink.shape(capsule(from, wrist, 7 * size, 6 * size), sleeve, { off: 1 });
  const d = [wrist[0] - from[0], wrist[1] - from[1]], l = Math.hypot(...d), u = [d[0] / l, d[1] / l], n = [-u[1], u[0]];
  const c = add(wrist, [u[0] * 7 * size, u[1] * 7 * size]);
  if (open) {
    ink.shape(blob([add(wrist, [n[0] * 5 * size, n[1] * 5 * size]), add(c, [u[0] * 7 * size + n[0] * 5 * size, u[1] * 7 * size + n[1] * 5 * size]), add(c, [u[0] * 9 * size, u[1] * 9 * size]), add(c, [u[0] * 6 * size - n[0] * 6 * size, u[1] * 6 * size - n[1] * 6 * size]), add(wrist, [-n[0] * 5 * size, -n[1] * 5 * size])], 0.8), skin, { off: 0.6 });
  } else ink.shape(ellipse(c, 7 * size, 6 * size, Math.atan2(u[1], u[0]) * 180 / Math.PI), skin, { off: 0.6, lift: true });
  ink.shape(capsule(add(wrist, [-u[0] * 2, -u[1] * 2]), add(wrist, [u[0] * 1.5, u[1] * 1.5]), 7.4 * size, 7.4 * size), tone(sleeve, 0.2), { shade: false, outline: LINE.inner });
}
/** Rain: short slanted streaks over the icon. */
export function rain(ink, box, n = 14) {
  for (let i = 0; i < n; i++) {
    const x = box[0] + ((i * 37) % 100) / 100 * (box[2] - box[0]), y = box[1] + ((i * 61) % 100) / 100 * (box[3] - box[1]);
    ink.line(`M ${P([x, y])} L ${P([x - 4, y + 10])}`, { width: 2, colour: '#5f7f96', opacity: 0.9 });
  }
}
/** A music note (an eighth note) at `c`. */
export function note(ink, [x, y], s = 1) {
  ink.shape(ellipse([x, y], 5 * s, 3.8 * s, -20), '#3a2a1a', { shade: false, outline: LINE.fine });
  ink.line(`M ${P([x + 4.4 * s, y - 1 * s])} L ${P([x + 4.4 * s, y - 20 * s])}`, { width: 2.6, colour: '#3a2a1a' });
  ink.line(curve([[x + 4.4 * s, y - 20 * s], [x + 10 * s, y - 15 * s], [x + 9 * s, y - 9 * s]]), { width: 2.6, colour: '#3a2a1a' });
}
/** A small iron-bound wooden chest, three-quarter; `c` its bottom middle. */
export function chest(ink, [x, y], s = 1) {
  ink.shape(poly([[x + 16 * s, y], [x + 24 * s, y - 5 * s], [x + 24 * s, y - 21 * s], [x + 16 * s, y - 16 * s]]), tone('#8a5a32', -0.2), { off: 0.6 });
  ink.shape(poly([[x - 16 * s, y], [x + 16 * s, y], [x + 16 * s, y - 16 * s], [x - 16 * s, y - 16 * s]]), '#8a5a32', { off: 0.8 });
  ink.shape(blob([[x - 16 * s, y - 16 * s], [x - 14 * s, y - 24 * s], [x + 8 * s, y - 28 * s], [x + 24 * s, y - 21 * s], [x + 16 * s, y - 16 * s]], 0.5), '#9a6a3c', { off: 0.8, lift: true });
  for (const bx of [-9, 9]) ink.line(`M ${P([x + bx * s, y])} L ${P([x + bx * s, y - 17 * s])}`, { width: 3, colour: '#4a4a48' });
  ink.shape(poly([[x - 2.5 * s, y - 14 * s], [x + 2.5 * s, y - 14 * s], [x + 2.5 * s, y - 8 * s], [x - 2.5 * s, y - 8 * s]]), '#c8a040', { shade: false, outline: LINE.fine });
}
export { tone, LINE, PALETTE, ellipse, blob, curve, capsule, poly, add };

// The battle kit's ground pieces drawn inside a person's frame (rig units, y up, the ground at 0): a small cook fire and its
// pot, the stone edge of a wall with a loophole, a cut riverbank with a step, a trench's near bank, a water line, a litter.
// Claude's temporary art (area C, docs/CLAUDE_ART_PLAN.md).
import { LINE, PALETTE, tone } from '../kit/style.mjs';
import { add, blob, capsule, curve, ellipse, poly } from '../kit/svg.mjs';
import { seg } from './gear.mjs';

export const EARTH = '#8a6a44', EARTH_DARK = '#6a4e30', GRASS = '#7f9f58', STONE = '#b8a888', STONE_DARK = '#8a7c64', WATER = '#7a98a0';

/** A small cook fire of sticks with a kettle hung over it on a crane of two forked sticks; `phase` moves the flames. */
export function cookFire(ink, x, { phase = 0, pot = true } = {}) {
  for (const [a, b] of [[[-7, 0.5], [6, 3]], [[-6, 3], [7, 0.8]], [[-2, 0], [2, 5]]]) ink.shape(capsule(add([x, 0], a), add([x, 0], b), 1.1, 1.1), PALETTE.woodDark, { shade: false, outline: 2.4 });
  const f = phase ? [[x - 4, 3], [x - 1.5, 12], [x + 1, 7], [x + 3.5, 14], [x + 5, 3]] : [[x - 4.5, 3], [x - 2, 10], [x + 0.5, 15], [x + 2.5, 8], [x + 5, 3]];
  ink.shape(blob(f, 0.6), '#e8903a', { shade: false, outline: 2.2 });
  ink.shape(blob([[x - 2, 3], [x - 0.5, 8], [x + 1.5, 6], [x + 2.5, 3]], 0.6), '#f6d060', { shade: false, outline: 0 });
  if (!pot) return;
  ink.line(seg([x - 9, 0], [x - 9, 24]), { width: 2.6 }); ink.line(seg([x + 9, 0], [x + 9, 24]), { width: 2.6 });
  ink.line(seg([x - 10, 23], [x + 10, 23]), { width: 2.4 });
  ink.line(seg([x, 23], [x, 18]), { width: 1.6 });
  ink.shape(blob([[x - 5, 18], [x + 5, 18], [x + 4.5, 12], [x, 10.5], [x - 4.5, 12]], 0.7), '#2e2a26', { off: 0.5 });
}
/** The edge of a stone house's wall at `x` (its face toward the enemy, east), with a loophole at `hole` height. */
export function wallEdge(ink, x, { top = 92, hole = 66, width = 26 } = {}) {
  ink.shape(poly([[x, -1.5], [x + width, -1.5], [x + width, top], [x, top]]), STONE, { outline: 3.2, off: 2 });
  for (let y = 10; y < top; y += 13) ink.line(seg([x, y], [x + width, y]), { colour: STONE_DARK, width: 1.4, opacity: 0.7 });
  for (let y = 4; y < top; y += 13) ink.line(seg([x + (y % 26 < 13 ? 9 : 17), y], [x + (y % 26 < 13 ? 9 : 17), y + 13]), { colour: STONE_DARK, width: 1.2, opacity: 0.6 });
  ink.shape(poly([[x - 0.5, hole - 3.5], [x + 4, hole - 2], [x + 4, hole + 2], [x - 0.5, hole + 3.5]]), '#2d2620', { shade: false, outline: 1.6 });
}
/** A door post and plank door at `x`, for the crowbar (the Veramendi house and its neighbours were forced so). */
export function doorEdge(ink, x, { top = 96 } = {}) {
  ink.shape(poly([[x + 6, -1.5], [x + 30, -1.5], [x + 30, top], [x + 6, top]]), STONE, { outline: 3.2, off: 2 });
  ink.shape(poly([[x, -1.5], [x + 7, -1.5], [x + 7, 78], [x, 78]]), '#7a5a38', { outline: 2.6, off: 0.8 });
  for (const y of [18, 58]) ink.line(seg([x, y], [x + 7, y]), { colour: PALETTE.iron, width: 2 });
}
/** A cut riverbank face at `x`, its top (the lip, grassed) at `top`, a step cut in it at `step`. */
export function bankFace(ink, x, { top = 52, step = 22, width = 70 } = {}) {
  const pts = [[x, -1.5], [x + width, -1.5], [x + width, top + 2], [x + 12, top + 2], [x + 8, top - 2], [x + 7, step + 2], [x + 1, step], [x, step - 1]];
  ink.shape(poly(pts), EARTH, { outline: 3.2, off: 2.4 });
  ink.line(seg([x + 1, step], [x + 7, step]), { width: 2.2 });
  for (let i = 0; i < 6; i++) ink.line(curve([[x + 14 + i * 9, top + 1], [x + 15 + i * 9, top + 6], [x + 17 + i * 9, top + 2]]), { colour: '#4a6a2a', width: 2 });
  ink.shape(poly([[x + 9, top], [x + width, top], [x + width, top + 3.5], [x + 11, top + 3.5]]), GRASS, { shade: false, outline: 1.8 });
  for (const [a, b] of [[x + 20, 12], [x + 44, 30], [x + 32, 42]]) ink.line(curve([[a, b], [a + 6, b + 1], [a + 11, b - 0.5]]), { colour: EARTH_DARK, width: 1.4, opacity: 0.8 });
}
/** The near bank of a trench across the frame, in front of a man digging in it: fresh earth to `h`. */
export function trenchBank(ink, { from = -60, to = 70, h = 16 } = {}) {
  ink.shape(blob([[from, -1.5], [from + 6, h * 0.8], [from + 30, h], [0, h * 1.1], [to - 30, h * 0.95], [to - 4, h * 0.7], [to, -1.5]], 0.6), EARTH, { off: 1.6, lift: true });
  for (let i = 0; i < 7; i++) ink.shape(ellipse([from + 12 + i * 17, h * 0.6 + (i % 2) * 2], 2.2, 1.6), EARTH_DARK, { shade: false, outline: 1.2 });
}
/** The water's surface at `y` round a wading figure: a band of water and a ring of splash about the legs. */
export function waterLine(ink, y, { from = -40, to = 40, splash = 0 } = {}) {
  ink.shape(poly([[from, -2], [to, -2], [to, y], [from, y]]), WATER, { shade: false, outline: 0, opacity: 0.001 });
  ink.shape(ellipse([0, y], (to - from) / 2 * 0.62, 4, 0), tone(WATER, 0.15), { shade: false, outline: 2.2 });
  ink.line(curve([[from * 0.5, y - 1], [0, y + 1.5], [to * 0.5, y - 1]]), { colour: '#e8f0f0', width: 1.6 });
  if (splash) for (const d of [-1, 1]) ink.shape(blob([[d * 12, y], [d * (16 + splash), y + 6], [d * 20, y + 1]], 0.6), '#e8f0f0', { shade: false, outline: 1.4 });
}

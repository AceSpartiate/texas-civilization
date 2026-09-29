// Loads on a pack animal for area D (2026-09-28): a pack saddle with sacks of corn (the Mexican foragers' mule), and bundles of
// cut grass (the Grass Fight's mules, November 26, 1835: the train the Texians took for silver was carrying fodder). Each is a
// `pack` callback for kit/quadruped.mjs - (g, P, pose) side-on, where P places a point on the body; (g, seat, ctx) end-on.
import { LINE, tone } from './style.mjs';
import { add, blob, curve, ellipse } from './svg.mjs';

const SACK = '#d8c49a', ROPE = '#8a6a3a', GRASS = '#b8a45a', GRASS_DARK = '#8a7a3a';

/** A sawbuck pack saddle on a blanket, and `sacks` sacks of corn lashed either side (the near ones drawn). */
export const sacks = (count = 2) => (g, P) => {
  g.shape(blob([P([-22, 98]), P([-24, 82]), P([16, 82]), P([20, 98])], 0.5), '#6a5a3a', { off: 1 });
  for (const x of [-12, 8]) g.line(curve([P([x - 4, 96]), P([x, 108]), P([x + 4, 96])]), { width: 3, colour: '#7a5230' });
  const spots = count >= 3 ? [[-14, 90], [4, 92], [-4, 104]] : [[-12, 90], [6, 91]];
  for (const [x, y] of spots) {
    g.shape(blob([P([x - 9, y + 7]), P([x - 11, y - 6]), P([x - 4, y - 11]), P([x + 7, y - 10]), P([x + 10, y - 2]), P([x + 8, y + 8]), P([x, y + 11])], 0.9), SACK, { off: 1.2, lift: true });
    g.line(curve([P([x - 8, y + 6]), P([x - 2, y + 9]), P([x + 7, y + 7])]), { width: LINE.inner, colour: tone(SACK, -0.4) });
  }
  g.line(curve([P([-24, 84]), P([-4, 80]), P([18, 84])]), { width: 2.4, colour: ROPE });
  g.line(curve([P([-2, 104]), P([0, 78]), P([2, 56])]), { width: 2.4, colour: ROPE });
};
export const sacksEnd = (g, seat, { hw }) => {
  for (const s of [-1, 1]) {
    const c = add(seat, [s * (hw + 5), -10]);
    g.shape(ellipse(c, 9, 12), SACK, { off: 1.2, lift: true });
    g.line(curve([add(c, [-6, 8]), add(c, [0, 10]), add(c, [6, 8])]), { width: LINE.inner, colour: tone(SACK, -0.4) });
  }
  g.shape(ellipse(add(seat, [0, 4]), 12, 8), SACK, { off: 1, lift: true });
};

/** Bundles of cut grass lashed high on a pack saddle: long, loose at the ends, tied round the middle. */
export const grass = (g, P) => {
  g.shape(blob([P([-22, 98]), P([-24, 82]), P([16, 82]), P([20, 98])], 0.5), '#6a5a3a', { off: 1 });
  for (const [dy, x0] of [[0, -32], [12, -28], [22, -22]]) {
    const pts = [P([x0, 92 + dy]), P([x0 - 6, 100 + dy]), P([x0 + 4, 108 + dy]), P([x0 + 44, 110 + dy]), P([x0 + 58, 104 + dy]), P([x0 + 52, 92 + dy]), P([x0 + 20, 88 + dy])];
    g.shape(blob(pts, 0.8), dy === 12 ? GRASS_DARK : GRASS, { off: 1.4, lift: true });
    for (let i = 0; i < 5; i++) g.line(curve([P([x0 + 2 + i * 9, 92 + dy]), P([x0 + 6 + i * 9, 100 + dy]), P([x0 + 10 + i * 9, 107 + dy])]), { width: LINE.fine, colour: tone(GRASS, -0.45), opacity: 0.7 });
    g.line(curve([P([x0 + 22, 88 + dy]), P([x0 + 24, 99 + dy]), P([x0 + 22, 110 + dy])]), { width: 2.6, colour: ROPE });
  }
};
export const grassEnd = (g, seat, { hw }) => {
  for (const s of [-1, 1]) {
    const c = add(seat, [s * (hw + 4), 0]);
    g.shape(blob([add(c, [-10, -14]), add(c, [-12, 10]), add(c, [0, 22]), add(c, [12, 10]), add(c, [10, -14])], 0.8), GRASS, { off: 1.2, lift: true });
    g.line(curve([add(c, [-10, 2]), add(c, [0, 4]), add(c, [10, 2])]), { width: 2.4, colour: ROPE });
  }
  g.shape(blob([add(seat, [-14, 0]), add(seat, [-10, 18]), add(seat, [10, 18]), add(seat, [14, 0])], 0.8), GRASS_DARK, { off: 1.2 });
};

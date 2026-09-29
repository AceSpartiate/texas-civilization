// The family's wood pile by the house (request 2026-09-28 — people at work, item 16): `wood-pile-1` to `wood-pile-4`, a
// pile of wall logs seen three-quarter on the ground anchor at about ten, twenty, thirty and forty logs. Drawn procedurally
// from the kit so the four sizes are one pile growing, not four drawings: the same log, the same bark, the same light.
//
// Scale: the page draws the pile at `SIZE.logPile` (1.2 of a person) and the frame's `logicalHeight` is that 1.2, so one
// person is 160 source pixels here. A wall log is about ten inches through (22 px, 0.14 of a person) and as long as
// Astra's `log-fallen` is drawn (about 2.4 people, 360 px); no pile is more than four logs high, about a person's waist:
// it grows back into the yard, not up. A few darker cedar sills lie in the bigger piles, as the request allows.
import { Ink, frameSvg, ellipse, f2 } from '../kit/svg.mjs';
import { LINE, PALETTE, VIEW, tone } from '../kit/style.mjs';

export const AREA = 'work';
export const DATE = '2026-09-28';

const W = 448, H = 320, BASE = 300, PERSON = 160;
const D = 22, LENGTH = 360;
// Logs a layer, bottom first: ten, twenty, thirty and forty; never more than four layers.
const LAYERS = { 1: [4, 3, 3], 2: [6, 5, 5, 4], 3: [8, 8, 7, 7], 4: [11, 10, 10, 9] };
const rand = seed => { const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// The pile lies turned a little from east-west, so the logs' cut ends face the camera: a log runs from its cut end toward
// AXIS (west and a little north), and the pile grows back along ACROSS (north and a little east). World x is east, z
// north, y up; the screen is x across and the view's foreshortening (VIEW.depth) on z.
const AXIS = [-0.94, 0.34], ACROSS = [0.34, 0.94];
const screen = (x, z, y) => [x, -y - z * VIEW.depth];
const P = p => `${f2(p[0])} ${f2(p[1])}`;

function log(ink, end, length, { bark, grain, seed }) {
  const r = D / 2;
  const back = [end[0] + AXIS[0] * length, end[1] - AXIS[1] * length * VIEW.depth];
  const dir = [back[0] - end[0], back[1] - end[1]], l = Math.hypot(...dir), u = [dir[0] / l, dir[1] / l], n = [-u[1], u[0]];
  const at = (p, k) => [p[0] + n[0] * r * k, p[1] + n[1] * r * k];
  const along = t => [end[0] + dir[0] * t, end[1] + dir[1] * t];
  // The body from the cut end back to a rounded bark cap; then the cut face over its front.
  ink.shape(`M ${P(at(end, 1))} L ${P(at(back, 1))} A ${f2(r * 0.5)} ${f2(r)} 0 0 0 ${P(at(back, -1))} L ${P(at(end, -1))} Z`, bark, { off: 3, lift: true });
  for (let i = 0; i < 3; i++) {
    const k = -0.5 + i * 0.5, t0 = 0.1 + rand(seed + i) * 0.25, t1 = 0.62 + rand(seed + i + 7) * 0.3;
    ink.line(`M ${P(at(along(t0), k))} L ${P(at(along(t1), k))}`, { width: LINE.fine, colour: tone(bark, -0.45), opacity: 0.7 });
  }
  ink.dot(ellipse(at(along(0.3 + rand(seed + 11) * 0.5), -0.1), 3.2, 2.2), tone(bark, -0.4), 0.8);
  ink.shape(ellipse(end, r * 0.58, r * 0.98, -12), grain, { off: 1.4, outline: LINE.inner + 0.8 });
  ink.line(ellipse(end, r * 0.36, r * 0.62, -12), { width: LINE.fine, colour: tone(grain, -0.35), opacity: 0.8 });
  ink.dot(ellipse(end, r * 0.1, r * 0.16), tone(grain, -0.45));
}

export function woodPile(count) {
  const layers = LAYERS[count];
  const ink = new Ink(`wood-pile-${count}`, 1, { yUp: false, shadeOffset: 3 });
  const placed = [];
  layers.forEach((n, i) => {
    for (let j = 0; j < n; j++) {
      // How far back across the pile (a layer sits in the grooves of the one under it, half a log back) and how high.
      const across = (j + i * 0.5) * D, rise = D / 2 + i * D * 0.87, seed = count * 100 + i * 20 + j;
      const sill = count >= 2 && ((i === 0 && j % 4 === 2) || (i === 1 && j === 1));
      placed.push({ across, rise, seed, i, sill });
    }
  });
  placed.sort((a, b) => b.across - a.across || a.i - b.i);
  // The front-bottom log's cut end sits right of centre so the whole pile is centred on its anchor.
  const reach = -AXIS[0] * LENGTH, x0 = W / 2 + reach / 2 - ACROSS[0] * layers[0] * D * 0.5;
  for (const p of placed) {
    const x = x0 + ACROSS[0] * p.across + (rand(p.seed) - 0.5) * 12, z = ACROSS[1] * p.across;
    const [sx, sy] = screen(x, z, p.rise);
    log(ink, [sx, BASE + sy], LENGTH - rand(p.seed + 5) * 34, { seed: p.seed,
      bark: p.sill ? '#5e3b24' : tone(PALETTE.wood, (rand(p.seed + 2) - 0.5) * 0.18),
      grain: p.sill ? '#c98a5a' : tone(PALETTE.endGrain, (rand(p.seed + 9) - 0.5) * 0.1) });
  }
  const total = layers.reduce((s, n) => s + n, 0);
  return {
    svg: frameSvg({ name: `wood-pile-${count}`, w: W, h: H, body: ink.toString(), defs: ink.defs,
      note: `the family's wood pile, ${total} wall logs in ${layers.length} layers, seen three-quarter on its ground anchor (the front of its base)` }),
    anchorX: 0.5, anchorY: +(BASE / H).toFixed(4), logicalHeight: Math.round(PERSON * 1.2),
  };
}

export const SHEETS = {
  'claude-wood-pile': { cell: { w: W, h: H }, columns: 2, request: 'Request 2026-09-28 — people at work', replaceWith: 'item 16: one sprite a size, a pile of wall logs seen three-quarter on the ground anchor, about as long as log-fallen and no taller than a person\'s waist',
    frames: [1, 2, 3, 4].map(n => ({ name: `wood-pile-${n}`, draw: () => woodPile(n),
      prompt: `The family's wood pile by the house at about ${n * 10} logs (${LAYERS[n].join(' + ')} a layer, bottom first): bark-on wall logs, each about as long as log-fallen, lying side by side and stacked in layers that sit in each other's grooves, the pile turned a little so the cut ends - pale end grain with a ring and a dark heart - face the camera; ${n >= 2 ? 'a few darker cedar sills among them; ' : ''}no more than four logs high, about a person's waist; three-quarter north-up view, warm brown bark, dark olive-brown outline, flat shade to the lower right, transparent ground, no shadow.` })) },
};

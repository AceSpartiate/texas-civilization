// Tools and props for the person rig, drawn in rig units (y up, +x forward). A hafted tool is placed by two points - its
// butt and the end its head is on - so a pose can put the tool where the work needs it and the hands on the haft where the
// tool says; the head is drawn square to the haft, its bit to the side named. Texas 1835 tools only (HIST-GONZ-027/028): a
// felling axe, a maul, a grubbing hoe, a spade, a long rifle; nothing is ever pointed at a person.
import { PALETTE, tone } from './style.mjs';
import { add, sub, mul, norm, perp, lerp, capsule, poly, blob, ellipse, len } from './svg.mjs';

/** Tool lengths in rig units (a grown figure is 100 tall). The library's tools read big, as its hoe does (about 0.45 of the figure). */
export const TOOLS = Object.freeze({
  axe: { length: 42, haft: PALETTE.woodLight, head: 'axe' },
  maul: { length: 38, haft: PALETTE.woodLight, head: 'maul' },
  hoe: { length: 46, haft: PALETTE.woodLight, head: 'hoe' },
  spade: { length: 40, haft: PALETTE.woodLight, head: 'spade' },
  mallet: { length: 22, haft: PALETTE.woodLight, head: 'mallet' },
  rifle: { length: 58, haft: '#6b4424', head: 'rifle' },
  pole: { length: 70, haft: '#b89a5e', head: 'pole' },
  broom: { length: 44, haft: PALETTE.woodLight, head: 'broom' },
  lance: { length: 90, haft: '#8a6a44', head: 'lance' },
});

/** Where along a tool's haft (0 butt, 1 head end) a point is. */
export const along = (butt, tip, t) => lerp(butt, tip, t);

/**
 * Draw a hafted tool from `butt` to `tip`. `side` (+1 or -1) is the side of the haft the blade or bit faces, measured as the
 * haft's left normal (+1 turns the bit to the left of the butt-to-tip direction).
 */
export function drawTool(ink, kind, butt, tip, { side = 1, scale = 1 } = {}) {
  const spec = TOOLS[kind], d = norm(sub(tip, butt)), n = mul(perp(d), side), s = scale;
  if (kind === 'rifle') return drawRifle(ink, butt, tip, side);
  if (kind === 'lance') {
    ink.shape(capsule(butt, tip, 0.7 * s, 0.6 * s), spec.haft, { shade: false, outline: 3 });
    const a = tip, b = add(tip, mul(d, 7 * s));
    ink.shape(poly([add(a, mul(n, 1.4 * s)), b, add(a, mul(n, -1.4 * s))]), PALETTE.ironLight, { shade: false, outline: 3 });
    const pennon = [add(a, mul(d, -2)), add(add(a, mul(d, -1)), mul(n, 6)), add(add(a, mul(d, -7)), mul(n, 4)), add(a, mul(d, -8))];
    ink.shape(poly(pennon), '#b8342a', { shade: false, outline: 2.4 });
    return;
  }
  // The haft: a pale wood capsule, a little thicker at the butt, with its light edge.
  const hr = (kind === 'mallet' ? 1.1 : 1.0) * s;
  ink.shape(capsule(butt, tip, hr * 1.05, hr * 0.9), spec.haft, { outline: 3.2, off: 0.5 });
  if (kind === 'axe') {
    // A felling axe's head: a heavy poll behind, the bit flaring out to a curved edge on `side`.
    const base = add(tip, mul(d, -3.2 * s));
    const pts = [add(base, mul(n, -2.4 * s)), add(tip, mul(n, -2.4 * s)), add(add(tip, mul(d, 1.2 * s)), mul(n, 1.5 * s)),
      add(add(tip, mul(d, 2.6 * s)), mul(n, 7.5 * s)), add(add(tip, mul(d, -0.5 * s)), mul(n, 8.6 * s)), add(add(base, mul(d, -2.4 * s)), mul(n, 7.4 * s)),
      add(base, mul(n, 1.8 * s))];
    ink.shape(blob(pts, 0.35), PALETTE.iron, { outline: 3.2, off: 0.6 });
    ink.line(`M ${fmt(add(add(tip, mul(d, 2.2 * s)), mul(n, 7.2 * s)))} L ${fmt(add(add(base, mul(d, -2 * s)), mul(n, 7.2 * s)))}`, { colour: PALETTE.ironLight, width: 2 });
  } else if (kind === 'maul') {
    // A wooden maul: a thick round head of hardwood across the haft end.
    const c = tip, r = 3.4 * s;
    const a = add(c, mul(n, 5.5 * s)), b = add(c, mul(n, -5.5 * s));
    ink.shape(capsule(a, b, r, r), '#8a5a32', { outline: 3.2, off: 0.8 });
    ink.shape(ellipse(a, r * 0.55, r, 0), PALETTE.endGrain, { shade: false, outline: 2 });
  } else if (kind === 'hoe') {
    // A grubbing hoe: a broad iron blade at right angles, its edge toward `side`.
    const neck = add(tip, mul(n, 2.2 * s));
    const pts = [add(tip, mul(d, 1.6 * s)), add(add(neck, mul(n, 6 * s)), mul(d, 3.4 * s)), add(add(neck, mul(n, 7 * s)), mul(d, -3.6 * s)), add(tip, mul(d, -1.6 * s))];
    ink.shape(poly(pts), PALETTE.iron, { outline: 3, off: 0.5 });
  } else if (kind === 'spade') {
    // A spade: the iron blade in line with the haft, a tread on its shoulders.
    const top = tip, bot = add(tip, mul(d, 11 * s));
    const pts = [add(top, mul(n, 3.8 * s)), add(bot, mul(n, 3.2 * s)), add(add(bot, mul(d, 2.2 * s)), mul(n, 0)), add(bot, mul(n, -3.2 * s)), add(top, mul(n, -3.8 * s))];
    ink.shape(blob(pts, 0.25), PALETTE.iron, { outline: 3, off: 0.6 });
    // D-grip at the butt.
    ink.shape(ellipse(add(butt, mul(d, -1.8 * s)), 2.2 * s, 1.6 * s, 0), spec.haft, { shade: false, outline: 2.6 });
  } else if (kind === 'mallet') {
    const a = add(tip, mul(n, 3.2 * s)), b = add(tip, mul(n, -3.2 * s));
    ink.shape(capsule(a, b, 2.4 * s, 2.4 * s), '#8a5a32', { outline: 3, off: 0.5 });
  } else if (kind === 'broom') {
    const a = tip, b = add(tip, mul(d, 10 * s));
    ink.shape(poly([add(a, mul(n, 2)), add(b, mul(n, 5)), add(b, mul(n, -5)), add(a, mul(n, -2))]), '#c8a654', { outline: 3, off: 0.6 });
  } else if (kind === 'pole') {
    ink.line(`M ${fmt(tip)} L ${fmt(add(tip, [0, -40]))}`, { width: 1, colour: '#3a2a1a' });
  }
}
function drawRifle(ink, butt, tip, side) {
  // A long rifle: a dark walnut stock to the lock, a long brown-iron barrel, a brass butt plate.
  const d = norm(sub(tip, butt)), n = mul(perp(d), side), L = len(sub(tip, butt));
  const lock = add(butt, mul(d, L * 0.3));
  const stock = [add(butt, mul(n, 3.4)), add(lock, mul(n, 1.3)), add(add(lock, mul(d, 4)), mul(n, 1.1)), add(add(lock, mul(d, 4)), mul(n, -1.2)), add(lock, mul(n, -1.8)), add(butt, mul(n, -2.2))];
  ink.shape(poly(stock), '#6b4424', { outline: 3, off: 0.6 });
  ink.shape(capsule(add(lock, mul(d, 2)), tip, 0.75, 0.6), '#4a4640', { shade: false, outline: 2.6 });
  ink.shape(capsule(add(lock, mul(d, 2)), add(tip, mul(d, -8)), 0.9, 0.8), '#7a5030', { shade: false, outline: 2.4 });
  ink.line(`M ${fmt(add(butt, mul(n, 3.2)))} L ${fmt(add(butt, mul(n, -2)))}`, { colour: '#c8a040', width: 2.4 });
}
const fmt = p => `${Math.round(p[0] * 100) / 100} ${Math.round(p[1] * 100) / 100}`;

/** A wooden bucket with a bail, hanging from `hand` (rig units), for carrying water. */
export function drawBucket(ink, hand, { size = 1, water = true } = {}) {
  const s = size, top = add(hand, [0, -4 * s]), w = 5 * s, h = 7 * s;
  ink.line(`M ${fmt(add(top, [-w, -1]))} Q ${fmt(add(hand, [0, 2]))} ${fmt(add(top, [w, -1]))}`, { width: 2 });
  ink.shape(poly([add(top, [-w, 0]), add(top, [w, 0]), add(top, [w * 0.82, -h]), add(top, [-w * 0.82, -h])]), '#9a6a3c', { outline: 3, off: 0.8 });
  ink.line(`M ${fmt(add(top, [-w * 0.93, -h * 0.3]))} L ${fmt(add(top, [w * 0.93, -h * 0.3]))} M ${fmt(add(top, [-w * 0.86, -h * 0.8]))} L ${fmt(add(top, [w * 0.86, -h * 0.8]))}`, { width: 1.8 });
  ink.shape(ellipse(top, w, 1.3 * s, 0), water ? '#6a8a94' : '#5a3a20', { shade: false, outline: 2.4 });
}
/** A sack over the shoulder, held at `hand`. */
export function drawSack(ink, at, { size = 1, colour = '#d8c090' } = {}) {
  ink.shape(ellipse(at, 7 * size, 5 * size, 15), colour, { outline: 3.4, off: 1.2 });
  ink.line(`M ${fmt(add(at, [4 * size, 3 * size]))} l 3 2`, { width: 2 });
}

/** A standing tree trunk's near side, cut into at `bite` height: only the few units of bark the frame shows at its right edge. */
export function drawTrunkEdge(ink, x, { bite = 44, width = 14 } = {}) {
  const pts = [[x, -2], [x + width, -2], [x + width, 150], [x, 150]];
  ink.shape(poly(pts), '#6e4a2c', { outline: 3.2, off: 2 });
  ink.shape(poly([[x - 0.5, bite - 5], [x + 6, bite], [x - 0.5, bite + 4]]), PALETTE.endGrain, { shade: false, outline: 2 });
}

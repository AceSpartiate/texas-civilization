// Props for area A's people at work and at their ease (docs/CLAUDE_ART_PLAN.md, area A): the things in their hands and the
// things they sit on or work at, drawn in rig units (y up, the ground at 0, +x the way the figure faces; a grown figure 100
// tall), so a pose can place them exactly where its hands are. Texas 1835 things only (HIST-GONZ-027/028): a stool, a
// clasp knife, harness leather and an awl, needle and cloth, an ear of corn and a split basket, a long rifle, a clay pipe,
// cards, a washtub and board, a broom, wooden buckets, a shaving horse, a drawknife and an auger, a plank table, a mallet
// and a stake, a cane pole, a small fire. Nothing is ever pointed at a person, and nothing is bloody.
//
// ceiling: flat shapes in the kit's line and shade, a size or two simpler than Astra's props; they are there so the pose reads
// at play size (a person about 40 px), and her frame of the same name replaces the whole drawing.
import { LINE, PALETTE, tone } from './style.mjs';
import { add, sub, mul, norm, perp, lerp, len, capsule, blob, curve, poly, ellipse, f2 } from './svg.mjs';

const P = p => `${f2(p[0])} ${f2(p[1])}`;
export const WOOD = { seat: '#7a4f2c', leg: '#5c3a1f', plank: '#9a6c3e', pale: '#c8a36c', dark: '#4e3019' };

/** A low three-legged stool with its seat top at `top`, centred at x `cx` (Astra's seated `-repair` and `-rest` sit on one). */
export function drawStool(ink, cx, top, { width = 15, colour = WOOD.seat } = {}) {
  const half = width / 2, t = 2.8;
  // The far leg first, darker; then the seat; then the two near legs splayed out.
  ink.shape(capsule([cx + 1, top - t], [cx + 2.2, 0.6], 1.3, 1.2), tone(WOOD.leg, -0.2), { off: 0.4 });
  ink.shape(capsule([cx - half + 2.5, top - t], [cx - half + 0.5, 0.6], 1.4, 1.3), WOOD.leg, { off: 0.4 });
  ink.shape(capsule([cx + half - 2.5, top - t], [cx + half - 0.3, 0.6], 1.4, 1.3), WOOD.leg, { off: 0.4 });
  ink.shape(blob([[cx - half, top - t], [cx - half - 0.4, top - 0.6], [cx - half + 1, top + 0.9], [cx + half - 1, top + 0.9], [cx + half + 0.4, top - 0.6], [cx + half, top - t]], 0.5), colour, { off: 0.8 });
  ink.line(`M ${P([cx - half + 1, top - 0.4])} L ${P([cx + half - 1, top - 0.4])}`, { width: LINE.fine, colour: tone(colour, 0.3), opacity: 0.7 });
}

/** A clasp knife in `hand`, its blade pointing along `dir`. */
export function drawKnife(ink, hand, dir, { blade = 6 } = {}) {
  const d = norm(dir), n = perp(d);
  ink.shape(capsule(add(hand, mul(d, -1.8)), add(hand, mul(d, 1.2)), 0.9, 0.9), WOOD.dark, { shade: false, outline: 2.2 });
  const a = add(hand, mul(d, 1.2)), b = add(hand, mul(d, 1.2 + blade));
  ink.shape(poly([add(a, mul(n, 0.8)), add(b, mul(n, 0.2)), add(a, mul(n, -0.8))]), PALETTE.ironLight, { shade: false, outline: 2 });
}

/** A stick being whittled, from the hand that holds it to its point; pale where it is cut. */
export function drawStick(ink, from, to, { cut = 0.5 } = {}) {
  ink.shape(capsule(from, to, 1.1, 0.8), '#8a6a40', { off: 0.4, outline: 2.6 });
  ink.shape(capsule(lerp(from, to, cut), to, 0.8, 0.55), PALETTE.endGrain, { shade: false, outline: 1.8 });
}

/** A curl of shaving at `p`, `k` its size. */
export function drawCurl(ink, p, k = 1, colour = '#ecd9a8') {
  ink.shape(blob([add(p, [-1.2 * k, 0.6 * k]), add(p, [0.2 * k, 1.5 * k]), add(p, [1.4 * k, 0.4 * k]), add(p, [0.6 * k, -0.9 * k]), add(p, [-0.6 * k, -0.6 * k])], 1), colour, { shade: false, outline: 1.8 });
  ink.line(curve([add(p, [-0.4 * k, 0.2 * k]), add(p, [0.3 * k, 0.6 * k]), add(p, [0.5 * k, -0.1 * k])]), { width: 1.2 });
}

/** Harness leather laid over the knees and hanging down both sides, a buckle on it. `knee` is the near knee. */
export function drawHarness(ink, knee, hip) {
  const top = [add(hip, [2, 4]), add(knee, [0, 3.5])];
  const band = [add(hip, [-1, 3]), add(lerp(hip, knee, 0.5), [0, 5]), add(knee, [2.5, 3.8]), add(knee, [5.5, -3]), add(knee, [5, -12]), add(knee, [3, -12]), add(knee, [2.8, -3]), add(knee, [0, 1.2]), add(lerp(hip, knee, 0.5), [0, 2.3]), add(hip, [-1.5, 0.5])];
  ink.shape(blob(band, 0.55), '#5a3620', { off: 0.8, outline: 3 });
  ink.shape(ellipse(add(knee, [4.2, -7]), 1.8, 1.4), '#b09050', { shade: false, outline: 1.8 });
  ink.line(curve([add(hip, [0, 2]), add(lerp(hip, knee, 0.5), [0, 3.6]), add(knee, [2, 2.4])]), { width: 1.2, colour: '#c89a60', opacity: 0.8 });
  return top;
}
/** An awl in the hand, the waxed thread from it back to `to`. */
export function drawAwl(ink, hand, dir, to) {
  const d = norm(dir);
  ink.shape(ellipse(hand, 1.5, 1.2), WOOD.pale, { shade: false, outline: 2 });
  ink.line(`M ${P(add(hand, mul(d, 1)))} L ${P(add(hand, mul(d, 4.5)))}`, { width: 1.8, colour: PALETTE.iron });
  if (to) ink.line(curve([hand, lerp(hand, to, 0.5), to]), { width: 1, colour: '#e8dcc0' });
}

/** Cloth in the lap for sewing: a cream piece lying over the thighs and falling past the knee. */
export function drawCloth(ink, hip, knee, { colour = '#ece0c6' } = {}) {
  const pts = [add(hip, [1, 5]), add(knee, [0, 5.5]), add(knee, [4.5, 2]), add(knee, [5, -6]), add(knee, [1, -7]), add(knee, [-1, 0]), add(hip, [2, 1])];
  ink.shape(blob(pts, 0.6), colour, { off: 1, outline: 3 });
  ink.line(curve([add(knee, [3, 1]), add(knee, [3.5, -4])]), { width: 1.2, opacity: 0.5 });
}

/** An ear of corn from `a` to `b`, in its pulled-back husk. */
export function drawEar(ink, a, b, { husk = true } = {}) {
  const d = norm(sub(b, a)), n = perp(d), l = len(sub(b, a));
  if (husk) {
    ink.shape(poly([add(a, mul(n, 1.5)), add(add(a, mul(d, -4)), mul(n, 3.5)), add(a, mul(d, -2.5))]), '#b8b060', { shade: false, outline: 1.8 });
    ink.shape(poly([add(a, mul(n, -1.5)), add(add(a, mul(d, -4.5)), mul(n, -3)), add(a, mul(d, -2))]), '#a8a050', { shade: false, outline: 1.8 });
  }
  ink.shape(capsule(a, b, 1.9, 1.3), '#e8b83a', { off: 0.5, outline: 2.4 });
  for (let i = 1; i < 4; i++) ink.line(`M ${P(add(lerp(a, b, i / 4), mul(n, 1.5)))} L ${P(add(lerp(a, b, i / 4), mul(n, -1.5)))}`, { width: 0.9, colour: '#b07f20', opacity: 0.8 });
  return l;
}

/** A split-oak basket on the ground at `base` (its bottom centre), `w` wide; `fill` what shows in it. */
export function drawBasket(ink, base, { w = 13, h = 8, fill = null } = {}) {
  const [x, y] = base;
  if (fill) ink.shape(ellipse([x, y + h + 0.2], w * 0.46, 1.8), fill, { shade: false, outline: 1.6 });
  ink.shape(poly([[x - w / 2, y + h], [x + w / 2, y + h], [x + w * 0.4, y], [x - w * 0.4, y]]), '#b8904e', { off: 0.8, outline: 3 });
  for (let i = 1; i < 3; i++) ink.line(`M ${P([x - w * (0.5 - 0.03 * i), y + h * (1 - i / 3)])} L ${P([x + w * (0.5 - 0.03 * i), y + h * (1 - i / 3)])}`, { width: 1.1, colour: '#7a5a2a' });
  ink.shape(ellipse([x, y + h], w / 2, 1.6), '#a07a40', { shade: false, outline: 2.2 });
  if (fill) ink.shape(ellipse([x, y + h + 0.4], w * 0.42, 1.2), fill, { shade: false, outline: 1.2 });
}

/** A long rifle from `butt` to `muzzle`, as the kit's (props.mjs drawRifle), with `side` the lock's side. */
export function drawLongRifle(ink, butt, muzzle, side = -1) {
  const d = norm(sub(muzzle, butt)), n = mul(perp(d), side), L = len(sub(muzzle, butt));
  const lock = add(butt, mul(d, L * 0.3));
  ink.shape(poly([add(butt, mul(n, 3.4)), add(lock, mul(n, 1.3)), add(add(lock, mul(d, 4)), mul(n, 1.1)), add(add(lock, mul(d, 4)), mul(n, -1.2)), add(lock, mul(n, -1.8)), add(butt, mul(n, -2.2))]), '#6b4424', { outline: 3, off: 0.6 });
  ink.shape(capsule(add(lock, mul(d, 2)), muzzle, 0.75, 0.6), '#4a4640', { shade: false, outline: 2.6 });
  ink.shape(capsule(add(lock, mul(d, 2)), add(muzzle, mul(d, -8)), 0.9, 0.8), '#7a5030', { shade: false, outline: 2.4 });
  ink.line(`M ${P(add(butt, mul(n, 3.2)))} L ${P(add(butt, mul(n, -2)))}`, { colour: '#c8a040', width: 2.4 });
  return { lock, d, n };
}
/** A rag in the hand (a cleaning rag, a dish cloth). */
export function drawRag(ink, hand, colour = '#e6d8b8') {
  ink.shape(blob([add(hand, [-2, 1.2]), add(hand, [0.5, 2.4]), add(hand, [2.6, 0.6]), add(hand, [1.4, -1.8]), add(hand, [-1.4, -1.5])], 1), colour, { off: 0.5, outline: 2.2 });
}
/** A ramrod lying from `a` to `b`. */
export function drawRod(ink, a, b) { ink.shape(capsule(a, b, 0.5, 0.45), '#9a7a50', { shade: false, outline: 1.8 }); }

/** A clay pipe held at `hand`, the stem to `mouth`; `smoke` a small grey wisp over the bowl. */
export function drawPipe(ink, hand, mouth, { smoke = false } = {}) {
  const bowl = add(hand, [1.6, 1]);
  ink.line(`M ${P(bowl)} L ${P(mouth)}`, { width: 2.6, colour: LINE.ink });
  ink.line(`M ${P(bowl)} L ${P(mouth)}`, { width: 1.2, colour: '#e8e0d0' });
  ink.shape(poly([add(bowl, [-1.3, 0]), add(bowl, [1.3, 0]), add(bowl, [1, 2.6]), add(bowl, [-1, 2.6])]), '#e2d8c4', { shade: false, outline: 2 });
  if (smoke) wisp(ink, add(bowl, [0.5, 3.5]), 1);
}
/** A soft grey wisp of smoke rising from `p`. */
export function wisp(ink, p, k = 1, opacity = 0.75) {
  ink.dot(blob([add(p, [-1.2 * k, 0]), add(p, [-1.6 * k, 2.4 * k]), add(p, [-0.2 * k, 4.5 * k]), add(p, [1.4 * k, 6.5 * k]), add(p, [2.2 * k, 5 * k]), add(p, [0.8 * k, 2.8 * k]), add(p, [1.2 * k, 0.6 * k])], 1), '#d8d4ca', opacity);
}

/** A fan of playing cards held at `hand`, their backs to us, turned by `a` degrees. */
export function drawCards(ink, hand, { n = 4, a = 60, spread = 14 } = {}) {
  for (let i = 0; i < n; i++) {
    const t = (a - spread / 2 + (spread * i) / (n - 1)) * Math.PI / 180, d = [Math.cos(t), Math.sin(t)], m = perp(d);
    const c = add(hand, mul(d, 2.6));
    const pts = [add(add(c, mul(d, -2.6)), mul(m, -1.5)), add(add(c, mul(d, 2.6)), mul(m, -1.5)), add(add(c, mul(d, 2.6)), mul(m, 1.5)), add(add(c, mul(d, -2.6)), mul(m, 1.5))];
    ink.shape(poly(pts), i === n - 1 ? '#f4ecd8' : '#e8dcc0', { shade: false, outline: 1.6 });
  }
}
/** One card laid down, flat on something at `p`. */
export function drawCardDown(ink, p) { ink.shape(poly([add(p, [-2.4, -0.6]), add(p, [2.4, -0.6]), add(p, [2.8, 0.8]), add(p, [-2, 0.8])]), '#f4ecd8', { shade: false, outline: 1.6 }); }

/** A needle in the hand and the thread from it down to the cloth at `to`. */
export function drawNeedle(ink, hand, to) {
  ink.line(`M ${P(add(hand, [0.4, 0.4]))} L ${P(add(hand, [2.2, 2.6]))}`, { width: 1.2, colour: PALETTE.iron });
  ink.line(curve([add(hand, [0.2, 0.2]), lerp(hand, to, 0.55), to]), { width: 0.9, colour: '#f2ead8' });
}

/** A wooden washtub with a board standing in it, as the prop `washtub` draws it, at rig scale: `base` the bottom's centre. */
export function drawTubInRig(ink, base, { w = 22, h = 9 } = {}) {
  const [x, y] = base;
  ink.shape(poly([[x - w / 2, y + h], [x + w / 2, y + h], [x + w * 0.42, y], [x - w * 0.42, y]]), '#9a6a3c', { off: 1, outline: 3 });
  ink.shape(ellipse([x, y + h], w / 2, 2.4), '#7a9aa2', { shade: false, outline: 2.6 });
  ink.line(`M ${P([x - w * 0.47, y + h * 0.35])} L ${P([x + w * 0.47, y + h * 0.35])}`, { width: 2, colour: PALETTE.iron });
}

/** A broom's head at the end of `tip`, as TOOLS.broom, with dust flicked up when `dust`. */
export function drawDust(ink, p, k = 1, opacity = 0.6) {
  for (const [dx, dy, r] of [[0, 1.5, 2.4], [2.6, 2.6, 1.9], [-2.2, 2.2, 1.6], [4.4, 1, 1.4]]) ink.dot(ellipse(add(p, [dx * k, dy * k]), r * k, r * 0.75 * k), '#cdb88e', opacity);
}

/** A short stake driven into the ground at `x`, standing `h` out of it. */
export function drawStake(ink, x, h, { y = 0 } = {}) {
  ink.shape(poly([[x - 1.3, y + h], [x + 1.3, y + h], [x + 1.1, y + 0.8], [x, y - 1.2], [x - 1.1, y + 0.8]]), '#b89060', { off: 0.5, outline: 2.6 });
  ink.shape(ellipse([x, y + h], 1.3, 0.6), PALETTE.endGrain, { shade: false, outline: 1.6 });
  ink.dot(ellipse([x + 0.3, y - 0.2], 3.2, 0.9), '#5a4a30', 0.35);
}

/** A small cooking fire on the ground at `base`: a few sticks crossed, the flames `k` tall (0.6 low .. 1.4 blown up). */
export function drawSmallFire(ink, base, { k = 1, stick = null } = {}) {
  const [x, y] = base;
  // Stones round it, then the sticks, then the flame.
  for (const [dx, r] of [[-6.5, 1.8], [-3, 1.5], [3.4, 1.6], [6.8, 1.9]]) ink.shape(ellipse([x + dx, y + 0.6], r, r * 0.7), '#8a8478', { off: 0.4, outline: 2 });
  ink.shape(capsule([x - 5, y + 0.8], [x + 4, y + 2.6], 0.9, 0.8), '#6a4424', { shade: false, outline: 2 });
  ink.shape(capsule([x + 5, y + 0.6], [x - 3.5, y + 2.8], 0.9, 0.8), '#5a3a20', { shade: false, outline: 2 });
  if (stick) ink.shape(capsule(stick[0], stick[1], 0.8, 0.7), '#7a5230', { shade: false, outline: 2 });
  const f = (c, s, col) => ink.shape(blob([[x - 3.6 * s, y + 1.5], [x - 2.2 * s, y + 5 * c], [x - 0.6 * s, y + 7.6 * c], [x + 0.5 * s, y + 11 * c], [x + 1.6 * s, y + 7 * c], [x + 3.4 * s, y + 4.4 * c], [x + 3.2 * s, y + 1.5]], 0.9), col, { shade: false, outline: s > 0.8 ? 2.4 : 0 });
  f(k, 1, '#e8862c');
  f(k * 0.72, 0.62, '#f6c24a');
  f(k * 0.4, 0.34, '#fff0b0');
}

/** A cloth-wrapped joint of meat lying at `c` (never a carcass, never blood): a bundle tied with string. */
export function drawJoint(ink, c, { w = 11, h = 5.5 } = {}) {
  ink.shape(blob([add(c, [-w / 2, 0]), add(c, [-w / 2 + 1, h]), add(c, [w / 2 - 2, h + 0.6]), add(c, [w / 2 + 1, h * 0.4]), add(c, [w / 2 - 1, -0.3])], 0.8), '#e8dcc4', { off: 0.8, outline: 2.8 });
  for (const t of [0.3, 0.68]) ink.line(`M ${P(add(c, [-w / 2 + w * t, -0.2]))} L ${P(add(c, [-w / 2 + w * t + 0.8, h + 0.4]))}`, { width: 1.4, colour: '#8a6a44' });
}
/** A plank table: the top at `top`, from x `x0` to `x1`, trestle legs to the ground. */
export function drawTable(ink, x0, x1, top, { layer = 'all' } = {}) {
  if (layer !== 'front') {
    ink.shape(capsule([x1 - 3, top - 2], [x1 - 1.5, 0.4], 1.3, 1.2), tone(WOOD.leg, -0.2), { off: 0.4 });
    ink.shape(capsule([x0 + 4, top - 2], [x0 + 5.5, 0.4], 1.3, 1.2), tone(WOOD.leg, -0.2), { off: 0.4 });
  }
  if (layer !== 'back') {
    ink.shape(poly([[x0, top], [x1, top], [x1 + 1.5, top + 3.4], [x0 + 1.5, top + 3.4]]), WOOD.plank, { off: 0.8, outline: 3 });
    ink.shape(poly([[x0, top], [x1, top], [x1, top - 2.2], [x0, top - 2.2]]), tone(WOOD.plank, -0.25), { shade: false, outline: 2.6 });
    ink.shape(capsule([x0 + 3, top - 2], [x0 + 1.5, 0.4], 1.4, 1.3), WOOD.leg, { off: 0.4 });
    ink.shape(capsule([x1 - 4, top - 2], [x1 - 2.5, 0.4], 1.4, 1.3), WOOD.leg, { off: 0.4 });
  }
}

/** A wall log lying east-west from x `x0` to `x1` with its centre at height `cy`, `r` its radius; `notch` cuts a saddle at x0. */
export function drawWallLog(ink, x0, x1, cy, r, { notch = 0, end = 'cut', colour = PALETTE.wood } = {}) {
  const top = cy + r, bot = cy - r;
  const body = notch
    ? [[x0 + 0.5, bot], [x1, bot], [x1, top], [x0 + 3 + notch * 2.2, top], [x0 + 2 + notch * 1.4, top - notch], [x0 + 1 + notch * 0.4, top - notch * 0.5], [x0, top]]
    : [[x0, bot], [x1, bot], [x1, top], [x0, top]];
  ink.shape(poly(body), colour, { off: 1.2, lift: true });
  ink.line(`M ${P([x0 + 5, cy + r * 0.3])} L ${P([x1 - 3, cy + r * 0.25])}`, { width: LINE.fine, colour: tone(colour, -0.4), opacity: 0.7 });
  ink.line(`M ${P([x0 + 9, cy - r * 0.4])} L ${P([x1 - 6, cy - r * 0.45])}`, { width: LINE.fine, colour: tone(colour, -0.4), opacity: 0.7 });
  if (notch) ink.shape(poly([[x0 + 2 + notch * 1.4, top - notch], [x0 + 3 + notch * 2.2, top], [x0 + 1 + notch * 0.4, top - notch * 0.5]]), PALETTE.endGrain, { shade: false, outline: 1.6 });
  // The cut end facing us, three-quarter: an upright ellipse of end grain.
  ink.shape(ellipse([x0, cy], r * 0.5, r), PALETTE.endGrain, { off: 0.6, outline: LINE.inner + 0.6 });
  ink.line(ellipse([x0, cy], r * 0.28, r * 0.6), { width: LINE.fine, colour: tone(PALETTE.endGrain, -0.35), opacity: 0.8 });
  if (end === 'rough') ink.shape(ellipse([x1, cy], r * 0.45, r), tone(PALETTE.endGrain, -0.08), { shade: false, outline: LINE.inner });
}

/** A felling axe's head on a straight haft from `butt` to `tip`, bit to `side` (props.mjs drawTool's axe, repeated so a pose can draw it in front). */
export function drawLogOnGround(ink, x0, x1, r, { y = 0, colour = PALETTE.wood } = {}) {
  drawWallLog(ink, x0, x1, y + r, r, { colour, end: 'rough' });
}

/** A wedge standing in a log's top at `p` (its top edge), `k` its size. */
export function drawWedge(ink, p, k = 1) {
  ink.shape(poly([add(p, [-1.8 * k, 0]), add(p, [1.8 * k, 0]), add(p, [0.6 * k, -4.4 * k]), add(p, [-0.6 * k, -4.4 * k])]), PALETTE.iron, { off: 0.4, outline: 2.4 });
  ink.line(`M ${P(add(p, [-1.4 * k, -0.4]))} L ${P(add(p, [1.4 * k, -0.4]))}`, { width: 1.2, colour: PALETTE.ironLight });
}

/** The shaving horse: a low bench with a pivoting head over the work, `seatX` where the rider sits, `front` its far end. */
export function drawShavingHorse(ink, seatX, seatTop, front, { layer = 'back', clamp = 0 } = {}) {
  const benchTop = seatTop, rise = 7;
  if (layer === 'back') {
    // Far legs, the bench, and the ramp the work lies on, rising toward the front.
    ink.shape(capsule([seatX - 4, benchTop - 2], [seatX - 7, 0.5], 1.3, 1.2), tone(WOOD.leg, -0.2), { off: 0.4 });
    ink.shape(capsule([front - 3, benchTop - 2], [front, 0.5], 1.3, 1.2), tone(WOOD.leg, -0.2), { off: 0.4 });
    ink.shape(poly([[seatX - 9, benchTop], [front + 2, benchTop], [front + 2, benchTop - 3], [seatX - 9, benchTop - 3]]), WOOD.plank, { off: 0.8, outline: 3 });
    ink.shape(poly([[seatX + 8, benchTop], [front, benchTop + rise], [front + 1.5, benchTop + rise - 2.2], [seatX + 11, benchTop]]), tone(WOOD.plank, -0.1), { off: 0.6, outline: 2.6 });
    // The near legs.
    ink.shape(capsule([seatX - 6, benchTop - 2], [seatX - 9, 0.5], 1.4, 1.3), WOOD.leg, { off: 0.4 });
    ink.shape(capsule([front - 1, benchTop - 2], [front + 2.5, 0.5], 1.4, 1.3), WOOD.leg, { off: 0.4 });
    return;
  }
  // The head: an upright arm through the bench, its top block pressing the work, its foot the treadle under the feet.
  const pivot = [front - 7, benchTop - 1.5], head = [front - 5 + clamp, benchTop + rise + 4], foot = [front - 10 - clamp, 4];
  ink.shape(capsule(foot, head, 1.2, 1.2), tone(WOOD.plank, -0.2), { off: 0.4, outline: 2.6 });
  ink.shape(capsule(add(head, [-3, 0.5]), add(head, [3, -0.5]), 1.4, 1.4), tone(WOOD.plank, -0.2), { off: 0.4, outline: 2.6 });
  ink.shape(capsule(add(foot, [-2.5, 0]), add(foot, [2.5, 0]), 1, 1), tone(WOOD.plank, -0.2), { off: 0.3, outline: 2.4 });
  ink.dot(ellipse(pivot, 0.8, 0.8), LINE.ink);
}
/** A drawknife held in both hands at `a` (near) and `b` (far): a blade between two handles. */
export function drawDrawknife(ink, a, b) {
  const d = norm(sub(b, a)), n = perp(d);
  ink.shape(poly([add(a, mul(n, -0.4)), add(b, mul(n, -0.4)), add(b, mul(n, -2.4)), add(a, mul(n, -2.4))]), PALETTE.iron, { off: 0.3, outline: 2.2 });
  ink.line(`M ${P(add(a, mul(n, -2.2)))} L ${P(add(b, mul(n, -2.2)))}`, { width: 1, colour: PALETTE.ironLight });
}
/** An auger standing on the work: the shaft down from the T handle held at `top`. */
export function drawAuger(ink, top, bottom, turn = 0) {
  const d = norm(sub(bottom, top));
  ink.shape(capsule(top, bottom, 0.7, 0.55), PALETTE.iron, { shade: false, outline: 2.2 });
  for (let i = 1; i < 3; i++) ink.line(`M ${P(add(lerp(top, bottom, 0.6 + i * 0.12), [-1, 0.3]))} L ${P(add(lerp(top, bottom, 0.6 + i * 0.12), [1, -0.3]))}`, { width: 1, colour: PALETTE.ironLight });
  const w = 7 * Math.cos(turn), h = 1.2 * Math.sin(turn);
  ink.shape(capsule(add(top, [-w, -h]), add(top, [w, h]), 1.1, 1.1), WOOD.pale, { off: 0.3, outline: 2.4 });
}

/** A sack slung at the hip on a strap across the body: `hip` its mouth. */
export function drawHipSack(ink, hip, shoulder, { full = 0.5 } = {}) {
  ink.line(curve([shoulder, lerp(shoulder, hip, 0.5), hip]), { width: 3.2, colour: '#6a4a2a' });
  const s = 1 + full * 0.4;
  ink.shape(blob([add(hip, [-4 * s, 0]), add(hip, [-5 * s, -6 * s]), add(hip, [-1, -9 * s]), add(hip, [3.5 * s, -7 * s]), add(hip, [4 * s, 0.5])], 0.9), '#cdb48a', { off: 1, outline: 3 });
  ink.shape(ellipse(add(hip, [0, 0.3]), 4 * s, 1.2), '#8a7040', { shade: false, outline: 1.8 });
}
/** A basket carried on the arm at `hand` (the handle over the forearm). */
export function drawArmBasket(ink, hand, { w = 11, fill = null } = {}) {
  ink.line(`M ${P(add(hand, [-w * 0.42, -3]))} Q ${P(add(hand, [0, 4]))} ${P(add(hand, [w * 0.42, -3]))}`, { width: 2.2, colour: '#8a6a3a' });
  drawBasket(ink, add(hand, [0, -10]), { w, h: 7, fill });
}

/** A cane pole from `butt` to `tip`, the line down to a float at `float`. */
export function drawCanePole(ink, butt, tip, float) {
  ink.shape(capsule(butt, tip, 0.9, 0.35), '#c8ae6a', { shade: false, outline: 2.2 });
  for (const t of [0.3, 0.55, 0.78]) { const p = lerp(butt, tip, t), n = perp(norm(sub(tip, butt))); ink.line(`M ${P(add(p, mul(n, 0.9)))} L ${P(add(p, mul(n, -0.9)))}`, { width: 1, colour: '#8a7040' }); }
  ink.line(curve([tip, add(lerp(tip, float, 0.5), [0.6, 0]), float]), { width: 0.9, colour: '#3a3024', opacity: 0.85 });
  ink.shape(ellipse(float, 1.2, 1.6), '#c0442c', { shade: false, outline: 1.6 });
  ink.dot(ellipse(add(float, [0, 1]), 1.0, 0.6), '#f4ecd8');
}
/** The bank's edge and a little water in front of somebody fishing: `x0`..`x1` at the ground. */
export function drawWaterEdge(ink, x0, x1, y = -3) {
  ink.dot(blob([[x0, y + 1], [x0 + 4, y + 2.2], [x1 - 4, y + 2], [x1, y + 0.6], [x1 - 3, y - 2], [x0 + 3, y - 2]], 0.8), '#6f8f96', 0.9);
  ink.line(curve([[x0 + 2, y + 1.6], [(x0 + x1) / 2, y + 2.4], [x1 - 2, y + 1.4]]), { width: 1.2, colour: '#d8e6e6', opacity: 0.7 });
}

/** A full straw broom head at the end of a haft (`tip`, the haft running along `dir`), splayed and bound. */
export function drawBroomHead(ink, tip, dir, k = 1) {
  const d = norm(dir), n = perp(d), a = add(tip, mul(d, -1)), b = add(tip, mul(d, 11 * k));
  ink.shape(poly([add(a, mul(n, 2.2 * k)), add(b, mul(n, 5.5 * k)), add(add(b, mul(d, 0.6)), mul(n, 0)), add(b, mul(n, -5.5 * k)), add(a, mul(n, -2.2 * k))]), '#c9a650', { off: 0.6, outline: 3 });
  for (const t of [-0.5, 0, 0.5]) ink.line(`M ${P(add(add(a, mul(d, 3 * k)), mul(n, t * 2.4 * k)))} L ${P(add(b, mul(n, t * 5 * k)))}`, { width: 1, colour: '#8a6a2a', opacity: 0.7 });
  ink.line(`M ${P(add(add(a, mul(d, 2.5 * k)), mul(n, 2.6 * k)))} L ${P(add(add(a, mul(d, 2.5 * k)), mul(n, -2.6 * k)))}`, { width: 2, colour: '#7a3a22' });
}

/** A tin cup raised in the hand. */
export function drawCup(ink, hand) { ink.shape(poly([add(hand, [0.5, -1.5]), add(hand, [4, -1.5]), add(hand, [3.6, 2.8]), add(hand, [0.9, 2.8])]), '#9aa0a0', { shade: false, outline: 2 }); }
/** An iron pot standing in the fire at `base` (its bottom). */
export function drawPot(ink, base, k = 1) {
  const [x, y] = base;
  ink.shape(blob([[x - 5 * k, y + 6 * k], [x - 5.5 * k, y + 2 * k], [x - 3 * k, y], [x + 3 * k, y], [x + 5.5 * k, y + 2 * k], [x + 5 * k, y + 6 * k]], 0.7), '#3a3834', { off: 0.8, outline: 3 });
  ink.shape(ellipse([x, y + 6 * k], 5 * k, 1.4 * k), '#6a5a40', { shade: false, outline: 2 });
}
/** A long wooden spoon from the hand into the pot. */
export function drawSpoon(ink, hand, bowl) { ink.shape(capsule(hand, bowl, 0.6, 0.5), WOOD.pale, { shade: false, outline: 1.8 }); }

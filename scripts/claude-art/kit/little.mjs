// Area B's own pieces of the kit (docs/CLAUDE_ART_PLAN.md, B - children, babies and sickness): the children's poses at play
// and at their work, the baby drawn on its own and in somebody's arms, and a person lying sick under a blanket. Kept in its
// own file so the shared rig (rig.mjs, poses.mjs, head.mjs) is untouched by this area; everything here is drawn through the
// rig's `drawPerson` and `drawHeadSide`/`drawHeadFrontal`, so a child keeps Astra's child proportions as `BUILD.child` and
// `BUILD.small` measure them (a head a third of the height) and every figure its own face, hair and clothes.
//
// Units are the rig's: y up, the ground at 0, a figure 100 from the ground to the top of the head, +x forward (east). A pose
// here is a list of frames of joint targets, as in poses.mjs; `g` scales a grown figure's numbers to the figure's own size.
//
// ceiling: the baby is a small drawing of its own (a gown or swaddle, a round head, a little dark hair), not the rig; at play
// size (a baby about 18 px) it reads as a baby by its shape and its cream wrap, closer up it is plainly simpler than
// Astra's painted infant. Her `infant-*` frames of the same names replace it.
import { CAST, LINE, tone } from './style.mjs';
import { Ink, add, sub, mul, lerp, capsule, blob, curve, ellipse, up, f2, poly } from './svg.mjs';
import { drawPerson, frameOf, ik } from './rig.mjs';
import { drawHeadSide, drawHeadFrontal } from './head.mjs';
import { drawBucket } from './props.mjs';

export const g = F => F.hip / 39;
/**
 * The rig's children stand about 89 (girl, boy) and 93 (small child) of its 100 units, so drawn on the people contract they
 * came out about a tenth shorter than Astra's children (measured 2026-09-28 on her idle frames: the girl 0.94 of her logical
 * height, the boy 0.93, the small child 0.93; the rig's 0.84, 0.86, 0.88). A child frame is drawn this much larger
 * (personFrame's `scale`) so it stands as tall as hers before the renderer shrinks it by age.
 */
export const CHILD_SCALE = Object.freeze({ girl: 1.11, boy: 1.08, smallchild: 1.06 });
export const P = (F, dx = 0, dy = 0) => [dx * g(F), F.hip + dy * g(F)];
export const foot = (F, x, lift = 0) => [x * g(F), F.ankle + lift * g(F)];
/** A point relative to the standing figure's shoulder height, as poses.mjs `at`. */
export const at = (F, x, y) => [x * g(F), F.neck - 3 + y * g(F)];
const armOf = F => F.B.upperArm + F.B.forearm;

/** Where the side view puts the head's centre, the neck and the near shoulder for a pose (the same sums as rig.mjs drawSide). */
export function sideJoints(F, pose) {
  const Pv = pose.pelvis || [0, F.hip], lean = pose.lean || 0, tilt = pose.tilt || 0;
  const N = add(Pv, mul(up(lean), F.B.torso));
  const H = add(N, mul(up(lean + tilt), F.B.neck + F.B.head * 0.95));
  const fwd = [Math.cos(lean * Math.PI / 180), -Math.sin(lean * Math.PI / 180)];
  const S = add(add(N, mul(up(lean), -3)), mul(fwd, 0.5));
  return { P: Pv, N, H, S, a: lean + tilt };
}
/** The frontal shoulders (rig.mjs drawFrontal): side -1 is screen left. */
export function frontalShoulder(F, pose, side) {
  const Pv = pose.pelvis || [0, F.hip], N = add(Pv, [0, F.B.torso]);
  return add(N, [side * F.B.shoulderW * 0.5 * F.B.body * 0.92, -3]);
}

/** A group drawn by `draw` into its own ink and set into `ink` under `transform`; `scale` keeps its outlines their width. */
export function nest(ink, tag, transform, scale, draw, { yUp = ink.yUp } = {}) {
  const inner = new Ink(`${ink.prefix}-${tag}`, ink.k * scale, { yUp, shadeOffset: ink.shadeOffset });
  const out = draw(inner);
  ink.defs.push(...inner.defs);
  ink.raw(`<g transform="${transform}">${inner}</g>`);
  return out;
}

/** Close the eyes of a side-view head drawn with `drawHeadSide` at H, turned `a` degrees: skin over the eye, a lid's curve. */
export function closeEyeSide(ink, spec, B, H, a) {
  const h = B.head, c = Math.cos(-a * Math.PI / 180), s = Math.sin(-a * Math.PI / 180);
  const R = (x, y) => add(H, [x * h * c - y * h * s, x * h * s + y * h * c]);
  ink.dot(ellipse(R(0.58, 0.04), h * 0.17, h * 0.24, a), spec.skin);
  ink.line(curve([R(0.44, 0.02), R(0.58, -0.07), R(0.72, 0.0)]), { width: LINE.inner, colour: LINE.ink });
}
export function closeEyesFrontal(ink, spec, B, H) {
  const h = B.head, R = (x, y) => add(H, [x * h, y * h]);
  for (const side of [-1, 1]) {
    ink.dot(ellipse(R(side * 0.38, -0.01), h * 0.18, h * 0.24), spec.skin);
    ink.line(curve([R(side * 0.38 - 0.2, 0.0), R(side * 0.38, -0.1), R(side * 0.38 + 0.2, 0.0)]), { width: LINE.inner, colour: LINE.ink });
  }
}

/** An arm (the rig's side-view arm) drawn again over something held against the body: the elbow by IK from the shoulder. */
export function armOver(ink, F, S, hand, { bend = -1, shade = 0 } = {}) {
  const { spec, B } = F, r = B.limb * 0.5;
  const sleeve = tone(spec.coat || spec.shirt, shade), skin = tone(spec.skin, shade);
  const { joint: E, end: W } = ik(S, hand, B.upperArm, B.forearm, bend);
  ink.shape(capsule(E, W, r * 0.8, r * 0.7), spec.coat ? sleeve : skin, { off: 0.6 });
  ink.shape(capsule(S, E, r * 1.05, r * 0.9), sleeve, { off: 0.7 });
  if (!spec.coat) ink.shape(ellipse(E, r, r * 0.75, Math.atan2(E[1] - S[1], E[0] - S[0]) * 180 / Math.PI), sleeve, { shade: false, outline: LINE.inner + 0.8 });
  ink.shape(ellipse(W, r * (B.hand ?? 0.85), r * (B.hand ?? 0.85) * 0.94), skin, { off: 0.4 });
}
export const handOver = (ink, F, W) => ink.shape(ellipse(W, F.B.limb * 0.5 * (F.B.hand ?? 0.85), F.B.limb * 0.5 * (F.B.hand ?? 0.85) * 0.94), F.spec.skin, { off: 0.4 });

// ---------------------------------------------------------------------------------------------------------------------
// Props a child carries or plays with, in rig units.
/** A stick horse: a plain stick from `butt` (trailing on the ground) to `top`, a stuffed tan head with a red yarn mane there. */
export function stickHorse(ink, butt, top, s = 1, { bob = 0 } = {}) {
  ink.shape(capsule(butt, top, 0.8 * s, 0.7 * s), '#c8a36c', { outline: 3, off: 0.4 });
  const c = add(top, [2.2 * s, 2.4 * s + bob]);
  ink.shape(blob([add(c, [-3.2 * s, -1.2 * s]), add(c, [-2.8 * s, 3.2 * s]), add(c, [1 * s, 4.4 * s]), add(c, [5.4 * s, 1.4 * s]), add(c, [6.2 * s, -1 * s]), add(c, [3 * s, -1.6 * s]), add(c, [0.5 * s, -3 * s])], 0.8), '#d7b178', { off: 0.6, lift: true });
  ink.shape(blob([add(c, [-3.8 * s, -1.6 * s]), add(c, [-4.2 * s, 2.6 * s]), add(c, [-1.4 * s, 5.4 * s]), add(c, [0.6 * s, 4.6 * s]), add(c, [-1.6 * s, 1 * s])], 0.7), '#a8382a', { off: 0.5 });
  ink.shape(ellipse(add(c, [0.4 * s, 4.6 * s]), 0.9 * s, 1.4 * s, 20), '#b89060', { shade: false, outline: LINE.fine });
  ink.dot(ellipse(add(c, [2.4 * s, 1.4 * s]), 0.55 * s, 0.6 * s), LINE.ink);
  ink.line(curve([add(c, [1.2 * s, -1.6 * s]), add(c, [3.6 * s, 0.2 * s]), add(c, [6 * s, -0.4 * s])]), { width: LINE.fine, colour: '#5a3018' });
}
/** A barrel hoop rolling, seen side on: a ring of radius r at `c`, a nail on its rim at `turn` (0..1) to show it roll. */
export function hoop(ink, c, r, turn = 0) {
  const circle = ellipse(c, r, r);
  ink.line(circle, { width: 7.4, colour: LINE.ink });
  ink.line(circle, { width: 4, colour: '#9b6a3a' });
  ink.line(ellipse(add(c, [-0.3, 0.3]), r, r), { width: 1.4, colour: '#c89a60', opacity: 0.8 });
  const a = -turn * Math.PI * 2 + 2.2;
  ink.dot(ellipse(add(c, [Math.cos(a) * r, Math.sin(a) * r]), 1.1, 1.1), '#3a2a1a');
}
/** A stick for the hoop, from the hand to the rim. */
export function hoopStick(ink, hand, end) { ink.shape(capsule(hand, end, 0.6, 0.5), '#b89060', { outline: 2.6, off: 0.3 }); }
/** A corn-husk doll held upright, its feet at `base`. */
export function doll(ink, base, s = 1) {
  const b = base;
  ink.shape(blob([add(b, [-4 * s, 0]), add(b, [-2.2 * s, 7 * s]), add(b, [0, 8.5 * s]), add(b, [2.2 * s, 7 * s]), add(b, [4 * s, 0])], 0.8), '#e8cf94', { off: 0.8, lift: true });
  for (const side of [-1, 1]) ink.shape(capsule(add(b, [side * 1.6 * s, 8.6 * s]), add(b, [side * 5.4 * s, 5.2 * s]), 0.9 * s, 0.8 * s), '#dcc088', { off: 0.4, outline: LINE.inner });
  ink.shape(ellipse(add(b, [0, 7.5 * s]), 3.4 * s, 1.2 * s), '#a8382a', { shade: false, outline: LINE.inner });
  ink.shape(ellipse(add(b, [0, 11 * s]), 2.6 * s, 2.8 * s), '#ecd7a2', { off: 0.5, lift: true });
  ink.line(curve([add(b, [-1.4 * s, 1.5 * s]), add(b, [-0.6 * s, 5 * s])]), { width: LINE.fine, colour: '#a88a50', opacity: 0.8 });
  ink.line(curve([add(b, [1.4 * s, 1.5 * s]), add(b, [0.6 * s, 5 * s])]), { width: LINE.fine, colour: '#a88a50', opacity: 0.8 });
}
/** A small tin pan of corn held at the waist. */
export function cornPan(ink, c, s = 1) {
  ink.shape(ellipse(c, 5.6 * s, 2 * s), '#8a8e88', { off: 0.5 });
  ink.shape(ellipse(add(c, [0, 0.6 * s]), 4.4 * s, 1.1 * s), '#e2b43a', { shade: false, outline: LINE.fine });
}
/** Kernels flung from a hand: yellow dots along an arc to the ground ahead. */
export function kernels(ink, from, spread = 1) {
  for (let i = 0; i < 9; i++) {
    const t = (i + 1) / 10, x = from[0] + 4 + t * 20 * spread + Math.sin(i * 7.3) * 2, y = Math.max(1.4, from[1] + 3 * t - t * t * (from[1] + 4) + Math.cos(i * 4.1) * 1.4);
    ink.shape(ellipse([x, y], 1.1, 0.9), '#e8c040', { shade: false, outline: LINE.fine });
  }
}
/** A cloth waved in a hand: a kerchief from `hand`, streaming toward `dir`. */
export function cloth(ink, hand, dir, colour = '#c0503a', z = 1) {
  const l = Math.hypot(dir[0], dir[1]) || 1, d = [dir[0] / l, dir[1] / l], n = [-d[1], d[0]];
  const tip = add(hand, mul(d, 11 * z)), mid = add(hand, mul(d, 6 * z));
  ink.shape(blob([hand, add(mid, mul(n, 3.6 * z)), add(tip, mul(n, 1.8 * z)), add(tip, mul(n, -1.2 * z)), add(mid, mul(n, -1.6 * z))], 0.8), colour, { off: 0.6 });
  ink.line(curve([add(hand, mul(n, 0.4)), add(mid, mul(n, 0.8)), add(tip, mul(n, 0.2))]), { width: LINE.fine, colour: tone(colour, -0.35), opacity: 0.7 });
}
/** A small basket carried on the forearm or held at the hip, hanging from `hand`. */
export function basket(ink, hand, s = 1, { full = false } = {}) {
  const top = add(hand, [0, -2.5 * s]);
  ink.line(curve([add(top, [-4.6 * s, 0]), add(hand, [0, 2.2 * s]), add(top, [4.6 * s, 0])]), { width: 2.6, colour: '#5a3a1e' });
  ink.shape(blob([add(top, [-5.2 * s, 0]), add(top, [-4.2 * s, -5.6 * s]), add(top, [0, -6.6 * s]), add(top, [4.2 * s, -5.6 * s]), add(top, [5.2 * s, 0])], 0.7), '#b9894a', { off: 0.8 });
  for (const y of [-2, -4]) ink.line(curve([add(top, [-4.9 * s, y * s]), add(top, [0, (y - 0.8) * s]), add(top, [4.9 * s, y * s])]), { width: LINE.fine, colour: '#6e4a24', opacity: 0.8 });
  if (full) ink.shape(ellipse(add(top, [0, 0.4 * s]), 4.4 * s, 1.4 * s), '#7a5230', { shade: false, outline: LINE.fine });
  ink.shape(ellipse(top, 5.2 * s, 1.4 * s), '#a47842', { shade: false, outline: LINE.inner });
}
/** Three marbles on the ground ahead of a child at marbles. */
export function marbles(ink, x) {
  [['#6b8fb0', 0], ['#c05040', 4.5], ['#e0c060', 8.2]].forEach(([c, dx]) => ink.shape(ellipse([x + dx, 1.5 + (dx % 3) * 0.2], 1.3, 1.2), c, { off: 0.3, outline: LINE.inner, lift: true }));
}

// ---------------------------------------------------------------------------------------------------------------------
// The children's poses (request 2026-09-26, items 1 and 4; request 2026-09-28, people at work, item 13). Each is a function
// of the figure, so the small child's run is the small child's size. East-facing (mirrored for west) unless it ends -s/-n.
export const CHILD_POSES = {
  // Running at tag: a flight step, the chest well forward, the arms pumping wide.
  'play-run': F => {
    const s = F.B.thigh * 1.3;
    return [
      { view: 'e', pelvis: P(F, 1, -3), lean: 20, feet: { near: foot(F, s), far: foot(F, -s * 0.8, 9) }, hands: { near: at(F, -17, -9), far: at(F, 19, 1) }, elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 1, 1.6), lean: 17, feet: { near: foot(F, 4, 4), far: foot(F, -12, 13) }, hands: { near: at(F, -4, -17), far: at(F, 8, -12) }, elbows: { near: 1, far: -1 } },
      { view: 'e', pelvis: P(F, 1, -3), lean: 20, feet: { near: foot(F, -s * 0.8, 9), far: foot(F, s) }, hands: { near: at(F, 19, 1), far: at(F, -17, -9) }, elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 1, 1.6), lean: 17, feet: { near: foot(F, -12, 13), far: foot(F, 4, 4) }, hands: { near: at(F, 8, -12), far: at(F, -4, -17) }, elbows: { near: -1, far: 1 } },
    ];
  },
  'play-run-s': F => runFrontal(F, 's'),
  'play-run-n': F => runFrontal(F, 'n'),
  // A stick horse between the knees, galloping: the lead foot always in front, a skip with both feet off the ground.
  'play-gallop': F => {
    const frame = (dy, lean, near, far, bob) => ({ view: 'e', pelvis: P(F, 0, dy), lean, feet: { near, far }, knees: { near: 1, far: 1 }, hands: { near: at(F, 14, -5 + bob), far: at(F, 12, -3 + bob) }, elbows: { near: -1, far: -1 }, stick: bob });
    return [
      frame(-2.6, 12, foot(F, 14), foot(F, -11, 5), 0),
      frame(2, 7, foot(F, 13, 10), foot(F, -3, 6), 2),
      frame(-1.2, 9, foot(F, 16, 14), foot(F, -3), 1),
      frame(0.8, 10, foot(F, 17, 5), foot(F, -8, 2), 1.4),
    ];
  },
  // Rolling a hoop with a stick: a running step, the stick held out and down to the hoop's rim ahead.
  'play-hoop': F => {
    const s = F.B.thigh * 1.0;
    return [0, 1, 2, 3].map(i => {
      const pass = i % 2 === 1, lead = i < 2 ? 1 : -1;
      return { view: 'e', pelvis: P(F, 0, pass ? 1 : -1.8), lean: 10, feet: pass ? { near: foot(F, lead > 0 ? 2 : -6, lead > 0 ? 3 : 8), far: foot(F, lead > 0 ? -6 : 2, lead > 0 ? 8 : 3) } : { near: foot(F, s * lead * 0.95, lead > 0 ? 0 : 4), far: foot(F, -s * lead * 0.95, lead > 0 ? 4 : 0) },
        hands: { near: at(F, 15, -12 + (pass ? 1 : 0)), far: at(F, -4 * lead, -armOf(F) * 0.62) }, elbows: { near: -1, far: -1 }, hoopTurn: i / 4, hoopDy: pass ? 0.6 : 0 };
    });
  },
  // Crouched, peeking: a squat, one hand on the knee and a finger up to the lips.
  'play-hide': F => [{ view: 'e', pelvis: P(F, -3, -F.B.thigh * 0.95 / g(F)), lean: 26, tilt: -18, feet: { near: foot(F, 5), far: foot(F, 1) }, knees: { near: 1, far: 1 },
    handsAt: j => ({ near: add(j.H, [F.B.head * 0.95, -F.B.head * 0.5]), far: add(j.P, [F.B.thigh * 0.75, F.B.thigh * 0.2]) }), elbows: { near: -1, far: 1 } }],
  // Kneeling at marbles: both knees down, sitting back on the heels, a hand at the ground flicking.
  'play-kneel': F => [0, 1].map(i => ({ view: 'e', pelvis: [-5 * g(F), F.B.shin * 0.55 + 6 * g(F)], lean: 34 + i * 4, tilt: -12, feet: { near: [-9 * g(F), 3.4], far: [-11 * g(F), 3.4] }, knees: { near: 1, far: 1 },
    hands: { near: [(18 - i * 2.5) * g(F), (2.4 + i * 2) * g(F)], far: [10 * g(F), 3 * g(F)] }, elbows: { near: 1, far: 1 }, marbles: 19 * g(F) })),
  // Sitting on the ground, legs out, a corn-husk doll in the lap.
  'play-sit-doll': F => [{ view: 'e', pelvis: [-2 * g(F), 7 * g(F)], lean: 4, tilt: 10, feet: { near: foot(F, 26, -0.5), far: foot(F, 24, -0.5) }, knees: { near: 1, far: 1 },
    hands: { near: [14 * g(F), 17 * g(F)], far: [12 * g(F), 19 * g(F)] }, elbows: { near: 1, far: 1 }, doll: [13 * g(F), 16 * g(F)] }],
  // Throwing corn to the hens: the hand in the pan at the waist, then flung out low, the corn in the air.
  'scatter': F => [
    { view: 'e', pelvis: P(F, -1), lean: 6, tilt: 8, feet: { near: foot(F, 5), far: foot(F, -4) }, hands: { near: at(F, 10, -18), far: at(F, 9, -20) }, elbows: { near: 1, far: 1 }, pan: true },
    { view: 'e', pelvis: P(F, 1, -0.8), lean: 10, tilt: 4, feet: { near: foot(F, 7), far: foot(F, -4, 1) }, hands: { near: at(F, 22, -11), far: at(F, 9, -20) }, elbows: { near: -1, far: 1 }, pan: true, flung: true },
  ],
  // Driving birds off the crop: arms flung up waving a cloth and shouting, then swept down and forward with a stamp.
  'shoo': F => [
    { view: 'e', pelvis: P(F, -1, 0.5), lean: -6, tilt: -8, feet: { near: foot(F, 7), far: foot(F, -7) }, hands: { near: at(F, 22, 10), far: at(F, -9, 18) }, elbows: { near: -1, far: -1 }, mouth: 'open', cloth: [0.3, 1] },
    { view: 'e', pelvis: P(F, 1, -2), lean: 16, tilt: -6, feet: { near: foot(F, 10, 2.5), far: foot(F, -7) }, hands: { near: at(F, 20, -2), far: at(F, 15, -6) }, elbows: { near: -1, far: -1 }, mouth: 'open', cloth: [-0.9, 0.5] },
  ],
  // Picking up (sticks, eggs): stooped to the ground with the basket on the far arm, then up with the hand at the basket.
  'gather': F => [
    { view: 'e', pelvis: P(F, -5, -6), lean: 56, tilt: -18, feet: { near: foot(F, 8), far: foot(F, -6) }, hands: { near: [18 * g(F), 3 * g(F)], far: add(P(F, -5, -6), [7 * g(F), -12 * g(F)]) }, elbows: { near: 1, far: 1 }, basket: 'far' },
    { view: 'e', pelvis: P(F, -2, -2), lean: 22, tilt: -6, feet: { near: foot(F, 8), far: foot(F, -6) }, hands: { near: add(P(F, -2, -2), [10 * g(F), -2 * g(F)]), far: add(P(F, -2, -2), [7 * g(F), -4 * g(F)]) }, elbows: { near: 1, far: 1 }, basket: 'far' },
  ],
  // Carrying water: a small pail in each hand, walking, the arms straight down with the weight, the stride shorter.
  'carry-water': F => {
    const s = F.B.thigh * 0.8, arm = armOf(F);
    return [
      { view: 'e', pelvis: P(F, 0, -1.4), lean: 3, feet: { near: foot(F, s), far: foot(F, -s * 0.9, 1.2) }, hands: { near: at(F, 2.5, -arm * 0.92), far: at(F, 0.5, -arm * 0.92) }, pails: true },
      { view: 'e', pelvis: P(F, 0, 0.3), lean: 2, feet: { near: foot(F, 1), far: foot(F, -3, 5) }, hands: { near: at(F, 1.5, -arm * 0.94), far: at(F, -0.5, -arm * 0.94) }, pails: true },
      { view: 'e', pelvis: P(F, 0, -1.4), lean: 3, feet: { near: foot(F, -s * 0.9, 1.2), far: foot(F, s) }, hands: { near: at(F, 0.5, -arm * 0.92), far: at(F, 2.5, -arm * 0.92) }, pails: true },
      { view: 'e', pelvis: P(F, 0, 0.3), lean: 2, feet: { near: foot(F, -3, 5), far: foot(F, 1) }, hands: { near: at(F, 1.5, -arm * 0.94), far: at(F, -0.5, -arm * 0.94) }, pails: true },
    ];
  },
  'carry-water-s': F => pailsFrontal(F, 's'),
  'carry-water-n': F => pailsFrontal(F, 'n'),
  // Talking to a grown-up: the face up to them, a hand lifted as the child tells it, then the palm out.
  'speak': F => [
    { view: 'e', pelvis: P(F), lean: -2, tilt: -12, feet: { near: foot(F, 4), far: foot(F, -3) }, hands: { near: at(F, 13, 3) }, elbows: { near: -1 }, mouth: 'open' },
    { view: 'e', pelvis: P(F), lean: 0, tilt: -10, feet: { near: foot(F, 4), far: foot(F, -3) }, hands: { near: at(F, 18, -5) }, elbows: { near: -1 } },
  ],
  // Tugging at a grown person's sleeve: both hands out at the height a hanging sleeve is, leaning back on the pull.
  'tug': F => [
    { view: 'e', pelvis: P(F, -2, -1), lean: -9, tilt: -12, feet: { near: foot(F, 8), far: foot(F, -4) }, hands: { near: at(F, 20, 3), far: at(F, 17, 1) }, elbows: { near: -1, far: -1 }, mouth: 'open' },
    { view: 'e', pelvis: P(F, -3, -1.5), lean: -13, tilt: -8, feet: { near: foot(F, 8), far: foot(F, -4) }, hands: { near: at(F, 16, 0), far: at(F, 13, -2) }, elbows: { near: -1, far: -1 } },
  ],
};
function runFrontal(F, view) {
  // Toward or away from the camera, running: the steps of her vertical walk with the arms out from the sides, the body bobbing.
  return [-1, 1].map(step => {
    const pose = { view, step, pelvis: P(F, 0, -1.4) };
    const hands = {};
    for (const side of [-1, 1]) { const S = frontalShoulder(F, pose, side); hands[side < 0 ? 'left' : 'right'] = add(S, [side * 9 * g(F), (side === step ? -7 : -14) * g(F)]); }
    return { ...pose, hands };
  });
}
function pailsFrontal(F, view) {
  return [-1, 1].map(step => {
    const pose = { view, step, pelvis: P(F, 0, -0.8) };
    const hands = {};
    for (const side of [-1, 1]) { const S = frontalShoulder(F, pose, side); hands[side < 0 ? 'left' : 'right'] = add(S, [side * 4.6 * g(F), -armOf(F) * 0.9]); }
    return { ...pose, hands, pails: true };
  });
}

/** Draw a child's pose (from CHILD_POSES) with its props, in the right order round the body. */
export function drawChildPose(ink, figure, pose) {
  const F = frameOf(figure), k = g(F);
  const j0 = sideJoints(F, pose);
  const hands = pose.handsAt ? pose.handsAt(j0) : pose.hands;
  // Behind the body: the far pail, the hoop (it is ahead, so it goes over nothing of hers).
  if (pose.pails && pose.view === 'e') drawBucket(ink, hands.far, { size: k * 1.45 });
  if (pose.hoopTurn !== undefined) hoop(ink, [38 * k, (15 + (pose.hoopDy || 0)) * k], 15 * k, pose.hoopTurn);
  const after = (inkIn, j) => {
    if (pose.stick !== undefined) {
      // The stick horse passes between the legs: from the ground behind to the horse's head in front of the chest.
      const top = add(j.handNear, [5 * k, 3.5 * k]);
      stickHorse(inkIn, [-18 * k, 1.5], top, k * (pose.horseScale || 1.6), { bob: -pose.stick * 0.5 });
      handOver(inkIn, F, j.handNear);
    }
    if (pose.hoopTurn !== undefined) hoopStick(inkIn, j.handNear, [23.5 * k, (17 + (pose.hoopDy || 0)) * k]);
    if (pose.doll) { doll(inkIn, pose.doll, k * 1.7); handOver(inkIn, F, j.handNear); }
    if (pose.pan) { cornPan(inkIn, add(j.handFar, [1.5 * k, 1.2 * k]), k * 1.4); if (!pose.flung) handOver(inkIn, F, j.handNear); else kernels(inkIn, j.handNear, k); }
    if (pose.cloth) cloth(inkIn, j.handNear, pose.cloth, '#c0503a', k * 1.5);
    if (pose.basket) { basket(inkIn, j.handFar, k * 1.05, { full: true }); if (pose.lean < 40) handOver(inkIn, F, j.handNear); }
    if (pose.marbles) marbles(inkIn, pose.marbles);
    if (pose.pails && pose.view === 'e') drawBucket(inkIn, j.handNear, { size: k * 1.45 });
    if (pose.pails && pose.view !== 'e') for (const side of ['left', 'right']) drawBucket(inkIn, hands[side], { size: k * 1.45 });
  };
  return drawPerson(ink, figure, { ...pose, hands, after });
}

// ---------------------------------------------------------------------------------------------------------------------
// The baby, drawn in its own units (a crawling baby about 50 tall with a head of radius 12.5), scaled by `s` and set at `o`,
// facing +1 (east) or -1 (west) with the light kept upper left. States: crawl (step 0-3), sit (the cry), sleep (curled on a
// blanket), sick (swaddled, a cool cloth on the brow), shoulder (upright against a grown-up's shoulder, the face turned
// outward), hip (sitting on a hip, facing forward), hipBack (the same from behind).
const BABY = CAST.infant;
export function drawBaby(ink, state, { o = [0, 0], s = 1, facing = 1, step = 0, fists = 0, mouth = 0, wrap = null } = {}) {
  const A = (x, y) => [o[0] + x * s * facing, o[1] + y * s];
  const r = 12.5 * s, gown = wrap || BABY.shirt, skin = BABY.skin, hair = BABY.hair;
  const dark = c => tone(c, -0.14);
  const face = (c, { eyes = 'open', turn = facing, flush = 0.4, open = 0 } = {}) => {
    // A profile three-quarter to `turn`: the eye, a cheek, a small mouth; eyes 'closed' or 'squeezed'.
    const F = (x, y) => [c[0] + x * r * turn, c[1] + y * r];
    ink.dot(ellipse(F(0.3, -0.34), r * 0.24, r * 0.15), '#d9806a', flush);
    if (eyes === 'open') { ink.dot(ellipse(F(0.42, 0.02), r * 0.1, r * 0.15), LINE.ink); ink.dot(ellipse(F(0.39, 0.08), r * 0.035, r * 0.04), '#fff8ea'); }
    else if (eyes === 'squeezed') ink.line(curve([F(0.28, 0.06), F(0.42, -0.04), F(0.56, 0.06)]), { width: LINE.inner, colour: LINE.ink });
    else ink.line(curve([F(0.28, 0.02), F(0.42, -0.06), F(0.56, 0.02)]), { width: LINE.inner, colour: LINE.ink });
    if (open) ink.dot(ellipse(F(0.6, -0.42), r * 0.13 * open, r * 0.12 * open), '#6a2a1c');
    else ink.line(curve([F(0.52, -0.42), F(0.62, -0.46), F(0.72, -0.4)]), { width: LINE.fine, colour: tone(skin, -0.45) });
  };
  const head = (c, opts = {}) => {
    const turn = opts.turn ?? facing;
    ink.shape(ellipse(c, r, r * 0.96), skin, { off: 1.1, lift: true });
    const H = (x, y) => [c[0] + x * r * turn, c[1] + y * r];
    // A little dark hair over the crown and the back of the head.
    ink.shape(blob([H(-0.95, 0.15), H(-0.75, 0.75), H(-0.15, 1.0), H(0.45, 0.88), H(0.2, 0.62), H(-0.2, 0.55), H(-0.55, 0.2)], 0.8), hair, { off: 0.5 });
    ink.shape(ellipse(H(-0.1, -0.08), r * 0.16, r * 0.22), dark(skin), { shade: false, outline: LINE.fine });
    face(c, { ...opts, turn });
  };
  if (state === 'crawl') {
    // Diagonal pairs: the near hand goes with the far knee. Frame 0 near hand forward, 2 far hand forward; 1 and 3 the pass.
    const reach = [5, 0, -4, 0][step % 4], bob = [0, 1.4, 0, 1.4][step % 4], sh = [0.8, 0, 0.8, 0][step % 4];
    const hip = A(-13 + sh, 22 + bob * 0.6), shoulder = A(9 + sh, 26 + bob), hc = A(21 + sh, 38 + bob);
    const limb = (from, to, rr, colour) => ink.shape(capsule(from, to, rr * s, rr * 0.9 * s), colour, { off: 0.6 });
    // The far arm and leg, darker, then the gown, the near leg, the head, the near arm.
    limb(A(8 + sh, 24 + bob), A(13 - reach, 2.2), 3.2, dark(gown)); ink.shape(ellipse(A(14 - reach, 1.8), 3 * s, 2.3 * s), dark(skin), { off: 0.3 });
    const farKnee = A(-9 + reach, 3.4), nearKnee = A(-7 - reach, 3.4);
    limb(A(-12 + sh, 20 + bob * 0.6), farKnee, 4.2, dark(gown)); limb(farKnee, A(-25 + reach, 5.5), 3.2, dark(gown)); ink.shape(ellipse(A(-26 + reach, 6.2), 2.4 * s, 2.8 * s), dark(skin), { off: 0.3 });
    ink.shape(blob([A(-22 + sh, 19 + bob * 0.5), A(-19 + sh, 30 + bob * 0.8), A(-4 + sh, 34 + bob), A(12 + sh, 35 + bob), A(17 + sh, 27 + bob), A(12 + sh, 18 + bob), A(-4 + sh, 13 + bob * 0.4), A(-16 + sh, 12)], 0.8), gown, { off: 1.4, lift: true });
    ink.line(curve([A(-17 + sh, 14), A(-10 + sh, 17 + bob * 0.5), A(-3 + sh, 15 + bob * 0.4)]), { width: LINE.fine, opacity: 0.5 });
    limb(A(-11 + sh, 19 + bob * 0.6), nearKnee, 4.4, gown); limb(nearKnee, A(-23 - reach, 5), 3.4, gown); ink.shape(ellipse(A(-24 - reach, 5.8), 2.5 * s, 2.9 * s), skin, { off: 0.3 });
    head(hc);
    limb(A(11 + sh, 25 + bob), A(15 + reach, 2.2), 3.4, gown); ink.shape(ellipse(A(16 + reach, 2), 3.1 * s, 2.4 * s), skin, { off: 0.3 });
    return;
  }
  if (state === 'sit') {
    // Sitting up, three-quarter to the camera: legs out in front, the gown in a bell, fists up; crying is the mouth open and
    // the eyes squeezed shut (and nothing more: no tears on the cheek, no red face).
    const up1 = fists;
    for (const side of [-1, 1]) {
      ink.shape(capsule(A(side * 6, 7), A(side * 9 + 3, 3), 4 * s, 3.6 * s), side < 0 ? dark(gown) : gown, { off: 0.5 });
      ink.shape(ellipse(A(side * 9 + 4, 3), 2.8 * s, 3.2 * s), skin, { off: 0.3 });
    }
    ink.shape(blob([A(-13, 6), A(-11, 18), A(-6, 28), A(6, 28), A(11, 18), A(13, 6), A(0, 3)], 0.8), gown, { off: 1.4, lift: true });
    for (const side of [-1, 1]) {
      const hand = A(side * (8 - up1 * 2), 22 + up1 * 11);
      ink.shape(capsule(A(side * 8, 26), hand, 3.4 * s, 3 * s), gown, { off: 0.5 });
      ink.shape(ellipse(hand, 3.1 * s, 3 * s), skin, { off: 0.3 });
    }
    const c = A(0.5, 39);
    ink.shape(ellipse(c, r, r * 0.96), skin, { off: 1.1, lift: true });
    const H = (x, y) => [c[0] + x * r, c[1] + y * r];
    ink.shape(blob([H(-0.9, 0.35), H(-0.55, 0.92), H(0.2, 1.02), H(0.85, 0.55), H(0.4, 0.66), H(-0.1, 0.6), H(-0.5, 0.45)], 0.8), hair, { off: 0.5 });
    for (const side of [-1, 1]) {
      ink.dot(ellipse(H(side * 0.52, -0.32), r * 0.2, r * 0.12), '#d9806a', 0.45);
      ink.shape(ellipse(H(side * 0.97, -0.05), r * 0.14, r * 0.2), dark(skin), { shade: false, outline: LINE.fine });
      if (mouth) ink.line(curve([H(side * 0.42 - 0.12, 0.04), H(side * 0.42, -0.06), H(side * 0.42 + 0.12, 0.04)]), { width: LINE.inner, colour: LINE.ink });
      else { ink.dot(ellipse(H(side * 0.36, 0.02), r * 0.1, r * 0.14), LINE.ink); }
    }
    if (mouth) ink.shape(ellipse(H(0, -0.46), r * 0.2 * mouth, r * 0.17 * mouth), '#6a2a1c', { shade: false, outline: LINE.fine });
    else ink.line(curve([H(-0.12, -0.48), H(0, -0.54), H(0.12, -0.48)]), { width: LINE.fine, colour: tone(skin, -0.45) });
    return;
  }
  if (state === 'sleep' || state === 'sick') {
    // On a folded blanket (seen three-quarter, a flat quilt), curled on the side asleep; or swaddled on its back, sick.
    const quilt = state === 'sick' ? '#b9a27a' : '#8fa0a8';
    ink.shape(blob([A(-30, 1), A(-33, 7), A(-20, 12), A(22, 13), A(34, 8), A(31, 1), A(10, -1.5)], 0.7), quilt, { off: 1.1 });
    ink.line(curve([A(-26, 4), A(0, 5.5), A(28, 4)]), { width: LINE.fine, colour: tone(quilt, -0.35), opacity: 0.7 });
    ink.line(curve([A(-20, 9), A(2, 10.5), A(24, 9)]), { width: LINE.fine, colour: tone(quilt, 0.35), opacity: 0.8 });
    if (state === 'sleep') {
      ink.shape(blob([A(-22, 6), A(-24, 15), A(-14, 23), A(2, 24), A(10, 18), A(4, 10), A(-8, 5)], 0.85), gown, { off: 1.3, lift: true });
      ink.shape(ellipse(A(-21, 7.5), 3 * s, 2.4 * s), skin, { off: 0.3 });
      ink.line(curve([A(-12, 8), A(-8, 15), A(-2, 19)]), { width: LINE.fine, opacity: 0.55 });
      head(A(13, 19), { eyes: 'closed', flush: 0.35 });
      ink.shape(ellipse(A(20, 12), 2.8 * s, 2.5 * s), skin, { off: 0.3 });
      return;
    }
    // Sick: swaddled to the chin, lying on its back, a folded cool cloth across the brow, eyes closed.
    ink.shape(blob([A(-24, 6), A(-23, 17), A(-8, 21), A(8, 20), A(13, 11), A(8, 5), A(-8, 4)], 0.8), gown, { off: 1.4, lift: true });
    ink.line(curve([A(-17, 6), A(-14, 13), A(-11, 19)]), { width: LINE.fine, opacity: 0.55 });
    ink.line(curve([A(-6, 5), A(-4, 12), A(-2, 19.5)]), { width: LINE.fine, opacity: 0.55 });
    const c = A(20, 14);
    head(c, { eyes: 'closed', flush: 0.55 });
    ink.shape(blob([A(10, 11), A(12, 22), A(17, 25), A(13, 13)], 0.6), gown, { shade: false, outline: LINE.inner });
    ink.shape(poly([A(13, 22), A(27, 24.5), A(29, 20.5), A(15, 18)]), '#f6f0e2', { off: 0.4, outline: LINE.inner });
    ink.line(curve([A(15, 20.2), A(28, 22.6)]), { width: LINE.fine, colour: '#b8c4c8', opacity: 0.9 });
    return;
  }
  if (state === 'shoulder') {
    // Upright against a shoulder, seen from the grown-up's front: the gown's back and bottom, the feet tucked, the head on
    // the shoulder turned outward (to `facing`), asleep.
    ink.shape(blob([A(-9, 0), A(-11, 14), A(-6, 26), A(6, 27), A(10, 14), A(8, 0), A(0, -2)], 0.8), gown, { off: 1.3, lift: true });
    ink.shape(ellipse(A(-5, -1), 3 * s, 2.4 * s), skin, { off: 0.3 });
    ink.shape(ellipse(A(3, -1.5), 3 * s, 2.4 * s), skin, { off: 0.3 });
    ink.line(curve([A(-3, 3), A(-2, 13), A(0, 24)]), { width: LINE.fine, opacity: 0.5 });
    head(A(2, 35), { eyes: 'closed', flush: 0.35 });
    return;
  }
  if (state === 'hip' || state === 'hipBack') {
    // Sitting astride a hip facing forward: the near leg down over the grown-up's front, the body upright, the head at the
    // chest. From behind (`hipBack`): the gown's back and the back of the head, the far leg's foot showing.
    const back = state === 'hipBack';
    ink.shape(capsule(A(3, 4), A(9, -8), 3.6 * s, 3.2 * s), back ? dark(gown) : gown, { off: 0.5 });
    ink.shape(ellipse(A(10, -10), 2.6 * s, 3 * s), skin, { off: 0.3 });
    ink.shape(blob([A(-8, 0), A(-9, 14), A(-5, 25), A(6, 25), A(9, 13), A(8, 1), A(0, -2)], 0.8), gown, { off: 1.3, lift: true });
    const c = A(1, 35);
    if (back) {
      ink.shape(ellipse(c, r, r * 0.96), skin, { off: 1.1 });
      ink.shape(blob([[c[0] - r * 0.98, c[1] - r * 0.1], [c[0] - r * 0.7, c[1] + r * 0.8], [c[0], c[1] + r], [c[0] + r * 0.7, c[1] + r * 0.8], [c[0] + r * 0.98, c[1] - r * 0.1], [c[0], c[1] - r * 0.7]], 0.8), hair, { off: 0.6 });
    } else head(c, { flush: 0.4 });
  }
}
/** A frame for the baby alone, in the people cell at the people contract (the renderer draws the infant at 0.45 of a person). */
export const BABY_SCALE = 1;

// ---------------------------------------------------------------------------------------------------------------------
// Lying sick under a blanket on a bed of blankets on the ground, head on a bundle (request 2026-09-27, item 3): east (the
// body side on, the head to the west, as the rig's own lying pose) or south (the feet toward the camera, the head away).
// Nothing of a wound or a fever's body: a blanket, a bundle, closed eyes, a cup by the head.
export function drawSickRest(ink, figure, view) {
  const F = frameOf(figure), { spec, B } = F, k = g(F);
  // The hat or bonnet off; braids, which would hang below the ground line from a head laid back, drawn gathered up.
  const bare = { ...spec, hat: null, ...(/braid/.test(spec.hairStyle || '') && { hairStyle: 'bun' }) };
  // A warm madder-red quilt with cream bars over a pale bed of blankets: a sickbed, never a shroud's brown.
  const blanket = '#a4553a', stripe = '#f0dcb0', bed = '#d6c49a';
  if (view === 'e') {
    const L = 96 * k, x0 = -L / 2; // head end at x0
    const depth = (B.depth + 3) * 1.05;
    // The bed of blankets under the whole length, three-quarter (its top shows), then the bundle under the head.
    ink.shape(blob([[x0 - 10 * k, 1], [x0 - 12 * k, 7 * k], [x0 + 6 * k, 12 * k], [x0 + L + 6 * k, 12 * k], [x0 + L + 12 * k, 6 * k], [x0 + L + 8 * k, 0.5], [0, -0.5]], 0.6), bed, { off: 1 });
    ink.line(curve([[x0 - 6 * k, 5 * k], [0, 6.5 * k], [x0 + L + 6 * k, 5 * k]]), { width: LINE.fine, colour: tone(bed, -0.35), opacity: 0.7 });
    // Propped up on the bundle, the head raised as somebody resting is, not laid flat.
    const hc = [x0 + B.head * 0.9, 9 * k + B.head * 0.75];
    ink.shape(blob([[x0 - 9 * k, 3 * k], [x0 - 11 * k, 14 * k], [x0 - 2 * k, 21 * k], [x0 + 12 * k, 17 * k], [x0 + 16 * k, 6 * k], [x0 + 4 * k, 2 * k]], 0.8), '#e6d4a4', { off: 1, lift: true });
    ink.line(curve([[x0 - 4 * k, 7 * k], [x0 + 4 * k, 9 * k], [x0 + 12 * k, 7 * k]]), { width: LINE.fine, colour: '#8a6a3a', opacity: 0.7 });
    // The head on the bundle, face up (the side view turned a quarter), eyes closed; the neck toward the body.
    const N = add(hc, [B.head * 1.0, -B.head * 0.6]);
    drawHeadSide(ink, bare, B, hc, N, -62, {});
    closeEyeSide(ink, bare, B, hc, -62);
    // The blanket over the body from the shoulders to past the feet: a low hump at the chest and hips, the feet at the end.
    const s0 = x0 + B.head * 1.9, top = 4 * k + depth;
    ink.shape(blob([[s0 - 3 * k, 4 * k], [s0 - 3 * k, top + 6 * k], [s0 + 10 * k, top + 5 * k], [s0 + 28 * k, top + 0.5 * k], [s0 + 46 * k, top - 3 * k], [x0 + L - 6 * k, top - 2 * k], [x0 + L - 2 * k, top + 2.5 * k], [x0 + L + 4 * k, top + 1 * k], [x0 + L + 6 * k, 5 * k], [x0 + L, 2.5 * k], [s0 + 20 * k, 2 * k]], 0.8), blanket, { off: 1.6, lift: true });
    for (const t of [0.34, 0.4]) ink.line(curve([[s0 + L * t - 2 * k, 3 * k], [s0 + L * t, top * 0.6], [s0 + L * t + 1 * k, top + 0.5 * k]]), { width: 3, colour: stripe, opacity: 0.9 });
    ink.line(curve([[s0 - 1 * k, top + 5 * k], [s0 + 6 * k, top + 5.6 * k], [s0 + 14 * k, top + 4.4 * k]]), { width: LINE.inner, colour: tone(blanket, 0.35), opacity: 0.8 });
    // The near arm lying out over the blanket, the hand on the chest.
    const S = [s0 + 1 * k, top + 6 * k], hand = [s0 + 17 * k, top + 3.6 * k];
    ink.shape(capsule(S, hand, B.limb * 0.46, B.limb * 0.4), spec.coat || spec.shirt, { off: 0.6 });
    ink.shape(ellipse(hand, B.limb * 0.36, B.limb * 0.32), spec.skin, { off: 0.3 });
    // A tin cup set down by the head.
    const cup = [x0 - 14 * k, 1];
    ink.shape(poly([add(cup, [-3 * k, 0]), add(cup, [3 * k, 0]), add(cup, [3.4 * k, 7 * k]), add(cup, [-3.4 * k, 7 * k])]), '#9a9e98', { off: 0.6 });
    ink.shape(ellipse(add(cup, [0, 7 * k]), 3.4 * k, 1.1 * k), '#6a8a94', { shade: false, outline: LINE.inner });
    ink.line(curve([add(cup, [3.2 * k, 5.5 * k]), add(cup, [6 * k, 4 * k]), add(cup, [3.2 * k, 2 * k])]), { width: LINE.inner });
    return;
  }
  // South: lying toward the camera. The body's length is foreshortened (0.55), the head at the back on its bundle.
  const len = 96 * k * 0.55, front = 3 * k, back = front + len;
  const w = B.shoulderW * 0.62;
  ink.shape(blob([[-w - 12 * k, back + 7 * k], [w + 12 * k, back + 7 * k], [w + 16 * k, front - 1], [-w - 16 * k, front - 1]], 0.35), bed, { off: 1 });
  ink.shape(ellipse([0, back + 3 * k], w * 1.05, 6 * k), '#d8c090', { off: 1, lift: true });
  const hc = [0, back + B.head * 0.55];
  drawHeadFrontal(ink, bare, B, hc, add(hc, [0, -B.head * 1.1]), false, {});
  closeEyesFrontal(ink, bare, B, hc);
  // The blanket from under the chin to the feet at the front, wider toward the camera, the feet two bumps at its hem.
  const chin = back - B.head * 0.35;
  ink.shape(blob([[-w * 0.95, chin], [w * 0.95, chin], [w * 1.12, (chin + front) / 2], [w * 0.9, front + 3 * k], [w * 0.42, front + 1 * k], [0, front + 3.5 * k], [-w * 0.42, front + 1 * k], [-w * 0.9, front + 3 * k], [-w * 1.12, (chin + front) / 2]], 0.6), blanket, { off: 1.6, lift: true });
  for (const x of [-w * 0.45, w * 0.45]) ink.shape(ellipse([x, front + 4.5 * k], 4.6 * k, 3.6 * k), tone(blanket, 0.06), { off: 0.8, outline: LINE.inner });
  for (const t of [0.45, 0.55]) ink.line(curve([[-w * 1.05, chin + (front - chin) * t], [0, chin + (front - chin) * t - 1.5 * k], [w * 1.05, chin + (front - chin) * t]]), { width: 3, colour: stripe, opacity: 0.9 });
  ink.line(curve([[-w * 0.9, chin - 0.5], [0, chin + 1 * k], [w * 0.9, chin - 0.5]]), { width: LINE.inner, colour: tone(blanket, 0.35) });
  // One arm out on the blanket, the hand at the middle.
  ink.shape(capsule([-w * 0.85, chin - 2 * k], [-w * 0.1, chin - 9 * k], B.limb * 0.46, B.limb * 0.4), spec.coat || spec.shirt, { off: 0.6 });
  ink.shape(ellipse([-w * 0.05, chin - 9.5 * k], B.limb * 0.36, B.limb * 0.32), spec.skin, { off: 0.3 });
  const cup = [w + 17 * k, back - 2 * k];
  ink.shape(poly([add(cup, [-3 * k, 0]), add(cup, [3 * k, 0]), add(cup, [3.4 * k, 7 * k]), add(cup, [-3.4 * k, 7 * k])]), '#9a9e98', { off: 0.6 });
  ink.shape(ellipse(add(cup, [0, 7 * k]), 3.4 * k, 1.1 * k), '#6a8a94', { shade: false, outline: LINE.inner });
}

// ---------------------------------------------------------------------------------------------------------------------
// A grown-up holding the baby (request 2026-09-26, item 3). The baby is drawn at the infant's scale against the grown-up's
// (the renderer draws a baby at 0.45 of a person: in a grown-up's frame the baby's units are HELD of the grown-up's).
export const HELD = 0.55;
/** A carried baby is wrapped in a small blue-grey shawl, so it is not lost against a cream apron or a shirt. */
export const SHAWL = '#8497a3';
/** `-hold-baby`: toward the camera, the baby to the (screen-left) shoulder, one arm under it and a hand on its back; swaying. */
export function holdBabyPoses(F) {
  return [-1, 1].map(sway => {
    const pose = { view: 's', pelvis: P(F, sway * 0.8) };
    const L = frontalShoulder(F, pose, -1), R = frontalShoulder(F, pose, 1);
    const o = add(L, [2.2 + sway * 0.6, -13 * HELD * 1.6]);
    return { ...pose, sway, babyAt: o, hands: { left: add(o, [3.5, -1.5]), right: add(o, [4.5, 7.5]) }, L, R };
  });
}
export function drawHoldBaby(ink, figure, pose) {
  const F = frameOf(figure);
  return drawPerson(ink, figure, { ...pose, after: (inkIn, j) => {
    drawBaby(inkIn, 'shoulder', { o: pose.babyAt, s: HELD, facing: -1, wrap: SHAWL });
    // The arm under the baby and the hand on its back, over it.
    const under = ik(pose.L, pose.hands.left, F.B.upperArm, F.B.forearm, -1);
    inkIn.shape(capsule(under.joint, under.end, F.B.limb * 0.4, F.B.limb * 0.35), F.spec.coat ? F.spec.coat : F.spec.skin, { off: 0.5 });
    handOver(inkIn, F, under.end);
    const back = ik(pose.R, pose.hands.right, F.B.upperArm, F.B.forearm, 1);
    inkIn.shape(capsule(back.joint, back.end, F.B.limb * 0.4, F.B.limb * 0.35), F.spec.coat ? F.spec.coat : F.spec.skin, { off: 0.5 });
    handOver(inkIn, F, back.end);
  } });
}
/** `-carry-baby-walk` (east): the walk with the baby on the near hip, the near arm round it, the far arm swinging. */
export function carryBabyPoses(F) {
  const s = F.B.thigh * 0.95, arm = armOf(F);
  const legs = [
    [P(F, 0, -1.6), 6, foot(F, s), foot(F, -s * 0.95, 1.5), at(F, 9, -arm * 0.74)],
    [P(F, 0, 0.4), 4, foot(F, 1), foot(F, -3, 6), at(F, 1, -arm * 0.9)],
    [P(F, 0, -1.6), 6, foot(F, -s * 0.95, 1.5), foot(F, s), at(F, -8, -arm * 0.8)],
    [P(F, 0, 0.4), 4, foot(F, -3, 6), foot(F, 1), at(F, 0, -arm * 0.9)],
  ];
  return legs.map(([pelvis, lean, near, far, farHand], i) => ({ view: 'e', pelvis, lean: lean - 2, tilt: 2, feet: { near, far }, hands: { far: farHand, near: add(pelvis, [10 * g(F), 1 * g(F)]) }, elbows: { near: -1, far: -1 }, bob: i % 2 ? 0.6 : 0 }));
}
export function drawCarryBaby(ink, figure, pose) {
  const F = frameOf(figure);
  return drawPerson(ink, figure, { ...pose, after: (inkIn, j) => {
    drawBaby(inkIn, 'hip', { o: add(j.P, [5 * g(F), -1 * g(F) + (pose.bob || 0)]), s: HELD, facing: 1, wrap: SHAWL });
    armOver(inkIn, F, j.S, add(j.P, [10 * g(F), 1 * g(F)]), { bend: -1 });
  } });
}
/** `-carry-baby-walk-s`/`-n`: her vertical walk, the baby on the (screen-left for south, screen-right for north) hip. */
export function carryBabyFrontal(F, view) {
  const side = view === 's' ? -1 : 1;
  return [-1, 1].map(step => {
    const pose = { view, step, pelvis: P(F, 0, -0.8) };
    const S = frontalShoulder(F, pose, side), hw = F.B.hipW * 0.5;
    const o = add(pose.pelvis, [side * (hw + 1.5), 3]);
    const hands = { [side < 0 ? 'left' : 'right']: add(o, [-side * 1, 6]) };
    return { ...pose, hands, babyAt: o, side, S };
  });
}
export function drawCarryBabyFrontal(ink, figure, pose) {
  const F = frameOf(figure), back = pose.view === 'n';
  return drawPerson(ink, figure, { ...pose, after: (inkIn) => {
    drawBaby(inkIn, back ? 'hipBack' : 'hip', { o: pose.babyAt, s: HELD, facing: back ? -pose.side : pose.side, wrap: SHAWL });
    const hand = pose.hands[pose.side < 0 ? 'left' : 'right'];
    if (!back) {
      const arm = ik(pose.S, hand, F.B.upperArm, F.B.forearm, pose.side);
      inkIn.shape(capsule(arm.joint, arm.end, F.B.limb * 0.4, F.B.limb * 0.35), F.spec.coat ? F.spec.coat : F.spec.skin, { off: 0.5 });
    }
    handOver(inkIn, F, hand);
  } });
}

/** Rig figures in a pixel drawing (an icon): the rig's units scaled by `s` px, the ground at `base`, facing east. */
export function figureIn(ink, tag, base, s, draw, { flip = false } = {}) {
  return nest(ink, tag, `translate(${f2(base[0])} ${f2(base[1])}) scale(${f2(flip ? -s : s)} ${f2(-s)})`, s, draw, { yUp: true });
}
export { lerp, sub };

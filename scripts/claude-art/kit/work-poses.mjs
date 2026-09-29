// Area A's poses (docs/CLAUDE_ART_PLAN.md: people at work and ambient poses), for any grown figure of the rig, as frames of
// joint targets the way kit/poses.mjs writes them: `pelvis`, `lean`, `feet`, `hands`, `elbows`, a rigid `tool`, and the two
// hooks this file adds - `before(ink, F)` draws what is behind the figure (a stool, a table's far legs, a hole's back wall) and
// `after(ink, joints, F)` what is in front of it or in its hands (a knife, cloth, a basket, the fire). `drawPosed` runs both.
//
// How they are made to move (owner, 2026-09-28: "make sure the chop swings look natural"; the builder's brief: "weight
// shifts, planted feet, tools kept a constant length and held in the hands, smooth arcs, and holds on key frames"):
//   - the feet of a pose that does not walk are the same in every frame (tests/claude-work-poses.test.mjs);
//   - a tool is rigid: `grip` + `aim` + where each hand is along it, the haft its own length (kit/rig.mjs `rigidTool`);
//   - a two-frame loop moves one thing (the hand with the knife, the needle, the pipe) and lets the body follow a little -
//     the chest dips a degree or two, the head nods - so it breathes rather than jumps;
//   - timings hold the frame that says what is being done longest (DURATIONS below), as her own two-frame cycles hold
//     each frame 360-420 ms.
// Numbers are for a grown figure (hips at 39, shoulders at ~59); `g` scales them to the figure's own size.
import { drawPerson, frameOf, rigidTool } from './rig.mjs';
import { TOOLS, drawBucket, drawTool } from './props.mjs';
import { Ink, add, sub, mul, lerp, norm, len } from './svg.mjs';
import * as W from './work-props.mjs';

export const g = F => F.hip / 39;
const P = (F, dx = 0, dy = 0) => [dx * g(F), F.hip + dy * g(F)];
const foot = (F, x, lift = 0) => [x * g(F), F.ankle + lift * g(F)];
/** A point relative to the standing figure's shoulder height. */
const at = (F, x, y) => [x * g(F), F.neck - 3 + y * g(F)];
/** A point from the ground, scaled to the figure. */
const pt = (F, x, y) => [x * g(F), y * g(F)];

/** Draw `pose` for `figure`, with what goes behind and in front of it. Returns the joints. */
export function drawPosed(ink, figure, pose) {
  const F = frameOf(figure);
  const after = (k, j) => { pose.after?.(k, j, F); if (pose.afterTool) earthOn(k, pose); };
  if (pose.well) return drawInWell(ink, figure, F, pose, after);
  pose.before?.(ink, F);
  return drawPerson(ink, figure, { ...pose, after });
}

/**
 * Somebody waist-deep in a square hole (the well): the far bank and the dark of the hole, the figure let down into it and cut
 * off at the front rim, then the front bank of thrown earth over the cut. `pose.well` is how far the figure is let down.
 */
function drawInWell(ink, figure, F, pose, after) {
  const k = g(F), rim = -3 * k, back = 7 * k, x0 = -17 * k, x1 = 19 * k;
  ink.shape(`M ${x0 - 6 * k} ${back - 1} Q ${(x0 + x1) / 2} ${back + 6 * k} ${x1 + 6 * k} ${back - 1} Z`, '#7a5634', { off: 0.8 });
  ink.shape(`M ${x0} ${rim} L ${x1} ${rim} L ${x1 - 2 * k} ${back} L ${x0 + 2 * k} ${back} Z`, '#2e1e12', { shade: false });
  ink.shape(`M ${x0 + 2 * k} ${back} L ${x1 - 2 * k} ${back} L ${x1 - 2.5 * k} ${back - 4 * k} L ${x0 + 2.5 * k} ${back - 4 * k} Z`, '#5a3c24', { shade: false, outline: 0 });
  const inner = new Ink(`${ink.prefix}w`, ink.k, { yUp: true });
  inner.n = ink.n + 700;
  drawPerson(inner, figure, { ...pose, after });
  const clip = ink.id('well');
  ink.defs.push(...inner.defs, `<clipPath id="${clip}"><rect x="-300" y="${rim}" width="600" height="400"/></clipPath>`);
  ink.raw(`<g clip-path="url(#${clip})">${inner}</g>`);
  // The front bank, and the earth thrown up behind the digger.
  ink.shape(`M ${x0 - 5 * k} ${rim + 0.5} Q ${x0} ${rim + 3 * k} ${(x0 + x1) / 2} ${rim + 1.5 * k} Q ${x1} ${rim + 3 * k} ${x1 + 5 * k} ${rim + 0.5} Q ${(x0 + x1) / 2} ${rim - 3 * k} ${x0 - 5 * k} ${rim + 0.5} Z`, '#7a5634', { off: 0.8, lift: true });
  ink.shape(`M ${x0 - 16 * k} ${0} Q ${x0 - 10 * k} ${9 * k} ${x0 - 2 * k} ${back} L ${x0 - 4 * k} ${0} Z`, '#6a4a2c', { off: 0.8 });
  return {};
}

/** A rigid hafted tool: the bottom hand at `grip`, the head toward `aim`; `near`/`far` how far along the haft each hand is. */
const rigid = (F, kind, grip, aim, near, far, extra = {}) => ({ kind, grip: at(F, ...grip), aim: at(F, ...aim), near, far, side: 1, ...extra });

// -----------------------------------------------------------------------------------------------------------------------
// Seated on a stool (her `-repair` and `-rest` sit on a small three-legged one): the hips at knee height, the thighs level,
// the feet planted forward, the chest a little over the knees.
// Astra draws a seated, kneeling or crouching figure to fill the same row height as a standing one (her `-repair`, `-rest`,
// `-care` and `-sow` stand 0.87-0.95 of the logical height to the top, as her idle does), so at play size her people at ease
// are drawn larger than a standing one would be sitting down. These are drawn to match (`scale` in personFrame, about the
// feet): measured, a seated figure's top at about 0.9 of the height (hers 0.92-0.95; the rig's own standing figure is 0.87).
export const SIT_SCALE = 1.3;
const seatY = F => F.B.shin + F.ankle + 1;
const stool = (F, extra) => (ink) => { W.drawStool(ink, -4 * g(F), seatY(F) - F.B.limb * 0.62, { width: 15 * g(F) }); extra?.(ink, F); };
function seated(F, { lean = 10, px = -3, feet, hands, elbows = { near: -1, far: -1 }, tilt = 0, twist, mouth, before, after, tool } = {}) {
  return { view: 'e', tool, pelvis: [px * g(F), seatY(F)], lean, tilt, twist, mouth, feet: feet || { near: foot(F, 14), far: foot(F, 10) }, knees: { near: 1, far: 1 },
    hands, elbows, before: stool(F, before), after, scale: SIT_SCALE };
}
/** The near knee and the hip of a seated pose, for laying things in the lap. */
const lap = F => ({ hip: [-3 * g(F), seatY(F)], knee: [14 * g(F), seatY(F) + 1] });

// Kneeling on the far knee, the near foot planted (her `-care`), bent to the work in front.
function kneeling(F, { lean = 26, tilt = -6, hands, elbows = { near: 1, far: 1 }, dy = 0, mouth, before, after } = {}) {
  return { view: 'e', pelvis: P(F, -3, -F.B.thigh * 0.85 / g(F) + dy), lean, tilt, mouth, feet: { near: foot(F, 10), far: [-F.B.shin * 0.95, F.ankle + 0.5] }, knees: { near: 1, far: 1 },
    hands, elbows, before, after, scale: SIT_SCALE };
}

// -----------------------------------------------------------------------------------------------------------------------
// Ambient life (request 2026-09-28 — ambient life, item 1). Two-frame seated loops unless said.
export const AMBIENT = {
  // Whittling: a stick in the far hand, the knife in the near one shaving along it away from the body; a curl comes off.
  whittle: F => {
    const stick = [pt(F, 8, 31), pt(F, 19, 36)];
    return [0, 1].map(i => seated(F, { lean: 16 + i, hands: { far: stick[0], near: i ? pt(F, 18, 36.5) : pt(F, 11, 33) }, elbows: { near: -1, far: -1 },
      after: (ink, j) => {
        W.drawStick(ink, stick[0], stick[1], { cut: 0.45 });
        W.drawKnife(ink, j.handNear, sub(stick[1], stick[0]), { blade: 4.5 * g(F) });
        if (i) W.drawCurl(ink, add(stick[1], pt(F, 1.5, -2.5)), 1.1 * g(F));
      } }));
  },
  // Mending harness: the leather over the knees, the awl in the near hand pushed through and the waxed thread drawn up.
  'mend-harness': F => {
    const { hip, knee } = lap(F);
    return [0, 1].map(i => seated(F, { lean: 18 - i * 3, tilt: i ? -4 : 0, hands: { far: pt(F, 12, 27.5), near: i ? pt(F, 13, 41) : pt(F, 11, 28.5) }, elbows: { near: -1, far: -1 },
      after: (ink, j) => { W.drawHarness(ink, knee, hip); W.drawAwl(ink, j.handNear, i ? [0.3, 1] : [0.6, -1], i ? pt(F, 12, 27) : null); } }));
  },
  // Sewing: cloth over the lap, the far hand holding it, the needle drawn up and out at arm's length, then back into it.
  sew: F => {
    const { hip, knee } = lap(F);
    return [0, 1].map(i => seated(F, { lean: 14 - i * 2, hands: { far: pt(F, 10, 28), near: i ? pt(F, 19, 40) : pt(F, 12, 29.5) }, elbows: { near: -1, far: -1 },
      after: (ink, j) => { W.drawCloth(ink, hip, knee); W.drawNeedle(ink, j.handNear, pt(F, 11.5, 28.5)); } }));
  },
  // Shelling corn: an ear in both hands over a basket at the feet, the thumbs twisting the kernels off; a few falling.
  'shell-corn': F => {
    const basket = pt(F, 21, 0);
    return [0, 1].map(i => seated(F, { lean: 24 + i * 2, feet: { near: foot(F, 13), far: foot(F, 9) }, hands: { far: pt(F, 17, 25 - i), near: pt(F, 21, 23.5 - i) }, elbows: { near: -1, far: -1 },
      before: ink => W.drawBasket(ink, basket, { w: 13 * g(F), h: 7.5 * g(F), fill: '#e8b83a' }),
      after: (ink, j) => {
        W.drawEar(ink, add(j.handFar, pt(F, -2, 0.5)), add(j.handNear, pt(F, 3, -0.5)), { husk: true });
        for (const [dx, dy] of i ? [[1, -4], [3, -7], [-1, -9]] : [[2, -6], [0, -3]]) ink.dot(`M ${j.handNear[0] + dx * g(F)} ${j.handNear[1] + dy * g(F)} m -0.9 0 a 0.9 0.9 0 1 0 1.8 0 a 0.9 0.9 0 1 0 -1.8 0`, '#e8b83a');
      } }));
  },
  // Cleaning a rifle: the rifle across the knees, the far hand steadying the barrel, the near hand running a rag along it.
  'clean-rifle': F => {
    const butt = pt(F, -8, 29), muzzle = pt(F, 44, 33);
    return [0, 1].map(i => seated(F, { lean: 14, hands: { far: pt(F, 20, 31.5), near: i ? pt(F, 32, 33.5) : pt(F, 12, 31.5) }, elbows: { near: -1, far: -1 },
      tool: { kind: 'rifle', butt, tip: muzzle, side: 1 }, after: (ink, j) => W.drawRag(ink, j.handNear) }));
  },
  // A pipe: sitting back at ease, the pipe up to the mouth (a thread of smoke), then lowered to the chest, the bowl smoking.
  pipe: F => [0, 1].map(i => {
    const lean = 2 - i, px = -4, H = headOf(F, lean, px), h = F.B.head;
    const mouth = add(H, [h * 0.85, -h * 0.55]);
    return seated(F, { lean, px, feet: { near: foot(F, 16), far: foot(F, 11) }, hands: { far: pt(F, 11, 27), near: i ? pt(F, 8, 45) : add(mouth, [h * 0.35, -h * 1.05]) }, elbows: { near: -1, far: -1 },
      after: (ink, j) => {
        if (i) W.drawPipe(ink, j.handNear, add(j.handNear, pt(F, 5, 1.5)), { smoke: true });
        else { W.drawPipe(ink, j.handNear, mouth); W.wisp(ink, add(mouth, [2, 3]), 0.8 * g(F), 0.55); }
      } });
  }),
  // Cards: a hand of cards held up at the chest, then the near hand reaching out to lay one down.
  cards: F => [0, 1].map(i => seated(F, { lean: 12 + i * 5, hands: { far: pt(F, 11, 38), near: i ? pt(F, 24, 31) : pt(F, 13, 39) }, elbows: { near: -1, far: -1 },
    after: (ink, j) => {
      W.drawCards(ink, j.handFar, { a: 70, spread: 40, n: 4 });
      if (i) W.drawCardDown(ink, add(j.handNear, pt(F, 1.5, -1)));
    } })),
  // Washing: kneeling at the tub (drawn beside by the `washtub` prop), both hands on the board scrubbing down, then back up.
  wash: F => [0, 1].map(i => kneeling(F, { lean: 30 + i * 6, tilt: -8, dy: i ? -0.6 : 0, hands: { near: pt(F, 24 + i * 2, i ? 10 : 15), far: pt(F, 21 + i * 2, i ? 11 : 16) },
    after: (ink, j) => W.drawRag(ink, j.handNear, '#d8e0e4') })),
  // Sweeping: a broom held low in both hands, the head swept from ahead back toward the feet, lifted and set forward again.
  sweep: F => {
    const stance = { near: foot(F, 8), far: foot(F, -7) };
    const broom = (grip, aim, lean, dy) => ({ view: 'e', pelvis: P(F, -2, dy), lean, feet: stance, tool: rigid(F, 'broom', grip, aim, 0.18, 0.6, { side: 1 }), elbows: { near: 1, far: -1 } });
    const swept = (b, extra) => ({ ...b, after: ink => { W.drawBroomHead(ink, b.tool.tip, sub(b.tool.tip, b.tool.butt), g(F)); extra?.(ink); } });
    return [
      swept(broom([12, -12], [38, -60], 26, -3.5)),
      swept(broom([8, -14], [26, -62], 28, -4), ink => W.drawDust(ink, pt(F, 26, 0), g(F), 0.45)),
      swept(broom([4, -14], [12, -62], 26, -4), ink => W.drawDust(ink, pt(F, 13, 0), g(F), 0.6)),
      swept(broom([8, -11], [30, -54], 22, -3)),
    ];
  },
  // Carrying water: a bucket in each hand, the arms straight with the weight, the walk shortened under it.
  'carry-water': F => {
    const s = F.B.thigh * 0.8, arm = F.B.upperArm + F.B.forearm;
    const side = x => at(F, x, -arm * 0.96);
    const frames = [
      { pelvis: P(F, 0, -1.6), lean: 3, feet: { near: foot(F, s), far: foot(F, -s * 0.9, 1.4) }, hands: { near: side(4), far: side(-3) } },
      { pelvis: P(F, 0, 0.2), lean: 2, feet: { near: foot(F, 1), far: foot(F, -3, 5) }, hands: { near: side(2.5), far: side(-2) } },
      { pelvis: P(F, 0, -1.6), lean: 3, feet: { near: foot(F, -s * 0.9, 1.4), far: foot(F, s) }, hands: { near: side(1), far: side(-0.5) } },
      { pelvis: P(F, 0, 0.2), lean: 2, feet: { near: foot(F, -3, 5), far: foot(F, 1) }, hands: { near: side(2.5), far: side(-2) } },
    ];
    // The far bucket hangs behind the legs, so it is drawn first, at the far hand the pose asks for (the arm reaches it).
    return frames.map(f => ({ view: 'e', ...f, elbows: { near: 1, far: 1 },
      before: ink => drawBucket(ink, f.hands.far, { size: g(F) * 1.3 }), after: (ink, j) => drawBucket(ink, j.handNear, { size: g(F) * 1.3 }) }));
  },
};
/** Where the head of a seated figure is, roughly, for a hand raised to the mouth before the rig has placed it. */
function headOf(F, lean, px) {
  const y = seatY(F), t = [Math.sin(lean * Math.PI / 180), Math.cos(lean * Math.PI / 180)];
  return [px * g(F) + t[0] * (F.B.torso + F.B.neck + F.B.head), y + t[1] * (F.B.torso + F.B.neck + F.B.head * 0.95)];
}

/** Each ambient clip's frame durations: a two-frame loop holds its telling frame; the walks keep the cast's 180 ms step. */
export const AMBIENT_TIMING = {
  whittle: [520, 380], 'mend-harness': [460, 520], sew: [440, 560], 'shell-corn': [360, 360], 'clean-rifle': [480, 480],
  pipe: [1100, 1500], cards: [900, 700], wash: [380, 380], sweep: [300, 220, 300, 260], 'carry-water': [200, 200, 200, 200],
};

// -----------------------------------------------------------------------------------------------------------------------
// People at work (request 2026-09-28 — people at work). The swings the foundation drew (kit/poses.mjs `split`, `dig`) are
// taken as they are, with the thing struck drawn where the tool lands; the rest are drawn here.

/** A head set across a rigid haft's end (a maul's, a mallet's): its two striking faces, the lower first. */
export function headFaces(tool, half, r) {
  const { butt, tip } = tool.grip ? rigidTool(tool) : tool, d = norm(sub(tip, butt)), n = [-d[1], d[0]];
  const fa = add(tip, mul(n, half + r)), fb = add(tip, mul(n, -half - r));
  return fa[1] < fb[1] ? [fa, fb] : [fb, fa];
}
/** Every point of a pose moved down by `dy` (a figure let down into a hole). */
export function sunk(pose, dy) {
  const s = p => p && [p[0], p[1] + dy];
  const out = { ...pose, pelvis: s(pose.pelvis), feet: { near: s(pose.feet.near), far: s(pose.feet.far) } };
  if (pose.hands) out.hands = Object.fromEntries(Object.entries(pose.hands).map(([k, v]) => [k, s(v)]));
  if (pose.tool) out.tool = { ...pose.tool, ...(pose.tool.grip ? { grip: s(pose.tool.grip), aim: s(pose.tool.aim) } : { butt: s(pose.tool.butt), tip: s(pose.tool.tip) }) };
  return out;
}
const oval = (c, rx, ry) => `M ${c[0] - rx} ${c[1]} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
/** A hand drawn again over something it grips (a log, a knife handle), in the figure's skin. */
const skinHand = (ink, p, F) => ink.shape(oval(p, F.B.limb * 0.36, F.B.limb * 0.34), F.spec.skin, { off: 0.4 });
/** The long rifle carried on the near shoulder: the butt in the near hand at the chest, the barrel sloped up and back. */
const shouldered = (F, hand) => ({ kind: 'rifle', butt: add(hand, pt(F, 1.5, -3)), tip: add(hand, pt(F, -16, 55)), side: 1 });

/** How deep the well digger stands in the hole, in rig units. */
export const WELL_DEPTH = 21;
/** Where the fishing float sits (rig units, before the figure's own scale), and the tended fire's middle. */
export const FISH_FLOAT = [51, -2.5];
export const FIRE_AT = 24;

function earthOn(ink, pose) {
  // A spadeful of dark earth on the blade (the rig sets the tool's butt and tip on the pose it was given).
  const { butt, tip } = pose.tool, d = norm(sub(tip, butt)), c = add(tip, mul(d, 6));
  ink.shape(oval(c, 3.6, 2.4), '#5a3c22', { off: 0.5, outline: 2.2 });
}
function rifleStance(F, { lean, tilt, butt, muzzle, near, far, dx = 0 }) {
  return { view: 'e', pelvis: P(F, -2 + dx, -3), lean, tilt, feet: { near: foot(F, 9), far: foot(F, -10) },
    tool: { kind: 'rifle', butt: at(F, ...butt), tip: at(F, ...muzzle), side: -1, near, far }, elbows: { near: -1, far: 1 } };
}

export const WORK = {
  // Splitting rails (item 2): the foundation's maul swing, the log on the ground with the wedge where the maul lands.
  split: (F, SPLIT) => {
    const poses = SPLIT(F), [strike] = headFaces(poses[3].tool, 5.5, 3.4);
    const top = strike[1] - 1.2, r = Math.max(4.5, Math.min(7, (top + 4) / 2)), cy = Math.max(top - r, r - 5); // never more than 5 below the ground line
    return poses.map((p, i) => ({ ...p, before: ink => { W.drawWallLog(ink, strike[0] - 12, strike[0] + 24, cy, r, { end: 'rough' }); W.drawWedge(ink, [strike[0], cy + r + (i === 3 || i === 4 ? 0.2 : 2.2)], 1.1); } }));
  },
  // Digging (item 4): the foundation's spade swing; a dark cut in the ground where the spade goes in, earth on the blade as it
  // is lifted and thrown.
  dig: (F, DIG) => DIG(F).map((p, i) => ({ ...p, before: ink => ink.dot(oval([11 * g(F), 0.6], 7, 1.8), '#4a3220', 0.85),
    afterTool: i === 2 || i === 3 })),
  // The well (item 4): the same swing drawn waist-deep in a square hole with a low bank of earth round it.
  'dig-well': (F, DIG) => DIG(F).map((p, i) => ({ ...sunk(p, -WELL_DEPTH * g(F)), well: WELL_DEPTH * g(F), afterTool: i === 2 || i === 3 })),
  // Raising the house (item 3): beside a wall log at knee height, notching its end with an axe - raised, down, the bite in the
  // log's top, drawn out; the feet planted.
  notch: F => {
    const stance = { near: foot(F, 5), far: foot(F, -11) }, logR = 6.5 * g(F), logY = 21 * g(F);
    const axe = (grip, aim, top) => ({ kind: 'axe', grip: at(F, ...grip), aim: at(F, ...aim), near: top, far: 0.05, side: aim[0] > grip[0] ? 1 : -1, ...(aim[0] > grip[0] ? {} : { behind: true }) });
    const log = notched => ink => W.drawWallLog(ink, 17 * g(F), 70 * g(F), logY, logR, { notch: notched * g(F), end: 'rough' });
    return [
      { view: 'e', pelvis: P(F, -5, -4), lean: -10, tilt: 10, twist: 0.8, feet: stance, tool: axe([-7, 14], [-34, 40], 0.42), elbows: { near: -1, far: -1 }, before: log(3) },
      { view: 'e', pelvis: P(F, -2, -5), lean: 14, twist: 0.15, feet: stance, tool: axe([6, 12], [36, 34], 0.26), elbows: { near: -1, far: -1 }, before: log(3) },
      { view: 'e', pelvis: P(F, -3, -8), lean: 34, tilt: -10, feet: stance, tool: axe([2, -6], [24, -34], 0.12), elbows: { near: 1, far: 1 }, before: log(4) },
      { view: 'e', pelvis: P(F, -3, -6), lean: 22, tilt: -4, twist: 0.2, feet: stance, tool: axe([2, 2], [30, 6], 0.2), elbows: { near: 1, far: 1 }, before: log(4) },
    ];
  },
  // Lifting a wall log (item 3): stooped with both hands under the log's end, then the end up on the shoulder. The log runs
  // from the hands to the frame's right edge, so two people facing each other across a frame read as one log between them.
  lift: F => {
    const r = 6 * g(F), far = 70 * g(F);
    return [
      { view: 'e', pelvis: P(F, -6, -11), lean: 52, tilt: -14, feet: { near: foot(F, 8), far: foot(F, -9) }, hands: { near: pt(F, 17, 2.5), far: pt(F, 14, 3.5) }, elbows: { near: 1, far: 1 },
        before: ink => W.drawWallLog(ink, 15 * g(F), far, r - 0.5, r, { end: 'rough' }), after: (ink, j) => skinHand(ink, j.handNear, F) },
      { view: 'e', pelvis: P(F, -1, -2), lean: 8, tilt: -4, feet: { near: foot(F, 8), far: foot(F, -9) }, hands: { near: at(F, 7, 3), far: at(F, 4, -5) }, elbows: { near: -1, far: -1 },
        after: (ink, j) => { W.drawWallLog(ink, 1 * g(F), far, j.S[1] + r * 0.7, r, { end: 'rough' }); skinHand(ink, j.handNear, F); } },
    ];
  },
  // Harvesting corn (item 5): reaching up to an ear, snapping it off, dropping it in the sack at the hip, a step on.
  reap: F => {
    const stance = { near: foot(F, 7), far: foot(F, -7) };
    const sack = (ink, j) => W.drawHipSack(ink, add(j.P, pt(F, 5, -3)), add(j.N, pt(F, -3, -1)), { full: 0.6 });
    const ear = (ink, j) => W.drawEar(ink, add(j.handNear, pt(F, -1, -2)), add(j.handNear, pt(F, 1.5, 5)), { husk: true });
    const both = (ink, j) => { sack(ink, j); ear(ink, j); };
    return [
      { view: 'e', pelvis: P(F, -1, 0), lean: -4, tilt: 10, feet: stance, hands: { near: at(F, 14, 20), far: at(F, 5, -20) }, elbows: { near: -1, far: 1 }, after: both },
      { view: 'e', pelvis: P(F, -1, -1), lean: 2, tilt: 4, feet: stance, hands: { near: at(F, 12, 8), far: at(F, 5, -20) }, elbows: { near: -1, far: 1 }, after: both },
      { view: 'e', pelvis: P(F, -1, -2), lean: 12, tilt: -8, feet: stance, hands: { near: at(F, 9, -24), far: at(F, 4, -22) }, elbows: { near: 1, far: 1 }, after: both },
      { view: 'e', pelvis: P(F, 1, -1), lean: 6, feet: { near: foot(F, 10, 2.5), far: stance.far }, hands: { near: at(F, 6, -22), far: at(F, 3, -20) }, elbows: { near: 1, far: 1 }, after: sack },
    ];
  },
  // Making things (item 6): astride a shaving horse drawing a drawknife toward the body (two frames), then boring with an
  // auger (two), the treadle under the feet clamping the work.
  carpentry: F => {
    const top = seatY(F) - F.B.limb * 0.62, front = 40 * g(F), seatX = -3 * g(F);
    const work = [pt(F, 12, top / g(F) + 3.5), pt(F, 38, top / g(F) + 9)];
    const base = { view: 'e', pelvis: [seatX, seatY(F)], feet: { near: foot(F, 17, 1), far: foot(F, 14, 1) }, knees: { near: 1, far: 1 }, scale: SIT_SCALE, elbows: { near: -1, far: -1 },
      before: ink => W.drawShavingHorse(ink, seatX, top, front, { layer: 'back' }) };
    const bench = ink => { W.drawShavingHorse(ink, seatX, top, front, { layer: 'front' }); W.drawStick(ink, work[0], work[1], { cut: 0.1 }); };
    const bore = work[1] ? lerp(work[0], work[1], 0.62) : null;
    return [
      { ...base, lean: 40, hands: { near: pt(F, 29, 26.5), far: pt(F, 30, 28) }, after: (ink, j) => { bench(ink); W.drawDrawknife(ink, j.handNear, j.handFar); } },
      { ...base, lean: 18, hands: { near: pt(F, 17, 24), far: pt(F, 18, 25.5) }, after: (ink, j) => { bench(ink); W.drawDrawknife(ink, j.handNear, j.handFar); W.drawCurl(ink, add(j.handNear, pt(F, 3, -4)), 1.2 * g(F)); W.drawCurl(ink, pt(F, 14, 3), g(F)); } },
      { ...base, lean: 30, hands: { near: pt(F, 25, 37), far: pt(F, 30, 38) }, after: ink => { bench(ink); W.drawAuger(ink, pt(F, 28, 37.5), bore, 0.3); } },
      { ...base, lean: 32, hands: { near: pt(F, 30, 37), far: pt(F, 26, 38) }, after: ink => { bench(ink); W.drawAuger(ink, pt(F, 28, 37.5), bore, 1.3); W.drawCurl(ink, add(bore, pt(F, 2, 1)), 0.8 * g(F)); } },
    ];
  },
  // A civilian with a rifle (item 7), in the figure's own clothes: the long rifle level at the shoulder; then the recoil (the
  // muzzle thrown up, the chest back) and the rifle lowered to the port. The smoke stays the library's `musket-smoke`.
  aim: F => [rifleStance(F, { lean: 10, tilt: -6, butt: [1, 1], muzzle: [58, 3], near: 0.22, far: 0.5 })],
  fire: F => [
    rifleStance(F, { lean: 3, tilt: 2, butt: [-2, 3], muzzle: [54, 13], near: 0.22, far: 0.5, dx: -1 }),
    rifleStance(F, { lean: 6, tilt: -2, butt: [-3, -14], muzzle: [44, -28], near: 0.24, far: 0.52, dx: -0.5 }),
  ],
  // Fishing (item 8): sitting on the bank, knees up, the cane pole out over the water, the line down to a float; the pole twitched up.
  fish: F => [0, 1].map(i => {
    const butt = pt(F, -4, 22), tip = i ? pt(F, 44, 76) : pt(F, 48, 66), float = pt(F, FISH_FLOAT[0], FISH_FLOAT[1] + (i ? 1.2 : 0));
    return { view: 'e', pelvis: [-5 * g(F), F.ankle + F.B.limb * 0.55], lean: 16 + i * 2, feet: { near: foot(F, 13), far: foot(F, 10) }, knees: { near: 1, far: 1 }, scale: SIT_SCALE,
      hands: { near: lerp(butt, tip, i ? 0.2 : 0.17), far: lerp(butt, tip, 0.1) }, elbows: { near: -1, far: -1 },
      after: ink => W.drawCanePole(ink, butt, tip, float) };
  }),
  // Stooping to gather (item 9): bent to the ground picking something up, then putting it in the basket beside the feet.
  gather: F => {
    const basket = ink => W.drawBasket(ink, pt(F, 23, 0), { w: 12 * g(F), h: 7 * g(F), fill: '#d8c28a' });
    return [
      { view: 'e', pelvis: P(F, -6, -10), lean: 62, tilt: -16, feet: { near: foot(F, 8), far: foot(F, -9) }, hands: { near: pt(F, 15, 2.5), far: pt(F, 9, 12) }, elbows: { near: 1, far: 1 },
        after: (ink, j) => { basket(ink); ink.dot(oval(j.handNear, 1.4, 1.1), '#e8dcc4'); } },
      { view: 'e', pelvis: P(F, -4, -6), lean: 40, tilt: -12, feet: { near: foot(F, 8), far: foot(F, -9) }, hands: { near: pt(F, 22, 10), far: pt(F, 10, 18) }, elbows: { near: 1, far: 1 }, after: basket },
    ];
  },
  // Dressing meat (item 10), non-graphic: at a plank table cutting a joint wrapped in cloth; no carcass, no blood.
  butcher: F => {
    const top = 36 * g(F), table = layer => ink => W.drawTable(ink, 13 * g(F), 46 * g(F), top, { layer });
    return [0, 1].map(i => ({ view: 'e', pelvis: P(F, -1, -2), lean: 18 + i * 6, tilt: -8, feet: { near: foot(F, 5), far: foot(F, -8) },
      hands: { far: pt(F, 20, top / g(F) + 4), near: i ? pt(F, 28, top / g(F) + 6) : pt(F, 29, top / g(F) + 14) }, elbows: { near: -1, far: 1 },
      before: table('back'),
      after: (ink, j) => { table('front')(ink); W.drawJoint(ink, pt(F, 27, top / g(F) + 0.4), { w: 13 * g(F), h: 6 * g(F) }); skinHand(ink, j.handFar, F); W.drawKnife(ink, j.handNear, [0.25, -1], { blade: 6 * g(F) }); skinHand(ink, j.handNear, F); } }));
  },
  // In the army's camp (item 11): stepping out with the rifle at the shoulder; and standing sentry, the rifle sloped, the head
  // turned round to the camera.
  drill: F => {
    const s = F.B.thigh * 0.9, arm = F.B.upperArm + F.B.forearm;
    const steps = [
      { pelvis: P(F, 0, -1.6), lean: 3, feet: { near: foot(F, s), far: foot(F, -s * 0.95, 1.5) }, far: at(F, 10, -arm * 0.75) },
      { pelvis: P(F, 0, 0.4), lean: 2, feet: { near: foot(F, 1), far: foot(F, -3, 6) }, far: at(F, 1, -arm * 0.9) },
      { pelvis: P(F, 0, -1.6), lean: 3, feet: { near: foot(F, -s * 0.95, 1.5), far: foot(F, s) }, far: at(F, -8, -arm * 0.8) },
      { pelvis: P(F, 0, 0.4), lean: 2, feet: { near: foot(F, -3, 6), far: foot(F, 1) }, far: at(F, 0, -arm * 0.9) },
    ];
    return steps.map(f => { const hand = add(at(F, 6, -12), [0, f.pelvis[1] - F.hip]);
      return { view: 'e', pelvis: f.pelvis, lean: f.lean, feet: f.feet, tool: shouldered(F, hand), hands: { near: hand, far: f.far }, elbows: { near: 1, far: 1 } }; });
  },
  guard: F => {
    const hand = at(F, 6, -12);
    return [
      { view: 'e', pelvis: P(F, -1), lean: 1, feet: { near: foot(F, 3.5), far: foot(F, -3) }, tool: shouldered(F, hand), hands: { near: hand }, elbows: { near: 1, far: 1 } },
      { view: 's', hands: { left: pt(F, -7, 46) }, after: ink => { W.drawLongRifle(ink, pt(F, -9, 43), pt(F, -19, 99), -1); skinHand(ink, pt(F, -7, 46), F); } },
    ];
  },
  // Surveying (item 12): a mallet raised over a stake and driving it in, stooped over it.
  stake: F => {
    const stance = { near: foot(F, 7), far: foot(F, -9) };
    const mallet = (grip, aim) => ({ kind: 'mallet', grip: pt(F, ...grip), aim: pt(F, ...aim), near: 0.12, far: 0.12, side: 1 });
    const down = { view: 'e', pelvis: P(F, -4, -7), lean: 44, tilt: -14, feet: stance, tool: mallet([13, 22], [30, 18]), hands: { far: pt(F, 12, 21) }, elbows: { near: 1, far: 1 } };
    const [face] = headFaces(down.tool, 3.2, 2.4);
    const stake = ink => W.drawStake(ink, face[0], face[1] - 0.3);
    return [
      { view: 'e', pelvis: P(F, -4, -5), lean: 32, tilt: -8, feet: stance, tool: mallet([10, 46], [6, 66]), hands: { far: pt(F, 14, 24) }, elbows: { near: -1, far: 1 }, before: stake },
      { ...down, before: stake },
    ];
  },
  // Keeping a fire (item 14): kneeling, feeding a stick into a small fire (the fire in the frame), then down low blowing on it.
  'tend-fire': F => {
    const fire = pt(F, FIRE_AT, 0);
    return [
      kneeling(F, { lean: 30, hands: { near: pt(F, 18, 11), far: pt(F, 13, 19) }, after: (ink, j) => W.drawSmallFire(ink, fire, { k: 0.85 * g(F), stick: [j.handNear, add(fire, pt(F, -1, 2))] }) }),
      kneeling(F, { lean: 58, tilt: -14, dy: -2, mouth: 'open', hands: { near: pt(F, 16, 6), far: pt(F, 13, 9) }, after: (ink, j) => { W.drawSmallFire(ink, fire, { k: 1.3 * g(F) }); W.wisp(ink, add(j.H, pt(F, 5, -4)), 0.7 * g(F), 0.5); } }),
    ];
  },
};

/** Frame timings and the frame the work lands on (`beat`), for each work clip; the swings take kit/poses.mjs SWINGS. */
export const WORK_TIMING = {
  notch: { durations: [340, 110, 300, 200], beat: 2 },
  lift: { durations: [700, 900], beat: 1 },
  reap: { durations: [320, 220, 300, 260], beat: 1 },
  carpentry: { durations: [420, 380, 320, 320], beat: 1 },
  aim: { durations: [1000] },
  // The -fire clip opens on the aim held (the aim frame), then the recoil and the lowering: the shot is its second frame.
  fire: { durations: [1400, 160, 900], beat: 1, frames: ['aim-1', 'fire-1', 'fire-2'] },
  fish: { durations: [1500, 450], beat: 1 },
  gather: { durations: [520, 420] },
  butcher: { durations: [420, 360], beat: 1 },
  drill: { durations: [220, 220, 220, 220] },
  guard: { durations: [1600, 1200] },
  stake: { durations: [440, 260], beat: 1 },
  'tend-fire': { durations: [700, 650], beat: 1 },
};

// -----------------------------------------------------------------------------------------------------------------------
// Soldiers at rest (request 2026-09-28 — ambient life, item 3), for the volunteer and the regular: sitting on a log by the
// fire. Her military sheets are not normalised to the row as her cast's seated poses are (`volunteer-load` stands 0.64 of the
// height), so these are drawn at the soldiers' own size, not SIT_SCALE.
const logSeat = F => ink => { const top = seatY(F) - F.B.limb * 0.6, r = top / 2; W.drawWallLog(ink, -12 * g(F), 7 * g(F), r, r, { end: 'rough', colour: '#7a5a38' }); };
export const CAMP = {
  'clean-rifle': F => [0, 1].map(i => ({ ...seated(F, { lean: 14, hands: { far: pt(F, 20, 31.5), near: i ? pt(F, 32, 33.5) : pt(F, 12, 31.5) }, tool: { kind: 'rifle', butt: pt(F, -8, 29), tip: pt(F, 44, 33), side: 1 }, after: (ink, j) => W.drawRag(ink, j.handNear) }),
    before: logSeat(F), scale: 1 })),
  'camp-sit': F => [0, 1].map(i => ({ ...seated(F, { lean: 20 - i * 12, tilt: i ? -10 : 6, feet: { near: foot(F, 15), far: foot(F, 11) },
    hands: { near: i ? add(headOf(F, 8, -3), [F.B.head * 1.2, -F.B.head * 1.3]) : pt(F, 14, 29), far: pt(F, 12, 28) },
    after: (ink, j) => { if (i) W.drawCup(ink, j.handNear); } }), before: logSeat(F), scale: 1 })),
  'camp-cook': F => {
    const fire = pt(F, 25, 0);
    return [0, 1].map(i => ({ ...kneeling(F, { lean: 32 + i * 4, hands: { near: pt(F, 20 + i * 3, 17), far: pt(F, 15, 18) },
      after: (ink, j) => { W.drawSmallFire(ink, fire, { k: 0.7 * g(F) }); W.drawPot(ink, add(fire, pt(F, 0, 4)), g(F)); W.drawSpoon(ink, j.handNear, add(fire, pt(F, i ? 2 : -1.5, 10))); W.wisp(ink, add(fire, pt(F, i ? -2 : 2, 12)), 0.9 * g(F), 0.5); } }), scale: 1 }));
  },
};
export const CAMP_TIMING = { 'clean-rifle': [480, 480], 'camp-sit': [1500, 1100], 'camp-cook': [520, 520] };

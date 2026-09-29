// Béxar's own people, the fandango and the bell (area E, 2026-09-28): Claude-drawn stand-ins, temporary, each to be replaced
// by Astra's frame or clip of the same name.
//
//   E1  request 2026-09-27 (the milk cow on the run, and Béxar before the bell), item 2, and request 2026-09-25 (the storming
//       of Béxar), item 6: the Tejano townspeople - `bexar-man`, `bexar-woman`, `bexar-girl`, `bexar-boy` - in every pose the
//       town scenes ask a townsperson for (public/town-scenes.js `sceneClip`): `-walk` (4, east), `-walk-s`, `-walk-n` (2),
//       `-idle-s`, `-idle-e`, `-idle-w`, `-idle-n`, `-listen-s`, `-listen-n`, `-speak` (2, east), `-carry` (4, east).
//   E8  the same request, item 4: the fandango - `dancers-couple` (4: a man and a woman dancing, one frame drawing both),
//       `fiddler-play` (2) and `lantern-post` (a lit lantern hung on a post, one prop frame).
//   E9  request 2026-09-26 (the bell at Béxar), items 1-2: `sentry-bell-ring-1`..`-4` (a man on a flat church roof beside a
//       small bell arch, pulling the rope, then pointing; drawn east, mirrored by the battle to point west) and
//       `townsfolk-leave-1`..`-4` (a Tejano family going east: a man leading an ox and a laden carreta, a woman with a child).
//
// Dress. Tejano dress of 1835-36 is drawn as an ORIGINAL INTERPRETATION, not a costume plate: the men in a short dark jacket
// over a shirt, a red sash (faja) at the waist, trousers of buckskin colour (calzoneras) and a wide-brimmed, low-crowned
// sombrero; the women in a blouse, a full skirt and a rebozo shawl over head and shoulders; the children in plain cotton.
// Sources: docs/ART_REQUESTS.md (the requests above, "1830s Béxar dress"), docs/CLAUDE_ART_PLAN.md E1 ("rebozo, short jacket,
// sombrero; original interpretations"), and Astra's own interpretations in this library - `famous-seguin` (a short dark
// jacket, sash, pale trousers, wide brim) and `famous-alavez` (a rebozo, a cream blouse, a long skirt) - which these are
// judged beside. Which colours, which hat, whether a woman wore the rebozo over her head in the street: not documented here;
// chosen for reading at play size, not claimed as fact.
//
// The figures are specs for the kit's person rig (kit/rig.mjs `drawPerson` takes a figure object as well as a CAST name), so
// the shared CAST list is not touched. What the rig has no clothing for - the sash, the short jacket's hem and open front,
// the rebozo - is drawn here over the rig's joints: under the near arm through `pose.overBody` (a hook added to the kit for
// this, 2026-09-28, backward compatible), over everything through `pose.after`.
//
// ceiling: the rig's puppet at 40 px - a readable silhouette and palette, not Astra's painting; the rebozo is one flat shape
// with a striped edge, the dance four poses, the ox a plain barrel on four legs. Her sheets of the same names replace them.
import { personFrame, drawPerson, frameOf, ik } from '../kit/rig.mjs';
import { POSES } from '../kit/poses.mjs';
import { drawSack } from '../kit/props.mjs';
import { Ink, add, sub, mul, lerp, norm, capsule, blob, curve, poly, ellipse, up, deg, f2, frameSvg } from '../kit/svg.mjs';
import { LINE, PEOPLE, UNIT, tone } from '../kit/style.mjs';

export const AREA = 'places';
export const DATE = '2026-09-28';

const REQ_TOWN = 'Request 2026-09-27 — the milk cow on the run, and Béxar before the bell';
const REQ_BELL = 'Request 2026-09-26 — the bell at Béxar';
const SOURCES = 'Original interpretation of Tejano dress of 1835-36, not a documented costume (sources: docs/ART_REQUESTS.md, the request; docs/CLAUDE_ART_PLAN.md E1 "rebozo, short jacket, sombrero"; Astra\'s famous-seguin and famous-alavez in this library as the style and dress reference).';
const STYLE = 'Warm hand-drawn storybook style as Astra\'s civilians and people-walk: thin dark olive-brown outline, flat shade to the lower right, transparent ground, no shadow, no text.';

// ------------------------------------------------------------------------------------------------------------ the figures
// Each is a rig spec (the shape of kit/style.mjs CAST) plus `bx`, the clothing this module draws over the rig.
export const FIGURES = Object.freeze({
  // A man of Béxar: a wide straw sombrero, a short dark jacket open over a cream shirt, a red sash, buckskin trousers, a moustache.
  'bexar-man': { sex: 'm', age: 'adult', skin: '#b97a4c', hair: '#241812', hairStyle: 'short', moustache: '#241812',
    hat: { kind: 'wide', colour: '#d6b879', band: '#4a2a18' }, shirt: '#efe4cc', coat: '#3d3024', lower: { kind: 'trousers', colour: '#8c6a45' }, feet: '#3a2616',
    bx: { jacket: true, sash: '#b0362a' } },
  // A woman of Béxar: a slate-blue rebozo with a pale striped border over her head and shoulders, a cream blouse, a full madder skirt.
  'bexar-woman': { sex: 'f', age: 'adult', skin: '#b87850', hair: '#221612', hairStyle: 'bun', shirt: '#f0e2c4', lower: { kind: 'skirt', colour: '#8e3a2c' }, feet: '#3a2414',
    bx: { rebozo: '#46607a', stripe: '#e2d2ae', hood: true } },
  // A girl: plain cotton - a cream blouse, an indigo skirt, a small rose rebozo on her shoulders, her hair tied back, barefoot.
  'bexar-girl': { sex: 'f', age: 'child', skin: '#c08050', hair: '#241814', hairStyle: 'bun', shirt: '#f2e6cc', lower: { kind: 'skirt', colour: '#4a6482', short: true }, feet: null,
    bx: { rebozo: '#b25a48', stripe: '#f0d8b0', hood: false } },
  // A boy: plain cotton - an unbleached shirt, faded indigo trousers rolled at the shin, a small straw hat, dark hair, barefoot.
  'bexar-boy': { sex: 'm', age: 'child', skin: '#b87648', hair: '#20150f', hairStyle: 'short', hat: { kind: 'slouch', colour: '#d6b879', band: '#6a4a2a' },
    shirt: '#efe4c8', lower: { kind: 'trousers', colour: '#5d6f82', rolled: true }, feet: null, bx: {} },
});
// The fiddler at the fandango: an older man of the town, grey at the temples, in a dark blue jacket and a dark felt sombrero.
const FIDDLER = { sex: 'm', age: 'elder', skin: '#a86c44', hair: '#8a8478', hairStyle: 'short', moustache: '#9a948a',
  hat: { kind: 'wide', colour: '#4a3a2a', band: '#241810' }, shirt: '#efe4cc', coat: '#2f3a4e', lower: { kind: 'trousers', colour: '#6e5436' }, feet: '#2e1e12',
  bx: { jacket: true, sash: '#b0362a' } };
// The woman at the dance: the same woman of Béxar, her rebozo let down onto her shoulders.
const DANCER = { ...FIGURES['bexar-woman'], bx: { ...FIGURES['bexar-woman'].bx, hood: false } };
const SENTRY = { sex: 'm', age: 'soldier', skin: '#d59a66', hair: '#4a3222', hat: { kind: 'slouch', colour: '#6a5236', band: '#3a2a1a' }, beard: '#4a3222',
  shirt: '#d8c49a', coat: '#6b4a2e', lower: { kind: 'trousers', colour: '#b89a6a' }, feet: '#4b2e1a', belt: '#4a2e1a' }; // the kit's `volunteer`

// ------------------------------------------------------------------------------------------------------------ geometry
const rot = ([x, y], a) => { const c = Math.cos(deg(a)), s = Math.sin(deg(a)); return [x * c - y * s, x * s + y * c]; };
/** The side view's frame of the body, as kit/rig.mjs drawTorsoSide builds it: `at(u, v)`, u forward in depth-sixths, v up the torso. */
function sideBody(F, pose, j) {
  const lean = pose.lean || 0, k = F.B.depth / 6.5, t = up(lean), fwd = [Math.cos(deg(lean)), -Math.sin(deg(lean))];
  return { T: F.B.torso, at: (u, v) => add(add(j.P, mul(fwd, u * k)), mul(t, v)), a: lean + (pose.tilt || 0) };
}
/** A point of the head in head radii (x toward the face), as kit/head.mjs draws it. */
const headAt = (F, j, a) => (x, y) => add(j.H, rot([x * F.B.head, y * F.B.head], -a));

// The man's sash, the jacket's hem and its open front; the boy's sash. Under the near arm.
function jacketSide(ink, F, spec, pose, j) {
  const { T, at } = sideBody(F, pose, j), bx = spec.bx;
  if (bx.jacket) {
    // Below the jacket's short hem: the trousers' top; the shirt showing down the open front.
    ink.shape(blob([at(-6.9, -2.4), at(-7.1, T * 0.2), at(7.1, T * 0.2), at(6.9, -2.4)], 0.5), spec.lower.colour, { off: 0.8 });
    ink.shape(poly([at(2.6, T * 1.0), at(6.9, T * 0.96), at(7.1, T * 0.36), at(4.4, T * 0.36)]), spec.shirt, { shade: false, outline: LINE.inner });
    ink.line(curve([at(2.6, T * 1.0), at(3.8, T * 0.7), at(4.4, T * 0.36)]), { width: LINE.inner, colour: tone(spec.coat, -0.4) });
  }
  if (bx.sash) {
    // A wide red sash, its knot and ends at the far hip.
    ink.shape(blob([at(-7.3, T * 0.04), at(-7.5, T * 0.32), at(7.4, T * 0.32), at(7.2, T * 0.04)], 0.4), bx.sash, { off: 0.6, outline: LINE.inner + 0.6 });
    ink.shape(blob([at(-6.2, T * 0.2), at(-8.6, T * 0.12), at(-9.6, T * -0.28), at(-7.4, T * -0.3), at(-6, T * 0.02)], 0.6), tone(bx.sash, -0.12), { off: 0.5, outline: LINE.inner + 0.6 });
  }
}
function jacketFront(ink, F, spec, j) {
  const T = F.B.torso, { P, hw, sw, back } = j, bx = spec.bx, at = (x, v) => add(P, [x, v]);
  if (bx.jacket) {
    ink.shape(blob([at(-hw * 1.14, -2.6), at(-hw * 1.2, T * 0.2), at(hw * 1.2, T * 0.2), at(hw * 1.14, -2.6)], 0.4), spec.lower.colour, { off: 0.8 });
    if (!back) {
      ink.shape(poly([at(-sw * 0.42, T * 1.02), at(sw * 0.42, T * 1.02), at(hw * 0.42, T * 0.34), at(-hw * 0.42, T * 0.34)]), spec.shirt, { shade: false, outline: LINE.inner });
      for (const s of [-1, 1]) ink.line(curve([at(s * sw * 0.42, T * 1.02), at(s * sw * 0.5, T * 0.7), at(s * hw * 0.42, T * 0.34)]), { width: LINE.inner, colour: tone(spec.coat, -0.4) });
    }
  }
  if (bx.sash) {
    ink.shape(blob([at(-hw * 1.22, T * 0.04), at(-hw * 1.24, T * 0.32), at(hw * 1.24, T * 0.32), at(hw * 1.22, T * 0.04)], 0.4), bx.sash, { off: 0.6, outline: LINE.inner + 0.6 });
    if (!back) ink.shape(blob([at(hw * 0.7, T * 0.18), at(hw * 1.1, T * 0.1), at(hw * 1.05, T * -0.35), at(hw * 0.7, T * -0.3)], 0.5), tone(bx.sash, -0.12), { off: 0.5, outline: LINE.inner + 0.6 });
  }
}

// The rebozo. Side view: the back drape under the near arm, the hood (or, let down, the shawl at the neck) over the head.
function rebozoBackSide(ink, F, spec, pose, j) {
  const { T, at } = sideBody(F, pose, j), c = spec.bx.rebozo;
  const drape = [at(-1.5, T * 1.1), at(3.4, T * 1.04), at(5.8, T * 0.8), at(4.2, T * 0.52), at(0, T * 0.4), at(-6, T * 0.08), at(-9.4, T * -0.12), at(-9.2, T * 0.45), at(-7.6, T * 0.95)];
  ink.shape(blob(drape, 0.7), c, { off: 1.2 });
  ink.line(curve([at(3, T * 0.92), at(3.4, T * 0.56), at(0, T * 0.47), at(-6, T * 0.16), at(-8.6, T * -0.04)]), { width: LINE.inner + 0.4, colour: spec.bx.stripe, opacity: 0.9 });
  // The fringe at its end, down the back.
  for (let i = 0; i < 5; i++) { const p = lerp(at(-6, T * 0.08), at(-9.4, T * -0.12), i / 4); ink.line(`M ${f2(p[0])} ${f2(p[1])} l ${f2(-0.4)} ${f2(-3.2)}`, { width: LINE.fine, colour: tone(c, -0.35) }); }
}
function hoodSide(ink, F, spec, pose, j) {
  const { T, at, a } = sideBody(F, pose, j), R = headAt(F, j, a), c = spec.bx.rebozo;
  if (spec.bx.hood) {
    const hood = [R(0.5, 1.0), R(0.05, 1.32), R(-0.75, 1.24), R(-1.3, 0.55), R(-1.4, -0.35), R(-1.3, -1.05), at(-5.5, T * 1.0), at(-1, T * 1.1), R(0.12, -1.12), R(0.2, -0.55), R(0.28, 0.2), R(0.38, 0.72)];
    ink.shape(blob(hood, 0.75), c, { off: 1.1, lift: true });
    ink.line(curve([R(0.42, 0.9), R(0.3, 0.45), R(0.2, -0.2), R(0.1, -0.9)]), { width: LINE.inner + 0.4, colour: spec.bx.stripe, opacity: 0.9 });
  } else {
    // Let down: a roll of shawl round the back of the neck.
    ink.shape(blob([at(-6.5, T * 0.98), at(-3, T * 1.14), at(3.2, T * 1.08), at(4.4, T * 0.94), at(-1, T * 0.9)], 0.7), c, { off: 0.8 });
  }
}
// Toward and away from the camera: the front ends hang under the arms; the hood and the shawl over the shoulders go over them.
function rebozoFrontUnder(ink, F, spec, j) {
  if (j.back) return;
  const T = F.B.torso, { P, sw } = j, c = spec.bx.rebozo, at = (x, v) => add(P, [x, v]);
  for (const s of [-1, 1]) {
    ink.shape(blob([at(s * sw * 0.3, T * 0.98), at(s * sw * 0.98, T * 0.9), at(s * sw * 0.92, T * 0.1), at(s * sw * 0.62, T * -0.18), at(s * sw * 0.38, T * 0.3)], 0.6), c, { off: 0.9 });
    for (let i = 0; i < 4; i++) { const p = lerp(at(s * sw * 0.9, T * 0.08), at(s * sw * 0.6, T * -0.2), i / 3); ink.line(`M ${f2(p[0])} ${f2(p[1])} l 0 -3`, { width: LINE.fine, colour: tone(c, -0.35) }); }
  }
}
function rebozoFrontOver(ink, F, spec, j) {
  const T = F.B.torso, h = F.B.head, sw = F.B.shoulderW * 0.5 * F.B.body, { N, H } = j, back = j.back, c = spec.bx.rebozo;
  const R = (x, y) => add(H, [x * h, y * h]), at = (x, v) => add(N, [x, v]);
  const hood = spec.bx.hood;
  if (back) {
    // From behind: the shawl over the head (or the neck) and down the back to the waist, fringed.
    const top = hood ? [R(-1.3, 0.3), R(-0.9, 1.25), R(0, 1.42), R(0.9, 1.25), R(1.3, 0.3)] : [at(-sw * 0.5, 2)];
    ink.shape(blob([...top, at(sw * 1.18, -1), at(sw * 0.86, -T * 0.6), at(0, -T * 0.74), at(-sw * 0.86, -T * 0.6), at(-sw * 1.18, -1)], 0.7), c, { off: 1.2, lift: true });
    ink.line(curve([at(-sw * 0.82, -T * 0.5), at(0, -T * 0.63), at(sw * 0.82, -T * 0.5)]), { width: LINE.inner + 0.4, colour: spec.bx.stripe, opacity: 0.9 });
    for (let i = 0; i < 7; i++) { const p = lerp(at(-sw * 0.78, -T * 0.62), at(sw * 0.78, -T * 0.62), i / 6); ink.line(`M ${f2(p[0])} ${f2(p[1] - (i === 3 ? 1.6 : 0.8))} l 0 -3`, { width: LINE.fine, colour: tone(c, -0.35) }); }
    return;
  }
  // Over the shoulders to the upper arm, open at the throat.
  for (const s of [-1, 1]) {
    ink.shape(blob([at(s * sw * 0.2, 1.6), at(s * sw * 0.8, 2.2), at(s * sw * 1.24, -2), at(s * sw * 1.26, -T * 0.36), at(s * sw * 0.9, -T * 0.3), at(s * sw * 0.5, -T * 0.12), at(s * sw * 0.26, -1)], 0.7), c, { off: 1, lift: s < 0 });
    ink.line(curve([at(s * sw * 0.28, -0.6), at(s * sw * 0.55, -T * 0.1), at(s * sw * 0.92, -T * 0.26)]), { width: LINE.inner + 0.4, colour: spec.bx.stripe, opacity: 0.9 });
  }
  if (hood) {
    // Over the head, framing the face: a horseshoe from the shoulders round the top of the head.
    const outer = [R(-1.3, -1.05), R(-1.42, -0.05), R(-1.2, 0.95), R(-0.5, 1.42), R(0.5, 1.42), R(1.2, 0.95), R(1.42, -0.05), R(1.3, -1.05)];
    const inner = [R(0.98, -0.75), R(1.02, 0.15), R(0.78, 0.84), R(0, 1.02), R(-0.78, 0.84), R(-1.02, 0.15), R(-0.98, -0.75)];
    ink.shape(blob([...outer, ...inner], 0.6), c, { off: 1, lift: true });
    ink.line(curve([R(-1.1, -0.9), R(-1.12, 0.2), R(-0.85, 0.95), R(0, 1.14), R(0.85, 0.95), R(1.12, 0.2), R(1.1, -0.9)]), { width: LINE.inner + 0.4, colour: spec.bx.stripe, opacity: 0.9 });
  }
}

/** The clothing hooks for a figure spec, added to a pose (keeping any `after` the pose already has, e.g. carry's sack). */
function dressed(F, spec, pose) {
  const bx = spec.bx || {}, frontal = pose.view === 's' || pose.view === 'n';
  const out = { ...pose };
  const under = [], over = [];
  // The pose's own layer first (the dancer's swung skirt), then the clothes over it.
  if (pose.overBody) under.push(pose.overBody);
  if (bx.jacket || bx.sash) under.push(frontal ? (ink, j) => jacketFront(ink, F, spec, j) : (ink, j) => jacketSide(ink, F, spec, pose, j));
  if (bx.rebozo) {
    if (frontal) { under.push((ink, j) => rebozoFrontUnder(ink, F, spec, j)); over.push((ink, j) => rebozoFrontOver(ink, F, spec, j)); }
    else { under.push((ink, j) => rebozoBackSide(ink, F, spec, pose, j)); over.push((ink, j) => hoodSide(ink, F, spec, pose, j)); }
  }
  if (pose.after) over.push(pose.after);
  // The frontal joints carry no back flag of their own after the body hook; remember it for the one over everything.
  let last = null;
  if (under.length) out.overBody = (ink, j) => { last = j; for (const f of under) f(ink, j); };
  if (over.length) out.after = (ink, j) => { const k = { ...last, ...j }; for (const f of over) f(ink, k); };
  return out;
}
const draw = (spec, pose) => ink => drawPerson(ink, spec, dressed(frameOf(spec), spec, pose));

/** Draw into a group of `ink` moved by (dx, dy) rig units, scaled, and mirrored if `flip` (a figure facing west). */
function place(ink, name, paint, { dx = 0, dy = 0, flip = false, scale = 1 } = {}) {
  const sub = new Ink(`${ink.prefix}-${name}`, ink.k * scale, { yUp: true });
  paint(sub);
  ink.defs.push(...sub.defs);
  ink.raw(`<g transform="translate(${f2(dx)} ${f2(dy)})${scale !== 1 ? ` scale(${f2(scale)})` : ''}${flip ? ' scale(-1 1)' : ''}">${sub}</g>`);
}

// ------------------------------------------------------------------------------------------------------------ poses
// Numbers as kit/poses.mjs: a grown figure's hips at 39; `g` scales them to the figure's own size.
const g = F => F.hip / 39;
const Pv = (F, dx = 0, dy = 0) => [dx * g(F), F.hip + dy * g(F)];
const foot = (F, x, lift = 0) => [x * g(F), F.ankle + lift * g(F)];
const atS = (F, x, y) => [x * g(F), F.neck - 3 + y * g(F)];

const OWN = {
  // Listening, toward the camera: the hands folded in front at the waist.
  'listen-s': F => [{ view: 's', hands: { left: [-2.6 * g(F), F.hip + F.B.torso * 0.26], right: [2.6 * g(F), F.hip + F.B.torso * 0.3] } }],
  'listen-n': F => [{ view: 'n', hands: { left: [-3 * g(F), F.hip + F.B.torso * 0.26], right: [3 * g(F), F.hip + F.B.torso * 0.3] } }],
};
const CARRY_SACK = { 'bexar-man': '#b89a64', 'bexar-woman': '#c8ae7a', 'bexar-girl': '#c8ae7a', 'bexar-boy': '#b89a64' };
/** Every pose a townsperson is asked for, as [clip, frames of poses, mirror?]. */
function townPoses(figure) {
  const spec = FIGURES[figure], F = frameOf(spec);
  // The sack on the shoulder behind the head, the near hand up at it.
  const carry = POSES.carry(F).map(frame => ({ ...frame, hands: { ...frame.hands, near: atS(F, -2, 11) },
    after: (ink, j) => drawSack(ink, add(j.S, [-10 * g(F), 5 * g(F)]), { size: g(F) * 1.1, colour: CARRY_SACK[figure] }) }));
  return [
    ['walk', POSES.walk(F)], ['walk-s', POSES['walk-s'](F)], ['walk-n', POSES['walk-n'](F)],
    ['idle-s', POSES['idle-s'](F)], ['idle-e', POSES['idle-e'](F)], ['idle-w', POSES['idle-e'](F), true], ['idle-n', POSES['idle-n'](F)],
    ['listen-s', OWN['listen-s'](F)], ['listen-n', OWN['listen-n'](F)], ['speak', POSES.speak(F)], ['carry', carry],
  ];
}
const WHAT = {
  walk: n => `walking east, frame ${n} of 4 (near foot forward, passing, far foot forward, passing)`,
  'walk-s': n => `walking toward the camera, frame ${n} of 2`, 'walk-n': n => `walking away from the camera, frame ${n} of 2`,
  'idle-s': () => 'standing, facing the camera', 'idle-e': () => 'standing, side on, facing east', 'idle-w': () => 'standing, side on, facing west',
  'idle-n': () => 'standing, seen from behind', 'listen-s': () => 'listening, toward the camera, the hands folded at the waist',
  'listen-n': () => 'listening, seen from behind', speak: n => n === 1 ? 'speaking, facing east, the forearm raised, the mouth open' : 'speaking, facing east, the open hand out',
  carry: n => `carrying a sack on the shoulder to load the family's cart, walking east, frame ${n} of 4`,
};
const WHO = {
  'bexar-man': 'a Tejano man of Béxar in 1836: a wide low-crowned straw sombrero, a moustache, a short dark jacket open over a cream shirt, a red sash at the waist, buckskin-coloured trousers, dark shoes',
  'bexar-woman': 'a Tejana woman of Béxar in 1836: a slate-blue rebozo with a pale striped border over her head and shoulders, fringed at its ends, a cream blouse, a full madder-red skirt, dark hair tied back under it',
  'bexar-girl': 'a Tejana girl of Béxar in 1836 in plain cotton: a cream blouse, an indigo skirt to the shin, a small rose rebozo on her shoulders, dark hair tied back, barefoot',
  'bexar-boy': 'a Tejano boy of Béxar in 1836 in plain cotton: an unbleached shirt, faded indigo trousers rolled at the shin, a small straw hat over short dark hair, barefoot',
};
const COMPARE = {
  'bexar-man': [['seguin-idle', 1], ['ochre-idle-s', 1]], 'bexar-woman': [['alavez-idle-s', 1], ['teal-idle-s', 1]],
  'bexar-girl': [['girl-idle-s', 0.72]], 'bexar-boy': [['boy-idle-s', 0.72]],
};
const DUR = { walk: 180, 'walk-s': 220, 'walk-n': 220, carry: 180 };
const SPEAK_DUR = [650, 750];
const DIRECTION = { walk: 'east; west by mirroring', carry: 'east; west by mirroring', speak: 'east; west by mirroring', 'walk-s': 'south', 'walk-n': 'north',
  'idle-s': 'south', 'idle-e': 'east', 'idle-w': 'west', 'idle-n': 'north', 'listen-s': 'south', 'listen-n': 'north' };

/** A west-facing frame: the east pose mirrored about the figure's own ground point. */
const mirrored = paint => ink => place(ink, 'w', paint, { flip: true });

const townSheets = {}, townClips = {};
for (const figure of Object.keys(FIGURES)) {
  const spec = FIGURES[figure], frames = [];
  for (const [pose, list, mirror] of townPoses(figure)) {
    const single = list.length === 1;
    const names = list.map((_, i) => single ? `${figure}-${pose}` : `${figure}-${pose}-${i + 1}`);
    list.forEach((p, i) => {
      const name = names[i], what = WHAT[pose](i + 1);
      const paint = mirror ? mirrored(draw(spec, p)) : draw(spec, p);
      frames.push({ name, compare: COMPARE[figure],
        prompt: `${WHO[figure]}; ${what}. The same person, face, hat or shawl, clothes and colours in every pose of the ${figure} sheet, at the cast's size and foot line (people contract of request 2026-09-12). ${SOURCES} ${STYLE}`,
        draw: () => personFrame(name, paint, { note: `${figure}, ${what}; Tejano dress as an original interpretation` }) });
    });
    const durations = pose === 'speak' ? SPEAK_DUR : list.map(() => DUR[pose] ?? 2200);
    townClips[`${figure}-${pose}`] = { frames: names.map((sprite, i) => ({ sprite, duration: durations[i] })), loop: true,
      motion: single ? 'breathe' : 'none', direction: DIRECTION[pose],
      prompt: `${figure} ${WHAT[pose](1).replace(/, frame 1 of \d/, '')}: the clip the town scenes ask a townsperson of Béxar for (public/town-scenes.js sceneClip), timed as the cast's own ${pose} clip.` };
  }
  townSheets[`claude-${figure}`] = { cell: PEOPLE.cell, columns: 6, request: REQ_TOWN,
    replaceWith: `item 2: the Tejano townspeople of Béxar, each walk, idle-s, carry (loading a cart), speak and listen in 1830s Béxar dress, at the cast's logical height and foot baseline, east-facing and mirrored for west (also request 2026-09-25, the storming of Béxar, item 6)`,
    frames };
}

// ------------------------------------------------------------------------------------------------------------ the fandango
const MAN = FIGURES['bexar-man'];
/** The man's zapateado and the woman's turn, four frames: [man's pose, woman's pose and view]. */
function dance(i) {
  const Fm = frameOf(MAN), Fw = frameOf(DANCER);
  // His hands behind his back, or one flung up; the stamp on the lifted foot.
  const m = [
    { view: 'e', pelvis: Pv(Fm, 0, -1.2), lean: 2, feet: { near: foot(Fm, 7, 7), far: foot(Fm, -4) }, knees: { near: 1, far: 1 }, hands: { near: atS(Fm, -10, -17), far: atS(Fm, 21, 6) } },
    { view: 'e', pelvis: Pv(Fm, 0, -3.4), lean: 6, feet: { near: foot(Fm, 8), far: foot(Fm, -7, 2) }, hands: { near: atS(Fm, -9, -16), far: atS(Fm, -11, -15) } },
    { view: 'e', pelvis: Pv(Fm, 0, -1.2), lean: 2, feet: { near: foot(Fm, -4), far: foot(Fm, 7, 7) }, knees: { near: 1, far: 1 }, hands: { near: atS(Fm, 22, 5), far: atS(Fm, -10, -17) } },
    { view: 'e', pelvis: Pv(Fm, 0, -3.4), lean: 6, feet: { near: foot(Fm, -6, 2), far: foot(Fm, 8) }, hands: { near: atS(Fm, -9, -16), far: atS(Fm, -11, -15) } },
  ][i];
  const T = Fw.B.torso, sw = Fw.B.shoulderW * 0.5, N = Fw.neck;
  // Her turn: facing him, toward the camera, away from him, away from the camera. Drawn facing east and mirrored to face him.
  const w = [
    { view: 'e', pelvis: Pv(Fw, 0, -1), lean: -2, feet: { near: foot(Fw, 5), far: foot(Fw, -4, 3) }, hands: { near: atS(Fw, 17, 17), far: atS(Fw, 14, -21) }, swirl: 1 },
    { view: 's', pelvis: Pv(Fw, 0, -1.5), step: 1, hands: { left: [-sw - 8, N + 20], right: [sw + 11, Fw.hip - 7] }, swirl: 1.4 },
    { view: 'e', pelvis: Pv(Fw, 0, -1), lean: -2, feet: { near: foot(Fw, -3, 3), far: foot(Fw, 5) }, hands: { near: atS(Fw, 14, -21), far: atS(Fw, 16, 18) }, swirl: -1 },
    { view: 'n', pelvis: Pv(Fw, 0, -1.5), step: -1, hands: { left: [-sw - 11, Fw.hip - 7], right: [sw + 8, N + 20] }, swirl: -1.4 },
  ][i];
  return { m, w, flipW: i !== 2 };
}
/** The skirt swung out in the turn: a wider bell over the rig's own, its hem lifted on the side it swings to. */
function swirlSkirt(F, spec, pose) {
  const s = pose.swirl, colour = spec.lower.colour, top = F.B.torso * 0.5;
  return (ink, j) => {
    const frontal = pose.view === 's' || pose.view === 'n';
    const P = j.P, hw = F.B.hipW * 0.5;
    const wide = frontal ? hw * 2.9 + 6 : 27, lift = 5 * Math.abs(s);
    const L = [P[0] - wide + (s < 0 ? -3 : 0), 5 + (s < 0 ? lift : 0)], Rr = [P[0] + wide + (s > 0 ? 3 : 0), 5 + (s > 0 ? lift : 0)];
    const pts = [add(P, [-hw * 0.95, top]), [P[0] - wide * 0.62, (P[1] + 6) / 2], L, [P[0] - wide * 0.4, 2.5], [P[0], 3.5 + lift * 0.3], [P[0] + wide * 0.4, 2.5], Rr, [P[0] + wide * 0.62, (P[1] + 6) / 2], add(P, [hw * 0.95, top])];
    ink.shape(blob(pts, 0.7), colour, { off: 1.8, lift: true });
    ink.line(curve([add(L, [2, 3]), [P[0] - wide * 0.4, 5.5], [P[0], 6.5 + lift * 0.3], [P[0] + wide * 0.4, 5.5], add(Rr, [-2, 3])]), { width: LINE.inner + 0.6, colour: tone(colour, -0.35) });
    for (const k of [-0.5, 0, 0.5]) ink.line(curve([[P[0] + wide * k * 1.1, 4.5], [P[0] + wide * k * 0.5, P[1] - 8]]), { width: LINE.fine, opacity: 0.5 });
  };
}
function coupleFrame(i) {
  const name = `dancers-couple-${i + 1}`, { m, w, flipW } = dance(i);
  const wPose = { ...w, overBody: swirlSkirt(frameOf(DANCER), DANCER, w) };
  const drawn = personFrame(name, ink => {
    place(ink, 'man', draw(MAN, m), { dx: -29 });
    place(ink, 'woman', draw(DANCER, wPose), { dx: 29, flip: flipW });
  }, { cell: { w: 560, h: 400 }, originX: 280, note: `a couple dancing at the fandango, frame ${i + 1} of 4` });
  return drawn;
}
const COUPLE_WHAT = [
  'he stamps with his near foot raised, one hand behind his back and the other held out to her; she faces him, one hand raised over her head and one holding her skirt out',
  'he comes down on the beat, knees bent, hands behind his back; she has turned toward the camera, her skirt swinging wide',
  'he stamps with the other foot, the other arm up; she has turned her back to him, her skirt swinging the other way',
  'he comes down again; she is seen from behind, coming round to face him',
];

function fiddlerPose(i) {
  const F = frameOf(FIDDLER), sw = F.B.shoulderW * 0.5, N = F.neck;
  // The fiddle held out from the left shoulder (screen right), a little raised; the bow crosses its strings at the bridge
  // at a steep angle, drawn out (frame 1: the hand far from the strings) and pushed in (frame 2: the hand near them).
  const c = [sw * 0.72, N - 2], neckDir = norm([1, 0.12]), n = [-neckDir[1], neckDir[0]];
  const scroll = add(c, mul(neckDir, 24)), neckHand = add(c, mul(neckDir, 19));
  const bowDir = norm([0.62, 0.78]), bridge = add(c, mul(neckDir, -1.5));
  const bowHand = add(bridge, mul(bowDir, i === 0 ? -24 : -8)), bowEnd = add(bowHand, mul(bowDir, 34));
  return {
    view: 's', hands: { right: add(neckHand, [0, -1]), left: bowHand },
    after: (ink) => {
      const P = (u, v) => add(add(c, mul(neckDir, u)), mul(n, v));
      ink.shape(capsule(P(6, 0), scroll, 1.3, 1.1), '#3a2616', { shade: false, outline: LINE.inner });
      ink.shape(blob([P(8.5, 0), P(5, 4.6), P(1, 3.6), P(-4, 5.8), P(-8.5, 0), P(-4, -5.8), P(1, -3.6), P(5, -4.6)], 0.8), '#b0602a', { off: 0.8, lift: true });
      ink.line(`M ${f2(P(-7, 0)[0])} ${f2(P(-7, 0)[1])} L ${f2(scroll[0])} ${f2(scroll[1])}`, { width: LINE.fine, colour: '#f0e0b0', opacity: 0.8 });
      ink.shape(ellipse(scroll, 2, 1.8), '#3a2616', { shade: false, outline: LINE.fine });
      // The bow: a dark line with a pale stick, across the strings.
      ink.line(`M ${f2(bowHand[0])} ${f2(bowHand[1])} L ${f2(bowEnd[0])} ${f2(bowEnd[1])}`, { width: LINE.inner + 2.4, colour: LINE.ink });
      ink.line(`M ${f2(bowHand[0])} ${f2(bowHand[1])} L ${f2(bowEnd[0])} ${f2(bowEnd[1])}`, { width: LINE.inner, colour: '#e0c088' });
      // His hands over the bow and the neck.
      const r = F.B.limb * 0.5 * F.B.hand;
      for (const p of [bowHand, add(neckHand, [0, -1])]) ink.shape(ellipse(p, r, r * 0.94), FIDDLER.skin, { off: 0.4 });
    },
  };
}

// The lantern on a post, lit: a prop in its own pixels.
function lanternPost() {
  const W = 220, H = 470, BASE = 450, PERSON = 290, TALL = Math.round(PERSON * 1.4);
  const ink = new Ink('lantern-post', 1, { yUp: false, shadeOffset: 3 });
  const x = 88, top = BASE - TALL;
  const glowId = 'lantern-post-glow';
  ink.defs.push(`<radialGradient id="${glowId}"><stop offset="0" stop-color="#ffe7a0" stop-opacity="0.75"/><stop offset="0.45" stop-color="#ffc860" stop-opacity="0.32"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient>`);
  const lx = x + 78, ly = top + 96;
  ink.raw(`<circle cx="${lx}" cy="${ly}" r="92" fill="url(#${glowId})"/>`);
  // The post: a rough squared timber set in the ground, a few stones round its foot; the arm and its brace.
  ink.shape(poly([[x - 9, BASE], [x + 9, BASE], [x + 8, top], [x - 8, top]]), '#6e4a2c', { off: 3 });
  ink.line(`M ${x - 3} ${BASE - 20} L ${x - 2} ${top + 40} M ${x + 4} ${BASE - 60} L ${x + 3} ${top + 90}`, { width: LINE.fine, colour: '#3e2816', opacity: 0.7 });
  ink.shape(poly([[x - 8, top + 6], [x + 92, top + 4], [x + 92, top + 18], [x - 8, top + 20]]), '#6e4a2c', { off: 2 });
  ink.shape(poly([[x + 6, top + 20], [x + 40, top + 20], [x + 8, top + 62]]), '#5e3e24', { off: 1.5 });
  for (const [sx, r] of [[-20, 11], [18, 9], [-2, 7]]) ink.shape(ellipse([x + sx, BASE - r * 0.45], r, r * 0.55), '#a49a88', { off: 1.5 });
  // The lantern on its hook: a tin lantern, a cap and ring, four panes of horn or glass lit from within.
  ink.line(`M ${lx} ${top + 18} L ${lx} ${ly - 44}`, { width: 3, colour: LINE.ink });
  ink.shape(ellipse([lx, ly - 46], 5, 4), null);
  ink.shape(poly([[lx - 22, ly - 30], [lx + 22, ly - 30], [lx + 8, ly - 44], [lx - 8, ly - 44]]), '#5d5f5b', { off: 2 });
  ink.shape(poly([[lx - 19, ly - 30], [lx + 19, ly - 30], [lx + 19, ly + 26], [lx - 19, ly + 26]]), '#f7cf62', { shade: false });
  ink.dot(ellipse([lx, ly + 2], 10, 16), '#fff4c8', 0.95);
  ink.dot(ellipse([lx, ly + 6], 4, 8), '#ffb030', 0.9);
  for (const px of [-19, 0, 19]) ink.line(`M ${lx + px} ${ly - 30} L ${lx + px} ${ly + 26}`, { width: px ? 4 : 3, colour: '#3a3a36' });
  ink.line(`M ${lx - 19} ${ly - 30} L ${lx + 19} ${ly - 30} L ${lx + 19} ${ly + 26} L ${lx - 19} ${ly + 26} Z`, { width: LINE.outer, colour: LINE.ink });
  ink.shape(poly([[lx - 22, ly + 26], [lx + 22, ly + 26], [lx + 18, ly + 36], [lx - 18, ly + 36]]), '#5d5f5b', { off: 2 });
  return {
    svg: frameSvg({ name: 'lantern-post', w: W, h: H, body: ink.toString(), defs: ink.defs, note: 'a lit lantern hung from the arm of a wooden post, for the fandango in the plaza at Béxar' }),
    anchorX: +(x / W).toFixed(4), anchorY: +(BASE / H).toFixed(4), logicalHeight: TALL,
  };
}

// ------------------------------------------------------------------------------------------------------------ the bell
// A slice of the church's front with its flat roof, a low parapet and a small bell arch standing on it; the sentry on the
// roof behind the parapet. Rig units (a person 100); the roof 118 up. The frame's logical height is a person's, so the man
// is drawn at the volunteer's height and the church's wall goes down to the ground anchor under it.
const ROOF = 118;
const BELL = { cx: 24, top: ROOF + 100, open: [13, 35], spring: ROOF + 80 };
function churchBack(ink) {
  // The roof's top, seen from a little above, behind the parapet.
  ink.shape(poly([[-44, ROOF + 6], [52, ROOF + 6], [58, ROOF + 15], [-38, ROOF + 15]]), '#e8d6ae', { off: 1 });
  // The bell arch (espadaña): two piers and a round arch, a curved cap and a small cross.
  const [l, r] = BELL.open, base = ROOF + 6, pier = 6;
  const plaster = '#dcc59c';
  ink.shape(poly([[l - pier, base], [l, base], [l, BELL.spring], [l - pier, BELL.spring]]), plaster, { off: 1 });
  ink.shape(poly([[r, base], [r + pier, base], [r + pier, BELL.spring], [r, BELL.spring]]), plaster, { off: 1 });
  const arch = [];
  for (let k = 0; k <= 8; k++) { const t = Math.PI * k / 8; arch.push([BELL.cx + Math.cos(t) * (r - l) / 2, BELL.spring + Math.sin(t) * (r - l) / 2]); }
  ink.shape(`M ${l - pier} ${BELL.spring} L ${arch.map(p => `${f2(p[0])} ${f2(p[1])}`).reverse().join(' L ')} L ${r + pier} ${BELL.spring} L ${r + pier} ${BELL.top - 4} Q ${BELL.cx} ${BELL.top + 8} ${l - pier} ${BELL.top - 4} Z`, plaster, { off: 1.2 });
  ink.shape(poly([[BELL.cx - 1, BELL.top + 1], [BELL.cx + 1, BELL.top + 1], [BELL.cx + 1, BELL.top + 12], [BELL.cx - 1, BELL.top + 12]]), '#4a3a2a', { shade: false, outline: LINE.inner });
  ink.shape(poly([[BELL.cx - 4, BELL.top + 8], [BELL.cx + 4, BELL.top + 8], [BELL.cx + 4, BELL.top + 10], [BELL.cx - 4, BELL.top + 10]]), '#4a3a2a', { shade: false, outline: LINE.inner });
  // The beam the bell hangs from.
  ink.shape(capsule([l - 1, BELL.spring + 4], [r + 1, BELL.spring + 4], 1.3, 1.3), '#5e3e24', { shade: false, outline: LINE.inner });
}
/** The bell swung by `swing` degrees on its beam; returns the end of the rope's lever. */
function drawBell(ink, swing) {
  const pivot = [BELL.cx, BELL.spring + 4];
  const P = (x, y) => add(pivot, rot([x, y], swing));
  ink.shape(blob([P(-2.5, -1), P(2.5, -1), P(4, -6), P(7, -13), P(-7, -13), P(-4, -6)], 0.6), '#a07a34', { off: 0.8, lift: true });
  ink.shape(ellipse(P(0, -13.5), 2, 1.4), '#5a4420', { shade: false, outline: LINE.fine });
  const lever = P(-9, 1.5);
  ink.line(`M ${f2(pivot[0])} ${f2(pivot[1])} L ${f2(lever[0])} ${f2(lever[1])}`, { width: LINE.inner + 1, colour: '#4a3a2a' });
  return lever;
}
function churchFront(ink) {
  // The wall: plastered stone, the plaster gone in patches; a cornice under the parapet; a small arched window; a wooden spout.
  const x0 = -44, x1 = 52, wall = '#d6be92';
  ink.shape(poly([[x0, 0], [x1, 0], [x1, ROOF + 8], [x0, ROOF + 8]]), wall, { off: 2.2 });
  ink.shape(poly([[x0 - 2, ROOF - 3], [x1 + 2, ROOF - 3], [x1 + 2, ROOF + 1], [x0 - 2, ROOF + 1]]), tone(wall, -0.12), { shade: false, outline: LINE.inner });
  for (const [cx, cy, rx, ry] of [[-30, 22, 7, 4], [-8, 60, 6, 3.5], [30, 34, 8, 4.5], [38, 88, 5, 3], [-26, 96, 6, 3.4], [8, 14, 5, 3]]) {
    ink.shape(ellipse([cx, cy], rx, ry), '#b8a07a', { shade: false, outline: LINE.fine });
    ink.line(curve([[cx - rx * 0.6, cy], [cx, cy + ry * 0.3], [cx + rx * 0.6, cy - ry * 0.1]]), { width: LINE.fine, opacity: 0.5 });
  }
  const wx = 6, wy = 70;
  ink.shape(`M ${wx - 7} ${wy - 12} L ${wx - 7} ${wy + 6} A 7 7 0 0 0 ${wx + 7} ${wy + 6} L ${wx + 7} ${wy - 12} Z`, '#3a2c20', { shade: false, outline: LINE.inner + 0.6 });
  ink.shape(poly([[x1 - 8, ROOF + 2], [x1 + 8, ROOF], [x1 + 8, ROOF + 3], [x1 - 8, ROOF + 5]]), '#6e4a2c', { shade: false, outline: LINE.inner });
  ink.line(`M ${x0 + 2} 2 L ${x1 - 2} 2`, { width: LINE.fine, opacity: 0.4 });
}
function sentryFrame(i) {
  const F = frameOf(SENTRY), name = `sentry-bell-ring-${i + 1}`;
  const swing = [-26, 30, -10, 22][i];
  return personFrame(name, ink => {
    churchBack(ink);
    // The bell and its rope, then the man: the rope from the lever to his hands.
    const tmp = new Ink(`${name}-bell`, ink.k, { yUp: true });
    const lever = drawBell(tmp, swing);
    ink.defs.push(...tmp.defs); ink.raw(tmp.toString());
    const man = [-12, ROOF + 4];
    const rel = p => sub(p, man);
    const grip = [[7, ROOF + 72], [9, ROOF + 48], [8, ROOF + 62], [7, ROOF + 60]][i];
    const low = [[7.5, ROOF + 64], [9, ROOF + 40], [8, ROOF + 54], null][i];
    const ropeEnd = [9, ROOF + 24];
    const rope = curve([lever, lerp(lever, grip, 0.5), grip, low || lerp(grip, ropeEnd, 0.5), ropeEnd]);
    ink.line(rope, { width: LINE.outer + 2.4, colour: LINE.ink });
    ink.line(rope, { width: LINE.outer, colour: '#b8904a' });
    const pose = i === 3
      ? { view: 'e', pelvis: Pv(F, -1, -0.5), lean: -4, tilt: -6, feet: { near: foot(F, 6), far: foot(F, -5) }, hands: { near: rel([46, ROOF + 92]), far: rel(grip) }, elbows: { near: -1, far: 1 }, mouth: 'open' }
      : { view: 'e', pelvis: Pv(F, -2, i === 1 ? -5 : -1), lean: i === 1 ? 10 : -2, tilt: i === 1 ? 4 : -8, feet: { near: foot(F, 7), far: foot(F, -6) },
        hands: { near: rel(grip), far: rel(low || grip) }, elbows: { near: 1, far: 1 }, mouth: i === 0 ? 'open' : undefined };
    place(ink, 'man', p => drawPerson(p, SENTRY, pose), { dx: man[0], dy: man[1] });
    churchFront(ink);
  }, { cell: { w: 420, h: 760 }, groundY: 736, originX: 200, note: `the sentry on the flat roof of San Fernando by its bell arch, frame ${i + 1} of 4` });
}
const SENTRY_WHAT = [
  'both hands high on the bell rope, the bell swung back, shouting',
  'hauling the rope down, knees bent, the bell swung over',
  'the rope going up again, the bell coming back',
  'one hand still on the rope, the other arm out, pointing hard along the road beyond the arch (west, as the battle mirrors him), shouting',
];

// ------------------------------------------------------------------------------------------------------------ leaving
// A Tejano family going east out of the town: the man at the ox's head with his goad, the ox yoked at the horns to the pole of
// a laden carreta, the woman walking after the cart with the girl. Rig units; the cart's axle at -46 of its own.
const OX = { coat: '#8a5d3b', belly: '#b08a64', horn: '#e8dcc0', hoof: '#2e2016' };
function drawOx(ink, frame) {
  const bob = [0, 1, 0, 1][frame];
  const phase = frame * Math.PI / 2;
  const far = c => tone(c, -0.2);
  const leg = (root, dx, lift, shade, fore) => {
    const hoof = [root[0] + dx, 3 + lift];
    const chain = ik(root, hoof, 15, 14, fore ? -1 : 1);
    ink.shape(capsule(chain.joint, chain.end, 3.4, 2.6), shade(OX.coat), { off: 0.6 });
    ink.shape(capsule(root, chain.joint, 7, 4), shade(OX.coat), { off: 1 });
    ink.shape(blob([add(chain.end, [-2.8, 0.4]), add(chain.end, [3.2, 0.4]), add(chain.end, [3.4, -3]), add(chain.end, [-3, -3])], 0.4), OX.hoof, { shade: false, outline: LINE.inner + 0.6 });
  };
  const step = (p, q) => [7 * Math.sin(phase + p), Math.max(0, Math.cos(phase + q)) * 4];
  const [ff, ffl] = step(Math.PI, Math.PI), [hf, hfl] = step(0, 0), [fn, fnl] = step(0, 0), [hn, hnl] = step(Math.PI, Math.PI);
  leg([56, 31 + bob], ff, ffl, far, true); leg([16, 32 + bob], hf, hfl, far, false);
  // The tail, the body (a barrel with a little hump at the withers), the dewlap.
  ink.line(curve([[8, 50 + bob], [2.5, 40 + bob], [3.5, 26]]), { width: 3.6, colour: LINE.ink });
  ink.line(curve([[8, 50 + bob], [2.5, 40 + bob], [3.5, 26]]), { width: 2, colour: OX.coat });
  ink.shape(ellipse([3.6, 24], 2, 3), OX.hoof, { shade: false, outline: LINE.fine });
  ink.shape(blob([[9, 48 + bob], [12, 54 + bob], [30, 55 + bob], [50, 57 + bob], [58, 60 + bob], [66, 54 + bob], [68, 40 + bob], [60, 27 + bob], [36, 25 + bob], [14, 28 + bob], [8, 36 + bob]], 0.8), OX.coat, { off: 2, lift: true });
  ink.shape(blob([[20, 29 + bob], [40, 26 + bob], [58, 28 + bob], [44, 31 + bob]], 0.8), OX.belly, { shade: false, outline: 0 });
  ink.shape(blob([[62, 40 + bob], [70, 42 + bob], [72, 30 + bob], [66, 26 + bob]], 0.8), tone(OX.coat, -0.08), { off: 0.8 });
  leg([58, 31 + bob], fn, fnl, c => c, true); leg([18, 32 + bob], hn, hnl, c => c, false);
  // The head, low and forward; the horns with the yoke lashed across them.
  const H = [78, 46 + bob];
  ink.shape(blob([add(H, [-10, 6]), add(H, [-4, 9]), add(H, [4, 6]), add(H, [11, -3]), add(H, [12, -9]), add(H, [7, -10]), add(H, [-2, -4]), add(H, [-11, -3])], 0.8), OX.coat, { off: 1, lift: true });
  ink.shape(ellipse(add(H, [10, -7.5]), 3.4, 2.8), '#c8a888', { shade: false, outline: LINE.inner });
  ink.dot(ellipse(add(H, [2, 3]), 1.2, 1.4), LINE.ink);
  ink.shape(ellipse(add(H, [-6, 6]), 3, 1.8, 30), tone(OX.coat, -0.1), { shade: false, outline: LINE.inner });
  for (const [s, tint] of [[-1, far], [1, c => c]]) ink.shape(blob([add(H, [-3, 7]), add(H, [-8 + s, 13]), add(H, [-4 + s * 2, 17]), add(H, [-5 + s, 13]), add(H, [-1, 8])], 0.6), tint(OX.horn), { shade: false, outline: LINE.inner });
  ink.shape(poly([add(H, [-7, 8]), add(H, [1, 8]), add(H, [1, 12]), add(H, [-7, 12])]), '#7a5530', { shade: false, outline: LINE.inner });
  return add(H, [-3, 10]);
}
function drawCarreta(ink, frame) {
  const C = [-46, 25], R = 24, turn = frame * 45;
  // The far wheel, just showing; the bed of poles; the load; the near wheel.
  ink.shape(ellipse(add(C, [5, 3]), R, R), '#6e4a2c', { off: 2 });
  ink.shape(poly([[-84, 38], [-8, 38], [-8, 44], [-84, 44]]), '#7a5530', { off: 1 });
  for (const x of [-82, -64, -46, -28, -12]) ink.shape(capsule([x, 42], [x - 1, 66], 1.3, 1.1), '#8a6440', { shade: false, outline: LINE.inner });
  ink.shape(capsule([-84, 64], [-10, 64], 1.2, 1.2), '#8a6440', { shade: false, outline: LINE.inner });
  // The load: sacks of corn, a striped blanket roll, a chest, a pot.
  ink.shape(blob([[-80, 44], [-82, 62], [-70, 76], [-58, 72], [-56, 46]], 0.7), '#5a3a22', { off: 1.4 });
  ink.shape(poly([[-80, 60], [-58, 60], [-58, 62], [-80, 62]]), '#8a6a3a', { shade: false, outline: LINE.fine });
  ink.shape(ellipse([-44, 60], 13, 12), '#d8c090', { off: 1.6, lift: true });
  ink.shape(ellipse([-28, 58], 11, 11), '#cdb07a', { off: 1.4, lift: true });
  ink.shape(capsule([-66, 78], [-34, 76], 7, 7), '#b0362a', { off: 1.4, lift: true });
  for (const x of [-60, -52, -44, -38]) ink.line(`M ${x} 70 L ${x + 1} 84`, { width: 2.4, colour: '#efe2c6' });
  ink.shape(ellipse([-20, 72], 5.5, 4.5), '#3a3432', { off: 0.8 });
  // The near wheel: one great solid wheel of three pegged planks, no iron tyre, turning.
  ink.shape(ellipse(C, R, R), '#8a6440', { off: 2.4, lift: true });
  for (const k of [-1, 1]) {
    const d = rot([0, 1], turn), n = rot([1, 0], turn), o = mul(n, k * R * 0.34);
    const a = add(add(C, o), mul(d, R * 0.94)), b = add(add(C, o), mul(d, -R * 0.94));
    ink.line(`M ${f2(a[0])} ${f2(a[1])} L ${f2(b[0])} ${f2(b[1])}`, { width: LINE.inner, colour: '#4a3020' });
  }
  for (const k of [0.5, -0.5]) { const p = add(C, rot([R * 0.62 * k, R * 0.5], turn)); ink.dot(ellipse(p, 1.2, 1.2), '#3a2616'); }
  ink.shape(ellipse(C, 5.5, 5.5), '#5e3e24', { off: 0.8 });
  ink.shape(ellipse(C, 2.2, 2.2), '#3a2616', { shade: false, outline: LINE.fine });
}
// The ox and the cart drawn at their own size against a person (an ox about three-quarters of a man's height at the withers,
// the carreta's wheels about half his height across and more): each is drawn in its own units and scaled into the frame.
const CART = { dx: 0, scale: 1.3 }, OXS = { dx: 8, scale: 1.3 };
function leaveFrame(i) {
  const name = `townsfolk-leave-${i + 1}`;
  const man = FIGURES['bexar-man'], woman = FIGURES['bexar-woman'], girl = FIGURES['bexar-girl'];
  const Fm = frameOf(man), Fw = frameOf(woman), Fg = frameOf(girl);
  const world = (placed, [x, y]) => [placed.dx + x * placed.scale, y * placed.scale];
  return personFrame(name, ink => {
    // Behind the cart, walking after it: the woman and the girl.
    place(ink, 'girl', draw(girl, POSES.walk(Fg)[(i + 2) % 4]), { dx: -152, dy: -2, scale: 0.72 });
    place(ink, 'woman', draw(woman, POSES.walk(Fw)[i]), { dx: -121 });
    place(ink, 'cart', p => drawCarreta(p, i), CART);
    // The pole from the front of the cart's bed to the yoke on the ox's horns.
    const bob = [0, 1, 0, 1][i];
    ink.shape(capsule(world(CART, [-10, 41]), world(OXS, [75, 56 + bob]), 2, 1.8), '#7a5530', { shade: false, outline: LINE.inner });
    place(ink, 'ox', p => drawOx(p, i), OXS);
    // The man at the ox's head, a little nearer the camera, his goad over its neck.
    const at = [140, -2];
    const walk = POSES.walk(Fm)[(i + 1) % 4];
    const goadHand = sub([130, 58], at);
    const pose = { ...walk, hands: { ...walk.hands, near: goadHand }, elbows: { near: 1 },
      after: (p, j) => {
        const tip = sub([96, 86], at), butt = add(j.handNear, mul(norm(sub(j.handNear, tip)), 8));
        p.shape(capsule(butt, tip, 0.9, 0.6), '#b89a5e', { shade: false, outline: LINE.inner + 0.4 });
        const r = Fm.B.limb * 0.5 * Fm.B.hand;
        p.shape(ellipse(j.handNear, r, r * 0.94), man.skin, { off: 0.4 });
      } };
    place(ink, 'man', draw(man, { ...pose, view: 'e' }), { dx: at[0], dy: at[1] });
  }, { cell: { w: 1040, h: 400 }, originX: 520, note: `a Tejano family leaving Béxar with a laden carreta, frame ${i + 1} of 4` });
}

// ------------------------------------------------------------------------------------------------------------ sheets and clips
const couplePrompt = i => `A couple dancing at the fandango in the plaza at Béxar on the night of February 22, 1836 (docs/battle-research/surprise-at-bexar.md §6; HIST-TEX-614), both in one frame, frame ${i + 1} of 4: ${COUPLE_WHAT[i]}. He is the man of Béxar (${WHO['bexar-man']}); she is the woman of Béxar with her rebozo let down on her shoulders (${WHO['bexar-woman']}). The steps are not recorded: a stamping step and a woman's turn are chosen to read as a dance at 40 px, an original interpretation. ${SOURCES} ${STYLE}`;
const fiddlerPrompt = i => `The fiddler at the fandango in the plaza at Béxar (docs/battle-research/surprise-at-bexar.md §6: "the fiddler and the dancers are invented; what was played is not recorded"), an older Tejano man grey at the temples in a dark blue short jacket, red sash and dark felt sombrero, toward the camera with the fiddle under his chin on his left shoulder and the bow ${i === 0 ? 'drawn out wide' : 'pushed in across the strings'}, frame ${i + 1} of 2. ${SOURCES} ${STYLE}`;

export const SHEETS = {
  ...townSheets,
  'claude-fandango': { cell: { w: 560, h: 400 }, columns: 4, request: REQ_TOWN,
    replaceWith: 'item 4: the fandango - a couple dancing (4 frames), a fiddler playing (2 frames), people at the cast\'s logical height and foot baseline',
    frames: [0, 1, 2, 3].map(i => ({ name: `dancers-couple-${i + 1}`, compare: [['alavez-idle-s', 1], ['seguin-idle', 1]], prompt: couplePrompt(i), draw: () => coupleFrame(i) })) },
  'claude-fiddler': { cell: PEOPLE.cell, columns: 2, request: REQ_TOWN,
    replaceWith: 'item 4: the fiddler playing, 2 frames, at the cast\'s logical height and foot baseline',
    frames: [0, 1].map(i => ({ name: `fiddler-play-${i + 1}`, compare: [['elder-idle-s', 1]], prompt: fiddlerPrompt(i),
      draw: () => personFrame(`fiddler-play-${i + 1}`, draw(FIDDLER, fiddlerPose(i)), { note: `the fiddler at the fandango, frame ${i + 1} of 2` }) })) },
  'claude-lantern-post': { cell: { w: 220, h: 470 }, columns: 1, request: REQ_TOWN,
    replaceWith: 'item 4: a lantern hung on a post, lit, a prop on its ground anchor (the page draws it 1.4 of a person tall)',
    frames: [{ name: 'lantern-post', height: 1.4, compare: [['campfire', 0.4], ['ochre-idle-s', 1]], draw: lanternPost,
      prompt: `A lantern hung on a wooden post, lit, for the fandango's lights in the plaza at Béxar (docs/battle-research/surprise-at-bexar.md §6: "fiddles, lights and dancing"): a rough squared post set in the ground with a few stones at its foot, an arm and brace at the top, a tin lantern with a conical cap hanging from a hook, its panes glowing warm yellow with a soft glow round it. How the plaza was lit that night is not recorded: an original interpretation. About 1.4 of a person tall. ${STYLE}` }] },
  'claude-sentry-bell': { cell: { w: 420, h: 760 }, columns: 4, request: REQ_BELL,
    replaceWith: 'item 1: the sentry ringing the bell, 4 frames east (mirrored for west), the volunteer-* logical height on the ground anchor, readable at 30-60 px',
    frames: [0, 1, 2, 3].map(i => ({ name: `sentry-bell-ring-${i + 1}`, compare: [['volunteer-e', 1], ['chapel', 1]], draw: () => sentryFrame(i),
      prompt: `The sentry on San Fernando on February 23, 1836 (docs/battle-research/surprise-at-bexar.md §4, Sutherland: a man posted "on the roof of the old church" with orders to ring the bell; HIST-TEX-613), frame ${i + 1} of 4: ${SENTRY_WHAT[i]}. A Texian volunteer in his own frontier clothes (the kit's volunteer figure, the military atlases' longer build) standing on the flat roof behind a low parapet, beside a small plastered bell arch with a bronze bell swinging on its beam and a small cross on top; below him the church's plastered stone wall goes down to the ground, with a cornice, a small arched window and a wooden roof spout. What the church's roof and bell-cote looked like in 1836 is uncertain (request 2026-09-14, Béxar civic architecture: needs research): the arch, the cross and the spout are an original interpretation for reading at 30-60 px, not a record. Drawn facing east; the battle mirrors him to face and point west. ${STYLE}` })) },
  'claude-townsfolk-leave': { cell: { w: 1040, h: 400 }, columns: 2, request: REQ_BELL,
    replaceWith: 'item 2: townspeople leaving with a cart, 4 frames east (mirrored for west), people at the volunteer-* logical height on the ground anchor',
    frames: [0, 1, 2, 3].map(i => ({ name: `townsfolk-leave-${i + 1}`, compare: [['carreta-loaded-e', 1.05], ['alavez-walk-e-1', 1]], draw: () => leaveFrame(i),
      prompt: `A Tejano family leaving Béxar on the afternoon of February 23, 1836 (request 2026-09-26, the bell at Béxar, item 2; HIST-TEX-612: the Tejano families had been leaving for days), going east, frame ${i + 1} of 4 of a walk: the man of Béxar (${WHO['bexar-man']}) at the head of a brown ox with a long cane goad; the ox yoked at the horns to the pole of a laden carreta - two great solid wheels of pegged planks with no iron tyre, an open bed of poles, sacks of corn, a striped blanket roll, a chest and a pot (after Smithwick and Woodman, HIST-TEX-443, and Astra's carreta-solid-wheels); the woman of Béxar in her rebozo (${WHO['bexar-woman']}) walking after the cart with the girl (${WHO['bexar-girl']}). The wheels turn and the ox's legs step with the walk. ${SOURCES} ${STYLE}` })) },
};

export const CLIPS = {
  ...townClips,
  'dancers-couple': { frames: [0, 1, 2, 3].map(i => ({ sprite: `dancers-couple-${i + 1}`, duration: 280 })), loop: true, motion: 'none', direction: 'east (the man west of the woman); west by mirroring',
    prompt: 'The couple dancing at the fandango: his stamp and her turn, looping at a lively step.' },
  'fiddler-play': { frames: [{ sprite: 'fiddler-play-1', duration: 260 }, { sprite: 'fiddler-play-2', duration: 260 }], loop: true, motion: 'none', direction: 'south, the fiddle to the east; west by mirroring',
    prompt: 'The fiddler playing: the bow drawn out and pushed in, looping.' },
  'sentry-bell-ring': { frames: [0, 1, 2, 1, 0, 1, 2, 3].map((k, n) => ({ sprite: `sentry-bell-ring-${k + 1}`, duration: k === 3 ? 1400 : 300 })), loop: true, motion: 'none', direction: 'east; west by mirroring',
    prompt: 'The sentry ringing the bell: hauling the rope down and letting it up, the bell swinging, then pointing along the road, over and over while the bell rings.' },
  'townsfolk-leave': { frames: [0, 1, 2, 3].map(i => ({ sprite: `townsfolk-leave-${i + 1}`, duration: 230 })), loop: true, motion: 'none', direction: 'east; west by mirroring',
    prompt: 'A Tejano family leaving Béxar with its carreta: walking, the wheels turning, looping at the carreta\'s own pace.' },
};

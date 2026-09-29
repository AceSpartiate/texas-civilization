// The battle kit's gear, drawn in rig units (y up, +x forward, a grown figure about 100 to the top of the hat): muskets and
// long rifles, ramrods, swords, belts and boxes, packs, coat skirts, epaulettes, sashes, boots and the hats of 1835-36.
// Area C of docs/CLAUDE_ART_PLAN.md (soldiers, battles and famous people). Everything here is Claude's temporary art.
//
// The dress functions are `spec.dress` layers for the person rig (scripts/claude-art/kit/rig.mjs calls `behind`, `leg`,
// `torso`, `front` with the body's joints), so a coat's skirts follow the legs in every pose and a pack sits on the back.
// ceiling: every piece is one flat colour with the kit's one flat shade and no fold or wear; at a figure of 40 px it reads as
// the piece, closer up it is plainly simpler than Astra's painted kit. Her sheet of the same name replaces it.
import { LINE, PALETTE, tone } from '../kit/style.mjs';
import { add, sub, mul, norm, perp, lerp, len, capsule, blob, curve, poly, ellipse } from '../kit/svg.mjs';

const f = v => Math.round(v * 100) / 100;
const pt = p => `${f(p[0])} ${f(p[1])}`;
export const seg = (a, b) => `M ${pt(a)} L ${pt(b)}`;
export const path = pts => `M ${pts.map(pt).join(' L ')}`;

export const COLOURS = Object.freeze({
  walnut: '#6b4424', stockMaple: '#8a5a30', barrel: '#46443f', barrelLight: '#6e6c66', brass: '#c8a040', steel: '#a6a8a2',
  leather: '#4b2e1a', leatherLight: '#7a5030', black: '#24201c', blanket: '#8a7f6e', white: '#efe6d0', gold: '#d8a838', red: '#b8342a',
  horn: '#e8d6a8',
});

/**
 * A long gun from `butt` to `tip` (the muzzle), its stock heel on the `down` side (+1: the left normal of butt->tip; -1 the
 * right). `kind` 'rifle' (the Texian's long rifle: a slender curly-maple stock, brass patch box, a long octagon barrel) or
 * 'musket' (the Mexican India Pattern musket: a heavier walnut stock, brass furniture, three barrel bands; `bayonet` fixed).
 */
export function drawGun(ink, butt, tip, { down = -1, kind = 'musket', bayonet = false, sling = false } = {}) {
  const d = norm(sub(tip, butt)), n = mul(perp(d), down), L = len(sub(tip, butt));
  const P = (s, o = 0) => add(add(butt, mul(d, L * s)), mul(n, o));
  const rifle = kind === 'rifle', wood = rifle ? COLOURS.stockMaple : COLOURS.walnut;
  // The stock: a butt deep toward the heel, the comb, the narrow wrist, the lock, and a forestock under the barrel.
  const stock = [P(0, 3.4), P(0.03, 3.6), P(0.2, 1.3), P(0.3, 1.25), P(rifle ? 0.93 : 0.86, 0.7), P(rifle ? 0.93 : 0.86, -0.55), P(0.3, -0.6), P(0.22, -0.9), P(0.02, -2.4), P(0, -2.2)];
  ink.shape(poly(stock), wood, { outline: 3, off: 0.5 });
  ink.line(seg(P(0.005, 3.2), P(0.005, -2.1)), { colour: COLOURS.brass, width: 2.2 });
  if (rifle) ink.shape(ellipse(P(0.08, 0.6), 2.2, 0.9, Math.atan2(d[1], d[0]) * 180 / Math.PI), COLOURS.brass, { shade: false, outline: 1.4 });
  // The barrel over the forestock and on past it; the lock plate and hammer at the wrist.
  ink.shape(capsule(P(0.27, -0.2), P(1, -0.2), rifle ? 0.62 : 0.7, rifle ? 0.55 : 0.6), COLOURS.barrel, { shade: false, outline: 2.4 });
  ink.line(seg(P(0.32, -0.45), P(0.98, -0.45)), { colour: COLOURS.barrelLight, width: 1.2, opacity: 0.8 });
  ink.shape(poly([P(0.24, 0.9), P(0.31, 0.9), P(0.31, -0.2), P(0.24, -0.2)]), COLOURS.steel, { shade: false, outline: 1.6 });
  ink.line(`M ${pt(P(0.245, -0.2))} Q ${pt(P(0.245, -1.7))} ${pt(P(0.275, -1.9))}`, { width: 1.8 });
  if (!rifle) for (const s of [0.52, 0.7, 0.85]) ink.line(seg(P(s, 0.8), P(s, -0.9)), { colour: COLOURS.brass, width: 1.8 });
  // The trigger guard under the wrist.
  ink.line(`M ${pt(P(0.2, 1.1))} Q ${pt(P(0.24, 2.6))} ${pt(P(0.3, 1.0))}`, { width: 1.4 });
  if (sling) ink.line(`M ${pt(P(0.12, 2.2))} Q ${pt(P(0.4, 4.2))} ${pt(P(0.72, 0.9))}`, { colour: COLOURS.leatherLight, width: 1.6 });
  if (bayonet) {
    // A socket bayonet: the socket round the muzzle, the neck, and a long triangular blade to the side of the barrel.
    ink.shape(capsule(P(0.94, -0.2), P(1.01, -0.2), 0.8, 0.8), COLOURS.steel, { shade: false, outline: 1.6 });
    const b0 = P(1.0, -1.4), b1 = P(1.3, -1.2);
    ink.shape(poly([add(b0, mul(n, 0.5)), b1, add(b0, mul(n, -0.5))]), COLOURS.steel, { shade: false, outline: 1.8 });
  }
}

/** A ramrod (steel), from `a` to `b`. */
export function drawRamrod(ink, a, b) {
  ink.line(seg(a, b), { colour: LINE.ink, width: 2.6 });
  ink.line(seg(a, b), { colour: COLOURS.steel, width: 1.2 });
}

/** A sword: the blade from the hilt at `hand` to `tip`, a curved guard; `sabre` a light curve. */
export function drawSword(ink, hand, tip, { sabre = true, knot = null } = {}) {
  const d = norm(sub(tip, hand)), n = perp(d), L = len(sub(tip, hand));
  const mid = add(lerp(hand, tip, 0.55), mul(n, sabre ? L * 0.05 : 0));
  ink.line(curve([add(hand, mul(d, 1.5)), mid, tip]), { colour: LINE.ink, width: 3.2 });
  ink.line(curve([add(hand, mul(d, 1.5)), mid, tip]), { colour: COLOURS.steel, width: 1.6 });
  ink.line(curve([add(hand, mul(n, 1.8)), add(hand, mul(d, 1.6)), add(hand, mul(n, -1.6))]), { colour: COLOURS.brass, width: 2.2 });
  ink.line(seg(add(hand, mul(d, -1.8)), add(hand, mul(d, 0.8))), { colour: COLOURS.black, width: 2.6 });
  if (knot) ink.shape(ellipse(add(hand, add(mul(d, -2.2), mul(n, -1.8))), 0.9, 1.4), knot, { shade: false, outline: 1.2 });
}

/** A scabbard hanging from the belt at `hip`, slanting back (side view). */
export function drawScabbard(ink, hip, { length = 30, colour = COLOURS.black, hilt = COLOURS.brass } = {}) {
  const tip = add(hip, [-length * 0.62, -length * 0.8]);
  ink.shape(capsule(hip, tip, 0.9, 0.7), colour, { shade: false, outline: 2.2 });
  ink.shape(capsule(add(hip, [0.9, 1.2]), add(hip, [2.6, 3.2]), 0.7, 0.7), hilt, { shade: false, outline: 1.6 });
  ink.line(`M ${pt(add(hip, [2.4, 3.2]))} Q ${pt(add(hip, [4.2, 2.2]))} ${pt(add(hip, [3.4, 0.4]))}`, { colour: hilt, width: 1.4 });
}

// ------------------------------------------------------------------------------------------------ dress layers (side view)
/** The body's front and back thighs in the side view: which of the two legs is forward. */
function thighs(dc) {
  const nearFront = dc.legNear.joint[0] >= dc.legFar.joint[0];
  return nearFront ? { front: dc.legNear, back: dc.legFar, frontHip: dc.hipNear, backHip: dc.hipFar } : { front: dc.legFar, back: dc.legNear, frontHip: dc.hipFar, backHip: dc.hipNear };
}

/**
 * A coat's skirts over the thighs, following them: `length` of the thigh (a frock coat ~0.6, a coatee's tails ~0.45 behind
 * only, a long coat or hunting shirt ~0.75), open at the front.
 */
export function coatSkirt(ink, dc, { colour, length = 0.6, tails = false, lining = null, open = true } = {}) {
  const { at, P } = dc, { front, back } = thighs(dc);
  const seated = front.joint[1] > P[1] - dc.B.thigh * 0.5;
  const fb = add(lerp(P, front.joint, length), seated ? [0, -3] : [3.5, -1]);
  const bb = add(lerp(P, back.joint, length + 0.06), seated ? [-6, 2] : [-5.2, 0]);
  if (tails) {
    const pts = [at(-6.6, 4), at(-7.6, -2), add(bb, [-0.5, -1]), add(bb, [3.4, -0.5]), at(-2.5, -1), at(-1, 3.5)];
    ink.shape(blob(pts, 0.55), colour, { off: 0.8 });
    if (lining) ink.shape(blob([at(-7, -1), add(bb, [-0.2, -0.5]), add(bb, [2.4, 0]), at(-3.5, -1.5)], 0.5), lining, { shade: false, outline: LINE.fine });
    return;
  }
  const pts = [at(-6.8, 4), at(-7.9, -3), add(bb, [-0.8, 0]), add(lerp(bb, fb, 0.5), [0, -1.5]), add(fb, [1, 0]), at(7.6, -2), at(6.8, 4)];
  ink.shape(blob(pts, 0.6), colour, { off: 1, lift: false });
  if (open) ink.line(curve([at(6.4, 3), add(fb, [-1.5, 1.5])]), { width: LINE.inner, opacity: 0.8 });
  ink.line(curve([at(-3, 0), add(lerp(bb, fb, 0.35), [0, 1])]), { width: LINE.fine, opacity: 0.45 });
}

/** A belt round the waist (side view), drawn over a coat. */
export function beltSide(ink, dc, { colour = COLOURS.leather, buckle = COLOURS.brass, v = 2.5 } = {}) {
  ink.shape(capsule(dc.at(-7, v), dc.at(7, v), 1.5, 1.5), colour, { shade: false, outline: LINE.inner });
  if (buckle) ink.shape(poly([dc.at(5.2, v + 1.4), dc.at(7.2, v + 1.4), dc.at(7.2, v - 1.4), dc.at(5.2, v - 1.4)]), buckle, { shade: false, outline: LINE.fine });
}
/** A strap from a shoulder across the chest to the other hip (side view: from the front shoulder down to the back hip). */
export function strapSide(ink, dc, { colour = COLOURS.leather, width = 3.2, from = [3.5, 1.0], to = [-6.4, 0.05] } = {}) {
  const T = dc.B.torso;
  ink.line(seg(dc.at(from[0], T * from[1]), dc.at(to[0], T * to[1])), { colour: LINE.ink, width: width + 1.6 });
  ink.line(seg(dc.at(from[0], T * from[1]), dc.at(to[0], T * to[1])), { colour, width });
}
/** A shot pouch at the back hip on its strap, and a powder horn at the front (the Texian's). */
export function pouchAndHorn(ink, dc, { pouch = COLOURS.leatherLight, horn = true } = {}) {
  const c = dc.at(-8.2, -1.5);
  ink.shape(blob([add(c, [-3, 3.2]), add(c, [3, 3.4]), add(c, [3.2, -3.4]), add(c, [0, -4.4]), add(c, [-3.2, -3.2])], 0.5), pouch, { off: 0.6 });
  ink.shape(blob([add(c, [-3.1, 3.2]), add(c, [3.1, 3.4]), add(c, [2.4, 0.2]), add(c, [-2.8, 0.4])], 0.5), tone(pouch, -0.12), { shade: false, outline: LINE.fine });
  if (horn) {
    const h0 = dc.at(4.5, 1.5);
    ink.shape(blob([add(h0, [-1.2, 1.4]), add(h0, [4.2, 0.6]), add(h0, [6.6, -1.2]), add(h0, [4, -0.8]), add(h0, [-0.8, -1.1])], 0.8), COLOURS.horn, { shade: false, outline: LINE.inner });
  }
}
/** The Mexican infantryman's white crossbelts (side view: both straps cross the chest and meet at the back hip and front hip). */
export function crossbeltsSide(ink, dc, { colour = COLOURS.white, box = COLOURS.black } = {}) {
  strapSide(ink, dc, { colour, width: 3.4, from: [4, 1.0], to: [-6.6, 0.05] });
  strapSide(ink, dc, { colour, width: 3.4, from: [-5.2, 0.98], to: [6.6, 0.12] });
  // The cartridge box at the back hip, the bayonet frog at the front.
  const c = dc.at(-8.6, 0);
  ink.shape(poly([add(c, [-2.8, 3]), add(c, [2.6, 3.2]), add(c, [2.4, -3]), add(c, [-2.6, -3])]), box, { off: 0.4 });
  ink.shape(poly([dc.at(6.4, 1), dc.at(8.6, 0), dc.at(7, -9), dc.at(5.8, -8.6)]), COLOURS.black, { shade: false, outline: LINE.fine });
}
/** A knapsack on the back with a rolled blanket over it (side view). */
export function knapsackSide(ink, dc, { colour = '#5a4632', roll = '#9a9384' } = {}) {
  const T = dc.B.torso;
  const pts = [dc.at(-6.2, T * 0.92), dc.at(-12.5, T * 0.9), dc.at(-12.8, T * 0.3), dc.at(-6.4, T * 0.28)];
  ink.shape(blob(pts, 0.3), colour, { off: 0.8 });
  ink.shape(capsule(dc.at(-7, T * 1.02), dc.at(-12.2, T * 1.0), 2.6, 2.6), roll, { off: 0.6 });
}
/** Gold epaulettes on the near shoulder (side view), with their fringe. */
export function epauletteSide(ink, dc, { colour = COLOURS.gold } = {}) {
  const top = add(dc.S, mul(dc.t, 1.8));
  ink.shape(ellipse(top, 3.6, 1.8, -dc.lean), colour, { off: 0.5, outline: LINE.inner });
  for (let i = -2; i <= 2; i++) ink.line(seg(add(top, [i * 1.2, -0.6]), add(top, [i * 1.25, -3.6])), { colour: tone(colour, -0.2), width: 1.8 });
}
/** A sash round the waist, knotted at the side with its ends hanging (side view). */
export function sashSide(ink, dc, { colour = COLOURS.red, v = 3 } = {}) {
  ink.shape(capsule(dc.at(-7, v), dc.at(7, v), 2.2, 2.2), colour, { off: 0.4, outline: LINE.inner });
  const k = dc.at(-1.5, v);
  ink.shape(blob([add(k, [-1.4, 0.6]), add(k, [1.4, 0.6]), add(k, [2.2, -9]), add(k, [0.4, -10]), add(k, [-1.6, -8.6])], 0.6), colour, { off: 0.4, outline: LINE.inner });
}
/** A collar and cuffs in a facing colour (side view), for a coat with facings. */
export function collarSide(ink, dc, { colour = COLOURS.red } = {}) {
  const T = dc.B.torso;
  ink.shape(blob([dc.at(-4, T * 0.97), dc.at(-3, T * 1.1), dc.at(4.6, T * 1.06), dc.at(5.2, T * 0.94)], 0.5), colour, { shade: false, outline: LINE.inner });
}
/** A cuff at a wrist: a band round the forearm near the hand. */
export function cuff(ink, chain, colour, r = 3.4) {
  const E = chain.joint, W = chain.end, a = lerp(W, E, 0.34), b = lerp(W, E, 0.5);
  ink.shape(capsule(a, b, r, r), colour, { shade: false, outline: LINE.inner });
}
/** A tall riding boot over a leg (either view): from the ankle to just under the knee. */
export function tallBoot(ink, leg, colour = COLOURS.black, r = 3.9) {
  const K = leg.joint, A = leg.end;
  ink.shape(capsule(lerp(K, A, 0.14), add(A, [0, -1]), r * 1.08, r * 0.95), colour, { off: 0.5 });
  ink.line(seg(add(lerp(K, A, 0.14), [-r, 0]), add(lerp(K, A, 0.14), [r, 0])), { width: LINE.inner, colour: tone(colour, 0.25) });
}
/** A stripe down the outside of a trouser leg (an officer's gold or red). */
export function trouserStripe(ink, leg, hip, colour) {
  ink.line(seg(lerp(hip, leg.joint, 0.1), lerp(leg.joint, leg.end, 0.8)), { colour, width: 1.6 });
}

// ------------------------------------------------------------------------------------------------ frontal layers
/** Crossbelts in the front view: an X over the chest, the plate where they cross. */
export function crossbeltsFront(ink, dc, { colour = COLOURS.white } = {}) {
  const { at, hw, sw, B } = dc, T = B.torso;
  for (const s of [-1, 1]) {
    ink.line(seg(at(-s * sw * 0.72, T * 0.98), at(s * hw * 1.05, T * 0.05)), { colour: LINE.ink, width: 5 });
    ink.line(seg(at(-s * sw * 0.72, T * 0.98), at(s * hw * 1.05, T * 0.05)), { colour, width: 3.4 });
  }
  if (!dc.back) ink.shape(ellipse(at(0, T * 0.52), 1.4, 1.4), COLOURS.brass, { shade: false, outline: LINE.fine });
}
export function strapFront(ink, dc, { colour = COLOURS.leather, left = true } = {}) {
  const { at, hw, sw, B } = dc, T = B.torso, s = left ? -1 : 1;
  ink.line(seg(at(-s * sw * 0.7, T * 0.98), at(s * hw * 1.05, T * 0.02)), { colour: LINE.ink, width: 4.6 });
  ink.line(seg(at(-s * sw * 0.7, T * 0.98), at(s * hw * 1.05, T * 0.02)), { colour, width: 3.0 });
}
export function beltFront(ink, dc, { colour = COLOURS.leather, buckle = COLOURS.brass, v = 2.5 } = {}) {
  const { at, hw } = dc;
  ink.shape(capsule(at(-hw * 1.2, v), at(hw * 1.2, v), 1.5, 1.5), colour, { shade: false, outline: LINE.inner });
  if (buckle && !dc.back) ink.shape(poly([at(-1.3, v + 1.4), at(1.3, v + 1.4), at(1.3, v - 1.4), at(-1.3, v - 1.4)]), buckle, { shade: false, outline: LINE.fine });
}
export function sashFront(ink, dc, { colour = COLOURS.red, v = 3 } = {}) {
  const { at, hw } = dc;
  ink.shape(capsule(at(-hw * 1.2, v), at(hw * 1.2, v), 2.3, 2.3), colour, { off: 0.4, outline: LINE.inner });
  ink.shape(blob([at(hw * 0.6, v), at(hw * 1.0, v), at(hw * 1.1, v - 10), at(hw * 0.7, v - 10.5)], 0.6), colour, { off: 0.4, outline: LINE.inner });
}
export function skirtFront(ink, dc, { colour, length = 0.6, tails = false } = {}) {
  const { at, hw, legs, B } = dc;
  const drop = B.thigh * length;
  if (tails) {
    if (!dc.back) return;
    ink.shape(blob([at(-hw * 0.9, 4), at(-hw * 0.95, -drop), at(hw * 0.95, -drop), at(hw * 0.9, 4)], 0.4), colour, { off: 0.6 });
    ink.line(seg(at(0, 3), at(0, -drop)), { width: LINE.inner });
    return;
  }
  for (const s of [-1, 1]) {
    const pts = [at(s * 0.4, 4), at(s * hw * 1.15, 4), at(s * hw * 1.35, -drop), at(s * hw * 0.35, -drop - 0.5), at(s * 0.8, -2)];
    ink.shape(blob(pts, 0.4), colour, { off: 0.6 });
  }
}
export function epaulettesFront(ink, dc, { colour = COLOURS.gold } = {}) {
  const { N, sw } = dc;
  for (const s of [-1, 1]) {
    const c = add(N, [s * sw * 0.86, -1.4]);
    ink.shape(ellipse(c, 3.4, 1.8), colour, { off: 0.5, outline: LINE.inner });
    for (let i = -1; i <= 1; i++) ink.line(seg(add(c, [i * 1.3, -0.6]), add(c, [i * 1.35, -3.4])), { colour: tone(colour, -0.2), width: 1.8 });
  }
}
export function collarFront(ink, dc, { colour = COLOURS.red } = {}) {
  const { at, B, sw } = dc, T = B.torso;
  ink.shape(blob([at(-sw * 0.5, T * 1.0), at(-sw * 0.4, T * 1.14), at(sw * 0.4, T * 1.14), at(sw * 0.5, T * 1.0), at(0, T * 0.92)], 0.5), colour, { shade: false, outline: LINE.inner });
}
export function knapsackBack(ink, dc, { colour = '#5a4632', roll = '#9a9384' } = {}) {
  const { at, sw, B } = dc, T = B.torso;
  ink.shape(blob([at(-sw * 0.78, T * 0.95), at(sw * 0.78, T * 0.95), at(sw * 0.8, T * 0.3), at(-sw * 0.8, T * 0.3)], 0.25), colour, { off: 0.8 });
  ink.shape(capsule(at(-sw * 0.85, T * 1.02), at(sw * 0.85, T * 1.02), 2.6, 2.6), roll, { off: 0.6 });
}
export function buttonsFront(ink, dc, { colour = COLOURS.brass, rows = 2 } = {}) {
  const { at, B } = dc, T = B.torso;
  for (let i = 0; i < 5; i++) for (const x of rows === 2 ? [-2.4, 2.4] : [0]) ink.dot(ellipse(at(x, T * (0.28 + i * 0.15)), 0.75, 0.75), colour);
}

// ------------------------------------------------------------------------------------------------ hats (head radii: R(x, y))
/** A tall infantry shako: black felt, a brass plate, a peak, a chin scale, a pompom or plume on top. */
export function shako({ colour = '#26262c', band = COLOURS.red, pompom = COLOURS.red, plate = COLOURS.brass, tall = 1.62 } = {}) {
  return {
    kind: 'shako', colour, band,
    draw(ink, { h, R, view, back }) {
      if (view === 'e') {
        ink.shape(poly([R(-0.74, 0.6), R(0.74, 0.58), R(0.9, tall), R(-0.86, tall + 0.03)]), colour, { off: 0.8 });
        ink.shape(poly([R(-0.86, tall - 0.2), R(0.9, tall - 0.22), R(0.9, tall), R(-0.86, tall + 0.03)]), band, { shade: false, outline: LINE.inner });
        ink.shape(poly([R(0.72, 0.58), R(1.32, 0.46), R(1.26, 0.7), R(0.76, 0.76)]), '#141416', { shade: false, outline: LINE.inner });
        ink.shape(ellipse(R(0.84, 1.25), h * 0.14, h * 0.24), plate, { shade: false, outline: LINE.fine });
        ink.line(curve([R(0.72, 0.6), R(0.5, -0.2), R(0.6, -0.8)]), { colour: plate, width: 1.4, opacity: 0.9 });
        ink.shape(ellipse(R(0.18, tall + 0.32), h * 0.24, h * 0.3), pompom, { off: 0.3, outline: LINE.fine });
        return;
      }
      ink.shape(poly([R(-0.8, 0.52), R(0.8, 0.52), R(0.94, tall), R(-0.94, tall)]), colour, { off: 0.8 });
      ink.shape(poly([R(-0.94, tall - 0.2), R(0.94, tall - 0.2), R(0.95, tall), R(-0.95, tall)]), band, { shade: false, outline: LINE.inner });
      ink.shape(ellipse(R(0, tall + 0.32), h * 0.24, h * 0.3), pompom, { off: 0.3, outline: LINE.fine });
      if (!back) {
        ink.shape(ellipse(R(0, 0.52), h * 0.86, h * 0.15), '#141416', { shade: false, outline: LINE.inner });
        ink.shape(ellipse(R(0, 1.2), h * 0.26, h * 0.32), plate, { shade: false, outline: LINE.fine });
      }
    },
  };
}
/** A bicorne, worn athwart (points to the sides), with a cockade: a general's or a field officer's. */
export function bicorne({ colour = '#1e1e22', trim = COLOURS.gold, cockade = '#2e7a3a', plume = null } = {}) {
  return {
    kind: 'bicorne', colour,
    draw(ink, { h, R, view, back }) {
      if (view === 'e') {
        // Athwart: from the side it is a tall half-moon, its front edge over the brow.
        ink.shape(blob([R(-1.05, 0.62), R(-0.6, 1.9), R(0.2, 2.2), R(0.95, 1.4), R(1.12, 0.66), R(0.1, 0.52)], 0.75), colour, { off: 0.8 });
        ink.line(curve([R(-1.0, 0.7), R(0.1, 0.6), R(1.08, 0.72)]), { colour: trim, width: 2 });
        ink.shape(ellipse(R(0.72, 1.3), h * 0.22, h * 0.24), cockade, { shade: false, outline: LINE.fine });
        if (plume) ink.shape(blob([R(-0.2, 2.0), R(0.4, 2.7), R(0.9, 2.5), R(0.5, 2.0)], 0.7), plume, { shade: false, outline: LINE.fine });
        return;
      }
      ink.shape(blob([R(-2.1, 0.7), R(-1.2, 1.25), R(0, 1.55), R(1.2, 1.25), R(2.1, 0.7), R(1.1, 0.55), R(0, 0.6), R(-1.1, 0.55)], 0.7), colour, { off: 0.8 });
      ink.line(curve([R(-2.0, 0.72), R(0, 0.66), R(2.0, 0.72)]), { colour: trim, width: 2 });
      if (!back) ink.shape(ellipse(R(0.9, 1.0), h * 0.24, h * 0.24), cockade, { shade: false, outline: LINE.fine });
      if (plume) ink.shape(ellipse(R(0, 1.7), h * 0.5, h * 0.25), plume, { shade: false, outline: LINE.fine });
    },
  };
}
/** A visored forage cap (as Astra's Castrillón wears): a flat round crown over a band and a small peak. */
export function foragecap({ colour = '#2f3f6a', band = COLOURS.red, badge = COLOURS.gold } = {}) {
  return {
    kind: 'foragecap', colour,
    draw(ink, { h, R, view, back }) {
      if (view === 'e') {
        ink.shape(blob([R(-0.95, 0.62), R(-1.12, 1.25), R(0.1, 1.42), R(1.08, 1.2), R(0.88, 0.62)], 0.7), colour, { off: 0.7 });
        ink.shape(poly([R(-0.9, 0.6), R(0.9, 0.6), R(0.88, 0.9), R(-0.92, 0.9)]), band, { shade: false, outline: LINE.inner });
        ink.shape(poly([R(0.86, 0.62), R(1.4, 0.5), R(1.3, 0.7), R(0.86, 0.76)]), '#141416', { shade: false, outline: LINE.inner });
        ink.shape(ellipse(R(0.78, 1.1), h * 0.12, h * 0.12), badge, { shade: false, outline: LINE.fine });
        return;
      }
      ink.shape(ellipse(R(0, 1.12), h * 1.2, h * 0.36), colour, { off: 0.7 });
      ink.shape(poly([R(-0.9, 0.56), R(0.9, 0.56), R(0.92, 0.94), R(-0.92, 0.94)]), band, { shade: false, outline: LINE.inner });
      if (!back) { ink.shape(ellipse(R(0, 0.54), h * 0.8, h * 0.16), '#141416', { shade: false, outline: LINE.inner }); ink.shape(ellipse(R(0, 1.1), h * 0.13, h * 0.13), badge, { shade: false, outline: LINE.fine }); }
    },
  };
}
/** A top hat (a townsman's or an officer's in civil dress), its crown a little belled. */
export function tophat({ colour = '#2a2622', band = '#141210', tall = 2.1 } = {}) {
  return {
    kind: 'tophat', colour,
    draw(ink, { h, R, view }) {
      const w = view === 'e' ? 0 : 0.06;
      ink.shape(ellipse(R(0, 0.66), h * (view === 'e' ? 1.45 : 1.5), h * 0.26), tone(colour, 0.05), { off: 0.6 });
      ink.shape(poly([R(-0.78 - w, 0.7), R(0.78 + w, 0.7), R(0.9 + w, tall), R(-0.9 - w, tall)]), colour, { off: 0.8 });
      ink.shape(poly([R(-0.8 - w, 0.72), R(0.8 + w, 0.72), R(0.82 + w, 1.0), R(-0.82 - w, 1.0)]), band, { shade: false, outline: LINE.inner });
      ink.shape(ellipse(R(0, tall), h * 0.9, h * 0.16), tone(colour, 0.1), { shade: false, outline: LINE.inner });
    },
  };
}
/** A broad flat-brimmed hat with a low round crown: a preacher's or a townsman's round hat, or a Tejano's sombrero (`wide`). */
export function roundhat({ colour = '#2a2622', band = '#141210', wide = 2.2, crown = 1.3, flat = false } = {}) {
  return {
    kind: 'roundhat', colour,
    draw(ink, { h, R, view, back }) {
      if (view === 'e') {
        ink.shape(blob([R(-wide, 0.64), R(-0.2, 0.8), R(wide, 0.66), R(wide - 0.1, 0.5), R(0, 0.48), R(-wide + 0.1, 0.5)], 0.6), tone(colour, 0.05), { off: 0.6 });
        ink.shape(blob(flat ? [R(-0.8, 0.66), R(-0.78, 0.66 + crown), R(0.8, 0.66 + crown), R(0.82, 0.66)] : [R(-0.8, 0.66), R(-0.74, 0.66 + crown * 0.8), R(0, 0.66 + crown), R(0.74, 0.66 + crown * 0.8), R(0.82, 0.66)], 0.6), colour, { off: 0.9 });
        ink.shape(blob([R(-0.82, 0.68), R(0.84, 0.7), R(0.82, 0.94), R(-0.8, 0.92)], 0.5), band, { shade: false, outline: LINE.inner });
        return;
      }
      ink.shape(ellipse(R(0, 0.64), h * wide, h * 0.46), tone(colour, 0.05), { off: 0.8 });
      ink.shape(blob(flat ? [R(-0.8, 0.66), R(-0.78, 0.66 + crown), R(0.78, 0.66 + crown), R(0.8, 0.66)] : [R(-0.82, 0.66), R(-0.74, 0.66 + crown * 0.8), R(0, 0.66 + crown), R(0.74, 0.66 + crown * 0.8), R(0.82, 0.66)], 0.6), colour, { off: 0.9 });
      ink.shape(blob([R(-0.82, 0.68), R(0.82, 0.68), R(0.8, 0.94), R(-0.8, 0.94)], 0.5), band, { shade: false, outline: LINE.inner });
      if (!back) ink.line(curve([R(-wide + 0.25, 0.5), R(0, 0.26), R(wide - 0.25, 0.5)]), { width: LINE.fine, opacity: 0.55 });
    },
  };
}
/** A rebozo worn over the head and shoulders (a Tejana's shawl), drawn as a hood that falls to the shoulders. */
export function rebozoHood({ colour = '#5a6a7a', stripe = '#e8dcc0' } = {}) {
  return {
    kind: 'rebozo', colour,
    draw(ink, { h, R, view, back }) {
      if (view === 'e') {
        ink.shape(blob([R(0.35, 1.1), R(-0.4, 1.28), R(-1.2, 0.7), R(-1.4, -0.6), R(-1.3, -1.6), R(-0.5, -1.4), R(-0.3, -0.6), R(0.1, 0.4), R(0.55, 0.95)], 0.8), colour, { off: 0.8 });
        ink.line(curve([R(-1.25, -1.2), R(-0.9, -0.2), R(-0.2, 0.9)]), { colour: stripe, width: 1.4, opacity: 0.8 });
        return;
      }
      if (back) {
        ink.shape(blob([R(-1.2, 0.6), R(0, 1.3), R(1.2, 0.6), R(1.35, -1.5), R(0, -1.7), R(-1.35, -1.5)], 0.8), colour, { off: 0.8 });
        return;
      }
      ink.shape(blob([R(-1.25, -1.4), R(-1.25, 0.4), R(-0.5, 1.28), R(0.5, 1.28), R(1.25, 0.4), R(1.25, -1.4), R(0.95, -0.6), R(0.9, 0.5), R(0, 1.0), R(-0.9, 0.5), R(-0.95, -0.6)], 0.8), colour, { off: 0.8 });
    },
  };
}

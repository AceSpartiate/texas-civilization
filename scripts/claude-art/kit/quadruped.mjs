// The four-legged rig: the horse, the mule, the milk cow and the ox, side-on facing east (the game mirrors for west), and
// toward or away from the camera. Drawn by Claude for area D of docs/CLAUDE_ART_PLAN.md (2026-09-28), replacing the
// foundation's horse of straight tapered sticks: a muscled body with its shoulder and quarters drawn over it, and legs jointed
// as a horse's are - shoulder, elbow, knee, fetlock and pastern in front; hip, stifle, hock, fetlock and pastern behind - so the
// knee folds forward and the hock back, the hoof flips as it leaves the ground, and a planted leg stands straight.
//
// Gaits are real ones, not a swing of four sticks: each leg has a phase, a share of the cycle it spends on the ground (its duty
// factor) and a stride; the frame samples every leg at its own phase.
//   walk    four beats, lateral sequence (near hind, near fore, far hind, far fore), three feet down at a time; the head nods.
//   trot    two beats, the diagonal pairs together; the body rises between them.
//   gallop  four beats with a moment of suspension, the body rocking; the neck pumps.
// A planted leg's hoof is on the ground and its shoulder or hip is solved so the leg stands straight (the fore) or at its
// natural hock angle (the hind); a leg in the air folds by two-bone IK.
//
// Proportions (rig units, a standing person 100 from the ground to the hat): fitted to Astra's mounted cast frames as the game
// draws them (1.8 of a person) - withers ~99, the saddle ~95, the belly ~49, the poll ~130, the body from the buttock at -72 to
// the chest at +60, the muzzle at ~+120 - and to her `horse-walk`: a deep chest and heavy quarters, a crested neck, a short
// cannon with a round fetlock, a sloping pastern, and dark lower legs under the family's bay.
//
// ceiling: flat shapes with one shade and a few contour lines where she paints the muscle; the legs are tapered capsules with
// knobs for the joints. At play size (a horse about 55-75 px) it reads as a horse walking; close up it is plainly simpler than
// hers. The way out is her frame of the same name, which wins in the loader.
import { LINE, tone } from './style.mjs';
import { Ink, add, sub, mul, norm, lerp, len, capsule, blob, curve, poly, ellipse, deg } from './svg.mjs';
import { ik } from './rig.mjs';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rot = ([x, y], a) => { const c = Math.cos(deg(a)), s = Math.sin(deg(a)); return [x * c - y * s, x * s + y * c]; };
const about = (p, c, a) => add(c, rot(sub(p, c), a));
const smooth = t => t * t * (3 - 2 * t);

/**
 * Species: the landmarks of the body, neck and head, and the legs' bones, in rig units for a horse; `size` scales all of it.
 * Every other animal is the horse's skeleton reshaped: a cow is lower and longer in the barrel with a deep belly and an udder,
 * an ox heavier with a hump of neck and horns, a mule a horse with long ears, a tufted tail and a straighter back.
 */
export const SPECIES = {
  horse: {
    size: 1,
    body: [[26, 100], [8, 95], [-18, 95.5], [-40, 99], [-52, 97], [-60, 92], [-65, 82], [-66, 70], [-63, 57], [-56, 49], [-47, 50], [-39, 55], [-24, 53.5], [-8, 52], [10, 51.5], [24, 52.5], [30, 50], [37, 46.5], [45, 48.5], [51, 57], [57, 69], [60, 80], [58, 88], [42, 101]],
    neck: [[24, 101], [36, 113], [50, 125], [62, 132], [72, 136], [86, 112], [80, 100], [70, 88], [58, 78]],
    head: [[72, 136], [82, 135], [94, 123], [106, 108], [113, 99], [113, 93], [106, 90], [96, 93], [88, 99], [82, 106], [80, 114]],
    neckPivot: [40, 90], poll: [74, 133],
    ears: [[[71, 135], [70, 147], [77, 136]], [[75, 135], [77, 146], [81, 134]]],
    eye: [89, 122], nostril: [109, 99], mouth: [[101, 92], [108, 92.5]],
    muzzle: [[101, 92], [108, 105], [114, 98], [113, 92], [106, 90]], blaze: [[92, 124], 2, 3.2, -40],
    crest: [[24, 102], [36, 114], [50, 126], [62, 133], [73, 137]], hang: [[72, 129], [60, 124], [48, 116], [36, 106], [26, 97]], forelock: [[73, 136], [81, 134], [86, 127], [79, 129]],
    bridle: { cheek: [[76, 131], [82, 116], [89, 104]], nose: [[89, 104], [99, 104], [108, 102]], brow: [[75, 129], [81, 129], [87, 127]], bit: [101, 94] },
    shoulder: [[28, 98], [44, 90], [55, 78], [53, 64]], haunch: [[-38, 98], [-54, 95], [-63, 82], [-63, 68]],
    fore: { root: [46, 78], upper: 27, mid: 27, low: 17, x: 38, rest: [-12, -22] },
    hind: { root: [-48, 80], upper: 26, mid: 28, low: 21, x: -50, rest: [10, -23] },
    tailRoot: [-60, 93], tail: 'long', mane: true, hoof: 5, half: 28,
  },
};
SPECIES.mule = {
  ...SPECIES.horse, size: 0.9,
  ears: [[[70, 135], [66, 156], [76, 137]], [[75, 135], [76, 155], [81, 134]]],
  tail: 'tuft', mane: 'roached', half: 25,
};
SPECIES.cow = {
  ...SPECIES.horse, size: 0.86,
  body: [[26, 94], [8, 95], [-22, 95], [-46, 97], [-60, 95], [-68, 90], [-72, 80], [-72, 66], [-66, 55], [-48, 49], [-24, 42], [4, 41], [22, 44], [32, 48], [46, 55], [56, 64], [60, 76], [58, 88], [42, 97]],
  neck: [[30, 96], [44, 99], [58, 101], [72, 103], [80, 104], [86, 82], [76, 72], [64, 64], [56, 64]],
  head: [[78, 105], [88, 106], [98, 100], [108, 88], [114, 78], [113, 71], [106, 68], [98, 70], [90, 78], [86, 84], [80, 90]],
  neckPivot: [44, 84], poll: [80, 102],
  ears: [[[80, 99], [70, 97], [79, 94]], [[82, 101], [74, 104], [82, 98]]],
  horns: [[82, 104], [86, 113], [90, 116]],
  eye: [94, 94], nostril: [111, 74], mouth: [[104, 69.5], [111, 70]], muzzle: [[104, 69], [106, 80], [114, 78], [114, 71], [108, 67]], blaze: null,
  bridle: { cheek: [[82, 100], [88, 88], [94, 78]], nose: [[94, 78], [104, 80], [112, 80]], brow: [[82, 100], [88, 100], [92, 98]], bit: [104, 72] },
  shoulder: [[30, 94], [46, 86], [58, 74], [54, 60]], haunch: [[-44, 96], [-60, 92], [-70, 80], [-70, 64]],
  fore: { root: [48, 70], upper: 24, mid: 22, low: 15, x: 36, rest: [-12, -21] },
  hind: { root: [-52, 72], upper: 24, mid: 24, low: 19, x: -56, rest: [12, -21] },
  tailRoot: [-66, 93], tail: 'switch', mane: false, udder: true, hoof: 4.2, cloven: true, dewlap: true, half: 25,
};
SPECIES.ox = {
  ...SPECIES.cow, size: 0.95,
  body: [[26, 100], [14, 102], [-8, 97], [-30, 96], [-50, 98], [-62, 95], [-70, 88], [-74, 76], [-72, 62], [-64, 52], [-44, 46], [-18, 42], [6, 41], [24, 43], [36, 48], [48, 56], [58, 66], [62, 80], [58, 92], [42, 102]],
  neck: [[28, 100], [44, 101], [58, 99], [72, 98], [80, 98], [86, 78], [76, 68], [64, 60], [56, 62]],
  head: [[78, 99], [90, 100], [100, 94], [110, 82], [116, 72], [115, 64], [107, 61], [98, 63], [90, 72], [86, 78], [80, 86]],
  poll: [82, 97], horns: [[84, 99], [96, 108], [101, 118]], ears: [[[80, 94], [68, 91], [78, 89]], [[82, 96], [72, 99], [82, 93]]],
  eye: [96, 89], nostril: [113, 67], mouth: [[106, 62.5], [113, 63]], muzzle: [[106, 62], [108, 74], [116, 72], [116, 64], [110, 60]],
  bridle: { cheek: [[84, 96], [90, 84], [96, 72]], nose: [[96, 72], [106, 74], [114, 73]], brow: [[84, 96], [90, 96], [94, 94]], bit: [106, 65] },
  shoulder: [[30, 100], [46, 92], [58, 78], [56, 62]], haunch: [[-46, 97], [-62, 93], [-72, 80], [-70, 62]],
  udder: false, hump: true, half: 27,
};

// The range steer the foragers drive off: a cow's frame, heavier, with the long spreading horns of the Texas cattle.
SPECIES.longhorn = { ...SPECIES.cow, size: 0.9, udder: false, dewlap: false, horns: [[82, 104], [96, 110], [118, 114]] };

/** Coats. `points` is the lower leg; `blaze` a white mark on the face, `socks` white stockings, `patches` a cow's piebald. */
export const COATS = {
  // The family's horse as her mounted cast rides it: a warm bay, black mane and tail, dark lower legs, a small star.
  bay: { coat: '#9a5a32', mane: '#2a1c14', points: '#4a2e1e', hoof: '#3a2a1e', blaze: '#f2e6cc', muzzle: '#6a3e26' },
  chestnut: { coat: '#a8582c', mane: '#7a3a1c', points: '#8a4622', hoof: '#3a2a1e', blaze: '#f2e6cc', socks: '#efe0c4', muzzle: '#7a4024' },
  dun: { coat: '#b8925a', mane: '#2a1f16', points: '#3a2a1c', hoof: '#2e2218', muzzle: '#6a5238', dorsal: '#4a3522' },
  black: { coat: '#3a302a', mane: '#1c1612', points: '#241c16', hoof: '#1e1812', muzzle: '#2a221c' },
  grey: { coat: '#b9b3a6', mane: '#6d6860', points: '#77716a', hoof: '#3a342e', muzzle: '#6a655e' },
  sorrel: { coat: '#b0663a', mane: '#c89a5a', points: '#8e4e2a', hoof: '#3a2a1e', blaze: '#f2e6cc', muzzle: '#7a4428' },
  mouse: { coat: '#7e6e5c', mane: '#2e2620', points: '#4a3e32', hoof: '#2a221c', muzzle: '#d8c8a8', belly: '#b8a88e' },
  // The milk cow: a brown-and-white cow of the old kind, lighter-boned than the range longhorn.
  milk: { coat: '#f0e4cc', mane: '#8a4a28', points: '#e4d6bc', hoof: '#3a2a1e', muzzle: '#e8b8a0', patches: '#8a4a28', horn: '#e8dcc0' },
  // The work ox: a brown ox as Astra's `ox-walk` and `ox-brown`.
  ox: { coat: '#8a4e2c', mane: '#5a321c', points: '#6a3a20', hoof: '#2e2218', muzzle: '#d8b098', horn: '#ecdcc0' },
  oxCream: { coat: '#d8c09a', mane: '#9a7a52', points: '#b89a70', hoof: '#3a2a1e', muzzle: '#e0b8a0', horn: '#ecdcc0' },
  longhorn: { coat: '#9a4a26', mane: '#6a2e16', points: '#7a3a1e', hoof: '#2e2218', muzzle: '#e0c0a0', patches: '#f0e2c8', horn: '#ecdcc0' },
};

/** Gaits: duty factor, stride (hoof travel on the ground), lift of the fore and hind hoof, and each leg's phase offset. */
export const GAITS = {
  walk: { duty: 0.62, stride: 38, lift: [11, 8], phase: { nh: 0, nf: 0.25, fh: 0.5, ff: 0.75 }, bob: 1.1, nod: 4, t0: 0.06 },
  trot: { duty: 0.42, stride: 42, lift: [17, 13], phase: { nf: 0, fh: 0, ff: 0.5, nh: 0.5 }, bob: 2.6, nod: 1.5, t0: 0.08 },
  gallop: { duty: 0.3, stride: 60, lift: [22, 18], phase: { fh: 0, nh: 0.1, ff: 0.32, nf: 0.42 }, bob: 3, nod: 7, pitch: 5, t0: 0 },
};

/** A leg's hoof on the ground (x from its neutral place, lift 0) or in the air, and how far through its swing it is. */
function hoofAt(gait, phase, fore) {
  const { duty, stride } = gait, R = stride / 2, p = ((phase % 1) + 1) % 1;
  if (p < duty) return { x: R * (1 - 2 * p / duty), lift: 0, s: -1 };
  const s = (p - duty) / (1 - duty);
  const lift = gait.lift[fore ? 0 : 1];
  // The fore hoof comes up and back under the folded knee before it reaches forward; the hind comes forward low.
  const x = -R + 2 * R * smooth(fore ? clamp((s - 0.12) / 0.88, 0, 1) : s);
  return { x, lift: lift * Math.sin(Math.PI * s) ** (fore ? 0.8 : 1.1), s };
}

/**
 * A horse's (or mule's, cow's, ox's) pose for frame `frame` of `gait` in `frames` frames; `gait` null stands square, 'graze'
 * puts the head down. Returns everything the side drawing needs: the body's offset and pitch, the neck's and head's angles,
 * and each leg's shoulder or hip, middle joints, fetlock and hoof.
 */
export function quadPose(speciesName, { gait = null, frame = 0, frames = 4, head = 0, neck = 0, graze = false, tailSwing = 0 } = {}) {
  const S = SPECIES[speciesName], G = gait ? GAITS[gait] : null;
  const t = G ? G.t0 + frame / frames : 0;
  let bob = 0, pitch = 0, nod = 0;
  if (G) {
    // The body is lowest as a planted fore takes the weight; the trot rises between the diagonals, the gallop rocks.
    const w = Math.cos(2 * Math.PI * (t * (gait === 'trot' ? 2 : gait === 'walk' ? 2 : 1)));
    bob = gait === 'trot' ? G.bob * Math.max(0, Math.sin(2 * Math.PI * ((t * 2) % 1 - 0.42) / 1.16 * 1)) - G.bob * 0.3 : G.bob * 0.5 * w;
    if (gait === 'gallop') { pitch = G.pitch * Math.sin(2 * Math.PI * (t - 0.15)); bob = G.bob * Math.sin(2 * Math.PI * (t + 0.1)); }
    nod = G.nod * Math.sin(2 * Math.PI * (t * (gait === 'gallop' ? 1 : 2) - 0.1));
  }
  const pose = { species: speciesName, S, bob, pitch, neck: neck + (graze ? -52 : 0) - nod * 0.6, head: head + (graze ? -28 : 0) + nod * 0.4, tailSwing, legs: {} };
  const place = p => about(add(p, [0, bob]), [0, 70], pitch);
  pose.place = place;
  for (const key of ['nf', 'ff', 'nh', 'fh']) {
    const fore = key[1] === 'f';
    const L = fore ? S.fore : S.hind;
    const root = place(L.root);
    const neutral = L.x + (key[0] === 'f' ? (fore ? -3 : 3) : 0);
    const h = G ? hoofAt(G, t + G.phase[key], fore) : { x: 0, lift: 0, s: -1 };
    const hoof = [neutral + h.x + (G ? 0 : (key === 'nf' ? 2 : key === 'fh' ? -2 : 0)), h.lift];
    pose.legs[key] = solveLeg(S, fore, root, hoof, h.s);
  }
  return pose;
}

/** Solve one leg: the upper bone swung so a planted leg stands at its natural reach, the rest by two-bone IK. */
function solveLeg(S, fore, root, hoof, s) {
  const L = fore ? S.fore : S.hind, k = 1;
  const planted = s < 0;
  // The pastern: sloping up and back from a planted hoof; flipped back under the fetlock in the air.
  const flip = planted ? 0 : Math.sin(Math.PI * clamp(s * 1.2, 0, 1));
  const pastern = lerp([-3.5, 10.5], fore ? [5.5, 8.5] : [3, 10], flip);
  const fetlock = add(hoof, pastern);
  const reach = (L.mid + L.low) * (planted ? (fore ? 0.985 : 0.955) : (fore ? 0.99 - 0.3 * Math.sin(Math.PI * s) : 0.95 - 0.16 * Math.sin(Math.PI * s)));
  const restA = Math.atan2(L.rest[1], L.rest[0]);
  // In the air the upper bone leads: back at lift-off, forward before the hoof lands.
  const prefer = planted ? restA : restA + (fore ? -1 : 1) * deg(14) * (Math.cos(Math.PI * s));
  let best = null;
  for (let i = -40; i <= 40; i++) {
    const a = restA + deg(i);
    const mid = add(root, [Math.cos(a) * L.upper, Math.sin(a) * L.upper]);
    const cost = Math.abs(len(sub(fetlock, mid)) - reach) + 6 * Math.abs(a - prefer);
    if (!best || cost < best.cost) best = { cost, mid };
  }
  const chain = ik(best.mid, fetlock, L.mid, L.low, fore ? 1 : -1);
  const end = chain.end;
  // A planted leg that cannot reach its hoof's place any more is breaking over: the heel rises and the hoof tips onto its toe.
  if (planted && len(sub(end, fetlock)) > 0.4) {
    const toe = add(hoof, [4.2, 0]), p = norm(sub(end, toe)), lengthP = len(pastern);
    const tipped = mul(p, lengthP);
    return { fore, root, mid: best.mid, joint: chain.joint, fetlock: end, hoof: sub(end, tipped), pastern: tipped, flip, planted };
  }
  return { fore, root, mid: best.mid, joint: chain.joint, fetlock: end, hoof: sub(end, pastern), pastern, flip, planted };
}

/// ------------------------------------------------------------------------------------------------------------ side view
/**
 * Draw the animal side-on, facing east, into `ink` (rig units, y up, ground 0). `tack` draws the bridle and, if `saddle`, the
 * saddle, blanket and saddlebags; `pack` a pack saddle with its load drawn by the callback. Returns the seat, the reins' bit,
 * the saddle's cantle and horn, and the pose, for a rider or a load.
 */
export function drawQuadSide(ink, speciesName, pose, { coat = COATS.bay, tack = false, saddle = false, blanket = '#b8342a', pack = null, yoke = false, rope = false, halter = false, over = null, under = null } = {}) {
  const S = SPECIES[speciesName];
  const z = S.size;
  // Everything is laid out in the horse's units and scaled about the ground under the saddle.
  const g = new ScaledInk(ink, z);
  const P = pose.place;
  const far = c => tone(c, -0.2);
  const neckRot = p => about(p, S.neckPivot, pose.neck);
  const headRot = p => about(neckRot(p), neckRot(S.poll), pose.head);
  const H = p => P(headRot(p)), N = p => P(neckRot(p));
  const L = pose.legs;
  if (under) under(g, pose);

  // Far legs behind everything, then the tail.
  drawLeg(g, S, L.ff, coat, far);
  drawLeg(g, S, L.fh, coat, far);
  drawTail(g, S, P, coat, pose);
  // Body, then the neck and the head.
  g.shape(blob(S.body.map(P), 0.9), coat.coat, { off: 2.6, lift: true });
  if (coat.patches) drawPatches(g, S, P, coat);
  if (coat.belly) g.dot(blob([P([-36, 52]), P([-10, 48]), P([20, 48]), P([10, 56]), P([-26, 58])], 0.9), coat.belly, 0.6);
  if (coat.dorsal) g.line(curve([P([26, 99]), P([0, 94]), P([-30, 95]), P([-54, 96])]), { width: 3.2, colour: coat.dorsal, opacity: 0.8 });
  if (S.udder) {
    g.shape(blob([P([-40, 49]), P([-44, 42]), P([-38, 38]), P([-28, 38]), P([-24, 44]), P([-28, 49])], 0.9), '#e9b3a0', { off: 0.8 });
    for (const x of [-40, -33, -27]) g.shape(capsule(P([x, 39]), P([x - 0.5, 35]), 1.1, 0.9), '#dc9c88', { shade: false, outline: LINE.fine });
  }
  if (S.dewlap) g.shape(blob([N([58, 78]), N([70, 66]), N([80, 70]), N([76, 82])], 0.9), tone(coat.coat, -0.04), { off: 1 });
  g.shape(blob(S.neck.map(N), 0.85), coat.coat, { off: 2, lift: true });
  if (S.hump) g.shape(blob([P([14, 100]), P([26, 108]), P([38, 104]), P([40, 96]), P([22, 94])], 0.9), coat.coat, { off: 1.4, lift: true });
  const head = S.head.map(H);
  g.shape(blob(head, 0.9), coat.coat, { off: 1.8, lift: true });
  if (S.muzzle) g.dot(blob(S.muzzle.map(H), 0.9), coat.muzzle, 0.8);
  g.line(blob(head, 0.9), { width: LINE.outer });
  // Ears, horns, the mane on the crest and the forelock.
  for (const [i, ear] of S.ears.entries()) g.shape(blob(ear.map(H), 0.7), i ? coat.coat : far(coat.coat), { shade: false, outline: LINE.inner + 0.8 });
  if (S.horns) drawHorns(g, S, P, headRot, coat);
  if (S.mane === true) {
    const crest = S.crest.map(N), hang = S.hang.map(N);
    g.shape(blob([...crest, ...hang], 0.7), coat.mane, { off: 0.8 });
    for (let i = 0; i < 4; i++) g.line(curve([lerp(crest[i], crest[i + 1], 0.5), lerp(hang[3 - i], hang[4 - i], 0.4)]), { width: LINE.fine, colour: tone(coat.mane, 0.3), opacity: 0.6 });
    g.shape(blob(S.forelock.map(H), 0.7), coat.mane, { shade: false, outline: LINE.inner });
  } else if (S.mane === 'roached') {
    const crest = S.crest.map(N), inner = S.crest.map(p => N(add(p, [3, -5]))).reverse();
    g.shape(blob([...crest, ...inner], 0.7), coat.mane, { shade: false, outline: LINE.inner });
  }
  // The face: the white mark, eye, nostril, mouth.
  if (coat.blaze && S.blaze) g.dot(ellipse(H(S.blaze[0]), S.blaze[1], S.blaze[2], S.blaze[3] + pose.head + pose.neck), coat.blaze);
  g.dot(ellipse(H(S.eye), 1.9, 2.1), LINE.ink);
  g.dot(ellipse(add(H(S.eye), [-0.5, 0.7]), 0.6, 0.6), '#fff8ea');
  g.line(curve([H(add(S.eye, [-3, 3])), H(add(S.eye, [1, 3.6])), H(add(S.eye, [3.5, 2]))]), { width: LINE.fine, opacity: 0.6 });
  g.dot(ellipse(H(S.nostril), 1.5, 1.2, -30), LINE.ink);
  g.line(curve(S.mouth.map(H)), { width: LINE.inner });
  // Tack or harness over the body, before the near legs.
  if (tack || halter) drawBridle(g, S, H, tack ? '#5a3a22' : '#8a6a3a', !tack);
  if (saddle) drawSaddle(g, P, blanket, tack === 'military');
  if (pack) pack(g, P, pose);
  if (yoke) drawYokeSide(g, S, P, neckRot, yoke);
  if (rope) drawLeadRope(g, S, H, rope);
  // The near legs over the body; then the near shoulder and quarters over the legs' tops, as her painted contours: the
  // shoulder blade down to the elbow, the quarters down to the stifle, the ribs.
  // Drawn clipped to outside the body, so a leg comes out of the body's own edge with no seam or cap where it joins.
  const clip = ink.id('legs');
  ink.defs.push(`<clipPath id="${clip}"><path clip-rule="evenodd" d="M -400 -400 L 400 -400 L 400 400 L -400 400 Z ${g.S(blob(S.body.map(P), 0.9))}"/></clipPath>`);
  const legInk = new Ink(ink.prefix + 'l', ink.k, { yUp: ink.yUp });
  legInk.n = ink.n + 300;
  const lg = new ScaledInk(legInk, z);
  drawLeg(lg, S, L.nh, coat, c => c);
  drawLeg(lg, S, L.nf, coat, c => c);
  ink.n = legInk.n + 1;
  ink.defs.push(...legInk.defs);
  ink.raw(`<g clip-path="url(#${clip})">${legInk}</g>`);
  const nf = L.nf, nh = L.nh;
  // The contours: the shoulder blade down to the elbow, the quarters to the stifle.
  g.line(curve([...S.shoulder.map(P), add(nf.mid, [7, 5])]), { width: LINE.fine, opacity: 0.55 });
  g.line(curve([add(nf.mid, [-6, 6]), P([S.shoulder[0][0] - 4, 64]), P([S.shoulder[0][0] - 2, 78])]), { width: LINE.fine, opacity: 0.35 });
  g.line(curve([...S.haunch.map(P), add(nh.mid, [-8, 5])]), { width: LINE.fine, opacity: 0.55 });
  g.line(curve([add(nh.mid, [7, 6]), P([S.haunch[0][0] + 10, 72]), P([S.haunch[0][0] + 6, 90])]), { width: LINE.fine, opacity: 0.4 });
  g.line(curve([P([-4, 58]), P([6, 70]), P([10, 82])]), { width: LINE.fine, opacity: 0.3 });
  g.line(curve([P([-16, 56]), P([-9, 68]), P([-7, 80])]), { width: LINE.fine, opacity: 0.25 });
  if (saddle && !S.cloven) drawStirrupLeather(g, P);
  if (over) over(g, pose);
  const u = v => mul(v, z);
  return {
    seat: u(P([-4, 99])), cantle: u(P([-16, 104])), horn: u(P([10, 104])), bit: u(H(S.bridle.bit)), withers: u(P(S.body[0])),
    poll: u(H(S.poll)), muzzle: u(H(S.nostril)), croup: u(P([-44, 99])), chest: u(P([58, 80])), pose, scale: z,
  };
}

/** Drawing in horse units into a rig-unit Ink: scale every point by the species' size (a mule or cow is smaller). */
class ScaledInk {
  constructor(ink, z) { this.ink = ink; this.z = z; }
  S(d) { return this.z === 1 ? d : d.replace(/-?\d+(\.\d+)?/g, m => String(Math.round(parseFloat(m) * this.z * 100) / 100)); }
  shape(d, fill, o = {}) { this.ink.shape(this.S(d), fill, o); }
  line(d, o = {}) { this.ink.line(this.S(d), o); }
  dot(d, fill, opacity) { this.ink.dot(this.S(d), fill, opacity); }
  raw(svg) { this.ink.raw(svg); }
}
// ceiling: ScaledInk rescales numbers in path data, which is exact for M/L/C/Z and would scale an arc's flags too - the rig
// only emits arcs from `capsule`, whose flags are 0 and so unchanged. A transform group would be the way out if another
// path command is ever used here.

/** A smooth limb through `pts` with half-widths `ws`: one outline, no seams at the joints. */
export function limb(pts, ws, tension = 0.75) {
  const left = [], right = [];
  pts.forEach((p, i) => {
    const d = norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)])), n = [-d[1], d[0]];
    left.push(add(p, mul(n, ws[i]))); right.push(sub(p, mul(n, ws[i])));
  });
  return blob([...left, ...right.reverse()], tension);
}

/** The same limb's outline without its top: the sides and the foot, so a leg's root melts into the body it hangs from. */
export function limbEdge(pts, ws, tension = 0.75) {
  const left = [], right = [];
  pts.forEach((p, i) => {
    const d = norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)])), n = [-d[1], d[0]];
    left.push(add(p, mul(n, ws[i]))); right.push(sub(p, mul(n, ws[i])));
  });
  const end = pts.at(-1), dir = norm(sub(end, pts.at(-2)));
  return curve([...left.slice(1), add(end, mul(dir, ws.at(-1) * 0.8)), ...right.reverse().slice(0, -1)], tension);
}

function drawLeg(g, S, leg, coat, shade) {
  const { mid, joint, fetlock, hoof, fore, pastern } = leg;
  const upper = shade(coat.coat), lower = shade(coat.points || coat.coat), sock = coat.socks ? shade(coat.socks) : null;
  const hr = S.hoof;
  const turn = Math.atan2(pastern[1], pastern[0]) - Math.atan2(10.5, -3.5);
  const coronet = add(hoof, rot([0.4, hr], turn * 180 / Math.PI));
  const k = S.cloven ? 1.1 : 1;
  // One smooth leg from the elbow or stifle to the hoof: the forearm or gaskin muscled, narrowing to the knee or hock, the
  // cannon thin, a round fetlock, the pastern.
  const pts = fore
    ? [add(mid, [0, 5]), mid, lerp(mid, joint, 0.45), joint, lerp(joint, fetlock, 0.5), fetlock, coronet]
    : [add(mid, [1, 6]), mid, lerp(mid, joint, 0.4), joint, lerp(joint, fetlock, 0.5), fetlock, coronet];
  const ws = (fore ? [13, 11.5, 6.8, 4.4, 3.3, 4.1, 3.4] : [15, 13.5, 8.2, 4.8, 3.5, 4.1, 3.4]).map(w => w * k);
  const whole = limb(pts, ws);
  g.shape(whole, upper, { off: 1, outline: 0 });
  // The dark lower leg (a bay's points), or a white stocking, from the knee or hock down.
  if (coat.points && coat.points !== coat.coat && !sock) g.shape(limb(pts.slice(3), ws.slice(3)), lower, { off: 0.5, outline: 0 });
  else if (sock) g.shape(limb(pts.slice(4), ws.slice(4)), sock, { off: 0.5, outline: 0 });
  g.line(limbEdge(pts, ws), { width: LINE.outer });
  // The joints' small contours: the knee's front, the point of the hock, the fetlock's back.
  if (fore) g.line(curve([add(joint, [2.6, 2.6]), add(joint, [3.8, 0]), add(joint, [2.6, -2.6])]), { width: LINE.fine, opacity: 0.55 });
  else {
    g.line(curve([add(mid, [-6, -2]), add(lerp(mid, joint, 0.5), [-5.5, 0]), add(joint, [-3.5, 3])]), { width: LINE.fine, opacity: 0.4 });
  }
  g.line(curve([add(fetlock, [-3.4, 1.5]), add(fetlock, [-4, -0.8]), add(fetlock, [-2.2, -2.6])]), { width: LINE.fine, opacity: 0.5 });
  // The hoof: a wedge, sole on the ground when planted, turned with the pastern in the air.
  const hp = [[-3.2, 0], [4.2, 0], [2.4, hr], [-2.8, hr * 0.92]].map(p => add(hoof, rot(p, turn * 180 / Math.PI)));
  g.shape(poly(hp), shade(coat.hoof), { shade: false, outline: LINE.inner + 1.2 });
  if (S.cloven) g.line(`M ${f(lerp(hp[0], hp[1], 0.62))} L ${f(lerp(hp[3], hp[2], 0.55))}`, { width: LINE.fine });
}
const f = p => `${Math.round(p[0] * 100) / 100} ${Math.round(p[1] * 100) / 100}`;

function drawTail(g, S, P, coat, pose) {
  const r = S.tailRoot, sw = pose.tailSwing + pose.pitch * 0.8 + pose.bob * -1.2;
  if (S.tail === 'long') {
    const tip = P([r[0] - 12 - sw * 0.6, 34 + sw]);
    const pts = [P(r), P([r[0] - 9, r[1] - 2]), P([r[0] - 15 - sw * 0.2, r[1] - 18]), P([r[0] - 18 - sw * 0.5, r[1] - 38]), tip, P([r[0] - 7 - sw * 0.5, 40 + sw]), P([r[0] - 5, r[1] - 26]), P([r[0] - 1, r[1] - 10])];
    g.shape(blob(pts, 0.8), coat.mane, { off: 1 });
    g.line(curve([P([r[0] - 5, r[1] - 6]), P([r[0] - 12, r[1] - 28]), lerp(tip, P([r[0] - 9, 42]), 0.4)]), { width: LINE.fine, colour: tone(coat.mane, 0.3), opacity: 0.6 });
  } else {
    // A cow's or a mule's: a thin tail to about the hock and a tuft at the end.
    const end = P([r[0] - 6 - sw * 0.5, 34 + sw * 0.5]);
    g.shape(capsule(P(r), end, 1.8, 1.2), coat.coat, { shade: false, outline: LINE.inner + 0.6 });
    g.shape(blob([add(end, [-2.5, 2]), add(end, [2.5, 2]), add(end, [3, -7]), add(end, [0, -10]), add(end, [-3, -6])], 0.8), coat.mane, { shade: false, outline: LINE.inner + 0.6 });
  }
}

function drawPatches(g, S, P, coat) {
  // A few large patches on a pale ground, as a brown-and-white cow; kept inside the body by being drawn well within it.
  const patch = pts => g.dot(blob(pts.map(P), 0.9), coat.patches, 1);
  patch([[-6, 92], [-30, 90], [-36, 74], [-22, 62], [-4, 68], [2, 84]]);
  patch([[22, 92], [34, 90], [44, 78], [30, 70], [16, 80]]);
}

function drawHorns(g, S, P, headRot, coat) {
  const [a, b, c] = S.horns, H = p => P(headRot(p)), horn = coat.horn || '#e8dcc0';
  g.shape(capsule(H(add(a, [-2, -1])), H(add(b, [-3, 1])), 2.2, 1.6), tone(horn, -0.14), { shade: false, outline: LINE.inner + 0.6 });
  g.shape(capsule(H(a), H(b), 2.4, 1.8), horn, { shade: false, outline: LINE.inner + 0.6 });
  g.shape(capsule(H(b), H(c), 1.8, 0.8), horn, { shade: false, outline: LINE.inner + 0.6 });
}

function drawBridle(g, S, H, leather, halterOnly) {
  const b = S.bridle;
  g.line(curve(b.cheek.map(H)), { colour: leather, width: 2.6 });
  g.line(curve(b.nose.map(H)), { colour: leather, width: 2.4 });
  g.line(curve(b.brow.map(H)), { colour: leather, width: 2.2 });
  if (!halterOnly) g.shape(ellipse(H(b.bit), 1.6, 1.6), '#c8b27a', { shade: false, outline: LINE.fine });
}

function drawSaddle(g, P, blanket, military) {
  // A plain saddle of the 1830s on a folded blanket: a low horn in front, a cantle behind, a skirt, the girth. A military
  // saddle has a dark holster before the knee in place of the saddlebags.
  g.shape(blob([P([-24, 98]), P([-26, 80]), P([-20, 75]), P([16, 75]), P([22, 80]), P([20, 98])], 0.5), blanket, { off: 1 });
  g.shape(blob([P([-19, 101]), P([-21, 88]), P([-12, 83]), P([10, 83]), P([16, 90]), P([13, 101]), P([0, 97])], 0.6), '#6a4428', { off: 0.9 });
  g.shape(blob([P([-22, 100]), P([-20, 108]), P([-14, 108]), P([-12, 100])], 0.7), '#5a3820', { shade: false, outline: LINE.inner });
  g.shape(blob([P([9, 99]), P([12, 107]), P([16, 106]), P([15, 99])], 0.7), '#5a3820', { shade: false, outline: LINE.inner });
  g.line(curve([P([6, 84]), P([7, 66]), P([8, 48])]), { colour: '#3e2816', width: 3 });
  if (military) g.shape(blob([P([18, 96]), P([24, 90]), P([28, 80]), P([22, 78]), P([16, 88])], 0.7), '#3a2a1c', { shade: false, outline: LINE.inner });
  else {
    // Saddlebags behind the cantle, as her mounted cast carry.
    g.shape(blob([P([-34, 97]), P([-36, 84]), P([-24, 82]), P([-22, 95])], 0.7), '#7a5230', { off: 0.7, outline: LINE.inner + 0.8 });
    g.line(`M ${f(P([-34, 91]))} L ${f(P([-23, 91]))}`, { width: LINE.fine, opacity: 0.6 });
  }
}
function drawStirrupLeather(g, P) {
  g.line(curve([P([0, 92]), P([1, 80]), P([2, 70])]), { colour: '#4a3020', width: 2.2 });
}

function drawYokeSide(g, S, P, neckRot, colour) {
  // A single ox's neck yoke seen from the side: the beam across the top of the neck in front of the withers, the bow under the
  // throat, and the ring the tongue's chain is made fast to (drawn by the vehicle).
  const c = typeof colour === 'string' ? colour : '#8a5e34';
  const N = p => P(neckRot(p));
  const top = N([40, 102]), front = N([48, 102]);
  g.line(curve([add(top, [-1, 0]), N([38, 76]), N([48, 66]), add(front, [3, 0])]), { width: 3.4, colour: '#c8a878' });
  g.shape(blob([add(top, [-7, -1]), add(top, [-6, 6]), add(front, [6, 6]), add(front, [7, -2])], 0.5), c, { off: 1 });
  g.shape(ellipse(N([44, 66]), 2.4, 2.4), '#5d5f5b', { shade: false, outline: LINE.fine });
}

function drawLeadRope(g, S, H, rope) {
  // A rope made fast round the horns (or a halter) and trailing loose to the ground.
  const from = H(S.horns ? S.horns[0] : S.bridle.bit), to = rope.to || [from[0] - 8, 1];
  const path = curve([from, add(lerp(from, to, 0.35), [3, -6]), add(lerp(from, to, 0.75), [-2, -2]), to]);
  g.line(path, { colour: '#c8a878', width: 2.8 });
  if (S.horns) g.line(ellipse(H(S.horns[0]), 3, 2), { width: 2.4, colour: '#c8a878' });
}

// ------------------------------------------------------------------------------------------- toward and away from the camera
/**
 * The animal coming toward the camera ('s') or going away ('n'), walking (frame 0..3) or standing (null). The body is seen
 * end-on from a little above: the chest, the neck and the head in front going south; the quarters and the tail going north,
 * the head beyond. The elevated view puts the far end higher on the screen. A lifted leg folds; the body rolls toward the
 * planted side and rises between steps. `layer` 'back' draws only what is behind a rider, 'front' only what is in front of
 * them, 'all' both.
 */
export function drawQuadFrontal(ink, speciesName, view, { frame = null, coat = COATS.bay, tack = false, saddle = false, blanket = '#b8342a', layer = 'all', yoke = false, rope = false, halter = false, pack = null, gait = 'walk' } = {}) {
  const S = SPECIES[speciesName], z = S.size, g = new ScaledInk(ink, z);
  const toward = view === 's';
  const cow = !!S.cloven;
  // Which legs are lifted this frame (walk: near hind, near fore, far hind, far fore; trot: the diagonals), and the roll.
  const order = gait === 'trot' ? [['nf', 'fh'], [], ['ff', 'nh'], []] : gait === 'gallop' ? [['nf', 'ff'], ['nh', 'fh', 'nf'], ['nh', 'fh'], []] : [['nh'], ['nf'], ['fh'], ['ff']];
  const up = frame == null ? [] : order[frame % 4];
  const roll = frame == null ? 0 : [1, 0.5, -1, -0.5][frame % 4] * 1.4;
  const bob = frame == null ? 0 : (gait === 'walk' ? [0, 0.8, 0, 0.8] : [0, 2.2, 0.4, 2.6])[frame % 4];
  // The horse's left (near) side is screen right coming toward us and screen left going away.
  const side = key => (key[0] === 'n' ? 1 : -1) * (toward ? 1 : -1);
  const hw = S.half;
  const rise = 13; // how much higher the far end of the body is drawn: the camera is a little above
  const nearEnd = toward ? 'f' : 'h';
  const legs = {};
  for (const key of ['nf', 'ff', 'nh', 'fh']) {
    const lifted = up.includes(key), near = key[1] === nearEnd;
    const x = side(key) * hw * (key[1] === 'f' ? 0.5 : 0.56) + roll * 0.4, y0 = near ? 0 : rise;
    const top = [x * 1.05, y0 + (key[1] === 'f' ? 52 : 56) + bob];
    const knee = [x, y0 + (key[1] === 'f' ? 27 : 31) + (lifted ? 5 : 0)];
    // A lifted leg folds: coming toward us the hoof rises and the cannon shortens; going away the sole shows.
    const hoof = [x, y0 + (lifted ? (toward ? 10 : 12) : 0)];
    legs[key] = { key, x, top, knee, hoof, lifted, near };
  }
  const legShape = (leg, dim) => {
    const col = c => dim ? tone(c, -0.2) : c, w = leg.near ? 1 : 0.9;
    const fetlock = add(leg.hoof, [0, 8]);
    const pts = [add(leg.top, [0, 6]), leg.top, lerp(leg.top, leg.knee, 0.5), leg.knee, lerp(leg.knee, fetlock, 0.5), fetlock, add(leg.hoof, [0, 4.5])];
    const ws = [9.5, 9.2, 7.4, 5.2, 4.1, 5, 4.4].map(v => v * w * (cow ? 1.1 : 1));
    const whole = limb(pts, ws);
    g.shape(whole, col(coat.coat), { off: 0.8, outline: 0 });
    if (coat.points && coat.points !== coat.coat) g.shape(limb(pts.slice(3), ws.slice(3)), col(coat.points), { off: 0.4, outline: 0 });
    g.line(whole, { width: LINE.outer });
    const hp = [add(leg.hoof, [-4.2 * w, 0]), add(leg.hoof, [4.2 * w, 0]), add(leg.hoof, [3.6 * w, leg.lifted && !toward ? 2.5 : 5]), add(leg.hoof, [-3.6 * w, leg.lifted && !toward ? 2.5 : 5])];
    g.shape(poly(hp), col(coat.hoof), { shade: false, outline: LINE.inner + 1 });
    if (cow) g.line(`M ${f(leg.hoof)} L ${f(add(leg.hoof, [0, 4.5]))}`, { width: LINE.fine });
  };
  const farLegs = Object.values(legs).filter(l => !l.near), nearLegs = Object.values(legs).filter(l => l.near);
  const lo = 48 + bob, hi = 98 + bob;
  const barrel = () => {
    // The barrel from end to end: a long rounded shape rising into the distance, its back seen from above.
    g.shape(blob([[-hw + roll, lo + 6], [-hw - 2 + roll, (lo + hi) / 2], [-hw + 1 + roll, hi - 4 + rise * 0.5], [-hw * 0.6 + roll, hi + rise], [hw * 0.6 + roll, hi + rise],
      [hw - 1 + roll, hi - 4 + rise * 0.5], [hw + 2 + roll, (lo + hi) / 2], [hw + roll, lo + 6], [roll, lo]], 0.85), coat.coat, { off: 2, lift: true });
    if (coat.patches) g.dot(blob([[-hw + 4 + roll, hi], [-4 + roll, hi + 8], [-2 + roll, (lo + hi) / 2], [-hw + 2 + roll, lo + 14]], 0.8), coat.patches);
  };
  const seat = [roll, hi + rise * 0.45];
  const tackBits = () => {
    if (saddle) {
      const s = seat;
      g.shape(blob([add(s, [-hw - 3, -2]), add(s, [-hw - 2, -24]), add(s, [hw + 2, -24]), add(s, [hw + 3, -2])], 0.5), blanket, { off: 1 });
      g.shape(blob([add(s, [-hw + 2, 3]), add(s, [-hw + 1, -15]), add(s, [hw - 1, -15]), add(s, [hw - 2, 3])], 0.5), '#6a4428', { off: 1 });
      for (const sd of [-1, 1]) g.line(`M ${f(add(s, [sd * (hw - 1), -6]))} L ${f(add(s, [sd * (hw + 4), -34]))}`, { colour: '#3e2816', width: 2.4 });
    }
    if (pack) pack(g, seat, { view, frame, hw });
  };
  const head = () => {
    const nod = frame == null ? 0 : [0, -1.6, 0, -1.6][frame % 4];
    if (cow) {
      g.shape(blob([[-14 + roll, 62 + bob], [-13 + roll, 90 + bob], [13 + roll, 90 + bob], [14 + roll, 62 + bob], [roll, 56 + bob]], 0.85), coat.coat, { off: 1.4 });
      if (S.dewlap) g.shape(blob([[-5 + roll, 64 + bob], [5 + roll, 64 + bob], [3 + roll, 50 + bob], [-3 + roll, 50 + bob]], 0.8), tone(coat.coat, -0.05), { off: 0.6 });
      const hc = [roll * 0.5, 92 + nod + bob];
      if (S.horns) for (const s of [-1, 1]) g.shape(capsule(add(hc, [s * 7, 10]), add(hc, [s * (S.hump ? 22 : 16), 18]), 2.6, 1), coat.horn || '#e8dcc0', { shade: false, outline: LINE.inner + 0.6 });
      for (const s of [-1, 1]) g.shape(ellipse(add(hc, [s * 13.5, 6]), 6, 3, s * -15), coat.coat, { shade: false, outline: LINE.inner + 0.6 });
      const face = coat.patches ? '#f4ead6' : coat.coat;
      g.shape(blob([add(hc, [-10, 12]), add(hc, [10, 12]), add(hc, [9, -4]), add(hc, [6, -13]), add(hc, [-6, -13]), add(hc, [-9, -4])], 0.85), face, { off: 1.2, lift: true });
      if (coat.patches) g.dot(blob([add(hc, [-10, 12]), add(hc, [-1, 13]), add(hc, [-3, 2]), add(hc, [-9, -2])], 0.8), coat.patches);
      g.shape(ellipse(add(hc, [0, -11]), 7, 4.4), coat.muzzle, { off: 0.5, outline: LINE.inner + 0.6 });
      for (const s of [-1, 1]) { g.dot(ellipse(add(hc, [s * 2.5, -11]), 1.1, 0.9), LINE.ink); g.dot(ellipse(add(hc, [s * 6.5, 4]), 1.5, 1.8), LINE.ink); }
      if (rope) g.line(curve([add(hc, [-7, 10]), add(hc, [-11, 0]), add(hc, [-14, -30]), [-16 + roll, 3]]), { colour: '#c8a878', width: 2.6 });
      if (yoke) {
        g.line(curve([add(hc, [-11, 16]), add(hc, [-13, 0]), add(hc, [0, -6]), add(hc, [13, 0]), add(hc, [11, 16])]), { width: 3, colour: '#c8a878' });
        g.shape(blob([add(hc, [-26, 16]), add(hc, [26, 16]), add(hc, [26, 21]), add(hc, [-26, 21])], 0.4), '#8a5e34', { off: 0.8 });
      }
      return hc;
    }
    // A horse or mule coming toward us: the neck rising from the chest, the long face down its middle, ears up.
    const c0 = [roll * 0.5, 84 + nod + bob];
    // The broad chest between the forelegs, then the neck rising from it.
    g.shape(blob([[-24 + roll, 50 + bob], [-27 + roll, 68 + bob], [-20 + roll, 86 + bob], [20 + roll, 86 + bob], [27 + roll, 68 + bob], [24 + roll, 50 + bob], [roll, 45 + bob]], 0.85), coat.coat, { off: 1.6, lift: true });
    g.line(curve([[roll, 50 + bob], [roll, 62 + bob], [roll - 2, 72 + bob]]), { width: LINE.fine, opacity: 0.45 });
    g.shape(blob([[-18 + roll, 70 + bob], [-17 + roll, 88 + bob], [-11, 100 + bob], [11, 100 + bob], [17 + roll, 88 + bob], [18 + roll, 70 + bob], [roll, 64 + bob]], 0.85), coat.coat, { off: 1.4 });
    // The face at 1.2 of the drawn numbers below, about its middle.
    const c = c0, F = v => add(c, mul(v, 1.38));
    if (S.mane === true) g.shape(blob([[-4, 102 + bob], [4, 102 + bob], [3, 92 + bob], [-3, 92 + bob]], 0.8), coat.mane, { shade: false, outline: LINE.inner });
    const ear = S.tail === 'tuft' ? 19 : 10;
    for (const s of [-1, 1]) g.shape(blob([F([s * 4.5, 14]), F([s * 8, 14 + ear]), F([s * 10, 13])], 0.7), coat.coat, { shade: false, outline: LINE.inner + 0.6 });
    const face = [F([-9, 13]), F([9, 13]), F([9.5, 2]), F([6.5, -20]), F([5.5, -29]), F([-5.5, -29]), F([-6.5, -20]), F([-9.5, 2])];
    g.shape(blob(face, 0.8), coat.coat, { off: 1.2, lift: true });
    g.shape(blob([F([-6, -19]), F([6, -19]), F([5.5, -29]), F([-5.5, -29])], 0.8), coat.muzzle, { shade: false, outline: LINE.inner });
    if (S.mane === true) g.shape(blob([F([-4.5, 14]), F([4.5, 14]), F([2.5, 5]), F([-2.5, 5])], 0.8), coat.mane, { shade: false, outline: LINE.inner });
    if (coat.blaze) g.dot(ellipse(F([0, 3]), 1.8, 2.5), coat.blaze);
    for (const s of [-1, 1]) { g.dot(ellipse(F([s * 7.6, 1]), 1.4, 2), LINE.ink); g.dot(ellipse(F([s * 2.6, -27]), 1.1, 1.3), LINE.ink); }
    if (tack || halter) {
      const lc = tack ? '#5a3a22' : '#8a6a3a';
      g.line(`M ${f(F([-8, -15]))} L ${f(F([8, -15]))}`, { colour: lc, width: 2.4 });
      for (const s of [-1, 1]) g.line(curve([F([s * 9, 10]), F([s * 9, -6]), F([s * 6.5, -21])]), { colour: lc, width: 2.2 });
      g.line(`M ${f(F([-9, 9]))} L ${f(F([9, 9]))}`, { colour: lc, width: 2.2 });
    }
    return c;
  };
  const rump = () => {
    // Going away: the quarters, round either side of the tail, nearest the camera.
    const c = [roll, 80 + bob];
    g.shape(blob([add(c, [-hw - 1, -24]), add(c, [-hw - 3, 2]), add(c, [-hw + 2, 16]), add(c, [-5, 22]), add(c, [5, 22]), add(c, [hw - 2, 16]), add(c, [hw + 3, 2]), add(c, [hw + 1, -24]), add(c, [0, -28])], 0.85), coat.coat, { off: 2, lift: true });
    g.line(curve([add(c, [0, 21]), add(c, [0, 8]), add(c, [0, -18])]), { width: LINE.fine, opacity: 0.5 });
    if (coat.patches) g.dot(blob([add(c, [-hw + 3, 10]), add(c, [-5, 15]), add(c, [-7, -8]), add(c, [-hw + 2, -10])], 0.8), coat.patches);
    const sw = frame == null ? 0 : [2.5, 0, -2.5, 0][frame % 4];
    if (S.tail === 'long') g.shape(blob([add(c, [-5, 20]), add(c, [5, 20]), add(c, [7 + sw, -10]), add(c, [5 + sw * 1.5, -42]), add(c, [-5 + sw * 1.5, -44]), add(c, [-7 + sw, -10])], 0.8), coat.mane, { off: 1 });
    else {
      g.shape(capsule(add(c, [0, 20]), add(c, [sw, -34]), 1.8, 1.2), coat.coat, { shade: false, outline: LINE.inner + 0.6 });
      g.shape(blob([add(c, [sw - 3, -30]), add(c, [sw + 3, -30]), add(c, [sw + 2.5, -42]), add(c, [sw - 2.5, -42])], 0.8), coat.mane, { shade: false, outline: LINE.inner });
    }
    if (S.udder) g.shape(ellipse(add(c, [0, -30]), 7, 5), '#e9b3a0', { off: 0.6 });
    return c;
  };
  const farHead = () => {
    // Going away the head is beyond the body: the ears and the top of the neck show over the withers.
    const c = [roll * 0.6 + (cow ? 0 : 12), (cow ? 108 : 124) + rise + bob];
    if (cow) {
      if (S.horns) for (const s of [-1, 1]) g.shape(capsule(add(c, [s * 5, -6]), add(c, [s * (S.hump ? 20 : 14), 2]), 2.4, 1), coat.horn || '#e8dcc0', { shade: false, outline: LINE.inner + 0.6 });
      for (const s of [-1, 1]) g.shape(ellipse(add(c, [s * 12, -9]), 5, 2.6, s * -15), tone(coat.coat, -0.1), { shade: false, outline: LINE.inner + 0.6 });
      g.shape(ellipse(add(c, [0, -10]), 10, 6.5), tone(coat.coat, -0.08), { off: 0.8 });
      if (yoke) g.shape(blob([add(c, [-26, -16]), add(c, [26, -16]), add(c, [26, -11]), add(c, [-26, -11])], 0.4), '#8a5e34', { off: 0.8 });
      return;
    }
    const ear = S.tail === 'tuft' ? 18 : 10;
    for (const s of [-1, 1]) g.shape(blob([add(c, [s * 3.5, 0]), add(c, [s * 7, ear]), add(c, [s * 9, -1])], 0.7), tone(coat.coat, -0.1), { shade: false, outline: LINE.inner + 0.6 });
    g.shape(blob([add(c, [-8, -28]), add(c, [-7, 1]), add(c, [7, 1]), add(c, [8, -28])], 0.8), tone(coat.coat, -0.06), { off: 0.8 });
    if (S.mane === true) g.shape(blob([add(c, [-3.5, 2]), add(c, [3.5, 2]), add(c, [4.5, -28]), add(c, [-4.5, -28])], 0.8), coat.mane, { shade: false, outline: LINE.inner });
  };
  const out = { seat: mul(seat, z), scale: z, legs, bob, roll, half: hw * z };
  if (layer === 'back' || layer === 'all') {
    if (toward) {
      // The far (hind) legs, the tail beyond, the barrel, the saddle.
      for (const l of farLegs) legShape(l, true);
      if (S.tail === 'long') g.shape(blob([[-7 + roll, 96 + rise], [7 + roll, 96 + rise], [9 + roll, 66 + rise], [-9 + roll, 66 + rise]], 0.8), coat.mane, { off: 0.6 });
      barrel();
      tackBits();
    } else {
      farHead();
      for (const l of farLegs) legShape(l, true);
      barrel();
      tackBits();
    }
  }
  if (layer === 'front' || layer === 'all') {
    for (const l of nearLegs) legShape(l, false);
    if (toward) out.face = head();
    else rump();
  }
  return out;
}

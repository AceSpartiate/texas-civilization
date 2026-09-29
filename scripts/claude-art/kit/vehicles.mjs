// Vehicles for area D (2026-09-28): the family's two-wheeled cart, the carreta on its solid wheels, and the covered farm wagon,
// in the game's slightly elevated view, facing east (the game mirrors for west), coming toward the camera ('s') or going away
// ('n'), with their wheels turning frame by frame.
//
// Built in three dimensions and projected: a vehicle is laid out along u (forward), v (to its left) and w (up), in rig units,
// and the view turns it: east draws u across the screen and lifts the far side (v) a little; south and north run u into the
// screen, the far end higher. VIEW's foreshortening (0.42 here, a little under the style's 0.55 for a flat top, because Astra's
// vehicle sheets show their sides tall and their beds shallow) is read off her `cart-open` and `carreta-travel` views.
//
// History (HISTORY.md): a family's wagon of the 1830s was a farm or "baggage" wagon drawn by oxen (Parker, 1836, p. 203,
// `HIST-TEX-441`), not a freight Conestoga; the plank-wheeled cart of Mexican Texas had "great, clumsy, solid wooden wheels",
// an unhewn axle and rawhide lashings (Smithwick; Woodman's guide, 1835; `HIST-TEX-443`), and settlers "sawed wheels from logs"
// (Harris). No iron tyre is drawn on a carreta; the farm wagon and the cart have iron-tyred spoked wheels. Where the record does
// not give a size, the size is the game's (the scale of `wagon-covered`, `cart-open`, `carreta-*`), not a claim.
import { LINE, tone } from './style.mjs';
import { add, sub, mul, lerp, ellipse, blob, curve, poly, capsule, norm, f2 } from './svg.mjs';

export const D = 0.42, DE = 0.22; // end-on and side-on foreshortening
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const add3 = (a, b) => a.map((v, i) => v + (b[i] || 0));
const WOOD = '#8a5e36', WOOD_DARK = '#6a4426', WOOD_LIGHT = '#a8784a', IRON = '#4a4640', RAWHIDE = '#d8c08a', CANVAS = '#efe4c8';
const SACK = '#d8c49a', BARREL = '#8a5a30', BLANKET = '#9a3a2a';

/** The screen point of (u, v, w) for heading 'e', 's' or 'n'. */
// End-on, the nearest end of the vehicle (`near`: the tongue's tip going south, the tail going north) stands on the ground line,
// so nothing is drawn below the anchor and the rest rises into the distance.
export const projector = (h, { depth = D, near = 0 } = {}) => h === 'e' ? ([u, v, w]) => [u, w + v * DE] : h === 's' ? ([u, v, w]) => [v, w - (u - near) * depth] : ([u, v, w]) => [-v, w + (u - near) * depth];
/** How far from the camera a point is for heading h (bigger is further): draw far first. */
export const farness = h => h === 'e' ? ([u, v]) => v : h === 's' ? ([u]) => -u : ([u]) => u;

const quad = (ink, P, pts, fill, o = {}) => ink.shape(poly(pts.map(P)), fill, { off: 1.2, ...o });
const seg = (ink, P, a, b, o = {}) => ink.line(`M ${f2(P(a)[0])} ${f2(P(a)[1])} L ${f2(P(b)[0])} ${f2(P(b)[1])}`, { width: LINE.fine, opacity: 0.6, ...o });

/**
 * A wheel at (u, v, w=r) of radius r: side-on a disc with its spokes (or, `solid`, its planks and pegs) turned by `angle`
 * degrees; end-on a tall narrow ellipse with its tread marks moved by `angle`.
 */
export function wheel(ink, h, P, [u, v], r, { angle = 0, spokes = 12, solid = false, tyre = true, far = false, thick = 5 } = {}) {
  const shade = c => far ? tone(c, -0.2) : c;
  const c = P([u, v, r]);
  if (h === 'e') {
    ink.shape(ellipse(c, r, r), shade(solid ? WOOD_LIGHT : WOOD), { off: 1.6, lift: !far });
    if (tyre) ink.line(ellipse(c, r - 1.8, r - 1.8), { width: 3.2, colour: shade(IRON), opacity: 0.9 });
    const rad = a => [Math.cos((a) * Math.PI / 180), Math.sin((a) * Math.PI / 180)];
    if (solid) {
      // Two or three thick planks pegged together: the seams run across the wheel and turn with it; a peg either side.
      for (const s of [-0.34, 0.34]) {
        const d = rad(angle), n = [-d[1], d[0]], m = add(c, mul(n, s * r)), half = Math.sqrt(1 - s * s) * r;
        ink.line(`M ${f2(m[0] - d[0] * half)} ${f2(m[1] - d[1] * half)} L ${f2(m[0] + d[0] * half)} ${f2(m[1] + d[1] * half)}`, { width: LINE.inner, colour: shade(WOOD_DARK) });
      }
      for (const s of [-1, 1]) { const p = add(c, mul(rad(angle + 90), s * r * 0.66)); ink.shape(ellipse(p, 1.6, 1.6), shade(WOOD_DARK), { shade: false, outline: LINE.fine }); }
      ink.shape(ellipse(c, r * 0.24, r * 0.24), shade(WOOD), { shade: false, outline: LINE.inner });
    } else {
      ink.line(ellipse(c, r * 0.8, r * 0.8), { width: LINE.inner, colour: shade(WOOD_DARK) });
      for (let k = 0; k < spokes / 2; k++) {
        const d = rad(angle + k * 360 / spokes), a = add(c, mul(d, -r * 0.8)), b = add(c, mul(d, r * 0.8));
        ink.line(`M ${f2(a[0])} ${f2(a[1])} L ${f2(b[0])} ${f2(b[1])}`, { width: 2.8, colour: shade(WOOD_DARK) });
      }
    }
    ink.shape(ellipse(c, r * 0.17, r * 0.17), shade(IRON), { shade: false, outline: LINE.inner });
    return;
  }
  // End-on: the rim seen edge-on, tall and narrow; a few dark marks on the tread roll down (south) or up (north) as it turns.
  // A wheel seen nearly edge-on still shows a sliver of its face, as her end-on carts draw it: a fifth of its height wide.
  const ry = r * Math.sqrt(1 + D * D), rx = Math.max(thick * 0.5 + 1.8, r * 0.2);
  ink.shape(ellipse(c, rx, ry), shade(solid ? WOOD_LIGHT : WOOD), { off: 0.8 });
  for (let k = 0; k < 3; k++) {
    const t = ((angle / 90 + k / 3) % 1) * 2 - 1, y = c[1] + (h === 's' ? -t : t) * ry * 0.8;
    ink.line(`M ${f2(c[0] - rx * 0.7)} ${f2(y)} L ${f2(c[0] + rx * 0.7)} ${f2(y)}`, { width: LINE.fine, colour: shade(tyre ? IRON : WOOD_DARK), opacity: 0.8 });
  }
  ink.shape(ellipse(c, rx * 1.15, rx * 1.15), shade(IRON), { shade: false, outline: LINE.fine });
}

/** Sacks, a barrel, a bundled blanket: what a family carries, heaped in a bed from (u0..u1) at floor height w0. */
function load(ink, P, h, { u0, u1, v0, w0, big = 1 }) {
  const items = [
    { kind: 'sack', at: [lerp([u0, 0], [u1, 0], 0.25)[0], -v0 * 0.3], s: 1 },
    { kind: 'barrel', at: [lerp([u0, 0], [u1, 0], 0.62)[0], v0 * 0.35], s: 1 },
    { kind: 'sack', at: [lerp([u0, 0], [u1, 0], 0.5)[0], v0 * 0.2], s: 0.9 },
    { kind: 'blanket', at: [lerp([u0, 0], [u1, 0], 0.82)[0], -v0 * 0.2], s: 1 },
  ];
  const far = farness(h);
  items.sort((a, b) => far([b.at[0], b.at[1]]) - far([a.at[0], a.at[1]]));
  for (const it of items) {
    const [u, v] = it.at, s = it.s * big, base = P([u, v, w0 + 10]);
    if (it.kind === 'sack') {
      ink.shape(blob([add(base, [-11 * s, 0]), add(base, [-12 * s, 14 * s]), add(base, [-4 * s, 24 * s]), add(base, [0, 30 * s]), add(base, [5 * s, 23 * s]), add(base, [12 * s, 13 * s]), add(base, [10 * s, 0])], 0.9), SACK, { off: 1.4, lift: true });
      ink.line(curve([add(base, [-4 * s, 24 * s]), add(base, [0, 22 * s]), add(base, [5 * s, 23 * s])]), { width: LINE.inner, colour: tone(SACK, -0.45) });
    } else if (it.kind === 'barrel') {
      ink.shape(blob([add(base, [-9 * s, 0]), add(base, [-10.5 * s, 13 * s]), add(base, [-9 * s, 26 * s]), add(base, [9 * s, 26 * s]), add(base, [10.5 * s, 13 * s]), add(base, [9 * s, 0])], 0.6), BARREL, { off: 1.4, lift: true });
      for (const y of [5, 21]) ink.line(curve([add(base, [-10 * s, y * s]), add(base, [0, y * s - 1.5]), add(base, [10 * s, y * s])]), { width: 2.4, colour: IRON });
      ink.shape(ellipse(add(base, [0, 26 * s]), 9 * s, 3 * s), tone(BARREL, 0.15), { shade: false, outline: LINE.inner });
    } else {
      ink.shape(blob([add(base, [-13 * s, 0]), add(base, [-14 * s, 12 * s]), add(base, [13 * s, 14 * s]), add(base, [14 * s, 1])], 0.7), BLANKET, { off: 1.2, lift: true });
      for (const x of [-6, 2, 9]) ink.line(`M ${f2(base[0] + x * s)} ${f2(base[1] + 1)} L ${f2(base[0] + x * s + 1)} ${f2(base[1] + 13 * s)}`, { width: 1.8, colour: '#2a3a5a', opacity: 0.8 });
    }
  }
}

/** A box body from u0..u1, v -hv..hv, floor w0 to top w1; `posts` corner posts to wp; `lash` rawhide X's at the joints. */
function body(ink, h, P, { u0, u1, hv, w0, w1, wp = w1, rails = [], posts = true, lash = false, colour = WOOD, inside = true, cargo = null }) {
  const c = colour, dark = tone(c, -0.25), light = tone(c, 0.12);
  const side = v => [[u0, v, w0], [u1, v, w0], [u1, v, w1], [u0, v, w1]];
  const end = u => [[u, -hv, w0], [u, hv, w0], [u, hv, w1], [u, -hv, w1]];
  const floor = [[u0, -hv, w0], [u1, -hv, w0], [u1, hv, w0], [u0, hv, w0]];
  const planks = (pts, n, o = {}) => { for (let k = 1; k < n; k++) seg(ink, P, lerp3(pts[0], pts[3], k / n), lerp3(pts[1], pts[2], k / n), o); };
  const post = (u, v) => {
    const a = P([u, v, w0 - 4]), b = P([u, v, wp]);
    ink.shape(capsule(a, b, 2.6, 2.4), dark, { shade: false, outline: LINE.inner + 0.4 });
    if (lash) for (const w of [w1 - 4, (w0 + w1) / 2]) { const m = P([u, v, w]); ink.line(`M ${f2(m[0] - 3)} ${f2(m[1] - 3)} L ${f2(m[0] + 3)} ${f2(m[1] + 3)} M ${f2(m[0] - 3)} ${f2(m[1] + 3)} L ${f2(m[0] + 3)} ${f2(m[1] - 3)}`, { width: 2, colour: RAWHIDE }); }
  };
  const corner = (u, v) => posts && post(u, v);
  const drawSide = (v, facing) => { quad(ink, P, side(v), facing ? c : dark); planks(side(v), 3); for (const r of rails) seg(ink, P, [u0, v, r], [u1, v, r], { width: 2.4, colour: tone(c, -0.35), opacity: 0.9 }); };
  const drawEnd = (u, facing) => { quad(ink, P, end(u), facing ? c : dark); planks(end(u), 3); };
  if (h === 'e') {
    // The far side's inner face shows above the near side; the floor; the load; the ends; the near side over it.
    corner(u0, hv); corner(u1, hv);
    quad(ink, P, side(hv), dark, { off: 0.6 });
    if (inside) quad(ink, P, floor, tone(c, -0.12), { off: 0.6 });
    if (cargo) cargo();
    drawEnd(u0, false); drawEnd(u1, false);
    drawSide(-hv, true);
    corner(u0, -hv); corner(u1, -hv);
    if (posts) for (const u of [lerp([u0, 0], [u1, 0], 0.5)[0]]) post(u, -hv);
    return;
  }
  const nearU = h === 's' ? u1 : u0, farU = h === 's' ? u0 : u1;
  corner(farU, -hv); corner(farU, hv);
  drawEnd(farU, false);
  if (inside) quad(ink, P, floor, tone(c, -0.12), { off: 0.6 });
  drawSide(-hv, false); drawSide(hv, false);
  if (cargo) cargo();
  drawEnd(nearU, true);
  corner(nearU, -hv); corner(nearU, hv);
}

/** A tongue (a single pole) from the front of the bed forward, curving down to a ring. */
function tongue(ink, P, from, to, { ring = true, bend = 6 } = {}) {
  const mid = add3(lerp3(from, to, 0.55), [0, 0, bend]);
  const a = P(from), m = P(mid), b = P(to);
  ink.shape(capsule(m, b, 2.4, 1.9), WOOD_DARK, { shade: false, outline: LINE.inner + 0.6 });
  ink.shape(capsule(a, m, 2.6, 2.4), WOOD_DARK, { shade: false, outline: LINE.inner + 0.6 });
  if (ring) ink.line(ellipse(b, 3, 3), { width: 2.2, colour: IRON });
}

/**
 * The family's cart (request 2026-09-25 — riders, walkers and the cart): two iron-tyred spoked wheels, a plank box with stakes,
 * a tongue, no ox. Its full height, stake top to the ground, is 100 units.
 */
export function drawCart(ink, h, { frame = 0, loaded = false, rolling = true } = {}) {
  const P = projector(h, { near: h === 's' ? 36 + 62 : -46 }), R = 28, U0 = -46, U1 = 36, HV = 46, W0 = 34, W1 = 78;
  const angle = rolling ? -frame * 7.5 : 0; // twelve spokes: a quarter of their spacing a frame, turning forward
  const wheelAt = v => wheel(ink, h, P, [-4, v], R, { angle: h === 'e' ? angle : frame * 22.5, far: h === 'e' ? v > 0 : false });
  const draw = () => {
    const cargo = loaded ? () => load(ink, P, h, { u0: U0 + 6, u1: U1 - 6, v0: HV - 6, w0: W0, big: 1.6 }) : null;
    body(ink, h, P, { u0: U0, u1: U1, hv: HV, w0: W0, w1: W1, wp: 92, rails: [56], cargo });
  };
  if (h === 'e') { wheelAt(HV + 4); tongue(ink, P, [U1, 0, W0 + 2], [U1 + 70, 0, 24]); draw(); wheelAt(-HV - 4); return; }
  if (h === 'n') { tongue(ink, P, [U1, 0, W0 + 2], [U1 + 70, 0, 24]); for (const v of [-HV - 4, HV + 4]) wheelAt(v); draw(); return; }
  for (const v of [-HV - 4, HV + 4]) wheelAt(v);
  draw(); tongue(ink, P, [U1, 0, W0 + 2], [U1 + 62, 0, 22]);
}

/**
 * The carreta (request 2026-09-25 — the carreta): two great solid wheels of pegged planks on a wooden axle, no iron; an open
 * frame of poles lashed with rawhide; a pole tongue; no ox. Its full height, post top to the ground, is 100 units.
 */
export function drawCarreta(ink, h, { frame = 0, loaded = false } = {}) {
  const P = projector(h, { near: h === 's' ? 38 + 66 : -44 }), R = 31, U0 = -44, U1 = 38, HV = 42, W0 = 42, W1 = 82;
  const wheelAt = v => wheel(ink, h, P, [0, v], R, { angle: h === 'e' ? -frame * 45 : frame * 22.5, solid: true, tyre: false, far: h === 'e' ? v > 0 : false, thick: 8 });
  const draw = () => {
    const cargo = loaded ? () => load(ink, P, h, { u0: U0 + 6, u1: U1 - 6, v0: HV - 6, w0: W0, big: 1.5 }) : null;
    body(ink, h, P, { u0: U0, u1: U1, hv: HV, w0: W0, w1: W1, wp: 100, rails: [62], lash: true, colour: '#8e6a42', cargo });
  };
  if (h === 'e') { wheelAt(HV + 6); tongue(ink, P, [U1, 0, W0], [U1 + 76, 0, 26], { bend: 10 }); draw(); wheelAt(-HV - 6); return; }
  if (h === 'n') { tongue(ink, P, [U1, 0, W0], [U1 + 76, 0, 26], { bend: 10 }); for (const v of [-HV - 6, HV + 6]) wheelAt(v); draw(); return; }
  for (const v of [-HV - 6, HV + 6]) wheelAt(v);
  draw(); tongue(ink, P, [U1, 0, W0], [U1 + 66, 0, 24], { bend: 10 });
}

/**
 * The family's covered farm wagon with its tongue: four iron-tyred wheels (the hind pair bigger), a plank bed, and - `cover`
 * 'on' - a cream canvas on five bows, puckered at the ends; 'loaded' the bows bare over a load; 'empty' the bows bare over an
 * empty bed. Returns where the tongue ends, for the team. Its full height, cover top to the ground, is 164 units (1.55 of a
 * person, as the game draws `wagon-covered`).
 */
export function drawWagon(ink, h, { frame = 0, cover = 'on', tongueTo = [190, 0, 36], near = h === 's' ? tongueTo[0] : -134 } = {}) {
  const P = projector(h, { depth: 0.22, near }), U0 = -130, U1 = 110, HV = 34, W0 = 48, W1 = 76;
  const wheels = [[-88, 32], [74, 26]];
  const wheelAt = ([u, r], v) => wheel(ink, h, P, [u, v], r, { angle: h === 'e' ? -frame * 7.5 * (30 / r) : frame * 22.5, far: h === 'e' ? v > 0 : false });
  const bows = [-124, -66, -8, 50, 104];
  const arch = (u, s = 1) => [-1, -0.92, -0.7, -0.38, 0, 0.38, 0.7, 0.92, 1].map(t => [u, t * (HV + 9) * s, W1 + 66 * Math.sqrt(1 - t * t)]);
  const coverDraw = () => {
    if (cover !== 'on') {
      // The bows bare: iron-strapped hickory hoops over the bed.
      for (const u of (h === 's' ? [...bows].reverse() : bows)) ink.line(curve(arch(u).map(P)), { width: 3.4, colour: WOOD_LIGHT });
      return;
    }
    if (h === 'e') {
      const top = bows.flatMap((u, i) => i ? [P([(u + bows[i - 1]) / 2, 0, 152]), P([u, 0, 147])] : [P([u, 0, 147])]), low = P([U0 - 4, -HV - 3, W1]), lowF = P([U1 + 6, -HV - 3, W1]);
      const farTop = P([U1 + 2, HV, 144]), farRear = P([U0 - 2, HV, 144]);
      const pts = [low, add(P([U0 - 8, -HV, 110]), [0, 0]), add(P([U0 - 6, 0, 146]), [0, 0]), ...top, P([U1 + 10, 0, 144]), P([U1 + 12, -HV, 108]), lowF];
      ink.shape(blob(pts, 0.6), CANVAS, { off: 3, lift: true });
      for (const u of bows.slice(1, -1)) ink.line(curve([P([u, -HV - 3, W1 + 2]), P([u, -HV * 0.6, 132]), P([u, -HV * 0.1, 149])]), { width: LINE.fine, colour: tone(CANVAS, -0.35), opacity: 0.8 });
      // The puckered openings: a dark oval at each end, drawn up on its drawstring.
      ink.shape(ellipse(P([U1 + 9, 0, 124]), 4, 12), '#5a4430', { shade: false, outline: LINE.inner });
      for (const u of [U0 - 6, U1 + 8]) ink.line(curve([P([u, -HV, 96]), P([u + (u < 0 ? -4 : 4), 0, 132]), P([u, HV, 100])]), { width: LINE.fine, opacity: 0.7 });
      return;
    }
    // End-on: the far end's arch, then the near end's arch with the opening puckered round a dark hole.
    const nearU = h === 's' ? U1 + 4 : U0 - 4, farU = h === 's' ? U0 - 4 : U1 + 4;
    // The cover's top running back to the far end's bow, seen over the near one.
    const farArch = arch(farU, 1).map(P), nearArch = arch(nearU, 1.04).map(P);
    ink.shape(blob([nearArch[0], ...farArch.slice(1, -1), nearArch.at(-1), ...nearArch.slice(1, -1).reverse()], 0.7), tone(CANVAS, -0.08), { off: 2 });
    for (const t of [-0.5, 0, 0.5]) ink.line(curve([P([farU, t * (HV + 9), W1 + 66 * Math.sqrt(1 - t * t)]), P([nearU, t * (HV + 9) * 1.04, W1 + 66 * Math.sqrt(1 - t * t)])]), { width: LINE.fine, opacity: 0.45 });
    ink.shape(blob(arch(nearU, 1.04).map(P), 0.8), CANVAS, { off: 2, lift: true });
    const hole = P([nearU, 0, 110]);
    ink.shape(ellipse(hole, 14, 18), '#4a3828', { shade: false, outline: LINE.inner });
    for (const t of [-0.5, 0, 0.5]) ink.line(curve([P([nearU, t * 30, 147]), add(hole, [t * 16, 16])]), { width: LINE.fine, opacity: 0.5 });
  };
  const bed = () => {
    const cargo = cover === 'loaded' ? () => load(ink, P, h, { u0: U0 + 10, u1: U1 - 10, v0: HV - 8, w0: W0, big: 1.6 }) : null;
    body(ink, h, P, { u0: U0, u1: U1, hv: HV, w0: W0, w1: W1, posts: false, cargo });
    // The running gear under the bed: the reach from axle to axle.
    if (h === 'e') seg(ink, P, [wheels[0][0], -HV, 30], [wheels[1][0], -HV, 28], { width: 4, colour: WOOD_DARK, opacity: 1 });
  };
  const from = [wheels[1][0], 0, 26];
  if (h === 'e') {
    for (const w of wheels) wheelAt(w, HV + 3);
    tongue(ink, P, from, tongueTo, { ring: false, bend: 2 });
    bed(); coverDraw();
    for (const w of wheels) wheelAt(w, -HV - 3);
    return { tongueEnd: P(tongueTo) };
  }
  const [rear, front] = wheels;
  if (h === 'n') {
    tongue(ink, P, from, tongueTo, { ring: false, bend: 2 });
    for (const v of [-HV - 3, HV + 3]) wheelAt(front, v);
    bed(); coverDraw();
    for (const v of [-HV - 3, HV + 3]) wheelAt(rear, v);
    return { tongueEnd: P(tongueTo) };
  }
  for (const v of [-HV - 3, HV + 3]) wheelAt(rear, v);
  bed(); coverDraw();
  for (const v of [-HV - 3, HV + 3]) wheelAt(front, v);
  tongue(ink, P, from, tongueTo, { ring: false, bend: 2 });
  return { tongueEnd: P(tongueTo) };
}

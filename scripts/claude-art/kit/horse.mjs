// The horse and the mounted frame. Rebuilt for area D (2026-09-28) on the four-legged rig (quadruped.mjs): a muscled bay with
// jointed legs and real gaits - walk, trot and gallop - in place of the foundation's plank body and straight-stick legs, and a
// rider who sits it: the thigh down and forward, the knee bent, the heel under the hip in the stirrup, the hands low at the
// reins, the body riding the horse's rise and fall a beat behind it. East (the game mirrors for west), south and north.
//
// Proportions are the foundation's fit to Astra's mounted cast (1.8 of a person, `MOUNTED_HEIGHT`; the rider at her riders'
// 1.3 of a standing person); the horse's shape is fitted to her `horse-walk` and `rust-ride-*` on a grid.
import { LINE, PEOPLE, UNIT } from './style.mjs';
import { Ink, add, sub, mul, lerp, curve, frameSvg, f2 } from './svg.mjs';
import { drawPerson, frameOf } from './rig.mjs';
import { COATS, quadPose, drawQuadSide, drawQuadFrontal } from './quadruped.mjs';

export const HORSE = COATS.bay;
export const RIDER_SCALE = 1.3;
export const MOUNTED_LOGICAL = Math.round(PEOPLE.logicalHeight * 1.8);

/** The family's horse side-on (walking frame 0-3, or standing), as the foundation's API had it. */
export function drawHorse(ink, { frame = null, gait = 'walk', tack = true, coat = COATS.bay, saddle = tack } = {}) {
  const pose = quadPose('horse', { gait: frame == null ? null : gait, frame: frame ?? 0 });
  const at = drawQuadSide(ink, 'horse', pose, { coat, tack, saddle });
  return { ...at, reins: at.bit };
}

/**
 * The rider's side pose on the horse, in the rider's own units (`seat` already divided by RIDER_SCALE): astride, the thigh
 * forward and down, the knee bent, the stirrup under the hip; the hands low in front at the reins; `lean` forward.
 */
export function riderSide(F, seat, { hands = null, lean = 5, bob = 0, stand = 0, elbows = { near: -1, far: -1 } } = {}) {
  const g = F.hip / 39;
  const hip = add(seat, [0, bob + stand]);
  const L = F.B.thigh + F.B.shin;
  const foot = add(seat, [2.5 * g, -L * 0.955 + stand * 0.2]);
  return { view: 'e', riding: true, pelvis: hip, lean, feet: { near: foot, far: add(hip, [3, -6]) }, knees: { near: 1, far: 1 },
    hands: hands ? { near: add(hip, hands.near), far: add(hip, hands.far || add(hands.near, [-1.5, 1])) } : { near: add(hip, [15 * g, 16 * g]), far: add(hip, [13.5 * g, 17 * g]) }, elbows };
}

/** The rider's front or back pose: astride, the feet down both sides at the stirrups, the hands low in front at the reins. */
export function riderFrontal(F, seat, view, { spread = 16, drop = 34, hands = null, bob = 0 } = {}) {
  const hip = add(seat, [0, bob]);
  const g = F.hip / 39;
  return { view, riding: true, pelvis: hip, feetFrontal: { left: add(hip, [-spread, -drop * g]), right: add(hip, [spread, -drop * g]) },
    hands: hands ? { left: add(hip, hands.left), right: add(hip, hands.right) } : { left: add(hip, [-6 * g, 11 * g]), right: add(hip, [6 * g, 11 * g]) } };
}

/**
 * One mounted frame: the horse and the rider as one sprite, walking, trotting or galloping (frame 0-3 of `gait`) or standing
 * (frame null), facing `view` 'e' (west mirrored by the game), 's' or 'n'. `figure` is a cast name or a rig spec. Options:
 *   pose(F, seat, ctx)  the rider's own pose (else riderSide/riderFrontal), ctx { bob, frame, view }
 *   before/after(ink, at, riderJoints)  extra drawing in rig units behind or over everything (a carbine's flash, a led horse)
 *   coat, tack ('military' for a trooper's), blanket, cell { w, h }, groundY, originX, species ('horse' | 'mule')
 * Returns { svg, w, h, anchorX, anchorY, logicalHeight } as every frame does.
 */
export function mountedFrame(name, figure, frame = null, opts = {}) {
  const { note = 'mounted on the family\'s horse', view = 'e', cell = { w: 760, h: 560 }, groundY = cell.h - 28, originX = view === 'e' ? 330 : cell.w / 2, res = 1 } = opts;
  const k = UNIT;
  const ink = new Ink(name, k, { yUp: true });
  drawMounted(ink, figure, frame, opts);
  return wrap(name, ink, { cell, originX, groundY, note, logical: MOUNTED_LOGICAL, res });
}

/** The horse and its rider drawn into an existing drawing (rig units, the ground at 0 under the saddle): mountedFrame's body. */
export function drawMounted(ink, figure, frame = null, opts = {}) {
  const { gait = 'walk', view = 'e', coat = COATS.bay, tack = true, blanket = '#b8342a', species = 'horse', pose: poseFn = null, before = null, after = null, rider = true,
    horseOpts = {}, riderScale = 1, phase = 0 } = opts;
  const k = ink.k, s = RIDER_SCALE * riderScale;
  const F = rider && figure ? frameOf(figure) : null;
  if (before) before(ink, {});
  let joints = null;
  const drawRider = (at, seat, riderPose) => {
    const r = new Ink(ink.prefix + '-r', k * s, { yUp: true });
    r.n = ink.n + 700;
    joints = drawPerson(r, figure, riderPose);
    ink.n = r.n + 1;
    ink.defs.push(...r.defs);
    ink.raw(`<g transform="scale(${s})">${r}</g>`);
  };
  let at;
  if (view === 'e') {
    const pose = quadPose(species, { gait: frame == null ? null : gait, frame: (frame ?? 0) + phase * 4 });
    at = drawQuadSide(ink, species, pose, { coat, tack: tack === 'military' ? 'military' : tack, saddle: !!tack, blanket, ...horseOpts });
    if (F) {
      // The rider rides the back's rise and fall a beat late, and a little less of it.
      const seat = [at.seat[0] / s, at.seat[1] / s];
      const riderPose = poseFn ? poseFn(F, seat, { bob: pose.bob * -0.25, frame, view, gait, at }) : riderSide(F, seat, { bob: pose.bob * -0.25 });
      drawRider(at, seat, riderPose);
      // The reins from the hands to the bit, drooping a little.
      if (joints?.handNear && riderPose.reins !== false) {
        const hand = mul(riderPose.tool ? joints.handFar : joints.handNear, s), bit = at.bit;
        ink.line(curve([hand, add(lerp(hand, bit, 0.5), [0, -5]), bit]), { colour: '#3e2816', width: 2.2 });
      }
    }
  } else {
    const hopts = { frame, coat, tack, saddle: !!tack, blanket, gait, ...horseOpts };
    at = drawQuadFrontal(ink, species, view, { ...hopts, layer: 'back' });
    if (F) {
      const seat = [at.seat[0] / s, at.seat[1] / s];
      const riderPose = poseFn ? poseFn(F, seat, { bob: 0, frame, view, gait, at }) : riderFrontal(F, seat, view, { spread: (at.half + 5) / s, drop: 30 });
      drawRider(at, seat, riderPose);
    }
    const front = drawQuadFrontal(ink, species, view, { ...hopts, layer: 'front' });
    at = { ...at, ...front };
    // Coming toward us the reins run from the hands to the bit either side of the face.
    if (F && view === 's' && joints && at.face && (!poseFn || opts.reins !== false)) {
      for (const side of [-1, 1]) {
        const hand = mul(add(joints.P, [side * 6 * (F.hip / 39), 11 * (F.hip / 39)]), s), bit = mul(add(at.face, [side * 8.5, -27]), at.scale);
        ink.line(curve([hand, add(lerp(hand, bit, 0.5), [0, -4]), bit]), { colour: '#3e2816', width: 2 });
      }
    }
  }
  if (after) after(ink, at, joints && { ...joints, scale: s });
  return { at, joints, scale: s };
}

/** Draw `fn(sub)` into `ink` moved by (dx, dy) rig units: one member of a group (a party of riders, a herd). */
export function placed(ink, dx, dy, fn, { flip = false, scale = 1 } = {}) {
  const sub = new Ink(`${ink.prefix}-p${ink.n}`, ink.k * scale, { yUp: true });
  sub.n = ink.n + 1;
  const out = fn(sub);
  ink.n = sub.n + 1;
  ink.defs.push(...sub.defs);
  ink.raw(`<g transform="translate(${f2(dx)} ${f2(dy)})${flip ? ' scale(-1 1)' : ''}${scale !== 1 ? ` scale(${scale})` : ''}">${sub}</g>`);
  return out;
}

/** A frame of several things together (rig units at `k` px each), anchored at (originX, groundY) of `cell`. */
export function groupFrame(name, { cell, originX = cell.w / 2, groundY = cell.h - 28, logical = MOUNTED_LOGICAL, k = UNIT, note = '', res = 1 }, draw) {
  const ink = new Ink(name, k, { yUp: true });
  draw(ink);
  return wrap(name, ink, { cell, originX, groundY, note, logical, res });
}

/**
 * The frame's SVG at `res` of the drawing's size: everything drawn at full size and scaled down whole, so the lines keep their
 * weight against the figure. Area D's sheets are drawn at half (a mounted frame's logical height 270, near Astra's own mounted
 * frames at 205-314) - a quarter of the pixels of a full-size sheet for the same drawing at play size.
 */
export function wrap(name, ink, { cell, originX, groundY, note, logical, res = 1 }) {
  const k = ink.k, w = Math.round(cell.w * res), h = Math.round(cell.h * res);
  const body = `<g transform="scale(${res})"><g transform="translate(${originX} ${groundY}) scale(${f2(k)} ${f2(-k)})">${ink}</g></g>`;
  return { svg: frameSvg({ name, w, h, body, defs: ink.defs, note }), w, h,
    anchorX: +(originX / cell.w).toFixed(4), anchorY: +(groundY / cell.h).toFixed(4), logicalHeight: Math.round(logical * res) };
}

/** An animal alone (no rider): the same machinery, at `logical` source px of drawn height for `heightUnits` rig units. */
export function animalFrame(name, species, { note = '', view = 'e', frame = null, gait = 'walk', graze = false, coat = COATS.bay, cell = { w: 560, h: 420 }, logical, heightUnits, originX, groundY, opts = {}, before = null, after = null, poseOpts = {}, res = 1 } = {}) {
  // Scale so `heightUnits` rig units become `logical` source px at the frame's logical height; the cell is in those px.
  const k = logical / heightUnits;
  groundY ??= cell.h - 26; originX ??= view === 'e' ? cell.w * 0.5 : cell.w / 2;
  const ink = new Ink(name, k, { yUp: true });
  if (before) before(ink);
  let at;
  if (view === 'e') at = drawQuadSide(ink, species, quadPose(species, { gait: frame == null ? null : gait, frame: frame ?? 0, graze, ...poseOpts }), { coat, ...opts });
  else at = drawQuadFrontal(ink, species, view, { frame, coat, gait, ...opts });
  if (after) after(ink, at);
  return wrap(name, ink, { cell, originX, groundY, note, logical, res });
}

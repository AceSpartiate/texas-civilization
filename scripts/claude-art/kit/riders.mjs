// Riders for area D (2026-09-28): the figures that ride in the requests and are not in the rig's cast, and the poses of a man
// in the saddle holding something - a rifle across the pommel, a carbine raised and fired, a lance upright or couched, an
// escopeta on the thigh - built on horse.mjs's `riderSide`. Every famous or named rider is an original interpretation, never a
// likeness (docs/BATTLES.md §2c); every uniform is an interpretation at play size, not a plate.
import { add, lerp } from './svg.mjs';
import { CAST } from './style.mjs';
import { riderSide, riderFrontal } from './horse.mjs';

/**
 * The Mexican dragoon as Astra draws him (`dragoon-*`, `dragoon-march-*`): a dark blue coatee with red collar and facings, white
 * crossbelts, a brass helmet with a black crest, pale trousers, black boots. Sources for the colours differ (red coats with
 * green facings are recorded for some line cavalry); the game follows her figure so a Claude dragoon stands beside hers.
 */
export const DRAGOON = Object.freeze({ sex: 'm', age: 'soldier', skin: '#c98a58', hair: '#2e2018', hat: { kind: 'helmet', colour: '#c8a040', band: '#1e1a18', crest: '#1e1a18' }, moustache: '#2e2018',
  shirt: '#2a3a6a', coat: '#2a3a6a', facings: '#b8342a', crossbelt: '#efe6d0', lower: { kind: 'trousers', colour: '#d8d2c4' }, feet: '#1e1612' });
/** A Texian volunteer on his own horse, in his own clothes: the rig's volunteer. */
export const VOLUNTEER = CAST.volunteer;
/**
 * A Tejano horseman of Béxar, 1835-36 (Seguín's company): a short jacket (chaqueta), a low-crowned wide hat, a red sash, dark
 * split trousers (calzoneras) over leather leggings. The ranchero's riding dress is described in general terms for the
 * borderlands; no uniform is claimed, and this dress is an interpretation.
 */
export const TEJANO = Object.freeze({ sex: 'm', age: 'adult', skin: '#b87a4c', hair: '#1e1612', hairStyle: 'short', hat: { kind: 'wide', colour: '#5a4632', band: '#2a1e14' }, moustache: '#241a12',
  shirt: '#efe2c6', coat: '#4a3424', sash: '#9a3226', lower: { kind: 'trousers', colour: '#2f3340' }, feet: '#6a4a2c' });
/**
 * Juan Seguín, after Astra's own figure of him (`seguin-*`): a dark blue short jacket, white shirt, buff trousers, tall black
 * boots, a dark flat-brimmed hat, clean-shaven. An original interpretation, not a likeness.
 */
export const SEGUIN = Object.freeze({ sex: 'm', age: 'adult', skin: '#b87a4c', hair: '#1e1612', hairStyle: 'short', hat: { kind: 'wide', colour: '#3a2e24', band: '#1e1812' },
  shirt: '#f0e8d8', coat: '#26345a', lower: { kind: 'trousers', colour: '#cdb690' }, feet: '#1e1612' });
/**
 * Dr. John Sutherland (a physician from Tennessee at Béxar in February 1836): a man of about forty in a dark frock coat, a
 * buff waistcoat and grey trousers, a dark hat. Nothing of his dress is recorded; an original interpretation, not a likeness.
 */
export const SUTHERLAND = Object.freeze({ sex: 'm', age: 'adult', skin: '#d59a70', hair: '#5a4632', hairStyle: 'short', hat: { kind: 'brim', colour: '#2e2822', band: '#141210' }, beard: '#6a5642', beardStyle: 'short',
  shirt: '#efe6d2', coat: '#2e3a2e', waistcoat: '#b89a5e', lower: { kind: 'trousers', colour: '#6a6660' }, feet: '#1e1612' });

const g = F => F.hip / 39;
/** Reins in the far hand only (the near hand holds a weapon): where the far hand rests, over the pommel. */
const reinsHand = F => [12 * g(F), 16 * g(F)];

/** A long rifle carried across the pommel, the near hand on the wrist of the stock, the far hand on the reins. */
export const rifleAcross = (F, seat, { bob = 0 } = {}) => {
  const p = riderSide(F, seat, { bob });
  const hip = p.pelvis;
  return { ...p, tool: { kind: 'rifle', butt: add(hip, [-8 * g(F), 12 * g(F)]), tip: add(hip, [44 * g(F), 24 * g(F)]), side: -1, near: 0.3, far: 0.42, front: true },
    hands: { far: add(hip, reinsHand(F)) }, elbows: { near: -1, far: -1 } };
};
/** A long gun raised to the shoulder and aimed forward (`recoil` kicks the muzzle up), the reins dropped on the neck. */
export const aimFromSaddle = (F, seat, { bob = 0, recoil = 0, length = 44 } = {}) => {
  const p = riderSide(F, seat, { bob, lean: 8 });
  const hip = p.pelvis, s = g(F);
  const butt = add(hip, [2 * s, 30 * s]), tip = add(butt, [length * s * Math.cos(recoil * Math.PI / 180), length * s * Math.sin(recoil * Math.PI / 180)]);
  return { ...p, reins: false, tool: { kind: 'rifle', butt, tip, side: -1, near: 0.06, far: 0.42, front: true }, elbows: { near: -1, far: -1 } };
};
/** A short carbine brought up across the body before the shot, or lowered after it. */
export const carbineRaised = (F, seat, { bob = 0, low = false } = {}) => {
  const p = riderSide(F, seat, { bob, lean: 6 });
  const hip = p.pelvis, s = g(F);
  const butt = add(hip, low ? [0, 12 * s] : [2 * s, 18 * s]), tip = add(butt, low ? [34 * s, -4 * s] : [26 * s, 26 * s]);
  return { ...p, reins: false, tool: { kind: 'rifle', butt, tip, side: -1, near: 0.1, far: 0.5, front: true }, elbows: { near: -1, far: -1 } };
};
/** Something slung across the back (a carbine or escopeta): drawn behind the body from the shoulder to the hip. */
export const slung = (pose, F) => ({ ...pose, tool: { kind: 'rifle', butt: add(pose.pelvis, [-9 * g(F), 6 * g(F)]), tip: add(pose.pelvis, [8 * g(F), 36 * g(F)]), side: 1, behind: true, near: -9, far: -9 }, hands: { near: pose.hands.near, far: pose.hands.far } });
/** A lance held upright, the butt by the stirrup, the pennon high; or couched level for the charge, pointing ahead and a little down. */
export const lanceUp = (F, seat, { bob = 0 } = {}) => {
  const p = riderSide(F, seat, { bob });
  const hip = p.pelvis, s = g(F);
  return { ...p, tool: { kind: 'lance', butt: add(hip, [14 * s, -24 * s]), tip: add(hip, [20 * s, 104 * s]), near: 0.3, far: 0.3, front: true }, hands: { far: add(hip, reinsHand(F)) }, elbows: { near: -1, far: -1 } };
};
export const lanceCouched = (F, seat, { bob = 0 } = {}) => {
  const p = riderSide(F, seat, { bob, lean: 14 });
  const hip = p.pelvis, s = g(F);
  return { ...p, tool: { kind: 'lance', butt: add(hip, [-40 * s, 24 * s]), tip: add(hip, [94 * s, 12 * s]), near: 0.36, far: 0.36, front: true, side: 1 }, hands: { far: add(hip, reinsHand(F)) }, elbows: { near: 1, far: -1 } };
};
/** An escopeta held upright, its butt on the thigh. */
export const escopetaUp = (F, seat, { bob = 0 } = {}) => {
  const p = riderSide(F, seat, { bob });
  const hip = p.pelvis, s = g(F);
  return { ...p, tool: { kind: 'rifle', butt: add(hip, [10 * s, 6 * s]), tip: add(hip, [18 * s, 50 * s]), side: 1, near: 0.2, far: 0.2, front: true }, hands: { far: add(hip, reinsHand(F)) }, elbows: { near: -1, far: -1 } };
};
/** Slumped in the saddle: bent over the horse's neck, the head down, the hands on the pommel; the reins held by another. */
export const slumped = (F, seat, { bob = 0 } = {}) => {
  const p = riderSide(F, seat, { bob, lean: 34 });
  const hip = p.pelvis, s = g(F);
  return { ...p, tilt: 18, reins: false, hands: { near: add(hip, [14 * s, 8 * s]), far: add(hip, [12 * s, 9 * s]) }, elbows: { near: 1, far: 1 } };
};
export { riderSide, riderFrontal };

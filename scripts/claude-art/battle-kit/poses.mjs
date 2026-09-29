// The battle kit's poses: soldiers and townspeople in the fights of 1835-36, for the person rig (scripts/claude-art/kit/rig.mjs),
// each a list of frames of joint targets. Area C of docs/CLAUDE_ART_PLAN.md; Claude's temporary art.
//
// The body moves as a body does: the weight is on the foot under the hips, a stride drops the hips and a pass lifts them, a
// shot is taken from a braced stance (the near - right - foot back, the far foot forward, the front knee bent, the head down
// on the stock), the recoil rocks the shoulders back, a man loading kneels on his right knee with the piece upright before him,
// and a ramrod is drawn up at arm's length. Every figure faces east (the game mirrors it for west) unless the pose ends -s/-n.
// Numbers are in the rig's units for a grown figure (hips at 39, shoulders ~59) and scaled by `g` to the figure's own size.
// Deaths are never graphic (VISION.md §16, docs/BATTLES.md): a man falls, lies still, is covered; nothing of a wound is drawn.
import { add, sub, mul, lerp, norm } from '../kit/svg.mjs';
import { drawGun, drawRamrod, drawSword } from './gear.mjs';

export const g = F => F.hip / 39;
export const P = (F, dx = 0, dy = 0) => [dx * g(F), F.hip + dy * g(F)];
export const foot = (F, x, lift = 0) => [x * g(F), F.ankle + lift * g(F)];
/** A point relative to the standing figure's shoulder height. */
export const at = (F, x, y) => [x * g(F), F.neck - 3 + y * g(F)];

/** A long gun as a pose's tool (the rig puts the hands on it at `near` and `far` along it and draws it before the near arm). */
export function gun(F, kind, butt, tip, { near = 0.2, far = 0.36, down = -1, bayonet = false, layer } = {}) {
  const b = at(F, ...butt), t = at(F, ...tip);
  return { kind, butt: b, tip: t, near, far, ...(layer === 'behind' && { behind: true }), ...(layer === 'front' && { front: true }),
    draw: ink => drawGun(ink, b, t, { down, kind, bayonet }) };
}
/** A gun that nobody holds (on the ground, leaning, across the knees): drawn by `after` or `before`. */
export const looseGun = (F, kind, butt, tip, opts = {}) => ink => drawGun(ink, at(F, ...butt), at(F, ...tip), { kind, ...opts });

const L = { musket: 74, rifle: 78 };
/** The piece a figure carries: a musket for a regular, a long rifle for a Texian. */
export const pieceOf = spec => spec.piece || (spec.hat?.kind === 'shako' || spec.coat === '#2f3f6a' ? 'musket' : 'rifle');

/**
 * The firing cycle, as Astra's `-fire-reload` clip (aim 700, fire 120, load 750, ramrod 900): aim, fire (the recoil), load
 * (kneeling on the right knee, the piece upright, the cartridge bitten and poured) and ramrod (standing, the rod drawn up).
 */
export function fireCycle(F, { kind = 'rifle', bayonet = false } = {}) {
  const len = L[kind];
  const stance = { near: foot(F, -9), far: foot(F, 10) };
  // The butt in the shoulder, the barrel along the line of the eye; the right hand at the wrist, the left under the barrel.
  const aim = { view: 'e', pelvis: P(F, -1.5, -2.2), lean: 7, tilt: 14, feet: stance, knees: { near: 1, far: 1 },
    tool: gun(F, kind, [-1.5, 4.5], [len - 1.5, 5.5], { near: 0.2, far: 0.38, bayonet }), elbows: { near: -1, far: -1 } };
  const fire = { view: 'e', pelvis: P(F, -2.6, -2), lean: 1, tilt: 8, feet: stance, knees: { near: 1, far: 1 },
    tool: gun(F, kind, [-3.5, 5.5], [len - 5, 10.5], { near: 0.2, far: 0.37, bayonet }), elbows: { near: -1, far: -1 } };
  // Kneeling on the right (near) knee, the left foot planted forward, the piece upright before him, butt on the ground; the
  // right hand at the muzzle pouring the charge, the left holding the barrel.
  const kneel = kneelPose(F);
  const load = { ...kneel, lean: 10, tilt: 6, tool: gun(F, kind, [15, -48 - F.ankle / g(F) + 2], [18, -48 + len * 0.98], { near: 0.9, far: 0.62, down: 1, bayonet }), elbows: { near: -1, far: -1 } };
  // Standing, the piece upright by the far (left) foot, butt on the ground; the rod drawn up at arm's length from the muzzle.
  const upright = [10, -(F.neck - 3 - F.ankle) / g(F) + 0.5];
  const ramrod = { view: 'e', pelvis: P(F, -1, 0), lean: 3, tilt: -6, feet: { near: foot(F, -4), far: foot(F, 5) },
    tool: gun(F, kind, upright, [upright[0] + 2, upright[1] + len * 0.97], { near: 0.93, far: 0.66, down: 1, bayonet }),
    hands: { near: at(F, 12, 23) }, elbows: { near: -1, far: -1 },
    after: (ink, j) => drawRamrod(ink, add(at(F, 12, 21), [0, 0]), at(F, 11.6, -2 + len * 0.97 - (F.neck - 3 - F.ankle) / g(F) - 14)) };
  return { aim, fire, load, ramrod };
}
/** Kneeling on the near (right) knee, the far foot forward and flat: the shin of the near leg along the ground. */
export function kneelPose(F, { lean = 8 } = {}) {
  const sh = F.B.shin, th = F.B.thigh;
  // The near knee on the ground under and behind the hips, its foot behind; the far thigh level, its shin upright.
  return { view: 'e', pelvis: [-2 * g(F), F.ankle + sh * 0.35 + th * 0.78], lean,
    feet: { near: [-2 * g(F) - th * 0.35 - sh * 0.96, F.ankle - 0.5], far: [-2 * g(F) + th * 0.92, F.ankle] }, knees: { near: 1, far: 1 } };
}

/** Standing easy, the piece ordered: butt by the right foot, the muzzle at the shoulder, the right hand round the barrel. */
export function standOrdered(F, { kind = 'rifle' } = {}) {
  const len = L[kind], butt = [7, -(F.neck - 3 - F.ankle) / g(F) + 0.6];
  return { view: 'e', pelvis: P(F), lean: 2, feet: { near: foot(F, 3.5), far: foot(F, -3) },
    tool: gun(F, kind, butt, [butt[0] + 1.5, butt[1] + len * 0.98], { near: 0.72, far: 0.5, down: 1, layer: 'front' }), hands: { far: at(F, -1, -24) }, elbows: { near: -1 } };
}

/** The march, four frames, the piece at the trail in the right hand (as Astra's `-march`): near foot forward, pass, far forward, pass. */
export function march(F, { kind = 'rifle', shoulder = false, bayonet = false } = {}) {
  const s = F.B.thigh * 0.95, arm = F.B.upperArm + F.B.forearm, len = L[kind];
  const frames = [
    { pelvis: P(F, 0, -1.6), lean: 6, feet: { near: foot(F, s), far: foot(F, -s * 0.9, 1.4) }, swing: -1 },
    { pelvis: P(F, 0, 0.5), lean: 5, feet: { near: foot(F, 1), far: foot(F, -2, 6.5) }, swing: 0 },
    { pelvis: P(F, 0, -1.6), lean: 6, feet: { near: foot(F, -s * 0.9, 1.4), far: foot(F, s) }, swing: 1 },
    { pelvis: P(F, 0, 0.5), lean: 5, feet: { near: foot(F, -2, 6.5), far: foot(F, 1) }, swing: 0 },
  ];
  return frames.map(({ swing, ...fr }) => {
    const bob = (fr.pelvis[1] - F.hip) / g(F);
    if (shoulder) {
      // Shouldered: the butt in the left hand at the hip... drawn as the right hand under the butt at the shoulder, the piece
      // sloped back over it; the free arm swinging.
      const butt = [3, -20 + bob], tip = [butt[0] - len * 0.62, butt[1] + len * 0.78];
      return { view: 'e', ...fr, tool: gun(F, kind, butt, tip, { near: 0.02, far: 0.3, down: -1, bayonet, layer: 'behind' }), hands: { near: at(F, 4, -19 + bob), far: at(F, swing * 8, -arm * 0.82 + bob) }, elbows: { near: -1, far: -1 } };
    }
    const hand = at(F, 1 + swing * 3, -arm * 0.84 + bob);
    const butt = add(hand, [-len * 0.3 * g(F), 1.8 * g(F)]), tip = add(hand, [len * 0.7 * g(F), -5 * g(F)]);
    const toG = p => [p[0] / g(F), (p[1] - (F.neck - 3)) / g(F)];
    return { view: 'e', ...fr, tool: gun(F, kind, toG(butt), toG(tip), { near: 0.3, far: 0.3, down: 1, bayonet }), hands: { far: at(F, -swing * 9, -arm * 0.8 + bob) }, elbows: { near: -1, far: -1 } };
  });
}

/** Running, four frames: the body forward, long strides with a flight phase, the piece carried across the body at the port. */
export function run(F, { kind = 'musket', bayonet = false } = {}) {
  const s = F.B.thigh * 1.15, len = L[kind];
  const frames = [
    { pelvis: P(F, 0, -3.5), feet: { near: foot(F, s * 1.05), far: foot(F, -s * 0.95, 6) } },
    { pelvis: P(F, 0, 0.8), feet: { near: foot(F, -2), far: foot(F, 4, 15) } },
    { pelvis: P(F, 0, -3.5), feet: { near: foot(F, -s * 0.95, 6), far: foot(F, s * 1.05) } },
    { pelvis: P(F, 0, 0.8), feet: { near: foot(F, 4, 15), far: foot(F, -2) } },
  ];
  return frames.map(fr => {
    const bob = (fr.pelvis[1] - F.hip) / g(F);
    return { view: 'e', ...fr, lean: 16, tilt: -6, knees: { near: 1, far: 1 },
      tool: gun(F, kind, [-8, -22 + bob], [-8 + len * 0.8, -22 + bob + len * 0.55], { near: 0.14, far: 0.4, down: 1, bayonet }), elbows: { near: -1, far: -1 } };
  });
}

/** Kneeling to fire (the skirmisher's): aim, fire, load, ramrod, all on the right knee. */
export function kneelFire(F, { kind = 'musket' } = {}) {
  const len = L[kind], k = kneelPose(F, { lean: 6 });
  const dy = (k.pelvis[1] - F.hip) / g(F);
  const aim = { ...k, lean: 8, tilt: 14, tool: gun(F, kind, [-1.5, 4.5 + dy], [len - 1.5, 5.5 + dy], { near: 0.2, far: 0.38 }), elbows: { near: -1, far: -1 } };
  const fire = { ...k, lean: 1, tilt: 8, pelvis: add(k.pelvis, [-1, 0]), tool: gun(F, kind, [-3.5, 5.5 + dy], [len - 5, 10.5 + dy], { near: 0.2, far: 0.37 }), elbows: { near: -1, far: -1 } };
  const base = -(F.neck - 3 - F.ankle) / g(F) + 0.5;
  const load = { ...k, lean: 10, tilt: 6, tool: gun(F, kind, [15, base], [18, base + len * 0.98], { near: 0.9, far: 0.62, down: 1 }), elbows: { near: -1, far: -1 } };
  const ramrod = { ...k, lean: 2, tilt: -8, tool: gun(F, kind, [14, base], [16, base + len * 0.98], { near: 0.95, far: 0.6, down: 1 }), hands: { near: at(F, 15, 8 + dy + 6) }, elbows: { near: -1, far: -1 },
    after: ink => drawRamrod(ink, at(F, 15, 6 + dy + 6), at(F, 15.6, base + len * 0.97 - 12)) };
  return { aim, fire, load, ramrod };
}

/** Falling (a stumble backward) and lying still; nothing of a wound. */
export function fall(F) {
  return { view: 'e', pelvis: P(F, -3, -10), lean: -28, tilt: 14, feet: { near: foot(F, 9, 3), far: foot(F, -5) }, hands: { near: at(F, -14, -12), far: at(F, 10, -8) } };
}

/** An officer's gestures: standing, speaking, commanding with the sword up, pointing the way. */
export function officer(F, { sword = true } = {}) {
  const arm = F.B.upperArm + F.B.forearm;
  const stand = { view: 'e', pelvis: P(F), lean: 1, feet: { near: foot(F, 4), far: foot(F, -3.5) }, hands: { near: at(F, 1, -arm * 0.9), far: at(F, -2, -arm * 0.88) } };
  const speak = { view: 'e', pelvis: P(F, -1), lean: -2, feet: { near: foot(F, 5), far: foot(F, -3.5) }, hands: { near: at(F, 12, -6), far: at(F, -1, -arm * 0.9) }, elbows: { near: -1 }, mouth: 'open' };
  // The sword raised forward over the head, the weight on the front foot, the mouth open on the word.
  const command = { view: 'e', pelvis: P(F, 1.5, -1.5), lean: 6, feet: { near: foot(F, 9), far: foot(F, -7) }, knees: { near: 1, far: 1 }, hands: { near: at(F, 12, 20), far: at(F, -3, -arm * 0.86) }, elbows: { near: -1 }, mouth: 'open',
    after: sword ? (ink, j) => drawSword(ink, j.handNear, add(j.handNear, [16 * g(F), 17 * g(F)])) : null };
  const point = { view: 'e', pelvis: P(F, 0.5), lean: 3, feet: { near: foot(F, 7), far: foot(F, -5) }, hands: { near: at(F, 27, 4), far: at(F, -2, -arm * 0.86) }, elbows: { near: -1 } };
  return { stand, speak, command, point };
}

/** Sitting on the ground, the knees drawn up; `hug` the arms round the knees (huddled), else the hands on them. */
export function sitFloor(F, { hug = true, lean = 12, tilt = 6 } = {}) {
  const th = F.B.thigh, sh = F.B.shin;
  const hip = [-4 * g(F), F.ankle + F.B.limb * 0.45];
  const knee = [hip[0] + th * 0.62, hip[1] + th * 0.72];
  const feetX = knee[0] + sh * 0.35;
  return { view: 'e', pelvis: hip, lean, tilt, feet: { near: [feetX, F.ankle], far: [feetX - 2 * g(F), F.ankle + 0.4] }, knees: { near: 1, far: 1 },
    hands: hug ? { near: add(knee, [1.5 * g(F), -4 * g(F)]), far: add(knee, [0.5 * g(F), -2.5 * g(F)]) } : { near: add(knee, [0.5 * g(F), 1 * g(F)]), far: add(knee, [-1 * g(F), 1.5 * g(F)]) },
    elbows: { near: 1, far: 1 } };
}

/** A walk with a shorter stride (a woman in a long skirt): the kit's walk with the feet and the arm swing drawn in. */
export function shortWalk(F, walk, k = 0.6) {
  return walk.map(fr => ({ ...fr, lean: (fr.lean || 0) * 0.6,
    feet: { near: [fr.feet.near[0] * k, fr.feet.near[1]], far: [fr.feet.far[0] * k, fr.feet.far[1]] },
    ...(fr.hands && { hands: Object.fromEntries(Object.entries(fr.hands).map(([key, h]) => [key, [h[0] * k, h[1]]])) }) }));
}

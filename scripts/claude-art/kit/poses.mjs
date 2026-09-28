// The pose library: every pose the rig can take, as a list of frames of joint targets, for any identity. A pose is a
// function of the figure (its heights) so a child's walk is a child's size. Frame order follows the request that asks for
// it; `beat` is the frame on which a tool lands (public/work-art.js times chips, earth and sounds to it).
//
// Poses face east ('e', mirrored for west by the game) unless their name ends -s or -n.
import { frameOf } from './rig.mjs';
import { add, down, up } from './svg.mjs';

const P = (F, dx = 0, dy = 0) => [dx, F.hip + dy];
const foot = (F, x, lift = 0) => [x, F.ankle + lift];
/** Hands relative to the shoulder height of a standing figure (so a pose reads the same for a child). */
const sh = F => F.neck - 3;

export const POSES = {
  'idle-e': F => [{ view: 'e', pelvis: P(F), feet: { near: foot(F, 3), far: foot(F, -2.5) } }],
  'idle-s': F => [{ view: 's' }],
  'idle-n': F => [{ view: 'n' }],
  // A turn: the body side-on, the head come round toward the camera (the game has no three-quarter frames; this is the in-between).
  'turn-e-s': F => [{ view: 'e', pelvis: P(F), tilt: -4, feet: { near: foot(F, 2.5), far: foot(F, -2) } }, { view: 's' }],
  // The walk, four frames as Astra's people-walk: near foot forward, passing, far foot forward, passing.
  'walk': F => {
    const s = F.B.thigh * 0.9, arm = F.B.upperArm + F.B.forearm, S = sh(F);
    return [
      { view: 'e', pelvis: P(F, 0, -1.2), lean: 3, feet: { near: foot(F, s), far: foot(F, -s * 0.9, 0.8) }, hands: { near: [-5, S - arm * 0.85], far: [5.5, S - arm * 0.82] }, elbows: { far: -1 } },
      { view: 'e', pelvis: P(F, 0, 0.2), lean: 2, feet: { near: foot(F, 1.5), far: foot(F, -2, 4) }, hands: { near: [0, S - arm * 0.9], far: [1, S - arm * 0.9] } },
      { view: 'e', pelvis: P(F, 0, -1.2), lean: 3, feet: { near: foot(F, -s * 0.9, 0.8), far: foot(F, s) }, hands: { near: [6, S - arm * 0.82], far: [-4.5, S - arm * 0.85] } },
      { view: 'e', pelvis: P(F, 0, 0.2), lean: 2, feet: { near: foot(F, -2, 4), far: foot(F, 1.5) }, hands: { near: [1, S - arm * 0.9], far: [0, S - arm * 0.9] } },
    ];
  },
  'walk-s': F => [{ view: 's', step: -1, pelvis: P(F, 0, -0.6) }, { view: 's', step: 1, pelvis: P(F, 0, -0.6) }],
  'walk-n': F => [{ view: 'n', step: -1, pelvis: P(F, 0, -0.6) }, { view: 'n', step: 1, pelvis: P(F, 0, -0.6) }],
  // Felling with an axe (request 2026-09-28, people at work, item 1): the axe back over the shoulder, the swing, the bite
  // (the head in the trunk at hip height, just off the frame's right edge), the pull back. The strike is frame 3 (beat 2).
  'chop': F => {
    const S = sh(F), stance = { near: foot(F, 8.5), far: foot(F, -9) };
    return [
      { view: 'e', pelvis: P(F, -1.5, -1.5), lean: -9, tilt: 6, feet: stance, tool: { kind: 'axe', butt: [3, S - 4], tip: [-20, S + 26], side: -1, near: 0.04, far: 0.3 }, elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 0, -2), lean: 4, feet: stance, tool: { kind: 'axe', butt: [2, S - 2], tip: [24, S + 22], side: -1, near: 0.04, far: 0.2 }, elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 1.5, -3.5), lean: 16, tilt: -6, feet: stance, tool: { kind: 'axe', butt: [8, S - 23], tip: [50, S - 21], side: 1, near: 0.03, far: 0.14 }, elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, 0.5, -2.5), lean: 8, tilt: -2, feet: stance, tool: { kind: 'axe', butt: [6, S - 12], tip: [42, S - 2], side: 1, near: 0.04, far: 0.22 }, elbows: { near: 1, far: 1 } },
    ];
  },
  // Hoeing (Astra's own -work is the reference: raised, swing, down, back).
  'hoe': F => {
    const S = sh(F), stance = { near: foot(F, 7), far: foot(F, -9) };
    return [
      { view: 'e', pelvis: P(F, -1, -1), lean: -4, feet: stance, tool: { kind: 'hoe', butt: [2, S - 8], tip: [-12, S + 30], side: 1, near: 0.08, far: 0.35 } },
      { view: 'e', pelvis: P(F, 0, -2), lean: 14, feet: stance, tool: { kind: 'hoe', butt: [2, S - 12], tip: [30, 6], side: -1, near: 0.1, far: 0.35 }, elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, 0, -4), lean: 24, feet: stance, tool: { kind: 'hoe', butt: [4, S - 16], tip: [32, 3], side: -1, near: 0.1, far: 0.4 }, elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, 0, -2.5), lean: 12, feet: stance, tool: { kind: 'hoe', butt: [3, S - 12], tip: [26, 3], side: -1, near: 0.08, far: 0.32 }, elbows: { near: 1, far: 1 } },
    ];
  },
  // Splitting rails (item 2): the maul raised overhead, coming down, on the wedge in a log on the ground, back.
  'split': F => {
    const S = sh(F), stance = { near: foot(F, 6), far: foot(F, -7) };
    return [
      { view: 'e', pelvis: P(F, -1, -1), lean: -8, tilt: 8, feet: stance, tool: { kind: 'maul', butt: [2, S + 6], tip: [-10, S + 34], side: 1, near: 0.05, far: 0.25 } },
      { view: 'e', pelvis: P(F, 0, -2), lean: 8, feet: stance, tool: { kind: 'maul', butt: [4, S + 2], tip: [22, S + 30], side: 1, near: 0.05, far: 0.22 } },
      { view: 'e', pelvis: P(F, 1, -5), lean: 26, tilt: -10, feet: stance, tool: { kind: 'maul', butt: [8, S - 16], tip: [26, 10], side: 1, near: 0.05, far: 0.24 }, elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, 0, -3), lean: 14, feet: stance, tool: { kind: 'maul', butt: [6, S - 10], tip: [26, 18], side: 1, near: 0.05, far: 0.24 }, elbows: { near: 1, far: 1 } },
    ];
  },
  // Digging (item 4): the spade driven in with the foot, levered, the earth thrown behind, back.
  'dig': F => {
    const S = sh(F);
    return [
      { view: 'e', pelvis: P(F, 0, 1), lean: 6, feet: { near: foot(F, 10, 7), far: foot(F, -3) }, tool: { kind: 'spade', butt: [9, S - 4], tip: [12, 4], side: 1, near: 0.02, far: 0.3 }, elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -1, -4), lean: 20, feet: { near: foot(F, 7), far: foot(F, -8) }, tool: { kind: 'spade', butt: [2, S - 20], tip: [18, 2], side: 1, near: 0.02, far: 0.45 }, elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -2, -2), lean: -6, tilt: 4, feet: { near: foot(F, 6), far: foot(F, -8) }, tool: { kind: 'spade', butt: [8, S - 10], tip: [-18, S - 2], side: -1, near: 0.03, far: 0.4 }, elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 0, -1), lean: 6, feet: { near: foot(F, 7), far: foot(F, -6) }, tool: { kind: 'spade', butt: [6, S - 6], tip: [14, 6], side: 1, near: 0.03, far: 0.35 }, elbows: { near: 1, far: 1 } },
    ];
  },
  // Kneeling on one knee (the far knee on the ground), hands at the work in front.
  'kneel': F => [{ view: 'e', pelvis: P(F, -3, -F.B.thigh * 0.75), lean: 12, feet: { near: foot(F, 8), far: [-F.B.shin * 0.9, F.ankle + 0.5] }, knees: { near: 1, far: 1 }, hands: { near: [12, 10], far: [9, 12] }, elbows: { near: 1, far: 1 } }],
  // Sitting on a stump or the ground at knee height, hands in the lap.
  'sit': F => [{ view: 'e', pelvis: [-2, F.B.shin + F.ankle + 1], lean: -3, feet: { near: foot(F, 12), far: foot(F, 10) }, hands: { near: [9, F.B.shin + 9], far: [7, F.B.shin + 10] }, elbows: { near: 1, far: 1 } }],
  // Carrying a sack on the shoulder, walking (four frames as the walk, the near hand up at the load).
  'carry': F => POSES.walk(F).map(frame => ({ ...frame, lean: frame.lean + 4, hands: { ...frame.hands, near: [3, F.neck + 2] }, elbows: { near: -1 } })),
  // Speaking: a hand raised, then open palm (two frames, as people-dialogue).
  'speak': F => {
    const S = sh(F);
    return [
      { view: 'e', pelvis: P(F), feet: { near: foot(F, 3), far: foot(F, -2.5) }, hands: { near: [11, S - 6] }, elbows: { near: -1 }, mouth: 'open' },
      { view: 'e', pelvis: P(F), feet: { near: foot(F, 3), far: foot(F, -2.5) }, hands: { near: [14, S + 1] }, elbows: { near: -1 } },
    ];
  },
  // A long rifle at the shoulder, level (aim), the recoil, lowering (item 7: -aim 1 frame, -fire 2 frames).
  'aim': F => {
    const S = sh(F);
    return [{ view: 'e', pelvis: P(F, -1, -1), lean: 4, tilt: -4, feet: { near: foot(F, 6), far: foot(F, -7) }, tool: { kind: 'rifle', butt: [2, S - 1], tip: [58, S + 1], side: -1, near: 0.02, far: 0.3 }, elbows: { near: -1, far: -1 } }];
  },
  'fire': F => {
    const S = sh(F);
    return [
      { view: 'e', pelvis: P(F, -2, -1), lean: -3, tilt: -2, feet: { near: foot(F, 6), far: foot(F, -7) }, tool: { kind: 'rifle', butt: [-1, S], tip: [54, S + 7], side: -1, near: 0.02, far: 0.3 }, elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -1, -0.5), lean: 2, feet: { near: foot(F, 6), far: foot(F, -7) }, tool: { kind: 'rifle', butt: [0, S - 14], tip: [50, S - 30], side: -1, near: 0.2, far: 0.42 }, elbows: { near: -1, far: 1 } },
    ];
  },
  // Falling (non-graphic): a stumble, then lying still on the side. VISION.md §16: nothing of a wound.
  'fall': F => [
    { view: 'e', pelvis: P(F, -2, -8), lean: -28, tilt: 10, feet: { near: foot(F, 8, 3), far: foot(F, -6) }, hands: { near: [-8, F.hip + 10], far: [10, F.hip + 12] } },
    { view: 'e', lying: true, pelvis: P(F), feet: { near: foot(F, 2), far: foot(F, -2) } },
  ],
};

/** Mounted: the rider's pose on the horse's back (the horse is drawn by horse.mjs); legs astride, hands at the reins. */
export function riderPose(F, seat, { reins = [16, 0], bob = 0 } = {}) {
  const hip = add(seat, [0, bob]);
  return { view: 'e', pelvis: hip, lean: 4, feet: { near: add(hip, [5, -F.B.thigh - F.B.shin * 0.75]), far: add(hip, [3, -F.B.thigh - F.B.shin * 0.7]) }, knees: { near: 1, far: 1 },
    hands: { near: add(hip, reins), far: add(hip, add(reins, [-1, 1])) }, elbows: { near: 1, far: 1 } };
}
export const POSE_NAMES = Object.keys(POSES);

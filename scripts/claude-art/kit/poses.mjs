// The pose library: every pose the rig can take, as a list of frames of joint targets, for any identity. A pose is a
// function of the figure (its heights), so a child's walk is a child's size. Frame order follows the request that asks for
// it; `beat` is the frame on which a tool lands (public/work-art.js times chips, earth and sounds to it).
//
// The body moves as Astra's does (2026-09-28 quality pass, measured on her `-work`, `-walk` and `-carry` frames): a swing
// bends at the waist and the knees, the hips drop and go back as the chest comes forward, the weight shifts onto the front
// foot at the strike, and the arms reach to their full length - the tool raised behind the head, brought down, the stroke
// landing low and out in front. `lean` is the chest's tilt forward in degrees, `pelvis` the hips' place.
//
// Poses face east ('e', mirrored for west by the game) unless their name ends -s or -n. Numbers are for a grown figure
// (hips at 39, shoulders at ~59); `g` scales them to the figure's own size.
import { add } from './svg.mjs';
import { drawSack } from './props.mjs';

const P = (F, dx = 0, dy = 0) => [dx * g(F), F.hip + dy * g(F)];
const foot = (F, x, lift = 0) => [x * g(F), F.ankle + lift * g(F)];
const g = F => F.hip / 39;
/** A point relative to the shoulder height of the standing figure. */
const at = (F, x, y) => [x * g(F), F.neck - 3 + y * g(F)];
const swing = (F, kind, butt, tip, extra = {}) => ({ kind, butt: at(F, ...butt), tip: at(F, ...tip), ...extra });

export const POSES = {
  'idle-e': F => [{ view: 'e', pelvis: P(F), lean: 2, feet: { near: foot(F, 3.5), far: foot(F, -3) } }],
  'idle-s': F => [{ view: 's' }],
  'idle-n': F => [{ view: 'n' }],
  // A turn: the body side-on, the head come round toward the camera (the in-between of an east and a south frame).
  'turn-e-s': F => [{ view: 'e', pelvis: P(F), tilt: -4, feet: { near: foot(F, 2.5), far: foot(F, -2) } }, { view: 's' }],
  // The walk, four frames as her people-walk: near foot forward, passing, far foot forward, passing - a long stride, the
  // chest a little forward, the arms swinging well out, the body dropping at the stride and rising at the pass.
  'walk': F => {
    const s = F.B.thigh * 1.0, arm = F.B.upperArm + F.B.forearm;
    return [
      { view: 'e', pelvis: P(F, 0, -1.8), lean: 7, feet: { near: foot(F, s), far: foot(F, -s * 0.95, 1.5) }, hands: { near: at(F, -9, -arm * 0.8), far: at(F, 10, -arm * 0.72) } },
      { view: 'e', pelvis: P(F, 0, 0.4), lean: 5, feet: { near: foot(F, 1), far: foot(F, -3, 6) }, hands: { near: at(F, 0, -arm * 0.9), far: at(F, 1, -arm * 0.9) } },
      { view: 'e', pelvis: P(F, 0, -1.8), lean: 7, feet: { near: foot(F, -s * 0.95, 1.5), far: foot(F, s) }, hands: { near: at(F, 11, -arm * 0.72), far: at(F, -8, -arm * 0.8) } },
      { view: 'e', pelvis: P(F, 0, 0.4), lean: 5, feet: { near: foot(F, -3, 6), far: foot(F, 1) }, hands: { near: at(F, 1, -arm * 0.9), far: at(F, 0, -arm * 0.9) } },
    ];
  },
  'walk-s': F => [{ view: 's', step: -1, pelvis: P(F, 0, -0.8) }, { view: 's', step: 1, pelvis: P(F, 0, -0.8) }],
  'walk-n': F => [{ view: 'n', step: -1, pelvis: P(F, 0, -0.8) }, { view: 'n', step: 1, pelvis: P(F, 0, -0.8) }],
  // Felling with an axe (request 2026-09-28, people at work, item 1), on the arc of her hoe: the axe raised behind the head,
  // coming down, the bite (the head in the trunk at hip height, just off the frame's right edge), the pull back. Beat 2.
  'chop': F => {
    const stance = { near: foot(F, 12), far: foot(F, -12) };
    return [
      { view: 'e', pelvis: P(F, -2, -1.5), lean: -8, tilt: 12, feet: stance, tool: swing(F, 'axe', [-9, 23], [-31, 47], { side: -1, near: 0.04, far: 0.22, behind: true }), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 0, -4), lean: 14, tilt: 2, feet: stance, tool: swing(F, 'axe', [14, 12], [36, 44], { side: -1, near: 0.04, far: 0.2 }), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -5, -7), lean: 42, tilt: -16, feet: stance, tool: swing(F, 'axe', [16, -28], [56, -26], { side: 1, near: 0.03, far: 0.14 }), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -4, -5), lean: 28, tilt: -8, feet: stance, tool: swing(F, 'axe', [12, -14], [46, 2], { side: 1, near: 0.04, far: 0.2 }), elbows: { near: 1, far: 1 } },
    ];
  },
  // Hoeing, as her own -work: raised behind the head, swinging down, the blade in the ground, drawn back.
  'hoe': F => {
    const stance = { near: foot(F, 11), far: foot(F, -11) };
    return [
      { view: 'e', pelvis: P(F, -1, -2), lean: -4, tilt: 8, feet: stance, tool: swing(F, 'hoe', [-7, 20], [-32, 46], { side: 1, near: 0.06, far: 0.3, behind: true }), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -5, -6), lean: 36, tilt: -6, feet: stance, tool: swing(F, 'hoe', [8, -12], [42, -56], { side: -1, near: 0.06, far: 0.3 }), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -6, -9), lean: 46, tilt: -10, feet: stance, tool: swing(F, 'hoe', [8, -22], [36, -56], { side: -1, near: 0.06, far: 0.34 }), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -4, -6), lean: 30, tilt: -4, feet: stance, tool: swing(F, 'hoe', [5, -10], [44, -56], { side: -1, near: 0.06, far: 0.3 }), elbows: { near: 1, far: 1 } },
    ];
  },
  // Splitting rails (item 2): the maul raised overhead, coming down, on the wedge in a log on the ground, back up.
  'split': F => {
    const stance = { near: foot(F, 9), far: foot(F, -10) };
    return [
      { view: 'e', pelvis: P(F, -1, -3), lean: -8, tilt: 10, feet: stance, tool: swing(F, 'maul', [-7, 25], [-20, 53], { near: 0.05, far: 0.24, behind: true }), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 0, -5), lean: 16, feet: stance, tool: swing(F, 'maul', [12, 10], [30, 40], { near: 0.05, far: 0.22 }), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -4, -10), lean: 44, tilt: -10, feet: stance, tool: swing(F, 'maul', [12, -30], [30, -49], { near: 0.05, far: 0.24 }), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -3, -7), lean: 28, tilt: -4, feet: stance, tool: swing(F, 'maul', [10, -18], [32, -35], { near: 0.05, far: 0.24 }), elbows: { near: 1, far: 1 } },
    ];
  },
  // Digging (item 4): the spade driven in with the foot, levered, the earth thrown back over the shoulder, back.
  'dig': F => [
    { view: 'e', pelvis: P(F, 0, 1), lean: 12, feet: { near: foot(F, 12, 8), far: foot(F, -4) }, tool: swing(F, 'spade', [9, -2], [14, -53], { near: 0.02, far: 0.3 }), elbows: { near: 1, far: 1 } },
    { view: 'e', pelvis: P(F, -5, -8), lean: 42, tilt: -8, feet: { near: foot(F, 10), far: foot(F, -10) }, tool: swing(F, 'spade', [2, -26], [22, -56], { near: 0.02, far: 0.45 }), elbows: { near: 1, far: 1 } },
    { view: 'e', pelvis: P(F, -3, -3), lean: 2, tilt: 8, feet: { near: foot(F, 9), far: foot(F, -9) }, tool: swing(F, 'spade', [12, -6], [-22, 24], { side: -1, near: 0.03, far: 0.4, behind: true }), elbows: { near: -1, far: -1 } },
    { view: 'e', pelvis: P(F, -2, -5), lean: 24, tilt: -4, feet: { near: foot(F, 9), far: foot(F, -8) }, tool: swing(F, 'spade', [6, -14], [18, -54], { near: 0.03, far: 0.35 }), elbows: { near: 1, far: 1 } },
  ],
  // Kneeling on one knee (the far knee on the ground), bent over the work in front.
  'kneel': F => [{ view: 'e', pelvis: P(F, -3, -F.B.thigh * 0.85 / g(F)), lean: 24, tilt: -6, feet: { near: foot(F, 10), far: [-F.B.shin * 0.95, F.ankle + 0.5] }, knees: { near: 1, far: 1 }, hands: { near: [16 * g(F), 14 * g(F)], far: [13 * g(F), 16 * g(F)] }, elbows: { near: 1, far: 1 } }],
  // Sitting on a stump or the ground at knee height, forward over the knees, hands on them.
  'sit': F => [{ view: 'e', pelvis: [-3 * g(F), F.B.shin + F.ankle + 1], lean: 10, feet: { near: foot(F, 13), far: foot(F, 11) }, hands: { near: [10 * g(F), F.B.shin + 8 * g(F)], far: [8 * g(F), F.B.shin + 9 * g(F)] }, elbows: { near: 1, far: 1 } }],
  // Carrying a sack on the shoulder, walking: the chest further forward under the load, the near hand up at it.
  'carry': F => POSES.walk(F).map(frame => ({ ...frame, lean: frame.lean + 7, hands: { ...frame.hands, near: at(F, 5, 9) }, elbows: { near: -1 },
    after: (ink, j) => drawSack(ink, add(j.S, [-6 * g(F), 6 * g(F)]), { size: g(F) }) })),
  // Speaking: the forearm up, then the open palm out (two frames, as people-dialogue), the weight on the back foot.
  'speak': F => [
    { view: 'e', pelvis: P(F, -1), lean: -2, feet: { near: foot(F, 4), far: foot(F, -3) }, hands: { near: at(F, 11, -5) }, elbows: { near: -1 }, mouth: 'open' },
    { view: 'e', pelvis: P(F, -1), lean: 1, feet: { near: foot(F, 4), far: foot(F, -3) }, hands: { near: at(F, 16, 1) }, elbows: { near: -1 } },
  ],
  // A long rifle at the shoulder, level (aim), the recoil, lowering (item 7): the feet apart, front knee bent, the chest into it.
  'aim': F => [{ view: 'e', pelvis: P(F, -2, -3), lean: 10, tilt: -6, feet: { near: foot(F, 9), far: foot(F, -10) }, tool: swing(F, 'rifle', [2, 1], [58, 3], { side: -1, near: 0.02, far: 0.3 }), elbows: { near: -1, far: -1 } }],
  'fire': F => [
    { view: 'e', pelvis: P(F, -3, -2), lean: 2, tilt: -2, feet: { near: foot(F, 9), far: foot(F, -10) }, tool: swing(F, 'rifle', [-1, 2], [54, 10], { side: -1, near: 0.02, far: 0.3 }), elbows: { near: -1, far: -1 } },
    { view: 'e', pelvis: P(F, -2, -1), lean: 6, feet: { near: foot(F, 8), far: foot(F, -9) }, tool: swing(F, 'rifle', [0, -14], [50, -30], { side: -1, near: 0.2, far: 0.42 }), elbows: { near: -1, far: 1 } },
  ],
  // Falling (non-graphic): a stumble backward, then lying still on the side. VISION.md §16: nothing of a wound.
  'fall': F => [
    { view: 'e', pelvis: P(F, -3, -9), lean: -30, tilt: 12, feet: { near: foot(F, 9, 4), far: foot(F, -6) }, hands: { near: at(F, -12, -14), far: at(F, 12, -10) } },
    { view: 'e', lying: true, pelvis: P(F), feet: { near: foot(F, 2), far: foot(F, -2) } },
  ],
};

/** Mounted: the rider's pose on the horse's back (the horse is drawn by horse.mjs); astride, the knee forward, hands at the reins. */
export function riderPose(F, seat, { reins = [16, 0], bob = 0 } = {}) {
  const hip = add(seat, [0, bob]);
  return { view: 'e', riding: true, pelvis: hip, lean: 6, feet: { near: add(hip, [7, -F.B.thigh - F.B.shin * 0.95]), far: add(hip, [5, -F.B.thigh - F.B.shin * 0.9]) }, knees: { near: 1, far: 1 },
    hands: { near: add(hip, reins), far: add(hip, add(reins, [-1.5, 1])) }, elbows: { near: 1, far: 1 } };
}
export const POSE_NAMES = Object.keys(POSES);

/** The baby's own poses (it never stands): request 2026-09-26, children at play, babies, item 2. */
export const INFANT_POSES = {
  'lie': () => [{ infant: 'lie' }],
  'sleep': () => [{ infant: 'lie', asleep: true }],
  'sit': () => [{ infant: 'sit' }],
  'cry': () => [{ infant: 'sit', fists: true, mouth: 'open' }, { infant: 'sit', fists: true }],
  'crawl': () => [0, 1, 0, 1].map(step => ({ infant: 'crawl', step })),
};

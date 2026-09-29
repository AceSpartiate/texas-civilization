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
/** A rigid tool held by two hands: `top` and `bottom` are where along the haft the hands are (0 the butt). */
const grip3 = (F, kind, grip, aim, top, bottom) => {
  const ahead = aim[0] > grip[0];
  const side = kind === 'axe' ? (ahead ? 1 : -1) : kind === 'hoe' ? (ahead ? -1 : 1) : 1;
  return { kind, grip: at(F, ...grip), aim: at(F, ...aim), near: top, far: bottom, side, ...(ahead || kind === 'spade' ? {} : { behind: true }) };
};

/**
 * Each swing's timing (milliseconds a frame) and the frame its tool lands on (`beat`, for the chips, the earth and the sound):
 * the wind-up and the strike held, the in-betweens quick, as her hoe cycle's own [240, 120, 220, 220] holds its raised and down
 * frames. Each cycle is 1.2 seconds (her hoe cycle is 0.8). The clips in scripts/claude-art/areas/ take these, and public/work-art.js `STROKES.<stroke>.drawn.beat` must match.
 */
export const SWINGS = Object.freeze({
  chop: { durations: [380, 110, 90, 300, 150, 170], beat: 3 },
  hoe: { durations: [330, 120, 100, 300, 170, 180], beat: 3 },
  split: { durations: [360, 120, 90, 310, 150, 170], beat: 3 },
  dig: { durations: [300, 240, 130, 280, 120, 130], beat: 3 },
});

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
  // The swings (owner, 2026-09-28: "make sure the chop swings look natural"). Each is six frames of one continuous motion with
  // the feet planted: the wind-up held, two in-betweens, the strike held, the recovery rising back toward the wind-up. The tool
  // is rigid (`grip` and `aim`, rig.mjs `rigidTool`): its handle is its own length in every frame and both hands stay on it, the
  // top hand sliding down the handle through the downswing. `twist` turns the chest away in the wind-up and back through the
  // stroke; the weight goes back onto the rear foot and forward onto the front one. SWINGS gives each its timing and beat.
  // Felling with an axe (request 2026-09-28, people at work, item 1): the head in the trunk at hip height, the tree just off
  // the frame's right edge.
  'chop': F => {
    const stance = { near: foot(F, 13), far: foot(F, -12) };
    const axe = (grip, aim, top) => grip3(F, 'axe', grip, aim, top, 0.05);
    return [
      { view: 'e', pelvis: P(F, -6, -5), lean: -14, tilt: 12, twist: 0.9, feet: stance, tool: axe([-8, 16], [-38, 38], 0.45), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -3, -4), lean: -4, tilt: 6, twist: 0.55, feet: stance, tool: axe([-3, 20], [-10, 64], 0.38), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 1, -5), lean: 16, tilt: -2, twist: 0.1, feet: stance, tool: axe([8, 14], [40, 42], 0.25), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 2, -8), lean: 40, tilt: -14, twist: -0.2, feet: stance, tool: axe([16, -26], [70, -26], 0.12), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, 0, -6), lean: 30, tilt: -10, twist: 0, feet: stance, tool: axe([12, -18], [58, -6], 0.2), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -2, -4), lean: 12, tilt: 0, twist: 0.4, feet: stance, tool: axe([2, 4], [12, 46], 0.35), elbows: { near: -1, far: -1 } },
    ];
  },
  // Hoeing, as her own -work: raised behind the head, swinging over, the blade driven into the ground, drawn back, rising.
  'hoe': F => {
    const stance = { near: foot(F, 11), far: foot(F, -11) };
    const hoe = (grip, aim, top) => grip3(F, 'hoe', grip, aim, top, 0.06);
    return [
      { view: 'e', pelvis: P(F, -5, -4), lean: -8, tilt: 10, twist: 0.6, feet: stance, tool: hoe([-6, 16], [-34, 44], 0.35), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -1, -4), lean: 14, twist: 0.2, feet: stance, tool: hoe([6, 10], [30, 46], 0.32), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -3, -6), lean: 30, tilt: -4, feet: stance, tool: hoe([12, -10], [44, -50], 0.3), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -5, -8), lean: 42, tilt: -8, feet: stance, tool: hoe([12, -20], [40, -58], 0.3), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -4, -6), lean: 34, tilt: -6, feet: stance, tool: hoe([8, -14], [30, -58], 0.3), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -2, -3), lean: 10, tilt: 2, twist: 0.3, feet: stance, tool: hoe([2, 6], [-10, 44], 0.33), elbows: { near: -1, far: -1 } },
    ];
  },
  // Splitting rails (item 2): the maul raised overhead, over the top, down, on the wedge in a log on the ground, back up.
  'split': F => {
    const stance = { near: foot(F, 9), far: foot(F, -10) };
    const maul = (grip, aim, top) => grip3(F, 'maul', grip, aim, top, 0.05);
    return [
      { view: 'e', pelvis: P(F, -4, -4), lean: -12, tilt: 12, twist: 0.5, feet: stance, tool: maul([-6, 18], [-28, 54], 0.3), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -1, -3), lean: 0, tilt: 6, twist: 0.2, feet: stance, tool: maul([0, 20], [4, 62], 0.26), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, 0, -6), lean: 20, feet: stance, tool: maul([12, 8], [36, 34], 0.2), elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -3, -10), lean: 44, tilt: -10, feet: stance, tool: maul([12, -28], [30, -49], 0.14), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -3, -8), lean: 34, tilt: -6, feet: stance, tool: maul([10, -20], [30, -36], 0.18), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -2, -4), lean: 12, tilt: 2, twist: 0.3, feet: stance, tool: maul([0, 6], [-8, 44], 0.26), elbows: { near: -1, far: -1 } },
    ];
  },
  // Digging (item 4): the foot on the spade's tread, driving it in, lifting the spadeful, throwing it back over the shoulder,
  // the spade coming back down, set again.
  'dig': F => {
    const near = x => foot(F, 11, x), far = foot(F, -7);
    const spade = (grip, aim, low) => grip3(F, 'spade', grip, aim, low, 0.02);
    return [
      { view: 'e', pelvis: P(F, 1, 1), lean: 12, feet: { near: near(8), far }, tool: spade([9, -2], [13, -62], 0.32), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -4, -8), lean: 42, tilt: -8, feet: { near: near(0), far }, tool: spade([2, -26], [20, -62], 0.45), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -4, -6), lean: 30, tilt: -4, feet: { near: near(0), far }, tool: spade([4, -16], [26, -20], 0.42), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, -2, -3), lean: 4, tilt: 8, twist: 0.6, feet: { near: near(0), far }, tool: { ...spade([6, -6], [-6, 34], 0.4), behind: true }, elbows: { near: -1, far: -1 } },
      { view: 'e', pelvis: P(F, -2, -4), lean: 20, tilt: -2, feet: { near: near(0), far }, tool: spade([6, -12], [16, -62], 0.36), elbows: { near: 1, far: 1 } },
      { view: 'e', pelvis: P(F, 0, 0), lean: 14, feet: { near: near(4), far }, tool: spade([9, -4], [13, -62], 0.33), elbows: { near: 1, far: 1 } },
    ];
  },
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

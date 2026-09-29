// The horse rig: the family's chestnut (as Astra's `horse-chestnut` and the courier's: a chestnut coat, black mane and tail,
// a small white mark on the forehead), side-on facing east, in rig units at the same scale as the person rig, so a rider
// sits on it at their own size. A four-frame walk; legs by two-bone IK from the hip or shoulder to a hoof on the ground.
//
// Scale: the game draws a horse alone at 1.5 of a person (`SIZE.horse` in public/app.js) and her horse frames stand on 0.95
// of their height, so the top of the head is about 140 rig units; the back is about 88. A mounted frame's logical height is
// 1.8 of a person's (`MOUNTED_HEIGHT` in public/motion.js), so rider and horse keep the person's own scale.
import { LINE, PEOPLE, UNIT, tone } from './style.mjs';
import { Ink, add, capsule, blob, ellipse, curve, poly, frameSvg, f2 } from './svg.mjs';
import { ik, drawPerson, frameOf } from './rig.mjs';
import { riderPose } from './poses.mjs';

export const HORSE = Object.freeze({ coat: '#9a5a32', mane: '#2a1c14', hoof: '#3a2a1e', blaze: '#f2e6cc', tack: '#5a3a22', blanket: '#b8342a' });
const U = 14, L = 13; // upper and lower leg lengths

/** Hooves for the walk's four frames: [near fore, far fore, near hind, far hind] x offsets and lifts. */
const WALK = [
  [[34, 0], [20, 4], [-18, 3], [-30, 0]],
  [[28, 3], [26, 0], [-26, 0], [-22, 4]],
  [[22, 4], [34, 0], [-30, 0], [-18, 3]],
  [[26, 0], [28, 3], [-22, 4], [-26, 0]],
];
const STAND = [[28, 0], [24, 0], [-22, 0], [-26, 0]];

export function drawHorse(ink, { frame = null, lean = 0, tack = true, colours = HORSE } = {}) {
  const hooves = frame == null ? STAND : WALK[frame % 4];
  const bob = frame == null ? 0 : [0, 1, 0, 1][frame % 4] * 0.8;
  const shoulder = [24, 72 + bob], hip = [-22, 74 + bob];
  const far = c => tone(c, -0.2);
  const leg = (root, [x, lift], shade, fore) => {
    const foot = [x, 2 + lift];
    const chain = ik(root, foot, U + 4, L + 2, fore ? -1 : 1);
    ink.shape(capsule(chain.joint, chain.end, 2.6, 2.1), shade(colours.coat), { off: 0.6 });
    ink.shape(capsule(root, chain.joint, 5.5, 3.2), shade(colours.coat), { off: 0.8 });
    ink.shape(blob([add(chain.end, [-2.6, 0.5]), add(chain.end, [2.8, 0.5]), add(chain.end, [3.2, -2.6]), add(chain.end, [-2.8, -2.6])], 0.4), colours.hoof, { shade: false, outline: LINE.inner + 1 });
  };
  // Far legs, tail, body, neck and head, near legs.
  leg(add(shoulder, [-2, 0]), hooves[1], far, true);
  leg(add(hip, [2, 0]), hooves[3], far, false);
  ink.shape(blob([[-30, 84 + bob], [-38, 70], [-40, 50], [-35, 44], [-33, 62], [-28, 76 + bob]], 0.8), colours.mane, { off: 0.8 });
  ink.shape(blob([[-32, 76 + bob], [-28, 88 + bob], [0, 91 + bob], [24, 90 + bob], [34, 80 + bob], [30, 64 + bob], [0, 60 + bob], [-24, 62 + bob]], 0.9), colours.coat, { off: 2.2, lift: true });
  const head = [[26, 84 + bob], [34, 108 + bob], [40, 118 + bob], [50, 112 + bob], [58, 96 + bob], [54, 92 + bob], [44, 100 + bob], [38, 88 + bob], [36, 76 + bob]];
  ink.shape(blob(head, 0.8), colours.coat, { off: 1.4, lift: true });
  ink.shape(blob([[36, 116 + bob], [35, 124 + bob], [39, 119 + bob]], 0.5), colours.coat, { shade: false, outline: LINE.inner + 0.6 });
  ink.shape(blob([[24, 90 + bob], [30, 104 + bob], [37, 118 + bob], [34, 110 + bob], [28, 94 + bob]], 0.7), colours.mane, { off: 0.6 });
  ink.dot(ellipse([45.5, 110 + bob], 1.4, 2.6, -30), colours.blaze);
  ink.dot(ellipse([43, 109 + bob], 1.1, 1.3), LINE.ink);
  ink.dot(ellipse([55.5, 95 + bob], 0.9, 0.9), LINE.ink);
  if (tack) {
    ink.line(curve([[40, 110 + bob], [48, 104 + bob], [55, 96 + bob]]), { colour: colours.tack, width: 2.4 });
    ink.shape(blob([[-12, 90 + bob], [-10, 76 + bob], [12, 76 + bob], [14, 90 + bob], [4, 93 + bob]], 0.6), colours.blanket, { off: 0.8 });
    ink.shape(blob([[-8, 94 + bob], [-10, 88 + bob], [10, 88 + bob], [12, 95 + bob], [2, 92 + bob]], 0.6), colours.tack, { off: 0.6 });
  }
  leg(shoulder, hooves[0], c => c, true);
  leg(hip, hooves[2], c => c, false);
  return { seat: [0, 92 + bob], reins: [44, 102 + bob] };
}

/** A mounted frame: the horse walking (frame 0-3) or standing (null) with `figure` in the saddle, reins in hand. */
export function mountedFrame(name, figure, frame = null, { note = 'mounted on the family chestnut, walking east' } = {}) {
  const cell = { w: 480, h: 560 }, groundY = 532;
  const k = UNIT;
  const ink = new Ink(name, k, { yUp: true });
  const { seat, reins } = drawHorse(ink, { frame });
  const F = frameOf(figure);
  const pose = riderPose(F, [seat[0] - 2, seat[1] + 2], { reins: [reins[0] - seat[0] - 26, reins[1] - seat[1] - 6] });
  // The rider's far leg is behind the horse: drawn by the rig before the body, which the horse's body cannot cover once
  // the rider is drawn over it, so it is hidden by leaving the far foot high against the saddle.
  pose.feet.far = add(seat, [2, -6]);
  drawPerson(ink, figure, pose);
  const body = `<g transform="translate(${cell.w / 2} ${groundY}) scale(${f2(k)} ${f2(-k)})">${ink}</g>`;
  return { svg: frameSvg({ name, w: cell.w, h: cell.h, body, defs: ink.defs, note }), w: cell.w, h: cell.h,
    anchorX: 0.5, anchorY: +(groundY / cell.h).toFixed(4), logicalHeight: Math.round(PEOPLE.logicalHeight * 1.8) };
}

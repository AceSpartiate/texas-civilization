// The horse rig: the family's chestnut (as Astra's `horse-chestnut`, `horse-walk` and the mounted cast's horse: a chestnut
// coat, black mane and tail, a small white mark on the forehead), side-on facing east, with a four-frame walk; legs by
// two-bone IK from the shoulder or hip to a hoof on the ground.
//
// Proportions fitted on a grid to her mounted frames as the game draws them (1.8 of a person, `MOUNTED_HEIGHT`), in a
// standing person's rig units: the saddle at ~95 and the withers at ~98, the belly at ~52, the head's poll at ~128 and the
// ears ~136, the body from the rump at -68 to the chest at +62, the muzzle out at ~+122 - a big horse beside a small person,
// as hers is. Her rider sits on it drawn about 1.3 times a standing person's size (`RIDER_SCALE`).
import { LINE, PEOPLE, UNIT, tone } from './style.mjs';
import { Ink, add, capsule, blob, ellipse, curve, frameSvg, f2 } from './svg.mjs';
import { ik, drawPerson, frameOf } from './rig.mjs';
import { riderPose } from './poses.mjs';

export const HORSE = Object.freeze({ coat: '#9a5a32', mane: '#2a1c14', hoof: '#3a2a1e', blaze: '#f2e6cc', tack: '#5a3a22', saddle: '#6a4428', blanket: '#b8342a' });
export const RIDER_SCALE = 1.3;
const U = 26, L = 25; // upper and lower leg lengths

/** Hooves for the walk's four frames: [near fore, far fore, near hind, far hind] x and lift. */
const WALK = [
  [[58, 0], [34, 7], [-34, 6], [-60, 0]],
  [[48, 6], [48, 0], [-52, 0], [-40, 7]],
  [[34, 7], [58, 0], [-60, 0], [-34, 6]],
  [[48, 0], [48, 6], [-40, 7], [-52, 0]],
];
const STAND = [[50, 0], [42, 0], [-44, 0], [-52, 0]];

export function drawHorse(ink, { frame = null, tack = true, colours = HORSE } = {}) {
  const hooves = frame == null ? STAND : WALK[frame % 4];
  const bob = frame == null ? 0 : [0, 1.2, 0, 1.2][frame % 4];
  const y = v => v + bob;
  const shoulder = [44, y(66)], hip = [-46, y(70)];
  const far = c => tone(c, -0.2);
  const leg = (root, [x, lift], shade, fore) => {
    const foot = [x, 3 + lift];
    const chain = ik(root, foot, U, L, fore ? -1 : 1);
    ink.shape(capsule(chain.joint, chain.end, 4.4, 3.4), shade(colours.coat), { off: 0.8 });
    ink.shape(capsule(root, chain.joint, 11, 5.4), shade(colours.coat), { off: 1.4 });
    ink.shape(ellipse(add(chain.end, [0, 4.5]), 4, 3), shade(tone(colours.coat, -0.12)), { shade: false, outline: LINE.inner });
    ink.shape(blob([add(chain.end, [-3.4, 0.5]), add(chain.end, [3.8, 0.5]), add(chain.end, [4.2, -3.2]), add(chain.end, [-3.6, -3.2])], 0.4), colours.hoof, { shade: false, outline: LINE.inner + 1 });
  };
  // Far legs, tail, body, neck and head, near legs.
  leg(add(shoulder, [-4, 0]), hooves[1], far, true);
  leg(add(hip, [4, 0]), hooves[3], far, false);
  ink.shape(blob([[-64, y(94)], [-80, y(78)], [-86, y(52)], [-80, y(36)], [-72, y(46)], [-70, y(70)], [-60, y(86)]], 0.8), colours.mane, { off: 1 });
  ink.shape(blob([[-70, y(84)], [-64, y(97)], [-30, y(97)], [10, y(95)], [38, y(100)], [64, y(90)], [68, y(66)], [48, y(46)], [0, y(42)], [-44, y(46)], [-68, y(64)]], 0.85), colours.coat, { off: 3.4, lift: true });
  const head = [[40, y(92)], [62, y(114)], [88, y(130)], [106, y(128)], [126, y(106)], [124, y(95)], [110, y(94)], [98, y(104)], [78, y(98)], [62, y(76)]];
  ink.shape(blob(head, 0.8), colours.coat, { off: 2, lift: true });
  ink.shape(blob([[92, y(128)], [94, y(138)], [99, y(128)]], 0.5), colours.coat, { shade: false, outline: LINE.inner + 0.6 });
  ink.shape(blob([[36, y(98)], [58, y(116)], [88, y(132)], [80, y(122)], [60, y(104)], [44, y(94)]], 0.7), colours.mane, { off: 0.8 });
  ink.dot(ellipse([104, y(120)], 2, 3.4, -35), colours.blaze);
  ink.dot(ellipse([100, y(117)], 1.6, 1.9), LINE.ink);
  ink.dot(ellipse([119, y(102)], 1.2, 1.2), LINE.ink);
  if (tack) {
    ink.line(curve([[98, y(118)], [110, y(108)], [120, y(101)]]), { colour: colours.tack, width: 2.4 });
    ink.line(curve([[96, y(126)], [100, y(110)], [108, y(100)]]), { colour: colours.tack, width: 2.4 });
    ink.shape(blob([[-22, y(98)], [-24, y(76)], [12, y(76)], [16, y(98)], [0, y(101)]], 0.6), colours.blanket, { off: 1 });
    ink.shape(blob([[-18, y(102)], [-20, y(92)], [10, y(92)], [14, y(104)], [4, y(99)]], 0.6), colours.saddle, { off: 0.8 });
  }
  leg(shoulder, hooves[0], c => c, true);
  leg(hip, hooves[2], c => c, false);
  return { seat: [-4, y(100)], reins: [100, y(110)] };
}

/** A mounted frame: the horse walking (frame 0-3) or standing (null) with `figure` in the saddle, reins in hand. */
export function mountedFrame(name, figure, frame = null, { note = 'mounted on the family chestnut, walking east' } = {}) {
  const cell = { w: 760, h: 560 }, groundY = 532, originX = 330;
  const k = UNIT;
  const ink = new Ink(name, k, { yUp: true });
  const { seat, reins } = drawHorse(ink, { frame });
  // The rider at her mounted frames' size, drawn about the seat.
  const F = frameOf(figure), s = RIDER_SCALE;
  const rider = new Ink(name + '-r', k * s, { yUp: true });
  rider.n = ink.n + 700;
  const local = [seat[0] / s, seat[1] / s];
  const pose = riderPose(F, local, { reins: [(reins[0] - seat[0]) / s - 22, (reins[1] - seat[1]) / s - 4] });
  // The far leg is on the far side of the horse: tucked against the saddle, where the near thigh and the skirt cover it.
  pose.feet.far = add(local, [3, -5]);
  drawPerson(rider, figure, pose);
  ink.defs.push(...rider.defs);
  ink.raw(`<g transform="scale(${s})">${rider}</g>`);
  const body = `<g transform="translate(${originX} ${groundY}) scale(${f2(k)} ${f2(-k)})">${ink}</g>`;
  return { svg: frameSvg({ name, w: cell.w, h: cell.h, body, defs: ink.defs, note }), w: cell.w, h: cell.h,
    anchorX: +(originX / cell.w).toFixed(4), anchorY: +(groundY / cell.h).toFixed(4), logicalHeight: Math.round(PEOPLE.logicalHeight * 1.8) };
}

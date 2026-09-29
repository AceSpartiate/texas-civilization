// Drawing several people in one frame (a mother with a toddler on her hip, two bearers with a litter, a column on the march):
// each person drawn by the rig into its own ink at its own scale and place, then set into the frame's ink.
import { Ink, f2 } from '../kit/svg.mjs';
import { drawPerson, frameOf } from '../kit/rig.mjs';
import { add } from '../kit/svg.mjs';

let serial = 0;
/** Draw `spec` in `pose` into `ink` at `at` (rig units of the frame), scaled by `s`, mirrored if `flip`. Returns its joints in frame units. */
export function nested(ink, spec, pose, at = [0, 0], s = 1, { flip = false, opacity } = {}) {
  const sub = new Ink(`${ink.prefix}-n${serial++}`, ink.k * s, { yUp: true });
  sub.n = ink.n + 1000 + serial * 50;
  const j = drawPerson(sub, spec, pose) || {};
  ink.defs.push(...sub.defs);
  ink.raw(`<g transform="translate(${f2(at[0])} ${f2(at[1])}) scale(${flip ? -s : s} ${s})"${opacity != null ? ` opacity="${opacity}"` : ''}>${sub}</g>`);
  const map = p => p && add(at, [p[0] * s * (flip ? -1 : 1), p[1] * s]);
  return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, Array.isArray(v) && typeof v[0] === 'number' ? map(v) : v]));
}
/** Draw anything into a nested, scaled, moved group. */
export function group(ink, at, s, draw, { flip = false } = {}) {
  const sub = new Ink(`${ink.prefix}-g${serial++}`, ink.k * s, { yUp: true });
  sub.n = ink.n + 1000 + serial * 50;
  draw(sub);
  ink.defs.push(...sub.defs);
  ink.raw(`<g transform="translate(${f2(at[0])} ${f2(at[1])}) scale(${flip ? -s : s} ${s})">${sub}</g>`);
}
export { frameOf };

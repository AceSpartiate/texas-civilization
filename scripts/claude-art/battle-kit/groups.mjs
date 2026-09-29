// Drawing several people in one frame (a mother with a toddler on her hip, two bearers with a litter, a column on the march):
// each person drawn by the rig into its own ink at its own scale and place, then set into the frame's ink.
import { Ink, f2 } from '../kit/svg.mjs';
import { drawPerson, frameOf } from '../kit/rig.mjs';
import { add } from '../kit/svg.mjs';

// Ids are numbered per frame (on the outer ink), so a frame draws the same SVG however many frames were drawn before it.
/** Draw `spec` in `pose` into `ink` at `at` (rig units of the frame), scaled by `s`, mirrored if `flip`. Returns its joints in frame units. */
export function nested(ink, spec, pose, at = [0, 0], s = 1, { flip = false, opacity } = {}) {
  const serial = ink.nestSerial = (ink.nestSerial || 0) + 1;
  const sub = new Ink(`${ink.prefix}-n${serial}`, ink.k * s, { yUp: true });
  sub.n = ink.n + 1000 + serial * 50;
  const j = drawPerson(sub, spec, pose) || {};
  ink.defs.push(...sub.defs);
  ink.raw(`<g transform="translate(${f2(at[0])} ${f2(at[1])}) scale(${flip ? -s : s} ${s})"${opacity != null ? ` opacity="${opacity}"` : ''}>${sub}</g>`);
  const map = p => p && add(at, [p[0] * s * (flip ? -1 : 1), p[1] * s]);
  return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, Array.isArray(v) && typeof v[0] === 'number' ? map(v) : v]));
}
/** Draw anything into a nested, scaled, moved (and turned, degrees counter-clockwise) group, optionally clipped to a rect (units of the group). */
export function group(ink, at, s, draw, { flip = false, rotate = 0, clip = null } = {}) {
  const serial = ink.nestSerial = (ink.nestSerial || 0) + 1;
  const sub = new Ink(`${ink.prefix}-g${serial}`, ink.k * s, { yUp: true });
  sub.n = ink.n + 1000 + serial * 50;
  draw(sub);
  ink.defs.push(...sub.defs);
  let body = `${sub}`;
  if (clip) {
    const id = `${ink.prefix}-clip${serial}`;
    ink.defs.push(`<clipPath id="${id}"><rect x="${f2(clip[0])}" y="${f2(clip[1])}" width="${f2(clip[2])}" height="${f2(clip[3])}"/></clipPath>`);
    body = `<g clip-path="url(#${id})">${body}</g>`;
  }
  ink.raw(`<g transform="translate(${f2(at[0])} ${f2(at[1])}) rotate(${f2(rotate)}) scale(${flip ? -s : s} ${s})">${body}</g>`);
}
export { frameOf };

// Heads, faces, hair, beards and hats for the person rig, per identity, after Astra's own figures (2026-09-28 quality pass,
// read off civilians, people-walk, people-cast2-idle and people-children-idle on a measuring grid):
//   rust        dark curly hair showing under the brim at the side and nape, a full dark beard over jaw and chin
//   elder       grey hair at the sides under the brim, a bushy grey beard
//   ochre       dark hair swept up off the forehead          blue, boy   tousled, spiky on top (boy fair)
//   teal, indigo, rust-woman  dark curly locks to the jaw and a bun at the back (rust-woman's under a cream sunbonnet)
//   blue-girl   centre-parted, one braid down the back        girl        two braids          smallchild  a curly mop
// A head is drawn in head radii (h): R(x, y), x forward (toward the face in the side view), y up from the head's centre.
import { LINE, tone } from './style.mjs';
import { add, sub, mul, norm, blob, curve, ellipse, capsule, poly, deg } from './svg.mjs';

const rot = ([x, y], a) => { const c = Math.cos(deg(a)), s = Math.sin(deg(a)); return [x * c - y * s, x * s + y * c]; };

/** A closed outline with curls: every edge bowed outward (away from the centre) by `amp` of its length. */
export function scallop(points, amp = 0.35) {
  const c = points.reduce((s, p) => add(s, p), [0, 0]).map(v => v / points.length);
  const out = [];
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length], m = mul(add(p, q), 0.5), l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    out.push(p, add(m, mul(norm(sub(m, c)), l * amp)));
  });
  return blob(out, 0.9);
}

const hatted = spec => spec.hat && spec.hat.kind !== 'bonnet';

// ------------------------------------------------------------------ side view
export function drawHeadSide(ink, spec, B, H, N, a, pose) {
  const h = B.head, R = (x, y) => add(H, rot([x * h, y * h], -a));
  const style = spec.hairStyle || 'short', hair = spec.hair;
  // Behind the skull: the hair at the back of the head, a bun, braids.
  if (spec.hat?.kind === 'bonnet') bonnetSide(ink, spec, h, R, 'back');
  if (style === 'bun') {
    ink.shape(scallop([R(-0.1, 1.02), R(-0.95, 0.72), R(-1.12, -0.05), R(-0.95, -0.85), R(-0.55, -1.1), R(-0.2, -0.55), R(0.1, 0.3)], 0.22), hair, { off: 0.8 });
    ink.shape(ellipse(R(-1.08, 0.35), h * 0.42, h * 0.4), tone(hair, 0.05), { off: 0.8 });
  } else if (style === 'curly') {
    ink.shape(scallop([R(-0.35, 0.72), R(-1.05, 0.45), R(-1.18, -0.25), R(-0.85, -0.98), R(-0.3, -0.72), R(-0.05, -0.1)], 0.28), hair, { off: 0.7 });
  } else if (style === 'mop') {
    ink.shape(scallop([R(0.3, 1.12), R(-0.6, 1.05), R(-1.2, 0.4), R(-1.22, -0.45), R(-0.8, -0.95), R(-0.2, -0.5), R(0.4, 0.4)], 0.22), hair, { off: 0.8 });
  } else if (style === 'braid' || style === 'braids') {
    ink.shape(blob([R(0.3, 1.02), R(-0.85, 0.75), R(-1.08, -0.2), R(-0.7, -0.75), R(-0.1, -0.3)], 0.9), hair, { off: 0.7 });
    const top = R(-0.85, -0.45);
    for (let i = 0; i < 4; i++) ink.shape(ellipse(add(top, rot([-0.1 * h * i, -0.5 * h * i], -a)), h * 0.24, h * 0.3), hair, { off: 0.4, outline: LINE.inner + 0.6 });
  } else if (!hatted(spec)) {
    ink.shape(blob([R(0.2, 1.05), R(-0.85, 0.72), R(-1.08, -0.1), R(-0.82, -0.72), R(-0.3, -0.45), R(0, 0.3)], 0.85), hair, { off: 0.7 });
  } else {
    // Under a brim: what shows below it at the back and over the ear.
    ink.shape(scallop([R(-0.3, 0.55), R(-1.05, 0.45), R(-1.1, -0.2), R(-0.75, -0.72), R(-0.3, -0.35)], style === 'curly' ? 0.28 : 0.12), hair, { off: 0.6 });
  }
  // The neck, then the face: a round skull with the chin a little forward, as her side views draw it.
  ink.shape(capsule(add(N, [-0.6, -1]), R(-0.05, -0.75), h * 0.36, h * 0.38), tone(spec.skin, -0.12), { off: 0.5 });
  ink.shape(blob([R(-0.88, 0.35), R(-0.25, 0.97), R(0.62, 0.8), R(0.97, 0.22), R(1.02, -0.18), R(0.92, -0.36), R(0.86, -0.62), R(0.5, -0.95), R(-0.1, -0.95), R(-0.72, -0.5)], 0.9), spec.skin, { off: 0.9, lift: true });
  // Ear, the big dark eye with its light, brow, nose, mouth; a flush on the young.
  ink.shape(ellipse(R(-0.2, -0.05), h * 0.18, h * 0.24), tone(spec.skin, -0.08), { shade: false, outline: LINE.inner });
  ink.dot(ellipse(R(0.58, 0.02), h * 0.13, h * 0.2), LINE.ink);
  ink.dot(ellipse(R(0.54, 0.1), h * 0.045, h * 0.05), '#fff8ea');
  ink.line(curve([R(0.4, 0.33), R(0.6, 0.39), R(0.78, 0.33)]), { width: LINE.inner, colour: tone(hair, -0.2) });
  ink.shape(blob([R(0.94, 0.02), R(1.13, -0.2), R(1.02, -0.3), R(0.88, -0.26)], 0.7), tone(spec.skin, -0.04), { shade: false, outline: LINE.inner });
  if (pose.mouth === 'open') ink.dot(ellipse(R(0.8, -0.52), h * 0.1, h * 0.09), '#5a2a1a');
  else ink.line(curve([R(0.66, -0.5), R(0.8, -0.54), R(0.9, -0.48)]), { width: LINE.inner, colour: tone(spec.skin, -0.45) });
  if (!['adult', 'elder', 'soldier'].includes(spec.age)) ink.dot(ellipse(R(0.52, -0.28), h * 0.16, h * 0.09), '#d9806a', 0.35);
  // Beards: rust's full beard, the elder's bushy one, a soldier's short one; moustaches.
  const beard = spec.beardStyle || (spec.beard ? 'short' : null);
  if (beard) {
    const big = beard === 'bushy' ? 1.18 : beard === 'full' ? 1 : 0.85;
    ink.shape(scallop([R(-0.32, 0.12), R(-0.1, -0.45), R(0.52, -0.62), R(0.98, -0.5), R(0.95 * big, -0.82 * big), R(0.55, -1.12 * big), R(-0.05, -1.02 * big), R(-0.4, -0.55)], beard === 'short' ? 0.06 : 0.14), spec.beard, { off: 0.6 });
    ink.shape(blob([R(0.6, -0.38), R(1.0, -0.36), R(0.98, -0.52), R(0.66, -0.5)], 0.6), spec.beard, { shade: false, outline: LINE.fine });
    ink.line(curve([R(0.72, -0.6), R(0.86, -0.64), R(0.95, -0.58)]), { width: LINE.inner, colour: tone(spec.skin, -0.55) });
  } else if (spec.moustache) ink.shape(blob([R(0.6, -0.36), R(1.0, -0.34), R(0.98, -0.5), R(0.66, -0.48)], 0.6), spec.moustache, { shade: false, outline: LINE.fine });
  // Hair over the skull, per style.
  if (!spec.hat) {
    if (style === 'tousled') ink.shape(blob([R(-1.02, 0.2), R(-0.95, 0.85), R(-0.5, 1.12), R(-0.25, 1.02), R(0.05, 1.24), R(0.35, 1.02), R(0.72, 1.08), R(0.66, 0.78), R(0.98, 0.62), R(0.55, 0.52), R(0.3, 0.66), R(0.05, 0.42), R(-0.4, 0.3), R(-0.65, -0.1)], 0.7), hair, { off: 0.7 });
    else if (style === 'swept') ink.shape(blob([R(-1.02, 0.15), R(-0.85, 0.88), R(-0.2, 1.15), R(0.55, 1.12), R(0.98, 0.78), R(0.82, 0.55), R(0.45, 0.62), R(0.05, 0.5), R(-0.45, 0.3), R(-0.65, -0.1)], 0.8), hair, { off: 0.7 });
    else if (style === 'mop' || style === 'curly') ink.shape(scallop([R(-1.05, 0.2), R(-0.85, 0.95), R(-0.1, 1.15), R(0.6, 1.0), R(0.95, 0.55), R(0.55, 0.45), R(0.1, 0.55), R(-0.5, 0.2)], 0.2), hair, { off: 0.7 });
    else ink.shape(blob([R(-1.03, 0.1), R(-0.9, 0.82), R(-0.2, 1.08), R(0.55, 0.95), R(0.88, 0.55), R(0.55, 0.52), R(0.15, 0.6), R(-0.4, 0.3), R(-0.62, -0.2)], 0.8), hair, { off: 0.7 });
    if (style === 'bun' || style === 'braid' || style === 'braids') ink.line(curve([R(0.62, 0.72), R(0.2, 0.88), R(-0.35, 0.75)]), { width: LINE.fine, colour: tone(hair, 0.35), opacity: 0.7 });
  }
  if (spec.hat?.kind === 'bonnet') bonnetSide(ink, spec, h, R, 'front');
  else if (spec.hat) hatSide(ink, spec, h, R);
}

function bonnetSide(ink, spec, h, R, layer) {
  // Her rust-woman's sunbonnet: a deep round crown over the back of the head, and a wide brim that stands out round the face,
  // seen from the side as a tilted disc well forward of the nose.
  const c = spec.hat.colour;
  if (layer === 'back') {
    ink.shape(blob([R(-1.12, -0.25), R(-1.2, 0.6), R(-0.6, 1.3), R(0.3, 1.32), R(0.5, 0.75), R(-0.45, 0.2), R(-0.8, -0.45)], 0.85), tone(c, -0.06), { off: 1 });
    return;
  }
  ink.shape(ellipse(R(0.3, 0.98), h * 1.18, h * 0.5, -16), c, { off: 1, lift: true });
  ink.line(curve([R(-0.6, 1.08), R(0.3, 0.86), R(1.3, 0.72)]), { width: LINE.inner, opacity: 0.8 });
  ink.shape(capsule(R(0.1, -0.7), R(0.55, -1.1), h * 0.1, h * 0.08), c, { shade: false, outline: LINE.fine });
}

function hatSide(ink, spec, h, R) {
  const hat = spec.hat, c = hat.colour;
  // A hat that draws itself (the battle kit's bicornes, shakos with plumes, forage caps, top hats, sombreros).
  if (hat.draw) return hat.draw(ink, { spec, h, R, view: 'e' });
  if (hat.kind === 'brim' || hat.kind === 'slouch' || hat.kind === 'wide') {
    // Her felt and straw hats: a low round crown with a dark band, a wide brim seen a little from above.
    const wide = hat.kind === 'wide' ? 2.35 : hat.kind === 'slouch' ? 1.75 : 2.1;
    const droop = hat.kind === 'slouch' ? -0.15 : 0;
    ink.shape(blob([R(-wide + 0.1, 0.58 + droop), R(-0.1, 0.9), R(wide, 0.66 + droop), R(wide - 0.15, 0.5 + droop), R(0, 0.46), R(-wide + 0.25, 0.44 + droop)], 0.7), tone(c, 0.04), { off: 0.6 });
    ink.shape(blob([R(-0.78, 0.66), R(-0.72, 1.2), R(-0.1, 1.46), R(0.6, 1.32), R(0.82, 0.7)], 0.8), c, { off: 0.9, lift: true });
    ink.shape(blob([R(-0.8, 0.66), R(0.82, 0.7), R(0.8, 0.9), R(-0.78, 0.88)], 0.6), hat.band, { shade: false, outline: LINE.inner });
    ink.line(curve([R(-wide + 0.3, 0.6 + droop), R(0, 0.66), R(wide - 0.3, 0.62 + droop)]), { width: LINE.fine, opacity: 0.6 });
  } else if (hat.kind === 'shako') {
    ink.shape(poly([R(-0.72, 0.62), R(0.72, 0.6), R(0.86, 1.95), R(-0.82, 1.98)]), c, { off: 0.8 });
    ink.shape(poly([R(-0.84, 1.8), R(0.86, 1.78), R(0.87, 1.98), R(-0.83, 2.0)]), hat.band, { shade: false, outline: LINE.inner });
    ink.shape(poly([R(0.72, 0.6), R(1.28, 0.5), R(1.2, 0.72), R(0.74, 0.76)]), '#1a1a1e', { shade: false, outline: LINE.inner });
    ink.shape(ellipse(R(0.8, 1.2), h * 0.12, h * 0.2), '#c8a040', { shade: false, outline: LINE.fine });
    ink.shape(ellipse(R(0.1, 2.25), h * 0.18, h * 0.3), hat.band, { shade: false, outline: LINE.fine });
  } else if (hat.kind === 'helmet') {
    ink.shape(blob([R(-0.85, 0.5), R(-0.8, 1.2), R(0.1, 1.42), R(0.85, 1.1), R(0.9, 0.5)], 0.8), c, { off: 0.8, lift: true });
    ink.shape(blob([R(-0.9, 1.25), R(-0.2, 1.62), R(0.6, 1.5), R(0.1, 1.3)], 0.8), hat.band, { shade: false, outline: LINE.inner });
    ink.shape(poly([R(0.85, 0.52), R(1.3, 0.45), R(0.9, 0.66)]), '#2a2a2a', { shade: false, outline: LINE.fine });
  }
}

// ------------------------------------------------------------------ toward and away from the camera
export function drawHeadFrontal(ink, spec, B, H, N, back, pose) {
  const h = B.head, R = (x, y) => add(H, [x * h, y * h]);
  const style = spec.hairStyle || 'short', hair = spec.hair;
  if (spec.hat?.kind === 'bonnet') {
    // The brim, a cream disc round the whole face (behind it, from the front).
    if (!back) {
      ink.shape(ellipse(R(0, 0.36), h * 1.62, h * 1.55), spec.hat.colour, { off: 1.1, lift: true });
      ink.shape(ellipse(R(0, 0.28), h * 1.2, h * 1.16), tone(spec.hat.colour, -0.14), { shade: false, outline: LINE.inner });
    }
  }
  // Hair behind the face: curly locks to the jaw, the braids' fall, the mop.
  if (!back) {
    if (style === 'bun') ink.shape(scallop([R(-1.08, 0.5), R(-1.2, -0.35), R(-0.95, -1.0), R(0.95, -1.0), R(1.2, -0.35), R(1.08, 0.5), R(0, 1.0)], 0.12), hair, { off: 0.7 });
    if (style === 'mop' || style === 'curly' && !hatted(spec)) ink.shape(scallop([R(-1.15, 0.5), R(-1.25, -0.4), R(-0.95, -0.85), R(0.95, -0.85), R(1.25, -0.4), R(1.15, 0.5), R(0, 1.05)], 0.16), hair, { off: 0.7 });
    if (hatted(spec)) ink.shape(scallop([R(-1.02, 0.35), R(-1.12, -0.35), R(-0.85, -0.7), R(0.85, -0.7), R(1.12, -0.35), R(1.02, 0.35)], style === 'curly' ? 0.22 : 0.08), hair, { off: 0.6 });
  }
  ink.shape(capsule(add(N, [0, -1]), R(0, -0.8), h * 0.36, h * 0.36), tone(spec.skin, -0.14), { off: 0.4 });
  if (back) {
    // From behind: the hair (or the hat) and a glimpse of the ears.
    for (const s of [-1, 1]) ink.shape(ellipse(R(s * 0.98, -0.1), h * 0.16, h * 0.22), tone(spec.skin, -0.1), { shade: false, outline: LINE.inner });
    ink.shape(style === 'mop' || style === 'curly' || style === 'bun' ? scallop([R(-1.02, 0.1), R(-0.9, 0.85), R(0, 1.08), R(0.9, 0.85), R(1.02, 0.1), R(0.8, -0.72), R(0, -0.9), R(-0.8, -0.72)], 0.14)
      : ellipse(R(0, 0.05), h * 1.0, h * 1.0), hair, { off: 0.9 });
    if (style === 'bun' && spec.hat?.kind !== 'bonnet') ink.shape(ellipse(R(0, 0.05), h * 0.42, h * 0.38), tone(hair, 0.06), { off: 0.6 });
    if (spec.hat?.kind === 'bonnet') { ink.shape(ellipse(R(0, 0.3), h * 1.4, h * 1.35), tone(spec.hat.colour, -0.04), { off: 1.1, lift: true }); ink.shape(ellipse(R(0, 0.25), h * 0.9, h * 0.85), spec.hat.colour, { off: 0.8 }); }
    if (style === 'braid') for (let i = 0; i < 4; i++) ink.shape(ellipse(R(0, -0.9 - i * 0.5), h * 0.24, h * 0.3), hair, { off: 0.4, outline: LINE.inner + 0.6 });
  } else {
    for (const s of [-1, 1]) ink.shape(ellipse(R(s * 0.97, -0.08), h * 0.17, h * 0.23), tone(spec.skin, -0.08), { shade: false, outline: LINE.inner });
    ink.shape(blob([R(-0.95, 0.25), R(-0.6, 0.96), R(0.6, 0.96), R(0.95, 0.25), R(0.85, -0.5), R(0.4, -0.95), R(-0.4, -0.95), R(-0.85, -0.5)], 0.9), spec.skin, { off: 0.9, lift: true });
    for (const s of [-1, 1]) {
      // Her eyes are big dark ovals, set wide, a little below the middle of the head.
      ink.dot(ellipse(R(s * 0.38, -0.02), h * 0.14, h * 0.2), LINE.ink);
      ink.dot(ellipse(R(s * 0.38 - 0.04, 0.06), h * 0.05, h * 0.05), '#fff8ea');
      ink.line(curve([R(s * 0.2, 0.3), R(s * 0.38, 0.37), R(s * 0.56, 0.3)]), { width: LINE.inner, colour: tone(hair, -0.2) });
    }
    ink.line(curve([R(-0.04, -0.14), R(0.07, -0.28), R(-0.06, -0.32)]), { width: LINE.fine, colour: tone(spec.skin, -0.4) });
    if (pose.mouth === 'open') ink.dot(ellipse(R(0, -0.56), h * 0.13, h * 0.1), '#5a2a1a');
    else ink.line(curve([R(-0.22, -0.52), R(0, -0.62), R(0.22, -0.52)]), { width: LINE.inner, colour: tone(spec.skin, -0.45) });
    if (!['adult', 'elder', 'soldier'].includes(spec.age)) for (const s of [-1, 1]) ink.dot(ellipse(R(s * 0.58, -0.3), h * 0.15, h * 0.09), '#d9806a', 0.35);
    const beard = spec.beardStyle || (spec.beard ? 'short' : null);
    if (beard) {
      const big = beard === 'bushy' ? 1.15 : beard === 'full' ? 1 : 0.88;
      ink.shape(scallop([R(-0.95, 0.05), R(-0.85 * big, -0.75), R(-0.4, -1.1 * big), R(0.4, -1.1 * big), R(0.85 * big, -0.75), R(0.95, 0.05), R(0.62, -0.42), R(0, -0.7), R(-0.62, -0.42)], beard === 'short' ? 0.05 : 0.12), spec.beard, { off: 0.6 });
      ink.shape(blob([R(-0.4, -0.4), R(0, -0.33), R(0.4, -0.4), R(0.22, -0.52), R(-0.22, -0.52)], 0.6), spec.beard, { shade: false, outline: LINE.fine });
      ink.line(curve([R(-0.16, -0.62), R(0, -0.68), R(0.16, -0.62)]), { width: LINE.inner, colour: tone(spec.skin, -0.55) });
    } else if (spec.moustache) ink.shape(blob([R(-0.38, -0.38), R(0, -0.32), R(0.38, -0.38), R(0.2, -0.48), R(-0.2, -0.48)], 0.6), spec.moustache, { shade: false, outline: LINE.fine });
    // The hair over the forehead.
    if (!spec.hat) {
      const cap = style === 'tousled' ? [R(-1.05, -0.05), R(-1.08, 0.6), R(-0.6, 1.1), R(-0.15, 1.2), R(0.45, 1.15), R(1.05, 0.62), R(1.02, -0.05), R(0.8, 0.35), R(0.45, 0.48), R(0.2, 0.3), R(-0.1, 0.5), R(-0.5, 0.4), R(-0.8, 0.3)]
        : style === 'swept' ? [R(-1.03, -0.05), R(-1.0, 0.7), R(-0.2, 1.16), R(0.7, 1.08), R(1.03, 0.55), R(1.02, -0.05), R(0.7, 0.5), R(-0.1, 0.62), R(-0.75, 0.42)]
          : [R(-1.03, -0.05), R(-1.02, 0.62), R(0, 1.08), R(1.02, 0.62), R(1.03, -0.05), R(0.75, 0.45), R(0.06, 0.6), R(0, 0.5), R(-0.06, 0.6), R(-0.75, 0.45)];
      ink.shape(style === 'mop' || style === 'curly' ? scallop(cap, 0.12) : blob(cap, 0.85), hair, { off: 0.6 });
      if (style === 'bun') ink.shape(ellipse(R(0, 1.02), h * 0.32, h * 0.2), hair, { off: 0.4 });
      if (style === 'braid') ink.shape(capsule(R(0.8, -0.35), R(0.95, -2.3), h * 0.22, h * 0.16), hair, { off: 0.4 });
      if (style === 'braids') for (const s of [-1, 1]) ink.shape(capsule(R(s * 0.88, -0.3), R(s * 1.02, -2.0), h * 0.2, h * 0.14), hair, { off: 0.4 });
    }
  }
  if (spec.hat && spec.hat.kind !== 'bonnet') hatFrontal(ink, spec, h, R, back);
  if (spec.hat?.kind === 'bonnet' && !back) ink.line(curve([R(-1.1, 0.8), R(0, 1.55), R(1.1, 0.8)]), { width: LINE.inner, opacity: 0.6 });
  if (spec.hat?.kind === 'bonnet' && !back) for (const s of [-1, 1]) ink.shape(capsule(R(s * 0.5, -0.85), R(s * 0.15, -1.25), h * 0.09, h * 0.07), spec.hat.colour, { shade: false, outline: LINE.fine });
}

function hatFrontal(ink, spec, h, R, back) {
  const hat = spec.hat, c = hat.colour;
  if (hat.draw) return hat.draw(ink, { spec, h, R, view: back ? 'n' : 's', back });
  if (hat.kind === 'brim' || hat.kind === 'slouch' || hat.kind === 'wide') {
    const wide = hat.kind === 'wide' ? 2.4 : hat.kind === 'slouch' ? 1.8 : 2.15;
    ink.shape(ellipse(R(0, 0.66), h * wide, h * 0.46, 0), tone(c, 0.04), { off: 0.8 });
    ink.shape(blob([R(-0.8, 0.7), R(-0.74, 1.3), R(0, 1.5), R(0.74, 1.3), R(0.8, 0.7), R(0, 0.62)], 0.8), c, { off: 0.9, lift: true });
    ink.shape(blob([R(-0.82, 0.7), R(0, 0.62), R(0.82, 0.7), R(0.81, 0.92), R(0, 0.84), R(-0.81, 0.92)], 0.6), hat.band, { shade: false, outline: LINE.inner });
    if (!back) ink.line(curve([R(-wide + 0.25, 0.52), R(0, 0.3), R(wide - 0.25, 0.52)]), { width: LINE.fine, opacity: 0.55 });
  } else if (hat.kind === 'shako') {
    ink.shape(poly([R(-0.78, 0.55), R(0.78, 0.55), R(0.9, 1.95), R(-0.9, 1.95)]), c, { off: 0.8 });
    ink.shape(poly([R(-0.9, 1.78), R(0.9, 1.78), R(0.92, 1.98), R(-0.92, 1.98)]), hat.band, { shade: false, outline: LINE.inner });
    ink.shape(ellipse(R(0, 2.25), h * 0.18, h * 0.3), hat.band, { shade: false, outline: LINE.fine });
    if (!back) {
      ink.shape(ellipse(R(0, 0.55), h * 0.85, h * 0.14), '#1a1a1e', { shade: false, outline: LINE.inner });
      ink.shape(ellipse(R(0, 1.2), h * 0.25, h * 0.3), '#c8a040', { shade: false, outline: LINE.fine });
    }
  } else if (hat.kind === 'helmet') {
    ink.shape(blob([R(-0.92, 0.45), R(-0.85, 1.2), R(0, 1.45), R(0.85, 1.2), R(0.92, 0.45)], 0.8), c, { off: 0.8, lift: true });
    ink.shape(capsule(R(0, 1.2), R(0, 1.72), h * 0.2, h * 0.14), hat.band, { shade: false, outline: LINE.inner });
  }
}

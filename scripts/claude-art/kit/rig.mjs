// The person rig: one parametric figure per identity, posed by its joints, so the same face, hair, clothes and colours
// are drawn in every pose and every sheet (docs/ART_STYLE.md: "preserve the same face, hair, clothing, and colors across
// every pose and sheet").
//
// A figure is drawn in rig units: y up, the ground at 0, a grown figure 100 from the ground to the top of the hat, +x
// forward. Three views: 'e' (side-on facing screen-right; west is the game's mirror of it), 's' (toward the camera) and
// 'n' (away). A pose says where the pelvis is, how the body leans, where the feet stand and where the hands go (or which tool
// they hold and where); the knees and elbows are solved by two-bone IK, so a foot stays planted and a hand stays on its haft.
//
// ceiling: a 2D puppet of capsules and blobs with a flat shade, not a painting: at play size (a figure about 40 px) it reads
// as the same person by silhouette and colour, closer up it is plainly a different hand from Astra's. The way out is her
// sheet of the same name, which wins in the loader.
import { BUILD, CAST, LINE, PALETTE, PEOPLE, UNIT, tone } from './style.mjs';
import { Ink, add, sub, mul, norm, perp, lerp, len, capsule, blob, curve, poly, ellipse, up, down, deg, frameSvg, f2 } from './svg.mjs';
import { drawTool, TOOLS } from './props.mjs';
import { drawHeadSide, drawHeadFrontal } from './head.mjs';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Two-bone IK: the middle joint for a chain root -> target of lengths l1, l2, bent to the left of root->target when bend > 0. */
export function ik(root, target, l1, l2, bend = 1) {
  const d = sub(target, root), dist = clamp(len(d), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const dir = norm(d), a = Math.acos(clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1));
  const c = Math.cos(a * Math.sign(bend)), s = Math.sin(a * Math.sign(bend));
  const joint = add(root, mul([dir[0] * c - dir[1] * s, dir[0] * s + dir[1] * c], l1));
  const end = add(root, mul(dir, dist));
  return { joint, end };
}

/** The standing skeleton's heights for an identity. */
export function frameOf(figure) {
  const spec = typeof figure === 'string' ? CAST[figure] : figure;
  const B = BUILD[spec.age] || BUILD.adult;
  const ankle = 3.2, hip = ankle + B.shin + B.thigh;
  return { spec, B, ankle, hip, neck: hip + B.torso, headC: hip + B.torso + B.neck + B.head * 0.95 };
}

/**
 * Draw `figure` in `pose` into `ink` (rig units). Returns the joints, for a caller that needs a hand or the head.
 * pose: { view, pelvis:[x,y], lean, tilt, feet:{near,far}, hands:{near,far}, tool:{kind,butt,tip,side,near,far}, mouth,
 *         arms:{near,far} (elbow bend), lying, sit, headTurn:'s' }
 */
export function drawPerson(ink, figure, pose = {}) {
  const F = frameOf(figure), { spec, B } = F;
  const view = pose.view || 'e';
  if (pose.lying) {
    // Lying still on the ground (a fall's end, or asleep): the standing side view laid over, head to the west, drawn as one
    // group turned a quarter about the feet and set down so the body rests on the ground line.
    const flat = new Ink(ink.prefix + 'l', ink.k, { yUp: true });
    flat.n = ink.n + 500;
    drawSide(flat, F, { ...pose, lying: false, pelvis: [0, F.hip], lean: 0, tilt: 0, feet: { near: [2, F.ankle], far: [-1, F.ankle] } });
    ink.defs.push(...flat.defs);
    ink.raw(`<g transform="translate(${f2(F.hip * 0.55)} ${f2(B.limb * 1.25)}) rotate(90)">${flat}</g>`);
    return {};
  }
  if (spec.age === 'infant') return drawInfant(ink, F, pose);
  if (view === 's' || view === 'n') return drawFrontal(ink, F, pose, view);
  return drawSide(ink, F, pose);
}

function skinOf(spec) { return spec.skin; }
const sleeveOf = spec => spec.coat || spec.shirt;
const rolled = spec => !spec.coat; // every civilian in the cast has sleeves rolled or short to the elbow

function drawSide(ink, F, pose) {
  const { spec, B } = F;
  const P = pose.pelvis || [0, F.hip];
  const lean = pose.lean || 0, tilt = pose.tilt || 0;
  const t = up(lean), fwd = [Math.cos(deg(lean)), -Math.sin(deg(lean))];
  const N = add(P, mul(t, B.torso));
  const H = add(N, mul(up(lean + tilt), B.neck + B.head * 0.95));
  const S = add(add(N, mul(t, -3)), mul(fwd, 0.5));
  const feet = pose.feet || { near: [3, F.ankle], far: [-3, F.ankle] };
  const skirt = spec.lower.kind !== 'trousers';
  const arm = B.upperArm + B.forearm;
  // Hands: on a tool if there is one, else where the pose says, else hanging.
  let hands = pose.hands || {};
  if (pose.tool) {
    const { butt, tip } = pose.tool;
    hands = { near: lerp(butt, tip, pose.tool.near ?? 0.12), far: lerp(butt, tip, pose.tool.far ?? 0.4), ...pose.hands };
  }
  const hang = (dx) => add(S, [dx, -arm * 0.92]);
  const handNear = hands.near || hang(1.5), handFar = hands.far || hang(-1);
  const shoulderFar = add(S, mul(fwd, -1.2)), hipNear = add(P, mul(fwd, 0.8)), hipFar = add(P, mul(fwd, -0.8));
  const bend = pose.elbows || {};
  const armFar = ik(shoulderFar, handFar, B.upperArm, B.forearm, bend.far ?? -1);
  const armNear = ik(S, handNear, B.upperArm, B.forearm, bend.near ?? -1);
  const legFar = ik(hipFar, feet.far, B.thigh, B.shin, pose.knees?.far ?? 1);
  const legNear = ik(hipNear, feet.near, B.thigh, B.shin, pose.knees?.near ?? 1);
  const far = c => tone(c, -0.18);
  const joints = { P, N, H, S, handNear: armNear.end, handFar: armFar.end, feet };

  // Back to front: a tool held behind the body, the far arm, the far leg, the torso and skirt, the near leg, the head, the
  // near arm, a tool in front.
  if (pose.tool && pose.tool.behind) drawTool(ink, pose.tool.kind, pose.tool.butt, pose.tool.tip, { side: pose.tool.side ?? 1 });
  drawArm(ink, spec, B, shoulderFar, armFar, far, true);
  drawLeg(ink, spec, B, hipFar, legFar, feet.far, far, skirt);
  if (skirt) drawSkirtSide(ink, spec, B, P, t, fwd, feet, legNear, legFar, true, pose);
  drawLeg(ink, spec, B, hipNear, legNear, feet.near, c => c, skirt);
  drawTorsoSide(ink, spec, B, P, N, t, fwd, lean);
  if (skirt) drawSkirtSide(ink, spec, B, P, t, fwd, feet, legNear, legFar, false, pose);
  // Arms raised in front of the face pass beside the head, as in her three-quarter work frames, not across it: then the
  // near arm and its tool are drawn before the head. Raised behind the head, they are drawn over its back as usual.
  const raised = armNear.end[1] > S[1] + B.head * 0.6 && armNear.end[0] > H[0] - B.head * 0.4;
  const nearArm = () => {
    if (pose.tool && !pose.tool.behind && !pose.tool.front) drawTool(ink, pose.tool.kind, pose.tool.butt, pose.tool.tip, { side: pose.tool.side ?? 1 });
    drawArm(ink, spec, B, S, armNear, c => c, false);
  };
  if (raised) nearArm();
  drawHeadSide(ink, spec, B, H, N, lean + tilt, pose);
  if (!raised) nearArm();
  if (pose.tool && pose.tool.front) drawTool(ink, pose.tool.kind, pose.tool.butt, pose.tool.tip, { side: pose.tool.side ?? 1 });
  if (pose.after) pose.after(ink, joints);
  return joints;
}

function drawArm(ink, spec, B, S, chain, shade, isFar) {
  const r = B.limb * 0.5;
  const sleeve = shade(sleeveOf(spec));
  const E = chain.joint, W = chain.end;
  const forearm = rolled(spec) ? shade(skinOf(spec)) : sleeve;
  ink.shape(capsule(E, W, r * 0.8, r * 0.7), forearm, { off: 0.6 });
  ink.shape(capsule(S, E, r * 1.05, r * 0.9), sleeve, { off: 0.7 });
  if (rolled(spec)) ink.shape(ellipse(E, r * 1.0, r * 0.75, Math.atan2(E[1] - S[1], E[0] - S[0]) * 180 / Math.PI), sleeve, { shade: false, outline: LINE.inner + 0.8 });
  ink.shape(ellipse(W, r * (B.hand ?? 0.85), r * (B.hand ?? 0.85) * 0.94), shade(skinOf(spec)), { off: 0.4 });
}

function drawLeg(ink, spec, B, hip, chain, foot, shade, skirt) {
  const r = B.limb * 0.5, K = chain.joint, A = chain.end;
  const trouser = shade(spec.lower.colour);
  const bare = !spec.feet;
  const boot = shade(spec.feet || skinOf(spec));
  if (!skirt) {
    ink.shape(capsule(K, A, r * 0.95, r * 0.82), spec.lower.rolled ? shade(skinOf(spec)) : trouser, { off: 0.7 });
    ink.shape(capsule(hip, K, r * 1.25, r * 1.0), trouser, { off: 0.8 });
    if (spec.lower.rolled) ink.shape(capsule(lerp(K, A, 0.12), lerp(K, A, 0.42), r * 1.1, r * 1.05), trouser, { shade: false, outline: LINE.inner + 1 });
  } else ink.shape(capsule(lerp(K, A, 0.3), A, r * 0.75, r * 0.7), bare ? boot : tone(spec.lower.colour, -0.3), { off: 0.5 });
  // The foot: a boot or a bare foot, flat on the ground (or toe down when lifted).
  const lift = A[1] - 3.2, toeDrop = clamp(lift * 0.35, 0, 3);
  const heel = add(A, [-B.foot * 0.3, -2.8]), toe = add(A, [B.foot * 0.85, -2.8 - toeDrop]);
  const pts = [add(heel, [0, 0.2]), add(A, [-B.foot * 0.3, 2.5]), add(A, [B.foot * 0.35, 1.6]), add(toe, [0.5, 1.5]), toe, add(heel, [B.foot * 0.3, -0.4])];
  if (!skirt && !bare) ink.shape(capsule(lerp(A, add(A, [0, 5]), 0.1), add(A, [0, 5.5]), r * 0.95, r * 0.95), boot, { off: 0.5 });
  ink.shape(blob(pts, 0.7), boot, { off: 0.5 });
}

function drawTorsoSide(ink, spec, B, P, N, t, fwd, lean) {
  const k = B.depth / 6.5, at = (u, v) => add(add(P, mul(fwd, u * k)), mul(t, v));
  const T = B.torso;
  const back = [at(-6.5, -1), at(-6.8, T * 0.35), at(-6.2, T * 0.72), at(-5, T * 0.97)];
  const front = [at(5, T * 0.97), at(6.8, T * 0.7), at(6.6, T * 0.35), at(6.4, -1)];
  const body = [...back, at(0, T * 1.05), ...front, at(0, -2.2)];
  ink.shape(blob(body, 0.8), sleeveOf(spec), { off: 1.3 });
  if (spec.coat && spec.facings) {
    ink.shape(poly([at(3.5, T * 0.95), at(6.6, T * 0.9), at(6.8, T * 0.55), at(4.5, T * 0.55)]), spec.facings, { shade: false, outline: LINE.inner });
  }
  if (spec.waistcoat) ink.shape(blob([at(-5.6, T * 0.1), at(-6.2, T * 0.7), at(-3, T * 0.95), at(3.6, T * 0.92), at(6.6, T * 0.6), at(6.8, T * 0.05), at(0, -0.5)], 0.7), spec.waistcoat, { off: 1 });
  if (spec.crossbelt) ink.line(`M ${pp(at(-5, T * 0.95))} L ${pp(at(6, T * 0.15))}`, { colour: spec.crossbelt, width: 5 });
  if (spec.braces) ink.shape(capsule(at(-4.8, T * 0.95), at(-2.6, T * 0.05), 0.9, 0.9), spec.braces, { shade: false, outline: LINE.fine });
  if (spec.belt || spec.sash) ink.shape(capsule(at(-6.4, T * 0.1), at(6.4, T * 0.1), 1.6, 1.6), spec.sash || spec.belt, { shade: false, outline: LINE.inner });
  if (spec.kerchief) ink.shape(poly([at(-1, T * 1.04), at(6.8, T * 0.98), at(6, T * 0.62)]), spec.kerchief, { shade: false, outline: LINE.inner });
  if (spec.bow) ink.shape(ellipse(at(5.4, T * 0.9), 2, 1.4), spec.bow, { shade: false, outline: LINE.inner });
}

function drawSkirtSide(ink, spec, B, P, t, fwd, feet, legNear, legFar, back, pose = {}) {
  const k = B.depth / 6.5, at = (u, v) => add(add(P, mul(fwd, u * k)), mul(t, v));
  // Her skirts start high - at about half the torso above the hip (teal's and rust-woman's apron strings at ~51 of 100) - and
  // stand out in a wide bell to a hem just above the shoes; a small child's gown hangs from the chest.
  const top = spec.lower.kind === 'gown' ? B.torso * 0.72 : B.torso * 0.5;
  const knees = [legNear.joint, legFar.joint];
  const seated = pose.riding || Math.max(...knees.map(K => K[1])) > P[1] - B.thigh * 0.45;
  const spread = (spec.lower.short ? 15 : 21) * (B.hipW / 22);
  const xs = [feet.near[0], feet.far[0], ...knees.map(K => K[0])];
  let hem = spec.lower.short ? 12 : spec.lower.kind === 'gown' ? 7 : 5.5;
  let front = Math.max(Math.max(...xs) + 8, P[0] + spread), rear = Math.min(Math.min(...xs) - 8, P[0] - spread - 2);
  const K = knees[0][0] > knees[1][0] ? knees[0] : knees[1];
  if (seated) {
    // Over the thighs to the knee and hanging from there: on a horse, down its side to about the stirrup.
    const foot = Math.min(feet.near[1], feet.far[1]);
    hem = pose.riding ? foot + 9 : Math.max(K[1] - B.shin * 0.7, 2);
    front = K[0] + 7; rear = P[0] - B.depth * 1.15;
  }
  const mid = (rear + front) / 2;
  if (back) {
    ink.shape(blob([at(-6.2, top), [rear - 1, hem + 2], [mid, hem - 0.5], at(0, top - 1)], 0.7), tone(spec.lower.colour, -0.25), { off: 1 });
    return;
  }
  const pts = seated
    ? [at(-6.4, top), [rear, P[1] - 3], [rear + 3, hem + 2], [mid, hem - 1], [front, hem + 1], [front + 1, K[1] + 3], at(6.8, top)]
    : [at(-6.6, top), [rear + 4, (P[1] + hem) / 2], [rear, hem + 1], [mid, hem - 1.6], [front, hem + 0.5], [front - 4, (P[1] + hem) / 2], at(6.8, top), at(0, top + 1)];
  ink.shape(blob(pts, 0.75), spec.lower.colour, { off: 1.8, lift: true });
  ink.line(curve([[rear + 5, hem + 1], [mid - 4, (P[1] + hem) / 2], at(-1.5, top)], 1), { width: LINE.fine, opacity: 0.55 });
  ink.line(curve([[mid + 5, hem], [mid + 2, (P[1] + hem) / 2], at(3, top)], 1), { width: LINE.fine, opacity: 0.45 });
  if (spec.apron) {
    const ap = seated ? [at(1.5, top), at(7, top), [front - 1, hem + 3], [front - 8, hem + 2]]
      : [at(1.5, top), at(7, top), [front - 2, hem + 6], [front - 5, hem + 3], [mid + 3, hem + 4.5]];
    ink.shape(blob(ap, 0.6), spec.apron, { off: 1 });
    ink.line(curve([at(-6, top - 0.5), at(2, top - 1)]), { width: LINE.inner, colour: tone(spec.apron, -0.2) });
  }
}


// ---------------------------------------------------------------------------------------------------------------------
// The baby: swaddled and lying, sitting up, or crawling (pose.infant: 'lie' | 'sit' | 'crawl'; `step` 0/1 for the crawl), drawn
// at twice a child's scale so that, like Astra's `infant` row, it fills its cell and the renderer shrinks it (45% of a person).
function drawInfant(ink, F, pose) {
  const { spec } = F, k = 2.2, at = (x, y) => [x * k, y * k], h = 7 * k;
  const wrap = spec.shirt, skin = spec.skin;
  const head = (c, facing = 1, asleep = false) => {
    ink.shape(ellipse(c, h, h * 0.96), skin, { off: 1.2, lift: true });
    ink.shape(blob([add(c, [-h * 0.95, h * 0.1]), add(c, [-h * 0.6, h * 0.85]), add(c, [h * 0.3, h * 1.0]), add(c, [h * 0.8, h * 0.55]), add(c, [h * 0.2, h * 0.5]), add(c, [-h * 0.5, h * 0.2])], 0.8), spec.hair, { off: 0.6 });
    if (asleep) ink.line(curve([add(c, [h * 0.3 * facing, 0]), add(c, [h * 0.5 * facing, -h * 0.08]), add(c, [h * 0.7 * facing, 0])]), { width: LINE.inner });
    else ink.dot(ellipse(add(c, [h * 0.5 * facing, 0]), h * 0.12, h * 0.16), LINE.ink);
    ink.dot(ellipse(add(c, [h * 0.35 * facing, -h * 0.35]), h * 0.16, h * 0.1), '#d9806a', 0.4);
    if (pose.mouth === 'open') ink.dot(ellipse(add(c, [h * 0.72 * facing, -h * 0.45]), h * 0.14, h * 0.12), '#5a2a1a');
  };
  if (pose.infant === 'sit') {
    ink.shape(ellipse(at(0, 7), 11 * k, 7 * k), wrap, { off: 1.6, lift: true });
    ink.shape(blob([at(-7, 8), at(-6, 20), at(0, 24), at(6, 20), at(7, 8)], 0.8), wrap, { off: 1.4 });
    for (const s of [-1, 1]) ink.shape(capsule(at(s * 6, 20), at(s * 9 + (pose.fists ? 0 : 2), pose.fists ? 25 : 13), 2.4 * k, 2.1 * k), wrap, { off: 0.6 });
    for (const s of [-1, 1]) ink.shape(ellipse(at(s * 9 + (pose.fists ? 0 : 2), pose.fists ? 26 : 12), 2.2 * k, 2.1 * k), skin, { off: 0.4 });
    head(at(0.5, 31.5));
    return {};
  }
  if (pose.infant === 'crawl') {
    const s = pose.step ? 1 : -1;
    ink.shape(capsule(at(-9, 4), at(-13 + s, 1.5), 3 * k, 2.6 * k), tone(wrap, -0.12), { off: 0.6 });
    ink.shape(capsule(at(6, 12), at(8 - s * 1.5, 1.5), 2.4 * k, 2.1 * k), tone(wrap, -0.12), { off: 0.6 });
    ink.shape(blob([at(-12, 6), at(-10, 13), at(0, 15), at(8, 14), at(9, 9), at(0, 6)], 0.8), wrap, { off: 1.6, lift: true });
    ink.shape(capsule(at(-7, 5), at(-11 - s, 1.5), 3 * k, 2.6 * k), wrap, { off: 0.6 });
    ink.shape(capsule(at(5, 11), at(7 + s * 1.5, 1.5), 2.4 * k, 2.1 * k), wrap, { off: 0.6 });
    ink.shape(ellipse(at(7.5 + s * 1.5, 1.8), 2.2 * k, 1.8 * k), skin, { off: 0.4 });
    head(at(14, 16));
    return {};
  }
  // Lying swaddled: the wrap from the feet to the chin, the face turned to us.
  ink.shape(blob([at(-16, 4), at(-15, 11), at(0, 13), at(9, 12), at(10, 3), at(0, 1)], 0.8), wrap, { off: 1.6, lift: true });
  ink.line(curve([at(-10, 3), at(-8, 8), at(-6, 12)]), { width: LINE.fine, opacity: 0.6 });
  ink.line(curve([at(-3, 2), at(-1, 8), at(1, 12.5)]), { width: LINE.fine, opacity: 0.6 });
  head(at(14, 8), 1, pose.asleep);
  ink.shape(blob([at(8, 3), at(9, 13), at(12, 16), at(11, 5)], 0.6), wrap, { shade: false, outline: LINE.inner });
  return {};
}

// ---------------------------------------------------------------------------------------------------------------------
// Toward and away from the camera.
function drawFrontal(ink, F, pose, view) {
  const { spec, B } = F, back = view === 'n';
  const P = pose.pelvis || [0, F.hip];
  const N = add(P, [0, B.torso]), H = add(N, [0, B.neck + B.head * 0.95]);
  const hw = B.hipW * 0.5 * B.body, sw = B.shoulderW * 0.5 * B.body;
  const step = pose.step || 0; // -1 left leg forward, +1 right leg forward (screen left/right), 0 standing
  const skirt = spec.lower.kind !== 'trousers';
  const arm = B.upperArm + B.forearm;
  const legs = [-1, 1].map(side => {
    const fwd = side === step ? 1 : side === -step ? -1 : 0;
    // A leg stepping toward the camera is drawn a little lower and longer; the other lifts its heel.
    const hip = add(P, [side * hw * 0.55, 0]);
    const foot = [side * hw * 0.62, F.ankle + (back ? -fwd : fwd) * -1.4 + (fwd < 0 ? 2.2 : 0)];
    return { side, hip, foot, chain: ik(hip, foot, B.thigh, B.shin, side * 0.001) };
  });
  const swing = pose.step ? 1 : 0;
  const hands = pose.hands || {};
  const arms = [-1, 1].map(side => {
    const S = add(N, [side * sw * 0.92, -3]);
    const target = hands[side < 0 ? 'left' : 'right'] || add(S, [side * 2.4, -arm * 0.9 + (swing && side === step ? 1.6 : 0)]);
    return { side, S, chain: ik(S, target, B.upperArm, B.forearm, side) };
  });
  const joints = { P, N, H };
  for (const leg of legs) drawLegFrontal(ink, spec, B, leg, skirt);
  drawTorsoFrontal(ink, spec, B, P, N, hw, sw, back);
  if (skirt) drawSkirtFrontal(ink, spec, B, P, hw, legs, back);
  for (const a of arms) drawArmFrontal(ink, spec, B, a);
  drawHeadFrontal(ink, spec, B, H, N, back, pose);
  if (pose.after) pose.after(ink, joints);
  return joints;
}
function drawLegFrontal(ink, spec, B, leg, skirt) {
  const r = B.limb * 0.5, K = leg.chain.joint, A = leg.chain.end;
  const bare = !spec.feet, boot = spec.feet || spec.skin;
  if (!skirt) {
    ink.shape(capsule(K, A, r * 1.0, r * 0.88), spec.lower.rolled ? spec.skin : spec.lower.colour, { off: 0.6 });
    ink.shape(capsule(leg.hip, K, r * 1.3, r * 1.05), spec.lower.colour, { off: 0.8 });
    if (spec.lower.rolled) ink.shape(capsule(lerp(K, A, 0.1), lerp(K, A, 0.38), r * 1.12, r * 1.1), spec.lower.colour, { shade: false, outline: LINE.inner + 1 });
    if (!bare) ink.shape(capsule(add(A, [0, 0]), add(A, [0, 5]), r * 1.0, r * 1.0), boot, { off: 0.5 });
  } else ink.shape(capsule(add(A, [0, 5]), A, r * 0.75, r * 0.72), bare ? boot : tone(spec.lower.colour, -0.3), { off: 0.4 });
  ink.shape(ellipse(add(A, [leg.side * 0.4, -1.2]), B.foot * 0.42, 2.6), boot, { off: 0.5 });
}
function drawSkirtFrontal(ink, spec, B, P, hw, legs, back) {
  const top = spec.lower.kind === 'gown' ? B.torso * 0.72 : B.torso * 0.5;
  const hem = spec.lower.short ? 12 : spec.lower.kind === 'gown' ? 7 : 5.5;
  const wide = hw * 2.15 + 3;
  const pts = [add(P, [-hw * 0.95, top]), [P[0] - wide * 0.8, (P[1] + hem) / 2], [P[0] - wide, hem + 2], [P[0] - wide + 1, hem - 0.5], [P[0], hem - 1.8], [P[0] + wide - 1, hem - 0.5], [P[0] + wide, hem + 2], [P[0] + wide * 0.8, (P[1] + hem) / 2], add(P, [hw * 0.95, top]), add(P, [0, top + 1])];
  ink.shape(blob(pts, 0.7), spec.lower.colour, { off: 1.6, lift: true });
  for (const s of [-1, 1]) ink.line(curve([[P[0] + s * wide * 0.5, hem + 1], [P[0] + s * wide * 0.3, P[1] + top * 0.4]]), { width: LINE.fine, opacity: 0.55 });
  if (spec.apron && !back) {
    ink.shape(blob([add(P, [-hw * 0.85, top]), [P[0] - wide * 0.66, hem + 5], [P[0] + wide * 0.66, hem + 5], add(P, [hw * 0.85, top])], 0.3), spec.apron, { off: 1.2 });
    ink.shape(capsule(add(P, [-hw * 0.95, top]), add(P, [hw * 0.95, top]), 1.1, 1.1), spec.apron, { shade: false, outline: LINE.inner });
  }
  if (spec.apron && back) {
    ink.shape(ellipse(add(P, [-2.6, top]), 2.6, 1.7, 20), spec.apron, { shade: false, outline: LINE.inner });
    ink.shape(ellipse(add(P, [2.6, top]), 2.6, 1.7, -20), spec.apron, { shade: false, outline: LINE.inner });
    for (const s of [-1, 1]) ink.shape(capsule(add(P, [s * 1.2, top - 1]), add(P, [s * 2.4, top - 9]), 0.9, 0.7), spec.apron, { shade: false, outline: LINE.fine });
  }
}

function drawTorsoFrontal(ink, spec, B, P, N, hw, sw, back) {
  const T = B.torso;
  const at = (x, v) => add(P, [x, v]);
  const body = [at(-hw * 1.1, -1.5), at(-hw * 1.2, T * 0.45), at(-sw * 1.02, T * 0.86), at(-sw * 0.6, T * 1.02), at(0, T * 1.06), at(sw * 0.6, T * 1.02), at(sw * 1.02, T * 0.86), at(hw * 1.2, T * 0.45), at(hw * 1.1, -1.5), at(0, -2.5)];
  ink.shape(blob(body, 0.8), sleeveOf(spec), { off: 1.3 });
  if (spec.waistcoat) {
    if (back) ink.shape(blob([at(-hw * 1.1, 0), at(-sw * 0.95, T * 0.85), at(sw * 0.95, T * 0.85), at(hw * 1.1, 0)], 0.4), spec.waistcoat, { off: 1 });
    else for (const s of [-1, 1]) ink.shape(blob([at(s * hw * 1.12, -0.5), at(s * sw * 0.98, T * 0.84), at(s * sw * 0.45, T * 0.98), at(s * 1.2, T * 0.45), at(s * 1.2, -1.5)], 0.4), spec.waistcoat, { off: 0.8 });
  }
  if (spec.coat && spec.facings && !back) ink.shape(poly([at(-2, T * 1.0), at(2, T * 1.0), at(2.2, T * 0.3), at(-2.2, T * 0.3)]), spec.facings, { shade: false, outline: LINE.inner });
  if (spec.crossbelt) ink.line(`M ${pp(at(-sw * 0.8, T * 0.95))} L ${pp(at(hw * 1.05, T * 0.1))}`, { colour: spec.crossbelt, width: 5 });
  if (spec.braces) for (const s of spec.oneBrace ? [-1] : [-1, 1]) ink.shape(capsule(at(s * sw * 0.55, T * 1.0), at(s * hw * 0.6, 0.5), 0.9, 0.9), spec.braces, { shade: false, outline: LINE.fine });
  if (spec.belt || spec.sash) ink.shape(capsule(at(-hw * 1.12, 1), at(hw * 1.12, 1), 1.6, 1.6), spec.sash || spec.belt, { shade: false, outline: LINE.inner });
  if (spec.kerchief && !back) ink.shape(poly([at(-sw * 0.7, T * 1.02), at(sw * 0.7, T * 1.02), at(0, T * 0.58)]), spec.kerchief, { shade: false, outline: LINE.inner });
  if (spec.bow && !back) {
    ink.shape(ellipse(at(-1.8, T * 0.9), 1.8, 1.2), spec.bow, { shade: false, outline: LINE.fine });
    ink.shape(ellipse(at(1.8, T * 0.9), 1.8, 1.2), spec.bow, { shade: false, outline: LINE.fine });
  }
}
function drawArmFrontal(ink, spec, B, a) {
  const r = B.limb * 0.5, E = a.chain.joint, W = a.chain.end;
  const sleeve = sleeveOf(spec);
  ink.shape(capsule(E, W, r * 0.82, r * 0.72), rolled(spec) ? spec.skin : sleeve, { off: 0.5 });
  ink.shape(capsule(a.S, E, r * 1.1, r * 0.92), sleeve, { off: 0.6 });
  if (rolled(spec)) ink.shape(ellipse(E, r * 1.05, r * 0.7), sleeve, { shade: false, outline: LINE.inner + 0.8 });
  ink.shape(ellipse(W, r * (B.hand ?? 0.85), r * (B.hand ?? 0.85) * 0.94), spec.skin, { off: 0.4 });
}
// ---------------------------------------------------------------------------------------------------------------------
function rot([x, y], a) { const c = Math.cos(deg(a)), s = Math.sin(deg(a)); return [x * c - y * s, x * s + y * c]; }
function pp(p) { return `${f2(p[0])} ${f2(p[1])}`; }

/**
 * One people frame as an SVG document: the figure drawn by `draw(ink)` in rig units, with the ground at PEOPLE.groundY of a
 * PEOPLE.cell and the figure's own x=0 at `originX` (the middle of the cell unless a pose sets it). Returns the SVG and
 * the manifest numbers: anchor at the ground under x=0, and the logical height that makes it the same size as Astra's.
 */
export function personFrame(name, draw, { note = '', originX = PEOPLE.cell.w / 2, cell = PEOPLE.cell, groundY = PEOPLE.groundY, scale = 1 } = {}) {
  const k = UNIT * scale;
  const ink = new Ink(name, k, { yUp: true });
  draw(ink);
  const body = `<g transform="translate(${originX} ${groundY}) scale(${f2(k)} ${f2(-k)})">${ink}</g>`;
  return {
    svg: frameSvg({ name, w: cell.w, h: cell.h, body, defs: ink.defs, note }),
    w: cell.w, h: cell.h, anchorX: +(originX / cell.w).toFixed(4), anchorY: +(groundY / cell.h).toFixed(4), logicalHeight: PEOPLE.logicalHeight,
  };
}

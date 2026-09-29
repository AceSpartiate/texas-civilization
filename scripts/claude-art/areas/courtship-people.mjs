// The lone parent's wedding (request 2026-09-29 — the lone parent's wedding, items 1 and 2): four gentle poses for each of
// the eight grown cast figures, and the commissioner reading the bond. Drawn for public/courtship.js, whose scenes are
// painted over the whole screen at about 960 by 540 - a person 150 to 190 px tall, larger than the map ever draws one - so
// every pose is made to read at that size as well as at play size.
//   `<cast>-greet`  a hand raised in greeting; the two men in brimmed hats (rust, elder) touch the brim with a small bow
//                   instead and then lift the hand from it (2 frames)
//   `<cast>-shy`    the head bowed, the hands clasped in front, the weight on one foot and the other toe turned in, a flush
//                   on the cheek and the eyes lowered; then a glance up with a small smile (2 frames) - shy and not sad: the
//                   chest stays up, the mouth smiles, nothing slumps
//   `<cast>-laugh`  the head tipped back, the eyes closed in a laugh, the mouth open, a hand to the chest; then the head
//                   forward in a chuckle, the hand to the chest (the men) or to the mouth (the women) (2 frames)
//   `<cast>-vow`    standing, leaning a little toward the partner, both hands held forward at the waist: two figures facing
//                   each other with their anchors `VOW_SPACING` of the drawn height apart (one mirrored) have their hands
//                   meet between them (1 frame)
//   `elder-read-paper`  the elder figure as the commissioner in a dark coat, a paper held open in both hands and read from
//                   (2 frames); an invented local officer (FIC-GONZ-950), not a portrait of anybody
// Middle-school classroom (the request): nothing but shy glances, a compliment, a laugh and joined hands.
//
// Drawn from the person rig (scripts/claude-art/kit/rig.mjs), so each figure keeps the face, hair, clothes and colours of
// Astra's own sheets (and the game's appearance recolouring finds her colours in them); the faces' expressions - lowered or
// laughing eyes, the flush, the laughing mouth, the open hand - are drawn over the rig's head in `after`, in the head's own
// frame. Temporary: her clip of the same name replaces each.
import { personFrame, drawPerson, frameOf, ik } from '../kit/rig.mjs';
import { CAST, LINE, tone } from '../kit/style.mjs';
import { add, sub, mul, norm, deg, ellipse, blob, curve, capsule, poly, f2 } from '../kit/svg.mjs';

export const AREA = 'work';
export const DATE = '2026-09-29';
export const FIGURES = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl'];
const REQUEST = 'Request 2026-09-29 — the lone parent\'s wedding';
/** Rasterised at 0.7 of the drawn cell (280 px cells, logical height 210): about one to one at the scenes' 150-190 px. */
const SCALE = 0.7;
/**
 * Where the joined hands are, in rig units forward of the figure's anchor (x = 0), and the spacing of two facing figures'
 * anchors that puts them together, as a share of the height the page draws a person at (the logical height): the figure is
 * 100 rig units from the ground to the top of the hat, which is 0.945 of the logical height.
 */
export const VOW_REACH = 26;
export const VOW_SPACING = +((2 * VOW_REACH / 100) * 0.945).toFixed(3);

const g = F => F.hip / 39;
const P = (F, dx = 0, dy = 0) => [dx * g(F), F.hip + dy * g(F)];
const foot = (F, x, lift = 0) => [x * g(F), F.ankle + lift * g(F)];
/** A point relative to the standing figure's shoulder height. */
const at = (F, x, y) => [x * g(F), F.neck - 3 + y * g(F)];
const women = new Set(['teal', 'rust-woman', 'indigo', 'blue-girl']);
const brimmed = figure => ['brim', 'slouch', 'wide'].includes(CAST[figure]?.hat?.kind);

// ------------------------------------------------------------------------------------------------ the face, drawn over
/** The head's own frame, as kit/head.mjs draws it: R(x, y) in head radii from its centre, turned with the lean and tilt. */
function headFrame(F, joints, pose) {
  const a = (pose.lean || 0) + (pose.tilt || 0), h = F.B.head, H = joints.H;
  const c = Math.cos(deg(-a)), s = Math.sin(deg(-a));
  return { h, R: (x, y) => add(H, [x * h * c - y * h * s, x * h * s + y * h * c]) };
}
/** The eye painted out with the face's skin, so another eye can be drawn in its place. */
function clearEye(ink, spec, { R, h }) { ink.dot(ellipse(R(0.58, 0.03), h * 0.19, h * 0.26), spec.skin); }
/** Eyes closed in a laugh: an arch, the cheek pushed up under it. */
function laughingEye(ink, spec, head) {
  const { R } = head;
  clearEye(ink, spec, head);
  ink.line(curve([R(0.44, -0.04), R(0.58, 0.1), R(0.73, -0.02)]), { width: LINE.inner + 0.6 });
  ink.line(curve([R(0.46, -0.2), R(0.6, -0.16), R(0.72, -0.2)]), { width: LINE.fine, colour: tone(spec.skin, -0.3), opacity: 0.7 });
}
/** Eyes lowered: the lid come down over a smaller eye looking at the ground, a lash at the corner. */
function loweredEye(ink, spec, head) {
  const { R, h } = head;
  clearEye(ink, spec, head);
  ink.dot(ellipse(R(0.6, -0.07), h * 0.11, h * 0.11), LINE.ink);
  ink.line(curve([R(0.43, 0.02), R(0.58, 0.05), R(0.75, -0.02)]), { width: LINE.inner + 0.7 });
  ink.line(curve([R(0.73, -0.01), R(0.8, -0.06)]), { width: LINE.fine });
}
/** The warm flush on the cheek (the rig gives it only to the young; here to everybody). */
function flush(ink, spec, { R, h }, strength = 0.5) { ink.dot(ellipse(R(0.5, -0.3), h * 0.2, h * 0.11), '#d9705a', strength); }
/** A small closed smile, turned up at the back. */
function smile(ink, spec, { R, h }, beard) {
  const y = beard ? -0.62 : -0.5;
  if (!beard) ink.dot(ellipse(R(0.79, y - 0.02), h * 0.17, h * 0.09), spec.skin);
  ink.line(curve([R(0.64, y + 0.05), R(0.78, y - 0.05), R(0.92, y)]), { width: LINE.inner, colour: tone(spec.skin, -0.5) });
}
/** The mouth open in a laugh: a dark half-moon, over the beard where there is one. */
function laughingMouth(ink, spec, { R, h }, beard, open = 1) {
  const y = beard ? -0.62 : -0.54;
  ink.shape(blob([R(0.66, y + 0.04), R(0.95, y + 0.05), R(0.9, y - 0.14 * open), R(0.76, y - 0.2 * open)], 0.9), '#5a2418', { shade: false, outline: LINE.fine });
  ink.dot(ellipse(R(0.8, y - 0.1 * open), h * 0.07, h * 0.04), '#b0503c');
}
/** An open hand, fingers together and the thumb out, laid over the rig's round hand: pointing at `angle` degrees (0 = east, 90 = up). */
function openHand(ink, spec, F, W, angle, { thumb = 1 } = {}) {
  const k = g(F) * 0.95, c = Math.cos(deg(angle)), s = Math.sin(deg(angle));
  const L = (u, v) => add(W, [(u * c - v * s) * k, (u * s + v * c) * k]);
  ink.shape(capsule(L(0.6, -1.3 * thumb), L(2.5, -3.3 * thumb), 0.95 * k, 0.8 * k), spec.skin, { off: 0.3, outline: LINE.inner + 0.4 });
  ink.shape(blob([L(-1.8, -2.1), L(2.6, -2.0), L(5.4, -1.0), L(5.9, 0.2), L(5.2, 1.3), L(2.6, 2.0), L(-1.8, 2.1)], 0.85), spec.skin, { off: 0.4, outline: LINE.inner + 0.6 });
  ink.line(curve([L(2.9, -0.55), L(5.0, -0.45)]), { width: LINE.fine, colour: tone(spec.skin, -0.35), opacity: 0.8 });
  ink.line(curve([L(2.9, 0.6), L(4.9, 0.55)]), { width: LINE.fine, colour: tone(spec.skin, -0.35), opacity: 0.8 });
}
const beardOf = spec => Boolean(spec.beardStyle || spec.beard);
/**
 * The near arm drawn again over the head, as the rig draws it: a hand raised to the hat's brim is in front of the face, but
 * the rig puts a raised near arm behind the head (right for a tool swung overhead, wrong for a hat touched), which hid it.
 */
function nearArmOver(ink, F, j) {
  const { spec, B } = F, r = B.limb * 0.5, sleeve = spec.coat || spec.shirt;
  const E = ik(j.S, j.handNear, B.upperArm, B.forearm, -1).joint, W = j.handNear;
  ink.shape(capsule(E, W, r * 0.8, r * 0.7), spec.coat || spec.longSleeves ? sleeve : spec.skin, { off: 0.6 });
  ink.shape(capsule(j.S, E, r * 1.05, r * 0.9), sleeve, { off: 0.7 });
  if (!spec.coat && !spec.longSleeves) ink.shape(ellipse(E, r, r * 0.75, Math.atan2(E[1] - j.S[1], E[0] - j.S[0]) * 180 / Math.PI), sleeve, { shade: false, outline: LINE.inner + 0.8 });
  ink.shape(ellipse(W, r * (B.hand ?? 0.85), r * (B.hand ?? 0.85) * 0.94), spec.skin, { off: 0.4 });
}

// ------------------------------------------------------------------------------------------------------------ poses
/** Each pose's frames for one figure: pose objects for the rig, with the face drawn over in `after`. */
export const COURT = {
  greet: (figure) => {
    const F = frameOf(figure), spec = F.spec, beard = beardOf(spec);
    const stance = { near: foot(F, 4), far: foot(F, -3.5) };
    if (brimmed(figure)) {
      // Two fingers to the brim with a small bow and a nod; then the hand lifted off it and out a little, upright, smiling.
      const f1 = { view: 'e', pelvis: P(F, -1, -0.4), lean: 12, tilt: -12, feet: stance, hands: { near: [20 * g(F), 79 * g(F)], far: at(F, 2, -24) }, elbows: { near: -1, far: -1 } };
      const f2 = { view: 'e', pelvis: P(F, -0.5), lean: 2, tilt: 2, mouth: 'open', feet: stance, hands: { near: at(F, 18, 17), far: at(F, 2, -24) }, elbows: { near: -1, far: -1 } };
      f1.after = (ink, j) => { const head = headFrame(F, j, f1); smile(ink, spec, head, beard); nearArmOver(ink, F, j); openHand(ink, spec, F, j.handNear, 96); };
      f2.after = (ink, j) => { const head = headFrame(F, j, f2); if (beard) laughingMouth(ink, spec, head, beard, 0.6); openHand(ink, spec, F, j.handNear, 70); };
      return [f1, f2];
    }
    // A hand raised in greeting, open, beside and forward of the face; then waved out a little, the head tipped to it.
    const f1 = { view: 'e', pelvis: P(F, -0.5), lean: 1, tilt: 3, mouth: 'open', feet: stance, hands: { near: at(F, 17, 19), far: at(F, 2, -24) }, elbows: { near: -1, far: -1 } };
    const f2 = { view: 'e', pelvis: P(F, -0.5), lean: 2, tilt: 6, feet: stance, hands: { near: at(F, 20, 17), far: at(F, 2, -24) }, elbows: { near: -1, far: -1 } };
    f1.after = (ink, j) => { openHand(ink, spec, F, j.handNear, 84); };
    f2.after = (ink, j) => { const head = headFrame(F, j, f2); smile(ink, spec, head, beard); openHand(ink, spec, F, j.handNear, 62); };
    return [f1, f2];
  },
  shy: (figure) => {
    const F = frameOf(figure), spec = F.spec, beard = beardOf(spec);
    // The weight on the far foot, the near toe turned in and resting on its point; the hands clasped low in front.
    const feet = { near: foot(F, 5, 1.8), far: foot(F, -1.5) };
    const hands = i => ({ near: at(F, 8.5, i ? -19.5 : -21), far: at(F, 7.5, i ? -18.5 : -20) });
    const f1 = { view: 'e', pelvis: P(F, -1, -0.3), lean: -1, tilt: -15, feet, knees: { near: 1, far: 1 }, hands: hands(0), elbows: { near: -1, far: -1 } };
    const f2 = { view: 'e', pelvis: P(F, -1, -0.3), lean: 0, tilt: -4, feet, knees: { near: 1, far: 1 }, hands: hands(1), elbows: { near: -1, far: -1 } };
    f1.after = (ink, j) => { const head = headFrame(F, j, f1); loweredEye(ink, spec, head); flush(ink, spec, head, 0.55); smile(ink, spec, head, beard); };
    f2.after = (ink, j) => { const head = headFrame(F, j, f2); flush(ink, spec, head, 0.45); smile(ink, spec, head, beard); };
    return [f1, f2];
  },
  laugh: (figure) => {
    const F = frameOf(figure), spec = F.spec, beard = beardOf(spec), woman = women.has(figure);
    const stance = { near: foot(F, 4.5), far: foot(F, -3.5) };
    // The head tipped back, the eyes shut in a laugh, the near hand to the chest; then forward in a chuckle.
    const f1 = { view: 'e', pelvis: P(F, 0.5, -0.2), lean: -6, tilt: 14, feet: stance, hands: { near: at(F, 8, -9), far: at(F, 5, -18) }, elbows: { near: -1, far: -1 } };
    const f2 = woman
      ? { view: 'e', pelvis: P(F, 0, -0.4), lean: 5, tilt: 2, feet: stance, hands: { near: at(F, 13.5, 11), far: at(F, 7, -17) }, elbows: { near: -1, far: -1 } }
      : { view: 'e', pelvis: P(F, 0, -0.6), lean: 6, tilt: 0, feet: stance, hands: { near: at(F, 10, -13), far: at(F, 5, -18) }, elbows: { near: -1, far: -1 } };
    f1.after = (ink, j) => { const head = headFrame(F, j, f1); laughingEye(ink, spec, head); laughingMouth(ink, spec, head, beard, 1); flush(ink, spec, head, 0.35); };
    f2.after = (ink, j) => {
      const head = headFrame(F, j, f2);
      laughingEye(ink, spec, head); flush(ink, spec, head, 0.35);
      if (woman) openHand(ink, spec, F, j.handNear, 118, { thumb: -1 });
      else laughingMouth(ink, spec, head, beard, 0.7);
    };
    return [f1, f2];
  },
  vow: (figure) => {
    const F = frameOf(figure), spec = F.spec, beard = beardOf(spec);
    // Leaning a little toward the partner, both hands held forward at the waist where the partner's hands meet them.
    // Upright enough that a brimmed hat clears the partner's face; the arms near their length, the elbows soft.
    const f1 = { view: 'e', pelvis: P(F, 1.5), lean: 5, tilt: 3, feet: { near: foot(F, 6), far: foot(F, -1.5) }, hands: { near: [VOW_REACH, 46], far: [VOW_REACH - 1.6, 47.3] }, elbows: { near: 1, far: 1 } };
    f1.after = (ink, j) => { const head = headFrame(F, j, f1); smile(ink, spec, head, beard); flush(ink, spec, head, 0.3); };
    return [f1];
  },
};
export const COURT_TIMING = { greet: [560, 460], shy: [620, 540], laugh: [420, 460], vow: [1200] };
const WHAT = {
  greet: [
    f => brimmed(f) ? 'two fingers touched to the hat\'s brim with a small bow and a nod, a quiet smile' : 'a hand raised open beside the face in greeting, the mouth open to say good morning',
    f => brimmed(f) ? 'the hand lifted from the brim and out a little in greeting, upright again, speaking' : 'the raised hand waved out a little, the head tipped toward it, smiling',
  ],
  shy: [
    () => 'shy: the head bowed and the eyes lowered, a flush on the cheek and a small smile, the hands clasped low in front, the weight on one foot and the other toe turned in on its point - bashful, not sad: the chest up, nothing slumped',
    () => 'a shy glance up with a small smile, the flush still on the cheek, the hands still clasped in front',
  ],
  laugh: [
    () => 'laughing: the head tipped back, the eyes closed in a laugh, the mouth open, the near hand to the chest',
    f => women.has(f) ? 'the laugh settling to a chuckle: the head forward, the eyes still creased, a hand raised to the mouth' : 'the laugh settling to a chuckle: the head and shoulders forward, the eyes still creased, the hand at the chest',
  ],
  vow: [() => `the vow: standing and leaning a little toward the partner, both hands held forward at the waist as if holding the partner's hands, a quiet smile; two facing figures ${VOW_SPACING} of the drawn height apart, one mirrored, have their hands meet`],
};
/** Her pose each is judged beside at play size. */
const speakOf = figure => ['rust', 'teal', 'elder', 'blue'].includes(figure) ? `${figure}-speak-e-1` : `${figure}-speak-1`;
const NEAR = { greet: speakOf, shy: f => `${f}-idle-e`, laugh: speakOf, vow: f => `${f}-trade-1` };

export const SHEETS = Object.fromEntries(Object.keys(COURT).map(pose => [`claude-courtship-${pose}`, {
  cell: { w: 400, h: 400 }, scale: SCALE, columns: COURT_TIMING[pose].length, request: REQUEST,
  replaceWith: `item 1: \`-${pose}\`, ${COURT_TIMING[pose].length} frame${COURT_TIMING[pose].length > 1 ? 's' : ''}, east-facing and mirrored for west, the cast figure's own logical height and foot baseline`,
  frames: FIGURES.flatMap(figure => COURT[pose](figure).map((p, i) => ({
    name: `${figure}-${pose}-${i + 1}`, compare: [[`${figure}-idle-e`, 1], [NEAR[pose](figure), 1]],
    prompt: `${figure}, ${pose === 'vow' ? 'at the wedding' : 'meeting the neighbours'}, frame ${i + 1} of ${COURT_TIMING[pose].length}: ${WHAT[pose][i](figure)}. Side on, facing east. The same person, face, hat, hair, clothes and colours as Astra's ${figure} sheets; Texas 1835 frontier clothes; gentle and classroom-appropriate; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow, no text.`,
    draw: () => personFrame(`${figure}-${pose}-${i + 1}`, ink => drawPerson(ink, figure, p), { note: `${figure} ${pose}, frame ${i + 1}: ${WHAT[pose][i](figure)}` }),
  }))),
}]));

// ------------------------------------------------------------------------------------------------ the commissioner
/** The elder as the commissioner: his own face, hair and beard, in a dark frock coat over the olive waistcoat, a white stock. */
const COMMISSIONER = { ...CAST.elder, coat: '#3d3429', kerchief: '#efe4cc', longSleeves: true };
/**
 * The paper, held up open in both hands in front of the chest and tipped back toward his eyes: its back to us (plain, so
 * nothing written shows), folded once, a red ribbon and seal at its foot. Drawn over the near arm, then his hands on its edges.
 */
function paper(ink, F, j, lowered) {
  const dy = lowered ? -4 : 0, tip = lowered ? 1.5 : 0;
  const ft = [12.2 + tip, 58.5 + dy], nt = [20.8 + tip, 56 + dy], nb = [22.2, 39.5 + dy], fb = [13.2, 42 + dy];
  const mid = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // The far half a shade darker: the sheet bowed a little along its fold, as a held page is.
  ink.shape(blob([ft, mid(ft, nt), nt, mid(nt, nb, 0.5), nb, mid(nb, fb), fb, mid(fb, ft)], 0.35), '#f3e6c8', { off: 0.9, lift: true });
  ink.shape(blob([ft, mid(ft, nt, 0.48), mid(fb, nb, 0.48), fb, mid(fb, ft)], 0.3), '#e2cfa6', { shade: false, outline: 0, opacity: 0.8 });
  ink.line(curve([mid(ft, nt, 0.48), mid(mid(ft, nt, 0.48), mid(fb, nb, 0.48), 0.5), mid(fb, nb, 0.48)]), { width: LINE.fine, colour: '#a88a5a', opacity: 0.85 });
  // The page's top edge curling toward him.
  ink.line(curve([add(ft, [0.4, -0.9]), mid(ft, nt), add(nt, [-0.3, -0.8])]), { width: LINE.fine, colour: '#c2a678', opacity: 0.8 });
  // Ribbon and seal at the foot.
  const seal = mid(fb, nb, 0.3);
  ink.shape(poly([add(seal, [-0.6, 0]), add(seal, [0.6, 0]), add(seal, [1.2, -4.2]), add(seal, [0.3, -3.2]), add(seal, [-0.4, -4.4])]), '#8a2a22', { shade: false, outline: LINE.fine });
  ink.shape(ellipse(seal, 1.5, 1.4), '#b03a2c', { shade: false, outline: LINE.fine });
  // His hands on the edges: the far fingers round the far edge, the near hand at the near edge.
  const r = F.B.limb * 0.5 * (F.B.hand ?? 0.85);
  ink.shape(ellipse(add(mid(ft, fb, 0.55), [-0.4, 0]), r * 0.85, r * 0.75), tone(F.spec.skin, -0.12), { off: 0.3 });
  ink.shape(ellipse(j.handNear, r, r * 0.94), F.spec.skin, { off: 0.4 });
}
const READ = [
  { lowered: false, tilt: -10, mouth: false, what: 'reading down the page: the head bowed to the paper held open in both hands at the chest' },
  { lowered: true, tilt: 2, mouth: 'open', what: 'reading aloud: the paper lowered a little, the head raised toward the couple, the mouth open on the words' },
];
function readPose(i) {
  const F = frameOf(COMMISSIONER), k = g(F), r = READ[i];
  const dy = r.lowered ? -4 : 0;
  const pose = { view: 'e', pelvis: P(F, -0.5), lean: 2, tilt: r.tilt, mouth: r.mouth || undefined, feet: { near: foot(F, 4), far: foot(F, -3.5) },
    hands: { near: [21.6 * k, 47.5 + dy], far: [12.8 * k, 50 + dy] }, elbows: { near: -1, far: -1 } };
  pose.after = (ink, j) => paper(ink, F, j, r.lowered);
  return { F, pose };
}
SHEETS['claude-courtship-commissioner'] = {
  cell: { w: 400, h: 400 }, scale: SCALE, columns: 2, request: REQUEST,
  replaceWith: 'item 2: `elder-read-paper`, 2 frames, east-facing and mirrored for west, the elder\'s own logical height and foot baseline',
  frames: READ.map((r, i) => ({
    name: `elder-read-paper-${i + 1}`, compare: [['elder-idle-e', 1], ['elder-speak-e-1', 1]],
    prompt: `The commissioner who reads the bond at a frontier wedding by bond (an invented local officer, FIC-GONZ-950, not a portrait of anybody), drawn as Astra's elder figure - the same grey hair, bushy grey beard, face and brimmed hat - in a dark brown frock coat over his olive waistcoat and a white stock, standing side on facing east, frame ${i + 1} of 2: ${r.what}. The paper's back is to us, plain, with a red ribbon and seal at its corner; nothing written shows. Warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow, no text.`,
    draw: () => { const { pose } = readPose(i); return personFrame(`elder-read-paper-${i + 1}`, ink => drawPerson(ink, COMMISSIONER, pose), { note: `the commissioner reading the bond, frame ${i + 1}: ${r.what}` }); },
  })),
};

// ------------------------------------------------------------------------------------------------ the fiddler
// Item 7 (priority 3): `rust-fiddle` and `ochre-fiddle`, a neighbour standing and playing at the wedding supper, side on
// facing east. The fiddle is under the chin on the far (left) shoulder, its neck running forward and a little down to the
// far hand; the bow in the near hand crosses the strings by the bridge, drawn out (frame 1) and pushed in (frame 2), and the
// near foot taps the time on frame 2. The head is bent a little to the fiddle, a smile.
const FIDDLERS = ['rust', 'ochre'];
const FIDDLE_WHAT = ['the bow drawn out long across the strings, the weight on both feet', 'the bow pushed in to the strings, the near foot tapping the time, toe up'];
function fiddlePose(figure, i) {
  const F = frameOf(figure), spec = F.spec, beard = beardOf(spec), k = g(F);
  const dir = norm([1, -0.16]), n = [-dir[1], dir[0]];
  const tail = [-3.5 * k, 63.5 * k], at2 = (u, v = 0) => add(add(tail, mul(dir, u * k)), mul(n, v * k));
  const bridge = at2(9.5), neckHand = at2(24.5, -0.6), scroll = at2(29);
  const bowDir = norm([0.5, 0.86]), bowHand = add(bridge, mul(bowDir, (i === 0 ? -25 : -13) * k)), bowEnd = add(bowHand, mul(bowDir, 36 * k));
  const pose = { view: 'e', pelvis: P(F, -0.5), lean: 2, tilt: -9, feet: { near: foot(F, 5, i ? 2.2 : 0), far: foot(F, -3.5) }, knees: { near: 1, far: 1 },
    hands: { near: bowHand, far: neckHand }, elbows: { near: 1, far: -1 } };
  // The fiddle over the body and under the head and the near arm: its body at the chin, its neck forward to the far hand.
  pose.overBody = ink => {
    const body = [at2(0.5, 0), at2(3, 4.2), at2(7, 3.2), at2(10.5, 4.6), at2(15, 3.4), at2(16.5, 0), at2(15, -3.4), at2(10.5, -4.6), at2(7, -3.2), at2(3, -4.2)];
    ink.shape(blob(body, 0.8), '#a8582a', { off: 0.8, lift: true });
    ink.shape(capsule(at2(15.5), scroll, 1.2 * k, 1.0 * k), '#3a2616', { shade: false, outline: LINE.inner });
    ink.shape(ellipse(scroll, 1.8 * k, 1.6 * k), '#3a2616', { shade: false, outline: LINE.fine });
    ink.line(`M ${f2(at2(2)[0])} ${f2(at2(2)[1])} L ${f2(scroll[0])} ${f2(scroll[1])}`, { width: LINE.fine, colour: '#f0e0b0', opacity: 0.85 });
    ink.shape(capsule(at2(9.2, -2.2), at2(9.8, 2.2), 0.45 * k, 0.45 * k), '#e8d0a0', { shade: false, outline: LINE.fine });
    for (const v of [-1.6, 1.6]) ink.line(curve([at2(11.5, v), at2(12.6, v * 0.7), at2(13.4, v * 1.1)]), { width: LINE.fine, colour: '#2a1a10' });
    const r = F.B.limb * 0.5 * (F.B.hand ?? 0.85);
    ink.shape(ellipse(neckHand, r, r * 0.94), spec.skin, { off: 0.4 });
  };
  // The bow over everything, and the near hand on it.
  pose.after = (ink, j) => {
    const head = headFrame(F, j, pose);
    smile(ink, spec, head, beard);
    ink.line(`M ${f2(bowHand[0])} ${f2(bowHand[1])} L ${f2(bowEnd[0])} ${f2(bowEnd[1])}`, { width: LINE.inner + 2.4, colour: LINE.ink });
    ink.line(`M ${f2(bowHand[0])} ${f2(bowHand[1])} L ${f2(bowEnd[0])} ${f2(bowEnd[1])}`, { width: LINE.inner, colour: '#e0c088' });
    const r = F.B.limb * 0.5 * (F.B.hand ?? 0.85);
    ink.shape(ellipse(j.handNear, r, r * 0.94), spec.skin, { off: 0.4 });
  };
  return pose;
}
SHEETS['claude-courtship-fiddle'] = {
  cell: { w: 400, h: 400 }, scale: SCALE, columns: 2, request: REQUEST,
  replaceWith: 'item 7: `-fiddle`, 2 frames, east-facing and mirrored for west, the cast figure\'s own logical height and foot baseline',
  frames: FIDDLERS.flatMap(figure => [0, 1].map(i => ({
    name: `${figure}-fiddle-${i + 1}`, compare: [[`${figure}-idle-e`, 1], ['fiddler-play-1', 1]],
    prompt: `${figure} as a neighbour playing the fiddle at a frontier wedding supper, standing side on and facing east, frame ${i + 1} of 2: the fiddle under his chin on the far shoulder, its neck forward to his far hand, ${FIDDLE_WHAT[i]}; the head bent a little to it, smiling. The same person, face, hat, hair, clothes and colours as Astra's ${figure} sheets; Texas 1835 frontier clothes; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow, no text.`,
    draw: () => personFrame(`${figure}-fiddle-${i + 1}`, ink => drawPerson(ink, figure, fiddlePose(figure, i)), { note: `${figure} playing the fiddle, frame ${i + 1} of 2: ${FIDDLE_WHAT[i]}` }),
  }))),
};

export const CLIPS = {
  ...Object.fromEntries(FIGURES.flatMap(figure => Object.keys(COURT).map(pose => [`${figure}-${pose}`, {
    frames: COURT_TIMING[pose].map((duration, i) => ({ sprite: `${figure}-${pose}-${i + 1}`, duration })),
    loop: true, motion: 'none', direction: 'east; west by mirroring',
    prompt: `${figure} ${pose}, ${COURT_TIMING[pose].length} frame${COURT_TIMING[pose].length > 1 ? 's' : ''} looping gently (${COURT_TIMING[pose].join(', ')} ms): ${WHAT[pose].map(w => w(figure)).join('; ')}.`,
  }]))),
  ...Object.fromEntries(FIDDLERS.map(figure => [`${figure}-fiddle`, { frames: [{ sprite: `${figure}-fiddle-1`, duration: 300 }, { sprite: `${figure}-fiddle-2`, duration: 300 }], loop: true, motion: 'none', direction: 'east; west by mirroring',
    prompt: `${figure} playing the fiddle at the wedding supper, looping at a lively 300 ms a frame: ${FIDDLE_WHAT.join('; ')}.` }])),
  'elder-read-paper': { frames: [{ sprite: 'elder-read-paper-1', duration: 900 }, { sprite: 'elder-read-paper-2', duration: 1100 }], loop: true, motion: 'none', direction: 'east; west by mirroring',
    prompt: 'The commissioner reading the bond, looping slowly (900, 1100 ms): the head bowed to the paper, then raised toward the couple, reading aloud.' },
};

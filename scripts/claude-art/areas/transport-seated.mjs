// Area D (docs/CLAUDE_ART_PLAN.md): people sitting in a vehicle, drawn by Claude on 2026-09-28 - temporary, each frame to be
// replaced by Astra's of the same name.
//   D4   seated wagon drivers for the children (`<figure>-wagon-driver-<dir>`, the name the game already
//        asks for, public/motion.js `seatedClip`), four headings as her delivered sixteen: the lines in one hand, a goad in the other
//   D5   riders sitting in the bed of a wagon or a cart (`<figure>-ride-wagon-<dir>`), both casts and the children, east, south
//        and north, hands in the lap
// Drawn to the contract of her `people-wagon-drivers` (public/motion.js `SEAT`): a whole seated figure standing on its own base
// (the soles on the footboard or the floor), the hip about 0.4 of the way up, drawn at 0.92 of a person (`driverHeight`), so its
// logical height is 0.92 of a standing figure's 300 and a seated person is the same size as the same person standing. West is
// the east drawing mirrored (the delivered drivers have a painted west; this stand-in does not).
import { personFrame, drawPerson, frameOf } from '../kit/rig.mjs';
import { PEOPLE, LINE } from '../kit/style.mjs';
import { add, capsule, curve } from '../kit/svg.mjs';

export const AREA = 'transport';
export const DATE = '2026-09-28';

// The second cast's drivers are Astra's since 2026-10-08 (cast2-wagon-drivers-2026-10-08); only the children's remain Claude's.
const DRIVERS = ['girl', 'boy', 'smallchild'];
const RIDERS = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl', 'girl', 'boy', 'smallchild'];
const LOGICAL = Math.round(PEOPLE.logicalHeight * 0.92);
const WHO = {
  rust: 'the principal in his rust shirt, brim hat and full beard', teal: 'the teal-bodiced woman with her bun and ochre skirt', elder: 'the grey-bearded elder in his olive waistcoat',
  blue: 'the youth in his blue shirt and rolled trousers', 'rust-woman': 'the woman in her rust blouse, cream sunbonnet and apron', indigo: 'the woman in her indigo dress and cream kerchief',
  ochre: 'the man in his ochre shirt and dark waistcoat', 'blue-girl': 'the girl of about fourteen in her blue dress, apron and braid', girl: 'the family\'s girl of about eight, two braids, rust dress',
  boy: 'the family\'s boy of about eight, fair hair, cream shirt, barefoot', smallchild: 'the family\'s small child of about four in a cream smock',
};
const STYLE = 'The same face, hair, clothes and colours as Astra\'s sheets of this figure. Warm hand-drawn storybook style, thin dark olive-brown outline, flat shade; no bench, wagon, team or ground drawn - transparent all round, no shadow, no text.';

const GOAD = '#b89a5e', LINES = '#3e2816';
/** A seated pose in each heading; `drive` puts the lines in the far (or left) hand and a goad in the near (or right). */
function seated(F, view, drive) {
  // The soles rest on the footboard a little above the frame's base, so that the hip, sitting, is still about 0.4 of the way up.
  const g = F.hip / 39, board = 12 * g, hipY = board + F.ankle + F.B.shin * 0.92 + 3 * g, P = [0, hipY];
  if (view === 'e') {
    const pose = { view: 'e', pelvis: P, lean: drive ? 10 : 6, feet: { near: [14 * g, F.ankle + board], far: [11 * g, F.ankle + board + 0.5] }, knees: { near: 1, far: 1 }, elbows: { near: -1, far: -1 },
      hands: drive ? { near: add(P, [15 * g, 15 * g]), far: add(P, [13 * g, 13 * g]) } : { near: add(P, [16 * g, 9 * g]), far: add(P, [14 * g, 10 * g]) } };
    if (drive) pose.after = (ink, j) => {
      // The goad held up and forward; the lines from the other hand forward and down to the team.
      ink.shape(capsule(add(j.handNear, [-3 * g, -5 * g]), add(j.handNear, [18 * g, 34 * g]), 0.9, 0.6), GOAD, { shade: false, outline: LINE.inner });
      ink.line(curve([j.handFar, add(j.handFar, [14 * g, -6 * g]), add(j.handFar, [30 * g, -12 * g])]), { colour: LINES, width: 2.2 });
    };
    return pose;
  }
  const back = view === 'n';
  // Toward the camera the thighs come at us, so the knees are drawn a little below and outside the hips; going away the legs are
  // hidden in front of the body.
  const knees = back ? { left: add(P, [-5 * g, -1]), right: add(P, [5 * g, -1]) } : { left: add(P, [-7.5 * g, -4 * g]), right: add(P, [7.5 * g, -4 * g]) };
  const feet = back ? { left: add(P, [-6 * g, -3]), right: add(P, [6 * g, -3]) } : { left: [-6.5 * g, F.ankle + board], right: [6.5 * g, F.ankle + board] };
  const hands = drive ? { left: add(P, [-7 * g, 13 * g]), right: add(P, [7 * g, 13 * g]) } : { left: add(P, [-5 * g, 6 * g]), right: add(P, [5 * g, 6 * g]) };
  const pose = { view, pelvis: P, kneesFrontal: knees, feetFrontal: feet, hands };
  if (drive) pose.after = (ink, j) => {
    const r = add(P, [7 * g, 13 * g]), l = add(P, [-7 * g, 13 * g]);
    ink.shape(capsule(add(r, [-2 * g, -4 * g]), add(r, [12 * g, 36 * g]), 0.9, 0.6), GOAD, { shade: false, outline: LINE.inner });
    if (!back) ink.line(curve([l, add(l, [2 * g, -10 * g]), add(l, [4 * g, -24 * g])]), { colour: LINES, width: 2.2 });
  };
  return pose;
}

function frame(name, figure, view, drive, note) {
  const F = frameOf(figure);
  const pose = seated(F, view === 'w' ? 'e' : view, drive);
  const drawn = personFrame(name, ink => {
    if (view !== 'w') return drawPerson(ink, figure, pose);
    // West: the east drawing mirrored about the figure's own middle.
    const inner = new (ink.constructor)(ink.prefix + '-w', ink.k, { yUp: true });
    inner.n = ink.n + 1;
    drawPerson(inner, figure, pose);
    ink.defs.push(...inner.defs);
    ink.raw(`<g transform="scale(-1 1)">${inner}</g>`);
  }, { note });
  return { ...drawn, logicalHeight: LOGICAL };
}

const HEAD = { e: 'facing east', w: 'facing west (the east drawing mirrored)', s: 'facing the camera', n: 'seen from behind, going away' };
const driverFrames = DRIVERS.flatMap(figure => ['s', 'e', 'w', 'n'].map(view => ({ name: `${figure}-wagon-driver-${view}-1`, height: 0.92, figure, view,
  compare: [[`rust-wagon-driver-${view}`, 0.92], [`${figure}-idle-${view === 'w' ? 'e' : view}`, 1]],
  prompt: `${WHO[figure]} sitting as the wagon's driver, ${HEAD[view]}: seated on the box with the feet on the footboard, the lines in one hand and a short ox goad held up in the other, the back upright. ${STYLE}`,
  draw: () => frame(`${figure}-wagon-driver-${view}-1`, figure, view, true, `${figure} driving the wagon, ${view}`) })));
const riderFrames = RIDERS.flatMap(figure => ['e', 's', 'n'].map(view => ({ name: `${figure}-ride-wagon-${view}-1`, height: 0.92, figure, view,
  compare: [[`rust-wagon-driver-${view}`, 0.92], [`${figure}-idle-${view}`, 1]],
  prompt: `${WHO[figure]} riding in the bed of the family's wagon or cart, ${HEAD[view]}: sitting on the load or the floor with the knees up and the hands resting in the lap, as the family's youngest and sick ride on its journeys (sim/company.mjs). ${STYLE}`,
  draw: () => frame(`${figure}-ride-wagon-${view}-1`, figure, view, false, `${figure} riding in the wagon's bed, ${view}`) })));

export const SHEETS = {
  'claude-wagon-drivers': { cell: PEOPLE.cell, columns: 8, request: 'Request 2026-09-16 — driving the ox wagon', replaceWith: 'a seated driver layer on the four headings as the delivered sixteen in people-wagon-drivers, anchored at the rig\'s seat point',
    frames: driverFrames },
  'claude-wagon-riders': { cell: PEOPLE.cell, columns: 9, request: 'Request 2026-09-25 — riders, walkers and the cart', replaceWith: 'item 2: a seated rider for the bed of a wagon or cart, east, north and south, anchored at the hip like the delivered driver layers',
    frames: riderFrames },
};
const held = (sprite, direction, prompt) => ({ frames: [{ sprite, duration: 2200 }], loop: true, motion: 'breathe', direction, prompt });
export const CLIPS = Object.fromEntries([
  ...driverFrames.map(f => [`${f.figure}-wagon-driver-${f.view}`, held(f.name, { s: 'south', e: 'east', w: 'west', n: 'north' }[f.view], `${f.figure} driving the wagon, ${f.view}: one held seated frame, breathing, as the delivered drivers.`)]),
  ...riderFrames.map(f => [`${f.figure}-ride-wagon-${f.view}`, held(f.name, { s: 'south', e: 'east; west by mirroring', n: 'north' }[f.view], `${f.figure} riding in the wagon's bed, ${f.view}: one held seated frame, breathing.`)]),
]);

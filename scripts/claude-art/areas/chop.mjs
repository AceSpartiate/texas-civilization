// Felling with an axe (request 2026-09-28 — people at work, item 1): `<figure>-chop` for all eight cast figures, the figure
// side on, facing east (the game mirrors it for west), the tree just off the frame's right edge.
//
// Owner, 2026-09-28: "make sure the chop swings look natural". Six frames of one continuous swing (kit/poses.mjs `chop`):
// the wind-up held (the axe drawn back over the shoulder, the chest turned away, the weight on the back foot), the start of the
// downswing, the downswing (turning into the tree, the top hand sliding down the handle, the weight going forward), the bite
// held (the head in the trunk at hip height, the arms out, the knees bent, the body leaning in), the axe pulled free, and the
// body rising back toward the wind-up. The handle is rigid and both hands stay on it; the feet do not move
// (tests/claude-rig.test.mjs). The axe lands on frame 4 (`beat: 3`), which is when public/work-art.js throws the chips.
//
// Drawn from the person rig (scripts/claude-art/kit/rig.mjs), so each figure keeps the face, hair, clothes and colours of
// Astra's own sheets. Her contract asks for four frames; six are drawn for the motion, and hers replaces the clip by name.
import { personFrame, drawPerson, frameOf } from '../kit/rig.mjs';
import { POSES, SWINGS } from '../kit/poses.mjs';

export const AREA = 'work';
export const DATE = '2026-09-28';
export const FIGURES = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl'];
const { durations: DURATIONS, beat: BEAT } = SWINGS.chop;
const WHAT = [
  'the wind-up, held: the axe drawn back over the shoulder, the chest turned away, the weight on the back foot',
  'the start of the downswing: the axe over the head, the body beginning to turn toward the tree',
  'the downswing: hips and shoulders turning into the tree, the top hand sliding down the handle, the weight going forward',
  'the bite, held: the axe head in the trunk at hip height just past the frame\'s right edge, the arms out, the knees bent, the body leaning in',
  'the axe pulled free of the cut',
  'rising back toward the wind-up, the axe coming up and back',
];
// Her hoeing frame nearest each of these (raised, swinging, down, back), for the play-size comparison.
const HERS = [1, 1, 2, 3, 4, 4];

export const SHEETS = {
  'claude-chop': { cell: { w: 400, h: 400 }, scale: 0.6, columns: 6, request: 'Request 2026-09-28 — people at work', replaceWith: 'item 1: 4 frames, east-facing and mirrored for west, the cast figure\'s own logical height and foot baseline; name the frame the axe lands on',
    frames: FIGURES.flatMap(figure => POSES.chop(frameOf(figure)).map((pose, i) => ({
      name: `${figure}-chop-${i + 1}`, compare: [[`${figure}-idle-e`, 1], [`${figure}-work-${HERS[i]}`, 1]],
      prompt: `${figure} felling a tree with a long-handled felling axe, side on and facing east, frame ${i + 1} of 6 of one natural swing: ${WHAT[i]}. Feet planted where they stood, the handle its full length with both hands on it. The same person, face, hat, hair, clothes and colours as Astra's ${figure} sheets; Texas 1835 frontier clothes; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow, no text.`,
      draw: () => personFrame(`${figure}-chop-${i + 1}`, ink => drawPerson(ink, figure, pose), { note: `${figure} felling, frame ${i + 1} of 6: ${WHAT[i]}` }),
    }))) },
};

export const CLIPS = Object.fromEntries(FIGURES.map(figure => [`${figure}-chop`, {
  frames: DURATIONS.map((duration, i) => ({ sprite: `${figure}-chop-${i + 1}`, duration })),
  loop: true, motion: 'none', direction: 'east; west by mirroring', beat: BEAT,
  prompt: `${figure} felling with an axe, one natural swing looping: wind-up (held), start down, downswing, bite (held; the axe lands here), pull free, rise - 1.2 seconds a stroke, feet planted, the handle rigid in both hands.`,
}]));

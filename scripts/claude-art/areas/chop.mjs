// Felling with an axe (request 2026-09-28 — people at work, item 1): `<figure>-chop`, four frames - the axe back over the
// shoulder, the swing, the bite (the head in the trunk at hip height, just off the frame's right edge), the pull back -
// the figure side on, facing east (the game mirrors it for west). The tool lands on frame 3 (`beat: 2`), which is when
// public/work-art.js throws the chips and plays the stroke's sound.
//
// Drawn from the person rig (scripts/claude-art/kit/rig.mjs), so each figure keeps the face, hair, clothes and colours of
// Astra's own sheets. The first figure is the pipeline's worked example (2026-09-28); the area's builder adds the other
// seven by adding their names to FIGURES.
import { personFrame, drawPerson, frameOf } from '../kit/rig.mjs';
import { POSES } from '../kit/poses.mjs';

export const AREA = 'work';
export const DATE = '2026-09-28';
export const FIGURES = ['rust'];
// The cast `-work` cycle's timing, the strike a little longer so the bite is seen.
const DURATIONS = [320, 140, 300, 260];
const WHAT = ['the axe back over the shoulder, weight on the back foot', 'the swing coming through, the axe head level with the hat', 'the bite: the axe head in the trunk at hip height, just past the frame\'s right edge, the body bent into it', 'the pull back: the axe drawn out of the cut and rising'];

export const SHEETS = {
  'claude-chop': { cell: { w: 400, h: 400 }, columns: 4, request: 'Request 2026-09-28 — people at work', replaceWith: 'item 1: 4 frames, east-facing and mirrored for west, the cast figure\'s own logical height and foot baseline; name the frame the axe lands on',
    frames: FIGURES.flatMap(figure => POSES.chop(frameOf(figure)).map((pose, i) => ({
      name: `${figure}-chop-${i + 1}`,
      prompt: `${figure} felling a tree with a long-handled felling axe, side on and facing east, frame ${i + 1} of 4: ${WHAT[i]}. The same person, face, hat, hair, clothes and colours as Astra's ${figure} sheets; Texas 1835 frontier clothes; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow, no text.`,
      draw: () => personFrame(`${figure}-chop-${i + 1}`, ink => drawPerson(ink, figure, pose), { note: `${figure} felling, frame ${i + 1} of 4: ${WHAT[i]}` }),
    }))) },
};

export const CLIPS = Object.fromEntries(FIGURES.map(figure => [`${figure}-chop`, {
  frames: DURATIONS.map((duration, i) => ({ sprite: `${figure}-chop-${i + 1}`, duration })),
  loop: true, motion: 'none', direction: 'east; west by mirroring', beat: 2,
  prompt: `${figure} felling with an axe: back, swing, bite, pull back, looping at the cast hoeing cycle's pace; the axe lands on the third frame.`,
}]));

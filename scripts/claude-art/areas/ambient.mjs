// Ambient life (request 2026-09-28 — ambient life, item 1): the everyday work an idle person is drawn at (sim/ambient.mjs
// `ACTIVITIES`), for each of the eight grown cast figures, east-facing (the game mirrors it for west): `-whittle`,
// `-mend-harness`, `-sew`, `-shell-corn`, `-clean-rifle`, `-pipe` and `-cards` seated on a stool as her `-repair` and `-rest`
// are (2 frames), `-wash` kneeling at the tub (2; the tub is the `washtub` prop drawn beside), `-sweep` (4) and
// `-carry-water` (a bucket in each hand, walking, 4). Plugs into `ambientClip` (public/motion.js): the pose the server names
// stays the delivered one, and the page draws the activity's own clip where the library holds it (`AMBIENT_DRAWN`).
//
// Drawn from the person rig with the area's poses (scripts/claude-art/kit/work-poses.mjs), so each figure keeps the face,
// hair, clothes and colours of Astra's own sheets. Temporary: her clip of the same name replaces each.
import { personFrame, frameOf } from '../kit/rig.mjs';
import { AMBIENT, AMBIENT_TIMING, drawPosed } from '../kit/work-poses.mjs';

export const AREA = 'work';
export const DATE = '2026-09-28';
export const FIGURES = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl'];
const REQUEST = 'Request 2026-09-28 — ambient life';

/** What each pose shows, frame by frame (the written intent each frame is drawn to), and the Astra pose it is judged beside. */
const POSES = {
  whittle: { near: 'repair', what: ['seated on a stool, a stick in the far hand, the clasp knife set at it', 'the knife run out along the stick away from the body, a curl of shaving coming off'] },
  'mend-harness': { near: 'repair', what: ['seated, harness leather across the knees, the awl pushed through it', 'the waxed thread drawn up and out of the leather, the chest back a little'] },
  sew: { near: 'repair', what: ['seated, cloth over the lap, the needle put into it', 'the needle drawn up at arm\'s length, the thread taut from the cloth'] },
  'shell-corn': { near: 'repair', what: ['seated leaning over a split basket at the feet, an ear of corn in both hands, the thumbs on the kernels', 'the ear twisted, kernels falling into the basket'] },
  'clean-rifle': { near: 'repair', what: ['seated, a long rifle across the knees, the far hand steadying the barrel, a rag at the lock', 'the rag run up the barrel toward the muzzle; the rod lies by the feet'] },
  pipe: { near: 'rest', what: ['seated back at ease, the clay pipe at the mouth, a thread of smoke', 'the pipe lowered to the chest, smoke rising from the bowl'] },
  cards: { near: 'rest', what: ['seated, a hand of cards held up at the chest', 'leaning in, the near hand reaching out to lay a card down'] },
  wash: { near: 'care', what: ['kneeling at the washtub, both hands on the board, scrubbing down', 'scrubbing back up the board, leaning further in'] },
  sweep: { near: 'work', what: ['a broom held low in both hands, its head set down ahead', 'the broom swept back along the ground, dust lifting', 'the sweep finishing at the feet, a puff of dust', 'the broom lifted and carried forward again'] },
  'carry-water': { near: 'carry', what: ['walking with a wooden bucket in each hand, the near foot forward, arms straight with the weight', 'passing, the buckets swinging', 'the far foot forward', 'passing'] },
};
/** The Astra clip nearest each pose, for the moving preview (scripts/claude-art/preview-poses.mjs). */
export const NEAREST = Object.fromEntries(Object.entries(POSES).map(([pose, p]) => [pose, p.near]));

export const SHEETS = Object.fromEntries(Object.entries(POSES).map(([pose, { near, what }]) => [`claude-ambient-${pose}`, {
  cell: { w: 400, h: 400 }, scale: 0.6, columns: what.length, request: REQUEST,
  replaceWith: `item 1: \`-${pose}\`, ${what.length} frames, east-facing and mirrored for west, the cast figure's own logical height and foot baseline`,
  frames: FIGURES.flatMap(figure => AMBIENT[pose](frameOf(figure)).map((p, i) => ({
    name: `${figure}-${pose}-${i + 1}`, compare: [[`${figure}-${near}-1`, 1], [`${figure}-idle-e`, 1]],
    prompt: `${figure} ${what.length > 2 ? '' : 'at ease, '}${pose.replace('-', ' ')}, frame ${i + 1} of ${what.length}: ${what[i]}. Side on, facing east. The same person, face, hat, hair, clothes and colours as Astra's ${figure} sheets; Texas 1835 frontier clothes and things; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow, no text.`,
    draw: () => personFrame(`${figure}-${pose}-${i + 1}`, ink => drawPosed(ink, figure, p), { scale: p.scale || 1, note: `${figure} ${pose}, frame ${i + 1} of ${what.length}: ${what[i]}` }),
  }))),
}]));

export const CLIPS = Object.fromEntries(FIGURES.flatMap(figure => Object.entries(POSES).map(([pose, { what }]) => [`${figure}-${pose}`, {
  frames: AMBIENT_TIMING[pose].map((duration, i) => ({ sprite: `${figure}-${pose}-${i + 1}`, duration })),
  loop: true, motion: 'none', direction: 'east; west by mirroring',
  prompt: `${figure} ${pose.replace('-', ' ')}, ${what.length} frames looping (${AMBIENT_TIMING[pose].join(', ')} ms): ${what.join('; ')}.`,
}])));

// People at work (request 2026-09-28 — people at work), for each of the eight grown cast figures, east-facing (the game
// mirrors it for west): splitting rails (`-split`, item 2), raising the house (`-notch`, `-lift`, item 3), digging and the
// well (`-dig`, `-dig-well`, item 4), harvesting corn (`-reap`, 5), making things (`-carpentry`, 6), a civilian with a rifle
// (`-aim`, `-fire`, 7), fishing (`-fish`, 8), stooping to gather (`-gather`, 9), dressing meat (`-butcher`, 10, never a
// carcass or blood), the army's camp (`-drill`, `-guard`, 11), surveying (`-stake`, 12) and keeping a fire (`-tend-fire`, 14).
// The chop is its own module (chop.mjs); the hoe is Astra's `-work`.
//
// The split and the dig are the foundation's natural swings (kit/poses.mjs `split`, `dig`: six frames, the feet planted, the
// handle rigid, the wind-up and the strike held), with the log and wedge, the cut in the ground, or the well's hole drawn where
// the tool lands; the rest are area A's poses (kit/work-poses.mjs). Each clip names the frame its work lands on (`beat`), which
// public/work-art.js `STROKES.<stroke>.drawn.beat` repeats for the chips, the earth and the sounds. Temporary: her clip of
// the same name replaces each.
import { personFrame, frameOf } from '../kit/rig.mjs';
import { POSES, SWINGS } from '../kit/poses.mjs';
import { WORK, WORK_TIMING, drawPosed } from '../kit/work-poses.mjs';

export const AREA = 'work';
export const DATE = '2026-09-28';
export const FIGURES = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl'];
const REQUEST = 'Request 2026-09-28 — people at work';
const SWING_WHAT = {
  split: ['the maul raised back over the shoulder, held, the weight on the back foot', 'the maul coming over the head', 'the maul coming down, the body turning into it', 'the maul on the wedge in the log, held, knees bent', 'the maul bouncing up off the wedge', 'rising back toward the wind-up'],
  dig: ['the spade set, the near foot on its tread driving it in', 'bent over, the spade levered back', 'lifting the spadeful', 'turning, the earth thrown back over the shoulder, held', 'the spade coming back down', 'the spade set again'],
};
/** Each pose: its item, the frames' written intent, the Astra pose it is judged beside, and how its frames are made. */
const POSES_A = {
  split: { item: 2, near: 'work', what: SWING_WHAT.split, make: F => WORK.split(F, POSES.split), timing: SWINGS.split, request: 'a maul raised, coming down, on the wedge in a log on the ground (the log in the frame), and back' },
  dig: { item: 4, near: 'work', what: SWING_WHAT.dig, make: F => WORK.dig(F, POSES.dig), timing: SWINGS.dig, request: 'a spade driven in with the foot, levered, the earth thrown behind, and back' },
  'dig-well': { item: 4, near: 'work', what: SWING_WHAT.dig.map(w => `waist-deep in a square hole with a low bank of earth round it: ${w}`), make: F => WORK['dig-well'](F, POSES.dig), timing: SWINGS.dig, request: 'the dig drawn waist-deep in a square hole with a low bank of earth round it' },
  notch: { item: 3, near: 'work', what: ['beside a wall log at knee height, the axe raised back over the shoulder, held', 'the axe coming down', 'the bite: the axe in the top of the log\'s end, cutting the notch, chips flying', 'the axe drawn out and rising'], request: 'beside a wall log at knee height notching its end with an axe' },
  lift: { item: 3, near: 'carry', what: ['stooped, knees bent, both hands under the end of a wall log lying on the ground', 'upright, the log\'s end up on the shoulder, the log running level to the frame\'s edge'], request: 'stooped with both hands under a log end, then the log end at the shoulder; two facing across the frame read as one log' },
  reap: { item: 5, near: 'work', what: ['reaching up to an ear of corn on the stalk, a sack slung at the hip', 'snapping the ear off, pulling it down', 'dropping the ear into the sack at the hip', 'a step on to the next stalk'], request: 'reaching up to an ear, snapping it, dropping it in a sack at the hip, stepping on' },
  carpentry: { item: 6, near: 'repair', what: ['astride a shaving horse, the work clamped, a drawknife reached out along it', 'the drawknife drawn toward the body, a shaving curling off', 'boring into the work with an auger, the T-handle in both hands', 'the auger turned, the chips curling up'], request: 'at a shaving horse drawing a drawknife (2 frames), then boring with an auger (2)' },
  aim: { item: 7, near: 'search', what: ['a long rifle level at the shoulder, cheek to the stock, the feet apart, the front knee bent'], request: 'a long rifle at the shoulder, level, in the figure\'s own clothes' },
  fire: { item: 7, near: 'search', what: ['the recoil: the muzzle thrown up, the chest and head back', 'the rifle lowered to the port, the smoke drifting off'], request: 'the recoil, lowering; the smoke stays the library\'s musket-smoke' },
  fish: { item: 8, near: 'rest', what: ['sitting on the bank, knees up, a cane pole out over the water, the line down to a red float', 'the pole twitched up, the float bobbing'], request: 'sitting on the bank with a cane pole out, the pole twitched' },
  gather: { item: 9, near: 'sow', what: ['bent to the ground, picking something up, a basket by the feet', 'putting it into the basket'], request: 'bent to the ground picking up, then into a basket or apron' },
  butcher: { item: 10, near: 'care', what: ['at a plank table, a joint of meat wrapped in cloth held down, the knife raised', 'cutting through the joint, leaning in; no carcass, no blood'], request: 'at a plank table cutting a joint wrapped in cloth; no carcass, no blood' },
  drill: { item: 11, near: 'walk', what: ['stepping out, the rifle sloped on the near shoulder, the near foot forward', 'passing', 'the far foot forward', 'passing'], request: 'stepping out with a rifle at the shoulder, a volunteer in his own clothes' },
  guard: { item: 11, near: 'search', what: ['standing sentry side on, the rifle sloped on the shoulder', 'the head and body turned round to look toward the camera, the rifle still sloped'], request: 'standing sentry, rifle sloped, turning the head' },
  stake: { item: 12, near: 'work', what: ['stooped over a survey stake, a wooden mallet raised', 'the mallet down on the stake\'s head, driving it'], request: 'a mallet raised over a stake and driving it' },
  'tend-fire': { item: 14, near: 'care', what: ['kneeling at a small fire of sticks ringed with stones, feeding a stick into it', 'down low, blowing on it, the flames up'], request: 'kneeling, feeding a stick into a small fire (the fire in the frame) and blowing on it' },
};
/** The Astra clip nearest each pose, for the moving preview (scripts/claude-art/preview-poses.mjs). */
export const NEAREST = Object.fromEntries(Object.entries(POSES_A).map(([pose, p]) => [pose, p.near]));
const makeOf = pose => POSES_A[pose].make || (F => WORK[pose](F));

/** A figure's pose Astra has drawn (her frames and clip of the same name win in the loader): no Claude frame of it is made. */
// Astra's Gonzales spade work, 2026-10-04 (docs/ART_DELIVERY_2026-10-04-GONZALES-DIGGING.md): elder, ochre and blue dig.
const ASTRA_DREW = new Set(['elder-dig', 'ochre-dig', 'blue-dig']);
export const SHEETS = Object.fromEntries(Object.entries(POSES_A).map(([pose, spec]) => [`claude-work-${pose}`, {
  cell: { w: 400, h: 400 }, scale: 0.6, columns: spec.what.length, request: REQUEST,
  replaceWith: `item ${spec.item}: \`-${pose}\`, ${spec.what.length} frames (${spec.request}), east-facing and mirrored for west, the cast figure's own logical height and foot baseline`,
  frames: FIGURES.filter(figure => !ASTRA_DREW.has(`${figure}-${pose}`)).flatMap(figure => makeOf(pose)(frameOf(figure)).map((p, i) => ({
    name: `${figure}-${pose}-${i + 1}`, compare: [[`${figure}-${spec.near}-1`, 1], [`${figure}-idle-e`, 1]],
    prompt: `${figure} at work, ${pose.replace('-', ' ')}, frame ${i + 1} of ${spec.what.length}: ${spec.what[i]}. Side on, facing east. The same person, face, hat, hair, clothes and colours as Astra's ${figure} sheets; Texas 1835 frontier clothes and tools; nothing pointed at a person, no blood; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow, no text.`,
    draw: () => personFrame(`${figure}-${pose}-${i + 1}`, ink => drawPosed(ink, figure, p), { scale: p.scale || 1, note: `${figure} ${pose}, frame ${i + 1} of ${spec.what.length}: ${spec.what[i]}` }),
  }))),
}]));

export const CLIPS = Object.fromEntries(FIGURES.flatMap(figure => Object.entries(POSES_A).filter(([pose]) => !ASTRA_DREW.has(`${figure}-${pose}`)).map(([pose, spec]) => {
  const timing = spec.timing || WORK_TIMING[pose];
  const sprites = (timing.frames || timing.durations.map((_, i) => `${pose}-${i + 1}`)).map(s => `${figure}-${s}`);
  return [`${figure}-${pose}`, {
    frames: timing.durations.map((duration, i) => ({ sprite: sprites[i], duration })),
    loop: true, motion: 'none', direction: 'east; west by mirroring', ...(Number.isFinite(timing.beat) && { beat: timing.beat }),
    prompt: `${figure} ${pose.replace('-', ' ')}, ${sprites.length} frames looping (${timing.durations.join(', ')} ms)${Number.isFinite(timing.beat) ? `, the work landing on frame ${timing.beat + 1}` : ''}: ${pose === 'fire' ? `the aim held (${figure}-aim-1), then ` : ''}${spec.what.join('; ')}.`,
  }];
})));

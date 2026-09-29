// The children at play, at their own work and talking (docs/CLAUDE_ART_PLAN.md B1, B6, B7): for `girl`, `boy` and
// `smallchild`, drawn from the person rig in each child's own face, hair and clothes and a child's proportions (BUILD.child,
// BUILD.small: a head a third of the height), filling the cell as a grown figure does - the renderer shrinks them by age
// (public/motion.js FIGURE_SCALE), as it does Astra's children's sheets.
//
// Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work, items 1 and 4: `-play-run` (4, east, and
// `-n`/`-s`), `-play-gallop` (a stick horse, 4), `-play-hide` (1), `-play-kneel` (marbles, 2), `-play-sit-doll` (1),
// `-play-hoop` (4, the hoop in the frame), `-scatter` (corn for the hens, 2), `-speak` (2), `-tug` (2).
// Request 2026-09-28 — people at work, item 13: `-shoo` (2), `-gather` (2), `-carry-water` (4, east, and `-n`/`-s`).
//
// Claude-drawn and temporary: Astra's frames and clips of the same names replace these on registration.
import { personFrame } from '../kit/rig.mjs';
import { frameOf } from '../kit/rig.mjs';
import { CHILD_POSES, CHILD_SCALE, drawChildPose } from '../kit/little.mjs';

export const AREA = 'children';
export const DATE = '2026-09-28';
export const FIGURES = ['girl', 'boy', 'smallchild'];
const WHO = { girl: 'the girl (dark braids, a rust-red dress and cream apron, brown shoes)', boy: 'the boy (tousled fair hair, a cream shirt with one brace, rolled brown trousers, barefoot)', smallchild: 'the small child (a dark mop of hair, a cream gown to the shins, barefoot)' };
const PLAY = "Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work";
const WORK = 'Request 2026-09-28 — people at work';
const STYLE = "Astra's child proportions (a head a third of the height), the same face, hair, clothes and colours as her children's sheets; warm hand-drawn storybook style, dark olive-brown outline, one flat shade with the light from the upper left, transparent ground, no shadow, no text.";

/** Each pose: its frames' descriptions, durations, clip motion, direction, the request and what replaces it. */
const POSES = {
  'play-run': { what: ['the near foot striking out in front, the back foot kicked up behind, the chest well forward, the arms pumping wide - the far arm reaching ahead as if to tag', 'both feet off the ground, the far knee coming through', 'the far foot striking, the near kicked up behind, the arms swapped', 'off the ground again, the near knee coming through'],
    durations: [150, 130, 150, 130], request: PLAY, item: 'item 1', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-walk-1`, `${f}-walk-3`], doing: 'running at tag' },
  'play-run-s': { what: ['running toward the camera, the left foot forward, the arms out from the sides', 'the right foot forward, the arms out'], durations: [180, 180], request: PLAY, item: 'item 1', motion: 'none', direction: 'south', upright: true, compare: f => [`${f}-walk-s-1`], doing: 'running toward the camera' },
  'play-run-n': { what: ['running away from the camera, the left foot forward, the arms out', 'the right foot forward, the arms out'], durations: [180, 180], request: PLAY, item: 'item 1', motion: 'none', direction: 'north', upright: true, compare: f => [`${f}-walk-n-1`], doing: 'running away from the camera' },
  'play-gallop': { what: ['a stick horse between the knees - a plain stick trailing on the ground behind, a stuffed tan horse head with a red yarn mane held up before the chest - the lead foot landing', 'the skip: both feet off the ground, the horse head bobbing up', 'the lead knee lifted high, the back foot down', 'the lead foot reaching out to land again'],
    durations: [170, 130, 170, 130], request: PLAY, item: 'item 1', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-walk-1`, 'icon-child-play'], doing: 'galloping a stick horse' },
  'play-hide': { what: ['crouched down low as if behind something, peeking over it, a finger up to the lips, the other hand on the knee'], durations: [2400], request: PLAY, item: 'item 1', motion: 'breathe', direction: 'east; west by mirroring', compare: f => [`${f}-idle-e`, `${f}-rest-e-pose`], doing: 'hiding' },
  'play-kneel': { what: ['kneeling in the dirt on both knees, sitting back on the heels, leaning over three marbles on the ground, the hand down to flick one', 'the hand drawn back from the flick, leaning in to watch'], durations: [900, 500], request: PLAY, item: 'item 1', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-rest-e-pose`, `${f}-idle-e`], doing: 'kneeling at marbles or the toy cart' },
  'play-sit-doll': { what: ['sitting on the ground, legs out in front, a corn-husk doll with a red sash held up in the lap in both hands'], durations: [2600], request: PLAY, item: 'item 1', motion: 'rock', direction: 'east; west by mirroring', compare: f => [`${f}-rest-e-pose`, `${f}-rest-s-pose`], doing: 'sitting with a doll' },
  'play-hoop': { what: ['running beside an old barrel hoop rolling ahead, a stick held out and down against its rim, the near foot forward', 'passing, the hoop rolled a quarter turn on', 'the far foot forward, the hoop rolled on', 'passing again'],
    durations: [170, 150, 170, 150], request: PLAY, item: 'item 1', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-walk-1`, 'icon-child-play'], doing: 'rolling a hoop' },
  'scatter': { what: ['standing with a small tin pan of corn held at the waist, the hand in it', 'the arm flung out low, the corn flying in an arc to the ground'], durations: [700, 500], request: PLAY, item: 'item 1 (`-scatter`)', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-idle-e`, 'rust-woman-sow-1'], doing: 'scattering corn for the hens' },
  'shoo': { what: ['arms flung up waving a red cloth, leaning back, shouting at the birds', 'the arms swept down and forward, the cloth trailing, a stamp of the foot, still shouting'], durations: [320, 320], request: WORK, item: 'item 13', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-idle-e`, `${f}-walk-1`], doing: 'shooing birds off the crop' },
  'gather': { what: ['stooped to the ground picking up a stick or an egg, a small basket hanging from the far arm', 'straightening, putting it into the basket'], durations: [700, 600], request: WORK, item: 'item 13', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-idle-e`, 'rust-woman-sow-1'], doing: 'gathering kindling or eggs' },
  'carry-water': { what: ['walking with a small wooden pail of water in each hand, the arms straight with the weight, the near foot forward', 'passing', 'the far foot forward', 'passing'], durations: [230, 230, 230, 230], request: WORK, item: 'item 13', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-walk-1`, 'icon-child-water'], doing: 'carrying water' },
  'carry-water-s': { what: ['walking toward the camera, a small pail in each hand, the left foot forward', 'the right foot forward'], durations: [260, 260], request: WORK, item: 'item 13', motion: 'none', direction: 'south', upright: true, compare: f => [`${f}-walk-s-1`], doing: 'carrying water toward the camera' },
  'carry-water-n': { what: ['walking away from the camera, a small pail in each hand, the left foot forward', 'the right foot forward'], durations: [260, 260], request: WORK, item: 'item 13', motion: 'none', direction: 'north', upright: true, compare: f => [`${f}-walk-n-1`], doing: 'carrying water away from the camera' },
  'speak': { what: ['standing, the face turned up to a grown-up, mouth open telling it, a hand lifted', 'the palm turned out, finishing'], durations: [420, 420], request: PLAY, item: 'item 4', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-idle-e`, 'rust-speak-1'], doing: 'talking up to a grown-up' },
  'tug': { what: ['both hands out at the height of a grown person\'s hanging sleeve, leaning back on the pull, calling up', 'leaning further back, the hands drawn in with the sleeve'], durations: [380, 380], request: PLAY, item: 'item 4', motion: 'none', direction: 'east; west by mirroring', compare: f => [`${f}-idle-e`, `${f}-walk-1`], doing: 'tugging at a grown-up\'s sleeve' },
};
const PLAY_POSES = ['play-run', 'play-run-s', 'play-run-n', 'play-gallop', 'play-hide', 'play-kneel', 'play-sit-doll', 'play-hoop'];
const WORK_POSES = ['scatter', 'shoo', 'gather', 'carry-water', 'carry-water-s', 'carry-water-n', 'speak', 'tug'];

function framesOf(figure, poses) {
  const F = frameOf(figure);
  return poses.flatMap(pose => {
    const spec = POSES[pose];
    return CHILD_POSES[pose](F).map((p, i) => ({
      name: `${figure}-${pose}-${i + 1}`, compare: spec.compare(figure).map(n => [n, 1]),
      prompt: `${WHO[figure]} ${spec.doing}, ${spec.direction.startsWith('east') ? 'side on facing east' : `facing ${spec.direction}`}, frame ${i + 1} of ${spec.durations.length}: ${spec.what[i]}. ${STYLE}`,
      draw: () => personFrame(`${figure}-${pose}-${i + 1}`, ink => drawChildPose(ink, figure, p), { note: `${figure} ${spec.doing}, frame ${i + 1}: ${spec.what[i]}`, scale: CHILD_SCALE[figure] }),
    }));
  });
}
const sheet = (request, replaceWith, frames) => ({ cell: { w: 400, h: 400 }, columns: 6, request, replaceWith, frames });

export const SHEETS = Object.fromEntries(FIGURES.flatMap(figure => [
  [`claude-${figure}-play`, sheet(PLAY, 'item 1: the children\'s play in each child\'s own figure, on the children\'s sheets\' logical height and foot baseline, east-facing and mirrored for west (-n and -s for the run)', framesOf(figure, PLAY_POSES))],
  [`claude-${figure}-chores`, sheet(PLAY, 'items 1 and 4 (-scatter, -speak, -tug) and request 2026-09-28 — people at work, item 13 (-shoo, -gather, -carry-water): in the child\'s own figure, east-facing and mirrored for west', framesOf(figure, WORK_POSES))],
]));

export const CLIPS = Object.fromEntries(FIGURES.flatMap(figure => [...PLAY_POSES, ...WORK_POSES].map(pose => {
  const spec = POSES[pose];
  return [`${figure}-${pose}`, {
    frames: spec.durations.map((duration, i) => ({ sprite: `${figure}-${pose}-${i + 1}`, duration })),
    loop: true, motion: spec.motion, direction: spec.direction,
    prompt: `${WHO[figure]} ${spec.doing} (${spec.request}, ${spec.item}): ${spec.durations.length > 1 ? spec.what.join('; then ') : spec.what[0]}${spec.durations.length > 1 ? ', looping' : ', held with the renderer\'s own gentle motion'}.`,
  }];
})));

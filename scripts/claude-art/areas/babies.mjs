// The baby, and a grown-up holding it (docs/CLAUDE_ART_PLAN.md B2, B3; request 2026-09-26 — children at play, babies, and
// the Runaway Scrape's own work, items 2 and 3).
//
// The baby: `infant-crawl` (4, east) and `infant-crawl-w` (the same crawling west, drawn west so the light stays upper
// left), `infant-cry` (sitting up, mouth open, fists up, 2), `infant-sleep` (curled asleep on a folded blanket, 1). Drawn on
// the people contract (the 400 cell, logical height 300) and scaled against Astra's basket row: the renderer draws an infant
// at 0.45 of a person (FIGURE_SCALE.infant), so the crawling baby, about half its logical height, stands about a fifth of a
// grown-up's height, its head the size of the head of her baby in the basket (`infant-awake`) beside it.
//
// Holding it: for the four cast women and the four cast men, `-hold-baby` (toward the camera, the baby held up to the
// shoulder, swaying, 2) and `-carry-baby-walk` (the baby on the near hip, walking, 4 east, and `-s`/`-n` 2 each). The held
// baby is drawn at the infant's own scale against the grown-up's (little.mjs HELD) and wrapped in a small blue-grey shawl so
// it is not lost against a cream apron.
//
// Claude-drawn and temporary: Astra's frames and clips of the same names replace these on registration.
import { personFrame, frameOf } from '../kit/rig.mjs';
import { drawBaby, holdBabyPoses, drawHoldBaby, carryBabyPoses, drawCarryBaby, carryBabyFrontal, drawCarryBabyFrontal } from '../kit/little.mjs';

export const AREA = 'children';
export const DATE = '2026-09-28';
const REQUEST = "Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work";
const STYLE = "warm hand-drawn storybook style, dark olive-brown outline, one flat shade with the light from the upper left, transparent ground, no shadow, no text.";
const BABY = "the family's baby (a cream gown, a little dark hair, a round face with a flushed cheek, bare hands and feet)";
const BABY_COMPARE = [['infant-awake', 0.45], ['infant-idle-e', 0.45], ['girl-idle-e', 0.7]];
// The baby's frames are drawn at the infant's scale (compare.mjs draws them at 0.45 of a person, as the game does).
// The baby's head is drawn the size of her basket baby's (about a quarter of the logical height); the whole frame a quarter
// larger again so a crawling baby, which has no basket round it, still reads at a person of 40 px. ceiling: her storybook baby
// already has a big head; a baby that looks too big beside her basket row would want this back at 1.
export const BABY_FRAME_SCALE = 1.25;
const babyFrame = (name, draw, note) => () => personFrame(name, draw, { note, scale: BABY_FRAME_SCALE });

const CRAWL = ['the near hand reaching forward with the far knee, the other hand and knee back', 'passing, the body lifted, the head up looking ahead', 'the far hand forward with the near knee', 'passing again'];
const crawl = (facing, suffix) => [0, 1, 2, 3].map(step => ({
  name: `infant-crawl${suffix}-${step + 1}`, height: 0.45, compare: BABY_COMPARE,
  prompt: `${BABY} crawling on hands and knees, side on facing ${facing > 0 ? 'east' : 'west'}, frame ${step + 1} of 4: ${CRAWL[step]}; the gown over the body, the soles of the feet up behind, the head raised. Sized against Astra's infant in the basket. ${STYLE}`,
  draw: babyFrame(`infant-crawl${suffix}-${step + 1}`, ink => drawBaby(ink, 'crawl', { step, facing }), `the baby crawling ${facing > 0 ? 'east' : 'west'}, frame ${step + 1}: ${CRAWL[step]}`),
}));
const CRY = [['fists up by the face, the mouth wide open, the eyes squeezed shut', { fists: 1, mouth: 1 }], ['the fists a little lower, drawing breath, the mouth half open', { fists: 0.55, mouth: 0.6 }]];

export const INFANT_FRAMES = [
  ...crawl(1, ''), ...crawl(-1, '-w'),
  ...CRY.map(([what, opts], i) => ({ name: `infant-cry-${i + 1}`, height: 0.45, compare: BABY_COMPARE,
    prompt: `${BABY} sitting up on the ground, three-quarter toward the camera, legs out in front, crying, frame ${i + 1} of 2: ${what}. Nothing more than that - no tears streaming, no red face: a baby wanting to be picked up. ${STYLE}`,
    draw: babyFrame(`infant-cry-${i + 1}`, ink => drawBaby(ink, 'sit', { s: 1.25, ...opts }), `the baby sitting up crying, frame ${i + 1}: ${what}`) })),
  { name: 'infant-sleep-1', height: 0.45, compare: BABY_COMPARE,
    prompt: `${BABY} asleep, curled on its side on a folded blue-grey blanket laid on the ground, the eyes closed, a hand by the face; seen three-quarter from above. ${STYLE}`,
    draw: babyFrame('infant-sleep-1', ink => drawBaby(ink, 'sleep'), 'the baby asleep, curled on a folded blanket') },
];

// Every cast figure holds the baby: the four women first (the request's), then the four men ("less often seen").
export const HOLDERS = ['rust-woman', 'teal', 'indigo', 'blue-girl', 'rust', 'elder', 'blue', 'ochre'];
const WALK = ['the near foot forward, the far arm swinging back', 'passing, upright', 'the far foot forward, the far arm swinging forward', 'passing'];
function holdFrames(figure) {
  const F = frameOf(figure), who = `${figure}, the same person, face, hair, hat and clothes as Astra's ${figure} sheets,`;
  const compare = [[`${figure}-idle-s`, 1], [`${figure}-carry-1`, 1], ['infant-awake', 0.45]];
  const out = [];
  holdBabyPoses(F).forEach((pose, i) => out.push({ name: `${figure}-hold-baby-${i + 1}`, compare,
    prompt: `${who} standing facing the camera holding the baby up to the shoulder (the baby in a small blue-grey shawl, its head on the shoulder turned outward, asleep), one arm under it and a hand on its back, frame ${i + 1} of 2 of a slow sway: the weight ${i ? 'onto the left foot' : 'onto the right foot'}. ${STYLE}`,
    draw: () => personFrame(`${figure}-hold-baby-${i + 1}`, ink => drawHoldBaby(ink, figure, pose), { note: `${figure} holding the baby to the shoulder, swaying, frame ${i + 1}` }) }));
  carryBabyPoses(F).forEach((pose, i) => out.push({ name: `${figure}-carry-baby-walk-${i + 1}`, compare: [[`${figure}-walk-1`, 1], [`${figure}-carry-1`, 1]],
    prompt: `${who} walking side on facing east with the baby on the near hip (the baby in a small blue-grey shawl, sitting astride, facing forward), the near arm round it, frame ${i + 1} of 4: ${WALK[i]}. ${STYLE}`,
    draw: () => personFrame(`${figure}-carry-baby-walk-${i + 1}`, ink => drawCarryBaby(ink, figure, pose), { note: `${figure} walking with the baby on the hip, frame ${i + 1}: ${WALK[i]}` }) }));
  for (const view of ['s', 'n']) carryBabyFrontal(F, view).forEach((pose, i) => out.push({ name: `${figure}-carry-baby-walk-${view}-${i + 1}`, compare: [[`${figure}-walk-${view}-1`, 1]],
    prompt: `${who} walking ${view === 's' ? 'toward' : 'away from'} the camera with the baby on the hip (in a small blue-grey shawl; ${view === 's' ? 'its face toward us' : 'the back of its head over her side'}), an arm round it, frame ${i + 1} of 2: the ${i ? 'right' : 'left'} foot forward. ${STYLE}`,
    draw: () => personFrame(`${figure}-carry-baby-walk-${view}-${i + 1}`, ink => drawCarryBabyFrontal(ink, figure, pose), { note: `${figure} walking ${view === 's' ? 'south' : 'north'} with the baby on the hip, frame ${i + 1}` }) }));
  return out;
}

export const SHEETS = {
  'claude-infant': { cell: { w: 400, h: 400 }, columns: 4, request: REQUEST, replaceWith: 'item 2: the infant\'s own logical height and ground anchor, as `infant-idle-*`; the crawl 4 frames east (and west), the cry 2, asleep 1', frames: INFANT_FRAMES },
  'claude-hold-baby-women': { cell: { w: 400, h: 400 }, columns: 10, request: REQUEST, replaceWith: 'item 3: -hold-baby (2, south) and -carry-baby-walk (4 east, 2 -s, 2 -n), the cast figure\'s own logical height and foot baseline', frames: HOLDERS.slice(0, 4).flatMap(holdFrames) },
  'claude-hold-baby-men': { cell: { w: 400, h: 400 }, columns: 10, request: REQUEST, replaceWith: 'item 3: -hold-baby (2, south) and -carry-baby-walk (4 east, 2 -s, 2 -n), the cast figure\'s own logical height and foot baseline', frames: HOLDERS.slice(4).flatMap(holdFrames) },
};

const clip = (sprites, durations, motion, direction, prompt) => ({ frames: sprites.map((sprite, i) => ({ sprite, duration: durations[i] })), loop: true, motion, direction, prompt });
export const CLIPS = {
  'infant-crawl': clip([1, 2, 3, 4].map(n => `infant-crawl-${n}`), [260, 220, 260, 220], 'none', 'east; west by infant-crawl-w', 'The baby crawling east on hands and knees, the diagonal pairs moving together, the body lifting at the passes, looping slowly.'),
  'infant-crawl-w': clip([1, 2, 3, 4].map(n => `infant-crawl-w-${n}`), [260, 220, 260, 220], 'none', 'west', 'The baby crawling west (drawn west, the light kept upper left), the diagonal pairs moving together, looping slowly.'),
  'infant-cry': clip(['infant-cry-1', 'infant-cry-2'], [520, 380], 'none', 'south', 'The baby sitting up crying: fists up and the mouth wide, then drawing breath, looping; the page says "(crying)" beside it.'),
  'infant-sleep': clip(['infant-sleep-1'], [3200], 'breathe', 'east; west by mirroring', 'The baby asleep on its blanket, held still with the renderer\'s slow breathing.'),
  ...Object.fromEntries(HOLDERS.flatMap(figure => [
    [`${figure}-hold-baby`, clip([`${figure}-hold-baby-1`, `${figure}-hold-baby-2`], [950, 950], 'sway', 'south', `${figure} holding the baby to the shoulder and swaying slowly from foot to foot, singing it quiet.`)],
    [`${figure}-carry-baby-walk`, clip([1, 2, 3, 4].map(n => `${figure}-carry-baby-walk-${n}`), [190, 190, 190, 190], 'none', 'east; west by mirroring', `${figure} walking with the baby on the near hip, at the cast carry cycle's pace.`)],
    [`${figure}-carry-baby-walk-s`, clip([1, 2].map(n => `${figure}-carry-baby-walk-s-${n}`), [220, 220], 'none', 'south', `${figure} walking toward the camera with the baby on the hip, at her vertical walk's pace.`)],
    [`${figure}-carry-baby-walk-n`, clip([1, 2].map(n => `${figure}-carry-baby-walk-n-${n}`), [220, 220], 'none', 'north', `${figure} walking away from the camera with the baby on the hip, at her vertical walk's pace.`)],
  ])),
};

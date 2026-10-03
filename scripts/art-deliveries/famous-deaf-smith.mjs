// Original game interpretation of Erastus "Deaf" Smith; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-deaf-smith': [
    ...[1, 2, 3, 4].map(n => `deaf-smith-walk-e-${n}`),
    ...[1, 2].map(n => `deaf-smith-walk-s-${n}`),
    ...[1, 2].map(n => `deaf-smith-walk-n-${n}`),
    'deaf-smith-idle', 'deaf-smith-report', 'deaf-smith-point', 'deaf-smith-read-dispatch',
    'deaf-smith-track', 'deaf-smith-wounded-seated', 'deaf-smith-axe-ready', 'deaf-smith-axe-chop',
  ],
  'famous-deaf-smith-mounted': ['deaf-smith-mounted-walk-e-1', 'deaf-smith-mounted-walk-e-2', 'deaf-smith-mounted-idle-e', 'deaf-smith-mounted-idle-s'],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`deaf-smith-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `deaf-smith-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['deaf-smith-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `deaf-smith-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
ANIMATION_CLIPS['deaf-smith-axe-work'] = {
  frames: [{ sprite: 'deaf-smith-axe-ready', duration: 400 }, { sprite: 'deaf-smith-axe-chop', duration: 300 }],
  loop: false, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-deaf-smith', promptId: 'frontier-v1/famous-deaf-smith', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 4x4 painterly ink-line Texas Revolution game atlas. Original interpretive Erastus Deaf Smith, lean weathered scout with medium-tan face, dark beard graying at chin, narrow dark olive hat, light buckskin jacket, sage vest, rust-red neckcloth, dark trousers, shoulder satchel. Same identity in 16 isolated equal cells with broad clear alpha gutters. Four east walks; two south and two north walks; idle, quiet report, point along trail, read captured dispatch; kneel to inspect tracks, seated non-graphic shoulder wound, small axe ready, small axe chop against unseen timber. No disability caricature, hand cupped to ear, extra people, writing, scenery, grid, blood or portrait claim.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-moore.png'],
    generatedSourcePath: `${root}exec-a8656d3b-cc48-4ea1-ad57-469b4059eb25.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-deaf-smith.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Buckskin, sage and red-neckcloth scout silhouette; report, tracking, dispatch, non-graphic wound and optional bridge axe frames.',
  },
  {
    sheet: 'famous-deaf-smith-mounted', promptId: 'frontier-v1/famous-deaf-smith-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 mounted companion preserving the supplied Deaf Smith face, olive hat, buckskin jacket, sage vest, rust-red neckcloth and satchel. Same sandy buckskin horse with dark mane and tail, white near-hind sock, plain trail saddle and rolled blanket in all four equal cells: east walking steps A and B with alternating legs, east halt, south halt. Match the supplied game horse/rider painterly style and scale with broad alpha gutters. No other people, words, flags, ground, scenery, grid, blood or portrait claim.',
    referenced_image_paths: [`${root}exec-a8656d3b-cc48-4ea1-ad57-469b4059eb25.png`, 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-seguin-mounted-motion.png'],
    generatedSourcePath: `${root}exec-2cc7e493-a0cd-4771-9adb-126d7d2fb4e3.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-deaf-smith-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Dedicated horse and rider travel for the Grass Fight alarm and Vince’s Bridge party; horse appearance is an artistic interpretation.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Deaf Smith has directional foot and mounted travel, report and tracking poses, and a non-graphic wound. The axe cycle is available for later Vince’s Bridge staging but does not by itself introduce a bridge scene or decide whose idea the destruction was.'];

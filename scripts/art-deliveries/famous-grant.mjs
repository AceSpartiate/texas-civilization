// Original game interpretation of James Grant; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-grant': [
    ...[1, 2, 3, 4].map(n => `grant-walk-e-${n}`),
    ...[1, 2].map(n => `grant-walk-s-${n}`),
    ...[1, 2].map(n => `grant-walk-n-${n}`),
    'grant-idle', 'grant-point-herd', 'grant-read-map', 'grant-satchel',
    'grant-call', 'grant-track', 'grant-bandaged-seated', 'grant-arm-sling',
  ],
  'famous-grant-mounted': ['grant-mounted-walk-e-1', 'grant-mounted-walk-e-2', 'grant-mounted-idle-e', 'grant-mounted-idle-s'],
  'famous-grant-gallop': [1, 2, 3, 4].map(n => `grant-mounted-gallop-e-${n}`),
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`grant-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `grant-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['grant-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `grant-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
ANIMATION_CLIPS['grant-mounted-gallop-e'] = {
  frames: [1, 2, 3, 4].map(n => ({ sprite: `grant-mounted-gallop-e-${n}`, duration: 135 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-grant', promptId: 'frontier-v1/famous-grant', tool: 'built-in image_gen.imagegen', mode: 'edit',
    prompt: 'Transparent 4x4 painterly elevated game atlas of original interpretive James Grant, slender sandy-haired frontier doctor in moss hat, tan coat, dark green vest, burgundy neckcloth, olive trousers and satchel. Four east walks, two south and two north, idle, point herd, read map, satchel, call, track, clean bandaged seated shoulder and arm sling. Same identity, wide alpha gutters. Edited the generated sheet to remove visible blood; no portrait or death pose claim.',
    referenced_image_paths: [`${root}exec-52f9abcb-99c8-48dc-99fb-7a720c738942.png`],
    generatedSourcePath: `${root}exec-2d227500-132b-4790-bc23-b7c0149096fc.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-grant.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Travel, map and non-graphic Bexar-wound variants; no killed or captive pose because the later fate is told, not shown.',
  },
  {
    sheet: 'famous-grant-mounted', promptId: 'frontier-v1/famous-grant-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 mounted Grant companion preserving the foot-sheet identity and same smoky grullo horse with dark mane/tail and plain trail tack. Two east walk gait frames, east idle, south idle. Full cutouts and alpha margins; no background or portrait claim.',
    referenced_image_paths: [`${root}exec-2d227500-132b-4790-bc23-b7c0149096fc.png`],
    generatedSourcePath: `${root}exec-29266921-c917-4885-b2a7-e34f33fd6422.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-grant-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Identity-preserving mounted travel for the horse herd route.',
  },
  {
    sheet: 'famous-grant-gallop', promptId: 'frontier-v1/famous-grant-gallop', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 four-frame eastward gallop cycle preserving the mounted Grant rider and smoky grullo horse identity, with alternating gathered/stretching legs and a look-back beat. No pursuer, capture, fall, death or background.',
    referenced_image_paths: [`${root}exec-29266921-c917-4885-b2a7-e34f33fd6422.png`],
    generatedSourcePath: `${root}exec-c6621715-50ce-46af-9c3b-1f55f27985d6.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-grant-gallop.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Fast ride while Grant remains visible during the existing Agua Dulce pursuit; later fate remains off-screen.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Grant has foot travel, mounted walking and a separate four-frame gallop. The scene stops drawing him before the later surrender and killing, which continue to be conveyed only in text.'];

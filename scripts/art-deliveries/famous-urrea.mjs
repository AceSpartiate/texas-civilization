// Original game interpretation of José de Urrea; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-urrea': [
    ...[1, 2, 3, 4].map(n => `urrea-walk-e-${n}`),
    ...[1, 2].map(n => `urrea-walk-s-${n}`),
    ...[1, 2].map(n => `urrea-walk-n-${n}`),
    'urrea-idle', 'urrea-command', 'urrea-point', 'urrea-map',
    'urrea-dispatch', 'urrea-address', 'urrea-receive-paper', 'urrea-rest',
  ],
  'famous-urrea-mounted': ['urrea-mounted-walk-e-1', 'urrea-mounted-walk-e-2', 'urrea-mounted-idle-e', 'urrea-mounted-idle-s'],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`urrea-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `urrea-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['urrea-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `urrea-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-urrea', promptId: 'frontier-v1/famous-urrea', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'New transparent 4x4 painterly ink-line game sprite atlas at the established Texas Revolution scale. Original interpretation of José de Urrea in the 1836 south Texas campaign: tall slender middle-aged Mexican officer, olive-brown complexion, angular face, dark sideburns and fine moustache, black bicorne with small pale-green cockade, long deep indigo-violet coat, restrained gold epaulettes, pale-blue diagonal sash, cream breeches and black boots. Distinct from Cos, Castañeda and Santa Anna. Same identity across 16 isolated equal cells with broad alpha gutters. Four east walks; two south and two north walks; idle, command, point, field map; dispatch, address subordinate, receive paper, rest. No other figures, text, flag, scenery, grid, gore or portrait claim.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-castaneda.png'],
    generatedSourcePath: `${root}exec-a066890d-34b1-4989-b714-5a05631d60ff.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-urrea.png',
    postProcessing: 'ImageGen gutter correction from first draft; corrected sheet copied unchanged. Atlas builder measures alpha components and reading-order cells.',
    review: 'A distinct bicorne, deep-indigo coat and pale-blue sash establish Urrea across the southern campaign scenes.',
  },
  {
    sheet: 'famous-urrea-mounted', promptId: 'frontier-v1/famous-urrea-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'New transparent 2x2 mounted companion preserving the supplied Urrea face, bicorne with pale-green feather, deep indigo-violet coat and pale-blue sash. Same dark bay horse with black mane and tail and two white hind socks in all cells, simple 1830s tack. East walk A with one diagonal leg pair forward, east walk B with opposite pair forward, east halt, south halt. Match the supplied game painterly horse-and-rider scale and broad true-alpha cell gutters. No other people, text, grid, scenery, gore or exact historical likeness claim.',
    referenced_image_paths: [`${root}exec-6cb8d87f-3f20-4d44-a193-6a2682b2ca3e.png`, 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-castaneda-mounted.png'],
    generatedSourcePath: `${root}exec-7fd22476-39ab-42aa-9d79-0e4e6cc89128.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-urrea-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Dedicated mounted travel and halt for Agua Dulce and Coleto; mount appearance is artistic interpretation.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Urrea has directional foot travel, field and dispatch gestures, and a two-frame mounted walk. Existing battle projections own his location, timing and outcome.'];

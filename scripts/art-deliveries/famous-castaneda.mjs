// Original game interpretation of Francisco de Castañeda; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-castaneda': [
    ...[1, 2, 3, 4].map(n => `castaneda-walk-e-${n}`),
    ...[1, 2].map(n => `castaneda-walk-s-${n}`),
    ...[1, 2].map(n => `castaneda-walk-n-${n}`),
    'castaneda-idle', 'castaneda-halt', 'castaneda-parley', 'castaneda-read-orders',
    'castaneda-listen', 'castaneda-withdraw', 'castaneda-look', 'castaneda-at-ease',
  ],
  'famous-castaneda-mounted': ['castaneda-mounted-walk-e-1', 'castaneda-mounted-walk-e-2', 'castaneda-mounted-idle-e', 'castaneda-mounted-idle-s'],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`castaneda-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `castaneda-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['castaneda-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `castaneda-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-castaneda', promptId: 'frontier-v1/famous-castaneda', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 4x4 painterly ink-line game sprite atlas. Original interpretation of Lieutenant Francisco de Castañeda at Gonzales in 1835, distinct from Cos: lean younger Mexican dragoon officer, medium-brown complexion, close black hair, pointed moustache, dark navy short cavalry jacket with red standing collar and cuffs, brass crossbelt, tan trousers, black knee boots, tall black dragoon helmet with brass crest and short red plume. Same identity in all 16 equal cells with broad alpha gutters. Four east walking steps; two south and two north walking steps; idle, cautious halt, speaking at parley, reading orders; listening, signaling withdrawal, looking toward other bank, standing at ease. No horse, extra figures, text, grid, scenery, gore, or exact portrait claim.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-cos.png'],
    generatedSourcePath: `${root}exec-9c5837c2-5d3f-4698-aab8-aa849e70ec67.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-castaneda.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Dragoon helmet and short cavalry jacket give Castañeda a distinct silhouette at Gonzales.',
  },
  {
    sheet: 'famous-castaneda-mounted', promptId: 'frontier-v1/famous-castaneda-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 mounted companion preserving the supplied Castañeda face, dragoon helmet and navy/red uniform; same chestnut horse with black mane and tail, white nose marking and simple period tack in all four cells. East walking step A and B, east halt, south halt. Match the supplied game horse and rider scale and painterly ink lines. One complete figure per equal cell with broad clear alpha gutters. No extra figure, text, grid, scenery, gore or exact historical portrait claim.',
    referenced_image_paths: [`${root}exec-9c5837c2-5d3f-4698-aab8-aa849e70ec67.png`, 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-cos-mounted.png'],
    generatedSourcePath: `${root}exec-3663bf07-018e-45fc-933a-51abb7bcd6e3.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-castaneda-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Own chestnut mount and two-step travel clip for Gonzales arrival and withdrawal.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Castañeda has directional foot movement and Gonzales parley and withdrawal gestures, plus his own mounted walk and halt. The simulation owns the historical words and outcome.'];

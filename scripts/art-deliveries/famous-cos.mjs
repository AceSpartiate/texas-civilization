// Original game interpretation of Martín Perfecto de Cos; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-cos': [
    ...[1, 2, 3, 4].map(n => `cos-walk-e-${n}`),
    ...[1, 2].map(n => `cos-walk-s-${n}`),
    ...[1, 2].map(n => `cos-walk-n-${n}`),
    'cos-idle', 'cos-command', 'cos-point', 'cos-map',
    'cos-sign-terms', 'cos-hand-document', 'cos-sword-down', 'cos-prisoner',
  ],
  'famous-cos-mounted': ['cos-mounted-walk-e-1', 'cos-mounted-walk-e-2', 'cos-mounted-idle-e', 'cos-mounted-idle-s'],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`cos-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `cos-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['cos-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `cos-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-cos', promptId: 'frontier-v1/famous-cos', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 4x4 game sprite atlas in the established painterly ink-line Texas Revolution style. Original interpretation of Martín Perfecto de Cos: mature compact officer, medium-brown complexion, black swept-back hair and neat dark moustache, tall dark shako with brass badge, blue-green frock coat with brass buttons and red cuffs, pale crossbelt, cream trousers, dark boots. Same identity and scale in every cell. Four east walking steps; two south and two north walking steps; idle, restrained command, point, study folded map; sign capitulation paper, hand over signed paper, sword lowered while agreeing terms, calm prisoner with empty hands. Broad true-alpha gutters. No additional people, writing, scenery, grid, gore, or historical portrait claim.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-santa-anna.png'],
    generatedSourcePath: `${root}exec-db844c2b-3302-431d-a63e-2bce8b4af95b.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-cos.png',
    postProcessing: 'ImageGen gutter correction from first draft; corrected sheet copied unchanged. Atlas builder measures alpha components and reading-order cells.',
    review: 'Distinct crossbelt and shako silhouette; command, capitulation and prisoner poses stay available to historically dated scenes.',
  },
  {
    sheet: 'famous-cos-mounted', promptId: 'frontier-v1/famous-cos-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 mounted companion atlas preserving Cos from the supplied foot sheet: same medium-brown face, dark moustache, shako, blue-green coat, red cuffs, pale crossbelt, cream trousers. Same compact iron-grey horse with dark mane and tail and simple military tack in all four cells. East walking step A, east walking step B, east halt, south halt. Match game horse-rider scale and painterly outlines, isolated complete figures in broad alpha gutters. No extra people, labels, grid, scenery, gore, or portrait claim.',
    referenced_image_paths: [`${root}exec-f0ef9f94-bf6a-442d-85ff-63c498f8ccef.png`, 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-santa-anna-mounted.png'],
    generatedSourcePath: `${root}exec-0854f310-00eb-4911-be39-b45974b84aef.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-cos-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Distinct iron-grey mount and two-step walking clip for Cos at Béxar and San Jacinto.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Cos has directional foot movement, command and document gestures, a prisoner pose, and his own mounted walk. Battle dates and outcomes remain simulation-owned.'];

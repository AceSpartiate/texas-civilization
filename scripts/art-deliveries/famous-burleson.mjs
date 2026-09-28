// Original game interpretation of Edward Burleson; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-burleson': [
    ...[1, 2, 3, 4].map(n => `burleson-walk-e-${n}`),
    ...[1, 2].map(n => `burleson-walk-s-${n}`),
    ...[1, 2].map(n => `burleson-walk-n-${n}`),
    'burleson-idle', 'burleson-command', 'burleson-point', 'burleson-listen',
    'burleson-receive-sword', 'burleson-sword-down', 'burleson-read-note', 'burleson-rest',
  ],
  'famous-burleson-mounted': ['burleson-mounted-walk-e-1', 'burleson-mounted-walk-e-2', 'burleson-mounted-idle-e', 'burleson-mounted-idle-s'],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`burleson-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `burleson-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['burleson-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `burleson-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-burleson', promptId: 'frontier-v1/famous-burleson', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 4x4 painterly game sprite atlas using the established Texas Revolution palette. Original interpretive Edward Burleson, sturdy older commander with graying beard, broad brown hat, muted olive-brown frontier coat and tan waistcoat. Same identity and full-body scale across cells. Four east walks, two south walks, two north walks; idle, calm command, point, listen; receive a sheathed sword, hold sword down, read a note, seated rest. Isolated cells and broad true-alpha gutters. No extra people, text, scenery, grid, gore or portrait claim.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-travis.png'],
    generatedSourcePath: `${root}exec-76383f06-9718-48d2-aef6-f5b9abcdab55.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-burleson.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Distinct older volunteer commander with both field-command and surrender-reception gestures.',
  },
  {
    sheet: 'famous-burleson-mounted', promptId: 'frontier-v1/famous-burleson-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 companion sheet preserving the supplied Burleson face, broad hat, olive-brown coat and tan waistcoat. Burleson riding the same dark bay horse with black mane and small white forehead star in every cell: east walk A, east walk B, east halt, south halt. Match the supplied game horse-rider scale and painterly style with broad alpha gutters. No other people, text, grid, scenery, gore or exact likeness claim.',
    referenced_image_paths: [`${root}exec-76383f06-9718-48d2-aef6-f5b9abcdab55.png`, 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-houston-mounted.png'],
    generatedSourcePath: `${root}exec-2d04777c-1a1f-4914-81ab-ea8ded779bc1.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-burleson-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Own horse and two-step mounted walk for Béxar arrival; horse appearance is an artistic interpretation.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Burleson has directional walking, field-command and sword-reception gestures, plus a mounted walk and halt. The simulation retains control of location and phase.'];

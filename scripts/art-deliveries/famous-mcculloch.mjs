// Original game interpretation of Ben McCulloch; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-mcculloch': [
    ...[1, 2, 3, 4].map(n => `mcculloch-walk-e-${n}`),
    ...[1, 2].map(n => `mcculloch-walk-s-${n}`),
    ...[1, 2].map(n => `mcculloch-walk-n-${n}`),
    'mcculloch-idle', 'mcculloch-hold-shot', 'mcculloch-ram', 'mcculloch-step-back',
    'mcculloch-inspect', 'mcculloch-brace', 'mcculloch-powder-pouch', 'mcculloch-listen',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`mcculloch-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `mcculloch-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['mcculloch-gun-service'] = {
  frames: [{ sprite: 'mcculloch-hold-shot', duration: 420 }, { sprite: 'mcculloch-ram', duration: 360 }, { sprite: 'mcculloch-brace', duration: 300 }],
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [{
  sheet: 'famous-mcculloch', promptId: 'frontier-v1/famous-mcculloch', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 4x4 elevated painterly Texas Revolution game atlas of original interpretive young Ben McCulloch, lean sun-browned volunteer in dark olive slouch hat, ochre buckskin work coat, indigo shirt, faded red bandanna, dark trousers, boots and powder pouch. Four east walks, two south, two north, then idle, hold round shot, ram unseen cannon, step back, inspect vent, brace, reach pouch and listen. Same full-body identity, wide true-alpha gutters, no cannon, ground, text or exact portrait claim.',
  generatedSourcePath: `${root}exec-21888220-4973-4b01-b3f8-589ea6c1a16f.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-mcculloch.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'Named physical service cycle for one Twin Sister, visually distinct from Hockley commanding the battery.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['McCulloch has directional walking and a three-frame gun-service cycle at San Jacinto. The simulation retains the historical shots and gun positions.'];

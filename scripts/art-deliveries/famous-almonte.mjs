// Original game interpretation of Juan Nepomuceno Almonte; no portrait claim.
const name = 'almonte';
export const SHEETS = {
  'famous-almonte': [
    ...[1, 2, 3, 4].map(n => `${name}-walk-e-${n}`),
    ...[1, 2].map(n => `${name}-walk-s-${n}`),
    ...[1, 2].map(n => `${name}-walk-n-${n}`),
    'almonte-idle', 'almonte-journal', 'almonte-command', 'almonte-surrender',
    'almonte-offer-sword', 'almonte-prisoner', 'almonte-interpret', 'almonte-listen',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`almonte-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `almonte-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
export const promptEntries = [{
  sheet: 'famous-almonte', promptId: 'frontier-v1/famous-almonte', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 4x4 production sprite atlas in the established painterly Texas Revolution style. Original interpretive Juan Nepomuceno Almonte, medium warm-brown complexion, dark short hair and neat sideburns, early nineteenth-century Mexican dark-blue staff-officer frock coat with red collar and restrained gold trim, pale trousers and dark boots, no hat. Identical identity and scale in sixteen isolated full-body cells. Row 1 four east walk steps; row 2 two south then two north walk steps; row 3 idle, journal writing, command gesture, empty open-hand surrender; row 4 offering sheathed sword by hilt, prisoner with hands before body, interpretive gesture with small paper, listen. No other people, text, grid, ground, scenery, gore or exact portrait claim; true alpha gutters.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-travis.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-29f825d0-b156-4a43-91d2-99eb8aa69d51.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/famous-almonte.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'Distinct no-hat staff officer with authored surrender, sword offer and interpreter gestures. Costume and face are game interpretations. These gestures do not add a historical line of dialogue.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Almonte has directional walking and eight story poses. San Jacinto phases and information claims remain simulation-owned.'];

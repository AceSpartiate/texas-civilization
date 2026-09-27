// Francita Alavez game interpretation for Goliad. Appearance is not a portrait claim.
const name = 'alavez';
export const SHEETS = {
  'famous-alavez': [
    ...[1, 2, 3, 4].map(n => `${name}-walk-e-${n}`),
    ...[1, 2].map(n => `${name}-walk-s-${n}`),
    ...[1, 2].map(n => `${name}-walk-n-${n}`),
    'alavez-idle-e', 'alavez-idle-s', 'alavez-speak', 'alavez-listen',
    'alavez-reach-door', 'alavez-beckon', 'alavez-guide', 'alavez-rest',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`alavez-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `alavez-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
export const promptEntries = [{
  sheet: 'famous-alavez', promptId: 'frontier-v1/famous-alavez', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Original transparent 4x4 historical game atlas of one adult Mexican woman representing Francita Alavez, dark braid, deep plum long skirt, cream blouse, dark teal rebozo. Four east walks, two south, two north; idle east/south, speak, listen; reach toward a side door, beckon, guide, sit at rest. Sixteen distinct full-body poses with consistent identity and broad alpha gutters. No guards, soldiers, additional figures, weapon, text, scenery or likeness claim.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-emily-west.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-d01a51f7-694a-4dc6-97c2-4783b548a60c.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/famous-alavez.png',
  postProcessing: 'None. Generated PNG copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'Distinct, noncombatant animated identity and story gestures for the existing Goliad scene. Costume and face are artistic interpretations.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Francita Alavez has directional walking and eight quiet story poses. Goliad timing and visibility still come from the simulation.'];

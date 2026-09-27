// Original game interpretations. Neither sheet claims a verified likeness or exact gun transport rig.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-ben': [...[1, 2, 3, 4].map(n => `ben-walk-e-${n}`), ...[1, 2].map(n => `ben-walk-s-${n}`), ...[1, 2].map(n => `ben-walk-n-${n}`), 'ben-idle', 'ben-idle-s', 'ben-speak', 'ben-look-back', 'ben-pot-carry', 'ben-pot-set-down', 'ben-offer-water', 'ben-rest'],
  'twin-sisters-limbered': ['twin-sisters-roll-1', 'twin-sisters-roll-2', 'twin-sisters-halt', 'twin-sisters-turn'],
};
export const ANIMATION_CLIPS = {
  'twin-sisters-limbered': { frames: [1, 2].map(n => ({ sprite: `twin-sisters-roll-${n}`, duration: 300 })), loop: true, authored: true, motion: 'none', direction: 'east; mirror for west' },
};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`ben-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `ben-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
export const promptEntries = [
  { sheet: 'famous-ben', promptId: 'frontier-v1/famous-ben', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Original transparent 4x4 historical game atlas of Ben, an approximately thirty-year-old cook, cream rolled shirt, brown waistcoat, gray apron, tan trousers. Four east walking frames, two south and two north, then idle/speak/look back, then carrying and setting down a cooking pot, offering water, and resting. Consistent identity, transparent gutters, no text.', generatedSourcePath: `${root}exec-4b627ba5-2c5d-4e1c-b0ca-a78dde98cd26.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-ben.png', postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.', review: 'Original depiction for the walk to Gonzales. Outfit and appearance are interpretation, not a portrait claim.' },
  { sheet: 'twin-sisters-limbered', promptId: 'frontier-v1/twin-sisters-limbered', tool: 'built-in image_gen.imagegen', mode: 'edit', prompt: 'Repaint the existing transparent 2x2 paired Twin Sisters road atlas. Preserve both guns and all four compositions, but give both guns matching red carriage cheeks, blue wheel rims and hubs, and restrained red-blue trail bands. Leave iron barrels dark and most wood brown. No people, horses, flags, text, scenery or background.', referenced_image_paths: [`${root}exec-3fc5f880-37f7-4b29-ab6c-aed234767f4f.png`, `${root}exec-e1ffe4d6-6fd8-4052-ad7b-f6a17c7e22c7.png`], generatedSourcePath: `${root}exec-4bf342f0-e1ef-40bb-83db-658901765c47.png`, runtimeFile: 'public/assets/frontier-v1/atlases/twin-sisters-limbered.png', postProcessing: 'None. Edited PNG copied unchanged; atlas builder measures alpha components and reading-order cells.', review: 'The paired map asset matches the red-blue field variant; color is artistic identification, not a documented paint scheme or hauling method.' },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Ben now has directional walking, cook actions and rest poses. The Twin Sisters have a paired rolling animation and halt/turn key poses for the campaign map.'];

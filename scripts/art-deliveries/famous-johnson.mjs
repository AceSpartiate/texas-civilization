// Original game interpretation of Francis W. Johnson; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-johnson': [
    ...[1, 2, 3, 4].map(n => `johnson-walk-e-${n}`),
    ...[1, 2].map(n => `johnson-walk-s-${n}`),
    ...[1, 2].map(n => `johnson-walk-n-${n}`),
    'johnson-idle', 'johnson-point', 'johnson-gather', 'johnson-map',
    'johnson-escape-e-1', 'johnson-escape-e-2', 'johnson-door-crouch', 'johnson-look-back',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`johnson-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `johnson-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['johnson-command'] = {
  frames: [{ sprite: 'johnson-point', duration: 480 }, { sprite: 'johnson-gather', duration: 540 }],
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
ANIMATION_CLIPS['johnson-escape-e'] = {
  frames: [1, 2].map(n => ({ sprite: `johnson-escape-e-${n}`, duration: 175 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [{
  sheet: 'famous-johnson', promptId: 'frontier-v1/famous-johnson', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 4x4 painterly game atlas of original interpretive Francis White Johnson, slim middle-aged dark-haired mustached officer in charcoal hat, pale gray frock, dark blue vest, cream shirt, rust-red neckcloth, brown trousers and black boots. Four east walks, two south and two north, idle, division point, gather, map, two east running frames, door crouch and look back. Equal isolated full-body cells with clear alpha gutters; no background, words, weapon firing or exact portrait claim.',
  generatedSourcePath: `${root}exec-2af4c8cb-181e-4d1d-8d62-30b78aacd8fa.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-johnson.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'Dedicated Béxar command loop and San Patricio back-door escape gait, with historical route and timing owned by the simulation.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Johnson has directional travel, a two-frame command loop and a quicker two-frame escape cycle. His San Patricio escape follows the existing back-door group path.'];

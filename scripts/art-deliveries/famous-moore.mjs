// Original game interpretation of John Henry Moore; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-moore': [
    ...[1, 2, 3, 4].map(n => `moore-walk-e-${n}`),
    ...[1, 2].map(n => `moore-walk-s-${n}`),
    ...[1, 2].map(n => `moore-walk-n-${n}`),
    'moore-idle', 'moore-point', 'moore-parley', 'moore-listen',
    'moore-command', 'moore-read-note', 'moore-field-glass', 'moore-at-ease',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`moore-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `moore-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
export const promptEntries = [{
  sheet: 'famous-moore', promptId: 'frontier-v1/famous-moore', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 4x4 painterly ink-line game sprite atlas, same human scale as the Texas Revolution reference. Original interpretive John Henry Moore at Gonzales in 1835, not a portrait: strong middle-aged man, olive-tan complexion, shoulder-length dark hair, fuller dark beard, weathered olive-brown felt hat, faded clay-brown civilian field coat over cream shirt, muted blue neckerchief, tan trousers and dark boots. Consistent identity in 16 equal cells with broad true-alpha gutters. Four east walking steps; two south and two north walking steps; idle, point toward river, open-hand parley, listen; command nearby militia, hold note, look through field glass, stand at ease. No second figure, horse, text, grid, scenery, gore, or exact likeness claim.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-burleson.png'],
  generatedSourcePath: `${root}exec-7268ebf0-1bd8-4907-bf51-d36bcce64ed5.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-moore.png',
  postProcessing: 'ImageGen gutter correction from first draft; corrected sheet copied unchanged. Atlas builder measures alpha components and reading-order cells.',
  review: 'Distinct dark-bearded militia commander with parley and field-command poses for Gonzales.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Moore has directional walking and documented Gonzales parley and command gestures. No new words or event outcomes are introduced by the art.'];

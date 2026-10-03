// Original game interpretation of Stephen F. Austin; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-austin': [
    ...[1, 2, 3, 4].map(n => `austin-walk-e-${n}`),
    ...[1, 2].map(n => `austin-walk-s-${n}`),
    ...[1, 2].map(n => `austin-walk-n-${n}`),
    'austin-idle', 'austin-command', 'austin-point', 'austin-speak',
    'austin-read-letter', 'austin-write', 'austin-map', 'austin-rest',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`austin-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `austin-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
export const promptEntries = [{
  sheet: 'famous-austin', promptId: 'frontier-v1/famous-austin', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 4x4 painterly ink-line game sprite atlas in the established Texas Revolution human scale and elevated camera. Original interpretive Stephen F. Austin in the 1835 volunteer campaign, not an exact portrait: slender middle-aged man, pale complexion, long narrow clean-shaven face, swept-back dark brown hair with receding temples, sober charcoal broad-brim civilian hat, muted dark-green long frock coat, tan waistcoat, white neck stock, brown trousers, dark boots. Same identity in all sixteen full-body equal cells with clear alpha gutters. Four east walking steps; two south and two north walking steps; idle, restrained command, point, address a gathering; read letter, write at portable board, consult map, rest. No other people, horse, lettering, grid, background, scenery, gore, or exact likeness claim.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-moore.png'],
  generatedSourcePath: `${root}exec-ec22fa53-375e-4576-b5cf-be800e6c7b7e.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-austin.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'Distinct clean-shaven civilian commander with campaign-letter and map gestures for the 1835 volunteer army.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Austin has directional walking, campaign command, speech, letter and map poses. His itinerary and documented words remain simulation-owned.'];

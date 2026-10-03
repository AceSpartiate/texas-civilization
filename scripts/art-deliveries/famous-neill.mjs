// Original interpretation of James C. Neill; no portrait likeness is claimed.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-neill': [
    ...[1, 2, 3, 4].map(n => `neill-walk-e-${n}`),
    ...[1, 2].map(n => `neill-walk-s-${n}`),
    ...[1, 2].map(n => `neill-walk-n-${n}`),
    'neill-idle', 'neill-command', 'neill-rammer', 'neill-sight',
    'neill-brace', 'neill-pass-shot', 'neill-wounded-seated', 'neill-recover',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`neill-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `neill-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['neill-gun-service'] = {
  frames: [{ sprite: 'neill-rammer', duration: 440 }, { sprite: 'neill-sight', duration: 400 }, { sprite: 'neill-brace', duration: 280 }],
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [{
  sheet: 'famous-neill', promptId: 'frontier-v1/famous-neill', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 4x4 painterly Texas Revolution sprite atlas of an original interpretive James C. Neill, stocky middle-aged artillery officer in tan hat, indigo jacket, cream shirt, buff trousers and black boots. Four east walks, two south, two north, then idle, command, rammer, cannon sight, brace at gun report, offer round, non-graphic seated hip wound and recover. Same identity and scale, clear alpha gutters, no background or exact portrait claim. Reference the shipped Karnes sheet for art style only.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-karnes.png'],
  generatedSourcePath: `${root}exec-c3ca2fe6-1a72-444c-bd07-964f3bbeca62.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-neill.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'Distinct artillery command and gun-service poses; non-graphic hip wound for the existing April 20 fate. Costume is interpretive.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Neill has directional travel, an artillery service loop, command, and a non-graphic wound. Existing Béxar and San Jacinto scene chronology remains simulation-owned.'];

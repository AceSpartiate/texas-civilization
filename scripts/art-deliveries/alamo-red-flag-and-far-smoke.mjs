// Alamo siege atmosphere, without changing the battle's documented flags or plume timing.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'flag-red-siege': ['flag-red-still', 'flag-red-wind-1', 'flag-red-wind-2', 'flag-red-wind-3'],
  'smoke-column-far': ['smoke-column-far-1', 'smoke-column-far-2', 'smoke-column-far-3', 'smoke-column-far-4'],
};
export const ANIMATION_CLIPS = {
  'flag-red-wind': { frames: [
    { sprite: 'flag-red-still', duration: 430 }, { sprite: 'flag-red-wind-1', duration: 380 },
    { sprite: 'flag-red-wind-2', duration: 360 }, { sprite: 'flag-red-wind-3', duration: 420 },
  ], loop: true, authored: true, motion: 'none', direction: 'east' },
  'smoke-column-far-rise': { frames: [
    { sprite: 'smoke-column-far-1', duration: 420 }, { sprite: 'smoke-column-far-2', duration: 440 },
    { sprite: 'smoke-column-far-3', duration: 460 }, { sprite: 'smoke-column-far-4', duration: 440 },
  ], loop: true, authored: true, motion: 'none', direction: 'east' },
};
export const promptEntries = [
  { sheet: 'flag-red-siege', promptId: 'frontier-v1/flag-red-siege', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas of one plain blood-red 1836 military flag on a tall wooden pole: still cloth, slight lift, strong wind billow, settling. Identical pole and ground anchor in all four frames; no emblem, words, people or background. Warm painted frontier game style.', referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/flag-come-and-take-it.png'], generatedSourcePath: `${root}exec-d9921be6-db86-4961-b2dd-117076e489fd.png`, runtimeFile: 'public/assets/frontier-v1/atlases/flag-red-siege.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'Plain red cloth for the documented no-quarter signal; the flag sheet itself does not depict San Fernando tower.' },
  { sheet: 'smoke-column-far', promptId: 'frontier-v1/smoke-column-far', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas of the same distant smoke column from burning huts: narrow rise, curl, broaden, thin and shear in four sequential frames. Gray-brown hand-painted smoke with a tiny ember glow at its ground anchor, no hut, people, landscape or background.', referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/effects.png'], generatedSourcePath: `${root}exec-3a17ed24-1e3b-444e-8e37-c52436bafd57.png`, runtimeFile: 'public/assets/frontier-v1/atlases/smoke-column-far.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'Distant atmospheric plume for the February 25 huts; it shows no invented casualties or hut structure.' },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Red flag and hut smoke are authored looping clips, tied to existing Alamo event positions and dates.'];

// Assault ladders at the north wall: carried, set against masonry, and climbed.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'alamo-scaling-ladders': ['ladder-carried-e-1', 'ladder-carried-e-2', 'ladder-set-e', 'ladder-set-w'],
  'regular-ladder-climb': ['regular-climb-1', 'regular-climb-2', 'regular-climb-3', 'regular-climb-4'],
};
export const ANIMATION_CLIPS = {
  'ladder-carried-e': { frames: [
    { sprite: 'ladder-carried-e-1', duration: 330 }, { sprite: 'ladder-carried-e-2', duration: 330 },
  ], loop: true, authored: true, motion: 'none', direction: 'east; mirror for west' },
  'regular-climb': { frames: [
    { sprite: 'regular-climb-1', duration: 220 }, { sprite: 'regular-climb-2', duration: 220 },
    { sprite: 'regular-climb-3', duration: 220 }, { sprite: 'regular-climb-4', duration: 220 },
  ], loop: true, authored: true, motion: 'none', direction: 'north/up' },
};
export const promptEntries = [
  { sheet: 'alamo-scaling-ladders', promptId: 'frontier-v1/alamo-scaling-ladders', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas: the same plain scaling ladder carried level by four 1836 Mexican regulars walking east in two distinct leg-step frames, then the ladder alone set upright leaning right and left. Full-body figures, period navy/red/white uniforms and shakos, broad alpha gutters, shared ground anchors, no wall or background.', referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military.png'], generatedSourcePath: `${root}exec-ea508634-203f-4f9b-ad22-1a3d47423b80.png`, runtimeFile: 'public/assets/frontier-v1/atlases/alamo-scaling-ladders.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'Two carrier steps and two set facings; the number of rendered ladders follows existing assault data.' },
  { sheet: 'regular-ladder-climb', promptId: 'frontier-v1/regular-ladder-climb', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas: the same 1836 Mexican regular viewed from behind, climbing an unseen ladder in four alternating hand-and-boot positions. Navy coat, red facings, white straps, pale trousers and shako, same scale and anchor, broad alpha gutters, no ladder, wall, background or text.', referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military-vertical.png'], generatedSourcePath: `${root}exec-c44a56e1-cea3-4dfa-adec-9fffd3e06262.png`, runtimeFile: 'public/assets/frontier-v1/atlases/regular-ladder-climb.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'Two alternating limb positions repeated across four frames; world movement along the ladder comes from the renderer.' },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Scaling ladders use a two-step carried clip, two standing facings and a four-frame climbing clip; no new assault timing.'];

// Dedicated service poses for the Twin Sisters and a Mexican drummer for future documented drum cues.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'twin-sisters-crew': ['twin-crew-rammer-carry', 'twin-crew-ram', 'twin-crew-shot-carry', 'twin-crew-fire'],
  'regular-drummer': ['regular-drummer-idle', 'regular-drummer-raise', 'regular-drummer-beat-1', 'regular-drummer-beat-2'],
};
export const ANIMATION_CLIPS = {
  'twin-crew-gun-ram': { frames: [
    { sprite: 'twin-crew-rammer-carry', duration: 280 }, { sprite: 'twin-crew-ram', duration: 420 },
    { sprite: 'twin-crew-rammer-carry', duration: 330 },
  ], loop: false, authored: true, motion: 'none', direction: 'east; mirror for west' },
  'twin-crew-gun-shot-carry': { frames: [
    { sprite: 'twin-crew-shot-carry', duration: 360 },
  ], loop: false, authored: false, motion: 'none', direction: 'east; mirror for west' },
  'twin-crew-gun-ready': { frames: [
    { sprite: 'twin-crew-rammer-carry', duration: 360 },
  ], loop: false, authored: false, motion: 'none', direction: 'east; mirror for west' },
  'twin-crew-gun-fire': { frames: [
    { sprite: 'twin-crew-rammer-carry', duration: 160 }, { sprite: 'twin-crew-fire', duration: 440 },
    { sprite: 'twin-crew-rammer-carry', duration: 260 },
  ], loop: false, authored: true, motion: 'none', direction: 'east; mirror for west' },
  'regular-drummer-start': { frames: [
    { sprite: 'regular-drummer-idle', duration: 250 }, { sprite: 'regular-drummer-raise', duration: 250 },
    { sprite: 'regular-drummer-beat-1', duration: 250 },
  ], loop: false, authored: true, motion: 'none', direction: 'east; mirror for west' },
  'regular-drummer-beat': { frames: [
    { sprite: 'regular-drummer-beat-1', duration: 240 }, { sprite: 'regular-drummer-beat-2', duration: 240 },
  ], loop: true, authored: true, motion: 'none', direction: 'east; mirror for west' },
};
export const promptEntries = [
  { sheet: 'twin-sisters-crew', promptId: 'frontier-v1/twin-sisters-crew', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas of the same 1836 Texian artillery volunteer in brown hat, blue-gray shirt and tan vest: upright rammer carry, pushing a rammer toward an unseen gun, carrying one round shot, pulling a short firing lanyard and covering one ear. Four isolated full-body poses, broad alpha gutters, same ground anchor and identity, no gun or scenery.', referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/artillery-service.png'], generatedSourcePath: `${root}exec-3133ff80-b994-4155-889a-45830819a996.png`, runtimeFile: 'public/assets/frontier-v1/atlases/twin-sisters-crew.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'Dedicated service figure for the two named Twin Sisters; no claim about their transport team or crew identity.' },
  { sheet: 'regular-drummer', promptId: 'frontier-v1/regular-drummer', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas of the same 1835 Mexican regular drummer in dark coat, red facings, white straps, pale trousers and shako: at ease, sticks raised, two alternating drum beats. Four isolated full-body poses, broad alpha gutters, same ground anchor and identity, no background.', referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/regular-bugler.png'], generatedSourcePath: `${root}exec-1686c9c7-e840-4cc8-8f3a-275e60cf5131.png`, runtimeFile: 'public/assets/frontier-v1/atlases/regular-drummer.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'Animation-ready drummer; no undocumented drum cue added to the battle timeline.' },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Twin Sisters crew service clips bind to the named guns only; drummer start and loop clips are ready for a documented cue.'];

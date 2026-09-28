// Side-specific white flags and a Mexican bugler for the Béxar, Coleto and Concepción scenes.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'white-flag-regular': ['white-flag-regular-idle-e', 'white-flag-regular-idle-s', 'white-flag-regular-walk-e-1', 'white-flag-regular-walk-e-2'],
  'white-flag-volunteer': ['white-flag-volunteer-idle-e', 'white-flag-volunteer-idle-s', 'white-flag-volunteer-walk-e-1', 'white-flag-volunteer-walk-e-2'],
  'regular-bugler': ['regular-bugler-idle', 'regular-bugler-raise', 'regular-bugler-sound', 'regular-bugler-lower'],
};
export const ANIMATION_CLIPS = {
  'regular-bugler-call': { frames: [
    { sprite: 'regular-bugler-idle', duration: 170 }, { sprite: 'regular-bugler-raise', duration: 220 },
    { sprite: 'regular-bugler-sound', duration: 650 }, { sprite: 'regular-bugler-lower', duration: 300 },
  ], loop: false, authored: true, motion: 'none', direction: 'east; mirror for west' },
};
for (const side of ['regular', 'volunteer']) ANIMATION_CLIPS[`white-flag-${side}-walk-e`] = {
  frames: [1, 2].map(n => ({ sprite: `white-flag-${side}-walk-e-${n}`, duration: 280 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  { sheet: 'white-flag-regular', promptId: 'frontier-v1/white-flag-regular', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas of one Mexican regular in dark blue 1830s coat, red facings, white straps and dark shako, holding a plain white flag on a tall pole in every frame: east idle, south idle, east walk step 1 and step 2. Four isolated full-body poses, broad alpha gutters, no weapons, emblems, text, scenery or background.', referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military.png'], generatedSourcePath: `${root}exec-f6bdfb96-8664-405b-99a2-b9f61138aa7b.png`, runtimeFile: 'public/assets/frontier-v1/atlases/white-flag-regular.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'A regular bears the Béxar truce flag; two distinct walk steps. Cloth remains plain white.' },
  { sheet: 'white-flag-volunteer', promptId: 'frontier-v1/white-flag-volunteer', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Companion transparent 2x2 atlas of one Texian civilian volunteer in brown frontier coat and broad-brimmed hat carrying a plain white flag: east idle, south idle, east walk step 1 and step 2. Match the regular bearer sheet for scale and style, with broad alpha gutters, no weapons, emblems, text, scenery or background.', referenced_image_paths: [`${root}exec-f6bdfb96-8664-405b-99a2-b9f61138aa7b.png`], generatedSourcePath: `${root}exec-35737e97-fa92-45b4-ba06-d19595b2bd5e.png`, runtimeFile: 'public/assets/frontier-v1/atlases/white-flag-volunteer.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'Texian side-specific bearer for Coleto; do not put a Mexican uniform under its flag.' },
  { sheet: 'regular-bugler', promptId: 'frontier-v1/regular-bugler', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas of one Mexican regular bugler in dark blue coat, red facings, white straps, light trousers and shako: bugle lowered, raise to lips, sound clearly, lower again. A short non-looping call sequence, same figure in all frames, broad alpha gutters, no other people, text, musical symbols, scenery or background.', referenced_image_paths: [`${root}exec-f6bdfb96-8664-405b-99a2-b9f61138aa7b.png`], generatedSourcePath: `${root}exec-b9e0456d-d0d4-4e56-9723-b231e59175fd.png`, runtimeFile: 'public/assets/frontier-v1/atlases/regular-bugler.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'The visible bugler sounds existing documented calls; no new audible signal or historical claim is added.' },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Two side-specific white-flag bearers have walking clips; a regular bugler has a non-looping call. A drummer remains requested.'];

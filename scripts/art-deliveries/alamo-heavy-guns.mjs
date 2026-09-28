// The Alamo 18-pounder and the Mexican siege batteries, separate from reusable field cannon.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'cannon-18pdr': ['cannon-18pdr-e', 'cannon-18pdr-recoil-e', 'cannon-18pdr-w', 'cannon-18pdr-recoil-w'],
  'cannon-siege-battery': ['cannon-siege-battery-e', 'cannon-siege-battery-recoil-e', 'cannon-siege-battery-w', 'cannon-siege-battery-recoil-w'],
};
export const ANIMATION_CLIPS = Object.fromEntries(['cannon-18pdr', 'cannon-siege-battery'].flatMap(base =>
  ['e', 'w'].map(dir => [`${base}-${dir}-recoil`, { frames: [
    { sprite: `${base}-${dir}`, duration: 110 },
    { sprite: `${base}-recoil-${dir}`, duration: 210 },
    { sprite: `${base}-${dir}`, duration: 450 },
  ], loop: false, authored: true, motion: 'none', direction: dir === 'e' ? 'east' : 'west' }])));
export const promptEntries = [
  { sheet: 'cannon-18pdr', promptId: 'frontier-v1/cannon-18pdr', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas of the Alamo 18-pounder: a visibly massive long dark iron barrel on a low timber garrison carriage with solid cheeks and small truck wheels. East rest/recoil, west rest/recoil; same geometry and restrained backward motion, broad alpha gutters, no people, wall, flame or background.', referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/cannon-sixpounder.png', 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/alamo-modules.png'], generatedSourcePath: `${root}exec-98a15778-6b36-4b66-8c31-c4246a48dfbb.png`, runtimeFile: 'public/assets/frontier-v1/atlases/cannon-18pdr.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'Heavy garrison carriage, distinct from field six-pounder. This is an interpretive period silhouette, not an exact surviving gun portrait.' },
  { sheet: 'cannon-siege-battery', promptId: 'frontier-v1/cannon-siege-battery', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt: 'Transparent 2x2 atlas of a medium Mexican siege cannon on a practical wheeled timber carriage behind a low packed-earth berm with firing gap. East rest/recoil, west rest/recoil; bank fixed while the gun recoils, broad alpha gutters, no people, fort, flame, smoke or background.', referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/cannon-sixpounder.png', 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/fortifications.png'], generatedSourcePath: `${root}exec-9ec3d3ba-438e-4875-8c2b-4a0b05250940.png`, runtimeFile: 'public/assets/frontier-v1/atlases/cannon-siege-battery.png', postProcessing: 'None. Copied unchanged; measured atlas validation only.', review: 'Alamo Mexican batteries only; no claim that each battery had identical guns or earthwork.' },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Two dedicated four-frame gun sheets bind by Alamo gun id, preserving existing firing dates and crews.'];

// Distinctive player-facing art direction, not evidence of the guns' historical paint.
export const SHEETS = {
  'twin-sisters-painted': ['twin-sister-painted-e', 'twin-sister-painted-recoil-e', 'twin-sister-painted-w', 'twin-sister-painted-recoil-w'],
};
export const ANIMATION_CLIPS = Object.fromEntries(['e', 'w'].map(dir => [`twin-sister-painted-${dir}-recoil`, {
  frames: [
    { sprite: `twin-sister-painted-${dir}`, duration: 110 },
    { sprite: `twin-sister-painted-recoil-${dir}`, duration: 180 },
    { sprite: `twin-sister-painted-${dir}`, duration: 470 },
  ], loop: false, authored: true, motion: 'none', direction: dir === 'e' ? 'east' : 'west',
}]));
export const promptEntries = [{
  sheet: 'twin-sisters-painted', promptId: 'frontier-v1/twin-sisters-painted', tool: 'built-in image_gen.imagegen', mode: 'edit',
  prompt: 'Edit the four-frame transparent unpainted iron six-pounder atlas without changing gun silhouette, placement or pose. Paint selected carriage cheeks red and wheel rims/hubs deep blue, with restrained red and blue bands on the rear trail. Keep dark iron barrels and mostly warm wood; same scheme all four frames; no people, horses, flags, stars, text or background.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/cannon-sixpounder.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-e1ffe4d6-6fd8-4052-ad7b-f6a17c7e22c7.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/twin-sisters-painted.png',
  postProcessing: 'None. Edited PNG copied unchanged; measured atlas validation only.',
  review: 'Dedicated painted variant for the two Twin Sisters in battle. Color is an artistic identifier, not a historical claim.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Twin Sisters get distinctive red and blue field art; generic cannon-sixpounder remains reusable without those colors.'];

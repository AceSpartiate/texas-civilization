// Light iron field-gun art for the two Twin Sisters at San Jacinto; the crew remains a separate request.
export const SHEETS = {
  'cannon-sixpounder': ['cannon-sixpounder-e', 'cannon-sixpounder-recoil-e', 'cannon-sixpounder-w', 'cannon-sixpounder-recoil-w'],
};
export const ANIMATION_CLIPS = Object.fromEntries(['e', 'w'].map(dir => [`cannon-sixpounder-${dir}-recoil`, {
  frames: [
    { sprite: `cannon-sixpounder-${dir}`, duration: 110 },
    { sprite: `cannon-sixpounder-recoil-${dir}`, duration: 180 },
    { sprite: `cannon-sixpounder-${dir}`, duration: 470 },
  ], loop: false, authored: true, motion: 'none', direction: dir === 'e' ? 'east' : 'west',
}]));
const prompt = 'Original transparent 2x2 historical game atlas of one modest light iron six-pounder on a wooden two-wheel field carriage with a rear trail, warm hand-painted miniature style. Top-left east rest, top-right east subtle recoil, bottom-left west rest, bottom-right west subtle recoil. Consistent design and scale, generous transparent gutters; no people, horse, limber, cannonball, smoke, muzzle flash, text, border or background.';
export const promptEntries = [{
  sheet: 'cannon-sixpounder', promptId: 'frontier-v1/cannon-sixpounder', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/cannon-cartwheels.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-d788edd3-2984-498a-b554-9c059c5f885f.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/cannon-sixpounder.png',
  postProcessing: 'None. Generated PNG copied unchanged; measured atlas validation only.',
  review: 'Four discrete rest/recoil views for a single field gun. Use twice for the Twin Sisters; no crew or hauling rig is implied.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Light iron six-pounder east/west rest and recoil views are bound only to the two Twin Sisters at San Jacinto. The volunteer crew is still a stand-in.'];

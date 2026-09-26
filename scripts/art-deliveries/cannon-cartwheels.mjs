export const SHEETS = {
  'cannon-cartwheels': [
    'cannon-cartwheels-e', 'cannon-cartwheels-recoil-e',
    'cannon-cartwheels-w', 'cannon-cartwheels-recoil-w',
  ],
};

export const ANIMATION_CLIPS = {
  'cannon-cartwheels-e-recoil': {
    frames: [
      { sprite: 'cannon-cartwheels-e', duration: 110 },
      { sprite: 'cannon-cartwheels-recoil-e', duration: 180 },
      { sprite: 'cannon-cartwheels-e', duration: 470 },
    ], loop: false, authored: true, motion: 'none', direction: 'east',
  },
  'cannon-cartwheels-w-recoil': {
    frames: [
      { sprite: 'cannon-cartwheels-w', duration: 110 },
      { sprite: 'cannon-cartwheels-recoil-w', duration: 180 },
      { sprite: 'cannon-cartwheels-w', duration: 470 },
    ], loop: false, authored: true, motion: 'none', direction: 'west',
  },
};

const prompt = 'Use case: stylized-concept. Asset type: production 2D game sprite atlas, genuine transparent RGBA PNG. Create exactly FOUR isolated objects in a STRICT 2 columns by 2 rows grid on fully transparent background, generous clear gutters, nothing touches cell boundaries. Match the supplied game warm hand-painted 1830s frontier illustration style, dark brown ink outlines, subtle canvas texture, elevated three-quarter view, upper-left warm light. Depict the historically described Gonzales small BRASS six-pounder cannon lashed to a SIMPLE PAIR OF PLAIN CART WHEELS, no military trail carriage, no people, no ox, no scenery, no labels. Top-left: east-facing gun resting; top-right: same east-facing gun in small recoil; bottom-left: west-facing resting; bottom-right: west-facing recoil. Preserve identical cannon design and scale, grounded at wheel bottoms. Avoid detached components, smoke, muzzle flash, words, background color, checkerboard, frames, watermark.';
export const promptEntries = [{
  sheet: 'cannon-cartwheels', promptId: 'frontier-v1/cannon-cartwheels',
  tool: 'built-in image_gen.imagegen', mode: 'generate', prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/artillery-service.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-aaacf198-6af0-495f-88fa-e6fdc8f77ddf.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/cannon-cartwheels.png',
  postProcessing: 'None. Generated PNG copied unchanged; measured atlas validation only.',
  review: 'Four isolated east/west rest/recoil cart-wheel cannon frames; no crew or background.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Gonzales cart-wheel cannon sprite and authored recoil clips; battle state and smoke remain server/presentation responsibilities.'];

// Cart alone, without an ox painted in, for the baggage inside Coleto's square.
export const SHEETS = { 'coleto-baggage-cart': ['cart-baggage', 'cart-baggage-tilt-1', 'cart-baggage-tilt-2', 'cart-tipped'] };
export const ANIMATION_CLIPS = {
  'cart-baggage-tip': { frames: [
    { sprite: 'cart-baggage', duration: 550 }, { sprite: 'cart-baggage-tilt-1', duration: 450 },
    { sprite: 'cart-baggage-tilt-2', duration: 450 }, { sprite: 'cart-tipped', duration: 1200 },
  ], loop: false, authored: true, motion: 'none', direction: 'east; mirror for west' },
};
export const promptEntries = [{
  sheet: 'coleto-baggage-cart', promptId: 'frontier-v1/coleto-baggage-cart', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Original transparent 2x2 game atlas of one small two-wheel 1830s wooden baggage cart without ox, loaded with tied cloth bundles and rolled blankets. Four states of the same cart in reading order: upright, beginning to tip by 30 degrees, tipping about 65 degrees, resting on its side as a low improvised breastwork. Same scale and cargo, wide alpha gutters, warm painted miniature style; no people, animals, weapons, text or scenery.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/cart-open.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-4814d39b-de4d-46e9-8e32-4091221055a0.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/coleto-baggage-cart.png',
  postProcessing: 'None. Generated PNG copied unchanged; measured atlas validation only.',
  review: 'Distinct upright and tipped frames with a non-looping tip sequence; no ox painted into the cart.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Coleto square uses upright baggage carts before the small-hours barricade and tipped carts afterward.'];

export const SHEETS = {
  'cart-open': ['cart-open-e', 'cart-open-e-variant', 'cart-open-s', 'cart-open-n'],
};

// The two east views do not have enough wheel rotation to be an authored travel cycle.
// Keep these as view/state art until a separate rotating wheel layer or corrected
// travel frames have been measured and tested in the moving rig.
export const ANIMATION_CLIPS = {};

const prompt = 'Use case: stylized-concept. Asset type: production transparent sprite atlas for a 1830s Texas historical game. Make exactly FOUR isolated sprites in a strict 2-column by 2-row square grid, with large transparent gutters. Depict one consistent small poor-family uncovered two-wheeled wooden ox cart: simple plank bed with low side rails, solid wooden wheels, front yoke attachment, no ox, horse or people. Match the supplied warm hand-painted three-quarter frontier style, dark brown ink outlines, upper-left light, rustic wood and leather. Top row: cart facing east, two travel poses. Bottom-left: facing south; bottom-right: facing north. Keep the cart identity and scale. Genuine alpha transparency, no background, labels, checkerboard or watermark.';
export const promptEntries = [{
  sheet: 'cart-open', promptId: 'frontier-v1/cart-open',
  tool: 'built-in image_gen.imagegen', mode: 'generate', prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/wagon-rig.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-b43bc0ce-2063-4389-ab77-7d191b785efc.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/cart-open.png',
  postProcessing: 'None. Generated PNG copied unchanged; measured atlas validation only.',
  review: 'Uncovered two-wheel cart visible from east, south and north; east variant wheel motion insufficient for a travel clip.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Open cart direction art has no ox painted in. Animated wheel motion remains a separate art request; do not claim these two near-identical east frames as a rolling cycle.'];

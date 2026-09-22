export const SHEETS = {
  'biome-trees-fields': [
    'pine-longleaf-pole', 'pine-longleaf-log', 'pine-longleaf-large', 'palm-sabal-pole',
    'palm-sabal-log', 'palm-sabal-large', 'cypress-bald-pole', 'cypress-bald-log',
    'cypress-bald-large', 'magnolia-log', 'magnolia-large', 'beech-log',
    'beech-large', 'field-irrigated-young', 'field-irrigated-mature', 'field-fallow',
  ],
};

const staticSway = sprite => ({
  frames: [{ sprite, duration: 3800 }], loop: true, authored: false,
  motion: 'sway', direction: 'not applicable',
});
export const ANIMATION_CLIPS = Object.fromEntries(
  SHEETS['biome-trees-fields']
    .filter(sprite => !sprite.startsWith('field-'))
    .map(sprite => [`${sprite}-wind`, staticSway(sprite)]),
);

const prompt = 'Use case: stylized-concept. Create a production 2D environment sprite atlas for a top-down three-quarter-view historical strategy game. Match the supplied nature atlas exactly in rendering language: warm hand-painted storybook game art, dark brown crisp contours, olive/rust/ochre palette, natural texture, light from upper left, elevated three-quarter view, each plant grounded at bottom center. Square atlas, strict 4 columns by 4 rows, exactly sixteen isolated sprites in this reading order: 1 young longleaf pine with thin straight trunk and sparse high tufted needles; 2 pole-size longleaf pine; 3 mature tall longleaf pine; 4 small trunkless sabal palm; 5 medium sabal palm with grey trunk and fan crown; 6 tall mature sabal palm; 7 young bald cypress with flared base; 8 medium bald cypress with buttressed base and feathery crown; 9 large bald cypress with strong buttress and a little Spanish moss; 10 medium southern magnolia with broad glossy leaves; 11 large southern magnolia; 12 medium American beech with smooth pale-grey trunk; 13 large American beech; 14 irrigated young corn rows in narrow earth furrows as a low horizontal field patch; 15 irrigated mature corn rows in matching furrows; 16 fallow field patch with sparse weeds, cut stalks and exposed warm earth. Genuine transparent RGBA background. Equal cells, generous transparent gutters, one complete asset per cell. No labels, lettering, grid lines, scenery, sky, people, animals, rectangular opaque tile backgrounds, shadows crossing cell boundaries, overlap between cells, or cropping. Preserve clear silhouettes at small game scale.';

export const promptEntries = [{
  sheet: 'biome-trees-fields',
  promptId: 'frontier-v1/biome-trees-fields',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/nature.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-c510440f-f4fa-4c0c-a2a0-afdf05c7ae2c.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/biome-trees-fields.png',
  postProcessing: 'None. Generated original copied unchanged; only read-only validation.',
  review: 'Accepted as sixteen separated true-alpha sprites. It completes longleaf pine, sabal palm and bald cypress size progressions; adds medium and large magnolia and beech; and supplies young and mature irrigated crop plots plus a reusable fallow plot.',
}];

export const provenanceEntries = promptEntries.map(({ prompt: omittedPrompt, ...entry }) => entry);
export const notes = ['2026-09-22: Longleaf pine, sabal palm and bald cypress delivered at all three woods sizes; magnolia and beech at log and large sizes; irrigated young/mature crops and fallow ground delivered. Single-frame sway clips are presentation metadata only.'];

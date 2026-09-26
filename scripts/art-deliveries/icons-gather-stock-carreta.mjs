export const SHEETS = {
  'icons-gather-stock-carreta': [
    'icon-take-small-game-alt', 'icon-fish-the-water-alt', 'icon-gather-oysters-alt', 'icon-cut-bee-tree-alt',
    'icon-butcher-beef-alt', 'icon-butcher-hog-alt', 'icon-look-to-stock-alt', 'icon-make-carreta',
  ],
};
export const ANIMATION_CLIPS = {};
const prompt = 'Use case: stylized-concept. Asset type: transparent game action-icon atlas matching the existing illustrated family panel. Eight isolated icons in strict four columns by two rows, clear gutters and no labels. Row 1: squirrel on branch for small game; handline fishing pole and fish above water; oyster shells and basket; bee tree with honeycomb. Row 2: longhorn cow and knife with wrapped food, non-graphic; hog and knife with wrapped food, non-graphic; rider hat above prairie grass and cattle for stock search; hand-built solid-wheel carreta with axe for making it. Warm muted frontier paint, dark ink outlines, equal visual weight, no modern objects, text or background.';
export const promptEntries = [{
  sheet: 'icons-gather-stock-carreta', promptId: 'frontier-v1/icons-gather-stock-carreta',
  tool: 'built-in image_gen.imagegen', mode: 'generate', prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/icons-family-actions-2.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f3960902-e871-4990-b347-a068f14448aa.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/icons-gather-stock-carreta.png',
  postProcessing: 'None. Generated PNG copied unchanged; alpha atlas measured during build.',
  review: 'Eight distinct readable icon subjects; carcasses represented by wrapped food without gore; carreta has solid wheels.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Seven alternate gathering and stock icons complement the existing icons-family-subsistence atlas. The eighth icon, icon-make-carreta, replaces the remaining panel glyph. Icons are state art, not animation.'];

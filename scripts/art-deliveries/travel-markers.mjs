const colours = ['rust', 'ink', 'grey', 'slate'];
export const SHEETS = {
  'travel-markers': [
    ...colours.map(c => `marker-pin-${c}`),
    ...colours.map(c => `marker-dot-${c}`),
    ...colours.map(c => `marker-end-${c}`),
    ...colours.map(c => `marker-hoof-${c}`),
  ],
};
export const ANIMATION_CLIPS = {};

const prompt = 'Use case: stylized-concept. Asset type: transparent production map-marker sprite atlas for a historical illustrated strategy game. Create a square 4 columns by 4 rows atlas containing exactly sixteen isolated map-marker sprites. Match the supplied game icon style: thin dark-brown contour, upper-left light, cream highlights, subtle texture, readable tiny silhouettes, genuine transparent RGBA. Columns use principal rust #a9512d, family ink #3b3221, other-household grey-green #7b8676, courier slate #41556b. Row 1: identical portrait-frame map pins with empty transparent circular centers and tip at bottom center. Row 2: small route dots with pale edge. Row 3: open destination rings on short stakes, center transparent. Row 4: compact paired-hoofprint route marks. Strict grid, identical geometry across each row, clear gutters, no background, grid, labels, portraits, faces, scenery, text, or watermark.';

export const promptEntries = [{
  sheet: 'travel-markers',
  promptId: 'frontier-v1/travel-markers',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/icons-family-actions-1.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-36a352c6-9a1f-4809-8665-5e111c483df3.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/travel-markers.png',
  postProcessing: 'None. Generated PNG copied unchanged; only read-only atlas validation.',
  review: 'Accepted as four consistent color families with transparent portrait/ring centers and distinct pin, dot, destination and hoof silhouettes.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Markers are presentation-only. Travel position, speed threshold, route and interaction remain authoritative application state.'];

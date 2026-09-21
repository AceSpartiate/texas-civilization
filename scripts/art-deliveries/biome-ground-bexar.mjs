export const SHEETS = {
  'biome-ground-bexar': [
    'palmetto', 'cypress-knees', 'cane-1', 'cane-2',
    'cane-wind', 'grass-tall', 'grass-tall-wind', 'thicket-thorn-1',
    'thicket-thorn-2', 'yucca', 'marsh-cordgrass', 'dune-grass',
    'acequia-straight', 'acequia-bend', 'acequia-crossing', 'fence-brush',
  ],
};

export const ANIMATION_CLIPS = {
  'cane-wind': { frames: [{ sprite: 'cane-wind', duration: 900 }], loop: true, authored: false, motion: 'none', direction: 'not applicable' },
  'grass-tall-wind': { frames: [{ sprite: 'grass-tall-wind', duration: 900 }], loop: true, authored: false, motion: 'none', direction: 'not applicable' },
};

const prompt = 'Use case: stylized-concept. Asset type: production 2D environment sprite atlas for a top-down three-quarter-view historical strategy game. Create a square 4 columns by 4 rows atlas of exactly sixteen isolated environmental sprites on a genuine transparent RGBA background. Match the supplied frontier nature atlas: warm hand-painted storybook game art, dark brown crisp contour, olive/rust/ochre palette, detailed natural texture, elevated three-quarter view, base anchors at bottom center. Reading order: palmetto; cypress knees; river cane variant 1; river cane variant 2; wind-bent cane; tall golden bluestem/Indian grass; wind-bent tall grass; South Texas thorn thicket 1; thorn thicket 2; Spanish-dagger yucca; marsh cordgrass; dune sea oats; straight earth acequia with narrow water; matching acequia bend; matching acequia with rough plank crossing; low woven brush fence. Strict equal grid, one complete object per cell, transparent gutters, no rectangular ground tiles, background, grid, labels, people, scenery, overlap, or cropping.';

export const promptEntries = [{
  sheet: 'biome-ground-bexar',
  promptId: 'frontier-v1/biome-ground-bexar',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/nature.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-64002d55-fa72-44da-824f-009738ebde26.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/biome-ground-bexar.png',
  postProcessing: 'None. Generated PNG copied unchanged; only read-only atlas validation.',
  review: 'Accepted as sixteen semantically distinct, well-separated environmental sprites with genuine transparency.',
}];

export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['These sprites are presentation assets. Biome placement, weather mixing, acequia geometry and crossing rules remain authoritative simulation or layout state.'];

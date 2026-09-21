const poses = ['forage', 'alert', 'bound', 'display'];
export const SHEETS = {
  'wildlife-turkey': poses.flatMap(pose => [1, 2, 3, 4].map(frame => `turkey-${pose}-${frame}`)),
};

export const ANIMATION_CLIPS = Object.fromEntries(poses.map(pose => [`turkey-${pose}`, {
  frames: [1, 2, 3, 4].map(frame => ({ sprite: `turkey-${pose}-${frame}`, duration: pose === 'bound' ? 150 : pose === 'display' ? 260 : 360 })),
  loop: true,
  authored: true,
  motion: 'none',
  direction: 'east; west by mirroring',
}]));

const prompt = 'Use case: stylized-concept. Asset type: production animated wildlife sprite atlas for a top-down three-quarter-view historical strategy game. Create a square 4 columns by 4 rows atlas of exactly sixteen isolated east-facing wild turkey sprites on genuine transparent RGBA. Match the supplied deer atlas in warm outlined storybook-game rendering, elevated side/three-quarter camera, crisp dark-brown contour, painterly texture, small-scale silhouette, consistent scale and foot baseline. Historically plausible eastern wild turkey: dark bronze-brown body, layered wing feathers, small bare blue-red head and neck, strong legs. Row 1 four-frame calm forage loop; row 2 four-frame alert and cautious-step loop; row 3 four-frame running and wing-assisted bound loop east; row 4 wing-open, flap, fold and settle loop. Strict equal grid, one complete bird per cell, wide transparent gutters, same individual throughout. No background, ground patch, shadow, grid, labels, scenery, hunters, nests, extra birds, watermark, overlap or cropping.';

export const promptEntries = [{
  sheet: 'wildlife-turkey',
  promptId: 'frontier-v1/wildlife-turkey',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/wildlife-deer.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a5126cf4-4e9a-4c09-a655-546d13adf5bd.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/wildlife-turkey.png',
  postProcessing: 'None. Generated PNG copied unchanged; only read-only atlas validation.',
  review: 'Accepted as one identity-consistent eastern wild turkey with readable forage, alert, bound, and display cycles.',
}];

export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Turkey art is presentation-only. Hunt selection, quarry position, movement and outcome remain authoritative simulation state.'];

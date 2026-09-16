export const SHEETS = {
  'trees-colonies-1': [
    'pine-loblolly-pole','pine-loblolly-log','pine-loblolly-large','stump-pine-loblolly',
    'cedar-pole','cedar-log','cedar-large','mesquite-pole',
    'mesquite-log','mesquite-large','live-oak-pole','live-oak-log',
    'live-oak-large','elm-pole','elm-log','elm-large',
  ],
};

const staticSway = sprite => ({
  frames: [{ sprite, duration: 3800 }], loop: true, authored: false,
  motion: 'sway', direction: 'not applicable',
});
export const ANIMATION_CLIPS = Object.fromEntries(
  SHEETS['trees-colonies-1'].filter(sprite => !sprite.startsWith('stump-')).map(sprite => [`${sprite}-wind`, staticSway(sprite)]),
);

export const promptEntries = [{
  sheet: 'trees-colonies-1',
  promptId: 'frontier-v1/trees-colonies-1',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt: 'Use case historical-scene. Production game sprite atlas for a top-down/elevated three-quarter 1835 Texas frontier simulation. Exactly a 4-column by 4-row atlas: row 1 loblolly pine pole, log-size, large, and freshly cut stump; row 2 Ashe juniper cedar pole, log-size, large, and mesquite pole; row 3 mesquite log-size, mesquite large, live oak pole, live oak log-size; row 4 live oak large, elm pole, elm log-size, elm large. Historically plausible silhouettes: high-crowned straight pine, dark bushy often many-stemmed cedar, low crooked feathery mesquite, low extremely wide evergreen live oak, vase-shaped elm. Warm hand-painted outlined miniature game art, earthy olive greens and bark browns, bold readable silhouettes, slightly elevated three-quarter view. Genuine transparent alpha, equal cells, whole tree crown to trunk foot, consistent row baselines, generous transparent gutters, tiny contact shadows only. No labels, text, grid, checkerboard, border, landscape, people, animals, buildings, or overlap.',
  generatedSourcePath: 'C:\\Users\\zachw\\.codex\\generated_images\\01a0a64f-b7c9-7550-a30a-dd4fac6f892b\\exec-0eaa25a9-efd7-44fe-a27e-4987b21c1922.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/trees-colonies-1.png',
  postProcessing: 'None. Generated original copied unchanged.',
  review: 'Accepted: true RGBA, 61.24% fully transparent pixels, no visible outer-edge pixels, sixteen distinct non-overlapping cells. Five priority species have pole, log and large silhouettes; pine also has a specific stump.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['2026-09-15: Five priority Texas tree species delivered at all three woods sizes. Static one-frame sway metadata is presentation-only.'];

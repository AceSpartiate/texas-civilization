export const SHEETS = {
  'house-modules': [
    'house-round-sill', 'house-round-low-walls', 'house-round-full-walls', 'house-round-roof-partial',
    'house-hewn-sill', 'house-hewn-low-walls', 'house-hewn-full-walls', 'house-hewn-roof-finished',
    'house-passage-floor', 'house-passage-roof', 'house-porch', 'house-shed-room',
    'house-chimney-stick-building', 'house-chimney-stick', 'house-chimney-stone', 'house-floor-loft',
  ],
};

export const ANIMATION_CLIPS = {};

export const promptEntries = [{
  sheet: 'house-modules',
  promptId: 'frontier-v1/house-modules',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt: `Use case: historical-scene. Asset type: production 4x4 modular sprite atlas for a 1835 Texas frontier house-building game. Create exactly sixteen separate reusable architectural pieces in exactly four columns by four rows on genuine transparent RGBA. Match the warm rustic outlined top-down/slightly elevated three-quarter frontier farming-game style, with dark brown outlines, restrained ochre, weathered cedar, clay and limestone. Keep every piece centered in its equal cell with transparent gutters and no overlap, labels, grid, people, landscape or background. All pieces share one perspective, scale and registration. Reading order: round-log sill, low walls, full walls, partial clapboard roof; hewn-log sill, low walls, full walls, finished clapboard roof; passage floor, open passage roof on posts, open porch, enclosed lean-to shed; half-built stick-and-mud chimney, complete stick-and-mud chimney, complete rough limestone chimney, puncheon floor with partial loft and ladder. Modest frontier workmanship only; no brick, glass panes, ornate trim, railings, modern material, fantasy, foliage, smoke, fire, text or watermark.`,
  reference: 'Owner-provided rustic outlined farm-game references; existing frontier-v1 house sheets.',
  correctionPrompts: [],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0a64f-d486-7760-b461-e4cb3c660d5e/exec-3dae2d78-1c4d-432e-812c-db1ce20f026b.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/house-modules.png',
  postProcessing: 'None. Generated PNG copied unchanged.',
  review: 'Sixteen isolated structural layers. Round and hewn pen stages, passage, porch, shed and single chimneys are usable in the live house plot. The combined floor/loft plate remains library-only because the simulation tracks those improvements independently.',
}];

export const provenanceEntries = promptEntries.map(({ prompt, correctionPrompts, ...entry }) => entry);
export const notes = ['House modules are static construction-state art. Server stage and progress remain authoritative; artwork never advances construction.'];

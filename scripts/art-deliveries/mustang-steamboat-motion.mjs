const four = prefix => [1, 2, 3, 4].map(n => `${prefix}-${n}`);
const mustangGallop = [1, 2, 3, 4, 5, 6, 7, 8].map(n => `mustang-gallop-${n}`);
const cycle = (sprites, duration, motion = 'none') => ({
  frames: sprites.map(sprite => ({ sprite, duration })),
  loop: true,
  authored: true,
  motion,
  direction: 'east; west by mirroring',
});

export const SHEETS = {
  'wildlife-mustang': [
    ...four('mustang-graze'),
    ...four('mustang-alert'),
    ...mustangGallop,
  ],
  'steamboat-steam': four('steamboat-steam'),
  'steamboat-laden': four('steamboat-laden'),
};

export const ANIMATION_CLIPS = {
  'mustang-graze': cycle(four('mustang-graze'), 620),
  'mustang-alert': cycle(four('mustang-alert'), 520),
  'mustang-gallop': cycle(mustangGallop, 135),
  'steamboat-steam': cycle(four('steamboat-steam'), 330, 'rock'),
  'steamboat-laden': cycle(four('steamboat-laden'), 360, 'rock'),
};

const mustangPrompt = 'Use case: historical-scene. Asset type: production transparent animated wildlife sprite atlas. Input images: wildlife-deer is the exact style, outline, lighting, scale and grid reference; animal-motion is the horse anatomy reference. Draw one consistent rangy dun-brown wild Texas mustang stallion in sixteen east-facing frames in a strict 4 by 4 grid: four grazing beats, four alert beats, and eight gallop beats. Dark dorsal stripe, black mane and tail, lean frontier condition, unshod and untacked. Match the warm hand-painted storybook wildlife art. Identical scale and registration, feet near 86 percent of each cell, clear gutters and genuine transparent alpha. No shadow, ground, scenery, grid, label, text or watermark.';
const steamPrompt = 'Use case: historical-scene. Asset type: production transparent animated vehicle sprite atlas. Match the accepted Yellow Stone moored atlas exactly. Draw the same 1836 side-wheel steamboat under way with an empty main deck in four registered frames in a strict 2 by 2 grid, bow east. Animate paddle phases, compact churn, modest bow wave and two-chimney smoke; keep the hull steady. Genuine transparency; no people, cargo, flag, lettering, river, shore, sky, painted water, grid, labels, text, later Texas deck, gingerbread or stern wheel.';
const ladenPrompt = 'Use case: historical-scene. Asset type: production transparent animated vehicle sprite atlas. Match the accepted Yellow Stone moored atlas exactly. Draw the same 1836 side-wheel steamboat under way carrying Sam Houston\'s crowded Texian army in four registered frames in a strict 2 by 2 grid, bow east. Animate paddle phases, compact churn, modest bow wave and smoke; keep the hull steady. Deck: frontier militia in varied civilian clothing with upright rifles, a few horses and one wagon. Genuine transparency; no formal uniforms, flag, lettering, river, shore, sky, painted water, grid, labels, text, later Texas deck, gingerbread or stern wheel.';
const ladenAlphaEdit = 'Edit only to remove accidental checkerboard rectangles beneath the hulls and restore genuine transparent alpha there. Preserve the four laden boats and animation states; retain only narrow organic churn and bow-wave strokes beneath the hull.';

export const promptEntries = [
  {
    sheet: 'wildlife-mustang', promptId: 'frontier-v1/wildlife-mustang', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: mustangPrompt,
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/wildlife-deer.png', 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/animal-motion.png'],
    generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c4b1-e7e5-71f0-b631-08f7716cecea/exec-1abd6cbe-cdf9-4287-aa63-7c5f6035a165.png',
    runtimeFile: 'public/assets/frontier-v1/atlases/wildlife-mustang.png',
    postProcessing: 'None. Generated PNG copied unchanged; validation is read-only.',
    review: 'Accepted as one rough, untacked mustang with distinct graze, alert and eight-frame gallop coverage.',
  },
  {
    sheet: 'steamboat-steam', promptId: 'frontier-v1/steamboat-yellow-stone-steam', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: steamPrompt,
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/steamboat-moored.png'],
    generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c4b1-e7e5-71f0-b631-08f7716cecea/exec-bef3343a-2d26-4cb9-940b-a4372358ea57.png',
    runtimeFile: 'public/assets/frontier-v1/atlases/steamboat-steam.png',
    postProcessing: 'None. Generated PNG copied unchanged; validation is read-only.',
    review: 'Accepted as four registered empty-deck underway states with turning paddle, churn, bow wave and progressive smoke.',
  },
  {
    sheet: 'steamboat-laden', promptId: 'frontier-v1/steamboat-yellow-stone-laden', tool: 'built-in image_gen.imagegen', mode: 'generate + edit',
    prompt: ladenPrompt,
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/steamboat-moored.png'],
    generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c4b1-e7e5-71f0-b631-08f7716cecea/exec-f1c126c2-c8a0-4ed9-a6ef-cbd82cdf6f82.png',
    runtimeFile: 'public/assets/frontier-v1/atlases/steamboat-laden.png',
    postProcessing: 'None. Accepted built-in alpha correction copied unchanged; validation is read-only.',
    review: 'Accepted as four army-laden underway states with compact frontier crowd, horses, wagon, paddle/churn changes and no baked checkerboard.',
    edits: [{ prompt: ladenAlphaEdit, reference: 'C:/Users/zachw/.codex/generated_images/01a0c4b1-e7e5-71f0-b631-08f7716cecea/exec-1f80facd-c167-4da2-b6c0-977dc30b1332.png', result: 'Accepted after checkerboard artifacts beneath all hulls were restored to genuine alpha.' }],
  },
];

export const provenanceEntries = promptEntries.map(({ prompt: ignoredPrompt, edits, ...entry }) => ({
  ...entry,
  ...(entry.sheet === 'steamboat-laden' ? { generationHistory: [
    { generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c4b1-e7e5-71f0-b631-08f7716cecea/exec-1f80facd-c167-4da2-b6c0-977dc30b1332.png', result: 'Rejected: baked checkerboard blocks beneath three hulls.' },
    { generatedSourcePath: entry.generatedSourcePath, result: 'Accepted after built-in transparency correction and isolated atlas validation.' },
  ] } : {}),
}));

export const notes = [
  'Wildlife and Yellow Stone art is presentation-only; simulation state remains authoritative for quarry identity, vessel load, location, movement, visibility and outcomes.',
  'Mustang and boat sources face east; west display may mirror them. The Brazos crossing does not currently require north/south boat views.',
];

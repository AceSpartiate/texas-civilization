const names = row => [1, 2, 3, 4].map(frame => `deer-${row}-${frame}`);

export const SHEETS = {
  'wildlife-deer': ['idle', 'alert', 'bound', 'drink'].flatMap(names),
};

const clip = (frames, duration) => ({
  frames: frames.map(sprite => ({ sprite, duration })),
  loop: true,
  authored: true,
  motion: 'none',
  direction: 'east; west by mirroring',
});

export const ANIMATION_CLIPS = {
  'deer-idle': clip(names('idle'), 700),
  'deer-alert': clip(names('alert'), 650),
  'deer-bound': clip(names('bound'), 180),
  'deer-drink': clip(names('drink'), 700),
};

export const promptEntries = [{
  sheet: 'wildlife-deer',
  promptId: 'frontier-v1/wildlife-deer',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate from style reference',
  prompt: 'Use case: historical-scene. Asset type: production animated wildlife sprite atlas for a top-down classroom game. Create a square 1254x1254 PNG with EXACTLY 4 columns and 4 rows, sixteen isolated sprites on a genuinely transparent RGBA background. Use the attached animal-stock atlas as the strict STYLE, perspective, outline weight, shading, scale, and warm earthy palette reference only. Subject is the SAME adult Texas white-tailed deer in every cell, east-facing in a slightly elevated side view, natural tawny-brown coat, pale underside and throat, distinct raised white tail underside when running, modest antlers. Row 1 deer-idle four coherent animation frames: grazing low, chewing, lifting head halfway, calm head up. Row 2 deer-alert four subtle coherent frames: head fully up, ears pivot forward, weight shifts, one forehoof lifts; same planted location and silhouette scale. Row 3 deer-bound four clearly distinct locomotion frames: gather, launch, airborne stretched bound, landing; alternating legs and readable forward motion while keeping the body centered in each cell. Row 4 deer-drink four coherent frames: head lowering, muzzle at water level, swallow, head lifting; NO water or scenery, only the isolated deer. Keep the same deer identity, proportions, baseline, lighting and apparent size across all cells. Each complete animal including antlers, tail, hooves and airborne legs stays fully inside its equal cell with at least 24 pixels of transparent gutter on every side and no overlap across cell boundaries. Tiny contact shadow allowed only beneath hooves in planted poses; no ground patches. Constraints: true transparency, no checkerboard, no solid background, no text, no labels, no borders, no blood, no carcass, no hunter, no weapons, no plants, no extra animals, no photorealism. Production-ready rustic outlined illustrated game art.',
  reference: 'public/assets/frontier-v1/atlases/animal-stock.png',
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0a64f-e643-7982-979c-b7a6f21fe3ec/exec-172aafee-c06e-44f2-9a24-b9e46a78d92b.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/wildlife-deer.png',
  postProcessing: 'None. Generated original copied unchanged.',
  review: 'One consistent adult white-tailed deer. Four idle, alert, bound and drinking poses; complete antlers, tail and hooves remain inside their cells on true alpha.',
}];

export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Deer clips are presentation-only. The server remains authoritative for quarry identity, position and visibility; bounding and drinking art do not create behavior.'];

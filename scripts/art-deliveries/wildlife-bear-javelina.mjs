const frames = (animal, pose) => [1, 2, 3, 4].map(frame => `${animal}-${pose}-${frame}`);

export const SHEETS = {
  'wildlife-bear-javelina': [
    ...frames('bear', 'forage'),
    ...frames('bear', 'alert-bound'),
    ...frames('javelina', 'forage'),
    ...frames('javelina', 'alert-run'),
  ],
};

const clip = (animal, pose, duration) => ({
  frames: frames(animal, pose).map(sprite => ({ sprite, duration })),
  loop: true,
  authored: true,
  motion: 'none',
  direction: 'east; west by mirroring',
});

export const ANIMATION_CLIPS = {
  'bear-forage': clip('bear', 'forage', 520),
  'bear-alert-bound': clip('bear', 'alert-bound', 230),
  'javelina-forage': clip('javelina', 'forage', 480),
  'javelina-alert-run': clip('javelina', 'alert-run', 170),
};

const prompt = 'Use case: historical-scene. Asset type: production animated wildlife sprite atlas for a top-down three-quarter-view 1835–1836 Texas frontier simulation. Input image is the strict style, camera, outline, shading, apparent scale, alpha-spacing, and production-quality reference only. Create a NEW square PNG with EXACTLY four equal columns and four equal rows: sixteen isolated east-facing animal sprites on genuine transparent RGBA, one complete animal per cell, generous transparent gutters, stable foot baselines, no crossing cell boundaries. Rows 1–2 are the SAME historically plausible Texas black bear: compact adult American black bear, dark chocolate-black coat with warm brown muzzle, rounded ears, sturdy natural proportions, no collar. Row 1: coherent four-frame calm forage/idle loop—nose low sniffing, paw lightly turns leaves with no leaves drawn, chewing, calm head raised. Row 2: coherent four-frame alert-to-bound loop—alert planted with head raised, weight gathers, short forward bound with all legs readable, landing/settling. Keep bear centered and comparable in world scale to the reference deer, slightly bulkier but never oversized. Rows 3–4 are the SAME historically plausible collared peccary/javelina: compact piglike body, coarse grizzled charcoal-brown bristles, pale collar stripe behind shoulders, small ears, tapered snout, tiny tail, slender legs; clearly NOT a domestic pig and no tusks exaggerated. Row 3: coherent four-frame calm forage/idle loop—snout low, rooting/sniffing without ground, chewing, head raised. Row 4: coherent four-frame alert/run loop—alert planted, push-off, airborne quick run with alternating legs, landing/settling. Keep it much smaller than bear and similar apparent scale relationship to the deer. Rendering: match the reference\'s warm hand-painted storybook game art, crisp dark-brown contour, subtle painterly fur texture, slightly elevated side/three-quarter view, strong readable silhouette, restrained earthy palette. All face screen-right/east; west is created by mirroring. Tiny contact shadow only under planted feet if needed; no ground patch. Constraints: exactly 16 sprites; true transparent alpha everywhere outside animals; no checkerboard, solid backdrop, grid, borders, labels, text, scenery, plants, rocks, tracks, blood, wounds, carcasses, hunters, weapons, extra animals, overlap, cropping, watermark, photorealism, or repeated identical poses. Preserve one bear identity across rows 1–2 and one javelina identity across rows 3–4. Make locomotion frames visibly distinct and animatable.';

export const promptEntries = [{
  sheet: 'wildlife-bear-javelina',
  promptId: 'frontier-v1/wildlife-bear-javelina',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate from style reference',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/wildlife-deer.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c44d-1811-75f0-9114-bbaa7beaaa36/exec-ea8178bb-cf35-491c-9d2b-e741194d2fa5.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/wildlife-bear-javelina.png',
  postProcessing: 'None. Generated PNG copied unchanged; only read-only atlas validation.',
  review: 'Accepted as a consistent adult black bear and a distinct, smaller collared peccary. Both species have readable calm and locomotion sequences on true alpha.',
}];

export const provenanceEntries = promptEntries.map(({ prompt: _prompt, ...entry }) => entry);
export const notes = ['Bear and javelina art is presentation-only. Hunt selection, quarry position, movement and outcome remain authoritative simulation state. West-facing display mirrors the authored east-facing frames.'];

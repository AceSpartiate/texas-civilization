// Non-graphic powder smoke and dust for dated canister shots; muzzle flash remains the renderer's existing effect.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'canister-burst': ['canister-burst-1', 'canister-burst-2', 'canister-burst-3', 'canister-burst-4'],
};
export const ANIMATION_CLIPS = {
  'canister-burst': { frames: [
    { sprite: 'canister-burst-1', duration: 110 }, { sprite: 'canister-burst-2', duration: 170 },
    { sprite: 'canister-burst-3', duration: 230 }, { sprite: 'canister-burst-4', duration: 310 },
  ], loop: false, authored: true, motion: 'none', direction: 'east; mirror for west' },
};
export const promptEntries = [{
  sheet: 'canister-burst', promptId: 'frontier-v1/canister-burst', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 2x2 atlas of one cannon-canister smoke and dust effect. Four sequential stages from compact gray cloud to widening low triangular cone to broad dust-and-smoke fan to fading wisps, all spreading right from a fixed left-side origin. A few tiny dark pellet specks, muted gray and tan only. No flash, fire, people, impacts, background or text.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/effects.png'],
  generatedSourcePath: `${root}exec-3a2e35e1-022c-4c58-af87-d644528424ce.png`, runtimeFile: 'public/assets/frontier-v1/atlases/canister-burst.png',
  postProcessing: 'None. Copied unchanged; measured atlas validation only.',
  review: 'Selected the smoke-only generation after two flash-bearing drafts produced backward flash direction and saturated edge fringing. Existing muzzle flash remains in code; four-frame sheet carries the widening dust cone without graphic impacts.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['A one-shot canister cloud clip expands only after a dated canister gunshot; legacy puffs remain a load fallback.'];

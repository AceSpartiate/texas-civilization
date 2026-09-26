export const SHEETS = {
  'flag-come-and-take-it': [
    'flag-come-and-take-it', 'flag-come-and-take-it-wind-1',
    'flag-come-and-take-it-wind-2', 'flag-come-and-take-it-wind-3',
  ],
};
export const ANIMATION_CLIPS = {
  'flag-come-and-take-it-wind': {
    frames: [
      { sprite: 'flag-come-and-take-it', duration: 850 },
      { sprite: 'flag-come-and-take-it-wind-1', duration: 600 },
      { sprite: 'flag-come-and-take-it-wind-2', duration: 650 },
      { sprite: 'flag-come-and-take-it-wind-3', duration: 600 },
    ], loop: true, authored: true, motion: 'none', direction: 'east',
  },
};
const prompt = 'Use case: stylized-concept. Asset type: transparent 2D sprite atlas for a historically grounded 1835 Texas Revolution game. Four isolated frames in a strict 2x2 grid, matching the frontier hand-painted dark-outlined style. The same Come and Take It flag on a plain grounded wooden pole in every cell: white cloth, small black star above a black cannon, words exactly COME AND TAKE IT beneath. Reading order: hanging still, light breeze, farther unfurled, returning toward still. Pole and height identical, genuine transparency, no people, scenery, extra text, modern flag or watermark.';
export const promptEntries = [{
  sheet: 'flag-come-and-take-it', promptId: 'frontier-v1/flag-come-and-take-it',
  tool: 'built-in image_gen.imagegen', mode: 'generate', prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/artillery-service.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-7631ed84-b8f8-4881-9a7d-67998758b25d.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/flag-come-and-take-it.png',
  postProcessing: 'None. Generated PNG copied unchanged; measured atlas validation only.',
  review: 'All four white flags keep one black star over the cannon and legible COME AND TAKE IT text, with distinct cloth poses.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Come and Take It flag has authored light-wind poses; rendering and historical deployment must follow the event state, not art availability.'];

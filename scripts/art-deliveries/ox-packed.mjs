export const SHEETS = {
  'ox-packed': [
    ...['e','s','n'].flatMap(dir => [1,2,3,4].map(frame => `ox-packed-walk-${dir}-${frame}`)),
    'ox-packed-idle-e', 'ox-packed-idle-s', 'ox-packed-idle-n', 'ox-packed-rest-e',
  ],
};
export const ANIMATION_CLIPS = {};
for (const dir of ['e','s','n']) {
  ANIMATION_CLIPS[`ox-packed-walk-${dir}`] = {
    frames: [1,2,3,4].map(frame => ({ sprite: `ox-packed-walk-${dir}-${frame}`, duration: 240 })),
    loop: true, authored: true, motion: 'none',
    direction: dir === 'e' ? 'east; west by mirroring' : dir === 's' ? 'south' : 'north',
  };
  ANIMATION_CLIPS[`ox-packed-idle-${dir}`] = {
    frames: [{ sprite: `ox-packed-idle-${dir}`, duration: 2700 }],
    loop: true, authored: false, motion: 'breathe',
    direction: dir === 'e' ? 'east; west by mirroring' : dir === 's' ? 'south' : 'north',
  };
}
const prompt = 'Use case: historical-scene. Asset type: production 2D animated sprite atlas, genuine transparent PNG. Image is the exact brown ox identity and style reference. Exactly sixteen isolated full-body images of the same ox in a 4x4 grid. Pack saddle, rolled blankets, seed sacks, one hoe and one axe tied to both sides; no wagon, yoke or rider. Row 1 east walking four distinct footfalls; row 2 south walking four footfalls; row 3 north walking four footfalls; row 4 stationary east, south, north, and east head lowered. Preserve brown hide, curved cream horns, packs, proportions, warm hand-painted dark outlines and hoof anchors. Generous transparent gutters; no background, grid or labels.';
export const promptEntries = [{
  sheet: 'ox-packed', promptId: 'frontier-v1/ox-packed', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/animal-motion.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-09fcd876-0f1e-490e-b9d8-65a2e96a82b9.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/ox-packed.png', postProcessing: 'None. Generated PNG copied unchanged; atlas validation measures alpha.',
  review: 'Brown ox keeps one pack kit in cardinal four-footfall walks and three idle directions, with separate lowered-head rest.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Packed ox has no vehicle drawn into it. East frames mirror west; south and north are independently painted.'];

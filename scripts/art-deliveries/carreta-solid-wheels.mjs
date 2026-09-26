export const SHEETS = {
  'carreta-solid-wheels': [
    ...['e','s','n'].flatMap(dir => [1,2,3,4].map(frame => `carreta-travel-${dir}-${frame}`)),
    'carreta-idle-e', 'carreta-idle-s', 'carreta-idle-n', 'carreta-loaded-e',
  ],
};
export const ANIMATION_CLIPS = {};
for (const dir of ['e','s','n']) {
  ANIMATION_CLIPS[`carreta-travel-${dir}`] = {
    frames: [1,2,3,4].map(frame => ({ sprite: `carreta-travel-${dir}-${frame}`, duration: 245 })),
    loop: true, authored: true, motion: 'none',
    direction: dir === 'e' ? 'east; west by mirroring' : dir === 's' ? 'south' : 'north',
  };
}
const prompt = 'Use case: historical-scene. Asset type: production 2D animated vehicle sprite atlas for a 1835 Texas Revolution game. Exactly sixteen isolated frames of one hand-built carreta in a 4x4 transparent grid. Rough unhewn poles, rawhide lashings, two great SOLID wooden disc wheels made from thick planks; no spokes or iron tires, ox, rider or cover. Row 1: east travel with wheel peg/plank seam at four rotational positions; row 2 south travel four frames; row 3 north travel four frames; row 4 stationary empty east/south/north and loaded east. Preserve scale, design, dark-brown outline, warm hand-painted frontier style and grounded wheel anchors. Genuine RGBA, clear gutters, no scenery, labels or watermark.';
export const promptEntries = [{
  sheet: 'carreta-solid-wheels', promptId: 'frontier-v1/carreta-solid-wheels', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/cart-open.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-563fc48f-797f-4b63-af12-90cb0063d93c.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/carreta-solid-wheels.png', postProcessing: 'None. Generated PNG copied unchanged; measured alpha validation only.',
  review: 'Solid plank wheels, ox-free vehicle, distinct east wheel-rotation seam and peg; cardinal travel and parked/load states.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Homemade carreta carries no animal painted into its body; keep existing team drawing separate. East mirrors west; north and south independently painted.'];

// Unarmed prisoner art for Goliad. One illustrated figure stands for many sampled men.
export const SHEETS = {
  'goliad-prisoner': [
    ...[1, 2, 3, 4].map(n => `prisoner-walk-e-${n}`),
    ...[1, 2].map(n => `prisoner-walk-s-${n}`),
    ...[1, 2].map(n => `prisoner-walk-n-${n}`),
    'prisoner-idle-e', 'prisoner-idle-s', 'prisoner-listen', 'prisoner-look-back',
    'prisoner-run-e', 'prisoner-duck', 'prisoner-injured', 'prisoner-still',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`prisoner-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `prisoner-walk-${dir}-${i + 1}`, duration: count === 4 ? 210 : 300 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
export const promptEntries = [{
  sheet: 'goliad-prisoner', promptId: 'frontier-v1/goliad-prisoner', tool: 'built-in image_gen.imagegen', mode: 'edit',
  prompt: 'Original 4x4 transparent historical game atlas of one consistent unarmed surrendered Texian prisoner in worn tan frontier coat, faded blue shirt, brown trousers and dark hat. Four east walks, two south, two north; calm east/south idle, worried listen and look back; run, duck, wounded sit and non-graphic still. No musket, pistol, ammunition belt or weapon in any frame. Correct row 3 first two cells to calm arms-at-sides idle poses. Preserve broad alpha gutters, same figure, no extra people, text, blood or scenery.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military-actions.png', 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-85f1cbc9-f530-4566-bae4-ecf25dd7fa97.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-2f106514-edab-478d-9473-fbebedb3a14d.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/goliad-prisoner.png',
  postProcessing: 'No raster post-processing. Initial generated atlas had raised hands in two requested idle cells; built-in imagegen edit corrected those cells, then the accepted PNG was copied unchanged.',
  review: 'Hands free and no weapons in every accepted frame; down poses are non-graphic. This generic figure is not a named prisoner.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Goliad prisoner sheet removes the armed militia stand-in from the prison yard, marching columns and fallen views; guards retain their own regular art.'];

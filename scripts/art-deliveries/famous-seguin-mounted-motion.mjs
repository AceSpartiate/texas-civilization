// Companion gait sheet for the existing Seguín character; preserves his established game identity.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-seguin-mounted-motion': [
    'seguin-mounted-walk-e-1', 'seguin-mounted-walk-e-2',
    'seguin-mounted-canter-e-1', 'seguin-mounted-canter-e-2',
  ],
};
export const ANIMATION_CLIPS = {
  'seguin-mounted-walk-e': {
    frames: [1, 2].map(n => ({ sprite: `seguin-mounted-walk-e-${n}`, duration: 300 })),
    loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
  },
  'seguin-mounted-canter-e': {
    frames: [1, 2].map(n => ({ sprite: `seguin-mounted-canter-e-${n}`, duration: 190 })),
    loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
  },
};
export const promptEntries = [{
  sheet: 'famous-seguin-mounted-motion', promptId: 'frontier-v1/famous-seguin-mounted-motion', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'New genuinely transparent 2x2 companion sprite atlas for the existing Juan Nepomuceno Seguín game character. Preserve the reference exact established young Tejano face, plain brown hat, dark indigo jacket, cream shirt and tan trousers, and the same compact chestnut horse with dark mane, plain tack and rolled grey blanket. Four complete horse-and-rider figures in equal cells with broad alpha gutters. Top row: east walking gait A and opposite-leg east walking gait B. Bottom row: east canter A with forelegs gathered and hindlegs extended; east canter B with forelegs reaching and hindlegs gathered. No extra people, letters, borders, grid, ground, scenery, gore or portrait claim.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-seguin.png'],
  generatedSourcePath: `${root}exec-b0c155f8-34d3-43eb-846e-a0590890615c.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-seguin-mounted-motion.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'The original mounted east/south key poses remain; new walk and canter clips add distinct leg and stride silhouettes while preserving Seguín and his horse.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Seguín has a mounted walk and canter east; east mirrors west. Existing mounted south key pose is still static, so north/south gait cycles remain a future request.'];

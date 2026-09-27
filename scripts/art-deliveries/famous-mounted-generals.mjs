// Original visual interpretations. The horses and dress are art direction, not claims of exact likeness.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-houston-mounted': ['houston-mounted-walk-e-1', 'houston-mounted-walk-e-2', 'houston-mounted-idle-e', 'houston-mounted-walk-s'],
  'famous-santa-anna-mounted': ['santa-anna-mounted-walk-e-1', 'santa-anna-mounted-walk-e-2', 'santa-anna-mounted-idle-e', 'santa-anna-mounted-walk-s'],
};
export const ANIMATION_CLIPS = Object.fromEntries(['houston', 'santa-anna'].map(name => [`${name}-mounted-walk-e`, {
  frames: [1, 2].map(index => ({ sprite: `${name}-mounted-walk-e-${index}`, duration: 320 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
}]));
export const promptEntries = [
  {
    sheet: 'famous-houston-mounted', promptId: 'frontier-v1/famous-houston-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Original transparent RGBA 2x2 game sprite atlas of Sam Houston riding a sturdy chestnut horse (Saracen visual interpretation). Match existing famous-houston.png and famous-seguin.png warm painted style, brown ink outline, three-quarter view. Houston wears his established brown hat and long brown coat, green waistcoat, tan trousers and dark boots. Cells: two east walking gait frames, east idle, south walk. Same man and horse throughout, generous clear alpha cell gutters, no background, grid, words, weapons, gore or other figures.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-houston.png', 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-seguin.png'],
    generatedSourcePath: `${root}exec-de8ee9ff-6352-4656-a589-c8e47ca8cb54.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-houston-mounted.png', postProcessing: 'None. Generated PNG copied unchanged.',
    review: 'Two distinct east gait frames, east idle and south walking; original likeness and horse interpretation.',
  },
  {
    sheet: 'famous-santa-anna-mounted', promptId: 'frontier-v1/famous-santa-anna-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Original transparent RGBA 2x2 game sprite atlas of Antonio López de Santa Anna riding a dark bay horse, distinct from Houston. Match existing famous-santa-anna.png warm painted game style, brown ink outline, three-quarter view. Preserve navy 1830s general jacket with gold epaulettes, red sash, dark blue peaked cap, cream trousers and black boots. Cells: two east walking gait frames, east idle, south walk. Same man and horse throughout, generous clear alpha cell gutters, no background, grid, words, weapons, gore or other figures.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-santa-anna.png'],
    generatedSourcePath: `${root}exec-58a6e130-5dae-4bec-8522-1982decaa105.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-santa-anna-mounted.png', postProcessing: 'None. Generated PNG copied unchanged.',
    review: 'Two distinct east gait frames, east idle and south walking; original likeness and horse interpretation.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt: omitted, ...entry }) => entry);
export const notes = ['Houston and Santa Anna now ride their own animated horses on the campaign map and battlefield; the scene retains the existing historical timing and mounted status.'];

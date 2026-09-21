export const SHEETS = {
  'trees-colonies-2': [
    'post-oak-pole', 'post-oak-log', 'post-oak-large', 'blackjack-pole',
    'blackjack-log', 'blackjack-large', 'pecan-pole', 'pecan-log',
    'pecan-large', 'hackberry-pole', 'hackberry-log', 'hackberry-large',
    'sweetgum-pole', 'sweetgum-log', 'sweetgum-large', 'log-fallen-hardwood',
  ],
};

const staticSway = sprite => ({
  frames: [{ sprite, duration: 3800 }], loop: true, authored: false,
  motion: 'sway', direction: 'not applicable',
});
export const ANIMATION_CLIPS = Object.fromEntries(
  SHEETS['trees-colonies-2']
    .filter(sprite => sprite !== 'log-fallen-hardwood')
    .map(sprite => [`${sprite}-wind`, staticSway(sprite)]),
);

const prompt = 'Use case: historical-scene. Asset type: production sprite atlas for a top-down/elevated three-quarter 1835-1836 Texas frontier simulation. Input image: style and exact scale reference only; create new botanical subjects. Exactly a 4-column by 4-row atlas, read left-to-right, top-to-bottom. Row 1: post oak pole, post oak log-size mature tree, post oak large old tree, blackjack oak pole. Row 2: blackjack oak log-size, blackjack oak large, pecan pole, pecan log-size. Row 3: pecan large, hackberry pole, hackberry log-size, hackberry large. Row 4: sweetgum pole, sweetgum log-size, sweetgum large, one general freshly felled hardwood log lying horizontally. Botanical distinction: post oak has a rounded irregular crown, pale lobed foliage, stout crooked limbs, blocky gray-brown bark; blackjack is smaller, darker, rougher and more compact, with angular branching and dense wedge-shaped leaf masses; pecan is tall and graceful with a high open rounded crown and fine compound leaf texture; hackberry has gray warty bark, uneven spreading crown and finer dull-green foliage; sweetgum has a straight trunk, pyramidal youthful crown becoming rounded at old size, with subtle star-leaf clusters. The pole/log/large progression must be unmistakable within each species. Match the supplied atlas: warm hand-painted outlined miniature game art, earthy olive greens and bark browns, readable silhouette, detailed but not photorealistic, slightly elevated three-quarter view. Strict equal 4x4 cells; every standing tree centered and fully contained from crown to trunk foot; consistent bottom anchors and comparable physical scale to the reference tree sizes; generous genuinely transparent gutters. The felled log is centered low in its cell with cut end visible and the same timber style. Genuine transparent RGBA background; sixteen isolated non-overlapping sprites; no scenery beyond a tiny contact shadow at each base; no labels, letters, numbers, grid lines, checkerboard, borders, people, animals, buildings, stumps, duplicate trees, cropped crowns, or content crossing cell boundaries.';

export const promptEntries = [{
  sheet: 'trees-colonies-2',
  promptId: 'frontier-v1/trees-colonies-2',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/trees-colonies-1.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c3a7-bfaf-7a62-b3f9-02d1b87a23b4/exec-f34e77ef-eacf-47d5-ad53-855f0cb1745c.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/trees-colonies-2.png',
  postProcessing: 'None. Generated original copied unchanged; only read-only validation.',
  review: 'Accepted as sixteen separated true-alpha sprites. Post oak and blackjack have complete pole/log/large progressions; pecan, hackberry and sweetgum add distinct three-size hardwood families; the last cell is a reusable felled hardwood log.',
}];

export const provenanceEntries = promptEntries.map(({ prompt: omittedPrompt, ...entry }) => entry);
export const notes = ['2026-09-21: Post oak, blackjack, pecan, hackberry and sweetgum delivered at all three woods sizes, plus a general felled hardwood log. Single-frame sway clips are presentation metadata only.'];

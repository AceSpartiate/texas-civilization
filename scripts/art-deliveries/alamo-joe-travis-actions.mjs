const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'joe-story-actions': ['joe-door-aim', 'joe-door-fire', 'joe-hurt-e', 'joe-hurt-s'],
  'famous-travis-still': ['travis-still-ramp'],
};
export const ANIMATION_CLIPS = {
  'joe-fire-door': {
    frames: [{ sprite: 'joe-door-fire', duration: 140 }, { sprite: 'joe-door-aim', duration: 5060 }],
    loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
  },
};
export const promptEntries = [
  {
    sheet: 'joe-story-actions', promptId: 'frontier-v1/joe-story-actions', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Production 2x2 transparent RGBA game sprite atlas extending the established Joe sheet. Match the warm hand-painted frontier game style, elevated three-quarter view, brown ink contours, Black man with white rolled-sleeve shirt, charcoal vest, brown trousers. Four isolated cells: top left Joe partly visible in a doorway, only head, shoulders and musket barrel, aiming east; top right same with a tiny muzzle flash; bottom left full figure injured with one hand held to his side facing east; bottom right injured facing south. No blood, gore, words, grid or background; preserve clear alpha gutters and consistent identity.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/joe-poses.png'],
    generatedSourcePath: `${root}exec-3a87a3fd-6507-4afd-ac33-16ccf0aa93e4.png`,
    runtimeFile: 'public/assets/frontier-v1/atlases/joe-story-actions.png', postProcessing: 'None. Original generated PNG copied unchanged.',
    review: 'Joe fires from a doorway and later appears hurt; east can mirror west. The scene preserves his survival.',
  },
  {
    sheet: 'famous-travis-still', promptId: 'frontier-v1/famous-travis-still', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'One transparent RGBA sprite matching the existing William Barret Travis game sheet: he lies still, fully clothed in his navy coat and hat, across a sloped wooden ramp beside a gun carriage at the north battery. Warm hand-painted frontier style, dark brown ink contours, elevated three-quarter view, small-scale readability. Non-graphic; no blood, text, grid, scene background or other figures. Leave clear transparent space around the complete silhouette.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-travis.png'],
    generatedSourcePath: `${root}exec-f0ad533e-ac74-4002-833b-b7ba0a95b469.png`,
    runtimeFile: 'public/assets/frontier-v1/atlases/famous-travis-still.png', postProcessing: 'None. Original generated PNG copied unchanged.',
    review: 'Dedicated non-graphic Travis still pose at the north-battery ramp; no exact likeness or clothing claim.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt: omitted, ...entry }) => entry);
export const notes = ['Joe has an authored doorway-fire loop synchronized to its scene flash and a wounded pose. Travis has a dedicated still pose at the north battery. Neither asset changes history or simulation state.'];

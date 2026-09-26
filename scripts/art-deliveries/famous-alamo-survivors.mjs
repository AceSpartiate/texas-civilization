// Original artist interpretations. These sprites do not establish portrait likenesses
// or decide disputed accounts of the Alamo's final assault.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
const reference = 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-emily-west.png';
const people = {
  seguin: {
    source: 'exec-a4e4e860-3665-4af9-aa48-acbf7b0e737a.png',
    poses: ['idle', 'listen', 'speak', 'command', 'mounted-e', 'mounted-s', 'dispatch-held', 'dispatch-walk'],
    prompt: 'Production transparent 4x4 historical game atlas of Juan Nepomuceno Seguín, respectful original Tejano interpretation in dark indigo jacket, cream shirt, tan trousers and plain hat. Match reference hand-painted miniature style. Row 1 four east walks; row 2 two south and two north walks; row 3 idle, listen, speak, command; row 4 mounted courier east and south, standing with dispatch, walking with dispatch. One consistent person and generous alpha gutters; no gore, text, scenery or portrait claim.',
    review: 'Consistent face and outfit, directional walking and two horse views; mounted views are key poses, not yet a complete horse gait cycle.',
  },
  'susanna-dickinson': {
    source: 'exec-923f9031-9d63-457f-bcc8-ed4aaecec146.png',
    poses: ['idle', 'listen', 'speak', 'nurse', 'shelter-with-angelina', 'hold-angelina', 'carry-angelina', 'rest-with-angelina'],
    prompt: 'Production transparent 4x4 atlas of Susanna Dickinson, original interpretation in faded rust-brown 1830s dress, cream apron and bonnet. Match reference miniature style. Row 1 four east walks; row 2 two south and two north walks; row 3 idle, listen, speak firmly, bandaging; row 4 shelter low with her toddler Angelina, hold Angelina, walk carrying her and a folded blanket, seated exhausted with Angelina asleep. Same mother and toddler in all paired poses; wide alpha gutters, no gore, extra people, scenery, text or portrait claim.',
    review: 'Mother remains identifiable in every view; four composite mother-and-child poses support shelter, evacuation and survivor scenes.',
  },
};

export const SHEETS = {};
export const ANIMATION_CLIPS = {};
export const promptEntries = [];
for (const [name, person] of Object.entries(people)) {
  const sheet = `famous-${name}`;
  SHEETS[sheet] = [
    ...[1, 2, 3, 4].map(n => `${name}-walk-e-${n}`),
    ...[1, 2].map(n => `${name}-walk-s-${n}`),
    ...[1, 2].map(n => `${name}-walk-n-${n}`),
    ...person.poses.map(pose => `${name}-${pose}`),
  ];
  for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) {
    ANIMATION_CLIPS[`${name}-walk-${dir}`] = {
      frames: Array.from({ length: count }, (_, index) => ({ sprite: `${name}-walk-${dir}-${index + 1}`, duration: count === 4 ? 190 : 290 })),
      loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
    };
  }
  promptEntries.push({
    sheet, promptId: `frontier-v1/${sheet}`, tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: person.prompt, referenced_image_paths: [reference], generatedSourcePath: `${root}${person.source}`,
    runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: person.review,
  });
}

SHEETS['famous-angelina-dickinson'] = ['angelina-dickinson-sit', 'angelina-dickinson-reach', 'angelina-dickinson-step', 'angelina-dickinson-sleep'];
ANIMATION_CLIPS['angelina-dickinson-reach'] = {
  frames: [{ sprite: 'angelina-dickinson-sit', duration: 1000 }, { sprite: 'angelina-dickinson-reach', duration: 800 }],
  loop: true, authored: true, motion: 'none', direction: 'front / east',
};
promptEntries.push({
  sheet: 'famous-angelina-dickinson', promptId: 'frontier-v1/famous-angelina-dickinson',
  tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 2x2 atlas of Angelina Dickinson, a toddler around fifteen months old in March 1836. Match Susanna Dickinson atlas: same chestnut-haired child, cream smock and rust blanket. Four distinct separate poses: sitting awake, reaching to mother, careful eastward toddler step, sleeping in blanket. Warm outlined historical storybook style; no mother or other person, backdrop, text, battle or gore.',
  referenced_image_paths: [`${root}${people['susanna-dickinson'].source}`],
  generatedSourcePath: `${root}exec-f738cd45-d3c5-4a79-a868-f7251a1b6f41.png`,
  runtimeFile: 'public/assets/frontier-v1/atlases/famous-angelina-dickinson.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'Toddler scale and identity match the composite mother-and-child poses. No full toddler walk cycle is claimed.',
});
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = [
  'Seguín, Susanna Dickinson and Angelina Dickinson have three distinct identity-preserving sheets. Directional adult walks are animated; Angelina has a seated/reaching loop and a single careful step.',
  'The composite Susanna-and-Angelina frames are authored poses for their joint evacuation and survival. The future historical-person roster must still decide when each is visible and what a family knows.',
];

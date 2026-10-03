// Original game interpretation of Henry Wax Karnes; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-karnes': [
    ...[1, 2, 3, 4].map(n => `karnes-walk-e-${n}`),
    ...[1, 2].map(n => `karnes-walk-s-${n}`),
    ...[1, 2].map(n => `karnes-walk-n-${n}`),
    'karnes-idle', 'karnes-command', 'karnes-aim', 'karnes-fire',
    'karnes-crowbar-set', 'karnes-crowbar-lever', 'karnes-listen', 'karnes-rest',
  ],
  'famous-karnes-mounted': ['karnes-mounted-walk-e-1', 'karnes-mounted-walk-e-2', 'karnes-mounted-idle-e', 'karnes-mounted-idle-s'],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`karnes-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `karnes-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['karnes-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `karnes-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
ANIMATION_CLIPS['karnes-crowbar-work'] = {
  frames: [{ sprite: 'karnes-crowbar-set', duration: 360 }, { sprite: 'karnes-crowbar-lever', duration: 320 }],
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-karnes', promptId: 'frontier-v1/famous-karnes', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 4x4 elevated painterly game atlas. Original interpretive Henry Wax Karnes, sturdy young auburn-haired red-bearded Texas frontiersman in dark hat, plum-brown jacket, buff vest, blue bandanna and brown trousers. Four east walking poses, two south and two north, idle, command, musket aim and fire, two distinct iron crowbar leverage poses at a wooden door edge, listen and rest. Same identity, equal cells, alpha gutters; no portrait claim or text.',
    generatedSourcePath: `${root}exec-3f84f02a-ce35-4fb3-ac35-604dda7ac487.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-karnes.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Dedicated named Béxar crowbar action and Concepción musket poses. Door edge belongs to the action sprite.',
  },
  {
    sheet: 'famous-karnes-mounted', promptId: 'frontier-v1/famous-karnes-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 mounted companion preserving Karnes outfit and face from foot atlas. Same black horse and plain 1830s tack across all cells. Two east walking gait poses, east mounted idle and south mounted idle. Equal cells, broad alpha gutters, painterly elevated game style; no words, background or portrait claim.',
    referenced_image_paths: [`${root}exec-3f84f02a-ce35-4fb3-ac35-604dda7ac487.png`],
    generatedSourcePath: `${root}exec-3c4ab73a-5587-4e24-a9a6-3128cffd3edb.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-karnes-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Horse gait and mounted rest are available for later scout and cavalry staging; horse appearance is an artistic interpretation.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Henry Wax Karnes has foot and mounted motion, musket, and dedicated crowbar work. At Béxar the named Karnes performs the breach action; the generic ramming figure is suppressed.'];

// Original game interpretation of Sidney Sherman; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-sherman': [
    ...[1, 2, 3, 4].map(n => `sherman-walk-e-${n}`),
    ...[1, 2].map(n => `sherman-walk-s-${n}`),
    ...[1, 2].map(n => `sherman-walk-n-${n}`),
    'sherman-idle', 'sherman-command', 'sherman-rally', 'sherman-glass',
    'sherman-folded-banner', 'sherman-point', 'sherman-listen', 'sherman-rest',
  ],
  'famous-sherman-mounted': ['sherman-mounted-walk-e-1', 'sherman-mounted-walk-e-2', 'sherman-mounted-idle-e', 'sherman-mounted-rally-e'],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`sherman-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `sherman-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['sherman-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `sherman-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-sherman', promptId: 'frontier-v1/famous-sherman', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 4x4 hand-painted elevated game atlas of original interpretive Sidney Sherman: sturdy sandy-haired mustached volunteer commander in light brown hat, olive-brown frock, dark green waistcoat, oxblood scarf, tan trousers and dark boots. Four east walks, two south and two north, idle, command, rally, spyglass, folded unmarked cloth, point, listen and rest. Same identity and scale; true alpha gutters, no ground, text, emblem or portrait claim.',
    generatedSourcePath: `${root}exec-f9f85b38-611b-4b7d-a37d-a1eb722e2ae9.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-sherman.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Distinct field commander silhouette and signal poses. Folded cloth is deliberately unmarked; it is not a reconstruction of the Kentucky flag.',
  },
  {
    sheet: 'famous-sherman-mounted', promptId: 'frontier-v1/famous-sherman-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 mounted companion preserving the Sherman light brown hat, olive frock, dark green vest and oxblood scarf. Same dark chestnut horse with black mane/tail and simple 1836 tack. Two east walking gait frames, east idle and mounted hand-raised rally signal. Full figures with alpha margins; no ground, backdrop, emblem, words or portrait claim.',
    referenced_image_paths: [`${root}exec-f9f85b38-611b-4b7d-a37d-a1eb722e2ae9.png`],
    generatedSourcePath: `${root}exec-2b3093c7-5ef0-4630-a236-96f15dafa995.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-sherman-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Dedicated horse-and-rider walk and rally signal for the existing April 20 skirmish.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Sherman has identity-preserving foot and mounted movement and command gestures. The hand-raised mounted pose punctuates the already staged April 20 sortie without supplying disputed words.'];

// Original game interpretation of Mirabeau B. Lamar; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-lamar': [
    ...[1, 2, 3, 4].map(n => `lamar-walk-e-${n}`),
    ...[1, 2].map(n => `lamar-walk-s-${n}`),
    ...[1, 2].map(n => `lamar-walk-n-${n}`),
    'lamar-idle', 'lamar-command', 'lamar-salute', 'lamar-saber-low',
    'lamar-reach', 'lamar-withdraw-signal', 'lamar-listen', 'lamar-rest',
  ],
  'famous-lamar-mounted': ['lamar-mounted-walk-e-1', 'lamar-mounted-walk-e-2', 'lamar-mounted-idle-e', 'lamar-mounted-rescue-e'],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`lamar-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `lamar-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['lamar-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `lamar-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-lamar', promptId: 'frontier-v1/famous-lamar', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 4x4 elevated painterly 1836 Texas game atlas of original interpretive Mirabeau B. Lamar. Slender dark-haired man with sideburns, dark hat, long muted teal coat, buff waistcoat, rust-red neckcloth, tan trousers, tall dark boots. Four east walks, two south and two north, idle, command, salute, saber low, reach to unseen person, withdrawal signal, listen and rest. Same identity, alpha gutters, no background, text or portrait claim.',
    generatedSourcePath: `${root}exec-9ecd14e1-d4e5-4937-93a8-f47838623372.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-lamar.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Distinct dark-teal cavalry figure and command, salute, reach and signal poses. Clothing and face are artistic interpretations.',
  },
  {
    sheet: 'famous-lamar-mounted', promptId: 'frontier-v1/famous-lamar-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 mounted companion of same Lamar identity. Same light gray horse with charcoal mane and tail and simple 1836 tack throughout. Two east walk gait frames, east idle, east mounted reach down to unseen person. Full cutouts with clear margins, no background, text or portrait claim.',
    referenced_image_paths: [`${root}exec-9ecd14e1-d4e5-4937-93a8-f47838623372.png`],
    generatedSourcePath: `${root}exec-ebd41b8f-e585-4490-9970-0a1632453282.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-lamar-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Dedicated mounted gait and reach for the existing April 20 rescue beat; horse coat is interpretive.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Lamar has directional foot travel and named mounted travel. His mounted reach is staged only during the existing April 20 rescue beat; the scene remains governed by the simulation.'];

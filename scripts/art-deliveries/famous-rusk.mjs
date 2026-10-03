// Original game interpretation of Thomas J. Rusk; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-rusk': [
    ...[1, 2, 3, 4].map(n => `rusk-walk-e-${n}`),
    ...[1, 2].map(n => `rusk-walk-s-${n}`),
    ...[1, 2].map(n => `rusk-walk-n-${n}`),
    'rusk-idle', 'rusk-command', 'rusk-stop-one', 'rusk-stop-both',
    'rusk-reach', 'rusk-read', 'rusk-write', 'rusk-rest',
  ],
  'famous-rusk-mounted': ['rusk-mounted-walk-e-1', 'rusk-mounted-walk-e-2', 'rusk-mounted-idle-e', 'rusk-mounted-stop-e'],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`rusk-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `rusk-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['rusk-mounted-walk-e'] = {
  frames: [1, 2].map(n => ({ sprite: `rusk-mounted-walk-e-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
ANIMATION_CLIPS['rusk-stop'] = {
  frames: [{ sprite: 'rusk-stop-one', duration: 500 }, { sprite: 'rusk-stop-both', duration: 620 }],
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [
  {
    sheet: 'famous-rusk', promptId: 'frontier-v1/famous-rusk', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 4x4 painterly elevated Texas Revolution game atlas, original interpretive Thomas J. Rusk. Broad-shouldered clean-shaven adult, dark hat, russet-brown frock, blue-gray waistcoat, cream shirt, buff trousers, dark boots. Four east walks, two south and two north, idle, command, open-hand stop, two-hand appeal, reach, read, write and seated rest. Same full-body identity, wide alpha gutters, no background, text or exact portrait claim.',
    generatedSourcePath: `${root}exec-682d1146-3c92-4c58-867b-a927f3f10778.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-rusk.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Two-stage nonverbal halt gesture for the existing San Jacinto aftermath, and period document poses available for later scenes.',
  },
  {
    sheet: 'famous-rusk-mounted', promptId: 'frontier-v1/famous-rusk-mounted', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 mounted companion of the same Rusk identity and clothing. Same dark bay horse with narrow white blaze, two white hind socks, and simple 1836 tack. Two east horse-walk gait frames, east idle and mounted open-hand stop. Full cutouts with alpha margins; no background, ground, text or portrait claim.',
    referenced_image_paths: [`${root}exec-682d1146-3c92-4c58-867b-a927f3f10778.png`],
    generatedSourcePath: `${root}exec-7c303667-e4f1-4ae0-94b0-0d7c23d38fe8.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-rusk-mounted.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Identity-preserving mounted gait for April 20; mounted stop available to later staging. Horse is interpretive.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Rusk has directional foot and mounted travel and a two-frame open-hand stop gesture in the existing San Jacinto aftermath. The sprite adds no words or altered outcome.'];

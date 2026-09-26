// Distinct named-person art for the Béxar and Goliad campaigns. Historical
// event timing and what a player knows belong to the server, not these sheets.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
const people = {
  milam: {
    source: 'exec-30c2166f-4eb8-4055-a928-47890d9c2981.png',
    reference: 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-crockett.png',
    poses: ['idle', 'speak', 'rally', 'point', 'cover', 'advance', 'fall', 'still'],
    prompt: 'Transparent 4x4 historical game atlas of Benjamin Rush Milam, original interpretation as mature weathered frontiersman in brown coat and felt hat, matching the hand-painted reference. Four east walks; two south and two north walks; idle, speaking, rallying, pointing into town; crouch behind masonry cover, step forward with rifle, non-graphic falling, lying still. Consistent identity, individual transparent cells with wide gutters; no gore, text or scenery.',
    review: 'Rallying and urban-battle key poses support the staged Béxar sequence; fall and still are non-graphic. The existing battle date and sourced words remain authoritative.',
  },
  fannin: {
    source: 'exec-c92dc470-d5bf-4945-a593-b0a61ded0cdd.png',
    reference: 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-travis.png',
    poses: ['idle', 'map', 'command', 'speak', 'cover', 'injured-seated', 'surrender', 'prisoner-seated'],
    prompt: 'Transparent 4x4 historical game atlas of James Walker Fannin Jr., original interpretation in dark green-blue 1830s field coat, cream shirt, tan trousers and plain hat, matching the hand-painted reference. Four east walks; two south and two north walks; idle, map, command, speaking; cover by wagon wheel, seated with bandaged leg, standing surrender with visible hands, seated prisoner. Consistent face and clothes, wide alpha gutters; no guards, depicted execution, gore, text or scenery.',
    review: 'Map, wound, surrender and captivity poses support Coleto and Goliad scenes without depicting an execution or deciding when a family learns the outcome.',
  },
};
export const SHEETS = {}, ANIMATION_CLIPS = {}, promptEntries = [];
for (const [name, person] of Object.entries(people)) {
  const sheet = `famous-${name}`;
  SHEETS[sheet] = [
    ...[1, 2, 3, 4].map(n => `${name}-walk-e-${n}`),
    ...[1, 2].map(n => `${name}-walk-s-${n}`),
    ...[1, 2].map(n => `${name}-walk-n-${n}`),
    ...person.poses.map(pose => `${name}-${pose}`),
  ];
  for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`${name}-walk-${dir}`] = {
    frames: Array.from({ length: count }, (_, index) => ({ sprite: `${name}-walk-${dir}-${index + 1}`, duration: count === 4 ? 190 : 290 })),
    loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
  };
  promptEntries.push({
    sheet, promptId: `frontier-v1/${sheet}`, tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: person.prompt, referenced_image_paths: [person.reference], generatedSourcePath: `${root}${person.source}`,
    runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: person.review,
  });
}
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Milam and Fannin have unique directional walks and eight authored campaign poses each. Their appearance is an artist interpretation, not a documented likeness.'];

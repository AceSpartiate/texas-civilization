// Distinct Bonham and Almeron Dickinson animation-ready Alamo sheets. These are
// original interpretations; the battle engine owns their dates, positions and fates.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
const people = {
  bonham: {
    source: 'exec-ed069f82-1ee9-4cd2-baab-60065a680a94.png',
    poses: ['idle', 'speak', 'point', 'serve-gun', 'aim', 'fire', 'reload', 'still'],
    prompt: 'Production 4x4 transparent RGBA character sprite atlas for James Butler Bonham as an ORIGINAL interpretation, not a likeness, matching the hand-painted 1835 Texas game. Lean adult courier and defender, distinct from blue-coated Travis: charcoal-brown short frontier coat, muted rust waistcoat, cream shirt, tan trousers, dark riding boots and broad-brim brown hat. Same identity in all cells; isolated complete figures, wide transparent gutters, no scenery, grid, text or gore. Row 1 four east walk frames; row 2 two south then two north walk frames; row 3 east idle with musket down, speak, point, serve a cannon with ramrod; row 4 east aim, fire with tiny flash, reload, lie still with no wound drawn. East mirrors west.',
    reference: 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-travis.png',
    review: 'Bonham reads separately from Travis and has a gun-service key pose and non-graphic still pose.',
  },
  'almeron-dickinson': {
    source: 'exec-7cf32b24-6c7a-46a3-b2f7-99611bfa1501.png',
    poses: ['idle', 'speak', 'command', 'serve-gun', 'shot-carry', 'ram', 'fire', 'still'],
    prompt: 'Production 4x4 transparent RGBA character sprite atlas for Almeron Dickinson as an ORIGINAL interpretation, not a likeness, matching the hand-painted 1835 Texas game. Compact mature artilleryman distinct from hatted Bonham: short brown hair, trimmed beard, NO HAT, indigo-blue wool waistcoat over rolled-sleeve cream shirt, tan trousers, work boots. Consistent identity and elevated three-quarter view; sixteen isolated figures, broad transparent gutters, no labels, grid, scenery, shadows or gore. Row 1 four east walk frames; row 2 two south then two north walk frames; row 3 east idle, speak, command, serve a cannon with a ramrod; row 4 east hold cannon shot, ram with both hands, fire musket with small flash, lie still without visible wound. East mirrors west.',
    reference: 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-travis.png',
    review: 'The artilleryman reads differently from Bonham and has shot-handling, ram, gun-service and still key poses.',
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
    sheet, promptId: `frontier-v1/${sheet}`, tool: 'built-in image_gen.imagegen', mode: name === 'almeron-dickinson' ? 'generate + edit' : 'generate',
    prompt: person.prompt, referenced_image_paths: [person.reference], generatedSourcePath: `${root}${person.source}`,
    runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
    postProcessing: 'None. Copied unchanged; the atlas builder measures alpha components and reading-order cells.',
    review: person.review,
    ...(name === 'almeron-dickinson' && { edits: [{
      prompt: 'Precise spacing correction for the exact 4x4 atlas: uniformly scale down each cell character and its gun, ramrod, cannonball and flash to 78%, recenter within its own 313-pixel cell, retain identity, poses, transparency and at least 15 pixels of clearance; especially prevent the bottom-row muzzle flash from overlapping the next cell.',
      reference: `${root}exec-86851308-1173-4d39-847b-16d333287048.png`, generatedSourcePath: `${root}${person.source}`,
      result: 'Accepted only after the atlas overlap audit; first output failed on the fire frame.',
    }] }),
  });
}
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Bonham and Almeron Dickinson have distinct directional walks, gun-service poses and non-graphic still poses. Their faces and clothes are visual interpretations, not portrait claims.'];

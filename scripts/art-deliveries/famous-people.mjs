// Artist's interpretations for the named historical roster in docs/BATTLES.md §2c.
// The roster's later gameplay implementation should bind stable person IDs to these
// art IDs; neither a sprite nor its appearance proves a historical likeness.
const people = {
  crockett: {
    source: 'exec-bf0af831-8877-4d58-8bfc-ded922963da9.png',
    poses: ['idle', 'listen', 'speak', 'command', 'aim', 'fire', 'reload', 'rest-seated'],
    prompt: 'David Crockett, original historically plausible interpretation: mature white frontiersman, tan hunting frock, felt brimmed hat rather than raccoon-tail myth cap, long flintlock. Same person in 4x4 transparent miniature atlas: four east walking footfalls; two south and two north walks; idle, listening, speaking, command; aim, recoil without smoke, reload, seated rest. Muted hand-painted storybook style, ink-brown outlines, generous alpha gutters, no gore or dying pose.',
    review: 'Consistent hunting-frock identity; rifle remains inside every cell. Capture and disputed fate staging require separate art.',
  },
  travis: {
    source: 'exec-c8733eb5-c119-4f7f-b25d-3030b0814a4d.png',
    poses: ['idle', 'speak', 'command', 'write', 'ready', 'aim', 'fire', 'wounded-kneel'],
    prompt: 'William Barret Travis, original historically plausible interpretation: young white officer in weathered navy frock coat, modest buttons, dark hat, cream shirt. Same person in 4x4 transparent miniature atlas: four east walking footfalls with dispatch; two south and two north walks; idle, speaking, command, writing at compact field desk; ready, aim, recoil without smoke, wounded kneel without blood. Muted hand-painted storybook style, ink-brown outlines, generous alpha gutters.',
    review: 'Dispatch and command poses are distinct; wound is non-graphic and not a claim about precise appearance.',
  },
  bowie: {
    source: 'exec-49a228a7-b7a5-4226-bc96-886a7caca360.png',
    poses: ['idle', 'speak', 'command', 'unwell', 'sick-seated', 'sick-bed', 'still-bed', 'rise-bed'],
    prompt: 'James Bowie, original historically plausible interpretation: middle-aged white frontiersman with beard, olive hunting coat, plain hat, sheathed knife. Same person in 4x4 transparent miniature atlas: four east walking footfalls; two south and two north walks; idle, speaking, command, unwell leaning; seated on low cot, lying ill under blanket, lying still, supported rising. No knife fight or invented final death. Muted hand-painted storybook style, ink-brown outlines, generous alpha gutters.',
    review: 'Cot and blanket fit their cells; still-bed is deliberately ambiguous about Bowies disputed final moments.',
  },
  'emily-west': {
    source: 'exec-46901953-f2bf-41fc-af06-6c21de236068.png',
    poses: ['idle', 'speak', 'listen', 'stand-firm', 'carry-tray', 'set-tray', 'sit-converse', 'carry-bundle'],
    prompt: 'Edit the yellow-dress Emily D. West 4x4 atlas, preserving all sixteen poses, face, skin tone, yellow period dress, props, proportions, camera angles and transparent gutters. Remove the cream headwrap entirely in every cell, revealing elegant uncovered dark natural hair in a period-appropriate braided updo with soft temple curls. Keep her poised and beautiful without sexualization or caricature. No added people, scenery, labels or matte. The yellow dress and uncovered hairstyle are owner-chosen, legend-inspired visual interpretation, not a documented clothing claim.',
    review: 'Uncovered braided updo and yellow dress are consistent across all sixteen views; identity and work/conversation poses remain recognizable.',
    editTarget: 'exec-31ac96f1-5f91-4292-a151-016a3afc93d7.png',
  },
  'santa-anna': {
    source: 'exec-2e202281-0450-461a-a00e-19d660ef8152.png',
    poses: ['idle', 'speak', 'command', 'map', 'disguised-walk', 'disguised-idle', 'disguised-seated', 'disguised-speak'],
    prompt: 'Antonio López de Santa Anna, respectful historically plausible original interpretation: adult Mexican man in restrained navy 1830s general uniform, cream trousers, cap. Same face in 4x4 transparent miniature atlas: four east walking footfalls; two south and two north walks; uniformed idle, speaking, command, studying a map; then four capture-day poses in plain brown private soldier coat: walk, unarmed stand, exhausted sit, seated speaking. Muted hand-painted storybook style, ink-brown outlines, generous alpha gutters; no stereotype or gore.',
    review: 'General uniform and plain-clothes capture are visually distinct while retaining one face.',
  },
  houston: {
    source: 'exec-58f9935f-d6db-4db8-81ee-66759ee647e5.png',
    poses: ['idle', 'speak', 'command', 'map', 'injured-seated', 'injured-speak', 'injured-rest', 'injured-stand'],
    prompt: 'Sam Houston, historically plausible original interpretation: tall adult white man with dark hair and beard, brown officer coat, green waistcoat, cream trousers, brimmed hat. Same person in 4x4 transparent miniature atlas: four east walking footfalls; two south and two north walks; idle, speaking, command, studying map; then seated with bandaged ankle, speaking while injured, lying at rest, standing with cane. Muted hand-painted storybook style, ink-brown outlines, generous alpha gutters; no blood.',
    review: 'Camp command and bandaged-ankle aftermath poses retain the same face and outfit.',
  },
};

export const SHEETS = {};
export const ANIMATION_CLIPS = {};
export const promptEntries = [];
const reference = 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-vertical.png';
const sourceRoot = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
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
      loop: true, authored: true, motion: 'none',
      direction: dir === 'e' ? 'east; west by mirroring' : dir === 's' ? 'south' : 'north',
    };
  }
  promptEntries.push({
    sheet, promptId: `frontier-v1/${sheet}`, tool: 'built-in image_gen.imagegen', mode: person.editTarget ? 'edit' : 'generate',
    prompt: person.editTarget ? person.prompt : `Use case: historical-scene. Production square 4x4 transparent PNG sprite atlas using ${reference} as style/camera/scale reference only. ${person.prompt}`,
    referenced_image_paths: person.editTarget ? [`${sourceRoot}${person.editTarget}`] : [reference], generatedSourcePath: `${sourceRoot}${person.source}`,
    ...(name === 'emily-west' ? { sourceLineage: [
      `${sourceRoot}exec-8a4f3a59-90ba-44bd-b0da-d9686dae6aab.png`,
      `${sourceRoot}exec-31ac96f1-5f91-4292-a151-016a3afc93d7.png`,
    ] } : {}),
    runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
    postProcessing: 'None. Generated PNG copied unchanged; alpha and all reading-order cells validated by atlas build.',
    review: person.review,
  });
}
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = [
  'Six Tier 1 named historical people have directional walking cycles and scene-specific key poses. West-facing movement mirrors east; south and north are independently painted.',
  'The faces and clothes are artist interpretations, not authenticated portraits. The generated sheets are ready for the future named-person roster; currently only Houston and Santa Anna parley frames are selected in battle rendering.',
  'The fate animations and historical decisions remain governed by docs/BATTLES.md §2c and the server, not the presence of a sprite.',
];

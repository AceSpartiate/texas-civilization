const CASTS = {
  cast1: ['rust', 'teal', 'elder', 'blue'],
  cast2: ['rust-woman', 'indigo', 'ochre', 'blue-girl'],
};
const DIRS = ['e', 's', 'n'];

export const SHEETS = {};
export const ANIMATION_CLIPS = {};
for (const [cast, variants] of Object.entries(CASTS)) for (const direction of DIRS) {
  SHEETS[`people-mounted-${cast}-${direction}`] = variants.flatMap(variant =>
    [1, 2, 3, 4].map(frame => `${variant}-ride-${direction}-${frame}`));
  for (const variant of variants) ANIMATION_CLIPS[`${variant}-ride-${direction}`] = {
    frames: [1, 2, 3, 4].map(frame => ({ sprite: `${variant}-ride-${direction}-${frame}`, duration: 230 })),
    loop: true,
    authored: true,
    motion: 'none',
    direction: direction === 'e' ? 'east; west by mirroring' : direction === 's' ? 'south' : 'north',
  };
}

const generated = {
  'people-mounted-cast1-e': 'C:/Users/zachw/.codex/generated_images/01a0c4b1-991e-73e1-a80a-d76fa533b7d1/exec-c04ebec7-fafd-4a68-bd8f-188f4ab261b2.png',
  'people-mounted-cast1-s': 'C:/Users/zachw/.codex/generated_images/01a0c4b1-991e-73e1-a80a-d76fa533b7d1/exec-d26c2106-6a29-4ea8-be21-463648dd5f82.png',
  'people-mounted-cast1-n': 'C:/Users/zachw/.codex/generated_images/01a0c4b1-991e-73e1-a80a-d76fa533b7d1/exec-242c805e-b422-4873-b717-18f362cdfe69.png',
  'people-mounted-cast2-e': 'C:/Users/zachw/.codex/generated_images/01a0c4b1-991e-73e1-a80a-d76fa533b7d1/exec-27e5bedd-af14-4430-9d43-c71f65329de7.png',
  'people-mounted-cast2-s': 'C:/Users/zachw/.codex/generated_images/01a0c4b1-991e-73e1-a80a-d76fa533b7d1/exec-f8678b1b-8c75-41a7-9bec-4a00f3e698ea.png',
  'people-mounted-cast2-n': 'C:/Users/zachw/.codex/generated_images/01a0c4b1-991e-73e1-a80a-d76fa533b7d1/exec-29dc7fa9-8ae4-4dcf-95cc-aad38786e3e7.png',
};
const initialEast = {
  'people-mounted-cast1-e': 'C:/Users/zachw/.codex/generated_images/01a0c4b1-991e-73e1-a80a-d76fa533b7d1/exec-f3b808e8-d97b-4045-9a99-686ec35c3179.png',
  'people-mounted-cast2-e': 'C:/Users/zachw/.codex/generated_images/01a0c4b1-991e-73e1-a80a-d76fa533b7d1/exec-6e52c755-39bb-4e84-9d91-6a15564b7f6f.png',
};
const references = {
  cast1: ['public/assets/frontier-v1/atlases/people-walk.png', 'public/assets/frontier-v1/atlases/people-vertical.png', 'public/assets/frontier-v1/atlases/courier-mounted.png'],
  cast2: ['public/assets/frontier-v1/atlases/people-cast2-walk.png', 'public/assets/frontier-v1/atlases/people-cast2-vertical.png', 'public/assets/frontier-v1/atlases/courier-mounted.png'],
};
const generationPrompt = 'Create a strict 4x4 transparent mounted-family sprite atlas in the established hand-inked painted Texas 1835 style. Four named cast identities are rows; four distinct horse-walk footfalls are columns. Every person rides astride with complete legs, boots and stirrups on the same chestnut courier horse. Preserve identity, period clothing, scale and ground anchor. Genuine RGBA; no background, grid, text, shadows, crop, overlap or modern equipment.';
const spacingPrompt = 'Change only size and spacing: independently scale each of sixteen complete east-facing horse-and-rider figures to 78% in its own cell. Preserve exact art, identity, pose and order. Keep 1254x1254 RGBA and generous transparent gutters.';

export const promptEntries = Object.entries(generated).map(([sheet, generatedSourcePath]) => {
  const cast = sheet.includes('cast1') ? 'cast1' : 'cast2';
  const east = sheet.endsWith('-e');
  return {
    sheet,
    promptId: `frontier-v1/${sheet}`,
    tool: 'built-in image_gen.imagegen',
    mode: east ? 'generate + precise-object-edit' : 'generate',
    prompt: generationPrompt,
    referenced_image_paths: references[cast],
    generatedSourcePath,
    runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
    postProcessing: 'None. Accepted built-in imagegen PNG copied byte-for-byte; only read-only validation.',
    review: east ? 'Accepted after a built-in uniform spacing correction; true RGBA and sixteen isolated complete riders.' : 'Accepted as generated; true RGBA and sixteen isolated complete riders.',
    ...(east ? { edits: [{ prompt: spacingPrompt, reference: initialEast[sheet], generatedSourcePath, result: 'Accepted with safe gutters.' }] } : {}),
  };
});
export const provenanceEntries = promptEntries.map(entry => ({
  ...entry,
  references: references[entry.sheet.includes('cast1') ? 'cast1' : 'cast2'],
  historicalNote: 'All riders use an astride seat for practical frontier travel; skirts are arranged modestly over saddle and legs.',
  ...(initialEast[entry.sheet] ? { generationHistory: [{ generatedSourcePath: initialEast[entry.sheet], result: 'Identity and gait accepted; rejected for tight cell-edge spacing.' }, { generatedSourcePath: entry.generatedSourcePath, result: 'Accepted after built-in spacing correction.' }] } : {}),
}));
export const notes = [
  'Mounted-family delivery: six 4x4 RGBA sheets, 96 frames and 24 authored four-frame clips. East clips mirror west; north and south are independently painted.',
  'Eight identities preserve their established clothing marks while riding the same chestnut horse as courier-mounted. All ride astride for practical frontier travel.',
  'Runtime binding should make seatedClip return <variant>-ride-<direction> and carriedWithRider suppress the separate horse; this delivery intentionally does not edit shared motion code.',
];

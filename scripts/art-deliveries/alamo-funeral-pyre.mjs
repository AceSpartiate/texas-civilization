export const SHEETS = { 'alamo-funeral-pyre': ['alamo-pyre-unlit', 'alamo-pyre-fire-1', 'alamo-pyre-fire-2', 'alamo-pyre-fire-3'] };
export const ANIMATION_CLIPS = { 'alamo-pyre-burning': {
  frames: [1, 2, 3].map(index => ({ sprite: `alamo-pyre-fire-${index}`, duration: 360 })),
  loop: true, authored: true, motion: 'none', direction: 'not applicable',
} };
const prompt = 'Create one funeral pyre game sprite per frame in a strict 2x2 transparent RGBA atlas, matching a warm hand-painted Texas Revolution game with brown ink contours and elevated three-quarter view. Each frame shows the same broad irregular mound of alternating dry wood and fully clothed fallen Alamo defenders, in rough overlapping layers. People recognizable by clothed torsos and trouser legs, partly obscured by wood, with no exposed faces, blood, wounds, bones or graphic detail. Top left completely unlit; other three frames the same mound with modest changing flames around wood and drifting smoke. Somber history, no other pyres, background, text or grid; transparent gutters around each cell.';
export const promptEntries = [{
  sheet: 'alamo-funeral-pyre', promptId: 'frontier-v1/alamo-funeral-pyre', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt,
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a4e0da5e-f9f1-4353-b03a-f48a6dfff558.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/alamo-funeral-pyre.png', postProcessing: 'None. Original generated PNG copied unchanged.',
  review: 'One irregular pile, unlit plus three flame/smoke frames; renderer places three separate large piles at reconstruction sites. Non-graphic.',
  generationHistory: [
    { generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-09edea7f-7cd3-41b8-acdf-94fea9b2b95a.png', result: 'Rejected: two tidy wrapped forms underplayed the scale and implied shrouding without support.' },
    { generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-954a34fe-bded-4b9f-aaa8-f327317f11d0.png', result: 'Rejected: three piles grouped side by side implied an unsupported clustered location.' },
  ],
}];
export const provenanceEntries = promptEntries.map(({ prompt: omitted, ...entry }) => entry);
export const notes = ['Three separated Alamo pyres are a labelled spatial reconstruction informed by three later ash sites, not a claim that their exact 1836 coordinates are known. Preparation starts about 3 p.m.; fire starts about 5 p.m. by Ruiz’s account.'];

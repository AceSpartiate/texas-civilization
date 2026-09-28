// North/south mounted gait companion for the established Seguín game character.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-seguin-mounted-ns': [
    'seguin-mounted-walk-s-1', 'seguin-mounted-walk-s-2',
    'seguin-mounted-walk-n-1', 'seguin-mounted-walk-n-2',
  ],
};
export const ANIMATION_CLIPS = {};
for (const dir of ['s', 'n']) ANIMATION_CLIPS[`seguin-mounted-walk-${dir}`] = {
  frames: [1, 2].map(n => ({ sprite: `seguin-mounted-walk-${dir}-${n}`, duration: 300 })),
  loop: true, authored: true, motion: 'none', direction: dir === 's' ? 'south' : 'north',
};
export const promptEntries = [{
  sheet: 'famous-seguin-mounted-ns', promptId: 'frontier-v1/famous-seguin-mounted-ns', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'New transparent 2x2 north/south mounted gait atlas for the established Juan Nepomuceno Seguín game character. Preserve his young Tejano face, brown wide-brim hat, indigo short jacket, cream shirt, tan trousers, the same compact chestnut horse with dark mane and tail, plain tack, saddlebags and rolled grey blanket. Match the existing painterly ink-line horse/rider scale. Equal isolated cells with broad alpha gutters. Top row: south toward viewer, alternating foreleg walking steps A and B. Bottom row: north away from viewer, alternating hindleg walking steps A and B, with back of rider and hat visible. No east figures, extra people, ground, scenery, text, grid, gore or exact portrait claim.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-seguin-mounted-motion.png', 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-seguin.png'],
  generatedSourcePath: `${root}exec-3884dba8-6810-4edb-8ca9-88ce4332755f.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-seguin-mounted-ns.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'Matches Seguín and his established chestnut horse; distinct south and north two-step walks complete his cardinal mounted travel.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Seguín now has authored mounted walking clips east (mirrored west), north and south. The battle projection supplies heading from dated route keys, leaving the route and clock unchanged.'];

// Cutscene asset library. The 1837 funeral is documented; the solitary collection gesture is dramatized;
// church-floor placement follows Seguín's later recollection, and the identity of the 1936 discovery is disputed.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-seguin-ashes': ['seguin-ashes-stand', 'seguin-ashes-kneel', 'seguin-ashes-gather', 'seguin-ashes-rise'],
  'alamo-ash-sites-1837': ['ash-site-small-a', 'ash-site-small-b', 'ash-site-large', 'ash-site-scooped'],
  'seguin-funeral-props': ['funeral-coffin-closed', 'funeral-coffin-open', 'funeral-coffin-honors', 'funeral-coffin-church-floor'],
  'san-fernando-1936': ['san-fernando-floor-intact', 'san-fernando-floor-open', 'san-fernando-box-found', 'san-fernando-marble-memorial'],
};
export const ANIMATION_CLIPS = {
  'seguin-ashes-collect': {
    frames: [
      { sprite: 'seguin-ashes-stand', duration: 900 },
      { sprite: 'seguin-ashes-kneel', duration: 850 },
      { sprite: 'seguin-ashes-gather', duration: 1100 },
      { sprite: 'seguin-ashes-rise', duration: 1000 },
    ],
    loop: false, authored: true, motion: 'none', direction: 'east; mirror for west',
  },
};
export const promptEntries = [
  {
    sheet: 'famous-seguin-ashes', promptId: 'frontier-v1/famous-seguin-ashes', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 atlas of Juan Nepomuceno Seguín in the established game identity: medium-brown skin, plain brown hat, dark indigo jacket, cream shirt, tan trousers, dark boots. Four east-facing story poses: stand looking down; kneel and reach; gather a small amount of ash into a folded cloth; rise holding closed cloth. Warm painted frontier miniature style, brown ink outlines, non-graphic, no background or extra people.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-seguin.png'],
    generatedSourcePath: `${root}exec-06d68b8f-07b9-4f3b-b17f-d5480d54d5c1.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-seguin-ashes.png', postProcessing: 'None. Generated PNG copied unchanged.',
    review: 'Original Seguín visual interpretation; a quiet, solitary gathering is dramatized and never claimed as a documented secret act.',
  },
  {
    sheet: 'alamo-ash-sites-1837', promptId: 'frontier-v1/alamo-ash-sites-1837', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 atlas of ash-site remnants one year after the Alamo: two distinct small shallow gray ash and charred timber patches, one larger irregular remnant with several low ash heaps, and one close patch with a scooped indentation. Sparse regrowing grass, warm painted game style, no people, bones, skulls, fire, smoke or background.',
    generatedSourcePath: `${root}exec-340f6115-6483-4dc0-b3b6-d6fe898c51e9.png`, runtimeFile: 'public/assets/frontier-v1/atlases/alamo-ash-sites-1837.png', postProcessing: 'None. Generated PNG copied unchanged.',
    review: 'Three distinguishable sites plus a gathered state, supporting the three later ash deposits without asserting exact coordinates.',
  },
  {
    sheet: 'seguin-funeral-props', promptId: 'frontier-v1/seguin-funeral-props', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 historical game prop atlas: plain black-covered 1830s wooden coffin closed; same open with gray ash and blank lid; same closed with early Texas flag, rifle and sheathed sword displayed for the public funeral; a cutaway of that small wooden coffin in a shallow stone church-floor recess by a simple altar rail. Warm inked game style, no modern marble, no bones, no writing.',
    generatedSourcePath: `${root}exec-0f052e04-bbc4-40cf-a094-215e564d8f1d.png`, runtimeFile: 'public/assets/frontier-v1/atlases/seguin-funeral-props.png', postProcessing: 'None. Accepted imagegen spacing edit copied unchanged.',
    review: '1837 coffin and funeral props are visually distinct from the later marble memorial. Church-floor burial is a later-attributed account.',
    edits: [{ prompt: 'Shrink each of the four existing cell contents to about 84%, preserve all details, center within its own 768x512 cell, leave at least 24 transparent pixels on all sides and prevent a rifle muzzle, coffin handle, lid, rail or slab from crossing any boundary.', reference: `${root}exec-a530f20e-8a10-4673-9ded-175ebcfe29f9.png`, generatedSourcePath: `${root}exec-0f052e04-bbc4-40cf-a094-215e564d8f1d.png`, result: 'Accepted after the original 119-cell-overlap-pixel audit failure.' }],
  },
  {
    sheet: 'san-fernando-1936', promptId: 'frontier-v1/san-fernando-1936', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 game cutscene prop atlas for a disputed 1936 church discovery: intact old limestone floor near altar rail; same floor with lifted slabs; decayed small wooden box and gray ash in an open floor recess without identifiable bones; later white marble memorial sarcophagus. Warm painted style, blank surfaces, no people, text or background. Never imply marble is the 1837 container.',
    generatedSourcePath: `${root}exec-fb76b785-573a-42b6-a0b3-81203c6def46.png`, runtimeFile: 'public/assets/frontier-v1/atlases/san-fernando-1936.png', postProcessing: 'None. Generated PNG copied unchanged.',
    review: 'Separate 1936 discovery and later memorial visuals. Attribution of the found remains to the Alamo defenders is disputed.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt: omitted, ...entry }) => entry);
export const notes = ['Seguín ashes cutscene library has a four-pose one-shot collection clip, three ash-site variants, the black 1837 wooden coffin and separate church-floor/1936 discovery props. Historical-claim boundaries are in docs/SEGUIN_ASHES_CUTSCENE.md.'];

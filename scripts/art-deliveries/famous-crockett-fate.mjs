// A visually explicit, non-graphic treatment of one disputed account. The
// server's tradition label and alternate accounts remain the authority.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-crockett-fate': ['crockett-captive-1', 'crockett-captive-2', 'crockett-still-side', 'crockett-still-turn'],
};
export const ANIMATION_CLIPS = {
  'crockett-captive': {
    frames: [{ sprite: 'crockett-captive-1', duration: 1800 }, { sprite: 'crockett-captive-2', duration: 1300 }],
    loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
  },
};
const prompt = 'Create a production 2x2 transparent RGBA game sprite atlas extending the attached David Crockett character in the EXACT same warm hand-painted ink-outlined 1836 Texas game style. Keep the same face, brown beard, tan broad-brim hat, fringed tan coat, brown trousers, boots, build and elevated three-quarter view; this is an original interpretation, not an exact historical portrait. Four isolated full-body poses, one centered inside each of four equal cells with generous fully transparent gutters and no clipping, overlap, labels, background, shadow, weapons, blood or gore. TOP LEFT: standing east/screen-right, unarmed captive with both hands visibly open at waist level, rifle and knife completely absent. TOP RIGHT: second small motion key pose for the same captive, unarmed, open hands slightly raised and shoulders turned a little toward the viewer. BOTTOM LEFT: lying still on his side, hat nearby but no weapon, eyes closed, calm non-graphic. BOTTOM RIGHT: lying still from a slightly different 3/4 angle, eyes closed, no injury marks. Keep the same character identity in every cell. The captive and still are an interpretation for a disputed historical account, not a claim about what certainly happened.';
export const promptEntries = [{
  sheet: 'famous-crockett-fate', promptId: 'frontier-v1/famous-crockett-fate', tool: 'built-in image_gen.imagegen', mode: 'generate', prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-crockett.png'],
  generatedSourcePath: `${root}exec-2c4497c7-2553-4ee3-8678-516cee259c2b.png`,
  runtimeFile: 'public/assets/frontier-v1/atlases/famous-crockett-fate.png',
  postProcessing: 'None. Generated RGBA PNG copied unchanged; atlas build measures alpha and frame bounds.',
  review: 'Two unarmed open-hand captive keys and two non-graphic still views; game labels the outcome as one disputed account.',
}];
export const provenanceEntries = promptEntries.map(({ prompt: omitted, ...entry }) => entry);
export const notes = ['Crockett captive and still art only changes presentation of the game’s labelled disputed account; no historical rule or outcome is inferred from the asset.'];

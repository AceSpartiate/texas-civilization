import { PLANNED_SHEETS, PLANNED_ANIMATION_CLIPS } from './cast2.mjs';
const record = {
  "sheet": "people-cast2-work",
  "mode": "generate",
  "referenced_image_paths": [
    "C:/Users/zachw/.codex/generated_images/01a09f7b-6a62-7370-b596-a9fc91f4b0d4/exec-ac612f32-1bd2-41ac-91e0-f6fd9a9e62f9.png"
  ],
  "prompt": "Use case: historical-scene. Production 2D sprite atlas for Texas 1835 farm storybook game. EXACT 1254 x 1254 pixel square PNG, genuine transparent alpha background. Strict 4 columns x 4 rows, exactly 16 complete isolated full-body figures, one per cell, generous clear gutters, no crop or overlap. Constant foot baseline within each row. Warm outlined miniature art matching reference civilians: hand-drawn dark brown contour, simple flat material color regions, muted rust/cream/ochre/moss palette, slight elevated north-up view, clear small cartoon proportions. No text, labels, borders, checkerboard, ground, shadows, scenery, weapons. Four fixed identities, same person/colors/clothes in all four cells of their row: ROW1 rust-woman: adult woman medium warm skin, brown hair under tan sunbonnet, rust-red blouse, tan ankle skirt, cream apron, brown shoes. ROW2 indigo: adult woman brown skin, indigo-blue ankle dress, cream neck kerchief, brown shoes, dark hair pinned up, no hat. ROW3 ochre: clean-shaven younger adult man medium warm skin, ochre shirt, dark-brown waistcoat, grey trousers, brown boots, short dark hair, no hat. ROW4 blue-girl: adolescent girl, light warm skin, muted blue ankle dress, cream apron, brown shoes, dark hair in one braid. Fill each cell similarly to adult reference, preserve adolescent proportions. Input is IDENTITY REFERENCE, preserve these four people exactly in every cell. WORK sheet, all figures face east/screen-right. Every row is a four-frame HOE/DIG farm work loop with a wood-handled iron hoe. Columns:1 hoe lifted slightly behind;2 hoe swung forward/down;3 blade contacting ground near feet and body bent forward;4 hoe pulling back as torso begins upright. Only person and hoe. No soil patch, no flying dirt. Distinct limb, tool, torso changes.",
  "status": "candidate",
  "tool": "built-in image_gen.imagegen",
  "generatedSourcePath": "C:\\Users\\zachw\\.codex\\generated_images\\01a082eb-77f7-7f73-8400-ebcc7426ac7b\\exec-24c75451-862f-40f5-80c4-78b56b3f57f1.png",
  "runtimeFile": "public/assets/frontier-v1/atlases/people-cast2-work.png",
  "promptId": "frontier-v1/people-cast2-work",
  "postProcessing": "None. Original PNG copied unchanged on acceptance."
};
export const SHEETS = { 'people-cast2-work': PLANNED_SHEETS['people-cast2-work'] };
export const ANIMATION_CLIPS = Object.fromEntries(Object.entries(PLANNED_ANIMATION_CLIPS).filter(([id]) => id.endsWith('-work')));
export const promptEntries = [{ ...record, status:'accepted', review:'Four distinct hoe phases per identity; genuine RGBA. Gameplay binding awaits complete identity action sets.' }];
export const provenanceEntries = promptEntries.map(({prompt,...entry}) => entry);
export const notes = ['Second cast work adds four authored hoe cycles. Other missing action sheets must not be inferred from these poses.'];

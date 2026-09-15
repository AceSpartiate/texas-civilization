// Accepted second-cast social/task atlases. No idle frame or clip duplicates.
const variants = ['rust-woman','indigo','ochre','blue-girl'];
const row = actions => variants.flatMap(p => actions.map(a => `${p}-${a}`));
export const SHEETS = {
  'people-cast2-care': row(['rest-pose','injured-pose','care-1','care-2']),
  'people-cast2-search-trade': row(['search-1','search-2','trade-1','trade-2']),
};
export const ANIMATION_CLIPS = {};
const clip = (name, sprites, durations, motion = 'none') => {
  ANIMATION_CLIPS[name] = {frames:sprites.map((sprite,i)=>({sprite,duration:Array.isArray(durations)?durations[i]:durations})),loop:true,authored:sprites.length>1,motion,direction:'east; west by mirroring'};
};
for (const p of variants) {
  clip(`${p}-rest`,[`${p}-rest-pose`],2500,'breathe');
  clip(`${p}-injured-rest`,[`${p}-injured-pose`],3000,'breathe');
  clip(`${p}-care`,[`${p}-care-1`,`${p}-care-2`],420);
  clip(`${p}-search`,[`${p}-search-1`,`${p}-search-2`],[900,900]);
  clip(`${p}-trade`,[`${p}-trade-1`,`${p}-trade-2`],[500,700]);
}
export const promptEntries = [
  {
    "sheet": "people-cast2-care",
    "promptId": "frontier-v1/people-cast2-care",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Use case: historical-scene. Production 2D sprite atlas for Texas 1835 farm storybook game. EXACT 1254 x 1254 pixel square PNG, genuine transparent alpha background. Strict 4 columns x 4 rows, exactly 16 complete isolated full-body figures, one per cell, generous clear gutters, no crop or overlap. Constant foot baseline within each row. Warm outlined miniature art matching reference civilians: hand-drawn dark brown contour, simple flat material color regions, muted rust/cream/ochre/moss palette, slight elevated north-up view, clear small cartoon proportions. No text, labels, borders, checkerboard, ground, shadows, scenery, weapons. Four fixed identities, same person/colors/clothes in all four cells of their row: ROW1 rust-woman: adult woman medium warm skin, brown hair under tan sunbonnet, rust-red blouse, tan ankle skirt, cream apron, brown shoes. ROW2 indigo: adult woman brown skin, indigo-blue ankle dress, cream neck kerchief, brown shoes, dark hair pinned up, no hat. ROW3 ochre: clean-shaven younger adult man medium warm skin, ochre shirt, dark-brown waistcoat, grey trousers, brown boots, short dark hair, no hat. ROW4 blue-girl: adolescent girl, light warm skin, muted blue ankle dress, cream apron, brown shoes, dark hair in one braid. Fill each cell similarly to adult reference, preserve adolescent proportions. Input is IDENTITY REFERENCE, preserve these four people exactly in every cell. CARE sheet, all figures face east/screen-right. EVERY row columns:1 sitting at rest on a low stool, hands in lap;2 same sitting rest with one arm in clean white cloth sling;3 kneeling caregiver holding folded cloth with hands close;4 same kneeling caregiver reaching hands outward with cloth. Last two form a visibly different two-frame care loop. No patients, blood, other people, ground patches or weapons. Preserve full figure and constant head size, humane dignified poses.",
    "referenced_image_paths": [
      "C:/Users/zachw/.codex/generated_images/01a09f7b-6a62-7370-b596-a9fc91f4b0d4/exec-ac612f32-1bd2-41ac-91e0-f6fd9a9e62f9.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-6a62-7370-b596-a9fc91f4b0d4/exec-b088a733-57c6-4857-8d08-268a7208bae1.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-cast2-care.png",
    "postProcessing": "None. Original PNG copied unchanged; source originals preserved. Only read-only alpha measurement.",
    "review": "Accepted after visual review and read-only RGBA validation. Sixteen complete identity-consistent figures, distinct action poses, no painted backdrop."
  },
  {
    "sheet": "people-cast2-search-trade",
    "promptId": "frontier-v1/people-cast2-search-trade",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Use case: historical-scene. Production 2D sprite atlas for Texas 1835 farm storybook game. EXACT 1254 x 1254 pixel square PNG, genuine transparent alpha background. Strict 4 columns x 4 rows, exactly 16 complete isolated full-body figures, one per cell, generous clear gutters, no crop or overlap. Constant foot baseline within each row. Warm outlined miniature art matching reference civilians: hand-drawn dark brown contour, simple flat material color regions, muted rust/cream/ochre/moss palette, slight elevated north-up view, clear small cartoon proportions. No text, labels, borders, checkerboard, ground, shadows, scenery, weapons. Four fixed identities, same person/colors/clothes in all four cells of their row: ROW1 rust-woman: adult woman medium warm skin, brown hair under tan sunbonnet, rust-red blouse, tan ankle skirt, cream apron, brown shoes. ROW2 indigo: adult woman brown skin, indigo-blue ankle dress, cream neck kerchief, brown shoes, dark hair pinned up, no hat. ROW3 ochre: clean-shaven younger adult man medium warm skin, ochre shirt, dark-brown waistcoat, grey trousers, brown boots, short dark hair, no hat. ROW4 blue-girl: adolescent girl, light warm skin, muted blue ankle dress, cream apron, brown shoes, dark hair in one braid. Fill each cell similarly to adult reference, preserve adolescent proportions. Input is IDENTITY REFERENCE, preserve these four people exactly in every cell. SEARCH AND TRADE sheet, all figures face east/screen-right. EVERY row columns:1 upright searching, hand shading brow looking ahead;2 searching slightly crouched, inspecting ground with open hand;3 trading with hand extending a small closed plain cloth pouch;4 trading with hand pulling pouch back toward chest. Only one person per cell, no hunted animals, weapons, floating objects or ground. Distinct arm, head and knee poses.",
    "referenced_image_paths": [
      "C:/Users/zachw/.codex/generated_images/01a09f7b-6a62-7370-b596-a9fc91f4b0d4/exec-ac612f32-1bd2-41ac-91e0-f6fd9a9e62f9.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-6a62-7370-b596-a9fc91f4b0d4/exec-d0bdc366-aa04-469e-bbd4-785076bd1c9f.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-cast2-search-trade.png",
    "postProcessing": "None. Original PNG copied unchanged; source originals preserved. Only read-only alpha measurement.",
    "review": "Accepted after visual review and read-only RGBA validation. Sixteen complete identity-consistent figures, distinct action poses, no painted backdrop."
  }
];
export const provenanceEntries = promptEntries.map(({prompt,...entry})=>entry);
export const notes = [
  'Read-only buildManifest/buildAnimations validation: 32 frames, 20 clips. Zero measured rectangle overlaps. Minimum horizontal gutters: care 58px, search/trade 45px. Minimum outer margins: care 14px, search/trade 4px; the latter is tight but complete. Both images are 1254x1254 RGBA and byte-identical to generated originals.',
  'Fully transparent pixels: care 939386; search/trade 1004503. SHA256 care bcf48200c26245dc72dfaf3c8331617e476b9f166934bc1ce3b5f80e12038a11; search/trade 42b3e457d725e888c0713c87bdc4b6b5f2d9325b922bb0579ca815b1369a838c.',
  'Care uses seated rest, seated arm-in-sling injury, and two kneeling cloth-offering poses. This follows the existing people-care contract.',
  'Search/trade has visibly different brow-shading, ground inspection, extended pouch and withdrawn pouch poses.',
  'Both sheets preserve the idle-reference identities; source pixels were not edited or resized after generation. Baked material colors are not separable appearance masks.',
  'No rejected generations or alpha-fix passes were needed for these two sheets. Frame measurement and source-byte equality are checked separately.',
];

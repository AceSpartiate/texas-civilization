// Original interpretation of Colonel Nicolás Condelle; no exact likeness or uniform claim.
export const SHEETS = {
  'famous-condelle': [
    ...[1, 2, 3, 4].map(n => `condelle-walk-e-${n}`),
    ...[1, 2].map(n => `condelle-walk-s-${n}`),
    ...[1, 2].map(n => `condelle-walk-n-${n}`),
    'condelle-idle', 'condelle-command-palm', 'condelle-point', 'condelle-read-map',
    'condelle-speak', 'condelle-listen', 'condelle-saber-low', 'condelle-rest',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`condelle-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `condelle-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['condelle-command'] = {
  frames: [{ sprite: 'condelle-command-palm', duration: 650 }, { sprite: 'condelle-point', duration: 850 }],
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [{
  sheet: 'famous-condelle', promptId: 'frontier-v1/famous-condelle', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 4x4 warm outlined storybook game atlas matching famous-cos camera and line weight. Original interpretive Nicolas Condelle: stout older officer with square face, grey sideburns and moustache, navy shako/coat, rust cuffs/collar, muted gold epaulettes, cream trousers, dark boots, sheathed saber. Four east walks, two south, two north, idle, palm command, point, map, speak, listen, hand on sheathed sword and seated rest. Equal isolated full-body cells and clear alpha gutters. No background, shadows, words, firing, gore, portrait or exact uniform claim.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-cos.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-866cb396-d421-43a6-8195-16d2cc1b6bb4.png', runtimeFile: 'public/assets/frontier-v1/atlases/famous-condelle.png',
  spacingRefinement: "Reformat this entire 16-character sprite sheet into a STRICT clean 4x4 equally spaced grid on true transparent alpha. Preserve all 16 pose identities in reading order, character appearance and exact warm outlined style. SCALE EVERY CUTOUT DOWN to occupy no more than 78 percent of its grid-cell height and 78 percent of its width, center each independently in its equal cell. Leave at least 25 transparent pixels between all neighboring silhouettes both horizontally AND vertically, including hats and boots. Absolutely no touching characters or overlapping adjacent row pixels. Ensure top row has four walking poses with alternating planted/passing legs, second row 2 south then 2 north walking, third idle/palm command/point/map, fourth speak/listen/saber low/seated rest. Full body cutouts with safe outer margins. Keep true transparent background without checkerboard, no shadows, text or grid.",
  originalPrompt: "Use case: historical-scene. Create a production-ready transparent PNG 4 columns by 4 rows character sprite atlas, exactly 16 separate full-body cutouts with generous transparent gutters. Reference image is STYLE ONLY: match its warm outlined storybook farm-game illustration, thin dark olive-brown contour, restrained flat shaded cream/rust/moss/ochre palette, slightly elevated three-quarter camera, readable small game proportions. New subject: original interpretive Colonel Nicolas Condelle for Texas Revolution Bexar 1835, distinct from reference officer: older stout officer with square face, short greying sideburns, thick grey moustache, dark navy shako, dark navy coat with rust collar and cuffs, muted gold epaulettes, cream trousers and dark boots, sheathed saber. Uniform is an artistic interpretation, no exact portrait or unit insignia claim. Same face/body/costume in all 16 cells. Row 1 four genuinely different EAST-facing walking gait frames alternating leading legs/arms, from contact to passing to opposite contact to passing. Row 2 two SOUTH-facing walk frames then two NORTH-facing walk frames. Row 3 east idle hands at sides, east open palm command gesture, east extended pointing command gesture, east reading folded map. Row 4 east speaking hand lifted to chest, east listening, east hand resting on sheathed sword hilt, east seated rest. Keep all feet/headwear/props intact, constant scale and foot baseline within rows, equal grid cells, no intercell overlap. No firing, no blood, no death, no background, no ground patch or shadow, no text, no grid lines. True transparent alpha.",
  refinementPrompt: "Edit only the TOP ROW of this transparent 4x4 atlas. Preserve the other 12 cells exactly unchanged, preserve the same character, style, full-body scale, hat, face, navy uniform, alpha and grid. The top row currently repeats a stride; replace its four cells with a genuine four-frame EAST walking loop: cell1 left boot forward/right boot behind contact; cell2 left boot planted under body with right knee bent swinging forward (passing); cell3 RIGHT boot forward/LEFT boot behind opposite contact, reverse arm swing visibly; cell4 right boot planted under body with LEFT knee bent swinging forward opposite passing. Substantially different leg silhouettes, upright torso/head fixed at same elevation, natural readable marching, keep each figure fully within its cell with generous alpha gutters. Do not mirror facing: all face screen-right. No shadows or text.",
  refinementSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-89e7f254-8ae8-4caf-b0b2-147fb27c6d90.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'Distinct officer for the existing Morelos battalion staging at Bexar. Face and uniform are artistic interpretations. No new speech, fate or historical timing.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Condelle directional north/south walks, map, speech, listening, lowered-saber and seated variants are available for future staging; the current Bexar scene uses east walk, idle and command. No new firing, death or surrender is staged.'];

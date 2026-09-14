// Built-in imagegen delivery, 2026-09-14. Raster sources are copied byte-for-byte.
const children = ['girl', 'boy', 'smallchild'];
export const SHEETS = {
  'people-children-idle': [...children.flatMap(p => ['s','e','w','n'].map(d => `${p}-idle-${d}`)), 'infant-awake','infant-asleep','infant-idle-w','infant-idle-e'],
  'people-children-walk': [...children.flatMap(p => [1,2,3,4].map(n => `${p}-walk-${n}`)), null,null,null,null],
  // The generator filled three physical rows; using twelve entries matches the actual source layout.
  'people-children-care': children.flatMap(p => ['rest-s-pose','rest-e-pose','injured-s-pose','injured-e-pose'].map(a => `${p}-${a}`)),
};
export const ANIMATION_CLIPS = {};
function clip(name, sprites, duration, direction, motion='none') {
  ANIMATION_CLIPS[name] = { frames:sprites.map(sprite=>({sprite,duration})), loop:true, authored:sprites.length>1, motion, direction };
}
for (const p of children) {
  for (const d of ['s','e','w','n']) clip(`${p}-idle-${d}`,[`${p}-idle-${d}`],2200,({s:'south',e:'east',w:'west',n:'north'})[d],'breathe');
  clip(`${p}-walk`,[1,2,3,4].map(n=>`${p}-walk-${n}`),180,'east; west by mirroring');
  for (const [action,pose,duration] of [['rest','rest',2500],['injured-rest','injured',3000]]) {
    clip(`${p}-${action}`,[`${p}-${pose}-s-pose`],duration,'south','breathe');
    for (const d of ['s','e']) clip(`${p}-${action}-${d}`,[`${p}-${pose}-${d}-pose`],duration,d==='s'?'south':'east; west by mirroring','breathe');
  }
}
clip('infant-idle-s',['infant-awake'],3000,'south','breathe');
clip('infant-rest',['infant-asleep'],3000,'south','breathe');
for(const d of ['w','e']) clip(`infant-idle-${d}`,[`infant-idle-${d}`],3000,d==='w'?'west':'east','breathe');

const base = 'C:/Users/zachw/.codex/generated_images/01a09f7b-282b-7ea1-a38a-d98437d3a6b3/';
const source = {
 idle: base+'exec-7968abc7-d53d-4fc5-b448-7e7684b4191f.png',
 walk: base+'exec-c72a1afc-ac2f-4278-860f-5f2ea6dac360.png',
 care: base+'exec-a2483a80-eda1-4ba6-90cf-f59f4472f681.png',
};
const prompts = {
 idle: "Use case: historical-scene. Asset type: production game sprite atlas people-children-idle, Texas 1835. Reference image 1 is style reference only: match its warm outlined storybook farm-game art, hand-drawn dark brown contour, simple flat shading, muted moss/rust/cream/ochre palette and slight elevated north-up view. Create a NEW square 1254 x 1254 PNG with genuine transparent RGBA background. Strict FOUR equal columns by FOUR equal rows, sixteen isolated sprites with generous transparent gutters. No background color, checkerboard, ground patches, shadows, text or gridlines. Full figures centered with constant foot baseline per row, safe margins. Children fill their cells like adults in reference but have CHILD proportions, larger heads, short limbs; game scales them down. Preserve each identity in every pose. Rows 1-3 columns are precisely SOUTH/front, WEST/screen-left, EAST/screen-right, NORTH/back, all neutral standing. Row1 same girl age 7: warm medium skin, dark brown hair in one braid, faded rose calico dress, cream pinafore, small brown shoes. Row2 same boy age 7: light warm skin, straw blond short hair, undyed linen shirt, brown trousers held by exactly ONE suspender, bare feet, no hat. Row3 same gender-neutral child age 3: warm medium skin, short brown hair, plain cream gown to shins, bare feet. Row4 a swaddled infant in a small woven brown basket, 4 poses: awake front view, asleep front view, basket viewed from WEST, basket viewed from EAST. Infant cream swaddle, no adult. No weapons or soldiers. Keep every sprite within its individual equal cell. Transparency must be genuine alpha, never drawn checkerboard.",
 idleFix: "Use case: background-extraction. Edit this sprite sheet. Remove ALL checkerboard background and make those pixels genuinely transparent alpha. Output transparent RGBA PNG, preserving the existing sixteen sprites, their outlines and colors and exact poses and positions. Keep 1254 x 1254 dimensions and all characters/baskets unchanged. No new background, no painted checkerboard, no shadows, no replacements; only extract these sixteen sprites from the opaque checkerboard to genuine alpha transparency.",
 walk: "Use case: historical-scene. Create new production sprite animation sheet people-children-walk. Input image is IDENTITY and STYLE reference for first three rows; keep precisely these children's faces, hair, clothing, skin tones, child proportions and dark brown outlined warm storybook flat shading. Square 1254 x 1254 transparent RGBA PNG, genuine alpha; NO checkerboard, color backdrop, shadows, ground, text, lines. Strict FOUR equal columns by FOUR equal rows with generous empty gutters. EXACTLY 12 sprites in rows 1-3; ENTIRE bottom quarter/row4 is EMPTY transparent. Each full child fills equal cell like reference adults, same feet baseline in each row. All face SCREEN RIGHT (east), walking in place. Columns1-4 four-frame walk cycle: left foot forward; passing with one leg raised; right foot forward; passing with opposite leg raised. Distinct alternating legs and counter-swing arms, locked outfit. Row1 girl age7 warm medium skin dark single braid faded rose calico dress cream pinafore small brown shoes. Row2 boy age7 light warm skin straw blond hair undyed linen shirt brown trousers exactly ONE suspender bare feet. Row3 gender-neutral child age3 warm medium skin short brown hair plain cream shin-length gown bare feet, toddler's shorter steps and arms slightly out. No infant, no props, no work poses. Draw children with larger heads and shorter limbs but fill the cells; renderer applies age scaling. Transparent background must be actual alpha channel.",
 walkFix: "Use case: background-extraction. Remove every grey checkerboard square from this 12-sprite children's walking sheet, replace the entire background with genuine fully transparent alpha. Output RGBA PNG 1254 x 1254. Preserve all twelve sprite poses, positions, colors, fine dark outlines and costume details exactly. Bottom area must be completely transparent empty space. Only remove background. Do not replace it with a checkerboard, color or texture. Keep all art unchanged.",
 vertical: "Use case: historical-scene. New production sprite sheet people-children-vertical, same three children in input identity/style reference. Match dark brown hand-drawn contours, warm storybook farm-game simple flat shading, muted colors and slightly elevated view. Create square 1254 x 1254 transparent RGBA PNG. TWELVE cutout figures in three rows of four; FOURTH ROW completely empty transparency. Four equally spaced columns, generous transparent gutters, complete centered figures, common foot baseline per row. All artwork is isolated against genuine alpha transparent empty space, NOT a checkerboard. No shadows, ground patches, text, lines, borders, props or infant. Columns are exactly: 1 walking TOWARD camera/SOUTH with left leg forward, 2 walking TOWARD camera with RIGHT leg forward, 3 walking AWAY from camera/NORTH seen from BACK with left leg forward, 4 walking AWAY seen from BACK with RIGHT leg forward. Distinct alternate footfall and counter-swing arms, clear straight FRONT views then BACK views, zero side-facing figures. Row1 same girl age7 medium warm skin dark brown single braid faded rose calico dress cream pinafore small brown shoes. Row2 same boy age7 light warm skin straw blond hair undyed linen shirt brown trousers ONE suspender bare feet. Row3 same gender-neutral toddler age3 warm medium skin short brown hair cream shin-length gown bare feet. Keep identity and costume like reference. Toddler short steps, arms slightly out; all figures large in cells with child proportions, renderer scales down.",
 verticalFix: "Use case: precise-object-edit. Fix this children's front/back walking sprite sheet. Preserve identities, costumes, colors, outlines, row/column layout. For the boy and toddler in rows2 and3, make the pose in column2 advance the OPPOSITE LEG from column1, and column4 advance the OPPOSITE LEG from column3, with opposite arm swing: the alternating left-right footfalls must clearly differ. Keep first two columns facing directly toward camera and last two directly away, no side view. Girl row1 already alternates correctly and must stay unchanged. Remove ALL checkerboard background and output genuine transparent alpha RGBA PNG at 1254 x 1254. Every pixel outside the twelve figures must be transparent, including blank bottom row. No replacement background, shadows, ground, text or lines.",
 care: "Use case: historical-scene. Create production sprite sheet people-children-care. Input reference defines identical three children's faces, outfits, skin and dark brown outlined warm storybook style. Square 1254 x 1254 genuine transparent alpha RGBA PNG. FOUR columns and FOUR rows; exactly twelve sprites in rows1-3, fourth row COMPLETELY EMPTY transparent. Generous empty gutters, centered isolated full figures. Row1 same age7 girl, dark single braid, faded rose calico dress cream pinafore small brown shoes. Row2 same age7 boy straw blond hair, linen shirt brown trousers one suspender bare feet. Row3 same age3 gender-neutral toddler short brown hair plain cream gown bare feet. Columns: 1 sitting quietly at rest facing front/south, 2 sitting quietly at rest facing screen-right/east, 3 lying hurt resting facing viewer, 4 lying hurt resting in screen-right profile. Hurt means quiet closed eyes and a simple cloth bandage on ankle, no blood or wound. Preserve child proportions and costumes, make sprites fill each cell with safe margins. No furniture, blankets, ground, shadows, text, lines, background color or checkerboard. Transparent pixels outside art must have alpha zero.",
};
const rejected = {
 idle: base+'exec-8ad93faa-c494-4923-8176-a0c7e9a3f63f.png',
 walk: base+'exec-179fe6b6-ae1c-4877-8a68-f324b44d2205.png',
 vertical: base+'exec-7c1e2902-a34a-4324-b8ce-0a351015bf2e.png',
 verticalFix: base+'exec-59d31d23-3f0a-42c0-bfb9-77e44ab2f30d.png',
};
const review = {
 idle: 'RGBA 1254x1254, 64.8835% fully transparent. Sixteen figures inspected. Actual idle columns south/east/west/north are mapped to match image. Rows have unequal physical heights; smallchild still needs renderer age scale. Accepted after built-in alpha extraction.',
 walk: 'RGBA 1254x1254, 71.6227% fully transparent. Twelve east-facing steps inspected. Fourth logical row empty. Silhouette changes are modest between frames 1/3 and 2/4; body/costume identity retained. Accepted after built-in alpha extraction.',
 care: 'RGBA 1254x1254, 62.7158% fully transparent. Twelve rest/injured poses inspected. Actual sheet has three physical rows rather than requested fourth empty row; registered as 3x4. Boy resting poses also have ankle bandage. Source copied unchanged.',
};
export const promptEntries = Object.keys(source).map(key=>({
 sheet:`people-children-${key}`, promptId:`frontier-v1/people-children-${key}`, tool:'built-in image_gen.imagegen', mode:'generate', prompt:prompts[key],
 generatedSourcePath:source[key], runtimeFile:`public/assets/frontier-v1/atlases/people-children-${key}.png`,
 referenceImages:[key==='idle'?'public/assets/frontier-v1/atlases/civilians.png':source.idle],
 ...(prompts[key+'Fix']?{editPrompt:prompts[key+'Fix'],attempts:[{mode:'generate',prompt:prompts[key],generatedSourcePath:rejected[key],review:'Rejected: opaque RGB painted checkerboard.'},{mode:'edit',prompt:prompts[key+'Fix'],referencedImagePaths:[rejected[key]],generatedSourcePath:source[key],review:review[key]}]}:{}),
 postProcessing:'None. Built-in generator output copied unchanged; original source preserved.',review:review[key],
}));
export const provenanceEntries = promptEntries.map(({prompt,editPrompt,...entry})=>entry);
// Keep the unsuccessful vertical attempts recorded without exposing false walking clips.
export const pendingGenerations = [{sheet:'people-children-vertical',status:'needs-correction',attempts:[
 {mode:'generate',prompt:prompts.vertical,referencedImagePaths:[source.idle],generatedSourcePath:rejected.vertical,review:'Rejected opaque RGB checkerboard, boy/toddler alternate footfalls repeat.'},
 {mode:'edit',prompt:prompts.verticalFix,referencedImagePaths:[rejected.vertical],generatedSourcePath:rejected.verticalFix,review:'RGBA 1254x1254, 60.8059% transparent. Three physical rows, no fourth empty row. Boy south corrected but boy north and toddler south remain repeated footfalls; not registered as complete walking animation.'},
]}];
export const notes = [
 'Children priority 1 partially delivered: idle, east walk, rest and injured-rest. Vertical animation pending clean opposite footfalls. No work, carry, sow or repair poses for children.',
 'Care uses measured 3x4 physical layout (12 entries) because generation did not preserve a fourth empty row. Idle/walk retain 16 logical slots.',
  'All accepted sources are unmodified built-in imagegen PNGs; no external API or raster-processing script used. Keep age scaling in renderer.',
  'Children-only buildManifest/buildAnimations validation passed: 40 measured frames, 37 valid clips, no overlap trimming failure, alpha corners 0/1. Byte equality with all three generated sources verified. Full-library check was blocked by courier-dismount/courier-horse-wait-4 trimming 0.251%, outside this delivery.',
];

// Second-cast atlas delivery; imported by the central registry after art review.
// PNG originals are copied unchanged; measurement never rewrites pixels.
export const VARIANTS = ['rust-woman', 'indigo', 'ochre', 'blue-girl'];
const row = actions => VARIANTS.flatMap(p => actions.map(a => `${p}-${a}`));
export const PLANNED_SHEETS = {
  'people-cast2-idle': row(['idle-s', 'idle-e', 'idle-w', 'idle-n']),
  'people-cast2-walk': row([1,2,3,4].map(n => `walk-${n}`)),
  'people-cast2-vertical': row(['walk-s-1','walk-s-2','walk-n-1','walk-n-2']),
  'people-cast2-work': row([1,2,3,4].map(n => `work-${n}`)),
  'people-cast2-carry': row([1,2,3,4].map(n => `carry-${n}`)),
  'people-cast2-tasks': row(['sow-1','sow-2','repair-1','repair-2']),
  'people-cast2-care': row(['rest-pose','injured-pose','care-1','care-2']),
  'people-cast2-search-trade': row(['search-1','search-2','trade-1','trade-2']),
  'people-cast2-dialogue': row(['speak-1','speak-2','listen-s','listen-n']),
};
export const PLANNED_ANIMATION_CLIPS = {};
const clip = (name, sprites, durations = 180, motion = 'none', direction = 'east; west by mirroring') => {
  PLANNED_ANIMATION_CLIPS[name] = { frames: sprites.map((sprite,i) => ({sprite, duration:Array.isArray(durations) ? durations[i] : durations})), loop:true, authored:sprites.length > 1, motion, direction };
};
for (const p of VARIANTS) {
  for (const action of ['walk','work','carry']) clip(`${p}-${action}`, [1,2,3,4].map(n => `${p}-${action}-${n}`), action === 'work' ? [240,120,220,220] : 180);
  for (const d of ['s','n']) clip(`${p}-walk-${d}`, [1,2].map(n => `${p}-walk-${d}-${n}`),220,'none',d === 's' ? 'south' : 'north');
  for (const action of ['sow','repair']) clip(`${p}-${action}`, [1,2].map(n => `${p}-${action}-${n}`),360);
  clip(`${p}-search`,[`${p}-search-1`,`${p}-search-2`],[900,900]);
  clip(`${p}-trade`,[`${p}-trade-1`,`${p}-trade-2`],[500,700]);
  clip(`${p}-care`,[`${p}-care-1`,`${p}-care-2`],420);
  clip(`${p}-rest`,[`${p}-rest-pose`],2500,'breathe');
  clip(`${p}-injured-rest`,[`${p}-injured-pose`],3000,'breathe');
  for (const d of ['s','w','e','n']) clip(`${p}-idle-${d}`,[`${p}-idle-${d}`],2200,'breathe',({s:'south',w:'west',e:'east',n:'north'})[d]);
  clip(`${p}-speak`,[`${p}-speak-1`,`${p}-speak-2`],[750,900]);
  for (const d of ['s','n']) clip(`${p}-listen-${d}`,[`${p}-listen-${d}`],2200,'breathe',d === 's' ? 'south' : 'north');
}
// Only accepted art may enter the runtime registry. Other definitions above are
// retained for the next generation session, rather than claiming missing assets.
export const SHEETS = {'people-cast2-idle': PLANNED_SHEETS['people-cast2-idle']};
export const ANIMATION_CLIPS = Object.fromEntries(Object.entries(PLANNED_ANIMATION_CLIPS).filter(([name]) => /-idle-[sewn]$/.test(name)));

const generatedRoot = 'C:/Users/zachw/.codex/generated_images/01a09f7b-6a62-7370-b596-a9fc91f4b0d4/';
const generated = name => generatedRoot + name;
const reference = 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/civilians.png';
const idleOriginal = generated('exec-c5813895-8ff6-4091-aea7-759ef9007b5a.png');
const idleFix1 = generated('exec-5b979863-c301-4a9e-b5ac-d2b51394fb5f.png');
const idleAccepted = generated('exec-ac612f32-1bd2-41ac-91e0-f6fd9a9e62f9.png');
const walkOriginal = generated('exec-f8ecc0bd-6e76-498d-bc76-f5bbb2d0f799.png');
const verticalOriginal = generated('exec-502eadbd-5b8c-420b-a8fa-807624d0fa6e.png');
export const basePrompt = 'Use case: historical-scene. Production 2D sprite atlas for Texas 1835 farm storybook game. EXACT 1254 x 1254 pixel square PNG, genuine transparent alpha background. Strict 4 columns x 4 rows, exactly 16 complete isolated full-body figures, one per cell, generous clear gutters, no crop or overlap. Constant foot baseline within each row. Warm outlined miniature art matching reference civilians: hand-drawn dark brown contour, simple flat material color regions, muted rust/cream/ochre/moss palette, slight elevated north-up view, clear small cartoon proportions. No text, labels, borders, checkerboard, ground, shadows, scenery, weapons. Four fixed identities, same person/colors/clothes in all four cells of their row: ROW1 rust-woman: adult woman medium warm skin, brown hair under tan sunbonnet, rust-red blouse, tan ankle skirt, cream apron, brown shoes. ROW2 indigo: adult woman brown skin, indigo-blue ankle dress, cream neck kerchief, brown shoes, dark hair pinned up, no hat. ROW3 ochre: clean-shaven younger adult man medium warm skin, ochre shirt, dark-brown waistcoat, grey trousers, brown boots, short dark hair, no hat. ROW4 blue-girl: adolescent girl, light warm skin, muted blue ankle dress, cream apron, brown shoes, dark hair in one braid. Fill each cell similarly to adult reference, preserve adolescent proportions. ';
const idlePrompt = basePrompt + 'Reference image is STYLE ONLY. Create the above new cast; do not copy reference identities. IDLE sheet: each row columns LEFT TO RIGHT: facing south/front, facing west/screen-left, facing east/screen-right, facing north/away. Relaxed standing, arms by sides. Make west and east directions exact; only column4 shows backs.';
const fix1Prompt = 'Edit the reference sprite sheet. Remove the entire opaque gray-and-white checkerboard from all empty spaces, including enclosed gaps, replacing it with REAL transparent alpha (alpha zero). Output an RGBA PNG with actual transparency, 1254 by 1254. Do not paint a new checkerboard or a solid background. Preserve every character pixel, identity, clothing, pose, dimensions, layout and scale. Nothing else changes. The result is sixteen isolated full figures on true clear transparency.';
const fix2Prompt = 'Cut out all sixteen people from image 1 and deliver their sprite sheet with a transparent background. Retain exact image dimensions and the exact appearance and placement of all sixteen people. Remove ALL gray and white squares between people. Blank spaces must be genuinely transparent, not illustrated. Output PNG with RGBA alpha transparency. This is a background removal task only.';
const movementPrefix = basePrompt + 'Input is the IDENTITY REFERENCE: preserve these four people exactly, including their established skin tones and every clothing color. ';
const walkPrompt = movementPrefix + 'WALK sheet. Every figure faces EAST / screen-right. Columns are four DIFFERENT consecutive walk-in-place poses: left foot forward/right foot back; passing with raised trailing leg; right foot forward/left foot back; opposite passing leg. Clear swing in arms, legs, skirts. Exact same head/body/clothes dimensions throughout row, constant foot baseline. No idle duplicate poses.';
const verticalPrompt = movementPrefix + 'VERTICAL WALK sheet. Columns: 1 walking TOWARD VIEWER / SOUTH left leg forward; 2 walking TOWARD VIEWER / SOUTH right leg forward; 3 walking AWAY / NORTH left leg forward; 4 walking AWAY / NORTH right leg forward. First two are clear FRONT views. Last two are clear BACK views. No side facing figures. Leg/arm/hem positions visibly differ in each pair.';
const postProcessing = 'None. Accepted original PNG copied unchanged. Rejected generation originals retained. Read-only RGBA decoding; no source pixels rewritten.';
const review = 'Accepted idle after visual review and read-only decodeRgba: 1254 x 1254, RGBA 8-bit, 1,069,949 fully transparent pixels. Sixteen full figures. Actual order S,E,W,N is reflected in frame IDs.';
export const promptEntries = [{sheet:'people-cast2-idle',promptId:'frontier-v1/people-cast2-idle',tool:'built-in image_gen.imagegen',mode:'generate + edit',prompt:idlePrompt,generatedSourcePath:idleAccepted,runtimeFile:'public/assets/frontier-v1/atlases/people-cast2-idle.png',postProcessing,review,edits:[{prompt:fix1Prompt,reference:idleOriginal,generatedSourcePath:idleFix1,result:'Rejected: opaque RGB checkerboard remained.'},{prompt:fix2Prompt,reference:idleFix1,generatedSourcePath:idleAccepted,result:'Accepted RGBA transparency.'}],reference}];
export const provenanceEntries = promptEntries.map(({prompt,edits,...entry}) => ({...entry,generationHistory:[{generatedSourcePath:idleOriginal,reference,result:'Rejected: RGB opaque checkerboard.'},...edits]}));
export const rejectedEntries = [
  {sheet:'people-cast2-idle',generatedSourcePath:idleOriginal,prompt:idlePrompt,reference,reason:'Opaque RGB checkerboard; superseded by accepted second background edit.'},
  {sheet:'people-cast2-idle',generatedSourcePath:idleFix1,prompt:fix1Prompt,reference:idleOriginal,reason:'Opaque RGB checkerboard; superseded by accepted second background edit.'},
  {sheet:'people-cast2-walk',generatedSourcePath:walkOriginal,prompt:walkPrompt,reference:idleAccepted,reason:'Opaque RGB checkerboard. Gait alternation should also be improved before accepting.'},
  {sheet:'people-cast2-vertical',generatedSourcePath:verticalOriginal,prompt:verticalPrompt,reference:idleAccepted,reason:'RGBA 1254square with 1,013,729 fully transparent pixels, but repeated forward foot in each pair; insufficient alternating walk poses. Tight top/bottom margins. Not registered as authored animation.'},
];
export const notes = [
  'Partial delivery: idle only (16 frames and 16 still breathing clips). All eight other requested sheets remain open.',
  'Imagegen returned HTTP 429 usage_limit_reached while starting work/carry/tasks and movement fixes; resets_at 1789399826. No output from those calls. Do not register planned definitions until art is accepted.',
  'Idle columns are actual S,E,W,N, matching existing civilians but differing from requested S,W,E,N. Frame IDs describe the visible poses.',
  'Broad clean material colors support later appearance work, but these are baked-color figures, not separable layers or tested palette masks.',
  'Same woman/man/girl identities visually retained; dark indigo renders as muted blue. Minor generated texture and outline fringes remain. Browser pixel review is left to central integration.',
  'Generated originals remain at their recorded paths; workspace archival copies are in output/art-rejected/cast2/.',
];
const taskPrefix = basePrompt + 'Input is IDENTITY REFERENCE, preserve these four people exactly in every cell. ';
export const pendingEntries = [
  {sheet:'people-cast2-walk',mode:'edit',referenced_image_paths:[walkOriginal],prompt:'Make background transparent. Remove gray checkerboard. Keep drawings.',status:'Attempted in failed HTTP429 batch; no output. Also review alternating foot poses.'},
  {sheet:'people-cast2-vertical',mode:'edit',referenced_image_paths:[verticalOriginal],prompt:'Correct only the alternating walk poses in this sprite sheet. In columns2 and4 of EVERY ROW swap the left and right leg positions and arm swing: show the opposite foot forward compared to columns1 and3. Keep columns1 and3 unchanged. Preserve all four people, clothes, colors, scale, front/back facing, 1254square four-by-four layout and genuine transparent alpha. Add a little clear margin above and below all figures so no part touches image edges. All 16 full figures.',status:'Attempted in failed HTTP429 batch; no output.'},
  {sheet:'people-cast2-work',mode:'generate',referenced_image_paths:[idleAccepted],prompt:taskPrefix+'WORK sheet, all figures face east/screen-right. Every row is a four-frame HOE/DIG farm work loop with a wood-handled iron hoe. Columns:1 hoe lifted slightly behind;2 hoe swung forward/down;3 blade contacting ground near feet and body bent forward;4 hoe pulling back as torso begins upright. Only person and hoe. No soil patch, no flying dirt. Distinct limb, tool, torso changes.',status:'Attempted in failed HTTP429 batch; no output.'},
  {sheet:'people-cast2-carry',mode:'generate',referenced_image_paths:[idleAccepted],prompt:taskPrefix+'CARRY sheet, all figures face east/screen-right. Four consecutive in-place walking poses with steady held goods, LEFT foot forward, passing, RIGHT foot forward, opposite passing; unmistakably alternate feet, not repeated legs. Row1 holds rough burlap sack;row2 woven basket;row3 rolled blanket;row4 wood bucket. Same goods in all four cells of each row.',status:'Attempted in failed HTTP429 batch; no output.'},
  {sheet:'people-cast2-tasks',mode:'generate',referenced_image_paths:[idleAccepted],prompt:taskPrefix+'TASKS sheet, all figures face east/screen-right. EVERY row columns1and2 TWO-FRAME SOWING LOOP: crouched holding seedpouch, right arm close then extended toward ground releasing seeds. NO soil patch. Columns3and4 TWO-FRAME REPAIR: sitting on low stool, wood hoe handle across knees, small hammer raised then hammer down against handle. Same person scale and head size, clearly different arms.',status:'Attempted in failed HTTP429 batch; no output.'},
  {sheet:'people-cast2-care',mode:'generate',referenced_image_paths:[idleAccepted],prompt:taskPrefix+'CARE sheet, all figures face east/screen-right. EVERY row columns:1 sitting at rest on a low stool, hands in lap;2 same sitting rest with one arm in clean white cloth sling;3 kneeling caregiver holding folded cloth with hands close;4 same kneeling caregiver reaching hands outward with cloth. Last two form a visibly different two-frame care loop. No patients, blood, other people, ground patches or weapons. Preserve full figure and constant head size, humane dignified poses.',status:'Prepared, not submitted.'},
  {sheet:'people-cast2-search-trade',mode:'generate',referenced_image_paths:[idleAccepted],prompt:taskPrefix+'SEARCH AND TRADE sheet, all figures face east/screen-right. EVERY row columns:1 upright searching, hand shading brow looking ahead;2 searching slightly crouched, inspecting ground with open hand;3 trading with hand extending a small closed plain cloth pouch;4 trading with hand pulling pouch back toward chest. Only one person per cell, no hunted animals, weapons, floating objects or ground. Distinct arm, head and knee poses.',status:'Prepared, not submitted.'},
  {sheet:'people-cast2-dialogue',mode:'generate',referenced_image_paths:[idleAccepted],prompt:taskPrefix+'DIALOGUE sheet. EVERY row columns:1 speaking EAST/screen-right, one hand raised a little;2 speaking EAST/screen-right with open palm;3 listening SOUTH toward viewer, hands together and head slightly forward;4 listening NORTH facing away, seen from behind with head slightly tilted. Preserve same full body scale and foot baseline. Each east speaking pair has distinct articulated arms. Last column clearly back view, not side. No props, text, speech bubbles or other people.',status:'Prepared, not submitted.'},
];

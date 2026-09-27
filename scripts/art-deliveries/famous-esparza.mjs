// Original visual interpretation of Gregorio Esparza; no likeness or clothing claim.
const name = 'esparza';
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-esparza': [
    ...[1, 2, 3, 4].map(n => `${name}-walk-e-${n}`),
    ...[1, 2].map(n => `${name}-walk-s-${n}`),
    ...[1, 2].map(n => `${name}-walk-n-${n}`),
    ...['idle', 'speak', 'point', 'serve-gun', 'shot-carry', 'aim', 'fire', 'still'].map(pose => `${name}-${pose}`),
  ],
};
export const ANIMATION_CLIPS = Object.fromEntries([['e', 4], ['s', 2], ['n', 2]].map(([dir, count]) => [`${name}-walk-${dir}`, {
  frames: Array.from({ length: count }, (_, index) => ({ sprite: `${name}-walk-${dir}-${index + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
}]));
const prompt = 'Create a production 4x4 game sprite atlas for José María (Gregorio) Esparza, the Tejano Alamo defender, as an ORIGINAL visual interpretation, not a claim of portrait likeness or documented clothing. Match the attached games warm hand-painted frontier style, dark brown ink contour, consistent elevated three-quarter perspective and small-sprite readability. He must look different from the attached Bonham and Dickinson atlases: middle-aged Mexican Tejano man, medium-brown skin, black wavy hair, short dark moustache, no hat, dusty olive-brown short jacket, white open-collar shirt, dark red neck cloth, tan trousers and worn boots. Exactly sixteen complete isolated figures on a genuine transparent RGBA background in strict 4 columns x 4 rows, with generous clear alpha gutters on ALL sides of EACH cell; no overlap, grid, scenery, words, shadows, blood or gore. Keep the same face, skin tone, costume and proportions throughout. Row 1: four consecutive EAST/screen-right walking frames with visible alternating leg positions. Row 2: two SOUTH/toward-viewer walking frames, then two NORTH/away-viewer walking frames. Row 3: east idle holding musket safely down, speaking, looking toward the battlements, serving an artillery gun with a ramrod but no cannon included. Row 4: east carrying a cannon shot, aiming musket, firing musket with small muzzle flash, lying still on side with eyes closed and no wound shown. Mirror east for west in game. One person and their carried tool only in each cell.';
const edit = 'Precise layout edit of the attached exact 4x4 Gregorio Esparza game sprite atlas. Keep the canvas 1254x1254 and all sixteen existing poses and character identity. Uniformly shrink each entire cells figure, gun, ramrod, cannonball and muzzle flash to 78% of present size, and center each complete pose inside its OWN equal 313x313 cell. Require at least 20 fully transparent pixels on all four sides of every cell; the bottom-row musket flash and still body must fit entirely in their own cells and never overlap the next. Keep all brown skin tones, dark hair, moustache, olive coat, red neck cloth, tan trousers, expressions, directions and pose details exactly. Preserve genuine alpha transparency. No grid, background, added shadows, scenery, text or new figures. Only change scale and spacing.';
export const promptEntries = [{
  sheet: 'famous-esparza', promptId: 'frontier-v1/famous-esparza', tool: 'built-in image_gen.imagegen', mode: 'generate + edit',
  prompt, referenced_image_paths: [
    'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-bonham.png',
    'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-almeron-dickinson.png',
  ],
  generatedSourcePath: `${root}exec-5ee508f8-da42-4a45-98c7-6b73c54bc988.png`,
  runtimeFile: 'public/assets/frontier-v1/atlases/famous-esparza.png',
  postProcessing: 'None. Accepted imagegen spacing edit copied unchanged; atlas builder measures alpha and cell retention.',
  review: 'Distinct Tejano defender with directional walk and serving-gun action; non-graphic still pose. No exact likeness or outfit claim.',
  edits: [{ prompt: edit, reference: `${root}exec-866c9fe5-fc87-442d-ada8-2ff709839721.png`, generatedSourcePath: `${root}exec-5ee508f8-da42-4a45-98c7-6b73c54bc988.png` }],
}];
export const provenanceEntries = promptEntries.map(({ prompt: omitted, ...entry }) => entry);
export const notes = ['Gregorio Esparza has a distinct Tejano defender sheet with directional walks, Alamo gun-service pose and non-graphic still frame; art availability never changes historical visibility or fate.'];

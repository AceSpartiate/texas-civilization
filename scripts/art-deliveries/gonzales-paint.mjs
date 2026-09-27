// Two authored sewing/painting hand positions for each figure used at the Gonzales flag table.
const variants = ['teal', 'indigo', 'blue-girl'];
export const SHEETS = {
  'people-gonzales-paint': variants.flatMap(variant => [`${variant}-paint-1`, `${variant}-paint-2`]),
};
export const ANIMATION_CLIPS = Object.fromEntries(variants.map(variant => [`${variant}-paint`, {
  frames: [{ sprite: `${variant}-paint-1`, duration: 760 }, { sprite: `${variant}-paint-2`, duration: 760 }],
  loop: true, authored: true, motion: 'none', direction: 'east; west by mirroring',
}]));
const generated = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
const prompt = 'Create a production 2D character-animation sprite atlas for the attached hand-painted 1835 Texas frontier game. True transparent RGBA PNG, exactly 3 rows x 2 columns, one full-body isolated person centered in each equal cell, generous transparent gutters between cells and around outer edge, no overlap, crop, text, grid, background, floor, shadow, table, flag, or extra people. Maintain the reference characters exact head-to-body scale, brown ink contour and soft warm painted shading. Every figure faces EAST/screen-right, feet on a consistent baseline per row. ROW 1: adult woman with dark hair in a bun, teal blouse, cream apron, tan long skirt, boots. ROW 2: adult woman with brown skin, dark hair in a bun, muted indigo blue long dress, cream neckerchief, boots. ROW 3: adolescent girl with long dark braid, muted blue dress and cream apron, boots. COLUMN 1: careful flag-making gesture, one hand holding a small sewing needle or fine brush over an unseen work surface at waist height, elbow slightly raised; COLUMN 2: a genuinely different next animation frame, the working hand extends forward and down while the other hand adjusts cloth edge, brush or needle still visible. Quiet focused expressions, historically plausible clothes. All six figures distinct and readable at small game sprite size, consistent identity within each row, NO HOES, weapons or baskets.';
const alphaEdit = 'Edit this exact six-frame 3-row by 2-column sewing animation atlas ONLY to remove its brown and blue glowing backgrounds. Make EVERY pixel outside each figure and the white cloth they hold fully transparent RGBA alpha=0, including all corners, gaps, around hair and hems. Preserve canvas dimensions, 3x2 cell structure, six figures, identities, costumes, faces, needles, cloth, poses, line art and cell placement exactly. Do not add shadows, checkerboard or a replacement color. Each figure and held cloth must have clean genuine alpha edges with clear empty gutters.';
const spacingEdit = 'Precise layout edit of this exact six-figure sewing sprite atlas. Canvas remains 1024 x 1536, 2 columns and 3 equal rows, each logical cell 512 x 512 pixels. WITHIN EACH CELL uniformly shrink its one complete existing character (including held cloth and needle) to 76% of its current size, then center that character in the SAME cell with its boots safely above that cells bottom. Require at least 35 fully transparent pixels of empty margin on ALL four sides of EVERY cell; no part of one figure may enter another cell. Preserve row identities, costumes, faces, expressions, cloth, hand poses, outlines and east-facing direction exactly. Keep genuine RGBA transparency alpha=0 outside figures. No glow, colored backdrop, checkerboard, shadows, grid, labels or extra items. Only alter scale and position inside cells.';
export const promptEntries = [{
  sheet: 'people-gonzales-paint', promptId: 'frontier-v1/people-gonzales-paint',
  tool: 'built-in image_gen.imagegen', mode: 'generate + edit', prompt,
  referenced_image_paths: [
    'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-work.png',
    'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-work.png',
  ],
  generatedSourcePath: `${generated}exec-f0c7bcc2-ad31-4735-be06-85c2f38483ec.png`,
  runtimeFile: 'public/assets/frontier-v1/atlases/people-gonzales-paint.png',
  postProcessing: 'None. Accepted generated RGBA PNG copied unchanged; alpha gaps measured read-only.',
  review: 'Six identity-consistent figures in a 3x2 atlas. Both frame positions show hand sewing with distinct raised and lowered arms; clear alpha gutters separate all six cells.',
  edits: [
    { prompt: alphaEdit, reference: `${generated}exec-45e1bdce-ae9a-49e4-ba90-a2e32555c10a.png`, generatedSourcePath: `${generated}exec-24e329ef-ddc5-456a-9647-b9af85f7e733.png` },
    { prompt: spacingEdit, reference: `${generated}exec-24e329ef-ddc5-456a-9647-b9af85f7e733.png`, generatedSourcePath: `${generated}exec-f0c7bcc2-ad31-4735-be06-85c2f38483ec.png` },
  ],
}];
export const provenanceEntries = promptEntries.map(({ prompt: omitted, edits, ...entry }) => ({ ...entry, generationHistory: edits }));
export const notes = ['The teal, indigo and blue-girl Gonzales flag-making poses use authored two-frame hand animation; the sim still controls when each person is present.'];

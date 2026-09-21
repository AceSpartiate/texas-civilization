export const SHEETS = {
  'alamo-face-strips': [
    'alamo-face-limestone', 'alamo-face-rooms', 'alamo-face-gate', 'alamo-face-convento',
    'alamo-face-church-south', null, null, null,
  ],
};
export const ANIMATION_CLIPS = {};

const prompt = 'Use case: historical-scene. Asset type: transparent production architectural sprite atlas for the 1836 Alamo. Create a 4 columns by 2 rows atlas containing five isolated straight-on wall elevation strips, matching the supplied Alamo modules warm hand-painted limestone, dark olive-brown contour, weathering and upper-left light. Top row: seamless plain limestone face; one-storey room-range front with patched plaster, plank door, barred window and beam ends; open gate passage under timber lintel; two-storey convento end with lower door, upper window and beam-end floor line. Bottom cell 1: long roofless 1836 church south side with rough unfinished top and small high openings. Remaining cells transparent. No visible roof tops, three-quarter perspective, ground, modern church parapet, flags, people, cannon, text or scenery.';
const spacingPrompt = 'Edit only the layout. Preserve all five wall designs. Uniformly shrink and reposition the roofless church wall so every pixel fits inside bottom-row cell 1 of the strict 4x2 grid, leaving the other bottom cells transparent.';
const generated = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-fa8d2002-3bfa-40a3-9316-3d6c09e6e8f6.png';
const accepted = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3958233e-fd6a-4e32-81b5-c0863cffcff0.png';
export const promptEntries = [{
  sheet: 'alamo-face-strips', promptId: 'frontier-v1/alamo-face-strips', tool: 'built-in image_gen.imagegen', mode: 'generate + edit', prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/alamo-modules.png'],
  generatedSourcePath: accepted, runtimeFile: 'public/assets/frontier-v1/atlases/alamo-face-strips.png',
  postProcessing: 'None. Accepted built-in spacing edit copied unchanged; only read-only validation.',
  review: 'Accepted as five distinct, straight-on historical elevation strips with the church wholly contained in its sparse-grid cell.',
  edits: [{ prompt: spacingPrompt, reference: generated, generatedSourcePath: accepted, result: 'Accepted after church strip was scaled wholly inside cell 5.' }],
}];
export const provenanceEntries = promptEntries.map(({ prompt: omitted, edits, ...entry }) => ({ ...entry, generationHistory: [
  { generatedSourcePath: generated, result: 'Rejected for delivery because the long church strip crossed a logical cell boundary.' }, ...edits,
] }));
export const notes = ['These strips change only presentation. The historically scaled Alamo footprint, wall state, room geometry and destructible north wall remain authoritative layout/world state.'];

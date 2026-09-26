// The September 29–October 2 Gonzales scene replaces three prop stand-ins.
// Their placement and date remain in sim/town-scenes.mjs, not in the pictures.
const generated = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
const props = {
  'gonzales-cannon-buried': {
    source: 'exec-36488c86-a194-4f9a-b589-6609d64f9b8f.png',
    editTarget: 'exec-852a671e-3009-4e83-9d1b-c06b21e2d44c.png',
    prompt: 'Edit the small brass Gonzales cannon barrel, preserving its design, colour, side-facing east view and transparency. Lower it into a shallow excavated hole so the lower half is concealed by freshly turned dark soil and only its upper half and muzzle are exposed. No wheels, carriage, people, trees, labels, scenery or opaque background.',
    review: 'The same brass barrel reads as half exposed from soil, not a field-carriage gun under a canvas ellipse.',
  },
  'gonzales-log-breastwork': {
    source: 'exec-a093533b-fd60-4726-8d0c-c779b239d7f9.png',
    reference: 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/fortifications.png',
    prompt: 'One transparent 1835 Gonzales ferry-landing breastwork made only of low horizontally laid rough logs braced with short stakes, with small gaps for defenders. Warm hand-painted dark-brown ink outlines, elevated three-quarter view, wide low silhouette. No earth rampart, people, boats, cannon, text or opaque ground.',
    review: 'A log wall instead of the previous earth-rampart stand-in; genuine alpha.',
  },
  'gonzales-dugout-canoe': {
    source: 'exec-5f75ef3b-3a2b-4afd-b0be-81b387f26ab7.png',
    reference: 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/transport.png',
    prompt: 'One transparent 1835 Gonzales drawn-up hand-hewn dugout canoe, single hollowed log with uneven adze-cut interior and blunt ends, warm hand-painted dark-brown ink outlines, elevated three-quarter view. No plank skiff, rowboat, people, river water, text or opaque ground.',
    review: 'Hollow-log construction distinguishes it from the prior plank skiff; two scene instances remain separately placed.',
  },
};

export const SHEETS = Object.fromEntries(Object.keys(props).map(name => [name, [name]]));
export const ANIMATION_CLIPS = {};
export const promptEntries = Object.entries(props).map(([sheet, item]) => ({
  sheet, promptId: `frontier-v1/${sheet}`, tool: 'built-in image_gen.imagegen',
  mode: item.editTarget ? 'edit' : 'generate', prompt: item.prompt,
  referenced_image_paths: [item.editTarget ? `${generated}${item.editTarget}` : item.reference],
  generatedSourcePath: `${generated}${item.source}`,
  runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
  postProcessing: 'None. Generated RGBA PNG copied unchanged; alpha bounds measured by the atlas build.',
  review: item.review,
}));
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Three Gonzales lead-up props replace the buried-gun, breastwork and canoe stand-ins; character actions and ploughed-ground texture remain separate requests.'];

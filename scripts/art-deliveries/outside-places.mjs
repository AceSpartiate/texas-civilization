// Schematic outside-place vignettes. These distinguish site types on the map;
// they are not reconstructions of a particular 1836 building arrangement.
const reference = 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/town-buildings-researched.png';
const generated = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
const places = {
  'town-mexican-river': {
    source: 'exec-967a5949-c01d-444e-9532-fae18bbeac3e.png',
    prompt: 'One transparent compact 1835 northern Mexican river-town map vignette for Matamoros and Laredo: cluster of low flat-roofed adobe and stone buildings, restrained church tower, small stepped landing at bottom edge. Schematic rather than exact reconstruction; warm hand-inked textured frontier style, elevated three-quarter view. No Anglo log cabins, painted river, people, text or opaque background.',
  },
  'presidio-spanish': {
    source: 'exec-7b326994-3daf-4af1-b3b2-bb40f963fe6b.png',
    prompt: 'One transparent compact 1835 Spanish colonial presidio place-type vignette: modest square stone-and-adobe walled compound, visible corner bastion, courtyard, gate and mission church beside it. Schematic rather than exact reconstruction; warm hand-inked textured frontier style, elevated three-quarter view. No painted river, people, text or opaque background.',
  },
  'village-irish-colony': {
    source: 'exec-16b1147f-b2f9-4888-a951-7caa75726e6a.png',
    prompt: 'One transparent compact 1835 Irish-colony village vignette for San Patricio: modest jacales and log or plank houses around a small chapel on a low bluff. Schematic rather than exact reconstruction; warm hand-inked textured frontier style, elevated three-quarter view. No painted river, people, text or opaque background.',
  },
  'ferry-landing': {
    source: 'exec-1d4ee230-298b-4067-a924-90bdb8af2b67.png',
    prompt: 'One transparent compact 1835 Gaines ferry landing vignette: cut earth bank, short plank ramp, small rough timber shed, stout rope post and crates. Schematic rather than exact reconstruction; warm hand-inked textured frontier style, elevated three-quarter view. No boat, painted water, people, text or opaque background.',
  },
};

export const SHEETS = Object.fromEntries(Object.keys(places).map(name => [name, [name]]));
export const ANIMATION_CLIPS = {};
export const promptEntries = Object.entries(places).map(([sheet, item]) => ({
  sheet, promptId: `frontier-v1/${sheet}`, tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: item.prompt, referenced_image_paths: [reference],
  generatedSourcePath: `${generated}${item.source}`,
  runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
  postProcessing: 'None. Generated RGBA PNG copied unchanged; alpha bounds measured by the atlas build.',
  review: 'A schematic site-type illustration, not a historical reconstruction or a claim about exact buildings.',
}));
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Four outside-place vignettes identify Matamoros/Laredo, Presidio del Río Grande, San Patricio, and Gaines ferry without reusing colonial cabins.'];

// Small dated-scene props for the orchard and the flag-making table at Gonzales.
const generated = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
const assets = {
  'gonzales-ploughed-earth': {
    source: 'exec-1ac0e611-1044-4b93-83ee-8c21ff1c7fda.png',
    reference: 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/biome-ground-bexar.png',
    mode: 'generate',
    prompt: 'Create a single isolated 2D game prop sprite on a fully transparent RGBA background: an irregular small patch of freshly hand-ploughed south Texas orchard soil circa 1835, elevated three-quarter top-down game view, five to seven narrow dark-brown furrows with uneven clods, subtle olive grass around the ragged edges. Wide and low silhouette, approximate 3:1 aspect ratio. Match the attached game\'s hand-painted top-down frontier art: warm ochre and olive palette, dark hand-inked outlines, clear texture at small sprite size. No grid, square tile, text, people, trees, tools, shadows outside the prop, frame, or opaque background.',
    review: 'Ragged alpha-edged earth and visible furrows replace seven canvas lines in the dated orchard.',
  },
  'gonzales-flag-work-cloth': {
    source: 'exec-8a9564a5-d35d-4fb8-9d1c-1d8a183217b0.png',
    reference: 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/flag-come-and-take-it.png',
    mode: 'generate',
    prompt: 'One isolated 2D game prop sprite on a fully transparent RGBA background: a rectangular piece of off-white hand-sewn cotton cloth laid flat across a table, viewed elevated three-quarter from above, circa Gonzales Texas 1835. Slight uneven hand-stitched hems, soft folds and age marks, absolutely blank with NO symbol, lettering, star, pole, person, table, or background. Wide low horizontal silhouette about 2:1. Match attached frontier game art: warm painterly texture, dark-brown ink outlines, readable at small size.',
    review: 'Blank hand-sewn cloth is a separate early flag-making state.',
  },
  'gonzales-flag-work-painted': {
    source: 'exec-fd78acbd-dbae-49e3-a758-da04a8aa9afd.png',
    reference: `${generated}exec-8a9564a5-d35d-4fb8-9d1c-1d8a183217b0.png`,
    mode: 'edit',
    prompt: "Edit the attached blank 1835 Gonzales cotton flag cloth sprite. Keep its EXACT irregular outline, folds, stitching, viewing angle, size and transparent background. Add a crisp black hand-painted five-point star above a simple side-profile cannon, and below them hand-painted uppercase text reading exactly 'COME AND TAKE IT'. The full design should be readable on cloth laid flat on a table; no flagpole, table, people, landscape, framing, extra text, or opaque background. Match warm painterly frontier game art. This is a one-frame production game sprite, not a mockup.",
    review: 'Completed cloth state has the existing game flag composition; prompt preserves the blank cloth outline.',
  },
};

export const SHEETS = Object.fromEntries(Object.keys(assets).map(name => [name, [name]]));
export const ANIMATION_CLIPS = {};
export const promptEntries = Object.entries(assets).map(([sheet, item]) => ({
  sheet, promptId: `frontier-v1/${sheet}`, tool: 'built-in image_gen.imagegen', mode: item.mode,
  prompt: item.prompt, referenced_image_paths: [item.reference], generatedSourcePath: `${generated}${item.source}`,
  runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
  postProcessing: 'None. Generated RGBA PNG copied unchanged; alpha bounds measured by the atlas build.',
  review: item.review,
}));
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Gonzales orchard furrows and both flat flag-work states replace canvas stand-ins; the raised flag retains its existing wind clip.'];

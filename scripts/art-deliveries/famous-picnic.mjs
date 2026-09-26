// The Yellow Rose picnic is the owner's chosen visible staging of a later tradition,
// not evidence about what Emily West or Santa Anna did on April 21, 1836.
export const SHEETS = {
  'famous-emily-west-picnic': ['emily-west-picnic-listen', 'emily-west-picnic-speak', 'emily-west-picnic-laugh', 'emily-west-picnic-alarm'],
  'famous-santa-anna-picnic': ['santa-anna-picnic-listen', 'santa-anna-picnic-speak', 'santa-anna-picnic-notice', 'santa-anna-picnic-rise'],
  'famous-picnic-props': ['picnic-command-tent', 'picnic-blanket', 'picnic-basket', 'picnic-jug-cups'],
};
export const ANIMATION_CLIPS = {
  'emily-west-picnic-converse': {
    frames: [
      { sprite: 'emily-west-picnic-listen', duration: 1300 },
      { sprite: 'emily-west-picnic-speak', duration: 900 },
      { sprite: 'emily-west-picnic-laugh', duration: 850 },
      { sprite: 'emily-west-picnic-listen', duration: 1250 },
    ], loop: true, authored: true, motion: 'none', direction: 'west-facing at a camp table',
  },
  'santa-anna-picnic-converse': {
    frames: [
      { sprite: 'santa-anna-picnic-listen', duration: 1300 },
      { sprite: 'santa-anna-picnic-speak', duration: 950 },
      { sprite: 'santa-anna-picnic-listen', duration: 1200 },
    ], loop: true, authored: true, motion: 'none', direction: 'east-facing at a camp chair',
  },
  'santa-anna-picnic-alarm': {
    frames: [
      { sprite: 'santa-anna-picnic-notice', duration: 900 },
      { sprite: 'santa-anna-picnic-rise', duration: 850 },
    ], loop: false, authored: true, motion: 'none', direction: 'east-facing; turns toward the battle',
  },
};
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const promptEntries = [
  {
    sheet: 'famous-emily-west-picnic', promptId: 'frontier-v1/famous-emily-west-picnic',
    tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: '2x2 transparent companion atlas of Emily D. West, matching famous-emily-west: same uncovered braided updo, yellow 1830s dress and face. Seated at the right of a small camp picnic table, facing left: listen, speak, light laugh, look toward distant guns. Same table, chair, covered dish and cups in all frames. Later disputed legend; no sexualization or other people.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-emily-west.png'],
    generatedSourcePath: `${root}exec-7e9d6a3d-012a-41bf-b4bd-d3fa453c3c48.png`,
    runtimeFile: 'public/assets/frontier-v1/atlases/famous-emily-west-picnic.png',
    postProcessing: 'None. Copied unchanged; alpha and cells measured by atlas builder.',
    review: 'Four distinct, identity-preserving seated poses; table remains at a stable relative position.',
  },
  {
    sheet: 'famous-santa-anna-picnic', promptId: 'frontier-v1/famous-santa-anna-picnic',
    tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: '2x2 transparent companion atlas of Santa Anna, matching famous-santa-anna: same face and 1830s general uniform. Seated facing right in camp chair with cup: listen, speak with restrained laugh, notice distant noise, rise toward distant cannon fire. No table, other person, gore or backdrop. Later disputed legend; artist interpretation.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-santa-anna.png'],
    generatedSourcePath: `${root}exec-7b935d15-9325-4bc7-b0fa-d78cd52cf6ff.png`,
    runtimeFile: 'public/assets/frontier-v1/atlases/famous-santa-anna-picnic.png',
    postProcessing: 'None. Copied unchanged; alpha and cells measured by atlas builder.',
    review: 'Three seated/reaction stages and a rise, same uniform and face; cup stays inside each cell.',
  },
  {
    sheet: 'famous-picnic-props', promptId: 'frontier-v1/famous-picnic-props',
    tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: '2x2 genuinely transparent period camp picnic props in warm outlined storybook style: canvas command tent with open flap; striped wool blanket; modest open wicker provisions basket with covered bread, fruit and crockery; clay jug, tin cups and covered plate. Four independent ground-anchored sprites, no people, text, grid, modern goods or opulent banquet.',
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/transport.png'],
    generatedSourcePath: `${root}exec-8caead6b-1688-4028-b3b9-48fcdc864b42.png`,
    runtimeFile: 'public/assets/frontier-v1/atlases/famous-picnic-props.png',
    postProcessing: 'None. Copied unchanged; alpha and cells measured by atlas builder.',
    review: 'Tent, blanket, basket and jug/cups are clean, separate props for the optional legend scene.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['The picnic uses two paired conversational loops and a non-looping alarm. The scene is always labeled tradition in the battle projection and caption.'];

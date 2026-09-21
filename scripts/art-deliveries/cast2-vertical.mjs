const variants = ['rust-woman','indigo','ochre','blue-girl'];

export const SHEETS = {
  'people-cast2-vertical': variants.flatMap(variant => ['walk-s-1','walk-s-2','walk-n-1','walk-n-2'].map(pose => `${variant}-${pose}`)),
};

export const ANIMATION_CLIPS = {};
for (const variant of variants) for (const direction of ['s','n']) ANIMATION_CLIPS[`${variant}-walk-${direction}`] = {
  frames:[1,2].map(frame => ({sprite:`${variant}-walk-${direction}-${frame}`,duration:220})),
  loop:true,
  authored:true,
  motion:'none',
  direction:direction === 's' ? 'south' : 'north',
};

const identityReference = 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png';
const generatedDraft = 'C:/Users/zachw/.codex/generated_images/01a0c395-3ad7-7712-9cb1-3380d00241d6/exec-2b03f7f3-49e6-4ab5-bcfe-8e65934d7afe.png';
const generatedAccepted = 'C:/Users/zachw/.codex/generated_images/01a0c395-3ad7-7712-9cb1-3380d00241d6/exec-817fa204-d601-4d81-ace9-1695505dcec6.png';
const generationPrompt = 'Use case: historical-scene. Asset type: production 2D character sprite atlas for a top-down three-quarter-view Texas 1835 storybook game. Create a NEW north/south walking sheet for the four exact character identities in the input reference. Do not repair or reuse any previous rejected vertical sheet. Preserve the four established people exactly. Square 1254 x 1254 PNG with genuine RGBA transparency, strict four columns by four rows, sixteen complete isolated full-body figures. Rows are rust-woman, indigo, ochre and blue-girl. Columns are south/front left-foot-forward, south/front right-foot-forward, north/back left-foot-forward, north/back right-foot-forward. Opposite leg silhouettes and arm swing must be unmistakable in each pair. No repeated foot pose, side-facing figure, checkerboard, background, grid, text, shadow, ground, scenery, prop, weapon, crop or overlap.';
const spacingPrompt = 'Use case: precise-object-edit. Change ONLY the size and spacing of the sixteen existing complete figures. Uniformly shrink EACH figure to 82% of its current size independently inside its OWN existing cell, then center it in that same cell. Keep the canvas exactly 1254 x 1254 and keep the exact 4 columns x 4 rows order. Preserve all identities, costumes, colors, line work, front/back directions and existing walking poses, including opposite footfalls and arm swing. No artwork may touch the outer canvas edge or an adjacent figure. Output genuine RGBA transparency with no checkerboard, background, grid, labels, text, shadows, ground, props, scenery, extra people, crops or overlaps.';

export const promptEntries = [{
  sheet:'people-cast2-vertical',
  promptId:'frontier-v1/people-cast2-vertical',
  tool:'built-in image_gen.imagegen',
  mode:'generate + precise-object-edit',
  prompt:generationPrompt,
  referenced_image_paths:[identityReference],
  generatedSourcePath:generatedAccepted,
  runtimeFile:'public/assets/frontier-v1/atlases/people-cast2-vertical.png',
  postProcessing:'None. Accepted generated PNG copied unchanged; only read-only validation.',
  review:'Accepted after spacing correction: 1254 x 1254 RGBA, 78.649% fully transparent pixels, no visible outer-edge pixels, sixteen identity-consistent front/back poses and eight authored two-frame clips. Each directional pair has opposite footfalls and arm swing.',
  edits:[{prompt:spacingPrompt,reference:generatedDraft,generatedSourcePath:generatedAccepted,result:'Accepted; preserves the generated gait and creates clean separation for atlas extraction.'}],
}];

export const provenanceEntries = promptEntries.map(({prompt,edits,...entry}) => ({
  ...entry,
  generationHistory:[
    {generatedSourcePath:generatedDraft,reference:identityReference,prompt:generationPrompt,result:'Rejected for spacing: real alpha and correct poses, but visible art touched the outer canvas and several cell boundaries.'},
    ...edits,
  ],
}));

export const notes = [
  'Second-cast north/south walking delivers sixteen frames and eight authored clips. The source PNG is unchanged from built-in image generation.',
  'The earlier 2026-09-14 vertical candidate remains rejected; this delivery is a fresh generation from the accepted idle identity reference.',
];

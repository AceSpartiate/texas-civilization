const variants = ['rust-woman','indigo','ochre','blue-girl'];
export const SHEETS = {
  'people-cast2-tasks': variants.flatMap(variant => ['sow-1','sow-2','repair-1','repair-2'].map(pose => `${variant}-${pose}`)),
};
export const ANIMATION_CLIPS = {};
for (const variant of variants) {
  for (const action of ['sow','repair']) ANIMATION_CLIPS[`${variant}-${action}`] = {
    frames:[1,2].map(frame => ({sprite:`${variant}-${action}-${frame}`,duration:360})),
    loop:true, authored:true, motion:'none', direction:'east; west by mirroring',
  };
}
const prompt = 'Use case: production sprite atlas for a top-down three-quarter-view historical game. Create a genuine transparent-background 4 by 4 square PNG sprite sheet: exactly sixteen complete isolated full-body figures, equal cells, generous gutters, no overlap, grid, checkerboard, text, ground patch, shadow, scenery, extra people, or floating objects. Preserve the exact four identities, clothing, colors, faces, proportions and clean dark-outlined rustic illustrated style of the reference: row 1 rust-blouse bonneted adult woman; row 2 indigo-dress adult woman; row 3 ochre-shirt young man; row 4 blue-dress adolescent girl. All face EAST/screen-right. In EVERY row, columns 1-2 are a clear two-frame SOWING cycle: crouched with a small seed pouch at the waist, first hand close to pouch, then right arm reaching down and forward releasing a few seeds. Columns 3-4 are a clear two-frame TOOL REPAIR cycle: seated on a low plain stool, wooden hoe handle across knees, first with small hammer raised, then hammer contacting handle. Preserve identical head size, foot baseline and character scale within each row. Only period-plausible seed pouch, hoe handle, small hammer and low stool. Real alpha transparency.';
export const promptEntries = [{
  sheet:'people-cast2-tasks', promptId:'frontier-v1/people-cast2-tasks', tool:'built-in image_gen.imagegen', mode:'generate', prompt,
  referenced_image_paths:['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png'],
  generatedSourcePath:'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5b9e3844-5b5d-4d7d-b02b-637d2ebe472b.png',
  runtimeFile:'public/assets/frontier-v1/atlases/people-cast2-tasks.png',
  postProcessing:'None. Generated PNG copied unchanged; only read-only validation.',
  review:'Accepted as sixteen identity-consistent figures with distinct two-frame sowing and hoe-repair actions, isolated on true transparency.',
}];
export const provenanceEntries = promptEntries.map(({prompt,...entry})=>entry);
export const notes = ['Second-cast sowing and repair poses are presentation-only; authoritative chore progress and tool condition remain server state.'];

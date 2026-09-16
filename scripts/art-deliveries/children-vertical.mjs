const variants = ['girl','boy','smallchild'];
export const SHEETS = {'people-children-vertical': [
  ...variants.flatMap(variant => ['walk-s-1','walk-s-2','walk-n-1','walk-n-2'].map(pose => `${variant}-${pose}`)),
  null,null,null,null,
]};
export const ANIMATION_CLIPS = {};
for (const variant of variants) for (const direction of ['s','n']) ANIMATION_CLIPS[`${variant}-walk-${direction}`] = {
  frames:[1,2].map(frame => ({sprite:`${variant}-walk-${direction}-${frame}`,duration:230})), loop:true, authored:true,
  motion:'none', direction:direction === 's' ? 'south' : 'north',
};
const prompt = 'Use case: production sprite atlas for a top-down three-quarter-view historical game. Create a genuine transparent-background 4 by 4 square PNG sprite sheet with exactly twelve complete isolated child figures in rows 1-3 and row 4 completely empty transparent. Equal cells, generous gutters, no overlaps, no grid, checkerboard, text, ground, shadow, scenery, or extra people. Preserve these exact three identities, age proportions, clothes, colors, faces and clean dark outlined rustic illustrated style from the reference: row 1 young girl in faded rose calico dress and cream pinafore; row 2 young blond boy in linen shirt, brown trousers and one suspender; row 3 small child in plain cream gown. Vertical walking poses in every occupied row: column 1 SOUTH/toward viewer with LEFT foot forward; column 2 SOUTH/toward viewer with RIGHT foot forward and opposite arms; column 3 NORTH/away from viewer with LEFT foot forward; column 4 NORTH/away with RIGHT foot forward and opposite arms. Back-view columns must clearly face away. The small child toddles with shorter steps and arms slightly out. Preserve consistent head size, baseline, scale, and child-safe dignified depiction. Real alpha transparency.';
export const promptEntries = [{sheet:'people-children-vertical',promptId:'frontier-v1/people-children-vertical',tool:'built-in image_gen.imagegen',mode:'generate',prompt,referenced_image_paths:['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png'],generatedSourcePath:'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a9562a2d-a5e9-498a-b333-eb329d26c3c5.png',runtimeFile:'public/assets/frontier-v1/atlases/people-children-vertical.png',postProcessing:'None. Generated PNG copied unchanged; only read-only validation.',review:'Accepted as three identity-consistent south and north walk pairs; fourth row is transparent as requested.'}];
export const provenanceEntries = promptEntries.map(({prompt,...entry})=>entry);
export const notes = ['Children now have north/south walking for girl, boy and small child. The infant remains stationary by design.'];

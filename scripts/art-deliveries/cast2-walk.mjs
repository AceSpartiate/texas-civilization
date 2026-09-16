const variants = ['rust-woman','indigo','ochre','blue-girl'];
export const SHEETS = {
  'people-cast2-walk': variants.flatMap(variant => [1,2,3,4].map(frame => `${variant}-walk-${frame}`)),
};
export const ANIMATION_CLIPS = Object.fromEntries(variants.map(variant => [`${variant}-walk`, {
  frames:[1,2,3,4].map(frame => ({sprite:`${variant}-walk-${frame}`,duration:180})),
  loop:true, authored:true, motion:'none', direction:'east; west by mirroring',
}]));
const prompt = 'Use case: production sprite atlas for a top-down three-quarter-view historical game. Create a genuine transparent-background 4 by 4 sprite sheet, exactly sixteen isolated full-body figures, equal cells, no grid lines, no text, no checkerboard, generous clear margins, no overlap. Preserve the four character identities, clothing, palette, proportions, faces and clean dark outlined rustic illustrated style from the reference exactly: row 1 rust-blouse bonneted adult woman; row 2 indigo-dress adult woman; row 3 ochre-shirt young man; row 4 blue-dress adolescent girl. All figures face EAST / screen-right. Each row is a seamless four-frame walking cycle in place: column 1 left foot clearly forward and right arm forward; column 2 passing pose; column 3 right foot clearly forward and left arm forward; column 4 opposite passing pose. Feet and arms must visibly alternate, with consistent head size, baseline and scale across every cell. No props, shadows, scenery, labels, weapons, ground patches or extra people. Output a square PNG with real alpha transparency.';
export const promptEntries = [{
  sheet:'people-cast2-walk', promptId:'frontier-v1/people-cast2-walk', tool:'built-in image_gen.imagegen', mode:'generate', prompt,
  referenced_image_paths:['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png'],
  generatedSourcePath:'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-e2587906-9753-4b58-a2c8-58330bf5cea8.png',
  runtimeFile:'public/assets/frontier-v1/atlases/people-cast2-walk.png',
  postProcessing:'None. Generated PNG copied unchanged; only read-only validation.',
  review:'Accepted as four identity-consistent east-facing walk rows with transparent separation. Runtime mirrors east poses for west travel.',
}];
export const provenanceEntries = promptEntries.map(({prompt,...entry})=>entry);
export const notes = ['Second cast east/west walking delivered as 16 frames and four authored clips. North/south walking remains a separate request.'];

const actions = ['rammer-carry-1','rammer-carry-2','ram-1','ram-2','roundshot-lift','roundshot-carry','lanyard-pull','cover-ears'];
export const SHEETS = {'artillery-service': [
  ...actions.map(action => `volunteer-${action}`),
  ...actions.map(action => `regular-${action}`),
]};
export const ANIMATION_CLIPS = {};
for (const faction of ['volunteer','regular']) {
  const sequence = (name,poses,durations,loop=false) => ANIMATION_CLIPS[`${faction}-gun-${name}`] = {frames:poses.map((pose,index)=>({sprite:`${faction}-${pose}`,duration:Array.isArray(durations)?durations[index]:durations})),loop,authored:true,motion:'none',direction:'east; west by mirroring'};
  sequence('ram',['rammer-carry-1','rammer-carry-2','ram-1','ram-2'],[260,240,360,300]);
  sequence('shot-carry',['roundshot-lift','roundshot-carry'],[420,420],true);
  sequence('fire',['lanyard-pull','cover-ears'],[360,700]);
}
const prompt = 'Use case: production 2D sprite atlas for a historically grounded 1835-36 Texas Revolution game. Create exactly sixteen isolated full-body artillery crew figures on genuine transparent alpha, strict 4 columns x 4 rows, equal cells, generous gutters, no overlap, grid, checkerboard, text, ground, smoke, cannon, scenery, blood, or extra people. Match the reference\'s warm hand-painted dark-outlined elevated three-quarter style and figure scale. All face EAST/screen-right. Rows 1-2 are the same Texian volunteer identity: brown broad-brim hat, brown hunting coat, tan trousers, boots, cartridge bag. Rows 3-4 are the same Mexican regular identity: 1830s blue coatee with red facings, white crossbelts and trousers, black shako with small red pompon. Reading order in EACH faction\'s eight frames: 1 carrying a long wooden sponge-rammer horizontally; 2 stepping forward with rammer; 3 ramming forward at waist height; 4 withdrawing rammer; 5 bending to lift a plain roundshot with both hands; 6 carrying roundshot close to torso; 7 kneeling beside an imaginary wheel pulling a lanyard backward; 8 standing covering both ears after firing. Tools stay inside cells. Historically restrained uniforms and humane non-graphic poses. Square PNG with real alpha transparency.';
export const promptEntries = [{sheet:'artillery-service',promptId:'frontier-v1/artillery-service',tool:'built-in image_gen.imagegen',mode:'generate',prompt,referenced_image_paths:['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military-actions.png'],generatedSourcePath:'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-dd149258-6eab-46f5-8793-97294a5b9f2d.png',runtimeFile:'public/assets/frontier-v1/atlases/artillery-service.png',postProcessing:'None. Generated PNG copied unchanged; only read-only validation.',review:'Accepted as matching eight-pose volunteer and regular cannon-service sets, with tools wholly inside isolated cells.'}];
export const provenanceEntries = promptEntries.map(({prompt,...entry})=>entry);
export const notes = ['Artillery service poses are registered for later battle assembly. They never fire a gun or advance battle state on their own.'];

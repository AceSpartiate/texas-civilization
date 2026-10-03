// Original visual interpretation, not portrait/costume/horse evidence.
export const SHEETS = {
 'famous-smither': [
 ...[1,2,3,4].map(n=>`smither-walk-e-${n}`),
 ...[1,2].map(n=>`smither-walk-s-${n}`),
 ...[1,2].map(n=>`smither-walk-n-${n}`),
 'smither-idle','smither-stop','smither-speak','smither-listen',
 'smither-dispatch','smither-read','smither-satchel','smither-rest'],
 'famous-smither-mounted':['smither-mounted-walk-e-1','smither-mounted-walk-e-2','smither-mounted-idle-e','smither-mounted-idle-s'],
};
export const ANIMATION_CLIPS={};
for(const dir of ['e','s','n']) ANIMATION_CLIPS[`smither-walk-${dir}`]={
 frames:[1,2].map(n=>({sprite:`smither-walk-${dir}-${n}`,duration:280})),
 loop:true,authored:true,motion:'none',direction:dir==='e'?'east; mirror for west':dir==='s'?'south':'north',
};
ANIMATION_CLIPS['smither-mounted-walk-e']={
 frames:[1,2].map(n=>({sprite:`smither-mounted-walk-e-${n}`,duration:300})),
 loop:true,authored:true,motion:'none',direction:'east; mirror for west',
};
export const promptEntries=[
 {sheet:'famous-smither',promptId:'frontier-v1/famous-smither',tool:'built-in image_gen.imagegen',mode:'generate',
 prompt:"NEW original interpretive Launcelot Smither Texas Revolution civilian messenger, not exact likeness. Reference STYLE ONLY match warm outlined painted frontier storybook farm game, elevated3/4 camera muted earthy colors small stylized readable figure. Distinct man slender, short light brown hair, clean shaven long face, dusty blue broadbrim felt hat, ochre short civilian jacket over cream shirt, faded slate blue neckcloth and trousers, brown boots, small brown leather dispatch satchel across torso. Same identity costume throughout. Strict transparent4x4 equalcells16 isolated fullbody cutouts75%cellheight75%cellwidth lots gutters30px separation. Row1 east WALK CONTACT left leg forward/right behind; east PASSING planted left boot directly under hip/right knee bent lifted; east CONTACT right forward/leftbehind oppositearms; east PASSING planted right boot/left knee lifted. Row2 two southwalk then two northwalk. Row3 eastidle, east openhand STOP palm outward, east SPEAK openhandat chest, east LISTEN handsrelaxed. Row4 east offering folded blankdispatch, east readingdispatch, east opening satchel, seatedreststool. Large clear visible differences for walk knee positions and arm swing. Hats feet props intact consistent scale baseline. No weapons insignia text ground shadow backgrounds grids blood. True alpha, no3D no photorealism.",
 referenced_image_paths:['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-wp-smith.png'],
 generatedSourcePath:'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-0de3dafa-34b5-421a-ae10-af1a6a29579e.png',
 runtimeFile:'public/assets/frontier-v1/atlases/famous-smither.png',postProcessing:'None; copied unchanged.',
 review:'Distinct civilian identity. Runtime east walk uses contact/passing first two poses; extra two repeat the silhouette family and remain variants. Dispatch props are available, not newly asserted at the parley.'},
 {sheet:'famous-smither-mounted',promptId:'frontier-v1/famous-smither-mounted',tool:'built-in image_gen.imagegen',mode:'generate',
 prompt:"Create new4-sprite mounted Launcelot Smither atlas STRICT2x2 equal square cells true transparent. Reference1 EXACT character identity clothing and game style: lean clean-shaven man lightbrown hair blue broadbrim hat ochre jacket cream shirt blue neckcloth and trousers brown boots dispatchsatchel. Reference2 ONLY horse composition and smallgame camera style; do NOT use its rider identity. Smither on original chestnut horse with cream forehead blaze darkmane/tail brown saddle bridle, not historically exact horse claim. Warm outlined painted storybook style match reference1 contour and shading. TopLEFT east horse WALK contact frontnear hoof forward planted rearnear back, rider LEFT hand holds reins RIGHT hand raised OPEN palm outward calmly saying stop. TopRIGHT east horse WALK passing, frontnear knee visibly bent hoof raised underbody rearnear underhip, reverse other legs, rider same raised palm and reins. BottomLEFT EAST idle horse allhooves grounded rider palm raised no weapon. BottomRIGHT SOUTH idle horse rider hands on reins. Exactly4 separate fullhorse+rider cutouts fully within eachcell75%height80%width, 40pxtransparent gutters, no touching rows tails ears or hooves, same size/style/horse/rider. No groundshadow grass backgrounds text grids firing violence, no3D photorealism.",
 referenced_image_paths:['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither.png','C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-grant-mounted.png'],
 generatedSourcePath:'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-15d2e745-a206-4a38-8f84-eb4fda5f0a7b.png',runtimeFile:'public/assets/frontier-v1/atlases/famous-smither-mounted.png',
 postProcessing:'None; copied unchanged.',review:'Interpretive chestnut mount with raised-palm warning. No exact horse or gesture claim. East walk mirrors west; south idle delivered, mounted north/south walking remains future work.'},
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['Smither mounted arrival at Gonzales now uses his own horse and warning gesture. Foot dialogue/dispatch/rest and south mounted idle are delivered for later explicit staging. Mounted north/south gait remains open; no firing, death, invented speech or altered timeline.'];


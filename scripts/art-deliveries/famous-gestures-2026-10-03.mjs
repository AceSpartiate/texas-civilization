export const CAST=["travis","houston","santa-anna","austin","moore","almonte","burleson","cos","urrea","castaneda"];
export const SHEETS={},ANIMATION_CLIPS={};
for(const id of CAST){
SHEETS[`famous-${id}-gestures`]=['command','conversation'].flatMap(pose=>[1,2].map(n=>`${id}-${pose}-gesture-${n}`));
for(const pose of ['command','conversation']) ANIMATION_CLIPS[`${id}-${pose}-cycle`]={frames:[1,2].map(n=>({sprite:`${id}-${pose}-gesture-${n}`,duration:900})),loop:true,authored:true,motion:'none',direction:'east; mirror for west'};
}
export const promptEntries=[
  {
    "id": "travis",
    "sheet": "famous-travis-gestures",
    "prompt": "NEW transparent STRICT2x2 equalcells FOUR FULLBODY travis gesture animation keyframes. Reference EXACT existing character identity/costume/face and warm outlined painted storybook game style: young clean-shaven brown-haired man brown broadbrim hat navy coat ochre buttons brown trousers black boots sheathed saber; blank dispatch in left hand. Same slightly elevated3/4 camera same scale stance baseline in all4. All face EAST/right. TOPLEFT command gesture1 arm bent forward palm open at chestheight, TOPRIGHT command gesture2 arm extended forward higher palm open with torso slightlean, clearlydifferenthandposition. BOTTOMLEFT conversation gesture1 relaxed one openhand close to chest, BOTTOMRIGHT conversation gesture2 openhand offered outward waistheight with subtle headdirectionchange. Two authored cycles command TOProw, conversation BOTTOMrow. Serious restrained expressions no caricature no shouting. Feet stay planted, no scene no props except described dispatch/sheathed saber. Hats hands boots intact with40pxalpha gutters; max75%cellheight/width. Truealpha no groundshadow background text labels grids crowds weaponsdrawn gore. Preserve identity exactly not a new design. Original visual interpretation not exact likeness/uniform.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-travis.png"
    ],
    "promptId": "frontier-v1/famous-travis-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a01ad1ff-69c2-470a-b8b7-b3f3e576c316.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-travis-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  },
  {
    "id": "houston",
    "sheet": "famous-houston-gestures",
    "prompt": "NEW transparent STRICT2x2 equalcells FOUR FULLBODY houston gesture animation keyframes. Reference EXACT existing character identity/costume/face and warm outlined painted storybook game style: middle-aged dark bearded man brown broadbrim hat brown longcoat green waistcoat black neckcloth cream trousers dark boots; BOTH legs healthy no bandages. Same slightly elevated3/4 camera same scale stance baseline in all4. All face EAST/right. TOPLEFT command gesture1 arm bent forward palm open at chestheight, TOPRIGHT command gesture2 arm extended forward higher palm open with torso slightlean, clearlydifferenthandposition. BOTTOMLEFT conversation gesture1 relaxed one openhand close to chest, BOTTOMRIGHT conversation gesture2 openhand offered outward waistheight with subtle headdirectionchange. Two authored cycles command TOProw, conversation BOTTOMrow. Serious restrained expressions no caricature no shouting. Feet stay planted, no scene no props except described dispatch/sheathed saber. Hats hands boots intact with40pxalpha gutters; max75%cellheight/width. Truealpha no groundshadow background text labels grids crowds weaponsdrawn gore. Preserve identity exactly not a new design. Original visual interpretation not exact likeness/uniform.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-houston.png"
    ],
    "promptId": "frontier-v1/famous-houston-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-806ba5ca-150c-4e6e-98fc-98a93a3dd7da.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-houston-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  },
  {
    "id": "santa-anna",
    "sheet": "famous-santa-anna-gestures",
    "prompt": "NEW transparent STRICT2x2 equalcells FOUR FULLBODY santa-anna gesture animation keyframes. Reference EXACT existing character identity/costume/face and warm outlined painted storybook game style: clean-shaven dark-haired general navy officer cap navy coat gold epaulettes red collar cuffs sash cream trousers black boots saber sheathed. Same slightly elevated3/4 camera same scale stance baseline in all4. All face EAST/right. TOPLEFT command gesture1 arm bent forward palm open at chestheight, TOPRIGHT command gesture2 arm extended forward higher palm open with torso slightlean, clearlydifferenthandposition. BOTTOMLEFT conversation gesture1 relaxed one openhand close to chest, BOTTOMRIGHT conversation gesture2 openhand offered outward waistheight with subtle headdirectionchange. Two authored cycles command TOProw, conversation BOTTOMrow. Serious restrained expressions no caricature no shouting. Feet stay planted, no scene no props except described dispatch/sheathed saber. Hats hands boots intact with40pxalpha gutters; max75%cellheight/width. Truealpha no groundshadow background text labels grids crowds weaponsdrawn gore. Preserve identity exactly not a new design. Original visual interpretation not exact likeness/uniform.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-santa-anna.png"
    ],
    "promptId": "frontier-v1/famous-santa-anna-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-c9ffbfed-f18e-4995-8500-44c513877f6b.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-santa-anna-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  },
  {
    "id": "austin",
    "sheet": "famous-austin-gestures",
    "prompt": "NEW transparent STRICT2x2 equalcells FOUR FULLBODY austin gesture animation keyframes. Reference EXACT existing character identity/costume/face and warm outlined painted storybook game style: clean-shaven brown-haired man charcoal hat dark moss-green frockcoat tan waistcoat white neckstock brown trousers black boots. Same slightly elevated3/4 camera same scale stance baseline in all4. All face EAST/right. TOPLEFT command gesture1 arm bent forward palm open at chestheight, TOPRIGHT command gesture2 arm extended forward higher palm open with torso slightlean, clearlydifferenthandposition. BOTTOMLEFT conversation gesture1 relaxed one openhand close to chest, BOTTOMRIGHT conversation gesture2 openhand offered outward waistheight with subtle headdirectionchange. Two authored cycles command TOProw, conversation BOTTOMrow. Serious restrained expressions no caricature no shouting. Feet stay planted, no scene no props except described dispatch/sheathed saber. Hats hands boots intact with40pxalpha gutters; max75%cellheight/width. Truealpha no groundshadow background text labels grids crowds weaponsdrawn gore. Preserve identity exactly not a new design. Original visual interpretation not exact likeness/uniform.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-austin.png"
    ],
    "promptId": "frontier-v1/famous-austin-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-95287f51-67e3-41c9-a762-2c8b1cf3ccb9.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-austin-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  },
  {
    "id": "moore",
    "sheet": "famous-moore-gestures",
    "prompt": "NEW transparent STRICT2x2 equalcells FOUR FULLBODY moore gesture animation keyframes. Reference EXACT existing character identity/costume/face and warm outlined painted storybook game style: dark-bearded brown-haired man brown felt hat brown coat cream waistcoat blue neckcloth brown trousers black boots saber sheathed. Same slightly elevated3/4 camera same scale stance baseline in all4. All face EAST/right. TOPLEFT command gesture1 arm bent forward palm open at chestheight, TOPRIGHT command gesture2 arm extended forward higher palm open with torso slightlean, clearlydifferenthandposition. BOTTOMLEFT conversation gesture1 relaxed one openhand close to chest, BOTTOMRIGHT conversation gesture2 openhand offered outward waistheight with subtle headdirectionchange. Two authored cycles command TOProw, conversation BOTTOMrow. Serious restrained expressions no caricature no shouting. Feet stay planted, no scene no props except described dispatch/sheathed saber. Hats hands boots intact with40pxalpha gutters; max75%cellheight/width. Truealpha no groundshadow background text labels grids crowds weaponsdrawn gore. Preserve identity exactly not a new design. Original visual interpretation not exact likeness/uniform.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-moore.png"
    ],
    "promptId": "frontier-v1/famous-moore-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-00f232c3-8c8c-4190-b975-e72427214c3d.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-moore-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  },
  {
    "id": "almonte",
    "sheet": "famous-almonte-gestures",
    "prompt": "NEW transparent STRICT2x2 equalcells FOUR FULLBODY almonte gesture animation keyframes. Reference EXACT existing character identity/costume/face and warm outlined painted storybook game style: clean-shaven wavy black-haired young officer NO HAT navy coat gold embroidery epaulettes redcuffs goldbelt cream trousers blackboots saber sheathed. Same slightly elevated3/4 camera same scale stance baseline in all4. All face EAST/right. TOPLEFT command gesture1 arm bent forward palm open at chestheight, TOPRIGHT command gesture2 arm extended forward higher palm open with torso slightlean, clearlydifferenthandposition. BOTTOMLEFT conversation gesture1 relaxed one openhand close to chest, BOTTOMRIGHT conversation gesture2 openhand offered outward waistheight with subtle headdirectionchange. Two authored cycles command TOProw, conversation BOTTOMrow. Serious restrained expressions no caricature no shouting. Feet stay planted, no scene no props except described dispatch/sheathed saber. Hats hands boots intact with40pxalpha gutters; max75%cellheight/width. Truealpha no groundshadow background text labels grids crowds weaponsdrawn gore. Preserve identity exactly not a new design. Original visual interpretation not exact likeness/uniform.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-almonte.png"
    ],
    "promptId": "frontier-v1/famous-almonte-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-bc1d956b-cf97-41fd-87d9-165b3ee0e581.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-almonte-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  },
  {
    "id": "burleson",
    "sheet": "famous-burleson-gestures",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-burleson.png"
    ],
    "prompt": "NEW transparent STRICT2x2 exactlyFOUR fullbody burleson gesture KEYFRAMES matching reference EXACT same face/costume/style: greying shortbearded man brown hat olive-brown longcoat tan waistcoat white neckstock brown trousers darkboots sheathedsaber. Warm outlined painterly storybookgame same elevated3/4camera mutedpalette, all EAST/right, sameplantedfeet heightscale baseline. TOPLEFT commanding openhand bent atchestheight TOPRIGHT commanding samehand extendedforward shoulderheight with slighttorsolean DISTINCT armpositions. BOTTOMLEFT conversation one openhand nearwaist closebody BOTTOMRIGHT conversation samehand outward offering with subtlenod. Exactly2command2conversation nootherposes. All hats plume boots hands intact fit75%equalcellheight75%width40pxalpha gutters. Truealpha no shadowsground backdrop textgrids labels people gunfire unsheathedweapons gore. Same character notnewdesign. Originalinterpretation nothistoricalportrait/uniformclaim.",
    "promptId": "frontier-v1/famous-burleson-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-30934b90-53ac-4167-8895-7d815dd28c5f.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-burleson-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  },
  {
    "id": "cos",
    "sheet": "famous-cos-gestures",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-cos.png"
    ],
    "prompt": "NEW transparent STRICT2x2 exactlyFOUR fullbody cos gesture KEYFRAMES matching reference EXACT same face/costume/style: small darkmoustache darkhair navy tall cylindrical shako brassbadge navyteal coat redcollar/cuffs goldshouldertabs whitecrossbelt creamtrousers blackboots sheathedsaber. Warm outlined painterly storybookgame same elevated3/4camera mutedpalette, all EAST/right, sameplantedfeet heightscale baseline. TOPLEFT commanding openhand bent atchestheight TOPRIGHT commanding samehand extendedforward shoulderheight with slighttorsolean DISTINCT armpositions. BOTTOMLEFT conversation one openhand nearwaist closebody BOTTOMRIGHT conversation samehand outward offering with subtlenod. Exactly2command2conversation nootherposes. All hats plume boots hands intact fit75%equalcellheight75%width40pxalpha gutters. Truealpha no shadowsground backdrop textgrids labels people gunfire unsheathedweapons gore. Same character notnewdesign. Originalinterpretation nothistoricalportrait/uniformclaim.",
    "promptId": "frontier-v1/famous-cos-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-744353f5-e9ff-4eef-984b-fa8f6deb3276.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-cos-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  },
  {
    "id": "urrea",
    "sheet": "famous-urrea-gestures",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-urrea.png"
    ],
    "prompt": "NEW transparent STRICT2x2 exactlyFOUR fullbody urrea gesture KEYFRAMES matching reference EXACT same face/costume/style: darkmoustache darkhair black bicorne goldrim greenplume darkblue coat gold epaulettes skyblue sash creamtrousers blackboots sheathedsaber. Warm outlined painterly storybookgame same elevated3/4camera mutedpalette, all EAST/right, sameplantedfeet heightscale baseline. TOPLEFT commanding openhand bent atchestheight TOPRIGHT commanding samehand extendedforward shoulderheight with slighttorsolean DISTINCT armpositions. BOTTOMLEFT conversation one openhand nearwaist closebody BOTTOMRIGHT conversation samehand outward offering with subtlenod. Exactly2command2conversation nootherposes. All hats plume boots hands intact fit75%equalcellheight75%width40pxalpha gutters. Truealpha no shadowsground backdrop textgrids labels people gunfire unsheathedweapons gore. Same character notnewdesign. Originalinterpretation nothistoricalportrait/uniformclaim.",
    "promptId": "frontier-v1/famous-urrea-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-84cd2ecf-4f1e-41d3-aad1-d670debf4b6a.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-urrea-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  },
  {
    "id": "castaneda",
    "sheet": "famous-castaneda-gestures",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-castaneda.png"
    ],
    "prompt": "NEW transparent STRICT2x2 exactlyFOUR fullbody castaneda gesture KEYFRAMES matching reference EXACT same face/costume/style: darkmoustache darkhair blackcrested cavalry helmet brassbadge RED plume navyteal coat redcuffs/collar goldshouldertabs whitecrossbelt creamtrousers blackboots sheathedsaber. Warm outlined painterly storybookgame same elevated3/4camera mutedpalette, all EAST/right, sameplantedfeet heightscale baseline. TOPLEFT commanding openhand bent atchestheight TOPRIGHT commanding samehand extendedforward shoulderheight with slighttorsolean DISTINCT armpositions. BOTTOMLEFT conversation one openhand nearwaist closebody BOTTOMRIGHT conversation samehand outward offering with subtlenod. Exactly2command2conversation nootherposes. All hats plume boots hands intact fit75%equalcellheight75%width40pxalpha gutters. Truealpha no shadowsground backdrop textgrids labels people gunfire unsheathedweapons gore. Same character notnewdesign. Originalinterpretation nothistoricalportrait/uniformclaim.",
    "promptId": "frontier-v1/famous-castaneda-gestures",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-11c35527-162d-490f-a4e1-7365d293c219.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-castaneda-gestures.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Identity-preserving two-pose command and conversation gestures. Original interpretive costume/likeness. Planted stance, no new weapons, dialogue, event or outcome."
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['Ten named people now use their own authored command gestures. Conversation cycles are available through PERSON_ART.speak for future explicitly staged conversations. No dialogue or historical claim added; not full facial/lip-sync animation.'];


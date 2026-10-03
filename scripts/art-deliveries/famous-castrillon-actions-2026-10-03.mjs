export const SHEETS={
'famous-castrillon-cardinal':['castrillon-walk-s-1','castrillon-walk-s-2','castrillon-walk-n-1','castrillon-walk-n-2'],
'famous-castrillon-crate':['castrillon-crate-command-1','castrillon-crate-command-2','castrillon-crate-step-down','castrillon-crate-ground']};
export const ANIMATION_CLIPS={};
export const notes=['Castrillon cardinal walks and crate rally; step-down and ground variants await staging.'];
for(const dir of ['s','n']) ANIMATION_CLIPS[`castrillon-walk-${dir}`]={frames:[1,2].map(n=>({sprite:`castrillon-walk-${dir}-${n}`,duration:280})),loop:true,authored:true,motion:'none'};
ANIMATION_CLIPS['castrillon-crate-command']={frames:[1,2].map(n=>({sprite:`castrillon-crate-command-${n}`,duration:900})),loop:true,authored:true,motion:'none'};
export const promptEntries=[
  {
    "sheet": "famous-castrillon-cardinal",
    "promptId": "frontier-v1/famous-castrillon-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "NEW transparentSTRICT2x2 FOUR fullbody walking Castrillon sprites. Reference EXACT identity andstyle: older moustached general greyinghair navycap navy doublebreasted coat gold epaulettes red collar/cuffs/sash creamtrousers blackboots. Match warmoutlined paintedstorybook style same face/costume/scale. TOP row TWO SOUTH facing towardviewer alternating left/right walking legs arms noticeably different. BOTTOM row TWO NORTH rearview awayviewer alternating legs arms; back ofhat hair coat visible NO frontface. Full hats boots hands intact max75%cellheight75%width40pxclearalpha gutters isolated equalcells. Truealpha no words grids backgrounds groundshadows weaponsfiring gore. Original interpretation not exactuniform/portrait.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-castrillon.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-cfd91ee7-6460-4051-a5d1-a2c26f79a07e.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-castrillon-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Original interpretive character and crate. Two-pose authored motion. Crate-floor anchor; battle renderer uses 1.18 body-height multiplier. Step-down and ground variants reserved for future staging; no new scripted transition."
  },
  {
    "sheet": "famous-castrillon-crate",
    "promptId": "frontier-v1/famous-castrillon-crate",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "NEW transparent STRICT2x2 FOUR fullbody Castrillon ON AMMUNITION CRATE poses. Reference EXACT face/costume/warmoutlined paintedstorybookstyle: older greying moustached general navy cap navy doublebreasted coat gold epaulettes redcollar/cuffs/sash creamtrousers blackboots. One SMALL squat wooden AMMUNITION crate plain weatheredochreplanks iron straps NO markings/text wide enoughbothboots crateHEIGHT about15%ofstandingbodyheight crateWIDTH45%bodyheight. Composite isolated fullperson+crate same scale perspective elevated3/4. TOPLEFT EAST facing standing BOTH BOOTS oncrate lid, rightarm extended palm rally command. TOPRIGHT SAME figure BOTH BOOTS oncrate rightarm raised rally differentclearpose. BOTTOMLEFT east steppingDOWN rightbootoncrate leftfootlower nearfloor, rightarmbalances. BOTTOMRIGHT east standingBESIDE samecrate BOTHbootsatground loweredarm. Samecratesizefacecostume throughout. Full hat boots crate intact within75%cellheight80%width40pxalpha gutters no celloverlap. Truealpha no groundpatch shadows background text grids gunfire gore death. This is an interpretive crate not exact artifact claim.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-castrillon.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-c08265aa-e103-4de4-a0b5-da53b697a92e.png",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f8e86418-e610-494e-8ff9-37f0ea9cfaa6.png",
    "refinementPrompt": "Edit ONLY BOTTOM RIGHT cell of this transparent2x2 atlas: REMOVE the separate wooden crate beside the standing man entirely, leaving the same full standing Castrillon figure unchanged on transparent alpha. Preserve ALL other3 cells exactly, including their crates, poses, style, costume face, size and spacing. Keep bottomright hat feet hands intact. No shadows ground backgrounds or text. Truealpha. Exactly4 isolated character cutouts overall; top two stand on crates, bottomleft steps down with crate, bottomright is just standing figure without crate.",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-castrillon-crate.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Original interpretive character and crate. Two-pose authored motion. Crate-floor anchor; battle renderer uses 1.18 body-height multiplier. Step-down and ground variants reserved for future staging; no new scripted transition."
  }
];
export const provenanceEntries=promptEntries.map(entry=>({...entry,sourceType:'generated',license:'Generated for this project',historicalStatus:'Interpretive art, not portrait or artifact evidence'}));


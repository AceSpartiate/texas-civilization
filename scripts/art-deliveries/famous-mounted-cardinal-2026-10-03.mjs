// Identity-preserving mounted north/south companions for existing east/west walks.
export const SHEETS={}, ANIMATION_CLIPS={};
export const RIDERS=["smither","jw-smith","horton","kimbell","martin","cos","urrea","castaneda","houston","santa-anna","burleson","grant"];
for(const id of RIDERS) {
 SHEETS[`famous-${id}-mounted-cardinal`]=['s','n'].flatMap(dir=>[1,2].map(n=>`${id}-mounted-walk-${dir}-${n}`));
 for(const dir of ['s','n']) ANIMATION_CLIPS[`${id}-mounted-walk-${dir}`]={
 frames:[1,2].map(n=>({sprite:`${id}-mounted-walk-${dir}-${n}`,duration:300})),
 loop:true,authored:true,motion:'none',direction:dir==='s'?'south':'north',
 };
}
export const promptEntries=[
  {
    "sheet": "famous-smither-mounted-cardinal",
    "promptId": "frontier-v1/famous-smither-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL horse+rider north/south WALK frames for smither. Reference is EXACT identity/costume/horse and STYLE: clean-shaven light-brown-haired man blue felt hat ochre jacket slate-blue neckcloth/trousers dispatch satchel on chestnut horse black mane/tail cream forehead blaze. Preserve tack/saddle/satchels colors, face/clothes, warm outlined hand-painted storybook game, slightly elevated3/4 camera. NOT a new character. TopLEFT SOUTH towardviewer walk nearforehoof planted forward farforehoof lifted, topRIGHT SOUTH opposite foreleg lifted/planted with DISTINCT legpositions. BottomLEFT NORTH awayviewer rearview horse/rider walking nearhindhoof lifted farhindplanted; bottomRIGHT NORTH opposite hindleg lifted/planted. Show BACK of rider head hat coat in bottomrow, tail rear ofhorse not head/frontface. Preserve his warning gesture: one hand on reins, other open palm raised in SOUTH views; NORTH shows same raised hand from behind. Allfour same rider/horse scale. FULL hooves ears tail hat intact, cutouts max75%cellheight75%width with generous40px transparent gutters between rowscolumns, isolated no touching. Truealpha no shadows ground patches backgrounds text labels grids gore or weapons. Original interpretive identity/horse not portrait evidence. Exactly2 south then2north, no east figures.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a24e6702-8561-4972-bc07-99a7a2f88584.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-smither-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-jw-smith-mounted-cardinal",
    "promptId": "frontier-v1/famous-jw-smith-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL horse+rider north/south WALK frames for jw-smith. Reference is EXACT identity/costume/horse and STYLE: dark-bearded man russet felt hat moss-green coat ochre neckcloth brown trousers dispatch satchel on dark bay horse dark mane/tail cream forehead star/blaze. Preserve tack/saddle/satchels colors, face/clothes, warm outlined hand-painted storybook game, slightly elevated3/4 camera. NOT a new character. TopLEFT SOUTH towardviewer walk nearforehoof planted forward farforehoof lifted, topRIGHT SOUTH opposite foreleg lifted/planted with DISTINCT legpositions. BottomLEFT NORTH awayviewer rearview horse/rider walking nearhindhoof lifted farhindplanted; bottomRIGHT NORTH opposite hindleg lifted/planted. Show BACK of rider head hat coat in bottomrow, tail rear ofhorse not head/frontface. Both hands hold reins. Allfour same rider/horse scale. FULL hooves ears tail hat intact, cutouts max75%cellheight75%width with generous40px transparent gutters between rowscolumns, isolated no touching. Truealpha no shadows ground patches backgrounds text labels grids gore or weapons. Original interpretive identity/horse not portrait evidence. Exactly2 south then2north, no east figures.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-jw-smith-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-aafecdf9-57ba-44b8-a2f7-cce41b6ab7f0.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-jw-smith-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-horton-mounted-cardinal",
    "promptId": "frontier-v1/famous-horton-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL horse+rider north/south WALK frames for horton. Reference is EXACT identity/costume/horse and STYLE: black moustached man brown felt hat indigo coat rust waistcoat green neckcloth tan trousers dispatch satchel on dapple-grey horse dark mane/tail. Preserve tack/saddle/satchels colors, face/clothes, warm outlined hand-painted storybook game, slightly elevated3/4 camera. NOT a new character. TopLEFT SOUTH towardviewer walk nearforehoof planted forward farforehoof lifted, topRIGHT SOUTH opposite foreleg lifted/planted with DISTINCT legpositions. BottomLEFT NORTH awayviewer rearview horse/rider walking nearhindhoof lifted farhindplanted; bottomRIGHT NORTH opposite hindleg lifted/planted. Show BACK of rider head hat coat in bottomrow, tail rear ofhorse not head/frontface. Both hands hold reins. Allfour same rider/horse scale. FULL hooves ears tail hat intact, cutouts max75%cellheight75%width with generous40px transparent gutters between rowscolumns, isolated no touching. Truealpha no shadows ground patches backgrounds text labels grids gore or weapons. Original interpretive identity/horse not portrait evidence. Exactly2 south then2north, no east figures.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-horton-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-9536c6a3-19bb-4265-9548-1e1cdf9b7dd5.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-horton-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-kimbell-mounted-cardinal",
    "promptId": "frontier-v1/famous-kimbell-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL horse+rider north/south WALK frames for kimbell. Reference is EXACT identity/costume/horse and STYLE: dark moustached man blue-charcoal felt hat rust-brown jacket ochre neckcloth moss-green trousers satchel on chestnut horse flaxen mane/tail. Preserve tack/saddle/satchels colors, face/clothes, warm outlined hand-painted storybook game, slightly elevated3/4 camera. NOT a new character. TopLEFT SOUTH towardviewer walk nearforehoof planted forward farforehoof lifted, topRIGHT SOUTH opposite foreleg lifted/planted with DISTINCT legpositions. BottomLEFT NORTH awayviewer rearview horse/rider walking nearhindhoof lifted farhindplanted; bottomRIGHT NORTH opposite hindleg lifted/planted. Show BACK of rider head hat coat in bottomrow, tail rear ofhorse not head/frontface. Both hands hold reins. Allfour same rider/horse scale. FULL hooves ears tail hat intact, cutouts max75%cellheight75%width with generous40px transparent gutters between rowscolumns, isolated no touching. Truealpha no shadows ground patches backgrounds text labels grids gore or weapons. Original interpretive identity/horse not portrait evidence. Exactly2 south then2north, no east figures.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-kimbell-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-0776fff0-54b1-4a4a-9b31-a1d4c5c54e81.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-kimbell-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-martin-mounted-cardinal",
    "promptId": "frontier-v1/famous-martin-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL horse+rider north/south WALK frames for martin. Reference is EXACT identity/costume/horse and STYLE: sandy-blond clean-shaven man green felt hat tan jacket blue waistcoat rust neckcloth brown trousers satchel on sorrel horse flaxen mane/tail cream forehead blaze. Preserve tack/saddle/satchels colors, face/clothes, warm outlined hand-painted storybook game, slightly elevated3/4 camera. NOT a new character. TopLEFT SOUTH towardviewer walk nearforehoof planted forward farforehoof lifted, topRIGHT SOUTH opposite foreleg lifted/planted with DISTINCT legpositions. BottomLEFT NORTH awayviewer rearview horse/rider walking nearhindhoof lifted farhindplanted; bottomRIGHT NORTH opposite hindleg lifted/planted. Show BACK of rider head hat coat in bottomrow, tail rear ofhorse not head/frontface. Both hands hold reins. Allfour same rider/horse scale. FULL hooves ears tail hat intact, cutouts max75%cellheight75%width with generous40px transparent gutters between rowscolumns, isolated no touching. Truealpha no shadows ground patches backgrounds text labels grids gore or weapons. Original interpretive identity/horse not portrait evidence. Exactly2 south then2north, no east figures.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-martin-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-bb01cfda-0231-44a4-b1e1-de8361e33927.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-martin-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-cos-mounted-cardinal",
    "promptId": "frontier-v1/famous-cos-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "NEW transparent STRICT2x2 equalcells FOUR FULL mounted cos north/south walk frames. Reference EXACT established rider face/costume/horse/tack/style: moustached officer navy shako gold epaulettes navycoat red cuffs/collar whitecrossbelt creamtrousers blackboots navy/gold saddlecloth on dappledarkgrey horse blackmane/tail. Warmoutlined handpainted storybookgame elevated3/4camera mutedcolors not3Dphotorealism. TOP row SOUTH towardviewer two visibly different alternating forelegwalking positions: cell1nearforehoof forwardplanted farforeknee lifted, cell2oppositeforeleg planted/lifted. BOTTOM row NORTH awayviewer two alternating hindlegsteps: cell3nearhindhoof raised farhindplanted, cell4oppositehind raised/planted. Rearviews show BACK of head hat coat saddle horse rump/tail NO forwardface. Both hands on reins weapons remain sheathed. Same rider/horse colors/markings scale eachcell; full earsplumes hat hooves tail preserved. Max75%cellheight75%width generous40px clearalpha gutters no touching rows/columns. Truealpha no text labels grids backgrounds shadows groundpatches shooting gore. Exactly2south then2north no sideview. Original interpretation not exact portrait/uniform claim.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-cos-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-69964aee-01cd-4f76-a7f9-dc976671788c.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-cos-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-urrea-mounted-cardinal",
    "promptId": "frontier-v1/famous-urrea-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "NEW transparent STRICT2x2 equalcells FOUR FULL mounted urrea north/south walk frames. Reference EXACT established rider face/costume/horse/tack/style: moustached officer black bicorne goldtrim greenplume navy/violetcoat gold cuffs/epaulettes palebluesash creamtrousers blackboots navy/gold saddlecloth on bay horse blackmane/tail white hind socks cream forehead stripe. Warmoutlined handpainted storybookgame elevated3/4camera mutedcolors not3Dphotorealism. TOP row SOUTH towardviewer two visibly different alternating forelegwalking positions: cell1nearforehoof forwardplanted farforeknee lifted, cell2oppositeforeleg planted/lifted. BOTTOM row NORTH awayviewer two alternating hindlegsteps: cell3nearhindhoof raised farhindplanted, cell4oppositehind raised/planted. Rearviews show BACK of head hat coat saddle horse rump/tail NO forwardface. Both hands on reins weapons remain sheathed. Same rider/horse colors/markings scale eachcell; full earsplumes hat hooves tail preserved. Max75%cellheight75%width generous40px clearalpha gutters no touching rows/columns. Truealpha no text labels grids backgrounds shadows groundpatches shooting gore. Exactly2south then2north no sideview. Original interpretation not exact portrait/uniform claim.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-urrea-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-b6eded47-e434-4d96-afe7-f1608ef0b380.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-urrea-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-castaneda-mounted-cardinal",
    "promptId": "frontier-v1/famous-castaneda-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "NEW transparent STRICT2x2 equalcells FOUR FULL mounted castaneda north/south walk frames. Reference EXACT established rider face/costume/horse/tack/style: moustached officer blackhelmet redplume navy/tealcoat redcuffs/collar goldepaulettes whitecrossbelt creamtrousers blackboots navy/gold saddlecloth on bay horse blackmane/tail creamforeheadmark. Warmoutlined handpainted storybookgame elevated3/4camera mutedcolors not3Dphotorealism. TOP row SOUTH towardviewer two visibly different alternating forelegwalking positions: cell1nearforehoof forwardplanted farforeknee lifted, cell2oppositeforeleg planted/lifted. BOTTOM row NORTH awayviewer two alternating hindlegsteps: cell3nearhindhoof raised farhindplanted, cell4oppositehind raised/planted. Rearviews show BACK of head hat coat saddle horse rump/tail NO forwardface. Both hands on reins weapons remain sheathed. Same rider/horse colors/markings scale eachcell; full earsplumes hat hooves tail preserved. Max75%cellheight75%width generous40px clearalpha gutters no touching rows/columns. Truealpha no text labels grids backgrounds shadows groundpatches shooting gore. Exactly2south then2north no sideview. Original interpretation not exact portrait/uniform claim.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-castaneda-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-16688b7b-3df4-4ec3-82f6-63d6a33f64d4.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-castaneda-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-houston-mounted-cardinal",
    "promptId": "frontier-v1/famous-houston-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL mounted houston north/south WALK frames. Reference EXACT face/costume/horse/tack/style: darkbearded man brown hat long brown coat greenwaistcoat blackcravat creamtrousers darkboots rolled greyblanket on chestnut horse redbrownmane/tail whitehind socks cream foreheadblaze. Warmoutlined painted storybookgame camera slightlyelevated3/4 mutedcolors not3Dphotorealism. TOP row SOUTH towardviewer walking: cell1 nearforehoof plantedforward farforeleg lifted, cell2 OPPOSITE forehoof planted/lifted visiblychanged. BOTTOM row NORTH awayviewer walking: cell3 nearhindhoof lifted farhindplanted, cell4 oppositehind lifted/planted. Rearviews show backofhead hat coat saddle horserump tail no frontalface. Bothhands hold reins no gesturing weapons remain sheathed. All4 exactsamecolors markings riderhorse scale full ears hats boots hooves tail intact, max75%cellheight75%width wide40pxtransparent gutters eachcell rows nooverlap. Truealpha no shadows groundpatches scenery labels text grids gore. Exactly2south then2north no eastview. Face/costume/horse artisticinterpretations not likeness claims.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-houston-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5996514c-a781-4647-ac1f-5a2a1d40afd1.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-houston-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-santa-anna-mounted-cardinal",
    "promptId": "frontier-v1/famous-santa-anna-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL mounted santa-anna north/south WALK frames. Reference EXACT face/costume/horse/tack/style: clean-shaven general navy peakedcap ornate navycoat gold epaulettes redcollar/cuffs redsash creamtrousers blackboots navy/goldsaddlecloth on darkbay horse blackmane/tail no blaze. Warmoutlined painted storybookgame camera slightlyelevated3/4 mutedcolors not3Dphotorealism. TOP row SOUTH towardviewer walking: cell1 nearforehoof plantedforward farforeleg lifted, cell2 OPPOSITE forehoof planted/lifted visiblychanged. BOTTOM row NORTH awayviewer walking: cell3 nearhindhoof lifted farhindplanted, cell4 oppositehind lifted/planted. Rearviews show backofhead hat coat saddle horserump tail no frontalface. Bothhands hold reins no gesturing weapons remain sheathed. All4 exactsamecolors markings riderhorse scale full ears hats boots hooves tail intact, max75%cellheight75%width wide40pxtransparent gutters eachcell rows nooverlap. Truealpha no shadows groundpatches scenery labels text grids gore. Exactly2south then2north no eastview. Face/costume/horse artisticinterpretations not likeness claims.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-santa-anna-mounted.png"
    ],
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3a234f67-2f7a-4646-b42b-c0dc048625a2.png",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-52941206-b821-49c2-b436-5b21ee6f987d.png",
    "refinementPrompt": "Refine this transparent2x2 Santa Anna mounted walk atlas. Keep exactrider face navycap ornatecoat gold epaulettes redcollar/cuffs redsash creamtrousers boots, same darkbayhorse no whiteblaze blackmane/tail saddle/tack style/scale. Correct DIRECTION: topTWO strictly SOUTH towardviewer horsehead body centeredFRONT, riderfront, NOdiagonal; bottomTWO strictly NORTH awayviewer centeredREAR backhat head coat saddle horserump/tail NOdiagonal NOhorsefrontface. Same centered torso orientation within eachrow, DO NOT alternate left/right facing between frames. Animate ONLY alternating forelegs on south and hindlegs on north: cell1 leftforehoof forwarddown right lifted, cell2 reverse; cell3 lefthind lifted solevisible right planted, cell4reverse. Cleardifferentlegposes. Exact4 separate fullcutouts max75%cellheightwidth40pxclearalpha gutters no touching rows, hats/hooves/tails intact. Truealpha no shadows ground backgrounds text grids. Samewarmoutlinedpaintedgame style.",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-santa-anna-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-burleson-mounted-cardinal",
    "promptId": "frontier-v1/famous-burleson-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL mounted burleson north/south WALK frames. Reference EXACT face/costume/horse/tack/style: older greybearded frontiersman brownhat mossbrown longcoat ochrewaistcoat creamshirt browntrousers boots sword sheathed rolledgreyblanket on darkbay horse blackmane/tail small whiteforeheadstar. Warmoutlined painted storybookgame camera slightlyelevated3/4 mutedcolors not3Dphotorealism. TOP row SOUTH towardviewer walking: cell1 nearforehoof plantedforward farforeleg lifted, cell2 OPPOSITE forehoof planted/lifted visiblychanged. BOTTOM row NORTH awayviewer walking: cell3 nearhindhoof lifted farhindplanted, cell4 oppositehind lifted/planted. Rearviews show backofhead hat coat saddle horserump tail no frontalface. Bothhands hold reins no gesturing weapons remain sheathed. All4 exactsamecolors markings riderhorse scale full ears hats boots hooves tail intact, max75%cellheight75%width wide40pxtransparent gutters eachcell rows nooverlap. Truealpha no shadows groundpatches scenery labels text grids gore. Exactly2south then2north no eastview. Face/costume/horse artisticinterpretations not likeness claims.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-burleson-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-7cca60c4-34d8-4a66-955f-80f4bb01a662.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-burleson-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  },
  {
    "sheet": "famous-grant-mounted-cardinal",
    "promptId": "frontier-v1/famous-grant-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL mounted grant north/south WALK frames. Reference EXACT face/costume/horse/tack/style: slender sandy-brown-haired shortstubble man greenfelt hat tanlongcoat greenwaistcoat burgundy neckcloth olive trousers leatherboots brown satchel on dun-greybrown horse blackmane/tail. Warmoutlined painted storybookgame camera slightlyelevated3/4 mutedcolors not3Dphotorealism. TOP row SOUTH towardviewer walking: cell1 nearforehoof plantedforward farforeleg lifted, cell2 OPPOSITE forehoof planted/lifted visiblychanged. BOTTOM row NORTH awayviewer walking: cell3 nearhindhoof lifted farhindplanted, cell4 oppositehind lifted/planted. Rearviews show backofhead hat coat saddle horserump tail no frontalface. Bothhands hold reins no gesturing weapons remain sheathed. All4 exactsamecolors markings riderhorse scale full ears hats boots hooves tail intact, max75%cellheight75%width wide40pxtransparent gutters eachcell rows nooverlap. Truealpha no shadows groundpatches scenery labels text grids gore. Exactly2south then2north no eastview. Face/costume/horse artisticinterpretations not likeness claims.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-grant-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-00fe4821-41b6-4dc2-ae3e-83e8e2697bd6.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-grant-mounted-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Identity-preserving two-pose south and north horse walks. Same established costume/horse palette; interpretive markings/tack can vary in small details. No new route, event, speed or historical claim. Exposed hoof and tail silhouettes alternate; modest two-pose gait, not a full skeletal rig."
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['Twelve named mounted people now turn north/south according to existing battle projection heading. East/west remains the established sheet. No speed, route, historical staging or visibility changes. Campaign marching columns still lack projected heading; these clips do not infer it on the client. Mounted turning transitions, dismounts, faster cardinal gaits and precise tack/marking continuity remain refinements.'];


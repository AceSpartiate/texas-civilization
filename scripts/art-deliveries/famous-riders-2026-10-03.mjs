// Four remaining roster riders. Visual interpretation, not portrait/uniform/horse evidence.
export const SHEETS = {}, ANIMATION_CLIPS = {};
for (const id of ["jw-smith","horton","kimbell","martin"]) {
 SHEETS[`famous-${id}`] = [
 ...[1,2,3,4].map(n=>`${id}-walk-e-${n}`),
 ...[1,2].map(n=>`${id}-walk-s-${n}`),
 ...[1,2].map(n=>`${id}-walk-n-${n}`),
 `${id}-idle`,`${id}-parley`,`${id}-point`,`${id}-listen`,
 `${id}-dispatch`,`${id}-read`,`${id}-satchel`,`${id}-rest`];
 SHEETS[`famous-${id}-mounted`] = [`${id}-mounted-walk-e-1`,`${id}-mounted-walk-e-2`,`${id}-mounted-idle-e`,`${id}-mounted-idle-s`];
 for(const dir of ['e','s','n']) ANIMATION_CLIPS[`${id}-walk-${dir}`] = {
 frames:[1,2].map(n=>({sprite:`${id}-walk-${dir}-${n}`,duration:280})),
 loop:true,authored:true,motion:'none',direction:dir==='e'?'east; mirror for west':dir==='s'?'south':'north',
 };
 ANIMATION_CLIPS[`${id}-mounted-walk-e`] = {
 frames:[1,2].map(n=>({sprite:`${id}-mounted-walk-e-${n}`,duration:300})),
 loop:true,authored:true,motion:'none',direction:'east; mirror for west',
 };
}
export const promptEntries = [
  {
    "sheet": "famous-jw-smith",
    "promptId": "frontier-v1/famous-jw-smith",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent game sprite atlas STRICT4x4 equalcells16 isolated fullbody cutouts, max75%cellheight75%width and30pxclearalpha gutters. Reference ONLY STYLE warm outlined hand-painted storybook frontier game, slightly elevated3/4 view mutedearth colors readable smallcast proportions. Entire hats boots props intact constant scale and identity. Row1 eastwalk contact leftforward, eastwalkpassing plantedleft liftedrightknee, eastwalkcontact rightforward oppositearms, eastpassing plantedright liftedleftknee. Row2 two SOUTH walks then two NORTH walks. Row3 eastidle, eastopenpalmparley, eastpoint, eastlisten. Row4 east holding blank foldeddispatch, east readingdispatch, east satchelopening, seatedrest. Strong visible leg differences in contact/passing. Truealpha no labels text background grids ground shadows firing blood. No exact portrait or costume claim. Subject: Original interpreted John W. Smith: sturdy middle-aged man, short darkbrown hair with greying sideburns, neat short dark beard, dark russet felt broadbrim hat, mossgreen civilian shortcoat creamshirt ochre neckcloth, warmbrown trousers leatherboots brown dispatchsatchel. Distinct from the reference clean-shaven blue-hatted man.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-1495021c-4306-4460-b445-a23f4677b898.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-jw-smith.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Interpretive face/costume, not portrait evidence. Contact/passing first two east poses form runtime gait; extra two are variants rather than four distinct phases. Directional foot walks, civilian parley and dispatch/rest gestures."
  },
  {
    "sheet": "famous-jw-smith-mounted",
    "promptId": "frontier-v1/famous-jw-smith-mounted",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-jw-smith.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-65661e7b-0506-4e31-8551-c373e243364a.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-jw-smith-mounted.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Rider matches own foot identity. Horse is an original visual interpretation. East two-pose walk mirrors west; south idle available. Mounted north/south gait remains requested. No route, dialogue, firing or fate changes."
  },
  {
    "sheet": "famous-horton",
    "promptId": "frontier-v1/famous-horton",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NEW transparent game sprite atlas STRICT4x4 equalcells16 isolated fullbody cutouts, max75%cellheight75%width and30pxclearalpha gutters. Reference ONLY STYLE warm outlined hand-painted storybook frontier game, slightly elevated3/4 view mutedearth colors readable smallcast proportions. Entire hats boots props intact constant scale and identity. Row1 eastwalk contact leftforward, eastwalkpassing plantedleft liftedrightknee, eastwalkcontact rightforward oppositearms, eastpassing plantedright liftedleftknee. Row2 two SOUTH walks then two NORTH walks. Row3 eastidle, eastopenpalmparley, eastpoint, eastlisten. Row4 east holding blank foldeddispatch, east readingdispatch, east satchelopening, seatedrest. Strong visible leg differences in contact/passing. Truealpha no labels text background grids ground shadows firing blood. No exact portrait or costume claim. Subject: Original interpreted Albert Clinton Horton: tall broad man, short black wavy hair, thick black moustache no beard, dark brown broadbrimhat, dusty indigo civilian coat over rustwaistcoat creamshirt, mutedgreen neckcloth tan trousers darkboots small brown satchel. Distinct face/costume from reference messenger. No militaryepaulettes.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-62703d34-f2b3-470b-866b-f7a171a76904.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-horton.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Interpretive face/costume, not portrait evidence. Contact/passing first two east poses form runtime gait; extra two are variants rather than four distinct phases. Directional foot walks, civilian parley and dispatch/rest gestures."
  },
  {
    "sheet": "famous-horton-mounted",
    "promptId": "frontier-v1/famous-horton-mounted",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-horton.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-34e3beb5-b44e-4202-8cdc-36b9f56570ef.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-horton-mounted.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Rider matches own foot identity. Horse is an original visual interpretation. East two-pose walk mirrors west; south idle available. Mounted north/south gait remains requested. No route, dialogue, firing or fate changes."
  },
  {
    "sheet": "famous-kimbell",
    "promptId": "frontier-v1/famous-kimbell",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "NEW original interpretive Texas Revolution game character atlas not exact portrait/costume evidence. Reference STYLE ONLY warm outlined hand-painted storybook frontier cast, slightly elevated3/4view, mutedearth colors readablegame proportion. True transparent STRICT4x4 equalcells16 independent fullbody cutouts75%cellheight75%width with30pxalpha gutters. Row1 eastwalking contact leftforward, passing leftbootplanted rightknee lifted, oppositecontact rightforward reversearms, passing rightplanted leftkneelifted. Row2 two southwalk then two northwalk. Row3 eastidle, eastopenpalmcommand, eastpoint, eastlistening. Row4 eastblankfoldeddispatch, eastreaddispatch, eastsatchelopening, seatedrest. Same face clothes props scale throughout. Distinct leg silhouettes contact/passing. Entire hat boots props intact no celloverlap. No text labels grids backgrounds ground shadows firing blood death. Original interpreted George C. Kimbell: compact sturdy adult, dark shorthair neat dark moustache squareface, charcoal broadbrimfelt hat, rustbrown civilian jacket creamshirt, ochre neckcloth mossgreen trousers brownboots small leathermessengersatchel. No epaulettes.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-80388c4c-9fa6-44e9-80b9-431259534487.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-kimbell.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Interpretive face/costume, not portrait evidence. Contact/passing first two east poses form runtime gait; extra two are variants rather than four distinct phases. Directional foot walks, civilian parley and dispatch/rest gestures."
  },
  {
    "sheet": "famous-kimbell-mounted",
    "promptId": "frontier-v1/famous-kimbell-mounted",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-kimbell.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5634095f-61b8-4ab3-9df2-685b72ee155c.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-kimbell-mounted.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Rider matches own foot identity. Horse is an original visual interpretation. East two-pose walk mirrors west; south idle available. Mounted north/south gait remains requested. No route, dialogue, firing or fate changes."
  },
  {
    "sheet": "famous-martin",
    "promptId": "frontier-v1/famous-martin",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "NEW original interpretive Texas Revolution game character atlas not exact portrait/costume evidence. Reference STYLE ONLY warm outlined hand-painted storybook frontier cast, slightly elevated3/4view, mutedearth colors readablegame proportion. True transparent STRICT4x4 equalcells16 independent fullbody cutouts75%cellheight75%width with30pxalpha gutters. Row1 eastwalking contact leftforward, passing leftbootplanted rightknee lifted, oppositecontact rightforward reversearms, passing rightplanted leftkneelifted. Row2 two southwalk then two northwalk. Row3 eastidle, eastopenpalmcommand, eastpoint, eastlistening. Row4 eastblankfoldeddispatch, eastreaddispatch, eastsatchelopening, seatedrest. Same face clothes props scale throughout. Distinct leg silhouettes contact/passing. Entire hat boots props intact no celloverlap. No text labels grids backgrounds ground shadows firing blood death. Original interpreted Albert Martin: lean adult man sandy-blond shorthair cleanshaven freckled face, mossgreen broadbrimhat, creamtan civilian jacket over mutedblue waistcoat offwhite shirt, rustneckcloth warmbrown trousers darkboots smallbrown dispatchsatchel. No epaulettes.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-58cafd6c-b05a-4bcc-a88e-00704cc0a093.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-martin.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Interpretive face/costume, not portrait evidence. Contact/passing first two east poses form runtime gait; extra two are variants rather than four distinct phases. Directional foot walks, civilian parley and dispatch/rest gestures."
  },
  {
    "sheet": "famous-martin-mounted",
    "promptId": "frontier-v1/famous-martin-mounted",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "NEW strict2x2 equalcell transparent atlas4 mounted Albert Martin sprites. Reference1 EXACT rider identity/costume/style sandyblond cleanshavenman greenfelt broadbrimhat tan jacket bluewaistcoat rustneckcloth browntrousers boots brown satchel. Reference2 ONLY mounted horse layout replace rider andhorse. Original interpreted sorrel horse flaxen mane/tail narrow cream blaze brown saddle/bridle; not historical horseclaim. Warm outlined handpainted storybook frontiercast elevated3/4camera mutedcolors matching reference1, not3Dphotorealism. TopLEFT EAST horse WALK contact nearfrontleg forward planted opposite rearleg forward riderbothhandsreins. TopRIGHT EAST horse WALK passing nearfront knee bent hoofRAISED clearly underbody reverselegs riderbothhandsreins. BottomLEFT EAST IDLE horse allhoovesgrounded riderbothhandsreins. BottomRIGHT SOUTH IDLE frontal horse/rider bothhandsreins. Exactly4 independent fullhorse+rider cutouts75%cellheight80%width with40px alpha gutters between allrows/columns, same face costume horse scale, no overlap ears tails hooves intact. No waving palm no shadows ground grass background text grid weapons blood. Truealpha.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-martin.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-smither-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-230b5e02-68d9-4961-aacf-ebb1269aaffe.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-martin-mounted.png",
    "postProcessing": "None; copied unchanged.",
    "review": "Rider matches own foot identity. Horse is an original visual interpretation. East two-pose walk mirrors west; south idle available. Mounted north/south gait remains requested. No route, dialogue, firing or fate changes."
  }
];
export const provenanceEntries = promptEntries.map(({prompt,...entry})=>entry);
export const notes = ['John W. Smith, Horton, Kimbell and Martin replace roster rider stand-ins in existing Alamo, Bexar and Coleto appearances. Mounted north/south walking, faster gaits and additional historical actions remain refinements. Dispatch/rest/foot gesture variants are available only for explicit projected states; no invented dialogue, death or firing is staged.'];


// Painted family headwear identities and adolescent bodies, 2026-10-02.
export const VARIANTS = ["mother-scarf","father-straw","father-beard","father-moustache","mother-braid","mother-loose","mother-straw","youth-boy","youth-girl"];
export const SHEETS = {};
export const ANIMATION_CLIPS = {};
for (const variant of VARIANTS) {
  const p = pose => `${variant}-${pose}`;
  SHEETS[`people-family-${variant}`] = [
    ...[1,2,3,4].map(n => p(`walk-e-${n}`)),
    ...[1,2].map(n => p(`walk-s-${n}`)),
    ...[1,2].map(n => p(`walk-n-${n}`)),
    p('idle-s'), p('idle-e'), p('idle-n'), p('work-1'),
    p('work-2'), p('rest'), p('injured-rest'), p('quiet'),
  ];
  for (const [dir,count] of [['e',4],['s',2],['n',2]]) {
    ANIMATION_CLIPS[p(dir==='e'?'walk':`walk-${dir}`)] = {
      frames:Array.from({length:count},(_,i)=>({sprite:p(`walk-${dir}-${i+1}`),duration:dir==='e'?200:280})),
      loop:true,authored:true,motion:'none',direction:dir==='e'?'east; mirror for west':dir==='s'?'south':'north',
    };
  }
  for (const pose of ['idle-s','idle-e','idle-n','rest','injured-rest']) ANIMATION_CLIPS[p(pose)] = {
    frames:[{sprite:p(pose),duration:1500}],loop:true,authored:false,motion:pose.startsWith('idle')?'breathe':'none',
  };
  ANIMATION_CLIPS[p('work')] = {frames:[1,2].map(n=>({sprite:p(`work-${n}`),duration:650})),loop:true,authored:true,motion:'none'};
  for (const [pose,frame] of [['listen-s','idle-s'],['listen-n','idle-n'],['speak','idle-e']]) ANIMATION_CLIPS[p(pose)] = {
    frames:[{sprite:p(frame),duration:1500}],loop:true,authored:false,motion:'breathe',
  };
}
export const promptEntries = [
  {
    "sheet": "people-family-mother-scarf",
    "promptId": "frontier-v1/people-family-mother-scarf",
    "tool": "built-in image_gen.imagegen",
    "mode": "edit",
    "prompt": "Create a genuine transparent PNG 4x4 production atlas, 16 isolated full body sprites, for Texas frontier family game. STYLE reference only: match warm outlined hand-painted storybook farm-game illustration, dark brown ink, flat shading with subtle painted texture, restrained earthy palette, slightly elevated camera, readable silhouettes. Subject: adult mother around 30, mature face and adult torso/limb proportions, brown hair tucked under a plain cream HEADSCARF tied at nape, rust-red long-sleeved 1830s blouse and muted rust full skirt with cream apron, brown shoes. Same exact individual and outfit in every cell. Not a child; recognizably grown parent. Grid 4 columns 4 rows; each cutout at most 78 percent of cell height/width with at least 25px clear alpha gutters vertically AND horizontally, no touching neighbors. Row1 four distinct eastward walking steps, alternating contacts and passing legs. Row2 two SOUTH/front walking opposite steps then two NORTH/back walking opposite steps. Row3 FRONT/SOUTH idle, EAST idle, NORTH idle, EAST work reach hands forward. Row4 EAST work bent hands lowered alternate, SOUTH seated rest, EAST injured seated with simple bandage no blood, SOUTH listening hands relaxed. Preserve silhouette/face/clothes/headwear in every pose; all full feet/headwear intact. No background/shadow/text/grid/checkerboard/weapons. Skin warm medium, hair brown; distinguish skin, hair and rust clothing pigments for later palette changes; cream fabrics neutral.",
    "refinementPrompt": "Edit all16 figures in this transparent sprite sheet ONLY at headwear: replace every bonnet/cap/brim with a plain cream fabric HEADSCARF wrapped close around the head and tied at the nape, a small knot with two short cloth tails visible from side/back. No projecting brim, no rounded bonnet pouch, no chin straps. Brown hair mostly covered, face and little hair at forehead unchanged. Keep all16 poses, clothes, body silhouettes, camera, warm outlined painted style, dimensions and true transparent background. Preserve generously isolated alpha gutters; do not let cutouts touch other cells. This must read differently from a bonnet and from straw hat.",
    "refinementSourcePath": "C:\\Users\\zachw\\.codex\\generated_images\\01a082eb-77f7-7f73-8400-ebcc7426ac7b\\exec-2842732a-347e-4e6d-90c0-47402c8d6469.png",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-9761b9b5-8ee8-4136-8865-4891df868519.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-family-mother-scarf.png",
    "postProcessing": "None. Built-in PNG copied unchanged; atlas builder measures alpha components.",
    "review": "Warm outlined identity retained across directional travel, work and rest. Some gait silhouettes differ modestly. Additional task-specific props use presentation pose aliases rather than inventing simulation state."
  },
  {
    "sheet": "people-family-father-straw",
    "promptId": "frontier-v1/people-family-father-straw",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create a genuine transparent PNG 4x4 production atlas, 16 isolated full body sprites, for Texas frontier family game. STYLE reference only: match warm outlined hand-painted storybook farm-game illustration, dark brown ink, flat shading with subtle painted texture, restrained earthy palette, slightly elevated camera, readable silhouettes. Subject: adult father around 35, mature clean-shaven face and adult torso/limb proportions, brown hair under a broad woven STRAW HAT, rust-red 1830s frontier overshirt with cream neckcloth, brown trousers and boots. Same exact individual and outfit in every cell. Not a child; recognizably grown parent. Grid 4 columns 4 rows; each cutout at most 78 percent of cell height/width with at least 25px clear alpha gutters vertically AND horizontally, no touching neighbors. Row1 four distinct eastward walking steps, alternating contacts and passing legs. Row2 two SOUTH/front walking opposite steps then two NORTH/back walking opposite steps. Row3 FRONT/SOUTH idle, EAST idle, NORTH idle, EAST work reach hands forward. Row4 EAST work bent hands lowered alternate, SOUTH seated rest, EAST injured seated with simple bandage no blood, SOUTH listening hands relaxed. Preserve silhouette/face/clothes/headwear in every pose; all full feet/headwear intact. No background/shadow/text/grid/checkerboard/weapons. Skin warm medium, hair brown; distinguish skin, hair and rust clothing pigments for later palette changes; cream fabrics neutral.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-e9afaedc-52d7-4bc9-8fe2-79852986f2ea.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-family-father-straw.png",
    "postProcessing": "None. Built-in PNG copied unchanged; atlas builder measures alpha components.",
    "review": "Warm outlined identity retained across directional travel, work and rest. Some gait silhouettes differ modestly. Additional task-specific props use presentation pose aliases rather than inventing simulation state."
  },
  {
    "sheet": "people-family-father-beard",
    "promptId": "frontier-v1/people-family-father-beard",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production transparent 4 columns by 4 rows PNG sprite atlas, exactly16 isolated complete figures. Reference STYLE ONLY: warm outlined hand-painted storybook frontier farm-game art, dark olive brown outlines, flat painted shading, moss/rust/cream/ochre palette, slightly elevated game view. Subject adult father age40 with mature proportions, full brown BEARD and NO HAT, short brown hair, rust overshirt cream neckcloth brown trousers boots. A recognizable grown parent, consistent face and costume in every cell. Occupy at most78% of each equal cell's height/width, generous clear transparent gutters at least25px ALL rows/columns, no touching adjacent sprites. Row1 four distinct EAST walking gait frames alternating contact/passing/opposite contact/opposite passing, visibly alternating leg and arm. Row2 two SOUTH walking alternate footfalls then two NORTH BACK walking alternate footfalls. Row3 SOUTH idle, EAST idle, NORTH idle, EAST work reaching hands forward. Row4 EAST work bent hands lower, SOUTH seated rest, EAST injured seated simple ankle bandage no blood, SOUTH listening relaxed hands. Skin warm medium and hair brown, rust clothing separate pigments, neutral cream fabrics for runtime palette. Keep heads feet props fully inside cell. True alpha no background checkerboard ground shadow text grid modern objects weapons.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ca15389e-90c3-4054-ae0e-ef5c81d4611c.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-family-father-beard.png",
    "postProcessing": "None. Built-in PNG copied unchanged; atlas builder measures alpha components.",
    "review": "Warm outlined identity retained across directional travel, work and rest. Some gait silhouettes differ modestly. Additional task-specific props use presentation pose aliases rather than inventing simulation state."
  },
  {
    "sheet": "people-family-father-moustache",
    "promptId": "frontier-v1/people-family-father-moustache",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production transparent 4 columns by 4 rows PNG sprite atlas, exactly16 isolated complete figures. Reference STYLE ONLY: warm outlined hand-painted storybook frontier farm-game art, dark olive brown outlines, flat painted shading, moss/rust/cream/ochre palette, slightly elevated game view. Subject adult father age35 with mature proportions, brown MOUSTACHE and NO BEARD or HAT, short brown hair, rust overshirt cream neckcloth brown trousers boots. A recognizable grown parent, consistent face and costume in every cell. Occupy at most78% of each equal cell's height/width, generous clear transparent gutters at least25px ALL rows/columns, no touching adjacent sprites. Row1 four distinct EAST walking gait frames alternating contact/passing/opposite contact/opposite passing, visibly alternating leg and arm. Row2 two SOUTH walking alternate footfalls then two NORTH BACK walking alternate footfalls. Row3 SOUTH idle, EAST idle, NORTH idle, EAST work reaching hands forward. Row4 EAST work bent hands lower, SOUTH seated rest, EAST injured seated simple ankle bandage no blood, SOUTH listening relaxed hands. Skin warm medium and hair brown, rust clothing separate pigments, neutral cream fabrics for runtime palette. Keep heads feet props fully inside cell. True alpha no background checkerboard ground shadow text grid modern objects weapons.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-bd13c8d2-5e0c-4957-9ada-c5798a3d9c92.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-family-father-moustache.png",
    "postProcessing": "None. Built-in PNG copied unchanged; atlas builder measures alpha components.",
    "review": "Warm outlined identity retained across directional travel, work and rest. Some gait silhouettes differ modestly. Additional task-specific props use presentation pose aliases rather than inventing simulation state."
  },
  {
    "sheet": "people-family-mother-braid",
    "promptId": "frontier-v1/people-family-mother-braid",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production transparent 4 columns by 4 rows PNG sprite atlas, exactly16 isolated complete figures. Reference STYLE ONLY: warm outlined hand-painted storybook frontier farm-game art, dark olive brown outlines, flat painted shading, moss/rust/cream/ochre palette, slightly elevated game view. Subject adult mother age30 with mature proportions, brown hair in one LONG BRAID over shoulder, uncovered head, rust long-sleeved blouse and full rust skirt, cream apron brown shoes. A recognizable grown parent, consistent face and costume in every cell. Occupy at most78% of each equal cell's height/width, generous clear transparent gutters at least25px ALL rows/columns, no touching adjacent sprites. Row1 four distinct EAST walking gait frames alternating contact/passing/opposite contact/opposite passing, visibly alternating leg and arm. Row2 two SOUTH walking alternate footfalls then two NORTH BACK walking alternate footfalls. Row3 SOUTH idle, EAST idle, NORTH idle, EAST work reaching hands forward. Row4 EAST work bent hands lower, SOUTH seated rest, EAST injured seated simple ankle bandage no blood, SOUTH listening relaxed hands. Skin warm medium and hair brown, rust clothing separate pigments, neutral cream fabrics for runtime palette. Keep heads feet props fully inside cell. True alpha no background checkerboard ground shadow text grid modern objects weapons.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-7fc410f2-beba-47e0-853b-23ad6f160713.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-family-mother-braid.png",
    "postProcessing": "None. Built-in PNG copied unchanged; atlas builder measures alpha components.",
    "review": "Warm outlined identity retained across directional travel, work and rest. Some gait silhouettes differ modestly. Additional task-specific props use presentation pose aliases rather than inventing simulation state."
  },
  {
    "sheet": "people-family-mother-loose",
    "promptId": "frontier-v1/people-family-mother-loose",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production transparent 4 columns by 4 rows PNG sprite atlas, exactly16 isolated complete figures. Reference STYLE ONLY: warm outlined hand-painted storybook frontier farm-game art, dark olive brown outlines, flat painted shading, moss/rust/cream/ochre palette, slightly elevated game view. Subject adult mother age30 with mature proportions, uncovered brown hair LOOSE to shoulders with soft waves, rust long-sleeved blouse and full rust skirt, cream apron brown shoes. A recognizable grown parent, consistent face and costume in every cell. Occupy at most78% of each equal cell's height/width, generous clear transparent gutters at least25px ALL rows/columns, no touching adjacent sprites. Row1 four distinct EAST walking gait frames alternating contact/passing/opposite contact/opposite passing, visibly alternating leg and arm. Row2 two SOUTH walking alternate footfalls then two NORTH BACK walking alternate footfalls. Row3 SOUTH idle, EAST idle, NORTH idle, EAST work reaching hands forward. Row4 EAST work bent hands lower, SOUTH seated rest, EAST injured seated simple ankle bandage no blood, SOUTH listening relaxed hands. Skin warm medium and hair brown, rust clothing separate pigments, neutral cream fabrics for runtime palette. Keep heads feet props fully inside cell. True alpha no background checkerboard ground shadow text grid modern objects weapons.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-7929e676-8e7e-4f85-8093-2bdcd8c0b120.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-family-mother-loose.png",
    "postProcessing": "None. Built-in PNG copied unchanged; atlas builder measures alpha components.",
    "review": "Warm outlined identity retained across directional travel, work and rest. Some gait silhouettes differ modestly. Additional task-specific props use presentation pose aliases rather than inventing simulation state."
  },
  {
    "sheet": "people-family-mother-straw",
    "promptId": "frontier-v1/people-family-mother-straw",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production transparent 4 columns by 4 rows PNG sprite atlas, exactly16 isolated complete figures. Reference STYLE ONLY: warm outlined hand-painted storybook frontier farm-game art, dark olive brown outlines, flat painted shading, moss/rust/cream/ochre palette, slightly elevated game view. Subject adult mother age30 with mature proportions, broad woven STRAW HAT over brown low bun, rust long-sleeved blouse and full rust skirt, cream apron brown shoes. A recognizable grown parent, consistent face and costume in every cell. Occupy at most78% of each equal cell's height/width, generous clear transparent gutters at least25px ALL rows/columns, no touching adjacent sprites. Row1 four distinct EAST walking gait frames alternating contact/passing/opposite contact/opposite passing, visibly alternating leg and arm. Row2 two SOUTH walking alternate footfalls then two NORTH BACK walking alternate footfalls. Row3 SOUTH idle, EAST idle, NORTH idle, EAST work reaching hands forward. Row4 EAST work bent hands lower, SOUTH seated rest, EAST injured seated simple ankle bandage no blood, SOUTH listening relaxed hands. Skin warm medium and hair brown, rust clothing separate pigments, neutral cream fabrics for runtime palette. Keep heads feet props fully inside cell. True alpha no background checkerboard ground shadow text grid modern objects weapons.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5d48ed24-ab65-4dfb-9010-847b7fd6a406.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-family-mother-straw.png",
    "postProcessing": "None. Built-in PNG copied unchanged; atlas builder measures alpha components.",
    "review": "Warm outlined identity retained across directional travel, work and rest. Some gait silhouettes differ modestly. Additional task-specific props use presentation pose aliases rather than inventing simulation state."
  },
  {
    "sheet": "people-family-youth-boy",
    "promptId": "frontier-v1/people-family-youth-boy",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent 4x4 16-frame atlas for Texas1835 storybook farm-game. Match reference warm hand-painted outlined style, thin dark-brown contour, simple flat shading, slightly elevated camera. boy around13, unmistakably adolescent slim shoulders, youthful face without beard, short brown tousled hair, NO hat, rust linen shirt, brown trousers boots, same identity clothes and colors every cell. Real adolescent rather than scaled adult or small child. Equal4columns4rows with all16 full figures isolated and centered, max78% cell dimensions, minimum25px true alpha gutters in all directions, no neighbors touching. Row1 four EAST walking gait steps alternating contacts and bent-knee passing. Row2 two SOUTH/front walking opposite steps followed by two NORTH/back walking opposite steps. Row3 SOUTH idle, EAST idle, NORTH idle, EAST work arms reaching. Row4 EAST work bent hands lowered, SOUTH seated rest, EAST injured seated simple ankle cloth bandage no blood, SOUTH listen relaxed arms. Warm medium skin, brown hair, rust clothing pigments distinguished for palette changes. No background checkerboard text grid shadow or weapons.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-edbb434f-74ec-454c-abd4-d529c9fd5a48.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-family-youth-boy.png",
    "postProcessing": "None. Built-in PNG copied unchanged; atlas builder measures alpha components.",
    "review": "Warm outlined identity retained across directional travel, work and rest. Some gait silhouettes differ modestly. Additional task-specific props use presentation pose aliases rather than inventing simulation state."
  },
  {
    "sheet": "people-family-youth-girl",
    "promptId": "frontier-v1/people-family-youth-girl",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent 4x4 16-frame atlas for Texas1835 storybook farm-game. Match reference warm hand-painted outlined style, thin dark-brown contour, simple flat shading, slightly elevated camera. girl around13, unmistakably adolescent proportions and youthful face, brown simple braid, NO hat, rust long-sleeved calico dress, cream apron brown shoes, same identity clothes and colors every cell. Real adolescent rather than scaled adult or small child. Equal4columns4rows with all16 full figures isolated and centered, max78% cell dimensions, minimum25px true alpha gutters in all directions, no neighbors touching. Row1 four EAST walking gait steps alternating contacts and bent-knee passing. Row2 two SOUTH/front walking opposite steps followed by two NORTH/back walking opposite steps. Row3 SOUTH idle, EAST idle, NORTH idle, EAST work arms reaching. Row4 EAST work bent hands lowered, SOUTH seated rest, EAST injured seated simple ankle cloth bandage no blood, SOUTH listen relaxed arms. Warm medium skin, brown hair, rust clothing pigments distinguished for palette changes. No background checkerboard text grid shadow or weapons.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-587775a8-5b00-4e0d-a08d-982ba5a46e7f.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-family-youth-girl.png",
    "postProcessing": "None. Built-in PNG copied unchanged; atlas builder measures alpha components.",
    "review": "Warm outlined identity retained across directional travel, work and rest. Some gait silhouettes differ modestly. Additional task-specific props use presentation pose aliases rather than inventing simulation state."
  }
];
export const provenanceEntries = promptEntries.map(({prompt,...entry})=>entry);
export const notes = ['Seven previously aliased parent head choices now have separate painted figures. Two adolescent bodies keep inherited colors without substituting adult portraits. Generic reach/work poses support existing actions; specialized tool and seated transport rigs remain future art refinement. Quiet final-cell variants are catalog assets, not used as standing conversation poses.'];


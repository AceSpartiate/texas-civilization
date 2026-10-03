export const RIDERS=["deaf-smith","karnes","lamar","sherman","rusk"];
export const SHEETS={},ANIMATION_CLIPS={};
for(const id of RIDERS){SHEETS[`famous-${id}-mounted-cardinal`]=['s','n'].flatMap(dir=>[1,2].map(n=>`${id}-mounted-walk-${dir}-${n}`));for(const dir of ['s','n'])ANIMATION_CLIPS[`${id}-mounted-walk-${dir}`]={frames:[1,2].map(n=>({sprite:`${id}-mounted-walk-${dir}-${n}`,duration:300})),loop:true,authored:true,motion:'none',direction:dir==='s'?'south':'north'};}
export const promptEntries=[
  {
    "id": "deaf-smith",
    "sheet": "famous-deaf-smith-mounted-cardinal",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL mounted deaf-smith NORTH/SOUTH WALK sprites. Reference EXACT existing identity/costume/horse/tack/style: bearded middle-aged man olive-brown hat fringed buckskin jacket sage vest rust-red neckcloth grey trousers leather satchel; sandy buckskin horse dark mane/tail cream blaze and white hind socks. Warm dark outlined painted storybook frontier game, slightly elevated camera, muted natural palette. TOPLEFT south towardviewer nearforehoof forward planted farforehoof raised; TOPRIGHT south OPPOSITE leg planted/raised clearly different. BOTTOMLEFT north directly awayviewer rearview one hindhoof raised other planted; BOTTOMRIGHT north opposite hindhoof raised/planted. Both rear cells must show BACK of rider head hat coat and horse rump tail, NO frontface no opposing diagonal angles. Same face/horse/clothes/scale across4. Both hands hold reins. Full ears hooves hat tail boots intact within75%each cellheight/width with40px transparent gutters. Truealpha no ground shadows background labels words grid gore. Identity and horse are interpretations not portrait evidence. Exactly2south2north no east.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-deaf-smith-mounted.png"
    ],
    "promptId": "frontier-v1/famous-deaf-smith-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-53b58aab-6bd7-4b11-9adb-bbf2b249a480.png",
    "refinementPrompt": "Edit ONLY the WALKING LEGS/HOOVES of the horses in this 2x2 sprite atlas. All faces clothing rider heads hands tack coats scale layout transparency must remain unchanged. TOPLEFT frontal horse: LEFT leg as seen by viewer raised bent at knee with hoof 60px ABOVE ground and RIGHT foreleg straight planted. TOPRIGHT frontal horse: RIGHT foreleg as seen by viewer raised bent at knee hoof 60px ABOVE ground and LEFT foreleg straight planted. This is essential: opposite visibly alternating FRONT legs, NOT two copies of same pose. BOTTOMLEFT rear horse: LEFT hindhoof viewerleft lifted high RIGHT planted. BOTTOMRIGHT rear horse RIGHT hindhoof lifted LEFT planted. Preserve fullbody silhouettes, full boots hats tails ears margins and truealpha. No background text shadows. Exactly4 horse+rider cutouts.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a31efa2d-3e21-4826-8c19-8d2fc7fc888f.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-deaf-smith-mounted-cardinal.png",
    "postProcessing": "None; selected refined PNG copied unchanged.",
    "review": "Two-pose cardinal walk with visibly alternating hoof placement. Same identity/costume/horse palette. Fine horse marking and tack details remain interpretive. No full skeletal rig, turning transition, speed or route change."
  },
  {
    "id": "karnes",
    "sheet": "famous-karnes-mounted-cardinal",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL mounted karnes NORTH/SOUTH WALK sprites. Reference EXACT existing identity/costume/horse/tack/style: red-haired short red-bearded man brown hat plum-brown jacket ochre waistcoat slate neckcloth brown trousers; black horse dark mane/tail. Warm dark outlined painted storybook frontier game, slightly elevated camera, muted natural palette. TOPLEFT south towardviewer nearforehoof forward planted farforehoof raised; TOPRIGHT south OPPOSITE leg planted/raised clearly different. BOTTOMLEFT north directly awayviewer rearview one hindhoof raised other planted; BOTTOMRIGHT north opposite hindhoof raised/planted. Both rear cells must show BACK of rider head hat coat and horse rump tail, NO frontface no opposing diagonal angles. Same face/horse/clothes/scale across4. Both hands hold reins. Full ears hooves hat tail boots intact within75%each cellheight/width with40px transparent gutters. Truealpha no ground shadows background labels words grid gore. Identity and horse are interpretations not portrait evidence. Exactly2south2north no east.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-karnes-mounted.png"
    ],
    "promptId": "frontier-v1/famous-karnes-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-dbe184d5-203e-473f-ada2-8eabb072be32.png",
    "refinementPrompt": "Edit ONLY the WALKING LEGS/HOOVES of the horses in this 2x2 sprite atlas. All faces clothing rider heads hands tack coats scale layout transparency must remain unchanged. TOPLEFT frontal horse: LEFT leg as seen by viewer raised bent at knee with hoof 60px ABOVE ground and RIGHT foreleg straight planted. TOPRIGHT frontal horse: RIGHT foreleg as seen by viewer raised bent at knee hoof 60px ABOVE ground and LEFT foreleg straight planted. This is essential: opposite visibly alternating FRONT legs, NOT two copies of same pose. BOTTOMLEFT rear horse: LEFT hindhoof viewerleft lifted high RIGHT planted. BOTTOMRIGHT rear horse RIGHT hindhoof lifted LEFT planted. Preserve fullbody silhouettes, full boots hats tails ears margins and truealpha. No background text shadows. Exactly4 horse+rider cutouts.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-615f3cf2-1a84-4459-8a4c-4566fdcf92b0.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-karnes-mounted-cardinal.png",
    "postProcessing": "None; selected refined PNG copied unchanged.",
    "review": "Two-pose cardinal walk with visibly alternating hoof placement. Same identity/costume/horse palette. Fine horse marking and tack details remain interpretive. No full skeletal rig, turning transition, speed or route change."
  },
  {
    "id": "lamar",
    "sheet": "famous-lamar-mounted-cardinal",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL mounted lamar NORTH/SOUTH WALK sprites. Reference EXACT existing identity/costume/horse/tack/style: clean-shaven brown-haired young man charcoal hat teal longcoat ochre waistcoat rust neckcloth tan trousers; pale grey horse dark mane/tail. Warm dark outlined painted storybook frontier game, slightly elevated camera, muted natural palette. TOPLEFT south towardviewer nearforehoof forward planted farforehoof raised; TOPRIGHT south OPPOSITE leg planted/raised clearly different. BOTTOMLEFT north directly awayviewer rearview one hindhoof raised other planted; BOTTOMRIGHT north opposite hindhoof raised/planted. Both rear cells must show BACK of rider head hat coat and horse rump tail, NO frontface no opposing diagonal angles. Same face/horse/clothes/scale across4. Both hands hold reins. Full ears hooves hat tail boots intact within75%each cellheight/width with40px transparent gutters. Truealpha no ground shadows background labels words grid gore. Identity and horse are interpretations not portrait evidence. Exactly2south2north no east.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-lamar-mounted.png"
    ],
    "promptId": "frontier-v1/famous-lamar-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-151381ba-ad80-4c2b-ab08-b8baf0f1aaa4.png",
    "refinementPrompt": "Edit ONLY the WALKING LEGS/HOOVES of the horses in this 2x2 sprite atlas. All faces clothing rider heads hands tack coats scale layout transparency must remain unchanged. TOPLEFT frontal horse: LEFT leg as seen by viewer raised bent at knee with hoof 60px ABOVE ground and RIGHT foreleg straight planted. TOPRIGHT frontal horse: RIGHT foreleg as seen by viewer raised bent at knee hoof 60px ABOVE ground and LEFT foreleg straight planted. This is essential: opposite visibly alternating FRONT legs, NOT two copies of same pose. BOTTOMLEFT rear horse: LEFT hindhoof viewerleft lifted high RIGHT planted. BOTTOMRIGHT rear horse RIGHT hindhoof lifted LEFT planted. Preserve fullbody silhouettes, full boots hats tails ears margins and truealpha. No background text shadows. Exactly4 horse+rider cutouts.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-8e2957d3-056a-4337-a01d-faeae05d66c4.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-lamar-mounted-cardinal.png",
    "postProcessing": "None; selected refined PNG copied unchanged.",
    "review": "Two-pose cardinal walk with visibly alternating hoof placement. Same identity/costume/horse palette. Fine horse marking and tack details remain interpretive. No full skeletal rig, turning transition, speed or route change."
  },
  {
    "id": "sherman",
    "sheet": "famous-sherman-mounted-cardinal",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL mounted sherman NORTH/SOUTH WALK sprites. Reference EXACT existing identity/costume/horse/tack/style: brown-haired moustached man tan hat olive-brown coat dark green waistcoat burgundy neckcloth tan trousers; bay horse black mane/tail. Warm dark outlined painted storybook frontier game, slightly elevated camera, muted natural palette. TOPLEFT south towardviewer nearforehoof forward planted farforehoof raised; TOPRIGHT south OPPOSITE leg planted/raised clearly different. BOTTOMLEFT north directly awayviewer rearview one hindhoof raised other planted; BOTTOMRIGHT north opposite hindhoof raised/planted. Both rear cells must show BACK of rider head hat coat and horse rump tail, NO frontface no opposing diagonal angles. Same face/horse/clothes/scale across4. Both hands hold reins. Full ears hooves hat tail boots intact within75%each cellheight/width with40px transparent gutters. Truealpha no ground shadows background labels words grid gore. Identity and horse are interpretations not portrait evidence. Exactly2south2north no east.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-sherman-mounted.png"
    ],
    "promptId": "frontier-v1/famous-sherman-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3ff55b04-bf35-4786-9a41-aac6cf2996fb.png",
    "refinementPrompt": "Edit ONLY the WALKING LEGS/HOOVES of the horses in this 2x2 sprite atlas. All faces clothing rider heads hands tack coats scale layout transparency must remain unchanged. TOPLEFT frontal horse: LEFT leg as seen by viewer raised bent at knee with hoof 60px ABOVE ground and RIGHT foreleg straight planted. TOPRIGHT frontal horse: RIGHT foreleg as seen by viewer raised bent at knee hoof 60px ABOVE ground and LEFT foreleg straight planted. This is essential: opposite visibly alternating FRONT legs, NOT two copies of same pose. BOTTOMLEFT rear horse: LEFT hindhoof viewerleft lifted high RIGHT planted. BOTTOMRIGHT rear horse RIGHT hindhoof lifted LEFT planted. Preserve fullbody silhouettes, full boots hats tails ears margins and truealpha. No background text shadows. Exactly4 horse+rider cutouts.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ec655c4e-fb68-4956-b6df-2911a54c1a75.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-sherman-mounted-cardinal.png",
    "postProcessing": "None; selected refined PNG copied unchanged.",
    "review": "Two-pose cardinal walk with visibly alternating hoof placement. Same identity/costume/horse palette. Fine horse marking and tack details remain interpretive. No full skeletal rig, turning transition, speed or route change."
  },
  {
    "id": "rusk",
    "sheet": "famous-rusk-mounted-cardinal",
    "prompt": "Create NEW transparent STRICT2x2 equalcells FOUR FULL mounted rusk NORTH/SOUTH WALK sprites. Reference EXACT existing identity/costume/horse/tack/style: clean-shaven brown-haired man black hat russet longcoat slate waistcoat black neckcloth tan trousers; dark bay horse narrow cream blaze two white hind socks. Warm dark outlined painted storybook frontier game, slightly elevated camera, muted natural palette. TOPLEFT south towardviewer nearforehoof forward planted farforehoof raised; TOPRIGHT south OPPOSITE leg planted/raised clearly different. BOTTOMLEFT north directly awayviewer rearview one hindhoof raised other planted; BOTTOMRIGHT north opposite hindhoof raised/planted. Both rear cells must show BACK of rider head hat coat and horse rump tail, NO frontface no opposing diagonal angles. Same face/horse/clothes/scale across4. Both hands hold reins. Full ears hooves hat tail boots intact within75%each cellheight/width with40px transparent gutters. Truealpha no ground shadows background labels words grid gore. Identity and horse are interpretations not portrait evidence. Exactly2south2north no east.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-rusk-mounted.png"
    ],
    "promptId": "frontier-v1/famous-rusk-mounted-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-2b136f8c-e68f-4c51-9678-7867ef919a1c.png",
    "refinementPrompt": "Edit ONLY the WALKING LEGS/HOOVES of the horses in this 2x2 sprite atlas. All faces clothing rider heads hands tack coats scale layout transparency must remain unchanged. TOPLEFT frontal horse: LEFT leg as seen by viewer raised bent at knee with hoof 60px ABOVE ground and RIGHT foreleg straight planted. TOPRIGHT frontal horse: RIGHT foreleg as seen by viewer raised bent at knee hoof 60px ABOVE ground and LEFT foreleg straight planted. This is essential: opposite visibly alternating FRONT legs, NOT two copies of same pose. BOTTOMLEFT rear horse: LEFT hindhoof viewerleft lifted high RIGHT planted. BOTTOMRIGHT rear horse RIGHT hindhoof lifted LEFT planted. Preserve fullbody silhouettes, full boots hats tails ears margins and truealpha. No background text shadows. Exactly4 horse+rider cutouts.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-b1ea8045-e742-4b84-a638-1f3b7cc03b97.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-rusk-mounted-cardinal.png",
    "postProcessing": "None; selected refined PNG copied unchanged.",
    "review": "Two-pose cardinal walk with visibly alternating hoof placement. Same identity/costume/horse palette. Fine horse marking and tack details remain interpretive. No full skeletal rig, turning transition, speed or route change."
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['Deaf Smith, Karnes, Lamar, Sherman and Rusk now have authored mounted north/south walks selected by projected battle heading. Existing rescue/rally/stop poses retain their special scene bindings. Campaign columns still lack projected heading; no client direction inference added.'];


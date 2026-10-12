export const SHEETS={}, ANIMATION_CLIPS={};
const casts={cast1:['rust','teal','elder','blue'],cast2:['rust-woman','indigo','ochre','blue-girl']};
for(const [cast,people] of Object.entries(casts)){
 SHEETS[`adult-passengers-${cast}`]=['e','s','n'].flatMap(d=>[1,2].flatMap(i=>people.map(p=>`${p}-wagon-passenger-${d}-${i}`)));
 for(const p of people)for(const d of ['e','s','n'])ANIMATION_CLIPS[`${p}-wagon-passenger-${d}`]={frames:[1,2].map(i=>({sprite:`${p}-wagon-passenger-${d}-${i}`,duration:750})),loop:true,authored:true,motion:'none'};
}
for(const p of ['rust-woman','indigo','ochre','blue-girl','rust']){
 SHEETS[`family-infant-walk-${p}`]=['e','s','n'].flatMap(d=>[1,2,3,4].map(i=>`${p}-infant-walk-${d}-${i}`));
 for(const d of ['e','s','n'])ANIMATION_CLIPS[`${p}-infant-walk-${d}`]={frames:[1,2,3,4].map(i=>({sprite:`${p}-infant-walk-${d}-${i}`,duration:230})),loop:true,authored:true,motion:'none'};
}
SHEETS['wagon-cover-drawn-back']=[1,2].flatMap(i=>['e','w','s','n'].map(d=>`wagon-open-cover-${d}-${i}`));
for(const d of ['e','w','s','n'])ANIMATION_CLIPS[`wagon-open-cover-${d}`]={frames:[1,2].map(i=>({sprite:`wagon-open-cover-${d}-${i}`,duration:400})),loop:true,authored:true,motion:'none'};
export const promptEntries=[
  {
    "sheet": "adult-passengers-cast1",
    "promptId": "frontier-v1/adult-passengers-cast1",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Use case stylized-concept. Transparent production game atlas EXACT FOUR columns SIX rows 24 fullbody SEATED passenger sprites. Match reference cast identities warm brown outlined handpainted frontierstorybook style. Columns identities in this order: rust: bearded man brown hat rust shirt tan trousers; teal: brown bun teal blouse ochre skirt cream apron; elder: darkskin grey beard tan hat creamshirt olivevest browntrousers; blue: curlybrownhaired youth blue shirt tan trousers. Rows1/2 EAST rightprofile pose1/2, rows3/4 SOUTH front pose1/2, rows5/6 NORTH rear pose1/2. Each person sits on INVISIBLE bench knees bent feet dangling, hands resting lap then gently adjusting lap with subtle torso shift; no reins. Fully seated not standing squatting kneeling. Fullheadfeet visible. Each identity consistent size clothes hair across directions; backs show backofhead not face. Central50percentwidth55percentheight each equalcell with60px alpha0clear gutters, exactly24 sprites no scene seat wagon horse shadows text labels grid. Correct modest1830s clothes. Two meaningfully different hand/torso poses per heading, keep hipposition same. Reference costumes EXACT.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "refinements": [
      {
        "prompt": "Precise correction of atlas. Keep all24 poses costumes layout headings. ALSO uniformly SHRINK every whole figure to68percent CURRENTsize and recenter each insideitsORIGINALequalcell. Keep exact grid originalnumberrowscolumns, identity color age pose variations detail. Allvisiblepixels onlycentral60percentcellwidthheight, minimum60px trulyalpha0gutters outeredgesandallseams. NO croppingfeet hats or infant, nogroundshadow labels grid background. Preserve meaningfullydifferent hand/leg poses. Transparent PNG."
      }
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/adult-passengers-cast1.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f65e91b3-d690-4e3b-a585-6ec349a71cad.png",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-7bd3b283-e16c-4773-b8cf-8a2bf2dbf3cd.png"
  },
  {
    "sheet": "adult-passengers-cast2",
    "promptId": "frontier-v1/adult-passengers-cast2",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Use case stylized-concept. Transparent production game atlas EXACT FOUR columns SIX rows 24 fullbody SEATED passenger sprites. Match reference cast identities warm brown outlined handpainted frontierstorybook style. Columns identities in this order: rust-woman: bonnet rustblouse ochre skirt cream apron; indigo: brown bun indigo dress cream neck scarf; ochre: brownhaired youth ochre shirt brown vest greytrousers; blue-girl: dark braid blue dress creamapron. Rows1/2 EAST rightprofile pose1/2, rows3/4 SOUTH front pose1/2, rows5/6 NORTH rear pose1/2. Each person sits on INVISIBLE bench knees bent feet dangling, hands resting lap then gently adjusting lap with subtle torso shift; no reins. Fully seated not standing squatting kneeling. Fullheadfeet visible. Each identity consistent size clothes hair across directions; backs show backofhead not face. Central50percentwidth55percentheight each equalcell with60px alpha0clear gutters, exactly24 sprites no scene seat wagon horse shadows text labels grid. Correct modest1830s clothes. Two meaningfully different hand/torso poses per heading, keep hipposition same. Reference costumes EXACT.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "refinements": [
      {
        "prompt": "Precise correction of atlas. Correct ROW4 columns3and4 to SOUTH/front view ochre boy and bluegirl exactly like row3 but hands subtly shifted. Currently row4 mistakenly rear view. Rows3AND4 ALLFOUR frontview. Rows5AND6 allrear. Keeprows1/2 allEast. ALSO uniformly SHRINK every whole figure to68percent CURRENTsize and recenter each insideitsORIGINALequalcell. Keep exact grid originalnumberrowscolumns, identity color age pose variations detail. Allvisiblepixels onlycentral60percentcellwidthheight, minimum60px trulyalpha0gutters outeredgesandallseams. NO croppingfeet hats or infant, nogroundshadow labels grid background. Preserve meaningfullydifferent hand/leg poses. Transparent PNG."
      }
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/adult-passengers-cast2.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-84f90eb0-ec2b-4646-8d42-54df8809ccf7.png",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-52203e50-01ba-4942-a718-7eb614574965.png"
  },
  {
    "sheet": "family-infant-walk-rust-woman",
    "promptId": "frontier-v1/family-infant-walk-rust-woman",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Use case stylized-concept. Production transparent game atlas EXACT FOUR columns THREE rows TWELVE fullbody walking-with-infant composite sprites. Match firstrow bonnet rustblouse ochreskirt creamapron woman identity fromreference EXACT costumes face style. Warm brown outlined softly handpainted frontierstorybook 1835 game. ONE caregiver gently cradles ONE tiny swaddled infant safely in BOTH forearms across chest, head supported visible tiny head wrappedcream cloth. Infant moves witharms not floating. ROW1 EAST rightprofile FOURwalk footfall phases leftstride gather rightstride oppositegather. ROW2 SOUTH front FOURsamewalkphases. ROW3 NORTH rear FOURsamewalkphases: backofhead/hair and backofclothes; baby's little wrappedhead/cloth peeksnaturallybeside shoulder arm not through torso. Do not invent backpack or shoulder-carry. Hands support head/body throughout, armpositionsteady, legs clearly alternate, dresshem moves. Entire person+baby central50percentwidth60percentheight of each equalcell with65px transparentgutters everyseam outside. Fullhat hairhands feet baby unclipped. Exactly12sprites. No grid text ground castshadow scenery wagon otherperson. Genuinealpha0 outside silhouette. West mirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "refinements": [
      {
        "prompt": "Precise correction of atlas. Correct ROW1 columns3AND4 to EAST/right profile same ascols1/2; allFOUR topframes walkRIGHT with alternatingfootfalls notleft/back. ROW2 allfront row3allback unchanged. ALSO uniformly SHRINK every whole figure to68percent CURRENTsize and recenter each insideitsORIGINALequalcell. Keep exact grid originalnumberrowscolumns, identity color age pose variations detail. Allvisiblepixels onlycentral60percentcellwidthheight, minimum60px trulyalpha0gutters outeredgesandallseams. NO croppingfeet hats or infant, nogroundshadow labels grid background. Preserve meaningfullydifferent hand/leg poses. Transparent PNG."
      },
      {
        "prompt": "Correct ONLY TOP ROW COLUMN3: flip the entire figure horizontally so she faces RIGHT/EAST like other three topframes. Her nose must pointRIGHT. Her baby heldinfront/right. Keep allother11 exact same figures. No left-facing figure anywhere. Keep4col3rows andgenuinealpha0gutters."
      }
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/family-infant-walk-rust-woman.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-273e7e09-2e87-4b47-a164-6c21d462fbde.png",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-b8beeed1-e4a5-46e5-9795-820a1773df78.png"
  },
  {
    "sheet": "family-infant-walk-indigo",
    "promptId": "frontier-v1/family-infant-walk-indigo",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Use case stylized-concept. Production transparent game atlas EXACT FOUR columns THREE rows TWELVE fullbody walking-with-infant composite sprites. Match secondrow indigo longdress creamneckscarf brown bun woman identity fromreference EXACT costumes face style. Warm brown outlined softly handpainted frontierstorybook 1835 game. ONE caregiver gently cradles ONE tiny swaddled infant safely in BOTH forearms across chest, head supported visible tiny head wrappedcream cloth. Infant moves witharms not floating. ROW1 EAST rightprofile FOURwalk footfall phases leftstride gather rightstride oppositegather. ROW2 SOUTH front FOURsamewalkphases. ROW3 NORTH rear FOURsamewalkphases: backofhead/hair and backofclothes; baby's little wrappedhead/cloth peeksnaturallybeside shoulder arm not through torso. Do not invent backpack or shoulder-carry. Hands support head/body throughout, armpositionsteady, legs clearly alternate, dresshem moves. Entire person+baby central50percentwidth60percentheight of each equalcell with65px transparentgutters everyseam outside. Fullhat hairhands feet baby unclipped. Exactly12sprites. No grid text ground castshadow scenery wagon otherperson. Genuinealpha0 outside silhouette. West mirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/family-infant-walk-indigo.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-2f433ced-f639-4ea5-9e8a-783a1a1b0100.png"
  },
  {
    "sheet": "family-infant-walk-ochre",
    "promptId": "frontier-v1/family-infant-walk-ochre",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Use case stylized-concept. Production transparent game atlas EXACT FOUR columns THREE rows TWELVE fullbody walking-with-infant composite sprites. Match thirdrow brownhaired ochreshirt brownvest greytrousers youth identity fromreference EXACT costumes face style. Warm brown outlined softly handpainted frontierstorybook 1835 game. ONE caregiver gently cradles ONE tiny swaddled infant safely in BOTH forearms across chest, head supported visible tiny head wrappedcream cloth. Infant moves witharms not floating. ROW1 EAST rightprofile FOURwalk footfall phases leftstride gather rightstride oppositegather. ROW2 SOUTH front FOURsamewalkphases. ROW3 NORTH rear FOURsamewalkphases: backofhead/hair and backofclothes; baby's little wrappedhead/cloth peeksnaturallybeside shoulder arm not through torso. Do not invent backpack or shoulder-carry. Hands support head/body throughout, armpositionsteady, legs clearly alternate, dresshem moves. Entire person+baby central50percentwidth60percentheight of each equalcell with65px transparentgutters everyseam outside. Fullhat hairhands feet baby unclipped. Exactly12sprites. No grid text ground castshadow scenery wagon otherperson. Genuinealpha0 outside silhouette. West mirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/family-infant-walk-ochre.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-e80c119a-b929-41c6-adad-117fc87adac6.png"
  },
  {
    "sheet": "family-infant-walk-blue-girl",
    "promptId": "frontier-v1/family-infant-walk-blue-girl",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Use case stylized-concept. Production transparent game atlas EXACT FOUR columns THREE rows TWELVE fullbody walking-with-infant composite sprites. Match fourthrow brown braid bluedress creamapron adolescent identity fromreference EXACT costumes face style. Warm brown outlined softly handpainted frontierstorybook 1835 game. ONE caregiver gently cradles ONE tiny swaddled infant safely in BOTH forearms across chest, head supported visible tiny head wrappedcream cloth. Infant moves witharms not floating. ROW1 EAST rightprofile FOURwalk footfall phases leftstride gather rightstride oppositegather. ROW2 SOUTH front FOURsamewalkphases. ROW3 NORTH rear FOURsamewalkphases: backofhead/hair and backofclothes; baby's little wrappedhead/cloth peeksnaturallybeside shoulder arm not through torso. Do not invent backpack or shoulder-carry. Hands support head/body throughout, armpositionsteady, legs clearly alternate, dresshem moves. Entire person+baby central50percentwidth60percentheight of each equalcell with65px transparentgutters everyseam outside. Fullhat hairhands feet baby unclipped. Exactly12sprites. No grid text ground castshadow scenery wagon otherperson. Genuinealpha0 outside silhouette. West mirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/family-infant-walk-blue-girl.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-1fee7f6e-1d35-4f91-a5ab-f9f3962bb2ca.png"
  },
  {
    "sheet": "family-infant-walk-rust",
    "promptId": "frontier-v1/family-infant-walk-rust",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Use case stylized-concept. Production transparent game atlas EXACT FOUR columns THREE rows TWELVE fullbody walking-with-infant composite sprites. Match firstrow beardedbrownhaired man tanhat rustshirt tantrousers boots identity fromreference EXACT costumes face style. Warm brown outlined softly handpainted frontierstorybook 1835 game. ONE caregiver gently cradles ONE tiny swaddled infant safely in BOTH forearms across chest, head supported visible tiny head wrappedcream cloth. Infant moves witharms not floating. ROW1 EAST rightprofile FOURwalk footfall phases leftstride gather rightstride oppositegather. ROW2 SOUTH front FOURsamewalkphases. ROW3 NORTH rear FOURsamewalkphases: backofhead/hair and backofclothes; baby's little wrappedhead/cloth peeksnaturallybeside shoulder arm not through torso. Do not invent backpack or shoulder-carry. Hands support head/body throughout, armpositionsteady, legs clearly alternate, dresshem moves. Entire person+baby central50percentwidth60percentheight of each equalcell with65px transparentgutters everyseam outside. Fullhat hairhands feet baby unclipped. Exactly12sprites. No grid text ground castshadow scenery wagon otherperson. Genuinealpha0 outside silhouette. West mirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/family-infant-walk-rust.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f5ec218b-9d94-4bff-a63c-ad6baa87fde9.png"
  },
  {
    "sheet": "wagon-cover-drawn-back",
    "promptId": "frontier-v1/wagon-cover-drawn-back",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Use case stylized-concept. Transparent production game atlas FOUR columns TWO rows EIGHT complete wooden FOUR-WHEEL wagon vehicle sprites WITHOUT ox people cargo. Warmbrown inked softpainted1835frontier style EXACT referencewagon brownwood ironrimspokes creamcanvas. Cover PULLED BACK AND TIED toward front over driver leaving REAR TWO THIRDS bed OPEN visible for passengers. No intactopaque roof coveringrear. Columns EAST/right elevatedprofile, WEST/left elevatedprofile, SOUTH towardviewer front, NORTH awayviewer rear. ROW1 pose1 wheelsnormal clothfolds; ROW2 pose2 samevehicles wheelsrotated subtle tiedcanvas foldmotion. Fullvehicle withtongue wheels openbed lowtailgate intact. NORTH rear opening fully shows barebed clearspace for seatedpeople, tiedcanvas bunchatfarfront. SOUTH front canvasbunchpartial uppersection leavesbackbed glimpse. ONEwoodenwagonnooxhorseteam. Fullsilhouettecentral55percentwidth55percentheightowncell hugealpha0gutters80px everyseam nooverlap. Exactly8sprites, consistentgeometry/sizeperheading. No labels grid background groundshadow.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/wagon-rig.png"
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/wagon-cover-drawn-back.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-72e09256-bede-4534-84bb-49bc57ade679.png",
    "refinements": [
      {
        "prompt": "Correct canvasposition ONLY all8wagonframes. The entire cover mustbe folded and tied intoa smallbunch on FRONT hoop overdriver nearesttongue, leaving rearTWO-THIRDS open uncoveredbarebed. Sideviews show smallcreamcanvasfront at tongue/rightforEast andtongue/leftforWest, EMPTYrearbedclearlyopen. NORTH/rearview sees allbarewoodfloor withcanvasbunch farfront/top NOT a roofcurtainovertailgate. SOUTH/frontview sees frontsmallcanvasbunch withuncoveredrearbedbeyond throughopening. No completehood/coveredarchoverrear, no opaqueinnerblackbox. Keep exact4col2rows directionswoodwheels anddistinctposes. Shrink every completevehicle to70percentcurrent andcentereachowncell toleave60pxalpha0gutterallseams. Nooxpeoplegroundshadowtext."
      }
    ],
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-66cf2fe6-7c2f-4378-8f81-256df7f5c981.png"
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['116 new frames and 43 authored clips close the September 25 riders/walkers/cart artwork: eight adult passenger identities, five required infant carriers, and four rolled-back cover headings. West carrier/passenger views mirror east. Cover vehicles require compositor seat/rail registration before production adoption.'];

export const SHEETS={},ANIMATION_CLIPS={};
for(const d of ['e','s','n']){
 SHEETS[`ox-wagon-composite-${d}`]=['empty','loaded'].flatMap(state=>[1,2,3,4].map(i=>`ox-wagon-${state}-${d}-${i}`));
 for(const state of ['empty','loaded'])ANIMATION_CLIPS[`ox-wagon-${state}-${d}`]={frames:[1,2,3,4].map(i=>({sprite:`ox-wagon-${state}-${d}-${i}`,duration:300})),authored:true,loop:true,motion:'none',direction:d==='e'?'east; west by mirroring':d==='s'?'south':'north'};
}
SHEETS['people-child-wagon-drivers']=['s','e','w','n'].flatMap(d=>['girl','boy'].flatMap(f=>[1,2].map(i=>`${f}-wagon-driver-${d}-${i}`)));
for(const d of ['s','e','w','n'])for(const f of ['girl','boy'])ANIMATION_CLIPS[`${f}-wagon-driver-${d}`]={frames:[1,2].map(i=>({sprite:`${f}-wagon-driver-${d}-${i}`,duration:600})),authored:true,loop:true,motion:'none',direction:{s:'south',e:'east',w:'west',n:'north'}[d]};
export const promptEntries=[
  {
    "sheet": "ox-wagon-composite-e",
    "promptId": "frontier-v1/ox-wagon-composite-e",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production transparent game atlas EXACT FOUR columns TWO rows, EIGHT complete composite OX AND COVERED WAGON rigs, all facing EAST/right elevated sideview. Warm brown hand-inked soft painted frontier1835 style matching references. One single brown OX attached by visible WOODEN NECK YOKE and rigid WAGON TONGUE directly behind it to ONE brown wooden FOUR WHEEL wagon cream canvas hoops. No horse, no second ox, no driver. Ox forward/right; wagon behind/left. Tongue continuous connected yoke-to-frontaxle, yoke across neck shoulder, not hanging leash or gap. Wheels full wooden spokes iron rims aligned under box two axles no magical extra wheels. ROW1 EMPTY covered wagon: empty interior glimpse through rear opening, canvas intact cream and taut. ROW2 LOADED same wagon: visible sacks crate and barrel safely in rear opening under same intact cream canvas, tied with rope, not extra roof pile. Four columns SAME rig identity/size with different WALK leg footfalls and rotated wheel spoke angles, steady yoke/tongue attachment all phases and minimal cloth sway. Full ox hornsnoselegs hooves, tongue wholewagon allwheels and canvas in each independent cell. Whole composite CENTRAL60percentwidth55percentheight of each cell, wide genuine alpha0 gutters outeredges/seams, no overlaps crop grid text castshadows background ground dust modern gear. Exactly8 separate fullrigs.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/wagon-rig.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/animal-stock.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ed32a027-6d8f-45cb-951b-2ebab06f1cbf.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/ox-wagon-composite-e.png",
    "postProcessing": "None; selected PNG copied unchanged; read-only alpha audit.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-351b6de5-3e34-4119-8104-b7e9db02034d.png",
    "refinements": [
      {
        "prompt": "Correct ONLY size and transparent separation of eight complete east-facing ox-and-wagon rigs. Keep FOUR columns TWO rows, empty row1 loaded row2 and every unique leg/wheel pose exactly. Each complete rig including all horns tail wheels canvas tongue must be uniformly reduced to 62% current size and centered independently in its equal cell. At least 65px clear alpha-zero gutter on EVERY vertical seam and outside edges; no touching neighboring frame. Preserve wood neck yoke-to-tongue connection, loaded cargo and painted style. No added shadow text background or cropped horn/wheel."
      }
    ]
  },
  {
    "sheet": "ox-wagon-composite-n",
    "promptId": "frontier-v1/ox-wagon-composite-n",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Create NORTH (straight away from camera/upimage) version of exact OX-WAGON rig reference. Transparent PNG exactly FOUR columns TWO rows EIGHT fullrigs. ROW1 empty creamcoveredwagon; ROW2 samewagonloaded barrelcrate sacks clearly visible through OPEN REAR canvas doorway facingviewer. Do not close rear withsolidtailgate; goodsunder intactcreamcover. ONE brownox aheadbehindwagon in distance, hindquarters/backhorns visible beyondwagon at top. One continuousrigid wooden TONGUE connects frontaxle to wooden neckyoke across ox'sneck; centralperspective hidesparttongue naturally. Wagon REAR facesviewer showing squaretailgate lowerhalf andarchedcanvasopening above, rearwheels at left/right, farfrontwheels perspective. NO sidewayswagon or sidewaysox. Allwholevehicle straightNORTH, fourcolumns differentoxwalkfootfalls rotatedwagonspokes andminimalclothsway, sameidentitymechanics/scale. Calm walking; frame1left-hindforward,2gather,3right-hindforward,4oppositegather. No driverpeople, no extra oxen no horse. Warm outlinedpainted frontiergame matchingreference exact woodcanvasoxcolors. Everyfullcomposite in central55percentwidth65percentheight owncell,minimum70px genuinealpha0gutters allseamsouteredges. No groundshadowsgridtext crop overlap landscape.",
    "referenced_image_paths": [
      "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-351b6de5-3e34-4119-8104-b7e9db02034d.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f7d12166-b87e-4d53-aa48-6c9e35a7edf0.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/ox-wagon-composite-n.png",
    "postProcessing": "None; selected PNG copied unchanged; read-only alpha audit.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a3ea3caa-b598-4218-b10d-f6563c6e13dd.png",
    "refinements": [
      {
        "prompt": "Correct mechanical occlusion in this exact eight-frame NORTH-facing ox-wagon atlas. Ox is AHEAD of wagon, beyond far/front axle, so its legs CANNOT appear below the REAR tailgate nearest viewer. REMOVE the brown ox hoof/leg currently dangling underneath every rear tailgate; retain rearwagon axle/wheels. Show ox walk hoof changes only at far TOP beyond wagon, subtly left/right of ox body where actually visible; legs behind canvas are OCCLUDED, never below wagonrear. Keep ox ahead pointingaway, continuous tongue/yoke as shown, emptyrow1 loadedrow2 reararchgoods unchanged. Four walk phases tail/visiblefarleg changes and wheelspoke rotations remain distinct. Also shrink each complete rig to76percent current size independently centered own originalcell, fourcolumns tworows largealpha0outerandseamgutters. No newbackgroundshadowslabels or people. Exact 8 whole mechanicallycorrect rigs."
      }
    ]
  },
  {
    "sheet": "ox-wagon-composite-s",
    "promptId": "frontier-v1/ox-wagon-composite-s",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Productiongame transparent atlas FOUR columns TWOrows EIGHT OX-and-coveredwagon whole connectedrigs all facing SOUTH directlytowardviewer/downscreen. Reference exact identitycreamcanvas brownwood wagonONEbrownox. Row1 EMPTY wagon visible throughfrontarch behindemptyseat, row2LOADED sackscratebarrel visibleinsidefrontarch behindemptyseat. OX FACEHEAD towardviewer, horns symmetric both eyes visible; yoke restsacrossneckbehindhead withbowsecuringneck, rigidwoodentongue extendsfromwagonfrontaxle to yoke behindox, mechanicallyconnected. Wagonfront facingviewer behindox, frontbench EMPTY visibleunderfrontarchedcreamcanvasopening, fourwheels twoatfrontleft/right twofarrearpartlyhidden. Keep oxfront/body fullyinfront ofwagon withrealclearance tongue, never wagoncutintobody. ONEox ONLY nopeople. Fourcolumns distinctslowwalk footfalls alternatingfrontlegs rotatedspokewheels samebody sizecolorsshape no morph. Allsame Southcamera no sideprofile. Warmbrownoutlined mutedpaintedgame style reference. EACHwholecomposite fitsCENTRAL55percentwidth65percentheight owncell with80px fullyalpha-zero gutters allseamsouteredges. No grid labels landscape shadow cropoverlap moderngear extraox/person.",
    "referenced_image_paths": [
      "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-351b6de5-3e34-4119-8104-b7e9db02034d.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-c517d041-459c-4b3e-9a90-c55f286f81e0.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/ox-wagon-composite-s.png",
    "postProcessing": "None; selected PNG copied unchanged; read-only alpha audit."
  },
  {
    "sheet": "people-child-wagon-drivers",
    "promptId": "frontier-v1/people-child-wagon-drivers",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent production game sprite atlas EXACT FOUR columns FOUR rows,16 seated CHILD DRIVER layers ONLY, no wagon ox seat bench ground. Reference1 style/POSE ONLY (adolescent driver example); reference2 child's exact identity clothing/proportions. Each ROW two poses GIRL cols1/2, BOY cols3/4. ROW1 SOUTH camera front chest; ROW2 EAST rightprofile; ROW3 WEST leftprofile (independently painted); ROW4 NORTH away back. GIRL darkbrown braid terracotta dress creamapron brown shoes, schoolage child proportion notadult. BOY blond creamshirt suspenders brown rolledshorttrousers barefoot schoolage proportion. All sit with kneesbent feet hanging boots/feet intact, hip seated at consistentheight. Two poses peridentity/heading:1 hands gently holding darkbrown coiledlines and short wooden oxgoad angleddown,2 small reinhandadjustment and slightly liftedshortgoad, calm not lashing. Lineends terminate loose near hands, actualattachment callercomposited. No longline crossingcells. Full headbraid handslegsfeetgoadallvisible. Warm darkbrown ink paintedmuted game style same references. Entirelayercentral50percentwidth60percentheight owncell with generous alpha0 gutters allseamsouteredges. No textgrid groundshadow weaponsbackground missingfeet or grownface. Exactly16 separate childlayers. No toddler/infant driving.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/cast2-drivers-youth.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-4830f605-fc31-409e-a656-72c39e6f4d2a.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-child-wagon-drivers.png",
    "postProcessing": "None; PNG copied unchanged; read-only alpha audit."
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['40 frames and 14 authored clips finish September 16 wagon artwork. School-age driver layers bind existing renderer; whole connected rig needs explicit seat/occlusion compositor migration. Toddlers/infants use delivered passenger art, not driver layers; server ten-year eligibility unchanged.'];


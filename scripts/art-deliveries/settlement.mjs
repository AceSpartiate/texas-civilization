export const SHEETS={
  'houses-settling':['round-log','hewn-log','dog-run','jacal'].flatMap(h=>['-site','-walls','-roofing',''].map(s=>`house-${h}${s}`)),
  'animal-stock':['cattle-longhorn-red','cattle-longhorn-pied','cattle-longhorn-dun','hog'].flatMap(a=>[1,2,3,4].map(n=>`${a}-${n}`)),
  'home-furnishings':['home-table','home-bench','home-bedstead','home-shelves','home-cradle','home-bedding','home-iron-pot','home-chest','home-spinning-wheel','home-books','home-mosquito-bars','home-tinware','home-chair-packed','home-chair','home-chest-open','home-stool'],
  'home-interiors':['interior-round-log','interior-hewn-log','interior-dog-run','interior-jacal'],
};
export const ANIMATION_CLIPS={};
const clip=(id,frames,duration,loop=true,motion='none')=>ANIMATION_CLIPS[id]={frames:frames.map(sprite=>({sprite,duration})),loop,authored:new Set(frames).size>1,motion,direction:'east; west by mirroring'};
for(const animal of ['cattle-longhorn-red','cattle-longhorn-pied','cattle-longhorn-dun','hog']){
  clip(`${animal}-idle`,[`${animal}-1`],2200,true,'breathe');
  clip(`${animal}-${animal==='hog'?'root':'graze'}`,[1,2,3,4,3,2].map(n=>`${animal}-${n}`),850);
}
clip('home-chest-opening',['home-chest','home-chest-open'],500,false);
clip('home-cradle-rock',['home-cradle'],2000,true,'rock');
export const notes=['House stages and all interiors/furnishings are presentation pieces. No construction, furnishing or animal outcomes are caused by animation.'];

export const promptEntries=[
  {
    "sheet": "houses-settling",
    "promptId": "frontier-v1/houses-settling",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate with alpha-extraction edits",
    "prompt": "Use case historical-scene. Produce a production game sprite atlas, square1254x1254, exactly4columns x4rows, sixteen separate sprites with generous transparent gutters, REAL transparent RGBA alpha (never painted checkerboard), no labels, borders, people or backgrounds. Style reference attached: match warm outlined frontier-v1 miniature buildings, dark earthy outlines, weathered wood/ochre mud, simple illustrative shading. Same slightly elevated front-and-right-side view. EVERY ROW depicts ONE specific house through construction, same world footprint, doorway position and baseline in all4cells. Column1 cleared construction footprint with stacked appropriate timber/posts, no house; column2 half-height walls with door gap; column3 full walls plus rafters partly covered by roof; column4 finished house. Keep house footprint size and perspective identical across the row; do NOT enlarge early low stages to fill their cells. Four rows: 1 single-pen ROUND unhewn bark-on logs, saddle-notched corners, chinked gaps, one door and tiny window, exterior stick-and-mud chimney at RIGHT gable, split clapboard roof with long weight poles across it; 2 single-pen HEWN flat squared logs, tight corners, same kind of stick-and-mud chimney and weight-pole clapboard roof, visibly more finished; 3 DOG-RUN two separate log pens under a single long roof, a clearly OPEN wide roofed central breezeway, chimney at EACH outer gable, each pen has door opening toward front, NEVER close the central passage with a wall or door; 4 JACAL narrow rectangular hut about10feetby20feet, upright earth-set posts and stick walls daubed in mud with some sticks showing, pitched straw THATCH roof, one little door and window, no log courses, no chimney. Show the four rows at coherent model scale with dog-run broader than singlepen and jacal narrow. No stone chimneys, brick, porch railings, modern shingleuniformity, European fantasy, grass islands or decorative furniture. Complete objects inside cells and at least12px clearance from all cell edges. These sprites will be individually cut and used at construction thresholds.",
    "correctionPrompts": [
      "Edit this production sixteen-sprite atlas ONLY to remove the entire gray/white checkerboard and replace it with genuinely transparent alpha pixels. Preserve all sixteen drawings, 4x4 reading order, dimensions, colours, materials, perspectives and positions exactly. Remove checkerboard inside gaps too. Output an actual 8-bit RGBA transparent PNG, not a picture of checkerboard, no opaque matte, no halo. Do not rearrange or redraw the houses. Retain the source ground footprints under each building as part of the sprite; only erase background.",
      "Make the background transparent. Remove every gray and white checkerboard square. Keep all sixteen house drawings unchanged. Return a transparent PNG with no background."
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3ad98537-aea1-4c7a-8f10-87fb808e9706.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/houses-settling.png",
    "postProcessing": "None. Original PNG copied unchanged; alpha measured only.",
    "review": "Four layouts through site/walls/roofing/finished. Earlier painted checkerboards rejected. Source stages retain row reference height."
  },
  {
    "sheet": "animal-stock",
    "promptId": "frontier-v1/animal-stock",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate with spacing correction edit",
    "prompt": "Historical-scene production game sprite atlas1254x1254, exactly4columns4rows, sixteen isolated figures. Genuine RGBA transparent background with no checkerboard or solid background, no scenery/text/labels/ground/shadows. Warm outlined rustic illustrated farm-game art, dark earthy brown contours, small readable shading, slight elevated sideview facingEAST. Each row SAME individual animal four grounded poses at identical size and baseline. Row1 Texas longhorn cattle reddish-brown coat with pale underbelly and long outwardcurving horns: neutral idle headup, lower headhalfway, grazing muzzle down, grazing slightneckshift. Row2 same longhorn type dark brown/white piebaldcoat: same4poses. Row3 same longhorntype duncreamcoat: same4poses. Row4 lean darkcharcoal/brown earlyfrontier hog with bristledback, long snout, narrowbody, small ears (not pink modern pig): neutralidle, loweringsnout, rootinggroundsnoutleft, rootinggroundsnoutright. Hooves planted across allposes; no sliding no growth. Each completefigure fitsinside its equalcell with generous20pxgutters; horns/tailsnotcroppedoroverlap. Appropriate 1835 Texas livestock illustrations, not claimof documented individual breed pedigree. No ox yoke or cart. Cohesive gameassets not photoreal.",
    "correctionPrompts": ["Edit this 4x4 sprite atlas only for safe spacing. Keep all sixteen complete animals and poses in the same order. Shrink each entire animal uniformly to 80% of its current size, centered in its own cell. All horns, tails and hooves must be fully inside their individual cell with at least 24 pixels of transparent margin. Preserve warm outlined art, colors, three longhorn coats and hog, all four grazing poses, exact square canvas and genuinely transparent RGBA background. No checkerboard. No new poses or text."],
    "correctionReferencePaths": ["C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-7701e17e-d425-41de-972d-b340bbd19e0b.png"],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-9542aa4a-4af2-4082-8377-633139f54ec4.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/animal-stock.png",
    "postProcessing": "None. Original PNG copied unchanged; alpha measured only.",
    "review": "Three longhorn coats and lean bristled hog. Generic period livestock; idle and grazing/rooting key poses. Corrected spacing passes all sixteen frame bounds with zero trimmed pixels, 76.5106% fully transparent pixels and transparent corners. Prior source withheld for horn overlap."
  },
  {
    "sheet": "home-furnishings",
    "promptId": "frontier-v1/home-furnishings",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Historical-scene. Original production sprite atlas for Texas1835 illustrated family game. Warm earthy outlined storybook farm-game style, dark brown contours, ochre weathered wood and cream cloth, slight elevated front-right view, upperleft lighting, recognizable miniature silhouettes, no photoreal. Square1254x1254 exactly4columns4rows, each separate fullobject centered in equalcell with20pxemptygutters, TRUE TRANSPARENT RGBA background, NO checkered pattern, text, borders, floor patches, ground shadows, people, weapons or modern machines. Reading order: row1 rustic plank table; low backless wooden bench; plain rope-bottom wooden bedstead with cream straw mattress; rough wooden wall shelving unit with three shelves. Row2 wooden rocking CRADLE for infant with curved runners and cream cloth inside, no infant; rolled bedding and pillow; black iron cooking pot with bail; big plain closed pine chest with iron hinges. Row3 simple flax spinning wheel on wooden frame with separate visible large wheel and treadle; small stack of worn leatherbound books with no legible titles; folded cream mosquito net with hanging cord; grouped plain tin cup/plate/small kettle. Row4 wooden chair in pieces tied in a bundle for wagon transport; assembled plain ladderback chair; open version of row2 closed chest with same proportions and lid open; low wooden stool. Basic functional period objects with restrained detail, no ornamental Victorian furniture, clock, mirror, rocking adultchair, china crockery. The atlas is modular furnishing artwork, no composed room background. Make each item clearly separate, upright with base centered at85percentcellheight.",
    "correctionPrompts": [],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-050933fd-b122-4c25-8e90-12ed91d8d485.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/home-furnishings.png",
    "postProcessing": "None. Original PNG copied unchanged; alpha measured only.",
    "review": "Uses updated SETTLING_IN goods (books, mosquito bars, tinware, packed chair), not superseded clock/mirror/china. No furniture gameplay implied."
  },
  {
    "sheet": "home-interiors",
    "promptId": "frontier-v1/home-interiors",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create a 1254x1254 transparent game art atlas with exactly four separated cutaway house interiors in a 2x2 grid. Warm outlined rustic Texas1835 farm-game art, earthy brown log walls, ochre dirt floors, slight elevated front-right view, match the frontier-v1 buildings. True transparent alpha outside each room, no checkerboard, labels, furniture, people or shadows outside the room. Top left single-pen round-log cabin, square room, dirt floor, back and left walls visible with tinywindow and plainfireplace; front/right walls cut to low sills. Top right single-pen hewn-log cabin, square room with flat hewnlog back/leftwalls, dirt floor, tinywindow and plainfireplace, front/right cut to low sills. Bottom left dog-run house two separate square log rooms flanking an OPEN roofless central breezeway, all unfurnished, low cutaway frontwalls, fireplaces at outerends. Bottom right narrow rectangular jacal interior with upright stick-and-mud walls, dirtfloor, tinywindow, nofireplace; back/left walls visible and front/rightlow. No roofs. Each complete room fits its quadrant with generous empty40pxgutters. Keep empty floor space legible for placing separate furniture and moving gamecharacters. These are schematic interior art components, not exactsiteplans.",
    "correctionPrompts": [],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-96090d44-331e-4a7c-a71d-3cbbfcbf1a41.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/home-interiors.png",
    "postProcessing": "None. Original PNG copied unchanged; alpha measured only.",
    "review": "Schematic cutaway room plates. Independent furniture placement and navigation need geometry. Generic fireplace finish does not choose an exterior construction method."
  }
];
export const provenanceEntries=promptEntries;

const figures=['girl','boy','smallchild-with-caregiver','infant-with-caregiver'];
export const SHEETS={},ANIMATION_CLIPS={};
for(const d of ['e','s','n']){
 SHEETS[`people-mounted-children-${d}`]=figures.flatMap(f=>[1,2,3,4].map(i=>`${f}-ride-${d}-${i}`));
 for(const f of figures)ANIMATION_CLIPS[`${f}-ride-${d}`]={frames:[1,2,3,4].map(i=>({sprite:`${f}-ride-${d}-${i}`,duration:230})),authored:true,motion:'none',loop:true,direction:d==='e'?'east; west by mirroring':d==='s'?'south':'north'};
}
export const promptEntries=[
  {
    "sheet": "people-mounted-children-e",
    "promptId": "frontier-v1/people-mounted-children-e",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + spacing correction",
    "prompt": "Create a production transparent PNG game sprite atlas, exactly FOUR columns and FOUR rows, 16 complete independent horse-and-rider composites. Reference1 gives CHILD IDENTITIES ONLY. Reference2 gives painted game STYLE and CHESTNUT HORSE/saddle proportions. All horses face EAST (right), slight elevated sideview, each same chestnut horse dark mane/tail, brown tack, walking at a calm four-beat WALK. Columns four distinct authored footfalls: left fore extended/right hind forward; gathered; opposite fore extended; opposite gathered, reins and cloth subtly follow. ROW1 school-age GIRL from reference: dark brown braid, terracotta dress with cream apron, small child proportions, sits astride modest draped skirt on saddle, legs visibly shorter than adults. ROW2 school-age BOY blond hair cream shirt brown short trousers suspenders bare feet, unmistakably child, sits astride saddle. ROW3 SMALLCHILD dark hair cream short gown bare feet, much smaller toddler SITS IN FRONT of adult caregiver on same saddle, adult dark-haired woman indigo dress supports toddler with forearm and holds reins, toddler does NOT ride alone. ROW4 INFANT wrapped in cream, dark tiny hair, cradled across lap by same indigo-dressed dark-haired adult woman, one arm supporting head/body other holding reins; baby does NOT sit upright or ride alone. Same identities unchanged four frames per row, whole horse legs/hooves/tail/ears and whole riders visible. Hand-inked dark warm brown outlines, soft painted muted colors, simple readable shapes same reference, no photorealism or pixel art. Each whole composite fits CENTRAL 65 percent width and 70 percent height of its equal cell, generous genuine alpha-zero gutters all outer edges and EVERY grid seam. No text labels ground shadow landscape grid glow weapons modern equipment or crop. Exactly 16 horse composites no extra people beyond stated passengers/caregivers. Keep horse size identical across rows (do not shrink horse for children).",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-mounted-cast2-e.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-9b01d0b8-a77e-4d3f-afdb-a24426f299d4.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-mounted-children-e.png",
    "postProcessing": "None. Selected PNG copied unchanged; read-only alpha audit.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f8f5bed7-2197-4841-9f17-a38345f8d0ae.png",
    "refinements": [
      {
        "prompt": "Edit only size and spacing of these exact sixteen east-facing family horseback sprites. Preserve every identity, face, clothing, horse, toddler support, infant cradle and distinct walk pose EXACTLY. Shrink each complete horse-and-rider composite uniformly to 72% of its present size, independently centered in its own original equal cell. Keep FOUR columns FOUR rows same order and canvas geometry. Minimum generous 45px fully alpha-zero gutters on all seams and outer boundaries. Do not crop or remove any limb/rein/tail or add shadow/background/text. Transparent RGBA throughout."
      }
    ]
  },
  {
    "sheet": "people-mounted-children-n",
    "promptId": "frontier-v1/people-mounted-children-n",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create NORTH-facing version of reference1's exact family mounted sprite atlas: FOUR columns FOUR rows 16 whole composites. Reference2 is geometry reference ONLY for horse NORTH heading (directly AWAY from viewer, haunches tail toward viewer, rider back, horse head beyond rider). Keep reference1 identities: row1 terracotta apron braided childgirl, row2 blond cream shirt brown trousers barefoot childboy, row3 indigo woman SUPPORTING cream-gowned toddler in front of her, row4 same woman CRADLING swaddled infant securely across lap. Toddler/baby remain visibly child-small, seen partly over/in front of supporting adult; do not put them alone on horses. All horses face straight NORTH, NEVER sideprofile. Four columns genuinely different slow walk footfalls, alternating fore/hind legs with tail sway and minimal rider bounce. Same full sized chestnut horse dark mane/tail brown tack proportions in all rows, no coat changes. Warm hand-inked painted game style identical reference1. Each complete composite central55percentwidth65percentheight of its cell with minimum60px genuine alpha-zero seams and outer gutters. No text landscape shadows grid crop overlap or weapons. Exactly16 independent full horse composites all limbs hooves tails ears reins intact.",
    "referenced_image_paths": [
      "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f8f5bed7-2197-4841-9f17-a38345f8d0ae.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-mounted-cast2-n.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-b5e0e793-40ad-432c-bca8-bd227d3a59a1.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-mounted-children-n.png",
    "postProcessing": "None. Selected PNG copied unchanged; read-only alpha audit."
  },
  {
    "sheet": "people-mounted-children-s",
    "promptId": "frontier-v1/people-mounted-children-s",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create SOUTH-facing version of reference1 family mounted sprite atlas: exactly FOUR columns FOUR rows 16 full composites. Reference2 gives SOUTH camera geometry ONLY: head-on horse FACE toward viewer/downscreen, rider chest front, both horse eyes visible. All horses directly toward viewer, NOT sideprofiles. Rows:1 darkbraided terracotta dress creamapron schoolgirl,2 blond creamshirt brown shorttrousers barefoot schoolboy,3 indigo darkhaired woman SUPPORTING tiny creamgowned toddler seated in FRONT of her with encircling forearm,4 same woman CRADLING cream swaddled infant across lap, head supported. Same child faces/colors reference1. Toddler and baby NEVER alone. Four columns clearly different calm horse WALK footfalls alternating fore/hind hoofpositions, minor cloth/rein follow. Chestnut darkmane/tail brown saddle/tack same full-sized horse throughout. Handinked warmbrown outline and softlypainted muted game style reference1. Each fullcomposite central55percentwidth65percentheight own equalcell, minimum60px fully transparent alpha-zero gutters on EVERY seam and outeredge. No text shadows terrain grid crop overlap weapons or extra riders. Exactly16whole composites.",
    "referenced_image_paths": [
      "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f8f5bed7-2197-4841-9f17-a38345f8d0ae.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-mounted-cast2-s.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-72cdf8d4-865e-4094-9540-3190088b2c3e.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-mounted-children-s.png",
    "postProcessing": "None. Selected PNG copied unchanged; read-only alpha audit."
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['48 frames and 12 authored calm walk cycles complete child/infant horseback artwork. Girl/boy directly bound; smallchild/infant WITH caregiver are explicit two-person scene composites, not automatic family identity substitution. No simulation capacity/eligibility changes.'];


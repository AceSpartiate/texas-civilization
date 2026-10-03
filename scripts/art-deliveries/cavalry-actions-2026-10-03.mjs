export const SHEETS={
  "dragoon-carbine-actions": [
    "dragoon-fire-1",
    "dragoon-fire-2",
    "dragoon-carbine-lower",
    "dragoon-carbine-rest"
  ],
  "lancer-charge": [
    "lancer-charge-1",
    "lancer-charge-2",
    "lancer-charge-3",
    "lancer-charge-4"
  ]
};
export const ANIMATION_CLIPS={
  "dragoon-fire": {
    "frames": [
      {
        "sprite": "dragoon-fire-1",
        "duration": 360
      },
      {
        "sprite": "dragoon-fire-2",
        "duration": 120
      },
      {
        "sprite": "dragoon-carbine-lower",
        "duration": 220
      },
      {
        "sprite": "dragoon-carbine-rest",
        "duration": 300
      }
    ],
    "loop": false,
    "authored": true,
    "motion": "none",
    "direction": "east; west by mirroring"
  },
  "lancer-charge": {
    "frames": [
      {
        "sprite": "lancer-charge-1",
        "duration": 160
      },
      {
        "sprite": "lancer-charge-2",
        "duration": 160
      },
      {
        "sprite": "lancer-charge-3",
        "duration": 160
      },
      {
        "sprite": "lancer-charge-4",
        "duration": 160
      }
    ],
    "loop": true,
    "authored": true,
    "motion": "none",
    "direction": "east; west by mirroring"
  }
};
export const promptEntries=[
  {
    "sheet": "dragoon-carbine-actions",
    "prompt": "Use case historical-scene. Generate a strict 2x2 transparent sprite atlas of exactly FOUR mounted Mexican dragoon carbine firing keyframes for our warm handpainted outlined storybook Texas Revolution game. Match reference bottom row dragoon: dark navy tunic red collar/cuffs white crossed straps white trousers black cavalry boots black crested brass helmet, chestnut horse white blaze navy saddlecloth red piping. Every frame faces EAST/right at slightly elevated 3/4 camera. SAME horse/rider scale, tack, feet ground height within each equal cell. Top left rider shoulders a short flintlock carbine, horse planted. Top right same planted horse rider carbine at shoulder with slight backward recoil, NO drawn flash or smoke (engine supplies). Bottom left rider lowers carbine diagonally safely across lap. Bottom right rider holds carbine low and upright torso settled. Entire horses hooves helmets tails muzzles visible; sprites occupy max75% cell width/height, wide transparent gutters. True alpha backdrop no floor no shadows no words labels grids enemies violence gore. FOUR complete separate sprites not illustration scene. Distinct arm movement across poses, identical anatomy and clothing.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military.png"
    ],
    "promptId": "frontier-v1/dragoon-carbine-actions",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-fe3ea156-6408-43d3-b9b0-bfc3271781ad.png",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-fe3ea156-6408-43d3-b9b0-bfc3271781ad.png",
    "refinements": [],
    "runtimeFile": "public/assets/frontier-v1/atlases/dragoon-carbine-actions.png",
    "postProcessing": "None; PNG copied unchanged.",
    "review": "Original interpretive costume and horse; modest authored keyframes. No graphic injury or weapon impact. West mirrors east. Mounting and cardinal transitions remain outstanding."
  },
  {
    "sheet": "lancer-charge",
    "prompt": "Generate strict 2x2 transparent sprite atlas exactly FOUR east/right facing Mexican lancer cavalry charging gait keyframes for warm outlined handpainted storybook Texas Revolution game. Reference bottom row mounted dragoon costume horse identity. Navy tunic red collar/cuffs white crossed straps white trousers blackboots crested brasshelmet. Chestnut horse whiteblaze blue/red saddlecloth. Long wood lance with small steel point held LEVEL FORWARD ABOVE HORSE HEAD, entire lance tip visible within every cell. Four clearly distinct animated horse gallop poses: top left extended forelegs hindlegs tucked; top right gathered legs beneath belly; bottom left forelegs tucked hindlegs extending; bottom right forelegs reaching downward hindlegs tucked. Rider leaning slightlyforward, same scale anatomy tack face all4. Slight elevated 3/4 east camera. Whole horse rider lance tail visible with wide transparent gutters each sprite max80%equalcellwidth75%height; horizontal lance must not cross into adjacent cell. Truealpha no floor shadows no background no words grid labels otherpeople blood gore no enemy no striking. This is charging movement only, original artistic historical interpretation.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military.png"
    ],
    "promptId": "frontier-v1/lancer-charge",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-82cdab0c-0258-4d0a-975e-612937f0eb18.png",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ac0322d9-5b4a-4756-98f5-4755f2e9f2e4.png",
    "refinements": [
      "Edit this exact four-frame sprite sheet: remove ALL brown/black painted background and ambient haze completely, replace with true transparent alpha. Keep the four horses, riders and lance tips intact, same painted style, positions, sizes and 2x2 layout. No ground or shadows. Do not change costume anatomy or poses. Transparent game sprite atlas, every empty pixel between sprites must be alpha zero."
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/lancer-charge.png",
    "postProcessing": "None; PNG copied unchanged.",
    "review": "Original interpretive costume and horse; modest authored keyframes. No graphic injury or weapon impact. West mirrors east. Mounting and cardinal transitions remain outstanding."
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['Mounted carbine firing and four-pose lancer charge; east with west mirroring. No changes to historical outcomes or speeds.'];

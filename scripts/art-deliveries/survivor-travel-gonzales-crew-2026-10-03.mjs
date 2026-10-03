export const SHEETS={
  "famous-susanna-child-travel": [
    "susanna-child-walk-e-1",
    "susanna-child-walk-e-2",
    "susanna-child-hold-1",
    "susanna-child-hold-2"
  ],
  "famous-susanna-child-cardinal": [
    "susanna-child-walk-s-1",
    "susanna-child-walk-s-2",
    "susanna-child-walk-n-1",
    "susanna-child-walk-n-2"
  ],
  "gonzales-settler-rammer": [
    "settler-gun-ram-1",
    "settler-gun-ram-2",
    "settler-gun-rammer-cover-1",
    "settler-gun-rammer-cover-2"
  ],
  "gonzales-settler-charge": [
    "settler-gun-carry-1",
    "settler-gun-carry-2",
    "settler-gun-charge-wait-1",
    "settler-gun-charge-wait-2"
  ],
  "gonzales-settler-igniter": [
    "settler-gun-fire-1",
    "settler-gun-fire-2",
    "settler-gun-ready-1",
    "settler-gun-ready-2"
  ]
};
export const ANIMATION_CLIPS={
  "susanna-child-walk-e": {
    "frames": [
      {
        "sprite": "susanna-child-walk-e-1",
        "duration": 280
      },
      {
        "sprite": "susanna-child-walk-e-2",
        "duration": 280
      }
    ],
    "loop": true,
    "authored": true,
    "motion": "none",
    "direction": "east; mirror for west"
  },
  "susanna-child-hold": {
    "frames": [
      {
        "sprite": "susanna-child-hold-1",
        "duration": 900
      },
      {
        "sprite": "susanna-child-hold-2",
        "duration": 900
      }
    ],
    "loop": true,
    "authored": true,
    "motion": "none",
    "direction": "east; mirror for west"
  },
  "susanna-child-walk-s": {
    "frames": [
      {
        "sprite": "susanna-child-walk-s-1",
        "duration": 280
      },
      {
        "sprite": "susanna-child-walk-s-2",
        "duration": 280
      }
    ],
    "loop": true,
    "authored": true,
    "motion": "none",
    "direction": "south"
  },
  "susanna-child-walk-n": {
    "frames": [
      {
        "sprite": "susanna-child-walk-n-1",
        "duration": 280
      },
      {
        "sprite": "susanna-child-walk-n-2",
        "duration": 280
      }
    ],
    "loop": true,
    "authored": true,
    "motion": "none",
    "direction": "north"
  },
  "settler-gun-ram": {
    "frames": [
      {
        "sprite": "settler-gun-ram-1",
        "duration": 650
      },
      {
        "sprite": "settler-gun-ram-2",
        "duration": 650
      }
    ],
    "loop": true,
    "authored": true,
    "motion": "none",
    "direction": "east; mirror for west"
  },
  "settler-gun-rammer-cover": {
    "frames": [
      {
        "sprite": "settler-gun-rammer-cover-1",
        "duration": 450
      },
      {
        "sprite": "settler-gun-rammer-cover-2",
        "duration": 450
      }
    ],
    "loop": false,
    "authored": true,
    "motion": "none",
    "direction": "east; mirror for west"
  },
  "settler-gun-carry": {
    "frames": [
      {
        "sprite": "settler-gun-carry-1",
        "duration": 280
      },
      {
        "sprite": "settler-gun-carry-2",
        "duration": 280
      }
    ],
    "loop": true,
    "authored": true,
    "motion": "none",
    "direction": "east; mirror for west"
  },
  "settler-gun-charge-wait": {
    "frames": [
      {
        "sprite": "settler-gun-charge-wait-1",
        "duration": 900
      },
      {
        "sprite": "settler-gun-charge-wait-2",
        "duration": 900
      }
    ],
    "loop": true,
    "authored": true,
    "motion": "none",
    "direction": "east; mirror for west"
  },
  "settler-gun-fire": {
    "frames": [
      {
        "sprite": "settler-gun-fire-1",
        "duration": 450
      },
      {
        "sprite": "settler-gun-fire-2",
        "duration": 450
      }
    ],
    "loop": false,
    "authored": true,
    "motion": "none",
    "direction": "east; mirror for west"
  },
  "settler-gun-ready": {
    "frames": [
      {
        "sprite": "settler-gun-ready-1",
        "duration": 900
      },
      {
        "sprite": "settler-gun-ready-2",
        "duration": 900
      }
    ],
    "loop": true,
    "authored": true,
    "motion": "none",
    "direction": "east; mirror for west"
  }
};
export const promptEntries=[
  {
    "id": "susanna-travel",
    "sheet": "famous-susanna-child-travel",
    "prompt": "NEW transparent STRICT2x2 exactlyFOUR isolated fullbody cutouts in warm outlined handpainted storybook Texas frontier game, reference STYLE ONLY. Slightly elevated3/4camera muted moss ochre cream rust. Strict equalcellgrid40pxalpha gutters max75%cellheight75%cellwidth; full feet hats hands tools intact no overlappingcells. All EAST/right samecharacter scale face costume. Truealpha no groundshadow backdrop labels text grid cannon otherpeople flames gore. Use reference EXACT identity mother rustdress creamapron beigeheadscarf darkshoes holding Angelina small14montholdgirl browncurlyhair creamdress no bonnet. Child present ALL4 SAMEsmalltoddler not adult and securely heldbotharms mother's left hip. TOPLEFT EAST walking leftlegforward planted rightlegbent passing, TOPRIGHT OPPOSITE rightlegforward leftlegbent passing. BOTTOMLEFT EAST standing holdingchild supportingbackandhips headlookingchild BOTTOMRIGHT gently cradlingchild closer supportingbackandhips withslightsway. NO child separate/disconnected.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-susanna-dickinson.png"
    ],
    "promptId": "frontier-v1/famous-susanna-child-travel",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-30740900-cbe6-4b33-8e8b-7bbd357db7be.png",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-1852c65c-a768-421c-bd9f-d1a9aa5b704f.png",
    "refinements": [
      {
        "source": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-30740900-cbe6-4b33-8e8b-7bbd357db7be.png",
        "prompt": "Edit this exact transparent 2x2 sprite sheet. Change ONLY TOPRIGHT walking legs: leading right boot planted FAR FORWARD, left knee visibly bent trailing with heel lifted. Alter rust skirt folds to clearly opposite stride from top left. Keep child secure, identical mother child identities all cells. Maintain same four equal cells full-body scale, warm outlined painted game style, transparent alpha, no scene no labels. No extra limbs. All unaffected cells unchanged.",
        "resultPath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ec813fc3-f30b-432e-98a0-134f7bdcfbc4.png"
      },
      {
        "source": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ec813fc3-f30b-432e-98a0-134f7bdcfbc4.png",
        "prompt": "Edit ONLY TOP RIGHT sprite lower body of exact transparent 2x2 sheet. Make a clearly DISTINCT PASSING step: supporting LEFT leg almost VERTICAL under hips foot planted directly below body; RIGHT knee bent HIGH FORWARD toward east, raised right boot floating above ground in front. NOT long split-legged stride, NOT same legs as top left. Preserve mother face costume and child securely held, skirt lifts subtly over the raised knee revealing boot. Preserve all other cells unchanged and same scale equal grid fullbody transparent alpha warm painted outlined game art.",
        "resultPath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-1852c65c-a768-421c-bd9f-d1a9aa5b704f.png"
      }
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-susanna-child-travel.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Original interpretive identity/costume. Modest authored two-pose cycles. No new dialogue, event, outcome or speed. Fine body/prop registration remains polish."
  },
  {
    "id": "susanna-travel-ns",
    "sheet": "famous-susanna-child-cardinal",
    "prompt": "NEW transparent STRICT2x2 exactlyFOUR isolated fullbody cutouts in warm outlined handpainted storybook Texas frontier game, reference STYLE ONLY. Slightly elevated3/4camera muted moss ochre cream rust. Strict equalcellgrid40pxalpha gutters max75%cellheight75%cellwidth; full feet hats hands tools intact no overlappingcells. All EAST/right samecharacter scale face costume. Truealpha no groundshadow backdrop labels text grid cannon otherpeople flames gore. Use reference EXACT identity rustdress creamapron beigeheadscarf darkshoes holding small14monthold Angelina browncurlyhair creamdress securelyonleft hip ALL4. TOPLEFT SOUTHtowardviewer leftbootforward rightbootbehind TOPRIGHT SOUTH rightbootforward leftbehind visiblyalternate dress folds. BOTTOMLEFT NORTH awayviewer rearview LEFTbootforward RIGHTraised BOTTOMRIGHT NORTH RIGHTbootforward LEFTraised. Motherbackofscarfdress visible childheadandarm peeks fromhip nofrontfaceofmother. Child presentALL4 SAMEsmalltoddler notadult, securelybotharmssupportbackandhips. Full cutouts no floatingchild.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-susanna-dickinson.png"
    ],
    "promptId": "frontier-v1/famous-susanna-child-cardinal",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ed254072-1b3b-4fc3-96d3-298e89b8b714.png",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-203fca21-028e-4e9d-890e-a6b4dd7e04c4.png",
    "refinements": [
      {
        "source": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ed254072-1b3b-4fc3-96d3-298e89b8b714.png",
        "prompt": "Edit this exact transparent 2x2 sprite sheet. Correct TOP BOTH to TRUE FRONT south camera: mother's face shoulders torso face directly viewer, child on left hip secure. Top left left boot forward, top right right boot forward opposite skirt folds. BOTTOM BOTH true REAR north, bottom left left boot ahead right heel raised, bottom right right boot ahead left heel raised. Clearly opposite leg poses in each row. Preserve mother child clothes identity. Maintain same four equal cells full-body scale, warm outlined painted game style, transparent alpha, no scene no labels. No extra limbs. All unaffected cells unchanged.",
        "resultPath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-203fca21-028e-4e9d-890e-a6b4dd7e04c4.png"
      }
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/famous-susanna-child-cardinal.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Original interpretive identity/costume. Modest authored two-pose cycles. No new dialogue, event, outcome or speed. Fine body/prop registration remains polish."
  },
  {
    "id": "settler-rammer",
    "sheet": "gonzales-settler-rammer",
    "prompt": "NEW transparent STRICT2x2 exactlyFOUR isolated fullbody cutouts in warm outlined handpainted storybook Texas frontier game, reference STYLE ONLY. Slightly elevated3/4camera muted moss ochre cream rust. Strict equalcellgrid40pxalpha gutters max75%cellheight75%cellwidth; full feet hats hands tools intact no overlappingcells. All EAST/right samecharacter scale face costume. Truealpha no groundshadow backdrop labels text grid cannon otherpeople flames gore. Civilianrammer brownbearded man brownfelt hat rustrolledshirt leatherwaistcoat greytrousers darkboots no militaryuniform no musket. TOPLEFT feetplanted twohandswoodenrammer waistheight blackswabhead atfarRIGHT slightforwardlean TOPRIGHT SAMErammer clearlypushed60pxforwardbotharms extendedlean. BOTTOMLEFT WITHOUTrammer crouchbothhandsoverears faceeast BOTTOMRIGHT WITHOUTrammer samecrouchheadslightlyhigherhandsnear ears. No inventeduniform.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military-actions.png"
    ],
    "promptId": "frontier-v1/gonzales-settler-rammer",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-499334e3-c541-4e90-a83e-34758e67fb0d.png",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-499334e3-c541-4e90-a83e-34758e67fb0d.png",
    "refinements": [],
    "runtimeFile": "public/assets/frontier-v1/atlases/gonzales-settler-rammer.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Original interpretive identity/costume. Modest authored two-pose cycles. No new dialogue, event, outcome or speed. Fine body/prop registration remains polish."
  },
  {
    "id": "settler-charge",
    "sheet": "gonzales-settler-charge",
    "prompt": "NEW transparent STRICT2x2 exactlyFOUR isolated fullbody cutouts in warm outlined handpainted storybook Texas frontier game, reference STYLE ONLY. Slightly elevated3/4camera muted moss ochre cream rust. Strict equalcellgrid40pxalpha gutters max75%cellheight75%cellwidth; full feet hats hands tools intact no overlappingcells. All EAST/right samecharacter scale face costume. Truealpha no groundshadow backdrop labels text grid cannon otherpeople flames gore. Distinctcivilianchargecarrier cleanshaven brownhaired youngman creamrolledshirt mosswaistcoat brownbroadbrimhat tantrousers darkboots. TOPLEFT LEFTlegforwardplanted RIGHTkneeraised carryingONE rounddarkcannonball BOTHhands atwaist; TOPRIGHT RIGHTlegforward LEFTkneeraised SAMEballhands faceclothes. BOTTOMLEFT standing holdingSAMEoneballwaist elbowsclose BOTTOMRIGHT standing sameball armsgentlyadjust lowerclosebody. No musket no militaryuniform.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military-actions.png"
    ],
    "promptId": "frontier-v1/gonzales-settler-charge",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-4be9397d-2cc8-456a-855a-b91829724ac3.png",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-d2ada230-6a44-46af-8158-4dbe70652c2f.png",
    "refinements": [
      {
        "source": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-4be9397d-2cc8-456a-855a-b91829724ac3.png",
        "prompt": "Edit this exact transparent 2x2 sprite sheet. Change ONLY TOPRIGHT legs to opposite stride: right leg stretched forward boot planted, left knee bent behind body heel lifted. Top left unchanged. Preserve ball hands face clothing and bottom row. Maintain same four equal cells full-body scale, warm outlined painted game style, transparent alpha, no scene no labels. No extra limbs. All unaffected cells unchanged.",
        "resultPath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-d2ada230-6a44-46af-8158-4dbe70652c2f.png"
      }
    ],
    "runtimeFile": "public/assets/frontier-v1/atlases/gonzales-settler-charge.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Original interpretive identity/costume. Modest authored two-pose cycles. No new dialogue, event, outcome or speed. Fine body/prop registration remains polish."
  },
  {
    "id": "settler-igniter",
    "sheet": "gonzales-settler-igniter",
    "prompt": "NEW transparent STRICT2x2 exactlyFOUR isolated fullbody cutouts in warm outlined handpainted storybook Texas frontier game, reference STYLE ONLY. Slightly elevated3/4camera muted moss ochre cream rust. Strict equalcellgrid40pxalpha gutters max75%cellheight75%cellwidth; full feet hats hands tools intact no overlappingcells. All EAST/right samecharacter scale face costume. Truealpha no groundshadow backdrop labels text grid cannon otherpeople flames gore. Distinctoldergreybearded civiliani gniter bluefelt hat ochrerolledshirt slatewaistcoat browntrousers darkboots. TOPLEFT holdingthin woodenlinstockwith dark slowmatch at farRIGHT waistheight rightarmforward leftarmnearbody; TOPRIGHT sameigniter leanbackdrawinglinstockbackwithrightarm leftpalmnearleftear afterdischarge NOflames. BOTTOMLEFT feetplanted holdinglinstockverticallytorightside ready BOTTOMRIGHT samefeet holdinglinstockverticallywithsmalltorsoheadturn. No musket militaryuniform cannon fireworks gore.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/military-actions.png"
    ],
    "promptId": "frontier-v1/gonzales-settler-igniter",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f9453fc7-c773-4dfd-82d0-858c96ad969a.png",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f9453fc7-c773-4dfd-82d0-858c96ad969a.png",
    "refinements": [],
    "runtimeFile": "public/assets/frontier-v1/atlases/gonzales-settler-igniter.png",
    "postProcessing": "None; selected generated PNG copied unchanged.",
    "review": "Original interpretive identity/costume. Modest authored two-pose cycles. No new dialogue, event, outcome or speed. Fine body/prop registration remains polish."
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['Two-pose story actions and transport. Guide and charge-wait variants await explicit scene staging. Historical likeness and tools are interpretations, not evidence; no dialogue or new event added.'];

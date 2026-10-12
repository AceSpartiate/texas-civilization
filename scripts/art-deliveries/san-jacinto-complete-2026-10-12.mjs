export const CAMP_GROUPS={"cast1":["rust","teal","elder","blue"],"cast2":["rust-woman","indigo","ochre","blue-girl"],"children":["girl","boy","smallchild",null],"heads1":["mother-scarf","father-straw","father-beard","father-moustache"],"heads2":["mother-braid","mother-loose","mother-straw","youth-boy"],"heads3":["youth-girl","father-hat"],"infant":["infant"]};
export const RELOAD_DURATIONS=[600,600,400,1000,800,2000,1800,800];
export const SHEETS={},ANIMATION_CLIPS={};
for(const [group,figures]of Object.entries(CAMP_GROUPS)){
 SHEETS[`people-sj-camp-${group}`]=figures.flatMap(f=>f?['rest','sleep'].flatMap(p=>[1,2].map(i=>`${f}-camp-${p}-${i}`)):[null,null,null,null]);
 for(const f of figures.filter(Boolean))for(const p of ['rest','sleep'])ANIMATION_CLIPS[`${f}-camp-${p}`]={frames:[1,2].map(i=>({sprite:`${f}-camp-${p}-${i}`,duration:p==='sleep'?1600:1100})),authored:true,loop:true,motion:'none'};
}
for(const d of ['e','s','n']){
 SHEETS[`sj-mounted-reload-${d}`]=['volunteer','dragoon'].flatMap(f=>[1,2,3,4,5,6,7,8].map(i=>`${f}-mounted-reload-${d}-${i}`));
 for(const f of ['volunteer','dragoon'])ANIMATION_CLIPS[`${f}-mounted-reload-${d}`]={frames:RELOAD_DURATIONS.map((duration,i)=>({sprite:`${f}-mounted-reload-${d}-${i+1}`,duration})),authored:true,loop:false,motion:'none',direction:d==='e'?'east; west by mirroring':d==='s'?'south':'north'};
}
export const promptEntries=[
  {
    "sheet": "people-sj-camp-cast1",
    "promptId": "frontier-v1/people-sj-camp-cast1",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production transparent game atlas FOUR columns FOUR rows sixteen whole seated/blanket-rest figures. Reference exact identities warminkedpainted frontierstyle. ROW1 rust man darkhairbeardtanbrimhat rustshirt tantrousers boots; ROW2 teal woman brownhairstyledbun tealblouse ochreskirt creamapron; ROW3 elder graybeard tanhat creamshirt forestvest brownpants boots; ROW4 blue youth darkhair blueshirt tantrousers suspenders boots. Everyrowcolumns1/2 healthy SEATED rest, legs folded or kneesbent hands relaxed, secondpose slighthead/handshift breathing notwounded. Columns3/4 healthy ASLEEP on side on small brown wool blanket creamcover overlowerbody, head resting on foldedcloth eyesclosed facepeaceful no injury; secondpose subtle blanketbreathing andhandshift sameidentity. Sleep figures horizontallyoriented headleft feettowardright, no coffin death rigidbodies. Keep seatedperson scale sameaswalkreferences; sleepfullbody sameactualsize lyingdown never resizedtobeas tall asstanding. All clothingfacehatidentitymaintained hatsmayrestbesideheadincludedwithin owncell. No weapons gore shadows ground text grid. EACHwholefigure central60percentwidth60percentheight each equalcell plenty genuinealpha0gutters everyseam outeredge. Exactly16independentcompletefigures.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a0fa9d34-065b-4f2d-b828-43a4f6693042.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-sj-camp-cast1.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only."
  },
  {
    "sheet": "people-sj-camp-cast2",
    "promptId": "frontier-v1/people-sj-camp-cast2",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production transparent game atlas EXACT4columns4rows16 familycamp figures matchingreference. ROW1 rust-woman cream bonnet rustblouse ochreskirt creamapron; ROW2 indigo woman darkhairbun indigo longdress creamneckscarf; ROW3 ochre youth darkhair ochreshirt brownvest graytrousers boots; ROW4 blue-girl darkbraid blue dress creamapron boots. Columns1/2 healthy seatedrest onground bentlegs handsrelaxed subtlehand/headshift breathing; cols3/4 healthy sleeping onside onbrownwoolblanket withcreamcoveroverlegs, headleft feetright eyesclosed gentleexpression noinjurydeath. Preserveidentityfullbodies clothingface eachrow, seatedsamepersonscale sleepingbodylengthsame asstandingperson notresizedtostandingheight. Hatbonnetmayrestnexttohead withincell. Warmbrownink softlypaintedmuted frontiergame no weaponsgore modernobjects landscape shadows grid text. Everyfullfigure central60percentwidth60percentheight eachcell, generousgenuinealpha0gutters atALLseams outeredges. Exactly16 separatewhole figures; no cropped feet/head/blanket.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-eb8f4814-2b6f-4f89-8ba9-5864b4b05fe1.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-sj-camp-cast2.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only."
  },
  {
    "sheet": "people-sj-camp-children",
    "promptId": "frontier-v1/people-sj-camp-children",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Transparent game atlas EXACT FOUR columns FOUR rows16 CHILD rest/sleep sprites in referencepaintedstyle. ROW1 braided terracottadress creamapron brownshoes schoolgirl; ROW2 blond creamshirt suspenders brownshorttrousers barefoot schoolboy; ROW3 darkhair toddler creamshortgown barefoot; ROW4 swaddledcream infant in smallwovenbasket. Cols1/2 child healthyseatedground rest, distinctsmallhand/headshift; infantbasketawake then drowsy. Cols3/4 healthyasleep onside onsmallbrownblanket creamcoveroverlowerbody, headleft feetright two subtleblanket/headbreathingposes; INFANT stays safelylying in basket eyesclosed two breathingposes notseatedupright. No adultbodies, children actualageproportions, no injured/deadposes, sameidentityallfourrowframes. Same scale in all poses withinidentity, sleeplengthsameactualchildbodylength not enlargedtofillcell. Mutedwarmbrownoutlines softlypainted game no textgrid shadows landscape weaponsgore. Entirefigureorinfantbasket central60percentwidth60percentheight owncell generousgenuinealpha0gutters ALLseamsedges. Exactly16completeisolated figures.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-34df77d3-0814-4911-9029-82aa9622023c.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-sj-camp-children.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-0efc8921-749d-4274-9c1e-b394fbf00e00.png",
    "refinements": [
      {
        "prompt": "Correct infant sleep animation row4 cols3/4: same basket andsame infant liesHEAD LEFT FEET RIGHT BOTHposes, eyesclosed. Col4 must NOT reverse child head to right. Give col4 slight blanketbreath variation SAME camera andheadposition so gentlebreathing ratherthan turn. Keep infant safelylyingwrapped inbasket. Also uniformly shrink everywholefigure to75percent current size centerown original equal4x4cell, generousalpha0gutters allseamsouteredges. Keep allotheridentities/posesexact same, no newshadowbackgroundtext."
      }
    ]
  },
  {
    "sheet": "people-sj-camp-heads1",
    "promptId": "frontier-v1/people-sj-camp-heads1",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Create transparent production atlas FOURcolumns FOURrows16 campfigures exactreferences identities. Row1 mother-scarf creamheadscarf rustdresscreamapron;row2 father-straw clean-shaven brownhair tanstrawhat rustshirt creamneckcloth browntrousers suspenders boots;row3 father-beard browncurlyhairfullbeard NOhat rustshirtcreamneckclothbrowntrousers;row4 father-moustache browncurlyhairmoustacheNOhat rustshirtcreamneckclothbrowntrousers. Cols1/2 healthy groundseated rest bentknees two subtle hand/head breathingposes;cols3/4 peacefullyASLEEP onsideheadleft feetright brownwoolblanket creamcoveroverlowerbody eyesclosed gentlycurl noinjurydeath, two subtlydistinctbreathingposes. Preserve faceheadsilhouetteclothes identity inallrowframes, samephysicalbody scale seatedsleep, no stretchinglyingbody tostandingheight. Hatcanrestbesidehead withincell. Allwholefigures central60percentwidth60percentheight owncell hugealpha0gutters allseamsedges, exactly16 no cropoverlapbackgroundshadowsgridlabels weaponsgore. Warmbrown ink softmuted paintedfrontiergame sameasreference.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-mother-scarf.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-father-straw.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-father-beard.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-father-moustache.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-42150392-c109-4be9-b144-6cf16271a09d.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-sj-camp-heads1.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5173bec6-7d49-4490-8e1d-b0c6a15c119e.png",
    "refinements": [
      {
        "prompt": "Correct row2 father-straw SLEEPING cols3/4: he must be CLEAN-SHAVEN as row2 seated poses, REMOVE all beard/moustache, same short brown hair and youthful adultface. Keep row3 father-beard fullbeard and row4 moustache unchanged. Also uniformly shrink EVERYwholefigure to75percent current size independently centered its originalcell, exact4columns4rows, genuinealpha0gutters allseamsedges. Preserve all16identityposes andblankets, no shadowsbackgroundtext."
      },
      {
        "prompt": "In FOURcolumnsFOURrows16figures changeONLY row2 cols3/4 sleeping CLEAN SHAVEN father strawhat: his face skin from cheek tochin MUST be completely smooth peach/tan, NO black/brown beard facialhair or moustache, same clean-shavenface asrow2cols1/2. Expose his chin in sleepingpose so smoothskin unmistakable, brownshortheadhair staysaboveear notoncheek. Keep closedeyespeacefulblanket sideposes. Row3BEARD androw4MOUSTACHE remain exactly as is. Preserve all16complete independentfigures, layoutidentityclothes alpha0transparency. No paintedbackgroundshadowtext, shrinkeachwholefigure further80percent owncell toensuregutter."
      }
    ]
  },
  {
    "sheet": "people-sj-camp-heads2",
    "promptId": "frontier-v1/people-sj-camp-heads2",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production TRANSPARENT spriteatlas FOURcolumns FOURrows SIXTEEN exactfamilyheadwearidentities from orderedreferences. ROW1 mother-braid darklongbraid rustdress creamapron; ROW2 mother-loose uncoveredloose darkhair rustdresscreamapron; ROW3 mother-straw darkhair under tanstrawhat rustdresscreamapron; ROW4 youth-boy darkshortcurlyhair clean-shaven rustshirtcreamneckcloth browntrouserssuspenders boots adolescent. EACHROW cols1/2 healthy seatedground rest bentknees relaxedhands withsubtlehand/headposechange;cols3/4 peaceful ASLEEP eyesclosedonSIDE headleftfeetright brownwoolblanket creamcoveroverlegs subtledifferentbreathingposes. Preserveexactface hairheadsilhouette costume andage allfourframes. Noinjurydeath. Samebodysize seating/sleeping notoversizedlyingfigures. IMPORTANT generous transparent isolation: shrink everywholefigure to fit central55percentWIDTH and55percentHEIGHT own equalcell, minimum55px truealpha0seamgutters allouteredges. Wholebodyfeetheadblanketno crop overlap. Warmdarkbrownoutlinesoftpaintedmutedfrontiergame sameasrefs no textgrid shadowlandscapeweapon gore. Exact16isolatedfigures.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-mother-braid.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-mother-loose.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-mother-straw.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-boy.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-be1cfd28-eb54-4fa5-85e0-6d6671093030.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-sj-camp-heads2.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-bb5b09a7-6640-4796-ba2d-297ba5a53bbe.png",
    "refinements": [
      {
        "prompt": "Correct ONLY row2 mother-loose hair in seatedfront col2: REMOVE BRAID downfront shoulder; replace with loose wavy darkhair fallingfreely downshoulder, matching row2 sidepose andsleep. Row1 mother-braid retains her braid, row3 strawhatwoman no braidadded. Also uniformly shrink all16wholefigures to75percent current size centerown equalcell4x4 widealpha0gutters everyseam andedge. Preserve eachpose faceclothingblankets, no newtextbackgroundshadows."
      }
    ]
  },
  {
    "sheet": "people-sj-camp-heads3",
    "promptId": "frontier-v1/people-sj-camp-heads3",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production TRANSPARENT spriteatlas FOURcolumns TWOrows EIGHT exactfamilyheadwearidentities from orderedreferences. ROW1 youth-girl adolescent darkbraid rustdresscreamapron; ROW2 father-hat adultdarkhair clean-shaven darkbrownbroadbrimhat rustshirtcreamneckcloth browntrouserssuspendersboots. EACHROW cols1/2 healthy seatedground rest bentknees relaxedhands withsubtlehand/headposechange;cols3/4 peaceful ASLEEP eyesclosedonSIDE headleftfeetright brownwoolblanket creamcoveroverlegs subtledifferentbreathingposes. Preserveexactface hairheadsilhouette costume andage allfourframes. Noinjurydeath. Samebodysize seating/sleeping notoversizedlyingfigures. IMPORTANT generous transparent isolation: shrink everywholefigure to fit central55percentWIDTH and55percentHEIGHT own equalcell, minimum55px truealpha0seamgutters allouteredges. Wholebodyfeetheadblanketno crop overlap. Warmdarkbrownoutlinesoftpaintedmutedfrontiergame sameasrefs no textgrid shadowlandscapeweapon gore. Exact8isolatedfigures.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-girl.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-father-hat.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-0fccc73a-b70b-43a1-ae76-77c41ca51f60.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-sj-camp-heads3.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only."
  },
  {
    "sheet": "people-sj-camp-infant",
    "promptId": "frontier-v1/people-sj-camp-infant",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Create a transparent 2 by 2 atlas FOUR sprites of the SAME cream-swaddled dark-haired INFANT in the SAME oval woven carry basket, ALL viewed directly FROM FRONT, same symmetrical basket rim and infant face at topcenter, no sideviews. Sprite top-left: awake eyesopen tinyhead centerhandsinsidewrap. Top-right: awake eyeshalfclosed smallheadtilt. Bottom-left: ASLEEP eyesclosed headTOPCENTER facingfront, creamblanket chestlow. Bottom-right: ASLEEP eyesclosed headTOPCENTER facingfront SAME POSITION and SAME BASKET asbottomleft, chestblanket slightlyraised breathing. Bothsleepingframes exactlysamefrontcamera cannotflip basket ormoveheadleft/right. Warminkedsoftpaintedfrontiergame matchingreference infant lastrow butuseFRONTbasketgeometry referencebottomleftonly. Exactlyfourcompletebaskets central60percentowncellhugealpha0gutters allseamsouteredges. No adults babiesstanding textground shadowsgrid orbackground.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5ae6f4c1-0154-4eae-b945-9c9f8681f54d.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-sj-camp-infant.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only."
  },
  {
    "sheet": "sj-mounted-reload-e",
    "promptId": "frontier-v1/sj-mounted-reload-e",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Transparentproduction game atlas EXACT FOURcolumns FOURrows16 complete mountedreload composites facing EAST/right. Rows1/2 SAME anonymous volunteer reference1 brownhat beardbrowncoat creamtrousers brownboots chestnuthorse whiteblazesocks tansaddlecloth. Rows3/4 SAME Mexican dragoon reference2 brasshelmetblackcrest navycoatredcuffs whitecrossbelts whitetrousersblackboots chestnuthorsewhiteblazesocks navysaddleclothredtrim. Eight phases in readingorder across TWOrows per rider:1 paper cartridge at mouth biteopen with carbineacrosslap;2 prime openpan byrightlock withcartridge smallpowder;3 CLOSE frizzen/pancover withthumb cartridgeinotherhand;4 rotatebarrelUP andpour remainingcharge/paperball downmuzzle, butt bracednearriderthigh NOTthroughhorse;5 extractslenderwoodenramrod alongsidebarrel;6 RAM downmuzzle rodendabovemuzzle handpushing;7 withdrawrod andreturnto underbarrelchannel;8 READY lowcarbineacrosslap, ramrodstored. Weapon is flintlock muzzleloader no metalcartridge magazine scope or bolt. No dischargeflash thisisreloadonly. Entirehorseandrider stationary samehorsegroundedhooves silhouette acrossall8frames eachidentity; riderarmsheadweaponmove while horse STANDS not walkingtrotting. Alwayscomplete horse legs tail ears reins saddle heldweaponrod insideowncell. Eachcompositecentral55percentwidth60percentheight owncell huge60pxtruealpha0gutters ALLseamsouteredges. No weapons intersecthorsebody, no long ramrod crosscell, no moderngear textgrid landscapes castshadow bloodvictims. Warmbrownink mutedpaintedfrontiergame exactlyreferences. Exactly16 separate wholehorse+rider poses eighteachidentity.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/volunteer-mounted.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/dragoon-carbine-actions.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-10b5c304-4df3-494f-a652-91f384e85edb.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/sj-mounted-reload-e.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-0e72e3c8-f83c-46ba-ada4-b0a8aac88387.png",
    "refinements": [
      {
        "prompt": "Remove the brown painted background COMPLETELY to genuine RGBA alpha-zero transparency. Keep exact sixteen EAST-facing mounted reload poses fourcolumnsfourrows, all identityuniformhorsesweapons and sequentialhands preserved. Also independently shrink every WHOLEhorseandrider to70percentpresent size centeredown originalcell. Restore any hooves clippedatbottom in row4. Wideclear alpha0gutters everyseamouteredge. Exactly16 isolatedsprites no shadowbackgroundgridlabels smoke. Do not change camera or turn walkinglegs. No opaque/semitransparent coloredwash; completely transparent betweenfigures."
      }
    ]
  },
  {
    "sheet": "sj-mounted-reload-s",
    "promptId": "frontier-v1/sj-mounted-reload-s",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Create transparent production mountedreload atlas FOURcolumns FOURrows16 wholehorseandridercomposites. Sameexact twoidentities references: rows1/2 anonymousvolunteer brownhatbeardbrowncoatcreamtrousers chestnuthorsewhiteblazesocks tansaddlecloth; rows3/4 Mexicandragoon brasshelmetblackcrest navycoatredcuffs whitecrossbelts whitetrousers chestnuthorsewhiteblazesocks navysaddleclothredtrim. CAMERA HEADING ALL sixteen SOUTH headon horseFACEpointsdirectlytowardviewer/downscreen riderfrontchest, nevereastsideprofile. Eight phases in readingorder across TWOrows per rider:1 paper cartridge at mouth biteopen with carbineacrosslap;2 prime openpan byrightlock withcartridge smallpowder;3 CLOSE frizzen/pancover withthumb cartridgeinotherhand;4 rotatebarrelUP andpour remainingcharge/paperball downmuzzle, butt bracednearriderthigh NOTthroughhorse;5 extractslenderwoodenramrod alongsidebarrel;6 RAM downmuzzle rodendabovemuzzle handpushing;7 withdrawrod andreturnto underbarrelchannel;8 READY lowcarbineacrosslap, ramrodstored. Weapon is flintlock muzzleloader no metalcartridge magazine scope or bolt. No dischargeflash thisisreloadonly. HorseSTANDS SAMEgroundedfootpositions all8frames eachidentity, riderhandsheadweaponanimateonly. Barrel tiltedupbyrider thigh anddoesnotpassthroughhorse, ramrodfitsowncell. Preserve identitytackhorsecolors everyphase, no firingflash or smoke. Samewarmbrownink softlypaintedgame asreferences. Everywholecomposite central50percentwidth55percentheightowncellminimum70pxtruealpha0gutters allseamsouteredges. No text labelsgrid shadowlandscape gore extraweapon moderngear orcropoverlap. Exactly16entirecomposites8volunteerthen8dragoon.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/southern-volunteer-mounted-actions.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-69e5aaf1-0775-4c16-b879-40a81ceadac1.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/sj-mounted-reload-s.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only.",
    "generationReference": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-0e72e3c8-f83c-46ba-ada4-b0a8aac88387.png",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-36dcd53f-df4e-42b4-a9e6-c63ab39ac1cd.png",
    "refinements": [
      {
        "prompt": "Remove ALL brown painted background to GENUINE RGBA ALPHA ZERO, preserving exactly16 complete mountedreload figures and eachdifferenthandweaponpose. FOURcolumnsFOURrows sameorder first8volunteerthen8dragoon sameNORTH/SOUTH headingasimage. Independently shrink everywholecomposite to70percentcurrent size centeredowncell, generousclearalpha0gutters ALLseamsouteredges. Restore any clippedbottomhooves. No castshadows haloscoloredwash gridtext. TRANSPARENT between allsprites no brownopaque/semitransparentbackground. Preserve uniformidentityhorses feetposition ramrods rifles sequentialactions no moderngear."
      }
    ]
  },
  {
    "sheet": "sj-mounted-reload-n",
    "promptId": "frontier-v1/sj-mounted-reload-n",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Create transparent production mountedreload atlas FOURcolumns FOURrows16 wholehorseandridercomposites. Sameexact twoidentities references: rows1/2 anonymousvolunteer brownhatbeardbrowncoatcreamtrousers chestnuthorsewhiteblazesocks tansaddlecloth; rows3/4 Mexicandragoon brasshelmetblackcrest navycoatredcuffs whitecrossbelts whitetrousers chestnuthorsewhiteblazesocks navysaddleclothredtrim. CAMERA HEADING ALL sixteen NORTH directlyAWAY fromcamera/upscreen horseTAILhaunches towardviewer riderBACK whitecrossbelts, nevereastsideprofile. Eight phases in readingorder across TWOrows per rider:1 paper cartridge at mouth biteopen with carbineacrosslap;2 prime openpan byrightlock withcartridge smallpowder;3 CLOSE frizzen/pancover withthumb cartridgeinotherhand;4 rotatebarrelUP andpour remainingcharge/paperball downmuzzle, butt bracednearriderthigh NOTthroughhorse;5 extractslenderwoodenramrod alongsidebarrel;6 RAM downmuzzle rodendabovemuzzle handpushing;7 withdrawrod andreturnto underbarrelchannel;8 READY lowcarbineacrosslap, ramrodstored. Weapon is flintlock muzzleloader no metalcartridge magazine scope or bolt. No dischargeflash thisisreloadonly. HorseSTANDS SAMEgroundedfootpositions all8frames eachidentity, riderhandsheadweaponanimateonly. Barrel tiltedupbyrider thigh anddoesnotpassthroughhorse, ramrodfitsowncell. Preserve identitytackhorsecolors everyphase, no firingflash or smoke. Samewarmbrownink softlypaintedgame asreferences. Everywholecomposite central50percentwidth55percentheightowncellminimum70pxtruealpha0gutters allseamsouteredges. No text labelsgrid shadowlandscape gore extraweapon moderngear orcropoverlap. Exactly16entirecomposites8volunteerthen8dragoon.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/southern-dragoon-mounted-actions.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-1289eafa-4605-40ef-9937-61d9a74ebcfd.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/sj-mounted-reload-n.png",
    "postProcessing": "None. PNG copied unchanged; alpha measured read-only.",
    "generationReference": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-0e72e3c8-f83c-46ba-ada4-b0a8aac88387.png",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-35f2802e-8ad9-4ee1-a492-e877292fefc0.png",
    "refinements": [
      {
        "prompt": "Remove ALL brown painted background to GENUINE RGBA ALPHA ZERO, preserving exactly16 complete mountedreload figures and eachdifferenthandweaponpose. FOURcolumnsFOURrows sameorder first8volunteerthen8dragoon sameNORTH/SOUTH headingasimage. Independently shrink everywholecomposite to70percentcurrent size centeredowncell, generousclearalpha0gutters ALLseamsouteredges. Restore any clippedbottomhooves. No castshadows haloscoloredwash gridtext. TRANSPARENT between allsprites no brownopaque/semitransparentbackground. Preserve uniformidentityhorses feetposition ramrods rifles sequentialactions no moderngear."
      }
    ]
  }
];
promptEntries.find(entry=>entry.sheet==='people-sj-camp-cast1').refinements=[{"prompt":"Spacing-only edit. This is a FOUR-column FOUR-row atlas of sixteen complete family camp figures. Reduce EACH entire figure with all blanket, hat, hair, hands and feet to HALF current width and HALF current height. Center every figure independently in its own original cell. Preserve all sixteen exact identities and poses, colors and faces in original order. Make very wide truly transparent margins at all row and column seams and outside edges. No overlapping figures, no crop, no missing blanket tips, no background or shadows. Dramatic 50% linear reduction, not a small adjustment. Keep sleeping bodies lying on their sides, peaceful closed eyes, healthy seated bodies and distinctive outfits.","reference":"C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-e2ceb400-76bd-477b-97aa-02bdcce4d471.png"}];
promptEntries.find(entry=>entry.sheet==='sj-mounted-reload-s').refinements.push({"prompt":"Spacing-only edit of this FOUR-column FOUR-row sprite sheet. Reduce EVERY one of sixteen complete horse-and-rider figures to HALF current width and HALF current height. Center each independently in its own original equal cell. Preserve exact north/south camera, every sequential reload hand/weapon pose, horse grounded feet, uniform, colors, details and order. Include every hoof, tail, helmet, rifle and rod. Leave enormous completely alpha-zero margins between rows and columns and at all outer edges. No touching or overlap. Genuine RGBA transparency; no shadow, text or background. Dramatic 50% linear reduction, not minor spacing adjustment.","reference":"C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-967b540e-bd3a-4371-a17b-8b91d0624818.png"});
promptEntries.find(entry=>entry.sheet==='sj-mounted-reload-n').refinements.push({"prompt":"Spacing-only edit of this FOUR-column FOUR-row sprite sheet. Reduce EVERY one of sixteen complete horse-and-rider figures to HALF current width and HALF current height. Center each independently in its own original equal cell. Preserve exact north/south camera, every sequential reload hand/weapon pose, horse grounded feet, uniform, colors, details and order. Include every hoof, tail, helmet, rifle and rod. Leave enormous completely alpha-zero margins between rows and columns and at all outer edges. No touching or overlap. Genuine RGBA transparency; no shadow, text or background. Dramatic 50% linear reduction, not minor spacing adjustment.","reference":"C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-8aa1482e-314c-4442-b9ab-01a9a5e2affe.png"});
promptEntries.find(entry=>entry.sheet==='sj-mounted-reload-e').refinements.push({"prompt":"Make a spacing-only edit of this 4-column by 4-row game sprite sheet. There are sixteen separate complete horse-and-rider figures. Reduce EACH entire figure, including every tail, hoof, hat, helmet, rifle and ramrod, to HALF its current width and HALF its current height. Keep each figure centered in its own original cell. Keep all sixteen figures, their order, exact poses, camera direction, colors and details. Leave very wide fully transparent margins between every pair of figures and around the outside. Restore any missing hoof tips. No crop, no touching, no overlap. Genuine RGBA transparency, no background or shadows. This must be a dramatic 50% linear reduction of every sprite, not a small adjustment.","reference":"C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5364433f-6f03-4460-9b3b-4d76bb8aa42d.png"});
export const notes=['136 new usable frames: 88 healthy family rest/sleep across 22 baseline/headwear/age identities; 48 generic mounted full-reload phases. Child sheet bottom basket views intentionally unregistered; separate consistent-front infant atlas replaces them. 50 authored clips. No battle shot clock or simulation changes.'];


promptEntries.find(entry=>entry.sheet==='people-sj-camp-cast1').mode='generate + spacing correction';
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);

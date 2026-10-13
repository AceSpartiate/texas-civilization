export const RIDERS=['jw-smith','horton','kimbell','martin'];
export const SHEETS={},ANIMATION_CLIPS={};
for(const p of RIDERS){
 SHEETS[`named-${p}-trot`]=['e','s','n'].flatMap(d=>[1,2,3,4].map(i=>`${p}-mounted-trot-${d}-${i}`));
 for(const d of ['e','s','n'])ANIMATION_CLIPS[`${p}-mounted-trot-${d}`]={frames:[1,2,3,4].map(i=>({sprite:`${p}-mounted-trot-${d}-${i}`,duration:180})),loop:true,authored:true,motion:'none'};
 SHEETS[`named-${p}-mounted-dispatch`]=['e','s','n'].flatMap(d=>[1,2].map(i=>`${p}-mounted-dispatch-${d}-${i}`)).concat([1,2].map(i=>`${p}-mounted-rest-e-${i}`));
 for(const d of ['e','s','n'])ANIMATION_CLIPS[`${p}-mounted-dispatch-${d}`]={frames:[1,2].map(i=>({sprite:`${p}-mounted-dispatch-${d}-${i}`,duration:900})),loop:true,authored:true,motion:'none'};
 ANIMATION_CLIPS[`${p}-mounted-rest-e`]={frames:[1,2].map(i=>({sprite:`${p}-mounted-rest-e-${i}`,duration:1100})),loop:true,authored:true,motion:'none'};
}
SHEETS['named-milam-fire-service']=['e','w','s','n'].flatMap(d=>['aim','fire','load','ramrod'].map(p=>`milam-service-${d}-${p}`));
for(const d of ['e','w','s','n'])ANIMATION_CLIPS[`milam-fire-service-${d}`]={frames:['aim','fire','load','ramrod'].map((p,i)=>({sprite:`milam-service-${d}-${p}`,duration:[1500,300,900,900][i]})),loop:true,authored:true,motion:'none'};
SHEETS['named-relief-fates']=['kimbell','martin'].flatMap(p=>[`${p}-fall-relief`,`${p}-still-relief`]);
export const promptEntries=[
  {
    "sheet": "named-jw-smith-trot",
    "promptId": "frontier-v1/named-jw-smith-trot",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent production game atlas EXACT FOUR columns THREE rows TWELVE whole horse-and-jw-smith rider composites. Match reference EXACT face age hat coat neckcloth satchel saddle AND horse coatcolor mane tail faceblaze. Warmbrown outlined softly handpainted frontiergame. ROW1 EAST/right sideprofile FOUR TROTTING phases opposite diagonalpaired legextension gather otherdiagonalextension othergather, rider small controlled seatbob handskeepreins. ROW2 SOUTH towardviewer FOUR trotphases facechest visible foreshortenedlegs. ROW3 NORTH away/back FOUR trotphases hindquarters riderback backhatcoat noface. Eachrow ALLFOUR sameheading, neverdirectionchanges. Calm briskTROT notgallop, tackattached bootsinstirrups noattack. Fullhat earsmuzzletail allfourhoovesinsideeachcell CENTRAL50percentwidth55percentheight with80px genuinealpha0gutters allseamsouteredges. Samescale withinrow. Noextraanimal groundshadow scene gridlabels. EXACT12 frames. WestmirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-jw-smith-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-7254336c-c638-4eed-b9a3-61caa7571d70.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-jw-smith-trot.png",
    "postProcessing": "None; selected transparent PNG copied unchanged."
  },
  {
    "sheet": "named-jw-smith-mounted-dispatch",
    "promptId": "frontier-v1/named-jw-smith-mounted-dispatch",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent gameatlas FOURcolumns TWOrows EIGHT whole mounted jw-smith composites. Preserve reference EXACTfacehatcoatneckclothsatchel and exacthorsecolor mane tail blaze tack. Warmbrownoutlined softlypaintedfrontiergame. Haltedhorse stands relaxedallfourhooves, rider keepsreinsleft hand andoffers SMALLplainfoldedcreamdispatch rightarm then retractspapernear chest, two conversationposes. ROW1 cols1/2 EAST/right offering/retracting; cols3/4 SOUTH/front offering/retracting. ROW2 cols1/2 NORTH/rear offering/retracting seebackhatcoat NOface paperbesideshoulder naturallyvisible. ROW2 cols3/4 EAST/right calmhalt idle two breathing/reinhandadjustments WITHOUTpaper. Horsesmallheadear shifts withinpair. Completehoovesbootsstirrups reins papercontained. EachwholecompositeCENTRAL50percentwidth55percentheight owncell minimum80px alpha0gutters everyseamouteredge. No writtenpaper textlabels grid groundshadow scene extrapeople animal weapon dismount. EXACT8sprites.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-jw-smith-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-63b63722-f365-48c4-8e62-5e2c899dcd7e.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-jw-smith-mounted-dispatch.png",
    "postProcessing": "None; selected transparent PNG copied unchanged."
  },
  {
    "sheet": "named-horton-trot",
    "promptId": "frontier-v1/named-horton-trot",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent production game atlas EXACT FOUR columns THREE rows TWELVE whole horse-and-horton rider composites. Match reference EXACT face age hat coat neckcloth satchel saddle AND horse coatcolor mane tail faceblaze. Warmbrown outlined softly handpainted frontiergame. ROW1 EAST/right sideprofile FOUR TROTTING phases opposite diagonalpaired legextension gather otherdiagonalextension othergather, rider small controlled seatbob handskeepreins. ROW2 SOUTH towardviewer FOUR trotphases facechest visible foreshortenedlegs. ROW3 NORTH away/back FOUR trotphases hindquarters riderback backhatcoat noface. Eachrow ALLFOUR sameheading, neverdirectionchanges. Calm briskTROT notgallop, tackattached bootsinstirrups noattack. Fullhat earsmuzzletail allfourhoovesinsideeachcell CENTRAL50percentwidth55percentheight with80px genuinealpha0gutters allseamsouteredges. Samescale withinrow. Noextraanimal groundshadow scene gridlabels. EXACT12 frames. WestmirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-horton-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-058b028d-c9de-4fa0-ba7e-718975472a16.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-horton-trot.png",
    "postProcessing": "None; selected transparent PNG copied unchanged."
  },
  {
    "sheet": "named-horton-mounted-dispatch",
    "promptId": "frontier-v1/named-horton-mounted-dispatch",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent gameatlas FOURcolumns TWOrows EIGHT whole mounted horton composites. Preserve reference EXACTfacehatcoatneckclothsatchel and exacthorsecolor mane tail blaze tack. Warmbrownoutlined softlypaintedfrontiergame. Haltedhorse stands relaxedallfourhooves, rider keepsreinsleft hand andoffers SMALLplainfoldedcreamdispatch rightarm then retractspapernear chest, two conversationposes. ROW1 cols1/2 EAST/right offering/retracting; cols3/4 SOUTH/front offering/retracting. ROW2 cols1/2 NORTH/rear offering/retracting seebackhatcoat NOface paperbesideshoulder naturallyvisible. ROW2 cols3/4 EAST/right calmhalt idle two breathing/reinhandadjustments WITHOUTpaper. Horsesmallheadear shifts withinpair. Completehoovesbootsstirrups reins papercontained. EachwholecompositeCENTRAL50percentwidth55percentheight owncell minimum80px alpha0gutters everyseamouteredge. No writtenpaper textlabels grid groundshadow scene extrapeople animal weapon dismount. EXACT8sprites.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-horton-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-2dba152f-c755-4c93-abde-cdae8b0a0f61.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-horton-mounted-dispatch.png",
    "postProcessing": "None; selected transparent PNG copied unchanged."
  },
  {
    "sheet": "named-kimbell-trot",
    "promptId": "frontier-v1/named-kimbell-trot",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent production game atlas EXACT FOUR columns THREE rows TWELVE whole horse-and-kimbell rider composites. Match reference EXACT face age hat coat neckcloth satchel saddle AND horse coatcolor mane tail faceblaze. Warmbrown outlined softly handpainted frontiergame. ROW1 EAST/right sideprofile FOUR TROTTING phases opposite diagonalpaired legextension gather otherdiagonalextension othergather, rider small controlled seatbob handskeepreins. ROW2 SOUTH towardviewer FOUR trotphases facechest visible foreshortenedlegs. ROW3 NORTH away/back FOUR trotphases hindquarters riderback backhatcoat noface. Eachrow ALLFOUR sameheading, neverdirectionchanges. Calm briskTROT notgallop, tackattached bootsinstirrups noattack. Fullhat earsmuzzletail allfourhoovesinsideeachcell CENTRAL50percentwidth55percentheight with80px genuinealpha0gutters allseamsouteredges. Samescale withinrow. Noextraanimal groundshadow scene gridlabels. EXACT12 frames. WestmirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-kimbell-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-bcc90761-ec02-4880-9002-d9b2e1448442.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-kimbell-trot.png",
    "postProcessing": "None; selected transparent PNG copied unchanged."
  },
  {
    "sheet": "named-kimbell-mounted-dispatch",
    "promptId": "frontier-v1/named-kimbell-mounted-dispatch",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent gameatlas FOURcolumns TWOrows EIGHT whole mounted kimbell composites. Preserve reference EXACTfacehatcoatneckclothsatchel and exacthorsecolor mane tail blaze tack. Warmbrownoutlined softlypaintedfrontiergame. Haltedhorse stands relaxedallfourhooves, rider keepsreinsleft hand andoffers SMALLplainfoldedcreamdispatch rightarm then retractspapernear chest, two conversationposes. ROW1 cols1/2 EAST/right offering/retracting; cols3/4 SOUTH/front offering/retracting. ROW2 cols1/2 NORTH/rear offering/retracting seebackhatcoat NOface paperbesideshoulder naturallyvisible. ROW2 cols3/4 EAST/right calmhalt idle two breathing/reinhandadjustments WITHOUTpaper. Horsesmallheadear shifts withinpair. Completehoovesbootsstirrups reins papercontained. EachwholecompositeCENTRAL50percentwidth55percentheight owncell minimum80px alpha0gutters everyseamouteredge. No writtenpaper textlabels grid groundshadow scene extrapeople animal weapon dismount. EXACT8sprites.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-kimbell-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-1551a36e-4b91-44c8-a2fd-5d97cccc02b1.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-kimbell-mounted-dispatch.png",
    "postProcessing": "None; selected transparent PNG copied unchanged."
  },
  {
    "sheet": "named-martin-trot",
    "promptId": "frontier-v1/named-martin-trot",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent production game atlas EXACT FOUR columns THREE rows TWELVE whole horse-and-martin rider composites. Match reference EXACT face age hat coat neckcloth satchel saddle AND horse coatcolor mane tail faceblaze. Warmbrown outlined softly handpainted frontiergame. ROW1 EAST/right sideprofile FOUR TROTTING phases opposite diagonalpaired legextension gather otherdiagonalextension othergather, rider small controlled seatbob handskeepreins. ROW2 SOUTH towardviewer FOUR trotphases facechest visible foreshortenedlegs. ROW3 NORTH away/back FOUR trotphases hindquarters riderback backhatcoat noface. Eachrow ALLFOUR sameheading, neverdirectionchanges. Calm briskTROT notgallop, tackattached bootsinstirrups noattack. Fullhat earsmuzzletail allfourhoovesinsideeachcell CENTRAL50percentwidth55percentheight with80px genuinealpha0gutters allseamsouteredges. Samescale withinrow. Noextraanimal groundshadow scene gridlabels. EXACT12 frames. WestmirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-martin-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-04ac994f-1947-402c-b896-17cbcc59e9d1.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-martin-trot.png",
    "postProcessing": "None; selected transparent PNG copied unchanged."
  },
  {
    "sheet": "named-martin-mounted-dispatch",
    "promptId": "frontier-v1/named-martin-mounted-dispatch",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Transparent gameatlas FOURcolumns TWOrows EIGHT whole mounted martin composites. Preserve reference EXACTfacehatcoatneckclothsatchel and exacthorsecolor mane tail blaze tack. Warmbrownoutlined softlypaintedfrontiergame. Haltedhorse stands relaxedallfourhooves, rider keepsreinsleft hand andoffers SMALLplainfoldedcreamdispatch rightarm then retractspapernear chest, two conversationposes. ROW1 cols1/2 EAST/right offering/retracting; cols3/4 SOUTH/front offering/retracting. ROW2 cols1/2 NORTH/rear offering/retracting seebackhatcoat NOface paperbesideshoulder naturallyvisible. ROW2 cols3/4 EAST/right calmhalt idle two breathing/reinhandadjustments WITHOUTpaper. Horsesmallheadear shifts withinpair. Completehoovesbootsstirrups reins papercontained. EachwholecompositeCENTRAL50percentwidth55percentheight owncell minimum80px alpha0gutters everyseamouteredge. No writtenpaper textlabels grid groundshadow scene extrapeople animal weapon dismount. EXACT8sprites.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-martin-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-66268690-5a91-4f15-94c8-88cf05336b72.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-martin-mounted-dispatch.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-9954ee96-a2cd-43e8-b53f-b368de0cdeb7.png",
    "refinements": [
      {
        "prompt": "Correct ONLY spacing of EIGHT whole Martin horse-and-rider sprites. Preserve exact FOURcolumns TWOrows, ALLidentities colors hats coats horses paper poses directions and two distinct calmidleposes. Uniformly SHRINK every COMPLETE figure horseincludingtail hooves hats papers to65percentCURRENTsize and center EACHwithinORIGINALcell. Nothing touchesneighbor seam orouteredge;minimum80px clearalpha0gutters everyseam. No croppedfeet muzzle paper orhat. No added objects shadow background gridlabels. TRUEtransparent PNG. Do not change poses or compass directions."
      }
    ]
  },
  {
    "sheet": "named-milam-fire-service",
    "promptId": "frontier-v1/named-milam-fire-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Transparent production gameatlas FOURcolumns FOURrows SIXTEEN fullbody Milam firingservice poses. Match reference EXACThat beardbrownlonghair fringedtanbuckskincoat darkgreybrowntrousers darkboots pouches brownrifle warmbrownoutlinedsoftpaintedgame. NO bakedwall/barricade. ROW1 EAST/right profile,ROW2WEST/left profile,ROW3SOUTH/towardviewer rifleforeshorteneddown,ROW4NORTH/away rear headback rifleforeshortenedup. Eachrow cols1 AIM shoulderedflintlock;2 FIRE slightshoulderrecoil noflash;3 LOAD muzzleup chargingcartridge;4 RAMROD twohandsrodrammingmuzzleup. Samefeet stance/headheightwithinrow exactcostume allframes twohands anatomicallycoherent. Fullriflehatrodbootsinsideeverycell central50percentwidth55percentheight with70px alpha0gutters everyseamouteredge. EXACT16 independentwholefigures. No swords modernrifle smoke shadow scene labels grid wounds fall.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-milam.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ecb03b86-8c2d-47f7-816a-4861f66140d9.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-milam-fire-service.png",
    "postProcessing": "None; selected transparent PNG copied unchanged.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-7f9ed2c3-41fb-4561-8bb9-9cc7f07b7f10.png",
    "refinements": [
      {
        "prompt": "Spacing correction ONLY for exact16 Milam serviceframes. Keep FOURcolumns FOURrows, allidentities directionsaim/fire/load/ramrod meaning identical. Uniformly SHRINK EACHwholefigure INCLUDING rifle ramrod boots hat to65percent CURRENTsize andrecenteachowncell. Fullvisiblepixels CENTRAL60percentcellwidthheight minimum65px alpha0gutters onEVERYouteredge andALLrowcolumnboundaries. Preserve front SOUTHrow3 rearNORTHrow4 and WESTrow2 riflecorrect. No added objects scene shadows labels grid. True transparent PNG."
      }
    ]
  },
  {
    "sheet": "named-relief-fates",
    "promptId": "frontier-v1/named-relief-fates",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent gameatlas TWOcolumns TWOrows FOUR fullbody namedhumanfigures ONLY nohorses. Reference1 Kimbell EXACTnavyhat moustachebrowncoat ochreneckcloth greygreentrousers brownboots;reference2 Martin EXACTgreenhat blondhair tancoat bluewaistcoat rustneckcloth browntrousers brownboots. ROW1 Kimbell ROW2Martin. COL1 NONGRAPHIC FALL transition kneesgivingway torsoleaningground handbracing emptyhands fullbody NOTsleep. COL2 SAMEperson LYING STILL onside eyesclosed armsrelaxed hatbesidehead, stilldeadpose NOTawake/seated. No gore blood wound weapons humiliation. Respectfulclassroomdepiction. NOpaintedground. Warmbrownoutlinedsoftpaintedreferencegame. Wholefigureincludinghat bootscentral55percentwidth50percentheight owncell minimum100px alpha0gutters outeredgesseams. EXACT4 isolatedsprites. No scenery floor shadow textgrid.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-kimbell-mounted.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-martin-mounted.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-89a70de3-5e73-4fb6-8254-358d50366bc4.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/named-relief-fates.png",
    "postProcessing": "None; selected transparent PNG copied unchanged."
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['100 frames and 32 authored loops finish recorded named-roster action refinements: Milam firing, four relief/courier riders with cardinal trot and mounted dispatch, healthy halted rest, and non-graphic Kimbell/Martin fall/still. No roster identity or historic date changes. Explicit gait/action staging is separate from art availability.'];

export const BODY_TYPES=['adult-male','adult-female','youth-male','youth-female','child-male','child-female','smallchild'];
export const COMBAT_TYPES=BODY_TYPES.slice(0,4);
export const IDENTITIES={rust:'adult-male',elder:'adult-male',ochre:'adult-male','father-hat':'adult-male','father-beard':'adult-male','father-moustache':'adult-male','father-straw':'adult-male',teal:'adult-female','rust-woman':'adult-female',indigo:'adult-female','mother-braid':'adult-female','mother-loose':'adult-female','mother-scarf':'adult-female','mother-straw':'adult-female',blue:'youth-male','youth-boy':'youth-male','blue-girl':'youth-female','youth-girl':'youth-female',boy:'child-male',girl:'child-female',smallchild:'smallchild',infant:'infant'};
export const HEAD_GROUPS={cast1:['rust','teal','elder','blue'],cast2:['rust-woman','indigo','ochre','blue-girl'],fathers:['father-hat','father-beard','father-moustache','father-straw'],mothers:['mother-braid','mother-loose','mother-scarf','mother-straw'],young:['youth-boy','youth-girl','girl','boy']};
export const LOCOMOTION=['idle-s','idle-e','idle-n','idle-w','walk-e-1','walk-e-2','walk-e-3','walk-e-4','walk-s-1','walk-s-2','walk-n-1','walk-n-2'];
export const WORK=['dig','hoe','chop','hammer','carry','trade','care','search'].flatMap(p=>[1,2].map(i=>p+'-'+i));
export const SERVICE=['aim','fire','load','ramrod','horse-e-1','horse-e-2','passenger-e-1','passenger-e-2','passenger-s-1','passenger-s-2','passenger-n-1','passenger-n-2','wounded-1','wounded-2','fall','still'];
export const SHEETS={},FRAME_ALIASES={},ANIMATION_CLIPS={};
for(const body of BODY_TYPES){
 SHEETS['rig-'+body+'-locomotion']=LOCOMOTION.map(p=>'rig-body-'+body+'-'+p);
 SHEETS['rig-'+body+'-work']=WORK.map(p=>'rig-body-'+body+'-'+p);
 const service=COMBAT_TYPES.includes(body)?SERVICE:['comfort-1','comfort-2','rest-1','rest-2',...SERVICE.slice(4)];
 SHEETS['rig-'+body+'-service']=service.map(p=>'rig-body-'+body+'-'+p);
 if(body!=='smallchild')SHEETS['rig-'+body+'-saddle']=['e','s','n'].flatMap(d=>['saddle','saddle-wounded'].flatMap(p=>[1,2].map(i=>'rig-body-'+body+'-'+p+'-'+d+'-'+i)));
}
SHEETS['rig-infant-body']=['idle-s','idle-e','idle-n','idle-w','rest-e-1','rest-e-2','rest-s-1','rest-s-2','care-1','care-2','wounded-1','wounded-2'].map(p=>'rig-body-infant-'+p);
for(const [g,people]of Object.entries(HEAD_GROUPS))SHEETS['rig-heads-'+g]=['e','s','n','closed'].flatMap(d=>people.map(p=>'rig-head-'+p+'-'+d));
SHEETS['rig-heads-little']=['e','s','n','closed'].flatMap(d=>['smallchild','infant'].map(p=>'rig-head-'+p+'-'+d));
SHEETS['rig-covered-patients']=[...BODY_TYPES,'infant'].flatMap(b=>[1,2].map(i=>'rig-body-'+b+'-covered-'+i));
SHEETS['family-transport-components']=['horse-led','blanket-bearers'].flatMap(p=>[1,2,3,4].map(i=>'rig-kit-'+p+'-'+i));
for(const [sheet,types]of [['rig-camp-grown',BODY_TYPES.slice(0,4)],['rig-camp-children',['child-female','child-male','smallchild','infant']]])SHEETS[sheet]=types.flatMap(b=>['camp-rest-1','camp-rest-2','camp-sleep-1','camp-sleep-2'].map(p=>'rig-body-'+b+'-'+p));
for(const body of COMBAT_TYPES)SHEETS['rig-'+body+'-mounted-service']=['e','s','n'].flatMap(d=>['aim','fire','load','ramrod'].map(p=>'rig-body-'+body+'-mounted-'+d+'-'+p));
SHEETS['rig-capture-poses']=[...BODY_TYPES,'infant'].flatMap(b=>[1,2].map(i=>'rig-body-'+b+'-surrender-'+i));
for(const task of ['sow','harvest'])SHEETS['rig-'+task+'-poses']=[...BODY_TYPES,'infant'].flatMap(b=>[1,2].map(i=>'rig-body-'+b+'-'+task+'-'+i));
const heading=p=>p.startsWith('covered')||p.startsWith('camp-sleep')||p==='still'?'closed':/-(n)(?:-|$)/.test(p)?'n':/-(s)(?:-|$)/.test(p)?'s':'e';
for(const [id,body]of Object.entries(IDENTITIES))for(const sheet of Object.values(SHEETS))for(const source of sheet){
 const prefix='rig-body-'+body+'-';if(!source.startsWith(prefix))continue;const pose=source.slice(prefix.length),head=heading(pose),alias=id+'-rig-'+pose;
 FRAME_ALIASES[alias]={source,head:'rig-head-'+id+'-'+head,identity:id,body,pose,headAngle:pose==='still'?Math.PI/2:pose==='fall'?Math.PI/4:pose.startsWith('covered')||pose.startsWith('camp-sleep')?-Math.PI/2:pose.startsWith('wounded')?-.3:pose.startsWith('saddle-wounded')?.25:0,headScale:body==='infant'?.5:body==='smallchild'?.44:body.startsWith('child')?.38:body.startsWith('youth')?.33:.30};
}
const cycle=(id,pose,frames,durations=250)=>ANIMATION_CLIPS[id+'-rig-'+pose]={frames:frames.map((p,i)=>({sprite:id+'-rig-'+p,duration:Array.isArray(durations)?durations[i]:durations})),authored:frames.length>1,loop:!pose.includes('fire'),motion:frames.length>1?'none':'breathe'};
for(const [id,body]of Object.entries(IDENTITIES)){
 for(const d of ['s','e','w','n'])cycle(id,'idle-'+d,['idle-'+d],1200);
 if(body!=='infant'){
  for(const [d,count]of [['e',4],['s',2],['n',2]])cycle(id,'walk-'+d,Array.from({length:count},(_,i)=>'walk-'+d+'-'+(i+1)));
  for(const p of ['dig','hoe','chop','hammer','sow','harvest','carry','trade','care','search','surrender'])cycle(id,p,[p+'-1',p+'-2'],450);
  for(const d of ['e','s','n'])cycle(id,'passenger-'+d,[1,2].map(i=>'passenger-'+d+'-'+i),750);
  if(body!=='smallchild')for(const d of ['e','s','n'])for(const p of ['saddle','saddle-wounded'])cycle(id,p+'-'+d,[1,2].map(i=>p+'-'+d+'-'+i),650);
  for(const p of ['camp-rest','camp-sleep'])cycle(id,p,[p+'-1',p+'-2'],1200);
  if(COMBAT_TYPES.includes(body))for(const d of ['e','s','n'])cycle(id,'mounted-fire-'+d,['aim','fire','load','ramrod'].map(p=>'mounted-'+d+'-'+p),[700,120,750,900]);
  if(COMBAT_TYPES.includes(body))cycle(id,'fire-reload',['aim','fire','load','ramrod'],[700,120,750,900]);
  else cycle(id,'comfort',['comfort-1','comfort-2'],850);
 }
 for(const p of ['camp-rest','camp-sleep'])cycle(id,p,[p+'-1',p+'-2'],1200);
 cycle(id,'wounded',['wounded-1','wounded-2'],900);
 cycle(id,'covered',['covered-1','covered-2'],900);
 for(const [kind,patient]of [['living','wounded'],['dead','covered']]){
  const poses=[1,2,3,4].map(i=>id+'-rig-carry-'+kind+'-'+i);
  for(const [i,alias]of poses.entries())FRAME_ALIASES[alias]={source:'rig-kit-blanket-bearers-'+(i+1),patient:id+'-rig-'+patient+'-'+(i%2+1),identity:id,kind,patientScale:1};
  ANIMATION_CLIPS[id+'-rig-carry-'+kind]={frames:poses.map(sprite=>({sprite,duration:300})),authored:true,loop:true,motion:'none'};
 }
 if(body!=='infant'&&body!=='smallchild'){
  const poses=[1,2,3,4].map(i=>id+'-rig-led-wounded-'+i);
  for(const [i,alias]of poses.entries())FRAME_ALIASES[alias]={source:'rig-kit-horse-led-'+(i+1),patient:id+'-rig-saddle-wounded-e-'+(i%2+1),identity:id,kind:'living-mounted',patientScale:1};
  ANIMATION_CLIPS[id+'-rig-led-wounded']={frames:poses.map(sprite=>({sprite,duration:300})),authored:true,loop:true,motion:'none'};
 }
}

export const promptEntries=[
  {
    "sheet": "rig-adult-male-locomotion",
    "promptId": "frontier-v1/rig-adult-male-locomotion",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. FOURcolumns THREErows TWELVE HEADLESS adultmale BODY components, no headhairhat face. Neck stump shoulderstorsoarms legs fullboots like reference man rust-shirt/tantrousers silhouette but materialcoded GREEN allprimaryshirt and REDexposedarms, fixedYELLOWtrousers bootsbelt. Cyan socket centeredon neckstump at necktop. ROW1 standidle SOUTH/front, EAST/rightprofile, NORTH/rear, WEST/leftprofile. ROW2 EAST/right WALKfouralternatefootfallphases sameheading. ROW3 SOUTH/frontwalking2phases cols1/2; NORTH/rearwalking2phases cols3/4. Entirebodyeachcell separate, no head or neckfloating, coherent handsfullfeet.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a81e3d09-b9c7-44e1-b819-dc69b460e782.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-male-locomotion.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-heads-cast1",
    "promptId": "frontier-v1/rig-heads-cast1",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. FOURcolumns FOURrows SIXTEEN HEAD-ONLY components necktohat/hairstyletop NOtorsobodyarms. Columns identities from reference rustmale tanfelt hatbrownbeard; tealwoman pinnedbrownbun; elderdarkskin grayfullbeard tanfelt hat; blueyoungmalecurlybrownhair nohat. Rows EAST/rightprofile, SOUTH/front, NORTH/rear, EAST/rightprofile CLOSED EYES for sleeping/fate poses. Fullsamehead identityrows, rearhasNOface. Materialcode skinRED hair/beardsBLUE, hatsYELLOW, eyesinkgreyscale. CyannecksocketdotatBOTTOMneckcenter. Everyheadcontainsneckstump noextraobjects shouldersbody.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-f03a9df0-68c8-49cd-84d2-3a549522ef99.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-heads-cast1.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-adult-male-service",
    "promptId": "frontier-v1/rig-adult-male-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. FOURcolumns FOURrows SIXTEEN HEADLESS adultmale BODYcomponents EXACT reference man ordinarycivilian shirttrousersboots silhouette withoutheadhairhat. Cyan NECKsocketat topneckstump perpose, noneelse. ROW1 EAST/right AIMshoulderedflintlock, FIREsmallrecoil, kneelingLOADcartridge muzzleup, RAMRODmuzzleup; riflewoodYELLOW metalgrey skinRED shirtGREEN trousersbootsYELLOW. ROW2 seatedhorse E cols1/2 kneesbent straddlinginvisiblesaddle handsreins two poses; wagonpassenger EAST cols3/4 kneesbent feetdangling handsinlap twoposes. ROW3 wagonpassenger SOUTH cols1/2 NORTH cols3/4 twohandslapadjustments perpair. ROW4 cols1/2 livingWOUNDEDreclining supportoneelbow weakhandmovement kneesbent, cols3 FALLkneesgivingway handbrace andcol4 DEADSTILLlyingonside armsrelaxed. No paintedblood gore horse wagon bench helpers. Cyanmarker follows real neck position evenfallen. No head painted anywhere, head added runtime.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-95574b35-f059-4fa7-b9ac-e576945cc554.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-male-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-adult-male-work",
    "promptId": "frontier-v1/rig-adult-male-work",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS grown man ordinary shirt trousers boots BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodyposes ALL EAST/rightprofile excepthandactiononly. ROW1 cols1/2 diggingSPADE two scoop/pushposes,cols3/4 hoeing two raised/loweredtoolposes. ROW2 cols1/2 choppingwoodAXE controlledraised/lowered,cols3/4 hammering smallhammer raised/lowered no workbenchpainted. ROW3 cols1/2 carrying smallclothbundle heldbothhandswalk2footphases,cols3/4 TRADE hands offer smallclothpacket thenreceivepacket. ROW4 cols1/2 caring handsheld smallfoldedlinenbandage thenreachinggently no secondperson;cols3/4 SEARCHleanforwardlookground handshadingthenpointdown. VisibletoolsfixedYELLOWwood handlesGREYmetal, linenNEUTRALgrey. Forchildpreschooltools smallsafelyheldwoodtoy-sizedtools depicthelpingadult notadultlaborhero; no weapons. All2posepairsidenticalbodyscale,differenthand/tool/legpositions.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-6115b828-0d58-42c3-baf2-5a3fb1445262.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-male-work.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-adult-male-saddle",
    "promptId": "frontier-v1/rig-adult-male-saddle",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS grown man ordinary shirt trousers boots BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12HEADLESSseatedriderbodylayers nohorse. Rows EAST/right SOUTH/front NORTH/rear. Eachrow cols1/2 HEALTHY handsreins shift and torso veryslightcalmsway,cols3/4 LIVINGWOUNDEDslumpedforward weakarmshift two poses. Bothlegsstraddleinvisiblesaddle kneesbentfeetbelow, skirtsmodestlydrapelegs asreference. Fullbodyhandslegsfeet intactnoheadnecksocketCYAN. No bloodgoredeath noextrahelpers objects. Samebodysize everyframe, childremainschild.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-de6213d4-1dd5-40d3-be97-fcc99711d69f.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-male-saddle.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-adult-female-locomotion",
    "promptId": "frontier-v1/rig-adult-female-locomotion",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS grown woman long1830s dress creamapron modestcoveredlegs shoes BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12bodies. ROW1 SOUTHidle EASTidle NORTHidle WESTidle. ROW2 EAST/rightwalk4different alternatingfootfall phases. ROW3 SOUTHwalk2cols1/2 NORTHwalk2cols3/4. Eachcompletebodycontainedcentral50percentcellwidth55percentheight hugeclearalpha0gutter.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-471102fa-234d-4108-b19b-eff9ce2667eb.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-female-locomotion.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-adult-female-work",
    "promptId": "frontier-v1/rig-adult-female-work",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS grown woman long1830s dress creamapron modestcoveredlegs shoes BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodyposes ALL EAST/rightprofile excepthandactiononly. ROW1 cols1/2 diggingSPADE two scoop/pushposes,cols3/4 hoeing two raised/loweredtoolposes. ROW2 cols1/2 choppingwoodAXE controlledraised/lowered,cols3/4 hammering smallhammer raised/lowered no workbenchpainted. ROW3 cols1/2 carrying smallclothbundle heldbothhandswalk2footphases,cols3/4 TRADE hands offer smallclothpacket thenreceivepacket. ROW4 cols1/2 caring handsheld smallfoldedlinenbandage thenreachinggently no secondperson;cols3/4 SEARCHleanforwardlookground handshadingthenpointdown. VisibletoolsfixedYELLOWwood handlesGREYmetal, linenNEUTRALgrey. Forchildpreschooltools smallsafelyheldwoodtoy-sizedtools depicthelpingadult notadultlaborhero; no weapons. All2posepairsidenticalbodyscale,differenthand/tool/legpositions.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3d6eaa9d-193c-46d5-bb8c-4f87591b6949.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-female-work.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-aa28d7f9-043c-4262-af61-190146e87a4b.png",
    "refinements": [
      {
        "prompt": "Precise atlas CORRECTION. Preserve EXACT original grid, all  components, bodyagegenderproportions poseordering directions costumes tools and semanticmaterial hues: REDskin GREENclothes BLUEhair YELLOWfixedwood/leather neutralGREYlinen/metal darkink. UNIFORMLY SHRINK EVERYwhole component INCLUDINGtools weaponrod braid boots hat to60percentCURRENTsize andcentereachitsORIGINALequalcell. FullvisiblepixelsONLYcentral55percentcellwidth55percentheight, at least75px TRUEalpha0 gutters everyrowcolumnboundaryandouteredges. No clipping overlapping merging objects. CRITICAL ONEbrightCYAN #00ffff solidroundnecksocketdot percomponent atrealneckattachment, 4percentbody/headheight; preserve ifpresent andADD ifmissing. Noothercyanpixels. Inheadcomponents dotatBOTTOMneck; inheadlessbodies dotaboveNECKstump at exactheadjoint evenifhands/weaponnearby; NOTonhandsorweapon. Keep eachdotfullyvisible insideowncell. Do not add heads toheadlessbodies. Preserve SAMEbodysizewithinposes and distinctanimationhandlegphases. Backgroundalpha0 ratherthanpaintedblack/white/checkerboard. No extra faceslabelsgridsgroundshadows."
      }
    ]
  },
  {
    "sheet": "rig-adult-female-service",
    "promptId": "frontier-v1/rig-adult-female-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS grown woman long1830s dress creamapron modestcoveredlegs shoes BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodies. ROW1 EAST AIMshoulderedflintlock FIRErecoil kneelingLOADcartridge RAMRODmuzzleup. ROW2 cols1/2 seatedhorse invisiblemount kneesbentcoveredlegs handsreins two poses;cols3/4 wagonpassengerEAST kneesbentfeetdangling two lapadjustments. ROW3 SOUTH/frontwagonpassenger2cols1/2 NORTH/rearwagonpassenger2cols3/4. ROW4 cols1/2 LIVINGwoundedrecliningproppedoneelbowweakhandshift twoposes,cols3 FALLkneegiveswayhandbrace,cols4 DEADSTILLonside armsrelaxed. No gore blood injurywoundsvisible nohorsewagonbenchpainted. Everyneckpoint CYANdot followsactualneck, nohead. Samephysicalbodydimensions acrosskneeling/seatedstanding.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-49614314-507e-4293-9aeb-364bc7f8acc5.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-female-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-b512a422-e487-44f8-806b-6806043bd62c.png",
    "refinements": [
      {
        "prompt": "Precise atlas CORRECTION. Preserve EXACT original grid, all  components, bodyagegenderproportions poseordering directions costumes tools and semanticmaterial hues: REDskin GREENclothes BLUEhair YELLOWfixedwood/leather neutralGREYlinen/metal darkink. UNIFORMLY SHRINK EVERYwhole component INCLUDINGtools weaponrod braid boots hat to60percentCURRENTsize andcentereachitsORIGINALequalcell. FullvisiblepixelsONLYcentral55percentcellwidth55percentheight, at least75px TRUEalpha0 gutters everyrowcolumnboundaryandouteredges. No clipping overlapping merging objects. CRITICAL ONEbrightCYAN #00ffff solidroundnecksocketdot percomponent atrealneckattachment, 4percentbody/headheight; preserve ifpresent andADD ifmissing. Noothercyanpixels. Inheadcomponents dotatBOTTOMneck; inheadlessbodies dotaboveNECKstump at exactheadjoint evenifhands/weaponnearby; NOTonhandsorweapon. Keep eachdotfullyvisible insideowncell. Do not add heads toheadlessbodies. Preserve SAMEbodysizewithinposes and distinctanimationhandlegphases. Backgroundalpha0 ratherthanpaintedblack/white/checkerboard. No extra faceslabelsgridsgroundshadows."
      }
    ]
  },
  {
    "sheet": "rig-adult-female-saddle",
    "promptId": "frontier-v1/rig-adult-female-saddle",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS grown woman long1830s dress creamapron modestcoveredlegs shoes BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12HEADLESSseatedriderbodylayers nohorse. Rows EAST/right SOUTH/front NORTH/rear. Eachrow cols1/2 HEALTHY handsreins shift and torso veryslightcalmsway,cols3/4 LIVINGWOUNDEDslumpedforward weakarmshift two poses. Bothlegsstraddleinvisiblesaddle kneesbentfeetbelow, skirtsmodestlydrapelegs asreference. Fullbodyhandslegsfeet intactnoheadnecksocketCYAN. No bloodgoredeath noextrahelpers objects. Samebodysize everyframe, childremainschild.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-e3a88e4e-ad76-434c-9f67-0e9cd7a7c53e.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-female-saddle.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-youth-male-locomotion",
    "promptId": "frontier-v1/rig-youth-male-locomotion",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS adolescentboy narrowshoulders slightbuild shirt trousers boots NOTgrownman BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12bodies. ROW1 SOUTHidle EASTidle NORTHidle WESTidle. ROW2 EAST/rightwalk4different alternatingfootfall phases. ROW3 SOUTHwalk2cols1/2 NORTHwalk2cols3/4. Eachcompletebodycontainedcentral50percentcellwidth55percentheight hugeclearalpha0gutter.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-boy.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-0dab77d3-4b67-4b85-b813-116554601c82.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-male-locomotion.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-youth-male-work",
    "promptId": "frontier-v1/rig-youth-male-work",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS adolescentboy narrowshoulders slightbuild shirt trousers boots NOTgrownman BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodyposes ALL EAST/rightprofile excepthandactiononly. ROW1 cols1/2 diggingSPADE two scoop/pushposes,cols3/4 hoeing two raised/loweredtoolposes. ROW2 cols1/2 choppingwoodAXE controlledraised/lowered,cols3/4 hammering smallhammer raised/lowered no workbenchpainted. ROW3 cols1/2 carrying smallclothbundle heldbothhandswalk2footphases,cols3/4 TRADE hands offer smallclothpacket thenreceivepacket. ROW4 cols1/2 caring handsheld smallfoldedlinenbandage thenreachinggently no secondperson;cols3/4 SEARCHleanforwardlookground handshadingthenpointdown. VisibletoolsfixedYELLOWwood handlesGREYmetal, linenNEUTRALgrey. Forchildpreschooltools smallsafelyheldwoodtoy-sizedtools depicthelpingadult notadultlaborhero; no weapons. All2posepairsidenticalbodyscale,differenthand/tool/legpositions.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-boy.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-d9f5eb50-f5f2-4aa8-b6e3-7ef39eda5cee.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-male-work.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-youth-male-service",
    "promptId": "frontier-v1/rig-youth-male-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS adolescentboy narrowshoulders slightbuild shirt trousers boots NOTgrownman BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodies. ROW1 EAST AIMshoulderedflintlock FIRErecoil kneelingLOADcartridge RAMRODmuzzleup. ROW2 cols1/2 seatedhorse invisiblemount kneesbentcoveredlegs handsreins two poses;cols3/4 wagonpassengerEAST kneesbentfeetdangling two lapadjustments. ROW3 SOUTH/frontwagonpassenger2cols1/2 NORTH/rearwagonpassenger2cols3/4. ROW4 cols1/2 LIVINGwoundedrecliningproppedoneelbowweakhandshift twoposes,cols3 FALLkneegiveswayhandbrace,cols4 DEADSTILLonside armsrelaxed. No gore blood injurywoundsvisible nohorsewagonbenchpainted. Everyneckpoint CYANdot followsactualneck, nohead. Samephysicalbodydimensions acrosskneeling/seatedstanding.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-boy.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5e96717d-523f-4a74-a5bb-dff7e425d248.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-male-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-youth-male-saddle",
    "promptId": "frontier-v1/rig-youth-male-saddle",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS adolescentboy narrowshoulders slightbuild shirt trousers boots NOTgrownman BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12HEADLESSseatedriderbodylayers nohorse. Rows EAST/right SOUTH/front NORTH/rear. Eachrow cols1/2 HEALTHY handsreins shift and torso veryslightcalmsway,cols3/4 LIVINGWOUNDEDslumpedforward weakarmshift two poses. Bothlegsstraddleinvisiblesaddle kneesbentfeetbelow, skirtsmodestlydrapelegs asreference. Fullbodyhandslegsfeet intactnoheadnecksocketCYAN. No bloodgoredeath noextrahelpers objects. Samebodysize everyframe, childremainschild.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-boy.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-007671e6-0ecd-45d2-b0e2-3f7cff375a18.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-male-saddle.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-youth-female-locomotion",
    "promptId": "frontier-v1/rig-youth-female-locomotion",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS adolescentgirl slightbuild longdress apron shoes NOTgrownwoman BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12bodies. ROW1 SOUTHidle EASTidle NORTHidle WESTidle. ROW2 EAST/rightwalk4different alternatingfootfall phases. ROW3 SOUTHwalk2cols1/2 NORTHwalk2cols3/4. Eachcompletebodycontainedcentral50percentcellwidth55percentheight hugeclearalpha0gutter.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-girl.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-31db88e6-c533-4363-8b78-79c7c9d954e7.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-female-locomotion.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-youth-female-work",
    "promptId": "frontier-v1/rig-youth-female-work",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS adolescentgirl slightbuild longdress apron shoes NOTgrownwoman BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodyposes ALL EAST/rightprofile excepthandactiononly. ROW1 cols1/2 diggingSPADE two scoop/pushposes,cols3/4 hoeing two raised/loweredtoolposes. ROW2 cols1/2 choppingwoodAXE controlledraised/lowered,cols3/4 hammering smallhammer raised/lowered no workbenchpainted. ROW3 cols1/2 carrying smallclothbundle heldbothhandswalk2footphases,cols3/4 TRADE hands offer smallclothpacket thenreceivepacket. ROW4 cols1/2 caring handsheld smallfoldedlinenbandage thenreachinggently no secondperson;cols3/4 SEARCHleanforwardlookground handshadingthenpointdown. VisibletoolsfixedYELLOWwood handlesGREYmetal, linenNEUTRALgrey. Forchildpreschooltools smallsafelyheldwoodtoy-sizedtools depicthelpingadult notadultlaborhero; no weapons. All2posepairsidenticalbodyscale,differenthand/tool/legpositions.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-girl.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5fc89323-9fc9-4f77-a86b-0d9cee01e86e.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-female-work.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-youth-female-service",
    "promptId": "frontier-v1/rig-youth-female-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS adolescentgirl slightbuild longdress apron shoes NOTgrownwoman BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodies. ROW1 EAST AIMshoulderedflintlock FIRErecoil kneelingLOADcartridge RAMRODmuzzleup. ROW2 cols1/2 seatedhorse invisiblemount kneesbentcoveredlegs handsreins two poses;cols3/4 wagonpassengerEAST kneesbentfeetdangling two lapadjustments. ROW3 SOUTH/frontwagonpassenger2cols1/2 NORTH/rearwagonpassenger2cols3/4. ROW4 cols1/2 LIVINGwoundedrecliningproppedoneelbowweakhandshift twoposes,cols3 FALLkneegiveswayhandbrace,cols4 DEADSTILLonside armsrelaxed. No gore blood injurywoundsvisible nohorsewagonbenchpainted. Everyneckpoint CYANdot followsactualneck, nohead. Samephysicalbodydimensions acrosskneeling/seatedstanding.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-girl.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3cb900b8-100a-45cc-9635-8582ec1fd9a1.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-female-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-c06a5f47-93f2-4c43-ad3b-be2c9b10f7f6.png",
    "refinements": [
      {
        "prompt": "Precise atlas CORRECTION. Preserve EXACT original grid, all  components, bodyagegenderproportions poseordering directions costumes tools and semanticmaterial hues: REDskin GREENclothes BLUEhair YELLOWfixedwood/leather neutralGREYlinen/metal darkink. UNIFORMLY SHRINK EVERYwhole component INCLUDINGtools weaponrod braid boots hat to60percentCURRENTsize andcentereachitsORIGINALequalcell. FullvisiblepixelsONLYcentral55percentcellwidth55percentheight, at least75px TRUEalpha0 gutters everyrowcolumnboundaryandouteredges. No clipping overlapping merging objects. CRITICAL ONEbrightCYAN #00ffff solidroundnecksocketdot percomponent atrealneckattachment, 4percentbody/headheight; preserve ifpresent andADD ifmissing. Noothercyanpixels. Inheadcomponents dotatBOTTOMneck; inheadlessbodies dotaboveNECKstump at exactheadjoint evenifhands/weaponnearby; NOTonhandsorweapon. Keep eachdotfullyvisible insideowncell. Do not add heads toheadlessbodies. Preserve SAMEbodysizewithinposes and distinctanimationhandlegphases. Backgroundalpha0 ratherthanpaintedblack/white/checkerboard. No extra faceslabelsgridsgroundshadows."
      }
    ]
  },
  {
    "sheet": "rig-youth-female-saddle",
    "promptId": "frontier-v1/rig-youth-female-saddle",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS adolescentgirl slightbuild longdress apron shoes NOTgrownwoman BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12HEADLESSseatedriderbodylayers nohorse. Rows EAST/right SOUTH/front NORTH/rear. Eachrow cols1/2 HEALTHY handsreins shift and torso veryslightcalmsway,cols3/4 LIVINGWOUNDEDslumpedforward weakarmshift two poses. Bothlegsstraddleinvisiblesaddle kneesbentfeetbelow, skirtsmodestlydrapelegs asreference. Fullbodyhandslegsfeet intactnoheadnecksocketCYAN. No bloodgoredeath noextrahelpers objects. Samebodysize everyframe, childremainschild.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-girl.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5f8e8e60-c451-45ea-ba7f-0c91340f68a4.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-female-saddle.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-child-male-locomotion",
    "promptId": "frontier-v1/rig-child-male-locomotion",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS schoolageboy CHILDshortlimbs roundbody creamshirt suspenders rolledshorttrousers barefeet redskin NOgrownproportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12bodies. ROW1 SOUTHidle EASTidle NORTHidle WESTidle. ROW2 EAST/rightwalk4different alternatingfootfall phases. ROW3 SOUTHwalk2cols1/2 NORTHwalk2cols3/4. Eachcompletebodycontainedcentral50percentcellwidth55percentheight hugeclearalpha0gutter.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-44b4773e-5e24-4a08-93bc-a338e159c77f.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-child-male-locomotion.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-child-male-work",
    "promptId": "frontier-v1/rig-child-male-work",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS schoolageboy CHILDshortlimbs roundbody creamshirt suspenders rolledshorttrousers barefeet redskin NOgrownproportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodyposes ALL EAST/rightprofile excepthandactiononly. ROW1 cols1/2 diggingSPADE two scoop/pushposes,cols3/4 hoeing two raised/loweredtoolposes. ROW2 cols1/2 choppingwoodAXE controlledraised/lowered,cols3/4 hammering smallhammer raised/lowered no workbenchpainted. ROW3 cols1/2 carrying smallclothbundle heldbothhandswalk2footphases,cols3/4 TRADE hands offer smallclothpacket thenreceivepacket. ROW4 cols1/2 caring handsheld smallfoldedlinenbandage thenreachinggently no secondperson;cols3/4 SEARCHleanforwardlookground handshadingthenpointdown. VisibletoolsfixedYELLOWwood handlesGREYmetal, linenNEUTRALgrey. Forchildpreschooltools smallsafelyheldwoodtoy-sizedtools depicthelpingadult notadultlaborhero; no weapons. All2posepairsidenticalbodyscale,differenthand/tool/legpositions.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-297bfeb4-f387-48f6-a41b-375c4696eb96.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-child-male-work.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-99619bef-75e2-4ecc-a849-ecce83c9599e.png",
    "refinements": [
      {
        "prompt": "Precise atlas CORRECTION. Preserve EXACT original grid, all  components, bodyagegenderproportions poseordering directions costumes tools and semanticmaterial hues: REDskin GREENclothes BLUEhair YELLOWfixedwood/leather neutralGREYlinen/metal darkink. UNIFORMLY SHRINK EVERYwhole component INCLUDINGtools weaponrod braid boots hat to60percentCURRENTsize andcentereachitsORIGINALequalcell. FullvisiblepixelsONLYcentral55percentcellwidth55percentheight, at least75px TRUEalpha0 gutters everyrowcolumnboundaryandouteredges. No clipping overlapping merging objects. CRITICAL ONEbrightCYAN #00ffff solidroundnecksocketdot percomponent atrealneckattachment, 4percentbody/headheight; preserve ifpresent andADD ifmissing. Noothercyanpixels. Inheadcomponents dotatBOTTOMneck; inheadlessbodies dotaboveNECKstump at exactheadjoint evenifhands/weaponnearby; NOTonhandsorweapon. Keep eachdotfullyvisible insideowncell. Do not add heads toheadlessbodies. Preserve SAMEbodysizewithinposes and distinctanimationhandlegphases. Backgroundalpha0 ratherthanpaintedblack/white/checkerboard. No extra faceslabelsgridsgroundshadows."
      }
    ]
  },
  {
    "sheet": "rig-child-male-service",
    "promptId": "frontier-v1/rig-child-male-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS schoolageboy CHILDshortlimbs roundbody creamshirt suspenders rolledshorttrousers barefeet redskin NOgrownproportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodies. ROW1 EASTbody comfortreaching gently, comforthandsfoldedcloth, restingseated1/restingseated2. NOweaponsofanykind. ROW2 cols1/2 seatedhorse invisiblemount kneesbentcoveredlegs handsreins two poses;cols3/4 wagonpassengerEAST kneesbentfeetdangling two lapadjustments. ROW3 SOUTH/frontwagonpassenger2cols1/2 NORTH/rearwagonpassenger2cols3/4. ROW4 cols1/2 LIVINGwoundedrecliningproppedoneelbowweakhandshift twoposes,cols3 FALLkneegiveswayhandbrace,cols4 DEADSTILLonside armsrelaxed. No gore blood injurywoundsvisible nohorsewagonbenchpainted. Everyneckpoint CYANdot followsactualneck, nohead. Samephysicalbodydimensions acrosskneeling/seatedstanding.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-15d06faf-1116-4a44-a9a9-30ed0c252e08.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-child-male-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-child-male-saddle",
    "promptId": "frontier-v1/rig-child-male-saddle",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS schoolageboy CHILDshortlimbs roundbody creamshirt suspenders rolledshorttrousers barefeet redskin NOgrownproportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12HEADLESSseatedriderbodylayers nohorse. Rows EAST/right SOUTH/front NORTH/rear. Eachrow cols1/2 HEALTHY handsreins shift and torso veryslightcalmsway,cols3/4 LIVINGWOUNDEDslumpedforward weakarmshift two poses. Bothlegsstraddleinvisiblesaddle kneesbentfeetbelow, skirtsmodestlydrapelegs asreference. Fullbodyhandslegsfeet intactnoheadnecksocketCYAN. No bloodgoredeath noextrahelpers objects. Samebodysize everyframe, childremainschild.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a657b7e8-2720-41bc-a1bc-88e6a9c81620.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-child-male-saddle.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-child-female-locomotion",
    "promptId": "frontier-v1/rig-child-female-locomotion",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS schoolagegirl CHILDshortlimbs roundbody longdress creamapron shoes NOgrownproportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12bodies. ROW1 SOUTHidle EASTidle NORTHidle WESTidle. ROW2 EAST/rightwalk4different alternatingfootfall phases. ROW3 SOUTHwalk2cols1/2 NORTHwalk2cols3/4. Eachcompletebodycontainedcentral50percentcellwidth55percentheight hugeclearalpha0gutter.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-6b269003-5d66-431d-8bf7-4420ac3cac19.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-child-female-locomotion.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-child-female-work",
    "promptId": "frontier-v1/rig-child-female-work",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS schoolagegirl CHILDshortlimbs roundbody longdress creamapron shoes NOgrownproportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodyposes ALL EAST/rightprofile excepthandactiononly. ROW1 cols1/2 diggingSPADE two scoop/pushposes,cols3/4 hoeing two raised/loweredtoolposes. ROW2 cols1/2 choppingwoodAXE controlledraised/lowered,cols3/4 hammering smallhammer raised/lowered no workbenchpainted. ROW3 cols1/2 carrying smallclothbundle heldbothhandswalk2footphases,cols3/4 TRADE hands offer smallclothpacket thenreceivepacket. ROW4 cols1/2 caring handsheld smallfoldedlinenbandage thenreachinggently no secondperson;cols3/4 SEARCHleanforwardlookground handshadingthenpointdown. VisibletoolsfixedYELLOWwood handlesGREYmetal, linenNEUTRALgrey. Forchildpreschooltools smallsafelyheldwoodtoy-sizedtools depicthelpingadult notadultlaborhero; no weapons. All2posepairsidenticalbodyscale,differenthand/tool/legpositions.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-23ce965e-48a8-49c9-b35d-5b0decd04ba9.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-child-female-work.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-child-female-service",
    "promptId": "frontier-v1/rig-child-female-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS schoolagegirl CHILDshortlimbs roundbody longdress creamapron shoes NOgrownproportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodies. ROW1 EASTbody comfortreaching gently, comforthandsfoldedcloth, restingseated1/restingseated2. NOweaponsofanykind. ROW2 cols1/2 seatedhorse invisiblemount kneesbentcoveredlegs handsreins two poses;cols3/4 wagonpassengerEAST kneesbentfeetdangling two lapadjustments. ROW3 SOUTH/frontwagonpassenger2cols1/2 NORTH/rearwagonpassenger2cols3/4. ROW4 cols1/2 LIVINGwoundedrecliningproppedoneelbowweakhandshift twoposes,cols3 FALLkneegiveswayhandbrace,cols4 DEADSTILLonside armsrelaxed. No gore blood injurywoundsvisible nohorsewagonbenchpainted. Everyneckpoint CYANdot followsactualneck, nohead. Samephysicalbodydimensions acrosskneeling/seatedstanding.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-cd938b60-e282-4191-b797-d7386e343018.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-child-female-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-child-female-saddle",
    "promptId": "frontier-v1/rig-child-female-saddle",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS schoolagegirl CHILDshortlimbs roundbody longdress creamapron shoes NOgrownproportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12HEADLESSseatedriderbodylayers nohorse. Rows EAST/right SOUTH/front NORTH/rear. Eachrow cols1/2 HEALTHY handsreins shift and torso veryslightcalmsway,cols3/4 LIVINGWOUNDEDslumpedforward weakarmshift two poses. Bothlegsstraddleinvisiblesaddle kneesbentfeetbelow, skirtsmodestlydrapelegs asreference. Fullbodyhandslegsfeet intactnoheadnecksocketCYAN. No bloodgoredeath noextrahelpers objects. Samebodysize everyframe, childremainschild.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-bd6989b5-b7d4-4c25-a2ea-0f06653b2385.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-child-female-saddle.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-smallchild-locomotion",
    "promptId": "frontier-v1/rig-smallchild-locomotion",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS preschoolTODDLER shortchubbyarmslegs longcreamshirt barefootREDfeet NOadult proportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns THREErows12bodies. ROW1 SOUTHidle EASTidle NORTHidle WESTidle. ROW2 EAST/rightwalk4different alternatingfootfall phases. ROW3 SOUTHwalk2cols1/2 NORTHwalk2cols3/4. Eachcompletebodycontainedcentral50percentcellwidth55percentheight hugeclearalpha0gutter.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-34e809a1-1582-48dc-81ef-fd927778980d.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-smallchild-locomotion.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-smallchild-work",
    "promptId": "frontier-v1/rig-smallchild-work",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS preschoolTODDLER shortchubbyarmslegs longcreamshirt barefootREDfeet NOadult proportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodyposes ALL EAST/rightprofile excepthandactiononly. ROW1 cols1/2 diggingSPADE two scoop/pushposes,cols3/4 hoeing two raised/loweredtoolposes. ROW2 cols1/2 choppingwoodAXE controlledraised/lowered,cols3/4 hammering smallhammer raised/lowered no workbenchpainted. ROW3 cols1/2 carrying smallclothbundle heldbothhandswalk2footphases,cols3/4 TRADE hands offer smallclothpacket thenreceivepacket. ROW4 cols1/2 caring handsheld smallfoldedlinenbandage thenreachinggently no secondperson;cols3/4 SEARCHleanforwardlookground handshadingthenpointdown. VisibletoolsfixedYELLOWwood handlesGREYmetal, linenNEUTRALgrey. Forchildpreschooltools smallsafelyheldwoodtoy-sizedtools depicthelpingadult notadultlaborhero; no weapons. All2posepairsidenticalbodyscale,differenthand/tool/legpositions.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a96c3fd2-d8d8-4d00-878b-9d327ab85b5d.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-smallchild-work.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-1a1a25cd-8de7-42a4-8fdf-ecd979c6dcb7.png",
    "refinements": [
      {
        "prompt": "Precise atlas CORRECTION. Preserve EXACT original grid, all  components, bodyagegenderproportions poseordering directions costumes tools and semanticmaterial hues: REDskin GREENclothes BLUEhair YELLOWfixedwood/leather neutralGREYlinen/metal darkink. UNIFORMLY SHRINK EVERYwhole component INCLUDINGtools weaponrod braid boots hat to60percentCURRENTsize andcentereachitsORIGINALequalcell. FullvisiblepixelsONLYcentral55percentcellwidth55percentheight, at least75px TRUEalpha0 gutters everyrowcolumnboundaryandouteredges. No clipping overlapping merging objects. CRITICAL ONEbrightCYAN #00ffff solidroundnecksocketdot percomponent atrealneckattachment, 4percentbody/headheight; preserve ifpresent andADD ifmissing. Noothercyanpixels. Inheadcomponents dotatBOTTOMneck; inheadlessbodies dotaboveNECKstump at exactheadjoint evenifhands/weaponnearby; NOTonhandsorweapon. Keep eachdotfullyvisible insideowncell. Do not add heads toheadlessbodies. Preserve SAMEbodysizewithinposes and distinctanimationhandlegphases. Backgroundalpha0 ratherthanpaintedblack/white/checkerboard. No extra faceslabelsgridsgroundshadows."
      }
    ]
  },
  {
    "sheet": "rig-smallchild-service",
    "promptId": "frontier-v1/rig-smallchild-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. Subject HEADLESS preschoolTODDLER shortchubbyarmslegs longcreamshirt barefootREDfeet NOadult proportions BODY ONLY nofacehatheadhair, neckstump withCYANdot. ExposedskinRED primaryclothingGREEN fixedbootsleatherwoodYELLOW apronlinenGREY. FOURcolumns FOURrows16bodies. ROW1 EASTbody comfortreaching gently, comforthandsfoldedcloth, restingseated1/restingseated2. NOweaponsofanykind. ROW2 cols1/2 seatedhorse invisiblemount kneesbentcoveredlegs handsreins two poses;cols3/4 wagonpassengerEAST kneesbentfeetdangling two lapadjustments. ROW3 SOUTH/frontwagonpassenger2cols1/2 NORTH/rearwagonpassenger2cols3/4. ROW4 cols1/2 LIVINGwoundedrecliningproppedoneelbowweakhandshift twoposes,cols3 FALLkneegiveswayhandbrace,cols4 DEADSTILLonside armsrelaxed. No gore blood injurywoundsvisible nohorsewagonbenchpainted. Everyneckpoint CYANdot followsactualneck, nohead. Samephysicalbodydimensions acrosskneeling/seatedstanding.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ef4975e1-3a42-4fcc-bf04-9d5908dfc569.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-smallchild-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-infant-body",
    "promptId": "frontier-v1/rig-infant-body",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. FOURcolumns THREErows12HEADLESSINFANT swaddled BODY ONLY headnotpainted necksocketCYAN at opening. Noarmswalkingtoolsweapons. Row1 four views neutralcream GREYswaddlebody FRONT SOUTH, sideEAST, awayNORTH, sideWEST. Row2 two verygentle swaddlebreathing/rest poses EAST cols1/2 thenSOUTHcols3/4. Row3 infantonblanketswaddle REST EAST twoposes cols1/2 then livingILLrest2cols3/4 slightfold/handmovement. Actualbabybodytinyroundproportion babywrappingcomplete, no basketcarrierfloor. TinyexposedneckRED. No headfacehair hatperson. Astarbornbabyreadability truealphagutters allseams.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-c5164d50-1ac0-4242-9eaa-726cb9e1c13b.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-infant-body.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-heads-cast2",
    "promptId": "frontier-v1/rig-heads-cast2",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. FOURcolumns FOURrows16 HEADONLYnecktohair/hattop nobodynoshoulders. Columns rust-woman bonnet softface; indigo pinnedbun softface; ochre shortbrownhair male bareheaded; blue-girl darkbraid teenageface. RowsEAST/rightprofile SOUTH/front NORTH/rear EAST/rightCLOSED EYES rest/fateexpression. Exactlysamechosenfaceidentity andheadstylepercolumn acrossrows; backviewNOface. Match suppliedreferences illustratedfaces softlycartoonednotrealisticphotographic portraits. SKINRED hair/beards/moustachesBLUE headcoverhatYELLOW or scarfGREEN linenGREY. CYANsocketatBOTTOMneckcenter only. Braidsfullvisible nevercropped. Everyheadcentral50percentwidth55percentheight with75pxalphagutters fullheadhairhatcontained.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a9e88342-5887-43ee-9b52-9467bc8b7375.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-heads-cast2.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-heads-fathers",
    "promptId": "frontier-v1/rig-heads-fathers",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. FOURcolumns FOURrows16 HEADONLYnecktohair/hattop nobodynoshoulders. Columns father-hat feltbroadbrim cleanface; father-beard fullbeard barehead; father-moustache neatmoustache barehead; father-straw wovenstrawhat cleanface. RowsEAST/rightprofile SOUTH/front NORTH/rear EAST/rightCLOSED EYES rest/fateexpression. Exactlysamechosenfaceidentity andheadstylepercolumn acrossrows; backviewNOface. Match suppliedreferences illustratedfaces softlycartoonednotrealisticphotographic portraits. SKINRED hair/beards/moustachesBLUE headcoverhatYELLOW or scarfGREEN linenGREY. CYANsocketatBOTTOMneckcenter only. Braidsfullvisible nevercropped. Everyheadcentral50percentwidth55percentheight with75pxalphagutters fullheadhairhatcontained.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-father-hat.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-205bcb2b-a5d9-4dbb-bb3c-4e5f54a04692.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-heads-fathers.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-heads-mothers",
    "promptId": "frontier-v1/rig-heads-mothers",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. FOURcolumns FOURrows16 HEADONLYnecktohair/hattop nobodynoshoulders. Columns mother-braid longbraid; mother-loose elegantloosehair; mother-scarf headscarftied; mother-straw wovenstrawhat. RowsEAST/rightprofile SOUTH/front NORTH/rear EAST/rightCLOSED EYES rest/fateexpression. Exactlysamechosenfaceidentity andheadstylepercolumn acrossrows; backviewNOface. Match suppliedreferences illustratedfaces softlycartoonednotrealisticphotographic portraits. SKINRED hair/beards/moustachesBLUE headcoverhatYELLOW or scarfGREEN linenGREY. CYANsocketatBOTTOMneckcenter only. Braidsfullvisible nevercropped. Everyheadcentral50percentwidth55percentheight with75pxalphagutters fullheadhairhatcontained.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-mother-braid.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-b1230b76-279e-4f71-9191-8d1da20dfcdf.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-heads-mothers.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a589de87-24f1-4a82-b4d4-cad4b34ffa0c.png",
    "refinements": [
      {
        "prompt": "Precise atlas CORRECTION. Preserve EXACT original grid, all  components, bodyagegenderproportions poseordering directions costumes tools and semanticmaterial hues: REDskin GREENclothes BLUEhair YELLOWfixedwood/leather neutralGREYlinen/metal darkink. UNIFORMLY SHRINK EVERYwhole component INCLUDINGtools weaponrod braid boots hat to60percentCURRENTsize andcentereachitsORIGINALequalcell. FullvisiblepixelsONLYcentral55percentcellwidth55percentheight, at least75px TRUEalpha0 gutters everyrowcolumnboundaryandouteredges. No clipping overlapping merging objects. CRITICAL ONEbrightCYAN #00ffff solidroundnecksocketdot percomponent atrealneckattachment, 4percentbody/headheight; preserve ifpresent andADD ifmissing. Noothercyanpixels. Inheadcomponents dotatBOTTOMneck; inheadlessbodies dotaboveNECKstump at exactheadjoint evenifhands/weaponnearby; NOTonhandsorweapon. Keep eachdotfullyvisible insideowncell. Do not add heads toheadlessbodies. Preserve SAMEbodysizewithinposes and distinctanimationhandlegphases. Backgroundalpha0 ratherthanpaintedblack/white/checkerboard. No extra faceslabelsgridsgroundshadows."
      }
    ]
  },
  {
    "sheet": "rig-heads-young",
    "promptId": "frontier-v1/rig-heads-young",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. FOURcolumns FOURrows16 HEADONLYnecktohair/hattop nobodynoshoulders. Columns youth-boy adolescentboy short tousledhair; youth-girl adolescentgirl braid; girl schoolagegirl braid; boy schoolageboy tousledhair. RowsEAST/rightprofile SOUTH/front NORTH/rear EAST/rightCLOSED EYES rest/fateexpression. Exactlysamechosenfaceidentity andheadstylepercolumn acrossrows; backviewNOface. Match suppliedreferences illustratedfaces softlycartoonednotrealisticphotographic portraits. SKINRED hair/beards/moustachesBLUE headcoverhatYELLOW or scarfGREEN linenGREY. CYANsocketatBOTTOMneckcenter only. Braidsfullvisible nevercropped. Everyheadcentral50percentwidth55percentheight with75pxalphagutters fullheadhairhatcontained.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-youth-girl.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-83d69dec-bc5c-4966-8993-28a3159ac5e8.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-heads-young.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-heads-little",
    "promptId": "frontier-v1/rig-heads-little",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. FOURcolumns TWOrows8HEADONLYnecktohairtop. ROW1 cols1 preschoolTODDLERsmallchildEAST,2 NEWBORNinfantEAST,3 sameTODDLERSOUTH,4 sameNEWBORNSOUTH. ROW2 cols1TODDLERNORTH,2NEWBORNNORTH,3TODDLEREASTCLOSEDEYES,4NEWBORNEASTCLOSEDEYES. Toddlerroundface tousledhair, newbornsoftinfantface verysparsewispshair tinyfeatures NOTgrownchild. Nohatbonnetbasketbodywrapping painted. NecksocketCYANbottom eachhead. SkinRED hairBLUE eyeinkgrey. Hugeclearalpha0gutter allseams.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-649d6bc3-0054-4d78-b560-5eb1f712fe81.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-heads-little.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-covered-patients",
    "promptId": "frontier-v1/rig-covered-patients",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep same anatomical size across all poses: kneeling/seated bodies are shorter, never enlarged to fill cell. Warm illustrative contour weight from reference, not realistic anatomy photograph. FOURcolumns FOURrows16 HEADLESS coveredDEADbodylayers ONLYnohelpersnobed. Two posesperbody foldedshroud shifts minutely duecarrying NOTbodybreathing. Row1 adultMALEpair cols1/2 adultFEMALEpair cols3/4;Row2 youthMALEpair/youthFEMALEpair;Row3 childBOYpair/childGIRLpair;Row4 preschoolTODDLERpair/NEWBORNpair. EachbodylyingHEADatLEFT FEETatRIGHT horizontalonBACK, wrappedmodestneutralGREYcreamlinen shroud except headnotpainted andneckstumpREDwithCYANsocket atheadendLEFT. AdultfeetbootsYELLOWpeek, childfeetRED modestpeeking, newbornfullywrapped. Nohairfaceheadobjects, nopaintedfloorblanket helpers weaponsgore. DifferentAGEbodyproportions samephysicalscale notadultmodelsforchildren. Fullbodywrapping central50percentwidth55percentheightcell.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-60d65ff3-564e-4352-bcab-50c18bacdfc7.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-covered-patients.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "family-transport-components",
    "promptId": "frontier-v1/family-transport-components",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Transparent paintedfrontier1835 game FOURcolumns TWOrows8 COMPLETE SUPPORT rigs ONLYnoPATIENTS. Warmbrown outlined softpaintedmutednaturalcolors reference. ROW1 ONEchestnutHORSE empty saddle led EAST/right bywalking Texianhelper (creamshirt brownhat greytrousers), FOURdistinctwalk footfalls horseandhelper reinsactuallyconnected. EmptySADDLE no body in it. Add ONEsolid brightCYANsmallroundsocketdot floatingwhere neckofseatedriderwouldbe ABOVE empty saddle at riderneckheight, noothercyan. ROW2 TWOunarmedTexianHELPERS carryingEMPTYcreamlinen blanketstretcher EAST/right FOURdifferent alternatingwalkingfootfalls; sturdywood poles continuousbetweenhands blankettaut noextrahands nopatientcorpsebodyhead. ONEbrightCYANsmallroundsocketdot at wouldbepatientNECK at LEFT/headend blanket slightlyABOVEits surface. Everywholehorse+helper orbearerpairfitscentral50percentwidth55percentheight owncell 80pxalpha0gutters. Exactly8 separatedwholecomponents. Actualnormalcolors notmaterialcoded besidescyanregisterdot. No labeltextgridshadowgroundgore. WESTmirrorsEast.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-a85fc4b8-440c-44ae-9cea-70777adb944f.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/family-transport-components.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-camp-grown",
    "promptId": "frontier-v1/rig-camp-grown",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep anatomical size constant acrossposes, seated/sleepingbodies do not growtofillcells. NO HEADS, onlyneckstump andone CYAN attachment dot eachbody. FOURcolumns FOURrows16HEADLESSbodies. Rows adultmale shirttrousersboots; adultfemale longdressapronshoes; adolescentboy slightbuildshirttrousersboots; adolescentgirl slightbuilddressapron. Cols1/2 HEALTHYcampREST seatedrelaxed kneesbent handsrestlap thenhandsadjustlap;cols3/4 HEALTHYSLEEPlyingonside curlgentlywithcreamGREYblanket overlegs,calmloosehands, two slightblanketfoldposes, NOTdeadshroud nothurt. HeadneckslotCYAN followsactualneck atLEFT/headend allrecliningposes. ClothesGREEN exposedskinRED fixedleatherbootsYELLOW barefeetRED linenGREY, metalgrey. Noheadhair hat face bedfloor campfire scenery. Sameagebodyproportionswithinrow, newbornonlyswaddle noseatedadult limbs. Fullbody/generousalpha0gutter.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-df7e14b2-a1ec-4d23-8713-029c8aa4c639.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-camp-grown.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-camp-children",
    "promptId": "frontier-v1/rig-camp-children",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep anatomical size constant acrossposes, seated/sleepingbodies do not growtofillcells. NO HEADS, onlyneckstump andone CYAN attachment dot eachbody. FOURcolumns FOURrows16HEADLESSbodies. Rows schoolageBOYchildshortlimbs suspendersshorttrousersbarefeet; schoolageGIRLchildshortlimbs longdressapronshoes; preschoolTODDLERchubbyshortarmslegs longshirtbarefeet; NEWBORNinfantcreamGREYswaddlebody noarmslegswalking. Cols1/2 HEALTHYcampREST seatedrelaxed kneesbent handsrestlap thenhandsadjustlap;cols3/4 HEALTHYSLEEPlyingonside curlgentlywithcreamGREYblanket overlegs,calmloosehands, two slightblanketfoldposes, NOTdeadshroud nothurt. HeadneckslotCYAN followsactualneck atLEFT/headend allrecliningposes. ClothesGREEN exposedskinRED fixedleatherbootsYELLOW barefeetRED linenGREY, metalgrey. Noheadhair hat face bedfloor campfire scenery. Sameagebodyproportionswithinrow, newbornonlyswaddle noseatedadult limbs. Fullbody/generousalpha0gutter.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-2f94c61c-0541-4654-9a7d-af6128466ce0.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-camp-children.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-adult-male-mounted-service",
    "promptId": "frontier-v1/rig-adult-male-mounted-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep anatomical size constant acrossposes, seated/sleepingbodies do not growtofillcells. NO HEADS, onlyneckstump andone CYAN attachment dot eachbody. FOURcolumns THREErows12HEADLESS adult-male civilian BODYlayers forfiringslowreloadfromsaddle. ROW1 EAST/right profile ROW2 SOUTH/front ROW3 NORTH/rear. Eachrow cols1 AIMSflintlockcarbine shouldered,2 FIREsmallshoulderrecoil,3 LOADmuzzleupcartridge whilelegsremainseated,4 RAMRODmuzzleupholdingbothhands. Kneesbentstraddleinvisiblesaddle feetbootsdownstirrups, womenlongskirtmodestlydrapeslegs. NO paintedhorse floor saddle orhead. ClothingGREEN skinRED fixedriflewoodbootsYELLOW metalGREY. CorrectTWOarms noextrafingers, exactbodyagegenderreferenceproportion noadultwomanonteenagegirl. CYANnecksocketvisible abovecollar exactneckpoint nothandsweapon. Allbodyparts central50percentwidth55percentheight owncell with75pxalpha0gutters. Distinctposes and no gore.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-9f9eb619-ba0a-45b7-869d-cdfe50f6241e.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-male-mounted-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-adult-female-mounted-service",
    "promptId": "frontier-v1/rig-adult-female-mounted-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep anatomical size constant acrossposes, seated/sleepingbodies do not growtofillcells. NO HEADS, onlyneckstump andone CYAN attachment dot eachbody. FOURcolumns THREErows12HEADLESS adult-female civilian BODYlayers forfiringslowreloadfromsaddle. ROW1 EAST/right profile ROW2 SOUTH/front ROW3 NORTH/rear. Eachrow cols1 AIMSflintlockcarbine shouldered,2 FIREsmallshoulderrecoil,3 LOADmuzzleupcartridge whilelegsremainseated,4 RAMRODmuzzleupholdingbothhands. Kneesbentstraddleinvisiblesaddle feetbootsdownstirrups, womenlongskirtmodestlydrapeslegs. NO paintedhorse floor saddle orhead. ClothingGREEN skinRED fixedriflewoodbootsYELLOW metalGREY. CorrectTWOarms noextrafingers, exactbodyagegenderreferenceproportion noadultwomanonteenagegirl. CYANnecksocketvisible abovecollar exactneckpoint nothandsweapon. Allbodyparts central50percentwidth55percentheight owncell with75pxalpha0gutters. Distinctposes and no gore.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-mother-braid.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-baf4a96d-caee-4fbc-9a58-9821b00860b3.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-adult-female-mounted-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-03d43d53-9b2c-407c-944b-a66382120918.png",
    "refinements": [
      {
        "prompt": "Precise atlas CORRECTION. Preserve EXACT original grid, all  components, bodyagegenderproportions poseordering directions costumes tools and semanticmaterial hues: REDskin GREENclothes BLUEhair YELLOWfixedwood/leather neutralGREYlinen/metal darkink. UNIFORMLY SHRINK EVERYwhole component INCLUDINGtools weaponrod braid boots hat to60percentCURRENTsize andcentereachitsORIGINALequalcell. FullvisiblepixelsONLYcentral55percentcellwidth55percentheight, at least75px TRUEalpha0 gutters everyrowcolumnboundaryandouteredges. No clipping overlapping merging objects. CRITICAL ONEbrightCYAN #00ffff solidroundnecksocketdot percomponent atrealneckattachment, 4percentbody/headheight; preserve ifpresent andADD ifmissing. Noothercyanpixels. Inheadcomponents dotatBOTTOMneck; inheadlessbodies dotaboveNECKstump at exactheadjoint evenifhands/weaponnearby; NOTonhandsorweapon. Keep eachdotfullyvisible insideowncell. Do not add heads toheadlessbodies. Preserve SAMEbodysizewithinposes and distinctanimationhandlegphases. Backgroundalpha0 ratherthanpaintedblack/white/checkerboard. No extra faceslabelsgridsgroundshadows."
      }
    ]
  },
  {
    "sheet": "rig-youth-male-mounted-service",
    "promptId": "frontier-v1/rig-youth-male-mounted-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep anatomical size constant acrossposes, seated/sleepingbodies do not growtofillcells. NO HEADS, onlyneckstump andone CYAN attachment dot eachbody. FOURcolumns THREErows12HEADLESS youth-male civilian BODYlayers forfiringslowreloadfromsaddle. ROW1 EAST/right profile ROW2 SOUTH/front ROW3 NORTH/rear. Eachrow cols1 AIMSflintlockcarbine shouldered,2 FIREsmallshoulderrecoil,3 LOADmuzzleupcartridge whilelegsremainseated,4 RAMRODmuzzleupholdingbothhands. Kneesbentstraddleinvisiblesaddle feetbootsdownstirrups, womenlongskirtmodestlydrapeslegs. NO paintedhorse floor saddle orhead. ClothingGREEN skinRED fixedriflewoodbootsYELLOW metalGREY. CorrectTWOarms noextrafingers, exactbodyagegenderreferenceproportion noadultwomanonteenagegirl. CYANnecksocketvisible abovecollar exactneckpoint nothandsweapon. Allbodyparts central50percentwidth55percentheight owncell with75pxalpha0gutters. Distinctposes and no gore.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-c182dbe9-9d10-46fd-b2e9-eea71be8c117.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-male-mounted-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-97fa96d8-2712-4c26-9832-1074d4c2c2b9.png",
    "refinements": [
      {
        "prompt": "Precise atlas CORRECTION. Preserve EXACT original grid, all  components, bodyagegenderproportions poseordering directions costumes tools and semanticmaterial hues: REDskin GREENclothes BLUEhair YELLOWfixedwood/leather neutralGREYlinen/metal darkink. UNIFORMLY SHRINK EVERYwhole component INCLUDINGtools weaponrod braid boots hat to60percentCURRENTsize andcentereachitsORIGINALequalcell. FullvisiblepixelsONLYcentral55percentcellwidth55percentheight, at least75px TRUEalpha0 gutters everyrowcolumnboundaryandouteredges. No clipping overlapping merging objects. CRITICAL ONEbrightCYAN #00ffff solidroundnecksocketdot percomponent atrealneckattachment, 4percentbody/headheight; preserve ifpresent andADD ifmissing. Noothercyanpixels. Inheadcomponents dotatBOTTOMneck; inheadlessbodies dotaboveNECKstump at exactheadjoint evenifhands/weaponnearby; NOTonhandsorweapon. Keep eachdotfullyvisible insideowncell. Do not add heads toheadlessbodies. Preserve SAMEbodysizewithinposes and distinctanimationhandlegphases. Backgroundalpha0 ratherthanpaintedblack/white/checkerboard. No extra faceslabelsgridsgroundshadows."
      }
    ]
  },
  {
    "sheet": "rig-youth-female-mounted-service",
    "promptId": "frontier-v1/rig-youth-female-mounted-service",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. Keep anatomical size constant acrossposes, seated/sleepingbodies do not growtofillcells. NO HEADS, onlyneckstump andone CYAN attachment dot eachbody. FOURcolumns THREErows12HEADLESS youth-female civilian BODYlayers forfiringslowreloadfromsaddle. ROW1 EAST/right profile ROW2 SOUTH/front ROW3 NORTH/rear. Eachrow cols1 AIMSflintlockcarbine shouldered,2 FIREsmallshoulderrecoil,3 LOADmuzzleupcartridge whilelegsremainseated,4 RAMRODmuzzleupholdingbothhands. Kneesbentstraddleinvisiblesaddle feetbootsdownstirrups, womenlongskirtmodestlydrapeslegs. NO paintedhorse floor saddle orhead. ClothingGREEN skinRED fixedriflewoodbootsYELLOW metalGREY. CorrectTWOarms noextrafingers, exactbodyagegenderreferenceproportion noadultwomanonteenagegirl. CYANnecksocketvisible abovecollar exactneckpoint nothandsweapon. Allbodyparts central50percentwidth55percentheight owncell with75pxalpha0gutters. Distinctposes and no gore.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-family-mother-braid.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-df4cc4ce-5fa6-4c99-b31f-55e423b8bf60.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-youth-female-mounted-service.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-capture-poses",
    "promptId": "frontier-v1/rig-capture-poses",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. FOURcolumns FOURrows16HEADLESS bodylayers noheadfacehair. PairsofSURRENDERopenhandsraised then slightlylowered, emptyhandsnonthreatening no weapons. Row1 adultMALEpaircols1/2 adultFEMALEpaircols3/4;Row2 youthMALEpair/youthFEMALEpair;Row3 CHILDschoolageboypair/CHILDschoolagegirlpair;Row4 preschoolTODDLERpair tinyhandsup, NEWBORNpair swaddleonlyhandscovered noadultstance. Modestcivilian1835 clothes shirttrousers forboys/males longdressapronforgirls/women toddlerlongshirt babycreamGREYwrap. SkinREDclothesGREENfixedbootsYELLOWbarefeetRED. EveryneckstumpCYANsocketonecircle; samebodysizeperpair changesarms only. NO head horsebodytable floor objectsbloodgore trauma labelsgrid. Fullbody central50percentwidth55percentheight independentcells generous75pxalphagutters. Actualageproportions dontputchildinadultbody.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-dc7a404a-fac1-4a59-b934-54e516c39b6f.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-capture-poses.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  },
  {
    "sheet": "rig-sow-poses",
    "promptId": "frontier-v1/rig-sow-poses",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate + correction",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. FOURcolumns FOURrows16HEADLESS bodies TWOdistincttaskposes eachtype. Row1 adultmale paircols1/2 adultfemale paircols3/4;Row2 adolescentboypair/adolescentgirlpair;Row3 schoolageBOYchildpair/schoolageGIRLchildpair;Row4 preschoolTODDLERpair/NEWBORNswaddlepair (baby onlygentlewrapmovement notworking). All NORTHneckbody noheads: action EAST/rightprofile, cyanneckdot atrealstump. SOWING: onehand holds small clothseedbag other scatters tinyplainseeds towardground thenreturns tobag; preschoolonehandwith2seeds playing noadultlabor. AllclothingGREEN exposedskinRED fixedwoodleatherbootsYELLOW apronlinenGREY metalGREY, seedsplantsNEUTRALgray NOTcyan/greenmaterial hue. FullageappropriateBODY dims shortchildlimbs noadultmodels, newbornnolimbswalkingtools. Noheadhairhat floor groundshadows extrapeople textgrid. Fixed samephysicalscaleeachrownevertaskposegrows. Completecentral50percentcellwidth55percentheight75pxalpha0gutters.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-cb08d4ba-cd06-438a-ab6a-a2b1e0a8a5d3.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-sow-poses.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only.",
    "originalSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-19491b0c-c09f-4dc9-9892-694dcb53b3f9.png",
    "refinements": [
      {
        "prompt": "Precise atlas CORRECTION. Preserve EXACT original grid, all 16 components, bodyagegenderproportions poseordering directions costumes tools and semanticmaterial hues: REDskin GREENclothes BLUEhair YELLOWfixedwood/leather neutralGREYlinen/metal darkink. REMOVE ALLBACKGROUND including opaqueblack completely totruealpha0, no shadowfloor. Row1adultmanpair/adultwomanpair,row2teenboy/teengirl,row3schoolageboy/girl,row4toddlerpair/babyswaddlepair remain. SOWgesture bodies allEAST/right, no head. UNIFORMLY SHRINK EVERYwhole component INCLUDINGtools weaponrod braid boots hat to60percentCURRENTsize andcentereachitsORIGINALequalcell. FullvisiblepixelsONLYcentral55percentcellwidth55percentheight, at least75px TRUEalpha0 gutters everyrowcolumnboundaryandouteredges. No clipping overlapping merging objects. CRITICAL ONEbrightCYAN #00ffff solidroundnecksocketdot percomponent atrealneckattachment, 4percentbody/headheight; preserve ifpresent andADD ifmissing. Noothercyanpixels. Inheadcomponents dotatBOTTOMneck; inheadlessbodies dotaboveNECKstump at exactheadjoint evenifhands/weaponnearby; NOTonhandsorweapon. Keep eachdotfullyvisible insideowncell. Do not add heads toheadlessbodies. Preserve SAMEbodysizewithinposes and distinctanimationhandlegphases. Backgroundalpha0 ratherthanpaintedblack/white/checkerboard. No extra faceslabelsgridsgroundshadows."
      }
    ]
  },
  {
    "sheet": "rig-harvest-poses",
    "promptId": "frontier-v1/rig-harvest-poses",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate",
    "prompt": "Production CHARACTER RIG component sprites, warm dark ink softly brushed illustrated 1835 frontiergame matching reference. Use SEMANTIC MATERIAL COLORS ONLY: exposedSKIN shaded RED (pure red hue #ff0000), CLOTHES shaded GREEN (#00ff00), HAIR shaded BLUE (#0000ff), fixed leather/wood/hat shaded YELLOW (#ffff00), metal linen eyes greyscale, ink darkgreyscale. Strong pure hues allow exact runtime material tinting back to warm earthpalette. Keep texture/lights by varying brightness within SAME hue, no mixedhue skin/clothes, no brown pigment. Background true alpha0. These are deliberately materialcoded painted components, not finalcolor art. No textgridlabels shadows floor scenery. Exactly specifiedgrid/count, wholecomponentscentral50percentwidth55percentheight with75pxalpha0gutters. CRITICAL: one small BRIGHT CYAN (#00ffff) solid ROUND registrationdot at exact NECK attachment point per component, not elsewhere, visible3percent ofcomponentheight. Cyan is a socket marker removed at runtime; never usecyan for any other material. FOURcolumns FOURrows16HEADLESS bodies TWOdistincttaskposes eachtype. Row1 adultmale paircols1/2 adultfemale paircols3/4;Row2 adolescentboypair/adolescentgirlpair;Row3 schoolageBOYchildpair/schoolageGIRLchildpair;Row4 preschoolTODDLERpair/NEWBORNswaddlepair (baby onlygentlewrapmovement notworking). All NORTHneckbody noheads: action EAST/rightprofile, cyanneckdot atrealstump. HARVEST: adult/youth bentgently holdingsmallhand-sickle lowinonehand cutplantthenliftbundle secondpose; schoolagechildren pickgreenswithoutblade, preschoolholdsoneplant noadultlabor. AllclothingGREEN exposedskinRED fixedwoodleatherbootsYELLOW apronlinenGREY metalGREY, seedsplantsNEUTRALgray NOTcyan/greenmaterial hue. FullageappropriateBODY dims shortchildlimbs noadultmodels, newbornnolimbswalkingtools. Noheadhairhat floor groundshadows extrapeople textgrid. Fixed samephysicalscaleeachrownevertaskposegrows. Completecentral50percentcellwidth55percentheight75pxalpha0gutters.",
    "referenced_image_paths": [
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-walk.png",
      "C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-children-idle.png"
    ],
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-1fdaa1d8-63a8-4a85-a8b7-53c838b4bc10.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/rig-harvest-poses.png",
    "postProcessing": "None; generated RGBA material components copied unchanged. Tint and socket composition at runtime only."
  }
];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['Complete canonical family appearance and battle rig: semantic material-coded bodies, directional heads, explicit sockets, age-specific work/service and separate living/dead transport. Use composed aliases through art.js, never raw material-coded PNGs.'];

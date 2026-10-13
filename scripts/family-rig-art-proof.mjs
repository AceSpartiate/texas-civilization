import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {SHEETS,ANIMATION_CLIPS,HEAD_GROUPS,IDENTITIES,FRAME_ALIASES} from './art-deliveries/family-rig-complete-2026-10-13.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'family-rig-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1400,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const result=await page.evaluate(async({sheets,clips,groups,identities,aliases})=>{
  const {loadArt,drawSprite,drawClip,spriteFrame}=await import('/art.js');await loadArt({sheets:Object.keys(sheets)});
  const {drawAvatarPortrait,drawAvatarFigure}=await import('/avatar-art.js');
  const root=document.createElement('section');root.id='family-rig-proof';root.style.cssText='position:fixed;left:10px;top:10px;z-index:999999;background:#afb17a';document.body.append(root);
  const appearance={skin:'tan',hair:'brown',clothing:'indigo'},widths=[],phases=[],border=[];
  const scratch=document.createElement('canvas');scratch.width=360;scratch.height=300;const sc=scratch.getContext('2d',{willReadFrequently:true});
  for(const [id,c]of Object.entries(clips)){
   let t=0;const hashes=[];for(const f of c.frames){sc.clearRect(0,0,360,300);widths.push(drawClip(sc,id,180,240,65,{timeMs:t,appearance}));const data=sc.getImageData(0,0,360,300).data;let hash=2166136261,edges=0;
    for(let i=0;i<data.length;i+=4){if(data[i+3]){hash=Math.imul(hash^data[i],16777619);hash=Math.imul(hash^data[i+1],16777619);hash=Math.imul(hash^data[i+2],16777619);const p=i/4,x=p%360,y=Math.floor(p/360);if(x===0||x===359||y===0||y===299)edges++;}}
    hashes.push(hash>>>0);if(edges)border.push({clip:id,sprite:f.sprite,edges});
    sc.clearRect(0,0,360,300);widths.push(drawClip(sc,id,180,240,65,{timeMs:t,appearance,flip:true}));
    const transform=sc.getTransform();if(transform.a!==1||transform.b!==0||transform.c!==0||transform.d!==1||Math.abs(transform.e)>1e-8||Math.abs(transform.f)>1e-8)throw new Error('leaked transform: '+id);
    t+=f.duration;
   }phases.push({id,distinct:new Set(hashes).size,expected:c.frames.length,authored:c.authored});
  }
  for(const id of Object.keys(aliases)){sc.clearRect(0,0,360,300);widths.push(drawSprite(sc,id,180,240,65,{appearance}));if(!sc.getImageData(0,0,360,300).data.some((v,i)=>i%4===3&&v))throw new Error('empty alias: '+id);}
  const palettes=[{skin:'fair',hair:'red',clothing:'cream'},{skin:'deep brown',hair:'grey',clothing:'forest'}];
  const panels=[];
  const chooser=document.createElement('canvas');chooser.id='rig-creation';chooser.width=1320;chooser.height=920;root.append(chooser);const cc=chooser.getContext('2d');cc.fillStyle='#afb17a';cc.fillRect(0,0,1320,920);
  const heads={male:['hat','beard','moustache','straw hat','hat and beard','bareheaded'],female:['bonnet','braid','loose hair','headscarf','straw hat','pinned hair']};
  let col=0;for(const [sex,options]of Object.entries(heads))for(const head of options){const person={sex,band:'adult'},a={skin:'tan',hair:'brown',clothing:'teal',head};const portrait=document.createElement('canvas');portrait.width=100;portrait.height=120;drawAvatarPortrait(portrait,a,sex,person);cc.drawImage(portrait,(col%12)*110,20);const figure=document.createElement('canvas');figure.width=100;figure.height=180;drawAvatarFigure(figure,a,sex,person);cc.drawImage(figure,(col%12)*110,150);col++;}
  for(const [i,band]of ['infant','small','child','youth','adult'].entries())for(const [s,sex]of ['female','male'].entries()){const c=document.createElement('canvas');c.width=100;c.height=180;drawAvatarFigure(c,{skin:'brown',hair:'black',clothing:'plum',head:'braid'},sex,{band});cc.drawImage(c,i*240+s*110,380);}
  chooser.style.display='none';panels.push(chooser.id);
  for(const [group,ids]of Object.entries({...groups,little:['smallchild','infant']}))for(const mode of ['identity','states']){
   const c=document.createElement('canvas');c.id=`rig-${group}-${mode}`;c.width=1320;c.height=ids.length*220+40;root.append(c);const ctx=c.getContext('2d');ctx.fillStyle='#afb17a';ctx.fillRect(0,0,c.width,c.height);ctx.font='15px serif';ctx.fillStyle='#29382d';ctx.fillText(`Family rig / ${group} / ${mode}`,20,24);
   for(const [row,id]of ids.entries()){
    const adult=['adult-male','adult-female','youth-male','youth-female'].includes(identities[id]);
    const poses=mode==='identity'?['idle-s',id==='infant'?'camp-rest':'sow',adult?'fire-reload':'camp-rest','camp-sleep']:['wounded','carry-living','carry-dead',identities[id]==='infant'||id==='smallchild'?'camp-sleep':'led-wounded'];
    for(const [col,p]of poses.entries()){ctx.fillStyle='#29382d';ctx.fillText(`${id}: ${p}`,col*330+15,row*220+52);widths.push(drawClip(ctx,`${id}-rig-${p}`,col*330+165,row*220+205,100,{appearance:palettes[row%2],timeMs:p==='fire-reload'?705:500}));}
   }c.style.display='none';panels.push(c.id);
  }
  return {widths,phases,border,panels,parts:Object.values(sheets).flat().length,identities:Object.keys(identities).length};
 },{sheets:SHEETS,clips:ANIMATION_CLIPS,groups:HEAD_GROUPS,identities:IDENTITIES,aliases:FRAME_ALIASES});
 assert.ok(result.widths.every(w=>w>0),'every referenced frame must render');assert.deepEqual(result.border,[],'complete assemblies fit the proof canvas');
 for(const p of result.phases)if(p.authored)assert.equal(p.distinct,p.expected,p.id);assert.deepEqual(errors,[]);
 for(const panel of result.panels){await page.locator('#'+panel).evaluate(c=>c.style.display='block');await page.locator('#'+panel).screenshot({path:`docs/evidence/${panel}.png`});await page.locator('#'+panel).evaluate(c=>c.style.display='none');}
 const gatePage=await browser.newPage();let release;const held=new Promise(r=>release=r);await gatePage.route('**/rig-heads-fathers.png?*',async route=>{await held;await route.continue();});await gatePage.goto(`http://127.0.0.1:${port}`);
 const gate=await gatePage.evaluate(async()=>{const {loadArt,clipReady,drawClip}=await import('/art.js');await loadArt({sheets:['rig-adult-male-locomotion']});const c=document.createElement('canvas');c.width=200;c.height=200;const ctx=c.getContext('2d');return {ready:clipReady('father-beard-rig-idle-s'),width:drawClip(ctx,'father-beard-rig-idle-s',100,180,100,{appearance:{skin:'tan'}}),painted:ctx.getImageData(0,0,200,200).data.some((v,i)=>i%4===3&&v)};});
 assert.deepEqual(gate,{ready:false,width:0,painted:false},'missing head cannot produce a headless character');release();await gatePage.waitForFunction(async()=>{const {clipReady}=await import('/art.js');return clipReady('father-beard-rig-idle-s');});await gatePage.close();
 writeFileSync('docs/evidence/family-rig-art.json',JSON.stringify({verdict:'PASS',...result,aliases:Object.keys(FRAME_ALIASES).length,dependencyGate:'PASS',errors},null,2));console.log(`PASS ${result.parts} painted components, ${result.identities} identities, ${result.phases.length} clips, ${Object.keys(FRAME_ALIASES).length} assemblies and head dependency gate.`);
}finally{await browser?.close();await app.close();}

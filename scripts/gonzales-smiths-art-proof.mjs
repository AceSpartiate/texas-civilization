import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {createGonzalesWorld} from '../sim/gonzales.mjs';
import {townScenesFor,on,SCENE_ARRIVAL} from '../sim/town-scenes.mjs';
import {SHEETS,ANIMATION_CLIPS} from './art-deliveries/gonzales-smiths-2026-10-04.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({playerCount:5,seed:'gonzales-smiths-art-proof'}),port=await app.listen(0,'127.0.0.1');
let browser;
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:960,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async({sheets,clips})=>{
  const {loadArt,drawSprite,drawClip,spriteFrame}=await import('/art.js');await loadArt({sheets:Object.keys(sheets)});
  const canvas=document.createElement('canvas');canvas.id='smith-proof';canvas.width=960;canvas.height=1000;
  canvas.style.cssText='position:fixed;left:0;top:0;z-index:99999';document.body.append(canvas);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#eee3c5';ctx.fillRect(0,0,960,1000);
  const frames=[],animations=[];
  for(const [i,id] of Object.values(sheets).flat().entries()) {
   const x=i%4*240,y=Math.floor(i/4)*200,f=spriteFrame(id);
   const height=Math.min(160,210*(f.logicalHeight||f.h)/f.w);
   const drawn=drawSprite(ctx,id,x+120,y+190,height,{anchor:[.5,1]});
   ctx.fillStyle='#493824';ctx.font='11px monospace';ctx.fillText(id,x+7,y+16);
   frames.push({id,drawn:drawn>0});
  }
  for(const [id,clip] of Object.entries(clips)) {
   const tmp=document.createElement('canvas');tmp.width=tmp.height=300;const tc=tmp.getContext('2d');
   const f=spriteFrame(clip.frames[0].sprite),height=Math.min(240,270*(f.logicalHeight||f.h)/f.w);
   const aDraw=drawClip(tc,id,150,280,height,{timeMs:0,seed:0}),a=tmp.toDataURL();tc.clearRect(0,0,300,300);
   const bDraw=drawClip(tc,id,150,280,height,{timeMs:clip.frames[0].duration+10,seed:0}),b=tmp.toDataURL();
   animations.push({id,drawn:aDraw>0&&bDraw>0,changed:a!==b});
  }
  return {frames,animations};
 },{sheets:SHEETS,clips:ANIMATION_CLIPS});
 assert.equal(proof.frames.length,20);assert.equal(proof.animations.length,4);
 assert.ok(proof.frames.every(f=>f.drawn));assert.ok(proof.animations.every(a=>a.drawn&&a.changed),JSON.stringify(proof.animations.filter(a=>!a.drawn||!a.changed)));
 assert.deepEqual(errors,[]);mkdirSync('docs/evidence',{recursive:true});
 await page.locator('#smith-proof').screenshot({path:'docs/evidence/gonzales-smiths-art.png'});
 writeFileSync('docs/evidence/gonzales-smiths-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));
 const world=createGonzalesWorld('smith-scene-proof',5,{map:'colonies'});
 world.minute=on(1,15)+(world.director?.arrival?SCENE_ARRIVAL:0);
 const scene=townScenesFor(world,null,'host');
 const live=await page.evaluate(async scene=>{
  const {loadArt}=await import('/art.js');await loadArt({sheets:['people-gonzales-smiths','gonzales-smith-props','people-dialogue','people-cast2-dialogue','cannon-cartwheels','wagon-rig']});
  const {TownWalker,townSceneDrawables}=await import('/town-scenes.js');
  const c=document.createElement('canvas');c.id='smith-scene-proof';c.width=900;c.height=500;
  c.style.cssText='position:fixed;left:0;top:0;z-index:100000';document.body.append(c);
  const ctx=c.getContext('2d'),center=scene.scenes.find(s=>s.id==='cannon'),walker=new TownWalker();
  scene.people=scene.people.filter(p=>p.sceneId==='cannon');scene.props=scene.props.filter(p=>['cannon','wheel','smith-forge'].includes(p.kind));
  const opts={toScreen:p=>({x:450+(p.x-center.x)*3000,y:260+(p.y-center.y)*3000}),figure:60,scale:3000,walker,frozen:true};
  townSceneDrawables(ctx,scene,{...opts,now:0});
  ctx.fillStyle='#b9aa75';ctx.fillRect(0,0,900,500);const evidence=[];
  for(const item of townSceneDrawables(ctx,scene,{...opts,now:2000,evidence}).sort((a,b)=>a.y-b.y)) item.draw();
  return evidence;
 },scene);
 for(const id of ['ochre-smith-hammer','elder-smith-chain']) assert.ok(live.some(p=>p.clip===id));
 await page.locator('#smith-scene-proof').screenshot({path:'docs/evidence/gonzales-smiths-scene.png'});
 writeFileSync('docs/evidence/gonzales-smiths-scene.json',JSON.stringify({verdict:'PASS',people:live},null,2));
 console.log('PASS: 20 frames rendered; all 4 clips change pixels; live shop scene selects smith art.');
} finally {await browser?.close();await app.close();}

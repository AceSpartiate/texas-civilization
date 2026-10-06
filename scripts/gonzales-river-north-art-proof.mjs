import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {SHEETS,ANIMATION_CLIPS} from './art-deliveries/gonzales-river-north-2026-10-05.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({playerCount:5,seed:'gonzales-river-north-art-proof'}),port=await app.listen(0,'127.0.0.1');
let browser;
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:960,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async({sheets,clips})=>{
  const {loadArt,drawSprite,drawClip,spriteFrame}=await import('/art.js');await loadArt({sheets:Object.keys(sheets)});
  const canvas=document.createElement('canvas');canvas.id='river-north-proof';canvas.width=960;canvas.height=800;
  canvas.style.cssText='position:fixed;left:0;top:0;z-index:99999';document.body.append(canvas);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#eee3c5';ctx.fillRect(0,0,960,800);
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
 assert.equal(proof.frames.length,16);assert.equal(proof.animations.length,8);
 assert.ok(proof.frames.every(f=>f.drawn));assert.ok(proof.animations.every(a=>a.drawn&&a.changed),JSON.stringify(proof.animations.filter(a=>!a.drawn||!a.changed)));
 assert.deepEqual(errors,[]);mkdirSync('docs/evidence',{recursive:true});
 await page.locator('#river-north-proof').screenshot({path:'docs/evidence/gonzales-river-north-art.png'});
 writeFileSync('docs/evidence/gonzales-river-north-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));
 console.log('PASS: sixteen river gesture frames render and eight clips change pixels.');
} finally {await browser?.close();await app.close();}

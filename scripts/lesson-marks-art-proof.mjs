import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {SHEETS,ANIMATION_CLIPS} from './art-deliveries/lesson-marks-2026-10-07.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({playerCount:5,seed:'lesson-marks-art-proof'}),port=await app.listen(0,'127.0.0.1');
let browser;
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:960,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async({sheets,clips})=>{
  const {loadArt,drawSprite,drawClip,spriteFrame}=await import('/art.js');await loadArt({sheets:Object.keys(sheets)});
  const canvas=document.createElement('canvas');canvas.id='lesson-marks-proof';canvas.width=960;canvas.height=400;
  canvas.style.cssText='position:fixed;left:0;top:0;z-index:99999';document.body.append(canvas);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#eee3c5';ctx.fillRect(0,0,960,400);
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
 assert.equal(proof.frames.length,4);assert.equal(proof.animations.length,0);
 assert.ok(proof.frames.every(f=>f.drawn));assert.ok(proof.animations.every(a=>a.drawn&&a.changed),JSON.stringify(proof.animations.filter(a=>!a.drawn||!a.changed)));
 assert.deepEqual(errors,[]);mkdirSync('docs/evidence',{recursive:true});
 await page.locator('#lesson-marks-proof').screenshot({path:'docs/evidence/lesson-marks-art.png'});
 const ui=await page.evaluate(async()=>{
  const {drawSprite,spriteFrame,loadArt}=await import('/art.js'),{drawMark}=await import('/family-panel.js');
  await loadArt({sheets:['icons-children']});
  const root=document.createElement('div');root.id='lesson-ui-proof';root.style.cssText='position:fixed;inset:0;z-index:100001;background:#eee3c5;padding:50px;display:flex;gap:60px;align-items:center;justify-content:center';document.body.append(root);
  let centerClear=false;
  for(const [i,bg] of ['#748549','#bf9a61','#624831'].entries()){
   const tile=document.createElement('div');tile.style.cssText=`background:${bg};width:180px;height:210px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:30px`;root.append(tile);
   const button=document.createElement('button');button.className='panel-icon';button.dataset.pointed='true';button.dataset.lessonArt='true';button.style.cssText='flex:none;width:48px;height:48px';button.setAttribute('aria-label','Gather water. This is the step to do now.');
   const icon=document.createElement('canvas');icon.width=icon.height=48;drawMark(icon,'icon-child-water',{drawSprite,spriteFrame});button.append(icon);
   for(const [name,cls] of [['lesson-ring','lesson-ring-art'],['lesson-point','lesson-point-art']]){
    const node=document.createElement('span'),canvas=document.createElement('canvas');node.className=cls;node.dataset.drawn='true';canvas.width=canvas.height=48;drawMark(canvas,name,{drawSprite,spriteFrame});node.append(canvas);button.append(node);
    if(name==='lesson-ring')centerClear=canvas.getContext('2d').getImageData(24,24,1,1).data[3]===0;
   }
   tile.append(button);const pips=document.createElement('div');pips.style.cssText='display:flex;gap:8px';tile.append(pips);
   for(const name of ['lesson-pip','lesson-pip-done']){const node=document.createElement('span'),c=document.createElement('canvas');node.className='lesson-pip';node.dataset.drawn='true';c.width=c.height=48;drawMark(c,name,{drawSprite,spriteFrame});node.append(c);pips.append(node);}
  }
  return {centerClear,nonBlocking:[...root.querySelectorAll('.lesson-ring-art,.lesson-point-art')].every(n=>getComputedStyle(n).pointerEvents==='none')};
 });assert.ok(ui.centerClear&&ui.nonBlocking);
 for(const width of [1366,1024]){await page.setViewportSize({width,height:768});await page.locator('#lesson-ui-proof').screenshot({path:`docs/evidence/lesson-marks-ui-${width}.png`});}
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.lesson-point-art').first().evaluate(n=>getComputedStyle(n).animationName),'none');
 writeFileSync('docs/evidence/lesson-marks-art.json',JSON.stringify({verdict:'PASS',...proof,ui,errors},null,2));
 console.log('PASS: four lesson marks render.');
} finally {await browser?.close();await app.close();}

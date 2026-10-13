import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {SHEETS,ANIMATION_CLIPS} from './art-deliveries/named-refinements-complete-2026-10-12.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'named-refinements-art',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1150,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async({sheets,clips})=>{
  const {loadArt,drawClip,drawSprite}=await import('/art.js');await loadArt({sheets:Object.keys(sheets)});
  const root=document.createElement('section');root.id='named-art-proof';root.style.cssText='position:fixed;inset:10px auto auto 10px;background:#afb06f;z-index:999999;padding:12px';document.body.append(root);
  const widths=[],phases=[];for(const [sheet,names] of Object.entries(sheets)){
   const c=document.createElement('canvas');c.id=sheet;c.width=1000;c.height=Math.ceil(names.length/4)*145+35;root.append(c);const ctx=c.getContext('2d');ctx.fillStyle='#afb06f';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#29382d';ctx.font='16px serif';ctx.fillText(sheet,20,25);
   for(const [i,name] of names.entries())widths.push(drawSprite(ctx,name,125+(i%4)*250,150+Math.floor(i/4)*145,110));c.style.display='none';
  }
  for(const [id,clip] of Object.entries(clips)){
   let t=0;const images=[];for(const f of clip.frames){const c=document.createElement('canvas');c.width=300;c.height=300;const ctx=c.getContext('2d');widths.push(drawClip(ctx,id,150,280,150,{timeMs:t}));images.push(c.toDataURL());t+=f.duration;}phases.push({clip:id,distinct:new Set(images).size,expected:clip.frames.length});
  }
  return {widths,phases,frames:Object.values(sheets).flat().length};
 },{sheets:SHEETS,clips:ANIMATION_CLIPS});
 assert.ok(proof.widths.every(w=>w>0));for(const p of proof.phases)assert.equal(p.distinct,p.expected,p.clip);assert.deepEqual(errors,[]);
 for(const sheet of Object.keys(SHEETS)){await page.locator('#'+sheet).evaluate(c=>c.style.display='block');await page.locator('#'+sheet).screenshot({path:`docs/evidence/${sheet}-proof.png`});await page.locator('#'+sheet).evaluate(c=>c.style.display='none');}
 writeFileSync('docs/evidence/named-refinements-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log(`PASS: ${proof.frames} frames, ${proof.phases.length} distinct authored loops, no browser errors.`);
}finally{await browser?.close();await app.close();}

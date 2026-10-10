import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'camp-art-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1100,height:1150}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {loadArt,drawClip,drawSprite,spriteFrame}=await import('/art.js'),{drawArmy}=await import('/army-view.js');
  await loadArt({sheets:['army-camp-props','army-camp-pennants','field-cover-camp-props']});
  const animation=await (await fetch('/assets/frontier-v1/animation.json')).json();
  await loadArt({sheets:[...new Set(['volunteer-idle-e','regular-idle-w'].map(n=>spriteFrame(animation.clips[n].frames[0].sprite)?.sheet).filter(Boolean))]});
  const root=document.createElement('section');root.id='camp-proof';root.style.cssText='position:fixed;left:20px;top:20px;width:1000px;padding:20px;background:#afb06f;z-index:999999';root.innerHTML='<h2>Army camps — painted props, motion and assembled views</h2>';document.body.append(root);
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1000;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],hashes=[];
  const names=['camp-wedge-cream-1','camp-wedge-cream-2','camp-wedge-gray-1','camp-wedge-gray-2',...[1,2,3,4].map(i=>`camp-cookfire-${i}`),'camp-pennant-ochre-1','camp-pennant-ochre-2','camp-pennant-rust-1','camp-pennant-rust-2'];
  names.forEach((n,i)=>{widths.push(drawSprite(ctx,n,125+i%4*250,150+Math.floor(i/4)*190,100));const s=document.createElement('canvas');s.width=260;s.height=200;drawSprite(s.getContext('2d'),n,130,190,150);hashes.push(s.toDataURL());});
  const calls=[],peopleWidths=[],draw=(clip,x,y,size,key,opt)=>{calls.push(clip);const width=drawClip(ctx,clip,x,y,size,{seed:key,...opt});if(clip.includes("idle-"))peopleWidths.push(width);return width;};
  const camps=['texian','mexican'].map((side,i)=>drawArmy(ctx,{id:side,side,name:side==='texian'?'Texian camp':'Mexican camp',strength:12,ours:0},{x:250+i*500,y:790},{scale:160,figure:38,time:700,draw,sprite:(id,x,y,size)=>{calls.push(id);return drawSprite(ctx,id,x,y,size);}}));
  return {widths,distinctFrames:new Set(hashes).size,camps,calls,peopleWidths};
 });assert.ok(proof.widths.every(w=>w>0));assert.equal(proof.distinctFrames,12);assert.deepEqual(proof.camps,['camp','camp']);assert.ok(proof.calls.includes('camp-cookfire'));assert.ok(proof.calls.includes('musket-stack-small'));assert.equal(proof.peopleWidths.length,24);assert.ok(proof.peopleWidths.every(w=>w>0));assert.deepEqual(errors,[]);
 await page.locator('#camp-proof').screenshot({path:'docs/evidence/army-camp-art.png'});writeFileSync('docs/evidence/army-camp-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: twelve distinct frames and two assembled army camps render.');
}finally{await browser?.close();await app.close();}

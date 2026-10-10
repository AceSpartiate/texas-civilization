import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'prisoner-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
 const {loadArt,drawClip,drawSprite,spriteFrame}=await import('/art.js');await loadArt({sheets:['goliad-prisoner-second']});
 const root=document.createElement('section');root.id='prisoner-proof';root.style.cssText='position:fixed;left:20px;top:20px;width:1000px;padding:20px;background:#afb06f;z-index:999999';root.innerHTML='<h2>Goliad — second unarmed prisoner</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=900;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],hashes=[];
 const names=[...[1,2,3,4].map(i=>`prisoner2-walk-e-${i}`),...['s','n'].flatMap(d=>[1,2].map(i=>`prisoner2-walk-${d}-${i}`)),...['idle-e','idle-s','listen','look-back','run-e','duck','injured','still'].map(k=>`prisoner2-${k}`)];
 for(let i=0;i<16;i++){const row=Math.floor(i/4),col=i%4,scale=i===15?.32:i===14?.55:i===13?.6:1;widths.push(drawSprite(ctx,names[i],125+col*250,200+row*220,130*scale));const scratch=document.createElement('canvas');scratch.width=300;scratch.height=220;drawSprite(scratch.getContext('2d'),names[i],150,210,180*scale);hashes.push(scratch.toDataURL());}
 const clipWidths=['e','s','n'].flatMap(d=>[0,300].map(t=>drawClip(ctx,`prisoner2-walk-${d}`,-300,-300,100,{timeMs:t})));
 return {widths,clipWidths,sheets:names.map(k=>spriteFrame(k).sheet),distinctFrames:new Set(hashes).size}; });assert.ok(proof.widths.every(w=>w>0));assert.ok(proof.clipWidths.every(w=>w>0));assert.equal(proof.distinctFrames,16);assert.deepEqual(proof.sheets,Array(16).fill('goliad-prisoner-second'));assert.deepEqual(errors,[]);await page.locator('#prisoner-proof').screenshot({path:'docs/evidence/goliad-prisoner-second-art.png'});writeFileSync('docs/evidence/goliad-prisoner-second-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: sixteen distinct prisoner frames and walking loops render.');
}finally{await browser?.close();await app.close();}


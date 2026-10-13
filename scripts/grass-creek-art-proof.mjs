import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'creek-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
 const {loadArt,drawClip,drawSprite,spriteFrame}=await import('/art.js');await loadArt({sheets:['grass-creek-terrain']});
 const root=document.createElement('section');root.id='creek-proof';root.style.cssText='position:fixed;left:20px;top:20px;width:1000px;padding:20px;background:#afb06f;z-index:999999';root.innerHTML='<h2>Grass Fight creek terrain — dry beds and flowing water</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=640;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],hashes=[];
 const dry=['creek-bed-dry','creek-bed-curve','creek-ditch-dry','creek-bed-end'];
 for(let i=0;i<8;i++){const row=i<4?0:1,col=i%4,sprite=i<4?dry[col]:`creek-ford-${col+1}`,scratch=document.createElement('canvas');scratch.width=260;scratch.height=220;const paint=(c,x,y,h)=>i<4?drawSprite(c,sprite,x,y,h):drawClip(c,'creek-ford',x,y,h,{timeMs:col*350});widths.push(paint(ctx,125+col*250,230+row*300,110));paint(scratch.getContext('2d'),130,210,180);hashes.push(scratch.toDataURL());}
 return {widths,sheets:dry.map(k=>spriteFrame(k).sheet),distinctFrames:new Set(hashes).size}; });assert.ok(proof.widths.every(w=>w>0));assert.equal(proof.distinctFrames,8);assert.deepEqual(proof.sheets,Array(4).fill('grass-creek-terrain'));assert.deepEqual(errors,[]);await page.locator('#creek-proof').screenshot({path:'docs/evidence/grass-creek-terrain-art.png'});writeFileSync('docs/evidence/grass-creek-terrain-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: eight distinct production creek terrain frames render.');
}finally{await browser?.close();await app.close();}


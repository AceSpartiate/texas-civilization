import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'wading-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
 const {loadArt,drawClip,spriteFrame}=await import('/art.js');await loadArt({sheets:['marsh-wading']});
 const root=document.createElement('section');root.id='wading-proof';root.style.cssText='position:fixed;left:20px;top:20px;width:1000px;padding:20px;background:#afb06f;z-index:999999';root.innerHTML='<h2>San Jacinto wading — four movement poses</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=640;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],hashes=[];
 for(const [row,kind] of ['volunteer','regular'].entries()){for(let i=0;i<4;i++){widths.push(drawClip(ctx,`${kind}-wade`,125+i*250,230+row*300,110,{timeMs:i*240}));const scratch=document.createElement('canvas');scratch.width=260;scratch.height=220;drawClip(scratch.getContext('2d'),`${kind}-wade`,130,210,180,{timeMs:i*240});hashes.push(scratch.toDataURL());}ctx.fillStyle='#403729';ctx.font='18px Georgia';ctx.fillText(kind,20,30+row*300);}
 return {widths,sheets:['volunteer','regular'].map(k=>spriteFrame(`${k}-wade-1`).sheet),distinctFrames:new Set(hashes).size};
 });assert.ok(proof.widths.every(w=>w>0));assert.equal(proof.distinctFrames,8);assert.deepEqual(proof.sheets,['marsh-wading','marsh-wading']);assert.deepEqual(errors,[]);await page.locator('#wading-proof').screenshot({path:'docs/evidence/marsh-wading-art.png'});writeFileSync('docs/evidence/marsh-wading-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: eight distinct production wading animation frames render.');
}finally{await browser?.close();await app.close();}


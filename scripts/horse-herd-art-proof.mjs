import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'herd-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
 const {loadArt,drawClip,spriteFrame}=await import('/art.js');await loadArt({sheets:['horse-herds']});
 const root=document.createElement('section');root.id='herd-proof';root.style.cssText='position:fixed;left:20px;top:20px;width:1000px;padding:20px;background:#afb06f;z-index:999999';root.innerHTML='<h2>Horse herds — drove and scatter loop poses</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=640;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],hashes=[];
 for(const [row,kind] of ['drove','scatter'].entries()){for(let i=0;i<4;i++){widths.push(drawClip(ctx,`herd-${kind}`,125+i*250,230+row*300,85,{timeMs:i*250}));const scratch=document.createElement('canvas');scratch.width=260;scratch.height=220;drawClip(scratch.getContext('2d'),`herd-${kind}`,130,210,180,{timeMs:i*250});hashes.push(scratch.toDataURL());}ctx.fillStyle='#403729';ctx.font='18px Georgia';ctx.fillText(kind,20,30+row*300);}
 return {widths,sheets:['drove','scatter'].map(k=>spriteFrame(`herd-${k}-1`).sheet),distinctFrames:new Set(hashes).size};
 });assert.ok(proof.widths.every(w=>w>0));assert.equal(proof.distinctFrames,8);assert.deepEqual(proof.sheets,['horse-herds','horse-herds']);assert.deepEqual(errors,[]);await page.locator('#herd-proof').screenshot({path:'docs/evidence/horse-herds-art.png'});writeFileSync('docs/evidence/horse-herds-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: eight distinct production herd animation frames render.');
}finally{await browser?.close();await app.close();}


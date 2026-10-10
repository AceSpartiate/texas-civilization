import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'timber-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1050,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
 const {loadArt,drawSprite,drawClip}=await import('/art.js');await loadArt({sheets:['timber-felled']});const root=document.createElement('section');root.id='timber-proof';root.style.cssText='position:fixed;left:15px;top:15px;width:950px;padding:15px;background:#dedbb4;z-index:999999';root.innerHTML='<h2>Felled timber — fallen, trimmed and stacked states</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=950;canvas.height=660;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[];
 const names=['timber-felled-e','timber-felled-n','timber-trimmed-e','timber-stack'];names.forEach((name,i)=>{const x=235+(i%2)*470,y=245+Math.floor(i/2)*270;widths.push(drawSprite(ctx,name,x,y,90));ctx.fillStyle='#403729';ctx.font='18px Georgia';ctx.fillText(name,x-180,y+30);});
 function boundsAt(x){const c=document.createElement('canvas');c.width=600;c.height=220;drawClip(c.getContext('2d'),'timber-trimmed-e',x,180,80,{timeMs:1000});const pixels=c.getContext('2d').getImageData(0,0,600,220).data;let min=600,max=-1;for(let y=0;y<220;y++)for(let px=0;px<600;px++)if(pixels[(y*600+px)*4+3]){min=Math.min(min,px);max=Math.max(max,px);}return{min,max};}return{widths,before:boundsAt(200),after:boundsAt(260)};
 });assert.ok(proof.widths.every(w=>w>0));assert.equal(proof.after.min-proof.before.min,60);assert.equal(proof.after.max-proof.before.max,60);assert.deepEqual(errors,[]);await page.locator('#timber-proof').screenshot({path:'docs/evidence/felled-timber-art.png'});writeFileSync('docs/evidence/felled-timber-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: four timber props render and rigid hauling translation preserves the silhouette.');
}finally{await browser?.close();await app.close();}


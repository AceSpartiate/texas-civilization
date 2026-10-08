import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'shortleaf-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1120,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
 const {loadArt,drawClip,drawSprite}=await import('/art.js'),{galePose}=await import('/weather-art.js');await loadArt({sheets:['trees-shortleaf']});
 const root=document.createElement('section');root.id='shortleaf-proof';root.style.cssText='position:fixed;left:15px;top:15px;width:1040px;padding:15px;background:#dedbb4;z-index:999999';root.innerHTML='<h2>Shortleaf pine — upright, gust 1, gust 2, stump</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1040;canvas.height=750;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],selected=[];
 ['pole','log','large'].forEach((size,row)=>{const name=`pine-shortleaf-${size}`,y=230+row*240;ctx.fillStyle='#403729';ctx.font='18px Georgia';ctx.fillText(size,10,30+row*240);widths.push(drawSprite(ctx,name,130,y,180));const pose=galePose(name,{norther:1,wind:{x:0,y:1}});selected.push(pose);widths.push(drawSprite(ctx,pose,390,y,180));widths.push(drawClip(ctx,`${name}-gale`,650,y,180,{timeMs:500}));widths.push(drawSprite(ctx,size==='large'?'stump-pine-shortleaf':`stump-pine-shortleaf-${size}`,910,y,95));});return{widths,selected};
 });assert.ok(proof.widths.every(w=>w>0));assert.deepEqual(proof.selected,['pine-shortleaf-pole-gale-1','pine-shortleaf-log-gale-1','pine-shortleaf-large-gale-1']);assert.deepEqual(errors,[]);await page.locator('#shortleaf-proof').screenshot({path:'docs/evidence/shortleaf-art.png'});writeFileSync('docs/evidence/shortleaf-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: twelve shortleaf frames and three production gale selectors render.');
}finally{await browser?.close();await app.close();}

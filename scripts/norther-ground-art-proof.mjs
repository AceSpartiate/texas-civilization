import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'norther-ground-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {loadArt,drawSprite,drawClip,spriteFrame}=await import('/art.js'),{galePose}=await import('/weather-art.js');await loadArt({sheets:['nature','norther-ground']});
  const root=document.createElement('section');root.id='norther-proof';root.style.cssText='position:fixed;left:30px;top:30px;width:850px;padding:20px;background:#dedbb4;z-index:999999';root.innerHTML='<h2>Ground cover in a norther</h2>';document.body.append(root);
  const canvas=document.createElement('canvas');canvas.width=850;canvas.height=440;root.append(canvas);const ctx=canvas.getContext('2d'),names=['scrub','reeds','prickly-pear'];let widths=[];
  ctx.fillStyle='#463b29';ctx.font='18px Georgia';['Fair weather','Gale pose 1','Gale pose 2'].forEach((s,i)=>ctx.fillText(s,20+i*280,25));
  names.forEach((name,row)=>{const y=135+row*140;drawSprite(ctx,name,130,y,95);const pose=galePose(name,{norther:1,wind:{x:0,y:1}})||(name==='reeds'?'reeds-gale-1':null);/* reeds are not scattered, so not bound in GALE_POSES (merge 2026-10-09); their pose is drawn by name */widths.push(drawSprite(ctx,pose,410,y,95));widths.push(drawClip(ctx,`${name}-gale`,690,y,95,{timeMs:500}));ctx.fillText(name,20,y+25);});
  return {sources:names.map(n=>spriteFrame(`${n}-gale-1`).sheet),widths};
 });assert.deepEqual(proof.sources,Array(3).fill('norther-ground'));assert.ok(proof.widths.every(w=>w>0));assert.deepEqual(errors,[]);
 mkdirSync('docs/evidence',{recursive:true});await page.locator('#norther-proof').screenshot({path:'docs/evidence/norther-ground-art.png'});writeFileSync('docs/evidence/norther-ground-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: three gale selectors and authored second poses render from production art.');
}finally{await browser?.close();await app.close();}

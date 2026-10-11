import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'biome-species-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1100,height:1250}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const art=await import('/art.js'),weather=await import('/weather-art.js');await art.loadArt({sheets:['biome-species','biome-species-gales','nature','civilians']});
  const names=['tree-anacua','tree-texas-ebony','tree-water-tupelo','tree-cedar-elm','tree-black-willow','tree-black-willow-pole'];
  const root=document.createElement('section');root.id='biome-species-proof';root.style.cssText='position:fixed;left:0;top:0;padding:15px;background:#ada977;z-index:999999';root.innerHTML='<h2>Regional trees — upright / norther / authored second gust</h2>';document.body.append(root);
  const c=document.createElement('canvas');c.width=1040;c.height=1120;root.append(c);const ctx=c.getContext('2d'),checks=[];
  names.forEach((name,row)=>{
   const y=160+row*180,height=name.endsWith('-pole')?110:145;
   const upright=art.drawSprite(ctx,name,180,y,height);weather.drawWeatherTree(ctx,name,500,y,height,{norther:1,wind:{x:0,y:1}},art.drawSprite);
   const second=art.drawClip(ctx,name+'-gale',820,y,height,{timeMs:600});
   ctx.fillStyle='#362d21';ctx.font='15px Georgia';ctx.fillText(name.replace('tree-',''),20,y+22);art.drawSprite(ctx,'rust-idle-s',290,y,35);
   const images=[];for(const timeMs of [0,600]){const p=document.createElement('canvas');p.width=260;p.height=200;art.drawClip(p.getContext('2d'),name+'-gale',130,190,height,{timeMs});images.push(p.toDataURL());}
   const fair=document.createElement('canvas');fair.width=260;fair.height=200;const fctx=fair.getContext('2d');
   weather.drawWeatherTree(fctx,name,130,190,height,{fair:1,wind:{x:0,y:0}},art.drawSprite);const fromHelper=fair.toDataURL();fctx.clearRect(0,0,260,200);art.drawSprite(fctx,name,130,190,height);
   checks.push({name,upright,second,distinctPoses:new Set(images).size,fairSamePixels:fromHelper===fair.toDataURL()});
  });return checks;
 });assert.ok(proof.every(p=>p.upright>0&&p.second>0&&p.distinctPoses===2&&p.fairSamePixels));assert.deepEqual(errors,[]);
 await page.locator('#biome-species-proof').screenshot({path:'docs/evidence/biome-species-art.png'});
 writeFileSync('docs/evidence/biome-species-art.json',JSON.stringify({verdict:'PASS',checks:proof,errors},null,2));console.log('PASS: six species/age identities, twelve distinct gust poses, fair-weather pixel preservation.');
}finally{await browser?.close();await app.close();}

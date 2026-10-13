import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'nature-gale-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {loadArt,drawClip,drawSprite}=await import('/art.js'),{drawWeatherTree,galePose,weatherMix}=await import('/weather-art.js');
  await loadArt({sheets:['nature-gales','nature']});
  const root=document.createElement('section');root.id='nature-gale-proof';root.style.cssText='position:fixed;left:10px;top:10px;width:1040px;padding:16px;background:#b4af74;z-index:999999;color:#392e20';root.innerHTML='<h2>Generic norther trees — upright / gust one / gust two / reduced view</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1040;canvas.height=670;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],hashes=[];
  const fair={norther:0,wind:{x:0,y:0}},hard={norther:1,wind:{x:0,y:1}};
  for(const [row,tree] of ['cottonwood','sapling'].entries()){
   const h=row?165:255,y=row?615:315;ctx.fillStyle='#85764b';ctx.fillRect(20,y,980,1);
   widths.push(drawWeatherTree(ctx,tree,150,y,h,fair,drawSprite));widths.push(drawWeatherTree(ctx,tree,420,y,h,hard,drawSprite));widths.push(drawClip(ctx,`${tree}-gale`,700,y,h,{timeMs:600}));widths.push(drawClip(ctx,`${tree}-gale`,925,y,h*.45,{timeMs:0,paused:true}));
   for(const timeMs of [0,600]){const scratch=document.createElement('canvas');scratch.width=400;scratch.height=320;drawClip(scratch.getContext('2d'),`${tree}-gale`,180,300,h,{timeMs});hashes.push(scratch.toDataURL());}
  }
  const weather={bounds:{westOf:100,eastOf:300},regions:{west:{kind:'fair',wind:{from:0,force:0}},centre:{kind:'norther',wind:{from:0,force:1}},east:{kind:'fair',wind:{from:0,force:0}}}};
  const regionSelection=[70,150,330].map(x=>galePose('cottonwood',weatherMix(weather,x,600)));
  return {rendered:widths.filter(Boolean).length,distinctFrames:new Set(hashes).size,regionSelection};
 });assert.equal(proof.rendered,8);assert.equal(proof.distinctFrames,4);assert.deepEqual(proof.regionSelection,[null,'cottonwood-gale-1',null]);assert.deepEqual(errors,[]);
 await page.locator('#nature-gale-proof').screenshot({path:'docs/evidence/nature-gale-art.png'});writeFileSync('docs/evidence/nature-gale-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: upright and four distinct gust frames render; regional gale selection and reduced view verified.');
}finally{await browser?.close();await app.close();}

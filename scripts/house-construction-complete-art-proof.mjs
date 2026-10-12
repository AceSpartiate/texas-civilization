import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {plotCatalogue} from '../sim/houseplot.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'house-construction-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1400,height:1900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async catalogue=>{
  const art=await import('/art.js'),{drawHousePlot}=await import('/house-plot.js');await art.loadArt({sheets:['house-construction-complete','house-modules','houses-settling']});
  const names=['house-jacal-posts','house-jacal-wattle','house-jacal-daub-walls','house-jacal-thatch-roof','house-shed-frame','house-chimney-double','house-puncheon-floor','house-half-loft'];
  const root=document.createElement('section');root.id='house-construction-proof';root.style.cssText='position:fixed;left:0;top:0;padding:20px;background:#b0ab7b;z-index:999999';root.innerHTML='<h2>House construction — independent pieces and sixteen live jacal stages</h2>';document.body.append(root);
  const c=document.createElement('canvas');c.width=1320;c.height=1770;root.append(c);const ctx=c.getContext('2d'),frames=[],stages=[];
  names.forEach((name,i)=>{const x=165+(i%4)*330,y=230+Math.floor(i/4)*300;frames.push({name,width:art.drawSprite(ctx,name,x,y,165)});ctx.fillStyle='#3a3022';ctx.font='14px Georgia';ctx.fillText(name,(i%4)*330+8,y+35);});
  for(const [row,[stage,progress]] of [[1,0],[1,.5],[2,0],[3,0]].entries())for(const [col,rotation] of [0,90,180,270].entries()){
   const calls=[];drawHousePlot(ctx,180+col*330,820+row*280,115,{house:{pieces:[['pen-jacal',3,2,stage,progress]]}},catalogue,(ct,n,...args)=>{const width=art.drawSprite(ct,n,...args);calls.push({name:n,width});return width;},art.spriteFrame,{rotation});
   ctx.fillText(['posts','wattle','daub','thatch'][row]+' '+rotation+'°',col*330+30,865+row*280);stages.push({stage,progress,rotation,calls});
  }
  return {frames,stages};
 },plotCatalogue());assert.ok(proof.frames.every(p=>p.width>0));assert.equal(proof.stages.length,16);assert.ok(proof.stages.every(s=>s.calls.every(c=>c.width>0)));assert.deepEqual(errors,[]);
 await page.locator('#house-construction-proof').screenshot({path:'docs/evidence/house-construction-complete-art.png'});
 writeFileSync('docs/evidence/house-construction-complete-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: eight modules and sixteen production jacal stage/rotation assemblies.');
}finally{await browser?.close();await app.close();}


import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {plotCatalogue} from '../sim/houseplot.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'roof-join-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1500,height:1400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async(catalogue)=>{
  const {loadArt,drawSprite,spriteFrame}=await import('/art.js'),{drawHousePlot}=await import('/house-plot.js');
  await loadArt({sheets:['house-roof-joins','house-modules','house-back-views','houses-settling']});
  const root=document.createElement('section');root.id='roof-join-proof';root.style.cssText='position:fixed;left:10px;top:10px;width:1400px;padding:20px;background:#afb06f;z-index:999999';root.innerHTML='<h2>Two-pen roof joins — finished, partial and chimney aperture; all four turns</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1260;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],counts={};
  for(const [i,n] of ['house-roof-join','house-roof-join-partial','house-roof-join-chimney'].entries())widths.push(drawSprite(ctx,n,220+i*460,230,190));
  for(const [row,[planName,stage]] of [['dog-run',13],['dog-run',12],['saddlebag',13]].entries())for(const [col,rotation] of [0,90,180,270].entries()){
   const plan=catalogue.plans.find(p=>p.id===planName),pieces=plan.pieces.map(([type,x,y])=>[type,x,y,Math.min(stage,catalogue.pieces.find(k=>k.id===type).stageCount),0]);
   ctx.fillStyle='#403729';ctx.font='18px Georgia';ctx.fillText(`${planName}, ${stage===12?'partial':'finished'}, ${rotation}°`,col*350+20,300+row*300);
   drawHousePlot(ctx,col*350+190,520+row*300,140,{house:{pieces}},catalogue,(c,n,...args)=>{counts[n]=(counts[n]||0)+1;return drawSprite(c,n,...args);},spriteFrame,{rotation});
  }
  return {widths,counts};
 },plotCatalogue());assert.ok(proof.widths.every(w=>w>0));for(const n of ['house-roof-join','house-roof-join-partial','house-roof-join-chimney'])assert.equal(proof.counts[n],4);assert.deepEqual(errors,[]);
 await page.locator('#roof-join-proof').screenshot({path:'docs/evidence/roof-join-art.png'});writeFileSync('docs/evidence/roof-join-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: three roof states and twelve assembled houses render through production code.');
}finally{await browser?.close();await app.close();}

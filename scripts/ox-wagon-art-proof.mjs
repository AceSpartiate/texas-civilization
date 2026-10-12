import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'ox-wagon-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1440,height:2200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async()=>{
  const art=await import('/art.js'),motion=await import('/motion.js');await art.loadArt({sheets:['ox-wagon-composite-e','ox-wagon-composite-s','ox-wagon-composite-n','people-child-wagon-drivers','wagon-rig']});
  const root=document.createElement('section');root.id='ox-wagon-proof';root.style.cssText='position:fixed;left:0;top:0;padding:16px;background:#aaa87b;z-index:999999';root.innerHTML='<h2>Ox wagon — connected rigs and child driver layers</h2>';document.body.append(root);
  const c=document.createElement('canvas');c.width=1380;c.height=2080;root.append(c);const ctx=c.getContext('2d'),frames=[],clips=[],bindings=[];let row=0;
  for(const d of ['e','s','n'])for(const state of ['empty','loaded']){const n='ox-wagon-'+state+'-'+d;ctx.font='14px Georgia';ctx.fillStyle='#342d22';ctx.fillText(n,10,25+row*210);
   for(let i=1;i<=4;i++){const width=art.drawSprite(ctx,n+'-'+i,172+(i-1)*345,200+row*210,155);frames.push({name:n+'-'+i,width});}
   const images=[];for(const timeMs of [0,300,600,900]){const p=document.createElement('canvas');p.width=420;p.height=210;assertDraw(art.drawClip(p.getContext('2d'),n,210,200,155,{timeMs}),n);images.push(p.toDataURL());}clips.push({name:n,distinct:new Set(images).size});row++;
  }
  for(const [j,d]of ['s','e','w','n'].entries())for(const [k,f]of ['girl','boy'].entries()){
   const n=f+'-wagon-driver-'+d;
   for(let i=1;i<=2;i++){const width=art.drawSprite(ctx,n+'-'+i,130+(k*2+i-1)*345,1420+j*155,115);frames.push({name:n+'-'+i,width});}
   ctx.fillStyle='#342d22';ctx.fillText(n,15+k*690,1300+j*155);
   const images=[];for(const timeMs of [0,600]){const p=document.createElement('canvas');p.width=220;p.height=180;assertDraw(art.drawClip(p.getContext('2d'),n,110,170,130,{timeMs}),n);images.push(p.toDataURL());}clips.push({name:n,distinct:new Set(images).size});
  }
  for(const [i,sex]of ['female','male'].entries()){
   const choice=motion.seatedClip({kind:'person',band:'child',sex},'e','wagon');const parts=motion.seatLayout('wagon','e',{wagon:1.55,ox:1.45,horse:1.5},.7,1),driver=parts.find(p=>p.part==='rider'),box=parts.find(p=>p.part==='wagon');const x=480+i*650,y=2050,unit=130;
   const wagonWidth=art.drawSprite(ctx,'wagon-body-empty',x+box.dx*unit,y,box.height*unit,{flip:true});assertDraw(wagonWidth,'wagon-body-empty');const width=art.drawClip(ctx,choice.id,x+driver.dx*unit,y+driver.dy*unit,driver.height*unit,{timeMs:600});bindings.push({sex,choice,width,wagonWidth});
  }
  function assertDraw(width,n){if(!width)throw Error('Missing '+n);}
  return {frames,clips,bindings};
 });assert.equal(proof.frames.length,40);assert.ok(proof.frames.every(f=>f.width>0));assert.equal(proof.clips.length,14);assert.ok(proof.clips.every(c=>c.distinct===(c.name.startsWith('ox-wagon')?4:2)));assert.ok(proof.bindings.every(b=>b.choice.seated&&b.width>0));assert.deepEqual(errors,[]);
 await page.locator('#ox-wagon-proof').screenshot({path:'docs/evidence/ox-wagon-art.png'});
 writeFileSync('docs/evidence/ox-wagon-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: 40 intact frames, six four-phase rigs, eight two-phase driver clips and seated selections.');
}finally{await browser?.close();await app.close();}

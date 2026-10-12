import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'house-other-sides-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1400,height:1800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async()=>{
  const art=await import('/art.js'),{roofSeat}=await import('/house-plot.js');await art.loadArt({sheets:['house-back-views','house-end-views','house-modules']});
  const root=document.createElement('section');root.id='house-other-sides-proof';root.style.cssText='position:fixed;left:0;top:0;padding:20px;background:#b0ab7b;z-index:999999';root.innerHTML='<h2>Rear construction stages / end-on additions / mirrored roof seating</h2>';document.body.append(root);
  const c=document.createElement('canvas');c.width=1320;c.height=1680;root.append(c);const ctx=c.getContext('2d'),checks=[];
  const names=['house-round-back-sill','house-round-back-low-walls','house-round-back-full-walls','house-hewn-back-sill','house-hewn-back-low-walls','house-hewn-back-full-walls','house-passage-floor-end','house-passage-roof-end','house-porch-end','house-shed-room-end'];
  names.forEach((name,i)=>{const x=220+(i%3)*440,y=230+Math.floor(i/3)*270;checks.push({name,width:art.drawSprite(ctx,name,x,y,160)});ctx.fillStyle='#3a3022';ctx.font='16px Georgia';ctx.fillText(name,Math.floor(i%3)*440+8,y+35);});
  const assemblies=[];
  for(const [i,material] of ['round','hewn'].entries())for(const [j,flip] of [false,true].entries()){
   const x=180+(i*2+j)*330,y=1610,height=125,name='house-'+material+'-back-full-walls',walls=art.spriteFrame(name),roof=art.spriteFrame('house-hewn-roof-finished');
   const width=art.drawSprite(ctx,name,x,y,height,{flip}),seat=roofSeat(walls,roof,x,y,height,flip),roofWidth=art.drawSprite(ctx,'house-hewn-roof-finished',seat.x,seat.y,seat.height,{anchor:seat.anchor,flip});
   assemblies.push({material,flip,width,roofWidth});ctx.fillText(material+(flip?' mirrored':'')+' roof seat',x-110,y+35);
  }
  return {checks,assemblies};
 });assert.ok(proof.checks.every(p=>p.width>0));assert.ok(proof.assemblies.every(p=>p.width>0&&p.roofWidth>0));assert.deepEqual(errors,[]);
 await page.locator('#house-other-sides-proof').screenshot({path:'docs/evidence/house-other-sides-art.png'});
 writeFileSync('docs/evidence/house-other-sides-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: ten architectural views and four mirrored roof-seat assemblies.');
}finally{await browser?.close();await app.close();}


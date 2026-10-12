import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {SHEETS,ANIMATION_CLIPS} from './art-deliveries/alamo-complete-2026-10-12.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'alamo-art-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1450,height:1850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async({sheets,clips})=>{
  const art=await import('/art.js'),alamo=await import('/alamo-battle-art.js');await art.loadArt({sheets:[...Object.keys(sheets),'effects']});
  const root=document.createElement('section');root.style.cssText='position:fixed;left:0;top:0;padding:16px;background:#aaa87b;z-index:999999';document.body.append(root);
  const frames=[],phases=[],panels=[];
  for(const [id,heading,names,height]of [
   ['alamo-infantry-proof','Alamo — parapet overlays and Travis cardinal battery service',[...sheets['alamo-parapet-service'],...sheets['people-alamo-travis-service']],140],
   ['alamo-cavalry-proof','Alamo — volunteer trot and upright-lance walk / idle',[...sheets['alamo-volunteer-trot'],...Object.entries(sheets).filter(([sheet])=>sheet.startsWith('alamo-upright-lancer')).flatMap(([,names])=>names)],170],
   ['alamo-guns-proof','Alamo — north / church gun variants and continuous night / dawn',sheets['alamo-battery-guns'],145]
  ]){
   const c=document.createElement('canvas');c.id=id;c.width=1360;c.height=Math.ceil(names.length/4)*215+(id==='alamo-guns-proof'?290:55);root.append(c);panels.push(id);const ctx=c.getContext('2d');ctx.fillStyle='#aaa87b';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#342d22';ctx.font='21px Georgia';ctx.fillText(heading,15,30);
   for(const [i,n]of names.entries()){const x=170+(i%4)*340,y=245+Math.floor(i/4)*215,width=art.drawSprite(ctx,n,x,y,height);frames.push({name:n,width});ctx.fillStyle='#342d22';ctx.font='12px Georgia';ctx.fillText(n,x-150,y+17);}
   if(id==='alamo-guns-proof')for(const [i,dark]of [1,.5,0].entries()){
    const x=i*450,y=500;ctx.save();ctx.translate(x,y);ctx.fillStyle='#b7a879';ctx.fillRect(0,0,440,170);art.drawSprite(ctx,'travis-battery-n-aim',220,160,140);alamo.drawAlamoGrade(ctx,dark,{width:440,height:170});art.drawSprite(ctx,'muzzle-flash-e',275,55,35);ctx.restore();ctx.fillStyle='#342d22';ctx.font='15px Georgia';ctx.fillText(['night','dawn transition','day'][i],x+15,y+190);
   }
  }
  for(const [n,c]of Object.entries(clips)){let timeMs=0;const images=[];for(const f of c.frames){const p=document.createElement('canvas');p.width=400;p.height=260;if(!art.drawClip(p.getContext('2d'),n,200,245,185,{timeMs}))throw Error('Missing '+n);images.push(p.toDataURL());timeMs+=f.duration;}phases.push({name:n,distinct:new Set(images).size,expected:c.frames.length});}
  return {frames,phases,panels};
 },{sheets:SHEETS,clips:ANIMATION_CLIPS});
 assert.equal(proof.frames.length,76);assert.ok(proof.frames.every(f=>f.width>0));assert.equal(proof.phases.length,21);assert.ok(proof.phases.every(p=>p.distinct===p.expected));assert.deepEqual(errors,[]);
 for(const id of proof.panels){await page.locator('#'+id).screenshot({path:'docs/evidence/'+id+'.png'});await page.locator('#'+id).evaluate(c=>{c.style.display='none';});}
 writeFileSync('docs/evidence/alamo-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: 76 frames, 21 authored multi-phase clips and independent night/dawn/day composites.');
}finally{await browser?.close();await app.close();}

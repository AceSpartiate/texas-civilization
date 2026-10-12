import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'southern-art-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1380,height:1980}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async()=>{
  const art=await import('/art.js'),south=await import('/southern-battle-art.js');await art.loadArt({sheets:['southern-volunteer-mounted-actions','southern-dragoon-mounted-actions','southern-lancer-charge','effects','military']});
  const root=document.createElement('section');root.id='southern-fights-proof';root.style.cssText='position:fixed;left:0;top:0;padding:20px;background:#aaa87b;z-index:999999';root.innerHTML='<h2>Southern fights — cardinal service, lancer gait and moonless field grade</h2>';document.body.append(root);
  const c=document.createElement('canvas');c.width=1300;c.height=1840;root.append(c);const ctx=c.getContext('2d'),frames=[],clips=[];
  const rows=['volunteer-mounted-action-s','volunteer-mounted-action-n','dragoon-mounted-action-s','dragoon-mounted-action-n','lancer-charge-s','lancer-charge-n'];
  for(const [row,n]of rows.entries())for(let i=1;i<=4;i++){
   const width=art.drawSprite(ctx,n+'-'+i,165+(i-1)*325,230+row*250,175);frames.push({name:n+'-'+i,width});if(i===1){ctx.fillStyle='#342d22';ctx.font='14px Georgia';ctx.fillText(n,10,260+row*250);}
  }
  for(const n of ['volunteer-mounted-fire-s','volunteer-mounted-fire-n','dragoon-mounted-fire-s','dragoon-mounted-fire-n','lancer-charge-s','lancer-charge-n']){
   const times=n.startsWith('lancer')?[0,160,320,480]:[0,360,480,700],images=[];
   for(const timeMs of times){const p=document.createElement('canvas');p.width=300;p.height=250;if(!art.drawClip(p.getContext('2d'),n,150,235,180,{timeMs}))throw Error('Missing clip '+n);images.push(p.toDataURL());}
   clips.push({name:n,distinct:new Set(images).size});
  }
  for(const [i,darkness]of [0,.5,1].entries()){
   ctx.save();ctx.translate(i*430,1660);ctx.fillStyle='#b7a879';ctx.fillRect(0,0,420,160);art.drawSprite(ctx,'dragoon-mounted-action-s-1',175,155,140);
   south.drawSouthernNight(ctx,darkness,{width:420,height:160});art.drawSprite(ctx,'muzzle-flash-e',270,65,35);ctx.restore();ctx.fillStyle='#342d22';ctx.fillText(['day','dim transition','moonless night'][i],i*430+10,1835);
  }
  return {frames,clips};
 });assert.equal(proof.frames.length,24);assert.ok(proof.frames.every(f=>f.width>0));assert.ok(proof.clips.every(c=>c.distinct===4));assert.deepEqual(errors,[]);
 await page.locator('#southern-fights-proof').screenshot({path:'docs/evidence/southern-fights-art.png'});
 writeFileSync('docs/evidence/southern-fights-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: twenty-four frames, six authored four-phase clips and three moonless lighting levels.');
}finally{await browser?.close();await app.close();}


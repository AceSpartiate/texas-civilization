import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'bexar-art-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1400,height:1600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async()=>{
  const art=await import('/art.js'),light=await import('/bexar-battle-art.js');await art.loadArt({sheets:['regular-loophole-actions','bexar-townsfolk','military','effects','bexar-structures']});
  const root=document.createElement('section');root.id='bexar-battle-art-proof';root.style.cssText='position:fixed;left:0;top:0;padding:20px;background:#aaa77c;z-index:999999';root.innerHTML='<h2>Béxar — townsfolk strides, regular loophole cycle, moonlit grade</h2>';document.body.append(root);
  const c=document.createElement('canvas');c.width=1320;c.height=1480;root.append(c);const ctx=c.getContext('2d'),checks=[];
  for(const [row,name] of light.BEXAR_TOWNSFOLK.entries()){
   const height=name==='bexar-child'?110:165,images=[];
   for(const [col,timeMs] of [0,180,360,540].entries()){
    const width=art.drawClip(ctx,name+'-walk',180+col*330,200+row*235,height,{timeMs});assertLocal(width>0);
    const frame=document.createElement('canvas');frame.width=260;frame.height=220;art.drawClip(frame.getContext('2d'),name+'-walk',130,205,height,{timeMs});images.push(frame.toDataURL());
   }checks.push({name,distinct:new Set(images).size});ctx.fillStyle='#342d22';ctx.font='15px Georgia';ctx.fillText(name,10,225+row*235);
  }
  const regular=[];for(const [col,timeMs] of [0,700,870,1670].entries())regular.push(art.drawClip(ctx,'regular-loophole-fire-reload',180+col*330,1190,170,{timeMs}));
  ctx.fillText('Mexican regular: aim / recoil / prime / ram',10,1220);
  const flashes=[];
  for(const [i,darkness] of [0,.5,1].entries()){
   ctx.save();ctx.translate(i*440,1270);ctx.fillStyle='#b3a87a';ctx.fillRect(0,0,420,180);
   art.drawSprite(ctx,'regular-loophole-aim',180,170,125);light.drawBexarMoonlight(ctx,darkness,{width:420,height:180});
   const width=art.drawSprite(ctx,'muzzle-flash-e',275,90,45);flashes.push(width);ctx.restore();ctx.fillStyle='#342d22';ctx.fillText(['day','twilight','moonlit'][i],i*440+10,1470);
  }
  function assertLocal(ok){if(!ok)throw new Error('Missing live artwork');}
  return {checks,regular,flashes};
 });assert.ok(proof.checks.every(p=>p.distinct===4));assert.ok(proof.regular.every(w=>w>0));assert.ok(proof.flashes.every(w=>w>0));assert.deepEqual(errors,[]);
 await page.locator('#bexar-battle-art-proof').screenshot({path:'docs/evidence/bexar-battle-art.png'});
 writeFileSync('docs/evidence/bexar-battle-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: twenty authored drawings, four unique walk phases each, all reload states and three lighting grades.');
}finally{await browser?.close();await app.close();}


import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'landmarks-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:1180,height:1150}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const art=await import('/art.js'),townArt=await import('/town-art.js'),{TOWN_LAYOUTS,townPoint}=await import('/town-layouts.js');
  await art.loadArt({sheets:['town-fort-velasco','town-harrisburg-steam-mill','town-nacogdoches-stone-house','town-mill-smoke','buildings','town-buildings-researched','civilians','equipment']});
  const root=document.createElement('section');root.id='landmarks-proof';root.style.cssText='position:fixed;top:0;left:0;padding:15px;background:#b4ae7c;z-index:999999';root.innerHTML='<h2>Researched town landmarks — separate gun and animated mill plume</h2>';document.body.append(root);
  const c=document.createElement('canvas');c.width=1120;c.height=990;root.append(c);const ctx=c.getContext('2d'),draws=[],towns=[];
  const entries=[['velasco','vel-fort-stockade'],['harrisburg','hbg-mill'],['nacogdoches','nac-stone-house']];
  entries.forEach(([town,id],i)=>{
   const layout=TOWN_LAYOUTS[town],b=layout.buildings.find(b=>b.id===id),x=185+i*370,h=town==='velasco'?180:220;
   const width=art.drawSprite(ctx,b.sprite,x,320,h);draws.push(width);
   if(town==='velasco')art.drawSprite(ctx,'cannon-iron-e',x,320-180*.48,35);
   if(town==='harrisburg')townArt.drawTownMillSmoke(ctx,x,320,h,{timeMs:0,operating:true});
   art.drawSprite(ctx,'rust-idle-s',x+110,320,46);
   ctx.fillStyle='#392e20';ctx.font='17px Georgia';ctx.fillText(b.label,x-120,355);
   const centre=townPoint(layout,b),scale=town==='velasco'?15840:6336;
   const project=p=>({x:x+(p.x-centre.x)*scale,y:620+(p.y-centre.y)*scale});
   ctx.save();ctx.beginPath();ctx.rect(i*370,400,360,300);ctx.clip();townArt.drawTownGround(ctx,layout,project,scale);
   const d=townArt.townDrawables(ctx,layout,project,scale);d.sort((a,b)=>a.y-b.y).forEach(d=>d.draw());townArt.drawTownLabels(ctx);ctx.restore();
   towns.push({town,drawables:d.length});
  });
  const phases=[];for(let i=0;i<4;i++){const p=document.createElement('canvas');p.width=200;p.height=250;const pc=p.getContext('2d');art.drawClip(pc,'town-mill-smoke',100,240,220,{timeMs:i*350});phases.push(p.toDataURL());ctx.drawImage(p,70+i*260,730);}
  const off=document.createElement('canvas');off.width=200;off.height=250;const offCtx=off.getContext('2d'),empty=off.toDataURL();
  const inactive=townArt.drawTownMillSmoke(offCtx,100,240,220,{timeMs:0,operating:false});
  return {draws:draws.filter(w=>w>0).length,towns,distinctSmokeFrames:new Set(phases).size,inactive,offUnchanged:empty===off.toDataURL()};
 });assert.equal(proof.draws,3);assert.equal(proof.distinctSmokeFrames,4);assert.equal(proof.inactive,0);assert.equal(proof.offUnchanged,true);assert.deepEqual(errors,[]);
 await page.locator('#landmarks-proof').screenshot({path:'docs/evidence/town-landmarks-art.png'});
 writeFileSync('docs/evidence/town-landmarks-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: three production town compositions, four distinct smoke phases and inactive-state suppression.');
}finally{await browser?.close();await app.close();}

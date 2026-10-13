import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'civic-art-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1160,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const art=await import('/art.js'),{drawBexar}=await import('/bexar-art.js'),{BEXAR_LAYOUT}=await import('/bexar-layout.js');
  await art.loadArt({sheets:['bexar-san-fernando','bexar-governors-palace','buildings','civilians','nature']});
  const root=document.createElement('section');root.id='civic-art-proof';root.style.cssText='position:fixed;left:10px;top:10px;width:1100px;padding:12px;background:#b3ac76;z-index:999999;color:#392e20';root.innerHTML='<h2>Béxar civic façades — researched exteriors / production town placements</h2>';document.body.append(root);const c=document.createElement('canvas');c.width=1100;c.height=820;root.append(c);const ctx=c.getContext('2d'),widths=[];
  widths.push(art.drawSprite(ctx,'bexar-san-fernando-1836',260,330,280));widths.push(art.drawSprite(ctx,'rust-idle-s',390,330,66));
  widths.push(art.drawSprite(ctx,'bexar-governors-palace-1836',800,330,170));widths.push(art.drawSprite(ctx,'teal-idle-s',950,330,66));
  // Exact existing local feet and production renderer, cropped onto the civic plazas.
  const project=p=>({x:(p.x-300)*.6+10,y:(p.y-1750)*.6+490});ctx.save();ctx.beginPath();ctx.rect(0,420,1100,400);ctx.clip();drawBexar(ctx,project,.6,{alamo:false,bankTrees:false,river:false});ctx.restore();
  for(const id of ['san-fernando','governors-palace']){const b=BEXAR_LAYOUT.buildings.find(b=>b.id===id),p=project(b);ctx.fillStyle='#392e20';ctx.font='15px Georgia';ctx.fillText(b.label,p.x-60,p.y+20);}
  return {draws:widths.filter(w=>w>0).length,placements:BEXAR_LAYOUT.buildings.slice(0,2).map(b=>({id:b.id,sprite:b.sprite,x:b.x,y:b.y,heightFeet:b.heightFeet}))};
 });assert.equal(proof.draws,4);assert.deepEqual(errors,[]);
 await page.locator('#civic-art-proof').screenshot({path:'docs/evidence/bexar-civic-art.png'});
 const unavailable=await browser.newPage();await unavailable.route(/\/atlases\/bexar-san-fernando\.(png|webp)/,r=>r.abort());await unavailable.route(/\/atlases\/bexar-governors-palace\.(png|webp)/,r=>r.abort());await unavailable.goto(`http://127.0.0.1:${port}`);
 const fallback=await unavailable.evaluate(async()=>{const art=await import('/art.js'),{bexarDrawables}=await import('/bexar-art.js'),{BEXAR_LAYOUT}=await import('/bexar-layout.js');await art.loadArt({sheets:['buildings','bexar-san-fernando','bexar-governors-palace']});const results=[];for(let i=0;i<2;i++){const c=document.createElement('canvas');c.width=300;c.height=300;const ctx=c.getContext('2d');const items=bexarDrawables(ctx,()=>({x:150,y:280}),1,{alamo:false,bankTrees:false});const width=items[i].draw();const actual=c.toDataURL();ctx.clearRect(0,0,300,300);const b=BEXAR_LAYOUT.buildings[i];art.drawSprite(ctx,b.fallbackSprite,150,280,b.heightFeet);results.push({width,samePixels:actual===c.toDataURL()});}return results;});assert.ok(fallback.every(r=>r.width>0&&r.samePixels));
 writeFileSync('docs/evidence/bexar-civic-art.json',JSON.stringify({verdict:'PASS',...proof,fallback,errors},null,2));console.log('PASS: two civic exteriors, character-scale comparison, existing production town composition and pixel-matched unloaded-image fallbacks.');
}finally{await browser?.close();await app.close();}

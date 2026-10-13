import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'portrait-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1100,height:980}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {loadArt,drawClip,drawSprite,spriteFrame}=await import('/art.js'),{drawPortrait}=await import('/family-panel.js');
  await loadArt({sheets:['family-portraits','civilians','people-cast2-idle','people-children-idle']});
  const root=document.createElement('section');root.id='family-portrait-proof';root.style.cssText='position:fixed;left:10px;top:10px;width:1040px;padding:12px;background:#e9dcb8;z-index:999999;color:#392e20';root.innerHTML='<h2>Family portraits — map identity / 192 / 56 / 44 pixels</h2>';document.body.append(root);
  const figures=['rust','teal','elder','blue','rust-woman','indigo','ochre','blue-girl','girl','boy','smallchild','infant'],results=[],hashes=[];
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:12px';root.append(grid);
  for(const figure of figures){const cell=document.createElement('div');cell.style.cssText='border:1px solid #ad9874;padding:6px';cell.textContent=figure;grid.append(cell);const row=document.createElement('div');row.style.cssText='display:flex;align-items:end';cell.append(row);const world=document.createElement('canvas');world.width=44;world.height=100;row.append(world);results.push(Boolean(drawClip(world.getContext('2d'),`${figure}-idle-s`,22,99,95,{paused:true,timeMs:0})));
   const large=document.createElement('canvas');large.width=192;large.height=192;cell.append(large);results.push(drawPortrait(large,{figure},{drawClip,drawSprite,spriteFrame}));
   for(const size of [56,44]){const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;row.append(canvas);results.push(drawPortrait(canvas,{figure},{drawClip,drawSprite,spriteFrame}));hashes.push(canvas.toDataURL());}
  }
  return {rendered:results.filter(Boolean).length,total:results.length,distinctSmallPortraits:new Set(hashes).size};
 });assert.equal(proof.rendered,48);assert.equal(proof.distinctSmallPortraits,24);assert.deepEqual(errors,[]);
 await page.locator('#family-portrait-proof').screenshot({path:'docs/evidence/family-portrait-art.png'});writeFileSync('docs/evidence/family-portrait-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: twelve cast identities, production portrait rendering at 192/56/44px, no browser errors.');
}finally{await browser?.close();await app.close();}

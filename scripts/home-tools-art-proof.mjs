import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'home-tools-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {loadArt,spriteFrame,drawSprite}=await import('/art.js'),{renderInterior}=await import('/interior.js'),{INTERIOR_ART}=await import('/interior-data.js');
  await loadArt({sheets:['home-tools','interior-saddlebag']});
  const tools=['hoe','axe','broadaxe','froe','auger'].map(t=>`tool:${t}`);
  const root=document.createElement('section');root.id='tools-proof';root.style.cssText='position:fixed;left:40px;top:30px;width:700px;padding:20px;background:#eee3c5;z-index:999999';root.innerHTML='<h2 id="interior-title"></h2><div id="interior-body"></div>';document.body.append(root);
  const interior={kind:'saddlebag',items:tools,placed:{}};
  const opts={title:'Household tools',send:async(item,spot)=>{window.__toolsProof.sent.push({item,spot});for(const [key,value] of Object.entries(interior.placed))if(value===item)delete interior.placed[key];if(spot)interior.placed[spot]=item;renderInterior(root,interior,opts);}};
  window.__toolsProof={root,interior,sent:[]};renderInterior(root,interior,opts);
  const canvas=document.createElement('canvas');canvas.width=660;canvas.height=155;const ctx=canvas.getContext('2d');
  tools.forEach((tool,i)=>{const name=INTERIOR_ART[tool][0];drawSprite(ctx,name,65+i*130,115,95);ctx.font='14px Georgia';ctx.fillStyle='#463421';ctx.textAlign='center';ctx.fillText(INTERIOR_ART[tool][2],65+i*130,145);});root.append(canvas);
  return {sources:tools.map(t=>spriteFrame(INTERIOR_ART[t][0]).sheet),spots:root.querySelectorAll('[data-spot]').length};
 });
 assert.deepEqual(proof.sources,Array(5).fill('home-tools'));assert.equal(proof.spots,10);
 const tools=['hoe','axe','broadaxe','froe','auger'],spots=['west-back','west-middle','west-door','east-back','east-middle'];
 for(let i=0;i<tools.length;i++){await page.locator(`#tools-proof [data-item="tool:${tools[i]}"]`).click();await page.locator(`#tools-proof [data-spot="${spots[i]}"]`).click();}
 assert.equal(await page.evaluate(()=>Object.keys(window.__toolsProof.interior.placed).length),5);assert.deepEqual(errors,[]);
 mkdirSync('docs/evidence',{recursive:true});await page.locator('#tools-proof').screenshot({path:'docs/evidence/home-tools-art.png'});
 writeFileSync('docs/evidence/home-tools-art.json',JSON.stringify({verdict:'PASS',...proof,placedTools:5,errors},null,2));console.log('PASS: all five production tools loaded and placed through the actual interior controls.');
}finally{await browser?.close();await app.close();}

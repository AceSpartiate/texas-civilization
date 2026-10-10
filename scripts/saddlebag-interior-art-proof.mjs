import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'saddlebag-interior-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {loadArt,spriteFrame}=await import('/art.js'),{renderInterior}=await import('/interior.js'),{INTERIOR_ART}=await import('/interior-data.js');await loadArt({sheets:['interior-saddlebag','home-furnishings']});const pot=INTERIOR_ART['good:pot'][0];await loadArt({sheets:[spriteFrame(pot).sheet]});
  const root=document.createElement('section');root.id='saddlebag-proof';root.style.cssText='position:fixed;left:40px;top:30px;width:700px;padding:20px;background:#eee3c5;z-index:999999';root.innerHTML='<h2 id="interior-title"></h2><div id="interior-body"></div>';document.body.append(root);
  const interior={kind:'saddlebag',items:['good:pot','furniture:bedstead','furniture:table'],placed:{'west-middle':'furniture:bedstead','east-middle':'furniture:table'}};
  window.__interiorProof={root,interior,sent:[]};const opts={title:'Saddlebag interior',send:async(item,spot)=>{window.__interiorProof.sent.push({item,spot});interior.placed[spot]=item;renderInterior(root,interior,opts);}};renderInterior(root,interior,opts);return {sprite:spriteFrame('interior-saddlebag').sheet,spots:root.querySelectorAll('[data-spot]').length};
 });assert.equal(proof.sprite,'interior-saddlebag');assert.equal(proof.spots,10);await page.locator('#saddlebag-proof [data-item="good:pot"]').click();await page.locator('#saddlebag-proof [data-spot="west-hearth"]').click();assert.deepEqual(await page.evaluate(()=>window.__interiorProof.sent),[{item:'good:pot',spot:'west-hearth'}]);assert.deepEqual(errors,[]);mkdirSync('docs/evidence',{recursive:true});await page.locator('#saddlebag-proof').screenshot({path:'docs/evidence/saddlebag-interior-art.png'});writeFileSync('docs/evidence/saddlebag-interior-art.json',JSON.stringify({verdict:'PASS',...proof,placedPot:true,errors},null,2));console.log('PASS: dedicated saddlebag renders, ten spots preserved, pot placed by central hearth.');
}finally{await browser?.close();await app.close();}

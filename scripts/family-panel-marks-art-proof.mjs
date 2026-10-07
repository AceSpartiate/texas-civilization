import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {SHEETS} from './art-deliveries/family-panel-marks-2026-10-07.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'family-panel-marks-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:960,height:660}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async names=>{
  const {loadArt,drawSprite,spriteFrame}=await import('/art.js'),{drawMark}=await import('/family-panel.js');await loadArt({sheets:['family-panel-marks']});
  const root=document.createElement('div');root.id='family-marks-proof';root.style.cssText='position:fixed;inset:0;z-index:999999;background:#eee3c5;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:30px';document.body.append(root);
  const result=[];for(const id of names){const tile=document.createElement('div');tile.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px';root.append(tile);const label=document.createElement('div');label.textContent=id;tile.append(label);
   const large=document.createElement('canvas');large.width=large.height=96;tile.append(large);const drawn=drawMark(large,id,{drawSprite,spriteFrame});
   for(const bg of ['#30291f','#d7bf91']){const strip=document.createElement('div');strip.style.cssText=`background:${bg};padding:12px;display:flex;gap:12px`;tile.append(strip);for(const size of [20,24,32]){const c=document.createElement('canvas');c.width=c.height=96;c.style.width=c.style.height=size+'px';strip.append(c);drawMark(c,id,{drawSprite,spriteFrame});}}
   result.push({id,drawn,sheet:spriteFrame(id)?.sheet});
  }return result;
 },SHEETS['family-panel-marks']);assert.equal(proof.length,6);assert.ok(proof.every(p=>p.drawn&&p.sheet==='family-panel-marks'));assert.deepEqual(errors,[]);mkdirSync('docs/evidence',{recursive:true});await page.locator('#family-marks-proof').screenshot({path:'docs/evidence/family-panel-marks-art.png'});writeFileSync('docs/evidence/family-panel-marks-art.json',JSON.stringify({verdict:'PASS',frames:proof,errors},null,2));console.log('PASS: all six production marks override stand-ins and draw at panel sizes.');
}finally{await browser?.close();await app.close();}

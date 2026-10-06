import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {meetFamily} from './support/meet-family.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'notice-visual',playerCount:5}),port=await app.listen(0,'127.0.0.1');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const evidence=[];
try {
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
 await page.addInitScript(()=>{const Base=window.EventSource;window.__proofStreams=[];window.EventSource=class extends Base{constructor(...args){super(...args);window.__proofStreams.push(this);}};});
 page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 await page.locator('[name=name]').fill('Notice reader');await page.locator('[name=code]').fill(app.state.sessionCode);
 await page.getByRole('button',{name:'Join',exact:true}).click();await page.waitForFunction(()=>window.__snapshot?.world.householdId==='hh-1');
 await meetFamily(page);await page.evaluate(()=>window.__proofStreams.forEach(s=>s.close()));
 // Presentation fixture on the real joined page; does not simulate a historical outcome. The wagon's packing, open at the
 // start of a class since 2026-09-12 and hiding the card while it is (public/style.css), is put away first.
 await page.evaluate(()=>{
  const s=structuredClone(window.__snapshot),w=s.world;
  w.request=null;w.encounter=null;w.wagon=null;w.lesson=null;w.lessonResume=null;w.battleAccount=null;w.army=null;
  for(const p of w.entities) {p.service=null;p.pressing=false;}
  const p=w.entities.find(p=>p.householdId===w.householdId&&p.kind==='person'&&p.band==='adult');
  w.battleAlert={id:'visual-battle',entityId:p.id,title:'Your family at Gonzales',text:`${p.name} is with the volunteers. They are approaching the field. Look in on them before the fighting begins.`,action:'Watch the battle',field:{x:p.x||0,y:p.y||0}};
  window.__snapshot=s;window.__render(s);
 });
 mkdirSync('docs/evidence',{recursive:true});
 for(const width of [1366,1024]) {
  await page.setViewportSize({width,height:768});await page.evaluate(()=>window.__render(window.__snapshot));
  const result=await page.evaluate(()=>{
   const p=document.querySelector('#military-notice'),r=p.getBoundingClientRect(),c=document.querySelector('#military-portrait');
   return {width:innerWidth,shown:!p.hidden,kind:p.dataset.accent,fits:r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight-64,portrait:!c.hidden&&c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(v=>v!==0),name:document.querySelector('#military-person').textContent,watched:Boolean(window.__watchedField)};
  });
  assert.ok(result.shown&&result.fits&&result.portrait,JSON.stringify(result));assert.equal(result.kind,'battle');assert.ok(result.name);assert.equal(result.watched,false);
  await page.locator('#military-notice').screenshot({path:`docs/evidence/military-notice-${width}.png`});evidence.push(result);
 }
 await page.locator('#military-toggle').click();assert.ok(await page.locator('#military-message').isHidden());
 await page.locator('#military-toggle').click();assert.ok(await page.locator('#military-message').isVisible());
 await page.locator('#military-go').click();assert.ok(await page.evaluate(()=>Boolean(window.__watchedField)));
 assert.deepEqual(errors,[]);writeFileSync('docs/evidence/military-notice-visual.json',JSON.stringify({verdict:'PASS',fixture:'presentation only',evidence,collapseReopen:true,watchOnClickOnly:true,errors},null,2));
 console.log('PASS: two desktop sizes, portrait, collapse/reopen and camera moves only on Watch.');
} finally {await browser.close();await app.close();}

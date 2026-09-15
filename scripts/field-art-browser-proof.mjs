import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createClassroom} from '../server/app.mjs';
import {createSettledWorld} from '../tests/support/settled.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({playerCount:5,worldFactory(seed,n){const w=createSettledWorld(seed,n),h=w.households['hh-1'],home=w.map.sites[h.homeSiteId];
  h.stock=true;h.plots=[{id:'plot-1',x:home.x+.12,y:home.y+.12,ground:'timber',state:'cleared'},{id:'plot-2',x:home.x-.12,y:home.y+.12,ground:'prairie',state:'cleared'},{id:'plot-3',x:home.x+.12,y:home.y-.12,ground:'brush',state:'staked',work:10,spells:20}];return w;}});
const port=await app.listen(0,'127.0.0.1'),url=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE&&{executablePath:process.env.BROWSER_EXECUTABLE})});
try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('[name=name]').fill('Art proof');await page.locator('[name=code]').fill(app.state.sessionCode);await page.getByRole('button',{name:'Join',exact:true}).click();await page.waitForFunction(()=>window.__snapshot?.world.householdId);
  await page.getByRole('button',{name:'Roll the die',exact:true}).click();await page.getByRole('button',{name:'Meet your family',exact:true}).click();await page.locator('#journal-close').click();
  await page.evaluate(async()=>{const {loadArt}=await import('/art.js');await loadArt({all:true});});await page.locator('[data-view=home]').click();await page.waitForFunction(()=>window.__plotArtDrawn?.length===10);
  const art=await page.evaluate(()=>window.__plotArtDrawn);assert.equal(art.filter(a=>a.plotId==='plot-1').length,7);assert.equal(art.filter(a=>a.plotId==='plot-3').length,3);assert.ok(!art.some(a=>a.plotId==='plot-2'||a.sprite.includes('smoulder')));assert.deepEqual(errors,[]);
  mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/field-art.png'});
  writeFileSync('docs/evidence/field-art-browser.json',JSON.stringify({result:'PASS',date:new Date().toISOString(),timberStumps:7,brushPiles:3,prairieStumps:0,unrequestedFire:false,errors},null,2));console.log('PASS: distinct timber/prairie and partially cleared brush in permitted land view.');
}finally{await browser.close();await app.close();}




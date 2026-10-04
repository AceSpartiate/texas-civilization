import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {createSettledWorld,keepFoundingFamilies,taught} from '../tests/support/settled.mjs';
import {meetFamily} from './support/meet-family.mjs';
import {asMain} from './support/main-person.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'commerce-ui',playerCount:5,tickMs:200,worldFactory:(s,n)=>taught(keepFoundingFamilies(createSettledWorld(s,n)))});
const port=await app.listen(0,'127.0.0.1'),url=`http://127.0.0.1:${port}`;
const post=async(path,body,cookie)=>{const r=await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});assert.equal(r.status,200);return r;};
let browser;
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const host=await post('/api/host',{key:app.state.hostKey}),cookie=host.headers.get('set-cookie').split(';')[0];
 await page.goto(url);await page.locator('[name=name]').fill('Commerce reader');await page.locator('[name=code]').fill(app.state.sessionCode);await page.getByRole('button',{name:'Join',exact:true}).click();
 await page.waitForFunction(()=>window.__snapshot?.world.householdId==='hh-1');await meetFamily(page);
 mkdirSync('docs/evidence',{recursive:true});
 await page.locator('#wagon-load').waitFor({state:'visible'});
 await page.screenshot({path:'docs/evidence/commerce-wagon.png'});
 assert.ok(await page.locator('#wagon-capacity').getAttribute('aria-valuetext'));
 const provisions=page.locator('#wagon-items li[data-item="provisions"]');
 const initial=Number(await provisions.locator('.wagon-count').textContent());
 await provisions.locator('button[data-focus-key="provisions-less"]').click();
 await page.waitForFunction(n=>Number(document.querySelector('#wagon-items li[data-item="provisions"] .wagon-count').textContent)===n,initial-1);
 await provisions.locator('button[data-focus-key="provisions-more"]').click();
 await page.waitForFunction(n=>Number(document.querySelector('#wagon-items li[data-item="provisions"] .wagon-count').textContent)===n,initial);
 await page.locator('#wagon-stock-options summary').click();assert.ok(await page.locator('#wagon-stock').isVisible());
 await page.locator('#wagon-stock-options summary').click();
 for(const size of [{width:1366,height:768},{width:1024,height:768}]) {
  await page.setViewportSize(size);const box=await page.locator('#wagon-load').boundingBox();assert.ok(box.x>=310&&box.x+box.width<=size.width&&box.y+box.height<=size.height,JSON.stringify(box));
  assert.ok(await page.locator('#wagon-done').isVisible());
 }
 await page.locator('#wagon-done').click();
 for(let i=2;i<=5;i++)await post('/api/join',{name:`Reader ${i}`,code:app.state.sessionCode});
 await post('/api/command',{id:crypto.randomUUID(),action:'start'},cookie);await page.waitForFunction(()=>window.__snapshot?.world.status==='running');
 await asMain(page,'hh-1-elena');await page.locator('.panel-row[data-entity-id="hh-1-elena"] [data-key="visit-shop"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('#errand .errand-line').length>5);
 await page.locator('#errand-search').fill('seed');
 assert.ok(await page.locator('#errand .errand-line:visible').count()>0);
 assert.ok((await page.locator('#errand .errand-line:visible .errand-label').allTextContents()).every(t=>/seed/i.test(t)));
 await page.locator('#errand .errand-line:visible [data-act="more"]').first().focus();await page.keyboard.press('Enter');
 assert.ok(await page.locator('#errand-basket li').count()===1,'Enter should change quantity, not dispatch the errand');
 await page.locator('#errand .errand-line:visible .errand-count').first().fill('3');await page.keyboard.press('Enter');
 assert.ok((await page.locator('#errand-basket').textContent()).includes('3 ×'),'direct quantity entry should update the shopping list');
 await page.locator('#errand-search').fill('no such goods');assert.equal(await page.locator('#errand .errand-line:visible').count(),0);
 assert.equal(await page.locator('#errand-basket li').count(),1,'filters must preserve selected purchases');
 await page.locator('#errand-basket button').click();assert.equal(await page.locator('#errand-basket li').count(),0);
 await page.locator('#errand-search').fill('');await page.locator('[data-filter="sell"]').click();
 assert.ok(await page.locator('[data-filter="sell"]').getAttribute('aria-pressed')==='true');
 await page.locator('[data-filter="all"]').click();
 await page.setViewportSize({width:1440,height:950});await page.screenshot({path:'docs/evidence/commerce-stores.png'});
 for(const size of [{width:1366,height:768},{width:1024,height:768}]) {
  await page.setViewportSize(size);const box=await page.locator('#errand').boundingBox();assert.ok(box.x>=310&&box.x+box.width<=size.width&&box.y+box.height<=size.height,JSON.stringify(box));
 }
 await page.keyboard.press('Escape');assert.ok(await page.locator('#errand').isHidden());assert.deepEqual(errors,[]);
 writeFileSync('docs/evidence/commerce-ui.json',JSON.stringify({verdict:'PASS',checks:['wagon capacity and livestock disclosure','desktop bounds','search','keyboard quantity','persistent basket','remove selection','filters','Escape'],errors},null,2));
 console.log('PASS: commerce controls, desktop layout and browser errors');
} finally {await browser?.close();await app.close();}

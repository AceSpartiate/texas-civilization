import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createClassroom} from '../server/app.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'alamo-art-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1'),url=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE&&{executablePath:process.env.BROWSER_EXECUTABLE})});
mkdirSync('test-results',{recursive:true});const errors=[],requests=[];
try{
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.goto(url+'/alamo-workshop.html');await page.waitForFunction(()=>window.__alamo?.ready);await page.screenshot({path:'test-results/alamo-compound.png'});
assert.equal(await page.evaluate(()=>window.__alamo.rooms),32);
await page.locator('#room-focus').selectOption('church-nave');await page.screenshot({path:'test-results/alamo-church.png'});
await page.locator('#joe-study').click();await page.waitForFunction(()=>window.__alamo.actors.find(a=>a.id==='joe-study').hiding,{},{timeout:30000});
await page.screenshot({path:'test-results/alamo-joe-room.png'});
await page.getByRole('button',{name:'Study emergence',exact:true}).click();await page.waitForFunction(()=>window.__alamo.actors.find(a=>a.id==='joe-study').gesture==='speak',{},{timeout:15000});
await page.screenshot({path:'test-results/alamo-joe-speaking.png'});
const ids=await page.evaluate(()=>window.__alamo.actors.map(a=>a.id));assert.equal(new Set(ids).size,3);
await page.locator('#preview-play').click();await page.waitForTimeout(100);const paused=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(250);assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),paused);
await page.getByRole('button',{name:'Close note',exact:true}).click();await page.locator('#fit-compound').click();
await page.locator('#assembly-settings summary').click();await page.locator('#north-wall').selectOption('breached');await page.locator('#assembly-settings summary').click();
assert.equal(await page.evaluate(()=>window.__alamo.wallStates['north-4']),0);await page.screenshot({path:'test-results/alamo-breach.png'});
await page.locator('#roof-mode').selectOption('roofs');await page.screenshot({path:'test-results/alamo-roofs.png'});
await page.setViewportSize({width:390,height:844});await page.locator('#fit-compound').click();await page.screenshot({path:'test-results/alamo-phone.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
assert.deepEqual(errors,[]);assert.equal(requests.some(r=>r.includes('/api/')),false,'art workshop never queries or mutates class data');assert.equal(requests.some(r=>!r.startsWith(url)),false);
const result={result:'PASS',date:new Date().toISOString(),browser:await browser.version(),rooms:32,units:'ft',joeWalkHideEmergeSpeak:true,persistentPreviewActorIds:true,northWallBreach:true,pauseStable:true,phoneNoOverflow:true,classRequests:0,externalRequests:0,errors};
writeFileSync('docs/evidence/alamo-art-browser.json',JSON.stringify(result,null,2)+'\n');console.log(result);
}finally{await browser.close();await app.close();}

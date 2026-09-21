import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClassroom } from '../server/app.mjs';
import { meetFamily } from './support/meet-family.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = createClassroom({ seed:'art-proof', playerCount:5, tickMs:500 });
const port = await app.listen(0,'127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE && {executablePath:process.env.BROWSER_EXECUTABLE})});
const errors = [], external = [];
const capture = page => { page.on('pageerror',e=>errors.push(e.message)); page.on('request',r=>{ if(!r.url().startsWith(url))external.push(r.url()); }); };
mkdirSync('test-results',{recursive:true});
try {
  const host = await browser.newPage({viewport:{width:1440,height:950}}); capture(host);
  await host.goto(`${url}/host#${app.state.hostKey}`);
  const clients=[];
  for(let i=0;i<5;i++){
    const page=await browser.newPage({viewport:{width:1440,height:950}});capture(page);
    await page.goto(url);await page.locator('[name=name]').fill(`Art reader ${i+1}`);await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button',{name:'Join',exact:true}).click();await page.waitForFunction(()=>window.__snapshot?.world.householdId);await meetFamily(page);clients.push(page);
  }
  const page=clients[0];
  await page.evaluate(async()=>{const a=await import('/art.js');await a.loadArt({all:true});});
  await page.locator('[data-view=home]').click();
  await host.getByRole('button',{name:'Start',exact:true}).click();
  // The principal's "Plant the field" on the family panel (docs/FAMILY_PANEL.md), once the family is on its land to plant it.
  const plant='.panel-row[data-principal=true] .panel-icon[data-key="plant-field"]';
  await page.waitForFunction(s=>{const b=document.querySelector(s);return b&&b.getAttribute('aria-disabled')!=='true';},plant,{timeout:60000});
  await page.locator(plant).click();
  await page.waitForFunction(()=>window.__animation?.clips.some(c=>c.endsWith('-work')||c.endsWith('-sow')));
  const a=await page.locator('#world-map').evaluate(c=>c.toDataURL());
  await page.waitForTimeout(330);
  const b=await page.locator('#world-map').evaluate(c=>c.toDataURL());assert.notEqual(a,b,'working map visibly animates');
  const perf=await page.evaluate(()=>window.__animation);
  await host.getByRole('button',{name:'Pause',exact:true}).click();
  await page.waitForFunction(()=>window.__snapshot.world.status==='paused');
  await page.waitForTimeout(100);
  const paused=await page.locator('#world-map').evaluate(c=>c.toDataURL());
  await page.waitForTimeout(350);assert.equal(await page.locator('#world-map').evaluate(c=>c.toDataURL()),paused,'pause freezes all map art');
  await page.screenshot({path:'test-results/art-live-wide.png'});
  await page.locator('#journal-toggle').click();await page.locator('#journal-close').waitFor({state:'visible'});
  assert.equal(await page.locator('#family-journal').getAttribute('data-open'),'true');
  await page.screenshot({path:'test-results/art-journal.png'});await page.keyboard.press('Escape');
  assert.equal(await page.locator('#family-journal').getAttribute('data-open'),'false');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-results/art-live-phone.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({id:e.id,right:e.getBoundingClientRect().right})))));
  const catalog=await browser.newPage({viewport:{width:1440,height:1000}});capture(catalog);
  await catalog.goto(`${url}/art-catalog.html`);await catalog.waitForFunction(()=>window.__catalog?.clips>90);
  assert.deepEqual(await catalog.evaluate(()=>window.__catalog.missingSheets),[]);
  await catalog.locator('#catalog-kind').selectOption('clip');await catalog.locator('#catalog-search').fill('rust-walk');
  const tile=catalog.locator('[data-clip="rust-walk"] canvas');await tile.scrollIntoViewIfNeeded();
  const p1=await tile.evaluate(c=>c.toDataURL());await catalog.waitForTimeout(310);const p2=await tile.evaluate(c=>c.toDataURL());assert.notEqual(p1,p2,'authored walk changes pixels');
  await catalog.locator('#catalog-play').click();
  await catalog.waitForTimeout(100);const held=await tile.evaluate(c=>c.toDataURL());await catalog.waitForTimeout(300);assert.equal(await tile.evaluate(c=>c.toDataURL()),held);
  // Astra's four deliveries of the evening of 2026-09-21, each painting real ink in a real browser: the mounted family,
  // the seated wagon drivers, the mustang and the Yellow Stone under way, and the Alamo's south elevations. A blank tile
  // is the thing to catch - a sheet that 404s, a frame measured outside its atlas - and a count of tiles would not: the
  // tile is built from the manifest whether or not the picture behind it arrives. Which of these the GAME draws is held
  // elsewhere (tests/art-library.test.mjs, tests/riding.test.mjs, scripts/riding-browser-proof.mjs,
  // scripts/alamo-style-shots.mjs); this is only that the library can put them on a canvas.
  // The tile is drawn on an opaque background, so counting opaque pixels counts the background and would pass on a blank
  // tile - the shape of check this project keeps having to throw away. What is counted is pixels that differ from the
  // tile's own corner, and the control below shows the number really does go to nothing when the picture is not there.
  const inked = async (page,kind,name)=>{
    await page.locator('#catalog-kind').selectOption(kind==='clip'?'clip':'sprite');
    await page.locator('#catalog-search').fill(name);
    const cell=page.locator(`[data-${kind}="${name}"] canvas`);
    await cell.waitFor({state:'visible',timeout:10000});
    await cell.scrollIntoViewIfNeeded();await page.waitForTimeout(250);
    const box=await cell.boundingBox();
    assert.ok(box && box.width>20 && box.height>20,`${name} has no box on the screen: ${JSON.stringify(box)}`);
    return cell.evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      const r=d[0],g=d[1],b=d[2];let n=0;
      for(let i=0;i<d.length;i+=4)if(d[i+3]>24&&(Math.abs(d[i]-r)+Math.abs(d[i+1]-g)+Math.abs(d[i+2]-b))>24)n++;
      return n;});
  };
  const DELIVERED=[['clip','rust-ride-e'],['clip','blue-girl-ride-n'],['clip','blue-wagon-driver-w'],['clip','mustang-graze'],['clip','steamboat-laden'],['sprite','alamo-face-church-south'],['sprite','alamo-face-gate']];
  const deliveries={};
  for(const [kind,name] of DELIVERED){deliveries[name]=await inked(catalog,kind,name);assert.ok(deliveries[name]>2000,`${name} drew ${deliveries[name]} pixels of its own in the catalog`);}
  // The control: the same page with one atlas refused. Its tile must go to nothing, or the count above means nothing.
  const dark=await browser.newPage({viewport:{width:1440,height:1000}});capture(dark);
  await dark.route('**/atlases/people-mounted-cast1-e.png*',route=>route.abort());
  await dark.goto(`${url}/art-catalog.html`);await dark.waitForFunction(()=>window.__catalog?.clips>90);
  const withheld=await inked(dark,'clip','rust-ride-e'),neighbour=await inked(dark,'clip','blue-girl-ride-n');
  assert.ok(withheld<deliveries['rust-ride-e']/10,`a refused sheet still drew ${withheld} pixels (against ${deliveries['rust-ride-e']})`);
  assert.ok(neighbour>2000,`refusing one sheet blanked another: blue-girl-ride-n drew ${neighbour}`);
  await dark.close();
  await catalog.locator('#catalog-kind').selectOption('clip');
  await catalog.locator('#catalog-search').fill('wagon');await catalog.screenshot({path:'test-results/art-wagon-rig.png'});
  await catalog.locator('#catalog-search').fill('');await catalog.screenshot({path:'test-results/art-workshop.png'});
  await catalog.locator('#catalog-reduced').check();await catalog.locator('#catalog-play').click();
  const reducedTile=catalog.locator('[data-clip="rust-walk"] canvas');await reducedTile.scrollIntoViewIfNeeded();await catalog.waitForTimeout(100);
  const still=await reducedTile.evaluate(c=>c.toDataURL());await catalog.waitForTimeout(300);assert.equal(await reducedTile.evaluate(c=>c.toDataURL()),still,'reduced motion uses stable poses');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  const result={result:'PASS',date:new Date().toISOString(),browser:await browser.version(),catalog:await catalog.evaluate(()=>window.__catalog),actualAnimatedPixels:true,pauseFreezesPixels:true,reducedMotionStable:true,phoneNoOverflow:true,journalKeyboard:true,externalRequests:external.length,observedDrawMs:perf.drawMs,deliveredPixels:deliveries,withheldSheetPixels:withheld,errors};
  mkdirSync('docs/evidence',{recursive:true});writeFileSync('docs/evidence/art-browser.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
} finally {await browser.close();await app.close();}

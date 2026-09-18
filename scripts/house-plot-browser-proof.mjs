import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createClassroom} from '../server/app.mjs';
import {createGonzalesWorld} from '../sim/gonzales.mjs';
import {applyAction,stepWorld,validateWorld} from '../sim/world.mjs';
import {holdingOf} from '../sim/grants.mjs';
import {siteFactsFor} from '../sim/homesite.mjs';
import {keepFoundingFamilies} from '../tests/support/settled.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'plot-browser',playerCount:5,tickMs:80,worldFactory(seed,n){
  const world=createGonzalesWorld(seed,n,{map:'colonies'}); world.status='running';
  for(let i=0;i<200&&Object.values(world.households).some(h=>h.arriving);i++)stepWorld(world);
  const h=world.households['hh-1'],b=holdingOf(world,h).bounds;
  let point;
  for(let y=0;y<7&&!point;y++)for(let x=0;x<7&&!point;x++){const p={x:b.minX+(b.maxX-b.minX)*(x+.5)/7,y:b.minY+(b.maxY-b.minY)*(y+.5)/7};if(siteFactsFor(world,h,p).can)point=p;}
  applyAction(world,h.id,{action:'choose-site',...point});
  for(let i=0;i<60&&h.members.some(id=>world.entities[id].travel);i++)stepWorld(world);
  h.logs={wall:120,sill:12,poor:12};world.status='lobby';keepFoundingFamilies(world);validateWorld(world);return world;
}});
const port=await app.listen(0,'127.0.0.1'),url=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE&&{executablePath:process.env.BROWSER_EXECUTABLE})});
const post=async(path,body,cookie)=>{const r=await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie&&{Cookie:cookie})},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r;};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('[name=name]').fill('Builder');await page.locator('[name=code]').fill(app.state.sessionCode);await page.getByRole('button',{name:'Join',exact:true}).click();await page.waitForFunction(()=>window.__snapshot?.world.householdId==='hh-1');
 const press=async selector=>{await page.waitForFunction(s=>{const e=document.querySelector(s);return e&&!e.disabled&&!e.hidden;},selector);await page.evaluate(s=>document.querySelector(s).click(),selector);};
 for(let i=2;i<=5;i++)await post('/api/join',{name:`Builder ${i}`,code:app.state.sessionCode});
 const host=await post('/api/host',{key:app.state.hostKey});await post('/api/command',{id:'plot-proof-start',action:'start'},host.headers.get('set-cookie').split(';')[0]);
 await page.waitForFunction(()=>window.__snapshot.world.status==='running');
 await press('#house-open');await press('[data-plan="round-log"]');await page.waitForFunction(()=>window.__snapshot.world.land.house?.plan==='round-log');
 await press('[data-piece="loft"]');await press('#plot-grid button[data-x="3"][data-y="2"]:not(.plot-cell)');await page.waitForFunction(()=>window.__snapshot.world.land.house.pieces.length===3);
 assert.equal(app.state.world.households['hh-1'].house.pieces[2].type,'loft');
 await press('[data-remove="2"]');await page.waitForFunction(()=>window.__snapshot.world.land.house.pieces.length===2);
 await press('[data-piece="porch"]');await press('.plot-cell[data-x="0"][data-y="0"]');await page.waitForFunction(()=>document.querySelector('#plot-note').textContent.includes('front'));
 assert.equal(app.state.world.households['hh-1'].house.pieces.length,2);
 // What the next stage wants, on the panel where the student reads it (owner, 2026-09-17: 'say what the next house stage needs').
 await page.waitForTimeout(2500);
 const nextSaid=await page.evaluate(()=>[...document.querySelectorAll('#plot-summary .house-line')].map(n=>n.textContent).find(text=>text.startsWith('Next:')));
 assert.match(nextSaid,/^Next: laying the sills on the round-log pen\. It wants 4 sill logs and about \d+ hours\u2019 work; \d+ sound( and \d+ poor)? at the house/);
 mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/house-plot.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width:1440,height:1000});await press('#plot-close');
 const principal=await page.evaluate(()=>window.__snapshot.world.household.principalId);
 await page.evaluate(async id=>{const r=await fetch('/api/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'plot-proof-build',action:'chore',entityId:id,chore:'build-house'})});if(!r.ok)throw Error(await r.text());},principal);
 await page.waitForFunction(()=>window.__snapshot.world.land.house?.stage==='finished',null,{timeout:60000});
 assert.equal(app.state.world.households['hh-1'].logs.wall+app.state.world.households['hh-1'].logs.sill,82);
 await press('#house-open');await page.waitForFunction(()=>document.querySelector('#plot-summary').textContent.includes('Living in it now'));
 assert.deepEqual(errors,[]);validateWorld(app.state.world);
 writeFileSync('docs/evidence/house-plot-browser.json',JSON.stringify({date:new Date().toISOString(),result:'PASS',scope:'Same-computer student integration',checks:['preset through command','loft added inside occupied pen','unstarted loft removed','invalid porch refused without mutation','phone fits','stage construction consumes 50 logs','finished shelter displayed','the next stage says what it wants: '+nextSaid],errors},null,2));
 console.log('PASS: student plans, edits, refuses invalid placement, builds from logs and sees completed shelter.');
}finally{await browser.close();await app.close();}

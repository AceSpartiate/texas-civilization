import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createClassroom} from '../server/app.mjs';
import {createGonzalesWorld} from '../sim/gonzales.mjs';
import {applyAction,stepWorld,validateWorld} from '../sim/world.mjs';
import {holdingOf} from '../sim/grants.mjs';
import {siteFactsFor} from '../sim/homesite.mjs';
import {keepFoundingFamilies} from '../tests/support/settled.mjs';
import {meetFamily} from './support/meet-family.mjs';
// The student's house, end to end on one computer: pick a plan, move its preview over the land, turn it, press "Build
// here", raise it from the pile, live in it. Since 2026-09-22 a plan opens a placement step before anything is built
// (HANDOFF.md "House placement preview"); since 2026-09-23 the preview is held to the house it becomes - the same size
// in the people's yardstick, the same turn and the same footprint (tests/house-preview.test.mjs holds the drawing). Since
// 2026-09-23 a turn turns the house on the ground and never its pictures (tests/house-turn.test.mjs), and a tap on a placed
// house opens its rooms where it is drawn, not at the family's site point (tests/house-tap.test.mjs).
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
// The world the server runs, held here: `app.state` is a copy, and the house's saved turn is set on the world itself below.
let liveWorld=null;
const app=createClassroom({seed:'plot-browser',playerCount:5,tickMs:80,worldFactory(seed,n){
  const world=liveWorld=createGonzalesWorld(seed,n,{map:'colonies'}); world.status='running';
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
// SIZE.cabin in public/app.js: a house on the map is this many people high (`cabinSize`).
const CABIN=3.3;
// Pictures of the house as the student sees it, for looking at: every plan in the chooser, the preview at each quarter turn,
// the house that stands at three zooms (2026-09-23: "the roof ... slides forward"; tests/house-roof.test.mjs holds it).
const SHOTS=process.env.HOUSE_SHOTS||'test-results';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Every picture of a house the map draws, cut from the house sheets, with the transform it is drawn under: a house turned
 // on the ground must never be drawn turned (2026-09-23: at 90 degrees it lay on its side, at 180 it stood on its roof).
 await page.addInitScript(()=>{const drawImage=CanvasRenderingContext2D.prototype.drawImage;fetch('/assets/frontier-v1/atlas.json').then(r=>r.json()).then(atlas=>{window.__houseCuts=new Map(Object.entries(atlas.frames).filter(([,f])=>f.sheet==='house-modules'||f.sheet==='houses-settling').map(([name,f])=>[`${f.x},${f.y},${f.w},${f.h}`,name]));});
  CanvasRenderingContext2D.prototype.drawImage=function(...args){const name=args.length===9&&window.__houseCuts?.get(`${args[1]},${args[2]},${args[3]},${args[4]}`);if(name&&!this.canvas.closest?.('#house-plot')){const t=this.getTransform();(window.__houseImages||=[]).push({name,a:t.a,b:t.b,c:t.c,d:t.d,e:t.e,f:t.f});}return drawImage.apply(this,args);};});
 await page.goto(url);await page.locator('[name=name]').fill('Builder');await page.locator('[name=code]').fill(app.state.sessionCode);await page.getByRole('button',{name:'Join',exact:true}).click();await page.waitForFunction(()=>window.__snapshot?.world.householdId==='hh-1');
 const press=async selector=>{await page.waitForFunction(s=>{const e=document.querySelector(s);return e&&!e.disabled&&!e.hidden;},selector);await page.evaluate(s=>document.querySelector(s).click(),selector);};
 for(let i=2;i<=5;i++)await post('/api/join',{name:`Builder ${i}`,code:app.state.sessionCode});
 // The title screen comes down and the wagon is put away, the way a student does, so the map is what is seen (and shot).
 await meetFamily(page);
 for(const button of ['#wagon-done','#tutorial-skip'])if(await page.locator(button).isVisible())await page.locator(button).click({timeout:5000}).catch(()=>{});
 const host=await post('/api/host',{key:app.state.hostKey});await post('/api/command',{id:'plot-proof-start',action:'start'},host.headers.get('set-cookie').split(';')[0]);
 await page.waitForFunction(()=>window.__snapshot.world.status==='running');
 const principal=await page.evaluate(()=>window.__snapshot.world.household.principalId);
 // The student picks their father first, which brings the camera in to the family; the instruction card it opens is closed.
 await page.evaluate(id=>document.querySelector(`[data-portrait="${id}"]`)?.click(),principal);await page.waitForTimeout(800);
 if(await page.locator('#selection-close').isVisible())await page.locator('#selection-close').click();
 // A plan opens the placement step, and nothing is planned on the server until "Build here".
 await press('#house-open');
 mkdirSync(SHOTS,{recursive:true});
 await page.waitForFunction(()=>document.querySelectorAll('#plot-plans canvas').length>=5);await page.waitForTimeout(1500);
 await page.locator('#plot-plans').screenshot({path:`${SHOTS}/house-plans.png`});
 await press('[data-plan="round-log"]');
 await page.waitForFunction(()=>!document.querySelector('#house-placement').hidden);
 assert.equal(app.state.world.households['hh-1'].house?.plan,undefined,'picking a plan planned the house before it was placed');
 // The pointer over the land carries the preview; the map's own pointer events, on the map's own canvas.
 const box=await page.locator('#world-map').boundingBox();
 const pointer=(type,p)=>page.evaluate(([type,p])=>{const c=document.querySelector('#world-map');c.dispatchEvent(new PointerEvent(type,{clientX:p.x,clientY:p.y,pointerId:7,pointerType:'mouse',button:0,buttons:type==='pointerdown'?1:0,isPrimary:true,bubbles:true}));},[type,p]);
 const middle={x:box.x+box.width/2,y:box.y+box.height/2};
 // Over open ground just up and to the left of the father, where the preview can be seen beside the family's people.
 const beside=await page.evaluate(([id,box])=>{const c=document.querySelector('#world-map'),at=window.__drawnAt?.[id],f=window.__camera?.figure||0,k=box.width/c.width;return at&&{x:box.x+(at.x-3*f)*k,y:box.y+(at.y-3.5*f)*k};},[principal,box]);
 await pointer('pointermove',beside||middle);
 const drawnNow=()=>page.evaluate(()=>({houses:window.__placedHousesDrawn||[],figure:window.__camera?.figure,scale:window.__camera?.scale}));
 const previewAt=async rotation=>{await page.waitForFunction(r=>(window.__placedHousesDrawn||[]).some(h=>h.preview&&h.rotation===r&&h.pieces>0),rotation);const frame=await drawnNow();return [frame,frame.houses.find(h=>h.preview)];};
 const aim=beside||middle,k=await page.evaluate(()=>document.querySelector('#world-map').width)/box.width;
 const [firstFrame,first]=await previewAt(0);
 // It is drawn under the pointer: a hover before any press on the map once put it at no number at all, so nothing showed.
 assert.ok(Number.isFinite(first.x)&&Math.hypot(first.x-(aim.x-box.x)*k,first.y-(aim.y-box.y)*k)<2,`preview drawn at ${first.x},${first.y}, not under the pointer`);
 // The preview is a house the size of the map's houses, in the yardstick of the people standing by it: not seventeen feet.
 assert.ok(Math.abs(first.size-Math.max(5,firstFrame.figure*CABIN))<1e-6,`preview drawn ${first.size} pixels high where a house is ${CABIN} people of ${firstFrame.figure}`);
 assert.ok(first.footprint.w>0&&first.footprint.h>0,'the preview outlined no footprint');
 mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/house-placement-preview.png'});
 if(process.env.PREVIEW_SHOT)await page.screenshot({path:process.env.PREVIEW_SHOT});
 // The house drawn at (x, y) on the map's canvas, `size` high, cut out of the page for looking at.
 const shoot=(name,house)=>page.screenshot({path:`${SHOTS}/${name}.png`,clip:{x:box.x+house.x/k-house.size*1.6/k,y:box.y+house.y/k-house.size*1.4/k,width:house.size*3.2/k,height:house.size*2.2/k}});
 await shoot('house-preview-0',first);
 // A quarter turn turns the preview and nothing else about it: all the way round, and back to a quarter to be built.
 for(const turn of [90,180,270]){await press('#house-rotate');const [,turned]=await previewAt(turn);await shoot(`house-preview-${turn}`,turned);}
 await press('#house-rotate');await previewAt(0);await press('#house-rotate');
 const [previewFrame,preview]=await previewAt(90);
 assert.equal(preview.size/previewFrame.figure,first.size/firstFrame.figure);
 // Its footprint is the one at 0 turned a quarter on the ground: as wide as that one was deep.
 assert.ok(Math.abs(preview.footprint.w-first.footprint.h)<1e-6&&Math.abs(preview.footprint.h-first.footprint.w)<1e-6,`the footprint at 90 degrees ${JSON.stringify(preview.footprint)} is not the one at 0 ${JSON.stringify(first.footprint)} turned`);
 // A tap holds the preview where it is; "Build here" sends the one command. Nearest the middle first, until the land takes it.
 const replies=[];page.on('response',async r=>{if(r.url().endsWith('/api/command')&&r.request().method()==='POST'){const b=JSON.parse(r.request().postData()||'{}');if(b.placement)replies.push({status:r.status(),body:await r.text()});}});
 const spots=[];for(let gy=0;gy<9;gy++)for(let gx=0;gx<9;gx++)spots.push({x:box.x+box.width*(gx+.5)/9,y:box.y+box.height*(gy+.5)/9});
 spots.sort((a,b)=>Math.hypot(a.x-middle.x,a.y-middle.y)-Math.hypot(b.x-middle.x,b.y-middle.y));
 let placed=false;
 for(const at of spots){
   await pointer('pointerdown',at);await pointer('pointerup',at);await press('#house-placement-confirm');
   await page.waitForFunction(()=>document.querySelector('#house-placement').hidden||!document.querySelector('#house-placement-confirm').disabled,null,{timeout:5000}).catch(()=>{});
   await page.waitForTimeout(300);
   if(placed=await page.evaluate(()=>window.__snapshot.world.land.house?.plan==='round-log'))break;
 }
 assert.ok(placed,`no spot on the map was taken: ${JSON.stringify(replies.slice(-3))}`);
 assert.equal(replies.filter(r=>/Command ID required/.test(r.body)).length,0,'a placement was refused for its id');
 const serverPlacement=app.state.world.households['hh-1'].house.placement;
 assert.equal(serverPlacement.rotation,90,'the house was not placed at the turn its preview showed');
 await page.waitForFunction(()=>document.querySelector('#house-placement').hidden);
 // What the next stage wants, on the panel where the student reads it (owner, 2026-09-17: 'say what the next house stage needs').
 await press('#house-open');await page.waitForTimeout(2500);
 const nextSaid=await page.evaluate(()=>[...document.querySelectorAll('#plot-summary .house-line')].map(n=>n.textContent).find(text=>text.startsWith('Next:')));
 assert.match(nextSaid,/^Next: laying the sills on the round-log pen\. It wants 4 sill logs and about \d+ hours’ work; \d+ sound( and \d+ poor)? at the house/);
 await page.screenshot({path:'test-results/house-plot.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width:1440,height:1000});await press('#plot-close');
 // Build it. A wet day holds the daub and the roof (sim/weather.mjs `rainHold`) and the builder goes off to rest, so when the
 // sky has cleared and nobody is at it, the student sends him back - the way a student would. The seeded weather decides
 // whether that happens in a run; the proof does not depend on the build missing the rain.
 const build=n=>page.evaluate(async([id,n])=>{const r=await fetch('/api/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:`plot-proof-build-${n}`,action:'chore',entityId:id,chore:'build-house'})});if(!r.ok)throw Error(await r.text());},[principal,n]);
 await build(0);
 for(let tries=1,began=Date.now(),land;(land=await page.evaluate(()=>window.__snapshot.world.land.house))?.stage!=='finished';){
   assert.ok(Date.now()-began<150000,`the house never stood: ${JSON.stringify({stage:land?.stage,why:land?.why,pieces:land?.pieces})}`);
   if(!land?.why&&!app.state.world.entities[principal].chore)await build(tries++);
   await page.waitForTimeout(1000);
 }
 assert.equal(app.state.world.households['hh-1'].logs.wall+app.state.world.households['hh-1'].logs.sill,82);
 // The house that stands is the house the preview showed: the same size for the same camera, turn and footprint.
 await page.waitForFunction(()=>(window.__placedHousesDrawn||[]).some(h=>!h.preview&&h.pieces>=2));
 const builtFrame=await drawnNow(),built=builtFrame.houses.find(h=>!h.preview&&h.pieces>=2);
 assert.ok(Math.abs(built.size-Math.max(5,builtFrame.figure*CABIN))<1e-6,`built house drawn ${built.size} pixels high where a house is ${CABIN} people of ${builtFrame.figure}`);
 assert.ok(Math.abs(built.size/builtFrame.figure-preview.size/previewFrame.figure)<1e-9,'the built house and its preview are not the same size in people');
 assert.equal(built.rotation,preview.rotation);
 for(const k of ['x','y','w','h'])assert.ok(Math.abs(built.footprint[k]/built.cell-preview.footprint[k]/preview.cell)<1e-9,`footprint ${k} differs from the preview's`);
 // The house that stands, at the camera's zoom, closer in and further out: the roof on its walls at every one.
 await shoot('house-built',built);
 const builtNow=()=>page.evaluate(()=>(window.__placedHousesDrawn||[]).find(h=>!h.preview&&h.pieces>=2));
 // The house that stands, at each quarter turn: turned on the ground by its saved placement, as the server keeps it, and
 // drawn upright. The page draws what the server says, so the saved turn is set here as a later class would find it.
 const placedTurn=serverPlacement.rotation,turnTo=rotation=>{liveWorld.households['hh-1'].house.placement.rotation=rotation;},turns={};
 for(const rotation of [0,90,180,270]){
   turnTo(rotation);
   await page.waitForFunction(r=>(window.__placedHousesDrawn||[]).some(h=>!h.preview&&h.pieces>=2&&h.rotation===r),rotation,{timeout:15000}).catch(async error=>{throw new Error(`the house was not drawn at ${rotation} degrees: ${JSON.stringify(await page.evaluate(()=>({placement:window.__snapshot?.world.land?.house?.placement,drawn:(window.__placedHousesDrawn||[]).map(h=>[h.preview,h.rotation,h.pieces]),status:window.__snapshot?.world.status})))} server ${JSON.stringify(app.state.world.households['hh-1'].house.placement)}`);});
   await page.waitForTimeout(400);await page.evaluate(()=>{window.__houseImages=[];});await page.waitForTimeout(700);
   const all=await page.evaluate(()=>window.__houseImages||[]),turned=all.filter(i=>Math.abs(i.b)>1e-9||Math.abs(i.c)>1e-9||i.d<=0);
   // This house's own pictures: those standing (each is drawn translated to its foot) inside the box it was drawn in.
   const drawnHouse=await builtNow(),hb=drawnHouse.box,images=all.filter(i=>i.e>=hb.left-1&&i.e<=hb.right+1&&i.f>=hb.top-1&&i.f<=hb.bottom+1);
   assert.ok(images.some(i=>/full-walls$/.test(i.name))&&images.some(i=>/chimney/.test(i.name)),`at ${rotation} degrees no pen or chimney picture was drawn: ${JSON.stringify(images.slice(0,4))}`);
   assert.deepEqual(turned,[],`at ${rotation} degrees a picture of the house was drawn turned`);
   // Mirrored at a quarter turn, where the gable comes round to the other face; as drawn at a half turn.
   assert.ok(images.every(i=>(i.a<0)===(rotation%180!==0)),`at ${rotation} degrees the pictures are mirrored the wrong way: ${JSON.stringify(images.map(i=>[i.name,+i.a.toFixed(3)]))}`);
   const at=drawnHouse;await shoot(`house-built-${rotation}`,at);
   turns[rotation]={pictures:images.length,housePicturesOnTheMap:all.length,turned:turned.length,mirrored:images.filter(i=>i.a<0).length,footprintCells:{w:+(at.footprint.w/at.cell).toFixed(3),h:+(at.footprint.h/at.cell).toFixed(3)}};
 }
 turnTo(placedTurn);await page.waitForFunction(r=>(window.__placedHousesDrawn||[]).some(h=>!h.preview&&h.pieces>=2&&h.rotation===r),placedTurn);
 // A tap on the house where it is drawn opens its rooms; the family's site point, where nothing of it stands, is not a house.
 if(await page.locator('#plot-close').isVisible())await page.locator('#plot-close').click();
 const tappedAt=await (async()=>{const drawnHouse=await builtNow(),b=drawnHouse.box;assert.ok(b&&b.right>b.left,'the built house recorded no box it was drawn in');
   const hits=await page.evaluate(()=>[...(window.__housesDrawn||new Map()).entries()].map(([key,spot])=>({key,siteId:spot.siteId||key,placed:Boolean(spot.siteId)})));
   assert.ok(hits.some(h=>h.placed)&&!hits.some(h=>!h.placed),`the taps a house answers are not where it stands: ${JSON.stringify(hits)}`);
   // Up in the roof, away from anybody at the door, then the walls: the first place on the house nobody stands in front of.
   for(const [u,v] of [[.5,.2],[.35,.3],[.65,.3],[.5,.45],[.3,.55],[.7,.55]]){
     const p={x:box.x+(b.left+(b.right-b.left)*u)/k,y:box.y+(b.top+(b.bottom-b.top)*v)/k};
     await page.mouse.click(p.x,p.y);await page.waitForTimeout(500);
     if(await page.evaluate(()=>!document.querySelector('#interior')?.hidden))return p;
   }
   return null;})();
 assert.ok(tappedAt,'a tap on the placed house where it is drawn did not open its rooms');
 const roomsShown=await page.evaluate(()=>({title:document.querySelector('#interior')?.textContent.slice(0,40),shown:Boolean(window.__interiorShown)}));
 assert.ok(roomsShown.shown,'the rooms panel opened with nothing in it');
 await page.screenshot({path:`${SHOTS}/house-rooms-opened.png`});
 await page.locator('#interior-close').click().catch(()=>{});
 for(const [name,delta] of [['house-built-zoom-in',-360],['house-built-zoom-out',720]]){
   const at=await builtNow();await page.mouse.move(box.x+at.x/k,box.y+at.y/k);await page.mouse.wheel(0,delta);await page.waitForTimeout(900);
   await shoot(name,await builtNow());
 }
 // The family lives in it, and the panel offers another house (“Living in it now” went with the component editor, e9a0974).
 assert.notEqual(await page.evaluate(()=>window.__snapshot.world.land.shelter),'camp','the family is still in its camp');
 await press('#house-open');await page.waitForFunction(()=>document.querySelector('#plot-summary').textContent.startsWith('House 1: ')&&[...document.querySelectorAll('#plot-plans button')].some(b=>b.textContent.includes('Build another')));
 assert.deepEqual(errors,[]);validateWorld(app.state.world);
 const inPeople=frame=>+(frame.houses.find(h=>h.preview===(frame===previewFrame))?.size/frame.figure).toFixed(3);
 const size={previewPixels:+preview.size.toFixed(1),builtPixels:+built.size.toFixed(1),figurePixels:{preview:+previewFrame.figure.toFixed(2),built:+builtFrame.figure.toFixed(2)},housePeopleHigh:{preview:inPeople(previewFrame),built:inPeople(builtFrame)},footprintCells:{w:preview.footprint.w/preview.cell,h:preview.footprint.h/preview.cell},rotation:preview.rotation,wasPixelsInTrueFeet:+(previewFrame.scale*8/5280/.45).toFixed(2)};
 writeFileSync('docs/evidence/house-plot-browser.json',JSON.stringify({date:new Date().toISOString(),result:'PASS',scope:'Same-computer student integration',checks:['plan opens placement without planning','preview drawn a house high in the people’s yardstick','preview turned a quarter','Build here places at the preview’s turn','the next stage says what it wants: '+nextSaid,'phone fits','stage construction consumes 50 logs','built house the preview’s size, turn and footprint','finished shelter displayed','the built house at 0/90/180/270 degrees: every picture upright (no rotation or shear), mirrored at 90 and 270','a tap on the placed house where it is drawn opens its rooms; the site point is no longer a house','pictures: every plan in the chooser, the preview at 0/90/180/270 degrees, the built house at three zooms (roof seated: tests/house-roof.test.mjs)'],pictures:['house-plans','house-preview-0','house-preview-90','house-preview-180','house-preview-270','house-built','house-built-0','house-built-90','house-built-180','house-built-270','house-rooms-opened','house-built-zoom-in','house-built-zoom-out'].map(name=>`${name}.png`),size,turns,roomsOpenedAt:tappedAt&&{x:+tappedAt.x.toFixed(1),y:+tappedAt.y.toFixed(1)},placement:serverPlacement,errors},null,2));
 console.log('PASS: student picks a plan, places and turns its preview, builds here from logs, and the house that stands is the preview’s size, turn and footprint, upright at every turn, and opens where it stands.',JSON.stringify({size,turns}));
}finally{await browser.close();await app.close();}

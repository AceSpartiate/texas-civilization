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
import {checkHousePlacement} from '../sim/house-placement.mjs';
import {PIECES,plotCatalogue} from '../sim/houseplot.mjs';
import {SPACE_REFUSAL,houseOnGround,overlaps} from '../sim/house-footprint.mjs';
// The student's house, end to end on one computer: pick a plan, move its preview over the land, turn it, press "Build
// here", raise it from the pile, live in it. Since 2026-09-22 a plan opens a placement step before anything is built
// (HANDOFF.md "House placement preview"); since 2026-09-23 the preview is held to the house it becomes - the same size
// in the people's yardstick, the same turn and the same footprint (tests/house-preview.test.mjs holds the drawing). Since
// 2026-09-23 a turn turns the house on the ground and never its pictures (tests/house-turn.test.mjs), and a tap on a placed
// house opens its rooms where it is drawn, not at the family's site point (tests/house-tap.test.mjs). Since 2026-09-23 the
// server keeps houses as far apart as they are drawn (tests/house-spacing.test.mjs): a second house placed over the first is
// refused, in the preview and by the server, and one just clear of it is built; the two are shot as close as allowed.
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
// SIZE.cabin in public/app.js: a house on the map is this many people high, a person PERSON_MILES of ground.
const CABIN=3.3,PERSON_MILES=0.019,HOUSE_LEGIBLE=16;
// How high a family's house is drawn at `scale` pixels a mile (public/app.js `houseScale`): the people's yardstick, not floored
// with them, down to HOUSE_LEGIBLE pixels high; further out the family's houses are drawn as one, that high.
const houseHigh=scale=>Math.max(HOUSE_LEGIBLE,Math.min(150,scale*PERSON_MILES)*CABIN);
// Pictures of the house as the student sees it, for looking at: every plan in the chooser, the preview at each quarter turn,
// the house that stands at three zooms (2026-09-23: "the roof ... slides forward"; tests/house-roof.test.mjs holds it).
const SHOTS=process.env.HOUSE_SHOTS||'test-results';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Every picture of a house the map draws, cut from the house sheets, with the transform it is drawn under: a house turned
 // on the ground must never be drawn turned (2026-09-23: at 90 degrees it lay on its side, at 180 it stood on its roof).
 await page.addInitScript(()=>{const drawImage=CanvasRenderingContext2D.prototype.drawImage;fetch('/assets/frontier-v1/atlas.json').then(r=>r.json()).then(atlas=>{window.__houseCuts=new Map(Object.entries(atlas.frames).filter(([,f])=>f.sheet==='house-modules'||f.sheet==='houses-settling').map(([name,f])=>[`${f.x},${f.y},${f.w},${f.h}`,name]));});
  CanvasRenderingContext2D.prototype.drawImage=function(...args){const name=args.length===9&&window.__houseCuts?.get(`${args[1]},${args[2]},${args[3]},${args[4]}`);if(name&&!this.canvas.closest?.('#house-plot')){const t=this.getTransform();(window.__houseImages||=[]).push({name,a:t.a,b:t.b,c:t.c,d:t.d,e:t.e,f:t.f,x:args[5],y:args[6],w:args[7],h:args[8],sw:args[3],sh:args[4]});}return drawImage.apply(this,args);};});
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
 const drawnNow=()=>page.evaluate(()=>({houses:window.__placedHousesDrawn||[],figure:window.__camera?.figure,scale:window.__camera?.scale,house:window.__camera?.house}));
 const previewAt=async rotation=>{await page.waitForFunction(r=>(window.__placedHousesDrawn||[]).some(h=>h.preview&&h.rotation===r&&h.pieces>0),rotation);const frame=await drawnNow();return [frame,frame.houses.find(h=>h.preview)];};
 const aim=beside||middle,k=await page.evaluate(()=>document.querySelector('#world-map').width)/box.width;
 const [firstFrame,first]=await previewAt(0);
 // It is drawn under the pointer: a hover before any press on the map once put it at no number at all, so nothing showed.
 assert.ok(Number.isFinite(first.x)&&Math.hypot(first.x-(aim.x-box.x)*k,first.y-(aim.y-box.y)*k)<2,`preview drawn at ${first.x},${first.y}, not under the pointer`);
 // The preview is a house the size of the map's houses, in the yardstick of the people standing by it: not seventeen feet.
 assert.ok(Math.abs(first.size-houseHigh(firstFrame.scale))<1e-6&&Math.abs(first.size-firstFrame.house.size)<1e-6,`preview drawn ${first.size} pixels high where a house is ${houseHigh(firstFrame.scale)} at ${firstFrame.scale} pixels a mile`);
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
 assert.equal(preview.size/houseHigh(previewFrame.scale),first.size/houseHigh(firstFrame.scale));
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
 assert.ok(Math.abs(built.size-houseHigh(builtFrame.scale))<1e-6,`built house drawn ${built.size} pixels high where a house is ${houseHigh(builtFrame.scale)} at ${builtFrame.scale} pixels a mile`);
 assert.ok(Math.abs(built.size/houseHigh(builtFrame.scale)-preview.size/houseHigh(previewFrame.scale))<1e-9,'the built house and its preview are not the size a house is drawn');
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
   // Every chimney stands against its pen (2026-09-23, owner: "Something looks wrong with the chimneys too"): its foot, where
   // it is drawn translated to, inside the picture of a pen's walls, not on the grass a cell away (tests/house-chimney.test.mjs
   // holds it to the middle of its gable wall).
   const inside=(i,p)=>{const xs=[p.e+p.a*p.x,p.e+p.a*(p.x+p.w)],ys=[p.f+p.d*p.y,p.f+p.d*(p.y+p.h)];return i.e>=Math.min(...xs)&&i.e<=Math.max(...xs)&&i.f>=Math.min(...ys)&&i.f<=Math.max(...ys);};
   const chimneys=images.filter(i=>/chimney/.test(i.name)),away=chimneys.filter(i=>!images.some(p=>/full-walls$/.test(p.name)&&inside(i,p)));
   assert.deepEqual(away.map(i=>i.name),[],`at ${rotation} degrees a chimney stands off its pen: ${JSON.stringify(away.map(i=>[i.name,+i.e.toFixed(1),+i.f.toFixed(1)]))}`);
   // Mirrored at a quarter turn, where the gable comes round to the other face; as drawn at a half turn - but for the pen's
   // walls and roof at 180, where the cabin's chimney, east of its pen, is to the left and the pen is drawn mirrored so that
   // its doorless back gable is that side (2026-09-24, `mirrorPens`; tests/house-turn.test.mjs).
   const penPart=i=>/-(sill|low-walls|full-walls)$|roof-(partial|finished)$/.test(i.name);
   assert.ok(images.every(i=>(i.a<0)===(rotation%180!==0||(rotation===180&&penPart(i)))),`at ${rotation} degrees the pictures are mirrored the wrong way: ${JSON.stringify(images.map(i=>[i.name,+i.a.toFixed(3)]))}`);
   // No chimney in front of a door (2026-09-24, owner: "fix the chimney standing in front of the door"). In one frame's drawing,
   // a chimney drawn after a pen's walls must not cover the door in them: the sheet's door, read by eye off its ten-pixel grid
   // (tests/house-chimney.test.mjs `DOOR`), through the transform the walls were drawn with. The cabin's chimney is east of its
   // pen, which faces the viewer at 90 degrees: there, and only there, it still does - the stand-in until the sheet has the
   // back of a pen (docs/ART_REQUESTS.md, request 2026-09-23).
   const DOOR={'house-round-full-walls':[84,117,140,228],'house-hewn-full-walls':[86,115,138,232]};
   const perFrame=new Set(images.map(i=>`${i.name},${i.e.toFixed(2)},${i.f.toFixed(2)}`)).size,frame=images.slice(0,perFrame);
   const boxOf=(i,[l,r,t,b])=>{const xs=[l,r].map(u=>i.e+i.a*(i.x+u*i.w/i.sw)),ys=[t,b].map(v=>i.f+i.d*(i.y+v*i.h/i.sh));return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};};
   const meet=(p,q)=>p.left<=q.right&&q.left<=p.right&&p.top<=q.bottom&&q.top<=p.bottom;
   const overDoor=frame.filter((c,k)=>/chimney/.test(c.name)&&frame.some((w,j)=>j<k&&DOOR[w.name]&&meet(boxOf(c,[0,c.sw,0,c.sh]),boxOf(w,DOOR[w.name]))));
   assert.equal(overDoor.length>0,rotation===90,`at ${rotation} degrees a chimney is ${overDoor.length?'':'not '}drawn over the door: ${JSON.stringify(frame.map(i=>[i.name,+i.e.toFixed(1),+i.a.toFixed(2)]))}`);
   const at=drawnHouse;await shoot(`house-built-${rotation}`,at);
   turns[rotation]={pictures:images.length,chimneysAgainstTheirPen:chimneys.length-away.length,chimneyOverDoor:overDoor.length>0,housePicturesOnTheMap:all.length,turned:turned.length,mirrored:images.filter(i=>i.a<0).length,footprintCells:{w:+(at.footprint.w/at.cell).toFixed(3),h:+(at.footprint.h/at.cell).toFixed(3)}};
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
 // A second house, over the first as drawn: the preview says so and is tinted, and "Build here" is refused in the same
 // words; then just clear of it, where it stands (owner, 2026-09-23: "fix the overlapping houses so spacing matches the
 // drawings"). Where those are is worked out here with the server's own check, on ground the server takes.
 const hh=liveWorld.households['hh-1'],cat=plotCatalogue(),firstAt=hh.house.placement,firstGround=houseOnGround(hh.house,cat,firstAt);
 const withFirst={...hh,completedHouses:[...(hh.completedHouses||[]),hh.house]},alone={...hh,completedHouses:[]};
 const takes=(who,at)=>{try{checkHousePlacement(liveWorld,who,at,'round-log');return null;}catch(error){return error.message;}};
 const EPS=0.001,ways=[];
 // Just clear each way round, at either turn and slid along that side: its claim (ground and pictures) an EPS of a mile off
 // the first's. Over: moved half way back to the first house.
 for(const rotation of [0,90]){
   const unit=houseOnGround({plan:'round-log'},cat,{x:0,y:0,rotation}),w=firstGround.claim.maxX-firstGround.claim.minX,h=firstGround.claim.maxY-firstGround.claim.minY;
   for(const slide of [0,-.25,.25,-.5,.5])for(const [way,at] of [['east',{x:firstGround.claim.maxX-unit.claim.minX+EPS,y:firstAt.y+slide*h}],['west',{x:firstGround.claim.minX-unit.claim.maxX-EPS,y:firstAt.y+slide*h}],['south',{x:firstAt.x+slide*w,y:firstGround.claim.maxY-unit.claim.minY+EPS}],['north',{x:firstAt.x+slide*w,y:firstGround.claim.minY-unit.claim.maxY-EPS}]])
     ways.push({way:`${way}, turned ${rotation}, slid ${slide}`,clear:{...at,rotation},over:{x:(at.x+firstAt.x)/2,y:(at.y+firstAt.y)/2,rotation}});
 }
 const pair=ways.find(w=>!takes(withFirst,w.clear)&&!takes(alone,w.over)&&takes(withFirst,w.over)===SPACE_REFUSAL);
 assert.ok(pair,`no way round the first house has ground for a second: ${JSON.stringify(ways.map(w=>[w.way,takes(withFirst,w.clear),takes(alone,w.over)]))}`);
 assert.equal(overlaps(houseOnGround({plan:'round-log'},cat,pair.clear).claim,firstGround.claim),false);
 assert.equal(overlaps(houseOnGround({plan:'round-log'},cat,pair.over).footprint,firstGround.footprint),true,'the refused spot is not over the first house as drawn');
 await press('[data-plan="round-log"]');
 await page.waitForFunction(()=>!document.querySelector('#house-placement').hidden);
 if(pair.clear.rotation)await press('#house-rotate');
 // Close enough in that a person is drawn his PERSON_MILES high, where the houses are drawn over the ground they stand on.
 for(let i=0;i<6&&(await page.evaluate(()=>window.__camera.scale))<2400;i++){const at=await builtNow();await page.mouse.move(box.x+at.x/k,box.y+at.y/k);await page.mouse.wheel(0,-360);await page.waitForTimeout(700);}
 const cameraNow=await page.evaluate(()=>window.__camera);
 assert.ok(Math.abs(cameraNow.figure-cameraNow.scale*0.019)<1e-6,`the camera draws a person ${cameraNow.figure} pixels, not his size on the ground at ${cameraNow.scale} pixels a mile`);
 const clientOf=async p=>{const c=await page.evaluate(()=>({...window.__camera,w:document.querySelector('#world-map').width,h:document.querySelector('#world-map').height}));return {x:box.x+(c.w/2+(p.x-c.cx)*c.scale)/k,y:box.y+(c.h/2+(p.y-c.cy)*c.scale)/k};};
 const hold=async p=>{const at=await clientOf(p);await pointer('pointerdown',at);await pointer('pointerup',at);await page.waitForTimeout(400);return page.evaluate(()=>({note:document.querySelector('#house-placement-note').textContent,preview:(window.__placedHousesDrawn||[]).find(h=>h.preview)}));};
 const housesNow=()=>page.evaluate(()=>window.__snapshot.world.land);
 const overHeld=await hold(pair.over);
 assert.equal(overHeld.preview?.refused,SPACE_REFUSAL,`the preview over the first house is not refused: ${JSON.stringify(overHeld)}`);
 assert.equal(overHeld.note,SPACE_REFUSAL,'the placement panel does not say why');
 await page.screenshot({path:`${SHOTS}/house-second-refused.png`});
 const clearHeld=await hold(pair.clear);
 assert.equal(clearHeld.preview?.refused,null,`the preview just clear of the first house is refused: ${JSON.stringify(clearHeld)}`);
 await press('#house-placement-confirm');
 await page.waitForFunction(()=>document.querySelector('#house-placement').hidden,null,{timeout:10000});
 const second=app.state.world.households['hh-1'];
 assert.equal(second.completedHouses.length,1,'the house just clear of the first was not built');
 // What the server stood it at, from a pointer on the page: how close that is to the first, in the rule's terms.
 const secondAt=second.house.placement,secondGround=houseOnGround(second.house,cat,secondAt);
 const gap=Math.max(secondGround.claim.minX-firstGround.claim.maxX,firstGround.claim.minX-secondGround.claim.maxX,secondGround.claim.minY-firstGround.claim.maxY,firstGround.claim.minY-secondGround.claim.maxY);
 assert.ok(gap>=0&&gap<0.004,`the second house stands ${gap} miles clear of the first, not just clear`);
 // Both standing, for looking at: the second finished as a later class would find it. `liveWorld` is the class's world
 // until an order is refused, which puts the class back from its save text; then the second is raised from the pile.
 const live=liveWorld.households['hh-1'].house?.placement?.y===secondAt.y&&liveWorld.households['hh-1'].completedHouses?.length===1;
 if(live)for(const piece of liveWorld.households['hh-1'].house.pieces){piece.stage=PIECES[piece.type].stages.length;piece.progress=0;}
 else{
   await build(100);
   for(let tries=101,began=Date.now(),land;(land=await page.evaluate(()=>window.__snapshot.world.land.house))?.stage!=='finished';){
     const chore=app.state.world.entities[principal].chore;
     assert.ok(Date.now()-began<300000,`the second house never stood: ${JSON.stringify({stage:land?.stage,why:land?.why,chore,status:app.state.world.status})}`);
     if(!land?.why&&!chore)await build(tries++);
     await page.waitForTimeout(1000);
   }
 }
 await page.waitForFunction(()=>(window.__placedHousesDrawn||[]).filter(h=>!h.preview&&h.pieces>=2).length>=2,null,{timeout:15000}).catch(async()=>{throw new Error(`both houses were not drawn: ${JSON.stringify(await page.evaluate(()=>({drawn:(window.__placedHousesDrawn||[]).map(h=>[h.preview,h.pieces,Math.round(h.x),Math.round(h.y)]),land:{house:window.__snapshot.world.land.house,completed:window.__snapshot.world.land.completedHouses},camera:window.__camera})))}`);});
 // Framed for looking at, clear of the panels: out a step (still close enough that a person is drawn his size on the ground)
 // and the pair dragged up into the open map above the action bar.
 const pairNow=async()=>(await page.evaluate(()=>window.__placedHousesDrawn)).filter(h=>!h.preview&&h.pieces>=2);
 const middleOf=hs=>({x:box.x+(Math.min(...hs.map(h=>h.box.left))+Math.max(...hs.map(h=>h.box.right)))/2/k,y:box.y+(Math.min(...hs.map(h=>h.box.top))+Math.max(...hs.map(h=>h.box.bottom)))/2/k});
 for(let i=0;i<4&&(await page.evaluate(()=>window.__camera.scale))>3000;i++){const m=middleOf(await pairNow());await page.mouse.move(m.x,m.y);await page.mouse.wheel(0,240);await page.waitForTimeout(700);}
 {const m=middleOf(await pairNow()),to={x:box.x+box.width*.45,y:box.y+box.height*.36};await page.mouse.move(m.x,m.y);await page.mouse.down();for(let t=1;t<=12;t++){await page.mouse.move(m.x+(to.x-m.x)*t/12,m.y+(to.y-m.y)*t/12);await page.waitForTimeout(30);}await page.mouse.up();}
 await page.waitForTimeout(1200);
 const shotCamera=await page.evaluate(()=>window.__camera);
 assert.ok(Math.abs(shotCamera.figure-shotCamera.scale*0.019)<1e-6,`the pair is shot where a person is drawn ${shotCamera.figure} pixels, not his size on the ground`);
 const both=await pairNow();
 const screenBox=h=>({minX:h.box.left,minY:h.box.top,maxX:h.box.right,maxY:h.box.bottom}),screenFoot=h=>({minX:h.x+h.footprint.x,minY:h.y+h.footprint.y,maxX:h.x+h.footprint.x+h.footprint.w,maxY:h.y+h.footprint.y+h.footprint.h});
 const [a,b]=both;
 for(const [one,other] of [[screenBox(a),screenBox(b)],[screenBox(a),screenFoot(b)],[screenFoot(a),screenBox(b)]])assert.equal(overlaps(one,other),false,`the two houses are drawn over one another: ${JSON.stringify(both.map(h=>h.box))}`);
 const around={left:Math.min(a.box.left,b.box.left),top:Math.min(a.box.top,b.box.top),right:Math.max(a.box.right,b.box.right),bottom:Math.max(a.box.bottom,b.box.bottom)},pad=a.size*.35;
 const closestShot=process.env.HOUSES_CLOSEST_SHOT||`${SHOTS}/houses-closest.png`;
 await page.screenshot({path:closestShot,clip:{x:box.x+(around.left-pad)/k,y:box.y+(around.top-pad)/k,width:(around.right-around.left+2*pad)/k,height:(around.bottom-around.top+2*pad)/k}});
 // And sent: a house over the first, pressed "Build here" anyway, is refused by the server in the words the preview said.
 await press('#house-open');await page.waitForFunction(()=>[...document.querySelectorAll('#plot-plans button')].some(b=>b.textContent.includes('Build another')));
 await press('[data-plan="round-log"]');await page.waitForFunction(()=>!document.querySelector('#house-placement').hidden);
 const againHeld=await hold(pair.over);
 assert.equal(againHeld.preview?.refused,SPACE_REFUSAL,`the preview over the first house is not refused: ${JSON.stringify(againHeld)}`);
 await press('#house-placement-confirm');await page.waitForFunction(()=>!document.querySelector('#house-placement-confirm').disabled);await page.waitForTimeout(400);
 const refusedSaid=await page.evaluate(()=>document.querySelector('#house-placement-note').textContent);
 assert.equal(refusedSaid,SPACE_REFUSAL,'the server\'s refusal is not what the panel says');
 assert.equal(app.state.world.households['hh-1'].completedHouses.length,1,'the house over the first was planned');
 await page.locator('#house-placement-cancel').click();
 // Out step by step to the farthest the map goes, with the two houses as close as allowed (owner, 2026-09-23: "fix the zoom
 // issue"): never drawn over one another. Each is drawn at its ground's size, not floored with the people, down to
 // HOUSE_LEGIBLE pixels high; from there out the family's houses are drawn as one, its home (the first finished), and only
 // it answers a tap (public/app.js `houseScale`, tests/house-zoom.test.mjs).
 // The class's own world: `liveWorld` went stale when the order above was refused.
 const homeAt=app.state.world.households['hh-1'].completedHouses[0].placement,zoomSteps=[],zoomShots=[];
 if(await page.locator('#plot-close').isVisible())await page.locator('#plot-close').click();
 const zoomFrame=()=>page.evaluate(()=>({camera:window.__camera,houses:(window.__placedHousesDrawn||[]).filter(h=>!h.preview&&h.pieces>=2),taps:[...(window.__housesDrawn||new Map()).values()].map(s=>({placed:Boolean(s.siteId),x:s.x,y:s.y})),w:document.querySelector('#world-map').width,h:document.querySelector('#world-map').height}));
 for(let step=0;step<120;step++){
   await page.waitForFunction(()=>window.__camera&&!window.__camera.quick);await page.waitForTimeout(250);
   const f=await zoomFrame(),{camera}=f,trueHigh=Math.min(150,camera.scale*PERSON_MILES)*CABIN,one=trueHigh<HOUSE_LEGIBLE;
   assert.equal(camera.house.one,one,`at ${camera.scale} pixels a mile the camera draws one house: ${camera.house.one}`);
   assert.equal(f.houses.length,one?1:2,`at ${camera.scale.toFixed(1)} pixels a mile ${f.houses.length} houses were drawn: ${JSON.stringify(f.houses.map(h=>h.box))}`);
   for(const h of f.houses)assert.ok(Math.abs(h.size-houseHigh(camera.scale))<1e-6,`at ${camera.scale.toFixed(1)} a house drawn ${h.size} pixels high, not ${houseHigh(camera.scale)}`);
   if(f.houses.length===2)assert.equal(overlaps(screenBox(f.houses[0]),screenBox(f.houses[1])),false,`at ${camera.scale.toFixed(1)} pixels a mile the two houses are drawn over one another: ${JSON.stringify(f.houses.map(h=>h.box))}`);
   const home={x:f.w/2+(homeAt.x-camera.cx)*camera.scale,y:f.h/2+(homeAt.y-camera.cy)*camera.scale};
   if(one)assert.ok(Math.hypot(f.houses[0].x-home.x,f.houses[0].y-home.y)<0.01,`at ${camera.scale.toFixed(1)} the one house is not drawn at the family's home`);
   // A tap answers where the houses are drawn: one spot per house drawn, none at the site.
   assert.equal(f.taps.filter(t=>t.placed).length,f.houses.length,`at ${camera.scale.toFixed(1)} ${f.taps.length} houses answer a tap where ${f.houses.length} were drawn`);
   assert.equal(f.taps.some(t=>!t.placed),false);
   const around={left:Math.min(...f.houses.map(h=>h.box.left)),top:Math.min(...f.houses.map(h=>h.box.top)),right:Math.max(...f.houses.map(h=>h.box.right)),bottom:Math.max(...f.houses.map(h=>h.box.bottom))};
   zoomSteps.push({scale:+camera.scale.toFixed(2),figure:+camera.figure.toFixed(2),houseHigh:+f.houses[0].size.toFixed(2),one,drawn:f.houses.length,boxes:f.houses.map(h=>Object.fromEntries(Object.entries(h.box).map(([k,v])=>[k,+v.toFixed(1)]))),taps:f.taps.length});
   // A picture of the pair at this zoom, framed round them with a few people of ground to spare, cut from the map's own canvas
   // so a notice over the map is not in it.
   const half=Math.max(40,(around.right-around.left)/2+camera.figure*3,(around.bottom-around.top)/2+camera.figure*3),mid={x:(around.left+around.right)/2,y:(around.top+around.bottom)/2};
   const image=await page.evaluate(([x,y,w,h])=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(document.querySelector('#world-map'),x,y,w,h,0,0,w,h);return c.toDataURL('image/png').split(',')[1];},[mid.x-half,mid.y-half*.75,2*half,1.5*half].map(Math.round));
   zoomShots.push({scale:camera.scale,one,drawn:f.houses.length,figure:camera.figure,image});
   // Out a step about the open map where the pair was framed (zooming out draws them in towards it), sent to the map itself
   // as the pointer events are (a notice can come up over it further out), and stop where the map goes no further.
   await page.evaluate(([x,y])=>document.querySelector('#world-map').dispatchEvent(new WheelEvent('wheel',{clientX:x,clientY:y,deltaY:120,deltaMode:0,bubbles:true,cancelable:true})),[box.x+box.width*.45,box.y+box.height*.36]);
   if(!await page.waitForFunction(s=>window.__camera.scale<s*0.999,camera.scale,{timeout:3000}).then(()=>true,()=>false))break;
 }
 const farthest=zoomSteps.at(-1).scale;
 // And the last is the farthest the camera goes: the whole mapped country across the map (public/app.js `scaleLimits`).
 const countryScale=await page.evaluate(()=>{const b=window.__snapshot.world.map?.bounds,c=document.querySelector('#world-map');return b&&Math.max(c.width/Math.max(3.4,b.maxX-b.minX),c.height/Math.max(3.4*.56,b.maxY-b.minY));});
 assert.ok(countryScale&&Math.abs(farthest/countryScale-1)<0.01,`the zoom out stopped at ${farthest} pixels a mile, not the country's ${countryScale}`);
 assert.ok(zoomSteps[0].drawn===2&&zoomSteps.some(s=>s.one)&&zoomSteps.some(s=>!s.one&&s.scale<368),`the zoom out did not pass through both sizes of house: ${JSON.stringify(zoomSteps.map(s=>[s.scale,s.drawn]))}`);
 // Five of them side by side, from the closest to the farthest, for looking at.
 const pick=[...new Set([zoomShots[0],...[600,300,200].map(target=>zoomShots.reduce((a,b)=>Math.abs(Math.log(b.scale/target))<Math.abs(Math.log(a.scale/target))?b:a)),zoomShots.at(-1)])];
 const montagePath=process.env.ZOOM_MONTAGE||`${SHOTS}/houses-zoom-montage.png`,sheet=await browser.newPage({viewport:{width:pick.length*328,height:330}});
 await sheet.setContent(`<body style="margin:0;display:flex;background:#222;font:13px sans-serif;color:#eee">${pick.map(s=>`<figure style="margin:4px;width:320px;text-align:center"><img src="data:image/png;base64,${s.image}" style="width:320px;height:240px;object-fit:contain;image-rendering:pixelated;background:#000"><figcaption>${s.scale.toFixed(0)} px/mile<br>person ${s.figure.toFixed(1)} px, house ${houseHigh(s.scale).toFixed(1)} px<br>${s.one?'one house: the home':'both houses at their ground’s size'}</figcaption></figure>`).join('')}</body>`);
 await sheet.screenshot({path:montagePath});await sheet.close();
 for(const s of pick)writeFileSync(`${SHOTS}/houses-zoom-${Math.round(s.scale)}.png`,Buffer.from(s.image,'base64'));
 const zoomEvidence={legible:HOUSE_LEGIBLE,switchAt:+(HOUSE_LEGIBLE/(PERSON_MILES*CABIN)).toFixed(1),closest:zoomSteps[0].scale,farthest,steps:zoomSteps,montage:montagePath,montageScales:pick.map(s=>+s.scale.toFixed(1))};
 const spacingEvidence={way:pair.way,refusedAt:pair.over,refusedPreview:overHeld.preview.refused,refusedByServer:refusedSaid,secondFinished:live?'set on the class, as a later class would find it':'raised from the pile',builtAt:secondAt,claimGapMiles:+gap.toFixed(5),claimGapFeet:+(gap*5280).toFixed(1),figure:shotCamera.figure,scale:shotCamera.scale,drawnBoxes:both.map(h=>h.box),shot:closestShot};
 assert.deepEqual(errors,[]);validateWorld(app.state.world);
 const inPeople=frame=>+(frame.houses.find(h=>h.preview===(frame===previewFrame))?.size/frame.figure).toFixed(3);
 const size={previewPixels:+preview.size.toFixed(1),builtPixels:+built.size.toFixed(1),figurePixels:{preview:+previewFrame.figure.toFixed(2),built:+builtFrame.figure.toFixed(2)},housePeopleHigh:{preview:inPeople(previewFrame),built:inPeople(builtFrame)},footprintCells:{w:preview.footprint.w/preview.cell,h:preview.footprint.h/preview.cell},rotation:preview.rotation,wasPixelsInTrueFeet:+(previewFrame.scale*8/5280/.45).toFixed(2)};
 writeFileSync('docs/evidence/house-plot-browser.json',JSON.stringify({date:new Date().toISOString(),result:'PASS',scope:'Same-computer student integration',checks:['plan opens placement without planning','preview drawn a house high in the people’s yardstick','preview turned a quarter','Build here places at the preview’s turn','the next stage says what it wants: '+nextSaid,'phone fits','stage construction consumes 50 logs','built house the preview’s size, turn and footprint','finished shelter displayed','the built house at 0/90/180/270 degrees: every picture upright (no rotation or shear), mirrored at 90 and 270, and its pen at 180 too, where its chimney is to the left','no chimney drawn over the door at 0, 180 or 270 degrees; at 90, where the chimney gable faces the viewer, the stand-in (ART_REQUESTS 2026-09-23)','a tap on the placed house where it is drawn opens its rooms; the site point is no longer a house','pictures: every plan in the chooser, the preview at 0/90/180/270 degrees, the built house at three zooms (roof seated: tests/house-roof.test.mjs)','a second house over the first as drawn: preview tinted and refused, the server refuses it in the same words','a second house just clear of the first: built, and the two drawn clear of each other','zoomed out step by step to the farthest the map goes: the two never drawn over one another, each at its ground’s size down to '+HOUSE_LEGIBLE+' pixels high and one house, the home, from there out, a tap following what is drawn'],pictures:['house-plans','house-preview-0','house-preview-90','house-preview-180','house-preview-270','house-built','house-built-0','house-built-90','house-built-180','house-built-270','house-rooms-opened','house-built-zoom-in','house-built-zoom-out','house-second-refused','houses-closest','houses-zoom-montage'].map(name=>`${name}.png`),size,turns,spacing:spacingEvidence,zoom:zoomEvidence,roomsOpenedAt:tappedAt&&{x:+tappedAt.x.toFixed(1),y:+tappedAt.y.toFixed(1)},placement:serverPlacement,errors},null,2));
 console.log('PASS: student picks a plan, places and turns its preview, builds here from logs, and the house that stands is the preview’s size, turn and footprint, upright at every turn, and opens where it stands; a second house over it is refused and one just clear of it stands, and the two are never drawn over one another at any zoom.',JSON.stringify({size,turns,spacing:spacingEvidence,zoom:{...zoomEvidence,steps:zoomEvidence.steps.length}}));
}finally{await browser.close();await app.close();}

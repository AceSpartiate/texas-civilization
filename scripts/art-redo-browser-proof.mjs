import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const SHEETS={"icons-family-service":["icon-enlist-regular","icon-enlist-auxiliary","icon-join-garrison","icon-join-matamoros","icon-go-vote","icon-winter-recall","icon-join-relief","icon-join-houston","icon-camp-drill","icon-camp-forage","icon-camp-guard","icon-camp-scout","icon-hunt-road","icon-tend-sick","icon-trade-crossing","icon-fetch-logs"],"famous-lamar":["lamar-walk-e-1","lamar-walk-e-2","lamar-walk-e-3","lamar-walk-e-4","lamar-walk-s-1","lamar-walk-s-2","lamar-walk-n-1","lamar-walk-n-2","lamar-idle","lamar-command","lamar-salute","lamar-saber-low","lamar-reach","lamar-withdraw-signal","lamar-listen","lamar-rest"],"joe-poses":["joe-walk-1","joe-walk-2","joe-walk-3","joe-walk-4","joe-walk-s-1","joe-walk-s-2","joe-walk-n-1","joe-walk-n-2","joe-hide-1","joe-hide-2","joe-rise","joe-cautious","joe-idle","joe-speak-1","joe-speak-2","joe-rest-pose"],"famous-grant-gallop":["grant-mounted-gallop-e-1","grant-mounted-gallop-e-2","grant-mounted-gallop-e-3","grant-mounted-gallop-e-4"]}; const ANIMATION_CLIPS={"lamar-walk-e":{"frames":[{"sprite":"lamar-walk-e-1","duration":190},{"sprite":"lamar-walk-e-2","duration":190},{"sprite":"lamar-walk-e-3","duration":190},{"sprite":"lamar-walk-e-4","duration":190}],"loop":true,"authored":true,"motion":"none","direction":"east"},"lamar-walk-s":{"frames":[{"sprite":"lamar-walk-s-1","duration":290},{"sprite":"lamar-walk-s-2","duration":290}],"loop":true,"authored":true,"motion":"none","direction":"south"},"lamar-walk-n":{"frames":[{"sprite":"lamar-walk-n-1","duration":290},{"sprite":"lamar-walk-n-2","duration":290}],"loop":true,"authored":true,"motion":"none","direction":"north"},"joe-walk":{"frames":[{"sprite":"joe-walk-1","duration":180},{"sprite":"joe-walk-2","duration":180},{"sprite":"joe-walk-3","duration":180},{"sprite":"joe-walk-4","duration":180}],"loop":true,"authored":true,"motion":"none","direction":"east; west by mirroring"},"joe-walk-n":{"frames":[{"sprite":"joe-walk-n-1","duration":220},{"sprite":"joe-walk-n-2","duration":220}],"loop":true,"authored":true,"motion":"none","direction":"north"},"joe-walk-s":{"frames":[{"sprite":"joe-walk-s-1","duration":220},{"sprite":"joe-walk-s-2","duration":220}],"loop":true,"authored":true,"motion":"none","direction":"south"},"joe-hide":{"frames":[{"sprite":"joe-hide-1","duration":900},{"sprite":"joe-hide-2","duration":900}],"loop":true,"authored":true,"motion":"none","direction":"east; west by mirroring"},"joe-speak":{"frames":[{"sprite":"joe-speak-1","duration":750},{"sprite":"joe-speak-2","duration":900}],"loop":true,"authored":true,"motion":"none","direction":"east; west by mirroring"},"grant-mounted-gallop-e":{"frames":[{"sprite":"grant-mounted-gallop-e-1","duration":135},{"sprite":"grant-mounted-gallop-e-2","duration":135},{"sprite":"grant-mounted-gallop-e-3","duration":135},{"sprite":"grant-mounted-gallop-e-4","duration":135}],"loop":true,"authored":true,"motion":"none","direction":"east; mirror for west"}};

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({playerCount:5,seed:'art-redo-proof-proof'}),port=await app.listen(0,'127.0.0.1');
let browser;
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:960,height:2600}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async({sheets,clips})=>{
  const {loadArt,drawSprite,drawClip,spriteFrame}=await import('/art.js');await loadArt({sheets:Object.keys(sheets)});
  const canvas=document.createElement('canvas');canvas.id='redo-proof';canvas.width=960;canvas.height=2600;
  canvas.style.cssText='position:fixed;left:0;top:0;z-index:99999';document.body.append(canvas);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#eee3c5';ctx.fillRect(0,0,960,2600);
  const frames=[],animations=[];
  for(const [i,id] of Object.values(sheets).flat().entries()) {
   const x=i%4*240,y=Math.floor(i/4)*200,f=spriteFrame(id);
   const height=Math.min(160,210*(f.logicalHeight||f.h)/f.w);
   const drawn=drawSprite(ctx,id,x+120,y+190,height);
   ctx.fillStyle='#493824';ctx.font='11px monospace';ctx.fillText(id,x+7,y+16);
   frames.push({id,drawn:drawn>0});
  }
  for(const [id,clip] of Object.entries(clips)) {
   const tmp=document.createElement('canvas');tmp.width=tmp.height=300;const tc=tmp.getContext('2d');
   const f=spriteFrame(clip.frames[0].sprite),height=Math.min(240,270*(f.logicalHeight||f.h)/f.w);
   const aDraw=drawClip(tc,id,150,280,height,{timeMs:0,seed:0}),a=tmp.toDataURL();tc.clearRect(0,0,300,300);
   const bDraw=drawClip(tc,id,150,280,height,{timeMs:clip.frames[0].duration+10,seed:0}),b=tmp.toDataURL();
   animations.push({id,drawn:aDraw>0&&bDraw>0,changed:a!==b});
  }
  return {frames,animations};
 },{sheets:SHEETS,clips:ANIMATION_CLIPS});
 assert.equal(proof.frames.length,52);assert.equal(proof.animations.length,9);
 assert.ok(proof.frames.every(f=>f.drawn));assert.ok(proof.animations.every(a=>a.drawn&&a.changed),JSON.stringify(proof.animations.filter(a=>!a.drawn||!a.changed)));
 assert.deepEqual(errors,[]);mkdirSync('docs/evidence',{recursive:true});
 await page.locator('#redo-proof').screenshot({path:'docs/evidence/art-redo-proof.png'});
 writeFileSync('docs/evidence/art-redo-proof.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));
 await page.evaluate(async()=>{
  const {drawSprite}=await import('/art.js');
  const c=document.createElement('canvas');c.id='redo-icons-small';c.width=720;c.height=180;
  c.style.cssText='position:fixed;left:0;top:0;z-index:100000';document.body.append(c);
  const x=c.getContext('2d');x.fillStyle='#eee3c5';x.fillRect(0,0,720,180);
  for(const [i,id] of ['icon-enlist-regular','icon-enlist-auxiliary','icon-camp-drill'].entries()){
   x.fillStyle='#493824';x.font='12px monospace';x.fillText(id,i*240+8,18);
   for(const [j,size] of [34,38].entries()) for(const [k,alpha] of [1,.4].entries()){
    x.globalAlpha=alpha;drawSprite(x,id,i*240+35+j*100+k*40,100,size);x.globalAlpha=1;
   }
  }
 });
 await page.locator('#redo-icons-small').screenshot({path:'docs/evidence/art-redo-icons-small.png'});
 console.log('PASS: 52 frames rendered; all 9 clips change pixels; no browser errors; 34/38px icons inspected.');
} finally {await browser?.close();await app.close();}

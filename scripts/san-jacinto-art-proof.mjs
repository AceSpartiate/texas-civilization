import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import {SHEETS,ANIMATION_CLIPS,CAMP_GROUPS} from './art-deliveries/san-jacinto-complete-2026-10-12.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'sj-art-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1480,height:1800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async({sheets,clips,groups})=>{
  const art=await import('/art.js'),identity=await import('/avatar-identity.js'),avatar=await import('/avatar-art.js');await art.loadArt({sheets:Object.keys(sheets)});
  const root=document.createElement('section');root.style.cssText='position:fixed;left:0;top:0;padding:16px;background:#aaa87b;z-index:999999';document.body.append(root);
  const camp=document.createElement('canvas');camp.id='sj-camp-proof';camp.width=1400;camp.height=4050;root.append(camp);const cc=camp.getContext('2d'),frames=[],phases=[],bindings=[];
  cc.fillStyle='#aaa87b';cc.fillRect(0,0,camp.width,camp.height);cc.fillStyle='#342d22';cc.font='22px Georgia';cc.fillText('Healthy family camp — baseline, headwear and age identities',20,35);
  const figures=Object.values(groups).flat().filter(Boolean);
  for(const [row,f]of figures.entries()){
   cc.fillStyle='#342d22';cc.font='15px Georgia';cc.fillText(f,12,65+row*165);
   for(const [col,pose]of ['rest-1','rest-2','sleep-1','sleep-2'].entries()){const name=f+'-camp-'+pose,width=art.drawSprite(cc,name,175+350*col,205+row*165,120);frames.push({name,width});}
  }
  const mounted=document.createElement('canvas');mounted.id='sj-reload-proof';mounted.width=1400;mounted.height=1450;root.append(mounted);const mc=mounted.getContext('2d');mc.fillStyle='#aaa87b';mc.fillRect(0,0,1400,1450);mc.fillStyle='#342d22';mc.font='22px Georgia';mc.fillText('Mounted full reload — eight sequential phases, stationary horses',20,35);let row=0;
  for(const d of ['e','s','n'])for(const f of ['volunteer','dragoon']){
   const n=f+'-mounted-reload-'+d;mc.fillStyle='#342d22';mc.font='14px Georgia';mc.fillText(n,12,65+row*230);
   for(let i=1;i<=8;i++){const name=n+'-'+i,width=art.drawSprite(mc,name,87+(i-1)*175,230+row*230,120);frames.push({name,width});}row++;
  }
  for(const [n,c]of Object.entries(clips)){
   let timeMs=0;const images=[];for(const f of c.frames){const p=document.createElement('canvas');p.width=450;p.height=230;if(!art.drawClip(p.getContext('2d'),n,225,215,160,{timeMs}))throw Error('Missing '+n);images.push(p.toDataURL());timeMs+=f.duration;}phases.push({name:n,distinct:new Set(images).size,expected:c.frames.length});
  }
  for(const [i,entity]of [{sex:'female',band:'adult',appearance:{head:'loose hair',skin:'olive',hair:'brown',clothes:'teal'}},{sex:'male',band:'child',appearance:{head:'beard',skin:'tan',hair:'blond',clothes:'rust'}}].entries()){
   const choice=identity.familyCampBinding(entity,{sleep:true,timeMs:1600});const width=avatar.drawAvatar(cc,350+i*700,4020,130,entity.appearance,entity.sex,{clip:choice.clip,person:entity,phase:1600/165,working:true});bindings.push({choice,width});
  }
  return {frames,phases,bindings};
 },{sheets:SHEETS,clips:ANIMATION_CLIPS,groups:CAMP_GROUPS});
 assert.equal(proof.frames.length,136);assert.ok(proof.frames.every(f=>f.width>0));assert.equal(proof.phases.length,50);assert.ok(proof.phases.every(p=>p.distinct===p.expected));assert.ok(proof.bindings.every(b=>b.width>0));assert.deepEqual(errors,[]);
 await page.locator('#sj-camp-proof').screenshot({path:'docs/evidence/san-jacinto-family-camp.png'});
 await page.locator('#sj-camp-proof').evaluate(c=>{c.style.display='none';});
 await page.locator('#sj-reload-proof').screenshot({path:'docs/evidence/san-jacinto-mounted-reload.png'});
 writeFileSync('docs/evidence/san-jacinto-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: 136 frames, 50 distinct authored animations and customized healthy camp bindings.');
}finally{await browser?.close();await app.close();}

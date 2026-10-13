import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'mounted-children-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1260,height:2300}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async()=>{
  const art=await import('/art.js'),motion=await import('/motion.js');await art.loadArt({sheets:['people-mounted-children-e','people-mounted-children-s','people-mounted-children-n']});
  const root=document.createElement('section');root.id='mounted-children-proof';root.style.cssText='position:fixed;left:0;top:0;padding:16px;background:#aaa87b;z-index:999999';root.innerHTML='<h2>Family horseback — child identities and supported youngest passengers</h2>';document.body.append(root);
  const c=document.createElement('canvas');c.width=1200;c.height=2160;root.append(c);const ctx=c.getContext('2d'),frames=[],clips=[],bindings=[];
  const figures=['girl','boy','smallchild-with-caregiver','infant-with-caregiver'];let row=0;
  for(const d of ['e','s','n'])for(const f of figures){const n=f+'-ride-'+d;ctx.font='14px Georgia';ctx.fillStyle='#342d22';ctx.fillText(n,10,25+row*170);
   for(let i=1;i<=4;i++){const width=art.drawSprite(ctx,n+'-'+i,150+(i-1)*300,165+row*170,130);frames.push({name:n+'-'+i,width});}
   const images=[];for(const timeMs of [0,230,460,690]){const p=document.createElement('canvas');p.width=300;p.height=180;if(!art.drawClip(p.getContext('2d'),n,150,165,130,{timeMs}))throw Error('Missing '+n);images.push(p.toDataURL());}clips.push({name:n,distinct:new Set(images).size});row++;
  }
  for(const [i,sex]of ['female','male'].entries()){
   const choice=motion.seatedClip({kind:'person',band:'child',sex},'w','horse');const width=art.drawClip(ctx,choice.id,300+i*600,2150,125,{timeMs:230,flip:true});bindings.push({sex,choice,width});
  }
  return {frames,clips,bindings};
 });assert.equal(proof.frames.length,48);assert.ok(proof.frames.every(f=>f.width>0));assert.equal(proof.clips.length,12);assert.ok(proof.clips.every(c=>c.distinct===4));assert.ok(proof.bindings.every(b=>b.choice.whole&&b.width>0));assert.deepEqual(errors,[]);
 await page.locator('#mounted-children-proof').screenshot({path:'docs/evidence/mounted-children-art.png'});
 writeFileSync('docs/evidence/mounted-children-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: 48 intact frames, twelve distinct four-phase clips, west-mirrored production selections.');
}finally{await browser?.close();await app.close();}

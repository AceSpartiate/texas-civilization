import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'flood-visual',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1440,height:750}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {drawWater,drawStreets}=await import('/landscape-art.js');
  const {drawHighWater,floodCurrentMarks,drawFloodCurrent}=await import('/weather-art.js');
  const canvas=document.createElement('canvas');canvas.id='flood-proof';canvas.width=1440;canvas.height=750;canvas.style.cssText='position:fixed;left:0;top:0;z-index:99999';document.body.append(canvas);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#e9ddbd';ctx.fillRect(0,0,1440,750);
  for(const [i,water] of [0,.65,1].entries()){
   ctx.save();ctx.beginPath();ctx.rect(i*480,45,480,705);ctx.clip();ctx.translate(i*480,0);
   ctx.fillStyle='#87994e';ctx.fillRect(0,45,480,705);
   const course={points:[{x:100,y:40},{x:260,y:200},{x:170,y:370},{x:290,y:540},{x:180,y:750}],width:42};
   drawStreets(ctx,[{points:[{x:0,y:380},{x:480,y:380}],width:24}]);drawWater(ctx,course.points,course.width);drawHighWater(ctx,[course],()=>water);
   drawFloodCurrent(ctx,floodCurrentMarks([course],()=>water,{width:480,height:750}),700);ctx.restore();
   ctx.fillStyle='#493821';ctx.font='20px Georgia';ctx.fillText(['Ordinary river','High water','Over the banks'][i],i*480+20,30);
  }
  const marks=floodCurrentMarks([{points:[{x:50,y:100},{x:400,y:100}],width:42}],()=>1,{width:480,height:300});
  const tmp=document.createElement('canvas');tmp.width=480;tmp.height=300;const c=tmp.getContext('2d');drawFloodCurrent(c,marks,0);const a=tmp.toDataURL();c.clearRect(0,0,480,300);drawFloodCurrent(c,marks,900);const b=tmp.toDataURL();
  return {changed:a!==b,marks:marks.length};
 });
 assert.ok(proof.changed&&proof.marks>0);assert.deepEqual(errors,[]);mkdirSync('docs/evidence',{recursive:true});
 await page.locator('#flood-proof').screenshot({path:'docs/evidence/flood-visual.png'});writeFileSync('docs/evidence/flood-visual.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: normal/high/overbank water and independent current animation');
}finally{await browser?.close();await app.close();}

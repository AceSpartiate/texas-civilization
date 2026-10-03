import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
import * as field from './art-deliveries/live-oak-mott-2026-10-03.mjs';

const cases=[field].flatMap(d=>Object.keys(d.SHEETS).map(sheet=>({sheet,clips:Object.entries(d.ANIMATION_CLIPS).filter(([,c])=>d.SHEETS[sheet].includes(c.frames[0].sprite)).map(([id,c])=>({id,time:c.frames[0].duration+10}))})));
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({playerCount:5,seed:'field-art-proof'}),port=await app.listen(0,'127.0.0.1');
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:720,height:320}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async(cases)=>{
  const {loadArt,drawClip}=await import('/art.js');await loadArt({sheets:cases.map(c=>c.sheet)});
  const canvas=document.createElement('canvas');canvas.id='proof';canvas.width=720;canvas.height=320;canvas.style.cssText='position:fixed;left:0;top:0;z-index:9999';document.body.append(canvas);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#e9dfbd';ctx.fillRect(0,0,720,320);const result=[];
  for(const [i,c] of cases.entries()){
   const x=(i%4)*360,y=Math.floor(i/4)*280;ctx.fillStyle='#493824';ctx.font='15px Georgia';ctx.fillText(c.sheet.replace('famous-',''),x+10,y+25);
   for(const [j,clip] of c.clips.entries()){
    const tmp=document.createElement('canvas');tmp.width=tmp.height=240;const tc=tmp.getContext('2d');
    // Long hand tools need more horizontal room than a standing body in this contact sheet.
    const size=75;
    const first=drawClip(tc,clip.id,120,220,size,{timeMs:0,seed:0}),a=tmp.toDataURL();tc.clearRect(0,0,240,240);
    const second=drawClip(tc,clip.id,120,220,size,{timeMs:clip.time,seed:0}),b=tmp.toDataURL();ctx.drawImage(tmp,x+j*175,y+30,175,230);
    result.push({clip:clip.id,drawn:first>0&&second>0,changed:a!==b});
   }
  }return result;
 },cases);
 assert.ok(proof.every(x=>x.drawn&&x.changed),JSON.stringify(proof.filter(x=>!x.drawn||!x.changed)));assert.deepEqual(errors,[]);
 mkdirSync('docs/evidence',{recursive:true});await page.locator('#proof').screenshot({path:'docs/evidence/live-oak-mott-art.png'});
 writeFileSync('docs/evidence/live-oak-mott-art.json',JSON.stringify({verdict:'PASS',clips:proof,errors},null,2));console.log('PASS: '+proof.length+' animated clips render and change frames');
}finally{await browser?.close();await app.close();}






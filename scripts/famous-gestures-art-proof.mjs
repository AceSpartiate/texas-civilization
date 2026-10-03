import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({playerCount:5,seed:'cardinal-proof'}),port=await app.listen(0,'127.0.0.1');
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:1440,height:1120}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async()=>{
 const {loadArt,drawClip}=await import('/art.js');
 const riders=['deaf-smith','karnes','lamar','sherman','rusk']; const commanders=['travis','houston','santa-anna','austin','moore','almonte','burleson','cos','urrea','castaneda']; const ids=[...riders,...commanders];
 await loadArt({sheets:[...riders.map(id=>'famous-'+id+'-mounted-cardinal'),...commanders.map(id=>'famous-'+id+'-gestures')]});
 const canvas=document.createElement('canvas');canvas.id='proof';canvas.width=1440;canvas.height=1120;canvas.style.cssText='position:fixed;left:0;top:0;z-index:9999';document.body.append(canvas);
 const ctx=canvas.getContext('2d');ctx.fillStyle='#e9dfbd';ctx.fillRect(0,0,1440,1120);
 const result=[];
 for(const [i,id] of ids.entries()){
 const x=(i%4)*360,y=Math.floor(i/4)*280;
 ctx.fillStyle='#493824';ctx.font='18px Georgia';ctx.fillText(id+(riders.includes(id)?' — south / north':' — command / conversation'),x+20,y+30);
 for(const [j,dir] of (riders.includes(id)?['s','n']:['command','conversation']).entries()){
 const name=riders.includes(id)?id+'-mounted-walk-'+dir:id+'-'+dir+'-cycle',tmp=document.createElement('canvas');tmp.width=tmp.height=230;const tc=tmp.getContext('2d');
 const first=drawClip(tc,name,115,220,200,{timeMs:0,seed:0});const a=tmp.toDataURL();
 tc.clearRect(0,0,230,230);const second=drawClip(tc,name,115,220,200,{timeMs:1000,seed:0});const b=tmp.toDataURL();
 ctx.drawImage(tmp,x+j*165,y+35,180,230);result.push({clip:name,drawn:first>0&&second>0,changed:a!==b});
 }}
 return result;
 });
 assert.ok(proof.every(x=>x.drawn&&x.changed),JSON.stringify(proof.filter(x=>!x.drawn||!x.changed)));assert.deepEqual(errors,[]);
 mkdirSync('docs/evidence',{recursive:true});await page.locator('#proof').screenshot({path:'docs/evidence/famous-gestures-art.png'});
 writeFileSync('docs/evidence/famous-gestures-art.json',JSON.stringify({verdict:'PASS',clips:proof,errors},null,2));console.log('PASS: '+proof.length+' animated clips render and change frames');
}finally{await browser?.close();await app.close();}


import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'concepcion-art-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1420,height:2170}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
 const proof=await page.evaluate(async()=>{
  const art=await import('/art.js');await art.loadArt({sheets:['concepcion-mission','concepcion-bank-terrain','concepcion-limber-riders','concepcion-aftercare','military']});
  const root=document.createElement('section');root.id='concepcion-complete-proof';root.style.cssText='position:fixed;left:0;top:0;padding:20px;background:#aaa97b;z-index:999999';root.innerHTML='<h2>Concepción — mission, banks, moving bend, mule riders and aftercare</h2>';document.body.append(root);
  const c=document.createElement('canvas');c.width=1340;c.height=2040;root.append(c);const ctx=c.getContext('2d'),frames=[],loops=[];
  const draw=(n,x,y,h)=>frames.push({name:n,width:art.drawSprite(ctx,n,x,y,h)});
  draw('mission-concepcion',270,350,300);draw('riverbank-cut-e',790,200,150);draw('riverbank-cut-w',1140,200,150);
  ctx.fillStyle='#342d22';ctx.font='15px Georgia';ctx.fillText('Researched church silhouette',80,380);ctx.fillText('Cut banks — two faces',660,230);
  for(let i=1;i<=4;i++)draw('river-bend-'+i,170+(i-1)*330,580,155);
  for(const [row,d]of ['e','s','n'].entries())for(let i=1;i<=4;i++)draw('limber-mules-'+d+'-'+i,170+(i-1)*330,830+row*240,185);
  for(let i=1;i<=4;i++)draw('padre-walk-'+i,170+(i-1)*330,1520,155);
  for(const [row,n]of ['casualty-cart-wounded','casualty-cart-covered'].entries())for(let i=1;i<=4;i++)draw(n+'-'+i,170+(i-1)*330,1750+row*240,150);
  const durations={'river-bend':350,'limber-mules-walk-e':220,'limber-mules-walk-s':220,'limber-mules-walk-n':220,'padre-walk':240,'casualty-cart-wounded':240,'casualty-cart-covered':240};
  for(const [name,step]of Object.entries(durations)){
   const images=[];for(let i=0;i<4;i++){const p=document.createElement('canvas');p.width=450;p.height=250;const width=art.drawClip(p.getContext('2d'),name,225,235,160,{timeMs:i*step});if(!(width>0))throw Error('Missing clip '+name);images.push(p.toDataURL());}
   loops.push({name,distinct:new Set(images).size});
  }
  return {frames,loops};
 });assert.equal(proof.frames.length,31);assert.ok(proof.frames.every(f=>f.width>0));assert.ok(proof.loops.every(l=>l.distinct===4));assert.deepEqual(errors,[]);
 await page.locator('#concepcion-complete-proof').screenshot({path:'docs/evidence/concepcion-complete-art.png'});
 writeFileSync('docs/evidence/concepcion-complete-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: thirty-one frames, seven four-phase authored loops, zero browser errors.');
}finally{await browser?.close();await app.close();}


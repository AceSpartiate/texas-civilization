import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'infant-passenger-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {loadArt,drawClip,drawSprite}=await import('/art.js'),{seatedClip,bedLayout,figureScale}=await import('/motion.js');
  await loadArt({sheets:['infant-wagon-passenger','cart-open']});
  const root=document.createElement('section');root.id='infant-passenger-proof';root.style.cssText='position:fixed;left:20px;top:20px;width:1100px;padding:20px;background:#afb06f;z-index:999999';root.innerHTML='<h2>Wrapped infant passenger — side, front, rear and wagon placement</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=720;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],hashes=[];
  const baby={id:'baby',kind:'person',band:'infant'};
  for(const [col,d] of ['e','s','n'].entries())for(let pose=0;pose<2;pose++){
   const clip=seatedClip(baby,d,'passenger'),x=140+col*360,y=160+pose*210,options={timeMs:pose*900};widths.push(drawClip(ctx,clip.id,x,y,110,options));const scratch=document.createElement('canvas');scratch.width=260;scratch.height=260;drawClip(scratch.getContext('2d'),clip.id,130,250,160,options);hashes.push(scratch.toDataURL());
  }
  const seat=bedLayout('e',0,{wagon:1.55},figureScale(baby),'basket'),clip=seatedClip(baby,'e','passenger');
  widths.push(drawSprite(ctx,'cart-open-e',750-.55*310,680,310));
  widths.push(drawClip(ctx,clip.id,750+seat.dx*200,680+seat.dy*200,seat.height*200,{timeMs:900}));
  // Same authored figure can retain the existing inherited appearance path.
  const colors=[];for(const appearance of [null,{skin:'brown',hair:'black',clothing:'indigo'}]){const scratch=document.createElement('canvas');scratch.width=260;scratch.height=260;drawClip(scratch.getContext('2d'),'infant-wagon-passenger-s',130,250,160,{timeMs:0,appearance});colors.push(scratch.toDataURL());}
  widths.push(drawClip(ctx,'infant-wagon-passenger-s',200,620,110,{timeMs:0,appearance:{skin:'brown',hair:'black',clothing:'indigo'}}));
  return {widths,distinctFrames:new Set(hashes).size,recolored:colors[0]!==colors[1],seatedHeight:seat.height};
 });assert.ok(proof.widths.every(w=>w>0));assert.equal(proof.distinctFrames,6);assert.equal(proof.recolored,true);assert.equal(proof.seatedHeight,.45*.65);assert.deepEqual(errors,[]);
 await page.locator('#infant-passenger-proof').screenshot({path:'docs/evidence/infant-passenger-art.png'});writeFileSync('docs/evidence/infant-passenger-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: six infant passenger poses, palette variation and production seat geometry render.');
}finally{await browser?.close();await app.close();}

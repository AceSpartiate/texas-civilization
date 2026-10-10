import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'child-passengers-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1200,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {loadArt,drawClip,drawSprite}=await import('/art.js'),{seatedClip,bedLayout,figureScale}=await import('/motion.js');
  await loadArt({sheets:['child-passenger-girl','child-passenger-boy','child-passenger-smallchild','cart-open']});
  const root=document.createElement('section');root.id='child-passenger-proof';root.style.cssText='position:fixed;left:20px;top:20px;width:1100px;padding:20px;background:#afb06f;z-index:999999';root.innerHTML='<h2>Child wagon passengers — side, front, rear and inherited colors</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=960;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],hashes=[];
  const children=[{id:'girl',kind:'person',band:'child',sex:'female'},{id:'boy',kind:'person',band:'child',sex:'male'},{id:'smallchild',kind:'person',band:'small',sex:'male'}];
  for(const [row,p] of children.entries())for(const [col,d] of ['e','s','n'].entries())for(let pose=0;pose<2;pose++){
   const clip=seatedClip(p,d,'passenger'),x=90+(col*2+pose)*180,y=160+row*180;const options={timeMs:pose*750};widths.push(drawClip(ctx,clip.id,x,y,100,options));const scratch=document.createElement('canvas');scratch.width=220;scratch.height=220;drawClip(scratch.getContext('2d'),clip.id,110,210,160,options);hashes.push(scratch.toDataURL());
  }
  const appearance={skin:'brown',hair:'black',clothing:'indigo'},p=children[0],clip=seatedClip(p,'s','passenger');
  const colorImages=[];for(const [i,colors] of [null,appearance].entries()){const scratch=document.createElement('canvas');scratch.width=220;scratch.height=220;drawClip(scratch.getContext('2d'),clip.id,110,210,160,{timeMs:750,appearance:colors});colorImages.push(scratch.toDataURL());widths.push(drawClip(ctx,clip.id,230+i*350,830,150,{timeMs:750,appearance:colors}));}
  // Actual passenger geometry at a representative wagon seat, with the same chooser and inherited palette path.
  const seated=bedLayout('e',0,{wagon:1.55},figureScale(children[2]),true),small=seatedClip(children[2],'e','passenger');
  widths.push(drawSprite(ctx,'cart-open-e',930-.55*155,830,155));
  widths.push(drawClip(ctx,small.id,930+seated.dx*100,830+seated.dy*100,seated.height*100,{timeMs:750,appearance}));
  return {widths,distinctFrames:new Set(hashes).size,recolored:colorImages[0]!==colorImages[1],seatedHeight:seated.height};
 });assert.ok(proof.widths.every(w=>w>0));assert.equal(proof.distinctFrames,18);assert.equal(proof.recolored,true);assert.equal(proof.seatedHeight,.55*.65);assert.deepEqual(errors,[]);
 await page.locator('#child-passenger-proof').screenshot({path:'docs/evidence/child-passenger-art.png'});writeFileSync('docs/evidence/child-passenger-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: eighteen passenger frames, inherited palette and seated geometry render.');
}finally{await browser?.close();await app.close();}

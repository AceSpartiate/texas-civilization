import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'cast2-driver-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1320,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
 const {loadArt,drawClip}=await import('/art.js'),{seatedClip,seatFigure}=await import('/motion.js');await loadArt({sheets:['cast2-drivers-women','cast2-drivers-youth']});
 const entities={};for(const sex of ['male','female'])for(const band of ['adult','youth'])for(const principal of [true,false])for(let n=0;n<100;n++){const e={id:`hh-${n}-${sex}`,kind:'person',sex,band,principal},figure=seatFigure(e);if(['rust-woman','indigo','ochre','blue-girl'].includes(figure))entities[figure]=e;}
 const root=document.createElement('section');root.id='driver-proof';root.style.cssText='position:fixed;left:10px;top:10px;width:1260px;padding:15px;background:#dedbb4;z-index:999999';root.innerHTML='<h2>Second-cast wagon drivers — south / east / west / north, paired poses</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1260;canvas.height=790;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],hashes=[],selected=[];
 ['rust-woman','indigo','ochre','blue-girl'].forEach((who,row)=>{ctx.fillStyle='#403729';ctx.font='18px Georgia';ctx.fillText(who,10,30+row*195);['s','e','w','n'].forEach((dir,col)=>{const clip=seatedClip(entities[who],dir,'wagon');selected.push(clip);for(let pose=0;pose<2;pose++){widths.push(drawClip(ctx,clip.id,80+(col*2+pose)*155,180+row*195,125,{timeMs:pose*600}));const scratch=document.createElement('canvas');scratch.width=240;scratch.height=200;drawClip(scratch.getContext('2d'),clip.id,120,195,160,{timeMs:pose*600});hashes.push(scratch.toDataURL());}});});return{widths,distinctFrames:new Set(hashes).size,selected};
 });assert.ok(proof.widths.every(w=>w>0));assert.equal(proof.distinctFrames,32);assert.ok(proof.selected.every(c=>c.seated&&c.upright));assert.deepEqual(errors,[]);await page.locator('#driver-proof').screenshot({path:'docs/evidence/cast2-wagon-driver-art.png'});writeFileSync('docs/evidence/cast2-wagon-driver-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: all sixteen seat selections and thirty-two authored frames render.');
}finally{await browser?.close();await app.close();}

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeRgba} from '../scripts/build-atlas-manifest.mjs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/coleto-prone-2026-10-03.mjs';
test('prone frames retain true alpha and every measured object without overlap',()=>{
 const root=new URL('../public/assets/frontier-v1/',import.meta.url),atlas=JSON.parse(readFileSync(new URL('atlas.json',root)));
 for(const [sheet,names] of Object.entries(SHEETS)){
  const metadata=atlas.sheets[sheet];assert.ok(metadata.alpha.transparentFraction>.5);
  const image=decodeRgba(readFileSync(new URL('atlases/'+sheet+'.png',root)));
  assert.equal(image.data[3],0);
  for(const name of names){const f=atlas.frames[name];assert.ok(f);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
});
test('prone firing shares infantry cadence',()=>{ const clip=ANIMATION_CLIPS['regular-prone-fire-reload'];assert.equal(clip.frames[0].duration,700);assert.equal(clip.frames.reduce((n,f)=>n+f.duration,0),2470);assert.equal(clip.loop,false);});
import {createBattleView} from '../public/battle-view.js';
test('Coleto night marksmen stay low while other battles retain ordinary infantry art',()=>{
 const noop=()=>{},gradient={addColorStop:noop},ctx=new Proxy({globalAlpha:1,createRadialGradient:()=>gradient,createLinearGradient:()=>gradient,measureText:t=>({width:String(t).length*6})},{get:(o,k)=>k in o?o[k]:noop});
 const camera={toScreen:p=>({x:300+p.x*1000,y:300+p.y*1000}),figure:30,scale:1000};
 for(const [id,phase,expected] of [['coleto','night',true],['coleto','square',false],['gonzales','night',false]]){
  const drawn=[],art={animated:(ctx,clip,x,y,size)=>{drawn.push({id:clip,size});return size},drawSprite:(ctx,sprite,x,y,size)=>{drawn.push({id:sprite,size});return size},miniPerson:noop};
  const view=createBattleView(art),battle={id,phase,minute:1,live:true,over:false,sides:[{key:'mexican',side:'mexican',name:'marksmen',count:8,drawn:8,style:'loose',fire:'scattered',action:'hold',x:0,y:0,facing:{x:1,y:0},spread:{width:.1,depth:.05}}],lines:[],members:[],fallen:[]};
  for(let time=0;time<30000;time+=200)view.draw(ctx,battle,{camera,time,now:time,tickMs:1000,wind:{x:0,y:0},bounds:{width:800,height:600}});
  assert.equal(drawn.some(d=>d.id==='regular-prone-lie'),expected);
  assert.equal(drawn.some(d=>d.id==='regular-prone-fire-reload'),expected);
  if(expected)assert.ok(drawn.filter(d=>d.id.startsWith('regular-prone')).every(d=>Math.abs(d.size-(camera.figure*.95*.35))<1e-9));
 }
});



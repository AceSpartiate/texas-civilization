import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeRgba} from '../scripts/build-atlas-manifest.mjs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/ground-fog-2026-10-03.mjs';
test('fog frames retain true alpha and every measured object without overlap',()=>{
 const root=new URL('../public/assets/frontier-v1/',import.meta.url),atlas=JSON.parse(readFileSync(new URL('atlas.json',root)));
 for(const [sheet,names] of Object.entries(SHEETS)){
  const metadata=atlas.sheets[sheet];assert.ok(metadata.alpha.transparentFraction>.25);
  const image=decodeRgba(readFileSync(new URL('atlases/'+sheet+'.png',root)));
  assert.equal(image.data[3],0);
  for(const name of names){const f=atlas.frames[name];assert.ok(f);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
});

import {createBattleView} from '../public/battle-view.js';
test('fog banks follow projected density and disappear when fog clears',()=>{
 const noop=()=>{},gradient={addColorStop:noop},ctx=new Proxy({globalAlpha:1,createRadialGradient:()=>gradient,measureText:t=>({width:String(t).length*6})},{get:(o,k)=>k in o?o[k]:noop});
 for(const fog of [0,.4,1]){
  const drawn=[],art={animated:(ctx,id)=>{drawn.push({id,alpha:ctx.globalAlpha});return 30},drawSprite:()=>30,miniPerson:noop};
  const camera={toScreen:p=>({x:300+p.x*1000,y:300+p.y*1000}),figure:30,scale:1000};
  const result=createBattleView(art).draw(ctx,{id:'concepcion',phase:'alarm',fog,minute:1,live:true,over:false,sides:[{key:'mexican',side:'mexican',name:'mexican',count:1,drawn:1,style:'ranks',fire:'none',action:'hold',x:0,y:0,facing:{x:1,y:0}}],lines:[],members:[],fallen:[]},{camera,time:1000,now:1000,tickMs:1000,bounds:{width:800,height:600}});
  const banks=drawn.filter(d=>d.id.startsWith('fog-bank-'));
  assert.equal(banks.length>0,fog>0);assert.equal(result.fog,fog);
  if(fog>0)assert.ok(banks.every(d=>d.alpha>0&&d.alpha<=.45));
  if(fog===.4)assert.ok(banks.some(d=>d.id==='fog-bank-thin'));
 }
});

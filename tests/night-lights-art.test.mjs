import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeRgba} from '../scripts/build-atlas-manifest.mjs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/night-lights-2026-10-03.mjs';
test('night light frames retain true alpha and every measured object without overlap',()=>{
 const root=new URL('../public/assets/frontier-v1/',import.meta.url),atlas=JSON.parse(readFileSync(new URL('atlas.json',root)));
 for(const [sheet,names] of Object.entries(SHEETS)){
  const metadata=atlas.sheets[sheet];assert.ok(metadata.alpha.transparentFraction>.25);
  const image=decodeRgba(readFileSync(new URL('atlases/'+sheet+'.png',root)));
  assert.equal(image.data[3],0);
  for(const name of names){const f=atlas.frames[name];assert.ok(f);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
});

import {createBattleView} from '../public/battle-view.js';
test('night-lit assets follow projected light state and keep unlit scenery unchanged',()=>{
 const noop=()=>{},gradient={addColorStop:noop},ctx=new Proxy({globalAlpha:1,createRadialGradient:()=>gradient,measureText:t=>({width:String(t).length*6})},{get:(o,k)=>k in o?o[k]:noop});
 for(const [light,lit,expected] of [['night',true,true],['day',true,false],['night',false,false]]){
  const drawn=[],art={animated:(ctx,id)=>{drawn.push(id);return 30},drawSprite:(ctx,id)=>{drawn.push(id);return 30},miniPerson:noop};
  const camera={toScreen:p=>({x:300+p.x*1000,y:300+p.y*1000}),figure:30,scale:1000};
  createBattleView(art).draw(ctx,{id:'san-patricio',phase:'night',light,minute:1,live:true,over:false,sides:[],lines:[],members:[],fallen:[],scenery:[{id:'a',kind:'house',sprite:'jacal-poor',lit,x:0,y:0},{id:'b',kind:'house',sprite:'cabin-small',lit,x:.1,y:0},{id:'c',kind:'campfire',sprite:'campfire',lit,x:.2,y:0}]},{camera,time:1000,now:1000,tickMs:1000,bounds:{width:800,height:600}});
  for(const clip of ['jacal-night-lit','cabin-night-lit','campfire-night'])assert.equal(drawn.includes(clip),expected,clip);
 }
});

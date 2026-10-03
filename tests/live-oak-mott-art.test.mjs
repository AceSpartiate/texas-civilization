import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeRgba} from '../scripts/build-atlas-manifest.mjs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/live-oak-mott-2026-10-03.mjs';
test('grove frames retain true alpha and every measured object without overlap',()=>{
 const root=new URL('../public/assets/frontier-v1/',import.meta.url),atlas=JSON.parse(readFileSync(new URL('atlas.json',root)));
 for(const [sheet,names] of Object.entries(SHEETS)){
  const metadata=atlas.sheets[sheet];assert.ok(metadata.alpha.transparentFraction>.25);
  const image=decodeRgba(readFileSync(new URL('atlases/'+sheet+'.png',root)));
  assert.equal(image.data[3],0);
  for(const name of names){const f=atlas.frames[name];assert.ok(f);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
});

import {createBattleView} from '../public/battle-view.js';
test('Agua Dulce selects both grove variants and retains a fallback when art is unavailable',()=>{
 const noop=()=>{},ctx=new Proxy({globalAlpha:1,measureText:t=>({width:String(t).length*6})},{get:(o,k)=>k in o?o[k]:noop});
 for(const available of [true,false]){
  const drawn=[],art={animated:(ctx,id)=>{drawn.push(id);return available?30:0},drawSprite:(ctx,id)=>{drawn.push(id);return 30},miniPerson:noop};
  const camera={toScreen:p=>({x:300+p.x*1000,y:300+p.y*1000}),figure:30,scale:1000};
  createBattleView(art).draw(ctx,{id:'agua-dulce',phase:'approach',minute:1,live:true,over:false,sides:[],lines:[],members:[],fallen:[],scenery:[{id:'grove-east',kind:'grove',x:0,y:0,trees:5,spread:.1},{id:'grove-west',kind:'grove',x:.1,y:0,trees:3,spread:.09}]},{camera,time:2000,now:2000,tickMs:1000,bounds:{width:800,height:600}});
  assert.ok(drawn.includes('live-oak-mott-dense-wind'));assert.ok(drawn.includes('live-oak-mott-open-wind'));
  assert.equal(drawn.includes('live-oak-large'),!available);
 }
});


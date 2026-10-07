import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/open-cart-complete-2026-10-07.mjs';
test('cart delivery retains thirty-two complete transparent frames and six rolling cycles',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,32);assert.equal(Object.keys(ANIMATION_CLIPS).length,6);
 for(const [sheet,names] of Object.entries(SHEETS)){
  assert.ok(atlas.sheets[sheet].alpha.transparentFraction>.25);assert.ok(atlas.sheets[sheet].alpha.cornerAlpha.every(v=>v<24));
  for(const id of names){const f=atlas.frames[id];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
 for(const c of Object.values(ANIMATION_CLIPS)){assert.equal(c.frames.length,4);assert.equal(new Set(c.frames.map(f=>f.sprite)).size,4);assert.ok(c.authored&&c.loop);}
});
test('cart renderer chooses loaded/empty cardinal rolling and idle without an extra ox',()=>{
 const src=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const body=src.slice(src.indexOf('function miniWagon('),src.indexOf('function logCabin('));
 let selected,options;const ctx={travelHeading:e=>['n','s'].includes(e.heading)?e.heading:null,animated:(_c,id,_x,_y,_s,_seed,o)=>{selected=id;options=o;return 1;},drawSprite:(_c,id,_x,_y,_s,o)=>{selected=id;options=o;return 1;}};
 vm.runInNewContext(body+';globalThis.draw=miniWagon;',ctx);
 for(const dir of ['e','w','n','s'])for(const laden of [false,true]){
  ctx.draw({},0,0,100,{id:'cart',cart:true,travel:{},heading:dir,laden,gait:{id:'cart'}},dir==='w');
  assert.equal(selected,`cart-open-${laden?'loaded-':''}travel-${['n','s'].includes(dir)?dir:'e'}`);assert.equal(options.flip,dir==='w');
 }
 for(const laden of [false,true]){ctx.draw({},0,0,100,{cart:true,laden},false);assert.equal(selected,`cart-open-${laden?'loaded':'idle'}-e`);}
 ctx.draw({},0,0,100,{cart:true,condition:'broken'},false);assert.equal(selected,'wagon-broken');
});

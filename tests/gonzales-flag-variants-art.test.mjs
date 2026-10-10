import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/gonzales-flag-variants-2026-10-07.mjs';
test('all eight flag variants retain their complete transparent silhouettes',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,8);
 for(const [sheet,names] of Object.entries(SHEETS)){
  assert.ok(a.sheets[sheet].alpha.transparentFraction>.25);assert.ok(a.sheets[sheet].alpha.cornerAlpha.every(v=>v<24));
  for(const id of names){assert.ok(a.frames[id].audit.visiblePixels>0);assert.equal(a.frames[id].audit.trimmedPixels,0);assert.equal(a.frames[id].audit.retainedFraction,1);}
 }
});
test('no-star wind has four authored poses; flat progress is not looped',()=>{
 assert.equal(Object.keys(ANIMATION_CLIPS).length,1);const c=Object.values(ANIMATION_CLIPS)[0];
 assert.equal(c.frames.length,4);assert.equal(new Set(c.frames.map(f=>f.sprite)).size,4);assert.ok(c.loop&&c.authored);assert.ok(c.frames.every(f=>f.duration>=250));
});
test('flag renderer preserves defaults and exposes explicit half/no-star variants',()=>{
 const source=readFileSync(new URL('../public/town-scenes.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('export function drawFlag'),source.indexOf('function drawProp')).replace('export function drawFlag','function drawFlag');
 let selected;const ctx={drawClip:(_c,id)=>{selected=id;return 1;},drawSprite:(_c,id)=>{selected=id;return 1;}};
 vm.runInNewContext(body+';globalThis.draw=drawFlag;',ctx);
 for(const [options,id] of [[{},'flag-come-and-take-it-wind'],[{star:false},'flag-come-and-take-it-no-star-wind'],[{flat:true},'gonzales-flag-work-painted'],[{flat:true,stage:'half'},'gonzales-flag-work-half-star'],[{flat:true,stage:'half',star:false},'gonzales-flag-work-half-no-star'],[{flat:true,star:false},'gonzales-flag-work-done-no-star'],[{flat:true,stage:'cloth',star:false},'gonzales-flag-work-cloth']]){ctx.draw({},0,0,100,options);assert.equal(selected,id);}
});

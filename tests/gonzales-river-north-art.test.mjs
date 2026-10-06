import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/gonzales-river-north-2026-10-05.mjs';
test('river gesture delivery retains all sixteen silhouettes with transparent corners',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,16);assert.equal(Object.keys(ANIMATION_CLIPS).length,8);
 for(const [sheet,names] of Object.entries(SHEETS)) {
  assert.ok(a.sheets[sheet].alpha.transparentFraction>.25);assert.ok(a.sheets[sheet].alpha.cornerAlpha.every(v=>v<24));
  for(const id of names){const f=a.frames[id];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
 for(const id of ['teal','indigo','elder','blue']) assert.equal(new Set(SHEETS['people-gonzales-river-north'].filter(n=>n.startsWith(id)).map(n=>a.frames[n].logicalHeight)).size,1);
});
test('gesture cycles have two unique authored poses and supported timing',()=>{
 for(const clip of Object.values(ANIMATION_CLIPS)) {
  assert.equal(clip.frames.length,2);assert.equal(new Set(clip.frames.map(f=>f.sprite)).size,2);
  assert.equal(clip.loop,true);assert.equal(clip.authored,true);
  assert.ok(clip.frames.every(f=>f.duration>=250));
 }
});
test('north pointing selects dedicated identity art; walking and other facings remain correct',()=>{
 const source=readFileSync(new URL('../public/town-scenes.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('const GROWN'),source.indexOf('/** The walk cycle')).replace('export function sceneClip','function sceneClip');
 const ctx={};vm.runInNewContext(body+';globalThis.pick=sceneClip;',ctx);
 for(const figure of ['teal','indigo','elder','blue']) {
  const p={figure,pose:'point',face:'n'};
  assert.equal(ctx.pick(p).id,`${figure}-river-point-n`);assert.equal(ctx.pick(p).flip,false);
  assert.equal(ctx.pick(p,{moving:true,dir:'n'}).id,`${figure}-walk-n`);
  assert.equal(ctx.pick({...p,face:'s'}).id,`${figure}-river-point-s`);
 }
 assert.equal(ctx.pick({figure:'elder',pose:'point',face:'w'}).id,'elder-river-point');
 assert.equal(ctx.pick({figure:'girl',pose:'point',face:'n'}).id,'girl-idle-n');
});

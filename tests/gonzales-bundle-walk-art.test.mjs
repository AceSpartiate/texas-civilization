import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/gonzales-bundle-walk-2026-10-05.mjs';
test('loaded walking delivery retains all sixteen silhouettes with transparent corners',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,16);assert.equal(Object.keys(ANIMATION_CLIPS).length,4);
 for(const [sheet,names] of Object.entries(SHEETS)) {
  assert.ok(a.sheets[sheet].alpha.transparentFraction>.25);assert.ok(a.sheets[sheet].alpha.cornerAlpha.every(v=>v<24));
  for(const id of names){const f=a.frames[id];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
 for(const id of ['teal','indigo','blue-girl','elder']) assert.equal(new Set(SHEETS['people-gonzales-bundle-walk'].filter(n=>n.startsWith(id)).map(n=>a.frames[n].logicalHeight)).size,1);
});
test('walking cycles have four unique authored poses and supported timing',()=>{
 for(const clip of Object.values(ANIMATION_CLIPS)) {
  assert.equal(clip.frames.length,4);assert.equal(new Set(clip.frames.map(f=>f.sprite)).size,4);
  assert.equal(clip.loop,true);assert.equal(clip.authored,true);
  assert.ok(clip.frames.every(f=>f.duration>=250));
 }
});
test('carrying adults keep parcels in horizontal travel, other motion uses existing cycles',()=>{
 const source=readFileSync(new URL('../public/town-scenes.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('const GROWN'),source.indexOf('/** The walk cycle')).replace('export function sceneClip','function sceneClip');
 const ctx={};vm.runInNewContext(body+';globalThis.pick=sceneClip;',ctx);
 for(const figure of ['teal','indigo','blue-girl','elder']) {
  const p={figure,pose:'carry',face:'e'};
  assert.equal(ctx.pick(p,{moving:true,dir:'e'}).id,`${figure}-bundle-walk`);
  assert.equal(ctx.pick(p,{moving:true,dir:'w'}).flip,true);
  assert.equal(ctx.pick(p,{moving:true,dir:'n'}).id,`${figure}-bundle-walk-n`);
  assert.equal(ctx.pick(p).id,`${figure}-carry`);
  assert.equal(ctx.pick({...p,pose:'idle'},{moving:true,dir:'e'}).id,`${figure}-walk`);
 }
 assert.equal(ctx.pick({figure:'girl',pose:'carry'},{moving:true,dir:'e'}).id,'girl-walk');
});

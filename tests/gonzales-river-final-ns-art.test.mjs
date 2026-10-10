import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/gonzales-river-final-ns-2026-10-06.mjs';
test('river gesture delivery retains all sixteen silhouettes with transparent corners',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,16);assert.equal(Object.keys(ANIMATION_CLIPS).length,8);
 for(const [sheet,names] of Object.entries(SHEETS)) {
  assert.ok(a.sheets[sheet].alpha.transparentFraction>.25);assert.ok(a.sheets[sheet].alpha.cornerAlpha.every(v=>v<24));
  for(const id of names){const f=a.frames[id];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
 for(const id of ['ochre','blue-girl']) for(const dir of ['s','n']) assert.equal(new Set(SHEETS['people-gonzales-river-final-ns'].filter(n=>n.startsWith(id+'-river-') && n.includes('-'+dir+'-')).map(n=>a.frames[n].logicalHeight)).size,1);
});
test('gesture cycles have two unique authored poses and supported timing',()=>{
 for(const clip of Object.values(ANIMATION_CLIPS)) {
  assert.equal(clip.frames.length,2);assert.equal(new Set(clip.frames.map(f=>f.sprite)).size,2);
  assert.equal(clip.loop,true);assert.equal(clip.authored,true);
  assert.ok(clip.frames.every(f=>f.duration>=250));
 }
});
test('remaining adult cast points all cardinal directions without losing their walk',()=>{
 const source=readFileSync(new URL('../public/town-scenes.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('const GROWN'),source.indexOf('/** The walk cycle')).replace('export function sceneClip','function sceneClip');
 const ctx={};vm.runInNewContext(body+';globalThis.pick=sceneClip;',ctx);
 for(const figure of ['ochre','blue-girl']) for(const face of ['e','w','n','s']) {
  const p={figure,pose:'point',face};
  assert.equal(ctx.pick(p).id,`${figure}-river-point${['n','s'].includes(face)?'-'+face:''}`);
  assert.equal(ctx.pick(p).flip,face==='w');
  assert.equal(ctx.pick(p,{moving:true,dir:face}).id,`${figure}-walk${['n','s'].includes(face)?'-'+face:''}`);
 }
 assert.equal(ctx.pick({figure:'teal',pose:'point',face:'n'}).id,'teal-river-point-n');
 assert.equal(ctx.pick({figure:'girl',pose:'point',face:'s'}).id,'girl-idle-s');
});

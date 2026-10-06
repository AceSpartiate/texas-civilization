import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/gonzales-river-gestures-2026-10-04.mjs';
test('river gestures retain alpha and all authored silhouettes',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,8);assert.equal(Object.keys(ANIMATION_CLIPS).length,4);
 const s=a.sheets['people-river-gestures'];assert.ok(s.alpha.transparentFraction>.25);assert.ok(s.alpha.cornerAlpha.every(v=>v<24));
 for(const id of Object.values(SHEETS).flat()) {const f=a.frames[id];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
});
test('town river pointing preserves identity, direction and walking',()=>{
 const source=readFileSync(new URL('../public/town-scenes.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('const GROWN'),source.indexOf('/** The walk cycle')).replace('export function sceneClip','function sceneClip');
 const ctx={};vm.runInNewContext(body+'; globalThis.pick=sceneClip;',ctx);
 for(const figure of ['teal','elder']){
  assert.equal(ctx.pick({figure,pose:'point',face:'e'}).id,`${figure}-river-point`);
  assert.equal(ctx.pick({figure,pose:'point',face:'w'}).flip,true);
  assert.equal(ctx.pick({figure,pose:'point',face:'e'},{moving:true,dir:'e'}).id,`${figure}-walk`);
 }
 assert.equal(ctx.pick({figure:'ochre',pose:'point',face:'w'}).id,'ochre-search');
 assert.equal(ctx.pick({figure:'girl',pose:'point',face:'s'}).id,'girl-idle-s');
 assert.equal(ctx.pick({figure:'volunteer',pose:'point',face:'e'}).id,'volunteer-idle-e');
});
test('at the crossing on September 29 and 30 two of the eighteen watch the far bank in her watch drawings', async () => {
 const {createGonzalesWorld}=await import('../sim/gonzales.mjs');const {townScenesFor,on,SCENE_ARRIVAL,riverward}=await import('../sim/town-scenes.mjs');
 const vm=await import('node:vm');
 const source=readFileSync(new URL('../public/town-scenes.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('const GROWN'),source.indexOf('/** The walk cycle')).replace('export function sceneClip','function sceneClip');
 const ctx={};vm.runInNewContext(body+';globalThis.pick=sceneClip;',ctx);
 for(const minute of [on(0,13),on(1,10)]) {
  const w=createGonzalesWorld('watch-art-proof',5,{map:'colonies'});w.minute=minute+(w.director?.arrival?SCENE_ARRIVAL:0);
  const watchers=townScenesFor(w,null,'host').people.filter(p=>p.pose==='watch');
  assert.ok(watchers.length>=1,'nobody at the crossing watches the far bank');
  for(const person of watchers) assert.equal(ctx.pick(person).id,`${person.figure}-river-watch-${riverward(w)}`,`${person.id} is not drawn watching`);
 }
 assert.equal(ctx.pick({figure:'teal',pose:'watch',face:'w'}).id,'teal-river-watch');assert.equal(ctx.pick({figure:'teal',pose:'watch',face:'w'}).flip,true);
 assert.equal(ctx.pick({figure:'ochre',pose:'watch',face:'s'}).id,'ochre-idle-s','a figure with no watch drawing does not stand');
 assert.equal(ctx.pick({figure:'elder',pose:'watch',face:'s'},{moving:true,dir:'e'}).id,'elder-walk','a watcher walking is not drawn walking');
});

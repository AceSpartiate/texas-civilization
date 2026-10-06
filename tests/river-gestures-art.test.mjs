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
 assert.equal(ctx.pick({figure:'ochre',pose:'point',face:'n'}).id,'ochre-search');
 assert.equal(ctx.pick({figure:'girl',pose:'point',face:'s'}).id,'girl-idle-s');
 assert.equal(ctx.pick({figure:'volunteer',pose:'point',face:'e'}).id,'volunteer-idle-e');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/gonzales-digging-2026-10-04.mjs';
import {createGonzalesWorld} from '../sim/gonzales.mjs';
import {townScenesFor,on,SCENE_ARRIVAL} from '../sim/town-scenes.mjs';
test('spade delivery retains all twelve silhouettes with transparent corners',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,12);assert.equal(Object.keys(ANIMATION_CLIPS).length,3);
 for(const [sheet,names] of Object.entries(SHEETS)) {
  assert.ok(a.sheets[sheet].alpha.transparentFraction>.25);assert.ok(a.sheets[sheet].alpha.cornerAlpha.every(v=>v<24));
  for(const id of names){const f=a.frames[id];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
 for(const id of ['elder','ochre','blue']) assert.equal(new Set(SHEETS['people-gonzales-digging'].filter(n=>n.startsWith(id)).map(n=>a.frames[n].logicalHeight)).size,1);
});
test('Gonzales orchard selects matching spade clips; travel still uses walks',()=>{
 const w=createGonzalesWorld('dig-art-proof',5,{map:'colonies'});w.minute=on(1,10)+(w.director?.arrival?SCENE_ARRIVAL:0);
 const scenes=townScenesFor(w,null,'host');
 const source=readFileSync(new URL('../public/town-scenes.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('const GROWN'),source.indexOf('/** The walk cycle')).replace('export function sceneClip','function sceneClip');
 const ctx={};vm.runInNewContext(body+';globalThis.pick=sceneClip;',ctx);
 for(const id of ['gz-smith-1','gz-smith-2']) {
  const person=scenes.people.find(p=>p.id===id);assert.equal(person.pose,'dig');assert.equal(ctx.pick(person).id,`${person.figure}-dig`);
  assert.equal(ctx.pick(person,{moving:true,dir:'e'}).id,`${person.figure}-walk`);
 }
 assert.equal(ctx.pick({figure:'blue',pose:'dig',face:'w'}).id,'blue-dig');
 assert.equal(ctx.pick({figure:'blue',pose:'dig',face:'w'}).flip,true);
 assert.equal(ctx.pick({figure:'teal',pose:'dig',face:'w'}).id,'teal-work');
 assert.equal(ctx.pick({figure:'girl',pose:'dig',face:'s'}).id,'girl-idle-s');
});

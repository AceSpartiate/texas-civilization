import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/gonzales-seated-paint-2026-10-05.mjs';
test('seated painting delivery retains all twelve silhouettes with transparent corners',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,12);assert.equal(Object.keys(ANIMATION_CLIPS).length,3);
 for(const [sheet,names] of Object.entries(SHEETS)) {
  assert.ok(a.sheets[sheet].alpha.transparentFraction>.25);assert.ok(a.sheets[sheet].alpha.cornerAlpha.every(v=>v<24));
  for(const id of names){const f=a.frames[id];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
 for(const id of ['teal','indigo','blue-girl']) assert.equal(new Set(SHEETS['people-gonzales-seated-paint'].filter(n=>n.startsWith(id)).map(n=>a.frames[n].logicalHeight)).size,1);
});
test('painting cycles have four unique authored poses and supported timing',()=>{
 for(const clip of Object.values(ANIMATION_CLIPS)) {
  assert.equal(clip.frames.length,4);assert.equal(new Set(clip.frames.map(f=>f.sprite)).size,4);
  assert.equal(clip.loop,true);assert.equal(clip.authored,true);
  assert.ok(clip.frames.every(f=>f.duration>=250));
 }
});
test('on the morning of October 1 the two at the flag paint it seated, at the size of the women standing by', async () => {
 const {createGonzalesWorld}=await import('../sim/gonzales.mjs');const {townScenesFor,on,SCENE_ARRIVAL,TOWN_BEATS}=await import('../sim/town-scenes.mjs');
 const vm=await import('node:vm');
 const w=createGonzalesWorld('seated-paint-proof',5,{map:'colonies'});w.minute=on(2,9)+(w.director?.arrival?SCENE_ARRIVAL:0);
 const scenes=townScenesFor(w,null,'host');
 const source=readFileSync(new URL('../public/town-scenes.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('const GROWN'),source.indexOf('/** The walk cycle')).replace('export function sceneClip','function sceneClip');
 const ctx={};vm.runInNewContext(body+';globalThis.pick=sceneClip;',ctx);
 for(const id of ['gz-townswoman-3','gz-townswoman-5']) {
  const person=scenes.people.find(p=>p.id===id);assert.equal(person.pose,'seated-paint',`${id} is not seated at the flag`);
  const clip=ctx.pick(person);assert.equal(clip.id,`${person.figure}-seated-paint`);assert.ok(clip.seated>.7&&clip.seated<1,'a seated drawing is drawn at a standing woman\'s full height');
 }
 assert.equal(ctx.pick({figure:'indigo',pose:'seated-paint',face:'w'}).flip,true);
 assert.equal(ctx.pick({figure:'elder',pose:'seated-paint',face:'e'}).id,'elder-repair','somebody with no seated drawing paints standing');
 // Each seated drawing has its own table and cloth in it: the beat sets none of its own under them.
 const beat=TOWN_BEATS.find(b=>b.id==='flag-paint');assert.ok(!(beat.props||[]).some(p=>['table','flag-work'].includes(p.kind)),'a table drawn under the seated painters\' own');
 assert.ok(TOWN_BEATS.find(b=>b.id==='flag-cloth').people.every(p=>p.pose!=='seated-paint'),'the sewing is seated too');
});

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

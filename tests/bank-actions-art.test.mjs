import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/bank-actions-2026-10-04.mjs';


test('bank action delivery retains at least 99.97 percent of each silhouette and registers all authored animation frames',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,6);assert.equal(Object.keys(ANIMATION_CLIPS).length,1);
 for(const [sheet,names] of Object.entries(SHEETS)) {
  assert.ok(atlas.sheets[sheet].alpha.transparentFraction>.25);
  assert.ok(atlas.sheets[sheet].alpha.cornerAlpha.every(a=>a<24));
  for(const name of names) {const f=atlas.frames[name];assert.equal(f.sheet,sheet);assert.ok(f.audit.visiblePixels>0);assert.ok(f.audit.trimmedPixels<=8);assert.ok(f.audit.retainedFraction>=.9997);}
 }
 for(const clip of Object.values(ANIMATION_CLIPS)) {assert.ok(new Set(clip.frames.map(f=>f.sprite)).size>=2);for(const f of clip.frames) {assert.ok(atlas.frames[f.sprite]);assert.ok(f.duration>0);}}
 assert.equal(new Set(Object.values(SHEETS).flat().map(id=>atlas.frames[id].logicalHeight)).size,1);
 assert.equal(new Set(Object.values(SHEETS).flat().map(id=>atlas.frames[id].logicalHeight)).size,1);
});


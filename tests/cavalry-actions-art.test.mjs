import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeRgba} from '../scripts/build-atlas-manifest.mjs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/cavalry-actions-2026-10-03.mjs';
test('cavalry frames retain true alpha and every measured object without overlap',()=>{
 const root=new URL('../public/assets/frontier-v1/',import.meta.url),atlas=JSON.parse(readFileSync(new URL('atlas.json',root)));
 for(const [sheet,names] of Object.entries(SHEETS)){
  const metadata=atlas.sheets[sheet];assert.ok(metadata.alpha.transparentFraction>.5);
  const image=decodeRgba(readFileSync(new URL('atlases/'+sheet+'.png',root)));
  assert.equal(image.data[3],0);
  for(const name of names){const f=atlas.frames[name];assert.ok(f);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
});
test('mounted fire matches the existing flash clock and charge has four distinct authored poses',()=>{
 const clips=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url))).clips;
 for(const [name,expected] of Object.entries(ANIMATION_CLIPS)){assert.deepEqual(clips[name],expected);assert.equal(new Set(expected.frames.map(f=>f.sprite)).size,4);}
 assert.equal(clips['dragoon-fire'].frames[0].duration,360);
 assert.equal(clips['dragoon-fire'].loop,false);
 assert.equal(clips['lancer-charge'].loop,true);
});

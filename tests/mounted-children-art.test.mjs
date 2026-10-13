import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/mounted-children-complete-2026-10-12.mjs';
import {seatedClip,seatLayout,MOUNTED_HEIGHT} from '../public/motion.js';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
const animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
test('all child horseback frames survive alpha extraction without clipping and have stable cycle scale',()=>{
 assert.equal(Object.values(SHEETS).flat().length,48);
 for(const names of Object.values(SHEETS))for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1,n);assert.equal(f.audit.trimmedPixels,0,n);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
 for(const [n,c]of Object.entries(ANIMATION_CLIPS)){assert.deepEqual(animation.clips[n].frames,c.frames);assert.equal(new Set(c.frames.map(f=>atlas.frames[f.sprite].logicalHeight)).size,1,n);assert.equal(c.loop,true);assert.equal(c.authored,true);assert.equal(c.frames.reduce((s,f)=>s+f.duration,0),920);}
});
test('school-age riders get one whole horse; caregiver art cannot invent a parent for an unpaired toddler',()=>{
 for(const sex of ['female','male'])for(const d of ['e','w','n','s']){
  const c=seatedClip({kind:'person',band:'child',sex},d,'horse');assert.equal(c.id,`${sex==='female'?'girl':'boy'}-ride-${d==='w'?'e':d}`);assert.equal(c.whole,true);assert.ok(animation.clips[c.id]);
  const parts=seatLayout('horse',d,undefined,1,MOUNTED_HEIGHT);assert.equal(parts.length,1);assert.equal(parts[0].whole,true);
 }
 for(const band of ['small','infant'])assert.notEqual(seatedClip({kind:'person',band},'s','horse').whole,true);
 assert.equal(Object.keys(ANIMATION_CLIPS).filter(n=>n.includes('with-caregiver')).length,6);
});

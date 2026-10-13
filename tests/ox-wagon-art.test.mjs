import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/ox-wagon-complete-2026-10-12.mjs';
import {seatedClip,seatLayout} from '../public/motion.js';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
const animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
test('complete wagon rig and child-driver inventory has intact transparent frames and stable animation scale',()=>{
 assert.equal(Object.values(SHEETS).flat().length,40);assert.equal(Object.keys(ANIMATION_CLIPS).length,14);
 for(const names of Object.values(SHEETS))for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1,n);assert.equal(f.audit.trimmedPixels,0,n);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
 for(const [n,c]of Object.entries(ANIMATION_CLIPS)){assert.deepEqual(animation.clips[n].frames,c.frames);assert.equal(new Set(c.frames.map(f=>atlas.frames[f.sprite].logicalHeight)).size,1,n);assert.equal(c.loop,true);assert.equal(c.authored,true);assert.equal(c.frames.reduce((s,f)=>s+f.duration,0),1200);}
 for(const d of ['e','n','s'])assert.equal(new Set(SHEETS[`ox-wagon-composite-${d}`].map(n=>atlas.frames[n].logicalHeight)).size,1,'cargo must not resize rig');
});
test('child drivers use full seated identity layers in all four headings without infant driver art',()=>{
 for(const sex of ['female','male'])for(const d of ['e','w','n','s']){
  const c=seatedClip({kind:'person',band:'child',sex},d,'wagon');assert.equal(c.id,`${sex==='female'?'girl':'boy'}-wagon-driver-${d}`);assert.equal(c.seated,true);assert.equal(c.upright,true);assert.ok(animation.clips[c.id]);
  const driver=seatLayout('wagon',d,undefined,.7,1).find(p=>p.part==='rider');assert.equal(driver.seated,true);assert.equal(driver.shown,undefined);
 }
 for(const band of ['small','infant'])assert.notEqual(seatedClip({kind:'person',band},'s','wagon').seated,true);
});

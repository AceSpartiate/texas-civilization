import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/house-other-sides-2026-10-11.mjs';
import {roofSeat} from '../public/house-plot.js';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
test('all ten requested house views are registered without clipping or opaque corners',()=>{
 const names=Object.values(SHEETS).flat();assert.equal(names.length,10);assert.equal(new Set(names).size,10);
 for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1);assert.equal(f.audit.trimmedPixels,0);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
 assert.deepEqual(ANIMATION_CLIPS,{});
});
test('both rear wall materials provide ground corners and valid mirrored roof seats',()=>{
 for(const material of ['round','hewn']){
  const walls=atlas.frames['house-'+material+'-back-full-walls'];assert.ok(walls.ground);
  const original=atlas.frames['house-'+material+'-full-walls'];
  assert.equal(walls.roofScale,walls.w/original.w);
  for(const corner of ['left','front','right'])assert.ok(walls.ground[corner].every(Number.isFinite));
  for(const roof of ['house-round-roof-partial','house-hewn-roof-finished'])for(const flip of [false,true]){
   const seat=roofSeat(walls,atlas.frames[roof],500,400,130,flip);
   assert.ok(seat);assert.ok([seat.x,seat.y,seat.height,...seat.anchor].every(Number.isFinite));assert.ok(seat.height>0);
   const scale=130/(walls.logicalHeight||walls.h);
   const r=atlas.frames[roof];assert.equal(seat.height,(r.logicalHeight||r.h)*scale*walls.roofScale);
   assert.ok(Math.abs(seat.x-(500+(flip?-1:1)*(walls.seatX-walls.anchorX)*walls.w*scale))<1e-6);
  }
 }
});


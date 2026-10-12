import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/bexar-battle-complete-2026-10-11.mjs';
import {bexarDarknessAtHour,createMoonlightGrade,drawBexarMoonlight,BEXAR_TOWNSFOLK,bexarCivilianHeight} from '../public/bexar-battle-art.js';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
test('all twenty Béxar frames retain complete transparent silhouettes',()=>{
 assert.equal(Object.values(SHEETS).flat().length,20);
 for(const n of Object.values(SHEETS).flat()){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1);assert.equal(f.audit.trimmedPixels,0);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
});
test('authored regular reload matches renderer shot timing and civilians keep row-normalized walking scale',()=>{
 const clip=ANIMATION_CLIPS['regular-loophole-fire-reload'];assert.equal(clip.loop,false);assert.equal(clip.frames[0].duration,700);assert.equal(clip.frames.reduce((a,f)=>a+f.duration,0),2470);
 assert.equal(new Set(SHEETS['regular-loophole-actions'].map(n=>atlas.frames[n].logicalHeight)).size,1);
 for(const n of BEXAR_TOWNSFOLK){const c=ANIMATION_CLIPS[n+'-walk'];assert.equal(c.loop,true);assert.equal(c.authored,true);assert.equal(c.frames.length,4);assert.equal(new Set(c.frames.map(f=>atlas.frames[f.sprite].logicalHeight)).size,1);}
 assert.equal(bexarCivilianHeight('bexar-child'),.62);
});
test('moonlight is continuous at twilight and when compressed calendar targets change mid-fade',()=>{
 assert.equal(bexarDarknessAtHour(3),1);assert.equal(bexarDarknessAtHour(12),0);assert.equal(bexarDarknessAtHour(22),1);
 for(const h of [5,7,17,19])assert.ok(Math.abs(bexarDarknessAtHour(h-.001)-bexarDarknessAtHour(h+.001))<.001);
 const grade=createMoonlightGrade();assert.equal(grade.update(0,0),0);assert.equal(grade.update(1,100),0);
 const before=grade.sample(1000);assert.ok(before>0&&before<1);assert.equal(grade.update(.2,1000),before);
 assert.equal(grade.sample(1000),before);assert.ok(Math.abs(grade.sample(2800)-.2)<1e-9);
 const calls=[],ctx={save(){},restore(){},fillRect(...args){calls.push({color:this.fillStyle,args});}};
 drawBexarMoonlight(ctx,0,{width:100,height:80});assert.equal(calls.length,0);
 drawBexarMoonlight(ctx,1,{width:100,height:80});assert.equal(calls.length,2);assert.deepEqual(calls[0].args,[0,0,100,80]);
});


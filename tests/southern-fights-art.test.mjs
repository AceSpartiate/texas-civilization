import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/southern-fights-complete-2026-10-12.mjs';
import {mountedHeading,mountedActionClip,lancerChargeClip,createSouthernNightGrade,drawSouthernNight} from '../public/southern-battle-art.js';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url))),animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
test('all twenty-four southern mounted frames are complete, transparent and scale-normalized',()=>{
 const names=Object.values(SHEETS).flat();assert.equal(names.length,24);
 for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1);assert.equal(f.audit.trimmedPixels,0);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
 for(const [n,c]of Object.entries(ANIMATION_CLIPS)){assert.equal(c.authored,true);assert.equal(c.frames.length,4);assert.deepEqual(animation.clips[n].frames,c.frames);assert.equal(new Set(c.frames.map(f=>atlas.frames[f.sprite].logicalHeight)).size,1);assert.equal(c.loop,n.startsWith('lancer'));if(!c.loop)assert.equal(c.frames[0].duration,360);}
});
test('mounted directional selectors preserve east/west legacy and choose unmirrored cardinal action contracts',()=>{
 assert.equal(mountedHeading({x:.1,y:1}),'s');assert.equal(mountedHeading({x:.1,y:-1}),'n');assert.equal(mountedHeading({x:-1,y:.1}),'w');
 assert.equal(mountedActionClip('rider','s'),'volunteer-mounted-fire-s');assert.equal(mountedActionClip('dragoon','n'),'dragoon-mounted-fire-n');
 assert.equal(mountedActionClip('dragoon','e'),'dragoon-fire');assert.equal(mountedActionClip('rider','w'),null);
 assert.equal(lancerChargeClip('n'),'lancer-charge-n');assert.equal(lancerChargeClip('w'),'lancer-charge');
});
test('moonless night grade is bounded and continuous when the light target changes',()=>{
 const grade=createSouthernNightGrade();assert.equal(grade.update(1,0),1);assert.equal(grade.update(.4,100),1);
 const before=grade.sample(900);assert.ok(before<1&&before>.4);assert.equal(grade.update(.7,900),before);assert.equal(grade.sample(2700),.7);
 const calls=[],ctx={save(){},restore(){},fillRect(...args){calls.push({color:this.fillStyle,args});},createLinearGradient(){return {addColorStop(){}};}};
 drawSouthernNight(ctx,0,{width:100,height:80});assert.equal(calls.length,0);drawSouthernNight(ctx,1,{width:100,height:80});assert.equal(calls.length,2);
 assert.deepEqual(calls[0].args,[0,0,100,80]);assert.match(calls[0].color,/0\.7600/);
});


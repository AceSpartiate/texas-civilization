import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seatedClip,bedLayout,figureScale,entityClip} from '../public/motion.js';
const baby={id:'baby',kind:'person',band:'infant'};
test('infant basket passengers use three authored directions without changing other infant poses',()=>{
 for(const d of ['e','w','s','n']){const c=seatedClip(baby,d,'passenger');assert.equal(c.id,`infant-wagon-passenger-${d==='w'?'e':d}`);assert.equal(c.seated,true);assert.equal(Boolean(c.upright),d==='n'||d==='s');}
 assert.equal(figureScale(baby),.45);
 assert.equal(seatedClip(baby,'n','horse').id,'infant-idle-s');
 assert.equal(seatedClip(baby,'n','wagon').id,'infant-idle-s');
 assert.equal(entityClip({...baby,speaking:true}).id,'infant-idle-s');
});
test('infant basket retains passenger order and rests below the dangling-leg seat',()=>{
 for(const d of ['e','w','s','n'])for(let i=0;i<4;i++){const old=bedLayout(d,i,undefined,.45),child=bedLayout(d,i,undefined,.45,true),seat=bedLayout(d,i,undefined,.45,'basket');assert.equal(seat.dx,old.dx);assert.equal(seat.front,old.front);assert.equal(seat.height,.45*.65);assert.equal(seat.seated,true);assert.ok(seat.dy>child.dy);assert.ok(seat.dy<old.dy);}
});
test('six infant frames have complete alpha silhouettes and three two-pose loops',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url))),clips=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url))).clips;
 assert.ok(atlas.sheets['infant-wagon-passenger'].alpha.transparentFraction>.4);
 for(const d of ['e','s','n']){const clip=clips[`infant-wagon-passenger-${d}`];assert.equal(clip.authored,true);assert.equal(clip.loop,true);assert.equal(clip.motion,'none');assert.equal(clip.frames.length,2);for(const frame of clip.frames){assert.equal(frame.duration,900);const f=atlas.frames[frame.sprite];assert.equal(f.sheet,'infant-wagon-passenger');assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>0);}}
});

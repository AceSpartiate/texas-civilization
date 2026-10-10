import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seatedClip,bedLayout,figureScale} from '../public/motion.js';
const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url)));
const children=[['girl',{band:'child',sex:'female'}],['boy',{band:'child',sex:'male'}],['smallchild',{band:'small',sex:'male'}]];
test('child passengers choose seated age-specific directions without changing drivers or infant fallback',()=>{
 for(const [who,traits] of children){const p={id:'child',kind:'person',...traits};for(const d of ['e','w','s','n']){const c=seatedClip(p,d,'passenger');assert.equal(c.id,`${who}-wagon-passenger-${d==='w'?'e':d}`);assert.equal(c.seated,true);assert.equal(Boolean(c.upright),d==='n'||d==='s');}assert.equal(figureScale(p),traits.band==='small'?.55:.7);assert.ok(!seatedClip(p,'e','wagon').seated);assert.ok(!seatedClip(p,'e','horse').seated);}
 assert.equal(seatedClip({id:'baby',kind:'person',band:'infant'},'n','passenger').id,'infant-idle-s');
});
test('delivered seats preserve passenger ordering and set hips at the visible wagon rim',()=>{
 for(const d of ['e','w','s','n'])for(const index of [0,1,2,3]){const old=bedLayout(d,index,undefined,.7),next=bedLayout(d,index,undefined,.7,true);assert.equal(next.dx,old.dx);assert.equal(next.front,old.front);assert.equal(next.height,.7*.65);assert.equal(next.seated,true);assert.ok(!('shown' in next));assert.ok(next.dy<old.dy-.3);}
});
test('eighteen passenger frames retain complete silhouettes and nine authored two-pose loops',()=>{
 const a=read('atlas'),c=read('animation').clips;for(const [who] of children){const sheet=`child-passenger-${who}`;assert.ok(a.sheets[sheet].alpha.transparentFraction>.4);for(const d of ['e','s','n']){const clip=c[`${who}-wagon-passenger-${d}`];assert.equal(clip.authored,true);assert.equal(clip.loop,true);assert.equal(clip.frames.length,2);for(const {sprite} of clip.frames){const f=a.frames[sprite];assert.equal(f.sheet,sheet);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>0);}}}
});

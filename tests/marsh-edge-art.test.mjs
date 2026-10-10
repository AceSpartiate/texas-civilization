import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBattleView} from '../public/battle-view.js';
const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url)));
test('eight marsh frames retain all pixels and register two four-frame loops',()=>{
 const atlas=read('atlas'),animation=read('animation');
 assert.ok(atlas.sheets['marsh-edge'].alpha.transparentFraction>.4);
 for(const kind of ['dense','sparse']){const clip=animation.clips[`marsh-edge-${kind}`];assert.equal(clip.loop,true);assert.equal(clip.frames.length,4);assert.equal(new Set(clip.frames.map(f=>f.sprite)).size,4);for(const {sprite} of clip.frames){const f=atlas.frames[sprite];assert.equal(f.sheet,'marsh-edge');assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>0);}}
});
function render(extra={},missing=false){
 const calls=[];const art={animated:(ctx,clip,x,y,size,seed,options)=>{calls.push({clip,x,y,seed,...options});return missing&&clip.startsWith('marsh-edge')?0:size;},drawSprite:()=>1,miniPerson:()=>{}};
 const ctx=new Proxy({measureText:()=>({width:0}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]??(()=>{})});
 createBattleView(art).draw(ctx,{id:'marsh-proof',phase:'fight',minute:1,live:true,over:false,sides:[],members:[],fallen:[],lines:[],formations:[],works:[{id:'peggy',kind:'marsh',x:0,y:0,width:.5}]},{camera:{toScreen:p=>({x:500+p.x*800,y:300+p.y*800}),figure:40,scale:800},time:700,now:700,tickMs:1000,...extra});return calls;
}
test('battle renderer draws both shore variants at stable world locations',()=>{const calls=render(),shore=calls.filter(c=>c.clip.startsWith('marsh-edge'));assert.ok(shore.some(c=>c.clip==='marsh-edge-dense'));assert.ok(shore.some(c=>c.clip==='marsh-edge-sparse'));assert.ok(calls.some(c=>c.clip==='water-motion'));assert.equal(calls.filter(c=>c.clip==='reeds-wind').length,0);assert.deepEqual(render().map(c=>[c.x,c.y,c.seed]),calls.map(c=>[c.x,c.y,c.seed]));});
test('paused and reduced-motion battle works hold their frame clock',()=>{for(const extra of [{paused:true},{reducedMotion:true}])assert.ok(render(extra).every(c=>c.timeMs===0));});
test('older libraries keep their reeds fallback when shoreline art is unavailable',()=>assert.ok(render({},true).some(c=>c.clip==='reeds-wind')));

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {marshWadingClip} from '../public/wading-art.js';
import {createBattleView} from '../public/battle-view.js';
const battle={id:'san-jacinto',phase:'killing',minute:1,live:true,over:false,members:[],fallen:[],lines:[],formations:[],works:[{id:'marsh',kind:'marsh',x:0,y:0,width:.4}]};
const side={side:'mexican',name:'Regulars',style:'rout',moving:true,fire:'none',action:'withdraw',x:0,y:0,facing:{x:1,y:0},drawn:8,count:8,spread:{width:.01,depth:.01}};
test('wading selects only moving non-firing foot soldiers within the wet ellipse',()=>{
 assert.equal(marshWadingClip(battle,side,{x:0,y:0}),'regular-wade');
 assert.equal(marshWadingClip(battle,{...side,side:'texian'},{x:0,y:0}),'volunteer-wade');
 for(const over of [{moving:false},{mounted:true},{fire:'scattered'}])assert.equal(marshWadingClip(battle,{...side,...over},{x:0,y:0}),null);
 assert.equal(marshWadingClip(battle,side,{x:.3,y:0}),null);
 assert.equal(marshWadingClip({...battle,id:'gonzales'},side,{x:0,y:0}),null);
 assert.equal(marshWadingClip({...battle,phase:'parade'},side,{x:0,y:0}),null);
 assert.equal(marshWadingClip({...battle,works:[{...battle.works[0],kind:'breastwork'}]},side,{x:0,y:0}),null);
});
function render(over={},options={}){
 const calls=[];const art={animated:(ctx,clip,x,y,size,seed,opt)=>{calls.push({clip,...opt});return size;},drawSprite:()=>1,miniPerson:()=>{}};
 const ctx=new Proxy({measureText:()=>({width:0}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]??(()=>{})});
 createBattleView(art).draw(ctx,{...battle,sides:[{...side,...over}]},{camera:{toScreen:p=>({x:500+p.x*800,y:300+p.y*800}),figure:40,scale:800},time:700,now:700,tickMs:1000,...options});return calls;
}
test('actual battle renderer selects wading and respects pause and reduced motion',()=>{assert.ok(render().some(c=>c.clip==='regular-wade'));for(const option of [{paused:true},{reducedMotion:true}])assert.ok(render({},option).filter(c=>c.clip==='regular-wade').every(c=>c.paused===true));});
test('surrender poses retain priority over wading',()=>{const calls=render({pose:'surrender'});assert.ok(calls.some(c=>c.clip==='regular-surrender'));assert.ok(!calls.some(c=>c.clip==='regular-wade'));});
test('eight authored wading frames are fully retained with transparent gutters',()=>{
 const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url))),atlas=read('atlas'),animation=read('animation');assert.ok(atlas.sheets['marsh-wading'].alpha.transparentFraction>.4);
 for(const kind of ['volunteer','regular']){const clip=animation.clips[`${kind}-wade`];assert.equal(clip.frames.length,4);assert.equal(clip.loop,true);for(const {sprite} of clip.frames){const f=atlas.frames[sprite];assert.equal(f.sheet,'marsh-wading');assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>0);}}
});

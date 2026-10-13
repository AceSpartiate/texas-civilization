import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GRASS_FIGHT,grassGround} from '../sim/battles/grass-fight.mjs';
import {createBattleView} from '../public/battle-view.js';
const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url)));

test('eight creek frames retain complete silhouettes and crossing has four authored water poses',()=>{
 const atlas=read('atlas'),animation=read('animation');
 assert.ok(atlas.sheets['grass-creek-terrain'].alpha.transparentFraction>.4);
 const names=['creek-bed-dry','creek-bed-curve','creek-ditch-dry','creek-bed-end',...Array.from({length:4},(_,i)=>`creek-ford-${i+1}`)];
 for(const name of names){const f=atlas.frames[name];assert.equal(f.sheet,'grass-creek-terrain');assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>0);}
 const c=animation.clips['creek-ford'];assert.equal(c.authored,true);assert.equal(c.loop,true);assert.equal(c.frames.length,4);assert.equal(new Set(c.frames.map(f=>f.sprite)).size,4);
});

test('Grass Fight scenery replaces banks at existing points and preserves creek course',()=>{
 const ground=grassGround({map:{sites:{bexar:{x:10,y:20}}}}),s=GRASS_FIGHT.scenery(ground);
 assert.equal(s.filter(i=>i.fallbackSprite==='earth-rampart').length,10);
 assert.ok(!s.some(i=>i.sprite==='earth-rampart'));
 const crossing=s.find(i=>i.water);assert.equal(crossing.crossingClip,'creek-ford');assert.equal(crossing.x,ground.ford.x);assert.equal(crossing.y,ground.ford.y);assert.equal(crossing.width,.03);assert.equal(crossing.water.length,3);
});

function render(missing=false,options={}){
 const calls=[],ctx=new Proxy({measureText:()=>({width:0}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
 const art={animated:(ctx,id,x,y,size,seed,opt)=>{calls.push({id,...opt});return missing?0:size;},drawSprite:(ctx,id)=>{calls.push({id});return missing&&id==='creek-bed-dry'?0:1;},miniPerson:()=>{}};
 createBattleView(art).draw(ctx,{id:'grass-fight',phase:'road',minute:0,live:true,over:false,sides:[],members:[],fallen:[],lines:[],formations:[],scenery:[{x:0,y:0,water:[{x:0,y:0},{x:1,y:1}],crossingClip:'creek-ford'},{x:0,y:0,sprite:'creek-bed-dry',fallbackSprite:'earth-rampart'}]},{camera:{toScreen:p=>({x:300+p.x,y:300+p.y}),figure:40,scale:800},time:500,now:500,tickMs:1000,...options});return calls;
}
test('crossing animates, pauses and retains terrain fallback when assets fail',()=>{
 assert.ok(render().some(c=>c.id==='creek-ford'));assert.ok(!render().some(c=>c.id==='earth-rampart'));
 for(const options of [{paused:true},{reducedMotion:true}])assert.equal(render(false,options).find(c=>c.id==='creek-ford').paused,true);
 assert.ok(render(true).some(c=>c.id==='earth-rampart'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS} from '../scripts/art-deliveries/goliad-prisoner-second-2026-10-10.mjs';
import {createBattleView} from '../public/battle-view.js';
const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url)));
test('second prisoner has sixteen complete transparent poses and three walking loops',()=>{
 const atlas=read('atlas'),clips=read('animation').clips;
 assert.ok(atlas.sheets['goliad-prisoner-second'].alpha.transparentFraction>.4);
 assert.equal(SHEETS['goliad-prisoner-second'].length,16);
 for(const name of SHEETS['goliad-prisoner-second']){const f=atlas.frames[name];assert.equal(f.sheet,'goliad-prisoner-second');assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>0);}
 for(const [dir,count] of [['e',4],['s',2],['n',2]]){const c=clips[`prisoner2-walk-${dir}`];assert.equal(c.frames.length,count);assert.equal(c.authored,true);assert.equal(c.loop,true);}
});
function fixture(missing=false){
 const calls=[],ctx=new Proxy({measureText:()=>({width:0}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
 const art={animated:(ctx,id,x,y,size,seed,opt)=>{calls.push({id,x,y,seed,...opt});return missing&&id.startsWith('prisoner2')?0:size;},drawSprite:(ctx,id,x,y,size)=>{calls.push({id,x,y,size});return missing&&id.startsWith('prisoner2')?0:1;},miniPerson:()=>{calls.push({id:'fallback-person'});}};
 const view=createBattleView(art),side={side:'texian',key:'texian',name:'Prisoners',figure:'prisoner',count:8,drawn:8,style:'column',action:'advance',moving:true,fire:'none',x:0,y:0,facing:{x:1,y:0}};
 const b={id:'goliad-massacre',phase:'column',minute:0,live:true,over:false,sides:[side],members:[],fallen:[],lines:[],formations:[]};
 const draw=(changes={},opt={})=>{calls.length=0;view.draw(ctx,{...b,...changes},{camera:{toScreen:p=>({x:300+p.x*1000,y:300+p.y*1000}),figure:40,scale:1000},time:500,now:500,tickMs:1000,...opt});return [...calls];};
 return {draw,side};
}
test('sampled prisoners mix stable identities in all directions and hold on pause',()=>{
 const {draw,side}=fixture();
 for(const [dir,facing] of [['e',{x:1,y:0}],['s',{x:0,y:1}],['n',{x:0,y:-1}]]){const calls=draw({sides:[{...side,facing}]},{paused:true});assert.ok(calls.some(c=>c.id===`prisoner2-walk-${dir}`));assert.ok(calls.some(c=>c.id===`prisoner-walk-${dir}`));assert.ok(calls.filter(c=>c.id.startsWith('prisoner2-walk')).every(c=>c.paused));}
 const a=draw(),b=draw();assert.deepEqual(a.filter(c=>c.id.startsWith('prisoner2')).map(c=>c.seed),b.filter(c=>c.id.startsWith('prisoner2')).map(c=>c.seed));
 assert.ok(draw({sides:[{...side,moving:false}]}).some(c=>c.id==='prisoner2-idle-e'));
});
test('all sampled down figures retain their identity and unarmed missing-art fallback',()=>{
 const {draw}=fixture();const falls={fallen:[{side:'texian',count:8,minute:0,carried:false}]};
 assert.equal(draw(falls).find(c=>c.id==='prisoner2-still').size,40*.95*.32);assert.ok(draw(falls).some(c=>c.id==='prisoner-still'));
 const missing=fixture(true).draw();assert.ok(missing.some(c=>c.id==='prisoner2-walk-e'));assert.ok(missing.some(c=>c.id==='prisoner-walk-e'));assert.ok(!missing.some(c=>c.id==='fallback-person'));
 const down=fixture(true).draw(falls);assert.ok(down.some(c=>c.id==='prisoner-still'));assert.ok(!down.some(c=>c.id==='fallback-person'));
});

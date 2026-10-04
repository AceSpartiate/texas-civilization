import test from 'node:test';
import assert from 'node:assert/strict';
import {floodCurrentMarks,drawFloodCurrent,drawHighWater} from '../public/weather-art.js';
const course={points:[{x:0,y:100},{x:200,y:150},{x:500,y:100}],width:28};
test('current preparation is bounded, finite and absent in normal water',()=>{
 assert.equal(floodCurrentMarks([course],()=>0,{width:600,height:300}).length,0);
 const marks=floodCurrentMarks(Array(50).fill(course),()=>1,{width:600,height:300});
 assert.ok(marks.length>0&&marks.length<=160);
 assert.ok(marks.every(m=>[m.x,m.y,m.tx,m.ty,m.width].every(Number.isFinite)));
});
test('flood currents move independently of cached terrain and respect reduced motion',()=>{
 const marks=floodCurrentMarks([course],()=>1,{width:600,height:300});
 const paths=[];const ctx={save(){},restore(){},beginPath(){},moveTo(...p){paths.push(p);},quadraticCurveTo(){},stroke(){}};
 assert.equal(drawFloodCurrent(ctx,marks,1000,{still:true}),0);assert.equal(paths.length,0);
 drawFloodCurrent(ctx,marks,0);const first=structuredClone(paths);paths.length=0;drawFloodCurrent(ctx,marks,900);
 assert.notDeepEqual(paths,first);
});
test('overbank flooding adds an irregular continuous shoreline; normal water adds none',()=>{
 let pools=0;const ctx=new Proxy({canvas:{width:600,height:300},globalAlpha:1,fill(){pools++;}},{get:(o,k)=>k in o?o[k]:()=>{}});
 drawHighWater(ctx,[course],()=>0);assert.equal(pools,0);
 drawHighWater(ctx,[course],()=>1);assert.ok(pools>0);
});

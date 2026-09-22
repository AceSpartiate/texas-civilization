import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarMinutes } from '../sim/clock.mjs';
const scene = () => ({ minute: 1000, map: {source:'colonies'}, director:{phase:'campaign',milestones:{}}, households:{h:{played:true}}, entities:{p:{id:'p',householdId:'h',health:{condition:'well'},service:{kind:'garrison',status:'serving'}}}, barriers:[] });
test('a live Alamo courier choice gets reading time, not half-day campaign ticks',()=>{
 const w=scene();w.entities.p.service.courier='open';assert.equal(calendarMinutes(w),20);
 w.entities.p.auto=true;assert.equal(calendarMinutes(w),720);
});
test('a played military journey slows, while quiet camp and absent families stay compressible',()=>{
 const w=scene();w.entities.p.travel={purpose:'service'};assert.equal(calendarMinutes(w),120);
 delete w.entities.p.travel;assert.equal(calendarMinutes(w),720);
 w.entities.p.travel={purpose:'service'};w.households.h.absent=true;assert.equal(calendarMinutes(w),720);
});
test('an attended military scene lands on its next historical boundary instead of skipping it',()=>{
 const w=scene();w.barriers=[{id:'gonzales:courier-1-opens',minute:1007,resolved:false,kind:'historical-scene'}];
 assert.equal(calendarMinutes(w),7);
 w.barriers[0].resolved=true;assert.equal(calendarMinutes(w),720);
});

import { withCalendarStep } from '../sim/clock.mjs';
import { resolveTimeJump } from '../sim/time.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
test('all movement in a boundary tick uses its original interval, and the transient clock never survives errors',()=>{
 const w=scene();w.barriers=[{kind:'historical-scene',minute:1007,resolved:false}];
 withCalendarStep(w,7,()=>{w.minute+=7;assert.equal(calendarMinutes(w),7)});
 assert.equal(calendarMinutes(w),720);
 assert.throws(()=>withCalendarStep(w,3,()=>{throw new Error('test')}));assert.equal(calendarMinutes(w),720);
});
test('quiet-time skipping refuses an unanswered military choice or an attended military journey',()=>{
 const w=createGonzalesWorld('military-jump',5);w.status='running';
 const h=w.households['hh-1'];h.played=true;const p=w.entities[h.principalId];p.service={kind:'garrison',status:'serving',courier:'open'};
 const before=w.minute;
 assert.deepEqual(resolveTimeJump(w,100),{requestedMinutes:100,advancedMinutes:0,blockedBy:`military:${p.id}`,eventId:null});
 delete p.service.courier;
 // An already valid arrival journey becomes a service journey for this guard check.
 assert.ok(p.travel);p.travel.purpose='service';
 assert.equal(resolveTimeJump(w,100).advancedMinutes,0);assert.equal(w.minute,before);
});

test('an army still tagged marching but halted in camp is quiet time, not a moving journey',()=>{
 const w=scene();w.army={members:['p'],phase:'marching',camp:'the Cibolo'};
 w.entities.p.travel={purpose:'march',halted:true};assert.equal(calendarMinutes(w),720);
 w.army.camp=null;assert.equal(calendarMinutes(w),120);
});

test('a chosen courier leaving the Alamo and a recalled volunteer retain journey pacing after release',()=>{
 const w=scene();w.entities.p.service.status='released';w.entities.p.travel={purpose:'home'};
 assert.equal(calendarMinutes(w),120);
 delete w.entities.p.service;w.entities.p.commitments=[{id:'volunteer',status:'ended'}];assert.equal(calendarMinutes(w),120);
 delete w.entities.p.travel;assert.equal(calendarMinutes(w),720);
});

import { moveCamp, SIEGE_CAMPS } from '../sim/army.mjs';
test('a camp order starts a visible journey: it is neither an arrival nor a free tick of marching',()=>{
 const w=scene();w.map.sites={bexar:{id:'bexar',x:10,y:10}};
 w.army={members:['p'],phase:'marching',camp:SIEGE_CAMPS.above.name,leftMinute:0,x:10,y:9,progress:1,road:{points:[{x:10,y:12},{x:10,y:9}],distance:3,nodes:[],stops:{},campaign:true}};
 moveCamp(w,'concepcion');
 assert.equal(w.army.camp,null,'the order must not read as already arrived');
 assert.equal(w.army.leftMinute,w.minute,'the order tick must not also march');
 assert.equal(calendarMinutes(w),120);
});

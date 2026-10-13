import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/army-camp-2026-10-10.mjs';
import {drawArmy,CAMP_SCALE,menDrawn} from '../public/army-view.js';
const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url)));
test('twelve camp frames retain full alpha silhouettes and authored prop loops',()=>{
 const atlas=read('atlas'),clips=read('animation').clips;
 for(const [sheet,names] of Object.entries(SHEETS)){assert.ok(atlas.sheets[sheet].alpha.transparentFraction>.4);for(const n of names){const f=atlas.frames[n];assert.equal(f.sheet,sheet);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>0);}}
 for(const name of Object.keys(ANIMATION_CLIPS)){const c=clips[name];assert.ok(c);assert.equal(c.authored,true);assert.equal(c.loop,true);assert.ok(c.frames.length>=2);}
});
function render(side='texian',options={},missing=false){
 const calls=[],ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})});let smoke=0;
 const result=drawArmy(ctx,{id:'proof',side,strength:24,name:'Camp',ours:2},{x:400,y:300},{scale:CAMP_SCALE,figure:30,time:750,draw:(id,x,y,size,key,opt)=>{calls.push({id,...opt});return missing?0:size;},sprite:(id)=>{calls.push({id,paused:true,timeMs:0});return missing?0:1;},mini:()=>calls.push({id:'mini'}),smoke:()=>{smoke++;return true;},...options});
 return {calls,result,smoke};
}
test('both camps select painted tents/fire/arms/pennant while preserving troop count and gale smoke',()=>{
 for(const side of ['texian','mexican']){const {calls,result,smoke}=render(side);assert.equal(result,'camp');assert.equal(calls.filter(c=>c.id.startsWith('camp-wedge')).length,side==='mexican'?2:3);assert.ok(calls.some(c=>c.id==='camp-cookfire'));assert.ok(calls.some(c=>c.id==='musket-stack-small'));assert.ok(calls.some(c=>c.id===`camp-pennant-${side==='mexican'?'rust':'ochre'}`));assert.equal(calls.filter(c=>c.id.endsWith('idle-e')||c.id.endsWith('idle-w')).length,menDrawn(24));assert.equal(smoke,1);}
});
test('paused/reduced motion holds props and far zoom stays a marker with no camp draw',()=>{
 for(const options of [{paused:true},{reducedMotion:true}])assert.ok(render('texian',options).calls.every(c=>c.paused&&c.timeMs===0));
 const far=render('texian',{scale:CAMP_SCALE-1});assert.equal(far.result,'mark');assert.equal(far.calls.length,0);
});
test('unavailable artwork preserves canvas camp, fallback people and norther smoke',()=>{const f=render('mexican',{},true);assert.equal(f.result,'camp');assert.equal(f.calls.filter(c=>c.id==='mini').length,menDrawn(24));assert.equal(f.smoke,1);});

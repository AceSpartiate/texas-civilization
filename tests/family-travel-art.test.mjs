import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/family-travel-complete-2026-10-12.mjs';
import {ADULT_PASSENGER_FIGURES,seatedClip,carryingInfantClip,bedLayout} from '../public/motion.js';
const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
test('all 116 new frames are fully retained and all 43 authored loops have stable scale',()=>{
 assert.equal(Object.values(SHEETS).flat().length,116);assert.equal(Object.keys(ANIMATION_CLIPS).length,43);
 for(const [sheet,names] of Object.entries(SHEETS)){assert.ok(a.sheets[sheet].alpha.transparentFraction>.4);for(const name of names){const f=a.frames[name];assert.equal(f.sheet,sheet);assert.equal(f.audit.retainedFraction,1,name);assert.equal(f.audit.trimmedPixels,0,name);assert.ok(f.audit.visiblePixels>0);}}
 for(const clip of Object.values(ANIMATION_CLIPS)){assert.equal(clip.authored,true);assert.equal(clip.loop,true);assert.equal(new Set(clip.frames.map(f=>a.frames[f.sprite].logicalHeight)).size,1);}
});
test('eight adult cast passenger identities have complete seats in all directions',()=>{
 for(const p of ADULT_PASSENGER_FIGURES)for(const d of ['e','w','s','n'])assert.ok(ANIMATION_CLIPS[`${p}-wagon-passenger-${d==='w'?'e':d}`]);
 const mom={kind:'person',id:'m',principal:true,sex:'female',band:'adult'};
 assert.equal(seatedClip(mom,'w','passenger').id,'rust-woman-wagon-passenger-e');
 assert.equal(seatedClip(mom,'n','passenger').seated,true);
 const customized={...mom,appearance:{head:'bonnet'}};assert.equal(seatedClip(customized,'s','passenger').id,'rust-woman-rig-passenger-s');
 assert.equal(seatedClip({...mom,appearance:{head:'braid'}},'s','passenger').seated,true);
 assert.equal(bedLayout('e',0,undefined,1,true).height,.65);
});
test('a carrying composite requires exactly one projected infant assigned to that caregiver',()=>{
 const mom={kind:'person',id:'m',householdId:'hh',principal:true,sex:'female',band:'adult',travel:{afoot:true}};
 const baby={kind:'person',id:'b',householdId:'hh',band:'infant',travel:{carried:'m'}};
 const c=carryingInfantClip(mom,[mom,baby]);assert.equal(c.id,'rust-woman-infant-walk-e');assert.equal(c.babyId,'b');
 assert.equal(carryingInfantClip(mom,[]),null);
 assert.equal(carryingInfantClip(mom,[baby,{...baby,id:'twin'}]),null);
 assert.equal(carryingInfantClip(mom,[{...baby,householdId:'else'}]),null);
 for(const change of [{fallen:true},{health:{condition:'dead'}},{travel:{rides:'wagon'}},{travel:{afoot:true,saddle:true}},{appearance:{head:'braid'}}])assert.equal(carryingInfantClip({...mom,...change},[baby]),null);
 assert.equal(carryingInfantClip(mom,[{...baby,fallen:true}]),null);
 assert.equal(carryingInfantClip({...mom,travel:{afoot:true,halted:true}},[baby]).frozen,true);
});

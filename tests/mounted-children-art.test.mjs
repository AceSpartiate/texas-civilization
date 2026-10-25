import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/mounted-children-complete-2026-10-12.mjs';
import {seatedClip,seatLayout,MOUNTED_HEIGHT} from '../public/motion.js';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
const animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
test('all child horseback frames survive alpha extraction without clipping and have stable cycle scale',()=>{
 assert.equal(Object.values(SHEETS).flat().length,48);
 for(const names of Object.values(SHEETS))for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1,n);assert.equal(f.audit.trimmedPixels,0,n);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
 for(const [n,c]of Object.entries(ANIMATION_CLIPS)){assert.deepEqual(animation.clips[n].frames,c.frames);assert.equal(new Set(c.frames.map(f=>atlas.frames[f.sprite].logicalHeight)).size,1,n);assert.equal(c.loop,true);assert.equal(c.authored,true);assert.equal(c.frames.reduce((s,f)=>s+f.duration,0),920);}
});
test('school-age riders get one whole horse; caregiver art cannot invent a parent for an unpaired toddler',()=>{
 for(const sex of ['female','male'])for(const d of ['e','w','n','s']){
  const c=seatedClip({kind:'person',band:'child',sex},d,'horse');assert.equal(c.id,`${sex==='female'?'girl':'boy'}-ride-${d==='w'?'e':d}`);assert.equal(c.whole,true);assert.ok(animation.clips[c.id]);
  const parts=seatLayout('horse',d,undefined,1,MOUNTED_HEIGHT);assert.equal(parts.length,1);assert.equal(parts[0].whole,true);
 }
 for(const band of ['small','infant'])assert.notEqual(seatedClip({kind:'person',band},'s','horse').whole,true);
 assert.equal(Object.keys(ANIMATION_CLIPS).filter(n=>n.includes('with-caregiver')).length,6);
});
// Wired 2026-10-25 (batch W of docs/ART_PLAN_LOCAL_2026-10-25.md): the paired infant rider is drawn for the baby the server puts in
// a rider's arms (sim/company.mjs `carried` with `saddle`) only where her restriction holds - her baseline indigo caregiver, no
// chosen look, a horse, one baby - and never invents a pair the server did not make.
test('a baby in the arms of her baseline caregiver on the horse is her paired rider; nothing else is',async()=>{
 const {mountedInfantClip,figureOf}=await import('../public/motion.js');
 const id=Array.from({length:40},(_,i)=>`hh-1-p${i}`).find(id=>figureOf({kind:'person',sex:'female',band:'adult',id})==='indigo');
 assert.ok(id,'an id the cast draws as indigo');
 const road=(dx,dy)=>({points:[{x:0,y:0},{x:dx,y:dy}],progress:0});
 const scene=({carrier={},baby={},horse={},more=[]}={})=>{
  const rider={kind:'person',id,householdId:'hh-1',sex:'female',band:'adult',travel:{mode:'foot',saddle:true,rides:'hh-1-horse',...road(1,0)},...carrier};
  const child={kind:'person',id:'hh-1-baby',householdId:'hh-1',band:'infant',age:0.5,travel:{saddle:true,rides:'hh-1-horse',carried:id},...baby};
  return [rider,child,{kind:'animal',id:'hh-1-horse',householdId:'hh-1',species:'horse',...horse},...more];
 };
 const ok=scene(),clip=mountedInfantClip(ok[0],ok);
 assert.deepEqual(clip,{id:'infant-with-caregiver-ride-e',babyId:'hh-1-baby',whole:true,upright:false});
 assert.ok(animation.clips[clip.id],'her clip');
 for(const [dx,dy,d] of [[-1,0,'e'],[0,1,'s'],[0,-1,'n']]){const s=scene({carrier:{travel:{saddle:true,rides:'hh-1-horse',...road(dx,dy)}}});assert.equal(mountedInfantClip(s[0],s).id,`infant-with-caregiver-ride-${d}`);}
 const none=[
  ['a rider with a chosen look',scene({carrier:{appearance:{head:'bonnet'}}})],
  ['a rider the cast draws otherwise (the principal woman)',scene({carrier:{principal:true}})],
  ['a mule',scene({horse:{species:'mule'}})],
  ['no baby in her arms',scene({baby:{travel:{saddle:true,rides:'hh-1-horse'}}})],
  ['a small child, not a baby',scene({baby:{band:'small',age:3}})],
  ['twins',scene({more:[{kind:'person',id:'hh-1-baby2',householdId:'hh-1',band:'infant',travel:{saddle:true,carried:id}}]})],
  ['a hurt rider',scene({carrier:{health:{condition:'wounded'}}})],
  ['a rider on foot',scene({carrier:{travel:{afoot:true,...road(1,0)}}})],
 ];
 for(const [what,s] of none){const r=s.find(p=>p.kind==='person'&&!p.travel?.carried)||s[0];assert.equal(mountedInfantClip(r,s),null,what);}
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(app,/const paired = seat === 'horse' \? mountedInfantClip\(entity, entities\) : null;/);
});

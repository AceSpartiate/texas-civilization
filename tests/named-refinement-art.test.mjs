import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS,RIDERS} from '../scripts/art-deliveries/named-refinements-complete-2026-10-12.mjs';
import {milamFireClip,namedMountedRefinement} from '../public/named-refinement-art.js';
import {PERSON_ART,createBattleView} from '../public/battle-view.js';
const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
test('all named refinement silhouettes are complete and authored loops keep constant scale',()=>{
 assert.equal(Object.values(SHEETS).flat().length,100);assert.equal(Object.keys(ANIMATION_CLIPS).length,32);
 for(const [sheet,names] of Object.entries(SHEETS)){assert.ok(a.sheets[sheet].alpha.transparentFraction>.4);for(const name of names){const f=a.frames[name];assert.equal(f.sheet,sheet);assert.equal(f.audit.retainedFraction,1,name);assert.equal(f.audit.trimmedPixels,0,name);}}
 for(const c of Object.values(ANIMATION_CLIPS)){assert.equal(c.authored,true);assert.equal(c.loop,true);assert.equal(new Set(c.frames.map(f=>a.frames[f.sprite].logicalHeight)).size,1);}
});
test('Milam has four aim/fire/load/ramrod cycles and never borrows an advance pose',()=>{
 for(const [h,d] of [['east','e'],['west','w'],['north','n'],['south','s']]){const id=milamFireClip(h);assert.equal(id,`milam-fire-service-${d}`);assert.deepEqual(ANIMATION_CLIPS[id].frames.map(f=>f.sprite),['aim','fire','load','ramrod'].map(p=>`milam-service-${d}-${p}`));}
 assert.equal(milamFireClip(undefined,false),'milam-fire-service-w');
});
test('normal rider travel stays walking; trot and dispatch require explicit scene flags',()=>{
 for(const art of RIDERS){assert.equal(namedMountedRefinement({art,moving:true}),null);
  for(const [heading,d] of [['east','e'],['west','e'],['south','s'],['north','n']]){
   const p={art,moving:true,heading};assert.equal(namedMountedRefinement({...p,gait:'trot'}).clip,`${art}-mounted-trot-${d}`);assert.equal(namedMountedRefinement({...p,moving:false,mountedAction:'dispatch'}).clip,`${art}-mounted-dispatch-${d}`);assert.equal(namedMountedRefinement({...p,gait:'trot'}).flip,heading==='west');
   assert.equal(namedMountedRefinement({...p,mountedAction:'dispatch'}),null);
  }
  assert.equal(namedMountedRefinement({art,moving:false}).clip,`${art}-mounted-rest-e`);
  assert.equal(namedMountedRefinement({art,moving:false,heading:'north'}),null);
  assert.equal(PERSON_ART[art].rideTrot,`clip:${art}-mounted-trot-e`);
 }
 assert.equal(namedMountedRefinement({art:'houston',moving:true,gait:'trot'}),null);
});
test('fall and still remain distinct and do not invent deaths for surviving couriers',()=>{
 for(const p of ['kimbell','martin']){assert.equal(PERSON_ART[p].fall,`${p}-fall-relief`);assert.equal(PERSON_ART[p].still,`${p}-still-relief`);assert.notEqual(PERSON_ART[p].fall,PERSON_ART[p].still);}
 for(const p of ['jw-smith','horton'])assert.equal(PERSON_ART[p].still,undefined);
});
test('the battlefield draws Milam firing north and a halted courier holding still on his own horse',()=>{
 const calls=[],noop=()=>{},ctx=new Proxy({globalAlpha:1,measureText:t=>({width:String(t).length*6})},{get:(o,k)=>k in o?o[k]:noop});
 const art={animated:(ctx,clip,x,y,size,seed,options)=>{calls.push({clip,...options});return size;},drawSprite:()=>30,miniPerson:noop};
 const camera={toScreen:p=>({x:300+p.x*1000,y:300+p.y*1000}),figure:30,scale:1000};
 createBattleView(art).draw(ctx,{id:'refinement-proof',phase:'battle',minute:1,live:true,over:false,sides:[],lines:[],members:[],fallen:[],people:[{id:'milam',art:'milam',name:'Milam',side:'texian',x:0,y:0,right:false,pose:'fire',aimHeading:'north'},{id:'jw-smith',art:'jw-smith',name:'Smith',side:'texian',x:.01,y:0,right:true,pose:'ride',moving:false}]},{camera,time:350,now:350,tickMs:1000,wind:{x:0,y:0},bounds:{width:800,height:600}});
 assert.ok(calls.some(c=>c.clip==='milam-fire-service-n'&&c.flip===false));
 assert.ok(calls.some(c=>c.clip==='jw-smith-mounted-rest-e'));
 assert.ok(!calls.some(c=>c.clip==='jw-smith-mounted-trot-e'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {KINDS} from '../sim/woods.mjs';
import {GALE_POSES,drawWeatherTree} from '../public/weather-art.js';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/colony-hardwoods-2026-10-11.mjs';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
test('all seven colony hardwood species use distinct delivered identities while wood economics stay unchanged',()=>{
 for(const [kind,sprite,logs,fell] of [['water-oak','tree-water-oak',[1,2,3],1],['bur-oak','tree-bur-oak',[1,2,2],1.1],['white-oak','tree-white-oak',[1,2,3],1.1],['texas-oak','tree-texas-oak',[1,1,2],1],['hickory','tree-hickory',[1,2,2],1.2],['walnut','tree-walnut',[1,2,2],1.2],['ash','tree-ash',[1,2,3],1]]){
  const k=KINDS[kind];assert.equal(k.picture,sprite);assert.equal(k.sized,false);
  assert.deepEqual(k.logs,logs);assert.equal(k.fell,fell);assert.equal(k.use,['bur-oak','white-oak'].includes(kind)?'sill':kind==='texas-oak'?'poor':'wall');
 }
 assert.equal(KINDS.pecan.stump,'stump-pecan');
});
test('all twenty-two new frames are complete, transparent, registered, with normalized authored gust pairs',()=>{
 const animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
 for(const sprites of Object.values(SHEETS))for(const s of sprites){const f=atlas.frames[s];assert.ok(f,s);assert.equal(f.audit.retainedFraction,1);assert.equal(f.audit.trimmedPixels,0);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
 for(const n of SHEETS['colony-hardwoods'].filter(n=>n!=='stump-pecan')){
  const clip=ANIMATION_CLIPS[n+'-gale'];assert.equal(clip.authored,true);assert.equal(clip.loop,true);assert.equal(clip.frames.length,2);
  assert.deepEqual(animation.clips[n+'-gale'].frames,clip.frames);assert.equal(GALE_POSES[n],n+'-gale-1');
  const [a,b]=clip.frames.map(f=>atlas.frames[f.sprite]);assert.equal(a.logicalHeight,b.logicalHeight);assert.ok(a.logicalHeight>=a.h&&a.logicalHeight>=b.h);
 }
});
test('regional wind poses replace upright art without double shear, with same-identity unloaded fallback',()=>{
 for(const n of SHEETS['colony-hardwoods'].filter(n=>n!=='stump-pecan')){
  const gale={norther:1,wind:{x:0,y:1}},calls=[];const draw=(_ctx,name,_x,_y,_h,options)=>{calls.push({name,options});return 20;};
  assert.equal(drawWeatherTree({},n,0,0,100,gale,draw),true);assert.deepEqual(calls,[{name:n+'-gale-1',options:undefined}]);
  const missing=[];drawWeatherTree({},n,0,0,100,gale,(_ctx,name,_x,_y,_h,options)=>{missing.push({name,options});return name===n?20:0;});
  assert.deepEqual(missing.map(c=>c.name),[n+'-gale-1',n]);assert.equal(typeof missing[1].options.lean,'number');
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/regular-engineering-2026-10-04.mjs';
import {createBattleView} from '../public/battle-view.js';

test('regular engineering delivery retains every silhouette and registers all authored animation frames',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,16);assert.equal(Object.keys(ANIMATION_CLIPS).length,4);
 for(const [sheet,names] of Object.entries(SHEETS)) {
  assert.ok(atlas.sheets[sheet].alpha.transparentFraction>.25);
  assert.ok(atlas.sheets[sheet].alpha.cornerAlpha.every(a=>a<24));
  for(const name of names) {const f=atlas.frames[name];assert.equal(f.sheet,sheet);assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
 for(const clip of Object.values(ANIMATION_CLIPS)) {assert.ok(new Set(clip.frames.map(f=>f.sprite)).size>=2);for(const f of clip.frames) {assert.ok(atlas.frames[f.sprite]);assert.ok(f.duration>0);}}
});

test('battle work selects the engineering cycle for each army',()=>{
 for(const [side,expected] of [['mexican','regular-dig'],['texian','volunteer-dig']]) {
  const drawn=[];
  const art={animated:(_c,clip,_x,_y,size)=>{drawn.push(clip);return size;},drawSprite:()=>30,miniPerson:()=>{}};
  const ctx=new Proxy({measureText:()=>({width:0})},{get:(o,k)=>o[k]||(()=>{})});
  const view=createBattleView(art),camera={toScreen:p=>({x:400+p.x*1000,y:300+p.y*1000}),figure:30,scale:1000};
  const battle={id:'engineering-proof',phase:'x',minute:0,live:true,over:false,lines:[],formations:[],members:[],fallen:[],
   sides:[{side,name:side,count:8,drawn:8,style:'ranks',fire:'none',action:'work',moving:false,x:0,y:0,facing:{x:1,y:0}}]};
  view.draw(ctx,battle,{camera,time:1000,now:1000,tickMs:1000,bounds:{width:1000,height:700}});
  assert.ok(drawn.includes(expected),`${side}: ${drawn}`);
 }
});


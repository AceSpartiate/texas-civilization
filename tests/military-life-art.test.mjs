import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/military-life-2026-10-03.mjs';
import {createBattleView} from '../public/battle-view.js';

test('military life delivery retains every silhouette and registers all authored animation frames',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.equal(Object.values(SHEETS).flat().length,84);assert.equal(Object.keys(ANIMATION_CLIPS).length,20);
 for(const [sheet,names] of Object.entries(SHEETS)) {
  assert.ok(atlas.sheets[sheet].alpha.transparentFraction>.25);
  assert.ok(atlas.sheets[sheet].alpha.cornerAlpha.every(a=>a<24));
  for(const name of names) {const f=atlas.frames[name];assert.equal(f.sheet,sheet);assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
 for(const clip of Object.values(ANIMATION_CLIPS)) {assert.ok(new Set(clip.frames.map(f=>f.sprite)).size>=2);for(const f of clip.frames) {assert.ok(atlas.frames[f.sprite]);assert.ok(f.duration>0);}}
});

test('living wounded use side-appropriate bearers and mounted dragoons remain mounted',()=>{
 for(const [side,style,expected] of [['texian','loose','bearers-carry'],['mexican','ranks','regular-bearers-carry'],['mexican','mounted','dragoon-wounded-led']]) {
  const drawn=[];
  const art={animated:(_c,clip,_x,_y,size)=>{drawn.push(clip);return size;},drawSprite:()=>30,miniPerson:()=>{}};
  const ctx=new Proxy({measureText:()=>({width:0})},{get:(o,k)=>o[k]||(()=>{})});
  const view=createBattleView(art),camera={toScreen:p=>({x:400+p.x*1000,y:300+p.y*1000}),figure:30,scale:1000};
  const battle=minute=>({id:'transport-proof',phase:'x',minute,live:true,over:false,lines:[],formations:[],members:[],
   sides:[{side,name:side,count:8,drawn:8,style,fire:'none',action:'stand',moving:false,x:0,y:0,facing:{x:1,y:0}}],
   fallen:minute?[{side,count:1,minute:1,wounded:true}]:[]});
  for(const t of [0,1000,2000]) view.draw(ctx,battle(t/1000),{camera,time:t,now:t,tickMs:1000,bounds:{width:1000,height:700}});
  assert.ok(drawn.includes(expected),`${side}/${style}: ${drawn}`);
 }
});

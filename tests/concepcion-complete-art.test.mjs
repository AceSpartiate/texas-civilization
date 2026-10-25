import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/concepcion-complete-2026-10-12.mjs';
import {CONCEPCION} from '../sim/battles/concepcion.mjs';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url))),animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
test('all thirty-one final Concepcion frames retain complete transparent silhouettes',()=>{
 const names=Object.values(SHEETS).flat();assert.equal(names.length,31);
 for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1);assert.equal(f.audit.trimmedPixels,0);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
});
test('all seven authored loops have four registered phases and stable display scale',()=>{
 assert.equal(Object.keys(ANIMATION_CLIPS).length,7);
 for(const [n,c]of Object.entries(ANIMATION_CLIPS)){assert.equal(c.authored,true);assert.equal(c.loop,true);assert.equal(c.frames.length,4);assert.deepEqual(animation.clips[n].frames,c.frames);assert.equal(new Set(c.frames.map(f=>atlas.frames[f.sprite].logicalHeight)).size,1);}
});
test('live scenery replaces bank and mission placeholders while retaining geographic course and unloaded-art fallbacks',()=>{
 const ground={bend:{x:0,y:0},mission:{x:1,y:2}},items=CONCEPCION.scenery(ground);
 const banks=items.filter(i=>i.sprite==='riverbank-cut-e');assert.equal(banks.length,9);assert.ok(banks.every(i=>i.fallbackSprite==='earth-rampart'));
 const mission=items.find(i=>i.sprite==='mission-concepcion');assert.deepEqual([mission.x,mission.y,mission.size],[1,2,4.5]);assert.equal(mission.fallbackSprite,'church-generic');
 assert.equal(items.filter(i=>i.water).length,1);assert.equal(items.find(i=>i.water).water.length,5);
 // The whole-bend illustration needs future authoritative registration; the mules, padre and carts are phase groups (below), not scenery.
 assert.ok(items.every(i=>!String(i.clip||'').startsWith('casualty-cart')&&!String(i.clip||'').startsWith('limber-mules')));
});

// Staged 2026-10-25 (batch W of docs/ART_PLAN_LOCAL_2026-10-25.md): her mule riders only in the retreat, riding off toward Béxar,
// three of the six (`HIST-TEX-480`); her padre and carts only in `main-army` (`HIST-TEX-481`), townspeople the engine never lets
// fire or fall, walking down from the ford and then standing at the line; nowhere else. Drawn by the one renderer.
test('the second gun\'s mules ride off in the retreat, and the priest and his carts come for the dead and wounded after',async()=>{
 const {createBattleView}=await import('../public/battle-view.js');
 const {phaseOffset,projectBattle,checkEngagement}=await import('../sim/battle-stage.mjs');
 checkEngagement(CONCEPCION);
 const world=minute=>({minute,map:{sites:{bexar:{x:0,y:0}}},battles:{concepcion:{id:'concepcion',start:0,participants:{},alerted:{},told:{},heard:{}}}});
 const ctx=new Proxy({globalAlpha:1,measureText:t=>({width:String(t).length*6}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
 const drawnAt=(phase,into)=>{
  const battle=projectBattle(world(phaseOffset(CONCEPCION,phase)+into),'concepcion',{}),drawn=[];
  const art={animated:(c,clip,x,y,size,seed,o)=>{drawn.push({clip,size,...o});return size;},drawSprite:(c,sprite,x,y,size,o)=>{drawn.push({sprite,size,...o});return size;},miniPerson(){}};
  if(!battle?.groups?.length)return {battle,drawn,last:null};
  const centre=battle.groups.find(g=>g.id==='bowie')||battle.groups[0];
  const camera={toScreen:p=>({x:683+(p.x-centre.x)*900,y:384+(p.y-centre.y)*900}),figure:40,scale:900};
  const view=createBattleView(art);let last;
  for(let t=0;t<2000;t+=100)last=view.draw(ctx,battle,{camera,time:t,now:t,tickMs:1000,bounds:{width:1366,height:768}});
  return {battle,drawn,last};
 };
 const names=d=>d.map(one=>one.clip||one.sprite);
 const retreat=drawnAt('retreat',5);
 assert.ok(names(retreat.drawn).includes('limber-mules-walk-n'),'the mules do not ride off north toward Béxar in the retreat');
 assert.equal(retreat.battle.groups.find(g=>g.id==='gun-mules').drawn,3);
 assert.ok(!names(retreat.drawn).some(n=>/^(padre|casualty-cart)/.test(n)),'the priest or his carts are on the field in the fight');
 const coming=drawnAt('main-army',8);
 for(const clip of ['padre-walk','casualty-cart-wounded','casualty-cart-covered'])assert.ok(names(coming.drawn).includes(clip),`${clip} is not drawn coming down from the ford`);
 for(const g of ['padre','carts'])assert.equal(coming.battle.groups.find(one=>one.id===g).civilians,true);
 const standing=drawnAt('main-army',25);
 for(const sprite of ['padre-walk-1','casualty-cart-wounded-1','casualty-cart-covered-1'])assert.ok(names(standing.drawn).includes(sprite),`${sprite} is not held standing at the line`);
 for(const [phase,into]of [['charges',5],['aftermath',10],['burial',10]])assert.ok(!names(drawnAt(phase,into).drawn).some(n=>/^(limber-mules|padre|casualty-cart)/.test(n)),`${phase} stages the aftercare or the mules`);
});

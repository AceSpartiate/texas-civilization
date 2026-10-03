import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeRgba} from '../scripts/build-atlas-manifest.mjs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/grass-fight-mules-2026-10-03.mjs';
test('mule frames retain true alpha and every measured object without overlap',()=>{
 const root=new URL('../public/assets/frontier-v1/',import.meta.url),atlas=JSON.parse(readFileSync(new URL('atlas.json',root)));
 for(const [sheet,names] of Object.entries(SHEETS)){
  const metadata=atlas.sheets[sheet];assert.ok(metadata.alpha.transparentFraction>.5);
  const image=decodeRgba(readFileSync(new URL('atlases/'+sheet+'.png',root)));
  assert.equal(image.data[3],0);
  for(const name of names){const f=atlas.frames[name];assert.ok(f);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
 }
});

import {createBattleView} from '../public/battle-view.js';
test('Grass Fight train selects directional mules and reveals grass only in the opening phase',()=>{
 const noop=()=>{},ctx=new Proxy({globalAlpha:1,measureText:t=>({width:String(t).length*6})},{get:(o,k)=>k in o?o[k]:noop});
 const camera={toScreen:p=>({x:300+p.x*1000,y:300+p.y*1000}),figure:30,scale:1000};
 for(const [moving,phase,dir,facing] of [[true,'road','e',{x:1,y:0}],[true,'road','s',{x:0,y:1}],[true,'road','n',{x:0,y:-1}],[false,'grass','e',{x:1,y:0}]]){
  const drawn=[],art={animated:(ctx,id)=>{drawn.push(id);return 30},drawSprite:(ctx,id)=>{drawn.push(id);return 30},miniPerson:noop};
  const battle={id:'grass-fight',phase,minute:1,live:true,over:false,sides:[{key:'train',side:'mexican',name:'train',count:2,drawn:2,style:'column',figure:'packhorse',fire:'none',action:moving?'advance':'stand',moving,x:0,y:0,facing}],lines:[],members:[],fallen:[]};
  createBattleView(art).draw(ctx,battle,{camera,time:500,now:500,tickMs:1000,bounds:{width:800,height:600}});
  assert.ok(drawn.includes(moving?`mule-packed-grass-walk-${dir}`:`mule-packed-grass-idle-${dir}`));
  assert.equal(drawn.includes('grass-bundle-cut'),phase==='grass');
  assert.ok(!drawn.includes('packed-belongings'));
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url)));
test('generic regular crowbar actions cover east, south and north with four-frame loops',()=>{
 const atlas=read('atlas'),animation=read('animation');
 for(const clipName of ['regular-crowbar','regular-crowbar-s','regular-crowbar-n']){const clip=animation.clips[clipName];assert.equal(clip.loop,true);assert.equal(clip.frames.length,4);assert.equal(new Set(clip.frames.map(f=>f.sprite)).size,4);for(const {sprite} of clip.frames){const f=atlas.frames[sprite];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);if(clipName!=='regular-crowbar')assert.equal(f.sheet,'regular-crowbar-vertical');}}
 assert.ok(atlas.sheets['regular-crowbar-vertical'].alpha.transparentFraction>.4);
});
test('named Karnes keeps his identity-specific crowbar art',()=>{const clip=read('animation').clips['karnes-crowbar-work'];assert.ok(clip.frames.every(f=>f.sprite.startsWith('karnes-')));});
import {createBattleView} from '../public/battle-view.js';
function breachRender(facing,missing=false,named=false, paused=false, reducedMotion=false){
 const calls=[];const art={animated:(ctx,clip,x,y,size,seed,options)=>{calls.push(clip);(calls.options ||= []).push({clip,...options});return missing&&clip.includes('crowbar')?0:size;},drawSprite:()=>1,miniPerson:()=>{}};
 const ctx=new Proxy({measureText:()=>({width:0}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]??(()=>{})}),view=createBattleView(art);
 const b={id:named?'bexar-storming':'proof',phase:named?'karnes':'work',minute:0,live:true,over:false,sides:[],members:[],fallen:[],lines:[],formations:[]},options={camera:{toScreen:()=>({x:300,y:300}),figure:40,scale:800},time:0,now:0,tickMs:1000,paused,reducedMotion};
 view.draw(ctx,b,options);view.draw(ctx,{...b,minute:1,breaches:[{x:0,y:0,at:1,side:'mexican',facing}],...(named?{people:[{id:'karnes',pose:'work',x:0,y:0}]}:{})},{...options,now:100,time:100});return calls;
}
test('generic breaches use authored crowbar directions instead of gun ramming',()=>{for(const direction of ['e','s','n'])assert.ok(breachRender(direction).includes(`regular-crowbar${direction==='e'?'':`-${direction}`}`));assert.ok(!breachRender('s').includes('regular-gun-ram'));});
test('missing crowbar art retains gun-ram fallback and named Karnes suppresses the generic worker',()=>{assert.ok(breachRender('s',true).includes('regular-gun-ram'));assert.ok(!breachRender('s',false,true).includes('regular-crowbar-s'));});

test('paused and reduced-motion battles hold the regular crowbar cycle',()=>{for(const [paused,reducedMotion] of [[true,false],[false,true]]){const calls=breachRender('n',false,false,paused,reducedMotion);assert.equal(calls.options.find(c=>c.clip==='regular-crowbar-n').paused,true);}});

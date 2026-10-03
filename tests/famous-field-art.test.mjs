import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PERSON_ART,createBattleView} from '../public/battle-view.js';
const camera={toScreen:p=>({x:300+p.x*1000,y:300+p.y*1000}),figure:30,scale:1000};
function render(person){
 const drawn=[],noop=()=>{},ctx=new Proxy({globalAlpha:1,measureText:t=>({width:String(t).length*6})},{get:(o,k)=>k in o?o[k]:noop});
 const art={animated:(ctx,clip,x,y,size,seed,options)=>{drawn.push({clip,...options});return size;},drawSprite:()=>30,miniPerson:noop};
 createBattleView(art).draw(ctx,{id:'field-proof',phase:'march',minute:1,live:true,over:false,sides:[],lines:[],members:[],fallen:[],people:[person]}, {camera,time:350,now:350,tickMs:1000,wind:{x:0,y:0},bounds:{width:800,height:600}});
 return drawn;
}
test('named foot cardinal cycles use projected headings without mirroring north and south',()=>{
 for(const id of ['travis','crockett','bowie','fannin','milam','ben'])for(const [heading,dir] of [['north','n'],['south','s']]){
  const drawn=render({id,art:id,name:id,side:'texian',x:0,y:0,right:false,moving:true,pose:'walk',heading});
  assert.ok(drawn.some(c=>c.clip===`${id}-foot-walk-${dir}-v2`&&c.flip===false),`${id} ${heading}`);
 }
});
test('field commanders select their own authored gestures and preserve special scene poses',()=>{
 for(const id of ['neill','karnes','hockley','lamar','sherman','rusk']){
  assert.equal(PERSON_ART[id].speak,`clip:${id}-field-conversation`);
  assert.ok(render({id,art:id,name:id,side:'texian',x:0,y:0,right:true,moving:false,pose:'command'}).some(c=>c.clip===`${id}-field-command`));
 }
 assert.equal(PERSON_ART.rusk.stop,'clip:rusk-stop');
 assert.equal(PERSON_ART.karnes.work,'clip:karnes-crowbar-work');
 assert.equal(PERSON_ART.lamar.rideRescue,'lamar-mounted-rescue-e');
 assert.equal(PERSON_ART.sherman.rideRally,'sherman-mounted-rally-e');
});
test('every new field clip is inventoried with two usable authored frames',()=>{
 const root=new URL('../public/assets/frontier-v1/',import.meta.url),atlas=JSON.parse(readFileSync(new URL('atlas.json',root))),animation=JSON.parse(readFileSync(new URL('animation.json',root))).clips;
 for(const id of ['travis','crockett','bowie','fannin','milam','ben'])for(const dir of ['n','s'])check(`${id}-foot-walk-${dir}-v2`);
 for(const id of ['neill','karnes','hockley','lamar','sherman','rusk'])for(const pose of ['command','conversation'])check(`${id}-field-${pose}`);
 function check(id){const clip=animation[id];assert.ok(clip?.authored,id);assert.equal(clip.frames.length,2);for(const frame of clip.frames)assert.ok(atlas.frames[frame.sprite],frame.sprite);}
});

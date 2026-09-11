import test from 'node:test';
import assert from 'node:assert/strict';
import {ALAMO_LAYOUT as layout,createDamageState,damageWall,isWalkable,findPath,moveActor,pathLength,roomCenter} from '../public/alamo-layout.js';
test('complete compound has consistent foot scale and every room is reachable through its openings',()=>{
  assert.equal(layout.units,'ft');assert.equal(layout.referenceHeightFeet,5.7);
  assert.equal(layout.dimensions.northWallFeet,243.75);
  assert.equal(layout.dimensions.longBarrackWidthFeet,19+11/12);
  assert.ok(layout.rooms.length>=30);assert.ok(!layout.roofs.some(r=>r.roomId==='church-nave'));
  const state=createDamageState();
  for(const room of layout.rooms){const path=findPath({x:115,y:480},roomCenter(room),state);assert.ok(path,room.id);
    for(let d=0;d<pathLength(path);d+=.5){const actor=moveActor({id:'same-person'},path,d);assert.equal(actor.id,'same-person');assert.ok(isWalkable(actor,state),`${room.id} crosses a wall at ${actor.x},${actor.y}`);}
  }
});
test('north-wall damage persists independently and a breach opens an actual passage',()=>{
  const state=createDamageState(),wall=layout.walls.find(w=>w.id==='north-4'),p={x:(wall.a.x+wall.b.x)/2,y:(wall.a.y+wall.b.y)/2};
  assert.equal(isWalkable(p,state),false);damageWall(state,wall.id,55);assert.equal(isWalkable(p,state),false);
  damageWall(state,wall.id,45);assert.equal(isWalkable(p,state),true);assert.equal(state.walls['north-3'],100);
  const reloaded=JSON.parse(JSON.stringify(state));assert.equal(isWalkable(p,reloaded),true);
  const path=findPath({x:p.x,y:p.y-7},{x:p.x,y:p.y+7},reloaded);assert.ok(pathLength(path)<22);
  assert.throws(()=>damageWall(state,'west-perimeter',100));
});

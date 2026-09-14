import test from 'node:test';
import assert from 'node:assert/strict';
import {collapsePose,COLLAPSE_DURATION_MS} from '../public/alamo-collapse.js';
test('collapse remains an obstacle through the breaking poses and finishes once, without looping',()=>{
  assert.deepEqual([0,300,650,1199,1200,10000].map(t=>collapsePose(t)),[
    {sprite:'alamo-wall-intact',complete:false},{sprite:'alamo-wall-cracked',complete:false},
    {sprite:'alamo-wall-breach',complete:false},{sprite:'alamo-wall-breach',complete:false},
    {sprite:'alamo-wall-rubble',complete:true},{sprite:'alamo-wall-rubble',complete:true}]);
  assert.equal(COLLAPSE_DURATION_MS,1200);
});
test('reduced motion goes directly to the final rubble, never an intact wall over an opening',()=>{
  assert.deepEqual(collapsePose(0,true),{sprite:'alamo-wall-rubble',complete:true});
});

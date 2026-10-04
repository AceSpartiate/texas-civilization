import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesOffer,errandList} from '../public/errand.js';
test('shop browsing filters never change the shopping list and hide unavailable unselected offers',()=>{
 const lines=[{id:'store:seed',kind:'buy',trade:'store',shop:'General store',label:'Buy seed'},
  {id:'store:food',kind:'sell',trade:'store',shop:'General store',label:'Sell food'},
  {id:'doctor:treat',kind:'service',trade:'doctor',shop:'Doctor',label:'Treatment',why:'Already well'}];
 const counts=new Map([['store:seed',2]]);
 assert.deepEqual(lines.filter(l=>matchesOffer(l,{filter:'sell'})).map(l=>l.id),['store:food']);
 assert.equal(matchesOffer(lines[0],{search:' SEED ',shop:'store'}),true);
 assert.equal(matchesOffer(lines[0],{shop:'doctor'}),false);
 assert.equal(matchesOffer(lines[2]),false);
 assert.equal(matchesOffer({...lines[2],selected:true}),true);
 assert.deepEqual(errandList(lines,counts,new Map()),[{id:'store:seed',n:2}]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesOffer,errandList} from '../public/errand.js';
// `kind` is the server's, the shop's side of the trade (sim/shops.mjs, sim/errands.mjs `errandOffers`): the store that
// sells seed is where the family buys it, under the Buy filter. Fixed at the 2026-10-04 merge, when the filters first
// compared the student's word with the shop's kind directly.
test('shop browsing filters never change the shopping list and hide unavailable unselected offers',()=>{
 const lines=[{id:'store:seed',kind:'sell',trade:'store',shop:'General store',label:'Buy seed'},
  {id:'store:food',kind:'buy',trade:'store',shop:'General store',label:'Sell food'},
  {id:'miller:grind',kind:'service',trade:'miller',shop:'Mill',label:'Have corn ground to meal',why:'No corn to grind'}];
 const counts=new Map([['store:seed',2]]);
 assert.deepEqual(lines.filter(l=>matchesOffer(l,{filter:'sell'})).map(l=>l.id),['store:food']);
 assert.deepEqual(lines.filter(l=>matchesOffer(l,{filter:'buy'})).map(l=>l.id),['store:seed']);
 assert.deepEqual(lines.filter(l=>matchesOffer({...l,selected:true},{filter:'service'})).map(l=>l.id),['miller:grind']);
 assert.equal(matchesOffer(lines[0],{search:' SEED ',shop:'store'}),true);
 assert.equal(matchesOffer(lines[0],{shop:'miller'}),false);
 assert.equal(matchesOffer(lines[2]),false);
 assert.equal(matchesOffer({...lines[2],selected:true}),true);
 assert.deepEqual(errandList(lines,counts,new Map()),[{id:'store:seed',n:2}]);
});

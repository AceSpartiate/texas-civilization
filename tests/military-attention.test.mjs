import test from 'node:test';
import assert from 'node:assert/strict';
import { militaryNotices } from '../public/military-attention.js';
const person={id:'p',householdId:'h',name:'Elena',service:{status:'serving',besieged:true}};
const view=(entities=[person])=>({role:'student',householdId:'h',entities});
test('military invitations expose only the owning household and no sealed outcome',()=>{
 const w=view([{...person,householdId:'other'}]);assert.deepEqual(militaryNotices(w),[]);
 assert.deepEqual(militaryNotices({...view(),role:'host'}),[]);
 assert.equal(militaryNotices(view([{...person,service:{...person.service,fate:'fell'}}]))[0].kind,'siege');
 assert.doesNotMatch(JSON.stringify(militaryNotices(view())),/killed|victory|March 6/);
});
test('a real rider invitation withholds its message until the player listens',()=>{
 const w=view();w.encounter={id:'e',status:'open',listenerId:'p',secret:'The Alamo fell'};
 const notice=militaryNotices(w)[0];assert.equal(notice.kind,'rider');assert.doesNotMatch(notice.text,/fell/);
 w.encounter.listenerId='stranger';assert.ok(militaryNotices(w).every(n=>n.kind!=='rider'));
});
test('an Alamo decision precedes a passive siege reminder and closes with the projected question',()=>{
 const w=view([{...person,id:'q'}, {...person,service:{...person.service,courier:'open'}}]);
 assert.equal(militaryNotices(w)[0].kind,'courier');
 delete w.entities[1].service.courier;assert.equal(militaryNotices(w)[0].kind,'siege');
 w.entities[1].health={condition:'dead'};assert.ok(militaryNotices(w).every(n=>n.entityId!=='p'));
});
test('army and Houston requests have distinct queue entries',()=>{
 const w=view([{...person,service:{status:'serving',road:'open'}}]);assert.equal(militaryNotices(w)[0].kind,'orders');
 w.entities[0].service={status:'serving'};w.army={ours:[{id:'p',questions:[{key:'clothing',answer:'open'}]}]};
 assert.match(militaryNotices(w)[0].id,/clothing/);
 w.army.ours[0].questions[0].answer='yes';assert.equal(militaryNotices(w).length,0);
});
test('Travis\'s runner standing with the person is one invitation that names him and says what happens if nobody answers',()=>{
 const w=view([{...person,service:{...person.service,courier:'open'}}]);
 w.encounter={id:'e',kind:'alamo-runner',status:'open',listenerId:'p',carrierName:'Asa Linthicum',ifUnanswered:'If nobody answers in time, it will be decided for Elena, as a person on auto decides.'};
 const notices=militaryNotices(w);
 assert.equal(notices.length,1,'the runner and the question were shown as two invitations');
 assert.equal(notices[0].kind,'courier');assert.match(notices[0].text,/Asa Linthicum/);assert.match(notices[0].text,/decided for Elena/);
 w.entities[0].service.courier='coming';delete w.encounter;
 assert.match(militaryNotices(w)[0].title,/runner is coming/);
});

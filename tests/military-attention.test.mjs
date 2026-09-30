import test from 'node:test';
import assert from 'node:assert/strict';
import { EYEBROWS, ICONS, MOMENTS, URGENT, militaryNotices } from '../public/military-attention.js';
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
 w.encounter={id:'e',kind:'alamo-runner',status:'open',listenerId:'p',carrierName:'Asa Linthicum',ifUnanswered:'If nobody answers in time, the question lapses: nothing is chosen, and Elena stays at their post.'};
 const notices=militaryNotices(w);
 assert.equal(notices.length,1,'the runner and the question were shown as two invitations');
 assert.equal(notices[0].kind,'courier');assert.match(notices[0].text,/Asa Linthicum/);assert.match(notices[0].text,/nothing is chosen, and Elena stays at their post/);
 w.entities[0].service.courier='coming';delete w.encounter;
 assert.match(militaryNotices(w)[0].title,/runner is coming/);
});

// The family's other big moments, in the story cards' frame (owner, 2026-09-29: "use that same style as the alert for when a family
// member is going through a major event like a battle"): ¡Alto!, the road, the order to leave, the call and somebody very sick.
const home = (extra = {}) => ({ role: 'student', householdId: 'h', household: { members: ['p', 'k'], principalId: 'p' },
  entities: [{ id: 'p', householdId: 'h', name: 'Elena Ruiz', given: 'Elena', kind: 'person', kin: { role: 'mother' } }, { id: 'k', householdId: 'h', name: 'Rosa Ruiz', given: 'Rosa', kind: 'person', kin: { role: 'daughter' } }], ...extra });
test('the family\'s big moments are cards of their own kind, ¡Alto! first, each with its time left, and the Watch card still held back', () => {
  const alert = { id: 'alert-1', entityId: 'p', title: 'The fight', text: 'At Elena\'s side.', action: 'Watch' };
  // ¡Alto!: the most urgent thing in the game, over the Watch card.
  let w = home({ flight: { status: 'fled', ask: { id: 'alto', text: 'Soldiers shout ¡Alto!', leftMs: 30000 } }, battleAlert: alert });
  let notices = militaryNotices(w);
  assert.equal(notices[0].kind, 'alto'); assert.equal(notices[0].leftMs, 30000); assert.equal(notices[0].title, MOMENTS.alto.title());
  assert.ok(notices.every(one => one.kind !== 'battle'), 'the Watch card went up over ¡Alto!');
  // And over the settlement's call and a rider at the gate, which wait longer.
  w.request = { id: 'call-0', kind: 'call', status: 'open', answerers: { p: [{ id: 'turn-out' }] } };
  w.encounter = { id: 'e', status: 'open', listenerId: 'k' };
  assert.deepEqual(militaryNotices(w).map(one => one.kind).slice(0, 3), ['alto', 'call', 'rider'], '¡Alto! is not the first card');
  // The order to leave, over the Watch card too.
  w = home({ flight: { status: 'ordered', leftMs: 180000 }, battleAlert: alert });
  notices = militaryNotices(w);
  assert.equal(notices[0].kind, 'flight'); assert.equal(notices[0].leftMs, 180000); assert.ok(notices.every(one => one.kind !== 'battle'));
  // The settlement's call to arms: one card for the family, however many may answer it.
  w = home({ request: { id: 'call-1', kind: 'call', status: 'open', answerers: { p: [{ id: 'turn-out' }], k: [{ id: 'turn-out' }] }, leftMs: 90000 } });
  notices = militaryNotices(w);
  assert.equal(notices.filter(one => one.kind === 'call').length, 1, 'the call was put up once for every person who may answer it');
  assert.equal(notices[0].title, 'A call to arms');
  // Somebody very sick: a card, after the fight and before its account - and never a reason to hold the Watch card back.
  w = home({ entities: [{ ...home().entities[0], sickness: { grave: true, line: 'very sick with the measles.' } }], battleAlert: alert });
  notices = militaryNotices(w);
  assert.deepEqual(notices.map(one => one.kind), ['battle', 'sick'], 'a sickness held back the Watch card, or came before it');
  assert.equal(notices[1].title, 'Elena is very sick');
  // Every kind has its eyebrow and its icon.
  for (const kind of ['alto', 'road', 'flight', 'call', 'sick', 'rider', 'courier', 'orders', 'battle', 'account', 'siege']) {
    assert.ok(EYEBROWS[kind], `${kind} has no eyebrow`); assert.ok(ICONS[kind], `${kind} has no icon`);
  }
});
test('the army\'s rider and every question with a clock are the ones that will not wait, which the town\'s scene and the rooms make way for; a fight, its account and the siege are not (triage 2026-09-29, 2.2)', () => {
  // The rider standing with the family's own person: the ninety-second question a student in town never saw.
  const rider = militaryNotices(home({ encounter: { id: 'e', status: 'open', listenerId: 'k' } }));
  assert.equal(rider[0].kind, 'rider');
  assert.ok(URGENT.has(rider[0].kind), 'the army\'s rider is not counted a question that will not wait');
  for (const kind of ['alto', 'road', 'flight', 'call', 'rider', 'courier', 'orders', 'sick']) assert.ok(URGENT.has(kind), `${kind} is not counted a question that will not wait`);
  for (const kind of ['battle', 'account', 'siege']) assert.ok(!URGENT.has(kind), `${kind} would move the rooms aside, and it asks nothing`);
  assert.ok([...URGENT].every(kind => EYEBROWS[kind]), 'a kind that will not wait is no card kind');
});

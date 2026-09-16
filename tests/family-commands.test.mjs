// Commands from the family panel: docs/FAMILY_PANEL.md §11 (owner, 2026-09-16).
//
// "If they need my attention (for example a rider is trying to talk to them) then there should be an exclamation point
// there for me to click on." The "!" is read from the student's own projection by `needsOf` (public/family-panel.js), so
// each kind of need is made here the way the world makes it, and checked three ways: the "!" is on the right person, it is
// on nobody who is not waited on, and it goes the moment the answer is given. And a family is never shown another family's
// needs, because the only thing the rule reads is what the server sent that family. Idleness and the main person are
// checked here too; what only a browser shows is scripts/family-commands-browser-proof.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, dispatchReport, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { createSettledWorld } from './support/settled.mjs';
import { choreCatalogue } from '../sim/chores.mjs';
import { mainPersonId } from '../sim/family.mjs';
import { NEED_KINDS, callMenu, callPlan, focusFor, isIdle, needsOf, panelActions } from '../public/family-panel.js';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const catalogue = new Map(choreCatalogue().map(chore => [chore.id, chore]));
/** Who on this family's panel has an "!", and for what. */
const marked = (world, householdId) => {
  const seen = view(world, householdId);
  return Object.fromEntries(world.households[householdId].members.map(id => [id, needsOf(seen, id).map(need => need.kind)]).filter(([, kinds]) => kinds.length));
};

test('an offer made to one of the family puts an "!" on them alone, the family that made it has none, and answering clears it', () => {
  const world = createGonzalesWorld('commands-offer', 5);
  world.status = 'running';
  const town = world.map.sites.gonzales;
  for (const id of ['hh-1-thomas', 'hh-2-elena']) Object.assign(world.entities[id], { travel: null, chore: null, location: { x: town.x, y: town.y, siteId: 'gonzales' } });
  validateWorld(world);
  world.households['hh-2'].resources.seed = 6;
  applyAction(world, 'hh-2', { action: 'offer', entityId: 'hh-2-elena', toEntityId: 'hh-1-thomas', give: { seed: 2 }, ask: { food: 3 } });
  assert.deepEqual(marked(world, 'hh-1'), { 'hh-1-thomas': ['offer'] });
  assert.match(needsOf(view(world, 'hh-1'), 'hh-1-thomas')[0].text, /offered .* a trade/);
  assert.deepEqual(marked(world, 'hh-2'), {}, 'the family that made the offer is not waiting on itself');
  // Another family's projection says nothing about hh-1's people, so nothing can be marked on them from it.
  assert.deepEqual(needsOf(view(world, 'hh-2'), 'hh-1-thomas'), [], 'a family is shown another family’s need');
  const offerId = view(world, 'hh-1').offers[0].id;
  applyAction(world, 'hh-1', { action: 'decline-offer', entityId: 'hh-1-thomas', offerId });
  assert.deepEqual(marked(world, 'hh-1'), {}, 'the "!" stayed after the offer was answered');
});

test('a rider standing with somebody is an "!" on that one person, and letting the rider go clears it', () => {
  const world = createGonzalesWorld('commands-rider', 5);
  world.status = 'running';
  for (const id of Object.keys(world.households)) world.director.dispatches[id] = true;
  while (!world.truth['cannon-request']) stepWorld(world);
  dispatchReport(world, 'cannon-request', 'hh-1');
  const open = () => Object.values(world.encounters).find(e => e.householdId === 'hh-1' && e.status === 'open');
  for (let i = 0; i < 400 && !open(); i++) stepWorld(world);
  const encounter = open();
  assert.ok(encounter, 'no rider ever met the family');
  const needs = marked(world, 'hh-1');
  assert.deepEqual(needs[encounter.listenerId]?.[0], 'rider', `the rider is not the listener's first need: ${JSON.stringify(needs)}`);
  for (const [id, kinds] of Object.entries(needs)) if (id !== encounter.listenerId) assert.ok(!kinds.includes('rider'), `${id} is marked for a rider who stopped for somebody else`);
  for (const other of ['hh-2', 'hh-3']) assert.deepEqual(needsOf(view(world, other), encounter.listenerId), []);
  applyAction(world, 'hh-1', { action: 'leave-rider', entityId: encounter.listenerId });
  assert.ok(!(marked(world, 'hh-1')[encounter.listenerId] || []).includes('rider'), 'the "!" for the rider stayed after they rode on');
});

test('work that stops to ask is an "!" on the person doing it, until it is answered', () => {
  const world = createSettledWorld('commands-ask', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  household.resources.powder = 6;
  const offered = view(world, 'hh-1').work;
  const hunter = household.members.find(id => offered[id]?.some(entry => entry.id === 'hunt-timber' && entry.can));
  assert.ok(hunter, 'nobody may hunt, so this test would prove nothing');
  applyAction(world, 'hh-1', { action: 'chore', entityId: hunter, chore: 'hunt-timber' });
  for (let i = 0; i < 400 && !world.entities[hunter].chore?.ask && world.entities[hunter].chore; i++) {
    assert.ok(!(marked(world, 'hh-1')[hunter] || []).includes('asking'), 'marked before the work asked anything');
    stepWorld(world);
  }
  const ask = world.entities[hunter].chore?.ask;
  assert.ok(ask, 'the hunt never stopped to ask');
  assert.ok(marked(world, 'hh-1')[hunter].includes('asking'));
  applyAction(world, 'hh-1', { action: 'answer-chore', entityId: hunter, option: ask.options.at(-1).id });
  assert.equal(world.entities[hunter].chore?.ask ?? null, null, `the answer ${ask.options.at(-1).id} left the question open`);
  assert.ok(!(marked(world, 'hh-1')[hunter] || []).includes('asking'), 'still marked after the answer');
});

test('a call and an army question are "!"s on whoever may answer them, and nothing once answered', () => {
  const entity = { id: 'a', name: 'Asa', kind: 'person' };
  const call = { status: 'open', text: 'A neighbour is at the door.', answerers: { a: [{ id: 'help', can: true }] } };
  assert.deepEqual(needsOf({ entities: [entity, { id: 'b', name: 'Bea' }], request: call }, 'a').map(need => need.kind), ['call']);
  assert.deepEqual(needsOf({ entities: [entity, { id: 'b', name: 'Bea' }], request: call }, 'b'), [], 'somebody who may not answer is marked');
  assert.deepEqual(needsOf({ entities: [entity], request: { ...call, status: 'accepted' } }, 'a'), []);
  const army = answer => ({ ours: [{ id: 'a', name: 'Asa', questions: [{ key: 'storm', answer }] }] });
  assert.deepEqual(needsOf({ entities: [entity], army: army('open') }, 'a').map(need => need.kind), ['army']);
  assert.deepEqual(needsOf({ entities: [entity], army: army('yes') }, 'a'), []);
  assert.deepEqual(needsOf({ entities: [entity], army: { ours: [{ id: 'a', detachment: 'open' }] } }, 'a').map(need => need.kind), ['army']);
  // Nothing about what an answer risks, which the owner hid (docs/COLONIES.md §7a).
  assert.doesNotMatch(needsOf({ entities: [entity], army: army('open') }, 'a')[0].text, /kill|die|death|danger|risk|wound/i);
  // The most pressing first: a rider who will not wait, then the army, Travis asking for riders, a call, work asking, an offer.
  const everything = {
    entities: [{ ...entity, chore: { ask: { id: 'shot' } }, service: { kind: 'garrison', status: 'serving', besieged: true, courier: 'open' } }], request: call, army: army('open'),
    encounter: { status: 'open', listenerId: 'a', carrierName: 'Ben' }, offers: [{ direction: 'received', ourEntityId: 'a', theirName: 'Cy' }],
  };
  assert.deepEqual(needsOf(everything, 'a').map(need => need.kind), NEED_KINDS);
  // The Host is never waited on, and the dead and captured are not asked anything.
  assert.deepEqual(needsOf({ ...everything, role: 'host' }, 'a'), []);
  assert.deepEqual(needsOf({ ...everything, entities: [{ ...everything.entities[0], health: { condition: 'dead' } }] }, 'a'), []);
});

test('the call a real class puts to a family marks the people who may answer it, and nobody after it is answered', () => {
  const world = createGonzalesWorld('commands-call', 5);
  world.status = 'running';
  for (let i = 0; i < 3000 && world.requests?.['hh-1']?.status !== 'open'; i++) stepWorld(world);
  const seen = view(world, 'hh-1');
  assert.equal(seen.request?.status, 'open', 'the class never asked hh-1 anything');
  const answerers = Object.keys(seen.request.answerers || {});
  assert.ok(answerers.length, 'nobody may answer');
  const needs = marked(world, 'hh-1');
  for (const id of world.households['hh-1'].members) assert.equal((needs[id] || []).includes('call'), answerers.includes(id), `${id}: marked ${needs[id]} but answerer ${answerers.includes(id)}`);
  const [who] = answerers;
  const stay = seen.request.answerers[who].find(option => option.can && /stay/.test(option.id)) || seen.request.answerers[who].find(option => option.can);
  applyAction(world, 'hh-1', { action: stay.id, entityId: who });
  assert.ok(Object.values(marked(world, 'hh-1')).every(kinds => !kinds.includes('call')), 'a call answered still marks somebody');
});

test('idle is somebody who could be set to something and is not: not a child, not the army, not the busy', () => {
  const open = [{ key: 'rest', can: true }], shut = [{ key: 'plant-field', can: false, why: 'Too young.' }];
  assert.equal(isIdle({ id: 'a', task: 'rest' }, open), true);
  assert.equal(isIdle({ id: 'a', task: 'rest' }, shut), false, 'a child with nothing they may do is idle');
  assert.equal(isIdle({ id: 'a', chore: { id: 'hunt-timber' } }, open), false);
  assert.equal(isIdle({ id: 'a', travel: { to: 'gonzales' } }, open), false);
  assert.equal(isIdle({ id: 'a', task: 'work' }, open), false, 'working about the place is working');
  assert.equal(isIdle({ id: 'a', task: 'help' }, open), false, 'helping where a call sent them is working');
  assert.equal(isIdle({ id: 'a', task: 'rest' }, open, { withArmy: true }), false);
  assert.equal(isIdle({ id: 'a', task: 'rest', health: { condition: 'dead' } }, open), false);
  // Against the real projection: a settled family standing about is idle until it is set to work, and then it is not.
  const world = createSettledWorld('commands-idle', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  const rows = () => {
    const seen = view(world, 'hh-1'), home = seen.household.homeSiteId;
    return Object.fromEntries(household.members.map(id => {
      const entity = seen.entities.find(one => one.id === id);
      const icons = panelActions({ entity, offered: seen.work[id], catalogue, main: id === household.principalId, homeId: home, atHome: entity.location?.siteId === home });
      return [id, isIdle(entity, icons)];
    }));
  };
  const worker = household.members.find(id => id !== household.principalId && view(world, 'hh-1').work[id]?.some(entry => entry.can));
  assert.ok(worker, 'nobody but the principal can be set to anything');
  household.resources.powder = 6;
  const chore = view(world, 'hh-1').work[worker].find(entry => entry.can && !['survey-plot', 'clear-plot', 'fence-plot', 'hunt-land', 'fell-trees'].includes(entry.id));
  // A family comes in off the road working about the place (sim/routines.mjs counts them): busy, not idle.
  assert.equal(world.entities[worker].task, 'work');
  assert.equal(rows()[worker], false, 'somebody working about the place is shown idle');
  applyAction(world, 'hh-1', { action: 'chore', entityId: worker, chore: chore.id });
  assert.equal(rows()[worker], false, `idle while at ${chore.id}`);
  // Called off, the server sets them resting: now there is nothing they are doing, and the row says so.
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: worker });
  assert.equal(rows()[worker], true, 'somebody left standing about is not shown idle');
  // And the principal told to rest is idle too; told to work about the place, not.
  applyAction(world, 'hh-1', { action: 'rest', entityId: household.principalId });
  assert.equal(rows()[household.principalId], true);
  applyAction(world, 'hh-1', { action: 'work', entityId: household.principalId });
  assert.equal(rows()[household.principalId], false);
});

// The main person is the server's (owner, 2026-09-16: "If any character (that's old enough) is selected as the main person
// (only one at a time) then they can be sent on travelling ... select the dad of the family as the main, send him off to war,
// then switch the main person to the mom so that I can have her take something into town").
test('the main person is held by the server: set-main chooses one at a time, and only they travel, rest and work about the place', () => {
  const world = createSettledWorld('commands-main', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  const [father, mother, daughter, son] = household.members;
  // Stated ages, so that "old enough" has somebody on each side of it (docs/FAMILY_CREATION.md §3).
  Object.assign(world.entities[daughter], { age: 17 }); Object.assign(world.entities[son], { age: 8 });
  validateWorld(world);
  assert.equal(household.mainId, undefined, 'a class that has chosen nobody holds a main person');
  // Sent only when the main person is not the principal: absent means the principal (and nothing new on the per-tick payload).
  assert.equal(view(world, 'hh-1').household.mainId, undefined, 'until one is chosen the main person is the principal, and rides on no tick');
  assert.equal(mainPersonId(world, household), father);
  // Chosen: the mother. The projection says so; the star's row is hers.
  applyAction(world, 'hh-1', { action: 'set-main', entityId: mother });
  assert.equal(household.mainId, mother);
  assert.equal(view(world, 'hh-1').household.mainId, mother);
  validateWorld(world);
  assert.equal(focusFor(view(world, 'hh-1').household.mainId, { order: household.members, principalId: father, entities: view(world, 'hh-1').entities }), mother);
  // Only the main person is asked to travel, work about the place or rest; the refusal is in words.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: father, destination: 'gonzales' }), /Only your main person can be asked that/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'work', entityId: daughter }), /Only your main person can be asked that/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'rest', entityId: father }), /Only your main person can be asked that/);
  applyAction(world, 'hh-1', { action: 'travel', entityId: mother, destination: 'gonzales' });
  assert.equal(world.entities[mother].travel?.to, 'gonzales', 'the main person could not be sent to town');
  // The panel offers the journeys on the main person's row and nobody else's, from the same field.
  const seen = view(world, 'hh-1'), home = seen.household.homeSiteId;
  const icons = id => panelActions({ entity: seen.entities.find(one => one.id === id), offered: seen.work[id], catalogue, main: id === seen.household.mainId, homeId: home }).map(icon => icon.key);
  assert.ok(icons(mother).includes('travel-home') && icons(mother).includes('rest'));
  assert.ok(!icons(father).includes('travel-gonzales') && !icons(father).includes('rest'), 'the principal keeps the journeys when somebody else is main');
  // One at a time: choosing the father again recalls nobody - the mother goes on to town.
  applyAction(world, 'hh-1', { action: 'set-main', entityId: father });
  assert.equal(household.mainId, father);
  assert.equal(world.entities[mother].travel?.to, 'gonzales', 'switching the main person interrupted her journey');
  for (let i = 0; i < 400 && world.entities[mother].travel; i++) stepWorld(world);
  assert.equal(world.entities[mother].location.siteId, 'gonzales', 'she never arrived');
  // Somebody away can be the main person: the army's questions are answered from them.
  applyAction(world, 'hh-1', { action: 'set-main', entityId: mother });
  assert.equal(view(world, 'hh-1').household.mainId, mother);
  applyAction(world, 'hh-1', { action: 'travel', entityId: mother, destination: home });
  assert.equal(world.entities[mother].travel?.to, home);
  applyAction(world, 'hh-1', { action: 'set-main', entityId: father });
  assert.equal(world.entities[mother].travel?.to, home, 'switching away from somebody on the road brought them back');
  // Refused in words: too young, and somebody who cannot act. The choice does not move.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'set-main', entityId: son }), /too young to be sent/);
  assert.equal(household.mainId, father);
  applyAction(world, 'hh-1', { action: 'set-main', entityId: daughter });
  assert.equal(household.mainId, daughter, 'a child of seventeen may be the main person');
  world.entities[daughter].health = { condition: 'captured' };
  assert.throws(() => applyAction(world, 'hh-1', { action: 'set-main', entityId: daughter }), /cannot act/);
  assert.throws(() => applyAction(world, 'hh-2', { action: 'set-main', entityId: father }), /Choose one of your family/);
  // The fallback when the main person is gone: the principal if they can act, else the oldest living member old enough.
  assert.equal(mainPersonId(world, household), father, 'a captured main person did not give way to the principal');
  assert.equal(view(world, 'hh-1').household.mainId, undefined, 'the principal as main person rides on the tick');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: daughter, destination: 'gonzales' }), /cannot act/);
  world.entities[daughter].health = { condition: 'well' };
  applyAction(world, 'hh-1', { action: 'set-main', entityId: daughter });
  world.entities[daughter].health = { condition: 'dead' };
  world.entities[father].health = { condition: 'dead' };
  assert.equal(view(world, 'hh-1').household.mainId, mother, 'with the main person and the principal dead, the oldest left who is old enough is main');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'work', entityId: son }), /too young/);
  world.entities[mother].health = { condition: 'dead' };
  assert.equal(view(world, 'hh-1').household.mainId, null, 'a child of eight is made the main person');
  // An older class: no field at all opens as the principal's, and a field naming a stranger is refused by validation.
  validateWorld(world);
  delete household.mainId;
  validateWorld(world);
  household.mainId = 'hh-2-thomas';
  assert.throws(() => validateWorld(world), /main person is not one of the family/);
  delete household.mainId;
});

test('the call’s one menu lists exactly who the server lets answer, and its confirm is one command per ticked person, else the keeping answer', () => {
  const go = (can, why = '') => ({ id: 'turn-out', label: 'Go: ride for Gonzales', note: 'takes 2 powder', can, why });
  const stay = (can, why = '') => ({ id: 'stay-put', label: 'Stay home', note: 'stays', can, why });
  const request = { id: 'call-1', kind: 'call', status: 'open', text: 'Does somebody from your family go?', answerers: { a: [go(true), stay(true)], b: [go(false, 'Wait until this person arrives.'), stay(false, 'Return home first.')], d: [go(true), stay(true)] } };
  const people = [{ id: 'a', role: 'father', age: 41 }, { id: 'b', role: 'son', age: 17 }, { id: 'c', role: 'daughter', age: 6 }, { id: 'd', role: 'mother', age: 38 }];
  const entities = [{ id: 'a', name: 'Asa' }, { id: 'b', name: 'Ben' }, { id: 'c', name: 'Cy' }, { id: 'd', name: 'Dora', health: { condition: 'dead' } }];
  const menu = callMenu(request, { people, entities });
  assert.deepEqual(menu.rows.map(row => row.id), ['a', 'b'], 'the menu lists somebody the server did not, or somebody dead');
  assert.equal(menu.rows[0].who, 'Father, 41');
  assert.deepEqual([menu.rows[0].go.can, menu.rows[1].go.can, menu.rows[1].go.why], [true, false, 'Wait until this person arrives.']);
  assert.equal(menu.several, true, 'a settlement’s call takes several');
  assert.equal(menu.stay.label, 'Stay home');
  assert.deepEqual(callPlan(menu, ['a', 'b']), [{ entityId: 'a', action: 'turn-out' }, { entityId: 'b', action: 'turn-out' }], 'in the menu’s order, one command each');
  assert.deepEqual(callPlan(menu, ['b', 'a']), [{ entityId: 'a', action: 'turn-out' }, { entityId: 'b', action: 'turn-out' }]);
  assert.deepEqual(callPlan(menu, [], 'b'), [{ entityId: 'a', action: 'stay-put' }], 'nobody ticked keeps everybody home, by somebody who may say so');
  assert.deepEqual(callPlan(menu, [], 'a'), [{ entityId: 'a', action: 'stay-put' }]);
  assert.deepEqual(callPlan(null, ['a']), []);
  // The food call, the rumour and the march are put to one person: the menu says so, and one tick is the most it sends.
  const supplies = { ...request, id: 'req-1', kind: 'supplies', answerers: { a: [{ id: 'help', label: 'Carry the food', note: '', can: true, why: '' }, { id: 'stay', label: 'Stay home and prepare', note: '', can: true, why: '' }] } };
  assert.equal(callMenu(supplies, { people, entities }).several, false);
  assert.deepEqual(callPlan(callMenu(supplies, { people, entities }), ['a']), [{ entityId: 'a', action: 'help' }]);
  assert.equal(callMenu({ ...request, status: 'accepted' }, { people, entities }), null, 'an answered call still has a menu');
  assert.equal(callMenu(null, { people, entities }), null);
  // Against the class: the menu is exactly the people the "!" marks for the call, and confirming it clears every "!".
  const world = createGonzalesWorld('commands-call', 5);
  world.status = 'running';
  for (let i = 0; i < 3000 && view(world, 'hh-1').request?.status !== 'open'; i++) stepWorld(world);
  const seen = view(world, 'hh-1');
  assert.equal(seen.request?.status, 'open', 'the class never asked hh-1 anything');
  const real = callMenu(seen.request, { people: seen.entities.map(entity => ({ id: entity.id, age: entity.age, role: entity.kin?.role })), entities: seen.entities });
  assert.deepEqual(real.rows.map(row => row.id).sort(), Object.keys(marked(world, 'hh-1')).filter(id => marked(world, 'hh-1')[id].includes('call')).sort());
  const [first] = real.rows.filter(row => row.go.can);
  for (const step of callPlan(real, [first.id])) applyAction(world, 'hh-1', { ...step, mode: 'foot' });
  assert.ok(Object.values(marked(world, 'hh-1')).every(kinds => !kinds.includes('call')), 'the confirm left an "!"');
  assert.equal(callMenu(view(world, 'hh-1').request, { entities: seen.entities }), null);
});

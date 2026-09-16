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
import { NEED_KINDS, focusFor, focusKey, isIdle, needsOf, panelActions } from '../public/family-panel.js';

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
  // The most pressing first: a rider who will not wait, then the army, a call, work asking, an offer.
  const everything = {
    entities: [{ ...entity, chore: { ask: { id: 'shot' } } }], request: call, army: army('open'),
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
      const icons = panelActions({ entity, offered: seen.work[id], catalogue, principal: id === household.principalId, homeId: home, atHome: entity.location?.siteId === home });
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

test('the main person is the one chosen in this browser while they can act, and otherwise the principal', () => {
  const order = ['f', 'm', 'd'], entities = order.map(id => ({ id }));
  assert.equal(focusFor(null, { order, principalId: 'm', entities }), 'm');
  assert.equal(focusFor('d', { order, principalId: 'm', entities }), 'd');
  assert.equal(focusFor('hh-9-thomas', { order, principalId: 'm', entities }), 'm', 'somebody not in this family is kept as the main person');
  assert.equal(focusFor('d', { order, principalId: 'm', entities: [{ id: 'f' }, { id: 'm' }, { id: 'd', health: { condition: 'dead' } }] }), 'm');
  assert.equal(focusFor(null, { order, principalId: null, entities: [{ id: 'f', health: { condition: 'captured' } }, { id: 'm' }, { id: 'd' }] }), 'm');
  assert.notEqual(focusKey('s1', 'hh-1'), focusKey('s2', 'hh-1'), 'a new class inherits the last class’s choice');
  assert.notEqual(focusKey('s1', 'hh-1'), focusKey('s1', 'hh-2'));
});

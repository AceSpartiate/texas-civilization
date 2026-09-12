// What a family knows decides what it can do.
//
// Steps 1 and 2 of docs/LIVING_INFORMATION.md made news a person who rode a real road and
// said it to somebody, and made a far family's account older and second-hand. None of that
// changed a single option: a family holding a rumor through three pairs of hands was asked
// exactly what a family that met the eyewitness was asked. `FIC-GONZ-020` is the first rule
// under which how a family heard decides what it is offered - nobody knocks on a rumor, and
// a family with only a rumor is asked whether to go and see.
//
// Two defects were found while measuring for it and are guarded here too: every call asked
// about somebody called Thomas whatever the family had named its people, and the word left
// Gonzales on a clock rather than when it happened - the first family was simply told by a
// neighbour who did not exist, wherever it lived.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, projectWorld, validateWorld, RIDER_SPEED } from '../sim/world.mjs';
import { TIMELINE } from '../sim/directors.mjs';
import { findPath } from '../sim/geography.mjs';
import { learn } from '../sim/knowledge.mjs';

const TOPIC = 'cannon-request';
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const knows = (world, householdId) => world.knowledge.households[householdId][TOPIC];
const principalOf = (world, householdId) => world.entities[world.households[householdId].principalId];
function running(seed, players = 15) {
  const world = createGonzalesWorld(seed, players);
  world.status = 'running';
  return world;
}
function untilEveryoneHeard(world) {
  for (let tick = 0; tick < 300 && Object.keys(world.households).some(id => !knows(world, id)); tick++) stepWorld(world);
}
/** A class, played until the word is out, and the first family in it holding only a rumor. */
function withRumor(seed = 'rumor') {
  const world = running(seed);
  untilEveryoneHeard(world);
  const householdId = Object.keys(world.households).find(id => knows(world, id).status === 'rumor');
  assert.ok(householdId, 'the class really does contain a family at the end of a chain');
  return { world, householdId };
}

test('the word leaves Gonzales for every family at the same minute, and nobody hears before a rider could reach them', () => {
  const world = running('road-decides');
  while (!world.truth[TOPIC]) stepWorld(world);
  const happened = world.truth[TOPIC].minute;
  const riders = Object.values(world.entities).filter(entity => entity.courier && entity.report);
  assert.equal(new Set(riders.map(rider => rider.report.audience)).size, 15, 'every family has somebody on the road to it');
  assert.ok(riders.every(rider => rider.report.departedMinute === happened), 'they all set out when it happened, not on a schedule');

  untilEveryoneHeard(world);
  for (const household of Object.values(world.households)) {
    const report = knows(world, household.id);
    if (report.source === 'Local observation') continue;
    assert.doesNotMatch(report.source, /neighbou?r/i, `${household.id} was simply told, by nobody`);
    // A rider covers the road at a known pace, and a family standing at its own cabin cannot
    // hear before the road allows. A mile of slack for earshot and for somebody out in a field.
    const miles = findPath(world.map, 'gonzales', household.homeSiteId).distance;
    const soonest = Math.ceil(Math.max(0, miles - 1) / RIDER_SPEED) * 20;
    assert.ok(report.receivedMinute - happened >= soonest, `${household.id} heard ${report.receivedMinute - happened} minutes after it happened, from ${miles.toFixed(1)} road miles away`);
  }
});

test('the neighbour at the door asks about the family’s own person, by the name the family gave them', () => {
  const world = running('named-call', 5);
  for (const household of Object.values(world.households)) {
    applyAction(world, household.id, { action: 'rename', entityId: household.principalId, name: 'Bartolo' });
  }
  untilEveryoneHeard(world);
  const asked = Object.values(world.requests).concat(Object.values(world.rumors));
  assert.ok(asked.length === 5, 'every family was asked something');
  for (const call of asked) {
    assert.match(call.text, /Bartolo/, `"${call.text}" does not name the family's own person`);
    assert.doesNotMatch(call.text, /Thomas/);
  }
});

test('nobody knocks on a rumor: a family with only a third-hand account is asked whether to go and see', () => {
  const { world, householdId } = withRumor();
  assert.equal(world.requests[householdId], undefined, 'a neighbour came asking for food on a rumor');
  const question = view(world, householdId).request;
  assert.equal(question.kind, 'rumor');
  assert.equal(question.status, 'open');
  assert.deepEqual(question.options.map(option => option.id), ['go-see', 'stay-home']);
  assert.match(question.text, /third-hand|pairs of hands/, 'the question says how the word came');
  assert.match(question.options[0].note, /Nothing spent and nothing promised/);
  const entityId = world.households[householdId].principalId;
  assert.throws(() => applyAction(world, householdId, { action: 'help', entityId }), /no known open request/i, 'the food can be given on a rumor anyway');

  // And a family that heard it firmly, in the same class, is asked the ordinary way.
  const firm = Object.keys(world.households).find(id => knows(world, id).status !== 'rumor' && world.requests[id]);
  assert.ok(firm);
  assert.equal(view(world, firm).request.kind, 'supplies');
  assert.equal(world.rumors[firm], undefined);
  validateWorld(world);
});

test('going to see makes the word firm, and the call is put to them in town', () => {
  const { world, householdId } = withRumor('go-see');
  const household = world.households[householdId], person = principalOf(world, householdId);
  const food = household.resources.food;
  applyAction(world, householdId, { action: 'go-see', entityId: person.id });
  assert.equal(world.rumors[householdId].status, 'accepted');
  assert.ok(person.travel && person.travel.to === 'gonzales', 'going to see is a real walk to town');
  assert.equal(household.resources.food, food, 'and it spends nothing');
  assert.equal(world.requests[householdId], undefined, 'nothing is asked of them on the road');

  for (let tick = 0; tick < 200 && person.travel; tick++) stepWorld(world);
  assert.equal(person.location.siteId, 'gonzales');
  stepWorld(world);
  assert.equal(knows(world, householdId).status, 'confirmed', 'standing in Gonzales, they saw it for themselves');
  assert.equal(knows(world, householdId).source, 'Local observation');
  const call = world.requests[householdId];
  assert.ok(call, 'nobody asked them anything once they were there');
  assert.equal(call.where, 'town');
  const shown = view(world, householdId).request;
  assert.equal(shown.kind, 'supplies');
  assert.match(shown.text, new RegExp(`People in Gonzales .* ${person.name}`));
  const give = shown.options.find(option => option.id === 'help');
  assert.equal(give.can, true);
  assert.match(give.label, /here in Gonzales/);

  // The family has been eating while they walked, so the price is measured from here.
  const before = household.resources.food;
  applyAction(world, householdId, { action: 'help', entityId: person.id });
  assert.equal(household.resources.food, Math.round((before - 2) * 10000) / 10000);
  assert.equal(person.travel, null, 'already there, so nobody walks anywhere');
  validateWorld(world);
});

test('firmer word from somebody else turns the rumor into the ordinary call at the door', () => {
  const { world, householdId } = withRumor('firmer');
  learn(world, householdId, TOPIC, { status: 'unconfirmed', source: 'A second rider who had it from the one who saw it', hands: 1 });
  stepWorld(world);
  assert.equal(world.rumors[householdId].status, 'overtaken', 'the question of whether to go and find out has answered itself');
  assert.equal(world.requests[householdId]?.where, 'home');
  assert.equal(view(world, householdId).request.kind, 'supplies');
  // It never lapses as a rumor nobody went after, because it stopped being one.
  for (let tick = 0; tick < 400 && world.minute < TIMELINE.approach + 40; tick++) stepWorld(world);
  assert.equal(world.events.filter(event => event.householdId === householdId && /whether the rumor was true/.test(event.text)).length, 0);
});

test('staying home on a rumor is an answer: food set aside once, and nobody comes asking afterwards', () => {
  const { world, householdId } = withRumor('stay-home');
  const household = world.households[householdId], person = principalOf(world, householdId);
  const food = household.resources.food;
  applyAction(world, householdId, { action: 'stay-home', entityId: person.id });
  assert.equal(world.rumors[householdId].status, 'refused');
  assert.equal(household.prepared, true);
  assert.equal(household.resources.food, food + 1);
  assert.equal(household.memories.length, 1);
  // Firmer word reaches them later. VISION.md §11: a refusal reduces repeated requests, so a
  // neighbour does not come to the door to ask a family that has already decided.
  learn(world, householdId, TOPIC, { status: 'confirmed', source: 'Somebody who saw it' });
  for (let tick = 0; tick < 5; tick++) stepWorld(world);
  assert.equal(world.requests[householdId], undefined, 'the family was asked again after it had answered');
  assert.equal(world.events.filter(event => event.type === 'pressure' && event.householdId === householdId).length, 1);
});

test('a rumor nobody went after is written down once, and says nothing the family did not know', () => {
  const { world, householdId } = withRumor('lapsed-rumor');
  for (let tick = 0; tick < 400 && world.minute < TIMELINE.approach + 60; tick++) stepWorld(world);
  assert.equal(world.rumors[householdId].status, 'expired');
  const said = world.events.filter(event => event.householdId === householdId && /whether the rumor was true/.test(event.text));
  assert.equal(said.length, 1, 'the family let it go by and its record says nothing about it');
  assert.ok(said[0].causes.includes(world.rumors[householdId].id));
  // A family that never went does not learn from its own journal what happened at Gonzales.
  assert.doesNotMatch(said[0].text, /upriver|withdr|fight|cannon|soldier/i);
  assert.equal(view(world, householdId).request.status, 'expired');
});

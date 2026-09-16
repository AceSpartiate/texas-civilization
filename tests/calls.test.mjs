// Each settlement's own call: docs/COLONIES.md §5.4a, build step 4 (part 2).
//
// A family far from Gonzales is asked what its settlement asked in October 1835 (`HIST-TEX-014`), once the express has
// brought the word to its door: San Felipe, Mina, Liberty and Victoria to go to Gonzales, Matagorda and Columbia to gather at
// Kerr's on the Lavaca, where staying to keep the coast is its own answer. Somebody who turns out rides to the gathering
// with the family's powder and waits there. Neighbours answer as the letters say the settlements did. The invented map
// and the Gonzales families' own calls are untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { SETTLEMENT_CALLS, VOLUNTEER_POWDER, callsInvalid } from '../sim/calls.mjs';
import { momentOf } from '../sim/directors.mjs';
import { withTheArmy } from '../sim/army.mjs';

const colonies = (seed, players = 15, options = {}) => {
  const world = createGonzalesWorld(seed, players, { map: 'colonies', ...options });
  world.status = 'running';
  return world;
};
const until = (world, done, limit = 1500) => { for (let tick = 0; tick < limit && !done() && !world.director.complete; tick++) stepWorld(world); };
const storyOf = (world, householdId) => world.events.filter(event => event.householdId === householdId);
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const firstIn = (world, settlements) => Object.values(world.households).find(household => settlements.includes(household.settlementId));

let played = null;
const playedOut = () => {
  if (played) return played;
  const world = colonies('calls-played');
  until(world, () => false);
  validateWorld(world);
  return (played = world);
};

test("each far family is asked its own settlement's call once the express has brought the word, and a family of Gonzales is not", () => {
  const world = playedOut();
  assert.ok(world.director.complete);
  let asked = 0;
  for (const household of Object.values(world.households)) {
    const call = world.calls?.[household.id];
    if (household.settlementId === 'gonzales') {
      // Never a far settlement's call, and never on an express: the town's own, asked once the
      // gathering has begun around it (docs/COLONIES.md §5.5, build step 5).
      assert.equal(call?.text, SETTLEMENT_CALLS.gonzales.text, `${household.id} of Gonzales was asked ${call ? 'a far settlement\'s call' : 'nothing'}`);
      assert.ok(world.director.milestones['gathering-opens'], 'the gathering never opened');
      assert.ok(call.offeredMinute >= momentOf(world, 'gathering-opens'), `${household.id} was asked before the gathering opened`);
      continue;
    }
    assert.ok(call, `${household.id} of ${household.settlementId} was never asked`);
    asked++;
    const expected = SETTLEMENT_CALLS[household.settlementId];
    assert.equal(call.gather, expected.gather);
    assert.equal(call.text, expected.text);
    // Asked on the word, never before it reached the family.
    const report = world.knowledge.households[household.id]['cannon-request'];
    assert.ok(report && call.offeredMinute >= report.receivedMinute, `${household.id} was asked before it heard`);
    const pressure = storyOf(world, household.id).filter(event => event.type === 'pressure' && event.claimId === 'FIC-GONZ-031');
    assert.equal(pressure.length, 1, `${household.id} was asked ${pressure.length} times`);
    // Nobody answered in this class: the silence is written down when it ends.
    assert.equal(call.status, 'expired');
    assert.ok(storyOf(world, household.id).some(event => /Nobody from this family answered when the settlement turned out/.test(event.text)));
  }
  assert.ok(asked >= 10);
  // What each settlement asked, as the letters give it.
  assert.match(SETTLEMENT_CALLS['san-felipe'].text, /Washington is already turning out to march to Gonzales/);
  for (const coast of ['matagorda', 'columbia']) {
    assert.match(SETTLEMENT_CALLS[coast].text, /James Kerr's on the Lavaca/);
    assert.equal(SETTLEMENT_CALLS[coast].gather, 'victoria');
  }
  for (const inland of ['san-felipe', 'mina', 'liberty', 'victoria']) assert.equal(SETTLEMENT_CALLS[inland].gather, 'gonzales');
});

test('turning out: the one sent rides for the gathering with the family powder, gets there, and the family remembers', () => {
  const world = colonies('calls-turn-out');
  const household = firstIn(world, ['san-felipe']);
  until(world, () => world.calls?.[household.id]);
  const request = view(world, household.id).request;
  assert.equal(request.kind, 'call');
  assert.equal(request.status, 'open');
  const [personId] = Object.entries(request.answerers).find(([, options]) => options.find(o => o.id === 'turn-out').can);
  const person = world.entities[personId];
  const powder = household.resources.powder;
  assert.match(request.answerers[personId].find(o => o.id === 'turn-out').label, /ride for Gonzales/);
  applyAction(world, household.id, { action: 'turn-out', entityId: personId, mode: 'horse' });
  assert.equal(world.calls[household.id].status, 'accepted');
  assert.equal(household.resources.powder, powder - Math.min(VOLUNTEER_POWDER, powder), 'the family powder went with them');
  assert.equal(person.travel?.to, 'gonzales');
  assert.equal(person.travel.mode, 'horse');
  assert.ok(person.commitments.some(c => c.id === 'volunteer' && c.status === 'active'));
  assert.throws(() => applyAction(world, household.id, { action: 'stay-put', entityId: personId }), /Nobody is asking that/, 'answered once');
  until(world, () => world.calls[household.id].arrivedMinute !== undefined);
  validateWorld(world);
  assert.equal(person.location.siteId, 'gonzales');
  assert.equal(person.task, 'help');
  const story = storyOf(world, household.id).map(event => event.text);
  assert.ok(story.some(text => text === `${person.name} reached Gonzales, where volunteers from the settlements are gathering and waiting to be made into an army.`), story.slice(-4).join(' / '));
  assert.ok(household.memories.some(id => world.events.find(event => event.id === id)?.text === `${person.name} went with the volunteers.`));
  assert.equal(view(world, household.id).request.status, 'accepted');
});

test('staying is a whole answer, and on the coast it is keeping the coast', () => {
  const world = colonies('calls-stay');
  const coast = firstIn(world, ['matagorda', 'columbia']), inland = firstIn(world, ['san-felipe', 'mina', 'liberty']);
  until(world, () => world.calls?.[coast.id] && world.calls?.[inland.id]);
  const optionsOf = household => Object.values(view(world, household.id).request.answerers)[0];
  assert.equal(optionsOf(coast).find(o => o.id === 'stay-put').label, 'Stay and keep the coast');
  assert.equal(optionsOf(coast).find(o => o.id === 'turn-out').label, 'Go: ride west to join them, toward Victoria');
  assert.equal(optionsOf(inland).find(o => o.id === 'stay-put').label, 'Stay home');
  const stayer = world.entities[Object.keys(view(world, coast.id).request.answerers)[0]];
  const powder = coast.resources.powder;
  applyAction(world, coast.id, { action: 'stay-put', entityId: stayer.id });
  assert.equal(world.calls[coast.id].status, 'refused');
  assert.equal(stayer.travel, null);
  assert.equal(coast.resources.powder, powder, 'nothing spent');
  assert.ok(storyOf(world, coast.id).some(event => event.text === `${stayer.name} stayed to keep the coast, and the farm kept its hands.`));
});

test('only somebody old enough is asked, only a far family, and not once the class has ended', () => {
  const world = colonies('calls-refusals');
  const far = firstIn(world, ['san-felipe', 'mina', 'liberty', 'columbia', 'matagorda', 'victoria']);
  const home = firstIn(world, ['gonzales']);
  until(world, () => world.calls?.[far.id]);
  const answerers = Object.keys(view(world, far.id).request.answerers);
  for (const id of far.members.filter(id => world.entities[id].kind === 'person' && !answerers.includes(id))) {
    assert.throws(() => applyAction(world, far.id, { action: 'turn-out', entityId: id }), /too young/, `${world.entities[id].name} could be sent`);
  }
  const grown = home.members.find(id => world.entities[id].principal);
  assert.throws(() => applyAction(world, home.id, { action: 'turn-out', entityId: grown }), /Nobody is asking that/);
  // Another family's person is not this family's to send.
  assert.throws(() => applyAction(world, home.id, { action: 'turn-out', entityId: answerers[0] }));
  world.director.complete = true;
  assert.throws(() => applyAction(world, far.id, { action: 'turn-out', entityId: answerers[0] }));
});

test('neighbours answer as the settlements did: the coast stays, inland a family with a second grown hand sends a man', () => {
  // To November 2: after it, men go home from the siege for clothes and pledges (tests/siege.test.mjs), which is not this.
  const run = () => { const world = colonies('calls-neighbours', 30, { neighbours: true }); until(world, () => world.director.milestones.siege); validateWorld(world); return world; };
  const world = run();
  let went = 0;
  for (const [householdId, call] of Object.entries(world.calls)) {
    const household = world.households[householdId];
    if (['matagorda', 'columbia'].includes(household.settlementId)) assert.equal(call.status, 'refused', `${householdId} left the coast`);
    if (call.status !== 'accepted') continue;
    went++;
    const person = world.entities[call.actorId];
    assert.ok(person.sex !== 'female', `${person.name} was sent`);
    // Standing where they were called to, or gone on from it with the army - which they could only
    // have joined by getting there first (docs/COLONIES.md §5.5, build step 5).
    assert.ok(person.location.siteId === call.gather || withTheArmy(world, person.id),
      `${person.name} never reached ${call.gather}`);
    assert.ok(call.arrivedMinute !== undefined, `${person.name} is counted as having gone without ever arriving`);
  }
  assert.ok(went >= 3, `${went} neighbours turned out`);
  assert.ok(Object.values(world.calls).some(call => call.status === 'refused' && !['matagorda', 'columbia'].includes(call.settlementId)) || went < Object.keys(world.calls).length);
  // Deterministic: the same class answers the same way.
  assert.deepEqual(Object.fromEntries(Object.entries(run().calls).map(([id, c]) => [id, c.status])), Object.fromEntries(Object.entries(world.calls).map(([id, c]) => [id, c.status])));
});

test('the invented map asks no settlement calls, and a world cannot claim a call that is not there', () => {
  const invented = createSettledWorld('calls-invented', 15);
  invented.status = 'running';
  until(invented, () => false);
  assert.equal(invented.calls, undefined);
  const world = playedOut();
  const [householdId] = Object.keys(world.calls);
  for (const [corrupt, message] of [
    [w => { w.calls[householdId].status = 'maybe'; }, /Invalid call status/],
    [w => { w.calls[householdId].gather = 'nowhere'; }, /gathering that is not there/],
    [w => { w.calls['hh-99'] = { ...w.calls[householdId] }; }, /household that is not there/],
    [w => { w.calls[householdId].status = 'accepted'; w.calls[householdId].actorId = 'nobody'; }, /answered by nobody/],
  ]) {
    const copy = structuredClone(world);
    corrupt(copy);
    assert.match(callsInvalid(copy), message);
    assert.throws(() => validateWorld(copy), message);
  }
});

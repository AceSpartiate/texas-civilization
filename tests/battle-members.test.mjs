// Who took part in the fight, and where they stood while it happened.
//
// A family member who went upriver used to arrive at `williams-camp` - the very point the
// Mexican detachment is drawn on - and stand there among the soldiers they had come to face.
// Now they stand with the Texian force, keep their own identity while they do, set off home
// from where they actually stand, and the server writes down, privately, who took part and
// how. That record is what glory will be counted from.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, projectWorld, projectFamily, validateWorld } from '../sim/world.mjs';
import { CAMP_SITE, TIMELINE, formationMembers } from '../sim/directors.mjs';
import { learn } from '../sim/knowledge.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const apart = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Play a class in which each named household's principal carries the food, and answers the
 * march as its policy says: 'go-upriver', 'stay-in-town', or null to carry food and stop.
 */
function play(seed, policies, { until = TIMELINE.finish, onTick } = {}) {
  const world = createGonzalesWorld(seed, 5);
  world.status = 'running';
  while (!world.truth['cannon-request']) stepWorld(world);
  for (const householdId of Object.keys(policies)) learn(world, householdId, 'cannon-request', { status: 'confirmed', source: 'Somebody who saw it' });
  const answered = new Set();
  while (world.status === 'running' && world.minute < until) {
    stepWorld(world);
    for (const [householdId, policy] of Object.entries(policies)) {
      const call = view(world, householdId).request;
      if (call?.status !== 'open') continue;
      const principal = world.households[householdId].principalId;
      if (call.kind === 'supplies' && !answered.has(householdId)) {
        try { applyAction(world, householdId, { action: policy === 'stay' ? 'stay' : 'help', entityId: principal }); answered.add(householdId); } catch { /* not yet */ }
      }
      if (call.kind === 'march' && policy !== 'stay' && policy) applyAction(world, householdId, { action: policy, entityId: call.actorId });
    }
    onTick?.(world);
  }
  return world;
}

test('somebody who went upriver stands with the Texian force, not in the Mexican camp', () => {
  let during = null;
  const world = play('stand-with', { 'hh-1': 'go-upriver' }, {
    until: TIMELINE.withdrawal,
    onTick: w => {
      if (w.director.battle.phase !== 'exchange' || during) return;
      const [texian, mexican] = w.director.battle.formations;
      const person = w.entities[w.households['hh-1'].principalId];
      during = { at: { ...person.location }, texian: { x: texian.x, y: texian.y }, mexican: { x: mexican.x, y: mexican.y }, id: person.id };
    },
  });
  assert.ok(during, 'the exchange never happened with the family there');
  assert.equal(during.at.siteId, CAMP_SITE, 'they are still at the camp, as far as the world is concerned');
  assert.ok(apart(during.at, during.texian) < 0.25, `they stood ${apart(during.at, during.texian).toFixed(2)} miles from the Texian formation`);
  assert.ok(apart(during.at, during.mexican) > apart(during.at, during.texian) + 0.1, 'they stood nearer the Mexican detachment than their own side');
  // Still one person under their own id, and the formation still names nobody.
  assert.equal(world.entities[during.id].id, during.id);
  assert.equal(formationMembers(world).length, 1);
  for (const formation of world.director.battle.formations) assert.doesNotMatch(JSON.stringify(formation), /hh-\d/);
  validateWorld(world);
});

test('they come home with the men, and the road starts where they are standing', () => {
  const world = play('road-from-here', { 'hh-1': 'go-upriver' }, { until: TIMELINE.resolved + 40 });
  const person = world.entities[world.households['hh-1'].principalId];
  assert.equal(person.location.siteId, CAMP_SITE);
  // With the men until they leave the field (sim/battle-stage.mjs `heldByBattle`): no order sends them off before it.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: person.id, destination: world.households['hh-1'].homeSiteId }), /with the men/);
  let stood = null;
  for (let tick = 0; tick < 40 && !person.travel; tick++) { stood = { x: person.location.x, y: person.location.y }; stepWorld(world); }
  assert.ok(person.travel, 'they were never sent back to Gonzales with the men');
  assert.equal(person.travel.to, 'gonzales', 'the men went back to Gonzales, and so do they');
  // The step taken in the tick they set off is their own walk to the start of the road, not a jump.
  assert.ok(apart(person.travel.points[0], stood) < 0.06, 'the journey began somewhere they were not standing');
  assert.ok(Math.abs(person.travel.distance - (person.travel.points.slice(1).reduce((sum, point, i) => sum + apart(point, person.travel.points[i]), 0))) < 1e-6, 'the distance is the road actually walked');
  validateWorld(world);
});

test('the battle records who took part and how, and tells no client', () => {
  const world = play('who-took-part', { 'hh-1': 'go-upriver', 'hh-2': 'stay-in-town', 'hh-3': 'stay' });
  assert.equal(world.director.complete, true);
  const record = world.participation?.gonzales || {};
  const principal = id => world.households[id].principalId;
  // In the line when it fired (docs/BATTLES.md §2.6): since 2026-09-25 somebody who went up the river takes part, and the
  // record says so. Standing in town with the food is still `supplied`.
  assert.equal(record[principal('hh-1')]?.role, 'fought', 'in the line with the men while they fired');
  assert.equal(record[principal('hh-2')]?.role, 'supplied', 'carrying food that reached town, and no further');
  assert.equal(record[principal('hh-3')], undefined, 'a family that stayed home took part in nothing');
  assert.equal(Object.keys(record).length, 2);
  assert.ok(Object.values(record).every(entry => Number.isFinite(entry.minute) && world.households[entry.householdId]));
  assert.ok(record[principal('hh-1')].minute >= TIMELINE.approach && record[principal('hh-1')].minute <= TIMELINE.withdrawal, 'the fighting is stamped while it was happening');
  // And the engine's own record of it is never on anybody's wire either.
  assert.ok(Number.isFinite(world.battles.gonzales.participants[principal('hh-1')].fought));

  const leak = /"participation"|"participants"|"supplied"|"present"|"fought"/;
  // Read as the class stood before its end: once it has ended the ending reveals every family's
  // part on purpose (sim/ending.mjs, docs/MONEY_AND_GLORY.md step 4), and tests/ending.test.mjs
  // proves the reveal waits for it.
  world.status = 'paused';
  assert.doesNotMatch(JSON.stringify(projectWorld(world, undefined, 'host', { includeMap: false })), leak, 'the Host');
  for (const householdId of Object.keys(world.households)) {
    assert.doesNotMatch(JSON.stringify(view(world, householdId)), leak, householdId);
    assert.doesNotMatch(JSON.stringify(projectFamily(world, householdId)), leak, `${householdId}'s family book`);
  }
  validateWorld(world);
});

// Glory, hidden: step 3 of docs/MONEY_AND_GLORY.md.
//
// Three things are proved here, and the second and third matter more than the first. Taking
// part in what happened earns glory, weighted by the part and by how far the family came.
// Glory reaches no screen in the class - not the family's own, not a neighbour's, not the
// Host's - before the game ends. And nothing in the game reads it: a class played with glory
// and the same class played with a different glory come out identical, so no director can be
// quietly asking "has this family participated enough?".
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, projectWorld, projectFamily, validateWorld } from '../sim/world.mjs';
import { learn } from '../sim/knowledge.mjs';
import { findPath } from '../sim/geography.mjs';
import { GLORY_WEIGHT, awardGlory, distanceMultiplier } from '../sim/glory.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });

/**
 * A class in which named households answer by policy: 'go-upriver' carries food and goes on,
 * 'stay-in-town' carries food and stops there, 'stay' stays home. `beforeTick` runs first on
 * every tick, so a test can plant something or watch the wire.
 */
function play(seed, policies, { beforeTick, plant } = {}) {
  const world = createGonzalesWorld(seed, 5);
  world.status = 'running';
  plant?.(world);
  while (!world.truth['cannon-request']) stepWorld(world);
  for (const householdId of Object.keys(policies)) learn(world, householdId, 'cannon-request', { status: 'confirmed', source: 'Somebody who saw it' });
  const answered = new Set();
  while (world.status === 'running') {
    beforeTick?.(world);
    stepWorld(world);
    for (const [householdId, policy] of Object.entries(policies)) {
      const call = view(world, householdId).request;
      if (call?.status !== 'open') continue;
      const principal = world.households[householdId].principalId;
      if (call.kind === 'supplies' && !answered.has(householdId)) {
        applyAction(world, householdId, { action: policy === 'stay' ? 'stay' : 'help', entityId: principal });
        answered.add(householdId);
      }
      if (call.kind === 'march' && policy !== 'stay') applyAction(world, householdId, { action: policy, entityId: call.actorId });
    }
  }
  return world;
}
const POLICIES = { 'hh-1': 'go-upriver', 'hh-2': 'stay-in-town', 'hh-3': 'stay' };

test('taking part earns glory - more for standing there than for carrying food, and more for coming further', () => {
  const world = play('glory-earned', POLICIES);
  const milesOf = id => findPath(world.map, 'gonzales', world.households[id].homeSiteId).distance;
  const principal = id => world.households[id].principalId;
  const upriver = world.glory['hh-1'].awards[`gonzales:${principal('hh-1')}`];
  assert.equal(upriver.role, 'present');
  assert.equal(upriver.points, GLORY_WEIGHT.present * distanceMultiplier(milesOf('hh-1')));
  const inTown = world.glory['hh-2'].awards[`gonzales:${principal('hh-2')}`];
  assert.equal(inTown.role, 'supplied');
  assert.equal(inTown.points, GLORY_WEIGHT.supplied * distanceMultiplier(milesOf('hh-2')));
  assert.equal(world.glory['hh-3'], undefined, 'a family that stayed home took part in nothing');
  assert.ok(GLORY_WEIGHT.present > GLORY_WEIGHT.supplied && GLORY_WEIGHT.fought > GLORY_WEIGHT.present, 'every part counts, and fighting counts most');
  assert.ok(distanceMultiplier(20) > distanceMultiplier(2), 'a family that walked further in has done more');
  // Each award is in the family's own record, sealed, with what caused it.
  const sealed = world.events.find(event => event.id === upriver.eventId);
  assert.equal(sealed.visibility, 'sealed');
  assert.equal(sealed.householdId, 'hh-1');
  assert.ok(sealed.causes.length > 0, 'the reveal will have nothing to say about why');
  validateWorld(world);
});

test('glory is counted once per person per event, and a casualty earns nothing extra', () => {
  const world = createGonzalesWorld('glory-once', 5);
  const person = world.entities[world.households['hh-1'].principalId];
  const award = { event: 'gonzales', claimId: 'HIST-GONZ-004', personId: person.id, householdId: 'hh-1', role: 'present', fromSiteId: 'gonzales' };
  const first = awardGlory(world, award);
  assert.ok(first > 0);
  assert.equal(awardGlory(world, award), 0, 'the same part was paid twice');
  assert.equal(world.glory['hh-1'].total, first);

  const other = createGonzalesWorld('glory-once', 5);
  const hurt = other.entities[other.households['hh-1'].principalId];
  hurt.health = { condition: 'dead' };
  assert.equal(awardGlory(other, { ...award, personId: hurt.id }), first, 'a death changed what the part was worth');
  validateWorld(world); validateWorld(other);
});

test('glory reaches no screen in the class: not the family, not a neighbour, not the Host', () => {
  const marker = /GLORY-MARK|987654|"glory"|"awards"|"sealed"/;
  let checked = 0;
  play('glory-hidden', POLICIES, {
    beforeTick: world => {
      // Once there is glory, make it unmistakable, and watch every payload for it.
      for (const ledger of Object.values(world.glory || {})) {
        if (ledger.total === 987654) continue;
        for (const award of Object.values(ledger.awards)) {
          award.points = 987654; award.role = 'GLORY-MARK';
          const event = world.events.find(e => e.id === award.eventId);
          event.text = `GLORY-MARK ${event.text}`;
        }
        ledger.total = 987654 * Object.keys(ledger.awards).length;
      }
      if (!world.glory) return;
      assert.doesNotMatch(JSON.stringify(projectWorld(world, undefined, 'host', { includeMap: false })), marker, `the Host at tick ${world.tick}`);
      for (const householdId of Object.keys(world.households)) {
        assert.doesNotMatch(JSON.stringify(view(world, householdId)), marker, `${householdId} at tick ${world.tick}`);
        assert.doesNotMatch(JSON.stringify(projectFamily(world, householdId)), marker, `${householdId}'s family book at tick ${world.tick}`);
      }
      checked++;
    },
  });
  // Glory is earned when the fight settles and the slice ends some thirty-odd ticks later: every one of them is checked.
  assert.ok(checked > 25, `glory existed for only ${checked} checks before the slice ended`);
});

test('nothing in the game reads glory: the same class with different glory plays out the same', () => {
  const planted = world => {
    // A glory no award in this class could ever produce, on every family, from the first tick.
    world.glory = Object.fromEntries(Object.keys(world.households).map(id => [id, { total: 500, awards: { 'planted:nobody': { points: 500 } } }]));
  };
  const plain = play('glory-blind', POLICIES);
  const loaded = play('glory-blind', POLICIES, { plant: planted });
  // Take the glory away from both, and what is left - every event, every choice, every
  // position, every store - must be identical.
  for (const world of [plain, loaded]) delete world.glory;
  assert.deepEqual(loaded, plain, 'something in the game behaved differently because of glory');
});

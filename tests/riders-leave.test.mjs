// Riders whose errand is done leave (owner, 2026-09-27: "riders delivering messages should leave after their interactions
// are complete."; sim/encounters.mjs `advanceDepartures`, `FIC-GONZ-634`). Before this a rider who had said his piece stood
// where he stopped - at the family's gate, on the road where he reined in, at the fork where he handed the word on, in the
// settlement the express came to - for the rest of the class. Each test is proved by a mutation that fails it and no other
// (scripts/military-regression-check.mjs). Travis's runner going back in is tests/alamo-runner.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, stepWorld, projectWorld, validateWorld, dispatchReport } from '../sim/world.mjs';
import { EARSHOT_MILES, PATIENCE_MINUTES } from '../sim/encounters.mjs';
import { findPath } from '../sim/geography.mjs';
import { RELAY_MINUTES } from '../sim/expresses.mjs';
import { fairWeather } from './support/weather.mjs';

const TOPIC = 'cannon-request';
const advance = (world, ticks) => { for (let i = 0; i < ticks; i++) stepWorld(world); };
const apart = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function briefed(seed, players = 5) {
  // Fair weather: in the rain the family goes in under its tent (sim/shelter.mjs), and these meetings are about the rider, not the sky.
  const world = fairWeather(createGonzalesWorld(seed, players));
  world.status = 'running';
  for (const id of Object.keys(world.households)) world.director.dispatches[id] = true;
  while (!world.truth[TOPIC]) stepWorld(world);
  return world;
}
const openFor = (world, householdId) => Object.values(world.encounters).find(e => e.householdId === householdId && e.status === 'open');
const seenBy = (world, householdId, id) => projectWorld(world, householdId, householdId ? 'student' : 'host', { includeMap: false }).others.some(one => one.id === id);
/** A rider sent to this family alone, and the meeting when he reaches them. */
function met(world, householdId) {
  world.director.dispatches[householdId] = true;
  dispatchReport(world, TOPIC, householdId);
  for (let i = 0; i < 60 && !openFor(world, householdId); i++) stepWorld(world);
  const encounter = openFor(world, householdId);
  assert.ok(encounter, 'the rider never reached the family');
  return { encounter, rider: world.entities[encounter.carrierId] };
}
/**
 * He rides away from where he spoke with the family, tick on tick along the road home, until he is off and away from them;
 * and is then gone from every view.
 */
function ridesAway(world, rider, encounter) {
  assert.equal(rider.travel?.purpose, 'leave', 'the rider was not on his way home');
  let was = rider.travel.progress, moved = 0, far = apart(rider.location, encounter.place);
  for (let i = 0; i < 400 && !rider.gone; i++) {
    stepWorld(world);
    far = Math.max(far, apart(rider.location, encounter.place));
    // Home, which is the end of the road he was riding.
    if (rider.gone) { moved++; break; }
    assert.equal(rider.travel?.purpose, 'leave', `the rider was not on his way home on tick ${i}`);
    assert.ok(rider.travel.progress >= was, `the rider turned back on tick ${i}`);
    if (rider.travel.progress > was) moved++;
    was = rider.travel.progress;
  }
  assert.ok(moved >= 1, 'the rider did not ride away over the ticks');
  assert.ok(far > EARSHOT_MILES, 'the rider never got further from the family than speaking distance');
  assert.ok(rider.gone, 'the rider never went: he is still standing about');
}

test('a rider rides away once the meeting is over - let go, or given up waiting - seen going, and is then gone from every view', () => {
  for (const [seed, end] of [['leave-farewell', 'farewell'], ['leave-unanswered', 'unanswered']]) {
    const world = briefed(seed);
    const { encounter, rider } = met(world, 'hh-2');
    if (end === 'farewell') applyAction(world, 'hh-2', { action: 'leave-rider', entityId: encounter.listenerId });
    else advance(world, PATIENCE_MINUTES / 20 + 1);
    assert.equal(encounter.status, 'closed');
    assert.equal(encounter.reason, end);
    stepWorld(world);
    assert.equal(rider.travel?.purpose, 'leave', `the rider did not set off home once the meeting ended (${end})`);
    assert.ok(seenBy(world, 'hh-2', rider.id), `the family cannot watch the rider it spoke to ride away (${end})`);
    ridesAway(world, rider, encounter);
    assert.ok(!seenBy(world, 'hh-2', rider.id), `the family still sees the rider who has gone (${end})`);
    assert.ok(!seenBy(world, null, rider.id), `the Host still sees the rider who has gone (${end})`);
    // Not even by somebody of the family standing in the place he rode home to: he has gone, not stopped there.
    const listener = world.entities[encounter.listenerId];
    Object.assign(listener, { travel: null, chore: null, location: { ...rider.location } });
    assert.ok(!seenBy(world, 'hh-2', rider.id), `the rider is seen standing about where he rode home to (${end})`);
    validateWorld(world);
  }
});

test('a rider met out on the road turns round where he reined in and rides back the way he came', () => {
  const world = briefed('road-35');
  // A family on a track straight from town, so the one rider rides the whole road and no fork hands the word on mid-way.
  const road = findPath(world.map, 'gonzales', 'home-4');
  assert.ok(road.nodes.length === 2 && road.distance > 4, 'hh-4 lives more than a morning walk out, with no fork on the way');
  const walker = world.entities['hh-4-mateo'];
  beginTravel(world, walker, 'gonzales', null, 'visit');
  advance(world, 3);
  const { encounter, rider } = met(world, 'hh-4');
  assert.equal(encounter.place.siteId, null, 'they did not meet out on the road');
  const from = rider.travel.from, stood = { ...rider.location };
  applyAction(world, 'hh-4', { action: 'leave-rider', entityId: encounter.listenerId });
  stepWorld(world);
  assert.equal(rider.travel?.purpose, 'leave', 'the rider rode on to the family\'s gate instead of turning back');
  assert.equal(rider.travel.to, from, 'the rider is not riding back the way he came');
  assert.ok(apart(rider.travel.points[0], stood) < 1e-9, 'the rider did not turn round where he reined in');
  ridesAway(world, rider, encounter);
  assert.equal(rider.location.siteId, from, 'the rider went somewhere other than where he came from');
  validateWorld(world);
});

test('a rider who handed the word on at a fork rides home from there, rather than standing at the fork', () => {
  const world = briefed('leave-relay', 15);
  for (const id of Object.keys(world.households)) if (!world.knowledge.households[id][TOPIC]) { world.director.dispatches[id] = true; dispatchReport(world, TOPIC, id); }
  let relay = null;
  for (let i = 0; i < 90 && !relay; i++) { stepWorld(world); relay = world.events.find(e => e.type === 'relay'); }
  assert.ok(relay, 'nobody handed the word on');
  const rider = world.entities[relay.actorId], fork = world.map.sites[relay.siteId];
  stepWorld(world);
  let was = apart(rider.location, fork), moved = 0;
  for (let i = 0; i < 400 && !rider.gone; i++) {
    stepWorld(world);
    if (rider.gone) break;
    const now = apart(rider.location, fork);
    if (now > was + 1e-9) moved++;
    was = now;
  }
  assert.ok(moved >= 1, 'the rider never left the fork');
  assert.ok(rider.gone, 'the rider who handed the word on is still standing about');
  validateWorld(world);
});

test('an express rider who brought the word to a settlement rides home once it is read, rather than standing in the town', () => {
  const world = createGonzalesWorld('leave-express', 15, { map: 'colonies' });
  world.status = 'running';
  let rider = null;
  for (let tick = 0; tick < 2500 && !rider; tick++) {
    stepWorld(world);
    rider = Object.values(world.entities).find(one => one.express && !one.travel && one.location.siteId === one.express.to && world.expresses?.[one.express.topicId]?.heard?.[one.express.to] + RELAY_MINUTES <= world.minute + 60);
  }
  assert.ok(rider, 'no express rider reached a settlement');
  const town = world.map.sites[rider.express.to], from = rider.express.from;
  for (let i = 0; i < 10 && rider.express; i++) stepWorld(world);
  assert.equal(rider.express, undefined, 'the express was never read');
  stepWorld(world);
  assert.equal(rider.travel?.purpose, 'leave', 'the express rider did not set off home once the word was read');
  assert.equal(rider.travel.to, from, 'the express rider is not riding home to where he set out from');
  advance(world, 3);
  assert.ok(rider.gone || apart(rider.location, town) > 0, 'the express rider is still standing in the town');
  for (let i = 0; i < 1500 && !rider.gone; i++) stepWorld(world);
  assert.ok(rider.gone, 'the express rider never got home');
  validateWorld(world);
});

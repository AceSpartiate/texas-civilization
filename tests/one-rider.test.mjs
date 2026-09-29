// One rider, one visit (owner, 2026-09-29, verbatim: "At the start of the game, there's multiple riders that arrive at the same
// time. If they're all carrying similar news, why does the family receive multiples? Why don't we integrate and simplify
// things?", and the same day: "players shouldn't see riders merge, they should have a seamless experience. it should be an off
// screen thing. ... the player should see the requests as they arrive unless it's duplicate. Players shouldn't miss anything,
// but also shouldn't be quickly overwhelmed with a lot of stuff."; docs/COLONIES.md §5.4b, `FIC-GONZ-908`).
//
// What was measured before: word leaves a place for every family at the same minute, one rider each, so a family met its rider
// with up to fifteen more in sight (two to five on the real land), and the question the word raises - the neighbour at the
// door, the settlement's call - was put on the very tick he spoke, marked on every grown person of the family at once. A second
// rider with a firmer account of the same word waited at the gate and then told it all over again, and the family did not know
// the firmer account until the first had gone. Each test here was made to fail by the regression it guards
// (scripts/one-rider-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, dispatchReport, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { VISIT_MINUTES, seenComing } from '../sim/encounters.mjs';
import { establishTruth } from '../sim/knowledge.mjs';
import { findPath } from '../sim/geography.mjs';
import { readSave, writeSave } from '../server/storage.mjs';

const TOPIC = 'cannon-request';
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const openFor = (world, householdId) => Object.values(world.encounters).find(one => one.householdId === householdId && one.status === 'open');
const visitsOf = (world, householdId, topicId = TOPIC) => Object.values(world.encounters).filter(one => one.householdId === householdId && one.topicId === topicId);
const knows = (world, householdId, topicId = TOPIC) => world.knowledge.households[householdId][topicId];
/** A class with the word out and nobody's rider sent yet: each test says who rides. */
function briefed(seed) {
  const world = createGonzalesWorld(seed, 5);
  world.status = 'running';
  for (const id of Object.keys(world.households)) world.director.dispatches[id] = true;
  while (!world.truth[TOPIC]) stepWorld(world);
  return world;
}
/** The nearest family on a track straight from town: one rider rides the whole way, and no hand-off changes his account. */
function straightIn(world) {
  return Object.values(world.households)
    .map(household => ({ id: household.id, path: findPath(world.map, 'gonzales', household.homeSiteId) }))
    .filter(one => one.path.nodes.length === 2).sort((a, b) => a.path.distance - b.path.distance)[0]?.id || null;
}
/** A briefed class with such a family, trying the seed and then its numbered neighbours in a fixed order. */
function withStraight(seed) {
  for (let n = 0; n < 20; n++) {
    const world = briefed(n ? `${seed}-${n}` : seed);
    const id = straightIn(world);
    if (id) return { world, id };
  }
  throw new Error(`no seed from ${seed} has a family on a track straight from town`);
}
const until = (world, done, limit = 80) => { for (let i = 0; i < limit && !done(); i++) stepWorld(world); return done(); };

test('the same word, firmer, from a second rider mid-conversation is known the minute he comes, in his name, and is never a second meeting', () => {
  const { world, id } = withStraight('one-rider-fold');
  const first = world.entities[dispatchReport(world, TOPIC, id, 'unconfirmed')];
  stepWorld(world); stepWorld(world);
  const second = world.entities[dispatchReport(world, TOPIC, id, 'confirmed')];
  assert.ok(until(world, () => openFor(world, id)), 'the first rider never reached the family');
  const visit = openFor(world, id);
  assert.equal(visit.carrierId, first.id);
  assert.equal(knows(world, id).status, 'unconfirmed');
  assert.ok(until(world, () => !second.report), 'the second rider never came');
  const came = world.minute;
  assert.equal(visit.status, 'open', 'the first rider had already gone: this proves nothing about a visit still standing');
  // Known at once, as firm as he had it, in his name - not when the first rider leaves.
  const known = knows(world, id);
  assert.equal(known.status, 'confirmed', 'the firmer account waited for the first conversation to end');
  assert.equal(known.receivedMinute, came, 'the firmer account is not dated the minute its rider came');
  assert.match(known.source, new RegExp(`^${second.name}, who rode from Gonzales`));
  // One visit, which keeps who joined it, and the causal record says so.
  assert.equal(visitsOf(world, id).length, 1, 'the same word became a second meeting');
  assert.deepEqual(visit.joined?.map(one => one.carrierId), [second.id]);
  const joined = world.events.find(event => event.type === 'encounter-joined' && event.actorId === second.id);
  assert.ok(joined?.causes.includes(visit.metEventId), 'the record does not say whose visit it joined');
  assert.equal(joined.householdId, undefined, 'the family is shown the joining, which is meant to happen off the screen');
  assert.ok(world.events.find(event => event.id === known.eventId).causes.includes(joined.id), 'the journal line is not caused by the rider who brought it');
  // Nobody is shown a second rider, and he does not stand about: his errand is done.
  assert.ok(!view(world, id).others.some(other => other.id === second.id), 'the second rider is drawn at a family already being told');
  applyAction(world, id, { action: 'leave-rider', entityId: visit.listenerId });
  for (let i = 0; i < 60; i++) stepWorld(world);
  assert.equal(visitsOf(world, id).length, 1, 'the second rider told it over again once the first had gone');
  assert.ok(second.gone || second.leaving, 'the second rider is still standing at the gate');
  validateWorld(world);
});

test('a firmer account a little after the visit joins it; one a day after is its own visit', () => {
  const run = (seed, gapMinutes) => {
    const { world, id } = withStraight(seed);
    dispatchReport(world, TOPIC, id, 'unconfirmed');
    assert.ok(until(world, () => openFor(world, id)));
    const visit = openFor(world, id);
    applyAction(world, id, { action: 'leave-rider', entityId: visit.listenerId });
    // Sent so that he comes about `gapMinutes` after the visit closed: his ride from town, taken off the wait.
    const ride = visit.openedMinute - visit.departedMinute;
    while (world.minute - visit.closedMinute + ride < gapMinutes) stepWorld(world);
    const second = world.entities[dispatchReport(world, TOPIC, id, 'confirmed')];
    assert.ok(until(world, () => !second.report || openFor(world, id)), 'the second rider never came');
    return { world, id, visit, second, gap: world.minute - visit.closedMinute };
  };
  const near = run('one-rider-window-near', 60);
  assert.ok(near.gap < VISIT_MINUTES, `came ${near.gap} minutes after`);
  assert.equal(visitsOf(near.world, near.id).length, 1, `a firmer account ${near.gap} minutes after the visit was told as a second meeting`);
  assert.equal(knows(near.world, near.id).status, 'confirmed');
  // A day of 1835 after, written out: the window is what is under test, so it does not also set how long the test waits.
  const far = run('one-rider-window-far', 1440);
  assert.ok(far.gap >= VISIT_MINUTES, `came only ${far.gap} minutes after`);
  assert.equal(visitsOf(far.world, far.id).length, 2, `a firmer account ${far.gap} minutes after the visit was folded into it, not told`);
  assert.equal(openFor(far.world, far.id)?.carrierId, far.second.id);
});

test('a rider with other word waits his turn at the gate, and is his own conversation when the first is done', () => {
  const { world, id } = withStraight('one-rider-other-word');
  dispatchReport(world, TOPIC, id, 'confirmed');
  assert.ok(until(world, () => openFor(world, id)));
  const visit = openFor(world, id);
  establishTruth(world, { id: 'gonzales-outcome', text: 'The fight at the camp is over.', siteId: 'gonzales', classification: 'DOCUMENTED', claimId: 'HIST-GONZ-004' });
  const waitedBefore = view(world, id).encounter.waiting?.count || 0;
  const other = world.entities[dispatchReport(world, 'gonzales-outcome', id)];
  assert.ok(until(world, () => other.location.siteId === world.households[id].homeSiteId && !other.travel), 'the second rider never reached the gate');
  stepWorld(world);
  assert.equal(visit.status, 'open');
  assert.equal(visitsOf(world, id, 'gonzales-outcome').length, 0, 'a different word was folded into a visit about something else, or told over it');
  assert.equal(knows(world, id, 'gonzales-outcome'), undefined, 'the family knows what the second rider has not yet said');
  assert.equal(view(world, id).encounter.waiting?.count, waitedBefore + 1, 'the rider at the gate is not counted among what waits');
  assert.match(view(world, id).encounter.waiting.words, /waiting for your family after this/);
  applyAction(world, id, { action: 'leave-rider', entityId: visit.listenerId });
  assert.ok(until(world, () => openFor(world, id)), 'the waiting rider never spoke');
  const next = openFor(world, id);
  assert.equal(next.carrierId, other.id);
  assert.ok(next.openedMinute >= visit.closedMinute);
  assert.equal(knows(world, id, 'gonzales-outcome').receivedMinute, next.openedMinute);
});

test('a question put while a rider talks waits behind him; one already in front of the family stays where it is', () => {
  const { world, id } = withStraight('one-rider-queue');
  dispatchReport(world, TOPIC, id, 'confirmed');
  assert.ok(until(world, () => openFor(world, id)));
  stepWorld(world);
  const request = world.requests[id];
  assert.ok(request?.status === 'open', 'the neighbour never came to the door');
  const visit = openFor(world, id);
  assert.ok(request.offeredMinute >= visit.openedMinute, 'the neighbour came before the rider: this proves nothing');
  // Put, and written in the family's record, when it came; not shown until he has gone.
  assert.ok(world.events.some(event => event.id === request.id && event.householdId === id), 'the question is not in the record');
  assert.equal(view(world, id).request, null, 'the question is shown over the rider still talking');
  assert.equal(view(world, id).encounter.waiting?.count, 1);
  assert.match(view(world, id).encounter.waiting.words, /One more thing is waiting/);
  applyAction(world, id, { action: 'leave-rider', entityId: visit.listenerId });
  assert.equal(view(world, id).request?.kind, 'supplies', 'the question did not come up once the rider had gone');
  assert.equal(view(world, id).encounter.waiting, undefined);

  // The other way round: a question the family already has in front of it is not taken away when a rider comes.
  const { world: other, id: home } = withStraight('one-rider-queue-before');
  establishTruth(other, { id: 'gonzales-outcome', text: 'The fight at the camp is over.', siteId: 'gonzales', classification: 'DOCUMENTED', claimId: 'HIST-GONZ-004' });
  dispatchReport(other, TOPIC, home, 'confirmed');
  assert.ok(until(other, () => openFor(other, home)));
  stepWorld(other);
  applyAction(other, home, { action: 'leave-rider', entityId: openFor(other, home).listenerId });
  assert.equal(view(other, home).request?.kind, 'supplies');
  dispatchReport(other, 'gonzales-outcome', home);
  assert.ok(until(other, () => openFor(other, home)), 'the second rider never came');
  assert.equal(view(other, home).request?.kind, 'supplies', 'a question already in front of the family was taken away when a rider came');
});

test('a family sees one rider bring each word, however many ride up together', () => {
  // The director's own riders: one for every family, all leaving town at the same minute.
  const world = createGonzalesWorld('one-rider-pack', 15);
  world.status = 'running';
  let most = null;
  const seen = new Set();
  for (let tick = 0; tick < 400 && seen.size < 15; tick++) {
    stepWorld(world);
    for (const visit of Object.values(world.encounters)) {
      if (seen.has(visit.id) || visit.topicId !== TOPIC) continue;
      seen.add(visit.id);
      const family = world.households[visit.householdId].members.map(member => world.entities[member]);
      const near = Object.values(world.entities).filter(one => one.courier && !one.gone && (one.report?.inPerson || one.leaving)
        && family.some(person => Math.hypot(one.location.x - person.location.x, one.location.y - person.location.y) <= seenComing(world)));
      const drawn = view(world, visit.householdId).others.filter(other => other.carrier);
      assert.deepEqual(drawn.map(other => other.id), [visit.carrierId], `${visit.householdId} is drawn ${drawn.length} riders as its own reins in, with ${near.length} in sight`);
      if (!most || near.length > most.near) most = { householdId: visit.householdId, near: near.length };
    }
  }
  assert.ok(most?.near >= 3, `no family had more than ${most?.near} riders in sight: this proves nothing about a crowd`);
});

test('a class saved with a second rider standing at the gate of a family still being told opens and takes his word into the visit', () => {
  const { world, id } = withStraight('one-rider-save');
  dispatchReport(world, TOPIC, id, 'unconfirmed');
  assert.ok(until(world, () => openFor(world, id)));
  const visit = openFor(world, id);
  // What a class saved before 2026-09-29 could hold: a second rider arrived and waiting his turn, and no `joined` on the visit.
  const second = world.entities[dispatchReport(world, TOPIC, id, 'confirmed')];
  const gate = world.map.sites[world.households[id].homeSiteId];
  Object.assign(second, { travel: null, task: 'rest', location: { x: gate.x, y: gate.y, siteId: gate.id } });
  const dir = mkdtempSync(join(tmpdir(), 'texas-one-rider-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const reloaded = readSave(join(dir, 'save.json')).world;
    validateWorld(reloaded);
    stepWorld(reloaded);
    assert.ok(!view(reloaded, id).others.some(other => other.id === second.id), 'the rider whose word was taken into the visit is still drawn');
    assert.equal(visitsOf(reloaded, id).length, 1);
    assert.equal(reloaded.encounters[visit.id].status, 'open');
    assert.equal(knows(reloaded, id).status, 'confirmed', 'the waiting rider\'s word was not taken into the visit');
    assert.equal(reloaded.entities[second.id].report, undefined);
    validateWorld(reloaded);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

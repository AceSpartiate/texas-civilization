// A rider leaves in time for the question behind him (owner, 2026-09-29, choosing "Rider leaves at dawn"; docs/COLONIES.md §5.4b,
// `FIC-GONZ-909`).
//
// A question the word raises waits behind the rider until the student has heard him out - up to his ninety real seconds
// (sim/encounters.mjs `questionWaits`). At the Quick pace, a second a tick, a rumor that came late in the days before the fight
// waited behind him past the fight's dawn, which is when the rumor's question closes, and the family was never asked. Now a rider
// nobody has sent on rides on early enough that the question comes up with its full ninety seconds before the calendar closes it
// (`riderMustGo`), or at once if the calendar cannot give that much. Each test fails under the injections in
// scripts/rider-deadline-injections.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, dispatchReport, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { findPath } from '../sim/geography.mjs';
import { QUEUED_QUESTION_MS } from '../sim/decision-budget.mjs';

const TOPIC = 'cannon-request';
const QUICK_MS = 1000;
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const openFor = (world, householdId) => Object.values(world.encounters).find(one => one.householdId === householdId && one.status === 'open');

/**
 * A class played in process to `before` minutes of the calendar ahead of the fight's dawn, a played family at home that has not
 * heard, and a rider sent to it with the word as a rumor; from then on every tick is a Quick one and nobody answers anything.
 * Returns when the rumor's question is first shown, with the real time left to answer it before dawn.
 */
function lateRumor(seed, before, map = 'gonzales') {
  const world = createGonzalesWorld(seed, 5, { map });
  world.status = 'running';
  for (const id of Object.keys(world.households)) world.director.dispatches[id] = true;
  const dawn = momentOf(world, 'approach');
  while (world.minute < dawn - before) stepWorld(world);
  const household = Object.values(world.households).find(one => !world.knowledge.households[one.id][TOPIC] && (one.settlementId || 'gonzales') === 'gonzales'
    && one.members.every(id => world.entities[id].location.siteId !== 'gonzales'));
  assert.ok(household, 'no family at home has yet to hear');
  household.played = true;
  dispatchReport(world, TOPIC, household.id, 'rumor');
  let met = null, shown = null, ticks = 0;
  for (; ticks < 600 && world.minute < dawn; ticks++) {
    stepWorld(world, { realMs: QUICK_MS });
    met ??= Object.values(world.encounters).find(one => one.householdId === household.id) || null;
    const question = view(world, household.id).request;
    if (met && question?.kind === 'rumor' && question.status === 'open') { shown = question; break; }
  }
  // The real seconds left before dawn closes it, at a second a tick, counted by running the calendar on.
  let left = 0;
  if (shown) {
    const copy = structuredClone(world);
    for (let tick = 0; tick < 2000 && copy.minute < dawn; tick++) { stepWorld(copy, { realMs: QUICK_MS }); if (copy.minute < dawn) left += QUICK_MS; }
  }
  return { world, household, met, shown, left, dawn };
}

test('at the Quick pace a rumor arriving late is still asked, the rider riding on early to leave it its ninety seconds before dawn', () => {
  // The invented country's single twenty-minute clock: early enough that the rider could have stood his whole ninety seconds,
  // and late enough that the question would then have had less than its own ninety before dawn.
  const { world, household, met, shown, left } = lateRumor('rider-deadline-gonzales', 2600);
  assert.ok(met, 'the rider never reached the family');
  assert.ok(shown, "the rumor's question was never shown before dawn");
  assert.ok(left >= QUEUED_QUESTION_MS, `the question came up with ${left / 1000} real seconds before dawn, not ${QUEUED_QUESTION_MS / 1000}`);
  assert.equal(met.status, 'closed', 'the question was shown over the rider still talking');
  assert.equal(met.reason, 'unanswered', 'the rider went some other way than riding on');
  // He stood a while first - this is the rider leaving early, not the calendar having no time to give at all.
  assert.ok(met.closedMinute - met.openedMinute >= 3 * 20, `the rider rode on ${met.closedMinute - met.openedMinute} minutes after he spoke`);
  assert.ok(met.closedMinute - met.openedMinute < 85 * 20, 'the rider stood his whole ninety seconds: nothing sent him on early');
  // And answerable: going to see is taken while the question stands.
  applyAction(world, household.id, { action: 'go-see', entityId: household.principalId });
  assert.equal(world.rumors[household.id].status, 'accepted');
  validateWorld(world);
});

for (const [map, before, label, least] of [['gonzales', 1000, 'the invented country', 10_000], ['colonies', 5740 - 3900, "the real land, the owner's case: word at about minute 3,900", 30_000], ['colonies', 2900, 'the real land a day earlier, on its hour-long ticks: counted on the calendar after he has gone', 30_000]]) {
  test(`a rumor arriving too late for a rider's ninety seconds is shown at once, the rider sent on, and answered before dawn (${label})`, () => {
    const { world, household, met, shown, left, dawn } = lateRumor(`rider-deadline-late-${map}`, before, map);
    assert.ok(met, 'the rider never reached the family');
    assert.ok(shown, "the rumor's question was never shown before dawn");
    assert.equal(met.status, 'closed', 'the question was shown over the rider still talking');
    assert.ok(met.closedMinute - met.openedMinute <= 60, `the rider stood talking ${met.closedMinute - met.openedMinute} minutes when the calendar could not spare him`);
    assert.ok(left >= least, `shown with only ${left / 1000} real seconds before dawn`);
    assert.ok(world.minute < dawn);
    applyAction(world, household.id, { action: 'go-see', entityId: household.principalId });
    assert.equal(world.rumors[household.id].status, 'accepted');
  });
}

test('a rider whose question the calendar does not close soon keeps his ninety seconds', () => {
  // A family on a track straight from town, so the word comes to it confirmed and the neighbour asks at the door.
  let world = null, household = null;
  for (let n = 0; n < 20 && !household; n++) {
    world = createGonzalesWorld(`rider-deadline-keeps-${n}`, 5);
    household = Object.values(world.households).find(one => findPath(world.map, 'gonzales', one.homeSiteId).nodes.length === 2);
  }
  assert.ok(household, 'no seed has a family on a track straight from town');
  world.status = 'running';
  for (const id of Object.keys(world.households)) world.director.dispatches[id] = true;
  const dawn = momentOf(world, 'approach');
  while (world.minute < dawn - 2600) stepWorld(world);
  assert.ok(!world.knowledge.households[household.id][TOPIC] && household.members.every(id => world.entities[id].location.siteId !== 'gonzales'), 'the family heard, or is in town');
  household.played = true;
  // Confirmed word: the neighbour's request, which the calendar closes, is asked on it - with the rider standing well clear of dawn.
  dispatchReport(world, TOPIC, household.id, 'confirmed');
  let met = null;
  for (let tick = 0; tick < 60 && !met; tick++) { stepWorld(world, { realMs: QUICK_MS }); met = openFor(world, household.id); }
  assert.ok(met, 'the rider never reached the family');
  // With the request's dawn pushed far off, nothing hurries him: he stands his ninety seconds.
  stepWorld(world, { realMs: QUICK_MS });
  assert.ok(world.requests[household.id], 'no question was put behind him');
  world.requests[household.id].closes = world.minute + 100000;
  let stood = 0;
  for (; stood < 200 && met.status === 'open'; stood++) stepWorld(world, { realMs: QUICK_MS });
  assert.ok(stood >= 85, `the rider rode on after ${stood} seconds with nothing pressing him`);
});

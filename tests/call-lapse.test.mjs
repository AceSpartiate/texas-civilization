// A settlement's call to turn out lapses after a while (owner, 2026-09-27, by multiple choice: "Lapse after a while", with the
// option's own example of five minutes after the rider arrives; sim/decision-budget.mjs `CALL_BUDGET_MS`, sim/calls.mjs
// `lapseCall`, `FIC-GONZ-636`). Only a played family whose student is at the screen; not counted while the Host has paused
// (no running tick carries real time) or while that family's student is still in the guided start. On lapse nothing is chosen,
// the journal says so, and a rider still standing with the family rides on. Each test is proved by a mutation that fails it and
// no other (scripts/military-regression-check.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
// Read through the module, so the old code fails these tests one by one rather than the whole file on a missing name.
import * as budget from '../sim/decision-budget.mjs';
const CALL_BUDGET_MS = budget.CALL_BUDGET_MS ?? 300_000;
import { LESSON_ENABLED, STEPS, inLesson, stopLesson } from '../sim/lesson.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
/** The rider who brought the word, let go as a student lets him go with Done. */
const heardOut = (world, householdId) => {
  for (const one of Object.values(world.encounters)) if (one.householdId === householdId && one.status === 'open' && !one.kind) applyAction(world, householdId, { action: 'leave-rider', entityId: one.listenerId });
};
let shared = null;
/** A real-land class at the moment a far family is first asked its settlement's call, with the rider still at its gate. */
const asked = () => {
  const made = shared ??= (() => {
    const world = createGonzalesWorld('call-lapse', 15, { map: 'colonies' });
    world.status = 'running';
    for (let tick = 0; tick < 1500; tick++) {
      stepWorld(world);
      const hit = Object.entries(world.calls || {}).find(([id, call]) => call.status === 'open' && world.households[id].settlementId !== 'gonzales'
        && Object.values(world.encounters || {}).some(one => one.householdId === id && one.status === 'open'));
      // Played, with its guided start behind it (a family still in it is the second test's business).
      if (hit) { Object.assign(world.households[hit[0]], { played: true, lesson: { step: 'done' } }); world.testHousehold = hit[0]; return world; }
    }
    throw new Error('no far family was asked while its rider stood there');
  })();
  const world = structuredClone(made);
  return { world, household: world.households[world.testHousehold], call: world.calls[world.testHousehold] };
};

test('a played family\'s settlement call lapses after five real minutes: nobody turns out, the journal says so, and the rider rides on', () => {
  const { world, household, call } = asked();
  assert.equal(budget.CALL_BUDGET_MS, 300_000, 'the call does not stand five minutes');
  assert.equal(inLesson(world, household), false, 'the fixture family is in the guided start');
  // While the rider who brought the word still stands there the call waits behind him, and its five minutes do not run
  // (owner, 2026-09-29: "Each queued request's real-time budget must not run out while it waits behind another";
  // sim/encounters.mjs `questionWaits`, `FIC-GONZ-909`). They start when he has gone.
  assert.equal(view(world, household.id).request, null, 'the call was shown over the rider still talking');
  assert.equal(view(world, household.id).encounter.waiting?.count, 1, "the rider's conversation does not say something waits");
  stepWorld(world, { realMs: 60_000 });
  assert.equal(world.decisionClock?.[`call:${household.id}`], undefined, "the call's minutes ran while it waited behind the rider");
  const meeting = Object.values(world.encounters).find(one => one.householdId === household.id && one.topicId === 'cannon-request');
  heardOut(world, household.id);
  assert.match(view(world, household.id).request.lapses || '', /the call lapses and nobody from the family turns out/, 'the lapse is not said before it happens');
  stepWorld(world, { realMs: 200_000 });
  assert.equal(call.status, 'open', 'the call closed before its five minutes');
  assert.equal(view(world, household.id).request.pressing, true, 'two thirds of the way through, the card was not told it is pressing');
  stepWorld(world, { realMs: 100_000 });
  assert.equal(call.status, 'expired', 'the call did not lapse after five minutes');
  assert.equal(call.lapsed, true);
  assert.deepEqual(call.actorIds, undefined, 'somebody turned out for a family that never answered');
  assert.ok(!world.events.some(event => event.householdId === household.id && ['turn-out', 'stay-put'].includes(event.decision)), 'a lapsed call was written down as a choice');
  assert.ok(world.events.some(event => event.householdId === household.id && event.lapsed && /Nobody from this family answered the settlement's call in time, and it lapsed\. Nothing was chosen: nobody from the family turned out\./.test(event.text)), 'the journal does not say the call lapsed');
  assert.equal(view(world, household.id).request.lapsed, true, 'the card does not say the call lapsed');
  assert.equal(meeting.status, 'closed', 'the rider is still standing with the family');
  stepWorld(world);
  const rider = world.entities[meeting.carrierId];
  assert.ok(rider.gone || rider.travel?.purpose === 'leave', 'the rider did not leave once the call lapsed');
  assert.throws(() => applyAction(world, household.id, { action: 'turn-out', entityId: household.principalId }), /Nobody is asking/);
  validateWorld(world);
});

// Skipped while the guided start is switched off (owner, 2026-09-28): it exercises only the guided start.
test('the call\'s minutes do not run while the family\'s student is in the guided start, and do once they have closed it', { skip: !LESSON_ENABLED && 'the guided start is switched off (owner, 2026-09-28; sim/lesson.mjs LESSON_ENABLED)' }, () => {
  const { world, household, call } = asked();
  household.lesson = { step: STEPS[2].id };
  assert.equal(inLesson(world, household), true);
  stepWorld(world, { realMs: 600_000 });
  assert.equal(call.status, 'open', 'the call lapsed while the student was being walked through the guided start');
  stopLesson(world, household, { now: 0 });
  stepWorld(world, { realMs: CALL_BUDGET_MS });
  assert.notEqual(call.status, 'open', 'the call never lapsed once the guided start was closed');
});

test('nobody\'s call lapses for a family whose student has gone or that nobody plays: those are the director\'s, answered at their shares', () => {
  for (const setUp of [household => { household.absent = true; }, household => { household.played = false; }]) {
    const { world, household, call } = asked();
    setUp(household);
    stepWorld(world, { realMs: 3_600_000 });
    assert.equal(call.status, 'open', 'a call of a family nobody is at the screen for lapsed');
    assert.equal(world.decisionClock?.[`call:${household.id}`], undefined);
  }
});

test('the call\'s budget is a server option carried through the tick, apart from the military questions\'', () => {
  const { world, call } = asked();
  heardOut(world, world.testHousehold);
  stepWorld(world, { realMs: 1_500, callBudgetMs: 1_000, decisionBudgetMs: 900_000 });
  assert.notEqual(call.status, 'open', 'a one-second call budget did not run out in a second and a half');
  const other = asked();
  heardOut(other.world, other.world.testHousehold);
  stepWorld(other.world, { realMs: 100_000, decisionBudgetMs: 1_000 });
  assert.equal(other.call.status, 'open', 'the call ran on the military questions\' ninety seconds');
});

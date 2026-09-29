// The guided start switched off (owner, 2026-09-28: "The starting tutorial needs to be removed for now. We'll redo it from
// scratch later. It currently just gets in the way of things."). sim/lesson.mjs `LESSON_ENABLED`; docs/LESSON.md, top.
//
// While it is off, a new family starts with every order open, nothing of a lesson reaches its page, nothing is stored, and the
// settlement's call spends its five minutes from the moment it arrives. tests/lesson.test.mjs keeps the guided start's own tests,
// skipped while it is off; this file always runs, and fails the day the switch is flipped without the owner's rework.
//
// Proven by injection (scripts/tips-injections.mjs: "the guided start is switched back on").
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { LESSON_ENABLED, inLesson, lessonRefusal } from '../sim/lesson.mjs';
import { spendDecisionBudget } from '../sim/decision-budget.mjs';
import { heardOut } from './support/heard-out.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false, now: 1_800_000_000_000 });

test('the guided start is off: a new family is refused nothing by it, is sent no lesson, and has none stored', () => {
  assert.equal(LESSON_ENABLED, false, 'the guided start was switched back on; the owner asked for it to be redone from scratch first');
  const world = createGonzalesWorld('lesson-off', 5);
  const household = world.households['hh-1'];
  household.played = true;
  world.status = 'running';
  // The first tick of a class, the wagon still on the track in: the moment the guided start used to begin.
  stepWorld(world);
  assert.equal(household.lesson, undefined, 'a lesson was stored for a new family');
  const seen = view(world, 'hh-1');
  assert.equal('lesson' in seen, false, 'the page was sent a lesson');
  assert.equal('lessonResume' in seen, false, 'the page was offered to resume a lesson');
  for (const id of ['chore:build-house', 'survey-plot', 'chore:plant-field', 'chore:dig-well', 'chore:sell-cotton', 'chore:nurse-home', 'chore:enlist-regular']) {
    const input = id.startsWith('chore:') ? { action: 'chore', chore: id.slice(6) } : { action: id };
    assert.equal(lessonRefusal(world, household, input), null, `${id} is refused by a guided start that is off`);
  }
  // Played on to the land: still nothing.
  for (let tick = 0; tick < 4000 && household.arriving; tick++) stepWorld(world);
  assert.equal(household.lesson, undefined);
  assert.equal(inLesson(world, household), false);
  // The X is not there to press, and says so rather than pretending.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'stop-lesson' }), /no guided start running/);
  // A class saved mid-lesson before today opens with its stored step kept and read by nothing.
  household.lesson = { step: 'house' };
  validateWorld(world);
  assert.equal(lessonRefusal(world, household, { action: 'chore', chore: 'plant-field' }), null, 'an old save\'s lesson still gates');
  assert.equal('lesson' in view(world, 'hh-1'), false);
});

test('the settlement\'s call spends its minutes from the moment it arrives: nothing holds it for a guided start', () => {
  const world = createGonzalesWorld('lesson-off-call', 5, { map: 'colonies' });
  const household = world.households['hh-1'];
  household.played = true;
  world.status = 'running';
  for (let tick = 0; tick < 6000 && world.calls?.['hh-1']?.status !== 'open'; tick++) stepWorld(world);
  assert.equal(world.calls?.['hh-1']?.status, 'open', 'no call reached the family, so this proves nothing');
  heardOut(world, 'hh-1');
  // A family that would have been on step 3 of the old guided start, whose call's clock the lesson used to hold.
  household.lesson = { step: 'house' };
  spendDecisionBudget(world, 1000, { heldFor: one => inLesson(world, one) });
  assert.ok(world.decisionClock?.['call:hh-1']?.spent >= 1000, `the call's minutes did not run: ${JSON.stringify(world.decisionClock)}`);
});

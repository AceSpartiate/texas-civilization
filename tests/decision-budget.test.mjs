// The real-time budget of an unanswered military question (owner, 2026-09-22; sim/decision-budget.mjs,
// docs/MILITARY_EXPERIENCE.md step 4). Each test guards one rule and is proved by a mutation that fails it and no other
// (scripts/military-regression-check.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { MILITARY_DECISION_MINUTES } from '../sim/military-pacing.mjs';
import { COURIER_OFFERED, settleUnanswered, share } from '../sim/alamo.mjs';
import { DECISION_BUDGET_MS, decisionPressing, realTimeMeter, spendDecisionBudget } from '../sim/decision-budget.mjs';
import { stormedIn } from '../sim/army.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);

let shared = null;
/** A real-land class with one played man shut in the Alamo and Travis's runner standing with him, waiting for an answer. */
const waiting = () => {
  const world = structuredClone(shared ??= (() => {
    const made = createGonzalesWorld('decision-budget-class', 8, { map: 'colonies' });
    for (const household of Object.values(made.households)) rollFamily(made, household);
    made.status = 'running';
    until(made, () => made.director.complete);
    beginSecondPeriod(made);
    made.status = 'running';
    until(made, () => made.director.milestones['winter-news']);
    const man = Object.values(made.entities).find(person => person.householdId && person.sex === 'male' && (person.age ?? 30) >= 16 && person.health.condition !== 'dead');
    const site = made.map.sites.bexar;
    Object.assign(man, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' } });
    man.service = { kind: 'garrison', status: 'serving', since: made.minute, siteId: 'bexar' };
    made.households[man.householdId].played = true;
    made.budgetMan = man.id;
    untilMoment(made, 'alamo-siege');
    untilMoment(made, 'courier-1-opens');
    until(made, () => man.service.courier === 'open', 20);
    return made;
  })());
  return { world, man: world.entities[world.budgetMan] };
};

/** A small scene of one played person, for the army's and Houston's questions. */
const scene = () => ({
  seed: 'budget-scene', tick: 0, minute: 0, events: [], nextEventId: 1,
  households: { h: { id: 'h', played: true, members: ['p'] } },
  entities: { p: { id: 'p', name: 'Amos', kind: 'person', householdId: 'h', health: { condition: 'well' }, service: { kind: 'houston', status: 'serving', siteId: 'gonzales' } } },
});

test('an unanswered courier question runs out after ninety real seconds: it lapses, said in the journal, the runner gone, and the class no longer slowed', () => {
  const { world, man } = waiting();
  assert.equal(DECISION_BUDGET_MS, 90_000);
  assert.equal(calendarMinutes(world), MILITARY_DECISION_MINUTES, 'an open question did not hold reading pace');
  const early = waiting();
  stepWorld(early.world, { realMs: 89_999 });
  assert.equal(early.man.service.courier, 'open', 'the question closed before its ninety seconds');
  stepWorld(world, { realMs: 60_000 });
  assert.equal(man.service.courier, 'open', 'the question closed before its ninety seconds');
  assert.equal(view(world, man.householdId).encounter.pressing, true, 'two thirds of the way through, the page was not told it is pressing');
  // The rest of it in one tick, so this test holds whether or not the ticks add up (that is the save test's rule).
  stepWorld(world, { realMs: 90_000 });
  assert.ok(!['open', 'coming'].includes(man.service.courier), `the question did not close: ${man.service.courier}`);
  assert.ok(world.events.some(event => event.actorId === man.id && /the question lapsed/.test(event.text)), 'the journal does not say the question lapsed');
  const meeting = Object.values(world.encounters).find(one => one.kind === 'alamo-runner' && one.listenerId === man.id);
  assert.equal(meeting.status, 'closed', 'the runner is still standing there');
  assert.equal(meeting.reason, 'unanswered');
  assert.ok(calendarMinutes(world) > MILITARY_DECISION_MINUTES, 'the class is still slowed for a question already decided');
  validateWorld(world);
});

// Owner, 2026-09-27: "questions that are not answered fast enough disappear." (sim/lapse.mjs)
test('an unanswered courier question lapses with nothing chosen: nobody is offered, and each man stays at his post, said plainly', () => {
  const people = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, name: `Man ${i}`, householdId: 'h', health: { condition: 'well' }, service: { kind: 'garrison', status: 'serving', besieged: true, courier: 'open' } }));
  const world = { seed: 'fallback', tick: 0, minute: 0, events: [], nextEventId: 1, households: { h: { id: 'h', played: true } }, entities: Object.fromEntries(people.map(person => [person.id, person])) };
  // Somebody the share would have offered, so a fallback that still decided for the family could not pass by luck.
  assert.ok(people.some(person => share(world, person.id, 'courier-offer') < COURIER_OFFERED), 'nobody here would have offered at auto\'s share');
  for (const person of people) settleUnanswered(world, person, 'budget');
  for (const person of people) {
    assert.equal(person.service.courier, 'stays', `${person.name} was offered as a courier by nobody`);
    assert.ok(world.events.some(event => event.actorId === person.id && event.lapsed && /Nobody answered Travis's runner for .* in time, and the question lapsed\. Nothing was chosen: .* stays at their post/.test(event.text)), `${person.name}'s record does not say plainly that the question lapsed and what it meant`);
  }
  assert.ok(!world.events.some(event => event.decision), 'a lapsed question was written down as a choice');
});

test('somebody nobody is answering for is still decided as auto decides when the riders go: that rule never depended on the fallback', () => {
  const people = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, name: `Man ${i}`, householdId: 'h', health: { condition: 'well' }, service: { kind: 'garrison', status: 'serving', besieged: true, courier: 'open' } }));
  const world = { seed: 'fallback', tick: 0, minute: 0, events: [], nextEventId: 1, households: { h: { id: 'h', played: true, absent: true } }, entities: Object.fromEntries(people.map(person => [person.id, person])) };
  for (const person of people) settleUnanswered(world, person, 'deadline');
  for (const person of people) assert.equal(person.service.courier === 'volunteered', share(world, person.id, 'courier-offer') < COURIER_OFFERED, `${person.name} did not decide at auto's share`);
});

test('a Host\'s pause is never counted: the meter forgets where it was whenever a tick does not run', () => {
  let at = 0;
  const meter = realTimeMeter({ now: () => at });
  assert.equal(meter.lap(true), 0, 'the first tick counted time from before the class ran');
  at = 9_500; assert.equal(meter.lap(true), 9_500);
  at = 12_000; assert.equal(meter.lap(false), 0);
  at = 400_000; assert.equal(meter.lap(true), 0, 'the paused minutes were counted against the answer');
  at = 409_500; assert.equal(meter.lap(true), 9_500);
  at = 1_000_000; assert.equal(meter.lap(true, 30_000), 30_000, 'a stalled process counted more than its cap');
});

test('the budget is configurable: a server option carried through the tick decides it', () => {
  const { world, man } = waiting();
  stepWorld(world, { realMs: 1_500, decisionBudgetMs: 1_000 });
  assert.ok(!['open', 'coming'].includes(man.service.courier), 'a one-second budget did not run out in a second and a half');
});

test('Houston\'s camp question runs out and lapses: he does not leave, and the journal says so', () => {
  for (const key of ['leave', 'road']) {
    const world = scene();
    world.entities.p.service[key] = 'open';
    spendDecisionBudget(world, 89_999);
    assert.equal(world.entities.p.service[key], 'open');
    delete world.decisionClock;
    spendDecisionBudget(world, 90_000);
    assert.equal(world.entities.p.service[key], 'no', `the camp question ${key} did not run out into nothing`);
    assert.equal(world.entities.p.service.status, 'serving', 'a man nobody answered for left the army');
    assert.ok(world.events.some(event => event.lapsed && /Nobody answered for Amos in time, and the question lapsed\. Nothing was chosen/.test(event.text)), 'the journal does not say the question lapsed');
    assert.ok(!world.events.some(event => event.decision), 'a lapsed question was written down as a choice');
  }
});

test('an army question runs out and lapses: nobody is sent, nobody starts home, and the journal says so', () => {
  for (const key of ['storm', 'pledge', 'grass', 'winter', 'milam', 'reinforce']) {
    const world = scene();
    world.entities.p.service = undefined;
    world.army = { members: ['p'], questions: { [key]: { asks: { p: 'open' }, closed: false, openedMinute: 0 } } };
    spendDecisionBudget(world, 90_000);
    assert.equal(world.army.questions[key].asks.p, 'silent', `the ${key} question did not lapse`);
    assert.deepEqual(world.army.members, ['p'], `a lapsed ${key} question took Amos out of the ranks`);
    assert.ok(!stormedIn(world, 'p'), `a lapsed ${key} question sent Amos into the town`);
    assert.ok(world.events.some(event => event.lapsed && /Nobody answered for Amos in time, and the question lapsed\. Nothing was chosen/.test(event.text)), `the journal does not say the ${key} question lapsed`);
    assert.ok(!world.events.some(event => event.decision), 'a lapsed question was written down as a choice');
  }
});

test('Bowie and Fannin\'s division question runs out and lapses: he stays with the main army, and the journal says so', () => {
  const world = scene();
  world.entities.p.service = undefined;
  world.army = { members: ['p'], detachment: { asks: { p: 'open' }, closed: false } };
  spendDecisionBudget(world, 90_000);
  assert.equal(world.army.detachment.asks.p, 'stay', 'the detachment question sent him ahead, or did not run out');
  assert.ok(world.events.some(event => event.lapsed && /Nobody answered for Amos in time, and the question lapsed\. Nothing was chosen: Amos did not go ahead/.test(event.text)), 'the journal does not say the question lapsed');
});

test('nobody\'s budget runs for a family whose student has gone or a person on auto: they are the director\'s', () => {
  for (const setUp of [world => { world.households.h.absent = true; }, world => { world.entities.p.auto = true; }]) {
    const world = scene();
    setUp(world);
    world.entities.p.service.leave = 'open';
    spendDecisionBudget(world, 500_000);
    assert.equal(world.entities.p.service.leave, 'open', 'an absent or automatic family\'s question was run down by the clock');
    assert.equal(world.decisionClock, undefined);
  }
});

test('the budget adds up across ticks and is kept in the save, so reconnecting does not start it again', () => {
  let { world, man } = waiting();
  for (let i = 0; i < 5; i++) stepWorld(world, { realMs: 10_000 });
  assert.equal(decisionPressing(world, man.id), false);
  world = JSON.parse(JSON.stringify(world));
  validateWorld(world);
  man = world.entities[man.id];
  for (let i = 0; i < 2; i++) stepWorld(world, { realMs: 10_000 });
  assert.equal(decisionPressing(world, man.id), true, 'seventy seconds is not two thirds of the way');
  for (let i = 0; i < 2; i++) stepWorld(world, { realMs: 10_000 });
  assert.ok(!['open', 'coming'].includes(man.service.courier), 'ninety seconds spent across a save did not run out');
});

test('a question answered is forgotten, so the next one starts its budget from nothing', () => {
  const world = scene();
  world.entities.p.service.leave = 'open';
  spendDecisionBudget(world, 80_000);
  world.entities.p.service.leave = 'no';
  spendDecisionBudget(world, 0);
  world.entities.p.service.leave = 'open';
  spendDecisionBudget(world, 80_000);
  assert.equal(world.entities.p.service.leave, 'open', 'a question asked again inherited the old one\'s spent time');
});

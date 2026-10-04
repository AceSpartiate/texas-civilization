// Real-time limits (owner, 2026-09-29, by multiple choice on the triage's C2: "a rider 90 s, the order to leave 3 min, ¡Alto!
// about 30 s with the chase held, and road and hunt questions timed in real seconds"; docs/audits/2026-09-29-triage.md 1.2 and
// 1.3; sim/decision-budget.mjs `QUESTION_BUDGETS`, `FIC-GONZ-906`). Each question a student is answering waits the same real
// seconds at every pace and in every phase, then is answered as it always was; the page counts the real time down.
//
// Each test here was proven by injecting the regression it guards (scripts/real-time-limits-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { calendarMinutes, withCalendarStep } from '../sim/clock.mjs';
import { QUESTION_BUDGETS, riderOnLimit } from '../sim/decision-budget.mjs';
import { STUDY_TICK_MS } from '../sim/crops.mjs';
import { ORDER_GRACE_MINUTES } from '../sim/advance.mjs';
import { createSettledWorld } from './support/settled.mjs';
import { spring, until } from './support/scrape-spring.mjs';
import { sceneFor } from './support/scrape-scene.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const QUICK = 1000, STUDY = 9500;
/** Ticks a question of this budget waits at this many real milliseconds a tick. */
const ticksAt = (budget, ms) => Math.ceil(budget / ms);
/** Steps at a pace until `done`, and says how many ticks it took (null if it never was). */
function ticksUntil(world, done, ms, limit = 400) {
  for (let t = 1; t <= limit; t++) { stepWorld(world, { realMs: ms }); if (done()) return t; }
  return null;
}

// A rider stopped with a played family whose student is there, unanswered: the colonies' news reaching the first families.
let riderShared = null;
function riderScene() {
  riderShared ??= (() => {
    const world = createGonzalesWorld('limits-rider', 30, { map: 'colonies', neighbours: false });
    world.status = 'running';
    for (const household of Object.values(world.households)) household.played = true;
    for (let t = 0; t < 2000; t++) {
      stepWorld(world);
      const open = Object.values(world.encounters || {}).find(e => e.status === 'open' && !e.kind && !e.asked.length);
      if (open) return { world, id: open.id };
    }
    throw new Error('no rider ever stopped with anybody');
  })();
  const copy = structuredClone(riderShared.world);
  return { world: copy, encounter: copy.encounters[riderShared.id] };
}

test('a student\'s rider waits ninety real seconds, the same at Study and at Quick, and every question starts them again', () => {
  for (const ms of [STUDY, QUICK]) {
    const { world, encounter } = riderScene();
    // The rider's own clock, and only that: at Quick the neighbour's request behind him, which dawn closes, would send him on
    // early to leave it its time (owner, 2026-09-29, "Rider leaves at dawn"; tests/rider-deadline.test.mjs), so it is given no
    // closing minute here.
    for (const table of [world.requests, world.rumors, world.marches]) for (const question of Object.values(table || {})) delete question.closes;
    assert.ok(riderOnLimit(world, encounter), 'the rider is not on the real clock for a played family at its screen');
    const ticks = ticksUntil(world, () => encounter.status !== 'open', ms);
    assert.equal(encounter.reason, 'unanswered', `the rider at ${ms} ms a tick ended ${encounter.reason}, not by waiting`);
    assert.equal(ticks, ticksAt(QUESTION_BUDGETS.rider, ms), `at ${ms} ms a tick the rider waited ${ticks} ticks`);
    validateWorld(world);
  }
  // A question put to him halfway starts his ninety seconds again.
  const { world, encounter } = riderScene();
  for (let t = 0; t < 6; t++) stepWorld(world, { realMs: STUDY });
  const listener = world.entities[encounter.listenerId];
  const line = view(world, encounter.householdId).encounter.questions[0];
  assert.ok(line, 'there was nothing to ask him');
  applyAction(world, encounter.householdId, { action: 'ask-rider', entityId: listener.id, lineId: line.id });
  const after = ticksUntil(world, () => encounter.status !== 'open', STUDY);
  assert.equal(after, ticksAt(QUESTION_BUDGETS.rider, STUDY), `after a question he waited ${after} ticks more`);
});

test('a class the server does not measure spends none of it; the page is sent the real time left', () => {
  const { world, encounter } = riderScene();
  assert.equal(view(world, encounter.householdId).encounter.leftMs, QUESTION_BUDGETS.rider, 'the rider went to the page without his ninety seconds');
  // The first tick after a Resume carries nothing (sim/decision-budget.mjs `realTimeMeter`): nothing is spent.
  for (let t = 0; t < 30; t++) stepWorld(world, { realMs: 0 });
  assert.equal(encounter.status, 'open', 'ticks that took no real time ran the rider out');
  assert.equal(view(world, encounter.householdId).encounter.leftMs, QUESTION_BUDGETS.rider);
  for (let t = 0; t < 3; t++) stepWorld(world, { realMs: 4000 });
  assert.equal(view(world, encounter.householdId).encounter.leftMs, QUESTION_BUDGETS.rider - 12_000, 'the countdown is not the real time left');
});

test('the order to leave waits three real minutes at every pace, with the calendar held only while it does', () => {
  for (const ms of [STUDY, 4000]) {
    const world = spring();
    const household = world.households['hh-1'];
    household.played = true;
    stepWorld(world);
    assert.equal(household.flight?.status, 'ordered', 'the first family was not told to leave');
    const shown = view(world, household.id);
    assert.equal(shown.flight.leftMs, QUESTION_BUDGETS.flight, 'the order went to the page without its three minutes');
    const ticks = ticksUntil(world, () => household.flight.status !== 'ordered', ms);
    assert.equal(ticks, ticksAt(QUESTION_BUDGETS.flight, ms), `at ${ms} ms a tick the family was waited for ${ticks} ticks`);
    assert.ok(world.events.some(e => e.householdId === household.id && /Nobody gave the word, and the family could wait no longer/.test(e.text)), 'it did not go by silence');
    validateWorld(world);
  }
  // Held at the farming scale while it decides, and only then.
  const world = spring();
  const household = world.households['hh-1'];
  household.played = true;
  stepWorld(world);
  stepWorld(world, { realMs: STUDY });
  assert.equal(calendarMinutes(world), 20, 'the calendar did not hold for the family deciding');
  assert.equal(view(world, household.id).flight.leftMs, QUESTION_BUDGETS.flight - STUDY);
  // At Quick the order's day of grace (72 ticks held at twenty minutes, 72 real seconds) comes first, and the family goes then,
  // as it always did, so no farm is burned under a student still deciding (sim/auto.mjs `flightWaited`, its ceiling); the "!"
  // says so.
  const quick = spring();
  const hand = quick.households['hh-1'];
  hand.played = true;
  stepWorld(quick);
  stepWorld(quick, { realMs: QUICK });
  assert.equal(view(quick, hand.id).flight.leftMs, (ORDER_GRACE_MINUTES / 20 - 1) * QUICK, 'the "!" at Quick counts the three minutes the family will not get');
  const ticks = ticksUntil(quick, () => hand.flight.status !== 'ordered', QUICK);
  assert.equal(ticks + 1, ORDER_GRACE_MINUTES / 20, `at Quick the family was waited for ${ticks + 1} ticks`);
});

test('the road\'s question waits ninety real seconds at every pace before it lapses', () => {
  for (const ms of [STUDY, QUICK]) {
    const world = spring();
    const household = world.households['hh-1'];
    household.played = true;
    stepWorld(world);
    const main = world.entities[household.mainId || household.principalId];
    household.resources = { ...household.resources, food: 40, seed: 4, cotton: 2, powder: 3, money: 2 };
    applyAction(world, household.id, { action: 'flee', entityId: main.id, take: { food: 40, seed: 4, cotton: 2, powder: 3 }, refuge: 'san-felipe' });
    until(world, () => household.flight.ask?.id === 'bog', 200);
    assert.equal(household.flight.ask?.id, 'bog', 'the wagon never bogged, so this proves nothing');
    assert.equal(view(world, household.id).flight.ask.leftMs, QUESTION_BUDGETS.road);
    const ticks = ticksUntil(world, () => !household.flight.ask, ms);
    assert.equal(ticks, ticksAt(QUESTION_BUDGETS.road, ms), `at ${ms} ms a tick the road's question stood ${ticks} ticks`);
    assert.ok(world.events.some(e => e.householdId === household.id && e.lapsed && /the wagon stays in the mud/.test(e.text)), 'it did not lapse');
  }
});

test('¡Alto! waits thirty real seconds at every pace with the chase held: nobody moves until it is answered or lapses', () => {
  for (const ms of [STUDY, QUICK]) {
    const world = spring();
    const { household } = sceneFor(world, { kind: 'cavalry', how: 'wagon' });
    until(world, () => household.flight.ask?.id === 'alto', 20);
    assert.equal(household.flight.ask?.id, 'alto', 'the dragoons never called on the family to halt');
    const chase = household.flight.chase;
    const lead = chase.lead, gaps = chase.soldiers.map(one => one.g), leader = household.members.map(id => world.entities[id]).find(one => one.travel?.purpose === 'flee');
    const progress = leader.travel.progress;
    assert.equal(view(world, household.id).flight.ask.leftMs, QUESTION_BUDGETS.alto, 'the order went to the page without its thirty seconds');
    const limit = ticksAt(QUESTION_BUDGETS.alto, ms);
    for (let t = 1; t < limit; t++) {
      stepWorld(world, { realMs: ms });
      assert.equal(household.flight.ask?.id, 'alto', `the order lapsed after ${t} ticks at ${ms} ms a tick`);
      assert.equal(chase.lead, lead, 'the soldiers came on while the family was deciding');
      assert.deepEqual(chase.soldiers.map(one => one.g), gaps, 'the soldiers moved while the family was deciding');
      assert.ok(Math.abs(leader.travel.progress - progress) < 1e-9, 'the family drew away while the soldiers stood');
    }
    stepWorld(world, { realMs: ms });
    assert.notEqual(household.flight.ask?.id, 'alto', `the order was still open after its ${limit} ticks at ${ms} ms a tick`);
    assert.ok(world.events.some(e => e.householdId === household.id && e.lapsed && /soldiers ordered/.test(e.text)), 'the silence was not written down as a lapse');
    assert.equal(household.flight.chase.phase, 'caught');
  }
});

// Since 2026-10-02 the hunter's question is a sighting (owner: "if players click on it in time"; sim/hunt-aim.mjs): fifteen real
// seconds, not ninety, and then the hunter takes the shot himself rather than the question lapsing (tests/hunt-aim.test.mjs).
test('a hunter\'s sighting waits its fifteen real seconds in every phase: a tick of four hours does not end it', () => {
  // Twenty minutes a tick as at home, and four hours as in the winter (sim/clock.mjs `CALENDAR_SCALE.gathering`), where two
  // hours of the calendar was one tick. The invented country's one afternoon is too short for the campaign's twelve.
  for (const calendar of [20, 240]) {
    const world = createSettledWorld('limits-hunt');
    world.status = 'running';
    const household = world.households['hh-1'];
    household.played = true;
    household.resources.powder = 3;
    // The father: hunting is the men's work while he is at home (owner, 2026-10-03; sim/custom.mjs).
    const elena = world.entities['hh-1-thomas'];
    applyAction(world, 'hh-1', { action: 'chore', entityId: elena.id, chore: 'hunt-timber' });
    const step = () => withCalendarStep(world, calendar, () => stepWorld(world));
    for (let t = 0; t < 200 && !elena.chore?.ask; t++) step();
    assert.ok(elena.chore?.ask, 'the hunt never asked');
    assert.equal(view(world, 'hh-1').entities.find(one => one.id === elena.id).chore.ask.leftMs, QUESTION_BUDGETS.sighting, 'the sighting went to the page without its fifteen seconds');
    let ticks = 0;
    while (elena.chore?.ask && ticks < 100) { step(); ticks++; }
    assert.equal(ticks, ticksAt(QUESTION_BUDGETS.sighting, STUDY_TICK_MS), `at ${calendar} calendar minutes a tick the shot waited ${ticks} ticks`);
    assert.ok(world.events.some(e => e.actorId === elena.id && /Nobody answered\. .* decided alone/.test(e.text)), 'the hunter did not take the shot himself when the sighting ran out');
  }
});

test('a question nobody is reading keeps its own count: an unplayed family\'s rider is not on the real clock', () => {
  const { world, encounter } = riderScene();
  world.households[encounter.householdId].played = false;
  assert.equal(riderOnLimit(world, encounter), false, 'a family nobody plays was put on the real clock');
  assert.equal(view(world, encounter.householdId).encounter.leftMs, undefined, 'a family nobody reads was sent a countdown');
  // Nothing of the clock is kept for it.
  stepWorld(world, { realMs: STUDY });
  assert.ok(!Object.keys(world.decisionClock || {}).some(key => key.startsWith(`rider:${encounter.id}:`)), 'the clock ran for a family nobody reads');
});

// The "!"s ranked (docs/audits/2026-09-28-design.md S33, the owner's "fix the blockers" of 2026-09-28): one order across every
// row of the family's column, the most urgent first - ¡Alto!, the road's question, the order to leave, somebody very sick, a
// rider, the call, the army's questions - with the time left shown wherever a question will lapse; and the Watch alert
// standing aside for the family's own road (S35).
//
// Each test here was proven by injecting the regression it guards (scripts/tips-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, stepWorld } from '../sim/world.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { FLIGHT_PATIENCE } from '../sim/auto.mjs';
import { ROAD_PATIENCE_TICKS, askTicksLeft } from '../sim/road.mjs';
import { ALTO_PATIENCE_TICKS } from '../sim/pursuit.mjs';
import { NEED_KINDS, leftWords, needsOf, rankNeeds } from '../public/family-panel.js';
import { militaryNotices } from '../public/military-attention.js';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const people = ids => ids.map(id => ({ id, name: id.toUpperCase(), kind: 'person' }));

test('every "!" of the column is in one order, the most urgent first, numbered, with ties broken by the time left', () => {
  assert.deepEqual(NEED_KINDS.slice(0, 6), ['alto', 'road', 'flight', 'sick', 'rider', 'call'], 'the owner\'s order is not the order');
  assert.ok(NEED_KINDS.indexOf('call') < NEED_KINDS.indexOf('army'), 'the army\'s questions come before the call');
  const world = {
    role: 'student', household: { mainId: 'f', principalId: 'f' },
    entities: [
      ...people(['f', 'm', 'a', 'b', 'c']).map(one => ({
        ...one,
        ...(one.id === 'm' && { sickness: { grave: true, line: 'Very sick.' } }),
        ...(one.id === 'a' && { decisionLeftMs: 60_000 }),
        ...(one.id === 'b' && { decisionLeftMs: 20_000 }),
      })),
    ],
    army: { ours: [{ id: 'a', questions: [{ key: 'storm', answer: 'open' }] }, { id: 'b', questions: [{ key: 'storm', answer: 'open' }] }] },
    request: { status: 'open', kind: 'call', leftMs: 200_000, answerers: { c: [{ id: 'turn-out', can: true }], m: [{ id: 'turn-out', can: true }] } },
    flight: { status: 'fled', ask: { id: 'alto', text: '¡Alto!', ticksLeft: 2 } },
  };
  // The rows in the family's own order: father, mother, then the others. The ranking is by what waits on each.
  const ranked = rankNeeds(world, ['f', 'm', 'a', 'b', 'c'], { tickMs: 9500 });
  assert.deepEqual(ranked.map(one => [one.id, one.kind, one.rank]), [['f', 'alto', 1], ['m', 'sick', 2], ['c', 'call', 3], ['b', 'army', 4], ['a', 'army', 5]]);
  assert.equal(ranked[0].leftMs, 2 * 9500, 'the soldiers\' ticks were not read as seconds at the class\'s pace');
  assert.equal(ranked.find(one => one.id === 'm').more, 1, 'the sick mother can also answer the call, and that was lost');
  // Nobody with nothing waiting is ranked; a row's own needs are most urgent first too.
  assert.deepEqual(rankNeeds({ ...world, flight: undefined, army: undefined, request: undefined, entities: people(['f']) }, ['f']), []);
  assert.deepEqual(needsOf(world, 'm').map(need => need.kind), ['sick', 'call']);
});

test('the time left is read from what the server said, in real time, and written in the fewest characters', () => {
  const world = { role: 'student', household: { mainId: 'f' }, entities: people(['f', 'a']).map(one => (one.id === 'a' ? { ...one, service: { status: 'serving', leave: 'open' }, decisionLeftMs: 45_000 } : one)) };
  assert.equal(needsOf(world, 'a')[0].leftMs, 45_000);
  // The road's question and the order to leave count ticks; without the class's pace there is no honest time, so none.
  const road = { ...world, flight: { status: 'fled', ask: { id: 'bog', text: 'Stuck.', ticksLeft: 5 } } };
  assert.equal(needsOf(road, 'f', { tickMs: 4000 })[0].leftMs, 20_000);
  assert.equal(needsOf(road, 'f')[0].leftMs, undefined);
  const order = { ...world, flight: { status: 'ordered', ticksLeft: 72 } };
  assert.equal(needsOf(order, 'f', { tickMs: 9500 })[0].leftMs, 72 * 9500);
  assert.equal(leftWords(28_200), '29s');
  assert.equal(leftWords(400), '1s', 'a question with time left read as none');
  assert.equal(leftWords(4 * 60_000 + 1), '5 min');
  assert.equal(leftWords(2.5 * 3_600_000), '3 h');
  assert.equal(leftWords(null), null);
});

test('the server sends the time left on the call, on the army\'s questions, on the road\'s and on the order to leave', () => {
  const world = createGonzalesWorld('ranking-times', 5, { map: 'colonies' });
  const household = world.households['hh-1'];
  household.played = true;
  world.status = 'running';
  for (let tick = 0; tick < 6000 && !world.calls?.[household.id]; tick++) stepWorld(world);
  assert.ok(world.calls?.[household.id], 'no call reached the family, so this proves nothing');
  const [first, second] = household.members;
  world.decisionClock = { [`call:${household.id}`]: { personId: first, spent: 60_000, of: 300_000 }, [`army:storm:${second}`]: { personId: second, spent: 30_000, of: 90_000 } };
  let seen = view(world, household.id);
  assert.equal(seen.request.leftMs, 240_000, 'the call went without its time left');
  assert.equal(seen.entities.find(one => one.id === second).decisionLeftMs, 60_000, 'the army\'s question went without its time left');
  assert.equal(seen.entities.find(one => one.id === first).decisionLeftMs, undefined, 'the call\'s minutes were read as a question of the person\'s own');
  // Told to leave: a day of the calendar, in this phase's ticks.
  household.flight = { status: 'ordered', orderedMinute: world.minute - 60 };
  seen = view(world, household.id);
  assert.equal(seen.flight.ticksLeft, Math.ceil((FLIGHT_PATIENCE - 60) / calendarMinutes(world)));
  // On the road with the wagon in the mud, asked two ticks ago; and the soldiers' ¡Alto!, with its own few ticks.
  household.flight = { status: 'fled', bog: {}, ask: { id: 'bog', openedTick: world.tick - 2, openedMinute: world.minute } };
  assert.equal(view(world, household.id).flight.ask.ticksLeft, ROAD_PATIENCE_TICKS - 2);
  // The soldiers' own few ticks (a real chase is projected in tests/scrape-pursuit.test.mjs; here only the patience).
  assert.equal(askTicksLeft(world, { id: 'alto', openedTick: world.tick - 1 }), ALTO_PATIENCE_TICKS - 1);
  assert.equal(askTicksLeft(world, { id: 'alto', openedTick: world.tick - 10 }), 0, 'a lapsed question has time left');
});

test('the Watch alert waits behind the family\'s own road: the order to leave, the road\'s question and ¡Alto!', () => {
  const person = { id: 'p', householdId: 'h', name: 'Elena', kind: 'person' };
  const world = { role: 'student', householdId: 'h', entities: [person], battleAlert: { id: 'watch', entityId: 'p', title: 'San Jacinto', text: 'The fight is starting.', field: {} } };
  assert.equal(militaryNotices(world).at(-1)?.kind, 'battle', 'no Watch at all, so this proves nothing');
  for (const flight of [{ status: 'ordered' }, { status: 'fled', ask: { id: 'bog' } }, { status: 'fled', ask: { id: 'alto' } }]) {
    assert.ok(!militaryNotices({ ...world, flight }).some(notice => notice.kind === 'battle'), `Watch sprang open over ${JSON.stringify(flight)}`);
  }
  // On the road with nothing asked, the fight can be watched.
  assert.equal(militaryNotices({ ...world, flight: { status: 'fled' } }).at(-1)?.kind, 'battle');
});

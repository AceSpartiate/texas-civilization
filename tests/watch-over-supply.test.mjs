// The Watch card goes up over the army's request for supplies (owner, 2026-09-30, by multiple choice: "Watch goes over it").
//
// The army before Béxar asks the families at home for flour at nine on November 26 (sim/supplies.mjs `supply-flour`), an hour
// before the Grass Fight's alarm, and until this the card through a family's own man in that fight was held back by it - never
// put up over a decision that is open (public/military-attention.js) - so the fight had passed before the student saw Watch
// (found by `test:battle-grass`, 2026-09-30). Now:
//   - the fight's card goes up over the supply request, and the request stays among the messages behind it, still answerable;
//   - the call to arms, a rider, the road and ¡Alto! still hold the card back, as before;
//   - the request's five real minutes (sim/decision-budget.mjs `CALL_BUDGET_MS`) do not run while the fight's card is up, and run
//     again when it is down, so a student who watched the fight comes back to the request with the time it had.
import test from 'node:test';
import assert from 'node:assert/strict';
import { militaryNotices } from '../public/military-attention.js';
import { applyAction, projectPage, stepWorld } from '../sim/world.mjs';
import { directorProjection } from '../sim/directors.mjs';
import { supplyAskFor } from '../sim/supplies.mjs';
import { heardOut } from './support/heard-out.mjs';
import { armyClass } from './support/campaign.mjs';

const home = (extra = {}) => ({ role: 'student', householdId: 'h', household: { members: ['p', 'k'], principalId: 'p' },
  entities: [{ id: 'p', householdId: 'h', name: 'Gregorio Ruiz', given: 'Gregorio', kind: 'person', kin: { role: 'father' }, service: { status: 'serving' } },
    { id: 'k', householdId: 'h', name: 'Elena Ruiz', given: 'Elena', kind: 'person', kin: { role: 'mother' } }], ...extra });
const alert = { id: 'battle:grass-fight:h', entityId: 'p', title: 'After the pack train', text: 'At Gregorio\'s side.', action: 'Watch' };
const supply = { id: 'ev-flour', kind: 'supply', status: 'open', text: 'The camp is out of flour. What can your family send?', leftMs: 200000,
  answerers: { k: [{ id: 'supply-food', can: false }, { id: 'supply-none', can: true }] }, options: [{ id: 'supply-food', can: false }, { id: 'supply-none', can: true }] };

test('the Watch card goes up over the army\'s request for supplies, first among the messages, and the request stays behind it', () => {
  const notices = militaryNotices(home({ request: supply, battleAlert: alert }));
  const kinds = notices.map(one => one.kind);
  assert.ok(kinds.includes('battle'), `the Watch card was held back by the supply request: ${kinds}`);
  assert.equal(notices[0].kind, 'battle', `the Watch card is not in front of the supply request: ${kinds}`);
  const asked = notices.find(one => one.kind === 'call');
  assert.ok(asked, 'the supply request was lost from the messages when Watch went up');
  assert.equal(asked.id, 'call:ev-flour');
  assert.equal(asked.leftMs, 200000, 'the request lost its time left');
  // Without the fight, the request is the card, as before.
  assert.deepEqual(militaryNotices(home({ request: supply })).map(one => one.kind), ['call']);
});

test('the call to arms, a rider, the road and ¡Alto! still hold the Watch card back', () => {
  const call = { id: 'call-1', kind: 'call', status: 'open', text: 'Does somebody go?', answerers: { k: [{ id: 'turn-out', can: true }] }, options: [{ id: 'turn-out', can: true }] };
  for (const [what, extra] of [
    ['the call to arms', { request: call }],
    ['a rider', { encounter: { id: 'e', status: 'open', listenerId: 'k' } }],
    ['the order to leave', { flight: { status: 'ordered', leftMs: 180000 } }],
    ['¡Alto!', { flight: { status: 'fled', ask: { id: 'alto', text: 'Soldiers shout ¡Alto!', leftMs: 30000 } } }],
  ]) assert.ok(militaryNotices(home({ ...extra, battleAlert: alert })).every(one => one.kind !== 'battle'), `the Watch card went up over ${what}`);
  // And the supply request with one of them: still held back by the other.
  assert.ok(militaryNotices(home({ request: supply, encounter: { id: 'e', status: 'open', listenerId: 'k' }, battleAlert: alert })).every(one => one.kind !== 'battle'));
});

test('the request\'s real minutes stand still while the fight\'s card is up, and it is still there to answer when the card is down', () => {
  const { world, sent } = armyClass('watch-over-supply', { modes: ['horse', 'foot', 'horse'], to: 'grass-alarm' });
  const rider = sent.find(one => one.mode === 'horse' && world.army.questions?.grass?.asks?.[one.personId] === 'open');
  assert.ok(rider, 'no rider in the camp is asked at the alarm');
  const id = rider.householdId, household = world.households[id];
  // Planted: the family becomes a student's, and the flour request is put to it afresh (a family nobody plays is answered by the
  // neighbours' director at once, so the class played in process to here had answered it).
  household.played = true;
  delete world.supplies?.[id];
  applyAction(world, id, { action: 'army-answer', entityId: rider.personId, question: 'grass', answer: 'yes' });
  stepWorld(world, { realMs: 1000 });
  heardOut(world, id);
  const ask = supplyAskFor(world, id);
  assert.equal(ask?.askId, 'supply-flour', 'the family was not asked for flour');
  const key = `call:supply:${id}:supply-flour`;
  const spent = () => world.decisionClock?.[key]?.spent ?? 0;
  const fightUp = () => Boolean(directorProjection(world, id, 'student').battleAlert);
  // To the fight's card (it goes up at the alarm, through the man who said he would go).
  let ticks = 0;
  for (; ticks < 200 && !fightUp(); ticks++) { stepWorld(world, { realMs: 1000 }); heardOut(world, id); }
  assert.ok(fightUp(), 'the family\'s man never had the fight\'s card');
  const atCard = spent();
  assert.ok(atCard < 200_000, `the request's minutes were spent before the fight (${atCard} ms)`);
  // The card is up over the request on the family's page, and the request is still there.
  const page = militaryNotices(projectPage(world, id, 'student', { includeMap: false }));
  assert.equal(page[0]?.kind, 'battle', `the page did not put the Watch card up first: ${page.map(one => one.kind)}`);
  assert.ok(page.some(one => one.kind === 'call'), 'the supply request left the page when Watch went up');
  // While it is up, ten real seconds a tick: not one of them is spent on the request, and it stays open.
  let held = 0;
  for (; held < 60 && fightUp(); held++) {
    stepWorld(world, { realMs: 10_000 });
    if (fightUp()) assert.equal(spent(), atCard, `the request's minutes ran while the fight's card was up (tick ${held})`);
  }
  assert.ok(held >= 3, `the fight's card was up for only ${held} ticks`);
  assert.equal(supplyAskFor(world, id)?.askId, 'supply-flour', 'the request lapsed while the student watched the fight');
  // Down again: the minutes run from where they stood, and the request is answered from the family's card.
  for (let i = 0; i < 200 && fightUp(); i++) stepWorld(world, { realMs: 10_000 });
  assert.ok(!fightUp(), 'the fight\'s card never came down');
  const after = spent();
  stepWorld(world, { realMs: 10_000 });
  if (supplyAskFor(world, id)) assert.ok(spent() > after, 'the request\'s minutes did not run again after the fight');
  assert.ok(supplyAskFor(world, id), 'the request was gone after the fight');
  const answerer = Object.keys(directorProjection(world, id, 'student').request?.answerers || {})[0];
  assert.ok(answerer, 'nobody at home can answer the request after the fight');
  applyAction(world, id, { action: 'supply-none', entityId: answerer });
  assert.equal(supplyAskFor(world, id), null, 'the request could not be answered after the fight');
});

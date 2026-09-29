// An order to leave its student lets run out burns the house (owner, 2026-09-29: "72 s at quick, but if the student doesn't
// respond, burn their house. They should have been paying attention."; sim/scrape.mjs `burnForSilence`, `FIC-GONZ-907`). The
// family is still packed off as before; the Texas army burns the farm behind it, counted as every burning is; the order warns of
// it first; and only a family a student is playing and at the screen for is treated so.
//
// Each test here was proven by injecting the regression it guards (scripts/flight-lapse-burns-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { QUESTION_BUDGETS } from '../sim/decision-budget.mjs';
import { ORDER_GRACE_MINUTES } from '../sim/advance.mjs';
import { farmTopic } from '../sim/advance-word.mjs';
import { flightLine } from '../sim/ending-story.mjs';
import { needsOf } from '../public/family-panel.js';
import { spring } from './support/scrape-spring.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const main = (world, household) => world.entities[household.mainId || household.principalId];
/** The first family, a student's at the screen, with a house standing, told to leave this tick. */
function ordered({ played = true } = {}) {
  const world = spring();
  const household = world.households['hh-1'];
  household.played = played;
  household.improvements = { ...household.improvements, cabin: 'sound' };
  household.resources = { ...household.resources, food: 400, seed: 40, cotton: 40, powder: 3 };
  stepWorld(world);
  assert.equal(household.flight?.status, 'ordered', 'the first family was not told to leave');
  return { world, household };
}
const run = (world, household, ms, limit = 400) => { let t = 0; while (household.flight.status === 'ordered' && t < limit) { stepWorld(world, { realMs: ms }); t++; } return t; };
const lapsedBurn = household => household.flight?.burnedBy?.lapsed === true;

test('a student who lets the order to leave run out is packed off, and the house burns behind the family, said plainly and counted', () => {
  for (const [ms, ticks] of [[9500, Math.ceil(QUESTION_BUDGETS.flight / 9500)], [1000, ORDER_GRACE_MINUTES / 20]]) {
    const { world, household } = ordered();
    const waited = run(world, household, ms);
    assert.equal(waited, ticks, `at ${ms} ms a tick the order lapsed after ${waited} ticks`);
    assert.ok(['fled', 'refuged'].includes(household.flight.status), 'the family was not packed off');
    assert.equal(household.improvements.cabin, 'ruined', 'the house still stands on the family\'s land');
    assert.ok(Number.isFinite(household.flight.burned), 'the burning is not on the family\'s flight');
    assert.deepEqual([household.flight.burnedBy?.hand, household.flight.burnedBy?.lapsed], ['texian', true], 'the burning is not counted as the Texas army\'s, for the lapse');
    assert.equal(household.flight.left, undefined, 'what was left in the house survived the fire');
    assert.ok(household.flight.burnedBy.lost?.length, 'what was left in the house is not said to have burned');
    const line = world.events.find(e => e.householdId === household.id && /Nobody answered the order to leave in time/.test(e.text));
    assert.match(line?.text || '', /The house is lost/, 'the journal does not say plainly that the house burned');
    assert.ok(world.truth[farmTopic(household)], 'the world has no record of the burning');
    assert.ok(world.knowledge.households[household.id][farmTopic(household)], 'the family does not know its own house burned');
    // The family's own page shows the house gone, now: it watched it go (nothing kept `unseen`).
    assert.equal(view(world, household.id).household.improvements.cabin, 'ruined', 'the page still shows the house standing');
    assert.match(flightLine(world, household), /left in a rush: the Texas army burned the farm behind them/, 'the ending does not tell it');
    validateWorld(world);
  }
});

test('the order warns before it runs out: the card\'s words and the "!" say the house will be lost', () => {
  const { world, household } = ordered();
  const shown = view(world, household.id);
  assert.match(shown.flight.ifUnanswered || '', /leaves in a rush.*the house is lost/, 'the order does not say what silence costs');
  const need = needsOf(shown, main(world, household).id).find(one => one.kind === 'flight');
  assert.match(need?.text || '', /the house is lost/, 'the "!" does not warn of the house');
  assert.ok(Number.isFinite(need.leftMs), 'the "!" has no countdown');
});

test('answered in time, or on auto, or nobody plays it, or its student has gone: the house is not burned for silence', () => {
  // Answered by hand: the farm is left standing, with what did not fit in the house.
  let { world, household } = ordered();
  const person = main(world, household);
  applyAction(world, household.id, { action: 'flee', entityId: person.id, take: { food: 20 }, refuge: view(world, household.id).flight.refuges[0].id });
  run(world, household, 9500, 30);
  assert.ok(!lapsedBurn(household) && household.improvements.cabin === 'sound', 'a family that answered lost its house');
  // On auto: goes at once, as its neighbours go, house standing.
  ({ world, household } = ordered());
  main(world, household).auto = true;
  stepWorld(world, { realMs: 9500 });
  assert.ok(['fled', 'refuged'].includes(household.flight.status), 'the family on auto did not go');
  assert.ok(!lapsedBurn(household), 'a family on auto lost its house to silence');
  // A student gone from the screen, and a family nobody plays: never packed off by the student's silence, nor burned for it.
  for (const setup of [h => { h.absent = true; }, h => { h.played = false; }]) {
    ({ world, household } = ordered());
    setup(household);
    for (let t = 0; t < 90; t++) stepWorld(world, { realMs: 9500 });
    assert.ok(!lapsedBurn(household), 'a family nobody was reading lost its house to silence');
    assert.ok(!world.events.some(e => e.householdId === household.id && /Nobody answered the order to leave in time/.test(e.text)));
  }
});

// The first house quicker (owner, 2026-10-02: "it takes too long to build the house at the start of the game"; sim/work-pace.mjs
// `HOUSE_PACE`, `FELL_PACE`; docs/WOODS_AND_BUILDING.md §6.11, `FIC-GONZ-1090`).
//
// Each spell on a house and each tree felled goes in half the time it did on 2026-10-01, on top of the halving of 2026-09-29: the
// tables keep their counts, so a class saved in the middle of its walls opens as far up as it was. Proved by injection
// (scripts/shelter-injections.mjs): `HOUSE_PACE = 1` fails the builder and the words, `FELL_PACE = 1` fails the feller.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { tooYoung } from '../sim/family.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { houseCatalogue } from '../sim/houses.mjs';
import { PLANS, plotNeeds, planPieces } from '../sim/houseplot.mjs';
import { logsOnPile } from '../sim/woodpile.mjs';
import { FELL_PACE, HOUSE_PACE, WORK_PACE, houseHours, workPaceOf } from '../sim/work-pace.mjs';
import { CHORES } from '../sim/chores.mjs';

const grid = (bounds, side = 7) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
/** A colonies class on its land, `hh-1`'s site chosen, and its first grown person made an ordinary hand: skill two, middling strength. */
function onTheLand(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  const site = grid(holdingOf(world, household).bounds).find(point => siteFactsFor(world, household, point).can);
  applyAction(world, 'hh-1', { action: 'choose-site', ...site });
  for (let tick = 0; tick < 60 && household.members.some(member => world.entities[member].travel); tick++) stepWorld(world);
  const [hand, ...others] = household.members.map(id => world.entities[id]).filter(person => person.kind === 'person' && !tooYoung(person));
  hand.skills = { ...hand.skills, hands: 2 };
  if (hand.traits) hand.traits = { ...hand.traits, strength: 5.5 };
  // Everybody else away in town, so nobody joins in or calls anybody aside.
  for (const one of others) one.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  return { world, household, hand };
}

test('the paces: a house\'s spells and a tree felled each go at half the family\'s pace, and nothing else does', () => {
  assert.equal(HOUSE_PACE, 0.5);
  assert.equal(FELL_PACE, 0.5);
  assert.equal(workPaceOf(CHORES['build-house']), WORK_PACE * HOUSE_PACE);
  assert.equal(workPaceOf(CHORES['help-raise']), WORK_PACE * HOUSE_PACE);
  assert.equal(workPaceOf(CHORES['fell-trees']), WORK_PACE * FELL_PACE);
  assert.equal(workPaceOf(CHORES['fetch-logs']), WORK_PACE * FELL_PACE);
  for (const id of ['clear-plot', 'fence-plot', 'plant-field', 'fish-the-water', 'make-furniture', 'make-carreta', 'dig-well']) assert.equal(workPaceOf(CHORES[id]), WORK_PACE, id);
});

test('the words follow: the chooser and the plan say the house\'s hours at its new pace', () => {
  // A round-log cabin chosen whole: 40 spells of three ticks, a quarter of their old length - 10 hours, was 20 (and 40 before 2026-09-29).
  assert.equal(houseCatalogue().find(choice => choice.id === 'round-log').hours, 10);
  assert.equal(houseHours(3), 0.25);
  // The round-log plan on the plot: 34 spells, 8.5 hours, was 17.
  assert.equal(plotNeeds(planPieces('round-log')).hours, 8.5);
  assert.ok(PLANS['round-log']);
});

test('one ordinary hand raises a round-log pen from a full log pile in under seventy ticks (a hundred and sixteen before)', () => {
  const { world, household, hand } = onTheLand('house-pace');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  household.logs = { wall: 60, sill: 0, poor: 0 };
  applyAction(world, 'hh-1', { action: 'chore', entityId: hand.id, chore: 'build-house' });
  const from = world.tick;
  for (let tick = 0; tick < 200 && household.improvements.cabin !== 'sound'; tick++) stepWorld(world);
  const took = world.tick - from;
  assert.equal(household.improvements.cabin, 'sound', 'the pen was never roofed');
  assert.ok(took <= 70, `the pen took ${took} ticks`);
  validateWorld(world);
});

test('one ordinary hand fells forty logs onto the pile in under forty-five ticks (fifty-eight before)', () => {
  const { world, household, hand } = onTheLand('house-pace');
  applyAction(world, 'hh-1', { action: 'chore', entityId: hand.id, chore: 'fell-trees' });
  const from = world.tick;
  for (let tick = 0; tick < 200 && logsOnPile(household) < 40; tick++) {
    stepWorld(world);
    if (!hand.chore) applyAction(world, 'hh-1', { action: 'chore', entityId: hand.id, chore: 'fell-trees' });
  }
  const took = world.tick - from;
  assert.ok(logsOnPile(household) >= 40, 'forty logs never came in');
  assert.ok(took <= 45, `forty logs took ${took} ticks`);
  assert.ok(projectWorld(world, 'hh-1', 'student', { includeMap: false }));
  validateWorld(world);
});

// The crop chosen at planting, and food sold for coin: the owner's answer to the balance study (2026-09-16,
// docs/MONEY_AND_GLORY.md §8.1): "both, but cotton is more expensive, so more profitable for players".
//
// Planting stops at the field to ask corn or cotton. Cotton takes twice the seed a plot and is sold at a real a bale; corn
// is food, and the store now buys a family's surplus food for coin outside its small purse, as it buys cotton. Nobody
// answering keeps the family's own crop, so a family nobody plays, and a student who never looks, grow what they grew.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld, withoutStartingCoin } from './support/settled.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { COTTON_SEED_PER_PLOT, SEED_PER_PLOT, clearedOf } from '../sim/improvements.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
// Without the coin a family's means start it with (sim/means.mjs), so a sale for coin is counted from none.
const running = seed => { const world = withoutStartingCoin(createSettledWorld(seed)); world.status = 'running'; return world; };
const untilAsk = (world, person) => { for (let t = 0; t < 400 && person.chore && !person.chore.ask; t++) stepWorld(world); };
const finish = (world, person) => { for (let t = 0; t < 600 && person.chore; t++) stepWorld(world); };
const planter = (world, household) => world.entities[household.members[1]] || world.entities[household.members[0]];

test('planting asks corn or cotton; cotton takes twice the seed and is a family\'s own to choose', () => {
  const world = running('crops-choice');
  const household = Object.values(world.households)[0];
  household.field = { ...household.field, crop: 'corn', state: 'bare' };
  const plots = clearedOf(household);
  assert.ok(plots >= 1, 'the family has no cleared field');
  household.resources.seed = COTTON_SEED_PER_PLOT * plots + 1;
  const person = planter(world, household);
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'plant-field' });
  untilAsk(world, person);
  assert.equal(person.chore?.ask?.id, 'crop-choice', 'planting did not ask which crop');
  const options = view(world, household.id).entities.find(e => e.id === person.id).chore.ask.options;
  assert.deepEqual(options.map(o => o.id), ['corn', 'cotton'], 'a corn family is not offered its own crop first');
  assert.ok(options.every(o => o.can), `an answer is refused: ${JSON.stringify(options)}`);
  applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: 'cotton' });
  finish(world, person);
  assert.equal(household.field.crop, 'cotton', 'the family did not turn to cotton');
  assert.equal(household.field.state, 'planted');
  assert.equal(household.resources.seed, 1, `cotton did not take ${COTTON_SEED_PER_PLOT} seed a plot`);
  assert.ok(COTTON_SEED_PER_PLOT > SEED_PER_PLOT, 'cotton is not the dearer crop');

  // Too little seed for cotton: the answer is closed, in words, and corn still open.
  const other = running('crops-short');
  const family = Object.values(other.households)[0];
  family.field = { ...family.field, crop: 'corn', state: 'bare' };
  family.resources.seed = SEED_PER_PLOT * clearedOf(family);
  const hand = planter(other, family);
  applyAction(other, family.id, { action: 'chore', entityId: hand.id, chore: 'plant-field' });
  untilAsk(other, hand);
  const short = view(other, family.id).entities.find(e => e.id === hand.id).chore.ask.options;
  assert.equal(short.find(o => o.id === 'cotton').can, false);
  assert.match(short.find(o => o.id === 'cotton').why, /seed/);
  assert.equal(short.find(o => o.id === 'corn').can, true);
});

test('nobody answering keeps the family\'s own crop: a cotton family stays cotton, and a corn family corn', () => {
  for (const crop of ['cotton', 'corn']) {
    const world = running(`crops-silent-${crop}`);
    const household = Object.values(world.households)[0];
    household.field = { ...household.field, crop, state: 'bare' };
    household.resources.seed = COTTON_SEED_PER_PLOT * clearedOf(household) + 2;
    const person = planter(world, household);
    applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'plant-field' });
    untilAsk(world, person);
    assert.equal(view(world, household.id).entities.find(e => e.id === person.id).chore.ask.options[0].id, crop, `${crop} is not offered first to a ${crop} family`);
    finish(world, person);
    assert.equal(household.field.crop, crop, `silence turned a ${crop} family`);
    assert.equal(household.field.state, 'planted');
  }
});

test('the store buys a family\'s food for coin outside its purse, as it buys cotton', () => {
  const world = running('crops-food-coin');
  const household = Object.values(world.households)[0];
  const marta = world.entities['town-ibarra'];
  marta.purse = 0;
  household.resources.food = 30;
  const person = planter(world, household);
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'sell-food', mode: 'horse' });
  finish(world, person);
  assert.equal(household.resources.money, 1, `an empty purse stopped the food sale: ${household.resources.money}`);
  assert.equal(marta.purse, 0, 'the food was paid from the purse');
});

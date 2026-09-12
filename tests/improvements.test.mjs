// What a family makes of its land, and what can be taken from it.
//
// The owner: "players should be able to expand their farms... they'll need to be
// destructible (runaway scrape)." Both halves are here, and the second one deliberately
// has no caller in the Gonzales afternoon - there is no documented destruction of
// homesteads around Gonzales on 2 October 1835 and this project invents none. What is
// built now is the state and the transition, because property that can be ruined has to
// be modelled that way from the first save that contains it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, createWorld, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import {
  CLEARING_MAX, SEED_PER_CLEARING, UNFENCED_LOSS, clearedOf, harvestShare, improvementsOf,
  isFenced, needsWagonToHarvest, ruin, standingCrop,
} from '../sim/improvements.mjs';
import { CHORES, choreAvailability } from '../sim/chores.mjs';

const running = (seed = 'land', count = 5) => {
  const world = createGonzalesWorld(seed, count);
  world.status = 'running';
  return world;
};
const person = (world, household, name) => world.entities[`${household}-${name}`];
/** Run one chore to the end, or give up rather than loop for ever. */
function work(world, householdId, entityId, chore, mode) {
  applyAction(world, householdId, { action: 'chore', entityId, chore, ...(mode && { mode }) });
  for (let tick = 0; tick < 400 && world.entities[entityId].chore; tick++) stepWorld(world);
  assert.equal(world.entities[entityId].chore, null, `${chore} never finished`);
}
const ripe = household => { household.field = { ...household.field, state: 'ripe', changedTick: 0 }; };

test('a family starts with a cabin, one patch of broken ground and no fence at all', () => {
  const world = running('start');
  for (const household of Object.values(world.households)) {
    assert.equal(clearedOf(household), 1, 'they have broken ground once and no more');
    assert.equal(improvementsOf(household).cabin, 'sound');
    assert.equal(improvementsOf(household).fence, 'none', 'a fence is something a family makes, not something it is given');
    assert.equal(isFenced(household), false);
  }
  // And a class saved before any of this reads exactly the same way, which is why no save
  // version moved. CLAUDE.md asks for that judgement rather than the reflex; sim/trade.mjs
  // is the worked example.
  const old = createWorld('older-save', 5);
  for (const household of Object.values(old.households)) {
    delete household.improvements;
    delete household.field.cleared;
  }
  validateWorld(old);
  assert.equal(clearedOf(old.households['hh-1']), 1);
  assert.equal(improvementsOf(old.households['hh-1']).fence, 'none');
});

test('breaking new ground costs an afternoon and makes the field bigger for good', () => {
  const world = running('clearing');
  const household = world.households['hh-1'], thomas = person(world, 'hh-1', 'thomas');
  const before = world.tick;
  work(world, 'hh-1', thomas.id, 'clear-ground');
  assert.equal(clearedOf(household), 2, 'the ground was broken and the field is no bigger');
  assert.ok(world.tick - before >= 10, `breaking ground took ${world.tick - before} ticks, which is not an afternoon`);
  assert.ok(world.events.some(event => /broke new ground/.test(event.text)), 'nothing in the family record says they did it');
  // It is permanent: nothing gives it back except ruin.
  for (let tick = 0; tick < 40; tick++) stepWorld(world);
  assert.equal(clearedOf(household), 2);
});

test('there is a limit to the ground, and none of it can be broken round a standing crop', () => {
  const world = running('limits');
  const household = world.households['hh-1'], thomas = person(world, 'hh-1', 'thomas');
  household.field = { ...household.field, cleared: CLEARING_MAX };
  const full = choreAvailability(world, household, thomas, 'clear-ground');
  assert.equal(full.can, false);
  assert.match(full.why, /no more ground/);

  household.field = { ...household.field, cleared: 1, state: 'planted', changedTick: 0 };
  const standing = choreAvailability(world, household, thomas, 'clear-ground');
  assert.equal(standing.can, false, 'they broke new ground through their own planted crop');
  assert.match(standing.why, /already planted/);
});

test('a bigger field swallows more seed, and the control says so before it is chosen', () => {
  const world = running('seed');
  const household = world.households['hh-1'], thomas = person(world, 'hh-1', 'thomas');
  household.resources.seed = 20;
  const costOf = () => projectWorld(world, 'hh-1', 'student', { includeMap: false })
    .work[thomas.id].find(entry => entry.id === 'plant-field').cost;
  assert.equal(costOf(), `${SEED_PER_CLEARING} seed`);
  household.field = { ...household.field, cleared: 3 };
  assert.equal(costOf(), `${SEED_PER_CLEARING * 3} seed`, 'the family was quoted the price of a field they no longer have');

  const before = household.resources.seed;
  work(world, 'hh-1', thomas.id, 'plant-field');
  assert.equal(before - household.resources.seed, SEED_PER_CLEARING * 3, 'three times the ground took one patch worth of seed');
  assert.equal(household.field.state, 'planted');

  // And a family that cannot pay is told, rather than quietly planting a smaller field.
  const poor = running('seed-poor');
  poor.households['hh-1'].field = { ...poor.households['hh-1'].field, cleared: 4 };
  poor.households['hh-1'].resources.seed = 2;
  const refused = choreAvailability(poor, poor.households['hh-1'], person(poor, 'hh-1', 'thomas'), 'plant-field');
  assert.equal(refused.can, false);
  assert.match(refused.why, /Not enough seed/);
});

test('stock here run loose, so an unfenced crop feeds them first', () => {
  assert.ok(UNFENCED_LOSS > 0 && UNFENCED_LOSS < 1);
  const open = running('unfenced'), fenced = running('unfenced');
  for (const world of [open, fenced]) ripe(world.households['hh-1']);
  assert.equal(harvestShare(open.households['hh-1']), 1 - UNFENCED_LOSS);

  // The same field, the same hands, the only difference being rails round it.
  work(fenced, 'hh-1', 'hh-1-thomas', 'build-fence');
  assert.equal(isFenced(fenced.households['hh-1']), true);
  assert.equal(harvestShare(fenced.households['hh-1']), 1, 'rails round the crop and the stock are still in it');

  const brought = world => {
    const household = world.households['hh-1'];
    const before = household.resources.food;
    work(world, 'hh-1', 'hh-1-thomas', 'harvest-field');
    return household.resources.food - before;
  };
  const loose = brought(open), safe = brought(fenced);
  assert.ok(safe > loose, `a fenced field brought in ${safe} against ${loose} from an open one`);
  assert.ok(open.events.some(event => /gone to stock in an unfenced field/.test(event.text)),
    'a family lost a third of its crop and was never told why');
  assert.ok(!fenced.events.some(event => /gone to stock/.test(event.text)), 'a fenced field should have nothing to report');
});

test('past a certain amount of ground the crop wants the wagon, and the wagon can be elsewhere', () => {
  const world = running('wagon-harvest');
  const household = world.households['hh-1'];
  household.field = { ...household.field, cleared: 3 };
  ripe(household);
  assert.equal(needsWagonToHarvest(household), true);
  const thomas = person(world, 'hh-1', 'thomas');
  // Standing in its own yard, it is simply there and the work goes ahead.
  assert.equal(choreAvailability(world, household, thomas, 'harvest-field').can, true);

  // Somebody took it to town. This is the rivalry the travel modes introduced arriving in
  // a second place: the ox is not a number, it is somewhere, and today it is not here.
  beginTravel(world, person(world, 'hh-1', 'mateo'), 'gonzales', null, 'visit', 'wagon');
  const refused = choreAvailability(world, household, thomas, 'harvest-field');
  assert.equal(refused.can, false);
  assert.match(refused.why, /wants the wagon, and the wagon is not here/);
  // A smaller field is still brought in by hand, which is what keeps this a consequence
  // of having expanded rather than a tax on everybody.
  household.field = { ...household.field, cleared: 1 };
  assert.equal(choreAvailability(world, household, thomas, 'harvest-field').can, true);
});

test('a bigger field is worth having: more ground standing means more food in the door', () => {
  const small = running('yield'), large = running('yield');
  large.households['hh-1'].field = { ...large.households['hh-1'].field, cleared: CLEARING_MAX };
  for (const world of [small, large]) {
    work(world, 'hh-1', 'hh-1-thomas', 'build-fence');
    ripe(world.households['hh-1']);
  }
  assert.ok(standingCrop(large.households['hh-1']) > standingCrop(small.households['hh-1']));
  const brought = world => {
    const before = world.households['hh-1'].resources.food;
    work(world, 'hh-1', 'hh-1-thomas', 'harvest-field');
    return world.households['hh-1'].resources.food - before;
  };
  const little = brought(small), lots = brought(large);
  assert.ok(lots > little * 2, `four times the ground brought in ${lots} against ${little}`);
});

test('what a family made can be taken from it, and the labor is still there afterwards', () => {
  const world = running('ruin');
  const household = world.households['hh-1'];
  work(world, 'hh-1', 'hh-1-thomas', 'clear-ground');
  work(world, 'hh-1', 'hh-1-thomas', 'build-fence');
  household.field = { ...household.field, state: 'ripe', changedTick: world.tick };
  assert.equal(clearedOf(household), 2);
  assert.equal(isFenced(household), true);

  const taken = ruin(world, household, ['cabin', 'fence', 'field'], { text: 'The place was burnt.' });
  assert.deepEqual(taken.sort(), ['cabin', 'fence', 'field']);
  assert.equal(improvementsOf(household).cabin, 'ruined');
  assert.equal(improvementsOf(household).fence, 'ruined');
  assert.equal(isFenced(household), false, 'a pulled-down fence keeps nothing out');
  assert.equal(household.field.state, 'bare', 'the standing crop went with it');
  assert.equal(clearedOf(household), 1, 'and the work of clearing went with it');
  assert.ok(world.events.some(event => event.text === 'The place was burnt.'));
  validateWorld(world);

  // It is not a switch that can be flipped twice: ruining what is already ruined says
  // nothing. A Runaway Scrape passing a household a second time must not announce a loss
  // that did not happen - the family's record is the thing the epilogue is built from.
  const before = world.events.length;
  assert.deepEqual(ruin(world, household, ['cabin', 'fence', 'field']), []);
  assert.equal(world.events.length, before, 'the family was told it lost everything a second time');
  // And a family can make it again, which is the whole point of it being labor.
  work(world, 'hh-1', 'hh-1-thomas', 'build-fence');
  assert.equal(isFenced(household), true);
  assert.ok(world.events.some(event => /set the rails back up/.test(event.text)));
});

test('nothing in the Gonzales afternoon takes anybody’s property', () => {
  // The other half of building destruction early: proving it is not wired to anything.
  // This project does not invent a burnt homestead at Gonzales on 2 October 1835, and a
  // director that quietly started doing so would be a historical claim nobody reviewed.
  const world = running('whole-afternoon');
  for (let tick = 0; tick < 300 && !world.director.complete; tick++) stepWorld(world);
  for (const household of Object.values(world.households)) {
    const standing = improvementsOf(household);
    assert.equal(standing.cabin, 'sound', `${household.id} lost its cabin to something in the slice`);
    assert.notEqual(standing.fence, 'ruined');
  }
  assert.ok(!world.events.some(event => /What the family made of this place is gone/.test(event.text)));
});

test('the class is told what is standing on its land, and never left to guess', () => {
  const world = running('projection');
  const view = () => projectWorld(world, 'hh-1', 'student', { includeMap: false }).land;
  assert.deepEqual(view(), { cabin: 'sound', fence: 'none', cleared: 1, clearingMax: CLEARING_MAX, harvestShare: 1 - UNFENCED_LOSS, needsWagon: false });
  work(world, 'hh-1', 'hh-1-thomas', 'clear-ground');
  work(world, 'hh-1', 'hh-1-thomas', 'build-fence');
  assert.equal(view().cleared, 2, 'the renderer draws the field at this size and nothing else');
  assert.equal(view().fence, 'sound', 'and draws a fence only when this says there is one');
  assert.equal(view().harvestShare, 1);
  // Another family's land is none of this household's business.
  assert.notEqual(projectWorld(world, 'hh-2', 'student', { includeMap: false }).land.cleared, 2);
});

test('a world cannot claim ground or a fence that does not exist', () => {
  const world = running('validation');
  const household = world.households['hh-1'];
  household.field = { ...household.field, cleared: CLEARING_MAX + 1 };
  assert.throws(() => validateWorld(world), /cleared ground/);
  household.field = { ...household.field, cleared: 1 };
  household.improvements = { fence: 'splendid' };
  assert.throws(() => validateWorld(world), /improvement/);
  household.improvements = { windmill: 'sound' };
  assert.throws(() => validateWorld(world), /improvement/, 'a windmill belongs to another century and another country');
  household.improvements = { fence: 'sound' };
  validateWorld(world);
});

test('the two new jobs are ordinary work and cost what they say', () => {
  for (const id of ['clear-ground', 'build-fence']) {
    const chore = CHORES[id];
    assert.ok(chore, `${id} is not a chore`);
    assert.equal(chore.where, 'home', 'both are work on a family’s own land');
    assert.ok(chore.steps.some(step => step.work >= 8), `${id} is not an afternoon's work`);
    assert.ok(!chore.steps.some(step => step.travel), 'neither goes anywhere, so neither needs a mode');
    assert.ok(chore.describe.length > 40, `${id} does not say what it is for`);
  }
});

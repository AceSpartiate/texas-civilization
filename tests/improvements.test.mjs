// What a family makes of its land, and what can be taken from it.
//
// The owner: "players should be able to expand their farms... they'll need to be
// destructible (runaway scrape)." Both halves are here, and the second one deliberately
// has no caller in the Gonzales afternoon - there is no documented destruction of
// homesteads around Gonzales on 2 October 1835 and this project invents none. What is
// built now is the state and the transition, because property that can be ruined has to
// be modelled that way from the first save that contains it.
//
// Since 2026-09-14 the field is the plots a family has cleared (docs/LAND_GRANTS.md §5); tests/clearing.test.mjs has
// the plots themselves, and this file what the field they make is worth and what can be taken from it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, beginTravel, createWorld, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import {
  COTTON_SEED_PER_PLOT, SEED_PER_PLOT, UNFENCED_LOSS, clearedOf, harvestShare, improvementsOf,
  isFenced, needsWagonToHarvest, ruin, standingCrop,
} from '../sim/improvements.mjs';
import { FENCE_TICKS, OLD_PATCHES, plotsOf } from '../sim/fields.mjs';
import { CHORES, choreAvailability } from '../sim/chores.mjs';

const running = (seed = 'land', count = 5) => {
  const world = createSettledWorld(seed, count);
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
/** Send somebody to one of the family's plots on the map, as the student does, and run it to the end. */
function plotWork(world, householdId, entityId, action, plot) {
  applyAction(world, householdId, { action, entityId, x: plot.x, y: plot.y });
  for (let tick = 0; tick < 400 && world.entities[entityId].chore; tick++) stepWorld(world);
  assert.equal(world.entities[entityId].chore, null, `${action} never finished`);
}
/** Rails round every cleared plot. */
function fenceAll(world, householdId, entityId) {
  for (const plot of plotsOf(world, world.households[householdId]).filter(candidate => candidate.state === 'cleared' && candidate.fence !== 'sound')) {
    plotWork(world, householdId, entityId, 'fence-plot', plot);
  }
}
/** Ten acres of prairie staked beside the family's plots and cleared, as a family would: the field is one plot bigger. */
function clearAnother(world, householdId, entityId) {
  const household = world.households[householdId];
  const plots = plotsOf(world, household).map(plot => ({ ...plot }));
  const next = { id: `plot-${plots.length + 1}`, x: plots[0].x, y: +(plots[0].y + 0.2 * plots.length).toFixed(3), ground: 'prairie', state: 'staked' };
  household.plots = [...plots, next];
  plotWork(world, householdId, entityId, 'clear-plot', next);
  return household.plots.find(plot => plot.id === next.id);
}
/** The crop in and ready, as if it had been planted: every cleared plot sown. */
const ripe = household => {
  household.field = { ...household.field, state: 'ripe', changedTick: 0 };
  for (const plot of household.plots || []) if (plot.state === 'cleared') plot.sown = true;
};

test('a family starts with a cabin, one patch of broken ground and no fence at all', () => {
  const world = running('start');
  for (const household of Object.values(world.households)) {
    assert.equal(clearedOf(household), 1, 'they have broken ground once and no more');
    assert.equal(improvementsOf(household).cabin, 'sound');
    assert.equal(isFenced(household), false, 'a fence is something a family makes, not something it is given');
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

test('clearing a staked plot costs days of work and makes the field bigger for good', () => {
  const world = running('clearing');
  const household = world.households['hh-1'], thomas = person(world, 'hh-1', 'thomas');
  const before = world.tick;
  clearAnother(world, 'hh-1', thomas.id);
  assert.equal(clearedOf(household), 2, 'the ground was cleared and the field is no bigger');
  assert.ok(world.tick - before >= 30, `clearing ten acres of prairie took ${world.tick - before} ticks`);
  assert.ok(world.events.some(event => /finished clearing ten acres of prairie/.test(event.text)), 'nothing in the family record says they did it');
  // It is permanent: nothing gives it back except ruin.
  for (let tick = 0; tick < 40; tick++) stepWorld(world);
  assert.equal(clearedOf(household), 2);
});

test('there is no ground to clear until some is staked, and cleared ground is not cleared twice', () => {
  const world = running('limits');
  const household = world.households['hh-1'], thomas = person(world, 'hh-1', 'thomas');
  const none = choreAvailability(world, household, thomas, 'clear-plot');
  assert.equal(none.can, false);
  assert.match(none.why, /no staked ground to clear/);
  const [patch] = plotsOf(world, household);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'clear-plot', entityId: thomas.id, x: patch.x, y: patch.y }), /already cleared/);
});

test('a bigger field swallows more seed, and the control says so before it is chosen', () => {
  const world = running('seed');
  const household = world.households['hh-1'], thomas = person(world, 'hh-1', 'thomas');
  household.resources.seed = 20;
  const costOf = () => projectWorld(world, 'hh-1', 'student', { includeMap: false })
    .work[thomas.id].find(entry => entry.id === 'plant-field').cost;
  const perPlot = household.field.crop === 'cotton' ? COTTON_SEED_PER_PLOT : SEED_PER_PLOT;
  assert.equal(costOf(), `${perPlot} seed`);
  household.field = { ...household.field, cleared: 3 };
  assert.equal(costOf(), `${perPlot * 3} seed`, 'the family was quoted the price of a field they no longer have');

  const before = household.resources.seed;
  work(world, 'hh-1', thomas.id, 'plant-field');
  // Cotton takes more seed a plot (docs/MONEY_AND_GLORY.md §8.1); silence plants the family's own crop.
  assert.equal(before - household.resources.seed, perPlot * 3, 'three times the ground took one patch worth of seed');
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
  fenceAll(fenced, 'hh-1', 'hh-1-thomas');
  assert.equal(isFenced(fenced.households['hh-1']), true);
  assert.equal(harvestShare(fenced.households['hh-1']), 1, 'rails round the crop and the stock are still in it');

  // Whatever this family actually grows. Half of them grow cotton, and a cotton field has
  // come in as cotton since the store opened - measuring food would be measuring nothing.
  const brought = world => {
    const household = world.households['hh-1'];
    const crop = household.field.crop === 'cotton' ? 'cotton' : 'food';
    const before = household.resources[crop] ?? 0;
    work(world, 'hh-1', 'hh-1-thomas', 'harvest-field');
    return (household.resources[crop] ?? 0) - before;
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
  large.households['hh-1'].field = { ...large.households['hh-1'].field, cleared: OLD_PATCHES };
  for (const world of [small, large]) {
    fenceAll(world, 'hh-1', 'hh-1-thomas');
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

test('what a family made can be taken from it, and the land and its stakes are still there afterwards', () => {
  const world = running('ruin');
  const household = world.households['hh-1'];
  clearAnother(world, 'hh-1', 'hh-1-thomas');
  fenceAll(world, 'hh-1', 'hh-1-thomas');
  household.field = { ...household.field, state: 'ripe', changedTick: world.tick };
  assert.equal(clearedOf(household), 2);
  assert.equal(isFenced(household), true);

  const taken = ruin(world, household, ['cabin', 'fence', 'field'], { text: 'The place was burnt.' });
  assert.deepEqual(taken.sort(), ['cabin', 'fence', 'field']);
  assert.equal(improvementsOf(household).cabin, 'ruined');
  assert.equal(isFenced(household), false, 'a pulled-down fence keeps nothing out');
  assert.equal(household.field.state, 'bare', 'the standing crop went with it');
  assert.equal(clearedOf(household), 0, 'and the work of clearing went with it');
  assert.deepEqual(household.plots.map(plot => plot.state), ['staked', 'staked'], 'but the stakes are still in the ground');
  assert.ok(world.events.some(event => event.text === 'The place was burnt.'));
  validateWorld(world);

  // It is not a switch that can be flipped twice: ruining what is already ruined says
  // nothing. A Runaway Scrape passing a household a second time must not announce a loss
  // that did not happen - the family's record is the thing the epilogue is built from.
  const before = world.events.length;
  assert.deepEqual(ruin(world, household, ['cabin', 'fence', 'field']), []);
  assert.equal(world.events.length, before, 'the family was told it lost everything a second time');
  // And a family can make it again, which is the whole point of it being labor.
  household.tools.axe = 0;
  plotWork(world, 'hh-1', 'hh-1-thomas', 'clear-plot', household.plots[1]);
  household.plots[1].fence = 'ruined';
  plotWork(world, 'hh-1', 'hh-1-thomas', 'fence-plot', household.plots[1]);
  assert.equal(household.plots[1].fence, 'sound');
  assert.ok(world.events.some(event => /set the rails back up/.test(event.text)));
});

test('nothing in the Gonzales afternoon takes anybody’s property', () => {
  // The other half of building destruction early: proving it is not wired to anything.
  // This project does not invent a burnt homestead at Gonzales on 2 October 1835, and a
  // director that quietly started doing so would be a historical claim nobody reviewed.
  const world = running('whole-afternoon');
  for (let tick = 0; tick < 300 && !world.director.complete; tick++) stepWorld(world);
  for (const household of Object.values(world.households)) {
    assert.equal(improvementsOf(household).cabin, 'sound', `${household.id} lost its cabin to something in the slice`);
    assert.ok(!(household.plots || []).some(plot => plot.fence === 'ruined'));
  }
  assert.ok(!world.events.some(event => /What the family made of this place is gone/.test(event.text)));
});

test('the class is told what is standing on its land, and never left to guess', () => {
  const world = running('projection');
  const view = () => projectWorld(world, 'hh-1', 'student', { includeMap: false }).land;
  // The grant is its own concern (tests/grants.test.mjs) and so is the interior (tests/interior.test.mjs); everything else on the land line is this.
  const { grant, plots, interior, ...rest } = view();
  assert.equal(grant.kind, 'labor');
  assert.deepEqual(rest, { cabin: 'sound', cleared: 1, fenced: 0, harvestShare: 1 - UNFENCED_LOSS, needsWagon: false, shelter: 'house' });
  assert.deepEqual(plots.map(plot => plot.state), ['cleared'], 'the first patch, as a plot');
  clearAnother(world, 'hh-1', 'hh-1-thomas');
  fenceAll(world, 'hh-1', 'hh-1-thomas');
  assert.equal(view().cleared, 2, 'the renderer draws the field at this size and nothing else');
  assert.deepEqual(view().plots.map(plot => plot.fence), ['sound', 'sound'], 'and draws a fence only where this says there is one');
  assert.equal(view().harvestShare, 1);
  // Another family's land is none of this household's business.
  assert.notEqual(projectWorld(world, 'hh-2', 'student', { includeMap: false }).land.cleared, 2);
});

test('a world cannot claim ground or a fence that does not exist', () => {
  const world = running('validation');
  const household = world.households['hh-1'];
  household.field = { ...household.field, cleared: OLD_PATCHES + 1 };
  assert.throws(() => validateWorld(world), /cleared ground/);
  household.field = { ...household.field, cleared: 1 };
  household.improvements = { fence: 'splendid' };
  assert.throws(() => validateWorld(world), /improvement/);
  household.improvements = { windmill: 'sound' };
  assert.throws(() => validateWorld(world), /improvement/, 'a windmill belongs to another century and another country');
  household.improvements = { fence: 'sound' };
  validateWorld(world);
});

test('the two plot jobs are ordinary work and say what they are for', () => {
  for (const id of ['clear-plot', 'fence-plot']) {
    const chore = CHORES[id];
    assert.ok(chore, `${id} is not a chore`);
    assert.equal(chore.where, 'home', 'both are work on a family’s own land');
    // Fencing's length is the country's (sim/fields.mjs `fenceWork`): never less than splitting rails at hand.
    assert.ok(chore.steps.some(step => step.work >= 3 || (step.work === 'fence' && FENCE_TICKS >= 3)), `${id} is no work at all`);
    assert.ok(!chore.steps.some(step => step.travel), 'neither goes anywhere, so neither needs a mode');
    assert.ok(chore.describe.length > 40, `${id} does not say what it is for`);
  }
});

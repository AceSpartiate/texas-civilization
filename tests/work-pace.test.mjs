// Every family work at half its old length (owner, 2026-09-29: "Tasks are taking far too long. Cutting down trees, fishing,
// building a house, all of those types of tasks are taking too long. Reduce the variables need to complete these tasks by 50%").
// sim/work-pace.mjs, docs/WOODS_AND_BUILDING.md §6.8, docs/BALANCE.md §15, `FIC-GONZ-908`.
//
// Held here, for three works the owner named: a line in the water is half its ticks of fishing, a tree is half its ticks of
// felling and dragging, and a jacal is raised by one ordinary hand in half its old time; what each makes is unchanged. And the
// works that are not a family's own - an errand's time at the counter, the war's, the road's, a child's - are not halved.
//
// Proven 2026-09-29 by four injections, each removed after: the old pace back (`WORK_PACE = 1` in sim/work-pace.mjs), the first
// three fail and the fourth passes; everything halved (`familyWork` returning true), the fourth fails alone; the pace left off
// the felling in sim/chores.mjs `advanceChore`, the felling test fails alone; left off a `work` step, fishing and the jacal fail.
//
// "Ordinary": skill two, no hidden strength, water at hand - the hand every number in the tables is written for.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { settleMeans } from '../sim/means.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, forageFor } from '../sim/chores.mjs';
import { FORAGE } from '../sim/gathering.mjs';
import { fellAndCarryTicks, fellFacts } from '../sim/felling.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { treeById, woodsRule } from '../sim/woods.mjs';
import { landAround } from '../sim/ground.mjs';
import { HOUSES, SPELL_TICKS, houseBuilt, houseCatalogue } from '../sim/houses.mjs';
import { tooYoung } from '../sim/family.mjs';
import { familyWork } from '../sim/work-pace.mjs';
import { settle } from './support/settled.mjs';

/** An ordinary hand: skill two at everything, no hidden strength to speed or slow heavy work. */
function ordinary(entity) {
  entity.skills = { farming: 2, hunting: 2, hands: 2 };
  if (entity.traits) delete entity.traits.strength;
  return entity;
}
const grown = (world, household) => household.members.map(id => world.entities[id]).filter(one => !tooYoung(one) && !one.chore);

/** A class on the real land, everybody home and under a roof, water carried from nowhere far. */
function landed(seed, count = 12) {
  const setUp = createGonzalesWorld(seed, count, { map: 'colonies' });
  settleMeans(setUp);
  const world = settle(setUp);
  world.status = 'running';
  for (const household of Object.values(world.households)) if (household.site) household.site.needsWell = false;
  return world;
}

test('fishing: half the ticks at the water it was, and the same catch', () => {
  const world = landed('work-pace-fish', 20);
  const household = Object.values(world.households).find(one => forageFor(world, one, 'fish').can && grown(world, one).length);
  assert.ok(household, 'no family in the class could fish');
  const fisher = ordinary(grown(world, household)[0]);
  const work = CHORES['fish-the-water'].steps.find(step => step.work).work;
  assert.equal(work, 6, 'the table of fishing changed: this test pins the pace, not the table');
  const foodBefore = household.resources.food ?? 0;
  applyAction(world, household.id, { action: 'chore', entityId: fisher.id, chore: 'fish-the-water' });
  // Ticks that began with the line in the water: six for an ordinary hand until 2026-09-29, three now.
  let atTheWater = 0;
  for (let t = 0; t < 200 && fisher.chore; t++) {
    if (/^fishing /.test(fisher.chore.doing || '')) atTheWater++;
    stepWorld(world);
  }
  assert.equal(fisher.chore, null, 'the fisher never came home');
  assert.equal(atTheWater, work * 0.5, `${atTheWater} ticks at the water`);
  // The catch is what it was: perch and trout, three food and the hand's knack, eaten or not in the meantime.
  const caught = world.events.findLast(event => event.actorId === fisher.id && event.forage === 'fish');
  assert.equal(caught.food, Math.round(FORAGE.fish.food * 1.15 * 10000) / 10000, 'fishing brought home a different catch');
  assert.ok((household.resources.food ?? 0) > foodBefore - 1, 'the catch did not come home');
  // And the control says an hour of work, not two.
  assert.equal(forageFor(world, household, 'fish').hours, 1);
});

/** Points across a holding, as tests/felling.test.mjs reads one. */
const grid = (bounds, side) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};

test('felling: every tree half its ticks of felling and dragging, and the same logs on the pile', () => {
  // A colonies class, the families on their land, hh-1's house set and everybody brought over to it (tests/felling.test.mjs).
  const world = createGonzalesWorld('fell-down-2', 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(one => one.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  const bounds = holdingOf(world, household).bounds;
  applyAction(world, 'hh-1', { action: 'choose-site', ...grid(bounds, 7).find(point => siteFactsFor(world, household, point).can) });
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  household.site.needsWell = false;
  const place = grid(bounds, 11).map(point => ({ point, facts: fellFacts(world, household, point) })).find(entry => entry.facts.can && entry.facts.trees >= 3);
  assert.ok(place, 'no timber on the holding');
  const feller = ordinary(world.entities[household.principalId]);
  applyAction(world, 'hh-1', { action: 'fell-trees', entityId: feller.id, ...place.point });
  // The ticks the feller spends at a tree, against the trees' own work: every tree's felling and dragging (sim/felling.mjs
  // `fellAndCarryTicks`) for an ordinary hand until 2026-09-29, half of it now, the fraction carried from one tree to the next.
  const pile = () => Object.values(household.logs || {}).reduce((sum, n) => sum + n, 0);
  const before = pile();
  let atTrees = 0;
  for (let t = 0; t < 200 && feller.chore && Object.keys(world.woods?.felled || {}).length < 8; t++) {
    if (feller.chore.felling) atTrees++;
    stepWorld(world);
  }
  const felled = Object.keys(world.woods.felled).map(id => treeById(id, { rule: woodsRule(world), nearCreek: landAround().nearCreek }));
  assert.ok(felled.length >= 8, `only ${felled.length} trees were felled`);
  const work = felled.reduce((sum, tree) => sum + fellAndCarryTicks(tree), 0);
  assert.ok(Math.abs(atTrees - work * 0.5) <= 1, `${felled.length} trees of ${work} ticks' work took ${atTrees} ticks at the trees`);
  // Felled, the trees' logs are on the pile as they always were.
  assert.equal(pile() - before, felled.reduce((sum, tree) => sum + tree.logs, 0), 'the logs did not come in whole');
  validateWorld(world);
});

test('a jacal raised by one ordinary hand takes half the ticks it did, and the shelter is the same', () => {
  const world = createGonzalesWorld('work-pace-jacal', 5);
  const household = world.households['hh-1'];
  world.status = 'running';
  for (let t = 0; t < 60 && household.arriving; t++) stepWorld(world);
  assert.equal(household.arriving, undefined, 'the family never reached its land');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'jacal' });
  const builder = ordinary(grown(world, household)[0]);
  if (household.site) household.site.needsWell = false;
  applyAction(world, 'hh-1', { action: 'chore', entityId: builder.id, chore: 'build-house' });
  const began = world.tick;
  for (let t = 0; t < 400 && !houseBuilt(household); t++) stepWorld(world);
  const ticks = world.tick - began;
  assert.ok(houseBuilt(household), 'the jacal never went up');
  // 24 spells of three ticks: 72 ticks of one ordinary hand's work, and a tick's walk over, until 2026-09-29; 36 and the walk now.
  const work = HOUSES.jacal.work * SPELL_TICKS;
  assert.equal(work, 72, 'the jacal\'s table changed: this test pins the pace, not the table');
  assert.ok(ticks >= work * 0.5 && ticks <= work * 0.5 + 2, `one hand raised a jacal in ${ticks} ticks`);
  assert.equal(household.house.work, HOUSES.jacal.work, 'the jacal wants a different number of spells');
  // The chooser says so: twelve hours of one person's work, not twenty-four.
  assert.equal(houseCatalogue().find(one => one.id === 'jacal').hours, 12);
  validateWorld(world);
});

test('only a family\'s own work is halved: not the counter in town, the war, the road, the camp or a child\'s', () => {
  const halved = ['fell-trees', 'fetch-logs', 'build-house', 'help-raise', 'clear-plot', 'fence-plot', 'cut-lane', 'dig-well', 'survey-plot',
    'plant-field', 'harvest-field', 'hunt-land', 'hunt-timber', 'practise-shooting', 'fish-the-water', 'take-small-game', 'gather-oysters',
    'cut-bee-tree', 'butcher-beef', 'butcher-hog', 'look-to-stock', 'make-furniture', 'make-carreta', 'mend-hoe'];
  const whole = ['visit-shop', 'buy-furniture', 'sell-cotton', 'fetch-seed', 'replace-hoe', 'enlist-regular', 'join-houston', 'go-vote',
    'camp-drill', 'hunt-road', 'fish-road', 'rest-road', 'flee-hide', 'child-water', 'child-play', 'nurse-home'];
  for (const id of [...halved, ...whole]) assert.ok(CHORES[id], `no chore ${id}`);
  assert.deepEqual(halved.filter(id => !familyWork(CHORES[id])), [], 'a family work goes at its old pace');
  assert.deepEqual(whole.filter(id => familyWork(CHORES[id])), [], 'a work that is not the family\'s own was halved');
});

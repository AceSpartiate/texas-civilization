// Furniture and the carpenter: docs/SETTLING_IN.md §6, build step 6.
//
// A piece is made at home - a trip to the timber for a small tree and the work of it - or bought
// from the carpenter in town for coin or food. One of each. Each does one small, stated thing, under
// a roof: a bedstead and benches help rest, a table stretches the food, shelves keep it, and a cradle
// lets a parent with a baby at home do heavy work at full pace.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, projectWorld, validateWorld } from '../sim/world.mjs';
import { advanceRoutine } from '../sim/routines.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { BABY_BURDEN, FURNITURE, furnitureShares } from '../sim/furniture.mjs';

const running = seed => { const world = createSettledWorld(seed, 5); world.status = 'running'; return world; };
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const toAsk = (world, person) => { for (let t = 0; t < 400 && person.chore && !person.chore.ask; t++) stepWorld(world); };
const finish = (world, person) => { for (let t = 0; t < 600 && person.chore; t++) stepWorld(world); };
const storyOf = (world, householdId) => world.events.filter(event => event.householdId === householdId).map(event => event.text);

test('a piece is made at home: the family chooses it, fetches a small tree, and makes it', () => {
  const world = running('furniture-make');
  const household = world.households['hh-1'];
  household.tools = { ...household.tools, axe: 0 };
  const person = world.entities[household.members[0]];
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'make-furniture' });
  toAsk(world, person);
  const asked = view(world, household.id).entities.find(e => e.id === person.id).chore.ask;
  const option = id => asked.options.find(o => o.id === id);
  // Every piece, what it does, and the work, before it is chosen; an auger piece is refused without one.
  for (const piece of Object.keys(FURNITURE)) assert.ok(option(piece).note.includes(FURNITURE[piece].does), `${piece} does not say what it does`);
  assert.equal(option('shelves').can, false);
  assert.match(option('shelves').why, /auger/);
  assert.equal(option('benches').can, true);
  assert.throws(() => applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: 'shelves' }), /auger/);
  applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: 'benches' });
  let wentOut = false;
  for (let t = 0; t < 600 && person.chore; t++) { stepWorld(world); if (person.location.siteId !== household.homeSiteId) wentOut = true; }
  assert.ok(wentOut, 'the timber came from nowhere: nobody left the land for it');
  assert.equal(household.furniture?.benches, 'made');
  assert.ok(storyOf(world, household.id).some(text => /made benches/.test(text)), 'the making is not in the family story');
  // One of each: benches are no longer offered.
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'make-furniture' });
  toAsk(world, person);
  assert.equal(view(world, household.id).entities.find(e => e.id === person.id).chore.ask.options.find(o => o.id === 'benches').can, false);
  validateWorld(world);
});

test('a piece is bought from the carpenter in town, for coin or for food, and the coin is accounted for', () => {
  for (const pay of ['coin', 'food']) {
    const world = running(`furniture-buy-${pay}`);
    const household = world.households['hh-1'];
    household.resources.money = 3; household.resources.food = 20;
    const person = world.entities[household.members[0]];
    applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'buy-furniture' });
    toAsk(world, person);
    assert.ok(storyOf(world, household.id).some(text => /Anselmo Lozano/.test(text)), 'nobody was dealt with at the carpenter');
    const before = { ...household.resources };
    applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: `bedstead-${pay}` });
    finish(world, person);
    assert.equal(household.furniture?.bedstead, 'bought');
    if (pay === 'coin') {
      assert.equal(household.resources.money, before.money - FURNITURE.bedstead.coin);
      assert.ok(world.events.some(event => event.householdId === household.id && event.coin === -FURNITURE.bedstead.coin), 'the coin paid is not in the account');
    } else {
      assert.equal(household.resources.money, before.money);
      assert.ok(household.resources.food < before.food - FURNITURE.bedstead.food + 1, 'the food was not paid');
    }
    validateWorld(world);
  }
  // A class saved before carpenters has none, and the trip is not offered as possible.
  const old = running('furniture-old');
  for (const entity of Object.values(old.entities)) if (entity.deals?.includes('furniture')) delete old.entities[entity.id];
  const person = old.entities[old.households['hh-1'].members[0]];
  assert.match(choreAvailability(old, old.households['hh-1'], person, 'buy-furniture').why, /no carpenter/);
});

test('each piece does its one stated thing, and only under a roof', () => {
  const household = { furniture: { bedstead: 'made', benches: 'made', table: 'bought', shelves: 'made' } };
  assert.deepEqual(furnitureShares(household, false), { rest: 1, eaten: 1, spoil: 1 }, 'furniture by the wagon did something');
  const housed = furnitureShares(household, true);
  assert.ok(Math.abs(housed.rest - 1.1 * 1.05) < 1e-9);
  assert.equal(housed.eaten, 0.95);
  assert.equal(housed.spoil, 0.7);
  assert.deepEqual(furnitureShares({}, true), { rest: 1, eaten: 1, spoil: 1 }, 'a family with none is changed');

  // Through the routine: the same day in a draughty house, with a table, with shelves, and with neither.
  const day = furnished => {
    const world = running('furniture-day');
    const household = world.households['hh-1'];
    household.house = { layout: 'round-log', work: 999 };
    household.improvements = { ...household.improvements, cabin: 'sound' };
    household.resources.food = 50;
    if (furnished) household.furniture = { [furnished]: 'made' };
    for (const id of household.members) world.entities[id].task = 'rest';
    advanceRoutine(world, 1440);
    return household.resources.food;
  };
  assert.ok(day('table') > day(null), 'a table stretched the food no further');
  assert.ok(day('shelves') > day(null), 'shelves kept no food from spoiling');

  // Rest: a bedstead mends a tired person faster.
  const rested = furnished => {
    const world = running('furniture-rest');
    const household = world.households['hh-1'];
    if (furnished) household.furniture = { bedstead: 'made' };
    const person = world.entities[household.members[0]];
    person.task = 'rest'; person.exertion = 30;
    advanceRoutine(world, 120);
    return person.exertion;
  };
  assert.ok(rested(true) < rested(false), 'a bedstead mended nothing faster');
});

test('a parent with a baby at home and no cradle does heavy work slower, and it says so; a cradle ends that', () => {
  const ticksToPlant = cradle => {
    const world = running('furniture-baby');
    const household = world.households['hh-1'];
    const parent = world.entities[household.principalId];
    const child = world.entities[household.members.find(id => ['son', 'daughter'].includes(world.entities[id].kin?.role))];
    child.age = 1;
    if (cradle) household.furniture = { cradle: 'made' };
    applyAction(world, household.id, { action: 'chore', entityId: parent.id, chore: 'plant-field' });
    let ticks = 0, said = '';
    for (; ticks < 600 && parent.chore; ticks++) { stepWorld(world); if (parent.chore?.doing) said = said || (parent.chore.doing.includes('baby') ? parent.chore.doing : ''); }
    return { ticks, said };
  };
  const without = ticksToPlant(false), with_ = ticksToPlant(true);
  assert.ok(without.ticks > with_.ticks, `the baby changed nothing: ${without.ticks} and ${with_.ticks} ticks`);
  assert.match(without.said, /with the baby to mind/);
  assert.equal(with_.said, '');
  assert.ok(BABY_BURDEN > 1 && BABY_BURDEN < 1.5, 'minding a baby is a burden, not a bar');
});

test('the work is not offered to a family still on the road in, a stored piece must be a piece, and the carpenter keeps his counter', () => {
  const arriving = createGonzalesWorld('furniture-arriving', 5);
  const work = view(arriving, 'hh-1').work;
  for (const list of Object.values(work)) assert.ok(!list.some(chore => chore.id?.includes('furniture')), 'furniture was offered to a family on the road');
  const world = running('furniture-valid');
  world.households['hh-1'].furniture = { piano: 'made' };
  assert.throws(() => validateWorld(world), /Invalid furniture/);
  world.households['hh-1'].furniture = { table: 'stolen' };
  assert.throws(() => validateWorld(world), /Invalid furniture/);
  delete world.households['hh-1'].furniture;
  validateWorld(world);
  const carpenter = world.entities['town-carpenter'];
  assert.ok(carpenter?.deals.includes('furniture'));
  for (let t = 0; t < 12; t++) stepWorld(world);
  assert.equal(carpenter.location.siteId, 'gonzales');
});

// Arrival, and the camp by the wagon: step 2 of docs/SETTLING_IN.md.
//
// "players should arrive at their farm in their wagons." A new class starts with every family
// on the road in - its people, its ox, its horse and its wagon - and nobody at a homestead.
// There is no house when they get there, so they camp by the wagon until there is a roof, and
// the camp costs a little: rest mends more slowly and the food keeps worse.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, createWorld, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { advanceRoutine, REST_MILES_PER_MINUTE } from '../sim/routines.mjs';
import { CAMP_REST_SHARE, CAMP_SPOILAGE_PER_DAY, forkOf, housed } from '../sim/settling.mjs';
import { momentOf } from '../sim/directors.mjs';
import { WAGON_SPEED } from '../sim/travel.mjs';
import { settle } from './support/settled.mjs';
import { settleMeans } from '../sim/means.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const everything = (world, household) => [...household.members, ...household.property].map(id => world.entities[id]);

test('nobody is placed: every family, its beasts and its wagon start on their own track', () => {
  const world = createGonzalesWorld('arrive', 15);
  for (const household of Object.values(world.households)) {
    const fork = forkOf(world, household), start = world.map.sites[fork];
    assert.ok(fork, `${household.id} has no track in`);
    assert.equal(household.arriving, true);
    assert.equal(housed(household), false, `${household.id} has a house before anybody built one`);
    const kinds = new Set();
    for (const entity of everything(world, household)) {
      kinds.add(entity.species || entity.kind);
      assert.equal(entity.location.siteId, null, `${entity.id} was placed at ${entity.location.siteId}`);
      assert.equal(entity.travel?.purpose, 'arrive', `${entity.id} is not on the road in`);
      assert.equal(entity.travel.to, household.homeSiteId);
      assert.equal(entity.travel.speed, WAGON_SPEED, `${entity.id} does not keep the wagon's pace`);
      assert.deepEqual({ x: entity.location.x, y: entity.location.y }, { x: start.x, y: start.y }, `${entity.id} does not start at the fork`);
    }
    assert.deepEqual([...kinds].sort(), ['horse', 'ox', 'person', 'wagon']);
  }
  const hh1 = view(world, 'hh-1');
  assert.equal(hh1.historicalDate, '1835-09-28');
  assert.equal(hh1.land.shelter, 'camp');
  assert.equal(hh1.land.arriving, true);
  assert.equal(hh1.arrivalClass, true);
  assert.match(world.events.find(event => event.type === 'household-founded' && event.householdId === 'hh-1').text, /turned off the road/);
  validateWorld(world);
});

test('a family on the road in can do nothing but come in, and comes in together', () => {
  const world = createGonzalesWorld('arrive-together', 5);
  const household = world.households['hh-1'];
  const worker = world.entities[household.members[1]];
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: worker.id, chore: 'plant-field' }), /on the road/);
  assert.throws(() => applyAction(world, household.id, { action: 'travel', entityId: household.principalId, destination: 'gonzales' }), /Already traveling/);
  assert.match(view(world, household.id).work[worker.id].find(entry => entry.id === 'plant-field').why, /on the road/);

  // The first running tick gives every family nobody rolled its means (sim/means.mjs `settleMeans`): given here first, so the
  // yard the family comes in to is the one with all its wagons and oxen in it.
  settleMeans(world);
  const settled = settle(structuredClone(world));
  const distance = world.entities[household.principalId].travel.distance;
  const expected = Math.ceil(distance / WAGON_SPEED - 1e-9);
  world.status = 'running';
  while (household.arriving) {
    stepWorld(world);
    assert.ok(world.tick <= expected, `still on the road at tick ${world.tick}; ${distance.toFixed(2)} miles should take ${expected}`);
  }
  assert.equal(world.tick, expected, 'the family arrived faster than an ox walks');
  for (const entity of everything(world, household)) {
    const yard = settled.entities[entity.id];
    assert.equal(entity.travel, null);
    assert.equal(entity.location.siteId, household.homeSiteId);
    // Standing about the yard where a family always stood, not piled on one point.
    assert.deepEqual(entity.location, yard.location, `${entity.id} did not come to its own place in the yard`);
    if (entity.kind === 'person') assert.equal(entity.task, yard.task, `${entity.name} did not go back to what they were doing`);
  }
  const arrivals = world.events.filter(event => event.householdId === household.id && event.type === 'arrival');
  assert.equal(arrivals.length, 1, 'one line for the family, not one for every person and beast');
  assert.match(arrivals[0].text, /camp by the wagon/);
  assert.equal(view(world, household.id).land.arriving, undefined);
  // And now they can work.
  applyAction(world, household.id, { action: 'chore', entityId: worker.id, chore: 'plant-field' });
  validateWorld(world);
});

test('every family in the largest class is on its land long before the news', () => {
  const world = createGonzalesWorld('arrive-thirty', 30);
  assert.ok(Object.values(world.households).every(household => household.arriving), 'the fixture really does start every family on the road');
  world.status = 'running';
  while (Object.values(world.households).some(household => household.arriving)) stepWorld(world);
  // The longest track is about thirteen miles: some twenty ticks, against eighty-four before the notice.
  assert.ok(world.minute <= momentOf(world, 'notice') / 2, `the last family arrived at minute ${world.minute}`);
  for (const household of Object.values(world.households)) {
    for (const entity of everything(world, household)) assert.equal(entity.location.siteId, household.homeSiteId, `${entity.id} never arrived`);
  }
  validateWorld(world);
});

test('a family rolled in the lobby is on the road beside its wagon, and arrives with it', () => {
  const world = createGonzalesWorld('arrive-roll', 5);
  const household = world.households['hh-2'];
  rollFamily(world, household);
  const wagon = world.entities[household.property.find(id => world.entities[id].kind === 'wagon')];
  for (const entity of everything(world, household)) {
    assert.equal(entity.travel?.purpose, 'arrive', `${entity.id} was rolled at the homestead`);
    assert.deepEqual(entity.location, wagon.location);
  }
  // A saved class halfway in comes back halfway in.
  world.status = 'running';
  stepWorld(world);
  const reopened = JSON.parse(JSON.stringify(world));
  validateWorld(reopened);
  while (household.arriving) { stepWorld(world); stepWorld(reopened); }
  assert.equal(reopened.households['hh-2'].arriving, undefined);
  assert.deepEqual(reopened.entities, world.entities);
});

test('the camp costs a little: rest mends two-thirds as well, and the food keeps worse', () => {
  const camp = createGonzalesWorld('camp-cost', 5);
  camp.status = 'running';
  while (camp.households['hh-1'].arriving) stepWorld(camp);
  const house = settle(structuredClone(camp));
  // Only the roof differs between the two.
  assert.equal(housed(camp.households['hh-1']), false);
  assert.equal(housed(house.households['hh-1']), true);

  const mended = world => {
    const person = world.entities[world.households['hh-1'].principalId];
    person.task = 'rest'; person.exertion = 15;
    advanceRoutine(world, 60);
    return 15 - person.exertion;
  };
  assert.equal(mended(house), REST_MILES_PER_MINUTE * 60);
  assert.equal(mended(camp), Math.round(REST_MILES_PER_MINUTE * 60 * CAMP_REST_SHARE * 10000) / 10000);

  const foodAfterADay = world => {
    world.households['hh-1'].resources.food = 20;
    advanceRoutine(world, 1440);
    return world.households['hh-1'].resources.food;
  };
  const housedFood = foodAfterADay(house), campFood = foodAfterADay(camp);
  assert.equal(campFood, Math.round(housedFood * (1 - CAMP_SPOILAGE_PER_DAY) * 10000) / 10000);
  assert.ok(housedFood - campFood < 1, 'a little, not a hardship');

  // Resting anywhere but the family's own land is not the camp.
  const away = structuredClone(camp);
  const traveller = away.entities[away.households['hh-1'].principalId];
  traveller.location = { ...away.map.sites.gonzales, siteId: 'gonzales' };
  assert.equal(mended(away), REST_MILES_PER_MINUTE * 60);

  // The family is told what the camp costs, in numbers, on its own land line.
  assert.deepEqual(view(camp, 'hh-1').land.camp, { restShare: CAMP_REST_SHARE, spoilagePerDay: CAMP_SPOILAGE_PER_DAY });
  assert.equal(view(house, 'hh-1').land.camp, undefined);
});

test('a class saved before arrivals is housed, camps nowhere, and eats and rests as it did', () => {
  const old = createWorld('before-arrivals', 5);
  const household = old.households['hh-1'];
  assert.equal(household.arriving, undefined);
  assert.equal(housed(household), true);
  for (const entity of everything(old, household)) assert.equal(entity.location.siteId, household.homeSiteId);
  assert.equal(view(old, 'hh-1').land.shelter, 'house');
  assert.equal(view(old, 'hh-1').arrivalClass, undefined);
  const person = old.entities[household.principalId];
  person.task = 'rest'; person.exertion = 15; household.resources.food = 20;
  advanceRoutine(old, 60);
  assert.equal(15 - person.exertion, REST_MILES_PER_MINUTE * 60);
  old.status = 'running';
  stepWorld(old);
  assert.equal(old.events.filter(event => event.type === 'arrival').length, 0, 'an old class announced an arrival');
  validateWorld(old);
});

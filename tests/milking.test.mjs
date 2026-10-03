// Milking the cow (owner, 2026-10-02, verbatim: "yes, but make it a chore that kids can do. on the road it can be done by adults and
// set to auto."; sim/milking.mjs, docs/STOCK.md §9, docs/HUNGER.md §10a). Each test is seen failing under the injection
// scripts/milking-injections.mjs names for it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability, choresFor } from '../sim/chores.mjs';
import { flee, flightProjection } from '../sim/scrape.mjs';
import { settleMeans } from '../sim/means.mjs';
import { MILK_A_DAY } from '../sim/flight-work.mjs';
import { MILK_AT_HOME, MILK_FROM_AGE } from '../sim/milking.mjs';
import { setChildAuto } from '../sim/childhood.mjs';
import { feedsNow } from '../public/family-panel.js';
import { createSettledWorld, settle } from './support/settled.mjs';

const DAY = 1440;
const home = seed => { const world = createSettledWorld(seed, 5); world.status = 'running'; return world; };
const members = (world, household) => household.members.map(id => world.entities[id]);
/** Somebody of the family made for the test at this age, at home (the dice are not asked). */
function kin(world, household, id, age) {
  const at = world.entities[household.members[0]].location;
  const person = { id, kind: 'person', name: `P${id}`, householdId: household.id, age, sex: 'female', kin: { role: 'daughter' }, task: 'rest', chore: null, health: { condition: 'well' }, location: { ...at }, traits: { obedience: 6 } };
  world.entities[id] = person;
  household.members.push(id);
  return person;
}
const grownUp = (world, household) => members(world, household).find(person => !Number.isFinite(person.age) || person.age >= 16);
const offeredTo = (world, household, person, id) => choresFor(world, household, person).find(entry => entry.id === id) || null;
/** Runs this person's work in hand to its end. */
const finish = (world, person, most = 60) => { for (let tick = 0; tick < most && person.chore; tick++) stepWorld(world); };
const tomorrow = world => { const next = (Math.floor(world.minute / DAY) + 1) * DAY; for (let tick = 0; tick < 400 && world.minute < next; tick++) stepWorld(world); };

// ------------------------------------------------------------------------------------------------ at home

test('at home: a family with cattle milks its cow once a day, a child of seven as well as a grown person, for a little food', () => {
  const world = home('milk-home');
  const household = world.households['hh-1'];
  household.herd = { cattle: 4, hogs: 0 };
  const child = kin(world, household, 'p-seven', MILK_FROM_AGE), small = kin(world, household, 'p-five', 5);
  const grown = grownUp(world, household);
  assert.ok(offeredTo(world, household, child, 'milk-cow')?.can, 'a child of seven is not offered the milking');
  assert.equal(offeredTo(world, household, small, 'milk-cow'), null, 'a child of five is offered the milking');
  assert.ok(offeredTo(world, household, grown, 'milk-cow')?.can, 'a grown person is not offered the milking');
  household.resources.food = 10;
  applyAction(world, household.id, { action: 'chore', entityId: child.id, chore: 'milk-cow' });
  finish(world, child);
  assert.equal(child.chore, null, 'the milking never ended');
  assert.ok(world.events.some(event => event.actorId === child.id && event.text === `${child.name} milked the cow: ${MILK_AT_HOME} food.`), 'the milk is not said');
  assert.equal(household.milkDay, Math.floor(world.minute / DAY));
  // Once a day: the grown person is refused it now, in words.
  const refused = choreAvailability(world, household, grown, 'milk-cow');
  assert.equal(refused.can, false, 'the cow was milked twice in a day');
  assert.match(refused.why, /The cow has been milked today; she gives once a day\./);
  tomorrow(world);
  assert.equal(choreAvailability(world, household, grown, 'milk-cow').can, true, 'the cow was never milked again');
  validateWorld(world);
});

test('at home: the milk is food, MILK_AT_HOME for the cow, counted in the store; and the bar\'s food works include it', () => {
  const world = home('milk-food');
  const household = world.households['hh-1'];
  household.herd = { cattle: 2, hogs: 0 };
  const grown = grownUp(world, household);
  household.resources.food = 50;
  const before = household.resources.food, eventsBefore = world.events.length;
  applyAction(world, household.id, { action: 'chore', entityId: grown.id, chore: 'milk-cow' });
  finish(world, grown);
  const milked = world.events.slice(eventsBefore).filter(event => /milked the cow/.test(event.text));
  assert.equal(milked.length, 1);
  assert.ok(household.resources.food > before - 1, 'the store fell as if nothing came in');
  assert.equal(MILK_AT_HOME, 0.35);
  assert.equal(feedsNow('milk-cow', 'low'), true);
  assert.equal(feedsNow('milk-road', 'empty'), true);
});

test('no cow, no milking: greyed with its want where the town has the stock pens, hidden where it has none, and never on a child\'s bar', () => {
  const world = home('milk-none');
  const household = world.households['hh-1'];
  household.herd = { cattle: 0, hogs: 3 };
  const grown = grownUp(world, household), child = kin(world, household, 'p-eight', 8);
  // Gonzales has the stock pens: a cow and calf can be bought.
  household.settlementId = 'gonzales';
  const entry = offeredTo(world, household, grown, 'milk-cow');
  assert.ok(entry && !entry.can, 'a family with no cow and the stock pens in town is not shown the milking greyed');
  assert.match(entry.why, /no cow to milk/);
  const view = projectWorld(world, household.id, 'student', { includeMap: false });
  assert.deepEqual(view.household.wants?.['milk-cow'], { cow: [0, 1] }, 'the milking does not say it wants a cow');
  assert.ok(view.household.buy?.includes('cow'), 'the stock pens are not offered as the way to a cow');
  assert.equal(offeredTo(world, household, child, 'milk-cow'), null, 'a child is shown the milking with no cow to milk');
  // Away from home - in Gonzales - it is refused as any home work is, with no want of a cow, so the bar does not keep it as a
  // goal over the town's scene (the overlap proof at 1024x600, 2026-10-02).
  const atHouse = grown.location;
  grown.location = { ...atHouse, siteId: 'gonzales' };
  const away = offeredTo(world, household, grown, 'milk-cow');
  assert.ok(!away || (!away.can && /is not at home/.test(away.why) && !away.short), `away from home the milking is ${JSON.stringify(away)}`);
  household.herd = { cattle: 2, hogs: 0 };
  assert.match(choreAvailability(world, household, grown, 'milk-cow').why, /is not at home/, 'milked from Gonzales');
  household.herd = { cattle: 0, hogs: 3 };
  grown.location = atHouse;
  // A town with no stock pens: no way to a cow, so not shown at all.
  household.settlementId = 'san-felipe';
  assert.equal(offeredTo(world, household, grown, 'milk-cow'), null, 'shown greyed with no way to get a cow');
});

// ------------------------------------------------------------------------------------------------ on the road

/** A real-land class in the spring, the first family fled with its milk cow, driven by a child. */
function onTheRoad(seed) {
  const world = createGonzalesWorld(seed, 6, { map: 'colonies' });
  settleMeans(world); settle(world);
  world.status = 'running';
  world.period = 3;
  const household = Object.values(world.households)[0];
  household.played = true;
  household.herd = { cattle: 4, hogs: 0 };
  household.flight = { status: 'ordered', orderedMinute: world.minute };
  household.resources.food = 30;
  const refuge = [...flightProjection(world, household).refuges].sort((a, b) => a.miles - b.miles)[0].id;
  flee(world, household, { take: { food: 30 }, refuge });
  const driver = kin(world, household, 'p-driver', 9);
  driver.travel = structuredClone(world.entities[household.members[0]].travel);
  household.flight.cow = { by: driver.id, since: world.minute };
  household.resources.food = 30;
  return { world, household, driver, grown: members(world, household).find(person => (person.age ?? 30) >= 16 && person.travel?.purpose === 'flee') };
}

test('on the road: the milk cow gives nothing by herself any longer; milked by a grown person she gives her day\'s milk once, nothing on a day she strayed', () => {
  const { world, household, grown, driver } = onTheRoad('milk-road');
  assert.ok(grown, 'nobody grown on the road');
  const said = () => world.events.filter(event => event.householdId === household.id && /milked the cow/.test(event.text)).length;
  // A whole day with nobody milking: nothing comes in from her.
  tomorrow(world); tomorrow(world);
  assert.equal(said(), 0);
  assert.ok(!world.events.some(event => event.householdId === household.id && /gave a little milk tonight/.test(event.text)), 'the cow still milked herself');
  // Milked: once.
  delete household.flight.cow.strayDay;
  assert.ok(offeredTo(world, household, grown, 'milk-road')?.can, 'a grown person on the road is not offered the milking');
  assert.ok(offeredTo(world, household, driver, 'milk-road')?.can, 'the child with the cow is not offered the milking');
  assert.equal(offeredTo(world, household, grown, 'milk-cow'), null, 'the home\'s milking offered on the road');
  applyAction(world, household.id, { action: 'chore', entityId: grown.id, chore: 'milk-road' });
  finish(world, grown);
  assert.equal(said(), 1, 'the milking on the road paid nothing');
  assert.ok(world.events.some(event => event.actorId === grown.id && event.text === `${grown.name} milked the cow: ${MILK_A_DAY} food.`));
  assert.match(choreAvailability(world, household, driver, 'milk-road').why, /milked today/);
  // A day she strayed: no milk.
  tomorrow(world);
  household.flight.cow.strayDay = Math.floor(world.minute / DAY);
  assert.match(choreAvailability(world, household, grown, 'milk-road').why, /got away into the brush today/);
  // No cow along: not offered.
  delete household.flight.cow;
  assert.equal(offeredTo(world, household, grown, 'milk-road'), null, 'the milking offered with no cow along');
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ on auto

test('auto: a grown person on auto milks every day at home, and goes on milking on the road with the cow along', () => {
  const world = home('milk-auto');
  const household = world.households['hh-1'];
  household.played = true;
  household.herd = { cattle: 3, hogs: 0 };
  const grown = grownUp(world, household);
  household.mainId = grown.id;
  applyAction(world, household.id, { action: 'chore', entityId: grown.id, chore: 'milk-cow' });
  applyAction(world, household.id, { action: 'set-auto', entityId: grown.id, auto: true });
  const from = world.events.length;
  for (let day = 0; day < 3; day++) tomorrow(world);
  const days = new Set(world.events.slice(from).filter(event => event.actorId === grown.id && /milked the cow/.test(event.text)).map(event => Math.floor(event.minute / DAY)));
  assert.ok(days.size >= 3, `milked on ${days.size} of 4 days on auto`);
  // On the road.
  const { world: road, household: fled, grown: walker } = onTheRoad('milk-auto-road');
  delete fled.flight.cow.strayDay;
  fled.mainId = walker.id;
  walker.order = { chore: 'milk-cow' }; walker.auto = true;
  const before = road.events.length;
  tomorrow(road); tomorrow(road);
  const onRoad = road.events.slice(before).filter(event => event.actorId === walker.id && /milked the cow/.test(event.text));
  assert.ok(onRoad.length >= 1, 'somebody on auto never milked on the road');
  validateWorld(road);
});

test('auto: a child on auto at home takes up the milking among the jobs', () => {
  const world = home('milk-child-auto');
  const household = world.households['hh-1'];
  household.played = true;
  household.herd = { cattle: 3, hogs: 0 };
  household.eggsDay = Math.floor(world.minute / DAY);
  const child = kin(world, household, 'p-nine', 9);
  setChildAuto(world, household, child, true);
  for (let tick = 0; tick < 120 && !world.events.some(event => event.actorId === child.id && /milked the cow/.test(event.text)); tick++) stepWorld(world);
  assert.ok(world.events.some(event => event.actorId === child.id && /milked the cow/.test(event.text)), 'a child on auto never milked');
});

test('saves: a class saved before milking opens as not milked today, and a milking day that cannot be is refused', () => {
  const world = home('milk-save');
  validateWorld(world);
  const household = world.households['hh-1'];
  household.milkDay = 2;
  validateWorld(world);
  household.milkDay = 'today';
  assert.throws(() => validateWorld(world), /Invalid milking day/);
});

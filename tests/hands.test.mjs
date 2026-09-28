// More hands, faster (owner, 2026-09-28, docs/FAMILY_PANEL.md §21, sim/hands.mjs): "If I add another person to the task it
// should speed the task up."
//
// Work into one thing - the house, a clearing, the lane, felling - goes at `crewPace(n)` of one person's work, each hand a little
// less than the last; one job done together - the field, the well, a fence, the carreta - is joined by the second pair of hands,
// done once, at the crew's pace. Four of a family at most; a fifth is refused in words.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { tooYoung } from '../sim/family.mjs';
import { HOUSES, houseBuilt } from '../sim/houses.mjs';
import { SEED_PER_PLOT, clearedOf } from '../sim/improvements.mjs';
import { HAND_SHARES, MOST_HANDS, crewPace, handShare } from '../sim/hands.mjs';
import { createSettledWorld } from './support/settled.mjs';

/** Everybody old enough, made alike in the hands and strength, so what differs between two runs is only how many are sent. */
function alike(world, household, count) {
  const people = household.members.map(id => world.entities[id]).filter(person => person.kind === 'person' && !tooYoung(person));
  for (const person of people) { person.skills = { ...person.skills, hands: 2, farming: 2 }; delete person.traits?.strength; }
  assert.ok(people.length >= count, `the family has ${count} grown hands`);
  return people.slice(0, count);
}

test('the curve: each hand adds a little less than the last, and four is the most that help', () => {
  assert.deepEqual(HAND_SHARES, [1, 0.8, 0.6, 0.4]);
  assert.equal(MOST_HANDS, 4);
  assert.deepEqual([1, 2, 3, 4, 5, 9].map(crewPace), [1, 1.8, 2.4, 2.8, 2.8, 2.8]);
  assert.deepEqual([1, 2, 3, 4].map(handShare), [1, 0.9, 0.8, 0.7]);
  const added = [2, 3, 4].map(n => Math.round((crewPace(n) - crewPace(n - 1)) * 100) / 100);
  assert.deepEqual(added, [0.8, 0.6, 0.4], 'each hand adds less than the one before');
});

/** A family come in off the road with a jacal planned: no two-handed courses, so only the number of hands moves the pace. */
function jacal(count) {
  const world = createGonzalesWorld('hands-house', 5);
  const household = world.households['hh-1'];
  world.status = 'running';
  for (let tick = 0; tick < 60 && household.arriving; tick++) stepWorld(world);
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'jacal' });
  const people = alike(world, household, count);
  for (const person of people) applyAction(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'build-house' });
  let ticks = 0;
  for (; ticks < 400 && !houseBuilt(household); ticks++) stepWorld(world);
  assert.ok(houseBuilt(household), `${count} built the jacal`);
  assert.equal(household.house.work, HOUSES.jacal.work, 'nobody put in work past the end');
  validateWorld(world);
  return ticks;
}

test('more hands on the house go faster, each a little less than the last: 1, 1.8, 2.4 and 2.8 of one', () => {
  const [one, two, three, four] = [1, 2, 3, 4].map(jacal);
  // The spells are the house's own; the walk over to it is the same for everybody, so allow it a tick or two either way.
  const near = (ticks, share) => Math.abs(ticks - one / share) <= 3;
  // The owner's numbers written out, not read back from the module, so a curve changed there is caught here in the house itself.
  assert.ok(near(two, 1.8), `two took ${two} ticks where one took ${one}: not 1.8 times as fast`);
  assert.ok(near(three, 2.4), `three took ${three} ticks where one took ${one}: not 2.4 times as fast`);
  assert.ok(near(four, 2.8), `four took ${four} ticks where one took ${one}: not 2.8 times as fast`);
  assert.ok(one > two && two > three && three > four, 'every hand added made it sooner');
  assert.ok(one / two > two / three && two / three > three / four, 'each hand added less than the one before');
});

test('a second pair of hands at the planting works alongside the first: the field is planted once, sooner, and the seed spent once', () => {
  const plant = count => {
    const world = createSettledWorld('hands-field');
    world.status = 'running';
    const household = world.households['hh-1'];
    household.resources.seed = 40;
    const people = alike(world, household, count);
    for (const person of people) applyAction(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'plant-field' });
    if (count > 1) {
      const lead = world.entities[people[0].id];
      for (const person of people.slice(1)) {
        assert.equal(world.entities[person.id].chore.alongside, lead.id, `${person.name} works alongside ${lead.name}`);
        assert.ok(world.events.some(event => event.text === `${person.name} went to work alongside ${lead.name}: plant the field.`));
      }
    }
    let ticks = 0;
    for (; ticks < 200 && people.some(person => world.entities[person.id].chore); ticks++) {
      stepWorld(world);
      // Alongside means beside them, on the family's own land, and glowing at the same work on the row.
      for (const person of people.slice(1)) if (world.entities[person.id].chore) assert.equal(world.entities[person.id].chore.id, 'plant-field');
    }
    assert.equal(household.field.state, 'planted');
    // Nobody finished before the field was in: the hands alongside finish with the one they helped.
    for (const person of people) assert.equal(world.entities[person.id].chore, null);
    validateWorld(world);
    return { ticks, spent: 40 - household.resources.seed, cleared: clearedOf(household), world };
  };
  const one = plant(1), two = plant(2), four = plant(4);
  assert.equal(one.spent, SEED_PER_PLOT * one.cleared, 'one planter spends the field\'s seed');
  assert.equal(two.spent, one.spent, 'two planters spend it once, not twice');
  assert.equal(four.spent, one.spent, 'and so do four');
  assert.ok(two.ticks < one.ticks, `two took ${two.ticks} ticks, one ${one.ticks}`);
  assert.ok(four.ticks < two.ticks, `four took ${four.ticks} ticks, two ${two.ticks}`);
});

test('a fifth of the family is refused a work four are at, in words; the hands alongside take the job up if its lead is called away', () => {
  const world = createSettledWorld('hands-crowd', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  household.resources.seed = 40;
  // A family with five grown people: a cousin come to live with them, as the settled families here are four.
  const cousin = { ...structuredClone(world.entities[household.principalId]), id: 'hh-1-cousin', name: 'Cousin Amos', chore: null, order: undefined };
  world.entities[cousin.id] = cousin;
  household.members.push(cousin.id);
  const people = household.members.map(id => world.entities[id]).filter(person => person.kind === 'person' && !tooYoung(person));
  assert.ok(people.length > MOST_HANDS, 'five grown people');
  for (const person of people.slice(0, MOST_HANDS)) applyAction(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'plant-field' });
  const fifth = people[MOST_HANDS];
  const why = choreAvailability(world, household, fifth, 'plant-field').why;
  assert.equal(why, `${people.slice(0, 3).map(person => person.name).join(', ')} and ${people[3].name} are at it already. More than 4 of the family at one work only get in each other's way.`);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: fifth.id, chore: 'plant-field' }), /get in each other's way/);
  for (const person of people.slice(0, MOST_HANDS)) applyAction(world, 'hh-1', { action: 'stop-chore', entityId: person.id });
  // Two at the planting; the lead is called off, and the one alongside takes the job up as their own.
  const [lead, helper] = people;
  applyAction(world, 'hh-1', { action: 'chore', entityId: lead.id, chore: 'plant-field' });
  applyAction(world, 'hh-1', { action: 'chore', entityId: helper.id, chore: 'plant-field' });
  assert.equal(world.entities[helper.id].chore.alongside, lead.id);
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: lead.id });
  stepWorld(world);
  const taken = world.entities[helper.id].chore;
  assert.equal(taken?.id, 'plant-field', 'the one alongside went on with the planting');
  assert.equal(taken.alongside, undefined, 'and leads it now');
  for (let tick = 0; tick < 200 && world.entities[helper.id].chore; tick++) stepWorld(world);
  assert.equal(household.field.state, 'planted');
  // The row glows at the planting for both while they are at it (public/family-panel.js reads `chore.id`).
  assert.ok(projectWorld(world, 'hh-1', 'student', { includeMap: false }));
  validateWorld(world);
});

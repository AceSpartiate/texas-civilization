// Rolling a family: docs/FAMILY_CREATION.md, step 1.
//
// A student rolls one die and the number is the size of the family - one parent for 1 to 3,
// two for 4 to 6, the rest children. Every person gets a visible age that makes sense with
// the parents' and three hidden stats whose averages differ between men and women and whose
// ranges overlap. None of the hidden stats may reach any client, and a child under ten is
// not sent anywhere. Each test here is one gate from that document.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, projectWorld, projectFamily, validateWorld, rollFamily, travelModesFor } from '../sim/world.mjs';
import { choresFor } from '../sim/chores.mjs';
import { observedBy } from '../sim/town.mjs';
import {
  ADULT_AT, CHILD_MAX_AGE, MOTHER_AT_BIRTH, SENT_FROM_AGE,
  compositionFor, dealTraits, familyRoll, rolledPeople,
} from '../sim/family.mjs';

const SIZES = { 1: [1, 0], 2: [1, 1], 3: [1, 2], 4: [2, 2], 5: [2, 3], 6: [2, 4] };
const isParent = person => person.role === 'father' || person.role === 'mother';
const lobby = (seed = 'roll', players = 5) => createGonzalesWorld(seed, players);

test('the number rolled is the size of the family, parents first', () => {
  for (const [roll, [parents, children]] of Object.entries(SIZES)) {
    assert.deepEqual(compositionFor(Number(roll)), { parents, children }, `a roll of ${roll}`);
    for (let n = 0; n < 40; n++) {
      const people = rolledPeople(`size-${n}`, `hh-${1 + (n % 30)}`, n % 30, Number(roll));
      assert.equal(people.length, Number(roll));
      assert.equal(people.filter(isParent).length, parents);
      assert.ok(people.slice(0, parents).every(isParent), 'parents come first, so the principal is a parent');
      if (parents === 2) assert.deepEqual(people.slice(0, 2).map(person => person.role), ['father', 'mother']);
    }
  }
  assert.throws(() => compositionFor(7));

  const world = lobby('size-world', 15);
  for (const household of Object.values(world.households)) {
    const roll = rollFamily(world, household);
    assert.equal(roll, familyRoll(world.seed, household.id), 'the roll is the seed’s, so a reload is the same family');
    assert.equal(household.members.length, roll);
    assert.equal(household.principalId, household.members[0]);
    assert.equal(world.entities[household.principalId].principal, true);
    assert.equal(household.members.filter(id => world.entities[id].principal).length, 1);
  }
  validateWorld(world);
  // Every roll turns up somewhere in a large enough class of classes.
  const seen = new Set();
  for (let n = 0; n < 60; n++) seen.add(familyRoll(`faces-${n}`, 'hh-1'));
  assert.equal(seen.size, 6, `a fair-looking die shows every face: ${[...seen].sort()}`);
});

test('every family could exist: children fit their mother, and no two share an age', () => {
  let checked = 0, lone = { male: 0, female: 0 };
  for (let n = 0; n < 400; n++) {
    const roll = 1 + (n % 6);
    const people = rolledPeople(`ages-${n}`, `hh-${1 + (n % 30)}`, n % 30, roll);
    const parents = people.filter(isParent), children = people.filter(person => !isParent(person));
    // All of them: a young couple rolled a large family is made older, never given fewer children.
    assert.equal(children.length, compositionFor(roll).children, `a roll of ${roll} came out with ${children.length} children`);
    for (const parent of parents) assert.ok(parent.age >= 18 && parent.age <= 70, `a parent aged ${parent.age}`);
    if (parents.length === 2) assert.ok(Math.abs(parents[0].age - parents[1].age) <= 8, 'two parents within eight years of each other');
    else lone[parents[0].sex]++;
    const mother = parents.length === 2 ? parents[1].age : parents[0].sex === 'female' ? parents[0].age : parents[0].age - 2;
    for (const child of children) {
      assert.ok(child.age >= 0 && child.age <= CHILD_MAX_AGE, `a child aged ${child.age}`);
      const motherThen = mother - child.age;
      assert.ok(motherThen >= MOTHER_AT_BIRTH[0] && motherThen <= MOTHER_AT_BIRTH[1], `a mother of ${mother} with a child of ${child.age} was ${motherThen} at the birth`);
    }
    assert.equal(new Set(children.map(child => child.age)).size, children.length, 'two children in one family share an age');
    assert.deepEqual(children.map(child => child.age), [...children.map(child => child.age)].sort((a, b) => b - a), 'eldest first');
    checked++;
  }
  assert.equal(checked, 400);
  assert.ok(lone.male > 0 && lone.female > 0, `a lone parent is sometimes a father and sometimes a mother (${lone.male}/${lone.female})`);
});

test('the hidden stats differ on average between men and women, and people overlap', () => {
  const adults = { male: [], female: [] };
  for (let n = 0; n < 1500; n++) for (const sex of ['male', 'female']) adults[sex].push(dealTraits('traits', `p-${n}-${sex}`, sex, 30));
  const mean = (list, trait) => list.reduce((sum, t) => sum + t[trait], 0) / list.length;
  assert.ok(mean(adults.male, 'strength') > mean(adults.female, 'strength') + 1, 'men are stronger on average');
  assert.ok(mean(adults.male, 'health') > mean(adults.female, 'health') + 1, 'men have more health on average');
  assert.ok(mean(adults.female, 'housework') > mean(adults.male, 'housework') + 1, 'women keep a better house on average');
  // The owner's second decision: dealt per person, so the ranges overlap both ways.
  const top = (list, trait) => Math.max(...list.map(t => t[trait]));
  const bottom = (list, trait) => Math.min(...list.map(t => t[trait]));
  assert.ok(top(adults.female, 'strength') > bottom(adults.male, 'strength'), 'no woman is stronger than any man');
  assert.ok(top(adults.male, 'housework') > bottom(adults.female, 'housework'), 'no man keeps a better house than any woman');
  assert.ok(adults.female.filter(t => t.strength >= mean(adults.male, 'strength')).length > 30, 'a strong woman is vanishingly rare rather than merely uncommon');
  // Children grow into it.
  const young = dealTraits('traits', 'child', 'male', 4), grown = dealTraits('traits', 'child', 'male', ADULT_AT);
  assert.ok(young.strength < grown.strength && young.health < grown.health, 'a four-year-old is as strong as a sixteen-year-old');
});

test('the hidden stats reach no payload: not the family’s own, not a neighbour’s, not the Host’s', () => {
  const world = lobby('hidden', 5);
  for (const household of Object.values(world.households)) rollFamily(world, household);
  // A value nothing else in a payload could be, so finding it means a leak.
  for (const entity of Object.values(world.entities)) if (entity.traits) entity.traits = { strength: 9187, health: 9281, housework: 9373 };
  world.status = 'running';
  const leak = /9187|9281|9373|"traits"|"strength"|"housework"/;
  // Everybody stands in Gonzales so every family observes every other.
  for (const household of Object.values(world.households)) {
    for (const id of household.members) world.entities[id].location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  }
  for (let tick = 0; tick < 60; tick++) {
    stepWorld(world);
    if (tick % 10) continue;
    assert.doesNotMatch(JSON.stringify(projectWorld(world, undefined, 'host', { includeMap: false })), leak, `the Host at tick ${tick}`);
    for (const household of Object.values(world.households)) {
      assert.doesNotMatch(JSON.stringify(projectWorld(world, household.id, 'student', { includeMap: false })), leak, `${household.id} at tick ${tick}`);
      assert.doesNotMatch(JSON.stringify(projectFamily(world, household.id)), leak, `${household.id}'s family book`);
      assert.ok(observedBy(world, household.id).length > 0, 'the fixture really does put neighbours in view');
    }
  }
});

test('a family is rolled once, and before anything happens to it', () => {
  const world = lobby('once', 5);
  const [first, second, third, fourth] = Object.values(world.households);
  assert.equal(projectFamily(world, first.id).canRoll, true);
  assert.equal(projectFamily(world, first.id).roll, null);
  applyAction(world, first.id, { action: 'roll-family' });
  assert.equal(projectFamily(world, first.id).canRoll, false);
  assert.equal(projectFamily(world, first.id).roll, first.roll);
  assert.throws(() => applyAction(world, first.id, { action: 'roll-family' }), /already rolled/);

  applyAction(world, second.id, { action: 'rename', entityId: second.principalId, name: 'Bartolo' });
  assert.throws(() => rollFamily(world, second), /before anybody in it is named/);
  applyAction(world, third.id, { action: 'chore', entityId: third.members[1], chore: 'plant-field' });
  assert.throws(() => rollFamily(world, third), /set to work/);
  world.status = 'running';
  assert.throws(() => rollFamily(world, fourth), /before the class begins/);
  assert.equal(fourth.members.length, 4, 'a family that was never rolled keeps the founding four');
  validateWorld(world);
});

test('a child under ten is not sent anywhere, and the controls say so', () => {
  let world = null, child = null;
  for (let n = 0; n < 40 && !child; n++) {
    world = lobby(`young-${n}`, 5);
    for (const household of Object.values(world.households)) rollFamily(world, household);
    child = Object.values(world.entities).find(entity => Number.isFinite(entity.age) && entity.age < SENT_FROM_AGE);
  }
  assert.ok(child, 'no class produced a young child to test with');
  const household = world.households[child.householdId];
  const why = new RegExp(`${child.name} is too young`);
  assert.ok(choresFor(world, household, child).every(chore => !chore.can && why.test(chore.why)), 'the work controls offer a small child a job');
  assert.ok(travelModesFor(world, child).every(mode => !mode.can && why.test(mode.why)), 'the travel controls offer a small child a road');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: child.id, chore: 'plant-field' }), why);
  assert.throws(() => applyAction(world, household.id, { action: 'travel', entityId: child.id, destination: 'gonzales' }), why);
  // Being named is still allowed: a child is a person in the book like anybody else.
  applyAction(world, household.id, { action: 'rename', entityId: child.id, name: 'Little One' });
  assert.equal(child.name, 'Little One');
  // And the family book says how old everybody is.
  const book = projectFamily(world, household.id);
  assert.equal(book.people.find(person => person.id === child.id).age, child.age);
});

test('the family book says what a rolled family is, and an unrolled class is unchanged', () => {
  let world = null, lone = null;
  for (let n = 0; n < 60 && !lone; n++) {
    world = lobby(`book-${n}`, 5);
    for (const household of Object.values(world.households)) rollFamily(world, household);
    lone = Object.values(world.households).find(household => household.roll <= 3);
  }
  assert.ok(lone, 'no class produced a lone parent');
  const book = projectFamily(world, lone.id);
  assert.match(book.people[0].of, /Widowed/, 'a lone parent is said to be widowed rather than left unexplained');
  assert.ok(book.people.every(person => Number.isFinite(person.age)));

  // A class that nobody rolls - every class saved before this existed - is the founding four,
  // with no ages, no sex and no hidden stats, and nothing in the book claims otherwise.
  const old = lobby('unrolled', 5);
  for (const household of Object.values(old.households)) {
    assert.equal(household.members.length, 4);
    for (const id of household.members) {
      const person = old.entities[id];
      assert.equal(person.age, undefined); assert.equal(person.sex, undefined); assert.equal(person.traits, undefined);
    }
    assert.ok(projectFamily(old, household.id).people.every(person => person.age === undefined && !/Widowed/.test(person.of || '')));
  }
  validateWorld(old);
});

test('a family sees its own people’s ages; a neighbour sees only a man or a woman and roughly how old', () => {
  const world = lobby('glance', 5);
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (const household of Object.values(world.households)) {
    for (const id of household.members) world.entities[id].location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  }
  const mine = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  for (const entity of mine.entities.filter(e => e.kind === 'person')) {
    assert.ok(['male', 'female'].includes(entity.sex));
    assert.ok(Number.isFinite(entity.age), 'the family knows how old its own people are');
    assert.ok(['infant', 'small', 'child', 'youth', 'adult'].includes(entity.band));
  }
  const seen = observedBy(world, 'hh-1').filter(person => person.householdId && person.householdId !== 'hh-1');
  assert.ok(seen.length > 0, 'the fixture puts neighbours in view');
  for (const person of seen) {
    assert.ok(['male', 'female'].includes(person.sex));
    assert.ok(['infant', 'small', 'child', 'youth', 'adult'].includes(person.band));
    assert.equal(person.age, undefined, 'a glance does not tell you a neighbour’s child is exactly three');
  }
});

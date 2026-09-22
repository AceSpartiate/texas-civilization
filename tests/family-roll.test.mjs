// Rolling a family: docs/FAMILY_CREATION.md, step 1.
//
// A student rolls one twenty-sided die and the number is the family (owner, 2026-09-22: "if i roll a 20, there should be 18
// kids. if i roll a 4 it's two parents and 2 kids. each number over 4 is another kid"; by multiple choice, "The roll is the
// family") - one parent and the rest children on 1 to 3, both parents and the rest children from 4. A class rolled on the
// 2026-09-14 table (each face a set family) or on six sides still opens as it was. Every person gets a visible age that makes
// sense with the parents' and three hidden stats whose averages differ between men and women and whose ranges overlap. None
// of the hidden stats may reach any client, and a child under ten is not sent anywhere. Each test here is one gate from that
// document.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { settle } from './support/settled.mjs';
import { applyAction, stepWorld, projectWorld, projectFamily, validateWorld, rollFamily, travelModesFor } from '../sim/world.mjs';
import { choresFor } from '../sim/chores.mjs';
import { observedBy } from '../sim/town.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import {
  ADULT_AT, CHILD_MAX_AGE, MOTHER_AT_BIRTH, FATHER_AT_BIRTH, SENT_FROM_AGE, FIGHTS_FROM_AGE, NAME_POOLS,
  FAMILY_DIE, FAMILY_FACES, FAMILY_TABLE, compositionFor, tableOf, listWords, rolledWords, dealTraits, familyRoll, rolledPeople,
} from '../sim/family.mjs';

/** The owner's table, 2026-09-22: the number is the family. [parents, children] for rolls 1 to 20. */
const SIZE = Array.from({ length: 20 }, (_, i) => (i + 1 <= 3 ? [1, i] : [2, i - 1]));
/** The 2026-09-14 table, kept for classes rolled on it: [parents, children] for faces 1 to 20. */
const FACES = [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [2, 0], [2, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5], [2, 6], [2, 7], [2, 8]];
const sizeOf = roll => roll;
const isParent = person => person.role === 'father' || person.role === 'mother';
const lobby = (seed = 'roll', players = 5) => createGonzalesWorld(seed, players);
/** The first seed, counting up, whose household `hh-1` rolls `roll`: a class with a family of that size in it, found not forced. */
const seedRolling = (roll, stem = 'rolls') => { for (let n = 0; ; n++) if (familyRoll(`${stem}-${n}`, 'hh-1') === roll) return `${stem}-${n}`; };

test('the roll is the family: one parent on 1 to 3, both from 4, and every number over that another child', () => {
  assert.equal(FAMILY_DIE, 20);
  assert.equal(FAMILY_TABLE, 'd20-size');
  // The owner's own three examples, word for word.
  assert.deepEqual(compositionFor(20), { parents: 2, children: 18 }, '"if i roll a 20, there should be 18 kids"');
  assert.deepEqual(compositionFor(4), { parents: 2, children: 2 }, '"if i roll a 4 it\'s two parents and 2 kids"');
  for (let roll = 5; roll <= 20; roll++) assert.equal(compositionFor(roll).children, compositionFor(roll - 1).children + 1, '"each number over 4 is another kid"');
  // And the multiple-choice answer for the three below it: the number is how many people there are.
  assert.deepEqual([1, 2, 3].map(roll => compositionFor(roll)), [{ parents: 1, children: 0 }, { parents: 1, children: 1 }, { parents: 1, children: 2 }]);
  for (let roll = 1; roll <= 20; roll++) {
    const [parents, children] = SIZE[roll - 1];
    assert.deepEqual(compositionFor(roll), { parents, children }, `a roll of ${roll}`);
    for (let n = 0; n < 40; n++) {
      const people = rolledPeople(`size-${n}`, `hh-${1 + (n % 30)}`, n % 30, roll);
      assert.equal(people.length, roll, `a roll of ${roll} is ${roll} people`);
      assert.equal(people.filter(isParent).length, parents);
      assert.ok(people.slice(0, parents).every(isParent), 'parents come first, so the principal is a parent');
      if (parents === 2) assert.deepEqual(people.slice(0, 2).map(person => person.role), ['father', 'mother']);
    }
  }
  assert.deepEqual([['Marcos'], ['Marcos', 'Levi'], ['Marcos', 'Levi', 'Delia', 'Petra']].map(listWords), ['Marcos', 'Marcos and Levi', 'Marcos, Levi, Delia and Petra'], 'a long family is listed, not strung together');
  assert.deepEqual([6, 8, 11, 18, 20].map(rolledWords), ['a 6', 'an 8', 'an 11', 'an 18', 'a 20'], 'a roll is said as it sounds');
  assert.throws(() => compositionFor(21));
  assert.throws(() => compositionFor(0));

  const world = lobby('size-world', 15);
  for (const household of Object.values(world.households)) {
    const roll = rollFamily(world, household);
    assert.equal(roll, familyRoll(world.seed, household.id), 'the roll is the seed’s, so a reload is the same family');
    assert.equal(household.members.length, sizeOf(roll));
    assert.equal(household.die, 20);
    assert.equal(household.rollTable, 'd20-size', 'a new roll is marked with the table it was read on');
    assert.equal(tableOf(household), 'd20-size');
    assert.equal(household.principalId, household.members[0]);
    assert.equal(world.entities[household.principalId].principal, true);
    assert.equal(household.members.filter(id => world.entities[id].principal).length, 1);
  }
  validateWorld(world);
  // Every roll turns up somewhere in a large enough class of classes.
  const seen = new Set();
  for (let n = 0; n < 400; n++) seen.add(familyRoll(`faces-${n}`, 'hh-1'));
  assert.equal(seen.size, 20, `a fair-looking die shows every face: ${[...seen].sort((a, b) => a - b)}`);
});

test('a class rolled on an earlier table keeps its own: the 2026-09-14 faces, and six sides', () => {
  // The tables themselves, as they were.
  assert.deepEqual(FAMILY_FACES, FACES);
  for (let roll = 1; roll <= 20; roll++) assert.deepEqual(compositionFor(roll, 'd20-faces'), { parents: FACES[roll - 1][0], children: FACES[roll - 1][1] }, `a 2026-09-14 roll of ${roll}`);
  assert.deepEqual(compositionFor(3, 'd6'), { parents: 1, children: 2 });
  assert.deepEqual(compositionFor(6, 'd6'), { parents: 2, children: 4 });
  assert.throws(() => compositionFor(7, 'd6'));
  // Which table a saved household is read on: its mark, else its die.
  assert.equal(tableOf({}), 'd6');
  assert.equal(tableOf({ die: 20 }), 'd20-faces');
  assert.equal(tableOf({ die: 20, rollTable: 'd20-size' }), 'd20-size');

  // A class rolled 2026-09-14 to -22: `die` 20 and no table. Its 20 was two parents and eight children - ten people - and it
  // opens as ten people, not re-read as the twenty a 20 makes now.
  const old = lobby(seedRolling(20), 5);
  const household = old.households['hh-1'];
  assert.equal(rolledPeople(old.seed, household.id, 0, 20, 'd20-faces').length, 10);
  rollFamily(old, household);
  assert.equal(household.members.length, 20);
  // Stand the 2026-09-14 family up from today's: both parents and the eight eldest.
  for (const id of household.members.slice(10)) delete old.entities[id];
  household.members = household.members.slice(0, 10);
  for (const id of household.members) old.entities[id].kin.children = old.entities[id].kin.children.filter(child => household.members.includes(child));
  delete household.rollTable;
  validateWorld(old);
  household.rollTable = 'd20-size';
  assert.throws(() => validateWorld(old), /rolled family/i, 'the same 20 read on the new table is twenty people, not this family of ten');
  household.rollTable = 'd20-faces';
  assert.throws(() => validateWorld(old), /family table/i, 'only the new table is ever written as a mark');
  delete household.rollTable;

  // A class rolled on six sides: no `die` at all. A six there was six people - and a six on the 2026-09-14 table two parents.
  const six = lobby(seedRolling(6, 'six-sided'), 5);
  const rolled = six.households['hh-1'];
  rollFamily(six, rolled);
  assert.equal(rolled.members.length, 6, 'a family of six to stand in for a six-sided six');
  delete rolled.die; delete rolled.rollTable;
  rolled.roll = 6;
  validateWorld(six);
  rolled.die = 20;
  assert.throws(() => validateWorld(six), /rolled family/i, 'the same six read on the 2026-09-14 faces is two parents alone, not this family');
});

test('every family could exist: children fit their mother and father, and no two share an age', () => {
  let checked = 0, lone = { male: 0, female: 0 };
  for (let n = 0; n < 800; n++) {
    const roll = 1 + (n % 20);
    const people = rolledPeople(`ages-${n}`, `hh-${1 + (n % 30)}`, n % 30, roll);
    const parents = people.filter(isParent), children = people.filter(person => !isParent(person));
    // All of them: a young couple rolled a large family is made older, never given fewer children.
    assert.equal(children.length, compositionFor(roll).children, `a roll of ${roll} came out with ${children.length} children`);
    for (const parent of parents) assert.ok(parent.age >= 18 && parent.age <= 70, `a parent aged ${parent.age}`);
    if (parents.length === 2) assert.ok(Math.abs(parents[0].age - parents[1].age) <= 8, 'two parents within eight years of each other');
    else lone[parents[0].sex]++;
    const mother = parents.length === 2 ? parents[1].age : parents[0].sex === 'female' ? parents[0].age : parents[0].age - 2;
    const father = parents.find(parent => parent.role === 'father');
    for (const child of children) {
      assert.ok(child.age >= 0 && child.age <= CHILD_MAX_AGE, `a child aged ${child.age}`);
      const motherThen = mother - child.age;
      assert.ok(motherThen >= MOTHER_AT_BIRTH[0] && motherThen <= MOTHER_AT_BIRTH[1], `a mother of ${mother} with a child of ${child.age} was ${motherThen} at the birth`);
      if (father) assert.ok(father.age - child.age >= FATHER_AT_BIRTH, `a father of ${father.age} with a child of ${child.age} was ${father.age - child.age} at the birth (roll ${roll})`);
    }
    assert.equal(new Set(children.map(child => child.age)).size, children.length, 'two children in one family share an age');
    assert.deepEqual(children.map(child => child.age), [...children.map(child => child.age)].sort((a, b) => b - a), 'eldest first');
    checked++;
  }
  assert.equal(checked, 800);
  assert.ok(lone.male > 0 && lone.female > 0, `a lone parent is sometimes a father and sometimes a mother (${lone.male}/${lone.female})`);
});

test('a 20 is two parents and eighteen children with their own names and ages, and it survives a save', () => {
  const world = lobby(seedRolling(20), 15);
  const household = world.households['hh-1'];
  assert.equal(rollFamily(world, household), 20);
  const people = household.members.map(id => world.entities[id]);
  assert.equal(people.length, 20);
  const parents = people.filter(person => ['father', 'mother'].includes(person.kin.role)), children = people.filter(person => !parents.includes(person));
  assert.equal(parents.length, 2);
  assert.equal(children.length, 18);
  // Twenty different first names: the son and daughter pools hold twenty each, and each child takes the next card.
  assert.equal(new Set(people.map(person => person.name)).size, 20, `names repeat: ${people.map(person => person.name)}`);
  assert.ok(Math.max(NAME_POOLS.son.length, NAME_POOLS.daughter.length) >= 18, 'a pool too small for eighteen of one sex');
  // Eighteen different ages from 0 to 17 fit only a mother of 34 to 42 - one child a year - and a father grown at the first.
  assert.deepEqual(children.map(child => child.age), Array.from({ length: 18 }, (_, i) => 17 - i));
  const [father, mother] = parents;
  assert.ok(mother.age >= 34 && mother.age <= 42, `a mother of ${mother.age}`);
  assert.ok(father.age - 17 >= FATHER_AT_BIRTH, `a father of ${father.age} with a child of seventeen`);
  // Every parent is the parent of all eighteen, and every child names both.
  for (const parent of parents) assert.equal(parent.kin.children.length, 18);
  for (const child of children) assert.deepEqual(child.kin.parents, [father.id, mother.id]);
  // The consequence stated plainly: the sons of sixteen and seventeen may be sent to fight.
  const old = children.filter(child => child.age >= FIGHTS_FROM_AGE);
  assert.equal(old.length, 2);
  // Validated, saved and read back exactly.
  validateWorld(world);
  const dir = mkdtempSync(join(tmpdir(), 'texas-twenty-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const back = readSave(join(dir, 'save.json')).world;
    assert.deepEqual(back, world);
    validateWorld(back);
    assert.equal(back.households['hh-1'].members.length, 20);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  // And the family book names all twenty, oldest child first after the parents.
  const book = projectFamily(world, household.id);
  assert.equal(book.people.length, 20);
  assert.deepEqual(book.people.slice(2).map(person => person.age), children.map(child => child.age));
});

test('a family of twenty fits the tick: what it is sent grows by the person, and nothing is sent twenty times over', () => {
  // A student's per-tick projection, fresh on the family's own land. tests/chores.test.mjs holds the founding four at 8000
  // bytes; a rolled family carries a row of work and travel for every person, so a family of twenty is about three times a
  // family of four and that is the cost of the owner's roll, not waste. Measured 2026-09-22 on these seeds: 7,567 bytes for a
  // 4 and 23,459 for a 20 - 993 bytes for each person more. The bounds are those with about a twentieth to spare, because the
  // per-person one is what catches anything that grows with the family twice over: each person's kin carried on the tick
  // (every child's id on both parents) measured 1,119 a person and 25,876 in all, and must fail here.
  const sent = roll => {
    const world = lobby(seedRolling(roll, 'tick'), 5);
    rollFamily(world, world.households['hh-1']);
    settle(world);
    world.status = 'running';
    return JSON.stringify(projectWorld(world, 'hh-1', 'student', { includeMap: false })).length;
  };
  const four = sent(4), twenty = sent(20);
  assert.ok(twenty < 25000, `a family of twenty is sent ${twenty} bytes a tick`);
  assert.ok((twenty - four) / 16 < 1060,`each person past four costs ${Math.round((twenty - four) / 16)} bytes a tick`);
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
  settle(world);
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
  // Settled, because a family still on the road in cannot be set to work at all.
  const world = settle(lobby('once', 5));
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

// Amended 2026-09-21 (docs/FAMILY_CREATION.md §3): a child under ten now has works of their own (sim/children.mjs), and
// what this test still holds is the other two thirds of the 2026-09-12 rule - not on a road, and not set to a grown
// person's work. The children's own works are tested in tests/children.test.mjs.
test('a child under ten is not sent anywhere and cannot be given a grown person\'s work, and the controls say so', () => {
  let world = null, child = null;
  for (let n = 0; n < 40 && !child; n++) {
    world = lobby(`young-${n}`, 5);
    for (const household of Object.values(world.households)) rollFamily(world, household);
    child = Object.values(world.entities).find(entity => Number.isFinite(entity.age) && entity.age < SENT_FROM_AGE);
  }
  assert.ok(child, 'no class produced a young child to test with');
  const household = world.households[child.householdId];
  const why = new RegExp(`${child.name} is too young`);
  // Every work on the row that is not one of the children's own is refused, and says so by name. A child old enough for
  // their own works sees only those (`childBar` in sim/chores.mjs), so on those rows this holds vacuously and the rule it
  // guards - that no grown person's work is ever offered to a child - is the same rule either way.
  assert.ok(choresFor(world, household, child).every(chore => chore.id.startsWith('child-') || (!chore.can && why.test(chore.why))), 'the work controls offer a small child a grown person\'s job');
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
    lone = Object.values(world.households).find(household => compositionFor(household.roll, tableOf(household)).parents === 1);
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

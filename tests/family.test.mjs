// Who these people are, and what a student may call them.
//
// The first person who played this asked who the mother and the father were, and the game
// had no answer at all: four names in a list, a `relationships: {}` nothing ever wrote to,
// and every household in the class a copy of the same four names. VISION.md opens on "This
// is my family"; a family the game cannot describe is a roster.
//
// The line this file holds is the one between the two halves. **Kin is the world's** and
// does not move - renaming somebody does not change whose child they are. **Names are the
// student's.** And **ids are neither**: they never change at all, because skills and faces
// are derived from them and a rename must not touch either.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, createWorld, projectFamily, projectWorld, validateWorld } from '../sim/world.mjs';
import { HOUSEHOLD_SHAPE, NAME_LIMIT, NAME_POOLS, defaultNames, householdName, rename as renameDirect, sanitiseName } from '../sim/family.mjs';
import { skillsFor } from '../sim/chores.mjs';
import { visualVariant } from '../public/motion.js';
import { readSave } from '../server/storage.mjs';

const world = (seed = 'family', count = 5) => {
  const built = createGonzalesWorld(seed, count);
  built.status = 'running';
  return built;
};
const rename = (built, householdId, input) => applyAction(built, householdId, { action: 'rename', ...input });

test('a class is not fifteen copies of one family', () => {
  const built = world('spread', 15);
  for (const slot of HOUSEHOLD_SHAPE.map(person => person.key)) {
    const names = Object.keys(built.households).map(id => built.entities[`${id}-${slot}`].name);
    assert.equal(new Set(names).size, names.length, `${names.length} households share ${new Set(names).size} ${slot} names: ${names.join(' ')}`);
  }
  // And no family holds two people with one name. That is guaranteed by construction
  // rather than by luck - each role is dealt from its own pool - so what is worth asserting
  // is the construction. Walking a sample of households instead would only catch a shared
  // name when two decks happened to land it at the same index, which is to say rarely.
  const pools = Object.entries(NAME_POOLS);
  for (const [role, names] of pools) {
    for (const [otherRole, otherNames] of pools) {
      if (role === otherRole) continue;
      const shared = names.filter(name => otherNames.includes(name));
      assert.deepEqual(shared, [], `${role} and ${otherRole} both offer ${shared.join(', ')}, so one family could hold two`);
    }
    assert.equal(new Set(names).size, names.length, `the ${role} pool repeats a name`);
    assert.ok(names.length >= 20, `${names.length} ${role} names is not enough for a class of thirty`);
  }
  for (const household of Object.values(built.households)) {
    const inside = household.members.map(id => built.entities[id].name);
    assert.equal(new Set(inside).size, inside.length, `one family holds ${inside.join(', ')}`);
  }
  // Dealt from the seed, so the same class is always the same class.
  assert.deepEqual(defaultNames('spread', 0), defaultNames('spread', 0));
  assert.notDeepEqual(defaultNames('spread', 0), defaultNames('spread', 1));
});

test('the game can say who the mother and the father are', () => {
  const built = world('kin');
  const family = projectFamily(built, 'hh-1');
  const roles = family.people.map(person => person.role);
  assert.deepEqual(roles, ['father', 'mother', 'daughter', 'son']);
  const [father, mother, daughter] = family.people;
  // In sentences, because that is what was asked for - not a graph to be read.
  assert.equal(father.of, `Married to ${mother.name}. Father to ${family.people[2].name} and ${family.people[3].name}.`);
  assert.equal(mother.of, `Married to ${father.name}. Mother to ${family.people[2].name} and ${family.people[3].name}.`);
  assert.equal(daughter.of, `Daughter of ${father.name} and ${mother.name}.`);
  assert.equal(family.people[3].of, `Son of ${father.name} and ${mother.name}.`);
});

test('a family nobody has named is named for its own, and follows when that person is renamed', () => {
  const built = world('naming');
  const household = built.households['hh-1'];
  assert.equal(household.name, undefined, 'a family should not start out labelled');
  assert.equal(householdName(built, household), `${built.entities[household.principalId].name}'s family`);
  rename(built, 'hh-1', { entityId: household.principalId, name: 'Josiah' });
  assert.equal(householdName(built, household), "Josiah's family", 'the derived name did not follow');
  // Until somebody names it, at which point it is theirs and stops following anybody.
  rename(built, 'hh-1', { name: 'The Elm Creek place' });
  assert.equal(householdName(built, household), 'The Elm Creek place');
  rename(built, 'hh-1', { entityId: household.principalId, name: 'Asa' });
  assert.equal(householdName(built, household), 'The Elm Creek place');
});

test('a rename changes the name and nothing else about the person', () => {
  const built = world('stable');
  const id = 'hh-1-rosa';
  const before = { skills: { ...built.entities[id].skills }, variant: visualVariant(id, false), kin: built.entities[id].kin };
  rename(built, 'hh-1', { entityId: id, name: 'Winnie' });
  assert.equal(built.entities[id].name, 'Winnie');
  assert.equal(built.entities[id].id, id, 'the id moved, and ids are what everything else is hung on');
  assert.deepEqual(built.entities[id].skills, before.skills, 'a rename changed what somebody is good at');
  assert.deepEqual(built.entities[id].skills, skillsFor(id), 'and skills still come from the id');
  assert.equal(visualVariant(id, false), before.variant, 'a rename changed somebody’s face');
  assert.deepEqual(built.entities[id].kin, before.kin, 'a rename changed whose child they are');
  validateWorld(built);
});

test('a family may name its own people and nobody else’s', () => {
  const built = world('mine');
  assert.throws(() => rename(built, 'hh-1', { entityId: 'hh-2-rosa', name: 'Delia' }), /Choose one of your family/);
  // Directly as well as through the door. `applyAction` refuses somebody else's person
  // before it ever gets here, so this is the second of two locks - and the one that would
  // still be holding if a later caller reached the writer another way.
  assert.throws(() => renameDirect(built, built.households['hh-1'], { entityId: 'hh-2-rosa', name: 'Delia' }), /Choose one of your family/);
  assert.throws(() => renameDirect(built, built.households['hh-1'], { entityId: 'town-pike', name: 'Delia' }), /Choose one of your family/);
  assert.notEqual(built.entities['hh-2-rosa'].name, 'Delia');
  assert.throws(() => rename(built, 'hh-1', { entityId: 'town-ibarra', name: 'Delia' }), /Choose one of your family/);
  assert.throws(() => rename(built, 'hh-1', { entityId: 'hh-1-wagon', name: 'Delia' }), /Choose one of your family/);
  const theirs = built.entities['hh-2-rosa'].name;
  rename(built, 'hh-2', { entityId: 'hh-2-rosa', name: 'Delia' });
  assert.equal(built.entities['hh-2-rosa'].name, 'Delia', 'a family cannot name its own');
  assert.notEqual(theirs, undefined);
});

test('a name a student typed is made safe before anybody else reads it', () => {
  // One child types this and another child reads it. Nothing here judges what a name
  // means - no code can - but the shape is held.
  assert.equal(sanitiseName('  Refugia  '), 'Refugia');
  assert.equal(sanitiseName('Mary\nJane'), 'Mary Jane', 'a newline would break a line of text somewhere else');
  assert.equal(sanitiseName('José Álvarez'), 'José Álvarez', 'accents and marks are part of names');
  assert.equal(sanitiseName("O'Hara-Smith"), "O'Hara-Smith");
  assert.equal(sanitiseName('Bob <script>alert(1)</script>'), 'Bob scriptalertscript');
  assert.equal(sanitiseName('A‮B'), 'AB', 'a direction override reverses text after it');
  assert.equal(sanitiseName('bell'), 'bell');
  assert.ok(sanitiseName('x'.repeat(200)).length <= NAME_LIMIT);
  for (const empty of ['', '   ', '123', '!!!', ' ', null, undefined]) {
    assert.throws(() => sanitiseName(empty), /needs at least one letter/, `"${empty}" was accepted as a name`);
  }
  // And the world refuses one that came in over the wire, not only one typed in a box.
  const built = world('safe');
  assert.throws(() => rename(built, 'hh-1', { entityId: 'hh-1-rosa', name: '   ' }), /needs at least one letter/);
  rename(built, 'hh-1', { entityId: 'hh-1-rosa', name: 'x'.repeat(200) });
  assert.equal(built.entities['hh-1-rosa'].name.length, NAME_LIMIT);
  validateWorld(built);
});

test('every rename is written into the family’s own record', () => {
  // A teacher who needs to see what a class has been typing can. That is the whole of the
  // moderation this can honestly offer, and it is worth being plain about.
  const built = world('record');
  const was = built.entities['hh-1-rosa'].name;
  rename(built, 'hh-1', { entityId: 'hh-1-rosa', name: 'Petra' });
  assert.ok(built.events.some(event => event.householdId === 'hh-1' && event.text === `${was} is called Petra now.`));
  const family = householdName(built, built.households['hh-1']);
  rename(built, 'hh-1', { name: 'The Rock Crossing place' });
  assert.ok(built.events.some(event => event.text === `The family is called The Rock Crossing place now, not ${family}.`));
  // Renaming to the same thing is not an event, or a fidgeting student fills the record.
  const before = built.events.length;
  rename(built, 'hh-1', { entityId: 'hh-1-rosa', name: 'Petra' });
  assert.equal(built.events.length, before);
});

test('a family may name itself before the class begins', () => {
  // Getting ready is what the lobby is for, and choosing who you are is the first thing
  // anybody wants to do. Nothing advances - the server does not tick a lobby.
  const built = createGonzalesWorld('lobby', 5);
  assert.equal(built.status, 'lobby');
  rename(built, 'hh-1', { name: 'The Hollis place' });
  rename(built, 'hh-1', { entityId: 'hh-1-mateo', name: 'Obed' });
  assert.equal(householdName(built, built.households['hh-1']), 'The Hollis place');
  assert.equal(built.entities['hh-1-mateo'].name, 'Obed');
});

test('who a family is does not ride on the per-tick channel', () => {
  // The lesson this project has now learned three times: a thing that changes rarely does
  // not belong on a channel that fires every tick. Kin is about four hundred and fifty
  // bytes and changes only when somebody is renamed, so it is fetched.
  const built = world('channel');
  const tick = projectWorld(built, 'hh-1', 'student', { includeMap: false });
  assert.equal(tick.family, undefined, 'the family rides on every tick');
  for (const entity of tick.entities) assert.equal(entity.kin, undefined, 'kin rides on every tick');
  // The number this file cares about is that `family` and `kin` are absent, not the total -
  // tests/chores.test.mjs owns the payload bound and measures it on a family that has
  // worked all afternoon rather than on a fresh one.
  // Measured while the family is still on the road in, which is what a fresh class sends first:
  // about 9.1 KB (tests/geography.test.mjs says why).
  assert.ok(JSON.stringify(tick).length < 10240);
  const fetched = projectFamily(built, 'hh-1');
  assert.equal(fetched.people.length, 4);
  assert.ok(fetched.name);
  // And it is one family's own. There is no way to ask for somebody else's.
  assert.notEqual(projectFamily(built, 'hh-2').name, fetched.name);
});

test('a class saved before the game knew who anybody was still opens', () => {
  const folder = mkdtempSync(join(tmpdir(), 'texas-family-'));
  try {
    const built = createWorld('old-save', 5);
    for (const household of Object.values(built.households)) {
      household.name = 'Family 1';
      for (const id of household.members) delete built.entities[id].kin;
    }
    const path = join(folder, 'class.json');
    writeFileSync(path, JSON.stringify({ saveVersion: 3, world: built }));
    const restored = readSave(path).world;
    restored.status = 'running';
    validateWorld(restored);
    // A stored name is a name somebody chose, so it is kept rather than derived away.
    assert.equal(householdName(restored, restored.households['hh-1']), 'Family 1');
    // And a household the game cannot describe says so by saying nothing, rather than
    // guessing at who these people were to each other.
    const family = projectFamily(restored, 'hh-1');
    assert.equal(family.people.length, 4);
    for (const person of family.people) {
      assert.equal(person.role, null);
      assert.equal(person.of, null);
      assert.ok(person.name);
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

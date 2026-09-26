// What the parents look like, and the children after them: docs/SETTLING_IN.md §7, build step 8.
//
// A student chooses each parent's looks after the roll; the children take after the parents and
// cannot be chosen; and - the rule that matters most - nothing in the game reads any of it. The last
// is proved the way glory's blindness is: the same class played with different appearances comes
// out exactly the same.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectFamily, stepWorld, projectWorld, validateWorld } from '../sim/world.mjs';
import { learn } from '../sim/knowledge.mjs';
import { CLOTHING, HAIR, HEAD, SKIN, appearanceCode, appearanceOf } from '../sim/appearance.mjs';
import { decodeAppearance } from '../public/look-vocabulary.js';

test('every offered appearance survives the compact map channel exactly', () => {
  for (const sex of ['male', 'female']) for (const skin of SKIN) for (const hair of HAIR)
    for (const clothing of CLOTHING) for (const head of HEAD[sex]) {
      const appearance = { skin, hair, clothing, head };
      assert.deepEqual(decodeAppearance(appearanceCode(appearance, sex), sex), appearance);
    }
  assert.deepEqual(decodeAppearance(appearanceCode({ skin: 'olive', hair: 'brown', clothing: 'rust' }, 'female'), 'female'),
    { skin: 'olive', hair: 'brown', clothing: 'rust' });
  assert.equal(decodeAppearance(-1, 'female'), null);
});

const rolled = (seed, householdId = 'hh-1') => {
  const world = createGonzalesWorld(seed, 5);
  applyAction(world, householdId, { action: 'roll-family' });
  return world;
};
const peopleOf = (world, householdId) => world.households[householdId].members.map(id => world.entities[id]);
const parentsOf = (world, householdId) => peopleOf(world, householdId).filter(p => ['father', 'mother'].includes(p.kin?.role));
const childrenOf = (world, householdId) => peopleOf(world, householdId).filter(p => ['son', 'daughter'].includes(p.kin?.role));

test('a parent\'s looks are chosen after the roll, from the choices for them, and a child\'s never are', () => {
  const world = createGonzalesWorld('looks-choose', 5);
  const first = world.households['hh-1'].members[0];
  assert.throws(() => applyAction(world, 'hh-1', { action: 'set-appearance', entityId: first, hair: 'red' }), /Roll the die/, 'looks were chosen for people the roll is about to replace');
  applyAction(world, 'hh-1', { action: 'roll-family' });
  const [parent] = parentsOf(world, 'hh-1');
  const own = parent.sex === 'female' ? 'bonnet' : 'hat';
  const other = parent.sex === 'female' ? 'beard' : 'bonnet';
  assert.throws(() => applyAction(world, 'hh-1', { action: 'set-appearance', entityId: parent.id, head: other }), /not one of the choices/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'set-appearance', entityId: parent.id, skin: 'green' }), /not one of the choices/);
  // Part by part until every part is chosen: choosing one thing keeps the others.
  applyAction(world, 'hh-1', { action: 'set-appearance', entityId: parent.id, skin: 'olive', hair: 'red' });
  applyAction(world, 'hh-1', { action: 'set-appearance', entityId: parent.id, hair: 'black', clothing: 'indigo', head: own });
  assert.deepEqual(appearanceOf(world, parent), { skin: 'olive', hair: 'black', clothing: 'indigo', head: own });
  // Then kept (owner, 2026-09-17: the looks are set once, in the pop-up).
  assert.throws(() => applyAction(world, 'hh-1', { action: 'set-appearance', entityId: parent.id, hair: 'red' }), /already been chosen/);
  for (const child of childrenOf(world, 'hh-1')) {
    assert.throws(() => applyAction(world, 'hh-1', { action: 'set-appearance', entityId: child.id, hair: 'red' }), /takes after their parents/);
  }
  // Somebody else's family is not this student's to dress.
  applyAction(world, 'hh-2', { action: 'roll-family' });
  assert.throws(() => applyAction(world, 'hh-1', { action: 'set-appearance', entityId: parentsOf(world, 'hh-2')[0].id, hair: 'red' }), /one of your family/);
  // The book says it in words, offers the choices for parents only, and says which were chosen.
  const book = projectFamily(world, 'hh-1').people;
  const shown = book.find(person => person.id === parent.id);
  assert.match(shown.looks, /olive skin, black hair, indigo clothes/);
  assert.equal(shown.chosen, true);
  assert.deepEqual(shown.choices.head, HEAD[parent.sex]);
  const projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.equal(projected.entities.find(person => person.id === parent.id).a, appearanceCode(shown.appearance, parent.sex), 'the map figure lost the chosen portrait');
  const host = projectWorld(world, 'hh-1', 'host', { includeMap: false });
  assert.equal(host.others.find(person => person.id === parent.id)?.a, appearanceCode(shown.appearance, parent.sex), 'the Host figure lost the chosen portrait');
  for (const child of book.filter(person => ['son', 'daughter'].includes(person.role))) {
    assert.ok(child.looks, 'a child has no looks in the book');
    assert.equal(child.choices, undefined, 'a child was offered choices');
  }
  validateWorld(world);
});

test('children take after their parents: skin between theirs, hair and clothes from one of them', () => {
  let children = 0, lone = 0;
  for (let n = 0; n < 60; n++) {
    const world = rolled(`looks-kin-${n}`);
    const parents = parentsOf(world, 'hh-1').map(parent => appearanceOf(world, parent));
    const tones = parents.map(parent => SKIN.indexOf(parent.skin));
    for (const child of childrenOf(world, 'hh-1')) {
      const looks = appearanceOf(world, child);
      const tone = SKIN.indexOf(looks.skin);
      assert.ok(tone >= Math.min(...tones) && tone <= Math.max(...tones), `${looks.skin} is outside the parents' ${parents.map(p => p.skin).join(' and ')}`);
      const hairs = parents.map(parent => parent.hair).filter(hair => hair !== 'grey');
      assert.ok(hairs.length ? hairs.includes(looks.hair) : looks.hair === 'dark brown', `${looks.hair} hair came from nobody`);
      assert.ok(parents.map(parent => parent.clothing).includes(looks.clothing), `${looks.clothing} is not one of the family's colours`);
      assert.equal(looks.head, undefined, 'a child was given a hat, beard or bonnet');
      if (parents.length === 1) { assert.equal(looks.skin, parents[0].skin); lone++; }
      children++;
    }
  }
  assert.ok(children > 100 && lone > 0, `only ${children} children and ${lone} of a lone parent were checked`);
  // The same seed deals the same family the same looks, and a parent's choice carries to the children.
  const again = rolled('looks-kin-3'), once = rolled('looks-kin-3');
  assert.deepEqual(peopleOf(again, 'hh-1').map(p => appearanceOf(again, p)), peopleOf(once, 'hh-1').map(p => appearanceOf(once, p)));
  let world = rolled('looks-carry'), tries = 0;
  while (!childrenOf(world, 'hh-1').length && tries < 20) world = rolled(`looks-carry-${++tries}`);
  const child = childrenOf(world, 'hh-1')[0];
  for (const parent of parentsOf(world, 'hh-1')) applyAction(world, 'hh-1', { action: 'set-appearance', entityId: parent.id, skin: 'tan', hair: 'auburn', clothing: 'teal' });
  assert.deepEqual(appearanceOf(world, child), { skin: 'tan', hair: 'auburn', clothing: 'teal' });
});

test('appearance changes nothing: the same class with different looks plays out the same', () => {
  const play = looks => {
    const world = createGonzalesWorld('looks-inert', 5);
    world.status = 'running';
    for (const entity of Object.values(world.entities)) {
      if (['father', 'mother'].includes(entity.kin?.role)) entity.appearance = looks(entity);
    }
    while (!world.truth['cannon-request']) stepWorld(world);
    for (const id of ['hh-1', 'hh-2']) learn(world, id, 'cannon-request', { status: 'confirmed', source: 'Somebody who saw it' });
    const answered = new Set();
    while (world.status === 'running') {
      stepWorld(world);
      for (const id of ['hh-1', 'hh-2']) {
        const call = projectWorld(world, id, 'student', { includeMap: false }).request;
        if (call?.status === 'open' && call.kind === 'supplies' && !answered.has(id)) { applyAction(world, id, { action: 'help', entityId: world.households[id].principalId }); answered.add(id); }
        if (call?.status === 'open' && call.kind === 'march') applyAction(world, id, { action: 'go-upriver', entityId: call.actorId });
      }
    }
    validateWorld(world);
    for (const entity of Object.values(world.entities)) delete entity.appearance;
    return JSON.stringify(world);
  };
  const lightest = entity => ({ skin: SKIN[0], hair: HAIR[5], clothing: CLOTHING[6], head: HEAD[entity.kin.role === 'mother' ? 'female' : 'male'][0] });
  const darkest = entity => ({ skin: SKIN.at(-1), hair: HAIR[0], clothing: CLOTHING[0], head: HEAD[entity.kin.role === 'mother' ? 'female' : 'male'][1] });
  assert.equal(play(lightest), play(darkest), 'how the parents looked changed what happened');
});

test('a class saved before this opens with looks for everybody, and a stored look that could not be chosen is refused', () => {
  const world = createGonzalesWorld('looks-old', 5);
  for (const entity of Object.values(world.entities)) assert.equal(entity.appearance, undefined);
  validateWorld(world);
  for (const person of projectFamily(world, 'hh-1').people) assert.ok(person.looks, `${person.name} has no looks`);
  const [parent] = parentsOf(world, 'hh-1');
  parent.appearance = { skin: 'green' };
  assert.throws(() => validateWorld(world), /Invalid appearance/);
  parent.appearance = { skin: 'olive' };
  validateWorld(world);
  const child = childrenOf(world, 'hh-1')[0];
  child.appearance = { skin: 'olive' };
  assert.throws(() => validateWorld(world), /Only a parent/);
});

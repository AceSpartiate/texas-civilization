// Every default name is of the family it is dealt to (owner, 2026-10-01: "the default names should be appropriate for the race being
// played. weren't most anglo?"; docs/FAMILY_CREATION.md, the amendment of 2026-10-01; sim/starts.mjs `namingOf`, `FIC-GONZ-1060`).
//
// Over many classes, with starts and without, and every way a name is dealt - the founding four, the rolled family (parents and
// every child), a lone parent's new husband or wife and the two neighbour families of that visit: no Anglo-American or free Black
// family is dealt a name of the Tejano pools, and no Tejano family a name of the Anglo-American pools. There is no exception to
// document: a lone parent marries into a family of the family's own start (sim/courtship.mjs `neighbourPools`), and the neighbours
// a family visits first, who may be of another country, are named as their own last name is (`namedAs`), never as the family.
//
// Proved by injection (2026-10-01): with sim/family.mjs, sim/world.mjs and sim/courtship.mjs as released, both fail - the classes
// without starts dealt the mixed pools ("an Anglo-American family was dealt the Tejano name Gregorio") and an Anglo lone parent
// married "a Salcedo"; with only the neighbours named as the family is, the second fails ("a Villa father ... Alvin").
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily } from '../sim/world.mjs';
import { POOLS, TEJANO_PLACES, namingOf } from '../sim/starts.mjs';
import { dealNeighbours, rollSpouse } from '../sim/courtship.mjs';

const ANGLO = new Set(Object.values(POOLS.anglo).flat()), TEJANO = new Set(Object.values(POOLS.tejano).flat());
const TEJANO_SURNAMES = new Set(['Salcedo', 'Montañez', 'Treviño', 'Villa', 'Olivares', 'Serna']);
const people = (world, household) => household.members.map(id => world.entities[id]).filter(one => one?.kind === 'person');
const given = person => person.given || String(person.name).split(' ')[0];
/** What the family ought to be named as: its start, or with none its place's people (Tejano at Victoria and below Béxar). */
const expected = household => household.heritage || (TEJANO_PLACES.includes(household.settlementId) ? 'tejano' : 'anglo');
function holds(name, heritage, what) {
  if (heritage === 'tejano') {
    assert.ok(!ANGLO.has(name), `${what}: a Tejano family was dealt the Anglo-American name ${name}`);
    assert.ok(TEJANO.has(name), `${what}: ${name} is not of the Tejano pools`);
  } else {
    assert.ok(!TEJANO.has(name), `${what}: a${heritage === 'free-black' ? ' free Black' : 'n Anglo-American'} family was dealt the Tejano name ${name}`);
    assert.ok(ANGLO.has(name), `${what}: ${name} is not of the Anglo-American pools`);
  }
}
const CLASSES = [];
for (const [k, n] of [[1, 5], [2, 10], [3, 12], [4, 15], [5, 20], [6, 25], [7, 30]]) {
  CLASSES.push({ seed: `names-${k}`, n, map: 'colonies', starts: true });
  CLASSES.push({ seed: `names-old-${k}`, n, map: 'colonies', starts: false });
}
CLASSES.push({ seed: 'names-gonzales-a', n: 15, map: 'gonzales', starts: false }, { seed: 'names-gonzales-b', n: 30, map: 'gonzales', starts: false });

test('the founding four and every rolled family are named as the family is, with starts and without', () => {
  let tejano = 0, anglo = 0, black = 0;
  for (const { seed, n, map, starts } of CLASSES) {
    const world = createGonzalesWorld(seed, n, { map, starts });
    for (const household of Object.values(world.households)) {
      const as = expected(household);
      assert.equal(namingOf(household), as, `${seed} ${household.id}`);
      for (const person of people(world, household)) holds(given(person), as, `${seed} ${household.id} (${household.settlementId || map}) founding ${person.kin?.role}`);
      rollFamily(world, household);
      for (const person of people(world, household)) holds(given(person), as, `${seed} ${household.id} (${household.settlementId || map}) rolled ${person.kin?.role}`);
      if (as === 'tejano') tejano++; else if (as === 'free-black') black++; else anglo++;
    }
  }
  // Every kind was dealt, in classes with starts and without: the check is not passing on Anglo families alone.
  assert.ok(tejano >= 14 && black >= 4 && anglo >= 200, `tejano ${tejano}, free Black ${black}, anglo ${anglo}`);
});

test('a lone parent\'s new husband or wife, and both neighbour families of the visit, are named as their own families are', () => {
  let weddings = 0, met = 0;
  for (const { seed, n, map, starts } of CLASSES.filter(one => one.n <= 15)) {
    const world = createGonzalesWorld(seed, n, { map, starts });
    for (const household of Object.values(world.households)) {
      rollFamily(world, household);
      const parent = people(world, household).find(one => ['father', 'mother'].includes(one.kin?.role));
      const taken = new Set();
      const { one, two, spouseSex, age } = dealNeighbours(world, household, parent, taken);
      const spouse = rollSpouse(world, household, parent, spouseSex, age, taken);
      const as = expected(household);
      holds(spouse.given, as, `${seed} ${household.id}: the new ${spouse.role}`);
      // The family the spouse is born to is of the family's own start: a Tejano family's a Tejano family, an Anglo family's not.
      assert.equal(TEJANO_SURNAMES.has(two.surname), as === 'tejano', `${seed} ${household.id} (${as}): the spouse is born a ${two.surname}`);
      for (const family of [one, two]) {
        const theirs = TEJANO_SURNAMES.has(family.surname) ? 'tejano' : 'anglo';
        for (const person of family.people) holds(person.given, theirs, `${seed} ${household.id}: a ${family.surname} ${person.role}`);
        met++;
      }
      weddings++;
    }
  }
  assert.ok(weddings >= 90 && met >= 180, `${weddings} weddings, ${met} neighbour families`);
});

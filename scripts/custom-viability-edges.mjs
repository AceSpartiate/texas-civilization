// The custom's edges, asked of the rule directly (docs/BALANCE.md §23; sim/custom.mjs). Measures only; nothing here changes a rule.
//
// Each case puts the founding family of hh-1 at home on a settled class (as tests/custom-work.test.mjs does), gives its people the
// ages and states the case names, and asks `choreAvailability` who may do a work of the men's or the women's. It prints what the
// rule answers; docs/BALANCE.md §23 reads them as fine or as an issue.
//
// Run: node scripts/custom-viability-edges.mjs [--out docs/evidence/custom-viability-edges.json]
import { writeFileSync } from 'node:fs';
import { createSettledWorld } from '../tests/support/settled.mjs';
import { choreAvailability, choresFor } from '../sim/chores.mjs';
import { projectWorld } from '../sim/world.mjs';
import { familyRoll, rolledPeople } from '../sim/family.mjs';

const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;
function family(seed) {
  const world = createSettledWorld(seed, 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  household.resources.powder = 6;
  const [father, mother, rosa, mateo] = ['thomas', 'elena', 'rosa', 'mateo'].map(key => world.entities[`hh-1-${key}`]);
  for (const person of [father, mother, rosa, mateo]) person.skills = { ...person.skills, hunting: 1 };
  father.age = 40; mother.age = 37;
  return { world, household, father, mother, rosa, mateo };
}
const can = (world, household, person, id) => { const said = choreAvailability(world, household, person, id); return said.can ? 'yes' : `no: ${said.why}`; };
const listed = (world, household, person) => (projectWorld(world, household.id, 'student', { includeMap: false }).work?.[person.id] || []).map(entry => entry.id);
const WORKS = ['fell-trees', 'hunt-land', 'cut-lane', 'keep-house', 'wash-clothes', 'work-garden'];
const cases = [];
const ask = (name, setup) => {
  const f = family(`edge-${cases.length}`);
  const who = setup(f) || {};
  const answers = {};
  for (const [label, person] of Object.entries({ father: f.father, mother: f.mother, rosa: f.rosa, mateo: f.mateo, ...who })) {
    if (!person || ['dead'].includes(person.health?.condition)) continue;
    answers[label] = Object.fromEntries(WORKS.map(id => [id, can(f.world, f.household, person, id)]));
    answers[label].listed = listed(f.world, f.household, person).length;
  }
  cases.push({ name, answers });
};

ask('both parents home; Rosa a girl of 12, Mateo a boy of 12', ({ rosa, mateo }) => { rosa.age = 12; rosa.sex = 'female'; mateo.age = 12; mateo.sex = 'male'; });
ask('father at the war (serving); Mateo a son of 16 at home', ({ father, rosa, mateo }) => { father.service = { kind: 'regular', status: 'serving', since: 0, siteId: 'san-felipe' }; mateo.age = 16; mateo.sex = 'male'; rosa.age = 9; rosa.sex = 'female'; });
ask('father at the war (serving); Mateo a son of 15 at home', ({ father, rosa, mateo }) => { father.service = { kind: 'regular', status: 'serving', since: 0, siteId: 'san-felipe' }; mateo.age = 15; mateo.sex = 'male'; rosa.age = 9; rosa.sex = 'female'; });
ask('father released from the army and home again (service kept as released)', ({ father, rosa, mateo }) => { father.service = { kind: 'auxiliary-war', status: 'released', since: 0, until: 10, siteId: 'san-felipe', acres: 0 }; rosa.age = 9; mateo.age = 7; });
ask('father deserted and home again (service kept as deserted)', ({ father, rosa, mateo }) => { father.service = { kind: 'regular', status: 'deserted', since: 0, until: 10, siteId: 'san-felipe', acres: 0 }; rosa.age = 9; mateo.age = 7; });
ask('father sick at home', ({ father, rosa, mateo }) => { father.health = { condition: 'sick' }; rosa.age = 9; mateo.age = 7; });
ask('father tired at home', ({ father, rosa, mateo }) => { father.health = { condition: 'tired' }; rosa.age = 9; mateo.age = 7; });
ask('father weak with hunger at home', ({ father, rosa, mateo }) => { father.hunger = { want: 6, stage: 'weak' }; rosa.age = 9; mateo.age = 7; });
ask('father holding a crying baby (aside) at home', ({ world, father, rosa, mateo }) => { rosa.age = 9; mateo.age = 1; father.aside = { kind: 'baby', babyIds: [mateo.id], since: world.tick }; });
ask('father in town', ({ father, rosa, mateo }) => { father.location = { ...father.location, siteId: 'gonzales' }; rosa.age = 9; mateo.age = 7; });
ask('father away riding the range (a work of the place)', ({ father, rosa, mateo }) => { father.chore = { id: 'look-to-stock', doing: 'riding the range', step: 0, stepMinutes: 0 }; father.location = { ...father.location, siteId: null }; father.travel = { to: 'x' }; rosa.age = 9; mateo.age = 7; });
ask('no mother: lone father, Rosa a girl of 13, Mateo a girl of 11', ({ world, household, mother, rosa, mateo }) => { mother.health = { condition: 'dead' }; rosa.age = 13; rosa.sex = 'female'; mateo.age = 11; mateo.sex = 'female'; });
ask('no mother: lone father, Rosa a daughter of 16', ({ mother, rosa, mateo }) => { mother.health = { condition: 'dead' }; rosa.age = 16; rosa.sex = 'female'; mateo.age = 9; mateo.sex = 'male'; });
ask('mother sick, father home, Rosa a girl of 12', ({ mother, rosa, mateo }) => { mother.health = { condition: 'sick' }; rosa.age = 12; rosa.sex = 'female'; mateo.age = 7; });

// How often each shape is rolled: 20,000 families on the die as it is (sim/family.mjs `familyRoll`, `rolledPeople`), read as the
// custom reads them (16 or over keeps it; boys of ten to fifteen follow the men's work, girls the women's).
const FAMILIES = 20000;
const counts = {};
const count = key => { counts[key] = (counts[key] || 0) + 1; };
for (let n = 0; n < FAMILIES; n++) {
  const seed = `freq-${Math.floor(n / 15)}`, id = `hh-${(n % 15) + 1}`;
  const people = rolledPeople(seed, id, n % 15, familyRoll(seed, id));
  const men = people.filter(p => p.sex === 'male' && p.age >= 16), women = people.filter(p => p.sex === 'female' && p.age >= 16);
  const boys = people.filter(p => p.sex === 'male' && p.age >= 10 && p.age < 16), girls = people.filter(p => p.sex === 'female' && p.age >= 10 && p.age < 16);
  const father = people.some(p => p.role === 'father'), mother = people.some(p => p.role === 'mother');
  count(father && mother ? 'bothParents' : father ? 'loneFather' : 'loneMother');
  if (father && !mother && !women.length) count('loneFatherNoWoman16');
  if (father && !mother && people.some(p => p.age < 2)) count('loneFatherWithBaby');
  if (!father && mother && people.every(p => p.role === 'mother' || p.age < 10)) count('loneMotherAllUnder10');
  if (!father && mother && men.length) count('loneMotherWithSon16');
  // One pair of hands for all the men's work while everybody is home: one man, no boy of ten to fifteen.
  if (men.length === 1 && !boys.length) count('oneMaleHand');
  if (men.length === 1 && !boys.length && girls.length + women.length >= 3) count('oneMaleHandThreeOrMoreFemale10plus');
  if (women.length === 1 && !girls.length && men.length + boys.length >= 3) count('oneFemaleHandThreeOrMoreMale10plus');
  if (men.length === 1 && women.length >= 3) count('oneManThreeOrMoreWomen16');
  if (women.length === 1 && men.length >= 3) count('oneWomanThreeOrMoreMen16');
  if (father && people.some(p => p.role === 'son' && p.age >= 16)) count('fatherAndSon16plus');
  if (father && mother && people.some(p => p.role === 'son' && p.age >= 16 && p.age <= 17)) count('bothParentsSon16or17');
  if (girls.length && !boys.length && men.length) count('girls10to15NoBoys10to15WithAMan');
}
const frequency = Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, { share: Math.round(value / FAMILIES * 1000) / 10, inClassOf30: Math.round(value / FAMILIES * 30 * 10) / 10 }]));
console.log("Shapes on the die (share of families, and families in a class of 30):");
for (const [key, value] of Object.entries(frequency)) console.log(`  ${key}: ${value.share}% (${value.inClassOf30} in 30)`);
const record = { record: 'custom-viability-edges', measured: new Date().toISOString().slice(0, 10), works: WORKS, cases, frequency: { families: FAMILIES, shapes: frequency } };
for (const one of cases) {
  console.log(`\n${one.name}`);
  for (const [who, answers] of Object.entries(one.answers)) console.log(`  ${who} (${answers.listed} works listed): ${WORKS.map(id => `${id} ${answers[id].startsWith('yes') ? 'yes' : 'NO'}`).join(', ')}`);
}
if (out) writeFileSync(out, `${JSON.stringify(record, null, 1)}\n`);

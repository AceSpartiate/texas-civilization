// What a family eats by age, and the births behind the ages: docs/FAMILY_CREATION.md §3 and its amendment of 2026-09-22, owner 2026-09-22.
//
// "Children's food consumption: ages 0–2 use 25% of an adult portion, 3–9 use 50%, 10–15 use 75%, and 16+ use 100%.
// Preserve fractional totals. Allow seed-deterministic twins at approximately 1% of births." And by Astra's handoff the same
// day: quarters summed before anything is rounded; twins their own people with one birth date; no artificial one-child-a-
// year spacing. Each test is one of those rules, and scripts/family-roll-injections.mjs breaks each one and watches it fail.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, validateWorld } from '../sim/world.mjs';
import { advanceRoutine } from '../sim/routines.mjs';
import { advanceFlight } from '../sim/scrape.mjs';
import { share } from '../sim/shares.mjs';
import { dateOf } from '../sim/clock.mjs';
import { FOOD_KEPT_PER_PERSON, judgeOffer, mouthsAt } from '../sim/neighbours.mjs';
import {
  ADULT_RATION, SHORTEST_GAP, TWIN_SHARE, ROLL_DAY, ageNow, ageOnDay, bornOf, eatenADay, familyRoll, mouthsOf, quartersEaten, quartersFor,
  rolledPeople,
} from '../sim/family.mjs';

const isChild = person => person.role === 'son' || person.role === 'daughter';
const DAY_MS = 86400000;
/** 'YYYY-MM-DD' a whole number of years and some days before the class's first day (Sept 28, 1835). */
const bornYearsAgo = (years, daysMore = 30) => { const at = new Date(Date.UTC(1835 - years, 8, 28) - daysMore * DAY_MS); return at.toISOString().slice(0, 10); };
const seedRolling = (roll, stem) => { for (let n = 0; ; n++) if (familyRoll(`${stem}-${n}`, 'hh-1') === roll) return `${stem}-${n}`; };
/** A class with one rolled family of `roll`, whose people are all at home, resting, and keep no better house than anybody. */
function family(roll = 8, stem = 'rations') {
  const world = createGonzalesWorld(seedRolling(roll, stem), 5);
  const household = world.households['hh-1'];
  rollFamily(world, household);
  for (const id of household.members) {
    const person = world.entities[id];
    person.location = { ...world.map.sites[household.homeSiteId], siteId: household.homeSiteId };
    person.travel = null; person.task = 'rest'; person.chore = null;
    person.traits = { ...person.traits, housework: 1 };
  }
  delete household.arriving;
  return { world, household, people: household.members.map(id => world.entities[id]) };
}

test('four bands: 0–2 eat a quarter of a grown share, 3–9 a half, 10–15 three quarters, 16 and over all of it', () => {
  const expected = { 0: 1, 1: 1, 2: 1, 3: 2, 5: 2, 9: 2, 10: 3, 12: 3, 15: 3, 16: 4, 17: 4, 30: 4, 70: 4 };
  for (const [age, quarters] of Object.entries(expected)) assert.equal(quartersFor(Number(age)), quarters, `a person of ${age}`);
  // Somebody the game states no age for - the founding four, a townsman - eats a grown share, as everybody always did.
  assert.equal(quartersFor(undefined), 4);
  assert.equal(quartersFor(null), 4);
  // And in a family: a person whose age is each band's edge eats that band's share on the class's first day.
  const { world, people } = family(8);
  const ages = [2, 3, 9, 10, 15, 16];
  people.slice(2).forEach((child, i) => { child.born = bornYearsAgo(ages[i]); child.age = ages[i]; });
  validateWorld(world);
  assert.deepEqual(people.slice(2).map(child => ageNow(world, child)), ages);
  assert.deepEqual(people.slice(2).map(child => quartersFor(ageNow(world, child))), [1, 2, 2, 3, 3, 4]);
  // Two parents (8 quarters) and those six (15): 23 quarters, 5.75 grown shares.
  assert.equal(mouthsOf(world, people), 23 / 4);
});

test('fractions are kept: four babies eat exactly one grown share, and a day at home takes exactly that from the store', () => {
  const { world, household, people } = family(6, 'babies');
  const [father, , ...children] = people;
  children.forEach((child, i) => { child.born = bornYearsAgo(i % 2, 40); child.age = i % 2; });
  assert.equal(children.length, 4);
  validateWorld(world);
  assert.equal(mouthsOf(world, children), 1, 'four babies are not one grown share');
  assert.equal(eatenADay(world, children), ADULT_RATION, 'four babies do not eat what one grown person eats');
  assert.equal(eatenADay(world, [father]), ADULT_RATION);
  // One and three quarters: a baby, a small child and a youth, never rounded to one or two.
  assert.equal(mouthsOf(world, [children[0], { age: 5 }, { age: 12 }]), 1.5);
  assert.equal(eatenADay(world, [children[0], { age: 5 }, { age: 12 }]), 1.5 * ADULT_RATION, 'a share and a half was rounded');
  // Through the day's own eating: the four babies at home alone, and then the father at home alone, from the same store.
  const away = Object.keys(world.map.sites).find(id => id !== household.homeSiteId);
  const eatOneDay = atHome => {
    const copy = structuredClone(world);
    const home = copy.households['hh-1'];
    for (const id of home.members) if (!atHome.includes(id)) copy.entities[id].location = { ...copy.map.sites[away], siteId: away };
    home.resources.food = 50;
    advanceRoutine(copy, 1440);
    return 50 - home.resources.food;
  };
  const babies = eatOneDay(children.map(child => child.id)), grown = eatOneDay([father.id]);
  assert.ok(babies > 0, 'the babies ate nothing');
  assert.equal(babies, grown, `four babies ate ${babies} in a day and one grown man ${grown}`);
});

test('a child moves up a band on the birthday, not before; somebody rolled before birth dates keeps the age they had', () => {
  const { world, people } = family(5, 'birthday');
  const child = people[2];
  // Two on September 28, three on October 5.
  child.born = '1832-10-05'; child.age = 2;
  validateWorld(world);
  const minuteOf = (month, date) => (Date.UTC(1835, month, date, 12) - dateOf(world, 0).getTime()) / 60000;
  assert.equal(ageNow(world, child), 2);
  assert.equal(quartersFor(ageNow(world, child, minuteOf(9, 4))), 1, 'the child ate at three the day before turning three');
  assert.equal(quartersFor(ageNow(world, child, minuteOf(9, 5))), 2, 'the child still ate as a baby on their third birthday');
  const before = quartersEaten(world, people);
  world.minute = minuteOf(9, 5);
  assert.equal(quartersEaten(world, people), before + 1, 'the family did not eat a quarter share more from the birthday');
  // A person saved before 2026-09-22 has an age and no birth date: the date is worked out, never written, and gives the age
  // they had on the class's first day, one more a year on.
  const old = { id: 'hh-9-child-1', age: 9 };
  assert.equal(ageNow(world, old, 0), 9);
  assert.equal(ageNow(world, old, 366 * 1440), 10);
  assert.equal(old.born, undefined, 'a birth date was written into an old save');
  assert.match(bornOf(world, old), /^\d{4}-\d{2}-\d{2}$/);
  // And the founding four, who have no age, have no birth date either.
  assert.equal(bornOf(world, { id: 'hh-1-thomas' }), null);
});

test('the road east eats by age: a family with small children eats less than its head count (the winter: tests/periods.test.mjs)', () => {
  const { world, household, people } = family(8, 'winter');
  people.slice(2).forEach((child, i) => { child.born = bornYearsAgo(i, 20); child.age = i; });
  validateWorld(world);
  const daily = eatenADay(world, people);
  assert.ok(daily < people.length * ADULT_RATION - 1, `a family of eight with children under six eats ${daily} a day`);
  // The road east: the family camped at its refuge for a day, nobody moving, eating what it carries.
  const road = structuredClone(world);
  const onRoad = road.households['hh-1'];
  onRoad.flight = { status: 'refuged', refuge: onRoad.homeSiteId, crossed: [], sickDay: Math.floor(road.minute / 1440) };
  onRoad.resources.food = 30;
  advanceFlight(road, 1440);
  assert.ok(Math.abs((30 - onRoad.resources.food) - daily) < 1e-4, `the road ate ${30 - onRoad.resources.food}, not ${daily}`);
  assert.ok(household.members.length === 8);
});

test('the neighbours’ director reckons its larder by age: four babies are one mouth when it decides what food it can spare', () => {
  const { world, household, people } = family(6, 'larder');
  people.slice(2).forEach((child, i) => { child.born = bornYearsAgo(i % 2, 50); child.age = i % 2; });
  validateWorld(world);
  // Two parents and four babies: six people, three grown shares.
  assert.equal(mouthsAt(world, household), 3);
  // Asked for 2 food of its 12 for 2 seed: 10 left is enough for three mouths (9 kept back) and not for six heads (18).
  household.resources = { ...household.resources, food: 12, seed: 0 };
  const view = { household: { ...household, resources: household.resources } };
  const offer = { weGive: { food: 2 }, weGet: { seed: 2 } };
  assert.equal(judgeOffer(view, offer, mouthsAt(world, household)).take, true, 'a family of babies would not spare food it can spare');
  assert.ok(10 < people.length * FOOD_KEPT_PER_PERSON, 'the offer does not tell heads from mouths');
});

test('twins come from the seed, about one birth in a hundred, never three at once', () => {
  // Tolerance: 20,000 rolls make about 170,000 births, so one in a hundred is measured to within about a fortieth of itself
  // (one standard error). Measured 2026-09-22 at 0.95 in 100; the bounds are 0.85 to 1.15 in 100, some six errors either way.
  let births = 0, twinBirths = 0, familiesWithTwins = 0;
  for (let n = 0; n < 20000; n++) {
    const roll = 1 + (n % 20), id = `hh-${1 + (n % 30)}`, seed = `twins-${n}`;
    const children = rolledPeople(seed, id, n % 30, roll).filter(isChild);
    const byDay = Map.groupBy(children, child => child.born);
    births += byDay.size;
    const pairs = [...byDay.values()].filter(group => group.length > 1);
    assert.ok(pairs.every(group => group.length === 2), 'three children born the same day');
    twinBirths += pairs.length;
    if (pairs.length) familiesWithTwins++;
    // Where the twins are is the seed's share of the second child's id, and nothing else: rolled again, the same.
    for (const [first, second] of pairs) {
      assert.equal(Number(second.id.split('-').at(-1)), Number(first.id.split('-').at(-1)) + 1, 'twins not next to each other, eldest first');
      assert.ok(share({ seed }, second.id, 'twin') < TWIN_SHARE * children.length / (children.length - 1), 'a twin the seed did not deal');
    }
  }
  const rate = twinBirths / births;
  assert.ok(rate > 0.0085 && rate < 0.0115, `${(rate * 100).toFixed(2)} births in 100 were twins`);
  assert.ok(familiesWithTwins > 100, `only ${familiesWithTwins} families had twins`);
  assert.deepEqual(rolledPeople('twins-again', 'hh-4', 3, 20), rolledPeople('twins-again', 'hh-4', 3, 20), 'the same seed dealt a different family');
});

test('twins are two people: their own ids and names, one birth date, the same age', () => {
  let seen = 0;
  for (let n = 0; n < 3000 && seen < 20; n++) {
    const people = rolledPeople(`pair-${n}`, 'hh-2', 1, 14 + (n % 7));
    // No two of one family share a first name, twins or not.
    assert.equal(new Set(people.map(person => person.name)).size, people.length, `names repeat: ${people.map(person => person.name)}`);
    const children = people.filter(isChild);
    for (let k = 1; k < children.length; k++) {
      if (children[k].born !== children[k - 1].born) continue;
      seen++;
      const [a, b] = [children[k - 1], children[k]];
      assert.notEqual(a.id, b.id);
      assert.notEqual(a.name, b.name, 'twins share a name');
      assert.equal(a.age, b.age, 'twins of different ages');
      assert.ok(a.kin.parents.length && a.kin.parents.every(parent => b.kin.parents.includes(parent)));
    }
  }
  assert.ok(seen >= 20, `only ${seen} pairs of twins in 3000 large families`);
  // And into a class: rolled, validated and every twin a member.
  const world = createGonzalesWorld('pair-class', 30);
  for (const household of Object.values(world.households)) rollFamily(world, household);
  validateWorld(world);
});

test('no child a year exactly: births come at natural and varying gaps, and a family of twenty is not a stair of ages', () => {
  let gaps = [], twentyGaps = [], stairs = 0, twenties = 0;
  for (let n = 0; n < 4000; n++) {
    const roll = 1 + (n % 20);
    const children = rolledPeople(`gaps-${n}`, 'hh-3', 2, roll).filter(isChild);
    for (let k = 1; k < children.length; k++) {
      const gap = (Date.parse(children[k].born) - Date.parse(children[k - 1].born)) / (365.2425 * DAY_MS);
      assert.ok(gap >= 0, 'children not eldest first');
      if (gap === 0) continue;
      assert.ok(gap >= SHORTEST_GAP - 0.01, `two births ${gap.toFixed(2)} years apart`);
      if (roll <= 8) gaps.push(gap);
      if (roll === 20) twentyGaps.push(gap);
    }
    if (roll === 20) {
      twenties++;
      // The shape every 20 had until 2026-09-22: eighteen different ages, one a year without a gap (17 down to 0).
      const ages = children.map(child => child.age);
      if (new Set(ages).size === 18 && ages[0] - ages.at(-1) === 17) stairs++;
    }
  }
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const spread = Math.sqrt(gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / gaps.length);
  assert.ok(mean > 1.6, `small families' births were ${mean.toFixed(2)} years apart on average`);
  assert.ok(spread > 0.3, `small families' gaps hardly vary (${spread.toFixed(2)})`);
  // A family of twenty: measured 2026-09-22 at no stairs in 200 and a mean gap of 1.2 years.
  assert.ok(stairs <= twenties / 20, `${stairs} of ${twenties} families of twenty are still one child a year without a gap`);
  const twentyMean = twentyGaps.reduce((sum, gap) => sum + gap, 0) / twentyGaps.length;
  assert.ok(twentyMean > 1.1, `a family of twenty's births were ${twentyMean.toFixed(2)} years apart on average`);
});

test('ages are dealt from birth dates: every parent is the age their date says on the day the die was rolled', () => {
  for (let n = 0; n < 600; n++) {
    const people = rolledPeople(`dates-${n}`, 'hh-5', 4, 1 + (n % 20));
    for (const person of people) assert.equal(ageOnDay(person.born, ROLL_DAY), person.age, `${person.id} born ${person.born} is not ${person.age}`);
  }
  // A family rolled later, in Play Solo, is dated from that day.
  const later = rolledPeople('dates-later', 'hh-5', 4, 9, undefined, Date.UTC(1836, 0, 25));
  for (const person of later) assert.equal(ageOnDay(person.born, Date.UTC(1836, 0, 25)), person.age);
});

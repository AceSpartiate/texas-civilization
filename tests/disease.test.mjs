// Disease: docs/DISEASE.md, the owner's request of 2026-09-27 ("also, plan for diseases. keep it historical as to which
// ones. stopping to rest should help characters recover.") and the owner's answers of the same day.
//
// Build step 0 first: a sickness mends wherever the sick person is. Until 2026-09-27 a `sick` state was mended only inside
// the road's own loop (sim/scrape.mjs `advanceFlight`), so somebody made sick at home by a norther, or a man serving with the
// army, stayed sick for the rest of the class (docs/DISEASE.md §1.5).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld, validateWorld } from '../sim/world.mjs';
import { weatherAt } from '../sim/weather.mjs';
import { flee, flightProjection } from '../sim/scrape.mjs';
import { settle } from './support/settled.mjs';

const DAY = 1440;
const landed = (seed, count = 8) => {
  const world = settle(createGonzalesWorld(seed, count, { map: 'colonies' }));
  world.status = 'running';
  return world;
};
const people = (world, household) => household.members.map(id => world.entities[id]);
const grown = (world, household) => people(world, household).find(person => (person.age ?? 30) >= 16 && person.health.condition === 'well');
const stepUntil = (world, minute, limit = 5000) => { for (let tick = 0; tick < limit && world.minute < minute; tick++) stepWorld(world); };

test('step 0: somebody sick at home is well again once the sickness has run its course', () => {
  const world = landed('sick-home');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  person.health = { condition: 'sick', recoversAt: world.minute + 2 * DAY };
  const due = person.health.recoversAt;
  stepUntil(world, due + DAY);
  assert.notEqual(person.health.condition, 'sick', `still sick a day after the sickness should have run its course (at home, ${person.location.siteId})`);
  validateWorld(world);
});

test('step 0: a man serving with the army who is sick mends in the camp', () => {
  const world = landed('sick-serving');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  // Serving at San Felipe, as a family's man serving with the army stands there (tests/scrape.test.mjs does the same).
  person.service = { kind: 'auxiliary-war', status: 'serving', siteId: 'san-felipe' };
  const site = world.map.sites['san-felipe'];
  person.location = { x: site.x, y: site.y, siteId: 'san-felipe' };
  person.health = { condition: 'sick', recoversAt: world.minute + 2 * DAY };
  stepUntil(world, person.health.recoversAt + DAY);
  assert.notEqual(person.health.condition, 'sick', 'a man with the army never mends');
});

test('step 0: somebody made sick by a norther with no roof up mends', () => {
  const world = landed('sick-cold', 20);
  for (const household of Object.values(world.households)) household.improvements = { ...household.improvements, cabin: 'none' };
  const home = world.map.sites[Object.values(world.households)[0].homeSiteId];
  let norther = -1;
  for (let day = 1; day < 210; day++) if (weatherAt(world, home, day).kind === 'norther') { norther = day; break; }
  assert.ok(norther > 0, 'this class never saw a norther');
  // Stood in the northers a day at a time, as tests/cold.test.mjs does, until somebody falls sick of the cold.
  let fell = null;
  for (let day = norther; day < norther + 60 && !fell; day++) {
    world.minute = day * DAY + 9 * 60;
    for (let tick = 0; tick < 2; tick++) stepWorld(world);
    const event = world.events.find(one => /no roof up yet/.test(one.text || ''));
    if (event) fell = world.entities[event.actorId];
  }
  assert.ok(fell, 'nobody fell sick of the cold in sixty days under canvas');
  assert.equal(fell.health.condition, 'sick');
  const due = fell.health.recoversAt;
  stepUntil(world, due + DAY);
  assert.notEqual(fell.health.condition, 'sick', 'somebody made sick by the cold at home never mended');
});

/**
 * A family set on the road east at once, without playing two class periods to get there: the third period's flight on a
 * settled class (`flee`, sim/scrape.mjs), nothing loaded, for the nearest refuge. The calendar is the autumn's; what these
 * tests hold is the road's own loop, not the spring's dates.
 */
function onTheRoad(seed, count = 5) {
  const world = landed(seed, count);
  world.period = 3;
  const household = Object.values(world.households)[0];
  household.flight = { status: 'ordered', orderedMinute: world.minute };
  const refuge = flightProjection(world, household).refuges.sort((a, b) => a.miles - b.miles)[0].id;
  flee(world, household, { take: {}, refuge });
  return { world, household };
}

test('step 0: on the road a sickness is still mended, and exactly once', () => {
  const { world, household } = onTheRoad('sick-road');
  const person = people(world, household).find(one => one.travel?.purpose === 'flee' && (one.age ?? 30) >= 16);
  person.health = { condition: 'sick', recoversAt: world.minute + DAY };
  stepUntil(world, world.minute + 3 * DAY);
  assert.notEqual(person.health.condition, 'sick', 'the road no longer mends anybody');
  const mended = world.events.filter(event => event.actorId === person.id && /is well again/.test(event.text || ''));
  assert.equal(mended.length, 1, `mended ${mended.length} times`);
});

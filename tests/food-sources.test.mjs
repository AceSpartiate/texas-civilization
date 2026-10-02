// Food only from real sources, and seed kept at the harvest (owner, 2026-10-02, playing v2026.10.02.1: "Food generation is broken by
// the way. I was playing and generated hundreds of food just by having some adults working around the house on auto. I'm thinking
// that we need to limit food generation to crops, fishing, hunting, etc. Also, didn't farmers back then get seeds from their crops?
// Can we incorporate something that maybe reduces yield, but gives us enough seed for the next planting?"; docs/HUNGER.md §10,
// docs/LAND_GRANTS.md §5.2). Each test is seen failing under scripts/food-sources-injections.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { advanceRoutine } from '../sim/routines.mjs';
import { FORAGE, FORAGE_MOST_DAYS, forageDays } from '../sim/gathering.mjs';
import { COTTON_SEED_BALES, growMs, seedFor, seedKept } from '../sim/crops.mjs';
import { plotsOf } from '../sim/fields.mjs';
import { CORN_YIELD_PER_PLOT, YIELD_PER_PLOT } from '../sim/improvements.mjs';
import { createSettledWorld } from './support/settled.mjs';
import { feedsNow } from '../public/family-panel.js';

const DAY = 1440;
/** A real-land class, every family rolled, the first a student's, stepped until it is on its land. */
function onTheLand(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  const household = world.households['hh-1'];
  household.played = true;
  world.status = 'running';
  for (let tick = 0; tick < 400 && household.arriving; tick++) stepWorld(world);
  assert.ok(!household.arriving, 'the family never reached its land');
  return { world, household, grown: household.members.map(id => world.entities[id]).filter(person => (person.age ?? 30) >= 16) };
}
/** Sends somebody to a work and puts them on auto, as a student does from the panel: the main person first, as the bar is theirs. */
function onAuto(world, household, person, chore) {
  household.mainId = person.id;
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore });
  applyAction(world, household.id, { action: 'set-auto', entityId: person.id, auto: true });
}
/** Food gained (never what was eaten) over the class's first five days: the first two phases, at twenty minutes and an hour a tick. */
function gainedInFiveDays(world, household) {
  let gained = 0;
  const end = world.minute + 5 * DAY;
  for (let tick = 0; tick < 2000 && world.minute < end; tick++) {
    const was = household.resources.food;
    stepWorld(world);
    if (household.resources.food > was) gained += household.resources.food - was;
  }
  return gained;
}

// ------------------------------------------------------------------------------------------------ the bug

test('the bug: two grown people on auto at the creek bring home a mess of fish a day each, not hundreds of food', () => {
  const { world, household, grown } = onTheLand('food-bug');
  assert.ok(grown.length >= 2);
  for (const person of grown.slice(0, 2)) onAuto(world, household, person, 'fish-the-water');
  assert.equal(world.director.phase, 'home', 'the class is past its first hours, where the bug lived');
  const gained = gainedInFiveDays(world, household);
  // Each of the two may bring a haul home on each of the five or six calendar days these ticks touch, at the best hand's skill:
  // fewer than 2 x 6 x 3 x 1.4 = 50.4. On v2026.10.02.1 it was over a thousand (docs/HUNGER.md §10).
  assert.ok(gained > 0, 'nobody brought home any fish');
  assert.ok(gained <= 2 * 6 * FORAGE.fish.food * 1.4, `two at the creek on auto brought home ${Math.round(gained)} food in five days`);
});

test('the bug: a bee tree on auto is one comb a person a day too', () => {
  const { world, household, grown } = onTheLand('food-bug');
  onAuto(world, household, grown[0], 'cut-bee-tree');
  const gained = gainedInFiveDays(world, household);
  assert.ok(gained > 0 && gained <= 6 * FORAGE.honey.food * 1.4, `a bee tree on auto brought home ${Math.round(gained)} food in five days`);
});

test('one haul a day: once a work has paid a person today it is refused them in words, another of the family may go, and tomorrow they may', () => {
  const { world, household, grown } = onTheLand('food-bug');
  const [first, second] = grown;
  household.mainId = first.id;
  applyAction(world, household.id, { action: 'chore', entityId: first.id, chore: 'fish-the-water' });
  for (let tick = 0; tick < 200 && first.chore; tick++) stepWorld(world);
  assert.equal(first.chore, null, 'the fishing never ended');
  const refused = choreAvailability(world, household, first, 'fish-the-water');
  assert.equal(Math.floor(world.minute / DAY), first.foraged?.fish, 'the haul was not marked for today');
  assert.equal(refused.can, false, 'the creek gave twice in a day');
  assert.match(refused.why, /has fished the water today; it will give more tomorrow/);
  assert.equal(choreAvailability(world, household, second, 'fish-the-water').can, true, 'nobody else of the family may fish today');
  // The next day.
  const tomorrow = (Math.floor(world.minute / DAY) + 1) * DAY;
  for (let tick = 0; tick < 400 && world.minute < tomorrow; tick++) stepWorld(world);
  assert.equal(choreAvailability(world, household, first, 'fish-the-water').can, true, 'the creek never gave again');
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ working about the place

test('working about the place makes no food: a family whose grown work about the place eats down its store like one at rest', () => {
  const world = createSettledWorld('food-about', 5);
  world.status = 'running';
  const household = Object.values(world.households)[0];
  household.played = true;
  const day = task => {
    const copy = structuredClone(world), home = copy.households[household.id];
    home.resources.food = 40;
    for (const id of home.members) { copy.entities[id].task = task; copy.entities[id].chore = null; }
    advanceRoutine(copy, DAY);
    return home.resources.food;
  };
  assert.equal(day('work'), day('rest'), 'working about the place made food');
  assert.ok(day('work') < 40, 'nobody ate');
  // And the gauge counts nothing coming in (sim/hunger.mjs `dailyDraw`).
  for (const id of household.members) world.entities[id].task = 'work';
  household.resources.food = 10;
  const { larder } = projectWorld(world, household.id, 'student', { includeMap: false }).household;
  assert.ok(Number.isFinite(larder.days) && larder.days > 0, `the gauge read ${larder.days} days with everybody working about the place`);
});

// ------------------------------------------------------------------------------------------------ seed kept at the harvest

test('seed kept: a corn plot keeps two of its ears and a cotton plot a bale\'s worth, enough to plant each again, and the harvest says so', () => {
  const world = createSettledWorld('food-seed', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  const [patch] = plotsOf(world, household);
  household.plots = [{ ...patch, state: 'cleared', fence: 'sound' }, { ...patch, id: 'plot-2', y: +(patch.y + 0.2).toFixed(3), state: 'cleared', fence: 'sound', ground: 'prairie' }];
  const [corn, cotton] = household.plots;
  Object.assign(corn, { sown: true, crop: 'corn', grownMs: growMs('corn'), ripe: true });
  Object.assign(cotton, { sown: true, crop: 'cotton', grownMs: growMs('cotton'), ripe: true });
  household.tools.hoe = 0;
  household.resources = { ...household.resources, food: 0, seed: 0, cotton: 0 };
  const thomas = world.entities['hh-1-thomas'];
  thomas.skills = { ...(thomas.skills || {}), farming: 1 };
  validateWorld(world);
  applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'harvest-field' });
  for (let tick = 0; tick < 300 && thomas.chore; tick++) stepWorld(world);
  assert.equal(thomas.chore, null, 'the harvest never ended');
  // Corn: ten in, eight to eat and two for seed; cotton: five bales in, four to sell and three seed from the one kept back.
  assert.equal(household.resources.seed, seedFor('corn') + seedFor('cotton'), 'not enough seed was kept to plant both plots again');
  assert.ok(Math.abs(household.resources.cotton - (YIELD_PER_PLOT - COTTON_SEED_BALES)) < 1e-9, `${household.resources.cotton} bales, not ${YIELD_PER_PLOT - COTTON_SEED_BALES}`);
  assert.ok(household.resources.food <= CORN_YIELD_PER_PLOT - seedFor('corn') + 1e-9 && household.resources.food > CORN_YIELD_PER_PLOT - seedFor('corn') - 1, `${household.resources.food} food from a plot of corn`);
  const said = world.events.filter(event => event.actorId === thomas.id && /brought in/.test(event.text)).at(-1)?.text || '';
  assert.match(said, /brought in [\d.]+ food and [\d.]+ cotton\. 5 seed kept back for the next planting: 2 of the corn, and 1 bale of the cotton left unginned for it\./, said);
  assert.doesNotMatch(said, /gone to stock/, 'the seed kept back was told as crop the stock had eaten, off fenced plots');
  validateWorld(world);
});

test('seed kept: never more than came in, and nothing kept from a crop that gave nothing', () => {
  const household = { field: null, plots: [{ id: 'p', crop: 'corn' }, { id: 'q', crop: 'cotton' }] };
  assert.deepEqual(seedKept(household, household.plots, { food: 1.5, cotton: 0 }), { seed: 1.5, food: 1.5, cotton: 0 });
  assert.deepEqual(seedKept(household, household.plots, { food: 10, cotton: 5 }), { seed: 5, food: 2, cotton: 1 });
  assert.deepEqual(seedKept(household, [], { food: 10, cotton: 5 }), { seed: 0, food: 0, cotton: 0 });
});

test('saves: a class saved before opens with nobody having foraged today, and a haul day that cannot be is refused', () => {
  const world = createSettledWorld('food-save', 5);
  validateWorld(world);
  const person = world.entities[Object.values(world.households)[0].members[0]];
  person.foraged = { fish: 3 };
  validateWorld(world);
  person.foraged = { gold: 3 };
  assert.throws(() => validateWorld(world), /Invalid foraging day/);
  person.foraged = { fish: 'today' };
  assert.throws(() => validateWorld(world), /Invalid foraging day/);
});

// ------------------------------------------------------------------------------------------------ where food comes from, on the bar

test('the ways to food glow on the bar while the food is low, and nothing else does', () => {
  for (const key of ['fish-the-water', 'hunt-land', 'plant-field', 'harvest-field', 'take-small-game']) {
    for (const level of ['low', 'short', 'empty', 'weak', 'starving']) assert.equal(feedsNow(key, level), true, `${key} at ${level}`);
    for (const level of ['plenty', 'fair', null]) assert.equal(feedsNow(key, level), false, `${key} glowed at ${level}`);
  }
  for (const key of ['work', 'rest', 'build-house', 'fell-trees', 'travel-gonzales']) assert.equal(feedsNow(key, 'starving'), false, `${key} glowed as food`);
});

test('a haul for every day out: a trip that spans days of the calendar brings home a haul a day, never less than one, at most three', () => {
  const world = { minute: 10 * DAY };
  assert.equal(forageDays(world, { since: 10 * DAY - 120 }), 1, 'a two-hour trip brought home less than one haul');
  assert.equal(forageDays(world, { since: 10 * DAY - 2.5 * DAY }), 2.5, 'a trip of two and a half days brought home one haul');
  assert.equal(forageDays(world, { since: 0 }), FORAGE_MOST_DAYS, 'a trip held up for ten days brought home ten days of fish');
  assert.equal(forageDays(world, {}), 1, 'a trip saved before its start was written');
  assert.equal(FORAGE_MOST_DAYS, 3);
  // And in a class: at the campaign's half a day a tick, somebody at the creek on auto brings home about a mess of fish a day.
  const { world: class_, household, grown } = onTheLand('food-bug');
  for (let tick = 0; tick < 3000 && class_.director.phase !== 'campaign'; tick++) stepWorld(class_);
  const fisher = grown.find(person => !['dead', 'captured'].includes(person.health?.condition) && !person.service);
  household.resources.food = 500;
  // An ordinary hand, so a day's haul is the work's own three food and what a person can carry home on foot (five) is not reached
  // by a single day's.
  fisher.skills = { ...(fisher.skills || {}), hands: 1 };
  onAuto(class_, household, fisher, 'fish-the-water');
  // Counted from what the family's story says was brought home: the store itself spoils as it goes (sim/houses.mjs).
  const from = class_.minute, before = class_.events.length;
  for (let tick = 0; tick < 60; tick++) stepWorld(class_);
  const gained = class_.events.slice(before).filter(event => event.actorId === fisher.id && event.forage === 'fish').reduce((sum, event) => sum + event.food, 0);
  const perDay = gained / ((class_.minute - from) / DAY);
  // A trip and the half day after it take about two and a half days of the campaign: a haul a day for it is about 1.8 food a day,
  // one haul a trip would be about 1.2.
  assert.ok(perDay >= 1.5 && perDay <= FORAGE.fish.food * 1.5, `${perDay.toFixed(2)} food a calendar day from the creek in the campaign`);
});

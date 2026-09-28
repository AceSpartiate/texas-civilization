// Crops in real minutes (owner, 2026-09-28, by multiple choice: "have crops be independent of the seasons. say, 5 minutes for
// cotton and 3 for corn? adjust prices to compensate"; sim/crops.mjs). Either crop goes in in any month and ripens after its real
// minutes of a running class - the real time the server measured for each tick, or the Study pace for a tick stepped in process -
// so changing the class's speed changes the ticks a crop takes and never its minutes. Replaced the farming year of the same
// morning (the garden went with it). `FIC-GONZ-721`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { settleMeans } from '../sim/means.mjs';
import { createSettledWorld, settle, taught } from './support/settled.mjs';
import { CROPS, RIPEN_TICKS, STUDY_TICK_MS, growMs } from '../sim/crops.mjs';
import { clearedOf } from '../sim/improvements.mjs';

const MINUTE = 60000;
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const running = seed => { const world = taught(createSettledWorld(seed, 5)); world.status = 'running'; return world; };
function realLand(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  settleMeans(world); settle(world); taught(world);
  for (const household of Object.values(world.households)) delete household.choosingSite;
  world.status = 'running';
  return world;
}
const first = world => Object.values(world.households)[0];
const grown = (world, household) => household.members.map(id => world.entities[id]).filter(person => !Number.isFinite(person.age) || person.age >= 16);
const sown = (world, household, crop) => { household.field = { ...household.field, crop, state: 'planted', changedTick: world.tick, grownMs: 0 }; };
/** Step until the field is ripe, each tick `ms` of real time; the ticks it took, or null. */
const ticksToRipe = (world, household, ms, limit = 400) => { for (let t = 1; t <= limit; t++) { stepWorld(world, { realMs: ms }); if (household.field.state === 'ripe') return t; } return null; };

test('corn ripens after three real minutes and cotton after five, counted from the real time each tick took', () => {
  assert.deepEqual([CROPS.corn.minutes, CROPS.cotton.minutes], [3, 5]);
  for (const [crop, minutes] of [['corn', 3], ['cotton', 5]]) {
    const world = running(`minutes-${crop}`);
    const household = first(world);
    sown(world, household, crop);
    // A tick of a minute each: ripe on the tick the minutes are up, and not the one before.
    assert.equal(ticksToRipe(world, household, MINUTE), minutes, `${crop} did not come in after ${minutes} real minutes`);
    assert.ok(world.events.some(event => event.householdId === household.id && event.text === `The ${crop} is ready to bring in.`));
    validateWorld(world);
  }
});

test('the class\'s speed changes the ticks a crop takes and never its minutes; a tick stepped in process counts at the Study pace', () => {
  // Ninety ticks at the quick pace, a second each, then the Study pace: ninety seconds to go is ten Study ticks, not nine.
  const world = running('minutes-speed');
  const household = first(world);
  sown(world, household, 'corn');
  for (let t = 0; t < 90; t++) stepWorld(world, { realMs: 1000 });
  assert.equal(household.field.state, 'planted', 'corn came in after ninety seconds');
  assert.equal(ticksToRipe(world, household, STUDY_TICK_MS), Math.ceil((growMs('corn') - 90000) / STUDY_TICK_MS));
  // Stepped in process, with no real time handed in: the Study pace, nineteen ticks for corn and thirty-two for cotton.
  for (const [crop, ticks] of [['corn', RIPEN_TICKS], ['cotton', Math.ceil(5 * MINUTE / STUDY_TICK_MS)]]) {
    const other = running(`minutes-headless-${crop}`);
    const family = first(other);
    sown(other, family, crop);
    let taken = 0;
    for (; taken < 200 && family.field.state !== 'ripe'; taken++) stepWorld(other);
    assert.equal(taken, ticks, `${crop} stepped in process took ${taken} ticks`);
  }
  assert.equal(RIPEN_TICKS, 19);
});

test('either crop goes in in any month on the real land, and the harvest says how many minutes are left', () => {
  const world = realLand('minutes-any-month');
  const household = first(world);
  household.field = { ...household.field, crop: 'corn', state: 'bare' };
  household.resources.seed = 20;
  const person = world.entities[household.members[0]];
  const dawn = world.minute;
  for (const [year, month, day] of [[1835, 10, 1], [1835, 12, 10], [1836, 6, 1]]) {
    world.minute = (Date.UTC(year, month - 1, day, 6) - Date.UTC(1835, 8, 28, 6)) / 60000;
    assert.equal(view(world, household.id).work[person.id].find(work => work.id === 'plant-field').can, true, `planting refused on ${year}-${month}-${day}`);
  }
  // Back to the class's own day to plant (a date moved by hand would set the director's timeline running).
  world.minute = dawn;
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'plant-field' });
  for (let t = 0; t < 400 && !person.chore?.ask; t++) stepWorld(world);
  const options = view(world, household.id).entities.find(one => one.id === person.id).chore.ask.options;
  assert.deepEqual(options.map(option => [option.id, option.can]), [['corn', true], ['cotton', true]]);
  assert.match(options.find(option => option.id === 'cotton').note, /ripe in 5 minutes/);
  applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: 'cotton' });
  for (let t = 0; t < 400 && person.chore; t++) stepWorld(world);
  assert.equal(household.field.state, 'planted');
  assert.equal(household.field.crop, 'cotton');
  const harvest = view(world, household.id).work[person.id].find(work => work.id === 'harvest-field');
  assert.equal(harvest.can, false);
  assert.match(harvest.why, /^The cotton is not ready: it will be (in about \d minutes|within the minute)\.$/);
  validateWorld(world);
});

test('a crop sown in a class saved before this comes in about when it was promised; what a save may hold of the field', () => {
  const world = running('minutes-old');
  const household = first(world);
  // Planted nineteen ticks ago with no real time kept: read as nineteen Study-pace ticks, which is corn's three minutes.
  household.field = { crop: 'corn', state: 'planted', changedTick: world.tick - RIPEN_TICKS };
  validateWorld(world);
  stepWorld(world);
  assert.equal(household.field.state, 'ripe', 'an old save\'s corn never came in');
  for (const bad of [{ crop: 'garden', state: 'planted', changedTick: 1 }, { crop: 'corn', state: 'planted', changedTick: 1, grownMs: -1 }, { crop: 'cotton', state: 'planted', changedTick: 1, grownMs: 'long' }]) {
    household.field = bad;
    assert.throws(() => validateWorld(world), /Invalid field state/, JSON.stringify(bad));
  }
});

test('two sent to plant at once: the second works alongside, one question at the rows, and the seed is spent once', () => {
  const world = realLand('minutes-two-planters');
  const household = first(world);
  household.field = { ...household.field, crop: 'cotton', state: 'bare' };
  household.resources.seed = CROPS.cotton.seed * clearedOf(household);
  const [one, two] = grown(world, household);
  for (const person of [one, two]) applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'plant-field' });
  assert.equal(two.chore?.alongside, one.id, 'the second planter did not work alongside the first');
  for (let t = 0; t < 400 && !one.chore?.ask; t++) stepWorld(world);
  assert.ok(one.chore?.ask && !two.chore?.ask, 'not one question at the rows');
  applyAction(world, household.id, { action: 'answer-chore', entityId: one.id, option: 'cotton' });
  for (let t = 0; t < 800 && (one.chore || two.chore); t++) stepWorld(world);
  assert.equal(household.field.state, 'planted');
  assert.equal(household.field.crop, 'cotton');
  assert.equal(household.resources.seed, 0, 'the seed was not spent once, exactly');
  validateWorld(world);
});

test('the seed gone while a planter stands at the rows: nothing is planted, and no crop goes in without its seed', () => {
  // Found by the balance measure on 2026-09-28: a planter who found the seed gone fell to the first answer at the rows and planted it.
  const world = running('minutes-seed-gone');
  const household = first(world);
  household.field = { ...household.field, crop: 'cotton', state: 'bare' };
  household.resources.seed = 20;
  const person = grown(world, household)[0];
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'plant-field' });
  for (let t = 0; t < 400 && !person.chore?.ask; t++) stepWorld(world);
  assert.ok(person.chore?.ask, 'nobody was asked at the rows');
  household.resources.seed = 0;
  person.auto = true;
  for (let t = 0; t < 400 && person.chore; t++) stepWorld(world);
  assert.equal(household.field.state, 'bare', `a crop went in with no seed: ${household.field.crop}`);
  assert.ok(world.events.some(event => event.actorId === person.id && /plant nothing/.test(event.text || '')), 'the planter did not come in with nothing planted');
  validateWorld(world);
});

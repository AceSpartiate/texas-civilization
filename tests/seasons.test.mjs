// The farming year (owner, 2026-09-28, by multiple choice on docs/audits/2026-09-28-design.md B9: "Seasons and a limited market";
// sim/seasons.mjs). On the real land a crop goes in only in its season and comes in after its real time in calendar days, not
// eighteen ticks; the autumn's crop is a garden of turnips and greens; corn and cotton go in at the end of the winter and come in
// after the war. The invented country's one afternoon keeps the old lesson rhythm, and a crop sown in a class saved before today
// comes in as it was promised.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { settleMeans } from '../sim/means.mjs';
import { createSettledWorld, settle, taught } from './support/settled.mjs';
import { CROPS, RIPEN_TICKS, cropNow, inSeason, plantingRefusal, ripe, ripensAt } from '../sim/seasons.mjs';
import { advanceLessons } from '../sim/lesson.mjs';
import { clearedOf } from '../sim/improvements.mjs';

const DAY = 1440;
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const lessonOf = (world, householdId) => view(world, householdId).lesson;
/** A class on the real land, every family home under a roof and its house site settled, at dawn on September 28, 1835. */
function realLand(seed, count = 5) {
  const world = createGonzalesWorld(seed, count, { map: 'colonies' });
  settleMeans(world); settle(world); taught(world);
  for (const household of Object.values(world.households)) delete household.choosingSite;
  world.status = 'running';
  return world;
}
const first = world => Object.values(world.households)[0];
const hand = (world, household) => world.entities[household.members[0]];
const untilAsk = (world, person) => { for (let t = 0; t < 400 && person.chore && !person.chore.ask; t++) stepWorld(world); };
const finish = (world, person) => { for (let t = 0; t < 800 && person.chore; t++) stepWorld(world); };
/** The class's own calendar minute of a date in 1835-36 (dawn September 28, 1835 is minute 0 on the real land). */
const minuteOf = (year, month, day) => (Date.UTC(year, month - 1, day, 6) - Date.UTC(1835, 8, 28, 6)) / 60000;

test('the farming year: a garden from September to April, corn from the middle of February, cotton from the end of March', () => {
  const world = realLand('seasons-windows');
  const at = (crop, year, month, day) => inSeason(world, crop, minuteOf(year, month, day));
  assert.equal(at('garden', 1835, 9, 28), true, 'no garden in the autumn');
  assert.equal(at('corn', 1835, 9, 28), false, 'corn goes in in September');
  assert.equal(at('cotton', 1835, 10, 15), false, 'cotton goes in in October');
  assert.equal(at('garden', 1835, 12, 10), true);
  assert.equal(at('corn', 1836, 1, 25), false, 'corn goes in in January');
  assert.equal(at('corn', 1836, 2, 20), true, 'no corn at the end of February, when "every farmer was planting corn"');
  assert.equal(at('corn', 1836, 3, 1), true);
  assert.equal(at('cotton', 1836, 3, 1), false, 'cotton before the corn');
  assert.equal(at('cotton', 1836, 4, 1), true);
  assert.equal(at('garden', 1836, 6, 10), false);
  // And a crop's real time: nothing the class plants in corn's season comes in before the war ends (April 25, 1836).
  assert.ok(minuteOf(1836, 2, 15) + CROPS.corn.days * DAY > minuteOf(1836, 4, 25), 'corn planted in its season comes in before the class ends');
  assert.ok(minuteOf(1836, 3, 20) + CROPS.cotton.days * DAY > minuteOf(1836, 4, 25), 'cotton planted in its season comes in before the class ends');
  assert.ok(minuteOf(1835, 9, 28) + CROPS.garden.days * DAY < minuteOf(1835, 12, 15), "the autumn's garden does not come in before the first period ends");
  // Out of every season (the summer, after the class) planting is refused, in words that say when the next season opens.
  const household = first(world);
  assert.equal(plantingRefusal(world, household), null, 'planting is refused in the autumn');
  world.minute = minuteOf(1836, 6, 1);
  assert.equal(plantingRefusal(world, household), 'Nothing goes in the ground in June. A garden from September 1; corn from February 15.');
  const person = hand(world, household);
  assert.equal(view(world, household.id).work[person.id].find(work => work.id === 'plant-field').can, false, 'the field can be planted in June');
});

test('on the real land the autumn planting is a garden: corn and cotton are refused in words, and silence keeps the family\'s own crop for the spring', () => {
  const world = realLand('seasons-autumn');
  const household = first(world);
  household.field = { ...household.field, crop: 'cotton', state: 'bare' };
  household.resources.seed = 10;
  assert.equal(cropNow(world, household), 'garden');
  const person = hand(world, household);
  const offered = view(world, household.id).work[person.id].find(work => work.id === 'plant-field');
  assert.equal(offered.can, true, `planting is refused in the autumn: ${offered.why}`);
  assert.equal(offered.cost, `${CROPS.garden.seed * clearedOf(household)} seed`, 'planting is not quoted at the garden\'s seed');
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'plant-field' });
  untilAsk(world, person);
  const options = view(world, household.id).entities.find(e => e.id === person.id).chore.ask.options;
  assert.deepEqual(options.map(o => [o.id, o.can]), [['cotton', false], ['garden', true], ['corn', false]]);
  assert.match(options.find(o => o.id === 'corn').why, /Corn goes in at the end of the winter/);
  assert.match(options.find(o => o.id === 'cotton').why, /Cotton goes in in the spring/);
  assert.match(options.find(o => o.id === 'garden').note, /about 6 weeks in the ground/);
  // An answer out of season is refused, and nobody answering plants the garden.
  assert.throws(() => applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: 'cotton' }), /spring/);
  finish(world, person);
  assert.equal(household.field.state, 'planted');
  assert.equal(household.field.crop, 'garden');
  assert.equal(household.field.own, 'cotton', 'the family forgot it meant to grow cotton');
  assert.equal(household.resources.seed, 10 - CROPS.garden.seed * clearedOf(household));
  assert.ok(Number.isFinite(household.field.sownMinute), 'the minute it was sown is not kept');
  validateWorld(world);
});

test('a crop takes its real time on the calendar: a garden is six weeks, not eighteen ticks, and says when it will be ready', () => {
  const world = realLand('seasons-timing');
  const household = first(world);
  household.field = { crop: 'garden', own: 'corn', state: 'planted', changedTick: world.tick, sownMinute: world.minute };
  for (let t = 0; t < RIPEN_TICKS * 3; t++) stepWorld(world);
  assert.equal(household.field.state, 'planted', 'the garden ripened in ticks, not days');
  const person = hand(world, household);
  const harvest = view(world, household.id).work[person.id].find(work => work.id === 'harvest-field');
  assert.equal(harvest.can, false);
  assert.match(harvest.why, /The garden is not ready: it will be about November 9\./);
  // A day short of its time it is still growing; at its time it is ripe, and the family is told.
  assert.equal(ripensAt(world, household.field), household.field.sownMinute + CROPS.garden.days * DAY);
  world.minute = ripensAt(world, household.field) - DAY;
  stepWorld(world);
  assert.equal(household.field.state, 'planted', 'the garden came in a day early');
  world.minute = ripensAt(world, household.field);
  stepWorld(world);
  assert.equal(household.field.state, 'ripe', 'the garden did not come in on its day');
  assert.ok(world.events.some(event => event.householdId === household.id && event.text === 'The garden is ready to bring in.'));
  // Brought in, it is food, and the field is bare with no sowing kept.
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'harvest-field' });
  const food = household.resources.food;
  finish(world, person);
  assert.equal(household.field.state, 'bare');
  assert.equal(household.field.sownMinute, undefined);
  assert.ok(household.resources.food > food - 3, 'the garden did not come in as food');
  validateWorld(world);
});

test('a class saved before the farming year: its crop in the ground comes in as it was promised, and the invented country keeps its afternoon', () => {
  // The real land, a crop sown before today: no sown minute, so the old eighteen ticks.
  const world = realLand('seasons-old');
  const household = first(world);
  household.field = { crop: 'corn', state: 'planted', changedTick: world.tick };
  validateWorld(world);
  assert.equal(ripensAt(world, household.field), null);
  for (let t = 0; t <= RIPEN_TICKS && household.field.state !== 'ripe'; t++) stepWorld(world);
  assert.equal(household.field.state, 'ripe', 'a crop sown before the farming year never came in');
  // The invented Gonzales country: corn and cotton in September, no garden, and eighteen ticks.
  const invented = createSettledWorld('seasons-invented', 5);
  invented.status = 'running';
  const family = Object.values(invented.households)[0];
  family.resources.seed = 10;
  family.field = { ...family.field, crop: 'corn', state: 'bare' };
  assert.equal(plantingRefusal(invented, family), null);
  assert.equal(inSeason(invented, 'corn'), true);
  assert.equal(inSeason(invented, 'garden'), false);
  const person = invented.entities[family.members[0]];
  applyAction(invented, family.id, { action: 'chore', entityId: person.id, chore: 'plant-field' });
  untilAsk(invented, person);
  assert.deepEqual(view(invented, family.id).entities.find(e => e.id === person.id).chore.ask.options.map(o => o.id), ['corn', 'cotton']);
  finish(invented, person);
  assert.equal(family.field.crop, 'corn');
  const sown = invented.tick;
  for (let t = 0; t <= RIPEN_TICKS + 2 && family.field.state !== 'ripe'; t++) stepWorld(invented);
  assert.equal(family.field.state, 'ripe');
  assert.ok(invented.tick - sown <= RIPEN_TICKS + 1);
});

test('what a save may hold of the field: a garden, the sown minute on a crop in the ground, the family\'s own crop beside it', () => {
  const world = realLand('seasons-validate');
  const household = first(world);
  household.field = { crop: 'garden', own: 'cotton', state: 'planted', changedTick: 1, sownMinute: 20 };
  validateWorld(world);
  for (const bad of [
    { crop: 'garden', state: 'planted', changedTick: 1, sownMinute: 'dawn' },
    { crop: 'corn', own: 'garden', state: 'bare', changedTick: 1 },
    { crop: 'wheat', state: 'bare', changedTick: 1 },
    { crop: 'corn', state: 'planted', changedTick: 1, sownMinute: -5 },
  ]) {
    household.field = bad;
    assert.throws(() => validateWorld(world), /Invalid field state/, JSON.stringify(bad));
  }
});

test('the guided start on the real land: the autumn\'s garden is planted, the harvest step says when it will be ready, and the sale is of food', () => {
  const world = realLand('seasons-lesson');
  const household = first(world);
  household.played = true;
  household.lesson = { step: 'plant' };
  household.resources.seed = 10;
  advanceLessons(world);
  assert.equal(lessonOf(world, household.id).step, 'plant');
  assert.match(lessonOf(world, household.id).says, /only a garden of turnips and greens will grow/);
  const person = hand(world, household);
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'plant-field' });
  finish(world, person);
  assert.equal(household.field.crop, 'garden');
  advanceLessons(world);
  const lesson = lessonOf(world, household.id);
  assert.equal(lesson.step, 'sell', 'the lesson waits weeks at the harvest step');
  assert.match(lesson.did, /The garden is growing and will be ready about November \d+/);
  assert.match(lesson.says, /food will do until the crop is in/);
  // And the harvest, when it comes, is never refused by a later step.
  assert.ok(lesson.allow.includes('chore:harvest-field'));
});

test('a ripe field is read from the calendar and nothing else', () => {
  const world = realLand('seasons-pure');
  const field = { crop: 'cotton', state: 'planted', changedTick: 0, sownMinute: minuteOf(1836, 3, 25) };
  world.minute = minuteOf(1836, 4, 25);
  world.tick = 10_000;
  assert.equal(ripe(world, field), false, 'cotton planted in March was picked in April');
  world.minute = field.sownMinute + CROPS.cotton.days * DAY;
  assert.equal(ripe(world, field), true);
});

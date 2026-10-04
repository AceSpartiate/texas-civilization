// The women's own work: keeping house, the kitchen garden and the wash (owner, 2026-10-03; sim/housework.mjs,
// docs/CUSTOMARY_WORK.md §4-6).
//
// > "keep house, garden, wash clothes. if a family member goes to town/war/away then other npc's should have negative comments
// > about their smell, higher than normal prices, etc unless a woman has been washing clothes."
//
// Each test here was proved by injecting the regression it guards (scripts/custom-work-injections.mjs,
// docs/evidence/custom-work-injections.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginChore, choreAvailability } from '../sim/chores.mjs';
import { errandOffers } from '../sim/errands.mjs';
import { CLEAN_DAYS, GARDEN_FOOD, REMARKS, WASH_AGAIN_DAYS, advanceWash, dirty, houseSaving, remarkLines } from '../sim/housework.mjs';
import { createSettledWorld, modestMeans, taught } from './support/settled.mjs';

const DAY = 1440;
const deps = { beginTravel: () => { throw new Error('no journeys in this test'); }, modeAvailability: () => ({ can: true }) };
const washDue = (world, household, person) => !/once a week/.test(choreAvailability(world, household, person, 'wash-clothes').why || '');
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const dayOf = world => Math.floor(world.minute / DAY);
function running(seed) {
  const world = modestMeans(taught(createSettledWorld(seed, 5)));
  world.status = 'running';
  const household = world.households['hh-1'];
  household.played = true;
  const [thomas, elena, rosa, mateo] = ['thomas', 'elena', 'rosa', 'mateo'].map(key => world.entities[`hh-1-${key}`]);
  return { world, household, thomas, elena, rosa, mateo };
}
/** Work this person until it is done, ticking the world. */
const finish = (world, person, cap = 400) => { for (let t = 0; t < cap && person.chore; t++) stepWorld(world); assert.equal(person.chore, null, `${person.name} never finished ${person.chore?.id}`); };
const story = (world, from = 0) => world.events.slice(from).filter(event => event.householdId === 'hh-1').map(event => event.text);
/** Move the class's clock on by whole days, nothing else: only for what reads the day and does not step the world. */
const daysOn = (world, days) => { world.minute += days * DAY; };
/** Everybody's clothes as if the class had been read as washed `days` ago: the clock is not moved, so the world still steps. */
const washedAgo = (world, days) => { world.washBase = dayOf(world) - days; };

test('keeping house: the hidden saving comes from whoever kept house today or yesterday, once a day, and from nobody else', () => {
  const { world, household, elena, thomas } = running('house-kept');
  for (const person of [elena, thomas]) person.traits = { strength: 5, health: 9, housework: person === elena ? 10 : 1 };
  assert.equal(houseSaving(world, household), 0, 'the house was kept with nobody keeping it');
  beginChore(world, household, elena, 'keep-house', deps);
  finish(world, elena);
  assert.ok(houseSaving(world, household) > 0.2, 'keeping house saved nothing');
  assert.ok(story(world).some(text => /kept house/.test(text)));
  // Once a day: refused in words, to her and to anybody.
  assert.match(choreAvailability(world, household, elena, 'keep-house').why, /The house has been kept today/);
  // Tomorrow it still counts; the day after, it does not.
  daysOn(world, 1);
  assert.ok(houseSaving(world, household) > 0.2, 'a house kept yesterday stopped counting');
  daysOn(world, 1);
  assert.equal(houseSaving(world, household), 0, 'a house kept two days ago still counted');
  validateWorld(world);
});

test('the kitchen garden: laid out the first day beside the house, then food every day it is worked, once a day', () => {
  const { world, household, elena } = running('garden');
  const brought = from => story(world, from).filter(text => /worked the garden and brought in/.test(text));
  beginChore(world, household, elena, 'work-garden', deps);
  finish(world, elena);
  assert.ok(household.garden, 'no garden was laid out');
  assert.ok(story(world).some(text => /laid out a kitchen garden beside the house/.test(text)));
  assert.deepEqual(brought(0), [], 'the garden gave food the day it was dug');
  const land = view(world, 'hh-1').land;
  assert.deepEqual([land.garden.x, land.garden.y], [household.garden.x, household.garden.y], 'the page is not sent the garden');
  const home = world.map.sites[household.homeSiteId];
  assert.ok(Math.hypot(land.garden.x - home.x, land.garden.y - home.y) < 0.1, 'the garden is not beside the house');
  // The next day (the garden laid out and worked yesterday): food, said in the story, and exactly that much more in the house than
  // an identical family whose mother rested instead.
  household.garden.laid -= 1; household.garden.worked -= 1;
  household.resources.food = 50;
  const twin = structuredClone(world);
  const from = world.events.length;
  beginChore(world, household, elena, 'work-garden', deps);
  const sister = twin.entities[elena.id];
  sister.task = 'rest';
  let ticks = 0;
  for (; ticks < 400 && elena.chore; ticks++) { stepWorld(world); stepWorld(twin); }
  assert.equal(elena.chore, null);
  assert.deepEqual(brought(from).map(text => text.match(/: ([\d.]+) food\.$/)?.[1]), [String(GARDEN_FOOD)], 'a day in the garden did not say its food');
  const gained = Math.round((household.resources.food - twin.households['hh-1'].resources.food) * 1000) / 1000;
  assert.equal(gained, GARDEN_FOOD, `a day in the garden put ${gained} food in the house`);
  assert.match(choreAvailability(world, household, elena, 'work-garden').why, /worked today/);
  validateWorld(world);
});

test('the wash: everybody at home is clean for seven days, and nobody away is washed; washed again after seven', () => {
  // The days themselves, written out (docs/CUSTOMARY_WORK.md §6, `FIC-GONZ-1157`), so a change to the module is caught here.
  // Weekly wash day (owner, 2026-10-04): clean seven days, and washed again after seven.
  assert.deepEqual([CLEAN_DAYS, WASH_AGAIN_DAYS], [7, 7]);
  const { world, household, elena, thomas, rosa } = running('wash');
  stepWorld(world);
  assert.equal(world.washBase, dayOf(world), 'the day a class is first read as washed was not written');
  washedAgo(world, CLEAN_DAYS);
  assert.ok([elena, thomas, rosa].every(person => dirty(world, person)), 'clothes did not want washing after eight days');
  // Thomas is in town while she washes.
  thomas.location = { ...thomas.location, siteId: 'gonzales' };
  beginChore(world, household, elena, 'wash-clothes', deps);
  finish(world, elena);
  assert.equal(dirty(world, elena), false);
  assert.equal(dirty(world, rosa), false);
  assert.equal(dirty(world, thomas), true, 'the clothes of a man away in town were washed at home');
  assert.ok(story(world).some(text => /did the wash/.test(text)));
  daysOn(world, WASH_AGAIN_DAYS - 1);
  assert.match(choreAvailability(world, household, elena, 'wash-clothes').why, /once a week/);
  assert.equal(dirty(world, rosa), false, 'clothes washed six days ago want washing');
  daysOn(world, 1);
  assert.equal(washDue(world, household, elena), true, 'the wash was not open on the seventh day');
  assert.equal(dirty(world, rosa), true, 'clothes washed seven days ago are still clean');
  // The page draws flies over a dirty person, and over nobody clean.
  const people = view(world, 'hh-1').entities;
  assert.equal(people.find(one => one.id === rosa.id).dirty, true);
  rosa.washed = dayOf(world);
  assert.equal(view(world, 'hh-1').entities.find(one => one.id === rosa.id).dirty, undefined);
});

test('dirty in town: somebody there says so, once, in the story and over their own head; clean, nobody says anything', () => {
  for (const clean of [false, true]) {
    const { world, rosa } = running(`remark-${clean}`);
    stepWorld(world);
    washedAgo(world, CLEAN_DAYS + 1);
    if (clean) rosa.washed = dayOf(world);
    rosa.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
    const from = world.events.length;
    advanceWash(world);
    const said = story(world, from).filter(text => /wrinkled/.test(text));
    if (clean) { assert.deepEqual(said, [], 'a clean customer was told she smelt'); continue; }
    assert.equal(said.length, 1, 'nothing was said of her clothes in town');
    const line = REMARKS.town.find(words => said[0].includes(words));
    assert.ok(line, `the town's words were not a town line: ${said[0]}`);
    const bubble = remarkLines(world, world.households['hh-1']);
    assert.equal(bubble.length, 1);
    assert.equal(bubble[0].text, line);
    assert.ok(world.entities[bubble[0].speakerId].location.siteId === 'gonzales' && !world.entities[bubble[0].speakerId].householdId, 'the speaker is not a townsman of Gonzales');
    assert.ok(view(world, 'hh-1').familyTalk.lines.some(one => one.text === line), 'the page is not sent the words over the speaker');
    // Not again, however long she stands there; and the words leave the speaker's head after a few ticks.
    for (let tick = 0; tick < 5; tick++) advanceWash(world), world.tick++;
    assert.equal(story(world, from).filter(text => /wrinkled/.test(text)).length, 1, 'she was told it again in the same town');
    assert.equal(remarkLines(world, world.households['hh-1']).length, 0, 'the words stayed over the speaker');
    validateWorld(world);
  }
});

test('dirty at the war: the other volunteers say so in their own words', () => {
  const { world, thomas } = running('remark-war');
  stepWorld(world);
  washedAgo(world, CLEAN_DAYS + 2);
  const camp = 'gonzales';
  const other = world.entities['hh-2-thomas'];
  for (const man of [thomas, other]) {
    man.service = { kind: 'regular', status: 'serving', since: 0, siteId: camp };
    man.location = { ...world.map.sites[camp], siteId: camp };
  }
  // Nobody of the town is there: the camp is the volunteers'.
  for (const one of Object.values(world.entities)) if (!one.householdId && one.location?.siteId === camp) one.location = { ...one.location, siteId: 'elsewhere' };
  const from = world.events.length;
  advanceWash(world);
  const said = story(world, from).filter(text => /wrinkled/.test(text));
  assert.equal(said.length, 1);
  assert.ok(REMARKS.army.some(words => said[0].includes(words)), `not a volunteer's words: ${said[0]}`);
});

test('the shops ask a quarter more and pay a fifth less of a customer in dirty clothes, say why on the list, and charge it', () => {
  const prices = {};
  for (const clean of [true, false]) {
    const { world, household, rosa } = running(`prices-${clean}`);
    stepWorld(world);
    washedAgo(world, CLEAN_DAYS + 1);
    if (clean) rosa.washed = dayOf(world);
    household.resources = { ...household.resources, seed: 2, food: 30, money: 10 };
    const offers = errandOffers(world, household, rosa);
    const seed = offers.lines.find(line => line.id === 'store:seed');
    prices[clean] = { seed: seed.price, dear: Boolean(seed.dear), dearer: offers.dearer || null };
    const from = world.events.length;
    applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'visit-shop', errand: [{ id: 'store:seed', n: 2, pay: 'food' }, { id: 'store:food', n: 3, pay: 'coin' }] });
    for (let t = 0; t < 900 && rosa.chore; t++) stepWorld(world);
    prices[clean].story = story(world, from).filter(text => /seed|food to/.test(text));
    prices[clean].seedPaid = 30 - household.resources.food;
  }
  assert.equal(prices.true.seed, '1 real or 3 food for 2 seed');
  assert.equal(prices.true.dear, false);
  assert.equal(prices.true.dearer, null);
  assert.equal(prices.false.seed, '2 reales or 3.75 food for 2 seed (1 real or 3 food to a clean customer)');
  assert.equal(prices.false.dear, true);
  assert.match(prices.false.dearer, /clothes want washing: the shops ask a quarter more and pay a fifth less/);
  assert.ok(prices.true.story.some(text => /bought 4 seed at the store for 6 food\.$/.test(text)), prices.true.story.join(' | '));
  assert.ok(prices.false.story.some(text => /bought 4 seed at the store for 7\.5 food - 6 food to a clean customer, but .* asked more\.$/.test(text)), prices.false.story.join(' | '));
  // The store's three lots of food: three reales clean, a real less in dirty clothes.
  assert.ok(prices.true.story.some(text => /sold 9 food to .* for 3 reales\.$/.test(text)), prices.true.story.join(' | '));
  assert.ok(prices.false.story.some(text => /sold 9 food to .* for 2 reales - 3 reales to a clean customer/.test(text)), prices.false.story.join(' | '));
});

test('a class saved before the wash opens with everybody clean, and nothing saved before is refused', () => {
  const { world } = running('wash-old-save');
  for (let tick = 0; tick < 3; tick++) stepWorld(world);
  // What a save of 2026-10-02 holds: none of it.
  const old = JSON.parse(JSON.stringify(world));
  delete old.washBase;
  for (const entity of Object.values(old.entities)) { delete entity.washed; delete entity.remark; delete entity.necessity; }
  for (const household of Object.values(old.households)) { delete household.washDay; delete household.housekept; delete household.garden; }
  old.minute += 30 * DAY;
  validateWorld(old);
  const people = Object.values(old.entities).filter(one => one.kind === 'person' && one.householdId);
  assert.ok(people.every(person => !dirty(old, person)), 'an old class opened with dirty clothes');
  stepWorld(old);
  assert.equal(old.washBase, Math.floor(old.minute / DAY), 'the old class is not read as washed the day it opened');
  assert.ok(people.every(person => !dirty(old, person)));
  validateWorld(JSON.parse(JSON.stringify(old)));
  // And a world holding nonsense is refused.
  const bad = JSON.parse(JSON.stringify(old));
  bad.entities['hh-1-rosa'].washed = 'monday';
  assert.throws(() => validateWorld(bad), /wash/i);
});

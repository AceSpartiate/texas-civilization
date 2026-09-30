// The Runaway Scrape's own choices, as the owner answered them on 2026-09-29 (docs/audits/2026-09-29-triage.md D9; docs/SCRAPE.md
// §18-§20): (a) the tools, the chest and the spinning wheel in the load, (b) leaving before the order on news the family has really
// heard, at the cost of its crop, and (c) foragers who reach a farm where the family stayed taking its goods.
//
// Every test here was seen failing alone against the regression it guards: `npm run test:owner-scrape-injections`
// (docs/evidence/owner-scrape-injections.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { SETTLEMENT_DAYS, advanceFlight, burnByForagers, fleeRefusal, householdAsKnown } from '../sim/scrape.mjs';
import { HOUSEHOLD_SPACE, goodCount } from '../sim/flight-goods.mjs';
import { EARLY_COST, NO_WORD_YET, earlyWord, isEarlyTopic } from '../sim/early-word.mjs';
import { digUpCache } from '../sim/flight-work.mjs';
import { abandonWagon, overtake } from '../sim/road.mjs';
import { burnMinute, farmFate } from '../sim/advance.mjs';
import { learn } from '../sim/knowledge.mjs';
import { flightLine } from '../sim/ending-story.mjs';
import { toolCount } from '../sim/tools.mjs';
import { clearedPlots, keepPlots, sownPlots } from '../sim/fields.mjs';
import { sowPlot } from '../sim/crops.mjs';
import { spring, until } from './support/scrape-spring.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const main = (world, household) => world.entities[household.mainId || household.principalId];
const texts = (world, household) => world.events.filter(event => event.householdId === household.id && event.text).map(event => event.text);
const people = (world, household) => household.members.map(id => world.entities[id]).filter(one => one?.kind === 'person');
const offered = (world, household, person, id) => view(world, household.id).work[person.id]?.find(entry => entry.id === id);

/** The first family, at Gonzales, told to leave on the first tick of the spring, with a chest, a spinning wheel and its tools. */
function ordered(world) {
  const household = world.households['hh-1'];
  household.played = true;
  stepWorld(world);
  assert.equal(household.flight?.status, 'ordered');
  household.belongings = [...new Set([...(household.belongings || []), 'chest', 'spinning-wheel'])];
  household.tools = { hoe: 0, axe: 0, broadaxe: 0 };
  household.resources = { ...household.resources, food: 30, seed: 2, powder: 1, money: 7 };
  return household;
}
/** A family ordered out only weeks later (San Felipe, inside the burn zone), that has heard nothing of the advance yet. */
function later(world) {
  const household = Object.values(world.households).find(one => SETTLEMENT_DAYS[one.settlementId]?.order > world.minute + 5 * 1440 && farmFate(world, one));
  assert.ok(household, 'the class has no family ordered out weeks later inside the burn zone');
  household.played = true;
  for (const id of Object.keys(world.knowledge.households[household.id])) if (isEarlyTopic(id)) delete world.knowledge.households[household.id][id];
  return household;
}
/** Everybody and everything of the family off the road, as if its journey had just ended. */
const offTheRoad = (world, household) => { for (const id of [...household.members, ...(household.property || [])]) { const one = world.entities[id]; if (one?.travel) { one.travel = null; one.location = { ...one.location, siteId: household.homeSiteId }; } } };

// ------------------------------------------------------------------------------------------------ (a) the household goods

test('D9 (a): the card offers the tools, the chest and the spinning wheel with the room each takes, food still packed first', () => {
  const world = spring();
  const household = ordered(world);
  const card = view(world, household.id).flight;
  for (const good of ['hoe', 'axe', 'broadaxe', 'chest', 'spinning-wheel']) {
    assert.equal(card.space[good], HOUSEHOLD_SPACE[good], `${good} is not in the load with its room`);
    assert.equal(card.have[good], 1, `${good} is not counted in the house`);
  }
  assert.equal(card.space.froe, undefined, 'a tool the family has not got is offered');
  assert.equal(card.names['spinning-wheel'], 'spinning wheel');
  assert.equal(card.names.axe, 'felling axe');
  // Food first, then the tools, then the chest and the wheel, as far as the room goes.
  assert.equal(card.packed.take.food, 30, 'the food was not packed first');
  const order = ['hoe', 'axe', 'broadaxe', 'chest', 'spinning-wheel'];
  const packed = order.map(good => card.packed.take[good]);
  assert.ok(packed.every((n, i) => i === 0 || n <= packed[i - 1]), `a later good was packed before an earlier one: ${packed}`);
  assert.equal(fleeRefusal(world, household, { take: card.packed.take, refuge: card.packed.refuge }), null);
  // What it has not got, and more than fits, are refused in words.
  assert.match(fleeRefusal(world, household, { take: { froe: 1 }, refuge: card.packed.refuge }), /has not got a froe/);
  household.resources.food = 400;
  assert.match(fleeRefusal(world, household, { take: { food: Math.floor(card.room * 4) - 3, chest: 1 }, refuge: card.packed.refuge }) || '', /will not fit/);
});

test('D9 (a): what is carried stays the family\'s, what is left is out of its hands in the house, found at home if it stands, lost if it burns', () => {
  const world = spring();
  const household = ordered(world);
  const refuge = view(world, household.id).flight.refuges[0].id;
  applyAction(world, household.id, { action: 'flee', entityId: main(world, household).id, take: { food: 20, hoe: 1, chest: 1 }, refuge });
  validateWorld(world);
  assert.equal(household.flight.status, 'fled');
  assert.deepEqual([toolCount(household, 'hoe'), goodCount(household, 'chest')], [1, 1], 'what was loaded did not go with the family');
  assert.deepEqual([toolCount(household, 'axe'), toolCount(household, 'broadaxe'), goodCount(household, 'spinning-wheel')], [0, 0, 0], 'what was left behind is still in the family\'s hands');
  assert.deepEqual({ axe: household.flight.left.axe, broadaxe: household.flight.left.broadaxe, wheel: household.flight.left['spinning-wheel'] }, { axe: 1, broadaxe: 1, wheel: 1 }, 'what was left is not in the house');
  assert.equal(household.resources.hoe, undefined, 'a tool was written into the stores');
  assert.ok(texts(world, household).some(text => /^The family loaded 20 food, a hoe, the chest and set out/.test(text)), 'the leaving does not say what was loaded');
  // Home to a house the Mexican army never reached: everything left is found again, and what was carried is said.
  const standing = structuredClone(world), home = standing.households[household.id];
  home.flight.status = 'returning'; offTheRoad(standing, home);
  const before = standing.events.length;
  advanceFlight(standing, 60);
  assert.equal(home.flight.status, 'home');
  if (!home.flight.burned) {
    assert.deepEqual([toolCount(home, 'axe'), toolCount(home, 'broadaxe'), goodCount(home, 'spinning-wheel'), toolCount(home, 'hoe'), goodCount(home, 'chest')], [1, 1, 1, 1, 1], 'what was left in the standing house was not found again');
    assert.ok(standing.events.slice(before).some(event => /still there: .*a felling axe.*the spinning wheel/.test(event.text || '')));
  }
  assert.ok(standing.events.slice(before).some(event => event.text === 'They brought home what they had carried all the way: a hoe and the chest.'), 'the homecoming does not say what was carried home');
  validateWorld(standing);
  // Burned by foragers: what was left is lost with the house, and said so; what was carried is untouched.
  burnByForagers(world, household, { columnId: 'sesma' }, { name: 'Sesma\'s column' });
  assert.deepEqual(household.flight.burnedBy.lost.filter(words => !/food|seed|powder|cotton/.test(words)), ['a felling axe', 'a broadaxe', 'the spinning wheel']);
  assert.equal(household.flight.burnedBy.taken, undefined, 'a family that had gone was stripped as a stayer');
  assert.deepEqual([toolCount(household, 'hoe'), goodCount(household, 'chest')], [1, 1], 'what the family carried burned with the house');
  assert.match(flightLine(world, household), /They took a hoe and the chest with them\. A felling axe, a broadaxe, the spinning wheel were left in the house, and burned with it\./);
  validateWorld(world);
});

test('D9 (a): left with the wagon in the mud what the backs cannot carry, taken with it by a column; the chest hidden and dug up', () => {
  const world = spring();
  const household = ordered(world);
  const refuge = view(world, household.id).flight.refuges[0].id;
  // The hiding first: with no powder or seed left over, the tools and the chest go into the river bottom.
  const father = main(world, household);
  applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'flee-hide' });
  until(world, () => !father.chore, 60);
  assert.equal(household.flight.hid, true);
  const mud = structuredClone(world);
  const stores = { food: Math.floor(household.resources.food), seed: Math.floor(household.resources.seed), powder: Math.floor(household.resources.powder) };
  applyAction(world, household.id, { action: 'flee', entityId: father.id, take: { ...stores, hoe: 1, 'spinning-wheel': 1 }, refuge });
  assert.deepEqual(household.flight.cache, { axe: 1, broadaxe: 1, chest: 1 }, 'the tools and the chest left behind were not hidden');
  assert.equal(household.flight.left, undefined, 'what was hidden is left in the house for the fire as well');
  const dug = structuredClone(world), dugHome = dug.households[household.id];
  digUpCache(dug, dugHome);
  assert.deepEqual([toolCount(dugHome, 'axe'), toolCount(dugHome, 'broadaxe'), goodCount(dugHome, 'chest')], [1, 1, 1], 'what was hidden did not come home');
  // The wagon left in the mud: food first on the backs, then the hoe, and the spinning wheel stays with the wagon.
  abandonWagon(world, household);
  assert.equal(goodCount(household, 'spinning-wheel'), 0, 'the spinning wheel was carried on foot');
  assert.ok(texts(world, household).some(text => /left the wagon .*the spinning wheel had to be left with the wagon/.test(text)), 'the family is not told the wheel was left');
  validateWorld(world);
  // Overtaken with its load: the household goods go with the wagon.
  applyAction(mud, household.id, { action: 'flee', entityId: main(mud, mud.households[household.id]).id, take: { food: 10, hoe: 1, chest: 1 }, refuge });
  const caught = mud.households[household.id];
  overtake(mud, caught, { id: 'sesma', toward: refuge });
  assert.deepEqual([toolCount(caught, 'hoe'), goodCount(caught, 'chest')], [0, 0], 'the column left the family its goods');
  validateWorld(mud);
});

// ------------------------------------------------------------------------------------------------ (b) leaving before the order

test('D9 (b): before its order, a family that has heard nothing is refused in plain words, whatever the world knows or another family has heard', () => {
  const world = spring();
  const household = later(world);
  assert.ok(world.truth['alamo-fall'], 'the Alamo has not fallen in this class');
  assert.equal(household.flight, undefined);
  assert.equal(earlyWord(world, household), null);
  assert.equal(fleeRefusal(world, household, { take: {}, refuge: 'lynchburg' }), NO_WORD_YET);
  assert.throws(() => applyAction(world, household.id, { action: 'flee', entityId: main(world, household).id, take: {}, refuge: 'lynchburg' }), /heard nothing yet to make it go: no word of the Alamo’s fall/);
  assert.equal(view(world, household.id).early, undefined, 'the card to leave early was sent without the news');
  const father = main(world, household);
  assert.equal(offered(world, household, father, 'flee-hide'), undefined, 'making ready was offered without the news');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'flee-hide' }), /heard nothing yet/);
  // Another family's hearing is not this one's.
  const other = Object.values(world.households).find(one => one.id !== household.id);
  learn(world, other.id, 'alamo-fall', { status: 'confirmed', source: 'test' });
  assert.equal(earlyWord(world, household), null, 'another family\'s news let this one go');
  // A rumour is not enough.
  learn(world, household.id, 'alamo-fall', { status: 'rumor', source: 'test' });
  assert.equal(fleeRefusal(world, household, { take: {}, refuge: 'lynchburg' }), NO_WORD_YET, 'a rumour let the family go');
});

test('D9 (b): on real news the family is told once, may make ready, and may leave early - losing the crop in the field, the house left empty', () => {
  const world = spring();
  const household = later(world);
  household.field = { ...household.field, crop: 'corn', state: 'planted', grownMs: 1000, changedTick: world.tick };
  learn(world, household.id, 'alamo-fall', { status: 'unconfirmed', source: 'A rider from Gonzales' });
  stepWorld(world); stepWorld(world);
  const told = texts(world, household).filter(text => /may make ready and go now, before any order comes/.test(text));
  assert.equal(told.length, 1, 'the family was not told once that it may go');
  const card = view(world, household.id).early;
  assert.ok(card, 'no card to leave early');
  assert.equal(view(world, household.id).flight, undefined, 'a family with no order was sent a flight');
  assert.equal(card.status, 'early');
  assert.equal(card.cost, EARLY_COST);
  assert.equal(card.crop, 'corn');
  assert.ok(card.packed?.take && card.refuges.length, 'the early card has no load or refuge');
  // Making ready: the hiding is offered, and its mark waits for the flight.
  const father = main(world, household);
  assert.equal(offered(world, household, father, 'flee-hide')?.can, true, 'making ready was not offered on the news');
  applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'flee-hide' });
  until(world, () => !father.chore, 60);
  assert.equal(household.readying?.hid, true, 'the hiding left no mark before the flight');
  validateWorld(world);
  const leaving = structuredClone(world);
  // Its order comes: what it made ready goes onto the flight.
  until(world, () => household.flight, 4000);
  assert.equal(household.flight.status, 'ordered');
  assert.equal(household.flight.hid, true, 'what the family made ready before its order was lost at the order');
  assert.equal(household.readying, undefined);
  // Or it goes early: the crop lost, the flight marked, no order ever given it, the house open to the foragers from the minute it went.
  const early = leaving.households[household.id];
  const refuge = view(leaving, early.id).early.packed.refuge;
  // As the page sends it: with a route of the family's own (sim/flight-route.mjs), which a family with no flight may set as it leaves.
  applyAction(leaving, early.id, { action: 'flee', entityId: main(leaving, early).id, take: { food: 0 }, refuge, route: { stops: [refuge], ways: ['road'] } });
  assert.equal(early.flight.status, 'fled');
  assert.equal(early.flight.hid, true, 'what the family made ready did not go onto its flight');
  assert.equal(early.flight.early?.topicId, 'alamo-fall');
  assert.equal(early.flight.early.crop, 'corn');
  assert.equal(early.field.state, 'bare', 'the crop was not lost');
  assert.equal(early.flight.orderedMinute, undefined, 'the family leaving early was given an order');
  assert.ok(texts(leaving, early).some(text => /going before any order comes.*The corn in the field is left standing .* and is lost\. The house is left empty/.test(text)));
  assert.equal(burnMinute(leaving, early) >= early.flight.early.minute, true, 'the empty house is never reached by the foragers');
  until(leaving, () => leaving.minute > SETTLEMENT_DAYS[early.settlementId].order + 1440, 4000);
  assert.equal(early.flight.orderedMinute, undefined, 'the settlement\'s order came to a family already gone');
  assert.match(flightLine(leaving, early), /They went before any order came, on the word they had heard, and lost the corn in the field\./);
  validateWorld(leaving);
});

test('D9 (b) with each plot its own crop: leaving early loses every plot standing, corn and cotton both, and says so', () => {
  const world = spring();
  const household = later(world);
  // Two cleared plots, laid out from the family's field as a class saved before plots were written down would have them.
  delete household.plots;
  household.field = { ...household.field, state: 'bare', cleared: 2 };
  keepPlots(world, household);
  const plots = clearedPlots(household);
  assert.ok(plots.length >= 2, 'the family has too few cleared plots to plant two crops');
  plots.forEach((plot, index) => sowPlot(plot, index % 2 ? 'cotton' : 'corn'));
  learn(world, household.id, 'alamo-fall', { status: 'unconfirmed', source: 'A rider from Gonzales' });
  stepWorld(world); stepWorld(world);
  assert.equal(view(world, household.id).early?.crop, 'corn and cotton', 'the early card named one crop of a mixed field');
  const refuge = view(world, household.id).early.packed.refuge;
  applyAction(world, household.id, { action: 'flee', entityId: main(world, household).id, take: { food: 0 }, refuge, route: { stops: [refuge], ways: ['road'] } });
  assert.equal(household.flight.early?.crop, 'corn and cotton');
  assert.deepEqual(sownPlots(household), [], 'a plot of the crop was left standing when the family went early');
  assert.equal(household.field.state, 'bare');
  assert.ok(texts(world, household).some(text => /The corn and cotton in the field is left standing .* and is lost\./.test(text)));
  validateWorld(world);
});

test('D9 (b): the news of the Mexican army\'s advance counts - a column come to a place, a town burned - and Houston\'s own movements do not', () => {
  const world = spring();
  const household = later(world);
  world.truth['houston-colorado'] ??= { id: 'houston-colorado', text: 'x', minute: world.minute, eventId: null };
  learn(world, household.id, 'houston-colorado', { status: 'confirmed', source: 'test' });
  assert.equal(earlyWord(world, household), null, 'the Texas army\'s movements let the family go');
  world.truth['column:test'] ??= { id: 'column:test', text: 'Sesma\'s column has come to Gonzales.', minute: world.minute, eventId: null };
  learn(world, household.id, 'column:test', { status: 'unconfirmed', source: 'test' });
  assert.equal(earlyWord(world, household)?.topicId, 'column:test', 'word of a column did not let the family go');
});

// ------------------------------------------------------------------------------------------------ (c) staying

test('D9 (c): foragers who reach a farm where the family stayed take its stores and household goods, not its coin, and it is told plainly', () => {
  const world = spring();
  const household = ordered(world);
  household.resources.cotton = 4;
  applyAction(world, household.id, { action: 'flight-stay', entityId: main(world, household).id });
  const home = people(world, household).filter(one => one.location?.siteId === household.homeSiteId && !one.travel);
  assert.ok(home.length, 'nobody is at home');
  burnByForagers(world, household, { columnId: 'sesma' }, { name: 'Sesma\'s column' });
  validateWorld(world);
  assert.deepEqual({ food: household.resources.food, seed: household.resources.seed, powder: household.resources.powder, cotton: household.resources.cotton }, { food: 0, seed: 0, powder: 0, cotton: 0 }, 'the foragers left the stayer its stores');
  assert.equal(household.resources.money, 7, 'the foragers took the coin');
  assert.deepEqual(['hoe', 'axe', 'broadaxe'].map(tool => toolCount(household, tool)), [0, 0, 0], 'the foragers left the tools');
  assert.deepEqual([goodCount(household, 'chest'), goodCount(household, 'spinning-wheel')], [0, 0], 'the foragers left the chest and the wheel');
  assert.deepEqual(household.flight.burnedBy.taken, ['30 food', '2 seed', '4 cotton', '1 powder', 'a hoe', 'a felling axe', 'a broadaxe', 'the chest', 'the spinning wheel']);
  assert.ok(texts(world, household).some(text => /Before they burned it they took everything in the house: 30 food, .*the spinning wheel\./.test(text)), 'the family was not told what the foragers took');
  assert.match(flightLine(world, household), /stayed on the farm\. On .* burned it\. They took everything in the house first: 30 food/);
});

test('D9 (c): a stayer with nobody at home sees its goods where they were until the word comes; the world has them gone', () => {
  const world = spring();
  const household = ordered(world);
  applyAction(world, household.id, { action: 'flight-stay', entityId: main(world, household).id });
  for (const one of people(world, household)) one.location = { x: 0, y: 0, siteId: 'san-felipe' };
  burnByForagers(world, household, { columnId: 'sesma' }, { name: 'Sesma\'s column' });
  validateWorld(world);
  assert.equal(household.resources.food, 0);
  assert.equal(toolCount(household, 'axe'), 0);
  const known = householdAsKnown(household);
  assert.equal(known.resources.food, 30, 'the family saw its food gone before it knew');
  assert.equal(toolCount(known, 'axe'), 1, 'the family saw its axe gone before it knew');
  assert.equal(goodCount(known, 'chest'), 1, 'the family saw its chest gone before it knew');
  const shown = view(world, household.id);
  assert.equal(shown.household.resources.food, 30, 'the page was sent the stores the foragers took');
  assert.ok(shown.toolCondition?.axe || shown.household.tools?.axe !== undefined, 'the page was sent the tools gone');
  assert.equal(toolCount(household, 'axe'), 0, 'reading the family\'s view changed the world');
});

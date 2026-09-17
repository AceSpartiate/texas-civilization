// Money, steps 1 and 2 of docs/MONEY_AND_GLORY.md.
//
// Coin is a thing a family holds and trades, counted in whole reales, and nobody starts with
// any. The store deals in it at the counter: a bale fetches two food or one real, five food
// fetch one real, powder and seed can be paid for either way, and a new hoe is coin only. The
// shape is documented - coin was scarce enough in Mexican Texas that not ten transactions in a
// hundred used it (`HIST-GONZ-023`) - and every number is invented (`FIC-GONZ-022`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, stepWorld, projectWorld, validateWorld } from '../sim/world.mjs';
import { COIN, COTTON_RATE, choreAvailability, choresFor } from '../sim/chores.mjs';
import { makeOffer, respondToOffer, describeGoods } from '../sim/trade.mjs';

const running = (seed = 'money') => { const world = createSettledWorld(seed, 5); world.status = 'running'; return world; };
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
/** Send somebody on a chore and run until they are asked something at the counter, or finish. */
function toCounter(world, householdId, entityId, chore) {
  applyAction(world, householdId, { action: 'chore', entityId, chore });
  const person = world.entities[entityId];
  for (let tick = 0; tick < 400 && person.chore && !person.chore.ask; tick++) stepWorld(world);
  return person;
}
function finish(world, person) { for (let tick = 0; tick < 400 && person.chore; tick++) stepWorld(world); }

test('coin is whole reales, changes hands face to face, and a class saved before it opens', () => {
  const world = running('coin-trade');
  const [one, two] = Object.values(world.households);
  one.resources.money = 5;
  const a = world.entities[one.principalId], b = world.entities[two.principalId];
  for (const person of [a, b]) person.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  const offer = makeOffer(world, one.id, a, { toEntityId: b.id, give: { money: 2 }, ask: { seed: 1 } });
  assert.equal(describeGoods(offer.give), '2 reales');
  assert.equal(describeGoods({ money: 1 }), '1 real');
  respondToOffer(world, two.id, b, 'accept-offer', offer.id);
  assert.equal(one.resources.money, 3);
  assert.equal(two.resources.money, 2);
  assert.throws(() => makeOffer(world, one.id, a, { toEntityId: b.id, give: { money: 1.5 }, ask: { seed: 1 } }), /whole/);
  validateWorld(world);
  one.resources.money = 2.5;
  assert.throws(() => validateWorld(world), /whole reales/);
  // No save version moves: a household with no coin at all is a household with none.
  const old = running('old-coin');
  for (const household of Object.values(old.households)) delete household.resources.money;
  validateWorld(old);
  for (let tick = 0; tick < 30; tick++) stepWorld(old);
  validateWorld(old);
});

test('cotton is sold at the counter for food or for coin, and coin only for whole bales', () => {
  for (const answer of ['food', 'coin']) {
    const world = running(`cotton-${answer}`);
    const household = Object.values(world.households)[0];
    household.resources.cotton = 3.6;
    const person = toCounter(world, household.id, household.members[1], 'sell-cotton');
    const asked = view(world, household.id).entities.find(e => e.id === person.id).chore.ask;
    assert.deepEqual(asked.options.map(option => option.id), ['food', 'coin', 'leave']);
    const food = household.resources.food;
    applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: answer });
    finish(world, person);
    if (answer === 'food') {
      assert.equal(household.resources.money, 0);
      assert.ok(household.resources.food > food + 3.6 * COTTON_RATE - 2, 'food for the cotton, as it always was');
      assert.equal(household.resources.cotton, 0);
    } else {
      assert.equal(household.resources.money, 3 * COIN.cottonBale, 'three whole bales, three reales');
      assert.ok(Math.abs(household.resources.cotton - 0.6) < 1e-9, 'the part of a bale the store would not pay coin for came home');
    }
    validateWorld(world);
  }
});

test('powder and seed can be paid for in food or coin, and nobody answering pays whichever the family can', () => {
  const world = running('pay');
  const household = Object.values(world.households)[0];
  household.resources.money = 2;
  household.resources.powder = 0;
  const person = toCounter(world, household.id, household.members[1], 'fetch-powder');
  const food = household.resources.food;
  applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: 'coin' });
  finish(world, person);
  assert.equal(household.resources.money, 2 - COIN.powder);
  assert.ok(household.resources.powder > 0, 'no powder came home');
  assert.ok(household.resources.food >= food - 1, 'coin paid for it, not food');

  // No food to pay with, a real in the house, and nobody answers: the coin pays.
  const poor = running('pay-poor');
  const family = Object.values(poor.households)[0];
  family.resources.money = 1;
  family.resources.food = 0.5;
  assert.equal(choreAvailability(poor, family, poor.entities[family.members[1]], 'fetch-seed').can, true, 'a real is enough to set out');
  const buyer = toCounter(poor, family.id, family.members[1], 'fetch-seed');
  const counter = view(poor, family.id).entities.find(e => e.id === buyer.id).chore.ask;
  assert.equal(counter.options.find(option => option.id === 'food').can, false, 'food is offered that the house does not have');
  finish(poor, buyer);
  assert.equal(family.resources.money, 0, 'nobody answered, and the coin paid rather than leaving with nothing');
  assert.ok(family.resources.seed > 2);

  // Neither food nor coin: the work is not offered at all, and it says what it costs.
  family.resources.food = 0;
  family.resources.money = 0;
  const refused = choreAvailability(poor, family, poor.entities[family.members[1]], 'fetch-powder');
  assert.equal(refused.can, false);
  assert.match(refused.why, /2 food or 1 real/);
});

test('a new hoe is coin only, and mending the old one at home still costs none', () => {
  const world = running('hoe');
  const household = Object.values(world.households)[0];
  household.tools.hoe = 999;
  const person = world.entities[household.members[0]];
  const refused = choreAvailability(world, household, person, 'replace-hoe');
  assert.equal(refused.can, false, 'a hoe was bought without coin');
  assert.match(refused.why, /2 reales/);
  assert.ok(choresFor(world, household, person).some(chore => chore.id === 'mend-hoe'), 'mending at home is still on offer');
  assert.doesNotMatch(choreAvailability(world, household, person, 'mend-hoe').why, /coin|real/);
  household.resources.money = COIN.hoe;
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'replace-hoe' });
  finish(world, person);
  assert.equal(household.resources.money, 0);
  assert.equal(household.tools.hoe, 0, 'a sound hoe came home');
});

test('food can be sold for coin, in whole reales, and what is left over stays in the house', () => {
  // On foot a person carries five: the store buys the five for a real (five food a real, docs/MONEY_AND_GLORY.md §8.1).
  const walked = running('sell-food-foot');
  const walker = Object.values(walked.households)[0];
  walker.resources.food = 12;
  const onFoot = toCounter(walked, walker.id, walker.members[1], 'sell-food');
  finish(walked, onFoot);
  assert.equal(walker.resources.money, 1, 'five carried, five sold, one real');
  assert.ok(walked.events.some(event => /sold 5 food at the store and brought home 1 real\./.test(event.text)));

  // On the horse, seven: five sold, one real, and two come home.
  const world = running('sell-food-horse');
  const household = Object.values(world.households)[0];
  household.resources.food = 12;
  const rider = household.members[1];
  applyAction(world, household.id, { action: 'chore', entityId: rider, chore: 'sell-food', mode: 'horse' });
  finish(world, world.entities[rider]);
  assert.equal(household.resources.money, 1, 'seven carried, five sold, one real');
  assert.ok(world.events.some(event => /sold 5 food at the store and brought home 1 real\./.test(event.text)));
});

test('a family that never touches a coin still farms, hunts and buys what it needs with food', () => {
  const world = running('barter');
  const household = Object.values(world.households)[0];
  const person = world.entities[household.members[1]];
  const open = choresFor(world, household, person).filter(chore => chore.can).map(chore => chore.id);
  for (const id of ['plant-field', 'hunt-timber', 'fetch-seed', 'fetch-powder', 'fence-plot']) assert.ok(open.includes(id), `${id} needs coin`);
  const buyer = toCounter(world, household.id, person.id, 'fetch-seed');
  // Paying in coin that is not in the house would be seed for nothing: the answer is closed, and refused if pressed.
  const coin = view(world, household.id).entities.find(e => e.id === buyer.id).chore.ask.options.find(option => option.id === 'coin');
  assert.equal(coin.can, false);
  assert.match(coin.why, /no coin/);
  assert.throws(() => applyAction(world, household.id, { action: 'answer-chore', entityId: buyer.id, option: 'coin' }), /no coin/);
  applyAction(world, household.id, { action: 'answer-chore', entityId: buyer.id, option: 'food' });
  finish(world, buyer);
  assert.equal(household.resources.money, 0);
  assert.ok(household.resources.seed > 2, 'seed bought with food');
});

test('the store buys food and cotton for coin whatever its purse holds, pays everything else from it, and coin paid in goes back into it', () => {
  // The owner chose a limited purse: coin was scarce enough that a storekeeper had little of it
  // (`HIST-GONZ-023`), and a family finds out at the counter rather than before it sets out.
  const world = running('purse');
  const marta = world.entities['town-ibarra'];
  assert.equal(marta.purse, 2 * world.playerCount, 'the store starts with two reales a family');
  marta.purse = 0;
  const [first, second, third] = Object.values(world.households);
  first.resources.food = 12;
  // On the horse, seven carried: five sold for a real, and the empty purse does not stop it (owner, 2026-09-16,
  // docs/MONEY_AND_GLORY.md §8.1): the store ships the corn on its own credit.
  applyAction(world, first.id, { action: 'chore', entityId: first.members[1], chore: 'sell-food', mode: 'horse' });
  const seller = world.entities[first.members[1]];
  finish(world, seller);
  assert.equal(first.resources.money, 1, 'an empty purse stopped the food sale');
  assert.equal(marta.purse, 0);

  // Cotton is the owner's exception (2026-09-16, docs/COLONIES.md §7e): the store buys a family's whole crop for coin,
  // however little is in the purse, so a family that stays home can sell what it grew.
  second.resources.cotton = 4;
  const next = toCounter(world, second.id, second.members[1], 'sell-cotton');
  const coin = view(world, second.id).entities.find(e => e.id === next.id).chore.ask.options.find(option => option.id === 'coin');
  assert.equal(coin.can, true, 'an empty purse refused to buy cotton');
  applyAction(world, second.id, { action: 'answer-chore', entityId: next.id, option: 'coin' });
  finish(world, next);
  assert.ok(second.resources.money >= 3, `the cotton carried was not all bought: ${second.resources.money}`);
  assert.equal(marta.purse, 0, 'buying cotton drew on the purse');

  // Coin a family pays in is in the purse, and can be paid out again.
  third.resources.money = 1;
  third.resources.food = 0;
  const buyer = toCounter(world, third.id, third.members[1], 'fetch-seed');
  applyAction(world, third.id, { action: 'answer-chore', entityId: buyer.id, option: 'coin' });
  finish(world, buyer);
  assert.equal(marta.purse, 1, 'the real paid for seed went into the purse');

  // Nobody sees the purse: it is the store's business.
  for (const householdId of Object.keys(world.households)) assert.doesNotMatch(JSON.stringify(view(world, householdId)), /"purse"/);
  assert.doesNotMatch(JSON.stringify(projectWorld(world, undefined, 'host', { includeMap: false })), /"purse"/);
  validateWorld(world);

  // A class saved before the purse opens with one, filled when it is first needed and not before.
  const old = running('old-purse');
  const oldFamily = Object.values(old.households)[0];
  oldFamily.resources.cotton = 2;
  const atCounter = toCounter(old, oldFamily.id, oldFamily.members[1], 'sell-cotton');
  delete old.entities['town-ibarra'].purse;
  validateWorld(old);
  // Drawing the counter reads the purse; it must not also fill it in.
  const drawn = view(old, oldFamily.id).entities.find(e => e.id === atCounter.id).chore.ask.options.find(option => option.id === 'coin');
  assert.equal(drawn.can, true, 'a class saved before the purse still has coin to pay out');
  assert.equal(old.entities['town-ibarra'].purse, undefined, 'drawing a screen changed the world');
});

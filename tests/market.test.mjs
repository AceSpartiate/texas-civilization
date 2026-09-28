// The limited market (owner, 2026-09-28, by multiple choice on docs/audits/2026-09-28-design.md B9: "Seasons and a limited market";
// sim/market.mjs). Each town's store - and its weaver - wants so much cotton and food for every family near it, pays full price
// while it holds less than half of that, half price from half to full, and nothing when full; it sells on a month's want in a
// month of the calendar. Every family of the town sells into the same store, by the errand, the counter and the director's own
// errands. Invented to the last number (`FIC-GONZ-722`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld, modestMeans, taught } from './support/settled.mjs';
import { applyAction, errandFor, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { TRADES } from '../sim/shops.mjs';
import { MARKET, SELLS_ON_DAYS, familiesAt, heldAt, marketRefusal, marketSale, recordSale, tierAt, wantAt } from '../sim/market.mjs';
import { thinkFor } from '../sim/neighbours.mjs';

const DAY = 1440;
const offer = (trade, good) => TRADES[trade].offers.find(one => one.kind === 'buy' && one.good === good);
function running(seed) {
  const world = modestMeans(taught(createSettledWorld(seed, 5)));
  world.status = 'running';
  world.households['hh-1'].played = true;
  return world;
}
const send = (world, who, errand, householdId = 'hh-1') => applyAction(world, householdId, { action: 'chore', entityId: who.id, chore: 'visit-shop', errand });
const finish = (world, who) => { for (let t = 0; t < 900 && who.chore; t++) stepWorld(world); assert.equal(who.chore, null, `${who.name} never finished`); };
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });

test('the price curve: full price to half the want, half price to the want, and then nothing', () => {
  const world = running('market-curve');
  const town = 'gonzales';
  assert.equal(familiesAt(world, town), 5);
  assert.equal(wantAt(world, town, 'store:cotton'), MARKET['store:cotton'].want * 5);
  assert.deepEqual([tierAt(0, 20), tierAt(9.9, 20), tierAt(10, 20), tierAt(19.9, 20), tierAt(20, 20)], [0, 0, 1, 1, -1]);
  // Cotton: twenty bales wanted in a town of five families - ten at two reales, ten at one, and not a bale more.
  const cotton = offer('store', 'cotton');
  const all = marketSale(world, town, 'store', cotton, 30, 'coin');
  assert.deepEqual(all, { sold: 20, got: 10 * 2 + 10 * 1, lots: 20, full: true });
  // Paid in food: two food a bale, then one.
  assert.deepEqual(marketSale(world, town, 'store', cotton, 12, 'food'), { sold: 12, got: 10 * 2 + 2 * 1, lots: 12, full: false });
  // Food for coin: a real for five to seventy-five, then a real for ten; a hundred and fifty wanted, and the last lot taken
  // while there was room for part of it.
  const food = offer('store', 'food');
  assert.deepEqual(marketSale(world, town, 'store', food, 200, 'coin'), { sold: 155, got: 15 + 8, lots: 23, full: true });
  // The weaver wants its own, smaller share and pays its own prices.
  const weaver = marketSale(world, town, 'weaver', offer('weaver', 'cotton'), 30, 'food');
  assert.equal(weaver.sold, MARKET['weaver:cotton'].want * 5);
  assert.equal(weaver.got, 5 * 3 + 5 * 1.5);
  // Nothing here moved anything: a quote is only a quote.
  assert.equal(world.markets, undefined);
});

test('what the store holds is written when it buys, and sold on over the calendar: a month clears what it wants', () => {
  const world = running('market-drain');
  const town = 'gonzales', want = wantAt(world, town, 'store:cotton');
  recordSale(world, town, 'store', 'cotton', want);
  assert.equal(heldAt(world, town, 'store:cotton'), want);
  assert.match(marketRefusal(world, town, 'store', 'cotton'), /has all the cotton it can use/);
  // Half a month later it holds half, and pays half price again.
  assert.equal(heldAt(world, town, 'store:cotton', world.minute + SELLS_ON_DAYS * DAY / 2), want / 2);
  assert.equal(heldAt(world, town, 'store:cotton', world.minute + SELLS_ON_DAYS * DAY), 0);
  world.minute += SELLS_ON_DAYS * DAY / 2 + DAY;
  assert.equal(marketRefusal(world, town, 'store', 'cotton'), null, 'the store never sold anything on');
  validateWorld(world);
  // What a save may hold: a market of a town that is there, of goods a shop buys, held and minute never below nothing.
  for (const bad of [{ nowhere: { 'store:cotton': { held: 1, minute: 0 } } }, { gonzales: { 'store:seed': { held: 1, minute: 0 } } }, { gonzales: { 'store:cotton': { held: -1, minute: 0 } } }]) {
    const copy = structuredClone(world); copy.markets = bad;
    assert.throws(() => validateWorld(copy), /Invalid market/);
  }
  const old = running('market-old');
  delete old.markets;
  validateWorld(old);
});

test('the errand to town: a list is quoted at the store\'s price as it fills, and what it cannot use comes home', () => {
  const world = running('market-errand');
  const family = world.households['hh-1'];
  family.resources = { ...family.resources, cotton: 18, money: 0 };
  const town = 'gonzales', want = wantAt(world, town, 'store:cotton');
  // The store already holds all but four bales of what it wants: two at half price, and then none.
  recordSale(world, town, 'store', 'cotton', want - 4);
  const who = world.entities['hh-1-rosa'] || world.entities[family.members[0]];
  const listed = errandFor(world, 'hh-1', who.id, []).lines.find(line => line.id === 'store:cotton');
  assert.match(listed.price, /pays 1 real or 1 food for 1 bale/, `the list does not show the store's price now: ${listed.price}`);
  assert.match(listed.does, /filling up: half price for about 4 bales more/);
  const quoted = errandFor(world, 'hh-1', who.id, [{ id: 'store:cotton', n: 6, pay: 'coin' }]).quote;
  assert.equal(quoted.can, true, quoted.why);
  assert.equal(quoted.lines[0].gives, '4 reales');
  assert.match(quoted.lines[0].back, /2 cotton would come home/);
  send(world, who, [{ id: 'store:cotton', n: 6, pay: 'coin' }]);
  finish(world, who);
  // The store sells on while the person is on the road (a little over half a day's worth here), so it may take one bale more
  // than it had room for when the list was sent: every bale at half price, and the rest home again.
  assert.ok(family.resources.cotton >= 13 && family.resources.cotton <= 14, `the bales the store would not take did not come home: ${family.resources.cotton}`);
  assert.equal(family.resources.money, 18 - family.resources.cotton, 'the store paid other than a real a bale, or for more than it took');
  assert.ok(world.events.some(event => event.householdId === 'hh-1' && /has all the cotton it can use.*came home again/.test(event.text)), 'the story does not say why the rest came home');
  // Full now: the list shuts the line in the store's own words, and the order is refused before anybody goes.
  const shut = errandFor(world, 'hh-1', who.id, []).lines.find(line => line.id === 'store:cotton');
  assert.match(shut.why, /has all the cotton it can use/);
  assert.throws(() => send(world, who, [{ id: 'store:cotton', n: 1, pay: 'coin' }]), /has all the cotton it can use/);
  validateWorld(world);
});

test('one store for the whole town: a neighbour\'s sale lowers what the next family is paid, and the director\'s errand stops at a full store', () => {
  const world = running('market-shared');
  const [one, two] = ['hh-1', 'hh-2'].map(id => world.households[id]);
  const town = 'gonzales', want = wantAt(world, town, 'store:cotton');
  // The second family, which nobody plays, sells half the town's want by the director's own errand: full price.
  two.resources.cotton = want / 2 + 2;
  const seller = world.entities[two.members[1]] || world.entities[two.members[0]];
  applyAction(world, two.id, { action: 'chore', entityId: seller.id, chore: 'sell-cotton', mode: 'wagon' });
  for (let t = 0; t < 900 && seller.chore; t++) { if (seller.chore?.ask) applyAction(world, two.id, { action: 'answer-chore', entityId: seller.id, option: 'coin' }); stepWorld(world); }
  assert.ok(heldAt(world, town, 'store:cotton') >= want / 2, `the director's sale was not the store's: ${heldAt(world, town, 'store:cotton')}`);
  // The student's family now finds the store filling: a real a bale, not two.
  const who = world.entities[one.members[0]];
  const listed = errandFor(world, 'hh-1', who.id, []).lines.find(line => line.id === 'store:cotton');
  assert.match(listed.price, /pays 1 real/, 'a neighbour\'s sale did not lower the price');
  // Filled to the brim: the director's own errand is refused in the store's words, and the director does not send it.
  recordSale(world, town, 'store', 'cotton', want);
  two.resources.cotton = 5;
  // The director's own errands are listed for a family it runs (sim/chores.mjs `directed`).
  world.neighbours = true;
  const offered = view(world, two.id).work[seller.id].find(work => work.id === 'sell-cotton');
  assert.equal(offered?.can, false);
  assert.match(offered.why, /has all the cotton it can use/);
  const sent = [];
  thinkFor(world, two, { project: id => view(world, id), act: input => { sent.push(input.chore || input.action); return true; } });
  assert.ok(!sent.includes('sell-cotton'), 'the director sent cotton to a full store');
});

// A family nobody plays buys a rifle again (owner, 2026-09-24: "have automatic families buy a replacement rifle"; docs/TOWNS.md
// §4e, sim/neighbours.mjs `rifleErrand`).
//
// Held here: with no rifle left and somebody free, the director sends one person on the student's own errand to the nearest
// gunsmith - the family's own town when it has one, else the nearest by road - and the rifle comes home; it pays in food only
// above the floor it keeps, else in coin, and never on credit; it does not send anybody while the family still owns a rifle
// (one away at the war included), while nobody is free, or a second person while one is on the way. Nothing in it is drawn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld, settle } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { mouthsAt, rifleErrand, rifleFloor, thinkFor } from '../sim/neighbours.mjs';
import { tooYoung } from '../sim/family.mjs';
import { RIFLE_COIN, RIFLE_FOOD, tradesAt } from '../sim/shops.mjs';
import { toolCount } from '../sim/tools.mjs';
import { takeToWar } from '../sim/keeping.mjs';
import { findWay } from '../sim/ways.mjs';

/** A class of families nobody plays, on their land; hh-2 has lost its rifle. */
function neighbours(seed, { food = null, money = 0 } = {}) {
  const world = createSettledWorld(seed, 5);
  world.neighbours = true;
  world.status = 'running';
  const family = world.households['hh-2'];
  family.rifles = 0;
  family.resources = { ...family.resources, food: food ?? rifleFloor(mouthsAt(world, family)) + RIFLE_FOOD + 1, money };
  return { world, family };
}
const think = (world, family) => thinkFor(world, family, { project: id => projectWorld(world, id, 'student', { includeMap: false }), act: input => applyAction(world, family.id, input) });
const rifleTrips = tried => tried.filter(input => input.chore === 'visit-shop' && input.errand?.some(line => line.id === 'gunsmith:buy-rifle'));

test('with no rifle left and somebody free, one person goes to the gunsmith on the errand a student sends, and the rifle comes home', () => {
  const { world, family } = neighbours('rebuy-goes');
  const food = family.resources.food;
  const trips = rifleTrips(think(world, family));
  assert.equal(trips.length, 1, 'nobody, or more than one, was sent for the rifle');
  assert.deepEqual(trips[0].errand, [{ id: 'gunsmith:buy-rifle', n: 1, pay: 'food' }]);
  const buyer = world.entities[trips[0].entityId];
  assert.equal(buyer.chore.id, 'visit-shop');
  assert.equal(buyer.chore.town, undefined, 'the family\'s own town has a gunsmith, and it was sent elsewhere');
  for (let t = 0; t < 900 && buyer.chore; t++) stepWorld(world);
  assert.equal(toolCount(family, 'rifle'), 1, 'the rifle did not come home');
  assert.ok(family.resources.food <= food - RIFLE_FOOD + 1e-9, 'the rifle was not paid for');
  assert.ok(world.events.some(e => e.householdId === family.id && /bought a rifle from the gunsmith; the family has a rifle again/.test(e.text)));
  validateWorld(world);
});

test('it pays in food only above the floor it keeps, else in coin, and never on credit', () => {
  const floor = w => rifleFloor(mouthsAt(w, w.households['hh-2']));
  // One food short of the rifle above the floor, and no coin: nobody goes.
  let { world, family } = neighbours('rebuy-floor');
  family.resources.food = floor(world) + RIFLE_FOOD - 1;
  assert.equal(rifleTrips(think(world, family)).length, 0, 'the family spent itself below its floor for a rifle');
  // The same, with the coin for it: it pays in coin.
  ({ world, family } = neighbours('rebuy-floor'));
  family.resources.food = floor(world) + RIFLE_FOOD - 1;
  family.resources.money = RIFLE_COIN;
  const trips = rifleTrips(think(world, family));
  assert.equal(trips.length, 1);
  assert.equal(trips[0].errand[0].pay, 'coin');
  // A real short, and nothing to spare in food: nobody goes.
  ({ world, family } = neighbours('rebuy-floor'));
  family.resources.food = floor(world);
  family.resources.money = RIFLE_COIN - 1;
  // The director's own decision, not only the server's refusal of it: it does not try.
  assert.equal(rifleErrand(world, family, projectWorld(world, family.id, 'student', { includeMap: false }), mouthsAt(world, family)), null, 'the director meant to buy the rifle on credit');
  assert.equal(rifleTrips(think(world, family)).length, 0, 'the rifle was bought on credit');
});

test('nobody is sent while the family still owns a rifle, one at the war included, nor while nobody is free, nor twice', () => {
  // A rifle in the house.
  let { world, family } = neighbours('rebuy-not');
  delete family.rifles;
  assert.equal(rifleTrips(think(world, family)).length, 0, 'a family with its rifle went for another');
  // Its one rifle away at the war with a man, who will bring it home.
  ({ world, family } = neighbours('rebuy-not'));
  family.rifles = 1;
  const soldier = world.entities[family.members[0]];
  soldier.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  takeToWar(world, family, soldier, 'gone with the volunteers to Gonzales');
  assert.equal(rifleTrips(think(world, family)).length, 0, 'a family whose rifle is at the war went for another');
  // Nobody free: every grown hand already at work.
  ({ world, family } = neighbours('rebuy-not'));
  for (const id of family.members) world.entities[id].chore = { id: 'mend-hoe', step: 1, wait: 50, doing: 'mending the hoe' };
  assert.equal(rifleTrips(think(world, family)).length, 0, 'somebody at work was sent for the rifle');
  // One sent of the grown hands free, and not a second while the first is on the way. Paid in coin, so neither needs the wagon
  // (sixteen food is sixteen loads to carry to town) and nothing but the rule keeps a second at home.
  ({ world, family } = neighbours('rebuy-floor', { food: 0, money: 2 * RIFLE_COIN }));
  const free = family.members.map(id => world.entities[id]).filter(one => !tooYoung(one) && !one.chore && !one.travel);
  assert.ok(free.length >= 2, 'fewer than two grown hands are free, so this proves nothing about sending one');
  assert.equal(rifleTrips(think(world, family)).length, 1, 'more than one was sent for one rifle');
  stepWorld(world);
  assert.equal(rifleTrips(think(world, family)).length, 0, 'a second person was sent for the same rifle');
  validateWorld(world);
});

test('a family whose town has no gunsmith goes to the nearest town that has one, by the road', () => {
  const world = settle(createGonzalesWorld('rebuy-far', 15, { map: 'colonies', neighbours: true }));
  world.status = 'running';
  const family = Object.values(world.households).find(one => !tradesAt(world, one.settlementId || 'gonzales').includes('gunsmith'));
  assert.ok(family, 'every family lives by a gunsmith, so this proves nothing');
  // Its house stands on the surveyor's mark, so nobody walks to a new site first.
  delete family.choosingSite;
  family.rifles = 0;
  family.resources = { ...family.resources, food: rifleFloor(mouthsAt(world, family)) + RIFLE_FOOD + 1 };
  const towns = Object.keys(world.map.sites).filter(id => tradesAt(world, id).includes('gunsmith'));
  const nearest = towns.map(id => ({ id, miles: findWay(world, family.homeSiteId, id, 'foot')?.distance ?? Infinity })).sort((a, b) => a.miles - b.miles)[0].id;
  const trips = rifleTrips(think(world, family));
  assert.equal(trips.length, 1, 'nobody was sent for the rifle');
  assert.equal(trips[0].town, nearest);
  const buyer = world.entities[trips[0].entityId];
  assert.equal(buyer.chore.town, nearest);
  assert.equal(buyer.travel?.to, nearest, 'the errand did not go to the gunsmith\'s town');
  validateWorld(world);
});

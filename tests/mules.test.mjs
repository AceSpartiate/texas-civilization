// A mule bought in town (owner, 2026-10-03: "we should also add the ability to buy a mule in town. mules were a lot cheaper than
// horses."; docs/TOWNS.md §4h, sim/beasts.mjs, `FIC-GONZ-1110` on `HIST-TEX-1110`).
//
// Held here: the stock pens sell a mule for coin only, a lot cheaper than a horse; it is led home on a halter at its leader's own
// pace and stands in the yard; no family is offered "On the mule" until it has one; it carries one rider, slower than the horse,
// and a pack the horse cannot; one person at a time has it, and the next is told who; a mule lamed in a chase carries nobody until
// it mends, and the family is told it is lame; it is no horse where the war asks for one and draws no vehicle; and the flight east
// takes it with the rest, and the soldiers take it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld, settle, taught } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, errandFor, goingFor, stepWorld, validateWorld } from '../sim/world.mjs';
import { modeWith, ridesAHorse, userOf } from '../sim/keeping.mjs';
import { LAME_DAYS, addBeast, beastsOf, yardSpot } from '../sim/beasts.mjs';
import { HORSE_COIN, MULE_COIN, TRADES } from '../sim/shops.mjs';
import { drawnVehicles, riddenHorses, seatPlan } from '../sim/company.mjs';
import { campRefusal } from '../sim/camp.mjs';
import { houstonCamp } from '../sim/houston.mjs';
import { REFUGES, flee } from '../sim/scrape.mjs';
import { overtake } from '../sim/road.mjs';
import { HORSE_SPEED, MODES, MULE_SPEED, WALK_SPEED } from '../sim/travel.mjs';

function running(seed) {
  const world = taught(createSettledWorld(seed, 5));
  world.status = 'running';
  const family = world.households['hh-1'];
  family.played = true;
  family.resources = { ...family.resources, money: 60, food: 120 };
  return world;
}
const person = (world, name) => world.entities[`hh-1-${name}`];
const send = (world, who, errand, extra = {}) => applyAction(world, 'hh-1', { action: 'chore', entityId: who.id, chore: 'visit-shop', errand, ...extra });
const quote = (world, who, errand, mode) => errandFor(world, 'hh-1', who.id, errand, mode).quote;
const hunt = { action: 'chore', chore: 'hunt-timber' };
const mule = { id: 'stockman:mule', n: 1, pay: 'coin' };
/** A mule of the family's standing in its yard, as one bought and led home stands. */
function muleAtHome(world) {
  const family = world.households['hh-1'];
  const beast = addBeast(world, family, 'mule', null);
  const site = world.map.sites[family.homeSiteId];
  beast.location = { ...yardSpot(site, beast), siteId: site.id };
  return beast;
}

test('the stock pens sell a mule for coin only, a lot cheaper than a horse', () => {
  const world = running('mules-price');
  const lines = errandFor(world, 'hh-1', person(world, 'rosa').id).lines;
  const line = lines.find(one => one.id === 'stockman:mule');
  assert.ok(line, 'the stock pens sell no mule');
  assert.equal(line.price, `${MULE_COIN} reales`);
  assert.equal(MULE_COIN, 10);
  // "a lot cheaper than horses": not more than half a horse.
  assert.ok(MULE_COIN * 2 <= HORSE_COIN, `a mule at ${MULE_COIN} is not a lot cheaper than a horse at ${HORSE_COIN}`);
  assert.deepEqual(line.pays, ['coin']);
  assert.equal(line.keeper, 'Anselmo Treviño');
  assert.match(line.does, /far cheaper than a horse/);
  assert.equal(quote(world, person(world, 'rosa'), [{ ...mule, pay: 'food' }]).why, 'Buy a mule is paid in coin only.');
});

test('a mule bought is led home on a halter at its leader\'s pace and stands in the yard; nobody is offered the mule until then', () => {
  const world = running('mules-buy');
  const family = world.households['hh-1'], buyer = person(world, 'rosa');
  assert.deepEqual(goingFor(world, 'hh-1', person(world, 'mateo').id, hunt).ways.map(way => way.id), ['horse', 'foot', 'wagon'], 'a family with no mule was offered one');
  assert.match(quote(world, buyer, [mule]).how, /Leads the new mule home on a halter\./);
  send(world, buyer, [mule]);
  assert.equal(buyer.chore.mode, 'horse');
  for (let t = 0; t < 900 && !buyer.leads; t++) stepWorld(world);
  const bought = world.entities['hh-1-mule'];
  assert.ok(bought, 'no mule was bought');
  assert.equal(bought.name, 'Jack the mule');
  assert.equal(bought.species, 'mule');
  assert.equal(bought.travel?.purpose, 'lead');
  assert.equal(buyer.travel.speed, HORSE_SPEED, 'a led mule held its rider back');
  assert.ok(world.events.some(e => /bought Jack the mule at the stock pens, to lead home; the family has a mule now\./.test(e.text)));
  for (let t = 0; t < 900 && buyer.chore; t++) stepWorld(world);
  assert.equal(buyer.chore, null);
  assert.equal(bought.location.siteId, family.homeSiteId, 'the mule did not come home');
  const site = world.map.sites[family.homeSiteId];
  assert.deepEqual({ x: bought.location.x, y: bought.location.y }, yardSpot(site, bought), 'the mule is not standing in the yard');
  assert.equal(family.resources.money, 60 - MULE_COIN);
  const ways = goingFor(world, 'hh-1', person(world, 'mateo').id, hunt).ways;
  assert.deepEqual(ways.map(way => way.id), ['horse', 'mule', 'foot', 'wagon']);
  const onMule = ways.find(way => way.id === 'mule');
  assert.equal(onMule.can, true);
  assert.equal(onMule.pace, '4 miles an hour');
  assert.equal(onMule.carry, 10);
  validateWorld(world);
});

test('one rider at a time, slower than the horse, faster than walking; the next is told who has it', () => {
  const world = running('mules-ride');
  const family = world.households['hh-1'];
  const beast = muleAtHome(world);
  const [rider, next] = ['thomas', 'elena'].map(name => person(world, name));
  assert.ok(HORSE_SPEED > MULE_SPEED && MULE_SPEED > WALK_SPEED);
  send(world, rider, [{ id: 'store:seed', n: 1, pay: 'coin' }], { mode: 'mule' });
  assert.equal(rider.travel?.mode, 'mule');
  assert.equal(rider.travel.speed, MULE_SPEED);
  assert.equal(beast.travel?.purpose, 'harness', 'the mule did not go under its rider');
  assert.equal(beast.borrowedBy, rider.id);
  assert.equal(userOf(world, family, 'mule', next), rider);
  const refused = goingFor(world, 'hh-1', next.id, hunt).ways.find(way => way.id === 'mule');
  assert.equal(refused.can, false);
  assert.match(refused.why, new RegExp(`^${rider.name} has the mule, on the road to `));
  assert.throws(() => send(world, next, [{ id: 'store:seed', n: 1, pay: 'coin' }], { mode: 'mule' }), /has the mule/);
  // The horse is still the family's to ride: a mule is its own animal, not the horse.
  assert.equal(goingFor(world, 'hh-1', next.id, hunt).ways.find(way => way.id === 'horse').can, true);
  validateWorld(world);
});

test('the mule carries a pack the horse cannot: nine loads go on the mule, twelve want the wagon', () => {
  const world = running('mules-pack');
  muleAtHome(world);
  const who = person(world, 'rosa');
  const nine = quote(world, who, [{ id: 'store:food', n: 3, pay: 'coin' }]);
  assert.equal(nine.load, 9);
  assert.equal(nine.mode, 'mule', `nine loads went ${nine.mode}, not on the mule`);
  assert.match(nine.how, /^Rides the mule: 9 of 10 loads, more than the horse carries \(7\)\./);
  // More than the mule carries: the wagon, said by the mule's ten - or, for a family of slender means with no wagon, refused so.
  const twelve = quote(world, who, [{ id: 'store:food', n: 4, pay: 'coin' }]);
  assert.notEqual(twelve.mode, 'mule');
  assert.match(twelve.how ?? twelve.why, /more than the mule carries \(10\)|^This wants the wagon: 12 loads, and the mule carries 10\./);
  // With a wagon of its own, twelve loads go in it, and the words say the mule's ten.
  addBeast(world, world.households['hh-1'], 'wagon', null).location = { ...world.entities['hh-1-mule'].location };
  if (!beastsOf(world, world.households['hh-1'], 'ox').length) addBeast(world, world.households['hh-1'], 'ox', null).location = { ...world.entities['hh-1-mule'].location };
  const inWagon = quote(world, who, [{ id: 'store:food', n: 4, pay: 'coin' }]);
  assert.equal(inWagon.mode, 'wagon', inWagon.why);
  assert.match(inWagon.how, /^Takes the wagon: 12 of \d+ loads, more than the mule carries \(10\)\./);
  assert.equal(MODES.mule.carry > MODES.horse.carry, true);
});

test('a mule lamed in a chase carries nobody until it mends, and the family is told it is lame', () => {
  const world = running('mules-lame');
  const beast = muleAtHome(world);
  const who = person(world, 'mateo');
  beast.hurt = world.minute + LAME_DAYS * 1440;
  const way = goingFor(world, 'hh-1', who.id, hunt).ways.find(one => one.id === 'mule');
  assert.equal(way.can, false);
  assert.equal(way.why, 'The mule is lame and carries nobody until it mends.');
  world.meansRoll = 2;
  assert.deepEqual(riddenHorses(world, [beast]), [], 'a lame mule was given a rider on the family\'s road');
  beast.hurt = world.minute - 1;
  assert.equal(goingFor(world, 'hh-1', who.id, hunt).ways.find(one => one.id === 'mule').can, true, 'the mule never mended');
  assert.deepEqual(riddenHorses(world, [beast]), [beast]);
});

test('a mule is no horse where the war asks for one, carries a seat on the family\'s road, and draws no wagon', () => {
  const world = running('mules-war');
  const beast = muleAtHome(world);
  const man = person(world, 'thomas');
  // At Houston's camp with only the mule: no scout.
  const camp = houstonCamp(world);
  man.service = { kind: 'houston', status: 'serving' };
  man.location = { ...world.map.sites[camp], siteId: camp };
  beast.location = { ...man.location };
  beast.borrowedBy = man.id;
  assert.equal(modeWith(world, man), 'mule');
  assert.equal(ridesAHorse(world, man), false);
  assert.match(campRefusal(world, world.households['hh-1'], man, 'camp-scout'), /The scouts ride horses, and .* has only the mule at the camp/);
  // With the family's horse instead, he scouts.
  beast.location = { ...yardSpot(world.map.sites[world.households['hh-1'].homeSiteId], beast), siteId: world.households['hh-1'].homeSiteId };
  beast.borrowedBy = null;
  const horse = world.entities['hh-1-horse'];
  horse.location = { ...man.location }; horse.borrowedBy = man.id;
  assert.equal(ridesAHorse(world, man), true);
  assert.equal(campRefusal(world, world.households['hh-1'], man, 'camp-scout'), null);
  // The family's road: a seat on the mule after the horse's; and it draws no wagon in place of the ox.
  world.meansRoll = 2;
  const wagon = world.entities['hh-1-wagon'];
  assert.deepEqual(drawnVehicles([wagon, beast]), [], 'the mule drew the wagon');
  assert.deepEqual(drawnVehicles([wagon, beast, world.entities['hh-1-animal']]), [wagon]);
  const people = world.households['hh-1'].members.map(id => world.entities[id]);
  const plan = seatPlan(people, [], riddenHorses(world, [beast, world.entities['hh-1-horse']]));
  assert.equal([...plan.values()].filter(seat => seat.saddle).length, 2, 'the mule carried no rider on the family\'s road');
  assert.ok([...plan.values()].some(seat => seat.rides === beast.id && seat.saddle));
});

test('the flight east takes the mule with the rest, and the soldiers take it', () => {
  const world = taught(settle(createGonzalesWorld('mules-flight', 5, { map: 'colonies' })));
  world.status = 'running';
  const family = Object.values(world.households).find(one => REFUGES.some(id => world.map.sites[id] && world.map.sites[id].x > world.map.sites[one.homeSiteId].x + 2));
  assert.ok(family, 'no family has a refuge east of it, so this proves nothing');
  family.played = true;
  const beast = addBeast(world, family, 'mule', null);
  beast.location = { ...yardSpot(world.map.sites[family.homeSiteId], beast), siteId: family.homeSiteId };
  assert.equal(TRADES.stockman.offers.find(one => one.id === 'mule').refuse(world, family, world.entities[family.members[0]]), null);
  world.period = 3;
  family.flight = { status: 'ordered', orderedMinute: world.minute };
  const refuge = REFUGES.find(id => world.map.sites[id] && world.map.sites[id].x > world.map.sites[family.homeSiteId].x + 2);
  flee(world, family, { take: {}, refuge });
  assert.equal(beast.travel?.purpose, 'flee', 'the mule was left behind at home');
  overtake(world, family, { id: 'test-column', name: 'A Mexican column', toward: refuge });
  assert.equal(beast.condition, 'taken');
  assert.ok(world.events.some(e => e.householdId === family.id && /The soldiers took [^.]*the mule/.test(e.text)), 'the soldiers did not take the mule in words');
  assert.equal(beastsOf(world, family, 'mule').length, 1);
  validateWorld(world);
});

// Wagons by the family's size, and the wheelwright's new wagon (owner, 2026-09-25: "families should arrive with an appropriate
// number of wagons. larger families get more than one wagon based on their population. research first. wheelwright sells one,
// very expensive."; docs/SETTLING_IN.md §4a, docs/TOWNS.md §4f, sim/beasts.mjs, HIST-TEX-441, FIC-GONZ-391, FIC-GONZ-392).
//
// Held here: at its roll every family of a class made since has a wagon for every eight people and an ox to draw each, on every
// roll of the die and across seeds, with its stores packed a wagon's worth to each wagon; every wagon comes in on the road with
// its own driver and ox and is drawn in line; two wagons are two loads out at once, each behind its own ox, and a third person is
// told both are out; the wheelwright's wagon is a hundred reales, coin only and the dearest thing in any town, wants an ox bought
// with it and a buyer who does not go by the wagon, is refused at the counter with no ox to draw it, and is driven home at the
// wagon's pace with the horse ridden in tied on behind; the flight east loads every wagon an ox can draw; a class made before
// keeps one wagon a family and opens as it was; and no other family's wagons reach a student.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { settle, taught, createSettledWorld } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, errandFor, goingFor, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { familyRoll, tooYoung } from '../sim/family.mjs';
import { BEASTS_MOST, WAGON_PEOPLE, addBeast, beastsOf, wagonsForPeople } from '../sim/beasts.mjs';
import { userOf } from '../sim/keeping.mjs';
import { TRADES, WAGON_COIN } from '../sim/shops.mjs';
import { WAGON_ITEMS, WAGON_SPACE, spaceOf, wagonSpaceFor } from '../sim/wagon.mjs';
import { FLIGHT_ROOM, flightRoom } from '../sim/scrape.mjs';
import { WAGON_SPEED } from '../sim/travel.mjs';
import { wagonTeams, seatOf } from '../public/motion.js';
import { skipsTheChooser } from '../public/going.js';
import { readSave, writeSave } from '../server/storage.mjs';

const seedRolling = (roll, stem) => { for (let n = 0; ; n++) if (familyRoll(`${stem}-${n}`, 'hh-1') === roll) return `${stem}-${n}`; };
/** A class in its lobby with hh-1 rolled to this many people. */
function rolled(roll, stem = 'wagons') {
  const world = createGonzalesWorld(seedRolling(roll, stem), 5);
  rollFamily(world, world.households['hh-1']);
  return world;
}
/** The same, on its land under a roof and running, the lesson done. */
function running(roll, stem = 'wagons-run') {
  const world = taught(settle(rolled(roll, stem)));
  world.status = 'running';
  world.households['hh-1'].played = true;
  return world;
}
const grown = (world, household) => household.members.map(id => world.entities[id]).filter(one => !tooYoung(one) && one.age >= 12);
/** Somebody made the main person and sent to town this way: travelling is the main person's (sim/world.mjs). */
const travel = (world, who, mode) => {
  applyAction(world, 'hh-1', { action: 'set-main', entityId: who.id });
  applyAction(world, 'hh-1', { action: 'travel', entityId: who.id, destination: 'gonzales', mode });
};
const stores = load => Object.fromEntries(load.filter(entry => WAGON_ITEMS.find(item => item.id === entry.id).kind === 'stores').map(entry => [entry.id, entry.amount]));

test('every family is fitted out with a wagon for every eight people and an ox to draw each, on every roll and across seeds', () => {
  assert.equal(WAGON_PEOPLE, 8);
  assert.deepEqual([1, 8, 9, 16, 17, 20].map(wagonsForPeople), [1, 1, 2, 2, 3, 3]);
  for (let roll = 1; roll <= 20; roll++) {
    for (const stem of ['wagons-a', 'wagons-b', 'wagons-c']) {
      const unrolled = createGonzalesWorld(seedRolling(roll, stem), 5);
      const before = stores(unrolled.households['hh-1'].load);
      const world = rolled(roll, stem), family = world.households['hh-1'];
      assert.equal(family.members.length, roll, 'the roll is not the family');
      const want = Math.max(1, Math.ceil(roll / 8));
      const wagons = beastsOf(world, family, 'wagon'), oxen = beastsOf(world, family, 'ox');
      assert.equal(wagons.length, want, `a family of ${roll} came with ${wagons.length} wagons`);
      assert.equal(oxen.length, want, `a family of ${roll} has ${oxen.length} oxen for ${want} wagons`);
      assert.equal(beastsOf(world, family, 'horse').length, 1, 'the horse is one a family, whatever its size');
      // Each on the road in beside the family, laden with what it packed, and its own entity with its own id.
      for (const beast of [...wagons, ...oxen]) {
        assert.equal(beast.travel?.purpose, 'arrive', `${beast.id} is not on the road in`);
        assert.equal(beast.householdId, 'hh-1');
      }
      for (const wagon of wagons) assert.equal(wagon.laden, true, `${wagon.id} comes in empty`);
      assert.deepEqual(wagons.map(wagon => wagon.id), ['hh-1-wagon', 'hh-1-wagon-2', 'hh-1-wagon-3'].slice(0, want));
      // A wagon's worth of stores to each wagon, and the room of every wagon together.
      assert.deepEqual(stores(family.load), Object.fromEntries(Object.entries(before).map(([id, n]) => [id, n * want])));
      assert.equal(wagonSpaceFor(family), WAGON_SPACE * want);
      assert.ok(spaceOf(family.load) <= wagonSpaceFor(family));
      // The founding line says what comes in; the rest of the class keeps its one wagon.
      const founding = world.events.find(event => event.type === 'household-founded' && event.householdId === 'hh-1').text;
      assert.match(founding, want === 1 ? /with the wagon, the ox and the horse/ : new RegExp(`with its ${['', '', 'two', 'three'][want]} wagons, an ox to each, and the horse`));
      for (const other of Object.values(world.households).filter(one => one.id !== 'hh-1')) assert.equal(beastsOf(world, other, 'wagon').length, 1, `${other.id}, never rolled, has more than one wagon`);
      validateWorld(world);
    }
  }
});

test('every wagon comes in with its own driver and ox, drawn in line, and the family is in when the last wheel is', () => {
  const world = rolled(12, 'wagons-in');
  const family = world.households['hh-1'];
  world.status = 'running';
  stepWorld(world);
  const seen = projectWorld(world, 'hh-1', 'student', { includeMap: false }).entities;
  const teams = wagonTeams('hh-1', seen);
  assert.equal(teams.length, 2);
  assert.equal(new Set(teams.map(team => team.driverId)).size, 2, 'one person drawn driving two wagons');
  assert.equal(teams[0].driverId, family.principalId, 'the principal does not drive the family wagon in');
  assert.equal(new Set(teams.map(team => team.ox?.id)).size, 2, 'two wagons drawn behind one ox');
  for (const team of teams) assert.equal(seatOf(seen.find(one => one.id === team.driverId), seen), 'wagon');
  for (let t = 0; t < 200 && family.arriving; t++) stepWorld(world);
  assert.equal(family.arriving, undefined, 'the family never came in');
  for (const wagon of beastsOf(world, family, 'wagon')) {
    assert.equal(wagon.location.siteId, family.homeSiteId);
    assert.equal(wagon.laden, false, 'a wagon was not unloaded');
  }
  assert.equal(world.events.filter(event => event.type === 'arrival' && event.householdId === 'hh-1' && event.purpose === 'arrive').length, 1);
  validateWorld(world);
});

test('two wagons are two loads out at once, each behind its own ox, and a third is told both are out', () => {
  const world = running(12);
  const family = world.households['hh-1'];
  const [a, b, c] = grown(world, family);
  assert.ok(c, 'a family of twelve without three grown people');
  for (const who of [a, b]) {
    const going = goingFor(world, 'hh-1', who.id, { action: 'travel', destination: 'gonzales' });
    assert.equal(going.ways.find(way => way.id === 'wagon').can, true, `${who.name} was refused the second wagon: ${going.ways.find(way => way.id === 'wagon').why}`);
    travel(world, who, 'wagon');
    assert.equal(who.travel?.mode, 'wagon');
  }
  const wagons = beastsOf(world, family, 'wagon'), oxen = beastsOf(world, family, 'ox');
  assert.deepEqual(wagons.map(wagon => wagon.borrowedBy).sort(), [a.id, b.id].sort(), 'the two drivers are not on two wagons');
  assert.deepEqual(oxen.map(ox => ox.borrowedBy).sort(), [a.id, b.id].sort(), 'the two wagons are not behind two oxen');
  const third = goingFor(world, 'hh-1', c.id, { action: 'travel', destination: 'gonzales' }).ways.find(way => way.id === 'wagon');
  assert.equal(third.can, false);
  assert.match(third.why, new RegExp(`^(${a.name} and ${b.name}|${b.name} and ${a.name}) have both oxen and wagons\\.$`));
  assert.throws(() => travel(world, c, 'wagon'), /have both oxen and wagons/);
  validateWorld(world);
});

test('the wheelwright sells a new wagon for a hundred reales, coin only, the dearest thing in any town', () => {
  const world = running(4, 'wagons-price');
  const family = world.households['hh-1'];
  family.resources.money = 200;
  const buyer = grown(world, family)[0];
  const line = errandFor(world, 'hh-1', buyer.id).lines.find(one => one.id === 'wheelwright:buy-wagon');
  assert.ok(line, 'the wheelwright sells no wagon');
  assert.equal(line.price, `${WAGON_COIN} reales`);
  assert.equal(WAGON_COIN, 100);
  assert.deepEqual(line.pays, ['coin'], 'a wagon is sold for food');
  assert.equal(line.keeper, 'Rafael Cantú');
  // Dearer than anything else sold anywhere, in coin or in food at two food a real.
  for (const [trade, { offers }] of Object.entries(TRADES)) for (const offer of offers) {
    if (offer.id === 'buy-wagon' || offer.kind !== 'sell') continue;
    assert.ok((offer.coin ?? 0) < WAGON_COIN && (offer.food ?? 0) / 2 < WAGON_COIN, `${trade}:${offer.id} is as dear as a wagon`);
  }
  // The wheelwright stops at the most wagons a family keeps.
  const full = structuredClone(world);
  while (beastsOf(full, full.households['hh-1'], 'wagon').length < BEASTS_MOST) addBeast(full, full.households['hh-1'], 'wagon', null);
  assert.equal(errandFor(full, 'hh-1', buyer.id).lines.find(one => one.id === 'wheelwright:buy-wagon').why, `The family has ${BEASTS_MOST} wagons, as many as it can keep.`);
  // No credit: ninety reales and an ox do not buy one.
  family.resources.money = 90;
  assert.match(errandFor(world, 'hh-1', buyer.id, [{ id: 'stockman:ox', n: 1, pay: 'coin' }, { id: 'wheelwright:buy-wagon', n: 1, pay: 'coin' }]).quote.why, /costs 100 reales, and there will not be that much coin/);
});

test('a new wagon wants an ox bought with it and a buyer who does not go by the wagon, and is refused at the counter with no ox to draw it', () => {
  const world = running(4, 'wagons-refused');
  const family = world.households['hh-1'];
  family.resources.money = 300;
  const [buyer, other] = grown(world, family);
  const wagon = { id: 'wheelwright:buy-wagon', n: 1, pay: 'coin' }, ox = { id: 'stockman:ox', n: 1, pay: 'coin' };
  const quote = (list, mode) => errandFor(world, 'hh-1', buyer.id, list, mode).quote;
  assert.equal(quote([wagon]).why, 'A new wagon has to be drawn home, and an ox draws it. Put an ox from the stock pens on the list too.');
  assert.equal(quote([wagon, { id: 'wheelwright:wagon', n: 1, pay: 'coin' }, ox]).why, 'The wheelwright puts in order the wagon that is brought to him, and a new wagon is fetched by somebody on foot or on the horse. Send them separately.');
  const told = quote([wagon, ox]);
  assert.equal(told.can, true, told.why);
  assert.equal(told.ways.find(way => way.id === 'wagon').can, false);
  assert.equal(told.ways.find(way => way.id === 'wagon').why, 'One person drives one wagon home. Whoever fetches the new wagon goes on foot or on the horse.');
  assert.equal(quote([wagon, ox], 'wagon').why, 'One person drives one wagon home. Whoever fetches the new wagon goes on foot or on the horse.');
  assert.match(told.how, /Drives the new wagon home behind the new ox, at an ox's pace\./);
  // A horse bought too: the rider's own horse is tied on behind the new wagon, and one person leads one animal.
  const withHorse = quote([wagon, ox, { id: 'stockman:horse', n: 1, pay: 'coin' }], 'horse');
  assert.equal(withHorse.why, 'The horse ridden in walks home tied behind the new wagon, and one person leads one animal. Walk, or send somebody else for the new horse.');
  // At the counter: nobody at the stock pens that day, so no ox, and nothing is paid for the wagon.
  applyAction(world, 'hh-1', { action: 'chore', entityId: buyer.id, chore: 'visit-shop', errand: [wagon, ox], mode: 'foot' });
  const trader = Object.values(world.entities).find(one => one.deals?.includes('stockman') && one.townSiteId === 'gonzales');
  trader.health = { condition: 'tired' };
  for (let t = 0; t < 900 && buyer.chore; t++) stepWorld(world);
  assert.equal(buyer.chore, null);
  assert.equal(family.resources.money, 300, 'money was paid for a wagon with no ox to draw it');
  assert.equal(beastsOf(world, family, 'wagon').length, 1);
  assert.ok(world.events.some(event => event.householdId === 'hh-1' && event.text.includes(`There is no ox with ${buyer.name} to draw a new wagon home.`)), 'the refusal at the counter was not said');
  assert.equal(userOf(world, family, 'wagon', other), null);
  validateWorld(world);
});

test('a new wagon is driven home behind the ox bought with it, at the wagon\'s pace, with the horse ridden in tied on behind', () => {
  const world = running(8, 'wagons-bought');
  const family = world.households['hh-1'];
  family.resources.money = 200;
  const [buyer] = grown(world, family);
  applyAction(world, 'hh-1', { action: 'chore', entityId: buyer.id, chore: 'visit-shop', errand: [{ id: 'wheelwright:buy-wagon', n: 1, pay: 'coin' }, { id: 'stockman:ox', n: 1, pay: 'coin' }], mode: 'horse' });
  assert.equal(buyer.chore.mode, 'horse');
  for (let t = 0; t < 900 && !world.entities['hh-1-wagon-2']; t++) stepWorld(world);
  const bought = world.entities['hh-1-wagon-2'], ox = world.entities['hh-1-animal-2'], bess = world.entities['hh-1-horse'];
  assert.ok(bought && ox, 'no wagon or no ox was bought');
  assert.equal(bought.kind, 'wagon');
  assert.equal(bought.name, 'Second wagon');
  assert.equal(family.resources.money, 200 - WAGON_COIN - 15);
  for (let t = 0; t < 20 && !buyer.travel; t++) stepWorld(world);
  assert.equal(buyer.travel?.mode, 'wagon', 'the buyer did not drive the new wagon home');
  assert.equal(buyer.travel.speed, WAGON_SPEED);
  assert.equal(bought.travel?.purpose, 'harness');
  assert.equal(ox.travel?.purpose, 'harness', 'the new ox was led home, not yoked');
  assert.equal(bess.travel?.purpose, 'lead', 'the horse ridden in was left in town');
  assert.deepEqual(buyer.leads, [bess.id]);
  assert.ok(world.events.some(event => new RegExp(`${buyer.name} bought a new wagon from the wheelwright and yoked Buck the ox to it, to drive home with Bess the mare tied on behind; the family has two wagons now\\.`).test(event.text)));
  for (let t = 0; t < 900 && buyer.chore; t++) stepWorld(world);
  for (const beast of [bought, ox, bess]) {
    assert.equal(beast.location.siteId, family.homeSiteId, `${beast.id} did not come home`);
    assert.equal(beast.borrowedBy, null);
  }
  assert.equal(buyer.leads, undefined);
  // Home, the family has two loads out at once.
  const [a, b] = grown(world, family);
  for (const who of [a, b]) travel(world, who, 'wagon');
  assert.equal(a.travel?.mode, 'wagon');
  assert.equal(b.travel?.mode, 'wagon');
  validateWorld(world);
});

test('the flight east loads every wagon an ox can draw at home', () => {
  const world = running(12, 'wagons-flight');
  const family = world.households['hh-1'];
  assert.deepEqual(flightRoom(world, family), { room: FLIGHT_ROOM * 2, mode: 'wagon', wagons: 2 });
  beastsOf(world, family, 'ox')[1].condition = 'lost';
  assert.deepEqual(flightRoom(world, family), { room: FLIGHT_ROOM, mode: 'wagon' });
});

test('a class made before wagons went by size keeps one wagon a family, rolled or running, and opens as it was', () => {
  const old = createGonzalesWorld(seedRolling(20, 'wagons-old'), 5);
  delete old.wagonsBySize;
  rollFamily(old, old.households['hh-1']);
  assert.equal(old.households['hh-1'].members.length, 20);
  assert.equal(beastsOf(old, old.households['hh-1'], 'wagon').length, 1, 'a class made before fitted a family out');
  validateWorld(old);
  const world = running(20, 'wagons-save');
  const dir = mkdtempSync(join(tmpdir(), 'wagons-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json')).world;
    validateWorld(opened);
    assert.equal(beastsOf(opened, opened.households['hh-1'], 'wagon').length, 3);
    assert.equal(opened.wagonsBySize, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  assert.throws(() => validateWorld({ ...structuredClone(world), wagonsBySize: 'yes' }), /Invalid wagon rule/);
  const extra = structuredClone(world);
  extra.households['hh-1'].property.push('hh-1-wagon-9');
  extra.entities['hh-1-wagon-9'] = { ...structuredClone(extra.entities['hh-1-wagon-3']), id: 'hh-1-wagon-9' };
  extra.households['hh-1'].property.push('hh-1-wagon-8');
  extra.entities['hh-1-wagon-8'] = { ...structuredClone(extra.entities['hh-1-wagon-3']), id: 'hh-1-wagon-8' };
  assert.throws(() => validateWorld(extra), /Too many animals/);
});

test('no other family\'s wagons reach a student', () => {
  const world = running(20, 'wagons-fog');
  const seen = projectWorld(world, 'hh-2', 'student', { includeMap: false });
  const json = JSON.stringify(seen);
  for (const id of ['hh-1-wagon', 'hh-1-wagon-2', 'hh-1-wagon-3', 'hh-1-animal-2']) assert.ok(!json.includes(`"${id}"`), `${id} reached another family`);
  assert.equal(seen.entities.filter(entity => entity.kind === 'wagon').length, 1, 'a family of four is sent more than its own one wagon');
  assert.ok(seen.others.every(entity => entity.kind === 'person'), 'another family\'s beasts are sent as others');
});

test('a journey with one way that can go is sent that way without asking; a real choice, or none, is asked', () => {
  const world = running(8, 'wagons-oneway');
  const family = world.households['hh-1'];
  const [a, b, c, d] = grown(world, family);
  const town = who => goingFor(world, 'hh-1', who.id, { action: 'travel', destination: 'gonzales' });
  assert.equal(town(a).oneWay, undefined, 'three ways open, and the chooser was skipped');
  assert.equal(skipsTheChooser(town(a)), null);
  travel(world, a, 'horse');
  assert.equal(town(b).oneWay, undefined, 'walking and the wagon open, and the chooser was skipped');
  travel(world, b, 'wagon');
  const only = town(c);
  assert.deepEqual(only.ways.filter(way => way.can).map(way => way.id), ['foot']);
  assert.equal(only.oneWay, 'foot', 'one way open, and the chooser still asks');
  assert.equal(skipsTheChooser(only), 'foot');
  // The page asks after all once the chooser is up, or with a refusal to be read, or when the order is shut.
  assert.equal(skipsTheChooser(only, { shown: true }), null);
  assert.equal(skipsTheChooser(only, { error: 'Rosa has the horse.' }), null);
  assert.equal(skipsTheChooser({ ...only, shut: 'Still on the road.' }), null);
  assert.equal(skipsTheChooser({ ...only, ways: only.ways.map(way => ({ ...way, can: false })) }), null, 'a way the server says is shut was sent');
  // The order still carries the way, and the server still checks it.
  travel(world, c, 'foot');
  assert.equal(c.travel?.mode, 'foot');
  assert.throws(() => travel(world, d, 'horse'), /has the horse/);
  validateWorld(world);
});

// Horses, oxen and stock bought at the stock pens (owner, 2026-09-24: "players should also be able to buy more horses and other
// animals. they should be relatively expensive though"; docs/TOWNS.md §4d, sim/beasts.mjs).
//
// Held here: the pens sell a horse, an ox, a cow and calf and a hog at the stated prices, dearer than a rifle but the hog; each
// horse or ox bought is its own animal with its own id and name, walks home on a halter beside its buyer whatever way they go, and
// is the family's to use once home - two horses are two riders, a second ox drags logs while the first pulls the wagon; one person
// leads one animal; an ox or a drove holds its leader to the ox's pace, and the chooser says so; nothing led is a load; cattle and
// hogs join the herd; the flight east takes the bought animals with the rest; a class saved before opens as it was; and no other
// family's animals reach a student.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettledWorld, modestMeans, settle, taught } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, errandFor, goingFor, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { userOf } from '../sim/keeping.mjs';
import { oxFree } from '../sim/felling.mjs';
import { BEASTS_MOST, LEAD_PACE, addBeast, beastsOf } from '../sim/beasts.mjs';
import { COW_CALF_COIN, HOG_COIN, HOG_FOOD, HORSE_COIN, OX_COIN, RIFLE_COIN, RIFLE_FOOD, TOWN_TRADES, TRADES } from '../sim/shops.mjs';
import { herdOf } from '../sim/stock.mjs';
import { REFUGES, flee } from '../sim/scrape.mjs';
import { overtake } from '../sim/road.mjs';
import { HORSE_SPEED } from '../sim/travel.mjs';
import { readSave, writeSave } from '../server/storage.mjs';

function running(seed) {
  const world = taught(createSettledWorld(seed, 5));
  world.status = 'running';
  world.households['hh-1'].played = true;
  const family = world.households['hh-1'];
  family.resources = { ...family.resources, money: 60, food: 120 };
  return world;
}
const person = (world, name) => world.entities[`hh-1-${name}`];
const send = (world, who, errand, extra = {}) => applyAction(world, 'hh-1', { action: 'chore', entityId: who.id, chore: 'visit-shop', errand, ...extra });
const finish = (world, who, cap = 900) => { for (let t = 0; t < cap && who.chore; t++) stepWorld(world); assert.equal(who.chore, null, `${who.name} never finished`); };
const quote = (world, who, errand, mode) => errandFor(world, 'hh-1', who.id, errand, mode).quote;
const horse = { id: 'stockman:horse', n: 1, pay: 'coin' }, ox = { id: 'stockman:ox', n: 1, pay: 'coin' };

test('the stock pens sell a horse, an ox and a cow and calf for coin and a hog for coin or food, dearer than a rifle but the hog, paid only from what the family has', () => {
  const world = running('beasts-prices');
  const family = world.households['hh-1'], buyer = person(world, 'rosa');
  const lines = errandFor(world, 'hh-1', buyer.id).lines;
  const price = id => lines.find(one => one.id === id)?.price;
  assert.equal(price('stockman:horse'), `${HORSE_COIN} reales`);
  assert.equal(price('stockman:ox'), `${OX_COIN} reales`);
  assert.equal(price('stockman:cattle'), `${COW_CALF_COIN} reales`);
  assert.equal(price('stockman:hog'), `${HOG_COIN} reales or ${HOG_FOOD} food`);
  assert.deepEqual([HORSE_COIN, OX_COIN, COW_CALF_COIN, HOG_COIN, HOG_FOOD], [25, 15, 10, 4, 14]);
  for (const coin of [HORSE_COIN, OX_COIN, COW_CALF_COIN]) assert.ok(coin > RIFLE_COIN && coin > RIFLE_FOOD / 2, 'an animal is not dearer than a rifle');
  // A food price the wagon could never carry is not offered: the horse, the ox and the cow and calf are coin only.
  for (const id of ['stockman:horse', 'stockman:ox', 'stockman:cattle']) assert.deepEqual(lines.find(one => one.id === id).pays, ['coin']);
  assert.match(quote(world, buyer, [{ id: 'stockman:hog', n: 1, pay: 'food' }]).how, /Drives 1 hog home/);
  // Kept by an invented keeper, in the larger towns and Victoria, and never in the small places.
  assert.equal(lines.find(one => one.id === 'stockman:horse').keeper, 'Anselmo Treviño');
  assert.deepEqual(Object.entries(TOWN_TRADES).filter(([, trades]) => trades.includes('stockman')).map(([town]) => town), ['gonzales', 'san-felipe', 'columbia', 'victoria']);
  // No credit: twenty reales do not buy a horse for coin.
  family.resources.money = 20;
  assert.match(quote(world, buyer, [horse]).why, /costs 25 reales, and there will not be that much coin/);
  assert.equal(quote(world, buyer, [{ ...horse, pay: 'food' }]).why, 'Buy a horse is paid in coin only.');
});

test('a horse bought walks home on a halter beside the rider on the horse she came on, and is its own animal with its own name', () => {
  const world = running('beasts-horse');
  const family = world.households['hh-1'], buyer = person(world, 'rosa');
  send(world, buyer, [horse]);
  assert.equal(buyer.chore.mode, 'horse', 'the quickest way was not the family horse, so this proves nothing about riding home');
  for (let t = 0; t < 900 && !buyer.leads; t++) stepWorld(world);
  const bought = world.entities['hh-1-horse-2'];
  assert.ok(bought, 'no horse was bought');
  assert.equal(bought.name, 'Dandy the gelding');
  assert.deepEqual(family.property.slice(-1), ['hh-1-horse-2']);
  // Bess under the rider, the new one led beside her on the same road, drawn walking.
  assert.equal(buyer.travel?.mode, 'horse');
  assert.equal(world.entities['hh-1-horse'].travel?.purpose, 'harness', 'she rode the new horse home and left her own');
  assert.equal(bought.travel?.purpose, 'lead');
  assert.equal(bought.travel.mode, 'foot');
  assert.equal(bought.travel.to, family.homeSiteId);
  assert.equal(userOf(world, family, 'horse', person(world, 'mateo'))?.name, buyer.name, 'both horses are out with her, and the family was told otherwise');
  finish(world, buyer);
  assert.equal(bought.location.siteId, family.homeSiteId, 'the horse did not come home');
  assert.equal(bought.borrowedBy, null);
  assert.equal(buyer.leads, undefined);
  assert.equal(family.resources.money, 60 - HORSE_COIN);
  assert.ok(world.events.some(e => /bought Dandy the gelding at the stock pens, to lead home; the family has two horses now/.test(e.text)));
  validateWorld(world);
});

test('two horses are two riders, and a third is told both are out', () => {
  const world = running('beasts-riders');
  const family = world.households['hh-1'];
  addBeast(world, family, 'horse', person(world, 'rosa')).borrowedBy = null;
  world.entities['hh-1-horse-2'].location = { ...world.entities['hh-1-horse'].location };
  const [a, b, c] = ['thomas', 'elena', 'rosa'].map(name => person(world, name));
  const hunt = { action: 'chore', chore: 'hunt-timber' };
  send(world, a, [{ id: 'store:seed', n: 1, pay: 'coin' }], { mode: 'horse' });
  // The chooser every journey asks (sim/going.mjs): with one horse out, the other is open to the next rider, and quickest.
  const second = goingFor(world, 'hh-1', b.id, hunt);
  assert.equal(second.ways.find(way => way.id === 'horse').can, true, 'the second horse is not offered while the first is out');
  assert.equal(second.quickest, 'horse');
  send(world, b, [{ id: 'store:seed', n: 1, pay: 'coin' }], { mode: 'horse' });
  const third = goingFor(world, 'hh-1', c.id, hunt).ways.find(way => way.id === 'horse');
  assert.equal(third.can, false);
  assert.equal(third.why, `${a.name} and ${b.name} have both horses.`);
  assert.equal(a.travel?.mode, 'horse');
  assert.equal(b.travel?.mode, 'horse');
  assert.notEqual(world.entities['hh-1-horse'].borrowedBy, world.entities['hh-1-horse-2'].borrowedBy, 'two riders on one horse');
  assert.throws(() => send(world, c, [{ id: 'store:seed', n: 1, pay: 'coin' }], { mode: 'horse' }), new RegExp(`${a.name} and ${b.name} have both horses\\.`));
  validateWorld(world);
});

test('an ox bought holds its leader to the ox\'s pace, the chooser says so, and it drags logs while the first ox pulls the wagon', () => {
  const world = running('beasts-ox');
  const family = world.households['hh-1'], buyer = person(world, 'rosa');
  const told = quote(world, buyer, [ox]);
  assert.equal(told.load, 0, 'an ox led home was counted as a load');
  assert.match(told.how, /Leads the new ox home, at an ox's pace\./);
  const riding = told.ways.find(way => way.id === 'horse');
  assert.match(riding.leads, /^Leads the new ox home, at an ox's pace\. Home in about [\d.]+ hours?\.$/);
  send(world, buyer, [ox], { mode: 'horse' });
  for (let t = 0; t < 900 && !buyer.leads; t++) stepWorld(world);
  const bought = world.entities['hh-1-animal-2'];
  assert.equal(bought?.name, 'Buck the ox');
  assert.equal(buyer.travel.speed, LEAD_PACE.ox, 'the rider trotted home and left the ox behind');
  assert.ok(LEAD_PACE.ox < HORSE_SPEED);
  assert.equal(bought.travel.speed, buyer.travel.speed);
  finish(world, buyer);
  assert.equal(bought.location.siteId, family.homeSiteId);
  // The first ox goes to town with the wagon; the second is at home for whoever drags logs.
  const hauler = person(world, 'mateo'), driver = person(world, 'thomas');
  send(world, driver, [{ id: 'store:seed', n: 1, pay: 'coin' }], { mode: 'wagon' });
  assert.equal(driver.travel?.mode, 'wagon');
  assert.equal(userOf(world, family, 'ox', hauler), null, 'the second ox was counted as out with the wagon');
  assert.equal(oxFree(world, family, hauler), true, 'the second ox is not at home to drag logs');
  validateWorld(world);
});

test('one person leads one animal home; cattle and hogs are driven to the herd, and no led animal is a load', () => {
  const world = running('beasts-one');
  const family = world.households['hh-1'], buyer = person(world, 'rosa');
  assert.equal(quote(world, buyer, [horse, ox]).why, 'One person can lead one animal home: a horse or an ox, not both. Send somebody else for the other.');
  assert.match(quote(world, buyer, [{ ...horse, n: 2 }]).why, /one is all anybody needs/);
  const herd = herdOf(family);
  const drove = [{ id: 'stockman:cattle', n: 1, pay: 'coin' }, { id: 'stockman:hog', n: 2, pay: 'coin' }];
  const told = quote(world, buyer, drove, 'foot');
  assert.equal(told.can, true);
  assert.equal(told.load, 0);
  assert.match(told.how, /Drives 2 cattle and 2 hogs home, at an ox's pace\./);
  send(world, buyer, drove, { mode: 'foot' });
  for (let t = 0; t < 900 && !buyer.drives; t++) stepWorld(world);
  assert.equal(buyer.travel.speed, LEAD_PACE.cattle, 'the drove did not hold the walker to its pace');
  finish(world, buyer);
  assert.deepEqual(herdOf(family), { cattle: herd.cattle + 2, hogs: herd.hogs + 2 });
  assert.equal(buyer.drives, undefined);
  validateWorld(world);
});

test('a family keeps at most four horses, and the flight east takes the bought ones with the rest', () => {
  const world = taught(settle(createGonzalesWorld('beasts-flight', 5, { map: 'colonies' })));
  world.status = 'running';
  const family = Object.values(world.households).find(one => REFUGES.some(id => world.map.sites[id] && world.map.sites[id].x > world.map.sites[one.homeSiteId].x + 2));
  assert.ok(family, 'no family has a refuge east of it, so this proves nothing');
  family.played = true;
  const someone = world.entities[family.members[0]];
  for (let i = 0; i < BEASTS_MOST - 1; i++) {
    const beast = addBeast(world, family, 'horse', someone);
    beast.borrowedBy = null;
    beast.location = { ...world.entities[`${family.id}-horse`].location };
  }
  const pens = TRADES.stockman.offers;
  assert.equal(pens.find(one => one.id === 'horse').refuse(world, family, someone), 'The family has 4 horses, as many as it can keep.');
  assert.equal(pens.find(one => one.id === 'ox').refuse(world, family, someone), null);
  // ceiling of the cap, and the save refuses more than it.
  world.entities[`${family.id}-horse-9`] = { ...world.entities[`${family.id}-horse-2`], id: `${family.id}-horse-9` };
  family.property.push(`${family.id}-horse-9`);
  assert.throws(() => validateWorld(world), /Too many animals/);
  family.property.pop(); delete world.entities[`${family.id}-horse-9`];
  world.period = 3;
  family.flight = { status: 'ordered', orderedMinute: world.minute };
  const refuge = REFUGES.find(id => world.map.sites[id] && world.map.sites[id].x > world.map.sites[family.homeSiteId].x + 2);
  flee(world, family, { take: {}, refuge });
  for (const beast of beastsOf(world, family, 'horse')) assert.equal(beast.travel?.purpose, 'flee', `${beast.name} was left behind at home`);
  overtake(world, family, { id: 'test-column', name: 'A Mexican column', toward: refuge });
  assert.ok(world.events.some(e => e.householdId === family.id && /The soldiers took 4 horses, the ox, the wagon/.test(e.text)), 'the soldiers took the horses one by one in words');
  validateWorld(world);
});

test('a class saved before opens as it was, and one saved before there were horses can buy one and ride it', () => {
  const world = modestMeans(running('beasts-old'));
  const family = world.households['hh-1'];
  assert.deepEqual(['horse', 'ox', 'wagon'].map(role => beastsOf(world, family, role).map(beast => beast.id)), [['hh-1-horse'], ['hh-1-animal'], ['hh-1-wagon']]);
  // Before there were horses: no horse, and the ox had no species.
  delete world.entities['hh-1-horse'];
  family.property = family.property.filter(id => id !== 'hh-1-horse');
  delete world.entities['hh-1-animal'].species;
  const dir = mkdtempSync(join(tmpdir(), 'texas-beasts-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json'));
    assert.equal(opened.saveVersion, 3);
    const old = opened.world, oldFamily = old.households['hh-1'];
    validateWorld(old);
    assert.equal(beastsOf(old, oldFamily, 'ox').length, 1, 'the ox of a class saved before there were horses is not an ox');
    assert.equal(beastsOf(old, oldFamily, 'horse').length, 0);
    const buyer = old.entities['hh-1-rosa'];
    send(old, buyer, [horse], { mode: 'foot' });
    finish(old, buyer);
    const rider = old.entities['hh-1-thomas'];
    send(old, rider, [{ id: 'store:seed', n: 1, pay: 'coin' }]);
    assert.equal(rider.travel?.mode, 'horse', 'the horse bought is not the family\'s to ride');
    // And the old ox, with no species, still pulls the wagon.
    const driver = old.entities['hh-1-elena'];
    send(old, driver, [{ id: 'store:seed', n: 1, pay: 'coin' }], { mode: 'wagon' });
    assert.equal(driver.travel?.mode, 'wagon');
    validateWorld(old);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("no other family's animals reach a student, and each one bought adds little to the family's own projection", () => {
  // Two families of one wagon and one ox, which is what this counts from (sim/means.mjs gives others more, or a cart).
  const world = modestMeans(modestMeans(running('beasts-fog'), 'hh-1'), 'hh-2');
  const family = world.households['hh-1'], buyer = person(world, 'rosa');
  send(world, buyer, [horse]);
  for (let t = 0; t < 900 && !buyer.leads; t++) stepWorld(world);
  // A neighbour standing on the road beside the led horse sees the person, never the animal.
  const other = world.entities['hh-2-thomas'], stood = other.location;
  other.location = { x: buyer.location.x, y: buyer.location.y, siteId: 'gonzales' };
  const view = projectWorld(world, 'hh-2', 'student', { includeMap: false });
  assert.ok(!(view.entities || []).some(one => one.householdId === 'hh-1'), 'another family\'s things are in the projection');
  assert.ok(!(view.others || []).some(one => one.kind !== 'person'), 'another family\'s animal is seen');
  assert.ok(!JSON.stringify(view).includes('Dandy'), 'another family\'s horse is named to a student');
  other.location = stood;
  assert.deepEqual(errandFor(world, 'hh-2', other.id).animals, ['a horse', 'an ox'], 'the popup counts somebody else\'s animals');
  finish(world, buyer);
  assert.deepEqual(errandFor(world, 'hh-1', buyer.id).animals.slice(0, 2), ['2 horses', 'an ox']);
  // Each animal is one small entity on the family's own wire, and there are at most four of a kind (`BEASTS_MOST`).
  const size = () => JSON.stringify(projectWorld(world, 'hh-1', 'student', { includeMap: false })).length;
  const before = size();
  const more = addBeast(world, family, 'ox', buyer);
  more.borrowedBy = null; more.location = { ...world.entities['hh-1-animal'].location };
  const grew = size() - before;
  assert.ok(grew < 400, `an ox bought grew the family's projection by ${grew} bytes`);
  validateWorld(world);
});

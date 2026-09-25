// The second table of means (owner, 2026-09-25, the evening's amendment: "families should get some starting coin, starting with a
// minimum of 3 coin, and a maximum of 10 coin. this should be a structured part of the wealth d20 roll. yes, it should be possible
// to start with no wagon. it shouldn't block gameplay, but some things might have to happen slower. ... yes, the horse should
// carry a rider."; sim/means.mjs, sim/company.mjs, docs/FAMILY_CREATION.md, docs/SETTLING_IN.md §4b, FIC-GONZ-397).
//
// Held here: every face of the means die gives a fixed coin from 3 to 10 that never falls as the face rises, and it is in the
// house and said with the band; a class that rolled on the first table keeps it, with no coin and the horse led; a family that
// is hard up comes in on foot with its kit on the ox and its food on its own backs, one of it on the horse, and nobody hungry;
// it does the whole of its lesson, brings in a crop that would want the wagon by hand and slower, goes to town more than once for
// a load, flees on foot, and is refused stock in words; and nothing hidden reaches a page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, errandFor, projectFamily, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { eatenADay, familyRoll, meansRoll } from '../sim/family.mjs';
import { ARRIVAL_DAYS, MEANS_BANDS, MEANS_BANDS_BEFORE, MEANS_COIN, carriedOnFoot, coinFor } from '../sim/means.mjs';
import { walkingPace } from '../sim/company.mjs';
import { PACK_SPACE } from '../sim/wagon.mjs';
import { WALK_SPEED } from '../sim/travel.mjs';
import { beastsOf } from '../sim/beasts.mjs';
import { HAND_CARRY_TICKS, choreAvailability } from '../sim/chores.mjs';
import { advanceLessons } from '../sim/lesson.mjs';
import { RIPEN_TICKS } from '../sim/chores.mjs';
import { clearedPlots, plotsOf } from '../sim/fields.mjs';
import { houseSettled } from '../sim/houses.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { plotRefusal } from '../sim/survey.mjs';
import { huntRefusal } from '../sim/hunting.mjs';
import { flee, flightProjection, flightRoom } from '../sim/scrape.mjs';
import { hostOverview } from '../sim/overview.mjs';
import { carriedWithRider, seatOf, walksBeside } from '../public/motion.js';
import { readSave, writeSave } from '../server/storage.mjs';
import { modestMeans, settle, taught } from './support/settled.mjs';

/** A seed whose first family rolls this face of the means die, and this many people when asked. */
function seedFor(face, size = null, stem = 'afoot') {
  for (let n = 0; n < 400000; n++) {
    const seed = `${stem}-${n}`;
    if (meansRoll(seed, 'hh-1') === face && (size === null || familyRoll(seed, 'hh-1') === size)) return seed;
  }
  throw new Error(`no seed for face ${face}`);
}
/** A class in its lobby whose hh-1 has rolled this face (1 or 2 is hard up), with this many people. */
function rolled(face = 1, size = null, { map = 'gonzales', stem = 'afoot' } = {}) {
  const world = createGonzalesWorld(seedFor(face, size, `${stem}-${map}`), 5, { map });
  rollFamily(world, world.households['hh-1']);
  return world;
}
const people = (world, household) => household.members.map(id => world.entities[id]);
function until(world, holds, cap = 4000, what = 'the world never got there') {
  for (let tick = 0; tick < cap; tick++) { if (holds()) return tick; stepWorld(world); }
  assert.ok(holds(), what);
  return cap;
}
const hands = (world, household) => household.members.map(id => world.entities[id])
  .filter(person => (person.age ?? 30) >= 16 && !person.chore && !person.travel && person.location.siteId === household.homeSiteId);
const pointOn = (world, household, refuse) => {
  const bounds = holdingOf(world, household).bounds;
  for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
    const point = { x: +(bounds.minX + (bounds.maxX - bounds.minX) * i / 12).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * j / 12).toFixed(3) };
    if (!refuse(world, household, point)) return point;
  }
  return null;
};

test('every face of the means die gives a fixed coin from 3 to 10, never falling as the face rises, and it is in the house', () => {
  assert.equal(MEANS_COIN.length, 20, 'a face of the die has no coin');
  for (let face = 1; face <= 20; face++) {
    const coin = coinFor(face);
    assert.ok(Number.isInteger(coin) && coin >= 3 && coin <= 10, `face ${face} gives ${coin}`);
    if (face > 1) assert.ok(coin >= coinFor(face - 1), `face ${face} gives less than face ${face - 1}`);
  }
  assert.equal(Math.min(...MEANS_COIN), 3, 'the owner\'s minimum of three is never rolled');
  assert.equal(Math.max(...MEANS_COIN), 10, 'the owner\'s maximum of ten is never rolled');
  assert.deepEqual([...new Set(MEANS_COIN)], [3, 4, 5, 6, 7, 8, 9, 10], 'a sum between is never rolled');
  // Rising with the band: no band's least is below the most of the band under it, and each band's own spread is the table's.
  const spread = band => MEANS_COIN.slice(band.from - 1, band.to);
  assert.deepEqual(MEANS_BANDS.map(band => [Math.min(...spread(band)), Math.max(...spread(band))]), [[3, 3], [3, 4], [5, 6], [7, 8], [9, 10]]);
  for (let i = 1; i < MEANS_BANDS.length; i++) assert.ok(Math.min(...spread(MEANS_BANDS[i])) >= Math.max(...spread(MEANS_BANDS[i - 1])), `${MEANS_BANDS[i].id} starts below ${MEANS_BANDS[i - 1].id}`);
  assert.throws(() => coinFor(0)); assert.throws(() => coinFor(21));
  // Rolled: in the house, on the record, and said with the band on the family's page; one face of each band.
  for (const face of [2, 5, 11, 17, 20]) {
    const world = rolled(face, null, { stem: 'coin' }), household = world.households['hh-1'];
    assert.equal(household.resources.money, coinFor(face), `face ${face}: the family came with other coin than its face gives`);
    assert.equal(household.means.coin, coinFor(face));
    const shown = projectFamily(world, 'hh-1').means;
    assert.equal(shown.coin, coinFor(face));
    assert.match(shown.words, new RegExp(`and ${coinFor(face)} reales\\.$`));
    validateWorld(world);
    // A means record whose coin is not its face's could not have been rolled.
    const bad = structuredClone(world); bad.households['hh-1'].means.coin += 1;
    assert.throws(() => validateWorld(bad), /Invalid means/);
    const none = structuredClone(world); delete none.households['hh-1'].means.coin;
    assert.throws(() => validateWorld(none), /Invalid means/);
  }
  // The families nobody plays come with theirs on the first running tick.
  const world = createGonzalesWorld('coin-nobody', 8);
  world.status = 'running';
  stepWorld(world);
  for (const household of Object.values(world.households)) assert.equal(household.resources.money, household.means.coin, `${household.id} came without its coin`);
});

test('a class that rolled on the first table keeps it: four bands, a cart at the bottom, no coin, and the horse led', () => {
  const old = createGonzalesWorld(seedFor(1, 12, 'first'), 5);
  old.meansRoll = true;
  rollFamily(old, old.households['hh-1']);
  const household = old.households['hh-1'];
  assert.deepEqual(household.means, { roll: 1, band: 'poor', cart: true }, 'a class of the first table rolled on the second');
  assert.equal(MEANS_BANDS_BEFORE[0].to, 6);
  assert.equal(household.resources.money, 0, 'a class of the first table brought coin');
  assert.equal(beastsOf(old, household, 'wagon')[0].cart, true, 'the first table\'s poorest had no cart');
  assert.ok(people(old, household).every(one => !one.travel.saddle), 'the horse carried a rider in a class of the first table');
  assert.equal(projectFamily(old, 'hh-1').means.words, "A cart and one ox to draw it, and the family's horse.");
  validateWorld(old);
  // Saved and opened as it was, and a coin on the first table could not have been rolled.
  const dir = mkdtempSync(join(tmpdir(), 'afoot-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world: old });
    const opened = readSave(join(dir, 'save.json')).world;
    validateWorld(opened);
    assert.deepEqual(opened.households['hh-1'].means, household.means);
    assert.equal(opened.meansRoll, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const bad = structuredClone(old); bad.households['hh-1'].means.coin = 3;
  assert.throws(() => validateWorld(bad), /Invalid means/);
  const walker = structuredClone(old); walker.households['hh-1'].means.afoot = true;
  assert.throws(() => validateWorld(walker), /Invalid means/);
});

test('a family that is hard up walks in: its kit on the ox, its food on its own backs, one on the horse, nobody hungry', () => {
  for (const size of [1, 4, 9, 16]) {
    const world = rolled(1, size), household = world.households['hh-1'];
    assert.equal(household.means.band, 'hard-up');
    assert.equal(beastsOf(world, household, 'wagon').length, 0, 'a family on foot came with a vehicle');
    assert.equal(beastsOf(world, household, 'ox').length, 1, 'a family on foot has no ox to carry its packs');
    // The kit: the hoe, the axe, the seed and a shot, in the ox's packs.
    for (const id of ['hoe', 'axe', 'seed', 'powder']) assert.ok(household.load.some(entry => entry.id === id), `the packs left the ${id} behind`);
    assert.ok(household.resources.seed >= 2);
    // Five days of food, all of it carried, and no more than its people can carry.
    const eaters = people(world, household);
    assert.ok(household.resources.food / eatenADay(world, eaters) >= ARRIVAL_DAYS - 1e-9, `${size} on foot arrive hungry`);
    assert.ok(household.packs.food <= carriedOnFoot(world, household));
    // On the road in: on foot, nobody driving, one on the horse, the rest walking, at the pace of the slowest walker.
    const seats = eaters.map(one => one.travel);
    assert.ok(seats.every(travel => travel.mode === 'foot' && travel.purpose === 'arrive'), 'somebody of a family on foot goes by the wagon');
    assert.equal(seats.filter(travel => travel.drives).length, 0, 'somebody drives what the family has not got');
    assert.equal(seats.filter(travel => travel.saddle && !travel.carried).length, 1, 'nobody rides the horse');
    const walkers = eaters.filter(one => one.travel.afoot && !one.travel.carried);
    assert.equal(eaters[0].travel.speed, walkers.length ? Math.min(WALK_SPEED, ...walkers.map(walkingPace)) : WALK_SPEED);
    for (const id of household.property) assert.equal(world.entities[id].travel?.mode, 'foot', `${id} is not walked in`);
    // The page draws the walkers in a file and the rider in the saddle (public/motion.js), and the horse not again by itself.
    const seen = projectWorld(world, 'hh-1', 'student', { includeMap: false }).entities;
    for (const one of walkers) assert.equal(walksBeside(seen.find(other => other.id === one.id)), true, `${one.id} walking in is not drawn in the file`);
    const mounted = seen.find(other => other.travel?.saddle && !other.travel.carried);
    assert.equal(seatOf(mounted, seen), 'horse', 'the rider on the horse is not drawn in the saddle');
    assert.equal(carriedWithRider(seen.find(other => other.id === 'hh-1-horse'), seen), true, 'the ridden horse is drawn again by itself');
    // What the page is told: packs, and the seats words say who rides the horse.
    assert.equal(projectWorld(world, 'hh-1', 'student', { includeMap: false }).wagon.vehicle, 'packs');
    assert.equal(projectWorld(world, 'hh-1', 'student', { includeMap: false }).wagon.space, PACK_SPACE);
    assert.match(projectFamily(world, 'hh-1').means.seats, size === 1 ? /^They ride the horse\.$/ : /^1 rides the horse and \d+ walks?\.$/);
    // In: every one of them, the ox and the horse on the land, and the line says what was carried.
    world.status = 'running';
    until(world, () => !household.arriving, 900, 'the family on foot never came in');
    for (const id of [...household.members, ...household.property]) assert.equal(world.entities[id].location.siteId, household.homeSiteId, `${id} was left on the road`);
    const line = world.events.find(event => event.type === 'arrival' && event.householdId === 'hh-1').text;
    assert.match(line, /camp by their packs/);
    assert.match(line, /They carried \d+ food on their backs, in sacks and bundles, and the ox carried the rest\./);
    validateWorld(world);
  }
  // The pack screen refuses in the packs' own words, and stock cannot come in with a full pack.
  const world = rolled(2, 6, { stem: 'packs' }), household = world.households['hh-1'];
  assert.throws(() => applyAction(world, 'hh-1', { action: 'load-wagon', item: 'chest', amount: 1 }), /the packs have \d+ left of 7/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'bring-stock', stock: true }), /Driving stock leaves the packs 5 spaces, and they are loaded with 7\./);
  assert.equal(household.stock, undefined);
});

test('a family with no vehicle does the whole of its lesson, and sells its crop in town on foot', () => {
  const world = rolled(1, 5, { stem: 'lesson' });
  const household = world.households['hh-1'];
  household.played = true;
  world.status = 'running';
  const step = () => projectWorld(world, 'hh-1', 'student', { includeMap: false }).lesson?.step ?? 'done';
  const send = input => applyAction(world, 'hh-1', input);
  assert.equal(step(), 'arrive');
  assert.match(projectWorld(world, 'hh-1', 'student', { includeMap: false }).lesson.says, /walking the track in/);
  until(world, () => !household.arriving);
  assert.equal(step(), 'order');
  send({ action: 'plan-house', layout: 'jacal' });
  for (const person of hands(world, household)) send({ action: 'chore', entityId: person.id, chore: 'build-house' });
  until(world, () => houseSettled(household));
  const plot = pointOn(world, household, plotRefusal);
  send({ action: 'survey-plot', entityId: hands(world, household)[0].id, x: plot.x, y: plot.y });
  until(world, () => plotsOf(world, household).length > 1);
  for (const person of hands(world, household)) send({ action: 'clear-plot', entityId: person.id, x: plot.x, y: plot.y });
  until(world, () => clearedPlots(household).length > 1);
  assert.equal(step(), 'plant');
  // The packs brought seed for one plot; the rest is bought at the store on foot, with the coin the family came with.
  const buyer = hands(world, household)[0];
  send({ action: 'chore', entityId: buyer.id, chore: 'visit-shop', errand: [{ id: 'store:seed', n: 1, pay: 'coin' }] });
  assert.notEqual(buyer.chore.mode, 'wagon');
  until(world, () => !buyer.chore && household.resources.seed >= 4, 4000, 'the seed was never bought');
  const planter = hands(world, household)[0];
  send({ action: 'chore', entityId: planter.id, chore: 'plant-field' });
  until(world, () => planter.chore?.ask?.id === 'crop-choice');
  send({ action: 'answer-chore', entityId: planter.id, option: 'corn' });
  until(world, () => household.field.state === 'planted');
  until(world, () => household.field.state === 'ripe', RIPEN_TICKS * 4);
  send({ action: 'chore', entityId: hands(world, household)[0].id, chore: 'harvest-field' });
  until(world, () => household.field.state === 'bare');
  assert.equal(step(), 'sell');
  // The sale on foot: five food for a real, the coin it came with not counted as a sale.
  const coinBefore = household.resources.money;
  advanceLessons(world);
  assert.equal(step(), 'sell', 'the coin the family came with was taken for a crop sold');
  household.resources.food = Math.max(household.resources.food, 12);
  const seller = hands(world, household)[0];
  send({ action: 'chore', entityId: seller.id, chore: 'visit-shop', errand: [{ id: 'store:food', n: 1, pay: 'coin' }] });
  assert.notEqual(seller.chore.mode, 'wagon', 'a family with no wagon was sent by the wagon');
  until(world, () => household.resources.money > coinBefore);
  assert.equal(step(), 'hunt');
  const ground = pointOn(world, household, huntRefusal);
  const hunter = hands(world, household)[0];
  send({ action: 'hunt-land', entityId: hunter.id, x: ground.x, y: ground.y });
  until(world, () => hunter.chore?.ask?.id === 'shot');
  send({ action: 'answer-chore', entityId: hunter.id, option: 'take' });
  until(world, () => !hunter.chore);
  if (step() === 'well') {
    for (const person of hands(world, household)) send({ action: 'chore', entityId: person.id, chore: 'dig-well' });
    until(world, () => household.well === true, 4000, 'the well was never dug');
  }
  advanceLessons(world);
  assert.equal(household.lesson.step, 'done', 'the family with no vehicle never finished its lesson');
  assert.equal(beastsOf(world, household, 'wagon').length, 0, 'the lesson was done with a vehicle after all');
  validateWorld(world);
});

test('a crop that would want the wagon is brought in by hand by a family with none, and slower; one whose wagon is away is told so', () => {
  const ripe = world => { const household = world.households['hh-1']; household.field = { ...household.field, cleared: 3, state: 'ripe', changedTick: 0 }; return household; };
  const bringIn = (world, household) => {
    const worker = people(world, household).find(one => one.age >= 16 && !one.chore);
    applyAction(world, 'hh-1', { action: 'chore', entityId: worker.id, chore: 'harvest-field' });
    const held = worker.chore.with;
    return { held, ticks: until(world, () => !worker.chore, 900) };
  };
  const walking = taught(settle(rolled(1, 5, { stem: 'hand' }))), afootFamily = ripe(walking);
  walking.status = 'running'; afootFamily.played = true;
  const byHand = bringIn(walking, afootFamily);
  assert.equal(byHand.held, undefined, 'a family with no wagon was held to one');
  assert.ok(afootFamily.resources.food > 0 && afootFamily.field.state === 'bare', 'the crop was not brought in');
  const driving = taught(settle(modestMeans(rolled(1, 5, { stem: 'hand' })))), wagonFamily = ripe(driving);
  driving.status = 'running'; wagonFamily.played = true;
  const byWagon = bringIn(driving, wagonFamily);
  assert.deepEqual(byWagon.held, ['ox', 'wagon']);
  assert.ok(byHand.ticks >= byWagon.ticks + HAND_CARRY_TICKS - 1, `by hand took ${byHand.ticks} ticks and by the wagon ${byWagon.ticks}`);
  // A family whose wagon is away is still told to fetch it: that is a thing a family can get wrong, not a lack.
  const away = taught(settle(modestMeans(rolled(1, 5, { stem: 'hand' })))); ripe(away); away.status = 'running';
  away.entities['hh-1-wagon'].location = { ...away.map.sites.gonzales, siteId: 'gonzales' };
  const worker = people(away, away.households['hh-1']).find(one => one.age >= 16);
  assert.match(choreAvailability(away, away.households['hh-1'], worker, 'harvest-field').why, /wants the wagon, and the wagon is not here/);
  validateWorld(walking);
});

test('a family with no vehicle goes to town more than once for a big load, and flees east on foot with one on the horse', () => {
  const world = taught(settle(rolled(2, 8, { map: 'colonies', stem: 'town' })));
  world.status = 'running';
  const household = world.households['hh-1'];
  household.played = true;
  household.resources.food = 40;
  const seller = people(world, household).find(one => one.age >= 16);
  // Ten lots of food is more than a horse carries: refused in words that do not tell it to wait for a wagon it has not got.
  const big = errandFor(world, 'hh-1', seller.id, [{ id: 'store:food', n: 2, pay: 'coin' }]).quote;
  assert.equal(big.can, false);
  assert.match(big.why, /This wants the wagon: 10 loads, and the horse carries 7\. Your family has no wagon\. Send a smaller load, and go again for the rest\./);
  const small = errandFor(world, 'hh-1', seller.id, [{ id: 'store:food', n: 1, pay: 'coin' }]).quote;
  assert.equal(small.can, true, small.why);
  // The flight: on foot, room for what its grown people carry, one of it on the horse.
  household.flight = { status: 'ordered', orderedMinute: world.minute };
  world.period = 3;
  assert.equal(flightRoom(world, household).mode, 'foot');
  const shown = flightProjection(world, household);
  flee(world, household, { take: {}, refuge: shown.refuges[0].id });
  const going = people(world, household).filter(one => one.travel?.purpose === 'flee');
  assert.equal(going.length, household.members.length);
  assert.ok(going.every(one => one.travel.mode === 'foot'));
  assert.equal(going.filter(one => one.travel.saddle && !one.travel.carried).length, 1, 'nobody rode the horse east');
  assert.match(world.events.find(event => /set out east/.test(event.text)).text, / on foot\.$/);
  validateWorld(world);
});

test('nothing hidden reaches a page from a family on foot; the horse rider and the coin cost the wire little', () => {
  const world = rolled(1, 20, { stem: 'wire' });
  for (const entity of Object.values(world.entities)) if (entity.traits) entity.traits = { strength: 9187, health: 9281, housework: 9373 };
  const leak = /9187|9281|9373|"traits"|"strength"|"housework"/;
  world.status = 'running';
  stepWorld(world);
  assert.doesNotMatch(JSON.stringify(projectFamily(world, 'hh-1')), leak);
  assert.doesNotMatch(JSON.stringify(projectWorld(world, 'hh-1', 'student', { includeMap: false })), leak);
  assert.doesNotMatch(JSON.stringify(hostOverview(world)), leak);
  // Another family is sent none of it.
  const other = JSON.stringify(projectWorld(world, 'hh-2', 'student', { includeMap: false }));
  assert.ok(!other.includes('"saddle"') || !world.households['hh-2'].members.every(id => !world.entities[id].travel?.saddle), 'the horse rider of another family reached a student');
  assert.ok(!/"coin":/.test(JSON.stringify(projectFamily(world, 'hh-2')).replace(`"coin":${world.households['hh-2'].means.coin}`, '')), "one family's book carries another's coin");
  // The saddle on the wire: one field on one person.
  const view = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const bare = structuredClone(view);
  for (const entity of bare.entities) if (entity.travel) delete entity.travel.saddle;
  const cost = JSON.stringify(view).length - JSON.stringify(bare).length;
  assert.ok(cost > 0 && cost <= 2 * 16, `the saddle costs ${cost} bytes a tick`);
});

// The errand to town, and one person at a time with the family's things (owner, 2026-09-24; docs/TOWNS.md §4b).
//
// > "When sending someone to town to stores, there should be a popup first asking what they should buy or sell. (Currently
// > I can't buy more seed.) They'll take priority on the wagon and take it so they can carry whatever it is they need to. If
// > someone is using the wagon (or horse, or any item really), then no one else can use it."
//
// Held here: the seed that could not be bought (a walk to town that asked what to buy only on arrival, and bought nothing
// when nobody answered - at once for a person on auto); the list checked before anything moves and done exactly, with the
// honest rule when things differ on arrival; the way of going chosen from the load; the wagon, the horse, the ox and the
// rifle refused to a second person in the holder's name; every way a use ends letting go of it; an old save opening with
// its uses; and the popup's facts carrying nothing of anybody else's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettledWorld, modestMeans, settle, taught } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, errandFor, projectWorld, stepWorld, travelModesFor, validateWorld } from '../sim/world.mjs';
import { propertyId } from '../sim/travel.mjs';
import { userOf } from '../sim/keeping.mjs';
import { REFUGES, flee } from '../sim/scrape.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import { byShop, errandList, stockWords } from '../public/errand.js';

/** A settled class under way, its first family a student's and past the guided start. */
function running(seed) {
  // hh-1 has the one wagon and one ox these tests are about (sim/means.mjs gives a family of other means more or a cart).
  const world = modestMeans(taught(createSettledWorld(seed, 5)));
  world.status = 'running';
  world.households['hh-1'].played = true;
  return world;
}
const household = world => world.households['hh-1'];
const person = (world, name) => world.entities[`hh-1-${name}`];
const send = (world, who, errand) => applyAction(world, 'hh-1', { action: 'chore', entityId: who.id, chore: 'visit-shop', errand });
const quote = (world, who, errand) => errandFor(world, 'hh-1', who.id, errand).quote;
const finish = (world, who, cap = 900) => { for (let t = 0; t < cap && who.chore; t++) stepWorld(world); assert.equal(who.chore, null, `${who.name} never finished`); };
const story = (world, from = 0) => world.events.slice(from).filter(event => event.householdId === 'hh-1').map(event => event.text);
const beast = (world, role) => world.entities[propertyId('hh-1', role)];

test('the seed the owner could not buy: with the list sent, a person on auto comes home with it, and nobody is asked anything in town', () => {
  // The cause (sim/errands.mjs): the walk asked which shop and what at its counter only on arrival, and silence - two hours
  // of 1835, at once for a person on auto - answered "come home again". The same trip for somebody on auto, and for somebody
  // by hand whose student is looking at anything else, must bring the seed home.
  for (const auto of [true, false]) {
    const world = running(`errand-seed-${auto}`);
    const family = household(world), buyer = person(world, 'rosa');
    family.resources = { ...family.resources, seed: 2, food: 20, money: 0 };
    if (auto) applyAction(world, 'hh-1', { action: 'set-auto', entityId: buyer.id, auto: true });
    const from = world.events.length;
    send(world, buyer, [{ id: 'store:seed', n: 2, pay: 'food' }]);
    let asked = 0;
    for (let t = 0; t < 900 && buyer.chore; t++) { stepWorld(world); if (buyer.chore?.ask) asked++; }
    assert.equal(buyer.chore, null, 'the errand never finished');
    assert.equal(asked, 0, `${auto ? 'a person on auto' : 'a person by hand'} was asked something in town for ${asked} ticks`);
    assert.equal(family.resources.seed, 6, `${auto ? 'on auto' : 'by hand'}, the seed did not come home: ${family.resources.seed}`);
    assert.ok(story(world, from).some(text => /bought 4 seed at the store for 6 food\./.test(text)), 'the purchase is not in the family\'s story');
    assert.equal(buyer.location.siteId, family.homeSiteId, 'they did not come home');
    validateWorld(world);
  }
});

test('the seed can be bought on the guided start\'s planting step, and the popup says when a step does not allow the trip', () => {
  const world = running('errand-lesson');
  const family = household(world), buyer = person(world, 'rosa');
  family.resources = { ...family.resources, seed: 2, food: 12 };
  family.lesson = { step: 'survey' };
  // Step four is surveying: the town is shut, and the popup says so in the lesson's own words before anybody presses Send.
  assert.match(errandFor(world, 'hh-1', buyer.id).shut, /^Not yet - first, stake out ten acres/);
  assert.throws(() => send(world, buyer, [{ id: 'store:seed', n: 1, pay: 'food' }]), /Not yet/);
  // Planting, with not seed enough for the field: the store is how a student gets it (docs/LESSON.md step 6).
  family.lesson = { step: 'plant' };
  assert.equal(errandFor(world, 'hh-1', buyer.id).shut, undefined);
  send(world, buyer, [{ id: 'store:seed', n: 1, pay: 'food' }]);
  finish(world, buyer);
  assert.equal(family.resources.seed, 4);
  validateWorld(world);
});

test('the list is checked before anybody leaves, in its order and against what the house holds, and refused in plain words', () => {
  const world = running('errand-check');
  const family = household(world), buyer = person(world, 'rosa');
  family.resources = { ...family.resources, food: 0, money: 0, cotton: 4, seed: 0 };
  const why = errand => quote(world, buyer, errand)?.why ?? errandFor(world, 'hh-1', buyer.id, errand).quote?.why;
  assert.equal(errandFor(world, 'hh-1', buyer.id, []).quote, undefined, 'an empty list was quoted');
  assert.throws(() => send(world, buyer, []), /Choose something to buy or sell first/);
  assert.match(why([{ id: 'store:gold', n: 1, pay: 'coin' }]), /not sold in this town/);
  assert.match(why([{ id: 'store:cotton', n: 1, pay: 'food' }, { id: 'store:cotton', n: 1, pay: 'coin' }]), /on the list twice/);
  assert.match(why([{ id: 'store:seed', n: 1.5, pay: 'food' }]), /whole numbers/);
  assert.match(why([{ id: 'doctor:see', n: 2, pay: 'coin' }]), /one is all anybody needs/);
  assert.match(why([{ id: 'blacksmith:tool-froe', n: 5, pay: 'coin' }]), /at most 4 on one trip/);
  assert.match(why([{ id: 'store:seed', n: 1, pay: 'coin' }]), /costs 1 real, and there will not be that much coin/);
  assert.match(why([{ id: 'store:cotton', n: 5, pay: 'food' }]), /There will not be 5 cotton in the house to sell/);
  assert.match(why([{ id: 'store:hoe', n: 1, pay: 'food' }]), /paid in coin only/);
  // A keeper who is not at the shop keeps nothing today.
  world.entities['town-gunsmith-gonzales'].health = { condition: 'minor-injury' };
  assert.match(why([{ id: 'gunsmith:powder', n: 1, pay: 'coin' }]), /Nobody keeps the gunsmith's in Gonzales today/);
  // The cotton sold for food pays for the seed, with no food in the house at all.
  const good = quote(world, buyer, [{ id: 'store:cotton', n: 3, pay: 'food' }, { id: 'store:seed', n: 2, pay: 'food' }]);
  assert.equal(good.can, true, good.why);
  assert.deepEqual({ cotton: good.after.cotton, seed: good.after.seed, food: good.after.food }, { cotton: 1, seed: 4, food: 0 });
  // Carried out: 3 cotton out, 6 food got and paid straight back, 4 seed home - the load is the larger way, 4.
  assert.equal(good.load, 4);
  // Sales are made before purchases whichever the student put first (sim/errands.mjs `inTurn`): the same list the other way
  // round is the same errand.
  const turned = quote(world, buyer, [{ id: 'store:seed', n: 2, pay: 'food' }, { id: 'store:cotton', n: 3, pay: 'food' }]);
  assert.deepEqual([turned.can, turned.after, turned.load], [true, good.after, good.load]);
  // Buying what nothing on the list pays for is refused rather than half done.
  assert.match(why([{ id: 'store:seed', n: 3, pay: 'food' }, { id: 'store:cotton', n: 3, pay: 'food' }]), /costs 9 food, and there will not be that much food/);
  // A refused order moves nothing and holds nothing.
  assert.throws(() => send(world, buyer, [{ id: 'store:seed', n: 1, pay: 'coin' }]), /not be that much coin/);
  assert.equal(buyer.chore, null);
  for (const item of ['horse', 'ox', 'wagon', 'rifle']) assert.equal(userOf(world, family, item), null, `a refused errand held the ${item}`);
  validateWorld(world);
});

test('the list is done exactly at the shops, the coin is in the account, and the store buys cotton outside its purse', () => {
  const world = running('errand-done');
  const family = household(world), buyer = person(world, 'rosa');
  family.resources = { ...family.resources, food: 20, money: 1, cotton: 6, seed: 0, hides: 3 };
  delete family.tools.auger;
  const marta = world.entities['town-ibarra'], tanner = world.entities['town-tanner-gonzales'];
  marta.purse = 0; tanner.purse = 1;
  const coinBefore = world.events.filter(event => event.householdId === 'hh-1' && Number.isInteger(event.coin)).reduce((sum, event) => sum + event.coin, 0);
  const from = world.events.length;
  const list = [
    { id: 'store:cotton', n: 4, pay: 'coin' }, // 4 reales, outside Marta's empty purse (owner, 2026-09-16)
    { id: 'tanner:hides', n: 3, pay: 'coin' }, // the tanner has a real, so one hide sold and two home again
    { id: 'blacksmith:tool-auger', n: 1, pay: 'coin' }, // 2 reales of the 5 then in hand
    { id: 'store:seed', n: 2, pay: 'coin' }, // 2 reales, 4 seed
  ];
  const planned = quote(world, buyer, list);
  assert.equal(planned.can, true, planned.why);
  send(world, buyer, list);
  finish(world, buyer);
  assert.equal(family.resources.cotton, 2);
  assert.equal(family.resources.hides, 2, 'the tanner paid for hides he had no coin for');
  assert.equal(family.tools.auger, 0);
  assert.equal(family.resources.seed, 4);
  // 1 + 4 (cotton) + 1 (a hide) - 2 (auger) - 2 (seed) = 2.
  assert.equal(family.resources.money, 2);
  assert.equal(marta.purse, 2, 'coin paid for the seed did not go into the purse, or the cotton was paid from it');
  assert.equal(tanner.purse, 0);
  const told = story(world, from);
  assert.ok(told.some(text => /sold 4 cotton to Marta Ibarra for 4 reales/.test(text)), told.join(' | '));
  assert.ok(told.some(text => /had coin for only 1 hides, and the rest came home again/.test(text)), told.join(' | '));
  const coinAfter = world.events.filter(event => event.householdId === 'hh-1' && Number.isInteger(event.coin)).reduce((sum, event) => sum + event.coin, 0);
  assert.equal(coinAfter - coinBefore, 1, 'the ending\'s account does not add up to the coin that moved');
  validateWorld(world);
});

test('what differs on arrival is done as far as it can be, nothing is paid for what is not received, and it is said', () => {
  const world = running('errand-differs');
  const family = household(world), buyer = person(world, 'rosa');
  family.resources = { ...family.resources, food: 0, money: 3, seed: 0 };
  send(world, buyer, [{ id: 'store:seed', n: 3, pay: 'coin' }]);
  // While they are on the road a sibling spends two of the three reales.
  for (let t = 0; t < 900 && buyer.travel?.to !== 'gonzales'; t++) stepWorld(world);
  family.resources.money = 1;
  const from = world.events.length;
  finish(world, buyer);
  assert.equal(family.resources.seed, 2, 'more seed came home than there was coin for');
  assert.equal(family.resources.money, 0, 'coin went for seed that never came');
  assert.ok(story(world, from).some(text => /could do only 1 of 3: buy seed - It costs 1 real, and there is not that much coin in the house\./.test(text)), story(world, from).join(' | '));
  validateWorld(world);
});

test('the student may choose any slower way that carries the load and is free, and the server holds the choice to it', () => {
  // Owner, 2026-09-24: "let the student choose" - the popup suggests the quickest, and walking so the horse stays home is theirs.
  const world = running('errand-choose');
  const family = household(world), buyer = person(world, 'rosa'), other = person(world, 'mateo');
  family.resources = { ...family.resources, food: 60, money: 10, cotton: 30, seed: 0 };
  const seed = [{ id: 'store:seed', n: 1, pay: 'coin' }];
  const quoted = errandFor(world, 'hh-1', buyer.id, seed).quote;
  assert.equal(quoted.quickest, 'horse');
  assert.deepEqual(quoted.ways.map(way => [way.id, way.can]), [['horse', true], ['foot', true], ['wagon', true]]);
  // Walking, chosen: said as the student's choice, with what would have been quicker.
  const walked = errandFor(world, 'hh-1', buyer.id, seed, 'foot').quote;
  assert.deepEqual([walked.can, walked.mode, walked.how], [true, 'foot', 'Goes on foot: 2 of 5 loads, as you chose. The horse would be quicker.']);
  // A way too small for the load is shut, in the server's words, and refused if chosen anyway.
  const six = [{ id: 'store:seed', n: 3, pay: 'coin' }];
  const tooMuch = errandFor(world, 'hh-1', buyer.id, six, 'foot').quote;
  assert.equal(tooMuch.can, false);
  assert.equal(tooMuch.why, 'On foot a person carries 5, and this is 6 loads.');
  assert.equal(tooMuch.ways.find(way => way.id === 'foot').why, tooMuch.why);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: buyer.id, chore: 'visit-shop', errand: six, mode: 'foot' }), /On foot a person carries 5, and this is 6 loads\./);
  // A way somebody else has is shut in their name.
  beginTravel(world, other, 'gonzales', null, 'visit', 'horse');
  const taken = errandFor(world, 'hh-1', buyer.id, seed, 'horse').quote;
  assert.equal(taken.why, `${other.name} has the horse, on the road to Gonzales.`);
  assert.equal(taken.ways.find(way => way.id === 'horse').can, false);
  // The order carries the choice, and goes that way: the wagon, chosen for two seed, keeps the horse free for nobody else here.
  applyAction(world, 'hh-1', { action: 'chore', entityId: buyer.id, chore: 'visit-shop', errand: seed, mode: 'wagon' });
  assert.equal(buyer.travel?.mode, 'wagon', 'the chosen way was not the way they went');
  // Without a choice the order takes the quickest, as it always did.
  const thomas = person(world, 'thomas');
  applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'visit-shop', errand: seed });
  assert.equal(thomas.travel?.mode, 'foot', 'with the horse and the wagon away, the quickest is walking');
  validateWorld(world);
});

test('the way of going is the quickest that carries the load, said with the server\'s numbers', () => {
  const world = running('errand-mode');
  const family = household(world), buyer = person(world, 'rosa'), other = person(world, 'mateo');
  family.resources = { ...family.resources, food: 60, money: 10, cotton: 30, seed: 0 };
  assert.equal(quote(world, buyer, [{ id: 'store:seed', n: 1, pay: 'coin' }]).how, 'Rides the horse: 2 of 7 loads.');
  assert.equal(quote(world, buyer, [{ id: 'store:cotton', n: 14, pay: 'coin' }]).how, 'Takes the wagon: 14 of 20 loads, more than the horse carries (7).');
  assert.match(quote(world, buyer, [{ id: 'store:cotton', n: 20, pay: 'food' }]).why, /That is 40 loads, and the wagon carries 20\. Send less\./);
  assert.equal(quote(world, buyer, [{ id: 'wheelwright:wagon', n: 1, pay: 'coin' }]).how, 'Takes the wagon: 0 of 20 loads, and the wheelwright works on the wagon itself.');
  // The horse taken: a small load walks, and says who has the horse; one the legs cannot carry takes the wagon.
  beginTravel(world, other, 'gonzales', null, 'visit', 'horse');
  assert.equal(quote(world, buyer, [{ id: 'store:seed', n: 1, pay: 'coin' }]).how, `Goes on foot: 2 of 5 loads. ${other.name} has the horse, on the road to Gonzales.`);
  assert.equal(quote(world, buyer, [{ id: 'store:seed', n: 3, pay: 'coin' }]).how, `Takes the wagon: 6 of 20 loads. ${other.name} has the horse, on the road to Gonzales.`);
  // And the errand goes the way it was quoted: the wagon and the ox with them, theirs until home.
  send(world, buyer, [{ id: 'store:cotton', n: 14, pay: 'coin' }]);
  assert.equal(buyer.travel?.mode, 'wagon');
  for (const role of ['ox', 'wagon']) assert.equal(beast(world, role).borrowedBy, buyer.id, `the ${role} did not go with them`);
  validateWorld(world);
});

test('the wagon, the horse, the ox and the rifle are one person\'s at a time: the second is told who has it and what they are doing', () => {
  const world = running('errand-exclusive');
  const family = household(world), rosa = person(world, 'rosa'), mateo = person(world, 'mateo'), thomas = person(world, 'thomas');
  family.resources = { ...family.resources, food: 60, money: 10, cotton: 30, powder: 10 };
  // Rosa takes the wagon to town with fourteen bales.
  send(world, rosa, [{ id: 'store:cotton', n: 14, pay: 'coin' }]);
  const has = `${rosa.name} has the ox and wagon, on the road to Gonzales.`;
  assert.equal(travelModesFor(world, mateo).find(mode => mode.id === 'wagon').why, has);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: household(world).principalId, destination: 'gonzales', mode: 'wagon' }), new RegExp(has.replace('.', '\\.')));
  // The popup says so, and what the student can do about it.
  assert.equal(quote(world, mateo, [{ id: 'store:cotton', n: 10, pay: 'coin' }]).why, `This wants the wagon: 10 loads, and the horse carries 7. ${has} Send a smaller load, or wait until the wagon is free.`);
  // A smaller load goes anyway, on the horse.
  assert.equal(quote(world, mateo, [{ id: 'store:cotton', n: 5, pay: 'coin' }]).mode, 'horse');
  // The rifle: Mateo out hunting, and Thomas told so.
  applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' });
  const hunts = projectWorld(world, 'hh-1', 'student', { includeMap: false }).work[thomas.id].find(entry => entry.id === 'practise-shooting');
  assert.equal(hunts.can, false);
  assert.match(hunts.why, new RegExp(`^${mateo.name} has the rifle, `));
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'hunt-timber' }), new RegExp(`${mateo.name} has the rifle`));
  // Nor can the rifle go to the gunsmith while it is in the timber.
  assert.match(quote(world, thomas, [{ id: 'gunsmith:rifle', n: 1, pay: 'coin' }]).why, new RegExp(`${mateo.name} has the rifle`));
  validateWorld(world);
});

test('the ox hauling logs and the wagon in a harvest are held at home: shared by the harvesters, and nobody drives them away', () => {
  const world = running('errand-home-use');
  const family = household(world), rosa = person(world, 'rosa'), mateo = person(world, 'mateo'), elena = person(world, 'elena');
  family.resources.food = 60;
  // Somebody dragging a load behind the ox (sim/felling.mjs): the ox is theirs until the hauling is done.
  rosa.chore = { id: 'haul-logs', step: 0, wait: 2, doing: 'dragging 6 logs behind the ox', with: ['ox'] };
  assert.equal(travelModesFor(world, mateo).find(mode => mode.id === 'wagon').why, `${rosa.name} has the ox, dragging 6 logs behind the ox.`);
  rosa.chore = null;
  assert.equal(travelModesFor(world, mateo).find(mode => mode.id === 'wagon').can, true, 'the ox was not let go when the hauling stopped');
  // A crop that wants the wagon: two bring it in together, and the wagon stays in the field.
  family.field = { ...family.field, cleared: 3, state: 'ripe', changedTick: 0 };
  for (const plot of family.plots || []) if (plot.state === 'cleared') plot.sown = true;
  applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'harvest-field' });
  assert.deepEqual(rosa.chore.with, ['ox', 'wagon']);
  applyAction(world, 'hh-1', { action: 'chore', entityId: elena.id, chore: 'harvest-field' });
  assert.equal(elena.chore?.id, 'harvest-field', 'a second harvester was refused the wagon standing in the field');
  assert.match(travelModesFor(world, mateo).find(mode => mode.id === 'wagon').why, new RegExp(`has the ox and wagon, `));
  assert.match(quote(world, mateo, [{ id: 'store:seed', n: 5, pay: 'food' }]).why ?? '', /This wants the wagon/);
  validateWorld(world);
});

test('every way a use ends lets go of it: home, called off, answered away, the flight east, and death', () => {
  // Home again, from an errand with the wagon.
  {
    const world = running('release-home');
    const rosa = person(world, 'rosa');
    household(world).resources.cotton = 14;
    send(world, rosa, [{ id: 'store:cotton', n: 14, pay: 'coin' }]);
    assert.equal(userOf(world, household(world), 'wagon'), rosa);
    finish(world, rosa);
    for (const role of ['ox', 'wagon']) assert.equal(userOf(world, household(world), role), null, `the ${role} is still held after the errand came home`);
  }
  // Called off, before the road and on it.
  {
    const world = running('release-stop');
    const mateo = person(world, 'mateo');
    household(world).resources.powder = 6;
    applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'make-furniture', mode: 'horse' });
    assert.equal(userOf(world, household(world), 'horse'), mateo, 'work given with the horse did not hold it');
    applyAction(world, 'hh-1', { action: 'stop-chore', entityId: mateo.id });
    assert.equal(userOf(world, household(world), 'horse'), null);
    applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' });
    assert.equal(userOf(world, household(world), 'rifle'), mateo);
    applyAction(world, 'hh-1', { action: 'stop-chore', entityId: mateo.id });
    assert.equal(userOf(world, household(world), 'rifle'), null, 'the rifle stayed held after the hunt was called off');
  }
  // A question nobody answers lapses into the hunt's own end, and the rifle comes home with the hunter.
  {
    const world = running('release-lapse');
    const mateo = person(world, 'mateo');
    household(world).resources.powder = 6;
    applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' });
    finish(world, mateo);
    assert.ok(world.events.some(event => event.actorId === mateo.id && /Nobody answered/.test(event.text)), 'the question never lapsed, so this proves nothing about it');
    assert.equal(userOf(world, household(world), 'rifle'), null);
  }
  // Answered away: a call answered drops the work (sim/world.mjs `abandonChore`), and what it held with it.
  {
    const world = running('release-call');
    const mateo = person(world, 'mateo');
    household(world).resources.powder = 6;
    applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' });
    mateo.chore = null; // exactly what `abandonChore` does to the work
    assert.equal(userOf(world, household(world), 'rifle'), null);
  }
  // Dead: a hunter who dies holds nothing, the tick they die, before the work is cleared.
  {
    const world = running('release-death');
    const mateo = person(world, 'mateo');
    household(world).resources.powder = 6;
    applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' });
    mateo.health = { condition: 'dead' };
    assert.equal(userOf(world, household(world), 'rifle'), null, 'the dead still hold the rifle');
    stepWorld(world);
    assert.equal(mateo.chore, null);
  }
});

test("the flight east takes the family's things from whatever work had them at home, and none stays held", () => {
  // On the real land, where the road east runs to the refuges (sim/scrape.mjs `REFUGES`).
  const world = taught(settle(createGonzalesWorld('release-flight', 5, { map: 'colonies' })));
  world.status = 'running';
  const family = Object.values(world.households).find(one => REFUGES.some(id => world.map.sites[id] && world.map.sites[id].x > world.map.sites[one.homeSiteId].x + 2));
  assert.ok(family, 'no family has a refuge east of it, so this proves nothing');
  family.played = true;
  const [hunter, hauler] = family.members.map(id => world.entities[id]).filter(one => (one.age ?? 30) >= 16);
  family.resources.powder = 6;
  applyAction(world, family.id, { action: 'chore', entityId: hunter.id, chore: 'take-small-game' });
  hauler.chore = { id: 'haul-logs', step: 0, wait: 2, doing: 'dragging 6 logs behind the ox', with: ['ox'] };
  assert.equal(userOf(world, family, 'rifle'), hunter, 'the hunt did not hold the rifle, so this proves nothing');
  assert.equal(userOf(world, family, 'ox'), hauler);
  // The third period's order to leave (sim/scrape.mjs): everybody at home goes together, and the work in hand is dropped.
  world.period = 3;
  family.flight = { status: 'ordered', orderedMinute: world.minute };
  const refuge = REFUGES.find(id => world.map.sites[id] && world.map.sites[id].x > world.map.sites[family.homeSiteId].x + 2);
  flee(world, family, { take: {}, refuge });
  assert.equal(hauler.chore, null);
  assert.equal(userOf(world, family, 'rifle'), null, 'the rifle is still held by a hunt the flight dropped');
  // The ox goes east with the family, which has it on the road, as the flight always gave it (sim/scrape.mjs).
  assert.notEqual(userOf(world, family, 'ox'), hauler, 'the ox is still held by hauling the flight dropped');
  validateWorld(world);
});

test('a class saved with work in hand opens with that work holding its things, and the old walk to the shops goes on as it was', () => {
  const world = running('release-save');
  const family = household(world), mateo = person(world, 'mateo'), rosa = person(world, 'rosa'), elena = person(world, 'elena');
  family.resources.powder = 6;
  applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' });
  // Saved before 2026-09-24: no work held anything by name, and the walk to the shops asked in town.
  delete mateo.chore.with;
  rosa.chore = { id: 'visit-shop', step: 2, wait: 0, doing: 'on the street in town', flags: [] };
  elena.chore = { id: 'haul-logs', step: 0, wait: 2, doing: 'dragging 6 logs behind the ox', load: { n: 6, wall: 6, sill: 0, poor: 0 } };
  assert.equal(userOf(world, family, 'rifle'), null, 'the fixture already held the rifle, so this proves nothing');
  const dir = mkdtempSync(join(tmpdir(), 'texas-uses-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json')).world;
    validateWorld(opened);
    const again = opened.households['hh-1'];
    assert.equal(userOf(opened, again, 'rifle')?.id, mateo.id, 'a hunt in hand opened without the rifle');
    assert.equal(userOf(opened, again, 'ox')?.id, elena.id, 'a load behind the ox opened without the ox');
    assert.equal(opened.entities[rosa.id].chore.id, 'visit-shop-street', 'the old walk to the shops was not kept as it was');
    // No version moved.
    assert.equal(readSave(join(dir, 'save.json')).saveVersion, 3);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the popup\'s facts are the family\'s own: its own town, its own stock, nobody else\'s things, and small', () => {
  const world = running('errand-fog');
  const rosa = person(world, 'rosa');
  household(world).resources.cotton = 3;
  const facts = errandFor(world, 'hh-1', rosa.id, [{ id: 'store:cotton', n: 3, pay: 'coin' }]);
  const wire = JSON.stringify(facts);
  assert.ok(wire.length < 12000, `the popup's facts are ${wire.length} bytes`);
  assert.doesNotMatch(wire, /hh-2|hh-3|"purse"/, 'another family, or a keeper\'s purse, is in the popup');
  for (const other of Object.values(world.households).filter(one => one.id !== 'hh-1')) {
    for (const id of other.members) assert.ok(!wire.includes(world.entities[id].name), `${world.entities[id].name} of another family is in the popup`);
  }
  assert.throws(() => errandFor(world, 'hh-1', world.households['hh-2'].members[0]), /Choose one of your family/);
  // The tick carries none of it: not the list, not what the work holds.
  send(world, rosa, [{ id: 'store:cotton', n: 3, pay: 'coin' }]);
  const tick = JSON.stringify(projectWorld(world, 'hh-1', 'student', { includeMap: false }));
  assert.doesNotMatch(tick, /"errand"|"with"/);
  validateWorld(world);
});

test('the page sends exactly the list on the screen, grouped as the server sent it', () => {
  const lines = [{ id: 'store:seed', trade: 'store', shop: 'The store', pays: ['coin', 'food'] }, { id: 'store:hoe', trade: 'store', shop: 'The store', pays: ['coin'] }, { id: 'mill:grind', trade: 'mill', shop: 'The mill', pays: [] }];
  const counts = new Map([['store:seed', 2], ['mill:grind', 4]]), pays = new Map([['store:seed', 'food']]);
  assert.deepEqual(errandList(lines, counts, pays), [{ id: 'store:seed', n: 2, pay: 'food' }, { id: 'mill:grind', n: 4 }]);
  assert.deepEqual(errandList(lines, new Map([['store:hoe', 1]]), new Map([['store:hoe', 'food']])), [{ id: 'store:hoe', n: 1, pay: 'coin' }], 'the page sent a way of paying the shop does not take');
  assert.deepEqual(byShop(lines).map(shop => [shop.shop, shop.lines.length]), [['The store', 2], ['The mill', 1]]);
  assert.equal(stockWords({ food: 7.96, seed: 2, powder: 3, money: 1 }), 'The family has 7.9 food · 2 seed · 3 powder · 1 real.');
});

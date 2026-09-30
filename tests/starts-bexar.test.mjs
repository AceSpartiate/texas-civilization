// The owner's answers of 2026-09-29 and -30 to the family's start (docs/FAMILY_CREATION.md, *The family's start*): a Tejano family
// on a rancho near Béxar in a class of twenty or more ("Béxar at 20+"), Seguín's men in the winter's garrison riding out with him on
// February 25 ("Join, then leave"), and a Tejano family's cart as the carreta ("if not then yes"). The priest's wedding is in
// tests/starts.test.mjs.
//
// Every test here was proved by injecting the regression it guards (scripts/starts-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectFamily, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { dealCounts } from '../sim/colonies-map.mjs';
import { inBurnZone } from '../sim/advance.mjs';
import { BEXAR_FROM, EARLY, MISSION_CLEAR, MISSION_OFFSETS, STARTS_SEATED, clearOfMissions, startCounts } from '../sim/starts.mjs';
import { BEXAR_AFTER, BEXAR_WORD, advanceStarts } from '../sim/start-story.mjs';
import { momentOf } from '../sim/directors.mjs';
import { offerCalls } from '../sim/calls.mjs';
import { burnForSilence, orderOut } from '../sim/scrape.mjs';
import { atOrNearBexar } from '../sim/surprise.mjs';
import { familyEnding } from '../sim/ending.mjs';
import { tellFall } from '../sim/alamo.mjs';
import { SEGUIN, seguinRidesOut } from '../sim/tejano.mjs';
import { MISSIONS } from '../sim/army.mjs';
import { meansRoll } from '../sim/family.mjs';
import { wagonsOf, vehicleWord } from '../sim/wagon.mjs';
import { heardOut } from './support/heard-out.mjs';

const colonies = (seed, n) => createGonzalesWorld(seed, n, { map: 'colonies', starts: true });
const bexarOf = world => Object.values(world.households).find(household => household.settlementId === 'bexar');
const until = (world, done, limit = 12000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); return done(); };
const men = (world, household) => household.members.map(id => world.entities[id]).filter(one => one.sex === 'male' && one.age >= 16);

test('from twenty families one family is Tejano, on a rancho near Béxar: inside the burn zone, off the missions, early to join, with a store in town', () => {
  assert.equal(MISSION_OFFSETS.length, 2);
  assert.deepEqual(MISSION_OFFSETS.map(m => [m.dx, m.dy]).sort(), [MISSIONS.espada, MISSIONS.concepcion].map(m => [m.dx, m.dy]).sort(), 'the missions are sim/army.mjs\'s');
  assert.equal(bexarOf(colonies('bx-19', BEXAR_FROM - 1)), undefined, 'none below twenty');
  for (const [seed, n] of [['bx-20', 20], ['bx-24', 24], ['bx-30', 30]]) {
    const world = colonies(seed, n);
    const counts = startCounts(n, dealCounts);
    assert.equal(counts.bexar, 1);
    assert.deepEqual(Object.fromEntries(Object.entries(counts).filter(([id]) => id !== 'bexar')), dealCounts(n - 1, STARTS_SEATED));
    const at = Object.values(world.households).filter(household => household.settlementId === 'bexar');
    assert.equal(at.length, 1, `${n}: one family near Béxar`);
    const household = at[0], home = world.map.sites[household.homeSiteId], town = world.map.sites.bexar;
    assert.equal(household.heritage, 'tejano');
    assert.ok(inBurnZone(world.map, home), `${n}: inside the burn zone`);
    for (const m of Object.values(MISSIONS)) assert.ok(Math.hypot(home.x - town.x - m.dx, home.y - town.y - m.dy) >= MISSION_CLEAR, `${n}: off ${m.name}`);
    assert.ok(Number(household.id.slice(3)) - 1 < EARLY, `${n}: among the first ${EARLY} to join`);
    assert.ok(world.entities['town-store-bexar'], `${n}: a store at Béxar`);
    assert.equal(clearOfMissions({ x: town.x + MISSIONS.concepcion.dx, y: town.y + MISSIONS.concepcion.dy + 1 }, town), false, 'land by Concepción is not clear');
    rollFamily(world, household);
    const start = projectFamily(world, household.id).start;
    assert.equal(start.kicker, 'A TEJANO FAMILY OF BÉXAR');
    assert.match(start.lead, /rancho on the San Antonio River near Béxar/);
    validateWorld(world);
  }
  const world = colonies('bx-20', 20);
  bexarOf(world).heritage = 'anglo';
  assert.throws(() => validateWorld(world), /below Béxar is Tejano/);
});

test('a family near Béxar is told what it hears of the war at its door, once each, at its moment, and nobody else is', () => {
  const world = colonies('bx-story', 20);
  const household = bexarOf(world), other = Object.values(world.households).find(one => one.settlementId === 'victoria');
  world.status = 'running';
  const told = id => world.events.filter(event => event.householdId === id && BEXAR_WORD.some(word => word.text === event.text));
  for (const word of BEXAR_WORD) {
    const from = word.at ? momentOf(world, word.at) : Date.parse(`${word.on}T00:00:00Z`) - Date.parse('1835-09-28T06:00:00Z');
    world.minute = (word.at ? from : Math.round(from / 60000)) + word.after - 5;
    if (word.at) world.director.milestones[word.at] = true;
    advanceStarts(world);
    assert.ok(!world.startsTold?.[household.id]?.includes(word.key), `${word.key} told before its moment`);
    world.minute += 10;
    advanceStarts(world); advanceStarts(world);
    assert.ok(world.startsTold[household.id].includes(word.key), `${word.key} not told`);
  }
  assert.equal(told(household.id).length, BEXAR_WORD.length, 'each once (the fall as what the family knows)');
  assert.equal(told(other.id).length, 0, 'nobody else');
  // The Alamo's fall is known down the river the day it happened.
  assert.equal(world.knowledge.households[household.id]['alamo-fall']?.status, 'unconfirmed');
  assert.equal(world.knowledge.households[other.id]['alamo-fall'], undefined);
  assert.equal(familyEnding(world, household.id).story.at(-1), BEXAR_AFTER);
});

test('a family near Béxar is asked by Seguín from its own land when the army comes near, and its man rides from home to the army', () => {
  const world = createGonzalesWorld('bexar-play-1', 20, { map: 'colonies', starts: true, neighbours: true });
  const household = bexarOf(world);
  for (const one of Object.values(world.households)) rollFamily(world, one);
  household.played = true;
  world.status = 'running';
  until(world, () => world.calls?.[household.id]);
  assert.ok(world.director.milestones['leave-cibolo'], 'asked only once the army has left the Cibolo');
  assert.equal(world.calls[household.id].gather, household.homeSiteId, 'answered from home');
  heardOut(world, household.id);
  const answerers = projectWorld(world, household.id, 'student', { includeMap: false }).request?.answerers || {};
  const [manId, options] = Object.entries(answerers).find(([, list]) => list.find(option => option.id === 'turn-out')?.can);
  assert.equal(options.find(option => option.id === 'turn-out').label, 'Go: ride with Seguín\'s company to the army');
  applyAction(world, household.id, { action: 'turn-out', entityId: manId, mode: 'horse' });
  assert.equal(world.entities[manId].company, SEGUIN);
  assert.ok(until(world, () => world.army?.members?.includes(manId), 3000), 'he never reached the army');
  assert.ok(world.events.some(event => event.householdId === household.id && /set out after the army/.test(event.text)));
});

test('near Béxar the word to leave comes from Seguín\'s men, and a rancho left in a rush is burned by Santa Anna\'s foragers, not the Texas army', () => {
  const world = colonies('bx-order', 20);
  const household = bexarOf(world), other = Object.values(world.households).find(one => one.settlementId === 'gonzales');
  for (const one of [household, other]) { rollFamily(world, one); orderOut(world, one, null); }
  const said = id => world.events.filter(event => event.householdId === id && event.type === 'pressure').map(event => event.text).join(' ');
  assert.match(said(household.id), /Seguín's men: the families of the ranchos who stood with the Texians are going east/);
  assert.doesNotMatch(said(household.id), /the Mexican army is coming/);
  assert.match(said(other.id), /the Mexican army is coming/);
  for (const one of [household, other]) burnForSilence(world, one);
  assert.equal(household.flight.burnedBy.hand, 'mexican');
  assert.equal(other.flight.burnedBy.hand, 'texian');
  // And on February 23 the rancho hears the bell, wherever on its land it stands.
  const home = world.map.sites[household.homeSiteId];
  const person = world.entities[household.members[0]];
  // Standing on its own land, even where that is further from the town than the bell's reach (`NEAR_BEXAR_MILES`).
  person.location = { x: world.map.sites.bexar.x + 8, y: world.map.sites.bexar.y + 8, siteId: home.id };
  assert.ok(atOrNearBexar(world).some(one => one.id === person.id));
});

test('a Tejano man in the winter garrison is with Seguín\'s men, and on the night of February 25 rides out of the Alamo with Seguín', () => {
  const world = colonies('seguin-alamo', 5);
  for (const one of Object.values(world.households)) rollFamily(world, one);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  const tejano = Object.values(world.households).find(one => one.heritage === 'tejano');
  const anglo = Object.values(world.households).find(one => one.heritage === 'anglo' && men(world, one).length);
  const [man] = men(world, tejano), [other] = men(world, anglo);
  // Both in the garrison at Béxar before the Mexican army comes, as a man sent there over the winter is.
  until(world, () => world.minute >= momentOf(world, 'alamo-siege') - 600, 12000);
  const town = world.map.sites.bexar;
  for (const one of [man, other]) {
    one.travel = null; one.chore = null;
    one.location = { x: town.x, y: town.y, siteId: 'bexar' };
    one.service = { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar' };
  }
  stepWorld(world);
  assert.equal(man.company, SEGUIN, 'with Seguín\'s men');
  assert.equal(other.company, undefined);
  assert.ok(world.events.some(event => event.householdId === tejano.id && /Juan Seguín and some of his Tejanos are in Béxar this winter/.test(event.text)));
  until(world, () => world.director.milestones['alamo-siege']);
  assert.ok(man.service.besieged && other.service.besieged, 'both shut in');
  until(world, () => world.director.milestones['courier-2']);
  assert.equal(man.service.courier, 'sent'); assert.equal(man.service.withSeguin, true);
  assert.equal(man.service.besieged, false); assert.equal(man.travel?.to, 'gonzales', 'riding for Gonzales');
  assert.ok(world.events.some(event => event.householdId === tejano.id && /sent Juan Seguín out through the Mexican lines as a courier, with Antonio Cruz/.test(event.text)));
  assert.notEqual(other.service.withSeguin, true, 'an Anglo man does not ride with Seguín');
  validateWorld(world);
  // The Alamo's last word for him says he rode out with Seguín.
  man.service.told = false;
  tellFall(world, [tejano]);
  assert.ok(world.events.some(event => event.householdId === tejano.id && /ridden out of the Alamo with Juan Seguín on the night of February 25/.test(event.text)));
});

test('a woman of a Tejano family shut in the Alamo is not made one of Seguín\'s men and does not ride out with him', () => {
  const world = colonies('seguin-alamo-w', 5);
  const tejano = Object.values(world.households).find(one => one.heritage === 'tejano');
  rollFamily(world, tejano);
  world.status = 'running';
  const woman = tejano.members.map(id => world.entities[id]).find(one => one.sex === 'female' && one.age >= 16);
  woman.service = { kind: 'garrison', status: 'serving', since: 0, siteId: 'bexar', besieged: true };
  advanceStarts(world);
  assert.equal(woman.company, undefined);
  seguinRidesOut(world, { beginTravel: () => {}, rideOut: () => {}, awardGlory: () => {} });
  assert.equal(woman.service.besieged, true);
});

test('a Tejano family of the poorest means comes with a carreta, drawn as Astra\'s carreta, that carries as the cart does', () => {
  let world = null, tejano = null;
  for (let n = 0; n < 200 && !tejano; n++) {
    const candidate = colonies(`carreta-${n}`, 10);
    const one = Object.values(candidate.households).find(household => household.heritage === 'tejano');
    const roll = meansRoll(candidate.seed, one.id);
    if (roll >= 3 && roll <= 6) { world = candidate; tejano = one; }
  }
  assert.ok(tejano, 'no poor Tejano family found');
  rollFamily(world, tejano);
  const [cart] = wagonsOf(world, tejano);
  assert.equal(cart.cart, true); assert.equal(cart.style, 'carreta'); assert.equal(cart.name, 'Family carreta');
  assert.equal(vehicleWord(tejano), 'carreta');
  assert.match(projectFamily(world, tejano.id).means.words, /^A carreta and one ox/);
  const seen = projectWorld(world, tejano.id, 'student', { includeMap: false }).entities.find(one => one.id === cart.id);
  assert.equal(seen.carreta, true, 'drawn as the carreta');
  // An Anglo-American family's cart is a cart.
  const anglo = Object.values(world.households).find(household => household.heritage === 'anglo' && meansRoll(world.seed, household.id) >= 3 && meansRoll(world.seed, household.id) <= 6);
  if (anglo) { rollFamily(world, anglo); assert.equal(wagonsOf(world, anglo)[0].style, undefined); assert.equal(vehicleWord(anglo), 'cart'); }
  validateWorld(world);
  const other = Object.values(world.households).find(household => household.heritage === 'anglo' && !household.roll);
  rollFamily(world, other);
  const theirs = wagonsOf(world, other)[0];
  if (theirs) { theirs.cart = true; theirs.style = 'carreta'; assert.throws(() => validateWorld(world), /Invalid cart/); }
});

// The third class period and the Runaway Scrape: docs/COLONIES.md §7g, decided by the owner by multiple choice (2026-09-16).
//
// The second period ends with interim standings and the Host continues the same class to dawn on March 14 with nothing
// skipped. Each settlement's families are told to leave on its day; the family chooses what fits in the wagon and where east
// it makes for, and sets out together, leaving the farm standing with what did not fit; since 2026-09-26 a farm burns only when
// a Mexican column's foragers reach it, inside the burn zone (sim/advance.mjs, docs/SCRAPE.md), and whoever is at home then
// may be taken. The rivers hold the family at every crossing; rain, cold
// and hunger make people sick and a few die. Word of San Jacinto turns every family home to what is left.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod, canContinue, nextPeriodLabel } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { CAPTURED_AT_HOME, FLIGHT_ROOM, SETTLEMENT_DAYS, fleeRefusal, packFlight, share } from '../sim/scrape.mjs';
import { lightLoad, loadSpace, needsOf } from '../public/family-panel.js';
import { beastsOf } from '../sim/beasts.mjs';
import { burnMinute, farmFate } from '../sim/advance.mjs';
import { thinkFor } from '../sim/neighbours.mjs';
import { untilHeard } from './support/spring-word.mjs';
import { feed } from './support/fed.mjs';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);
const untilMinute = (world, minute) => until(world, () => world.minute >= minute);

let shared = null;
/** A real-land class with rolled families, played through two periods and continued into the spring, running. */
const spring = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('scrape-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  assert.equal(canContinue(world), true, 'the second period did not offer the spring');
  beginThirdPeriod(world); world.status = 'running';
  // Into the spring fed: the tests make these families played, and a played family can starve (tests/support/fed.mjs).
  return feed(world);
})());
const families = (world, settlementId) => Object.values(world.households).filter(household => (household.settlementId || 'gonzales') === settlementId);
const main = (world, household) => world.entities[household.mainId || household.principalId];

test('the second period ends with interim standings and the spring offered; the third opens at dawn on March 14 with nothing skipped', () => {
  const world = createGonzalesWorld('scrape-continue', 5, { map: 'colonies' });
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  const host = view(world, undefined, 'host').ending.host;
  assert.equal(host.interim, true, 'the second period was shown as the end of the story');
  assert.equal(host.canContinue, true);
  assert.equal(host.nextLabel, 'Continue to the spring of 1836');
  assert.equal(nextPeriodLabel(world), 'Continue to the spring of 1836');
  assert.throws(() => beginSecondPeriod(world), /first period/, 'the winter came twice');
  const before = { minute: world.minute, where: Object.fromEntries(Object.values(world.entities).map(entity => [entity.id, entity.location.siteId])) };
  beginThirdPeriod(world);
  validateWorld(world);
  assert.equal(world.period, 3);
  assert.equal(world.status, 'paused');
  assert.equal(world.minute, momentOf(world, 'scrape-opens'));
  assert.ok(world.minute - before.minute < 8 * 60, 'the spring skipped time');
  for (const [id, siteId] of Object.entries(before.where)) assert.equal(world.entities[id].location.siteId, siteId, `${id} moved over the night`);
  assert.throws(() => beginThirdPeriod(world), /second period/, 'the spring came twice');
});

test('each settlement is told to leave on its day, its main person carries the "!", and the calendar holds while a played family decides', () => {
  const world = spring();
  const gonzales = families(world, 'gonzales'), elsewhere = Object.values(world.households).find(household => SETTLEMENT_DAYS[household.settlementId || 'gonzales'].order > SETTLEMENT_DAYS.gonzales.order + 2 * 1440);
  assert.ok(gonzales.length && elsewhere, 'the class has no Gonzales family, or nobody told later');
  for (const household of gonzales) household.played = true;
  stepWorld(world);
  for (const household of gonzales) {
    assert.equal(household.flight?.status, 'ordered', `${household.id} was not told to leave on March 14`);
    const projected = view(world, household.id);
    assert.equal(projected.flight.status, 'ordered');
    // A wagon's room for every wagon at home with an ox to draw it: a family of nine or more has two (sim/beasts.mjs, 2026-09-25).
    const wagons = Math.min(beastsOf(world, household, 'wagon').length, beastsOf(world, household, 'ox').length);
    assert.equal(projected.flight.room, FLIGHT_ROOM * wagons, 'a family with its wagons at home has less room than the wagons');
    assert.ok(projected.flight.refuges.length && projected.flight.refuges.every(refuge => world.map.sites[refuge.id].x > world.map.sites[household.homeSiteId].x), 'a refuge is not east');
    assert.deepEqual(needsOf(projected, main(world, household).id).map(need => need.kind), ['flight'], 'the main person carries no "!"');
  }
  assert.equal(elsewhere.flight, undefined, `${elsewhere.settlementId} was told to leave with Gonzales`);
  assert.equal(calendarMinutes(world), 20, 'the calendar did not hold for a played family deciding');
  untilMinute(world, SETTLEMENT_DAYS[elsewhere.settlementId].order);
  assert.equal(elsewhere.flight?.status, 'ordered', `${elsewhere.settlementId} was never told to leave`);
});

test('the family\'s card opens on the packing a family deciding alone takes - food first, as much as fits - and a load far under it is told apart', () => {
  // Design audit 2026-09-28 B7: every box opened at 0, so "Leave for the east" pressed twice left all the food behind.
  const world = spring();
  const household = families(world, 'gonzales')[0];
  household.played = true;
  stepWorld(world);
  household.resources = { ...household.resources, food: 400, seed: 6, cotton: 10, powder: 2 };
  const shown = view(world, household.id).flight;
  assert.equal(shown.status, 'ordered');
  assert.ok(shown.packed, 'the card was sent no load to open with');
  assert.deepEqual(shown.packed, packFlight(shown), 'the card does not open on the packing a family deciding alone takes');
  assert.ok(shown.packed.take.food > 0, 'the load opens without food');
  assert.equal(shown.packed.refuge, [...shown.refuges].sort((a, b) => a.miles - b.miles)[0].id, 'the load is not for the nearest refuge east');
  assert.ok(loadSpace(shown.space, shown.packed.take) <= shown.room + 1e-9, 'the load does not fit');
  assert.equal(fleeRefusal(world, household, shown.packed), null, 'the load the card opens with is refused');
  // Food first: with more food than room, the load is all food.
  assert.equal(shown.packed.take.food, Math.floor(shown.room / shown.space.food));
  assert.equal(lightLoad(shown, shown.packed.take), null, 'the full load was called light');
  assert.equal(lightLoad(shown, { food: 0, seed: 0, cotton: 0, powder: 0 }), 'empty');
  assert.equal(lightLoad(shown, { food: Math.floor(shown.packed.take.food / 4) }), 'light');
  // Nothing in the house to take: nothing is light. Nor any tool, chest or wheel, which are in the load since 2026-09-29.
  household.resources = { ...household.resources, food: 0, seed: 0, cotton: 0, powder: 0 };
  household.tools = {}; delete household.spares; household.belongings = [];
  const bare = view(world, household.id).flight;
  assert.equal(lightLoad(bare, {}), null, 'a family with nothing to take was told it was leaving things behind');
});

test('the family loads what fits and sets out together for the east, leaving the farm standing with what did not fit; the rivers hold it; it camps at the refuge and comes home with the victory', () => {
  // Since 2026-09-26 the farm is not burned as the family goes (owner: the burning follows history, docs/SCRAPE.md): it stands
  // with what was left in it until a Mexican column's foragers reach it, and outside the burn zone they never do.
  const world = spring();
  const household = families(world, 'gonzales')[0];
  household.played = true;
  stepWorld(world);
  const person = main(world, household);
  household.resources = { ...household.resources, food: 400, seed: 6, cotton: 10, money: 3 };
  household.furniture = { table: 'made' };
  household.improvements = { ...household.improvements, cabin: 'sound' };
  const refuge = view(world, household.id).flight.refuges[0].id;
  const send = input => applyAction(world, household.id, { action: 'flee', entityId: person.id, ...input });
  assert.throws(() => send({ take: { food: 20 }, refuge: 'gonzales' }), /make for|east/);
  // More than the room of every wagon at home (a wagon's room each since 2026-09-25, tests/wagons.test.mjs): a quarter of room a food.
  assert.throws(() => send({ take: { food: view(world, household.id).flight.room * 4 + 4 }, refuge }), /not fit/);
  assert.throws(() => send({ take: { food: 20, seed: 9 }, refuge }), /not that much seed/);
  // The rifle is not in the load (it goes in a man's hand, sim/flight-goods.mjs); the hoe is, since 2026-09-29, and is not refused here.
  assert.throws(() => send({ take: { rifle: 1 }, refuge }), /whole amounts/);
  assert.throws(() => send({ take: { chest: 1 }, refuge }), /has not got the chest/);
  const goers = household.members.map(id => world.entities[id]).filter(one => one.location.siteId === household.homeSiteId && one.health.condition !== 'dead');
  send({ take: { food: 40, seed: 6, cotton: 8 }, refuge });
  validateWorld(world);
  assert.equal(household.flight.status, 'fled');
  assert.deepEqual({ food: household.resources.food, seed: household.resources.seed, cotton: household.resources.cotton, money: household.resources.money }, { food: 40, seed: 6, cotton: 8, money: 3 }, 'the family did not keep exactly what it loaded, and its coin');
  assert.equal(household.improvements.cabin, 'sound', 'the house burned as the family left');
  assert.deepEqual(household.furniture, { table: 'made' }, 'the furniture went with the family or burned');
  assert.deepEqual([household.flight.left?.food, household.flight.left?.cotton, household.flight.left?.seed], [360, 2, undefined], 'what did not fit is not left in the house');
  assert.ok(!world.events.some(event => event.householdId === household.id && /watched it burn/.test(event.text)), 'the family watched a burning that did not happen');
  for (const one of goers) assert.equal(one.travel?.purpose, 'flee', `${one.name} did not set out`);
  assert.equal(world.entities[`${household.id}-wagon`].travel?.purpose, 'flee', 'the wagon stayed');
  assert.equal(world.entities[`${household.id}-wagon`].laden, true);
  assert.equal(calendarMinutes(world), 240, 'the calendar did not move on once the family had gone');
  // Fed from here: five weeks on the road and at the refuge with forty food would starve it (sim/hunger.mjs), and this test is of
  // the road, not of hunger (tests/support/fed.mjs).
  feed(world, [household]);
  // The rivers.
  until(world, () => household.flight.crossing, 3000);
  assert.ok(household.flight.crossing, 'the family was never held at a crossing');
  assert.ok(goers.every(one => one.travel?.halted), 'the family went on while it waited at the river');
  const held = goers[0].travel.progress;
  until(world, () => !household.flight.crossing, 200);
  assert.ok(household.flight.crossed.length === 1, 'the crossing was not counted');
  assert.equal(goers[0].travel?.progress ?? Infinity, held, 'the family moved while it waited');
  until(world, () => household.flight.status === 'refuged', 4000);
  assert.equal(household.flight.status, 'refuged', 'the family never reached its refuge');
  for (const one of goers) if (one.health.condition !== 'dead') assert.equal(one.location.siteId, refuge, `${one.name} is not at the refuge`);
  assert.equal(view(world, household.id).flight.status, 'refuged');
  // Home with the victory, when its word reaches the family at its refuge (docs/COLONIES.md §5.4c).
  // Kept fed at the refuge, as by trading among the families camped there: a family the Mexican army overtakes there loses its
  // food with its goods but a few days' eating (sim/road.mjs `LEFT_FOOD_DAYS`), and this test is of the road home, not of hunger
  // (tests/support/fed.mjs).
  untilHeard(world, [household.id], 'san-jacinto', { also: () => { feed(world, [household]); return true; } });
  assert.equal(household.flight.status, 'returning', 'the family did not turn home with the news');
  // The game ends on April 25 with the families on the road home (owner, §7g); the road is run on past it here to see them arrive.
  until(world, () => world.director.complete);
  assert.ok(['returning', 'home'].includes(household.flight.status));
  world.status = 'running';
  until(world, () => household.flight.status === 'home', 4000);
  assert.equal(household.flight.status, 'home', 'the family never reached home');
  // Home to what the burn zone left: the house ashes inside it, the house standing and the goods where they were outside it.
  if (farmFate(world, household)) {
    assert.equal(household.improvements.cabin, 'ruined');
    assert.ok(world.events.some(event => event.householdId === household.id && /home\. The house is ashes/.test(event.text)));
  } else {
    assert.equal(household.improvements.cabin, 'sound');
    assert.ok(world.events.some(event => event.householdId === household.id && /home\. The Mexican army never came this way: the house stands.*still there: 360 food, 2 cotton/.test(event.text)));
  }
  validateWorld(world);
});

test('a family that stays is burned out when a column\'s foragers reach the farm, and whoever is at home may be taken', () => {
  const world = spring();
  // A family inside the burn zone (sim/advance.mjs): the foragers come.
  const household = Object.values(world.households).find(one => farmFate(world, one));
  assert.ok(household, 'this class has no family inside the burn zone');
  household.played = true;
  household.improvements = { ...household.improvements, cabin: 'sound' };
  // Staying is an answer of its own since auto packs the wagon of a family that answers nothing for a day (sim/auto.mjs).
  until(world, () => household.flight?.status === 'ordered');
  applyAction(world, household.id, { action: 'flight-stay', entityId: main(world, household).id });
  assert.equal(household.flight.status, 'stayed');
  assert.equal(calendarMinutes(world), 240, 'the calendar still held after the family decided to stay');
  assert.throws(() => applyAction(world, household.id, { action: 'flight-stay', entityId: main(world, household).id }), /already decided/);
  const home = household.members.map(id => world.entities[id]).filter(one => one.location.siteId === household.homeSiteId && one.health.condition === 'well');
  const at = burnMinute(world, household);
  // Up to the tick that reaches the foragers' minute, and then that tick.
  until(world, () => world.minute + calendarMinutes(world) >= at);
  assert.equal(household.improvements.cabin, 'sound', 'the farm burned before the foragers came');
  untilMinute(world, at);
  assert.equal(household.flight.status, 'stayed');
  assert.equal(household.improvements.cabin, 'ruined', 'the foragers came and did not burn the farm');
  assert.equal(household.flight.burnedBy.hand, 'mexican');
  assert.ok(world.events.some(event => event.householdId === household.id && /Foragers of .+ came to the farm on .+ and burned the house, the field and the fences while the family's own people looked on/.test(event.text)), 'the family at home was not told what it saw');
  // Whoever was at home when the foragers came is taken at the share.
  for (const one of home) assert.equal(one.health.condition, share(world, one.id, 'enemy') < CAPTURED_AT_HOME ? 'captured' : 'well', `${one.name}'s capture did not follow the share`);
  // Burned out, the family can still go with what it can carry.
  assert.equal(view(world, household.id).flight.burned, true);
  validateWorld(world);
});

test('a family nobody plays whose main person is serving still leaves when it is told to go', () => {
  // Found 2026-09-27 by scripts/balance-measure.mjs (seed measure-5-0): the neighbours' director sent the flee through the
  // main person, who was with the auxiliary and could only be sent for, so it was refused every think and the family sat at
  // home until the foragers burned the farm. The word is now given by somebody at home and free to give it.
  const world = spring();
  const household = families(world, 'gonzales').find(one => one.members.map(id => world.entities[id]).filter(person => person.age >= 10 && person.health.condition !== 'dead').length >= 2);
  assert.ok(household, 'no Gonzales family has two people old enough to give the word');
  until(world, () => household.flight?.status === 'ordered');
  const head = main(world, household);
  head.service = { kind: 'auxiliary-war', status: 'serving', siteId: 'san-felipe' };
  const others = household.members.map(id => world.entities[id]).filter(person => person.id !== head.id);
  assert.ok(others.some(person => person.location.siteId === household.homeSiteId && !person.travel && person.health.condition !== 'dead'), 'nobody else is at home to give the word');
  thinkFor(world, household, { project: id => view(world, id), act: input => applyAction(world, household.id, input) });
  assert.equal(household.flight.status, 'fled', 'the family stayed at home because its main person was serving');
});

test('rain, cold and hunger make people sick on the road, the sick mend, and a few die', () => {
  const world = createGonzalesWorld('scrape-sickness', 15, { map: 'colonies', neighbours: true });
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  const fell = new Set(), mended = new Set();
  const before = Object.values(world.entities).filter(one => one.kind === 'person' && one.householdId && one.health.condition === 'dead').length;
  until(world, () => {
    for (const one of Object.values(world.entities)) {
      if (one.kind !== 'person' || !one.householdId) continue;
      if (one.health.condition === 'sick') fell.add(one.id);
      else if (fell.has(one.id) && one.health.condition === 'well') mended.add(one.id);
    }
    return world.director.complete;
  }, 4000);
  assert.ok(fell.size > 0, 'nobody fell sick on the road');
  assert.ok(mended.size > 0, 'nobody mended');
  // Since 2026-09-27 the sickness has a name, and a death one plain sentence with it (sim/disease.mjs): "died of the flux at Liberty,
  // and was buried there", or on the road "and was buried where they fell".
  const died = world.events.filter(event => event.sickness === 'died' && / died of .+, and was buried /.test(event.text));
  assert.ok(died.every(event => fell.has(event.actorId)), 'somebody died of a sickness they never had');
  const travellers = Object.values(world.entities).filter(one => one.householdId && one.kind === 'person').length;
  assert.ok(died.length <= Math.ceil(travellers * 0.05), `too many died: ${died.length} of ${travellers}`);
  assert.ok(Object.values(world.households).every(household => household.flight), 'a family nobody plays was never told to leave');
  // Changed 2026-09-18 with the day on the road (sim/travel.mjs `roadTicks`): this asked for a family already home by April 25,
  // which held only while a wagon made forty-seven miles a day in the long ticks. The period ends with the families on the
  // road home (owner, docs/COLONIES.md §7g, and the ending's own words); arriving there is proved by 'the family flees...'.
  assert.ok(Object.values(world.households).some(household => ['returning', 'home'].includes(household.flight.status)), 'no family nobody plays fled and turned for home');
  assert.ok(Object.values(world.entities).filter(one => one.kind === 'person' && one.householdId && one.health.condition === 'dead').length >= before);
  validateWorld(world);
});

test('a saved flight or sickness that cannot be is refused', () => {
  const world = spring();
  const household = families(world, 'gonzales')[0];
  household.flight = { status: 'lost' };
  assert.throws(() => validateWorld(world), /Invalid flight/);
  household.flight = { status: 'fled', refuge: 'nowhere' };
  assert.throws(() => validateWorld(world), /Invalid refuge/);
  delete household.flight;
  world.entities[household.members[0]].health = { condition: 'sick' };
  assert.throws(() => validateWorld(world), /sickness/);
});

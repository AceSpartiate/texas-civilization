// The third class period and the Runaway Scrape: docs/COLONIES.md §7g, decided by the owner by multiple choice (2026-09-16).
//
// The second period ends with interim standings and the Host continues the same class to dawn on March 14 with nothing
// skipped. Each settlement's families are told to leave on its day; the family chooses what fits in the wagon and where east
// it makes for, and sets out together while the Texas army burns the farm behind it; a family that stays is burned out anyway
// and whoever is at home when the Mexican army passes may be taken. The rivers hold the family at every crossing; rain, cold
// and hunger make people sick and a few die. Word of San Jacinto turns every family home to what is left.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod, canContinue, nextPeriodLabel } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { CAPTURED_AT_HOME, FLIGHT_ROOM, SETTLEMENT_DAYS, share } from '../sim/scrape.mjs';
import { needsOf } from '../public/family-panel.js';

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
  return world;
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
    assert.equal(projected.flight.room, FLIGHT_ROOM, 'a family with its wagon at home has less room than the wagon');
    assert.ok(projected.flight.refuges.length && projected.flight.refuges.every(refuge => world.map.sites[refuge.id].x > world.map.sites[household.homeSiteId].x), 'a refuge is not east');
    assert.deepEqual(needsOf(projected, main(world, household).id).map(need => need.kind), ['flight'], 'the main person carries no "!"');
  }
  assert.equal(elsewhere.flight, undefined, `${elsewhere.settlementId} was told to leave with Gonzales`);
  assert.equal(calendarMinutes(world), 20, 'the calendar did not hold for a played family deciding');
  untilMinute(world, SETTLEMENT_DAYS[elsewhere.settlementId].order);
  assert.equal(elsewhere.flight?.status, 'ordered', `${elsewhere.settlementId} was never told to leave`);
});

test('the family loads what fits, sets out together for the east, and the farm burns behind it; the rivers hold it; it camps at the refuge and comes home with the victory', () => {
  const world = spring();
  const household = families(world, 'gonzales')[0];
  household.played = true;
  stepWorld(world);
  const person = main(world, household);
  household.resources = { ...household.resources, food: 100, seed: 6, cotton: 10, money: 3 };
  household.furniture = { table: 'made' };
  household.improvements = { ...household.improvements, cabin: 'sound' };
  const refuge = view(world, household.id).flight.refuges[0].id;
  const send = input => applyAction(world, household.id, { action: 'flee', entityId: person.id, ...input });
  assert.throws(() => send({ take: { food: 20 }, refuge: 'gonzales' }), /make for|east/);
  assert.throws(() => send({ take: { food: 100 }, refuge }), /not fit/);
  assert.throws(() => send({ take: { food: 20, seed: 9 }, refuge }), /not that much seed/);
  assert.throws(() => send({ take: { hoe: 1 }, refuge }), /whole amounts/);
  const goers = household.members.map(id => world.entities[id]).filter(one => one.location.siteId === household.homeSiteId && one.health.condition !== 'dead');
  send({ take: { food: 40, seed: 6, cotton: 8 }, refuge });
  validateWorld(world);
  assert.equal(household.flight.status, 'fled');
  assert.deepEqual({ food: household.resources.food, seed: household.resources.seed, cotton: household.resources.cotton, money: household.resources.money }, { food: 40, seed: 6, cotton: 8, money: 3 }, 'the family did not keep exactly what it loaded, and its coin');
  assert.equal(household.improvements.cabin, 'ruined', 'the house did not burn');
  assert.deepEqual(household.furniture, {}, 'the furniture survived the fire');
  assert.equal(household.interior, undefined);
  assert.ok(world.events.some(event => event.householdId === household.id && /watched it burn/.test(event.text)), 'the family did not watch the farm burn');
  for (const one of goers) assert.equal(one.travel?.purpose, 'flee', `${one.name} did not set out`);
  assert.equal(world.entities[`${household.id}-wagon`].travel?.purpose, 'flee', 'the wagon stayed');
  assert.equal(world.entities[`${household.id}-wagon`].laden, true);
  assert.equal(calendarMinutes(world), 240, 'the calendar did not move on once the family had gone');
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
  // Home with the victory.
  untilMoment(world, 'victory-word');
  assert.equal(household.flight.status, 'returning', 'the family did not turn home with the news');
  // The game ends on April 25 with the families on the road home (owner, §7g); the road is run on past it here to see them arrive.
  until(world, () => world.director.complete);
  assert.ok(['returning', 'home'].includes(household.flight.status));
  world.status = 'running';
  until(world, () => household.flight.status === 'home', 4000);
  assert.equal(household.flight.status, 'home', 'the family never reached home');
  assert.ok(world.events.some(event => event.householdId === household.id && /home\. The house and the field are burned/.test(event.text)));
  assert.equal(household.improvements.cabin, 'ruined');
  validateWorld(world);
});

test('a family that stays is burned out when the army passes, and whoever is at home when the Mexican army comes may be taken', () => {
  const world = spring();
  const household = families(world, 'gonzales')[0];
  household.played = true;
  household.improvements = { ...household.improvements, cabin: 'sound' };
  const days = SETTLEMENT_DAYS.gonzales;
  untilMinute(world, days.burn);
  assert.equal(household.flight.status, 'stayed');
  assert.equal(household.improvements.cabin, 'ruined', 'the army passed and did not burn the farm');
  assert.ok(world.events.some(event => event.householdId === household.id && /The Texas army passed and set fire/.test(event.text)));
  assert.equal(calendarMinutes(world), 240, 'the calendar still held after the farm burned');
  // Still at home when the Mexican army comes through.
  const home = household.members.map(id => world.entities[id]).filter(one => one.location.siteId === household.homeSiteId && one.health.condition === 'well');
  untilMinute(world, days.enemy);
  for (const one of home) assert.equal(one.health.condition, share(world, one.id, 'enemy') < CAPTURED_AT_HOME ? 'captured' : 'well', `${one.name}'s capture did not follow the share`);
  // Burned out, the family can still go with what it can carry.
  assert.equal(view(world, household.id).flight.burned, true);
  validateWorld(world);
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
  const died = world.events.filter(event => /died of the sickness on the road/.test(event.text));
  assert.ok(died.every(event => fell.has(event.actorId)), 'somebody died of a sickness they never had');
  const travellers = Object.values(world.entities).filter(one => one.householdId && one.kind === 'person').length;
  assert.ok(died.length <= Math.ceil(travellers * 0.05), `too many died: ${died.length} of ${travellers}`);
  assert.ok(Object.values(world.households).every(household => household.flight), 'a family nobody plays was never told to leave');
  assert.ok(Object.values(world.households).some(household => household.flight.status === 'home'), 'no family nobody plays fled and came home');
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

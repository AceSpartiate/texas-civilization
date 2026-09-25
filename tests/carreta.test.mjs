// The carreta a family makes at home (owner, 2026-09-25: "what was the cart thing that tejanos used? maybe we could use that? have
// it be something families can make at home? could work the same, just with reduced carrying capacity?"; sim/carreta.mjs,
// docs/WOODS_AND_BUILDING.md §6.6, HIST-TEX-443, FIC-GONZ-398).
//
// Held here: it is offered where logs lie in a pile, in a class on the second table, and refused in words for want of the axe,
// the logs or a hide, before the class begins, or while another is making one; made, it takes three logs (the poorest first) and
// a hide, and stands in the yard as the family's vehicle - the family wagon's id for a family that came on foot; it is used as
// the wagon is, one person at a time, by the harvest, the errand and the flight, and carries less: twelve on a trip to the
// wagon's twenty, ten spaces in the flight to a cart's twelve and a wagon's sixteen, two riders beside its driver; and a class
// of the first table is offered none and can hold none.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, errandFor, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { meansRoll } from '../sim/family.mjs';
import { MEANS_BANDS_BEFORE, bandFor } from '../sim/means.mjs';
import { CARRETA_HIDES, CARRETA_LOGS, CARRETA_TICKS, carretaRefusal } from '../sim/carreta.mjs';
import { CHORES, choreAvailability, choresFor } from '../sim/chores.mjs';
import { CART_RIDERS, seatPlan } from '../sim/company.mjs';
import { CARRETA_SPACE, WAGON_SPACE } from '../sim/wagon.mjs';
import { CARRETA_CARRY, MODES } from '../sim/travel.mjs';
import { beastsOf } from '../sim/beasts.mjs';
import { userOf } from '../sim/keeping.mjs';
import { FLIGHT_ROOM, flightRoom } from '../sim/scrape.mjs';
import { hostOverview } from '../sim/overview.mjs';
import { modestMeans, settle, taught } from './support/settled.mjs';

/** A class on the real land, under way, whose hh-1 rolled this band of means, home under a roof with its lesson behind it. */
function home(faces = [1, 2], { stem = 'carreta', map = 'colonies' } = {}) {
  let seed;
  for (let n = 0; ; n++) { seed = `${stem}-${n}`; if (faces.includes(meansRoll(seed, 'hh-1'))) break; }
  const world = createGonzalesWorld(seed, 5, { map });
  rollFamily(world, world.households['hh-1']);
  taught(settle(world));
  world.status = 'running';
  const household = world.households['hh-1'];
  household.played = true;
  // The house stands where the surveyor marked it: the site is chosen.
  delete household.choosingSite;
  household.logs = { wall: 2, sill: 1, poor: 1 };
  household.resources.hides = 1;
  return { world, household };
}
const hand = (world, household) => household.members.map(id => world.entities[id]).find(one => one.age >= 16 && !one.chore);
const make = (world, household, who = hand(world, household)) => {
  applyAction(world, 'hh-1', { action: 'chore', entityId: who.id, chore: 'make-carreta' });
  for (let t = 0; t < 600 && who.chore; t++) stepWorld(world);
  assert.equal(who.chore, null, `${who.name} never finished the carreta`);
  return beastsOf(world, household, 'wagon').find(one => one.carreta);
};

test('the carreta is offered where logs lie in a pile, and refused in words for want of the axe, the logs, a hide, or the class begun', () => {
  const { world, household } = home();
  const worker = hand(world, household);
  const offered = choresFor(world, household, worker).find(entry => entry.id === 'make-carreta');
  assert.ok(offered, 'a family on the real land is not offered the carreta');
  assert.equal(offered.can, true, offered.why);
  const why = change => { const copy = structuredClone(world); change(copy, copy.households['hh-1']); return choreAvailability(copy, copy.households['hh-1'], copy.entities[worker.id], 'make-carreta').why; };
  assert.match(why((w, h) => { delete h.tools.axe; }), /^A carreta wants the felling axe, and there is none in the house\.$/);
  assert.match(why((w, h) => { h.logs = { wall: 0, sill: 1, poor: 1 }; }), new RegExp(`^A carreta wants ${CARRETA_LOGS} logs from the pile at the house: two wheels cut from one, the axle and the frame from the others\\. There are 2\\. Fell and haul some first\\.$`));
  assert.match(why((w, h) => { h.resources.hides = 0; }), /^A carreta is lashed together with rawhide, and there is no hide in the house\. A hunt brings one home\.$/);
  assert.match(why(w => { w.status = 'lobby'; }), /once the class has begun/);
  // One at a time: a second hand is told who is at it.
  const first = worker;
  applyAction(world, 'hh-1', { action: 'chore', entityId: first.id, chore: 'make-carreta' });
  const second = hand(world, household);
  assert.equal(choreAvailability(world, household, second, 'make-carreta').why, `${first.name} is already making a carreta.`);
  // Not on the invented country, which has no log pile, and not in a class of the first table.
  const invented = home([1, 2], { map: 'gonzales', stem: 'carreta-inv' });
  assert.equal(choresFor(invented.world, invented.household, hand(invented.world, invented.household)).some(entry => entry.id === 'make-carreta'), false, 'the carreta was offered with no log pile');
  const old = home([1, 2, 3], { stem: 'carreta-old' });
  old.world.meansRoll = true;
  assert.equal(choresFor(old.world, old.household, hand(old.world, old.household)).some(entry => entry.id === 'make-carreta'), false, 'a class of the first table was offered the carreta');
});

test('made, it takes three logs, the poorest first, and a hide, and stands in the yard as the vehicle of a family that had none', () => {
  const { world, household } = home();
  assert.equal(beastsOf(world, household, 'wagon').length, 0, 'the fixture is not a family on foot');
  const maker = hand(world, household);
  applyAction(world, 'hh-1', { action: 'chore', entityId: maker.id, chore: 'make-carreta' });
  // Nothing is taken while it is being made.
  stepWorld(world);
  assert.deepEqual(household.logs, { wall: 2, sill: 1, poor: 1 });
  // The work is the work: some ticks of it, cutting the wheels, at the maker's own pace (sim/chores.mjs `paceFor`).
  let cutting = 0;
  for (let t = 0; t < 600 && maker.chore; t++) { if (/cutting wheels/.test(maker.chore.doing)) cutting++; stepWorld(world); }
  assert.ok(cutting >= CARRETA_TICKS / 3, `the wheels were cut in ${cutting} ticks`);
  const carreta = beastsOf(world, household, 'wagon')[0];
  assert.ok(carreta, 'nothing was made');
  assert.equal(carreta.id, 'hh-1-wagon', 'the carreta of a family that had no vehicle is not the family wagon\'s id');
  assert.equal(carreta.carreta, true);
  assert.equal(carreta.kind, 'wagon');
  assert.equal(carreta.name, 'Carreta');
  assert.equal(carreta.location.siteId, household.homeSiteId);
  assert.equal(carreta.condition, 'sound');
  assert.deepEqual(household.logs, { wall: 1, sill: 0, poor: 0 }, 'the logs were not the poorest first');
  assert.equal(household.resources.hides, 1 - CARRETA_HIDES);
  assert.match(world.events.findLast(event => event.householdId === 'hh-1' && event.claimId === 'FIC-GONZ-398').text, new RegExp(`made a carreta: .*carries ${CARRETA_CARRY} loads, where a wagon carries ${MODES.wagon.carry}\\.$`));
  // The page and the Host are told it is a carreta; no other family is.
  assert.equal(projectWorld(world, 'hh-1', 'student', { includeMap: false }).entities.find(one => one.id === carreta.id).carreta, true);
  assert.equal(hostOverview(world).everyone.find(one => one.id === carreta.id)?.carreta, true);
  assert.ok(!JSON.stringify(projectWorld(world, 'hh-2', 'student', { includeMap: false })).includes('"carreta"'), "another family's carreta reached a student");
  validateWorld(world);
  // A family that has a wagon makes a second vehicle beside it.
  const modest = home([7, 8, 9, 10], { stem: 'carreta-modest' });
  const second = make(modest.world, modest.household);
  assert.equal(second.id, 'hh-1-wagon-2');
  assert.equal(beastsOf(modest.world, modest.household, 'wagon').length, 2);
  validateWorld(modest.world);
  // Called off, nothing is spent and nothing is made.
  const off = home([1, 2], { stem: 'carreta-off' });
  const quitter = hand(off.world, off.household);
  applyAction(off.world, 'hh-1', { action: 'chore', entityId: quitter.id, chore: 'make-carreta' });
  for (let t = 0; t < 4; t++) stepWorld(off.world);
  applyAction(off.world, 'hh-1', { action: 'stop-chore', entityId: quitter.id });
  for (let t = 0; t < 40; t++) stepWorld(off.world);
  assert.deepEqual(off.household.logs, { wall: 2, sill: 1, poor: 1 });
  assert.equal(off.household.resources.hides, 1);
  assert.equal(beastsOf(off.world, off.household, 'wagon').length, 0);
  // A carreta could not have been made in a class of the first table.
  // Every family's means read as the first table would have rolled them, so the carreta is the only thing wrong.
  const bad = structuredClone(world); bad.meansRoll = true;
  for (const one of Object.values(bad.households)) if (one.means) { const band = bandFor(one.means.roll, MEANS_BANDS_BEFORE); one.means = { roll: one.means.roll, band: band.id, ...(band.cart && { cart: true }) }; }
  assert.throws(() => validateWorld(bad), /Invalid carreta/);
  const odd = structuredClone(world); odd.entities['hh-1-wagon'].carreta = 'yes';
  assert.throws(() => validateWorld(odd), /Invalid carreta/);
});

test('it is used as the wagon is, one person at a time, and carries less: twelve on a trip, ten in the flight, two riders', () => {
  const { world, household } = home();
  const carreta = make(world, household);
  // A trip to town with the ox and carreta: twelve loads, and a load of fifteen is refused in its own words.
  const driver = hand(world, household);
  household.resources.food = 60;
  const ways = errandFor(world, 'hh-1', driver.id, [{ id: 'store:food', n: 2, pay: 'coin' }], 'wagon').quote;
  const cart = ways.ways.find(way => way.id === 'wagon');
  assert.equal(cart.carry, CARRETA_CARRY);
  assert.equal(cart.name, 'With the ox and carreta');
  assert.equal(ways.can, true, ways.why);
  const tooMuch = errandFor(world, 'hh-1', driver.id, [{ id: 'store:food', n: 3, pay: 'coin' }]).quote.ways.find(way => way.id === 'wagon');
  assert.equal(tooMuch.can, false);
  assert.equal(tooMuch.why, `The carreta carries ${CARRETA_CARRY}, and this is 15 loads.`);
  // Taken: held by one person, and the next is told who has it.
  applyAction(world, 'hh-1', { action: 'chore', entityId: driver.id, chore: 'visit-shop', errand: [{ id: 'store:food', n: 2, pay: 'coin' }], errandMode: 'wagon' });
  stepWorld(world);
  assert.equal(driver.chore?.mode, 'wagon', 'the carreta did not go to town');
  assert.equal(userOf(world, household, 'wagon'), driver, 'the carreta is not held by whoever took it');
  const other = hand(world, household);
  const shut = errandFor(world, 'hh-1', other.id, [{ id: 'store:food', n: 2, pay: 'coin' }]).quote;
  assert.equal(shut.can, false);
  assert.match(shut.ways.find(way => way.id === 'wagon').why, new RegExp(`^${driver.name} has the (ox and )?wagon`));
  // Two riders beside its driver, as a cart.
  const kids = [9, 7, 5, 3].map((age, i) => ({ id: `k${i}`, kind: 'person', age, health: { condition: 'well' } }));
  const plan = seatPlan([{ id: 'p', kind: 'person', age: 30, principal: true, health: { condition: 'well' } }, ...kids], [{ id: carreta.id, kind: 'wagon', carreta: true }]);
  assert.equal([...plan.values()].filter(seat => seat.rides).length, CART_RIDERS);
  // In the flight east: ten spaces' worth of a wagon's room, and the story says the carreta.
  const flightWorld = home([1, 2], { stem: 'carreta-flight' });
  make(flightWorld.world, flightWorld.household);
  assert.deepEqual(flightRoom(flightWorld.world, flightWorld.household), { room: FLIGHT_ROOM * CARRETA_SPACE / WAGON_SPACE, mode: 'wagon', carreta: true });
  validateWorld(world);
});

test('a harvest that wants the wagon takes the carreta, and a family that made one no longer carries its crop in by hand', () => {
  const { world, household } = home();
  make(world, household);
  household.field = { ...household.field, cleared: 3, state: 'ripe', changedTick: 0 };
  const worker = hand(world, household);
  applyAction(world, 'hh-1', { action: 'chore', entityId: worker.id, chore: 'harvest-field' });
  assert.deepEqual(worker.chore.with, ['ox', 'wagon'], 'the harvest did not take the carreta');
  assert.ok(!(worker.chore.flags || []).includes('by-hand'), 'a family with a carreta carried its crop in by hand');
  assert.ok(CHORES['make-carreta'].describe.includes(`carries ${CARRETA_CARRY} loads to a wagon's ${MODES.wagon.carry}`));
  validateWorld(world);
});

test('what the carreta is made of is said before it is sent, and nothing a family cannot see is read', () => {
  const { world, household } = home();
  const worker = hand(world, household);
  for (const entity of Object.values(world.entities)) if (entity.traits) entity.traits = { strength: 9187, health: 9281, housework: 9373 };
  assert.equal(carretaRefusal(world, household, worker), null);
  const wire = JSON.stringify(projectWorld(world, 'hh-1', 'student', { includeMap: false }));
  assert.doesNotMatch(wire, /9187|9281|9373/);
  assert.match(CHORES['make-carreta'].describe, /felling axe, 3 logs from the pile and a hide/);
  // Refused, the order throws the same words and nothing moves.
  household.resources.hides = 0;
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: worker.id, chore: 'make-carreta' }), /no hide in the house/);
  assert.equal(worker.chore, null);
  // And a family of modest means that never made one is unchanged by any of this.
  const modest = modestMeans(home([7, 8, 9, 10], { stem: 'carreta-plain' }).world);
  assert.equal(beastsOf(modest, modest.households['hh-1'], 'wagon').some(one => one.carreta), false);
});

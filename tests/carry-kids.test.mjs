// Adults carry small kids (owner, 2026-10-02, answering the question of triage 3.1; sim/company.mjs step 5, `FIC-GONZ-1061`).
//
// When a family goes on foot - leaving or losing its wagon, setting out with none, on the road east or home, or running from
// soldiers - each child of two to five without a seat is carried by somebody walking of fourteen or more, well and not already
// carrying a baby, one child each. A carried child sets no pace; its carrier goes at a quarter under a grown walker's (the owner's
// own measure for a baby on the hip, sim/babies.mjs `HIP_PACE`). More small children than carriers: the rest walk, and set the pace.
// A baby under two keeps its own rule: in its mother's arms, and she is not slowed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CARRYING_SPEED, CARRY_UNDER, CARRIER_FROM, CHILD_WALK_SPEED, SMALL_WALK_SPEED, companyPace, seatPlan, setOut } from '../sim/company.mjs';
import { HIP_PACE } from '../sim/babies.mjs';
import { WALK_SPEED, WAGON_SPEED } from '../sim/travel.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { INFANTRY_MPH, altoOptions, runMph } from '../sim/pursuit.mjs';
import { reseat, withFamily } from '../sim/road.mjs';
import { turnHome } from '../sim/scrape.mjs';
import { spring, until } from './support/scrape-spring.mjs';
import { placeFamily, sceneFor, stowAway } from './support/scrape-scene.mjs';

const mother = (id = 'm', extra = {}) => ({ id, kind: 'person', age: 30, sex: 'female', ...extra });
const father = (id = 'f', extra = {}) => ({ id, kind: 'person', age: 32, sex: 'male', ...extra });
const child = (id, age, parents = ['m', 'f'], extra = {}) => ({ id, kind: 'person', age, sex: 'female', kin: { parents }, ...extra });
const walk = people => { const plan = seatPlan(people); return { plan, pace: companyPace(people, plan), seat: id => plan.get(id) }; };

test('the rule: a small child on foot is carried, one to a carrier, the carrier a quarter slower; babies and the rest as before', () => {
  // The carrier's pace is the owner's measure for a child on the hip, and slower than marching infantry; the ages are the rule's.
  assert.equal(CARRYING_SPEED, WALK_SPEED * HIP_PACE, 'the carrying pace is not the owner\'s quarter');
  assert.ok(CARRYING_SPEED * 3 < INFANTRY_MPH && CARRYING_SPEED > WAGON_SPEED);
  assert.deepEqual([CARRY_UNDER, CARRIER_FROM], [6, 14]);
  // One grown person and a child of three: carried, and the pace is the carrier's, not the child's.
  let one = walk([mother(), child('c3', 3)]);
  assert.equal(one.seat('c3').carried, 'm');
  assert.equal(one.seat('m').carrying, 'c3');
  assert.equal(one.pace, CARRYING_SPEED);
  // A baby keeps its rule: in its mother's arms, and she goes at a grown pace.
  one = walk([mother(), child('b', 1)]);
  assert.equal(one.seat('b').carried, 'm');
  assert.equal(one.pace, WALK_SPEED, 'a mother carrying a baby on the family\'s road was slowed');
  // The mother has the baby; the father takes the child of three.
  one = walk([mother(), father(), child('b', 1), child('c3', 3)]);
  assert.deepEqual([one.seat('b').carried, one.seat('c3').carried], ['m', 'f']);
  assert.equal(one.pace, CARRYING_SPEED);
  // Alone with a baby and a child of three: nobody free to carry the child, who walks and sets the pace.
  one = walk([mother(), child('b', 1, ['m']), child('c3', 3, ['m'])]);
  assert.equal(one.seat('c3').carried, undefined);
  assert.equal(one.pace, SMALL_WALK_SPEED);
  // Two carriers, three small children: the two youngest carried, the eldest walks and sets the pace.
  one = walk([mother(), father(), child('c2', 2), child('c3', 3), child('c4', 4)]);
  assert.deepEqual(['c2', 'c3', 'c4'].map(id => Boolean(one.seat(id).carried)), [true, true, false]);
  assert.equal(one.pace, SMALL_WALK_SPEED);
  // A sister of fourteen carries; one of twelve does not; nobody sick carries; a child of six is not carried.
  assert.equal(walk([child('s14', 14, []), child('c3', 3, [])]).seat('c3').carried, 's14');
  assert.equal(walk([child('s12', 12, []), child('c3', 3, [])]).seat('c3').carried, undefined);
  assert.equal(walk([mother('m', { health: { condition: 'sick' } }), child('c3', 3)]).seat('c3').carried, undefined);
  one = walk([mother(), child('c6', 6)]);
  assert.equal(one.seat('c6').carried, undefined);
  assert.equal(one.pace, CHILD_WALK_SPEED);
  // Seated again on the road (sim/road.mjs `reseat` keeps each journey and deals the seats afresh): a mother whose child is no
  // longer with her carries nobody, and goes at her own pace again.
  const m = mother(), c = child('c3', 3);
  setOut([m, c], [], () => ({ mode: 'foot', speed: WALK_SPEED, purpose: 'flee' }));
  assert.equal(m.travel.carrying, 'c3');
  setOut([m], [], entity => entity.travel);
  assert.equal(m.travel.carrying, undefined, 'a mother seated again without her child still carries it');
  assert.equal(m.travel.speed, WALK_SPEED);
  // With room in the wagon the small children ride, and nobody carries anybody.
  const people = [mother(), father(), child('c2', 2), child('c3', 3)], wagon = [{ id: 'w' }];
  const plan = seatPlan(people, wagon);
  assert.ok(['c2', 'c3'].every(id => plan.get(id).rides === 'w') && ![...plan.values()].some(seat => seat.carrying));
  assert.equal(companyPace(people, plan, wagon), WAGON_SPEED);
});

/** What leaving the wagon was priced at in the chase below, for its own check. */
let chasePrice = null;
/** Only this family's mother and its child of three on the road: the rest stayed at home. */
const motherAndChild = h => (world => {
  const home = world.map.sites[h.homeSiteId];
  for (const one of h.members.map(id => world.entities[id])) {
    if (one.kind !== 'person' || one.sex === 'female' && (one.age === 3 || one.kin?.role === 'mother')) continue;
    one.travel = null; one.task = 'rest'; one.location = { x: home.x, y: home.y, siteId: home.id };
  }
});

test('the chase: a mother who leaves the wagon and runs from infantry carrying her child of three gets away', () => {
  // The owner's case. Walking, the child of three held them to a mile and a half an hour and the column took them; carried, the
  // mother goes at two and a quarter, the soldiers at two and a half close on her by yards a minute, and they give it up first.
  const world = spring();
  const { household } = sceneFor(world, { kind: 'infantry', how: 'wagon', householdId: 'hh-4', prepare: h => motherAndChild(h)(world) });
  const going = withFamily(world, household).people;
  const mum = going.find(one => one.kin?.role === 'mother'), small = going.find(one => one.age === 3);
  assert.ok(mum && small && going.length === 2, `the family on the road is not a mother and a child of three: ${going.map(one => `${one.name} ${one.age}`)}`);
  until(world, () => household.flight.ask?.id === 'alto', 40);
  assert.equal(household.flight.ask?.id, 'alto', 'the soldiers never called on the family to halt');
  chasePrice = { mph: runMph(world, household, 'abandon-run'), label: altoOptions(world, household).find(option => option.id === 'abandon-run').label };
  applyAction(world, household.id, { action: 'road-answer', entityId: mum.id, option: 'abandon-run' });
  // As the family set off running: who carries whom, and the pace (asked after the outcome, so a regression shows in the outcome).
  const seated = { carried: small.travel.carried, carrying: mum.travel.carrying, speeds: [mum, small].map(one => one.travel.speed) };
  for (let t = 0; t < 300 && !(household.flight.pursued?.length && !household.flight.chase); t++) stepWorld(world);
  const outcome = household.flight.pursued?.at(-1);
  assert.equal(outcome?.outcome, 'escaped', `a mother carrying her child of three was ${outcome?.outcome || 'still chased'}`);
  assert.equal(seated.carried, mum.id, 'the child of three walks');
  assert.equal(seated.carrying, small.id);
  assert.deepEqual(seated.speeds, [CARRYING_SPEED, CARRYING_SPEED], 'the mother and child do not go at the pace of the carrier');
  assert.ok(outcome.shots === 0, 'the soldiers fired on a woman and a child');
  validateWorld(world);
});

test('the chase: leaving the wagon was priced at the carrier\'s pace, two and a quarter miles an hour (said as 2.3)', () => {
  assert.ok(chasePrice, 'the chase above did not run');
  assert.equal(chasePrice.mph, 2.3, 'leaving the wagon was not priced at a carrier\'s pace');
  assert.match(chasePrice.label, /\(2\.3 miles an hour\)/);
});

test('on the road east and home, on foot, the small children are carried and the pace is the slowest walker who is not', () => {
  // East: the whole family on foot from the start (sim/flight-route.mjs `setOutOnLeg`). Its baby in the mother's arms, the father
  // takes the child of three; the child of five has nobody free and walks, so the family goes at her pace.
  let world = spring();
  let household = world.households['hh-4'];
  stowAway(world, household, 'harrisburg');
  placeFamily(world, household, { from: 'harrisburg', to: 'lynchburg', atMiles: 1, how: 'foot' });
  let people = withFamily(world, household).people;
  const by = age => people.find(one => one.age === age);
  assert.equal(by(1).travel.carried, by(38).id, 'the baby is not in its mother\'s arms');
  assert.equal(by(3).travel.carried, by(32).id, 'the child of three is not carried by its father');
  assert.equal(by(5).travel.carried, undefined, 'the child of five was carried with nobody free to carry her');
  for (const one of people) assert.equal(one.travel.speed, SMALL_WALK_SPEED, `${one.name} does not go at the pace of the child of five walking`);
  // The child of five kept walking by the hand (sim/flight-work.mjs `road-little-ones`): the family goes at its older walkers' pace,
  // which is the father's, carrying the child of three - not a grown person's free pace.
  applyAction(world, household.id, { action: 'chore', entityId: by(38).id, chore: 'road-little-ones' });
  stepWorld(world);
  assert.equal(household.flight.hurried, true, 'the little ones are not being kept walking');
  for (const one of withFamily(world, household).people) assert.equal(one.travel.speed, CARRYING_SPEED, `${one.name} does not go at the carrier's pace with the little ones kept walking`);
  // Seated again for the same two going on alone (sim/road.mjs `reseat`): she carries her child, at her pace.
  world = spring(); household = world.households['hh-4'];
  stowAway(world, household, 'harrisburg');
  placeFamily(world, household, { from: 'harrisburg', to: 'lynchburg', atMiles: 1, how: 'foot' });
  motherAndChild(household)(world);
  reseat(world, household);
  people = withFamily(world, household).people;
  assert.equal(people.length, 2);
  assert.ok(people.every(one => one.travel.speed === CARRYING_SPEED), 'a mother carrying her child does not go at the carrier\'s pace');
  // Home: turned for home from its refuge without its wagon (sim/scrape.mjs `turnHome`). The horse carries the youngest who is not
  // in arms; the child left on foot is carried; the family goes at the carrier's pace.
  world = spring(); household = world.households['hh-4'];
  stowAway(world, household, 'harrisburg');
  household.flight.mode = 'foot';
  turnHome(world, null, new Set([household.id]));
  assert.equal(household.flight.status, 'returning', 'the family did not turn for home');
  people = household.members.map(id => world.entities[id]).filter(one => one.travel?.purpose === 'return');
  const small = people.filter(one => one.age >= 2 && one.age < 6);
  assert.ok(small.length, 'no small child on the road home: nothing to check');
  for (const kid of small) assert.ok(kid.travel.carried || kid.travel.rides, `${kid.name} (${kid.age}) walks home with a grown person free to carry her`);
  const carriers = people.filter(one => one.travel.carrying);
  assert.ok(carriers.length, 'nobody carries a small child home: nothing to check');
  for (const one of people) assert.equal(one.travel.speed, CARRYING_SPEED, `${one.name} does not go home at the carrier's pace`);
  validateWorld(world);
});

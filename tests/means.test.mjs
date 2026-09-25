// A family's means, rolled beside its family, and who rides and who walks when it moves together (owner, 2026-09-25: "introduce
// rolling for starting wealth. tie it into the extra wagons. part of wealth will be number of wagons. if a family doesn't have
// enough wagons, older family members walk. have this potentially affect travelling speed."; sim/means.mjs, sim/company.mjs,
// docs/FAMILY_CREATION.md and docs/SETTLING_IN.md §4b, HIST-TEX-442, FIC-GONZ-393 to -395).
//
// Held here: the second die is the seed's and the household's, the same every time and every band reached; each band comes with
// the vehicles it says and the load packed for their room, a cart three quarters of a wagon; the seats go to a driver for every
// vehicle, then the sick and the youngest, a baby in its carrier's arms, and the eldest walk; the family goes at its slowest -
// the ox with a vehicle, a small child on foot slower, a family on foot its smallest walker - and walkers are tired as walkers;
// the arrival, the flight east and the way home are seated so; a cart family can do its first steps, harvest and flee; the
// families nobody plays get means on the first tick and live their lives; a class made before opens as it was; nothing hidden
// is read or sent, no other family's seats reach a student, and the seats cost the tick little.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectFamily, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { eatenADay, familyRoll, meansRoll } from '../sim/family.mjs';
import { ARRIVAL_DAYS, MEANS_BANDS, MEANS_BANDS_BEFORE, MEANS_COIN, MEANS_TABLE, bandFor, carriedOnFoot, coinFor, meansProjection, settleMeans } from '../sim/means.mjs';
import { CART_RIDERS, CHILD_WALK_SPEED, SMALL_WALK_SPEED, WAGON_RIDERS, companyPace, seatPlan, walkingPace } from '../sim/company.mjs';
import { CART_SPACE, PACK_SPACE, WAGON_SPACE, spaceOf, wagonSpaceFor } from '../sim/wagon.mjs';
import { MODES, WAGON_SPEED, WALK_SPEED } from '../sim/travel.mjs';
import { beastsOf } from '../sim/beasts.mjs';
import { FLIGHT_ROOM, flee, flightProjection, flightRoom, turnHome } from '../sim/scrape.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { hostOverview } from '../sim/overview.mjs';
import { carriedWithRider, passengersOf, seatOf, walksBeside, wagonTeams } from '../public/motion.js';
import { readSave, writeSave } from '../server/storage.mjs';
import { settle, taught } from './support/settled.mjs';

/** A seed whose first family rolls `size` people and a means roll in this band. */
function seedFor(bandId, size = null, stem = 'means') {
  const band = MEANS_BANDS.find(one => one.id === bandId);
  for (let n = 0; n < 200000; n++) {
    const seed = `${stem}-${n}`, roll = meansRoll(seed, 'hh-1');
    if (roll >= band.from && roll <= band.to && (size === null || familyRoll(seed, 'hh-1') === size)) return seed;
  }
  throw new Error(`no seed for ${bandId} ${size}`);
}
/** A class in its lobby whose hh-1 has rolled into this band, with this many people. */
function rolled(bandId, size = null, { map = 'gonzales', stem = 'means' } = {}) {
  const world = createGonzalesWorld(seedFor(bandId, size, `${stem}-${map}`), 5, { map });
  rollFamily(world, world.households['hh-1']);
  return world;
}
const people = (world, household) => household.members.map(id => world.entities[id]);
const person = (id, age, extra = {}) => ({ id, kind: 'person', age, health: { condition: 'well' }, ...extra });
const wagon = (id, cart = false) => ({ id, kind: 'wagon', ...(cart && { cart: true }) });

test('the means die is the class\'s and the household\'s, the same every time, and every band is reached', () => {
  // The second table (owner, 2026-09-25, evening): the lowest two faces come with no vehicle. 10, 20, 40, 20 and 10 in a hundred.
  assert.deepEqual(MEANS_BANDS.map(band => [band.from, band.to]), [[1, 2], [3, 6], [7, 14], [15, 18], [19, 20]]);
  for (let roll = 1; roll <= 20; roll++) assert.equal(bandFor(roll).id, roll <= 2 ? 'hard-up' : roll <= 6 ? 'poor' : roll <= 14 ? 'modest' : roll <= 18 ? 'comfortable' : 'well-to-do');
  // The first table, which a class made that afternoon keeps.
  assert.deepEqual(MEANS_BANDS_BEFORE.map(band => [band.from, band.to]), [[1, 6], [7, 14], [15, 18], [19, 20]]);
  assert.throws(() => bandFor(0)); assert.throws(() => bandFor(21));
  const seen = new Set(), faces = new Set();
  let same = 0;
  for (let n = 0; n < 400; n++) {
    const roll = meansRoll(`dice-${n}`, 'hh-1');
    assert.equal(roll, meansRoll(`dice-${n}`, 'hh-1'), 'the means die is not the seed\'s');
    faces.add(roll); seen.add(bandFor(roll).id);
    if (roll === familyRoll(`dice-${n}`, 'hh-1')) same++;
  }
  assert.equal(faces.size, 20, 'a face of the die is never rolled');
  assert.equal(seen.size, 5, 'a band is never reached');
  assert.ok(same < 60, `the two dice run together (${same} of 400 the same)`);
  // Rolled by the family's own press, and kept: a reload reads the same means, and a second roll is refused.
  const world = rolled('comfortable');
  const household = world.households['hh-1'];
  assert.equal(world.meansRoll, MEANS_TABLE);
  assert.deepEqual(household.means, { roll: meansRoll(world.seed, 'hh-1'), band: 'comfortable', coin: coinFor(meansRoll(world.seed, 'hh-1')) });
  assert.throws(() => rollFamily(world, household), /already rolled/);
  assert.match(world.events.find(event => event.type === 'family-rolled').text, new RegExp(`^Your family rolled an? \\d+, and an? ${household.means.roll} for what it has\\.$`));
  validateWorld(world);
});

test('each band comes with the vehicles it says, an ox to each and the horse, and the load packed for their room', () => {
  const want = { 'hard-up': 0, poor: 1, modest: 1, comfortable: 2, 'well-to-do': 3 };
  const stores = load => Object.fromEntries(load.filter(entry => ['provisions', 'seed', 'powder'].includes(entry.id)).map(entry => [entry.id, entry.amount]));
  for (const band of MEANS_BANDS) {
    for (const size of [1, 6, 14]) {
      const world = rolled(band.id, size), household = world.households['hh-1'];
      // A wagon's worth of stores to each wagon, from the load one wagon was packed with; a cart's trimmed to its room.
      const packed = stores(createGonzalesWorld(world.seed, 5).households['hh-1'].load);
      if (!band.cart && !band.afoot) assert.deepEqual(stores(household.load), Object.fromEntries(Object.entries(packed).map(([id, n]) => [id, n * want[band.id]])), `${band.id}: the stores are not a wagon's to each wagon`);
      const wagons = beastsOf(world, household, 'wagon'), oxen = beastsOf(world, household, 'ox');
      assert.equal(household.means.band, band.id);
      assert.equal(wagons.length, want[band.id], `${band.id}: ${wagons.length} vehicles`);
      // A family on foot keeps one ox, to carry the packs.
      assert.equal(oxen.length, Math.max(1, want[band.id]), `${band.id}: ${oxen.length} oxen`);
      assert.equal(beastsOf(world, household, 'horse').length, 1, 'the horse is one a family whatever its means');
      if (band.afoot) {
        assert.equal(world.entities['hh-1-wagon'], undefined, 'a family on foot came with the family wagon');
        assert.ok(!household.property.some(id => /wagon/.test(id)), 'a family on foot still lists a wagon');
      } else {
        assert.equal(Boolean(wagons[0].cart), band.id === 'poor', `${band.id}: the family wagon is ${wagons[0].cart ? 'a cart' : 'a wagon'}`);
        assert.equal(wagons[0].name, band.id === 'poor' ? 'Family cart' : 'Family wagon');
      }
      assert.equal(wagonSpaceFor(household), band.afoot ? PACK_SPACE : band.id === 'poor' ? CART_SPACE : WAGON_SPACE * want[band.id]);
      assert.ok(spaceOf(household.load) <= wagonSpaceFor(household), `${band.id}: the load is past the room`);
      // The first steps want these, and no band leaves them behind (docs/LESSON.md).
      for (const id of ['hoe', 'axe']) assert.ok(household.load.some(entry => entry.id === id), `${band.id} left the ${id}`);
      assert.ok(household.resources.seed >= 2, `${band.id} brought too little seed to plant`);
      // Every family has at least one shot for its first hunt, on foot or not.
      assert.ok(household.resources.powder >= 1, `${band.id} brought no powder`);
      // The coin of the face rolled, in the house (owner, 2026-09-25).
      assert.equal(household.resources.money, coinFor(household.means.roll), `${band.id}: the family did not come with its coin`);
      for (const beast of [...wagons, ...oxen]) assert.equal(beast.travel?.purpose, 'arrive', `${beast.id} is not on the road in`);
      const founding = world.events.find(event => event.type === 'household-founded' && event.householdId === 'hh-1').text;
      assert.match(founding, band.afoot ? /with the ox under packs and the horse, on foot/ : band.id === 'poor' ? /with the cart, the ox and the horse/ : want[band.id] === 1 ? /with the wagon, the ox and the horse/ : /wagons, an ox to each, and the horse/);
      const shown = projectFamily(world, 'hh-1').means;
      assert.equal(shown.name, band.name);
      assert.equal(shown.coin, household.means.coin);
      assert.match(shown.words, band.afoot ? /^No wagon or cart: an ox to carry the packs/ : band.id === 'poor' ? /^A cart and one ox/ : want[band.id] === 1 ? /^A wagon and an ox/ : /wagons, an ox to each/);
      assert.match(shown.words, new RegExp(`, the family's horse, and ${household.means.coin} reales\.$`), 'the coin is not said with the band');
      const pack = projectWorld(world, 'hh-1', 'student', { includeMap: false }).wagon;
      assert.equal(pack.vehicle, band.afoot ? 'packs' : band.id === 'poor' ? 'cart' : undefined);
      validateWorld(world);
    }
  }
});

test('no family arrives with fewer than five days of food for its eaters, whatever its means and its size', () => {
  assert.equal(ARRIVAL_DAYS, 5);
  let packed = 0, least = Infinity;
  for (const band of MEANS_BANDS) {
    for (let size = 1; size <= 20; size++) {
      for (const stem of ['food-a', 'food-b']) {
        const world = rolled(band.id, size, { stem }), household = world.households['hh-1'];
        const days = household.resources.food / eatenADay(world, people(world, household));
        least = Math.min(least, days);
        assert.ok(days >= ARRIVAL_DAYS - 1e-9, `${band.id}, ${size} people: ${household.resources.food} food, ${days.toFixed(1)} days`);
        if (household.packs) packed++;
        // A family on foot carries all of its food, and its people can: five a person of ten and over (`carriedOnFoot`).
        if (band.afoot) {
          assert.equal(household.resources.food, household.packs.food, 'a family on foot brought food in no pack of its own');
          assert.ok(household.packs.food <= carriedOnFoot(world, household), `${size} on foot carry ${household.packs.food} food, more than ${carriedOnFoot(world, household)}`);
        }
        // Repacking the cart moves what the cart holds, never what is carried on foot.
        const carried = household.packs?.food ?? 0;
        if (carried && household.load.some(entry => entry.id === 'provisions')) {
          const barrels = household.load.find(entry => entry.id === 'provisions').amount;
          applyAction(world, 'hh-1', { action: 'load-wagon', item: 'provisions', amount: barrels - 1 });
          assert.equal(household.resources.food, (barrels - 1) * 4 + carried, 'the food carried on foot went with a barrel');
        }
        validateWorld(world);
      }
    }
  }
  assert.ok(packed > 0, 'no family needed to carry food, so the floor was never tested');
  // The families nobody plays too, and the arrival line says what was carried.
  // Measured as the first tick gives them their means, before anybody has eaten a minute of it.
  const world = createGonzalesWorld(seedFor('poor', null, 'food-nobody'), 12);
  settleMeans(world);
  for (const household of Object.values(world.households)) assert.ok(household.resources.food / eatenADay(world, people(world, household)) >= ARRIVAL_DAYS - 1e-9, `${household.id} arrives hungry`);
  const poor = rolled('poor', 14, { stem: 'food-line' });
  poor.status = 'running';
  for (let t = 0; t < 400 && poor.households['hh-1'].arriving; t++) stepWorld(poor);
  assert.match(poor.events.find(event => event.type === 'arrival' && event.householdId === 'hh-1').text, /They carried \d+ food more on foot, in sacks and bundles\./);
  assert.equal(projectWorld(rolled('poor', 14, { stem: 'food-line' }), 'hh-1', 'student', { includeMap: false }).wagon.packs, poor.households['hh-1'].packs.food);
  const bad = structuredClone(poor); bad.households['hh-1'].packs = { food: 2.5 };
  assert.throws(() => validateWorld(bad), /Invalid packs/);
});

test('a driver to every vehicle, then the sick and the youngest ride, a baby in its carrier\'s arms, and the eldest walk', () => {
  const father = person('f', 40, { principal: true, kin: { role: 'father' } }), mother = person('m', 38, { sex: 'female', kin: { role: 'mother' } });
  const kids = [17, 15, 12, 9, 7, 5, 3].map((age, i) => person(`c${i}`, age, { kin: { role: 'son', parents: ['f', 'm'] } }));
  const baby = person('b', 0, { kin: { role: 'daughter', parents: ['f', 'm'] } });
  const family = [father, mother, ...kids, baby];
  // One wagon: the father drives; the four youngest who can sit ride; the baby rides in nobody's lap but its mother's, who walks.
  const one = seatPlan(family, [wagon('w1')]);
  assert.deepEqual(one.get('f'), { drives: 'w1' });
  assert.deepEqual(['c3', 'c4', 'c5', 'c6'].map(id => one.get(id)), Array(WAGON_RIDERS).fill({ rides: 'w1' }));
  for (const id of ['m', 'c0', 'c1', 'c2']) assert.deepEqual(one.get(id), { afoot: true }, `${id} did not walk`);
  assert.deepEqual(one.get('b'), { afoot: true, carried: 'm' }, 'the baby was not carried by its mother');
  // Two wagons: the eldest after the principal drives the second - the mother - and the baby rides in her lap; there is room
  // for all ten.
  const two = seatPlan(family, [wagon('w1'), wagon('w2')]);
  assert.deepEqual(two.get('m'), { drives: 'w2' });
  assert.equal(family.filter(one => two.get(one.id).afoot).length, 0, 'somebody walks with room for ten');
  assert.deepEqual(two.get('b'), { rides: 'w2', carried: 'm' });
  // A cart: two beside its driver. The sick ride before the youngest.
  const sick = { ...kids[1], health: { condition: 'sick' } };
  const cart = seatPlan([father, mother, kids[0], sick, ...kids.slice(2), baby], [wagon('c', true)]);
  assert.deepEqual(cart.get(sick.id), { rides: 'c' }, 'the sick walked');
  assert.equal([...cart.values()].filter(seat => seat.rides && !seat.carried).length, CART_RIDERS);
  assert.deepEqual(cart.get('c6'), { rides: 'c' }, 'the youngest walked');
  assert.deepEqual(cart.get('c5'), { afoot: true }, 'a cart took more than two');
  // Nobody under ten drives, and with no vehicle everybody walks.
  const young = seatPlan([person('a', 30, { principal: true }), person('k', 8)], [wagon('w1'), wagon('w2')]);
  assert.equal(young.get('k').drives, undefined, 'a child of eight was given a wagon to drive');
  assert.ok([...seatPlan(family, []).values()].every(seat => seat.afoot), 'somebody rode with no vehicle and no horse');
});

test("the horse carries a rider: one more seat after the vehicles', to the sick and then the youngest, and a baby in its carrier's arms", () => {
  // Owner, 2026-09-25: "yes, the horse should carry a rider" (sim/company.mjs, FIC-GONZ-394 amended).
  const father = person('f', 40, { principal: true, kin: { role: 'father' } }), mother = person('m', 38, { sex: 'female', kin: { role: 'mother' } });
  const kids = [14, 11, 8, 4].map((age, i) => person(`k${i}`, age, { kin: { role: 'son', parents: ['f', 'm'] } }));
  const horse = { id: 'h1', kind: 'animal', species: 'horse' };
  // No vehicle: the youngest who is not carried rides the horse, and the rest walk.
  const afoot = seatPlan([father, mother, ...kids], [], [horse]);
  assert.deepEqual(afoot.get('k3'), { rides: 'h1', saddle: true }, 'the youngest was not put on the horse');
  assert.equal([...afoot.values()].filter(seat => seat.saddle).length, 1, 'a horse carried more than one');
  for (const id of ['f', 'm', 'k0', 'k1', 'k2']) assert.deepEqual(afoot.get(id), { afoot: true });
  // And a family of grown people and a child of four walks at a grown person's pace: the child is on the horse.
  assert.equal(companyPace([father, mother, kids[3]], seatPlan([father, mother, kids[3]], [], [horse]), []), WALK_SPEED, 'the child on the horse held the family back');
  // The sick before the youngest.
  const sick = { ...kids[0], health: { condition: 'sick' } };
  assert.deepEqual(seatPlan([father, mother, sick, ...kids.slice(1)], [], [horse]).get(sick.id), { rides: 'h1', saddle: true }, 'the sick walked while the horse carried a child');
  // After the wagon's seats: a wagon's four ride and the horse takes the fifth youngest.
  const many = [father, mother, ...[12, 10, 9, 7, 5, 3].map((age, i) => person(`c${i}`, age))];
  const withWagon = seatPlan(many, [wagon('w')], [horse]);
  assert.deepEqual(withWagon.get('c1'), { rides: 'h1', saddle: true }, "the horse did not take the one after the wagon's seats");
  assert.deepEqual(['c2', 'c3', 'c4', 'c5'].map(id => withWagon.get(id)), Array(WAGON_RIDERS).fill({ rides: 'w' }));
  // Room in the wagon for all: the horse carries nobody.
  assert.ok(![...seatPlan([father, mother, kids[3]], [wagon('w')], [horse]).values()].some(seat => seat.saddle), 'somebody was put on the horse with room in the wagon');
  // A baby rides where its carrier rides: on the horse in its mother's arms.
  const lone = person('m', 30, { principal: true, sex: 'female' }), baby = person('b', 0, { kin: { parents: ['m'] } });
  assert.deepEqual(seatPlan([lone, baby], [], [horse]).get('b'), { rides: 'h1', saddle: true, carried: 'm' });
  // Two horses, two riders.
  assert.equal([...seatPlan([father, mother, ...kids], [], [horse, { ...horse, id: 'h2' }]).values()].filter(seat => seat.saddle).length, 2);
});

test('the family goes at its slowest: the ox with a vehicle, a small child on foot slower, and on foot its smallest walker', () => {
  assert.deepEqual([30, 10, 9, 6, 5, 2].map(age => walkingPace({ age })), [WALK_SPEED, WALK_SPEED, CHILD_WALK_SPEED, CHILD_WALK_SPEED, SMALL_WALK_SPEED, SMALL_WALK_SPEED]);
  assert.equal(walkingPace({}), WALK_SPEED, 'somebody with no age walks slower than a grown person');
  assert.ok(CHILD_WALK_SPEED >= WAGON_SPEED && SMALL_WALK_SPEED < WAGON_SPEED, 'a child of six does not keep up with the ox, or one of three does');
  const pace = (family, vehicles) => companyPace(family, seatPlan(family, vehicles), vehicles);
  const grownUps = [person('a', 30, { principal: true }), person('b', 28)];
  // Enough wagons: the ox's pace, however many walk beside.
  assert.equal(pace([...grownUps, person('c', 4), person('d', 3)], [wagon('w')]), WAGON_SPEED);
  // Too few: a child of four has to walk, and holds the family back.
  const many = [...grownUps, ...[5, 4, 4, 3, 2].map((age, i) => person(`k${i}`, age))];
  assert.equal(pace(many, [wagon('c', true)]), SMALL_WALK_SPEED, 'a small child on foot did not slow the cart');
  assert.equal(pace(many, [wagon('w')]), SMALL_WALK_SPEED, 'the fifth small child on foot did not slow the wagon');
  assert.equal(pace(many, [wagon('w'), wagon('x')]), WAGON_SPEED, 'with seats for every small child the family was still slowed');
  // Walkers of six to nine keep up.
  assert.equal(pace([...grownUps, ...[9, 8, 7, 6, 6, 6].map((age, i) => person(`o${i}`, age))], [wagon('c', true)]), WAGON_SPEED);
  // No vehicle: a grown family walks at a walker's pace, and one with a small child at the child's. A baby is carried.
  assert.equal(pace(grownUps, []), WALK_SPEED);
  assert.equal(pace([...grownUps, person('n', 8)], []), CHILD_WALK_SPEED);
  assert.equal(pace([...grownUps, person('n', 0, { kin: { parents: ['a'] } })], []), WALK_SPEED, 'a baby in arms walked');
});

test('on the road in each is seated, walkers are tired as walkers, the family comes in together, and the page draws them so', () => {
  const world = rolled('poor', 16);
  const household = world.households['hh-1'];
  const family = people(world, household);
  const seats = family.map(one => one.travel);
  assert.equal(seats.filter(travel => travel.drives).length, 1, 'the cart has more or fewer than one driver');
  assert.equal(seats.filter(travel => travel.rides && !travel.carried && !travel.saddle).length, CART_RIDERS);
  // And one on the horse (owner, 2026-09-25: "the horse should carry a rider"), riding with the horse's id.
  const onHorse = family.filter(one => one.travel.saddle && !one.travel.carried);
  assert.equal(onHorse.length, 1, 'the horse did not carry one rider');
  assert.equal(onHorse[0].travel.rides, 'hh-1-horse');
  assert.ok(seats.filter(travel => travel.afoot).length >= 11, 'a family of sixteen with a cart does not mostly walk');
  // The eldest walk: nobody riding is older than anybody walking (the driver aside).
  const riding = family.filter(one => one.travel.rides && !one.travel.carried), walking = family.filter(one => one.travel.afoot && !one.travel.carried);
  assert.ok(Math.max(...riding.map(one => one.age)) <= Math.min(...walking.map(one => one.age)), 'an older one rides while a younger walks');
  // Everybody and everything of the family at one pace, the slowest walker's or the ox's.
  const pace = new Set([...household.members, ...household.property].map(id => world.entities[id].travel.speed));
  assert.equal(pace.size, 1, 'the family is not one company');
  const slowest = Math.min(WAGON_SPEED, ...walking.map(walkingPace));
  assert.equal([...pace][0], slowest);
  // The page: the driver drawn on the cart, the riders in it and not beside it, the walkers beside it.
  const seen = projectWorld(world, 'hh-1', 'student', { includeMap: false }).entities;
  const [team] = wagonTeams('hh-1', seen);
  assert.equal(team.driverId, household.principalId);
  assert.equal(seatOf(seen.find(one => one.id === team.driverId), seen), 'wagon');
  assert.deepEqual(passengersOf(team, seen).map(one => one.id).sort(), family.filter(one => one.travel.rides && !one.travel.saddle).map(one => one.id).sort());
  for (const rider of passengersOf(team, seen)) assert.equal(carriedWithRider(rider, seen), true, `${rider.id} is drawn walking as well`);
  // The one on the horse is drawn in the saddle, and the horse under them is not drawn again by itself.
  const mounted = seen.find(one => one.id === onHorse[0].id), horse = seen.find(one => one.id === 'hh-1-horse');
  assert.equal(mounted.travel.saddle, true, 'the page is not told who is on the horse');
  assert.equal(seatOf(mounted, seen), 'horse', 'the rider on the horse is not drawn in the saddle');
  assert.equal(carriedWithRider(horse, seen), true, 'the horse under its rider is drawn again by itself');
  assert.equal(walksBeside(mounted), false, 'the rider on the horse is drawn walking beside the cart');
  // The page draws the drivers the server named and no others: a lone parent with three wagons and small children drives one,
  // and the other two go undriven rather than a child of the family being put on them.
  const lone = rolled('well-to-do', 3, { stem: 'lone' });
  const loneSeen = projectWorld(lone, 'hh-1', 'student', { includeMap: false }).entities;
  for (const drawn of wagonTeams('hh-1', loneSeen)) {
    const named = loneSeen.find(one => one.kind === 'person' && one.travel?.drives === drawn.wagon.id);
    assert.equal(drawn.driverId, named?.id ?? null, `${drawn.wagon.id} is drawn driven by somebody the server did not name`);
  }
  assert.equal(seen.filter(walksBeside).length, family.filter(one => one.travel.afoot).length);
  // Walked, the road costs a walker a walked mile and a rider the wagon's half; a baby carried, nothing.
  world.status = 'running';
  const walker = walking.find(one => one.age >= 10), rider = riding.find(one => !one.travel.saddle), horseman = onHorse[0];
  for (let t = 0; t < 3; t++) stepWorld(world);
  const miles = walker.travel?.progress;
  assert.ok(miles > 0, 'the family came in before a walked mile could be measured');
  assert.ok(Math.abs(walker.exertion - miles) < 1e-3, `the walker paid ${walker.exertion} for ${miles} miles`);
  assert.ok(Math.abs(rider.exertion - miles / 2) < 1e-3, `the rider paid ${rider.exertion} for ${miles} miles`);
  assert.ok(Math.abs(horseman.exertion - miles * MODES.horse.exertion) < 1e-3, `the rider on the horse paid ${horseman.exertion} for ${miles} miles`);
  const baby = family.find(one => one.travel?.carried);
  if (baby) assert.equal(baby.exertion ?? 0, 0, 'a baby carried was tired by the road');
  for (let t = 0; t < 400 && household.arriving; t++) stepWorld(world);
  assert.equal(household.arriving, undefined, 'the family never came in');
  for (const id of [...household.members, ...household.property]) assert.equal(world.entities[id].location.siteId, household.homeSiteId, `${id} was left on the road`);
  assert.equal(world.events.filter(event => event.type === 'arrival' && event.householdId === 'hh-1').length, 1);
  validateWorld(world);
});

test('a family of many small children in one cart comes in slower than the ox, and one with room at the ox\'s pace', () => {
  const ticks = world => { const household = world.households['hh-1']; world.status = 'running'; let n = 0; while (household.arriving && n < 900) { stepWorld(world); n++; } return n; };
  // A poor family of twenty whose small children outnumber the cart's two seats and the horse's one.
  let poor, family, small = [];
  for (let n = 0; n < 40 && !small.length; n++) {
    poor = rolled('poor', 20, { stem: `slow-${n}` });
    family = people(poor, poor.households['hh-1']);
    small = family.filter(one => one.travel.afoot && !one.travel.carried && one.age < 6);
  }
  const distance = family[0].travel.distance;
  assert.ok(small.length, 'the fixture has no small child on foot, so this proves nothing');
  assert.equal(family[0].travel.speed, SMALL_WALK_SPEED, 'a child of under six walks and the family goes at the ox');
  assert.ok(ticks(poor) > Math.ceil(distance / WAGON_SPEED - 1e-9), 'the family came in as fast as the ox with a small child walking');
  const rich = rolled('well-to-do', 6, { stem: 'fast' });
  assert.equal(people(rich, rich.households['hh-1'])[0].travel.speed, WAGON_SPEED, 'a family with room for all was slowed');
  assert.ok(people(rich, rich.households['hh-1']).every(one => !one.travel.afoot), 'somebody walked with three wagons for six');
});

/** A family on its land in the spring, told to leave (sim/scrape.mjs), without playing two periods to get there. */
function toldToLeave(bandId, size) {
  const world = taught(settle(rolled(bandId, size, { map: 'colonies', stem: 'flight' })));
  world.status = 'running';
  world.period = 3;
  const household = world.households['hh-1'];
  household.played = true;
  household.flight = { status: 'ordered', orderedMinute: world.minute };
  return { world, household };
}

test('the flight east and the way home are seated and paced as the family is; a cart holds three quarters of a wagon', () => {
  const { world, household } = toldToLeave('poor', 12);
  assert.deepEqual(flightRoom(world, household), { room: FLIGHT_ROOM * CART_SPACE / WAGON_SPACE, mode: 'wagon', cart: true });
  const shown = flightProjection(world, household);
  flee(world, household, { take: {}, refuge: [...shown.refuges].sort((a, b) => a.miles - b.miles)[0].id });
  const family = people(world, household).filter(one => one.travel?.purpose === 'flee');
  assert.equal(family.length, household.members.length);
  assert.equal(family.filter(one => one.travel.drives).length, 1);
  assert.equal(family.filter(one => one.travel.rides && !one.travel.carried && !one.travel.saddle).length, CART_RIDERS);
  assert.equal(family.filter(one => one.travel.saddle && !one.travel.carried).length, 1, 'nobody rode the horse east');
  const walking = family.filter(one => one.travel.afoot && !one.travel.carried);
  assert.equal(family[0].travel.speed, Math.min(WAGON_SPEED, ...walking.map(walkingPace)));
  assert.match(world.events.find(event => /set out east/.test(event.text)).text, /with the ox and cart/);
  // The way home: the same rule from the refuge.
  for (const one of [...household.members, ...household.property].map(id => world.entities[id])) {
    if (!one.travel) continue;
    one.location = { ...world.map.sites[household.flight.refuge], siteId: household.flight.refuge }; one.travel = null;
  }
  household.flight.status = 'refuged';
  turnHome(world, null);
  const home = people(world, household).filter(one => one.travel?.purpose === 'return');
  assert.ok(home.length && home.every(one => one.travel.drives || one.travel.rides || one.travel.afoot), 'the way home is not seated');
  validateWorld(world);
});

test('a family whose vehicle is gone flees on foot at the pace of its smallest walker, carrying a baby', () => {
  const { world, household } = toldToLeave('modest', 9);
  for (const beast of beastsOf(world, household, 'wagon')) beast.condition = 'lost';
  assert.equal(flightRoom(world, household).mode, 'foot');
  const shown = flightProjection(world, household);
  flee(world, household, { take: {}, refuge: shown.refuges[0].id });
  const family = people(world, household).filter(one => one.travel?.purpose === 'flee');
  // Everybody on foot but the one the horse carries (and a baby in their arms).
  assert.ok(family.every(one => one.travel.mode === 'foot' && (one.travel.afoot || one.travel.saddle)), 'somebody rode with no vehicle');
  assert.equal(family.filter(one => one.travel.saddle && !one.travel.carried).length, 1, 'the horse carried nobody east');
  const walkers = family.filter(one => !one.travel.carried && one.travel.afoot);
  assert.equal(family[0].travel.speed, Math.min(WALK_SPEED, ...walkers.map(walkingPace)));
  for (const baby of family.filter(one => one.age < 2)) assert.ok(baby.travel.carried, `${baby.id} walked`);
  validateWorld(world);
});

test('a family with a cart does its first steps, brings in a crop that wants the wagon, and keeps the whole of its lesson', () => {
  const world = taught(settle(rolled('poor', 5)));
  world.status = 'running';
  const household = world.households['hh-1'];
  household.played = true;
  const worker = people(world, household).find(one => one.age >= 16);
  assert.equal(choreAvailability(world, household, worker, 'plant-field').can, true, choreAvailability(world, household, worker, 'plant-field').why);
  // The cart is the family's vehicle wherever the wagon is asked for (a ceiling: every vehicle is "the wagon" there).
  household.field = { ...household.field, cleared: 3, state: 'ripe', changedTick: 0 };
  applyAction(world, 'hh-1', { action: 'chore', entityId: worker.id, chore: 'harvest-field' });
  assert.deepEqual(worker.chore?.with, ['ox', 'wagon'], 'a crop that wants the wagon could not use the cart');
  validateWorld(world);
  // The lesson, from its first step, for a family on the road in with a cart (sim/lesson.mjs).
  const fresh = rolled('poor', 5, { stem: 'lesson' });
  fresh.households['hh-1'].played = true;
  fresh.status = 'running';
  for (let t = 0; t < 300 && fresh.households['hh-1'].arriving; t++) stepWorld(fresh);
  assert.equal(fresh.households['hh-1'].arriving, undefined);
  assert.ok(fresh.households['hh-1'].lesson, 'the cart family was given no lesson');
  validateWorld(fresh);
});

test('the families nobody plays are given means on the first running tick and go on living their lives', () => {
  const world = createGonzalesWorld('means-neighbours', 12, { neighbours: true });
  assert.ok(Object.values(world.households).every(household => !household.means), 'means before anybody rolled');
  world.status = 'running';
  stepWorld(world);
  const bands = new Set();
  for (const household of Object.values(world.households)) {
    assert.ok(household.means, `${household.id} has no means`);
    bands.add(household.means.band);
    // Seated on the road in with the vehicles they have, all at one pace.
    const speeds = new Set([...household.members, ...household.property].map(id => world.entities[id].travel?.speed).filter(Boolean));
    assert.ok(speeds.size <= 1, `${household.id} is not one company`);
  }
  assert.ok(bands.size >= 2, 'every family nobody plays has the same means');
  assert.equal(world.events.filter(event => /means/.test(event.text || '')).length, 0, 'the means were written into a family\'s record');
  for (let t = 0; t < 400; t++) stepWorld(world);
  for (const household of Object.values(world.households)) assert.equal(household.arriving, undefined, `${household.id} never came in`);
  validateWorld(world);
});

test('a class made before the means opens as it was: no means, no seats, the ox\'s pace, and a saved class keeps its own', () => {
  const old = createGonzalesWorld(seedFor('well-to-do', 12, 'old'), 5);
  delete old.meansRoll;
  rollFamily(old, old.households['hh-1']);
  old.status = 'running';
  stepWorld(old);
  for (const household of Object.values(old.households)) assert.equal(household.means, undefined);
  assert.equal(beastsOf(old, old.households['hh-1'], 'wagon').length, 1, 'a class made before was given wagons by means');
  for (const one of people(old, old.households['hh-1'])) {
    assert.equal(one.travel.speed, WAGON_SPEED);
    assert.equal(one.travel.drives ?? one.travel.rides ?? one.travel.afoot, undefined, `${one.id} was seated in a class made before`);
  }
  validateWorld(old);
  assert.equal(projectFamily(old, 'hh-1').meansDie, undefined, 'a class made before throws two dice');
  // A new class saved and opened keeps its means, and nothing that could not have been rolled is let in.
  const world = rolled('comfortable', 8);
  const dir = mkdtempSync(join(tmpdir(), 'means-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json')).world;
    validateWorld(opened);
    assert.deepEqual(opened.households['hh-1'].means, world.households['hh-1'].means);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const bad = (change, why) => { const copy = structuredClone(world); change(copy); assert.throws(() => validateWorld(copy), why); };
  bad(copy => { copy.households['hh-1'].means.band = 'well-to-do'; }, /Invalid means/);
  bad(copy => { copy.households['hh-1'].means.roll = 21; }, /Invalid means/);
  bad(copy => { copy.meansRoll = 'yes'; }, /Invalid means rule/);
  bad(copy => { copy.entities['hh-1-wagon'].cart = true; }, /Invalid cart/);
});

test('nothing hidden is read or sent; no other family\'s means or seats reach a student; the seats cost the tick little', () => {
  const world = rolled('poor', 12, { stem: 'wire' });
  for (const household of Object.values(world.households)) if (household.id !== 'hh-1') rollFamily(world, household);
  for (const entity of Object.values(world.entities)) if (entity.traits) entity.traits = { strength: 9187, health: 9281, housework: 9373 };
  const leak = /9187|9281|9373|"traits"|"strength"|"housework"/;
  world.status = 'running';
  stepWorld(world);
  assert.doesNotMatch(JSON.stringify(projectFamily(world, 'hh-1')), leak, 'the family book carries a hidden stat');
  assert.doesNotMatch(JSON.stringify(meansProjection(world, world.households['hh-1'])), leak);
  assert.doesNotMatch(JSON.stringify(projectWorld(world, 'hh-1', 'student', { includeMap: false })), leak);
  assert.doesNotMatch(JSON.stringify(hostOverview(world)), leak, 'the Host is sent a hidden stat');
  // The Host sees who walks and who rides, as it sees everybody.
  assert.ok(hostOverview(world).everyone.some(entity => entity.householdId === 'hh-1' && entity.travel?.afoot), 'the Host is not told who walks');
  // Another family: none of hh-1's seats or means, even standing beside them.
  const other = projectWorld(world, 'hh-2', 'student', { includeMap: false });
  const json = JSON.stringify(other);
  for (const id of world.households['hh-1'].members) assert.ok(!json.includes(`"${id}"`) || !(other.others || []).some(one => one.id === id && (one.travel?.rides || one.travel?.afoot || one.travel?.drives)), `${id}'s seat reached another family`);
  assert.ok(!json.includes('"cart"'), 'another family\'s cart reached a student');
  assert.equal(projectFamily(world, 'hh-2').means.roll, world.households['hh-2'].means.roll, "one family's book carries another's means");
  assert.ok(!JSON.stringify(projectFamily(world, 'hh-2')).includes('hh-1-'), "one family's book names another's people or wagons");
  // The seats on the wire: a family of twelve on the road in, with and without them.
  const view = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const bare = structuredClone(view);
  for (const entity of bare.entities) if (entity.travel) for (const key of ['drives', 'rides', 'afoot', 'carried']) delete entity.travel[key];
  const cost = JSON.stringify(view).length - JSON.stringify(bare).length;
  assert.ok(cost > 0 && cost <= 12 * 32, `the seats of a family of twelve cost ${cost} bytes a tick`);
});

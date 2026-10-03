// A family moving together: who rides, who walks, and how fast they all go.
//
// Owner, 2026-09-25: "introduce rolling for starting wealth. tie it into the extra wagons. part of wealth will be number of
// wagons. if a family doesn't have enough wagons, older family members walk. have this potentially affect travelling speed."
// (docs/SETTLING_IN.md §4b, docs/FAMILY_CREATION.md's amendment of that day.)
//
// Until this, a family on the road in went at the ox's pace and nobody was said to ride: the driver of each wagon was drawn on it
// and everybody else walked beside it. Now each wagon or cart has room for its driver and a few more, and the server says who
// sits where. What the record gives (`HIST-TEX-442`): small children rode and the rest walked - "Mother and I were walking, she
// with an infant in her arms. Brother drove the oxen, and my two little sisters rode in the sleigh" (Harris, of the Runaway
// Scrape); "women and children often go in a baggage wagon drawn by oxen" (Parker); a party "travel by the side of their baggage"
// (Woodman); in the flight "many of the women and children, even, had to walk" (Smithwick). And the ox is the pace: "the slow
// pace of the oxen" (Smithwick), twelve to eighteen miles a day (`HIST-TEX-093`). The numbers here are the game's own
// (`FIC-GONZ-394`, `FIC-GONZ-395`).
//
// **The rule, in the order it is applied** (`seatPlan`):
//   1. One driver to every vehicle going: the family's principal first, then the eldest of the rest who may be sent (ten or
//      more, sim/family.mjs `SENT_FROM_AGE`).
//   2. A baby under two is carried by its mother - or its father, or the eldest going - and goes where they go: in the wagon if
//      they ride or drive, in their arms if they walk. It takes no seat (Harris's mother walked "with an infant in her arms").
//   3. The seats - `WAGON_RIDERS` in a wagon beside its driver, `CART_RIDERS` in a cart - go to the sick first, then to the
//      youngest, and so on up by age.
//   4. Everybody left walks beside the wagons: the older of the family, as the owner said.
//   5. **A small child left on foot is carried** (owner, 2026-10-02, "Adults carry small kids"; `FIC-GONZ-1061`): each child of two
//      to five who has no seat is taken up by somebody walking - its mother, else its father, else the eldest walking - who is
//      fourteen or more, well, and not already carrying a baby or another child, one child to a carrier. Carried, the child does
//      not set the pace; its carrier goes at `CARRYING_SPEED`, a quarter slower than walking free, the owner's own measure for a
//      baby on the hip on a journey of one's own (`HIP_PACE`, `FIC-GONZ-630`): a child of two to five weighs more than a baby, so
//      a carrier is at least that slow. A baby under two keeps its own rule (step 2): its carrier is not slowed on the family's
//      road. More small children than carriers: the rest walk, and the slowest of them sets the pace.
// The family goes at its slowest (`companyPace`): the ox's pace when it has a vehicle, and no faster than whoever walks slowest -
// a carrier of a small child at `CARRYING_SPEED`, the child itself not at all (step 5, owner 2026-10-02).
// A walker of ten or more goes at a grown person's three miles an hour and a child of six to nine at two, and both keep up with
// the ox; **only a child of two to five on foot holds it back**, and they ride first, so that happens only when a large family
// has too few seats - a poor family's cart, or eighteen children in one wagon. A family with no vehicle at all walks at its
// slowest walker. Walkers are tired by the road as a walker is (`afoot`: a mile beside the wagon costs a walked mile); riders and
// drivers as the wagon's people always were; a carried baby, nothing.
//
// The plan is made when the family sets out, and made again on the road when what it has changes under it (triage 2026-09-29 3.1,
// interactions audit I-M2; sim/road.mjs `reseat`): when the soldiers take the wagon and the animals, when the family leaves the
// wagon in the road, and when it sets out again from its refuge. Until 2026-10-02 the children kept their places in a wagon the
// column had taken, were drawn riding, and a child of two walked at a grown person's pace.
// ceiling: otherwise the plan holds to the end of the leg: somebody who falls sick on the way east keeps the place they had.
// Replanning on a sickness is a reason to redo it, not a thing a class of an hour has shown it needs.
// ceiling: tired walkers are made tired as any walker is (sim/routines.mjs) and are not made to stop: nobody rests on the road in
// this game, riding or walking, and the day's seven hours of going (`ROAD_HOURS_A_DAY`) already has the nooning in it.
// ceiling: the game has nobody old - a parent is 20 to 45 (docs/FAMILY_CREATION.md §3) - and does not model a woman carrying a
// child, so "the oldest and the pregnant ride first" has nobody to apply to. A grandparent or a confinement would come first here.
//
// **The horse carries a rider** (owner, 2026-09-25, the second amendment of that day: "yes, the horse should carry a rider";
// `FIC-GONZ-394` amended). Until then the horse was led, never ridden, on the family's journeys. Now, in a class on the second
// table of means (sim/means.mjs `secondTable`), **every sound horse going with the family is one more seat**, dealt after the
// vehicles' seats and in the same order: the sick first, then the youngest (`riddenHorses`, `seatPlan`). So a family with room in
// its wagons leaves the horse without a rider, and one short of seats puts the next who would have walked on it - often a small
// child who would otherwise hold everybody back, led by a walker. A family with no vehicle at all puts its sick or its youngest on
// the horse and walks the rest. A baby goes on the horse in its carrier's arms, as it rides the wagon. A rider on the horse is
// tired as a rider (`saddle` on the travel record, sim/world.mjs), and is drawn in the saddle (public/motion.js `inTheSaddle`).
// The record: in the 1833 move "Mother, sister, and myself rode in the cart" while the men "traveled on horseback" (Harris, 4:2
// pp. 91-92, `HIST-TEX-442`); a woman rode "carrying the babe" while her husband walked (4:2 p. 119).
// ceiling: one rider a horse, whatever their size, and nobody is chosen by who can ride: a child of three is put up as readily as a
// man. The led horse of a family's journey is the one the rider sits.
//
// Only a class made since the means were rolled (`world.meansRoll`) goes by this. A class saved before keeps everybody at the
// ox's pace with the driver on the wagon and the rest beside it, exactly as it was, and no save version moved. A class that rolled
// on the first table (`world.meansRoll === true`) keeps the horse led.
import { WAGON_SPEED, WALK_SPEED } from './travel.mjs';
import { SENT_FROM_AGE, sexOf } from './family.mjs';
import { isMount, isOx, lame } from './beasts.mjs';

/** Riders a wagon takes beside its driver (`FIC-GONZ-394`, invented): a loaded family wagon's bed had room for a few. */
export const WAGON_RIDERS = 4;
/**
 * Riders a cart takes beside its driver (`FIC-GONZ-394`): half a wagon's, as Harris's two little sisters rode the loaded sleigh.
 * ceiling: one person one seat, whatever their size - a cart that took four small children takes two here.
 */
export const CART_RIDERS = 2;
/** A baby younger than this is carried and takes no seat (`FIC-GONZ-394`; Harris: "an infant in her arms"). */
export const CARRIED_UNDER = 2;
/**
 * How fast somebody walks by their age, in miles a farming tick (sim/travel.mjs; `FIC-GONZ-395`, invented - no source read gives a
 * child's pace on the road): ten and over, and anybody the game gives no age, a grown person's three miles an hour; six to nine,
 * two, which keeps up with the ox's not-quite-two; two to five, a mile and a half, which does not.
 */
export const CHILD_WALK_SPEED = 2 / 3, SMALL_WALK_SPEED = 0.5;
/**
 * Carrying a small child (owner, 2026-10-02, "Adults carry small kids"; `FIC-GONZ-1061`): who may be carried - a child of two to
 * five, `CARRIED_UNDER` to `CARRY_UNDER` - and who may carry one - anybody walking of `CARRIER_FROM` or more, well. Fourteen is the
 * game's own line: a boy or girl of that age has most of a grown person's strength and was given grown work in a frontier family,
 * where a child of ten or twelve could lead a sister by the hand but not carry one mile after mile (the road's little ones are
 * kept walking from seven, sim/flight-work.mjs `road-little-ones`; wading over with them on one's back is from sixteen, `ford-carry`).
 */
export const CARRY_UNDER = 6, CARRIER_FROM = 14;
/**
 * A carrier's pace, in miles a farming tick: two and a quarter miles an hour, a quarter slower than walking free (`HIP_PACE`, the
 * owner's own rule for a baby on the hip, 2026-09-27, `FIC-GONZ-630`). A child of two to five is two or three times a baby's
 * weight, so nothing slower than the baby's measure would be fair to the carrier, and nothing faster to the child. For the
 * chase, that is a little slower than marching infantry (two and a half, `HIST-TEX-660`): soldiers close on a mother carrying
 * her child, slowly - about seven yards a minute - where a child of three walking (a mile and a half) fell to them in minutes.
 * Invented; no source read gives the pace of a person carrying a child. The quarter is written here rather than imported (this
 * module is read while sim/babies.mjs is still loading); tests/carry-kids.test.mjs holds the two equal.
 */
export const CARRYING_SPEED = WALK_SPEED * 0.75;
/** A walker's pace with what their seat says they carry: a small child slows them to `CARRYING_SPEED` (a baby does not, step 2). */
export const walkerPace = (person, seat = person?.travel) => Math.min(walkingPace(person), seat?.carrying ? CARRYING_SPEED : Infinity);
export function walkingPace(person) {
  // Somebody lying wounded who must walk goes at a small child's pace (design audit S19, 2026-09-28; `FIC-GONZ-732`, invented):
  // a family with no wagon to carry him is that much slower for him.
  if (person?.health?.condition === 'wounded') return SMALL_WALK_SPEED;
  const age = person?.age;
  if (!Number.isFinite(age) || age >= 10) return WALK_SPEED;
  return age >= 6 ? CHILD_WALK_SPEED : SMALL_WALK_SPEED;
}

/**
 * How many ride in this vehicle beside its driver. A cart is a family's one vehicle of the poorest means (sim/means.mjs); a carreta
 * made at home (sim/carreta.mjs) seats a cart's two (`FIC-GONZ-398`).
 */
export const ridersIn = vehicle => (vehicle?.cart || vehicle?.carreta ? CART_RIDERS : WAGON_RIDERS);
/**
 * The horses among these movers that carry a rider on the family's journey together: every sound horse, in a class on the second
 * table of means (`meansRoll` 2, sim/means.mjs; owner 2026-09-25: "the horse should carry a rider"), and none in a class before.
 */
// Not a horse lamed in a chase until it mends (sim/beasts.mjs `lame`, triage 2026-09-29 3.2).
// A mule bought at the stock pens (2026-10-03, `FIC-GONZ-1130`) is one more seat as a horse is: one rider, the sick or the youngest,
// dealt after the horses. ceiling: its pack is not counted on the family's road - a mule carrying a rider carries no more of the
// load than a horse does; a pack mule in the flight's room (sim/scrape.mjs `flightRoom`) is the way out.
export const riddenHorses = (world, movers = []) => (world?.meansRoll === 2 ? movers.filter(entity => isMount(entity) && (!entity.condition || entity.condition === 'sound') && !lame(world, entity))
  .sort((a, b) => (a.species === 'mule') - (b.species === 'mule')) : []);

/** Somebody the game gives no age sorts as their place says: a parent grown, a founding son or daughter an adolescent. */
const ageFor = person => (Number.isFinite(person.age) ? person.age : person.kin?.role === 'father' || person.kin?.role === 'mother' ? 30 : 12);
const mayDrive = person => !Number.isFinite(person.age) || person.age >= SENT_FROM_AGE;
const carried = person => Number.isFinite(person.age) && person.age < CARRIED_UNDER;
const unwell = person => ['sick', 'wounded'].includes(person.health?.condition);

/**
 * Who of these people drives, rides or walks, given the vehicles going with them (each drawn by an ox) and the horses that carry
 * a rider (`riddenHorses`). Returns a map of person id to `{ drives }`, `{ rides }` (a vehicle, or a horse with `saddle`),
 * `{ afoot: true }`, with `carried` (who carries them) on a baby, and the order it was dealt in. Pure: the same people, vehicles
 * and horses always give the same plan.
 */
export function seatPlan(people, vehicles = [], horses = []) {
  const plan = new Map();
  const order = new Map(people.map((person, i) => [person.id, i]));
  const byAge = (a, b) => ageFor(a) - ageFor(b) || order.get(a.id) - order.get(b.id);
  // 1. A driver to every vehicle: the principal, then the eldest who may be sent.
  const drivers = [...people.filter(person => person.principal && mayDrive(person)), ...people.filter(person => !person.principal && mayDrive(person) && !carried(person)).sort((a, b) => byAge(b, a))];
  vehicles.forEach((vehicle, i) => { if (drivers[i]) plan.set(drivers[i].id, { drives: vehicle.id }); });
  // 3. The seats: the sick first, then the youngest up, the vehicles' first and then one on each horse. The babies are left for
  // their carriers.
  const free = [...vehicles.map(vehicle => ({ id: vehicle.id, left: ridersIn(vehicle) })), ...horses.map(horse => ({ id: horse.id, left: 1, saddle: true }))];
  const waiting = people.filter(person => !plan.has(person.id) && !carried(person)).sort((a, b) => (unwell(b) - unwell(a)) || byAge(a, b));
  for (const person of waiting) {
    const seat = free.find(one => one.left > 0);
    if (seat) { seat.left--; plan.set(person.id, { rides: seat.id, ...(seat.saddle && { saddle: true }) }); } else plan.set(person.id, { afoot: true });
  }
  // 2. Every baby with whoever carries it: its mother, else its father, else the eldest going.
  const going = new Set(people.map(person => person.id));
  const eldest = [...people].filter(person => !carried(person)).sort((a, b) => byAge(b, a))[0];
  for (const baby of people.filter(carried)) {
    const parents = (baby.kin?.parents || []).filter(id => going.has(id)).map(id => people.find(person => person.id === id));
    const carrier = parents.find(parent => sexOf(parent) === 'female') || parents[0] || eldest;
    const theirs = carrier ? plan.get(carrier.id) : null;
    const where = !theirs || theirs.afoot ? { afoot: true } : { rides: theirs.drives || theirs.rides, ...(theirs.saddle && { saddle: true }) };
    plan.set(baby.id, { ...where, ...(carrier && { carried: carrier.id }) });
  }
  // 5. Every small child left on foot carried by somebody walking, one child each, while there are carriers (owner, 2026-10-02).
  const holding = new Set([...plan.values()].map(seat => seat.carried).filter(Boolean));
  const mayCarry = person => plan.get(person.id)?.afoot && !plan.get(person.id).carried && !holding.has(person.id) && !unwell(person) && ageFor(person) >= CARRIER_FROM;
  const small = people.filter(person => plan.get(person.id)?.afoot && !plan.get(person.id).carried && Number.isFinite(person.age) && person.age >= CARRIED_UNDER && person.age < CARRY_UNDER).sort(byAge);
  for (const child of small) {
    const parents = (child.kin?.parents || []).map(id => people.find(person => person.id === id)).filter(Boolean);
    const carrier = [...parents.filter(parent => sexOf(parent) === 'female'), ...parents, ...[...people].sort((a, b) => byAge(b, a))].find(mayCarry);
    if (!carrier) break;
    holding.add(carrier.id);
    plan.set(child.id, { afoot: true, carried: carrier.id });
    plan.set(carrier.id, { ...plan.get(carrier.id), carrying: child.id });
  }
  return plan;
}

/** The pace of a family moving together: the ox's with a vehicle, and never faster than its slowest walker. Babies are carried. */
export function companyPace(people, plan, vehicles = []) {
  const walkers = people.filter(person => plan.get(person.id)?.afoot && !plan.get(person.id)?.carried);
  // A carrier of a small child at `CARRYING_SPEED` (owner, 2026-10-02); a carried child, like a baby, sets no pace.
  const slowest = walkers.length ? Math.min(...walkers.map(person => walkerPace(person, plan.get(person.id)))) : WALK_SPEED;
  return vehicles.length ? Math.min(WAGON_SPEED, slowest) : Math.min(WALK_SPEED, slowest);
}

/**
 * What one person's seat puts on their travel record: `drives` or `rides` with the vehicle's id, `saddle` when what they ride is the
 * horse, `afoot`, and `carried` by whom. Read by sim/world.mjs `progressTravel` (what the miles cost them) and sent with their
 * travel to the family and the Host.
 */
// `carrying`: the small child this walker carries (owner, 2026-10-02), read for their pace (`walkerPace`).
export const seatFields = seat => (!seat ? {} : { ...(seat.drives && { drives: seat.drives }), ...(seat.rides && { rides: seat.rides }), ...(seat.saddle && { saddle: true }), ...(seat.afoot && { afoot: true }), ...(seat.carried && { carried: seat.carried }), ...(seat.carrying && { carrying: seat.carrying }) });
/** The seat fields a travel record carries, copied out for a projection. */
export const seatOfTravel = travel => seatFields(travel && { drives: travel.drives, rides: travel.rides, saddle: travel.saddle, afoot: travel.afoot, carried: travel.carried, carrying: travel.carrying });

/**
 * The family's people and beasts setting out together: every one of `movers` given `base` as its journey, at the company's pace,
 * with each person's seat on it. `vehicles` are the wagons and carts going, each with an ox; `horses` those that carry a rider
 * (`riddenHorses`). A family going with no vehicle goes on foot, whatever way the journey was begun (`mode`). Returns the pace.
 */
export function setOut(movers, vehicles, base, horses = []) {
  const people = movers.filter(entity => entity.kind === 'person');
  const plan = seatPlan(people, vehicles, horses);
  const speed = companyPace(people, plan, vehicles);
  for (const entity of movers) {
    const { drives, rides, saddle, afoot, carried: by, carrying, ...rest } = base(entity);
    if (!vehicles.length && rest.mode === 'wagon') rest.mode = 'foot';
    entity.travel = { ...rest, speed, ...(entity.kind === 'person' && seatFields(plan.get(entity.id))) };
  }
  return speed;
}

/** The vehicles among these movers that an ox among them can draw, one ox to a vehicle, the family wagon first. */
export function drawnVehicles(movers) {
  const wagons = movers.filter(entity => entity.kind === 'wagon' && (!entity.condition || entity.condition === 'sound'));
  // The ox alone draws: a horse never has, and a mule bought in town does not (2026-10-03; ceiling: a mule in a cart's shafts is
  // historical, and `isOx` is where it would be let in).
  const oxen = movers.filter(entity => isOx(entity) && (!entity.condition || entity.condition === 'sound'));
  return wagons.slice(0, oxen.length);
}

/** "the horse", "the horses", "the mule", "the horse and the mule": the mounts a family's riders are on, in words. */
function mountWords(mounts = []) {
  const horses = mounts.filter(one => one.species !== 'mule').length, mules = mounts.length - horses;
  const one = (n, word) => (n > 1 ? `the ${word}s` : `the ${word}`);
  return [horses ? one(horses, 'horse') : null, mules ? one(mules, 'mule') : null].filter(Boolean).join(' and ') || 'the horse';
}
/**
 * In words, for the family's means (sim/means.mjs): "4 ride and 6 walk beside the wagon." With no vehicle, "1 rides the horse and
 * 5 walk." A rider on the horse is counted among those who ride.
 */
export function seatWords(people, vehicles, horses = []) {
  const plan = seatPlan(people, vehicles, horses);
  const walk = people.filter(person => plan.get(person.id)?.afoot).length, ride = people.length - walk;
  const beside = vehicles.length > 1 ? 'the wagons' : vehicles[0]?.cart ? (vehicles[0].style === 'carreta' ? 'the carreta' : 'the cart') : vehicles[0]?.carreta ? 'the carreta' : 'the wagon';
  if (!vehicles.length) {
    if (!ride) return people.length === 1 ? 'They walk.' : 'They all walk.';
    if (!walk) return people.length === 1 ? `They ride ${mountWords(horses)}.` : `All ${people.length} ride.`;
    return `${ride} ${ride === 1 ? 'rides' : 'ride'} ${mountWords(horses)} and ${walk} ${walk === 1 ? 'walks' : 'walk'}.`;
  }
  if (!walk) return people.length === 1 ? 'There is room for them to ride.' : `There is room for all ${people.length} to ride.`;
  return `${ride} ${ride === 1 ? 'rides' : 'ride'} and ${walk} ${walk === 1 ? 'walks' : 'walk'} beside ${beside}.`;
}

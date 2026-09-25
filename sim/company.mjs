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
// The family goes at its slowest (`companyPace`): the ox's pace when it has a vehicle, and no faster than whoever walks slowest.
// A walker of ten or more goes at a grown person's three miles an hour and a child of six to nine at two, and both keep up with
// the ox; **only a child of two to five on foot holds it back**, and they ride first, so that happens only when a large family
// has too few seats - a poor family's cart, or eighteen children in one wagon. A family with no vehicle at all walks at its
// slowest walker. Walkers are tired by the road as a walker is (`afoot`: a mile beside the wagon costs a walked mile); riders and
// drivers as the wagon's people always were; a carried baby, nothing.
//
// ceiling: the plan is made once, when the family sets out, and holds to the end of the road: somebody who falls sick on the way
// east keeps the place they had. Replanning mid-road is a reason to redo it, not a thing a class of an hour has shown it needs.
// ceiling: tired walkers are made tired as any walker is (sim/routines.mjs) and are not made to stop: nobody rests on the road in
// this game, riding or walking, and the day's seven hours of going (`ROAD_HOURS_A_DAY`) already has the nooning in it.
// ceiling: the game has nobody old - a parent is 20 to 45 (docs/FAMILY_CREATION.md §3) - and does not model a woman carrying a
// child, so "the oldest and the pregnant ride first" has nobody to apply to. A grandparent or a confinement would come first here.
// ceiling: the horse is led, never ridden, on the family's journeys, as it always was. Harris's family rode "father's horse" when
// the cart was full; a seat on the horse would be one more here.
//
// Only a class made since the means were rolled (`world.meansRoll`) goes by this. A class saved before keeps everybody at the
// ox's pace with the driver on the wagon and the rest beside it, exactly as it was, and no save version moved.
import { WAGON_SPEED, WALK_SPEED } from './travel.mjs';
import { SENT_FROM_AGE, sexOf } from './family.mjs';

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
export function walkingPace(person) {
  const age = person?.age;
  if (!Number.isFinite(age) || age >= 10) return WALK_SPEED;
  return age >= 6 ? CHILD_WALK_SPEED : SMALL_WALK_SPEED;
}

/** How many ride in this vehicle beside its driver. A cart is a family's one vehicle of the poorest means (sim/means.mjs). */
export const ridersIn = vehicle => (vehicle?.cart ? CART_RIDERS : WAGON_RIDERS);

/** Somebody the game gives no age sorts as their place says: a parent grown, a founding son or daughter an adolescent. */
const ageFor = person => (Number.isFinite(person.age) ? person.age : person.kin?.role === 'father' || person.kin?.role === 'mother' ? 30 : 12);
const mayDrive = person => !Number.isFinite(person.age) || person.age >= SENT_FROM_AGE;
const carried = person => Number.isFinite(person.age) && person.age < CARRIED_UNDER;
const unwell = person => ['sick', 'wounded'].includes(person.health?.condition);

/**
 * Who of these people drives, rides or walks, given the vehicles going with them (each drawn by an ox). Returns a map of person
 * id to `{ drives }`, `{ rides }`, `{ afoot: true }`, with `carried` (who carries them) on a baby, and the order it was dealt in.
 * Pure: the same people and vehicles always give the same plan.
 */
export function seatPlan(people, vehicles = []) {
  const plan = new Map();
  const order = new Map(people.map((person, i) => [person.id, i]));
  const byAge = (a, b) => ageFor(a) - ageFor(b) || order.get(a.id) - order.get(b.id);
  // 1. A driver to every vehicle: the principal, then the eldest who may be sent.
  const drivers = [...people.filter(person => person.principal && mayDrive(person)), ...people.filter(person => !person.principal && mayDrive(person) && !carried(person)).sort((a, b) => byAge(b, a))];
  vehicles.forEach((vehicle, i) => { if (drivers[i]) plan.set(drivers[i].id, { drives: vehicle.id }); });
  // 3. The seats: the sick first, then the youngest up. The babies are left for their carriers.
  const free = vehicles.map(vehicle => ({ id: vehicle.id, left: ridersIn(vehicle) }));
  const waiting = people.filter(person => !plan.has(person.id) && !carried(person)).sort((a, b) => (unwell(b) - unwell(a)) || byAge(a, b));
  for (const person of waiting) {
    const seat = free.find(one => one.left > 0);
    if (seat) { seat.left--; plan.set(person.id, { rides: seat.id }); } else plan.set(person.id, { afoot: true });
  }
  // 2. Every baby with whoever carries it: its mother, else its father, else the eldest going.
  const going = new Set(people.map(person => person.id));
  const eldest = [...people].filter(person => !carried(person)).sort((a, b) => byAge(b, a))[0];
  for (const baby of people.filter(carried)) {
    const parents = (baby.kin?.parents || []).filter(id => going.has(id)).map(id => people.find(person => person.id === id));
    const carrier = parents.find(parent => sexOf(parent) === 'female') || parents[0] || eldest;
    const theirs = carrier ? plan.get(carrier.id) : null;
    const where = !theirs || theirs.afoot ? { afoot: true } : { rides: theirs.drives || theirs.rides };
    plan.set(baby.id, { ...where, ...(carrier && { carried: carrier.id }) });
  }
  return plan;
}

/** The pace of a family moving together: the ox's with a vehicle, and never faster than its slowest walker. Babies are carried. */
export function companyPace(people, plan, vehicles = []) {
  const walkers = people.filter(person => plan.get(person.id)?.afoot && !plan.get(person.id)?.carried);
  const slowest = walkers.length ? Math.min(...walkers.map(walkingPace)) : WALK_SPEED;
  return vehicles.length ? Math.min(WAGON_SPEED, slowest) : Math.min(WALK_SPEED, slowest);
}

/**
 * What one person's seat puts on their travel record: `drives` or `rides` with the vehicle's id, `afoot`, and `carried` by whom.
 * Read by sim/world.mjs `progressTravel` (what the miles cost them) and sent with their travel to the family and the Host.
 */
export const seatFields = seat => (!seat ? {} : { ...(seat.drives && { drives: seat.drives }), ...(seat.rides && { rides: seat.rides }), ...(seat.afoot && { afoot: true }), ...(seat.carried && { carried: seat.carried }) });
/** The seat fields a travel record carries, copied out for a projection. */
export const seatOfTravel = travel => seatFields(travel && { drives: travel.drives, rides: travel.rides, afoot: travel.afoot, carried: travel.carried });

/**
 * The family's people and beasts setting out together: every one of `movers` given `base` as its journey, at the company's pace,
 * with each person's seat on it. `vehicles` are the wagons and carts going, each with an ox. Returns the pace.
 */
export function setOut(movers, vehicles, base) {
  const people = movers.filter(entity => entity.kind === 'person');
  const plan = seatPlan(people, vehicles);
  const speed = companyPace(people, plan, vehicles);
  for (const entity of movers) {
    const { drives, rides, afoot, carried: by, ...rest } = base(entity);
    entity.travel = { ...rest, speed, ...(entity.kind === 'person' && seatFields(plan.get(entity.id))) };
  }
  return speed;
}

/** The vehicles among these movers that an ox among them can draw, one ox to a vehicle, the family wagon first. */
export function drawnVehicles(movers) {
  const wagons = movers.filter(entity => entity.kind === 'wagon' && (!entity.condition || entity.condition === 'sound'));
  const oxen = movers.filter(entity => entity.kind === 'animal' && entity.species !== 'horse' && (!entity.condition || entity.condition === 'sound'));
  return wagons.slice(0, oxen.length);
}

/** In words, for the family's means (sim/means.mjs): "4 ride and 6 walk beside the wagon." */
export function seatWords(people, vehicles) {
  const plan = seatPlan(people, vehicles);
  const walk = people.filter(person => plan.get(person.id)?.afoot).length, ride = people.length - walk;
  const beside = vehicles.length > 1 ? 'the wagons' : vehicles[0]?.cart ? 'the cart' : 'the wagon';
  if (!vehicles.length) return people.length === 1 ? 'They walk.' : 'They all walk.';
  if (!walk) return people.length === 1 ? 'There is room for them to ride.' : `There is room for all ${people.length} to ride.`;
  return `${ride} ${ride === 1 ? 'rides' : 'ride'} and ${walk} ${walk === 1 ? 'walks' : 'walk'} beside ${beside}.`;
}

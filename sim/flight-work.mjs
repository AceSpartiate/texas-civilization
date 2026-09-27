// What a family does on the Runaway Scrape besides run: the whole family's, children's and grown-ups', owner 2026-09-26
// (docs/CHILDREN.md §7): "when it's the runaway scrape, if a family has to run, the kids and family members as a whole should
// have new tasks and abilities specifically geared for that. be creative."
//
// Each is a real work on the one chore table (`registerFlightWork`), with an icon on the family panel that glows while the
// server says somebody is at it, offered only while it can mean something - before the family leaves, on the road, or camped at
// a crossing or the refuge - and each does what it says, where the flight's own rules are (sim/scrape.mjs, sim/road.mjs):
//
// | Work | Who | When | What it does |
// | --- | --- | --- | --- |
// | `flee-hide` Hide what the wagon cannot carry | 10 and over | told to leave | Seed, powder and cotton left behind, up to `HIDE_ROOM`, are hidden in the river bottom: no fire and no forager finds them, and they are there when the family comes home. |
// | `flee-bundle` Make up a bundle to carry | 5 to 15 | told to leave | Each child with a bundle carries `BUNDLE_ROOM` more of the family's goods on foot - leaving without a wagon, or leaving it in the mud. |
// | `road-lookout` Watch the road behind | 7 and over | on the road or at the refuge | Riders are seen further off: word of the army comes at `LOOKOUT_MILES`, not twenty. |
// | `road-sing` Sing to keep the little ones walking | 3 and over | on the road | The family's walkers are worn by the road at `SINGING_SHARE` of what they would be. |
// | `road-little-ones` Keep the little ones walking | 7 and over | on the road, a small child walking | The little ones kept by the hand: the family goes at the pace of its older walkers, not its smallest. |
// | `camp-fire` Keep a fire going | 5 and over | at a crossing or the refuge | A norther finds nobody of the family out in the cold that night or the next. |
// | `ferry-help` Help load at the ferry | 10 and over | waiting at a crossing | The family's turn comes `FERRY_HELP_HOURS` sooner, once a crossing. |
// | `share-food` Share food with a family camped here | 10 and over | at a crossing or the refuge | A food goes from this family's store to the hungriest family camped at the same place. |
// | `ford-carry` Carry the little ones over | 16 and over | on foot at a crossing, the water below its banks | The family wades over now rather than waiting its turn, and everybody with it is worn by it. |
//
// And one rule that is nobody's work: at a flooded crossing **a family with a sick child is let over first** (`SICK_FIRST_SHARE`),
// as the ferryman at the Trinity did (`HIST-TEX-639`). The nursing of the sick, the hunt from the camp, the line in the river and
// the trade at the crossing were already the road's (sim/road.mjs), and what the wagon holds and who goes to the army are the
// family's as they were; none of those changed.
//
// A child's works here are **jobs**, so a child's obedience governs them as at home (sim/obedience.mjs): they may dawdle before
// starting, and on the road a child who wanders off from one has left it off and is back with the family.
//
// What the record gives and what is invented is set out in docs/CHILDREN.md §7: the hiding and the sick first are the record's
// (`HIST-TEX-639`, `-640`); the rest are the game's own reconstructions of it (`FIC-GONZ-487` to `-489`). Every field written onto
// `household.flight` here is absent until it happens, so **no save version moved**.
import { registerChores } from './chores.mjs';
import { record } from './events.mjs';
import { canAnswerCalls, tooYoung } from './family.mjs';
import { beginsJob } from './obedience.mjs';
import { walkingPace } from './company.mjs';
import { WAGON_SPEED, WALK_SPEED } from './travel.mjs';
import { WATER_SHUT, waterAt } from './weather.mjs';

const GONE = Object.freeze(['dead', 'captured']);
const DAY = 1440;
const round = value => Math.round(value * 100) / 100;

/** The room's worth of goods left behind that can be hidden, in the wagon's units (sim/scrape.mjs `FLIGHT_SPACE`): a morning's digging. */
export const HIDE_ROOM = 6;
/** What is hidden, in the order it is chosen: the powder and the seed a family cannot begin again without, then the cotton. */
export const HIDDEN_GOODS = Object.freeze(['powder', 'seed', 'cotton']);
/** What a child's bundle carries, in the wagon's units: a shawl's worth, two fifths of a grown person's pack (`CARRIED_ROOM`). */
export const BUNDLE_ROOM = 0.5;
/** How far off a lookout sees riders on the road behind, in miles, against the road's twenty (sim/road.mjs `WARNING_MILES`). */
export const LOOKOUT_MILES = 30;
/** What the road wears a walker by while somebody of the family sings them along. */
export const SINGING_SHARE = 0.75;
/** How much sooner the family's turn at the ferry comes when one of it helps load, in hours. */
export const FERRY_HELP_HOURS = 6;
/** What a family with a sick child waits at a flooded crossing, as a share of the ordinary wait (`HIST-TEX-639`). */
export const SICK_FIRST_SHARE = 0.5;
/** What a food shared is: one, from this family's store to another's. */
export const SHARED_FOOD = 1;
/** Wading over with the little ones on their backs wears everybody who goes this much, in miles of road (sim/routines.mjs). */
export const FORD_MILES = 6;

const people = (world, household) => household.members.map(id => world.entities[id]).filter(one => one && !GONE.includes(one.health?.condition));
/** Whether this person is with the family on the road east, or camped with it at the refuge. */
const withTheFamily = (household, entity) => {
  const flight = household.flight;
  return Boolean(flight) && entity.service?.status !== 'serving' && (flight.status === 'fled' ? entity.travel?.purpose === 'flee' : flight.status === 'refuged' && !entity.travel && entity.location?.siteId === flight.refuge);
};
const toldToGo = household => ['ordered', 'stayed'].includes(household.flight?.status);
const campedHere = household => Boolean(household.flight?.crossing) || household.flight?.status === 'refuged';
const placeOfCamp = household => household.flight?.crossing?.siteId || (household.flight?.status === 'refuged' ? household.flight.refuge : null);
const dayOf = world => Math.floor(world.minute / DAY);
const tell = (world, household, entity, text, claimId, importance = 2) => record(world, 'consequence', {
  actorId: entity?.id, householdId: household.id, importance, classification: 'FICTIONAL FOR GAMEPLAY', claimId, text,
});
const ageOf = entity => (Number.isFinite(entity?.age) ? entity.age : entity?.kin?.role === 'father' || entity?.kin?.role === 'mother' ? 30 : 12);

// ------------------------------------------------------------------------------------------------ what the flight reads

/**
 * The family leaves (sim/scrape.mjs `flee`): what it leaves in the house is `left`; if it hid its things first, the powder, the
 * seed and the cotton of it, up to `HIDE_ROOM`, go into the river bottom instead (`flight.cache`). Returns what is left in the house.
 */
export function hideAtLeaving(household, left, space) {
  const flight = household.flight;
  if (!flight?.hid) return left;
  const rest = { ...left }, cache = { ...(flight.cache || {}) };
  let room = HIDE_ROOM;
  for (const good of HIDDEN_GOODS) {
    const amount = Math.min(rest[good] || 0, Math.floor(room / space[good] + 1e-9));
    if (amount <= 0) continue;
    cache[good] = (cache[good] || 0) + amount; rest[good] -= amount; room -= amount * space[good];
  }
  if (Object.keys(cache).length) flight.cache = cache;
  return Object.fromEntries(Object.entries(rest).filter(([, amount]) => amount > 0));
}
/** The family is home: what it hid is dug up and carried in, and said. */
export function digUpCache(world, household) {
  const cache = household.flight?.cache;
  if (!cache) return;
  const found = Object.entries(cache).filter(([, amount]) => amount > 0);
  for (const [good, amount] of found) household.resources[good] = (household.resources[good] ?? 0) + amount;
  delete household.flight.cache;
  if (found.length) tell(world, household, null, `The family went down to the river bottom and brought home what it had hidden there: ${found.map(([good, amount]) => `${amount} ${good}`).join(', ')}.`, 'HIST-TEX-640');
}
/** More room on foot for the bundles the family's children made up, for these people going (or with it on the road). */
export const bundleRoom = (household, goers) => round(goers.filter(person => (household.flight?.bundles || []).includes(person.id)).length * BUNDLE_ROOM);
/** How far off word of a column reaches this family: further with somebody watching the road behind. */
export const lookoutMiles = (world, household, standard) => (lookoutOf(world, household) ? LOOKOUT_MILES : standard);
export const lookoutOf = (world, household) => people(world, household).find(person => person.chore?.id === 'road-lookout' && withTheFamily(household, person)) || null;
/** Whether the family has a fire at its camp tonight: kept today or yesterday by somebody of it (`camp-fire`). */
export const fireKept = (household, day) => Number.isInteger(household.flight?.fireDay) && household.flight.fireDay >= day - 1;
/** What the road wears this walker by: less while somebody of their family sings on the road (`road-sing`). */
export function walkingShare(world, entity) {
  const household = world.households[entity.householdId];
  if (!household || entity.travel?.purpose !== 'flee' || !entity.travel.afoot) return 1;
  return people(world, household).some(person => person.chore?.id === 'road-sing' && withTheFamily(household, person)) ? SINGING_SHARE : 1;
}
/** The hours this family waits its turn at a flooded crossing: half, with a sick child among it (`HIST-TEX-639`). */
export function crossingHoursFor(world, household, hours) {
  return sickChild(world, household) ? hours * SICK_FIRST_SHARE : hours;
}
const sickChild = (world, household) => people(world, household).some(person => withTheFamily(household, person) && person.health?.condition === 'sick' && ageOf(person) < 10);
export { sickChild };

// ------------------------------------------------------------------------------------------------ the pace of the little ones

/** Whether any of the family is keeping the little ones walking. */
const minding = (world, household) => people(world, household).some(person => person.chore?.id === 'road-little-ones' && withTheFamily(household, person));
/** A small child walking with the family, whom the little ones' pace is about. */
const smallWalker = (household, person) => withTheFamily(household, person) && person.travel?.afoot && !person.travel.carried && ageOf(person) < 6;
/**
 * The family's pace on the road, as sim/company.mjs `companyPace` sets it when it sets out, with the little ones kept walking or
 * not: walkers of two to five are the slowest of any family that has them afoot, and kept by the hand they go at the pace of the
 * rest. Only moved while the ox is not spent and the family is not held, which have paces of their own (sim/road.mjs).
 */
function familyPace(world, household, hurried) {
  const goers = [...household.members, ...(household.property || [])].map(id => world.entities[id]).filter(one => one?.travel?.purpose === 'flee');
  const walkers = goers.filter(one => one.kind === 'person' && one.travel.afoot && !one.travel.carried && !(hurried && ageOf(one) < 6));
  const slowest = walkers.length ? Math.min(...walkers.map(walkingPace)) : WALK_SPEED;
  const vehicle = goers.some(one => one.kind === 'wagon' && one.travel.mode === 'wagon') && household.flight?.mode === 'wagon';
  return vehicle ? Math.min(WAGON_SPEED, slowest) : Math.min(WALK_SPEED, slowest);
}
function setPace(world, household, hurried) {
  const speed = familyPace(world, household, hurried);
  for (const id of [...household.members, ...(household.property || [])]) {
    const one = world.entities[id];
    if (one?.travel?.purpose === 'flee') one.travel.speed = speed;
  }
}

/** Every tick: the little ones kept walking, or let go back to their own pace when nobody is at it any longer. */
export function advanceFlightWork(world) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (!flight || flight.status !== 'fled') { if (flight?.hurried) delete flight.hurried; continue; }
    if (Number.isFinite(flight.oxSpentUntil)) continue;
    const now = minding(world, household);
    if (now && !flight.hurried) { flight.hurried = true; setPace(world, household, true); }
    else if (!now && flight.hurried) { delete flight.hurried; setPace(world, household, false); }
  }
}

// ------------------------------------------------------------------------------------------------ the works

/** Why nobody of this family can do this flight work now, or null. */
function refusalFor(world, household, entity, chore) {
  const flight = household.flight;
  const age = ageOf(entity);
  if (age < chore.fromAge) return `${entity.name} is only ${age}, and too small for that.`;
  if (chore.toAge !== undefined && age > chore.toAge) return `${entity.name} is grown, and carries a full pack already.`;
  if (chore.grown && !canAnswerCalls(entity)) return `${entity.name} is too young to lead the family over.`;
  if (chore.before) {
    if (!toldToGo(household)) return flight ? 'The family has already gone.' : 'Nobody has told the family to leave.';
    if (entity.location?.siteId !== household.homeSiteId || entity.travel) return `${entity.name} is not at home.`;
    return chore.before(world, household, entity);
  }
  if (!withTheFamily(household, entity)) return 'The family is not on the road east.';
  if (flight.bog) return 'The wagon is fast in the mud; free it first.';
  return chore.onRoad?.(world, household, entity) || null;
}
const offeredFor = chore => (world, household, entity) => {
  const age = ageOf(entity);
  if (age < chore.fromAge || (chore.toAge !== undefined && age > chore.toAge)) return false;
  if (chore.before) return toldToGo(household) && entity.location?.siteId === household.homeSiteId && !entity.travel;
  return withTheFamily(household, entity) && (chore.shown ? chore.shown(world, household, entity) : true);
};

const FLIGHT_WORK = {
  'flee-hide': {
    name: 'Hide what the wagon cannot carry', skill: 'hands', where: 'home', fromAge: 10,
    describe: `The morning before the family goes, down to the river bottom with what the wagon will not hold. Whatever powder, seed and cotton is left behind, up to ${HIDE_ROOM} of the wagon's room, is hidden there: no fire and no forager finds it, and it is there when the family comes home. Food is not hidden; it would not keep.`,
    before: (world, household) => (household.flight?.hid ? 'The family has hidden what it can already.' : null),
    steps: [{ work: 3, doing: 'carrying things down to the river bottom to hide them' }, { run: (world, household, entity) => {
      household.flight.hid = true;
      tell(world, household, entity, `${entity.name} hid what the wagon will not hold in the river bottom: the powder, seed and cotton the family leaves behind will be there when it comes home.`, 'HIST-TEX-640');
    } }],
  },
  'flee-bundle': {
    name: 'Make up a bundle to carry', skill: 'hands', where: 'home', child: true, fromAge: 5, toAge: 15, job: true,
    describe: `A shawl tied up with what a child can carry. If the family goes on foot, or has to leave the wagon on the road, each child with a bundle carries ${BUNDLE_ROOM} of the wagon's room more of what the family has.`,
    before: (world, household, entity) => (canAnswerCalls(entity) ? `${entity.name} carries a full pack already.` : (household.flight?.bundles || []).includes(entity.id) ? `${entity.name} has a bundle made up already.` : null),
    steps: [{ work: 1, doing: 'tying up a bundle in a shawl' }, { run: (world, household, entity) => {
      household.flight.bundles = [...new Set([...(household.flight.bundles || []), entity.id])];
      tell(world, household, entity, `${entity.name} has a bundle tied up to carry, and will carry it all the way.`, 'FIC-GONZ-487', 1);
    } }],
  },
  'road-lookout': {
    name: 'Watch the road behind', skill: 'hands', where: 'road', road: true, moving: true, child: true, fromAge: 7, job: true,
    describe: `Riding at the tail of the wagon or walking at the back, watching the road the family has come by. While somebody watches, word of the Mexican army's riders reaches the family at ${LOOKOUT_MILES} miles, not twenty, and it has longer to decide.`,
    steps: [{ work: 6, doing: 'watching the road behind for riders' }],
  },
  'road-sing': {
    name: 'Sing to keep the little ones walking', skill: 'hands', where: 'road', road: true, moving: true, child: true, fromAge: 3, job: true,
    describe: `Singing on the road, and everybody walking takes it up. While somebody of the family sings, the road wears its walkers by ${Math.round((1 - SINGING_SHARE) * 100)} in a hundred less.`,
    shown: (world, household) => people(world, household).some(person => withTheFamily(household, person) && person.travel?.afoot && !person.travel.carried),
    onRoad: (world, household) => (household.flight?.status !== 'fled' ? 'The family is not on the move.' : null),
    steps: [{ work: 4, doing: 'singing as the family walks' }],
  },
  'road-little-ones': {
    name: 'Keep the little ones walking', skill: 'hands', where: 'road', road: true, moving: true, child: true, fromAge: 7, job: true,
    describe: 'The smallest walkers held by the hand and kept going. A child of five or under on foot is the slowest of any family, and while somebody keeps them walking the family goes at the pace of its older walkers.',
    shown: (world, household) => people(world, household).some(person => smallWalker(household, person)),
    onRoad: (world, household) => (household.flight?.status !== 'fled' ? 'The family is not on the move.' : !people(world, household).some(person => smallWalker(household, person)) ? 'None of the little ones is walking.' : null),
    steps: [{ work: 6, doing: 'holding the little ones by the hand and keeping them walking' }],
  },
  'camp-fire': {
    name: 'Keep a fire going', skill: 'hands', where: 'road', road: true, child: true, fromAge: 5, job: true,
    describe: 'Wood and water fetched for the camp, and the fire kept in however it rains. A norther that comes down tonight or tomorrow night finds nobody of the family out in the cold at it.',
    shown: (world, household) => campedHere(household),
    onRoad: (world, household) => (campedHere(household) ? null : 'The family is not camped; there is a fire to keep at a crossing or the refuge.'),
    steps: [{ work: 1, doing: 'fetching wood and water and keeping the fire going' }, { run: (world, household, entity) => {
      household.flight.fireDay = dayOf(world);
      tell(world, household, entity, `${entity.name} kept a fire going at the camp: nobody of the family is out in the cold tonight.`, 'FIC-GONZ-488', 1);
    } }],
  },
  'ferry-help': {
    name: 'Help load at the ferry', skill: 'hands', where: 'road', road: true, fromAge: 10,
    describe: `A hand at the ropes and the loading while the family waits its turn at the crossing. Once at each crossing, the family's turn comes ${FERRY_HELP_HOURS} hours sooner.`,
    shown: (world, household) => Boolean(household.flight?.crossing),
    onRoad: (world, household) => (!household.flight?.crossing ? 'The family is not waiting at a crossing.' : household.flight.crossing.helped ? 'Somebody of the family has helped at this crossing already.' : null),
    steps: [{ work: 1, doing: 'helping the ferryman load the boat' }, { run: (world, household, entity) => {
      const crossing = household.flight?.crossing;
      if (!crossing) return;
      crossing.until = Math.max(world.minute, crossing.until - FERRY_HELP_HOURS * 60);
      crossing.helped = true;
      tell(world, household, entity, `${entity.name} helped the ferryman load the boat all afternoon, and the family's turn will come ${FERRY_HELP_HOURS} hours sooner for it.`, 'FIC-GONZ-489');
    } }],
  },
  'share-food': {
    name: 'Share food with a family camped here', skill: 'hands', where: 'road', road: true, fromAge: 10, needs: { food: SHARED_FOOD },
    describe: `A food from the family's store carried over to the hungriest family camped at the same place. The people of Liberty and a stranger at the Trinity did as much for the Rose family.`,
    shown: (world, household) => campedHere(household),
    onRoad: (world, household) => (!campedHere(household) ? 'The family is not camped with anybody.' : !campNeighbour(world, household) ? 'No other family is camped here.' : null),
    steps: [{ work: 1, doing: 'carrying food to a family camped near' }, { consume: { food: SHARED_FOOD } }, { run: (world, household, entity) => {
      const other = campNeighbour(world, household);
      if (!other) { household.resources.food = round((household.resources.food ?? 0) + SHARED_FOOD); return; }
      other.resources.food = Math.round(((other.resources.food ?? 0) + SHARED_FOOD) * 10000) / 10000;
      tell(world, household, entity, `${entity.name} carried ${SHARED_FOOD} food over to a family camped near, who had less.`, 'FIC-GONZ-489');
      record(world, 'consequence', { householdId: other.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-489', text: `A family camped near sent ${SHARED_FOOD} food over to yours.` });
    } }],
  },
  'ford-carry': {
    name: 'Carry the little ones over', skill: 'hands', where: 'road', road: true, fromAge: 16, grown: true,
    describe: `On foot at a crossing, with the water below its banks, the family need not wait its turn for the boat: the grown ones carry the little ones over on their backs, hand in hand. Everybody is wet through and worn by it, ${FORD_MILES} miles' worth.`,
    shown: (world, household) => Boolean(household.flight?.crossing) && household.flight.mode === 'foot',
    onRoad: (world, household) => {
      const crossing = household.flight?.crossing;
      if (!crossing) return 'The family is not at a crossing.';
      if (household.flight.mode !== 'foot') return 'The wagon cannot be carried over; the family waits for the boat.';
      if (waterAt(world, world.map.sites[crossing.siteId]) >= WATER_SHUT) return 'The river is over its banks; nobody could wade it.';
      return null;
    },
    steps: [{ work: 1, doing: 'carrying the little ones over the ford' }, { run: (world, household, entity) => {
      const flight = household.flight;
      if (!flight?.crossing) return;
      const at = world.map.sites[flight.crossing.siteId]?.name || 'the crossing';
      flight.crossed = [...(flight.crossed || []), flight.crossing.siteId];
      delete flight.crossing;
      for (const one of people(world, household).filter(person => withTheFamily(household, person))) {
        if (!one.travel?.carried) one.exertion = Math.round(((one.exertion || 0) + FORD_MILES) * 10000) / 10000;
        if (one.travel) delete one.travel.halted;
      }
      tell(world, household, entity, `The family would not wait for the boat at ${at}: ${entity.name} and the grown ones carried the little ones over on their backs, hand in hand, and everybody is wet through and worn.`, 'FIC-GONZ-489');
    } }],
  },
};

/** The hungriest family camped where this one is, other than itself: the one to share with. */
function campNeighbour(world, household) {
  const here = placeOfCamp(household);
  if (!here) return null;
  return Object.values(world.households).filter(other => other.id !== household.id && placeOfCamp(other) === here)
    .sort((a, b) => (a.resources?.food ?? 0) - (b.resources?.food ?? 0) || a.id.localeCompare(b.id))[0] || null;
}

let registered = false;
/**
 * The flight's works join the one table here, called from sim/world.mjs once its own imports are made, for the reason
 * sim/road.mjs registers its own that way: this module is reached while the table is still being built.
 */
export function registerFlightWork() {
  if (registered) return;
  registered = true;
  registerChores(Object.fromEntries(Object.entries(FLIGHT_WORK).map(([id, chore]) => [id, {
    ...chore,
    // Marked, so what reads the table can tell the flight's own work from the farm's (tests/chores.test.mjs counts them apart).
    flight: true,
    // A child's job may be dawdled over (sim/obedience.mjs); a grown person's is begun at once.
    begin: (world, household, entity) => { if (chore.job && tooYoung(entity)) beginsJob(world, household, entity, chore.steps[0].doing); },
    refuse: (world, household, entity) => refusalFor(world, household, entity, chore),
    offered: offeredFor(chore),
  }])));
}
export const FLIGHT_WORKS = Object.freeze(Object.keys(FLIGHT_WORK));

/** A saved flight's own works' marks that cannot be, or null. */
export function flightWorkInvalid(world) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (!flight) continue;
    if (flight.hid !== undefined && flight.hid !== true) return 'Invalid hiding';
    if (flight.cache !== undefined && (!flight.cache || Object.entries(flight.cache).some(([good, amount]) => !HIDDEN_GOODS.includes(good) || !Number.isInteger(amount) || amount < 0))) return 'Invalid hidden goods';
    if (flight.bundles !== undefined && (!Array.isArray(flight.bundles) || flight.bundles.some(id => !world.entities[id]))) return 'Invalid bundles';
    if (flight.fireDay !== undefined && !Number.isInteger(flight.fireDay)) return 'Invalid fire';
    if (flight.hurried !== undefined && flight.hurried !== true) return 'Invalid pace';
  }
  return null;
}

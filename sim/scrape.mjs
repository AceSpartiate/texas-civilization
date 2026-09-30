// The Runaway Scrape: docs/COLONIES.md §7g and build step 10(b), decided by the owner by multiple choice (2026-09-16).
// Researched in docs/battle-research/goliad-scrape-san-jacinto.md (`HIST-TEX-065`).
//
// "Ordered out, with choices along the way." When word reaches a settlement on its date, its families are told to leave. A
// family chooses what to load into the wagon - food, seed, cotton, powder, within the room it has - and where east it will
// go, and sets out together, everybody at home with the ox, the wagon and the horse. The owner: "Families watch as they
// leave the Texas Army burns their farm and house to make sure the Mexican Army can't use it." A family that will not leave
// is burned out anyway when the army passes, and anybody still at home when the Mexican army comes through may be taken
// prisoner. The rivers are in flood: at every crossing the family waits its turn. Rain, cold and hunger make people sick,
// the weak more, and a few of the sick die on the road. When word of San Jacinto comes the families turn home, to what is
// left.
//
// Every date a settlement was told to leave, every day the armies passed, the room in the wagon, the wait at a crossing and
// the sickness are this game's own (`FIC-GONZ-046`); the record gives the days towns were found empty and no count of the dead.
import { record } from './events.mjs';
import { findStockAgain, leaveStock } from './stock.mjs';
import { weatherAt } from './weather.mjs';
import { ruin } from './improvements.mjs';
import { findWay } from './ways.mjs';
import { share } from './shares.mjs';
import { WAGON_SPEED, WALK_SPEED } from './travel.mjs';
import { beastsOf, roleOf } from './beasts.mjs';
import { drawnVehicles, riddenHorses, setOut } from './company.mjs';
import { CARRETA_SPACE, CART_SPACE, WAGON_SPACE } from './wagon.mjs';
import { frailty } from './army.mjs';
import { canAnswerCalls, eatenADay, householdName } from './family.mjs';
import { spotlight } from './host.mjs';
// The road's own doings - the rain and the bog, the camp, the pursuit - live in sim/road.mjs (docs/ROAD_EAST.md) and write
// their fields onto `household.flight` beside these; a cycle, safe because each side uses the other only inside functions.
import { advanceRoad, roadInvalid, roadProjection } from './road.mjs';
import { isStage } from './colonies-map.mjs';
// The Mexican columns and the burn zone (sim/advance.mjs), and what the family learns of its farm (sim/advance-word.mjs).
import { COLUMNS, advanceModelled, burnMinute, farmFate } from './advance.mjs';
import { farmTopic, learnOwnBurning, recordFarmBurned } from './advance-word.mjs';
import { learn } from './knowledge.mjs';
// What the family does on the road besides run (sim/flight-work.mjs, docs/CHILDREN.md §7): what it hid, the children's bundles, the
// fire at the camp, and a sick child let over first at the ferry.
import { bundleRoom, cowHome, cowPace, crossingHoursFor, digUpCache, fireKept, heldToCow, hideAtLeaving, milkCow, takeCow } from './flight-work.mjs';
// The family's own route - where it makes for, by which stops, by the road or across country - and the soldiers who may see it
// on the way (owner, 2026-09-27; sim/flight-route.mjs, sim/pursuit.mjs).
import { flightPlaces, mountedPace, nextLeg, planRoute, routeInvalid, routeRefusal, thinLine } from './flight-route.mjs';
import { pursuitInvalid } from './pursuit.mjs';
// The road's day of sickness (sim/disease.mjs, docs/DISEASE.md): one call, so the disease's rules live in one module.
import { roadSickness } from './disease.mjs';
// Room kept in a neighbour's wagon, or lent to one (sim/neighbourly.mjs, owner 2026-09-28): added to or taken from the room here.
import { lentRoom } from './deeds.mjs';
// The tools, the chest and the spinning wheel in the load (owner, 2026-09-29, D9 (a); sim/flight-goods.mjs), leaving before the
// order on news the family has heard (D9 (b); sim/early-word.mjs), and the crop that leaving early costs.
import { HOUSEHOLD_GOODS, HOUSEHOLD_SPACE, goodCount, goodWords, goodsWords, householdGoods, isHouseholdGood, removeGood, restoreGood } from './flight-goods.mjs';
import { EARLY_COST, NO_WORD_YET, earlyWord, readyingInvalid, takeReadying } from './early-word.mjs';
import { keepPlots } from './fields.mjs';
import { wagonItem } from './wagon.mjs';

const GONE = ['dead', 'captured'];
const DAY = 1440;
/** Minutes from midnight on September 29, 1835 to midnight on March 1, 1836 (1836 is a leap year). */
const MARCH_1 = 221760, APRIL_1 = 266400;
const march = (day, hour = 6) => MARCH_1 + (day - 1) * DAY + hour * 60;
const april = (day, hour = 6) => APRIL_1 + (day - 1) * DAY + hour * 60;

/**
 * When each settlement's families were told to leave (`order`), when the Texas army passed and burned what was left
 * (`burn`, two days after: `ceiling:` invented, the record has no day), and when the Mexican army came through (`enemy`;
 * null where it never did). The days towns were found empty are the record's (`HIST-TEX-065`): Gonzales the night of
 * March 13, Washington by the 17th, San Felipe about the 28th, the Brazos settlements about April 1, Nacogdoches before the
 * 13th, Harrisburg the 15th; Victoria, Goliad, Mina, Liberty and Anahuac are placed by the armies' known movements.
 */
export const SETTLEMENT_DAYS = Object.freeze({
  gonzales: { order: march(14), burn: march(16), enemy: march(24, 12) },
  goliad: { order: march(14), burn: march(16), enemy: march(20, 12) },
  refugio: { order: march(14), burn: march(16), enemy: march(16, 12) },
  victoria: { order: march(19), burn: march(21), enemy: march(21, 12) },
  mina: { order: march(17), burn: march(19), enemy: march(26, 12) },
  washington: { order: march(17), burn: march(19), enemy: april(10, 12) },
  'san-felipe': { order: march(28), burn: march(30), enemy: april(7, 12) },
  columbia: { order: april(1), burn: april(3), enemy: april(20, 12) },
  brazoria: { order: april(1), burn: april(3), enemy: april(20, 12) },
  velasco: { order: april(1), burn: april(3), enemy: april(20, 12) },
  matagorda: { order: april(1), burn: april(3), enemy: april(20, 12) },
  nacogdoches: { order: april(12), burn: april(14), enemy: null },
  liberty: { order: april(13), burn: april(15), enemy: null },
  anahuac: { order: april(13), burn: april(15), enemy: null },
  harrisburg: { order: april(14), burn: april(15, 12), enemy: april(15, 12) },
});

/** Where a family may make for: the crossings and towns east that the refugees made for, each with the river it is over. */
export const REFUGES = Object.freeze(['san-felipe', 'washington', 'lynchburg', 'liberty', 'nacogdoches']);
/** The room in the wagon for the flight, in the family's own units, and what each thing takes of it. */
export const FLIGHT_ROOM = 20, FLIGHT_SPACE = Object.freeze({ food: 0.25, seed: 1, cotton: 0.5, powder: 0.1 });
/**
 * Everything the load can hold: the stores (`FLIGHT_SPACE`, which is `household.resources`) and, since 2026-09-29, the family's
 * tools, chest and spinning wheel (sim/flight-goods.mjs `HOUSEHOLD_SPACE`, `FIC-GONZ-990`), each with the room it takes.
 */
export const LOAD_SPACE = Object.freeze({ ...FLIGHT_SPACE, ...HOUSEHOLD_SPACE });
/** How many of a thing in the load the family has to take: whole stores in the house, or its household goods in hand. */
const haveOf = (household, good) => isHouseholdGood(good) ? goodCount(household, good) : Math.floor(household.resources?.[good] ?? 0);
/** On foot, each grown person carries this much room's worth. */
export const CARRIED_ROOM = 1.25;
/** A flooded river: the wait for a turn at the crossing, in hours of 1836. */
export const CROSSING_HOURS = 18;
/** Whoever is at home when the Mexican army comes through is taken prisoner at this share. */
export const CAPTURED_AT_HOME = 0.5;
/**
 * Sickness on the road: the chance a person falls sick of a chill on the chest in a day, doubled for a child under six and
 * doubled again for a family out of food, weighted by hidden strength and health like every risk; the sick mend in five days.
 * Since 2026-09-27 everything after falling sick - getting worse, nursing, rest, and the deaths (the owner's "about three in a
 * hundred over the whole flight", which replaced the "one in a hundred" of docs/COLONIES.md) - is sim/disease.mjs's.
 * `DEATH_PER_SICK_DAY` is kept for what reads it and is no longer the road's rule: nobody dies of being sick, only of being
 * very sick (sim/disease.mjs `DISEASES`).
 */
export const SICK_PER_DAY = 0.004, SICK_DAYS = 5, DEATH_PER_SICK_DAY = 0.02;
/**
 * What a norther does to somebody out in it, as a multiplier on their weight in the day's sickness (`FIC-GONZ-135`,
 * docs/WEATHER.md §10.5).
 *
 * Dilue Rose Harris's Runaway Scrape is where the record puts this and nowhere else: "many persons died" of "**disease,
 * cold, rain and hunger**" (`HIST-TEX-065`, `HIST-TEX-069`), and her own family's road is measles and whooping cough at
 * a flooded Trinity in February and March. **Hunger already doubles the weight here; cold now doubles it too**, which
 * is the same sentence made mechanical. Rain is the third word and is deliberately *not* here: a wet day on the road is
 * the mud and the bog (`FIC-GONZ-049`), and doubling the sickness for half the spring as well would make the road a
 * lottery rather than a journey.
 *
 * It reaches **only somebody the cold can get at**: on the road east, or camped on their own land with no roof up. A
 * family in its own cabin in a norther is cold and nothing more, which is the line `FIC-GONZ-135` draws.
 */
export const COLD_WEIGHT = 2;

/**
 * How heavily the day's sickness falls on one person: their own frailty, doubled for a small child, doubled again if
 * there is nothing to eat, and doubled again by a norther they have no roof against (`COLD_WEIGHT`).
 *
 * A function rather than a line inside the road's loop, because **the rule is the thing worth holding**: the road rolls
 * it and so does a family camped on its own land (sim/routines.mjs `coldAtHome`), and they must not drift apart. Written
 * out on 2026-09-21, when twelve injected regressions found only four tests looking at any of this.
 */
export const sicknessWeight = (person, { hungry = false, cold = false } = {}) =>
  frailty(person) * ((person.age ?? 30) < 6 ? 2 : 1) * (hungry ? 2 : 1) * (cold ? COLD_WEIGHT : 1);

/** Whether the sky where somebody is standing is one the cold gets through: a norther, and nothing else. */
export const coldSky = (world, point, day) => Boolean(point) && weatherAt(world, point, day).kind === 'norther';

// The hashed share lives in sim/shares.mjs since 2026-09-20, because the weather needs it and the weather is read by
// sim/ways.mjs, which this module imports. It is exported from here still: this is where everything has always asked for it.
export { share };

const settlementOf = household => household.settlementId || 'gonzales';
const people = (world, household) => household.members.map(id => world.entities[id]).filter(Boolean);
const atHome = (world, household) => people(world, household).filter(person => !GONE.includes(person.health?.condition) && person.location?.siteId === household.homeSiteId && !person.travel);
// Every animal and the wagon the family owns: the ones it always had, and any bought in town (sim/beasts.mjs).
const beasts = (world, household) => ['horse', 'ox', 'wagon'].flatMap(role => beastsOf(world, household, role));
const tell = (world, household, text, extra = {}) => record(world, 'consequence', { householdId: household.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-046', text, ...extra });

/** Whether the flight is on: the third class period. */
export const scrapeOn = world => world.period === 3 && !world.director?.complete;

/**
 * The room this family has to carry things away in: the wagon and ox standing at home, or what its grown people carry - and room
 * a neighbour keeps for it in their wagon, less room it keeps for a neighbour in its own (sim/neighbourly.mjs `lentRoom`).
 */
export function flightRoom(world, household) {
  const own = ownRoom(world, household), lent = lentRoom(world, household);
  return lent ? { ...own, room: Math.max(0, Math.round((own.room + lent) * 100) / 100), lent } : own;
}
function ownRoom(world, household) {
  const standing = beast => beast && !beast.travel && beast.location.siteId === household.homeSiteId && (!beast.condition || beast.condition === 'sound');
  // Every wagon standing at home that an ox standing there can draw, one ox to a wagon (sim/beasts.mjs): a family fitted out
  // with two wagons loads two, and the room is the wagons' together - the same rule as the load in (owner, 2026-09-25).
  const drawn = Math.min(beastsOf(world, household, 'wagon').filter(standing).length, beastsOf(world, household, 'ox').filter(standing).length);
  // A cart (sim/means.mjs) holds what it held on the road in, three quarters of a wagon's, and a carreta made at home
  // (sim/carreta.mjs) five eighths: each vehicle its own room against a wagon's sixteen. The family wagon is the cart, and loads first.
  const loaded = beastsOf(world, household, 'wagon').filter(standing).slice(0, drawn);
  const roomOf = wagon => (wagon.cart ? CART_SPACE : wagon.carreta ? CARRETA_SPACE : WAGON_SPACE);
  const room = Math.round(loaded.reduce((sum, wagon) => sum + FLIGHT_ROOM * roomOf(wagon) / WAGON_SPACE, 0) * 100) / 100;
  if (drawn) return { room, mode: 'wagon', ...(drawn > 1 && { wagons: drawn }), ...(loaded[0].cart && { cart: true }), ...(drawn === 1 && loaded[0].carreta && { carreta: true }) };
  // On foot: what the grown people carry, and the bundles the children made up (sim/flight-work.mjs `flee-bundle`).
  return { room: Math.round((atHome(world, household).filter(canAnswerCalls).length * CARRIED_ROOM + bundleRoom(household, atHome(world, household))) * 100) / 100, mode: 'foot' };
}

const spaceOf = take => Object.entries(take).reduce((sum, [good, amount]) => sum + (LOAD_SPACE[good] ?? 0) * amount, 0);

/** Why this family cannot leave as asked, or null. */
export function fleeRefusal(world, household, { take = {}, refuge, route } = {}) {
  const flight = household.flight;
  if (!scrapeOn(world)) return 'Nobody has told the family to leave.';
  // Before its order, only on news the family has itself heard (owner, 2026-09-29, D9 (b); sim/early-word.mjs): its own knowledge,
  // never the world's truth. Without it the refusal says why in plain words.
  if (!flight && !earlyWord(world, household)) return NO_WORD_YET;
  if (flight && !['ordered', 'stayed'].includes(flight.status)) return 'The family has already left.';
  // A route of its own (sim/flight-route.mjs, owner 2026-09-27): any place a family could make for, by the road or across
  // country, with stops. Without one, a refuge east of here by the road, as it always was.
  if (route !== undefined) {
    const why = routeRefusal(world, household, route);
    if (why) return why;
    if (route.stops.includes(household.homeSiteId)) return 'That is where the family is.';
  } else {
    if (!REFUGES.includes(refuge)) return 'Choose where the family will make for.';
    if (world.map.sites[refuge].x <= world.map.sites[household.homeSiteId].x + 2) return `${world.map.sites[refuge].name} is not east of here.`;
  }
  for (const [good, amount] of Object.entries(take)) {
    if (!(good in LOAD_SPACE) || !Number.isInteger(amount) || amount < 0) return 'Say how much of each thing, in whole amounts.';
    if (amount > haveOf(household, good)) return isHouseholdGood(good) ? `The family has not got ${goodWords(good, amount)} to take.` : `There is not that much ${good} in the house.`;
  }
  const { room } = flightRoom(world, household);
  if (spaceOf(take) > room + 1e-9) return `That will not fit. There is room for ${room} and this takes ${Math.round(spaceOf(take) * 100) / 100}.`;
  if (!atHome(world, household).length) return 'Nobody of the family is at home to go.';
  return null;
}

/** The settlement's word: this family is told to leave, and a "!" waits on its main person. */
export function orderOut(world, household, causeId) {
  if (household.flight) return;
  // A family with nobody living is not told anything, and holds nobody's clock (playthrough audit 7, 2026-09-28).
  if (!people(world, household).some(person => !GONE.includes(person.health?.condition))) return;
  // What the family made ready on the news before its order (sim/early-word.mjs `readying`) goes onto the flight.
  household.flight = { status: 'ordered', orderedMinute: world.minute, ...takeReadying(household) };
  tell(world, household, `Word has come from ${world.map.sites[settlementOf(household)].name}: the Mexican army is coming, and every family is to leave for the east. Load what the wagon will carry and go. ${advanceModelled(world) ? 'What is left behind stays in the house, and if the Mexican army comes this way it will be burned.' : 'What is left behind will be burned so the enemy cannot use it.'}`, { type: 'pressure', causes: causeId ? [causeId] : [] });
}

/**
 * The Texas army burns the house, the field and the fences, and whatever was not carried away is lost: the rule on the
 * invented Gonzales country, which has no Mexican columns on it (sim/advance.mjs `advanceModelled`). On the real land the
 * farm burns only when a column's foragers reach it (`burnByForagers`), and only inside the burn zone.
 */
export function burnFarm(world, household, { watching }) {
  const ruined = ruin(world, household, ['cabin', 'field', 'fence'], { text: watching
    ? 'As the family drove off, men of the Texas army set fire to the house and the field behind them, so the Mexican army would find nothing to use. They watched it burn from the road.'
    : 'The Texas army passed and set fire to the house and the field, so the Mexican army would find nothing to use.' });
  for (const good of Object.keys(FLIGHT_SPACE)) if (household.resources) household.resources[good] = 0;
  household.furniture = {};
  delete household.interior;
  // The stock mark is `true` or absent and never `false` (sim/grants.mjs `grantInvalid`), and it is the *land grant's*
  // mark - what the family holds, which the burning does not change. What the stock itself does is `leaveStock`.
  // **Found 2026-09-20:** this line wrote `false` and made the world invalid. It had never run, because until that day
  // no family nobody plays ever drove stock in (0 of 180 in the study), and a played family that fled was rarer still.
  delete household.herdLookedDay;
  household.flight = { ...household.flight, burned: world.minute };
  // A student's house burning is a moment most of the class would miss (owner, 2026-09-16): the Host's camera goes to it.
  if (household.played) spotlight(world, { key: `burned:${household.id}`, text: `The Texas army sets fire to ${householdName(world, household)}'s house and field at ${world.map.sites[household.homeSiteId]?.name || 'their land'}, so the Mexican army will find nothing to use.`, siteId: household.homeSiteId, claimId: 'HIST-TEX-065', householdId: household.id });
  return ruined;
}

/**
 * A column's foragers reach a farm in the burn zone (sim/advance.mjs `farmFate`, `FIC-GONZ-465`): the house, the field and
 * the fences are burned, whatever the family left in the house is gone, the stock on the range is driven off with the
 * column, and whoever of the family is still at home may be taken prisoner (`CAPTURED_AT_HOME`, as before).
 *
 * **The family is not told.** The burning is the world's; the family learns it when one of its people sees the smoke or
 * the word reaches them (sim/advance-word.mjs), and until then its own page shows the farm as the family left it
 * (`flight.unseen`, read by `landAsKnown`). The event of the burning is sealed, revealed with the ending, and the Host is
 * shown it at once.
 */
export function burnByForagers(world, household, fate, column) {
  if (!household.flight) household.flight = { status: 'stayed', orderedMinute: world.minute, ...takeReadying(household) };
  const flight = household.flight;
  // A family that stayed has its goods in the house, and the foragers take them before they burn it (owner, 2026-09-29, D9 (c):
  // "Foragers take goods"; `FIC-GONZ-992`): every store, and the tools, the chest and the spinning wheel. Not the coin, as a column
  // that comes up with a family on the road takes none (sim/road.mjs `overtake`); not who is taken, which is as it was (D1).
  const stayed = !['fled', 'refuged', 'returning', 'home'].includes(flight.status);
  const taken = stayed ? takeStayersGoods(household) : {};
  // What the family's page keeps showing until the family knows: the land as they left it, and the goods the foragers took.
  flight.unseen = structuredClone({ improvements: household.improvements ?? null, field: household.field ?? null, plots: household.plots ?? null, furniture: household.furniture ?? null, interior: household.interior ?? null, ...(Object.keys(taken).length && { taken }) });
  const name = column?.name || 'The Mexican army';
  ruin(world, household, ['cabin', 'field', 'fence'], { visibility: 'sealed', text: `Foragers of ${name} came to the farm${Object.keys(taken).length ? `, took what the family had in the house - ${goodsWords(taken)} -` : ''} and burned the house, the field and the fences.` });
  household.furniture = {};
  delete household.interior;
  delete household.herdLookedDay;
  // What was left in the house for the fire is gone with it (`flee` keeps it on `flight.left` until now).
  const lost = flight.left ? Object.entries(flight.left).filter(([, amount]) => amount > 0).map(([good, amount]) => goodWords(good, amount)) : [];
  delete flight.left;
  // The stock left on the range: foragers drive off what they find (sim/stock.mjs `findStockAgain` reads the mark).
  if (household.herdLeft) household.herdLeft.driven = true;
  flight.burned = world.minute;
  const took = Object.entries(taken).map(([good, amount]) => goodWords(good, amount));
  flight.burnedBy = { hand: 'mexican', columnId: fate.columnId, name, ...(lost.length && { lost }), ...(took.length && { taken: took }) };
  if (flight.status === 'ordered') flight.status = 'stayed';
  recordFarmBurned(world, household);
  const place = world.map.sites[household.homeSiteId]?.settlementId ? `near ${world.map.sites[world.map.sites[household.homeSiteId].settlementId]?.name}` : 'on its land';
  record(world, 'world-event', { visibility: 'public', importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-465', text: `Foragers of ${name} burned ${householdName(world, household)}'s farm ${place}.` });
  // Whoever is at home is there: they see it, and are taken at the share the Mexican army's coming always carried. The
  // family knows it then and there, by its own people (household-level knowledge, docs/LIVING_INFORMATION.md's boundary).
  const there = atHome(world, household);
  for (const person of there) {
    if (share(world, person.id, 'enemy') >= CAPTURED_AT_HOME) continue;
    person.health = { condition: 'captured' }; person.task = 'rest'; person.chore = null;
    tell(world, household, `${person.name} was at home when foragers of ${name} came, and was taken prisoner.`, { actorId: person.id, claimId: 'FIC-GONZ-465' });
    if (household.played) spotlight(world, { key: `taken:${person.id}`, text: `Foragers of ${name} take ${person.name}, of ${householdName(world, household)}, prisoner at home.`, siteId: household.homeSiteId, householdId: household.id });
  }
  if (there.length) learnOwnBurning(world, household, 'there');
  // A student's house burning is a moment most of the class would miss (owner, 2026-09-16): the Host's camera goes to it, and
  // the family is not told by the camera (`tell: false`).
  if (household.played) spotlight(world, { key: `burned:${household.id}`, text: `Foragers of ${name} burn ${householdName(world, household)}'s house and field ${place}.`, siteId: household.homeSiteId, claimId: 'FIC-GONZ-465', householdId: household.id, tell: false });
}

/**
 * A family that stayed loses to the foragers every store and household good in the house (`burnByForagers`, `FIC-GONZ-992`):
 * taken out of its hands, and returned as what was taken, in whole amounts - the fraction of a food left over from the day's
 * eating goes with the rest and is not named.
 */
function takeStayersGoods(household) {
  const taken = {};
  for (const good of Object.keys(FLIGHT_SPACE)) {
    const amount = Math.floor(household.resources?.[good] ?? 0);
    if (household.resources && (household.resources[good] ?? 0) > 0) household.resources[good] = 0;
    if (amount > 0) taken[good] = amount;
  }
  for (const [good, amount] of Object.entries(householdGoods(household))) { removeGood(household, good, amount); taken[good] = amount; }
  return taken;
}

/**
 * The household as its own family knows it: a farm burned while nobody of the family could see it (`flight.unseen`) is
 * shown as they left it - its improvements, field, plots, furniture and room, and the goods the foragers took from a family that
 * stayed (`unseen.taken`) still in the house - and the burning is not on its flight. The world is unchanged; this is what its page
 * is sent (sim/world.mjs `projectWorld`).
 */
export function householdAsKnown(household) {
  const flight = household?.flight;
  if (!flight?.unseen) return household;
  const { unseen, burned, burnedBy, ...knownFlight } = flight;
  const shown = { ...household, flight: knownFlight };
  const { taken, ...land } = unseen;
  for (const [key, value] of Object.entries(land)) { if (value === null) delete shown[key]; else shown[key] = value; }
  if (taken) {
    shown.resources = { ...shown.resources };
    shown.tools = { ...shown.tools }; if (shown.spares) shown.spares = structuredClone(shown.spares); if (shown.belongings) shown.belongings = [...shown.belongings];
    for (const [good, amount] of Object.entries(taken)) { if (isHouseholdGood(good)) restoreGood(shown, good, amount); else shown.resources[good] = (shown.resources[good] ?? 0) + amount; }
  }
  if (shown.herdLeft?.driven) { const { driven, ...herd } = shown.herdLeft; shown.herdLeft = herd; }
  return shown;
}

/** Why the family cannot decide to stay, or null. */
export function stayRefusal(world, household) {
  if (!scrapeOn(world) || !household.flight) return 'Nobody has told the family to leave.';
  if (household.flight.status !== 'ordered') return 'The family has already decided.';
  return null;
}
/**
 * The family decides to stay and take what comes (owner: "burned anyway, at risk"). Said, not left to silence: since auto
 * packs the wagon of a family that answers nothing for a day (sim/auto.mjs), refusing to go has to be an answer of its own.
 * The family can still go east later, burned out or not (`fleeRefusal` allows 'stayed').
 */
export function stayHome(world, household) {
  const why = stayRefusal(world, household);
  if (why) throw new Error(why);
  household.flight.status = 'stayed';
  household.flight.stayedMinute = world.minute;
  tell(world, household, advanceModelled(world)
    ? 'The family will stay, and take what comes. If the Mexican army\'s foragers come this way they will take everything in the house - the stores, the tools, the chest and the wheel - and burn what they find standing, and whoever is at home may be taken. The road east is still open.'
    : 'The family will stay, and take what comes. The Texas army will burn what it finds standing, and whoever is at home when the Mexican army comes may be taken. The road east is still open.', { importance: 2 });
}

export function flee(world, household, { take = {}, refuge, route }) {
  const why = fleeRefusal(world, household, { take, refuge, ...(route !== undefined && { route }) });
  if (why) throw new Error(why);
  const { mode, wagons } = flightRoom(world, household);
  // The first leg of the family's own route, planned from home for the train it is leaving with (sim/flight-route.mjs).
  const planned = route !== undefined ? planRoute(world, household, route, { mode, from: { siteId: household.homeSiteId } }) : null;
  if (planned?.why) throw new Error(planned.why);
  if (route !== undefined) refuge = route.stops[0];
  // The flight waits at the flooded crossings by its own rule (`crossingsAlong`), not the ferries' ordinary hour. Found before
  // anything is changed, so a family refused for want of a road has lost nothing.
  const path = planned ? planned.legs[0] : findWay(world, household.homeSiteId, refuge, mode, { ferries: false });
  if (!path) throw new Error('No road east from here.');
  // Leaving before any order, on news the family has heard (owner, 2026-09-29, D9 (b); sim/early-word.mjs): its flight begins
  // here, with what it made ready, and it pays for going early - the crop in the field is lost (`loseCrop`).
  const early = household.flight ? null : earlyWord(world, household);
  if (early) {
    const crop = loseCrop(world, household);
    household.flight = { ...takeReadying(household), early: { topicId: early.topicId, minute: world.minute, ...(crop && { crop }) } };
    tell(world, household, `The family is going before any order comes, on the word it has heard. ${crop ? `The ${crop} in the field is left standing with nobody to tend it or bring it in, and is lost.` : 'There is no crop in the field to lose.'} The house is left empty, with whatever is not loaded in it, for whoever comes.`, { claimId: 'FIC-GONZ-991', importance: 3 });
  }
  const kept = { ...household.resources };
  // What is taken rides; the rest is left in the house for the fire.
  for (const good of Object.keys(FLIGHT_SPACE)) household.resources[good] = 0;
  // The tools, the chest and the spinning wheel not loaded are left in the house too (owner, 2026-09-29, D9 (a); sim/flight-goods.mjs):
  // out of the family's hands until it comes home to them, or they burn.
  const goodsLeft = {};
  for (const good of HOUSEHOLD_GOODS) {
    const left = goodCount(household, good) - (take[good] ?? 0);
    if (left > 0) { removeGood(household, good, left); goodsLeft[good] = left; }
  }
  // Everybody at home goes, the wounded too (design audit S19, 2026-09-28): carried in the wagon with the sick when there is one
  // (sim/company.mjs seats them first), and on foot at a wounded man's pace when there is not (`walkingPace`).
  const goers = atHome(world, household);
  const { cart, carreta } = flightRoom(world, household);
  const destination = route !== undefined ? route.stops.at(-1) : refuge;
  const byWay = route !== undefined ? `${route.stops.length > 1 ? `, by way of ${route.stops.slice(0, -1).map(id => world.map.sites[id].name).join(' and ')}` : ''}${route.ways[0] === 'country' ? ', across country' : ''}` : '';
  const departure = tell(world, household, `The family loaded ${Object.entries(take).filter(([, amount]) => amount > 0).map(([good, amount]) => goodWords(good, amount)).join(', ') || 'what it could carry'} and set out ${route !== undefined ? '' : 'east '}for ${world.map.sites[destination].name}${byWay}${mode === 'wagon' ? (wagons ? ` with the ${wagons} wagons and their oxen` : cart ? ' with the ox and cart' : carreta ? ' with the ox and carreta' : ' with the ox and wagon') : ' on foot'}.`);
  const speed = mode === 'wagon' ? WAGON_SPEED : WALK_SPEED;
  const travellers = [...goers, ...beasts(world, household).filter(beast => !beast.travel && beast.location.siteId === household.homeSiteId)];
  const journey = () => ({ from: household.homeSiteId, to: refuge, points: path.points.map(point => ({ ...point })), progress: 0, distance: path.distance, speed, mode, purpose: 'flee', silent: true, causeId: departure, ...(path.pace?.length && { pace: path.pace }), ...(path.offRoad?.length && { offRoad: path.offRoad.map(run => [...run]) }) });
  // Who rides and who walks, and the pace of the slowest, in a class made since the means were rolled (sim/company.mjs): the
  // youngest and the sick in the wagons, the rest beside them, and a family on foot at the pace of its smallest walker.
  if (world.meansRoll) setOut(travellers, mode === 'wagon' ? drawnVehicles(travellers) : [], journey, riddenHorses(world, travellers));
  for (const entity of travellers) {
    entity.chore = null;
    if (!world.meansRoll) entity.travel = journey();
    entity.location = { ...path.points[0], siteId: null };
    if (entity.kind === 'person') entity.task = 'travel';
    if (entity.kind === 'wagon') entity.laden = true;
    if (entity.kind !== 'person') entity.borrowedBy = goers[0]?.id || null;
  }
  household.flight = { ...household.flight, status: 'fled', refuge: route !== undefined ? route.stops.at(-1) : refuge, leftMinute: world.minute, mode, took: take, crossed: [],
    ...(route !== undefined && { route: { stops: [...route.stops], ways: [...route.ways], lines: planned.legs.slice(1).map(leg => thinLine(leg.points)) } }) };
  // A family all on horseback goes at a horse's pace, and one that is not at its slowest (sim/flight-route.mjs `mountedPace`).
  mountedPace(world, travellers);
  // On the real land the farm is left standing, with whatever did not fit in the house: burned by a column's foragers if
  // they come this way (`burnByForagers`), found again on the family's return if they never do (sim/advance.mjs, owner
  // 2026-09-26). On the invented Gonzales country, which has no columns, the Texas army burns it as they go (owner, 2026-09-16).
  // What the family hid in the river bottom before it went (sim/flight-work.mjs `flee-hide`) comes out of what is left in the house
  // first, on either country: no fire and no forager finds it, and it is dug up when the family is home.
  const left = hideAtLeaving(household, { ...Object.fromEntries(Object.keys(FLIGHT_SPACE).map(good => [good, Math.max(0, Math.floor((kept[good] ?? 0) - (take[good] ?? 0)))]).filter(([, amount]) => amount > 0)), ...goodsLeft }, LOAD_SPACE);
  if (advanceModelled(world)) {
    if (!household.flight.burned) {
      if (Object.keys(left).length) household.flight.left = { ...(household.flight.left || {}), ...left };
    }
  } else burnFarm(world, household, { watching: true });
  // The herd stays where it is (sim/stock.mjs, `FIC-GONZ-184`): nobody drives cattle ahead of an army, and the hogs are
  // in the timber. It is the largest single thing a family loses by going, and it is written down rather than quietly
  // becoming nothing. One milk cow may go first, driven by a child who has her on a rope (sim/flight-work.mjs, owner 2026-09-27).
  takeCow(world, household, goers);
  // With her along and no wagon, the family goes at her pace (owner, 2026-09-27: "Slow a family on foot").
  cowPace(world, household);
  leaveStock(world, household);
  household.resources = { ...household.resources, ...Object.fromEntries(Object.entries(take).filter(([good]) => good in FLIGHT_SPACE)), money: kept.money ?? 0 };
  return departure;
}

/**
 * What leaving before the order costs (owner, 2026-09-29, D9 (b); `FIC-GONZ-991`): a crop in the ground, growing or ripe, is left with
 * nobody to tend it or bring it in, and is lost - the field goes back to bare, its plots unsown; the ground stays cleared and fenced.
 * Returns the crop lost ('corn' or 'cotton'), or null when nothing stood in the field. The game's rule, not the record's: Dilue Rose
 * Harris's father planted corn on March 1, left, and found it standing when the family came home (docs/SCRAPE.md §19).
 */
export function loseCrop(world, household) {
  const field = household.field;
  if (!['planted', 'ripe'].includes(field?.state)) return null;
  const { grownMs: _grown, ...rest } = field;
  household.field = { ...rest, state: 'bare', changedTick: world.tick };
  for (const plot of keepPlots(world, household)) delete plot.sown;
  return field.crop === 'cotton' ? 'cotton' : 'corn';
}

/** The crossings on this family's road: the ferries and fords over the big rivers, in the order the road meets them. */
export function crossingsAlong(world, travel) {
  // The three named crossings (`isStage`: `crossing` places before 2026-09-19, ferries marked `stage` since) and the river
  // towns. The fords and ferries of every road are not waited at here: a flooded river's wait is this one.
  const sites = Object.values(world.map.sites).filter(site => isStage(site) || ['san-felipe', 'washington', 'lynchburg', 'liberty'].includes(site.id));
  const found = [];
  let walked = 0;
  for (let i = 1; i < travel.points.length; i++) {
    const a = travel.points[i - 1], b = travel.points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    for (const site of sites) {
      const t = length ? Math.max(0, Math.min(1, ((site.x - a.x) * (b.x - a.x) + (site.y - a.y) * (b.y - a.y)) / (length * length))) : 0;
      const near = Math.hypot(site.x - (a.x + (b.x - a.x) * t), site.y - (a.y + (b.y - a.y) * t));
      if (near < 0.3 && !found.some(one => one.id === site.id)) found.push({ id: site.id, at: walked + length * t });
    }
    walked += length;
  }
  return found.filter(one => one.at < travel.distance - 0.3).sort((a, b) => a.at - b.at);
}

/** One tick of the flight for every family on the road: the rivers, the food, the sickness, and arriving. */
export function advanceFlight(world, minutes) {
  const days = minutes / DAY;
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (!flight || !['fled', 'refuged', 'returning'].includes(flight.status)) continue;
    // A family taken in by its neighbours goes where they go, and its road is theirs (sim/acting.mjs).
    if (household.takenIn) continue;
    const travellers = [...household.members, ...(household.property || [])].map(id => world.entities[id]).filter(entity => entity?.travel && ['flee', 'return'].includes(entity.travel.purpose));
    const leader = travellers.find(entity => entity.kind === 'person') || travellers[0];
    // At a flooded river the whole family waits its turn, then goes over together.
    if (leader && flight.status === 'fled') {
      if (flight.crossing) {
        if (world.minute >= flight.crossing.until) {
          flight.crossed = [...(flight.crossed || []), flight.crossing.siteId];
          tell(world, household, `The family got over at ${world.map.sites[flight.crossing.siteId].name} and went on.`, { importance: 2 });
          delete flight.crossing;
        }
      } else {
        const next = crossingsAlong(world, leader.travel).find(one => !(flight.crossed || []).includes(one.id) && leader.travel.progress >= one.at - 0.05);
        if (next) {
          // A family with a sick child is let over first, as the ferryman at the Trinity did (sim/flight-work.mjs, `HIST-TEX-639`).
          const hours = crossingHoursFor(world, household, CROSSING_HOURS);
          flight.crossing = { siteId: next.id, until: world.minute + hours * 60 };
          tell(world, household, `The river is up at ${world.map.sites[next.id].name}, and families are waiting their turn to get over. The family waits with them.${hours < CROSSING_HOURS ? ' The ferryman is letting families with sick children over first, and the family’s turn will come sooner.' : ''}`, { importance: 2, ...(hours < CROSSING_HOURS && { claimId: 'HIST-TEX-639' }) });
        }
      }
    }
    // The road's own doings (sim/road.mjs): the rain and the bog, the camp, the pursuit. Whatever holds the family - the
    // river, the mud, a hunt from the camp - halts everybody travelling with it, and nothing else does.
    const heldOnRoad = advanceRoad(world, household);
    if (flight.status === 'fled') {
      const halt = Boolean(flight.crossing) || heldOnRoad;
      for (const entity of travellers) if (entity.travel) { if (halt) entity.travel.halted = true; else delete entity.travel.halted; }
    }
    // On the road the family eats what it carries, and goes hungry when that is gone. Each by their age (sim/family.mjs
    // `eatenADay`, FIC-GONZ-360): a small child a quarter or half of a grown share.
    // Not a man serving with the army who happens to camp where his family took refuge (Lynchburg, San Felipe): he eats the
    // army's rations and is sick or well with it (`FIC-GONZ-442`).
    const alive = people(world, household).filter(person => !GONE.includes(person.health?.condition) && person.service?.status !== 'serving' && (person.travel?.purpose === 'flee' || person.travel?.purpose === 'return' || person.location?.siteId === flight.refuge));
    if (flight.status !== 'returning' && household.resources) household.resources.food = Math.max(0, Math.round((household.resources.food - eatenADay(world, alive) * days) * 10000) / 10000);
    // The milk cow's day of milk, once a day, if a child drove her along (sim/flight-work.mjs `milkCow`).
    milkCow(world, household);
    const hungry = (household.resources?.food ?? 0) <= 0;
    // Sickness, and the rare death, rolled by the day.
    const day = Math.floor(world.minute / DAY);
    if (flight.status !== 'home' && day !== flight.sickDay) {
      flight.sickDay = day;
      // The day's sickness for everybody with the family - the norther over the road, a chill on the chest, the crowded places,
      // getting worse, nursing and the rare death - is sim/disease.mjs's, one rule for the road, home and the camp (docs/DISEASE.md).
      roadSickness(world, household, alive, { hungry, day });
    }
    // Come to a stop on its route: on at once for the next (sim/flight-route.mjs); at the last, it camps there.
    const onward = flight.status === 'fled' && !travellers.length && flight.route?.stops?.length > 1 && nextLeg(world, household);
    // Arrived at the refuge, or home again.
    if (flight.status === 'fled' && !travellers.length && !onward) {
      delete flight.route;
      flight.status = 'refuged'; flight.arrivedMinute = world.minute;
      // A column that comes on again here is a new warning: whether to go on further east (sim/road.mjs `flight.warned`).
      delete flight.warned;
      tell(world, household, `The family has reached ${world.map.sites[flight.refuge].name}, and camps there with the other families from the west.`);
    }
    if (flight.status === 'returning' && !travellers.length) {
      flight.status = 'home'; flight.homeMinute = world.minute;
      // What the family carried of its household goods, all the way home (owner, 2026-09-29, D9 (a); sim/flight-goods.mjs).
      const broughtHome = Object.fromEntries(HOUSEHOLD_GOODS.filter(good => (flight.took?.[good] ?? 0) > 0).map(good => [good, Math.min(flight.took[good], goodCount(household, good))]).filter(([, amount]) => amount > 0));
      if (Object.keys(broughtHome).length) tell(world, household, `They brought home what they had carried all the way: ${goodsWords(broughtHome)}.`, { claimId: 'FIC-GONZ-990', importance: 2 });
      if (flight.burned || !advanceModelled(world)) {
        // Home to what is left (`HIST-GONZ-019`): whatever word they had of it, now they see it.
        if (flight.unseen) learnOwnBurning(world, household, 'home');
        tell(world, household, flight.burnedBy?.hand === 'mexican'
          ? `The family is home. The house is ashes, the field is burned over and the rails are gone; what was left in the house went with it. They begin again with what they brought.`
          : 'The family is home. The house and the field are burned, and what was not carried away is gone. They begin again with what they brought.', { claimId: flight.burnedBy ? 'HIST-GONZ-019' : 'FIC-GONZ-046' });
      } else {
        // The Mexican army never came this way: the house stands, and what was left in it is where they left it (`FIC-GONZ-465`).
        const found = Object.entries(flight.left || {}).filter(([, amount]) => amount > 0);
        // The tools, the chest and the wheel left in the house are the family's again (sim/flight-goods.mjs), the stores in the house.
        for (const [good, amount] of found) { if (isHouseholdGood(good)) restoreGood(household, good, amount); else household.resources[good] = (household.resources[good] ?? 0) + amount; }
        delete flight.left;
        tell(world, household, `The family is home. The Mexican army never came this way: the house stands and the field is as they left it${found.length ? `, and what they left in the house is still there: ${found.map(([good, amount]) => goodWords(good, amount)).join(', ')}` : ''}.`, { claimId: 'FIC-GONZ-465' });
      }
      // What they hid in the river bottom before they went is dug up and carried in (sim/flight-work.mjs `flee-hide`).
      digUpCache(world, household);
      // The milk cow a child drove all the way goes back into the herd (sim/flight-work.mjs).
      cowHome(world, household);
      // And whatever is still on the range of the herd they could not drive (sim/stock.mjs `findStockAgain`): half the
      // cattle, a quarter of the hogs, and the rest gone wild in the timber; less of the cattle where foragers drove them off.
      findStockAgain(world, household);
    }
  }
}

/**
 * The armies pass. On the real land (sim/advance.mjs): a column's foragers reach each farm in the burn zone at its minute and
 * burn it, taking whoever they find at home (`burnByForagers`), and a farm outside it is never reached; the Texians' own
 * burnings are the towns', on their dates. On the invented Gonzales country: the Texas army burns what a family that stayed
 * left standing, and the Mexican army takes who it finds at home on the settlement's day.
 */
export function advanceArmiesPassing(world) {
  if (advanceModelled(world)) {
    for (const household of Object.values(world.households)) {
      // A family still deciding when the settlement's two days are out has stayed, as it always did (the Texas army's passing
      // was the moment); nothing burns for it. Without this a family that cannot or will not go - Liberty has no refuge east
      // of some of its farms - would hold the class's calendar at the farming scale for the rest of the spring.
      const days = SETTLEMENT_DAYS[settlementOf(household)];
      if (household.flight?.status === 'ordered' && days && world.minute >= days.burn) {
        household.flight.status = 'stayed';
        household.flight.stayedMinute = world.minute;
        tell(world, household, 'The family has not gone. It stays where it is and takes what comes; the road east is still open.', { importance: 2 });
      }
      if (household.flight?.burned) continue;
      const at = burnMinute(world, household);
      if (at === null || world.minute < at) continue;
      const fate = farmFate(world, household);
      burnByForagers(world, household, fate, COLUMNS.find(column => column.id === fate.columnId));
    }
    return;
  }
  const done = world.director.milestones;
  for (const household of Object.values(world.households)) {
    const days = SETTLEMENT_DAYS[settlementOf(household)];
    if (!days) continue;
    const flight = household.flight;
    if (flight && !flight.burned && world.minute >= days.burn) {
      burnFarm(world, household, { watching: false });
      if (household.flight.status === 'ordered') household.flight.status = 'stayed';
    }
    const key = `enemy:${household.id}`;
    if (days.enemy && world.minute >= days.enemy && !done[key]) {
      done[key] = true;
      for (const person of atHome(world, household)) {
        if (share(world, person.id, 'enemy') >= CAPTURED_AT_HOME) continue;
        person.health = { condition: 'captured' }; person.task = 'rest'; person.chore = null;
        tell(world, household, `${person.name} was at home when the Mexican army came through, and was taken prisoner.`, { actorId: person.id });
        if (household.played) spotlight(world, { key: `taken:${person.id}`, text: `The Mexican army comes through ${world.map.sites[household.homeSiteId]?.name || 'the settlement'} and takes ${person.name}, of ${householdName(world, household)}, prisoner at home.`, siteId: household.homeSiteId, householdId: household.id });
      }
    }
  }
}

/**
 * Word of the victory: every family at its refuge turns for home - or, given `only`, each of these families, as the word reaches
 * it (sim/expresses.mjs `hearExpresses`, docs/COLONIES.md §5.4c), and a family that heard it on the road turns when it comes to its
 * refuge. The cause is the family's own hearing of it where none is given.
 */
export function turnHome(world, causeId, only = null) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (only && !only.has(household.id)) continue;
    if (!flight || flight.status !== 'refuged' || household.takenIn) continue;
    const cause = causeId || world.knowledge?.households?.[household.id]?.['san-jacinto']?.eventId || null;
    const at = flight.refuge;
    // The wounded go home with the rest (interactions M4, 2026-09-28), in the wagon or at a wounded man's pace.
    const goers = people(world, household).filter(person => !GONE.includes(person.health?.condition) && person.service?.status !== 'serving' && person.location?.siteId === at && !person.travel);
    // Home with the wagon only when every beast the family has is there with it, the wagon and an ox among them: as it was when a
    // family had one of each (all three at the refuge), and the same rule for one that bought more (sim/beasts.mjs).
    const all = beasts(world, household), there = all.filter(beast => beast.location.siteId === at);
    const mode = flight.mode === 'wagon' && there.length === all.length && there.some(beast => roleOf(beast) === 'wagon') && there.some(beast => roleOf(beast) === 'ox') ? 'wagon' : 'foot';
    const path = findWay(world, at, household.homeSiteId, mode, { ferries: false });
    if (!goers.length || !path) continue;
    const departure = tell(world, household, `With the news from San Jacinto the family turned for home from ${world.map.sites[at].name}.`, { causes: cause ? [cause] : [] });
    const home = [...goers, ...beasts(world, household).filter(beast => beast.location.siteId === at && !beast.travel)];
    const journey = () => ({ from: at, to: household.homeSiteId, points: path.points.map(point => ({ ...point })), progress: 0, distance: path.distance, speed: mode === 'wagon' ? WAGON_SPEED : WALK_SPEED, mode, purpose: 'return', silent: true, causeId: departure, ...(path.pace?.length && { pace: path.pace }) });
    // Home as they went (sim/company.mjs), in a class made since the means were rolled.
    if (world.meansRoll) setOut(home, mode === 'wagon' ? drawnVehicles(home) : [], journey, riddenHorses(world, home));
    for (const entity of home) {
      if (!world.meansRoll) entity.travel = journey();
      entity.location = { ...path.points[0], siteId: null };
      if (entity.kind === 'person') entity.task = 'travel';
    }
    // Home on foot with the milk cow, at her pace (sim/flight-work.mjs `cowPace`).
    cowPace(world, household);
    flight.status = 'returning';
  }
}

/** What the family sees of its own flight. */
/**
 * The load a family that decides alone takes (sim/neighbours.mjs, sim/auto.mjs): all the food that fits, then seed, cotton
 * and powder, for the nearest refuge east. From the flight as the family is shown it (`flightProjection`).
 */
export function packFlight(shown) {
  const take = {}; let room = shown.room;
  // Food first, as it always was; then, with room to spare, the family's tools and the chest and the wheel (sim/flight-goods.mjs), in
  // that order, for a family that has them. Room is counted in hundredths so a quarter's space is never lost to the floating point.
  const goods = ['food', 'seed', 'cotton', 'powder', ...HOUSEHOLD_GOODS.filter(good => good in (shown.space || {}))];
  for (const good of goods) { const amount = Math.min(shown.have[good] || 0, Math.floor(room / shown.space[good] + 1e-9)); take[good] = amount; room = Math.round((room - amount * shown.space[good]) * 100) / 100; }
  const refuge = [...shown.refuges].sort((a, b) => a.miles - b.miles)[0].id;
  return { take, refuge };
}

/**
 * The family goes without a student's word: its main person is on auto, or nobody answered by hand within
 * its three real minutes (sim/auto.mjs, sim/decision-budget.mjs `QUESTION_BUDGETS.flight`). Packed as a neighbour packs. False when it cannot go yet - nobody at home - which is
 * tried again next tick.
 */
export function autoFlee(world, household, { why = 'auto' } = {}) {
  const shown = flightProjection(world, household);
  if (!shown?.refuges?.length) return false;
  const { take, refuge } = packFlight(shown);
  if (fleeRefusal(world, household, { take, refuge })) return false;
  if (why === 'waited') tell(world, household, 'Nobody gave the word, and the family could wait no longer: it loaded what it could and went.', { importance: 2 });
  flee(world, household, { take, refuge });
  // Its student at the screen let the order lapse (sim/auto.mjs `flightWaited`): the house is lost behind it (`burnForSilence`).
  if (why === 'waited') burnForSilence(world, household);
  return true;
}

/**
 * The order to leave went unanswered by a student at the screen, and the family left in a rush: **its house burns behind it**
 * (owner, 2026-09-29: "72 s at quick, but if the student doesn't respond, burn their house. They should have been paying
 * attention."; `FIC-GONZ-907`). Only ever called for a family `advanceAuto` packs off by silence - a played family at its
 * screen, its answerer by hand - so a family nobody plays, an absent one and one on auto keep the old answer, the farm left
 * standing.
 *
 * **Who burns it: men of the Texas army**, as the family goes - the game's own rule for the invented country (`burnFarm`,
 * `FIC-GONZ-046`) and the documented practice of the Texas army on its retreat, which burned Gonzales and San Felipe so the
 * Mexican army would find nothing (`HIST-TEX-594`). The record read for this game says nothing of any particular farm burned
 * because its family left late; that is the game's. Burned as every farm in this game burns - the house, the field and the
 * fences, and whatever was left in the house - and counted as every burning is (`flight.burned`, `burnedBy` with the hand
 * `texian`, the world's record of it), so the Host, the homecoming, the flashback and the ending all tell it. The family sees
 * it from the road, so nothing is kept `unseen`. Nothing is taken from the herd: that is the foragers' doing, not this.
 *
 * On the invented country the farm has already burned as the family drove off (`flee` → `burnFarm`), and nothing more is done.
 */
export function burnForSilence(world, household) {
  const flight = household.flight;
  if (!flight || Number.isFinite(flight.burned)) return false;
  const lost = flight.left ? Object.entries(flight.left).filter(([, amount]) => amount > 0).map(([good, amount]) => goodWords(good, amount)) : [];
  const text = `Nobody answered the order to leave in time, and the family left in a rush. As it went, men of the Texas army set fire to the house, the field and the fences behind it, so the Mexican army would find nothing to use. The house is lost.${lost.length ? ` What was left in it burned too: ${lost.join(', ')}.` : ''}`;
  if (!ruin(world, household, ['cabin', 'field', 'fence'], { text }).length) tell(world, household, text, { importance: 3, claimId: 'FIC-GONZ-907' });
  household.furniture = {};
  delete household.interior;
  delete household.herdLookedDay;
  delete flight.left;
  flight.burned = world.minute;
  flight.burnedBy = { hand: 'texian', name: 'the Texas army', lapsed: true, ...(lost.length && { lost }) };
  flight.burnKnown = { minute: world.minute, how: 'there' };
  recordFarmBurned(world, household);
  learn(world, household.id, farmTopic(household), { status: 'confirmed', source: 'Their own eyes', text: 'The Texas army burned the family’s farm as it left.' });
  if (household.played) spotlight(world, { key: `burned:${household.id}`, text: `Nobody answered for ${householdName(world, household)} in time: it left in a rush, and the Texas army burns its house behind it at ${world.map.sites[household.homeSiteId]?.name || 'its land'}.`, siteId: household.homeSiteId, claimId: 'FIC-GONZ-907', householdId: household.id, tell: false });
  return true;
}

export function flightProjection(world, household) {
  const flight = household?.flight;
  if (!flight) return null;
  const shown = { status: flight.status, ...(flight.refuge && { refuge: flight.refuge, refugeName: world.map.sites[flight.refuge]?.name }), ...(flight.crossing && { waitingAt: world.map.sites[flight.crossing.siteId]?.name }), ...(flight.mode && { mode: flight.mode }),
    // Who has the milk cow (sim/flight-work.mjs): the page draws her beside them.
    ...(flight.cow && { cow: { by: flight.cow.by } }),
    // On foot the family goes at her pace (owner, 2026-09-27), and the card says why it is slower.
    ...(heldToCow(world, household) && { cowPace: true }) };
  // On the road: the weather, the bog, the camp, the danger and the open question (sim/road.mjs).
  if (!['ordered', 'stayed'].includes(flight.status)) return { ...shown, ...roadProjection(world, household) };
  const deciding = { ...shown, ...loadCard(world, household), ...(flight.stayedMinute !== undefined && { decidedToStay: true }),
    // Burned as far as the family knows: a farm burned while nobody of it could see is not burned on its page yet (`unseen`).
    burned: Boolean(flight.burned && !flight.unseen),
  };
  // The load the card opens with (design audit 2026-09-28 B7): the packing a family that decides alone takes (`packFlight`), so
  // the obvious two presses leave with the food rather than with nothing. The student may change every number before going.
  if (deciding.refuges.length) deciding.packed = packFlight(deciding);
  return deciding;
}

/**
 * The load's card, the same before the order and after it: the room and what carries it, the room each thing takes and how many
 * the family has - the stores, and its tools, chest and spinning wheel only where it has them (sim/flight-goods.mjs), with the
 * words to call them by - and where it may make for.
 */
function loadCard(world, household) {
  const home = world.map.sites[household.homeSiteId];
  const { room, mode, wagons, cart, carreta } = flightRoom(world, household);
  const goods = householdGoods(household);
  return {
    // What carries it, for the card's words: the cart of a family of the poorest means, or how many wagons (sim/means.mjs).
    room, mode, ...(wagons && { wagons }), ...(cart && { vehicle: 'cart' }), ...(carreta && { vehicle: 'carreta' }),
    space: { ...FLIGHT_SPACE, ...Object.fromEntries(Object.keys(goods).map(good => [good, HOUSEHOLD_SPACE[good]])) },
    have: { ...Object.fromEntries(Object.keys(FLIGHT_SPACE).map(good => [good, Math.floor(household.resources?.[good] ?? 0)])), ...goods },
    ...(Object.keys(goods).length && { names: Object.fromEntries(Object.keys(goods).map(good => [good, good === 'axe' ? 'felling axe' : wagonItem(good)?.name.toLowerCase() || good])) }),
    refuges: REFUGES.filter(id => world.map.sites[id] && world.map.sites[id].x > home.x + 2).map(id => ({ id, name: world.map.sites[id].name, miles: Math.round(Math.hypot(world.map.sites[id].x - home.x, world.map.sites[id].y - home.y)) })),
    // Every place the family may make for instead, with stops on the way (sim/flight-route.mjs): ids, whose names and points
    // are on the page's own map.
    places: flightPlaces(world.map).filter(id => id !== household.homeSiteId),
  };
}

/**
 * The card of a family that may leave before its order (owner, 2026-09-29, D9 (b); sim/early-word.mjs), or null: sent beside the
 * flight rather than as it (`early` in the projection), because a family with no order has no flight, and every reader of a flight
 * takes it for an order. What it heard, what going now costs, and the load as the order's card has it. From the family's own
 * knowledge only (`earlyWord`).
 */
export function earlyProjection(world, household) {
  const word = earlyWord(world, household);
  if (!word) return null;
  const card = { status: 'early', heard: word.text, cost: EARLY_COST, ...loadCard(world, household),
    ...(household.field && ['planted', 'ripe'].includes(household.field.state) && { crop: household.field.crop === 'cotton' ? 'cotton' : 'corn' }),
    // The milk cow already on a rope, drawn beside her child (sim/flight-work.mjs).
    ...(household.readying?.cow && { cow: { by: household.readying.cow.by } }) };
  if (card.refuges.length) card.packed = packFlight(card);
  return card;
}

export const FLIGHT_STATUSES = Object.freeze(['ordered', 'fled', 'stayed', 'refuged', 'returning', 'home']);
export function scrapeInvalid(world) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (flight === undefined) continue;
    if (!flight || !FLIGHT_STATUSES.includes(flight.status)) return 'Invalid flight';
    if (flight.refuge !== undefined && !world.map.sites[flight.refuge]) return 'Invalid refuge';
    // What the advance writes (sim/scrape.mjs `burnByForagers`, `flee`): absent on every class saved before it.
    if (flight.left !== undefined && (!flight.left || typeof flight.left !== 'object' || Object.entries(flight.left).some(([good, amount]) => !(good in LOAD_SPACE) || !Number.isInteger(amount) || amount < 0))) return 'Invalid goods left at home';
    // What foragers took from a family that stayed (`burnByForagers`, 2026-09-29): absent on every class saved before, which is none.
    if (flight.burnedBy?.taken !== undefined && (!Array.isArray(flight.burnedBy.taken) || flight.burnedBy.taken.some(words => typeof words !== 'string'))) return 'Invalid goods taken';
    if (flight.unseen?.taken !== undefined && (!flight.unseen.taken || Object.entries(flight.unseen.taken).some(([good, amount]) => !(good in LOAD_SPACE) || !Number.isInteger(amount) || amount < 1))) return 'Invalid goods taken';
    if (flight.unseen !== undefined && (!Number.isFinite(flight.burned) || !flight.unseen || typeof flight.unseen !== 'object')) return 'Invalid unseen farm';
    if (flight.burnedBy !== undefined && (!Number.isFinite(flight.burned) || !['mexican', 'texian'].includes(flight.burnedBy?.hand))) return 'Invalid burning';
  }
  const badReadying = readyingInvalid(world);
  if (badReadying) return badReadying;
  const badRoad = roadInvalid(world);
  if (badRoad) return badRoad;
  for (const household of Object.values(world.households)) { const bad = routeInvalid(world, household); if (bad) return bad; }
  const badChase = pursuitInvalid(world);
  if (badChase) return badChase;
  for (const entity of Object.values(world.entities)) {
    if (entity.health?.condition === 'sick' && !Number.isFinite(entity.health.recoversAt)) return 'A sickness with no mending';
  }
  return null;
}

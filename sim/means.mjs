// What a family has to start with: its means, rolled on a second die beside the family's own.
//
// Owner, 2026-09-25: "introduce rolling for starting wealth. tie it into the extra wagons. part of wealth will be number of
// wagons. if a family doesn't have enough wagons, older family members walk. have this potentially affect travelling speed."
// (docs/FAMILY_CREATION.md and docs/SETTLING_IN.md §4b, amendments of that day.)
//
// **The record** (`HIST-TEX-441`, `HIST-TEX-442`): more wagons went with wealth, not children. Dilue Rose Harris's father put
// their neighbours in 1834 into "three classes: those that owned wagons were the aristocracy; the second class owned carts; as he
// had a sleigh he belonged to the lower class"; a Frenchman "owned a big wagon and six yoke of oxen". Coin was scarce for
// everybody: "Money is scarce, in Texas" and "no poor people here, and none rich; that is, none who have much money" (Holley,
// 1833); "Specie is the only current money of the country" (Woodman, 1835). Harris's own reckoning ranks a family by what it
// hauled with, and so do these bands. They do not differ in the horse, which even her "lower class" had ("Father bought oxen and
// a horse"). No source gives how many families were of each sort, so the shares of the die are the game's own (`FIC-GONZ-393`).
//
// **Amended by the owner the same evening** (docs/FAMILY_CREATION.md, the second amendment of 2026-09-25): "families should get
// some starting coin, starting with a minimum of 3 coin, and a maximum of 10 coin. this should be a structured part of the wealth
// d20 roll. yes, it should be possible to start with no wagon. it shouldn't block gameplay, but some things might have to happen
// slower." So a class made since rolls on the **second table** (`world.meansRoll === MEANS_TABLE`): five bands, the lowest with no
// vehicle at all, and every face of the die a fixed number of reales (`MEANS_COIN`, `FIC-GONZ-397`):
//
// | Roll  | Means        | Comes with                         | Coin, face by face      |
// | 1-2   | Hard up      | no vehicle; the ox carries packs   | 3, 3                    |
// | 3-6   | Poor         | a cart and one ox                  | 3, 3, 4, 4              |
// | 7-14  | Modest       | a wagon and an ox                  | 5, 5, 5, 5, 6, 6, 6, 6  |
// | 15-18 | Comfortable  | two wagons, an ox to each          | 7, 7, 8, 8              |
// | 19-20 | Well-to-do   | three wagons, an ox to each        | 9, 10                   |
//
// The odds are 10, 20, 40, 20 and 10 in a hundred. Coin never falls as the face rises, and no band's coin is below the band
// under it. A class made earlier on 2026-09-25 (`world.meansRoll === true`) rolled on the first table - four bands, the poorest
// a cart, 1-6, and no coin (`MEANS_BANDS_BEFORE`) - and keeps it, so a class saved before opens exactly as it was.
//
// **The coin counts in the ending, and how is open for the owner.** The ending is built and counts the coin in the house
// (sim/ending.mjs `finalNumber`: coin times glory). The owner has now chosen unequal starting coin; the fix recommended in
// docs/MONEY_AND_GLORY.md - score the coin gained over the coin a family started with (`household.means.coin`) - waits on the
// owner, and nothing about the ending changed here.
//
// Every family keeps its horse, and the stock it may choose to drive in (docs/STOCK.md) is the same whatever its means.
// ceiling: a well-to-do family of the record might bring more cattle, a slave-worked plantation's capital, or a head start on land;
// the game gives it wagons and a few reales more. **Slaveholding was part of the wealth of some Anglo families** (TSHA, "Old Three
// Hundred": "the large number of slaveholders among them" as a sign of "financial stature"); the families of this game are not
// slaveholders and no family member is enslaved (docs/ALAMO_FATES.md, VISION.md: enslaved people are never property or a
// resource), so no band carries it. That is a decision for the owner, noted in HANDOFF.md, and nothing here decides it.
//
// **When.** A played family's means are thrown with its family, by the same press (`rollFamily` in sim/world.mjs): two dice,
// both shown. A family nobody rolls - nobody joined it, or Start rolled for it - has its means thrown by the world on the class's
// first running tick (`settleMeans`), before anything moves, so every family of a class made since has means. A class saved
// before (`world.meansRoll` absent) keeps what it had: one wagon a family, or a wagon for every eight people in a class made on
// 2026-09-25 before this (sim/beasts.mjs `wagonsForPeople`). No save version moved.
//
// **What is hidden.** Nothing here. The wagons, the oxen and the coin are things a family can see it has, and the die's
// number is no secret, as the family's is not (docs/FAMILY_CREATION.md §2). The hidden stats (§4 there) are not read here.
import { eatenADay, meansRoll, FAMILY_DIE, SENT_FROM_AGE } from './family.mjs';
import { addBeast, beastsOf, yardSpot, BEASTS_MOST } from './beasts.mjs';
import { packForRoom, wagonsOf } from './wagon.mjs';
import { MODES } from './travel.mjs';
import { putOnTheRoad, sayTheArrival } from './settling.mjs';
import { drawnVehicles, riddenHorses, seatWords } from './company.mjs';

/** The table a class made since the owner's second amendment of 2026-09-25 rolls on, stored as `world.meansRoll`. */
export const MEANS_TABLE = 2;
/** Whether this class rolls on the second table: coin, a band on foot, the carreta, the horse ridden (`FIC-GONZ-397`, `-398`). */
export const secondTable = world => world?.meansRoll === MEANS_TABLE;

/**
 * The five means a roll gives on the second table (`FIC-GONZ-393`, re-cut by `FIC-GONZ-397`). `wagons` counts a cart as its one
 * vehicle; a band `afoot` has none, and its one ox carries the packs.
 */
export const MEANS_BANDS = Object.freeze([
  Object.freeze({ id: 'hard-up', name: 'Hard up', from: 1, to: 2, wagons: 0, afoot: true }),
  Object.freeze({ id: 'poor', name: 'Poor', from: 3, to: 6, wagons: 1, cart: true }),
  Object.freeze({ id: 'modest', name: 'Modest', from: 7, to: 14, wagons: 1 }),
  Object.freeze({ id: 'comfortable', name: 'Comfortable', from: 15, to: 18, wagons: 2 }),
  Object.freeze({ id: 'well-to-do', name: 'Well-to-do', from: 19, to: 20, wagons: 3 }),
]);
/**
 * The first table, of the afternoon of 2026-09-25: four bands and no coin, the poor a cart on 1-6. A class that rolled on it keeps
 * it. The three above the poor are the second table's own, unchanged.
 */
export const MEANS_BANDS_BEFORE = Object.freeze([
  Object.freeze({ id: 'poor', name: 'Poor', from: 1, to: 6, wagons: 1, cart: true }),
  ...MEANS_BANDS.slice(2),
]);
/**
 * The reales every face of the means die starts a family with, face 1 first (owner, 2026-09-25: "a minimum of 3 coin, and a
 * maximum of 10 coin ... a structured part of the wealth d20 roll"; `FIC-GONZ-397`). Hard up 3; poor 3-4; modest 5-6;
 * comfortable 7-8; well-to-do 9-10, spread within each band by face. Invented: no source read gives what coin a family brought.
 */
export const MEANS_COIN = Object.freeze([3, 3, 3, 3, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 8, 8, 9, 10]);
export const MEANS_DIE = FAMILY_DIE;
/** The reales a face of the means die gives, on the second table. */
export function coinFor(roll) {
  if (!Number.isInteger(roll) || roll < 1 || roll > MEANS_DIE) throw new Error('A die shows one to twenty.');
  return MEANS_COIN[roll - 1];
}
/** The bands this class rolls on. */
export const bandsOf = world => (secondTable(world) ? MEANS_BANDS : MEANS_BANDS_BEFORE);
/** The band a roll of the means die falls in, on this table (the second, unless another is given). */
export function bandFor(roll, bands = MEANS_BANDS) {
  if (!Number.isInteger(roll) || roll < 1 || roll > MEANS_DIE) throw new Error('A die shows one to twenty.');
  return bands.find(band => roll >= band.from && roll <= band.to);
}
export const bandById = (id, bands = MEANS_BANDS) => bands.find(band => band.id === id) || null;

const NUMBER_WORDS = Object.freeze({ 2: 'two', 3: 'three' });
const realesWords = coin => `${coin} ${coin === 1 ? 'real' : 'reales'}`;
/**
 * What the band comes with, in a sentence: "A cart and one ox to draw it, the family's horse, and 4 reales." On the first table,
 * which gave no coin, "A cart and one ox to draw it, and the family's horse." as it always said.
 */
export function meansWords(band, coin = null) {
  const haul = band.afoot ? 'No wagon or cart: an ox to carry the packs'
    : band.cart ? 'A cart and one ox to draw it' : band.wagons === 1 ? 'A wagon and an ox to draw it' : `${NUMBER_WORDS[band.wagons][0].toUpperCase()}${NUMBER_WORDS[band.wagons].slice(1)} wagons, an ox to each`;
  return coin ? `${haul}, the family's horse, and ${realesWords(coin)}.` : `${haul}, and the family's horse.`;
}

/**
 * The family given its means: a cart in place of the family wagon, no vehicle at all, or more wagons and an ox to each beside
 * it; its coin, on the second table; and the load packed again for the room it now has. Once: a family that has means keeps
 * them. If it is on the road in, its new wagons go on the road with it and the whole company is seated again (sim/settling.mjs
 * `putOnTheRoad`), a family with no vehicle walks the road in, and the founding line says what it comes with. Returns the means.
 */
export function applyMeans(world, household) {
  if (household.means) return household.means;
  const roll = meansRoll(world.seed, household.id);
  const band = bandFor(roll, bandsOf(world));
  const coin = secondTable(world) ? coinFor(roll) : 0;
  household.means = { roll, band: band.id, ...(band.cart && { cart: true }), ...(band.afoot && { afoot: true }), ...(coin && { coin }) };
  // The vehicle: the family wagon is the family's cart, or it has none (the family wagon is not the family's: it never came),
  // or it has more wagons beside it, and an ox to draw each. A family on foot keeps its one ox, the family's own, to carry the packs.
  const wagon = wagonsOf(world, household)[0];
  if (band.cart && wagon) { wagon.cart = true; wagon.name = 'Family cart'; }
  if (band.afoot) for (const one of wagonsOf(world, household)) {
    delete world.entities[one.id];
    household.property = household.property.filter(id => id !== one.id);
  }
  const site = world.map.sites[household.homeSiteId];
  const added = [];
  for (const role of ['wagon', 'ox']) {
    const want = Math.min(BEASTS_MOST, band.wagons);
    while (beastsOf(world, household, role).length < want) {
      const beast = addBeast(world, household, role, null, { at: { x: site.x, y: site.y, siteId: site.id } });
      beast.location = { ...yardSpot(site, beast), siteId: site.id };
      added.push(beast.id);
    }
  }
  // The coin, in the house with the rest (docs/MONEY_AND_GLORY.md): a family's own to spend from the first hour.
  if (coin) household.resources = { ...household.resources, money: (household.resources?.money ?? 0) + coin };
  packForRoom(world, household);
  carryTheRest(world, household);
  // On the road in: the new wagons and oxen join the family at the fork, and whoever is still there is seated again. A family with
  // no vehicle walks in, at a walker's pace over the ground as a walker goes it.
  if (household.arriving) {
    putOnTheRoad(world, household, band.afoot ? null : added);
    sayTheArrival(world, household);
  }
  return household.means;
}

/**
 * The fewest days of food any family arrives with, for the people it has, whatever its means (coordinator's review of the first
 * poor arrival, 2026-09-25; `FIC-GONZ-396`). A poor family of twelve in a cart came in with 4 food - a day and a half for its
 * eaters - where a well-to-do family of eight had 36: the cart's trim had taken the meal out, and a student would feel the roll
 * as a punishment. The means are meant to change what a family can haul and how it travels, not whether it eats the first week.
 *
 * Five days, because it is the first period at Gonzales end to end (4.7 days from the road in to the gathering, measured
 * 2026-09-25) and the whole of the guided start inside it: a family that set every hand to the house, the clearing and the field
 * - none of them at the routine work that feeds a family - still does not run out before its first harvest or hunt.
 * ceiling: invented. The record read says the walkers "travel by the side of their baggage" (Woodman) and a woman walked "with a
 * bucket in hand" (Smithwick), and nothing about how much food they carried; the packs are the game's, and a source would set them.
 */
export const ARRIVAL_DAYS = 5;
/**
 * What the family carries on foot beside its vehicles to make up `ARRIVAL_DAYS` of food for its eaters, where what it packed
 * falls short: sacks and bundles, counted as food and apart from the load (`household.packs`, sim/wagon.mjs `storesWithPacks`),
 * so repacking the cart before Start changes only what is in the cart. Fixed once, from the load it was packed with, whole food.
 * A family with no vehicle carries all of its food so.
 */
function carryTheRest(world, household) {
  const eaters = household.members.map(id => world.entities[id]).filter(Boolean);
  const short = Math.ceil(ARRIVAL_DAYS * eatenADay(world, eaters) - (household.resources?.food ?? 0) - 1e-9);
  if (short <= 0) return;
  household.packs = { food: short };
  household.resources = { ...household.resources, food: (household.resources?.food ?? 0) + short };
}
/**
 * What the family's people can carry on foot, in food (`FIC-GONZ-397`): a walker's load (sim/travel.mjs `MODES.foot.carry`, five)
 * for everybody of ten and over, who may be sent (`SENT_FROM_AGE`), and nothing for a younger child. Held against the food a
 * family on foot carries in (`carriedOnFoot`, tests/means.test.mjs): every family the die can roll carries its five days.
 */
export const FOOT_LOAD = MODES.foot.carry;
export const carriedOnFoot = (world, household) => household.members.map(id => world.entities[id]).filter(person => person && (!Number.isFinite(person.age) || person.age >= SENT_FROM_AGE)).length * FOOT_LOAD;

/**
 * Every family of a class made since that has no means yet is given them: the families nobody plays, and any Start rolled for
 * (sim/world.mjs `stepWorld`, first thing in a running tick, before anything moves). Nothing is written into the family's
 * record: an event there would close the family's own die to a student who joins it later (sim/family.mjs `rollRefusal`), and
 * the means are in the family's book (`meansProjection`) for anybody who plays it.
 */
export function settleMeans(world) {
  if (!world.meansRoll) return;
  for (const household of Object.values(world.households)) if (!household.means) applyMeans(world, household);
}

/**
 * The family's means as its own page shows them, beside the family's roll: the number, the band's name and what it came with -
 * its coin among it, on the second table - and how the family sits on the road in (who rides and who walks, sim/company.mjs).
 * Null before they are rolled, and for every class made before there were means.
 */
export function meansProjection(world, household) {
  if (!household?.means) return null;
  const band = bandFor(household.means.roll, bandsOf(world));
  const people = household.members.map(id => world.entities[id]).filter(Boolean);
  const vehicles = drawnVehicles([...wagonsOf(world, household), ...beastsOf(world, household, 'ox')]);
  const horses = riddenHorses(world, beastsOf(world, household, 'horse'));
  const coin = household.means.coin;
  return { roll: household.means.roll, band: band.id, name: band.name, words: meansWords(band, coin), ...(coin && { coin }), seats: seatWords(people, vehicles, horses) };
}

/** Means that could not have been rolled (sim/world.mjs `validateWorld`). */
export function meansInvalid(world) {
  if (world.meansRoll !== undefined && world.meansRoll !== true && world.meansRoll !== MEANS_TABLE) return 'Invalid means rule';
  for (const household of Object.values(world.households || {})) {
    const means = household.means;
    if (means === undefined) continue;
    if (!world.meansRoll || !means || typeof means !== 'object' || !Number.isInteger(means.roll) || means.roll < 1 || means.roll > MEANS_DIE) return 'Invalid means';
    const band = bandFor(means.roll, bandsOf(world));
    if (means.band !== band.id || (means.cart !== undefined && means.cart !== true) || Boolean(means.cart) !== Boolean(band.cart)) return 'Invalid means';
    if ((means.afoot !== undefined && means.afoot !== true) || Boolean(means.afoot) !== Boolean(band.afoot)) return 'Invalid means';
    if (means.coin !== undefined && (!secondTable(world) || means.coin !== coinFor(means.roll))) return 'Invalid means';
    if (secondTable(world) && means.coin === undefined) return 'Invalid means';
  }
  for (const household of Object.values(world.households || {})) {
    const packs = household.packs;
    if (packs !== undefined && (!household.means || !packs || Object.keys(packs).join() !== 'food' || !Number.isInteger(packs.food) || packs.food < 1)) return 'Invalid packs';
  }
  for (const entity of Object.values(world.entities || {})) if (entity.cart !== undefined && (entity.cart !== true || entity.kind !== 'wagon' || !world.households[entity.householdId]?.means?.cart)) return 'Invalid cart';
  // A carreta (sim/carreta.mjs) is made at home, in a class on the second table, and is a vehicle like a wagon.
  for (const entity of Object.values(world.entities || {})) if (entity.carreta !== undefined && (entity.carreta !== true || entity.kind !== 'wagon' || entity.cart || !secondTable(world) || !world.households[entity.householdId])) return 'Invalid carreta';
  return null;
}

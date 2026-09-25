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
// | Roll  | Means        | Comes with                         |
// | 1-6   | Poor         | a cart and one ox                  |
// | 7-14  | Modest       | a wagon and an ox                  |
// | 15-18 | Comfortable  | two wagons, an ox to each          |
// | 19-20 | Well-to-do   | three wagons, an ox to each        |
//
// **No band brings coin, and that is open for the owner.** Every family has started with none since money came in
// (docs/MONEY_AND_GLORY.md §3), and the ending is built and counts the coin in the house (sim/ending.mjs `finalNumber`: coin
// times glory). A well-to-do family that started with fifteen reales and spent none would finish fifteen times a poor family of
// the same glory for having rolled well. Coin by band - 0, 2, 6 and 15 were drafted - waits on the owner choosing how the ending
// measures money (docs/MONEY_AND_GLORY.md, the amendment of 2026-09-25): wagons are not counted there, so they can differ now.
//
// Every family keeps its horse, and the stock it may choose to drive in (docs/STOCK.md) is the same whatever its means.
// ceiling: a well-to-do family of the record might bring more cattle, a slave-worked plantation's capital, or a head start on land;
// the game gives it wagons. **Slaveholding was part of the wealth of some Anglo families** (TSHA, "Old Three
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
// **What is hidden.** Nothing here. The wagons and the oxen are things a family can see it has, and the die's
// number is no secret, as the family's is not (docs/FAMILY_CREATION.md §2). The hidden stats (§4 there) are not read here.
import { eatenADay, meansRoll, FAMILY_DIE } from './family.mjs';
import { addBeast, beastsOf, yardSpot, BEASTS_MOST } from './beasts.mjs';
import { packForRoom, wagonsOf } from './wagon.mjs';
import { putOnTheRoad, sayTheArrival } from './settling.mjs';
import { drawnVehicles, seatWords } from './company.mjs';

/** The four means a roll gives, on the twenty-sided die (`FIC-GONZ-393`). `wagons` counts a cart as its one vehicle. */
export const MEANS_BANDS = Object.freeze([
  Object.freeze({ id: 'poor', name: 'Poor', from: 1, to: 6, wagons: 1, cart: true }),
  Object.freeze({ id: 'modest', name: 'Modest', from: 7, to: 14, wagons: 1 }),
  Object.freeze({ id: 'comfortable', name: 'Comfortable', from: 15, to: 18, wagons: 2 }),
  Object.freeze({ id: 'well-to-do', name: 'Well-to-do', from: 19, to: 20, wagons: 3 }),
]);
export const MEANS_DIE = FAMILY_DIE;
/** The band a roll of the means die falls in. */
export function bandFor(roll) {
  if (!Number.isInteger(roll) || roll < 1 || roll > MEANS_DIE) throw new Error('A die shows one to twenty.');
  return MEANS_BANDS.find(band => roll >= band.from && roll <= band.to);
}
export const bandById = id => MEANS_BANDS.find(band => band.id === id) || null;

const NUMBER_WORDS = Object.freeze({ 2: 'two', 3: 'three' });
/** What the band comes with, in a sentence: "A cart and one ox to draw it, and the family's horse." */
export function meansWords(band) {
  const haul = band.cart ? 'A cart and one ox to draw it' : band.wagons === 1 ? 'A wagon and an ox to draw it' : `${NUMBER_WORDS[band.wagons][0].toUpperCase()}${NUMBER_WORDS[band.wagons].slice(1)} wagons, an ox to each`;
  return `${haul}, and the family's horse.`;
}

/**
 * The family given its means: a cart in place of the family wagon, or more wagons and an ox to each beside it, and the
 * load packed again for the room it now has. Once: a family that has means keeps them. If it is on the road in, its new wagons go
 * on the road with it and the whole company is seated again (sim/settling.mjs `putOnTheRoad`), and the founding line says what it
 * comes with. Returns the means.
 */
export function applyMeans(world, household) {
  if (household.means) return household.means;
  const roll = meansRoll(world.seed, household.id);
  const band = bandFor(roll);
  household.means = { roll, band: band.id, ...(band.cart && { cart: true }) };
  // The vehicle: the family wagon is the family's cart, or it has more wagons beside it, and an ox to draw each.
  const wagon = wagonsOf(world, household)[0];
  if (band.cart && wagon) { wagon.cart = true; wagon.name = 'Family cart'; }
  const site = world.map.sites[household.homeSiteId];
  const want = Math.min(BEASTS_MOST, band.wagons), added = [];
  for (const role of ['wagon', 'ox']) {
    while (beastsOf(world, household, role).length < want) {
      const beast = addBeast(world, household, role, null, { at: { x: site.x, y: site.y, siteId: site.id } });
      beast.location = { ...yardSpot(site, beast), siteId: site.id };
      added.push(beast.id);
    }
  }
  packForRoom(world, household);
  carryTheRest(world, household);
  // On the road in: the new wagons and oxen join the family at the fork, and whoever is still there is seated again.
  if (household.arriving) { putOnTheRoad(world, household, added); sayTheArrival(world, household); }
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
 */
function carryTheRest(world, household) {
  const eaters = household.members.map(id => world.entities[id]).filter(Boolean);
  const short = Math.ceil(ARRIVAL_DAYS * eatenADay(world, eaters) - (household.resources?.food ?? 0) - 1e-9);
  if (short <= 0) return;
  household.packs = { food: short };
  household.resources = { ...household.resources, food: (household.resources?.food ?? 0) + short };
}

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
 * The family's means as its own page shows them, beside the family's roll: the number, the band's name and what it came with,
 * and how the family sits on the road in (who rides and who walks, sim/company.mjs). Null before they are rolled, and for every
 * class made before there were means.
 */
export function meansProjection(world, household) {
  if (!household?.means) return null;
  const band = bandFor(household.means.roll);
  const people = household.members.map(id => world.entities[id]).filter(Boolean);
  const vehicles = drawnVehicles([...wagonsOf(world, household), ...beastsOf(world, household, 'ox')]);
  return { roll: household.means.roll, band: band.id, name: band.name, words: meansWords(band), seats: seatWords(people, vehicles) };
}

/** Means that could not have been rolled (sim/world.mjs `validateWorld`). */
export function meansInvalid(world) {
  if (world.meansRoll !== undefined && world.meansRoll !== true) return 'Invalid means rule';
  for (const household of Object.values(world.households || {})) {
    const means = household.means;
    if (means === undefined) continue;
    if (!world.meansRoll || !means || typeof means !== 'object' || !Number.isInteger(means.roll) || means.roll < 1 || means.roll > MEANS_DIE) return 'Invalid means';
    const band = bandFor(means.roll);
    if (means.band !== band.id || (means.cart !== undefined && means.cart !== true) || Boolean(means.cart) !== Boolean(band.cart)) return 'Invalid means';
  }
  for (const household of Object.values(world.households || {})) {
    const packs = household.packs;
    if (packs !== undefined && (!household.means || !packs || Object.keys(packs).join() !== 'food' || !Number.isInteger(packs.food) || packs.food < 1)) return 'Invalid packs';
  }
  for (const entity of Object.values(world.entities || {})) if (entity.cart !== undefined && (entity.cart !== true || entity.kind !== 'wagon' || !world.households[entity.householdId]?.means?.cart)) return 'Invalid cart';
  return null;
}

// The family's household goods in the flight's load (owner, 2026-09-29, triage D9 (a), by multiple choice: **"Add household
// goods"**; docs/SCRAPE.md §18, `FIC-GONZ-990`).
//
// Until then the load east was four stores - food, seed, cotton, powder - and the best load was always all the food and some
// powder: tools, the chest and the spinning wheel went with the family unasked and were never lost. Now the tools a family owns
// (sim/tools.mjs counts them: the hoe, the felling axe, the broadaxe, the froe and the auger) and the chest and the spinning wheel
// it brought in its wagon (sim/wagon.mjs `belongings`) are in the load beside the stores, each taking room:
//
//   - **Whatever is carried** stays the family's all the way: on the road, at the refuge, and home again (sim/scrape.mjs
//     `advanceFlight`, sim/homecoming.mjs). It is lost only as the road loses things - left with the wagon in the mud when it does
//     not fit on the family's backs, or taken with the wagon when a column comes up with the family (sim/road.mjs).
//   - **Whatever is left** is taken out of the family's hands when it goes and lies in the house (`flight.left`, as the stores
//     always did): found again when the family comes home to a house standing, and burned with the farm when foragers or the Texas
//     army burn it (`burnedBy.lost`, told in the journal, the homecoming, the flashback and the ending). What the family hid in the
//     river bottom first (sim/flight-work.mjs `flee-hide`) is dug up at home, the chest among it, as the Roses' was (`HIST-TEX-640`).
//
// The rifle is not in the load: it goes in a man's hand, as the coin goes in a pocket (sim/scrape.mjs), or with him to the war
// (sim/keeping.mjs `takeToWar`).
//
// **Everything else the wagon brought in, since 2026-09-30** (owner, answering the question left open on 2026-09-29: *"let it depend
// on how much storage they have. if they have enough wagons, let them bring it all. if they don't, then no."*; docs/SCRAPE.md §21,
// `FIC-GONZ-993`): the bedding, the iron pot, the books, the mosquito bars, the tinware and the chairs are in the load too, each with
// its room, and **only in a wagon** (`WAGON_ONLY`): a family on foot is not offered them, and one that leaves its wagon in the mud
// leaves them with it. A family with the wagons for it brings everything; one with one wagon and a house full of food does not.
//
// **The room each takes** is the game's own (`FIC-GONZ-990`), in the flight's units, where a wagon holds 20 and a food takes a
// quarter: so the felling axe is four food's room, the chest sixteen and the spinning wheel twelve. Chosen so that a wagon can
// take every tool and still be mostly food, but the chest and the wheel together are twenty-eight food left in the house, and on
// foot (a grown person carries 1.25) neither can be carried at all.
import { TOOL_WORDS, addTool, loseTool, toolCount } from './tools.mjs';

/** The room each household good takes in the flight's load, beside the stores (sim/scrape.mjs `FLIGHT_SPACE`). */
export const HOUSEHOLD_SPACE = Object.freeze({ hoe: 0.5, axe: 1, broadaxe: 0.5, froe: 0.25, auger: 0.25, chest: 4, 'spinning-wheel': 3,
  // The rest of what the wagon brought in (2026-09-30, `FIC-GONZ-993`): the lobby's room for each (sim/wagon.mjs), in the flight's
  // units - a wagon's sixteen there are its twenty here, so each is a quarter again.
  bedding: 2.5, pot: 1.25, books: 1.25, 'mosquito-bars': 1.25, tinware: 1.25, chairs: 2.5 });
/** The goods that go only in a wagon, cart or carreta: never on a family's backs (owner, 2026-09-30). */
export const WAGON_ONLY = Object.freeze(['bedding', 'pot', 'books', 'mosquito-bars', 'tinware', 'chairs']);
/** The goods kept for the house, not tools: what the ending's small glory for goods brought home counts (`keptThrough`). */
export const KEEPSAKES = Object.freeze(['chest', 'spinning-wheel', ...WAGON_ONLY]);
/** What the card calls each good. */
export const GOOD_NAMES = Object.freeze({ hoe: 'hoe', axe: 'felling axe', broadaxe: 'broadaxe', froe: 'froe', auger: 'auger', chest: 'chest', 'spinning-wheel': 'spinning wheel',
  bedding: 'bedding', pot: 'iron pot', books: 'books', 'mosquito-bars': 'mosquito bars', tinware: 'tinware', chairs: 'chairs' });
export const HOUSEHOLD_GOODS = Object.freeze(Object.keys(HOUSEHOLD_SPACE));
/** The household goods that are tools (counted, sim/tools.mjs); the rest are belongings brought in the wagon (one each). */
const TOOLS = Object.freeze(['hoe', 'axe', 'broadaxe', 'froe', 'auger']);
const isTool = good => TOOLS.includes(good);
export const isHouseholdGood = good => HOUSEHOLD_GOODS.includes(good);

/** How many of this household good the family has in hand now. */
export function goodCount(household, good) {
  if (isTool(good)) return toolCount(household, good);
  return (household?.belongings || []).includes(good) ? 1 : 0;
}
/** Every household good the family has, and how many: only the ones it has. */
export const householdGoods = household => Object.fromEntries(HOUSEHOLD_GOODS.map(good => [good, goodCount(household, good)]).filter(([, n]) => n > 0));

/** Out of the family's hands: left in the house, left with the wagon, or taken. */
export function removeGood(household, good, amount = 1) {
  for (let i = 0; i < amount; i++) {
    if (isTool(good)) { if (toolCount(household, good)) loseTool(household, good); continue; }
    const at = (household.belongings || []).indexOf(good);
    if (at >= 0) household.belongings = household.belongings.filter((_, j) => j !== at);
  }
}
/**
 * Back in the family's hands: found in the house standing, or dug up from the river bottom. ceiling: a tool found again comes back
 * sound (`addTool` knows no wear to give it); only the hoe wears, and a class ends at the homecoming.
 */
export function restoreGood(household, good, amount = 1) {
  for (let i = 0; i < amount; i++) {
    if (isTool(good)) { addTool(household, good); continue; }
    if (!(household.belongings || []).includes(good)) household.belongings = [...(household.belongings || []), good];
  }
}

const THE = Object.freeze({ chest: 'the chest', 'spinning-wheel': 'the spinning wheel', bedding: 'the bedding', pot: 'the iron pot', books: 'the books',
  'mosquito-bars': 'the mosquito bars', tinware: 'the tinware', chairs: 'the chairs' });
/** One good in words: "40 food", "a hoe", "2 felling axes", "the chest". */
export function goodWords(good, amount) {
  if (THE[good]) return THE[good];
  if (isTool(good)) {
    const [one, many] = TOOL_WORDS[good];
    return amount === 1 ? `${/^[aeiou]/.test(one) ? 'an' : 'a'} ${one}` : `${amount} ${many}`;
  }
  return `${amount} ${good}`;
}
/** A list of goods in words, the stores first as they were always said: "40 food, 2 seed, a hoe and the chest". */
export function goodsWords(goods) {
  const parts = Object.entries(goods || {}).filter(([, amount]) => amount > 0).map(([good, amount]) => goodWords(good, amount));
  if (parts.length < 2) return parts[0] || '';
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}
/** The household goods of a list of goods, in words, or '' when there are none: what the ending and the homecoming say. */
export const householdWords = goods => goodsWords(Object.fromEntries(Object.entries(goods || {}).filter(([good]) => isHouseholdGood(good))));

/**
 * The small glory for household goods brought home through the Scrape (owner, 2026-09-30, answering the question left open on
 * 2026-09-29: **"A little glory"**; docs/MONEY_AND_GLORY.md §5b, `FIC-GONZ-993`): a family that went east and still has with it at
 * the end something kept for the house that it loaded as it left - the chest, the spinning wheel, the bedding, the pot, the books,
 * the mosquito bars, the tinware, the chairs; not a tool, and not a store - counts `KEPT_GLORY`, **once, however many it carried**.
 * Flat (no miles) and capped at the one: the smallest award there is, a single gift of supplies, and far under any fight. Returns
 * `{ glory, goods }`, or null. Read only by the ending (sim/ending.mjs), at the ending proper.
 */
export const KEPT_GLORY = 1;
export function keptThrough(household) {
  const flight = household?.flight;
  if (!flight || !['fled', 'refuged', 'returning', 'home'].includes(flight.status)) return null;
  const goods = KEEPSAKES.filter(good => (flight.took?.[good] ?? 0) > 0 && goodCount(household, good) > 0);
  return goods.length ? { glory: KEPT_GLORY, goods } : null;
}

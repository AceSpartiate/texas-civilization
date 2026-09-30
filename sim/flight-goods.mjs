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
// (sim/keeping.mjs `takeToWar`). ceiling: the other goods the wagon brought in - bedding, the iron pot, tinware, books, chairs,
// mosquito bars - still go with the family unasked and are never lost; the owner named the tools, the spinning wheel and the chest.
// A family that wants the rest weighed is the way out.
//
// **The room each takes** is the game's own (`FIC-GONZ-990`), in the flight's units, where a wagon holds 20 and a food takes a
// quarter: so the felling axe is four food's room, the chest sixteen and the spinning wheel twelve. Chosen so that a wagon can
// take every tool and still be mostly food, but the chest and the wheel together are twenty-eight food left in the house, and on
// foot (a grown person carries 1.25) neither can be carried at all.
import { TOOL_WORDS, addTool, loseTool, toolCount } from './tools.mjs';

/** The room each household good takes in the flight's load, beside the stores (sim/scrape.mjs `FLIGHT_SPACE`). */
export const HOUSEHOLD_SPACE = Object.freeze({ hoe: 0.5, axe: 1, broadaxe: 0.5, froe: 0.25, auger: 0.25, chest: 4, 'spinning-wheel': 3 });
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

const THE = Object.freeze({ chest: 'the chest', 'spinning-wheel': 'the spinning wheel' });
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

// What a family is short of for the work it cannot do yet, counted once on the household for its page (owner, 2026-09-30, after
// playing the release: "i never saw where i could hunt to get leather to make the little carts", and the same day, of four
// questions: "Every gettable lack", "Tanner sells"; docs/FAMILY_PANEL.md §23, docs/WOODS_AND_BUILDING.md §6.9-6.10).
//
// The bar draws only what can be pressed (docs/FAMILY_PANEL.md, the rule of 2026-09-22) - except work refused for want of a thing
// the family could get: a tool, seed, powder, coin, food, a hide, logs (sim/chores.mjs `lacking`). That refusal carries `lack`, the
// counts; here it is lifted off every person's entry of `world.work` - each keeps one byte, `short: 1` - onto the household once:
//
//   wants  { 'make-carreta': { axe: [1, 1], logs: [2, 3], hide: [0, 1] }, 'plant-field': { seed: [1, 2] }, ... }   by work
//   buy    ['hide', 'seed']   which of the things wanted a shop in the family's own town sells (sim/shops.mjs), so the page offers
//                            "Buy one from the tanner" only where there is a tanner, and "Buy a rifle in town" only with a gunsmith
//
// Sent only while the family is short of something (the per-tick channel is budgeted, tests/chores.test.mjs); not stored, so no
// save changes. It decides nothing: the work is refused in the server's own words as it always was. Invented presentation.
import { TRADES, tradesAt } from './shops.mjs';

/**
 * Which shop's offer brings each thing wanted (sim/shops.mjs `TRADES`): the hoe and seed at the store, the felling axe at the smith,
 * a rifle at the gunsmith, powder at either, a rawhide at the tanner (owner, 2026-09-30, "Tanner sells"); coin by selling at the
 * store. Food and logs are not bought: they are hunted, fished and felled.
 */
export const SOLD_AT = Object.freeze({
  hoe: [['store', 'hoe']], axe: [['blacksmith', 'tool-axe']], rifle: [['gunsmith', 'buy-rifle']], seed: [['store', 'seed']],
  powder: [['store', 'powder'], ['gunsmith', 'powder']], hide: [['tanner', 'rawhide']], coin: [['store', 'food'], ['store', 'cotton']],
});
/** The family's own town (sim/chores.mjs `townOf`). */
const townOf = household => household.settlementId || 'gonzales';

/**
 * Take every entry's `lack` off this family's work lists (as built for its page, sim/world.mjs `projectWorld`) and return
 * `{ wants, buy }` for the household, or null when nobody is short of anything. The first person's counts stand for the family:
 * a lack is the household's tools and stores, the same for everybody.
 */
export function liftWants(world, household, work) {
  const wants = {};
  for (const entries of Object.values(work || {})) {
    for (const entry of entries || []) {
      if (!entry.lack) continue;
      wants[entry.id] ??= entry.lack;
      delete entry.lack;
    }
  }
  if (!Object.keys(wants).length) return null;
  const goods = new Set(Object.values(wants).flatMap(lack => Object.entries(lack).filter(([, [have, need]]) => have < need).map(([good]) => good)));
  const open = new Set(world.status === 'lobby' ? [] : tradesAt(world, townOf(household)));
  const buy = [...goods].filter(good => (SOLD_AT[good] || []).some(([trade, offer]) => open.has(trade) && TRADES[trade]?.offers.some(one => one.id === offer)));
  return { wants, ...(buy.length && { buy }) };
}

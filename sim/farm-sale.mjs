// The farm at the end of the game: sold if it stands, and glory for it if it was burned (docs/MONEY_AND_GLORY.md §5a; owner,
// 2026-09-29, answering the triage's D8 - "coin has no required use; crops and goods held at the end count nothing"):
//
//   "if their house and farm wasn't burned and is intact then make selling it part of the end of the game cutscene. if there
//    farm was burned then there's nothing to sell, but they get glory to compensate."
//
// **An intact farm is sold.** The head of household sits down after the family is home and counts what is left; a land agent
// buys the claim - the land, the house and what the family made of it - and the coin goes into the house with the rest, so the
// ending's formula counts it as coin, multiplied by glory like every real (sim/ending.mjs `finalNumber`). Only the farm: the
// owner asked for the farm to be sold, so the goods and crops still in the house are not priced at the store (the triage's
// option A was not what the owner chose).
//
// **A burned farm has nothing to sell**, and is counted `BURNED_FARM_GLORY` glory instead, the same for every burned farm,
// burned by the Texas army or by Mexican foragers alike. It is chosen so a burned farm moves a family's final number about as
// much as the sale of a typical intact one moves an intact family's (the balance measure in docs/BALANCE.md §17).
//
// **The prices** (`FIC-GONZ-970`, MODELLED on the record `HIST-TEX-750`), at a real to the dollar, as the game's stock pens, its
// wagon and its rifle are priced (`FIC-GONZ-389`, `FIC-GONZ-392`):
//   - Land: a real for every twenty acres of the farm's labor - the ending's own rate for land promised for enlisting (owner,
//     2026-09-16, sim/winter.mjs `ACRES_PER_REAL`), five cents an acre - and half that for the league of grazing land a family
//     with stock holds, as the 1825 law asked half as much an acre for pasture as for farm land (Art. 22). Five cents sits between
//     what a colonist paid the state and the commissioner for a league, "about four cents an acre" (1831), and the fifty cents the
//     Republic asked for its land scrip in December 1836; the family has no title (docs/LAND_GRANTS.md: "No title has been
//     issued"), and the country it is selling in has just been emptied by the war, so a buyer pays near the fees and not the
//     boom prices of 1834 ($1 an acre for wild land, $5 to $15 for the best).
//   - The house, by how much work it is (sim/houses.mjs `HOUSES`), a real for every two and a half spells: a jacal 10, a
//     round-log cabin 16, a hewn-log cabin 26, a dog-run 48. A house raised part way counts the part raised.
//   - Each ten acres cleared, 10 reales - a real an acre, the wild land's price of 1834 for ground the family broke itself - and 5
//     more with its rails round it; a well, 5.
// ceiling: one land agent, one price for every farm in the colonies; a farm's worth by its country, its river and its town is
// the way out if a class ever wants the choice of land to pay at the end.
import { holdingOf, LABOR_ACRES } from './grants.mjs';
import { HOUSES, houseBuilt, pieced } from './houses.mjs';
import { plotLayout } from './houseplot.mjs';
import { clearedPlots } from './fields.mjs';
import { improvementsOf } from './improvements.mjs';
import { interimStandings } from './periods.mjs';
import { SALE_COIN, conditionOf, herdOf, herdWords } from './stock.mjs';

/** Farm land (the labor) sells at a real for this many acres: the ending's rate for promised land (sim/winter.mjs `ACRES_PER_REAL`). */
export const FARM_ACRES_PER_REAL = 20;
/** Grazing land (the league a family with stock holds) at half the farm land's price (the 1825 law, Art. 22). */
export const GRAZING_ACRES_PER_REAL = 40;
/** What a house sells for, by kind: a real for every two and a half spells of its work (sim/houses.mjs `HOUSES`). */
export const HOUSE_REALES = Object.freeze(Object.fromEntries(Object.entries(HOUSES).map(([id, house]) => [id, Math.round(house.work / 2.5)])));
/** Ten cleared acres (a plot), and ten fenced. */
export const CLEARED_PLOT_REALES = 10, FENCED_PLOT_REALES = 5;
/** A well dug. */
export const WELL_REALES = 5;
/**
 * The herd on the range goes with the farm (owner, 2026-10-03: the herd "should be a path to making food and wealth too"; docs/STOCK.md
 * §10, `FIC-GONZ-1135`): each head at what the stock pens pay for it in the flesh it is in at the end (sim/stock.mjs `SALE_COIN`), so a
 * herd kept and minded counts and a herd left on the range in the spring and not found again does not. Put to the owner as a
 * question (docs/STOCK.md §10.7); false counts the herd at nothing, as before.
 */
export const HERD_WITH_FARM = true;
/**
 * The glory a burned farm is counted, where there was nothing left to sell. Chosen by the balance measure (docs/BALANCE.md §17):
 * the glory that moves the median burned family's final number by as much as the median intact family's farm sale moves its own.
 */
export const BURNED_FARM_GLORY = 40;

const HOUSE_NAMES = Object.freeze({ jacal: 'the jacal', 'round-log': 'the round-log cabin', 'hewn-log': 'the hewn-log cabin', 'dog-run': 'the dog-run house' });
const reales = amount => `${amount} ${amount === 1 ? 'real' : 'reales'}`;

/** Whether the family's farm was burned in the spring, by either army. */
export const farmBurned = household => Number.isFinite(household.flight?.burned) || improvementsOf(household).cabin === 'ruined';

/** The houses the family has standing: every one finished, and the one going up at the share of it raised. */
function housesOf(household) {
  if (improvementsOf(household).cabin === 'ruined') return [];
  const out = [];
  for (const house of household.completedHouses || []) {
    const layout = house.pieces ? plotLayout(house.pieces) : house.layout;
    if (HOUSE_REALES[layout]) out.push({ layout, share: 1 });
  }
  const plan = household.house;
  if (plan) {
    const layout = pieced(household) ? plotLayout(plan.pieces) : plan.layout;
    const done = houseBuilt(household) ? 1 : pieced(household) ? 0 : Math.max(0, Math.min(1, (plan.work || 0) / (HOUSES[layout]?.work || 1)));
    // A second house is only counted once it is finished; the first, at the share raised.
    if (HOUSE_REALES[layout] && done > 0 && !(out.length && done < 1) && !(household.completedHouses || []).includes(plan)) out.push({ layout, share: done });
  } else if (improvementsOf(household).cabin === 'sound') out.push({ layout: 'round-log', share: 1, old: true });
  return out;
}

/**
 * What the family's farm comes to at the end: `{ kind: 'sale', items, total, words }` for a farm that stands, `{ kind:
 * 'burned', glory, words }` for one that burned, or `{ kind: 'none' }` for a family nobody is left of to sell it
 * (sim/ending.mjs `nobodyLeft` decides that, and passes `left`).
 */
export function farmReckoning(world, household, { left = true } = {}) {
  if (!household || !left) return { kind: 'none' };
  if (farmBurned(household)) {
    return { kind: 'burned', glory: BURNED_FARM_GLORY, minute: household.flight?.burned ?? null,
      words: `The farm was burned, so there was nothing left to sell. A burned farm counts ${BURNED_FARM_GLORY} glory.` };
  }
  const holding = holdingOf(world, household);
  const labor = Math.min(holding.acres, Math.round(LABOR_ACRES));
  const grazing = Math.max(0, holding.acres - labor);
  const items = [{ what: holding.kind === 'labor' ? `The land, a labor of ${holding.acres} acres` : `The land, a league and a labor of ${holding.acres.toLocaleString('en-US')} acres`,
    reales: Math.round(labor / FARM_ACRES_PER_REAL + grazing / GRAZING_ACRES_PER_REAL) }];
  for (const house of housesOf(household)) {
    const worth = Math.floor(HOUSE_REALES[house.layout] * house.share);
    if (worth > 0) items.push({ what: house.share < 1 ? `${HOUSE_NAMES[house.layout]}, part raised`.replace(/^t/, 'T') : `${HOUSE_NAMES[house.layout]}`.replace(/^t/, 'T'), reales: worth });
  }
  const cleared = clearedPlots(household);
  if (cleared.length) {
    const fenced = cleared.filter(plot => plot.fence === 'sound').length;
    items.push({ what: `${cleared.length * 10} acres of cleared field${fenced === cleared.length ? ', fenced' : fenced ? `, ${fenced * 10} of them fenced` : ''}`, reales: cleared.length * CLEARED_PLOT_REALES + fenced * FENCED_PLOT_REALES });
  }
  if (household.well) items.push({ what: 'The well', reales: WELL_REALES });
  const herd = herdOf(household);
  if (HERD_WITH_FARM && herd.cattle + herd.hogs > 0) {
    const worth = herd.cattle * SALE_COIN.cattle[conditionOf(world, household, 'cattle')] + herd.hogs * SALE_COIN.hogs[conditionOf(world, household, 'hogs')];
    if (worth > 0) items.push({ what: `The stock on the range (${herdWords(household)})`, reales: worth });
  }
  const total = items.reduce((sum, item) => sum + item.reales, 0);
  return { kind: 'sale', items, total, words: `The farm was sold for ${reales(total)}: ${items.map(item => `${item.what.replace(/^The /, 'the ')} ${reales(item.reales)}`).join(', ')}.` };
}

/** Somebody of the family is left free to sell: not every one of it dead or a prisoner (sim/ending.mjs `nobodyLeft`, the same words). */
const someoneLeft = (world, household) => household.members.some(id => { const person = world.entities[id]; return person && !['dead', 'captured'].includes(person.health?.condition); });
/**
 * The farm as the ending and the family's video both reckon it: at the ending proper of a class on the real land of the colonies,
 * and nowhere else - not while a class runs. ceiling: the invented Gonzales country ends at the fight of October 2 with every farm as it was, and is
 * reckoned as it always was (coin, glory, land); a class there that wants the farm counted is the way out. The interim standings
 * of the first two periods count coin and land alone (owner, 2026-09-28).
 */
export function farmAtEnd(world, household) {
  if (!household || world.status !== 'ended' || !world.map?.source || interimStandings(world)) return { kind: 'none' };
  return farmReckoning(world, household, { left: someoneLeft(world, household) });
}

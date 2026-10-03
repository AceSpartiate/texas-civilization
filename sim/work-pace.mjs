// The pace of a family's work: half what it was (owner, 2026-09-29).
//
// "Tasks are taking far too long. Cutting down trees, fishing, building a house, all of those types of tasks are taking too
// long. Reduce the variables need to complete these tasks by 50%" (docs/WOODS_AND_BUILDING.md §6.8, docs/BALANCE.md §15).
//
// **One place.** Every tick of work a family's work asks for - a `work` step and a tree felled (sim/chores.mjs `advanceChore`,
// the only two places a step's work is set) - is multiplied by `WORK_PACE` after the person's own skill, strength, the water and
// the baby have made it what it is. Nothing else moves: the tables of work (`SPELL_TICKS`, the houses' spells, the clearings'
// spells, `FELL_TICKS`, `FENCE_TICKS`, `WELL_TICKS`, `CARRETA_TICKS`, the furniture's, the forage's) keep their numbers, which
// is why a class saved in the middle of a house or a clearing opens right: its spells are the same spells, each one half as long
// (docs/WOODS_AND_BUILDING.md §7). What a work makes, the logs it takes, the helpers' diminishing returns (sim/hands.mjs), the
// walking and the roads are all as they were: only the time at the work itself is halved.
//
// **Which works** (`familyWork`): everything a family does at home, on its own land, at the timber, the water or the shore, or on
// a neighbour's house - felling, fetching logs, the house and the raising, clearing, fencing, the lane, the well, surveying,
// planting and the harvest, hunting, practice at the mark, the four gathering works, the stock, furniture, the carreta and mending
// the hoe. **Not**: the time at a counter in town (an errand's `travel: 'town'`), the war's and the winter's choices (enlisting,
// the garrison, the vote), the camp's work, the road's and the flight's (the Scrape keeps its own timings), nursing the sick,
// and a child's works and play (they make nothing, and a child's day is sim/child-day.mjs's).
//
// Invented (`FIC-GONZ-908`).
// ceiling: one factor for every family work. If a class finds one work now too quick (the house against the war's first news,
// say), that work's own table is the place to lengthen it again - not this number.

/** What every tick of a family's work costs now, of what it did before 2026-09-29. */
export const WORK_PACE = 0.5;

/** Minutes of the calendar in a tick at the farming pace (sim/clock.mjs `TICK_MINUTES`), restated so this file imports nothing. */
const TICK_MINUTES = 20;

/**
 * Whether this chore is a family's work, whose ticks `WORK_PACE` halves: done where it lives or on a neighbour's land (`where`
 * home or neighbour; the road's and the camp's are elsewhere), not the war's or the winter's, not the flight's, not a child's,
 * not nursing, and not an errand whose work is time at a counter in town.
 */
export function familyWork(chore) {
  if (!chore || !['home', 'neighbour'].includes(chore.where)) return false;
  // `grown`: a work a child may take up that is a grown person's too (the herder's, sim/chores.mjs `look-to-stock`), at the family's pace.
  if (chore.winter || chore.war || chore.flight || chore.road || chore.camp || (chore.child && !chore.grown) || chore.nurses) return false;
  return !(chore.steps || []).some(step => step.travel === 'town');
}

/** The pace a step of this chore's work goes at: `WORK_PACE` for a family's work, whole for anything else. */
/**
 * The first house quicker again (owner, 2026-10-02: "it takes too long to build the house at the start of the game";
 * docs/WOODS_AND_BUILDING.md §6.11, `FIC-GONZ-1090`). Two works of their own, on top of `WORK_PACE`, as the ceiling above asks -
 * "that work's own table is the place" - kept as factors rather than new counts for the reason `WORK_PACE` is one: a house's spells
 * and a piece's progress are saved, and a class saved in the middle of its walls opens with them exactly as far up.
 *
 * - `HOUSE_PACE`: every spell on a house, the family's own and a neighbour's raising, half again as quick - a spell is a quarter of an
 *   hour of the calendar. A step is still at least the tick it is begun in, so a lone builder on the two-handed courses (a third of a
 *   spell a step, sim/houseplot.mjs) is held by the tick, not the spell: the house-raising still helps.
 * - `FELL_PACE`: every tree felled and dragged in, and the felling and loading of a wagon load fetched from off the land, half again as
 *   quick. Felling was the larger share of the first house: a family's one felling axe fells the fifty logs before or between the
 *   courses (docs/TOWNS.md §4c), and nothing else of the house can go faster than its logs come in.
 *
 * Measured (scripts/house-time-measure.mjs, three classes of fifteen): a pair - one felling, one building, both on auto - from 23 real
 * minutes at Study to about 15; every grown person of the family on it, from 16 to about 9. ceiling: one factor each for the house and
 * the felling; a class that finds felling for furniture or the carreta too quick lengthens those works' own tables, not this.
 */
export const HOUSE_PACE = 0.5;
export const FELL_PACE = 0.5;
/** Whether this chore is felling: a tree at a time on the family's land, or a wagon load fetched from the nearest timber off it. */
const felling = chore => Boolean(chore?.fells || chore?.fetchesLogs);
/** Whether this chore is work on a house: the family's own, or helping raise a neighbour's walls. */
const raising = chore => Boolean(chore?.house || chore?.helps);
export const workPaceOf = chore => (familyWork(chore) ? WORK_PACE * (raising(chore) ? HOUSE_PACE : 1) * (felling(chore) ? FELL_PACE : 1) : 1);
/** Hours of the calendar that `ticks` of an ordinary hand's work on a house take now (the chooser, the plot, a neighbour's hours). */
export const houseHours = ticks => workHours(ticks) * HOUSE_PACE;

/** Hours of the calendar that `ticks` of an ordinary hand's family work take now. */
export const workHours = ticks => (ticks * WORK_PACE * TICK_MINUTES) / 60;

/**
 * Hours in words: under an hour to ten minutes ("20 minutes", "half an hour", "40 minutes"), from an hour to the half hour
 * ("1 hour", "1.5 hours", "20 hours"). Never nothing.
 */
export function hoursSaid(hours) {
  if (hours < 0.95) {
    const minutes = Math.max(10, Math.round((hours * 60) / 10) * 10);
    return minutes === 30 ? 'half an hour' : `${minutes} minutes`;
  }
  const shown = Math.round(hours * 2) / 2;
  return `${shown} ${shown === 1 ? 'hour' : 'hours'}`;
}

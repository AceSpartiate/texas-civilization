// The family's one wood pile (owner, 2026-09-28, docs/WOODS_AND_BUILDING.md §6.7): "Any task that pulls from wood should be able
// to pull from the universal wood pile."
//
// Every log a family has is on one pile at the house (`household.logs = { wall, sill, poor }`, sim/felling.mjs). Felling puts
// them there straight away - carrying them in is part of felling - and every work that uses wood takes them from there: the house
// (sim/houseplot.mjs), the carreta (sim/carreta.mjs), a piece of furniture and the rails of a fence (here). Nobody carries logs by
// hand as work of its own any more.
//
// **What the house still wants comes first.** The house takes the logs its stage wants, of the kind it wants. Everything else
// takes only what the pile can **spare** beyond what the house still wants - the poorest first - so a fence or a bench never
// leaves the walls short. The carreta is the one exception, as it was built: three logs of any kind, poorest first.
//
// **Enough.** A feller on auto stops when the pile holds what the house still wants and `WOOD_MARGIN` more, and takes the axe up
// again when the pile falls below it (sim/auto.mjs). Every number here is invented (`FIC-GONZ-903`).
// ceiling: the margin is one number for every family: enough for a carreta, a fence and a piece of furniture after the house.
// A family that means to fence every plot from the pile fells by hand past it; a margin that grew with the plots staked is the
// way out.
import { fenceWork, FENCE_TICKS } from './fields.mjs';
import { houseOf, pieced } from './houses.mjs';
import { logsShort, planPieces, plotNeeds } from './houseplot.mjs';
import { improvementsOf } from './improvements.mjs';
import { countsTrees, woodsRule } from './woods.mjs';

/** Logs kept on the pile past what the house still wants, before a feller on auto calls it enough. */
export const WOOD_MARGIN = 10;
/** Logs a fence of ten acres takes from the pile, split into rails at the house (`FIC-GONZ-904`). */
export const FENCE_LOGS = 6;
/** Logs a piece of furniture takes from the pile: one small log, split and worked at home (`FIC-GONZ-904`). */
export const FURNITURE_LOGS = 1;
/** The order logs are taken for anything but the house: the poorest first. */
const SPARE_ORDER = Object.freeze(['poor', 'sill', 'wall']);

/** Every log on the pile, of every kind. */
export const logsOnPile = household => SPARE_ORDER.reduce((sum, use) => sum + (household?.logs?.[use] ?? 0), 0);

/** Whether this class keeps a wood pile at all: a class that counts its trees one by one (sim/woods.mjs). */
export const keepsPile = world => countsTrees(woodsRule(world));

/**
 * How many logs the family's house still wants, all told: the stages of its plan not yet begun (sim/houseplot.mjs `plotNeeds`).
 * A family that has not chosen its house yet is counted for the smallest log house, a round-log cabin: what a feller would be
 * felling for. A house built, a house of the four whole layouts (which take no logs from a pile), or no pile at all: none.
 */
export function houseStillWants(world, household) {
  const needs = houseNeeds(world, household);
  return needs.wall + needs.sill + needs.any;
}
/** The same, by kind - `{ wall, sill, any }` - as the house takes them (sim/houseplot.mjs `logsShort`). */
export function houseNeeds(world, household) {
  const none = { wall: 0, sill: 0, any: 0 };
  if (!keepsPile(world)) return none;
  const plan = houseOf(household);
  if (pieced(household)) return { ...none, ...plotNeeds(plan.pieces).logs };
  if (!plan && improvementsOf(household).cabin !== 'sound') return { ...none, ...plotNeeds(planPieces('round-log')).logs };
  return none;
}
/**
 * Whether the pile is short of the sound logs - wall or sill timber - the house still wants. Poor logs do only where any log
 * will do, so a pile of them is no pile for walls (found 2026-09-28: a feller on auto stopped at seventeen logs, fifteen of
 * them poor, and the roof waited for six sound ones for ever).
 */
export function shortOfSound(world, household) {
  const needs = houseNeeds(world, household);
  return Boolean(logsShort(household.logs, { wall: needs.wall, sill: needs.sill }));
}

/** Logs the pile can give to anything but the house: what is on it beyond what the house still wants. */
export const spareLogs = (world, household) => Math.max(0, logsOnPile(household) - houseStillWants(world, household));

/**
 * Why a feller on auto has felled enough, in the words the row shows, or null while the pile wants more: what the house still
 * wants and `WOOD_MARGIN` more.
 */
export function pileFull(world, household) {
  const needs = houseNeeds(world, household);
  const house = needs.wall + needs.sill + needs.any, have = logsOnPile(household);
  // Enough of every kind the house takes - sound logs for its walls, sills and roof, any log for a shed or a porch - and the margin.
  if (logsShort(household.logs, needs) || have < house + WOOD_MARGIN) return null;
  return house
    ? `The log pile has enough: ${have} logs at the house, and the house still wants ${house}.`
    : `The log pile has enough: ${have} logs at the house, and the house wants no more.`;
}

/** Take `n` spare logs off the pile, the poorest first. False, and nothing taken, when the pile cannot spare them. */
export function takeSpare(world, household, n) {
  if (spareLogs(world, household) < n) return false;
  household.logs = { wall: 0, sill: 0, poor: 0, ...household.logs };
  let left = n;
  for (const use of SPARE_ORDER) {
    const taken = Math.min(left, household.logs[use]);
    household.logs[use] -= taken; left -= taken;
  }
  return true;
}

/**
 * How this plot would be fenced (sim/fields.mjs `fenceWork`), with the pile: where the rails would otherwise be carried from far
 * timber, they are split from `FENCE_LOGS` spare logs at the house instead, in the time rails at hand take. Rails at hand and
 * mesquite on the spot are quicker than the pile, and cost it nothing, so they are left as the country gives them.
 */
export function fenceBy(world, household, plot) {
  const country = fenceWork(world, household, plot);
  if (country.how !== 'hauled' || !keepsPile(world) || spareLogs(world, household) < FENCE_LOGS) return country;
  return { ticks: FENCE_TICKS, how: 'pile', miles: 0, logs: FENCE_LOGS };
}

/** Whether a piece of furniture would be made from the pile at home, rather than a small tree fetched from the timber. */
export const furnitureFromPile = (world, household) => keepsPile(world) && spareLogs(world, household) >= FURNITURE_LOGS;

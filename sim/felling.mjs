// Felling the family's own trees and hauling the logs home: docs/WOODS_AND_BUILDING.md §6.1, build step 4.
//
// The owner: "players should have to cut down trees to build their houses." A student picks one of the family, *Fell
// trees*, taps a place in timber on the family's own land, is told what stands there, and sends them with the felling
// axe. They fell the trees within a few rods of the place one at a time - straight wall timber first, then timber that
// will not rot on the ground for sills, then the rest - until none is left in reach or they are called in. Every tree is
// one real tree of the woods (sim/woods.mjs): it becomes a stump, and its logs lie where it fell until somebody hauls
// them to the house, one on a person's shoulder or a load behind the ox. What is at the house is the family's log pile,
// which the house plot will build from (step 5).
//
// Only a class whose woods come from the land (`countsTrees`: the biomes, or the 2016 grid) counts its trees one by one, so only such a class
// fells them. Settlers felled their own trees for their houses (`HIST-TEX-017`); every number here is invented
// (`FIC-GONZ-032`): how long a tree takes, how many logs it gives, how far round the place a person fells, what a person
// or the ox drags.
// ceiling: a tree is felled in one to three ticks, not the hour or more it took, because a class lasts under two days
// (docs/WOODS_AND_BUILDING.md, owner 2026-09-15: real counts, compressed time). Undo it if the class clock covers weeks.
// ceiling: the ox is not drawn going out with the hauler, and is not lent while hauling; it only has to be at home and
// free when a load is taken up. Lending it for the trip, like the wagon on a journey, is the way out.
// ceiling: felling a patch does not make it open ground for the going or for clearing; clearing a timber plot does not
// fell its trees into logs. Joining them is the way out when the house plot needs more logs than a family can fell.
import { record } from './events.mjs';
import { PLOT_SIDE } from './fields.mjs';
import { landAround, onRealLand } from './ground.mjs';
import { holdingOf } from './grants.mjs';
import { choosing } from './homesite.mjs';
import { whereFromHouse } from './survey.mjs';
import { KINDS, countsTrees, parseTreeId, patchAt, standOf, treeById, treesIn, woodsRule } from './woods.mjs';

/** How far round the chosen place a person fells, in miles: about 260 feet, some five acres. */
export const FELL_REACH = 0.05;
/** Ticks of an ordinary hand's work to fell and trim a tree, by its size, before its kind's own effort. */
export const FELL_TICKS = Object.freeze({ pole: 1, log: 2, large: 3 });
/** How many logs one trip brings to the house: on a person's shoulder, or dragged behind the ox. */
export const DRAG_LOGS = Object.freeze({ hand: 1, ox: 6 });
/** Which logs are felled first: those for walls, then sills, then the rest. */
export const USE_ORDER = Object.freeze(['wall', 'sill', 'poor']);

/** The woods as this class reads them: the biomes, or the grid a class of the week of 2026-09-15 was made on (sim/woods.mjs). */
const options = world => ({ rule: woodsRule(world), nearCreek: landAround().nearCreek });
const felledOf = world => world.woods?.felled || {};

/** Every tree still standing within reach of a place that would give a log, nearest first. */
export function standingTrees(world, point, reach = FELL_REACH) {
  const felled = felledOf(world);
  return (treesIn({ minX: point.x - reach, minY: point.y - reach, maxX: point.x + reach, maxY: point.y + reach }, options(world)) || [])
    .filter(tree => tree.logs > 0 && !felled[tree.id] && Math.hypot(tree.x - point.x, tree.y - point.y) <= reach)
    .sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y));
}

/** Why nobody in this family can fell at this place, or null. */
export function fellRefusal(world, household, point) {
  if (!household) return 'No family to fell for.';
  if (!countsTrees(woodsRule(world))) return 'The trees of this country are not counted one by one.';
  if (world.status === 'lobby') return 'The family fells its trees once the class has begun.';
  if (choosing(household)) return 'Choose where the house will stand first.';
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return 'Choose a place on your land to fell.';
  const bounds = holdingOf(world, household).bounds;
  if (point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY) return 'That is not your land.';
  if (household.tools?.axe === undefined) return 'Felling wants an axe, and there is none in the house.';
  if (onRealLand(world)) {
    const height = landAround().heightAt(point.x, point.y);
    if (!Number.isFinite(height) || height < 0.3) return 'That is in the water.';
  }
  if (!standingTrees(world, point).length) return 'No timber stands there to fell.';
  return null;
}

/** What felling here would give, in the family's words, or why it cannot. */
export function fellFacts(world, household, point) {
  const why = fellRefusal(world, household, point);
  if (why) return { can: false, why };
  const trees = standingTrees(world, point);
  const logs = trees.reduce((sum, tree) => sum + tree.logs, 0);
  const kinds = [...new Set(trees.map(tree => KINDS[tree.kind].name))].slice(0, 3);
  const stand = standOf(patchAt(point, options(world)).stand, woodsRule(world)).name || 'timber';
  const wall = trees.filter(tree => tree.use === 'wall').reduce((sum, tree) => sum + tree.logs, 0);
  const sound = wall + trees.filter(tree => tree.use === 'sill').reduce((sum, tree) => sum + tree.logs, 0);
  return {
    can: true, trees: trees.length, logs, wall, sound,
    words: `${stand.charAt(0).toUpperCase()}${stand.slice(1)} ${whereFromHouse(world, household, point)}: ${trees.length} ${trees.length === 1 ? 'tree' : 'trees'} in reach, ${logs} logs, ${wall} of them straight enough for walls. ${kinds.join(', ')}.`,
  };
}

/** The next tree this person fells: wall timber first, then sill, then the rest, nearest them; never one another is felling. */
export function nextTree(world, household, entity) {
  const place = entity.chore?.ground;
  if (!place) return null;
  const taken = new Set(Object.values(world.entities).filter(other => other !== entity && other.chore?.felling).map(other => other.chore.felling));
  const here = entity.location;
  return standingTrees(world, place).filter(tree => !taken.has(tree.id))
    .sort((a, b) => USE_ORDER.indexOf(a.use) - USE_ORDER.indexOf(b.use) || Math.hypot(a.x - here.x, a.y - here.y) - Math.hypot(b.x - here.x, b.y - here.y))[0] || null;
}

/** How many ticks this tree takes an ordinary hand, before their skill and strength. */
export const fellTicks = tree => Math.max(1, Math.round(FELL_TICKS[tree.size] * KINDS[tree.kind].fell));

/** The tree comes down: a stump, and its logs lying where it fell. False if somebody felled it first. */
export function fellTree(world, household, entity, treeId) {
  const tree = treeById(treeId, options(world));
  if (!tree || felledOf(world)[treeId]) return false;
  world.woods ||= { felled: {}, revision: 0 };
  world.woods.felled[treeId] = { by: household.id, minute: world.minute, kind: tree.kind, use: tree.use, logs: tree.logs, left: tree.logs };
  world.woods.revision += 1;
  const state = entity.chore;
  state.trees = (state.trees || 0) + 1;
  state.logs = (state.logs || 0) + tree.logs;
  return true;
}

/** Said once, when the felling is done: how many trees and logs, and where they lie. */
export function recordFelling(world, household, entity) {
  const state = entity.chore;
  if (!state?.trees) return;
  record(world, 'improvement', {
    actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-032',
    text: `${entity.name} felled ${state.trees} ${state.trees === 1 ? 'tree' : 'trees'} ${whereFromHouse(world, household, state.ground)}. ${state.logs} logs lie where they fell, to be hauled to the house.`,
  });
}

/** Where a felled tree lay, from its id: the tree's own spot. */
export function felledAt(treeId, world) {
  const tree = treeById(treeId, options(world));
  return tree ? { x: tree.x, y: tree.y } : null;
}

/** This family's logs still lying where they fell, nearest the house first. */
export function logsLying(world, household) {
  const home = world.map.sites[household.homeSiteId];
  return Object.entries(felledOf(world)).filter(([, entry]) => entry.by === household.id && entry.left > 0)
    .map(([id, entry]) => ({ id, ...entry, ...felledAt(id, world) }))
    .sort((a, b) => Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y));
}

/**
 * How many logs this family still has lying out, without placing or sorting them. `logsLying` finds each felled tree's spot
 * again from its id and sorts them by distance, which is what taking a load up needs; the work list and the land line only
 * ask whether any lie out and how many, on every person of every family on every tick, and the class's felled trees run to
 * a thousand by the spring (docs/PERFORMANCE_SERVER.md).
 */
export function logsLeftOut(world, household) {
  let left = 0;
  for (const entry of Object.values(felledOf(world))) if (entry.by === household.id && entry.left > 0) left += entry.left;
  return left;
}

/** Whether the family's ox is at home and free to drag a load. */
export function oxFree(world, household) {
  return household.property.some(id => {
    const beast = world.entities[id];
    return beast?.species === 'ox' && beast.location?.siteId === household.homeSiteId && !beast.travel && !beast.borrowedBy && beast.condition !== 'lost';
  });
}

/**
 * Take up a load where logs lie: as many as the ox or a shoulder brings, from the nearest felled tree and any others lying
 * within reach of it. Returns the load by use (`{ n, wall, sill, poor }`), or null if none is left.
 */
export function takeUpLogs(world, household, entity) {
  const lying = logsLying(world, household);
  if (!lying.length) return null;
  const first = lying[0];
  let room = oxFree(world, household) ? DRAG_LOGS.ox : DRAG_LOGS.hand;
  const load = { n: 0, wall: 0, sill: 0, poor: 0 };
  for (const entry of lying.filter(each => Math.hypot(each.x - first.x, each.y - first.y) <= FELL_REACH)) {
    const taken = Math.min(entry.left, room);
    if (!taken) break;
    world.woods.felled[entry.id].left -= taken;
    load[entry.use] += taken; load.n += taken; room -= taken;
  }
  world.woods.revision += 1;
  return load;
}

/** A load reaches the house: onto the log pile. */
export function stackLogs(household, load) {
  household.logs = { wall: 0, sill: 0, poor: 0, ...household.logs };
  for (const use of USE_ORDER) household.logs[use] += load[use] || 0;
}

/** The family's log pile and what still lies out, for its own land line. Absent when there is neither. */
export function logsProjection(world, household, lying = logsLeftOut(world, household)) {
  const pile = household.logs;
  return pile || lying ? { logs: { ...(pile || { wall: 0, sill: 0, poor: 0 }), lying } } : {};
}

/** The felled trees and log piles are well formed. */
export function fellingInvalid(world) {
  if (world.woods !== undefined) {
    if (!world.woods || typeof world.woods.felled !== 'object' || !Number.isInteger(world.woods.revision) || world.woods.revision < 0) return 'Invalid woods';
    for (const [id, entry] of Object.entries(world.woods.felled)) {
      if (!parseTreeId(id)) return 'A felled tree that is no tree';
      if (!world.households[entry?.by]) return 'A tree felled by nobody';
      if (!KINDS[entry.kind] || !USE_ORDER.includes(entry.use) || !Number.isInteger(entry.logs) || !Number.isInteger(entry.left) || entry.left < 0 || entry.left > entry.logs) return 'Invalid felled tree';
    }
  }
  for (const household of Object.values(world.households)) {
    if (household.logs === undefined) continue;
    if (!household.logs || USE_ORDER.some(use => !Number.isInteger(household.logs[use]) || household.logs[use] < 0)) return 'Invalid log pile';
  }
  return null;
}

/**
 * Every tree standing on a plot brought down at once, with its logs left lying where it fell.
 *
 * Clearing ten acres of timber is felling the trees on them (owner, 2026-09-17: "instead of having survey just magically
 * clearing trees, there should be a way to cut those trees down, and use those to build with"). The trees are the woods' own
 * (sim/woods.mjs), marked felled exactly as the axe marks them one by one, so the map loses them, the logs can be hauled and
 * built with, and nothing is made that the land did not hold. Returns what came down.
 */
export function fellStanding(world, household, plot) {
  // Only a class whose woods come from the land has trees to bring down; on the invented country the ground is cleared as it
  // always was (sim/woods.mjs `woodsRule`).
  if (!countsTrees(woodsRule(world))) return { trees: 0, logs: 0 };
  const half = PLOT_SIDE / 2;
  // The corners of the plot as well as its middle: `standingTrees` reaches a radius, and a plot is a square.
  const reach = Math.hypot(half, half);
  const trees = standingTrees(world, plot, reach).filter(tree => Math.abs(tree.x - plot.x) <= half && Math.abs(tree.y - plot.y) <= half);
  if (!trees.length) return { trees: 0, logs: 0 };
  world.woods ||= { felled: {}, revision: 0 };
  let logs = 0;
  for (const tree of trees) {
    world.woods.felled[tree.id] = { by: household.id, minute: world.minute, kind: tree.kind, use: tree.use, logs: tree.logs, left: tree.logs };
    logs += tree.logs;
  }
  world.woods.revision += 1;
  return { trees: trees.length, logs };
}

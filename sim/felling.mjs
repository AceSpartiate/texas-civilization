// Felling the family's own trees, and their logs onto the pile at the house: docs/WOODS_AND_BUILDING.md §6.1, build step 4,
// and §6.7 (the owner, 2026-09-28).
//
// The owner: "players should have to cut down trees to build their houses." A student picks one of the family and presses
// *Fell trees*. They go out with the felling axe to the nearest timber on the family's own land (`fellingGround`) - or to a
// place the student chose, which a family nobody plays still does - and fell the trees within a few rods of it one at a time:
// straight wall timber first, then timber that will not rot on the ground for sills, then the rest, until none is left in
// reach or they are called in. Every tree is one real tree of the woods (sim/woods.mjs): it becomes a stump.
//
// **Amended by the owner, 2026-09-28**: "Why do we need multiple action buttons for moving logs? That should be consolidated and
// an automatic part of felling trees. Any task that pulls from wood should be able to pull from the universal wood pile." So a
// felled tree's logs go **straight onto the family's one wood pile** at the house (`household.logs`, sim/woodpile.mjs), and
// dragging them in is part of felling it (`CARRY_TICKS`, folded into the tree's own time). There is no hauling order any more:
// `haul-logs` is kept only for a class saved with somebody in the middle of it, and logs a class saved before lay out are
// folded onto the pile at the save's door (`foldLyingLogs`). A family whose land has no timber at all fells at the nearest
// timber off it with the ox and wagon (`fetch-logs` in sim/chores.mjs, begun by *Fell trees*).
//
// Only a class whose woods come from the land (`countsTrees`: the biomes, or the 2016 grid) counts its trees one by one, so only such a class
// fells them. Settlers felled their own trees for their houses (`HIST-TEX-017`); every number here is invented
// (`FIC-GONZ-032`, `FIC-GONZ-902`): how long a tree takes, how many logs it gives, how far round the place a person fells, how
// long its logs take to drag in.
// ceiling: a tree is felled in one to three ticks, not the hour or more it took, because a class lasts under two days
// (docs/WOODS_AND_BUILDING.md, owner 2026-09-15: real counts, compressed time). Undo it if the class clock covers weeks.
// ceiling: dragging a tree's logs to the pile is one tick of the feller's own, however far the tree stands from the house and
// whether or not the ox is at home. The walk out to the timber is still walked; a drag that grew with the distance, or went
// quicker behind the ox, is the way out if near timber and far timber should differ more than the walk makes them.
// ceiling: felling a patch does not make it open ground for the going or for clearing. Joining them is the way out when the
// house plot needs more logs than a family can fell.
import { record } from './events.mjs';
import { userOf } from './keeping.mjs';
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
/** How many logs one trip brings to the house: on a person's shoulder, or dragged behind the ox. Read only by the retired hauling. */
export const DRAG_LOGS = Object.freeze({ hand: 1, ox: 6 });
/** Ticks of an ordinary hand's work to drag a felled tree's logs onto the pile at the house, part of felling it (`FIC-GONZ-902`). */
export const CARRY_TICKS = 1;
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

/** How many ticks this tree takes an ordinary hand to fell, before their skill and strength. */
export const fellTicks = tree => Math.max(1, Math.round(FELL_TICKS[tree.size] * KINDS[tree.kind].fell));
/** And to fell it and drag its logs onto the pile, which is all one work since 2026-09-28 (`CARRY_TICKS`). */
export const fellAndCarryTicks = tree => fellTicks(tree) + CARRY_TICKS;

/** The tree comes down: a stump, and its logs on the family's pile at the house. False if somebody felled it first. */
export function fellTree(world, household, entity, treeId) {
  const tree = treeById(treeId, options(world));
  if (!tree || felledOf(world)[treeId]) return false;
  world.woods ||= { felled: {}, revision: 0 };
  // Nothing is left lying (owner, 2026-09-28): the logs are dragged in as part of the felling, and go onto the one pile.
  world.woods.felled[treeId] = { by: household.id, minute: world.minute, kind: tree.kind, use: tree.use, logs: tree.logs, left: 0 };
  world.woods.revision += 1;
  stackLogs(household, { [tree.use]: tree.logs });
  const state = entity.chore;
  state.trees = (state.trees || 0) + 1;
  state.logs = (state.logs || 0) + tree.logs;
  return true;
}

/** Said once, when the felling is done: how many trees and logs, and where they came from. */
export function recordFelling(world, household, entity) {
  const state = entity.chore;
  if (!state?.trees) return;
  record(world, 'improvement', {
    actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-032',
    text: `${entity.name} felled ${state.trees} ${state.trees === 1 ? 'tree' : 'trees'} ${whereFromHouse(world, household, state.ground)}. ${state.logs} ${state.logs === 1 ? 'log went' : 'logs went'} onto the pile at the house.`,
  });
}

/**
 * Where a feller goes when nobody chose a place: the nearest standing tree on the family's own land that gives a sound log - wall
 * or sill timber - and the nearest of any kind where the land has none (owner, 2026-09-28: "I should be able to set one person
 * on felling trees ... set each to auto, and eventually get a house"). Looked for in growing circles round the house to the edge
 * of the holding, a quarter mile of woods at a time, and remembered until that tree is felled: trees are only ever taken away,
 * so the nearest cannot change until it is down, and land with none to fell never has any. Null where nothing stands to fell;
 * `{ x, y, sound }` otherwise, `sound` false when the land has only poor timber left.
 */
const RINGS = Object.freeze([0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4]);
const groundKept = new WeakMap();
export function fellingGround(world, household) {
  if (!household || !countsTrees(woodsRule(world)) || choosing(household)) return null;
  const home = world.map.sites[household.homeSiteId];
  const bounds = home && holdingOf(world, household)?.bounds;
  if (!bounds) return null;
  if (!groundKept.has(world)) groundKept.set(world, new Map());
  const kept = groundKept.get(world), key = `${household.id}|${home.x}|${home.y}`;
  const was = kept.get(key);
  const place = tree => ({ x: tree.x, y: tree.y, sound: tree.use === 'wall' || tree.use === 'sill' });
  if (was && (was.none || !felledOf(world)[was.id])) return was.none ? null : place(was);
  const found = nearestToFell(world, household, home, bounds);
  kept.set(key, found || { none: true });
  return found && place(found);
}
function nearestToFell(world, household, home, bounds) {
  const felled = felledOf(world), opts = options(world);
  const sound = tree => (tree.use === 'wall' || tree.use === 'sill');
  // Asked of the land only - never of the axe or the class's state, which change: what is found here is remembered.
  const land = onRealLand(world) ? landAround() : null;
  const wet = tree => Boolean(land) && !(land.heightAt(tree.x, tree.y) >= 0.3);
  let poor = null;
  for (const ring of RINGS) {
    const box = { minX: Math.max(bounds.minX, home.x - ring), maxX: Math.min(bounds.maxX, home.x + ring), minY: Math.max(bounds.minY, home.y - ring), maxY: Math.min(bounds.maxY, home.y + ring) };
    const found = [];
    for (let x = box.minX; x < box.maxX; x += 0.25) for (let y = box.minY; y < box.maxY; y += 0.25) {
      for (const tree of treesIn({ minX: x, minY: y, maxX: Math.min(box.maxX, x + 0.25), maxY: Math.min(box.maxY, y + 0.25) }, opts) || []) {
        if (tree.logs > 0 && !felled[tree.id] && Math.hypot(tree.x - home.x, tree.y - home.y) <= ring) found.push(tree);
      }
    }
    found.sort((a, b) => (sound(a) ? 0 : 1) - (sound(b) ? 0 : 1) || Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y));
    for (const tree of found) {
      // Not a tree standing in the water, where nobody is sent to fell (`fellRefusal`).
      if (wet(tree)) continue;
      if (sound(tree)) return tree;
      poor ||= tree;
      break;
    }
    // The whole holding looked over: nothing sound anywhere, and the nearest of anything else.
    if (box.minX <= bounds.minX && box.maxX >= bounds.maxX && box.minY <= bounds.minY && box.maxY >= bounds.maxY) break;
  }
  return poor;
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

/**
 * Whether the family's ox is at home and free to drag a load: for `entity`, free of anybody else's use (sim/keeping.mjs
 * `userOf`, owner 2026-09-24) - a hauler already holding it is not refused their own ox.
 */
export function oxFree(world, household, entity = null) {
  if (userOf(world, household, 'ox', entity)) return false;
  return household.property.some(id => {
    const beast = world.entities[id];
    return beast?.species === 'ox' && beast.location?.siteId === household.homeSiteId && !beast.travel && (!beast.borrowedBy || beast.borrowedBy === entity?.id) && beast.condition !== 'lost';
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
  // Behind the ox when it is free for this hauler, and then it is theirs until the hauling is done (sim/keeping.mjs); a load
  // on the shoulder otherwise.
  const ox = oxFree(world, household, entity);
  if (ox && entity?.chore && !entity.chore.with?.includes('ox')) entity.chore.with = [...(entity.chore.with || []), 'ox'];
  let room = ox ? DRAG_LOGS.ox : DRAG_LOGS.hand;
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
 * Every tree standing on a plot brought down at once, its logs onto the family's pile at the house.
 *
 * Clearing ten acres of timber is felling the trees on them (owner, 2026-09-17: "instead of having survey just magically
 * clearing trees, there should be a way to cut those trees down, and use those to build with"). The trees are the woods' own
 * (sim/woods.mjs), marked felled exactly as the axe marks them one by one, so the map loses them, the logs are built with, and
 * nothing is made that the land did not hold. Since 2026-09-28 the logs go onto the one pile, as felling's do: nobody hauls
 * them in as work of its own (owner: "Any task that pulls from wood should be able to pull from the universal wood pile").
 * Returns what came down.
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
    world.woods.felled[tree.id] = { by: household.id, minute: world.minute, kind: tree.kind, use: tree.use, logs: tree.logs, left: 0 };
    stackLogs(household, { [tree.use]: tree.logs });
    logs += tree.logs;
  }
  world.woods.revision += 1;
  return { trees: trees.length, logs };
}

/**
 * A class saved before 2026-09-28 may have logs lying where their trees fell, waiting to be hauled. Called once at the save's
 * door (server/storage.mjs `readSave`): every log still lying goes onto its family's pile, by its kind, and nothing lies out any
 * more - exactly what felling does now. Somebody saved in the middle of a haul keeps the load in their arms and stacks it when
 * they reach the house (`haul-logs`, kept for them). No save version moved: the pile is a field every such class already had,
 * and nothing is read another way. Returns how many logs were folded in.
 */
export function foldLyingLogs(world) {
  let folded = 0;
  for (const entry of Object.values(world?.woods?.felled || {})) {
    const household = world.households?.[entry?.by];
    if (!household || !(entry.left > 0) || !USE_ORDER.includes(entry.use)) continue;
    stackLogs(household, { [entry.use]: entry.left });
    folded += entry.left;
    entry.left = 0;
  }
  if (folded) world.woods.revision += 1;
  return folded;
}

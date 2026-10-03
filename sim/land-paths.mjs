// Going about the family's own land round its trees, the ways a family treads to what it places, and the yard it fences.
//
// The owner, 2026-10-02: "it's weird seeing characters walk over trees. paths should be cut to facilitate quick, reasonable
// movement on a families land. there should be an option to fence in a yard too. if there's a fenced in yard then kids on
// auto play will not be disobedient as often." (docs/LAND_GRANTS.md §10, docs/WOODS_AND_BUILDING.md §6.12, docs/CHILDREN.md §14.)
//
// Three things live here:
//
//   1. **The way across the land** (`landRoute`, `walkLand`). Somebody sent about the family's own land used to be moved in a
//      straight line, a tick at a time, over whatever stood between - and the woods are drawn tree by tree from the same grid the
//      server counts (sim/woods.mjs), so a student watched them walk through trunks and over crowns. Now the server finds a way on
//      a grid of cells a hundred-and-twenty-eighth of a mile a side (about 41 feet, two of the woods' tree cells), round every
//      standing tree, the water and the houses as the map draws them, cheaper on a path, and the person walks it. The few points
//      walked in a tick go to the page (`walked`), which draws the person along exactly those, so the page never cuts a corner
//      the server did not. A tree is not a wall: where the only way to a place is through the timber - out to fell, or to hunt -
//      the way goes between the trunks, as close to the edge as it can (`TREE_COST`).
//   2. **Paths** (`household.paths`), **all trodden on their own** (owner, 2026-10-03: "i don't want players to have to
//      micromanage the paths that we added earlier. this should be an automated thing based on where they put things." - chosen
//      by multiple choice, "All automatic"). Once the house stands the family has a way from the door to everything it places:
//      running water near enough to carry, each cleared plot, the yard's gate once the yard is fenced, the woodpile and the
//      ground the herd is brought in to at night - laid round the trees, nobody sent and nothing felled for them
//      (`advanceLandPaths`, `troddenTo`). A new way appears when the thing is placed, a way is laid again when where it begins
//      changes (out through the gate once the yard is fenced), and a way to something that is gone goes with it. *Cut a path*,
//      the order of 2026-10-02 that felled the trees along a straight line, is gone (`pathOrderRefusal`); a path cut in a class
//      saved before stays, and the stakes of one left part cut come up (`leaveOffCutting`). Walking a path is quicker than the
//      open country and much quicker than timber or brush (`PATH_PACE`), and the way across the land prefers one.
//   3. **The yard** (`household.yard`): rails round the house's own ground, from the same rails a plot's fence is split from,
//      at half a plot's work, felling the trees standing inside it at felling's own time (owner, 2026-10-03, "Auto kids; fell trees";
//      sim/chores.mjs `fence-yard`). The little ones' play stays inside it, and a child on their own
//      automation at home with a yard round them is half as often disobedient (sim/obedience.mjs `YARD_KEEPS`).
//
// Nothing here is stored that an old save lacks a correct empty value for: no paths, no yard, nobody part way along a way. So
// **no save version moved.** A class saved with a house standing is trodden its paths on the first ticks after it opens, as a
// family whose house has just gone up is. Every number here is the game's own (`FIC-GONZ-1100` to `-1104`).
// ceiling: the grid is about 21 feet a side and a person is drawn about a hundred feet tall (sim/house-footprint.mjs
// `PERSON_MILES`), so in open woods a figure still brushes the crowns it passes; the page draws a tree in front of somebody over
// them (public/app.js `treesInFront`), which is what makes walking among trees read as among and not over.
import { record } from './events.mjs';
import { COVER_PACE, landAround, onRealLand } from './ground.mjs';
import { countsTrees, PATCH_MILES, patchAt, patchCover, treeInCell, TREE_MILES, woodsRule } from './woods.mjs';
import { holdingOf } from './grants.mjs';
import { housesOnLand, houseFront } from './house-placement.mjs';
import { CABIN_PEOPLE, PERSON_MILES } from './house-footprint.mjs';
import { PLOT_SIDE, plotsOf, squareOf } from './fields.mjs';
import { polylineLength } from './geography.mjs';
import { herdOf } from './stock.mjs';

const r4 = value => { const fixed = Math.round(value * 10000) / 10000; return fixed === 0 ? 0 : fixed; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Walking about one's own land, in open-ground miles a tick: the pace of the road on foot (sim/travel.mjs `WALK_SPEED`). */
export const STROLL_MILES = 1;
/**
 * How long a mile on a path takes, against a mile of open ground (`COVER_PACE.foot`: open 1, timber 1.3, brush 1.6): a trodden
 * way through the grass is a little quicker than the grass, and much quicker than the timber or the brush it is cut through.
 */
export const PATH_PACE = 0.8;
/** What the way-finding counts a cell with a standing tree in it, against the same ground without: never a wall, nearly one. */
export const TREE_COST = 20;
/**
 * And what it counts one when it lays a trodden way (owner, 2026-10-03, "All automatic": the ways "wind round trees"): a way worn
 * by use is worn where the family walks round the trunks, so it squeezes past one only where going round would be some hundred cells
 * (about two fifths of a mile) further. At `TREE_COST` a way out of a fenced yard into thick timber was laid through a tree's cell
 * rather than round the stand (found 2026-10-03). Laid once, not walked every tick; the dearer search measured no slower.
 * ceiling: somebody walking about the land still counts a tree at `TREE_COST`, so where no way helps they may step between two
 * trunks a trodden way would have gone round; walking the ways themselves keeps them clear.
 */
export const WAY_TREE_COST = 100;
/** And a cell beside one: a way keeps a trunk's width off where the ground lets it. */
export const NEAR_TREE = 2.5;
/** What wading a creek costs the way-finding, against dry ground: it is crossed, where it must be, and not walked along. */
export const WADE_COST = 3;
/** Nearer than this to a river is in it, for somebody on foot on their own land. Creeks are waded (`CREEK_MILES`). */
const RIVER_MILES = 0.015, CREEK_MILES = 0.008;
/** The most cells the way-finding opens before it gives up and the person walks straight, as they always did. */
const MOST_OPENED = 80000;
/** The most cells a search's box holds before it is searched on a coarser grid (`landRoute`): about a mile square of tree cells. */
const MOST_CELLS = 250000;
/** How greedy the way-finding is: its estimate of the way left, in cells of open ground. Above one it finds a way a little longer than the best, quicker. */
const ESTIMATE = 1.2;
/** Shorter than this, a way is laid straight: near enough to the door to walk to as it is, with nothing to find. */
export const PATH_LEAST = 0.03;

// ------------------------------------------------------------------------------------------------ the land, a patch at a time

/** The woods, the cover and the water of each sixteenth-of-a-mile patch, worked out once and kept: the land never changes. */
const patches = new Map();
/** The woods' tree cells along a patch's side (sim/woods.mjs): the way-finding's finest grid is theirs. */
const PER_PATCH = Math.round(PATCH_MILES / TREE_MILES);
const optionsOf = world => ({ rule: woodsRule(world), nearCreek: landAround().nearCreek });
// ceiling: kept for the life of the process, a couple of kilobytes a patch: a league is under two thousand patches, and a class of
// thirty families on labors some three thousand. Dropped wholesale past `PATCHES_KEPT`, which no class reaches.
const PATCHES_KEPT = 200000;

function patchOf(world, px, py) {
  const rule = woodsRule(world), key = `${rule}:${px}:${py}`;
  let patch = patches.get(key);
  if (patch) return patch;
  if (patches.size > PATCHES_KEPT) patches.clear();
  const options = optionsOf(world), land = landAround();
  const centre = { x: (px + 0.5) * PATCH_MILES, y: (py + 0.5) * PATCH_MILES };
  const woods = patchAt(centre, options);
  const cover = land.coverAt(centre, rule);
  // Which of the patch's tree cells has a tree in it, by the tree's place in `trees`: the very trees the map draws.
  const cells = new Int32Array(PER_PATCH * PER_PATCH).fill(-1), trees = [];
  const c0 = px * PER_PATCH, r0 = py * PER_PATCH;
  if (woods.perAcre) {
    for (let row = r0; row < r0 + PER_PATCH; row++) {
      for (let column = c0; column < c0 + PER_PATCH; column++) {
        const tree = treeInCell(column, row, options, woods);
        if (!tree) continue;
        cells[(row - r0) * PER_PATCH + (column - c0)] = trees.length;
        trees.push(tree);
      }
    }
  }
  // The water in it, cell by cell: a river is not walked into, a creek is waded.
  let water = null;
  const near = [...land.segmentsNear(centre, PATCH_MILES * 0.75 + RIVER_MILES)];
  if (near.length) {
    water = new Uint8Array(PER_PATCH * PER_PATCH);
    for (let local = 0; local < water.length; local++) {
      const point = { x: (c0 + (local % PER_PATCH) + 0.5) * TREE_MILES, y: (r0 + Math.floor(local / PER_PATCH) + 0.5) * TREE_MILES };
      for (const { a, b, info } of near) {
        const d = toSegment(point, a, b);
        if (info.kind !== 'creek' && d < RIVER_MILES) { water[local] = 2; break; }
        if (d < CREEK_MILES) water[local] = 1;
      }
    }
    if (!water.some(Boolean)) water = null;
  }
  patch = { cover, cells, trees, water };
  patches.set(key, patch);
  return patch;
}
function toSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

/** Whether a class has its trees counted one by one, so a way can be found round them: the biomes and the 2016 grid. */
export const findsWays = world => onRealLand(world) && countsTrees(woodsRule(world));

// ------------------------------------------------------------------------------------------------ what is on the land

/** The family's paths, or none: a class saved before them has none, the correct empty value. */
export const pathsOf = household => Array.isArray(household?.paths) ? household.paths : [];
/**
 * How much of a path is made, in miles from its first point: all of a trodden one, and as far as the cutting got on one a class
 * saved before 2026-10-03 left part cut (until its stakes come up on the next tick, `leaveOffCutting`).
 */
export const madeMiles = path => (Number.isFinite(path.cut) ? Math.min(path.cut, polylineLength(path.points)) : polylineLength(path.points));
/** The made part of a polyline: its first `miles`. */
function firstMiles(points, miles) {
  const out = [{ ...points[0] }];
  let left = miles;
  for (let i = 1; i < points.length && left > 1e-9; i++) {
    const length = dist(points[i - 1], points[i]);
    if (length <= left) { out.push({ ...points[i] }); left -= length; continue; }
    const f = length ? left / length : 0;
    out.push({ x: points[i - 1].x + (points[i].x - points[i - 1].x) * f, y: points[i - 1].y + (points[i].y - points[i - 1].y) * f });
    left = 0;
  }
  return out;
}
/** The family's lane to the road, as far as it is cut from the house (sim/homesite.mjs): the widest path the family has. */
function laneMade(world, household) {
  const route = Object.values(world.map.routes || {}).find(one => one.to === household.homeSiteId);
  if (!route?.points?.length) return null;
  if (!Number.isFinite(route.cut)) return route.points;
  const total = polylineLength(route.points);
  if (route.cut <= 0) return null;
  // Cut from the house, which is its last point.
  return firstMiles([...route.points].reverse(), Math.min(total, route.cut));
}
/** Every made way on the family's land as polylines: its paths as far as they are made, and its lane as far as it is cut. */
export function madeWays(world, household) {
  const ways = pathsOf(household).map(path => firstMiles(path.points, madeMiles(path))).filter(points => points.length > 1);
  const lane = laneMade(world, household);
  if (lane && lane.length > 1) ways.push(lane);
  return ways;
}

/** The yard's box, as it stands, or null. */
export const yardOf = household => (household?.yard && Number.isFinite(household.yard.minX) ? household.yard : null);
/** Whether rails stand round the family's yard. */
export const yardFenced = household => yardOf(household)?.fence === 'sound';
/** Whether a point is inside the family's fenced yard. */
export const inYard = (household, point) => { const yard = yardFenced(household) ? household.yard : null; return Boolean(yard && point && point.x >= yard.minX && point.x <= yard.maxX && point.y >= yard.minY && point.y <= yard.maxY); };

// ------------------------------------------------------------------------------------------------ the way across the land

const cellKey = (gx, gy) => gx * 1000003 + gy;
/** The cells each family's ways run through, by the ways themselves, so they are marked again only when a way changes. */
const markedWays = new Map();
/** The going round the family's house: what the way-finding reads of the land between two places. */
function groundFor(world, household) {
  const real = findsWays(world);
  const felled = world.woods?.felled || {};
  const houses = housesOnLand(world, household).map(house => house.footprint).filter(box => Number.isFinite(box?.minX));
  const cleared = plotsOf(world, household).filter(plot => plot.state === 'cleared' && Number.isFinite(plot.x)).map(squareOf);
  const ways = madeWays(world, household);
  // The yard's rails while they stand, and the gate in them (owner, 2026-10-03, "All automatic"): nobody climbs them.
  const gate = yardGate(world, household), rails = gate ? { box: household.yard, gate } : null;
  const kept = new Map(), marked = new Map();
  return {
    world, real, felled, houses, cleared, ways, rails,
    /** A patch, by its numbers, kept for this one search so its key is built once. */
    patch(px, py) { const key = px * 100003 + py; let patch = kept.get(key); if (!patch) { patch = patchOf(world, px, py); kept.set(key, patch); } return patch; },
    /** The cells of a grid `size` miles a side that the made ways run through. */
    pathCells(size) {
      let cells = marked.get(size);
      if (cells) return cells;
      // Kept across ticks while the family's ways are the same: a walker reads them every tick, and a long lane is many cells.
      const key = `${household.id}:${size}:${ways.map(way => `${way.length}:${way.at(-1).x},${way.at(-1).y}`).join('|')}`;
      cells = markedWays.get(key);
      if (!cells) {
        if (markedWays.size > 400) markedWays.clear();
        cells = new Set();
        for (const way of ways) markWay(cells, way, size);
        markedWays.set(key, cells);
      }
      marked.set(size, cells);
      return cells;
    },
  };
}
/** The cells a path's line runs through and those its edges touch, so a way can keep to it and straighten along it. */
function markWay(cells, points, size) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = dist(a, b);
    const steps = Math.max(1, Math.ceil(length / (size / 3)));
    const nx = length ? -(b.y - a.y) / length : 0, ny = length ? (b.x - a.x) / length : 0;
    for (let s = 0; s <= steps; s++) {
      for (const side of [-0.6, 0, 0.6]) {
        const x = a.x + (b.x - a.x) * s / steps + nx * side * size, y = a.y + (b.y - a.y) * s / steps + ny * side * size;
        cells.add(cellKey(Math.floor(x / size), Math.floor(y / size)));
      }
    }
  }
}
const inBox = (box, x, y) => x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
/**
 * Whether a cell of a grid, its lower corner at (x0, y0) and `size` a side, lies on the fenced yard's rails and not in its gate:
 * a way in or out of the yard goes through the gate (`yardGate`), never over the rails (owner, 2026-10-03, "All automatic": paths
 * "to the yard gate"). The gate is the stretch of the front rail `GATE_HALF` either side of its middle, whatever the grid.
 */
function onRails({ box, gate }, x0, y0, size) {
  const x1 = x0 + size, y1 = y0 + size;
  if (x1 < box.minX || x0 > box.maxX || y1 < box.minY || y0 > box.maxY) return false;
  if (x0 > box.minX && x1 < box.maxX && y0 > box.minY && y1 < box.maxY) return false;
  return !(y0 <= box.maxY && y1 >= box.maxY && x1 >= gate.x - GATE_HALF && x0 <= gate.x + GATE_HALF);
}
/** Whether a standing tree is in one of the woods' tree cells. */
function standing(ground, column, row) {
  const px = Math.floor(column / PER_PATCH), py = Math.floor(row / PER_PATCH), patch = ground.patch(px, py);
  const index = patch.cells[(row - py * PER_PATCH) * PER_PATCH + (column - px * PER_PATCH)];
  return index >= 0 && !ground.felled[patch.trees[index].id];
}
/** The water in one of the woods' tree cells: 0 dry, 1 a creek, 2 a river. */
function waterIn(ground, column, row) {
  const px = Math.floor(column / PER_PATCH), py = Math.floor(row / PER_PATCH);
  return ground.patch(px, py).water?.[(row - py * PER_PATCH) * PER_PATCH + (column - px * PER_PATCH)] || 0;
}
/** The cover of the patch a point lies in. */
const coverAt = (ground, x, y) => ground.patch(Math.floor(x / PATCH_MILES), Math.floor(y / PATCH_MILES)).cover;

/**
 * What a cell of a grid `k` tree cells a side costs the way-finding, against a cell of open ground: Infinity for a river, a
 * house or the fenced yard's rails (but its gate), a path's own pace on a path, and otherwise the ground's pace (`COVER_PACE.foot`) - many times over where a tree stands
 * in it (`TREE_COST`), and more where one stands beside it (`NEAR_TREE`), so a way keeps clear of the trunks where it can.
 */
function cellCost(ground, gx, gy, k, pathCells, treeCost = TREE_COST) {
  const size = k * TREE_MILES, x = (gx + 0.5) * size, y = (gy + 0.5) * size;
  if (ground.houses.some(box => inBox(box, x, y))) return Infinity;
  if (ground.rails && onRails(ground.rails, gx * size, gy * size, size)) return Infinity;
  const onPath = pathCells.has(cellKey(gx, gy));
  if (!ground.real) return onPath ? PATH_PACE : 1;
  let water = 0, tree = false, near = false;
  const c0 = gx * k, r0 = gy * k;
  for (let row = r0; row < r0 + k; row++) for (let column = c0; column < c0 + k; column++) {
    water = Math.max(water, waterIn(ground, column, row));
    if (!tree && standing(ground, column, row)) tree = true;
  }
  if (water === 2) return Infinity;
  const wade = water === 1 ? WADE_COST : 1;
  // A path's own cells, unless a trunk still stands in one: a trodden way goes round the trees, and a path cut before 2026-10-03
  // felled only what stood in its line.
  if (onPath && !tree) return PATH_PACE * wade;
  if (!tree) {
    for (let row = r0 - 1; row <= r0 + k && !near; row++) for (let column = c0 - 1; column <= c0 + k && !near; column++) {
      if ((row < r0 || row >= r0 + k || column < c0 || column >= c0 + k) && standing(ground, column, row)) near = true;
    }
  }
  const pace = ground.cleared.some(box => inBox(box, x, y)) ? 1 : COVER_PACE.foot[coverAt(ground, x, y)] || 1;
  return pace * wade * (tree ? treeCost : near ? NEAR_TREE : 1);
}
/** How long a mile takes here, for somebody walking, against open ground: a path's pace, open, or the timber's or the brush's. */
function paceAt(ground, point) {
  if (ground.pathCells(TREE_MILES).has(cellKey(Math.floor(point.x / TREE_MILES), Math.floor(point.y / TREE_MILES)))) return PATH_PACE;
  if (!ground.real) return 1;
  if (ground.cleared.some(box => inBox(box, point.x, point.y))) return 1;
  return COVER_PACE.foot[coverAt(ground, point.x, point.y)] || 1;
}

/** A binary heap of cell indices by their score, for the way-finding. */
class Heap {
  constructor() { this.items = []; this.scores = []; }
  get size() { return this.items.length; }
  push(item, score) {
    const items = this.items, scores = this.scores;
    let i = items.length;
    items.push(item); scores.push(score);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (scores[parent] <= score) break;
      items[i] = items[parent]; scores[i] = scores[parent]; i = parent;
    }
    items[i] = item; scores[i] = score;
  }
  pop() {
    const items = this.items, scores = this.scores, top = items[0];
    const lastItem = items.pop(), lastScore = scores.pop();
    if (items.length) {
      let i = 0;
      const n = items.length;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i, best = lastScore;
        if (l < n && scores[l] < best) { m = l; best = scores[l]; }
        if (r < n && scores[r] < best) { m = r; best = scores[r]; }
        if (m === i) break;
        items[i] = items[m]; scores[i] = scores[m]; i = m;
      }
      items[i] = lastItem; scores[i] = lastScore;
    }
    return top;
  }
}

/**
 * The way from one place on the family's land to another, as points, round the trees, the water and the houses, and along a
 * path where one helps. On the woods' own grid of tree cells, about twenty-one feet a side, so a way through the timber goes
 * between the trunks; a long way across a league is found on a grid of two or four tree cells (`MOST_CELLS`), which steps
 * round a stand rather than between its trunks. Straight, as it always was, on a map whose trees are not counted, or when no
 * way is found.
 */
export function landRoute(world, household, from, to, ground = null, treeCost = TREE_COST) {
  const straight = [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
  if (dist(from, to) < TREE_MILES * 1.5) return straight;
  ground ||= groundFor(world, household);
  if (!ground.real && !ground.ways.length && !ground.houses.length && !ground.rails) return straight;
  // The box searched: round both places, wider for a longer way, and no further than a little past the family's own line.
  const reach = Math.max(0.08, dist(from, to) * 0.35);
  const bounds = holdingOf(world, household)?.bounds;
  let minX = Math.min(from.x, to.x) - reach, maxX = Math.max(from.x, to.x) + reach, minY = Math.min(from.y, to.y) - reach, maxY = Math.max(from.y, to.y) + reach;
  if (bounds) {
    minX = Math.max(minX, Math.min(bounds.minX - 0.02, from.x, to.x)); maxX = Math.min(maxX, Math.max(bounds.maxX + 0.02, from.x, to.x));
    minY = Math.max(minY, Math.min(bounds.minY - 0.02, from.y, to.y)); maxY = Math.min(maxY, Math.max(bounds.maxY + 0.02, from.y, to.y));
  }
  let k = 1;
  while (((maxX - minX) / (k * TREE_MILES)) * ((maxY - minY) / (k * TREE_MILES)) > MOST_CELLS) k *= 2;
  const size = k * TREE_MILES, pathCells = ground.pathCells(size);
  const gx0 = Math.floor(minX / size), gy0 = Math.floor(minY / size);
  const width = Math.floor(maxX / size) - gx0 + 1, height = Math.floor(maxY / size) - gy0 + 1;
  const index = (gx, gy) => (gy - gy0) * width + (gx - gx0);
  const goal = { gx: Math.floor(to.x / size), gy: Math.floor(to.y / size) };
  const startIndex = index(Math.floor(from.x / size), Math.floor(from.y / size)), goalIndex = index(goal.gx, goal.gy);
  const costs = new Float32Array(width * height).fill(-1);
  const cost = i => {
    if (costs[i] >= 0) return costs[i];
    const gx = gx0 + (i % width), gy = gy0 + Math.floor(i / width);
    // Where somebody is, and where they are going, can always be stood on: the door of a house, the tree being felled.
    const c = i === startIndex || i === goalIndex ? Math.min(cellCost(ground, gx, gy, k, pathCells, treeCost), TREE_COST) : cellCost(ground, gx, gy, k, pathCells, treeCost);
    costs[i] = c === Infinity ? 1e9 : c;
    return costs[i];
  };
  const g = new Float64Array(width * height).fill(Infinity), came = new Int32Array(width * height).fill(-1), closed = new Uint8Array(width * height);
  // The cheapest a cell can be is a path's; the estimate is the open ground's, which goes a little greedier than it must.
  const estimate = i => { const dx = Math.abs(gx0 + (i % width) - goal.gx), dy = Math.abs(gy0 + Math.floor(i / width) - goal.gy); return (Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)) * ESTIMATE; };
  const heap = new Heap();
  g[startIndex] = 0; heap.push(startIndex, estimate(startIndex));
  let opened = 0, found = false;
  while (heap.size) {
    const i = heap.pop();
    if (closed[i]) continue;
    if (i === goalIndex) { found = true; break; }
    closed[i] = 1;
    if (++opened > MOST_OPENED) break;
    const x = i % width, y = Math.floor(i / width), here = cost(i);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const j = ny * width + nx;
        if (closed[j]) continue;
        const there = cost(j);
        if (there >= 1e9) continue;
        // Not between two corners of something that cannot be walked through, nor slipped between two trunks on a diagonal.
        if (dx && dy && Math.max(cost(y * width + nx), cost(ny * width + x)) >= TREE_COST) continue;
        const step = (dx && dy ? Math.SQRT2 : 1) * (here + there) / 2;
        const score = g[i] + step;
        if (score < g[j]) { g[j] = score; came[j] = i; heap.push(j, score + estimate(j)); }
      }
    }
  }
  if (!found) return straight;
  const cellsWalked = [];
  for (let i = goalIndex; i !== -1; i = came[i]) cellsWalked.push(i);
  cellsWalked.reverse();
  const centre = i => ({ x: (gx0 + (i % width) + 0.5) * size, y: (gy0 + Math.floor(i / width) + 0.5) * size });
  // The cost along the cells as found, so a straight stretch is taken in its place only where it costs no more.
  const along = [0];
  for (let n = 1; n < cellsWalked.length; n++) along.push(along[n - 1] + dist(centre(cellsWalked[n - 1]), centre(cellsWalked[n])) / size * (cost(cellsWalked[n - 1]) + cost(cellsWalked[n])) / 2);
  // Every cell the straight line passes through, each for the length of the line inside it (a walk of the grid, not samples along
  // the line: three samples a cell missed the corner of a tree's cell a straight stretch clipped, found 2026-10-03 when the ways out
  // of a fenced yard had to bend round its rails). A line through a cell's very corner touches the two beside it too: it is not
  // taken past a tree or a wall there, as the search itself never slips a diagonal between them.
  const lineCost = (a, b) => {
    const p = centre(a), q = centre(b);
    const x = p.x / size, y = p.y / size, dx = q.x / size - x, dy = q.y / size - y, length = Math.hypot(dx, dy);
    const sx = Math.sign(dx), sy = Math.sign(dy), stepX = sx ? 1 / Math.abs(dx) : Infinity, stepY = sy ? 1 / Math.abs(dy) : Infinity;
    let cx = Math.floor(x), cy = Math.floor(y), t = 0, total = 0;
    let nextX = sx > 0 ? (cx + 1 - x) / dx : sx < 0 ? (x - cx) / -dx : Infinity, nextY = sy > 0 ? (cy + 1 - y) / dy : sy < 0 ? (y - cy) / -dy : Infinity;
    for (let guard = 0; guard < 4096; guard++) {
      const c = cost(index(cx, cy)), out = Math.min(nextX, nextY, 1);
      if (c >= 1e9) return Infinity;
      total += c * (out - t) * length;
      if (out >= 1) return total;
      t = out;
      if (Math.abs(nextX - nextY) < 1e-12) {
        if (Math.max(cost(index(cx + sx, cy)), cost(index(cx, cy + sy))) >= TREE_COST) return Infinity;
        cx += sx; cy += sy; nextX += stepX; nextY += stepY;
      } else if (nextX < nextY) { cx += sx; nextX += stepX; } else { cy += sy; nextY += stepY; }
    }
    return total;
  };
  const kept = [0];
  for (let n = 0; n < cellsWalked.length - 1;) {
    let next = n + 1;
    for (let j = n + 2; j < cellsWalked.length && j - n <= 160; j++) {
      if (lineCost(cellsWalked[n], cellsWalked[j]) <= along[j] - along[n] + 1e-6) next = j;
      else if (j - next > 8) break;
    }
    kept.push(next);
    n = next;
  }
  const points = [{ x: from.x, y: from.y }];
  for (const n of kept.slice(1, -1)) { const c = centre(cellsWalked[n]); points.push({ x: r4(c.x), y: r4(c.y) }); }
  points.push({ x: to.x, y: to.y });
  return points;
}

/**
 * One tick's walk about the family's own land towards a place: along the way found round the trees, at walking pace, slower
 * through timber and brush and quicker on a path, piece by piece of the way. The person never leaves home (`siteId` stays).
 * The points walked this tick are kept for the page (`walked`); the way is kept until they arrive, and found again if the place
 * they are going changes. Returns true on arrival.
 */
export function walkLand(world, household, entity, target, budget = STROLL_MILES) {
  const here = entity.location;
  if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) return true;
  let route = entity.walkRoute;
  if (!route || route.to.x !== target.x || route.to.y !== target.y || !Array.isArray(route.points)) {
    route = entity.walkRoute = { to: { x: target.x, y: target.y }, points: landRoute(world, household, here, target).slice(1).map(p => ({ x: p.x, y: p.y })) };
  }
  const ground = groundFor(world, household);
  const walked = [{ x: here.x, y: here.y }];
  let at = { x: here.x, y: here.y }, left = budget, moved = 0;
  while (left > 1e-9 && route.points.length) {
    const next = route.points[0], length = dist(at, next);
    if (length < 1e-9) { route.points.shift(); continue; }
    const pieces = Math.max(1, Math.ceil(length / (TREE_MILES / 2))), piece = length / pieces;
    let done = 0;
    for (let k = 0; k < pieces; k++) {
      const t = (k + 0.5) / pieces;
      const pace = paceAt(ground, { x: at.x + (next.x - at.x) * t, y: at.y + (next.y - at.y) * t });
      if (left >= piece * pace) { left -= piece * pace; done += piece; continue; }
      done += left / pace; left = 0; break;
    }
    if (done >= length - 1e-9) { at = { x: next.x, y: next.y }; moved += length; route.points.shift(); walked.push({ ...at }); continue; }
    const f = done / length;
    at = { x: at.x + (next.x - at.x) * f, y: at.y + (next.y - at.y) * f };
    moved += done;
  }
  const arrived = !route.points.length;
  entity.location = arrived ? { x: target.x, y: target.y, siteId: household.homeSiteId } : { x: r4(at.x), y: r4(at.y), siteId: household.homeSiteId };
  const last = walked.at(-1);
  if (dist(last, entity.location) > 1e-6) walked.push({ x: entity.location.x, y: entity.location.y });
  entity.exertion = Math.round(((entity.exertion || 0) + moved) * 10000) / 10000;
  if (walked.length > 1) noteWalked(world, entity, walked);
  if (arrived) delete entity.walkRoute;
  return arrived;
}

/**
 * Somebody stepped across the yard in one tick to where their work is (sim/chores.mjs `walk`): put there, as before, and the way
 * they are drawn walking it found round whatever stands between.
 */
export function stepTo(world, household, entity, point, siteId = household.homeSiteId) {
  const here = entity.location;
  // Off the family's own land (a hunt in the timber by the road) there is no way of its own to find: put there, as always.
  const own = siteId === household.homeSiteId && here.siteId === household.homeSiteId;
  const points = own && dist(here, point) > 1e-6 ? landRoute(world, household, here, point) : null;
  entity.location = { x: point.x, y: point.y, siteId };
  delete entity.walkRoute;
  if (points) noteWalked(world, entity, points);
}
/**
 * The points walked this tick, kept for the page: added to what was walked already this tick when it goes on from where that
 * ended - out across the land and on into the timber after the game, in one tick - and in its place otherwise.
 */
function noteWalked(world, entity, points) {
  const rounded = points.map(p => ({ x: r4(p.x), y: r4(p.y) }));
  const was = entity.walked?.tick === world.tick ? entity.walked.points : null;
  entity.walked = { tick: world.tick, points: was?.length && dist(was.at(-1), rounded[0]) < 1e-4 ? [...was, ...rounded.slice(1)] : rounded };
}

/** The standing tree whose cell of the woods' grid a point is in, by id, or null: what a way round the trees keeps out of. */
export function treeCellAt(world, point) {
  if (!findsWays(world)) return null;
  const column = Math.floor(point.x / TREE_MILES), row = Math.floor(point.y / TREE_MILES);
  const px = Math.floor(column / PER_PATCH), py = Math.floor(row / PER_PATCH), patch = patchOf(world, px, py);
  const index = patch.cells[(row - py * PER_PATCH) * PER_PATCH + (column - px * PER_PATCH)];
  return index >= 0 && !world.woods?.felled?.[patch.trees[index].id] ? patch.trees[index].id : null;
}

/** The points somebody walked this tick, for the page to draw them along, or null. */
export const walkedShown = (world, entity) => (entity.walked?.tick === world.tick && entity.walked.points?.length > 1 ? entity.walked.points : null);

// ------------------------------------------------------------------------------------------------ the ways trodden to what the family places

/** Ways found on one tick, at most, across the class: a class opened with every house standing treads them over a few ticks. */
const TRODDEN_A_TICK = 3;
/** Half the opening in the yard's front rail, in miles, before the door: where the ways out of a fenced yard go through it. */
export const GATE_HALF = 0.006;
/** How far from the house's mark the herd is brought in at night, and how flat its ring: public/herd-view.js `NIGHT_OUT`, `nightGround`. */
const NIGHT_OUT = 0.05, NIGHT_FLAT = 0.6;
/**
 * Where the logs are stacked, from the house's mark, in a person's drawn height (sim/house-footprint.mjs `PERSON_MILES`): left of the
 * house and a little before it, where public/app.js draws the family's wood pile (`wood-pile-*`, x `- yard * .95 - figure * 1.2 * .7`,
 * y `+ yard * .36`, a yard being `CABIN_PEOPLE` figures).
 * ceiling: the page floors a figure at 7 pixels and caps it at 150 (public/app.js `camera.figure`), so zoomed far out or very far in
 * the pile is drawn a little off the end of its way; at the zooms a family's land is worked at the two meet. Drawing the pile at
 * this point (as the tent is drawn at sim/settling.mjs `tentPoint`) is the way out if that ever shows.
 */
const PILE_AT = Object.freeze({ x: -(0.95 * CABIN_PEOPLE + 1.2 * 0.7), y: 0.36 * CABIN_PEOPLE });

/** Where a path begins at the house: the front of it as the map draws it, or the yard by the camp. */
export function doorOf(world, household) {
  const front = houseFront(world, household);
  if (front) return front;
  const site = world.map.sites[household.homeSiteId];
  return { x: r4(site.x - 0.025), y: r4(site.y + 0.035) };
}
/**
 * Where along the front rail of a yard its gate is hung (the front is the side the door faces, the yard's `maxY`, `YARD_FRONT`):
 * as near straight out before the door as leaves no standing tree in the opening - a tree whose trunk stands just outside the rails
 * is not felled with the yard - and a gate's width in from the corners.
 */
function gateAlong(world, yard, door) {
  const least = yard.minX + GATE_HALF * 2, most = yard.maxX - GATE_HALF * 2;
  const straight = Math.min(most, Math.max(least, door.x));
  if (!findsWays(world)) return r4(straight);
  const clear = x => {
    for (let row = Math.floor((yard.maxY - TREE_MILES) / TREE_MILES); row <= Math.floor((yard.maxY + TREE_MILES) / TREE_MILES); row++) {
      for (let column = Math.floor((x - GATE_HALF) / TREE_MILES); column <= Math.floor((x + GATE_HALF) / TREE_MILES); column++) {
        if (treeCellAt(world, { x: (column + 0.5) * TREE_MILES, y: (row + 0.5) * TREE_MILES })) return false;
      }
    }
    return true;
  };
  for (let step = 0; step <= (most - least) / (TREE_MILES / 2) + 1; step++) {
    for (const x of step ? [straight + step * TREE_MILES / 2, straight - step * TREE_MILES / 2] : [straight]) {
      if (x >= least && x <= most && clear(x)) return r4(x);
    }
  }
  return r4(straight);
}
/**
 * The gate in the fenced yard's front rail: where it was hung when the rails went up (`raiseYard`), or, for a yard fenced in a
 * class saved before the gate was kept (2026-10-03), where it would be hung now (`gateAlong`). Null where no sound rails stand: a
 * yard whose rails the Scrape pulled down has no gate to go through.
 */
export function yardGate(world, household) {
  const yard = yardFenced(household) ? household.yard : null;
  if (!yard) return null;
  return { x: Number.isFinite(yard.gate) ? yard.gate : gateAlong(world, yard, doorOf(world, household)), y: r4(yard.maxY) };
}
/** Where the family stacks its logs beside the house (`PILE_AT`). */
export function woodpileAt(world, household) {
  const site = world.map.sites[household.homeSiteId];
  return site ? { x: r4(site.x + PILE_AT.x * PERSON_MILES), y: r4(site.y + PILE_AT.y * PERSON_MILES) } : null;
}
/** A number in [0, 1) the same every time for these parts: FNV-1a, the very hash public/herd-view.js `hashed` draws the herd by. */
function hashed(...parts) {
  let hash = 0x811c9dc5;
  for (const char of parts.join(':')) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash / 0x100000000;
}
/**
 * Where a kind of the family's stock is brought in to at night, near the house: the ground public/herd-view.js `nightGround` draws
 * it standing on from eight in the evening to six. The family has no pen (docs/STOCK.md: an open range), so this is its stock's
 * place; tests/land-paths.test.mjs holds the two to the same point.
 */
export function stockGround(world, household, kind) {
  const site = world.map.sites[household.homeSiteId];
  if (!site) return null;
  const angle = hashed(site.id, kind, 'ground') * Math.PI * 2 + (kind === 'hogs' ? Math.PI * 0.7 : 0);
  return { x: r4(site.x + Math.cos(angle) * NIGHT_OUT), y: r4(site.y + Math.sin(angle) * NIGHT_OUT * NIGHT_FLAT) };
}

/**
 * The places a family treads a way to without being sent (owner, 2026-10-03, "All automatic": "Paths appear on their own from the
 * house to everything the family places: water, each field, the yard gate, the woodpile and the stock pens"), each with what it is
 * (`to`, kept on the path) and where the way ends:
 *   - `water`: running water near enough to carry, a few rods short of the bank (a house that needs a well has none near; the well
 *     is dug by the door, sim/chores.mjs `dig-well`, so it wants no way of its own);
 *   - every cleared plot, by its id, at the side nearest the door a step inside its rails;
 *   - `yard-gate`, once rails stand round the yard;
 *   - `woodpile`, wherever the class keeps a pile of logs (the classes that count their trees, sim/woodpile.mjs `keepsPile`);
 *   - `stock-cattle`, `stock-hogs`, where each kind the family has is brought in at night (`stockGround`).
 * Not the tent: it stands only until the house has a roof (sim/shelter.mjs), and a way begins at the house once it stands.
 */
export function troddenTo(world, household, door = doorOf(world, household)) {
  const wanted = [];
  if (onRealLand(world) && household.site && household.site.needsWell === false) {
    const running = landAround().nearestWater(door, info => info.perennial, 0.4);
    if (running) {
      const d = dist(door, running.at) || 1;
      // To the bank: a few rods short of the water.
      const back = Math.min(d, 0.012);
      wanted.push({ to: 'water', at: { x: r4(running.at.x + (door.x - running.at.x) * back / d), y: r4(running.at.y + (door.y - running.at.y) * back / d) } });
    }
  }
  for (const plot of plotsOf(world, household)) {
    if (plot.state !== 'cleared' || !Number.isFinite(plot.x)) continue;
    // To the side of the plot nearest the door, a step inside its rails.
    const box = squareOf(plot), inset = Math.min(0.01, PLOT_SIDE / 4);
    const at = { x: Math.min(box.maxX - inset, Math.max(box.minX + inset, door.x)), y: Math.min(box.maxY - inset, Math.max(box.minY + inset, door.y)) };
    wanted.push({ to: plot.id, at: { x: r4(at.x), y: r4(at.y) } });
  }
  const gate = yardGate(world, household);
  if (gate) wanted.push({ to: 'yard-gate', at: gate });
  if (countsTrees(woodsRule(world))) { const pile = woodpileAt(world, household); if (pile) wanted.push({ to: 'woodpile', at: pile }); }
  const herd = herdOf(household);
  for (const kind of ['cattle', 'hogs']) if (herd[kind] > 0) wanted.push({ to: `stock-${kind}`, at: stockGround(world, household, kind) });
  return wanted;
}
const nextPathId = household => `path-${pathsOf(household).reduce((most, path) => Math.max(most, Number(path.id.slice(5)) || 0), 0) + 1}`;
const near = (a, b) => dist(a, b) < 0.002;
/** Whether a trodden way still begins at the door, ends where its place is, and was laid with the yard's rails as they stand now. */
const laidRight = (path, door, railed, at) => near(path.points[0], door) && near(path.points.at(-1), at) && Boolean(path.gate) === railed;
/**
 * A way laid from the door to a place, and whether one was found for it (near the door it is laid straight). Out of a fenced yard it
 * goes through the gate, because the way-finding does not cross the rails (`onRails`).
 */
function layWay(world, household, door, at) {
  if (dist(door, at) < PATH_LEAST) return { points: [{ ...door }, { ...at }], found: 0 };
  return { points: landRoute(world, household, door, at, null, WAY_TREE_COST).map(p => ({ x: r4(p.x), y: r4(p.y) })), found: 1 };
}
/** What a family's trodden ways are laid from: if none of it changed since it was last found to want nothing more, it wants nothing. */
function lookedAt(world, household, door, gate) {
  const home = world.map.sites[household.homeSiteId], herd = herdOf(household), yard = yardFenced(household) ? household.yard : null;
  return [world.seed, home.x, home.y, door.x, door.y, gate ? `${gate.x},${gate.y}` : '-', yard ? `${yard.minX},${yard.minY},${yard.maxX},${yard.maxY}` : '-',
    plotsOf(world, household).filter(plot => plot.state === 'cleared').map(plot => plot.id).join(','), household.site?.needsWell, herd.cattle > 0, herd.hogs > 0,
    // And the paths themselves, so a copy of the class (a save opened again in the same process) is looked at on its own.
    pathsOf(household).length].join(':');
}

/**
 * A path left part cut in a class saved before the paths went automatic (owner, 2026-10-03): nobody will cut the rest, so the stakes
 * of what was still to cut come up and the part cut stays a path. Nothing is felled and no log moves.
 */
function leaveOffCutting(household) {
  if (!pathsOf(household).some(path => Number.isFinite(path.cut))) return;
  household.paths = pathsOf(household).flatMap(path => {
    if (!Number.isFinite(path.cut)) return [path];
    const made = madeMiles(path);
    if (made < TREE_MILES) return [];
    const { cut, ...rest } = path;
    return [{ ...rest, points: firstMiles(path.points, made).map(p => ({ x: r4(p.x), y: r4(p.y) })) }];
  });
}

/**
 * Every tick: a family whose house stands (`settled`, sim/houses.mjs `houseSettled`) treads a way from the door to each place in
 * `troddenTo` it has no way to yet, laid round the trees as the family would walk it; lays a way again whose start has moved (the
 * door of a new house, out through the gate once the yard is fenced, from the door again once its rails are down); and lets a way go
 * whose place is gone (a herd all sold or lost, the yard's rails pulled down). A path cut in a class saved before stays as it is.
 * ceiling: a way to something gone goes at once, not grown over through a season; the grass taking it back is the way out if a class
 * ever misses one.
 * The yard's rails are a wall to the way-finding but for the gate (`onRails`), so the ways out of a fenced yard, and everybody
 * walking in or out of it, go through the gate.
 */
export function advanceLandPaths(world, settled) {
  for (const household of Object.values(world.households)) leaveOffCutting(household);
  let laid = 0;
  for (const household of Object.values(world.households)) {
    if (laid >= TRODDEN_A_TICK) return;
    if (household.choosingSite || !settled(household) || !world.map.sites[household.homeSiteId]) continue;
    const door = doorOf(world, household), gate = yardGate(world, household);
    // Looked at again only when the house, its yard, the plots, the water or the herd have changed since it last wanted nothing.
    const looked = lookedAt(world, household, door, gate);
    if (wantsNothing.get(household.id) === looked) continue;
    const wanted = troddenTo(world, household, door);
    const places = new Set(wanted.map(one => one.to));
    // A way to something gone goes with it; a cut path, and a way laid before ways said where they go, stays.
    if (pathsOf(household).some(path => path.kind === 'trodden' && path.to && !places.has(path.to))) household.paths = pathsOf(household).filter(path => path.kind !== 'trodden' || !path.to || places.has(path.to));
    let behind = false;
    for (const { to, at } of wanted) {
      // Laid while the rails stand (`gate` on the path): a way laid before they went up, or before they came down, is laid again.
      const railed = Boolean(gate);
      const was = pathsOf(household).find(path => path.kind === 'trodden' && path.to === to);
      if (was && laidRight(was, door, railed, at)) continue;
      if (laid >= TRODDEN_A_TICK) { behind = true; break; }
      // Found without the way it replaces, so a way laid again is not drawn along the line it was.
      const index = was ? pathsOf(household).indexOf(was) : -1;
      if (was) household.paths = pathsOf(household).filter(path => path !== was);
      const way = layWay(world, household, door, at);
      laid += way.found;
      const paths = [...pathsOf(household)];
      paths.splice(was ? index : paths.length, 0, { id: was ? was.id : nextPathId(household), kind: 'trodden', to, points: way.points, ...(railed && { gate: true }) });
      household.paths = paths;
    }
    if (!behind) wantsNothing.set(household.id, lookedAt(world, household, door, gate));
  }
}
/** What each family was last found to want nothing more with (`advanceLandPaths`, `lookedAt`). */
const wantsNothing = new Map();

/** Why *Cut a path* is refused: the order of 2026-10-02, gone since the owner made every path automatic (2026-10-03). */
export const PATHS_TRODDEN_WHY = 'Nobody needs to cut paths now: the family treads its own ways from the house to the water, each field, the yard gate, the woodpile and the stock, round the trees.';
/** An order to cut a path, from a page loaded before the paths went automatic or a command saved before: refused in words. */
export const pathOrderRefusal = input => (input?.action === 'cut-path' || (input?.action === 'chore' && input.chore === 'cut-path') ? PATHS_TRODDEN_WHY : null);

// ------------------------------------------------------------------------------------------------ the yard

/** How far the yard reaches past the houses as the map draws them: a little at the sides and back, more before the door. */
export const YARD_MARGIN = 0.02, YARD_FRONT = 0.035;
/** The least a yard is across: two people's height (sim/house-footprint.mjs `PERSON_MILES`). */
const YARD_LEAST = 0.035;
/** What a yard's rails cost against ten acres': half the splitting, half the logs off the pile (`FIC-GONZ-1103`). */
export const YARD_SHARE = 0.5;

/**
 * The ground a yard fence would go round: the house's own ground and the dooryard before it, where the little ones play
 * (sim/children.mjs `playStep`), cut back from any plot of the field and kept inside the family's line. Null where there is no
 * room for one.
 */
export function yardBox(world, household) {
  const site = world.map.sites[household.homeSiteId];
  if (!site) return null;
  // The play spot and the yard spot by the door (sim/children.mjs, sim/chores.mjs `yardPoint`), and room for tag round them.
  let box = { minX: site.x - 0.045, maxX: site.x + 0.03, minY: site.y - 0.015, maxY: site.y + 0.055 };
  for (const house of housesOnLand(world, household)) {
    const f = house.footprint;
    if (![f?.minX, f?.maxX, f?.minY, f?.maxY].every(Number.isFinite)) continue;
    box = { minX: Math.min(box.minX, f.minX - YARD_MARGIN), maxX: Math.max(box.maxX, f.maxX + YARD_MARGIN), minY: Math.min(box.minY, f.minY - YARD_MARGIN), maxY: Math.max(box.maxY, f.maxY + YARD_FRONT) };
  }
  const bounds = holdingOf(world, household)?.bounds;
  if (bounds) box = { minX: Math.max(box.minX, bounds.minX + 0.005), maxX: Math.min(box.maxX, bounds.maxX - 0.005), minY: Math.max(box.minY, bounds.minY + 0.005), maxY: Math.min(box.maxY, bounds.maxY - 0.005) };
  // Cut back from the field: each plot in the way is left outside by the cut that keeps the most yard.
  for (const plot of plotsOf(world, household)) {
    if (!Number.isFinite(plot.x)) continue;
    const p = squareOf(plot);
    if (!(box.minX < p.maxX && p.minX < box.maxX && box.minY < p.maxY && p.minY < box.maxY)) continue;
    const cuts = [
      p.minX > site.x && { ...box, maxX: p.minX }, p.maxX < site.x && { ...box, minX: p.maxX },
      p.minY > site.y && { ...box, maxY: p.minY }, p.maxY < site.y && { ...box, minY: p.maxY },
    ].filter(Boolean).filter(cut => cut.maxX - cut.minX >= YARD_LEAST && cut.maxY - cut.minY >= YARD_LEAST);
    if (!cuts.length) return null;
    box = cuts.sort((a, b) => (b.maxX - b.minX) * (b.maxY - b.minY) - (a.maxX - a.minX) * (a.maxY - a.minY))[0];
  }
  if (box.maxX - box.minX < YARD_LEAST || box.maxY - box.minY < YARD_LEAST) return null;
  if (!inBox(box, site.x, site.y)) return null;
  return { minX: r4(box.minX), minY: r4(box.minY), maxX: r4(box.maxX), maxY: r4(box.maxY) };
}
/** The middle of the yard, where its rails would be reckoned from (sim/fields.mjs `fenceWork` reads a place). */
export const yardMiddle = box => ({ x: r4((box.minX + box.maxX) / 2), y: r4((box.minY + box.maxY) / 2) });

/** Why the family cannot fence a yard, or null: before the house stands, with one standing already, or no room. */
export function yardRefusal(world, household, settled) {
  if (household.choosingSite) return 'Choose where the house will stand first.';
  if (!settled(household)) return 'Raise the house before fencing a yard round it.';
  if (yardFenced(household)) return 'The yard is fenced.';
  if (!yardBox(world, household)) return 'The field comes too close round the house to fence a yard.';
  return null;
}

/** The ground a yard's rails go round: the yard as it stands when its rails were pulled down, else where one would go. */
export const yardGround = (world, household) => { const was = yardOf(household); return was && was.fence === 'ruined' ? was : yardBox(world, household); };

/**
 * Every standing tree inside a box, from the patches the way-finding keeps (the very trees the map draws), nearest its middle
 * first: the trees fencing the yard fells (owner, 2026-10-03, "Auto kids; fell trees").
 */
export function treesInBox(world, box) {
  if (!findsWays(world) || !box) return [];
  const felled = world.woods?.felled || {}, found = [];
  const middle = { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 };
  for (let row = Math.floor(box.minY / TREE_MILES); row <= Math.floor(box.maxY / TREE_MILES); row++) {
    for (let column = Math.floor(box.minX / TREE_MILES); column <= Math.floor(box.maxX / TREE_MILES); column++) {
      const px = Math.floor(column / PER_PATCH), py = Math.floor(row / PER_PATCH), patch = patchOf(world, px, py);
      const index = patch.cells[(row - py * PER_PATCH) * PER_PATCH + (column - px * PER_PATCH)];
      if (index < 0) continue;
      const tree = patch.trees[index];
      if (felled[tree.id] || !inBox(box, tree.x, tree.y)) continue;
      found.push(tree);
    }
  }
  return found.sort((a, b) => dist(a, middle) - dist(b, middle) || a.id.localeCompare(b.id));
}

/**
 * The rails go up round the yard. The trees that stood inside it are down by now, felled one at a time at felling's own time
 * before the rails (owner, 2026-10-03, "Auto kids; fell trees"; sim/chores.mjs `fellYard`): never felled for nothing (found
 * 2026-10-02: a version that felled them with the rails gave a house in the timber thirty-nine logs for four ticks of splitting).
 * `felled` is what this person brought down for it, said in the line.
 */
export function raiseYard(world, household, entity, felled = { trees: 0, logs: 0 }) {
  const was = yardOf(household);
  const box = yardGround(world, household);
  if (!box) return;
  household.yard = { minX: box.minX, minY: box.minY, maxX: box.maxX, maxY: box.maxY, fence: 'sound' };
  // The gate hung in the front rail, where the ways out go through (owner, 2026-10-03, "All automatic"): kept, so it never moves.
  household.yard.gate = gateAlong(world, household.yard, doorOf(world, household));
  const trees = felled.trees ? ` ${felled.trees === 1 ? 'A tree inside it came down' : `${felled.trees} trees inside it came down`}, and ${felled.logs === 1 ? 'one log went' : `${felled.logs} logs went`} onto the pile.` : '';
  record(world, 'property', {
    actorId: entity?.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-1103',
    text: was?.fence === 'ruined'
      ? `${entity?.name || 'The family'} set the rails back up round the yard.${trees}`
      : `${entity?.name || 'The family'} split rails and fenced a yard round the house.${trees} The little ones play inside it.`,
  });
}

/** Keep a place inside the family's fenced yard, a little in from the rails; anywhere, where there is none. */
export function keepInYard(household, point, inset = 0.004) {
  const yard = yardFenced(household) ? household.yard : null;
  if (!yard || !point) return point;
  return { x: r4(Math.min(yard.maxX - inset, Math.max(yard.minX + inset, point.x))), y: r4(Math.min(yard.maxY - inset, Math.max(yard.minY + inset, point.y))) };
}

// ------------------------------------------------------------------------------------------------ the page, and saves

/**
 * For the family's own land line: its paths, as far as each is made, with what a trodden one goes to; and its yard, with the gate
 * the page leaves open in its front rail while the rails stand. Absent where there are none.
 */
export function landPathsProjection(world, household) {
  const paths = pathsOf(household);
  const yard = yardOf(household), gate = yard && yardGate(world, household);
  return {
    ...(paths.length && { paths: paths.map(path => ({ id: path.id, kind: path.kind, points: path.points, ...(path.to && { to: path.to }), ...(Number.isFinite(path.cut) && { cut: path.cut }) })) }),
    ...(yard && { yard: { minX: yard.minX, minY: yard.minY, maxX: yard.maxX, maxY: yard.maxY, fence: yard.fence, ...(gate && { gate: { ...gate, half: GATE_HALF } }) } }),
  };
}

/** A stored path or yard that cannot be, or null. */
export function landPathsInvalid(household) {
  if (household.paths !== undefined) {
    if (!Array.isArray(household.paths)) return 'Invalid paths';
    const ids = new Set();
    for (const path of household.paths) {
      if (!/^path-\d+$/.test(path?.id) || ids.has(path.id) || !['trodden', 'cut'].includes(path.kind)) return 'Invalid path';
      if (!Array.isArray(path.points) || path.points.length < 2 || path.points.some(p => !Number.isFinite(p?.x) || !Number.isFinite(p?.y))) return 'Invalid path';
      if (path.cut !== undefined && (path.kind !== 'cut' || !Number.isFinite(path.cut) || path.cut < 0)) return 'Invalid path cutting';
      if (path.to !== undefined && typeof path.to !== 'string') return 'Invalid path';
      // Out through the yard's gate (2026-10-03): only a trodden way. Absent on every way laid before, which is laid again if it must be.
      if (path.gate !== undefined && (path.gate !== true || path.kind !== 'trodden')) return 'Invalid path';
      ids.add(path.id);
    }
  }
  if (household.yard !== undefined) {
    const yard = household.yard;
    if (![yard?.minX, yard?.minY, yard?.maxX, yard?.maxY].every(Number.isFinite) || yard.maxX <= yard.minX || yard.maxY <= yard.minY || !['sound', 'ruined'].includes(yard.fence)) return 'Invalid yard';
    // Where its gate hangs (2026-10-03): absent on a yard fenced before, whose gate is where it would be hung now (`yardGate`).
    if (yard.gate !== undefined && (!Number.isFinite(yard.gate) || yard.gate < yard.minX || yard.gate > yard.maxX)) return 'Invalid yard gate';
  }
  return null;
}
/** Somebody's way across the land, stored while they walk it: where to, and the points still ahead. */
export function walkRouteInvalid(entity) {
  if (entity.walkRoute !== undefined) {
    const route = entity.walkRoute;
    if (!Number.isFinite(route?.to?.x) || !Number.isFinite(route.to.y) || !Array.isArray(route.points) || route.points.some(p => !Number.isFinite(p?.x) || !Number.isFinite(p?.y))) return 'Invalid way across the land';
  }
  if (entity.walked !== undefined && (!Number.isInteger(entity.walked?.tick) || !Array.isArray(entity.walked.points))) return 'Invalid way walked';
  return null;
}

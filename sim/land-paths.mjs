// Going about the family's own land round its trees, the paths a family treads and cuts, and the yard it fences.
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
//   2. **Paths** (`household.paths`). A few are **trodden** without anybody being sent: from the house to running water near
//      enough to carry, and to every cleared plot, once the house stands and as each plot is cleared - the ways a family wears by
//      using them, laid round the trees (`advanceLandPaths`). More are **cut** as work (*Cut a path*, sim/chores.mjs `cut-path`):
//      a straight line from the house, a path or the lane out to a place the student chose, felling every tree whose trunk stands
//      in the way (onto the pile, as felling does) and grubbing the brush. Walking a path is quicker than the open country and
//      much quicker than timber or brush (`PATH_PACE`), and the way across the land prefers one.
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
import { PLOT_SIDE, groundAt, plotsOf, squareOf } from './fields.mjs';
import { polylineLength, pointAlong } from './geography.mjs';

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
/** How far either side of a path's line a tree stands in its way, and is felled to cut it: about thirteen feet. */
export const PATH_HALF = 0.0025;
/** The longest single path a family cuts, in miles: from the house, a path or the lane out to the place chosen. */
export const PATH_MOST = 0.6;
/** Shorter than this, a place is near enough to walk to as it is. */
export const PATH_LEAST = 0.03;
/**
 * Ticks of one person's work to clear a mile of a path's line, by the ground, before its trees (each felled at felling's own
 * time, sim/felling.mjs `fellAndCarryTicks`): a mark through the grass, the undergrowth of the timber, and brush grubbed out.
 * Half the lane's (sim/homesite.mjs `LANE_TICKS_PER_MILE`), because a footpath is narrower than a wagon's lane.
 */
export const PATH_TICKS_PER_MILE = Object.freeze({ prairie: 3, timber: 12, brush: 15 });
/** How much of a path's line one spell of work clears where nothing is felled: a long way through grass, a short one through brush. */
const PATH_STRETCH = Object.freeze({ prairie: 0.2, timber: 0.05, brush: 0.05 });

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
/** How much of a path is made, in miles from its first point: all of a trodden one, as far as the cutting has got on one being cut. */
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
  const kept = new Map(), marked = new Map();
  return {
    world, real, felled, houses, cleared, ways,
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
 * What a cell of a grid `k` tree cells a side costs the way-finding, against a cell of open ground: Infinity for a river or a
 * house, a path's own pace on a path, and otherwise the ground's pace (`COVER_PACE.foot`) - many times over where a tree stands
 * in it (`TREE_COST`), and more where one stands beside it (`NEAR_TREE`), so a way keeps clear of the trunks where it can.
 */
function cellCost(ground, gx, gy, k, pathCells) {
  const size = k * TREE_MILES, x = (gx + 0.5) * size, y = (gy + 0.5) * size;
  if (ground.houses.some(box => inBox(box, x, y))) return Infinity;
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
  // A path's own cells, unless a trunk still stands in one: a path cut fells only what stands in its line (`PATH_HALF`).
  if (onPath && !tree) return PATH_PACE * wade;
  if (!tree) {
    for (let row = r0 - 1; row <= r0 + k && !near; row++) for (let column = c0 - 1; column <= c0 + k && !near; column++) {
      if ((row < r0 || row >= r0 + k || column < c0 || column >= c0 + k) && standing(ground, column, row)) near = true;
    }
  }
  const pace = ground.cleared.some(box => inBox(box, x, y)) ? 1 : COVER_PACE.foot[coverAt(ground, x, y)] || 1;
  return pace * wade * (tree ? TREE_COST : near ? NEAR_TREE : 1);
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
export function landRoute(world, household, from, to, ground = null) {
  const straight = [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
  if (dist(from, to) < TREE_MILES * 1.5) return straight;
  ground ||= groundFor(world, household);
  if (!ground.real && !ground.ways.length && !ground.houses.length) return straight;
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
    const c = i === startIndex || i === goalIndex ? Math.min(cellCost(ground, gx, gy, k, pathCells), TREE_COST) : cellCost(ground, gx, gy, k, pathCells);
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
  const lineCost = (a, b) => {
    const p = centre(a), q = centre(b), length = dist(p, q) / size, steps = Math.max(1, Math.ceil(length * 3));
    let total = 0;
    for (let n = 0; n < steps; n++) {
      const t = (n + 0.5) / steps, x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t;
      const c = cost(index(Math.floor(x / size), Math.floor(y / size)));
      if (c >= 1e9) return Infinity;
      total += c * length / steps;
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

// ------------------------------------------------------------------------------------------------ paths trodden by use

/** Paths trodden on one tick, at most, across the class: a class opened with every house standing treads them over a few ticks. */
const TRODDEN_A_TICK = 3;
/** Where a path begins at the house: the front of it as the map draws it, or the yard by the camp. */
export function doorOf(world, household) {
  const front = houseFront(world, household);
  if (front) return front;
  const site = world.map.sites[household.homeSiteId];
  return { x: r4(site.x - 0.025), y: r4(site.y + 0.035) };
}
/** The places a family treads a way to without being sent: running water near enough to carry, and every cleared plot. */
function troddenTo(world, household) {
  const wanted = [];
  const door = doorOf(world, household);
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
  return wanted;
}
const nextPathId = household => `path-${pathsOf(household).reduce((most, path) => Math.max(most, Number(path.id.slice(5)) || 0), 0) + 1}`;

/**
 * Every tick: a family whose house stands treads a way to running water near enough to carry and to each cleared plot it has no
 * way to yet (`settled` says whose house stands; sim/houses.mjs `houseSettled`). Laid round the trees, as the family would walk it.
 */
export function advanceLandPaths(world, settled) {
  let laid = 0;
  for (const household of Object.values(world.households)) {
    if (laid >= TRODDEN_A_TICK) return;
    if (household.choosingSite || !settled(household) || !world.map.sites[household.homeSiteId]) continue;
    // Looked at again only when the house, the plots or the paths have changed since it was last found to want nothing more.
    const home = world.map.sites[household.homeSiteId];
    const looked = `${world.seed}:${home.x},${home.y}:${plotsOf(world, household).filter(plot => plot.state === 'cleared').map(plot => plot.id).join(',')}:${pathsOf(household).length}:${household.site?.needsWell}`;
    if (wantsNothing.get(household.id) === looked) continue;
    const before = laid;
    const have = new Set(pathsOf(household).map(path => path.to).filter(Boolean));
    for (const { to, at } of troddenTo(world, household)) {
      if (have.has(to) || laid >= TRODDEN_A_TICK) continue;
      const door = doorOf(world, household);
      if (dist(door, at) < PATH_LEAST) { household.paths = [...pathsOf(household), { id: nextPathId(household), kind: 'trodden', to, points: [door, at] }]; continue; }
      const points = landRoute(world, household, door, at).map(p => ({ x: r4(p.x), y: r4(p.y) }));
      household.paths = [...pathsOf(household), { id: nextPathId(household), kind: 'trodden', to, points }];
      laid++;
    }
    if (laid === before && laid < TRODDEN_A_TICK) wantsNothing.set(household.id, `${world.seed}:${home.x},${home.y}:${plotsOf(world, household).filter(plot => plot.state === 'cleared').map(plot => plot.id).join(',')}:${pathsOf(household).length}:${household.site?.needsWell}`);
  }
}
/** What each family was last found to want nothing more with: the house, its cleared plots, its paths and its water (`advanceLandPaths`). */
const wantsNothing = new Map();

// ------------------------------------------------------------------------------------------------ cutting a path

/** The nearest point of a polyline to a place, and how far along it that is. */
function nearestOn(points, point) {
  let best = null, travelled = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (length * length))) : 0;
    const at = { x: a.x + dx * t, y: a.y + dy * t }, d = dist(at, point);
    if (!best || d < best.d) best = { at, d, miles: travelled + length * t };
    travelled += length;
  }
  return best;
}
/** Where a path to this place would begin: the nearest point of the house's door, a path the family has, or its lane. */
export function pathStart(world, household, point) {
  let best = { at: doorOf(world, household), d: dist(doorOf(world, household), point) };
  for (const way of madeWays(world, household)) { const near = nearestOn(way, point); if (near && near.d < best.d) best = near; }
  return { x: r4(best.at.x), y: r4(best.at.y) };
}

/**
 * The standing trees whose trunks are within `PATH_HALF` of a straight line, each with how far along the line it stands, nearest
 * the start first: the trees a path cut along that line fells. Read from the patches the way-finding keeps, so it costs nothing new.
 */
export function treesInTheWay(world, a, b) {
  if (!findsWays(world)) return [];
  const felled = world.woods?.felled || {}, seen = new Set(), found = [];
  const length = dist(a, b), steps = Math.max(1, Math.ceil(length / (TREE_MILES / 2)));
  const ux = length ? (b.x - a.x) / length : 0, uy = length ? (b.y - a.y) / length : 0;
  for (let s = 0; s <= steps; s++) {
    const x = a.x + (b.x - a.x) * s / steps, y = a.y + (b.y - a.y) * s / steps;
    const gx = Math.floor(x / TREE_MILES), gy = Math.floor(y / TREE_MILES);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = gx + dx, cy = gy + dy, key = cellKey(cx, cy);
      if (seen.has(key)) continue;
      seen.add(key);
      const px = Math.floor(cx / PER_PATCH), py = Math.floor(cy / PER_PATCH), patch = patchOf(world, px, py);
      const index = patch.cells[(cy - py * PER_PATCH) * PER_PATCH + (cx - px * PER_PATCH)];
      if (index < 0) continue;
      const tree = patch.trees[index];
      if (felled[tree.id]) continue;
      const along = (tree.x - a.x) * ux + (tree.y - a.y) * uy;
      if (along < -PATH_HALF || along > length + PATH_HALF) continue;
      if (toSegment(tree, a, b) > PATH_HALF) continue;
      found.push({ ...tree, along });
    }
  }
  return found.sort((p, q) => p.along - q.along || p.id.localeCompare(q.id));
}

/** The ground at stretches of a straight line, in miles of prairie, timber and brush (sim/fields.mjs `groundAt`). */
function groundMiles(world, a, b) {
  const miles = { prairie: 0, timber: 0, brush: 0 }, length = dist(a, b), steps = Math.max(1, Math.ceil(length / PATCH_MILES * 2));
  for (let s = 0; s < steps; s++) {
    const t = (s + 0.5) / steps;
    miles[groundAt(world, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })] += length / steps;
  }
  return miles;
}

/** The family's path being cut to this place, if one is part made and ends here. */
const unfinishedTo = (household, point) => pathsOf(household).find(path => path.kind === 'cut' && madeMiles(path) < polylineLength(path.points) - 1e-6 && dist(path.points.at(-1), point) < 0.01);

/**
 * Why a path cannot be cut to this place, or null, and the line it would follow. Asked when the student looks and when the person
 * is sent. `fellTicks` is felling's own time for a tree (sim/felling.mjs `fellAndCarryTicks`), handed in.
 */
export function cutPathPlan(world, household, point) {
  if (!household) return { why: 'No family to cut a path for.' };
  if (world.status === 'lobby') return { why: 'The family cuts its paths once the class has begun.' };
  if (household.choosingSite) return { why: 'Choose where the house will stand first.' };
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return { why: 'Choose a place on your land to cut a path to.' };
  const to = { x: r4(point.x), y: r4(point.y) };
  const bounds = holdingOf(world, household).bounds;
  if (to.x < bounds.minX || to.x > bounds.maxX || to.y < bounds.minY || to.y > bounds.maxY) return { why: 'That is not your land.' };
  const resume = unfinishedTo(household, to);
  if (resume) return { path: resume, from: resume.points[0], to: resume.points.at(-1) };
  if (onRealLand(world)) {
    const land = landAround();
    const height = land.heightAt(to.x, to.y);
    if (!Number.isFinite(height) || height < 0.3) return { why: 'That is in the water.' };
    const river = land.nearestWater(to, info => info.kind !== 'creek', RIVER_MILES);
    if (river) return { why: 'That is in the water.' };
  }
  if (pathsOf(household).some(path => madeMiles(path) >= polylineLength(path.points) - 1e-6 && dist(path.points.at(-1), to) < 0.02)) return { why: 'There is a path there already.' };
  const from = pathStart(world, household, to);
  const length = dist(from, to);
  if (length < PATH_LEAST) return { why: 'That is near enough to a path or the house to walk to as it is.' };
  if (length > PATH_MOST) return { why: `That is too far for one path: choose somewhere within ${PATH_MOST} of a mile of the house, a path or the lane.` };
  if (onRealLand(world)) {
    const crossing = landAround().crossings(from, to);
    if (crossing.barrier || crossing.rivers) return { why: 'A path cannot be cut across the river.' };
  }
  return { from, to };
}

/** What cutting the path in a plan would take: the trees felled, their logs, the ground, and the ticks of one hand's work. */
export function cutPathWork(world, household, plan, fellTicks) {
  const a = plan.path ? pointAlong(plan.path.points, madeMiles(plan.path)) : plan.from, b = plan.to;
  const trees = treesInTheWay(world, a, b);
  const ground = groundMiles(world, a, b);
  const ticks = trees.reduce((sum, tree) => sum + fellTicks(tree), 0) + Object.entries(ground).reduce((sum, [kind, miles]) => sum + miles * PATH_TICKS_PER_MILE[kind], 0);
  return { trees: trees.length, logs: trees.reduce((sum, tree) => sum + tree.logs, 0), ground, miles: dist(a, b), ticks, wantsAxe: trees.length > 0 || ground.timber + ground.brush > 0.005 };
}

/** The path a cutter is at, by id. */
export const pathById = (household, id) => pathsOf(household).find(path => path.id === id) || null;
/** A path laid out to be cut: stored at once, its stakes drawn, and cut from its first point outward. Returns it. */
export function stakePath(world, household, plan) {
  if (plan.path) return plan.path;
  const path = { id: nextPathId(household), kind: 'cut', points: [{ ...plan.from }, { ...plan.to }], cut: 0 };
  household.paths = [...pathsOf(household), path];
  return path;
}
/** Where the cutting of a path has got to: the point a cutter goes out to. */
export const pathFront = (household, id) => { const path = pathById(household, id); return path ? (({ x, y }) => ({ x: r4(x), y: r4(y) }))(pointAlong(path.points, madeMiles(path))) : null; };

/**
 * What a cutter does next on a path: done; fell a tree in the way (the next one along that nobody else is felling); or clear a
 * stretch of the line, as much as a spell clears of its ground. `taken` are the trees others of the family are felling now.
 */
export function nextOnPath(world, household, id, taken = new Set()) {
  const path = pathById(household, id);
  if (!path) return { done: true };
  const length = polylineLength(path.points), made = madeMiles(path);
  if (made >= length - 1e-6) return { done: true };
  const front = pointAlong(path.points, made), end = path.points.at(-1);
  const ground = groundAt(world, front);
  const stretch = Math.min(length - made, PATH_STRETCH[ground] || PATH_STRETCH.prairie);
  const tree = treesInTheWay(world, front, end).find(one => one.along <= stretch + PATH_HALF && !taken.has(one.id));
  if (tree) return { tree, at: { x: tree.x, y: tree.y } };
  // Somebody else is felling the last tree in this stretch: wait for it, beside them.
  if (treesInTheWay(world, front, end).some(one => one.along <= stretch + PATH_HALF)) return { wait: true, at: { x: r4(front.x), y: r4(front.y) } };
  return { stretch, ground, ticks: stretch * PATH_TICKS_PER_MILE[ground], at: { x: r4(front.x), y: r4(front.y) } };
}
/** A stretch of the line cleared. Returns true when that reached the end. */
export function clearStretch(world, household, entity, id, miles) {
  const path = pathById(household, id);
  if (!path) return true;
  const length = polylineLength(path.points);
  path.cut = r4(Math.min(length, madeMiles(path) + miles));
  if (path.cut < length - 1e-6) return false;
  delete path.cut;
  return true;
}

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

/** For the family's own land line: its paths, as far as each is made, and its yard. Absent where there are none. */
export function landPathsProjection(household) {
  const paths = pathsOf(household);
  const yard = yardOf(household);
  return {
    ...(paths.length && { paths: paths.map(path => ({ id: path.id, kind: path.kind, points: path.points, ...(Number.isFinite(path.cut) && { cut: path.cut }) })) }),
    ...(yard && { yard: { minX: yard.minX, minY: yard.minY, maxX: yard.maxX, maxY: yard.maxY, fence: yard.fence } }),
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
      ids.add(path.id);
    }
  }
  if (household.yard !== undefined) {
    const yard = household.yard;
    if (![yard?.minX, yard?.minY, yard?.maxX, yard?.maxY].every(Number.isFinite) || yard.maxX <= yard.minX || yard.maxY <= yard.minY || !['sound', 'ruined'].includes(yard.fence)) return 'Invalid yard';
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

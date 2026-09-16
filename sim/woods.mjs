// The woods: what stands at every point of the land, patch by patch and tree by tree.
//
// docs/WOODS_AND_BUILDING.md §4, build step 1. On the real land of the colonies each eighth-of-a-mile cell is one
// **stand**, read from LANDFIRE's modelled pre-settlement vegetation (public/terrain/colonies-woods.bin.gz, built by
// scripts/build-woods.mjs). Inside a stand the land is a mosaic of **patches** a sixteenth of a mile across, each in
// one of the stand's succession classes - open or closed, young or mature - drawn by hash in the shares LANDFIRE's
// models give. Inside a patch every tree is one real tree on a lattice about twenty-one feet a side, placed, sized and
// named by hash, so the woods are never stored: only a felled tree is (`world.woods.felled`, step 4).
//
// The land is the same for every class, like the heights: nothing here reads a world's seed.
//
// What is history and what is not:
//   - Where each kind of woods stood is LANDFIRE's model of the pre-settlement vegetation (a modern reconstruction,
//     not a survey of 1835), with EPA's Level IV ecoregions naming the country.
//   - The trees in each - post oak and blackjack on the savanna, pecan, elm, ash, hackberry and oaks in the bottoms
//     with cottonwood on the banks, live oak near the coast, loblolly pine at Bastrop and in the east, mesquite west
//     of the Guadalupe - are the models' indicator species and what Holley saw (`HIST-TEX-016`).
//   - The bottomland's canopy of 15 to 30 trees an acre is the LANDFIRE floodplain model's. Every other number of
//     trees an acre, every share of a kind, the patch and lattice sizes, the logs a tree gives and the motte are
//     invented (`FIC-GONZ-032`).
//
// ceiling: an eighth-of-a-mile stand and a sixteenth-of-a-mile patch are the grain; a real grove's edge is sharper,
// and General Land Office bearing-tree notes for particular leagues would give a truer one.
// ceiling: the invented Gonzales country has one kind of woods, timber within 1.15 miles of its water, as its map has
// always drawn; and a class on the real land saved before this keeps the old rule (timber by the rivers and creeks).
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const ROOT = new URL('../public/terrain/', import.meta.url);
/** What a world's map records when its woods are this grid. */
export const WOODS_SOURCE = 'landfire-2016';
/** A patch of one succession class is this many miles a side: 330 feet, about two and a half acres. */
export const PATCH_MILES = 1 / 16;
/** One tree at most stands in each lattice cell this many miles a side: about 21 feet. */
export const TREE_MILES = 1 / 256;
const ACRES_PER_SQUARE_MILE = 640;
const CELL_ACRES = TREE_MILES * TREE_MILES * ACRES_PER_SQUARE_MILE;
/** A creek the map draws keeps a strip of creek timber this far either side of it through prairie and savanna (FIC-GONZ-032). */
export const CREEK_TIMBER_MILES = 0.1;
/** A patch with at least this many log-sized trees an acre is timber for the going, clearing and the house site. */
export const TIMBER_TREES_PER_ACRE = 10;

const klass = (name, share, perAcre, size) => Object.freeze({ name, share, perAcre, size });
/**
 * Each stand: its succession classes (share of patches, log-sized trees an acre, the size they run to), the kinds of
 * tree, most common first, and how good its game is. `note` says where the classes come from.
 */
export const STANDS = Object.freeze({
  prairie: {
    name: 'prairie', game: 0.2,
    note: 'LANDFIRE coastal and blackland prairie models: woody plants rare. Holley p. 51: "points and islands of timber".',
    classes: [klass('grass', 39 / 40, 0, null), klass('motte', 1 / 40, 3, 'large')],
    kinds: [['post-oak', 0.6], ['live-oak', 0.4]],
  },
  'post-oak': {
    name: 'post oak savanna', game: 0.7,
    note: 'LANDFIRE 15190: open mature 58, closed 18, early 14, closed middle 6, open middle 4 in 100.',
    classes: [klass('open mature', 0.58, 6, 'large'), klass('closed', 0.18, 30, 'log'), klass('early', 0.14, 0, null), klass('thicket', 0.06, 0, null), klass('open young', 0.04, 2, 'log')],
    kinds: [['post-oak', 0.6], ['blackjack', 0.25], ['hickory', 0.15]],
  },
  bottomland: {
    name: 'bottomland timber', game: 1,
    note: 'LANDFIRE 14730: closed mature 43, open mature 31, closed middle 16, early 10 in 100; canopy trees 15-30 an acre.',
    classes: [klass('closed mature', 0.43, 30, 'large'), klass('open mature', 0.31, 15, 'large'), klass('closed middle', 0.16, 40, 'pole'), klass('gap', 0.10, 0, null)],
    kinds: [['pecan', 0.2], ['elm', 0.15], ['ash', 0.12], ['hackberry', 0.12], ['water-oak', 0.16], ['cottonwood', 0.1], ['sycamore', 0.05], ['walnut', 0.05], ['cedar', 0.05]],
  },
  creek: {
    name: 'creek timber', game: 0.9,
    note: 'LANDFIRE 14740: closed mature 67, closed middle 19, early 14 in 100.',
    classes: [klass('closed mature', 0.67, 30, 'large'), klass('closed middle', 0.19, 40, 'pole'), klass('gap', 0.14, 0, null)],
    kinds: [['pecan', 0.25], ['elm', 0.2], ['hackberry', 0.15], ['post-oak', 0.1], ['water-oak', 0.1], ['cottonwood', 0.1], ['walnut', 0.05], ['ash', 0.05]],
  },
  pine: {
    name: 'pine woods', game: 0.7,
    note: 'LANDFIRE 13580 and 13710: open mature 54, closed mature 22 (13580) or 4 (13710), open middle 7 to 22, early 10 to 12 in 100.',
    classes: [klass('open mature', 0.54, 12, 'large'), klass('closed', 0.14, 40, 'log'), klass('open middle', 0.2, 20, 'log'), klass('early', 0.12, 0, null)],
    kinds: [['loblolly', 0.55], ['shortleaf', 0.15], ['post-oak', 0.2], ['blackjack', 0.1]],
  },
  'live-oak': {
    name: 'live oak woods', game: 0.6,
    note: 'LANDFIRE 13380 not yet read: an even split of closed and open is invented.',
    classes: [klass('closed', 0.5, 25, 'large'), klass('open', 0.5, 8, 'large')],
    kinds: [['live-oak', 0.6], ['hackberry', 0.2], ['elm', 0.2]],
  },
  'hill-savanna': {
    name: 'hill country savanna', game: 0.6,
    note: 'LANDFIRE 13830 not yet read: open 60 and closed 40 in 100 are invented. Holley pp. 19-20: hilltops crowned with cedars or oaks and pecans.',
    classes: [klass('open', 0.6, 6, 'large'), klass('closed', 0.4, 25, 'log')],
    kinds: [['live-oak', 0.4], ['cedar', 0.35], ['post-oak', 0.15], ['pecan', 0.1]],
  },
  brush: {
    name: 'mesquite brush', game: 0.5,
    note: 'LANDFIRE 13900 not yet read. Holley pp. 18, 21: mesquite the size of a peach tree, for fencing and fuel.',
    classes: [klass('brush', 0.7, 0, null), klass('mesquite', 0.3, 20, 'pole')],
    kinds: [['mesquite', 1]],
  },
  marsh: { name: 'marsh', game: 0.3, note: 'Tidal marsh and swamp.', classes: [klass('marsh', 1, 0, null)], kinds: [] },
  water: { name: 'water', game: 0, note: 'Open water.', classes: [klass('water', 1, 0, null)], kinds: [] },
  none: { name: 'nothing', game: 0, note: 'Off the land.', classes: [klass('none', 1, 0, null)], kinds: [] },
});
/** The stands in the byte order of the grid. Keep in step with STAND_IDS in scripts/build-woods.mjs. */
const STAND_ORDER = ['none', 'prairie', 'post-oak', 'bottomland', 'creek', 'pine', 'live-oak', 'hill-savanna', 'brush', 'marsh', 'water'];

/**
 * The kinds of tree, and what a felled one gives: logs by size (pole, log, large) and what they are good for - `wall`
 * logs straight enough to lay up, `sill` logs that do not rot on the ground, `poor` logs that do, or none at all.
 * Holley: cottonwood the least valuable timber but easy to cut; mesquite no bigger than a peach tree (`HIST-TEX-016`).
 * The counts are invented (`FIC-GONZ-032`). `picture` is the tree art it is drawn with.
 */
const kind = (name, logs, use, fell, picture) => Object.freeze({ name, logs: Object.freeze(logs), use, fell, picture });
export const KINDS = Object.freeze({
  'post-oak': kind('post oak', [1, 2, 2], 'sill', 1, 'oak-broad'),
  blackjack: kind('blackjack oak', [1, 1, 2], 'poor', 1, 'oak-broad'),
  hickory: kind('hickory', [1, 2, 2], 'wall', 1.2, 'pecan'),
  'live-oak': kind('live oak', [0, 1, 1], 'sill', 1.5, 'live-oak'),
  'water-oak': kind('water oak', [1, 2, 3], 'wall', 1, 'oak-broad'),
  pecan: kind('pecan', [1, 2, 2], 'wall', 1.2, 'pecan'),
  walnut: kind('walnut', [1, 2, 2], 'wall', 1.2, 'pecan'),
  elm: kind('elm', [1, 2, 2], 'poor', 1, 'elm'),
  ash: kind('ash', [1, 2, 3], 'wall', 1, 'pecan'),
  hackberry: kind('hackberry', [1, 1, 2], 'poor', 0.8, 'oak-broad'),
  cottonwood: kind('cottonwood', [2, 3, 3], 'poor', 0.6, 'cottonwood'),
  sycamore: kind('sycamore', [1, 2, 3], 'poor', 1, 'cottonwood'),
  cedar: kind('cedar', [1, 1, 2], 'sill', 0.8, 'cedar'),
  loblolly: kind('loblolly pine', [2, 3, 4], 'wall', 0.8, 'pine-loblolly'),
  shortleaf: kind('shortleaf pine', [2, 3, 3], 'wall', 0.8, 'pine-loblolly'),
  mesquite: kind('mesquite', [0, 0, 0], 'none', 0.6, 'mesquite'),
});
export const SIZES = Object.freeze(['pole', 'log', 'large']);

// ---- the grid ----------------------------------------------------------------------------------------------

let grid = null;
function loadGrid() {
  if (grid) return grid;
  const header = JSON.parse(gunzipSync(readFileSync(new URL('colonies-woods.json.gz', ROOT))).toString('utf8'));
  const cells = gunzipSync(readFileSync(new URL(header.grid.file, ROOT)));
  const { minX, minY, columns, rows, cell } = header.grid;
  if (cells.length !== columns * rows) throw new Error('The woods grid is not the size its header says');
  const eco = header.ecoregions;
  grid = { minX, minY, columns, rows, cell, cells, eco: { ...eco, cells: Buffer.from(eco.grid, 'base64') } };
  return grid;
}

/** The stand of the grid cell a point lies in, before any creek is considered; 'none' off the grid. */
export function gridStandAt(point) {
  const { minX, minY, columns, rows, cell, cells } = loadGrid();
  const column = Math.floor((point.x - minX) / cell), row = Math.floor((point.y - minY) / cell);
  if (column < 0 || row < 0 || column >= columns || row >= rows) return 'none';
  return STAND_ORDER[cells[row * columns + column]] || 'none';
}

/** The EPA Level IV ecoregion a point lies in, as `{ code, name }`, or null outside Texas. */
export function ecoregionAt(point) {
  const { minX, minY, eco } = loadGrid();
  const column = Math.floor((point.x - minX) / eco.cell), row = Math.floor((point.y - minY) / eco.cell);
  if (column < 0 || row < 0 || column >= eco.columns || row >= eco.rows) return null;
  const index = eco.cells[row * eco.columns + column];
  return index ? eco.regions[index - 1] : null;
}

// ---- hashing -----------------------------------------------------------------------------------------------

/** A number in [0, 1) from integers, the same on every machine. */
function hash(a, b, salt) {
  let h = (Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(salt | 0, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const pick = (entries, roll) => {
  let total = 0;
  for (const [value, share] of entries) { total += share; if (roll < total) return value; }
  return entries.length ? entries[entries.length - 1][0] : null;
};

// ---- the woods of a world ------------------------------------------------------------------------------------

/**
 * How a world's woods are decided: `landfire` for a real-land class made since the woods grid, `rivers` for a
 * real-land class saved before it (timber by the rivers and creeks, as it always had), `invented` for the Gonzales
 * country.
 */
export const woodsRule = world => world?.map?.woods === WOODS_SOURCE ? 'landfire' : world?.map?.source === 'texas-colonies-map' ? 'rivers' : 'invented';

/**
 * The stand at a point. `nearCreek(point, miles)` says whether a creek the map draws is within that far - the grid is
 * too coarse to see a narrow creek's timber, so a creek through prairie, savanna, brush or the hills keeps its strip.
 * `rule` is `woodsRule(world)`; the other two rules have only creek timber and prairie, `timberAt` saying which.
 */
export function standAt(point, { rule = 'landfire', nearCreek = null, timberAt = null } = {}) {
  if (rule !== 'landfire') return timberAt?.(point) ? 'creek' : 'prairie';
  const stand = gridStandAt(point);
  if (['prairie', 'post-oak', 'hill-savanna', 'brush'].includes(stand) && nearCreek?.(point, CREEK_TIMBER_MILES)) return 'creek';
  return stand;
}

/** The patch a point lies in: its integer position, its stand and its succession class. */
export function patchAt(point, options = {}) {
  const px = Math.floor(point.x / PATCH_MILES), py = Math.floor(point.y / PATCH_MILES);
  const centre = { x: (px + 0.5) * PATCH_MILES, y: (py + 0.5) * PATCH_MILES };
  const stand = standAt(centre, options);
  const { classes } = STANDS[stand];
  const chosen = pick(classes.map(c => [c, c.share]), hash(px, py, 1));
  return { px, py, stand, class: chosen.name, perAcre: chosen.perAcre, size: chosen.size };
}

/** Whether a patch is timber for the going, clearing and the house site. Mesquite brush is brush, never timber. */
export const patchCover = patch => patch.stand === 'brush' ? 'brush' : patch.perAcre >= TIMBER_TREES_PER_ACRE ? 'timber' : 'open';

/** The kinds of tree in this stand at this place: live oak comes into the coastal bottoms, pine and gum the eastern creeks. */
function kindsAt(stand, region) {
  const base = STANDS[stand].kinds;
  // Holley pp. 49-50: live oak "of enormous size" in the bottoms near the coast, Matagorda Bay to Galveston Bay.
  if (stand === 'bottomland' && region?.code === '34c') return [['live-oak', 0.3], ...base.map(([k, s]) => [k, s * 0.7])];
  // East of the Brazos the creeks run through pine country: LANDFIRE 14740's loblolly and sweetgum.
  if (stand === 'creek' && region && /^35/.test(region.code)) return [['loblolly', 0.3], ...base.map(([k, s]) => [k, s * 0.7])];
  return base;
}

const PER_PATCH = Math.round(PATCH_MILES / TREE_MILES);
const patchCentreOfCell = (column, row) => ({ x: (Math.floor(column / PER_PATCH) + 0.5) * PATCH_MILES, y: (Math.floor(row / PER_PATCH) + 0.5) * PATCH_MILES });

/** One tree's id: its lattice column and row. Stable across classes, saves and processes. */
export const treeId = (column, row) => `t:${column}:${row}`;
export function parseTreeId(id) {
  const match = /^t:(-?\d+):(-?\d+)$/.exec(id || '');
  return match ? { column: Number(match[1]), row: Number(match[2]) } : null;
}

/** The tree in one lattice cell, or null. `patch` may be passed when the caller already has it. */
export function treeInCell(column, row, options = {}, patch = null) {
  const x = (column + 0.2 + 0.6 * hash(column, row, 3)) * TREE_MILES, y = (row + 0.2 + 0.6 * hash(column, row, 4)) * TREE_MILES;
  // The patch is read at its own centre, so every tree in it agrees with `treesIn` and with `patchAt` anywhere inside.
  patch ||= patchAt(patchCentreOfCell(column, row), options);
  if (!patch.perAcre || hash(column, row, 2) >= patch.perAcre * CELL_ACRES) return null;
  const region = options.rule === 'landfire' ? ecoregionAt({ x, y }) : null;
  const species = pick(kindsAt(patch.stand, region), hash(column, row, 5));
  if (!species) return null;
  // A patch's trees run up to its size, most of them at it.
  const top = SIZES.indexOf(patch.size), roll = hash(column, row, 6);
  const size = SIZES[Math.max(0, top - (roll < 0.6 ? 0 : roll < 0.9 ? 1 : 2))];
  const logs = KINDS[species].logs[SIZES.indexOf(size)];
  return { id: treeId(column, row), x: Math.round(x * 100000) / 100000, y: Math.round(y * 100000) / 100000, kind: species, size, logs, use: KINDS[species].use };
}

/** The tree with this id, or null if no tree stands (or ever stood) there. */
export function treeById(id, options = {}) {
  const cell = parseTreeId(id);
  return cell ? treeInCell(cell.column, cell.row, options) : null;
}

/** The most trees `treesIn` returns for one box: a box bigger than this is asked for as a tint, not as trees. */
export const TREES_MOST = 6000;

/** Every tree standing in a box, patch by patch; `null` when there would be more than `TREES_MOST`. */
export function treesIn(box, options = {}) {
  const trees = [];
  const c0 = Math.floor(box.minX / TREE_MILES), c1 = Math.floor(box.maxX / TREE_MILES);
  const r0 = Math.floor(box.minY / TREE_MILES), r1 = Math.floor(box.maxY / TREE_MILES);
  const patches = new Map();
  for (let row = r0; row <= r1; row++) {
    for (let column = c0; column <= c1; column++) {
      const key = Math.floor(column / PER_PATCH) * 100003 + Math.floor(row / PER_PATCH);
      let patch = patches.get(key);
      if (!patch) { patch = patchAt(patchCentreOfCell(column, row), options); patches.set(key, patch); }
      if (!patch.perAcre) continue;
      const tree = treeInCell(column, row, options, patch);
      if (!tree) continue;
      if (tree.x < box.minX || tree.x > box.maxX || tree.y < box.minY || tree.y > box.maxY) continue;
      trees.push(tree);
      if (trees.length > TREES_MOST) return null;
    }
  }
  return trees;
}

/** How far to the nearest patch of timber, in miles, searching out to `reach`; null when there is none that near. */
export function timberMilesFrom(point, options = {}, reach = 3) {
  const here = patchAt(point, options);
  if (patchCover(here) === 'timber') return 0;
  const rings = Math.ceil(reach / PATCH_MILES);
  let best = null;
  for (let ring = 1; ring <= rings; ring++) {
    if (best !== null && (ring - 1) * PATCH_MILES > best) break;
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const px = here.px + dx, py = here.py + dy;
        const patch = patchAt({ x: (px + 0.5) * PATCH_MILES, y: (py + 0.5) * PATCH_MILES }, options);
        if (patchCover(patch) !== 'timber') continue;
        // To the patch's nearest edge.
        const ex = Math.max(px * PATCH_MILES - point.x, 0, point.x - (px + 1) * PATCH_MILES);
        const ey = Math.max(py * PATCH_MILES - point.y, 0, point.y - (py + 1) * PATCH_MILES);
        const d = Math.hypot(ex, ey);
        if (d <= reach && (best === null || d < best)) best = d;
      }
    }
  }
  return best === null ? null : Math.round(best * 100) / 100;
}

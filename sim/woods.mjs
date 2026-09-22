// The woods: what stands at every point of the land, patch by patch and tree by tree.
//
// docs/WOODS_AND_BUILDING.md §4, build step 1, and docs/BIOMES.md §7 (the country of 1836, built 2026-09-19). On the real land
// of the colonies each eighth-of-a-mile cell is one **stand**, read from LANDFIRE's modelled pre-settlement vegetation and EPA's
// ecoregions filed into the biomes of 1836 (public/terrain/colonies-woods.bin.gz, built by scripts/build-woods.mjs). Inside a
// stand the land is a mosaic of **patches** a sixteenth of a mile across, each in one of the stand's classes - open or closed,
// young or mature, grass, thicket or cane - drawn by hash in the stand's shares. Inside a patch every tree is one real tree on a
// lattice about twenty-one feet a side, placed, sized and named by hash, so the woods are never stored: only a felled tree is
// (`world.woods.felled`, step 4).
//
// The land is the same for every class, like the heights: nothing here reads a world's seed.
//
// **Two grids.** A class made since 2026-09-19 records `map.woods: 'biomes-1836'` and reads the biomes (rule `biomes`). A class
// made from 2026-09-15 to 2026-09-19 recorded `landfire-2016` and keeps reading the grid it was made on, byte for byte
// (public/terrain/colonies-woods-2016.*, rule `landfire`, with the stands of that week, `STANDS_2016`): its felled trees are
// found again by their ids, its families keep the timber they were shown, and no save version moved (CLAUDE.md: the old value
// is correct for the old class). Both rules count their trees one by one (`countsTrees`).
//
// What is history and what is not:
//   - Where each kind of country stood is LANDFIRE's model of the pre-settlement vegetation (a modern reconstruction, not a
//     survey of 1835) read for 1836 by the travellers' pattern (`HIST-TEX-094` to `-108`), with EPA's Level IV ecoregions
//     naming the country. Which setting becomes which biome, and every line drawn between them, is `FIC-GONZ-060`.
//   - The trees in each - post oak and blackjack on the savanna, pecan, elm, ash, hackberry and oaks in the bottoms with
//     cottonwood on the banks, live oak near the coast, loblolly at Bastrop and in the east, longleaf in the south-east, cedar on
//     the breaks, mesquite west of the Guadalupe, palms in the Rio Grande delta - are the models' indicator species and what the
//     travellers saw (`HIST-TEX-016`, `HIST-TEX-101`, `-102`, `-105`).
//   - The bottomland's canopy of 15 to 30 trees an acre and the post oak savanna's shares are the LANDFIRE models'. Every other
//     number of trees an acre, share of a class or a kind, the patch and lattice sizes, the logs a tree gives, the game and the
//     quarry of each stand are invented (`FIC-GONZ-032`, `FIC-GONZ-061`, `FIC-GONZ-063`).
//
// ceiling: an eighth-of-a-mile stand and a sixteenth-of-a-mile patch are the grain; a real grove's edge is sharper, and General
// Land Office bearing-tree notes for particular leagues would give a truer one.
// ceiling: the invented Gonzales country has one kind of woods, timber within 1.15 miles of its water, as its map has always
// drawn; and a class on the real land saved before the woods grid keeps the old rule (timber by the rivers and creeks).
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const ROOT = new URL('../public/terrain/', import.meta.url);
/** What a world's map records when its woods are the biomes of 1836 (docs/BIOMES.md). Every class made since 2026-09-19. */
export const WOODS_SOURCE = 'biomes-1836';
/** What a class made from 2026-09-15 to 2026-09-19 recorded: LANDFIRE's settings filed into ten stands. It keeps that grid. */
export const WOODS_SOURCE_2016 = 'landfire-2016';
/** A patch of one class is this many miles a side: 330 feet, about two and a half acres. */
export const PATCH_MILES = 1 / 16;
/** One tree at most stands in each lattice cell this many miles a side: about 21 feet. */
export const TREE_MILES = 1 / 256;
const ACRES_PER_SQUARE_MILE = 640;
const CELL_ACRES = TREE_MILES * TREE_MILES * ACRES_PER_SQUARE_MILE;
/**
 * Under the 2016 rule a creek the map draws keeps a strip of creek timber this far either side of it through prairie and
 * savanna, perennial or not (FIC-GONZ-032).
 */
export const CREEK_TIMBER_MILES = 0.1;
/**
 * Under the biomes a creek keeps its timber only where it runs all year, one or two patches wide (docs/BIOMES.md §4.6,
 * `FIC-GONZ-060`): Lincecum crossed coastal-prairie creeks in 1835 with not a bush on their banks (`HIST-TEX-094`). A patch
 * whose middle is this near a perennial creek is its timber. An intermittent creek through post oak or the hills keeps a few
 * trees (`creek-draw`); through the prairies and the mesquite, none.
 */
export const CREEK_STRIP_MILES = 0.045;
/**
 * And how wide the belt is on a running creek big enough to carry a name on the map - a bayou or a main creek (amended
 * 2026-09-19). One rule for every running creek, an eighth of a mile of trees all told, left Harrisburg with 5 in 100 timber
 * within three miles where the 2016 grid had 13, although Buffalo, Brays, Sims, Berry, Hunting and Vince bayous all run
 * through it and the town sawed lumber by steam: docs/BIOMES.md §4.6 measured that very place and warned that the strip
 * "must not simply be removed", and the width it chose removed it. Almonte, 1834, of the Brazos plains: "The plains in Brazos
 * are intercepted every fifteen or twenty miles by strips of thick forest containing good wood for the construction of
 * houses" (p. 202, `HIST-TEX-094`); TPWD puts the pre-settlement timber of the prairie belts in the bottoms of the larger
 * rivers and creeks. A small unnamed branch keeps its fringe; a dry prairie creek still keeps nothing (`HIST-TEX-094`).
 * ceiling: "named on the map" is USGS's naming, a modern hand, used here only as a stand-in for the size of the stream; the
 * General Land Office's bearing trees would give the true belt.
 */
export const CREEK_GALLERY_MILES = 0.14;
/** A river or running creek through a town's fields keeps a line of trees on its bank this far out (docs/BIOMES.md §5.1). */
export const BANK_MILES = 0.04;
/** A patch with at least this many log-sized trees an acre is timber for the going, clearing and the house site. */
export const TIMBER_TREES_PER_ACRE = 10;

/**
 * A class of patch: its share of the stand's patches, log-sized trees an acre, the size they run to, and optionally the cover
 * it is whatever its trees (`brush` for a thicket or cane) and its own kinds of tree (a live oak motte in mesquite country).
 */
const klass = (name, share, perAcre, size, extra = {}) => Object.freeze({ name, share, perAcre, size, ...extra });

/** What a hunt may find, by id, in words. Only the deer is drawn; every other is said in words until its art exists. */
export const QUARRY = Object.freeze({
  deer: 'deer', turkey: 'turkey', bear: 'bear', bison: 'buffalo', pronghorn: 'antelope', mustang: 'mustangs',
  javelina: 'javelina', waterfowl: 'ducks and geese', cattle: 'wild cattle',
});

/**
 * The stands of the week of 2026-09-15, exactly as they were, for a class that recorded `landfire-2016`. Do not change them:
 * an old class's trees, patches and hunts are worked out from these.
 */
export const STANDS_2016 = Object.freeze({
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

const CREEK_KINDS = STANDS_2016.creek.kinds;
/**
 * The biomes of 1836 (docs/BIOMES.md §7.1): each stand's name, its game (0-1, how long a hunter waits: `sim/hunting.mjs`), what
 * a hunt may find there (`quarry`, words only but the deer), its classes of patch and its kinds of tree, most common first.
 * `note` says where each comes from. Balance is the next session's: these are the research's proposals as written.
 */
export const STANDS = Object.freeze({
  'tallgrass-prairie': {
    name: 'tallgrass prairie', game: 0.2, quarry: ['deer', 'bison'],
    note: 'LANDFIRE 14220, 14230, 14290: burned every two years. Grass, with a motte of oaks in sixty patches (BIOMES §4.3).',
    classes: [klass('grass', 59 / 60, 0, null), klass('motte', 1 / 60, 3, 'large')],
    kinds: [['bur-oak', 0.3], ['post-oak', 0.3], ['elm', 0.2], ['hackberry', 0.2]],
  },
  'coastal-prairie': {
    name: 'coastal prairie', game: 0.25, quarry: ['deer', 'waterfowl', 'cattle', 'mustang'],
    note: 'LANDFIRE 14340. Holley p. 51: "points and islands of timber"; Lincecum 1835: creeks with not a bush on their banks.',
    classes: [klass('grass', 79 / 80, 0, null), klass('motte', 1 / 80, 3, 'large')],
    kinds: [['live-oak', 0.7], ['ash', 0.3]],
  },
  'salt-prairie': {
    name: 'salt prairie', game: 0.15, quarry: ['waterfowl'],
    note: 'LANDFIRE 14860, round the bays.', classes: [klass('grass', 1, 0, null)], kinds: [],
  },
  dunes: {
    name: 'dunes and beach grass', game: 0.05, quarry: [],
    note: 'LANDFIRE 14370 and barren 31: the islands and the sand flats. Padre "a belt of dunes" (HIST-TEX-106).',
    classes: [klass('grass', 0.5, 0, null), klass('sand', 0.5, 0, null)], kinds: [],
  },
  'mixedgrass-prairie': {
    name: 'mixed-grass prairie', game: 0.3, quarry: ['bison', 'pronghorn', 'deer'],
    note: 'LANDFIRE 11320, 11490, 11480, 10940, 15040: the plateau tops and the north-west corner.',
    classes: [klass('grass', 49 / 50, 0, null), klass('mesquite', 1 / 50, 2, 'pole')],
    kinds: [['mesquite', 1]],
  },
  // The antelope came off this stand on 2026-09-20 (`HIST-TEX-260`): the mesquite prairie runs east to 95°W in this grid,
  // and holding the antelope to the Lavaca still left it at Goliad, Refugio and Béxar, where no account puts one.
  'mesquite-savanna': {
    name: 'mesquite prairie', game: 0.5, quarry: ['deer', 'mustang', 'javelina', 'turkey'],
    note: 'LANDFIRE 14380, 14400, 14420, and the thornscrub north-east of the Nueces. Olmsted p. 267: "a mesquit prairie".',
    classes: [
      klass('grass', 0.7, 0, null), klass('scattered mesquite', 0.18, 4, 'pole'), klass('thicket', 0.1, 0, null, { cover: 'brush' }),
      klass('motte', 0.02, 15, 'large', { kinds: [['live-oak', 0.8], ['hackberry', 0.2]] }),
    ],
    kinds: [['mesquite', 1]],
  },
  // The antelope's own country, with the mixed-grass prairie (2026-09-20, `HIST-TEX-260`): Olmsted met "one small herd of
  // antelope" among the "dwarf forest of prickly shrubs" on the frontier road west of San Antonio (p. 313) and puts them
  // with the mustangs and hares in "the grassed region below the chaparral wilderness, extending to the coast" (p. 443);
  // Bartlett, crossing from the Rio Grande to Corpus in December 1852, found "Thousands of deer and antelope" on the same
  // prairies (Bailey 1905, p. 67). They come on this stand's `grass` patches, which is where those accounts put them.
  chaparral: {
    name: 'chaparral', game: 0.5, quarry: ['javelina', 'deer', 'turkey', 'pronghorn'],
    note: 'LANDFIRE 13900, 13920 south-west of the Nueces and in Mexico; 14390, 11110. Olmsted p. 284: "the great chaparral desert".',
    classes: [klass('thicket', 0.45, 0, null, { cover: 'brush' }), klass('mesquite', 0.25, 15, 'pole', { cover: 'brush' }), klass('grass', 0.3, 0, null)],
    kinds: [['mesquite', 1]],
  },
  'post-oak': { ...STANDS_2016['post-oak'], quarry: ['deer', 'turkey', 'bear'] },
  'cross-timbers': {
    name: 'cross timbers', game: 0.6, quarry: ['deer', 'turkey', 'bison'],
    note: 'LANDFIRE 13080. "A formidable obstacle to travelers because of the density of growth" (TSHA, HIST-TEX-107).',
    classes: [klass('closed', 0.4, 30, 'log'), klass('open', 0.45, 8, 'large'), klass('early', 0.15, 0, null)],
    kinds: [['blackjack', 0.5], ['post-oak', 0.4], ['hickory', 0.1]],
  },
  pine: { ...STANDS_2016.pine, quarry: ['deer', 'turkey', 'bear'] },
  longleaf: {
    name: 'longleaf pine woods', game: 0.6, quarry: ['deer', 'turkey'],
    note: 'LANDFIRE 13480, 14510: burned every two to four years; near-pure open stands over bluestem (HIST-TEX-101).',
    classes: [klass('open mature', 0.7, 12, 'large'), klass('young', 0.2, 30, 'pole'), klass('gap', 0.1, 0, null)],
    kinds: [['longleaf', 0.9], ['blackjack', 0.1]],
  },
  thicket: {
    name: 'big thicket', game: 0.8, quarry: ['bear', 'deer', 'turkey'],
    note: 'LANDFIRE 13230, 15060, and the pine inside the Big Thicket: beech, magnolia, loblolly, baygalls (HIST-TEX-101).',
    classes: [klass('closed', 0.7, 40, 'large'), klass('open', 0.2, 20, 'log'), klass('baygall', 0.1, 0, null, { cover: 'brush' })],
    kinds: [['loblolly', 0.3], ['beech', 0.15], ['magnolia', 0.15], ['white-oak', 0.15], ['water-oak', 0.15], ['sweetgum', 0.1]],
  },
  bottomland: { ...STANDS_2016.bottomland, quarry: ['deer', 'turkey', 'bear'] },
  'bottomland-cane': {
    name: 'bottomland timber and cane', game: 1, quarry: ['deer', 'turkey', 'bear'],
    note: 'LANDFIRE 14730 in the coastal bottoms (EPA 34c, 33f below 29.6°N): fifteen patches in a hundred of its closed middle and gaps are cane (HIST-TEX-100).',
    classes: [klass('closed mature', 0.43, 30, 'large'), klass('open mature', 0.31, 15, 'large'), klass('closed middle', 0.06, 40, 'pole'), klass('gap', 0.05, 0, null), klass('cane', 0.15, 0, null, { cover: 'brush' })],
    kinds: STANDS_2016.bottomland.kinds,
  },
  canebrake: {
    name: 'canebrake', game: 1, quarry: ['bear', 'deer'],
    note: 'Caney Creek and Oyster Creek: "an uninterrupted cane-brake", "Scarcely a tree" (Holley pp. 16-17, HIST-TEX-100).',
    classes: [klass('cane', 0.85, 0, null, { cover: 'brush' }), klass('trees', 0.15, 5, 'large')],
    kinds: [['live-oak', 0.4], ['pecan', 0.3], ['elm', 0.3]],
  },
  'cypress-swamp': {
    name: 'cypress swamp', game: 0.6, quarry: ['bear', 'waterfowl'],
    note: 'LANDFIRE 14800, fire every 410 years: cypress and tupelo in the Sabine and Neches lowlands.',
    classes: [klass('closed', 0.8, 40, 'large'), klass('open water', 0.2, 0, null)],
    kinds: [['bald-cypress', 0.8], ['tupelo', 0.2]],
  },
  creek: { ...STANDS_2016.creek, quarry: ['deer', 'turkey'] },
  'creek-draw': {
    name: 'trees along a dry creek', game: 0.6, quarry: ['deer', 'turkey'],
    note: 'An intermittent creek through post oak or the hills: a few trees, not closed woods (BIOMES §4.6).',
    classes: [klass('scattered', 0.6, 6, 'large'), klass('gap', 0.4, 0, null)],
    kinds: CREEK_KINDS,
  },
  bank: {
    name: 'trees along the bank', game: 0.4, quarry: ['deer', 'turkey'],
    note: 'A line of pecan, cypress and cottonwood on a river through a town\'s fields (BIOMES §5.1, HIST-TEX-099).',
    classes: [klass('trees', 0.75, 15, 'large'), klass('gap', 0.25, 0, null)],
    kinds: [['pecan', 0.4], ['bald-cypress', 0.2], ['cottonwood', 0.2], ['willow', 0.2]],
  },
  'thorn-riparian': {
    name: 'river woods of the brush country', game: 0.9, quarry: ['deer', 'turkey', 'javelina'],
    note: 'LANDFIRE 14760, 11550: hackberry, cedar elm, Mexican ash, anacua (BIOMES §4.11).',
    classes: [klass('closed', 0.55, 25, 'large'), klass('open', 0.3, 10, 'log'), klass('gap', 0.15, 0, null)],
    kinds: [['hackberry', 0.3], ['cedar-elm', 0.25], ['ash', 0.2], ['anacua', 0.15], ['willow', 0.1]],
  },
  'palm-grove': {
    name: 'palm grove', game: 0.8, quarry: ['deer', 'javelina', 'waterfowl'],
    note: 'LANDFIRE 14760 in the delta: the Texas palm, 40 to 60 feet, up to eighty miles inland (HIST-TEX-105).',
    classes: [
      klass('palms', 0.45, 30, 'large', { kinds: [['palm', 1]] }), klass('riparian', 0.35, 20, 'log', { kinds: [['ebony', 0.4], ['hackberry', 0.6]] }),
      klass('open', 0.2, 0, null),
    ],
    kinds: [['palm', 0.5], ['ebony', 0.2], ['hackberry', 0.3]],
  },
  'live-oak': {
    name: 'live oak mottes', game: 0.6, quarry: ['deer', 'turkey', 'mustang'],
    note: 'LANDFIRE 13380, 13390: on the sand plain mottes in grass, not a forest (HIST-TEX-106).',
    classes: [klass('motte', 0.4, 25, 'large'), klass('grass', 0.6, 0, null)],
    kinds: [['live-oak', 0.7], ['hackberry', 0.3]],
  },
  // The antelope came off the tops on 2026-09-20 (`HIST-TEX-260`): the hills in this box are the *eastern* Edwards Plateau,
  // from Béxar to Mina, and the nearest dated antelope on the plateau is Bailey's, thirty miles north-west of Rock Springs,
  // a hundred and twenty miles further west and seventy years later. The buffalo stays, rare: Berlandier hunted them with
  // the Comanches "on open lands northwest of San Antonio" in 1828 (`HIST-TEX-104`).
  'hill-savanna': {
    name: 'hill country savanna', game: 0.5, quarry: ['deer', 'turkey', 'bison', 'bear'],
    note: 'LANDFIRE 13830: open grass with oak mottes; cedar on the breaks (HIST-TEX-102).',
    classes: [
      klass('open', 0.75, 3, 'large'), klass('motte', 0.2, 25, 'large', { kinds: [['live-oak', 0.6], ['texas-oak', 0.2], ['cedar-elm', 0.2]] }),
      klass('cedar', 0.05, 30, 'pole', { kinds: [['cedar', 1]] }),
    ],
    kinds: [['live-oak', 0.45], ['texas-oak', 0.2], ['cedar-elm', 0.15], ['cedar', 0.1], ['pecan', 0.1]],
  },
  'cedar-brake': {
    name: 'cedar brake', game: 0.8, quarry: ['deer', 'turkey', 'bear'],
    note: 'LANDFIRE 15230, 15240, 13930: the steep breaks and canyons where fire did not reach (HIST-TEX-102).',
    classes: [klass('closed', 0.6, 40, 'log'), klass('open', 0.4, 8, 'log')],
    kinds: [['cedar', 0.6], ['texas-oak', 0.2], ['cedar-elm', 0.2]],
  },
  marsh: { name: 'marsh', game: 0.3, quarry: ['waterfowl'], note: 'LANDFIRE 14900 tidal marsh and 14950 ponds.', classes: [klass('marsh', 1, 0, null)], kinds: [] },
  fields: {
    name: 'fields', game: 0.1, quarry: [],
    note: 'A town\'s farmland: Béxar\'s irrigated labores from the head of the river to Espada, a ring round every other town (FIC-GONZ-062).',
    classes: [klass('field', 1, 0, null)], kinds: [],
  },
  water: { ...STANDS_2016.water, quarry: [] },
  none: { ...STANDS_2016.none, quarry: [] },
});

/** The stand's own entry under a rule; a stand the rule's own table lacks (the country outside the box) is the biomes'. */
export function standOf(stand, rule = 'biomes') {
  return (rule !== 'biomes' && STANDS_2016[stand]) || STANDS[stand] || STANDS_2016[stand] || STANDS.none;
}

/**
 * The kinds of tree, and what a felled one gives: logs by size (pole, log, large) and what they are good for - `wall` logs
 * straight enough to lay up, `sill` logs that do not rot on the ground, `poor` logs that do, or none at all. Holley:
 * cottonwood the least valuable timber but easy to cut; mesquite no bigger than a peach tree (`HIST-TEX-016`). The counts are
 * invented (`FIC-GONZ-032`, `FIC-GONZ-061`). `picture` is the tree art it is drawn with; `sized` when the art comes at `-pole`,
 * `-log` and `-large`; `scale` how much taller than the picture's own height it is drawn; `stump` the stump's picture.
 * The order is the trees tiles' numbering (sim/woods-view.mjs): a new kind goes at the end.
 */
const kind = (name, logs, use, fell, picture, look = {}) => Object.freeze({ name, logs: Object.freeze(logs), use, fell, picture, sized: false, scale: 1, stump: 'stump-post-oak', ...look });
const SIZED = { sized: true };
export const KINDS = Object.freeze({
  // `trees-colonies-2`, 2026-09-21: post oak, blackjack, pecan, hackberry and sweetgum now have their own pole, log and
  // large art (docs/ART_DELIVERY_2026-09-21-TREES-COLONIES-2.md). The other oaks take the post oak's - they are oaks, and
  // it is nearer than the generic broadleaf they had - and the hickory, walnut and ash the pecan's, as they always did.
  'post-oak': kind('post oak', [1, 2, 2], 'sill', 1, 'post-oak', SIZED),
  blackjack: kind('blackjack oak', [1, 1, 2], 'poor', 1, 'blackjack', SIZED),
  hickory: kind('hickory', [1, 2, 2], 'wall', 1.2, 'pecan', SIZED),
  'live-oak': kind('live oak', [0, 1, 1], 'sill', 1.5, 'live-oak', SIZED),
  'water-oak': kind('water oak', [1, 2, 3], 'wall', 1, 'post-oak', SIZED),
  pecan: kind('pecan', [1, 2, 2], 'wall', 1.2, 'pecan', SIZED),
  walnut: kind('walnut', [1, 2, 2], 'wall', 1.2, 'pecan', SIZED),
  elm: kind('elm', [1, 2, 2], 'poor', 1, 'elm', SIZED),
  ash: kind('ash', [1, 2, 3], 'wall', 1, 'pecan', SIZED),
  hackberry: kind('hackberry', [1, 1, 2], 'poor', 0.8, 'hackberry', SIZED),
  cottonwood: kind('cottonwood', [2, 3, 3], 'poor', 0.6, 'cottonwood', { stump: 'stump-cottonwood' }),
  sycamore: kind('sycamore', [1, 2, 3], 'poor', 1, 'cottonwood', { stump: 'stump-cottonwood' }),
  cedar: kind('cedar', [1, 1, 2], 'sill', 0.8, 'cedar', SIZED),
  loblolly: kind('loblolly pine', [2, 3, 4], 'wall', 0.8, 'pine-loblolly', { sized: true, stump: 'stump-pine-loblolly' }),
  shortleaf: kind('shortleaf pine', [2, 3, 3], 'wall', 0.8, 'pine-loblolly', { sized: true, stump: 'stump-pine-loblolly' }),
  mesquite: kind('mesquite', [0, 0, 0], 'none', 0.6, 'mesquite', SIZED),
  // The biomes of 1836 (docs/BIOMES.md §7.1, 2026-09-19). stand-in: docs/ART_REQUESTS.md, request 2026-09-19 - the country of
  // The principal indicator species now have their own art. Beech and magnolia have log and large frames; their rare pole-size
  // juveniles use the log frame at reduced scale until a botanically useful juvenile silhouette is requested.
  'bur-oak': kind('bur oak', [1, 2, 2], 'sill', 1.1, 'post-oak', SIZED),
  longleaf: kind('longleaf pine', [2, 3, 4], 'wall', 0.8, 'pine-longleaf', { sized: true, stump: 'stump-pine-loblolly' }),
  beech: kind('beech', [1, 2, 3], 'poor', 1.1, 'beech-log', { pictures: ['beech-log', 'beech-log', 'beech-large'] }),
  magnolia: kind('magnolia', [1, 2, 2], 'poor', 1, 'magnolia-log', { pictures: ['magnolia-log', 'magnolia-log', 'magnolia-large'] }),
  'white-oak': kind('white oak', [1, 2, 3], 'sill', 1.1, 'post-oak', SIZED),
  sweetgum: kind('sweetgum', [1, 2, 3], 'poor', 0.9, 'sweetgum', SIZED),
  'bald-cypress': kind('bald cypress', [2, 3, 4], 'sill', 1, 'cypress-bald', { sized: true }),
  tupelo: kind('tupelo', [1, 2, 2], 'poor', 0.9, 'elm', SIZED),
  'cedar-elm': kind('cedar elm', [1, 1, 2], 'poor', 1, 'elm', SIZED),
  anacua: kind('anacua', [0, 1, 1], 'poor', 1, 'oak-spreading'),
  ebony: kind('Texas ebony', [0, 1, 1], 'poor', 1.3, 'oak-spreading'),
  willow: kind('willow', [1, 2, 2], 'poor', 0.6, 'cottonwood', { stump: 'stump-cottonwood' }),
  palm: kind('Texas palm', [0, 1, 1], 'poor', 0.8, 'palm-sabal', { sized: true }),
  'texas-oak': kind('Texas oak', [1, 1, 2], 'poor', 1, 'post-oak', SIZED),
});
export const SIZES = Object.freeze(['pole', 'log', 'large']);

// ---- the grids ---------------------------------------------------------------------------------------------

/** Where each rule's grid is. Both are on the elevation grid; the 2016 one is the file classes of that week were made on. */
const GRID_FILES = Object.freeze({
  biomes: ['colonies-woods.json.gz', 'colonies-woods.bin.gz'],
  landfire: ['colonies-woods-2016.json.gz', 'colonies-woods-2016.bin.gz'],
});
const grids = {};
const gridKey = rule => rule === 'landfire' ? 'landfire' : 'biomes';
function loadGrid(rule = 'biomes') {
  const key = gridKey(rule);
  if (grids[key]) return grids[key];
  const [headerFile, cellsFile] = GRID_FILES[key];
  const header = JSON.parse(gunzipSync(readFileSync(new URL(headerFile, ROOT))).toString('utf8'));
  const cells = gunzipSync(readFileSync(new URL(cellsFile, ROOT)));
  const { minX, minY, columns, rows, cell } = header.grid;
  if (cells.length !== columns * rows) throw new Error('The woods grid is not the size its header says');
  const eco = header.ecoregions;
  // The byte order is the header's own list of stands: the two grids number their stands differently.
  grids[key] = { minX, minY, columns, rows, cell, cells, order: header.stands.map(stand => stand.id), eco: { ...eco, cells: Buffer.from(eco.grid, 'base64') } };
  return grids[key];
}

/** The stand of the grid cell a point lies in, before any creek is considered; 'none' off the grid. */
export function gridStandAt(point, rule = 'biomes') {
  const { minX, minY, columns, rows, cell, cells, order } = loadGrid(rule);
  const column = Math.floor((point.x - minX) / cell), row = Math.floor((point.y - minY) / cell);
  if (column < 0 || row < 0 || column >= columns || row >= rows) return 'none';
  return order[cells[row * columns + column]] || 'none';
}

/** The EPA Level IV ecoregion a point lies in, as `{ code, name }`, or null outside Texas. The same in both grids. */
export function ecoregionAt(point, rule = 'biomes') {
  const { minX, minY, eco } = loadGrid(rule);
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
 * How a world's woods are decided: `biomes` for a real-land class made since 2026-09-19, `landfire` for one made from
 * 2026-09-15 to 2026-09-19 (its own grid), `rivers` for a real-land class saved before the woods grid (timber by the rivers and
 * creeks, as it always had), `invented` for the Gonzales country.
 */
export function woodsRule(world) {
  const woods = world?.map?.woods;
  if (woods === WOODS_SOURCE) return 'biomes';
  if (woods === WOODS_SOURCE_2016) return 'landfire';
  return world?.map?.source === 'texas-colonies-map' ? 'rivers' : 'invented';
}
/** Whether a rule counts its trees one by one, from a grid: the biomes and the 2016 grid. The other two have only a rule. */
export const countsTrees = rule => rule === 'biomes' || rule === 'landfire';

/** Under the biomes, the stands a creek that runs all year carries its timber through; the brush country's is its own river woods. */
const PERENNIAL_STRIP = new Set(['tallgrass-prairie', 'coastal-prairie', 'mixedgrass-prairie', 'mesquite-savanna', 'chaparral', 'post-oak', 'cross-timbers', 'hill-savanna']);
const THORN_STRIP = new Set(['mesquite-savanna', 'chaparral']);
/**
 * And the stands where a named running creek carries a belt and not a fringe (`CREEK_GALLERY_MILES`): the plains, whose
 * creeks run in wide alluvial bottoms - Almonte's "strips of thick forest" on the Brazos plains, Harrisburg's bayous. Not
 * the Hill Country: a creek there runs in a limestone channel and keeps "a thin belt of wood" (Olmsted p. 445), and
 * widening it would put the hills back at two in five timber, which `HIST-TEX-102` says they were not.
 */
const GALLERY_STRIP = new Set(['tallgrass-prairie', 'coastal-prairie', 'mixedgrass-prairie', 'mesquite-savanna', 'chaparral', 'post-oak', 'cross-timbers']);
/** And the stands an intermittent creek keeps a few trees in. Through the prairies and the mesquite it keeps none. */
const DRAW_STRIP = new Set(['post-oak', 'cross-timbers', 'hill-savanna']);
const STRIP_2016 = new Set(['prairie', 'post-oak', 'hill-savanna', 'brush']);

/**
 * The stand at a point. `nearCreek(point, miles, flow)` says whether a creek the map draws is within that far - `flow`
 * 'perennial' or 'intermittent' for one that runs all year or not, 'bank' for any river or creek that runs all year, or none
 * for any creek. The grid is too coarse to see a narrow creek's timber, so a creek keeps its strip (above).
 * `rule` is `woodsRule(world)`; the rivers and invented rules have only creek timber and prairie, `timberAt` saying which.
 */
export function standAt(point, { rule = 'biomes', nearCreek = null, timberAt = null, beyond = null } = {}) {
  if (!countsTrees(rule)) return timberAt?.(point) ? 'creek' : 'prairie';
  // `beyond(point)` is the stand where the box's grid has none: passed only by the map's woods tiles (sim/woods-view.mjs), so
  // the country outside the box is drawn with woods (docs/MAP_ACCURACY.md §8). The simulation never passes it, and never
  // sees a tree past the box.
  let stand = gridStandAt(point, rule);
  if (stand === 'none' && beyond) stand = beyond(point);
  if (!nearCreek) return stand;
  if (rule === 'landfire') return STRIP_2016.has(stand) && nearCreek(point, CREEK_TIMBER_MILES) ? 'creek' : stand;
  if (stand === 'fields') return nearCreek(point, BANK_MILES, 'bank') ? 'bank' : stand;
  // A running creek carries timber as wide as the creek is big: a belt on a named bayou or main creek, a fringe on an
  // unnamed branch (`CREEK_GALLERY_MILES`, `CREEK_STRIP_MILES`).
  if (PERENNIAL_STRIP.has(stand) && ((GALLERY_STRIP.has(stand) && nearCreek(point, CREEK_GALLERY_MILES, 'gallery')) || nearCreek(point, CREEK_STRIP_MILES, 'perennial'))) {
    return THORN_STRIP.has(stand) ? 'thorn-riparian' : 'creek';
  }
  if (DRAW_STRIP.has(stand) && nearCreek(point, CREEK_STRIP_MILES, 'intermittent')) return 'creek-draw';
  return stand;
}

/** The patch a point lies in: its integer position, its stand and its class, with that class's trees an acre and cover. */
export function patchAt(point, options = {}) {
  const px = Math.floor(point.x / PATCH_MILES), py = Math.floor(point.y / PATCH_MILES);
  const centre = { x: (px + 0.5) * PATCH_MILES, y: (py + 0.5) * PATCH_MILES };
  const stand = standAt(centre, options);
  const { classes } = standOf(stand, options.rule ?? 'biomes');
  const chosen = pick(classes.map(c => [c, c.share]), hash(px, py, 1));
  return { px, py, stand, class: chosen.name, perAcre: chosen.perAcre, size: chosen.size, cover: chosen.cover || null, kinds: chosen.kinds || null };
}

/**
 * Whether a patch is timber for the going, clearing and the house site: a thicket, cane or mesquite brush is brush, never
 * timber; ten or more log-sized trees an acre is timber; the rest is open.
 */
export const patchCover = patch => patch.cover || (patch.stand === 'brush' ? 'brush' : patch.perAcre >= TIMBER_TREES_PER_ACRE ? 'timber' : 'open');

/** The kinds of tree in this stand at this place: live oak comes into the coastal bottoms, pine and gum the eastern creeks. */
function kindsAt(stand, region, rule) {
  const base = standOf(stand, rule).kinds;
  // Holley pp. 49-50: live oak "of enormous size" in the bottoms near the coast, Matagorda Bay to Galveston Bay.
  if ((stand === 'bottomland' || stand === 'bottomland-cane') && region?.code === '34c') return [['live-oak', 0.3], ...base.map(([k, s]) => [k, s * 0.7])];
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
  const rule = options.rule ?? 'biomes';
  const region = countsTrees(rule) ? ecoregionAt({ x, y }, rule) : null;
  const species = pick(patch.kinds || kindsAt(patch.stand, region, rule), hash(column, row, 5));
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

// What kind of land each part of the colonies is: its cover and its lie. docs/MAP_ACCURACY.md §5.
//
// Built by scripts/build-land.mjs into public/terrain/colonies-land.bin.gz (every eighth-of-a-mile cell) and
// colonies-land.json.gz (the legend, and the same classes a half mile, two miles and eight miles at a time with a
// hillshade, for the map zoomed out). The same for every class, like the heights and the woods: nothing here reads a
// world, and nothing of it is copied into a save.
//
// For the map only. Hunting, felling, clearing and the going read the woods (sim/woods.mjs), which this is drawn from
// and never overrides.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

/**
 * The land classes, in the order of the low `LAND_BITS` bits of a cell. `colour` is a suggestion for the renderer (the page's
 * own washes are public/ground-classes.js). The first eleven are the classes of 2026-09-17, in their old order; `prairie` and
 * `brush` are no longer written (the biomes of 1836 divide them, docs/BIOMES.md §7.2) and are kept so an old legend still reads.
 */
export const LAND = Object.freeze([
  { id: 'none', name: 'off the map', colour: null },
  { id: 'water', name: 'the Gulf and its bays', colour: '#8fb0bd' },
  { id: 'prairie', name: 'prairie (before 2026-09-19)', colour: '#d9dcb2' },
  { id: 'marsh', name: 'coastal marsh', colour: '#9fb195' },
  { id: 'sand', name: 'sand, beach and dunes', colour: '#e6dcb4' },
  { id: 'savanna', name: 'post oak savanna', colour: '#a9b681' },
  { id: 'floodplain', name: 'bottomland and creek timber', colour: '#6f8a55' },
  { id: 'pine', name: 'pine woods', colour: '#56704a' },
  { id: 'live-oak', name: 'live oak mottes', colour: '#7a9160' },
  { id: 'brush', name: 'mesquite and thornscrub brush (before 2026-09-19)', colour: '#b4ac81' },
  { id: 'hill-country', name: 'hill country savanna', colour: '#c2b891' },
  { id: 'tallgrass-prairie', name: 'tallgrass prairie', colour: '#cec48c' },
  { id: 'coastal-prairie', name: 'coastal prairie', colour: '#c4cd96' },
  { id: 'mixedgrass-prairie', name: 'mixed-grass prairie', colour: '#d6cda0' },
  { id: 'salt-prairie', name: 'salt prairie', colour: '#cdcdaf' },
  { id: 'mesquite-savanna', name: 'mesquite prairie', colour: '#c8be8c' },
  { id: 'chaparral', name: 'chaparral', colour: '#9ea076' },
  { id: 'cross-timbers', name: 'cross timbers', colour: '#96a66e' },
  { id: 'longleaf', name: 'longleaf pine woods', colour: '#788c5a' },
  { id: 'thicket', name: 'the Big Thicket', colour: '#466240' },
  { id: 'canebrake', name: 'canebrake', colour: '#96aa5a' },
  { id: 'cypress-swamp', name: 'cypress swamp', colour: '#5a6e5a' },
  { id: 'cedar-brake', name: 'cedar brake', colour: '#69785f' },
  { id: 'palm-grove', name: 'palm grove', colour: '#78965a' },
  { id: 'fields', name: 'town fields', colour: '#baa06e' },
  { id: 'thorn-riparian', name: 'river woods of the brush country', colour: '#7d8a5a' },
].map(Object.freeze));
/** How many low bits of a cell hold its land class (since 2026-09-19; four before). The relief is the bits above. */
export const LAND_BITS = 5;
/** The relief classes, in the order of the bits above `LAND_BITS` of a cell. */
export const RELIEF = Object.freeze([
  { id: 'flat', name: 'flat', note: 'under 15 m of rise within a mile and under 1.5 in 100' },
  { id: 'rolling', name: 'rolling', note: '15 to 35 m, or 1.5 to 3 in 100' },
  { id: 'hills', name: 'hills', note: '35 to 70 m, or 3 to 7 in 100' },
  { id: 'steep', name: 'steep hills', note: '70 m or more, or 7 in 100 or more' },
  { id: 'bluff', name: 'bluff or steep bank', note: '4 in 100 or more within a quarter mile of a river or bayou' },
  { id: 'escarpment', name: 'the Balcones Escarpment', note: 'hills or steep within two miles of the line between the Edwards Plateau and the plains' },
].map(Object.freeze));
/** The coarser bands, miles a cell. The eighth-of-a-mile grid is the finest. */
export const LAND_BANDS = Object.freeze([0.5, 2, 8]);

const ROOT = new URL('../public/terrain/', import.meta.url);
let loaded = null;
/** The legend, the bands (base64 still) and the native grid. */
export function landData() {
  if (loaded) return loaded;
  const header = JSON.parse(gunzipSync(readFileSync(new URL('colonies-land.json.gz', ROOT))).toString('utf8'));
  const cells = gunzipSync(readFileSync(new URL(header.native.file, ROOT)));
  if (cells.length !== header.native.columns * header.native.rows) throw new Error('The land grid is not the size its header says');
  loaded = { header, cells };
  return loaded;
}

/** How many low bits of a land file's cell are its land class: its header's `landBits`, or four in a file built before. */
export const landBitsOf = header => header?.landBits || 4;
/** A cell byte as `{ land, relief }`, by a header's legend and bits. */
export function decodeCell(byte, header) {
  const bits = landBitsOf(header), legend = header?.land || LAND, reliefs = header?.relief || RELIEF;
  return { land: legend[byte & ((1 << bits) - 1)]?.id ?? 'none', relief: reliefs[byte >> bits]?.id ?? 'flat' };
}
const decode = (byte, header) => decodeCell(byte, header);

/** The land and relief at a point in the game's miles, from the eighth-of-a-mile grid; off the grid is `none`. */
export function landAt(x, y) {
  const { header, cells } = landData();
  const { minX, minY, columns, rows, cell } = header.native;
  const c = Math.floor((x - minX) / cell), r = Math.floor((y - minY) / cell);
  if (c < 0 || r < 0 || c >= columns || r >= rows) return { land: 'none', relief: 'flat' };
  return decode(cells[r * columns + c], header);
}

/** One coarser band decoded: `at(x, y)` gives { land, relief, shade }. */
export function landBand(index) {
  const band = landData().header.bands[index];
  if (!band) return null;
  const classes = Buffer.from(band.classes, 'base64'), shade = Buffer.from(band.shade, 'base64');
  return {
    ...band, classes, shade,
    at(x, y) {
      const c = Math.floor((x - band.minX) / band.cell), r = Math.floor((y - band.minY) / band.cell);
      if (c < 0 || r < 0 || c >= band.columns || r >= band.rows) return { land: 'none', relief: 'flat', shade: 128 };
      return { ...decode(classes[r * band.columns + c], landData().header), shade: shade[r * band.columns + c] };
    },
  };
}

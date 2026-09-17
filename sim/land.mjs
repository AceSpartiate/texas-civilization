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

/** The land classes, in the order of the low four bits of a cell. `colour` is a suggestion for the renderer. */
export const LAND = Object.freeze([
  { id: 'none', name: 'off the map', colour: null },
  { id: 'water', name: 'the Gulf and its bays', colour: '#8fb0bd' },
  { id: 'prairie', name: 'tallgrass and coastal prairie', colour: '#d9dcb2' },
  { id: 'marsh', name: 'coastal marsh and salt prairie', colour: '#9fb195' },
  { id: 'sand', name: 'sand and beach', colour: '#e6dcb4' },
  { id: 'savanna', name: 'post oak savanna', colour: '#a9b681' },
  { id: 'floodplain', name: 'bottomland and floodplain forest', colour: '#6f8a55' },
  { id: 'pine', name: 'pine forest', colour: '#56704a' },
  { id: 'live-oak', name: 'live oak woods', colour: '#7a9160' },
  { id: 'brush', name: 'mesquite and thornscrub brush', colour: '#b4ac81' },
  { id: 'hill-country', name: 'hill country oak and juniper savanna', colour: '#c2b891' },
].map(Object.freeze));
/** The relief classes, in the order of the high four bits of a cell. */
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

const decode = (byte, legend = LAND, reliefs = RELIEF) => ({ land: legend[byte & 15]?.id ?? 'none', relief: reliefs[byte >> 4]?.id ?? 'flat' });

/** The land and relief at a point in the game's miles, from the eighth-of-a-mile grid; off the grid is `none`. */
export function landAt(x, y) {
  const { header, cells } = landData();
  const { minX, minY, columns, rows, cell } = header.native;
  const c = Math.floor((x - minX) / cell), r = Math.floor((y - minY) / cell);
  if (c < 0 || r < 0 || c >= columns || r >= rows) return { land: 'none', relief: 'flat' };
  return decode(cells[r * columns + c]);
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
      return { ...decode(classes[r * band.columns + c]), shade: shade[r * band.columns + c] };
    },
  };
}

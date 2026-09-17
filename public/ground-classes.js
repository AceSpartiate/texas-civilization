// The kinds of ground the map can draw, as a table (docs/PERFORMANCE_RENDER.md, "Ground classes").
//
// Owner, 2026-09-17: "there's also desert and other land styles we need to consider. prairie, buttes, hills, etc." The land
// itself - which class stands where, and how high - is the map data's to say (public/terrain/colonies-land.json, read by
// public/land-levels.js). This file is how each class LOOKS, so a new class is one entry here and nothing else:
//
//   colour    its wash, laid over the relief as one smoothed picture of the class grid (public/app.js `drawLand`);
//   alpha     how strongly that wash covers the relief underneath, so the hills still read through it;
//   marks     what its scattered ground detail is, by the cell's `share` roll (0-1): the first entry whose `upTo` is above the
//             roll is drawn, as `sprite` at `size` figures tall, or as the `fallback` shape while the art is not loaded;
//   timber    whether the scattered detail in it is woods (oaks, handing over to the land's real trees close in).
//
// How a class meets its neighbours is the smoothing of the whole picture (public/map-base.js `smoothCover`): a soft edge
// about a cell wide, the same at every zoom, so a boundary never jumps or reshapes as the camera moves.
// ceiling: one edge softness for every class; a hard-edged class (a bluff, a river sand bar) would want its own pass.
//
// No browser imports, so it can be tested (tests/map-base.test.mjs).

/** The prairie's marks: exactly the scatter the map drew before there were classes. */
const PRAIRIE_MARKS = Object.freeze([
  { upTo: .095, sprite: 'rocks', size: .5, fallback: 'rock' },
  { upTo: .17, sprite: 'scrub', size: 1.0, fallback: 'bush' },
  { upTo: .21, sprite: 'prickly-pear', size: 1.0, fallback: 'bush' },
  { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
]);

// The ids are the land data's own (public/terrain/colonies-land.json `land`, docs/MAP_ACCURACY.md §6.2). Colours are near the
// data's, as washes: under them the relief still shows its hills.
const TIMBER_MARKS = PRAIRIE_MARKS;
export const GROUND_CLASSES = Object.freeze({
  prairie: { colour: [217, 220, 178], alpha: .22, marks: PRAIRIE_MARKS },
  savanna: { colour: [169, 182, 129], alpha: .3, marks: [
    { upTo: .06, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .16, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  floodplain: { colour: [111, 138, 85], alpha: .34, timber: true, marks: TIMBER_MARKS },
  pine: { colour: [86, 112, 74], alpha: .36, timber: true, marks: TIMBER_MARKS },
  'live-oak': { colour: [122, 145, 96], alpha: .32, timber: true, marks: TIMBER_MARKS },
  brush: { colour: [180, 172, 129], alpha: .32, marks: [
    { upTo: .08, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .34, sprite: 'mesquite-pole', size: 1.3, fallback: 'bush' },
    { upTo: .58, sprite: 'prickly-pear', size: 1.0, fallback: 'bush' },
    { upTo: .8, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  'hill-country': { colour: [194, 184, 145], alpha: .32, marks: [
    { upTo: .2, sprite: 'rocks', size: .6, fallback: 'rock' },
    { upTo: .32, sprite: 'cedar-pole', size: 1.3, fallback: 'bush' },
    { upTo: .42, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .55, fallback: 'tuft' },
  ] },
  marsh: { colour: [159, 177, 149], alpha: .34, marks: [
    { upTo: .45, sprite: 'reeds', size: .9, fallback: 'tuft' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  sand: { colour: [230, 220, 180], alpha: .42, marks: [
    { upTo: .12, sprite: 'rocks', size: .45, fallback: 'rock' },
    { upTo: .22, sprite: 'grass-tuft', size: .5, fallback: 'tuft' },
    { upTo: 1, sprite: null, size: 0, fallback: null },
  ] },
  // Outside the playable land, if the data ever carries it.
  desert: { colour: [210, 191, 142], alpha: .4, marks: [
    { upTo: .14, sprite: 'rocks', size: .55, fallback: 'rock' },
    { upTo: .3, sprite: 'prickly-pear', size: 1.0, fallback: 'bush' },
    { upTo: .42, sprite: 'mesquite-pole', size: 1.1, fallback: 'bush' },
    { upTo: .55, sprite: 'scrub', size: .9, fallback: 'bush' },
    { upTo: 1, sprite: null, size: 0, fallback: null },
  ] },
  // The sea is drawn by the province's lines; no wash and nothing scattered on it.
  water: { colour: [143, 176, 189], alpha: 0, marks: [{ upTo: 1, sprite: null, size: 0, fallback: null }] },
});

/** The class a map without a class grid is drawn as, and a class the table does not know. */
export const DEFAULT_GROUND = 'prairie';

/** The table entry for a class id, falling back to the prairie. */
export const groundClass = id => GROUND_CLASSES[id] || GROUND_CLASSES[DEFAULT_GROUND];

/** The mark a class draws for a cell's share roll. */
export function markFor(id, share) {
  const marks = groundClass(id).marks;
  return marks.find(mark => share < mark.upTo) || marks.at(-1);
}

/**
 * The class id at a point of a class grid, or the default where there is no grid or the point is off it. The grid this reads:
 * `{ minX, minY, cellMiles, columns, rows, classes: [id, ...], cells }`, `cells` a row-major array (or string of digits) of
 * indexes into `classes`. It is the shape `decodeLand` (public/land-levels.js) gives the land data's grids.
 */
export function groundClassAt(grid, x, y) {
  // A cell off the land (`none`) is drawn as the default.
  if (!grid?.cells) return DEFAULT_GROUND;
  const column = Math.floor((x - grid.minX) / grid.cellMiles), row = Math.floor((y - grid.minY) / grid.cellMiles);
  if (column < 0 || row < 0 || column >= grid.columns || row >= grid.rows) return DEFAULT_GROUND;
  const id = grid.classes?.[Number(grid.cells[row * grid.columns + column])];
  return id && id !== 'none' ? id : DEFAULT_GROUND;
}

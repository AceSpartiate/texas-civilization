// The kinds of ground the map can draw, as a table (docs/PERFORMANCE_RENDER.md, "Ground classes").
//
// Owner, 2026-09-17: "there's also desert and other land styles we need to consider. prairie, buttes, hills, etc." The land
// itself - which class stands where, and how high - is the map data's to say (a class grid on `world.map.ground`, format still
// being settled). This file is how each class LOOKS, so a new class is one entry here and nothing else:
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

export const GROUND_CLASSES = Object.freeze({
  prairie: { colour: [192, 198, 143], alpha: .28, marks: PRAIRIE_MARKS },
  savanna: { colour: [169, 182, 129], alpha: .28, marks: [
    { upTo: .06, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .16, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  'bottomland-forest': { colour: [127, 145, 102], alpha: .32, timber: true, marks: PRAIRIE_MARKS },
  'pine-forest': { colour: [111, 138, 92], alpha: .32, timber: true, marks: PRAIRIE_MARKS },
  brush: { colour: [180, 172, 129], alpha: .3, marks: [
    { upTo: .08, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .34, sprite: 'mesquite-pole', size: 1.3, fallback: 'bush' },
    { upTo: .58, sprite: 'prickly-pear', size: 1.0, fallback: 'bush' },
    { upTo: .8, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  marsh: { colour: [159, 177, 149], alpha: .32, marks: [
    { upTo: .45, sprite: 'reeds', size: .9, fallback: 'tuft' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  sand: { colour: [216, 204, 154], alpha: .38, marks: [
    { upTo: .12, sprite: 'rocks', size: .45, fallback: 'rock' },
    { upTo: .22, sprite: 'grass-tuft', size: .5, fallback: 'tuft' },
    { upTo: 1, sprite: null, size: 0, fallback: null },
  ] },
  desert: { colour: [210, 191, 142], alpha: .4, marks: [
    { upTo: .14, sprite: 'rocks', size: .55, fallback: 'rock' },
    { upTo: .3, sprite: 'prickly-pear', size: 1.0, fallback: 'bush' },
    { upTo: .42, sprite: 'mesquite-pole', size: 1.1, fallback: 'bush' },
    { upTo: .55, sprite: 'scrub', size: .9, fallback: 'bush' },
    { upTo: 1, sprite: null, size: 0, fallback: null },
  ] },
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
 * indexes into `classes`. ceiling: the format is this page's proposal; the map data's own format replaces it at merge.
 */
export function groundClassAt(grid, x, y) {
  if (!grid?.cells) return DEFAULT_GROUND;
  const column = Math.floor((x - grid.minX) / grid.cellMiles), row = Math.floor((y - grid.minY) / grid.cellMiles);
  if (column < 0 || row < 0 || column >= grid.columns || row >= grid.rows) return DEFAULT_GROUND;
  const index = Number(grid.cells[row * grid.columns + column]);
  return grid.classes?.[index] || DEFAULT_GROUND;
}

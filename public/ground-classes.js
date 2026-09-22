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
  savanna: { colour: [160, 176, 112], alpha: .45, marks: [
    { upTo: .06, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .16, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  floodplain: { colour: [111, 138, 85], alpha: .45, timber: true, marks: TIMBER_MARKS },
  pine: { colour: [86, 112, 74], alpha: .48, timber: true, marks: TIMBER_MARKS },
  'live-oak': { colour: [122, 145, 96], alpha: .45, timber: true, marks: TIMBER_MARKS },
  brush: { colour: [180, 172, 129], alpha: .32, marks: [
    { upTo: .08, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .34, sprite: 'mesquite-pole', size: 1.3, fallback: 'bush' },
    { upTo: .54, sprite: 'prickly-pear', size: 1.0, fallback: 'bush' },
    { upTo: .62, sprite: 'yucca', size: 1.1, fallback: 'bush' },
    { upTo: .8, sprite: 'thicket-thorn-1', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  'hill-country': { colour: [194, 184, 145], alpha: .45, marks: [
    { upTo: .2, sprite: 'rocks', size: .6, fallback: 'rock' },
    { upTo: .32, sprite: 'cedar-pole', size: 1.3, fallback: 'bush' },
    { upTo: .42, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .55, fallback: 'tuft' },
  ] },
  marsh: { colour: [150, 176, 150], alpha: .45, marks: [
    { upTo: .45, sprite: 'marsh-cordgrass', size: .9, fallback: 'tuft' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  sand: { colour: [230, 220, 180], alpha: .5, marks: [
    { upTo: .12, sprite: 'rocks', size: .45, fallback: 'rock' },
    { upTo: .22, sprite: 'dune-grass', size: .55, fallback: 'tuft' },
    { upTo: 1, sprite: null, size: 0, fallback: null },
  ] },
  // The biomes of 1836 (docs/BIOMES.md §7.2, 2026-09-19): each country its own wash, so the blackland, the coastal prairie,
  // the mesquite and the thicket no longer read as one pale green. Colours are the research's proposals, pushed apart; every
  // wash was made stronger the same day (about .3 to about .5) so the country's colour shows over the relief's green tint, the
  // hillshade still laid over it.
  // Astra's `biome-ground-bexar` sheet landed 2026-09-21 and these countries now wear their own plants: tall grass, cane,
  // palmetto, the thorn thicket in two forms, Spanish dagger, marsh cordgrass, dune grass and cypress knees.
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-19 - the country of 1836. Still standing in: the palm grove's palms are
  // the `sapling` drawn tall, and a town's fields are `crop-stubble` and fallow tufts, until their own art lands.
  'tallgrass-prairie': { colour: [212, 190, 118], alpha: .5, marks: [
    { upTo: .04, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .07, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tall', size: .8, fallback: 'tuft' },
  ] },
  'coastal-prairie': { colour: [180, 198, 122], alpha: .5, marks: [
    { upTo: .03, sprite: 'rocks', size: .45, fallback: 'rock' },
    { upTo: .05, sprite: 'live-oak-pole', size: 1.3, fallback: 'bush' },
    { upTo: .1, sprite: 'marsh-cordgrass', size: .8, fallback: 'tuft' },
    { upTo: 1, sprite: 'grass-tall', size: .7, fallback: 'tuft' },
  ] },
  'mixedgrass-prairie': { colour: [216, 202, 150], alpha: .5, marks: [
    { upTo: .14, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .18, sprite: 'mesquite-pole', size: 1.1, fallback: 'bush' },
    { upTo: .22, sprite: 'prickly-pear', size: .9, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .5, fallback: 'tuft' },
  ] },
  'salt-prairie': { colour: [206, 204, 172], alpha: .5, marks: [
    { upTo: .3, sprite: 'grass-tuft', size: .45, fallback: 'tuft' },
    { upTo: .42, sprite: 'marsh-cordgrass', size: .7, fallback: 'tuft' },
    { upTo: 1, sprite: null, size: 0, fallback: null },
  ] },
  'mesquite-savanna': { colour: [196, 176, 120], alpha: .5, marks: [
    { upTo: .05, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .2, sprite: 'mesquite-pole', size: 1.3, fallback: 'bush' },
    { upTo: .3, sprite: 'prickly-pear', size: 1.0, fallback: 'bush' },
    { upTo: .36, sprite: 'thicket-thorn-2', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .7, fallback: 'tuft' },
  ] },
  // Olmsted's "dwarf forest of prickly shrubs": the thorn thicket in its two forms, mesquite, prickly pear and the
  // Spanish dagger, on thin grass.
  chaparral: { colour: [140, 142, 100], alpha: .5, marks: [
    { upTo: .05, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .28, sprite: 'thicket-thorn-1', size: 1.1, fallback: 'bush' },
    { upTo: .45, sprite: 'thicket-thorn-2', size: 1.05, fallback: 'bush' },
    { upTo: .65, sprite: 'mesquite-pole', size: 1.3, fallback: 'bush' },
    { upTo: .78, sprite: 'prickly-pear', size: 1.0, fallback: 'bush' },
    { upTo: .86, sprite: 'yucca', size: 1.1, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .55, fallback: 'tuft' },
  ] },
  'cross-timbers': { colour: [138, 156, 96], alpha: .48, marks: [
    { upTo: .06, sprite: 'rocks', size: .5, fallback: 'rock' },
    { upTo: .3, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .55, fallback: 'tuft' },
  ] },
  // The longleaf floor is bluestem, waist high and open under the pines: the tall grass, not the prairie's bunch tuft.
  longleaf: { colour: [120, 140, 90], alpha: .48, timber: true, marks: [
    { upTo: .04, sprite: 'rocks', size: .45, fallback: 'rock' },
    { upTo: 1, sprite: 'grass-tall', size: .75, fallback: 'tuft' },
  ] },
  // The Big Thicket's floor: palmetto under the timber, with cane in the wetter breaks.
  thicket: { colour: [70, 98, 64], alpha: .55, timber: true, marks: [
    { upTo: .3, sprite: 'palmetto', size: .95, fallback: 'bush' },
    { upTo: .5, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: .6, sprite: 'cane-2', size: 1.3, fallback: 'tuft' },
    { upTo: 1, sprite: 'grass-tuft', size: .55, fallback: 'tuft' },
  ] },
  canebrake: { colour: [150, 170, 90], alpha: .5, marks: [
    { upTo: .4, sprite: 'cane-1', size: 1.5, fallback: 'tuft' },
    { upTo: .7, sprite: 'cane-2', size: 1.4, fallback: 'tuft' },
    { upTo: 1, sprite: 'grass-tall', size: .7, fallback: 'tuft' },
  ] },
  'cypress-swamp': { colour: [90, 110, 90], alpha: .52, timber: true, marks: [
    { upTo: .25, sprite: 'cypress-knees', size: .55, fallback: 'bush' },
    { upTo: .4, sprite: 'marsh-cordgrass', size: .9, fallback: 'tuft' },
    { upTo: 1, sprite: null, size: 0, fallback: null },
  ] },
  'cedar-brake': { colour: [105, 120, 95], alpha: .52, timber: true, marks: [
    { upTo: .45, sprite: 'cedar-pole', size: 1.3, fallback: 'bush' },
    { upTo: .6, sprite: 'rocks', size: .6, fallback: 'rock' },
    { upTo: .7, sprite: 'scrub', size: 1.0, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .5, fallback: 'tuft' },
  ] },
  'palm-grove': { colour: [120, 150, 90], alpha: .5, timber: true, marks: [
    { upTo: .15, sprite: 'palm-sabal-pole', size: 1.15, fallback: 'bush' },
    { upTo: .3, sprite: 'scrub', size: .9, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  'thorn-riparian': { colour: [125, 138, 90], alpha: .48, timber: true, marks: [
    { upTo: .3, sprite: 'thicket-thorn-1', size: 1.0, fallback: 'bush' },
    { upTo: .4, sprite: 'mesquite-pole', size: 1.2, fallback: 'bush' },
    { upTo: 1, sprite: 'grass-tuft', size: .6, fallback: 'tuft' },
  ] },
  // A town's fields (docs/BIOMES.md §5, FIC-GONZ-062): irrigated crops, stubble and fallow; families' plots still draw above.
  fields: { colour: [196, 158, 100], alpha: .55, marks: [
    { upTo: .22, sprite: 'field-irrigated-young', size: .8, fallback: 'tuft' },
    { upTo: .42, sprite: 'field-irrigated-mature', size: .85, fallback: 'tuft' },
    { upTo: .68, sprite: 'field-fallow', size: .85, fallback: 'tuft' },
    { upTo: .86, sprite: 'crop-stubble', size: .7, fallback: 'tuft' },
    { upTo: 1, sprite: 'grass-tuft', size: .5, fallback: 'tuft' },
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

// The land layer's rules, for the country outside the colonies' box (scripts/build-outside.mjs): docs/MAP_ACCURACY.md §5.
//
// These are the rules scripts/build-land.mjs applies inside the box, written out once more rather than moved out of it: the
// box's built files must come out of that script byte for byte as they are (docs/MAP_ACCURACY.md §8), and an old injection
// record edits its text (docs/evidence/map-accuracy/injections.mjs). tests/map-outside.test.mjs holds these to the box: run
// on the box's own heights they give the box's own hillshade and relief classes, so the two cannot drift apart unseen.

export const METRES_PER_MILE = 1609.344;

/** Which cover each of the woods' stands is drawn as: since 2026-09-19 one table for the box and the outside (scripts/terrain/biomes.mjs). */
export { COVER_OF_STAND, MARSH_PRAIRIES } from './biomes.mjs';
/** EPA Level IV coastal marsh ecoregions: prairie inside them is coastal marsh and salt prairie. */
export const COASTAL_MARSH_ECOREGIONS = Object.freeze(['34g', '34h', '34i']);
/** Rise and fall is read over a window this many cells either side (nine cells: about 1.1 miles). */
export const RELIEF_RADIUS = 4;
/** How far the escarpment's rough ground reaches either side of EPA's line, miles. */
export const ESCARPMENT_MILES = 2;
/** Sand and beach: low land by water that looks out this far on open water to the south-south-east. */
export const BEACH_VIEW_MILES = 6;

/** The relief class of a cell from its rise within the window (m) and its slope (per cent). Thresholds FIC-GONZ-057. */
export const reliefKind = (rise, slope) => rise >= 70 || slope >= 7 ? 'steep' : rise >= 35 || slope >= 3 ? 'hills' : rise >= 15 || slope >= 1.5 ? 'rolling' : 'flat';

/** Max minus min over a (2 × radius + 1) square window, separably, clamped at the grid's edges. */
export function windowRange(metres, columns, rows, radius = RELIEF_RADIUS) {
  const size = columns * rows;
  const at = (c, r) => metres[Math.max(0, Math.min(rows - 1, r)) * columns + Math.max(0, Math.min(columns - 1, c))];
  const rowMax = new Float32Array(size), rowMin = new Float32Array(size), range = new Float32Array(size);
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
    let hi = -Infinity, lo = Infinity;
    for (let d = -radius; d <= radius; d++) { const v = at(c + d, r); if (v > hi) hi = v; if (v < lo) lo = v; }
    rowMax[r * columns + c] = hi; rowMin[r * columns + c] = lo;
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
    let hi = -Infinity, lo = Infinity;
    for (let d = -radius; d <= radius; d++) {
      const rr = Math.max(0, Math.min(rows - 1, r + d)), j = rr * columns + c;
      if (rowMax[j] > hi) hi = rowMax[j]; if (rowMin[j] < lo) lo = rowMin[j];
    }
    range[r * columns + c] = hi - lo;
  }
  return range;
}

/** The slope across a cell, per cent, from its four neighbours (clamped at the edges). */
export function slopeAt(metres, columns, rows, c, r, cell) {
  const at = (cc, rr) => metres[Math.max(0, Math.min(rows - 1, rr)) * columns + Math.max(0, Math.min(columns - 1, cc))];
  return 100 * Math.hypot(at(c + 1, r) - at(c - 1, r), at(c, r + 1) - at(c, r - 1)) / (2 * cell * METRES_PER_MILE);
}

/** The most common value of a vote, ties to the lower code, `skip` never chosen; -1 when there is none. */
export function pickVote(votes, skip) {
  let best = -1;
  for (let v = 0; v < votes.length; v++) if (v !== skip && votes[v] && (best < 0 || votes[v] > votes[best])) best = v;
  return best;
}

/**
 * A band's hillshade from its cells' mean heights (metres, row by row): lit from the north-west at 45°, 128 level ground,
 * exaggerated more as the cells grow, in steps of eight (scripts/build-land.mjs `band`).
 */
export function bandShade(mean, bandColumns, bandRows, miles, cell) {
  const shade = new Uint8Array(bandColumns * bandRows);
  const exaggerate = 2 * Math.sqrt(miles / cell);
  const m = (c, r) => mean[Math.max(0, Math.min(bandRows - 1, r)) * bandColumns + Math.max(0, Math.min(bandColumns - 1, c))];
  const step = miles * METRES_PER_MILE;
  const light = { x: -Math.SQRT1_2 * Math.SQRT1_2, y: -Math.SQRT1_2 * Math.SQRT1_2, z: Math.SQRT1_2 };
  for (let r = 0; r < bandRows; r++) for (let c = 0; c < bandColumns; c++) {
    const dx = (m(c + 1, r) - m(c - 1, r)) / (2 * step) * exaggerate, dy = (m(c, r + 1) - m(c, r - 1)) / (2 * step) * exaggerate;
    const length = Math.hypot(dx, dy, 1);
    const lit = (-dx * light.x - dy * light.y + light.z) / length;
    shade[r * bandColumns + c] = Math.max(0, Math.min(248, Math.round((128 + (lit - light.z) * 400) / 8) * 8));
  }
  return shade;
}

/**
 * Open a water mask by a cell: only water a quarter mile across, or joined by a channel that wide, is kept; a pond joined
 * to a bay by a ditch is not the sea. `fixed(i)` marks cells whose answer is already known and kept as it is.
 */
export function openWater(sea, columns, rows, fixed = () => false) {
  const size = columns * rows, eroded = new Uint8Array(size), water = new Uint8Array(size);
  for (let r = 1; r < rows - 1; r++) for (let c = 1; c < columns - 1; c++) {
    const i = r * columns + c;
    eroded[i] = sea[i] && sea[i - 1] && sea[i + 1] && sea[i - columns] && sea[i + columns] ? 1 : 0;
  }
  for (let r = 1; r < rows - 1; r++) for (let c = 1; c < columns - 1; c++) {
    const i = r * columns + c;
    water[i] = eroded[i] || eroded[i - 1] || eroded[i + 1] || eroded[i - columns] || eroded[i + columns] ? 1 : 0;
  }
  for (let c = 0; c < columns; c++) { water[c] = water[columns + c]; water[(rows - 1) * columns + c] = water[(rows - 2) * columns + c]; }
  for (let r = 0; r < rows; r++) { water[r * columns] = water[r * columns + 1]; water[r * columns + columns - 1] = water[r * columns + columns - 2]; }
  for (let i = 0; i < size; i++) if (fixed(i)) water[i] = sea[i];
  return water;
}

/** Whether low land at (r, c) looks out on open water all the way, `out` cells to the south-south-east. */
export function facesGulf(water, columns, rows, r, c, out) {
  const dx = Math.sin(145 * Math.PI / 180), dy = -Math.cos(145 * Math.PI / 180);
  let wet = 0;
  for (let s = 1; s <= out; s++) {
    const rr = Math.round(r + dy * s), cc = Math.round(c + dx * s);
    if (rr < 0 || cc < 0 || rr >= rows || cc >= columns) return wet > 0;
    if (water[rr * columns + cc]) wet++;
    else if (wet) return false;
  }
  return wet > 0;
}

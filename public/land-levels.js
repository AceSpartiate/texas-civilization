// The real land's detail levels as the page reads them (docs/MAP_ACCURACY.md §6, docs/PERFORMANCE_RENDER.md "Zoom").
//
// `/terrain/colonies-province.json` holds every line - rivers, the sea, the escarpment - at four nested bands, each coarser
// band keeping only points of the finer one, so choosing a band by the zoom never moves a line: it only drops points that
// are less than a pixel off it. `/terrain/colonies-land.json` holds the land's classes and hillshade on grids of 8, 2 and
// half a mile. This file decodes both and picks what a zoom draws. No browser imports, so it is tested
// (tests/map-base.test.mjs); public/app.js draws from it.

/** A flat line of hundredths of a mile, `[x0, y0, x1, y1, ...]`, as points in miles. */
export function flatPoints(flat) {
  const points = [];
  if (!flat) return points;
  for (let i = 0; i + 1 < flat.length; i += 2) points.push({ x: flat[i] / 100, y: flat[i + 1] / 100 });
  return points;
}

/**
 * The band a line is drawn at: the coarsest whose tolerance is under `pixels` on screen at this scale, or the finest. A
 * pixel and a half off is not seen under a curve at least three pixels wide.
 * `bands` are tolerances in miles, finest first.
 */
export function lineBand(bands, scale, pixels = 1.5) {
  let chosen = 0;
  for (let i = 0; i < bands.length; i++) if (bands[i] * scale <= pixels) chosen = i;
  return chosen;
}

/** The province's lines decoded once: `rivers[{ id, name, miles, levels: [points|null × 4] }]`, `sea`, `escarpment`. */
export function decodeProvince(data) {
  return {
    bands: data.bands,
    bounds: data.bounds,
    // `width` is twice the channel's width in miles (MAP_ACCURACY §6.1); the channel is half of it.
    rivers: (data.rivers || []).map(river => ({ id: river.id, name: river.name, miles: (river.width || 0) / 2, levels: river.levels.map(level => level ? flatPoints(level) : null) })),
    sea: (data.sea?.levels || []).map(rings => rings.map(flatPoints)),
    escarpment: (data.escarpment?.levels || []).map(flatPoints),
  };
}

const bytes = text => {
  const raw = atob(text), out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

/**
 * The land's grids decoded once, finest first: `{ minX, minY, cellMiles, columns, rows, classes: [land id by index],
 * cells: low nibble (the land class), relief: high nibble, shade }` - the shape `groundClassAt` reads.
 */
export function decodeLand(data) {
  const classes = (data.land || []).map(kind => kind.id);
  return (data.bands || []).map(band => {
    const raw = bytes(band.classes), cells = new Uint8Array(raw.length), relief = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) { cells[i] = raw[i] & 15; relief[i] = raw[i] >> 4; }
    return { minX: band.minX, minY: band.minY, cellMiles: band.cell, columns: band.columns, rows: band.rows, classes, cells, relief, shade: bytes(band.shade) };
  }).sort((a, b) => a.cellMiles - b.cellMiles);
}

/**
 * How strongly each land grid (finest first: half a mile, 2, 8) is drawn at a scale: each hands over to the finer one as its
 * cells grow past a few pixels, across a band of zoom, so the land never changes at one wheel step. The weights sum to one.
 */
export function landWeights(scale, cells = [0.5, 2, 8]) {
  const weights = new Array(cells.length).fill(0);
  let remaining = 1;
  for (let i = 0; i < cells.length; i++) {
    // Fully in once a cell is eight pixels, fading in from four.
    const take = i === cells.length - 1 ? 1 : Math.max(0, Math.min(1, (cells[i] * scale - 4) / 4));
    weights[i] = remaining * take;
    remaining -= weights[i];
  }
  return weights;
}

// ------------------------------------------------------------------------------------------ the country outside the box
//
// Owner, 2026-09-18: the map grows east to the Sabine and south and west to the Rio Grande (docs/MAP_ACCURACY.md §8).
// `/terrain/outside-province.json` and `/terrain/outside-land.json` are that country in the box's own shapes, bands and
// lattice (scripts/build-outside.mjs): drawn beside the box, and inside it only where the box leaves something undrawn -
// the rivers it does not draw, and the ring of its land cells at its edge whose hillshade leaned on nothing.

/** The outside layer's lines decoded once, in the shape `decodeProvince` gives, with the escarpment in pieces. */
export function decodeOutside(data) {
  const province = decodeProvince({ ...data, escarpment: null });
  return {
    ...province,
    box: data.box,
    escarpment: (data.escarpment?.levels || []).map(pieces => pieces.map(flatPoints)),
    relief: data.relief || null,
  };
}

/**
 * A land grid cut into pieces small enough to be smoothed into a picture at two pixels a cell or more (public/map-base.js
 * `landUpscale`: at one pixel a cell a picture is not smoothed at all, and its classes would be squares beside the box's
 * soft ones). Each piece carries `margin` cells of its neighbours, so its smoothing near its edge is the whole grid's, and a
 * `core` in miles, the part it draws: laid side by side, the cores are the whole grid with no seam. Pieces with nothing to
 * draw are left out. A grid small enough is one piece.
 */
export function tileGrid(grid, { most = 375000, margin = 3 } = {}) {
  const cell = grid.cellMiles;
  const coreOf = (c0, r0, c1, r1) => ({ minX: grid.minX + c0 * cell, minY: grid.minY + r0 * cell, maxX: grid.minX + c1 * cell, maxY: grid.minY + r1 * cell });
  if (grid.columns * grid.rows <= most) return [{ ...grid, core: coreOf(0, 0, grid.columns, grid.rows) }];
  let across = 2;
  while ((Math.ceil(grid.columns / across) + 2 * margin) * (Math.ceil(grid.rows / across) + 2 * margin) > most) across++;
  const width = Math.ceil(grid.columns / across), height = Math.ceil(grid.rows / across), tiles = [];
  for (let r0 = 0; r0 < grid.rows; r0 += height) for (let c0 = 0; c0 < grid.columns; c0 += width) {
    const c1 = Math.min(grid.columns, c0 + width), r1 = Math.min(grid.rows, r0 + height);
    let any = false;
    for (let r = r0; r < r1 && !any; r++) for (let c = c0; c < c1; c++) if (grid.cells[r * grid.columns + c]) { any = true; break; }
    if (!any) continue;
    const pc0 = Math.max(0, c0 - margin), pc1 = Math.min(grid.columns, c1 + margin), pr0 = Math.max(0, r0 - margin), pr1 = Math.min(grid.rows, r1 + margin);
    const columns = pc1 - pc0, rows = pr1 - pr0;
    const cut = source => {
      if (!source) return source;
      const out = new Uint8Array(columns * rows);
      for (let r = 0; r < rows; r++) out.set(source.subarray((pr0 + r) * grid.columns + pc0, (pr0 + r) * grid.columns + pc1), r * columns);
      return out;
    };
    tiles.push({ ...grid, minX: grid.minX + pc0 * cell, minY: grid.minY + pr0 * cell, columns, rows, cells: cut(grid.cells), relief: cut(grid.relief), shade: cut(grid.shade), core: coreOf(c0, r0, c1, r1) });
  }
  return tiles;
}

/**
 * The box's land grid without the cells the outside layer draws instead (its edge: the outside grid of the same cell has a
 * class there). Cell for cell on the one lattice, so the two grids never both draw a cell and never leave one undrawn.
 * The same grid when the outside claims none of it.
 */
export function withoutClaims(grid, outside) {
  if (!outside || outside.cellMiles !== grid.cellMiles) return grid;
  const offsetColumn = Math.round((grid.minX - outside.minX) / grid.cellMiles), offsetRow = Math.round((grid.minY - outside.minY) / grid.cellMiles);
  let cells = null;
  for (let r = 0; r < grid.rows; r++) for (let c = 0; c < grid.columns; c++) {
    const oc = c + offsetColumn, or = r + offsetRow;
    if (oc < 0 || or < 0 || oc >= outside.columns || or >= outside.rows || !outside.cells[or * outside.columns + oc]) continue;
    const i = r * grid.columns + c;
    if (!grid.cells[i]) continue;
    cells ||= grid.cells.slice();
    cells[i] = 0;
  }
  return cells ? { ...grid, cells } : grid;
}

/**
 * Where an outside grid has nothing to draw, in miles: the box's middle, whole cells from four cells in from its edge - past
 * the ring of edge cells the outside draws (`claims`, docs/MAP_ACCURACY.md §6.5) and the softening round them. The page lays
 * the outside's pictures down only around it (public/map-base.js `aroundHole`), so a view of the box pays nothing for them.
 */
export function emptyMiddle(grid, box, cells = 4) {
  const cell = grid.cellMiles, snap = (value, way) => Math[way](value / cell) * cell;
  const middle = {
    minX: grid.minX + snap(box.minX - grid.minX, 'ceil') + cells * cell, maxX: grid.minX + snap(box.maxX - grid.minX, 'floor') - cells * cell,
    minY: grid.minY + snap(box.minY - grid.minY, 'ceil') + cells * cell, maxY: grid.minY + snap(box.maxY - grid.minY, 'floor') - cells * cell,
  };
  return middle.maxX > middle.minX && middle.maxY > middle.minY ? middle : null;
}

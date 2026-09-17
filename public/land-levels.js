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

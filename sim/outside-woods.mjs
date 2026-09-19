// The woods of the country outside the colonies' box, for the map's woods tiles and nothing else: docs/MAP_ACCURACY.md §8.
//
// Built by scripts/build-outside.mjs into public/terrain/outside-woods.bin.gz (one stand an eighth-of-a-mile cell, in the
// byte order of the box's own colonies-woods.bin) and outside-woods.json.gz (its grid). sim/woods-view.mjs passes
// `outsideStandAt` to the woods as `beyond`, so the shade, the patches and the trees of the map are drawn outside the box
// exactly as inside it. The simulation's own questions - hunting, felling, clearing, the going - never pass it: to them the
// woods end at the box, as they always have, and no class's world or save reads a byte of this.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const ROOT = new URL('../public/terrain/', import.meta.url);
let grid;
function load() {
  if (grid !== undefined) return grid;
  try {
    const header = JSON.parse(gunzipSync(readFileSync(new URL('outside-woods.json.gz', ROOT))).toString('utf8'));
    const cells = gunzipSync(readFileSync(new URL(header.grid.file, ROOT)));
    if (cells.length !== header.grid.columns * header.grid.rows) throw new Error('The outside woods grid is not the size its header says');
    grid = { ...header.grid, cells, stands: header.stands };
  } catch (error) {
    // A copy of the game without the outside layer draws the box's woods alone.
    if (error.code !== 'ENOENT') throw error;
    grid = null;
  }
  return grid;
}

/** The stand outside the box at a point, from the outside layer; 'none' inside the box, off the map, or without the layer. */
export function outsideStandAt(point) {
  const g = load();
  if (!g) return 'none';
  const column = Math.floor((point.x - g.minX) / g.cell), row = Math.floor((point.y - g.minY) / g.cell);
  if (column < 0 || row < 0 || column >= g.columns || row >= g.rows) return 'none';
  return g.stands[g.cells[row * g.columns + column]] || 'none';
}

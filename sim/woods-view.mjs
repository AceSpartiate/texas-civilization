// The woods as the family's map asks for them: docs/WOODS_AND_BUILDING.md §4.3, build step 2.
//
// Three sizes of tile, all worked out from the woods themselves (sim/woods.mjs), so the map shows exactly the timber the
// simulation walks, clears and hunts in:
//   - `shade`   an eight-mile tile of one-mile cells, each the share of it in timber (0-9), for the map zoomed out;
//   - `patches` a one-mile tile of its sixteen by sixteen patches, each `t` timber, `b` brush or `o` open, for the ground
//               detail at middle distance;
//   - `trees`   a quarter-mile tile of every tree in it, for close up.
// Only a class that reads its woods (`woodsRule` 'landfire') has any; every other class draws as it always has.
import { landAround } from './ground.mjs';
import { KINDS, PATCH_MILES, SIZES, patchAt, patchCover, treesIn, woodsRule } from './woods.mjs';

export const WOODS_TILE_MILES = Object.freeze({ shade: 8, patches: 1, trees: 0.25 });
/** How many points of each one-mile cell are read for its shade: a four by four grid. */
const SHADE_SAMPLES = 4;
const KIND_IDS = Object.keys(KINDS);

/** The kinds of tree, in the order `trees` tiles number them, with the picture each is drawn with. Fixed; sent once. */
export const woodsCatalogue = () => ({ tiles: WOODS_TILE_MILES, kinds: KIND_IDS.map(id => ({ id, name: KINDS[id].name, picture: KINDS[id].picture })), sizes: SIZES });

/**
 * One tile of the woods, or null when this class has none to show or the tile is not a real one.
 * `level` is `shade`, `patches` or `trees`; `tx`, `ty` are whole tile numbers (tile × size = miles).
 */
export function woodsTile(world, level, tx, ty) {
  const size = WOODS_TILE_MILES[level];
  if (!size || !Number.isInteger(tx) || !Number.isInteger(ty) || Math.abs(tx) > 1e5 || Math.abs(ty) > 1e5) return null;
  if (woodsRule(world) !== 'landfire') return null;
  const land = landAround();
  const options = { rule: 'landfire', nearCreek: land.nearCreek };
  const minX = tx * size, minY = ty * size;
  if (level === 'shade') {
    const cells = [];
    for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
      let timber = 0;
      for (let i = 0; i < SHADE_SAMPLES; i++) for (let j = 0; j < SHADE_SAMPLES; j++) {
        if (patchCover(patchAt({ x: minX + column + (i + 0.5) / SHADE_SAMPLES, y: minY + row + (j + 0.5) / SHADE_SAMPLES }, options)) === 'timber') timber++;
      }
      cells.push(Math.round(9 * timber / (SHADE_SAMPLES * SHADE_SAMPLES)));
    }
    return { level, tx, ty, size, cells: cells.join('') };
  }
  if (level === 'patches') {
    const across = Math.round(size / PATCH_MILES);
    let cells = '';
    for (let row = 0; row < across; row++) for (let column = 0; column < across; column++) {
      cells += patchCover(patchAt({ x: minX + (column + 0.5) * PATCH_MILES, y: minY + (row + 0.5) * PATCH_MILES }, options))[0];
    }
    return { level, tx, ty, size, cells };
  }
  // Tiles are whole numbers of lattice cells and a tree stands inside its cell, so no tree lies on a tile's edge.
  const trees = treesIn({ minX, minY, maxX: minX + size, maxY: minY + size }, options) || [];
  return { level, tx, ty, size, trees: trees.map(tree => [tree.x, tree.y, KIND_IDS.indexOf(tree.kind), SIZES.indexOf(tree.size)]) };
}

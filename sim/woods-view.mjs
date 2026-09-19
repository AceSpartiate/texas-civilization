// The woods as the family's map asks for them: docs/WOODS_AND_BUILDING.md §4.3, build step 2.
//
// Three sizes of tile, all worked out from the woods themselves (sim/woods.mjs), so the map shows exactly the timber the
// simulation walks, clears and hunts in:
//   - `shade`   an eight-mile tile of one-mile cells, each the share of it in timber (0-9), for the map zoomed out;
//   - `patches` a one-mile tile of its sixteen by sixteen patches, each `t` timber, `b` brush or `o` open, for the ground
//               detail at middle distance;
//   - `trees`   a quarter-mile tile of every tree in it, for close up.
// Only a class that reads its woods (`countsTrees`: the biomes of 1836, or the 2016 grid of a class made in the week of
// 2026-09-15) has any, each from its own grid; every other class draws as it always has.
import { landAround } from './ground.mjs';
import { KINDS, PATCH_MILES, SIZES, countsTrees, patchAt, patchCover, treesIn, woodsRule } from './woods.mjs';
import { outsideStandAt } from './outside-woods.mjs';

export const WOODS_TILE_MILES = Object.freeze({ shade: 8, patches: 1, trees: 0.25 });
/** How many points of each one-mile cell are read for its shade: a four by four grid. */
const SHADE_SAMPLES = 4;
const KIND_IDS = Object.keys(KINDS);

/**
 * The kinds of tree, in the order `trees` tiles number them, with the picture each is drawn with: whether it comes at three
 * sizes, how much taller than the picture it stands, and its stump (sim/woods.mjs `KINDS`). Fixed; sent once.
 */
export const woodsCatalogue = () => ({
  tiles: WOODS_TILE_MILES, sizes: SIZES,
  kinds: KIND_IDS.map(id => ({ id, name: KINDS[id].name, picture: KINDS[id].picture, sized: KINDS[id].sized, scale: KINDS[id].scale, stump: KINDS[id].stump })),
});

/**
 * The land's own tiles, remembered: `shade` and `patches` are worked out from the land alone, the same for every class that
 * reads its woods from it, and never change, so each is worked out once per server (2026-09-17, the woods fetched in batches,
 * docs/PERFORMANCE_LOAD.md). The trees are not remembered: a felled tree changes its tile.
 * ceiling: at most `LAND_TILES_KEPT` are kept and the oldest dropped first; a whole class panning the whole colonies at middle
 * distance can outrun it, and then a tile is worked out again - never wrongly.
 */
export const LAND_TILES_KEPT = 6000;
const landTiles = new Map();
export const landTilesKept = () => landTiles.size;

/** Many tiles of one level at once: `tiles` is `[[tx, ty], ...]`; the answer is in the same order, null where there is none. */
export function woodsTiles(world, level, tiles) {
  return tiles.map(([tx, ty]) => woodsTile(world, level, tx, ty));
}

/**
 * One tile of the woods, or null when this class has none to show or the tile is not a real one.
 * `level` is `shade`, `patches` or `trees`; `tx`, `ty` are whole tile numbers (tile × size = miles).
 */
export function woodsTile(world, level, tx, ty) {
  const size = WOODS_TILE_MILES[level];
  if (!size || !Number.isInteger(tx) || !Number.isInteger(ty) || Math.abs(tx) > 1e5 || Math.abs(ty) > 1e5) return null;
  const rule = woodsRule(world);
  if (!countsTrees(rule)) return null;
  if (level !== 'trees') {
    // Each grid's tiles apart: a class of the week of 2026-09-15 reads the 2016 grid, every class since the biomes.
    const key = `${rule}:${level}:${tx}:${ty}`;
    let tile = landTiles.get(key);
    if (!tile) {
      tile = landTile(rule, level, tx, ty, size);
      if (landTiles.size >= LAND_TILES_KEPT) landTiles.delete(landTiles.keys().next().value);
      landTiles.set(key, tile);
    }
    return tile;
  }
  const land = landAround();
  // Past the box the stands are the outside layer's (sim/outside-woods.mjs), so the map's woods run on over its edge.
  const options = { rule, nearCreek: land.nearCreek, beyond: outsideStandAt };
  const minX = tx * size, minY = ty * size;
  return treeTile(world, level, tx, ty, size, minX, minY, options);
}

/** A `shade` or `patches` tile, worked out from the land. */
function landTile(rule, level, tx, ty, size) {
  const land = landAround();
  // Past the box the stands are the outside layer's (sim/outside-woods.mjs), so the map's woods run on over its edge.
  const options = { rule, nearCreek: land.nearCreek, beyond: outsideStandAt };
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
  return null;
}

/** A `trees` tile: every tree standing in it, and the stumps of those felled with the logs still beside them. */
function treeTile(world, level, tx, ty, size, minX, minY, options) {
  // Tiles are whole numbers of lattice cells and a tree stands inside its cell, so no tree lies on a tile's edge.
  const trees = treesIn({ minX, minY, maxX: minX + size, maxY: minY + size }, options) || [];
  // Felled trees are stumps, with the logs still lying beside each (sim/felling.mjs).
  const felled = world.woods?.felled || {};
  return {
    level, tx, ty, size,
    trees: trees.filter(tree => !felled[tree.id]).map(tree => [tree.x, tree.y, KIND_IDS.indexOf(tree.kind), SIZES.indexOf(tree.size)]),
    stumps: trees.filter(tree => felled[tree.id]).map(tree => [tree.x, tree.y, KIND_IDS.indexOf(tree.kind), felled[tree.id].left]),
  };
}

import { createWorld, validateWorld } from './world.mjs';
import { initializeDirectors } from './directors.mjs';
import { beginArrivals } from './settling.mjs';

export function createGonzalesWorld(seed = 'gonzales-1835', playerCount = 15, options = {}) {
  const world = createWorld(seed, playerCount, options);
  initializeDirectors(world);
  // A new class starts on the road, with no house on any land (docs/SETTLING_IN.md step 2).
  beginArrivals(world);
  validateWorld(world);
  return world;
}

import { createWorld } from './world.mjs';
import { initializeDirectors } from './directors.mjs';

export function createGonzalesWorld(seed = 'gonzales-1835', playerCount = 15) {
  const world = createWorld(seed, playerCount);
  initializeDirectors(world);
  return world;
}

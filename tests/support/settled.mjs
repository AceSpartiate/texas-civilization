// A class whose families are already on their land, under a roof.
//
// A new class begins with every family on the road in and no house anywhere
// (docs/SETTLING_IN.md step 2, sim/settling.mjs). Tests of farming, hunting, powder, coin and
// fatigue are about what a family does once it is home, and were written for exactly this
// world; they use it so each keeps testing its own rule rather than the arrival. The arrival,
// the camp and what the camp costs are tested in tests/arrival.test.mjs against a real one.
//
// Not a test file: `node --test` picks up `*.test.mjs`, and this is imported, never run.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { validateWorld } from '../../sim/world.mjs';

/** Every family's arrival finished on the spot, without moving the clock, and a cabin standing. */
export function settle(world) {
  for (const household of Object.values(world.households)) {
    for (const id of [...household.members, ...household.property]) {
      const entity = world.entities[id], travel = entity.travel;
      if (travel?.purpose !== 'arrive') continue;
      entity.location = { x: travel.settle.x, y: travel.settle.y, siteId: travel.to };
      if (entity.kind === 'person') entity.task = travel.settle.task;
      entity.travel = null;
    }
    delete household.arriving;
    household.improvements = { ...household.improvements, cabin: 'sound' };
  }
  validateWorld(world);
  return world;
}

export const createSettledWorld = (seed, count) => settle(createGonzalesWorld(seed, count));

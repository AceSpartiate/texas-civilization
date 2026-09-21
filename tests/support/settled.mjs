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
      // Unloaded at the land, as `progressTravel` does for a wagon that drives in.
      if (entity.laden) entity.laden = false;
    }
    delete household.arriving;
    household.improvements = { ...household.improvements, cabin: 'sound' };
  }
  validateWorld(world);
  return world;
}

export const createSettledWorld = (seed, count) => settle(createGonzalesWorld(seed, count));

/**
 * Every family already walked through the guided beginning (sim/lesson.mjs, docs/LESSON.md).
 *
 * For a test whose subject is not the lesson but which needs a family a student has actually joined:
 * joining marks a family played, and a played family that is still coming in to its land is gated to
 * one step at a time. `{ step: 'done' }` with no minute on it is a lesson that is over and shows no
 * closing card - the same state a family reaches by finishing it, and the state `lessonInvalid`
 * accepts from any save.
 */
export function taught(world) {
  for (const household of Object.values(world.households)) household.lesson = { step: 'done' };
  return world;
}

/**
 * For the browser proofs that follow the founding family (Thomas, Elena, Rosa, Mateo) through travel, a hunt, a trade or
 * the slice: each family is named before Start, with the name it already shows. The server rolls a new family at Start for
 * every student who joined and left the family untouched (docs/FAMILY_CREATION.md), and keeps one that has been named or set
 * to work; without this the people these proofs follow were gone before the first click (found 2026-09-14).
 */
export function keepFoundingFamilies(world) {
  for (const household of Object.values(world.households)) household.name ??= `${world.entities[household.principalId].name}'s family`;
  return world;
}

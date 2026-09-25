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
import { coinFor, secondTable, settleMeans } from '../../sim/means.mjs';
import { packForRoom } from '../../sim/wagon.mjs';

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

/**
 * Home, with its means (sim/means.mjs): a class made since 2026-09-25 gives every family nobody rolled its means on the first
 * running tick, before anything moves; a family already home has had that tick, so it has them before the test sets it up.
 */
export const createSettledWorld = (seed, count) => { const world = createGonzalesWorld(seed, count); settleMeans(world); return settle(world); };

/**
 * Every family without the coin its means gave it (sim/means.mjs `MEANS_COIN`, owner 2026-09-25: three to ten reales a family),
 * as every family was before that evening. For a test whose subject is coin coming into the house from nothing - a sale, a
 * trade, the ending's floor of one real - and not the starting coin, which tests/means.test.mjs holds. The means keep their record
 * of the coin rolled; only what is in the house is taken out.
 */
export function withoutStartingCoin(world) {
  for (const household of Object.values(world.households)) if (household.means?.coin) household.resources = { ...household.resources, money: 0 };
  return world;
}

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

/**
 * This family of modest means - one wagon and one ox, as every family had before the means were rolled (sim/means.mjs) - for a
 * test whose subject is what one of each does: who holds the ox, whether the wagon is free. Its other wagons and oxen, and a
 * cart's mark, are taken away before anything has happened to them.
 */
export function modestMeans(world, householdId = 'hh-1') {
  const household = world.households[householdId];
  for (const id of [...household.property]) {
    if (!/-(wagon|animal)-\d+$/.test(id)) continue;
    delete world.entities[id];
    household.property = household.property.filter(one => one !== id);
  }
  // A family that came on foot (sim/means.mjs, the band that is hard up) is given back the family wagon it never had, where its ox is.
  if (!world.entities[`${householdId}-wagon`]) {
    const ox = world.entities[`${householdId}-animal`];
    world.entities[`${householdId}-wagon`] = { id: `${householdId}-wagon`, name: 'Family wagon', kind: 'wagon', householdId, depth: 'aggregate', location: { ...ox.location }, travel: ox.travel ? structuredClone(ox.travel) : null, condition: 'sound', borrowedBy: null };
    household.property = [...household.property, `${householdId}-wagon`];
  }
  const wagon = world.entities[`${householdId}-wagon`];
  if (wagon?.cart) { delete wagon.cart; wagon.name = 'Family wagon'; }
  // Rolled a 10 on the table the class rolls on: on the second (sim/means.mjs), with the 5 reales that face gives.
  if (household.means) household.means = { roll: 10, band: 'modest', ...(secondTable(world) && { coin: coinFor(10) }) };
  // And its load what one wagon holds (sim/wagon.mjs `packForRoom`), the stores that came in the others gone with them.
  packForRoom(world, household);
  validateWorld(world);
  return world;
}

// A class at Gonzales with the families placed for the fight (sim/battle-stage.mjs, sim/battles/gonzales.mjs).
//
// Not a test file: `node --test` picks up `*.test.mjs`, and this is imported, never run.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { applyAction, stepWorld } from '../../sim/world.mjs';
import { TIMELINE, momentOf } from '../../sim/directors.mjs';
import { learn } from '../../sim/knowledge.mjs';
import { settle } from './settled.mjs';

/** The Gonzales families of a class: all of them on the invented country, the town's own on the real land. */
export const gonzalesFamilies = world => Object.values(world.households).filter(household => !household.settlementId || household.settlementId === 'gonzales').map(household => household.id);

/**
 * A running class in which each of `fighters` has carried the food to Gonzales and stands there, `townsfolk` likewise, and
 * everybody else has been told and stayed home. Stepped to `minute` (default: just before the upriver call).
 */
export function gonzalesClass(seed, { map, players = 5, fighters = [], townsfolk = [], stayers = [] } = {}) {
  // Home already, under a roof, as tests/support/settled.mjs has every family that is not testing the arrival.
  const world = settle(createGonzalesWorld(seed, players, map ? { map } : {}));
  world.status = 'running';
  // `fighters: 'first'` is the first Gonzales family of the class, whichever that is on this map.
  if (fighters === 'first') fighters = gonzalesFamilies(world).slice(0, 1);
  while (!world.truth['cannon-request']) stepWorld(world);
  for (const id of [...fighters, ...townsfolk, ...stayers]) learn(world, id, 'cannon-request', { status: 'confirmed', source: 'Somebody who saw it' });
  const answered = new Set();
  for (let tick = 0; tick < 400 && answered.size < fighters.length + townsfolk.length + stayers.length; tick++) {
    stepWorld(world);
    for (const id of [...fighters, ...townsfolk, ...stayers]) {
      if (answered.has(id) || world.requests[id]?.status !== 'open') continue;
      const person = world.entities[world.households[id].principalId];
      applyAction(world, id, { action: stayers.includes(id) ? 'stay' : 'help', entityId: person.id, mode: 'foot' });
      answered.add(id);
    }
  }
  // In town: the food carried, and standing in Gonzales before the men gather at the ferry.
  for (const id of [...fighters, ...townsfolk]) {
    const person = world.entities[world.households[id].principalId];
    person.travel = null;
    person.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  }
  return world;
}
export const principalOf = (world, householdId) => world.entities[world.households[householdId].principalId];
/** Step until `done` or the class ends, with a guard. */
export function stepUntil(world, done, limit = 2000) {
  for (let tick = 0; tick < limit && !done() && world.status === 'running'; tick++) stepWorld(world);
  return done();
}
export { TIMELINE, momentOf };

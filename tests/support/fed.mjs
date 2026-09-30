// A played family can starve (owner, 2026-09-30; sim/hunger.mjs, docs/HUNGER.md). A class a test steps in process is run by the
// director, which never starves a family nobody plays and so leaves many with an empty store; a test that then makes a family
// played and steps it on for weeks, giving it no orders, would watch it die of hunger when that is not what it tests. These
// families are fed instead: a store of `days` of their eating, never less than they had.
//
// Not a test file: `node --test` picks up `*.test.mjs`, and this is imported, never run.
const GONE = ['dead', 'captured'];
/** Days of eating a fed family is given: a whole period and more. */
export const FED_DAYS = 120;

/** Gives these families (every family when none are named) at least `days` of a grown share for each of their living people. */
export function feed(world, households = Object.values(world.households), days = FED_DAYS) {
  for (const household of households) {
    if (!household?.resources) continue;
    const living = household.members.map(id => world.entities[id]).filter(one => one?.kind === 'person' && !GONE.includes(one.health?.condition)).length;
    household.resources.food = Math.max(household.resources.food || 0, Math.ceil(living * 0.35 * days));
  }
  return world;
}

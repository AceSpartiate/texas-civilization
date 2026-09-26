// A spring class (the third period) on the colonies map, a few hours before Fannin's column marches out of Goliad on March 19,
// 1836, with men of the families serving with him (sim/fannin.mjs, sim/battles/coleto.mjs, sim/battles/goliad-massacre.mjs).
//
// Not a test file: `node --test` picks up `*.test.mjs`, and this is imported, never run. The class is played through the
// first two periods once per process and cloned for each test, as tests/houston.test.mjs does.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../../sim/periods.mjs';
import { momentOf } from '../../sim/directors.mjs';

export const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); return done(); };
let shared = null;
/** The spring, stepped to the morning of March 19 before the column marches. */
export const spring = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('fannin-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  until(world, () => world.minute >= momentOf(world, 'fannin-marches') - 180);
  return world;
})());
/** Grown men at home, one of each family first, so a test's men are of different families. */
export function grownMen(world) {
  const men = Object.values(world.entities).filter(one => one.householdId && one.kind === 'person' && one.health.condition === 'well' && one.sex === 'male' && (one.age ?? 0) >= 16 && !one.service);
  const seen = new Set(), first = [], rest = [];
  for (const one of men) (seen.has(one.householdId) ? rest : (seen.add(one.householdId), first)).push(one);
  return [...first, ...rest];
}
/**
 * The class's seed, chosen so its grown men meet what a test needs of the seeded rolls (sim/shares.mjs, sim/army.mjs
 * `rollFates`), which are seeded by the class's seed and each man's id: `wanted(men, world)` is asked of each candidate seed in
 * turn, the first that answers is kept, and the same seed is always found. Everything after is played on it.
 */
export function reseed(world, wanted, tries = 2000) {
  const original = world.seed;
  for (let k = 0; k < tries; k++) {
    world.seed = `${original}:${k}`;
    if (wanted(grownMen(world), world)) return world.seed;
  }
  world.seed = original;
  throw new Error('no seed gives what this test needs');
}
/** Put somebody with Fannin at Goliad, as a man who got away from the south is (sim/alamo.mjs `fightSouth`). */
export function withFannin(world, person, { horse = false } = {}) {
  const goliad = world.map.sites.goliad;
  person.travel = null; person.chore = null; person.task = 'rest';
  person.location = { x: goliad.x, y: goliad.y, siteId: 'goliad' };
  person.service = { kind: 'fannin', status: 'serving', since: world.minute, siteId: 'goliad', escapedFrom: 'agua-dulce' };
  if (horse) {
    const household = world.households[person.householdId];
    const beast = (household.property || []).map(id => world.entities[id]).find(one => one?.id === `${household.id}-horse`);
    if (!beast) return false;
    beast.travel = null; beast.borrowedBy = person.id; beast.location = { x: goliad.x, y: goliad.y, siteId: 'goliad' };
  }
  return true;
}
export { momentOf };

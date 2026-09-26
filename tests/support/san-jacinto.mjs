// A spring class on the real land, for San Jacinto (sim/battles/san-jacinto.mjs, sim/san-jacinto.mjs).
//
// Not a test file: `node --test` picks up `*.test.mjs`, and this is imported, never run.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { projectWorld, rollFamily, stepWorld } from '../../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../../sim/periods.mjs';
import { TIMELINE, momentOf } from '../../sim/directors.mjs';
import { rollFates, frailty } from '../../sim/army.mjs';
import { SAN_JACINTO } from '../../sim/houston.mjs';
import { houstonCamp } from '../../sim/houston.mjs';

export const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); return done(); };
export const untilMoment = (world, key) => until(world, () => world.minute >= momentOf(world, key));
export const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });

let shared = null;
/** The same class the Houston tests play (tests/houston.test.mjs), at dawn on March 14, running. Each call is its own copy. */
export const spring = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('houston-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  return world;
})());

/** Grown men who can be sent to the army, one of each family first. */
export function grownMen(world) {
  const men = Object.values(world.entities).filter(one => one.householdId && one.kind === 'person' && !['dead', 'captured'].includes(one.health.condition) && one.sex === 'male' && (one.age ?? 0) >= 16 && !one.service);
  const first = [], rest = [];
  const seen = new Set();
  for (const man of men) { if (seen.has(man.householdId)) rest.push(man); else { seen.add(man.householdId); first.push(man); } }
  return [...first, ...rest];
}
/** Put somebody with Houston at `siteId` (default: the camp now), well, as if he had marched there; kept in through both questions. */
export function serve(world, person, siteId = houstonCamp(world), extra = {}) {
  const site = world.map.sites[siteId];
  person.travel = null; person.chore = null; person.task = 'rest';
  person.health = { condition: 'well' };
  person.location = { x: site.x, y: site.y, siteId };
  person.service = { kind: 'houston', status: 'serving', since: world.minute, siteId, leave: 'no', road: 'no', ...extra };
  return person;
}
/**
 * A seed for this class under which this man's San Jacinto roll is `fate` (the roll reads only the seed, his id and his
 * frailty: sim/army.mjs `rollFates`). Setting `world.seed` to it before the battle stages that fate without touching the
 * rates. Undrilled men only: a drilled man's weight is three quarters of his frailty.
 */
export function seedFor(world, person, fate) {
  for (let i = 0; i < 20000; i++) {
    const seed = `sj-${fate}-${i}`;
    const [rolled] = rollFates({ seed, entities: { [person.id]: person } }, [person.id], { event: 'san-jacinto', ...SAN_JACINTO, weightOf: frailty });
    if (rolled.fate === fate) return seed;
  }
  throw new Error(`no seed gives ${person.id} ${fate}`);
}
export { TIMELINE, momentOf };

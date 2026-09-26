// A winter class on the real land with men of several families sent south to the Matamoros men (sim/south.mjs,
// docs/BATTLES.md §6.14). Not a test file: imported, never run.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { applyAction, rollFamily, stepWorld } from '../../sim/world.mjs';
import { beginSecondPeriod } from '../../sim/periods.mjs';
import { momentOf } from '../../sim/directors.mjs';

export const until = (world, done, limit = 20000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); return done(); };
export const untilMoment = (world, key) => until(world, () => world.minute >= momentOf(world, key));

let shared = null;
/** A class of eight rolled families, through the first period and into the winter to the morning of its news. */
export const winterClass = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('alamo-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world);
  world.status = 'running';
  until(world, () => world.director.milestones['winter-news']);
  return world;
})());

/** One grown man of each of `count` families, at home, sent south on the family's own errand; and the families left out. */
export function sendSouth(world, count, { mode = 'foot' } = {}) {
  const sent = [];
  for (const household of Object.values(world.households)) {
    if (sent.length >= count) break;
    const man = household.members.map(id => world.entities[id]).find(person => person.kind === 'person' && person.sex === 'male' && (person.age ?? 30) >= 16
      && !['dead', 'captured'].includes(person.health.condition) && person.location.siteId === household.homeSiteId);
    if (!man) continue;
    try { applyAction(world, household.id, { action: 'chore', entityId: man.id, chore: 'join-matamoros', mode }); sent.push(man); } catch { /* refused: not this family */ }
  }
  const home = Object.values(world.households).filter(household => !sent.some(man => man.householdId === household.id));
  return { sent, home };
}
export { momentOf };

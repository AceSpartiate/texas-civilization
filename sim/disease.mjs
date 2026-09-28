// Disease: which sicknesses, where, and what rest does. docs/DISEASE.md, the owner's request of 2026-09-27:
//
//   "also, plan for diseases. keep it historical as to which ones. stopping to rest should help characters recover."
//
// One rule in one place (docs/DISEASE.md §3.1 principle 5): the road, home, the camp and the refuge all come here, so the way
// somebody falls sick, gets worse, mends or dies can never drift apart between them.
import { record } from './events.mjs';

const GONE = ['dead', 'captured'];

/**
 * A sickness mends when its day comes, wherever the sick person is (build step 0, docs/DISEASE.md §1.5). Until 2026-09-27 only
 * the road's own loop mended one, so somebody made sick at home by a norther, or a man serving with the army, never got well.
 * This is now the only place a sickness mends: the road no longer does it for itself, so nobody is mended twice.
 */
function mend(world, person) {
  const health = person.health;
  if (health?.condition !== 'sick' || !Number.isFinite(health.recoversAt) || world.minute < health.recoversAt) return;
  person.health = { condition: 'well' };
  record(world, 'condition', { actorId: person.id, householdId: person.householdId, importance: 2, text: `${person.name} is well again.` });
}

/** One tick of sickness for everybody: called by sim/world.mjs `stepWorld` after the road's own day (sim/scrape.mjs). */
export function advanceDisease(world) {
  for (const person of Object.values(world.entities)) {
    if (person.kind !== 'person' || GONE.includes(person.health?.condition)) continue;
    mend(world, person);
  }
}

// The spring's word reaches each family by express, settlement by settlement (sim/expresses.mjs `sendExpress`, docs/COLONIES.md
// §5.4c), so a test that waited for the moment every family used to hear it waits instead until the families it reads have heard.
// Word of the Alamo's fall leaves Gonzales late in the second period, so a family far off may hear it only in the third: the
// class is carried on into the spring for it, as the Host would.
import { stepWorld } from '../../sim/world.mjs';
import { beginThirdPeriod } from '../../sim/periods.mjs';

/** Whether this family has heard the word - `firm`: more than a rumour. */
export const hasHeard = (world, householdId, topicId, firm = true) => {
  const known = world.knowledge.households[householdId]?.[topicId];
  return Boolean(known && (!firm || known.status !== 'rumor'));
};

/** Steps the class on until every one of these families has heard the word (and `also` holds); into the spring if it must. */
export function untilHeard(world, householdIds, topicId, { firm = true, also = () => true, limit = 9000 } = {}) {
  const done = () => also() && [...new Set(householdIds)].every(id => hasHeard(world, id, topicId, firm));
  const run = () => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
  run();
  if (!done() && world.period === 2 && world.director.complete) { beginThirdPeriod(world); world.status = 'running'; run(); }
  if (!done()) throw new Error(`${householdIds.join(', ')} never heard ${topicId}`);
  return world;
}

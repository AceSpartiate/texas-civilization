// A class on the real land with volunteers in the army, for Concepción and the Grass Fight (sim/concepcion-grass.mjs).
//
// Not a test file: `node --test` picks up `*.test.mjs`, and this is imported, never run. Each base class is played once and
// handed out as a copy, so a test file pays for the march to Béxar once.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../../sim/world.mjs';
import { momentOf } from '../../sim/directors.mjs';

export const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
export const until = (world, done, limit = 4000) => { for (let tick = 0; tick < limit && !done() && world.status === 'running'; tick++) stepWorld(world); return done(); };
export const untilMinute = (world, minute) => until(world, () => world.minute >= minute);
export const FAR = ['san-felipe', 'mina', 'victoria', 'liberty'];

const bases = new Map();
/**
 * A colonies class in which the first families of the far settlements have each sent one person to the army, on the way
 * given in `modes` (a horse that goes with its rider, or on foot), played to just after the director's moment `to`. Families
 * past `modes.length` are left with their call unanswered. Returns a copy, and who was sent.
 */
export function armyClass(seed, { modes = ['horse', 'horse', 'foot'], to = 'detachment', players = 15, settlements = FAR } = {}) {
  const key = JSON.stringify([seed, modes, to, players, settlements]);
  if (!bases.has(key)) {
    const world = createGonzalesWorld(seed, players, { map: 'colonies' });
    world.status = 'running';
    const families = Object.values(world.households).filter(household => settlements.includes(household.settlementId));
    const sent = [];
    for (const household of families.slice(0, modes.length)) {
      until(world, () => world.calls?.[household.id]);
      const answerers = view(world, household.id).request?.answerers || {};
      const found = Object.entries(answerers).find(([, options]) => options.find(option => option.id === 'turn-out')?.can);
      if (!found) continue;
      applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: modes[sent.length] });
      sent.push({ householdId: household.id, personId: found[0], mode: modes[sent.length] });
    }
    until(world, () => sent.every(({ personId }) => world.army?.members.includes(personId)));
    untilMinute(world, momentOf(world, to) + 1);
    const idle = families.slice(modes.length).map(household => household.id);
    bases.set(key, { world, sent, idle });
  }
  const { world, sent, idle } = bases.get(key);
  return { world: structuredClone(world), sent: sent.map(one => ({ ...one })), idle: [...idle] };
}
/** A family with nobody in the army at all: a Gonzales family nobody sent anywhere. */
export const nobodyThere = world => Object.values(world.households).find(household => household.members.every(id => !world.army?.members.includes(id) && !world.entities[id]?.commitments?.some(promise => promise.id === 'volunteer')))?.id;
export { momentOf };

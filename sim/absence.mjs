// A family whose student has gone (owner, 2026-09-16, docs/HOST_PAGE.md): "Absent families automatically become npc, but
// may be played again by the player if they return later."
//
// The server watches presence - a student's page keeps an event stream open, and a household whose stream has been closed
// for longer than its grace is absent (server/app.mjs `absentMs`) - and tells the world through `setAbsent`. While absent
// the family is run exactly as a family nobody plays: the neighbours' director gives its orders (sim/neighbours.mjs
// `automatic`), every question is answered the tick it is asked at the shares families nobody plays use (sim/chores.mjs,
// sim/army.mjs, sim/alamo.mjs), and nothing of the family's holds the class's calendar (sim/clock.mjs `deciding`). When the
// student's page opens again the family is theirs the same tick: nothing is recalled, and whatever the director began
// finishes as an order would.
//
// `household.absent` is true or absent (never false), so no class saved before this carries anything new.
import { record } from './events.mjs';

export const isAbsent = household => Boolean(household?.absent);

export function setAbsent(world, household, absent) {
  if (!household || Boolean(household.absent) === Boolean(absent)) return false;
  if (absent) household.absent = true; else delete household.absent;
  record(world, 'consequence', {
    householdId: household.id, importance: 2,
    text: absent
      ? 'Nobody is at the screen for this family. It goes on by itself, as its neighbours do, until somebody comes back.'
      : 'Somebody is back at the screen. The family\'s choices are its own again.',
  });
  return true;
}

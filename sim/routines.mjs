// Routine time cannot create death/capture/severe injury or settle loans/service.
import { record } from './events.mjs';
import { housekeepingSaving } from './family.mjs';

// Fatigue, and the only thing that mends it.
//
// Before this existed, `tired` had exactly one source - `settleHelp`, at the very end of
// the slice - so nobody was ever tired while it still mattered, the hurt rung of the
// march was unreachable, and the delivered injured pose could not occur in a played
// class. Walking is the second source, and it is deliberately the one tied to geography:
// `progressTravel` counts the miles a person covers on their own feet, and a household
// nineteen miles from Gonzales now pays for that in the state of whoever it sends.
//
// Twenty miles is a long day on foot and is invented for gameplay, like every other
// number here. Nothing about it is presented as history.
export const TIRING_MILES = 20;
// Hysteresis, so somebody hovering at the threshold does not flicker between states with
// every tick of rest.
export const RESTED_MILES = 7;
// Rest is the only thing that undoes it: about four and a half miles an hour of sitting
// still. Working does not mend it, which is what gives the Rest verb something to do.
export const REST_MILES_PER_MINUTE = 0.075;

export function advanceRoutine(world, minutes) {
  const days = minutes / 1440;
  for (const household of Object.values(world.households)) {
    const present = household.members.map(id => world.entities[id]).filter(e => e.location.siteId === household.homeSiteId && e.health.condition !== 'dead');
    // Someone on a chore is paid by the chore's own yield. Counting them here as well
    // would pay a family twice for the same afternoon's work.
    const workers = present.filter(e => e.task === 'work' && !e.chore && e.health.condition === 'well').length;
    // The best housekeeper at home makes what the family eats go further (FIC-GONZ-021).
    const eaten = present.length * .35 * (1 - housekeepingSaving(present));
    household.resources.food = Math.max(0, Math.round((household.resources.food + (workers - eaten) * days) * 10000) / 10000);
  }
  for (const entity of Object.values(world.entities)) {
    if (entity.health?.condition === 'minor-injury' && Number.isFinite(entity.health.recoversAt) && entity.health.recoversAt <= world.minute) entity.health = { condition: 'well' };
    restAndTire(world, entity, minutes);
  }
}

function restAndTire(world, entity, minutes) {
  if (entity.kind !== 'person' || !entity.householdId) return;
  const exertion = entity.exertion || 0;
  // Sitting still is the only thing that mends it, and somebody on the road is not.
  if (entity.task === 'rest' && !entity.travel && exertion > 0) {
    entity.exertion = Math.max(0, Math.round((exertion - REST_MILES_PER_MINUTE * minutes) * 10000) / 10000);
  }
  const condition = entity.health?.condition;
  // Routine time may make somebody tired and may mend it. It may never touch a death, a
  // capture or an injury - those are settled where they happen and never here.
  if (condition === 'well' && (entity.exertion || 0) >= TIRING_MILES) {
    entity.health = { condition: 'tired' };
    record(world, 'condition', {
      actorId: entity.id, householdId: entity.householdId, importance: 2,
      text: `${entity.name} is tired after ${Math.round(entity.exertion)} miles on the road.`,
    });
  } else if (condition === 'tired' && (entity.exertion || 0) <= RESTED_MILES) {
    entity.health = { condition: 'well' };
    record(world, 'condition', {
      actorId: entity.id, householdId: entity.householdId, importance: 2,
      text: `${entity.name} has rested and is fit again.`,
    });
  }
}

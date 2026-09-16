// Routine time cannot create death/capture/severe injury or settle loans/service.
import { record } from './events.mjs';
import { housekeepingSaving } from './family.mjs';
import { shelterOf } from './houses.mjs';
import { furnitureShares } from './furniture.mjs';
import { campRestShare } from './shops.mjs';

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

/**
 * Routine life over `minutes` of the calendar (sim/clock.mjs, docs/COLONIES.md §5.7).
 *
 * Every one of these belongs to days rather than to effort, so all of it reads the calendar
 * and none of it reads the tick: what a family eats, what spoils, what a wound needs, and
 * what sitting still mends. Somebody who rests through four hours of 1835 has rested four
 * hours. The miles that tire them are counted where they are covered, in `progressTravel`,
 * and scale with the calendar for the same reason.
 */
export function advanceRoutine(world, minutes) {
  const days = minutes / 1440;
  for (const household of Object.values(world.households)) {
    const present = household.members.map(id => world.entities[id]).filter(e => e.location.siteId === household.homeSiteId && e.health.condition !== 'dead');
    // Someone on a chore is paid by the chore's own yield. Counting them here as well
    // would pay a family twice for the same afternoon's work.
    const workers = present.filter(e => e.task === 'work' && !e.chore && e.health.condition === 'well').length;
    // The best housekeeper at home makes what the family eats go further (FIC-GONZ-021).
    // Furniture under a roof does its small part (sim/furniture.mjs): a table stretches the food, shelves keep it.
    const furnished = furnitureShares(household, shelterOf(world, household).kind === 'house');
    const eaten = present.length * .35 * (1 - housekeepingSaving(present)) * furnished.eaten;
    const fed = Math.max(0, household.resources.food + (workers - eaten) * days);
    // A little of the food spoils in a camp or a draughty house; nothing in a tight one, or in the
    // cabin every class saved before houses always had (sim/houses.mjs, FIC-GONZ-024).
    const spoiling = shelterOf(world, household).spoilagePerDay * furnished.spoil;
    const kept = spoiling ? fed * (1 - spoiling * days) : fed;
    household.resources.food = Math.round(kept * 10000) / 10000;
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
    // Rest at home mends as well as the family's shelter lets it: less by the wagon or in a draughty
    // or crowded house, more in a tight one (sim/houses.mjs, sim/settling.mjs).
    // ceiling: only a family's own land has a shelter. Resting in town or at the timber mends
    // at the ordinary rate, because nothing yet says what shelter is there.
    const household = world.households[entity.householdId];
    const atHome = household && entity.location.siteId === household.homeSiteId;
    const shelter = atHome ? shelterOf(world, household) : null;
    const mended = REST_MILES_PER_MINUTE * minutes * (atHome ? shelter.restShare * furnitureShares(household, shelter.kind === 'house').rest * (shelter.kind === 'camp' ? campRestShare(household) : 1) : 1);
    entity.exertion = Math.max(0, Math.round((exertion - mended) * 10000) / 10000);
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

// Routine time cannot create death/capture/severe injury or settle loans/service.
import { record } from './events.mjs';
import { eatenADay, housekeepingSaving } from './family.mjs';
import { shelterOf } from './houses.mjs';
import { furnitureShares } from './furniture.mjs';
import { advanceStock } from './stock.mjs';
import { SICK_DAYS, SICK_PER_DAY, coldSky, sicknessWeight } from './scrape.mjs';
import { share } from './shares.mjs';
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
    // The cold, for a family still under canvas on its own land when a norther comes through (`FIC-GONZ-135`,
    // sim/scrape.mjs `COLD_WEIGHT`). On the road it is the third word of "disease, cold, rain and hunger"; at home it is
    // the reason a roof is worth having before the winter, and it reaches nobody who has one.
    coldAtHome(world, household);
    // The herd, which belongs to days in exactly this way: the calves come in the spring, the pigs off the autumn mast,
    // and what nobody has ridden out after drifts off the range (sim/stock.mjs, `HIST-TEX-112`). It costs nothing to
    // keep - "the pasturage is sufficiently good to dispense with feeding live stock" - so there is no eating here.
    advanceStock(world, household);
    const present = household.members.map(id => world.entities[id]).filter(e => e.location.siteId === household.homeSiteId && e.health.condition !== 'dead');
    // Someone on a chore is paid by the chore's own yield. Counting them here as well
    // would pay a family twice for the same afternoon's work.
    const workers = present.filter(e => e.task === 'work' && !e.chore && e.health.condition === 'well').length;
    // The best housekeeper at home makes what the family eats go further (FIC-GONZ-021).
    // Furniture under a roof does its small part (sim/furniture.mjs): a table stretches the food, shelves keep it.
    const furnished = furnitureShares(household, shelterOf(world, household).kind === 'house');
    // Each by their age today, in quarters of a grown share summed before anything is rounded (FIC-GONZ-360).
    const eaten = eatenADay(world, present) * (1 - housekeepingSaving(present)) * furnished.eaten;
    const fed = Math.max(0, household.resources.food + (workers - eaten) * days);
    // A little of the food spoils in a camp or a draughty house; nothing in a tight one, or in the
    // cabin every class saved before houses always had (sim/houses.mjs, FIC-GONZ-024).
    const spoiling = shelterOf(world, household).spoilagePerDay * furnished.spoil;
    const kept = spoiling ? fed * (1 - spoiling * days) : fed;
    household.resources.food = Math.round(kept * 10000) / 10000;
  }
  for (const entity of Object.values(world.entities)) {
    if (['minor-injury', 'wounded'].includes(entity.health?.condition) && Number.isFinite(entity.health.recoversAt) && entity.health.recoversAt <= world.minute) entity.health = { condition: 'well' };
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

/**
 * A norther over a family that has no roof up yet.
 *
 * The same rule as the road's (sim/scrape.mjs): the same hashed share, the same weights, the same words - so a class
 * has one way of falling sick and not two. It reaches **only a family whose shelter is a camp**, which on its own land
 * means the cabin is not up; a family in its own house is cold and nothing more, which is the line `FIC-GONZ-135`
 * draws. Rolled once a day, on the first tick of it.
 *
 * ceiling: there is no sickness at home in any other weather. This is the one the record puts somewhere - "many persons
 * died" of "disease, cold, rain and hunger" - and a general model of who falls ill on a frontier farm is a different
 * thing, and a grimmer one than this game is.
 */
function coldAtHome(world, household) {
  // The road rolls its own (sim/scrape.mjs), and a family on it must not be rolled twice for one day. **This is belt
  // and braces**: the loop below only looks at people standing at the family's own house, and nobody on the road is.
  // Taking it away changes no outcome, which is why no injection guards it (scripts/cold-injections.mjs says so).
  if (household.flight && household.flight.status !== 'home') return;
  const home = world.map.sites[household.homeSiteId];
  if (!home || shelterOf(world, household).kind !== 'camp') return;
  const day = Math.floor((world.minute || 0) / 1440);
  if (household.coldDay === day) return;
  household.coldDay = day;
  if (!coldSky(world, home, day)) return;
  const hungry = (household.resources?.food ?? 0) <= 0;
  let said = false;
  for (const id of household.members) {
    const person = world.entities[id];
    if (!person || person.location?.siteId !== household.homeSiteId) continue;
    if (!['well', 'tired'].includes(person.health?.condition)) continue;
    const weight = sicknessWeight(person, { hungry, cold: true });
    // The day's chance, not the tick's: this is rolled once a day (`coldDay`), exactly as the road's is, and scaling it
    // by the tick's own minutes as well made a family under canvas in a norther about seventy times safer than one on
    // the road in the same weather. Found 2026-09-21 by a test that put a roofless family through forty days of it and
    // watched nothing whatever happen.
    if (share(world, person.id, `cold-sick:${day}`) >= 1 - (1 - SICK_PER_DAY) ** weight) continue;
    person.health = { condition: 'sick', recoversAt: world.minute + SICK_DAYS * 1440 };
    record(world, 'consequence', {
      actorId: person.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-135',
      text: `${person.name} has fallen sick: a norther came through and the family has no roof up yet.`,
    });
    said = true;
  }
  return said;
}

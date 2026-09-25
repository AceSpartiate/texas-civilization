// Settling in: the families arrive, and camp by the wagon until there is a roof.
//
// docs/SETTLING_IN.md §4, step 2. The owner's words: "players should arrive at their farm in
// their wagons." So a new class begins with nobody at a homestead. Every family - its people,
// its ox, its horse and its wagon - is on its own track at dawn on September 28, at the fork
// where that track leaves the road, and travels in at the wagon's pace like any other journey.
// The party came up the road together (`FIC-GONZ-024`); the class begins as each family turns
// off towards its own land.
//
// There is no house on the land when they get there. Until a house has a roof the family
// camps by the wagon, and the camp costs a little and only a little: rest mends more slowly
// at the camp, and food left out keeps worse. That is all. This is peace, and a family is not
// meant to suffer for having arrived.
//
// A class saved before arrivals has no `arriving` marker and no `improvements.cabin`, which
// reads as the cabin that always stood (`improvementsOf`). It is housed, it camps nowhere,
// and it plays as it did - no save version moved.
import { holdingOf, holdingWords } from './grants.mjs';
import { record } from './events.mjs';
import { findPath } from './geography.mjs';
import { improvementsOf, setImprovement } from './improvements.mjs';
import { WAGON_SPEED } from './travel.mjs';
import { onRealLand, paceOf } from './ground.mjs';
import { loadSentence, wagonsOf } from './wagon.mjs';

/**
 * How much of the usual rest a person gets lying out by the wagon at their own land.
 *
 * Invented (`FIC-GONZ-024`), and stated on the family's land line. Two-thirds: enough to
 * notice after a long walk, too little to keep anybody from working.
 */
export const CAMP_REST_SHARE = 2 / 3;
/**
 * What share of the family's food spoils in a day with no roof over the stores.
 *
 * Invented (`FIC-GONZ-024`), stated on the family's land line. Three in a hundred: about half
 * a day's eating for a family of four across the whole Gonzales afternoon.
 * ceiling: only food spoils. Powder and seed ride dry under the wagon cover; damp powder is a
 * question for the weather, which docs/SETTLING_IN.md leaves for later.
 */
export const CAMP_SPOILAGE_PER_DAY = 0.03;

/** Whether this family has a roof over it. A class saved before arrivals always has. */
export const housed = household => improvementsOf(household).cabin === 'sound';

/** The fork where this family's own track leaves the road, which is where it begins. */
export function forkOf(world, household) {
  return Object.values(world.map.routes).find(route => route.to === household.homeSiteId)?.from ?? null;
}

/**
 * The whole family on its own track, not yet moving: the start of a new class.
 *
 * Every member and every piece of property gets the same journey at the wagon's pace, so the
 * family arrives together - nobody walks ahead of the ox, and the horse is led. Where each one
 * was standing in the yard, and what each was going to do, go with them as `settle`, so the
 * family ends up standing about its own land as a family always has.
 *
 * Called again after the family is rolled: anybody already on the road keeps their place, and
 * only the new people are put beside them.
 */
export function putOnTheRoad(world, household) {
  const fork = forkOf(world, household);
  const path = fork && findPath(world.map, fork, household.homeSiteId);
  if (!path) throw new Error(`No track in to ${household.homeSiteId}`);
  const pace = paceOf(path.points, path.ground, 'wagon');
  for (const id of [...household.members, ...household.property]) {
    const entity = world.entities[id];
    if (entity.travel?.purpose === 'arrive') continue;
    const settle = { x: entity.location.x, y: entity.location.y, ...(entity.kind === 'person' && { task: entity.task }) };
    entity.travel = { from: fork, to: household.homeSiteId, points: path.points.map(point => ({ ...point })), progress: 0, distance: path.distance, speed: WAGON_SPEED, mode: 'wagon', purpose: 'arrive', silent: true, settle, ...(pace.length && { pace: pace.map(run => [...run]) }) };
    entity.location = { ...path.points[0], siteId: null };
    if (entity.kind === 'person') entity.task = 'travel';
  }
  household.arriving = true;
}

/**
 * A new class: every family on the road, and no house on any land.
 *
 * Only a class the directors marked as starting on the families' arrival (`director.arrival`).
 */
export function beginArrivals(world) {
  if (!world.director?.arrival) return;
  for (const household of Object.values(world.households)) {
    setImprovement(world, household, 'cabin', 'none');
    putOnTheRoad(world, household);
    // On the real land the wagon comes in to the surveyor's mark and the family chooses where the house goes (sim/homesite.mjs).
    if (onRealLand(world)) household.choosingSite = true;
    // The wagons come in with what the family packed (sim/wagon.mjs), and are unloaded at the land.
    if (household.load?.length) for (const wagon of wagonsOf(world, household)) wagon.laden = true;
    // The founding line was written for a family that already lived here. Nothing has happened
    // in this class yet, so it is corrected in place rather than contradicted by a second one.
    sayTheArrival(world, household);
  }
}
/**
 * The founding line of a family on the road in, corrected in place: said at the start of a new class, and said again when the
 * family is rolled and fitted out with more wagons (sim/world.mjs `rollFamily`), before anything else has happened to it.
 */
export function sayTheArrival(world, household) {
  const founding = world.events.find(event => event.type === 'household-founded' && event.householdId === household.id);
  if (founding) Object.assign(founding, {
    claimId: 'FIC-GONZ-024',
    text: `Dawn on September 28, 1835. Your family has turned off the road${household.settlementId ? ` near ${world.map.sites[household.settlementId].name}` : ''} with ${teamWords(world, household)}, towards land of its own.`,
  });
}

/**
 * What the family comes in with, as the founding line says it: "the wagon, the ox and the horse", or for a family fitted out
 * with more (sim/beasts.mjs `fitOut`) "its two wagons, an ox to each, and the horse".
 */
export function teamWords(world, household) {
  const wagons = wagonsOf(world, household).length;
  if (wagons < 2) return 'the wagon, the ox and the horse';
  return `its ${NUMBER_WORDS[wagons] || wagons} wagons, an ox to each, and the horse`;
}
const NUMBER_WORDS = Object.freeze({ 2: 'two', 3: 'three', 4: 'four' });

/** Whether anybody or anything of this family is still on the road in. */
const stillArriving = (world, household) =>
  [...household.members, ...household.property].some(id => world.entities[id]?.travel?.purpose === 'arrive');

/**
 * A family that has all come in off the road has arrived, and its record says so once.
 *
 * Run after travel each tick. The people themselves arrive silently - six "arrived at" lines
 * and three more for the beasts would bury the one line that matters.
 */
export function advanceArrivals(world) {
  for (const household of Object.values(world.households)) {
    if (!household.arriving || stillArriving(world, household)) continue;
    delete household.arriving;
    // The wagon drawn over to the site the family chose: said once, and not as a second arrival on the land.
    if (household.site && world.events.some(event => event.type === 'site-chosen' && event.householdId === household.id)
      && !world.events.some(event => event.type === 'arrival' && event.householdId === household.id && event.purpose === 'site')) {
      record(world, 'arrival', { householdId: household.id, importance: 2, destination: household.homeSiteId, purpose: 'site', claimId: 'FIC-GONZ-026', text: housed(household) ? 'The wagon is drawn up at the house.' : 'The wagon is drawn up where the house will stand, and the family makes camp beside it.' });
      continue;
    }
    record(world, 'arrival', {
      householdId: household.id, importance: 2, destination: household.homeSiteId, purpose: 'arrive', claimId: 'FIC-GONZ-024',
      // What the wagon brought is said once, here, and not every time it was repacked in the lobby.
      text: [
        housed(household) ? 'The family has reached its own land.' : 'The family has reached its own land. There is no house yet, so they camp by the wagon.',
        ...(household.load ? [loadSentence(household.load)] : []),
        ...(household.stock ? [`The cattle and hogs come in behind the ${wagonsOf(world, household).length > 1 ? 'wagons' : 'wagon'}.`] : []),
        holdingWords(holdingOf(world, household)),
        ...(household.choosingSite ? ["The wagon stands at the surveyor's mark. Choose where the house will stand."] : []),
      ].join(' '),
    });
  }
}

/**
 * What the family's shelter is and what it costs them, for their own land line.
 *
 * The camp's effects are stated in numbers on the family's own panel - `FIC-GONZ-008`, a
 * cost a student can see rather than one they discover.
 */
export function shelterProjection(household) {
  return {
    shelter: housed(household) ? 'house' : 'camp',
    ...(household.arriving && { arriving: true }),
    ...(!housed(household) && { camp: { restShare: CAMP_REST_SHARE, spoilagePerDay: CAMP_SPOILAGE_PER_DAY } }),
  };
}

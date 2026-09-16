// Who has the family's horse, ox and wagon (owner's playtest, 2026-09-16).
//
// "More than one character is able to use each mode of transportation even if it's already in use, that shouldn't be the
// case." The rule before this was that a beast belonged to whoever took it only while it was on the road: the moment the
// journey ended `borrowedBy` was cleared, so a mother who walked to town behind her husband could ride his horse home and
// leave him standing in the street, and two people sent to the timber could take turns with one wagon.
//
// The rule now: **whoever takes it keeps it until it is home.** A beast taken on a journey is that person's while it is on
// the road with them, while it stands where they are standing, and while it marches with them in the army. It is free
// again when it comes back to its own family's land, when the person who has it goes on without it, or when they can no
// longer go anywhere. Using the wagon uses the ox, because the ox pulls it: both are held together and freed together.
//
// ceiling: only journeys hold a beast. Hauling logs behind the ox (sim/felling.mjs `oxFree`) and a harvest that wants the
// wagon in the yard use them at home without holding them, so somebody may still drive off with the ox mid-haul. Hold them
// there too if a class ever finds the log pile short for it.
//
// This file imports only the travel table, so `sim/world.mjs` (journeys) and `sim/army.mjs` (the march) can both ask it
// without an import arrow between those two.
import { DEFAULT_MODE, MODES, propertyId } from './travel.mjs';

/** The plain word for each piece of property, used in every sentence about it. */
export const NOUN = Object.freeze({ ox: 'ox', horse: 'horse', wagon: 'wagon' });
export const ROLES = Object.freeze(['horse', 'ox', 'wagon']);
const GONE = ['dead', 'captured'];

const homeOf = (world, beast) => world.households[beast.householdId]?.homeSiteId;
const marching = person => person?.travel?.purpose === 'march';

/**
 * The person who has this beast now, or the household it is out with, or null when it is free.
 *
 * Read from where things are, not trusted from the stored name alone: a `borrowedBy` that names somebody who has gone on
 * without it, or who is dead, holds nothing. A beast standing on its own family's land is nobody's.
 */
export function holderOf(world, beast) {
  const by = beast?.borrowedBy;
  if (!by) return null;
  const person = world.entities[by];
  // Lent out to another household as a whole: a state the field has always allowed, said in that household's name.
  if (!person) return world.households[by] || null;
  if (person.kind !== 'person' || GONE.includes(person.health?.condition)) return null;
  // On the road: harnessed to their journey, or carried along with them in the ranks.
  if (beast.travel) return beast.travel.purpose === 'arrive' ? null : person;
  if (beast.location.siteId === homeOf(world, beast)) return null;
  // Standing where they stand, or with them in the army while it marches.
  if (person.location.siteId && person.location.siteId === beast.location.siteId) return person;
  return marching(person) ? person : null;
}

/** The sentence refusing somebody a beast another has: "Maria has the horse." */
export const hasWords = (holder, roles) => `${holder?.name || 'Somebody'} has the ${roles.map(role => NOUN[role]).join(' and ')}.`;

/**
 * The way of going whose beasts this person has with them, or on foot when they have none. What somebody leaving the army
 * goes home on: the horse they rode to the gathering came with them.
 */
export function modeWith(world, entity) {
  const found = Object.values(MODES).find(mode => mode.needs.length
    && mode.needs.every(role => holderOf(world, world.entities[propertyId(entity.householdId, role)] || {}) === entity));
  return found ? found.id : DEFAULT_MODE;
}

const theirs = (world, entity) => ROLES.map(role => world.entities[propertyId(entity.householdId, role)]).filter(beast => beast && beast.borrowedBy === entity.id);

/** Before a journey is judged: a beast marching with this person is set down beside them, so it can go on with them. */
export function bringAlong(world, entity) {
  if (!entity.location.siteId) return;
  for (const beast of theirs(world, entity)) {
    if (beast.travel?.purpose !== 'march') continue;
    beast.travel = null;
    beast.location = { x: entity.location.x, y: entity.location.y, siteId: entity.location.siteId };
  }
}

/** As a journey begins: any beast of theirs it does not take is left where it stands, and is free for whoever is there. */
export function leaveBehind(world, entity, mode) {
  for (const role of ROLES) {
    const beast = world.entities[propertyId(entity.householdId, role)];
    if (beast && beast.borrowedBy === entity.id && !mode.needs.includes(role) && !beast.travel) beast.borrowedBy = null;
  }
}

/**
 * Once a tick, after the army has moved: whatever somebody rode to the army goes with them in the ranks, on the army's own
 * halted journey (sim/army.mjs `marchingTravel`), and they are drawn on it. When they leave the ranks by any way that is not a
 * journey of their own - the fight at Concepción - it is set down where they are.
 */
export function keepWithRiders(world) {
  for (const household of Object.values(world.households)) {
    for (const role of ROLES) {
      const beast = world.entities[propertyId(household.id, role)];
      if (!beast?.borrowedBy) continue;
      const person = world.entities[beast.borrowedBy];
      if (!person || person.kind !== 'person') continue;
      if (marching(person) && !GONE.includes(person.health?.condition) && (beast.travel?.purpose === 'march' || holderOf(world, beast) === person)) {
        const road = person.travel;
        beast.travel = { from: road.from, to: road.to, points: road.points, distance: road.distance, progress: road.progress, speed: road.speed, mode: modeWith(world, person), purpose: 'march', halted: true, silent: true };
        beast.location = { x: person.location.x, y: person.location.y, siteId: null };
        continue;
      }
      if (beast.travel?.purpose !== 'march') continue;
      // Out of the ranks without a journey of their own: set down where they are, or where the road they left last passed.
      // ceiling: a rider out of the ranks and somehow on the road without having begun a journey is left for the next tick;
      // nothing does that today (`callHome` begins one).
      if (!person.location.siteId) continue;
      beast.travel = null;
      beast.location = { x: person.location.x, y: person.location.y, siteId: person.location.siteId };
      if (GONE.includes(person.health?.condition)) beast.borrowedBy = null;
    }
    // The march's own mode on a marcher is walking; one with their horse with them is riding it.
    for (const id of household.members) {
      const person = world.entities[id];
      if (marching(person)) person.travel.mode = modeWith(world, person);
    }
  }
}

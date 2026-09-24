// Who has the family's horse, ox and wagon (owner's playtest, 2026-09-16), and since 2026-09-24 its rifle: one person at a
// time, and nobody else until they are done.
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
// **Amended by the owner, 2026-09-24** (docs/TOWNS.md §4b): "If someone is using the wagon (or horse, or any item really),
// then no one else can use it." So work holds things too, not only journeys - the ceiling this file carried until then
// ("only journeys hold a beast ... somebody may still drive off with the ox mid-haul") is paid - and this file is the one
// place that says who is using what (`userOf`). A thing is held in one of two ways, and no other:
//
//   - **On the road, or standing with somebody away from home** (`holderOf`): `borrowedBy` on the beast, read against where
//     it is, as above.
//   - **By the work somebody was given** (`chore.with` on the person): written when the work begins (sim/chores.mjs
//     `beginChore`) - the rifle for a hunt, the ox for hauling logs behind it, the ox and wagon for a harvest that wants
//     them, and the beasts a journey the work will make takes, from the moment the work is given until that road begins
//     (`intoTheRoad`). It is part of the work, so **every way the work ends lets go of it**: finished, called off, left off
//     for a call or the march, dropped when the family flees, or the person dead or taken. Nothing has to remember to clear it.
//
// A class saved before 2026-09-24 has no `with` on anybody's work; the save's one door (server/storage.mjs `readSave`,
// sim/chores.mjs `deriveUses`) writes it from the work itself, so a hunt in hand opens holding the rifle. No version moved.
//
// ceiling: the family's tools - hoe, felling axe, broadaxe, froe, auger - are not held. The work that uses them is the
// family's together at one place (raising the house, clearing a plot, planting and bringing in the field), which the owner
// decided goes faster with more hands (docs/SETTLING_IN.md), and one axe held by one person would undo that. Open for the
// owner (docs/TOWNS.md §4b): whether the felling axe is held when somebody takes it off the land (fetching logs, a bee
// tree), and whether the rifle goes with somebody who turns out for a call or the army (sim/calls.mjs says they take it;
// nothing holds it yet, so the family at home still hunts).
//
// This file imports only the travel table, so `sim/world.mjs` (journeys), `sim/army.mjs` (the march) and `sim/chores.mjs`
// (work) can all ask it without an import arrow between them.
import { DEFAULT_MODE, MODES, propertyId } from './travel.mjs';

/** The plain word for each piece of property, used in every sentence about it. */
export const NOUN = Object.freeze({ ox: 'ox', horse: 'horse', wagon: 'wagon', rifle: 'rifle' });
export const ROLES = Object.freeze(['horse', 'ox', 'wagon']);
/** Every thing only one person at a time can have: the three beasts, and the family's rifle (owner, 2026-09-24). */
export const ITEMS = Object.freeze([...ROLES, 'rifle']);
/**
 * Work that shares what it holds with others given the same work: everybody bringing in one field loads the one wagon
 * standing in it. Anybody else still cannot take it away.
 */
const SHARED = Object.freeze({ 'harvest-field': true });
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

/**
 * Who is using this thing of the family's now, other than `asker`, or null when it is free for them. The one rule every order
 * that needs a thing asks: `modeAvailability` (sim/world.mjs) for a journey, `choreAvailability` (sim/chores.mjs) for work,
 * and through them the errand to town (sim/errands.mjs), the director of a family nobody plays, and auto. `work` is the work
 * `asker` would be given: somebody sent to the same shared work is not refused what their fellow workers hold (`SHARED`).
 */
export function userOf(world, household, item, asker = null, { work = null } = {}) {
  if (!household) return null;
  if (ROLES.includes(item)) {
    const beast = world.entities[propertyId(household.id, item)];
    const holder = beast ? holderOf(world, beast) : null;
    if (holder && holder !== asker) return holder;
  }
  for (const id of household.members || []) {
    const person = world.entities[id];
    if (!person || person === asker || GONE.includes(person.health?.condition)) continue;
    if (!person.chore?.with?.includes(item)) continue;
    if (work && SHARED[work] && person.chore.id === work) continue;
    return person;
  }
  return null;
}

/**
 * The sentence refusing somebody a thing another has, in the holder's own name and, when the world is given, with what they
 * are doing with it (owner, 2026-09-24): "Maria has the horse, on the road to Gonzales." "Rosa has the rifle, hunting in the
 * timber." Without the world, or with nothing to add, as it always was: "Maria has the horse."
 */
export function hasWords(holder, roles, world = null, asker = null) {
  const what = `${holder?.name || 'Somebody'} has the ${roles.map(role => NOUN[role]).join(' and ')}`;
  const where = world && holder?.kind === 'person' ? doingWith(world, holder, asker) : null;
  return where ? `${what}, ${where}.` : `${what}.`;
}
/**
 * What somebody holding a thing is doing with it, in the words the family already reads about them. Where they stand is
 * said only when it is not where the person asking stands: two people in Gonzales need not be told the other is in Gonzales.
 */
function doingWith(world, person, asker) {
  const travel = person.travel, home = world.households?.[person.householdId]?.homeSiteId;
  const named = id => (world.map?.sites?.[id]?.name || '').replace(/^The /, 'the ');
  if (travel) {
    if (travel.purpose === 'march') return 'with the army';
    if (travel.to === home) return 'on the road home';
    return named(travel.to) ? `on the road to ${named(travel.to)}` : 'on the road';
  }
  if (person.chore?.doing) return person.chore.doing;
  const site = person.location?.siteId;
  return site && site !== home && site !== asker?.location?.siteId && named(site) ? `at ${named(site)}` : null;
}

/**
 * A journey begins with what the work held for it: those beasts are on the road with the person now (`holderOf`), so the
 * work lets go of them (sim/world.mjs `harness`). What the work holds that is not on the road - the rifle - it keeps.
 */
export function intoTheRoad(entity, roles) {
  const held = entity.chore?.with;
  if (!held) return;
  const left = held.filter(item => !roles.includes(item));
  if (left.length) entity.chore.with = left; else delete entity.chore.with;
}
/** A stored use that is not a thing a family holds (sim/world.mjs `validateWorld`). */
export function usesInvalid(world) {
  for (const entity of Object.values(world.entities)) {
    const held = entity.chore?.with;
    if (held === undefined) continue;
    if (!Array.isArray(held) || !held.length || held.some(item => !ITEMS.includes(item)) || new Set(held).size !== held.length) return 'Invalid use of family property';
  }
  return null;
}

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

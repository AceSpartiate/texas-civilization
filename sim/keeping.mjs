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
// **The owner's answers, 2026-09-24** (docs/TOWNS.md §4b):
//
//   - **The felling axe is held off the land.** Whoever carries it away from the family's own land - fetching logs, a bee
//     tree, a small tree for furniture from timber off the land - has it until they are home, and nobody fells or builds
//     with it meanwhile. At home the tools stay the family's together: everybody working the axe at home shares it
//     (`chore.shares`), and one of them cannot carry it off while the others are at it.
//   - **He takes the rifle to war.** A man who turns out for a call, goes upriver with the march, or leaves to enlist or join
//     a garrison, the relief, the Matamoros men or Houston carries the family's rifle for as long as he is away
//     (`person.carries`, written by `takeToWar`), and the refusal names him. He has it until he is home again; the dead and
//     the taken hold nothing (`homeAgain`).
//     ceiling: a man killed or taken does not lose the rifle with him - the family has it again - because nothing in the
//     game sells a rifle, and a family left without one for the rest of the class could never hunt again.
//   - The other tools - hoe, broadaxe, froe, auger - are never carried off the land by any work, and stay shared.
//
// This file imports only the travel table, so `sim/world.mjs` (journeys), `sim/army.mjs` (the march) and `sim/chores.mjs`
// (work) can all ask it without an import arrow between them.
import { DEFAULT_MODE, MODES, propertyId } from './travel.mjs';

/** The plain word for each piece of property, used in every sentence about it. */
export const NOUN = Object.freeze({ ox: 'ox', horse: 'horse', wagon: 'wagon', rifle: 'rifle', axe: 'felling axe' });
export const ROLES = Object.freeze(['horse', 'ox', 'wagon']);
/** Every thing only one person at a time can have: the three beasts, the family's rifle, and the felling axe off the land. */
export const ITEMS = Object.freeze([...ROLES, 'rifle', 'axe']);
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
export function userOf(world, household, item, asker = null, { work = null, shares = [] } = {}) {
  if (!household) return null;
  if (ROLES.includes(item)) {
    const beast = world.entities[propertyId(household.id, item)];
    const holder = beast ? holderOf(world, beast) : null;
    if (holder && holder !== asker) return holder;
  }
  for (const id of household.members || []) {
    const person = world.entities[id];
    if (!person || person === asker || GONE.includes(person.health?.condition)) continue;
    // Gone to the war with it (`takeToWar`), until home again.
    if (away(world, household, person) && person.carries?.items?.includes(item)) return person;
    if (!person.chore?.with?.includes(item)) continue;
    if (work && SHARED[work] && person.chore.id === work) continue;
    // Work at home that shares it with other work at home: the felling axe among everybody felling and building.
    if (shares.includes(item) && person.chore.shares?.includes(item)) continue;
    return person;
  }
  return null;
}
/** Not standing on the family's own place: on a road, or anywhere but home. */
const away = (world, household, person) => Boolean(person.travel) || person.location?.siteId !== household.homeSiteId;

/**
 * A man going to the war takes the family's rifle (owner, 2026-09-24): called from every way he goes - a settlement's call
 * (sim/calls.mjs), the march upriver (sim/directors.mjs), the winter's enlisting and joining (sim/chores.mjs, the winter's
 * chores) - after his road has begun, with the words the refusal will use ("gone with the volunteers to Gonzales"). Returns
 * who else has it when somebody already does - a hunter out in the timber - and then he goes without it; the caller says so.
 */
export function takeToWar(world, household, entity, doing) {
  const holder = userOf(world, household, 'rifle', entity);
  // Gone without it, and remembered so: a class reopened does not hand him the rifle he never took (sim/chores.mjs `deriveUses`).
  entity.carries = { items: holder ? [] : ['rifle'], doing };
  return holder;
}
/**
 * Once a tick (sim/world.mjs, after the journeys): whoever went to the war with the rifle and is home again, or is dead or
 * taken, has let it go. A prisoner (sim/houston.mjs, `service.status` 'prisoner') is taken. Only a man at home and still is
 * home; one who has come home and gone out again on an errand went without it.
 */
export function homeAgain(world) {
  for (const household of Object.values(world.households)) {
    for (const id of household.members || []) {
      const person = world.entities[id];
      if (!person?.carries) continue;
      if (GONE.includes(person.health?.condition) || person.service?.status === 'prisoner' || !away(world, household, person)) delete person.carries;
    }
  }
}

/**
 * The sentence refusing somebody a thing another has, in the holder's own name and, when the world is given, with what they
 * are doing with it (owner, 2026-09-24): "Maria has the horse, on the road to Gonzales." "Rosa has the rifle, hunting in the
 * timber." Without the world, or with nothing to add, as it always was: "Maria has the horse."
 */
export function hasWords(holder, roles, world = null, asker = null) {
  const what = `${holder?.name || 'Somebody'} has the ${roles.map(role => NOUN[role]).join(' and ')}`;
  // Gone to the war with it: said in the words he went with, until he is on his way home.
  const war = holder?.carries && roles.some(role => holder.carries.items?.includes(role));
  const homeward = holder?.travel && holder.travel.to === world?.households?.[holder.householdId]?.homeSiteId;
  if (war && world && !homeward) return `${what}, ${holder.carries.doing}.`;
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
  letGo(entity, roles);
}
/** Work lets go of these things: out of `with`, and out of `shares` with them. */
export function letGo(entity, items) {
  const state = entity.chore;
  if (!state?.with) return;
  const left = state.with.filter(item => !items.includes(item));
  if (left.length) state.with = left; else delete state.with;
  if (state.shares) {
    const shared = state.shares.filter(item => left.includes(item));
    if (shared.length) state.shares = shared; else delete state.shares;
  }
}
/**
 * Home with the felling axe from off the land (sim/world.mjs `progressTravel`, on arriving home): it is the family's again
 * at home, shared by whoever works it there, and the work that carried it off holds it no more.
 */
export function axeHome(entity) {
  if (entity.chore?.with?.includes('axe') && !entity.chore.shares?.includes('axe')) letGo(entity, ['axe']);
}
/** A stored use that is not a thing a family holds (sim/world.mjs `validateWorld`). */
export function usesInvalid(world) {
  for (const entity of Object.values(world.entities)) {
    const held = entity.chore?.with;
    if (held === undefined) continue;
    if (!Array.isArray(held) || !held.length || held.some(item => !ITEMS.includes(item)) || new Set(held).size !== held.length) return 'Invalid use of family property';
    const shared = entity.chore.shares;
    if (shared !== undefined && (!Array.isArray(shared) || !shared.length || shared.some(item => !held.includes(item)))) return 'Invalid use of family property';
  }
  for (const entity of Object.values(world.entities)) {
    const carried = entity.carries;
    if (carried === undefined) continue;
    if (!carried || !Array.isArray(carried.items) || carried.items.some(item => !ITEMS.includes(item)) || typeof carried.doing !== 'string' || !carried.doing) return 'Invalid use of family property';
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

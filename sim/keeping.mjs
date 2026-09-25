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
//     Amended the same day (docs/TOWNS.md §4c): the gunsmith sells rifles now, so **a man killed, captured or taken prisoner
//     loses the rifle he carried** (`homeAgain`), and a family can buy another. A family can own more than one of a thing
//     (sim/tools.mjs), and each person holds one copy: the refusal comes only when every copy is out.
//   - The other tools - hoe, broadaxe, froe, auger - are never carried off the land by any work, and stay shared.
//
// This file imports only the travel table, so `sim/world.mjs` (journeys), `sim/army.mjs` (the march) and `sim/chores.mjs`
// (work) can all ask it without an import arrow between them.
import { DEFAULT_MODE, MODES } from './travel.mjs';
import { TOOL_WORDS, loseTool, toolCount } from './tools.mjs';
import { BEAST_WORDS, allBeasts, beastsOf, kept } from './beasts.mjs';
import { record } from './events.mjs';

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
  // Each person holds one copy (owner, 2026-09-24, docs/TOWNS.md §4c): a thing a family has two of is refused only when both are
  // out. The work at home that shares the felling axe shares one copy among all of it. Since the same day a family may own more
  // than one horse or ox (sim/beasts.mjs, §4d): each animal is one person's, so two horses are two riders.
  const holders = [], home = [], sharedWork = new Set();
  const beasts = ROLES.includes(item) ? beastsOf(world, household, item).filter(kept) : null;
  // Beasts out with somebody: counted by the animal, since one person may have two with them (riding one, leading one home).
  let out = 0;
  for (const beast of beasts || []) {
    const holder = holderOf(world, beast);
    if (!holder || holder === asker) continue;
    out++;
    if (!holders.includes(holder)) holders.push(holder);
  }
  const withBeasts = holders.length;
  for (const id of household.members || []) {
    const person = world.entities[id];
    if (!person || person === asker || GONE.includes(person.health?.condition) || holders.includes(person)) continue;
    // Gone to the war with it (`takeToWar`), until home again.
    if (away(world, household, person) && person.carries?.items?.includes(item)) { holders.push(person); continue; }
    if (!person.chore?.with?.includes(item)) continue;
    if (work && SHARED[work] && person.chore.id === work) continue;
    // Everybody at one shared work loads the one wagon: a second harvester holds no second copy (a family with two wagons since
    // 2026-09-25 has the other free for the road).
    if (SHARED[person.chore.id]) { if (sharedWork.has(person.chore.id)) continue; sharedWork.add(person.chore.id); }
    // Work at home that shares it with other work at home: the felling axe among everybody felling and building.
    if (person.chore.shares?.includes(item)) { if (!shares.includes(item)) home.push(person); continue; }
    holders.push(person);
  }
  // A thing the family has one of - the one wagon, the one horse every family has had - is whoever has it, as it always was (a
  // harvest's shared wagon is one wagon, however many load it). A family with more than one wagon (sim/beasts.mjs `fitOut`, the
  // wheelwright's) counts them as it counts horses: two wagons are two loads out at once, each behind its own ox.
  const copies = beasts ? Math.max(1, beasts.length) : COUNTED.includes(item) ? toolCount(household, item) : 1;
  if (copies === 1 && !COUNTED.includes(item)) return holders[0] || home[0] || null;
  const used = out + (holders.length - withBeasts) + (home.length ? 1 : 0);
  if (!used || used < copies) return null;
  const all = [...new Set([...holders, ...home])];
  return all.length === 1 ? all[0] : { kind: 'group', name: listed(all.map(one => one.name)), many: all, copies, householdId: household.id };
}
/** The things a family can own more than one of, held a copy at a time: the rifle and the felling axe (the beasts count themselves). */
const COUNTED = Object.freeze(['rifle', 'axe']);
const listed = names => names.length < 2 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
/**
 * The beast of this part this person would take now, or null: the one they already have with them first, else one standing where
 * they stand that nobody has, sound, and not one they are leading home (`leads`, sim/beasts.mjs) - a horse bought in town
 * walks home on its halter, and its buyer rides home on the horse they came on. `modeAvailability` and `harness` (sim/world.mjs)
 * both ask it, so the beast checked is the beast taken.
 */
export function beastFor(world, entity, role) {
  const household = world.households[entity.householdId];
  const leading = entity.leads || [];
  const beasts = beastsOf(world, household, role).filter(beast => !leading.includes(beast.id));
  const sound = beast => !beast.condition || beast.condition === 'sound';
  return beasts.find(beast => sound(beast) && holderOf(world, beast) === entity)
    || beasts.find(beast => sound(beast) && !holderOf(world, beast) && !beast.travel && beast.location?.siteId === entity.location?.siteId)
    || null;
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
  // A family with no rifle left - it went to the war with somebody else and was lost - sends him without one: 'none'.
  const holder = toolCount(household, 'rifle') ? userOf(world, household, 'rifle', entity) : 'none';
  // Gone without it, and remembered so: a class reopened does not hand him the rifle he never took (sim/chores.mjs `deriveUses`).
  entity.carries = { items: holder ? [] : ['rifle'], doing };
  return holder;
}
/**
 * What the family's story says of the rifle as he goes (`takeToWar`'s answer): taken, one of several taken, or gone without,
 * and why.
 */
export function warRifleWords(world, household, entity, other) {
  if (other === 'none') return `${entity.name} went without a rifle: there is none in the house.`;
  if (other) return `${entity.name} went without a rifle: ${hasWords(other, ['rifle'], world)}`;
  if (toolCount(household, 'rifle') > 1 && !userOf(world, household, 'rifle')) return `${entity.name} took one of the family's rifles; another is still at home.`;
  return `${entity.name} took the family's ${toolCount(household, 'rifle') > 1 ? 'last rifle' : 'rifle'}. Nobody at home can hunt or shoot until he is back.`;
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
      // Somebody dead or taken leads nothing home: the animal stands where they fell, free for whoever of the family comes to it.
      if (person && (person.leads || person.drives) && (GONE.includes(person.health?.condition) || person.service?.status === 'prisoner')) { delete person.leads; delete person.drives; }
      if (!person?.carries) continue;
      const taken = GONE.includes(person.health?.condition) || person.service?.status === 'prisoner';
      // The rifle is lost with him (owner's request of 2026-09-24, docs/TOWNS.md §4c): now that the gunsmith sells rifles, a
      // family whose man was killed or taken is short the one he carried, and says so, and can buy another.
      if (taken && person.carries.items?.includes('rifle')) {
        loseTool(household, 'rifle');
        record(world, 'property', { householdId: household.id, actorId: person.id, importance: 2, text: `The family's rifle was lost with ${person.name}. ${toolCount(household, 'rifle') ? `There ${toolCount(household, 'rifle') === 1 ? 'is one' : `are ${toolCount(household, 'rifle')}`} left in the house.` : 'There is no rifle in the house now; the gunsmith sells them.'}` });
      }
      if (taken || !away(world, household, person)) delete person.carries;
    }
  }
}

/**
 * The sentence refusing somebody a thing another has, in the holder's own name and, when the world is given, with what they
 * are doing with it (owner, 2026-09-24): "Maria has the horse, on the road to Gonzales." "Rosa has the rifle, hunting in the
 * timber." Without the world, or with nothing to add, as it always was: "Maria has the horse."
 */
export function hasWords(holder, roles, world = null, asker = null) {
  // Every copy out: "Alvin and Mateo have both rifles."
  if (holder?.kind === 'group') {
    const plural = roles.map(role => TOOL_WORDS[role]?.[1] || BEAST_WORDS[role]?.[1] || `${NOUN[role]}s`).join(' and ');
    return `${holder.name} have ${holder.copies === 2 ? 'both' : `all ${holder.copies}`} ${plural}.`;
  }
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
  const household = world.households[entity.householdId];
  const found = Object.values(MODES).find(mode => mode.needs.length
    && mode.needs.every(role => beastsOf(world, household, role).some(beast => holderOf(world, beast) === entity && !entity.leads?.includes(beast.id))));
  return found ? found.id : DEFAULT_MODE;
}

const theirs = (world, entity) => allBeasts(world, world.households[entity.householdId]).filter(beast => beast.borrowedBy === entity.id);

/** Before a journey is judged: a beast marching with this person is set down beside them, so it can go on with them. */
export function bringAlong(world, entity) {
  if (!entity.location.siteId) return;
  for (const beast of theirs(world, entity)) {
    if (beast.travel?.purpose !== 'march') continue;
    beast.travel = null;
    beast.location = { x: entity.location.x, y: entity.location.y, siteId: entity.location.siteId };
  }
}

/**
 * As a journey begins: any beast of theirs it does not take is left where it stands, and is free for whoever is there. `taking`
 * is the beasts the way takes (`beastFor` for each part it needs); what they lead home on a halter goes with them too.
 */
export function leaveBehind(world, entity, taking = []) {
  for (const beast of theirs(world, entity)) {
    if (taking.includes(beast) || entity.leads?.includes(beast.id) || beast.travel) continue;
    beast.borrowedBy = null;
  }
}

/**
 * Once a tick, after the army has moved: whatever somebody rode to the army goes with them in the ranks, on the army's own
 * halted journey (sim/army.mjs `marchingTravel`), and they are drawn on it. When they leave the ranks by any way that is not a
 * journey of their own - the fight at Concepción - it is set down where they are.
 */
export function keepWithRiders(world) {
  for (const household of Object.values(world.households)) {
    for (const beast of allBeasts(world, household)) {
      if (!beast.borrowedBy) continue;
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

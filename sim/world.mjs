// Pure deterministic simulation; credentials and renderer state never belong here.
import { buildColoniesRegion } from './colonies-region.mjs';
import { advanceNeighbours } from './neighbours.mjs';
import { record } from './events.mjs';
import { reportsFor, deliverReports } from './knowledge.mjs';
import { advanceRoutine } from './routines.mjs';
import { advanceDirectors, handleChoice, handleMarch, handleRumor, directorProjection } from './directors.mjs';
import { abandonChore, advanceChores, answerChore, askProjection, beginChore, choresFor, skillsFor, SKILL_CAP, toolState } from './chores.mjs';
import { advanceTown, createTownspeople, observedBy } from './town.mjs';
import { GOODS, advanceOffers, makeOffer, offersFor, respondToOffer } from './trade.mjs';
import { buildGonzalesRegion, findPath, polylineLength } from './geography.mjs';
import { advanceEncounters, askRider, carriedInPerson, encounterProjection, leaveRider, riderName, spotName } from './encounters.mjs';
import { DEFAULT_MODE, MODES, modeOf, moveOnGround, propertyId, RIDER_SPEED } from './travel.mjs';
import { paceOf } from './ground.mjs';
import { findWay } from './ways.mjs';
import { STATES as IMPROVEMENT_STATES, improvementProjection } from './improvements.mjs';
import { OLD_PATCHES, plotAt } from './fields.mjs';
import { advanceArrivals, putOnTheRoad, shelterProjection } from './settling.mjs';
import { defaultLoad, householdFromLoad, loadInvalid, setLoad, wagonProjection } from './wagon.mjs';
import { houseInvalid, houseProjection, noteLandSeen, planHouse, recordHelpDone } from './houses.mjs';
import { grantInvalid, grantProjection, layOutGrants, setStock } from './grants.mjs';
import { chooseSite, siteInvalid, siteProjection } from './homesite.mjs';
import { plotProjection, plotRefusal, plotsInvalid } from './survey.mjs';
import { advanceExpresses, expressesInvalid } from './expresses.mjs';
import { callsInvalid, handleCall } from './calls.mjs';
import { fellingInvalid, logsProjection, recordFelling } from './felling.mjs';
import { HOUSEHOLD_SHAPE, NAME_LIMIT, ROLES, TRAIT_RANGE, ageBand, defaultNames, familyProjection, familyRoll, FAMILY_DIE, compositionFor, rolledWords, householdName, kinFor, rename, rolledPeople, rollRefusal, tooYoung, tooYoungWhy } from './family.mjs';
export { HOUSEHOLD_SHAPE, ROLES, householdName, sanitiseName } from './family.mjs';
export { clearedOf, improvementsOf, ruin } from './improvements.mjs';
export { MODES, MODE_IDS, DEFAULT_MODE, carryCapacity, modeOf } from './travel.mjs';
export { record } from './events.mjs';
export function seededRandom(seed) {
  let value = 2166136261;
  for (const char of String(seed)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; };
}
export function createWorld(seed = 'gonzales', playerCount = 15, { map = 'gonzales', neighbours = false } = {}) {
  if (!Number.isInteger(playerCount) || playerCount < 5 || playerCount > 30) throw new Error('Class size must be 5–30');
  const random = seededRandom(seed);
  const world = { schemaVersion: 3, seed: String(seed), playerCount, tick: 0, minute: 0, status: 'lobby', entities: {}, households: {}, map: { sites: {}, routes: {}, terrain: [] }, events: [], nextEventId: 1, nextCourierId: 1, truth: {}, knowledge: { households: {}, public: {} }, barriers: [], offers: {}, nextOfferId: 1, encounters: {}, nextEncounterId: 1 };
  // Geography is researched pattern with invented coordinates; see sim/geography.mjs.
  // A class on the real land of the colonies (docs/COLONIES.md) or on the invented Gonzales country every class had before.
  if (!['gonzales', 'colonies'].includes(map)) throw new Error('Unknown map');
  const region = map === 'colonies' ? buildColoniesRegion(random, playerCount) : buildGonzalesRegion(random, playerCount);
  world.map.sites = region.sites; world.map.routes = region.routes; world.map.terrain = region.terrain; world.map.relief = region.relief; world.map.bounds = region.bounds; world.map.homeBounds = region.homeBounds; world.map.province = region.province;
  if (region.source) world.map.source = region.source;
  // The woods of the real land (sim/woods.mjs, docs/WOODS_AND_BUILDING.md §4). Absent on every class made before, which keeps timber by the water.
  if (region.woods) world.map.woods = region.woods;
  // Families nobody plays live their own lives in a class made with this on (sim/neighbours.mjs, docs/COLONIES.md §5.9).
  // Absent on every class made before, which keep their unplayed families idle, so no save version moved.
  if (neighbours) world.neighbours = true;
  for (let i = 1; i <= playerCount; i++) {
    const householdId = `hh-${i}`;
    const site = world.map.sites[`home-${i}`];
    // Corn or cotton, fixed at founding: `HIST-GONZ-013` documents both for this
    // locality and nothing else, so a household grows one of the two and never changes.
    const crop = random() < .5 ? 'corn' : 'cotton';
    // The wagon, packed with the sensible default, and the stores, tools and belongings that
    // follow from it (docs/SETTLING_IN.md step 3, sim/wagon.mjs). A student may repack it in the
    // lobby; one who never does has this. Its one draw is the one the founding food used to take.
    const load = defaultLoad(random);
    // No `name`. A household nobody has named is named for its own principal - "Jethro's
    // family" - which is a real family rather than a row number, and follows along if a
    // student renames him. A class saved when every household was `Family N` keeps that,
    // because a stored name is a name somebody chose. See sim/family.mjs.
    // On the real map a family belongs to the settlement it was dealt to (docs/COLONIES.md §5.1): its town for trade and its
    // neighbours. Absent on the invented map, where every family's town is Gonzales.
    const household = { id: householdId, homeSiteId: site.id, ...(site.settlementId && { settlementId: site.settlementId }), members: [], principalId: `${householdId}-thomas`, property: [], ...householdFromLoad(load), field: { crop, state: 'bare', changedTick: 0 }, relationships: { neighbor: 0 }, commitments: [], memories: [] };
    world.households[householdId] = household;
    world.knowledge.households[householdId] = {};
    // Names are dealt across the class so fifteen families are not fifteen copies of one;
    // kin says who these four are to each other, which is the question the first person to
    // play this asked and the game could not answer. **Ids keep the founding names** and
    // never change, because skills and faces are derived from them and a rename must not
    // move either - so `hh-3-thomas` may be a student's Bartolo. See sim/family.mjs.
    const names = defaultNames(world.seed, i - 1);
    const kin = kinFor(householdId);
    for (const [j, person] of HOUSEHOLD_SHAPE.entries()) {
      const id = `${householdId}-${person.key}`;
      addPerson(world, household, site, j, { id, name: names[j], kin: kin[id], adult: j < 2 });
    }
    // The yard is west of the cabin. The cropland runs east and south of it, so property
    // left at these coordinates used to stand in the middle of the corn - invisible when
    // a field was a flat green rectangle, and obviously wrong once it grew rows.
    // `species` is what tells the renderer an ox from a horse. A class saved before
    // there were horses has neither the field nor the animal, and an ox is the right
    // thing to draw for every animal such a save contains - the absent field has a
    // correct empty value, so no save version moved. `sim/trade.mjs` is the precedent.
    for (const beast of [
      // A few rods from the house, not a quarter mile: the yard was drawn round figures six times the size they are now
      // (public/app.js `PERSON_MILES`), and the ox stood in the next field.
      { role: 'ox', kind: 'animal', species: 'ox', name: 'Juniper the ox', dx: -.035, dy: .02 },
      { role: 'horse', kind: 'animal', species: 'horse', name: 'Bess the mare', dx: -.06, dy: .01 },
      { role: 'wagon', kind: 'wagon', name: 'Family wagon', dx: -.045, dy: .05 },
    ]) {
      const id = propertyId(householdId, beast.role);
      world.entities[id] = { id, name: beast.name, kind: beast.kind, ...(beast.species && { species: beast.species }), householdId, depth: 'aggregate', location: { x: site.x + beast.dx, y: site.y + beast.dy, siteId: site.id }, travel: null, condition: 'sound', borrowedBy: null };
      household.property.push(id);
    }
    record(world, 'household-founded', { householdId, text: 'Your family lives here, with food, an ox, a horse, and a wagon.' });
  }
  // The land marked out for every family, fixed from the start (sim/grants.mjs, docs/LAND_GRANTS.md).
  const grants = layOutGrants(world.map.sites);
  for (const household of Object.values(world.households)) household.grant = grants[household.homeSiteId];
  // The town has people in it. They belong to nobody and are commanded by nobody.
  createTownspeople(world);
  validateWorld(world); return world;
}
/**
 * One person into a household, standing in the yard. The first person added is the principal.
 *
 * Skills are fixed at founding and derived from the person's own id, so the members of a
 * family differ and a household may simply not contain anyone handy. `sex`, `age` and the
 * hidden `traits` exist only on a rolled family (`docs/FAMILY_CREATION.md`); a household
 * nobody rolled, and every class saved before rolling existed, simply has none.
 */
function addPerson(world, household, site, j, { id, name, kin, adult, sex, age, traits }) {
  world.entities[id] = {
    id, name, kind: 'person', householdId: household.id, depth: j === 0 ? 'detailed' : 'moderate', principal: j === 0,
    location: { x: site.x + j * .012, y: site.y + (j % 2) * .012, siteId: site.id }, travel: null, health: { condition: 'well' },
    task: adult ? 'work' : 'rest', skills: skillsFor(id), chore: null, kin, relationships: {}, propertyRefs: [`${household.id}-wagon`], commitments: [],
    ...(sex && { sex }), ...(Number.isFinite(age) && { age }), ...(traits && { traits }),
  };
  household.members.push(id);
}
/**
 * The die, rolled, and the family it makes put in place of the default one.
 *
 * `FIC-GONZ-021`. Refused unless nothing has yet happened to this family (`rollRefusal`).
 * The founding four are removed outright rather than kept as strangers: nothing refers to
 * them yet, which is exactly what the refusal guarantees.
 */
export function rollFamily(world, household) {
  const why = rollRefusal(world, household);
  if (why) throw new Error(why);
  const index = Number(household.id.slice(3)) - 1;
  const roll = familyRoll(world.seed, household.id);
  const site = world.map.sites[household.homeSiteId];
  for (const id of household.members) delete world.entities[id];
  household.members = [];
  rolledPeople(world.seed, household.id, index, roll).forEach((person, j) => {
    addPerson(world, household, site, j, { ...person, adult: person.age >= 16 });
  });
  household.principalId = household.members[0];
  household.roll = roll;
  household.die = FAMILY_DIE;
  // A family rolled while it is still on the road in goes on the road beside its wagon.
  if (household.arriving) putOnTheRoad(world, household);
  // The number, and nothing about what it means: the owner's direction is that the rule is
  // never explained.
  record(world, 'family-rolled', { householdId: household.id, text: `Your family rolled ${rolledWords(roll)}.`, importance: 2, claimId: 'FIC-GONZ-021' });
  return roll;
}
export { WALK_SPEED, RIDER_SPEED, WAGON_SPEED } from './travel.mjs';
// Three shots at the founding (`FIC-GONZ-016`); now what the default wagon load packs.
export { STARTING_POWDER } from './wagon.mjs';
/**
 * How much of a family's remembered story rides on each tick.
 *
 * Twice what the journal shows, so nothing a student can read is ever missing, and a hard
 * ceiling on the one part of this channel that would otherwise grow all afternoon. Forty
 * was the first number tried and was still six kilobytes on a busy family's tick.
 *
 * ceiling: an append-only log resent whole is the textbook case for sending only what is
 * new. BrowserQuest's incremental visible-set sync is already recorded in
 * docs/REFERENCE_ARCHITECTURES.md §2 as held until visibility broadens, and this is the
 * second reason to want it. A ceiling is the cheap answer; a delta is the right one.
 */
export const PROJECTED_EVENTS = 24;
// How far one person carries a piece of news before somebody else takes it on.
//
// `LIVING_INFORMATION.md`: "A rider must start at the actual source or a modeled relay
// point... Relays preserve source ancestry and observation age." This is that number, and
// it is invented (`FIC-GONZ-013`). The reason it exists is not stamina: it is that a rider
// has their own life, and word travels as far as somebody happens to be going and then
// waits for the next person going further. At twelve miles the near families around
// Gonzales meet somebody who saw it, and the far ones meet somebody who was told.
export const LEG_MILES = 12;
// A person carries at most two tiring days of walking; beyond that more miles change
// nothing, so a very long journey cannot become a rest debt nobody can ever pay off.
export const EXERTION_CAP = 40;
export function routeLength(points) {
  return points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
}
export function pointAt(points, distance) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance <= length) { const f = length ? distance / length : 0; return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
    distance -= length;
  }
  return { ...points.at(-1) };
}
// The ford is the only way over the Guadalupe (`HIST-GONZ-007`), so a route that uses it
// is the one journey a wagon is turned back from.
const usesFord = (world, path) => path.routeIds.some(id => world.map.routes[id]?.kind === 'crossing');
/** The plain English word for a piece of property, used in every refusal about it. */
const NOUN = { ox: 'ox', horse: 'horse', wagon: 'wagon' };
/**
 * Whether this person can set out this way, and if not, why - in the words the student
 * will read on the control. This is a permission, so like `choresFor` it is computed on
 * the server and never inferred by the client.
 *
 * `path` is passed in when the caller already has one, because the destination decides
 * one of these answers and running Dijkstra twice for one button is waste.
 */
export function modeAvailability(world, entity, modeId, path = null) {
  const mode = MODES[modeId];
  if (!mode) return { can: false, why: 'No such way of going.' };
  if (tooYoung(entity)) return { can: false, why: tooYoungWhy(entity) };
  for (const role of mode.needs) {
    const beast = world.entities[propertyId(entity.householdId, role)];
    // A class saved before there were horses has no horse, which is a true thing about
    // that class rather than a broken one, and the control says so plainly.
    if (!beast) return { can: false, why: `Your family has no ${NOUN[role]}.` };
    if (beast.borrowedBy && beast.borrowedBy !== entity.id) {
      // A person took it on a journey, or it is out with another household. Both are
      // possible states of the field and both are said in the borrower's own name.
      const borrower = world.entities[beast.borrowedBy] || world.households[beast.borrowedBy];
      return { can: false, why: `${borrower?.name || 'Somebody'} has the ${NOUN[role]}.` };
    }
    if (beast.condition && beast.condition !== 'sound') return { can: false, why: `The ${NOUN[role]} is in no state to go.` };
    // The whole point of property being rivalrous: it is somewhere, and if it is not
    // where you are then you cannot take it. Walk to it, or go without it.
    if (beast.travel || beast.location.siteId !== entity.location.siteId) return { can: false, why: `The ${NOUN[role]} is not here.` };
  }
  // ceiling: today the only road a student can order that uses the ford is the march
  // upriver, and the wagon is refused there before anything moves - so in ordinary play
  // this line turns nobody back yet. It is kept because the moment the west bank is
  // reachable it is the whole difference between a river that is a barrier and a river
  // that is a line on a picture. `stillWalking` in sim/directors.mjs is kept for the same
  // reason. Remove it only if the ford stops being the only crossing.
  if (path && !mode.crossesFord && usesFord(world, path)) {
    return { can: false, why: 'That road crosses at the ford, and the ford is no place for a wagon.' };
  }
  return { can: true, why: '' };
}
/** Every way this person could set out right now, with the reason for any that are not open. */
export function travelModesFor(world, entity, destination = null) {
  if (entity.kind !== 'person' || !entity.householdId) return [];
  return Object.keys(MODES).map(id => {
    // Each way of going takes its own way there (sim/ways.mjs): the wagon keeps to the road where the others cut across.
    const path = destination && entity.location.siteId ? findWay(world, entity.location.siteId, destination, id) : null;
    const { can, why } = modeAvailability(world, entity, id, path);
    return can ? { id, can: true, carry: MODES[id].carry } : { id, can: false, why, carry: MODES[id].carry };
  });
}
/** The sentence to refuse a journey with, or null if it can be made. Used before any state moves. */
export function travelRefusal(world, entity, destination, modeId = DEFAULT_MODE) {
  if (!world.map.sites[destination]) return 'No known route to that destination.';
  if (!entity.location.siteId) return 'Already traveling.';
  if (entity.location.siteId === destination) return 'Already there.';
  if (!MODES[modeId]) return 'No such way of going.';
  const path = findWay(world, entity.location.siteId, destination, modeId);
  if (!path) return 'No known route to that destination.';
  return modeAvailability(world, entity, modeId, path).why || null;
}
/**
 * The ox, the horse and the wagon go where the person takes them.
 *
 * They get their own travel record on the same route at the same speed, so they are drawn
 * moving - the library has had `ox-walk`, `horse-walk` and `wagon-travel` since the art
 * landed and nothing had ever set travel on a piece of property, so a family's animals
 * had never once been seen to leave the yard. `borrowedBy` has existed just as long and
 * was always null. This is what both of them were for.
 *
 * `silent` keeps the family's event log about the family: three more arrival lines for
 * one trip to town would bury the one that matters.
 */
function harness(world, entity, mode, path, causeId) {
  for (const role of mode.needs) {
    const beast = world.entities[propertyId(entity.householdId, role)];
    beast.borrowedBy = entity.id;
    const pace = path.pace || paceOf(path.points, path.ground, mode.id);
    beast.travel = { from: entity.travel.from, to: entity.travel.to, points: path.points, progress: 0, distance: path.distance, speed: mode.speed, mode: mode.id, purpose: 'harness', causeId, silent: true, ...(pace.length && { pace }) };
    beast.location = { ...path.points[0], siteId: null };
  }
}
/** Further from a place's point than this, somebody is standing somewhere else in it. */
export const STANDING_APART_MILES = 0.25;
export function beginTravel(world, entity, destination, causeId, purpose = 'visit', modeId = DEFAULT_MODE) {
  if (entity.travel || !entity.location.siteId) throw new Error('Already traveling.');
  if (!world.map.sites[destination]) throw new Error('No known route to that destination.');
  if (entity.location.siteId === destination) throw new Error('Already there.');
  const from = entity.location.siteId;
  // A courier rides their own horse and owns no household property. This file has always
  // given them the mounted speed by looking at the report rather than at a mode, and that
  // stays exactly as it was: relays must never start depending on whether some family
  // happens to own an animal.
  // An express rider between settlements (sim/expresses.mjs) rides the same way, for the same reason.
  const riding = Boolean(entity.report || entity.express);
  const mode = riding ? MODES.horse : MODES[modeId];
  if (!mode) throw new Error('No such way of going.');
  // A rider carrying word keeps to the roads, where word is carried and met (sim/geography.mjs `findPath`). Anybody else
  // goes the quickest way they can for how they are going: by the road, across country, or across country to the road
  // (sim/ways.mjs). A path may run through several roads, so reaching the far bank still means using the ford.
  const path = riding ? findPath(world.map, from, destination) : findWay(world, from, destination, mode.id);
  if (!path) throw new Error('No known route to that destination.');
  if (!riding) {
    const { can, why } = modeAvailability(world, entity, mode.id, path);
    if (!can) throw new Error(why);
  }
  const how = riding || mode.id === 'foot' ? '' : mode.id === 'horse' ? ', riding' : ', with the ox and wagon';
  const departure = record(world, 'departure', { actorId: entity.id, householdId: entity.householdId, text: `${entity.name} left for ${world.map.sites[destination].name}${how}.`, causes: causeId ? [causeId] : [] });
  // A journey starts where the person is standing. Somebody who stood with the Texian force
  // is a third of a mile from the camp's point, and starting their road at the point drew
  // them jumping there as they set off. A family in its own yard stands a few hundred feet
  // from the cabin's point and always has; that is drawing, not distance, and it is left
  // alone so nobody's walk home grows by the width of a yard.
  const here = entity.location, start = path.points[0];
  const gap = Math.hypot(here.x - start.x, here.y - start.y);
  const points = gap > STANDING_APART_MILES ? [{ x: here.x, y: here.y }, ...path.points] : path.points;
  const distance = gap > STANDING_APART_MILES ? path.distance + gap : path.distance;
  // The going over the lanes and tracks of the real land (sim/ground.mjs); the step in from where somebody stood is open ground.
  const apart = gap > STANDING_APART_MILES;
  const pace = path.pace ? path.pace.map(([segment, factor]) => [segment + (apart ? 1 : 0), factor])
    : paceOf(points, path.ground && (apart ? [null, ...path.ground] : path.ground), mode.id);
  entity.travel = { from, to: destination, points, progress: 0, distance, speed: riding ? RIDER_SPEED : mode.speed, mode: mode.id, purpose, causeId: departure, ...(pace.length && { pace }) };
  entity.location = { ...points[0], siteId: null }; entity.task = 'travel';
  if (!riding) harness(world, entity, mode, path, departure);
}
export function progressTravel(world, entity, units = 1) {
  const travel = entity.travel; if (!travel) return;
  // A rider who has stopped to speak with somebody is still on a journey - `siteId` stays
  // null and the route is still theirs - but the ground stops going past. Nulling `travel`
  // instead would put an entity nowhere, which `validateWorld` rightly refuses.
  if (travel.halted) return;
  const wasAt = travel.progress;
  // Slower over hard ground where the journey has any (sim/ground.mjs); what is left past the end goes on with a relayed word.
  const moved = moveOnGround(travel.points, travel.pace, travel.distance, travel.progress, travel.speed * units);
  travel.progress = moved.progress;
  // Ground covered on somebody's own feet is what tires them out, and it is the only
  // thing that does. A courier is on a horse and is nobody's family; a chore's `walk`
  // step moves a person about their own yard and never comes through here. So this
  // counts exactly the journeys a student chose to send somebody on - to town, to the
  // timber, to the gathering, up the river - which is what makes how far a family lives
  // from Gonzales finally cost something. `advanceRoutine` turns miles into a condition.
  //
  // How they go decides how much of it they pay for. A mile in the saddle costs a third
  // of a mile on foot and a mile beside the wagon half of one, which is most of why the
  // horse is worth having to a family nineteen miles out - quite apart from the speed,
  // they arrive fit to do something. A tired principal is the one who risks hurt upriver.
  if (entity.kind === 'person' && entity.householdId && !entity.report) {
    const cost = (travel.progress - wasAt) * modeOf(travel).exertion;
    entity.exertion = Math.min(EXERTION_CAP, Math.round(((entity.exertion || 0) + cost) * 10000) / 10000);
  }
  entity.location = { ...pointAt(travel.points, travel.progress), siteId: null };
  if (!travel.loggedProgress && !travel.silent) {
    travel.loggedProgress = true;
    travel.progressEventId = record(world, 'travel', { actorId: entity.id, householdId: entity.householdId, text: `${entity.name} is on the road.`, causes: [travel.causeId] });
  }
  if (travel.progress === travel.distance) {
    // Ground this tick would have covered past the end of the road. It matters to nobody
    // except a report that is about to change hands, and it goes with the word.
    if (entity.report) entity.report.overflow = moved.left;
    // A journey that knows where in the place its traveller stands and what they do there -
    // today only the family's arrival on its land (sim/settling.mjs) - ends there. Every other
    // journey ends on the place's own point, at rest.
    const spot = Number.isFinite(travel.settle?.x) ? travel.settle : world.map.sites[travel.to];
    entity.location = { x: spot.x, y: spot.y, siteId: travel.to };
    entity.task = travel.purpose === 'help' ? 'help' : travel.settle?.task || 'rest'; entity.travel = null;
    // The journey is over, so the beast belongs to nobody again and may be taken by
    // whoever is standing where it now is. It does not walk home by itself: a family
    // that left the wagon at the timber has a wagon at the timber.
    if (entity.borrowedBy) entity.borrowedBy = null;
    if (entity.laden && world.households[entity.householdId]?.homeSiteId === travel.to) entity.laden = false;
    if (travel.silent) return;
    record(world, 'arrival', { actorId: entity.id, householdId: entity.householdId, text: `${entity.name} arrived at ${world.map.sites[travel.to].name}.`, destination: travel.to, purpose: travel.purpose, causes: [travel.progressEventId || travel.causeId] });
  }
}
export function stepWorld(world) {
  if (world.status !== 'running') return;
  world.tick++; world.minute += 20;
  for (const entity of Object.values(world.entities)) progressTravel(world, entity);
  // A family whose last wagon wheel came in off the road this tick has arrived.
  advanceArrivals(world);
  // What each family's people can see of the homesteads they are standing on (sim/houses.mjs).
  noteLandSeen(world);
  // A rider who has just finished their leg gives the word on in the same tick, so news
  // does not sit at a fork of the road for twenty minutes waiting for the simulation.
  advanceRelays(world);
  // Expresses between the settlements of the real map arrive, wait while the word is read, and send it on (sim/expresses.mjs).
  advanceExpresses(world, { beginTravel, relayReport });
  // Chores run after travel resolves, so a person who arrived this tick picks up the
  // next step of their work in the same tick rather than idling for one.
  advanceChores(world, { beginTravel, modeAvailability });
  advanceTown(world);
  // Offers resolve after everyone has moved, because an offer is a thing said face to
  // face and ends the moment the two people part.
  advanceOffers(world);
  // Meetings resolve on the same rule as offers and for the same reason: they are a
  // thing that happens between two people who are standing together, so they are settled
  // once everybody has finished moving for the tick.
  advanceEncounters(world);
  advanceRoutine(world, 20); deliverReports(world);
  advanceDirectors(world, { beginTravel, dispatchReport });
  // Families nobody plays decide last, from what the tick has left them able to see, through the actions a student sends.
  advanceNeighbours(world, { project: id => projectWorld(world, id, 'student', { includeMap: false }), apply: (id, input) => applyAction(world, id, input) });
}
/**
 * Where this rider stops and somebody else takes the word on.
 *
 * The last place on the route within one person's reach, and never the family's own gate -
 * a hand-off happens at a fork of the road or at the ford, somewhere two people going
 * different ways actually cross. A route with no such place on it is ridden the whole way,
 * which is why a family twenty-four miles out on a straight run can still meet somebody
 * who saw it: the road decides, not the mileage alone.
 */
function legEnd(path) {
  if (!path || path.distance <= LEG_MILES) return null;
  return path.nodes.slice(1, -1).filter(node => node.at <= LEG_MILES).at(-1) || null;
}
// Word loses its footing as it passes from hand to hand. A family that meets the person
// who saw it has a confirmed report; a family at the end of a chain has a rumor, and the
// journal says so. The ladder is `sim/knowledge.mjs`'s own, and `contradicted` does not
// slide - a correction stays a correction however far it travels.
const FAINTER = { confirmed: 'unconfirmed', unconfirmed: 'rumor' };
/**
 * Put one rider on the road with one leg of one report.
 *
 * Used for the first leg out of the source and for every hand-off after it, so a relayed
 * rider is the same kind of thing as an original one and carries the same shaped errand.
 * What distinguishes them is `provenance`: the people who carried this before, oldest
 * first, which is how source ancestry and observation age survive a hand-off.
 */
function sendRider(world, { topicId, audience, status, originSiteId, fromSiteId, provenance, causeId }) {
  const number = world.nextCourierId++;
  const id = `courier-${number}`;
  const from = world.map.sites[fromSiteId];
  // A topic with an authored conversation is carried by somebody with a name, because a
  // student is going to talk to them. Everything else is still "Rider 3".
  const inPerson = carriedInPerson(topicId);
  const homeSiteId = world.households[audience].homeSiteId;
  // Only news somebody actually says out loud changes hands. A topic still delivered the
  // old way is still delivered the old way, all in one ride: converting a report is done
  // by authoring a conversation for it and by nothing else, exactly as before.
  const leg = inPerson ? legEnd(findPath(world.map, fromSiteId, homeSiteId)) : null;
  // `courier` outlives the errand, and `report` does not. Handing over a message does not
  // put somebody off their horse: keyed on the report instead, a rider who had just
  // finished speaking was redrawn as a settler on foot, standing in the yard.
  // Never somebody who already carried this word. There are eight rider names and a class
  // puts dozens of riders on the road, so a hand-off could otherwise read "Ned Falk, who had
  // it from Ned Falk" - which was measured, the first time a second report was converted.
  // ceiling: two different riders on two different errands may still share a name. A longer
  // list is the fix if a class ever takes one rider for another.
  let named = number;
  while (inPerson && (provenance || []).some(hop => hop.name === riderName(named))) named++;
  const entity = { id, name: inPerson ? riderName(named) : `Rider ${number}`, kind: 'person', householdId: null, depth: 'moderate', principal: false, courier: true, location: { x: from.x, y: from.y, siteId: fromSiteId }, task: 'rest', health: { condition: 'well' }, travel: null, report: { topicId, audience, destination: leg ? leg.id : homeSiteId, homeSiteId, status, originSiteId, departedMinute: world.minute, ...(inPerson && { inPerson: true, provenance }) } };
  world.entities[id] = entity;
  beginTravel(world, entity, entity.report.destination, causeId, 'report');
  return entity;
}
/**
 * A rider of a settlement carrying word that came to it by express out to one of its families (sim/expresses.mjs): the same
 * rider, in person, with the express riders in its ancestry, so the family is told where it came from and how.
 */
export function relayReport(world, { topicId, householdId, fromSiteId, originSiteId, status, provenance, causeId }) {
  return sendRider(world, { topicId, audience: householdId, status, originSiteId, fromSiteId, provenance, causeId });
}
export function dispatchReport(world, topicId, householdId, status = 'confirmed') {
  const truth = world.truth[topicId];
  if (!truth || !world.households[householdId]) throw new Error('Invalid report dispatch');
  // A rider starts where the thing happened, not at a convenient place on the map. The
  // report's own site is the source; only a topic with no place falls back to the town.
  const originSiteId = world.map.sites[truth.siteId] ? truth.siteId : 'gonzales';
  return sendRider(world, { topicId, audience: householdId, status, originSiteId, fromSiteId: originSiteId, provenance: [], causeId: truth.eventId }).id;
}
/**
 * News changing hands.
 *
 * A rider who has ridden their leg gives the word to somebody going further and stops
 * being the one carrying it. The new rider's account is second-hand and one step fainter,
 * and it keeps the whole ancestry: where it started, when it was seen, and everybody who
 * has carried it since. That is what makes a distant family's news genuinely older and
 * genuinely worse rather than merely later.
 *
 * The hand-off costs no time at all - the leftover of the arriving rider's tick is handed
 * across with the word, so a relayed report reaches a family on the same minute a single
 * rider would have reached it. That is deliberate: it keeps road distance the one thing
 * that decides *when* a family hears, while hands decide *what* they hear.
 * ceiling: nobody waits at a fork for the next person going east. Modelling that wait
 * would make two families the same distance out hear at different times for reasons a
 * student cannot see on the map, and the single-variable claim is worth more than the
 * realism until a class has actually played against it.
 */
export function advanceRelays(world) {
  for (const carrier of Object.values(world.entities)) {
    const report = carrier.report;
    if (!report?.inPerson || carrier.travel) continue;
    if (carrier.location.siteId !== report.destination || report.destination === report.homeSiteId) continue;
    // Mid-conversation with somebody met at the fork: the word waits until they are done.
    if (Object.values(world.encounters || {}).some(e => e.carrierId === carrier.id && e.status === 'open')) continue;
    if (!world.households[report.audience]) { delete carrier.report; continue; }
    const handed = record(world, 'relay', {
      // No household and no public visibility: the family this is travelling to has not
      // heard it yet, and telling them their news changed hands would be telling them
      // there is news. It is in the causal record, where the reckoning can find it.
      actorId: carrier.id, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-013',
      topicId: report.topicId, siteId: report.destination,
      text: `${carrier.name} gave the word to another rider at ${spotName(world, report.destination)} and went no further with it.`,
    });
    const next = sendRider(world, {
      topicId: report.topicId, audience: report.audience, status: FAINTER[report.status] || report.status,
      originSiteId: report.originSiteId, fromSiteId: report.destination,
      provenance: [...report.provenance, { id: carrier.id, name: carrier.name, atSiteId: report.destination, minute: world.minute }],
      causeId: handed,
    });
    // The part of the tick the arriving rider could not use goes on with the word. Without
    // it every hand-off would round a rider's arrival up to the next whole tick, and a
    // family whose road happens to fork twice would hear later than one the same distance
    // away whose road does not.
    if (report.overflow > 0) progressTravel(world, next, report.overflow / next.travel.speed);
    delete carrier.report;
  }
}
/**
 * What a family may do before the teacher has begun.
 *
 * The lobby used to refuse everything, and the reason was a real one: if work actually got
 * done while the class filled up, a student who joined at two minutes past would have
 * banked ten minutes of farming over one who arrived at twelve past, and this world is
 * meant to differ by where a family lives and what it chose, never by who clicked first.
 *
 * But that argues for freezing the clock, not the family. `stepWorld` does not run in the
 * lobby, so nothing assigned here advances by a single minute; it simply starts the
 * instant the teacher does, for everybody at once. What stays shut is anything that
 * reaches another household - an offer made to a family that has not joined yet is an
 * offer made to an empty chair - and the historical choices, which do not exist until the
 * news that prompts them has arrived.
 */
export const LOBBY_ACTIONS = new Set(['survey-plot', 'hunt-land', 'fell-trees', 'clear-plot', 'fence-plot','roll-family', 'load-wagon', 'bring-stock', 'plan-house', 'chore', 'stop-chore', 'answer-chore', 'rename', 'work', 'rest', 'travel']);
export function applyAction(world, householdId, input) {
  const entity = world.entities[input.entityId];
  const household = world.households[householdId];
  if (input.action === 'rename' && !input.entityId) { rename(world, household, input); return; }
  if (input.action === 'roll-family') { rollFamily(world, household); return; }
  // Packing the wagon is the household's, like the roll, and names nobody in it.
  if (input.action === 'load-wagon') { setLoad(world, household, input.item, input.amount); return; }
  // So is whether stock is driven in behind it, which decides how much land the family holds (sim/grants.mjs).
  if (input.action === 'bring-stock') { setStock(world, household, input.stock); return; }
  // So is choosing the house, which can be changed until the first spell of work goes into it.
  if (input.action === 'plan-house') { planHouse(world, household, input.layout); return; }
  // And where it stands, on the real land, once the wagon is in (sim/homesite.mjs). It refuses in the lobby itself.
  if (input.action === 'choose-site') { chooseSite(world, household, { x: input.x, y: input.y }); return; }
  // How they go, chosen once and applied to whatever journey this order starts - a trip
  // to town, or the road out to the timber a chore begins with. A command from a class
  // that predates the choice carries no mode and gets the one everybody had then.
  const mode = input.mode || DEFAULT_MODE;
  if (!MODES[mode]) throw new Error('No such way of going.');
  if (world.status === 'lobby' && !LOBBY_ACTIONS.has(input.action)) throw new Error('Your neighbours are still arriving. You can see to your own family now; anything between families waits for the class to begin.');
  if (!entity || entity.householdId !== householdId || entity.kind !== 'person') throw new Error('Choose one of your family.');
  if (entity.health.condition === 'dead' || entity.health.condition === 'captured') throw new Error('This person cannot act.');
  // A child under ten is not sent anywhere (`docs/FAMILY_CREATION.md` §3): not to work, not
  // on a road, not to answer for the family. They can still be named, rest, and be spoken to.
  if (tooYoung(entity) && !['rename', 'rest', 'ask-rider', 'leave-rider'].includes(input.action)) throw new Error(tooYoungWhy(entity));
  // Farm work is open to the whole family; the historical choice is the principal's.
  // Keeping that split explicit is the point: everyone can be sent to the field, but
  // the decision the lesson turns on still belongs to one named person.
  // Naming is the household's own, belongs to no one member of it, and is checked before
  // the "choose one of your family" rule below because renaming the *family* names nobody.
  if (input.action === 'rename') { rename(world, household, input); return; }
  if (input.action === 'chore') { beginChore(world, household, entity, input.chore, { beginTravel, modeAvailability }, mode); return; }
  // Survey, with the place the student chose on the family's own land (sim/survey.mjs). The server decides whether it can be.
  if (input.action === 'survey-plot') {
    const plot = { x: Number(input.x), y: Number(input.y) };
    const why = plotRefusal(world, household, plot);
    if (why) throw new Error(why);
    beginChore(world, household, entity, 'survey-plot', { beginTravel, modeAvailability }, DEFAULT_MODE, { plot });
    return;
  }
  // Felling at a place on the family's own land, chosen on the map (sim/felling.mjs).
  if (input.action === 'fell-trees') {
    beginChore(world, household, entity, 'fell-trees', { beginTravel, modeAvailability }, DEFAULT_MODE, { ground: { x: Number(input.x), y: Number(input.y) } });
    return;
  }
  // Hunting a place on the family's own land, chosen on the map (sim/hunting.mjs). The server decides whether it can be.
  if (input.action === 'hunt-land') {
    beginChore(world, household, entity, 'hunt-land', { beginTravel, modeAvailability }, DEFAULT_MODE, { ground: { x: Number(input.x), y: Number(input.y) } });
    return;
  }
  // Clearing or fencing one of the family's plots, chosen on the map by a point inside it (sim/fields.mjs).
  if (input.action === 'clear-plot' || input.action === 'fence-plot') {
    const plot = plotAt(world, household, { x: Number(input.x), y: Number(input.y) });
    beginChore(world, household, entity, input.action, { beginTravel, modeAvailability }, DEFAULT_MODE, { plotId: plot?.id });
    return;
  }
  // Trading is a household's own business and any member standing there can do it. It is
  // deliberately not the principal's alone: the whole point is that a family without the
  // handy member can ask the neighbour who is actually present.
  if (input.action === 'offer') { makeOffer(world, householdId, entity, input); return; }
  if (['accept-offer', 'decline-offer', 'withdraw-offer'].includes(input.action)) {
    respondToOffer(world, householdId, entity, input.action, input.offerId, input.reason);
    return;
  }
  // Talking to a rider belongs to whoever the rider actually met, which is very often not
  // the principal. That is the whole point of a messenger meeting a family rather than
  // delivering to a household: the person who was at the door is the person who heard it.
  if (input.action === 'ask-rider') { askRider(world, householdId, entity, input.lineId); return; }
  if (input.action === 'leave-rider') { leaveRider(world, householdId, entity); return; }
  // Work can stop and ask something. The answer belongs to whoever is doing the work,
  // not to the principal: it is a question about what this person in this wood should do
  // next, and the family member standing there is the one it was put to.
  if (input.action === 'answer-chore') { answerChore(world, household, entity, input.option); return; }
  if (input.action === 'stop-chore') {
    if (!entity.chore) throw new Error('Nothing to call off.');
    // Called home from a neighbour's raising: what they put in is still owed to both stories.
    if (entity.chore.hostHouseholdId && entity.chore.spells > 0) recordHelpDone(world, household, entity, world.households[entity.chore.hostHouseholdId], entity.chore.spells);
    // Called in from the felling: the trees already down are still said, and where their logs lie (sim/felling.mjs).
    if (entity.chore.id === 'fell-trees') recordFelling(world, household, entity);
    entity.chore = null; entity.task = 'rest';
    record(world, 'assignment', { actorId: entity.id, householdId, text: `${entity.name} left off the work.` });
    return;
  }
  // The historical calls are answered by whichever parent or grown child the family sends
  // (docs/FAMILY_CREATION.md step 4). Each handler checks who may answer; travelling, the
  // yard and resting stay the principal's.
  const answering = ['go-upriver', 'stay-in-town', 'go-see', 'stay-home', 'help', 'stay', 'turn-out', 'stay-put'].includes(input.action);
  if (!answering && !entity.principal) throw new Error('Only your principal can be asked that.');
  if (['go-upriver', 'stay-in-town'].includes(input.action)) {
    // Going upriver abandons whatever work was in hand, for the same reason answering
    // the first call does: a chore left merely frozen resumes wherever the journey ends.
    if (entity.chore) abandonChore(world, world.households[householdId], entity);
    handleMarch(world, householdId, entity, input.action, { beginTravel, travelRefusal }, mode);
  }
  else if (['go-see', 'stay-home'].includes(input.action)) {
    // A rumor's question, answered the same way the neighbour's call is: going costs the
    // afternoon's work for the same reason.
    if (entity.chore) abandonChore(world, world.households[householdId], entity);
    handleRumor(world, householdId, entity, input.action, { beginTravel, travelRefusal }, mode);
  }
  else if (['turn-out', 'stay-put'].includes(input.action)) {
    // A far settlement's call (sim/calls.mjs): turning out costs the afternoon's work, as every call does.
    if (input.action === 'turn-out' && entity.chore) abandonChore(world, world.households[householdId], entity);
    handleCall(world, householdId, entity, input.action, { beginTravel, travelRefusal }, mode);
  }
  else if (['help', 'stay'].includes(input.action)) {
    // Answering the call costs the afternoon's work. Leaving the chore merely frozen
    // meant it resumed wherever the journey ended - hoeing rows at Gonzales, and then
    // walking "back to the yard" straight across the map without travelling.
    if (entity.chore) abandonChore(world, world.households[householdId], entity);
    handleChoice(world, householdId, entity, input.action, { beginTravel, travelRefusal }, mode);
  }
  else if (input.action === 'travel') beginTravel(world, entity, input.destination, null, 'visit', mode);
  else if (['work', 'rest'].includes(input.action)) {
    if (entity.travel) throw new Error('Still on the road.');
    if (entity.chore) throw new Error('Call off the work first.');
    entity.task = input.action;
    record(world, 'assignment', { actorId: entity.id, householdId, text: `${entity.name} will ${input.action}.` });
  } else throw new Error('Action unavailable');
}
// The map is public geography and never changes during a class, so it is fetched once
// rather than repeated in every snapshot. Shaded relief alone was three quarters of a
// student's payload; at thirty clients that is megabytes a second of unchanging ground.
export const projectMap = world => structuredClone(world.map);
/**
 * Who a family is: the answer to the question the first person to play this asked.
 *
 * Fetched rather than sent every tick. It is about four hundred and fifty bytes and it
 * changes only when somebody in the household renames somebody, which is the same shape as
 * the map and the chore catalogue - and the same lesson this project has now learned three
 * times: a thing that does not change does not belong on a channel that fires every tick.
 */
export const projectFamily = (world, householdId) => {
  const household = world.households[householdId];
  return household ? structuredClone(familyProjection(world, household)) : null;
};
export function projectWorld(world, householdId, role, { includeMap = true } = {}) {
  const household = world.households[householdId];
  // The last few a family can see, not every one it has ever seen.
  //
  // This used to be the whole history, resent on every tick for the length of a class, and
  // it is the only genuinely unbounded thing on this channel - a busy family's log grows
  // all afternoon and none of it changes. The journal shows twelve and the screen-reader
  // log the same, so this is the visible record with room to spare. The household's own
  // event list in `world` is untouched, which is what the epilogue is built from
  // (VISION.md §20) and what a save carries.
  const visibleEvents = world.events
    // A sealed event - glory, today - belongs to the family's story and is revealed only at
    // the end of the game. It is dropped before the slice, so it cannot even displace a line.
    .filter(e => e.visibility !== 'sealed')
    .filter(e => (householdId && e.householdId === householdId) || (role === 'host' && e.visibility === 'public'))
    .slice(-PROJECTED_EVENTS);
  const knownIds = new Set(visibleEvents.map(e => e.id));
  const events = visibleEvents.map(e => ({ id: e.id, type: e.type, minute: e.minute, text: e.text, actorId: e.actorId, householdId: e.householdId, causes: e.causes.filter(id => knownIds.has(id)) }));
  const entities = Object.values(world.entities).filter(e => e.householdId === householdId && householdId).map(e => ({ id: e.id, name: e.name, kind: e.kind, householdId: e.householdId, depth: e.depth, principal: e.principal, ...(e.sex && { sex: e.sex }), ...(Number.isFinite(e.age) && { age: e.age, band: ageBand(e.age) }), location: e.location, travel: e.travel ? { from: e.travel.from, to: e.travel.to, points: e.travel.points, progress: e.travel.progress, distance: e.travel.distance, speed: e.travel.speed, mode: e.travel.mode } : null, health: e.health, task: e.task, skills: e.skills, chore: e.chore?.ask ? { ...e.chore, ask: askProjection(world, household, e) } : e.chore, condition: e.condition, species: e.species, laden: e.laden, borrowedBy: e.borrowedBy }));
  // What each person could be asked to do, with the reason for anything refused, is
  // computed on the server. The client must never decide for itself what is possible:
  // that is the same rule as fog of war, applied to a control instead of a fact.
  // Anyone else standing where one of this household's people is standing. Filtered on
  // the server, at the level of detail that being in the same place would give you.
  const others = observedBy(world, householdId);
  const work = household ? Object.fromEntries(household.members.map(id => [id, choresFor(world, household, world.entities[id])])) : {};
  // Which ways each person could set out, on the same rule as the work: a permission, so
  // it is decided here and never guessed at by the client.
  // What the family has made of this land, and what state it is in. The renderer draws
  // the field at the size this says and the fence only when there is one to draw.
  const land = household ? { ...improvementProjection(household), ...shelterProjection(household), ...houseProjection(world, household), ...grantProjection(world, household), ...siteProjection(world, household), ...plotProjection(world, household), ...logsProjection(world, household) } : null;
  // What is in the wagon, and whether it can still be repacked. The catalogue comes once, from /api/chores.
  const wagon = household ? wagonProjection(world, household) : null;

  const travelModes = household ? Object.fromEntries(household.members.map(id => [id, travelModesFor(world, world.entities[id])])) : {};
  const toolCondition = household ? Object.fromEntries(Object.entries(household.tools || {}).map(([tool, wear]) => [tool, { wear, state: toolState(wear) }])) : {};
  const offers = offersFor(world, householdId);
  const encounter = encounterProjection(world, householdId, role);
  return structuredClone({ tick: world.tick, minute: world.minute, status: world.status, role, householdId, ...(includeMap && { map: world.map }), household, entities, others, offers, encounter, events, work, travelModes, land, wagon, toolCondition, reports: reportsFor(world, role === 'host' ? 'public' : householdId), ...directorProjection(world, householdId, role),
    // Whether this class began with the families arriving, which is what a family knows of a
    // neighbour's land it has not been to see: at dawn on the 28th nobody had a house. Land it has
    // seen since is in `household.seenLand`, as it stood then (sim/houses.mjs, `noteLandSeen`).
    ...(world.director?.arrival && { arrivalClass: true }) });
}
export function validateWorld(world) {
  if (world.schemaVersion !== 3 || !Number.isInteger(world.tick) || world.tick < 0 || !Number.isFinite(world.minute) || world.minute < 0 || !['lobby', 'running', 'paused', 'ended'].includes(world.status)) throw new Error('Invalid world');
  const ids = new Set();
  for (const [id, entity] of Object.entries(world.entities)) {
    if (id !== entity.id || ids.has(id)) throw new Error('Duplicate or mismatched entity ID');
    ids.add(id);
    if (!Number.isFinite(entity.location.x) || !Number.isFinite(entity.location.y)) throw new Error('Invalid location');
    if (entity.travel && entity.location.siteId !== null) throw new Error('Traveling entity cannot also occupy a site');
    if (!entity.travel && !world.map.sites[entity.location.siteId]) throw new Error('Entity needs a canonical site');
    if (entity.householdId && !world.households[entity.householdId]) throw new Error('Missing household');
    // Absent on a class saved before walking tired anybody, which is the correct empty
    // value and why no save version moved. Present, it must be a real distance.
    if (entity.exertion !== undefined && (!Number.isFinite(entity.exertion) || entity.exertion < 0)) throw new Error('Invalid exertion');
    // Absent on a class saved before there was any choice about how to go, which is the
    // correct empty value: everybody walked. Present, it must name a way that exists.
    if (entity.travel?.mode !== undefined && !MODES[entity.travel.mode]) throw new Error('Invalid travel mode');
    // Absent on a class saved before the game knew who anybody was to anybody, which reads
    // correctly as a household it cannot describe rather than a broken one.
    if (entity.kin !== undefined) {
      if (!ROLES.includes(entity.kin.role)) throw new Error('Invalid kin role');
      for (const relative of [entity.kin.spouse, ...(entity.kin.parents || []), ...(entity.kin.children || [])]) {
        if (relative && !world.entities[relative]) throw new Error('Kin names somebody who does not exist');
      }
    }
    if (typeof entity.name !== 'string' || !entity.name.trim() || entity.name.length > NAME_LIMIT) throw new Error('Invalid person name');
    // Present only on a rolled family. Absent reads as the founding household, which had no
    // stated ages and no hidden stats, and is why no save version moved.
    if (entity.purse !== undefined && (!Number.isInteger(entity.purse) || entity.purse < 0)) throw new Error('A purse holds whole reales');
    if (entity.sex !== undefined && !['male', 'female'].includes(entity.sex)) throw new Error('Invalid sex');
    if (entity.age !== undefined && (!Number.isInteger(entity.age) || entity.age < 0 || entity.age > 80)) throw new Error('Invalid age');
    for (const [trait, value] of Object.entries(entity.traits || {})) {
      const range = TRAIT_RANGE[trait];
      if (!range || !Number.isInteger(value) || value < range[0] || value > range[1]) throw new Error(`Invalid hidden ${trait}`);
    }
    // Skills were dealt at founding and one of them can now be practised up, so the range
    // has to be held here rather than trusted to the dealer.
    for (const [skill, level] of Object.entries(entity.skills || {})) {
      if (!Number.isInteger(level) || level < 1 || level > SKILL_CAP) throw new Error(`Invalid ${skill} skill`);
    }
    // Property is lent to somebody who exists - a person who took it on a journey, or a
    // whole household it is out with. A dangling borrower is how an ox ends up
    // permanently unusable, because nothing will ever hand it back.
    if (entity.borrowedBy && !world.entities[entity.borrowedBy] && !world.households[entity.borrowedBy]) throw new Error('Property is lent to nobody');
    // Somebody helping raise a neighbour's walls is helping a family that exists (sim/houses.mjs).
    if (entity.chore?.hostHouseholdId !== undefined && (!world.households[entity.chore.hostHouseholdId] || entity.chore.hostHouseholdId === entity.householdId)) throw new Error('Helping a family that is not there');
    // A hunt on the family's own land knows where it is and how good the ground is (sim/hunting.mjs). Absent on every other chore.
    const hunted = entity.chore?.id === 'hunt-land' ? entity.chore.ground : undefined;
    if (entity.chore?.id === 'fell-trees' && (!Number.isFinite(entity.chore.ground?.x) || !Number.isFinite(entity.chore.ground?.y))) throw new Error('Invalid felling place');
    if (hunted !== undefined && (!Number.isFinite(hunted?.x) || !Number.isFinite(hunted.y) || !(hunted.game >= 0 && hunted.game <= 1) || typeof hunted.cover !== 'string' || !Number.isFinite(hunted.toward?.x) || !Number.isFinite(hunted.toward?.y))) throw new Error('Invalid hunting place');
    if (entity.travel && (!Array.isArray(entity.travel.points) || entity.travel.points.length < 2 || !Number.isFinite(entity.travel.progress) || !Number.isFinite(entity.travel.speed) || entity.travel.speed <= 0 || entity.travel.progress < 0 || entity.travel.progress > entity.travel.distance)) throw new Error('Invalid travel');
    // Absent on every journey over open road and every class saved before the going (sim/ground.mjs), which travels as it did.
    if (entity.travel?.pace !== undefined && (!Array.isArray(entity.travel.pace) || entity.travel.pace.some(run => !Array.isArray(run) || !Number.isInteger(run[0]) || run[0] < 0 || run[0] >= entity.travel.points.length - 1 || !Number.isFinite(run[1]) || run[1] <= 0))) throw new Error('Invalid going');
  }
  for (const household of Object.values(world.households)) {
    if (!world.entities[household.principalId] || [...household.members, ...household.property].some(id => !world.entities[id])) throw new Error('Dangling household reference');
    // A twenty-sided roll (`die` 20, since 2026-09-14) makes the family its face says; a class rolled before on six sides has
    // no `die`, and there the number was the size. Absent roll: a household nobody rolled.
    if (household.die !== undefined && household.die !== FAMILY_DIE) throw new Error('Invalid family die');
    if (household.roll !== undefined) {
      const die = household.die ?? 6;
      let size = null;
      try { const { parents, children } = compositionFor(household.roll, die); size = parents + children; } catch { size = null; }
      if (size === null || household.members.length !== size) throw new Error('A rolled family must be the size it rolled');
    }
    // Coin is counted in whole reales. A class saved before there was coin has none, which is
    // the correct empty value, so no save version moved.
    if (household.resources.money !== undefined && !Number.isInteger(household.resources.money)) throw new Error('Coin is counted in whole reales');
    for (const [resource, amount] of Object.entries(household.resources)) {
      if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid resource ${resource}`);
    }
    if (!household.tools) throw new Error('Invalid tool condition');
    // A class saved before the wagon was packed by choice always had a hoe, and still must: it
    // is not on that household's load to say otherwise. A household with a load may have left it
    // behind, and sim/chores.mjs is where that is felt.
    if (household.load === undefined && (!Number.isInteger(household.tools.hoe) || household.tools.hoe < 0)) throw new Error('Invalid tool condition');
    for (const wear of Object.values(household.tools)) if (!Number.isInteger(wear) || wear < 0) throw new Error('Invalid tool condition');
    // Absent on a class saved before the wagon was packed by choice (sim/wagon.mjs), which is the
    // correct empty value: it has what it was founded with. So no save version moved.
    const badLoad = loadInvalid(household) || houseInvalid(world, household) || grantInvalid(world, household) || siteInvalid(world, household) || plotsInvalid(world, household);
    if (badLoad) throw new Error(badLoad);
    // Absent on a class nobody has named, which is the correct empty value and why no save
    // version moved. Present, it is a name somebody typed and has to stay one.
    // Present only while a new class's family is still on the road in (sim/settling.mjs).
    if (household.arriving !== undefined && household.arriving !== true) throw new Error('Invalid arrival marker');
    if (household.played !== undefined && household.played !== true) throw new Error('Invalid played marker');
    if (household.settlementId !== undefined && world.map.sites[household.settlementId]?.kind !== 'town') throw new Error('A family belongs to a settlement that is not there');
    if (household.name !== undefined && (typeof household.name !== 'string' || !household.name.trim() || household.name.length > NAME_LIMIT)) throw new Error('Invalid household name');
    if (!household.field || !['bare', 'planted', 'ripe'].includes(household.field.state) || !['corn', 'cotton'].includes(household.field.crop)) throw new Error('Invalid field state');
    // Absent on a class saved before a family could break new ground, and the empty value
    // is the one every family used to have: the first patch, and no fence. So no save
    // version moved. Present, both have to mean something. A class whose field has become plots
    // (sim/fields.mjs) no longer reads it, and it is left as it was.
    if (household.field.cleared !== undefined && (!Number.isInteger(household.field.cleared) || household.field.cleared < 1 || household.field.cleared > OLD_PATCHES)) throw new Error('Invalid cleared ground');
    for (const [kind, state] of Object.entries(household.improvements || {})) {
      if (!['cabin', 'fence'].includes(kind) || !IMPROVEMENT_STATES.includes(state)) throw new Error(`Invalid improvement ${kind}`);
    }
  }
  // Offers are optional state, so a class saved before trading existed validates as one
  // with no offers rather than as a broken world.
  for (const [id, offer] of Object.entries(world.offers || {})) {
    if (id !== offer.id) throw new Error('Mismatched offer ID');
    if (!world.households[offer.fromHouseholdId] || !world.households[offer.toHouseholdId] || offer.fromHouseholdId === offer.toHouseholdId) throw new Error('Invalid offer households');
    if (!world.entities[offer.fromEntityId] || !world.entities[offer.toEntityId]) throw new Error('Dangling offer reference');
    for (const side of [offer.give, offer.ask]) {
      const goods = Object.entries(side || {});
      if (!goods.length) throw new Error('An offer must name what it trades');
      for (const [good, amount] of goods) if (!GOODS.includes(good) || !Number.isInteger(amount) || amount < 1) throw new Error('Invalid offer amount');
    }
  }
  // Encounters are optional state, so a class saved before news was carried by people
  // validates as one where nobody has met anybody.
  for (const [id, encounter] of Object.entries(world.encounters || {})) {
    if (id !== encounter.id) throw new Error('Mismatched encounter ID');
    if (!world.households[encounter.householdId]) throw new Error('Unknown encounter household');
    if (!world.entities[encounter.carrierId] || !world.entities[encounter.listenerId]) throw new Error('Dangling encounter reference');
    if (world.entities[encounter.listenerId].householdId !== encounter.householdId) throw new Error('An encounter must be heard by the household that owns it');
    if (!['open', 'closed'].includes(encounter.status)) throw new Error('Invalid encounter status');
    if (!world.truth[encounter.topicId]) throw new Error('An encounter must be about something that happened');
    if (!Array.isArray(encounter.said) || !Array.isArray(encounter.asked)) throw new Error('Invalid encounter transcript');
    // Absent on a class saved before word changed hands, which correctly reads as an
    // account nobody relayed. Present, every hand must name a person and a real place on
    // the map: a chain that cannot be walked back is not provenance, it is decoration.
    if (encounter.provenance !== undefined) {
      if (!Array.isArray(encounter.provenance)) throw new Error('Invalid encounter provenance');
      for (const hop of encounter.provenance) {
        if (!hop.name || !world.map.sites[hop.atSiteId] || !Number.isFinite(hop.minute)) throw new Error('A hand-off must name somebody, somewhere, at a time');
      }
    }
  }
  const badExpress = expressesInvalid(world);
  if (badExpress) throw new Error(badExpress);
  const badCall = callsInvalid(world);
  if (badCall) throw new Error(badCall);
  const badFelling = fellingInvalid(world);
  if (badFelling) throw new Error(badFelling);
  const events = new Set(world.events.map(e => e.id));
  if (events.size !== world.events.length || world.events.some(e => e.causes.some(id => !events.has(id)))) throw new Error('Invalid event graph');
  if (world.nextEventId !== world.events.length + 1) throw new Error('Event sequence would duplicate an ID');
  // Glory (sim/glory.mjs) is optional state: a class saved before it existed has none. When it
  // is there, a family's total is exactly the sum of its awards, in whole points.
  for (const [householdId, ledger] of Object.entries(world.glory || {})) {
    if (!world.households[householdId]) throw new Error('Glory for a household that does not exist');
    const sum = Object.values(ledger.awards || {}).reduce((total, award) => total + award.points, 0);
    if (!Number.isInteger(ledger.total) || ledger.total !== sum) throw new Error('Glory does not add up');
  }
  for (const [audience, reports] of Object.entries({ ...world.knowledge.households, public: world.knowledge.public })) {
    if (audience !== 'public' && !world.households[audience]) throw new Error('Unknown knowledge audience');
    for (const [topicId, report] of Object.entries(reports)) {
      if (!world.truth[topicId] || !events.has(report.eventId) || report.receivedMinute > world.minute || report.observedMinute > report.receivedMinute) throw new Error('Invalid knowledge state');
    }
  }
}

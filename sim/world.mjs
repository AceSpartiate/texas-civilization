// Pure deterministic simulation; credentials and renderer state never belong here.
import { buildColoniesRegion } from './colonies-region.mjs';
import { armiesSeen } from './armies.mjs';
import { mapForPage } from './province.mjs';
import { advanceNeighbours } from './neighbours.mjs';
import { record } from './events.mjs';
import { reportsFor, deliverReports } from './knowledge.mjs';
import { advanceRoutine } from './routines.mjs';
import { calendarMinutes } from './clock.mjs';
import { advanceDirectors, handleChoice, handleMarch, handleRumor, directorProjection } from './directors.mjs';
import { abandonChore, advanceChores, answerChore, askProjection, beginChore, CHORES, choresFor, skillsFor, SKILL_CAP, toolState } from './chores.mjs';
import { GAME } from './hunting.mjs';
import { bringAlong, hasWords, holderOf, keepWithRiders, leaveBehind, modeWith, NOUN } from './keeping.mjs';
import { SERVING_ACTIONS, recallFromService, servingWhy, winterInvalid } from './winter.mjs';
import { answerCourier } from './alamo.mjs';
import { advanceFlight, flee, flightProjection, scrapeInvalid, share, stayHome } from './scrape.mjs';
import { answerRoad, registerRoadChores } from './road.mjs';
import { WATER_HIGH, WATER_SHUT, waterAt, weatherAt, weatherOn } from './weather.mjs';
// The road's chores join the one table here, once every module above is made (sim/road.mjs says why not at its own load).
registerRoadChores();
import { advanceLesson, advanceLessons, lessonInvalid, lessonProjection, lessonRefusal } from './lesson.mjs';
import { REPEATED, advanceAuto, noteOrder, setAuto } from './auto.mjs';
import { advanceCamp, answerCampQuestion, campInvalid } from './camp.mjs';
import { hostLiveProjection } from './host.mjs';
import { advanceTown, createTownspeople, observedBy } from './town.mjs';
import { GOODS, advanceOffers, makeOffer, offersFor, respondToOffer } from './trade.mjs';
import { buildGonzalesRegion, findPath, polylineLength } from './geography.mjs';
import { advanceEncounters, askRider, carriedInPerson, encounterProjection, leaveRider, riderName, spotName } from './encounters.mjs';
import { DEFAULT_MODE, HIGH_WATER_TIMES, MODES, WADE_WRONG_MINUTES, WADE_WRONG_SHARE, fordMinutes, modeOf, moveOnGround, propertyId, RIDER_SPEED, ridesAllHours, roadHours, roadTicks } from './travel.mjs';
import { paceOf } from './ground.mjs';
import { findWay } from './ways.mjs';
import { STATES as IMPROVEMENT_STATES, improvementProjection } from './improvements.mjs';
import { OLD_PATCHES, plotAt } from './fields.mjs';
import { advanceArrivals, putOnTheRoad, shelterProjection } from './settling.mjs';
import { defaultLoad, householdFromLoad, loadInvalid, setLoad, wagonProjection } from './wagon.mjs';
import { editPlot, houseInvalid, houseProjection, noteLandSeen, planHouse, recordHelpDone } from './houses.mjs';
import { grantInvalid, grantProjection, layOutGrants, setStock } from './grants.mjs';
import { chooseSite, siteInvalid, siteProjection } from './homesite.mjs';
import { plotProjection, plotRefusal, plotsInvalid } from './survey.mjs';
import { advanceExpresses, expressesInvalid } from './expresses.mjs';
import { callsInvalid, handleCall } from './calls.mjs';
import { answerQuestion, answerDetachment, armyInvalid, armyProjection, callHome, callHomeRefusal } from './army.mjs';
import { endingProjection } from './ending.mjs';
import { hostOverview } from './overview.mjs';
import { appearanceInvalid, setAppearance } from './appearance.mjs';
import { furnitureInvalid } from './furniture.mjs';
import { interiorInvalid, interiorProjection, placeItem } from './interior.mjs';
import { gearExertionShare, shopsInvalid, wagonSpeedShare } from './shops.mjs';
import { fellingInvalid, logsLeftOut, logsProjection, recordFelling } from './felling.mjs';
import { HOUSEHOLD_SHAPE, NAME_LIMIT, ROLES, TRAIT_RANGE, ageBand, defaultNames, familyProjection, familyRoll, FAMILY_DIE, compositionFor, rolledWords, householdName, kinFor, mainPersonId, rename, rolledPeople, rollRefusal, tooYoung, tooYoungWhy } from './family.mjs';
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
  world.map.sites = region.sites; world.map.routes = region.routes; world.map.terrain = region.terrain; world.map.relief = region.relief; world.map.bounds = region.bounds; world.map.homeBounds = region.homeBounds;
  // A class on the real land carries no province of its own: the page is sent the current one (sim/province.mjs).
  if (region.province) world.map.province = region.province;
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
    const load = defaultLoad(random, crop);
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
  // A main person chosen among the founding four names somebody who is gone; the principal is the main person again.
  delete household.mainId;
  household.roll = roll;
  household.die = FAMILY_DIE;
  // A family rolled while it is still on the road in goes on the road beside its wagon.
  if (household.arriving) putOnTheRoad(world, household);
  // The number, and nothing about what it means: the owner's direction is that the rule is
  // never explained.
  record(world, 'family-rolled', { householdId: household.id, text: `Your family rolled ${rolledWords(roll)}.`, importance: 2, claimId: 'FIC-GONZ-021' });
  return roll;
}
export { WALK_SPEED, HORSE_SPEED, RIDER_SPEED, WAGON_SPEED } from './travel.mjs';
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
/**
 * Somebody of this family who has been set to work that will take this beast on a journey not yet begun: a chore sent
 * with the horse whose road out comes after a first step (making furniture asks first). They have it from the moment the
 * work is given, or two people could be sent with one horse and the second find it gone at the gate.
 */
function promisedTo(world, beast, role, entity) {
  if (beast.travel) return null;
  const household = world.households[entity.householdId];
  return (household?.members || []).map(id => world.entities[id]).find(person => person && person !== entity && !person.travel
    && person.chore?.mode && MODES[person.chore.mode]?.needs.includes(role)
    && person.location.siteId === beast.location.siteId
    && !['dead', 'captured'].includes(person.health?.condition)
    && (CHORES[person.chore.id]?.steps || []).slice(Math.max(0, person.chore.step)).some(step => step.travel)) || null;
}
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
    // Somebody else has it: on the road with them, standing where they are, marching with them, or promised to work that
    // will take it (sim/keeping.mjs). Said in their own name, and for the wagon both beasts at once when one person has both
    // - the ox pulls the wagon, so using one is using the other.
    const holder = holderOf(world, beast) || promisedTo(world, beast, role, entity);
    if (holder && holder !== entity) {
      const held = mode.needs.filter(other => {
        const also = world.entities[propertyId(entity.householdId, other)];
        return also && (holderOf(world, also) || promisedTo(world, also, other, entity)) === holder;
      });
      return { can: false, why: hasWords(holder, held.length ? held : [role]) };
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
    beast.travel = { from: entity.travel.from, to: entity.travel.to, points: path.points, progress: 0, distance: path.distance, speed: entity.travel.speed, mode: mode.id, purpose: 'harness', causeId, silent: true, ...(pace.length && { pace }) };
    beast.location = { ...path.points[0], siteId: null };
  }
}
/** Further from a place's point than this, somebody is standing somewhere else in it. */
export const STANDING_APART_MILES = 0.25;
export function beginTravel(world, entity, destination, causeId, purpose = 'visit', modeId = DEFAULT_MODE) {
  // Somebody severely or dangerously wounded lies where the surgeon has them until they mend (sim/army.mjs `WOUND_GRADES`).
  if (entity.health?.condition === 'wounded') throw new Error(`${entity.name} is lying wounded and cannot travel yet.`);
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
  // A horse that marched with them is set down beside them to go on with them (sim/keeping.mjs). Anything of theirs this
  // journey does not take is left where it stands, and is free for whoever is there - but only once the journey is sure.
  if (!riding) bringAlong(world, entity);
  if (!riding) {
    const { can, why } = modeAvailability(world, entity, mode.id, path);
    if (!can) throw new Error(why);
  }
  const how = riding || mode.id === 'foot' ? '' : mode.id === 'horse' ? ', riding' : ', with the ox and wagon';
  // The ferries on the way, said with the going: each is an hour's wait for the boat (sim/travel.mjs `FERRY_MINUTES`).
  const ferries = (path.ferries || []).map(id => world.map.sites[id]?.name?.replace(/^The /, 'the ')).filter(Boolean);
  const over = ferries.length ? ` The way goes over ${ferries.length === 1 ? ferries[0] : `${ferries.slice(0, -1).join(', ')} and ${ferries.at(-1)}`}, with a wait for the boat${ferries.length > 1 ? ' at each' : ''}.` : '';
  const departure = record(world, 'departure', { actorId: entity.id, householdId: entity.householdId, text: `${entity.name} left for ${world.map.sites[destination].name}${how}.${over}`, causes: causeId ? [causeId] : [] });
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
  // The fords on the way and how far along the road each is (sim/travel.mjs): the wade is already in the pace, and this is
  // what lets the road say what happened at the water when the river is up.
  const fords = (path.fords || []).map(id => world.map.sites[id]).filter(Boolean)
    .map(site => ({ id: site.id, waterKind: site.waterKind || 'river', at: alongAt(points, site.over || site) }))
    .filter(ford => Number.isFinite(ford.at)).sort((a, b) => a.at - b.at);
  entity.travel = { from, to: destination, points, progress: 0, distance, speed: riding ? RIDER_SPEED : mode.speed * wagonSpeedShare(world, entity, mode.id), mode: mode.id, purpose, causeId: departure, ...(pace.length && { pace }), ...(fords.length && { fords }) };
  if (!riding) leaveBehind(world, entity, mode);
  entity.location = { ...points[0], siteId: null }; entity.task = 'travel';
  if (!riding) harness(world, entity, mode, path, departure);
}
/** How far along a line a point stands, in miles: the nearest place on it, measured from the start. */
function alongAt(points, point) {
  let best = Infinity, at = NaN, walked = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (length * length))) : 0;
    const q = { x: a.x + dx * t, y: a.y + dy * t }, off = Math.hypot(q.x - point.x, q.y - point.y);
    if (off < best) { best = off; at = walked + length * t; }
    walked += length;
  }
  return at;
}
/**
 * The water at a ford this traveller has just come down to (owner, 2026-09-19: "a wade that can go wrong", and high water
 * costs more). The ordinary wade is in the pace of the road already; this is what the river being up adds.
 *
 * What it reads is how high the river is running (`water`, sim/weather.mjs), not whether it rained today: a river stays up
 * for days after the rain that raised it, which is why Gray could have "quite summer heat" on the bay while the Brazos was
 * still swelling at Groce's forty miles off (`HIST-TEX-068`, `HIST-TEX-237`). Past `WATER_HIGH` the wade takes up to
 * `HIGH_WATER_TIMES` as long and may go wrong, both scaled by how high the water is; past `WATER_SHUT` a river's ford is
 * **not to be crossed at all** and whoever came down to it waits on the bank for the water to fall - "sudden rains made the
 * Medina unfordable" on 21 February 1836 (`HIST-TEX-237`), and Mill Creek was "still too high to ford" for three days.
 *
 * The share is hashed from the class, the person, the crossing and the day (`share`), never drawn from a stream: the same
 * class replays the same, and a student who saves and reloads gets the river they had.
 * ceiling: a creek's ford never shuts, only a river's. Nothing a traveller carries is lost in a bad wade, and the waiting is
 * the traveller's own: a family does not go round by a ferry instead, which is what the record has some of them do.
 */
function wadeAt(world, entity, ford) {
  const travel = entity.travel, day = Math.floor(world.minute / 1440);
  const site = world.map.sites[ford.id], name = site?.name || 'the water';
  // How high the river is running where the ford is, not whether it rained today (sim/weather.mjs `water`, `FIC-GONZ-133`):
  // a river stays up for days after the rain that raised it, which is what Gray's fine warm days above a swollen Brazos are.
  const water = waterAt(world, site || entity.location, day);
  if (water < WATER_HIGH) return;
  // The river is over the crossing: nobody is fording it today. Waited out on the bank, a day at a time.
  if (water >= WATER_SHUT && ford.waterKind !== 'creek') {
    travel.waitUntil = Math.max(travel.waitUntil || 0, (day + 1) * 1440);
    travel.progress = Math.max(0, ford.at - 0.01);
    entity.location = { ...pointAt(travel.points, travel.progress), siteId: null };
    if (travel.shutAt !== day) {
      travel.shutAt = day;
      record(world, 'consequence', {
        actorId: entity.id, householdId: entity.householdId, importance: 2, claimId: 'FIC-GONZ-133',
        text: `The water is over the crossing at ${name.replace(/^The /, 'the ')}. Nobody is fording it today: ${entity.name} waits on the bank for it to fall.`,
        causes: travel.causeId ? [travel.causeId] : [],
      });
    }
    return;
  }
  const wrong = share(world, entity.id, `wade:${ford.id}:${day}`) < WADE_WRONG_SHARE * (water / WATER_SHUT);
  const minutes = fordMinutes(travel.mode, ford.waterKind) * (HIGH_WATER_TIMES - 1) * (water / WATER_SHUT) + (wrong ? WADE_WRONG_MINUTES : 0);
  travel.waitUntil = Math.max(travel.waitUntil || 0, world.minute + minutes);
  if (entity.kind === 'person' && entity.householdId) entity.exertion = Math.min(EXERTION_CAP, Math.round(((entity.exertion || 0) + (wrong ? 1 : 0.25)) * 10000) / 10000);
  record(world, 'consequence', {
    actorId: entity.id, householdId: entity.householdId, importance: wrong ? 2 : 1, claimId: 'FIC-GONZ-094',
    text: wrong
      ? `The water is up at ${name.replace(/^The /, 'the ')}. ${entity.name} was swept off the crossing and had to go up the bank to find a place to get over: an hour and more lost.`
      : `The water is up at ${name.replace(/^The /, 'the ')}. ${entity.name} waded it slowly.`,
    causes: travel.causeId ? [travel.causeId] : [],
  });
}
/** How many farming ticks' worth of road the next tick carries for this traveller (sim/travel.mjs `roadTicks`). */
export const roadTicksFor = (world, entity) => roadTicks(calendarMinutes(world), ridesAllHours(entity), roadHours(entity.travel));
/** Miles the next tick carries this traveller over open road: what the server says a tick is worth, projected for the page. */
export const milesATick = (world, entity) => entity.travel ? entity.travel.speed * roadTicksFor(world, entity) : 0;
export function progressTravel(world, entity, units = 1) {
  const travel = entity.travel; if (!travel) return;
  // A rider who has stopped to speak with somebody is still on a journey - `siteId` stays
  // null and the route is still theirs - but the ground stops going past. Nulling `travel`
  // instead would put an entity nowhere, which `validateWorld` rightly refuses.
  if (travel.halted) return;
  // Held at a ford while the water is up (`wadeAt`): the road does not go past until the crossing is made.
  if (travel.waitUntil) {
    if (world.minute < travel.waitUntil) return;
    delete travel.waitUntil;
  }
  const wasAt = travel.progress;
  // How fast the ground goes past is a fact about the land and the horse, not about the
  // lesson: three miles in an hour of 1835 in every phase (sim/clock.mjs, docs/COLONIES.md
  // §5.7). So when a tick carries an hour of the calendar instead of twenty minutes, it
  // carries three times the miles with it. A tick longer than that carries its share of a day
  // on the road instead - seven hours of going in twenty-four - because nobody but a rider with
  // word goes all night and all day (sim/travel.mjs `roadTicks`, `HIST-TEX-093`, `FIC-GONZ-059`). That is what keeps the letters reaching San
  // Felipe and Goliad on the days `HIST-TEX-006` puts them there, keeps a volunteer able
  // to reach a gathering that history has dated, and keeps the march to Béxar the fortnight
  // it was rather than something the game has to fake. The miles tire whoever walks them at
  // the same cost a mile always had, below, so a longer day on the road is a harder one.
  //
  // What does *not* scale is effort and attention: a spell of work yields what it always
  // did, and a rider waits the same number of ticks for an answer (sim/encounters.mjs).
  const paced = units * roadTicksFor(world, entity);
  // A rider who is made and reaches the door inside one tick was never on the road at all,
  // and news that materialises at the moment it is spoken has no approach - the thing
  // `SIGHT_MILES` exists to prevent (sim/encounters.mjs). Seeing further does not fix it,
  // because on a short leg he is already inside sight when he is made; what fixes it is that
  // his first tick never carries him past halfway, so there is always a tick of road to
  // watch him coming up. It binds only on a leg shorter than two ticks' riding - an ordinary
  // ride is far longer and is not slowed by it - and it costs that leg one tick.
  // Only where the calendar is stretched: at twenty minutes a tick a leg is longer than a
  // tick's riding anyway, and a family a mile and a half off has always heard on the tick the
  // rider reached it. Nothing about a class on the invented country changes.
  const stretched = paced > units;
  const reach = entity.courier && stretched && wasAt === 0 ? Math.min(travel.speed * paced, travel.distance / 2) : travel.speed * paced;
  // Slower over hard ground where the journey has any (sim/ground.mjs); what is left past the end goes on with a relayed word.
  const moved = moveOnGround(travel.points, travel.pace, travel.distance, travel.progress, reach);
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
    // Shoes on foot and a saddle on the horse take some of it off (sim/shops.mjs).
    const cost = (travel.progress - wasAt) * modeOf(travel).exertion * gearExertionShare(world, entity, modeOf(travel).id);
    entity.exertion = Math.min(EXERTION_CAP, Math.round(((entity.exertion || 0) + cost) * 10000) / 10000);
  }
  // The fords come down to this tick's stretch of road: each is waded as it is reached (`wadeAt`).
  for (const ford of travel.fords || []) {
    if (ford.at <= wasAt || ford.at > travel.progress) continue;
    wadeAt(world, entity, ford);
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
    // The stretch ridden this tick has not been looked at for anybody standing on it yet (sim/encounters.mjs). The leg is
    // kept until it has, and is gone again by the end of the tick.
    if (entity.report?.inPerson) entity.report.lastLeg = { ...travel };
    // A journey that knows where in the place its traveller stands and what they do there -
    // today only the family's arrival on its land (sim/settling.mjs) - ends there. Every other
    // journey ends on the place's own point, at rest.
    const spot = Number.isFinite(travel.settle?.x) ? travel.settle : world.map.sites[travel.to];
    entity.location = { x: spot.x, y: spot.y, siteId: travel.to };
    entity.task = travel.purpose === 'help' ? 'help' : travel.settle?.task || 'rest'; entity.travel = null;
    // Home again, so the beast belongs to nobody and anybody of the family may take it. Anywhere else it stays with
    // whoever brought it (sim/keeping.mjs): a man who rode to town has his horse in town, and his wife who walked there
    // behind him cannot ride it home and leave him standing (owner's playtest, 2026-09-16). It does not walk home by
    // itself: a family that left the wagon at the timber has a wagon at the timber.
    if (entity.borrowedBy && (travel.to === world.households[entity.householdId]?.homeSiteId || !world.entities[entity.borrowedBy])) entity.borrowedBy = null;
    if (entity.laden && world.households[entity.householdId]?.homeSiteId === travel.to) entity.laden = false;
    if (travel.silent) return;
    record(world, 'arrival', { actorId: entity.id, householdId: entity.householdId, text: `${entity.name} arrived at ${world.map.sites[travel.to].name}.`, destination: travel.to, purpose: travel.purpose, causes: [travel.progressEventId || travel.causeId] });
  }
}
export function stepWorld(world) {
  if (world.status !== 'running') return;
  // One tick of everybody's own time; on the real land the calendar it carries can be
  // longer than the twenty minutes of work in it (sim/clock.mjs, docs/COLONIES.md §5.7).
  const calendar = calendarMinutes(world);
  world.tick++; world.minute += calendar;
  for (const entity of Object.values(world.entities)) progressTravel(world, entity);
  // A family whose last wagon wheel came in off the road this tick has arrived.
  advanceArrivals(world);
  // What each family's people can see of the homesteads they are standing on (sim/houses.mjs).
  noteLandSeen(world);
  // Anybody a rider came by on the road this tick is met before the word changes hands at a fork: a rider who has given
  // it away has nothing left to say to the man they just rode past.
  advanceEncounters(world);
  // A rider who has just finished their leg gives the word on in the same tick, so news
  // does not sit at a fork of the road for twenty minutes waiting for the simulation.
  advanceRelays(world);
  // Expresses between the settlements of the real map arrive, wait while the word is read, and send it on (sim/expresses.mjs).
  advanceExpresses(world, { beginTravel, relayReport });
  // A man at the camp's work whom the army has marched away from it leaves it off (sim/camp.mjs), before the chores run.
  advanceCamp(world);
  // Chores run after travel resolves, so a person who arrived this tick picks up the
  // next step of their work in the same tick rather than idling for one.
  advanceChores(world, { beginTravel, modeAvailability });
  // People on auto take up their last order again, and a family whose main person is on auto goes when told (sim/auto.mjs).
  advanceAuto(world, { beginTravel, modeAvailability });
  advanceTown(world);
  // Offers resolve after everyone has moved, because an offer is a thing said face to
  // face and ends the moment the two people part.
  advanceOffers(world);
  // Meetings resolve on the same rule as offers and for the same reason: they are a
  // thing that happens between two people who are standing together, so they are settled
  // once everybody has finished moving for the tick.
  advanceEncounters(world);
  // Days of the calendar: what is eaten, what spoils, what mends, whatever the tick was worth.
  advanceRoutine(world, calendar); deliverReports(world);
  // The families on the road east (sim/scrape.mjs): the rivers, the food, the sickness, arriving.
  advanceFlight(world, calendar);
  advanceDirectors(world, { beginTravel, dispatchReport });
  // Whatever somebody rode to the army marches with them (sim/keeping.mjs), once the army has moved.
  keepWithRiders(world);
  // Each student's own guided beginning moves on by what the tick actually did (sim/lesson.mjs): a house that now
  // stands, ground now cleared, a crop now in. Last, so a step is never called finished a tick before it is.
  advanceLessons(world);
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
export const LOBBY_ACTIONS = new Set(['survey-plot', 'hunt-land', 'fell-trees', 'place-piece', 'remove-piece', 'clear-plot', 'fence-plot','roll-family', 'set-appearance', 'load-wagon', 'bring-stock', 'plan-house', 'chore', 'stop-chore', 'answer-chore', 'rename', 'work', 'rest', 'travel', 'set-main', 'set-auto']);
/**
 * One order from a student's family.
 *
 * The guided beginning is read first and refuses before anything moves (sim/lesson.mjs,
 * docs/LESSON.md): while a family is being walked through its first ten steps, the server - not the
 * page - is what says an order is not this step's. Then the order itself, and then the lesson moves
 * on as far as the order carried it, because a step can be finished by an order as well as by a
 * tick.
 */
export function applyAction(world, householdId, input) {
  const household = world.households[householdId];
  const notYet = lessonRefusal(world, household, input);
  if (notYet) throw new Error(notYet);
  applyOneAction(world, householdId, input);
  advanceLesson(world, household);
}
function applyOneAction(world, householdId, input) {
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
  // How a parent looks (sim/appearance.mjs). Checked before the rules about who can act, because it is not an act:
  // nothing reads it, and a parent away or hurt still looks like somebody.
  if (input.action === 'set-appearance') { setAppearance(world, household, input); return; }
  // A piece placed on the house plot or an unstarted one taken away (sim/houseplot.mjs).
  if (input.action === 'place-piece' || input.action === 'remove-piece') { editPlot(world, household, input); return; }
  // Setting something out in the house, or putting it away (sim/interior.mjs, docs/SETTLING_IN.md step 7). The family's own
  // arrangement: it names nobody in it and moves nothing in the world.
  if (input.action === 'place-item') { placeItem(world, household, String(input.item || ''), input.spot ? String(input.spot) : null); return; }
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
  // The student's main person (sim/family.mjs `mainPersonId`, docs/FAMILY_PANEL.md §11.3): one at a time, anybody of the
  // family who can act and is old enough to be sent - refused above, in the words every order gets. Choosing another recalls
  // nobody: whoever was main stays in the army or on their road; only who may be given the next order moves.
  if (input.action === 'set-main') { household.mainId = entity.id; return; }
  // The person's auto switch (sim/auto.mjs, docs/FAMILY_PANEL.md §11.7): theirs whether at home or in the ranks.
  if (input.action === 'set-auto') { setAuto(world, household, entity, input.auto); return; }
  // Somebody who has joined the army, the garrison or the expedition is in one place until the family sends for them (sim/winter.mjs).
  if (entity.service?.status === 'serving' && !SERVING_ACTIONS.includes(input.action)) throw new Error(servingWhy(world, entity));
  if (input.action === 'winter-recall') { recallFromService(world, household, entity, { beginTravel, modeWith }); return; }
  // The army's questions to a man with Houston (sim/camp.mjs): leaving after the word of Goliad, the fork of the road.
  if (input.action === 'houston-answer') { answerCampQuestion(world, household, entity, String(input.question || ''), String(input.answer || ''), { beginTravel, modeWith }); return; }
  // Asked inside the Alamo whether they will carry a letter out (sim/alamo.mjs).
  if (input.action === 'alamo-courier') { answerCourier(world, entity, input.answer); return; }
  // The family leaves for the east (sim/scrape.mjs): the household's own decision, given by its main person.
  if (input.action === 'flee') { flee(world, household, { take: input.take || {}, refuge: input.refuge }); return; }
  // Or decides to stay and take what comes: its own answer, since silence now packs the wagon after a day (sim/auto.mjs).
  if (input.action === 'flight-stay') { stayHome(world, household); return; }
  // The road's questions (sim/road.mjs): the bogged wagon, the army close behind - the family's answer, given by anybody of it.
  if (input.action === 'road-answer') { answerRoad(world, household, input.option); return; }
  // Farm work is open to the whole family; the historical choice is the principal's.
  // Keeping that split explicit is the point: everyone can be sent to the field, but
  // the decision the lesson turns on still belongs to one named person.
  // Naming is the household's own, belongs to no one member of it, and is checked before
  // the "choose one of your family" rule below because renaming the *family* names nobody.
  if (input.action === 'rename') { rename(world, household, input); return; }
  if (input.action === 'chore') { beginChore(world, household, entity, input.chore, { beginTravel, modeAvailability }, mode); noteOrder(entity, input.chore, mode); return; }
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
    noteOrder(entity, 'hunt-land', DEFAULT_MODE, { ground: { x: Number(input.x), y: Number(input.y) } });
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
  // yard and resting are the main person's (`mainPersonId`: the student's choice, the principal until one is made).
  const answering = ['go-upriver', 'stay-in-town', 'go-see', 'stay-home', 'help', 'stay', 'turn-out', 'stay-put', 'send-for', 'detachment-go', 'detachment-stay', 'army-answer'].includes(input.action);
  if (!answering && entity.id !== mainPersonId(world, household)) throw new Error('Only your main person can be asked that. Choose them with the star on their row.');
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
  else if (['detachment-go', 'detachment-stay'].includes(input.action)) {
    // Whether a volunteer goes ahead with Bowie and Fannin (sim/army.mjs, docs/COLONIES.md §6i). The risk is hidden.
    answerDetachment(world, householdId, entity, input.action === 'detachment-go');
  }
  else if (input.action === 'army-answer') {
    // The army's November questions (sim/army.mjs `ARMY_QUESTIONS`, docs/COLONIES.md §6k): storm, pledge, the Grass Fight.
    answerQuestion(world, householdId, entity, String(input.question || ''), input.answer === 'yes', { beginTravel });
  }
  else if (input.action === 'send-for') {
    // A family sends for its own volunteer, and they leave the army where it stands and start
    // home (sim/army.mjs, docs/COLONIES.md §5.5). Always allowed while the class runs: what it
    // costs is the part they would have taken, not a refusal.
    const why = callHomeRefusal(world, householdId, entity);
    if (why) throw new Error(why);
    callHome(world, householdId, entity, { beginTravel });
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
export const projectMap = world => structuredClone(mapForPage(world.map));
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
/**
 * The household as its family sees it, with its main person resolved (sim/family.mjs `mainPersonId`). `mainId` is sent
 * only when the main person is not the principal: absent means the principal, the correct empty value, so a class that has
 * chosen nobody sends nothing new - the per-tick payload was one byte under its budget (tests/family.test.mjs).
 */
function projectHousehold(world, household) {
  const shown = { ...household };
  delete shown.mainId;
  const main = mainPersonId(world, household);
  return { ...shown, ...(main !== household.principalId && { mainId: main }) };
}
export function projectWorld(world, householdId, role, { includeMap = true, copy = true } = {}) {
  const household = world.households[householdId];
  // The last few a family can see, not every one it has ever seen.
  //
  // This used to be the whole history, resent on every tick for the length of a class, and
  // it is the only genuinely unbounded thing on this channel - a busy family's log grows
  // all afternoon and none of it changes. The journal shows twelve and the screen-reader
  // log the same, so this is the visible record with room to spare. The household's own
  // event list in `world` is untouched, which is what the epilogue is built from
  // (VISION.md §20) and what a save carries.
  //
  // Read from the newest back until there are enough, rather than filtering the whole history: a class has thirty thousand
  // events by the spring, and this runs for every page on every commit and for every automatic family that thinks
  // (docs/PERFORMANCE_SERVER.md). The same events in the same order as filtering all of them and keeping the last few.
  const visibleEvents = [];
  for (let index = world.events.length - 1; index >= 0 && visibleEvents.length < PROJECTED_EVENTS; index--) {
    const e = world.events[index];
    // A sealed event - glory, today - belongs to the family's story and is revealed only at
    // the end of the game. It is dropped before the slice, so it cannot even displace a line.
    if (e.visibility === 'sealed') continue;
    if ((householdId && e.householdId === householdId) || (role === 'host' && e.visibility === 'public')) visibleEvents.push(e);
  }
  visibleEvents.reverse();
  const knownIds = new Set(visibleEvents.map(e => e.id));
  const events = visibleEvents.map(e => ({ id: e.id, type: e.type, minute: e.minute, text: e.text, actorId: e.actorId, householdId: e.householdId, causes: e.causes.filter(id => knownIds.has(id)) }));
  const entities = Object.values(world.entities).filter(e => e.householdId === householdId && householdId).map(e => ({ id: e.id, name: e.name, ...(e.given && { given: e.given }), kind: e.kind, householdId: e.householdId, depth: e.depth, principal: e.principal, ...(e.sex && { sex: e.sex }), ...(Number.isFinite(e.age) && { age: e.age, band: ageBand(e.age) }), location: e.location, travel: e.travel ? { from: e.travel.from, to: e.travel.to, points: e.travel.points, progress: e.travel.progress, distance: e.travel.distance, speed: e.travel.speed, step: milesATick(world, e), mode: e.travel.mode } : null, health: e.health, task: e.task, skills: e.skills, chore: e.chore?.ask ? { ...e.chore, ask: askProjection(world, household, e) } : e.chore, condition: e.condition, species: e.species, laden: e.laden, borrowedBy: e.borrowedBy, ...(e.marks && { marks: e.marks }), ...(e.service && { service: { kind: e.service.kind, status: e.service.status, siteId: e.service.siteId, ...(e.service.acres && { acres: e.service.acres }), ...(e.service.besieged && { besieged: true }), ...(e.service.riding && { riding: true }), ...(e.service.courier === 'open' && { courier: 'open' }), ...(e.service.drilled && { drilled: e.service.drilled }), ...(e.service.bound && { bound: true }), ...(e.service.leave === 'open' && { leave: 'open' }), ...(e.service.road === 'open' && { road: 'open' }) } }), ...(e.voted && { voted: true }), ...(e.auto && { auto: true }) }));
  // What each person could be asked to do, with the reason for anything refused, is
  // computed on the server. The client must never decide for itself what is possible:
  // that is the same rule as fog of war, applied to a control instead of a fact.
  // Anyone else standing where one of this household's people is standing. Filtered on
  // the server, at the level of detail that being in the same place would give you.
  //
  // The Host is not a family and has no fog (owner, 2026-09-16): everybody in the class, where they truly are, at the level of
  // detail a map needs and no more (sim/overview.mjs). A student's `others` is exactly what it always was.
  const overview = role === 'host' ? hostOverview(world) : null;
  const others = overview ? overview.everyone : observedBy(world, householdId);
  // How many logs lie out is asked of every person's work list; counted once for the family here.
  const logsOut = household ? logsLeftOut(world, household) : 0;
  const work = household ? Object.fromEntries(household.members.map(id => [id, choresFor(world, household, world.entities[id], logsOut)])) : {};
  // Which ways each person could set out, on the same rule as the work: a permission, so
  // it is decided here and never guessed at by the client.
  // What the family has made of this land, and what state it is in. The renderer draws
  // the field at the size this says and the fence only when there is one to draw.
  const land = household ? { ...improvementProjection(household), ...shelterProjection(household), ...houseProjection(world, household), ...grantProjection(world, household), ...siteProjection(world, household), ...plotProjection(world, household), ...logsProjection(world, household, logsOut), interior: interiorProjection(household) } : null;
  // What is in the wagon, and whether it can still be repacked. The catalogue comes once, from /api/chores.
  const wagon = household ? wagonProjection(world, household) : null;

  const travelModes = household ? Object.fromEntries(household.members.map(id => [id, travelModesFor(world, world.entities[id])])) : {};
  const toolCondition = household ? Object.fromEntries(Object.entries(household.tools || {}).map(([tool, wear]) => [tool, { wear, state: toolState(wear) }])) : {};
  const offers = offersFor(world, householdId);
  const encounter = encounterProjection(world, householdId, role);
  const armies = armiesSeen(world, householdId, role);
  // The guided beginning, for a student's own family and nobody else's (sim/lesson.mjs, docs/LESSON.md): which step this
  // family is on, what it is being asked to do, and every action the server will let through while it is. Absent once the
  // lesson is over, which is how the page knows the game is the student's now.
  const lesson = household && role !== 'host' ? lessonProjection(world, household) : null;
  const view = { tick: world.tick, minute: world.minute, status: world.status, role, householdId, ...(includeMap && { map: mapForPage(world.map) }), household: household && projectHousehold(world, household), entities, others, offers, encounter, events, work, travelModes, land, wagon, toolCondition, reports: reportsFor(world, role === 'host' ? 'public' : householdId), ...directorProjection(world, householdId, role),
    // The weather, region by region (sim/weather.mjs, docs/WEATHER.md): what kind of day it is in each of the three
    // countries, how high their rivers are running, and where the wind is from. The page draws it and says nothing
    // (owner, 2026-09-20: "Players should see the weather. If implemented correctly, no text should be required"), so the
    // whole map goes to every page - the Host looks at all three countries at once, and a student's family may be in any.
    weather: weatherOn(world),
    ...(lesson && { lesson }),
    // The army, once there is one: where it is, how many went, and which of them are this family's (sim/army.mjs).
    ...(world.army && householdId ? { army: armyProjection(world, householdId) } : {}),
    // The armies standing in the country, as far as this page may know of them (sim/armies.mjs): the page draws their camps
    // and the Mexican columns, so a man who joins an army is not alone in the middle of nowhere (owner, 2026-09-17).
    ...(armies.length && { armies }),
    // The family's flight east, once it has been told to go (sim/scrape.mjs).
    ...(household?.flight ? { flight: flightProjection(world, household) } : {}),
    // Every family's land as it truly stands, and where the army is, for the Host's map only (sim/overview.mjs).
    ...(overview && { overview: { lands: overview.lands, ...(overview.army && { army: overview.army }) } }),
    // The Host's live page (sim/host.mjs): the class in words, the Rumor Mill and the spotlight. Never a student's.
    ...(role === 'host' && { live: hostLiveProjection(world) }),
    // The end of the game, and only once it has ended: each family's coin and glory revealed, and the
    // Host's closing view (sim/ending.mjs, docs/MONEY_AND_GLORY.md steps 4-5).
    ...endingProjection(world, householdId, role),
    // Whether this class began with the families arriving, which is what a family knows of a
    // neighbour's land it has not been to see: at dawn on the 28th nobody had a house. Land it has
    // seen since is in `household.seenLand`, as it stood then (sim/houses.mjs, `noteLandSeen`).
    ...(world.director?.arrival && { arrivalClass: true }) };
  // A copy, so that nothing holding a view can change the world through it. `copy: false` is for a caller that only
  // serialises the view at once (server/app.mjs `view`), where the copy was a sixth of the projection's time and changes
  // not one byte of the text (docs/PERFORMANCE_SERVER.md; tests/save-text.test.mjs).
  return copy ? structuredClone(view) : view;
}
export function validateWorld(world) {
  if (world.schemaVersion !== 3 || !Number.isInteger(world.tick) || world.tick < 0 || !Number.isFinite(world.minute) || world.minute < 0 || !['lobby', 'running', 'paused', 'ended'].includes(world.status)) throw new Error('Invalid world');
  // Absent on every class saved before a second period existed, which were all in the first (sim/periods.mjs).
  if (world.period !== undefined && ![1, 2, 3].includes(world.period)) throw new Error('Invalid class period');
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
    // A first name and the family's last name, each within the limit (sim/family.mjs `nameFamily`).
    if (typeof entity.name !== 'string' || !entity.name.trim() || entity.name.length > (entity.given === undefined ? NAME_LIMIT : NAME_LIMIT * 2 + 1)) throw new Error('Invalid person name');
    if (entity.given !== undefined && (typeof entity.given !== 'string' || !entity.given.trim() || entity.given.length > NAME_LIMIT)) throw new Error('Invalid first name');
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
    // The auto switch and the order it repeats (sim/auto.mjs): absent on every class saved before, which is off.
    if (entity.auto !== undefined && entity.auto !== true) throw new Error('Invalid auto switch');
    if (entity.order !== undefined && !REPEATED.includes(entity.order?.chore)) throw new Error('Invalid remembered order');
    // Property is lent to somebody who exists - a person who took it on a journey, or a
    // whole household it is out with. A dangling borrower is how an ox ends up
    // permanently unusable, because nothing will ever hand it back.
    if (entity.borrowedBy && !world.entities[entity.borrowedBy] && !world.households[entity.borrowedBy]) throw new Error('Property is lent to nobody');
    // Somebody helping raise a neighbour's walls is helping a family that exists (sim/houses.mjs).
    if (entity.chore?.hostHouseholdId !== undefined && (!world.households[entity.chore.hostHouseholdId] || entity.chore.hostHouseholdId === entity.householdId)) throw new Error('Helping a family that is not there');
    // A hunt on the family's own land knows where it is and how good the ground is (sim/hunting.mjs). Absent on every other chore.
    const hunted = entity.chore?.id === 'hunt-land' ? entity.chore.ground : undefined;
    if (entity.chore?.id === 'fell-trees' && (!Number.isFinite(entity.chore.ground?.x) || !Number.isFinite(entity.chore.ground?.y))) throw new Error('Invalid felling place');
    if (hunted !== undefined && (!Number.isFinite(hunted?.x) || !Number.isFinite(hunted.y) || !(hunted.game >= 0 && hunted.game <= 1) || typeof hunted.cover !== 'string' || !Number.isFinite(hunted.toward?.x) || !Number.isFinite(hunted.toward?.y) || (hunted.quarry !== undefined && !GAME[hunted.quarry]))) throw new Error('Invalid hunting place');
    if (entity.travel && (!Array.isArray(entity.travel.points) || entity.travel.points.length < 2 || !Number.isFinite(entity.travel.progress) || !Number.isFinite(entity.travel.speed) || entity.travel.speed <= 0 || entity.travel.progress < 0 || entity.travel.progress > entity.travel.distance)) throw new Error('Invalid travel');
    // Absent on every journey over open road and every class saved before the going (sim/ground.mjs), which travels as it did.
    if (entity.travel?.pace !== undefined && (!Array.isArray(entity.travel.pace) || entity.travel.pace.some(run => !Array.isArray(run) || !Number.isInteger(run[0]) || run[0] < 0 || run[0] >= entity.travel.points.length - 1 || !Number.isFinite(run[1]) || run[1] <= 0))) throw new Error('Invalid going');
  }
  for (const household of Object.values(world.households)) {
    if (!world.entities[household.principalId] || [...household.members, ...household.property].some(id => !world.entities[id])) throw new Error('Dangling household reference');
    // The main person, once chosen, is one of the family; absent, the principal is (sim/family.mjs `mainPersonId`), so no save version moved.
    if (household.mainId !== undefined && !household.members.includes(household.mainId)) throw new Error('The main person is not one of the family');
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
    // Absent on every class saved before the guided beginning (sim/lesson.mjs), which is the correct empty value: a family
    // standing in its own house has nothing to be walked through, so no save version moved.
    const badLoad = loadInvalid(household) || houseInvalid(world, household) || grantInvalid(world, household) || siteInvalid(world, household) || plotsInvalid(world, household) || lessonInvalid(world, household);
    if (badLoad) throw new Error(badLoad);
    // Absent on a class nobody has named, which is the correct empty value and why no save
    // version moved. Present, it is a name somebody typed and has to stay one.
    // Present only while a new class's family is still on the road in (sim/settling.mjs).
    if (household.arriving !== undefined && household.arriving !== true) throw new Error('Invalid arrival marker');
    if (household.played !== undefined && household.played !== true) throw new Error('Invalid played marker');
    // Absent is true or absent, never false (sim/absence.mjs), and only a played family can be absent.
    if (household.absent !== undefined && (household.absent !== true || !household.played)) throw new Error('Invalid absent marker');
    if (household.settlementId !== undefined && world.map.sites[household.settlementId]?.kind !== 'town') throw new Error('A family belongs to a settlement that is not there');
    if (household.name !== undefined && (typeof household.name !== 'string' || !household.name.trim() || household.name.length > NAME_LIMIT)) throw new Error('Invalid household name');
    if (household.surname !== undefined && (typeof household.surname !== 'string' || !household.surname.trim() || household.surname.length > NAME_LIMIT)) throw new Error('Invalid family last name');
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
  const badShops = shopsInvalid(world);
  if (badShops) throw new Error(badShops);
  const badFurniture = furnitureInvalid(world);
  if (badFurniture) throw new Error(badFurniture);
  const badInterior = interiorInvalid(world);
  if (badInterior) throw new Error(badInterior);
  const badLooks = appearanceInvalid(world);
  if (badLooks) throw new Error(badLooks);
  const badArmy = armyInvalid(world);
  if (badArmy) throw new Error(badArmy);
  const badFelling = fellingInvalid(world);
  if (badFelling) throw new Error(badFelling);
  const badService = winterInvalid(world);
  if (badService) throw new Error(badService);
  const badFlight = scrapeInvalid(world);
  if (badFlight) throw new Error(badFlight);
  const badCamp = campInvalid(world);
  if (badCamp) throw new Error(badCamp);
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

// Pure deterministic simulation; credentials and renderer state never belong here.
import { record } from './events.mjs';
import { reportsFor, deliverReports } from './knowledge.mjs';
import { advanceRoutine } from './routines.mjs';
import { advanceDirectors, handleChoice, handleMarch, directorProjection } from './directors.mjs';
import { abandonChore, advanceChores, beginChore, choresFor, skillsFor, toolState } from './chores.mjs';
import { advanceTown, createTownspeople, observedBy } from './town.mjs';
import { GOODS, advanceOffers, makeOffer, offersFor, respondToOffer } from './trade.mjs';
import { buildGonzalesRegion, findPath, polylineLength } from './geography.mjs';
import { advanceEncounters, askRider, carriedInPerson, encounterProjection, leaveRider, riderName, spotName } from './encounters.mjs';
import { DEFAULT_MODE, MODES, modeOf, propertyId, RIDER_SPEED } from './travel.mjs';
export { MODES, MODE_IDS, DEFAULT_MODE, carryCapacity, modeOf } from './travel.mjs';
export { record } from './events.mjs';
export function seededRandom(seed) {
  let value = 2166136261;
  for (const char of String(seed)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; };
}
export function createWorld(seed = 'gonzales', playerCount = 15) {
  if (!Number.isInteger(playerCount) || playerCount < 5 || playerCount > 30) throw new Error('Class size must be 5–30');
  const random = seededRandom(seed);
  const world = { schemaVersion: 3, seed: String(seed), playerCount, tick: 0, minute: 0, status: 'lobby', entities: {}, households: {}, map: { sites: {}, routes: {}, terrain: [] }, events: [], nextEventId: 1, nextCourierId: 1, truth: {}, knowledge: { households: {}, public: {} }, barriers: [], offers: {}, nextOfferId: 1, encounters: {}, nextEncounterId: 1 };
  // Geography is researched pattern with invented coordinates; see sim/geography.mjs.
  const region = buildGonzalesRegion(random, playerCount);
  world.map.sites = region.sites; world.map.routes = region.routes; world.map.terrain = region.terrain; world.map.relief = region.relief; world.map.bounds = region.bounds; world.map.homeBounds = region.homeBounds; world.map.province = region.province;
  for (let i = 1; i <= playerCount; i++) {
    const householdId = `hh-${i}`;
    const site = world.map.sites[`home-${i}`];
    // Corn or cotton, fixed at founding: `HIST-GONZ-013` documents both for this
    // locality and nothing else, so a household grows one of the two and never changes.
    const crop = random() < .5 ? 'corn' : 'cotton';
    const household = { id: householdId, name: `Family ${i}`, homeSiteId: site.id, members: [], principalId: `${householdId}-thomas`, property: [], resources: { food: 12 + Math.floor(random() * 4), seed: 2 }, tools: { hoe: 0 }, field: { crop, state: 'bare', changedTick: 0 }, relationships: { neighbor: 0 }, commitments: [], memories: [] };
    world.households[householdId] = household;
    world.knowledge.households[householdId] = {};
    for (const [j, name] of ['Thomas', 'Elena', 'Rosa', 'Mateo'].entries()) {
      const id = `${householdId}-${name.toLowerCase()}`;
      // Skills are fixed at founding and derived from the person's own id, so the four
      // members of a family differ and a household may simply not contain anyone handy.
      world.entities[id] = { id, name, kind: 'person', householdId, depth: j === 0 ? 'detailed' : 'moderate', principal: j === 0, location: { x: site.x + j * .06, y: site.y + (j % 2) * .06, siteId: site.id }, travel: null, health: { condition: 'well' }, task: j < 2 ? 'work' : 'rest', skills: skillsFor(id), chore: null, relationships: {}, propertyRefs: [`${householdId}-wagon`], commitments: [] };
      household.members.push(id);
    }
    // The yard is west of the cabin. The cropland runs east and south of it, so property
    // left at these coordinates used to stand in the middle of the corn - invisible when
    // a field was a flat green rectangle, and obviously wrong once it grew rows.
    // `species` is what tells the renderer an ox from a horse. A class saved before
    // there were horses has neither the field nor the animal, and an ox is the right
    // thing to draw for every animal such a save contains - the absent field has a
    // correct empty value, so no save version moved. `sim/trade.mjs` is the precedent.
    for (const beast of [
      { role: 'ox', kind: 'animal', species: 'ox', name: 'Juniper the ox', dx: -.17, dy: .10 },
      { role: 'horse', kind: 'animal', species: 'horse', name: 'Bess the mare', dx: -.31, dy: .05 },
      { role: 'wagon', kind: 'wagon', name: 'Family wagon', dx: -.21, dy: .26 },
    ]) {
      const id = propertyId(householdId, beast.role);
      world.entities[id] = { id, name: beast.name, kind: beast.kind, ...(beast.species && { species: beast.species }), householdId, depth: 'aggregate', location: { x: site.x + beast.dx, y: site.y + beast.dy, siteId: site.id }, travel: null, condition: 'sound', borrowedBy: null };
      household.property.push(id);
    }
    record(world, 'household-founded', { householdId, text: 'Your family lives here, with food, an ox, a horse, and a wagon.' });
  }
  // The town has people in it. They belong to nobody and are commanded by nobody.
  createTownspeople(world);
  validateWorld(world); return world;
}
export { WALK_SPEED, RIDER_SPEED, WAGON_SPEED } from './travel.mjs';
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
  const path = destination && entity.location.siteId ? findPath(world.map, entity.location.siteId, destination) : null;
  return Object.keys(MODES).map(id => {
    const { can, why } = modeAvailability(world, entity, id, path);
    return can ? { id, can: true, carry: MODES[id].carry } : { id, can: false, why, carry: MODES[id].carry };
  });
}
/** The sentence to refuse a journey with, or null if it can be made. Used before any state moves. */
export function travelRefusal(world, entity, destination, modeId = DEFAULT_MODE) {
  if (!world.map.sites[destination]) return 'No known route to that destination.';
  if (!entity.location.siteId) return 'Already traveling.';
  if (entity.location.siteId === destination) return 'Already there.';
  const path = findPath(world.map, entity.location.siteId, destination);
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
    beast.travel = { from: entity.travel.from, to: entity.travel.to, points: path.points, progress: 0, distance: path.distance, speed: mode.speed, mode: mode.id, purpose: 'harness', causeId, silent: true };
    beast.location = { ...path.points[0], siteId: null };
  }
}
export function beginTravel(world, entity, destination, causeId, purpose = 'visit', modeId = DEFAULT_MODE) {
  if (entity.travel || !entity.location.siteId) throw new Error('Already traveling.');
  if (!world.map.sites[destination]) throw new Error('No known route to that destination.');
  if (entity.location.siteId === destination) throw new Error('Already there.');
  const from = entity.location.siteId;
  // A path may run through several roads, so reaching the far bank means using the ford.
  const path = findPath(world.map, from, destination);
  if (!path) throw new Error('No known route to that destination.');
  // A courier rides their own horse and owns no household property. This file has always
  // given them the mounted speed by looking at the report rather than at a mode, and that
  // stays exactly as it was: relays must never start depending on whether some family
  // happens to own an animal.
  const mode = entity.report ? MODES.horse : MODES[modeId];
  if (!mode) throw new Error('No such way of going.');
  if (!entity.report) {
    const { can, why } = modeAvailability(world, entity, mode.id, path);
    if (!can) throw new Error(why);
  }
  const how = entity.report || mode.id === 'foot' ? '' : mode.id === 'horse' ? ', riding' : ', with the ox and wagon';
  const departure = record(world, 'departure', { actorId: entity.id, householdId: entity.householdId, text: `${entity.name} left for ${world.map.sites[destination].name}${how}.`, causes: causeId ? [causeId] : [] });
  entity.travel = { from, to: destination, points: path.points, progress: 0, distance: path.distance, speed: entity.report ? RIDER_SPEED : mode.speed, mode: mode.id, purpose, causeId: departure };
  entity.location = { ...path.points[0], siteId: null }; entity.task = 'travel';
  if (!entity.report) harness(world, entity, mode, path, departure);
}
export function progressTravel(world, entity, units = 1) {
  const travel = entity.travel; if (!travel) return;
  // A rider who has stopped to speak with somebody is still on a journey - `siteId` stays
  // null and the route is still theirs - but the ground stops going past. Nulling `travel`
  // instead would put an entity nowhere, which `validateWorld` rightly refuses.
  if (travel.halted) return;
  const wasAt = travel.progress;
  travel.progress = Math.min(travel.distance, travel.progress + travel.speed * units);
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
    if (entity.report) entity.report.overflow = Math.max(0, wasAt + travel.speed * units - travel.distance);
    entity.location = { x: world.map.sites[travel.to].x, y: world.map.sites[travel.to].y, siteId: travel.to };
    entity.task = travel.purpose === 'help' ? 'help' : 'rest'; entity.travel = null;
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
  // A rider who has just finished their leg gives the word on in the same tick, so news
  // does not sit at a fork of the road for twenty minutes waiting for the simulation.
  advanceRelays(world);
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
  const entity = { id, name: inPerson ? riderName(number) : `Rider ${number}`, kind: 'person', householdId: null, depth: 'moderate', principal: false, courier: true, location: { x: from.x, y: from.y, siteId: fromSiteId }, task: 'rest', health: { condition: 'well' }, travel: null, report: { topicId, audience, destination: leg ? leg.id : homeSiteId, homeSiteId, status, originSiteId, departedMinute: world.minute, ...(inPerson && { inPerson: true, provenance }) } };
  world.entities[id] = entity;
  beginTravel(world, entity, entity.report.destination, causeId, 'report');
  return entity;
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
export const LOBBY_ACTIONS = new Set(['chore', 'stop-chore', 'work', 'rest', 'travel']);
export function applyAction(world, householdId, input) {
  const entity = world.entities[input.entityId];
  const household = world.households[householdId];
  // How they go, chosen once and applied to whatever journey this order starts - a trip
  // to town, or the road out to the timber a chore begins with. A command from a class
  // that predates the choice carries no mode and gets the one everybody had then.
  const mode = input.mode || DEFAULT_MODE;
  if (!MODES[mode]) throw new Error('No such way of going.');
  if (world.status === 'lobby' && !LOBBY_ACTIONS.has(input.action)) throw new Error('Your neighbours are still arriving. You can set your own family to work now; anything between families waits for the class to begin.');
  if (!entity || entity.householdId !== householdId || entity.kind !== 'person') throw new Error('Choose one of your family.');
  if (entity.health.condition === 'dead' || entity.health.condition === 'captured') throw new Error('This person cannot act.');
  // Farm work is open to the whole family; the historical choice is the principal's.
  // Keeping that split explicit is the point: everyone can be sent to the field, but
  // the decision the lesson turns on still belongs to one named person.
  if (input.action === 'chore') { beginChore(world, household, entity, input.chore, { beginTravel, modeAvailability }, mode); return; }
  // Trading is a household's own business and any member standing there can do it. It is
  // deliberately not the principal's alone: the whole point is that a family without the
  // handy member can ask the neighbour who is actually present.
  if (input.action === 'offer') { makeOffer(world, householdId, entity, input); return; }
  if (['accept-offer', 'decline-offer', 'withdraw-offer'].includes(input.action)) {
    respondToOffer(world, householdId, entity, input.action, input.offerId);
    return;
  }
  // Talking to a rider belongs to whoever the rider actually met, which is very often not
  // the principal. That is the whole point of a messenger meeting a family rather than
  // delivering to a household: the person who was at the door is the person who heard it.
  if (input.action === 'ask-rider') { askRider(world, householdId, entity, input.lineId); return; }
  if (input.action === 'leave-rider') { leaveRider(world, householdId, entity); return; }
  if (input.action === 'stop-chore') {
    if (!entity.chore) throw new Error('Nothing to call off.');
    entity.chore = null; entity.task = 'rest';
    record(world, 'assignment', { actorId: entity.id, householdId, text: `${entity.name} left off the work.` });
    return;
  }
  if (!entity.principal) throw new Error('Only your principal can be asked that.');
  if (['go-upriver', 'stay-in-town'].includes(input.action)) {
    // Going upriver abandons whatever work was in hand, for the same reason answering
    // the first call does: a chore left merely frozen resumes wherever the journey ends.
    if (entity.chore) abandonChore(world, world.households[householdId], entity);
    handleMarch(world, householdId, entity, input.action, { beginTravel, travelRefusal }, mode);
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
export function projectWorld(world, householdId, role, { includeMap = true } = {}) {
  const household = world.households[householdId];
  const visibleEvents = world.events.filter(e => (householdId && e.householdId === householdId) || (role === 'host' && e.visibility === 'public'));
  const knownIds = new Set(visibleEvents.map(e => e.id));
  const events = visibleEvents.map(e => ({ id: e.id, type: e.type, minute: e.minute, text: e.text, actorId: e.actorId, householdId: e.householdId, causes: e.causes.filter(id => knownIds.has(id)) }));
  const entities = Object.values(world.entities).filter(e => e.householdId === householdId && householdId).map(e => ({ id: e.id, name: e.name, kind: e.kind, householdId: e.householdId, depth: e.depth, principal: e.principal, location: e.location, travel: e.travel ? { from: e.travel.from, to: e.travel.to, points: e.travel.points, progress: e.travel.progress, distance: e.travel.distance, speed: e.travel.speed, mode: e.travel.mode } : null, health: e.health, task: e.task, skills: e.skills, chore: e.chore, condition: e.condition, species: e.species, laden: e.laden, borrowedBy: e.borrowedBy }));
  // What each person could be asked to do, with the reason for anything refused, is
  // computed on the server. The client must never decide for itself what is possible:
  // that is the same rule as fog of war, applied to a control instead of a fact.
  // Anyone else standing where one of this household's people is standing. Filtered on
  // the server, at the level of detail that being in the same place would give you.
  const others = observedBy(world, householdId);
  const work = household ? Object.fromEntries(household.members.map(id => [id, choresFor(world, household, world.entities[id])])) : {};
  // Which ways each person could set out, on the same rule as the work: a permission, so
  // it is decided here and never guessed at by the client.
  const travelModes = household ? Object.fromEntries(household.members.map(id => [id, travelModesFor(world, world.entities[id])])) : {};
  const toolCondition = household ? Object.fromEntries(Object.entries(household.tools || {}).map(([tool, wear]) => [tool, { wear, state: toolState(wear) }])) : {};
  const offers = offersFor(world, householdId);
  const encounter = encounterProjection(world, householdId, role);
  return structuredClone({ tick: world.tick, minute: world.minute, status: world.status, role, householdId, ...(includeMap && { map: world.map }), household, entities, others, offers, encounter, events, work, travelModes, toolCondition, reports: reportsFor(world, role === 'host' ? 'public' : householdId), ...directorProjection(world, householdId, role) });
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
    // Property is lent to somebody who exists - a person who took it on a journey, or a
    // whole household it is out with. A dangling borrower is how an ox ends up
    // permanently unusable, because nothing will ever hand it back.
    if (entity.borrowedBy && !world.entities[entity.borrowedBy] && !world.households[entity.borrowedBy]) throw new Error('Property is lent to nobody');
    if (entity.travel && (!Array.isArray(entity.travel.points) || entity.travel.points.length < 2 || !Number.isFinite(entity.travel.progress) || !Number.isFinite(entity.travel.speed) || entity.travel.speed <= 0 || entity.travel.progress < 0 || entity.travel.progress > entity.travel.distance)) throw new Error('Invalid travel');
  }
  for (const household of Object.values(world.households)) {
    if (!world.entities[household.principalId] || [...household.members, ...household.property].some(id => !world.entities[id])) throw new Error('Dangling household reference');
    for (const [resource, amount] of Object.entries(household.resources)) {
      if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid resource ${resource}`);
    }
    if (!household.tools || !Number.isInteger(household.tools.hoe) || household.tools.hoe < 0) throw new Error('Invalid tool condition');
    if (!household.field || !['bare', 'planted', 'ripe'].includes(household.field.state) || !['corn', 'cotton'].includes(household.field.crop)) throw new Error('Invalid field state');
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
  const events = new Set(world.events.map(e => e.id));
  if (events.size !== world.events.length || world.events.some(e => e.causes.some(id => !events.has(id)))) throw new Error('Invalid event graph');
  if (world.nextEventId !== world.events.length + 1) throw new Error('Event sequence would duplicate an ID');
  for (const [audience, reports] of Object.entries({ ...world.knowledge.households, public: world.knowledge.public })) {
    if (audience !== 'public' && !world.households[audience]) throw new Error('Unknown knowledge audience');
    for (const [topicId, report] of Object.entries(reports)) {
      if (!world.truth[topicId] || !events.has(report.eventId) || report.receivedMinute > world.minute || report.observedMinute > report.receivedMinute) throw new Error('Invalid knowledge state');
    }
  }
}

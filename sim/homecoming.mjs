// The trip home, for the flashback (docs/FLASHBACK.md §3; owner, 2026-09-28: "add their trip home as part of the end of game
// video flashback").
//
// A class ends on April 25, 1836, four days after San Jacinto, and almost no family is home by then (docs/audits/
// 2026-09-28-design.md B6: in a fifteen-family class played to the end, fourteen were still on the road). The game already has
// every rule of the road home - `turnHome` (sim/scrape.mjs) sets a family out from its refuge, `advanceFlight` brings it in and
// shows it what is left (the house standing or burned, what it left in the house, the cache dug up, the milk cow back in the
// herd, what is found of the stock on the range) - and the class simply stops before most families reach the end of it.
//
// So the flashback runs those same rules on a copy of the ended class, headless and deterministic, until every family that can
// get home is home: nothing of the saved class moves, and the same save always gives the same homecoming. What it adds is only
// what the game never had to decide because the class always ended first:
//   - a family still going **east** when the class ended turns for home where it stands, by the way `findWay` gives from that
//     point (the victory reached every family; the game only turned those already at a refuge);
//   - somebody of the family apart from it and free - a man let go from the army after San Jacinto - walks home on his own;
//   - the road home **rolls no sickness**. ceiling: a death on a road the class never played would be a death the reckoning
//     never counted and the student never saw coming; the sickness of the road home is the way out if the owner wants it
//     (docs/FLASHBACK.md, decision (c)). Since 2026-10-02 the family eats from its store on the road home as it does in the class
//     (triage 2026-09-29 3.3, `advanceFlight`), but the copy runs no hunger's tick (sim/hunger.mjs `advanceHunger`), so nobody
//     dies of hunger on it either, for the same reason.
// Everybody still serving with the army, and every prisoner, stays where the class left them, and the flashback says so.
import { advanceFlight, turnHome } from './scrape.mjs';
import { progressTravel } from './world.mjs';
import { withCalendarStep } from './clock.mjs';
import { findWay } from './ways.mjs';
import { WAGON_SPEED, WALK_SPEED } from './travel.mjs';
import { drawnVehicles, riddenHorses, setOut } from './company.mjs';
import { cowPace } from './flight-work.mjs';
import { thinLine } from './flight-route.mjs';
import { beastsOf } from './beasts.mjs';
import { record } from './events.mjs';
import { toolCount } from './tools.mjs';

/** The copy steps four hours at a time: long enough that a traveller keeps the seven hours of going in a day (sim/travel.mjs `roadTicks`). */
export const HOME_STEP_MINUTES = 240;
/** The longest the copy runs: sixty days after the class ended is further than any refuge is from any farm on the map. */
export const HOME_DAYS_CAP = 60;
const GONE = ['dead', 'captured'];
const HERE = 'flashback-here';
const peopleOf = (world, household) => household.members.map(id => world.entities[id]).filter(entity => entity?.kind === 'person');
const beastsAll = (world, household) => ['horse', 'ox', 'wagon'].flatMap(role => beastsOf(world, household, role));
const free = person => !GONE.includes(person.health?.condition);
const siteName = (world, id) => world.map.sites[id]?.name || null;
/** The kinds of place a family would name to say where it was: a town, a landing, a ferry - not a ford, a stand of timber or a fork. */
const NAMED = new Set(['town', 'village', 'landing', 'farmstead', 'ferry', 'bridge', 'camp', 'field', 'ground', 'distant']);
/** The place of the map nearest a point, for saying where a family was. */
export function nearestPlace(world, point) {
  if (!point) return null;
  let best = null;
  for (const site of Object.values(world.map.sites)) {
    if (!NAMED.has(site.kind) || !Number.isFinite(site.x)) continue;
    const miles = Math.hypot(site.x - point.x, site.y - point.y);
    if (!best || miles < best.miles) best = { id: site.id, name: site.name, miles };
  }
  return best;
}

/** A journey home from where a company stands, as `turnHome` makes one from a refuge. */
function sendHome(world, household, movers, from, { mode, causeId }) {
  const home = household.homeSiteId;
  const path = findWay(world, HERE, home, mode, { ferries: false, origin: from });
  if (!path) return null;
  const journey = () => ({ from: null, to: home, points: path.points.map(point => ({ ...point })), progress: 0, distance: path.distance, speed: mode === 'wagon' ? WAGON_SPEED : WALK_SPEED, mode, purpose: 'return', silent: true, causeId, ...(path.pace?.length && { pace: path.pace }), ...(path.offRoad?.length && { offRoad: path.offRoad.map(run => [...run]) }) });
  if (world.meansRoll) setOut(movers, mode === 'wagon' ? drawnVehicles(movers) : [], journey, riddenHorses(world, movers));
  for (const entity of movers) {
    if (!world.meansRoll) entity.travel = journey();
    entity.location = { ...path.points[0], siteId: null };
    if (entity.kind === 'person') entity.task = 'travel';
  }
  return path;
}

/** A family still going east when the class ended: it turns for home where it stands. */
function turnAround(world, household) {
  const flight = household.flight;
  const movers = [...household.members, ...(household.property || [])].map(id => world.entities[id]).filter(entity => entity?.travel?.purpose === 'flee');
  const leader = movers.find(entity => entity.kind === 'person' && free(entity));
  if (!leader) return null;
  const at = { x: leader.location.x, y: leader.location.y };
  const all = beastsAll(world, household), with_ = movers.filter(entity => entity.kind !== 'person');
  const mode = flight.mode === 'wagon' && with_.some(entity => entity.kind === 'wagon') && with_.some(entity => entity.kind === 'animal' && entity.species !== 'horse') ? 'wagon' : 'foot';
  const place = nearestPlace(world, at);
  const causeId = record(world, 'consequence', { householdId: household.id, importance: 2, claimId: 'FIC-GONZ-780', text: `With the news from San Jacinto the family turned for home on the road${place ? ` near ${place.name}` : ''}.` });
  for (const entity of movers) delete entity.travel;
  delete flight.crossing; delete flight.route; delete flight.bog; delete flight.ask;
  const path = sendHome(world, household, movers.filter(entity => entity.kind === 'person' ? free(entity) : true), at, { mode, causeId });
  if (!path) return null;
  cowPace(world, household);
  flight.status = 'returning';
  return { from: at, place, mode, all: all.length };
}

/**
 * Everybody of every family, home: the game's own road home run on a copy of the class. Returns, by household, what the
 * flashback's last beats are made of. Deterministic: the same ended class always gives the same result.
 */
export function homecomings(world) {
  const copy = structuredClone(world);
  copy.status = 'running';
  const endMinute = copy.minute;
  const start = copy.events.length;
  const trips = {};
  for (const household of Object.values(copy.households)) {
    const flight = household.flight;
    trips[household.id] = { status: !flight ? 'none' : flight.status === 'home' ? 'home-already' : ['ordered', 'stayed'].includes(flight.status) ? 'stayed' : 'trip', apart: [] };
    if (flight?.status === 'fled') {
      const turned = turnAround(copy, household);
      if (turned) Object.assign(trips[household.id], { from: turned.from, fromName: turned.place?.name || null, turned: true });
      else trips[household.id].status = 'stuck';
    }
  }
  // The families at their refuge turn home by the game's own rule, as they would have at the word of the victory.
  const refuged = Object.values(copy.households).filter(household => household.flight?.status === 'refuged').map(household => household.id);
  turnHome(copy, null);
  for (const id of refuged) {
    const household = copy.households[id];
    if (household.flight.status !== 'returning') { trips[id].status = 'stuck'; continue; }
    Object.assign(trips[id], { from: copy.map.sites[household.flight.refuge], fromName: siteName(copy, household.flight.refuge) });
  }
  for (const household of Object.values(copy.households)) {
    const trip = trips[household.id];
    if (household.flight?.status === 'returning') {
      const leader = peopleOf(copy, household).find(person => person.travel?.purpose === 'return');
      if (leader) {
        trip.setOutMinute = endMinute;
        trip.mode = leader.travel.mode;
        trip.miles = Math.round(leader.travel.distance - (leader.travel.progress || 0));
        trip.route = thinLine(leader.travel.points, 80);
        trip.progress = Math.round((leader.travel.progress || 0) * 100) / 100;
        trip.from ||= { x: leader.location.x, y: leader.location.y };
        trip.fromName ||= nearestPlace(copy, leader.location)?.name || null;
        trip.who = peopleOf(copy, household).filter(person => person.travel?.purpose === 'return').map(person => person.id);
        // Their route home drawn from where they stood, not from the refuge they left days ago.
        for (const entity of [...household.members, ...(household.property || [])].map(id => copy.entities[id])) if (entity?.travel) delete entity.travel.halted;
      }
    }
    // Somebody apart from the family, free and not serving, walks home on their own: a man let go from the army.
    for (const person of peopleOf(copy, household)) {
      if (!free(person) || person.location?.siteId === household.homeSiteId || trip.who?.includes(person.id)) continue;
      if (person.service?.status === 'serving') { trip.apart.push({ personId: person.id, still: 'army' }); continue; }
      if (person.travel && person.travel.to === household.homeSiteId) { trip.apart.push({ personId: person.id, fromName: nearestPlace(copy, person.location)?.name || null, walking: true }); continue; }
      if (person.travel) continue;
      if (!person.location) continue;
      const at = { x: person.location.x, y: person.location.y };
      const path = findWay(copy, HERE, household.homeSiteId, 'foot', { ferries: false, origin: at });
      if (!path) { trip.apart.push({ personId: person.id, still: 'away' }); continue; }
      person.travel = { from: null, to: household.homeSiteId, points: path.points.map(point => ({ ...point })), progress: 0, distance: path.distance, speed: WALK_SPEED, mode: 'foot', purpose: 'visit', silent: true, ...(path.pace?.length && { pace: path.pace }) };
      person.task = 'travel';
      trip.apart.push({ personId: person.id, fromName: nearestPlace(copy, at)?.name || null, walking: true, route: thinLine(path.points, 40) });
    }
    for (const person of peopleOf(copy, household)) if (person.health?.condition === 'captured') trip.apart.push({ personId: person.id, still: 'prisoner', war: person.service?.status === 'captured' });
  }
  const walking = () => Object.values(copy.households).some(household => household.flight?.status === 'returning' || trips[household.id].apart.some(one => one.walking && !one.arrivedMinute));
  const family = new Set(Object.values(copy.households).flatMap(household => [...household.members, ...(household.property || [])]));
  for (let step = 0; step < HOME_DAYS_CAP * 1440 / HOME_STEP_MINUTES && walking(); step++) {
    withCalendarStep(copy, HOME_STEP_MINUTES, () => {
      copy.tick++; copy.minute += HOME_STEP_MINUTES;
      for (const id of family) { const entity = copy.entities[id]; if (entity?.travel) progressTravel(copy, entity); }
      // The road home rolls no sickness (the ceiling above): the day is marked as already rolled for every family.
      const day = Math.floor(copy.minute / 1440);
      for (const household of Object.values(copy.households)) if (household.flight) household.flight.sickDay = day;
      advanceFlight(copy, HOME_STEP_MINUTES);
      for (const household of Object.values(copy.households)) {
        for (const one of trips[household.id].apart) {
          if (!one.walking || one.arrivedMinute) continue;
          const person = copy.entities[one.personId];
          if (person.location?.siteId === household.homeSiteId && !person.travel) one.arrivedMinute = copy.minute;
        }
      }
    });
  }
  for (const household of Object.values(copy.households)) {
    const trip = trips[household.id], flight = household.flight;
    if (trip.status === 'trip') trip.arrivedMinute = flight?.status === 'home' ? flight.homeMinute : null;
    // What the family found, in the game's own words: every line the copy's road home wrote for it.
    trip.texts = copy.events.slice(start).filter(event => event.householdId === household.id && event.text && event.importance >= 2).map(event => ({ minute: event.minute, text: event.text, claimId: event.claimId || null }));
    trip.house = !household.improvements?.cabin || household.improvements.cabin === 'none' ? (household.house ? 'standing' : 'none') : household.improvements.cabin === 'ruined' ? 'burned' : 'standing';
    trip.burnedBy = flight?.burned ? flight.burnedBy?.hand || 'texian' : null;
    trip.burnedMinute = flight?.burned ?? null;
    trip.herd = household.herd ? { cattle: household.herd.cattle ?? 0, hogs: household.herd.hogs ?? 0 } : null;
    // Whether the family came home with a felling axe to begin again with (owner, 2026-09-29, D9 (a): the tools are in the load, and
    // what was left in a house that burned is gone): the flashback's first logs over the ashes say so.
    trip.axe = toolCount(household, 'axe') > 0;
  }
  return { endMinute, trips };
}

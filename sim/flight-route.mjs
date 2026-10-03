// Where the family goes in the Runaway Scrape, and by which way: its own choice, as a train (docs/SCRAPE.md §11).
//
// Owner, 2026-09-27: "during the runaway scrape, does the player have control over where the family goes? they should. the
// wagon(s), horse(s), etc should all move as a train with the player choosing destination spots. staying on a road is faster,
// but more visible to Mexican troops. vice versa is also true." And the same day: "i still like the choose a destination idea.
// then maybe there's a thin, subtle line as a path for directions that only the player can see?"
//
// Until this the family chose one refuge from a fixed list of five when it left, and went there by the quickest way. Now it
// chooses a destination and stops along the way - any place of the map a family could make for (`FLIGHT_PLACE_KINDS`: the
// towns, the villages and landings, the plantations the columns passed, the named ferries) - and for each stretch whether it
// keeps to the road or goes across country, and can change all of it on the road. The whole family goes as one train
// (sim/company.mjs `setOut`): the wagons, the oxen, the horses, the riders, the walkers and the cow, at the pace of the slowest.
//
// **The road** is the quickest way (sim/ways.mjs `findWay`, as every journey here goes): the map's roads, with a short cut
// across open country where one is quicker. **Across country** keeps off the roads (`COUNTRY_ROAD_COST`): straight lines
// between places over open ground, slower by the ground's own going and the off-road share (sim/ways.mjs `OFF_ROAD`: on foot
// 1.15, on a horse 1.2, a wagon 1.6); a wagon cannot cross timber or brush at all (`WAGON_COVER`), and a big river is crossed
// only at a crossing, by the road there. What the family is seen from is sim/pursuit.mjs `sightMiles`: from further off on a
// road, less across open country, and least in timber.
//
// Stored on `household.flight.route` (`stops`, `ways`, and the later legs' lines for the page's path), and on the journey its
// stretches across country (`travel.offRoad`, miles along it). Every field is absent on a class saved before, whose family is
// making for its one refuge by the road exactly as before - the correct empty value - so no save version moves.
import { findWay, OVERLAND_REACH } from './ways.mjs';
import { HORSE_SPEED, MULE_SPEED, WAGON_SPEED, WALK_SPEED } from './travel.mjs';
import { drawnVehicles, riddenHorses, setOut } from './company.mjs';
import { record } from './events.mjs';
import { cowPace } from './flight-work.mjs';
import { withFamily } from './road.mjs';
// A family leaving before its order, on news it has heard (owner, 2026-09-29, D9 (b)): its route is set as it leaves, with no flight yet.
import { earlyWord } from './early-word.mjs';

/** The kinds of place a family may make for, and the ids of the map's lesser crossings and timber that are not (`flightPlaces`). */
export const FLIGHT_PLACE_KINDS = Object.freeze(['town', 'village', 'landing', 'farmstead', 'ferry', 'bridge']);
/** The named crossings the map marks as fords, which are places all the same (the Atascosito crossing of the Colorado). */
const NAMED_FORDS = Object.freeze(['lower-colorado-crossing']);
/** At most this many stops, the destination among them: a route a student can read at a glance. */
export const MAX_STOPS = 6;
/**
 * A road costs this many times its going to a family keeping off the roads (`FIC-GONZ-660`), so it goes across country
 * wherever there is a way and takes a road only to cross a big river or where the country is shut to it (the wagon in timber).
 */
export const COUNTRY_ROAD_COST = 4;
/** How far a straight line across country may run between two waypoints or places, in miles (`FIC-GONZ-660`). */
export const COUNTRY_REACH = 8;
export const WAYS = Object.freeze(['road', 'country']);
/** The points a leg's line is sent to the page with, at most: the path is a hint, not a survey. */
const LINE_POINTS = 48;

const round = (value, places = 2) => Math.round(value * 10 ** places) / 10 ** places;
const placesMemo = new WeakMap();
/** Every place on this map a family may make for, in the map's order. Memoised on the map. */
export function flightPlaces(map) {
  if (!placesMemo.has(map)) {
    placesMemo.set(map, Object.values(map.sites).filter(site => (FLIGHT_PLACE_KINDS.includes(site.kind) || NAMED_FORDS.includes(site.id))
      && !site.id.startsWith('ford-') && !site.id.startsWith('ferry-')).map(site => site.id));
  }
  return placesMemo.get(map);
}
/** The places a way across country may go through: the family's places and every crossing of a big river. */
const nodesMemo = new WeakMap();
function countryNodes(map) {
  if (!nodesMemo.has(map)) nodesMemo.set(map, [...new Set([...flightPlaces(map), ...Object.values(map.sites).filter(site => ['ferry', 'ford'].includes(site.kind) && site.waterKind !== 'creek' && !site.id.startsWith('ford-')).map(site => site.id)])]);
  return nodesMemo.get(map);
}

/**
 * The waypoints a way across country may go through between two points (`FIC-GONZ-660`): three lanes, the straight line and
 * one `LANE_MILES` either side of it, a point every `STEP_MILES` along each. Named by where they stand, so the lines between
 * them are worked out once for the map (sim/ways.mjs's memo). ceiling: the country is looked at only in this corridor, so a way
 * round a river's bend wider than it is not found (the road is taken there instead, at its cost).
 */
export const LANE_MILES = 4, STEP_MILES = 5;
function waypoints(a, b) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < STEP_MILES) return {};
  const ux = (b.x - a.x) / length, uy = (b.y - a.y) / length, steps = Math.floor(length / STEP_MILES);
  const found = {};
  for (let i = 1; i <= steps; i++) {
    const along = length * i / (steps + 1);
    for (const lane of [-LANE_MILES, 0, LANE_MILES]) {
      const x = round(a.x + ux * along - uy * lane, 1), y = round(a.y + uy * along + ux * lane, 1);
      const id = `@${x},${y}`;
      found[id] = { id, x, y };
    }
  }
  return found;
}
/**
 * Each crossing of a big river in the corridor, as its two banks and the short stretch of road over it between them
 * (`BANK_MILES` either side of the crossing point): how a way across country gets over a river, at its crossing and nowhere
 * else, without taking the whole road from one town to the next. Memoised on the map.
 */
export const BANK_MILES = 0.6;
const banksMemo = new WeakMap();
function allBanks(world) {
  if (banksMemo.has(world.map)) return banksMemo.get(world.map);
  const found = [];
  for (const site of Object.values(world.map.sites)) {
    if (!['ferry', 'ford'].includes(site.kind) || site.waterKind === 'creek' || site.id.startsWith('ford-')) continue;
    const at = site.over || site;
    for (const route of Object.values(world.map.routes)) {
      const along = alongPolyline(route.points, at);
      if (!along || along.off > 0.05) continue;
      const length = polylineLength(route.points);
      const piece = slicePolyline(route.points, Math.max(0, along.at - BANK_MILES), Math.min(length, along.at + BANK_MILES));
      if (piece.length < 2) continue;
      const a = `@bank:${site.id}:a`, b = `@bank:${site.id}:b`;
      found.push({ site: site.id, x: at.x, y: at.y, sites: { [a]: { id: a, ...piece[0] }, [b]: { id: b, ...piece.at(-1) } }, edges: [{ from: a, to: b, points: piece }, { from: b, to: a, points: [...piece].reverse() }] });
      break;
    }
  }
  banksMemo.set(world.map, found);
  return found;
}
function crossingBanks(world, a, b) {
  const near = allBanks(world).filter(one => corridor(a, b, one) <= LANE_MILES * 2);
  return { sites: Object.assign({}, ...near.map(one => one.sites)), edges: near.flatMap(one => one.edges) };
}
/** Where a point lies along a polyline: miles from its start to the nearest point on it, and how far off it the point is. */
function alongPolyline(points, p) {
  let walked = 0, best = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy, length = Math.sqrt(l2);
    const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
    const off = Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
    if (!best || off < best.off) best = { at: walked + length * t, off };
    walked += length;
  }
  return best;
}
/** The piece of a polyline between two distances along it. */
function slicePolyline(points, from, to) {
  const out = [];
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    const lerp = d => ({ x: round(a.x + (b.x - a.x) * ((d - walked) / (length || 1)), 4), y: round(a.y + (b.y - a.y) * ((d - walked) / (length || 1)), 4) });
    if (!out.length && walked + length >= from) out.push(lerp(from));
    if (out.length && walked + length >= to) { out.push(lerp(to)); break; }
    if (out.length) out.push({ x: b.x, y: b.y });
    walked += length;
  }
  return out;
}
const polylineLength = points => points.slice(1).reduce((sum, b, i) => sum + Math.hypot(b.x - points[i].x, b.y - points[i].y), 0);

/** How far a point lies from the straight line between two others (beyond its ends, from the nearer end). */
function corridor(a, b, p) {
  if (!p) return Infinity;
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
}

/** How the family goes now: with the wagon while a wagon and an ox are with it, else on foot. */
export function trainMode(world, household) {
  const { beasts } = withFamily(world, household);
  return drawnVehicles(beasts).length ? 'wagon' : 'foot';
}

/**
 * The stretches of the road the family is on, from the point it stands at, on to the place its stretch ends at and back to the
 * place it began at, each with its own going: how a family changing its route mid-road can go on or turn back along the road.
 */
function roadFrom(world, travel) {
  if (!travel?.points?.length) return [];
  let walked = 0, k = 0;
  for (let i = 1; i < travel.points.length; i++) {
    const length = Math.hypot(travel.points[i].x - travel.points[i - 1].x, travel.points[i].y - travel.points[i - 1].y);
    if (walked + length >= travel.progress) { k = i - 1; break; }
    walked += length; k = i - 1;
  }
  const a = travel.points[k], b = travel.points[k + 1] || a, length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const f = Math.max(0, Math.min(1, (travel.progress - walked) / length));
  const here = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  const slow = new Map(travel.pace || []);
  const across = (travel.offRoad || []).some(([from, to]) => travel.progress >= from - 1e-6 && travel.progress <= to + 1e-6);
  const edges = [];
  if (world.map.sites[travel.to]) {
    const points = [here, ...travel.points.slice(k + 1)];
    edges.push({ to: travel.to, points, pace: [...slow].filter(([i]) => i >= k).map(([i, factor]) => [i - k, factor]), across });
  }
  if (world.map.sites[travel.from]) {
    const points = [here, ...travel.points.slice(0, k + 1).reverse()];
    edges.push({ to: travel.from, points, pace: [...slow].filter(([i]) => i <= k).map(([i, factor]) => [k - i, factor]), across });
  }
  return edges;
}

/**
 * One leg of the family's way, from a place or from where it stands on the road, to a place, by the road or across country,
 * for a train going this way (`wagon` or `foot`). Null where there is no such way: a wagon cannot go across country through
 * timber, and nobody crosses a big river but at a crossing.
 */
export function planLeg(world, from, toSiteId, way, mode, travel = null) {
  const fromId = from.siteId || '@here';
  const origin = from.siteId ? null : { x: from.x, y: from.y };
  const options = { ferries: false, ...(origin && { origin, originEdges: roadFrom(world, travel) }) };
  if (way === 'country') {
    const to = world.map.sites[toSiteId], start = from.siteId ? world.map.sites[from.siteId] : from;
    const lattice = waypoints(start, to);
    const near = countryNodes(world.map).filter(id => corridor(start, to, world.map.sites[id]) <= LANE_MILES * 1.5);
    const banks = crossingBanks(world, start, to);
    Object.assign(options, { roadCost: COUNTRY_ROAD_COST, acrossAll: true, acrossReach: COUNTRY_REACH, acrossNodes: [...near, ...Object.keys(lattice), ...Object.keys(banks.sites)], extraSites: { ...lattice, ...banks.sites }, extraEdges: banks.edges });
  }
  const path = findWay(world, fromId, toSiteId, mode, options);
  if (!path) return null;
  return path;
}

/** Why this route cannot be set, or null. `stops` are place ids, the last the destination; `ways` one for each. */
export function routeRefusal(world, household, { stops, ways } = {}) {
  const flight = household.flight;
  if (!flight ? !earlyWord(world, household) : !['fled', 'refuged', 'ordered', 'stayed'].includes(flight.status)) return 'The family is not on the road east.';
  if (!Array.isArray(stops) || !stops.length) return 'Choose where the family will make for.';
  if (stops.length > MAX_STOPS) return `At most ${MAX_STOPS} stops.`;
  if (!Array.isArray(ways) || ways.length !== stops.length || ways.some(way => !WAYS.includes(way))) return 'Say for each stretch whether the family keeps to the road or goes across country.';
  const places = new Set(flightPlaces(world.map));
  for (const id of stops) if (!places.has(id)) return 'That is not a place the family can make for.';
  if (stops.some((id, i) => i > 0 && id === stops[i - 1])) return 'The same place twice in a row.';
  if (flight?.bog) return 'The wagon is fast in the mud; free it first.';
  if (flight?.chase?.phase === 'caught' || flight?.chase?.halted) return 'The soldiers have the family.';
  return null;
}

/**
 * Plans every leg of a route for the train as it goes now, or says why it cannot be done. From where the family stands:
 * its refuge, its home (leaving), or the point on the road.
 */
export function planRoute(world, household, { stops, ways }, { mode = trainMode(world, household), from = null } = {}) {
  const flight = household.flight;
  const leader = withFamily(world, household).people.find(one => one.travel) || null;
  const start = from || (flight?.status === 'refuged' ? { siteId: flight.refuge } : leader?.travel ? { x: leader.location.x, y: leader.location.y } : { siteId: household.homeSiteId });
  const legs = [];
  let at = start;
  for (let i = 0; i < stops.length; i++) {
    if (at.siteId === stops[i]) return { why: `The family is at ${world.map.sites[stops[i]].name} already.` };
    const path = planLeg(world, at, stops[i], ways[i], mode, i === 0 && !at.siteId ? leader?.travel : null);
    if (!path) {
      const name = world.map.sites[stops[i]].name;
      return { why: ways[i] === 'country' && mode === 'wagon' ? `The wagon cannot go across country to ${name}: there is timber or brush in the way. Keep to the road, or leave the wagon.` : `There is no way to ${name} from there${ways[i] === 'country' ? ' across country' : ''}.` };
    }
    legs.push(path);
    at = { siteId: stops[i] };
  }
  return { legs, start };
}

/**
 * A new way from a point on a journey, with the journey's own road so far in front of it: its points from where it set out to
 * the point, their going and their stretches across country, then the new way's, and `progress` at the point.
 */
function withPrefix(travel, path) {
  let walked = 0, k = 0;
  for (let i = 1; i < travel.points.length; i++) {
    const length = Math.hypot(travel.points[i].x - travel.points[i - 1].x, travel.points[i].y - travel.points[i - 1].y);
    k = i - 1;
    if (walked + length >= travel.progress) break;
    walked += length;
  }
  const here = path.points[0];
  const prefix = [...travel.points.slice(0, k + 1), { x: here.x, y: here.y }];
  const done = prefix.length - 1;
  const points = [...prefix, ...path.points.slice(1)];
  const pace = [...(travel.pace || []).filter(([i]) => i <= k).map(run => [...run]), ...(path.pace || []).map(([i, f]) => [i + done, f])];
  const progress = prefix.slice(1).reduce((sum, b, i) => sum + Math.hypot(b.x - prefix[i].x, b.y - prefix[i].y), 0);
  const offRoad = [...(travel.offRoad || []).filter(([a]) => a < progress).map(([a, b]) => [a, Math.min(b, progress)]), ...(path.offRoad || []).map(([a, b]) => [round(a + progress, 3), round(b + progress, 3)])];
  const distance = points.slice(1).reduce((sum, b, i) => sum + Math.hypot(b.x - points[i].x, b.y - points[i].y), 0);
  return { ...path, points, pace, distance, progress, ...(offRoad.length && { offRoad }) };
}
const pointOn = (points, at) => {
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const length = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (walked + length >= at) { const f = length ? (at - walked) / length : 0; return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * f, y: points[i - 1].y + (points[i].y - points[i - 1].y) * f }; }
    walked += length;
  }
  return { ...points.at(-1) };
};

/** A leg's line thinned to at most `LINE_POINTS` points, for the page: the path is a hint drawn under the figures. */
export function thinLine(points, most = LINE_POINTS) {
  if (points.length <= most) return points.map(point => ({ x: round(point.x, 3), y: round(point.y, 3) }));
  const step = (points.length - 1) / (most - 1);
  return Array.from({ length: most }, (_, i) => points[Math.round(i * step)]).map(point => ({ x: round(point.x, 3), y: round(point.y, 3) }));
}

/** The journey of every one of the train on one leg, as one company (sim/company.mjs), from `from` (a place id, for the record). */
export function setOutOnLeg(world, household, path, { from, to, way, causeId, train = withFamily(world, household) }) {
  const { people: goers, beasts: with_ } = train;
  const vehicles = drawnVehicles(with_);
  const mode = vehicles.length ? 'wagon' : 'foot';
  const journey = () => ({ from, to, points: path.points.map(point => ({ ...point })), progress: 0, distance: path.distance, speed: mode === 'wagon' ? WAGON_SPEED : WALK_SPEED, mode, purpose: 'flee', silent: true, causeId, ...(path.pace?.length && { pace: path.pace.map(run => [...run]) }), ...(path.offRoad?.length && { offRoad: path.offRoad.map(run => [...run]) }), ...(way === 'country' && { way: 'country' }) });
  const movers = [...goers, ...with_];
  if (world.meansRoll) setOut(movers, vehicles, journey, riddenHorses(world, movers));
  for (const entity of movers) {
    entity.chore = null;
    if (!world.meansRoll) entity.travel = journey();
    entity.location = { ...path.points[0], siteId: null };
    if (entity.kind === 'person') entity.task = 'travel';
    if (entity.kind === 'wagon') entity.laden = true;
    if (entity.kind !== 'person') entity.borrowedBy = goers[0]?.id || null;
  }
  household.flight.mode = mode;
  mountedPace(world, movers);
  // With the milk cow along and no wagon, the family goes at her pace (sim/flight-work.mjs `cowPace`).
  cowPace(world, household);
  return mode;
}

/**
 * A family with no wagon whose every one rides (a horse each, a baby in arms) goes at a horse's pace, `HORSE_SPEED`, not a
 * walker's (owner, 2026-09-27: "the wagon(s), horse(s), etc should all move as a train"; a train goes at its slowest, so this
 * only when nobody walks). sim/company.mjs keeps every family without a vehicle at a walker's pace at most, for every other
 * journey; this is the flight's own. Returns whether it did.
 */
export function mountedPace(world, movers) {
  const people = movers.filter(one => one.kind === 'person' && one.travel);
  if (!people.length || people.some(one => one.travel.mode === 'wagon') || !people.every(one => one.travel.saddle || one.travel.carried)) return false;
  // Somebody on a mule (2026-10-03, sim/beasts.mjs): the train goes at the mule's walk, its slowest.
  const onMule = people.some(one => one.travel.saddle && movers.find(beast => beast.id === one.travel.rides)?.species === 'mule');
  for (const one of movers) if (one.travel) one.travel.speed = onMule ? MULE_SPEED : HORSE_SPEED;
  return true;
}

/**
 * The family sets out on the route it chose: from its refuge, or from where it stands on the road, turning at once. The later
 * legs' lines are kept for the page's path (`flight.route.lines`); each leg is planned again from its stop when it is reached,
 * by the train as it is then.
 */
export function setRoute(world, household, input, how = 'answered') {
  const why = routeRefusal(world, household, input);
  if (why) throw new Error(why);
  if (!['fled', 'refuged'].includes(household.flight.status)) throw new Error('The family has not left yet; choose where it goes as it leaves.');
  const planned = planRoute(world, household, input);
  if (planned.why) throw new Error(planned.why);
  const flight = household.flight;
  const { people: goers } = withFamily(world, household);
  if (!goers.length) throw new Error('Nobody of the family is with it to go.');
  const leader = goers.find(one => one.travel);
  const fromId = flight.status === 'refuged' ? flight.refuge : leader?.travel?.from || flight.refuge;
  const stops = [...input.stops], ways = [...input.ways];
  const names = stops.map(id => world.map.sites[id].name);
  const text = `The family ${flight.status === 'refuged' ? `broke camp at ${world.map.sites[flight.refuge].name} and set out` : 'turned on the road'} for ${names.at(-1)}${names.length > 1 ? `, by way of ${names.slice(0, -1).join(' and ')}` : ''}, ${ways[0] === 'country' ? 'across country, keeping off the roads' : 'by the road'}.`;
  const causeId = record(world, 'choice', { householdId: household.id, decision: 'flight-route', importance: how === 'answered' ? 2 : 1, claimId: 'FIC-GONZ-660', text });
  // Who goes, taken before the family is marked on the road (sim/road.mjs `withFamily` reads the camp or the road by it).
  const train = withFamily(world, household);
  if (flight.status === 'refuged') { flight.crossed = [flight.refuge]; flight.leftMinute = world.minute; delete flight.arrivedMinute; delete flight.danger; }
  // A family that leaves the queue at a crossing goes; if the new way comes back to it, it waits its turn again.
  delete flight.crossing;
  flight.status = 'fled';
  flight.refuge = stops.at(-1);
  flight.route = { stops, ways, lines: planned.legs.slice(1).map(leg => thinLine(leg.points)) };
  // Turning on the road: the way already come is kept in front of the new one, so the journey still begins at the place it
  // left and can be turned back along again (`roadFrom`); the family goes on from where it is along it.
  const first = leader?.travel && household.flight.status === 'fled' ? withPrefix(leader.travel, planned.legs[0]) : planned.legs[0];
  setOutOnLeg(world, household, first, { from: fromId, to: stops[0], way: ways[0], causeId, train });
  if (first.progress) for (const one of [...train.people, ...train.beasts]) if (one.travel) { one.travel.progress = first.progress; one.location = { ...pointOn(first.points, first.progress), siteId: null }; }
  if (flight.chase) delete flight.chase.leg;
  return causeId;
}

/**
 * The family has come to a stop on its route (sim/scrape.mjs `advanceFlight`): on to the next, planned from here by the train as
 * it is now. False when it was the last stop, or when there is no way on from here for the train now (a wagon lost since the
 * route was chosen can still walk it; a way that has none at all ends the route here, said in words).
 */
export function nextLeg(world, household) {
  const flight = household.flight, route = flight?.route;
  if (!route || route.stops.length < 2) return false;
  const here = route.stops[0];
  const stops = route.stops.slice(1), ways = route.ways.slice(1);
  const train = trainAt(world, household, here);
  const planned = planRoute(world, household, { stops, ways }, { from: { siteId: here }, mode: drawnVehicles(train.beasts).length ? 'wagon' : 'foot' });
  if (planned.why) {
    record(world, 'consequence', { householdId: household.id, importance: 2, claimId: 'FIC-GONZ-660', text: `The family came to ${world.map.sites[here].name}, and could go no further the way it meant to: ${planned.why}` });
    flight.refuge = here;
    delete flight.route;
    return false;
  }
  const causeId = record(world, 'consequence', { householdId: household.id, importance: 1, claimId: 'FIC-GONZ-660', text: `The family came to ${world.map.sites[here].name} and went on for ${world.map.sites[stops[0]].name}${ways[0] === 'country' ? ', across country' : ', by the road'}.` });
  flight.route = { stops, ways, lines: planned.legs.slice(1).map(leg => thinLine(leg.points)) };
  flight.crossed = [...(flight.crossed || []), here];
  setOutOnLeg(world, household, planned.legs[0], { from: here, to: stops[0], way: ways[0], causeId, train });
  return true;
}

/** The family's people and beasts standing at a place together: the train as it came in to a stop on its route. */
const GONE = ['dead', 'captured'];
export function trainAt(world, household, siteId) {
  const here = one => !one.travel && one.location?.siteId === siteId;
  const people = household.members.map(id => world.entities[id]).filter(one => one?.kind === 'person' && !GONE.includes(one.health?.condition) && one.service?.status !== 'serving' && here(one));
  const beasts = (household.property || []).map(id => world.entities[id]).filter(one => one && one.kind !== 'person' && !['taken', 'lost', 'dead'].includes(one.condition) && here(one));
  return { people, beasts };
}

/** Whether a point of a journey is on a stretch across country (`travel.offRoad`). */
export const acrossCountry = travel => Boolean(travel) && (travel.offRoad || []).some(([from, to]) => travel.progress >= from - 1e-6 && travel.progress <= to + 1e-6);

/**
 * The family's route as its own page is shown it (never another family's, never the Host's; owner 2026-09-27: "a thin,
 * subtle line as a path for directions that only the player can see"): each stop with its way, the next stop and how far,
 * and the line from where the train is now through every stop to the destination.
 */
export function routeProjection(world, household) {
  const flight = household.flight;
  if (!flight || !['fled', 'refuged'].includes(flight.status)) return null;
  const leader = withFamily(world, household).people.find(one => one.travel?.purpose === 'flee');
  const stops = flight.route?.stops || [flight.refuge];
  const ways = flight.route?.ways || stops.map(() => 'road');
  const out = { stops: stops.map((id, i) => ({ id, name: world.map.sites[id]?.name || id, way: ways[i] })) };
  if (flight.status === 'fled' && leader?.travel) {
    const travel = leader.travel;
    // What is left of the leg the train is on: from where it stands to the next stop.
    let walked = 0; const left = [{ x: leader.location.x, y: leader.location.y }];
    for (let i = 1; i < travel.points.length; i++) {
      walked += Math.hypot(travel.points[i].x - travel.points[i - 1].x, travel.points[i].y - travel.points[i - 1].y);
      if (walked > travel.progress) left.push(travel.points[i]);
    }
    out.next = { id: travel.to, name: world.map.sites[travel.to]?.name, miles: Math.round(Math.max(0, travel.distance - travel.progress) * 10) / 10 };
    out.line = [thinLine(left), ...(flight.route?.lines || [])];
    out.mph = round(travel.speed * 3, 1);
    out.way = acrossCountry(travel) ? 'country' : 'road';
  }
  return out;
}

/** A saved route that cannot be, or null. */
export function routeInvalid(world, household) {
  const route = household.flight?.route;
  if (route === undefined) return null;
  if (!route || !Array.isArray(route.stops) || !route.stops.length || !Array.isArray(route.ways) || route.ways.length !== route.stops.length) return 'Invalid route';
  if (route.stops.some(id => !world.map.sites[id]) || route.ways.some(way => !WAYS.includes(way))) return 'Invalid route';
  if (route.lines !== undefined && (!Array.isArray(route.lines) || route.lines.some(line => !Array.isArray(line) || line.some(point => !Number.isFinite(point?.x) || !Number.isFinite(point?.y))))) return 'Invalid route';
  return null;
}

export { OVERLAND_REACH };

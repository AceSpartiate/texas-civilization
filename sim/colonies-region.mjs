// A world's map on the real land of the settled colonies: docs/COLONIES.md §5.1–5.2, build steps 1 and 2.
//
// The same shape `buildGonzalesRegion` returns (sites, routes, terrain features, relief, bounds), so the
// directors, travel and the renderer read it unchanged. The places, roads and crossings come from the built
// colonies map (sim/colonies-map.mjs); heights and watercourses from the real terrain (sim/terrain-data.mjs).
//
// Step 2: a class's families are dealt to the colony settlements (one at Gonzales and one at Liberty, the rest by
// 1834 population) and each is given land within a few miles of its settlement, by a named watercourse, on dry and
// reasonably level ground, with a track to a road it can reach without crossing a big river. Every number in that
// sentence is FIC-GONZ-027.
//
// The country drawn zoomed out is the real land's (sim/province.mjs, docs/MAP_ACCURACY.md), sent with the map rather
// than saved. ceiling: the home country the relief is drawn over spans the whole class, which at thirty families is
// most of the colonies, so its relief is coarse.
import { LEAGUE_MILES, findPath, polylineLength } from './geography.mjs';
import { coloniesMap, BARRIER_RIVERS, dealCounts } from './colonies-map.mjs';
import { realTerrain } from './terrain-data.mjs';
import { groundAlong, layLane } from './ground.mjs';
import { sampleReliefGrid } from './terrain.mjs';
import { WOODS_SOURCE } from './woods.mjs';
import { coloniesProvince } from './province.mjs';

const round = value => { const fixed = +value.toFixed(2); return fixed === 0 ? 0 : fixed; };
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inBox = (point, box) => point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;
function segmentsCross(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}
const segmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
};

/** How far from its settlement a family's land lies, in miles (FIC-GONZ-027). */
export const LAND_FROM_TOWN = Object.freeze({ nearest: 2, farthest: 12 });
/** How close to a named watercourse a homestead stands (HIST-GONZ-009: settlers took the rivers and creeks). */
export const WATER_WITHIN = 0.5;
/** The longest way by road from a family's land to its own settlement, in miles (FIC-GONZ-027). */
export const ROAD_TO_TOWN = 30;
/** The steepest ground a house is set on, as rise over run across an eighth of a mile (FIC-GONZ-027). */
export const STEEPEST = 0.06;
/** How far round each settlement its watercourses and timber are kept on the saved map. */
export const KEPT_ROUND_SETTLEMENT = 13;
/** How far round a ford a creek is kept on the saved map, wherever the ford is (docs/MAP_ACCURACY.md §10). */
export const CREEK_AT_CROSSING = 2;

/** Segments with their boxes, bucketed on a one-mile grid, so "what water is near here" is cheap. */
function segmentIndex(courses) {
  const buckets = new Map();
  const key = (cx, cy) => `${cx},${cy}`;
  for (const course of courses) {
    for (let i = 1; i < course.points.length; i++) {
      const a = course.points[i - 1], b = course.points[i];
      const segment = { a, b, course };
      for (let cx = Math.floor(Math.min(a.x, b.x)); cx <= Math.floor(Math.max(a.x, b.x)); cx++) {
        for (let cy = Math.floor(Math.min(a.y, b.y)); cy <= Math.floor(Math.max(a.y, b.y)); cy++) {
          if (!buckets.has(key(cx, cy))) buckets.set(key(cx, cy), []);
          buckets.get(key(cx, cy)).push(segment);
        }
      }
    }
  }
  const near = (point, reach) => {
    const found = new Set();
    for (let cx = Math.floor(point.x - reach); cx <= Math.floor(point.x + reach); cx++) {
      for (let cy = Math.floor(point.y - reach); cy <= Math.floor(point.y + reach); cy++) {
        for (const segment of buckets.get(key(cx, cy)) || []) found.add(segment);
      }
    }
    return [...found];
  };
  return {
    distanceTo: (point, reach = 1) => near(point, reach).reduce((best, s) => Math.min(best, segmentDistance(point, s.a, s.b)), Infinity),
    crosses: (from, to) => {
      const reach = distance(from, to) / 2 + 1, middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      return near(middle, reach).some(s => segmentsCross(from, to, s.a, s.b));
    },
  };
}

/** How far a mouth may be carried to reach the course it runs into (FIC-GONZ-027). */
export const JOIN_MILES = 0.25;
/** The point on a segment nearest another point, and how far off it is. */
const nearestOnSegment = (q, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / length)) : 0;
  const x = a.x + dx * t, y = a.y + dy * t;
  return { x, y, distance: Math.hypot(q.x - x, q.y - y) };
};
/**
 * A creek's mouth reaches the river it runs into.
 *
 * The courses are digitised one at a time, so a tributary's last point sits a hundred feet or so
 * off the line of the river it joins - invisible while water was a thin stroke, and an obvious
 * broken join once it is drawn at its true width. The mouth is carried the last few yards onto the
 * course it meets, which states a confluence the source data already implies rather than inventing
 * one, and nothing is carried further than `JOIN_MILES`.
 *
 * **Never an end that was cut.** A course leaving the kept country round a settlement is cut where
 * it crosses that edge, and the map writes that down as it is made (`cut`). Such an end is not a
 * mouth: the course carries on into country this map does not keep, and joining it to whatever
 * happens to run past would state a confluence nobody surveyed.
 *
 * Called last in the build, after every draw the seed makes: joining a mouth adds a point to a
 * course, the timber band along it is jittered per point, and a single extra draw there would
 * shift every random number after it - dealing a different class from the same seed for the sake
 * of a few yards of water.
 */
export function joinMouths(courses, within = JOIN_MILES) {
  let joined = 0;
  for (const course of courses) {
    for (const end of [0, course.points.length - 1]) {
      if (course.cut?.includes(end === 0 ? 'start' : 'end')) continue;
      const point = course.points[end];
      let best = null;
      for (const other of courses) {
        if (other === course) continue;
        for (let i = 1; i < other.points.length; i++) {
          const near = nearestOnSegment(point, other.points[i - 1], other.points[i]);
          if (near.distance < within && (!best || near.distance < best.distance)) best = near;
        }
      }
      if (!best || best.distance < 1e-9) continue;
      if (end === 0) course.points.unshift({ x: best.x, y: best.y });
      else course.points.push({ x: best.x, y: best.y });
      joined++;
    }
  }
  return joined;
}

/** A built place as a class's map carries it (also how sim/south.mjs brings the south into a class saved before it). */
export function siteOfPlace(place) {
  return { id: place.id, name: place.name, kind: place.kind, x: place.x, y: place.y, claimId: place.claimId, ...(place.start && { start: true }), ...(place.settlementId && { settlementId: place.settlementId }),
    // A crossing (docs/MAP_ACCURACY.md §10): the water it is over (null for open water), which way it lies across it, whether
    // the word and the fleeing families stop there (`stage`), and where its road meets the water when it stands off it (`over`).
    ...(place.water !== undefined && { water: place.water, waterKind: place.waterKind, across: place.across, ...(place.span && { span: place.span }), ...(place.oblique && { oblique: place.oblique }) }),
    ...(place.stage && { stage: true }), ...(place.over && { over: { x: place.over.x, y: place.over.y } }),
    // A place of the country outside the box, drawn and never walked to (sim/colonies-map.mjs `walked`).
    ...(place.outside && { outside: true }) };
}
/** A built road as a class's map carries it. */
export function routeOfRoad(road) {
  const id = `route-${road.from}-${road.to}`;
  return { id, from: road.from, to: road.to, kind: road.kind, name: road.name, points: road.points.map(p => ({ x: p.x, y: p.y })) };
}
/**
 * A drawn creek's runs inside some boxes, as a class's map keeps them (`cut` naming the ends that carry on past a box). The
 * same rule as the creeks kept round a ford below; no random number is drawn.
 */
export function creekRuns(course, inKept) {
  const runs = [[]], cuts = [new Set()];
  course.points.forEach((p, i) => {
    if (inKept(p)) { if (!runs.at(-1).length && i > 0) cuts.at(-1).add('start'); runs.at(-1).push(p); }
    else if (runs.at(-1).length) { cuts.at(-1).add('end'); runs.push([]); cuts.push(new Set()); }
  });
  return runs.map((points, i) => ({ points, cut: cuts[i] })).filter(run => run.points.length >= 2);
}

export function buildColoniesRegion(random, playerCount) {
  const built = coloniesMap();
  const land = realTerrain();
  const sites = {}, routes = {}, terrain = [];

  for (const place of Object.values(built.places)) sites[place.id] = siteOfPlace(place);
  for (const road of built.roads) { const route = routeOfRoad(road); routes[route.id] = route; }

  // Who goes where: the counts, then which family, shuffled by the seed.
  const counts = dealCounts(playerCount);
  const seats = Object.entries(counts).flatMap(([id, count]) => Array(count).fill(id));
  for (let i = seats.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [seats[i], seats[j]] = [seats[j], seats[i]]; }
  const settled = [...new Set(seats)];

  const named = built.watercourses.filter(course => course.name);
  const water = segmentIndex(named);
  const barriers = segmentIndex(built.watercourses.filter(course => BARRIER_RIVERS.includes(course.name)));
  const towns = Object.values(sites).filter(site => site.kind === 'town');

  /** The nearest point of a road this spot can reach in a straight line without crossing a big river, or null. */
  const nearestReachable = spot => {
    const vertices = [];
    for (const route of Object.values(routes)) {
      if (!['road', 'bank', 'track'].includes(route.kind) || route.to.startsWith('home-')) continue;
      route.points.forEach((point, vertex) => { const d = distance(point, spot); if (d < 15) vertices.push({ d, routeId: route.id, vertex, point }); });
    }
    vertices.sort((a, b) => a.d - b.d);
    // A road split for an earlier family's track has its junction twice; look past repeats, not just the nearest few.
    const seen = new Set();
    const distinct = vertices.filter(v => { const key = `${v.point.x},${v.point.y}`; if (seen.has(key)) return false; seen.add(key); return true; });
    // Not only clear in a straight line: the lane actually laid from it must not wade a big river either. A join across a
    // meander was found at Liberty on 2026-09-19, where the lane over the easiest ground crossed the Trinity and back, and
    // the family could then not choose its own house site ("No wagon can be brought to that spot").
    return distinct.slice(0, 200).find(v => !barriers.crosses(spot, v.point) && laneClear(v.point, spot)) || null;
  };
  /** Whether a wagon lane can be laid between these two without crossing a big river. */
  const laneClear = (from, to) => {
    const lane = layLane(from, to, 'biomes');
    return Boolean(lane) && lane.slice(1).every((point, i) => !barriers.crosses(lane[i], point));
  };
  const level = point => {
    const step = 0.0625, run = 2 * step * 1609.344;
    const dx = land.heightAt(point.x + step, point.y) - land.heightAt(point.x - step, point.y);
    const dy = land.heightAt(point.x, point.y + step) - land.heightAt(point.x, point.y - step);
    return Math.hypot(dx, dy) / run <= STEEPEST;
  };
  /** Road miles from a spot to its settlement by its nearest reachable road: the track, along the road either way, then the network. */
  const roadMilesToTown = (spot, settlement) => {
    const best = nearestReachable(spot);
    if (!best) return Infinity;
    const route = routes[best.routeId], graph = { sites, routes };
    const toStart = polylineLength(route.points.slice(0, best.vertex + 1)), toEnd = polylineLength(route.points.slice(best.vertex));
    const via = (end, along) => end === settlement.id ? along : (findPath(graph, end, settlement.id)?.distance ?? Infinity) + along;
    return best.d + Math.min(via(route.from, toStart), via(route.to, toEnd));
  };
  const fit = (candidate, settlement, placed, separation) => {
    const at = { x: round(candidate.x), y: round(candidate.y) };
    const fromTown = distance(at, settlement);
    return fromTown >= LAND_FROM_TOWN.nearest && fromTown <= LAND_FROM_TOWN.farthest
      && !placed.some(other => distance(other, at) < separation)
      && towns.every(town => distance(town, at) > 1.2)
      && Number.isFinite(land.heightAt(at.x, at.y)) && land.heightAt(at.x, at.y) >= 1
      && barriers.distanceTo(at, 1) > 0.3
      && water.distanceTo(at, 1) <= WATER_WITHIN
      && level(at)
      // On its own settlement's side of the big rivers, in effect: a way to its town by road that is not a journey round the colony.
      && roadMilesToTown(at, settlement) <= ROAD_TO_TOWN;
  };

  // Land for each family near its settlement. League-sized elbow room first, closing up only if a crowded
  // settlement needs it, as the invented map's scatter did.
  let places = null;
  for (let separation = LEAGUE_MILES * 1.15; separation > 0.9 && !places; separation *= 0.92) {
    const placed = [];
    for (const settlementId of seats) {
      const settlement = sites[settlementId];
      let spot = null;
      for (let attempt = 0; attempt < 600 && !spot; attempt++) {
        const angle = random() * Math.PI * 2;
        const reach = LAND_FROM_TOWN.nearest + random() * (LAND_FROM_TOWN.farthest - LAND_FROM_TOWN.nearest);
        const candidate = { x: settlement.x + Math.cos(angle) * reach, y: settlement.y + Math.sin(angle) * reach };
        if (fit(candidate, settlement, placed, separation)) spot = { x: round(candidate.x), y: round(candidate.y), settlementId };
      }
      if (!spot) break;
      placed.push(spot);
    }
    if (placed.length === seats.length) places = placed;
  }
  if (!places) throw new Error('Could not give every family land near its settlement');

  // Each homestead's track runs straight to the nearest point of a road it can reach without crossing a big river
  // (smaller watercourses are waded, as the roads wade them).
  const splitAt = (routeId, vertex, junctionId) => {
    const route = routes[routeId];
    delete routes[routeId];
    const first = { ...route, id: `${routeId}-a`, to: junctionId, points: route.points.slice(0, vertex + 1) };
    const second = { ...route, id: `${routeId}-b`, from: junctionId, points: route.points.slice(vertex) };
    routes[first.id] = first; routes[second.id] = second;
  };
  const homesteads = [];
  places.forEach((place, index) => {
    const home = { id: `home-${index + 1}`, name: `Family ${index + 1} home`, kind: 'homestead', x: place.x, y: place.y, ownerHouseholdId: `hh-${index + 1}`, settlementId: place.settlementId };
    sites[home.id] = home;
    const best = nearestReachable(home);
    if (!best) throw new Error(`${home.id} has no road it can reach`);
    let joinId;
    const route = routes[best.routeId];
    if (best.vertex === 0) joinId = route.from;
    else if (best.vertex === route.points.length - 1) joinId = route.to;
    else {
      joinId = `junction-${index + 1}`;
      sites[joinId] = { id: joinId, name: 'The road', kind: 'junction', x: best.point.x, y: best.point.y };
      splitAt(best.routeId, best.vertex, joinId);
    }
    // The lane in from the road over the easiest ground for a wagon (sim/ground.mjs); straight only if the land offers no way round.
    // The easiest ground is not allowed to wade a big river: `nearestReachable` keeps the join on the family's own bank, but the
    // lane laid between them can still swing across a meander (found 2026-09-19 at Liberty, a lane over the Trinity and back).
    const join = { x: sites[joinId].x, y: sites[joinId].y };
    const laid = layLane(join, home, 'biomes');
    const lane = (laid && laid.slice(1).every((point, i) => !barriers.crosses(laid[i], point)) ? laid : null) || [join, { x: home.x, y: home.y }];
    routes[`route-${joinId}-${home.id}`] = { id: `route-${joinId}-${home.id}`, from: joinId, to: home.id, kind: 'track', points: lane };
    terrain.push({ id: `field-${index + 1}`, kind: 'field', ownerHouseholdId: `hh-${index + 1}`, points: [
      { x: round(home.x + 0.04), y: round(home.y + 0.03) }, { x: round(home.x + 0.29), y: round(home.y + 0.03) },
      { x: round(home.x + 0.29), y: round(home.y + 0.28) }, { x: round(home.x + 0.04), y: round(home.y + 0.28) },
    ] });
    homesteads.push(home);
  });

  // The going off the roads: what lies along every lane, timber track and the bank upriver (sim/ground.mjs). The roads are the easy going.
  // ceiling: a road carries no going, so its climbs and creeks cost nothing; the roads were routed round the worst of both.
  for (const route of Object.values(routes)) if (['track', 'bank'].includes(route.kind)) route.ground = groundAlong(route.points, null, 'biomes');

  // The watercourses round every settlement with families, and round Gonzales where the story is: the rivers block sight
  // and earshot (`blockedByWater`), the creeks and timber are what the country looks like. A course leaving and re-entering
  // a kept area is cut into runs, never joined across the gap.
  const kept = [...new Set([...settled, 'gonzales'])].map(id => {
    const s = sites[id];
    return { minX: s.x - KEPT_ROUND_SETTLEMENT, maxX: s.x + KEPT_ROUND_SETTLEMENT, minY: s.y - KEPT_ROUND_SETTLEMENT, maxY: s.y + KEPT_ROUND_SETTLEMENT };
  });
  const inKept = point => kept.some(box => inBox(point, box));
  // A creek a road fords is kept for CREEK_AT_CROSSING miles round the ford wherever it is, so the ford is never drawn on dry
  // ground (docs/MAP_ACCURACY.md §10). Creeks only: they carry no timber band and draw nothing from the seed.
  const fords = Object.values(sites).filter(site => site.waterKind === 'creek');
  const fordBoxes = fords.map(site => ({ water: site.water, site, minX: site.x - CREEK_AT_CROSSING, maxX: site.x + CREEK_AT_CROSSING, minY: site.y - CREEK_AT_CROSSING, maxY: site.y + CREEK_AT_CROSSING }));
  const courses = [];
  built.watercourses.forEach((course, index) => {
    const own = course.kind === 'creek' ? fordBoxes.filter(box => box.water === course.name) : [];
    const inKept = point => kept.some(box => inBox(point, box)) || own.some(box => inBox(point, box));
    const runs = [[]];
    // Which ends of a run are the course carrying on into country this map does not keep, rather
    // than the course's own head or mouth. A run is cut by dropping the points outside the kept
    // box, so a cut end is the last point *inside* it and can be a good way short of the edge -
    // there is no way to tell one from a real mouth by looking at it afterwards, which is why it
    // is written down here as the map is made. Everything downstream reads this rather than
    // guessing: the join below leaves a cut end open, and a drawn end could be tapered on it.
    const cuts = [new Set()];
    course.points.forEach((p, i) => {
      if (inKept(p)) { if (!runs.at(-1).length && i > 0) cuts.at(-1).add('start'); runs.at(-1).push(p); }
      else if (runs.at(-1).length) { cuts.at(-1).add('end'); runs.push([]); cuts.push(new Set()); }
    });
    const emitted = runs.map((points, i) => ({ points, cut: cuts[i] })).filter(run => run.points.length >= 2);
    emitted.forEach(({ points, cut }, part) => {
      // ceiling: a creek under five miles is left off the saved map, which every save carries whole; drawing every creek
      // from the served colonies map is the way out.
      // A run a ford is on is kept whatever its length.
      const forded = own.some(box => points.slice(1).some((p, i) => segmentDistance(box.site, points[i], p) < 0.1));
      if (course.kind === 'creek' && polylineLength(points) < 5 && !forded) return;
      const feature = { id: `water-${index}-${part}`, kind: course.kind, name: course.name, points, ...(cut.size && { cut: [...cut] }) };
      terrain.push(feature);
      courses.push(feature);
    });
  });
  // Timber follows the water (HIST-GONZ-012): a band along each river and longer creek, jittered so it reads as woodland.
  for (const course of courses) {
    // ceiling: only the rivers carry a timber band on the saved map; creeks' timber is not drawn yet.
    if (course.kind === 'creek') continue;
    const width = course.kind === 'river' ? 1.0 : 0.5;
    const left = [], right = [];
    course.points.forEach((point, index) => {
      const previous = course.points[Math.max(0, index - 1)], next = course.points[Math.min(course.points.length - 1, index + 1)];
      const dx = next.x - previous.x, dy = next.y - previous.y, length = Math.hypot(dx, dy) || 1;
      const spread = width * (0.65 + random() * 0.7);
      left.push({ x: round(point.x - (dy / length) * spread), y: round(point.y + (dx / length) * spread) });
      right.unshift({ x: round(point.x + (dy / length) * spread), y: round(point.y - (dx / length) * spread) });
    });
    terrain.push({ id: `timber-${course.id}`, kind: 'woods', points: [...left, ...right] });
  }
  for (const id of [...new Set([...settled, 'gonzales'])]) {
    const town = sites[id];
    terrain.push({ id: id === 'gonzales' ? 'town-commons' : `town-commons-${id}`, kind: 'town', points: [
      { x: round(town.x - 0.42), y: round(town.y - 0.36) }, { x: round(town.x + 0.46), y: round(town.y - 0.36) },
      { x: round(town.x + 0.46), y: round(town.y + 0.4) }, { x: round(town.x - 0.42), y: round(town.y + 0.4) },
    ] });
  }

  // The home country, drawn at the shape of the view: every family and Gonzales.
  joinMouths(courses);

  const xs = [...homesteads, sites.gonzales].map(s => s.x), ys = [...homesteads, sites.gonzales].map(s => s.y);
  const padded = { minX: Math.min(...xs) - 10, maxX: Math.max(...xs) + 10, minY: Math.min(...ys) - 10, maxY: Math.max(...ys) + 10 };
  const aspect = 960 / 540, width = padded.maxX - padded.minX, height = padded.maxY - padded.minY;
  if (width / height < aspect) { const grow = (height * aspect - width) / 2; padded.minX -= grow; padded.maxX += grow; }
  else { const grow = (width / aspect - height) / 2; padded.minY -= grow; padded.maxY += grow; }
  // The Gulf has no height; the relief drawing reads it as the lowest ground there is.
  const relief = sampleReliefGrid({ heightAt: (x, y) => { const h = land.heightAt(x, y); return Number.isFinite(h) ? h : 0; } }, padded, 88);
  return { sites, routes, terrain, homesteads, relief, homeBounds: padded, bounds: coloniesProvince().bounds, source: built.kind, woods: WOODS_SOURCE };
}

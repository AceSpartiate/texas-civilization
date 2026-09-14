// Gonzales-area geography, built from the checked claims in HISTORY.md.
//
// One world unit is one mile. Every coordinate here is invented (FIC-GONZ-002); what is
// anchored is the pattern: the town on the east bank with a contested ford opposite it
// (HIST-GONZ-007, HIST-GONZ-008), the battle site about seven miles upriver of that ford
// (HIST-GONZ-008), homesteads scattered along the watercourses rather than gridded
// (HIST-GONZ-009) and spaced so league-sized holdings do not overlap (HIST-GONZ-010), a
// town of a few dozen buildings (HIST-GONZ-011), and open post oak savannah with timber
// following the water (HIST-GONZ-012).
//
// Do not add a street grid, a name for the ford, a distance to Bexar, or game animals
// beyond buffalo without first adding a checked claim. HISTORY.md lists each of those as
// deliberately not asserted.

import { createRelief, sampleReliefGrid } from './terrain.mjs';
import { buildProvince } from './texas.mjs';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const polylineLength = points => points.slice(1).reduce((sum, p, i) => sum + distance(p, points[i]), 0);

// A league is 4,428.4 acres: 6.92 square miles, about 2.63 miles on a side. Neighbours
// must sit further apart than that or their granted land would overlap.
export const LEAGUE_MILES = 2.63;

export function pointAlong(points, travelled) {
  for (let i = 1; i < points.length; i++) {
    const length = distance(points[i - 1], points[i]);
    if (travelled <= length) {
      const f = length ? travelled / length : 0;
      return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * f, y: points[i - 1].y + (points[i].y - points[i - 1].y) * f };
    }
    travelled -= length;
  }
  return { ...points.at(-1) };
}

// The Guadalupe runs roughly north to south past the town. The San Marcos comes down from
// the north-west and joins it two miles west of Gonzales (HIST-GONZ-015) - the confluence
// the town was placed at. Kerr Creek lies east of the river in the central county
// (HIST-GONZ-016). Courses are invented lines; the arrangement is documented.
function buildWaters(origin) {
  const at = (x, y) => ({ x: origin.x + x, y: origin.y + y });
  // Nearly level to gently rolling country (HIST-GONZ-017): valleys are shallow.
  const river = {
    id: 'guadalupe', kind: 'river', name: 'Guadalupe River', valleyWidth: 2.8, incision: 34,
    points: [at(2.1, -26), at(0.2, -19), at(1.3, -12.5), at(-0.9, -6.2), at(0.0, 0.0),
      at(-2.9, 6.8), at(-1.4, 13.2), at(-4.6, 19.6), at(-2.7, 25.0)],
  };
  // Joins the Guadalupe at the confluence, two miles west of the town.
  const sanMarcos = {
    id: 'san-marcos', kind: 'river', name: 'San Marcos River', valleyWidth: 2.1, incision: 26,
    points: [at(-13.5, -14.0), at(-9.4, -9.2), at(-5.2, -5.4), at(-1.9, -1.9), at(0.0, 0.0)],
  };
  const kerrCreek = {
    id: 'kerr-creek', kind: 'creek', name: 'Kerr Creek', valleyWidth: 1.1, incision: 14,
    points: [at(15.0, -13.5), at(10.4, -10.6), at(6.4, -8.2), at(2.6, -4.4), at(0.6, -1.2)],
  };
  const lowerCreek = {
    id: 'lower-creek', kind: 'creek', valleyWidth: 1.0, incision: 12,
    points: [at(13.2, 17.8), at(9.1, 15.2), at(5.0, 14.6), at(-1.1, 15.6)],
  };
  return { river, sanMarcos, creeks: [kerrCreek, lowerCreek] };
}

// Scatter holdings along the water with league-sized elbow room. Frontage is divided into
// one stratum per household so families spread along the whole valley instead of clumping
// by chance, then jittered and rejected for spacing so the pattern stays irregular. A grid
// would be both wrong and immediately obvious to a student.
export function scatterHomesteads(random, count, courses, bounds, accept = () => true) {
  const lengths = courses.map(course => polylineLength(course.points));
  const frontage = lengths.reduce((sum, length) => sum + length, 0);
  const locate = travelled => {
    let remaining = travelled;
    for (let i = 0; i < courses.length; i++) {
      if (remaining <= lengths[i]) return pointAlong(courses[i].points, remaining);
      remaining -= lengths[i];
    }
    return pointAlong(courses.at(-1).points, lengths.at(-1));
  };
  for (let separation = LEAGUE_MILES * 1.15; separation > 0.9; separation *= 0.92) {
    const placed = [];
    for (let index = 0; index < count; index++) {
      for (let attempt = 0; attempt < 240; attempt++) {
        const anchor = locate(((index + random()) / count) * frontage);
        // Colonists took frontage on the water and ran their land back from it.
        const eastward = random() < 0.78 ? 1 : -1;
        const candidate = { x: anchor.x + eastward * (0.7 + random() * 4.6), y: anchor.y + (random() - 0.5) * 3.2 };
        if (candidate.x < bounds.minX || candidate.x > bounds.maxX || candidate.y < bounds.minY || candidate.y > bounds.maxY) continue;
        if (placed.some(other => distance(other, candidate) < separation)) continue;
        if (!accept(candidate)) continue;
        placed.push(candidate); break;
      }
    }
    if (placed.length === count) return placed;
  }
  throw new Error('Could not place households without overlapping their land grants');
}

export function buildGonzalesRegion(random, playerCount, { origin = { x: 0, y: 0 } } = {}) {
  const sites = {}, routes = {}, terrain = [];
  // -0 round-trips through JSON as 0, which would make a reloaded world unequal.
  const round = value => { const fixed = +value.toFixed(2); return fixed === 0 ? 0 : fixed; };
  const site = (id, name, kind, point, extra = {}) => { sites[id] = { id, name, kind, x: round(point.x), y: round(point.y), ...extra }; return sites[id]; };
  const road = (from, to, points, kind = 'road') => {
    const id = `route-${from}-${to}`;
    routes[id] = { id, from, to, kind, points: points.map(p => ({ x: round(p.x), y: round(p.y) })) };
    return routes[id];
  };

  const { river, sanMarcos, creeks } = buildWaters(origin);
  const waters = [river, sanMarcos, ...creeks];
  // Only set a name when there is one: an undefined key vanishes through JSON and a
  // reloaded world would no longer equal the world that was saved.
  for (const course of waters) terrain.push({ id: course.id, kind: course.kind, ...(course.name && { name: course.name }), points: course.points });

  const town = { x: origin.x + 2.1, y: origin.y + 0.5 };
  const ford = { x: origin.x + 0.05, y: origin.y + 0.35 };
  site('gonzales', 'Gonzales', 'town', town);
  // Named "the ford" because no proper name is documented; see HISTORY.md exclusions.
  site('ford', 'The ford', 'ford', ford);
  const camp = pointAlong(river.points, Math.max(0, polylineLength(river.points.slice(0, 5)) - 7));
  site('williams-camp', "Ezekiel Williams's land", 'camp', { x: camp.x - 1.3, y: camp.y });
  site('confluence', 'The forks of the rivers', 'confluence', { x: origin.x, y: origin.y });

  // A road along the east bank, with the town on it and the ford crossing west.
  const spine = [
    { x: origin.x + 6.5, y: origin.y - 25 }, { x: origin.x + 5.0, y: origin.y - 17 },
    { x: origin.x + 6.2, y: origin.y - 9 }, town,
    { x: origin.x + 2.0, y: origin.y + 8 }, { x: origin.x + 3.4, y: origin.y + 16 },
    { x: origin.x + 1.2, y: origin.y + 24 },
  ];
  const junctions = spine.map((point, index) => index === 3 ? sites.gonzales : site(`road-${index}`, 'The road', 'junction', point));
  for (let i = 1; i < junctions.length; i++) road(junctions[i - 1].id, junctions[i].id, [junctions[i - 1], junctions[i]]);
  // The river is a barrier: the only way across is the ford (HIST-GONZ-007).
  road('gonzales', 'ford', [town, { x: (town.x + ford.x) / 2, y: town.y - 0.2 }, ford], 'crossing');
  road('ford', 'williams-camp', [ford, { x: ford.x - 1.9, y: ford.y - 3.4 }, sites['williams-camp']], 'bank');

  const relief = createRelief({ seed: `${origin.x},${origin.y}`, watercourses: waters, base: 355, relief: 50 });

  // Timber follows the water; open savannah lies between (HIST-GONZ-012). The band is
  // jittered so it reads as woodland rather than a ruled corridor.
  for (const course of waters) {
    const width = course.kind === 'river' ? 1.15 : 0.65;
    const left = [], right = [];
    course.points.forEach((point, index) => {
      const previous = course.points[Math.max(0, index - 1)], next = course.points[Math.min(course.points.length - 1, index + 1)];
      const dx = next.x - previous.x, dy = next.y - previous.y, length = Math.hypot(dx, dy) || 1;
      const spread = width * (0.65 + random() * 0.7);
      left.push({ x: point.x - (dy / length) * spread, y: point.y + (dx / length) * spread });
      right.unshift({ x: point.x + (dy / length) * spread, y: point.y - (dx / length) * spread });
    });
    terrain.push({ id: `timber-${course.id}`, kind: 'woods', points: [...left, ...right] });
  }

  terrain.push({ id: 'town-commons', kind: 'town', points: [
    { x: town.x - 0.42, y: town.y - 0.36 }, { x: town.x + 0.46, y: town.y - 0.36 },
    { x: town.x + 0.46, y: town.y + 0.4 }, { x: town.x - 0.42, y: town.y + 0.4 },
  ] });

  // Two named stands of timber a household can be sent to. Buffalo is the only documented
  // local game (HIST-GONZ-013); anything hunted beyond that is FIC-GONZ-008.
  const upperTimber = site('upper-timber', 'The upper timber', 'woods', { x: origin.x + 4.4, y: origin.y - 15.2 });
  const lowerTimber = site('lower-timber', 'The lower timber', 'woods', { x: origin.x + 2.6, y: origin.y + 14.6 });
  road('road-2', 'upper-timber', [junctions[2], upperTimber], 'track');
  road('road-5', 'lower-timber', [junctions[5], lowerTimber], 'track');

  const bounds = {
    minX: origin.x - 9, maxX: origin.x + 17,
    minY: origin.y - 27, maxY: origin.y + 26,
  };
  const places = scatterHomesteads(random, playerCount, waters, bounds);
  const homesteads = [];
  places.forEach((place, index) => {
    const home = site(`home-${index + 1}`, `Family ${index + 1} home`, 'homestead', place, { ownerHouseholdId: `hh-${index + 1}` });
    const nearest = junctions.reduce((best, node) => distance(node, home) < distance(best, home) ? node : best, junctions[0]);
    road(nearest.id, home.id, [nearest, home], 'track');
    // The ground a family can break for its crop: a quarter mile square, forty acres, beside the house. The first patch is a
    // quarter of it - ten acres - and every clearing adds as much (sim/improvements.mjs). It was a whole labor, which with the
    // figures drawn at their old size filled the holding (owner, 2026-09-14). The size is FIC-GONZ-015.
    terrain.push({ id: `field-${index + 1}`, kind: 'field', ownerHouseholdId: `hh-${index + 1}`, points: [
      { x: home.x + 0.04, y: home.y + 0.03 }, { x: home.x + 0.29, y: home.y + 0.03 },
      { x: home.x + 0.29, y: home.y + 0.28 }, { x: home.x + 0.04, y: home.y + 0.28 },
    ] });
    homesteads.push(home);
  });

  // Widen the modelled country to the shape of the view, so zooming out never shows bare
  // edges where the world simply stops being sampled.
  const padded = { minX: bounds.minX - 7, maxX: bounds.maxX + 7, minY: bounds.minY - 7, maxY: bounds.maxY + 7 };
  const aspect = 960 / 540;
  const width = padded.maxX - padded.minX, height = padded.maxY - padded.minY;
  if (width / height < aspect) {
    const grow = (height * aspect - width) / 2;
    padded.minX -= grow; padded.maxX += grow;
  } else {
    const grow = (width / aspect - height) / 2;
    padded.minY -= grow; padded.maxY += grow;
  }
  const reliefBounds = padded;
  const reliefGrid = sampleReliefGrid(relief, reliefBounds, 88);
  // The home country sits inside the province, in the same coordinate space, so one camera
  // reaches from the whole of Texas down to a single field without changing worlds.
  const province = buildProvince();
  return { sites, routes, terrain, homesteads, relief: reliefGrid, homeBounds: reliefBounds, bounds: province.bounds, province };
}

/**
 * A route's going, with what a family has cut out of its lane taken away (sim/homesite.mjs): the lane is cut from its far end
 * - the house - so the stretches nearest the house lose their timber and brush first, part of a stretch in proportion.
 */
function cutGround(route) {
  if (!(route.cut > 0)) return route.ground;
  const lengths = route.points.slice(1).map((b, i) => Math.hypot(b.x - route.points[i].x, b.y - route.points[i].y));
  let fromHouse = 0;
  const ground = [...route.ground];
  for (let i = lengths.length - 1; i >= 0; i--) {
    const cutHere = Math.max(0, Math.min(lengths[i], route.cut - fromHouse));
    fromHouse += lengths[i];
    if (!cutHere || !ground[i]) continue;
    const left = lengths[i] ? 1 - cutHere / lengths[i] : 0;
    ground[i] = [ground[i][0], ground[i][1] * left, ground[i][2] * left, ground[i][3], ground[i][4]];
  }
  return ground;
}

// The road network is a graph, so crossing the river means going by the ford rather than
// walking over the water. Dijkstra keeps that honest as more places are added.
export function findPath(map, fromSiteId, toSiteId) {
  if (fromSiteId === toSiteId) return null;
  const neighbours = new Map();
  for (const route of Object.values(map.routes)) {
    if (!neighbours.has(route.from)) neighbours.set(route.from, []);
    if (!neighbours.has(route.to)) neighbours.set(route.to, []);
    neighbours.get(route.from).push({ to: route.to, route, forward: true });
    neighbours.get(route.to).push({ to: route.from, route, forward: false });
  }
  const best = new Map([[fromSiteId, { cost: 0, via: null }]]);
  const queue = [fromSiteId];
  while (queue.length) {
    queue.sort((a, b) => best.get(a).cost - best.get(b).cost);
    const current = queue.shift();
    if (current === toSiteId) break;
    for (const edge of neighbours.get(current) || []) {
      const cost = best.get(current).cost + polylineLength(edge.route.points);
      if (!best.has(edge.to) || cost < best.get(edge.to).cost) {
        best.set(edge.to, { cost, via: { from: current, edge } });
        if (!queue.includes(edge.to)) queue.push(edge.to);
      }
    }
  }
  if (!best.has(toSiteId)) return null;
  const legs = [];
  for (let node = toSiteId; best.get(node).via; node = best.get(node).via.from) legs.unshift(best.get(node).via.edge);
  const points = [];
  // What lies along each segment, where a route carries it (sim/ground.mjs): only lanes and tracks on the real land do.
  const ground = [];
  for (const leg of legs) {
    const ordered = leg.forward ? leg.route.points : [...leg.route.points].reverse();
    const along = leg.route.ground && (leg.forward ? cutGround(leg.route) : [...cutGround(leg.route)].reverse().map(g => [-g[0], g[1], g[2], g[3], g[4]]));
    ordered.forEach((point, index) => {
      if (points.length && points.at(-1).x === point.x && points.at(-1).y === point.y) return;
      if (points.length) ground.push(index > 0 ? along?.[index - 1] ?? null : null);
      points.push({ ...point });
    });
  }
  // The places this route runs through, and how far along each one sits. A journey is not
  // only a line: it passes the ford, a fork of the road, somebody's gate. News changing
  // hands needs to name where it changed them, so the nodes come back with the points.
  const nodes = [{ id: fromSiteId, at: 0 }];
  for (const leg of legs) {
    const previous = nodes.at(-1).id;
    nodes.push({ id: leg.route.from === previous ? leg.route.to : leg.route.from, at: nodes.at(-1).at + polylineLength(leg.route.points) });
  }
  return { points, distance: polylineLength(points), routeIds: legs.map(leg => leg.route.id), nodes, ...(ground.some(Boolean) && { ground }) };
}

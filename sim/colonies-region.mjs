// A world's map on the real land of the settled colonies: docs/COLONIES.md §5.2, build step 1.
//
// The same shape `buildGonzalesRegion` returns (sites, routes, terrain features, relief, bounds), so the
// directors, travel and the renderer read it unchanged. The places, roads and crossings come from the built
// colonies map (sim/colonies-map.mjs); heights and watercourses from the real terrain (sim/terrain-data.mjs).
//
// ceiling: step 1 keeps the families where the invented map had them — scattered along the rivers near
// Gonzales — so a class on this map plays the Gonzales chapter it was written for. Dealing them across the
// colonies is step 2 (docs/COLONIES.md §5.1), and replaces the scatter below.
// ceiling: the province drawn when zoomed out is still the invented one of sim/texas.mjs (FIC-GONZ-002); its
// rivers do not lie on the real ones. Step 2, when families live across the colonies, draws the real rivers at
// every scale.
import { LEAGUE_MILES, polylineLength, scatterHomesteads } from './geography.mjs';
import { coloniesMap, BARRIER_RIVERS } from './colonies-map.mjs';
import { realTerrain } from './terrain-data.mjs';
import { sampleReliefGrid } from './terrain.mjs';
import { buildProvince } from './texas.mjs';

const round = value => { const fixed = +value.toFixed(2); return fixed === 0 ? 0 : fixed; };
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inBox = (point, box) => point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;
function segmentsCross(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

/** Where families may live in step 1: the Guadalupe and the San Marcos within this box round Gonzales. */
const HOME_COUNTRY = { minX: -14, maxX: 20, minY: -26, maxY: 26 };

export function buildColoniesRegion(random, playerCount) {
  const built = coloniesMap();
  const land = realTerrain();
  const sites = {}, routes = {}, terrain = [];

  for (const place of Object.values(built.places)) {
    sites[place.id] = { id: place.id, name: place.name, kind: place.kind, x: place.x, y: place.y, claimId: place.claimId, ...(place.start && { start: true }) };
  }
  for (const road of built.roads) {
    const id = `route-${road.from}-${road.to}`;
    routes[id] = { id, from: road.from, to: road.to, kind: road.kind, name: road.name, points: road.points.map(p => ({ x: p.x, y: p.y })) };
  }

  // The rivers and creeks of the home country, for drawing and for what blocks sight and earshot
  // (`blockedByWater` reads the rivers). The whole colonies' watercourses are served to the client on their own.
  const view = { minX: HOME_COUNTRY.minX - 12, maxX: HOME_COUNTRY.maxX + 12, minY: HOME_COUNTRY.minY - 10, maxY: HOME_COUNTRY.maxY + 10 };
  const courses = [];
  // A long river leaves and re-enters the view; cut it into the runs that lie inside, never joining across the gap.
  const runsInside = points => {
    const runs = [[]];
    for (const p of points) { if (inBox(p, view)) runs.at(-1).push(p); else if (runs.at(-1).length) runs.push([]); }
    return runs.filter(run => run.length >= 2);
  };
  built.watercourses.flatMap(course => runsInside(course.points).map(points => ({ ...course, points }))).forEach((course, index) => {
    const inside = course.points;
    // ceiling: a creek under three miles here is left off the saved map, which every save carries whole; the client
    // draws every creek from the served colonies map. None of them block sight (only rivers do).
    if (course.kind === 'creek' && polylineLength(inside) < 3) return;
    const feature = { id: `water-${index}`, kind: course.kind, name: course.name, points: inside };
    terrain.push(feature);
    courses.push(feature);
  });
  // Timber follows the water (HIST-GONZ-012): a band along each watercourse, jittered so it reads as woodland.
  for (const course of courses) {
    if (course.kind === 'creek' && polylineLength(course.points) < 6) continue;
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
  const town = sites.gonzales;
  terrain.push({ id: 'town-commons', kind: 'town', points: [
    { x: round(town.x - 0.42), y: round(town.y - 0.36) }, { x: round(town.x + 0.46), y: round(town.y - 0.36) },
    { x: round(town.x + 0.46), y: round(town.y + 0.4) }, { x: round(town.x - 0.42), y: round(town.y + 0.4) },
  ] });

  // Families along the real Guadalupe and San Marcos near Gonzales (step 1; see the ceiling above).
  const rivers = courses.filter(c => c.name === 'Guadalupe River' || c.name === 'San Marcos River').flatMap(c => {
    const runs = [[]];
    for (const p of c.points) { if (inBox(p, HOME_COUNTRY)) runs.at(-1).push(p); else if (runs.at(-1).length) runs.push([]); }
    return runs.filter(run => run.length >= 2).map(points => ({ ...c, points }));
  });
  const barriers = courses.filter(c => BARRIER_RIVERS.includes(c.name));
  const riverbanks = courses.filter(c => BARRIER_RIVERS.includes(c.name) || c.name === 'San Marcos River');
  // Every big-river segment with its box, so a track can be tested against only the few near it.
  const barrierSegments = barriers.flatMap(course => course.points.slice(1).map((p, i) => {
    const a = course.points[i];
    return { a, b: p, minX: Math.min(a.x, p.x), maxX: Math.max(a.x, p.x), minY: Math.min(a.y, p.y), maxY: Math.max(a.y, p.y) };
  }));
  const trackCrossesRiver = (from, to) => {
    const minX = Math.min(from.x, to.x), maxX = Math.max(from.x, to.x), minY = Math.min(from.y, to.y), maxY = Math.max(from.y, to.y);
    return barrierSegments.some(s => s.maxX >= minX && s.minX <= maxX && s.maxY >= minY && s.minY <= maxY && segmentsCross(from, to, s.a, s.b));
  };
  /** The nearest point of a road this spot can reach in a straight line without crossing a big river, or null. */
  const nearestReachable = spot => {
    const vertices = [];
    for (const route of Object.values(routes)) {
      if (!['road', 'bank'].includes(route.kind)) continue;
      route.points.forEach((point, vertex) => vertices.push({ d: distance(point, spot), routeId: route.id, vertex, point }));
    }
    vertices.sort((a, b) => a.d - b.d);
    // A road split for an earlier family's track has its junction twice; look past repeats, not just the nearest few.
    const seen = new Set();
    const distinct = vertices.filter(v => { const key = `${v.point.x},${v.point.y}`; if (seen.has(key)) return false; seen.add(key); return true; });
    return distinct.slice(0, 200).find(v => !trackCrossesRiver(spot, v.point)) || null;
  };
  const dry = candidate => Number.isFinite(land.heightAt(candidate.x, candidate.y))
    && !riverbanks.some(course => course.points.some(p => distance(p, candidate) < 0.3))
    && distance(candidate, town) > 1.2
    // Checked where the house will actually stand, to the hundredth of a mile it is stored at.
    && Boolean(nearestReachable({ x: round(candidate.x), y: round(candidate.y) }));
  const places = scatterHomesteads(random, playerCount, rivers, HOME_COUNTRY, dry);

  // Each homestead's track runs straight to the nearest point of a road it can reach without crossing a big river
  // (the San Marcos, like every smaller watercourse, is waded, as the roads wade it).
  const splitAt = (routeId, vertex, junctionId) => {
    const route = routes[routeId];
    delete routes[routeId];
    const first = { ...route, id: `${routeId}-a`, to: junctionId, points: route.points.slice(0, vertex + 1) };
    const second = { ...route, id: `${routeId}-b`, from: junctionId, points: route.points.slice(vertex) };
    routes[first.id] = first; routes[second.id] = second;
  };
  const homesteads = [];
  places.forEach((place, index) => {
    const home = { id: `home-${index + 1}`, name: `Family ${index + 1} home`, kind: 'homestead', x: round(place.x), y: round(place.y), ownerHouseholdId: `hh-${index + 1}` };
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
    routes[`route-${joinId}-${home.id}`] = { id: `route-${joinId}-${home.id}`, from: joinId, to: home.id, kind: 'track', points: [{ x: sites[joinId].x, y: sites[joinId].y }, { x: home.x, y: home.y }] };
    terrain.push({ id: `field-${index + 1}`, kind: 'field', ownerHouseholdId: `hh-${index + 1}`, points: [
      { x: round(home.x + 0.16), y: round(home.y + 0.14) }, { x: round(home.x + 0.69), y: round(home.y + 0.14) },
      { x: round(home.x + 0.69), y: round(home.y + 0.67) }, { x: round(home.x + 0.16), y: round(home.y + 0.67) },
    ] });
    homesteads.push(home);
  });

  // The home country drawn at the shape of the view, as the invented map did.
  const padded = { minX: HOME_COUNTRY.minX - 7, maxX: HOME_COUNTRY.maxX + 7, minY: HOME_COUNTRY.minY - 7, maxY: HOME_COUNTRY.maxY + 7 };
  const aspect = 960 / 540, width = padded.maxX - padded.minX, height = padded.maxY - padded.minY;
  if (width / height < aspect) { const grow = (height * aspect - width) / 2; padded.minX -= grow; padded.maxX += grow; }
  else { const grow = (width / aspect - height) / 2; padded.minY -= grow; padded.maxY += grow; }
  // The Gulf has no height; the relief drawing reads it as the lowest ground there is.
  const relief = sampleReliefGrid({ heightAt: (x, y) => { const h = land.heightAt(x, y); return Number.isFinite(h) ? h : 0; } }, padded, 88);
  const province = buildProvince();
  return { sites, routes, terrain, homesteads, relief, homeBounds: padded, bounds: province.bounds, province, source: built.kind };
}

export const HOME_COUNTRY_MILES = HOME_COUNTRY;
export { LEAGUE_MILES, polylineLength };

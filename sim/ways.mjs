// The way somebody goes: by the roads, across country, or across country to the road and along it (FIC-GONZ-029).
//
// Found in play 2026-09-14: people kept to the roads when it made no sense to - a man walked three miles out along his
// lane and back down the road to reach timber a mile across his own land. The roads of 1835 Texas were traces, and anybody
// on foot or on a horse struck out across open country when that was the shorter going. What turned them back to the road
// was what the ground cost: timber bottoms, brush, a creek, and above all a big river, which is crossed only at its
// crossings. So a journey here is the quickest way the traveller can actually go, costed with the same going the roads
// already carry (sim/ground.mjs), and the road wins where the road is quicker.
//
// The wagon is different: it leaves the road only over open ground. Through timber or brush it needs a road or a cut lane,
// which is what cutting one is for.
//
// `findPath` in sim/geography.mjs stays as it was for everything that is the road by definition: the express and the
// in-person riders, the families coming in along the wagon road, and the distances glory counts.
import { cutGround, polylineLength } from './geography.mjs';
import { groundAlong, landAround, onRealLand, segmentPace } from './ground.mjs';
import { distanceToPolyline } from './terrain.mjs';
import { woodsRule } from './woods.mjs';
import { ferryMiles } from './travel.mjs';
import { walked } from './colonies-map.mjs';

/**
 * How far from where they are anybody strikes out across country to a road or a place, in miles.
 * ceiling: a journey longer than this across country is not considered, so two places far apart are joined by the roads
 * between them however open the country; nobody here has yet been sent that far off the road.
 */
export const OVERLAND_REACH = 8;
/**
 * How much longer a mile across country takes than the same mile of level open road, over and above its timber, brush,
 * climbs and creeks: finding the way, the tall grass, the gullies the road was laid to miss (FIC-GONZ-029).
 */
export const OFF_ROAD = Object.freeze({ foot: 1.15, horse: 1.2, wagon: 1.6 });
/** The share of a stretch in timber and brush beyond which a wagon cannot go across country at all (FIC-GONZ-029)... */
export const WAGON_COVER = 0.1;
/** ...unless it is no longer than this, in miles: a wagon can be got a few hundred yards through anything. */
export const WAGON_SHORT = 0.25;
/** On the invented map, timber stands this far either side of its water, as its map draws it (sim/fields.mjs `groundAt`). */
const INVENTED_TIMBER = 1.15;

const round = (value, places = 3) => { const fixed = +value.toFixed(places); return fixed === 0 ? 0 : fixed; };
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const crosses = (a, b, p, q) => {
  const side = (u, v, w) => Math.sign((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x));
  return side(a, b, p) !== side(a, b, q) && side(p, q, a) !== side(p, q, b);
};

/**
 * The going on a straight line across country, as `[rise, timber share, brush share, creeks, lesser rivers]`, or null when
 * a big river lies across it. The real land reads its own water and cover; the invented map its rivers and creeks.
 */
export function groundAcross(world, a, b) {
  if (onRealLand(world)) {
    const land = landAround();
    if (land.crossings(a, b).barrier) return null;
    return groundAlong([a, b], land, woodsRule(world))[0];
  }
  const water = (world.map.terrain || []).filter(feature => feature.kind === 'river' || feature.kind === 'creek');
  let creeks = 0;
  for (const course of water) {
    const over = course.points.slice(1).some((q, i) => crosses(a, b, course.points[i], q));
    if (!over) continue;
    if (course.kind === 'river') return null;
    creeks++;
  }
  const length = distance(a, b), samples = Math.max(1, Math.round(length / (1 / 16)));
  let timber = 0;
  for (let s = 0; s < samples; s++) {
    const f = (s + 0.5) / samples, point = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    if (water.some(course => distanceToPolyline(point, course.points) < INVENTED_TIMBER)) timber++;
  }
  return [0, round(timber / samples, 2), 0, creeks, 0];
}

/** How long a straight line across country takes, in miles of open road, and its going; null where this way cannot go. */
export function overland(world, a, b, modeId) {
  const length = distance(a, b);
  if (length === 0) return { cost: 0, ground: null, factor: 1 };
  const ground = groundAcross(world, a, b);
  if (!ground) return null;
  if (modeId === 'wagon' && length > WAGON_SHORT && ground[1] + ground[2] > WAGON_COVER) return null;
  const factor = round(segmentPace(length, ground, modeId) * (OFF_ROAD[modeId] || OFF_ROAD.foot));
  return { cost: length * factor, ground, factor };
}

const legPace = (route, forward, modeId) => {
  const ground = route.ground && (forward ? cutGround(route) : [...cutGround(route)].reverse().map(g => g && [-g[0], g[1], g[2], g[3], g[4]]));
  const points = forward ? route.points : [...route.points].reverse();
  return points.slice(1).map((b, i) => ({ length: distance(points[i], b), ground: ground?.[i] ?? null }));
};

/** A ferry is on a road when its crossing is this close to the road's line, in miles. */
const ON_ROAD = 0.05;
const ferriesByRoute = new WeakMap();
/** The ferries a route runs over, as `{ site, at }` - the place and its crossing point - worked out once for each route. */
function ferriesOn(world, route) {
  if (ferriesByRoute.has(route)) return ferriesByRoute.get(route);
  const found = Object.values(world.map.sites).filter(site => site.kind === 'ferry')
    .map(site => ({ site, at: site.over || site }))
    .filter(({ at }) => distanceToPolyline(at, route.points) <= ON_ROAD);
  ferriesByRoute.set(route, found);
  return found;
}

/**
 * The quickest way from one place to another for somebody going this way. Returns what `findPath` returns - `points`,
 * `distance`, `routeIds`, `nodes`, `ground` - and `pace`, the `[segment, factor]` of every stretch that is not level open
 * road, across-country stretches with their off-road cost in it; and `ferries`, the ids of the ferries the way goes over,
 * whose wait (`ferryMiles`, FIC-GONZ-092) is in the pace of the stretch each stands on. Null when there is no way at all.
 *
 * `ferries: false` leaves the ferries' wait out: the flight of the Runaway Scrape, whose flooded crossings are waited at by
 * its own rule (sim/scrape.mjs `CROSSING_HOURS`).
 */
export function findWay(world, fromSiteId, toSiteId, modeId = 'foot', { ferries: waitForFerries = true } = {}) {
  const { sites, routes } = world.map;
  const from = sites[fromSiteId], to = sites[toSiteId];
  if (!from || !to || fromSiteId === toSiteId) return null;
  const edges = new Map();
  const add = (a, edge) => { if (!edges.has(a)) edges.set(a, []); edges.get(a).push(edge); };
  for (const route of Object.values(routes)) {
    // The outside country's roads are drawn, not walked (sim/colonies-map.mjs `walked`).
    if (!walked(route)) continue;
    for (const forward of [true, false]) {
      const segments = legPace(route, forward, modeId);
      const cost = segments.reduce((sum, s) => sum + s.length * segmentPace(s.length, s.ground, modeId), 0)
        + (waitForFerries ? ferriesOn(world, route).length * ferryMiles(modeId) : 0);
      add(forward ? route.from : route.to, { to: forward ? route.to : route.from, cost, route, forward });
    }
  }
  // Across country: out from where they are to any place near enough, in to where they are going from any place near
  // enough, and straight there. Only what is within reach is costed, and each line once.
  const near = point => Object.values(sites).filter(site => distance(site, point) <= OVERLAND_REACH);
  const across = new Map();
  const acrossEdge = (a, b) => {
    const key = `${a.id}>${b.id}`;
    if (!across.has(key)) across.set(key, overland(world, a, b, modeId));
    const way = across.get(key);
    if (way) add(a.id, { to: b.id, cost: way.cost, overland: way });
  };
  for (const site of near(from)) if (site.id !== fromSiteId) acrossEdge(from, site);
  for (const site of near(to)) if (site.id !== toSiteId && site.id !== fromSiteId) acrossEdge(site, to);

  const best = new Map([[fromSiteId, { cost: 0, via: null }]]);
  const queue = [fromSiteId], done = new Set();
  while (queue.length) {
    queue.sort((a, b) => best.get(a).cost - best.get(b).cost);
    const current = queue.shift();
    if (current === toSiteId) break;
    done.add(current);
    for (const edge of edges.get(current) || []) {
      if (done.has(edge.to)) continue;
      const cost = best.get(current).cost + edge.cost;
      if (!best.has(edge.to) || cost < best.get(edge.to).cost - 1e-9) {
        best.set(edge.to, { cost, via: { from: current, edge } });
        if (!queue.includes(edge.to)) queue.push(edge.to);
      }
    }
  }
  if (!best.has(toSiteId)) return null;
  const legs = [];
  for (let node = toSiteId; best.get(node).via; node = best.get(node).via.from) legs.unshift(best.get(node).via);
  const points = [{ x: from.x, y: from.y }], ground = [], pace = [], nodes = [{ id: fromSiteId, at: 0 }], routeIds = [];
  let at = 0;
  for (const { edge } of legs) {
    if (edge.overland) {
      const end = sites[edge.to];
      const length = distance(points.at(-1), end);
      if (length > 0) {
        if (edge.overland.factor !== 1) pace.push([points.length - 1, edge.overland.factor]);
        ground.push(edge.overland.ground);
        points.push({ x: end.x, y: end.y });
        at += length;
      }
    } else {
      routeIds.push(edge.route.id);
      const ordered = edge.forward ? edge.route.points : [...edge.route.points].reverse();
      const segments = legPace(edge.route, edge.forward, modeId);
      ordered.forEach((point, index) => {
        if (index === 0) return;
        const segment = segments[index - 1];
        if (segment.length === 0) return;
        const factor = round(segmentPace(segment.length, segment.ground, modeId));
        if (segment.ground && factor !== 1) pace.push([points.length - 1, factor]);
        ground.push(segment.ground);
        points.push({ x: point.x, y: point.y });
        at += segment.length;
      });
    }
    nodes.push({ id: edge.to, at });
  }
  if (points.length < 2) return null;
  // The wait at each ferry the roads go over, laid on the stretch the ferry stands on as that many more miles of going.
  const ferried = [];
  if (waitForFerries) {
    for (const { edge } of legs) {
      if (edge.overland) continue;
      for (const { site, at: over } of ferriesOn(world, edge.route)) {
        if (ferried.includes(site.id)) continue;
        let segment = -1, best = Infinity;
        for (let i = 1; i < points.length; i++) {
          const d = distanceToPolyline(over, [points[i - 1], points[i]]);
          if (d < best && distance(points[i - 1], points[i]) > 0) { best = d; segment = i - 1; }
        }
        if (segment < 0 || best > ON_ROAD) continue;
        const length = distance(points[segment], points[segment + 1]);
        const entry = pace.find(([index]) => index === segment);
        const factor = round((entry ? entry[1] : 1) + ferryMiles(modeId) / length);
        if (entry) entry[1] = factor; else pace.push([segment, factor]);
        ferried.push(site.id);
      }
    }
    pace.sort((a, b) => a[0] - b[0]);
  }
  return { points, distance: polylineLength(points), routeIds, nodes, pace, overland: legs.some(leg => leg.edge.overland), ...(ground.some(Boolean) && { ground }), ...(ferried.length && { ferries: ferried }) };
}

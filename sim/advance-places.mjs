// The Mexican advance's places, at an old save's door (owner, 2026-09-26, docs/SCRAPE.md §10 (c): "Real places to go";
// docs/MAP_ACCURACY.md §14).
//
// Thompson's (and its ferry), the Old Fort, Stafford's, New Washington and Mrs. Powell's became places of the built map on
// 2026-09-26, with the seven roads the columns went by. A class saved before them has a map without them: it is given them
// here, from the built map, the way sim/south.mjs `openSouth` gives an older class the south - the five places, the roads to
// them, the crossings on those roads, and the creeks round those crossings that a class keeps. **Added, never moved**: nothing
// the class had is changed, every family's home, lane and road is what it was, and no save version moves (its map was not
// wrong; it lacked places). Called at the save's door (server/storage.mjs), once; a no-op on every later load.
import { coloniesMap, isCrossing } from './colonies-map.mjs';
import { CREEK_AT_CROSSING, creekRuns, routeOfRoad, siteOfPlace } from './colonies-region.mjs';

/** The five places, by their ids on the built map. */
export const ADVANCE_PLACES = Object.freeze(['thompsons', 'old-fort', 'staffords', 'new-washington', 'powells']);

/** Whether this class's map has the advance's places. */
export const advancePlacesOpen = world => ADVANCE_PLACES.every(id => world?.map?.sites?.[id]);

const segmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
};
const onRoad = (road, point) => road.points.slice(1).some((b, i) => segmentDistance(point, road.points[i], b) < 0.05);

/** Give an old class the advance's places. Returns whether it changed anything. */
export function openAdvancePlaces(world) {
  const map = world?.map;
  if (map?.source !== 'texas-colonies-map' || !map.sites || !map.routes || advancePlacesOpen(world)) return false;
  const built = coloniesMap();
  if (!ADVANCE_PLACES.every(id => built.places[id])) return false;
  const roads = built.roads.filter(road => [road.from, road.to].some(end => ADVANCE_PLACES.includes(end)));
  const added = new Set();
  for (const id of ADVANCE_PLACES) if (!map.sites[id]) { map.sites[id] = siteOfPlace(built.places[id]); added.add(id); }
  // The crossings of those roads - Thompson's ferry and the fords on the new roads - where the class has none.
  for (const place of Object.values(built.places)) {
    if (map.sites[place.id] || place.outside || !isCrossing(place)) continue;
    if (!roads.some(road => onRoad(road, place))) continue;
    map.sites[place.id] = siteOfPlace(place);
    added.add(place.id);
  }
  for (const road of roads) {
    const route = routeOfRoad(road);
    if (!map.routes[route.id]) map.routes[route.id] = route;
  }
  keepCreeks(map, built, added);
  return true;
}

/** The creek round each new ford, as sim/colonies-region.mjs keeps it (`CREEK_AT_CROSSING`), so no ford stands on dry ground. */
function keepCreeks(map, built, ids) {
  map.terrain ||= [];
  const have = new Set(map.terrain.map(feature => feature.id));
  for (const site of [...ids].map(id => map.sites[id]).filter(one => one.waterKind === 'creek')) {
    const box = { minX: site.x - CREEK_AT_CROSSING, maxX: site.x + CREEK_AT_CROSSING, minY: site.y - CREEK_AT_CROSSING, maxY: site.y + CREEK_AT_CROSSING };
    const inBox = p => p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
    built.watercourses.forEach((course, index) => {
      if (course.name !== site.water || course.kind !== 'creek') return;
      creekRuns(course, inBox).forEach(({ points, cut }, part) => {
        const id = `water-advance-${index}-${part}`;
        if (have.has(id)) return;
        have.add(id);
        map.terrain.push({ id, kind: 'creek', name: course.name, points: points.map(p => ({ x: p.x, y: p.y })), ...(cut.size && { cut: [...cut] }) });
      });
    });
  }
}

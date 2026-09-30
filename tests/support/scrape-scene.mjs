// A played family set on a road in front of Mexican troops on the record's day, for the chase's tests and proofs
// (tests/scrape-pursuit.test.mjs, scripts/scrape-pursuit-browser-proof.mjs, scripts/scrape-pursuit-scene.mjs).
//
// The family is put where a family could be - on the road between two places, with its wagon and ox, on foot, or all on
// horseback - a given distance ahead of a column's head or a patrol, going the same way. Nothing else of the class is touched.
import { findWay } from '../../sim/ways.mjs';
import { setOutOnLeg, mountedPace } from '../../sim/flight-route.mjs';
import { addBeast, beastsOf } from '../../sim/beasts.mjs';
import { on } from '../../sim/advance.mjs';
import { advancePursuit, watchersNow } from '../../sim/pursuit.mjs';
import { atTimeline } from './scrape-spring.mjs';

const GONE = ['dead', 'captured'];
/** Where along a polyline a point lies nearest, in miles from its start. */
function along(points, p) {
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

/**
 * Puts the family on the road from `from` to `to`, `atMiles` along it, going there by the road (or `way`), as a train going
 * `how`: 'wagon' (the family wagon and an ox), 'foot' (no beasts), or 'mounted' (a horse for everybody but a baby in arms).
 * Its people are the living ones not serving; its beasts that do not go stay at home.
 */
export function placeFamily(world, household, { from, to, atMiles, how = 'wagon', way = 'road' }) {
  household.played = true; delete household.absent;
  if (how === 'mounted') world.meansRoll = 2;
  const people = household.members.map(id => world.entities[id]).filter(one => one.kind === 'person' && !GONE.includes(one.health?.condition) && one.service?.status !== 'serving');
  for (const one of people) { one.health = { condition: 'well' }; delete one.auto; }
  // The student's main person is one of the living grown people going.
  household.mainId = (people.find(one => one.principal) || people.find(one => !(one.age < 16)) || people[0]).id;
  const site = world.map.sites[from], home = world.map.sites[household.homeSiteId];
  const beasts = (household.property || []).map(id => world.entities[id]).filter(Boolean);
  if (how === 'mounted') for (let n = beastsOf(world, household, 'horse').length; n < people.filter(one => !(one.age < 2)).length; n++) addBeast(world, household, 'horse', null, { at: home });
  const going = how === 'wagon' ? [beastsOf(world, household, 'wagon')[0], beastsOf(world, household, 'ox')[0]]
    : how === 'mounted' ? beastsOf(world, household, 'horse') : [];
  for (const beast of (household.property || []).map(id => world.entities[id]).filter(Boolean)) {
    beast.travel = null; beast.condition = 'sound'; delete beast.hurt; beast.borrowedBy = null;
    beast.location = going.includes(beast) ? { x: site.x, y: site.y, siteId: from } : { x: home.x, y: home.y, siteId: household.homeSiteId };
  }
  for (const one of people) { one.travel = null; one.chore = null; one.task = 'rest'; one.location = { x: site.x, y: site.y, siteId: from }; }
  household.resources = { ...household.resources, food: 40, seed: 0, cotton: 0, powder: 0 };
  household.flight = { status: 'refuged', refuge: from, orderedMinute: world.minute - 6 * 1440, leftMinute: world.minute - 4 * 1440, arrivedMinute: world.minute - 1440, mode: how === 'wagon' ? 'wagon' : 'foot', took: {}, crossed: [from] };
  const path = findWay(world, from, to, how === 'wagon' ? 'wagon' : 'foot', { ferries: false });
  const train = { people, beasts: going };
  setOutOnLeg(world, household, path, { from, to, way, causeId: null, train });
  household.flight.status = 'fled'; household.flight.refuge = to;
  for (const one of [...people, ...going]) {
    if (!one.travel) continue;
    one.travel.progress = Math.min(one.travel.distance - 0.05, atMiles);
    let walked = 0; const points = one.travel.points;
    for (let i = 1; i < points.length; i++) {
      const length = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      if (walked + length >= one.travel.progress) { const f = (one.travel.progress - walked) / length; one.location = { x: points[i - 1].x + (points[i].x - points[i - 1].x) * f, y: points[i - 1].y + (points[i].y - points[i - 1].y) * f, siteId: null }; break; }
      walked += length;
    }
  }
  mountedPace(world, [...people, ...going]);
  return { household, main: world.entities[household.mainId || household.principalId], path };
}

/** The family camped at Nacogdoches with everything it has, told to leave long ago: where no column comes. */
export function stowAway(world, household, at = 'nacogdoches') {
  const site = world.map.sites[at];
  for (const id of [...household.members, ...(household.property || [])]) {
    const one = world.entities[id];
    if (!one || one.service?.status === 'serving') continue;
    one.travel = null; one.chore = null; if (one.kind === 'person') one.task = 'rest';
    one.location = { x: site.x, y: site.y, siteId: at };
  }
  household.played = true; delete household.absent;
  // Fed while it waits for its scene: a played family can starve (owner, 2026-09-30; sim/hunger.mjs), and weeks at the camp with
  // what the class had left it would kill it before the soldiers came. The scene sets its own food (`placeFamily`).
  household.resources = { ...household.resources, food: Math.max(household.resources?.food || 0, 400) };
  // The family together at its camp: not taken in by neighbours while it was stepped here unplayed (sim/acting.mjs).
  delete household.takenIn;
  household.flight = { status: 'refuged', refuge: at, orderedMinute: world.minute, leftMinute: world.minute, arrivedMinute: world.minute, mode: 'wagon', took: {}, crossed: [] };
}

/**
 * The scenes: `cavalry` - Santa Anna's dragoons out ahead of his column on the road from Stafford's to Harrisburg on the
 * morning of April 15, the family `ahead` miles in front of them; `infantry` - his column itself on the road down the Brazos
 * Santa Anna's column itself on the open road from Harrisburg to New Washington on the afternoon of April 18, no patrol
 * out, the family `ahead` miles in front of its head.
 */
export const SCENES = Object.freeze({
  cavalry: { minute: on(1836, 4, 15, 10), watcher: 'santa-anna-dragoons', from: 'staffords', to: 'harrisburg', ahead: 1.5 },
  infantry: { minute: on(1836, 4, 18, 16), watcher: 'santa-anna', from: 'harrisburg', to: 'new-washington', ahead: 0.3 },
  // Almonte's dragoons riding for New Washington on the morning of the 16th, a belt of timber a few hundred yards off the road.
  timber: { minute: on(1836, 4, 16, 10), watcher: 'almonte', from: 'harrisburg', to: 'new-washington', ahead: 1.05 },
});
export function sceneFor(world, { kind = 'cavalry', how = 'wagon', ahead = null, householdId = 'hh-1', minute = null, prepare = null } = {}) {
  const scene = { ...SCENES[kind], ...(minute !== null && { minute }) };
  const household = world.households[householdId];
  // Out of the way until the scene's day: camped at Nacogdoches, where no column comes, so nothing happens to it at home.
  stowAway(world, household);
  atTimeline(world, scene.minute);
  const watcher = watchersNow(world).find(one => one.id === scene.watcher);
  if (!watcher) throw new Error(`${scene.watcher} is not out at the scene's minute`);
  const road = findWay(world, scene.from, scene.to, how === 'wagon' ? 'wagon' : 'foot', { ferries: false });
  const at = along(road.points, watcher);
  const placed = placeFamily(world, household, { from: scene.from, to: scene.to, atMiles: at.at + (ahead ?? scene.ahead), how });
  // What the family has been through before it is put here (`prepare`): who has already stripped it, for "One army".
  prepare?.(placed.household);
  // Seen where it is put: the soldiers have it in sight now, not after the class's next long tick carries everybody on.
  advancePursuit(world, household);
  return { ...placed, watcher, scene };
}

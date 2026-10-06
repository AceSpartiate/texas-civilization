// Where a rider's word is heard, and who is standing there to hear it: the scene a rider's visit plays as.
//
// The owner, 2026-10-05, verbatim: "I want to radically redesign the whole rider and or news person shows up. The conversation
// is boring. Let's redo each of them as a cutscene sort of like with the wedding. The environment should change in the cutscene
// based on where they are and who's around them." And, choosing among options the same day: "Every rider who reaches you" -
// "A rider who stops to talk, and an express rider who passes your people, both play as a scene where your person is: the home
// yard, the town street, camp or road. Whoever is near is in it, the rider dismounts, and family or townsfolk ask the questions.
// Stand-in backdrops come from the map ground until Astra's art lands." (docs/COLONIES.md §5.4e, `FIC-GONZ-1195`.)
//
// This file decides the two things the server owns about that picture: **where** (the setting, from where the person the rider
// reined in for is actually standing - their own yard, a town's street, the volunteers' camp, a ford, the road or the woods) and
// **who** (the family's own people standing near, and the townsfolk, neighbours or volunteers about them). Both are settled the
// minute the rider reins in and kept on the encounter (`scene`), so a reload, a reconnect or a re-reading shows the same place and
// the same people; nothing about the news is in either. The page draws it (public/rider-scene.js) and writes none of it.
import { landView } from './houses.mjs';
import { appearanceOf } from './appearance.mjs';
import { ageNow, bandOf, sexOf } from './family.mjs';
import { dateOf } from './clock.mjs';
import { cropOf, cropState, fieldPlots } from './fields.mjs';
import { distanceToPolyline } from './terrain.mjs';

/** Within this of the family's own house site is its yard; within `TOWN_MILES` of a town or village is its street. Invented. */
export const HOME_MILES = 0.5, TOWN_MILES = 0.6;
/** Within this of a river or creek, or standing at a ford, ferry or bridge, is the water's edge. */
export const WATER_MILES = 0.15;
/** How near somebody must stand to be in the scene: in the yard, on the same street, about the same fire. */
export const NEAR_MILES = 0.3;
/** How many people a scene holds besides the rider: the family's own first, then those about them. ceiling: eight, so a crowd
 * in town or camp is a few faces and not the whole street; a wider picture with figures in the distance would be its own art. */
export const CAST_MAX = 8;
const OTHERS_MAX = Object.freeze({ town: 3, camp: 4, alamo: 2, home: 2, ford: 2, road: 2 });

const between = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const alive = person => person?.kind === 'person' && !['dead', 'captured'].includes(person.health?.condition);
const given = person => String(person?.name || '').split(' ')[0] || 'Someone';

/** A person's age now, or the age the founding four are taken for. */
function yearsOf(world, person) {
  const age = ageNow(world, person) ?? person.age;
  if (Number.isFinite(age)) return age;
  const band = bandOf(person);
  return band === 'adult' ? 30 : band === 'youth' ? 14 : null;
}

/** The nearest map place of these kinds within `miles`, or null. */
function nearestSite(world, point, kinds, miles) {
  let best = null, bestMiles = Infinity;
  for (const site of Object.values(world.map?.sites || {})) {
    if (!kinds.includes(site.kind)) continue;
    const d = between(site, point);
    if (d <= miles && d < bestMiles) { best = site; bestMiles = d; }
  }
  return best;
}

/** The river or creek running nearest this point, within `miles`: its kind, or null. */
function waterNear(world, point, miles) {
  let best = null, bestMiles = Infinity;
  for (const course of world.map?.terrain || []) {
    if (!['river', 'creek'].includes(course.kind) || !(course.points?.length > 1)) continue;
    const d = distanceToPolyline(point, course.points);
    if (d <= miles && d < bestMiles) { best = course.kind; bestMiles = d; }
  }
  return best;
}

function insidePolygon(point, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / ((b.y - a.y) || 1e-12) + a.x) inside = !inside;
  }
  return inside;
}
/**
 * Whether there is timber about this point: inside a stretch of woods the map draws, or near a named timber.
 * ceiling: the map's drawn woods and named timbers only, not the LANDFIRE stand under every patch (sim/woods.mjs); reading the
 * stand would put woods behind every family in the bottoms, which is true, and is the next step if a class finds the road too bare.
 */
function woodsNear(world, point) {
  if ((world.map?.terrain || []).some(feature => feature.kind === 'woods' && feature.points?.length > 2 && insidePolygon(point, feature.points))) return true;
  return Boolean(nearestSite(world, point, ['woods'], 0.6));
}

/**
 * Where this person is standing, as a scene: `home` (their own yard, with the house as it stands, the field as it is and the
 * water if it is near), `town` (which town), `camp` (with the volunteers), `alamo` (inside the walls, for Travis's runner),
 * `ford` (at a crossing or by the water), or `road` (with `woods` when there is timber about). Nothing here is about the news.
 */
export function settingFor(world, person, { alamo = false } = {}) {
  const at = person.location || {};
  const household = world.households?.[person.householdId];
  const home = household && world.map?.sites?.[household.homeSiteId];
  const site = at.siteId ? world.map?.sites?.[at.siteId] : null;
  const woods = woodsNear(world, at);
  if (alamo) return { kind: 'alamo', siteId: 'bexar', name: 'Inside the Alamo' };
  if (person.service?.status === 'serving' || site?.kind === 'camp') {
    return { kind: 'camp', siteId: site?.id || null, name: site?.kind === 'camp' ? site.name : 'The volunteers’ camp', woods, water: waterNear(world, at, WATER_MILES * 2) };
  }
  const homeHere = home && (at.siteId === home.id || between(at, home) <= HOME_MILES);
  const townSite = site && ['town', 'village'].includes(site.kind) ? site : null;
  if (homeHere && !townSite) {
    const plots = fieldPlots(household);
    const sown = plots.find(plot => cropState(household, plot) !== 'bare');
    return {
      kind: 'home', siteId: home.id, name: 'At home',
      house: landView(household),
      field: sown ? { crop: cropOf(household, sown), state: cropState(household, sown) } : plots.length ? { crop: null, state: 'bare' } : null,
      water: waterNear(world, home, 0.6), woods,
    };
  }
  const town = townSite || nearestSite(world, at, ['town', 'village'], TOWN_MILES);
  if (town) return { kind: 'town', siteId: town.id, name: town.name, water: waterNear(world, at, 0.5) };
  const crossing = site && ['ford', 'ferry', 'bridge'].includes(site.kind) ? site : null;
  const water = waterNear(world, at, WATER_MILES);
  if (crossing || water) return { kind: 'ford', siteId: crossing?.id || null, name: crossing?.kind === 'ferry' ? 'At the ferry' : 'At the ford', water: water || 'river', woods };
  return { kind: 'road', siteId: site?.id || null, name: woods ? 'In the woods' : 'On the road', woods };
}

/** What sort of person somebody not of the family is, in the scene: a townsman, a volunteer, a neighbour. */
function roleOf(person, setting) {
  if (person.resident || person.keeper || person.townSiteId) return 'town';
  if (setting.kind === 'camp' || person.service?.status === 'serving') return 'volunteer';
  return 'neighbour';
}
const SKIP = entity => entity.courier || entity.runner || entity.famous || entity.gone || entity.kind !== 'person';

/**
 * Who is in the scene: the person the rider reined in for first, then the family's own people standing near them (the parents,
 * then the children oldest first), then whoever else is about - the town's people in a town, the volunteers in camp, a
 * neighbour in the yard or on the road. Only people actually standing within `NEAR_MILES` and on the same side of the river
 * (`blocked`), never anybody across the water or away on a road. Kept by id and role; the page is sent how they look when it draws.
 */
export function castFor(world, listener, setting, blocked = () => false) {
  const household = world.households?.[listener.householdId];
  const near = person => person.location && (person.id === listener.id || (between(person.location, listener.location) <= NEAR_MILES
    && !blocked(person.location, listener.location)) || (listener.location.siteId && person.location.siteId === listener.location.siteId && !person.travel));
  const family = (household?.members || []).map(id => world.entities[id]).filter(person => alive(person) && person.id !== listener.id && near(person))
    .sort((a, b) => (yearsOf(world, b) ?? 0) - (yearsOf(world, a) ?? 0) || (a.id < b.id ? -1 : 1));
  const cast = [{ id: listener.id, role: 'listener' }, ...family.map(person => ({ id: person.id, role: 'family' }))].slice(0, CAST_MAX);
  const room = Math.min(OTHERS_MAX[setting.kind] ?? 2, CAST_MAX - cast.length);
  if (room > 0) {
    const others = Object.values(world.entities).filter(entity => !SKIP(entity) && alive(entity) && entity.householdId !== listener.householdId && near(entity))
      .map(entity => ({ entity, role: roleOf(entity, setting), miles: between(entity.location, listener.location) }))
      // In a town its own people first; in camp the volunteers; then the nearest.
      .sort((a, b) => (b.role === 'town') - (a.role === 'town') || (b.role === 'volunteer') - (a.role === 'volunteer') || a.miles - b.miles || (a.entity.id < b.entity.id ? -1 : 1))
      .filter(one => setting.kind !== 'camp' || one.role !== 'neighbour' || !one.entity.householdId)
      .slice(0, room);
    for (const one of others) cast.push({ id: one.entity.id, role: one.role });
  }
  return cast;
}

/**
 * The scene of an encounter, settled when the rider reins in (sim/encounters.mjs `begin`).
 * ceiling: settled once - somebody who walks up while he talks is not added, and somebody who walks off is still drawn; following
 * them would mean a scene that changes under the student's eyes, which a class may or may not want.
 */
export function sceneFor(world, encounter, { blocked, alamo = false } = {}) {
  const listener = world.entities[encounter.listenerId];
  if (!listener) return null;
  const setting = settingFor(world, listener, { alamo });
  return { setting, cast: castFor(world, listener, setting, blocked) };
}

/**
 * Where each person of the scene stands on the page, as data (owner: "the environment should change ... based on where they are
 * and who's around them"): the family on the left facing the rider, the one he stopped for nearest him, the grown in the line
 * and the children a step in front; whoever else is about on the right behind him, turned to him; the rider on the right of the
 * middle, facing the family. `side`, `slot` (0 nearest the middle), `row` (1 a step in front, -1 a step behind) and `face`.
 */
export function layoutOf(cast, castView) {
  const placed = {};
  let leftGrown = 0, leftSmall = 0, right = 0;
  for (const { id, role } of cast) {
    const view = castView[id];
    if (!view) continue;
    if (role === 'listener' || role === 'family') {
      const small = ['infant', 'small', 'child'].includes(view.band);
      placed[id] = small ? { side: 'left', slot: leftSmall++ + 0.6, row: 1, face: 'e' } : { side: 'left', slot: leftGrown++, row: 0, face: 'e' };
    // Clear of the rider's horse, which stands across the right of the middle.
    } else placed[id] = { side: 'right', slot: 2.4 + right++, row: -1, face: 'w' };
  }
  return placed;
}

/** How one person of the scene is drawn: looks and band, never anything hidden (sim/town.mjs `seenAs` sends the same). */
export function castEntry(world, person, role) {
  const age = yearsOf(world, person);
  const band = (Number.isFinite(age) ? (age < 2 ? 'infant' : age < 5 ? 'small' : age < 10 ? 'child' : age < 18 ? 'youth' : 'adult') : bandOf(person)) || 'adult';
  const appearance = person.householdId ? appearanceOf(world, person) : null;
  return {
    id: person.id, name: person.name, given: given(person), sex: sexOf(person) || person.sex || null, band, role,
    family: role === 'listener' || role === 'family', ...(person.kin?.role && { relation: person.kin.role }), ...(appearance && { appearance }),
  };
}

/**
 * The light of the scene: the hour the rider reined in, on the class's own clock - the wedding's hours (sim/courtship.mjs
 * `partOfDay`), kept here because that module cannot be loaded this early (it reaches the chores' table, which is built after).
 */
export function lightOf(world, minute) {
  const date = dateOf(world, minute);
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  if (hour < 5) return { light: 'night', when: 'Night' };
  if (hour < 10.5) return { light: 'morning', when: 'Morning' };
  if (hour < 15) return { light: 'noon', when: 'Midday' };
  if (hour < 18) return { light: 'evening', when: 'Afternoon' };
  if (hour < 21) return { light: 'evening', when: 'Evening' };
  return { light: 'night', when: 'Night' };
}

/**
 * The scene as the family's page draws it: the setting with its light and its heading ("At home · Afternoon"), and every person
 * in it with how they look, where they stand and which way they face, the rider among them. A class saved before 2026-10-05 has
 * no scene on its encounters; one is settled from where the people stand now, which is the honest answer for a meeting still open.
 */
export function sceneView(world, encounter) {
  const scene = encounter.scene || sceneFor(world, encounter);
  if (!scene) return null;
  const light = lightOf(world, encounter.openedMinute ?? world.minute);
  const cast = {};
  for (const { id, role } of scene.cast) {
    const person = world.entities[id];
    if (person) cast[id] = castEntry(world, person, role);
  }
  const layout = layoutOf(scene.cast, cast);
  for (const [id, place] of Object.entries(layout)) Object.assign(cast[id], place);
  const carrier = world.entities[encounter.carrierId];
  const rider = { id: encounter.carrierId, name: encounter.carrierName, given: given(carrier || { name: encounter.carrierName }), on: encounter.kind === 'alamo-runner' ? 'foot' : 'horse', side: 'right', slot: 0, row: 0, face: 'w' };
  return {
    setting: { ...scene.setting, light: light.light, when: light.when },
    place: `${scene.setting.name} · ${light.when}`,
    // Where on the map they stand, for the page to lay the map's own ground under them (stand-in until the backdrops are drawn).
    at: encounter.place && Number.isFinite(encounter.place.x) ? { x: encounter.place.x, y: encounter.place.y } : null,
    order: scene.cast.map(one => one.id).filter(id => cast[id]),
    cast, rider,
  };
}

/** A stored scene is a place of a known kind and people the world has. Absent on every encounter before 2026-10-05. */
export function sceneInvalid(world, scene) {
  if (scene === undefined) return null;
  if (!scene || typeof scene !== 'object' || !scene.setting || !['home', 'town', 'camp', 'alamo', 'ford', 'road'].includes(scene.setting.kind)) return 'Invalid rider scene';
  if (!Array.isArray(scene.cast) || scene.cast.some(one => typeof one?.id !== 'string' || typeof one.role !== 'string')) return 'Invalid rider scene cast';
  return null;
}

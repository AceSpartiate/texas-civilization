// The south to the Nueces: San Patricio (February 27, 1836) and Agua Dulce Creek (March 2) on the battle engine, and the men who
// went south really there. docs/BATTLES.md §2b.4 and §6.14, docs/battle-research/staging.md §4, docs/MAP_ACCURACY.md §13.
//
// Owner, 2026-09-25: "if they sent a character, it needs to happen in such a way that their character arrives in time to
// participate and does participate", and, by multiple choice, "the map extends south to the Nueces" - so a man who went south
// is at San Patricio, and the fights are drawn where they happened (staging S1), keeping Matamoros as the prisoners' fate
// with the dispute recorded (S2).
//
// What this does, in the class's own order:
// - **The map** (`openSouth`): a class saved before 2026-09-25 is given the south's places and roads from the built map at the
//   save's door (server/storage.mjs `readSave`), added and never moved - its homes, roads and every place it had are what they
//   were. San Patricio stops being a name on the edge of the map and becomes a village the roads go to.
// - **Going south** (`southSite`, sim/winter.mjs): the Matamoros men are at San Patricio, where Johnson and Grant took them
//   after Houston left them at Refugio on January 21 (`HIST-TEX-513`); a man still at Refugio goes on with them
//   (`walkOnSouth`), and the join is refused honestly once he could not reach San Patricio before the raid (`southClosing`).
// - **Grant rides south** about February 20 (`FIC-GONZ-436`, `grantRides`): the men are split between Johnson's party and
//   Grant's at the record's shares, as they always were, and Grant's ride to the end of the walked road south to gather horses.
// - **The fights** (`advanceSouth`): each armed on the engine, the men of its party who are there put in its force at their
//   own places, each one's fate - rolled exactly as `fightSouth` rolls it, so no class's outcome moved - landing at its own
//   staged moment inside the fighting: falling in the square, giving up at a door, going out the back with Johnson, cut down
//   in the chase, taken, riding away. Nobody's fate is on the wire before that moment, and no household hears it before the
//   word (`tellSouth`, unchanged).
// - **Afterwards**: the escaped ride for Fannin at Goliad; the prisoners are marched south out of the walked country toward
//   Matamoros; the dead lie where they fell. The family is told what happened, in plain words, when the word comes.
import { record } from './events.mjs';
import { awardGlory } from './glory.mjs';
import { frailty } from './army.mjs';
import { spotlight } from './host.mjs';
import { calendarMinutes } from './clock.mjs';
import { armBattle, battleState, looseSlot, placeFrom, placeOf, projectBattle } from './battle-stage.mjs';
import { SAN_PATRICIO } from './battles/san-patricio.mjs';
import { AGUA_DULCE } from './battles/agua-dulce.mjs';
import { JOHNSON_SHARE, SOUTH_RATES, share } from './alamo.mjs';
import { coloniesMap } from './colonies-map.mjs';
import { CREEK_AT_CROSSING, creekRuns, routeOfRoad, siteOfPlace } from './colonies-region.mjs';
import { modeWith } from './keeping.mjs';
import { findWay } from './ways.mjs';
import { MODES, milesADay } from './travel.mjs';
import { TIMELINE, ARRIVAL_MINUTES } from './directors.mjs';

export const SOUTH_FIGHTS = Object.freeze({ 'san-patricio': SAN_PATRICIO, 'agua-dulce': AGUA_DULCE });
const GONE = ['dead', 'captured'];
const momentOf = (world, key) => TIMELINE[key] - (world.director?.arrival ? 0 : ARRIVAL_MINUTES);

/** Whether this class's map has the south walked: San Patricio a village, the Agua Dulce ground and the road's end places. */
export const southWalkable = world => Boolean(world?.map?.sites?.['agua-dulce'] && world.map.sites['matamoros-road']
  && world.map.sites['san-patricio'] && !world.map.sites['san-patricio'].outside);

/** The country the south's places and roads lie in, in the game's miles: south of Goliad and Refugio, west of the bays. */
const SOUTH_BOX = Object.freeze({ minX: -45, maxX: 20, minY: 86, maxY: 140 });
const inSouth = p => p.x >= SOUTH_BOX.minX && p.x <= SOUTH_BOX.maxX && p.y >= SOUTH_BOX.minY && p.y <= SOUTH_BOX.maxY;

/**
 * A class on the real land saved before the south was walked gains it (docs/MAP_ACCURACY.md §13): the south's places from the
 * built map - San Patricio as a village, its crossing of the Nueces, the Agua Dulce ground, the end of the walked road, the
 * fords of the roads there - and the roads to them, with the creeks round those fords that a class keeps. Added, never moved:
 * nothing it had is changed but San Patricio, its crossing and the two outside roads drawn to it, which are the built map's.
 * No save version moves: an old class opens with the correct map, and every family's home, lane and road is what it was.
 * Returns whether it changed anything. Called at the save's door (server/storage.mjs), once; a no-op on every later load.
 */
export function openSouth(world) {
  const map = world?.map;
  if (map?.source !== 'texas-colonies-map' || !map.sites || !map.routes || southWalkable(world)) return false;
  const built = coloniesMap();
  const added = new Set();
  for (const place of Object.values(built.places)) {
    if (place.outside || !inSouth(place)) continue;
    if (map.sites[place.id] && !map.sites[place.id].outside) continue;
    map.sites[place.id] = siteOfPlace(place);
    added.add(place.id);
  }
  if (!added.size) return false;
  // The outside roads that ran to San Patricio are drawn now to where the built map draws them.
  for (const [id, route] of Object.entries(map.routes)) {
    if (route.kind === 'outside' && [route.from, route.to].some(end => added.has(end))) delete map.routes[id];
  }
  for (const road of built.roads) {
    if (![road.from, road.to].some(end => added.has(end))) continue;
    const route = routeOfRoad(road);
    map.routes[route.id] = route;
  }
  // The creek round each new ford, as sim/colonies-region.mjs keeps it (`CREEK_AT_CROSSING`), so no ford stands on dry ground.
  map.terrain ||= [];
  const have = new Set(map.terrain.map(feature => feature.id));
  for (const site of [...added].map(id => map.sites[id]).filter(one => one.waterKind === 'creek')) {
    const box = { minX: site.x - CREEK_AT_CROSSING, maxX: site.x + CREEK_AT_CROSSING, minY: site.y - CREEK_AT_CROSSING, maxY: site.y + CREEK_AT_CROSSING };
    const inBox = p => p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
    built.watercourses.forEach((course, index) => {
      if (course.name !== site.water || course.kind !== 'creek') return;
      creekRuns(course, inBox).forEach(({ points, cut }, part) => {
        const id = `water-south-${index}-${part}`;
        if (have.has(id)) return;
        have.add(id);
        map.terrain.push({ id, kind: 'creek', name: course.name, points: points.map(p => ({ x: p.x, y: p.y })), ...(cut.size && { cut: [...cut] }) });
      });
    });
  }
  return true;
}

/** Where the Matamoros men are: San Patricio where the class's map has it, Refugio (as before 2026-09-25) where it does not. */
export const southSite = world => southWalkable(world) ? 'san-patricio' : 'refugio';

const serving = (world, kind = 'matamoros') => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person'
  && person.service?.kind === kind && person.service.status === 'serving' && !GONE.includes(person.health?.condition));
const tell = (world, person, text, { claimId = 'FIC-GONZ-436', importance = 2, type = 'army', classification = 'FICTIONAL FOR GAMEPLAY' } = {}) =>
  record(world, type, { actorId: person.id, householdId: person.householdId, importance, classification, claimId, text });
const go = (world, person, to, eventId, beginTravel, purpose = 'march') => {
  const mode = modeWith(world, person);
  try { beginTravel(world, person, to, eventId, purpose, mode); }
  catch { try { beginTravel(world, person, to, eventId, purpose); } catch { /* ceiling: they stay where they are */ } }
};

/**
 * Whether a man sent south now would reach Johnson's men at San Patricio before the raid, and if not, why - in the family's
 * words (staging.md §4.6 fix 2, `FIC-GONZ-436`). His quickest honest way: on the family's horse if it has one free, else on
 * foot, by the roads, at the miles a day the travel model gives, with half a day to spare.
 */
export function southClosing(world, household, entity) {
  if (!southWalkable(world)) return null;
  const from = entity.location?.siteId || household?.homeSiteId;
  if (!from || from === 'san-patricio') return null;
  const horse = Object.values(world.entities).some(one => one.species === 'horse' && one.householdId === household?.id && !one.borrowedBy);
  const modeId = horse ? 'horse' : 'foot';
  const path = findWay(world, from, 'san-patricio', modeId) || findWay(world, from, 'san-patricio', 'foot');
  if (!path) return `There is no way from here to Johnson's men at San Patricio.`;
  const days = path.distance / milesADay(MODES[modeId].speed);
  if (world.minute + days * 1440 + 720 > momentOf(world, 'san-patricio-night')) return `${entity.name} would not reach Johnson's men at San Patricio before the end of the month.`;
  return null;
}

/**
 * The Matamoros men still at Refugio go on with Johnson and Grant to San Patricio (`HIST-TEX-513`): a class saved while its men
 * stood at Refugio, or a man who reached Refugio on the old errand. Only while the walk gets them there before the raid.
 */
export function walkOnSouth(world, { beginTravel }) {
  if (!southWalkable(world) || !beginTravel || world.minute >= momentOf(world, 'san-patricio-night')) return;
  for (const person of serving(world)) {
    if (person.travel || person.location?.siteId !== 'refugio' || person.service.fight) continue;
    if (person.service.party === 'agua-dulce' && world.director?.milestones?.['grant-rides']) continue;
    const eventId = tell(world, person, `${person.name} goes on from Refugio with the volunteers to San Patricio, on the Nueces, where Johnson and Grant have taken them.`, { claimId: 'HIST-TEX-513', classification: 'DOCUMENTED' });
    person.service.siteId = 'san-patricio';
    go(world, person, 'san-patricio', eventId, beginTravel);
  }
}

/**
 * About February 20 Grant rides south of the Nueces with part of the men to gather horses (`HIST-TEX-513`; the date is
 * `FIC-GONZ-436`): each man is put in Johnson's party or Grant's at the record's shares (`JOHNSON_SHARE`, as sim/alamo.mjs
 * `splitSouth` always has), and Grant's ride to the end of the walked road south. A man who joins after this is Johnson's.
 */
export function grantRides(world, { beginTravel }) {
  if (!southWalkable(world)) return;
  for (const person of serving(world)) {
    if (person.service.party) continue;
    person.service.party = share(world, person.id, 'party') < JOHNSON_SHARE ? 'san-patricio' : 'agua-dulce';
    if (person.service.party !== 'agua-dulce') continue;
    const eventId = tell(world, person, `${person.name} rides south over the Nueces with Dr. Grant's party, to gather horses in the country toward the Rio Grande.`, { claimId: 'HIST-TEX-513', classification: 'DOCUMENTED' });
    person.service.siteId = 'matamoros-road';
    if (!person.travel && person.location?.siteId !== 'matamoros-road') go(world, person, 'matamoros-road', eventId, beginTravel);
  }
}

// ---- The fights ---------------------------------------------------------------------------------------------------

/**
 * Where each fate lands in each fight: the part of the force the man is in, and the minute into the fight (from its first
 * minute) it happens, chosen from those by a share that is always the same for this class and this man (`FIC-GONZ-435`).
 * The fate itself is the roll `fightSouth` makes; only the moment and the place are staged.
 */
const STAGED = Object.freeze({
  'san-patricio': {
    // Night 0-120, the square 120-125, the houses 125-130, the last house 130-135, the prisoners after.
    killed: [{ part: 'square', at: 122 }, { part: 'house-b', at: 129 }, { part: 'house-c', at: 131 }, { part: 'square', at: 132 }],
    captured: [{ part: 'square', at: 125 }, { part: 'house-a', at: 125 }, { part: 'house-b', at: 130 }, { part: 'house-c', at: 130 }],
    escaped: [{ part: 'back-door', at: 133 }],
  },
  'agua-dulce': {
    // The drive 0-240, the last hour 240-300, the charge and the chase 300-320, the prisoners after.
    killed: [{ part: 'middle', at: 303 }, { part: 'middle', at: 307 }, { part: 'middle', at: 311 }, { part: 'middle', at: 316 }],
    captured: [{ part: 'drag', at: 311 }],
    escaped: [{ part: 'lead', at: 305 }],
  },
});
/** The roll `fightSouth` (sim/alamo.mjs) makes, exactly: so a man's fate is what it would have been before the engine. */
export function southFate(world, person, fight) {
  const rates = SOUTH_RATES[fight];
  const dies = 1 - (1 - rates.killed) ** frailty(person);
  const roll = share(world, person.id, fight);
  return roll < dies ? 'killed' : roll < dies + rates.captured ? 'captured' : 'escaped';
}
/** Where the men of a party wait for their fight: San Patricio for Johnson's, the end of the road south for Grant's. */
const MUSTER = Object.freeze({ 'san-patricio': 'san-patricio', 'agua-dulce': 'matamoros-road' });
const PLACE = Object.freeze({ 'san-patricio': 'San Patricio', 'agua-dulce': 'Agua Dulce Creek' });

function startFrom(travel, here) {
  const first = travel.points[0], gap = Math.hypot(first.x - here.x, first.y - here.y);
  if (gap < 1e-6) return;
  travel.points = [{ x: here.x, y: here.y }, ...travel.points];
  travel.distance += gap;
  if (travel.pace) travel.pace = travel.pace.map(([segment, factor]) => [segment + 1, factor]);
  if (travel.fords) travel.fords = travel.fords.map(ford => ({ ...ford, at: ford.at + gap }));
}
/** The nearest place of the map to a point in the fight, which a man standing there is said to be at. */
const nearestSite = (world, point, ids) => ids.map(id => world.map.sites[id]).filter(Boolean).sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y))[0]?.id;

/** Every tick of the second period on a map with the south: the men walk on, Grant's ride, and each fight is kept. */
export function advanceSouth(world, movement = {}) {
  if (world.period !== 2 || !southWalkable(world)) return;
  walkOnSouth(world, movement);
  for (const id of Object.keys(SOUTH_FIGHTS)) keepFight(world, id, movement);
  marchPrisoners(world, movement);
}

/**
 * Once both fights are over, the prisoners of each are marched south under guard toward Matamoros (`HIST-TEX-059`,
 * `HIST-TEX-510`), walked out of the walked country to the end of its road and never set down at Matamoros. Held where they
 * were taken until then: Urrea's men were about San Patricio and the Nueces until Agua Dulce was fought (`FIC-GONZ-436`).
 * ceiling: the guard marching with them is not drawn; a prisoner column on the engine is the way out.
 */
function marchPrisoners(world, { beginTravel } = {}) {
  const last = world.battles?.['agua-dulce'] && battleState(world, 'agua-dulce');
  if (!beginTravel || !last?.over) return;
  for (const [id, battle] of Object.entries(world.battles)) {
    if (!SOUTH_FIGHTS[id]) continue;
    for (const [pid, fate] of Object.entries(battle.fates || {})) {
      const person = world.entities[pid];
      if (fate.fate !== 'captured' || !person || person.service?.marched || person.travel || person.location?.siteId === 'matamoros-road') continue;
      person.service.marched = world.minute;
      person.service.siteId = 'matamoros-road';
      const here = { x: person.location.x, y: person.location.y };
      const eventId = tell(world, person, `The prisoners taken at ${PLACE[id]} are marched south under guard, toward Matamoros.`, { claimId: 'HIST-TEX-510', importance: 1, classification: 'DOCUMENTED' });
      try { beginTravel(world, person, 'matamoros-road', eventId, 'march'); if (person.travel) { startFrom(person.travel, here); person.location = { ...here, siteId: null }; } } catch { /* ceiling: they stay where they were taken */ }
    }
  }
}

function keepFight(world, id, { beginTravel } = {}) {
  const def = SOUTH_FIGHTS[id];
  armBattle(world, id, momentOf(world, def.startKey));
  const state = battleState(world, id);
  if (!state || state.before) return;
  const battle = state.battle;
  battle.fates ||= {};
  const contactFrom = state.phases.find(phase => phase.contact).from;
  // Who is in the force: every man of this party at its muster when the fight begins, until the first shot. A man still on
  // the road is not in it - the join is refused while he could not arrive (`southClosing`), so none should be.
  if (!state.over && world.minute < contactFrom) {
    for (const person of serving(world)) {
      if (person.service.party !== id || battle.participants[person.id] || person.travel) continue;
      if (person.location?.siteId !== MUSTER[id]) continue;
      const fate = southFate(world, person, id);
      const options = STAGED[id][fate];
      const staged = options[Math.floor(share(world, person.id, `${id}:moment`) * options.length)];
      battle.participants[person.id] = { householdId: person.householdId, joined: world.minute };
      battle.fates[person.id] = { fate, part: staged.part, at: battle.start + staged.at };
      person.service.fight = id;
      person.chore = null; person.task = 'rest';
    }
  }
  const ground = def.ground(world);
  const phase = state.phase;
  // Each man at his own place in his part of the force, walked there at a runner's pace, never set down (docs/BATTLES.md §6.7).
  if (!state.over) {
    const reach = Math.max(0.05, calendarMinutes(world) * 0.2);
    const members = Object.keys(battle.participants).map(pid => world.entities[pid]).filter(Boolean);
    members.forEach((person, index) => {
      const entry = battle.participants[person.id], fate = battle.fates[person.id];
      if (entry.released) return;
      const fallen = fate.fate === 'killed' && world.minute >= fate.at;
      if (!fallen) {
        const spec = phase.texian.parts?.find(part => part.id === fate.part) || phase.texian;
        const centre = placeOf(ground, spec, phase.minutes, Math.min(state.into, phase.minutes));
        const enemy = placeOf(ground, phase.mexican, phase.minutes, Math.min(state.into, phase.minutes));
        const dx = enemy.x - centre.x, dy = enemy.y - centre.y, span = Math.hypot(dx, dy);
        const facing = span > 1e-6 ? { x: dx / span, y: dy / span } : ground.toward;
        // Shut in a house, a man is drawn at its door; anywhere else, at his own scattered place in his part.
        const target = spec.pose === 'hidden'
          ? { x: centre.x + facing.x * 0.012, y: centre.y + facing.y * 0.012 }
          : placeFrom(centre, facing, looseSlot(person.id, index, spec.spread || { width: 0.04, depth: 0.03 }));
        const gap = Math.hypot(target.x - person.location.x, target.y - person.location.y), part = gap <= reach ? 1 : reach / gap;
        const at = { x: person.location.x + (target.x - person.location.x) * part, y: person.location.y + (target.y - person.location.y) * part };
        person.location = { ...at, siteId: nearestSite(world, at, [MUSTER[id], 'agua-dulce', 'san-patricio']) };
      }
      if (phase.contact && !Number.isFinite(entry.fought)) entry.fought = world.minute;
      // The moment his fate lands: what the world knows from now, and nobody's screen until the word (`tellSouth`).
      if (world.minute >= fate.at && !person.service.fate) {
        person.service.fate = fate.fate;
        if (fate.fate === 'killed') person.service.down = fate.at;
        const eventId = tell(world, person, `${person.name} was with ${id === 'san-patricio' ? 'Johnson\'s men at San Patricio' : 'Grant\'s party at Agua Dulce Creek'} when Urrea's cavalry came.`, { claimId: 'HIST-TEX-059', importance: 1, classification: 'DOCUMENTED' });
        awardGlory(world, { event: id, claimId: 'HIST-TEX-059', personId: person.id, householdId: person.householdId, role: 'fought', fromSiteId: MUSTER[id], causes: [eventId] });
      }
    });
  }
  alertAndSpotlight(world, id, state, ground);
  // The end of the fight: the escaped ride for Goliad, the prisoners are marched south, the dead lie where they fell.
  if (state.over) for (const [pid, entry] of Object.entries(battle.participants)) {
    if (entry.released) continue;
    entry.released = world.minute;
    const person = world.entities[pid], fate = battle.fates[pid];
    if (!person) continue;
    if (!person.service.fate) person.service.fate = fate.fate;
    const here = { x: person.location.x, y: person.location.y };
    if (fate.fate === 'escaped') {
      person.service = { kind: 'fannin', status: 'serving', since: world.minute, siteId: 'goliad', escapedFrom: id };
      const eventId = tell(world, person, `${person.name} got clear of the Mexican cavalry at ${PLACE[id]} and is riding for Fannin at Goliad.`, { claimId: 'HIST-TEX-514', importance: 1, classification: 'DOCUMENTED' });
      if (beginTravel) { go(world, person, 'goliad', eventId, beginTravel); if (person.travel) { startFrom(person.travel, here); person.location = { ...here, siteId: null }; } }
    } else if (fate.fate === 'captured') {
      // Held under guard where they were taken until the south's fighting is done (`marchPrisoners`).
      person.task = 'rest';
    } else {
      person.task = 'rest';
    }
  }
}

/** The card through the person, the Host's camera, both once (docs/BATTLES.md §2.1, §2.7). */
function alertAndSpotlight(world, id, state, ground) {
  const battle = state.battle, phase = state.phase;
  if (!state.live || !phase.contact) return;
  for (const [pid, entry] of Object.entries(battle.participants)) {
    const person = world.entities[pid];
    if (!person || battle.alerted[entry.householdId]) continue;
    // At the man's side, in the words of somebody beside him (staging.md §4.7), reconstructed: the moment it begins.
    const text = id === 'san-patricio'
      ? `At ${person.name}'s side in San Patricio, in the dark: "Soldiers in the square! They're at the doors!"`
      : `At ${person.name}'s side on the road to Agua Dulce Creek, one of the riders: "Horsemen in the trees ahead!"`;
    battle.alerted[entry.householdId] = { eventId: record(world, 'notice', { householdId: entry.householdId, actorId: person.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-435', text }), minute: world.minute, entityId: person.id, text };
  }
  if (!battle.spotlit) {
    battle.spotlit = world.minute;
    const field = fieldOf(ground, id);
    spotlight(world, { key: id, ...field, claimId: id === 'san-patricio' ? 'HIST-TEX-510' : 'HIST-TEX-511',
      text: id === 'san-patricio' ? 'San Patricio, three in the morning of February 27: Urrea\'s men are among the houses where Johnson\'s volunteers are asleep.' : 'Agua Dulce Creek, the morning of March 2: Urrea\'s dragoons charge out of two groves on Grant\'s party and its horses.' });
  }
}
/** The middle of the field, where the Host's camera and a student's Watch go. */
const fieldOf = (ground, id) => id === 'san-patricio' ? { x: ground.square.x, y: ground.square.y } : { x: ground.ground.x, y: ground.ground.y };

/**
 * What of the south a page is sent (docs/BATTLES.md §2.1, `FIC-GONZ-447`): the Host every fight live, its camera on the field
 * while it is fought; a household only while one of its own people is in it; nobody else anything. The fates of the men
 * drawn in it are sent only once each has happened. Null when there is nothing.
 */
export function southProjection(world, householdId, role) {
  if (world.period !== 2 || !world.battles) return null;
  for (const id of Object.keys(SOUTH_FIGHTS)) {
    const state = world.battles[id] ? battleState(world, id) : null;
    const battle = state?.battle;
    const own = householdId ? Object.entries(battle?.participants || {}).filter(([, entry]) => entry.householdId === householdId).map(([pid]) => pid) : [];
    const alert = role === 'student' && householdId ? southAlert(world, id, state, householdId) : null;
    const account = role === 'student' && householdId ? southAccountCard(world, id, householdId) : null;
    if (!state?.live) { if (account) return { account }; continue; }
    const members = Object.keys(battle.participants).filter(pid => world.entities[pid]);
    const view = () => ({ ...projectBattle(world, id, { members, memberParts: Object.fromEntries(members.map(pid => [pid, battle.fates[pid]?.part])), memberFates: battle.fates }), reconstruction: false });
    if (role === 'host') {
      const field = fieldOf(SOUTH_FIGHTS[id].ground(world), id);
      const fighting = world.minute >= state.contact;
      return { battle: view(), host: { focus: fighting ? 'battle' : 'regional', caption: `${SOUTH_FIGHTS[id].name}, live. Families with somebody there see it too; the rest have not heard.`, ...field } };
    }
    if (role === 'student' && own.length) return { battle: view(), ...(alert && { alert }), ...(account && { account }) };
    if (account) return { account };
  }
  return null;
}
function southAlert(world, id, state, householdId) {
  const alerted = world.battles?.[id]?.alerted?.[householdId];
  if (!alerted || !state?.live) return null;
  return { id: `battle:${id}:${householdId}`, entityId: alerted.entityId, title: id === 'san-patricio' ? 'San Patricio, in the night' : 'At Agua Dulce Creek', text: alerted.text, field: fieldOf(SOUTH_FIGHTS[id].ground(world), id), watching: true };
}
function southAccountCard(world, id, householdId) {
  const told = world.battles?.[id]?.told?.[householdId];
  if (!told || world.minute - told.minute > 1440) return null;
  const person = world.entities[told.entityId];
  if (!person) return null;
  return { id: `account:${id}:${householdId}`, entityId: person.id, title: `What happened at ${PLACE[id]}`, text: told.text };
}

/**
 * When the word of a southern fight reaches the families (sim/alamo.mjs `tellSouth`, the dates unchanged), each family that had
 * somebody in it is told what happened in plain words - what happened, what their person did, why it ended so, and what
 * became of him (docs/BATTLES.md §2.8; the account staging.md §4.8 gives). Through the family's own person at home: the one
 * who went is dead, a prisoner or away.
 */
export function tellSouthAccount(world, id) {
  const battle = world.battles?.[id];
  if (!battle) return;
  const byHousehold = {};
  for (const [pid, entry] of Object.entries(battle.participants || {})) (byHousehold[entry.householdId] ||= []).push(pid);
  for (const [householdId, ids] of Object.entries(byHousehold)) {
    if (battle.told[householdId]) continue;
    const household = world.households[householdId];
    const people = ids.map(pid => world.entities[pid]).filter(Boolean);
    if (!household || !people.length) continue;
    const text = southAccount(world, id, people.map(person => ({ person, fate: battle.fates[person.id] })));
    const teller = household.members.map(mid => world.entities[mid]).find(one => one?.kind === 'person' && !GONE.includes(one.health?.condition) && !ids.includes(one.id)) || people[0];
    const eventId = record(world, 'consequence', { householdId, actorId: teller.id, importance: 3, classification: 'DOCUMENTED', claimId: id === 'san-patricio' ? 'HIST-TEX-510' : 'HIST-TEX-511', text });
    battle.told[householdId] = { eventId, minute: world.minute, entityId: teller.id, text };
  }
}

/** The account, in plain words (staging.md §4.8), with each of the family's people in it. */
export function southAccount(world, id, men) {
  const did = ({ person, fate }) => {
    const name = person.name;
    if (id === 'san-patricio') {
      const where = { square: 'asleep by the fire on the square with Captain Pearson\'s men', 'house-a': 'asleep in one of the houses', 'house-b': 'asleep in the house whose men fired back', 'house-c': 'asleep in Colonel Johnson\'s house', 'back-door': 'asleep in Colonel Johnson\'s house' }[fate.part] || 'asleep in the town';
      const end = fate.fate === 'killed' ? `${name} was killed there.` : fate.fate === 'captured' ? `${name} was taken prisoner with the others and marched south toward Matamoros.` : `${name} got out the back with Johnson and a few others and away in the dark, and has gone to Colonel Fannin at Goliad.`;
      return `${name} was ${where} when the soldiers came. ${end}`;
    }
    const end = fate.fate === 'killed' ? `${name} was ridden down and killed in the chase.` : fate.fate === 'captured' ? `${name} gave up when the dragoons called that prisoners would be spared, and has been sent south toward Matamoros.` : `${name} broke clear and rode for Goliad, to Colonel Fannin.`;
    return `${name} was riding with the horses when the dragoons came out of the trees. ${end}`;
  };
  const happened = id === 'san-patricio'
    ? 'What happened: in January a few hundred volunteers set out to attack the Mexican town of Matamoros. Most turned back at Refugio, but some sixty stayed with Frank Johnson and James Grant and went on to San Patricio on the Nueces. Early on the morning of February 27, in the cold and wet, General Urrea\'s men came into San Patricio while Johnson\'s men were asleep - eight by a fire on the square and the rest in three houses. Local people who sided with the government had shown the soldiers which houses to surround. One house gave up at once; the men in another fired back and killed a Mexican officer; in a quarter of an hour it was over. Colonel Johnson and a few others got out a back door and away.'
    : 'What happened: while Johnson\'s men were at San Patricio, Dr. Grant had taken about two dozen men south of the Nueces to gather horses. On the morning of March 2 they were driving several hundred horses north, strung out behind them, toward San Patricio - not knowing it had already fallen. Between ten and eleven, near Agua Dulce Creek, Urrea\'s dragoons charged out of two groves of trees where they had been hiding. The men scattered and were ridden down as they ran. Grant was killed. Reuben Brown was lassoed and taken. Six men were made prisoner, and six got away toward Goliad.';
  const why = id === 'san-patricio'
    ? 'Why it ended so: Johnson\'s men were few, far from any help, and asleep. The Mexican army had come north faster than anybody expected, marching through the night in the rain, and the town\'s own people had shown the soldiers where the Texians were. Nobody had time to stand and fight together.'
    : 'Why it ended so: Grant\'s men were few, on tired horses, busy with the herd and not expecting an enemy - they did not know Urrea had already taken San Patricio. The dragoons chose their ground and came out of cover; men on scattered horses could not stand against a charge.';
  const disputed = id === 'san-patricio'
    ? 'The accounts do not agree: the Handbook of Texas says the prisoners were taken to Matamoros, and one later account says they were all dead within three days. The date and hour differ too - three in the morning of the 27th, or half past three on the 26th.'
    : 'The accounts do not agree on how many were with Grant (twenty-six, or about fifty) or exactly where the creek fight was - twenty-six miles below San Patricio, or near Banquete, ten.';
  return [happened, `What yours did: ${men.map(did).join(' ')}`, why, disputed].join('\n\n');
}

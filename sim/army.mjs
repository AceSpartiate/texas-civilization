// The gathering and the march: docs/COLONIES.md §5.5, build step 5.
//
// After the fight at Gonzales the volunteers who came in from the settlements were made into an
// army and marched for Béxar. This is that, as one body: it forms in the town, it takes everybody
// standing there who answered a call, it goes up the road, and a family's own volunteer is a
// person inside it who can be sent for and come home.
//
// Two things it deliberately is not. It is not a crowd - one formation moves, as the Gonzales
// formations do (`FIC-GONZ-006`), and the people in it are carried along rather than each walking
// their own path, which is what keeps a thirty-family class inside its tick budget. And it is not
// a battle: what happens at Béxar, and at Concepción and the Grass Fight on the way, is build
// step 6, researched before it is built.
import { record } from './events.mjs';
import { findWay } from './ways.mjs';
import { WALK_SPEED, moveOnGround } from './travel.mjs';
import { awardGlory } from './glory.mjs';
import { calendarMinutes } from './clock.mjs';
import { modeWith } from './keeping.mjs';

/** Where the volunteers were made into an army, and where they went. */
export const RENDEZVOUS = 'gonzales';
export const OBJECTIVE = 'bexar';
/**
 * How far the army makes in a day of 1835, on the march.
 *
 * Fourteen miles on a marching day: the research for Concepción (`HIST-TEX-019`) computed about
 * fourteen from the order book's camps, which fits a supply officer's "15 miles travel pr day".
 * It was ten until then, which happened to reach Béxar on the right date only because it hid the
 * nine days the army really spent halted; the halts are now their own (`advanceArmy`'s `hold`).
 * The pace is computed, not a measurement. Read against the calendar rather than the tick, like
 * every other pace since the two clocks (sim/clock.mjs), and spread over the whole day rather
 * than a marching morning, because the calendar is all this has to divide by.
 */
export const ARMY_MILES_PER_DAY = 14;
export const ARMY_MILES_PER_HOUR = ARMY_MILES_PER_DAY / 24;
/** How near the army somebody has to be to fall in with it. */
export const FALL_IN_MILES = 1.5;

/** The volunteers a household has out: anybody of theirs carrying an active promise to serve. */
export const volunteersOf = (world, householdId) => world.households[householdId].members
  .map(id => world.entities[id])
  .filter(person => person?.commitments?.some(promise => promise.id === 'volunteer' && promise.status === 'active'));

/** Whether this person is marching with the army right now. */
export const withTheArmy = (world, entityId) => Boolean(world.army?.members?.includes(entityId));

/**
 * The road the army takes, found once when it forms and kept.
 *
 * Kept rather than re-found each tick because it is the same road every tick and finding it is
 * the expensive part; re-anchored on the map's own sites, so a class saved by a later map opens
 * with its army on that map's road rather than on remembered coordinates.
 */
function roadToBexar(world) {
  const way = findWay(world, RENDEZVOUS, OBJECTIVE, 'foot');
  // The places along it are kept as well as the line, because somebody who leaves the column has
  // to start home from a place rather than from a point in a field (`callHome`).
  return way && { points: way.points, distance: way.distance, pace: way.pace?.length ? way.pace : null, ground: way.ground, nodes: way.nodes || [] };
}

/** The last place on the army's road it has actually passed: where a man who leaves it is standing. */
function lastPlacePassed(world) {
  const army = world.army;
  const passed = (army.road?.nodes || []).filter(node => node.at <= army.progress + 1e-9 && world.map.sites[node.id]);
  return passed.length ? passed[passed.length - 1].id : RENDEZVOUS;
}

/**
 * The army forms at Gonzales out of everybody standing there who answered a call to serve.
 *
 * Somebody still on the road is not in it - they fall in later, on the road, which is what a
 * volunteer arriving after the eleventh actually did. Nobody is put in it by being near it: a
 * person is in this list because their family said yes and they walked there.
 */
export function formArmy(world, causeId) {
  if (world.army) return world.army;
  const road = campaignRoad(world, roadToBexar(world));
  const site = world.map.sites[RENDEZVOUS];
  world.army = {
    phase: 'organised', x: site.x, y: site.y, siteId: RENDEZVOUS, members: [],
    progress: 0, road, formedMinute: world.minute, causeId: causeId || null,
  };
  fallIn(world, causeId);
  return world.army;
}

/** Whoever is standing with the army and has promised to serve joins it. */
function fallIn(world, causeId) {
  const army = world.army;
  for (const household of Object.values(world.households)) {
    for (const person of volunteersOf(world, household.id)) {
      if (army.members.includes(person.id) || person.travel) continue;
      if (['dead', 'captured'].includes(person.health.condition)) continue;
      const near = Math.hypot(person.location.x - army.x, person.location.y - army.y) <= FALL_IN_MILES;
      if (!near && person.location.siteId !== army.siteId) continue;
      army.members.push(person.id);
      if (army.phase === 'marching') marchingTravel(world, person);
      askDetachment(world, person);
      record(world, 'army', {
        actorId: person.id, householdId: household.id, importance: 2,
        classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-034', causes: causeId ? [causeId] : [],
        text: army.phase === 'organised'
          ? `${person.name} was mustered into the army at ${world.map.sites[army.siteId || RENDEZVOUS]?.name || 'the rendezvous'}.`
          : `${person.name} caught the army on the road and fell in.`,
      });
    }
  }
}

/**
 * Somebody marching is on a journey, because the world only knows two states for a person: at a
 * place, or on the road between two (`validateWorld`). Theirs is the army's own road and it is
 * `halted`, the state a rider who has reined in to talk is already in - the journey is real and
 * theirs, and the ground stops going past on its own account. `advanceArmy` is what moves them,
 * all together, which is the whole point of the army being one body rather than forty walkers.
 */
function marchingTravel(world, person) {
  const army = world.army;
  if (!army.road) return;
  person.travel = {
    from: RENDEZVOUS, to: OBJECTIVE, points: army.road.points, distance: army.road.distance,
    progress: army.progress, speed: WALK_SPEED, mode: 'foot', purpose: 'march', halted: true, silent: true,
  };
  person.location = { ...person.location, siteId: null };
}

/** Where a person standing with the army is drawn: in its ranks, four abreast, behind its point. */
function standInTheRanks(world) {
  const army = world.army;
  const points = army.road?.points;
  const ahead = points?.length > 1 ? points[points.length - 1] : { x: army.x + 1, y: army.y };
  const dx = ahead.x - army.x, dy = ahead.y - army.y, span = Math.hypot(dx, dy) || 1;
  const back = { x: -dx / span, y: -dy / span }, side = { x: dy / span, y: dx / span };
  army.members.forEach((id, slot) => {
    const person = world.entities[id];
    // Only a journey of the army's own: somebody sent for is on a road of their own and is out of
    // the ranks already, and nobody is dragged out of a journey they were given by anything else.
    if (!person || (person.travel && person.travel.purpose !== 'march')) return;
    if (person.travel) person.travel.progress = army.progress;
    const row = Math.floor(slot / 4), column = (slot % 4) - 1.5;
    person.location = {
      x: army.x + back.x * (0.06 + row * 0.035) + side.x * column * 0.035,
      y: army.y + back.y * (0.06 + row * 0.035) + side.y * column * 0.035,
      siteId: person.travel ? null : army.siteId,
    };
  });
}

/** What the army is at, recorded once for everybody in it: the part their family took. */
export function recordPresent(world, event, { claimId, causes = [] }) {
  if (!world.army) return;
  if (!world.participation) world.participation = {};
  const taking = world.participation[event] ??= {};
  for (const id of world.army.members) {
    const person = world.entities[id];
    if (!person || !person.householdId || taking[id]) continue;
    taking[id] = { householdId: person.householdId, role: 'present', minute: world.minute };
    awardGlory(world, { event, claimId, personId: id, householdId: person.householdId, role: 'present', fromSiteId: world.army.siteId || RENDEZVOUS, causes });
  }
}

/** The army takes the road. */
export function marchOut(world, causeId) {
  const army = world.army;
  if (!army || army.phase === 'marching') return;
  army.phase = 'marching';
  army.leftMinute = world.minute;
  army.siteId = null;
  for (const id of army.members) { const person = world.entities[id]; if (person) marchingTravel(world, person); }
  record(world, 'army', {
    visibility: 'public', importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-034',
    causes: causeId ? [causeId] : [], text: `The army marched out of ${world.map.sites[RENDEZVOUS].name} for ${world.map.sites[OBJECTIVE].name}.`,
  });
}

/**
 * The army on the road, and everybody it carries, once a tick.
 *
 * The miles are read off the calendar like every other pace (sim/clock.mjs): a tick that carries
 * half a day of 1835 carries half a day's marching with it, which is what lets a fortnight's
 * march happen inside a lesson without anybody on the screen moving unnaturally fast.
 */
export function advanceArmy(world, { hold = null } = {}) {
  const army = world.army;
  if (!army) return;
  // An army formed before the campaign road existed gets it now, keeping the miles it has made.
  if (army.road && !army.road.campaign) {
    army.road = campaignRoad(world, army.road);
    for (const id of army.members) { const person = world.entities[id]; if (person?.travel?.purpose === 'march') marchingTravel(world, person); }
  }
  // Not on the tick it steps off: the order is given at that hour and the ground starts going
  // past afterwards. Without this the march gets one free tick, which at half a day a tick is
  // half a day of marching nobody watched.
  if (army.phase === 'marching' && army.road && army.leftMinute !== world.minute) {
    const miles = ARMY_MILES_PER_HOUR * (calendarMinutes(world) / 60);
    // Held where the order book holds it, by the date (sim/directors.mjs decides which hold applies).
    const limit = hold && army.road.stops?.[hold] !== undefined ? army.road.stops[hold] : army.road.distance;
    if (army.progress < limit) {
      const moved = moveOnGround(army.road.points, army.road.pace, army.road.distance, army.progress, miles);
      army.progress = Math.min(limit, moved.progress);
    }
    const at = pointAt(army.road.points, army.progress);
    army.x = at.x; army.y = at.y;
    // ceiling: the army never stands in a town again once it has marched: its camps are points on its own road, and
    // somebody in it stays on the army's journey. The dead and the sent-for are the ones who leave it.
  }
  army.camp = army.phase === 'marching' ? campOf(army, hold) : null;
  // Somebody who reached the rendezvous late, or caught the column up, falls in where they are.
  fallIn(world, army.causeId);
  standInTheRanks(world);
}

/** Why this person cannot be sent for, in the words the control shows. */
export function callHomeRefusal(world, householdId, entity) {
  if (!world.army) return 'There is no army yet.';
  if (!entity || entity.householdId !== householdId) return 'That is not your family.';
  if (!withTheArmy(world, entity.id)) return `${entity.name} is not with the army.`;
  if (['dead', 'captured'].includes(entity.health.condition)) return `${entity.name} cannot be sent for.`;
  return null;
}

/**
 * A family sends for its volunteer, and they start home from wherever the army has got to.
 *
 * Leaving is always allowed while the class runs. Nobody is court-martialled and nothing is
 * refused on a rule a student could not see: what it costs is the part they would have taken,
 * which the glory ledger already stopped adding to the moment they stepped out of the ranks.
 */
export function callHome(world, householdId, entity, { beginTravel }) {
  const army = world.army;
  army.members = army.members.filter(id => id !== entity.id);
  if (army.detachment?.asks?.[entity.id]) delete army.detachment.asks[entity.id];
  // Out of the column and standing on the road again. A marching man holds a journey of the
  // army's own (`marchingTravel`), and a journey cannot be begun from inside another one - so he
  // is put at the last place the army actually passed and starts home from there.
  // ceiling: the last place passed, not the spot on the road. The road's places are miles apart,
  // so a man can gain or lose a few miles by leaving between two of them.
  if (entity.travel?.purpose === 'march') {
    const at = lastPlacePassed(world), site = world.map.sites[at];
    entity.travel = null;
    entity.location = { x: site.x, y: site.y, siteId: at };
  }
  const promise = entity.commitments?.find(p => p.id === 'volunteer' && p.status === 'active');
  if (promise) promise.status = 'ended';
  const causeId = record(world, 'army', {
    actorId: entity.id, householdId, importance: 2,
    classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-034',
    text: `${entity.name} left the army and started home.`,
  });
  // On the horse they rode to the gathering, if it marched with them (sim/keeping.mjs); on foot if that way home is shut
  // (the wagon at a ford), because leaving the army is never refused.
  const home = world.households[householdId].homeSiteId, mode = modeWith(world, entity);
  try { beginTravel(world, entity, home, causeId, 'home', mode); } catch (error) { if (mode === 'foot') throw error; beginTravel(world, entity, home, causeId, 'home'); }
  return causeId;
}

/** A point along a line of points, by miles travelled. Shared shape with `sim/world.mjs`'s own. */
function pointAt(points, progress) {
  let left = progress;
  for (let i = 1; i < points.length; i++) {
    const span = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (left <= span || i === points.length - 1) {
      const part = span ? Math.min(1, left / span) : 0;
      return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * part, y: points[i - 1].y + (points[i].y - points[i - 1].y) * part };
    }
    left -= span;
  }
  return points[points.length - 1];
}

/** What a family is told about the army: where it is, who of theirs is in it, and how far off. */
export function armyProjection(world, householdId) {
  const army = world.army;
  if (!army || !householdId) return null;
  const mine = army.members.filter(id => world.entities[id]?.householdId === householdId);
  const home = world.map.sites[world.households[householdId].homeSiteId];
  return {
    phase: army.phase,
    at: army.camp || (army.siteId ? world.map.sites[army.siteId]?.name : 'on the road'),
    ...(army.camp && { camp: army.camp }),
    miles: Math.round(Math.hypot(army.x - home.x, army.y - home.y) * 10) / 10,
    ours: mine.map(id => ({ id, name: world.entities[id].name, ...(army.detachment?.asks?.[id] && { detachment: army.detachment.asks[id] }) })),
    // What the whole class sent, which is a public fact: the town watched them go.
    strength: army.members.length,
  };
}

/** Everything that must be true of an army in a saved class. */
export function armyInvalid(world) {
  const army = world.army;
  if (!army) return null;
  if (!['organised', 'marching', 'arrived'].includes(army.phase)) return 'Invalid army phase';
  if (!Array.isArray(army.members) || new Set(army.members).size !== army.members.length) return 'The army holds somebody twice';
  for (const id of army.members) {
    const person = world.entities[id];
    if (!person || person.kind !== 'person' || !person.householdId) return 'The army holds somebody who is not a person of a household';
  }
  if (!Number.isFinite(army.x) || !Number.isFinite(army.y) || !Number.isFinite(army.progress)) return 'The army stands nowhere';
  if (army.siteId && !world.map.sites[army.siteId]) return 'The army stands at a place that is not there';
  if (army.detachment && Object.values(army.detachment.asks || {}).some(answer => !['open', 'go', 'stay'].includes(answer))) return 'Invalid detachment';
  return null;
}

// ------------------------------------------------------------------------------------ build step 6: Concepción
//
// docs/COLONIES.md §6i, researched in docs/battle-research/concepcion.md and decided by the owner (§7a). The army did not
// march into Béxar. It halted on the Cibolo to wait for reinforcements (Oct 16-19), camped on the Salado five miles from the
// town (Oct 20-26), went south down the river to Mission Espada (Oct 26-27), and on Oct 28 a detachment of about ninety
// under Bowie and Fannin fought at Mission Concepción while the main body was still at Espada (`HIST-TEX-019` to `-021`).

/** Where the halts are, in road miles from Gonzales. The Cibolo crossing is estimated; the Salado camp "within less than five miles of Bejar". */
export const CIBOLO_MILES = 40;
export const SALADO_SHORT_MILES = 5;
/** The missions, in miles from Béxar's plaza, from their coordinates (Espada 29.3178 N 98.4731 W; Concepción 29.3906 N 98.4926 W). */
export const MISSIONS = Object.freeze({
  espada: { name: 'Mission Espada', dx: 1.24, dy: 7.35 },
  concepcion: { name: 'Mission Concepción', dx: 0.06, dy: 2.32 },
});
/** Where the army is held, by the date, in the order it reaches them. */
export const HOLDS = Object.freeze(['cibolo', 'salado', 'espada']);
const CAMP_NAMES = { cibolo: 'the Cibolo', salado: 'the Salado', espada: MISSIONS.espada.name, concepcion: MISSIONS.concepcion.name };

/**
 * The owner's bound, 2026-09-16 (§7a): about one in a hundred for somebody in the fight, weighted by hidden strength and
 * health, and never more than one death in a class. One of about ninety-two was killed (`HIST-TEX-020`); wounds were
 * none to two, so about two in a hundred.
 */
export const CONCEPCION_DEATH_RISK = 0.011;
export const CONCEPCION_WOUND_RISK = 0.02;
/** A wound mends in three days of 1835, as every minor injury in this game does. */
const MEND_MINUTES = 4320;

const unit = text => { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; };

/**
 * The army's road once it is a campaign: the road from Gonzales as far as the Salado camp, then south to Espada and on to
 * Concepción. Built when the army forms, and for an army formed before this the first time it moves, keeping its miles.
 */
function campaignRoad(world, base) {
  const bexar = world.map.sites[OBJECTIVE];
  if (!base || !bexar) return base;
  const salado = Math.max(0, base.distance - SALADO_SHORT_MILES);
  const points = [];
  let walked = 0;
  for (let i = 0; i < base.points.length; i++) {
    if (i === 0) { points.push(base.points[0]); continue; }
    const span = Math.hypot(base.points[i].x - base.points[i - 1].x, base.points[i].y - base.points[i - 1].y);
    if (walked + span >= salado) { points.push(pointAt(base.points, salado)); break; }
    walked += span;
    points.push(base.points[i]);
  }
  const espada = { x: bexar.x + MISSIONS.espada.dx, y: bexar.y + MISSIONS.espada.dy };
  const concepcion = { x: bexar.x + MISSIONS.concepcion.dx, y: bexar.y + MISSIONS.concepcion.dy };
  const last = points[points.length - 1];
  const toEspada = Math.hypot(espada.x - last.x, espada.y - last.y), toConcepcion = Math.hypot(concepcion.x - espada.x, concepcion.y - espada.y);
  return {
    points: [...points, espada, concepcion], distance: salado + toEspada + toConcepcion, pace: null, ground: null,
    nodes: (base.nodes || []).filter(node => node.at <= salado), campaign: true,
    stops: { cibolo: Math.min(CIBOLO_MILES, salado), salado, espada: salado + toEspada },
  };
}

/** Where the army camps now, or null while it is on the road. */
const campOf = (army, hold) => {
  const stop = hold ? army.road?.stops?.[hold] : undefined;
  if (stop !== undefined && army.progress >= stop - 1e-6) return CAMP_NAMES[hold];
  if (army.road?.campaign && army.progress >= army.road.distance - 1e-6) return CAMP_NAMES.concepcion;
  return null;
};

/** Frailty for the fight: about 0.4 for somebody strong and hale, 1.6 for somebody weak and frail, 1 for somebody unknown. */
export function frailty(person) {
  const strength = person?.traits?.strength, health = person?.traits?.health;
  if (!Number.isFinite(strength) || !Number.isFinite(health)) return 1;
  const fit = ((strength - 1) / 9 + (health - 2) / 16) / 2;
  return Math.max(0.4, Math.min(1.6, 1.6 - 1.2 * fit));
}

/** Bowie and Fannin take a division ahead to the missions, October 22: every family with somebody in the ranks is asked. */
export function openDetachment(world, causeId) {
  const army = world.army;
  if (!army || army.detachment) return;
  army.detachment = { asks: {}, causeId: causeId || null, closed: false };
  for (const id of army.members) askDetachment(world, world.entities[id]);
}

function askDetachment(world, person) {
  const army = world.army, detachment = army?.detachment;
  if (!detachment || detachment.closed || !person || detachment.asks[person.id]) return;
  const household = world.households[person.householdId];
  // A family nobody plays decides for itself, about as often as the army did: some ninety of four hundred.
  if (!household?.played && world.neighbours) {
    detachment.asks[person.id] = unit(`${world.seed}:${person.id}:detachment`) < 0.23 ? 'go' : 'stay';
    return;
  }
  detachment.asks[person.id] = 'open';
  record(world, 'pressure', {
    actorId: person.id, householdId: person.householdId, importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-TEX-019',
    causes: detachment.causeId ? [detachment.causeId] : [],
    text: `Bowie and Fannin are taking a division ahead to the missions below Béxar. Does ${person.name} go with them, or stay with the main army?`,
  });
}

/** Why this answer cannot be given now, in the words the control shows. */
export function detachmentRefusal(world, householdId, entity) {
  const detachment = world.army?.detachment;
  if (!detachment || detachment.closed) return 'Nobody is being asked to go ahead now.';
  if (!entity || entity.householdId !== householdId) return 'That is not your family.';
  if (!withTheArmy(world, entity.id)) return `${entity.name} is not with the army.`;
  if (detachment.asks[entity.id] !== 'open') return `${entity.name} has already been answered for.`;
  return null;
}

/** The family's answer: go ahead with Bowie and Fannin, or stay with the main body. */
export function answerDetachment(world, householdId, entity, go) {
  const why = detachmentRefusal(world, householdId, entity);
  if (why) throw new Error(why);
  world.army.detachment.asks[entity.id] = go ? 'go' : 'stay';
  record(world, 'choice', {
    actorId: entity.id, householdId, importance: 2, decision: go ? 'detachment-go' : 'detachment-stay',
    text: go ? `${entity.name} went ahead with Bowie and Fannin's division.` : `${entity.name} stayed with the main army.`,
  });
}

/** The army moves to the missions: anybody not answered for stays with the main body, and is told so. */
export function closeDetachment(world) {
  const detachment = world.army?.detachment;
  if (!detachment || detachment.closed) return;
  for (const [id, answer] of Object.entries(detachment.asks)) {
    if (answer !== 'open') continue;
    detachment.asks[id] = 'stay';
    const person = world.entities[id];
    if (person) record(world, 'choice', { actorId: id, householdId: person.householdId, importance: 2, decision: 'detachment-stay', text: `Nobody answered, so ${person.name} stayed with the main army.` });
  }
  detachment.closed = true;
}

/**
 * The fight at Concepción, October 28 (`HIST-TEX-020`, `-021`). Everybody of the class in the detachment fought; everybody
 * else with the army was at Espada and was present. Each fighter's fate is rolled against the owner's bound, weighted by
 * their hidden strength and health, and the most likely death is the only one there can be. A woman sent to fight is
 * judged as the owner decided (docs/MONEY_AND_GLORY.md §4): her ordinary award if she comes through, twice it taken away if
 * she does not. Returns what happened, for the tests.
 */
export function fightConcepcion(world, causeId) {
  const army = world.army;
  if (!army) return { fought: [], present: [], killed: [], wounded: [] };
  closeDetachment(world);
  const asks = army.detachment?.asks || {};
  const fought = army.members.filter(id => asks[id] === 'go');
  const present = army.members.filter(id => asks[id] !== 'go');
  if (!world.participation) world.participation = {};
  const taking = world.participation.concepcion ??= {};
  const bexar = world.map.sites[OBJECTIVE];
  const fates = fought.map(id => {
    const person = world.entities[id], weight = frailty(person);
    return { id, person, roll: unit(`${world.seed}:${id}:concepcion`), death: CONCEPCION_DEATH_RISK * weight, wound: CONCEPCION_WOUND_RISK * weight };
  }).sort((a, b) => a.roll / a.death - b.roll / b.death);
  const killed = [], wounded = [];
  for (const fate of fates) {
    const { person } = fate;
    const dies = killed.length === 0 && fate.roll < fate.death;
    const hurt = !dies && fate.roll < fate.death + fate.wound;
    taking[person.id] = { householdId: person.householdId, role: 'fought', minute: world.minute };
    const woman = person.sex === 'female';
    const base = awardGlory(world, { event: 'concepcion', claimId: 'HIST-TEX-020', personId: person.id, householdId: person.householdId, role: 'fought', fromSiteId: OBJECTIVE, causes: causeId ? [causeId] : [], ...(woman && dies && { adjust: points => -2 * points, note: 'In 1835, sending a woman to fight was held against a family. (This is the game’s own reading of the period, not a documented judgement.)' }) });
    void base;
    if (dies) {
      killed.push(person.id);
      army.members = army.members.filter(member => member !== person.id);
      person.health = { condition: 'dead' };
      person.travel = null;
      person.task = 'rest';
      person.location = { x: bexar.x + MISSIONS.concepcion.dx, y: bexar.y + MISSIONS.concepcion.dy, siteId: OBJECTIVE };
      const promise = person.commitments?.find(p => p.id === 'volunteer' && p.status === 'active');
      if (promise) promise.status = 'ended';
      record(world, 'consequence', {
        actorId: person.id, householdId: person.householdId, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-039', causes: causeId ? [causeId] : [],
        text: `${person.name} was killed in the fight at Mission Concepción on the morning of October 28, and was buried there under the pecans by the river.`,
      });
    } else if (hurt) {
      wounded.push(person.id);
      person.health = { condition: 'minor-injury', recoversAt: world.minute + MEND_MINUTES };
      record(world, 'consequence', {
        actorId: person.id, householdId: person.householdId, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-039', causes: causeId ? [causeId] : [],
        text: `${person.name} was hurt in the fight at Mission Concepción, and will be days mending.`,
      });
    } else {
      record(world, 'consequence', {
        actorId: person.id, householdId: person.householdId, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-039', causes: causeId ? [causeId] : [],
        text: `${person.name} fought with Bowie and Fannin's men at Mission Concepción and came through unhurt.`,
      });
    }
  }
  for (const id of present) {
    const person = world.entities[id];
    if (!person?.householdId || taking[id]) continue;
    taking[id] = { householdId: person.householdId, role: 'present', minute: world.minute };
    awardGlory(world, { event: 'concepcion', claimId: 'HIST-TEX-021', personId: id, householdId: person.householdId, role: 'present', fromSiteId: OBJECTIVE, causes: causeId ? [causeId] : [] });
    record(world, 'army', { actorId: id, householdId: person.householdId, importance: 2, classification: 'DOCUMENTED', claimId: 'HIST-TEX-021', text: `${person.name} was with the main army at Espada, and came up an hour after the fight was over.` });
  }
  return { fought, present, killed, wounded };
}

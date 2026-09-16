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
function fallIn(world, causeId, { beginTravel } = {}) {
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
      for (const key of Object.keys(army.questions || {})) askQuestion(world, key, person, { beginTravel });
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
export function advanceArmy(world, { hold = null, beginTravel } = {}) {
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
  fallIn(world, army.causeId, { beginTravel });
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
    ours: mine.map(id => {
      // The November questions still open, with this person's answer so far, and the words for the one still to answer
      // (`ARMY_QUESTIONS`): the server's words, so the card never says anything the server did not.
      const name = world.entities[id].name;
      const questions = Object.entries(army.questions || {}).filter(([, q]) => !q.closed && q.asks[id]).map(([key, q]) => {
        const spec = ARMY_QUESTIONS[key], answer = q.asks[id];
        return { key, answer, ...(answer === 'open' ? { ask: spec.ask(name), yes: spec.yes(name), no: spec.no(name) } : { said: spec.said[answer](name) }) };
      });
      return { id, name, ...(army.detachment?.asks?.[id] && { detachment: army.detachment.asks[id] }), ...(questions.length && { questions }) };
    }),
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
  for (const [key, question] of Object.entries(army.questions || {})) {
    if (!ARMY_QUESTIONS[key]) return 'The army asked a question that does not exist';
    if (Object.values(question.asks || {}).some(answer => !['open', 'yes', 'no', 'silent'].includes(answer))) return 'Invalid answer to an army question';
  }
  if (army.road?.campKey && !SIEGE_CAMPS[army.road.campKey]) return 'The army is camped at a camp that does not exist';
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
 * Concepción's rates, from the record and rounded as the owner allows (2026-09-16, docs/COLONIES.md §7a): one of about
 * ninety-two killed (`HIST-TEX-020`; docs/battle-research/concepcion.md §6, 1.1%) is 1 in 100; none to two wounded (0–2.2%)
 * is 2 in 100. Each fighter is rolled on their own (`rollFates`), weighted by hidden strength and health, with no limit on
 * how many a class loses.
 */
export const CONCEPCION_DEATH_RISK = 0.01;
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
  // A siege camp's own short road (`moveCamp`): named once the army has reached it.
  if (army.road?.camp && army.progress >= army.road.distance - 1e-6) return army.road.camp;
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

/**
 * Each fighter's fate in one battle, rolled on its own at the battle's recorded rates (owner, 2026-09-16: "Keep it inline
 * with % of casualties from the actual battle"). There is no limit on how many a fight or a class can lose: a crowd at a
 * battle where many died loses many. `death` and `wound` are the record's shares of those engaged; frailty weights each as
 * 1 − (1 − rate)^frailty, which is rate × frailty for a small rate (1.6 × 2% ≈ 3.2%) and stays at 1 for a rate of 1, so a
 * battle nobody survived still kills the strongest. One roll per person, seeded by the battle's name, so a fight replays
 * the same. Returns [{ id, person, fate: 'killed' | 'wounded' | 'unhurt' }] in the order given.
 * ceiling: frailty weights every battle alike; an execution like Goliad's, where strength saved nobody, would want a
 * rate given without the weighting (an option here) once that arc is built from its research.
 */
export function rollFates(world, ids, { event, death, wound }) {
  const weighted = (rate, weight) => 1 - (1 - Math.max(0, Math.min(1, rate))) ** weight;
  return ids.map(id => {
    const person = world.entities[id], weight = frailty(person);
    const roll = unit(`${world.seed}:${id}:${event}`), dies = weighted(death, weight);
    const fate = roll < dies ? 'killed' : roll < dies + weighted(wound, weight) ? 'wounded' : 'unhurt';
    return { id, person, fate };
  });
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
 * else with the army was at Espada and was present. Each fighter's fate is rolled on its own at the battle's recorded
 * rates, weighted by their hidden strength and health (`rollFates`), however many that kills. A woman sent to fight is
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
  const killed = [], wounded = [];
  for (const { person, fate } of rollFates(world, fought, { event: 'concepcion', death: CONCEPCION_DEATH_RISK, wound: CONCEPCION_WOUND_RISK })) {
    const dies = fate === 'killed', hurt = fate === 'wounded';
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

// ------------------------------------------------------------------------------------ build step 6: the siege and the Grass Fight
//
// docs/COLONIES.md §6k, researched in docs/battle-research/grass-fight.md and decided by the owner (§7b). After November 2
// the army sat outside Béxar and did not storm it: camped above the town, split with headquarters back at Concepción for a
// week, united at the old mill on November 15 (`HIST-TEX-026`). Men went home for winter clothing and some came back
// (`HIST-TEX-027`); Austin ordered a storm on the 21st that fewer than a hundred would obey, and on the 24th the army
// pledged to stay and elected Burleson (`HIST-TEX-028`). On the 26th Bowie's horsemen and Jack's infantry, drawn across
// companies, caught a pack train they thought carried silver and found grass; nobody was killed (`HIST-TEX-031`, `-032`).

/**
 * The siege camps, in miles east and south of Béxar's plaza. The mill is "about one-half mile north of the main plaza"
 * (TSHA) to "1½ miles above" (Austin); the sources disagree and no coordinate fixes it, so a mile north is this game's
 * estimate (`FIC-GONZ-040`). The camp above the town, October 31 to November 8, was the same ground.
 */
export const SIEGE_CAMPS = Object.freeze({
  above: { name: 'the camp above Béxar', dx: 0, dy: -1 },
  concepcion: { name: MISSIONS.concepcion.name, dx: MISSIONS.concepcion.dx, dy: MISSIONS.concepcion.dy },
  mill: { name: 'the old mill above Béxar', dx: 0, dy: -1 },
});

/** The army moves to a siege camp: a short road of its own from where it stands, kept like the campaign road. */
export function moveCamp(world, key) {
  const army = world.army, bexar = world.map.sites[OBJECTIVE], camp = SIEGE_CAMPS[key];
  if (!army?.road || !bexar || !camp) return;
  const from = { x: army.x, y: army.y }, to = { x: bexar.x + camp.dx, y: bexar.y + camp.dy };
  // Somebody who leaves the army from here starts home from the last place it passed, as on the march.
  const at = lastPlacePassed(world);
  army.road = {
    points: [from, to], distance: Math.hypot(to.x - from.x, to.y - from.y), pace: null, ground: null,
    nodes: [{ id: at, at: 0 }], campaign: true, stops: {}, camp: camp.name, campKey: key,
  };
  army.progress = 0;
  for (const id of army.members) { const person = world.entities[id]; if (person?.travel?.purpose === 'march') marchingTravel(world, person); }
}

/**
 * The questions the army put to a family's volunteer in November, each asked on that person's own card (owner, §7b: only
 * the family member away serving is asked). What either answer risks is never said. A family nobody plays answers for
 * itself about as often as the army did.
 */
// Frozen once the storming's questions have joined it, below.
export const ARMY_QUESTIONS = {
  // Austin's order of November 21 to storm next morning: "not more than 100 men" of about six hundred would go.
  storm: {
    claimId: 'HIST-TEX-028', unplayed: 0.17,
    ask: name => `Austin has ordered Béxar stormed at dawn. Will ${name} go in?`,
    yes: name => `${name} goes in when the order comes`, no: name => `${name} will not go in`,
    said: { yes: name => `${name} said they would go in when Béxar was stormed.`, no: name => `${name} would not go in.`, silent: name => `Nobody answered for ${name}, so they were not counted among those who would go in.` },
  },
  // The parade of November 24: 405 of about six hundred "pledged themselves to remain".
  pledge: {
    claimId: 'HIST-TEX-028', unplayed: 0.68,
    ask: name => `The army is paraded to see who will stay before Béxar under a commander they elect. Does ${name} pledge to stay?`,
    yes: name => `${name} pledges to stay`, no: name => `${name} goes home`,
    said: { yes: name => `${name} pledged to stay before Béxar.`, no: name => `${name} did not pledge, and started home.`, silent: name => `Nobody answered for ${name}, who stayed in camp without pledging.` },
  },
  // November 26: Bowie's horsemen and Jack's infantry "from different companies", about a third of the camp.
  grass: {
    claimId: 'HIST-TEX-032', unplayed: 0.33,
    ask: name => `Deaf Smith has ridden in: a Mexican pack train is coming in from the west, and the camp says it carries the silver to pay the garrison. Bowie and Jack are taking men out after it. Does ${name} go?`,
    yes: name => `${name} goes out after the train`, no: name => `${name} stays in camp`,
    said: { yes: name => `${name} went out after the pack train.`, no: name => `${name} stayed in camp.`, silent: name => `Nobody answered for ${name}, who stayed in camp.` },
  },
};

/** Open a question to every volunteer in the ranks. */
export function openQuestion(world, key, causeId, { beginTravel } = {}) {
  const army = world.army;
  if (!army || !ARMY_QUESTIONS[key]) return;
  army.questions ??= {};
  if (army.questions[key]) return;
  army.questions[key] = { asks: {}, closed: false, openedMinute: world.minute, causeId: causeId || null };
  for (const id of [...army.members]) askQuestion(world, key, world.entities[id], { beginTravel });
}

function askQuestion(world, key, person, { beginTravel } = {}) {
  const question = world.army?.questions?.[key], spec = ARMY_QUESTIONS[key];
  if (!question || question.closed || !person || question.asks[person.id]) return;
  // A question put to only some of the camp: the reinforcement of December 8 is asked of those who did not go in.
  if (spec.who && !spec.who(world, person)) return;
  const household = world.households[person.householdId];
  if (!household?.played && world.neighbours) {
    const answer = unit(`${world.seed}:${person.id}:${key}`) < spec.unplayed ? 'yes' : 'no';
    question.asks[person.id] = answer;
    record(world, 'army', { actorId: person.id, householdId: person.householdId, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-040', text: spec.said[answer](person.name) });
    settleAnswer(world, key, person, answer, { beginTravel });
    return;
  }
  question.asks[person.id] = 'open';
  record(world, 'pressure', {
    actorId: person.id, householdId: person.householdId, importance: 3, classification: 'DOCUMENTED', claimId: spec.claimId,
    causes: question.causeId ? [question.causeId] : [], text: spec.ask(person.name),
  });
}

/** Whether a family somebody plays still has a question in front of it: the calendar slows to the hour while one does. */
export const questionOpen = world => Object.values(world.army?.questions || {}).some(question => !question.closed
  && Object.entries(question.asks).some(([id, answer]) => answer === 'open' && world.households[world.entities[id]?.householdId]?.played));

/** Why this answer cannot be given now, in the words the control shows. */
export function questionRefusal(world, householdId, entity, key) {
  const question = world.army?.questions?.[key];
  if (!ARMY_QUESTIONS[key]) return 'There is no such question.';
  if (!question || question.closed) return 'Nobody is being asked that now.';
  if (!entity || entity.householdId !== householdId) return 'That is not your family.';
  if (!withTheArmy(world, entity.id)) return `${entity.name} is not with the army.`;
  if (question.asks[entity.id] !== 'open') return `${entity.name} has already been answered for.`;
  return null;
}

/** The family's answer for its volunteer. */
export function answerQuestion(world, householdId, entity, key, yes, { beginTravel } = {}) {
  const why = questionRefusal(world, householdId, entity, key);
  if (why) throw new Error(why);
  const answer = yes ? 'yes' : 'no';
  world.army.questions[key].asks[entity.id] = answer;
  record(world, 'choice', { actorId: entity.id, householdId, importance: 2, decision: `${key}-${answer}`, text: ARMY_QUESTIONS[key].said[answer](entity.name) });
  settleAnswer(world, key, entity, answer, { beginTravel });
}

/**
 * What an answer does at once. Only one does anything before its question closes: somebody who does not pledge goes home.
 * The storm's willing are rewarded when the order is countermanded, and the Grass Fight's riders fight when it is fought.
 */
function settleAnswer(world, key, person, answer, { beginTravel } = {}) {
  if (['pledge', 'winter'].includes(key) && answer === 'no') leaveArmy(world, person, { beginTravel, text: null });
}

/** Close a question: anybody not answered for is answered by silence. */
export function closeQuestion(world, key) {
  const question = world.army?.questions?.[key];
  if (!question || question.closed) return;
  for (const [id, answer] of Object.entries(question.asks)) {
    if (answer !== 'open') continue;
    question.asks[id] = 'silent';
    const person = world.entities[id];
    if (person) record(world, 'choice', { actorId: id, householdId: person.householdId, importance: 2, decision: `${key}-silent`, text: ARMY_QUESTIONS[key].said.silent(person.name) });
  }
  question.closed = true;
}

/** Somebody leaves the ranks for home: not pledging, going for winter clothing, or running from the field. */
function leaveArmy(world, person, { beginTravel, text, keepPromise = false }) {
  const army = world.army;
  if (!army?.members.includes(person.id)) return;
  army.members = army.members.filter(id => id !== person.id);
  if (person.travel?.purpose === 'march') {
    const at = lastPlacePassed(world), site = world.map.sites[at];
    person.travel = null;
    person.location = { x: site.x, y: site.y, siteId: at };
  }
  const promise = person.commitments?.find(p => p.id === 'volunteer' && p.status === 'active');
  if (promise && !keepPromise) promise.status = 'ended';
  const causeId = text ? record(world, 'army', { actorId: person.id, householdId: person.householdId, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-040', text }) : null;
  // On the horse they came with, as a volunteer sent for does (`callHome`); on foot if that way home is shut.
  const home = world.households[person.householdId].homeSiteId, mode = modeWith(world, person);
  if (beginTravel) { try { beginTravel(world, person, home, causeId, 'home', mode); } catch (error) { if (mode === 'foot') throw error; beginTravel(world, person, home, causeId, 'home'); } }
}

/**
 * Winter clothing, November 3-4 (`HIST-TEX-027`): "more than 150 men" of about six hundred went home, "all having promised
 * to return". Only a family nobody plays sends its volunteer (owner, §7b); about half of them come back, between ten and
 * sixteen days later. ceiling: who returns and when is rolled, since the record gives only that some did.
 */
export const CLOTHING_SHARE = 0.25;
export const CLOTHING_RETURN_SHARE = 0.5;
export function goForClothing(world, { beginTravel }) {
  const army = world.army;
  if (!army || !world.neighbours) return;
  army.furloughs ??= {};
  for (const id of [...army.members]) {
    const person = world.entities[id], household = world.households[person?.householdId];
    if (!person || household?.played || unit(`${world.seed}:${id}:clothing`) >= CLOTHING_SHARE) continue;
    const back = unit(`${world.seed}:${id}:clothing-back`) < CLOTHING_RETURN_SHARE;
    army.furloughs[id] = { back, returnMinute: world.minute + Math.round((10 + 6 * unit(`${world.seed}:${id}:clothing-day`)) * 1440), returned: false };
    leaveArmy(world, person, { beginTravel, keepPromise: back, text: `${person.name} went home from the camp before Béxar for winter clothing, promising to return.` });
  }
}
/** Those who promised to come back set out again once they are home and the days are up. */
export function returnFromClothing(world, { beginTravel }) {
  for (const [id, furlough] of Object.entries(world.army?.furloughs || {})) {
    const person = world.entities[id];
    if (!furlough.back || furlough.returned || !person || world.minute < furlough.returnMinute) continue;
    if (person.travel || person.location.siteId !== world.households[person.householdId]?.homeSiteId || ['dead', 'captured'].includes(person.health.condition)) continue;
    furlough.returned = true;
    const causeId = record(world, 'army', { actorId: id, householdId: person.householdId, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-040', text: `${person.name} set out again for the army before Béxar, with warmer clothes.` });
    beginTravel(world, person, OBJECTIVE, causeId, 'visit');
  }
}

/**
 * The storm order is countermanded, November 22. Owner (§7b): a volunteer who said they would go in earns their family
 * glory for it, though the storm never came. How much is this game's own (`FIC-GONZ-040`): the weight of being present.
 */
export function countermandStorm(world, causeId) {
  closeQuestion(world, 'storm');
  for (const [id, answer] of Object.entries(world.army?.questions?.storm?.asks || {})) {
    const person = world.entities[id];
    if (answer !== 'yes' || !person?.householdId) continue;
    awardGlory(world, { event: 'storm-order', claimId: 'HIST-TEX-028', personId: id, householdId: person.householdId, role: 'willing', fromSiteId: OBJECTIVE, causes: causeId ? [causeId] : [] });
  }
}

/** The owner's bounds for the Grass Fight (§7b): nobody killed; about three in a hundred slightly wounded, weighted by hidden strength and health; about one in a hundred runs home. */
export const GRASS_WOUND_RISK = 0.03;
export const GRASS_RUN_RISK = 0.01;

/**
 * The Grass Fight, November 26 (`HIST-TEX-031`, `-032`). Those who went out fought; the rest of the camp was present. A
 * fighter who ran home is taken from the ranks, and the owner decided their family's glory for the fight goes the other
 * way (§7b). What happened to each person is written down now but told to their family only when word rides home
 * (`tellGrassFight`). Returns what happened, for the tests.
 */
export function fightGrass(world, causeId, { beginTravel } = {}) {
  const army = world.army;
  if (!army) return { fought: [], present: [], ran: [], wounded: [] };
  closeQuestion(world, 'grass');
  const asks = army.questions?.grass?.asks || {};
  const fought = army.members.filter(id => asks[id] === 'yes');
  const present = army.members.filter(id => asks[id] !== 'yes');
  world.participation ??= {};
  const taking = world.participation['grass-fight'] ??= {};
  const outcomes = [], ran = [], wounded = [];
  for (const id of fought) {
    const person = world.entities[id];
    const runs = unit(`${world.seed}:${id}:grass-run`) < GRASS_RUN_RISK;
    const hurt = !runs && unit(`${world.seed}:${id}:grass`) < GRASS_WOUND_RISK * frailty(person);
    taking[id] = { householdId: person.householdId, role: runs ? 'ran' : 'fought', minute: world.minute };
    awardGlory(world, {
      event: 'grass-fight', claimId: 'HIST-TEX-031', personId: id, householdId: person.householdId, role: 'fought', fromSiteId: OBJECTIVE, causes: causeId ? [causeId] : [],
      ...(runs && { adjust: points => -points, note: 'They ran from the field and went home, and it was held against the family. (This is the game’s own reading; the record punishes nobody for going home.)' }),
    });
    if (runs) {
      ran.push(id);
      leaveArmy(world, person, { beginTravel, text: null });
      outcomes.push({ id, fate: 'ran' });
    } else if (hurt) {
      wounded.push(id);
      person.health = { condition: 'minor-injury', recoversAt: world.minute + MEND_MINUTES };
      outcomes.push({ id, fate: 'wounded' });
    } else outcomes.push({ id, fate: 'unhurt' });
  }
  for (const id of present) {
    const person = world.entities[id];
    if (!person?.householdId || taking[id]) continue;
    taking[id] = { householdId: person.householdId, role: 'present', minute: world.minute };
    awardGlory(world, { event: 'grass-fight', claimId: 'HIST-TEX-032', personId: id, householdId: person.householdId, role: 'present', fromSiteId: OBJECTIVE, causes: causeId ? [causeId] : [] });
    outcomes.push({ id, fate: 'present' });
  }
  army.grass = { outcomes, told: false, minute: world.minute };
  return { fought, present, ran, wounded };
}

/** Word of the Grass Fight reaches a family: what happened to their own person, days after it happened (owner, §7b). */
export function tellGrassFight(world, causeId) {
  const grass = world.army?.grass;
  if (!grass || grass.told) return;
  grass.told = true;
  const words = {
    ran: name => `${name} ran from the field in the fight west of Béxar on November 26, and made for home.`,
    wounded: name => `${name} was slightly hurt in the fight west of Béxar on November 26, and was days mending.`,
    unhurt: name => `${name} went out with Bowie and Jack's men in the fight west of Béxar on November 26, and came through unhurt.`,
    present: name => `${name} was in the camp at the mill when the others went out after the pack train on November 26.`,
  };
  for (const { id, fate } of grass.outcomes) {
    const person = world.entities[id];
    if (!person?.householdId) continue;
    record(world, fate === 'present' ? 'army' : 'consequence', {
      actorId: id, householdId: person.householdId, importance: fate === 'present' ? 2 : 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-040',
      causes: causeId ? [causeId] : [], text: words[fate](person.name),
    });
  }
}

// ------------------------------------------------------------------------------------ build step 6: the storming of Béxar
//
// docs/COLONIES.md §6l, researched in docs/battle-research/bexar-storming.md and decided by the owner (§7c). On December 4
// the army was ordered into winter quarters and "250 or 300 set off for home"; that afternoon Milam called for men to go
// into San Antonio, and between about 210 and 300 went in before dawn on the 5th while the rest held the camp (`HIST-TEX-036`,
// `-037`). Four days of house-to-house fighting; Milam killed on the 7th; about a hundred of the reserve sent in on the 8th;
// the white flag on the 9th, terms on the 10th, the capitulation dated the 11th; Cos marched out on the 14th and the
// colonists went home (`HIST-TEX-038` to `-045`).

/**
 * The storming's rates for those who went in, from the record and rounded as the owner allows (2026-09-16, docs/COLONIES.md
 * §7c): about 5 killed and 21 wounded of about 300 (`HIST-TEX-042`; docs/battle-research/bexar-storming.md §8, 1.7% and
 * 7–9%) are 2 in 100 killed and 8 in 100 wounded. Rolled for each on their own (`rollFates`), weighted by hidden strength
 * and health, with no limit on how many a class loses; nobody in the reserve is hurt (it recorded no loss).
 */
export const STORMING_DEATH_RISK = 0.02;
export const STORMING_WOUND_RISK = 0.08;
/**
 * The three grades of wound, as the surgeon listed them (`HIST-TEX-042`: of 23, 3 slight, 11 severe, 7 dangerous, 2 mortal),
 * with how long each keeps somebody down. No source gives a healing time; these are the research's reading of a handful of
 * careers (§8.3), and this game's own (`FIC-GONZ-041`). A dangerous wound can leave a lasting mark, and rarely kill later.
 */
export const WOUND_GRADES = Object.freeze({
  slight: { share: 0.125, minutes: 3 * 1440, condition: 'minor-injury' },
  severe: { share: 0.5, minutes: 21 * 1440, condition: 'wounded' },
  dangerous: { share: 0.375, minutes: 60 * 1440, condition: 'wounded', mark: 0.4, laterDeath: 0.15 },
});
const MARKS = ['lost a leg', 'lost an eye', 'lost the use of an arm'];

/** The storming's questions join the siege's, each on the volunteer's own card. */
Object.assign(ARMY_QUESTIONS, {
  // December 4: ordered into winter quarters. A yes stays in camp; a no goes home, as 250 or 300 did (Maverick).
  winter: {
    claimId: 'HIST-TEX-036', unplayed: 0.6,
    ask: name => `The army has been ordered into winter quarters, and men are setting off for home in squads. Does ${name} stay in camp?`,
    yes: name => `${name} stays in camp`, no: name => `${name} goes home for the winter`,
    said: { yes: name => `${name} stayed in camp when the army was ordered into winter quarters.`, no: name => `${name} set off for home when the army was ordered into winter quarters.`, silent: name => `Nobody answered for ${name}, who stayed in camp.` },
  },
  // December 4, the afternoon: "Who will go with old Ben Milam into San Antonio?"
  milam: {
    claimId: 'HIST-TEX-036', unplayed: 0.4,
    ask: name => `Ben Milam is calling for men to go into San Antonio with him before dawn. Does ${name} go?`,
    yes: name => `${name} goes in with Milam`, no: name => `${name} stays with the camp`,
    said: { yes: name => `${name} said they would go into San Antonio with Milam.`, no: name => `${name} stayed with Burleson at the camp.`, silent: name => `Nobody answered for ${name}, who stayed with the camp.` },
  },
  // December 8: Cheshire's, Sutherland's and Lewis's companies, about a hundred of the reserve, sent in.
  reinforce: {
    claimId: 'HIST-TEX-037', unplayed: 0.2, who: (world, person) => world.army?.questions?.milam?.asks?.[person.id] !== 'yes',
    ask: name => `Burleson is sending men from the camp into the town to join the fighting. Does ${name} go in?`,
    yes: name => `${name} goes into the town`, no: name => `${name} stays at the camp`,
    said: { yes: name => `${name} went into the town with the men sent from the camp.`, no: name => `${name} stayed at the camp.`, silent: name => `Nobody answered for ${name}, who stayed at the camp.` },
  },
});
Object.freeze(ARMY_QUESTIONS);

/** Who went into the town: with Milam on the 5th, or sent in from the camp on the 8th. */
export const stormedIn = (world, id) => world.army?.questions?.milam?.asks?.[id] === 'yes' || world.army?.questions?.reinforce?.asks?.[id] === 'yes';

/**
 * The storming, resolved at the white flag on December 9 (`HIST-TEX-038`, `-042`). Everybody of the class who went in fought;
 * the rest of the camp was present. Each fighter's fate is rolled on its own at the recorded rates (`rollFates`), and each
 * dangerous wound's later death on its own at its rate, however many that costs a class. What happened is told to each family when
 * the word of the victory rides home (`tellStorming`). Returns what happened, for the tests.
 */
export function fightStorming(world, causeId) {
  const army = world.army;
  if (!army) return { fought: [], present: [], killed: [], wounded: [] };
  closeQuestion(world, 'reinforce');
  const fought = army.members.filter(id => stormedIn(world, id));
  const present = army.members.filter(id => !stormedIn(world, id));
  world.participation ??= {};
  const taking = world.participation['bexar-storming'] ??= {};
  const bexar = world.map.sites[OBJECTIVE];
  const killed = [], wounded = [], outcomes = [], later = [];
  for (const { id, person, fate } of rollFates(world, fought, { event: 'storming', death: STORMING_DEATH_RISK, wound: STORMING_WOUND_RISK })) {
    const dies = fate === 'killed', hurt = fate === 'wounded';
    taking[id] = { householdId: person.householdId, role: 'fought', minute: world.minute };
    const woman = person.sex === 'female';
    awardGlory(world, { event: 'bexar-storming', claimId: 'HIST-TEX-038', personId: id, householdId: person.householdId, role: 'fought', fromSiteId: OBJECTIVE, causes: causeId ? [causeId] : [], ...(woman && dies && { adjust: points => -2 * points, note: 'In 1835, sending a woman to fight was held against a family. (This is the game’s own reading of the period, not a documented judgement.)' }) });
    if (dies) {
      killed.push(id);
      layDead(world, person, { x: bexar.x, y: bexar.y });
      outcomes.push({ id, fate: 'killed' });
    } else if (hurt) {
      const g = unit(`${world.seed}:${id}:grade`);
      const grade = g < WOUND_GRADES.slight.share ? 'slight' : g < WOUND_GRADES.slight.share + WOUND_GRADES.severe.share ? 'severe' : 'dangerous';
      const spec = WOUND_GRADES[grade];
      wounded.push(id);
      person.health = { condition: spec.condition, grade, recoversAt: world.minute + spec.minutes };
      if (spec.mark && unit(`${world.seed}:${id}:mark`) < spec.mark) person.marks = [...(person.marks || []), MARKS[Math.floor(unit(`${world.seed}:${id}:which-mark`) * MARKS.length)]];
      if (spec.laterDeath && unit(`${world.seed}:${id}:later`) < spec.laterDeath) later.push(id);
      // A wound worse than slight keeps somebody in Béxar under the surgeon (`HIST-TEX-042`): out of the ranks and lying in the town.
      if (grade !== 'slight') {
        army.members = army.members.filter(member => member !== id);
        person.travel = null; person.task = 'rest';
        person.location = { x: bexar.x, y: bexar.y, siteId: OBJECTIVE };
        const promise = person.commitments?.find(p => p.id === 'volunteer' && p.status === 'active');
        if (promise) promise.status = 'ended';
      }
      outcomes.push({ id, fate: 'wounded', grade });
    } else outcomes.push({ id, fate: 'unhurt' });
  }
  for (const id of present) {
    const person = world.entities[id];
    if (!person?.householdId || taking[id]) continue;
    taking[id] = { householdId: person.householdId, role: 'present', minute: world.minute };
    awardGlory(world, { event: 'bexar-storming', claimId: 'HIST-TEX-037', personId: id, householdId: person.householdId, role: 'present', fromSiteId: OBJECTIVE, causes: causeId ? [causeId] : [] });
    outcomes.push({ id, fate: 'present' });
  }
  army.storming = { outcomes, later, killed: [...killed], told: false, minute: world.minute };
  return { fought, present, killed, wounded };
}

/** A person killed: out of the ranks, laid where they fell, their promise ended. */
function layDead(world, person, at) {
  const army = world.army;
  if (army) army.members = army.members.filter(member => member !== person.id);
  person.health = { condition: 'dead' };
  person.travel = null; person.task = 'rest';
  person.location = { x: at.x, y: at.y, siteId: OBJECTIVE };
  const promise = person.commitments?.find(p => p.id === 'volunteer' && p.status === 'active');
  if (promise) promise.status = 'ended';
}

/**
 * A dangerous wound that proves fatal, days after (owner, §7c: rarely). Each was rolled on its own in the fight, at about 15 in
 * 100 dangerous wounds (the record: about 3 of 23 wounds fatal, 13%, bexar-storming.md §8), and every one rolled dies here,
 * with no limit (owner's correction, 2026-09-16).
 */
export function dieOfWounds(world) {
  const storming = world.army?.storming;
  if (!storming) return [];
  const died = [];
  for (const id of storming.later) {
    const person = world.entities[id];
    if (!person || person.health?.condition !== 'wounded') continue;
    const award = world.glory?.[person.householdId]?.awards?.[`bexar-storming:${id}`];
    // A woman who does not come through is judged as at Concepción: her award taken away twice over.
    if (person.sex === 'female' && award && award.points > 0) {
      const ledger = world.glory[person.householdId];
      ledger.total -= 3 * award.points; award.points = -2 * award.points;
      award.note = 'In 1835, sending a woman to fight was held against a family. (This is the game’s own reading of the period, not a documented judgement.)';
    }
    layDead(world, person, person.location);
    storming.killed.push(id);
    const outcome = storming.outcomes.find(o => o.id === id);
    if (outcome) { outcome.fate = 'died-of-wounds'; outcome.day = world.minute; }
    died.push(id);
  }
  storming.later = [];
  return died;
}

/** The army breaks up, December 14: "the rest of the army will retire to their homes" (Burleson). The wounded stay at Béxar. */
export function disbandArmy(world, { beginTravel }) {
  const army = world.army;
  if (!army) return;
  for (const id of [...army.members]) {
    const person = world.entities[id];
    if (!person) continue;
    leaveArmy(world, person, { beginTravel, text: `${person.name} started home from Béxar as the army broke up.` });
  }
}

/** Word of the victory reaches a family: what happened to their own person in the storming. */
export function tellStorming(world, causeId) {
  const storming = world.army?.storming;
  if (!storming || storming.told) return;
  storming.told = true;
  const marksOf = person => person.marks?.length ? ` They have ${person.marks.join(' and ')}.` : '';
  for (const outcome of storming.outcomes) {
    const person = world.entities[outcome.id];
    if (!person?.householdId) continue;
    const text = {
      killed: () => `${person.name} was killed in the storming of Béxar, and was buried there.`,
      'died-of-wounds': () => `${person.name} was badly wounded in the storming of Béxar, and died of the wound there some days after.`,
      wounded: () => outcome.grade === 'slight'
        ? `${person.name} was slightly hurt in the storming of Béxar, and was soon on their feet.`
        : `${person.name} was ${outcome.grade === 'dangerous' ? 'dangerously' : 'severely'} wounded in the storming of Béxar, and is lying in the town under the surgeon's care.${marksOf(person)}`,
      unhurt: () => `${person.name} went into San Antonio and fought through the four days of the storming of Béxar, and came through unhurt.`,
      present: () => `${person.name} held the camp at the old mill while the others fought in the town.`,
    }[outcome.fate]();
    record(world, outcome.fate === 'present' ? 'army' : 'consequence', {
      actorId: person.id, householdId: person.householdId, importance: outcome.fate === 'present' ? 2 : 3,
      classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-041', causes: causeId ? [causeId] : [], text,
    });
  }
}

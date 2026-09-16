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

/** Where the volunteers were made into an army, and where they went. */
export const RENDEZVOUS = 'gonzales';
export const OBJECTIVE = 'bexar';
/**
 * How far the army makes in a day of 1835, on the march.
 *
 * Ten miles a day is the pace usually given to an armed body with ox carts and no road
 * discipline, and it is the one that fits: the seventy miles of road from Gonzales puts the
 * column outside Béxar in the third week of October, which is when it was there. It is invented
 * for gameplay (`FIC-GONZ-034`) and nothing presents it as a measurement - what is documented is
 * when they left, not how fast they walked. Read against the calendar rather than the tick, like
 * every other pace since the two clocks (sim/clock.mjs), and spread over the whole day rather
 * than a marching morning, because the calendar is all this has to divide by.
 */
export const ARMY_MILES_PER_DAY = 10;
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
  const road = roadToBexar(world);
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
export function advanceArmy(world) {
  const army = world.army;
  if (!army) return;
  // Not on the tick it steps off: the order is given at that hour and the ground starts going
  // past afterwards. Without this the march gets one free tick, which at half a day a tick is
  // half a day of marching nobody watched.
  if (army.phase === 'marching' && army.road && army.leftMinute !== world.minute) {
    const miles = ARMY_MILES_PER_HOUR * (calendarMinutes(world) / 60);
    const moved = moveOnGround(army.road.points, army.road.pace, army.road.distance, army.progress, miles);
    army.progress = moved.progress;
    const at = pointAt(army.road.points, army.progress);
    army.x = at.x; army.y = at.y;
    if (army.progress >= army.road.distance) {
      army.phase = 'arrived'; army.siteId = OBJECTIVE;
      // The road is behind them: they are men standing outside a town again, not men on a journey.
      for (const id of army.members) {
        const person = world.entities[id];
        if (person?.travel?.purpose === 'march') { person.travel = null; person.task = 'help'; }
      }
      // ceiling: what happens when it gets there is build step 6, researched first. Until then
      // the army stands outside the town and the class's own ending is what stops it.
    }
  }
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
  beginTravel(world, entity, world.households[householdId].homeSiteId, causeId, 'home');
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
    at: army.siteId ? world.map.sites[army.siteId]?.name : 'on the road',
    miles: Math.round(Math.hypot(army.x - home.x, army.y - home.y) * 10) / 10,
    ours: mine.map(id => ({ id, name: world.entities[id].name })),
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
  return null;
}

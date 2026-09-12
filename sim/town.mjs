// The people of Gonzales.
//
// `HIST-GONZ-011` documents thirty-two structures by 1836 and nothing about who lived in
// them. `HISTORY.md` records that the **population of Gonzales in 1835 was searched for
// and NOT FOUND**, and must not be stated. So this file does not model a town's worth of
// people, and nothing in the interface counts them: it gives a student three named people
// they can actually meet, and says plainly that they are invented.
//
// They are fictional in exactly the way the player households are fictional, and they are
// registered as `FIC-GONZ-009`. Their trades are invented too. A settlement of this size
// plausibly had someone who worked iron, but plausible is not documented, so the claim
// lives in the fiction registry rather than being smuggled in as scenery.
//
// Real people connected to this place - Ezekiel Williams, Byrd Lockhart, Green DeWitt -
// are deliberately NOT used here. A named historical person requires their own checked
// claim, and putting one behind a trade counter would invent a life for them.
import { record } from './events.mjs';
import { facingOf, ridersInSight } from './encounters.mjs';

export const RESIDENTS = [
  {
    id: 'town-ibarra', name: 'Marta Ibarra', trade: 'seed', deals: ['seed', 'powder'],
    // Deliberately mixed: DeWitt's colony was in Mexican Texas, and a town there was not
    // uniformly Anglo. This is a fictional person, not a representative of anyone.
    about: 'trades seed and stores out of a cabin off the commons',
    round: [{ x: -.16, y: -.10 }, { x: -.05, y: .02 }, { x: -.20, y: .06 }],
  },
  {
    id: 'town-pike', name: 'Josiah Pike', trade: 'iron',
    about: 'works iron, and will set a worn tool right for a price',
    round: [{ x: .18, y: .08 }, { x: .24, y: -.02 }, { x: .12, y: .12 }],
  },
  {
    id: 'town-crandall', name: 'Ruth Crandall', trade: null,
    about: 'is usually somewhere on the commons',
    round: [{ x: .02, y: .16 }, { x: -.08, y: .20 }, { x: .10, y: .18 }, { x: 0, y: .10 }],
  },
];

const round = value => { const fixed = +value.toFixed(2); return fixed === 0 ? 0 : fixed; };

/** Put the residents in the town. Called once, when the world is built. */
export function createTownspeople(world) {
  const town = world.map.sites.gonzales;
  if (!town) return;
  for (const resident of RESIDENTS) {
    world.entities[resident.id] = {
      id: resident.id, name: resident.name, kind: 'person',
      // No household: they are not anybody's family, and no student commands them.
      // `resident` is what this person is known for and is what the student is shown;
      // `deals` is everything they will actually trade in. Marta's own description has
      // always said "seed and stores", and powder is stores.
      householdId: null, depth: 'moderate', principal: false, resident: resident.trade || 'none',
      deals: resident.deals || [resident.trade].filter(Boolean),
      location: { x: round(town.x + resident.round[0].x), y: round(town.y + resident.round[0].y), siteId: 'gonzales' },
      travel: null, health: { condition: 'well' }, task: 'work',
    };
  }
}

/**
 * Residents go about their day. This is the cheapest thing that makes a place look
 * inhabited, and it is the lesson Widelands teaches by omission: its buildings mostly
 * have no "working" animation at all, and the sense of life comes from people visibly
 * moving between places. Nobody here is simulated beyond where they are standing.
 */
export function advanceTown(world) {
  const town = world.map.sites.gonzales;
  if (!town) return;
  for (const resident of RESIDENTS) {
    const entity = world.entities[resident.id];
    if (!entity || entity.travel) continue;
    // Deterministic from the tick, so a reloaded world puts everyone back where they were.
    const spot = resident.round[Math.floor(world.tick / 3 + resident.id.length) % resident.round.length];
    entity.location = { x: round(town.x + spot.x), y: round(town.y + spot.y), siteId: 'gonzales' };
  }
}

/** Whoever is standing at this site and deals in this trade, or null. */
export function traderAt(world, siteId, trade) {
  // A class saved before anybody dealt in more than one thing has no `deals`, and the
  // correct reading of that is the one trade they were known for - so no save moved.
  return Object.values(world.entities).find(entity =>
    (entity.deals ? entity.deals.includes(trade) : entity.resident === trade)
    && entity.location?.siteId === siteId && entity.health?.condition === 'well') || null;
}

export function recordTrade(world, householdId, entity, trader, what) {
  record(world, 'consequence', {
    actorId: entity.id, householdId,
    text: `${entity.name} traded with ${trader.name} at Gonzales for ${what}.`,
  });
}

/**
 * What one household is permitted to see of somebody else.
 *
 * A student sees their own family in full. They see anyone else only where one of their
 * own people is standing, and then only what standing next to a person would show: who
 * they are, where they are, and what they appear to be doing. Never their household's
 * stores, their skills, their errand, their reports or their memories.
 *
 * This is the same rule as the rest of the projection, applied to people rather than
 * facts: the filtering happens here, on the server, and the renderer is never handed
 * something it is expected not to draw.
 */
export function observedBy(world, householdId) {
  if (!householdId) return [];
  const mine = Object.values(world.entities).filter(entity => entity.householdId === householdId && entity.location?.siteId);
  const places = new Set(mine.map(entity => entity.location.siteId));
  const standingWith = Object.values(world.entities)
    .filter(entity => entity.householdId !== householdId && entity.kind === 'person' && places.has(entity.location?.siteId));
  // A rider carrying word is visible while they are still coming, because watching
  // somebody ride up to your door is the arrival, and news that materialises at the moment
  // it is spoken has no approach at all. Anybody within sight of one of this family's own
  // people, since a rider now stops for whoever they come alongside; what they carry stays
  // on the server exactly as before.
  const riders = ridersInSight(world, householdId).filter(rider => !standingWith.includes(rider));
  return [...standingWith, ...riders]
    .map(entity => ({
      id: entity.id, name: entity.name, kind: 'person',
      // Whose family they belong to is visible - that is the point of meeting them - but
      // nothing about that family's private state travels with it.
      householdId: entity.householdId, resident: entity.resident || null,
      // A rider is visibly a rider, on a horse. That is all it says: `report` never
      // leaves the server, and seeing one tells you nothing about what they carry. It
      // reads `courier` rather than `report` because delivering a message does not put
      // somebody off their horse - the errand ends, the horse does not.
      ...(entity.courier || entity.report ? { carrier: true, ...facingOf(world, entity) } : {}),
      // The family's own fictional name, not the student's. Every household is currently a
      // copy of the same four people, so "Thomas" alone cannot tell two families apart.
      household: world.households[entity.householdId]?.name || null,
      location: { x: entity.location.x, y: entity.location.y, siteId: entity.location.siteId },
      // Only a rider's route travels, and only to the family it is riding to - so the
      // road on the wire is the road up to that student's own door. It is here so the
      // approach is drawn as movement rather than as a figure jumping a mile a tick.
      ...((entity.courier || entity.report) && entity.travel ? { travel: { points: entity.travel.points, progress: entity.travel.progress, distance: entity.travel.distance } } : {}),
      task: entity.task === 'travel' ? 'travel' : entity.task,
      condition: entity.health?.condition || 'well',
      observed: true,
    }));
}

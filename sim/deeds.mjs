// The ledger's own few lines, which the modules where help is done write into and read (sim/houses.mjs, sim/trade.mjs,
// sim/flight-work.mjs, sim/scrape.mjs, sim/neighbours.mjs). A leaf that imports nothing, so none of those modules is pulled into
// an import cycle through sim/neighbourly.mjs, which is the rest of it: the offers, the words, the ending, the page.
// Owner, 2026-09-28: "Yes: they remember and repay". Every number is this game's own (`FIC-GONZ-760`).

/** What each kind of deed weighs in what one family owes another. A trade was even when it was made, so it weighs nothing. */
export const DEED_WEIGHT = Object.freeze({ raising: 2, food: 1, room: 2, shelter: 3, call: 1, trade: 0 });
/** How long a family nobody plays holds its going east for an answer about room in a wagon. */
export const ROOM_WAIT_MINUTES = 720;
/** The ledger and its offers, made the first time anything is written. Absent on every class before, which is the empty ledger. */
export function state(world) {
  world.neighbourly ??= { deeds: [], asks: {}, lent: {}, told: {}, last: {}, next: 1 };
  return world.neighbourly;
}

/**
 * One deed written into the ledger: `fromId` did it for `toId` (null for the whole settlement - the neighbours' call). `more` is
 * what it was: `hours` at a raising, `amount` of food or room, the goods of a trade, `forId` the deed it repaid, `childIds`.
 */
export function noteDeed(world, { kind, fromId, toId = null, personId = null, ...more }) {
  if (!Object.hasOwn(DEED_WEIGHT, kind) || !world.households?.[fromId] || fromId === toId) return null;
  if (toId !== null && !world.households[toId]) return null;
  const s = state(world);
  const deed = { id: `deed-${s.next++}`, kind, fromId, toId, ...(personId && { personId }), minute: world.minute, ...more };
  s.deeds.push(deed);
  return deed;
}

/** The room lent to or by this family in the wagons, for sim/scrape.mjs `flightRoom`: plus for the one lent it, minus for the lender. */
// ceiling: the room lent is counted whole against the lender until it leaves, even if the helped family loaded less into it; the
// lender learns only that the room is kept. Counting what the helped family took (a hook in sim/scrape.mjs `flee`) is the way out.
export function lentRoom(world, household) {
  const lent = world.neighbourly?.lent;
  if (!lent || !household) return 0;
  let room = lent[household.id]?.room || 0;
  for (const entry of Object.values(lent)) if (entry.fromId === household.id) room -= entry.room;
  return room;
}

/** Whether a family nobody plays should hold its going east: an answer about room in a wagon is waited for, half a day at most. */
export function waitingOnNeighbour(world, householdId) {
  return Object.values(world.neighbourly?.asks || {}).some(ask => ask.kind === 'room' && (ask.fromId === householdId || ask.toId === householdId)
    && world.minute - ask.minute < ROOM_WAIT_MINUTES);
}

/**
 * Whether this idle person of a family nobody plays goes to, or puts hands to, the raising of a family it owes. Read from the
 * family's own projection (`view.neighbourly`), as everything the director decides is. One person of the family at a time.
 * Returns true when it sent them.
 */
export function raisingHand(view, household, person, attempt) {
  const owed = (view.neighbourly?.neighbours || []).filter(one => one.raising && one.weOwe);
  if (!owed.length || (view.flight && view.flight.status !== 'home')) return false;
  const here = owed.find(one => one.siteId === person.location?.siteId);
  if (here) return attempt({ action: 'chore', entityId: person.id, chore: 'help-raise' });
  const ours = (view.entities || []).filter(entity => entity.kind === 'person' && entity.householdId === household.id);
  const already = ours.some(one => one.chore?.id === 'help-raise' || (one.travel && owed.some(n => n.siteId === one.travel.to)));
  if (already || person.location?.siteId !== view.household.homeSiteId) return false;
  return attempt({ action: 'travel', entityId: person.id, destination: owed[0].siteId });
}


// The ledger's own few lines, which the modules where help is done write into and read (sim/houses.mjs, sim/trade.mjs,
// sim/flight-work.mjs, sim/scrape.mjs, sim/neighbours.mjs). A leaf that imports nothing, so none of those modules is pulled into
// an import cycle through sim/neighbourly.mjs, which is the rest of it: the offers, the words, the ending, the page.
// Owner, 2026-09-28: "Yes: they remember and repay". Every number is this game's own (`FIC-GONZ-760`).
// Glory (sim/glory.mjs) is written from here and read nowhere in play: help to another family is part of the family's hidden count.
import { awardGlory } from './glory.mjs';

/** What each kind of deed weighs in what one family owes another. A trade was even when it was made, so it weighs nothing. */
export const DEED_WEIGHT = Object.freeze({ raising: 2, food: 1, room: 2, shelter: 3, call: 1, trade: 0 });
/**
 * Help that earns the helping family glory (owner, 2026-09-28, by multiple choice: **"Any help"** - any help to another family, at
 * the support weight of docs/MONEY_AND_GLORY.md §4). The part each kind of deed is (sim/glory.mjs `GLORY_WEIGHT`): a raising, food
 * and room in a wagon are `helped` (the support weight, 1); children taken in are `sheltered` (2, the weight of being present).
 * A trade earns nothing - it was even when it was made - and neither does the neighbours' call to Gonzales, which already earned
 * its own part at Gonzales (sim/directors.mjs). **Once for each family helped and each kind of help**: a family that raises a
 * neighbour's walls twice, or two families passing food back and forth, earn it once, as a person's part in an event is counted once.
 * ceiling: once a pair and kind, not once a need met; weights by how much was given (hours, food, room) are the way out if a class
 * finds a single afternoon's help worth as much as a winter's.
 */
export const HELP_ROLE = Object.freeze({ raising: 'helped', food: 'helped', room: 'helped', shelter: 'sheltered' });
export const helpEvent = (kind, toId) => `help:${kind}:${toId}`;
function awardHelp(world, deed) {
  const role = HELP_ROLE[deed.kind];
  if (!role || !deed.toId) return;
  const event = helpEvent(deed.kind, deed.toId);
  if (Object.values(world.glory?.[deed.fromId]?.awards || {}).some(award => award.event === event)) return;
  const helper = world.households[deed.fromId], helped = world.households[deed.toId];
  const personId = world.entities[deed.personId] ? deed.personId : helper.principalId;
  awardGlory(world, { event, claimId: 'FIC-GONZ-761', personId, householdId: helper.id, role, fromSiteId: helped.homeSiteId });
}
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
  awardHelp(world, deed);
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


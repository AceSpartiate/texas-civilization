// News by riders over real distance: docs/COLONIES.md §5.4, build step 4 (part 1).
//
// On the real map most families live far from Gonzales - San Felipe is a hundred road miles off, Liberty nearly two
// hundred - and a rider going straight out to every family would bring San Felipe the news in half a day. The letters say
// days (`HIST-TEX-006`): word left Gonzales in letters to the other settlements, an express carried each one to the next
// settlement on the road, and there the committee read it, copied it and found a fresh rider to send it on, and riders
// took it out to the settlement's own families.
//
// So here: when the letters say word left Gonzales, an express rider sets out on each road towards the settlements where
// the class's families live, stopping at every settlement and crossing on the way. At each stop the word waits while it is
// read and copied (`RELAY_MINUTES`), then goes on by a fresh rider on each road onward, and - where families live - out to
// each of them by a rider of that settlement, who carries it the rest of the way in person and says where it came from.
// A family near Gonzales is told as it always was, by riders straight out of the town.
//
// Every number here is invented (`FIC-GONZ-027`) and calibrated against the dated letters by tests/news.test.mjs.
import { record } from './events.mjs';
import { findPath } from './geography.mjs';
import { riderName } from './encounters.mjs';

/**
 * How long the word waits at a settlement or crossing before it goes on: read, copied, a fresh horse and rider found.
 * Six hours brings the call for help to San Felipe in the small hours of October 1 and the fight there on the morning of
 * October 3, both inside the dates the letters give (`HIST-TEX-006`).
 */
export const RELAY_MINUTES = 360;
/**
 * When each word left Gonzales for the other settlements, in minutes after midnight on September 29 (`sim/directors.mjs`
 * counts the same way). The call for help went out in letters dated September 30 (Martin, Coleman and Moore "to San Felipe
 * and La Baca"); the fight was written up the day it was fought, October 2. Eight in the morning and two in the afternoon
 * are invented.
 */
export const EXPRESS_LEAVES = Object.freeze({ 'cannon-request': 1920, 'gonzales-outcome': 5160 });
/** The places the word stops at on the way: the settlements, and the crossings where the roads meet a river. */
const STOP_KINDS = Object.freeze(['town', 'crossing']);
const SOURCE = 'gonzales';

/** Families whose own settlement is not Gonzales: the ones the expresses are for. None on the invented map. */
export const distantHouseholds = world => Object.values(world.households).filter(household => household.settlementId && household.settlementId !== SOURCE);

/**
 * The way the word spreads: every stop on the roads from Gonzales to the settlements families live near, and the stop it
 * hears from. Laid once, when the first word leaves, and kept, so a word already on the road is not rerouted.
 */
export function expressRoutes(world) {
  const from = {};
  const targets = [...new Set(distantHouseholds(world).map(household => household.settlementId))].sort();
  for (const target of targets) {
    const path = byTheLetters(world, target);
    if (!path) continue;
    let previous = SOURCE;
    for (const node of path.nodes.slice(1)) {
      if (!STOP_KINDS.includes(world.map.sites[node.id]?.kind)) continue;
      // The first road found to a stop is the one the word takes; a later settlement further on hears from it.
      if (!(node.id in from)) from[node.id] = previous;
      previous = node.id;
    }
  }
  return from;
}

/**
 * The road the word takes from Gonzales to a settlement: the shortest, except that it does not leave by the road to Beeson's.
 * The letters of 1835 went by Moore's on the Colorado - the La Grange crossing - and on by Coles' to San Felipe
 * (`HIST-TEX-006`); the road from Gonzales to Beeson's is first found in March 1836 (`HIST-TEX-087`), and since it was put on
 * the map (2026-09-17) it is the shorter way east. ceiling: which roads the committees' riders chose is known only for these
 * letters; every other stop is the shortest road.
 */
function byTheLetters(world, target) {
  const path = findPath(world.map, SOURCE, target);
  if (path?.nodes[1]?.id !== BEESONS || !world.map.sites[MOORES]) return path;
  const first = findPath(world.map, SOURCE, MOORES), rest = findPath(world.map, MOORES, target);
  return first && rest ? { nodes: [...first.nodes, ...rest.nodes.slice(1)] } : path;
}
const BEESONS = 'columbus-crossing', MOORES = 'la-grange-crossing';

/** When this word left Gonzales for the other settlements, on this class's clock. */
export const expressLeaves = (world, topicId, arrivalMinutes) => EXPRESS_LEAVES[topicId] + (world.director?.arrival ? arrivalMinutes : 0);

/** A fresh rider out of `siteId` on every road onward from it. */
function sendOnward(world, topicId, siteId, provenance, causeId, beginTravel) {
  const state = world.expresses[topicId];
  for (const [stop, heardFrom] of Object.entries(state.routes)) {
    if (heardFrom !== siteId) continue;
    const number = world.nextCourierId++;
    // Never a rider who already carried this word, as with the riders out to the families (sim/world.mjs `sendRider`).
    let named = number;
    while (provenance.some(hop => hop.name === riderName(named))) named++;
    const site = world.map.sites[siteId];
    const entity = { id: `courier-${number}`, name: riderName(named), kind: 'person', householdId: null, depth: 'moderate', principal: false, courier: true, location: { x: site.x, y: site.y, siteId }, task: 'rest', health: { condition: 'well' }, travel: null, express: { topicId, from: siteId, to: stop, provenance } };
    world.entities[entity.id] = entity;
    beginTravel(world, entity, stop, causeId, 'express');
  }
}

/** The word leaves Gonzales for the other settlements. Once for each word, and only in a class with distant families. */
export function startExpress(world, topicId, { beginTravel }) {
  if (world.expresses?.[topicId] || !world.truth[topicId] || !distantHouseholds(world).length) return false;
  world.expresses = { ...(world.expresses || {}) };
  const routes = world.expresses['cannon-request']?.routes || expressRoutes(world);
  world.expresses[topicId] = { leftMinute: world.minute, routes, heard: { [SOURCE]: world.minute }, sent: [SOURCE] };
  const causeId = record(world, 'relay', {
    // In the causal record only: no family has heard anything yet.
    classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-027', topicId, siteId: SOURCE, causes: [world.truth[topicId].eventId],
    text: 'Letters left Gonzales by express for the other settlements.',
  });
  sendOnward(world, topicId, SOURCE, [], causeId, beginTravel);
  return true;
}

/**
 * Expresses arriving, waiting while the word is read, and sending it on - along the roads, and out to the families who
 * live there. Called every tick after the riders have moved.
 */
export function advanceExpresses(world, { beginTravel, relayReport }) {
  if (!world.expresses) return;
  for (const carrier of Object.values(world.entities)) {
    const express = carrier.express;
    if (!express || carrier.travel || carrier.location.siteId !== express.to) continue;
    const state = world.expresses[express.topicId];
    if (!state) { delete carrier.express; continue; }
    if (state.heard[express.to] === undefined) {
      state.heard[express.to] = world.minute;
      express.relayEventId = record(world, 'relay', {
        actorId: carrier.id, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-027', topicId: express.topicId, siteId: express.to,
        text: `${carrier.name} brought the express from Gonzales to ${world.map.sites[express.to].name}.`,
      });
    }
    if (world.minute < state.heard[express.to] + RELAY_MINUTES) continue;
    const provenance = [...express.provenance, { id: carrier.id, name: carrier.name, atSiteId: express.to, minute: state.heard[express.to] }];
    const causeId = express.relayEventId || record(world, 'relay', { actorId: carrier.id, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-027', topicId: express.topicId, siteId: express.to, text: `The express from Gonzales was read at ${world.map.sites[express.to].name}.` });
    // A stop reached twice (two roads meeting) sends the word on once.
    if (!state.sent.includes(express.to)) {
      state.sent.push(express.to);
      sendOnward(world, express.topicId, express.to, provenance, causeId, beginTravel);
      for (const household of Object.values(world.households)) {
        if (household.settlementId !== express.to) continue;
        relayReport(world, { topicId: express.topicId, householdId: household.id, fromSiteId: express.to, originSiteId: SOURCE, status: 'unconfirmed', provenance, causeId });
      }
    }
    // The rider's errand is done; they are somebody standing in town now, like any courier after theirs.
    delete carrier.express;
  }
}

/** A stored express is a word the world knows, on a road that is there, with a real place for every hand. */
export function expressesInvalid(world) {
  for (const [topicId, state] of Object.entries(world.expresses || {})) {
    if (!world.truth[topicId] || !Number.isFinite(state.leftMinute) || !state.routes || !state.heard || !Array.isArray(state.sent)) return 'Invalid express';
    for (const [stop, from] of Object.entries(state.routes)) if (!world.map.sites[stop] || !world.map.sites[from]) return 'An express route to nowhere';
    for (const [site, minute] of Object.entries(state.heard)) if (!world.map.sites[site] || !Number.isFinite(minute) || minute > world.minute) return 'Invalid express arrival';
  }
  for (const entity of Object.values(world.entities)) {
    const express = entity.express;
    if (!express) continue;
    if (!world.expresses?.[express.topicId] || !world.map.sites[express.from] || !world.map.sites[express.to] || !Array.isArray(express.provenance)) return 'Invalid express rider';
    if (express.provenance.some(hop => !hop.name || !world.map.sites[hop.atSiteId] || !Number.isFinite(hop.minute))) return 'A hand-off must name somebody, somewhere, at a time';
  }
  return null;
}

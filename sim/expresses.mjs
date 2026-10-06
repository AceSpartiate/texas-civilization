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
//
// **The spring's word** (docs/COLONIES.md §5.4c, `FIC-GONZ-955`; triage 2.7): the fall of the Alamo, Houston's retreat, Goliad,
// the massacre, Santa Anna over the Brazos and San Jacinto used to be written into every family's journal on the same tick,
// however far off it was. Each now leaves by express from where the record has the word come in (`sendExpress`) - Gonzales,
// Houston's camp, Fort Bend - on the same roads, stops, six-hour waits and riders as the autumn's letters, and each family
// hears it when a rider from the nearest stop that has read it could have reached wherever its people are (`hearExpresses`),
// at home or on the road east. It was a quiet line in the journal, as all the spring's news had been since the one-rider rule
// (§5.4b), never a rider who reins in to talk: the riders are seen passing on the roads, and nothing piles up at a gate.
// **Amended 2026-10-05** (owner: "Every rider who reaches you"; docs/COLONIES.md §5.4e): at a family a student plays, the word
// is now also said, on that same minute, by a rider of the stop it was read at, in a scene where the family's person stands
// (sim/encounters.mjs `tellPassing`); still nobody on the map at the gate, and one rider at a time.
import { record } from './events.mjs';
import { findPath } from './geography.mjs';
import { riderName, tellPassing } from './encounters.mjs';
import { isStage } from './colonies-map.mjs';
import { learn, wouldLearn } from './knowledge.mjs';
import { FARMING_TICK_MINUTES, RIDER_SPEED } from './travel.mjs';

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
/**
 * The places the word stops at on the way: the settlements, and the three named crossings of the big rivers (`isStage`). The
 * fords and ferries laid on every road since 2026-09-19 are not stops: the word rides over them, as the mails crossed free
 * (`HIST-TEX-140`), and its waits stay the ones calibrated on the letters.
 */
const isStop = site => site?.kind === 'town' || isStage(site);
const SOURCE = 'gonzales';

/** Families whose own settlement is not Gonzales: the ones the expresses are for. None on the invented map. */
export const distantHouseholds = world => Object.values(world.households).filter(household => household.settlementId && household.settlementId !== SOURCE);

/**
 * The way the word spreads: every stop on the roads from Gonzales to the settlements families live near, and the stop it
 * hears from. Laid once, when the first word leaves, and kept, so a word already on the road is not rerouted.
 */
export function expressRoutes(world, source = SOURCE, targets = distantHouseholds(world).map(household => household.settlementId)) {
  const from = {};
  for (const target of [...new Set(targets)].filter(target => target !== source).sort()) {
    const path = source === SOURCE ? byTheLetters(world, target) : findPath(world.map, source, target);
    if (!path) continue;
    let previous = source;
    for (const node of path.nodes.slice(1)) {
      if (!isStop(world.map.sites[node.id])) continue;
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
    const entity = { id: `courier-${number}`, name: riderName(named), kind: 'person', householdId: null, depth: 'moderate', principal: false, courier: true, base: siteId, location: { x: site.x, y: site.y, siteId }, task: 'rest', health: { condition: 'well' }, travel: null, express: { topicId, from: siteId, to: stop, provenance } };
    world.entities[entity.id] = entity;
    // A stop no way reaches is never ridden to; the families near it hear from the next nearest stop that has the word.
    try { beginTravel(world, entity, stop, causeId, 'express'); } catch { delete world.entities[entity.id]; }
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
  keepSchedules(world, beginTravel);
  for (const carrier of Object.values(world.entities)) {
    const express = carrier.express;
    if (!express || carrier.travel || carrier.location.siteId !== express.to) continue;
    const state = world.expresses[express.topicId];
    // A word kept to its schedule (`due`) was read there when the schedule said; the rider's errand is simply done.
    if (!state || state.due) { delete carrier.express; continue; }
    const origin = world.map.sites[state.from || SOURCE]?.name || 'Gonzales';
    // A word sent more than once (a rumour, then the fuller account) rides in waves of its own, each keyed apart (`sendExpress`).
    const topicId = state.topicId || express.topicId;
    if (state.heard[express.to] === undefined) {
      state.heard[express.to] = world.minute;
      express.relayEventId = record(world, 'relay', {
        actorId: carrier.id, classification: 'FICTIONAL FOR GAMEPLAY', claimId: state.word ? SPRING_CLAIM : 'FIC-GONZ-027', topicId, siteId: express.to,
        text: `${carrier.name} brought the express from ${origin} to ${world.map.sites[express.to].name}.`,
      });
    }
    if (world.minute < state.heard[express.to] + RELAY_MINUTES) continue;
    const provenance = [...express.provenance, { id: carrier.id, name: carrier.name, atSiteId: express.to, minute: state.heard[express.to] }];
    const causeId = express.relayEventId || record(world, 'relay', { actorId: carrier.id, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-027', topicId, siteId: express.to, text: `The express from ${origin} was read at ${world.map.sites[express.to].name}.` });
    // A stop reached twice (two roads meeting) sends the word on once.
    if (!state.sent.includes(express.to)) {
      state.sent.push(express.to);
      sendOnward(world, express.topicId, express.to, provenance, causeId, beginTravel);
      // The spring's word goes out to the families from here as a line in the journal (`hearExpresses`), not by a rider who talks.
      for (const household of state.word ? [] : Object.values(world.households)) {
        if (household.settlementId !== express.to) continue;
        relayReport(world, { topicId: express.topicId, householdId: household.id, fromSiteId: express.to, originSiteId: SOURCE, status: 'unconfirmed', provenance, causeId });
      }
    }
    // The rider's errand is done, and he rides home to where he set out from (owner, 2026-09-27; sim/encounters.mjs
    // `advanceDepartures`), like any courier after theirs.
    delete carrier.express;
  }
  hearExpresses(world);
}

// ------------------------------------------------------------------------------------------------ the spring's word

const SPRING_CLAIM = 'FIC-GONZ-955';
/** A fate the family does not know yet and that leaves nobody there to hear anything: killed, shot, or marched off a prisoner. */
const LOST = ['fell', 'killed', 'executed', 'captured'];
const lostUntold = service => Boolean(service && !service.told && (LOST.includes(service.fate) || (service.kind === 'fannin' && service.fate === 'spared')));
/**
 * Where a family can hear the word: wherever each of its own people is standing or riding - at home, on the road east, at the
 * refuge, with the army - but not a prisoner of the war (Coleto, the south, Goliad's spared), and not somebody already dead whose
 * family has not yet been told so. Somebody the Mexican army took at home in the Scrape is still at home, and hears there.
 * ceiling: household knowledge, not person by person (docs/LIVING_INFORMATION.md): what one of the family hears, the family knows,
 * as sim/advance-word.mjs `eyesOf` has it for the Mexican advance.
 */
function hearers(world, household) {
  return household.members.map(id => world.entities[id]).filter(person => person?.kind === 'person' && person.location
    && person.health?.condition !== 'dead' && !['prisoner', 'captured'].includes(person.service?.status) && !lostUntold(person.service));
}
const listeners = (world, household) => hearers(world, household).map(person => person.location);
/** Whether anybody of the family could hear word at all: nobody, if every one of them is dead or a prisoner of the war. */
export const canHear = (world, household) => listeners(world, household).length > 0;
const crow = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/** Road miles between two places, kept for the map: a settlement's rider takes the road out to a family's gate or a town. */
const ROAD_MILES = new WeakMap();
function roadMiles(world, from, to) {
  let known = ROAD_MILES.get(world.map);
  if (!known) ROAD_MILES.set(world.map, known = new Map());
  const key = `${from}>${to}`;
  if (!known.has(key)) {
    const path = findPath(world.map, from, to);
    known.set(key, path ? path.distance : crow(world.map.sites[from], world.map.sites[to]));
  }
  return known.get(key);
}
/** Minutes a rider takes over so many miles, at the express's own pace (`RIDER_SPEED`, riding all hours). */
const rideMinutes = miles => miles / RIDER_SPEED * FARMING_TICK_MINUTES;
/**
 * The stops the spring's word is carried to: each family's own settlement, the refuge it is making for, and the stop nearest
 * each of its people as the word leaves. The first road found to each is the one the word takes (`expressRoutes`).
 * ceiling: laid once, when the word leaves; a family that moves on afterwards hears from whichever stop on those roads has it
 * nearest, and a place off them hears later than it might.
 */
function springTargets(world) {
  const stops = Object.values(world.map.sites).filter(isStop);
  const nearestStop = place => stops.reduce((best, site) => !best || crow(site, place) < crow(best, place) ? site : best, null)?.id;
  const targets = new Set();
  for (const household of Object.values(world.households)) {
    if (world.map.sites[household.settlementId]) targets.add(household.settlementId);
    if (world.map.sites[household.flight?.refuge]) targets.add(household.flight.refuge);
    for (const place of listeners(world, household)) { const stop = nearestStop(place); if (stop) targets.add(stop); }
  }
  return [...targets];
}

/**
 * The spring's word leaves `from` by express (docs/COLONIES.md §5.4c): a fresh rider on each road to the stops the families are
 * near, a six-hour wait at each while it is read and copied, and on - the autumn's letters' way exactly. `word` is what each
 * family's journal will say (`status`, `text`, `source`). Only on the real land and with riders who can ride (`beginTravel`);
 * where it cannot go, nothing is sent and the caller tells the families as it always did. Once for each word.
 */
export function sendExpress(world, topicId, { from, status = 'confirmed', text, source, beginTravel, key = topicId }) {
  if (!world.map?.source || typeof beginTravel !== 'function' || world.expresses?.[key] || !world.truth[topicId] || !world.map.sites[from]) return false;
  world.expresses = { ...(world.expresses || {}) };
  const routes = expressRoutes(world, from, springTargets(world));
  const due = schedule(world, from, routes, world.minute);
  const causeId = record(world, 'relay', {
    // In the causal record only: no family has heard anything yet.
    classification: 'FICTIONAL FOR GAMEPLAY', claimId: SPRING_CLAIM, topicId, siteId: from, causes: [world.truth[topicId].eventId],
    text: `Word left ${world.map.sites[from].name} by express for the settlements.`,
  });
  // A second wave of the same word (`key` other than the topic: the fuller account after a rumour) keeps its topic beside it.
  world.expresses[key] = { leftMinute: world.minute, from, routes, due, heard: { [from]: world.minute }, sent: [from], word: { status, text: text || world.truth[topicId].text, source, causeId }, ...(key !== topicId && { topicId }) };
  sendOnward(world, key, from, [], causeId, beginTravel);
  return true;
}

/**
 * When the word comes in at each stop (docs/COLONIES.md §5.4d): the ride over the road from the stop it hears from at the
 * courier's pace, after the six hours there - none where it began. Worked out when it leaves, so the calendar's long ticks (twelve
 * hours before Béxar, and a courier's first stretched tick held to half his leg, sim/world.mjs `progressTravel`) never make it
 * late; the riders are sent on each road at the scheduled minute and ride it to be seen (`keepSchedules`).
 */
function schedule(world, from, routes, leftMinute) {
  const due = { [from]: leftMinute };
  const at = stop => {
    if (Number.isFinite(due[stop])) return due[stop];
    const parent = routes[stop];
    return due[stop] = at(parent) + (parent === from ? 0 : RELAY_MINUTES) + rideMinutes(roadMiles(world, parent, stop));
  };
  for (const stop of Object.keys(routes)) at(stop);
  return due;
}
/** The words kept to a schedule: each stop hears when it is due, and fresh riders go on from it when it has read it. */
function keepSchedules(world, beginTravel) {
  for (const [key, state] of Object.entries(world.expresses || {})) {
    if (!state.due || state.settled) continue;
    const topicId = state.topicId || key;
    for (const [stop, minute] of Object.entries(state.due)) {
      if (world.minute < minute || !world.map.sites[stop]) continue;
      if (state.heard[stop] === undefined) {
        state.heard[stop] = minute;
        record(world, 'relay', { classification: 'FICTIONAL FOR GAMEPLAY', claimId: SPRING_CLAIM, topicId, siteId: stop, text: `The express from ${world.map.sites[state.from].name} came in to ${world.map.sites[stop].name}.` });
      }
      if (!state.sent.includes(stop) && world.minute >= minute + RELAY_MINUTES) {
        state.sent.push(stop);
        sendOnward(world, key, stop, [], state.word?.causeId || null, beginTravel);
      }
    }
  }
}

/**
 * About how long an express takes from one place to another (docs/COLONIES.md §5.4d): its ride over the road between each pair
 * of stops at the courier's pace, and the six hours at every stop in between. For a word the record dates where it was *heard*
 * - San Felipe's dates for news from the army before Béxar - so that it leaves the army in time to be there then.
 */
export function expressMinutes(world, from, to) {
  if (!world.map?.sites?.[from] || !world.map.sites[to] || from === to) return 0;
  const routes = expressRoutes(world, from, [to]);
  if (!(to in routes)) return rideMinutes(crow(world.map.sites[from], world.map.sites[to]));
  let minutes = 0;
  for (let stop = to; stop !== from; stop = routes[stop]) minutes += rideMinutes(roadMiles(world, routes[stop], stop)) + (routes[stop] === from ? 0 : RELAY_MINUTES);
  return minutes;
}

/**
 * Word still on the road when a class period ends has come in by the next (sim/periods.mjs `beginSecondPeriod`): every family
 * that has not heard a word carried by express hears it now, from `source`, and the riders carrying it are let go home
 * (`FIC-GONZ-958`, docs/COLONIES.md §5.4d).
 */
export function settleExpresses(world, source) {
  for (const [key, state] of Object.entries(world.expresses || {})) {
    const topicId = state.topicId || key;
    if (!state.word || state.settled || !world.truth[topicId]) continue;
    for (const household of Object.values(world.households)) {
      if (wouldLearn(world, household.id, topicId, state.word.status)) learn(world, household.id, topicId, { status: state.word.status, text: state.word.text, source, causes: state.word.causeId ? [state.word.causeId] : [] });
    }
    state.settled = true;
    for (const carrier of Object.values(world.entities)) if (carrier.express?.topicId === key) delete carrier.express;
  }
}

/**
 * When the spring's word could first have reached one of the family's people, and from which stop. Each of them hears it from
 * the stop nearest where they are of those the express goes to - its settlement's riders, as in the autumn, and never a rider
 * straight out from where the word came in, which would bring a family a hundred miles off the news in half a day (see the top
 * of this file): at the stop itself the moment the express comes in; elsewhere once it has been read there (`RELAY_MINUTES`; at
 * once where the word came in) and a rider has ridden out, by the road to a family's gate or a town, as the crow flies to
 * somebody out on the road. `null` if not yet.
 */
function heardBy(world, state, people) {
  const stops = [state.from, ...Object.keys(state.routes)].map(id => world.map.sites[id]).filter(Boolean);
  let best = null;
  for (const person of people) {
    const place = person.location;
    const site = place.siteId && stops.find(stop => stop.id === place.siteId)
      || stops.reduce((near, stop) => !near || crow(stop, place) < crow(near, place) ? stop : near, null);
    const minute = site && state.heard[site.id];
    if (!Number.isFinite(minute)) continue;
    const at = place.siteId === site.id ? minute
      : minute + (site.id === state.from ? 0 : RELAY_MINUTES) + rideMinutes(place.siteId && world.map.sites[place.siteId] ? roadMiles(world, site.id, place.siteId) : crow(site, place));
    if (at <= world.minute && (!best || at < best.minute)) best = { minute: at, stop: site.id, personId: person.id };
  }
  return best;
}

/** Each family that the spring's word has now reached writes it in its journal, saying where it was carried on from. */
export function hearExpresses(world) {
  for (const [key, state] of Object.entries(world.expresses || {})) {
    const topicId = state.topicId || key;
    if (!state.word || state.settled || !world.truth[topicId]) continue;
    const { status, text, source, causeId } = state.word;
    for (const household of Object.values(world.households)) {
      if (!wouldLearn(world, household.id, topicId, status)) continue;
      const heard = heardBy(world, state, hearers(world, household));
      if (!heard) continue;
      const stop = world.map.sites[heard.stop].name.replace(/^The /, 'the ');
      // "Travis's letter, carried on from Gonzales" already says it was carried on: "…, and on from San Felipe de Austin".
      const via = heard.stop === state.from ? '' : /carried on from/.test(source || '') ? `, and on from ${stop}` : `, carried on from ${stop}`;
      if (!learn(world, household.id, topicId, { status, text, source: `${source || 'Word by express'}${via}`, causes: causeId ? [causeId] : [] })) continue;
      // The rider who brought it, and who of the family he told, as a scene (owner, 2026-10-05: "Every rider who reaches you";
      // sim/encounters.mjs `tellPassing`, `FIC-GONZ-1196`): said to them on the minute the word is known, and asked about after.
      // He set out from the stop once it was read there (none where the word came in), so his ride and the word's age are told.
      const read = heard.stop === state.from ? state.heard[heard.stop] : state.heard[heard.stop] + RELAY_MINUTES;
      tellPassing(world, household.id, { topicId, listenerId: heard.personId, via: 'express', text, source, status, fromSiteId: state.from, stopSiteId: heard.stop, departedMinute: Math.min(world.minute, Number.isFinite(read) ? read : world.minute) });
    }
  }
}

/** A stored express is a word the world knows, on a road that is there, with a real place for every hand. */
export function expressesInvalid(world) {
  for (const [key, state] of Object.entries(world.expresses || {})) {
    if (state.topicId !== undefined && typeof state.topicId !== 'string') return 'Invalid express';
    if (!world.truth[state.topicId || key] || !Number.isFinite(state.leftMinute) || !state.routes || !state.heard || !Array.isArray(state.sent)) return 'Invalid express';
    // The spring's word: where it came in, and what the journal says (a word of the autumn has neither).
    if (state.from !== undefined && !world.map.sites[state.from]) return 'An express from nowhere';
    if (state.due !== undefined && (typeof state.due !== 'object' || Object.entries(state.due).some(([site, minute]) => !world.map.sites[site] || !Number.isFinite(minute)))) return 'An express due nowhere';
    if (state.word !== undefined && (typeof state.word?.text !== 'string' || !['rumor', 'unconfirmed', 'confirmed', 'contradicted'].includes(state.word.status))) return 'Invalid express word';
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

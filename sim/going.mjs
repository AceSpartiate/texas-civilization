/**
 * How they will go: asked before anybody leaves (owner, 2026-09-24; docs/FAMILY_PANEL.md §15).
 *
 * > "when sending someone to travel, the game should ask how they'll travel."
 *
 * Every order that puts a person on a road off the family's land - to town, to the timber, a call, the march, carrying food,
 * a visit to a neighbour, home from away - is answered first by the way of going. This module is the one reckoning of the
 * ways a person has for one journey: every way, quickest first, each with the server's facts about it (its pace, the
 * journey's length and time, what it carries against what is carried, how tiring it is) and, when it cannot go, why, in the
 * holder's own name (`modeAvailability`, sim/world.mjs, reading sim/keeping.mjs `userOf`). `quickest` is the first that
 * can go: the page marks it and chooses it, and an order sent with no way - a family nobody plays, a person on auto, a
 * command older than the question - goes that way, so a student and the director obey the one rule.
 *
 * The errand to town (sim/errands.mjs) is the same question with a load that must fit: it asks this module too, and its
 * popup draws the same component (public/going.js).
 *
 * `modeAvailability` is handed in, as it is to sim/chores.mjs and sim/errands.mjs, so no arrow from here to sim/world.mjs has
 * to exist. The only other imports are the travel table and the ways over the ground.
 */
import { DEFAULT_MODE, MODES, groundLeft, milesAnHour, FARMING_TICK_MINUTES } from './travel.mjs';
import { findWay } from './ways.mjs';
import { vehicleCarry } from './keeping.mjs';

/**
 * The ways, quickest first: the horse, on foot, the ox and wagon (sim/travel.mjs speeds). The order is the truth on every
 * road, not a rule of thumb: the horse and the walker take the same ways and the horse is faster on each, and the wagon, which
 * keeps to the roads the walker may also take, is slower than walking on all of them and wades a ford twice as long.
 */
export const QUICKEST = Object.freeze(Object.values(MODES).slice().sort((a, b) => b.speed - a.speed).map(mode => mode.id));
/** How tiring each way is, by its `exertion` (sim/travel.mjs): the words on the chooser. */
const TIRING = Object.freeze({ foot: 'Tiring: every mile is on their legs.', horse: 'Hardly tiring.', wagon: 'Half as tiring as walking.' });
const round1 = value => Math.round(value * 10) / 10;
const loadsWord = amount => { const shown = round1(amount); return `${shown} ${shown === 1 ? 'load' : 'loads'}`; };

/** Hours of going for this way over this path, and its miles: null when the way there is not known. */
function timeOf(path, modeId) {
  if (!path) return null;
  const ticks = groundLeft({ points: path.points, pace: path.pace, distance: path.distance, progress: 0 }) / MODES[modeId].speed;
  return { miles: round1(path.distance), hours: round1(ticks * FARMING_TICK_MINUTES / 60) };
}
/** "about 3 hours", "about 40 minutes": how long the going takes, one way. */
export function hoursWords(hours) {
  if (!Number.isFinite(hours)) return '';
  if (hours < 1) return `about ${Math.max(5, Math.round(hours * 12) * 5)} minutes`;
  const shown = hours < 10 ? Math.round(hours * 2) / 2 : Math.round(hours);
  return `about ${shown} ${shown === 1 ? 'hour' : 'hours'}`;
}

/**
 * Every way this person could make this journey, quickest first, with `can`, `why` and the facts the chooser shows.
 *
 * - `to`: the site they are going to, when it is on the map; `point` its place when it is not yet (a hunting ground found and
 *   not kept), for the miles as the crow flies.
 * - `load`: what is carried, in the house's units, when a load must fit (the errand); a way that cannot carry it is shut.
 * - `needsWagon`: the wagon itself is the errand (the wheelwright).
 * - `newWagon`: a new wagon is bought and driven home (the wheelwright's, 2026-09-25): the ox and wagon cannot be the way there,
 *   and with `leadsHorse` (a horse bought too) nor can the horse, which would have to be led home behind it.
 * - `only` and `onlyWhy`: a journey that can go one way only (logs come home in the wagon), and why the others cannot.
 * - `haul`: `{ resource, got }`, what a good trip would give, for the "brings home" of each way (a hunt in the timber).
 * - `noRoad(id)`: the sentence for a way with no road there.
 * - `home`: `{ pace, words }`, what comes home on the hoof from the errand (sim/errands.mjs, sim/beasts.mjs) - a horse or an ox led
 *   on a halter, cattle and hogs driven - and the pace it holds its bringer to, for the way home of each way (`leads`).
 */
export function waysFor(world, entity, journey = {}, modeAvailability = null) {
  return QUICKEST.map(id => oneWay(world, entity, id, journey, modeAvailability));
}
/**
 * The quickest way that can go, reckoned a way at a time and stopping at the first that can: the chooser's `quickest`, by the
 * same function, without finding a road for the slower ways when the horse is free. What an order with no way takes.
 */
export function quickestWay(world, entity, journey = {}, modeAvailability = null) {
  for (const id of QUICKEST) if (oneWay(world, entity, id, journey, modeAvailability).can) return id;
  return null;
}
/** One way of going for one journey: its facts, and whether it can go and why not. */
function oneWay(world, entity, id, { to = null, point = null, load = 0, needsWagon = false, newWagon = false, leadsHorse = false, only = null, onlyWhy = null, haul = null, noRoad = null, home = null } = {}, modeAvailability = null) {
  const from = entity.location?.siteId;
  const where = world.map.sites[from];
  const mode = MODES[id];
  const path = from && to && world.map.sites[to] ? findWay(world, from, to, id) : null;
  const time = timeOf(path, id) || (point && where ? (() => {
    const miles = Math.hypot(point.x - where.x, point.y - where.y);
    return { miles: round1(miles), hours: round1(miles / milesAnHour(mode.speed)) };
  })() : null);
  // What this way carries: a carreta made at home carries less than the wagon (sim/keeping.mjs `vehicleCarry`, owner 2026-09-25).
  const carry = vehicleCarry(world, entity, id), carreta = id === 'wagon' && carry !== mode.carry;
  const base = {
    id, name: carreta ? 'With the ox and carreta' : mode.name, carry, pace: `${round1(milesAnHour(mode.speed))} miles an hour`, tiring: TIRING[id],
    ...(time && { miles: time.miles, hours: time.hours, time: hoursWords(time.hours) }),
    ...(load > 0 && { carrying: `${loadsWord(load)} of the ${carry} it carries` }),
    ...(haul && { brings: `Brings home ${Math.min(haul.got, carry)} ${haul.resource}${haul.got > carry ? ` of ${haul.got}; the rest is left behind` : ''}.` }),
    ...(home && { leads: homeWords(path, id, home) }),
  };
  if (only && id !== only) return { ...base, can: false, why: onlyWhy || `This goes ${MODES[only].name.toLowerCase()}.`, notTheWagon: true };
  if (needsWagon && id !== 'wagon') return { ...base, can: false, why: 'The wheelwright works on the wagon itself, so the wagon has to go.', notTheWagon: true };
  // A new wagon from the wheelwright is driven home by whoever bought it (sim/shops.mjs `buy-wagon`): one person drives one wagon,
  // and a horse ridden in walks home tied on behind it - so it cannot also lead home a horse bought the same trip.
  if (newWagon && id === 'wagon') return { ...base, can: false, why: 'One person drives one wagon home. Whoever fetches the new wagon goes on foot or on the horse.', notTheWagon: true };
  if (newWagon && leadsHorse && id === 'horse') return { ...base, can: false, why: 'The horse ridden in walks home tied behind the new wagon, and one person leads one animal. Walk, or send somebody else for the new horse.', notTheWagon: true };
  if (carry + 1e-9 < load) return { ...base, can: false, why: `${carreta ? 'The carreta carries' : CARRIES[id]} ${carry}, and this is ${loadsWord(load)}.`, tooMuch: true };
  const open = modeAvailability ? modeAvailability(world, entity, id, path) : (id === DEFAULT_MODE ? { can: true } : { can: false, why: 'No way of going was given.' });
  // A way with no road there cannot go - except on foot, which crosses any country (sim/ways.mjs), and a place not yet on
  // the map, which every way reaches as it reaches the timber.
  if (open.can && (path || id === DEFAULT_MODE || !to || !world.map.sites[to])) return { ...base, can: true };
  return { ...base, can: false, why: open.why || (noRoad ? noRoad(id) : `There is no road there for the ${NOUN[id]}.`) };
}
/**
 * The way home with an animal on the hoof: what is led or driven, and - when it walks slower than this way goes - the time home at
 * its pace ("Leads the new ox home, at an ox's pace. Home in about 6 hours."). A led horse keeps up with any way.
 */
function homeWords(path, id, home) {
  const slower = home.pace && home.pace < MODES[id].speed - 1e-9;
  if (!slower || !path) return home.words;
  const ticks = groundLeft({ points: path.points, pace: path.pace, distance: path.distance, progress: 0 }) / home.pace;
  return `${home.words} Home in ${hoursWords(round1(ticks * FARMING_TICK_MINUTES / 60))}.`;
}
const CARRIES = Object.freeze({ foot: 'On foot a person carries', horse: 'The horse carries', wagon: 'The wagon carries' });
const NOUN = Object.freeze({ foot: 'walker', horse: 'horse', wagon: 'wagon' });
/** The quickest way that can go, or null when none can. */
export const quickestOf = ways => ways.find(way => way.can)?.id || null;
/** The ways as the page is sent them: the reckoning's own flags left off. */
export const shownWays = ways => ways.map(({ tooMuch, notTheWagon, ...shown }) => shown);

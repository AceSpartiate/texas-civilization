// The Runaway Scrape: docs/COLONIES.md §7g and build step 10(b), decided by the owner by multiple choice (2026-09-16).
// Researched in docs/battle-research/goliad-scrape-san-jacinto.md (`HIST-TEX-065`).
//
// "Ordered out, with choices along the way." When word reaches a settlement on its date, its families are told to leave. A
// family chooses what to load into the wagon - food, seed, cotton, powder, within the room it has - and where east it will
// go, and sets out together, everybody at home with the ox, the wagon and the horse. The owner: "Families watch as they
// leave the Texas Army burns their farm and house to make sure the Mexican Army can't use it." A family that will not leave
// is burned out anyway when the army passes, and anybody still at home when the Mexican army comes through may be taken
// prisoner. The rivers are in flood: at every crossing the family waits its turn. Rain, cold and hunger make people sick,
// the weak more, and a few of the sick die on the road. When word of San Jacinto comes the families turn home, to what is
// left.
//
// Every date a settlement was told to leave, every day the armies passed, the room in the wagon, the wait at a crossing and
// the sickness are this game's own (`FIC-GONZ-046`); the record gives the days towns were found empty and no count of the dead.
import { record } from './events.mjs';
import { ruin } from './improvements.mjs';
import { findWay } from './ways.mjs';
import { WAGON_SPEED, WALK_SPEED, propertyId } from './travel.mjs';
import { frailty } from './army.mjs';
import { canAnswerCalls } from './family.mjs';

const GONE = ['dead', 'captured'];
const DAY = 1440;
/** Minutes from midnight on September 29, 1835 to midnight on March 1, 1836 (1836 is a leap year). */
const MARCH_1 = 221760, APRIL_1 = 266400;
const march = (day, hour = 6) => MARCH_1 + (day - 1) * DAY + hour * 60;
const april = (day, hour = 6) => APRIL_1 + (day - 1) * DAY + hour * 60;

/**
 * When each settlement's families were told to leave (`order`), when the Texas army passed and burned what was left
 * (`burn`, two days after: `ceiling:` invented, the record has no day), and when the Mexican army came through (`enemy`;
 * null where it never did). The days towns were found empty are the record's (`HIST-TEX-065`): Gonzales the night of
 * March 13, Washington by the 17th, San Felipe about the 28th, the Brazos settlements about April 1, Nacogdoches before the
 * 13th, Harrisburg the 15th; Victoria, Goliad, Mina, Liberty and Anahuac are placed by the armies' known movements.
 */
export const SETTLEMENT_DAYS = Object.freeze({
  gonzales: { order: march(14), burn: march(16), enemy: march(24, 12) },
  goliad: { order: march(14), burn: march(16), enemy: march(20, 12) },
  refugio: { order: march(14), burn: march(16), enemy: march(16, 12) },
  victoria: { order: march(19), burn: march(21), enemy: march(21, 12) },
  mina: { order: march(17), burn: march(19), enemy: march(26, 12) },
  washington: { order: march(17), burn: march(19), enemy: april(10, 12) },
  'san-felipe': { order: march(28), burn: march(30), enemy: april(7, 12) },
  columbia: { order: april(1), burn: april(3), enemy: april(20, 12) },
  brazoria: { order: april(1), burn: april(3), enemy: april(20, 12) },
  velasco: { order: april(1), burn: april(3), enemy: april(20, 12) },
  matagorda: { order: april(1), burn: april(3), enemy: april(20, 12) },
  nacogdoches: { order: april(12), burn: april(14), enemy: null },
  liberty: { order: april(13), burn: april(15), enemy: null },
  anahuac: { order: april(13), burn: april(15), enemy: null },
  harrisburg: { order: april(14), burn: april(15, 12), enemy: april(15, 12) },
});

/** Where a family may make for: the crossings and towns east that the refugees made for, each with the river it is over. */
export const REFUGES = Object.freeze(['san-felipe', 'washington', 'lynchburg', 'liberty', 'nacogdoches']);
/** The room in the wagon for the flight, in the family's own units, and what each thing takes of it. */
export const FLIGHT_ROOM = 20, FLIGHT_SPACE = Object.freeze({ food: 0.25, seed: 1, cotton: 0.5, powder: 0.1 });
/** On foot, each grown person carries this much room's worth. */
export const CARRIED_ROOM = 1.25;
/** A flooded river: the wait for a turn at the crossing, in hours of 1836. */
export const CROSSING_HOURS = 18;
/** Whoever is at home when the Mexican army comes through is taken prisoner at this share. */
export const CAPTURED_AT_HOME = 0.5;
/**
 * Sickness on the road (owner: "rarely fatal", about one person in a hundred over the whole flight): the chance a person falls
 * sick in a day, doubled for a child under six and doubled again for a family out of food; the sick mend in five days, and
 * each day sick carries this chance of dying. Both are weighted by hidden strength and health like every risk.
 */
export const SICK_PER_DAY = 0.004, SICK_DAYS = 5, DEATH_PER_SICK_DAY = 0.02;

/** A share in [0, 1) that is always the same for this class, this person and this question. */
export function share(world, personId, question) {
  let hash = 0x811c9dc5;
  for (const char of `${world.seed}:${personId}:${question}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash / 0x100000000;
}

const settlementOf = household => household.settlementId || 'gonzales';
const people = (world, household) => household.members.map(id => world.entities[id]).filter(Boolean);
const atHome = (world, household) => people(world, household).filter(person => !GONE.includes(person.health?.condition) && person.location?.siteId === household.homeSiteId && !person.travel);
const beasts = (world, household) => ['horse', 'ox', 'wagon'].map(role => world.entities[propertyId(household.id, role)]).filter(Boolean);
const tell = (world, household, text, extra = {}) => record(world, 'consequence', { householdId: household.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-046', text, ...extra });

/** Whether the flight is on: the third class period. */
export const scrapeOn = world => world.period === 3 && !world.director?.complete;

/** The room this family has to carry things away in: the wagon and ox standing at home, or what its grown people carry. */
export function flightRoom(world, household) {
  const wagon = world.entities[propertyId(household.id, 'wagon')], ox = world.entities[propertyId(household.id, 'ox')];
  const drawn = [wagon, ox].every(beast => beast && !beast.travel && beast.location.siteId === household.homeSiteId && (!beast.condition || beast.condition === 'sound'));
  if (drawn) return { room: FLIGHT_ROOM, mode: 'wagon' };
  return { room: Math.round(atHome(world, household).filter(canAnswerCalls).length * CARRIED_ROOM * 100) / 100, mode: 'foot' };
}

const spaceOf = take => Object.entries(take).reduce((sum, [good, amount]) => sum + (FLIGHT_SPACE[good] ?? 0) * amount, 0);

/** Why this family cannot leave as asked, or null. */
export function fleeRefusal(world, household, { take = {}, refuge } = {}) {
  const flight = household.flight;
  if (!scrapeOn(world)) return 'Nobody has told the family to leave.';
  if (!flight || !['ordered', 'stayed'].includes(flight.status)) return flight ? 'The family has already left.' : 'Nobody has told the family to leave.';
  if (!REFUGES.includes(refuge)) return 'Choose where the family will make for.';
  if (world.map.sites[refuge].x <= world.map.sites[household.homeSiteId].x + 2) return `${world.map.sites[refuge].name} is not east of here.`;
  for (const [good, amount] of Object.entries(take)) {
    if (!(good in FLIGHT_SPACE) || !Number.isInteger(amount) || amount < 0) return 'Say how much of each thing, in whole amounts.';
    if (amount > Math.floor(household.resources?.[good] ?? 0)) return `There is not that much ${good} in the house.`;
  }
  const { room } = flightRoom(world, household);
  if (spaceOf(take) > room + 1e-9) return `That will not fit. There is room for ${room} and this takes ${Math.round(spaceOf(take) * 100) / 100}.`;
  if (!atHome(world, household).length) return 'Nobody of the family is at home to go.';
  return null;
}

/** The settlement's word: this family is told to leave, and a "!" waits on its main person. */
export function orderOut(world, household, causeId) {
  if (household.flight) return;
  household.flight = { status: 'ordered', orderedMinute: world.minute };
  tell(world, household, `Word has come from ${world.map.sites[settlementOf(household)].name}: the Mexican army is coming, and every family is to leave for the east. Load what the wagon will carry and go. What is left behind will be burned so the enemy cannot use it.`, { type: 'pressure', causes: causeId ? [causeId] : [] });
}

/** The Texas army burns the house, the field and the fences, and whatever was not carried away is lost. */
export function burnFarm(world, household, { watching }) {
  const ruined = ruin(world, household, ['cabin', 'field', 'fence'], { text: watching
    ? 'As the family drove off, men of the Texas army set fire to the house and the field behind them, so the Mexican army would find nothing to use. They watched it burn from the road.'
    : 'The Texas army passed and set fire to the house and the field, so the Mexican army would find nothing to use.' });
  for (const good of Object.keys(FLIGHT_SPACE)) if (household.resources) household.resources[good] = 0;
  household.furniture = {};
  delete household.interior;
  if (household.stock) household.stock = false;
  household.flight = { ...household.flight, burned: world.minute };
  return ruined;
}

/**
 * The family leaves: what it takes is all it keeps, everybody at home sets out together for the refuge - by the wagon when
 * the ox and wagon stand at home, on foot otherwise - and the farm burns behind them.
 */
/** Why the family cannot decide to stay, or null. */
export function stayRefusal(world, household) {
  if (!scrapeOn(world) || !household.flight) return 'Nobody has told the family to leave.';
  if (household.flight.status !== 'ordered') return 'The family has already decided.';
  return null;
}
/**
 * The family decides to stay and take what comes (owner: "burned anyway, at risk"). Said, not left to silence: since auto
 * packs the wagon of a family that answers nothing for a day (sim/auto.mjs), refusing to go has to be an answer of its own.
 * The family can still go east later, burned out or not (`fleeRefusal` allows 'stayed').
 */
export function stayHome(world, household) {
  const why = stayRefusal(world, household);
  if (why) throw new Error(why);
  household.flight.status = 'stayed';
  household.flight.stayedMinute = world.minute;
  tell(world, household, 'The family will stay, and take what comes. The Texas army will burn what it finds standing, and whoever is at home when the Mexican army comes may be taken. The road east is still open.', { importance: 2 });
}

export function flee(world, household, { take = {}, refuge }) {
  const why = fleeRefusal(world, household, { take, refuge });
  if (why) throw new Error(why);
  const { mode } = flightRoom(world, household);
  const kept = { ...household.resources };
  // What is taken rides; the rest is left in the house for the fire.
  for (const good of Object.keys(FLIGHT_SPACE)) household.resources[good] = 0;
  const goers = atHome(world, household).filter(person => person.health?.condition !== 'wounded');
  const path = findWay(world, household.homeSiteId, refuge, mode);
  if (!path) throw new Error('No road east from here.');
  const departure = tell(world, household, `The family loaded ${Object.entries(take).filter(([, amount]) => amount > 0).map(([good, amount]) => `${amount} ${good}`).join(', ') || 'what it could carry'} and set out east for ${world.map.sites[refuge].name}${mode === 'wagon' ? ' with the ox and wagon' : ' on foot'}.`);
  const speed = mode === 'wagon' ? WAGON_SPEED : WALK_SPEED;
  const travellers = [...goers, ...beasts(world, household).filter(beast => !beast.travel && beast.location.siteId === household.homeSiteId)];
  for (const entity of travellers) {
    entity.chore = null;
    entity.travel = { from: household.homeSiteId, to: refuge, points: path.points.map(point => ({ ...point })), progress: 0, distance: path.distance, speed, mode, purpose: 'flee', silent: true, causeId: departure, ...(path.pace?.length && { pace: path.pace }) };
    entity.location = { ...path.points[0], siteId: null };
    if (entity.kind === 'person') entity.task = 'travel';
    if (entity.kind === 'wagon') entity.laden = true;
    if (entity.kind !== 'person') entity.borrowedBy = goers[0]?.id || null;
  }
  household.flight = { ...household.flight, status: 'fled', refuge, leftMinute: world.minute, mode, took: take, crossed: [] };
  burnFarm(world, household, { watching: true });
  household.resources = { ...household.resources, ...Object.fromEntries(Object.entries(take).map(([good, amount]) => [good, amount])), money: kept.money ?? 0 };
  return departure;
}

/** The crossings on this family's road: the ferries and fords over the big rivers, in the order the road meets them. */
function crossingsAlong(world, travel) {
  const sites = Object.values(world.map.sites).filter(site => site.kind === 'crossing' || ['san-felipe', 'washington', 'lynchburg', 'liberty'].includes(site.id));
  const found = [];
  let walked = 0;
  for (let i = 1; i < travel.points.length; i++) {
    const a = travel.points[i - 1], b = travel.points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    for (const site of sites) {
      const t = length ? Math.max(0, Math.min(1, ((site.x - a.x) * (b.x - a.x) + (site.y - a.y) * (b.y - a.y)) / (length * length))) : 0;
      const near = Math.hypot(site.x - (a.x + (b.x - a.x) * t), site.y - (a.y + (b.y - a.y) * t));
      if (near < 0.3 && !found.some(one => one.id === site.id)) found.push({ id: site.id, at: walked + length * t });
    }
    walked += length;
  }
  return found.filter(one => one.at < travel.distance - 0.3).sort((a, b) => a.at - b.at);
}

/** One tick of the flight for every family on the road: the rivers, the food, the sickness, and arriving. */
export function advanceFlight(world, minutes) {
  const days = minutes / DAY;
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (!flight || !['fled', 'refuged', 'returning'].includes(flight.status)) continue;
    const travellers = [...household.members, ...(household.property || [])].map(id => world.entities[id]).filter(entity => entity?.travel && ['flee', 'return'].includes(entity.travel.purpose));
    const leader = travellers.find(entity => entity.kind === 'person') || travellers[0];
    // At a flooded river the whole family waits its turn, then goes over together.
    if (leader && flight.status === 'fled') {
      if (flight.crossing) {
        if (world.minute >= flight.crossing.until) {
          for (const entity of travellers) delete entity.travel.halted;
          flight.crossed = [...(flight.crossed || []), flight.crossing.siteId];
          tell(world, household, `The family got over at ${world.map.sites[flight.crossing.siteId].name} and went on.`, { importance: 2 });
          delete flight.crossing;
        }
      } else {
        const next = crossingsAlong(world, leader.travel).find(one => !(flight.crossed || []).includes(one.id) && leader.travel.progress >= one.at - 0.05);
        if (next) {
          for (const entity of travellers) entity.travel.halted = true;
          flight.crossing = { siteId: next.id, until: world.minute + CROSSING_HOURS * 60 };
          tell(world, household, `The river is up at ${world.map.sites[next.id].name}, and families are waiting their turn to get over. The family waits with them.`, { importance: 2 });
        }
      }
    }
    // On the road the family eats what it carries, and goes hungry when that is gone.
    const alive = people(world, household).filter(person => !GONE.includes(person.health?.condition) && (person.travel?.purpose === 'flee' || person.travel?.purpose === 'return' || person.location?.siteId === flight.refuge));
    if (flight.status !== 'returning' && household.resources) household.resources.food = Math.max(0, Math.round((household.resources.food - alive.length * 0.35 * days) * 10000) / 10000);
    const hungry = (household.resources?.food ?? 0) <= 0;
    // Sickness, and the rare death, rolled by the day.
    const day = Math.floor(world.minute / DAY);
    if (flight.status !== 'home' && day !== flight.sickDay) {
      flight.sickDay = day;
      for (const person of alive) {
        const weight = frailty(person) * ((person.age ?? 30) < 6 ? 2 : 1) * (hungry ? 2 : 1);
        if (person.health.condition === 'sick') {
          if (share(world, person.id, `sick-death:${day}`) < 1 - (1 - DEATH_PER_SICK_DAY) ** weight) {
            person.health = { condition: 'dead' }; person.travel = null; person.task = 'rest';
            person.location = { x: person.location.x, y: person.location.y, siteId: person.location.siteId || flight.refuge };
            tell(world, household, `${person.name} died of the sickness on the road, and was buried where they fell.`, { actorId: person.id, claimId: 'HIST-TEX-065' });
          } else if (world.minute >= person.health.recoversAt) person.health = { condition: 'well' };
        } else if (['well', 'tired'].includes(person.health.condition) && share(world, person.id, `sick:${day}`) < 1 - (1 - SICK_PER_DAY) ** weight) {
          person.health = { condition: 'sick', recoversAt: world.minute + SICK_DAYS * DAY };
          tell(world, household, `${person.name} has fallen sick on the road${hungry ? ', with nothing to eat' : ''}.`, { actorId: person.id, importance: 2 });
        }
      }
    }
    // Arrived at the refuge, or home again.
    if (flight.status === 'fled' && !travellers.length) {
      flight.status = 'refuged'; flight.arrivedMinute = world.minute;
      tell(world, household, `The family has reached ${world.map.sites[flight.refuge].name}, and camps there with the other families from the west.`);
    }
    if (flight.status === 'returning' && !travellers.length) {
      flight.status = 'home'; flight.homeMinute = world.minute;
      tell(world, household, 'The family is home. The house and the field are burned, and what was not carried away is gone. They begin again with what they brought.');
    }
  }
}

/** The armies pass: the Texas army burns what a family that stayed left standing; the Mexican army takes who it finds at home. */
export function advanceArmiesPassing(world) {
  const done = world.director.milestones;
  for (const household of Object.values(world.households)) {
    const days = SETTLEMENT_DAYS[settlementOf(household)];
    if (!days) continue;
    const flight = household.flight;
    if (flight && !flight.burned && world.minute >= days.burn) {
      burnFarm(world, household, { watching: false });
      if (household.flight.status === 'ordered') household.flight.status = 'stayed';
    }
    const key = `enemy:${household.id}`;
    if (days.enemy && world.minute >= days.enemy && !done[key]) {
      done[key] = true;
      for (const person of atHome(world, household)) {
        if (share(world, person.id, 'enemy') >= CAPTURED_AT_HOME) continue;
        person.health = { condition: 'captured' }; person.task = 'rest'; person.chore = null;
        tell(world, household, `${person.name} was at home when the Mexican army came through, and was taken prisoner.`, { actorId: person.id });
      }
    }
  }
}

/** Word of the victory: every family at its refuge turns for home. */
export function turnHome(world, causeId) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (!flight || flight.status !== 'refuged') continue;
    const at = flight.refuge;
    const goers = people(world, household).filter(person => !GONE.includes(person.health?.condition) && person.location?.siteId === at && !person.travel && person.health.condition !== 'wounded');
    const mode = flight.mode === 'wagon' && beasts(world, household).filter(beast => beast.location.siteId === at).length === 3 ? 'wagon' : 'foot';
    const path = findWay(world, at, household.homeSiteId, mode);
    if (!goers.length || !path) continue;
    const departure = tell(world, household, `With the news from San Jacinto the family turned for home from ${world.map.sites[at].name}.`, { causes: causeId ? [causeId] : [] });
    for (const entity of [...goers, ...beasts(world, household).filter(beast => beast.location.siteId === at && !beast.travel)]) {
      entity.travel = { from: at, to: household.homeSiteId, points: path.points.map(point => ({ ...point })), progress: 0, distance: path.distance, speed: mode === 'wagon' ? WAGON_SPEED : WALK_SPEED, mode, purpose: 'return', silent: true, causeId: departure, ...(path.pace?.length && { pace: path.pace }) };
      entity.location = { ...path.points[0], siteId: null };
      if (entity.kind === 'person') entity.task = 'travel';
    }
    flight.status = 'returning';
  }
}

/** What the family sees of its own flight. */
/**
 * The load a family that decides alone takes (sim/neighbours.mjs, sim/auto.mjs): all the food that fits, then seed, cotton
 * and powder, for the nearest refuge east. From the flight as the family is shown it (`flightProjection`).
 */
export function packFlight(shown) {
  const take = {}; let room = shown.room;
  for (const good of ['food', 'seed', 'cotton', 'powder']) { const amount = Math.min(shown.have[good] || 0, Math.floor(room / shown.space[good])); take[good] = amount; room -= amount * shown.space[good]; }
  const refuge = [...shown.refuges].sort((a, b) => a.miles - b.miles)[0].id;
  return { take, refuge };
}

/**
 * The family goes without a student's word: its main person is on auto, or nobody answered by hand within
 * `FLIGHT_PATIENCE` (sim/auto.mjs). Packed as a neighbour packs. False when it cannot go yet - nobody at home - which is
 * tried again next tick.
 */
export function autoFlee(world, household, { why = 'auto' } = {}) {
  const shown = flightProjection(world, household);
  if (!shown?.refuges?.length) return false;
  const { take, refuge } = packFlight(shown);
  if (fleeRefusal(world, household, { take, refuge })) return false;
  if (why === 'waited') tell(world, household, 'Nobody gave the word for a day, and the family could wait no longer: it loaded what it could and went.', { importance: 2 });
  flee(world, household, { take, refuge });
  return true;
}

export function flightProjection(world, household) {
  const flight = household?.flight;
  if (!flight) return null;
  const home = world.map.sites[household.homeSiteId];
  const shown = { status: flight.status, ...(flight.refuge && { refuge: flight.refuge, refugeName: world.map.sites[flight.refuge]?.name }), ...(flight.crossing && { waitingAt: world.map.sites[flight.crossing.siteId]?.name }) };
  if (!['ordered', 'stayed'].includes(flight.status)) return shown;
  const { room, mode } = flightRoom(world, household);
  return {
    ...shown, room, mode, space: FLIGHT_SPACE, ...(flight.stayedMinute !== undefined && { decidedToStay: true }),
    have: Object.fromEntries(Object.keys(FLIGHT_SPACE).map(good => [good, Math.floor(household.resources?.[good] ?? 0)])),
    refuges: REFUGES.filter(id => world.map.sites[id] && world.map.sites[id].x > home.x + 2).map(id => ({ id, name: world.map.sites[id].name, miles: Math.round(Math.hypot(world.map.sites[id].x - home.x, world.map.sites[id].y - home.y)) })),
    burned: Boolean(flight.burned),
  };
}

export const FLIGHT_STATUSES = Object.freeze(['ordered', 'fled', 'stayed', 'refuged', 'returning', 'home']);
export function scrapeInvalid(world) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (flight === undefined) continue;
    if (!flight || !FLIGHT_STATUSES.includes(flight.status)) return 'Invalid flight';
    if (flight.refuge !== undefined && !world.map.sites[flight.refuge]) return 'Invalid refuge';
  }
  for (const entity of Object.values(world.entities)) {
    if (entity.health?.condition === 'sick' && !Number.isFinite(entity.health.recoversAt)) return 'A sickness with no mending';
  }
  return null;
}

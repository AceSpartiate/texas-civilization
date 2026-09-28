// Disease: which sicknesses, where, and what rest does. docs/DISEASE.md, the owner's request of 2026-09-27:
//
//   "also, plan for diseases. keep it historical as to which ones. stopping to rest should help characters recover."
//
// and the owner's answers of the same day, by multiple choice (docs/DISEASE.md §7, as decided):
//   1. The five the record supports: measles, whooping cough, camp flux, chills and fever, a chill on the chest. Cholera,
//      smallpox and yellow fever only as the towns' memory of earlier years (`HIST-TEX-665`, `HIST-TEX-667`).
//   2. Children can die of disease, told in one plain sentence to the family: not drawn, not spotlighted, and no name on the
//      Host's projector (sim/host.mjs, sim/overview.mjs).
//   3. Rest: twice the mending, half the risk. An idle sick person counts as resting.
//   4. Between families only at the record's places and dates, announced as news so a family can choose to camp apart;
//      within a family, anywhere the family is together.
//   5. A sick person can work, with a warning (slower mending, higher risk); a very sick person cannot get up.
//   6. About three in a hundred over the whole flight for all diseases together, mostly babies and small children, and none
//      at the siege of Béxar (`HIST-TEX-029`) - nor anywhere in the first period.
//   7. The bark (quinine) helps the chills and fever; calomel and bleeding leave the patient weak for two days.
//   8. The chills and fever in the first period on river-bottom land, until the first hard norther after November 1, with
//      relapses into the winter.
//   9. Rice and tea kept "for sickness" (Harris) as a small store item; no Host setting for a gentler class.
//
// One rule in one place (docs/DISEASE.md §3.1 principle 5): the road (sim/scrape.mjs, through `roadSickness`), home, the
// camp and the refuge all come here, so the way somebody falls sick, gets worse, mends or dies can never drift apart
// between them. `health.condition` stays `'sick'` throughout, so every reader that asks for 'sick' keeps working
// (sim/company.mjs, sim/flight-work.mjs, sim/babies.mjs, sim/houston.mjs, public/motion.js); the new fields sit beside it,
// each absent until it happens, so no class saved before today changes and no save version moved (§3.13):
//
//   health: { condition: 'sick', recoversAt, disease?, since?, grave?, graveDay?, day?, nursed?, relapse? }
//   person.had?: ['measles', ...]           who has had it (absent: dealt from the class seed by age, `hadIt`)
//   person.exposed?: { measles: minute }    takes it at that minute unless already had
//   person.relapse?: minute                  the ague comes back then (none after the bark)
//   household.sickFood?: portions            rice and tea kept for sickness
//   household.flight.apart?: siteId          camped apart from the crowd at that place
//   world.diseaseDay?: day                   the last calendar day the daily roll was made
import { record } from './events.mjs';
import { share, stirredShare } from './shares.mjs';
import { frailty } from './army.mjs';
import { canAnswerCalls, sexOf } from './family.mjs';
import { establishTruth, learn } from './knowledge.mjs';
import { weatherAt } from './weather.mjs';
import { shelterOf } from './houses.mjs';
import { patchAt, woodsRule } from './woods.mjs';
import { landAround } from './ground.mjs';
import { registerChores } from './chores.mjs';
// Cycles, each safe because the other side is used only inside functions: the road calls `roadSickness` from its own loop,
// and this module reads the road's weights and refusals.
import { COLD_WEIGHT, SICK_PER_DAY, coldSky, sicknessWeight } from './scrape.mjs';
import { roadChoreRefusal, withFamily } from './road.mjs';
import { fireKept } from './flight-work.mjs';

const DAY = 1440;
/**
 * The die for everything asked by the day or by one sick person (sim/shares.mjs `stirredShare`): the plain share runs in streaks
 * over keys a digit apart (`worse:3`, `worse:4`), and a sickness that got worse on one day would be likely to again the next.
 * Only the dealt past (`had:`) keeps the plain one; the road's chill (`sick:`) is stirred like the rest since 2026-09-27.
 */
const roll = stirredShare;
const GONE = ['dead', 'captured'];

// ------------------------------------------------------------------------------------------------ the claims

/** The claim IDs this module writes, in one place so a renumbering at merge is one edit (tests/history-registry.test.mjs). */
export const CLAIMS = Object.freeze({
  army: 'HIST-TEX-661', groces: 'HIST-TEX-662', scrape: 'HIST-TEX-663', ague: 'HIST-TEX-664', cholera: 'HIST-TEX-665',
  remedies: 'HIST-TEX-666', notFound: 'HIST-TEX-667',
  diseases: 'FIC-GONZ-661', spread: 'FIC-GONZ-662', rest: 'FIC-GONZ-663', deaths: 'FIC-GONZ-664', nursing: 'FIC-GONZ-665',
  doctor: 'FIC-GONZ-666', flux: 'FIC-GONZ-667', sickFood: 'FIC-GONZ-668',
});

// ------------------------------------------------------------------------------------------------ the diseases

/**
 * The five, with the numbers the game gives them (`FIC-GONZ-661`, `FIC-GONZ-664`; docs/DISEASE.md §3.2, §3.6):
 * - `days`: how long it runs at the ordinary rate, in calendar days (a day of rest counts two, `MEND`).
 * - `worsen`: the base daily chance of turning very sick, and `death`: the base daily chance of dying on a day very sick and
 *   not nursed. Both are raised to the person's weight (`riskWeight`), the shape the road's sickness always had.
 * - `grave(age, person)`: the age's multiplier on that weight; 0 means this sickness never turns very sick at that age.
 * - `household`: the share of those who can take it who do, when it is in the family (measles and whooping cough only).
 * - `under`: only children younger than this can take it (whooping cough).
 * - `weak`: the patient is left tired when it is over.
 *
 * The rates are tuned rather than claimed, against the owner's three in a hundred over the flight (scripts/disease-study.mjs,
 * docs/evidence/disease-study.json); the ratios between the ages are the record's (§2.2: babies and small children).
 */
export const DISEASES = Object.freeze({
  measles: {
    name: 'the measles', short: 'measles', days: 7, worsen: 0.03, death: 0.2, household: 0.9, weak: true, claimId: CLAIMS.scrape,
    // Babies and small children above all, and a grown person who never had it as a child (CDC: "<5 years" and adults).
    grave: age => (age < 2 ? 3 : age < 6 ? 2 : age >= 16 ? 2 : 1),
  },
  'whooping-cough': {
    name: 'the whooping cough', short: 'whooping cough', days: 21, worsen: 0.02, death: 0.2, household: 0.8, under: 10, weak: true, claimId: CLAIMS.scrape,
    // Dangerous to babies under a year, and to nobody else (CDC).
    grave: age => (age < 1 ? 6 : 0),
  },
  ague: {
    name: 'the chills and fever', short: 'chills and fever', days: 6, worsen: 0.015, death: 0.1, claimId: CLAIMS.ague,
    // Seldom grown people (the Gazette of 1829: no deaths); small children only.
    grave: age => (age < 6 ? 2 : 0),
  },
  flux: {
    name: 'the flux', short: 'flux', days: 5, worsen: 0.03, death: 0.16, claimId: CLAIMS.flux,
    grave: age => (age < 5 ? 3 : 1),
  },
  'lung-fever': {
    name: 'a chill on the chest', short: 'chill on the chest', days: 5, worsen: 0.02, death: 0.16, claimId: CLAIMS.diseases,
    grave: age => (age < 2 ? 3 : age < 6 ? 2 : 1),
  },
});
export const DISEASE_IDS = Object.freeze(Object.keys(DISEASES));
/**
 * A sickness with no name: every class saved before 2026-09-27 has only this. It mends and worsens as a chill on the chest
 * does, which is what it always was ("rain, cold and hunger"), and is shown as plain "sick".
 */
const GENERIC = Object.freeze({ ...DISEASES['lung-fever'], name: 'the sickness', short: 'sickness', generic: true });
export const diseaseOf = person => DISEASES[person?.health?.disease] || GENERIC;
const ageOf = person => (Number.isFinite(person?.age) ? person.age : 30);

// ------------------------------------------------------------------------------------------------ rest

/**
 * What the sick person is doing, in the owner's three words (`FIC-GONZ-663`, docs/DISEASE.md §3.7): resting (idle, halted,
 * camped, at home with nothing given them), riding (in the wagon or cart, on the horse, carried), or walking and working.
 */
export const MEND = Object.freeze({ rest: 2, ride: 1, work: 0.5 });
export const RISK = Object.freeze({ rest: 0.5, ride: 1, work: 2 });
/** Chores that are rest for whoever holds them: calling the family's halt to rest. */
const RESTING_CHORES = new Set(['rest-road']);

export function activityOf(world, person) {
  const chore = person.chore;
  if (chore) return RESTING_CHORES.has(chore.id) ? 'rest' : 'work';
  const travel = person.travel;
  if (travel) {
    // A family held on the road - at a flooded river, in the mud, camped to hunt or nurse or rest - is resting, all but
    // whoever is at the work. Digging a wagon out is work for everybody grown (sim/road.mjs `DIG_MILES`).
    if (travel.halted || (Number.isFinite(travel.waitUntil) && world.minute < travel.waitUntil)) {
      const household = world.households[person.householdId];
      return household?.flight?.bog?.freeing && canAnswerCalls(person) ? 'work' : 'rest';
    }
    if (travel.carried || travel.rides || travel.drives || travel.saddle) return 'ride';
    if (travel.afoot) return 'work';
    return travel.mode === 'foot' ? 'work' : 'ride';
  }
  if (person.task === 'work' || person.task === 'help') return 'work';
  return 'rest';
}

// ------------------------------------------------------------------------------------------------ who has had it

/**
 * Who has had the measles, and the whooping cough, before the class began: shown, not hidden (§3.4), because a family knew.
 * Dealt once from the class seed and the person, growing more likely with age - few small children, most grown people - so a
 * class saved before today deals it the same every time without writing anything (`FIC-GONZ-662`).
 */
export function hadShare(disease, age) {
  if (disease === 'measles') return age < 2 ? 0.02 : age < 6 ? 0.15 : age < 10 ? 0.35 : age < 16 ? 0.55 : age < 30 ? 0.75 : 0.85;
  if (disease === 'whooping-cough') return age < 1 ? 0 : age < 5 ? 0.2 : age < 10 ? 0.45 : 1;
  return 0;
}
export function hadIt(world, person, disease) {
  if (person.had?.includes(disease)) return true;
  if (!['measles', 'whooping-cough'].includes(disease)) return false;
  return share(world, person.id, `had:${disease}`) < hadShare(disease, ageOf(person));
}
/** Whether this person can take this sickness now: alive, not sick, young enough, and never had it. */
export function canTake(world, person, disease) {
  if (!person || GONE.includes(person.health?.condition) || person.health?.condition === 'sick') return false;
  const spec = DISEASES[disease];
  if (spec.under && ageOf(person) >= spec.under) return false;
  return !hadIt(world, person, disease);
}

// ------------------------------------------------------------------------------------------------ the weight

/**
 * How heavily getting worse, and dying, falls on this person today (§3.5): hidden frailty (as the road's sickness always had
 * it, sim/scrape.mjs `sicknessWeight`), the disease's age, hunger and cold doubling as they always did, and what they are
 * doing - resting halves it, walking or working doubles it. 0 for an age this disease never turns very sick at.
 */
export function riskWeight(person, disease, { hungry = false, cold = false, activity = 'rest' } = {}) {
  const spec = DISEASES[disease] || GENERIC;
  return frailty(person) * spec.grave(ageOf(person), person) * (hungry ? 2 : 1) * (cold ? COLD_WEIGHT : 1) * RISK[activity];
}
const chance = (base, weight) => (weight > 0 ? 1 - (1 - base) ** weight : 0);

/**
 * Whether a sickness may kill anybody now. None in the first period at all (the owner, 2026-09-27: none at the siege of
 * Béxar, `HIST-TEX-029`, whose record has none; the ague of Austin's colony had "not one single instance of death").
 */
export const deathsAllowed = world => (world.period || 1) >= 2;

// ------------------------------------------------------------------------------------------------ words

const them = person => (sexOf(person) === 'female' ? 'her' : 'him');
const they = person => (sexOf(person) === 'female' ? 'she' : 'he');
const tell = (world, person, text, extra = {}) => record(world, 'consequence', { actorId: person.id, householdId: person.householdId, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.diseases, text, ...extra });
const placeName = (world, siteId) => world.map?.sites?.[siteId]?.name || null;

// ------------------------------------------------------------------------------------------------ falling sick

/**
 * Somebody takes a sickness: named, dated, and said in the family's record with its cause (§3.1 principle 1: no sickness from
 * nowhere). Measles and whooping cough are then in the family: everybody with them who can take it may, in ten to twelve
 * days, and the family is told so plainly.
 */
export function fallSick(world, person, disease, { text, claimId, relapse = false } = {}) {
  const spec = DISEASES[disease];
  person.health = { condition: 'sick', recoversAt: world.minute + spec.days * DAY, disease, since: world.minute, day: Math.floor(world.minute / DAY), ...(relapse && { relapse: true }) };
  if (spec.household) person.had = [...new Set([...(person.had || []), disease])];
  // Whoever was working about the place goes to bed: a sick person left alone rests (the owner, 2026-09-27; §3.7: "the clock
  // never punishes a student for not noticing"). Work a student gave them goes on, with the warning on their row.
  if (person.task === 'work' && !person.chore && !person.travel) person.task = 'rest';
  delete person.exposed?.[disease];
  if (person.exposed && !Object.keys(person.exposed).length) delete person.exposed;
  tell(world, person, text || `${person.name} ${relapse ? 'has the chills and fever again' : `has ${spec.name}`}.`, { claimId: claimId || spec.claimId, disease, sickness: 'fell' });
  if (spec.household) inTheFamily(world, person, disease);
}

/** Two of a family are together: on the family's road east with it, camped with it at the refuge, or standing at one place. */
export function together(world, household, a, b) {
  const flight = household?.flight;
  const onRoad = one => one.service?.status !== 'serving' && ((flight?.status === 'fled' && one.travel?.purpose === 'flee') || (flight?.status === 'returning' && one.travel?.purpose === 'return'));
  if (onRoad(a) && onRoad(b)) return true;
  if (a.travel || b.travel) return false;
  return Boolean(a.location?.siteId) && a.location.siteId === b.location?.siteId;
}

/** Measles or whooping cough is in the family: who is with the sick one and can take it is exposed, at the household share. */
function inTheFamily(world, sick, disease) {
  const household = world.households[sick.householdId];
  if (!household) return;
  const spec = DISEASES[disease];
  let exposed = 0;
  for (const id of household.members) {
    const person = world.entities[id];
    if (!person || person.id === sick.id || !together(world, household, sick, person) || !canTake(world, person, disease) || person.exposed?.[disease]) continue;
    if (roll(world, person.id, `catch:${disease}:${sick.id}`) >= spec.household) continue;
    // Ten to twelve days on, hashed: the measles' own wait before anybody knows (CDC; §2.2).
    person.exposed = { ...(person.exposed || {}), [disease]: world.minute + (10 + Math.floor(roll(world, person.id, `wait:${disease}`) * 3)) * DAY };
    exposed++;
  }
  // Said plainly whenever it reaches somebody new - not who, because nobody knew who had caught it until it came out; not again
  // when the next of the family comes down with it and there is nobody left to catch it.
  if (exposed) record(world, 'consequence', { householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.spread,
    text: `${disease === 'measles' ? 'Measles' : 'Whooping cough'} is in the family. Anyone ${spec.under ? 'under ten ' : ''}who has not had it may take it in about ten days.` });
  return exposed;
}

// ------------------------------------------------------------------------------------------------ the places and dates

/**
 * Where the record puts sickness going round between families, and when (`FIC-GONZ-662`, docs/DISEASE.md §3.4). Exposure is
 * keyed to these and never computed from one player's family to another's, so it is historical, reproducible and explainable.
 * `from`/`to` are dates of 1836 as [month (0-based), day]; the window is inclusive.
 * - The Trinity at the Atascosito crossing and Liberty, from about March 25 into April: measles, whooping cough and sore
 *   eyes (Harris, `HIST-TEX-639`, `HIST-TEX-072`).
 * - Lynch's ferry while the five thousand waited (`HIST-TEX-070`): measles and whooping cough, RECONSTRUCTED from the
 *   Trinity's, since nothing read puts disease there by name.
 */
export const CROWDS = Object.freeze([
  { id: 'trinity', sites: ['atascosito-crossing', 'liberty'], at: 'liberty', place: 'the Trinity', from: [2, 25], to: [3, 30], catching: ['measles', 'whooping-cough'], claimId: 'HIST-TEX-639',
    news: 'There is measles and whooping cough among the families camped at the Trinity, and sore eyes. Anyone who has not had them may take them there.' },
  { id: 'lynchburg', sites: ['lynchburg'], at: 'lynchburg', place: "Lynch's ferry", from: [2, 22], to: [3, 22], catching: ['measles', 'whooping-cough'], claimId: CLAIMS.spread,
    news: "There is measles and whooping cough among the families waiting at Lynch's ferry. Anyone who has not had them may take them there." },
]);
/**
 * The daily chance, at a crowded place in its window and not camped apart, that somebody who can take it takes it home with
 * them (`FIC-GONZ-662`); the sickness itself comes ten to twelve days on, as it does within a family.
 */
export const CROWD_CATCH = Object.freeze({ measles: 0.1, 'whooping-cough': 0.08 });
/**
 * The camp's water fouled (`FIC-GONZ-667`): after two days camped among the families at a refuge in the third period, the
 * daily chance at a weight of one of the flux. Moving on, or camping apart, clears it.
 */
export const FLUX_PER_DAY = 0.02, FLUX_AFTER_DAYS = 2;
/**
 * Houston's army, April 1 to 20, 1836: measles "had broken out in the army" and "the increase of diarrhoea" (Labadie,
 * `HIST-TEX-661`). The daily chances for a man serving there.
 */
export const CAMP_MEASLES = 0.012, CAMP_FLUX = 0.01, CAMP_FROM = [3, 1], CAMP_TO = [3, 20];
/** The siege lines before Béxar, November 2 to December 4, 1835: Austin's dysentery (`HIST-TEX-029`). Never fatal. */
export const SIEGE_FLUX = 0.01;
/**
 * The chills and fever (`HIST-TEX-664`): the daily chance at a weight of one for somebody at home on river-bottom land in the
 * first period, until the first norther after November 1 there; and the share of those who have it who have it again in the
 * winter, thirty to ninety days on (Smithwick: "relapses of the fever"; his "taken down with fever while in Bastrop" of January
 * 1836). The bark prevents the relapse.
 */
export const AGUE_PER_DAY = 0.012, AGUE_RELAPSE = 0.4;

/**
 * Every number the deaths depend on, in one object: what scripts/disease-study.mjs measured against, written into its evidence,
 * so tests/disease.test.mjs can tell when a rate has moved and the measurement of the owner's bound has not been run again.
 */
export const studiedRates = () => ({
  diseases: Object.fromEntries(DISEASE_IDS.map(id => [id, { days: DISEASES[id].days, worsen: DISEASES[id].worsen, death: DISEASES[id].death, household: DISEASES[id].household ?? null }])),
  crowdCatch: { ...CROWD_CATCH }, flux: FLUX_PER_DAY, fluxAfterDays: FLUX_AFTER_DAYS, camp: { measles: CAMP_MEASLES, flux: CAMP_FLUX }, siegeFlux: SIEGE_FLUX,
  ague: AGUE_PER_DAY, agueRelapse: AGUE_RELAPSE, sickPerDay: SICK_PER_DAY, mend: { ...MEND }, risk: { ...RISK },
});
const BOTTOMLAND = new Set(['bottomland', 'bottomland-cane']);

/** The class's minute at dawn on a date: [year, month (0-based), day]. The same epoch `dateOf` reads (sim/clock.mjs). */
export function minuteOn(world, year, month, day) {
  const epoch = world.director?.arrival ? Date.UTC(1835, 8, 28, 6) : Date.UTC(1835, 8, 29);
  return (Date.UTC(year, month, day) - epoch) / 60000;
}
const within = (world, [fromMonth, fromDay], [toMonth, toDay], year = 1836) => world.minute >= minuteOn(world, year, fromMonth, fromDay) && world.minute < minuteOn(world, year, toMonth, toDay + 1);
export const crowdOpen = (world, crowd) => (world.period || 1) === 3 && within(world, crowd.from, crowd.to);

/** Where on the road the family is camped among others today, if anywhere: the crossing it waits at, or its refuge. */
export function campedAt(world, household) {
  const flight = household.flight;
  if (flight?.crossing) return flight.crossing.siteId;
  if (flight?.status === 'refuged') return flight.refuge;
  return null;
}
/** Whether the family has moved its camp apart from the crowd at the place it is camped now (`camp-apart`). */
export const campedApart = (world, household) => Boolean(household.flight?.apart) && household.flight.apart === campedAt(world, household);

/** Whether this family's house stands on river-bottom land, where the ague was worst (§2.1; `standAt`, sim/woods.mjs). */
const bottomCache = new WeakMap();
export function onBottomland(world, household) {
  const site = world.map?.sites?.[household.homeSiteId];
  if (!site || !world.map?.source) return false;
  let cache = bottomCache.get(world);
  if (!cache) bottomCache.set(world, cache = new Map());
  const key = `${household.homeSiteId}:${site.x}:${site.y}`;
  if (!cache.has(key)) {
    const rule = woodsRule(world);
    // ceiling: a class on the woods rules before the grid (`rivers`, `invented`) has no bottomland to read, and takes no ague.
    let stand = null;
    try { stand = ['biomes', 'landfire'].includes(rule) ? patchAt(site, { rule, nearCreek: landAround().nearCreek }).stand : null; } catch { stand = null; }
    cache.set(key, BOTTOMLAND.has(stand));
  }
  return cache.get(key);
}
/** The day of the first norther on or after November 1, 1835 at this family's house: the frost that ends the fever. */
const frostCache = new WeakMap();
export function frostDay(world, household) {
  const site = world.map?.sites?.[household.homeSiteId];
  if (!site) return 0;
  let cache = frostCache.get(world);
  if (!cache) frostCache.set(world, cache = new Map());
  if (!cache.has(household.homeSiteId)) {
    const from = Math.floor(minuteOn(world, 1835, 10, 1) / DAY);
    let found = from + 60;
    for (let day = from; day < from + 60; day++) if (weatherAt(world, site, day).kind === 'norther') { found = day; break; }
    cache.set(household.homeSiteId, found);
  }
  return cache.get(household.homeSiteId);
}

// ------------------------------------------------------------------------------------------------ the day of a sickness

/** Whether a sick person has been nursed today or yesterday (`FIC-GONZ-052`, `FIC-GONZ-665`): nobody nursed dies that day. */
const nursedOn = (person, day) => Number.isInteger(person.health?.nursed) && person.health.nursed >= day - 1;

function ease(world, person, why) {
  delete person.health.grave; delete person.health.graveDay;
  tell(world, person, `${person.name} is past the worst of ${diseaseOf(person).name}${why ? `: ${why}` : ''}.`, { claimId: CLAIMS.nursing, sickness: 'eased', ...(person.health.disease && { disease: person.health.disease }) });
}

function die(world, household, person, where) {
  const spec = diseaseOf(person);
  const flight = household?.flight;
  const onRoad = person.travel && ['flee', 'return'].includes(person.travel.purpose);
  const site = person.location?.siteId || null;
  person.health = { condition: 'dead', ...(!spec.generic && { disease: person.health.disease }) };
  person.chore = null; person.task = 'rest'; person.travel = null;
  // A baby in somebody's arms is not carried on by them (sim/babies.mjs `carryBabies`).
  delete person.carriedBy; delete person.baby;
  person.location = { x: person.location.x, y: person.location.y, siteId: site || flight?.refuge || household?.homeSiteId || 'gonzales' };
  // One plain sentence, the record's own shape: "died and was buried in the cemetery at Liberty" (Harris, `HIST-TEX-072`).
  // Nothing is drawn, and the Host's camera never comes to it (the owner, 2026-09-27).
  const place = onRoad || !site ? null : site === household?.homeSiteId ? 'home' : placeName(world, site);
  const text = onRoad || (!place && where === 'road')
    ? `${person.name} died of ${spec.name} on the road, and was buried where they fell.`
    : `${person.name} died of ${spec.name}${place ? ` at ${place}` : ''}, and was buried there.`;
  record(world, 'consequence', { actorId: person.id, householdId: person.householdId, importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-TEX-065', text, sickness: 'died', ...(!spec.generic && { disease: person.health.disease }) });
}

/**
 * One calendar day of one person (§3.3): somebody well may fall sick of one of today's `causes`; somebody sick may turn very
 * sick (at the day's worsening chance, raised to their weight), and somebody very sick, seen a day before (`graveDay`), may
 * die on a day nobody nursed them - and after two days very sick, or on a day nursed while resting, steps back to sick.
 * Rolled once a day for each person (`health.day`), by the road for a family on it and by `advanceDisease` for everybody else.
 */
export function sicknessDay(world, household, person, { day, hungry = false, cold = false, causes = [], where = 'home' }) {
  const health = person.health;
  if (!health || GONE.includes(health.condition)) return;
  if (health.condition !== 'sick') {
    if (!['well', 'tired'].includes(health.condition)) return;
    for (const cause of causes) {
      if (roll(world, person.id, cause.key) < cause.chance) { fallSick(world, person, cause.disease, cause); return; }
    }
    return;
  }
  if (health.day === day) return;
  health.day = day;
  const spec = diseaseOf(person);
  const activity = activityOf(world, person);
  const weight = riskWeight(person, health.disease, { hungry, cold, activity });
  if (!health.grave) {
    if (roll(world, person.id, `worse:${day}`) < chance(spec.worsen, weight)) {
      health.grave = true; health.graveDay = day;
      // Said as it is: in the first period nobody dies of a sickness (`deathsAllowed`), and the words do not pretend otherwise.
      const He = they(person).replace(/^./, c => c.toUpperCase());
      tell(world, person, `${person.name} is very sick with ${spec.name}. ${deathsAllowed(world) ? `${He} could die without nursing and warmth, and should rest.` : `${He} should rest and be nursed until the worst is past.`}`, { importance: 3, claimId: CLAIMS.deaths, sickness: 'grave', ...(health.disease && { disease: health.disease }) });
      return;
    }
    sickFood(world, household, person, day);
    return;
  }
  if (day <= health.graveDay) return;
  if (nursedOn(person, day)) {
    if (activity === 'rest') { ease(world, person, 'nursed and resting'); return; }
  } else if (deathsAllowed(world) && roll(world, person.id, `sick-death:${day}`) < chance(spec.death, weight)) {
    die(world, household, person, where);
    return;
  }
  if (day - health.graveDay >= 2) ease(world, person, null);
}

/** Rice and tea kept for sickness (Harris, `HIST-TEX-663`; `FIC-GONZ-668`): a day of it counts as a day's nursing for the mending. */
function sickFood(world, household, person, day) {
  if (!household || !(household.sickFood > 0) || nursedOn(person, day)) return;
  household.sickFood -= 1;
  if (!household.sickFood) delete household.sickFood;
  person.health.recoversAt -= DAY;
  tell(world, person, `${person.name} was given rice and tea from what the family kept for sickness, and is a day nearer mending.`, { claimId: CLAIMS.sickFood, importance: 1 });
}

// ------------------------------------------------------------------------------------------------ the road

/**
 * The road's day of sickness for a family on its flight (sim/scrape.mjs `advanceFlight` calls this once a calendar day, for
 * everybody with the family): the norther over the road (`COLD_WEIGHT`, `FIC-GONZ-135`), a chill on the chest from rain,
 * cold and hunger (`SICK_PER_DAY`, `FIC-GONZ-046`), the crowded places of the record, and the flux of a fouled camp.
 */
export function roadSickness(world, household, alive, { hungry = false, day = Math.floor(world.minute / DAY) } = {}) {
  const flight = household.flight;
  // Read where the family actually is, which on a flight across four hundred miles is not where it set out from.
  const where = alive[0]?.location || world.map.sites[household.homeSiteId];
  // A fire kept at the camp tonight or last night (sim/flight-work.mjs `camp-fire`): the norther finds nobody out in the cold.
  const cold = coldSky(world, where, day) && !fireKept(household, day);
  if (cold && !flight.coldDay) { flight.coldDay = day; record(world, 'consequence', { householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-135', text: 'A norther came down on the road, and the family has no roof to get under.' }); }
  // Somebody nursing the sick right now counts for today, as the road's nursing always did (sim/road.mjs `tend-sick`).
  if (alive.some(person => person.chore?.id === 'tend-sick')) for (const person of alive) if (person.health?.condition === 'sick') person.health.nursed = day;
  const crowd = crowdHere(world, household), fouled = fouledCamp(world, household);
  for (const person of alive) {
    if (crowd) catchAt(world, person, crowd, day);
    const causes = [
      { disease: 'lung-fever', key: `sick:${day}`, chance: chance(SICK_PER_DAY, sicknessWeight(person, { hungry, cold })), text: `${person.name} has fallen sick on the road with a chill on the chest${hungry ? ', with nothing to eat' : cold ? ', out in the norther' : ''}.`, claimId: 'FIC-GONZ-046' },
      ...(fouled ? [{ disease: 'flux', key: `flux:${day}`, chance: chance(FLUX_PER_DAY, sicknessWeight(person, { hungry, cold })), text: `${person.name} has the flux. The camp's water at ${placeName(world, flight.refuge) || 'the refuge'} is fouled, with so many families camped on it.`, claimId: CLAIMS.flux }] : []),
    ];
    sicknessDay(world, household, person, { day, hungry, cold, causes, where: 'road' });
  }
}

/** The crowded place of the record the family is camped among today, in its window and not camped apart; or null. */
export function crowdHere(world, household) {
  const camp = campedAt(world, household);
  if (!camp || campedApart(world, household)) return null;
  return CROWDS.find(one => one.sites.includes(camp) && crowdOpen(world, one)) || null;
}
/** The camp's water fouled (`FIC-GONZ-667`): camped at its refuge in the third period `FLUX_AFTER_DAYS` or more, and not apart. */
export function fouledCamp(world, household) {
  const flight = household.flight;
  return flight?.status === 'refuged' && !campedApart(world, household) && (world.period || 1) === 3
    && Number.isFinite(flight.arrivedMinute) && world.minute - flight.arrivedMinute >= FLUX_AFTER_DAYS * DAY;
}

/** A day among the families at a crowded place in its window: whoever can take its sicknesses may, ten to twelve days on. */
function catchAt(world, person, crowd, day) {
  for (const disease of crowd.catching) {
    if (!canTake(world, person, disease) || person.exposed?.[disease]) continue;
    if (roll(world, person.id, `crowd:${disease}:${day}`) >= CROWD_CATCH[disease]) continue;
    person.exposed = { ...(person.exposed || {}), [disease]: world.minute + (10 + Math.floor(roll(world, person.id, `wait:${disease}`) * 3)) * DAY };
    person.caughtAt = crowd.id;
  }
}

// ------------------------------------------------------------------------------------------------ everybody else

/** Whether this person is serving with Houston's army in its camp (sim/camp.mjs `withHouston`, read here without importing it). */
const withHouston = person => person.service?.kind === 'houston' && person.service.status === 'serving' && !person.travel;

/** Today's causes for somebody the road does not roll: at home on bottomland in the autumn, in Houston's camp, before Béxar. */
export function homeCauses(world, household, person, day) {
  const causes = [];
  const period = world.period || 1;
  const weight = frailty(person) * (ageOf(person) < 6 ? 2 : 1);
  const atHome = !person.travel && person.location?.siteId === household.homeSiteId;
  // The chills and fever: the first period, at home on river-bottom land, before the first norther after November 1.
  if (period === 1 && atHome && !household.arriving && day < frostDay(world, household) && onBottomland(world, household)) {
    causes.push({ disease: 'ague', key: `ague:${day}`, chance: chance(AGUE_PER_DAY, weight), claimId: CLAIMS.ague,
      text: `${person.name} has the chills and fever: the fever of the river bottoms, that newcomers take in the autumn.` });
  }
  // Houston's camp in April 1836 (Labadie, `HIST-TEX-661`).
  if (period === 3 && withHouston(person) && within(world, CAMP_FROM, CAMP_TO)) {
    if (!hadIt(world, person, 'measles')) causes.push({ disease: 'measles', key: `camp-measles:${day}`, chance: CAMP_MEASLES, claimId: CLAIMS.army, text: `${person.name} has the measles: it has broken out in Houston's army.` });
    causes.push({ disease: 'flux', key: `camp-flux:${day}`, chance: chance(CAMP_FLUX, weight), claimId: CLAIMS.army, text: `${person.name} has the flux, as many in Houston's camp have.` });
  }
  // The siege of Béxar: Austin's own dysentery "since the army left the Cibolo" (`HIST-TEX-029`). Nobody dies of it.
  if (period === 1 && world.army?.members?.includes(person.id) && within(world, [10, 2], [11, 4], 1835)) {
    causes.push({ disease: 'flux', key: `siege-flux:${day}`, chance: chance(SIEGE_FLUX, weight), claimId: 'HIST-TEX-029', text: `${person.name} has the flux, as many in the camp before Béxar have.` });
  }
  return causes;
}

/** Hungry and cold for somebody the road does not roll: the family's food at home, the norther under canvas on its land. */
function homeContext(world, household, person, day) {
  const atHome = !person.travel && person.location?.siteId === household.homeSiteId;
  const serving = person.service?.status === 'serving';
  const hungry = !serving && (household.resources?.food ?? 0) <= 0;
  let cold = false;
  if (atHome && shelterOf(world, household).kind === 'camp') cold = coldSky(world, world.map.sites[household.homeSiteId], day);
  return { hungry, cold };
}

/** Nursing marked as it happens (§3.8): whoever is nursing, and a sick baby held or carried, is nursed today. */
function markNursing(world, household, members, day) {
  const nurses = members.filter(person => ['tend-sick', 'nurse-home'].includes(person.chore?.id));
  for (const person of members) {
    if (person.health?.condition !== 'sick') continue;
    const held = person.baby?.state === 'held' || person.carriedBy || person.travel?.carried;
    if (held || nurses.some(nurse => together(world, household, nurse, person))) person.health.nursed = day;
  }
}

/** Mending by the tick, at the pace of what they are doing (`MEND`): the owner's "stopping to rest should help characters recover". */
function mendTick(world, person, minutes) {
  const health = person.health;
  if (health?.condition !== 'sick' || !Number.isFinite(health.recoversAt)) return;
  // Very sick is not mending: the days to go stand still until it is past the worst.
  if (health.grave) { health.recoversAt = Math.round(health.recoversAt + minutes); return; }
  health.recoversAt = Math.round(health.recoversAt - minutes * (MEND[activityOf(world, person)] - 1));
  if (world.minute < health.recoversAt) return;
  const spec = diseaseOf(person);
  // The ague comes back to some, thirty to ninety days on (Smithwick), unless the bark was given (`health.barked`).
  if (health.disease === 'ague' && !health.barked && !health.relapse && roll(world, person.id, `relapse:${health.since}`) < AGUE_RELAPSE) {
    person.relapse = world.minute + (30 + Math.floor(roll(world, person.id, `relapse-wait:${health.since}`) * 61)) * DAY;
  }
  if (spec.weak) {
    // Weak yet: tired, which walks slower and hunts worse, and which rest mends (sim/routines.mjs).
    person.health = { condition: 'tired' };
    person.exertion = Math.max(person.exertion || 0, 30);
    record(world, 'condition', { actorId: person.id, householdId: person.householdId, importance: 2, text: `${person.name} is over ${spec.name}, and weak yet.` });
  } else {
    person.health = { condition: 'well' };
    record(world, 'condition', { actorId: person.id, householdId: person.householdId, importance: 2, text: `${person.name} is well again.` });
  }
}

/** The sickness caught ten to twelve days ago comes out, and the ague comes back when its day comes. */
function comesOut(world, household, person) {
  for (const [disease, at] of Object.entries(person.exposed || {})) {
    if (world.minute < at) continue;
    if (person.health?.condition === 'sick') { person.exposed[disease] = at + DAY; continue; }
    const where = CROWDS.find(one => one.id === person.caughtAt);
    delete person.caughtAt;
    if (hadIt(world, person, disease)) { delete person.exposed[disease]; continue; }
    fallSick(world, person, disease, { text: `${person.name} has ${DISEASES[disease].name}${where ? `, taken among the families at ${where.place}` : ', taken from the family'}.`, claimId: where ? where.claimId : CLAIMS.spread });
  }
  if (person.exposed && !Object.keys(person.exposed).length) delete person.exposed;
  // A relapse whose day fell in the weeks between the periods, which nobody plays (sim/periods.mjs), comes in the first weeks of
  // the winter instead of on its first tick, all at once.
  if (Number.isFinite(person.relapse) && world.minute - person.relapse > 2 * DAY) person.relapse = world.minute + (1 + Math.floor(roll(world, person.id, `relapse-late:${person.relapse}`) * 20)) * DAY;
  if (Number.isFinite(person.relapse) && world.minute >= person.relapse && ['well', 'tired'].includes(person.health?.condition)) {
    delete person.relapse;
    fallSick(world, person, 'ague', { relapse: true, text: `${person.name} has the chills and fever again, as the fever of the bottoms comes back.` });
  }
}

/** The road rolls its own each day (sim/scrape.mjs): somebody sick it has rolled today is not rolled again here. */
const rolledToday = (person, day) => person.health?.condition === 'sick' && person.health.day === day;

/**
 * One tick of sickness for everybody (sim/world.mjs `stepWorld`, after the road's own day): nursing seen, the mending by what
 * each sick person is doing, a sickness caught coming out, and - once a calendar day - the day's roll for everybody the road
 * did not reach, and the word of the crowded places going along the road.
 */
export function advanceDisease(world) {
  const day = Math.floor(world.minute / DAY);
  const newDay = world.diseaseDay !== day;
  if (newDay) world.diseaseDay = day;
  for (const household of Object.values(world.households)) {
    const members = household.members.map(id => world.entities[id]).filter(person => person?.kind === 'person' && !GONE.includes(person.health?.condition));
    markNursing(world, household, members, day);
    for (const person of members) comesOut(world, household, person);
    if (!newDay) continue;
    for (const person of members) {
      if (GONE.includes(person.health?.condition) || rolledToday(person, day) || onTheFlight(household, person)) continue;
      sicknessDay(world, household, person, { day, ...homeContext(world, household, person, day), causes: homeCauses(world, household, person, day) });
    }
  }
  if (newDay) spreadWord(world, day);
}
/**
 * The mending of the tick, for everybody sick in a family (build step 0: wherever they are), at the pace of what they did in it:
 * called by sim/world.mjs `stepWorld` straight after the roads have moved, so a family the road held this tick - a crossing, the
 * mud, a camp, a day's rest - is counted resting for the tick it stood still, and one that moved is counted riding or walking.
 * Read later in the tick, a halt that ends in it would count a tick of standing still as a tick of walking.
 */
export function mendSickness(world, minutes = 0) {
  for (const household of Object.values(world.households)) {
    for (const id of household.members) {
      const person = world.entities[id];
      if (person?.kind === 'person' && person.health?.condition === 'sick') mendTick(world, person, minutes);
    }
  }
}
/** Whether the road's own day reaches this person (sim/scrape.mjs `advanceFlight`'s `alive`), so it is not rolled twice. */
function onTheFlight(household, person) {
  const flight = household.flight;
  if (!flight || !['fled', 'refuged', 'returning'].includes(flight.status) || person.service?.status === 'serving') return false;
  return ['flee', 'return'].includes(person.travel?.purpose) || person.location?.siteId === flight.refuge;
}

// ------------------------------------------------------------------------------------------------ the word of it

/** How far along the road word of sickness at a crowded place goes in a day: with the families, at a wagon's day. */
export const WORD_MILES_A_DAY = 15;
/**
 * The word of a crowded place's sickness goes along the road with the families (docs/LIVING_INFORMATION.md): a family on its
 * flight, or still at home in the spring, hears it once it is within a wagon's days of the place for each day since it began -
 * and the moment it is there. It is a report like any other, so it reaches the Rumor Mill as the families have it.
 */
function spreadWord(world, day) {
  for (const crowd of CROWDS) {
    if (!crowdOpen(world, crowd)) continue;
    const site = world.map?.sites?.[crowd.at];
    if (!site) continue;
    const topicId = `sickness-${crowd.id}`;
    establishTruth(world, { id: topicId, text: crowd.news, siteId: crowd.at, classification: crowd.claimId.startsWith('HIST') ? 'DOCUMENTED' : 'FICTIONAL FOR GAMEPLAY', claimId: crowd.claimId });
    const reach = (day - Math.floor(minuteOn(world, 1836, ...crowd.from) / DAY) + 1) * WORD_MILES_A_DAY;
    for (const household of Object.values(world.households)) {
      if (!household.flight || !world.knowledge?.households?.[household.id]) continue;
      const here = crowd.sites.includes(campedAt(world, household));
      const point = familyPointOf(world, household);
      if (!point) continue;
      const miles = Math.hypot(point.x - site.x, point.y - site.y);
      if (!here && miles > reach) continue;
      learn(world, household.id, topicId, { status: here ? 'confirmed' : 'unconfirmed', source: here ? 'Seen among the families camped here' : 'Talk among the families on the road' });
    }
  }
}
function familyPointOf(world, household) {
  const flight = household.flight;
  if (flight?.status === 'refuged') return world.map.sites[flight.refuge] || null;
  const on = household.members.map(id => world.entities[id]).find(person => person && !GONE.includes(person.health?.condition) && ['flee', 'return'].includes(person.travel?.purpose));
  return on?.location || world.map.sites[household.homeSiteId] || null;
}

// ------------------------------------------------------------------------------------------------ what is shown

/**
 * The sickness as the family is shown it, on the person (sim/world.mjs `projectWorld`): the row's line in words, whether
 * very sick (the "!"), the warning for work, and who has had the measles (the card's note). Never a chance, never a weight.
 */
export function sicknessShown(world, person) {
  const shown = {};
  if (person.kind !== 'person' || !person.householdId) return shown;
  if (!GONE.includes(person.health?.condition) && hadIt(world, person, 'measles')) shown.hadMeasles = true;
  const health = person.health;
  if (health?.condition !== 'sick') return shown;
  const spec = diseaseOf(person);
  const activity = activityOf(world, person);
  const what = spec.generic ? 'Sick' : `Has ${spec.name}`;
  let line;
  if (health.grave) line = `Very sick${spec.generic ? '' : ` with ${spec.name}`}: ${deathsAllowed(world) ? 'could die without nursing and warmth' : 'the worst is not past'}. Nurse ${them(person)} and let ${them(person)} rest.`;
  else {
    const left = Math.max(0, (health.recoversAt ?? world.minute) - world.minute) / DAY;
    const days = Math.max(1, Math.ceil(left / MEND[activity]));
    const mending = left <= spec.days / 3;
    if (activity === 'rest') line = `${what}: resting, ${mending ? 'mending, ' : ''}well in about ${days} day${days === 1 ? '' : 's'}.`;
    else if (activity === 'ride') line = `${what}: riding. Resting would mend it sooner.`;
    else line = `${what}: ${person.travel ? 'walking' : 'working'}. Resting would mend it sooner, and ${they(person)} may get worse.`;
  }
  shown.sickness = { disease: spec.generic ? null : health.disease, name: spec.generic ? 'sick' : spec.short, line, activity, ...(health.grave && { grave: true }),
    warn: health.grave ? `${person.name} is too sick to get up.` : `${person.name} is sick. Working slows ${them(person)} mending and ${they(person)} may get worse.` };
  return shown;
}

/** The Host's words for a sick person (sim/host.mjs `whereWords`): "sick with the measles, " or "very sick with the flux, ". */
export function sickWords(person) {
  if (person.health?.condition !== 'sick') return '';
  const spec = diseaseOf(person);
  return `${person.health.grave ? 'very sick' : 'sick'}${spec.generic ? '' : ` with ${spec.name}`}, `;
}

/** A person who died of a sickness as a child: never named on the Host's projector (the owner, 2026-09-27). */
export const diedAChild = person => person.health?.condition === 'dead' && Boolean(person.health.disease) && ageOf(person) < 16;

/** The class's sickness in words, for the Host's class panel: how many sick of each, never who (§3.12). */
export function classSickness(world) {
  const counts = new Map();
  for (const person of Object.values(world.entities)) {
    if (person.kind !== 'person' || !person.householdId || person.health?.condition !== 'sick') continue;
    const spec = diseaseOf(person);
    // "Measles", "Chill on the chest", "Chills and fever": the short name, capitalised.
    const entry = counts.get(spec.short) || { name: spec.generic ? 'Sickness' : spec.short.replace(/^./, c => c.toUpperCase()), sick: 0, grave: 0 };
    entry.sick++; if (person.health.grave) entry.grave++;
    counts.set(spec.short, entry);
  }
  const died = Object.values(world.entities).filter(person => person.kind === 'person' && person.householdId && person.health?.condition === 'dead' && person.health.disease).length;
  return { lines: [...counts.values()].map(entry => `${entry.name}: ${entry.sick} sick${entry.grave ? `, ${entry.grave} very sick` : ''}.`), ...(died && { died }) };
}

// ------------------------------------------------------------------------------------------------ the doctor

/**
 * What the doctor does for somebody sick (sim/shops.mjs, `FIC-GONZ-666`; the owner, 2026-09-27: "quinine helps chills and
 * fever; calomel and bleeding leave the patient weak for two days", shown plainly and never endorsed). The bark really does
 * act on the ague, so the game lets it: the days left are halved and it will not come back. For anything else the doctor
 * gives calomel and bleeds, as doctors did (`HIST-TEX-666`), and the patient is weaker for it: two more days to mend.
 */
export function doctorSees(world, person) {
  const health = person.health;
  if (health.disease === 'ague') {
    const left = Math.max(0, health.recoversAt - world.minute);
    health.recoversAt = world.minute + Math.round(left / 2);
    health.barked = true;
    delete person.relapse;
    return `The doctor gave ${person.name} the bark - quinine - for the chills and fever. It works: the fever will break in half the time, and it will not come back.`;
  }
  health.recoversAt += 2 * DAY;
  return `The doctor gave ${person.name} calomel, as doctors did, and bled ${them(person)}. It did no good: ${they(person)} is weaker for it, and two days further from mending.`;
}

// ------------------------------------------------------------------------------------------------ the chores

/** Whether the family is still on the road, moving, with somebody sick or tired with it: what `rest-road` is for. */
function restRefusal(world, household, entity, chore) {
  const why = roadChoreRefusal(world, household, entity, chore);
  if (why) return why;
  const flight = household.flight;
  if (flight.status === 'refuged') return 'The family is camped at its refuge, and its sick are resting already.';
  if (flight.crossing) return 'The family is waiting its turn at the river, and its sick are resting while it waits.';
  if (!withFamily(world, household).people.some(one => ['sick', 'tired'].includes(one.health?.condition))) return 'Nobody with the family is sick or tired.';
  return null;
}
/** Camping apart, from a crowd the family is camped among: at a crossing or a refuge, once there. */
function apartRefusal(world, household, entity, chore) {
  const why = roadChoreRefusal(world, household, entity, chore);
  if (why) return why;
  if (campedApart(world, household)) return 'The family is camped apart from the others already.';
  return null;
}
/** Nursing at home: somebody sick at home to nurse. */
function nurseHomeRefusal(world, household, entity) {
  if (!household.members.map(id => world.entities[id]).some(one => one && one.id !== entity.id && one.health?.condition === 'sick' && together(world, household, one, entity))) return 'Nobody here is sick.';
  return null;
}
const haltWithFamily = (world, household) => { for (const one of [...withFamily(world, household).people, ...withFamily(world, household).beasts]) if (one.travel) one.travel.halted = true; };

/**
 * The owner's lever, as work a student gives (§3.7): stop the family on the road a day to rest; move the camp apart from a
 * crowd; nurse the sick at home. Registered into the one table (sim/chores.mjs `registerChores`) by sim/world.mjs once its
 * imports are done, as the road's are (sim/road.mjs `registerRoadChores`); a second call registers nothing.
 */
let registered = false;
export function registerDiseaseChores() {
  if (registered) return;
  registered = true;
  registerChores({
    'rest-road': {
      // `rest` is a skill nobody has, so no knack makes the day shorter: every family's rest is two ticks (sim/chores.mjs
      // `paceFor`: a work of 1.5 at the unskilled pace, 1.35, is two).
      name: 'Stop and rest a day', skill: 'rest', where: 'road', road: true, halts: true, refuse: restRefusal,
      describe: 'The family halts a day so its sick and tired can rest: a sick person resting mends twice as fast and is half as likely to get worse. No miles are made, the food is eaten all the same, and the Mexican army does not halt.',
      begin: haltWithFamily,
      // ceiling: two ticks of the class's clock, which is a day at the campaign pace the road runs at; while a played family's
      // question holds the calendar at the farming scale the halt is that much shorter in 1836's hours. A step that waits on
      // the calendar rather than the tick is the way out if the difference is ever seen.
      steps: [{ work: 1.5, doing: 'resting a day with the family' }],
      done: (world, household, entity) => record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 1, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.rest, text: 'The family rested a day by the road, as the Harris party rested at Liberty, and went on.' }),
    },
    'camp-apart': {
      name: 'Camp apart from the crowd', skill: 'hands', where: 'road', road: true, campsite: true, refuse: apartRefusal,
      describe: 'Move the family\'s camp upstream, away from the families crowded here: nobody takes the sickness going round among them, and the camp\'s water is its own. Camped apart, the family cannot trade with the others, and at a crossing its turn comes half a day later.',
      steps: [{ work: 2, doing: 'moving the camp upstream, away from the crowd' }],
      done: (world, household, entity) => {
        const flight = household.flight, at = campedAt(world, household);
        if (!at) return;
        flight.apart = at;
        if (flight.crossing) flight.crossing.until += 12 * 60;
        record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.flux, text: `The family moved its camp upstream at ${placeName(world, at) || 'the river'}, away from the crowd. The camp's water is its own, and nobody of the family is among the sick.` });
      },
    },
    'nurse-home': {
      name: 'Nurse the sick', skill: 'hands', where: 'home', nurses: true, refusal: nurseHomeRefusal,
      offered: (world, household, entity) => !household.flight || household.flight.status === 'home' || household.flight.status === 'ordered' || household.flight.status === 'stayed' ? household.members.some(id => world.entities[id]?.health?.condition === 'sick') : false,
      describe: 'Stay by whoever is sick and nurse them: nobody in their care dies while they nurse, a very sick person who is also resting is brought past the worst, and when the nursing is done the sick are a day nearer mending.',
      steps: [{ work: 6, doing: 'nursing the sick' }],
      done: (world, household, entity) => {
        const day = Math.floor(world.minute / DAY);
        const nursed = household.members.map(id => world.entities[id]).filter(one => one && one.health?.condition === 'sick' && Number.isFinite(one.health.recoversAt) && together(world, household, one, entity) && one.health.credited !== day);
        for (const one of nursed) { one.health.recoversAt -= DAY; one.health.credited = day; }
        if (nursed.length) record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.nursing, text: `${entity.name} nursed ${nursed.map(one => one.name).join(' and ')}; ${nursed.length > 1 ? 'they are' : `${nursed[0].name} is`} a day nearer mending.` });
      },
    },
  });
}
/** A chore a sick person is sent to: allowed, with the warning (the owner, 2026-09-27); refused outright only when very sick. */
export const sickRefusal = entity => (entity?.health?.grave ? `${entity.name} is too sick to get up.` : null);

// ------------------------------------------------------------------------------------------------ what a save may hold

/** A saved sickness that cannot be, or null (sim/world.mjs `validateWorld`). Every field is checked only when present. */
export function diseaseInvalid(world) {
  if (world.diseaseDay !== undefined && !Number.isInteger(world.diseaseDay)) return 'Invalid sickness day';
  for (const person of Object.values(world.entities)) {
    const health = person.health;
    if (health?.disease !== undefined && !DISEASE_IDS.includes(health.disease)) return 'Unknown sickness';
    if (health?.condition === 'sick') {
      if (health.grave !== undefined && health.grave !== true) return 'Invalid very sick';
      if (health.grave && !Number.isInteger(health.graveDay)) return 'Invalid very sick';
      for (const key of ['since', 'day', 'nursed', 'credited']) if (health[key] !== undefined && !Number.isFinite(health[key])) return 'Invalid sickness';
    }
    if (person.had !== undefined && (!Array.isArray(person.had) || person.had.some(id => !DISEASE_IDS.includes(id)))) return 'Invalid sickness had';
    if (person.exposed !== undefined && (!person.exposed || typeof person.exposed !== 'object' || Object.entries(person.exposed).some(([id, at]) => !DISEASE_IDS.includes(id) || !Number.isFinite(at)))) return 'Invalid exposure';
    if (person.relapse !== undefined && !Number.isFinite(person.relapse)) return 'Invalid relapse';
    if (person.caughtAt !== undefined && !CROWDS.some(crowd => crowd.id === person.caughtAt)) return 'Invalid exposure';
  }
  for (const household of Object.values(world.households)) {
    if (household.sickFood !== undefined && (!Number.isInteger(household.sickFood) || household.sickFood < 1)) return 'Invalid sick-food';
    if (household.flight?.apart !== undefined && !world.map.sites[household.flight.apart]) return 'Invalid camp apart';
  }
  return null;
}

// Leaving before the order, on news the family has really heard (owner, 2026-09-29, triage D9 (b), by multiple choice: **"Yes, on
// real news"**; docs/SCRAPE.md §19, `FIC-GONZ-991`).
//
// Until then a family could not leave, or even make ready to leave, before its settlement's dated order (sim/scrape.mjs
// `SETTLEMENT_DAYS`), so hearing of the Alamo early bought nothing (docs/audits/2026-09-28-design.md S17). Now a family that has
// **heard** - in its own knowledge, by rider, by express, by the smoke or with its own eyes (sim/knowledge.mjs, sim/expresses.mjs,
// sim/advance-word.mjs) - of the Alamo's fall or of the Mexican army's advance may make ready and go before its order comes:
//
//   - **The news that counts** (`EARLY_TOPICS`, `EARLY_PREFIXES`): the fall of the Alamo; Fannin's defeat by Urrea; Santa Anna over the
//     Brazos; a column come to a place (`column:`); a town burned as the columns came on (`burned:`). Word of the Texas army's own
//     movements is not the Mexican army's advance, and does not count.
//   - **As firm as a rider's word** (`FIRM`): `unconfirmed` or `confirmed`. A rumour - the two riders' talk at Gonzales before
//     Mrs. Dickinson came in - is not enough; nor is a report since contradicted.
//   - **Read from the family's own knowledge and nothing else**: never from what is true in the world. A family that has not heard
//     is refused in plain words, however near the columns are.
//
// The preparation works (sim/flight-work.mjs: hiding what the wagon will not hold, the children's bundles, the milk cow) are
// offered on the same news. Their marks wait on `household.readying` until the family has a flight - its order, or leaving early -
// and are carried onto it then (`takeReadying`). `readying` is absent on every class saved before, which is a family that has made
// ready nothing: no save version moved.
//
// **The record** (docs/SCRAPE.md §19): "when they received that news, people all over Texas began to leave everything" (Covington,
// TSHA *Runaway Scrape*); by February 20, 1836, Dilue Rose Harris wrote, "every family in our neighborhood was preparing to go", and
// her father finished planting corn and hid household goods in the river bottom before the order came (`HIST-TEX-640`). What leaving
// early costs is the game's (`FIC-GONZ-991`), not the record's: the Roses' corn, planted on March 1, was standing when they came home.
import { record } from './events.mjs';

/** The news that lets a family leave before its order: the Alamo's fall, and the Mexican army's advance. */
export const EARLY_TOPICS = Object.freeze(['alamo-fall', 'goliad-defeat', 'santa-anna-brazos']);
/** Report topics of the advance itself (sim/advance-word.mjs `happenings`): where a column came, and a town burned. */
export const EARLY_PREFIXES = Object.freeze(['column:', 'burned:']);
/** How firm the family's word must be: a rider's report or better, not a rumour, not contradicted. */
export const FIRM = Object.freeze(['unconfirmed', 'confirmed']);
export const isEarlyTopic = topicId => typeof topicId === 'string' && (EARLY_TOPICS.includes(topicId) || EARLY_PREFIXES.some(prefix => topicId.startsWith(prefix)));

/** The third period, running: the only time a family is ever told to leave (sim/scrape.mjs `scrapeOn`, which imports this file). */
const springOn = world => world.period === 3 && !world.director?.complete;

/**
 * The news this family has heard that lets it leave before its order - the first it heard, `{ topicId, minute, text }` - or null.
 * Only a family with no flight yet: one already told to leave has its order. From the family's own knowledge only.
 */
export function earlyWord(world, household) {
  if (!household || household.flight || !springOn(world)) return null;
  const known = Object.values(world.knowledge?.households?.[household.id] || {}).filter(report => isEarlyTopic(report.topicId) && FIRM.includes(report.status));
  if (!known.length) return null;
  const first = known.sort((a, b) => (a.receivedMinute ?? 0) - (b.receivedMinute ?? 0) || a.topicId.localeCompare(b.topicId))[0];
  return { topicId: first.topicId, minute: first.receivedMinute ?? world.minute, text: first.text };
}

/** The refusal of a family that has heard nothing yet to make it go, in plain words. */
export const NO_WORD_YET = 'Nobody has told the family to leave, and it has heard nothing yet to make it go: no word of the Alamo’s fall, or of the Mexican army coming on. It waits for the order, or for the news.';

/** Whether the family may make ready to go: told to leave (and not gone), or heard real news before its order. */
export const mayMakeReady = (world, household) => ['ordered', 'stayed'].includes(household?.flight?.status) || Boolean(earlyWord(world, household));

/** Where the family's marks of making ready are: on its flight, or - before it has one - waiting on `readying`. */
export const readyingOf = household => household?.flight || household?.readying || null;
/** The same, to write to: the flight, or `readying` made for it. */
export function readyingFor(household) {
  if (household.flight) return household.flight;
  household.readying ||= {};
  return household.readying;
}
/** The marks made before the family had a flight, taken off `readying` to go onto it (and `readying` gone). */
export function takeReadying(household) {
  const { hid, bundles, cow } = household.readying || {};
  delete household.readying;
  return { ...(hid && { hid }), ...(bundles && { bundles }), ...(cow && { cow }) };
}

/** What the cost of leaving early is, in the words the card and the journal both use. */
export const EARLY_COST = 'The crop in the field is left standing with nobody to tend it or bring it in, and is lost; the house is left empty, with whatever is not loaded in it, for whoever comes.';

/**
 * Once a tick in the spring (sim/directors.mjs `advanceScrape`): a family with no order yet that has just heard real news is told,
 * once, that it may go now and what that costs. The mark (`readying.heard`) is only so the line is said once; whether the family
 * may go is read from its knowledge every time (`earlyWord`).
 */
export function advanceEarlyWord(world) {
  if (!springOn(world) || !world.map?.source) return;
  for (const household of Object.values(world.households)) {
    if (household.flight || household.readying?.heard) continue;
    const word = earlyWord(world, household);
    if (!word) continue;
    readyingFor(household).heard = { topicId: word.topicId, minute: world.minute };
    record(world, 'consequence', { householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-991',
      text: `Nobody has told the family to leave yet, but with this news it may make ready and go now, before any order comes. ${EARLY_COST}` });
  }
}

/** A saved family's marks of making ready that cannot be (sim/world.mjs `validateWorld`, through sim/scrape.mjs `scrapeInvalid`). */
export function readyingInvalid(world) {
  for (const household of Object.values(world.households)) {
    const readying = household.readying;
    if (readying !== undefined) {
      if (!readying || typeof readying !== 'object') return 'Invalid readying';
      if (readying.heard !== undefined && (!isEarlyTopic(readying.heard?.topicId) || !Number.isFinite(readying.heard.minute))) return 'Invalid readying';
    }
    const early = household.flight?.early;
    if (early !== undefined && (!early || !isEarlyTopic(early.topicId) || !Number.isFinite(early.minute) || (early.crop !== undefined && !['corn', 'cotton', 'corn and cotton'].includes(early.crop)))) return 'Invalid early leaving';
  }
  return null;
}

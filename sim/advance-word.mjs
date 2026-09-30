// What the families learn of the Mexican advance, and how (docs/SCRAPE.md §4; docs/LIVING_INFORMATION.md).
//
// Nothing here is a roll. A family learns a thing by one of its own people seeing it - the smoke of a burning within
// `SMOKE_SIGHT_MILES` while it stands, a column within `COLUMN_SIGHT_MILES` - or by the word, which goes out from where the
// thing happened at `WORD_MILES_A_DAY`, carried by riders, refugees and the army's own people (`FIC-GONZ-463`), and reaches a
// family when it has had time to cover the ground to where the family's people are. What it learns is household knowledge
// (sim/knowledge.mjs `learn`), the boundary docs/LIVING_INFORMATION.md keeps until person-level hearing is built.
//
// Three kinds of word:
//   - **its own farm burned** (`learnOwnBurning`): the plain-words account, once, by whichever comes first - being there,
//     seeing the smoke, the word, or coming home to it - and from that moment the family's page shows the farm as it is;
//   - **a town burned** (sim/advance.mjs `BURNINGS`): Gonzales and San Felipe by the Texians, Harrisburg and New Washington
//     by Santa Anna, each a report of its own;
//   - **a column has come to a place** (`COLUMNS`' stops marked `word`): where the Mexican army is, a day or three old.
import { record } from './events.mjs';
import { establishTruth, learn, wouldLearn } from './knowledge.mjs';
import { spotlight } from './host.mjs';
import { COLUMNS, COLUMN_SIGHT_MILES, SMOKE_HOURS, SMOKE_SIGHT_MILES, clockOf, headAt, timelineOf, townBurnings, wordReached } from './advance.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** The day of a class's minute, in words: "April 8". */
const dayWords = (world, minute) => { const d = new Date((world.director?.arrival ? Date.UTC(1835, 8, 28, 6) : Date.UTC(1835, 8, 29)) + minute * 60000); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const GONE = ['dead', 'captured'];
const eyesOf = (world, household) => household.members.map(id => world.entities[id]).filter(person => person?.location && !GONE.includes(person.health?.condition)).map(person => person.location);
const nearest = (points, place) => points.reduce((best, point) => Math.min(best, Math.hypot(point.x - place.x, point.y - place.y)), Infinity);
/** Where the family is, for the word: whichever of its people is nearest the place it happened. */
const nearestEye = (points, place) => points.reduce((best, point) => !best || Math.hypot(point.x - place.x, point.y - place.y) < Math.hypot(best.x - place.x, best.y - place.y) ? point : best, null);

export const farmTopic = household => `farm-burned:${household.id}`;

/** The world's record that the farm burned, written when it burns so the report's age is the burning's (`observedMinute`). */
export function recordFarmBurned(world, household) {
  const by = household.flight.burnedBy || {};
  // Burned by the Texas army as a family left late (sim/scrape.mjs `burnForSilence`, `FIC-GONZ-907`), or by a column's foragers.
  if (by.hand === 'texian') return establishTruth(world, { id: farmTopic(household), text: 'The Texas army burned the farm as the family left.', siteId: household.homeSiteId, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-907' });
  return establishTruth(world, { id: farmTopic(household), text: `Foragers of ${by.name || 'the Mexican army'} burned the farm.`, siteId: household.homeSiteId, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-465' });
}

/**
 * The family learns its farm burned: `there` (its people were at home), `sight` (they saw the smoke over their own land),
 * `word` (a rider or refugees brought it) or `home` (they came home to it). Once, whichever is first; the page shows the
 * burned farm from then on (`flight.unseen` removed).
 */
export function learnOwnBurning(world, household, how) {
  const flight = household.flight;
  if (!flight?.burned || !flight.unseen) return false;
  delete flight.unseen;
  flight.burnKnown = { minute: world.minute, how };
  const by = flight.burnedBy || {};
  const name = by.name || 'the Mexican army';
  const lost = by.lost?.length ? ` What was left in the house went with it: ${by.lost.join(', ')}.` : '';
  // A family that stayed: the foragers took its goods from the house before they burned it (owner, 2026-09-29, D9 (c), `FIC-GONZ-992`).
  const took = by.taken?.length ? ` Before they burned it they took everything in the house: ${by.taken.join(', ')}.` : '';
  const stock = household.herdLeft?.driven ? ' The stock on the range was driven off with the column.' : '';
  const when = dayWords(world, flight.burned);
  const text = {
    there: `Foragers of ${name} came to the farm on ${when} and burned the house, the field and the fences while the family's own people looked on.${took}${lost}`,
    sight: `There is smoke over the family's own land. Foragers of ${name} have burned the farm: the house, the field and the fences.${took}${lost}`,
    word: `Word came along the road from people fleeing east: on ${when} foragers of ${name} reached the family's farm and burned the house, the field and the fences.${took}${lost}${stock}`,
    home: `Coming home, the family found what nobody had told them: foragers of ${name} burned the farm on ${when}.${took}${lost}`,
  }[how];
  if (!world.truth[farmTopic(household)]) recordFarmBurned(world, household);
  // The report is the short fact; the account in the family's record is the whole of it.
  learn(world, household.id, farmTopic(household), { status: 'confirmed', source: { there: 'Their own eyes', sight: 'The smoke', word: 'People fleeing east', home: 'Their own eyes' }[how], text: `Foragers of ${name} burned the family's farm on ${when}.` });
  record(world, 'consequence', { householdId: household.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-465', text });
  return true;
}

/** The town burnings and the columns' arrivals, as report topics: established when they happen, learned as the word reaches each family. */
function happenings(world) {
  const t = timelineOf(world), clock = clockOf(world), found = [];
  for (const burning of townBurnings(world, t)) {
    found.push({ topicId: `burned:${burning.id}`, at: burning.at, minute: burning.minute + clock, smoke: SMOKE_HOURS.town * 60, text: burning.words, claimId: burning.claimId, siteId: burning.siteId || null, classification: burning.label === 'DOCUMENTED' ? 'DOCUMENTED' : 'FICTIONAL FOR GAMEPLAY' });
  }
  for (const column of COLUMNS) {
    for (const stop of column.path) {
      if (!stop.word || t < stop.minute) continue;
      const place = stop.point || world.map.sites[stop.siteId];
      if (!place) continue;
      found.push({ topicId: `column:${stop.topic}`, at: { x: place.x, y: place.y }, minute: stop.minute + clock, text: stop.word, claimId: stop.claimId, siteId: stop.siteId || null, classification: 'DOCUMENTED', column });
    }
  }
  return found;
}

/**
 * One tick of the word: each family's own farm, the towns and the columns. Cheap - a handful of topics against at most thirty
 * families, and nothing is looked at twice once a family knows it.
 */
export function advanceAdvanceWord(world) {
  const t = timelineOf(world);
  const things = happenings(world);
  for (const thing of things) {
    if (world.truth[thing.topicId]) continue;
    establishTruth(world, { id: thing.topicId, text: thing.text, siteId: thing.siteId, classification: thing.classification, claimId: thing.claimId });
    // A town burning is the Host's to see at once (docs/HOST_PAGE.md): the camera goes to the smoke.
    if (thing.smoke) {
      record(world, 'milestone', { visibility: 'public', importance: 3, classification: thing.classification, claimId: thing.claimId, text: thing.text });
      spotlight(world, { key: thing.topicId, text: thing.text, x: thing.at.x, y: thing.at.y, claimId: thing.claimId });
    }
  }
  for (const household of Object.values(world.households)) {
    const eyes = eyesOf(world, household);
    if (!eyes.length) continue;
    const flight = household.flight;
    // Its own farm: the smoke while it stands, else the word.
    if (flight?.burned && flight.unseen) {
      const home = world.map.sites[household.homeSiteId];
      if (home && world.minute - flight.burned < SMOKE_HOURS.farm * 60 && nearest(eyes, home) <= SMOKE_SIGHT_MILES) learnOwnBurning(world, household, 'sight');
      else if (home && wordReached(world, home, nearestEye(eyes, home), flight.burned)) learnOwnBurning(world, household, 'word');
    }
    for (const thing of things) {
      if (!wouldLearn(world, household.id, thing.topicId, 'unconfirmed')) continue;
      // A column seen with the family's own eyes is not news by word; it is on the map (sim/armies.mjs). A town burning is
      // seen by its smoke while it stands.
      const seen = thing.smoke ? world.minute - thing.minute < thing.smoke && nearest(eyes, thing.at) <= SMOKE_SIGHT_MILES
        : thing.column ? (() => { const head = headAt(world.map, thing.column, t); return head && nearest(eyes, head) <= COLUMN_SIGHT_MILES; })() : false;
      if (seen) learn(world, household.id, thing.topicId, { status: 'confirmed', source: thing.smoke ? 'The smoke, seen from afar' : 'Seen from where the family is', text: thing.text });
      else if (wordReached(world, thing.at, nearestEye(eyes, thing.at), thing.minute)) learn(world, household.id, thing.topicId, { status: 'unconfirmed', source: thing.smoke ? 'People fleeing east' : 'A rider from the west', text: thing.text });
    }
  }
}

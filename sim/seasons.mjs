// The farming year: what goes in the ground when, and how long it stands before it comes in (owner, 2026-09-28, by multiple
// choice on docs/audits/2026-09-28-design.md B9, "farming is a money pump": **"Seasons and a limited market"** - crops grow only
// in their real season). The market is sim/market.mjs.
//
// Until today a field planted in any month ripened eighteen ticks later (`RIPEN_TICKS`): six hours of the farming day, nine
// days of the campaign, corn in January. Now, on the real land of the colonies, **a crop goes in only in its season and comes
// in after its real time in calendar days**, read off the class's own calendar (sim/clock.mjs) with whatever step that calendar
// is taking.
//
// What the record says of the year a class plays, late September 1835 to the end of April 1836 (`HIST-TEX-720`):
//
// - **The autumn is the harvest of crops planted in the spring before** - cotton-picking time in October 1835 ("Hundreds have
//   left their plantations", *Telegraph*, Oct 26), cotton still being picked in November and gathered and ginned into December
//   (Bryan, Nov 18; Harris) - and a family that came onto raw land at the end of September had none standing. What it could
//   put in was a garden: "Two gardens are common, one for spring and summer, and one for fall and winter" (Holley, *Texas*,
//   1836), and at Gonzales that October "the gardens were full of fresh vegetables" (Taylor).
// - **Corn went in at the end of the winter**: in late February 1836 "Every farmer was planting corn", and Harris's father
//   "had planted corn the first of March" (Dilue Rose Harris). Cotton followed it into the warm ground.
// - So **nothing a family plants in this class's corn or cotton season comes in before the class ends**: the corn of 1836 was
//   gathered in the summer, after San Jacinto, and the cotton picked from August. A crop in the ground is what the Runaway
//   Scrape left behind (sim/improvements.mjs `ruin`).
//
// Every date and length below is `FIC-GONZ-721`: reconstructed from those sources and ordinary days-to-maturity, not
// documented to the day. The class's invented Gonzales country, a single September afternoon on a twenty-minute clock that
// never reaches a second season, keeps the old lesson rhythm (`RIPEN_TICKS`, `FIC-GONZ-008`): see `seasonal`.
import { dateOf } from './clock.mjs';
import { COTTON_SEED_PER_PLOT, SEED_PER_PLOT } from './improvements.mjs';

/** Seed a plot of garden takes: small seed, and little of it. `FIC-GONZ-721`. */
export const GARDEN_SEED_PER_PLOT = 1;

const DAY = 1440;
/**
 * The crops, each with the windows it may be sown in (month and day, inclusive, in any year) and the calendar days from sowing
 * to bringing in. `FIC-GONZ-721`: the windows are reconstructed from the sources above; the days are ordinary days to maturity -
 * greens and turnips about six weeks, corn about four months to gathering, cotton about five months to the first picking.
 */
export const CROPS = Object.freeze({
  garden: Object.freeze({
    words: 'a garden of turnips and greens', short: 'garden', yields: 'food', seed: GARDEN_SEED_PER_PLOT, days: 42,
    // The fall and winter garden, and the spring one (Holley: "Two gardens are common", and vegetables "yielded in every season
    // of the year"): from September round the winter to the end of April, so a family is never without something it can sow.
    sow: Object.freeze([[[9, 1], [12, 31]], [[1, 1], [4, 30]]]),
    season: 'from September, through the winter, to the end of April',
  }),
  corn: Object.freeze({
    words: 'corn', short: 'corn', yields: 'food', seed: SEED_PER_PLOT, days: 120,
    // "Every farmer was planting corn" at the end of February 1836; Harris's father planted his on March 1.
    sow: Object.freeze([[[2, 15], [4, 15]]]),
    season: 'at the end of the winter, from the middle of February to the middle of April',
  }),
  cotton: Object.freeze({
    words: 'cotton', short: 'cotton', yields: 'cotton', seed: COTTON_SEED_PER_PLOT, days: 150,
    // Into the warm ground after the corn.
    sow: Object.freeze([[[3, 20], [5, 15]]]),
    season: 'in the spring, from the twentieth of March to the middle of May',
  }),
});
/** The two crops a family grows for its living: the one it came meaning to grow is one of these. */
export const MAIN_CROPS = Object.freeze(['corn', 'cotton']);

/**
 * Whether this class keeps the farming year. The real land of the colonies runs the calendar through the whole war, and keeps
 * it; the invented Gonzales country is one afternoon on a twenty-minute clock (sim/clock.mjs), where a crop in its real time
 * would never come in, and it keeps the lesson rhythm it was built with.
 * ceiling: the invented country's eighteen-tick crop is a lesson rhythm, not a season; if that country ever runs past October 2,
 * give it this calendar too.
 */
export const seasonal = world => Boolean(world?.map?.source);

/** The crops a family can be asked to choose between at the rows. */
export const cropsOffered = world => seasonal(world) ? ['garden', 'corn', 'cotton'] : ['corn', 'cotton'];

const monthDay = date => (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
/** Whether this crop may be sown at this minute of the class's calendar. Always, where the class keeps no seasons. */
export function inSeason(world, crop, minute = world.minute) {
  if (!seasonal(world)) return crop !== 'garden';
  const at = monthDay(dateOf(world, minute));
  return (CROPS[crop]?.sow || []).some(([[m1, d1], [m2, d2]]) => at >= m1 * 100 + d1 && at <= m2 * 100 + d2);
}
/** The sentence that refuses a crop out of its season: "Corn goes in at the end of the winter, from ... ." */
export const seasonWhy = crop => `${cap(CROPS[crop].short)} goes in ${CROPS[crop].season}.`;
const cap = text => text.charAt(0).toUpperCase() + text.slice(1);

/** The crop this family came meaning to grow (corn or cotton), whatever is standing in the field now. */
export const ownCrop = household => household?.field?.own || (MAIN_CROPS.includes(household?.field?.crop) ? household.field.crop : 'corn');

/**
 * What would go in if the family planted now and nobody chose: its own crop if it is the season for it, then a garden, then the
 * other crop. Null when nothing may be sown. The same order silence answers the question at the rows in.
 */
export function cropsInOrder(world, household) {
  const own = ownCrop(household), other = own === 'corn' ? 'cotton' : 'corn';
  return [own, 'garden', other].filter(crop => cropsOffered(world).includes(crop));
}
export const cropNow = (world, household) => cropsInOrder(world, household).find(crop => inSeason(world, crop)) || null;
/** Seed a plot of this crop takes. */
export const seedFor = crop => CROPS[crop]?.seed ?? SEED_PER_PLOT;

/**
 * Why nothing can be planted now, or null. Said with the next season that opens, so a student knows when to come back:
 * "Nothing goes in the ground in December. A garden goes in again from the middle of January; corn from the middle of February."
 */
export function plantingRefusal(world, household) {
  if (!seasonal(world) || cropNow(world, household)) return null;
  const month = dateOf(world, world.minute).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const next = cropsOffered(world).map(crop => ({ crop, minute: nextSowing(world, crop) })).filter(one => one.minute !== null).sort((a, b) => a.minute - b.minute);
  const said = next.slice(0, 2).map(({ crop, minute }) => `${crop === 'garden' ? 'a garden' : crop} from ${dayWords(world, minute)}`);
  return `Nothing goes in the ground in ${month}.${said.length ? ` ${cap(said.join('; '))}.` : ''}`;
}
/** The first minute, from now, this crop may be sown; null if not within a year. Whole days, dawn. */
function nextSowing(world, crop) {
  const day = Math.floor(world.minute / DAY);
  for (let ahead = 1; ahead <= 366; ahead++) if (inSeason(world, crop, (day + ahead) * DAY + DAY / 4)) return (day + ahead) * DAY + DAY / 4;
  return null;
}
/** "November 12". */
export const dayWords = (world, minute) => dateOf(world, minute).toLocaleString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

/** The ticks a field took to ripen on the old rhythm, and still takes on the invented country (`FIC-GONZ-008`). */
export const RIPEN_TICKS = 18;

/**
 * The calendar minute this field comes in, or null where it ripens on the old rhythm: the invented country, and a crop planted
 * in a class saved before the farming year (no `sownMinute`), which comes in as it was promised when it went in.
 */
export function ripensAt(world, field) {
  if (!seasonal(world) || !Number.isFinite(field?.sownMinute)) return null;
  return field.sownMinute + (CROPS[field.crop]?.days ?? CROPS.corn.days) * DAY;
}
/** Whether a planted field has come on. */
export function ripe(world, field) {
  if (field?.state !== 'planted') return false;
  const at = ripensAt(world, field);
  return at === null ? world.tick - field.changedTick >= RIPEN_TICKS : world.minute >= at;
}
/** "about November 12", for a field in the ground on the calendar; null otherwise. */
export function readyWords(world, field) {
  const at = ripensAt(world, field);
  return at === null ? null : `about ${dayWords(world, at)}`;
}

/** Stored field state that could not have been planted (sim/world.mjs `validateWorld`). */
export function fieldInvalid(field) {
  if (!field || !['bare', 'planted', 'ripe'].includes(field.state) || !CROPS[field.crop]) return 'Invalid field state';
  if (field.own !== undefined && !MAIN_CROPS.includes(field.own)) return 'Invalid field state';
  // Read only while the crop is in the ground; a bare field that kept one (written by hand) is harmless and not refused.
  if (field.sownMinute !== undefined && (!Number.isFinite(field.sownMinute) || field.sownMinute < 0)) return 'Invalid field state';
  return null;
}

// How long a crop stands in the field: real minutes of the class (owner, 2026-09-28, by multiple choice: "have crops be independent
// of the seasons. say, 5 minutes for cotton and 3 for corn? adjust prices to compensate"). The market that compensates is
// sim/market.mjs.
//
// **Cotton ripens after six real minutes of a running class, corn after four**, in any month (owner, 2026-09-28: "i want 4 minutes
// for corn and 6 minutes for cotton in real life"; five and three before that). **How it is measured, in plain words**: every time
// the class moves on a tick, the server notes how long that tick really took on its own clock (`realMs`, handed to `stepWorld` by
// server/app.mjs `tick`), and that many real milliseconds are added to the crop in the ground (`grownMs`). When the total reaches
// four or six minutes the crop is ripe. So when the Host makes the class faster or slower - even half way through a crop - each
// tick adds what it really took and the crop still takes its minutes; a paused class runs no ticks and grows nothing; and a tick
// the server's meter will not count (a stall longer than three ticks, `realTimeMeter`) adds only what it caps it at. A tick stepped
// in process (the tests, the balance measure, a solo world stepped headless) says nothing of real time and counts as one tick at
// the Study pace (`STUDY_TICK_MS`), the pace a class is played at.
//
// This replaced the farming year of the same morning (a garden in the autumn, corn from the middle of February, cotton from the
// end of March, each ripening in its real calendar days; `HIST-TEX-720`). The record it read is kept in `HIST-TEX-720`; **the
// timing here is fictional for gameplay** (`FIC-GONZ-721`): no crop of 1835 came in in minutes, and none was planted in any month.
// The garden went with it: it existed only because corn and cotton could not go in in the autumn.
//
// **Slower in the winter** (owner, 2026-09-28: "increase the time until harvest during the winter. that way it feels more fluid"). In
// the winter months of the class's own calendar - December, January and February, on the real land; the invented country's one
// September afternoon never reaches them - a crop grows at a third of its pace ("A third in winter", the owner's second word; a half
// until then): corn takes twelve real minutes, cotton eighteen. What is
// counted is the crop's progress, not its minutes: each tick adds its real time at the pace of the month that tick falls in, so a
// crop sown in late November that stands into December blends, the part before December at full pace and the rest at a third.
import { COTTON_SEED_PER_PLOT, SEED_PER_PLOT } from './improvements.mjs';
import { dateOf } from './clock.mjs';

/**
 * The length of a tick at the Study pace, the pace a class is played at (server/app.mjs `PACES.study`, written out here because
 * the simulation never imports the server): what a tick stepped without the server's clock counts as.
 */
export const STUDY_TICK_MS = 9500;
const MINUTE_MS = 60000;

/** The two crops (`HIST-GONZ-013`): real minutes in the field, seed a plot, and what comes in. `FIC-GONZ-721`. */
export const CROPS = Object.freeze({
  // Four and six since the owner's second word of 2026-09-28 ("i want 4 minutes for corn and 6 minutes for cotton in real life"); three and
  // five until then.
  corn: Object.freeze({ minutes: 4, seed: SEED_PER_PLOT, yields: 'food' }),
  cotton: Object.freeze({ minutes: 6, seed: COTTON_SEED_PER_PLOT, yields: 'cotton' }),
});
/**
 * How much slower a crop grows in the winter months. ceiling: one number for the whole winter and both crops, and the months named
 * rather than read from the weather; a cold snap that stops growth, or a crop hardier than another, would want the weather
 * (sim/weather.mjs) and a number per crop. `FIC-GONZ-721`.
 */
export const WINTER_SLOWER = 3;
/** The winter months of the class's calendar (1-based): December to February. */
export const WINTER_MONTHS = Object.freeze([12, 1, 2]);
/** Whether this minute of the class's calendar is in the winter, on the real land. */
export const inWinter = (world, minute = world.minute) => Boolean(world?.map?.source) && WINTER_MONTHS.includes(dateOf(world, minute).getUTCMonth() + 1);
/** The share of its full pace a crop grows at now: a third in the winter, whole otherwise. */
export const growPace = world => inWinter(world) ? 1 / WINTER_SLOWER : 1;
/** The real minutes this crop stands now, if it were sown now: "4", or "8" in the winter. */
export const minutesNow = (world, crop) => (CROPS[crop]?.minutes ?? CROPS.corn.minutes) / growPace(world);
/** Seed a plot of this crop takes. */
export const seedFor = crop => CROPS[crop]?.seed ?? SEED_PER_PLOT;
/** The real milliseconds this crop stands before it can be brought in. */
export const growMs = crop => (CROPS[crop]?.minutes ?? CROPS.corn.minutes) * MINUTE_MS;
/** Ticks corn takes at the Study pace: what the old eighteen-tick lesson rhythm is now, for anything that counts in ticks. */
export const RIPEN_TICKS = Math.ceil(growMs('corn') / STUDY_TICK_MS);

/**
 * The crop's progress, as real milliseconds at full pace (`grownMs`: a winter's real minute counts as half of one). A crop sown in a
 * class saved before this has no `grownMs`, and is read as having stood the ticks since it went in at the Study pace, so it comes in
 * about when it was promised.
 */
export function grownOf(world, field) {
  if (Number.isFinite(field?.grownMs)) return field.grownMs;
  return Math.max(0, (world.tick - (field?.changedTick ?? world.tick))) * STUDY_TICK_MS;
}
/**
 * One running tick of growth for a crop in the ground: the real time the server says it took, or a Study-pace tick, at the pace of the
 * season this tick falls in (`growPace`) - so a crop that stands across the change blends.
 */
export function growCrop(world, household, realMs = null) {
  const field = household.field;
  if (field?.state !== 'planted') return;
  household.field = { ...field, grownMs: grownOf(world, field) + (Number.isFinite(realMs) ? realMs : STUDY_TICK_MS) * growPace(world) };
}
/** Whether a planted field has come on. */
export const ripe = (world, field) => field?.state === 'planted' && grownOf(world, field) >= growMs(field.crop);
/** "in about 2 minutes", or "within the minute", at the pace of the season now; null for a field that is not growing. */
export function readyWords(world, field) {
  if (field?.state !== 'planted') return null;
  const minutes = Math.ceil(Math.max(0, growMs(field.crop) - grownOf(world, field)) / growPace(world) / MINUTE_MS);
  return minutes <= 1 ? 'within the minute' : `in about ${minutes} minutes`;
}

/** Stored field state that could not have been planted (sim/world.mjs `validateWorld`). */
export function fieldInvalid(field) {
  if (!field || !['bare', 'planted', 'ripe'].includes(field.state) || !CROPS[field.crop]) return 'Invalid field state';
  if (field.grownMs !== undefined && (!Number.isFinite(field.grownMs) || field.grownMs < 0)) return 'Invalid field state';
  return null;
}

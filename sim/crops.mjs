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
import { COTTON_SEED_PER_PLOT, SEED_PER_PLOT } from './improvements.mjs';

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
/** Seed a plot of this crop takes. */
export const seedFor = crop => CROPS[crop]?.seed ?? SEED_PER_PLOT;
/** The real milliseconds this crop stands before it can be brought in. */
export const growMs = crop => (CROPS[crop]?.minutes ?? CROPS.corn.minutes) * MINUTE_MS;
/** Ticks corn takes at the Study pace: what the old eighteen-tick lesson rhythm is now, for anything that counts in ticks. */
export const RIPEN_TICKS = Math.ceil(growMs('corn') / STUDY_TICK_MS);

/**
 * The real time this crop has stood. A crop sown in a class saved before this has no `grownMs`, and is read as having stood the
 * ticks since it went in at the Study pace, so it comes in about when it was promised.
 */
export function grownOf(world, field) {
  if (Number.isFinite(field?.grownMs)) return field.grownMs;
  return Math.max(0, (world.tick - (field?.changedTick ?? world.tick))) * STUDY_TICK_MS;
}
/** One running tick of growth for a crop in the ground: the real time the server says it took, or a Study-pace tick. */
export function growCrop(world, household, realMs = null) {
  const field = household.field;
  if (field?.state !== 'planted') return;
  household.field = { ...field, grownMs: grownOf(world, field) + (Number.isFinite(realMs) ? realMs : STUDY_TICK_MS) };
}
/** Whether a planted field has come on. */
export const ripe = (world, field) => field?.state === 'planted' && grownOf(world, field) >= growMs(field.crop);
/** "in about 2 minutes", or "within the minute", for the field's own words; null for a field that is not growing. */
export function readyWords(world, field) {
  if (field?.state !== 'planted') return null;
  const minutes = Math.ceil(Math.max(0, growMs(field.crop) - grownOf(world, field)) / MINUTE_MS);
  return minutes <= 1 ? 'within the minute' : `in about ${minutes} minutes`;
}

/** Stored field state that could not have been planted (sim/world.mjs `validateWorld`). */
export function fieldInvalid(field) {
  if (!field || !['bare', 'planted', 'ripe'].includes(field.state) || !CROPS[field.crop]) return 'Invalid field state';
  if (field.grownMs !== undefined && (!Number.isFinite(field.grownMs) || field.grownMs < 0)) return 'Invalid field state';
  return null;
}

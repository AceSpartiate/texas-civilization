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
import { dateOf } from './clock.mjs';
import { clearedPlots, cropOf, cropState, fieldPlots, keepPlots, plotsOf, ripePlots, sownPlots } from './fields.mjs';

/**
 * The length of a tick at the Study pace, the pace a class is played at (server/app.mjs `PACES.study`, written out here because
 * the simulation never imports the server): what a tick stepped without the server's clock counts as.
 */
export const STUDY_TICK_MS = 9500;
const MINUTE_MS = 60000;

/** Seed ten cleared acres of corn swallow at planting (sim/improvements.mjs re-exports it, where it lived until 2026-09-30). */
export const SEED_PER_PLOT = 2;
/**
 * Cotton takes half again the seed a plot: the dearer crop, and the more profitable, two reales a bale since 2026-09-27 (a real until then; owner, 2026-09-16,
 * docs/MONEY_AND_GLORY.md §8.1). Twice the seed was tried first and measured: a family nobody plays could no longer gather the
 * seed for its field between harvests, and the cotton economy collapsed to a load or two a class.
 */
export const COTTON_SEED_PER_PLOT = 3;
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
/** Whether a planted field has come on (a class saved before crops were per plot, `household.field`). */
export const ripe = (world, field) => field?.state === 'planted' && grownOf(world, field) >= growMs(field.crop);
/** "in about 2 minutes", or "within the minute", at the pace of the season now; null for a field that is not growing. */
export function readyWords(world, field) {
  if (field?.state !== 'planted') return null;
  return minutesWords(world, growMs(field.crop) - grownOf(world, field));
}
const minutesWords = (world, leftMs) => {
  const minutes = Math.ceil(Math.max(0, leftMs) / growPace(world) / MINUTE_MS);
  return minutes <= 1 ? 'within the minute' : `in about ${minutes} minutes`;
};

// ---------------------------------------------------------------------------------------------------------- a crop to each plot
//
// **Each cleared plot has its own crop** (owner, 2026-09-30: "players can still plow new and extra fields right? so i as a player
// could have corn growing for food as well as cotton to sell?"; docs/LAND_GRANTS.md §5.2, `FIC-GONZ-1000`). A plot is bare, or sown with corn or
// with cotton, and a sown plot stands its own real minutes from the tick it went in and is brought in by itself: corn is food,
// cotton is bales, a plot's yield and its fence exactly as before. `household.field` is kept as the family's summary - `crop`
// the crop it last chose, which a bare plot never sown is given by default, and `state` ripe while any plot is ripe, planted
// while any stands, bare otherwise - for what reads the field as a whole (the children's work, the neighbours' trades).
//
// A class saved before this has one crop for the whole field: its sown plots read it (sim/fields.mjs `cropState`) until the crop
// is first touched, and then each is written down as its own, the same crop and the same minutes (`keepCrops`). No save version.

/** The plots written down, each sown one with its own crop: a class's one field state becomes each plot's here and only here. */
export function keepCrops(world, household) {
  const field = household.field;
  const plots = keepPlots(world, household);
  for (const plot of plots) {
    if (plot.sown !== true || Number.isFinite(plot.grownMs)) continue;
    if (plot.state !== 'cleared' || !['planted', 'ripe'].includes(field?.state)) { delete plot.sown; continue; }
    plot.crop = field.crop === 'cotton' ? 'cotton' : 'corn';
    plot.grownMs = grownOf(world, field);
    if (field.state === 'ripe') plot.ripe = true;
  }
  return plots;
}
/** The family's field as a whole, from its plots: ripe while any plot is, planted while any stands, else bare. */
export function settleField(world, household) {
  const state = ripePlots(household).length ? 'ripe' : sownPlots(household).length ? 'planted' : 'bare';
  const { grownMs: _grown, ...field } = household.field || {};
  if (household.field?.state === state && household.field.grownMs === undefined) return;
  household.field = { ...field, crop: field.crop === 'cotton' ? 'cotton' : 'corn', state, changedTick: world.tick };
}
/** Seed goes into a plot: this crop, standing from nothing. The crop is remembered on the plot after it is brought in. */
export function sowPlot(plot, crop) {
  plot.sown = true;
  plot.crop = crop === 'cotton' ? 'cotton' : 'corn';
  plot.grownMs = 0;
  delete plot.ripe;
}
/** A plot brought in: bare again, and still the crop it last had, for auto to put back (sim/auto.mjs `fieldTask`). */
export function reapPlot(plot) {
  delete plot.sown;
  delete plot.grownMs;
  delete plot.ripe;
}
/** Real milliseconds this plot's crop has stood, at full pace. */
const grownIn = (world, household, plot) => Number.isFinite(plot.grownMs) ? plot.grownMs : grownOf(world, household.field);

/**
 * One running tick of growth for every crop in the ground: the real time the server says it took, or a Study-pace tick, at the pace
 * of the season this tick falls in (`growPace`) - so a crop that stands across the change blends. Each plot its own. Returns the
 * plots that came on this tick.
 */
export function growCrop(world, household, realMs = null) {
  const add = (Number.isFinite(realMs) ? realMs : STUDY_TICK_MS) * growPace(world);
  if (!sownPlots(household).some(plot => cropState(household, plot) === 'planted')) return [];
  // A family whose old field block the map does not draw has nowhere to write its plots: its one field grows as it always did.
  // ceiling: never met on either map (both draw every family's field block); kept so such a class still grows its crop.
  if (!household.plots && !plotsOf(world, household).length) {
    const field = household.field;
    household.field = { ...field, grownMs: grownOf(world, field) + add };
    if (!ripe(world, household.field)) return [];
    household.field = { ...household.field, state: 'ripe', changedTick: world.tick };
    return fieldPlots(household).map(plot => ({ ...plot, crop: cropOf(household, plot) }));
  }
  const came = [];
  for (const plot of keepCrops(world, household)) {
    if (cropState(household, plot) !== 'planted') continue;
    plot.grownMs += add;
    if (plot.grownMs >= growMs(plot.crop)) { plot.ripe = true; came.push(plot); }
  }
  if (came.length) settleField(world, household);
  return came;
}
/** When this plot's crop will be ready, in words; null for a plot that is not growing. */
export function plotReadyWords(world, household, plot) {
  if (cropState(household, plot) !== 'planted') return null;
  return minutesWords(world, growMs(cropOf(household, plot)) - grownIn(world, household, plot));
}
/** The growing plot that comes on first, and when: `{ plot, crop, words }`, or null when nothing is growing. */
export function soonestCrop(world, household) {
  const growing = sownPlots(household).filter(plot => cropState(household, plot) === 'planted');
  if (!growing.length) return null;
  const left = plot => growMs(cropOf(household, plot)) - grownIn(world, household, plot);
  const plot = growing.reduce((best, one) => left(one) < left(best) ? one : best);
  return { plot, crop: cropOf(household, plot), words: plotReadyWords(world, household, plot) };
}
/**
 * The field in numbers, for the family's own line on the map (public/app.js `renderFieldSummary`): each crop's plots growing and
 * ripe, the bare plots, and when the next crop comes on - only what there is, since it rides on every tick (`{ bare: 1 }` for a
 * family with one plot and nothing in it; tests/family-roll.test.mjs holds the tick to its bytes).
 */
export function cropSummary(world, household) {
  const summary = {};
  for (const plot of clearedPlots(household)) {
    const state = cropState(household, plot);
    if (state === 'bare') { summary.bare = (summary.bare || 0) + 1; continue; }
    const crop = (summary[cropOf(household, plot)] ??= {}), stage = state === 'ripe' ? 'ripe' : 'growing';
    crop[stage] = (crop[stage] || 0) + 1;
  }
  const next = soonestCrop(world, household);
  return { ...summary, ...(next && { next: { crop: next.crop, words: next.words } }) };
}
/**
 * The crop each of these bare plots is given when nobody chooses: the crop last grown in it, else the family's own (the one it
 * chose last). What a person on auto plants (owner, 2026-09-30).
 */
export const ownCrops = (household, plots) => Object.fromEntries(plots.map(plot => [plot.id, cropOf(household, plot)]));

/** Stored plot crops that could not have been sown (sim/survey.mjs `plotsInvalid`). */
export function plotCropInvalid(plot) {
  if (plot.crop !== undefined && (plot.state !== 'cleared' || !CROPS[plot.crop])) return 'Invalid plot crop';
  if (plot.grownMs !== undefined && (plot.sown !== true || !Number.isFinite(plot.grownMs) || plot.grownMs < 0 || !CROPS[plot.crop])) return 'Invalid plot crop';
  if (plot.ripe !== undefined && (plot.ripe !== true || !Number.isFinite(plot.grownMs))) return 'Invalid plot crop';
  return null;
}

/** Stored field state that could not have been planted (sim/world.mjs `validateWorld`). */
export function fieldInvalid(field) {
  if (!field || !['bare', 'planted', 'ripe'].includes(field.state) || !CROPS[field.crop]) return 'Invalid field state';
  if (field.grownMs !== undefined && (!Number.isFinite(field.grownMs) || field.grownMs < 0)) return 'Invalid field state';
  return null;
}

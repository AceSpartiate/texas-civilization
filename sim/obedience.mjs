// What a child's obedience does (owner, 2026-09-26; docs/CHILDREN.md §4, `FIC-GONZ-478` to `-480`).
//
// "kids disobey sometimes. sometimes they should randomly turn off their automation feature. wh3n kids are created there should
// be a hidden d20 roll for each one. the higher the roll, the more obedient, and vice versa."
//
// The roll is sim/family.mjs `obedienceOf`, hidden like every other hidden stat and never on any wire. It governs three things,
// each of them **something the child is seen doing, with a plain line saying so** - VISION.md's legible causality, so a student
// learns their child and never meets a number or a hidden die:
//
//   - **Dawdling** (`dawdleChance`): set to a job, the child does not start at once - "Tom is dawdling in the yard instead of
//     starting to carry water." - and starts a tick or two later. Rolled once, when the job is given.
//   - **Wandering off** (`wanderChance`): at a job, the child drops it and goes to play instead - "Tom has wandered off to play
//     tag instead of carrying water." Rolled every tick of the job. At home they are then seen playing, on their play's icon; on
//     the road east they leave it off and are back with the family.
//   - **Switching their own automation off** (`autoOffChance`, sim/childhood.mjs): "Tom has had enough of being good, and gone
//     his own way." Rolled every tick they are on it.
//
// Play is never disobeyed: a child told to play who goes off and plays is doing as they are told. Only a child's **jobs** are:
// the works marked `child` that are not `play` (sim/children.mjs, sim/flight-work.mjs).
//
// Every rate runs in a straight line from the lowest roll to the highest, so a lower roll is always the harder child and the
// difference is steady rather than a cliff (tests/childhood.test.mjs measures it over many ticks). A roll of 1 is a child a
// student must keep an eye on - about one job in four begun late, and a long job left half done as often as not; a 20 is a child
// who very nearly always does as they are told. Nothing is punished: a child who wanders off has cost the family nothing but the
// job, and plays. Every number is the game's own (`FIC-GONZ-479`).
import { record } from './events.mjs';
import { OBEDIENCE_DIE, obedienceOf } from './family.mjs';
import { stirredShare } from './shares.mjs';

/** [at a roll of 1, at a roll of 20] for each of the three: per job begun, per tick at a job, per tick on automation. */
export const OBEDIENCE_RATES = Object.freeze({
  dawdle: Object.freeze([0.3, 0.02]),
  wander: Object.freeze([0.06, 0.002]),
  autoOff: Object.freeze([0.05, 0.002]),
});
const along = ([low, high], roll) => low + (high - low) * (Math.min(OBEDIENCE_DIE, Math.max(1, roll)) - 1) / (OBEDIENCE_DIE - 1);
export const dawdleChance = roll => along(OBEDIENCE_RATES.dawdle, roll);
export const wanderChance = roll => along(OBEDIENCE_RATES.wander, roll);
export const autoOffChance = roll => along(OBEDIENCE_RATES.autoOff, roll);
/** How long a child dawdles before starting, in ticks: two for the lower half of the die, one for the upper. */
export const dawdleTicks = roll => (roll <= OBEDIENCE_DIE / 2 ? 2 : 1);

/** Whether this work is a child's job, which obedience governs: a work marked a child's that is not play. */
export const isJob = chore => Boolean(chore?.child && !chore.play);

/** The job in the child's own words, for a line: "carrying water to the house". */
export const jobWords = (chore, state) => String(state?.doing && state.doing !== 'setting out' ? state.doing : chore?.name?.toLowerCase() || 'the work');

/**
 * A child set to a job, the moment it is given (the job's `begin`, sim/children.mjs and sim/flight-work.mjs): whether they start
 * at once. A child who does not dawdles in the yard for `dawdleTicks`, said in the family's record, and then starts; the
 * chore itself waits (sim/chores.mjs `advanceChore` reads `dawdle`). Rolled on the class, the child, the tick and the job.
 */
export function beginsJob(world, household, entity, doing) {
  const state = entity.chore;
  if (!state) return;
  const roll = obedienceOf(world, entity);
  if (stirredShare(world, entity.id, `dawdle:${world.tick}:${state.id}`) >= dawdleChance(roll)) return;
  state.dawdle = dawdleTicks(roll);
  state.doing = 'dawdling instead of starting';
  record(world, 'consequence', {
    actorId: entity.id, householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-479',
    text: `${entity.name} is dawdling instead of starting ${doing}.`,
  });
}

/** Whether a child at a job wanders off from it this tick: a stirred share of the class, the child and the tick, against their roll. */
export const wandersOff = (world, entity) => stirredShare(world, entity.id, `wander:${world.tick}`) < wanderChance(obedienceOf(world, entity));
/** Whether a child on their own automation switches it off this tick (sim/childhood.mjs). */
export const tiresOfAuto = (world, entity) => stirredShare(world, entity.id, `auto-off:${world.tick}`) < autoOffChance(obedienceOf(world, entity));

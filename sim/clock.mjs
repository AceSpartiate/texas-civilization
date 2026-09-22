// Two clocks: docs/COLONIES.md §5.7, build step 4 part 3.
//
// Everything a student *does* is measured in ticks - a spell of work, a walk, a ride, a
// conversation - and that stays exactly as it is in every phase. A man takes as many real
// seconds to fell a tree in November as in September, and a rider crosses the map at the
// same real speed. What changes between phases is the calendar: how many minutes of 1835
// one tick stands for. So nothing a student watches speeds up or skips; the date simply
// moves further while they work, and that is how the weeks before Béxar fit in a lesson
// without feeling compressed.
//
// The split this file exists to make is between the two kinds of thing the simulation
// advances. **Effort** - work, walking, tiring, resting - is paid in `TICK_MINUTES` and
// never scales. **Days** - food eaten, food spoiling, a wound mending, a volunteer's
// absence from the farm - are read off the calendar and do scale. Travel and chores need
// nothing from here: they already count in ticks. Relay delays and the arrival checks
// against `HIST-TEX-006` need nothing either: they are stored as calendar minutes, which
// is exactly what a faster calendar should compress.

/** One tick of a person's own time, the same in every phase. Effort is paid in these. */
import { militaryMinutes } from './military-pacing.mjs';
export const TICK_MINUTES = 20;

// Movement, encounters and the director must use the SAME calendar interval during
// a tick, even when that tick lands on a pacing boundary. Never serialized.
const runningSteps = new WeakMap();
export function withCalendarStep(world, minutes, advance) {
  const previous = runningSteps.get(world);
  runningSteps.set(world, minutes);
  try { return advance(); }
  finally { if (previous === undefined) runningSteps.delete(world); else runningSteps.set(world, previous); }
}

/**
 * Minutes of 1835 that one tick stands for, by the phase the class is in, against the
 * fifty-minute budget of §5.7 at the Study pace of 9.5 seconds a tick (`FIC-GONZ-027`,
 * tuned by playing):
 *
 * | Phase       | A tick is    | Covers                        | Real minutes |
 * | ---         | ---          | ---                           | ---          |
 * | `home`      | 20 minutes   | dawn Sept 28 to Sept 29       | 0–13         |
 * | `news`      | an hour      | the cannon to the fight's end | 13–27        |
 * | `gathering` | four hours   | Oct 3 to the march, Oct 12    | to come with build step 5 |
 * | `campaign`  | half a day   | Oct 13 to Béxar, Dec 9        | to come with build step 6 |
 *
 * Every one divides the day whole - 72, 24, 6 and 2 ticks to it - so a day never ends in
 * the middle of a tick. `preserved` is the ended class, which steps no further.
 */
export const CALENDAR_SCALE = Object.freeze({ home: TICK_MINUTES, news: 60, gathering: 240, campaign: 720, preserved: TICK_MINUTES });

/**
 * The calendar moment a minute of this class's clock falls on. Minute zero is dawn on September 28, 1835 for a class whose
 * families arrive by wagon, and midnight on the 29th for a class saved before arrivals, which keeps the timeline it was playing.
 */
export const dateOf = (world, minute) => new Date((world.director?.arrival ? Date.UTC(1835, 8, 28, 6) : Date.UTC(1835, 8, 29)) + minute * 60000);

/**
 * How many minutes of 1835 the next tick stands for.
 *
 * Only a class on the real land of the colonies runs two clocks (`world.map.source`). The
 * invented Gonzales country - and so every class saved before this, and every class made
 * without `MAP=colonies` - keeps the single twenty-minute clock it has always had. Nothing
 * is stored and nothing is read from a save, so no old class opens on a different calendar
 * and no save version moves.
 *
 * ceiling: the scale is read once at the top of a tick, so a phase boundary inside a tick
 * takes effect on the next one. At a twenty-minute grain that is invisible, and the
 * boundaries are moments of news rather than moments a student is watching.
 */
export function calendarMinutes(world) {
  if (runningSteps.has(world)) return runningSteps.get(world);
  if (!world?.map?.source) return TICK_MINUTES;
  const proposed = deciding(world) ? TICK_MINUTES : CALENDAR_SCALE[world.director?.phase] || TICK_MINUTES;
  return militaryMinutes(world, proposed);
}

/**
 * Whether a dated question is open in front of the families, so the calendar holds at the
 * farming scale until it is answered.
 *
 * History fixes both ends of the night of October 1: the force crosses the Guadalupe in the
 * dark and marches at dawn (`HIST-GONZ-003`), and everything between is a family deciding
 * whether its man goes upriver with it (sim/directors.mjs). Those eight hours are
 * twenty-four ticks at the farming scale and eight at an hour a tick - and eight is not long
 * enough to notice a prompt and read it, which is what `PATIENCE_MINUTES` was tuned at sixty
 * ticks to say. A window between two dated moments cannot be stretched, because history set
 * both; so the calendar steps back into it instead, and picks the faster one up again at the
 * approach. That is §5.7's own rule kept rather than broken: the scale steps at moments of
 * news, and never in the middle of something a student is watching.
 *
 * A conversation counts as well, and for a reason that was measured rather than guessed. A rider
 * who has said his piece waits sixty ticks for an answer, which is a count of a student's
 * attention (`PATIENCE_MINUTES` in sim/encounters.mjs). Sixty ticks of a four-hour tick is ten
 * days of a man sitting on a horse at a gate - and the next rider with the next word queues
 * behind him the whole time, which is how a Liberty family came to miss the news of the fight
 * entirely. `resolveTimeJump` already refuses to run compressed time past a conversation that has
 * not finished; this is the same rule, applied to the calendar instead of to a Host's jump.
 *
 * ceiling: two windows, named here, because two is what the built slice has. As the later phases
 * bring their own dated decisions this wants to be a question the director answers - what is open
 * in front of anybody right now - rather than a list kept in the clock.
 */
function deciding(world) {
  if (world.director?.milestones?.crossing && !world.director?.milestones?.approach) return true;
  // Only a conversation somebody is actually reading. A family nobody plays answers a rider in
  // the same tick he speaks (sim/neighbours.mjs), and holding the whole class's calendar for one
  // of those put eighty-five minutes on a fifty-minute lesson when it was measured.
  // Nor for a family whose student has gone (sim/absence.mjs): the director answers for it in the same tick.
  if (Object.values(world.encounters || {}).some(encounter => encounter.status === 'open' && world.households[encounter.householdId]?.played && !world.households[encounter.householdId].absent)) return true;
  // A played family told to leave in the spring (sim/scrape.mjs): the calendar holds at the farming scale until it has gone, or
  // the army has passed and burned it out, which is at most two days.
  if (Object.values(world.households).some(household => household.played && !household.absent && household.flight?.status === 'ordered' && !household.flight.burned)) return true;
  // A played family with the road's question in front of it (sim/road.mjs): the bogged wagon, the army close behind. Only
  // while it is deciding - `ROAD_PATIENCE_TICKS` at most - and never for the road itself; a family nobody is at the screen
  // for (sim/absence.mjs) is answered the next tick and holds nothing.
  if (Object.values(world.households).some(household => household.played && !household.absent && household.flight?.ask)) return true;
  // A question Houston's army has put to a played family's man (sim/camp.mjs: leaving after the word of Goliad, the fork of
  // the road) holds the calendar while that family decides - never for the camp itself, and never for a family whose
  // student has gone, which is answered the tick it is asked. Read here without importing, as the flight is.
  return Object.values(world.entities).some(entity => entity.service?.kind === 'houston' && entity.service.status === 'serving'
    && (entity.service.leave === 'open' || entity.service.road === 'open')
    && world.households[entity.householdId]?.played && !world.households[entity.householdId].absent);
}

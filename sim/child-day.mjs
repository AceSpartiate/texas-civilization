// A small child's day: how long a child's play and a child's own automation last (owner, 2026-09-29; docs/CHILDREN.md §3a).
//
// The owner, by multiple choice on the triage's D2 (docs/audits/2026-09-29-triage.md): **"Until the day ends"** - a small
// child's play and a child's auto last until the day ends, with an "!" on the family panel when a child's auto goes off. Until
// this, play lasted six ticks, a child's auto eighteen to fifty-six by their roll, and a child with nothing to do stopped a
// parent after two: in a family of eight to eighteen children that was an order about every seventy-six seconds, and most of
// what the student did (playthrough audit #9, design audit M7, M13, M26).
//
// **The day** is the one the simulation already keeps: `Math.floor(world.minute / 1440)`, the day the hens lay on
// (sim/children.mjs `eggsGathered`), the day the record hears of a child's talk once (sim/childhood.mjs `firstToday`). Minute
// zero is dawn on September 28 for a class whose families arrive by wagon (sim/clock.mjs `dateOf`), so there the day turns at
// six in the morning, when the children wake; for a class saved before arrivals it turns at midnight, in the dark, and nobody
// looks for a parent until six (sim/childhood.mjs `WAKING_HOURS`).
//
// ceiling: **never sooner than `DAY_FLOOR_TICKS`**. On the real land's faster calendars a tick is four or twelve hours of 1835
// (sim/clock.mjs `CALENDAR_SCALE`), so a day is six ticks or two - under a minute of a lesson at the Study pace - and "until the
// day ends" read to the letter would put an "!" on every child on auto every twenty seconds: the time sink the owner ruled out
// ("it isn't meant to be annoying or a time sink", docs/CHILDREN.md §1). So a child's play and auto last until the day ends and
// at least eighteen ticks, the shortest a child's auto ever lasted (about three minutes at Study). At the farming scale of twenty
// minutes a tick the floor is six hours, and only a child set to it in the six hours before the day turns keeps at it past the
// turn. A day counted in the student's own minutes on those calendars is the way out, if the owner wants the fast phases' days
// longer or shorter than this.
//
// Nothing here is stored but `{ day, since }` on the play or the automation it times, and both are absent from every save made
// before: a child at play or on auto in an old save is timed from the tick it is first seen. **No save version moved.**

/** Minutes in a day of the calendar (sim/clock.mjs `dateOf` counts from dawn or midnight; this counts whole days of it). */
export const DAY_MINUTES = 1440;
/** The day of the class this minute falls on: the simulation's one day boundary. */
export const dayOf = world => Math.floor((world?.minute ?? 0) / DAY_MINUTES);
/** The fewest ticks a child's play or automation lasts, whatever the calendar (see the ceiling above). */
export const DAY_FLOOR_TICKS = 18;
/** A stretch of the child's day begun now: the day it began on, and the tick. */
export const dayBegun = world => ({ day: dayOf(world), since: world.tick });
/** Whether a stretch begun on `day` at tick `since` is over: the day has ended, and the floor has passed. */
export const dayOver = (world, { day, since }) => dayOf(world) > day && world.tick - since >= DAY_FLOOR_TICKS;
/** A saved stretch of the child's day that cannot be: its day and tick are whole numbers, not after now. */
export const dayInvalid = (world, stretch) => !stretch || !Number.isInteger(stretch.day) || !Number.isInteger(stretch.since) || stretch.day > dayOf(world) || stretch.since > world.tick;
/**
 * Whether `key` is said of this person for the first time today, and marks it so: kept in the person's `told`, the same day-stamped
 * notes the little ones' other once-a-day lines use (sim/childhood.mjs `firstToday`, sim/chores.mjs `firstPlayToday`). Here, in the
 * module every one of them can import, for the lines of a child's play (sim/children.mjs; triage 2026-09-29 2.3, second half). An
 * absent `told` is the correct empty value - nothing said yet today - so no save version moved.
 */
export function onceToday(world, entity, key) {
  const day = dayOf(world);
  if (entity.told?.[key] === day) return false;
  entity.told = { ...(entity.told || {}), [key]: day };
  return true;
}

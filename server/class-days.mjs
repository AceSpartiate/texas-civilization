// How many class days a game takes, and where a class is in it: what the Host's page tells the teacher before Start and at
// any time after (owner, 2026-09-28, by multiple choice on class length: "Plan for several class days" - keep the pacing,
// make stopping and resuming smooth and clear, and tell the teacher up front how many class days a game takes at each pace).
//
// The pace changes only how many real seconds a tick takes (server/app.mjs `PACES`), never what happens, so a game is a
// number of ticks and the class days follow from the pace. The ticks are measured, not worked out: the whole classes of
// docs/audits/2026-09-28-playthrough.md, stepped to the ending at the Study pace with students who answer, students at the
// screen who do nothing, and students who have gone (the audit's table "Real time at the Study pace"). The low end is a
// class that answers ("all scripted", `c5s` and `k15`); the high end is the slowest real mix measured (`a30i` and `a30m`,
// 30 families with idle and absent students; `i30` for the second period). A class nobody plays is quicker than either and
// is not a class.
//
// ceiling: one seed per row, measured in process on one computer; a real class's readers sit somewhere in this range and
// the range is what is shown. Re-measure (the audit's recipe) if the calendar's holds change, and change these numbers.
import { momentOf } from '../sim/directors.mjs';
import { periodOf } from '../sim/periods.mjs';

/** Ticks each period takes with students playing: [a class that answers, the slowest measured]. */
export const PERIOD_TICKS = Object.freeze({ 1: Object.freeze([719, 999]), 2: Object.freeze([331, 450]), 3: Object.freeze([481, 1035]) });
/**
 * Minutes of play in a class day: a 45 to 50 minute class period less the minutes spent opening Chromebooks and logging in
 * (the classroom audit's "5-10 minutes of logging in each day").
 */
export const PLAY_MINUTES_A_DAY = 40;
/** The first day also joins and makes the families before Start (the classroom audit: "a lobby of about 10-15 minutes"). */
export const LOBBY_MINUTES = 15;
const NAMES = Object.freeze({ 1: 'the autumn of 1835', 2: 'the winter of 1836', 3: 'the spring of 1836' });

/** Where each period starts and stops on this class's own clock (sim/directors.mjs TIMELINE, sim/periods.mjs). */
function bounds(world, period) {
  if (period === 1) return [0, momentOf(world, 'bexar-end')];
  if (period === 2) return [momentOf(world, 'winter-opens'), momentOf(world, 'alamo-end')];
  return [momentOf(world, 'scrape-opens'), momentOf(world, 'scrape-end')];
}
/** How far through its period's calendar a class is, 0 to 1. */
export function periodShare(world) {
  const period = periodOf(world);
  if (world.status === 'lobby') return 0;
  const [from, to] = bounds(world, period);
  return Math.min(1, Math.max(0, ((world.minute || 0) - from) / Math.max(1, to - from)));
}
/** Real minutes to class days, as a range a teacher can plan with: [fewest, most], never under one. */
const days = minutes => Math.max(1, minutes / PLAY_MINUTES_A_DAY);
const range = (lo, hi) => { const a = Math.max(1, Math.round(days(lo))); return [a, Math.max(a, Math.ceil(days(hi)))]; };

/**
 * The schedule the Host's page shows. `paces` is server/app.mjs `PACES`. Null for a class on the invented Gonzales country,
 * which is the one afternoon and has no periods.
 *
 * - `whole`: each pace's class days for the whole game, from the lobby to the spring's ending.
 * - `left`: each pace's class days from here to the ending, the current period counted by what is left of its calendar.
 * - `period`, `periods`, `season`, `share`: where the class is.
 */
export function classSchedule(world, paces) {
  if (!world?.map?.source) return null;
  const period = periodOf(world), share = periodShare(world);
  const ticks = (from, part) => [0, 1].map(end => {
    let total = 0;
    for (let each = from; each <= 3; each++) total += PERIOD_TICKS[each][end] * (each === from ? part : 1);
    return total;
  });
  const whole = ticks(1, 1), finished = world.status === 'ended' && period === 3;
  const left = finished ? [0, 0] : ticks(period, 1 - share);
  const perPace = (count, lobby) => Object.fromEntries(Object.entries(paces).map(([name, ms]) => {
    const minutes = count.map(value => value * ms / 60000 + lobby);
    return [name, { minutes: minutes.map(Math.round), days: count[1] === 0 ? [0, 0] : range(minutes[0], minutes[1]) }];
  }));
  return {
    period, periods: 3, season: NAMES[period], share: Math.round(share * 100) / 100,
    playMinutesADay: PLAY_MINUTES_A_DAY,
    whole: perPace(whole, LOBBY_MINUTES),
    left: perPace(left, world.status === 'lobby' ? LOBBY_MINUTES : 0),
  };
}

// A real-land class in the spring of 1836, for the Scrape's tests (tests/scrape-pursuit.test.mjs) and its browser proof
// (scripts/scrape-pursuit-browser-proof.mjs): families rolled, played through two periods and into the third, running.
// Built once per process and handed out as copies. `atTimeline` steps a world on to a minute of the record's timeline.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../../sim/periods.mjs';
import { timelineOf } from '../../sim/advance.mjs';
import { calendarMinutes, withCalendarStep } from '../../sim/clock.mjs';

export const SPRING_SEED = 'road-1638';
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
let shared = null;
function build() {
  const world = createGonzalesWorld(SPRING_SEED, 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  return world;
}
/** A copy of the spring class, running, at the start of the third period. */
export const spring = () => structuredClone(shared ??= build());
/** Steps the world on until the record's timeline reaches `minute` (sim/advance.mjs `timelineOf`). */
export function atTimeline(world, minute, limit = 6000) {
  // On to the minute itself: the last tick is cut to land on it, as a battle's first minute is landed on.
  for (let t = 0; t < limit && timelineOf(world) < minute && world.status === 'running'; t++) {
    const left = minute - timelineOf(world);
    if (calendarMinutes(world) > left) withCalendarStep(world, left, () => stepWorld(world)); else stepWorld(world);
  }
  return world;
}
export { until };

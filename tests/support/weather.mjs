// Fair weather for a test whose rule is not the weather's.
//
// The weather is the class's own, hashed from its seed and the day (sim/weather.mjs), and since 2026-10-02 a wet or a bitter day sends
// the family's people with no task and every child in out of it (sim/shelter.mjs). A test of a rule that holds on an ordinary day -
// a child going to a parent, a rider riding away from the family he spoke to - is about that rule, not about the sky its seed happened
// to give it; this makes every day of its class fair. The weather's own tests, and the shelter's, never use it.
//
// It writes into the day-by-day weather the class has worked out and kept (`weatherOn`), as tests/battle-arrival.test.mjs raises the
// rivers there: nothing is stored in the world, and nothing outside the test's own class is touched.
//
// Not a test file: `node --test` picks up `*.test.mjs`, and this is imported, never run.
import { weatherOn } from '../../sim/weather.mjs';

/** Every day of this class's first `days` fair: no rain, no storm, no norther and no fog anywhere. Returns the world. */
export function fairWeather(world, days = 260) {
  for (let day = 0; day < days; day++) {
    for (const region of Object.values(weatherOn(world, day).regions)) Object.assign(region, { kind: 'fair', wet: false, wind: { ...region.wind, force: 0.15 } });
  }
  return world;
}

// Standing in for the weather the server will send, for a proof or a measurement to look at a day the simulation cannot
// yet deal (docs/WEATHER.md §10.7: `projectWorld` does not carry `world.weather` yet, and that side is being built in
// parallel). The contract is exactly the one being built to, and nothing here is a field the page invents: the page reads
// `world.weather` and adds nothing to it.
//
// Put into the snapshot as it is parsed rather than written onto the world afterwards, and the difference matters. Writing
// it on afterwards leaves a window - between a snapshot arriving and the next hold - in which the page draws a world with
// no weather, and the kept ground is then drawn twice for every snapshot: once for the day going and once for it coming
// back. Measured 2026-09-20: two whole redraws of the country a second, and a frame cost that was the harness's, not the
// drawing's.

/** The five kinds as a proof asks for them, each over the whole country. `water` and `wind` are the day's own. */
export const stubWeather = (kind, { water = 0.8, force = kind === 'norther' ? 1 : 0.35, from = 0, westOf = 140, eastOf = 260 } = {}) => {
  const region = { kind, water, wind: { from, force }, since: 0 };
  return { day: 1, bounds: { westOf, eastOf }, regions: { west: region, middle: region, east: region } };
};

/**
 * Install on a Playwright context BEFORE any page script runs. Afterwards `page.evaluate(w => window.__weatherStub = w)`
 * sets the day, and `null` takes it away; every snapshot from then on carries it, including the one being parsed when it
 * was set. `minute` overrides the clock, for the hours fog is about.
 */
export async function installWeatherStub(context) {
  await context.addInitScript(() => {
    window.__weatherStub = null;
    window.__weatherStubMinute = null;
    const parse = JSON.parse;
    JSON.parse = function (...args) {
      const value = parse.apply(this, args);
      if (value && typeof value === 'object' && value.world && window.__weatherStub) {
        value.world.weather = window.__weatherStub;
        if (Number.isFinite(window.__weatherStubMinute)) value.world.minute = window.__weatherStubMinute;
      }
      return value;
    };
  });
}

/** Set the day on a page whose context carries the stub, and put it on the snapshot already in hand. */
export async function holdWeather(page, weather, minute = null) {
  await page.evaluate(([w, at]) => {
    window.__weatherStub = w;
    window.__weatherStubMinute = at;
    const world = window.__snapshot?.world;
    if (!world) return;
    if (w) { world.weather = w; if (Number.isFinite(at)) world.minute = at; } else delete world.weather;
  }, [weather, minute]);
}

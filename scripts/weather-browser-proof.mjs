// The weather, by eye. Owner, 2026-09-20: "Weather should be a visual thing... Players should see the weather. If
// implemented correctly, no text should be required." There is therefore nothing to read on the page that says what the
// day is, and nothing a test can assert about it: the only honest proof is the picture, looked at.
//
// Every day photographed here is a REAL DAY OF A REAL CLASS, taken from `weatherOn` in sim/weather.mjs on the same seed
// every other measure uses, and the first of them is taken with no intervention at all:
//
//   `live` is the class's own opening day, 29 September 1835, exactly as the server sends it - and it already has three
//   different weathers on one map, which is the thing hardest to draw well: the Guadalupe up in the west where
//   Castañeda "found their path blocked by high water" (`HIST-TEX-225`), rain over the centre, a fair east.
//
// The rest are days further into the class than a proof can sit and wait for - the storm at San Felipe on 4 November
// (`HIST-TEX-222`), the wettest day this class ever has - so their weather is computed here by the simulation's own
// `weatherOn` and put onto the snapshot as it is parsed (scripts/support/weather-stub.mjs). The numbers are the
// simulation's, not this script's; what stands in is the delivery, not the weather. `shut` is the one exception and says
// so: no day of this class quite reaches the level that closes a ford, so that one river is raised by hand to show what
// a student would see if it did.
//
// Each day is photographed at three zooms: a family's own yard, its county, and the whole country the Host sees.
//
// Same computer, headless Chrome.
// Run: node scripts/weather-browser-proof.mjs [--label after] [--days live,storm]
//   writes docs/evidence/weather/weather-<day>-<view>.png, contact sheets, and docs/evidence/weather-browser.json
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { meetFamily } from './support/meet-family.mjs';
import { holdWeather, installWeatherStub } from './support/weather-stub.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const LABEL = arg('label', 'after');
// `--days norther,fog` photographs only those, for looking at one kind closely while it is being drawn right.
const ONLY = arg('days', null)?.split(',');
const OUT = 'docs/evidence/weather';

const { createClassroom } = await import(new URL('../server/app.mjs', import.meta.url).href);
const { createGonzalesWorld } = await import(new URL('../sim/gonzales.mjs', import.meta.url).href);
const { weatherOn, REGIONS, WATER_SHUT } = await import(new URL('../sim/weather.mjs', import.meta.url).href);

// The same seed every other measure and proof uses, so this family stands on the same ground as the perf record's.
const SEED = 'perf-render-1';
const app = createClassroom({ seed: SEED, playerCount: 15, tickMs: 1000, solo: true, worldFactory: (seed, n) => createGonzalesWorld(SEED, n, { map: 'colonies', neighbours: true }) });

// Days of this class, found by asking the simulation what the weather was. The family in a solo game on this seed lives
// in the centre, so the kinds are chosen for the centre - what the student at the yard and the county zoom is standing in.
const almanac = Array.from({ length: 215 }, (_, day) => weatherOn(app.state.world, day));
const firstWhere = test => almanac.find(day => test(day));
const wettest = almanac.reduce((most, day) => (Math.max(...REGIONS.map(r => day.regions[r].water)) > Math.max(...REGIONS.map(r => most.regions[r].water)) ? day : most));
const DATE = day => new Date(Date.UTC(1835, 8, 29) + day.day * 86400000).toUTCString().slice(5, 16);
const pick = (id, why, test, minute) => {
  const day = firstWhere(test);
  if (!day) throw new Error(`no day of this class is ${id}`);
  return { id, why, weather: day, minute: day.day * 1440 + (minute ?? 13 * 60) };
};
const centre = kind => day => day.regions.centre.kind === kind;
const DAYS = [
  // No intervention at all: the class as it opens, straight off the server.
  { id: 'live', why: 'the class as it opens, 29 September 1835, with nothing injected: the Guadalupe up in the west, rain over the centre, a fair east', live: true },
  { id: 'fair', why: 'nothing to report: the day the others are read against', ...pick('fair', '', day => centre('fair')(day) && day.regions.centre.water < 0.2) },
  pick('rain', 'rain falling, the light flat and grey, the ground dark with it, the creeks up', day => centre('rain')(day) && day.regions.centre.water > 0.4),
  pick('norther', "the record's own signature: the wind hard out of the north, the sky clear, the light thin and blue", day => centre('norther')(day) && !day.regions.centre.wet),
  pick('norther-wet', "a norther that brought its rain with it, as the one of 20 November did: wind, cold and rain at once", day => day.regions.centre.kind === 'norther' && day.regions.centre.wet),
  pick('storm', 'heavier rain, a dark sky, lightning seen at a distance - 4 November 1835 at San Felipe, "cold and stormy" (HIST-TEX-222)', day => centre('storm')(day)),
  pick('fog', 'a low veil on the bottoms and the river, and nothing hidden under it', centre('fog'), 7 * 60 + 20),
  { id: 'high-water', why: `the wettest day this class ever has: the rivers of the centre at ${wettest.regions.centre.water}, full and brown, the bottoms dark`, weather: wettest, minute: wettest.day * 1440 + 13 * 60 },
  {
    id: 'shut', why: `a ford shut: no day of this class quite reaches ${WATER_SHUT}, so this one river is raised by hand to show what a student would see if it did`,
    weather: { ...wettest, regions: Object.fromEntries(REGIONS.map(r => [r, { ...wettest.regions[r], water: 0.95 }])) },
    minute: wettest.day * 1440 + 13 * 60, raised: true,
  },
  {
    id: 'arriving', why: 'a norther a quarter of an hour old: it comes up rather than flicking on',
    ...(() => { const d = pick('x', '', day => centre('norther')(day) && !day.regions.centre.wet); return { weather: d.weather, minute: d.weather.day * 1440 + 15 }; })(),
  },
];
// A family's own yard, its county, and the whole country. `out` is how many wheel steps back from the closest the map goes.
const VIEWS = [
  { id: 'yard', at: 'home', out: 0 },
  { id: 'county', at: 'home', out: 16 },
  // The whole country the Host looks at: the map's own Out button, as scripts/perf-render-measure.mjs presses it for its
  // `whole` view, because four hundred miles is further back than the wheel gets in a reasonable number of steps.
  { id: 'country', at: 'follow', outButton: 15 },
];

const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const record = {
  record: 'weather-browser', label: LABEL, date: new Date().toISOString().slice(0, 10), seed: SEED,
  browser: await browser.version(), viewport: '1366x768 @1x',
  days: DAYS.map(day => ({ id: day.id, why: day.why, live: Boolean(day.live), raised: Boolean(day.raised), on: day.weather && `day ${day.weather.day} (${DATE(day.weather)})`, regions: day.weather?.regions })),
  shots: [], errors: [],
};
mkdirSync(OUT, { recursive: true });
try {
  const game = app.newSoloGame('Weather reader');
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  await installWeatherStub(context);
  const page = await context.newPage();
  page.on('pageerror', error => record.errors.push(error.message));
  await page.goto(url + game.path);
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'running' && window.__snapshot.world.map?.province, null, { timeout: 120000 });
  await meetFamily(page, 'Weatherby', { timeout: 20000 });
  for (const id of ['#journal-close', '#wagon-done', '#tutorial-skip']) if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click().catch(() => {});
  await page.waitForTimeout(4000);
  await page.waitForLoadState('networkidle').catch(() => {});
  // The field really is on the wire: read off the first snapshot the page was sent, before anything is held on it.
  record.served = await page.evaluate(() => {
    const weather = window.__snapshot?.world?.weather;
    return weather ? { bounds: weather.bounds, kinds: Object.fromEntries(Object.entries(weather.regions).map(([name, region]) => [name, `${region.kind} water ${region.water}`])) } : null;
  });
  console.log(`served by the server: ${JSON.stringify(record.served)}\n`);

  const goTo = async view => {
    await page.locator(`#map-nav [data-view="${view.at}"]`).click();
    await page.waitForTimeout(300);
    if (view.outButton) {
      for (let i = 0; i < view.outButton; i++) await page.locator('#map-nav [data-view="out"]').click();
    } else {
      const box = await page.locator('#world-map').boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // In to the closest the map allows, then out the wheel steps this view wants.
      for (let i = 0; i < 24; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(20); }
      for (let i = 0; i < view.out; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(20); }
    }
    await page.waitForTimeout(900);
    await page.waitForLoadState('networkidle').catch(() => {});
  };

  for (const day of DAYS) {
    if (ONLY && !ONLY.includes(day.id)) continue;
    // The simulation's own weather for that day, carried on every snapshot as it is parsed. `live` holds nothing: the
    // page draws whatever the server sent it.
    await holdWeather(page, day.live ? null : { day: day.weather.day, bounds: day.weather.bounds, regions: day.weather.regions }, day.live ? null : day.minute);
    for (const view of VIEWS) {
      await goTo(view);
      // A moment of the animation, so the rain has fallen a little and the picture is a frame of a running game.
      await page.waitForTimeout(1200);
      const seen = await page.evaluate(() => ({
        camera: window.__camera && { scale: Math.round(window.__camera.scale * 10) / 10 },
        weather: window.__weatherDrawn,
        ground: window.__weatherGround,
        // What the page says in words, which must not have become a weather line.
        description: document.querySelector('#world-description')?.textContent || '',
        entities: (window.__viewEntities || []).length,
        houses: Object.keys(window.__housesDrawn || {}).length,
        labels: document.querySelector('#world-map')?.getAttribute('aria-label')?.length || 0,
      }));
      const file = `${OUT}/weather-${day.id}-${view.id}.png`;
      const png = await page.locator('#world-map').evaluate(canvas => canvas.toDataURL('image/png').split(',')[1]);
      writeFileSync(file, Buffer.from(png, 'base64'));
      record.shots.push({ day: day.id, view: view.id, file, ...seen, png });
      console.log(`${day.id.padEnd(12)} ${view.id.padEnd(8)} scale ${String(seen.camera?.scale).padStart(8)} | spans ${seen.weather?.spans ?? '-'} layers ${seen.weather?.layers ?? '-'} fog ${seen.weather?.fog ?? '-'} | rivers up ${seen.ground?.flooded ?? '-'}/${seen.ground?.courses ?? '-'} over their banks ${seen.ground?.over ?? '-'} | ${seen.entities} people, ${seen.houses} houses`);
    }
  }

  // No weather text anywhere, which is the whole point: the page's own spoken description is the one place a weather
  // line would have gone, and it must be the same words on every kind of day.
  record.noWeatherWords = !record.shots.some(shot => /\b(rain|raining|norther|storm|foggy|fog|weather|wind|flood|cold)\b/i.test(shot.description));
  record.descriptionsByDay = [...new Set(record.shots.filter(shot => shot.view === 'yard').map(shot => shot.description.replace(/\d+/g, '#')))];
  console.log(`\nno weather words on the page: ${record.noWeatherWords} (${record.descriptionsByDay.length} distinct descriptions across ${new Set(record.shots.map(s => s.day)).size} days)`);

  // Contact sheets: one per zoom, every day side by side, so the kinds can be told apart at a glance.
  const sheet = await context.newPage();
  record.sheets = [];
  for (const view of VIEWS) {
    const part = record.shots.filter(shot => shot.view === view.id);
    if (!part.length) continue;
    await sheet.setViewportSize({ width: 1400, height: 400 });
    await sheet.setContent(`<body style="margin:0;background:#1b1b1b;color:#eee;font:13px system-ui;display:grid;grid-template-columns:repeat(2,690px);gap:4px;align-content:start">${part.map(shot => `<figure style="margin:0;position:relative"><img style="width:690px;display:block" src="data:image/png;base64,${shot.png}"><figcaption style="position:absolute;left:4px;top:2px;background:#000b;padding:2px 6px">${shot.day} · ${view.id} · scale ${shot.camera?.scale}</figcaption></figure>`).join('')}</body>`);
    const path = `${OUT}/weather-sheet-${view.id}.png`;
    await sheet.screenshot({ path, fullPage: true });
    record.sheets.push(path);
  }
} finally {
  await browser.close();
  await app.close();
}
for (const shot of record.shots) delete shot.png;
mkdirSync('docs/evidence', { recursive: true });
if (!ONLY) writeFileSync('docs/evidence/weather-browser.json', `${JSON.stringify(record, null, 2)}\n`);
console.log(`\nwrote ${record.shots.length} shots to ${OUT}/${record.errors.length ? `\npage errors: ${record.errors.join(' | ')}` : ''}`);

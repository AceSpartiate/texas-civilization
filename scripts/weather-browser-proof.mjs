// The weather, by eye. Owner, 2026-09-20: "Weather should be a visual thing... Players should see the weather. If
// implemented correctly, no text should be required." There is therefore nothing to read on the page that says what the
// day is, and nothing a test can assert about it: the only honest proof is the picture, looked at.
//
// A solo game of the colonies is put into each of the five kinds of day (docs/WEATHER.md §10.1) at three zooms - a
// family's own yard, its county, and the whole country the Host sees - and each is photographed. A sixth day puts three
// different weathers on the map at once, to show the boundaries blending rather than standing as rectangles, and a
// seventh puts the rivers in flood on a fair day, because the water outlasts the rain that raised it.
//
// The weather is injected into the snapshot on the page, not into the world on the server: the simulation side of this is
// being built in parallel and `projectWorld` does not carry `world.weather` yet (docs/WEATHER.md §10.7). The contract is
// the one being built to, and nothing here is a field the server does not own - the page reads what it is given and adds
// nothing. When the simulation lands, `--live` reads the weather the server actually sent instead.
//
// Same computer, headless Chrome.
// Run: node scripts/weather-browser-proof.mjs [--label after] [--live]
//   writes docs/evidence/weather/weather-<day>-<view>.png, contact sheets, and docs/evidence/weather-browser.json
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { meetFamily } from './support/meet-family.mjs';
import { holdWeather, installWeatherStub } from './support/weather-stub.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const LABEL = arg('label', 'after'), LIVE = process.argv.includes('--live');
// `--days norther,fog` photographs only those, for looking at one kind closely while it is being drawn right.
const ONLY = arg('days', null)?.split(',');
const OUT = 'docs/evidence/weather';

const { createClassroom } = await import(new URL('../server/app.mjs', import.meta.url).href);
const { createGonzalesWorld } = await import(new URL('../sim/gonzales.mjs', import.meta.url).href);

// The same seed every other measure and proof uses, so this family stands on the same ground as the perf record's.
const app = createClassroom({ seed: 'perf-render-1', playerCount: 15, tickMs: 1000, solo: true, worldFactory: (seed, n) => createGonzalesWorld('perf-render-1', n, { map: 'colonies', neighbours: true }) });

/**
 * The days photographed. `regions` is the contract the simulation is being built to (docs/WEATHER.md §10):
 * `{ kind, water, wind: { from, force }, since }` for each of west, middle and east.
 *
 * `wind.from` is the bearing the wind comes FROM, clockwise from north in radians, so 0 is a norther. `since` is set well
 * behind the clock so every day is photographed fully up rather than part way through its fade; `arriving` is the one
 * exception, which is there to show that a day does come up rather than flicking on.
 */
const fair = { kind: 'fair', water: 0.1, wind: { from: 0, force: 0 }, since: 0 };
const DAYS = [
  { id: 'fair', why: 'nothing to report: the day the others are read against', regions: { west: fair, middle: fair, east: fair } },
  {
    id: 'rain', why: 'rain falling, the light flat and grey, the ground dark with it, the creeks up',
    regions: Object.fromEntries(['west', 'middle', 'east'].map(r => [r, { kind: 'rain', water: 0.55, wind: { from: 2.6, force: 0.35 }, since: 0 }])),
  },
  {
    id: 'norther', why: 'the record\'s own signature: the wind hard out of the north, the sky clear, the light thin and blue',
    regions: Object.fromEntries(['west', 'middle', 'east'].map(r => [r, { kind: 'norther', water: 0.2, wind: { from: 0, force: 1 }, since: 0 }])),
  },
  {
    id: 'storm', why: 'heavier rain, a dark sky, lightning seen at a distance',
    regions: Object.fromEntries(['west', 'middle', 'east'].map(r => [r, { kind: 'storm', water: 0.85, wind: { from: 0.5, force: 0.8 }, since: 0 }])),
  },
  {
    id: 'fog', why: 'a low veil on the bottoms and the river, and nothing hidden under it', minute: 7 * 60 + 20,
    regions: Object.fromEntries(['west', 'middle', 'east'].map(r => [r, { kind: 'fog', water: 0.3, wind: { from: 0, force: 0.05 }, since: 0 }])),
  },
  {
    id: 'three-regions', why: 'three weathers on one map: storm in the west, rain in the middle, fair in the east - blended, not three rectangles',
    regions: {
      west: { kind: 'storm', water: 0.9, wind: { from: 0.3, force: 0.9 }, since: 0 },
      middle: { kind: 'rain', water: 0.6, wind: { from: 2.4, force: 0.3 }, since: 0 },
      east: fair,
    },
  },
  {
    id: 'high-water', why: 'a fair day after a wet week: the rivers still full and brown and the bottoms dark',
    regions: Object.fromEntries(['west', 'middle', 'east'].map(r => [r, { kind: 'fair', water: 1, wind: { from: 0, force: 0 }, since: 0 }])),
  },
  {
    id: 'arriving', why: 'a norther a quarter of an hour old: it comes up rather than flicking on',
    minute: 9 * 60 + 15,
    regions: Object.fromEntries(['west', 'middle', 'east'].map(r => [r, { kind: 'norther', water: 0.2, wind: { from: 0, force: 1 }, since: 9 * 60 }])),
  },
];
// A family's own yard, its county, and the whole country. `out` is how many wheel steps back from the closest the map goes.
const VIEWS = [
  { id: 'yard', at: 'home', out: 0 },
  { id: 'county', at: 'home', out: 16 },
  { id: 'country', at: 'follow', out: 30 },
];

const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const record = { record: 'weather-browser', label: LABEL, date: new Date().toISOString().slice(0, 10), live: LIVE, browser: await browser.version(), viewport: '1366x768 @1x', shots: [], errors: [] };
mkdirSync(OUT, { recursive: true });
try {
  const game = app.newSoloGame('Weather reader');
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  if (!LIVE) await installWeatherStub(context);
  const page = await context.newPage();
  page.on('pageerror', error => record.errors.push(error.message));
  await page.goto(url + game.path);
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'running' && window.__snapshot.world.map?.province, null, { timeout: 120000 });
  await meetFamily(page, 'Weatherby', { timeout: 20000 });
  for (const id of ['#journal-close', '#wagon-done', '#tutorial-skip']) if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click().catch(() => {});
  await page.waitForTimeout(4000);
  await page.waitForLoadState('networkidle').catch(() => {});

  // The weather is held on the snapshot between the server's own, so the drawing loop draws it. Kept up faster than
  // snapshots arrive, and never a field the page invents for itself: `weather` is the server's, and this stands in for it
  // until the simulation side lands. `--live` leaves the snapshot alone and photographs what the server actually sent.
  // The weather stands in for the one the server will send, on every snapshot as it is parsed
  // (scripts/support/weather-stub.mjs). The contract is the one being built to, and nothing here is a field the page
  // invents: `weather` is the server's, and the page reads it and adds nothing. `--live` photographs what the server
  // actually sent instead, once the simulation side has landed.
  // The three cut lines are read off the map itself, so the regions fall where the country does.
  const bounds = LIVE ? null : await page.evaluate(() => {
    const xs = Object.values(window.__snapshot?.world?.map?.sites || {}).map(site => site.x).filter(Number.isFinite).sort((a, b) => a - b);
    return xs.length > 2 ? { westOf: xs[Math.floor(xs.length / 3)], eastOf: xs[Math.floor(xs.length * 2 / 3)] } : { westOf: 140, eastOf: 260 };
  });
  const hold = async (day, minute) => { if (!LIVE) await holdWeather(page, { day: 1, bounds, regions: day.regions }, minute); };

  const goTo = async view => {
    await page.locator(`#map-nav [data-view="${view.at}"]`).click();
    await page.waitForTimeout(300);
    const box = await page.locator('#world-map').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // In to the closest the map allows, then out the wheel steps this view wants.
    for (let i = 0; i < 24; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(20); }
    for (let i = 0; i < view.out; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(20); }
    await page.waitForTimeout(900);
    await page.waitForLoadState('networkidle').catch(() => {});
  };

  for (const day of DAYS) {
    if (ONLY && !ONLY.includes(day.id)) continue;
    await hold(day, day.minute ?? 13 * 60);
    for (const view of VIEWS) {
      await goTo(view);
      // A moment of the animation, so the rain has fallen a little and the picture is a frame of a running game.
      await page.waitForTimeout(1200);
      // And a frame that actually carried the weather: a snapshot arriving replaces the world object the stand-in was
      // held on, and a frame drawn in the twentieth of a second before it is put back is a picture of a fair day.
      if (day.id !== 'fair') await page.waitForFunction(() => window.__weatherDrawn, null, { timeout: 15000 });
      const seen = await page.evaluate(() => ({
        camera: window.__camera && { scale: Math.round(window.__camera.scale * 10) / 10 },
        weather: window.__weatherDrawn,
        ground: window.__weatherGround,
        // What the page says in words, which must not have become a weather line.
        description: document.querySelector('#world-description')?.textContent || '',
        entities: (window.__viewEntities || []).length,
        houses: Object.keys(window.__housesDrawn || {}).length,
      }));
      const file = `${OUT}/weather-${day.id}-${view.id}.png`;
      const png = await page.locator('#world-map').evaluate(canvas => canvas.toDataURL('image/png').split(',')[1]);
      writeFileSync(file, Buffer.from(png, 'base64'));
      record.shots.push({ day: day.id, why: day.why, view: view.id, file, ...seen, png });
      console.log(`${day.id.padEnd(14)} ${view.id.padEnd(8)} scale ${String(seen.camera?.scale).padStart(8)} | spans ${seen.weather?.spans ?? '-'} layers ${seen.weather?.layers ?? '-'} fog ${seen.weather?.fog ?? '-'} | flooded ${seen.ground?.flooded ?? '-'} of ${seen.ground?.courses ?? '-'} | ${seen.entities} people, ${seen.houses} houses drawn`);
    }
  }

  // No weather text anywhere, which is the whole point: the page's own spoken description is the one place a weather line
  // would have gone, and it must be the same words on every kind of day.
  const words = new Set(record.shots.filter(shot => shot.view === 'yard').map(shot => shot.description.replace(/\d+/g, '#')));
  record.descriptionsByDay = [...words];
  record.noWeatherWords = !record.shots.some(shot => /\b(rain|raining|norther|storm|foggy|fog|weather|wind|flood)\b/i.test(shot.description));
  console.log(`\nno weather words on the page: ${record.noWeatherWords}`);

  // Contact sheets: one per zoom, every day side by side, so the five can be told apart at a glance.
  const sheet = await context.newPage();
  record.sheets = [];
  for (const view of VIEWS) {
    const part = record.shots.filter(shot => shot.view === view.id);
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
console.log(`\nwrote ${record.shots.length} shots to ${OUT}/ and docs/evidence/weather-browser.json${record.errors.length ? `\npage errors: ${record.errors.join(' | ')}` : ''}`);

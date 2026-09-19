// How fast somebody is drawn going to Gonzales, measured from the frames a real browser painted in a Solo game.
//
// Owner, 2026-09-18, playtesting Solo: "when i sent my main character to gonzales on foot he ran inhumanly fast. that
// speed would be fine for a horse". tests/travel-speed.test.mjs holds the simulation's paces in the time of 1835; this
// asks what a student sees. A Solo game on the real land at the Study pace (9.5 s a tick), the family made the way a
// student makes it, the main person sent to Gonzales on foot and then, in a second game, on the family's horse. Every
// painted frame the figure's drawn place (`window.__drawnAt`) and the camera (`window.__camera`) are read, and the walk is
// reported as miles of 1835 an hour, screen pixels a real second, and the figure's own drawn heights a real second - the
// number a person watching reads as "walking" or "running" (a real walker covers about 0.8 of their height a second).
//
// Only the farming day is played here, where a tick is twenty minutes. The other clocks move the same figure the same
// pixels for every mile, so their screen speed is this one times the miles their tick carries (sim/travel.mjs
// `roadTicks`); that arithmetic is in the evidence beside the measurement, not measured again.
//
// Same computer only: headless Chrome, 1280 x 850. Run: node scripts/travel-speed-measure.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom, PACES } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const WRITE = process.env.PROOF_NO_WRITE ? null : 'docs/evidence/travel-speed-screen.json';
const TICKS = 2;

async function measure(mode, view) {
  const dir = mkdtempSync(join(tmpdir(), 'texas-travel-speed-'));
  const app = createClassroom({ seed: 'travel-speed-measure', playerCount: 5, solo: true, tickMs: 60, savePath: join(dir, 'save.json'),
    worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies', neighbours: true }) });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
  const errors = [];
  try {
    const game = await (await fetch(`${url}/api/solo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: app.state.hostKey }) })).json();
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 850 } })).newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(game.playUrl.replace(/^http:\/\/[^/]+/, url));
    await page.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 60000 });
    await meetFamily(page);
    // The family comes in off the road at the quick pace, then the class is slowed to the Study pace a student plays at.
    const main = await page.waitForFunction(() => {
      const world = window.__snapshot?.world, home = world?.household?.homeSiteId;
      const person = world?.entities.find(entity => entity.principal);
      return person && !person.travel && person.location.siteId === home && !world.entities.some(entity => entity.travel) ? person.id : null;
    }, null, { timeout: 120000, polling: 100 }).then(handle => handle.jsonValue());
    app.setPace(PACES.study);
    await page.waitForFunction(pace => window.__snapshot?.tickMs === pace, PACES.study, { timeout: 30000 });
    const sent = await page.evaluate(async ({ id, mode }) => {
      const stop = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `stop-${crypto.randomUUID()}`, action: 'stop-chore', entityId: id }) });
      const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `go-${crypto.randomUUID()}`, action: 'travel', entityId: id, destination: 'gonzales', mode }) });
      return { stop: stop.status, status: response.status, text: await response.text() };
    }, { id: main, mode });
    assert.equal(sent.status, 200, `sending ${main} ${mode}: ${sent.text}`);
    await page.waitForFunction(id => window.__snapshot.world.entities.find(entity => entity.id === id)?.travel?.progress > 0, main, { timeout: 30000 });
    // The default view follows the family and widens to take in the road; pressing the person's portrait (docs/FAMILY_PANEL.md)
    // takes the camera to them and zooms in, which is how a student watches somebody go.
    if (view === 'portrait') { await page.locator(`.panel-portrait[data-portrait="${main}"]`).click(); await page.waitForTimeout(600); }
    // From the next tick's arrival, sample every painted frame for whole ticks.
    const startTick = await page.evaluate(() => window.__snapshot.world.tick);
    await page.waitForFunction(tick => window.__snapshot.world.tick > tick, startTick, { timeout: 30000 });
    const samples = await page.evaluate(({ id, ticks }) => new Promise(resolve => {
      const out = [], first = window.__snapshot.world.tick;
      const step = () => {
        const snap = window.__snapshot, at = window.__drawnAt?.[id], camera = window.__camera, canvas = document.querySelector('#world-map');
        const me = snap.world.entities.find(entity => entity.id === id);
        if (at && camera?.scale) out.push({ t: performance.now(), tick: snap.world.tick, minute: snap.world.minute, x: at.x, y: at.y, size: at.size, scale: camera.scale, cx: camera.cx, cy: camera.cy, w: canvas.width, h: canvas.height,
          server: me?.travel?.progress ?? null, distance: me?.travel?.distance ?? null, speed: me?.travel?.speed ?? null, step: me?.travel?.step ?? null, mode: me?.travel?.mode ?? null, dpr: window.devicePixelRatio });
        if (snap.world.tick >= first + ticks || !me?.travel) resolve(out); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { id: main, ticks: TICKS });
    return { mode, view, main, samples, errors };
  } finally {
    await browser.close();
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function analyse({ mode, view, main, samples }) {
  assert.ok(samples.length > 20, `${mode}: only ${samples.length} frames painted`);
  const first = samples[0], last = samples.at(-1), seconds = (last.t - first.t) / 1000;
  // Where the figure was drawn, in miles of the map: the camera moves with the family, so screen pixels alone would count
  // the camera's own glide. Converted back through the camera of the same frame.
  const world = s => ({ x: s.cx + (s.x - s.w / 2) / s.scale, y: s.cy + (s.y + s.size * .45 - s.h / 2) / s.scale });
  let miles = 0;
  for (let i = 1; i < samples.length; i++) { const a = world(samples[i - 1]), b = world(samples[i]); miles += Math.hypot(b.x - a.x, b.y - a.y); }
  const scale = samples.reduce((sum, s) => sum + s.scale, 0) / samples.length, size = samples.reduce((sum, s) => sum + s.size, 0) / samples.length;
  const milesPerSecond = miles / seconds, minutesATick = (last.minute - first.minute) / Math.max(1, last.tick - first.tick);
  return {
    mode, view, person: main, frames: samples.length, realSeconds: +seconds.toFixed(2), ticks: last.tick - first.tick, minutesATick,
    drawnMiles: +miles.toFixed(3), serverSpeedMilesATick: first.speed, projectedStep: first.step,
    milesOf1835AnHour: +(milesPerSecond * (PACES.study / 1000) * (60 / minutesATick)).toFixed(2),
    canvasPixelsPerMile: +scale.toFixed(1), figureCanvasPixels: +size.toFixed(1), figureMilesTall: +(size / scale).toFixed(4),
    canvasPixelsPerSecond: +(milesPerSecond * scale).toFixed(1), figureHeightsPerSecond: +(milesPerSecond * scale / size).toFixed(2),
  };
}

const runs = [];
for (const view of ['follow', 'portrait']) for (const mode of ['foot', 'horse']) runs.push(await measure(mode, view));
assert.deepEqual(runs.flatMap(run => run.errors), [], 'the page raised errors');
const measured = runs.map(analyse);
console.log(JSON.stringify(measured, null, 2));
if (WRITE) {
  writeFileSync(WRITE, JSON.stringify({
    record: 'travel-speed-screen',
    date: new Date().toISOString().slice(0, 10),
    ownerDirection: '"when i sent my main character to gonzales on foot he ran inhumanly fast. that speed would be fine for a horse, i could even buy it for a wagon (not quite)." and "is solo mode set to the normal speed? it seemed super fast."',
    how: 'node scripts/travel-speed-measure.mjs: a Solo game on the real land at the Study pace (9500 ms a tick), the family made as a student makes it, the main person sent to Gonzales on foot and, in a second game, on the horse; every painted frame read from window.__drawnAt and window.__camera. Headless Chrome 1280x850 on this computer. figureHeightsPerSecond is what reads as walking or running: a real walker covers about 0.8 of their own height a second, a sprinter about 5.',
    measured,
    limitations: ['Same computer, headless Chrome: frame timing is the headless browser\'s. Nothing here is a classroom projector or a Chromebook.', 'The farming day only (twenty-minute ticks). The other clocks are this measurement times the miles their tick carries, in docs/evidence/travel-speed.json.'],
  }, null, 2) + '\n');
  console.log(`wrote ${WRITE}`);
}

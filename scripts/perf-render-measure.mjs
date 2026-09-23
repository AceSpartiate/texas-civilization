// What a running game costs the browser to draw (docs/PERFORMANCE_RENDER.md): the animation frame loop, `render(snapshot)`
// on every snapshot, the DOM it creates, the heap and the long tasks - on a solo game of the colonies, with the CPU
// throttled through the DevTools protocol to stand in for a school Chromebook.
//
// Same computer only. A throttled desktop CPU is not a Chromebook: its GPU, memory and thermal limits are not modelled, so
// these numbers compare one build with another on this machine and are never a claim that a Chromebook runs the game.
//
// Views, each measured for PHASE_S seconds: `default` (the camera following the family), `land` (the family's own homestead
// close up), `town` (Gonzales, the town drawn from its layout) and `whole` (zoomed all the way out to the colonies).
//
// Run: node scripts/perf-render-measure.mjs [--label before] [--rate 6] [--phase 30] [--tick 1000]
//   writes docs/evidence/perf-render-<label>.json and prints a table row per view.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { meetFamily } from './support/meet-family.mjs';
import { holdWeather, installWeatherStub, stubWeather } from './support/weather-stub.mjs';

// `--root <dir>` measures another copy of the game (an export of an earlier commit) with this script, for a before and after.
const rootArg = process.argv.indexOf('--root');
const root = rootArg > 0 ? pathToFileURL(`${resolve(process.argv[rootArg + 1])}/`).href : new URL('../', import.meta.url).href;
const { createClassroom } = await import(new URL('server/app.mjs', root).href);
const { createGonzalesWorld } = await import(new URL('sim/gonzales.mjs', root).href);

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const LABEL = arg('label', 'run'), RATE = Number(arg('rate', 6)), PHASE_S = Number(arg('phase', 30)), TICK_MS = Number(arg('tick', 1000));
const VIEWS = (arg('views', 'default,land,town,whole')).split(',');
// `--weather rain|norther|storm|fog`, or three of them as `storm/rain/fair`, measures a day of that weather (public/weather-art.js, docs/WEATHER.md): the weather
// is held on the snapshot the way scripts/weather-browser-proof.mjs holds it, because the simulation side of it is being
// built in parallel and `projectWorld` does not carry `world.weather` yet. Without the flag the day is fair, which is what
// a build from before the weather is compared against. A build that does not draw weather simply ignores the field.
const WEATHER = arg('weather', null);

// Installed before any page script: counts what the page does without touching the game's own code.
const INSTRUMENT = () => {
  const perf = window.__perf = { raf: 0, rafMs: [], snapshots: 0, snapshotMs: [], longTasks: [], created: 0, inserted: 0 };
  const rawRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = callback => rawRaf(now => {
    const began = performance.now();
    try { callback(now); } finally { perf.raf++; perf.rafMs.push(performance.now() - began); }
  });
  // `render(snapshot)` runs inside the EventSource message handler, so timing the handler times it (JSON.parse included).
  const describe = Object.getOwnPropertyDescriptor(EventSource.prototype, 'onmessage');
  Object.defineProperty(EventSource.prototype, 'onmessage', {
    configurable: true, get() { return describe.get.call(this); },
    set(handler) {
      describe.set.call(this, handler && (event => {
        const began = performance.now();
        try { return handler.call(this, event); } finally { perf.snapshots++; perf.snapshotMs.push(performance.now() - began); }
      }));
    },
  });
  const rawCreate = Document.prototype.createElement;
  perf.creators = {};
  Document.prototype.createElement = function (...args) {
    perf.created++;
    // Who creates elements, by the nearest page function on the stack, so a rebuild on every snapshot can be found.
    const frames = (new Error().stack || '').split(/\r?\n/).slice(2).filter(line => /\.js/.test(line)).slice(0, 3);
    const where = frames.map(frame => frame.trim().replace(/^at /, '').replace(/\(?https?:\/\/[^/]+\//, '').replace(/\)$/, '')).join(' < ') || '?';
    perf.creators[where] = (perf.creators[where] || 0) + 1;
    return rawCreate.apply(this, args);
  };
  new MutationObserver(records => { for (const r of records) perf.inserted += r.addedNodes.length; })
    .observe(document, { childList: true, subtree: true });
  try { new PerformanceObserver(list => { for (const e of list.getEntries()) perf.longTasks.push(e.duration); }).observe({ type: 'longtask', buffered: true }); } catch { /* not offered */ }
};

// Every solo game is dealt on the same seed, so a before and an after measure the same family on the same ground.
const app = createClassroom({ seed: 'perf-render-1', playerCount: 15, tickMs: TICK_MS, solo: true, worldFactory: (seed, n) => createGonzalesWorld('perf-render-1', n, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const result = { record: 'perf-render', label: LABEL, date: new Date().toISOString().slice(0, 10), browser: await browser.version(), cpuThrottle: RATE, phaseSeconds: PHASE_S, tickMs: TICK_MS, viewport: '1366x768 @1x', views: {} };
const errors = [];
try {
  const game = app.newSoloGame('Perf reader');
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  await context.addInitScript(INSTRUMENT);
  if (WEATHER) await installWeatherStub(context);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const loadStarted = Date.now();
  await page.goto(url + game.path);
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'running' && window.__snapshot.world.map?.province, null, { timeout: 180000 });
  result.loadToRunningMs = Date.now() - loadStarted;
  // The last name and How We Look, where the build asks for them (a build before 2026-09-17 does not).
  await meetFamily(page, 'Measure', { timeout: 20000 });
  for (const id of ['#journal-close', '#wagon-done', '#tutorial-skip']) if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click().catch(() => {});
  // The whole country in one weather, its rivers well up: the worst a day can cost. Carried on every snapshot
  // (scripts/support/weather-stub.mjs), so the kept ground sees one steady day rather than one flickering on and off.
  if (WEATHER) await holdWeather(page, stubWeather(WEATHER), WEATHER.includes('fog') ? 7 * 60 + 20 : null);
  result.weather = WEATHER;
  await page.waitForTimeout(3000);

  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const press = async view => page.locator(`#map-nav [data-view="${view}"]`).click({ timeout: 20000 });
  for (const view of VIEWS) {
    if (view === 'default') await press('follow');
    if (view === 'land') await press('home');
    if (view === 'town') await press('gonzales');
    if (view === 'whole') { await press('follow'); for (let i = 0; i < 14; i++) await press('out'); }
    // Somebody on the road, watched close up: the main person walks to Gonzales and home again for the whole phase, and their
    // portrait is pressed, which is how a student watches somebody go (docs/FAMILY_PANEL.md). Added 2026-09-19 with the
    // schedule a fast traveller is drawn on (public/motion.js `travelSight`), which walks, fades and crosses out of sight.
    if (view === 'traveller') {
      await press('follow');
      const main = await page.evaluate(() => {
        const world = window.__snapshot.world, id = world.household?.principalId || world.entities.find(entity => entity.principal)?.id;
        const command = body => fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${body.action}-${crypto.randomUUID()}`, entityId: id, ...body }) });
        const send = async to => { await command({ action: 'stop-chore' }); await command({ action: 'travel', destination: to, mode: 'foot' }); };
        // Back and forth: whenever they are standing somewhere, off to the other end.
        clearInterval(window.__perfTraveller);
        window.__perfTraveller = setInterval(() => {
          const me = window.__snapshot.world.entities.find(entity => entity.id === id);
          if (me && !me.travel) send(me.location?.siteId === 'gonzales' ? world.household.homeSiteId : 'gonzales');
        }, 700);
        return id;
      });
      await page.waitForFunction(id => window.__snapshot.world.entities.find(entity => entity.id === id)?.travel, main, { timeout: 30000 });
      await page.locator(`.panel-portrait[data-portrait="${main}"]`).click();
    }
    await page.waitForTimeout(2000);
    await page.evaluate(() => { const p = window.__perf; Object.assign(p, { raf: 0, rafMs: [], snapshots: 0, snapshotMs: [], longTasks: [], created: 0, inserted: 0, creators: {} }); p.groundBefore = window.__groundDrawn || 0; window.__groundWhy = {}; });
    const before = await metrics();
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
    await cdp.send('Profiler.start');
    const heap = [];
    const started = Date.now();
    while (Date.now() - started < PHASE_S * 1000) { await page.waitForTimeout(3000); heap.push(Math.round((await metrics()).JSHeapUsedSize / 1e5) / 10); }
    const { profile } = await cdp.send('Profiler.stop');
    const after = await metrics();
    const seconds = (Date.now() - started) / 1000;
    const perf = await page.evaluate(() => ({ ...window.__perf, camera: window.__camera, drawMs: window.__animation?.drawMs, groundDrawn: window.__groundDrawn === undefined ? null : window.__groundDrawn - window.__perf.groundBefore, groundWhy: window.__groundWhy || null }));
    // Self time by function, from the sampled profile.
    const self = new Map(), byId = new Map(profile.nodes.map(n => [n.id, n]));
    const deltas = profile.timeDeltas; let total = 0;
    profile.samples.forEach((id, i) => {
      const node = byId.get(id), f = node.callFrame, ms = (deltas[i + 1] ?? deltas[i] ?? 0) / 1000;
      const name = `${f.functionName || '(anonymous)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`;
      self.set(name, (self.get(name) || 0) + ms); total += ms;
    });
    const top = [...self.entries()].filter(([name]) => !/^\((idle|program)\)/.test(name)).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, ms]) => ({ name, ms: Math.round(ms), perSecond: Math.round(ms / seconds * 10) / 10 }));
    const sum = list => list.reduce((s, v) => s + v, 0), avg = list => list.length ? sum(list) / list.length : 0;
    const pct = (list, q) => { if (!list.length) return 0; const s = [...list].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
    const r = v => Math.round(v * 10) / 10;
    // Frames that painted the map: the loop runs every display frame but draws at most twelve a second.
    const painted = perf.rafMs.filter(ms => ms > 1);
    result.views[view] = {
      scale: perf.camera && r(perf.camera.scale),
      rafPerSecond: r(perf.raf / seconds),
      paintedFramesPerSecond: r(painted.length / seconds),
      msPerPaintedFrame: { mean: r(avg(painted)), p95: r(pct(painted, .95)) },
      snapshots: perf.snapshots,
      // How many times the ground under the people was drawn (null for a build that drew it on every frame).
      groundDrawnPerSecond: perf.groundDrawn === null ? null : r(perf.groundDrawn / seconds),
      // What made the ground be drawn again, by the part of its key that moved (public/app.js `GROUND_KEY_PARTS`).
      groundDrawnBecause: perf.groundWhy,
      msPerSnapshot: { mean: r(avg(perf.snapshotMs)), p95: r(pct(perf.snapshotMs, .95)), max: r(Math.max(0, ...perf.snapshotMs)) },
      longTasksPerMinute: r(perf.longTasks.length / seconds * 60),
      longTaskMsPerMinute: Math.round(sum(perf.longTasks) / seconds * 60),
      mainThreadBusyPercent: r((after.TaskDuration - before.TaskDuration) / seconds * 100),
      scriptPercent: r((after.ScriptDuration - before.ScriptDuration) / seconds * 100),
      layoutPlusStylePercent: r(((after.LayoutDuration - before.LayoutDuration) + (after.RecalcStyleDuration - before.RecalcStyleDuration)) / seconds * 100),
      layoutsPerSecond: r((after.LayoutCount - before.LayoutCount) / seconds),
      elementsCreatedPerMinute: Math.round(perf.created / seconds * 60),
      nodesInsertedPerMinute: Math.round(perf.inserted / seconds * 60),
      domNodes: { before: before.Nodes, after: after.Nodes },
      heapMB: heap,
      profiledMs: Math.round(total),
      topSelfTime: top,
      topElementCreators: Object.entries(perf.creators).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([at, count]) => ({ at, perMinute: Math.round(count / seconds * 60) })),
    };
    const v = result.views[view];
    console.log(`${LABEL} ${view.padEnd(8)} scale ${String(v.scale).padStart(7)} | fps ${String(v.paintedFramesPerSecond).padStart(4)} | frame ${v.msPerPaintedFrame.mean}/${v.msPerPaintedFrame.p95} ms | snapshot ${v.msPerSnapshot.mean}/${v.msPerSnapshot.p95} ms (${v.snapshots}) | ground ${v.groundDrawnPerSecond ?? 'every frame'}/s | long ${v.longTasksPerMinute}/min | busy ${v.mainThreadBusyPercent}% | els ${v.elementsCreatedPerMinute}/min | heap ${heap[0]}->${heap.at(-1)} MB`);
    for (const t of top.slice(0, 8)) console.log(`    ${String(t.perSecond).padStart(6)} ms/s  ${t.name}`);
    for (const c of v.topElementCreators.slice(0, 4)) console.log(`    ${String(c.perMinute).padStart(6)} els/min  ${c.at}`);
  }
  result.pageErrors = errors;
} finally {
  await browser.close();
  await app.close();
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync(`docs/evidence/perf-render-${LABEL}.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(`wrote docs/evidence/perf-render-${LABEL}.json`);

// What drawing the ground costs when the camera moves, zoomed out (docs/PERFORMANCE_RENDER.md, docs/MAP_ACCURACY.md §8).
//
// scripts/perf-render-measure.mjs measures a game standing still, where the kept ground is laid down and never drawn again.
// This measures the frame that draws it again: the Host's map of a real-land class, CPU throttled through the DevTools
// protocol, zoomed a step in and a step out with the + and - keys again and again, and the painted frame after each step
// timed, with where the time went. Views: `out` (zoomed all the way out, whatever the build allows), `box` (4.25 over the
// middle of the box, the old build's `out`), `colonies` (5.95 over Gonzales) and `county` (44.97 over Gonzales).
//
// Same computer only. A throttled desktop CPU is not a Chromebook; these numbers compare one build with another here.
//
//   node scripts/perf-ground-measure.mjs [--root <dir>] [--label before] [--rate 6] [--steps 16]
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const rootArg = process.argv.indexOf('--root');
const root = rootArg > 0 ? pathToFileURL(`${resolve(process.argv[rootArg + 1])}/`).href : new URL('../', import.meta.url).href;
const { createClassroom } = await import(new URL('server/app.mjs', root).href);
const { createWorld } = await import(new URL('sim/world.mjs', root).href);
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const LABEL = arg('label', 'run'), RATE = Number(arg('rate', 6)), STEPS = Number(arg('steps', 16));

const INSTRUMENT = () => {
  const perf = window.__perf = { frames: [] };
  const rawRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = callback => rawRaf(now => {
    const began = performance.now();
    try { callback(now); } finally { perf.frames.push({ at: began, ms: performance.now() - began, ground: window.__groundDrawn || 0 }); }
  });
};

const app = createClassroom({ seed: 'perf-ground-1', playerCount: 8, worldFactory: (seed, n) => createWorld('perf-ground-1', n, { map: 'colonies' }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const result = { record: 'perf-ground', label: LABEL, date: new Date().toISOString().slice(0, 10), browser: await browser.version(), cpuThrottle: RATE, viewport: '1280x800 @1x', steps: STEPS, sameComputerOnly: true, views: {} };
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await context.addInitScript(INSTRUMENT);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/host#${app.state.hostKey}`);
  await page.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__camera && window.__landDrawn, null, { timeout: 120000 });
  for (const id of ['#host-class', '#rumor-mill']) if (await page.locator(`${id}[open] > summary`).count()) await page.locator(`${id} > summary`).click();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const box = await page.locator('#world-map').boundingBox(), centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const camera = () => page.evaluate(() => ({ ...window.__camera, width: document.querySelector('#world-map').width }));
  const gonzales = await page.evaluate(() => window.__snapshot.world.map?.sites?.gonzales || null) || await page.evaluate(async () => (await (await fetch('/api/map')).json()).map.sites.gonzales);
  async function zoomTo(scale) {
    for (let guard = 0; guard < 80; guard++) {
      const now = await camera();
      if (scale && Math.abs(Math.log(now.scale / scale)) < Math.log(1.15) / 2) return;
      await page.mouse.move(centre.x, centre.y);
      await page.mouse.wheel(0, !scale || now.scale > scale ? 240 : -120);
      await page.waitForTimeout(20);
      if ((await camera()).scale === now.scale) return;
    }
  }
  async function centreOn(target) {
    for (let guard = 0; guard < 30; guard++) {
      const now = await camera();
      const dx = (target.x - now.cx) * now.scale, dy = (target.y - now.cy) * now.scale;
      if (Math.hypot(dx, dy) < 3) return;
      const step = Math.min(1, 250 / Math.hypot(dx, dy));
      await page.mouse.move(centre.x, centre.y); await page.mouse.down();
      await page.mouse.move(centre.x - dx * step, centre.y - dy * step, { steps: 6 }); await page.mouse.up();
      await page.waitForTimeout(40);
      const moved = await camera();
      if (Math.abs(moved.cx - now.cx) < 1e-6 && Math.abs(moved.cy - now.cy) < 1e-6) return;
    }
  }
  // `box`: 4.25 pixels a mile over the middle of the box, as far out as a build before 2026-09-18 could go, so its `out` and
  // this are the same view. Every view but `out` is reached from 4.25 by the + key, which zooms by exactly 1.4 in any build
  // (the whole map's own limit, 3.035, is 4.25 / 1.4), so the builds are measured at the same scales: 4.25, 5.95 and 44.97.
  const middle = { x: (-92.14 + 209.15) / 2, y: (-172.81 + 102.69) / 2 };
  const press = async key => { await page.locator('#world-map').focus(); await page.keyboard.press(key); await page.waitForTimeout(120); };
  for (const [view, steps, where] of [['out', null, null], ['box', 0, middle], ['colonies', 1, gonzales], ['county', 7, gonzales]]) {
    await zoomTo(null);
    if (steps !== null) {
      while ((await camera()).scale * 1.4 < 4.3) await press('+');
      await centreOn(where);
      for (let i = 0; i < steps; i++) { await press('+'); await centreOn(where); }
    }
    await page.locator('#world-map').focus();
    // Everything the view needs is fetched and smoothed before the timing starts: two passes of the same steps.
    for (let i = 0; i < 4; i++) { await page.keyboard.press(i % 2 ? '-' : '+'); await page.waitForTimeout(400); }
    await page.waitForTimeout(4000);
    const times = [];
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start');
    for (let i = 0; i < STEPS; i++) {
      const mark = await page.evaluate(() => performance.now());
      await page.keyboard.press(i % 2 ? '-' : '+');
      await page.waitForTimeout(700);
      // The frame that drew the ground again after the step: the one whose count moved.
      const frame = await page.evaluate(since => { const frames = window.__perf.frames.filter(f => f.at >= since); let before = frames[0]?.ground ?? 0; for (const f of frames) { if (f.ground > before) return f.ms; before = f.ground; } return null; }, mark);
      if (frame !== null) times.push(frame);
    }
    if (!times.length) throw new Error(`${view}: the ground was never drawn again`);
    // Self time by function over the steps, from the sampled profile: where the drawing goes.
    const { profile } = await cdp.send('Profiler.stop');
    const self = new Map(), byId = new Map(profile.nodes.map(n => [n.id, n]));
    profile.samples.forEach((id, i) => { const f = byId.get(id).callFrame, name = `${f.functionName || '(anonymous)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`; self.set(name, (self.get(name) || 0) + (profile.timeDeltas[i + 1] ?? 0) / 1000); });
    const top = [...self].filter(([name]) => !/^\((idle|program)\)/.test(name)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, ms]) => ({ name, msPerStep: +(ms / STEPS).toFixed(1) }));
    const sorted = [...times].sort((a, b) => a - b), pct = q => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
    const now = await camera();
    result.views[view] = { scale: +now.scale.toFixed(2), redrawn: times.length, groundFrameMs: { median: +pct(0.5).toFixed(1), p90: +pct(0.9).toFixed(1), max: +sorted.at(-1).toFixed(1) }, topSelfTime: top };
    console.log(`${LABEL} ${view.padEnd(9)} scale ${String(result.views[view].scale).padStart(6)} | ground frame median ${result.views[view].groundFrameMs.median} ms, p90 ${result.views[view].groundFrameMs.p90} ms (${times.length} of ${STEPS})`);
    for (const t of top.slice(0, 5)) console.log(`    ${String(t.msPerStep).padStart(6)} ms a step  ${t.name}`);
  }
  result.heapMB = +((await cdp.send('Runtime.getHeapUsage')).usedSize / 1e6).toFixed(1);
  result.pageErrors = errors;
} finally { await browser.close(); await app.close(); }
mkdirSync('docs/evidence', { recursive: true });
writeFileSync(`docs/evidence/perf-ground-${LABEL}.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(`wrote docs/evidence/perf-ground-${LABEL}.json; heap ${result.heapMB} MB`);

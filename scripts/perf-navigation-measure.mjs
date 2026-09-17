// How navigating the map feels on a slow computer: owner, 2026-09-17 ("exceptionally laggy ... a lot of problems with being
// able to navigate. This was on my school laptop"). A measurement, not a pass/fail proof - scripts/navigation-browser-proof.mjs
// is the proof. The numbers in docs/PERFORMANCE_NAVIGATION.md come from here; every gesture is described in
// scripts/support/navigation.mjs.
//
// Headless Chrome on this computer with the CPU throttled six times, not a Chromebook, a touchpad or a touchscreen. The
// timings move with whatever else this computer is doing, so each run is repeated and the median of the runs reported.
//
// Run: node scripts/perf-navigation-measure.mjs [label] [runs]   (writes test-results/perf-navigation-<label>.json)
// Env: CPU_THROTTLE (default 6), NAV_TICK_MS (default 1000: a snapshot every second, the Quick pace, the hardest case)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { runNavigation } from './support/navigation.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const label = process.argv[2] || 'run';
const runs = Number(process.argv[3] || 1);
const rate = Number(process.env.CPU_THROTTLE || 6);
const tickMs = Number(process.env.NAV_TICK_MS || 1000);

const app = createClassroom({ seed: 'perf-nav-1', playerCount: 5, tickMs, solo: true, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1');
app.url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });

// The median, run by run, of every number in the gesture records.
function medianOf(records) {
  const out = {};
  for (const key of Object.keys(records[0] || {})) {
    const values = records.map(record => record[key]);
    if (values.every(v => typeof v === 'number')) { const sorted = [...values].sort((a, b) => a - b); out[key] = sorted[Math.floor(sorted.length / 2)]; }
    else if (values.every(v => v && typeof v === 'object')) out[key] = medianOf(values);
    else out[key] = values.length === 1 ? values[0] : values;
  }
  return out;
}

try {
  const results = [];
  for (let run = 1; run <= runs; run++) {
    console.log(`\n-- run ${run} of ${runs}`);
    results.push(await runNavigation({ browser, app, rate, tickMs }));
  }
  const names = Object.keys(results[0].gestures);
  const summary = Object.fromEntries(names.map(name => [name, medianOf(results.map(result => result.gestures[name]).filter(Boolean))]));
  mkdirSync('test-results', { recursive: true });
  writeFileSync(`test-results/perf-navigation-${label}.json`, `${JSON.stringify({
    label, date: new Date().toISOString().slice(0, 10), browser: await browser.version(), cpuThrottle: rate, tickMs, runs, summary,
    each: results.map(result => result.gestures), errors: results.flatMap(result => result.errors),
  }, null, 2)}\n`);
  console.log(`\n-- median of ${runs}`);
  for (const [name, value] of Object.entries(summary)) console.log(name.padEnd(30), JSON.stringify(value));
  console.log(`\nwrote test-results/perf-navigation-${label}.json`);
} finally {
  await browser.close();
  await app.close();
}

// How long a weak computer takes to open the game: docs/PERFORMANCE_LOAD.md.
//
// Starts a Play Solo server in its own process (as server/main.mjs --solo: the real land of the colonies, automatic
// neighbours, the study pace - but every game on one fixed seed, `--seed`), deals a solo game the way `npm run solo`
// does, and opens it in Chrome with a Chromebook's handicaps put on through the DevTools protocol: the CPU
// slowed six times and, for the classroom profile, a school Wi-Fi (20 Mbps down, 5 up, 40 ms). It opens the page twice -
// cold (nothing cached) and warm (a reload) - and records what came over the wire file by file, when the map was first
// drawn with its real geography, the main thread's long tasks, and where the main thread's time went (script compile,
// image decode, layout) from a Chrome trace.
//
// Same computer only. A throttled desktop is not a Chromebook: the CPU slowdown is uniform, the GPU and memory are not
// emulated, and in solo the server shares this machine's unthrottled CPU rather than the laptop's. No acceptance on real
// Chromebooks is claimed by any number this prints.
//
// Run: node scripts/perf-load-measure.mjs [--label name] [--profile solo|classroom|both] [--cpu 6]
// Needs PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE like the browser proofs. Writes docs/evidence/perf-load-<label>.json.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const arg = (name, fallback) => { const at = process.argv.indexOf(`--${name}`); return at > 0 ? process.argv[at + 1] : fallback; };
if (process.argv.includes('--serve')) {
  // The child: a Play Solo classroom at the study pace on the colonies, with automatic neighbours, as server/main.mjs deals.
  const { createClassroom, PACES } = await import('../server/app.mjs');
  const { createGonzalesWorld } = await import('../sim/gonzales.mjs');
  const fixed = arg('seed', 'perf-load-1');
  const app = createClassroom({ seed: fixed, playerCount: 15, tickMs: PACES.study, solo: true, worldFactory: (_random, playerCount) => createGonzalesWorld(fixed, playerCount, { map: 'colonies', neighbours: true }) });
  await app.listen(Number(arg('serve')), '127.0.0.1');
  console.log(`HOST_KEY=${app.state.hostKey}`);
  await new Promise(() => {});
}
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const label = arg('label', 'run');
const cpu = Number(arg('cpu', 6));
const profileArg = arg('profile', 'both');
const PROFILES = {
  // Play Solo: the page and the server on the same laptop, over loopback.
  solo: null,
  // A Chromebook on the school Wi-Fi reaching the teacher's laptop.
  classroom: { offline: false, latency: 40, downloadThroughput: 20e6 / 8, uploadThroughput: 5e6 / 8 },
};
const profiles = profileArg === 'both' ? ['solo', 'classroom'] : [profileArg];

const freePort = () => new Promise(resolve => { const probe = createServer().listen(0, '127.0.0.1', () => { const { port } = probe.address(); probe.close(() => resolve(port)); }); });
const TRACE_NAMES = ['v8.compile', 'v8.compileModule', 'v8.parseOnBackground', 'v8.evaluateModule', 'EvaluateScript', 'Decode Image', 'ImageDecodeTask', 'Decode LazyPixelRef',
  'ParseHTML', 'ParseAuthorStyleSheet', 'UpdateLayoutTree', 'Layout', 'Paint', 'MajorGC', 'MinorGC', 'V8.GC_SCAVENGER', 'FunctionCall', 'FireAnimationFrame', 'TimerFire', 'EventDispatch', 'RunTask', 'ResourceReceivedData'];

function summariseTrace(buffer) {
  const events = JSON.parse(buffer.toString('utf8')).traceEvents || [];
  // The renderer's main thread: the thread that ran ParseHTML.
  const main = events.find(e => e.name === 'ParseHTML' || e.name === 'CrRendererMain');
  const mainThread = events.find(e => e.name === 'ThreadName' && e.args?.data?.threadName === 'CrRendererMain') || main;
  const byName = {};
  for (const e of events) {
    if (!TRACE_NAMES.includes(e.name) || !(e.dur >= 0) || (e.ph !== 'X' && e.ph !== 'B')) continue;
    const onMain = mainThread && e.pid === mainThread.pid && e.tid === mainThread.tid;
    const key = `${e.name}${onMain ? '' : ' (other threads)'}`;
    byName[key] ??= { ms: 0, count: 0 };
    byName[key].ms += e.dur / 1000; byName[key].count++;
  }
  for (const v of Object.values(byName)) v.ms = Math.round(v.ms);
  return byName;
}

async function openOnce(context, cdp, page, target, { trace, browser }) {
  const requests = new Map();
  const onResponse = ({ requestId, response, type }) => {
    const headers = Object.fromEntries(Object.entries(response.headers).map(([k, v]) => [k.toLowerCase(), v]));
    requests.set(requestId, { url: new URL(response.url).pathname, type, status: response.status, fromCache: Boolean(response.fromDiskCache || response.fromMemoryCache), encoding: headers['content-encoding'] || '', cacheControl: headers['cache-control'] || '', wire: 0 });
  };
  const onFinished = ({ requestId, encodedDataLength }) => { const r = requests.get(requestId); if (r) { r.wire = encodedDataLength; r.done = true; } };
  cdp.on('Network.responseReceived', onResponse); cdp.on('Network.loadingFinished', onFinished);
  if (trace) await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'blink'] });
  const started = Date.now();
  await (target === 'reload' ? page.reload({ waitUntil: 'commit' }) : page.goto(target, { waitUntil: 'commit' }));
  // The map is drawn with its real geography once the page holds a snapshot whose map has sites, and a frame has passed.
  await page.waitForFunction(() => window.__load.mapDrawn, null, { timeout: 180000, polling: 100 });
  // Then wait for the art the first view asked for: no request in flight for 3 s (capped at 90 s).
  let quietSince = Date.now();
  while (Date.now() - started < 90000) {
    // And never less than 15 s, so art a later tick asks for (the next snapshot comes after 9.5 s) is counted.
    if (Date.now() - started < 15000) { quietSince = Date.now(); await new Promise(r => setTimeout(r, 200)); continue; }
    const inflight = [...requests.values()].some(r => !r.done && !r.url.startsWith('/api/events'));
    if (inflight) quietSince = Date.now();
    if (Date.now() - quietSince > 3000) break;
    await new Promise(r => setTimeout(r, 200));
  }
  const load = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const images = performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img' || r.name.includes('/assets/'));
    return { ...window.__load, domContentLoaded: nav?.domContentLoadedEventEnd, loadEvent: nav?.loadEventEnd, lastAsset: Math.max(0, ...images.map(r => r.responseEnd)), decodedBytes: performance.getEntriesByType('resource').filter(r => !r.name.includes('/api/events')).reduce((s, r) => s + r.decodedBodySize, 0) + (nav?.decodedBodySize || 0) };
  });
  const traced = trace ? summariseTrace(await browser.stopTracing()) : null;
  cdp.off('Network.responseReceived', onResponse); cdp.off('Network.loadingFinished', onFinished);
  const list = [...requests.values()].filter(r => !r.url.startsWith('/api/events'));
  // Responsive: the first moment after the map is drawn followed by 2 s with no long task (a TTI-like quiet window).
  const tasks = load.longTasks.sort((a, b) => a.start - b.start);
  let responsive = load.mapDrawn;
  for (const t of tasks) { if (t.start + t.duration < responsive) continue; if (t.start < responsive + 2000) responsive = t.start + t.duration; else break; }
  const untilMap = tasks.filter(t => t.start < load.mapDrawn);
  return {
    requests: list.length,
    wireBytes: list.reduce((s, r) => s + r.wire, 0),
    decodedBytes: load.decodedBytes,
    notModified: list.filter(r => r.status === 304).length,
    domContentLoadedMs: Math.round(load.domContentLoaded), mapDrawnMs: Math.round(load.mapDrawn), responsiveMs: Math.round(responsive), lastAssetMs: Math.round(load.lastAsset),
    longTasks: tasks.length, longTaskMs: Math.round(tasks.reduce((s, t) => s + t.duration, 0)), blockingMsBeforeMap: Math.round(untilMap.reduce((s, t) => s + Math.max(0, t.duration - 50), 0)),
    longestTaskMs: Math.round(Math.max(0, ...tasks.map(t => t.duration))),
    files: list.sort((a, b) => b.wire - a.wire).map(({ url, type, status, fromCache, encoding, cacheControl, wire }) => ({ url, type, status, fromCache, encoding, cacheControl, wire })),
    trace: traced,
  };
}

const seed = arg('seed', 'perf-load-1');
const port = await freePort();
// The server runs in its own process, as Play Solo's does. It is the solo server of server/main.mjs with one difference:
// a solo game is dealt on a random seed, and where the family starts decides which sheets the first view draws, so this
// one deals every game on the same seed to make two runs comparable.
const server = spawn(process.execPath, [fileURLToPath(import.meta.url), '--serve', String(port), '--seed', seed], { stdio: ['ignore', 'pipe', 'pipe'] });
let serverOut = ''; server.stdout.on('data', c => { serverOut += c; }); server.stderr.on('data', c => { serverOut += c; });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const result = { label, seed, measuredAt: new Date().toISOString(), cpuThrottle: cpu, viewport: '1366x768', note: 'Same computer, headless Chrome, throttled through CDP. Not a Chromebook measurement.', profiles: {} };
try {
  const t0 = Date.now(); let key = null;
  while (Date.now() - t0 < 60000 && !key) { await new Promise(r => setTimeout(r, 300)); key = /HOST_KEY=(\w+)/.exec(serverOut)?.[1]; }
  assert.ok(key, `the solo server never answered:\n${serverOut}`);
  result.serverStartMs = Date.now() - t0;
  for (const profile of profiles) {
    const dealt = await fetch(`http://127.0.0.1:${port}/api/solo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, name: 'Load reader' }) }).then(r => r.json());
    assert.ok(dealt.playUrl, 'no solo game dealt');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' });
    await context.addInitScript(() => {
      window.__load = { longTasks: [], mapDrawn: 0 };
      try { new PerformanceObserver(list => { for (const e of list.getEntries()) window.__load.longTasks.push({ start: e.startTime, duration: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch { /* no long task API */ }
      const watch = () => {
        const sites = window.__snapshot?.world?.map?.sites;
        if (sites && Object.keys(sites).length && !document.querySelector('#game')?.hidden) requestAnimationFrame(() => { window.__load.mapDrawn = performance.now(); });
        else requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    if (PROFILES[profile]) await cdp.send('Network.emulateNetworkConditions', PROFILES[profile]);
    const cold = await openOnce(context, cdp, page, dealt.playUrl, { trace: true, browser });
    const warm = await openOnce(context, cdp, page, 'reload', { trace: false, browser });
    result.profiles[profile] = { cold, warm };
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
  await new Promise(resolve => server.exitCode !== null ? resolve() : server.on('exit', resolve));
}

mkdirSync('docs/evidence', { recursive: true });
writeFileSync(`docs/evidence/perf-load-${label}.json`, `${JSON.stringify(result, null, 2)}\n`);
const kb = n => `${(n / 1024).toFixed(0)} KB`;
for (const [profile, { cold, warm }] of Object.entries(result.profiles)) {
  for (const [name, run] of Object.entries({ cold, warm })) {
    console.log(`\n== ${label} / ${profile} / ${name}: ${run.requests} requests (${run.notModified} not modified), ${kb(run.wireBytes)} on the wire, ${kb(run.decodedBytes)} decoded`);
    console.log(`   DOMContentLoaded ${run.domContentLoadedMs} ms · map drawn ${run.mapDrawnMs} ms · responsive ${run.responsiveMs} ms · last asset ${run.lastAssetMs} ms`);
    console.log(`   long tasks ${run.longTasks} (${run.longTaskMs} ms, longest ${run.longestTaskMs} ms, blocking before map ${run.blockingMsBeforeMap} ms)`);
    for (const f of run.files.slice(0, 12)) console.log(`   ${String(f.status).padEnd(4)} ${kb(f.wire).padStart(8)} wire ${(f.encoding || '-').padEnd(5)} ${f.url}`);
    if (run.trace) console.log('   trace:', Object.entries(run.trace).filter(([, v]) => v.ms >= 20).sort((a, b) => b[1].ms - a[1].ms).map(([k, v]) => `${k} ${v.ms}ms/${v.count}`).join(' · '));
  }
}
console.log(`\nWrote docs/evidence/perf-load-${label}.json`);

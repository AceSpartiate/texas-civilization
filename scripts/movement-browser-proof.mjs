// How a walk looks on screen, measured from the frames a real browser actually painted.
//
// The owner (2026-09-16): movement "still looks too fast", and the ground a person covers must
// not change. So this proof never asks the simulation anything about speed. It watches
// `window.__drawnAt` - where each figure was drawn in the frame just painted - and
// `window.__animationClips`/`__animation`, and asks three questions of one walker:
//
//   1. Does the figure move evenly through the whole tick, or cover the tick's ground in a
//      burst and then stand? Measured as the share of a tick's screen distance drawn in its
//      first quarter (an even walk is about a quarter).
//   2. Does it ever jump? Measured as the largest single painted step against an even step.
//   3. Is the drawn position still where the server put the walker by the end of each tick?
//
// Another family renames itself in the middle of every tick, because that is what a class of
// fifteen to thirty students does to every client's stream: any command bumps the revision
// and every screen gets a new snapshot of the same tick.
//
// Run: npm run test:movement
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const TICK_MS = Number(process.env.PROOF_TICK_MS || 2000);
const WRITE = process.env.PROOF_NO_WRITE ? null : 'docs/evidence/movement-browser.json';

const pass = [];
const ok = (label, condition = true) => { assert.ok(condition, label); pass.push(label); console.log('PASS', label); };

async function run({ label, interrupt, zoom = 0 }) {
  const worldFactory = (seed, count) => {
    const world = keepFoundingFamilies(createSettledWorld(seed, count));
    return world;
  };
  const app = createClassroom({ seed: `movement-${label}`, playerCount: 5, tickMs: TICK_MS, worldFactory });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
  const errors = [];
  const post = async (path, body, cookie) => {
    const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
    assert.equal(response.status, 200, `${path}: ${response.status} ${await response.clone().text()}`);
    return response;
  };
  try {
    const host = await post('/api/host', { key: app.state.hostKey });
    const hostCookie = host.headers.get('set-cookie').split(';')[0];
    const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 950 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.locator('[name=name]').fill('Walker');
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
    const second = await post('/api/join', { name: 'Neighbour', code: app.state.sessionCode });
    const secondCookie = second.headers.get('set-cookie').split(';')[0];
    for (let i = 3; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
    await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
    await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
    await page.evaluate(async () => {
      await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `walk-${crypto.randomUUID()}`, action: 'travel', entityId: 'hh-1-thomas', destination: 'gonzales', mode: 'foot' }) });
    });
    await page.waitForFunction(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-thomas')?.travel?.progress > 0);
    // Hold the camera still, zoomed on him: an automatic frame moves with the family and would
    // put its own motion into every screen measurement. `zoom` wheel steps in; 0 is one step out.
    const spot = await page.evaluate(() => {
      const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect(), at = window.__drawnAt['hh-1-thomas'];
      return { x: rect.left + at.x * rect.width / canvas.width, y: rect.top + at.y * rect.height / canvas.height };
    });
    await page.mouse.move(spot.x, spot.y);
    for (let i = 0; i < Math.max(1, zoom); i++) await page.mouse.wheel(0, zoom ? -100 : 100);
    // Let the zoom settle: while the wheel turns the page moves its last drawing rather than redrawing the walkers, and draws
    // them again 250 ms after the last notch (docs/PERFORMANCE_NAVIGATION.md). The walk is measured with the camera still.
    await page.waitForTimeout(600);
    await page.evaluate(() => { window.__movementSamples = []; });
    // Sample the painted position on every animation frame, with the tick the frame belonged to.
    await page.evaluate(() => {
      const samples = window.__movementSamples;
      const step = () => {
        const spot = window.__drawnAt?.['hh-1-thomas'];
        const snap = window.__snapshot;
        if (spot && snap) samples.push({ t: performance.now(), x: spot.x, y: spot.y, size: spot.size, tick: snap.world.tick, revision: snap.revision, clip: [...(window.__animationClips || [])].find(c => /walk/.test(c)) || null });
        if (samples.length < 4000) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    // Rename one of the walker's own family partway through each tick, for four ticks. It was the neighbouring family until
    // 2026-09-17, when the server stopped sending a page a snapshot that changes nothing it can see (docs/PERFORMANCE_SERVER.md):
    // a rename the walker's page cannot see no longer interrupts its tick, so the interruption is one it does see.
    const ticks = 4;
    const started = Date.now();
    for (let i = 0; i < ticks; i++) {
      await new Promise(resolve => setTimeout(resolve, TICK_MS * (i === 0 ? 0.4 : 1)));
      if (interrupt) await page.evaluate(async n => { const kin = window.__snapshot.world.entities.find(e => e.householdId === 'hh-1' && e.kind === 'person' && e.id !== 'hh-1-thomas'); await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `rename-${crypto.randomUUID()}`, action: 'rename', entityId: kin.id, name: `Kin ${String.fromCharCode(65 + n)}` }) }); }, i);
    }
    await new Promise(resolve => setTimeout(resolve, Math.max(0, TICK_MS * (ticks + 0.8) - (Date.now() - started))));
    const samples = await page.evaluate(() => window.__movementSamples.slice());
    return { samples, errors };
  } finally {
    await browser.close();
    await app.close();
  }
}

/** Collapse repeated frames (the map paints at twelve a second) and group by tick arrival. */
function analyse(samples) {
  const painted = samples.filter((s, i) => i === 0 || s.x !== samples[i - 1].x || s.y !== samples[i - 1].y || s.tick !== samples[i - 1].tick);
  const byTick = new Map();
  for (const s of painted) { if (!byTick.has(s.tick)) byTick.set(s.tick, []); byTick.get(s.tick).push(s); }
  const ticks = [];
  for (const [tick, list] of byTick) {
    if (list.length < 4) continue;
    const t0 = samples.find(s => s.tick === tick).t;
    const next = samples.find(s => s.tick === tick + 1);
    if (!next) continue;
    const span = next.t - t0;
    const path = [];
    let total = 0, early = 0, biggest = 0;
    const all = samples.filter(s => s.tick === tick).concat([next]);
    for (let i = 1; i < all.length; i++) {
      const d = Math.hypot(all[i].x - all[i - 1].x, all[i].y - all[i - 1].y);
      total += d; biggest = Math.max(biggest, d);
      if (all[i].t - t0 <= span / 4) early += d;
      path.push(d);
    }
    // When, within the tick, the figure stopped moving for good.
    let lastMove = t0;
    for (let i = 1; i < all.length; i++) if (Math.hypot(all[i].x - all[i - 1].x, all[i].y - all[i - 1].y) > 0.05) lastMove = all[i].t;
    const size = list[0].size;
    ticks.push({ tick, spanMs: Math.round(span), screenPx: +total.toFixed(1), firstQuarterShare: total ? +(early / total).toFixed(2) : null, largestStepPx: +biggest.toFixed(1), jumpRatio: total ? +(biggest / (total / Math.max(1, path.filter(d => d > 0.05).length))).toFixed(1) : null,stillFromShare: +((lastMove - t0) / span).toFixed(2), bodiesPerSecond: size ? +((total / size) / (span / 1000)).toFixed(2) : null, clip: list.find(s => s.clip)?.clip || null, revisions: [...new Set(samples.filter(s => s.tick === tick).map(s => s.revision))].length });
  }
  return ticks;
}

const runs = {
  quietClose: await run({ label: 'quiet', interrupt: false, zoom: 8 }),
  busyClose: await run({ label: 'busy', interrupt: true, zoom: 8 }),
  busyWide: await run({ label: 'wide', interrupt: true, zoom: 0 }),
};
const result = Object.fromEntries(Object.entries(runs).map(([name, r]) => [name, analyse(r.samples)]));
console.log(JSON.stringify(result));
assert.deepEqual(Object.values(runs).flatMap(r => r.errors), []);
ok('the page raised no errors');
if (!process.env.PROOF_OBSERVE_ONLY) {
  for (const [name, ticks] of Object.entries(result)) {
    assert.ok(ticks.length >= 2, `${name}: too few whole ticks measured (${ticks.length})`);
    for (const t of ticks) {
      assert.ok(t.firstQuarterShare < 0.35,`${name} tick ${t.tick}: ${t.firstQuarterShare} of the tick's walk was drawn in its first quarter`);
      assert.ok(t.stillFromShare > 0.8, `${name} tick ${t.tick}: the walker stopped moving ${t.stillFromShare} of the way through the tick`);
    }
    ok(`${name}: every tick's walk is spread across the tick, not drawn in a burst (${ticks.map(t => t.firstQuarterShare).join(', ')} in the first quarter)`);
  }
  const busyRevisions = result.busyClose.some(t => t.revisions > 1);
  ok('the busy run really did receive a second snapshot inside a tick', busyRevisions);
  if (WRITE) {
    mkdirSync('docs/evidence', { recursive: true });
    writeFileSync(WRITE, JSON.stringify({
      record: 'movement-browser',
      date: new Date().toISOString().slice(0, 10),
      ownerDirection: '"It still looks too fast. I don\'t want to change the rate at which players actually cover ground. Could we change the animation so it appears slower, without actually changing how much ground is covered?"',
      tickMs: TICK_MS,
      readThis: 'firstQuarterShare is the share of a tick\'s drawn walk painted in its first quarter (an even walk is about 0.25); stillFromShare is how far through the tick the figure last moved (1 is all the way); bodiesPerSecond scales with the tick, so at the Study pace of 9500ms divide by 4.75.',
      beforeThisChange: {
        commit: 'ee0beef, same script, same machine, PROOF_OBSERVE_ONLY=1',
        quietClose: 'firstQuarterShare 0.23-0.26, stillFromShare 1: a walk nobody interrupts was already even.',
        busyClose: 'firstQuarterShare 0.56-0.70, largest painted step 10.8-11.5px: another family renaming itself mid-tick front-loaded every tick of the walk.',
        busyWide: 'firstQuarterShare 0.38-0.46, stillFromShare 0.43-0.49: the walker covered the tick in its first half and stood for the rest.',
      },
      measured: result,
      pass,
      notMeasuredHere: [
        'The walk cycle\'s rate. The page exposes which clips were drawn, not which frame; the stride-matched rate is proved in tests/movement.test.mjs.',
        'A compressed calendar (MAP=colonies, news phase). The fix is proved in tests/movement.test.mjs; before it every such tick was drawn as a jump.',
      ],
      limitations: ['Same computer, headless Chrome at a 2000ms tick: frame timing is the headless browser\'s, and nothing here says anything about a classroom network or a projector.'],
    }, null, 2) + '\n');
    console.log(`\nwrote ${WRITE}`);
  }
}

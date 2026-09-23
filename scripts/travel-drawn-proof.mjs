// Walk, fade, cross, fade, walk - proved in a real browser, frame by frame, over one whole journey.
//
// Owner, 2026-09-22: "characters are still seen zipping around. i don't want to see icons. i want to see them walk at a
// normal pace, then when they've walked a ways (say if they're going somewhere that isn't their farm) they should fade out.
// then after they travel extra fast, they fade back in after arriving close enough to when normally the rest of the way.
// that way they arrive at the correct time, but no one sees them move unnaturally. their icon should say 'Travelling' next
// to it." The schedule is public/motion.js `travelSight` and tests/travel-drawn.test.mjs holds it; what only a browser can
// answer is whether the page actually does it to a real person on a real road.
//
// It plays as a student does: a Solo game on the real land, the family made, the main person sent to Gonzales on foot, the
// camera pressed close in on them (which is where the zipping was seen), and **every painted frame from setting out to
// arriving** read from `window.__travelSight`, `__drawnAt`, `__animationClips` and `__camera`. It shows:
//   1. in the family's own view the walker is a whole figure, walking, and nothing fades;
//   2. pressed close in, the drawn speed never passes the gait (public/motion.js `GAIT_CEILING`) on any frame;
//   3. they walk in view, fade out rather than popping, and are wholly invisible through the middle - with nothing
//      standing in for them and nothing to tap, only the road they are on;
//   4. no marker is drawn on any frame, and the page has no marker to draw;
//   5. they fade back in and are walking in view before they arrive;
//   6. the drawn arrival is the server's: never at the far end before the server puts them there, and there on the tick it
//      says so;
//   7. their row on the family panel says Travelling the whole way.
// Screenshots go to docs/evidence/travel-drawn/, the numbers to docs/evidence/travel-drawn.json.
//
// Same computer only: headless Chrome, 1280 x 850. Nothing here is a Chromebook, a classroom projector or a physical LAN.
// Run: npm run test:travel-drawn   (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for the other proofs)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom, PACES } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { GAIT_CEILING, SEEN_YARDS, TRAVEL_FADE_MS } from '../public/motion.js';
import { pickSite } from '../sim/neighbours.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const WRITE = !process.env.PROOF_NO_WRITE;
const SHOTS = 'docs/evidence/travel-drawn';
/** Past this many miles the journey is played at the quick pace; under it, at the Study pace a class really uses. */
const QUICK_ABOVE_MILES = 15;
const pass = [];
const ok = (label, condition = true) => { assert.ok(condition, label); pass.push(label); console.log('PASS', label); };

/** One painted frame of what the page drew of this person, read off in the page itself. */
const FRAME = `(id => {
  const seen = window.__travelSight?.get(id), snap = window.__snapshot;
  const me = snap.world.entities.find(entity => entity.id === id);
  const clips = [...(window.__animationClips || [])];
  const row = document.querySelector('.panel-row[data-entity-id="' + id + '"]');
  return {
    t: Math.round(performance.now()), tick: snap.world.tick, minute: snap.world.minute, tickMs: snap.tickMs,
    alpha: seen ? seen.alpha : 1, shown: seen?.shownHeightsPerSecond ?? 0, server: seen?.heightsPerSecond ?? 0,
    miles: seen?.miles ?? null, serverMiles: seen?.serverMiles ?? null, distance: seen?.journey?.distance ?? null,
    lead: seen?.lead ?? null, frameMs: seen?.shownAt ?? null, leapt: Boolean(seen?.leapt),
    road: Boolean(seen?.drawn), faded: Boolean(seen?.faded),
    drawn: window.__drawnAt?.[id] ? 1 : 0, height: window.__drawnAt?.[id]?.size ?? null,
    // How far the figure was **actually painted** from where the schedule says it should be, in pixels. 'painted' is the
    // world point the page really put them at and 'at' is the one the schedule walked them to; comparing the two is the
    // only way to tell "the schedule says the right thing" from "the page drew the right thing". Without it, drawing the
    // figure at the server's own place instead of the scheduled one passes every other check in this file.
    off: seen?.at && seen?.painted && window.__camera
      ? Math.round(Math.hypot(seen.painted.x - seen.at.x, seen.painted.y - seen.at.y) * window.__camera.scale)
      : null,
    walking: clips.some(clip => /-walk/.test(clip)),
    markerHook: typeof window.__travelMarkers,
    progress: me?.travel?.progress ?? null, step: me?.travel?.step ?? null, arrived: !me?.travel, siteId: me?.location?.siteId ?? null,
    scale: window.__camera?.scale ?? null,
    // The word for this person, wherever their row puts it (docs/FAMILY_PANEL.md 14.1): beside the icons in the bar for the
    // main person, in the bar in place of them when the bar is empty, or on the row itself for anybody else.
    panel: ['.panel-travelling', '.panel-reason', '.panel-why'].map(one => row?.querySelector(one)?.textContent || '').find(Boolean) || '',
  };
})`;

const sample = (page, id, ms) => page.evaluate(({ id, ms, FRAME }) => new Promise(resolve => {
  const read = eval(FRAME), out = [], until = performance.now() + ms;
  const step = () => { out.push(read(id)); if (performance.now() < until) requestAnimationFrame(step); else resolve(out); };
  requestAnimationFrame(step);
}), { id, ms, FRAME });

const dir = mkdtempSync(join(tmpdir(), 'texas-travel-drawn-'));
const app = createClassroom({ seed: 'travel-marker-proof', playerCount: 5, solo: true, tickMs: 60, savePath: join(dir, 'save.json'),
  worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [], record = {};
try {
  if (WRITE) mkdirSync(SHOTS, { recursive: true });
  const game = await (await fetch(`${url}/api/solo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: app.state.hostKey }) })).json();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 850 }, reducedMotion: 'no-preference' })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(game.playUrl.replace(/^http:\/\/[^/]+/, url));
  await page.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 60000 });
  await meetFamily(page);
  // On a Solo game there is no teacher, so the student's own "Done packing" is the Start (server/app.mjs, owner
  // 2026-09-21). Until it is pressed the class sits in the lobby and the family never reaches its land.
  const closeBoxes = async () => {
    for (const id of ['#journal-close', '#wagon-done', '#tutorial-skip', '#house-close', '#plot-close']) {
      if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click().catch(() => {});
    }
  };
  for (let tries = 0; tries < 30; tries++) {
    await closeBoxes();
    if (await page.evaluate(() => window.__snapshot?.world?.status === 'running')) break;
    await page.waitForTimeout(500);
  }
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'running', null, { timeout: 60000 });
  // Past the arrival and the house site, chosen as a neighbour chooses it (sim/neighbours.mjs `pickSite`) and sent through
  // the student's own API: while a family is choosing its site a tap is a place, not a person.
  for (const deadline = Date.now() + 180000; Date.now() < deadline; await page.waitForTimeout(300)) {
    const land = await page.evaluate(() => window.__snapshot.world.land);
    if (!land?.choosingSite) break;
    if (!land.choosingSite.can) continue;
    for (const point of pickSite(land.grant.bounds, land.choosingSite.mark)) {
      const status = await page.evaluate(async point => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `site-${Date.now()}`, action: 'choose-site', ...point }) })).status, point);
      if (status === 200) break;
    }
  }
  await page.waitForFunction(() => !window.__snapshot.world.land?.choosingSite, null, { timeout: 60000 }).catch(async e => { console.log('LAND', JSON.stringify(await page.evaluate(() => ({ land: window.__snapshot.world.land, status: window.__snapshot.world.status })))); throw e; });
  const main = await page.waitForFunction(() => {
    const world = window.__snapshot?.world, home = world?.household?.homeSiteId;
    const person = world?.entities.find(entity => entity.principal);
    return person && !person.travel && person.location.siteId === home && !world.entities.some(entity => entity.travel) ? person.id : null;
  }, null, { timeout: 120000, polling: 100 }).then(handle => handle.jsonValue());
  app.setPace(PACES.study);
  await page.waitForFunction(pace => window.__snapshot?.tickMs === pace, PACES.study, { timeout: 30000 });
  await closeBoxes();
  const sent = await page.evaluate(async id => {
    const command = body => fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${body.action}-${crypto.randomUUID()}`, entityId: id, ...body }) });
    await command({ action: 'stop-chore' });
    const response = await command({ action: 'travel', destination: 'gonzales', mode: 'foot' });
    return { status: response.status, text: await response.text() };
  }, main);
  assert.equal(sent.status, 200, `sending ${main} to Gonzales: ${sent.text}`);
  await page.waitForFunction(id => window.__snapshot.world.entities.find(entity => entity.id === id)?.travel?.progress > 0, main, { timeout: 30000 });
  const road = await page.evaluate(id => { const t = window.__snapshot.world.entities.find(entity => entity.id === id).travel; return { distance: +t.distance.toFixed(3), step: t.step, speed: t.speed, to: t.to }; }, main);
  record.person = main; record.road = road;
  // A family dealt right beside Gonzales has no road to measure any of this on. The world is dealt fresh every run, so
  // this is a re-run and not a fault - and it is said plainly rather than left to fail as "0 frames" somewhere below.
  assert.ok(road.distance >= 2, `this run dealt a family only ${road.distance} miles from Gonzales, which is too short a road to fade at all. Run it again.`);

  // ------------------------------------------------------- 1. the family's own view: a whole figure, walking, never faded
  await page.waitForTimeout(2000);
  const follow = await sample(page, main, 3000);
  record.follow = {
    frames: follow.length, serverHeightsPerSecond: +Math.max(...follow.map(frame => frame.server)).toFixed(3),
    scale: +follow.at(-1).scale.toFixed(1), figurePx: follow.at(-1).height,
    leastAlpha: Math.min(...follow.map(frame => frame.alpha)), walkingFrames: follow.filter(frame => frame.walking).length,
  };
  // The family's view frames the family and the road, so how close it comes depends on where that family's land happens to
  // lie; the rule is what is proved here, whichever side of the gait the view falls.
  record.follow.drawnHeightsPerSecond = +Math.max(...follow.map(frame => frame.shown)).toFixed(3);
  if (record.follow.serverHeightsPerSecond < GAIT_CEILING) {
    ok(`in the family's own view the server carries them ${record.follow.serverHeightsPerSecond} of their own heights a second, under the gait's ${GAIT_CEILING}`);
    ok('so nothing fades: they are a whole figure on every frame, walking', record.follow.leastAlpha === 1 && record.follow.walkingFrames > follow.length / 2);
  } else {
    ok(`in the family's own view the server would carry them ${record.follow.serverHeightsPerSecond} of their own heights a second, over the gait's ${GAIT_CEILING}, and they are drawn at ${record.follow.drawnHeightsPerSecond}`,
      record.follow.drawnHeightsPerSecond <= GAIT_CEILING + 1e-9);
  }
  if (WRITE) await page.screenshot({ path: `${SHOTS}/follow-figure.png` });

  // ---------------------------------------- 2-6. pressed close in, every painted frame of the road from here to Gonzales
  await page.locator(`.panel-portrait[data-portrait="${main}"]`).click();
  await page.waitForTimeout(1200);
  if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
  await page.waitForTimeout(800);
  // The middle of the road is where a screenshot of "nothing but the road" has to be taken, so it is taken from inside the
  // sampler the first time the figure is wholly gone.
  await page.evaluate(({ id, FRAME }) => {
    const read = eval(FRAME);
    window.__blind = null;
    window.__journey = new Promise(resolve => {
      const out = [];
      const step = () => {
        const frame = read(id);
        out.push(frame);
        if (frame.alpha === 0 && !window.__blind) window.__blind = frame.t;
        const settled = out.filter(one => one.arrived);
        if ((settled.length && settled.at(-1).t - settled[0].t > 2500) || out.length > 20000) resolve(out); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { id: main, FRAME });
  // **The pace is chosen from the road, and that is not a convenience.** A Solo game deals a new world each run, so this
  // family's road to Gonzales has been anywhere from five to two hundred miles. The schedule only fades a journey long
  // enough to pay for two walked ends and two fades (public/motion.js `travelSight`), and a fade costs a fixed number of
  // *real* seconds - so the shorter the tick, the more road a fade eats. At the quick pace that line falls around a dozen
  // miles, and a short road played quick would be drawn whole, with nothing for this proof to measure. So a long road is
  // played quick, to finish inside a class's lunch break, and a short one is played at the Study pace a class really uses,
  // where every road past about half a mile fades. Either way it is one pace for one real journey.
  const quick = road.distance >= QUICK_ABOVE_MILES;
  if (quick) app.setPace(PACES.quick);
  const gone = page.waitForFunction(() => window.__blind !== null, null, { timeout: 240000 })
    .then(() => WRITE && page.screenshot({ path: `${SHOTS}/road-only.png` })).catch(() => {});
  const journey = await page.evaluate(() => window.__journey, { timeout: 240000 });
  await gone;
  const onRoad = journey.filter(frame => !frame.arrived && frame.miles !== null);
  const arrived = journey.filter(frame => frame.arrived);
  assert.ok(onRoad.length > 100 && arrived.length > 10, `only ${onRoad.length} frames on the road and ${arrived.length} after`);

  // 2. the pace cap
  // Measured, not taken from the page's own number: the ground between two painted frames, in the figure's drawn heights a
  // real second. `miles` is where along the road the renderer put them, so this is what was drawn, not what was intended.
  //
  // Timed by the **renderer's own clock** (`frameMs`, the moment public/app.js drew the map), not by this sampler's. The
  // map is not redrawn on every animation frame, so two samples 27 ms apart can hold 66 ms of drawn movement, and timing
  // them by the sampler reads as a figure going four times its own speed. That is a measuring fault, not a fault in the
  // page, and it is written down here so the next reader does not pay for it again.
  //
  // Only pairs of frames drawn at one camera, one class pace and one calendar count, and neither of them a frame the page
  // itself judged a leap (`leapt`). The schedule is a function of all three - the gait is in the figure's own drawn height,
  // and the ground a tick carries is the class's clock - so a frame either side of a zoom, of the teacher changing the pace,
  // or of the calendar turning over is the schedule moving under the figure and not a speed. The page snaps the figure to
  // the schedule on exactly those frames rather than easing it (public/app.js `sightOf`), which is what makes them findable
  // here. A frame the machine dropped is left out for the same reason.
  let measured = 0, pairs = 0, worstPair = null;
  for (let i = 1; i < journey.length; i++) {
    const a = journey[i - 1], b = journey[i], gap = b.frameMs - a.frameMs;
    if (a.miles === null || b.miles === null || gap < 4 || gap > 120 || !(b.alpha > 0) || !(a.alpha > 0)) continue;
    if (!b.height || !b.scale || a.scale !== b.scale || a.height !== b.height) continue;
    if (a.tickMs !== b.tickMs || a.step !== b.step || b.tick - a.tick > 1 || a.leapt || b.leapt) continue;
    const crossed = (b.miles - a.miles) * b.scale / b.height / (gap / 1000);
    if (crossed > measured) { measured = crossed; worstPair = [a, b, +crossed.toFixed(3)]; }
    pairs++;
  }
  if (process.env.PROOF_DEBUG) console.log(`worst pair: ${JSON.stringify(worstPair)}`);
  const worst = Math.max(...journey.filter(frame => frame.alpha > 0 && frame.miles !== null).map(frame => frame.shown));
  const serverWorst = Math.max(...journey.map(frame => frame.server));
  record.pace = { framesOnTheRoad: onRoad.length, framesAfter: arrived.length, tickMs: onRoad.at(-1).tickMs,
    serverHeightsPerSecond: +serverWorst.toFixed(2), drawnHeightsPerSecond: +worst.toFixed(3), measuredHeightsPerSecond: +measured.toFixed(3), measuredFramePairs: pairs, leaptFrames: journey.filter(frame => frame.leapt).length, ceiling: GAIT_CEILING,
    scale: +onRoad.at(-1).scale.toFixed(0), figurePx: onRoad.find(frame => frame.height)?.height ?? null };
  ok(`pressed close in the server would carry them ${record.pace.serverHeightsPerSecond} of their heights a second; drawn, they never pass ${record.pace.drawnHeightsPerSecond}, inside the gait's ${GAIT_CEILING}`,
    serverWorst > GAIT_CEILING && worst <= GAIT_CEILING + 1e-9);
  ok(`and measured frame to frame from where they were actually drawn, over ${pairs} pairs of frames at one camera, they cross ${record.pace.measuredHeightsPerSecond} of their heights a second`,
    // A tenth of slack, and not because the rule is soft: the schedule is sampled at whatever moments the page painted,
    // so a frame that arrives a little late carries a little more ground than its own share. The fault this is looking for
    // is a figure going a hundred times its gait, not a fortieth over it.
    // Twenty pairs is a guard against measuring nothing, not a demand for a frame count: on a short road played at the
    // Study pace, with the leap frames and the camera moves left out, that is what a walked end leaves to measure.
    pairs >= 20 && measured > 0 && measured <= GAIT_CEILING * 1.1);
  // And that the figure really was painted where the schedule walked it, and not where the server has them.
  const placed = journey.filter(frame => frame.drawn && frame.off !== null);
  const farthest = Math.max(0, ...placed.map(frame => frame.off));
  record.pace.framesPlaced = placed.length; record.pace.farthestFromTheSchedulePx = farthest;
  ok(`and the figure is painted where the schedule walked it, never where the server has them: ${placed.length} frames, the farthest ${farthest} px off`,
    placed.length >= 20 && farthest <= 2);

  // 3. walked, faded, gone
  // **The walk in is not "before the server says they arrived".** The page has always drawn one tick behind the server, so
  // the last stretch is walked *during* the tick the server calls the arrival - at the Study pace, where a tick is nine and
  // a half seconds, the whole walk in falls inside it. What matters is that the figure is back, in view and walking before
  // it is drawn *at the destination*, which is what these read.
  const walked = journey.filter(frame => frame.alpha === 1 && frame.miles !== null);
  const fading = journey.filter(frame => frame.alpha > 0 && frame.alpha < 1);
  const blind = journey.filter(frame => frame.alpha === 0);
  // Leap frames left out again, and for the same reason: on a frame where the schedule itself moved - the teacher changing
  // the class pace, the calendar turning over - the page takes the schedule at once rather than easing across a jump
  // (public/app.js `sightOf`), so the figure can go from whole to gone in that one frame. That is deliberate and it is the
  // better of the two: the other way keeps a half-drawn figure on screen while it is carried across the country.
  let biggest = 0, snapped = 0;
  for (let i = 1; i < journey.length; i++) {
    if (journey[i].leapt || journey[i - 1].leapt) { snapped++; continue; }
    biggest = Math.max(biggest, Math.abs(journey[i].alpha - journey[i - 1].alpha));
  }
  record.fade = { walkedFrames: walked.length, fadingFrames: fading.length, blindFrames: blind.length,
    biggestStep: +biggest.toFixed(3), snappedFrames: snapped, fadeMs: TRAVEL_FADE_MS, seenYards: SEEN_YARDS,
    walkedOutTo: +Math.max(...walked.filter(frame => frame.miles < road.distance / 2).map(frame => frame.miles), 0).toFixed(3),
    backInAt: +Math.min(...walked.filter(frame => frame.miles > road.distance / 2).map(frame => frame.miles), road.distance).toFixed(3) };
  ok(`they walk in view at the start (out to ${record.fade.walkedOutTo} miles) and again at the end (from ${record.fade.backInAt} of ${road.distance})`,
    record.fade.walkedOutTo > 0 && record.fade.backInAt < road.distance);
  // The family's own land under the road, which only a played class can prove is wired up: the walked lead is the whole
  // on-land stretch *plus* the hundred yards off it, so it must be well past a hundred yards on a road that starts at the
  // house. Read from the page's own schedule, not worked out here.
  const seenLead = Math.max(...journey.map(frame => (frame.faded && frame.lead !== null ? frame.lead : 0)));
  record.fade.walkedLeadMiles = +seenLead.toFixed(3);
  record.fade.ownLandMiles = +(seenLead - SEEN_YARDS / 1760).toFixed(3);
  ok(`and the family's own land under that road is walked in view with it: a lead of ${record.fade.walkedLeadMiles} miles, which is ${record.fade.ownLandMiles} of their own land and then the ${SEEN_YARDS} yards off it`,
    seenLead > SEEN_YARDS / 1760 * 1.5);
  ok(`the middle is crossed wholly out of sight: ${blind.length} painted frames with nothing of them drawn`,
    blind.length > 10 && blind.every(frame => frame.drawn === 0));
  ok(`and only the road is drawn while they are gone (${blind.filter(frame => frame.road).length} of ${blind.length} frames)`,
    blind.filter(frame => frame.road).length > blind.length * 0.8);
  ok(`it fades rather than blinking: ${fading.length} frames part drawn, no frame changing by more than ${record.fade.biggestStep} (${snapped} frames where the schedule itself moved are left out)`,
    fading.length >= 4 && biggest < 0.6);

  // 4. no marker, anywhere, ever
  record.marker = { hook: journey[0].markerHook, framesWithAnythingDrawnWhileGone: blind.filter(frame => frame.drawn).length };
  ok('no marker is drawn on any frame, and the page has none to draw', journey.every(frame => frame.markerHook === 'undefined' && !(frame.alpha === 0 && frame.drawn)));

  // 5. back and walking before they arrive
  const lastInView = journey.filter(frame => frame.alpha === 1 && frame.walking && frame.miles !== null && frame.miles < frame.distance);
  record.comingIn = { framesWalkingInView: lastInView.length, lastMiles: lastInView.length ? +lastInView.at(-1).miles.toFixed(3) : null };
  ok(`they are back and walking before they are drawn at Gonzales: ${lastInView.length} frames of it, the last at ${record.comingIn.lastMiles} of ${road.distance} miles`,
    lastInView.length > 3 && record.comingIn.lastMiles !== null && record.comingIn.lastMiles < road.distance);

  // 6. the drawn arrival is the server's
  // The page has always drawn one tick behind the server - during a tick a figure walks from where the last tick left them
  // to where this one has them - so the walk in finishes inside the tick the server calls the arrival, never before it. The
  // schedule does not change that, and this is the assertion that says so.
  const early = onRoad.filter(frame => frame.miles >= frame.distance - 1e-9);
  const arrivalTick = arrived[0]?.tick, arrivalMinute = arrived[0]?.minute, arrivalAt = arrived[0]?.t;
  const shownArrived = journey.find(frame => frame.miles !== null && frame.miles >= frame.distance - 1e-6);
  record.arrival = { siteId: arrived.at(-1).siteId, serverTick: arrivalTick, serverMinute: arrivalMinute, tickMs: arrived[0]?.tickMs,
    framesDrawnAtTheEndEarly: early.length, drawnThereOnTick: shownArrived?.tick ?? null, drawnThereOnMinute: shownArrived?.minute ?? null,
    drawnThereMsAfterTheServer: shownArrived ? shownArrived.t - arrivalAt : null,
    finalAlpha: arrived.at(-1).alpha, finalDrawn: arrived.at(-1).drawn };
  ok(`nobody is drawn at Gonzales before the server puts them there (${early.length} frames)`, early.length === 0);
  ok(`and the walk in finishes inside the tick the server calls the arrival: tick ${shownArrived?.tick} against the server's ${arrivalTick}, ${record.arrival.drawnThereMsAfterTheServer} ms after it`,
    shownArrived && shownArrived.arrived && shownArrived.tick <= arrivalTick + 1 && record.arrival.drawnThereMsAfterTheServer <= arrived[0].tickMs + 120);
  ok(`they end at ${record.arrival.siteId}, a whole figure again`, arrived.at(-1).siteId === 'gonzales' && arrived.at(-1).alpha === 1 && arrived.at(-1).drawn === 1);

  // 7. Travelling on the panel
  const words = [...new Set(onRoad.map(frame => frame.panel))];
  record.panel = { words, framesSaying: onRoad.filter(frame => frame.panel === 'Travelling').length, framesOnTheRoad: onRoad.length };
  ok(`their row says Travelling the whole way: ${JSON.stringify(words)}`, words.length === 1 && words[0] === 'Travelling');
  if (WRITE) await page.screenshot({ path: `${SHOTS}/arrived-figure.png` });
  assert.deepEqual(errors, [], 'the page raised errors');
  ok('the page raised no errors');
} finally {
  // Printed here and not only asserted at the end: a page that throws on its first frame fails as a wait that timed out
  // somewhere else entirely, and this is the line that says why.
  if (errors.length) console.log('page errors:', errors);
  await browser.close();
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}
if (WRITE) {
  writeFileSync('docs/evidence/travel-drawn.json', `${JSON.stringify({
    record: 'travel-drawn-browser',
    date: new Date().toISOString().slice(0, 10),
    ownerDirection: 'Owner, 2026-09-22: "characters are still seen zipping around. i don\'t want to see icons. i want to see them walk at a normal pace, then when they\'ve walked a ways (say if they\'re going somewhere that isn\'t their farm) they should fade out. then after they travel extra fast, they fade back in after arriving close enough to when normally the rest of the way. that way they arrive at the correct time, but no one sees them move unnaturally. their icon should say \'Travelling\' next to it." By multiple choice: a short fixed stretch of walking (about a hundred yards), the road only while away, and everyone on the map. And: "this shouldn\'t be a thing on their land. everyone should move at normal speed at all times (unless on horseback or wagon) on their land."',
    how: 'node scripts/travel-drawn-proof.mjs: a Solo game on the real land, the family made as a student makes it, the main person sent to Gonzales on foot; the family\'s own view sampled at the Study pace, then the portrait pressed (the camera goes close in and follows) and EVERY painted frame kept from there to two and a half seconds past the arrival, the rest of the road played at the quick pace. Headless Chrome 1280x850 on this computer.',
    schedule: { gaitCeilingHeightsPerSecond: GAIT_CEILING, walkedYardsEachEnd: SEEN_YARDS, fadeMs: TRAVEL_FADE_MS, quickAboveMiles: QUICK_ABOVE_MILES },
    ...record,
    screenshots: ['follow-figure.png', 'road-only.png', 'arrived-figure.png'].map(name => `${SHOTS}/${name}`),
    pass,
    limitations: [
      'Same computer, headless Chrome: frame timing is the headless browser\'s. Nothing here is a Chromebook, a classroom projector or a physical LAN.',
      'On foot, at two paces, on one road. A rider, the ox wagon, the long ticks and the family\'s own land are the same schedule on other numbers (tests/travel-drawn.test.mjs).',
    ],
  }, null, 2)}\n`);
  console.log('wrote docs/evidence/travel-drawn.json');
}

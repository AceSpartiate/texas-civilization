// A traveller drawn as a marker once they cross the screen faster than a walk can be drawn, proved in a real browser.
//
// Owner, 2026-09-18, playtesting Solo: "when i sent my main character to gonzales on foot he ran inhumanly fast". He chose,
// by multiple choice, "Marker when fast" (public/motion.js `MARKER_ABOVE`; tests/travel-marker.test.mjs holds the rules).
// This plays it as a student does: a Solo game on the real land at the Study pace, the family made, the main person sent
// to Gonzales on foot, and every painted frame read from `window.__travelMarkers`, `__drawnAt`, `__animationClips` and
// `__camera`. It shows:
//   1. in the family's own view the walker is a figure, walking;
//   2. with their portrait pressed (the camera goes to them and follows) they are a marker - drawn faster than
//      MARKER_ABOVE heights a second, their walking cycle not played, never further along than the server has them, and
//      still in the middle of the camera that follows them;
//   3. a tap on the marker chooses them;
//   4. on arrival they fade back to a figure, through weights between, with no pop.
// Screenshots go to docs/evidence/travel-marker/, the numbers to docs/evidence/travel-marker.json.
//
// Same computer only: headless Chrome, 1280 x 850. Nothing here is a Chromebook or a classroom projector.
// Run: node scripts/travel-marker-proof.mjs   (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for the other proofs)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom, PACES } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { MARKER_ABOVE } from '../public/motion.js';
import { pickSite } from '../sim/neighbours.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const WRITE = !process.env.PROOF_NO_WRITE;
const SHOTS = 'docs/evidence/travel-marker';
const pass = [];
const ok = (label, condition = true) => { assert.ok(condition, label); pass.push(label); console.log('PASS', label); };

// Every painted frame for `ms`: the main person's marker record, where they were drawn, the server's progress, the camera.
const sample = (page, id, ms) => page.evaluate(({ id, ms }) => new Promise(resolve => {
  const out = [], until = performance.now() + ms;
  const step = () => {
    const shown = window.__travelMarkers?.get(id), snap = window.__snapshot, me = snap.world.entities.find(entity => entity.id === id);
    const canvas = document.querySelector('#world-map'), camera = window.__camera;
    out.push({
      t: performance.now(), tick: snap.world.tick,
      weight: shown ? shown.weight : 0, heightsPerSecond: shown ? shown.heightsPerSecond : 0, markerDrawn: Boolean(shown?.drawn),
      miles: shown?.miles ?? null, server: me?.travel?.progress ?? null, arrived: !me?.travel, siteId: me?.location?.siteId ?? null,
      ground: shown && shown.x !== undefined ? { x: shown.x, y: shown.y } : null, disc: shown?.drawn ? { x: shown.discX, y: shown.discY, r: shown.r } : null,
      spot: window.__drawnAt?.[id] || null, walking: [...(window.__animationClips || [])].filter(clip => /^rust-walk/.test(clip)),
      rust: [...(window.__animationClips || [])].filter(clip => /^rust-/.test(clip)),
      centre: { x: canvas.width / 2, y: canvas.height / 2 }, following: camera?.following ?? null, quick: Boolean(camera?.quick), scale: camera?.scale,
      step: me?.travel?.step ?? null, tickMs: snap.tickMs, minute: snap.world.minute, height: window.__drawnAt?.[id]?.size ?? null,
    });
    if (performance.now() < until) requestAnimationFrame(step); else resolve(out);
  };
  requestAnimationFrame(step);
}), { id, ms });

const dir = mkdtempSync(join(tmpdir(), 'texas-travel-marker-'));
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
  // Past the arrival and the house site, chosen as a neighbour chooses it (sim/neighbours.mjs `pickSite`) and sent through the
  // student's own API, as scripts/support/navigation.mjs does: while a family is choosing its site a tap is a place, not a person.
  for (const deadline = Date.now() + 180000; Date.now() < deadline; await page.waitForTimeout(300)) {
    const land = await page.evaluate(() => window.__snapshot.world.land);
    if (!land?.choosingSite) break;
    if (!land.choosingSite.can) continue;
    for (const point of pickSite(land.grant.bounds, land.choosingSite.mark)) {
      const status = await page.evaluate(async point => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `site-${Date.now()}`, action: 'choose-site', ...point }) })).status, point);
      if (status === 200) break;
    }
  }
  await page.waitForFunction(() => !window.__snapshot.world.land?.choosingSite, null, { timeout: 60000 });
  const main = await page.waitForFunction(() => {
    const world = window.__snapshot?.world, home = world?.household?.homeSiteId;
    const person = world?.entities.find(entity => entity.principal);
    return person && !person.travel && person.location.siteId === home && !world.entities.some(entity => entity.travel) ? person.id : null;
  }, null, { timeout: 120000, polling: 100 }).then(handle => handle.jsonValue());
  app.setPace(PACES.study);
  await page.waitForFunction(pace => window.__snapshot?.tickMs === pace, PACES.study, { timeout: 30000 });
  for (const id of ['#journal-close', '#wagon-done', '#tutorial-skip', '#house-close', '#plot-close']) if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click().catch(() => {});
  const sent = await page.evaluate(async id => {
    const command = body => fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${body.action}-${crypto.randomUUID()}`, entityId: id, ...body }) });
    await command({ action: 'stop-chore' });
    const response = await command({ action: 'travel', destination: 'gonzales', mode: 'foot' });
    return { status: response.status, text: await response.text() };
  }, main);
  assert.equal(sent.status, 200, `sending ${main} to Gonzales: ${sent.text}`);
  await page.waitForFunction(id => window.__snapshot.world.entities.find(entity => entity.id === id)?.travel?.progress > 0, main, { timeout: 30000 })
    .catch(async error => { console.log('not on the road:', sent, JSON.stringify(await page.evaluate(id => { const w = window.__snapshot.world; const me = w.entities.find(entity => entity.id === id); return { tick: w.tick, status: w.status, tickMs: window.__snapshot.tickMs, me: { task: me.task, chore: me.chore, travel: me.travel && { ...me.travel, points: me.travel.points?.length }, location: me.location } }; }, main))); throw error; });
  const road = await page.evaluate(id => { const t = window.__snapshot.world.entities.find(entity => entity.id === id).travel; return { distance: t.distance, step: t.step, speed: t.speed }; }, main);
  record.person = main; record.road = road;

  // 1. The family's own view: a figure, walking.
  await page.waitForTimeout(2500);
  const follow = await sample(page, main, 3000);
  const followSpeed = Math.max(...follow.map(frame => frame.heightsPerSecond));
  if (process.env.PROOF_DEBUG) console.log(JSON.stringify(follow.filter((_, i) => i % 15 === 0).map(frame => [frame.heightsPerSecond.toFixed(2), frame.scale?.toFixed(1), frame.step, frame.tickMs, frame.minute, frame.height?.toFixed(1), frame.tick])));
  record.follow = { frames: follow.length, heightsPerSecond: +followSpeed.toFixed(3), scale: +follow.at(-1).scale.toFixed(1), figurePx: follow.at(-1).height, step: follow.at(-1).step, tickMs: follow.at(-1).tickMs, maxWeight: Math.max(...follow.map(frame => frame.weight)), walkingFrames: follow.filter(frame => frame.walking.length).length };
  // The family's view frames the family and the road, so how close it comes depends on where the family's land lies; the
  // rule is what is proved here, whichever side of it the view falls.
  if (followSpeed < MARKER_ABOVE) {
    ok(`in the family's own view the walker is drawn at ${followSpeed.toFixed(2)} heights a second, under ${MARKER_ABOVE}, and is a figure`, follow.every(frame => frame.weight === 0 && !frame.markerDrawn));
    ok('and walks: their walking cycle is drawn', record.follow.walkingFrames > follow.length / 2);
  } else {
    ok(`in the family's own view the walker is drawn at ${followSpeed.toFixed(2)} heights a second, over ${MARKER_ABOVE}, and is already a marker`, follow.every(frame => frame.weight === 1 && frame.walking.length === 0));
  }
  if (WRITE) await page.screenshot({ path: `${SHOTS}/follow-figure.png` });

  // 2. The portrait pressed: the camera goes to them, close, and follows.
  await page.locator(`.panel-portrait[data-portrait="${main}"]`).click();
  await page.waitForTimeout(1200);
  if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
  await page.waitForTimeout(800);
  const close = await sample(page, main, PACES.study + 500);
  const drawnFrames = close.filter(frame => !frame.quick);
  const speeds = drawnFrames.map(frame => frame.heightsPerSecond);
  if (process.env.PROOF_DEBUG) console.log(JSON.stringify(drawnFrames.filter((_, i) => i % 10 === 0).map(frame => [frame.heightsPerSecond.toFixed(2), frame.weight, frame.scale?.toFixed(0), frame.following, frame.tick])));
  record.close = {
    frames: close.length, heightsPerSecond: +Math.min(...speeds).toFixed(2), weights: [...new Set(drawnFrames.map(frame => frame.weight))],
    walkingFrames: drawnFrames.filter(frame => frame.walking.length).length,
    aheadOfServer: Math.max(...drawnFrames.filter(frame => frame.server !== null).map(frame => frame.miles - frame.server)),
    offCentre: Math.max(...drawnFrames.map(frame => Math.hypot(frame.ground.x - frame.centre.x, frame.ground.y - frame.centre.y))),
    discRadius: drawnFrames.at(-1).disc?.r, drawnAt: drawnFrames.at(-1).spot, disc: drawnFrames.at(-1).disc,
    milesDrawn: +(drawnFrames.at(-1).miles - drawnFrames[0].miles).toFixed(3),
  };
  ok(`pressed close in, the walker is drawn at ${record.close.heightsPerSecond} heights a second or more, over ${MARKER_ABOVE}`, Math.min(...speeds) > MARKER_ABOVE);
  ok('and is a marker on every frame, the marker whole', drawnFrames.every(frame => frame.weight === 1 && frame.markerDrawn));
  ok('their walking cycle is not played while they are a marker', record.close.walkingFrames === 0 && drawnFrames.every(frame => frame.rust.length === 0));
  ok(`the marker moves along the road (${record.close.milesDrawn} miles in a tick) and never ahead of the server (at most ${record.close.aheadOfServer.toFixed(4)})`,
    record.close.milesDrawn > 0.2 && record.close.aheadOfServer <= 1e-9);
  ok(`the camera still follows them: the marker's ground point stays within ${record.close.offCentre.toFixed(1)} px of the middle`, record.close.offCentre < 3 && drawnFrames.every(frame => frame.following === false));
  ok('a tap finds the marker: its disc is where the page looks for them', Math.hypot(record.close.drawnAt.x - record.close.disc.x, record.close.drawnAt.y - record.close.disc.y) < 0.5);
  if (WRITE) {
    await page.screenshot({ path: `${SHOTS}/close-marker.png` });
    // The marker itself, close: the disc, its point and the dotted road ahead.
    const box = await page.locator('#world-map').boundingBox(), disc = record.close.disc, canvasWidth = await page.evaluate(() => document.querySelector('#world-map').width);
    const ratio = box.width / canvasWidth, x = box.x + disc.x * ratio, y = box.y + disc.y * ratio;
    await page.screenshot({ path: `${SHOTS}/close-marker-detail.png`, clip: { x: x - 90, y: y - 60, width: 180, height: 180 } });
  }

  // 3. A tap on the marker chooses them.
  const noOne = await page.evaluate(() => { const panel = document.querySelector('#selection'); return panel.hidden ? null : panel.dataset.entityId; });
  const target = await page.evaluate(id => {
    const shown = window.__travelMarkers.get(id), canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
    return { x: rect.left + shown.discX * rect.width / canvas.width, y: rect.top + shown.discY * rect.height / canvas.height };
  }, main);
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(500);
  const chosen = await page.evaluate(() => { const panel = document.querySelector('#selection'); return panel.hidden ? null : panel.dataset.entityId; });
  record.tap = { before: noOne, chosen, at: target };
  ok(`a tap on the marker chooses them (${chosen})`, noOne === null && chosen === main);
  const after = await sample(page, main, 1500);
  ok('and the camera goes on following them', after.every(frame => frame.quick || Math.hypot(frame.ground.x - frame.centre.x, frame.ground.y - frame.centre.y) < 3));
  if (WRITE) await page.screenshot({ path: `${SHOTS}/tapped-marker.png` });
  await page.locator('#selection-close').click().catch(() => {});

  // 4. On arrival: a figure again, fading. The class is hurried to the quick pace for the rest of the road.
  // Watched again, close in, and the card put away; every frame from here to three seconds after they arrive is kept.
  await page.locator(`.panel-portrait[data-portrait="${main}"]`).click();
  await page.waitForTimeout(600);
  if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
  await page.waitForTimeout(400);
  await page.evaluate(({ id }) => { window.__arriving = new Promise(resolve => {
    const out = [];
    const step = () => {
      const shown = window.__travelMarkers?.get(id), me = window.__snapshot.world.entities.find(entity => entity.id === id);
      out.push({ t: performance.now(), weight: shown ? shown.weight : 0, heightsPerSecond: shown ? shown.heightsPerSecond : 0, scale: window.__camera?.scale, following: window.__camera?.following, arrived: !me?.travel, siteId: me?.location?.siteId ?? null, spot: window.__drawnAt?.[id] || null, rust: [...(window.__animationClips || [])].filter(clip => /^rust-/.test(clip)), quick: Boolean(window.__camera?.quick) });
      const settled = out.filter(frame => frame.arrived);
      if (settled.length && settled.at(-1).t - settled[0].t > 3000) resolve(out); else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }); }, { id: main });
  app.setPace(PACES.quick);
  const arriving = await page.evaluate(() => window.__arriving);
  if (process.env.PROOF_DEBUG) console.log(JSON.stringify(arriving.filter((_, i) => i % 5 === 0).map(frame => [frame.weight.toFixed(2), frame.heightsPerSecond.toFixed(1), frame.scale?.toFixed(0), frame.following, frame.arrived])));
  const between = arriving.filter(frame => frame.weight > 0 && frame.weight < 1).map(frame => +frame.weight.toFixed(2));
  const last = arriving.at(-1);
  let biggest = 0;
  for (let i = 1; i < arriving.length; i++) biggest = Math.max(biggest, Math.abs(arriving[i].weight - arriving[i - 1].weight));
  record.arrival = { frames: arriving.length, markerFramesBefore: arriving.filter(frame => !frame.arrived && frame.weight === 1).length, heightsPerSecondBefore: +Math.max(...arriving.map(frame => frame.heightsPerSecond)).toFixed(1),
    siteId: last.siteId, weightsBetween: [...new Set(between)], biggestStep: +biggest.toFixed(3), finalWeight: last.weight, figureClips: last.rust, drawnAt: last.spot };
  ok(`coming in at the quick pace (${record.arrival.heightsPerSecondBefore} heights a second) they are a marker to the end of the road`, record.arrival.markerFramesBefore > 2);
  ok(`on arrival at ${last.siteId} they are a figure again`, last.arrived && last.siteId === 'gonzales' && last.weight === 0 && last.rust.length > 0);
  ok(`fading, not popping: ${record.arrival.weightsBetween.length} frames between marker and figure, no frame's change over ${record.arrival.biggestStep}`, between.length >= 2 && biggest < 0.6);
  if (WRITE) await page.screenshot({ path: `${SHOTS}/arrived-figure.png` });
  assert.deepEqual(errors, [], 'the page raised errors');
  ok('the page raised no errors');
} finally {
  await browser.close();
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}
if (WRITE) {
  writeFileSync('docs/evidence/travel-marker.json', JSON.stringify({
    record: 'travel-marker-browser',
    date: new Date().toISOString().slice(0, 10),
    ownerDirection: 'Owner, by multiple choice, 2026-09-19: "Marker when fast" - once someone would cover ground faster than a walk looks natural, draw them as a marker moving along a dotted route instead of a running figure; the clock and the figure size stay as they are.',
    how: 'node scripts/travel-marker-proof.mjs: a Solo game on the real land at the Study pace (9500 ms a tick), the family made as a student makes it, the main person sent to Gonzales on foot; the family view sampled, then the portrait pressed, the marker sampled every painted frame for a tick, tapped, and the rest of the road played at the quick pace to the arrival. Headless Chrome 1280x850 on this computer.',
    threshold: { heightsPerSecond: MARKER_ABOVE },
    ...record,
    screenshots: ['follow-figure.png', 'close-marker.png', 'close-marker-detail.png', 'tapped-marker.png', 'arrived-figure.png'].map(name => `${SHOTS}/${name}`),
    pass,
    limitations: ['Same computer, headless Chrome: frame timing is the headless browser\'s. Nothing here is a classroom projector or a Chromebook.', 'On foot in the farming day only; riders, the wagon and the long ticks are the same rule on other numbers (tests/travel-marker.test.mjs).'],
  }, null, 2) + '\n');
  console.log('wrote docs/evidence/travel-marker.json');
}

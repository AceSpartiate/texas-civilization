// Navigating the map on a slow computer, gesture by gesture: shared by scripts/perf-navigation-measure.mjs (numbers) and
// scripts/navigation-browser-proof.mjs (assertions). docs/PERFORMANCE_NAVIGATION.md; owner, 2026-09-17.
//
// A Play Solo game on the real land of the colonies, headless Chrome at 1366 by 768 with the CPU throttled (CDP
// Emulation.setCPUThrottlingRate), driven through CDP Input at real input rates without waiting for the page to keep up -
// 60 events a second, as a touchpad or a finger sends them whether or not the page is ready - so a busy page shows as
// latency and lost motion rather than as a slower test. Same computer only: not a Chromebook, a touchpad or a touchscreen.
//
// Per gesture:
//   latency       input event's timestamp to the end of the first map frame that began after its handler ran (ms)
//   fps           frames that moved the camera, a second, while the gesture ran
//   endErrorPx    how far the map ended from where the pointer or fingers put it, in screen pixels
//   anchorErrorPx how far the ground under the cursor (or between the fingers) drifted during a zoom, in screen pixels
//   wholeDraws / movedPictures   whole-map draws, and frames that moved the last drawing instead (public/app.js handOnMap)
import { pickSite } from '../../sim/neighbours.mjs';
import { meetFamily } from './meet-family.mjs';

const VIEW = { width: 1366, height: 768 };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Recorded in the page before any of its own script runs. `window.__camera` is written at the top of every map frame
// (public/app.js drawWorld, and quickFrame while a hand is on the map), so a setter on it sees every frame; the microtask
// runs when that frame's call stack has returned, which is when its pixels are finished.
const INSTRUMENT = () => {
  let camera;
  const nav = window.__nav = { draws: [], inputs: [] };
  Object.defineProperty(window, '__camera', {
    configurable: true, get: () => camera,
    set(value) {
      camera = value; if (!value) return;
      const at = performance.now();
      queueMicrotask(() => nav.draws.push({ at, done: performance.now(), cx: value.cx, cy: value.cy, scale: value.scale, following: value.following, quick: Boolean(value.quick) }));
    },
  });
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown']) {
    window.addEventListener(type, event => {
      const first = event.getCoalescedEvents?.()[0];
      nav.inputs.push({ type, ts: (first || event).timeStamp, handled: performance.now() });
    }, { capture: true, passive: true });
  }
};

const pct = (values, p) => { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]); };
const cam = page => page.evaluate(() => { const c = document.querySelector('#world-map'); return { ...window.__camera, width: c.width, height: c.height, rect: c.getBoundingClientRect().toJSON() }; });
export const mark = page => page.evaluate(() => ({ draws: window.__nav.draws.length, inputs: window.__nav.inputs.length }));
const selection = page => page.evaluate(() => { const panel = document.querySelector('#selection'); return panel.hidden ? null : panel.dataset.entityId; });
const toScreen = (c, p) => ({ x: c.rect.x + (c.width / 2 + (p.x - c.cx) * c.scale) * c.rect.width / c.width, y: c.rect.y + (c.height / 2 + (p.y - c.cy) * c.scale) * c.rect.height / c.height });
const toWorld = (c, s) => ({ x: c.cx + ((s.x - c.rect.x) * c.width / c.rect.width - c.width / 2) / c.scale, y: c.cy + ((s.y - c.rect.y) * c.height / c.rect.height - c.height / 2) / c.scale });
const drift = (before, after, point) => { const now = toScreen(after, toWorld(before, point)); return Math.round(Math.hypot(now.x - point.x, now.y - point.y) * 10) / 10; };
const panError = (before, after, dx, dy) => Math.round(Math.hypot((before.cx - after.cx) * after.scale - dx, (before.cy - after.cy) * after.scale - dy) * 10) / 10;

export async function analyse(page, from, kinds, wait = 2500) {
  await page.waitForTimeout(wait);
  const nav = await page.evaluate(from => ({ draws: window.__nav.draws.slice(from.draws), inputs: window.__nav.inputs.slice(from.inputs) }), from);
  const inputs = nav.inputs.filter(input => kinds.includes(input.type));
  const latencies = [];
  for (const input of inputs) {
    const frame = nav.draws.find(d => d.at >= input.handled - 0.01);
    if (frame) latencies.push(frame.done - input.ts);
  }
  const moved = nav.draws.filter((d, i) => i > 0 && (d.cx !== nav.draws[i - 1].cx || d.cy !== nav.draws[i - 1].cy || d.scale !== nav.draws[i - 1].scale));
  const first = inputs[0]?.ts, last = inputs.at(-1)?.ts;
  const during = moved.filter(d => d.done >= first && d.done <= last + 50);
  const lastMove = moved.at(-1);
  // Frames that began between the first input and the last: the gesture's own, not the settle and animation after it.
  const inGesture = nav.draws.filter(d => d.at >= first && d.at <= last);
  return {
    handled: inputs.length,
    latency: { median: pct(latencies, .5), p95: pct(latencies, .95), max: latencies.length ? Math.round(Math.max(...latencies)) : null },
    fps: first !== undefined && last > first ? Math.round(during.length / ((last - first) / 1000) * 10) / 10 : null,
    settleMs: lastMove && last !== undefined ? Math.max(0, Math.round(lastMove.done - last)) : null,
    drawMsMedian: pct(nav.draws.filter(d => !d.quick).map(d => d.done - d.at), .5),
    movedPictureMsMedian: pct(nav.draws.filter(d => d.quick).map(d => d.done - d.at), .5),
    wholeDraws: inGesture.filter(d => !d.quick).length, movedPictures: inGesture.filter(d => d.quick).length,
  };
}
// Events at a steady rate, sent without waiting for the page: a hand does not wait either.
export async function stream(cdp, commands, errors, everyMs = 16) {
  const sent = [];
  for (const [method, params] of commands) { sent.push(cdp.send(method, params).catch(error => errors.push(`${method}: ${error.message}`))); await sleep(everyMs); }
  await Promise.all(sent);
}
export const mouse = (type, x, y, buttons = 1) => ['Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: 1 }];
export const finger = (type, points) => ['Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id, radiusX: 8, radiusY: 8, force: 1 })) }];

async function clearOverlays(page) {
  for (const button of ['#journal-close', '#wagon-done', '#tutorial-skip', '#house-close', '#plot-close']) if (await page.locator(button).isVisible()) await page.locator(button).click();
}
export async function view(page, name) {
  await clearOverlays(page);
  await page.locator(`#map-nav [data-view=${name}]`).click();
  await page.waitForTimeout(1500);
}
// Close in on one of the family who is not the main person, by their portrait (docs/FAMILY_PANEL.md §3), so a family standing
// together are separate targets; then put their card away so the map under them is clear.
// `turn` goes to the others in order, last first, for a step that found nobody standing where the first one led.
async function goClose(page, turn = 0) {
  await clearOverlays(page);
  const id = await page.evaluate(turn => { const h = window.__snapshot.world.household || {}; const them = (window.__snapshot.world.entities || []).filter(e => e.kind === 'person' && e.location && e.id !== h.mainId && e.id !== h.principalId).reverse(); return them.length ? them[turn % them.length].id : null; }, turn);
  const portrait = id && page.locator(`[data-portrait="${id}"]`).first();
  if (!portrait || !(await portrait.isVisible())) return view(page, 'home');
  await portrait.click();
  await page.waitForTimeout(1500);
  if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click();
  await page.waitForTimeout(1000);
}
// A person drawn in the open middle of the map, clear of the panels, not the main person (whose card shows by default), with
// nobody else closer than a fingertip - and **standing still**. The class runs while the gestures do (the page is meant to be
// busy), and a person walking between being found and being tapped made these checks fail about one run in three
// (2026-09-18): the gesture landed where they had been. So a person is chosen only if they are not travelling and their drawn
// place has not moved across STILL_MS, and if nobody is, the page is looked at again for a while before the step gives up.
const STILL_MS = 700, LOOK_FOR_MS = 45000;
const spotsNow = page => page.evaluate(() => {
  const household = window.__snapshot.world.household || {};
  const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
  const standing = new Set((window.__snapshot.world.entities || []).filter(e => e.kind === 'person' && e.id !== household.mainId && e.id !== household.principalId && !e.travel).map(e => e.id));
  return Object.entries(window.__drawnAt || {}).map(([id, s]) => ({ id, standing: standing.has(id), x: rect.x + s.x * rect.width / canvas.width, y: rect.y + s.y * rect.height / canvas.height }));
});
// `left`: how far left of the person the step will press, which must be open map too - the pinch presses 62 px left, and the
// click after a drag 80 px, where the family panel stood once and took the click (2026-09-18).
async function personOnScreen(page, { left = 62 } = {}) {
  // The person the camera was taken to may be off at work somewhere out of this view, with nobody else of the family in it
  // (found 2026-09-18: only the father at work, the horse, the ox and the wagon drawn); then the camera is taken to the next.
  let turn = 0;
  for (const deadline = Date.now() + LOOK_FOR_MS; Date.now() < deadline; await goClose(page, ++turn)) {
    const first = await spotsNow(page);
    await sleep(STILL_MS);
    const second = await spotsNow(page);
    const still = new Set(second.filter(spot => { const was = first.find(one => one.id === spot.id); return was && Math.hypot(was.x - spot.x, was.y - spot.y) < 0.5; }).map(spot => spot.id));
    const found = await page.evaluate(({ spots, still, left }) => {
      const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
      const room = spot => Math.min(1e9, ...spots.filter(o => o.id !== spot.id).map(o => Math.hypot(o.x - spot.x, o.y - spot.y)));
      const clear = spots.filter(s => s.standing && still.includes(s.id) && document.elementFromPoint(s.x, s.y) === canvas && [62, left, left + 20].every(off => document.elementFromPoint(s.x - off, s.y) === canvas) && s.x > rect.x + 380 && s.x < rect.right - 120 && s.y > rect.y + 120 && s.y < rect.bottom - 120);
      clear.sort((a, b) => room(b) - room(a));
      return clear[0] ? { id: clear[0].id, x: clear[0].x, y: clear[0].y, room: room(clear[0]) } : null;
    }, { spots: second, still: [...still], left });
    if (found) return found;
    lastLook = { drawn: second.length, standing: second.filter(spot => spot.standing).length, still: still.size, stillStanding: second.filter(spot => spot.standing && still.has(spot.id)).length, who: await page.evaluate(ids => { const h = window.__snapshot.world.household || {}; return ids.map(id => { const e = (window.__snapshot.world.entities || []).find(one => one.id === id); return e ? [id, e.id === h.mainId ? 'main' : e.id === h.principalId ? 'principal' : '', e.travel ? `to ${e.travel.to}` : '', e.task || '', e.chore?.id || ''].filter(Boolean).join(' ') : `${id} (not ours)`; }); }, second.map(spot => spot.id)) };
  }
  console.log('no person on screen:', JSON.stringify(lastLook));
  console.log('the others:', JSON.stringify(await page.evaluate(() => { const h = window.__snapshot.world.household || {}; const seen = new Set(window.__viewEntities || []); return { camera: window.__camera && [Math.round(window.__camera.cx * 100) / 100, Math.round(window.__camera.cy * 100) / 100, Math.round(window.__camera.scale)], people: (window.__snapshot.world.entities || []).filter(e => e.kind === 'person' && e.id !== h.mainId).map(e => [e.id, e.location?.siteId, e.location && [Math.round(e.location.x * 100) / 100, Math.round(e.location.y * 100) / 100], e.task, e.chore?.id || null, e.health?.condition, seen.has(e.id) ? 'in view' : 'not in view', document.querySelector('[data-portrait="' + e.id + '"]') ? 'portrait' : 'no portrait']) }; })));
  return null;
}
let lastLook = null;
// A point on the canvas with open map either side of it (a pinch's fingers), and no person drawn near.
export async function openGround(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
    const spots = Object.values(window.__drawnAt || {}).map(s => ({ x: rect.x + s.x * rect.width / canvas.width, y: rect.y + s.y * rect.height / canvas.height }));
    for (let y = rect.y + 200; y < rect.bottom - 150; y += 37) for (let x = rect.x + 520; x < rect.right - 200; x += 41) {
      if ([-110, 0, 110].every(off => document.elementFromPoint(x + off, y) === canvas) && spots.every(s => Math.hypot(s.x - x, s.y - y) > 90)) return { x, y };
    }
    return { x: rect.x + rect.width * .6, y: rect.y + rect.height * .55 };
  });
}

// A game whose family has somebody besides the main person: the taps are aimed at one of them, and the die deals a man alone
// often enough (2026-09-18) that a proof on such a family could only report "no person on screen". Such a game is closed and
// another begun, as a student would roll again in a new game.
export async function openGame(options, tries = 4) {
  let opened;
  try { opened = await openOneGame(options); } catch (error) {
    if (tries <= 1 || !/the family was not made/.test(error.message)) throw error;
    console.log(`dealt again: ${error.message}`);
    return openGame(options, tries - 1);
  }
  const others = await opened.page.evaluate(() => { const h = window.__snapshot.world.household || {}; return (window.__snapshot.world.entities || []).filter(e => e.kind === 'person' && e.id !== h.mainId && e.id !== h.principalId).length; });
  if (others > 0 || tries <= 1) return opened;
  await opened.context.close();
  return openGame(options, tries - 1);
}
async function openOneGame({ browser, app, rate, hasTouch, errors }) {
  const game = app.newSoloGame('Navigator');
  // No race with the die: a Play Solo game holds its clock until the family is made (sim/family.mjs `familyMaking`; owner,
  // 2026-09-18). Before that the world's second tick closed the die, and a throttled page slower than that never saw it.
  const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, hasTouch, reducedMotion: 'no-preference' });
  await context.addInitScript(INSTRUMENT);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.stack || error.message));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const began = Date.now();
  await page.goto(app.url + game.path);
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'running' && window.__camera, null, { timeout: 180000 });
  const loadMs = Date.now() - began;
  // Making the family and walking it to its house are the setting, not what is measured: done at the computer's own speed and
  // throttled again before the first view is drawn for the gestures. Done throttled, the making of the family ran past its
  // steps' waits about one run in three, and the proof went on with the founding family unrolled and its making still to come
  // over the map mid-run, or stopped on a timeout (2026-09-18).
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  // The family's last name and the parents' looks, asked for before anything else (owner, 2026-09-17); unanswered, they cover
  // the middle of the map where the gestures land.
  await meetFamily(page);
  // Made, not skipped: rolled and named, the curtain down.
  const family = await page.evaluate(async () => ({ family: (await (await fetch('/api/family')).json()).family, curtain: document.querySelector('#creation')?.hidden === false }));
  if (!family.family?.roll || !family.family.surname || family.curtain) throw new Error(`the family was not made before the gestures: ${JSON.stringify({ roll: family.family?.roll ?? null, surname: family.family?.surname ?? null, curtain: family.curtain })}`);
  await clearOverlays(page);
  // Past the arrival and the house site, chosen as a neighbour chooses it (sim/neighbours.mjs `pickSite`) and sent through the
  // student's own API: while a family is choosing its site a tap on the map is a place, not a person.
  for (const deadline = Date.now() + 180000; Date.now() < deadline; await sleep(500)) {
    const land = await page.evaluate(() => window.__snapshot.world.land);
    if (!land?.choosingSite) break;
    if (!land.choosingSite.can) continue;
    for (const point of pickSite(land.grant.bounds, land.choosingSite.mark)) {
      const status = await page.evaluate(async point => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `site-${Date.now()}`, action: 'choose-site', ...point }) })).status, point);
      if (status === 200) break;
    }
  }
  await page.waitForFunction(() => !window.__snapshot.world.land?.choosingSite, null, { timeout: 60000 });
  // And the family there: once the site is chosen they walk to it, and a person on the road is no target for a tap - the
  // taps waited up to twenty seconds for somebody standing and found only walkers (2026-09-18).
  await page.waitForFunction(() => (window.__snapshot.world.entities || []).filter(e => e.kind === 'person').every(e => !e.travel), null, { timeout: 180000 });
  await page.waitForTimeout(1500);
  await clearOverlays(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  // Every view the gestures use, visited once and left to settle: the first drawing of a place at a new zoom fills the woods
  // and relief caches, which is the drawing's cost, not navigation's, and would otherwise land on whichever gesture came first.
  for (const name of ['home', 'out', 'out', 'follow', 'home']) await view(page, name);
  await page.waitForTimeout(3000);
  return { page, cdp, context, loadMs };
}

/** Every gesture once, on a fresh throttled page for the mouse and touchpad and another for touch. Returns what was measured. */
export async function runNavigation({ browser, app, rate = 6, tickMs, shot = null }) {
  const errors = [], gestures = {};
  const log = (name, value) => { gestures[name] = value; console.log(name.padEnd(30), JSON.stringify(value)); };

  // ============================================================================================ mouse, wheel and touchpad
  const { page, cdp, context, loadMs } = await openGame({ browser, app, rate, hasTouch: false, errors });
  log('load (context only)', { msToRunningAndDrawn: loadMs });
  log('idle map (context only)', await page.evaluate(async () => {
    const from = window.__nav.draws.length; await new Promise(r => setTimeout(r, 3000));
    const d = window.__nav.draws.slice(from);
    return { drawsIn3s: d.length, drawMsMedian: Math.round(d.map(x => x.done - x.at).sort((a, b) => a - b)[Math.floor(d.length / 2)] || 0) };
  }));

  // -- mouse drag: 60 moves a second for a second, 400 px right and 150 down
  await view(page, 'home');
  let start = await openGround(page), before = await cam(page), from = await mark(page);
  let shown = await selection(page);
  const drag = [mouse('mousePressed', start.x, start.y)];
  for (let i = 1; i <= 60; i++) drag.push(mouse('mouseMoved', start.x + 400 * i / 60, start.y + 150 * i / 60));
  drag.push(mouse('mouseReleased', start.x + 400, start.y + 150, 0));
  await stream(cdp, drag, errors);
  let stats = await analyse(page, from, ['pointermove']), after = await cam(page);
  log('mouse drag', { ...stats, endErrorPx: panError(before, after, 400, 150), takenForATap: (await selection(page)) !== shown });
  if (shot) await shot(page, 'after-drag');

  // -- mouse wheel: three notches out, 120 ms apart
  await view(page, 'home');
  start = await openGround(page); before = await cam(page); from = await mark(page);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y });
  await stream(cdp, [0, 1, 2].map(() => ['Input.dispatchMouseEvent', { type: 'mouseWheel', x: start.x, y: start.y, deltaX: 0, deltaY: 100 }]), errors, 120);
  stats = await analyse(page, from, ['wheel']); after = await cam(page);
  log('mouse wheel 3 notches out', { ...stats, zoom: +(after.scale / before.scale).toFixed(4), anchorErrorPx: drift(before, after, start) });

  // -- touchpad two-finger scroll: thirty deltas of 4 px (a gentle swipe, 120 px of scroll in all)
  await view(page, 'home');
  start = await openGround(page); before = await cam(page); from = await mark(page);
  await stream(cdp, Array.from({ length: 30 }, () => ['Input.dispatchMouseEvent', { type: 'mouseWheel', x: start.x, y: start.y, deltaX: 0, deltaY: 4 }]), errors);
  stats = await analyse(page, from, ['wheel']); after = await cam(page);
  log('touchpad scroll 30x4', { ...stats, zoom: +(after.scale / before.scale).toFixed(4), anchorErrorPx: drift(before, after, start) });

  // -- touchpad pinch: Chrome sends it as ctrlKey wheel events. Thirty of deltaY -1.35 is fingers spreading about 1.5 times.
  await view(page, 'home'); await view(page, 'out'); await view(page, 'out');
  start = await openGround(page); before = await cam(page); from = await mark(page);
  await stream(cdp, Array.from({ length: 30 }, () => ['Input.dispatchMouseEvent', { type: 'mouseWheel', x: start.x, y: start.y, deltaX: 0, deltaY: -1.35, modifiers: 2 }]), errors);
  stats = await analyse(page, from, ['wheel']); after = await cam(page);
  log('touchpad pinch 30x-1.35', { ...stats, zoom: +(after.scale / before.scale).toFixed(4), anchorErrorPx: drift(before, after, start), pageZoom: await page.evaluate(() => window.visualViewport.scale) });

  // -- a touchpad tap-click that moves the pointer 5 px between press and release, on a person
  await goClose(page);
  let person = await personOnScreen(page);
  if (person) {
    await stream(cdp, [mouse('mousePressed', person.x, person.y), mouse('mouseMoved', person.x + 3, person.y + 2), mouse('mouseMoved', person.x + 5, person.y + 3), mouse('mouseReleased', person.x + 5, person.y + 3, 0)], errors, 30);
    await page.waitForTimeout(1500);
    const got = await selection(page);
    log('touchpad tap, 5px jitter', { person: person.id, room: Math.round(person.room), chose: got, selected: got === person.id });
  } else log('touchpad tap, 5px jitter', { skipped: 'no person on screen' });

  // -- a click straight after a short drag, where the drag has put the person, sent before the page has drawn it
  await goClose(page);
  person = await personOnScreen(page, { left: 80 });
  if (person) {
    const ground = await openGround(page);
    const pull = [mouse('mousePressed', ground.x, ground.y)];
    for (let i = 1; i <= 10; i++) pull.push(mouse('mouseMoved', ground.x - 8 * i, ground.y));
    pull.push(mouse('mouseReleased', ground.x - 80, ground.y, 0), mouse('mousePressed', person.x - 80, person.y), mouse('mouseReleased', person.x - 80, person.y, 0));
    await stream(cdp, pull, errors);
    await page.waitForTimeout(2000);
    const got = await selection(page);
    const after = (await spotsNow(page)).find(spot => spot.id === person.id);
    const scene = await page.evaluate(({ x, y }) => {
      const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect(), under = document.elementFromPoint(x, y);
      const near = Object.entries(window.__drawnAt || {}).map(([id, s]) => ({ id, d: Math.round(Math.hypot(rect.x + s.x * rect.width / canvas.width - x, rect.y + s.y * rect.height / canvas.height - y)), size: Math.round(s.size) })).filter(one => one.d < 40);
      const shownOverlays = [...document.querySelectorAll('#creation, #tutorial, #selection, #survey, #site-panel, #interior')].filter(node => !node.hidden && getComputedStyle(node).display !== 'none').map(node => node.id);
      const inputs = (window.__nav?.inputs || []).slice(-6).map(input => input.type);
      return { under: under ? (under.id || under.className || under.tagName) : null, near, overlays: shownOverlays, lastInputs: inputs, selectedId: document.querySelector('#selection')?.dataset.entityId || null };
    }, { x: person.x - 80, y: person.y });
    if (got !== person.id) await page.screenshot({ path: 'test-results/navigation-click-after-drag.png' }).catch(() => {});
    log('click right after a drag', { person: person.id, chose: got, selected: got === person.id, clickedAt: { x: person.x - 80, y: person.y }, standsAt: after ? { x: Math.round(after.x), y: Math.round(after.y) } : null, missPx: after ? Math.round(Math.hypot(after.x - (person.x - 80), after.y - person.y)) : null, scene });
  } else log('click right after a drag', { skipped: 'no person on screen' });

  // -- Follow does not fight a drag: press Follow, hold a drag across three snapshots, let go, wait three more
  await view(page, 'follow');
  start = await openGround(page); before = await cam(page); from = await mark(page);
  const hold = [mouse('mousePressed', start.x, start.y)];
  for (let i = 1; i <= 20; i++) hold.push(mouse('mouseMoved', start.x + 6 * i, start.y));
  await stream(cdp, hold, errors);
  for (const heldAt = Date.now(); Date.now() - heldAt < tickMs * 3.2; await sleep(100)) await cdp.send(...mouse('mouseMoved', start.x + 120 + ((Date.now() / 200 | 0) % 2), start.y));
  await cdp.send(...mouse('mouseReleased', start.x + 120, start.y, 0));
  await page.waitForTimeout(400);
  const released = await cam(page);
  await page.waitForTimeout(tickMs * 3.2);
  const later = await cam(page);
  const held = (await page.evaluate(from => window.__nav.draws.slice(from.draws), from)).slice(-40);
  log('Follow, then drag held 3 ticks', {
    endErrorPx: panError(before, released, 120, 0),
    movedAfterReleasePx: Math.round(Math.hypot((later.cx - released.cx) * later.scale, (later.cy - released.cy) * later.scale)),
    worstJumpLateInHoldPx: Math.round(Math.max(0, ...held.filter(d => d.scale === released.scale).map(d => Math.hypot((d.cx - released.cx) * d.scale, (d.cy - released.cy) * d.scale)))),
    followingAfter: later.following,
  });

  // -- the view buttons: Land, Follow, zoom in
  for (const name of ['home', 'follow', 'in']) {
    from = await mark(page);
    await clearOverlays(page);
    await page.locator(`#map-nav [data-view=${name}]`).click();
    await page.waitForTimeout(1500);
    const nav = await page.evaluate(from => ({ draws: window.__nav.draws.slice(from.draws), inputs: window.__nav.inputs.slice(from.inputs) }), from);
    const up = nav.inputs.find(i => i.type === 'pointerup');
    const frame = up && nav.draws.find(d => d.at >= up.handled);
    log(`view button ${name}`, { latencyMs: frame ? Math.round(frame.done - up.ts) : null });
  }

  // -- keyboard: the map focused, an arrow and plus
  await view(page, 'home');
  before = await cam(page);
  await page.locator('#world-map').focus();
  const focused = await page.evaluate(() => document.activeElement?.id === 'world-map');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(800);
  const panned = await cam(page);
  await page.keyboard.press('+');
  await page.waitForTimeout(800);
  after = await cam(page);
  log('keyboard arrow and +', { focusable: focused, panPx: Math.round((panned.cx - before.cx) * before.scale), zoom: +(after.scale / panned.scale).toFixed(4) });
  await context.close();

  // ================================================================================================= touch
  // One page at a time: two throttled pages share this computer's CPU and would measure each other.
  const touch = await openGame({ browser, app, rate, hasTouch: true, errors });
  const tp = touch.page, tc = touch.cdp;

  // -- one-finger pan
  await view(tp, 'home');
  start = await openGround(tp); before = await cam(tp); from = await mark(tp);
  const pan = [finger('touchStart', [[start.x, start.y]])];
  for (let i = 1; i <= 60; i++) pan.push(finger('touchMove', [[start.x + 300 * i / 60, start.y + 100 * i / 60]]));
  pan.push(finger('touchEnd', []));
  await stream(tc, pan, errors);
  stats = await analyse(tp, from, ['pointermove']); after = await cam(tp);
  log('touch pan', { ...stats, endErrorPx: panError(before, after, 300, 100) });

  // -- two-finger pinch out, fingers 100 px apart to 200 px apart about one centre
  await view(tp, 'home'); await view(tp, 'out'); await view(tp, 'out');
  start = await openGround(tp); before = await cam(tp); from = await mark(tp);
  const pinch = [finger('touchStart', [[start.x - 50, start.y], [start.x + 50, start.y]])];
  for (let i = 1; i <= 45; i++) { const half = 50 + 50 * i / 45; pinch.push(finger('touchMove', [[start.x - half, start.y], [start.x + half, start.y]])); }
  pinch.push(finger('touchEnd', []));
  await stream(tc, pinch, errors);
  stats = await analyse(tp, from, ['pointermove']); after = await cam(tp);
  log('touch pinch 2x', { ...stats, zoom: +(after.scale / before.scale).toFixed(4), anchorErrorPx: drift(before, after, start) });

  // -- a pinch whose last finger lifts on a person must not choose them: the fingers spread about a point 62 px left of the
  //    person, the left finger lifts first, and the right one lifts on the person.
  await goClose(tp);
  person = await personOnScreen(tp);
  if (person) {
    shown = await selection(tp);
    const middle = person.x - 62;
    const small = [finger('touchStart', [[middle - 40, person.y], [middle + 40, person.y]])];
    for (let i = 1; i <= 15; i++) small.push(finger('touchMove', [[middle - 40 - i * 22 / 15, person.y], [middle + 40 + i * 22 / 15, person.y]]));
    // CDP lifts a finger by leaving it out of a touchMove.
    small.push(['Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: middle + 62, y: person.y, id: 1, radiusX: 8, radiusY: 8, force: 1 }] }]);
    small.push(finger('touchEnd', []));
    await stream(tc, small, errors);
    await tp.waitForTimeout(1500);
    const now = await selection(tp);
    log('pinch lifted over a person', { person: person.id, before: shown, after: now, takenForATap: now !== shown });
  } else log('pinch lifted over a person', { skipped: 'no person on screen' });

  // -- a finger tap that rolls 6 px, on a person
  await goClose(tp);
  person = await personOnScreen(tp);
  if (person) {
    await stream(tc, [finger('touchStart', [[person.x, person.y]]), finger('touchMove', [[person.x + 4, person.y + 3]]), finger('touchMove', [[person.x + 6, person.y + 3]]), finger('touchEnd', [])], errors, 30);
    await tp.waitForTimeout(1500);
    const got = await selection(tp);
    log('finger tap, 6px jitter', { person: person.id, chose: got, selected: got === person.id });
  } else log('finger tap, 6px jitter', { skipped: 'no person on screen' });
  if (shot) await shot(tp, 'touch');
  await touch.context.close();

  return { gestures, errors };
}

// Navigating the map on a slow computer, proved in a real browser: docs/PERFORMANCE_NAVIGATION.md (owner, 2026-09-17:
// "exceptionally laggy ... a lot of problems with being able to navigate", on a school laptop, for students on Chromebooks).
//
// tests/navigation.test.mjs proves the arithmetic (public/map-camera.js). What only a browser can show is that a hand on the
// page gets it, with the page busy: a drag pans exactly with the pointer, the wheel and a touchpad pinch zoom by what the hand
// did and keep the ground under the pointer still, Follow does not pull the map back from a drag across snapshots, a tap
// that wobbles chooses the person under it and a pinch does not, and a finger pans, pinches and taps the same.
//
// Every gesture runs on a page with the CPU throttled six times, events sent at 60 a second without waiting for the page
// (scripts/support/navigation.mjs). Same computer only: headless Chrome with touch emulated, not a Chromebook, a real touchpad
// or a touchscreen.
//
// Run: npm run test:navigation
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { wheelZoomFactor } from '../public/map-camera.js';
import { runNavigation } from './support/navigation.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const RATE = 6, TICK_MS = 1000;
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const within = (actual, expected, share) => Math.abs(actual / expected - 1) <= share;

const app = createClassroom({ seed: 'perf-nav-1', playerCount: 5, tickMs: TICK_MS, solo: true, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1');
app.url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });

try {
  const { gestures: g, errors } = await runNavigation({ browser, app, rate: RATE, tickMs: TICK_MS });
  console.log('');
  const present = name => { assert.ok(g[name] && !g[name].skipped, `${name}: ${g[name]?.skipped || 'not run'}`); return g[name]; };

  const drag = present('mouse drag');
  assert.ok(drag.endErrorPx <= 2, `the drag ended ${drag.endErrorPx} px from the pointer`);
  assert.equal(drag.takenForATap, false, 'a drag chose somebody');
  // Loose on purpose: frames a second move with whatever else this computer is doing (other sessions share its CPU). What
  // must hold under any load is that a drag is shown by moving the last drawing (public/app.js handOnMap), not only by
  // drawing the whole map; the old page never did.
  assert.ok(drag.movedPictures >= 1, `the drag was only ever drawn whole: ${drag.wholeDraws} whole draws, no moved pictures`);
  ok(`a mouse drag pans exactly with the pointer (${drag.endErrorPx} px off), shown by ${drag.movedPictures} moved pictures and ${drag.wholeDraws} whole draws, latency median ${drag.latency.median} ms`);

  const notches = present('mouse wheel 3 notches out'), notch = wheelZoomFactor({ deltaY: 100 }) ** 3;
  assert.ok(within(notches.zoom, notch, .005), `three notches zoomed ${notches.zoom}, not ${notch.toFixed(4)}: a notch was lost`);
  assert.ok(notches.anchorErrorPx <= 2, `the ground under the cursor slid ${notches.anchorErrorPx} px`);
  ok(`three wheel notches zoom by all three (${notches.zoom}) and the ground under the cursor stays put (${notches.anchorErrorPx} px)`);

  const swipe = present('touchpad scroll 30x4'), swipeExpected = wheelZoomFactor({ deltaY: 120 });
  assert.ok(within(swipe.zoom, swipeExpected, .005), `a gentle touchpad swipe zoomed ${swipe.zoom}, not ${swipeExpected.toFixed(4)}`);
  assert.ok(swipe.anchorErrorPx <= 2, `swipe anchor slid ${swipe.anchorErrorPx} px`);
  assert.ok(swipe.settleMs !== null && swipe.settleMs <= 1500, `the map settled ${swipe.settleMs} ms after the swipe ended`);
  ok(`a touchpad swipe of 30 small deltas zooms as far as its travel (${swipe.zoom}), anchored, and settles ${swipe.settleMs} ms after the fingers stop`);

  const pinchPad = present('touchpad pinch 30x-1.35');
  assert.ok(within(pinchPad.zoom, 1.5, .01), `a touchpad pinch of 1.5 zoomed ${pinchPad.zoom}`);
  assert.ok(pinchPad.anchorErrorPx <= 2, `pinch anchor slid ${pinchPad.anchorErrorPx} px`);
  assert.equal(pinchPad.pageZoom, 1, 'the touchpad pinch zoomed the page instead of the map');
  assert.ok(pinchPad.settleMs !== null && pinchPad.settleMs <= 1500, `the map settled ${pinchPad.settleMs} ms after the pinch ended`);
  ok(`a touchpad pinch zooms the map, not the page, by the fingers' 1.5 (${pinchPad.zoom}), anchored, settling in ${pinchPad.settleMs} ms`);

  const padTap = present('touchpad tap, 5px jitter');
  assert.equal(padTap.selected, true, `a touchpad click that moved 5 px chose ${padTap.chose}, not ${padTap.person}`);
  ok(`a touchpad click that moves 5 px between press and release chooses the person under it (${padTap.person})`);

  const quick = present('click right after a drag');
  assert.equal(quick.selected, true, `a click sent straight after a drag chose ${quick.chose}, not ${quick.person}`);
  ok(`a click sent straight after a drag, before the page has drawn it, chooses the person where the drag put them (${quick.person})`);

  const follow = present('Follow, then drag held 3 ticks');
  assert.ok(follow.endErrorPx <= 2, `Follow pulled the drag ${follow.endErrorPx} px`);
  assert.ok(follow.worstJumpLateInHoldPx <= 3, `the map jumped ${follow.worstJumpLateInHoldPx} px while held across snapshots`);
  assert.ok(follow.movedAfterReleasePx <= 2, `the camera moved ${follow.movedAfterReleasePx} px after the drag let go`);
  assert.equal(follow.followingAfter, false);
  ok(`from Follow, a drag held across three snapshots stays where the hand put it (${follow.endErrorPx} px) and is still there three snapshots later`);

  const keys = present('keyboard arrow and +');
  assert.equal(keys.focusable, true, 'the map cannot take the keyboard');
  assert.ok(Math.abs(keys.panPx - Math.round(1366 / 8)) <= 2, `an arrow panned ${keys.panPx} px`);
  assert.ok(within(keys.zoom, 1.4, .005), `+ zoomed ${keys.zoom}`);
  ok(`with the map focused, an arrow pans an eighth of the view (${keys.panPx} px) and + zooms in (${keys.zoom})`);

  const pan = present('touch pan');
  assert.ok(pan.endErrorPx <= 2, `a finger pan ended ${pan.endErrorPx} px from the finger`);
  assert.ok(pan.movedPictures >= 1, `the finger pan was only ever drawn whole: ${pan.wholeDraws} whole draws, no moved pictures`);
  ok(`a finger pans exactly (${pan.endErrorPx} px off), shown by ${pan.movedPictures} moved pictures and ${pan.wholeDraws} whole draws, latency median ${pan.latency.median} ms`);

  const pinch = present('touch pinch 2x');
  assert.ok(within(pinch.zoom, 2, .01), `a two-finger pinch to twice the spread zoomed ${pinch.zoom}`);
  assert.ok(pinch.anchorErrorPx <= 3, `the ground between the fingers slid ${pinch.anchorErrorPx} px`);
  ok(`two fingers spread to twice apart zoom twice (${pinch.zoom}) about the point between them (${pinch.anchorErrorPx} px)`);

  const lifted = present('pinch lifted over a person');
  assert.equal(lifted.takenForATap, false, `a pinch whose last finger lifted on ${lifted.person} changed the card to ${lifted.after}`);
  ok('a pinch whose last finger lifts on a person does not choose them');

  const fingerTap = present('finger tap, 6px jitter');
  assert.equal(fingerTap.selected, true, `a finger tap that rolled 6 px chose ${fingerTap.chose}, not ${fingerTap.person}`);
  ok(`a finger tap that rolls 6 px chooses the person under it (${fingerTap.person})`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/navigation-browser.json', `${JSON.stringify({
    record: 'navigation-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'Navigating the map on a slow computer: drag, wheel, touchpad swipe and pinch, taps that wobble, Follow across snapshots, keyboard, and touch pan, pinch and tap.',
    environment: `Same computer: an in-process Play Solo classroom on the colonies map at ${TICK_MS} ms a tick, headless Chrome at 1366 by 768 with the CPU throttled ${RATE} times and touch emulated through CDP. Not a Chromebook, a real touchpad or a touchscreen.`,
    checks: pass,
    measured: g,
    notProved: [
      'A real Chromebook, touchpad or touchscreen: CDP input emulates the events, not the hardware or ChromeOS gesture handling.',
      'Timings on this computer vary with its other work; the thresholds here are deliberately loose and the numbers in docs/PERFORMANCE_NAVIGATION.md are medians of repeated runs.',
      'The cost of a whole map draw and of a snapshot render, which are not navigation (see docs/PERFORMANCE_NAVIGATION.md, What remains).',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/navigation-browser.json`);
} finally {
  await browser.close();
  await app.close();
}

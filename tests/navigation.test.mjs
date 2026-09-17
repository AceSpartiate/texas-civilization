// How the map answers a hand (public/map-camera.js, docs/PERFORMANCE_NAVIGATION.md): owner, 2026-09-17, "a lot of problems
// with being able to navigate" on a school laptop, for students on Chromebooks with touchpads and touchscreens.
//
// The browser proof (scripts/navigation-browser-proof.mjs) shows the gestures on a throttled page; these check the arithmetic
// the page runs, each one the rule a measured failure broke.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  QUICK_FRAME, TAP_SLOP, frameTransform, gestureView, isTap, keyView, nearestSpot, reproject, tapSlop, viewPlacing, wheelZoomFactor, worldAt, zoomAbout,
} from '../public/map-camera.js';

const size = { width: 1366, height: 768 };
const view = { cx: 10, cy: -4, scale: 400 };
const limits = { min: 5, max: 5000 };
const close = (actual, expected, epsilon, label) => assert.ok(Math.abs(actual - expected) <= epsilon, `${label}: ${actual} is not ${expected}`);

test('a touchpad swipe of many small deltas zooms about as much as a mouse notch of the same travel, not once a event', () => {
  // Thirty deltas of 4 pixels is 120 pixels of scroll: a notch and a bit. The old fixed step zoomed 1.15 a event: 66 times.
  let swipe = 1;
  for (let i = 0; i < 30; i++) swipe *= wheelZoomFactor({ deltaY: 4 });
  const notch = wheelZoomFactor({ deltaY: 100 });
  assert.ok(notch < 1 && notch > .8, `a notch down zooms out a little: ${notch}`);
  close(swipe, wheelZoomFactor({ deltaY: 120 }), 1e-9, 'the swipe is the sum of its deltas');
  assert.ok(swipe > .75, `a gentle swipe zoomed out ${1 / swipe} times`);
});

test('two wheel events Chrome coalesced into one zoom exactly as far as the two apart', () => {
  // On a busy page Chrome hands the page one wheel event carrying the summed delta; a fixed step lost a notch each time.
  close(wheelZoomFactor({ deltaY: 200 }), wheelZoomFactor({ deltaY: 100 }) ** 2, 1e-12, 'coalesced notches');
});

test('a touchpad pinch (ctrlKey wheel) follows the fingers: deltas summing to -100 ln 1.5 zoom 1.5', () => {
  let pinch = 1;
  const each = -100 * Math.log(1.5) / 30;
  for (let i = 0; i < 30; i++) pinch *= wheelZoomFactor({ deltaY: each, ctrlKey: true });
  close(pinch, 1.5, 1e-9, 'pinch');
});

test('lines and pages are turned into pixels, and no single event more than doubles or halves the view', () => {
  close(wheelZoomFactor({ deltaY: 3, deltaMode: 1 }), wheelZoomFactor({ deltaY: 48 }), 1e-12, 'three lines');
  assert.equal(wheelZoomFactor({ deltaY: -1, deltaMode: 2, ctrlKey: true }), 2);
  assert.equal(wheelZoomFactor({ deltaY: 5000 }), .5);
  assert.equal(wheelZoomFactor({ deltaY: 0 }), 1);
  assert.equal(wheelZoomFactor({ deltaY: NaN }), 1);
});

test('zooming keeps the ground under the pointer still', () => {
  const pointer = { x: 1100, y: 200 };
  const before = worldAt(view, pointer, size);
  const after = zoomAbout(view, 1.7, pointer, size, limits);
  const still = worldAt(after, pointer, size);
  close(after.scale, 680, 1e-9, 'scale');
  close(still.x, before.x, 1e-12, 'x'); close(still.y, before.y, 1e-12, 'y');
  // At a limit the scale stops and the pointer's ground still does not slide.
  const capped = zoomAbout(view, 100, pointer, size, limits);
  assert.equal(capped.scale, limits.max);
  close(worldAt(capped, pointer, size).x, before.x, 1e-12, 'capped x');
});

test('a pinch zooms about the fingers, and the ground between them follows them as they move', () => {
  const start = { view, centre: { x: 900, y: 500 }, spread: 100 };
  const under = worldAt(view, start.centre, size);
  const moved = { x: 950, y: 460 };
  const after = gestureView(start, moved, 200, size, limits);
  close(after.scale, 800, 1e-9, 'scale doubles with the spread');
  const now = worldAt(after, moved, size);
  close(now.x, under.x, 1e-12, 'x'); close(now.y, under.y, 1e-12, 'y');
});

test('a one-finger drag moves the map exactly with the finger', () => {
  const start = { view, centre: { x: 600, y: 400 }, spread: 0 };
  const after = gestureView(start, { x: 900, y: 500 }, 0, size, limits);
  assert.equal(after.scale, view.scale);
  close((view.cx - after.cx) * view.scale, 300, 1e-9, 'x'); close((view.cy - after.cy) * view.scale, 100, 1e-9, 'y');
});

test('a tap may wander further for a finger than for a mouse, and never with a second finger down', () => {
  assert.ok(TAP_SLOP.touch > TAP_SLOP.mouse);
  assert.equal(isTap({ travelled: 6, pointerType: 'touch', pointers: 1 }), true, 'a finger tap that rolled 6 px');
  assert.equal(isTap({ travelled: 5, pointerType: 'mouse', pointers: 1 }), true, 'a touchpad click that moved 5 px');
  assert.equal(isTap({ travelled: 12, pointerType: 'mouse', pointers: 1 }), false, 'a short mouse drag');
  assert.equal(isTap({ travelled: 0, pointerType: 'touch', pointers: 2 }), false, 'a pinch let go over a person');
  assert.equal(tapSlop('something-new'), TAP_SLOP.touch, 'an unknown pointer is given the generous slop');
});

test('a tap after the camera moved finds the person where the camera now puts them', () => {
  const drawnUnder = view;
  const panned = { ...view, cx: view.cx - 80 / view.scale };
  const spots = new Map([['rosa', { x: 700, y: 400, size: 30 }], ['ox', { x: 760, y: 400, size: 44 }]]);
  const now = new Map([...spots].map(([id, spot]) => [id, reproject(spot, drawnUnder, panned, size)]));
  close(now.get('rosa').x, 780, 1e-9, 'moved with the camera');
  assert.equal(nearestSpot(now, { x: 780, y: 400 }), 'rosa');
  const zoomed = zoomAbout(view, 2, { x: 700, y: 400 }, size, limits);
  assert.equal(reproject(spots.get('ox'), drawnUnder, zoomed, size).size, 88, 'a figure grows with the zoom');
  assert.equal(reproject(spots.get('rosa'), drawnUnder, drawnUnder, size), spots.get('rosa'), 'no move, same spot');
});

test('the nearest figure within a fingertip wins, and nothing is chosen from open ground', () => {
  const spots = new Map([['rosa', { x: 100, y: 100, size: 30 }], ['thomas', { x: 130, y: 100, size: 30 }]]);
  assert.equal(nearestSpot(spots, { x: 120, y: 100 }), 'thomas');
  assert.equal(nearestSpot(spots, { x: 400, y: 400 }), null);
});

test('the keyboard pans an eighth of the view and zooms about the middle', () => {
  const right = keyView(view, 'ArrowRight', size, limits);
  close((right.cx - view.cx) * view.scale, size.width / 8, 1e-9, 'right');
  const zoomIn = keyView(view, '+', size, limits);
  close(zoomIn.cx, view.cx, 1e-12, 'middle stays'); close(zoomIn.scale, 560, 1e-9, 'in');
  assert.equal(keyView(view, 'a', size, limits), null);
  const placed = viewPlacing({ x: 1, y: 2 }, { x: size.width / 2, y: size.height / 2 }, 50, size);
  assert.deepEqual(placed, { cx: 1, cy: 2, scale: 50 });
});

test('a picture of the map moved for a new view lands where a new drawing would put the same ground', () => {
  const to = zoomAbout({ ...view, cx: view.cx + 90 / view.scale }, 1.3, { x: 500, y: 300 }, size, limits);
  const move = frameTransform(view, to, size);
  // Any point of the old picture, placed by the transform, is where the new view draws the ground it showed.
  for (const pixel of [{ x: 0, y: 0 }, { x: 683, y: 384 }, { x: 1200, y: 700 }]) {
    const drawn = { x: move.x + pixel.x * move.ratio, y: move.y + pixel.y * move.ratio };
    const ground = worldAt(view, pixel, size), now = worldAt(to, drawn, size);
    close(now.x, ground.x, 1e-9, 'x'); close(now.y, ground.y, 1e-9, 'y');
  }
  assert.equal(move.usable, true);
  // Panned most of a screen away, or zoomed far, it is no longer fit to show: the map is drawn again.
  const far = frameTransform(view, { ...view, cx: view.cx + size.width * .7 / view.scale }, size);
  assert.ok(far.covered < QUICK_FRAME.minCovered && !far.usable, `covered ${far.covered}`);
  assert.equal(frameTransform(view, { ...view, scale: view.scale * 3 }, size).usable, false);
  assert.equal(frameTransform(view, view, size).covered, 1);
});

test('the page takes its navigation from public/map-camera.js and the server serves it', () => {
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const server = readFileSync(new URL('../server/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /from '\/map-camera\.js'/);
  assert.match(server, /\['\/map-camera\.js', \['\.\.\/public\/map-camera\.js'/);
});

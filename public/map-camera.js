// How the map answers a hand: panning, zooming, pinching and telling a tap from a drag (docs/PERFORMANCE_NAVIGATION.md).
//
// Pure arithmetic on a view `{ cx, cy, scale }` (the world point at the middle of the canvas, and canvas pixels a mile) and
// points in canvas pixels. Nothing here reads the DOM, the world or the clock, so tests/navigation.test.mjs checks every rule
// in Node and public/app.js only wires it to events. Owner, 2026-09-17: "exceptionally laggy ... a lot of problems with being
// able to navigate" on a school laptop; students will use Chromebooks with touchpads and touchscreens.

/**
 * How far, in CSS pixels, a press may wander and still be a tap. A finger rolls as it lifts and a touchpad click moves the
 * pointer under the click; a mouse barely moves. In CSS pixels, not canvas pixels: the old 7 canvas pixels shrank to 3.5 on a
 * two-times screen (many touchscreen Chromebooks), where a finger's ordinary roll would have chosen nobody. A second finger
 * ever down makes the press a pinch, never a tap, wherever the last finger lifts.
 */
export const TAP_SLOP = Object.freeze({ mouse: 6, pen: 10, touch: 14 });
export const tapSlop = pointerType => TAP_SLOP[pointerType] ?? TAP_SLOP.touch;

/** A press is a tap only if one pointer was ever down and it never wandered beyond its slop. */
export function isTap({ travelled, pointerType, pointers }) {
  return pointers === 1 && travelled <= tapSlop(pointerType);
}

// Wheel deltas arrive in pixels, lines or pages (WheelEvent.deltaMode 0, 1, 2).
const DELTA_UNIT = [1, 16, 800];
/** A mouse notch (deltaY 100) zooms by about 1.18; a touchpad's many small deltas add up to the same for the same travel. */
export const WHEEL_ZOOM_RATE = Math.log(1.18) / 100;
/**
 * Chrome sends a touchpad pinch as wheel events with ctrlKey, with deltaY about -100 times the log of the pinch's change of
 * scale, so undoing that makes the map follow the fingers exactly.
 */
export const PINCH_ZOOM_RATE = 1 / 100;
/** One event never more than doubles or halves the view, whatever a driver sends. */
export const MAX_EVENT_ZOOM = 2;

/**
 * The factor one wheel event zooms by: above 1 is in. Proportional to the delta rather than a fixed step, because a touchpad
 * sends dozens of tiny deltas where a mouse sends one large one, and because Chrome coalesces wheel events on a busy page into
 * one event carrying the summed delta. A fixed step a event made a gentle touchpad swipe zoom nine times over, and lost whole
 * mouse notches when the page was slow (measured 2026-09-17).
 */
export function wheelZoomFactor({ deltaY = 0, deltaMode = 0, ctrlKey = false }) {
  const pixels = deltaY * (DELTA_UNIT[deltaMode] ?? 1);
  if (!Number.isFinite(pixels) || pixels === 0) return 1;
  const factor = Math.exp(-pixels * (ctrlKey ? PINCH_ZOOM_RATE : WHEEL_ZOOM_RATE));
  return Math.max(1 / MAX_EVENT_ZOOM, Math.min(MAX_EVENT_ZOOM, factor));
}

const clamp = (value, limits) => limits ? Math.max(limits.min, Math.min(limits.max, value)) : value;

/** The world point under a canvas point. */
export function worldAt(view, point, size) {
  return { x: view.cx + (point.x - size.width / 2) / view.scale, y: view.cy + (point.y - size.height / 2) / view.scale };
}

/** The view at `scale` that puts world point `world` under canvas point `point`. */
export function viewPlacing(world, point, scale, size) {
  return { cx: world.x - (point.x - size.width / 2) / scale, cy: world.y - (point.y - size.height / 2) / scale, scale };
}

/** Zoom by `factor` keeping the ground under `point` still, the way a map does, within `limits`. */
export function zoomAbout(view, factor, point, size, limits) {
  const scale = clamp(view.scale * factor, limits);
  return viewPlacing(worldAt(view, point, size), point, scale, size);
}

/**
 * A drag or a pinch, from where it began to where the pointers are now. `start` is the view and the pointers' centre and
 * spread when the gesture began (or last changed its number of pointers); the ground that was under the starting centre stays
 * under the current centre, and the scale follows the fingers' spread. Anchored at the fingers, not the middle of the screen:
 * the old pinch zoomed about the middle, so the place between the fingers slid away as they spread.
 */
export function gestureView(start, centre, spread, size, limits) {
  const scale = start.spread > 12 && spread > 12 ? clamp(start.view.scale * spread / start.spread, limits) : start.view.scale;
  return viewPlacing(worldAt(start.view, start.centre, size), centre, scale, size);
}

/** A keyboard step: arrows pan an eighth of the view, + and - zoom about the middle. Null for any other key. */
export function keyView(view, key, size, limits) {
  const stepX = size.width / 8 / view.scale, stepY = size.height / 8 / view.scale;
  const middle = { x: size.width / 2, y: size.height / 2 };
  switch (key) {
    case 'ArrowLeft': return { ...view, cx: view.cx - stepX };
    case 'ArrowRight': return { ...view, cx: view.cx + stepX };
    case 'ArrowUp': return { ...view, cy: view.cy - stepY };
    case 'ArrowDown': return { ...view, cy: view.cy + stepY };
    case '+': case '=': return zoomAbout(view, 1.4, middle, size, limits);
    case '-': case '_': return zoomAbout(view, 1 / 1.4, middle, size, limits);
    default: return null;
  }
}

/**
 * Where a spot drawn under one view is under another. Figures are hit-tested where they were last drawn, which is what the
 * student saw; but a tap can arrive after the camera has moved and before the next frame has been drawn (a quick drag and
 * tap on a slow computer), and it must hit the person where the camera now puts them, not where they stood a frame ago.
 */
export function reproject(spot, from, to, size) {
  if (!from || (from.cx === to.cx && from.cy === to.cy && from.scale === to.scale)) return spot;
  const world = worldAt(from, spot, size), ratio = to.scale / from.scale;
  return { ...spot, x: size.width / 2 + (world.x - to.cx) * to.scale, y: size.height / 2 + (world.y - to.cy) * to.scale, size: spot.size * ratio };
}

/** A picture of the map drawn under `from` is only shown moved and scaled for `to` while it is this close to right. */
export const QUICK_FRAME = Object.freeze({ minZoom: .5, maxZoom: 2, minCovered: .5 });

/**
 * How to show a frame drawn under view `from` as if drawn under view `to`: draw the old picture at (x, y), `ratio` times its
 * size. `covered` is the share of the canvas the moved picture still covers; `usable` says whether it is close enough to show
 * while a gesture runs rather than drawing the whole map again.
 *
 * A whole-map draw measured 80 to 150 ms on the throttled page (2026-09-17); moving a picture of it costs a few. So while a
 * hand is on the map it moves the last picture, and the map is drawn properly the moment the hand stops.
 */
export function frameTransform(from, to, size, limits = QUICK_FRAME) {
  const ratio = to.scale / from.scale;
  const x = size.width / 2 * (1 - ratio) + (from.cx - to.cx) * to.scale;
  const y = size.height / 2 * (1 - ratio) + (from.cy - to.cy) * to.scale;
  const overlap = (start, length, whole) => Math.max(0, Math.min(whole, start + length) - Math.max(0, start)) / whole;
  const covered = overlap(x, size.width * ratio, size.width) * overlap(y, size.height * ratio, size.height);
  const usable = Number.isFinite(ratio) && ratio >= limits.minZoom && ratio <= limits.maxZoom && covered >= limits.minCovered;
  return { x, y, ratio, covered, usable };
}

/**
 * The drawn figure nearest a tap, within reach. Reach does not grow with the sprite, or a zoomed-in ox swallows the taps meant
 * for the person beside it; it does not shrink below a fingertip either.
 */
export function nearestSpot(spots, point) {
  let best = null, bestDistance = Infinity;
  for (const [id, spot] of spots) {
    const reach = Math.max(22, Math.min(64, spot.size * .55));
    const distance = Math.hypot(spot.x - point.x, spot.y - point.y);
    if (distance < reach && distance < bestDistance) { best = id; bestDistance = distance; }
  }
  return best;
}

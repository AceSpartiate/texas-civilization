# Navigating the map on a slow computer

**Status: built 2026-09-17** ([proof](evidence/navigation-browser.json), [before](evidence/perf-navigation-before.json),
[after](evidence/perf-navigation-after.json)). Scope: how panning, zooming, pinching, Follow, the view buttons and choosing a
person answer a hand. Not the cost of drawing the map, loading the page or the server's ticks, which were looked at separately.

> "I was playtesting a little and it's exceptionally laggy. Very slow to load and a lot of problems with being able to
> navigate. This was on my school laptop. There's no way it'll work on the student chromebooks right?"
>
> — owner, 2026-09-17

**What is claimed and what is not.** Every number here is from headless Chrome on the development computer with the CPU
throttled six times (CDP `Emulation.setCPUThrottlingRate`) and touch emulated through CDP. It is not a Chromebook, a real
touchpad or a touchscreen, and nothing here says the game now works on one. Other sessions were using this computer's CPU at
the same time, so timings wander; each figure is the median of three full runs.

---

## 1. Method

`node scripts/perf-navigation-measure.mjs <label> 3` (gestures in [scripts/support/navigation.mjs](../scripts/support/navigation.mjs)):

- A Play Solo game on the colonies map, five families, a snapshot every second (the Quick pace: the most snapshots a student's
  page ever has to take while they navigate), past the arrival and the house site. 1366 by 768, device scale 1.
- Input sent through CDP at 60 events a second **without waiting for the page**, as a hand does. A busy page therefore shows as
  latency, coalesced events and lost motion, not as a slower test.
- The page is instrumented before its own script runs: every map frame writes `window.__camera`, so a setter records when each
  frame began and finished. **Latency** is an input event's timestamp to the end of the first frame that began after its handler
  ran. **fps** is frames that moved the camera, a second, while the gesture ran. **Settle** is the last input to the last frame
  that moved the camera. **End error** and **anchor error** are screen pixels between where the map ended and where the pointer
  or fingers put it.
- *Before* is `public/app.js` and `public/index.html` as they were at commit `cb7b9de`; *after* is this change. Same script, same
  seed, same computer.

## 2. Before and after

Median of three runs each. The *after* runs happened while this computer was busier (a whole-map draw at rest took a median 248 ms
against 102 ms during the *before* runs), so the improvement is if anything understated.

| Gesture | Measure | Before | After |
| --- | --- | --- | --- |
| Mouse drag, 400 by 150 px in a second | latency median / p95 | 195 / 315 ms | 18 / 19 ms |
| | frames moving the map a second | 7 | 42 |
| | end error | 0 px | 0 px |
| Mouse wheel, three notches out | zoom (three notches should be 0.609) | **0.756: a notch lost** | 0.609 |
| | latency median; settle | 801 ms; 631 ms | 273 ms; 151 ms |
| Touchpad two-finger swipe, 30 deltas of 4 px | zoom (its travel is 0.820) | **0.107: 9.4 times out** | 0.820 |
| | latency median / p95; settle | 1392 / 2281 ms; 2281 ms | 55 / 238 ms; 54 ms |
| Touchpad pinch, fingers spread 1.5 times | zoom | **4.36** | 1.50 |
| | latency median / p95; settle | 1191 / 2471 ms; 1296 ms | 52 / 56 ms; 56 ms |
| | page zoomed instead of the map | no | no |
| Finger pan, 300 by 100 px in a second | moves the page heard | 4 of 60 | 46 of 60 |
| | latency median; frames a second | 1179 ms; 0.7 | 54 ms; 35 |
| Two-finger pinch to twice apart | zoom | 2 | 2 |
| | **ground between the fingers slid** | **246 px** | 0 px |
| | latency median / p95 | 850 / 1815 ms | 54 / 56 ms |
| Keyboard, map focused: an arrow, then + | | map cannot be focused | pans 171 px, zooms 1.4 |
| Touchpad click moving 5 px, on a person | chose them | yes | yes |
| Click sent straight after a drag, on a person | chose them | yes | yes |
| Finger tap rolling 6 px, on a person | chose them | yes | yes |
| Pinch whose last finger lifts on a person | taken for a tap | no | no |
| From Follow, a drag held across three snapshots | pulled back / moved after | 1 px / 0 px | 1 px / 0 px |
| View buttons Land, Follow, + | latency | 115, 190, 77 ms | 252, 83, 109 ms (same code path; load noise) |

What the table says in words: the map fell hundreds of milliseconds to seconds behind a touchpad or a finger and, once it did,
the wheel zoomed by the number of events it happened to hear rather than by what the hand did. Follow fighting a drag, a tap
missing because of stale positions, and taps turning into drags were checked and **were not** problems on this computer at a
device scale of 1.

## 3. What was wrong, most harmful first

1. **A whole-map draw for every input, and the animation's draw on top.** Every pointer move and wheel event drew the entire
   map synchronously (80–150 ms throttled on a quiet computer), and the twelve-a-second animation drew it again. The page could
   never catch up with a touchpad or a finger.
2. **The animation starved input.** Where a draw costs more than a twelfth of a second the animation drew frame after frame with
   no gap; a finger landing waited behind as many as five draws before the page heard it (840 ms from touch to `pointerdown`).
3. **The wheel zoomed a fixed 15 % an event.** A touchpad sends dozens of small deltas, so a gentle swipe zoomed nine times over;
   a touchpad pinch zoomed 4.4 times for a 1.5 pinch; and Chrome, when the page is busy, coalesces wheel events into one carrying
   the summed delta, so a slow page lost whole mouse notches.
4. **A pinch zoomed about the middle of the screen**, not between the fingers, so the place a student was pinching slid away.
5. **No keyboard at all** on the map.
6. Smaller: the tap threshold was 7 *canvas* pixels (3.5 CSS pixels on a two-times touchscreen); any jitter of a tap panned the
   map and switched Follow off; a right-click started a drag; a ctrl-wheel before the first
   snapshot zoomed the page.

## 4. What changed

- **[public/map-camera.js](../public/map-camera.js)** (new, pure, served at `/map-camera.js`): `wheelZoomFactor` (zoom
  proportional to the delta, lines and pages turned into pixels, a touchpad pinch's ctrl-wheel undone exactly, one event capped at
  2x), `zoomAbout`, `gestureView` (drag and pinch anchored at the fingers), `isTap` / `TAP_SLOP` (6 CSS px mouse, 14 touch, never
  with a second finger), `keyView`, `reproject` and `nearestSpot` (hit-testing where the camera now puts a figure), and
  `frameTransform`.
- **`public/app.js` `installMapNavigation`** rewritten on those: inputs only move the camera and ask for a frame
  (`requestMapDraw`, one draw a frame however many inputs); a press moves nothing until it passes its slop; the tap is taken where
  the press began; right and middle buttons ignored; `pointercancel` and lost capture end a gesture without a tap; the canvas
  position is read at the start of a gesture, not on every move; the wheel always prevents the page zoom.
- **While a hand is on the map, the last whole drawing is moved and scaled** (`handOnMap`, `quickFrame`) instead of drawing the
  map again, and the map is drawn properly when the hand stops: the last pointer lifts, a held pointer is still for 500 ms, or
  250 ms pass without a wheel event. A snapshot or a woods tile arriving mid-gesture waits for that too. **ceiling:** figures stand
  still during a gesture and ground panned in from beyond the old picture is plain grass until the hand stops, or until the
  picture would cover under half the view.
- **The animation never takes more than half the page's time** (`animationDrawMs` in `animateMap`). **ceiling:** it runs below
  twelve frames a second wherever a draw costs more than 42 ms; cheaper drawing raises it by itself.
- **Keyboard:** the map canvas is focusable (`tabindex="0"`, a focus ring in `public/style.css`); arrows pan an eighth of the
  view, + and − zoom.

## 5. Tests

- `tests/navigation.test.mjs`: 13 tests of the arithmetic. Each was proved by injecting the regression it guards (a fixed wheel
  step for small deltas, a large delta counted short, the pinch at the wheel rate, deltaMode ignored, zoom about the middle, the old
  centre-anchored pinch, a drag ignored, the old 3.5 px slop, pointers ignored, stale hit-testing, first-within-reach instead of
  nearest, a quarter keyboard step, a mirrored picture, a picture always usable, the route missing) and watching that test, and
  only that test, fail.
- `npm run test:navigation` ([scripts/navigation-browser-proof.mjs](../scripts/navigation-browser-proof.mjs)): 13 checks on the
  throttled page. Proved by injection too: drawing the whole map on every move fails the drag check; the old fixed wheel step fails
  the three-notch check; a pinch lifted counted as a tap at the release point fails the pinch check. Its timing checks are loose on
  purpose (settling within 1.5 s, at least one moved picture during a drag) because this computer's load moves every timing.

## 6. What remains

- **A whole-map draw is still 75–100 ms on a quiet throttled page** (200–400 ms with this computer busy), and it is still what a
  student waits for: the first input of a gesture lands behind whatever draw is under way, the map redraws properly when the hand
  stops, and the view buttons (Land, Follow, +, −) draw at once. The hot paths in a profile were `drawGroundDetail` (`inWater`,
  `distanceToLine`), `drawTerrain` / `drawWater` (`curveThrough`, `pull` in `public/curve.js`), `drawRoad` and sprite drawing.
  That is the drawing's work, not navigation's.
- **A snapshot's render** (the panels rebuilt every tick) costs main-thread time of its own on every tick, gesture or not.
- **The first view of a place at a new zoom** fills the woods and relief caches and is slower than the ones after it.
- **Not measured:** a real Chromebook, ChromeOS's own touchpad gestures (a touchpad pinch is assumed to arrive as Chrome's
  ctrl-wheel, as it does on this computer), a real touchscreen, and a device scale of 2. Two-finger touchpad scrolling still zooms,
  as the mouse wheel does, rather than panning.
- The person's card does not follow them while a hand is on the map; it catches up when the map is drawn properly. Walkers also
  stand still for 250 ms after the last wheel notch: `scripts/movement-browser-proof.mjs` now lets the zoom settle before it
  measures a walk, since it measures walking with the camera still.

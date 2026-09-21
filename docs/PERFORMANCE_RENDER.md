# What a running game costs the browser to draw

**2026-09-17.** Owner, after playing Solo on the school laptop: *"it's exceptionally laggy. Very slow to load and a lot of
problems with being able to navigate … There's no way it'll work on the student chromebooks right?"* Then: *"Rivers and
forests pop in and out of their places during zoom. their shapes and sizes change too. could we use this as an opportunity
to make this look better, as well as improve performance?"* and *"there's also desert and other land styles we need to
consider. prairie, buttes, hills, etc."*

This record covers the **cost of drawing while a game runs**: the animation loop, `render(snapshot)`, the DOM it touches,
memory and garbage; and how the map's detail changes with zoom. The page's load (`scripts/perf-load-measure.mjs`), the
server's tick and snapshot size, and pan and zoom input were other pieces of the same work, recorded elsewhere.

**Nothing here is a Chromebook measurement.** Every number is this desktop, headless Chrome 152, with the CPU slowed
six-fold through the DevTools protocol. That slows JavaScript and layout, not the GPU, memory or heat of a real Chromebook.
The numbers compare one build with another on one machine. Real Chromebook acceptance is still unproven.

## Method

`node scripts/perf-render-measure.mjs --label <name> [--root <dir>]` (`PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` as for the
proofs). What it does:

- It starts an in-process solo classroom on the colonies map: 15 families, the same seed every run, 1 s ticks. Real Solo play
  uses 9.5 s ticks, so per-snapshot cost shows up here nearly ten times as often as in a real game.
- It opens the game at 1366×768 at density 1 with the CPU throttled 6×, and answers the family's pop-ups.
- It measures four views for 30 s each:
  - `default`: the camera following the family;
  - `land`: the family's homestead, close up;
  - `town`: Gonzales;
  - `whole`: zoomed right out.
- Before any page script runs, it wraps a few browser functions:
  - `requestAnimationFrame`, to count callbacks and time each one (a *painted frame* is a callback that drew, over 1 ms);
  - the EventSource message handler, to time `render(snapshot)`, JSON parsing included;
  - `document.createElement` (count and caller) and a MutationObserver, to track DOM churn;
  - a `longtask` PerformanceObserver.
- It reads DevTools `Performance.getMetrics` for busy, script and layout time and the JS heap every 3 s, and runs a sampling
  CPU profile of each view for self-time by function.
- It counts how often the ground was redrawn (`window.__groundDrawn`).

`--root` points the same script at a copy of an earlier commit. The *before* column is commit `cb7b9de`, exported to a
scratch folder and measured with this script. Evidence: [before](evidence/perf-render-before.json),
[after](evidence/perf-render-after.json).

## Before and after

The CPU is throttled 6×. Frames are capped at 12 a second by design (`animateMap`). "Snapshot" is the time for one
`render(snapshot)`.

| View | Build | Painted fps | ms / frame (mean / p95) | ms / snapshot (mean / p95) | Long tasks / min | Main thread busy | Script | Ground redraws / s |
|---|---|---|---|---|---|---|---|---|
| default (scale 402) | before | 7.5 | 109 / 136 | 122 / 167 | 518 | 102 % | 92 % | every frame |
| | after | **10.9** | **15 / 19** | 63 / 90 | **73** | **41 %** | 23 % | 1.2 |
| land (scale 2132) | before | 4.5 | 179 / 209 | 193 / 221 | 238 | 104 % | 98 % | every frame |
| | after | **10.9** | **27 / 65** | 75 / 80 | 239 | **55 %** | 39 % | 4.0 |
| town (scale 960) | before | 6.7 | 116 / 137 | 131 / 196 | 465 | 102 % | 90 % | every frame |
| | after | **11.0** | **14 / 17** | 67 / 76 | **62** | **38 %** | 22 % | 1.0 |
| whole (scale 3.6 → 4.5) | before | 2.5 | 216 / 407 | 376 / 513 | 208 | 100 % | 86 % | every frame |
| | after | **11.0** | **6 / 7** | 53 / 74 | **46** | **28 %** | 11 % | 1.1 |

Other measurements:

- **JS heap:** 9 to 22 MB in every view after; 9 to 40 MB before.
- **Elements created:** about 1,000 to 1,400 a minute in both builds, so render did not add DOM churn. Those elements come
  from `renderHousehold`, `renderVisits` and `renderTravelModes` rebuilding their rows on every snapshot.
- **Page errors:** none in either build.
- **Whole-map scale:** the whole view is at 3.6 before and 4.5 after. The map data's new box (301 by 275 miles) stops the
  camera sooner.

Before, the main thread was over 100 % busy in every view: the page could not keep up with its own animation, and every
click and wheel step waited behind a frame.

## What made it slow

The top self-time functions in the *before* profile:

- `pull` and `bezierCurveTo` in `public/curve.js`: 190 to 230 ms a second. Every river and creek on the colonies was drawn
  as a curve, nine strokes deep, on every frame. That is 7,000 points a stroke, nearly all off screen.
- `distanceToLine`: 106 to 247 ms a second. The scattered tufts and trees tested themselves against every point of every
  river, on every frame.
- `save`, `restore` and `drawImage`: the ground's sprites, redrawn every frame.

The animation loop repainted the whole map twelve times a second so that people could walk, and everything under them was
repainted too, although it had not changed.

## What changed

1. **The ground is kept between frames** (`mapBase` in `public/app.js`).
   - **What is kept:** relief, land classes, woods, scattered detail, water, fields, the holding, roads, and a town's or a
     ford's ground. They are drawn into a canvas of their own, and each frame copies that canvas whole and draws people and
     buildings on top.
   - **The key:** `sameLayerKey` in `public/map-base.js`. It holds an invalidation epoch, the snapshot's world object, the
     map object, the canvas size and the camera.
   - **What redraws it:** `render(snapshot)`; a woods tile or a sheet of art arriving (`redrawForArrival`, grouped into one
     redraw 200 ms later); the map arriving.
   - **Drawing state:** the canvas state the ground ended in (line caps, font and so on) is carried onto the page's canvas
     each frame (`readDrawState` and `applyDrawState`). The people drawn on top see exactly what they saw before.
   - **Animation evidence:** `__animationClips` still names the ground's clips on frames that only copy it.
   - `ceiling:` the oaks' wind does not animate between ground redraws. The way out is to draw a few swaying trees over the
     kept ground each frame.
2. **Rivers are only drawn where they can reach the screen** (`visibleSegments` in `public/curve.js`).
   - A segment is kept if its box, grown by a third of its span plus the stroke and bank detail, meets the screen. The curve
     stays inside that grown box.
   - The curve through the kept segments is the same curve as before.
   - A course whose box is off screen is skipped before its points are projected (`courseBox`).
3. **The scatter measures only water near the view** (`segmentsNear` and `distanceToSegments`). Every distance inside the
   view is unchanged.
4. **Text is written only when it changes** (`setText`). The loop was rewriting the map title, the Follow button, the
   world description and the canvas's aria-label twelve times a second.
5. **`drawSprite` resets by hand** (`public/art.js`). It undoes its translate and alpha instead of calling `save` and
   `restore`. This took the town view from 188 ms to 67 ms a snapshot. Alpha fades in the scatter do the same.
6. **Canvas pixel budget** (`canvasRatio`). The canvas still follows a dense screen's density up to 2, but never goes above
   about a 1080p frame of pixels. A 1440×900 screen at density 2 was 5.2 million pixels a frame and is now 2.1 million.
   Screens at density 1 are untouched. `ceiling:` one budget for every machine.

## Zoom: nothing pops, nothing moves

Before and after at the same spot: the San Felipe family's land, zoomed out one wheel step at a time. Each sheet is twelve
steps.

- Contact sheets: [before 1](evidence/zoom-lod-before-sheet-1.png)–[5](evidence/zoom-lod-before-sheet-5.png) and
  [after 1](evidence/zoom-lod-after-sheet-1.png)–[5](evidence/zoom-lod-after-sheet-5.png).
- Pairs at single steps:
  - step 8, a farm: [before](evidence/zoom-lod-before-step-8.png), [after](evidence/zoom-lod-after-step-8.png);
  - step 14, the neighbourhood: [before](evidence/zoom-lod-before-step-14.png), [after](evidence/zoom-lod-after-step-14.png);
  - step 26, the colony: [before](evidence/zoom-lod-before-step-26.png), [after](evidence/zoom-lod-after-step-26.png);
  - step 44, the country: [before](evidence/zoom-lod-before-step-44.png), [after](evidence/zoom-lod-after-step-44.png).

Run it with `node scripts/zoom-lod-shots.mjs --label <name> [--only 8,14] [--root <dir>]`.

The *after* images include the map-data agent's corrected data (merged from `main`: `docs/MAP_ACCURACY.md`). The *before*
images are on the old invented province. Where a river *is* comes from that data. How it is drawn at each zoom comes from
here.

What was wrong in *before*, and what replaced it:

- **Rivers changed width and shape.**
  - *Before:* water width was tied to the figure size's floor, so every river was 18 px wide below a county's zoom. Near
    San Felipe the rivers swelled into lakes and tangles (step 44). The province's sketched rivers were straight bands,
    `width × scale / 2` wide, which is more than a mile across when close in, and they ran in other places.
  - *After:* `waterWidth(miles, scale, floor)` joins the true width to a floor of a few pixels smoothly, so a river narrows
    steadily as the camera pulls back. On the real land, rivers, the sea and the escarpment are drawn from the data's
    nested bands (`public/land-levels.js` `lineBand`). A coarser band only drops points of the finer band, so a line
    never moves. Terrain rivers are not drawn a second time.
  - Creeks fade in between scales 6 and 14 (`creekOpacity`). Ripples, stones, reeds, ruts and tufts fade in as the
    water or road widens, instead of switching on at one width.
- **Forests popped and were checkerboards.**
  - *Before:* each woods layer switched on or off at a single number: trees at 0.4 square miles, patches at 12 miles
    across, shade at 90. The patches and shade were drawn as hard-edged squares (steps 8 to 26).
  - *After:* each layer fades across a band (`WOODS_BANDS` and `woodsLayers` in `public/woods-view.js`):
    - trees fade in from 1 square mile to 0.4, over a canopy kept at 45 % under them;
    - patches hand over to shade between 8 and 12 miles across;
    - shade fades out between 60 and 90.
  - The patches and shade are laid down as smoothed pictures of their cells (`smoothCover`: four pixels a cell, blurred
    about a cell wide with premultiplied alpha). A stand has a soft edge that stays in place. Each picture is rebuilt only
    when a tile of its own level arrives.
  - **Hunting rule:** a hunter sent into timber is drawn among trees at every zoom. The canopy never leaves, and the
    scattered oaks fade out only as the real trees fade in.
- **The prairie reshuffled.**
  - *Before:* the scattered tufts, rocks and oaks were re-rolled at every doubling of the view, and thinned by a density
    that changed at every wheel step.
  - *After:* they are levels of a doubling grid (`scatterLevels` and `scatterItem`). Each cell of each level holds at most
    one thing, at a place fixed by the cell. A view always draws every coarser level and fades in the next finer one. A
    thing on screen stays exactly where it is as the camera comes in. The whole scatter fades in between scales 28 and 40
    instead of appearing at 34.
  - **Water rule:** nothing is scattered in a channel as it is drawn. The exclusion uses the same `waterWidth` and the same
    band lines.
- **The land.** On the real land, the province's cover belts (a band-3 sketch) are replaced by the land's own classes and
  hillshade, described in the next section. Hills now read on the country view (step 44, after).

## Ground classes: where a new land style plugs in

The land data (`/terrain/colonies-land.json`) has one class per cell on grids of 8, 2 and half a mile, and a hillshade per
cell. The page decodes it in `public/land-levels.js` (`decodeLand`). **A class is one table entry** in
`public/ground-classes.js` `GROUND_CLASSES`, keyed by the data's id. Each entry has:

- `colour` and `alpha`: its wash over the relief;
- `marks`: its scattered detail by the cell's roll. Each mark is a sprite at a size, with a drawn fallback shape (`rock`,
  `bush`, `tuft`) used while the art has not loaded;
- `timber`: whether its scatter is woods. On a map that has the land's woods tiles, those tiles decide instead.

How a class meets its neighbours is the smoothing of the picture: about a cell wide, the same at every zoom. `ceiling:`
every class has the same edge softness.

**To add a land style** (desert, buttes, and so on):

1. The map data gives it an id in `land`.
2. Add an entry with that id to `GROUND_CLASSES`.
3. `tests/map-base.test.mjs` fails until every class the data names has an entry.

**Hillshade** is drawn from each grid's `shade` byte in `drawLand` (`landPicture`), as a dark or light wash over the classes.
Hills, bluffs and the escarpment come through with no extra work. A stronger relief pass (relief classes such as buttes
drawn as sprites) would go in the same place, as another picture per grid.

**Cost:** every picture is made once per grid and cached. Only the part in view is copied, and only when the ground is
redrawn. The grids hand over across a band of zoom (`landWeights`: a grid fades in from 4 to 8 pixels a cell).

## Tests

- **Current count:** `npm test` passes, 662 tests.
- **`tests/map-base.test.mjs`** has 11 tests, covering:
  - the ground's key and `setText`;
  - `canvasRatio`;
  - `segmentsNear` and `visibleSegments`, including a bend that dips onto the screen and a creek just outside the view;
  - `waterWidth` and `creekOpacity`, with no jump from one wheel step to the next;
  - `woodsLayers`, with no jump from one wheel step to the next;
  - scatter stability as the camera comes in, and its budget;
  - `smoothCover`: soft edges without grey bleed;
  - class table entries, including the prairie drawing exactly the old marks;
  - the real land's levels: decoding, band nesting, band and grid choice.
- **`tests/art-library.test.mjs`** now finds the fallbacks for the grass tuft and rocks in the class table instead of
  as source patterns.
- **Injection proofs:** thirteen regressions were injected one at a time
  ([injections](evidence/perf-render-injections.json)). Each failed its own test and no other.
- **Browser proofs** rerun after the change: `test:family-panel`, `test:looks`, `test:art` (the map still animates, and
  pause still freezes every pixel), `test:whole-game`, and the map-accuracy proof. Their screenshots were checked by eye.

## What remains

These are the top costs after the change, from the profile.

- ~~**Redrawing the ground.**~~ Done 2026-09-18 (*Redrawn only when it changed*, below). A redraw costs 50 to 75 ms throttled, and the main one-off cost now is a snapshot: at the 1 s
  tick of this measurement that is about one redraw a second. At Solo's 9.5 s pace it is one every 9.5 s. The redraw
  happens for the whole snapshot even when nothing on the ground changed. A fingerprint of what the ground is drawn from
  (plots, lane, woods revision, picks) in place of the snapshot's identity would skip most of these. It was left out
  because a missed dependency would draw stale ground.
- **The land view** redraws the ground about 4 times a second: woods tiles and the homes (`/api/map/homes`) arriving while
  neighbours settle and fell trees. That view has 239 long tasks a minute, mostly those redraws.
- **Every frame:**
  - copying the ground and drawing the people and buildings (`drawImage`), 50 to 140 ms a second;
  - `townPoint`, 13 ms a second: a town's drawables are rebuilt each frame at scale 200 and up;
  - `getBoundingClientRect` in `fitCanvas`, about 10 ms a second.
- **DOM rebuilds:** `renderHousehold`, `renderVisits` and `renderTravelModes` rebuild their rows on every snapshot. They are
  cheap next to the drawing.
- **Loading:** woods tiles and art still appear when they arrive rather than fading in.
- **Unmeasured:** a real Chromebook, its GPU, 4 GB of memory, and a density above 1.

## After the follow-ups — 2026-09-17

`node scripts/perf-render-measure.mjs --label final` (same computer, CPU throttled 6x, 15 families, 1 s ticks), against
`after` above, once the land and woods pictures moved to a worker, the card, the canvas and the towns stopped being
measured or rebuilt every frame, and the woods came in batches:

| View | Main thread busy | Long-task time per minute | Layouts per second |
|---|---|---|---|
| default | 41% → **34%** | 4,617 → **1,702 ms** | 3.6 → **1.2** |
| land (close up) | 55% → **38%** | 16,094 → **7,711 ms** | 3.0 → **1.0** |
| town (Gonzales) | 38% → **29%** | 4,133 → **3,148 ms** | 3.1 → **1.0** |
| whole map | 28% → **23%** | 2,567 → **366 ms** | 3.0 → **1.0** |

Painted frames stay at 9-10 a second (the animation's own cap is 12). Still to do: the household, visit and travel-mode rows
are rebuilt on every snapshot (about 1,000-1,300 elements a minute, `renderHousehold` and `renderTravelModes`), and the
close-up land view redraws its ground twice a second while neighbours work nearby.

## Redrawn only when it changed — 2026-09-18

The first item under *What remains*, done. The kept ground was keyed on the snapshot itself, and `render` threw it away as
well, so every snapshot and every click drew the whole country again under people who were only walking. Now:

- **The ground's key is what it is drawn from** (`groundInputs` in `public/map-base.js`, kept per snapshot): the family's
  plots and their work, fences and crop, its grant, lane and house site; on the Host's map every family's; the ground
  somebody is on the way to survey; whether the woods are the land's; and the pick being made on the land.
- **The woods' revision is not in it.** A tree felled anywhere in the class moves it, and the neighbours fell nearly every
  tick; what changes on screen is the tile that comes back, whose arrival draws the ground. The woods are still asked for
  their view whenever the revision moves.
- **A tile that comes back unchanged draws nothing** (`public/woods-view.js`): after a felling somewhere else the trees in
  view are asked for again and nearly always return as they were.
- **The ground audit** is the guard against the risk this carried - a thing drawn into the ground that the key does not know
  of, standing stale. With `window.__groundAudit` set, the page draws the ground afresh aside on every snapshot the kept
  ground was not redrawn for, from the same drawing state and moment, and compares the pixels (`auditGround`).
  `npm run test:farm` runs with it on: 50 snapshots of staking, clearing, planting and fencing, none stale. Leaving the plots
  out of the key makes it fail on the first snapshot after a plot is cleared, where the proof's own checks do not.
- **Why each redraw happened** is counted (`window.__groundWhy`) and written into the measurement (`groundDrawnBecause`).

`node scripts/perf-render-measure.mjs --phase 20`, same computer, CPU throttled 6x, 15 families, 1 s ticks; *before* is the
v2026.09.18.2 build measured by the same script (`--root`). [before](evidence/perf-render-redraw-before.json),
[after](evidence/perf-render-redraw-after.json).

| View | Ground drawn a second | Snapshot handled (mean) | Long tasks a minute | Slowest frames (p95) | Main thread busy |
|---|---|---|---|---|---|
| default | 1.3 → **0.1** | 54 → **23 ms** | 63 → **6** | 15 → **14 ms** | 38% → **30%** |
| land (close up) | 2 → **0** | 73 → **21 ms** | 119 → **0** | 60 → **14 ms** | 41% → **30%** |
| town (Gonzales) | 1 → **0** | 61 → **18 ms** | 62 → **0** | 14 → **13 ms** | 34% → **28%** |
| whole map | 1 → **0** | 46 → **12 ms** | 9 → **0** | 6 → **6 ms** | 26% → **22%** |

Same computer only: a throttled desktop is not a Chromebook. `ceiling:` anything newly drawn into the ground must be added
to `groundInputs`, or it stands stale until the camera moves; the audit in the farm proof is what finds one, and it covers
a student's own land, not the Host's map. Still to do: the household, visit and travel-mode rows rebuilt on every snapshot.

## The marker when fast - 2026-09-19

A traveller past a walk is drawn as a pin with their portrait and a dotted road ahead (`drawTravelMarkers` in
`public/app.js`, owner's choice "Marker when fast"). The marker allocates nothing per frame beyond the one entry
`travelMarker` hands over and its hit spot - the figure it stands in for allocated more (`{ ...entity, gait }`) - walks the
route in place (`routeIndexAfter`) and projects its points by hand rather than through `camera.toScreen`. Once whole it
draws no figure and plays no cycle.

`node scripts/perf-render-measure.mjs --views default,land,traveller`, with a new view, `traveller`: the main person walks to
Gonzales and home again for the whole phase with their portrait pressed (scale 2605), so they are a marker throughout.
*Before* is HEAD `86321b3` exported and measured by the same script (`--root`); *after* was measured twice, either side of
it. Same computer, CPU throttled 6x, 15 families, 1 s ticks. [before](evidence/perf-render-marker-before.json),
[after](evidence/perf-render-marker-after.json), [after again](evidence/perf-render-marker-after-2.json).

| View | Build | Painted fps | ms / frame (mean / p95) | ms / snapshot (mean) | Main thread busy |
|---|---|---|---|---|---|
| default | before | 7.5 | 38 / 189 | 139 | 95% |
| | after, after again | 6.1, 8.1 | 42 / 198, 34 / 153 | 172, 99 | 90%, 90% |
| land | before | 6.9 | 42 / 213 | 149 | 95% |
| | after, after again | 6.2, 8.3 | 42 / 220, 3 / 4 | 202, 175 | 98%, 86% |
| traveller | before | 2.7 | 18 / 39 | 252 | 95% |
| | after, after again | 2.7, 3.3 | 28 / 218, 3 / 2 | 286, 191 | 96%, 93% |

**These runs cannot tell the builds apart.** Other sessions were running five test suites at once on this computer
throughout (the CPU at 100% before throttling), and the two *after* runs differ from each other by more than either differs
from *before*. What they do show: `drawTravelMarkers` is not among the fifteen functions with the most self time in the
traveller view (the fifteenth is under 9 ms a second), `drawSprite`'s share is about the same (11.5 ms a second before, 13.9
and 11.8 after), and there were no page errors. An earlier *before* run on a quieter machine is in the git history of the
same file (default 9.2 fps, 23 ms a frame); it has no *after* beside it measured in the same conditions.

Found while measuring, not changed: watching somebody close up redraws the whole ground 2.5 to 3.5 times a second in either
build, because the camera moves with them and the ground's key holds the camera. A ground drawn larger than the view and
moved, as the gesture's quick frame is, would be the way out.

## The weather, drawn — 2026-09-20

Owner: *"Weather should be a visual thing... Players should see the weather. If implemented correctly, no text should be
required."* `public/weather-art.js` draws the five kinds of day `docs/WEATHER.md` sets out. The renderer already paints
twelve times a second over a country four hundred miles wide, so the whole design of it is about cost.

**Where each piece lives, and what it costs.**

| Drawn | Where | Cost |
|---|---|---|
| High water on the rivers; the lean the wind puts on the trees and the grass | the **kept ground** (`mapBase`), keyed on `weatherGroundKey` | nothing on a frame that only moves people. The key is quantised — the kind, the water to a tenth, the wind force to a tenth — so a river falling a thousandth an hour does **not** redraw the country, and a day that turns redraws it once |
| The fog's shape, banked along the water | a **companion layer**, filled when the ground is | one `drawImage` a frame, its alpha the morning's (`fogFade`) |
| Falling rain, a storm's rain, the dust a norther drives | the **air**, over everything | **one `fillRect` per layer**, with a repeating pattern at a whole-pixel offset. Two to three layers a frame. Not a particle system |
| The wet, darkened earth; the flat grey; the cold blue; the cloud shadow | the veil (under the figures) and the air (over them) | **one fill each**, as a linear gradient across the view where the regions differ |

**Three things had to be got right or it was not affordable, and each was found by measuring.**

1. **The pattern must not carry a transform.** Turning the pattern to the wind and scaling it for depth cost more than
   everything else on the map put together: a storm over Gonzales took the frame from 14 ms to 64 and the loop fell to
   six frames a second. The wind's direction and the layer's depth are now **drawn into the tile** (`tileFor`), so the
   fill is a plain repeat. A day has one wind, so a class builds three or six small tiles and keeps them.
2. **A composite other than `source-over` costs even when the fill is empty.** Setting `multiply` and `screen` on every
   frame, for washes whose alpha was zero on that kind of day, slowed *everything else drawn afterwards* — `drawSprite`
   went from 8 to 26 ms a second. Both are now behind a test for whether there is anything to draw.
3. **A view inside one weather is laid down in one piece.** A pattern cannot be masked by a gradient without compositing
   a whole screen, so `weatherSpans` gives one span for any view whose two edges are in the same weather — which is every
   student's, four miles across a region a hundred and thirty miles wide — and twelve only for the Host's whole country.

**And one thing had to be got right or it was silently wrong.** The kept ground is redrawn only when `weatherGroundKey`
moves, and that key deliberately leaves `since` out so a day fading in does not redraw the whole country twelve times a
second. The wet earth was at first drawn into the ground *from the faded weather* — so it was laid down once, at the
strength of the one frame that drew it, and stood stale for the rest of the day. **The project's own ground audit found
it** (`window.__groundAudit` in `public/app.js`, run by `scripts/farm-browser-proof.mjs`): a difference over the whole
screen, 6.1% of pixels on the first tick and falling to 0.9% by the fifth as the day came up. The fix is a fade-free
reading, `weatherMix(..., { fade: false })`, for **everything** drawn into the ground — the high water, the fog's shape
and the lean on the trees — and the wet earth moved onto the page's own canvas, where it is drawn every frame with the
veil. `tests/weather-art.test.mjs` now holds that: what the ground is drawn from must not move with the clock. This is
the exact failure `groundInputs`' own `ceiling:` warns about, and it is worth reading that note before drawing anything
else into the ground.

**Before and after.** *Before* is `7bc0f5f` exported and measured by the same script (`--root`). Same computer, headless
Chrome, CPU throttled 6×, 1366×768, 15 families, 1 s ticks, 30 s a view.
`node scripts/perf-render-measure.mjs --label <name> [--weather storm|storm/rain/fair]`.
[before](evidence/perf-render-weather-before.json), [live](evidence/perf-render-weather-after-live.json),
[storm](evidence/perf-render-weather-after-storm.json), [three regions](evidence/perf-render-weather-after-three.json).

*live* is the class's own opening day as the server sends it — the Guadalupe up in the west, rain over the centre, a fair
east, so the Host's view straddles two weathers. *storm* is a storm over the whole country with its rivers at 0.8.
*three* is a storm in the west, rain in the centre and a fair east.

| View | ms / frame (mean / p95) — before | live | storm | three regions |
|---|---|---|---|---|
| default (scale 402) | 13.4 / 14.9 | 14.4 / 16.2 | 14.4 / 16.2 | 13.7 / 15.8 |
| land (scale 2132) | 14.8 / 17.1 | 15.6 / 18.0 | 15.3 / 17.8 | 15.1 / 17.4 |
| town (scale 960) | 13.7 / 15.6 | 14.4 / 16.4 | 14.1 / 16.1 | 14.1 / 15.7 |
| whole (scale 3.6) | 6.0 / 6.9 | 6.9 / 7.8 | 6.3 / 7.1 | 6.9 / 7.7 |

**No day costs more than a millisecond a frame.** Painted frames a second are 9.9–10.4 in every build and on every day,
against 10.1–10.4 before; the ground is redrawn 0 to 0.3 times a second in every one of them, which is what it was
before — **the weather did not add a single redraw of the country**. There were no page errors.

Honesty about the conditions: these are one run each on a machine that had other sessions on it, and the spread between
runs of the *same* build is a few tenths of a millisecond. The claim they support is "no measurable regression on a fair
day and about a millisecond and a half on the worst one", not a figure to three decimal places.

**How the weather is proved by eye.** `node scripts/weather-browser-proof.mjs` puts a class into each kind of day at
three zooms and writes `docs/evidence/weather/`. Every day it photographs is a **real day of a real class**, taken from
`weatherOn` in `sim/weather.mjs` on the seed every measure uses, and the first of them — `live` — is photographed with
nothing injected at all. The rest are days further into the class than a proof can sit and wait for, so their weather is
computed by the simulation and put on the snapshot as it is parsed (`scripts/support/weather-stub.mjs`); what stands in
is the delivery, not the weather. `shut` is the one exception and says so in the record: no day of this class quite
reaches `WATER_SHUT`, so one river is raised by hand to show what a shut ford looks like.

## Astra's painted gale, and what a measurement could not say — 2026-09-21

The norther stopped shearing upright sprites and started drawing Astra's own gale poses where the wind is hard
(`GALE_POSES` in `public/weather-art.js`, `FIC-GONZ-201`). What that adds to the scattered ground is **one `Math.min`
and one `Math.hypot` a thing** (`inGale`), read off the `weatherMix` the lean was already reading — a second mix for
the second answer would have doubled the cost of the whole scatter, so both come off one. What it **removes** on a
norther is a `ctx.transform` pair a thing (the shear is not applied over a pose that is already bent) and, for a
timber oak, a whole clip sample: `postOak` draws the painted frame instead of sampling the one-frame sway clip. The
gale path is therefore cheaper than the shear it replaces, and a fair day pays two arithmetic operations a thing.

**The measurement cannot support a number, and says so.** `node scripts/perf-render-measure.mjs --label gale-after
--weather norther` and the same script on a fair day were run back to back on this build
([norther](evidence/perf-render-gale-after.json), [fair](evidence/perf-render-gale-fair.json)). The *fair* run — the
one doing **less** work — came out slower in every view (50.6 ms a painted frame at the `default` view against 30.1 on
the norther), because the machine was running browsers and test suites at the time. Run-to-run noise of twenty
milliseconds a frame swamps anything this change could cost, so **no before-and-after figure is claimed from it**. The
numbers in the 2026-09-20 table above were taken on a quiet machine and are the ones to compare a future build with.

What the two runs **do** hold, because it is a count and not a time: **the ground was redrawn 0 to 0.2 times a second**
in both, exactly as on every build since the kept ground was built, and there were **no page errors** in either. The
gale changes what a mark is drawn as, never how often the country is drawn — `weatherGroundKey` already carries the
kind and the wind's force to a tenth, so the day that turns on the gale is the day that already redrew the ground once.

`scripts/weather-browser-proof.mjs` now photographs a fourth zoom (`timber`, seven wheel steps out from the closest)
and records `window.__galeDrawn` — how many things took a painted pose and how many were scattered — on every shot.
On the two norther days it is 48 of 696 at the yard, 564 of 3,834 in the timber and 217 of 233 at the county; on the
fair, rain, storm, fog and high-water days it is **0** at every zoom, which is the whole rule in one column.

# Opening the game on a weak computer

Owner, 2026-09-17, after a Play Solo playtest on the school laptop: *"exceptionally laggy. Very slow to load and a lot of problems with being able to navigate … There's no way it'll work on the student chromebooks right?"*

This document covers **initial page load only**: from opening the page to a map drawn with its real geography and its art. Per-frame drawing, the server's tick and snapshots, and pan/zoom input were measured and fixed separately; they are named below only where they decide what the load numbers mean.

**What is not claimed.** Every number here is from one Windows desktop running headless Chrome with a Chromebook's handicaps put on through the DevTools protocol. A throttled desktop is not a Chromebook: the CPU slowdown is uniform, the GPU and memory are not emulated, and in the solo profile the server runs on the desktop's full CPU, not a school laptop's. No acceptance on a real Chromebook or a real school laptop is claimed. Each figure is one run, and timings move 10-20% between runs; the byte counts do not.

## Method

`node scripts/perf-load-measure.mjs --label <name>` (needs `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE`, like the browser proofs). It:

- starts a Play Solo classroom in its own process, like `server/main.mjs --solo`: the colonies map, automatic neighbours, the study pace (9.5 s a tick). The one difference is that every game is dealt on the same seed (`--seed`, default `perf-load-1`), because a solo game's random seed decides where the family starts and so which art sheets the first view draws. Without it two runs are not comparable (the first attempt at a baseline differed by 12 sheets between runs).
- deals a solo game through `POST /api/solo` and opens its link at 1366×768 with the CPU slowed **6×** (`Emulation.setCPUThrottlingRate`);
- in two profiles: **solo** (loopback: the page and the server on the same computer) and **classroom** (`Network.emulateNetworkConditions`: 20 Mbps down, 5 up, 40 ms, a Chromebook on school Wi-Fi);
- each profile **cold** (a new browser profile, nothing cached) then **warm** (a reload);
- records every response over CDP (bytes on the wire, encoding, cache headers), the time the map was first drawn with its real geography (a snapshot whose map has sites, plus a frame), main-thread long tasks, and a Chrome trace of the cold load (script compile, image decode, layout, GC, animation frames);
- watches for at least 15 s, so art asked for when the next snapshot arrives is counted, and then until nothing has been in flight for 3 s.

It writes `docs/evidence/perf-load-<label>.json`. The before and after of this pass are `perf-load-before.json` and `perf-load-after.json`.

## Before and after

Same computer, 6× CPU throttle, one run each.

| | solo cold | solo warm (reload) | classroom cold | classroom warm (reload) |
|---|---|---|---|---|
| Bytes on the wire, before → after | 16.9 MB → **15.6 MB** | 1,043 KB → **220 KB** | 16.9 MB → **15.6 MB** | 1,041 KB → **212 KB** |
| of which art sheets (13 PNGs) | 15.2 MB → 15.2 MB | 6 KB (13 × 304) → **0** (no request leaves the browser) | 15.2 MB → 15.2 MB | 6 KB → **0** |
| of which scripts, styles, JSON | 1,605 KB → **347 KB** | 934 KB → **121 KB** | 1,605 KB → **347 KB** | 945 KB → **124 KB** |
| of which woods tiles | 179 requests, 131 KB → 180, 128 KB | 140, 103 KB → 138, 99 KB | 173, 126 KB → 172, 122 KB | 123, 91 KB → 123, 88 KB |
| Sheet decode on the main thread | 632 ms (13 sheets) → **0** (92 ms, other threads) | - | 714 ms → **0** (95 ms, other threads) | - |
| Map first drawn | 1,568 → 1,323 ms | 827 → 850 ms | 1,530 → 1,424 ms | 1,548 → 970 ms |
| Last art sheet arrived | 1,923 → 1,565 ms | 1,056 → 827 ms | 8,611 → 7,382 ms | 1,313 → 926 ms |
| Main-thread blocking before the map (long-task time over 50 ms) | 728 → 658 ms | 235 → 344 ms | 548 → 509 ms | 279 → 155 ms |

The single files that mattered, cold: `atlas.json` 526 KB → 46 KB, `/api/map` 347 KB → 97 KB, `app.js` 269 KB → 81 KB.

"Map first drawn" moves within run-to-run noise in the solo profile; what changed for certain is the bytes, the requests the browser no longer makes, and the decode moved off the main thread.

### What the page's responsiveness is actually waiting on

Not on loading. Once the map is drawn, the throttled page never has two seconds without a long task: in the cold solo trace, 253 animation frames took 18.9 s, about **75 ms a frame at 12 frames a second**, before and after this pass alike. That is the per-frame drawing cost, handled separately; until it falls, a Chromebook's page will feel slow to respond however fast it loads. The "responsive" field in the evidence JSON is therefore close to the end of the watch in every run and should not be read as a load figure.

## What was changed

1. **Gzip for scripts, styles and JSON** (`server/delivery.mjs`, used by `server/app.mjs`). Any body of 1 KB or more goes gzipped to a browser whose `Accept-Encoding` takes gzip (not `q=0`), with `Vary: Accept-Encoding`. Only gzip: Chrome offers brotli and zstd over HTTPS only, and the class server is plain HTTP. The page's own files and the asset manifests are compressed once at level 9 and kept; JSON built per request (`/api/map`, `/api/chores`, `/api/state`) at level 1, because on this computer level 1 takes 1.8 ms for the map where level 6 takes 7.8 ms, and the server is a school laptop answering thirty students at once (a `ceiling:` in the module names the way out).
2. **The page's files revalidate instead of refetching.** They were `Cache-Control: no-store`; they are now `no-cache` with an ETag, so a reload asks and gets a 304, and an updated game is still never run from an old copy. The gzipped copy has its own ETag.
3. **Art sheets are pinned by their own hash.** `public/art.js` asks for each sheet as `…/nature.png?v=<first 16 hex of the manifest's sha256>`. When `v` matches the file's real SHA-256, the server sends `public, max-age=31536000, immutable`; any other asking is still `max-age=0, must-revalidate`. A reload, or a class's second day on the same Chromebook, makes no request for art at all, and a sheet Astra replaces has a new hash and so a new URL. Every sheet's recorded hash was checked against its file (all 52 frontier sheets and the stand-ins match), and `tests/delivery.test.mjs` checks the first sheet on every run.
4. **A 304 no longer reads the picture.** Every asset request used to read the whole file and hash it, even to answer "not modified" - 15 MB read and hashed for each student's reload. The hash is now remembered by size and modification time (a `ceiling:` names the same-millisecond same-size rewrite it would miss).
5. **Sheets are decoded off the main thread.** `public/art.js` fetches a sheet and makes it an `ImageBitmap`, instead of an `<img>` that Chrome decodes on the main thread at its first `drawImage`: 632-714 ms of main-thread decoding (6× throttled) for the first view's 13 sheets is gone. A browser without `createImageBitmap` still uses `<img>`. A `ceiling:` records the memory this holds (about 6 MB a sheet, for as long as the page is open).

## Tests and proofs

`tests/delivery.test.mjs`, 5 tests, each proven by injection on 2026-09-17 - with each regression put in by itself, only the named test failed (and `tests/asset-http.test.mjs` passed throughout):

- static files not gzipped; static files back to `no-store` with no 304 → *the page's scripts go gzipped … and a reload is answered 304*;
- API JSON not gzipped → *a large JSON answer goes gzipped, a small one as it is*;
- pinned sheets never given the long cache → *an atlas asked for by its own hash is kept for good*;
- `art.js` asking without `?v=`; `art.js` not making an `ImageBitmap` → *the page asks for each sheet by the hash its manifest records*;
- `q=0` ignored → *gzip is taken only where the browser offers it* (and the script test, which also sends `q=0`).

`npm test`: 634 tests pass. Browser proofs rerun on the change, same computer: `test:looks` (6 checks), `test:solo-game` (16 checks, the whole solo game), `test:art`, `test:family-panel` - all pass.

## What was not changed, and why

- **The art is 15 MB of PNG on first open, and still is.** It is the bulk of every cold load: on the classroom profile the last sheet lands about 7 s after opening, and thirty Chromebooks opening at once ask the teacher's laptop for about 460 MB. Measured with Pillow on this computer, the 13 sheets the first view uses (18.4 MB of PNG on disk) are **13.5 MB as lossless WebP** (-27%) and **5.3 MB as WebP quality 90** (-71%); the whole 52-sheet library is 71.7 MB → 52.3 MB lossless → 20.2 MB at quality 90. Not done here because it is a change to Astra's delivery pipeline (`scripts/register-delivered-art.mjs`, `build-atlas-manifest.mjs`, the manifest's `image` and `sha256`), and lossy compression of her pictures is the owner's call, not a performance agent's. The server already serves `.webp`.
- **The woods arrive as 120-180 separate requests of about 700 bytes each** on every load, cold or warm (`/api/woods`, six at a time, `no-store`). On loopback they cost little; on the classroom profile they are roughly a second of round trips after the map is drawn, and each is a woods computation on the server (0.1-0.9 ms here). A batched tile request, or letting the browser keep `shade` and `patches` tiles (they are the land's and never change in a class), would remove most of them. Not done: `public/woods-view.js` is driven by the camera, which the pan/zoom work is changing at the same time.
- **The first view asks for 13 sheets** - `equipment`, `effects`, `household`, `wagon-rig` and the children's sheets as well as the four core ones - because something in the first frame draws from each. Splitting sheets by what the first view needs is again the art pipeline's.
- **`/api/map` is rebuilt, stringified and gzipped for every student** (347 KB of JSON, about 10 ms on this computer). Keeping the gzip per map revision is the way out if a class start shows the laptop busy.
- **`app.js` is one 275 KB module** plus 22 small ones, all fetched before anything draws. Gzipped it is 81 KB, and its compile and evaluation measured under 100 ms throttled, so splitting it would not pay for itself.

## Next steps

1. ~~Owner decision: WebP (lossless, or quality 90) for the atlases.~~ Done: owner-decided 2026-09-29, quality 90 with the recoloured sheets lossless (below, "The art as WebP").
2. Batch or cache the woods tiles, once the pan/zoom work on `public/woods-view.js` has landed.
3. Take the throttled measurement onto a real Chromebook on the school Wi-Fi with the teacher laptop serving: open a class on several at once and time the map and the last sheet. Until then nothing here is Chromebook evidence.

## Woods in batches, and the land's levels revalidated — 2026-09-17

After the rendering, server, map-data and navigation work merged, `node scripts/perf-load-measure.mjs --label woods-batch`
(same computer, CPU throttled 6x; [evidence](evidence/perf-load-woods-batch.json)), against the `after` run above:

| | solo cold | solo reload | classroom cold | classroom reload |
|---|---|---|---|---|
| Requests | 224 → **56** | 181 → **54** | 215 → **55** | 167 → **54** |
| Responsive (2 s with no long task after the map is drawn) | 23.7 → **3.5 s** | 18.4 → **3.3 s** | 28.0 → **9.9 s** | 18.0 → **3.2 s** |
| Long tasks | 201 → **10** | 121 → **7** | 173 → **10** | 141 → **4** |

The responsiveness is mostly the drawing and navigation work; the request count is this change. What changed:

- **Woods tiles in batches.** `/api/woods?level=&tiles=tx,ty;tx,ty;...` answers up to 64 tiles (`WOODS_BATCH_MAX`) in one
  request; `public/woods-view.js` asks for a view's missing tiles 48 at a time (`BATCH`), three requests at most at once.
  The single-tile form still answers. The land's own tiles (`shade`, `patches`) are worked out once per server and kept
  (`LAND_TILES_KEPT`, `ceiling:`); `trees` tiles are not, since a felled tree changes them. Tests in
  `tests/woods-view.test.mjs`, each injected (one tile a request, nothing remembered, no size limit, trees remembered).
- **The land's detail levels revalidated.** `/terrain/colonies-province.json` and `/terrain/colonies-land.json` (about 350 KB
  gzipped together, new with the map-data work) went again on every reload; they now carry an ETag and a reload holding
  them is answered 304. `tests/delivery.test.mjs`, injected.

Still to look at: a single long task of about 2 s (throttled) on the first draw after the land's levels arrive. Decoding
them costs under 5 ms unthrottled, so it is the first full ground draw with the land classes.

### The land's pictures made in a worker — 2026-09-17

The ~2 s long task was `landPicture` smoothing each land grid (classes and hillshade) on the main thread on the first draw
(a CPU profile of a solo load, throttled 6x: `smoothCover` and its box blur about 900 ms inside one 1,977 ms task). The
pictures are now made by `public/land-worker.js` from the pure `landPictureData` (public/map-base.js), handed back as
`ImageBitmap`s, and the ground is drawn again when they land; the map shows without the land's wash for that moment.
Longest task on load: **1,977 → 361 ms**. A latent crash this exposed is fixed: zoomed far enough out, `scatterLevels`
gives no level and `drawGroundDetail` read `levels[0].cell`. `tests/map-base.test.mjs` (injected: the pictures made on the
main thread). Remaining long tasks of 250-360 ms are the woods' cover rasters (`coverRaster`, also `smoothCover`) and
`positionSelection`.

### The woods' cover in the worker, and nothing measured on every frame — 2026-09-17

The same profile (solo load, CPU throttled 6x, 9 s) after the land pictures moved: the remaining long tasks were the woods'
cover rasters (`coverRaster` smoothing on the main thread, ~600 ms of `smoothCover` in the 9 s), the selection card placed
every frame (`positionSelection` reading five boxes and writing its position each frame, ~150 ms), and `fitCanvas` asking
the canvas's box every frame (~85 ms).

- `public/smooth-worker.js` is the page's side of the one worker (`public/land-worker.js`, `kind: 'land' | 'cover'`); the
  woods' cover picture on screen stays until the new one lands, then the ground is drawn again.
- The card's placement reads its boxes once and again only after a `ResizeObserver` says something resized, and writes its
  position only when it changes (`ceiling:` a box that moves without resizing is not re-measured; nothing does today).
- `fitCanvas` keeps the canvas's size from a `ResizeObserver`.

Result: long tasks after the first 0.3 s are 50-150 ms; the longest (264-299 ms) is the scripts loading. Smoothing is gone
from the main thread entirely. `tests/map-base.test.mjs` extended (injected: the cover smoothed on the main thread).

## The art as WebP — owner-decided, 2026-09-29 (triage D14, "All to WebP")

**The decision.** "What was not changed" above left the art as PNG because lossy compression of Astra's pictures was the
owner's call. The triage of 2026-09-29 put it to the owner (D14: A every atlas to WebP at quality 90, B Claude's stand-ins only,
C keep PNG), and the owner chose the recommended **A: every atlas, Astra's and Claude's, WebP at quality 90**, confirming on
2026-09-30 *lossless only where recolouring needs exact colours*.

**How it is built.**

- **The PNGs stay the masters.** Astra's deliveries and Claude's build outputs are untouched; `npm run build:webp`
  (`scripts/build-webp.mjs`, encoding by `scripts/webp-encode.py` with Pillow) writes each sheet's WebP to the same path under
  `public/assets/webp/`, with `record.json` naming the SHA-256 of the PNG it was made from and of the WebP. It remakes only what
  is missing or out of date (20 s for all 336 on this computer, 23 processes; nothing when all are current).
- **Not committed** (`.gitignore`). The repository already carries every PNG and its history (4.2 GB packed); a committed copy
  would add about 100 MB now and a third of every re-delivery, and would have to be rebuilt and merged by every builder who
  touches a sheet - several at once on most days. Made from the PNGs, it is a build output like the package.
- **Quality 90, lossless where people are recoloured.** A sheet with any frame `public/person-palette.js` recolours
  (`variantOf`: Astra's cast sheets, Claude's cast, work and ambient sheets) is lossless, encoded `exact` and decoded again
  and compared with its PNG every channel of every pixel, or the build fails. Measured before choosing, with the classifier
  itself (`framePartsOf` on a q90 WebP against the PNG, 2026-09-29): 5.2% of the dyed pixels of `civilians` changed part (15% in
  the worst frame), 2.1% of `people-cast2-idle`, and **35.8%** of `people-walk` (a whole frame's parts in the worst case): lossy
  WebP keeps colour at half resolution, which moves exactly the edges the region growing follows (`STEP` 22). Everything else -
  land, towns, buildings, animals, wagons, soldiers, effects, the creation screen's two landscapes - is quality 90 (method 5,
  alpha lossless). The rule follows the palette, not a list: when the family-starts work (merged 2026-09-30) began dyeing the
  children's hair and skin, the next build found 11 sheets it had made lossy that now held recoloured children (`people-children-*`,
  Claude's children's play, chores, riding and held-baby sheets), called them *must be lossless*, and made them again - 72 lossless
  sheets became 83.
- **Served only while current.** The page asks for `/assets/webp/<sheet>.webp?v=<the PNG's hash>` (`public/art.js`; manifests
  and every frame's rectangle unchanged, the retry after a failed sheet unchanged) and `url(assets/webp/…)` for the landscapes
  (`public/style.css`). `pictureFor` (`server/delivery.mjs`) sends the WebP while the record says it was made from the PNG now on
  disk - pinned for a year by the PNG's hash - and otherwise the PNG, never pinned: a fresh checkout, or a sheet Astra delivers
  before anybody runs the build, still shows her picture, larger. In a package that ships no PNG, the WebP answers the PNG's
  URL too (a page still open across an update).
- **The package ships WebP only.** `scripts/package.ps1` runs the build and `--check`, refuses a package with any picture not
  current, and leaves the PNG of every WebP at home; `webp/record.json` ships (the server reads it). A small update rebuilds the
  install from the release's list alone (launcher/DeltaUpdate.cs), so the PNGs go on the swap. `ceiling:` the first small
  update after this carries every WebP, about 100 MB.

**Before and after** (`node scripts/perf-load-measure.mjs`, the same Play Solo game on seed `perf-load-1`, CPU throttled 6x,
[before](evidence/perf-load-webp-before.json), and three runs after: [the first](evidence/perf-load-webp-after.json),
[a second solo run](evidence/perf-load-webp-after-solo2.json), and [one on the tree merged with origin/main 8687a96b, 83 sheets
lossless](evidence/perf-load-webp-after-merged.json)):

| | before (PNG) | after (WebP) |
|---|---|---|
| The whole art set: 336 pictures | 318.4 MB | **105.4 MB** (-67%) |
| of which the 83 recoloured sheets, lossless | 64.0 MB | 44.3 MB (-31%) |
| of which the 253 others, quality 90 | 254.4 MB | 61.0 MB (-76%) |
| The creation screen's two landscapes | 6.7 MB | 1.36 MB |
| A cold first view, bytes on the wire (both profiles) | 34.9 MB | **12.0 MB** |
| of which its 21 pictures | 33.3 MB | 10.4 MB (-69%) |
| The same for thirty Chromebooks opening at once | about 1,050 MB | **about 360 MB** |
| A reload (pinned, nothing asked) | 0.21 MB, no art | 0.21 MB, no art |
| Classroom profile cold: map first drawn / last picture arrived | 4.2 s / 16.0 s | 3.4 s / **7.5 s**; merged 2.0 s / **5.9 s** |
| Solo profile cold: map first drawn / last picture arrived | 2.0 s / 3.0 s | 3.9 s / 6.6 s; 3.7 s / 5.1 s; merged 1.4 s / 2.0 s |
| Pictures decoded (other threads, cold solo) | 0.2 s | 1.9 s; 0.6 s; merged 0.5 s |
| The package: update zip / NeedsNode zip / art installed | 352 / 319 / ~320 MB (v2026.09.29.3) | **153 / 120 / ~110 MB** |

The art on disk has grown since the 15.6 MB cold view measured above (more sheets in the first view, 21 not 13), which is why
"before" is larger than that figure. **The bytes are certain; the timings are not.** This computer was shared with several
other builders' proofs while these ran, and the three runs after disagree with each other more than with the one before: the
solo first view drew 1.9 s later, 1.7 s later, then 0.6 s *sooner*, and the decoding on the other threads took 0.5-1.9 s against
0.2 s. WebP does take more work to decode than PNG; how much that costs on a Chromebook, against the bytes it saves, is not
measured here. Over the classroom's Wi-Fi the bytes dominate: the last picture came in at 7.5 s and 5.9 s against 16.0 s.
`ceiling:` if Play Solo's first view on the school laptop is found slower, the lossy sheets at quality 80 or the first-view sheets
as PNG on loopback are the ways out. Same computer, throttled headless Chrome: not a Chromebook.

**Tests.** `tests/webp.test.mjs` (the lossless rule over both real libraries and the landscapes; the server's choice of WebP or
PNG when never made, current, made from an older PNG, in a package with no PNG, and with bytes not the ones recorded; a PNG sent
for a WebP over HTTP is never pinned), `tests/delivery.test.mjs` (the page asks for each sheet's WebP by the PNG's hash, Astra's
and Claude's), `tests/creation.test.mjs` (the title's landscape named by its WebP). Each failed under an injection first:
[webp-tips-touch-injections.json](evidence/webp-tips-touch-injections.json) (`npm run test:webp-tips-touch-injections`).
The recolouring proofs (`test:looks`, `test:looks-face`, `test:creation`) and the art proofs were run against the WebPs.

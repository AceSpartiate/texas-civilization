# Art library and renderer contract

Updated 2026-09-10. **30 transparent PNG atlases, 443 usable sprite frames, 169 clips, including 92 pose cycles and 4 layered rigs.** These are reusable prototype assets with working animation playback, not completed later campaigns or final historical portraits.

Start with the complete [ART_MANIFEST.md](ART_MANIFEST.md) or machine-readable [manifest.json](../public/assets/frontier-v1/manifest.json). Open `/art-catalog.html` on the running application to play, pause, scrub and inspect every sprite and clip. Open `/alamo-workshop.html` for the complete compound. The catalog and workshop are unsaved art tools; they do not query or alter classroom state.

## What is delivered

The September 26 batch adds `ox-packed.png` (cardinal four-frame pack-ox walks plus idle views), `carreta-solid-wheels.png` (cardinal four-frame solid-wheel travel, empty parked views and loaded east), and `icons-gather-stock-carreta.png` (the new `icon-make-carreta` plus seven alternate gathering and stock views). The renderer selects the packed ox for foot-travelling families, the carreta for homemade cart vehicles, and the open-cart views for poor starting carts. The family panel now selects its existing gathering and stock art in `icons-family-subsistence.png` and the new carreta icon, instead of code-drawn glyphs. The poorer cart still needs genuine rolling-wheel frames and loaded art; the carreta still needs a loaded travel variant. The complete frame and clip inventory is generated in `ART_MANIFEST.md` and `public/assets/frontier-v1/manifest.json`.

The September 25 art batch adds `cannon-cartwheels.png` (four east/west rest and recoil
frames, with two authored recoil clips), `flag-come-and-take-it.png` (still plus three
light-wind poses and a loop), and `cart-open.png` (east, south and north open cart views
without an ox). All have measured alpha bounds, provenance and sprite IDs
in the generated manifest. The cart's second east view does not yet show enough wheel
rotation for a credible travel loop; its moving and loaded states remain requested in
`ART_REQUESTS.md`. The Gonzales battle and town now select the delivered gun and
completed flag; family travel still needs to select the cart before its stand-in can
be removed.

| Family | Coverage and current use |
| --- | --- |
| Civilians | Four palettes with cardinal walking; work, carry, sow, repair, search, trade, care, rest and injury poses. The live farm binds its projected chores, including hunting/search and town trade. Current rest tasks use seated/rest art. Care is library-only until a treatment action exists. |
| Animals and transport | Ox, horse, cow and pig cardinal walk and four-frame grazing; alternative animal stills; covered, open and loaded wagon bodies with separate wheel parts; carts, limber, damaged wagon, boats and ferry parts. Live ox and wagon use movement; grazing and other species remain reusable library coverage. |
| Messengers | Foot courier poses and a separate mounted courier with east/west, north and south travel and grazing, plus four-pose E/W listening, speaking, letter-offer and pointing actions. The mounted sheet is prepared for the required [living information system](LIVING_INFORMATION.md), whose conversations are not implemented. |
| Military and cannon | Volunteer/regular/mounted/foot-courier travel families, aim/fire/load/ramrod, surrender, iron and bronze guns, directional gun stills, supply props, separate flash/smoke/dust. Live visible Gonzales formations use phase-bound motion and illustrative cannon recoil. These are representative samples, not tactical agents or an exact uniform/gun roster. |
| Environment | Nature, crops, cabins, masonry, courtyards, sheds, stores, landings, camps, tools, fences, ruins, defensive works and effects. Named recipes cover Gonzales, Alamo, San Antonio, Goliad, Liberty, Anahuac, Washington, San Felipe, San Jacinto and evacuation routes. See [LOCATION_ART_GUIDE.md](LOCATION_ART_GUIDE.md). |
| Full Alamo | 32 connected spaces, foot-scale geometry, independent north-wall damage, removable roofs, furnished interiors, church portal/wall parts and a dedicated sixteen-frame Joe cast. See [ALAMO_LAYOUT.md](ALAMO_LAYOUT.md). This assembly is separate from the current Gonzales game. |
| Interface | Parchment panels, olive/rust accents, contextual person card, family journal and responsive touch controls, built in HTML/CSS. The map remains the main surface; keyboard and text alternatives preserve access. |

Holding a sprite does not implement its subject. Boats, government, evacuation, most military actions and the complete Alamo historical sequence still require authoritative gameplay. The catalog deliberately exposes the entire reusable collection; the live game draws only permitted subjects. Do not reuse obsolete reachability counts from earlier 22-sheet reviews.

## Measurement, provenance and extension

The PNG originals were generated using the built-in **image_gen.imagegen** tool and copied unchanged. Full prompts and source paths are in [art-prompts.json](art-prompts.json); provenance, review notes and rejected attempts are in [art-provenance.json](art-provenance.json). The owner's three farm references inform palette, outlines and readability. `images.jfif` informed the Alamo's compound topology and camera. Reference images are not redistributed as runtime art. Generation is not an exclusivity or legal-rights warranty.

`scripts/build-atlas-manifest.mjs` measures visible alpha components and generates frame rectangles, ground anchors, logical pose heights, checksums and edge-retention audits. Requested grid cells are not safe crop bounds: sprites vary within them. Tiny source overlaps are disclosed in the audits. Every runtime PNG must appear in the inventory. One later rounded Alamo façade in `fortifications.png` is explicitly excluded and has no usable ID; use the new unfinished 1836 portal interpretation instead.

Never hand-edit generated `atlas.json`, `animation.json`, `manifest.json` or `ART_MANIFEST.md`. Add reviewed source sheets and stable IDs to `SHEETS`, define clips/rigs in the builder, update provenance and location recipes, then run `npm run build:art`. The master manifest includes every frame, clip, duration, direction, mirror rule, attachment, source checksum, exclusion, location kit and Alamo assembly record.

Each frame has a measured rectangle and fractional ground-contact anchor. `logicalHeight` keeps a pose family's standing scale stable despite different crop heights. Generated proportions still vary between some action sheets; final production needs registration and cast review, especially cross-action transitions. Do not claim hand-authored precision simply because alpha measurements pass.

## One world, disposable presentation

`public/art.js` loads core nature/buildings/transport/civilians first and other sheets when first needed. `drawSprite` returns zero if unavailable so important subjects retain procedural fallbacks. The catalog explicitly loads all sheets. Runtime assets are local; no external fonts, CDN or generation service is required.

`drawClip` takes a caller-owned `timeMs`; its frame index cannot change tasks, health, food, damage, travel or knowledge. `public/motion.js` reads only current permitted entities. It follows the current known route segment for facing and smooths between permitted positions, never extrapolating beyond them. Concealed actors are discarded; time jumps, reconnect discontinuities and compressed-minute updates snap. Paused classes stop presentation; reduced motion holds representative poses while authoritative positions continue updating.

**Missing art is requested in [ART_REQUESTS.md](ART_REQUESTS.md) and drawn meanwhile from stand-ins listed there**, each marked `stand-in:` in code. Rust is reserved for the local principal; the other palettes are stable per-ID choices. An observed household's principal never borrows the local principal's mark. Clip selection for an observed person cannot infer their private chore or cargo. Injured/wounded hold injury art. Capture and death retain the current non-graphic still fallback and separate textual state; a sprite must not decide those outcomes.

The map is one shared world at different scales. Camera movement is not travel or new visibility. Prairie, river, roads, fields and relief remain geometry, with deterministic decorative placement; crop stage comes only from projected field state. Farm references do not authorize windmills, modern barns or wire fences in Gonzales. Other places require their own material and footprint research.

Gonzales military samples are tied to the visible battle phase. One-shot smoke/recoil does not loop as constant firing or reveal an unseen battle. Formations do not create copies of real family members. New sessions reset the display phase clock. The Alamo workshop's damage and movement are local demonstrations; integrating them requires a deliberate server/save contract and information filtering.

The animation loop must not rebuild forms. Trade drafts, focus and keyboard work controls are preserved across ticks and pause/resume. Existing family-key rejoin and the Host's individual recovery control remain part of the UI. Keep their selectors and privacy behavior when restyling.

## Remaining production work and checks

See [ANIMATION_REQUIREMENTS.md](ANIMATION_REQUIREMENTS.md) for action coverage and [LIVING_INFORMATION.md](LIVING_INFORMATION.md) for messenger staging. Important gaps include action facings, additional mounted dialogue facings/dismounting, cannon crews, N/S wagon rigs, boats in motion, assisted movement and final cross-sheet registration. Most buildings and props should remain still; requiring idle animation for masonry would be an error.

Run `npm test`, `npm run test:art`, `npm run test:alamo` and `npm run test:trade-animation` with the browser-tool environment in [HANDOFF.md](../HANDOFF.md). Evidence is under `docs/evidence`; screenshots are reproducible under ignored `test-results`. Preserve the foundation browser proofs as well. The current local performance observations are not evidence for 30 physical classroom devices.

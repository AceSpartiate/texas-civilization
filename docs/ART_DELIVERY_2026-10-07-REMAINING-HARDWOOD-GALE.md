# Final colony hardwood gale group — 2026-10-07

Pecan, hackberry and sweetgum at pole, log and large sizes have two painted gust poses each: eighteen frames and nine authored animation loops. Pecan retains its feathery compound-leaf foliage, hackberry its rounded irregular crown, and sweetgum its star-leaf identity. Lower trunks stay rooted while crowns yield rightward.

## Integration and animation

`pecan-hackberry-gale.png` contains twelve frames; `sweetgum-gale.png` contains six. Nine `*-gale` clips alternate two distinct frames at 500 ms each with motion `none`, preserving painted deformation without another procedural bend.

`public/weather-art.js` maps the nine original upright sprite IDs to pose one. Existing callers select them during hard northers. Ordinary and weaker-wind behavior is retained. Both colony sheets now have dedicated gale artwork for all thirty standing-tree frames. Biome trees remain a separate open gale group.

The ordinary map continues using fixed gale poses in cached ground. Animation clips are ready for close-view overlays; this delivery does not continuously animate all terrain or invalidate its cache per frame. No species distribution, tree ID, forestry yield, save or visibility changes are made.

## Verification

`tests/remaining-hardwood-gale-art.test.mjs` verifies nine selectors, weak/non-norther fallback, eighteen fully retained production frames, transparency, nine two-frame clips and gale coverage for all fifteen standing-tree IDs in `trees-colonies-2`. Existing weather and prior gale delivery tests remain applicable.

`scripts/remaining-hardwood-gale-art-proof.mjs` loads the production art/clip renderer and weather selector in an isolated browser fixture. It compares all nine upright trees and both gale poses. Screenshot and PASS record are in `docs/evidence/remaining-hardwood-gale-art.png` and `.json`. This is renderer verification rather than a complete gameplay session.

## Provenance and continuation

Built-in image generation used `trees-colonies-2.png` as its style/identity reference. Spacing edits separate the large crowns into their cells. Selected PNGs are copied unchanged, without raster post-processing. Exact prompts, references and selected source paths are recorded in `scripts/art-deliveries/remaining-hardwood-gale-2026-10-07.mjs` and master prompt/provenance files.

For animated close views use the registered loops with a caller-controlled clock and their ground anchors. Avoid layering a second full shear on the painted deformation. Remaining biome-tree gale work can continue independently.

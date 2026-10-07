# Norther ground cover — 2026-10-07

The remaining basic ground-cover gale subgroup is complete: scrub, reeds and prickly pear each have two dedicated painted poses. Scrub branches and reed blades stream rightward; the cactus keeps its rooted stem with modest outer-pad and grass changes. Muted painted outlines match the existing nature sheet.

## Integration and animation

`public/assets/frontier-v1/atlases/norther-ground.png` supplies six frames. `public/weather-art.js` maps the three original ground-mark IDs to their first gale frames. Existing map-ground callers consume these mappings during a hard norther, retaining ordinary upright/sheared art below the existing threshold. Weather authority, timing and visibility remain unchanged.

Three authored loops — `scrub-gale`, `reeds-gale`, `prickly-pear-gale` — alternate two frames at 500 ms each. These are available for animated close views and previews. The ordinary map uses the first fixed pose in its kept ground: it does not continuously animate these loops or invalidate the whole ground cache every half-second. Future close views should draw loops in an animated overlay rather than rebuilding map terrain. The cactus has restrained movement; do not apply another full shear to any already-deformed gale pose.

This closes the basic scrub/reeds/prickly-pear portion only. Pine, cedar, mesquite, live oak, elm and remaining sized-tree gale silhouettes remain open.

## Verification and provenance

`tests/norther-ground-art.test.mjs` verifies all three selectors at hard/weak/non-norther weather, six retained production frames, transparency and three authored clips. Existing `tests/weather-art.test.mjs` still checks weather blends, transitions, wind direction and stable cache keys; its delivered-kind expectation includes the three new ground covers.

`scripts/norther-ground-art-proof.mjs` loads the actual production art and weather selector in a browser, drawing fair-weather art and both gale poses. Evidence is in `docs/evidence/norther-ground-art.png` and `.json`. This is an isolated renderer fixture, not a full gameplay session.

Built-in image generation plus one spacing edit produced the unchanged PNG. Exact prompts, reference and selected source paths are in `scripts/art-deliveries/norther-ground-2026-10-07.mjs`, mirrored in master prompt/provenance files. No raster post-processing was used. Register/build with the existing art scripts.

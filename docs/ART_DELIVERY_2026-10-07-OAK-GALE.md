# Post oak and blackjack gale art — 2026-10-07

The oak gale subgroup is complete at pole, log and large sizes. Twelve painted frames retain the lighter post-oak and darker blackjack identities from `trees-colonies-2`, with two distinct wind-stressed crowns per size and rooted trunks.

`public/assets/frontier-v1/atlases/oak-gale.png` supplies the twelve frames. Six authored `*-gale` loops alternate poses at 500 ms each; motion is `none` because movement is painted. `public/weather-art.js` maps the six original IDs to first gale poses. Existing map rendering selects them at the unchanged hard-norther threshold, retaining ordinary weaker-wind behavior.

The cached map uses fixed gale poses. Animation clips are ready for close-view overlays; they are not continuously played across the ordinary map. Avoid adding another full wind shear or invalidating the whole ground cache per animation frame. Forestry, species distributions, tree IDs, saves and visibility are unchanged.

## Verification and source

`tests/oak-gale-art.test.mjs` verifies all six selectors, ordinary/weak-wind fallback, twelve fully retained production frames, alpha transparency and six two-frame clips. Existing weather tests include the expanded delivered set and still check blend, fog, transition and stable cache behavior.

`scripts/oak-gale-art-proof.mjs` uses the actual art loader, weather selector and clip renderer to compare six upright trees and both gale poses. Evidence is `docs/evidence/oak-gale-art.png` and `.json`. This is an isolated renderer fixture rather than a complete gameplay session.

Built-in image generation used `trees-colonies-2.png` as the style/identity reference. The PNG was copied unchanged without raster post-processing. Exact prompt, reference and selected source path are recorded in `scripts/art-deliveries/oak-gale-2026-10-07.mjs` and the master prompt/provenance files. Existing registration/build scripts update manifests.

Only post-oak/blackjack gale art is closed here. Sized pecan, hackberry, sweetgum and biome-tree gale art remains open.

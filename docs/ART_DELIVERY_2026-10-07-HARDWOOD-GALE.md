# First colony-sheet hardwood gale art — 2026-10-07

This group is complete: mesquite, live oak and elm at pole, log and large sizes each have two painted hard-norther poses. Mesquite keeps its airy twiggy crown, live oak its dense low crown, and elm its spreading arching crown. Lower trunks remain rooted as upper foliage yields rightward.

## Art and integration

Two sheets supply eighteen frames: `mesquite-liveoak-gale.png` has twelve; `elm-gale.png` has six. Nine authored `*-gale` loops alternate their two poses at 500 ms each. Painted deformation uses motion `none` so no additional procedural bend is layered on the clip.

`public/weather-art.js` binds all nine existing upright frame IDs to pose one in `GALE_POSES`. Existing map callers use these frames when the existing hard-norther threshold is met. Upright art and weaker-wind shear stay available in ordinary weather. The cached map uses fixed gale poses, not continuously animated loops. Loops are ready for close-view animated overlays; avoid invalidating the entire map ground every half-second.

With the previous pine/cedar delivery, every standing-tree frame in `trees-colonies-1` has gale artwork. Trees in `trees-colonies-2` and the biome tree sheet remain open. No changes to species distributions, tree IDs, yields, saves, weather transitions or fog-of-war authority are included.

## Verification

`tests/hardwood-gale-art.test.mjs` checks all nine weather selectors, weak/non-norther fallback, eighteen retained production frames, transparency and nine two-frame clips. Existing weather tests now expect the expanded delivered set and retain unpainted-tree fallback checks using second-sheet hardwoods.

`scripts/hardwood-gale-art-proof.mjs` loads production art, weather selection and clip rendering in an isolated browser fixture, comparing all nine upright trees with both gale poses. Evidence is `docs/evidence/hardwood-gale-art.png` and `.json`. This verifies rendering rather than a complete gameplay session.

## Provenance and Claude continuation

Built-in image generation used `trees-colonies-1.png` for identity and style, followed by spacing/edge cleanup. Selected PNGs are copied unchanged; no raster post-processing. Exact prompts, references and chosen sources are in `scripts/art-deliveries/hardwood-gale-2026-10-07.mjs` and master prompt/provenance files. Existing registration/build scripts regenerate the atlas, animation registry and manifest.

Use the registered loops with a caller-controlled clock and stable ground anchor in animated close views. Continue second-sheet or biome gale requests independently; this closes only first-sheet standing-tree gale art.

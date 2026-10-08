# Biome-tree gale group — 2026-10-08

All thirteen existing biome-tree sizes have two painted gust poses: longleaf pine, sabal palm and bald cypress at pole/log/large sizes, plus magnolia and beech at log/large sizes. Twenty-six frames supply thirteen authored loops. Pines preserve long-needle tufts, palms their fan fronds, cypress its buttressed base and attached moss, magnolia glossy broad leaves and flowers, and beech its pale trunk.

## Integration and animation

Three sheets supply the art: `biome-pine-palm-gale.png` (12 frames), `biome-cypress-gale.png` (6) and `biome-broadleaf-gale.png` (8). Each `*-gale` clip alternates two distinct frames at 500 ms each with motion `none`; the wind deformation is painted.

`public/weather-art.js` maps all thirteen original IDs to first gale poses. Existing map callers use them at the unchanged hard-norther threshold. Ordinary weather keeps upright art and weaker-wind shear. The cached map uses fixed gale poses; loops are available for animated close-view overlays rather than per-frame ground-cache invalidation.

This completes gale art for the existing `biome-trees-fields` tree frames, alongside the already delivered colony-sheet coverage. Generic nature marks such as sapling and cottonwood still retain fallback; this does not claim every possible future species or weather effect is complete. Species distributions, forestry yields, tree IDs, saves and visibility are unchanged.

## Verification

`tests/biome-tree-gale-art.test.mjs` checks thirteen weather selectors, weak/non-norther fallback, twenty-six fully retained production frames, alpha transparency, thirteen clips and full coverage of the biome sheet's tree IDs. Prior weather/art tests retain their transition, blend, fog and stable-cache checks.

`scripts/biome-tree-gale-art-proof.mjs` loads the actual production art, weather selector and clip renderer in an isolated browser fixture, comparing thirteen upright trees and both gale poses. Evidence is `docs/evidence/biome-tree-gale-art.png` and `.json`. This verifies rendering rather than a whole classroom gameplay session.

## Source and Claude continuation

Built-in image generation used `biome-trees-fields.png` for identity/style. Selected source images are copied unchanged; no raster post-processing. Exact prompts, any generation refinements, references and source paths are in `scripts/art-deliveries/biome-tree-gale-2026-10-08.mjs` and the master prompt/provenance files. Existing registration/build scripts regenerate measured manifests and animation metadata.

Use caller-controlled clocks and ground anchors for animated close views. Do not add a second full shear to already-deformed gale frames. Continue unrelated generic nature/ground/weather requests independently.

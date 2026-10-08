# Shortleaf pine species art — 2026-10-08

Completed the shortleaf group: twelve warm painted frontier frames provide pole/log/large standing trees, two gust poses per size, and three cut stumps. This replaces the species' shared loblolly artwork.

The illustrative needle and bark design is informed by the [US Forest Service shortleaf species review](https://research.fs.usda.gov/feis/species-reviews/pinech), which describes relatively short needles and bark becoming reddish brown with age. These are readable miniature interpretations, not measured botanical reconstructions. The existing colony tree sheet is the style reference.

## Runtime and manifest

Sheet: `public/assets/frontier-v1/atlases/trees-shortleaf.png`, selected generated PNG copied unchanged. For each size pole/log/large: `pine-shortleaf-<size>`, `pine-shortleaf-<size>-gale-1`, `pine-shortleaf-<size>-gale-2`. Stumps: `stump-pine-shortleaf-pole`, `stump-pine-shortleaf-log`, `stump-pine-shortleaf` (large).

Three clips `pine-shortleaf-<size>-gale`, two authored frames at 500 ms each, looping, no positional motion. Exact prompts/refinement and image provenance are in `scripts/art-deliveries/shortleaf-2026-10-08.mjs` and the generated prompt/provenance records. Atlas, animation and manifest are rebuilt.

`KINDS.shortleaf` in `sim/woods.mjs` now selects its own sized standing artwork and its own general stump. Its location rules, log yield, wall suitability and felling coefficient are unchanged. The existing forestry renderer uses the general large stump for all sizes; smaller stump frames are available for future size-specific presentation, not currently claimed as live bindings.

`GALE_POSES` in `public/weather-art.js` selects the first authored gust frame in hard northers. The cached map remains a held-pose rendering; the new two-frame loops are available to close views without forcing per-frame terrain-cache rebuilds.

## Verification

`node --test tests/shortleaf-art.test.mjs tests/woods-view.test.mjs tests/weather-art.test.mjs`: 27 tests pass. All twelve frames retain 100% of visible pixels with zero trimming. Size/stump registry, unchanged forestry yields, gale thresholds, terrain tiles and server view regressions pass.

`scripts/shortleaf-art-proof.mjs`: Chrome production art.js and weather selectors render all twelve frames without page errors. Evidence: `docs/evidence/shortleaf-art.png` and `.json`. This isolated art fixture is not a full game playthrough.

## Claude continuation

Do not regenerate shortleaf trees. Retain species-specific picture names through forestry/map work. Close views can play the supplied gale clips; cached terrain uses the first gust pose. Generic felled logs and remaining species-specific hardwood requests are separate outstanding groups. Do not change ecology or resource balances as part of this art delivery.

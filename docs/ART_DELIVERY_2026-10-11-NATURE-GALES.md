# Generic norther trees — complete remaining September 20 group

The last recorded generic nature tree refinements are delivered: cottonwood and sapling each have two painted gust poses and one authored looping clip. This closes the remaining norther parent group; its original oak, pecan, grass and smoke contract and later colony/biome/ground-cover batches were already delivered.

## Inventory

`nature-gales.png` contains `cottonwood-gale-1`, `cottonwood-gale-2`, `sapling-gale-1`, `sapling-gale-2`. Clips `cottonwood-gale` and `sapling-gale` use two distinct 600 ms frames, loop, authored, motion `none`. The crowns flex downwind; grounded bases remain seated. Pause a close-view clip with the existing `paused` option. The kept map ground uses pose one, as the other tree batches do, to avoid repainting the country each animation frame.

Source PNG is copied unchanged from built-in imagegen. Full generation, spacing and identity-correction prompts and paths are recorded in `scripts/art-deliveries/nature-gales-2026-10-11.mjs`, `docs/art-prompts.json` and `docs/art-provenance.json`. The browser comparison caught that the runtime cottonwood is the tall, narrow third source tree rather than the rounded fourth reference tree; both gusts were corrected before delivery.

## Integration

`GALE_POSES` registers both generic trees, so existing catalogue-tree drawing picks them during hard northers. Added `drawWeatherTree` preserves upright identity and ordinary wind lean if the new art is unavailable; authored poses receive no second shear. Legacy invented-map wood stands now sample weather at each tree's world position rather than bypassing weather. Calm/storm rules, region blending, collision, resources and fog-of-war knowledge are unchanged.

The library audit now derives its drawn-tree inventory from `KINDS` and explicit size pictures as the renderer does, plus legacy tree and riverbank reed callers. This fixes the previously reported false failures for delivered gale poses; it still rejects missing frames and gale mappings without a drawing source.

## Proof and handoff

`node --test tests/nature-gale-art.test.mjs tests/weather-art.test.mjs tests/asset-http.test.mjs tests/art-library.test.mjs`: **31 passing**. The full library suite remeasures every shipped PNG and checks manifest equality, usable silhouettes, actual drawing sources and fallback contracts. Four new crops retain 100% of their visible pixels, zero trimming and transparent corners.

`scripts/nature-gale-art-proof.mjs` exercises the production art loader and weather renderer through the real classroom server: upright art, both gust poses, reduced scale and fair/norther/fair regional selection. Eight successful draws, four distinct animation frames, no browser errors. Reviewed image: `docs/evidence/nature-gale-art.png`; machine results: adjacent JSON. This is a renderer fixture, not a full multiplayer playthrough.

Broad remaining backlog: **17 dated parent groups**. Future species-specific trees remain under the country/colony species requests, not this completed generic gale group. No deployment included.

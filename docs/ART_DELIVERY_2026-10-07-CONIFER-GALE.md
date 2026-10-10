# Conifer gale art — 2026-10-07

The loblolly-pine and cedar gale subgroup is complete at pole, log and large sizes. Twelve painted frames keep the existing species silhouettes while branches and foliage yield rightward in a hard norther. Rooted lower trunks remain firm. Each size has two distinct poses.

## Integration and animation

`public/assets/frontier-v1/atlases/conifer-gale.png` is registered with twelve `*-gale-1`/`*-gale-2` frames and six authored `*-gale` loops. Each loop alternates poses at 500 ms per frame; motion metadata is `none` because the deformation is painted, not a second procedural bend.

`public/weather-art.js` maps the six original upright frame IDs to their first gale poses. Existing map callers already consume these mappings. Ordinary and weaker wind keeps the previous behavior. Hard-norther ground remains cached, using a fixed gale pose; the two-frame loops are ready for close-view animated overlays. This delivery does not continuously animate the whole map or introduce new weather timing.

The simulation's shortleaf pine still uses loblolly artwork and inherits these weather poses. No species distribution, forestry yield, tree ID, save data or fog-of-war rule changed. Remaining mesquite/live-oak/elm and other sized-hardwood gale art stays open.

## Verification

`tests/conifer-gale-art.test.mjs` checks six gale selectors, weak and non-norther fallback, twelve production frames with complete visible-pixel retention and six two-frame clips. `tests/weather-art.test.mjs` retains its blend, transition, wind, fog and cache-key checks with the expanded delivered-kind set.

`scripts/conifer-gale-art-proof.mjs` loads the real production loader, weather selector and clip renderer in an isolated browser fixture. It compares all six upright trees against both gale poses. Screenshot and PASS record are in `docs/evidence/conifer-gale-art.png` and `.json`. This is renderer verification, not a full classroom gameplay session.

## Provenance and continuation

Built-in image generation used `trees-colonies-1.png` as the style/identity reference, followed by one spacing and edge-cleanup edit. The selected PNG is copied unchanged into the repository. Exact prompts and source paths are in `scripts/art-deliveries/conifer-gale-2026-10-07.mjs` and the master prompt/provenance files. Art registration/build uses the existing scripts.

For a future animated close view, use the registered loop with a caller-controlled clock and place it at its ground anchor. Do not add another full wind shear to the deformed artwork. The map should continue to use its kept ground unless an independently measured animated overlay is added.

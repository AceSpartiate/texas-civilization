# San Jacinto marsh-edge scenery — 2026-10-08

Completed scenery group: two warm painted, brown outlined shoreline patches matching the frontier library, with eight authored frames. Dense cordgrass and sparse reeds each have a 1.4-second four-frame loop. Shallow blue-gray water and moving ripple marks distinguish the wet ground from dry fields.

## Runtime and manifest

- Source: `public/assets/frontier-v1/atlases/marsh-edge.png`, unchanged generated PNG with transparent gutters.
- Sprites: `marsh-edge-dense-1` through `-4`, `marsh-edge-sparse-1` through `-4`.
- Clips: `marsh-edge-dense`, `marsh-edge-sparse`; 350 ms per frame, loop true, no positional motion.
- Delivery module: `scripts/art-deliveries/marsh-edge-2026-10-08.mjs`; exact prompts and source paths also registered in art-prompts/art-provenance. Generated atlas, animation and manifest include all eight frames.
- `public/battle-view.js` draws both shoreline loops at the existing deterministic marsh work locations, with open-water ripples between them. Legacy reeds remain a fallback if an older asset library lacks the clips. Pausing or reduced motion fixes the works clock at zero.

## Verification

`node --test tests/marsh-edge-art.test.mjs tests/battle-view.test.mjs`: 12 tests pass. All eight frame audits retain 100% visible pixels with zero trimming. Tests exercise the actual battle renderer selecting both variants, stable placement, water, paused/reduced-motion clocks and legacy fallback.

`scripts/marsh-edge-art-proof.mjs`: browser fixture uses production art.js/atlas loader and drawClip. All eight poses render distinctly, no browser errors. Evidence: `docs/evidence/marsh-edge-art.png` and `.json`. This is an isolated production-art fixture, not a full multiplayer battle playthrough.

## Claude continuation

This completes marsh-edge scenery only. Thigh-deep wading/running people remain outstanding and should use age/faction-compatible authored poses. Do not treat this scenery delivery as completion of that figure request. Battle ground coordinates, historical claims, movement and fog of war are unchanged. The shore shapes are illustrative visual interpretations, not surveyed reconstructions of Peggy’s Lake.

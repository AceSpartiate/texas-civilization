# San Jacinto marsh wading — 2026-10-08

Completed the generic marsh-wading figure request: eight warm painted brown-outlined frames, four for a brown-coated volunteer and four for a navy-coated Mexican regular. Alternating arms and splashes animate effort through thigh-deep water. There are no wounds or gore.

## Production contract

- Sheet: `public/assets/frontier-v1/atlases/marsh-wading.png`, selected generated PNG copied unchanged.
- Sprites: `volunteer-wade-1` through `-4`, `regular-wade-1` through `-4`.
- Clips: `volunteer-wade`, `regular-wade`; four frames at 240 ms each, looping, no positional motion.
- Both face east; west uses the renderer's existing horizontal flip. No north/south poses are claimed.
- Exact prompts, original image, spacing refinement and selected image are recorded in `scripts/art-deliveries/marsh-wading-2026-10-08.mjs` and the generated provenance/prompt registries. Atlas, manifest and animation registrations include all eight frames.

`public/wading-art.js` tests the existing work ellipse in world coordinates. In San Jacinto's rout/killing phases, moving non-firing foot soldiers within a marsh/water work select the appropriate clip in `battle-view.js`. Dry ground keeps ordinary movement. Mounted, firing, surrendered, injured and special-character poses retain their existing handling. The final figure animation call now respects Host pause as well as reduced motion. No simulation movement, casualties, chronology or visibility is changed.

## Verification

`node --test tests/marsh-wading-art.test.mjs tests/marsh-edge-art.test.mjs tests/battle-view.test.mjs`: 16 tests pass. Eight retained-pixel audits show zero trimming and 100% retained visible pixels. The actual battle renderer is tested for wading selection, surrender priority and pause/reduced-motion handling; the selector is tested for dry ground and ineligible states.

`scripts/marsh-wading-art-proof.mjs` uses production art.js, the atlas loader and drawClip in Chrome. All eight frames render distinctly with no page errors. Evidence is in `docs/evidence/marsh-wading-art.png` and `.json`. This isolated art fixture is not a full multiplayer battle playthrough.

## Claude continuation

Together with the previous marsh-edge delivery, this closes the original generic marsh scenery/figure request. These are generic battle soldiers, not family appearance layers or named-person likenesses. Age-specific family wading and cardinal-angle refinements are separate future work if gameplay requires them. Preserve the existing historical stage data and information asymmetry; art never determines who survives or who can see an event. Costume and wet-area shapes are illustrative interpretations, not new historical claims.

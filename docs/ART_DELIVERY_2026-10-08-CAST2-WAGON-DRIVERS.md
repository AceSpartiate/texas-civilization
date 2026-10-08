# Second-cast wagon drivers — 2026-10-08

Completed the four second-cast driver identities: rust-woman, indigo, ochre and blue-girl. Thirty-two warm painted, brown-outlined frames provide two seated rein-handling poses in every south/east/west/north heading. Faces, bonnet, bun, braid, apron and waistcoat follow their existing cast artwork. No vehicle is included in these transparent compositing layers.

## Assets and animation

Sheets: `cast2-drivers-women.png` (rust-woman/indigo) and `cast2-drivers-youth.png` (ochre/blue-girl), under `public/assets/frontier-v1/atlases/`. Each selected generated PNG is copied unchanged. Every sheet has four rows (south/east/west/north), with identity A poses 1/2 then identity B poses 1/2 in its columns.

Sprites: `<identity>-wagon-driver-<s|e|w|n>-<1|2>`. Clips: `<identity>-wagon-driver-<s|e|w|n>`, two authored frames at 600 ms each, looping, no positional motion. West is drawn separately; do not mirror it. Provenance and exact generation/refinement prompts are registered from `scripts/art-deliveries/cast2-wagon-drivers-2026-10-08.mjs`, with atlas, manifest and animation rebuilt.

`DRIVING_FIGURES` in `public/motion.js` now includes all eight adult/adolescent cast identities. The existing `seatedClip` chooser selects a full seated layer instead of the standing figure clipped at the waist. The existing wagon, team, seat layout, driver ownership and palette path remain in use. This art does not change who may drive.

## Verification

`node --test tests/cast2-wagon-driver-art.test.mjs tests/riding.test.mjs`: eight tests pass. Every new frame retains 100% of visible pixels with zero trimming. Tests generate actual family identities and prove all sixteen new seat selections; horse, wagon ownership and seat geometry regressions also pass.

`scripts/cast2-wagon-driver-art-proof.mjs`: Chrome production art.js/atlas fixture selects all sixteen clips through seatedClip and renders thirty-two distinct frames without page errors. Screenshot and JSON: `docs/evidence/cast2-wagon-driver-art.png` and `.json`. This fixture shows the character layers; it is not a full journey playthrough or a new wagon geometry proof.

## Claude continuation

The second-cast wagon driver group is complete. Age-specific girl/boy/smallchild/infant drivers remain separate and still use their existing composite fallback. Blue-girl here is the existing adolescent cast identity, not the younger age-specific girl sprite. Passenger poses and infant-in-arms art remain separate. Keep drawn reins attached to hands when refining the vehicle composition; the current artwork uses the existing approximate seat anchors, without introducing new measured hip metadata. Pose changes are subtle rein-handling movement rather than a walking gait.

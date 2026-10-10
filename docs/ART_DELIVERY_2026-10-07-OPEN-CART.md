# Open-cart vehicle group complete: 2026-10-07

32 transparent frames across two atlases, six authored four-frame empty/loaded travel cycles facing east, south and north. West mirrors east. Six primary parked states cover empty/loaded in three directions, plus two loaded alternatives. The cart keeps its uncovered plank bed, curved shaft and two spoked iron-rimmed wheels. Wheel scuffs change location across poses to make rolling readable at game scale. North shows the shaft behind the bed, south in front. Cargo is illustrative bundles/crate/blanket rather than proof of particular inventory contents.

`miniWagon` in `public/app.js` selects the six travel clips from the projected movement, heading and laden flag. Existing animation/gait timing is reused. Stopped carts use parked states; the old static cart remains a missing-art fallback. The ox stays separate. Broken vehicles preserve the existing damage behavior. No travel speed, capacity, passenger allocation or visibility changed.

This completes the CART VEHICLE portion (item 1) of September 25 riders/walkers/cart. It does not close that entire mixed request: seated passenger layers, drawn-back wagon tail, and infant-carrying walks remain open. No new broad request is silently marked complete.

Built-in imagegen used the existing open cart as reference and refined wheel markers/rear shaft. All selected PNGs copied unchanged. Exact prompts and source/refinement paths: `scripts/art-deliveries/open-cart-complete-2026-10-07.mjs`; prompt/provenance master records and generated manifests inventory all frames and timings. Two-pose-like changes in frontal tire view are naturally subtle; these are four keyframes, not physical wheel rigs or interpolated rotations.

Tests check transparent corners/full silhouette retention, clip inventory, loaded/empty directional selection, west mirroring and damage fallback. Existing carreta and motion binding tests protect adjacent travel behavior. Browser proof renders all 32 frames and checks six cycles change pixels: `scripts/open-cart-complete-art-proof.mjs`, evidence `docs/evidence/open-cart-complete-art.png` and `.json`.

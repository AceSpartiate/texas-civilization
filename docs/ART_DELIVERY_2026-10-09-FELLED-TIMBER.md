# Felled timber props — 2026-10-09

Completed the general felled-log art request with four rigid scenery props: fresh fallen trunk in east/west and north/south orientations, a trimmed construction log, and a low five-log stack. Painted reddish bark, pale cut ends and growth rings match the current frontier tree/stump artwork. These are reusable illustrative timber props, not species-specific bark claims.

## Asset contract

Sheet: `public/assets/frontier-v1/atlases/timber-felled.png`, selected generated PNG copied unchanged. Sprite/held-clip IDs: `timber-felled-e`, `timber-felled-n`, `timber-trimmed-e`, `timber-stack`. Each clip has one frame, loop false, motion none. Rigid wood does not breathe or sway. To animate hauling, translate the entire sprite along the actor/object's existing route; do not cycle the four different states as though they were animation poses.

East/west means the trunk lies across the screen; north/south means it recedes into the screen. These are prop orientations, not character headings. All frames use the production loader's default bottom-center draw anchor. The logs contain neither workers nor ground, so those remain separate layers.

Exact generation and spacing refinement prompts, original/selected source paths and provenance are registered in `scripts/art-deliveries/felled-timber-2026-10-09.mjs` and the generated art records. Atlas, animation, manifest and ART_MANIFEST include all four frames.

## State and motion guidance for Claude

- After the simulation confirms a tree was felled, show `timber-felled-e` or `timber-felled-n` beside the existing stump if the scene has a timber object to display.
- After trimming is confirmed, use `timber-trimmed-e` for the same timber object's state.
- During hauling, move that rigid prop with the permitted actor/transport projection. Keep hands, rope or wagon as separate layers. Existing worker motion can continue underneath.
- At storage, use `timber-stack` only when the projected inventory warrants it; five illustrated logs are not an authoritative inventory count.

This is a completed library art group. No new timber entity, hauling command or live map placement is implemented here. Forestry currently records felled trees/stumps and inventory; adding a persistent fallen-log object is separate gameplay work. Do not fabricate visible logs outside the player's permitted projection or duplicate harvested inventory.

## Verification

`node --test tests/felled-timber-art.test.mjs`: two tests verify retained visible pixels, zero trimming, transparency and rigid held-pose metadata.

`scripts/felled-timber-art-proof.mjs`: Chrome production art.js/atlas fixture renders all four props without page errors. A 60-pixel hauling translation moves both silhouette bounds exactly 60 pixels, retaining the same shape. Evidence is `docs/evidence/felled-timber-art.png` and `.json`. This is a renderer fixture, not proof of a live hauling feature.

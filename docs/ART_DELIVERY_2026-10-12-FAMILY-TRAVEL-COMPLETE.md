# Family travel artwork — complete September 25 group

116 new usable frames, 43 authored loops and eight transparent atlases finish the outstanding riders, walkers and cart artwork. The open cart vehicle, child passengers and infant basket passengers were delivered separately and remain in use. New assets match the original/second cast references rather than replacing family identities.

## Manifest

| Sheet | Frames | Layout / clips |
| --- | ---: | --- |
| `adult-passengers-cast1` | 24 | Columns rust, teal, elder, blue; paired rows east, south, north. `<identity>-wagon-passenger-<e/s/n>-<1/2>`; matching two-pose clips omit frame suffix. |
| `adult-passengers-cast2` | 24 | Columns rust-woman, indigo, ochre, blue-girl; same row order and naming. |
| `family-infant-walk-rust-woman` | 12 | Four columns of walk phases, rows east, south, north. |
| `family-infant-walk-indigo` | 12 | Same. |
| `family-infant-walk-ochre` | 12 | Same. |
| `family-infant-walk-blue-girl` | 12 | Same. |
| `family-infant-walk-rust` | 12 | Required male carrier, using the established rust father identity. |
| `wagon-cover-drawn-back` | 8 | Columns east, west, south, north; two rows of wheel/cloth poses. `wagon-open-cover-<e/w/s/n>-<1/2>`; matching clips omit suffix. Complete vehicle, no painted ox or passengers. |

Carrier names: `<identity>-infant-walk-<e/s/n>-<1..4>`; clips omit the frame suffix. Passenger duration 750 ms per pose; walk 230 ms per phase; cover vehicle 400 ms per pose. All loops are authored with `motion:none`: painted motion, without stretching the body. Passenger/carrier west mirrors east; cover has its own painted west. Logical height is normalized per identity and heading over each cycle so figures do not pulse in size. Runtime manifest is `public/assets/frontier-v1/{atlas,animation,manifest}.json`; source prompts and correction history are in `scripts/art-deliveries/family-travel-complete-2026-10-12.mjs` and the generated prompt/provenance manifests. Built-in image generation used; selected PNGs copied unchanged into `public/assets/frontier-v1/atlases/`.

## Production changes

`seatedClip` now selects the eight adult passenger layers as well as the already delivered child/basket layers. Complete bodies use existing `bedLayout(..., true)` hip seating, `SEAT.driverHip=.42`, and seated height .65 of the person's standing scale. This is the existing driver-relative placement contract, not an archaeological measurement. Customized passengers select their actual `avatarVariant`; unsupported head silhouettes keep their current drawing, rather than silently becoming another person.

`carryingInfantClip` selects a supported walking caregiver only when exactly one actual projected infant is assigned to that person by `travel.carried`. It requires foot travel, same household, and a living caregiver/baby. Injury/capture/death and battle down take precedence. The production renderer uses the existing distance-driven gait and pauses when halted; the infant is hidden as a separate figure only after the corresponding composite is ready. No baby is invented from sex, family size or a task. Twins, unsupported caregiver silhouettes, riding/wagon carriers and observed people retain existing handling. Their specialized compositing remains a gameplay/appearance task; the original art request requires one infant in each of five carrier identities.

## Claude continuation: cover vehicle composition

The pulled-back cover views are library-ready, not yet substituted into `miniWagon`. Canvas is gathered at one end; the bed and tail are visible. Use measured frame bounds, not source-grid centers. Register each heading's driver seat, bed floor and near rail before adopting it. Keep separate ox/yoke/tongue alignment; do not paint a second ox. Draw far rail/floor first, passengers on their actual hips, then near rail/tail over dangling legs where appropriate, and gathered canvas only where it occludes them. The current vehicle anchor/driver layout was measured for the older wagon and must not be reused blindly. Loaded cargo must not occupy the same seat as a person; retain server seat ordering/capacity. Wheel phase follows distance traveled, never an artificial acceleration. A complete vehicle sheet supplies the requested drawn-back tail/cover appearance; rail masking is compositor work, not additional missing artwork.

Preserve parent head identity and the infant's own appearance when implementing semantic multi-person recoloring later. Current composite recoloring uses the caregiver's existing palette path; the baby's neutral cream swaddle is intentionally simple. Do not generalize these five silhouettes into all offered creation heads; that breadth belongs to the remaining appearance group.

## Verification

42 targeted tests pass: new delivery/selection/infant guards, child and infant passengers, riding, motion bindings, travel modes and travel speed. Browser proof draws every one of the 116 frames, checks distinct rendered phases for all 43 clips and reports zero page errors. All silhouettes retain 100% of audited visible pixels with zero trimming. Eight composition screenshots are under `docs/evidence/*-proof.png`; summary `docs/evidence/family-travel-art.json`. Existing atlas frames and animation clips were compared against HEAD to ensure no unrelated art changes. No server state, seat assignment, travel pace, birth rules or information authority changed. No deployment performed.

Run `node --test tests/family-travel-art.test.mjs tests/child-passenger-art.test.mjs tests/infant-passenger-art.test.mjs tests/riding.test.mjs tests/motion-binding.test.mjs tests/travel-modes.test.mjs tests/travel-speed.test.mjs` and `node scripts/family-travel-art-proof.mjs` with the documented local Playwright/Chrome environment.

**Three broad art groups remain:** famous-person action refinements, semantic family appearance/task breadth, and identity-specific family battle/transport artwork.

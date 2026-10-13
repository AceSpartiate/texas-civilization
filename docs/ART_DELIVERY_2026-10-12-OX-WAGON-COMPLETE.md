# Ox wagon artwork complete — 2026-10-12

The September 16 driving-wagon artwork group is complete: 24 whole connected rig frames plus sixteen school-age seated driver layers, fourteen authored clips. The established eight adult/adolescent driver identities were already delivered. Toddlers and infants are passengers, not missing drivers: sim/company.mjs assigns drivers only from SENT_FROM_AGE (ten), and their seated passenger/basket art is already delivered.

## Complete manifest

| Atlas | Layout | Sprite names | Clips |
| --- | --- | --- | --- |
| ox-wagon-composite-e | 4 columns × 2 rows; empty then loaded | ox-wagon-{empty/loaded}-e-{1..4} | ox-wagon-empty-e, ox-wagon-loaded-e |
| ox-wagon-composite-s | same; directly toward camera | ox-wagon-{empty/loaded}-s-{1..4} | ox-wagon-empty-s, ox-wagon-loaded-s |
| ox-wagon-composite-n | same; directly away | ox-wagon-{empty/loaded}-n-{1..4} | ox-wagon-empty-n, ox-wagon-loaded-n |
| people-child-wagon-drivers | 4 × 4; rows south/east/west/north; girl two poses then boy two poses | {girl/boy}-wagon-driver-{s/e/w/n}-{1..2} | {girl/boy}-wagon-driver-{s/e/w/n} |

Whole rigs loop in four 300 ms phases (1,200 ms total). Each includes one brown ox, wooden neck yoke, connected tongue, four-wheel wooden wagon and cream cover. Empty/loaded differ in visible sacks/crate/barrel. Walk feet, wheel spokes and subtle cloth changes are authored. East mirrors west; north/south are separately painted. The north view correctly hides the ox legs behind the wagon instead of dangling them beneath the rear tailgate. No driver is baked into the rig.

Child drivers loop in two 600 ms rein/goad handling phases. Both retain their baseline identity: braided terracotta/apron girl, blond cream shirt/brown trousers/barefoot boy. All four headings are painted, so west driver layers must NOT be mirrored. These are seated complete bodies, not cropped standing figures.

## Bindings and compositor contract for Claude

Girl/boy are added to DRIVING_FIGURES. The current drawSeated renderer requests these clips and anchors complete seated layers using SEAT.driverHip and SEAT.driverHeight. Existing customized appearance, vehicle/ox ownership, passenger assignment, fog-of-war and lazy loading fallbacks remain. No eligibility, seating capacity, travel speed or world entities changed.

The new whole rigs are library-ready; the current renderer continues its existing separate vehicle/ox composition. Migrating it must be explicit because a whole rig replaces TWO projected objects and moves the driver/passenger anchors. Do not draw the old ox/wagon underneath, or change their simulation ownership.

Use one whole rig at a fixed heading-specific logical height, not ox height: choose scale from the wagon roof/axle, keep loaded and empty at identical scale, and preserve the projected travel point. Driver layering: east/west sits at the FRONT edge of the wagon box nearest tongue (not at the rear opening); south sits on the front bench above/behind the yoke; north sits at the far front and must be occluded by the roof. Reins join hands to yoke without crossing the canvas. Rear-bed passenger visibility requires existing open-backed art or a cutaway/mask, not drawing passengers on top of an opaque cover. The separate September 25 cover/tail and adult-passenger group remains open.

Frames have measured alpha bounds and hoof/ground anchors in atlas.json; use those actual bounds to register seat points, never cell corners. Match a stationary driver/wagon assembly at all headings before replacing seatLayout. During travel feed a shared route clock to the four rig phases and paired driver clip; when stopped hold a phase. Wheel art is a small readable animation, not a physically calibrated axle-distance simulation. Shape/seat placement is stylized, not a surveyed wagon reconstruction.

## Verification and sources

16 targeted tests passed, covering inventory, complete retained alpha, zero trimmed pixels, fixed rig scale across load states, clip timings, direction selection, complete seated children and preserved horse/wagon deduplication. Browser proof draws all forty frames, six distinct four-phase rigs, eight distinct two-phase driver loops and both child layers on the existing wagon body; zero page errors. Evidence: docs/evidence/ox-wagon-art.png and .json.

Run `node --test tests/ox-wagon-art.test.mjs tests/riding.test.mjs tests/motion-binding.test.mjs` and `node scripts/ox-wagon-art-proof.mjs` with the standard Playwright/Chrome environment.

Built-in imagegen used project wagon, stock, child and seated-youth references. East underwent spacing correction; north underwent physical occlusion correction. Selected PNGs copied unchanged, with no programmatic raster edits. Full exact prompts, reference paths and original/selected sources are in scripts/art-deliveries/ox-wagon-complete-2026-10-12.mjs and docs/art-prompts.json / art-provenance.json. Four public PNGs reside under public/assets/frontier-v1/atlases/. ART_MANIFEST.md and atlas/animation/manifest JSON are rebuilt.

**6 dated parent artwork groups remain.** Artwork complete does not claim whole-rig gameplay migration is finished. No deployment performed.


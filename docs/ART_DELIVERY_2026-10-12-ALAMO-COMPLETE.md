# Alamo battle artwork complete — 2026-10-12

The remaining September 25 Alamo artwork is delivered: **76 new frames and 21 authored clips**, plus a continuous night/dawn presentation grade. Existing compound geometry, interiors, collision, north-wall destruction, ladders, heavy/siege guns, canister, flags, smoke and aftermath artwork are preserved.

## Complete manifest

| Atlas | Layout / identities | Frames |
| --- | --- | --- |
| alamo-parapet-service | 4 × 4; east/west/north/south waist-up volunteer aim, recoil, low load, ramrod | 16 |
| people-alamo-travis-service | 4 × 4; same headings/phases, complete named Travis body | 16 |
| alamo-volunteer-trot | 4 × 3; east/south/north controlled trot | 12 |
| alamo-upright-lancer-e | 4 × 2; east walk then idle | 8 |
| alamo-upright-lancer-s | 4 × 2; south walk then idle | 8 |
| alamo-upright-lancer-n | 4 × 2; north walk then idle | 8 |
| alamo-battery-guns | 4 × 2; north/church variants, east ready/kick then west ready/kick | 8 |

All sprites are measured and registered in atlas.json / ART_MANIFEST.md.

- `volunteer-parapet-{e/w/n/s}-{aim/fire/load/ramrod}`; clips `volunteer-parapet-fire-{heading}`.
- `travis-battery-{e/w/n/s}-{aim/fire/load/ramrod}`; clips `travis-battery-fire-{heading}`.
- Both service families use four phases of 1,500/300/900/900 ms (3.6 seconds), looping authored motion-none. This is a readable firing/loading presentation, not the separate full eight-step mounted reload.
- `volunteer-trot-{e/s/n}-{1..4}`; clips omit frame suffix, four 180 ms poses, looping, authored motion-none.
- `lancer-upright-{march/idle}-{e/s/n}-{1..4}`; matching clips omit suffix. March uses 260 ms poses, idle 850 ms. Four authored phases each; lance remains up, never strikes.
- `cannon-alamo-{north/church}-{e/w}` and matching `-kick` sprites; `-recoil` clips use kick 180 ms then ready 720 ms, non-looping. Rigid carriage translation uses motion recoil, with the correct east/west sign; the gun does not stretch.

East mounted cycles mirror west. All four foot-service headings are separately painted and must not be mirrored. Standing Travis aim poses establish logical body height, so a raised ramrod never shrinks his body. Parapet logical height uses the east aiming torso; waist is the base anchor, not a boot-ground anchor. Lancer logical height includes the upright lance and stays constant across walk/idle for each heading.

## Integrated behavior

The Alamo's north and church battery IDs select their dedicated guns, with existing field-gun load fallbacks. The 18-pounder remains the larger heavy gun at its existing scale. Existing crews, dated shots, canister and physical placement remain authoritative.

Only the already staged Mexican groups `lancers-east` and `lancers-south` get upright-lance march/idle. Other cavalry is unchanged. Composite draw height is 2.05 person units including lance, so the horse remains comparable to existing mounts. Movement comes from the projected route, not from artwork.

Travis's firing pose uses his cardinal battery service clip and preserves his legacy fallback while loading. peopleNow projects a separate `aimHeading` from the already-visible staged face target; keyed travel heading is unchanged. His fall, still pose, Joe's hiding/survival and all speech remain staged by the existing director.

Alamo numeric light now feeds an independent 1.8-second smooth screen-time grade. Retargeting remains continuous, including return to zero/daylight when the projection omits light. Navy night tone eases through a restrained warm dawn wash. It paints ground/figures before existing flashes and words; no visible moon, sun, new weather or astronomical claim is added. Battle time compression/pace never controls this easing.

## Library-ready pieces for Claude

**Parapet overlays:** do not paste a waist-up figure at street-ground height. Register each post to the actual illustrated wall-top/rampart elevation and draw with the waist anchor at that top. Mask below the top; in load/ramrod phases lower the body behind it so reload reads as cover. The art has no baked wall, allowing the compound's own materials and full room scale to remain. Once the projected north breach opens, use full-body ground/fighting art at the actor's real position; never keep a floating torso over demolished masonry. Preserve the existing collapse obstacle timing and room navigation. These overlays are delivered but are not automatically staged by the current ground-line formation renderer.

**Volunteer trot:** select only from an explicit staged gait or a route-distance gait clock. Do not replace every walking horse with trot, speed the route, or infer a gallop. Existing cardinal walking remains; the new three-heading trot is animation-ready for the relief/scene gait compositor.

These are scene/geometry bindings, not missing artwork. This closes the remaining art parent, not every Alamo renderer refinement.

## Historical and stylistic limits

Travis and volunteers retain the project's existing original painted identities; no exact portrait is claimed. North/church guns are differentiated period interpretations following the current iron-gun staging: field-carriage north variant and low truck-carriage church variant. Exact caliber, gun provenance and surviving carriage dimensions are not established by this delivery. Do not promote those artistic choices to sourced historical facts. The existing 18-pounder silhouette and all other historical tags remain unchanged. No gore or close-up fatal action is introduced.

## Verification

38 targeted tests pass: 12 art/battle-view tests, 24 engine/calendar/save/visibility/collapse/dimension tests, and two named-person view tests. They verify 100% retained alpha, zero trimmed pixels for all 76 frames, stable animation scale, cardinal selection, explicit staged lancers, 18-pounder size precedence, continuous dawn, preserved fates, wall collapse timing, plan dimensions and information asymmetry.

Asset browser proof renders all 76 frames and **21 animations with distinct phases**, plus night/dawn/day composites with bright independent flashes. Evidence:
- docs/evidence/alamo-infantry-proof.png
- docs/evidence/alamo-cavalry-proof.png
- docs/evidence/alamo-guns-proof.png
- docs/evidence/alamo-art.json

Live Alamo browser proof passes 13 checks for Watch, siege guns, runner decisions, assault, the student's person falling, Host view and delayed family news. Its Watch assertion now waits for the actual battle camera (five-second bound) instead of assuming rendering completes in 400 ms. See docs/evidence/battle-alamo-browser.json.

Reproduce `node scripts/alamo-art-proof.mjs`, `npm run test:battle-alamo`, and the targeted files listed above with the normal Playwright/Chrome environment.

## Provenance / handoff

Seven final PNGs are in public/assets/frontier-v1/atlases/. Built-in imagegen produced them using the existing military, mounted volunteer, lancer, gun and Travis atlases. Direction and spacing corrections also used imagegen. Selected PNGs were copied unchanged; no raster postprocessing. A crowded 24-frame lancer draft was superseded by sharper heading-specific sheets and is excluded from active registration. Prompts/source history: scripts/art-deliveries/alamo-complete-2026-10-12.mjs, docs/art-prompts.json and art-provenance.json.

The manifest and backlog are updated. **4 broad dated art groups remain.** No deployment performed.


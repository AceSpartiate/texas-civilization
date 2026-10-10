# Painted army-map camps

Completed the army camp art group requested in the Claude-drawn stand-ins section of ART_REQUESTS.md.

## Artwork and animation

Twelve new transparent painted frames are delivered:

- `public/assets/frontier-v1/atlases/army-camp-props.png`: cream and gray wedge tents with two flap poses each; cooking tripod, suspended iron pot and fire with four flame/steam poses.
- `public/assets/frontier-v1/atlases/army-camp-pennants.png`: plain ochre and rust identification pennants, two cloth poses each.

Five authored loops are registered: `camp-wedge-cream` and `camp-wedge-gray` (700 ms/frame), `camp-cookfire` (250 ms/frame), `camp-pennant-ochre` and `camp-pennant-rust` (450 ms/frame). Stacked arms reuse the existing rigid `musket-stack-small` sprite from `field-cover-camp-props`.

Built-in imagegen generated the two sheets from existing painted camp/prop references. Selected PNGs were copied unchanged, preserving alpha. Exact prompts, reference paths and generated sources are recorded in `scripts/art-deliveries/army-camp-2026-10-10.mjs` and the generated prompt/provenance JSON. Every new frame is in the manifest.

## Integration and design boundaries

`public/army-view.js` prefers painted props when drawing a close army-map camp: two or three tents behind the fire, stacked muskets beside it and a side-color pennant. The existing soldier formation, maximum sampled men, labels and distant marker remain. `public/app.js` supplies animated and rigid-sprite drawing callbacks and passes pause/reduced-motion state.

Tent cloth, pennants, fire and steam animate without moving the camp. Pause/reduced motion holds them; canvas fire/smoke fallback also holds its time. Existing gale smoke continues through the smoke callback on either rendering path. Missing tents/fire retain the canvas fallbacks; soldiers retain their existing miniature fallback. Missing optional arms/pennant artwork is omitted.

The pennants are generic game identification colors following the previous map-marker palette. They are not a reconstruction of a historical army flag or a no-quarter signal. Tents and cooking equipment are interpretive period props, not a surveyed camp plan. Army knowledge, visibility, locations, strength, service and simulation clocks are unchanged. This replaces the close army-map camp artwork; battle-specific camps and the distant marker are separate rendering paths.

Claude may compose the tent and cooking clips in other explicitly staged camps. Keep placement separate from authoritative army/entity state, and keep stacked arms rigid.

## Validation

`node --test tests/army-camp-art.test.mjs tests/armies.test.mjs`: verifies full pixel retention, authored loops, both army renderings, troop count, pause/reduced motion, gale smoke, missing-art fallbacks and existing army visibility/location behavior.

`scripts/army-camp-art-proof.mjs` uses the production loader and `drawArmy` to render all twelve new frames and assemble both camps with soldiers and stacked arms. Evidence is in `docs/evidence/army-camp-art.png` and `.json`. This is a rendering fixture, not a campaign playthrough.

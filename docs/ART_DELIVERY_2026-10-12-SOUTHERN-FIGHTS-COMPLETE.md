# Southern fights art completion — 2026-10-12

Completes the remaining artwork/refinements listed for the September 25 southern-fights group: moonless field lighting and north/south mounted-action coverage. Earlier volunteer riding, east mounted firing, night-lit buildings/fire, horse herds, oak motts and east lancer charge remain delivered.

## Full manifest

| Sheet | Frames | Authored clips |
| --- | --- | --- |
| southern-volunteer-mounted-actions | volunteer-mounted-action-s-1 through -4; volunteer-mounted-action-n-1 through -4 | volunteer-mounted-fire-s, volunteer-mounted-fire-n |
| southern-dragoon-mounted-actions | dragoon-mounted-action-s-1 through -4; dragoon-mounted-action-n-1 through -4 | dragoon-mounted-fire-s, dragoon-mounted-fire-n |
| southern-lancer-charge | lancer-charge-s-1 through -4; lancer-charge-n-1 through -4 | lancer-charge-s, lancer-charge-n |

24 frames, six authored four-phase clips. Service poses are aim, recoil, lower and rest; durations 360/120/220/300 ms, totaling 1000 ms. They are non-looping and use the existing 360 ms pre-shot aim. They are **not a full cartridge/ramrod reload sequence**. Horses stand while the weapons move. Four-phase lancer gallops loop at 160 ms per frame (640 ms total); north/south views are independent rather than mirrored.

All clips have motion:none and normalized logical height per heading to avoid crop-height pulsing. Only authored drawings change. Uniforms, anonymous faces and horse markings follow the existing game references; they are not asserted likenesses or new historical unit identifications.

## Integration

public/battle-view.js chooses cardinal mounted fire clips from the formation facing for generic volunteer riders and dragoons. East/west dragoon service retains dragoon-fire; east/west volunteer behavior is retained. Shot scheduling, casualty generation, family identity selection and named-person sheets are unchanged. These figures are representative mounted actors, not substitutes for named people.

public/southern-battle-art.js exposes heading/action selection and lancerChargeClip for east/west and north/south charge artwork. The new lancer cycles are **library-ready for explicit justified charge selection**, not automatically assigned to every moving dragoon. Future staging must distinguish carbine service, travel and lance charge, and must not show striking a person. The Alamo's upright-lance march/idle and mounted trot remain their own open requests.

San Patricio's drawNight now uses a code-native moonless navy field grade with restrained cool ground haze. Existing projected lamp/fire glows, night building art and muzzle flashes remain above it. The layer contains no moon disk, star field, directional moonbeam or invented source of light. Weather/rain remains the existing weather system rather than a second unsynchronized particle system.

The shared screen-time easing contract transitions a night/dawn target over 1.8 seconds and starts a changed target from the current displayed value. Calendar pacing does not change this duration. Source light remains the battle projection; no world clock, weather, historical event or save format changes.

## Historical and scope limits

The cold, wet moonless San Patricio setting follows the existing project staging and HISTORY.md HIST-TEX-510. Generic volunteer riding and lancer charge follow the southern-fight request; generic carbine service extends the established dragoon artwork. Exact faces, tack, poses and lighting colors are interpretive presentation.

The six clips finish the recorded **directional action** refinement, not every conceivable military animation. Full mounted reload and family-specific sleep/battle appearance remain under their separate parent requests. Exact window-only layers remain future refinement; the existing night-lit building variants already serve projected lights.

## Provenance and review

Prompts, existing references, rejected drafts and selected unchanged PNG paths are in scripts/art-deliveries/southern-fights-complete-2026-10-12.mjs, docs/art-prompts.json and docs/art-provenance.json. The first dragoon draft incorrectly used side profiles; it was regenerated using the volunteer front/back geometry and the dragoon costume reference. The first lancer draft held its lance across its body; the selected refinement points it along the mounted heading in perspective. No programmatic raster editing.

Every final frame retains all visible pixels with no overlap trimming and transparent corners. Browser evidence: docs/evidence/southern-fights-art.png and .json. scripts/southern-fights-art-proof.mjs checks every frame and four unique pixel phases per clip, plus day/transition/moonless lighting levels with muzzle flashes above the grade.

Focused checks include the full art library, cavalry, southern staging/rendering and HTTP serving. All 41 focused tests pass. The older southern-view tests and live-browser assertion now recognize the new night grade and the already-delivered herd-drove/herd-scatter composite art rather than requiring obsolete individual galloping horses. Illustrated herd marks are not a literal head count.

## Claude continuation

Select lancerChargeClip only when the projected actor is explicitly a charging lancer; north/south clips must not mirror. Keep the same shot clock when adding fuller reload poses. Use standing-horse action scale independently of future travel/trot clips. Retain named identity art and projected light/visibility gates. Do not count illustrated herd horses or mounted silhouettes as additional simulated entities.

Final live verification: all **16 southern battle browser checks passed**, including San Patricio and Agua Dulce, privacy, family fates, prisoner movement and delivered accounts. Slowest sampled battle frame p95: 6.8 ms. Evidence: docs/evidence/battle-south-browser.json and docs/evidence/battle-south/ screenshots.

**8 dated parent artwork groups remain.** No deployment performed.


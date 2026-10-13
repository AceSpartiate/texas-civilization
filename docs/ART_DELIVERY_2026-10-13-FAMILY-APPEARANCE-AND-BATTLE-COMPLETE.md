# Family appearance and battle artwork — October 13, 2026

Closes both remaining dated parent art groups: September 12 second **settling in**, and September 25 **battle pieces**. The audited broad artwork backlog is now **0 groups**. Gameplay staging, placement, multi-person scene integration and future requests remain development work.

## Delivered inventory

**45 transparent PNG sheets, 632 painted components, 1,912 composed sprite aliases and 792 clips across 22 family identities.** The full library now has 6,350 sprites and 2,102 clips. No existing sprite or clip metadata was replaced. `scripts/art-deliveries/family-rig-complete-2026-10-13.mjs` is the reproducible inventory, complete prompts, selected generation paths and correction provenance. `docs/ART_MANIFEST.md`, `docs/art-prompts.json`, `docs/art-provenance.json` and the three public JSON manifests are regenerated.

| Component family | Sheets | Coverage |
| --- | ---: | --- |
| Ground locomotion, tasks and service | 21 | Seven age/sex bodies: adult man/woman, youth boy/girl, child boy/girl, small child |
| Cardinal seated saddle / living wounded saddle | 6 | All bodies above except small child; east, south, north; west mirrors east |
| Infant body | 1 | Cardinal swaddle, rest/care/wounded |
| Directional head/appearance library | 6 | All 12 offered parent head choices, older cast identities, youth, children, small child and infant; east/front/rear/closed eyes |
| Covered patients | 1 | Eight age/sex body types; separate from living wounded poses |
| Transport components | 1 | Four phases of led horse and four of two helpers bearing a blanket; patient supplied separately |
| Healthy camp rest/sleep | 2 | All eight body types |
| Mounted aim/fire/load/ramrod | 4 | Adult and youth bodies, east/south/north |
| Capture, sowing, harvesting | 3 | Age-specific paired poses; infant remains a swaddle, never a working adult |

Work includes digging, hoeing, chopping, hammering, carrying, trading, caring, searching, sowing and harvesting. Battle includes separate aim/fire/load/ramrod, wounds, fall/still, surrender, living/dead blanket transport and led wounded riders. Children have comfort poses rather than armed firing. Toddler/infant military eligibility is not introduced by artwork.

The new components use the established warm, outlined, softly painted frontier style. Source sheets are intentionally material-coded; **never display their raw PNGs as finished characters**. Consume the assembled aliases through `public/art.js`. The request permits aligned layers or clean flat regions for recolouring: this implementation provides both a shared age/sex body plus head rig and explicit material regions, instead of multiplying every legacy whole-figure grid by every colour and head combination. Legacy finished sheets remain available.

## Composition and pigment contract

`public/semantic-rig.js` identifies saturated RED skin, GREEN clothing, BLUE hair/beard, YELLOW fixed leather/wood/headwear, neutral linen/metal/ink, and CYAN registration sockets. Pigments use all nine skin, nine hair and eleven clothing choices in `looks-art.js`. Neutral warm linen remains linen. Infant wraps inherit clothing pigment. Fixed hat colours stay independent; straw and bonnet defaults are registered on heads. Alpha and painted shading are preserved. Socket pixels disappear at runtime.

Each component has an authored neck/seat socket measured by the atlas builder. Body scale is normalized against its reference socket-to-foot extent; head scale uses frontal face height so long hair and large hats cannot shrink faces. Paired rows, camp rows and helper gait rows have stable logical heights. All aliases retain their source bounds and pixels; head rotations register reclining, fallen, sleep and covered patients. Headless body frames and sockets are implementation parts, not player-facing art.

Use `drawSprite(ctx, '<identity>-rig-<pose>', x, y, height, {appearance})` or `drawClip` with the corresponding clip. Identity IDs match `avatar-identity.js`: `father-hat`, `father-beard`, `father-moustache`, `father-straw`, `rust`, `ochre`; `mother-braid`, `mother-loose`, `mother-scarf`, `mother-straw`, `rust-woman`, `teal`; plus elder/indigo/blue/blue-girl/youth-boy/youth-girl/girl/boy/smallchild/infant. `IDENTITIES` in the delivery module specifies the exact body mapping.

Examples: `mother-braid-rig-walk-e`, `father-beard-rig-fire-reload`, `girl-rig-passenger-n`, `boy-rig-camp-sleep`, `infant-rig-wounded`, `teal-rig-carry-living`, `teal-rig-carry-dead`, `elder-rig-led-wounded`, `ochre-rig-mounted-fire-s`. Direct fate frames include `<identity>-rig-fall`, `<identity>-rig-still` (infant uses covered), and `<identity>-rig-covered-1`.

Living transport composites attach a wounded patient. Dead transport uses the covered, closed-eye patient and never wounded breathing. Helper/horse kit keeps its own natural colours rather than inheriting the patient's pigments. Gait has four painted phases; covered patients have two different passive shroud poses for transport, not breathing or resurrection. When stopped, pause transport at its current pose.

The existing 320-entry tint cache bounds retained canvases. `clipReady` and `drawSprite` request all body/head/patient dependencies and refuse partial headless assemblies. West mirrors the whole composed rig. Renderer transforms are restored after nested/mirrored composition.

## What is integrated

- Creation previews, parent portraits, inherited child appearances, civilian work/walk/rest and age-specific family bodies use the same rig and appearance object.
- Appearance-driven horse/wagon drivers and seated passengers use the selected identity, including all offered parent head options; cardinal seats keep the existing mount/bed ordering. Infants retain their existing basket seat handling.
- Own family battle members with appearance keep their identity in aim/fire/load, marching, surrender, wounds, fall/still and camp sleep. Unconfigured/NPC fixtures retain their established fallback. A staged stationary mounted family shooter uses its own mounted firing rig; moving mounted people retain saddle gait.
- Ground firing and mounted firing use **700/120/750/900 ms**, a non-looping **2,470 ms** service cycle. The existing member wait/offset, discharge time, smoke and server fate timing remain authoritative. The renderer changes no historical result, simulation rate, movement speed, trait inheritance or fog-of-war projection.

## Claude continuation and limits

1. Transport artwork is complete, but the scene must explicitly project that a person is being carried/led. The adapter selects a living carry only when `carried` is supplied and the wound is not slight. Current member-fate staging does not generally supply that flag. Do not infer transport from the mere existence of a wound. When staging composed transport, remove old independently drawn helper stand-ins, retain patient identity/appearance, and stop its gait on arrival.
2. Dead carry and led-wounded aliases are library-ready. Integrate them against explicit transport entities/scene state; do not invent death, retrieval or rescue outcomes on the client.
3. Existing paired caregiver/infant walkers and caregiver/child horseback composites from earlier deliveries remain available. They are whole-figure assets with their existing supported identity restrictions. They have not become independently tinted two-person rigs; twins and unsupported pairings require explicit composition. Their artwork was delivered under separate completed groups.
4. Seated/wall/breach/night scene occlusion and actual household tasks remain gameplay work. Preserve the historical Alamo compound, room visibility, collapse state, persistent people and delayed messenger information. No new historical arc was staged here.
5. For new actions, generate a body component with the same material/socket contract, register it in `SHEETS`, add aliases and clips, run `npm run build:art`, and extend the browser proof. Do not approximate masks with pixel-position guesses or mutate source PNGs.

## Verification

- 72 targeted tests: complete inventory and zero trimmed pixels, sockets, all colour vocabulary, invariant alpha/linen, age/head identity, paired transport, stable phase scales, battle cadence/fate precedence, appearance inheritance, riding, passengers and existing battle regressions.
- `scripts/family-rig-art-proof.mjs`: all 792 clips and every painted phase render; authored phases have distinct pixels; no proof-canvas clipping; mirrored nested transforms restore correctly. Thirteen evidence panels cover all 22 identities, twelve parent head options, portraits, full figures, age bands, work/service, sleep and transport.
- `docs/evidence/family-rig-art.json` records the measured result; `rig-creation.png` and `rig-*-identity/states.png` are the visual proofs.
- Existing library comparison: **0 changes** to the prior 3,806 sprite entries and 1,310 clips.
- Live Gonzales browser proof: all 12 checks pass, including own `father-hat` firing/identity, battle smoke, messenger arrival, Host view and no information leaks to distant families; battle p95 3.5 ms, map-frame p95 5.1 ms.

Generation used the built-in image tool; nine sheets were corrected to preserve full alpha silhouettes/socket registration. Selected PNGs were copied unchanged. No deployment is part of this delivery.

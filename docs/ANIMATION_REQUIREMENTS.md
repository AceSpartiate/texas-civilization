# Animation delivery and production requirements

Updated 2026-09-10. The shipped library contains **169 clips: 92 sequences of distinct poses, four layered rigs, and other procedural/state clips**. Every exact frame, timing, direction and attachment is indexed in [ART_MANIFEST.md](ART_MANIFEST.md) and [manifest.json](../public/assets/frontier-v1/manifest.json). This document distinguishes usable delivery from remaining production work.

## Delivered movement

| Subject | Delivered implementation | Remaining work |
| --- | --- | --- |
| Four civilian palettes | Four-pose E/W walk, two-pose N/S walk; four-pose work/carry; two-pose sow/repair/care/search/trade; still idle/rest/injury with optional procedural breathing | N/S action poses, turns, richer dialogue gestures, leading animals, climbing/swimming and assisted-walk/stretcher pairs. Some short action cycles are two key poses, not fully in-betweened acting. |
| Joe | Cardinal walk, hiding, emerging, cautious standing, speaking and rest; same interpreted appearance across sixteen frames | Additional action facings and final scene-specific registration. The supplied refuge study is not a historical reenactment or attested likeness. |
| Livestock | Ox/horse/cow/pig cardinal walk and four-pose grazing | Other coat/species locomotion, drinking, harness/load behavior and transitions. Never substitute a differently colored animal during a journey. |
| Mounted courier | Four-pose E/W, N/S travel and grazing; new four-pose E/W listen/speak/letter/point actions | Mounted halt/turn, N/S dialogue facings, refined rein control, dismount/remount, tethering and final cross-sheet registration. Existing `courier-march` is a separate person on foot. |
| Wagons | Separate body, cargo options and wheels rotating around defined pivots; sound/broken state artwork | N/S rigs, hitch/yoke articulation, load/unload and pushing. A wheel spin is a procedural rig, not an authored body walk cycle. |
| Military | March families and N/S travel; volunteer/regular aim/fire/load/ramrod one-shots; surrender poses | Unit/date-specific uniforms and equipment, varied transitions, mounted firing, formation turns and final retreat staging. Decorative samples remain distinct from canonical people. |
| Artillery | Directional cannon stills, iron/bronze recoil and separate bounded smoke | Crew ramming/serving, limber/unlimber and elevation. Current recoil translates the whole carriage briefly, with directional sign; it does not squash the cannon or claim an articulated barrel. |
| Alamo structures | Four-state wall collapse sequence, door/chest opening pairs, independent intact/cracked/breached/rubble modules and roof/interior parts | Continuous hinges, construction/repair and detailed collapse choreography. Workshop damage controls currently demonstrate state changes and passage creation; the library sequence is available for future event playback. |
| Environment and effects | Ground-anchored procedural tree/crop sway, water pulse, fire flicker, smoke drift; distinct smoke/dust frame sequences | Crown-only trees, richer water/boat motion and weather transitions. These are quiet display effects, never simulation outcomes. |

Static buildings, furniture, tools, terrain fragments and inactive condition pieces are intentionally still. Do not label a transformed single frame as an authored pose cycle. A burn, collapse, injury, surrender or shot is an event/state presentation, not an endlessly repeating idle animation.

## Current bindings

The live farm binds walk, work, sow, carry, repair, search/hunt, town trade and rest for owned people. Other people use only the broad task/condition permitted by the server. Walking uses the current road leg's direction; N/S poses are not mirrored. Ox/wagon movement and tree wind run on the same paused display clock. Hurt people hold injury art. Care and most animal species remain library-only.

Visible Gonzales formations march during approach/withdrawal and use bounded firing/reload imagery during the exchange. Cannon recoil and smoke are illustrative phase effects. No hidden battle may generate a visible puff or cached formation. Household-to-household trade does not yet have a lasting conversation state, so do not equate its completed transaction with a continuously playing two-person scene.

The separate Alamo workshop plays Joe walking through connected doors into cover, emerging and speaking. It preserves the actor ID and uses ordinary foot-scale ground coordinates. Its route and wall state are demonstrations for Claude, not an alternative authority for the classroom world. See [ALAMO_LAYOUT.md](ALAMO_LAYOUT.md).

## Playback contract

1. Select only from the permitted entity/action state. Clocks and frame callbacks cannot move a canonical entity, repair a tool, reveal news, injure someone or damage a wall.
2. Preserve ground contact and reference height. Use manifest anchors and logical heights; attach wheels to rig pivots. Review cross-sheet poses for identity/proportion drift instead of trusting consistent crop sizes.
3. Use caller-owned milliseconds and stable per-entity offsets for loops. One-shots need an authoritative trigger identity, bounded duration and held final state. Refresh/reconnect must not replay consequences or missed private action; late observers see the appropriate current state.
4. Pause stops visual progression. Backgrounding resets the elapsed-frame baseline. Reduced motion suppresses loops, repeated flashes and easing while preserving readable tasks and authoritative position changes.
5. Purge concealed actors/effects immediately. Never retain their trails, shadows, health poses or selection attachments. Snap over time jumps; do not animate a long skipped interval as a fast journey.
6. Keep DOM controls stable during canvas animation. A trade draft, focus or selected action must survive painting, state updates and pause/resume.

## Acceptance and next production work

`npm test` verifies measured PNG bounds/alpha/anchors, every runtime sheet's inventory entry, reproducible clip/manifest generation, frame timing, identity-facing bindings, route bends, concealment and time-jump behavior. `test:art` uses actual browser pixels to verify motion, pause, scrub, reduced motion and mobile layout; `test:trade-animation` protects real form values/focus while art moves. `test:alamo` checks the connected assembly and Joe's sequence with no class requests. These checks do not substitute for final frame-by-frame visual review or classroom performance testing.

**Open requests live in [ART_REQUESTS.md](ART_REQUESTS.md).** The request of 2026-09-12 covers children, a second civilian cast, rider dismount/remount/tether and north/south dialogue facings. For the owner's next information system, prioritize the remaining mounted encounter transitions and facings over unrelated decorative variants. Follow [LIVING_INFORMATION.md](LIVING_INFORMATION.md)'s staging and release gates: visible approach, halt, facing, speaking/listening, interruption, departure and continuity of the same rider and horse. Then extend only the actions required by each validated arc. Keep the complete library and future gaps synchronized through `scripts/art-registry.mjs`; do not claim every animation the full game will eventually need is finished.

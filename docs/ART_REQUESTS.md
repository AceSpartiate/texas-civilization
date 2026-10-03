# Art requests for Astra

The style every piece is drawn to, Astra's own brief of 2026-09-28, is [ART_STYLE.md](ART_STYLE.md).

## Named foot movement and field gestures — delivered 2026-10-03

This batch adds **12 transparent atlases, 48 frames and 24 authored clips**. Travis, Crockett, Bowie, Fannin, Milam and Ben now have new two-pose front/rear walking cycles, selected from projected battlefield north/south heading. East/west retains the established walking art. Neill, Karnes, Hockley, Lamar, Sherman and Rusk gain their own two-pose field command and conversation gestures. Command scenes use the new clips; conversation clips are available through `PERSON_ART.speak` for explicit staging.

Claude: `scripts/art-deliveries/famous-field-actions-2026-10-03.mjs` records every frame/clip, duration, exact prompt, reference and selected source PNG. The generated manifest/catalog inventories the full batch. Reproduce the 24-clip drawing/frame-change evidence using `scripts/famous-field-art-proof.mjs`; results are in `docs/evidence/famous-field-art.png/.json`. `tests/famous-field-art.test.mjs` verifies heading selection, clip inventory and preservation of Karnes's crowbar, Rusk's stop, Lamar's mounted rescue and Sherman's mounted rally bindings.

These are modest two-pose cycles, not full animation rigs or turn transitions. Equipment placement and fine body registration remain artistic polish. Bowie’s healthy walk is only selected where the simulation projects walking; his live sickbed and still-bed remain separate. Campaign map headings are still not projected, so campaign rendering retains east/west. No new words, injury, route, speed, visibility or historical outcome changed; costumes and likenesses are interpretations.

## Story actions, survivor travel and Gonzales crew — delivered 2026-10-03

This batch adds **13 transparent atlases, 52 frames and 26 authored clips** in the existing painted, outlined storybook style. Fannin gains command/surrender cycles; Milam rally/point; Crockett command/seated rest; Bowie command/live sickbed care; Alavez beckon/guide; Ben pot carrying/conversation; Esparza and Almeron Dickinson rammer/shot-carry actions. Existing projected poses select these animations. Bowie's still/death art stays separate. Alavez beckons during her existing stationary rescue staging and retains her existing walk and route.

Susanna now carries Angelina in her east/west, north/south walking and standing cycles, correcting the previous childless walking image. Angelina remains a small carried child in every frame. This fixes Susanna's composite, not the outstanding generic family infant transport art. Cardinal selection is bound to battlefield heading; campaign columns still lack projected heading. Gonzales' cart-wheel cannon now has distinct civilian rammer, charge carrier and igniter clips; the rammer crouches at discharge with a reduced silhouette height, instead of enlarging a crouched body to standing height. Existing cannon recoil, smoke, shot clock and all historical routes/outcomes are preserved.

Claude: exact frame/clip IDs, durations, generation and refinement prompts, references and source PNG paths are in `scripts/art-deliveries/famous-story-actions-2026-10-03.mjs` and `survivor-travel-gonzales-crew-2026-10-03.mjs`. Selected PNGs are copied unchanged from imagegen. All pieces are listed in the generated manifest/catalog. Run `scripts/famous-story-art-proof.mjs` to reproduce the 26-clip browser rendering/pixel-change check; evidence is in `docs/evidence/famous-story-art.png/.json`. Renderer regression tests cover named action bindings, mother/child cardinal travel and civilian cannon roles.

These are modest two-pose cycles, not full rigs, facial animation or finished cinematic staging. Long skirts limit the visible east stride, and fine body/prop registration and directional turn transitions remain polish. Guide and charge-wait variants are available for future explicitly staged scenes; they do not invent dialogue, routes or events. Costumes, tools, faces and gestures are original artistic interpretations rather than historical evidence.



## Historical gestures and scout riding — delivered 2026-10-03

This second batch adds **15 transparent atlases, 60 frames and 30 authored clips**. Deaf Smith, Karnes, Lamar, Sherman and Rusk now have two-pose north/south mounted walking, selected from battle heading. Their special rescue/rally/stop scene bindings are preserved. Ten figures — Travis, Houston, Santa Anna, Austin, Moore, Almonte, Burleson, Cos, Urrea and Castañeda — now have two-pose command and conversation cycles. Existing command scenes select the new gestures; `PERSON_ART.speak` exposes the conversation art for future explicit dialogue staging. No new speech or conversation has been added.

Claude: read `scripts/art-deliveries/famous-gestures-2026-10-03.mjs` and `famous-scouts-cardinal-2026-10-03.mjs` for exact IDs, durations, prompts, refinement prompts and original/final PNG paths. Selected art was generated with the built-in image tool and copied unchanged. The catalog and complete machine-readable manifest list every new frame/clip. Reproduce browser evidence with `scripts/famous-gestures-art-proof.mjs`; it checks all 30 clips render and change pixels between keyframes.

These are restrained two-pose cycles, not complete rigs or lip-sync. A raised hand can change the overall silhouette height slightly under the existing sprite sizing system; finer body/prop registration remains polish. Horse markings and tack vary in small details across directional sheets and remain artistic interpretations. Faster gaits, mount/dismount and turn transitions remain outstanding. Campaign columns still do not project heading. No historical event, timeline, outcome, visibility, character injury or movement speed changed.

## Mounted cardinal movement and Castrillón — delivered 2026-10-03

Fourteen new transparent atlases deliver **56 frames and 27 authored clips** in the established painted, outlined storybook style. Smither, John W. Smith, Horton, Kimbell, Martin, Cos, Urrea, Castañeda, Houston, Santa Anna, Burleson and Grant each have two-pose north/south riding cycles. The battlefield renderer selects them from the projected heading; existing east/west art remains available. Castrillón gains north/south walking and two rally gestures standing on an ammunition crate, now selected during his existing San Jacinto crate scene. His timing, words and fate are preserved. Step-down and ground figures are registered variants for later staging.

Claude: delivery modules are `scripts/art-deliveries/famous-mounted-cardinal-2026-10-03.mjs` and `famous-castrillon-actions-2026-10-03.mjs`; the generated manifest lists every frame and clip, and prompt/provenance records include exact generation/refinement instructions and unchanged source PNG paths. `crate-command` is a validated named-person pose; its composite uses a crate-floor anchor and 1.18 size multiplier. Browser evidence in `docs/evidence/famous-cardinal-art.png/.json` proves all 27 clips draw and change frames. Reproduce with `scripts/famous-cardinal-art-proof.mjs`.

These are modest two-pose cycles, not full rigs. Faster cardinal gaits, dismount/turn transitions, and exact tack/marking continuity remain refinements. Campaign marching columns still lack projected heading; their renderer has not been changed to guess direction. Costumes, horses, likenesses and crate are artistic interpretations. No new historical event, movement speed or information visibility has been introduced.

## Family creation and children — delivered 2026-10-02

Ten painted family atlases add 160 frames and 120 clips for distinct parent headwear/hair choices and adolescent bodies. The creation studio has compact pigment swatches, painted head choices, Turn and an animated walking preview. Parent portraits and world figures share the same identity; infants, toddlers, children and youths retain age-appropriate figures with inherited colors. No child action falls back to an adult silhouette. See `docs/FAMILY_ART_2026-10-02.md` and the generated manifest for the complete delivery, source records and documented task/transport art refinements.

## Named historical people — delivery 2026-09-26

Six first-priority people from `docs/BATTLES.md` §2c now have distinct 16-frame atlases: David Crockett, William Barret Travis, James Bowie, Emily D. West, Antonio López de Santa Anna, and Sam Houston. The sheets, frame IDs, clips and origin records are in `scripts/art-deliveries/famous-people.mjs` and the generated `ART_MANIFEST.md`. Each has four east walk frames, two south, two north, and eight action/story poses. East mirrors west. All are original visual interpretations; **no exact likeness is claimed**. Emily's more elegant yellow dress and uncovered braided updo are the owner's Yellow Rose-inspired visual direction, **not evidence of what she wore or of the legend's events**. Joe already has his separate `joe-poses` sheet. The San Jacinto capture parley selects wounded Houston and plain-clothes Santa Anna; the other new poses await the named-person itinerary and staging work. Do not infer a battle outcome from the availability of a sprite.

Three companion atlases in `scripts/art-deliveries/famous-picnic.mjs` add Emily seated at a camp table in a four-pose conversation sequence, Santa Anna seated opposite her in four poses through an alarmed rise, and four separate picnic props. `sim/battles/san-jacinto.mjs` places this vignette behind the Mexican breastwork beginning at 13:00 April 21; `public/battle-view.js` animates it and keeps a dashed `LATER STORY` label beside it. The scene disappears after the first guns; it is projected only to the Host and live battle witnesses. Its position, clothes, picnic and alleged distraction are dramatic tradition staging (`HIST-TEX-560`, `FIC-GONZ-560`), not an assertion of documented causation.

The next three sheets in `scripts/art-deliveries/famous-alamo-survivors.mjs` cover Juan Seguín, Susanna Dickinson and her daughter Angelina. Seguín and Susanna have east/south/north walking clips and eight itinerary poses each. Seguín has two mounted courier *key poses* and a dispatch. `famous-seguin-mounted-motion.mjs` now adds two-frame east walking and cantering gaits on the same horse; east mirrors west. `famous-seguin-mounted-ns.mjs` completes two-frame north and south mounted walking gaits on the same horse. Susanna has four composite mother-and-child poses for shelter, carrying and rest. Angelina has four toddler poses and a seated/reaching loop; her single stepping frame is not a full directional walk. The composite poses include Angelina, so draw the separate toddler sprite only when she is not already in Susanna's frame. [The Handbook of Texas identifies Angelina's December 1834 birth and their joint survival](https://www.tshaonline.org/handbook/entries/dickinson-angelina-elizabeth); the exact clothes and faces are artist interpretations.

Two further 4×4 sheets in `scripts/art-deliveries/famous-bexar-goliad.mjs` cover Benjamin Rush Milam and James Walker Fannin Jr. Each has three directional walking clips plus eight campaign poses. Milam's rally, cover, advance, non-graphic fall and still poses can replace the generic named fall in Béxar once the named-figure renderer is bound. Fannin's map, command, bandaged-leg, surrender and prisoner poses support Coleto and Goliad without depicting an execution. The [Handbook of Texas records Milam's death during Béxar](https://www.tshaonline.org/handbook/entries/milam-benjamin-rush) and [Fannin's wound, surrender, captivity and killing at Goliad](https://www.tshaonline.org/handbook/entries/fannin-james-walker-jr); costumes and faces are interpretations.

Further Alamo sheets in `scripts/art-deliveries/famous-alamo-gunners.mjs` and `famous-esparza.mjs` cover Bonham, Almeron Dickinson and Gregorio Esparza: each has east/south/north directional walks, a gun-service key pose and a non-graphic still pose. `famous-crockett-fate.mjs` adds unarmed captive animation and non-graphic still art for the game's explicitly disputed account. `alamo-joe-travis-actions.mjs` adds Travis's fall and Joe's doorway and wounded poses; `famous-mounted-generals.mjs` adds mounted walking and idle frames for Houston and Santa Anna. `famous-castrillon.mjs` adds command, walking, fall and still frames for Castrillón. `famous-almonte.mjs` adds directional movement, surrender and interpreter art for Almonte. `famous-burleson.mjs` adds directional movement, command and mounted travel for Burleson. `famous-cos.mjs` adds Cos's directional walk, field and capitulation gestures, prisoner pose, and mounted travel. `famous-castaneda.mjs` adds Castañeda's directional walk, parley and withdrawal gestures, and mounted travel. `famous-moore.mjs` adds Moore's directional walk, parley and command poses. `famous-austin.mjs` adds Austin's directional walk, command, speech and document poses. `famous-urrea.mjs` adds Urrea's directional walk, field gestures and mounted travel. `famous-seguin-mounted-motion.mjs` and `famous-seguin-mounted-ns.mjs` give Seguín cardinal mounted walking plus east/west canter. `famous-deaf-smith.mjs` adds the scout's directional walk, field actions and dedicated mounted travel. `famous-karnes.mjs` adds Karnes's directional walk, musket, mounted travel and two-frame crowbar action at the Béxar door. `famous-neill.mjs` adds Neill's directional walk, artillery service and command poses, and non-graphic wound pose for April 20. `famous-lamar.mjs` adds Lamar's directional foot and mounted travel, cavalry gestures, and a mounted reach used during the existing April 20 rescue beat. `famous-sherman.mjs` adds Sherman's directional foot and mounted travel, command/rally poses, and a mounted signal for the already staged sortie. `famous-rusk.mjs` adds Rusk's directional foot and mounted travel, document poses, and a two-frame stop gesture for the San Jacinto aftermath. `famous-hockley.mjs` adds Hockley's directional walking and a three-frame battery-command cycle for the Twin Sisters. `famous-mcculloch.mjs` adds McCulloch's directional walking and named gun-service cycle beside Hockley at the same battery. `famous-johnson.mjs` adds Johnson's directional walking, Béxar command cycle and San Patricio back-door escape gait. They bind through `PERSON_ART`; their costumes and faces are interpretations, not likeness claims. Still requested for the named-person roster: the remaining Tejano/Tejana cast and the other named people in `docs/battle-research/famous-people.md`. These need identity-preserving directional walks and specific authored actions of their itinerary, with no generic figure silently presented as their portrait. The remaining gameplay work, including who is visible and what is known at a given date, is separate from art production.

## Standard practice for missing art

Owner's direction, 2026-09-12, and a standing rule in `CLAUDE.md`. When the game needs art the library
does not have:

1. **Request it here**, in the format below — why, exactly what, how it plugs in, how it is checked.
2. **Ship a stand-in** from art that already exists: the nearest figure, scaled, reused or recoloured
   by the renderer. Never block the feature on the art, and never leave it drawn wrongly without saying so.
3. **Mark it in code** with a `stand-in:` comment that names the request, the way `ceiling:` marks a
   deliberate simplification. Grep `stand-in:` to find every one.
4. **List it under *Stand-ins in use*** below, with what replaces it.
5. **On delivery**, swap the stand-in for the real art, delete its row, and keep any rule the stand-in
   established that the real art still needs.

<!-- astra-list:start (generated by scripts/claude-art/write-plan.mjs from scripts/claude-art/plan.mjs; do not hand-edit) -->
## What Astra still needs to make: every stand-in and what replaces it

Owner, 2026-09-28: *"add to the art requests list which items need to be made so they can replace stand ins."* One checklist of every item that must be made to retire a stand-in: every row of *Stand-ins in use*, every row of *Claude-drawn stand-ins*, and every `stand-in:` comment in the code (`public/`, `sim/`). It is generated with [CLAUDE_ART_PLAN.md](CLAUDE_ART_PLAN.md) from one table, `scripts/claude-art/plan.mjs`, grouped by the same areas and sorted by priority (1 first). An item whose Claude-drawn stand-in has landed **stays here** - hers replaces it - marked *Claude stand-in in place*. `tests/claude-standins.test.mjs` fails if a `stand-in:` in the code names nothing on this list, and if this section is stale (`node scripts/claude-art/write-plan.mjs`).

**132 items to make** (A 31, B 19, C 19, D 27, E 20, F 16); 91 with a Claude stand-in in place. Delivered, withdrawn and on-hold requests are listed after them, with nothing to make.

### A — People at work and ambient poses (31)

- [ ] **A1** · priority 1 · `<cast>-chop` (felling with an axe) for each of the eight: `<figure>-chop-1`..`-4`, clip `<figure>-chop`, the axe landing on frame 3. *4 frames each, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 1. **Stands in now:** the hoeing cycle (`-work`) with a felling axe drawn over the hoe in canvas, chips on the strike; rust in Claude's `rust-chop` (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.chop` (`drawn`) in `public/work-art.js`, drawn by `drawAtWork` in `public/app.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-chop`, `teal-chop`, `elder-chop`, `blue-chop`, `rust-woman-chop`, `indigo-chop`, `ochre-chop`, `blue-girl-chop`).
- [ ] **A2** · priority 1 · `wood-pile-1`, `wood-pile-2`, `wood-pile-3`, `wood-pile-4` (about 10, 20, 30, 40 logs). *one sprite a size*. A pile of wall logs three-quarter on the ground anchor, about as long as `log-fallen`, no taller than a person's waist; Claude: 448×320 cell drawn at 1.2 of a person. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 16. **Stands in now:** Claude's `wood-pile-1`..`-4`; without the sheet, `log-fallen` laid side by side (Claude-drawn). **Plugs into:** the wood pile in `drawWorld`, `public/app.js` (`window.__woodPileSprite`). **Claude stand-in held back: Astra has drawn the subject** (logs), so the page draws hers (`wood-pile-1`, `wood-pile-2`, `wood-pile-3`, `wood-pile-4`).
- [ ] **A3** · priority 1 · `<cast>-notch` (4 frames: notching a wall log's end with an axe) and `<cast>-lift` (2 frames: stooped under a log end, the log end at the shoulder; two facing across the frame read as one log lifted). *4 and 2 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 3. **Stands in now:** the hoeing cycle with a drawn axe (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.notch` in `public/work-art.js`; `workSlot` stands several along the house front. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-notch`, `rust-lift`, `teal-notch`, `teal-lift`, `elder-notch`, `elder-lift`, `blue-notch`, `blue-lift`, `rust-woman-notch`, `rust-woman-lift`, `indigo-notch`, `indigo-lift`, `ochre-notch`, `ochre-lift`, `blue-girl-notch`, `blue-girl-lift`).
- [ ] **A4** · priority 1 · `<cast>-dig` (spade driven in with the foot, levered, earth thrown behind, back) and `<cast>-dig-well` (the same waist-deep in a square hole with a low bank of earth). *4 frames each, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 4. **Stands in now:** the hoeing cycle with dark clods thrown up (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.dig`, `STROKES.grub` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-dig`, `rust-dig-well`, `teal-dig`, `teal-dig-well`, `elder-dig`, `elder-dig-well`, `blue-dig`, `blue-dig-well`, `rust-woman-dig`, `rust-woman-dig-well`, `indigo-dig`, `indigo-dig-well`, `ochre-dig`, `ochre-dig-well`, `blue-girl-dig`, `blue-girl-dig-well`).
- [ ] **A5** · priority 1 · for each of the eight: `-whittle`, `-mend-harness`, `-sew`, `-shell-corn`, `-clean-rifle` (seated, 2 frames each), `-wash` (kneeling at a tub, 2), `-pipe`, `-cards` (seated, 2), `-sweep` (a broom, 4), `-carry-water` (a bucket in each hand, walking, 4, east). *2-4 frames each, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — ambient life](#request-2026-09-28--ambient-life), item 1. **Stands in now:** the nearest delivered pose: seated `-repair`, kneeling `-care`, seated `-rest`, the hoe's `-work`, the harvest `-carry` (Astra's library art reused). **Plugs into:** `ambientClip` in `public/motion.js`; `ACTIVITIES` in `sim/ambient.mjs`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-whittle`, `rust-mend-harness`, `rust-sew`, `rust-shell-corn`, `rust-clean-rifle`, `rust-pipe`, `rust-cards`, `rust-wash`, `rust-sweep`, `rust-carry-water`, `teal-whittle`, `teal-mend-harness`, `teal-sew`, `teal-shell-corn`, `teal-clean-rifle`, `teal-pipe`, `teal-cards`, `teal-wash`, `teal-sweep`, `teal-carry-water`, `elder-whittle`, `elder-mend-harness`, `elder-sew`, `elder-shell-corn`, `elder-clean-rifle`, `elder-pipe`, `elder-cards`, `elder-wash`, `elder-sweep`, `elder-carry-water`, `blue-whittle`, `blue-mend-harness`, `blue-sew`, `blue-shell-corn`, `blue-clean-rifle`, `blue-pipe`, `blue-cards`, `blue-wash`, `blue-sweep`, `blue-carry-water`, `rust-woman-whittle`, `rust-woman-mend-harness`, `rust-woman-sew`, `rust-woman-shell-corn`, `rust-woman-clean-rifle`, `rust-woman-pipe`, `rust-woman-cards`, `rust-woman-wash`, `rust-woman-sweep`, `rust-woman-carry-water`, `indigo-whittle`, `indigo-mend-harness`, `indigo-sew`, `indigo-shell-corn`, `indigo-clean-rifle`, `indigo-pipe`, `indigo-cards`, `indigo-wash`, `indigo-sweep`, `indigo-carry-water`, `ochre-whittle`, `ochre-mend-harness`, `ochre-sew`, `ochre-shell-corn`, `ochre-clean-rifle`, `ochre-pipe`, `ochre-cards`, `ochre-wash`, `ochre-sweep`, `ochre-carry-water`, `blue-girl-whittle`, `blue-girl-mend-harness`, `blue-girl-sew`, `blue-girl-shell-corn`, `blue-girl-clean-rifle`, `blue-girl-pipe`, `blue-girl-cards`, `blue-girl-wash`, `blue-girl-sweep`, `blue-girl-carry-water`).
- [ ] **A19** · priority 1 · for each of the eight: `<cast>-greet` (a hand raised, or a hat touched, 2 frames), `<cast>-shy` (head down and aside, hands together, 2), `<cast>-laugh` (a hand to the chest or mouth, head tipped back, 2), `<cast>-vow` (both hands held forward at the waist, 1); and `elder-read-paper` (the commissioner in a dark coat reading a paper held open, 2). *2, 2, 2, 1 each; 2, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-29 — the lone parent's wedding](#request-2026-09-29--the-lone-parents-wedding), items 1-2. **Stands in now:** the nearest cast poses in `scenePose` (idle, speak, trade), a wave or a bow drawn by the page; Claude's `<cast>-greet`, `-shy`, `-laugh`, `-vow` and `elder-read-paper` (Claude-drawn). **Plugs into:** `scenePose` in `public/courtship.js` (drawn through `drawAvatar`). **Claude stand-in in place** (`rust-greet`, `rust-shy`, `rust-laugh`, `rust-vow`, `teal-greet`, `teal-shy`, `teal-laugh`, `teal-vow`, `elder-greet`, `elder-shy`, `elder-laugh`, `elder-vow`, `blue-greet`, `blue-shy`, `blue-laugh`, `blue-vow`, `rust-woman-greet`, `rust-woman-shy`, `rust-woman-laugh`, `rust-woman-vow`, `indigo-greet`, `indigo-shy`, `indigo-laugh`, `indigo-vow`, `ochre-greet`, `ochre-shy`, `ochre-laugh`, `ochre-vow`, `blue-girl-greet`, `blue-girl-shy`, `blue-girl-laugh`, `blue-girl-vow`, `elder-read-paper`); Astra's replaces it.
- [ ] **A21** · priority 1 · the people of the road east: `road-man`, `road-woman`, `road-elder`, `road-child` - enslaved men, women and children in homespun and osnaburg, bundles on their backs, walking (4, east), resting by the road (2), standing waiting at a ferry (1, south); no chains, no whips, no one cowering; and `planter-wagon-halted`, a planter’s loaded wagon standing with its oxen out. *1-4 frames each*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-29 — the family's start: Tejano and free Black families, and the people of the road east](#request-2026-09-29--the-familys-start-tejano-and-free-black-families-and-the-people-of-the-road-east), item 1. **Stands in now:** the cast (`ochre`, `rust-woman`, `elder`, `teal`, `boy`) recoloured by the palette in dark tones and homespun colours, resting or standing; no wagon (Astra's library art reused). **Plugs into:** `GROUP` in `sim/start-story.mjs`; `crowdDrawables` in `public/ambient.js`.
- [ ] **A31** · priority 1 · for the ten family figures (`<family>`: `father-hat`, `father-beard`, `father-moustache`, `father-straw`, `mother-braid`, `mother-loose`, `mother-scarf`, `mother-straw`, `youth-boy`, `youth-girl`): `<family>-search` (looking about, reading the ground), `-sow` (broadcasting seed), `-carry` (walking with a load, east, `-n`/`-s` if drawn), `-repair` (seated mending), `-care` (kneeling, tending) and `-trade` (offering across a counter). *2-4 frames each, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — the family figures' missing poses](#request-2026-10-03--the-family-figures-missing-poses), item 1. **Stands in now:** her two-pose work cycle (`<family>-work`); carrying, her walk (`avatarBinding`) (Astra's library art reused). **Plugs into:** `FAMILY_POSES` in `public/avatar-identity.js`.
- [ ] **A6** · priority 2 · `<cast>-split` (maul raised, coming down, on the wedge in a log on the ground, back). *4 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 2. **Stands in now:** the hoeing cycle with a drawn maul (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.split` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-split`, `teal-split`, `elder-split`, `blue-split`, `rust-woman-split`, `indigo-split`, `ochre-split`, `blue-girl-split`).
- [ ] **A7** · priority 2 · `<cast>-reap` (reaching up to an ear, snapping it, dropping it in a basket or sack, stepping on). *4 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 5. **Stands in now:** the hoeing cycle with chaff (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.reap` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-reap`, `teal-reap`, `elder-reap`, `blue-reap`, `rust-woman-reap`, `indigo-reap`, `ochre-reap`, `blue-girl-reap`).
- [ ] **A8** · priority 2 · `<cast>-aim` (1 frame, a long rifle level at the shoulder) and `<cast>-fire` (2 frames: recoil, lowering), in the figure's own clothes. *1 + 2 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 7. **Stands in now:** the side-on idle with a rifle line and a flash drawn in canvas (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.shoot`, `STROKES.shot` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-fire-reload`, `teal-fire-reload`, `elder-fire-reload`, `blue-fire-reload`, `rust-woman-fire-reload`, `indigo-fire-reload`, `ochre-fire-reload`, `blue-girl-fire-reload`, `rust-aim`, `rust-fire`, `teal-aim`, `teal-fire`, `elder-aim`, `elder-fire`, `blue-aim`, `blue-fire`, `rust-woman-aim`, `rust-woman-fire`, `indigo-aim`, `indigo-fire`, `ochre-aim`, `ochre-fire`, `blue-girl-aim`, `blue-girl-fire`).
- [ ] **A9** · priority 2 · `<cast>-fish` (sitting on the bank, cane pole out, the pole twitched). *2 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 8. **Stands in now:** the seated rest with a cane pole, line and bobbing float in canvas (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.fish`, `drawWorkLayer` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-fish`, `teal-fish`, `elder-fish`, `blue-fish`, `rust-woman-fish`, `indigo-fish`, `ochre-fish`, `blue-girl-fish`).
- [ ] **A10** · priority 2 · `<cast>-gather` (bent to the ground picking up, then into a basket or apron). *2 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 9. **Stands in now:** the sowing crouch bobbing at the ground (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.gather` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-gather`, `teal-gather`, `elder-gather`, `blue-gather`, `rust-woman-gather`, `indigo-gather`, `ochre-gather`, `blue-girl-gather`).
- [ ] **A11** · priority 2 · `washtub` (a wooden tub with a board), `woodpile-frontier` (split rails stacked by a cabin), `hens-pecking` (two hens, 2 frames). *1, 1 and 2 frames*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside. [Request 2026-09-28 — ambient life](#request-2026-09-28--ambient-life), item 2. **Stands in now:** the plain `bucket`, the Alamo's `alamo-firewood`, `chicken-idle` (Astra's library art reused). **Plugs into:** `propItem` in `public/ambient.js`. **Claude stand-in in place** (`washtub`); Astra's replaces it; **Claude stand-in held back: Astra has drawn the subject** (hens, firewood), so the page draws hers (`hens-pecking`, `woodpile-frontier`).
- [ ] **A12** · priority 2 · a seated flag painter for `teal`, `indigo`, `blue-girl` (`<figure>-paint-seated`, 2 frames); `elder`, `ochre`, `blue` `-dig` with a spade (4 frames, shared with A4); `-forge` (a smith at the anvil, 2-4 frames) with `forge-anvil` as a prop; `-point` (arm out across the river, the other shading the eyes, 2 frames, east and south). *2-4 frames, east (and south for pointing)*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-25 — Gonzales before the fight](#request-2026-09-25--gonzales-before-the-fight), items 1-4. **Stands in now:** the delivered `repair`, `work`, `search` and `speak` poses (Astra's library art reused). **Plugs into:** `STAND_INS` in `sim/town-scenes.mjs`; `drawProp` in `public/town-scenes.js`. **Research:** the Gonzales scenes of September 29 - October 2, 1835 (docs/battle-research/gonzales-town.md, HIST-TEX-460-469).
- [ ] **A22** · priority 2 · a Tejano ranchero family’s dress for the parents’ figures: a man in a low-crowned wide sombrero, a short jacket and calzoneras (`tejano-man`), a woman in a rebozo, a full skirt and a loose chemise (`tejano-woman`), each in every pose the cast has (idle four ways, walk, work, rest, speak, care, ride, drive), in the layered form of A18 so the palette dyes them. *the cast’s full set*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-29 — the family's start: Tejano and free Black families, and the people of the road east](#request-2026-09-29--the-familys-start-tejano-and-free-black-families-and-the-people-of-the-road-east), item 2. **Stands in now:** the cast recoloured by the palette; the straw hat and the headscarf as the nearest head choices (Astra's library art reused). **Plugs into:** `avatarVariant` in `public/avatar-art.js`; `sources`, `REFS` and `HEADS` in `public/person-palette.js`. **Research:** HIST-TEX-789 (Gregg, of New Mexico in the 1830s: interpretive for Texas).
- [ ] **A23** · priority 2 · faces and hair painted for the darker skin tones: a man and a woman of the free Black family, and a girl and a boy, drawn with darker skin as painted (not dyed) and hair in close curls, short or braided and wrapped, in the colonists’ same dress and every pose the cast has. *the cast’s full set*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-29 — the family's start: Tejano and free Black families, and the people of the road east](#request-2026-09-29--the-familys-start-tejano-and-free-black-families-and-the-people-of-the-road-east), item 3. **Stands in now:** the cast and her children recoloured by the palette to the chosen tone (the painted light and shade kept, the hair’s shape the painted one) (Astra's library art reused). **Plugs into:** `avatarVariant` in `public/avatar-art.js`; `public/person-palette.js`.
- [ ] **A24** · priority 2 · `<cast>-count` (seated at a table, counting coin from one hand into a stack, an account book open; the table not drawn, the figure seated at its height) for each of the eight. *2 frames each, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-29 — the homecoming's scenes](#request-2026-09-29--the-homecomings-scenes), item 3. **Stands in now:** the seated rest (`-rest`) behind Astra's `home-table`, Claude's `coins-and-paper` on it (Astra's library art reused). **Plugs into:** `drawYard` (`count`) in `public/flashback.js`.
- [ ] **A25** · priority 2 · `<cast>-remember` (kneeling on one knee at a grave marker, hat held against the chest, head bowed) and `<cast>-mourn` (standing, head bowed, hands folded or hat in hand, seen from behind and from the front) for each of the eight. *1 each; kneeling east, standing n and s*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-29 — the homecoming's scenes](#request-2026-09-29--the-homecomings-scenes), item 4. **Stands in now:** kneeling: the nursing pose (`-care`); standing: the listening back view (`-listen-n`), children their own `-idle-n` (Astra's library art reused). **Plugs into:** `drawYard` (`burial`) in `public/flashback.js`.
- [ ] **A27** · priority 2 · the priest at a Tejano wedding: `priest-read` (a Catholic priest in a dark cassock, bareheaded, reading from a small book, 2 frames, east) and `priest-idle-s`. *2 and 1*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-29 — the family's start: Tejano and free Black families, and the people of the road east](#request-2026-09-29--the-familys-start-tejano-and-free-black-families-and-the-people-of-the-road-east), item 5. **Stands in now:** the elder recoloured in dark clothes, with the commissioner’s reading pose (Astra's library art reused). **Plugs into:** `figureOf` in `public/courtship.js`.
- [ ] **A32** · priority 2 · for the ten family figures (`<family>`: `father-hat`, `father-beard`, `father-moustache`, `father-straw`, `mother-braid`, `mother-loose`, `mother-scarf`, `mother-straw`, `youth-boy`, `youth-girl`), the work poses asked of the old cast: `-chop`, `-notch`, `-lift`, `-dig`, `-dig-well`, `-split`, `-reap`, `-aim`, `-fire`, `-fish`, `-gather`, `-carpentry`, `-butcher`, `-drill`, `-guard`, `-stake`, `-tend-fire` (A1, A3, A4, A6-A10, A13-A17), the ambient `-whittle`, `-mend-harness`, `-sew`, `-shell-corn`, `-clean-rifle`, `-wash`, `-pipe`, `-cards`, `-sweep`, `-carry-water` (A5), `-milk` (B15) and `-pitch-tent` (A30). *as each item asks of the old cast*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — the family figures' missing poses](#request-2026-10-03--the-family-figures-missing-poses), item 2. **Stands in now:** her two-pose work cycle, with the stand-in tool in her hands where the work table draws one (`HAFTS`) (drawn in code (canvas or CSS)). **Plugs into:** `FAMILY_POSES` in `public/avatar-identity.js`; `HAFTS` and `STROKES` in `public/work-art.js`.
- [ ] **A33** · priority 2 · for the ten family figures (`<family>`: `father-hat`, `father-beard`, `father-moustache`, `father-straw`, `mother-braid`, `mother-loose`, `mother-scarf`, `mother-straw`, `youth-boy`, `youth-girl`): the wedding's `<family>-greet`, `-shy`, `-laugh`, `-vow` as A19. *as A19*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — the family figures' missing poses](#request-2026-10-03--the-family-figures-missing-poses), item 5. **Stands in now:** her speaking and her standing (`clipFor` in `public/courtship.js`) (Astra's library art reused). **Plugs into:** `clipFor` in `public/courtship.js`.
- [ ] **A13** · priority 3 · `<cast>-carpentry` (at a shaving horse drawing a drawknife, 2 frames, then boring with an auger, 2). *4 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 6. **Stands in now:** the seated mending cycle with shavings (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.whittle` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-carpentry`, `teal-carpentry`, `elder-carpentry`, `blue-carpentry`, `rust-woman-carpentry`, `indigo-carpentry`, `ochre-carpentry`, `blue-girl-carpentry`).
- [ ] **A14** · priority 3 · `<cast>-butcher` (at a plank table cutting a joint wrapped in cloth, or salting it down in a barrel; no carcass, no blood). *2 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 10. **Stands in now:** the kneeling nursing pose, bobbing (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.butcher` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-butcher`, `teal-butcher`, `elder-butcher`, `blue-butcher`, `rust-woman-butcher`, `indigo-butcher`, `ochre-butcher`, `blue-girl-butcher`).
- [ ] **A15** · priority 3 · `<cast>-drill` (stepping out with a rifle at the shoulder, 4 frames) and `<cast>-guard` (sentry, rifle sloped, turning the head, 2). *4 and 2 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 11. **Stands in now:** the walk stepped on the spot; the searching pose with a rifle sloped (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.drill`, `STROKES.guard` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-drill`, `rust-guard`, `teal-drill`, `teal-guard`, `elder-drill`, `elder-guard`, `blue-drill`, `blue-guard`, `rust-woman-drill`, `rust-woman-guard`, `indigo-drill`, `indigo-guard`, `ochre-drill`, `ochre-guard`, `blue-girl-drill`, `blue-girl-guard`).
- [ ] **A16** · priority 3 · `<cast>-stake` (a mallet raised over a stake and driving it). *2 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 12. **Stands in now:** the walk cycle paced to and fro (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.pace` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-stake`, `teal-stake`, `elder-stake`, `blue-stake`, `rust-woman-stake`, `indigo-stake`, `ochre-stake`, `blue-girl-stake`).
- [ ] **A17** · priority 3 · `<cast>-tend-fire` (kneeling, feeding a stick into a small fire, blowing on it; the fire in the frame). *2 frames, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 14. **Stands in now:** the kneeling nursing pose with a small flame and puffs in canvas (drawn in code (canvas or CSS)). **Plugs into:** `STROKES.fire` in `public/work-art.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-tend-fire`, `teal-tend-fire`, `elder-tend-fire`, `blue-tend-fire`, `rust-woman-tend-fire`, `indigo-tend-fire`, `ochre-tend-fire`, `blue-girl-tend-fire`).
- [ ] **A18** · priority 3 · aligned layer PNGs `<sheet>--line`, `--skin`, `--hair`, `--clothes` and the head items (`--hat`, `--beard`, `--moustache`, `--straw-hat`, `--bonnet`, `--pinned`, `--braid`, `--loose`, `--headscarf`) for every people sheet, one figure per sex and age band. *every frame of every people sheet*. Registered pixel for pixel with the sheet they layer; greyscale value masks; see the request. [Request 2026-09-12 (second) — settling in: houses, interiors, furnishings, and people whose looks can be chosen](#request-2026-09-12-second--settling-in-houses-interiors-furnishings-and-people-whose-looks-can-be-chosen), layered people. **Stands in now:** the painted cast recoloured by a region classifier (`public/person-palette.js`, 2026-09-28), some head styles the nearest cast silhouette (Astra's library art reused). **Plugs into:** `public/avatar-art.js`, `public/person-palette.js`, `public/appearance.js`.
- [ ] **A20** · priority 3 · `rust-fiddle` and `ochre-fiddle` (a farmer standing and playing a fiddle at the wedding supper). *2 frames each, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-29 — the lone parent's wedding](#request-2026-09-29--the-lone-parents-wedding), item 7. **Stands in now:** the Béxar fandango fiddler, `fiddler-play` (Astra's library art reused). **Plugs into:** the wedding scene in `public/courtship.js`. **Claude stand-in in place** (`rust-fiddle`, `ochre-fiddle`); Astra's replaces it.
- [ ] **A26** · priority 3 · `land-agent-idle`, `land-agent-trade` (a townsman buying land after the war: a dark frock coat, a tall hat, a satchel of papers; standing, and holding out a purse), and `<cast>-raise-log` (two grown people lifting a log up onto a wall, 2 frames). *1 and 2; 2 each, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-29 — the homecoming's scenes](#request-2026-09-29--the-homecomings-scenes), item 5. **Stands in now:** the land agent: Astra's `elder` in his `-trade` pose; raising the logs: the carrying cycle (`-carry`) and the notching (`-repair`) (Astra's library art reused). **Plugs into:** `drawYard` (`sale`, `rebuild`) in `public/flashback.js`.
- [ ] **A30** · priority 3 · for each of the eight cast figures: `-pitch-tent` (knelt, driving a tent peg with a maul, 2 frames, east). *2 frames each, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-02 — the tent, and going in out of the weather](#request-2026-10-02--the-tent-and-going-in-out-of-the-weather), item 4. **Stands in now:** the house's notching stroke (`notch`, the hoeing cycle with a drawn axe) (Astra's library art reused). **Plugs into:** `WORK['pitch-tent']` in `public/work-art.js`.

### B — Children, babies and sickness (19)

- [ ] **B1** · priority 1 · for `girl`, `boy`, `smallchild`: `-play-gallop` (stick horse, 4, east), `-play-run` (4, east, and `-n`/`-s`), `-play-hide` (1), `-play-kneel` (2), `-play-sit-doll` (1), `-play-hoop` (4, the hoop in the frame), `-scatter` (throwing corn, 2). *1-4 frames each*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372; drawn to fill the cell as an adult does, a child's proportions (the renderer shrinks them by age). [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 1. **Stands in now:** the child's walk, sitting rest, side-on rest and back-turned idle; the grown sowing cycle at a child's size for the hens (Astra's library art reused). **Plugs into:** `littleClip` and `CHILD_POSES` in `public/motion.js`; `STROKES.scatter`. **Claude stand-in held back: Astra has drawn the subject** (girl, boy, smallchild), so the page draws hers (`girl-play-run`, `girl-play-run-s`, `girl-play-run-n`, `girl-play-gallop`, `girl-play-hide`, `girl-play-kneel`, `girl-play-sit-doll`, `girl-play-hoop`, `girl-scatter`, `boy-play-run`, `boy-play-run-s`, `boy-play-run-n`, `boy-play-gallop`, `boy-play-hide`, `boy-play-kneel`, `boy-play-sit-doll`, `boy-play-hoop`, `boy-scatter`, `smallchild-play-run`, `smallchild-play-run-s`, `smallchild-play-run-n`, `smallchild-play-gallop`, `smallchild-play-hide`, `smallchild-play-kneel`, `smallchild-play-sit-doll`, `smallchild-play-hoop`, `smallchild-scatter`).
- [ ] **B2** · priority 1 · `infant-crawl` (4, east, and `-w`), `infant-cry` (sitting up, mouth open, 2), `infant-sleep` (curled on a blanket, 1). *1-4 frames*. The infant's logical height (`infant-idle-*`), ground anchor. [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 2. **Stands in now:** the infant's standing pose moved over the ground; the front idle with a "(crying)" bubble; `infant-rest` (Astra's library art reused). **Plugs into:** `littleClip` in `public/motion.js`. **Claude stand-in held back: Astra has drawn the subject** (infant), so the page draws hers (`infant-crawl`, `infant-crawl-w`, `infant-cry`, `infant-sleep`).
- [ ] **B3** · priority 1 · for each cast woman (`rust-woman`, `teal`, `indigo`, `blue-girl`) and, less often, each man: `-hold-baby` (a baby to the shoulder, swaying, 2, south) and `-carry-baby-walk` (a baby on the hip, walking, 4, east, and `-n`/`-s`); also covers the riders request's walker carrying an infant (item 3). *2 and 4 frames*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 3. **Stands in now:** the harvest carry with the infant drawn at her side; a carried baby drawn at the carrier's hip (Astra's library art reused). **Plugs into:** `littleClip` (`aside.kind === 'baby'`) in `public/motion.js`; `carriedAt` in `drawWorld`, `public/app.js`. **Claude stand-in held back: Astra has drawn the subject** (rust-woman, teal, indigo, blue-girl, rust, elder, blue, ochre), so the page draws hers (`rust-woman-hold-baby`, `rust-woman-carry-baby-walk`, `rust-woman-carry-baby-walk-s`, `rust-woman-carry-baby-walk-n`, `teal-hold-baby`, `teal-carry-baby-walk`, `teal-carry-baby-walk-s`, `teal-carry-baby-walk-n`, `indigo-hold-baby`, `indigo-carry-baby-walk`, `indigo-carry-baby-walk-s`, `indigo-carry-baby-walk-n`, `blue-girl-hold-baby`, `blue-girl-carry-baby-walk`, `blue-girl-carry-baby-walk-s`, `blue-girl-carry-baby-walk-n`, `rust-hold-baby`, `rust-carry-baby-walk`, `rust-carry-baby-walk-s`, `rust-carry-baby-walk-n`, `elder-hold-baby`, `elder-carry-baby-walk`, `elder-carry-baby-walk-s`, `elder-carry-baby-walk-n`, `blue-hold-baby`, `blue-carry-baby-walk`, `blue-carry-baby-walk-s`, `blue-carry-baby-walk-n`, `ochre-hold-baby`, `ochre-carry-baby-walk`, `ochre-carry-baby-walk-s`, `ochre-carry-baby-walk-n`).
- [ ] **B4** · priority 1 · `mark-sick` (a folded blanket and a cup, or a cool cloth, in the panel's mark style). *1*. Mark: 96×96, transparent, no text, reads at 22–24 CSS px. [Request 2026-09-27 — sickness: the sick badge, the sickness icons, and the sick lying down](#request-2026-09-27--sickness-the-sick-badge-the-sickness-icons-and-the-sick-lying-down), item 1. **Stands in now:** the road's nursing icon `icon-tend-sick` in a cream disc (Astra's library art reused). **Plugs into:** `.panel-sick-mark` in `panelRow`, `public/app.js`. **Claude stand-in held back: Astra has drawn the subject** (the sick mark), so the page draws hers (`mark-sick`).
- [ ] **B5** · priority 1 · `icon-rest-road` (the wagon stopped, somebody lying under a blanket), `icon-camp-apart` (a camp up a bank away from a crowd of tents), `icon-nurse-home` (somebody by a bed in a cabin with a cup). *1 each*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40% (the request says 64 px; deliver at 128 as the other icons). [Request 2026-09-27 — sickness: the sick badge, the sickness icons, and the sick lying down](#request-2026-09-27--sickness-the-sick-badge-the-sickness-icons-and-the-sick-lying-down), item 2. **Stands in now:** `icon-rest`, `icon-tend-sick` and a stroked glyph (Astra's library art reused). **Plugs into:** `PANEL_ICONS` in `public/family-panel.js`. **Claude stand-in in place** (`icon-camp-apart`, `icon-nurse-home`); Astra's replaces it; **Claude stand-in held back: Astra has drawn the subject** (rest), so the page draws hers (`icon-rest-road`).
- [ ] **B13** · priority 1 · `mark-hunger` (an empty bowl, in the panel's mark style) and `mark-food` (a filled sack, the food gauge's). *1 each*. Mark: 96×96, transparent, no text, reads at 22–24 CSS px. [Request 2026-09-30 — the hunger mark and the food gauge's sack](#request-2026-09-30--the-hunger-mark-and-the-food-gauges-sack), items 1 and 2. **Stands in now:** a bowl and a sack drawn in the style sheet as masks, coloured by the stage (drawn in code (canvas or CSS)). **Plugs into:** `.panel-hunger-mark` in `panelRow` and `.food-icon` in `paintLarder`, `public/app.js` and `public/style.css`.
- [ ] **B17** · priority 1 · `<child>-play` (running, skipping, a hoop or ball, 4, east, `-n`, `-s`) and `<child>-play-sit` (sitting at play indoors, 2, east), for `boy`, `girl` and `smallchild`. *4 + 2 frames each*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — the children's own actions](#request-2026-10-03--the-childrens-own-actions), items 1 and 2. **Stands in now:** the child standing (`idle-s`), by the rule of no adult fallback (Astra's library art reused). **Plugs into:** `CHILD_POSES` in `public/avatar-identity.js`; play drawing in `drawWorld`, `public/app.js`. **Claude stand-in held back: Astra has drawn the subject** (girl, boy, smallchild), so the page draws hers (`girl-play-run`, `girl-play-run-s`, `girl-play-run-n`, `girl-play-gallop`, `girl-play-hide`, `girl-play-kneel`, `girl-play-sit-doll`, `girl-play-hoop`, `boy-play-run`, `boy-play-run-s`, `boy-play-run-n`, `boy-play-gallop`, `boy-play-hide`, `boy-play-kneel`, `boy-play-sit-doll`, `boy-play-hoop`, `smallchild-play-run`, `smallchild-play-run-s`, `smallchild-play-run-n`, `smallchild-play-gallop`, `smallchild-play-hide`, `smallchild-play-kneel`, `smallchild-play-sit-doll`, `smallchild-play-hoop`).
- [ ] **B6** · priority 2 · `girl-speak`, `boy-speak`, `smallchild-speak` (2, east) and `-tug` (tugging at a grown person's sleeve, 2, east). *2 frames each, east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 4. **Stands in now:** the standing idle; the parent in the cast listening pose (Astra's library art reused). **Plugs into:** `littleClip` (`talk.phase === 'talking'`) in `public/motion.js`. **Claude stand-in held back: Astra has drawn the subject** (girl, boy, smallchild), so the page draws hers (`girl-speak`, `girl-tug`, `boy-speak`, `boy-tug`, `smallchild-speak`, `smallchild-tug`).
- [ ] **B7** · priority 2 · for `girl`, `boy`, `smallchild`: `-shoo` (arms flung up waving a cloth, 2), `-gather` (2), `-carry-water` (a small pail in each hand, walking, 4, east, and `-n`/`-s`). *2-4 frames*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 13. **Stands in now:** the walk paced to and fro; the grown carry at the child's size (Astra's library art reused). **Plugs into:** `STROKES.shoo`, `STROKES.carry` with the child scaling of `entityClip`. **Claude stand-in held back: Astra has drawn the subject** (girl, boy, smallchild), so the page draws hers (`girl-shoo`, `girl-gather`, `girl-carry-water`, `girl-carry-water-s`, `girl-carry-water-n`, `boy-shoo`, `boy-gather`, `boy-carry-water`, `boy-carry-water-s`, `boy-carry-water-n`, `smallchild-shoo`, `smallchild-gather`, `smallchild-carry-water`, `smallchild-carry-water-s`, `smallchild-carry-water-n`).
- [ ] **B8** · priority 2 · for each cast figure and the children: `-sick-rest` (lying under a blanket, head on a bundle, 1 frame, `-s` and `-e`), and `infant-sick` (wrapped and lying). *1 frame, south and east*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-27 — sickness: the sick badge, the sickness icons, and the sick lying down](#request-2026-09-27--sickness-the-sick-badge-the-sickness-icons-and-the-sick-lying-down), item 3. **Stands in now:** the delivered `-injured-rest` pose, as the hurt are; a sick baby as it is (Astra's library art reused). **Plugs into:** `restingSick` and `grownClip` in `public/motion.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl, girl, boy, smallchild, infant), so the page draws hers (`rust-sick-rest`, `rust-sick-rest-s`, `rust-sick-rest-e`, `teal-sick-rest`, `teal-sick-rest-s`, `teal-sick-rest-e`, `elder-sick-rest`, `elder-sick-rest-s`, `elder-sick-rest-e`, `blue-sick-rest`, `blue-sick-rest-s`, `blue-sick-rest-e`, `rust-woman-sick-rest`, `rust-woman-sick-rest-s`, `rust-woman-sick-rest-e`, `indigo-sick-rest`, `indigo-sick-rest-s`, `indigo-sick-rest-e`, `ochre-sick-rest`, `ochre-sick-rest-s`, `ochre-sick-rest-e`, `blue-girl-sick-rest`, `blue-girl-sick-rest-s`, `blue-girl-sick-rest-e`, `girl-sick-rest`, `girl-sick-rest-s`, `girl-sick-rest-e`, `boy-sick-rest`, `boy-sick-rest-s`, `boy-sick-rest-e`, `smallchild-sick-rest`, `smallchild-sick-rest-s`, `smallchild-sick-rest-e`, `infant-sick`).
- [ ] **B9** · priority 2 · `icon-child-stick-horse`, `icon-child-doll`, `icon-child-tag`, `icon-child-hide`, `icon-child-cart`, `icon-child-hoop`, `icon-child-marbles`, `icon-child-hens`; the Scrape's `icon-flee-hide`, `icon-flee-bundle`, `icon-road-lookout`, `icon-road-sing`, `icon-road-little-ones`, `icon-camp-fire`, `icon-ferry-help`, `icon-share-food`, `icon-ford-carry` (a child reads as a child; nothing holds an edge or a gun). *17 icons*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%. [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 5. **Stands in now:** stroked glyphs drawn in code (drawn in code (canvas or CSS)). **Plugs into:** `PANEL_ICONS` and `LITTLE_GLYPHS` in `public/family-panel.js`. **Claude stand-in in place** (`icon-child-stick-horse`, `icon-child-doll`, `icon-child-tag`, `icon-child-hide`, `icon-child-cart`, `icon-child-hoop`, `icon-child-marbles`, `icon-child-hens`, `icon-flee-hide`, `icon-flee-bundle`, `icon-road-lookout`, `icon-road-sing`, `icon-road-little-ones`, `icon-camp-fire`, `icon-ferry-help`, `icon-share-food`, `icon-ford-carry`); Astra's replaces it.
- [ ] **B10** · priority 2 · `icon-child-help` (a child running along a track toward a neighbour's cabin, an arm out). *1*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40% (the request says 48 px; deliver at 128 as the others). [Request 2026-09-28 — the oldest child going for help](#request-2026-09-28--the-oldest-child-going-for-help), item 1. **Stands in now:** a stroked glyph: a running figure and a house (drawn in code (canvas or CSS)). **Plugs into:** `PANEL_ICONS['child-help']` in `public/family-panel.js`. **Claude stand-in in place** (`icon-child-help`); Astra's replaces it.
- [ ] **B11** · priority 2 · `icon-flee-cow` (a child leading the family's milk cow on a rope). *1*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%. [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 1 (icon). **Stands in now:** a stroked glyph (drawn in code (canvas or CSS)). **Plugs into:** `PANEL_ICONS` in `public/family-panel.js`. **Claude stand-in in place** (`icon-flee-cow`); Astra's replaces it.
- [ ] **B14** · priority 2 · for each of the eight cast figures: `-carry-child-walk` (a child of two to five carried on the hip or the back, walking, 4, east, and `-n`/`-s`). *4 frames, east, `-n`, `-s`*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-02 — a grown person carrying a child of two to five on the road](#request-2026-10-02--a-grown-person-carrying-a-child-of-two-to-five-on-the-road), item 1. **Stands in now:** the child's own figure drawn at the carrier's hip, a little up and to the right, as a carried baby is (Astra's library art reused). **Plugs into:** `roadCarrier` and `carriedAt` in `drawWorld`, `public/app.js`.
- [ ] **B15** · priority 2 · `icon-milk-cow` (somebody on a stool with a pail beside a cow) and, for the cast and the children, `-milk` (sitting on a stool at a cow's flank, the pail between the knees, 2 frames, east). *1 icon; 2 frames each, east*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%; People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-02 — the milking icon and the milking pose](#request-2026-10-02--the-milking-icon-and-the-milking-pose), items 1 and 2. **Stands in now:** the cow on a rope (`icon-flee-cow`) for the icon; the tending pose (`care`) for the milking (drawn in code (canvas or CSS)). **Plugs into:** `PANEL_ICONS['milk-cow']` in `public/family-panel.js`; the work art of `public/work-art.js`.
- [ ] **B16** · priority 2 · `icon-cut-path` (a trodden path between two stumps, an axe leaning on one), `icon-fence-yard` (a cabin's corner with a low rail fence round its dooryard) and `ground-path-straight`, `ground-path-bend` (worn earth a person's width across, from above, tiling along a line). *1 each*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%; Ground piece: seen from above at the map's scale, transparent, tiles or scatters. [Request 2026-10-02 — paths and the yard](#request-2026-10-02--paths-and-the-yard), items 1 to 3. **Stands in now:** the lane's and the plot fence's icons; a stroked brown verge with a packed line down the middle (drawn in code (canvas or CSS)). **Plugs into:** `PANEL_ICONS['cut-path']`, `['fence-yard']` in `public/family-panel.js`; `drawLandPaths` in `public/app.js`.
- [ ] **B18** · priority 2 · `<child>-feed-hens`, `<child>-gather-eggs` (2, east each) and `<child>-listen-s`, `<child>-speak-s` (2 each), for `boy` and `girl` (talking for `smallchild` too). *2 frames each*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — the children's own actions](#request-2026-10-03--the-childrens-own-actions), items 3 and 5. **Stands in now:** the child standing (`idle-s`) (Astra's library art reused). **Plugs into:** `CHILD_POSES` in `public/avatar-identity.js`; work drawing in `drawWorld`. **Claude stand-in held back: Astra has drawn the subject** (girl, boy, smallchild), so the page draws hers (`girl-speak`, `boy-speak`, `smallchild-speak`).
- [ ] **B20** · priority 2 · for the ten family figures (`<family>`: `father-hat`, `father-beard`, `father-moustache`, `father-straw`, `mother-braid`, `mother-loose`, `mother-scarf`, `mother-straw`, `youth-boy`, `youth-girl`): `<family>-hold-baby` and `<family>-carry-baby-walk` (`-n`, `-s`) as B3, `<family>-carry-child-walk` (`-n`, `-s`) as B14, `<family>-sick-rest` (`-e`, `-s`) as B8. *as B3, B14 and B8*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — the family figures' missing poses](#request-2026-10-03--the-family-figures-missing-poses), item 3. **Stands in now:** her walk with the baby beside her; her hurt rest for the sick (Astra's library art reused). **Plugs into:** `FAMILY_POSES` in `public/avatar-identity.js`; `littleClip` in `public/motion.js`.
- [ ] **B19** · priority 3 · `<child>-lead` (walking with a small child by the hand, 4, east, `-n`, `-s`) for `boy` and `girl`. *4 frames, east, `-n`, `-s`*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — the children's own actions](#request-2026-10-03--the-childrens-own-actions), item 6. **Stands in now:** the two children walking side by side (Astra's library art reused). **Plugs into:** `CHILD_POSES`; the little-ones job on the road in `drawWorld`.

### C — Soldiers, battles and famous people (19)

- [ ] **C1** · priority 1 · every cast figure (`rust`, `teal`, `elder`, `blue`, `rust-woman`, `indigo`, `ochre`, `blue-girl`) in `<cast>-aim`, `<cast>-fire`, `<cast>-load` (kneeling), `<cast>-ramrod`, clip `<cast>-fire-reload`; and each cast's `-injured` and `-reclining`. *4 frames each, east*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure. [Request 2026-09-25 — battles: the pieces the engine stands in for](#request-2026-09-25--battles-the-pieces-the-engine-stands-in-for), item 1. **Stands in now:** the volunteer militia's firing cycle and fallen poses, not the person's own figure (Astra's library art reused). **Plugs into:** `memberPose` and `poseOf` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl), so the page draws hers (`rust-fire-reload`, `teal-fire-reload`, `elder-fire-reload`, `blue-fire-reload`, `rust-woman-fire-reload`, `indigo-fire-reload`, `ochre-fire-reload`, `blue-girl-fire-reload`, `rust-injured`, `rust-reclining`, `teal-injured`, `teal-reclining`, `elder-injured`, `elder-reclining`, `blue-injured`, `blue-reclining`, `rust-woman-injured`, `rust-woman-reclining`, `indigo-injured`, `indigo-reclining`, `ochre-injured`, `ochre-reclining`, `blue-girl-injured`, `blue-girl-reclining`).
- [ ] **C2** · priority 2 · `bearers-carry-1`..`-4` (two men carrying a third on a blanket, walking east); no blood. *4 frames, east*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure. [Request 2026-09-25 — battles: the pieces the engine stands in for](#request-2026-09-25--battles-the-pieces-the-engine-stands-in-for), item 3. **Stands in now:** the seated wounded helped back by two walking figures; `*-reclining` with two beside (Astra's library art reused). **Plugs into:** `drawFallen` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (volunteer), so the page draws hers (`bearers-carry`).
- [ ] **C3** · priority 2 · `volunteer-clean-rifle`, `volunteer-camp-sit`, `volunteer-camp-cook` and the same for `regular-` (2 frames each). *2 frames each, east*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure. [Request 2026-09-28 — ambient life](#request-2026-09-28--ambient-life), item 3. **Stands in now:** the ramrod's stroke; the cast's civilian men at the fire (Astra's library art reused). **Plugs into:** `CAMP_TEXIAN`, `CAMP_MEXICAN` in `sim/ambient.mjs`; `figureClip` in `public/ambient.js`. **Claude stand-in held back: Astra has drawn the subject** (volunteer, regular), so the page draws hers (`volunteer-clean-rifle`, `volunteer-camp-sit`, `volunteer-camp-cook`, `regular-clean-rifle`, `regular-camp-sit`, `regular-camp-cook`).
- [ ] **C4** · priority 2 · `regular-rest-sit`, `regular-sleep` (never to be mistaken for `regular-reclining`), `volunteer-rest-sit`, `musket-stack`; `breastwork-packs` in three or four segments about five feet high. *1-2 frames*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure; the breastwork as a prop. [Request 2026-09-25 — San Jacinto](#request-2026-09-25--san-jacinto), item 2. **Stands in now:** the standing idle and seated wounded; `crate`, `sacks`, `barrel`, `packed-belongings` in a line (Astra's library art reused). **Plugs into:** the `camp` branch of `draw` and `drawWorks` in `public/battle-view.js`. **Research:** HIST-TEX-522 (Houston: "packs and baggage, leaving an opening in the centre"). **Claude stand-in in place** (`musket-stack`); Astra's replaces it; **Claude stand-in held back: Astra has drawn the subject** (volunteer, regular, packs), so the page draws hers (`volunteer-rest-sit`, `volunteer-sleep`, `regular-rest-sit`, `regular-sleep`, `breastwork-packs-1`, `breastwork-packs-2`, `breastwork-packs-3`, `breastwork-packs-4`).
- [ ] **C5** · priority 2 · `volunteer-loophole-fire` and `regular-loophole-fire` (the barrel at the wall, the man half hidden, 2-4 frames); `volunteer-crowbar` (4 frames, forcing a door); `volunteer-dig` (a spade in a trench at night); `barricade-street` (ditch, bank, post palisade, gun embrasure); `sandbag-breastwork`. *2-4 frames; props 1*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure; props at `palisade` scale. [Request 2026-09-25 — the storming of Béxar](#request-2026-09-25--the-storming-of-béxar), items 1, 3, 4. **Stands in now:** flashes at the town's houses; the ramming stroke; `rust-work`/`teal-work`; `palisade` and `sacks` (Astra's library art reused). **Plugs into:** `draw` (`cover`), `drawBreaches` in `public/battle-view.js`. **Research:** Béxar, December 1835 (docs/battle-research/staging.md §3.9, HIST-TEX-490-496). **Claude stand-in held back: Astra has drawn the subject** (volunteer, regular, barricade, sacks), so the page draws hers (`volunteer-loophole-fire`, `regular-loophole-fire`, `volunteer-crowbar`, `volunteer-dig`, `barricade-street`, `sandbag-breastwork`).
- [ ] **C6** · priority 2 · volunteers firing over a parapet, the body from the waist up over a wall top, east, west, north and south, with a loading frame below the parapet (`volunteer-parapet-fire-*`). *2-4 frames a facing*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure. [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 3. **Stands in now:** the volunteer firing cycle at the wall's line (Astra's library art reused). **Plugs into:** `layoutSide` and `draw` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (volunteer), so the page draws hers (`volunteer-parapet-fire-e`, `volunteer-parapet-fire-s`, `volunteer-parapet-fire-n`).
- [ ] **C8** · priority 2 · `skirmisher-run-e` (4) and `skirmisher-kneel-fire` (aim, fire, load; 4), the line's regular. *4 frames each, east*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure. [Request 2026-09-27 — Mexican troops after a family on the road](#request-2026-09-27--mexican-troops-after-a-family-on-the-road), item 3. **Stands in now:** `regular-march`, `regular-fire-reload` (Astra's library art reused). **Plugs into:** `createChaseView` in `public/chase-view.js`. **Claude stand-in held back: Astra has drawn the subject** (regular), so the page draws hers (`skirmisher-run-e`, `skirmisher-kneel-fire`).
- [ ] **C9** · priority 2 · `regular-march-column` (six to eight infantry in files of three, a mounted officer at the head, a cart behind; 4 frames, east). *4 frames, east*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure. [Request 2026-09-26 — the Mexican advance](#request-2026-09-26--the-mexican-advance), item 3. **Stands in now:** `regular-march` men in files of three with a `dragoon-march` at the head (Astra's library art reused). **Plugs into:** `drawArmy` (`moving`) in `public/army-view.js`. **Claude stand-in held back: Astra has drawn the subject** (regular), so the page draws hers (`regular-march-column`).
- [ ] **C10** · priority 2 · `volunteer-bank-climb-1`..`-6` (step up the cut, aim and fire over the lip, step down, load under the bank). *6 frames, east*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure. [Request 2026-09-25 — Concepción and the Grass Fight](#request-2026-09-25--concepción-and-the-grass-fight), item 2. **Stands in now:** `volunteer-load` a third of a figure lower than the men firing (Astra's library art reused). **Plugs into:** the `bank` branch of `draw` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (volunteer), so the page draws hers (`volunteer-bank-climb`).
- [ ] **C11** · priority 2 · `figure-wading` (a man up to the thighs in water, running, in either side's clothes); no blood, nobody shot close. *2-4 frames, east*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure. [Request 2026-09-25 — San Jacinto](#request-2026-09-25--san-jacinto), item 4. **Stands in now:** nobody drawn wading (nothing). **Plugs into:** `drawWorks` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (regular, volunteer), so the page draws hers (`figure-wading-regular`, `figure-wading-volunteer`, `figure-wading`).
- [ ] **C14** · priority 2 · `ana-esparza-*` (walk, idle, `shelter-with-children`, `carry-toddler`, `hold-blanket`), `maria-de-jesus-*` (walk, idle, seated huddled), `enrique-esparza-*` (walk, idle, seated huddled, `look`), `burial-party-walk-e` (4; two men carrying a body wholly wrapped on a litter, never a body shown), `francisco-esparza-*` (walk, idle, `kneel-at-grave`), `esparza-seated`. *the famous-sheet contract*. Famous sheets: `volunteer-*` height for grown people, the children's for the children. [Request 2026-09-26 — the Esparza family](#request-2026-09-26--the-esparza-family), items 1-6. **Stands in now:** the second cast's woman, the library's girl, boy and small child; two `rust` figures with a canvas bundle (Astra's library art reused). **Plugs into:** `PERSON_ART` in `public/battle-view.js`; `drawBearers`; `drawFamous`. **Research:** Tejano dress in Béxar, 1836 (HIST-TEX-605-609); original interpretations, no likeness claimed. **Claude stand-in in place** (`ana-esparza-walk-e`, `ana-esparza-walk-s`, `ana-esparza-walk-n`, `maria-de-jesus-walk-e`, `maria-de-jesus-walk-s`, `maria-de-jesus-walk-n`, `enrique-esparza-walk-e`, `enrique-esparza-walk-s`, `enrique-esparza-walk-n`, `francisco-esparza-walk-e`, `francisco-esparza-walk-s`, `francisco-esparza-walk-n`, `ana-esparza-carry-toddler`, `burial-party-walk-e`, `ana-esparza-idle`, `ana-esparza-seated`, `ana-esparza-shelter-with-children`, `ana-esparza-hold-blanket`, `maria-de-jesus-idle`, `maria-de-jesus-seated-huddled`, `enrique-esparza-idle`, `enrique-esparza-seated-huddled`, `enrique-esparza-look`, `francisco-esparza-idle`, `francisco-esparza-kneel-at-grave`); Astra's replaces it; **Claude stand-in held back: Astra has drawn the subject** (esparza), so the page draws hers (`esparza-seated`).
- [ ] **C20** · priority 2 · `icon-join-seguin` (a Tejano horseman in a wide sombrero with a lance or a rifle, riding to join a line). *1*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%. [Request 2026-09-29 — the family's start: Tejano and free Black families, and the people of the road east](#request-2026-09-29--the-familys-start-tejano-and-free-black-families-and-the-people-of-the-road-east), item 4. **Stands in now:** `icon-join-houston`, the joining of Houston’s army, which it is (Astra's library art reused). **Plugs into:** `PANEL_ICONS` in `public/family-panel.js`.
- [ ] **C21** · priority 2 · `icon-go-inside` (the cabin’s open door with the hearth’s light inside, a chair or a chest by it: going in to set out the rooms, not raising the house). *1*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%. [Request 2026-09-30 — the House icon on the bar](#request-2026-09-30--the-house-icon-on-the-bar), the icon. **Stands in now:** `icon-build-house`, the house the family raises (Astra's library art reused). **Plugs into:** `PANEL_ICONS` in `public/family-panel.js`.
- [ ] **C22** · priority 2 · for the ten family figures (`<family>`: `father-hat`, `father-beard`, `father-moustache`, `father-straw`, `mother-braid`, `mother-loose`, `mother-scarf`, `mother-straw`, `youth-boy`, `youth-girl`): `<family>-aim`, `-fire`, `-load`, `-ramrod`, clip `<family>-fire-reload`, and `<family>-injured`, `<family>-reclining`, as C1 asks of the old cast. *as C1*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — the family figures' missing poses](#request-2026-10-03--the-family-figures-missing-poses), item 4. **Stands in now:** her work cycle while the others fire (`drawFigure` in `public/app.js`); her hurt rest and her standing figure laid down (Astra's library art reused). **Plugs into:** `poseOf` `cast` in `public/battle-view.js`; `drawFigure` in `public/app.js`.
- [ ] **C15** · priority 3 · the remaining Tejano cast, and an `ammunition-crate` prop at the people's scale (Castrillón's north and south walks, his crate rally with the crate in his own frames, and Travis firing at the north battery are delivered, 2026-10-03). *as the famous sheets*. Famous sheets. [Request 2026-09-26 — the famous people: the roster's remaining figures and poses](#request-2026-09-26--the-famous-people-the-rosters-remaining-figures-and-poses), Castrillón and the rest. **Stands in now:** Castrillón's east walk mirrored; the crate prop at another scale (Astra's library art reused). **Plugs into:** `PERSON_ART`. **Research:** original interpretations. **Claude stand-in held back: Astra has drawn the subject** (crate), so the page draws hers (`ammunition-crate`).
- [ ] **C16** · priority 3 · a padre with carts for the dead and wounded after Concepción (told in the caption today); `grass-bundle-cut` is Astra's, 2026-10-03. *1; 2-4*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside. [Request 2026-09-25 — Concepción and the Grass Fight](#request-2026-09-25--concepción-and-the-grass-fight), items 6 and 8. **Stands in now:** nothing (words) (told in words, not drawn). **Plugs into:** `draw` in `public/battle-view.js`. **Research:** the padre and carts are in the record only in outline (Smithwick); keep them general. **Claude stand-in in place** (`padre-carts`); Astra's replaces it.
- [ ] **C17** · priority 3 · the Come and Take It flag without the star (the star is disputed), and flat on the table half-painted and finished, as more states of `gonzales-flag-work-*`. *still and a four-frame wave for the flag; one each on the table*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside. [Request 2026-09-25 — Gonzales before the fight](#request-2026-09-25--gonzales-before-the-fight), item 5. **Stands in now:** canvas for the unfinished cloth (drawn in code (canvas or CSS)). **Plugs into:** `drawFlag`, `drawProp` in `public/town-scenes.js`. **Research:** Smithwick's description; the star is disputed (FIC-GONZ-419). **Claude stand-in held back: Astra has drawn the subject** (the Come and Take It flag), so the page draws hers (`flag-come-and-take-it-no-star-wind`, `flag-come-and-take-it-no-star`, `gonzales-flag-work-half`, `gonzales-flag-work-no-star`).
- [ ] **C18** · priority 3 · a camp: three or four wedge tents, a cook fire with a pot, stacked arms and a colour on a pole, `army-camp`, 192×192. *1*. 192×192, in the map art's own light. [Claude-drawn stand-ins (replace with Astra's)](#claude-drawn-stand-ins-replace-with-astras), the armies on the map. **Stands in now:** tents, the fire and the flag drawn in canvas by `public/army-view.js` (drawn in code (canvas or CSS)). **Plugs into:** `drawArmy` in `public/army-view.js`. **Claude stand-in in place** (`army-camp-mexican-pitched`, `army-camp-texian-pitched`); Astra's replaces it.
- [ ] **C19** · priority 3 · specific art for the Alamo's north-wall and church guns (the 18-pounder and the siege battery are delivered). *rest and recoil, both facings*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside (the field guns' scale). [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 2. **Stands in now:** the reusable field-gun art and existing crews (Astra's library art reused). **Plugs into:** `drawGun` in `public/battle-view.js`. **Research:** which guns stood where (docs/ALAMO_LAYOUT.md); interpretive silhouettes. **Claude stand-in held back: Astra has drawn the subject** (cannon), so the page draws hers (`cannon-alamo-north-e-recoil`, `cannon-alamo-north-w-recoil`, `cannon-alamo-church-e-recoil`, `cannon-alamo-church-w-recoil`).

### D — Riders, horses, wagons, carreta, ferry, steamboat (27)

- [ ] **D1** · priority 1 · `milk-cow-walk-e` (4), `milk-cow-walk-n`, `milk-cow-walk-s`, `milk-cow-graze` (2): a gentle dairy cow of the 1830s with a rope trailing from her horns. *4 east, 2 each north and south, 2 grazing*. Cattle at the logical height of `cattle-longhorn-*`, ground anchor, east mirrored for west. [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 1. **Stands in now:** the range longhorn's `cattle-longhorn-red-idle` and `-graze` (Astra's library art reused). **Plugs into:** the cow in `drawWorld`, `public/app.js` (`window.__cowDrawn`). **Claude stand-in held back: Astra has drawn the subject** (cow), so the page draws hers (`milk-cow-walk-e`, `milk-cow-walk-n`, `milk-cow-walk-s`, `milk-cow-graze`).
- [ ] **D2** · priority 1 · `dragoon-gallop-e` (4), `-n`, `-s` (the escort dragoon riding hard, carbine slung) and `dragoon-carbine-fire` (raise, fire, lower; 3); `dragoon-fire` for the battles is Astra's, 2026-10-03. *4 + 2 + 2, and 3*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540 (the `dragoon-e` height). [Request 2026-09-27 — Mexican troops after a family on the road](#request-2026-09-27--mexican-troops-after-a-family-on-the-road), items 1-2. **Stands in now:** `dragoon-march` with a flash and a puff at his hands; `dragoon-idle-e` (Astra's library art reused). **Plugs into:** `createChaseView` in `public/chase-view.js`; the dragoon branch of `draw` in `public/battle-view.js`.
- [ ] **D3** · priority 2 · `girl`, `boy`, `smallchild` and `infant` mounted on the family's chestnut: `<child>-ride-e`, `-s`, `-n` as the eight have. *4 frames a heading*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-09-14 — family members on horseback](#request-2026-09-14--family-members-on-horseback), children. **Stands in now:** the child's idle cut below the waist over the walking horse (Astra's library art reused). **Plugs into:** `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`; `drawSeated` in `public/app.js`. **Claude stand-in held back: Astra has drawn the subject** (girl, boy, smallchild), so the page draws hers (`girl-ride-e`, `girl-ride-s`, `girl-ride-n`, `boy-ride-e`, `boy-ride-s`, `boy-ride-n`, `smallchild-ride-e`, `smallchild-ride-s`, `smallchild-ride-n`, `girl-ride-wagon-e`, `girl-ride-wagon-s`, `girl-ride-wagon-n`, `boy-ride-wagon-e`, `boy-ride-wagon-s`, `boy-ride-wagon-n`, `smallchild-ride-wagon-e`, `smallchild-ride-wagon-s`, `smallchild-ride-wagon-n`).
- [ ] **D4** · priority 2 · seated driver layers `rust-woman-drive-<dir>`, `indigo-drive-<dir>`, `ochre-drive-<dir>`, `blue-girl-drive-<dir>` and the four children, on the four headings as the delivered sixteen. *4 headings each*. As `people-wagon-drivers`: anchored at the rig's seat point. [Request 2026-09-16 — driving the ox wagon](#request-2026-09-16--driving-the-ox-wagon), second cast and children. **Stands in now:** the figure's idle cut below the waist at the front of the wagon (Astra's library art reused). **Plugs into:** `wagonDriverId`, `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`. **Claude stand-in held back: Astra has drawn the subject** (rust-woman, indigo, ochre, blue-girl, girl, boy, smallchild), so the page draws hers (`rust-woman-wagon-driver-s`, `rust-woman-wagon-driver-e`, `rust-woman-wagon-driver-w`, `rust-woman-wagon-driver-n`, `indigo-wagon-driver-s`, `indigo-wagon-driver-e`, `indigo-wagon-driver-w`, `indigo-wagon-driver-n`, `ochre-wagon-driver-s`, `ochre-wagon-driver-e`, `ochre-wagon-driver-w`, `ochre-wagon-driver-n`, `blue-girl-wagon-driver-s`, `blue-girl-wagon-driver-e`, `blue-girl-wagon-driver-w`, `blue-girl-wagon-driver-n`, `girl-wagon-driver-s`, `girl-wagon-driver-e`, `girl-wagon-driver-w`, `girl-wagon-driver-n`, `boy-wagon-driver-s`, `boy-wagon-driver-e`, `boy-wagon-driver-w`, `boy-wagon-driver-n`, `smallchild-wagon-driver-s`, `smallchild-wagon-driver-e`, `smallchild-wagon-driver-w`, `smallchild-wagon-driver-n`).
- [ ] **D5** · priority 2 · `cart-travel-e`, `-n`, `-s` (4 frames, the wheels turning) and `cart-idle` loaded and empty; seated riders for the bed of an open wagon and a cart, both casts and the children, east/north/south, anchored at the hip (`<figure>-ride-wagon-<dir>`), and the wagon's tail with its cover drawn back. *4 frames a heading*. The scale of `wagon-covered` and `ox-walk`. [Request 2026-09-25 — riders, walkers and the cart](#request-2026-09-25--riders-walkers-and-the-cart), items 1-2. **Stands in now:** the delivered static `cart-open` views; riders as their idle cut at the waist on the cover (Astra's library art reused). **Plugs into:** `miniWagon` and `drawSeated` in `public/app.js`; `bedLayout` and `wagonRigClip` in `public/motion.js` (the tail: the rig `wagon-ox-open-*`). **Claude stand-in held back: Astra has drawn the subject** (rust, teal, elder, blue, rust-woman, indigo, ochre, blue-girl, girl, boy, smallchild, cart, wagon), so the page draws hers (`rust-ride-wagon-e`, `rust-ride-wagon-s`, `rust-ride-wagon-n`, `teal-ride-wagon-e`, `teal-ride-wagon-s`, `teal-ride-wagon-n`, `elder-ride-wagon-e`, `elder-ride-wagon-s`, `elder-ride-wagon-n`, `blue-ride-wagon-e`, `blue-ride-wagon-s`, `blue-ride-wagon-n`, `rust-woman-ride-wagon-e`, `rust-woman-ride-wagon-s`, `rust-woman-ride-wagon-n`, `indigo-ride-wagon-e`, `indigo-ride-wagon-s`, `indigo-ride-wagon-n`, `ochre-ride-wagon-e`, `ochre-ride-wagon-s`, `ochre-ride-wagon-n`, `blue-girl-ride-wagon-e`, `blue-girl-ride-wagon-s`, `blue-girl-ride-wagon-n`, `girl-ride-wagon-e`, `girl-ride-wagon-s`, `girl-ride-wagon-n`, `boy-ride-wagon-e`, `boy-ride-wagon-s`, `boy-ride-wagon-n`, `smallchild-ride-wagon-e`, `smallchild-ride-wagon-s`, `smallchild-ride-wagon-n`, `cart-travel-e`, `cart-travel-s`, `cart-travel-n`, `cart-travel-loaded-e`, `cart-travel-loaded-s`, `cart-travel-loaded-n`, `cart-idle-e`, `cart-idle-s`, `cart-idle-n`, `cart-idle-loaded-e`, `cart-idle-loaded-s`, `cart-idle-loaded-n`, `wagon-ox-open-e`, `wagon-ox-open-s`, `wagon-ox-open-n`).
- [ ] **D6** · priority 2 · `tejano-rider-ride-e`, `-n`, `-s` (4): a Tejano horseman in a short jacket and wide hat with a lance or escopeta. *4 frames a heading*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 3. **Stands in now:** the cast's riders (Astra's library art reused). **Plugs into:** `bx-tejano-*` in `sim/town-scenes.mjs`. **Research:** Tejano horsemen of Béxar, 1836 (Seguín's company); dress is an interpretation. **Claude stand-in in place** (`tejano-rider-ride-e`, `tejano-rider-ride-s`, `tejano-rider-ride-n`); Astra's replaces it.
- [ ] **D7** · priority 2 · `volunteer-mounted` walk (east, north, south, 4) and trot and idle, a rifle, and `volunteer-mounted-fire` (2); the same rider serves `volunteer-ride-e`/`-s`/`-n` for the south's fights and the Gonzales men riding into the Alamo. *4 frames a heading, 2 firing*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-09-25 — San Jacinto](#request-2026-09-25--san-jacinto), item 3. **Stands in now:** the mounted courier (`mounted-courier-e`, `-listen`) (Astra's library art reused). **Plugs into:** `figureOf`, the rider branch of `draw` and `memberPose` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (volunteer), so the page draws hers (`volunteer-mounted-walk-e`, `volunteer-mounted-walk-s`, `volunteer-mounted-walk-n`, `volunteer-mounted`, `volunteer-mounted-trot`, `volunteer-mounted-idle`, `volunteer-mounted-fire`, `volunteer-ride-e`, `volunteer-ride-s`, `volunteer-ride-n`).
- [ ] **D8** · priority 2 · `lancer-march`, `lancer-idle` (lance up, both facings); `lancer-charge` is Astra's, 2026-10-03. *4 marching, 1 idle, 4 charging*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 7. **Stands in now:** `dragoon-march-*` with no lance (Astra's library art reused). **Plugs into:** `draw` in `public/battle-view.js`.
- [ ] **D9** · priority 2 · `forager-ride-1`..`-4` (two or three horsemen, one leading a pack mule of corn sacks) and `forager-drive-1`..`-4` (two horsemen driving three or four cattle). *4 frames each, east*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-09-26 — the Mexican advance](#request-2026-09-26--the-mexican-advance), item 1. **Stands in now:** three `dragoon-march` riders (Astra's library art reused). **Plugs into:** the parties in `drawWorld`, `public/app.js`. **Claude stand-in held back: Astra has drawn the subject** (dragoon), so the page draws hers (`forager-ride`, `forager-drive`).
- [ ] **D17** · priority 2 · for the ten family figures (`<family>`: `father-hat`, `father-beard`, `father-moustache`, `father-straw`, `mother-braid`, `mother-loose`, `mother-scarf`, `mother-straw`, `youth-boy`, `youth-girl`): her own painted horse-and-rider `<family>-ride-e`, `-ride-n`, `-ride-s` (as the eight of 2026-09-21) and `<family>-wagon-driver-e`, `-n`, `-s`, `-w`. *as the eight identities' riding and driving sheets*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-10-03 — the family figures' missing poses](#request-2026-10-03--the-family-figures-missing-poses), item 6. **Stands in now:** the composite seat: the old cast's rider or driver (`seatedClip` in `public/motion.js`) (Astra's library art reused). **Plugs into:** `RIDING_FIGURES` and the drivers in `public/motion.js`.
- [ ] **D18** · priority 2 · the family's mule: `mule-idle` (standing on its halter, east), `mule-walk-e`, `-s`, `-n` (on a rope halter, led, 4 each), `mule-saddled-walk-e`, `-s`, `-n` (bridled and saddled, 4 each) and `mule-packed-walk-e`, `-s`, `-n` (the family's sacks and tools on a pack saddle, 4 each). *1-2 standing; 4 frames a heading*. The scale of `horse-walk` (1.5 of a person), ground anchor. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 1. **Stands in now:** Claude's `mule-walk-*`, `mule-idle`, `mule-saddled-walk-*`; while they load, the chestnut horse drawn a little smaller (Claude-drawn). **Plugs into:** `miniAnimal` in `public/app.js`; the animal branch of `entityClip` in `public/motion.js`. **Claude stand-in in place** (`mule-idle`, `mule-walk`, `mule-walk-e`, `mule-walk-s`, `mule-walk-n`, `mule-saddled-walk`, `mule-saddled-walk-e`, `mule-saddled-walk-s`, `mule-saddled-walk-n`); Astra's replaces it.
- [ ] **D19** · priority 2 · the family figures and the children on the mule, the whole rider and the whole mule in one frame: `<family>-mule-ride-e`, `-s`, `-n` and `<child>-mule-ride-e`, `-s`, `-n`. *4 frames a heading*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 2. **Stands in now:** their own figure cut at the waist over Claude's saddled mule (`drawSeated`, `onMule`) (Astra's library art reused). **Plugs into:** `seatedClip` in `public/motion.js`; `drawSeated` in `public/app.js`.
- [ ] **D21** · priority 2 · the family figures seated in the bed of a wagon, cart or carreta: `<family>-ride-wagon-e`, `-s`, `-n`, anchored at the hip as D5's riders. *east, south, north*. As D5: the scale of `wagon-covered`, anchored at the hip. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 4. **Stands in now:** their figure cut at the waist in the bed (Astra's library art reused). **Plugs into:** `passengerClip` and `bedLayout` in `public/motion.js`.
- [ ] **D26** · priority 2 · the family's mule in harness, without the vehicle: `mule-harness-walk-e`, `-s`, `-n` (one mule, collar or breast strap, traces, bridle, 4 each) and `mule-pair-harness-walk-e`, `-s`, `-n` (two side by side, 4 each). *4 frames a heading*. The scale of `horse-walk` (1.5 of a person), ground anchor. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 9. **Stands in now:** Claude's `mule-walk-*` on its halter where the ox would stand; a pair's second walking alongside (Claude-drawn). **Plugs into:** `miniAnimal` (the `ox` part of `seatLayout('wagon', ...)`) in `public/app.js`.
- [ ] **D30** · priority 2 · for each of the eight cast figures and `boy`, `girl`: `-ride-herd` (on the family's horse at a walk, a coiled rope in hand, turning a cow, 4, east, and `-idle`). *4 frames, east, and 2 idle*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-10-03 — the herd and the herder](#request-2026-10-03--the-herd-and-the-herder), item 5. **Stands in now:** the family's horse grazing beside the herder, who is drawn on foot at the search stroke (Astra's library art reused). **Plugs into:** `drawHerd` (`chore.mounted`) and `rangeHorses` in `public/app.js`.
- [ ] **D10** · priority 3 · `dragoon-wounded-led-1`..`-2` (a man slumped in the saddle, another leading the horse). *2 frames, east*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-09-25 — battles: the pieces the engine stands in for](#request-2026-09-25--battles-the-pieces-the-engine-stands-in-for), item 3. **Stands in now:** a dragoon hit in the saddle drawn dismounted (Astra's library art reused). **Plugs into:** `drawFallen` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (dragoon), so the page draws hers (`dragoon-wounded-led`).
- [ ] **D11** · priority 3 · `herd-drove` (several hundred horses moving as one mass, 4) and `herd-scatter`. *4 and 2-4*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside (mustangs' scale). [Request 2026-09-25 — the south's fights: San Patricio by night and Agua Dulce Creek](#request-2026-09-25--the-souths-fights-san-patricio-by-night-and-agua-dulce-creek), item 4. **Stands in now:** `mustang-gallop`, `mustang-graze` up to twenty-four times (Astra's library art reused). **Plugs into:** `drawHerd` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (horses), so the page draws hers (`herd-drove`, `herd-scatter`).
- [ ] **D12** · priority 3 · `limber-mules-walk` (mules at a gun or caisson, men riding them off). *4 frames a heading*. The scale of `horse-walk`. [Request 2026-09-25 — Concepción and the Grass Fight](#request-2026-09-25--concepción-and-the-grass-fight), items 6 and 8. **Stands in now:** `horse-walk`/`horse-graze` with `packed-belongings` on its back (Astra's library art reused). **Plugs into:** the `packhorse` figure in `draw`, `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (limber), so the page draws hers (`limber-mules-walk`).
- [ ] **D13** · priority 3 · full mounted movement for Seguín (`seguin-ride-*`); Dr. John Sutherland mounted (`sutherland-ride-*`, request 2026-09-26 the bell at Béxar, item 3). *4 frames a heading*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-09-26 — the famous people: the roster's remaining figures and poses](#request-2026-09-26--the-famous-people-the-rosters-remaining-figures-and-poses), mounted. **Stands in now:** Seguín's two mounted key poses; the roster's `rider` (Astra's library art reused). **Plugs into:** `PERSON_ART`; `sutherland` in `sim/people.mjs`. **Research:** original interpretations; no likeness. **Claude stand-in in place** (`sutherland-ride-e`, `sutherland-ride-s`, `sutherland-ride-n`); Astra's replaces it; **Claude stand-in held back: Astra has drawn the subject** (seguin), so the page draws hers (`seguin-ride-e`, `seguin-ride-s`, `seguin-ride-n`).
- [ ] **D14** · priority 3 · the covered wagon with one ox yoked to its tongue as one rolling rig, `wagon-ox-e`/`-n`/`-s`, 4 frames each, loaded and empty covers. *4 frames a heading*. The scale of `wagon-covered` and `ox-walk`. [Request 2026-09-16 — driving the ox wagon](#request-2026-09-16--driving-the-ox-wagon), item 1. **Stands in now:** the ox and the side-view wagon drawn apart; north and south the wagon stays side-on (Astra's library art reused). **Plugs into:** `seatLayout('wagon', direction, ..., rig)`, `WAGON_RIG` and `wagonRigClip` in `public/motion.js`; `drawSeated` in `public/app.js`. **Claude stand-in held back: Astra has drawn the subject** (wagon), so the page draws hers (`wagon-ox-e`, `wagon-ox-s`, `wagon-ox-n`, `wagon-ox-loaded-e`, `wagon-ox-loaded-s`, `wagon-ox-loaded-n`, `wagon-ox-empty-e`, `wagon-ox-empty-s`, `wagon-ox-empty-n`, `wagon-ox-open-e`, `wagon-ox-open-s`, `wagon-ox-open-n`).
- [ ] **D15** · priority 3 · a loaded carreta travel presentation (`carreta-loaded-travel-*`). *4 frames a heading*. The delivered `carreta-*` scale. [Request 2026-09-25 — the carreta](#request-2026-09-25--the-carreta), loaded. **Stands in now:** the uncovered body cycle, laden or not (Astra's library art reused). **Plugs into:** `miniWagon` in `public/app.js`. **Claude stand-in held back: Astra has drawn the subject** (carreta), so the page draws hers (`carreta-loaded-travel-e`, `carreta-loaded-travel-s`, `carreta-loaded-travel-n`).
- [ ] **D20** · priority 3 · the old cast on the mule: `<cast>-mule-ride-e`, `-s`, `-n`, as D19. *4 frames a heading*. Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 3. **Stands in now:** their own figure cut at the waist over Claude's saddled mule (Astra's library art reused). **Plugs into:** `seatedClip` in `public/motion.js`; `drawSeated` in `public/app.js`.
- [ ] **D22** · priority 3 · `infant-held-ride` (a swaddled baby in the crook of an arm, 1-2 frames, east and `-s`): a layer laid at a rider's chest on the horse, the mule or the wagon's box. *1-2, east and south*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 5. **Stands in now:** not drawn: the baby with its carrier in the saddle is drawn with nobody (`carriedWithRider`) (nothing). **Plugs into:** `carriedWithRider` in `public/motion.js`; `drawSeated` in `public/app.js`.
- [ ] **D23** · priority 3 · the driver walking at the oxen's head with a long goad: `<family>-goad-walk-e`, `-s`, `-n` and `<cast>-goad-walk-*`, 4 frames each. *4 frames a heading*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 6. **Stands in now:** the driver seated on the wagon's box or the carreta's frame (Astra's library art reused). **Plugs into:** `seatLayout` in `public/motion.js` (a carreta's driver on foot, a code choice).
- [ ] **D24** · priority 3 · `ferry-flatboat-crossing` (4 frames): the flatboat moving along its rope, the ferryman hauling at the upstream side, the deck clear and its deck line flat for the page to stand the family's own people, horse, mule or wagon on. *4*. As `ferry-flatboat`: its view, scale and waterline. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 7. **Stands in now:** nothing: a ferry is an hour's wait laid on the road (`FERRY_MINUTES`) and the boat stays at its landing (nothing). **Plugs into:** `drawFerry` in `public/landscape-art.js`, once a crossing is on the travel record.
- [ ] **D25** · priority 3 · `steamboat-laden-deck`: the laden underway loop (request 2026-09-18) with a clear stretch of main deck forward, its deck line marked, for a family's own man and his horse or mule among the painted army. *4, as `steamboat-laden`*. As `steamboat-laden`. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 8. **Stands in now:** `steamboat-laden` alone, nobody's own figure aboard (Astra's library art reused). **Plugs into:** the Yellow Stone in `drawWorld`, `public/app.js` (`yellowStone`).
- [ ] **D27** · priority 3 · the covered wagon behind a mule as one rig: `wagon-mule-e`, `-s`, `-n` (loaded and empty covers, 4 each, as `wagon-ox-*`) and `wagon-mules-*` with the pair. *4 frames a heading*. The scale of `wagon-covered` and `horse-walk`. [Request 2026-10-03 — riders in every vehicle](#request-2026-10-03--riders-in-every-vehicle), item 10. **Stands in now:** the mule and the side-view wagon drawn apart (`muleDrawn` in `drawSeated`) (Astra's library art reused). **Plugs into:** `wagonRigClip` and `WAGON_RIG` in `public/motion.js`.

### E — Buildings, houses, towns, Béxar, the Alamo, interiors (20)

- [ ] **E1** · priority 1 · Tejano townspeople of Béxar - a man, a woman in a rebozo, a girl and a boy - each `walk`, `idle-s`, `carry` (loading a cart), `speak`, `listen`, in 1830s Béxar dress (`bexar-man-*`, `bexar-woman-*`, `bexar-girl-*`, `bexar-boy-*`); also the storming's townspeople of 1835 walking out of a house (request 2026-09-25 the storming of Béxar, item 6). *the people-sheet poses*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372. [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 2. **Stands in now:** the colonists' cast figures (`ochre`, `teal`, `elder`, `indigo`, `blue`, `blue-girl`, `girl`, `boy`); `rust-woman`, `indigo`, `elder`, `smallchild` leaving a house (Astra's library art reused). **Plugs into:** `BEXAR_CAST` in `sim/town-scenes.mjs` (`figure`); `TOWNSFOLK` in `public/battle-view.js`. **Research:** Béxar dress, 1835-36: rebozo, short jacket, sombrero; original interpretations. **Claude stand-in in place** (`bexar-man-walk`, `bexar-man-walk-s`, `bexar-man-walk-n`, `bexar-man-idle-s`, `bexar-man-idle-e`, `bexar-man-idle-w`, `bexar-man-idle-n`, `bexar-man-listen-s`, `bexar-man-listen-n`, `bexar-man-speak`, `bexar-man-carry`, `bexar-woman-walk`, `bexar-woman-walk-s`, `bexar-woman-walk-n`, `bexar-woman-idle-s`, `bexar-woman-idle-e`, `bexar-woman-idle-w`, `bexar-woman-idle-n`, `bexar-woman-listen-s`, `bexar-woman-listen-n`, `bexar-woman-speak`, `bexar-woman-carry`, `bexar-girl-walk`, `bexar-girl-walk-s`, `bexar-girl-walk-n`, `bexar-girl-idle-s`, `bexar-girl-idle-e`, `bexar-girl-idle-w`, `bexar-girl-idle-n`, `bexar-girl-listen-s`, `bexar-girl-listen-n`, `bexar-girl-speak`, `bexar-girl-carry`, `bexar-boy-walk`, `bexar-boy-walk-s`, `bexar-boy-walk-n`, `bexar-boy-idle-s`, `bexar-boy-idle-e`, `bexar-boy-idle-w`, `bexar-boy-idle-n`, `bexar-boy-listen-s`, `bexar-boy-listen-n`, `bexar-boy-speak`, `bexar-boy-carry`); Astra's replaces it.
- [ ] **E17** · priority 1 · `farm-neighbour-porch` (a log cabin with a roofed porch, its door open, a bench and bucket, a rail fence, a chopping block) and `farm-neighbour-ramada` (a thatched jacal with a brush ramada, an olla hung from its beam, a picket corral). *1 each*. Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable; drawn beside the cast at their heights. [Request 2026-09-29 — the lone parent's wedding](#request-2026-09-29--the-lone-parents-wedding), item 3. **Stands in now:** Claude's `farm-neighbour-porch` and `farm-neighbour-ramada`, built on Astra's `cabin-wide` and `jacal-ramada` (Claude-drawn). **Plugs into:** `FARM_ART` in `public/courtship.js`. **Claude stand-in held back: Astra has drawn the subject** (cabin, jacal with a ramada), so the page draws hers (`farm-neighbour-porch`, `farm-neighbour-ramada`).
- [ ] **E2** · priority 2 · `house-round-back-sill`, `-back-low-walls`, `-back-full-walls` and the same for `hewn` (the pen from behind, no door in the gable toward the viewer); `house-passage-floor-end`, `house-passage-roof-end`, `house-porch-end`, `house-shed-room-end`. *1 each*. Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable. [Request 2026-09-23 — the house from its other sides](#request-2026-09-23--the-house-from-its-other-sides). **Stands in now:** the one front view, mirrored at a quarter turn; a chimney toward the viewer covers the door (Astra's library art reused). **Plugs into:** `drawHousePlot`, `drawLogPen` in `public/house-plot.js`. **Claude stand-in held back: Astra has drawn the subject** (house-round, house-hewn, house-porch, house-shed-room, house-passage-floor, house-passage-roof), so the page draws hers (`house-round-back-sill`, `house-round-back-low-walls`, `house-round-back-full-walls`, `house-hewn-back-sill`, `house-hewn-back-low-walls`, `house-hewn-back-full-walls`, `house-porch-end`, `house-shed-room-end`, `house-passage-floor-end`, `house-passage-roof-end`).
- [ ] **E3** · priority 2 · `house-roof-join`, `house-roof-join-partial`, `house-roof-join-chimney`, and the ridge line marked on the roof frames. *1 each*. Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable. [Request 2026-09-24 — one roof over a two-pen house](#request-2026-09-24--one-roof-over-a-two-pen-house). **Stands in now:** the pens' own roof laid over the passage (Astra's library art reused). **Plugs into:** `drawHousePlot` (`alongRidge`, `RIDGE`) in `public/house-plot.js`. **Claude stand-in held back: Astra has drawn the subject** (the passage roof), so the page draws hers (`house-roof-join`, `house-roof-join-partial`, `house-roof-join-chimney`).
- [ ] **E4** · priority 2 · jacal modules (post, wattle, thatch stages: `house-jacal-*`), `house-shed-frame`, `house-chimney-double` (two-sided, its foot marked), `house-floor` and `house-loft` overlays. *a frame a stage*. Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable. [Request 2026-09-15 — the house plot's pieces](#request-2026-09-15--the-house-plots-pieces), remaining pieces. **Stands in now:** whole jacal stage sprites; `lean-to`; the single stick chimney drawn double (Astra's library art reused). **Plugs into:** `drawHousePlot`, `standChimneys` in `public/house-plot.js`. **Claude stand-in held back: Astra has drawn the subject** (jacal, stick chimney, shed room, floor and loft), so the page draws hers (`house-jacal-posts`, `house-jacal-wattle`, `house-jacal-thatch`, `house-chimney-double`, `house-shed-frame`, `house-floor`, `house-loft`).
- [ ] **E5** · priority 2 · `interior-saddlebag` (two round-log pens wall to wall round one central stone chimney, a fireplace into each, no passage). *1*. The `home-interiors` style, camera and scale exactly as `interior-dog-run`. [Request 2026-09-12 (second) — settling in: houses, interiors, furnishings, and people whose looks can be chosen](#request-2026-09-12-second--settling-in-houses-interiors-furnishings-and-people-whose-looks-can-be-chosen), a saddlebag interior. **Stands in now:** the dog-run's picture, drawn wide (Astra's library art reused). **Plugs into:** `INTERIORS.saddlebag` in `sim/interior-data.mjs`, `public/interior.js`. **Claude stand-in held back: Astra has drawn the subject** (interior), so the page draws hers (`interior-saddlebag`).
- [ ] **E6** · priority 2 · `bexar-san-fernando-1836` and `bexar-governors-palace-1836`. *1 each*. Matched to `chapel`/`adobe-flat` scale and ground anchors, three-quarter. [Request 2026-09-14 — Béxar civic architecture](#request-2026-09-14--béxar-civic-architecture). **Stands in now:** the generic `chapel` and `adobe-flat` (Astra's library art reused). **Plugs into:** `public/bexar-layout.js`. **Research:** **needs research first**: the 1836 appearance of San Fernando and the Governor's Palace; reject later additions and preserve uncertainty. **Claude stand-in in place** (`bexar-san-fernando-1836`, `bexar-governors-palace-1836`); Astra's replaces it.
- [ ] **E7** · priority 2 · `house-loopholed` (a flat-roofed stone house, a parapet about four feet high, loopholes in its walls). *1*. As `stone-tile-house`. [Request 2026-09-25 — the storming of Béxar](#request-2026-09-25--the-storming-of-béxar), item 1. **Stands in now:** the town's own house with flashes at its wall (Astra's library art reused). **Plugs into:** `draw` (`cover: 'loophole'`) in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (the town's flat house), so the page draws hers (`house-loopholed`).
- [ ] **E8** · priority 2 · `dancers-couple` (4), `fiddler-play` (2), `lantern-post` (a lantern on a post, lit). *4, 2, 1*. People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372; the lantern as a prop. [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 4. **Stands in now:** the cast figures; `fire-flicker` drawn small for the lanterns (Astra's library art reused). **Plugs into:** `bx-dancer-*`, `bx-fiddler`, the `lights` prop in `public/town-scenes.js`. **Research:** the fandango in Béxar before February 23, 1836 (docs/battle-research/surprise-at-bexar.md §6). **Claude stand-in in place** (`dancers-couple`, `fiddler-play`, `lantern-post`); Astra's replaces it.
- [ ] **E9** · priority 2 · `sentry-bell-ring-1`..`-4` (a man on a flat church roof by a bell arch pulling the rope, then pointing west) and `townsfolk-leave-1`..`-4` (a Tejano family, a man leading a laden carreta, a woman with a child). *4 each, east*. Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure. [Request 2026-09-26 — the bell at Béxar](#request-2026-09-26--the-bell-at-béxar), items 1-2. **Stands in now:** one standing volunteer at the church; the engine's civilian figures (Astra's library art reused). **Plugs into:** the `sentry` and `townsfolk` groups of `arrival` in `sim/battles/alamo.mjs`. **Claude stand-in in place** (`townsfolk-leave`); Astra's replaces it; **Claude stand-in held back: Astra has drawn the subject** (volunteer), so the page draws hers (`sentry-bell-ring`).
- [ ] **E18** · priority 2 · `wedding-table` (planks on two trestles with the neighbours' dishes: cornbread, a ham, an iron pot, a coffee pot, tin cups). *1*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside. [Request 2026-09-29 — the lone parent's wedding](#request-2026-09-29--the-lone-parents-wedding), item 4. **Stands in now:** Claude's `wedding-table` (Claude-drawn). **Plugs into:** the wedding scene in `public/courtship.js`. **Claude stand-in held back: Astra has drawn the subject** (table), so the page draws hers (`wedding-table`).
- [ ] **E19** · priority 2 · `courtship-yard-morning`, `courtship-yard-noon`, `courtship-yard-evening` (a farm yard with trees behind and sky above, no people, no buildings). *1 each*. 960×540, a whole painting the page draws to cover the scene, anchored at its foot. [Request 2026-09-29 — the lone parent's wedding](#request-2026-09-29--the-lone-parents-wedding), item 5. **Stands in now:** Claude's three yards; without them the sky and ground painted in canvas (Claude-drawn). **Plugs into:** `BACKDROP` in `public/courtship.js`. **Claude stand-in in place** (`courtship-yard-morning`, `courtship-yard-noon`, `courtship-yard-evening`); Astra's replaces it.
- [ ] **E20** · priority 2 · `grave-marker` (a plain rounded-top wooden board about four feet high at the head of a low mound, wildflowers, no text, no symbol) and `coins-and-paper` (a short stack of silver coins and two loose, a folded bill of sale, a small leather purse, lying on a table top). *1 each*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside; a grown person's height as its logical height, as the wedding's pieces. [Request 2026-09-29 — the homecoming's scenes](#request-2026-09-29--the-homecomings-scenes), items 1-2. **Stands in now:** Claude's `grave-marker` and `coins-and-paper`; without them drawn in canvas (`marker`, `coins`) (Claude-drawn). **Plugs into:** `marker` and `coins` in `drawYard`, `public/flashback.js`. **Claude stand-in in place** (`grave-marker`, `coins-and-paper`); Astra's replaces it.
- [ ] **E30** · priority 2 · `homestead-tent` (a wagon sheet stretched over a ridge pole between two forked posts, pegged down at the sides, the front open, a bedroll inside). *1*. Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable. [Request 2026-10-02 — the tent, and going in out of the weather](#request-2026-10-02--the-tent-and-going-in-out-of-the-weather), item 1. **Stands in now:** the library's canvas `tent` (a pegged A-tent of new canvas) (Astra's library art reused). **Plugs into:** the tent drawn at `world.land.tent` (`tentAt`) in `drawWorld`, `public/app.js`.
- [ ] **E10** · priority 3 · `plantation-sugar`, `blockhouse-village`, `townsite-bay`, `tavern-house`. *1 each*. Map cutout as `public/place-art.js` gives the places past the box. [Request 2026-09-26 — the Mexican advance](#request-2026-09-26--the-mexican-advance), item 4. **Stands in now:** the places named on the map and nothing more (told in words, not drawn). **Plugs into:** `public/place-art.js`. **Research:** Stafford's, the Old Fort, New Washington and Mrs. Powell's (docs/MAP_ACCURACY.md §14). **Claude stand-in in place** (`plantation-sugar`, `blockhouse-village`, `townsite-bay`, `tavern-house`); Astra's replaces it.
- [ ] **E11** · priority 3 · `mission-concepcion` (the church with twin towers and a dome, seen from about 500 yards). *1*. Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable. [Request 2026-09-25 — Concepción and the Grass Fight](#request-2026-09-25--concepción-and-the-grass-fight), item 4. **Stands in now:** `church-generic` (Astra's library art reused). **Plugs into:** `concepcionScenery` in `sim/battles/concepcion.mjs`. **Research:** the mission as it stood in 1835. **Claude stand-in in place** (`mission-concepcion`); Astra's replaces it.
- [ ] **E12** · priority 3 · Fort Velasco (a circular log-and-sand fort, gapped and derelict: `fort-velasco`), the Harrisburg steam sawmill (`sawmill-steam`), the two-storey Stone House at Nacogdoches (`stone-house-nacogdoches`). *1 each*. The scale of `house-hewn-log` and `trading-house`, south-facing. [Request 2026-09-16 — the buildings the towns' research found](#request-2026-09-16--the-buildings-the-towns-research-found), items 8-10. **Stands in now:** `palisade` pieces in a ring; `timber-hall` and `storehouse`; `stone-tile-house` (Astra's library art reused). **Plugs into:** each building's `sprite` in `sim/town-layouts.mjs`. **Research:** docs/town-research/ for each. **Claude stand-in in place** (`fort-velasco`, `sawmill-steam`, `stone-house-nacogdoches`); Astra's replaces it.
- [ ] **E13** · priority 3 · a lit-window overlay for the houses Astra has not painted lit (`window-lit-*`; her `adobe-night-lit`, `jacal-night-lit` and `cabin-night-lit` replace `adobe-flat`, `house-jacal`, `jacal-poor` and `cabin-small` at night, 2026-10-03). *1 each*. Registered to the building it overlays. [Request 2026-09-25 — the south's fights: San Patricio by night and Agua Dulce Creek](#request-2026-09-25--the-souths-fights-san-patricio-by-night-and-agua-dulce-creek), item 2. **Stands in now:** a warm glow drawn on the canvas (drawn in code (canvas or CSS)). **Plugs into:** `drawScenery`, `glow` in `public/battle-view.js`. **Claude stand-in in place** (`window-lit-adobe-flat`, `window-lit-house-jacal`, `window-lit-jacal-poor`, `window-lit-cabin-small`); Astra's replaces it.
- [ ] **E14** · priority 3 · San Fernando's tower as the red flag's setting. *1*. Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable. [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 5. **Stands in now:** the flag at the town point (nothing). **Plugs into:** `drawFlag` in `public/battle-view.js`. **Research:** with E6. **Claude stand-in in place** (`san-fernando-tower-1836`); Astra's replaces it.
- [ ] **E15** · priority 3 · `home-hoe`, `home-felling-axe`, `home-broadaxe`, `home-froe`, `home-auger`. *1 each*. The `home-furnishings` style and scale, standing or leaning as in a cabin. [Request 2026-09-12 (second) — settling in: houses, interiors, furnishings, and people whose looks can be chosen](#request-2026-09-12-second--settling-in-houses-interiors-furnishings-and-people-whose-looks-can-be-chosen), the wagon's tools. **Stands in now:** Claude's `claude-home-tools.png` (Claude-drawn). **Plugs into:** `INTERIOR_ART` `tool:*` in `sim/interior-data.mjs`. **Claude stand-in in place** (`home-hoe`, `home-felling-axe`, `home-broadaxe`, `home-froe`, `home-auger`); Astra's replaces it.

### F — Terrain, trees, the norther, fields, icons, marks and effects (16)

- [ ] **F1** · priority 1 · `portrait-rust`, `-teal`, `-elder`, `-blue`, `-rust-woman`, `-indigo`, `-ochre`, `-blue-girl`, `-girl`, `-boy`, `-smallchild`, `-infant`. *12*. 192×192, head and shoulders facing the viewer, matching the sheet figure. [Request 2026-09-15 — face portraits for the family panel](#request-2026-09-15--face-portraits-for-the-family-panel). **Stands in now:** Claude's `claude-portraits.png`; without it, the idle clip cropped (Claude-drawn). **Plugs into:** `drawPortrait` in `public/family-panel.js`. **Claude stand-in in place** (`portrait-rust`, `portrait-teal`, `portrait-elder`, `portrait-blue`, `portrait-rust-woman`, `portrait-indigo`, `portrait-ochre`, `portrait-blue-girl`, `portrait-girl`, `portrait-boy`, `portrait-smallchild`, `portrait-infant`); Astra's replaces it.
- [ ] **F16** · priority 1 · `icon-ask-neighbours` (a parent and a child walking up a track toward a neighbour's cabin with smoke from its chimney). *1*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%. [Request 2026-09-29 — the lone parent's wedding](#request-2026-09-29--the-lone-parents-wedding), item 6. **Stands in now:** Claude's `icon-ask-neighbours`; without it a stroked glyph on the special button (Claude-drawn). **Plugs into:** the special button (`#ask-neighbours` in `public/app.js`). **Claude stand-in in place** (`icon-ask-neighbours`); Astra's replaces it.
- [ ] **F2** · priority 2 · `mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`, `mark-auto-on`. *6*. Mark: 96×96, transparent, no text, reads at 22–24 CSS px. [Request 2026-09-16 — the family panel's marks](#request-2026-09-16--the-family-panels-marks). **Stands in now:** Claude's `claude-marks.png` (Claude-drawn). **Plugs into:** `panelMark`/`paintMark` in `public/app.js`, `drawMark` in `public/family-panel.js`. **Claude stand-in in place** (`mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`, `mark-auto-on`); Astra's replaces it.
- [ ] **F3** · priority 2 · `fx-wood-chips`, `fx-earth-toss`, `fx-dust`, `fx-shavings`, `fx-ripple` (3 frames each, played from the strike) and `tree-fall` (4 frames: a hardwood leaning, going over, down, a bounce). *3 each; 4*. Effect: 3 frames on the ground anchor of the work, one played from the strike. [Request 2026-09-28 — people at work](#request-2026-09-28--people-at-work), item 15. **Stands in now:** a handful of canvas rectangles and arcs (`EFFECTS` in `public/work-art.js`) (drawn in code (canvas or CSS)). **Plugs into:** `EFFECTS` and `drawWorkLayer` in `public/work-art.js`. **Claude stand-in in place** (`tree-fall`, `fx-wood-chips`, `fx-earth-toss`, `fx-dust`, `fx-shavings`, `fx-ripple`); Astra's replaces it.
- [ ] **F4** · priority 2 · `farm-smoke-rise` (6-8 frames, a tall dark column leaning with the wind over a low orange glow) and `town-smoke-rise` (broader). *6-8 frames, looping*. Readable at 30-160 px, anchored at the foot of the column. [Request 2026-09-26 — the Mexican advance](#request-2026-09-26--the-mexican-advance), item 2. **Stands in now:** the library's `smoke-rise` drawn three to four figures tall; a painted grey plume (Astra's library art reused). **Plugs into:** the `fires` in `drawWorld`, `public/app.js` (`window.__firesDrawn`). **Claude stand-in held back: Astra has drawn the subject** (smoke), so the page draws hers (`farm-smoke-rise`, `town-smoke-rise`).
- [ ] **F17** · priority 2 · `hunt-field-timber`, `hunt-field-brush`, `hunt-field-open` (each in summer and `-winter`; the far ground and the cover, eye height, no animal) and `hunt-rifle` (the long rifle seen over the hunter's shoulder, stock and lock low at the right, the muzzle and front sight free to be turned toward the aim). *6 backdrops; 1 rifle*. Backdrop: 1600×900, opaque, the horizon at 51% of the height, the middle third clear of trunks; rifle: transparent, pivot at the muzzle. [Request 2026-10-02 — the hunter's first-person field](#request-2026-10-02--the-hunters-first-person-field), items 1 and 2. **Stands in now:** the field and the rifle painted in canvas (sky, crowns, trunks, brush and grass; a browned barrel and a cherry stock) (drawn in code (canvas or CSS)). **Plugs into:** `paintField`, `paintNear` and `drawRifle` in `public/hunt-aim.js`.
- [ ] **F30** · priority 2 · `icon-pitch-tent` (a wagon sheet tent going up: a person pegging down one side). *1*. Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%. [Request 2026-10-02 — the tent, and going in out of the weather](#request-2026-10-02--the-tent-and-going-in-out-of-the-weather), item 2. **Stands in now:** a stroked tent (`LITTLE_GLYPHS['pitch-tent']`) (drawn in code (canvas or CSS)). **Plugs into:** `PANEL_ICONS['pitch-tent']` in `public/family-panel.js`.
- [ ] **F32** · priority 2 · `cattle-longhorn-<coat>-walk` for `red`, `pied`, `dun` (a range longhorn walking, 4, east, `-n`, `-s`), `calf-graze`, `calf-walk` (a longhorn calf, 2 and 4) and `piglet-root`, `piglet-walk` (a sucking pig, 2 and 4). *4 walking, 2 grazing or rooting, east (mirrored west)*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside (the longhorn's `cattle-longhorn-*` height; a calf and a pig about three fifths of it). [Request 2026-10-03 — the herd and the herder](#request-2026-10-03--the-herd-and-the-herder), items 1 and 2. **Stands in now:** Astra's farmyard `cow-walk` for a longhorn walking; the longhorn and the rooting hog drawn at three fifths for the young (Astra's library art reused). **Plugs into:** `herdFigures` in `public/herd-view.js`, drawn by `drawHerd` in `public/app.js`.
- [ ] **F5** · priority 3 · a gale silhouette for each remaining tree kind and ground mark - pine, cedar, mesquite, live oak, elm, scrub, reeds, prickly pear, and every sized tree of `trees-colonies-1` and `-2` (`<tree>-wind`). *1 each*. Exactly the scale and anchor of the upright sprite. [Request 2026-09-20 — the country in a norther: trees and grass bent by the wind](#request-2026-09-20--the-country-in-a-norther-trees-and-grass-bent-by-the-wind), remaining trees. **Stands in now:** the upright sprite sheared about its foot (Astra's library art reused). **Plugs into:** `GALE_POSES` and `windLean` in `public/weather-art.js`. **Claude stand-in held back: Astra has drawn the subject** (pine-loblolly-pole, cedar-pole, mesquite-pole, live-oak-pole, elm-pole, post-oak-pole, blackjack-pole, pecan-pole, hackberry-pole, sweetgum-pole, pine-loblolly-log, cedar-log, mesquite-log, live-oak-log, elm-log, post-oak-log, blackjack-log, pecan-log, hackberry-log, sweetgum-log, pine-loblolly-large, cedar-large, mesquite-large, live-oak-large, elm-large, post-oak-large, blackjack-large, pecan-large, hackberry-large, sweetgum-large, pine-longleaf-pole, pine-longleaf-log, pine-longleaf-large, palm-sabal-pole, palm-sabal-log, palm-sabal-large, cypress-bald-pole, cypress-bald-log, cypress-bald-large, magnolia-log, magnolia-large, beech-log, beech-large, cottonwood, scrub, reeds, prickly-pear, marsh-cordgrass, dune-grass, thicket-thorn-1, thicket-thorn-2, palmetto, yucca), so the page draws hers (`pine-loblolly-pole-wind`, `cedar-pole-wind`, `mesquite-pole-wind`, `live-oak-pole-wind`, `elm-pole-wind`, `post-oak-pole-wind`, `blackjack-pole-wind`, `pecan-pole-wind`, `hackberry-pole-wind`, `sweetgum-pole-wind`, `pine-loblolly-log-wind`, `cedar-log-wind`, `mesquite-log-wind`, `live-oak-log-wind`, `elm-log-wind`, `post-oak-log-wind`, `blackjack-log-wind`, `pecan-log-wind`, `hackberry-log-wind`, `sweetgum-log-wind`, `pine-loblolly-large-wind`, `cedar-large-wind`, `mesquite-large-wind`, `live-oak-large-wind`, `elm-large-wind`, `post-oak-large-wind`, `blackjack-large-wind`, `pecan-large-wind`, `hackberry-large-wind`, `sweetgum-large-wind`, `pine-longleaf-pole-wind`, `pine-longleaf-log-wind`, `pine-longleaf-large-wind`, `palm-sabal-pole-wind`, `palm-sabal-log-wind`, `palm-sabal-large-wind`, `cypress-bald-pole-wind`, `cypress-bald-log-wind`, `cypress-bald-large-wind`, `magnolia-log-wind`, `magnolia-large-wind`, `beech-log-wind`, `beech-large-wind`, `cottonwood-wind`, `scrub-wind`, `reeds-wind`, `prickly-pear-wind`, `marsh-cordgrass-wind`, `dune-grass-wind`, `thicket-thorn-1-wind`, `thicket-thorn-2-wind`, `palmetto-wind`, `yucca-wind`).
- [ ] **F6** · priority 3 · anacua, Texas ebony, tupelo, cedar elm, willow, shortleaf pine at `-pole`/`-log`/`-large`, and hardwood stumps (hickory, walnut, ash, the oaks). *3 sizes each*. The style and scale of `pine-loblolly-*` and `live-oak-*`. [Request 2026-09-19 — the country of 1836: trees and ground cover](#request-2026-09-19--the-country-of-1836-trees-and-ground-cover), remaining species. **Stands in now:** `oak-spreading`, `elm`, `cottonwood`; the loblolly for shortleaf; the post-oak or cottonwood stump (Astra's library art reused). **Plugs into:** `KINDS` in `sim/woods.mjs`, `drawGroundDetail` in `public/app.js`. **Research:** which trees grew where in 1836 (docs/BIOMES.md). **Claude stand-in in place** (`anacua-pole`, `anacua-log`, `anacua-large`, `ebony-pole`, `ebony-log`, `ebony-large`, `tupelo-pole`, `tupelo-log`, `tupelo-large`, `willow-pole`, `willow-log`, `willow-large`); Astra's replaces it; **Claude stand-in held back: Astra has drawn the subject** (elm, pine, stump), so the page draws hers (`cedar-elm-pole`, `cedar-elm-log`, `cedar-elm-large`, `pine-shortleaf-pole`, `pine-shortleaf-log`, `pine-shortleaf-large`, `stump-hickory`, `stump-walnut`, `stump-ash`, `stump-oak`, `stump-oak-live`).
- [ ] **F7** · priority 3 · a night grade and a dawn grade for ground and figures (the Alamo assault), a moonlit night for Béxar's storming, and a moonless rain night for San Patricio under which lit windows and fires read (`night-grade`, `dawn-grade`, `moonlight-grade`). *grades*. A full-view light layer the renderer lays over the ground and figures (not a sprite); must not snap when the pace changes. [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 4. **Stands in now:** a dark blue wash by the phase's `light`; no night at Béxar (drawn in code (canvas or CSS)). **Plugs into:** `draw` and `drawNight` in `public/battle-view.js`. **Research:** sunrise 6:20 on March 6, 1836 (computed). **Claude stand-in in place** (`night-grade`, `moonlight-grade`, `dawn-grade`); Astra's replaces it.
- [ ] **F8** · priority 3 · `riverbank-cut-e`/`-w` (a bank face with steps), `river-bend`, `creek-bed-dry`, `creek-ford`. *1 each (fog 2-4 drifting)*. Ground piece: seen from above at the map's scale, transparent, tiles or scatters. [Request 2026-09-25 — Concepción and the Grass Fight](#request-2026-09-25--concepción-and-the-grass-fight), items 1, 3, 7. **Stands in now:** `earth-rampart` along the bank with trees and a drawn ribbon of water; a pale radial veil for fog (Astra's library art reused). **Plugs into:** `concepcionScenery`, `grassScenery`, `drawFog` in `public/battle-view.js`. **Claude stand-in in place** (`riverbank-cut-e`, `riverbank-cut-w`, `river-bend`, `creek-bed-dry`, `creek-ford`); Astra's replaces it.
- [ ] **F9** · priority 3 · `marsh-edge` (tiles of cordgrass and open water, to scatter). *a few tiles*. Ground piece: seen from above at the map's scale, transparent, tiles or scatters. [Request 2026-09-25 — San Jacinto](#request-2026-09-25--san-jacinto), item 4. **Stands in now:** the library's cordgrass, reeds and water ripples scattered (Astra's library art reused). **Plugs into:** `drawWorks` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (marsh), so the page draws hers (`marsh-edge-1`, `marsh-edge-2`, `marsh-edge-3`).
- [ ] **F10** · priority 3 · a live-oak mott as one sprite with shade under it (`live-oak-mott`) wherever a grove stands (Astra's `live-oak-mott-*-wind` draws the Agua Dulce groves, and her `campfire-night` the fire at night, 2026-10-03). *2-4; 1*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside. [Request 2026-09-25 — the south's fights: San Patricio by night and Agua Dulce Creek](#request-2026-09-25--the-souths-fights-san-patricio-by-night-and-agua-dulce-creek), items 2 and 5. **Stands in now:** a warm glow in canvas; `live-oak-large` and `mesquite-large` set close (Astra's library art reused). **Plugs into:** `drawScenery` in `public/battle-view.js`. **Claude stand-in held back: Astra has drawn the subject** (live-oak), so the page draws hers (`live-oak-mott`).
- [ ] **F31** · priority 3 · `mark-shelter-house` (a cabin's roof with rain slanting past it) and `mark-shelter-tent` (the wagon sheet tent with rain slanting past it). *2*. Mark: 96×96, transparent, no text, reads at 22–24 CSS px. [Request 2026-10-02 — the tent, and going in out of the weather](#request-2026-10-02--the-tent-and-going-in-out-of-the-weather), item 3. **Stands in now:** a roof and a tent drawn in the style sheet as masks (drawn in code (canvas or CSS)). **Plugs into:** `.panel-shelter-mark` (`data-at`) in `public/style.css`, made in `panelRow`, `public/app.js`.
- [ ] **F33** · priority 3 · `herd-cattle-group`, `herd-hogs-group` (a knot of six to eight head grazing as one sprite, 2 frames) and `mark-herd` (a longhorn's head in the panel's mark style). *2 each; 1*. Prop: transparent, anchored at its base, at the scale of the sprites it stands beside; Mark: 96×96, transparent, no text, reads at 22–24 CSS px. [Request 2026-10-03 — the herd and the herder](#request-2026-10-03--the-herd-and-the-herder), items 3 and 4. **Stands in now:** one longhorn or hog with its count beside it for a group; a horned head drawn in the style sheet as a mask for the mark (drawn in code (canvas or CSS)). **Plugs into:** `drawHerd` in `public/app.js`; `.panel-herd-mark` in `public/style.css`, made in `panelRow`.

### Nothing to make: delivered, withdrawn or on hold

- ~~B12~~ [Request 2026-09-12 — families that look like who they are, and a rider who gets down](#request-2026-09-12--families-that-look-like-who-they-are-and-a-rider-who-gets-down), priority 1 - skipped: covered by B1, B6, B7 and B8; the scaling rule stays.
- ~~BS1~~ [Request 2026-09-21 — the children's icons](#request-2026-09-21--the-childrens-icons) - skipped: delivered 2026-09-22 (`icons-children.png`).
- ~~C7~~ [Request 2026-09-25 — Coleto and Goliad](#request-2026-09-25--coleto-and-goliad), item 1 - skipped: delivered 2026-10-03 (Astra's prone marksman, `regular-prone-lie` and `regular-prone-fire-reload`); Claude's deleted.
- ~~C12~~ [Request 2026-09-25 — battles: the pieces the engine stands in for](#request-2026-09-25--battles-the-pieces-the-engine-stands-in-for), item 4 - skipped: delivered 2026-10-03 (Astra's civilian cannon crew, survivor-travel-gonzales-crew-2026-10-03); Claude's settlers deleted.
- ~~C13~~ [Request 2026-09-26 — the famous people: the roster's remaining figures and poses](#request-2026-09-26--the-famous-people-the-rosters-remaining-figures-and-poses), items 1 and 3 - skipped: delivered 2026-10-03 (Astra's Kimbell, Martin, J. W. Smith, Horton, W. P. Smith, Smither, Sánchez Navarro, Barragán); Claude's sheets deleted.
- ~~CS2~~ [Request 2026-09-27 — Seguín, the ashes, and the later church claim](#request-2026-09-27--seguín-the-ashes-and-the-later-church-claim) - skipped: art and storyboard delivered; the trigger is code.
- ~~D16~~ [Request 2026-09-12 — families that look like who they are, and a rider who gets down](#request-2026-09-12--families-that-look-like-who-they-are-and-a-rider-who-gets-down), priority 3 - skipped: delivered 2026-09-14; the remaining work is code, not art.
- ~~DS3~~ [Request 2026-09-19 — the ferry flatboat](#request-2026-09-19--the-ferry-flatboat) - skipped: delivered 2026-09-21 (`ferry-flatboat.png`).
- ~~DS4~~ [Request 2026-09-18 — the steamboat Yellow Stone](#request-2026-09-18--the-steamboat-yellow-stone) - skipped: delivered 2026-09-21.
- ~~DS5~~ [Request 2026-09-13 — stock and the grant](#request-2026-09-13--stock-and-the-grant) - skipped: delivered 2026-09-14 (`animal-stock`).
- ~~E16~~ [Request 2026-09-16 — the shops of the towns](#request-2026-09-16--the-shops-of-the-towns) - skipped: delivered 2026-09-26 (the `stand-in:` comment in sim/shops.mjs is stale).
- ~~ES6~~ [Request 2026-09-19 — the places past the box](#request-2026-09-19--the-places-past-the-box) - skipped: delivered 2026-09-26.
- ~~ES7~~ [Request 2026-09-18 — the Alamo's faces seen from the south](#request-2026-09-18--the-alamos-faces-seen-from-the-south) - skipped: delivered 2026-09-21.
- ~~F11~~ [Request 2026-09-19 — the country of 1836: trees and ground cover](#request-2026-09-19--the-country-of-1836-trees-and-ground-cover), palm groves - skipped: delivered 2026-09-22 (the `stand-in:` comment in public/ground-classes.js is stale).
- ~~F12~~ [Request 2026-09-19 — the game of 1836](#request-2026-09-19--the-game-of-1836) - skipped: delivered 2026-09-21; the remaining work is code.
- ~~F13~~ [Request 2026-09-19 — Béxar's fields and acequias](#request-2026-09-19--béxars-fields-and-acequias) - skipped: delivered 2026-09-21; the layout is research and code.
- ~~F14~~ [Request 2026-09-21 — the guided start's marks](#request-2026-09-21--the-guided-starts-marks) - skipped: on hold 2026-09-28 - the tutorial is removed for now; do not draw until it returns.
- ~~F15~~ [Request 2026-09-28 — the garden — WITHDRAWN 2026-09-28](#request-2026-09-28--the-garden--withdrawn-2026-09-28) - skipped: withdrawn 2026-09-28 (crops no longer follow the seasons).
- ~~FS8~~ [Request 2026-09-20 — the launcher's remaining plates — Delivered 2026-09-20](#request-2026-09-20--the-launchers-remaining-plates--delivered-2026-09-20) - skipped: delivered 2026-09-20.
- ~~FS9~~ [Request 2026-09-19 — the logs fetched from the timber](#request-2026-09-19--the-logs-fetched-from-the-timber) - skipped: delivered (`icons-family-service.png`).
- ~~FS10~~ [Request 2026-09-19 — the traveller's marker — WITHDRAWN 2026-09-22](#request-2026-09-19--the-travellers-marker--withdrawn-2026-09-22) - skipped: withdrawn 2026-09-22: there is no marker any more.
- ~~FS11~~ [Request 2026-09-16 — the road's icons](#request-2026-09-16--the-roads-icons) - skipped: delivered (`icons-family-service.png`).
- ~~FS12~~ [Request 2026-09-16 — the camp's icons](#request-2026-09-16--the-camps-icons) - skipped: delivered (`icons-family-service.png`).
- ~~FS13~~ [Request 2026-09-16 — the winter's icons](#request-2026-09-16--the-winters-icons) - skipped: delivered (`icons-family-service.png`).
- ~~FS14~~ [Request 2026-09-15 — action icons for the family panel](#request-2026-09-15--action-icons-for-the-family-panel) - skipped: delivered 2026-09-21.
- ~~FS15~~ [Request 2026-09-20 — the gathering icons](#request-2026-09-20--the-gathering-icons) - skipped: delivered (existing `icons-family-subsistence.png` art wired 2026-09-26).
- ~~FS16~~ [Request 2026-09-20 — the stock icons](#request-2026-09-20--the-stock-icons) - skipped: delivered (existing `icons-family-subsistence.png` art wired 2026-09-26).
- ~~FS17~~ [Request 2026-09-14 — game](#request-2026-09-14--game) - skipped: delivered 2026-09-15 (`wildlife-deer`).
- ~~FS18~~ [Request 2026-09-14 — cleared ground](#request-2026-09-14--cleared-ground) - skipped: delivered 2026-09-14 (`land-clearing`).
- ~~FS19~~ [Request, 2026-09-21 — the Play Solo menu's trash can](#request-2026-09-21--the-play-solo-menus-trash-can) - skipped: delivered 2026-09-22.

<!-- astra-list:end -->

## Stand-ins in use

| Stand-in | Where | Standing in for | Replace with |
| --- | --- | --- | --- |
| **The family's mule** (bought at the stock pens, 2026-10-03) is Claude's brown mule on its halter (`mule-walk-*`, `mule-idle`) and saddled under a rider (`mule-saddled-walk-*`); while those sheets load, the family's chestnut horse drawn a little smaller. **Anybody riding the mule** is their own figure cut at the waist over the saddled mule - never the painted horse-and-rider, which would put them on the chestnut horse | `miniAnimal` and `drawSeated` (`onMule`, `mountOf`) in `public/app.js`; `entityClip` in `public/motion.js` | Request 2026-10-03 — riders in every vehicle, items 1 to 3 | `mule-idle`, `mule-walk-*`, `mule-saddled-walk-*`, `mule-packed-walk-*`; `<family>-mule-ride-*`, `<child>-mule-ride-*`, `<cast>-mule-ride-*` |
| **A mule in harness** (2026-10-03, the owner's "yes, but speed should adjust if it's too heavy") is Claude's mule on its halter (`mule-walk-*`) drawn where the ox would stand before the carreta, cart or wagon; the second of a pair walks alongside; a mule-drawn wagon is drawn apart, not as the ox rig | `miniAnimal` and `drawSeated` (`muleDrawn`) in `public/app.js`; `wagonTeams` in `public/motion.js` | Request 2026-10-03 — riders in every vehicle, items 9 and 10 | `mule-harness-walk-*`, `mule-pair-harness-walk-*`, `wagon-mule-*`, `wagon-mules-*` |
| **Cutting a path** and **fencing a yard** show the icons for cutting the lane (`icon-cut-lane`) and fencing a plot (`icon-fence-plot`); a **path** on the land is a stroked brown verge with a packed line down the middle, as the roads are drawn | `PANEL_ICONS['cut-path']`, `['fence-yard']` in `public/family-panel.js`; `drawLandPaths` in `public/app.js` | Request 2026-10-02 — paths and the yard, items 1 to 3 | `icon-cut-path`, `icon-fence-yard`, `ground-path-straight`, `ground-path-bend` |
| **The hunter's first-person field** - the sky, the far timber, brush or prairie, the trunks and grass nearest the hunter, and the long rifle over his shoulder - is painted in canvas; the animals in it are Astra's own wildlife clips | `paintField`, `paintNear`, `drawRifle` in `public/hunt-aim.js` | Request 2026-10-02 — the hunter's first-person field, items 1 and 2 | `hunt-field-timber`, `hunt-field-brush`, `hunt-field-open` (and `-winter`), `hunt-rifle` |
| **Milking the cow** is drawn as the cow on a rope (Claude's `icon-flee-cow`, or its stroked glyph); the person is drawn in the tending pose (`care`) | `PANEL_ICONS['milk-cow']`, `['milk-road']` in `public/family-panel.js`; `WORK['milk-cow']`, `['milk-road']` in `public/work-art.js` | Request 2026-10-02 — the milking icon and the milking pose, items 1 and 2 | `icon-milk-cow`, `<cast>-milk`, `<child>-milk` |
| **A small child carried on the road** is the child's own figure drawn at the carrier's hip, a little up and to the right, as a carried baby is | `roadCarrier`, `carriedAt` in `drawWorld`, `public/app.js` | Request 2026-10-02 — a grown person carrying a child of two to five on the road, item 1 | `<cast>-carry-child-walk` |
| **The hunger mark and the food gauge's sack** are a bowl and a sack drawn in the style sheet as masks, tinted by the stage | `.panel-hunger-mark`, `.food-icon` in `public/style.css` (made in `panelRow`, `paintLarder`, `public/app.js`) | Request 2026-09-30 — the hunger mark and the food gauge's sack, items 1 and 2 | `mark-hunger`, `mark-food` |
| **The people of the road east** - enslaved men, women and children beside a planter's halted wagons, and waiting at a crossing - are the cast (`ochre`, `rust-woman`, `elder`, `teal`, `boy`) recoloured by the palette in dark tones and homespun colours, resting or standing; no wagon is drawn | `GROUP` in `sim/start-story.mjs`; `crowdDrawables` in `public/ambient.js` | Request 2026-09-29 — the family's start, item 1 | `road-man`, `road-woman`, `road-elder`, `road-child`, `planter-wagon-halted` |
| **A Tejano family** is dressed as every family is, Astra's family figures recoloured by the palette to its chosen colours; a sombrero is her straw hat (`father-straw`, `mother-straw`) and a rebozo her headscarf (`mother-scarf`), where the parent chooses them (since 2026-10-02; the old cast's hats before) | `PARENT_VARIANTS` in `public/avatar-identity.js` | Request 2026-09-29 — the family's start, item 2 | `tejano-man`, `tejano-woman` |
| **A free Black family, and every darker tone** is the painted cast and her children dyed to the tone (light and shade kept); the hair is her painted hair's shape | `public/person-palette.js` | Request 2026-09-29 — the family's start, item 3 | `dark-man`, `dark-woman`, `dark-girl`, `dark-boy` |
| **The priest at a Tejano wedding** is the elder figure recoloured in dark clothes, reading from the paper the commissioner reads | `figureOf` in `public/courtship.js` | Request 2026-09-29 — the family's start, item 5 | `priest-read`, `priest-idle-s` |
| **The House icon on the bar** (the rooms of the house) shows the house the family raises, `icon-build-house` | `PANEL_ICONS` (`go-inside`) in `public/family-panel.js` | Request 2026-09-30 — the House icon on the bar | `icon-go-inside` |
| **Joining Seguín's company** shows the icon for joining Houston's army | `PANEL_ICONS` in `public/family-panel.js` | Request 2026-09-29 — the family's start, item 4 | `icon-join-seguin` |
| **The head of household counting at the table** is the cast's seated rest (`-rest`) drawn behind Astra's `home-table`, Claude's `coins-and-paper` on it | `drawYard` (`count`) in `public/flashback.js` | Request 2026-09-29 — the homecoming's scenes, item 3 | `<cast>-count` |
| **Remembering the family's dead**: the head kneeling at the marker is the nursing pose (`-care`); the rest stand with their backs to us in the listening pose (`-listen-n`), children in their own `-idle-n` | `drawYard` (`burial`) | Same request, item 4 | `<cast>-remember`, `<cast>-mourn` |
| **The land agent** is Astra's `elder` holding out a purse in his `-trade` pose; **raising the new house** is the carrying cycle (`-carry`) and the notching (`-repair`) beside her `house-*-site` and `-walls` | `drawYard` (`sale`, `rebuild`) | Same request, item 5 | `land-agent-idle`, `land-agent-trade`, `<cast>-raise-log` |
| **Felling** (and cutting the lane, clearing timber, the bee tree, fetching logs - folded into felling since 2026-09-28, begun by *Fell trees* where the land has no timber and drawn as felling - a carreta's wheels) is the cast's hoeing cycle (`-work`: raised, swing, down, back) with **a felling axe drawn over the hoe in the same hands, moving with each frame of the swing** (owner, 2026-09-28: "Add a drawn axe"; the hands measured for each cast figure and frame in `HAFTS`, drawn by `drawHaftTool` in `public/work-art.js`), and pale wood chips flying from the frame the blade lands; the one felling stands at the tree's west side facing it | `STROKES.chop` in `public/work-art.js`, drawn by `drawAtWork` in `public/app.js` | Request 2026-09-28 — people at work, items 1 and 15 | `-chop` for the eight cast figures; `fx-wood-chips` |
| **Splitting rails** is the same hoeing cycle with **a maul drawn over the hoe**, moving with the swing, and wood chips | `STROKES.split`, `drawHaftTool` in `public/work-art.js` | Same request, item 2 | `-split` |
| **Working on the house, or helping raise it** is the hoeing cycle with **a drawn felling axe** over the hoe and wood chips; several at it stand along the house's front, where the server puts them (`workSlot`, sim/house-placement.mjs `houseFront`), each facing it | `STROKES.notch` and `workSlot` in `public/work-art.js`; the offset in `drawEntity`, `public/app.js` | Same request, item 3 | `-notch`, `-lift` |
| **Digging the well, and grubbing out brush** is the hoeing cycle with dark clods of earth thrown up from the strike | `STROKES.dig`, `STROKES.grub` | Same request, items 4 and 15 | `-dig`, `-dig-well`; `fx-earth-toss` |
| **Harvesting** is the hoeing cycle with chaff | `STROKES.reap` | Same request, item 5 | `-reap` |
| **Making furniture, and shaping a carreta's axle** is the seated mending cycle (`-repair`) with shavings | `STROKES.whittle` | Same request, items 6 and 15 | `-carpentry`; `fx-shavings` |
| **Practice at the mark, and the hunt's shot** is the side-on idle (`-idle-e`) with a long rifle drawn in canvas at the shoulder and, at the mark, a flash and three puffs of smoke once a cycle (the hunt's shot keeps the library's `musket-smoke`) | `STROKES.shoot`, `STROKES.shot`, `drawWorkLayer` | Same request, item 7 | `-aim`, `-fire` |
| **Fishing** (at home and on the road) is the seated rest (`-rest`) with a cane pole, a line and a bobbing float drawn in canvas, and rings spreading from the float | `STROKES.fish`, `drawWorkLayer` | Same request, items 8 and 15 | `-fish`; `fx-ripple` |
| **Gathering** (oysters, kindling, eggs, tying a bundle on the Scrape) is the sowing crouch (`-sow`) bobbing at the ground (a lean about the feet) | `STROKES.gather` | Same request, item 9 | `-gather` (grown), and the children's `-gather` (item 13) |
| **Butchering** a beef or a hog is the kneeling nursing pose (`-care`), bobbing; nothing of the animal is drawn | `STROKES.butcher` | Same request, item 10 | `-butcher` |
| **Drilling in Houston's camp** is the walk cycle stepped on the spot; **standing guard** the searching pose with a rifle sloped | `STROKES.drill`, `STROKES.guard` | Same request, item 11 | `-drill`, `-guard` |
| **Surveying** is the walk cycle paced to and fro over a few yards, turning at each end | `STROKES.pace`, `strokeShift` | Same request, item 12 | `-stake` (the pacing stays the walk) |
| **A child keeping the birds off the corn, or catching up the milk cow**, is the walk paced to and fro; **carrying water** the grown carry drawn at the child's size | `STROKES.shoo`; `STROKES.carry` with the child scaling of `entityClip` | Same request, item 13 | `-shoo`, `-carry-water` for `girl`, `boy`, `smallchild` |
| **A child scattering corn for the hens** is the grown sowing cycle (`-sow`) at the child's size (until 2026-09-28 the child's side-on rest) | `STROKES.scatter` | Request 2026-09-26 — children at play, babies, and the Scrape's own work, item 1 | `-scatter` |
| **Keeping the camp's fire** is the kneeling nursing pose with a small flame and grey puffs going up in front of it | `STROKES.fire` | Request 2026-09-28 — people at work, item 14 | `-tend-fire` |
| **The family's wood pile** by the house is `log-fallen` drawn once for every ten logs, up to four, laid side by side | the log pile in `drawWorld`, `public/app.js` (`window.__logPileDrawn`) | Request 2026-09-28 — people at work, item 16 (until then request 2026-09-15 — the trees of the colonies) | `wood-pile-1` to `-4` |
| Somebody idle at an activity is drawn in the nearest delivered cast pose: whittling, mending harness, sewing, shelling corn and cleaning a rifle the seated `-repair` (a hammer at a hoe); washing the kneeling `-care`; a pipe, cards and dominoes the seated `-rest` (no pipe, no cards); sweeping a step the hoe's swing `-work`; carrying water the harvest's `-carry` (a sack, a basket, a bucket by figure) | `ambientClip` in `public/motion.js`; `ACTIVITIES` in `sim/ambient.mjs` | Request 2026-09-28 — ambient life, item 1 | `-whittle`, `-mend-harness`, `-sew`, `-shell-corn`, `-clean-rifle`, `-wash`, `-pipe`, `-cards`, `-sweep`, `-carry-water` for each cast figure |
| The washtub is the plain `bucket`; the woodpile the Alamo's `alamo-firewood`; the hens `chicken-idle` | `propItem` in `public/ambient.js` | Same request, item 2 | `washtub`, `woodpile-frontier`, `hens-pecking` |
| A soldier in camp cleaning his rifle is the ramrod's stroke (`volunteer-gun-ram`, `regular-gun-ram`); the volunteers at the fire, the cards and the wood are the cast's civilian men (`elder`, `ochre`, `blue`) | `CAMP_TEXIAN`, `CAMP_MEXICAN` in `sim/ambient.mjs`; `figureClip` in `public/ambient.js` | Same request, item 3 | `volunteer-clean-rifle`, `volunteer-camp-sit`, `volunteer-camp-cook` |
| The sick badge on a portrait is the road's nursing icon (`icon-tend-sick`, or its stroked glyph) in a cream disc | `panelRow` and the row update in `public/app.js` (`.panel-sick-mark`) | Request 2026-09-27 — sickness, item 1 | `mark-sick` |
| "Stop and rest a day" is the rest order's picture (`icon-rest`); "Nurse the sick" at home the road's nursing (`icon-tend-sick`); "Camp apart from the crowd" a stroked glyph (three tents on a bank and one up the stream) | `PANEL_ICONS` and `drawGlyph` in `public/family-panel.js` | Request 2026-09-27 — sickness, item 2 | `icon-rest-road`, `icon-nurse-home`, `icon-camp-apart` |
| Somebody sick and resting is drawn in the delivered `-injured-rest` pose, as the hurt are; a sick baby is drawn as it is | `restingSick` and `grownClip` in `public/motion.js` | Request 2026-09-27 — sickness, item 3 | `-sick-rest`, `infant-sick` |
| ~~Six children's action glyphs drawn in code~~ | `PANEL_ICONS` in `public/family-panel.js` | Delivered 2026-09-22 in `icons-children.png` | All six keys now name their production sprite directly |
| ~~A trash can drawn in code with a pen~~ | `DrawBin` in `launcher/SoloGameDialog.cs` | Delivered 2026-09-22 in `launcher/art/icon-delete-save.png` | Illustrated frontier pail is embedded and tinted; line drawing is packaging fallback only |
| ~~Gathering glyphs drawn in code~~ | `PANEL_ICONS` in `public/family-panel.js` | Existing `icons-family-subsistence.png` art wired 2026-09-26 | Four production sprites selected directly; `fish-road` reuses the water-fishing icon |
| ~~Stock glyphs drawn in code~~ | `PANEL_ICONS` in `public/family-panel.js` | Existing `icons-family-subsistence.png` art wired 2026-09-26 | Three production sprites selected directly |
| The sentry on San Fernando's roof is one standing volunteer at the church (`town`); the townspeople leaving are the engine's civilian figures; Sutherland rides the roster's `rider` | the `sentry` and `townsfolk` groups of `arrival` in `sim/battles/alamo.mjs`; `sutherland` in `sim/people.mjs` | Request 2026-09-26 — the bell at Béxar | `sentry-bell-ring`, `townsfolk-leave`, a Sutherland sheet |
| Children at play are drawn in the poses their sheets already hold: running play (a stick horse, tag, hide-and-seek going and coming, a hoop) the child's walk; a doll and lying in the grass the sitting rest; a toy cart and marbles the side-on rest; hiding the back-turned idle. (The hens are work since 2026-09-28: the sowing cycle, its own row above.) A child talking with a parent is the standing idle, and the parent the cast listening pose | `littleClip` in `public/motion.js` | Request 2026-09-26 — children at play, babies, and the Scrape's own work, items 1 and 4 | `-play-*`, `-scatter`, `-speak`, `-tug` for each child's sheet |
| A crawling baby is the infant's standing pose (`infant-idle-e`) moved over the ground a few yards a tick; a crying baby the infant's front-facing idle with a "(crying)" bubble; a napping one `infant-rest` | `littleClip` in `public/motion.js` | Same request, item 2 | `infant-crawl`, `infant-cry`, `infant-sleep` |
| A woman (or anybody) holding a baby is the cast figure's harvest carrying pose (`-carry`) with the infant drawn at her side; a baby carried on an errand is the infant figure drawn at the carrier's hip, a little up and to the right | `littleClip` in `public/motion.js`; `carriedAt` in `drawWorld`, `public/app.js` | Same request, item 3 | `-hold-baby`, `-carry-baby-walk` |
| "Go for help" (`child-help`, the oldest child running to the neighbours) is a stroked glyph drawn in code: a running figure and a house with its door open | `PANEL_ICONS` and `LITTLE_GLYPHS` in `public/family-panel.js` | Request 2026-09-28 — the oldest child going for help | `icon-child-help` |
| Seventeen icons - seven kinds of play, the hens and the Scrape's nine works - are stroked glyphs drawn in code | `PANEL_ICONS` and `LITTLE_GLYPHS` in `public/family-panel.js` | Same request, item 5 | `icon-<key>` for each |
| The milk cow a child drives on the Scrape is the range longhorn's `cattle-longhorn-red-idle` (on the road) and `-graze` (at the camp), drawn a step behind the child; its icon (`flee-cow`) a stroked glyph | the cow in the entities loop of `drawWorld`, `public/app.js`; `PANEL_ICONS` in `public/family-panel.js` | Request 2026-09-27 — the milk cow on the run, and Béxar before the bell, item 1 | `milk-cow-walk-*`, `milk-cow-graze`; `icon-flee-cow` |
| The Mexican soldiers after a family on the Scrape: a dragoon riding and firing is the line's `dragoon-march` with a flash and a puff at his hands; an infantryman stopped to load is `regular-fire-reload`, running `regular-march`; a hit is told in words, nobody drawn falling | `public/chase-view.js` | Request 2026-09-27 — Mexican troops after a family on the road | `dragoon-gallop-*`, `dragoon-carbine-fire`, `skirmisher-run-*`, `skirmisher-kneel-fire` |
| Béxar's families, Tejano volunteers, dancers and fiddler are the colonists' cast figures (`ochre`, `teal`, `elder`, `indigo`, `blue`, `blue-girl`, `girl`, `boy`) and the cast's riders; the fandango's lanterns are `fire-flicker` drawn small | `BEXAR_CAST` in `sim/town-scenes.mjs`; the `lights` prop in `public/town-scenes.js` | Same request, items 2-4 | Tejano townspeople, `tejano-rider-*`, `dancers-couple`, `fiddler-play`, `lantern-post` |
| A column's foraging parties are three `dragoon-march` riders each; a column on the march is `regular-march` men in files of three with a `dragoon-march` at the head | the parties in `drawWorld` in `public/app.js`; `drawArmy` (`moving`) in `public/army-view.js` | Request 2026-09-26 — the Mexican advance, items 1 and 3 | `forager-ride-*` / `forager-drive-*`, `regular-march-column` |
| The smoke of a burning town or farm is the library's `smoke-rise` (chimney smoke) drawn three to four figures tall, with a painted grey plume if that clip has not loaded | `window.__firesDrawn` in `drawWorld`, `public/app.js` | Request 2026-09-26 — the Mexican advance, item 2 | `farm-smoke-rise`, `town-smoke-rise` |
| Whole jacal stage sprites; `lean-to` shed frame; the double chimney drawn with the single stick-and-mud chimney's picture (`house-chimney-stick`; until 2026-09-24 a flat rectangle, whose width let the far pen's door show either side of it at 90 and 270 degrees). Since 2026-09-24 the saddlebag's two pens stand one behind the other along their ridge at every turn, and it stands at the middle between the far pen's front gable and the near pen's back gable, `DOUBLE_RISE` (2.7) high so that it hides the far pen's door whole, its foot behind the near pen's roof (until then, at 0 and 180 degrees behind both pens' back gables, and at 90 and 270 brought `DOUBLE_TOWARD` toward the near pen); no separate interior floor/loft display | `drawHousePlot` and `standChimneys` in `public/house-plot.js` | Request 2026-09-15 — the house plot's pieces | Jacal modules, shed frame, double chimney (two-sided, its foot marked), and separately registered floor and loft overlays |
| Generic `chapel` and `adobe-flat` silhouettes represent San Fernando and the Governor's Palace | `public/bexar-layout.js` | Request 2026-09-14 — Béxar civic architecture | Researched 1836 civic façades in the existing illustrated style |
| A child in an unavailable action pose is a grown figure drawn smaller (90% at 10–17, 70% at 5–9, 55% at 2–4, 45% an infant). Idle, cardinal walking, rest and injured-rest use delivered `girl`, `boy`, `smallchild` and `infant` art | `CHILD_POSES` and `entityClip` in `public/motion.js` | Request 2026-09-12, priority 1 — children | Any later child-specific action poses. **Keep the scaling**: the delivered sheets fill their cells and need it |
| A family's appearance is shown through the painted cast atlases with a cached palette pass; all offered parent head styles now have distinct painted silhouettes, and children use age-specific bodies | `public/avatar-art.js`, `public/person-palette.js`, `public/appearance.js` | Request below — aligned painted people layers | Task-specific props and transport refinements, plus semantic masks for reliable palette changes |
| A saddlebag house's interior is drawn on the dog-run's picture (`interior-dog-run`, drawn wide), with its own ten spots measured there — by each hearth at the outer ends where that picture draws them, each back wall, window, pen and door — and nothing set in the passage the picture shows | `INTERIORS.saddlebag` in `sim/interior-data.mjs`, drawn by `public/interior.js` | Request 2026-09-12 (second) — interiors and furnishings: a saddlebag interior | `interior-saddlebag`; re-measure the spots on it, the hearths at the central chimney |
| Thirteen tree kinds use delivered species art: pine, longleaf, cedar, mesquite, live oak, elm, post oak, blackjack, pecan, hackberry, sweetgum, bald cypress and sabal palm. Magnolia and beech have medium and large frames. Shortleaf shares loblolly art; the other oaks (water, bur, white, Texas) take the post oak's, and hickory, walnut and ash the pecan's | `KINDS` picture and optional per-size `pictures` in `sim/woods.mjs`, drawn by `drawGroundDetail` in `public/app.js` | Delivered through `biome-trees-fields.png`, 2026-09-22 | Shortleaf and species-specific later breadth |
| **A child** riding the family horse is their own figure's idle pose (`seatedClip`), facing the way they go, cut off below the waist and drawn over the back of the family's walking horse (`horse-walk`, `-n`, `-s`); the horse is not drawn again. Everybody grown or adolescent came off this row on 2026-09-21: all eight identities are Astra's own painted horse-and-rider now (`RIDING_FIGURES`), drawn as one frame at the rider's height with no horse under it | `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`; `drawSeated` in `public/app.js` | Request 2026-09-14 — family members on horseback | `girl`, `boy`, `smallchild` and `infant` mounted on the family's chestnut, east/south/north as the eight have |
| **A second-cast driver (`rust-woman`, `indigo`, `ochre`, `blue-girl`) or a child** driving the ox and wagon is their own figure's idle pose, cut off below the waist, sitting at the front of the side-view wagon (`wagon-travel`) with the ox (`ox-walk`, `-n`, `-s`) ahead; the ox and wagon are not drawn again. The four original-cast identities came off this row on 2026-09-21: `rust`, `teal`, `elder` and `blue` are Astra's whole seated driver layers with their reins and goad, in all four headings (`DRIVING_FIGURES`). Going north or south the wagon still stays side-on and the ox is above or below it. Since 2026-09-29 the wagon and ox are Claude's one drawing (`wagon-ox-*`, *Claude-drawn stand-ins*, area D) wherever its sheet has loaded, end-on going north or south; this is what is drawn until it has | `wagonDriverId`, `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`; `drawSeated` in `public/app.js` | Request 2026-09-16 — driving the ox wagon | Seated driver layers for `rust-woman`, `indigo`, `ochre`, `blue-girl` and the four children, on the same four headings as the delivered sixteen |
| **Riders in a wagon or cart** on a family's journey together (2026-09-25) are their own figure's idle pose cut off below the waist, set on the front of the covered wagon's cover behind the driver, two abreast toward the tail (`bedLayout`); a baby in a lap is drawn the same, smaller. The walkers beside the train are the ordinary walk cycles in a file along its near side; **a baby carried by a walker is drawn as the infant's own figure beside them**, not in anybody's arms. Since 2026-09-29 riders in a wagon sit whole in the open tail of Claude's rig (`wagon-ox-open-*`, `bedLayout(..., rig)`) wherever its sheet has loaded; the cut figure on the cover is what is drawn until it has | `bedLayout`, `passengersOf`, `walksBeside` in `public/motion.js`; `drawSeated` and `drawEntity` in `public/app.js` | Request 2026-09-25 — riders, walkers and the cart | Seated riders in an open-backed wagon and a cart; a walking figure carrying an infant, for the first and second casts |
| ~~A carreta made at home drawn as a shrunken covered wagon~~ | `miniWagon` in `public/app.js` | Delivered 2026-09-26 in `carreta-solid-wheels.png` | Four travel frames each east/north/south, three empty parked views and loaded east view; the ox remains separately drawn |
| ~~The ox under packs drawn as a plain ox~~ | `miniAnimal` and `entityClip` | Delivered 2026-09-26 in `ox-packed.png` | Cardinal four-frame walks and three loaded idle views selected for foot-travel oxen |
| ~~The carreta's icon drawn as a glyph~~ | `PANEL_ICONS` in `public/family-panel.js` | Delivered 2026-09-26 in `icons-gather-stock-carreta.png` | `icon-make-carreta` selected directly |
| **A family's poor cart** now uses delivered uncovered `cart-open` directional views without its ox, but its wheels are still static and it has no painted loaded state | `miniWagon` in `public/app.js` | Request 2026-09-25 — riders, walkers and the cart | Four-frame east/north/south wheel rotation and loaded views, preserving the new open-cart silhouette |
| A rider never gets down to talk: they speak from the saddle, turned east, west, north or south toward the listener (the vertical dialogue delivered 2026-09-14 is in use). The person he stopped now answers him in their own delivered speaking and listening poses (2026-09-21), on their own feet | `carrierClip` and `grownClip` in `public/motion.js`, from `facingOf` and `listeningOf` in `sim/encounters.mjs` | Request 2026-09-12, priority 3 | `courier-dismount` (delivered 2026-09-14, registered, not yet bound: it needs the encounter to know when a rider has got down and where the horse stands) |
| The trees of the biomes of 1836: longleaf, bald cypress, Texas sabal palm, beech and magnolia all use their delivered silhouettes. Anacua and Texas ebony still take `oak-spreading`; tupelo and cedar elm take `elm`; willow takes `cottonwood` - behind Claude-drawn stand-ins of their own since 2026-09-28 (`own` in `KINDS`; *Claude-drawn stand-ins*, area F) | `KINDS` (`picture`, `pictures`, `sized`, `scale`) in `sim/woods.mjs`, sent in the woods catalogue and drawn by `drawGroundDetail` in `public/app.js` | Delivered through `biome-trees-fields.png`, 2026-09-22 | Anacua, Texas ebony, tupelo, cedar elm and willow remain species stand-ins |
| The ground of the biomes of 1836 uses delivered tall grass, river cane, palmetto, thorn thicket, Spanish dagger, marsh cordgrass, dune grass and cypress knees. Palm groves now scatter sabal palms; town fields mix young and mature irrigated rows, fallow earth and stubble | `GROUND_CLASSES` marks in `public/ground-classes.js` | Delivered through `biome-ground-bexar.png` and `biome-trees-fields.png`, 2026-09-22 | No listed ground-cover stand-in remains |
| Béxar's fields are the `fields` wash with stubble and fallow scattered on it; **the acequias are still not drawn** and no brush fence stands. The art for them landed 2026-09-21 (`acequia-straight`, `-bend`, `-crossing`, `fence-brush`, all registered and unused) and what is missing is now the LAYOUT: where each ditch ran, which is a researched course and a claim ID, not a sprite | `fields` in `public/ground-classes.js`; the envelope in `scripts/terrain/biomes.mjs` `BEXAR_FIELDS`; nothing yet in `public/bexar-layout.js` | Request 2026-09-19 — Béxar's fields and acequias | The acequia courses themselves, laid by `public/bexar-layout.js` from the delivered pieces |
| **Words only for everything but the deer, the turkey and the mustang.** Since 2026-09-19 (docs/BIOME_GAMEPLAY.md §3.1) a hunt on a class of the biomes brings the quarry its place holds - turkey, bear, buffalo, antelope, mustang, javelina, ducks and geese, a wild cow, or a deer - and says so before it goes ("Waiting here, a turkey: four food."), at the shot ("downwind of a bear") and in the record ("brought down a buffalo"). The deer (2026-09-15), the turkey and the mustang (both 2026-09-21) are drawn where the server put them; every other quarry is given no place to be drawn at (`chore.quarry` stays unset), because a deer drawn where the words say a bear would be a wrong picture | `DRAWN_GAME`, `quarryAt` and `GAME` in `sim/hunting.mjs`; the drawing is decided where `quarryPoint` is called in `sim/chores.mjs`, and `miniQuarry` in `public/app.js` picks the sheet by `quarry.kind` | Request 2026-09-19 — the game of 1836 | `wildlife-bear`, `-javelina`, `-pronghorn`, `-bison`, `-geese`, `-cattle`; each one lands, its id joins `DRAWN_GAME` and nothing else has to change |
| **Gonzales before the fight** (2026-09-25): raised flag, table-top blank and painted flags, ploughed ground and approach props have dedicated art. Teal, indigo and blue-girl now have two-frame sewing animation. Fitting the gun still uses `repair`, digging uses `work`, looking across the river uses `search`, carrying cloth and bundles uses `carry`, and the regidor reads the letter with `speak` and no letter in hand | `STAND_INS` in `sim/town-scenes.mjs`; `drawFlag`, `drawProp`, `sceneClip` in `public/town-scenes.js` | Request 2026-09-25 — Gonzales before the fight | Remaining seated paint pose and action poses in items 1–4, plus disputed no-star flag and half-painted state in item 5 |
| In a **hard** norther the broad oak, the spreading oak, the pecan and the grass tuft now take Astra's painted gale poses, and a camp fire's smoke streams (delivered 2026-09-21). Everything else still standing in that wind — pine, cedar, mesquite, live oak, elm, scrub, reeds, prickly pear, and every sized tree of `trees-colonies-1` and `-2` — is the library's own upright sprite sheared about its foot | `GALE_POSES` and `windLean` in `public/weather-art.js`, applied by `postOak`, `plain` and `drawGroundDetail` in `public/app.js` | Request 2026-09-20 — the country in a norther | A gale silhouette for each remaining tree kind and ground mark, at the same one strength as the five delivered |

| A house placed at a quarter or half turn is drawn from the one front view the house-modules sheet has: each piece stands upright in its turned cells, and at 90 and 270 degrees every piece is that picture mirrored (the gable brought round to the other face, the ridge on the other diagonal). The gable facing the viewer always shows the door, in the picture and mirrored. The porch, shed room and passage are their one picture whichever way they run. Since 2026-09-24 a house's pictures are chosen for its chimneys, one picture for the whole house (`housePicture`; that morning each pen alone, `mirrorPens`): a cabin whose chimney gable is to the screen's side stands it against the doorless back gable of the unmirrored pen (to the right) or the mirrored pen (to the left), so the cabin at 180 degrees is mirrored; a dog-run or saddlebag keeps the house's mirroring, both pens the same way round along one ridge (`alongRidge`). A chimney on the gable the picture draws with its door stands in front of the door, and covers it whole, so the gable reads as the chimney's end: the cabins at 90 degrees, and at every turn the dog-run's near chimney (the near end of its ridge) and the saddlebag's double chimney (the far pen's door gable) | `drawHousePlot` (`rotation`, `turned`) in `public/house-plot.js`, called by `drawPlacedHouse` in `public/app.js` | Request 2026-09-23 — the house from its other sides | The pen's back gable (no door in the gable toward the viewer) for full walls, low walls and sill - or a pen with its door on its long side - and each piece's end-on view: passage, porch and shed room running into the screen. With them every pen takes the house's mirroring again and no chimney stands before a door at any turn |
| A dog-run's passage roofed with the pens' own roof (`house-hewn-roof-finished`, or `house-round-roof-partial` while the walls are still to chink), seated as on a pen standing at the middle of the passage, so it runs a quarter cell into each pen's roof along their one ridge (half a cell until the passage became twelve feet, 2026-09-24; one copy still spans it); its floor laid twice to cover the twelve feet; the joins show the roof pictures' end poles. The sheet's own `house-passage-roof` (flatter, nearly square, on four posts) meets neither pen's roof and is drawn only where a passage stands between no row of pens. A saddlebag has no roof over its double chimney's cell: its two roofs meet the chimney, which rises between them | `drawHousePlot` (the passage in a row, `PASSAGE_FLOOR_HIGH`, `PASSAGE_FLOOR_DEEP`), `alongRidge` and `RIDGE` in `public/house-plot.js` | Request 2026-09-24 — one roof over a two-pen house | `house-roof-join` (and `-partial`), seated on the pens' ridge; `house-roof-join-chimney` for the saddlebag; the ridge line marked on each roof frame (replaces `RIDGE`) |
| **Parked 2026-09-28: the tutorial is removed for now**, and with it these marks; the row stays so the request can be taken up if it returns. The mark that leads a student to the one thing to press is CSS: a triangular caret over the icon, a rust box-shadow ring round it, and ten coloured bars for the lesson’s steps | `.panel-icon[data-pointed=true]` and `.lesson-pip` in `public/style.css`; the pips built by `renderLesson` in `public/app.js` | Request 2026-09-21 — the guided start’s marks | `lesson-point`, `lesson-ring`, `lesson-pip`, `lesson-pip-done` |


| A tree or a tuft in a norther is the library's own upright sprite sheared about its foot, so it leans; nothing streams, and smoke is not drawn at all | `windLean` in `public/weather-art.js`, applied by `postOak` and `drawGroundDetail` in `public/app.js` and by `lean` in `public/art.js` | Request 2026-09-20 — the country in a norther | `oak-broad-wind`, `oak-spreading-wind`, `pecan-wind`, `grass-tuft-wind`, `smoke-streaming` |
| **A family's own person in a fight** is drawn in the volunteer militia's firing cycle (`volunteer-fire-reload`, `volunteer-load`, `volunteer-e`/`-w`, `volunteer-march`), not in their own cast figure | `memberPose` in `public/battle-view.js`, drawn by `drawFigure` in `public/app.js` (`stand-in:`) | Request 2026-09-25 — battles, item 1 | Each cast's own aim, fire, load and ramrod frames |
| **The wounded carried**: a man hit is drawn as the library's seated wounded soldier (`regular-injured`/`volunteer-injured`) helped back by two walking figures; a dead man as `*-reclining` with two walking beside him; a dragoon hit in the saddle is drawn dismounted | `drawFallen` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — battles, item 3 | `bearers-carry` (two men carrying a third on a blanket, both facings) and `dragoon-wounded-led` |
| **The Gonzales cannon crew** delivered 2026-10-03: distinct civilian rammer, charge carrier and igniter now serve the cart-wheel gun with authored ram, carry, ready, discharge and crouch cycles | `drawCannon` in `public/battle-view.js`; `gonzales-settler-*` atlases | Request 2026-09-25 — battles, item 4 | Dedicated roles delivered; finer hand-to-gun registration and longer transitions remain polish |
| **Béxar's houses fought from** (2026-09-25): a division inside a stone house is the town's own house as drawn, with the flashes and the smoke of its loopholes at its wall; only one man in four is drawn, in the doorway or the yard | `draw` in `public/battle-view.js`, `cover: 'loophole'` (`stand-in:`) | Request 2026-09-25 — the storming of Béxar, item 1 | `house-loopholed` (a flat-roofed stone house with a parapet and loopholes) and `volunteer-loophole-fire` |
| **The street barricade and the sandbags** at Béxar are the library's `palisade` and `sacks`, set in front of the men behind them | `draw` in `public/battle-view.js`, `cover: 'barricade'`/`'sandbags'` (`stand-in:`) | Request 2026-09-25 — the storming of Béxar, items 2 and 4 | `barricade-street` (ditch, bank, post palisade, a gun embrasure) and `sandbag-breastwork` |
| **Karnes's crowbar** is now his own `karnes-crowbar-work` cycle at the door; he idles once it gives and `wall-breach` remains the opened-door marker | `drawBreaches` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — the storming of Béxar, item 3 | Karnes delivered; a generic volunteer crowbar worker and other facings remain open for reuse |
| **Digging the trench across the street at night** is the settlers' `rust-work`/`teal-work` | `draw` in `public/battle-view.js`, `action: 'work'` (`stand-in:`) | Request 2026-09-25 — the storming of Béxar, item 4 | `volunteer-dig` |
| ~~The white flag of truce as a regular beside canvas cloth; the bugle only a caption~~ | `drawWhiteFlag` uses a Mexican regular at Béxar and a Texian volunteer at Coleto, each with walking and idle art; `drawLines` shows a regular bugler at documented calls | Request 2026-09-25 — the storming of Béxar, item 5 | Delivered in `battle-signals.mjs`; a drummer remains requested separately |
| **The townspeople let out of a broken house** walk away as the library's `rust-woman`, `indigo`, `elder` and `smallchild` | `draw` in `public/battle-view.js`, `civilians` (a library figure, not a stand-in figure: no marker) | Request 2026-09-25 — the storming of Béxar, item 6 | Béxar townspeople of 1835 in their own dress, walking |
| **Night at Béxar** (the entry before daylight, the Priest's House by moonlight) is not drawn: the day's own light stands | `public/app.js` (no layer) | Request 2026-09-25 — the storming of Béxar, item 7 | a darkening, moonlit layer that does not snap when the pace changes |
| **The Twin Sisters** at San Jacinto use their special red-and-blue `twin-sister-painted-e`/`-w` and authored recoil clips, two distinct guns. Their service figures use `twin-crew-gun-ram`, `-shot-carry`, `-ready` and `-fire` from `twin-sisters-crew`; the unpainted `cannon-sixpounder-*` stays available for other light iron guns. The Mexican gun in the breastwork remains bronze with `regular-gun-*` | `drawGun` in `public/battle-view.js` | Request 2026-09-25 — San Jacinto, item 1; owner 2026-09-27 color direction | Dedicated service art delivered; crew transport remains unverified |
| **A camp at rest** (the Mexican camp at San Jacinto, both armies' camps on April 20-21) is drawn as the standing idle cycle and the seated wounded soldier (`*-injured-rest`) for a man sitting at rest, with the library's `fire-flicker` for the fires | `draw` (style `camp`) and `drawWorks` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — San Jacinto, item 2 | `regular-rest-sit`, `regular-sleep`, `volunteer-rest-sit`, `musket-stack` |
| **The breastwork of packs, saddles and baggage** is a line of the library's `crate`, `sacks`, `barrel` and `packed-belongings`, with the opening in its middle | `drawWorks` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — San Jacinto, item 2 | `breastwork-packs` in three or four segments, about five feet high (`HIST-TEX-522`) |
| **A Texian horseman** (Sherman's party, Lamar's sixty-one, and Deaf Smith's two companions) is the library's mounted courier (`mounted-courier-e`, `mounted-courier-listen`); a shot from the saddle is drawn as the flash only | `figureOf` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — San Jacinto, item 3 | `volunteer-mounted` walk and idle, and `volunteer-mounted-fire` |
| **The marsh and Peggy's Lake** are the library's cordgrass, reeds and water ripples scattered over the ground; nobody is drawn wading | `drawWorks` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — San Jacinto, item 4 | `marsh-edge` tiles and a wading figure clipped at the waterline |
| **Scaling ladders and a man climbing the north wall** now use `ladder-carried-e` with four regulars, `ladder-set-e`/`-w` and the `regular-climb` loop along the existing ladder paths | `drawLadders` in `public/battle-view.js` | Request 2026-09-25 — the Alamo, item 1 | Delivered in `alamo-scaling-ladders.mjs`; canvas rails and generic march remain load fallbacks |
| **The Alamo's guns served**: the 18-pounder uses a heavy garrison-carriage sheet, the Mexican bronze batteries use an earthwork-mounted siege gun, and canister shots now draw a short smoke-and-dust cone in addition to the existing flash and live puffs. The north and church guns retain reusable field-gun art and existing crews | `drawGun` in `public/battle-view.js` | Request 2026-09-25 — the Alamo, item 2 | `cannon-18pdr`, `cannon-siege-battery`, and `canister-burst` delivered; specific north/church gun art remains requested |
| **The garrison on the walls** stand at the wall's line in the volunteer firing cycle; nobody is drawn on a parapet or roof, above the wall | `layoutSide` and `draw` in `public/battle-view.js` | Request 2026-09-25 — the Alamo, item 3 | Volunteers firing over a parapet (upper body over a wall top), both facings and north/south |
| **Night, and dawn coming up** over the assault: a dark blue wash over the map by the phase's `light`, under the flashes and the words | `draw` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — the Alamo, item 4 | A night grade for the ground and figures, and a dawn grade |
| **The red flag on San Fernando's tower** now uses the four-pose `flag-red-wind` cloth-and-pole clip at the documented town point | `drawFlag` in `public/battle-view.js` | Request 2026-09-25 — the Alamo, item 5 | Flag art delivered; an accurate San Fernando tower setting remains requested |
| **Mounted volunteers** (the Gonzales men riding in): the library's mounted courier (`mounted-courier-e`) | `draw` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — the Alamo, item 6 | `volunteer-mounted` walk and trot, east/north/south |
| **Lancers** walking or standing are `dragoon-march-*` (no lance); charging, Astra's `lancer-charge` (2026-10-03); the striking is never drawn | `draw` in `public/battle-view.js` | Request 2026-09-25 — the Alamo, item 7 | `lancer-march` and `lancer-idle` with the lance up, both facings |
| **Smoke from the burning huts** now uses `smoke-column-far-rise` after its dated ignition; **the Alamo aftermath pyres** use a separate four-frame `alamo-funeral-pyre` sheet at three separated reconstruction sites, unlit from about 3 p.m. and animated after about 5 p.m. | `drawPlume` in `public/battle-view.js`; `sim/battles/alamo.mjs` | Request 2026-09-25 — the Alamo, item 9, and owner 2026-09-27 pyre request | Both animated effects delivered |
| **San Patricio by night** (2026-09-25): the dark of a night fight is a wash drawn over the whole view, and a lantern in a window or the fire on the square a warm glow drawn on the canvas; the colony's houses are the library's `house-jacal`, `cabin-small` and `jacal-poor` | `drawNight`, `glow`, `drawScenery` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — the south's fights, items 1 and 2 | A night light layer (moon and dark), a lit-window overlay for `adobe-flat`/`house-jacal`, and a campfire burning at night |
| **Grant's men on horseback** are drawn as the mounted courier's riding clip, `mounted-courier-e`; a family's man with them the same | the rider branch of `draw` and `memberPose` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — the south's fights, item 3 | `volunteer-ride-e`/`-s`/`-n` (a volunteer with a rifle across the saddle) and a mounted firing frame |
| **Grant's herd of several hundred horses** is the library's `mustang-gallop` and `mustang-graze`, up to twenty-four of them repeated in a loose drove | `drawHerd` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — the south's fights, item 4 | `herd-drove` (a dense moving herd as one sprite, and a scattering herd) |
| **The groves at Agua Dulce** are a few of the library's `live-oak-large` and `mesquite-large` set close | `drawScenery` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — the south's fights, item 5 | A mott of live oak as one sprite, with room for mounted men to stand hidden in its shade |
| **The Gonzales cannon** is the library's field gun (`cannon-bronze-e`/`-w` and its recoil) served by the carriage-gun crew cycles (`volunteer-gun-ram`, `-shot-carry`, `-fire`) | `drawCannon` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — battles, item 4 | `cannon-cartwheels` (a small brass six-pounder on a pair of cart wheels, `HIST-TEX-475`) and its settler crew |
| **The Come and Take It flag** is drawn on the canvas: a white field, a black gun, a star over it and the words (not shown at Gonzales on the field: `FIC-GONZ-419`) | `drawFlag` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — battles, item 5 | `flag-come-and-take-it` on a pole, still and in a light wind |
| **Concepción's riverbank** (5–6 ft, steps cut in it, timbered bottom, the river behind) is the library's `earth-rampart` laid along the bank line with `pecan-large-wind`/`mesquite-large-wind` behind and the river a drawn ribbon of water; the map carries no San Antonio River below Béxar | `concepcionScenery` in `sim/battles/concepcion.mjs`, drawn by `drawScenery` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — Concepción and the Grass Fight, items 1, 4 | `riverbank-cut` (a bank face with steps, east and west), `river-bend` ground piece |
| **The climb-fire-drop cycle under a bank**: a man loading is drawn as `volunteer-load` (kneeling) a third of a figure lower than the men firing, who use `volunteer-fire-reload` | the `bank` branch of `draw` in `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — Concepción and the Grass Fight, item 2 | `volunteer-bank-climb`: step up the bank, fire over the lip, step down, load under it |
| **Mission Concepción** is `church-generic` | `concepcionScenery` (`stand-in:`) | Request 2026-09-25 — Concepción and the Grass Fight, item 4 | `mission-concepcion`: twin towers and a dome, seen from 500 yards |
| **A Mexican bugler** is visible and animates while the existing documented charge/retreat call is captioned; `regular-drummer` is registered with start and two-beat clips for a future documented drum cue | the `bugler` lines of `sim/battles/concepcion.mjs` drawn by `drawLines` | Request 2026-09-25 — Concepción and the Grass Fight, item 5 | Both sheets delivered; drummer has no undocumented runtime cue |
| **The dry creek bed and the ditch in the mesquite** are `earth-rampart` laid low among `mesquite-large-wind`; the creek Jack forded is a drawn ribbon of water | `grassScenery` in `sim/battles/grass-fight.mjs` (`stand-in:`) | Request 2026-09-25 — Concepción and the Grass Fight, item 7 | `creek-bed-dry` ground piece, `creek-ford` |
| **A family's person hit in a fight** is drawn as `volunteer-injured` for a second and then `volunteer-reclining` (killed), or `volunteer-injured` (wounded), carried by two `volunteer-march` figures once the fight has passed; one who runs is `volunteer-march` facing away | `poseOf` and the carriers in `draw`, `public/battle-view.js` (`stand-in:`) | Request 2026-09-25 — battles, items 1 and 3 | each cast's own `-injured` and `-reclining`, and `bearers-carry` |

| **Named roster riders delivered 2026-10-03**: J. W. Smith, Horton, Kimbell and Martin now have own foot and mounted sheets, bound to their existing scenes. No roster person retains the generic rider art key. | `drawPerson` in `public/battle-view.js`, `drawFamous` in `public/famous-view.js` | `famous-riders-2026-10-03.mjs` | Mounted north/south walking, faster gaits, scene-specific action and warranted fallen-pose refinements; broader cast outside the roster |
| **Poses the famous sheets lack**: Travis has `travis-still-ramp`; Joe has `joe-fire-door` and `joe-hurt-e`; Houston and Santa Anna have their own animated horses; Castrillón now has `castrillon-fall` and `castrillon-still`. Other named figures still need their authored poses. | `drawPerson` in `public/battle-view.js` | Request 2026-09-26 — the famous people, items 5-7 | Remaining named-person poses below |
| **The Twin Sisters on the campaign map** use the paired rolling/halt sheet `twin-sisters-limbered`, now repainted red and blue to match the special field variant; the two iron guns remain a fallback if the sheet cannot load | `drawFamous` in `public/famous-view.js` | Request 2026-09-26 — the famous people, item 9; owner 2026-09-27 color direction | Delivered; unpainted field six-pounder is also delivered for reuse |
| ~~The Goliad prisoners drawn in the armed militia's walk and stand~~ | `goliad-prisoner` supplies unarmed walking, idle, hurried and non-graphic down poses for the yard, three columns and escape; `sim/battles/goliad-massacre.mjs` marks these groups `figure: 'prisoner'` | Request 2026-09-25 — Coleto and Goliad, item 2 | Delivered; a second visual identity would add variety to the sampled crowd |
| ~~Francita Alavez as the first cast's woman~~ | The `alavez` part in `sim/battles/goliad-massacre.mjs` now selects `famous-alavez` through its `figure` key | Request 2026-09-25 — Coleto and Goliad, item 3 | Delivered: directional walks, idle and rescue gestures; appearance is an interpretation |
| ~~The carts inside Coleto's square drawn with painted-in oxen~~ | `draw` in `public/battle-view.js` uses `coleto-baggage-cart`: upright loaded carts, a non-looping tip sequence during the small hours, then tipped cover by dawn | Request 2026-09-25 — Coleto and Goliad, item 4 | Delivered: `cart-baggage`, `cart-tipped`, two intermediate tilt frames |
| **The Esparza family** (2026-09-26): Ana Esparza is the second cast's woman (`indigo-idle-e`, `indigo-walk`, `indigo-rest`), María de Jesús the library's girl, Enrique its boy (fair-haired - he was a Tejano boy of eight), Manuel and Francisco its small child, drawn at the roster's child size | `PERSON_ART` (`woman`, `girl`, `boy`, `small-child`) in `public/battle-view.js`; `drawFamous` in `public/famous-view.js` (`stand-in:`) | Request 2026-09-26 — the Esparza family, items 1-3 | `ana-esparza-*`, `maria-de-jesus-*`, `enrique-esparza-*`, `esparza-small-child-*` |
| **Gregorio Esparza's body carried to the Campo Santo** by his brother Francisco and another brother: the settler in the rust shirt (`rust-walk`, `rust-idle-e`) twice, walking one behind the other, with a pale bundle tied at three places drawn on the canvas between their hands | `drawBearers` in `public/battle-view.js` (`stand-in:`); `townsman` in `PERSON_ART` | Request 2026-09-26 — the Esparza family, items 4-5 | `burial-party-walk-e` (4 frames) and `francisco-esparza-*` |
| **The lone parent's scenes before their art has loaded**: the sky and ground painted in canvas (`paintYard`), the library's `cabin-wide`, `jacal-ramada` and `home-table`, the cast's speaking cycle or standing pose for a greeting, a laugh, a shy glance or the vow, and the Béxar fandango's `fiddler-play` for the fiddle - the moment a Claude-drawn sheet arrives it is drawn instead | `BACKDROP`, `FARM_ART`, `clipFor` (`POSE_STANDIN`) in `public/courtship.js` (`stand-in:`) | Request 2026-09-29 — the lone parent's wedding, items 1-5 and 7 | The Claude-drawn frames of that request today, Astra's of the same names after |
## Claude-drawn stand-ins (replace with Astra's)

Owner's instruction, 2026-09-16: complete the outstanding requests with Claude-drawn art, marked so Astra can replace any of
it at a glance. Everything in this table was **drawn by Claude, not by Astra**, and is kept apart from her library so that it
can never be mistaken for hers:

Owner's direction, 2026-09-28: *"Astra wrote this so that you can help make art. make all of the remaining art. yours will be
temporary. label yours so astra can replace as it makes the final versions."* Astra's style brief is saved in
[ART_STYLE.md](ART_STYLE.md); the plan that divides the remaining art among Claude's builders is
[CLAUDE_ART_PLAN.md](CLAUDE_ART_PLAN.md), and *What Astra still needs to make* above lists every item for her.

- **Where:** `public/assets/claude-standins/` — its own folder, its own sheets (every file prefixed `claude-`), its own
  `atlas.json` with `madeBy: "claude"` on every sheet, frame and clip. Nothing is added to `frontier-v1/atlases/` or her
  `atlas.json`. Sources are SVG: hand-written, or generated by the style kit and person rig in `scripts/claude-art/kit/`
  (measured from her `civilians`, `people-walk` and `people-vertical`), under `svg/<module>/claude-<frame>.svg`.
- **How it is built:** each sheet is declared in an area module, `scripts/claude-art/areas/<module>.mjs` (its frames, clips and
  the written intent each was drawn to), found by reading that folder. `npm run build:standins` rasterises them with the
  Playwright/Chrome the browser proofs use, writes each module's `areas/<module>.json`, merges them into `atlas.json`, and writes
  the provenance - made by Claude, the date, the intent, the source SVG, "temporary" - to
  [claude-art-provenance.json](claude-art-provenance.json), kept apart from her `art-prompts.json` and `art-provenance.json`.
- **Astra's art always wins, by subject (owner, 2026-09-29).** *"a lot of astra art has been replaced with worse versions"*:
  v2026.09.29.1 drew Claude's frames under names she had not used (`rust-chop`, `girl-play-run`, `wagon-ox-e`, `milk-cow-walk-e`,
  `castrillon-walk-s`...) in place of her own figures. Now a Claude frame is drawn **only for a subject she has not drawn** in
  any pose under any name: `public/art-subjects.js` says what each shows (her rust, her girl, her wagon and ox, her Castrillón,
  her pine...) and `public/art.js` leaves out every one whose subject she has drawn, so the page draws hers as it did before
  Claude's art. What stays Claude's: people she has not drawn (Kimbell, Martin, the other named officers of Claude's sheets, the
  Esparza women and boys and the burial party, Sutherland, the people of Béxar and their fandango, a Tejano rider, the padre),
  the mule, places and buildings she has not drawn, the portraits and marks, icons of meanings she has not drawn, light, fog,
  banks and effects the canvas used to scribble, and four trees she has not drawn. When she draws one of those, every Claude
  frame of it steps aside at once. Each item of *What Astra still needs to make* says *held back* where Claude's is not shown.
  `tests/astra-art-wins.test.mjs`; before/after: docs/evidence/astra-vs-claude/.
- **How it is drawn:** `public/art.js` reads the second manifest after hers and lets **her frame and her clip of the same name
  win**, and every Claude frame of a subject she has drawn is left out (above), so registering a delivery through `npm run build:art` replaces the stand-in with no change to the page. Claude's clips
  (frame sequences with timing, on the same anchors, declared as hers are in `animation.json`) plug into the very clip names the
  game asks for. `tests/claude-standins.test.mjs` then fails, naming the frame, until its entry in the area module and its row
  here are deleted and the stand-ins rebuilt.
- **In code:** every place that draws one keeps a `stand-in:` comment pointing at this section. Grep `stand-in:`.
- **What she delivers:** each request's contract below is unchanged; the frame name in the table is the name to deliver, at
  the size in the contract, and it will take over on registration.
- **One row an area.** Claude's builders each keep to their own area's row below (the areas of CLAUDE_ART_PLAN.md), adding the
  frame or clip names they have drawn - a backticked name, a clip, or a `pattern-*` - so parallel work never edits one line.
  The test fails for any Claude frame not named in this section.

| Request | Claude-drawn file (frame names) | Where it plugs in | What Astra should deliver to replace it |
| --- | --- | --- | --- |
| ~~Request 2026-09-16 — the winter's icons~~ and ~~Request 2026-09-15 — action icons~~ | **Retired 2026-09-21**: Astra delivered all 53 action icons ([delivery](ART_DELIVERY_2026-09-21-FAMILY-ACTION-ICONS.md)), her frames win in the loader, and the stand-ins, their SVGs and their entries in `SHEETS` are deleted. The rule they proved is kept in the contracts: one silhouette, a thin dark outline, readable dimmed to 40 per cent at 34–38 CSS pixels. | — | — |
| Request 2026-09-16 — the family panel's marks | `claude-marks.png`: `mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`, `mark-auto-on` | `panelMark`/`paintMark` in `public/app.js` (a canvas in `.panel-attention`, `.panel-star`, `.panel-idle-mark`, `.panel-focus` and `.panel-auto`; the type shows only while no frame is drawn, `data-drawn`), `drawMark` in `public/family-panel.js` | The five marks at 96 by 96, transparent, no text; `mark-auto` in its two states as `mark-auto-off` and `mark-auto-on` (dim brown; green `#4f7a3a`) |
| Request 2026-09-15 — face portraits for the family panel | `claude-portraits.png`: `portrait-rust`, `portrait-teal`, `portrait-elder`, `portrait-blue`, `portrait-rust-woman`, `portrait-indigo`, `portrait-ochre`, `portrait-blue-girl`, `portrait-girl`, `portrait-boy`, `portrait-smallchild`, `portrait-infant` | `drawPortrait` in `public/family-panel.js` (draws `portrait-<figure>` for the figure `figureOf` (public/motion.js) chooses; without one it still crops the idle clip, the older stand-in) | Twelve head-and-shoulders portraits at 192 by 192 matching the sheet figures exactly; Claude's are one parameterised drawing dressed after each figure and are the first to replace |
| Request 2026-09-17 — the armies on the map (owner: "there was no army. they were just off in the middle of no where") | Not a sheet: the tents, the fire and the flag are drawn in canvas by public/army-view.js; the men are the militia and regular figures the battles already use | public/app.js draws each army the server sends (sim/armies.mjs): a camp with its men close up, a flag far off | A camp: three or four wedge tents, a cook fire with a pot, stacked arms and a colour on a pole, at 192 by 192, in the map art's own light; then drawArmy lays her sprites down instead of its strokes |
| Request 2026-09-17 — the title screen (owner, 2026-09-17: "a professional game introduction experience") | Delivered as `public/assets/creation-title-landscape.png`: painted dawn country, the family's wagon, a river crossing and a settlement, composed for the title and entry card | `#creation` in `public/style.css`, behind the title, join, beginning and later wizard steps | Delivered; source, final prompt and UI intent in `docs/CREATION_TITLE_ART.md` |
| Request 2026-09-12 (second) — layered people: the How We Look pop-up (owner, 2026-09-17) | Recoloured authored cast in `public/avatar-art.js` and `public/person-palette.js` | `public/appearance.js`: full preview, each option, live family portrait and walking figure share the cast style | Painted layers must cover every head choice in `sim/appearance.mjs` and idle, walk, work, combat and seated poses; retain the saved appearance object |
| Request 2026-09-12 (second) — interiors and furnishings: the wagon's tools | `claude-home-tools.png`: `home-hoe`, `home-felling-axe`, `home-broadaxe`, `home-froe`, `home-auger` | `INTERIOR_ART` `tool:*` in `sim/interior-data.mjs`, drawn by `public/interior.js` (the long-handled tools still drawn larger) | The five tools in the `home-furnishings` style and scale, standing or leaning as in a cabin |
| Request 2026-09-29 — the homecoming's scenes | `claude-homecoming-marker.png`: `grave-marker`; `claude-homecoming-coins.png`: `coins-and-paper` (scripts/claude-art/areas/homecoming.mjs) | `marker` and `coins` in `drawYard`, `public/flashback.js` (the burial, the count and the sale) | Items 1 and 2 of the request, at the prop contract |
| **Area A — people at work and ambient poses** (2026-09-28; request 2026-09-28 — people at work; — ambient life) | `claude-wood-pile.png`: `wood-pile-*` (`wood-pile-1` to `-4`, about 10/20/30/40 logs). `claude-chop.png`: `*-chop` for all eight cast figures (`rust-chop`, `teal-chop`, `elder-chop`, `blue-chop`, `rust-woman-chop`, `indigo-chop`, `ochre-chop`, `blue-girl-chop`; frames `*-chop-*`, six a swing, the axe landing on frame 4). **Ambient life** (`claude-ambient-<pose>.png`, all eight cast figures, frames `<figure>-<pose>-<n>`): `*-whittle`, `*-mend-harness`, `*-sew`, `*-shell-corn`, `*-clean-rifle`, `*-pipe`, `*-cards` (seated, 2), `*-wash` (kneeling, 2), `*-sweep` (4), `*-carry-water` (4) and their frames `*-whittle-*`, `*-mend-harness-*`, `*-sew-*`, `*-shell-corn-*`, `*-clean-rifle-*`, `*-pipe-*`, `*-cards-*`, `*-wash-*`, `*-sweep-*`, `*-carry-water-*`. **Work** (`claude-work-<pose>.png`, all eight): `*-split` (6, the foundation's swing, the maul on the wedge on frame 4), `*-dig` and `*-dig-well` (6, earth thrown on frame 4), `*-notch` (4, beat 3), `*-lift` (2), `*-reap` (4, beat 2), `*-carpentry` (4, beat 2), `*-aim` (1), `*-fire` (the aim held, then the recoil and the lowering; beat 2), `*-fish` (2), `*-gather` (2), `*-butcher` (2), `*-drill` (4), `*-guard` (2), `*-stake` (2), `*-tend-fire` (2) and their frames `*-split-*`, `*-dig-*`, `*-notch-*`, `*-lift-*`, `*-reap-*`, `*-carpentry-*`, `*-aim-*`, `*-fire-*`, `*-fish-*`, `*-gather-*`, `*-butcher-*`, `*-drill-*`, `*-guard-*`, `*-stake-*`, `*-tend-fire-*`. **Soldiers at rest** (`claude-camp-rest.png`): `volunteer-clean-rifle`, `volunteer-camp-sit`, `volunteer-camp-cook`, `regular-clean-rifle`, `regular-camp-sit`, `regular-camp-cook` (frames `volunteer-camp-*`, `regular-camp-*`, `volunteer-clean-rifle-*`, `regular-clean-rifle-*`). **Effects** (`claude-work-fx.png`): `fx-wood-chips`, `fx-earth-toss`, `fx-dust`, `fx-shavings`, `fx-ripple` (frames `fx-*`); `tree-fall`: area F's frames since 2026-09-29 (row below), played from here. **Props** (`claude-yard-props.png`): `washtub`, `woodpile-frontier`, `hens-pecking` (`hens-pecking-*`). **The lone parent's wedding** (request 2026-09-29 — the lone parent's wedding, items 1, 2 and 7; `scripts/claude-art/areas/courtship-people.mjs`, `claude-courtship-greet.png`, `-shy`, `-laugh`, `-vow`, `-commissioner`, `-fiddle`): clips `<cast>-greet`, `<cast>-shy`, `<cast>-laugh` (2 frames each) and `<cast>-vow` (1) for all eight cast figures, frames `*-greet-*`, `*-shy-*`, `*-laugh-*`, `*-vow-*` (`rust-greet-1` .. `blue-girl-vow-1`); `elder-read-paper` (`elder-read-paper-1`, `-2`), the commissioner in a dark coat; `rust-fiddle` and `ochre-fiddle` (`rust-fiddle-*`, `ochre-fiddle-*`, 2 each). Two facing figures in `-vow`, one mirrored, have their hands meet with their anchors 0.491 of the drawn height apart (`VOW_SPACING`) | The wood pile in `drawWorld`, `public/app.js` (`window.__logPileDrawn`); the chop in `drawAtWork`, `public/app.js`, through `STROKES.chop.drawn` in `public/work-art.js` (a figure with a `<figure>-chop` clip is drawn in it, with no drawn axe over the hoe); the rest of the work the same way, through `STROKES.<stroke>.drawn` (split, notch, dig, grub, the well, reap, whittle, shoot, the shot, fish, gather, butcher, drill, guard, pace, fire), per figure with the stand-in kept for a figure whose clip has not loaded; the ambient poses through `AMBIENT_DRAWN` in `public/motion.js` and `ownClip` in `public/app.js` (the delivered pose the server names until the clip loads); the soldiers through `SOLDIERS_AT_REST` in `public/ambient.js` (`base` the delivered pose); the effects through `EFFECTS[*].sheet` and `drawWorkLayer` in `public/work-art.js` (the canvas marks until they load); `tree-fall` from `drawAtWork`'s `treesFalling` in `public/app.js`; the props in `propItem`, `public/ambient.js`; the lone parent's poses through `scenePose` in `public/courtship.js` | `wood-pile-1`..`-4` and `<figure>-<pose>` for all eight cast figures for every pose of the two requests (people at work items 1-12 and 14; ambient life item 1), `volunteer-`/`regular-` `-clean-rifle`, `-camp-sit`, `-camp-cook` (ambient life item 3), the five `fx-*` sheets and `tree-fall` (people at work item 15), and `washtub`, `woodpile-frontier`, `hens-pecking` (ambient life item 2), at the sizes their requests give |
| **Area B — children, babies and sickness** (2026-09-28; request 2026-09-26 — children at play, babies; — people at work, item 13; 2026-09-27 — sickness; 2026-09-28 — the oldest child going for help; 2026-09-27 — the milk cow on the run) | `claude-girl-play.png`, `claude-boy-play.png`, `claude-smallchild-play.png`: `girl-play-*`, `boy-play-*`, `smallchild-play-*` (`-play-run`, `-play-run-s`, `-play-run-n`, `-play-gallop`, `-play-hide`, `-play-kneel`, `-play-sit-doll`, `-play-hoop`). `claude-girl-chores.png`, `claude-boy-chores.png`, `claude-smallchild-chores.png`: `girl-scatter-*`, `boy-scatter-*`, `smallchild-scatter-*`, `girl-shoo-*`, `boy-shoo-*`, `smallchild-shoo-*`, `girl-gather-*`, `boy-gather-*`, `smallchild-gather-*`, `girl-carry-water-*`, `boy-carry-water-*`, `smallchild-carry-water-*`, `girl-speak-*`, `boy-speak-*`, `smallchild-speak-*`, `girl-tug-*`, `boy-tug-*`, `smallchild-tug-*`. `claude-infant.png`: `infant-crawl-*` (and `infant-crawl-w-*`), `infant-cry-*`, `infant-sleep-*`. `claude-hold-baby-women.png`, `claude-hold-baby-men.png`: `rust-woman-hold-baby-*`, `teal-hold-baby-*`, `indigo-hold-baby-*`, `blue-girl-hold-baby-*`, `rust-hold-baby-*`, `elder-hold-baby-*`, `blue-hold-baby-*`, `ochre-hold-baby-*`, and each one's `-carry-baby-walk-*` (`rust-woman-carry-baby-walk-*`, `teal-carry-baby-walk-*`, `indigo-carry-baby-walk-*`, `blue-girl-carry-baby-walk-*`, `rust-carry-baby-walk-*`, `elder-carry-baby-walk-*`, `blue-carry-baby-walk-*`, `ochre-carry-baby-walk-*`; east, `-s`, `-n`). `claude-sick-rest.png`: `*-sick-rest-s-1` and `*-sick-rest-e-1` for the eight cast figures and the three children (`rust-sick-rest-*`, `teal-sick-rest-*`, `elder-sick-rest-*`, `blue-sick-rest-*`, `rust-woman-sick-rest-*`, `indigo-sick-rest-*`, `ochre-sick-rest-*`, `blue-girl-sick-rest-*`, `girl-sick-rest-*`, `boy-sick-rest-*`, `smallchild-sick-rest-*`), `infant-sick-1`. `claude-mark-sick.png`: `mark-sick`. `claude-sickness-icons.png`: `icon-rest-road`, `icon-camp-apart`, `icon-nurse-home`. `claude-children-icons.png`: `icon-child-stick-horse`, `icon-child-doll`, `icon-child-tag`, `icon-child-hide`, `icon-child-cart`, `icon-child-hoop`, `icon-child-marbles`, `icon-child-hens`, `icon-flee-hide`, `icon-flee-bundle`, `icon-road-lookout`, `icon-road-sing`, `icon-road-little-ones`, `icon-camp-fire`, `icon-ferry-help`, `icon-share-food`, `icon-ford-carry`, `icon-child-help`, `icon-flee-cow` | The children's poses through `littleClip` and `entityClip` in `public/motion.js` (a `drawn` pose, taken by `miniPerson` in `public/app.js` once `clipReady` says it can be drawn, else the older stand-in); `STROKES.shoo`, `.gather`, `.scatter` and `.water` (`drawn`) in `public/work-art.js`; a held or carried baby drawn in its holder's frame (`carriesBaby` in `drawWorld`), no longer beside them; `-sick-rest` in `grownClip` (`restingSick`) and `infant-sick` for a sick baby; `mark-sick` in `.panel-sick-mark` (`paintSickMark`, `public/app.js`); every icon by its key through `drawIcon` (`icon-<key>` first, `public/family-panel.js`) | Every frame and clip of the same name, as items 1-5 of request 2026-09-26, item 13 of 2026-09-28 (people at work), items 1-3 of 2026-09-27 (sickness), `icon-child-help` and `icon-flee-cow` ask |
| **Area C — soldiers, battles and famous people** (2026-09-28; modules `battle-cast`, `battle-soldiers`, `battle-works`, `esparza-family`; the kit in `scripts/claude-art/battle-kit/`) | The cast in a fight (clips `<cast>-fire-reload`, `<cast>-battle-load`, `-battle-injured`, `-battle-reclining`): `rust-fire-reload-*`, `rust-load`, `rust-ramrod`, `rust-injured`, `rust-reclining`, `teal-fire-reload-*`, `teal-load`, `teal-ramrod`, `teal-injured`, `teal-reclining`, `elder-fire-reload-*`, `elder-load`, `elder-ramrod`, `elder-injured`, `elder-reclining`, `blue-fire-reload-*`, `blue-load`, `blue-ramrod`, `blue-injured`, `blue-reclining`, `rust-woman-fire-reload-*`, `rust-woman-load`, `rust-woman-ramrod`, `rust-woman-injured`, `rust-woman-reclining`, `indigo-fire-reload-*`, `indigo-load`, `indigo-ramrod`, `indigo-injured`, `indigo-reclining`, `ochre-fire-reload-*`, `ochre-load`, `ochre-ramrod`, `ochre-injured`, `ochre-reclining`, `blue-girl-fire-reload-*`, `blue-girl-load`, `blue-girl-ramrod`, `blue-girl-injured`, `blue-girl-reclining`. The armies: `bearers-carry-*`, `volunteer-rest-sit`, `regular-rest-sit`, `volunteer-sleep`, `regular-sleep`, `volunteer-loophole-fire-*`, `regular-loophole-fire-*`, `volunteer-crowbar-*`, `volunteer-dig-*`, `volunteer-parapet-fire-*`, `skirmisher-run-e-*`, `skirmisher-kneel-fire-*`, `volunteer-bank-climb-*`, `figure-wading-*`. Works: `musket-stack`, `breastwork-packs-*`, `barricade-street`, `sandbag-breastwork`, `regular-march-column-*`, `ammunition-crate`, `padre-carts-*`, `flag-come-and-take-it-no-star*`, `gonzales-flag-work-half`, `gonzales-flag-work-no-star`, `army-camp-*`, `cannon-alamo-*`. Famous people (no likeness claimed): the Esparza family: `ana-esparza-*`, `maria-de-jesus-*`, `enrique-esparza-*`, `francisco-esparza-*`, `burial-party-walk-e-*`, `esparza-seated` | `public/battle-view.js` (`poseOf` `cast`, the figures' `alt` fallback, `drawFallen`, `drawCannon`, `drawGun`, `drawBreaches`, `drawWorks`, `personArt`), `public/app.js` (a member with an appearance in their own cast), `public/chase-view.js`, `public/army-view.js`, `sim/battles/coleto.mjs` (`cover: 'grass'`), `public/claude-person-art.js` and the famous people's `art` keys in `sim/people.mjs`. Each is drawn first and the library stand-in it replaced is drawn while its sheet loads. | Each request's own contract. Not drawn by Claude because Astra delivered them on `main` after the plan was written (2026-09-28): Austin, Urrea, Deaf Smith, Karnes (with his crowbar), Neill, Lamar, Sherman, Rusk, Hockley, McCulloch, Johnson, Grant and Seguín's mounted walk. Condelle, the eight officers of `famous-officers` (Kimbell, Martin, J. W. Smith, Horton, W. P. Smith, Smither, Sánchez Navarro, Barragán), Castrillón's north and south walks and the Gonzales gun's three settlers were drawn by Claude and deleted when Astra's own were merged (2026-10-02, 2026-10-03) |
| **Area D — riders, horses, wagons, carreta, ferry, steamboat** (2026-09-28; drawn on the four-legged rig `kit/quadruped.mjs` and `kit/vehicles.mjs`, at half size) | `claude-ride-children.png`: `girl-ride-*`, `boy-ride-*`, `smallchild-ride-*` (e/s/n, 4 each). `claude-ride-tejano.png`: `tejano-rider-ride-*`. `claude-ride-volunteer.png`: `volunteer-mounted-*` (walk e/s/n, trot, idle, fire; clips `volunteer-mounted`, `volunteer-ride-e`/`-s`/`-n`). `claude-ride-famous.png`: `seguin-ride-*`, `sutherland-ride-*`. `claude-dragoon-wounded.png`: `dragoon-wounded-led-*`. `claude-foragers.png`: `forager-*`. `claude-milk-cow.png`: `milk-cow-*`. `claude-herd.png`, `claude-herd-scatter.png`: `herd-*`. `claude-limber.png`: `limber-mules-*`. `claude-family-mule.png` (2026-10-03): `mule-walk-*`, `mule-idle-*` (the family's mule on its halter); `claude-family-mule-saddled.png`: `mule-saddled-walk-*` (saddled, the rider laid over it by the page). `claude-cart.png`: `cart-travel-*`, `cart-idle-*`. `claude-carreta-loaded.png`: `carreta-loaded-travel-*`. `claude-wagon-ox.png`, `claude-wagon-ox-ns.png`: `wagon-ox-*` (covered, `-loaded-`, `-empty-`, and since 2026-09-29 `-open-`: the tail with its cover drawn back, the last part of D5). `claude-wagon-drivers.png`: `rust-woman-wagon-driver-*`, `indigo-wagon-driver-*`, `ochre-wagon-driver-*`, `blue-girl-wagon-driver-*`, `girl-wagon-driver-*`, `boy-wagon-driver-*`, `smallchild-wagon-driver-*`. `claude-wagon-riders.png`: `*-ride-wagon-*` (both casts and the children, e/s/n) | `seatedClip` (`CLAUDE_RIDING_FIGURES`, `CLAUDE_DRIVING_FIGURES`) and `passengerClip` in `public/motion.js`, drawn by `drawSeated` in `public/app.js` (a rider whole in an open cart or carreta); the cow, the foragers, the cart and the laden carreta in `public/app.js`; the family's mule in `miniAnimal` and under a rider in `drawSeated` (`public/app.js`) and `entityClip` (`public/motion.js`); `createChaseView` in `public/chase-view.js`; the dragoon and rider branch, the packhorse, `drawHerd`, `drawFallen` and `drawPerson` in `public/battle-view.js`; `sceneClip` in `public/town-scenes.js`. Each asks for the Claude clip first and falls back to the older stand-in. `wagon-ox-*` since 2026-09-29: `wagonRigClip`, `WAGON_RIG` and `seatLayout(..., rig)` in `public/motion.js`, drawn by `drawSeated` - the wagon and its ox one drawing under the driver, `-open-` with riders sat whole in the tail (`bedLayout(..., rig)`); the two drawn apart while the sheet loads | Each item's contract in its request; the frame and clip names above are the names to deliver. Every one stays on *What Astra still needs to make* |
| **Area E — buildings, houses, towns, Béxar, the Alamo, interiors** (2026-09-28; the wagon's tools above) | **House pieces** (`scripts/claude-art/areas/house-pieces.mjs`, cut from Astra's own house-modules pixels where a piece is her picture seen another way, built in her pen's projection with her own materials where new): `claude-house-back.png` `house-round-back-*`, `house-hewn-back-*` (the pen from behind); `claude-house-roof-join.png` `house-roof-join`, `house-roof-join-partial`, `house-roof-join-chimney` (one roof over two pens, ridge given); `claude-house-jacal.png` `house-jacal-posts`, `house-jacal-wattle`, `house-jacal-thatch`; `claude-house-plot.png` `house-chimney-double` (foot given), `house-shed-frame`, `house-floor`, `house-loft`; `claude-house-ends.png` `house-porch-end`, `house-shed-room-end`, `house-passage-floor-end`, `house-passage-roof-end`; `claude-interior-saddlebag.png` `interior-saddlebag`; `claude-house-loopholed.png` `house-loopholed`; `claude-window-lit.png` `window-lit-*` (`adobe-flat`, `house-jacal`, `jacal-poor`, `cabin-small`). **Béxar's people** (`bexar-people.mjs`, the rig): `bexar-man-*`, `bexar-woman-*`, `bexar-girl-*`, `bexar-boy-*` (walk, idle, speak, listen, carry); `dancers-couple`, `fiddler-play`, `lantern-post`; `sentry-bell-ring`, `townsfolk-leave`. **Buildings** (`civic.mjs`, `far-places.mjs`): `bexar-san-fernando-1836`, `bexar-governors-palace-1836`, `san-fernando-tower-1836`, `mission-concepcion`, `fort-velasco`, `sawmill-steam`, `stone-house-nacogdoches`, `plantation-sugar`, `blockhouse-village`, `townsite-bay`, `tavern-house`. **The lone parent's wedding** (request 2026-09-29, items 3-5; `scripts/claude-art/areas/courtship-places.mjs`): `claude-courtship-farms.png` `farm-neighbour-porch` (Astra's `cabin-wide` with a porch built across it in her shingles, the door open, her bench, bucket and rail fence, a chopping block) and `farm-neighbour-ramada` (her `jacal-ramada` with an olla, her bench and tripod pot, a picket corral); `claude-courtship-table.png` `wedding-table`; `claude-courtship-yard-morning.png`, `-noon`, `-evening`: `courtship-yard-morning`, `courtship-yard-noon`, `courtship-yard-evening` (960 by 540 paintings, `backdrop: true`, anchored at the foot). The farms and the table carry the logical height of a person beside them, so the page draws them at the person's height | `drawLogPen`/`drawJacalPen`/`drawHousePlot` in `public/house-plot.js` (back walls where a chimney stands on the door's gable; the join roof laid after the near pen; the double chimney and its roof); `INTERIORS.saddlebag` in `sim/interior-data.mjs` and `public/interior.js` (`fallback` the dog-run); `BEXAR_CAST` in `sim/town-scenes.mjs` and `public/town-scenes.js` (the couple, the fiddler, the lanterns); `TOWNSFOLK`, the `sentry-bell` and `townsfolk-leave` figures, the loophole groups (`house-loopholed`), `drawNight` (`window-lit-*`) and `drawFlag` (the tower) in `public/battle-view.js`; `public/bexar-layout.js`/`bexar-art.js`; `sim/town-layouts.mjs`/`public/town-art.js`; `public/place-art.js`; `concepcionScenery` in `sim/battles/concepcion.mjs`. Each falls back to the library art it stood in for while its sheet has not loaded; the farms through `FARM_ART`, the table in the wedding scene and the yards through `BACKDROP`, in `public/courtship.js` | Every one of these by the same name (items E1-E14 of docs/CLAUDE_ART_PLAN.md): her own pen from behind, join roof with its ridge marked, jacal stages, double chimney with its foot, shed frame, floor and loft overlays, end views, saddlebag rooms, loopholed house and lit windows; Béxar's townspeople, dancers, fiddler, lantern, sentry and leaving family; the researched buildings. The tower frame is registered to Claude's church: when her San Fernando comes, the tower comes with it |
| **Area F — terrain, trees, the norther, fields, icons, marks and effects** (2026-09-28; the marks and portraits above) | `claude-gale-pole.png`, `-log`, `-large`, `-biome`, `-ground`: the gale poses `pine-*-wind`, `cedar-*-wind`, `mesquite-*-wind`, `live-oak-*-wind`, `elm-*-wind`, `post-oak-*-wind`, `blackjack-*-wind`, `pecan-*-wind`, `hackberry-*-wind`, `sweetgum-*-wind`, `palm-sabal-*-wind`, `cypress-bald-*-wind`, `magnolia-*-wind`, `beech-*-wind`, `cottonwood-wind`, `scrub-wind`, `reeds-wind`, `prickly-pear-wind`, `marsh-cordgrass-wind`, `dune-grass-wind`, `thicket-thorn-*-wind`, `palmetto-wind`, `yucca-wind` - each Astra's own upright painting bent by Claude (scripts/claude-art/land/bend.mjs), with loose leaves drawn over it. `claude-trees-1836.png`: `anacua-*`, `ebony-*`, `tupelo-*`, `cedar-elm-*`, `willow-*`, `pine-shortleaf-*` (each `-pole`, `-log`, `-large`); `claude-stumps-1836.png`: `stump-hickory`, `stump-walnut`, `stump-ash`, `stump-oak`, `stump-oak-live` (scripts/claude-art/land/tree.mjs, stump.mjs). `claude-smoke-rise.png`: `farm-smoke-rise`, `town-smoke-rise` (8 frames each). `claude-banks-creeks.png`: `riverbank-cut-e`, `riverbank-cut-w`, `river-bend`, `creek-bed-dry`, `creek-ford`; `claude-marsh-edge.png`: `marsh-edge-1`, `marsh-edge-2`, `marsh-edge-3`; `claude-grades.png`: `night-grade`, `moonlight-grade`, `dawn-grade` (layers multiplied over the view). `claude-live-oak-mott.png`: `live-oak-mott` (four of her live oaks over their shade; drawn by `drawScenery` for a grove); `claude-tree-fall.png`: `tree-fall` (4 frames, her post oak turned about its foot; played by area A's `treesFalling` when a person's felling words move on). The work's effects `fx-*` are area A's set (row above), kept as the one set on 2026-09-29. **The lone parent's wedding** (request 2026-09-29, item 6; `scripts/claude-art/areas/courtship-icon.mjs`, `claude-courtship-icon.png`): `icon-ask-neighbours`, a father and his girl walking hand in hand up a track to a neighbour's cabin with smoke from its chimney | `GALE_POSES` (`CLAUDE_GALE`) in `public/weather-art.js`, drawn by `drawGroundDetail` and `postOak` in `public/app.js` in a hard norther; without the sheet, the sheared upright. The trees and stumps: `own` and `ownStump` in `KINDS` (`sim/woods.mjs`), sent in the woods catalogue and drawn first by `drawGroundDetail`; without the sheet, the picture each kind borrowed. The smoke: the `fires` in `drawWorld` (`window.__firesDrawn[].art`); the night fire: `drawScenery` and `drawNight` in `public/battle-view.js`; the banks and creeks: `concepcionScenery` and `grassScenery` (`sim/battles/`) with a `fallback` to `earth-rampart` (`river-bend` drawn, not yet placed); the marsh edge: `drawWorks` (a marsh); the fog: `drawFog`; the grades: `drawGrade` from `drawNight` and the Alamo's numeric light. Each falls back to what stood in before; `icon-ask-neighbours` on the special button (`#ask-neighbours` in `public/app.js`) | Each `<tree>-wind` in the `weather-norther` style, her own painting of the tree in a gale, at the upright's scale and anchor. The six species at three sizes and the five stumps in the `trees-colonies` and `land-clearing` styles |

**Until 2026-09-28 not attempted, and now planned.** On 2026-09-16 the animation sheets and whole buildings were left on the
nearest library art, because a hand-written SVG could not match her painted style without jarring beside it. Since the owner's
direction of 2026-09-28 the style kit and the person rig draw them - still plainly not hers up close, but the same size, anchor,
palette and identity at play size - and every remaining item is in [CLAUDE_ART_PLAN.md](CLAUDE_ART_PLAN.md). Their rows stay
under *Stand-ins in use* until Claude's version lands, and the item stays on Astra's list after that.

---

Open requests, newest first. Each one says why it is needed, what exactly to deliver, how it plugs
into the existing pipeline, and how it will be checked. When a request is delivered, mark it
**Delivered** with the date and move the details into [ART_MANIFEST.md](ART_MANIFEST.md) by running
`npm run build:art`; do not delete it from here.

---

## Request 2026-10-03 — riders in every vehicle

**Status: open; stand-ins in use since 2026-10-03 (see *Stand-ins in use*).** The owner, 2026-10-03: *"create art requests if they
don't already exist for having characters in vehicles. what i mean by vehicles is anything they can ride. we should also add the
ability to buy a mule in town. mules were a lot cheaper than horses."* A family can now buy a mule at the stock pens
(docs/TOWNS.md §4h, sim/beasts.mjs): ridden by one person at four miles an hour, a pack of ten loads, led home on a halter, standing
in the yard beside the horses, carrying one more of the family on its journeys together (sim/company.mjs).

**Surveyed 2026-10-03: everything a person rides or is carried in, and what is drawn or asked for already.** `<family>` is Astra's
ten family figures of 2026-10-02 (`father-hat`, `father-beard`, `father-moustache`, `father-straw`, `mother-braid`, `mother-loose`,
`mother-scarf`, `mother-straw`, `youth-boy`, `youth-girl`); `<cast>` her old eight (`rust`, `teal`, `elder`, `blue`, `rust-woman`,
`indigo`, `ochre`, `blue-girl`); `<child>` the children (`girl`, `boy`, `smallchild`). The ways of going are sim/travel.mjs `MODES`
(on foot, the horse, the mule, the ox and wagon) and the seats of a family's journey together sim/company.mjs `seatPlan` (a driver to
each wagon, cart or carreta, riders in its bed, one rider on each horse or mule, babies in arms, small children carried).

| Ridden or ridden in | Who | Already | Asked here |
| --- | --- | --- | --- |
| The horse, in the saddle | `<cast>` | delivered 2026-09-21 (`<cast>-ride-*`) | - |
| | `<child>` | asked, D3 (Claude's `<child>-ride-*` in place) | - |
| | `<family>` | asked, D17 (request 2026-10-03, *the family figures' missing poses*, item 6) | - |
| | a baby in the rider's arms | not drawn: the baby is drawn with nobody (`carriedWithRider`) | item 5 |
| **The mule** (new) | the mule itself | the Grass Fight's pack mules (D12) are the Mexican train's, under grass | item 1 |
| | `<family>`, `<child>`, `<cast>` riding it | - | items 2 and 3 |
| The ox | nobody rides it: it draws the vehicle, or walks under the family's packs (`ox-packed-walk-*`, delivered) | - | - |
| The wagon, on the box | `<cast>` | `rust`, `teal`, `elder`, `blue` delivered; the second cast and children asked, D4 (Claude's in place) | - |
| | `<family>` | asked, D17 | - |
| The wagon, cart or carreta, in the bed | `<cast>`, `<child>` | asked, D5 (Claude's `*-ride-wagon-*` in place); the same seated layer sits in a cart or a carreta | - |
| | `<family>` | - | item 4 |
| The carreta's or the ox wagon's driver on foot, at the oxen's head | everybody | a walking driver was "welcome" in request 2026-09-16 and never asked | item 6 |
| The ferry flatboat | everybody, and their horse, mule or wagon | the boat is delivered (`ferry-flatboat`, `-laden`) and stays at its landing | item 7 |
| The steamboat *Yellow Stone* | a family's own man crossing with the army, April 12-13, 1836 | `steamboat-laden` paints the army on her deck | item 8 |
| A small child carried, a baby in arms, walking | `<cast>`, `<family>` | asked, B3, B14, B20 | - |

In the frontier-v1 style ([ART_STYLE.md](ART_STYLE.md)), at the scale of `horse-walk` (1.5 of a person) for the mule, the mounted
cell for riders (`mounted-courier-*`, drawn at 1.8 of a person, `MOUNTED_HEIGHT`), and the scale of `wagon-covered` for the bed.
East mirrored for west everywhere, as every cycle is.

1. **The mule** (priority 2) - a brown mule of the 1830s with long ears, a light muzzle and belly, a roached mane and a tufted tail,
   smaller-boned than the family's chestnut horse but about its height: `mule-idle` (standing on its halter, east, 1-2 frames),
   `mule-walk-e`, `-s`, `-n` (on a rope halter, led, 4 frames each), `mule-saddled-walk-e`, `-s`, `-n` (bridled, a plain saddle on a
   blanket, 4 frames each; the rider is items 2-3) and `mule-packed-walk-e`, `-s`, `-n` (a pack saddle with the family's sacks and
   tools lashed on, as `ox-packed-walk` carries them, 4 frames each). Today: Claude's `mule-walk-*`, `mule-idle` and
   `mule-saddled-walk-*`; without them the chestnut horse a little smaller. Plugs into `miniAnimal` in `public/app.js` and the
   animal branch of `entityClip` in `public/motion.js` (the packed walk once the page knows the mule carries a load).
2. **The family figures and the children on the mule** (priority 2) - `<family>-mule-ride-e`, `-s`, `-n` and `<child>-mule-ride-e`,
   `-s`, `-n`: the whole rider and the whole mule in one frame, legs astride, feet in the stirrups, hands at the reins, as the
   painted horse-and-rider sheets are; a child of four with the stirrups out of reach. Today: their own figure cut at the waist over
   Claude's saddled mule (`drawSeated`, `onMule`). Plugs into `seatedClip` in `public/motion.js` (a rider whose mount is a mule asks
   for `<figure>-mule-ride-<dir>` before the composite) and `drawSeated` in `public/app.js`.
3. **The old cast on the mule** (priority 3) - `<cast>-mule-ride-e`, `-s`, `-n`, for a family that chose no looks, as item 2.
4. **The family figures riding in the bed** (priority 2) - `<family>-ride-wagon-e`, `-s`, `-n`, seated, anchored at the hip, as D5's
   riders (request 2026-09-25, *riders, walkers and the cart*, item 2): the same layer sits in the open tail of the wagon, a cart and
   a carreta. Today: their figure cut at the waist in the bed. Plugs into `passengerClip` and `bedLayout` in `public/motion.js`.
5. **A baby in the rider's arms** (priority 3) - `infant-held-ride` (a swaddled baby held in the crook of an arm, 1-2 frames, east, with
   `-s`): a layer the page lays at a rider's chest, on the horse, the mule or the wagon's box, so the baby the server seats with its
   carrier (sim/company.mjs, step 2) is seen. Today: not drawn (`carriedWithRider` in `public/motion.js`).
6. **The driver walking at the oxen's head** (priority 3) - `<family>-goad-walk-e`, `-s`, `-n` and `<cast>-goad-walk-*`: walking beside
   the ox with a long goad, 4 frames each - how a carretero and most ox drivers went (*"Brother drove the oxen"*, Harris,
   `HIST-TEX-442`). Today: seated on the box or the carreta's frame. A code choice would put the carreta's driver on foot with it.
7. **The ferry carrying people** (priority 3) - `ferry-flatboat-crossing` (4 frames): the flatboat moving along its rope, the ferryman
   hauling hand over hand at the upstream side, the deck clear and its deck line flat, so the page can stand the family's own people,
   and their horse, mule or wagon, on it. Same view, scale and waterline as `ferry-flatboat`. Today: nothing - a ferry is an hour's
   wait laid on the road (sim/travel.mjs `FERRY_MINUTES`), and the boat stays at its landing. Plugs into `drawFerry` in
   `public/landscape-art.js`, once a crossing is on the travel record.
8. **The steamboat with a family's own man aboard** (priority 3) - `steamboat-laden-deck`: the laden underway loop of request 2026-09-18
   with a clear stretch of main deck forward, its deck line marked, where the page can stand a family's own man (and his horse or
   mule) among the painted army. Today: `steamboat-laden` alone; nobody's own figure is aboard. Plugs into the Yellow Stone in
   `drawWorld`, `public/app.js` (`yellowStone`, sim/houston.mjs).

**Added the same day**, the owner's answer to whether a mule should pull: *"yes, but speed should adjust if it's too heavy. mules would
be perfect for the carreta right though?"* A mule now draws the carreta, the cart and the wagon (sim/draught.mjs, docs/TOWNS.md §4h),
alone or as a pair; nothing in the library draws a mule in harness:

| Ridden or ridden in | Who | Already | Asked here |
| --- | --- | --- | --- |
| A mule in harness, before the carreta, the cart or the wagon | one mule or a pair | - (the Grass Fight's `limber-mules-walk` is the Mexican artillery's, at a gun) | items 9 and 10 |

9. **The mule in harness** (priority 2) - `mule-harness-walk-e`, `-s`, `-n` (one mule in a collar or breast strap with its traces running
   back, a bridle, no saddle, walking, 4 frames each) and `mule-pair-harness-walk-e`, `-s`, `-n` (two mules side by side in harness,
   the near one a length ahead on the side view, 4 frames each), the family's brown mule of item 1, at the scale of `horse-walk`,
   drawn **without** the vehicle, as the ox before a cart or carreta is (`miniWagon` draws the vehicle behind it). Today: Claude's
   `mule-walk-*` (the mule on its halter) where the ox would stand; a pair's second mule walking alongside. Plugs into `miniAnimal`
   (the `ox` part of `seatLayout('wagon', ...)`) in `public/app.js`.
10. **The wagon behind mules as one rig** (priority 3) - `wagon-mule-e`, `-s`, `-n` (the covered wagon with one mule at its tongue,
    loaded and empty covers, 4 frames each, as Claude's `wagon-ox-*`) and `wagon-mules-*` with the pair. Today: a mule-drawn wagon
    is drawn apart - the mule, then the side-view wagon - because the one-drawing rig has its ox painted in (`muleDrawn` in
    `drawSeated`). Plugs into `wagonRigClip` and `WAGON_RIG` in `public/motion.js`.

**Check.** On the land at 1366x768 the family's mule reads as a mule beside the chestnut horse - the ears, the tufted tail, the
plainer head - and never as a second horse; a mother riding the mule to town reads as herself on a mule; a youth in the wagon's bed
reads as sitting; the ferry and the steamboat read as carrying the family's own people. `npm run test:shops` records the mule bought,
standing in the yard and ridden (`window.__seatedDrawn` names the mule under the rider).

## Request 2026-09-30 — the House icon on the bar

**Status: open; a stand-in in use since 2026-09-30 (see *Stand-ins in use*).** The owner, 2026-09-30, *"Move Idle and House off"*
the family's rows ([FAMILY_PANEL.md](FAMILY_PANEL.md), amendment 2026-09-30): the button that opened the rooms of the house - where
the furniture and the goods are set out - is now the last icon of the action bar, *House*.

1. **The icon** (priority 2) - `icon-go-inside`: the cabin's open door with the hearth's light inside and a chair or a chest by it,
   in the action-icon contract (request 2026-09-15; 128 by 128, read at 34-48 CSS px). It must not be taken for raising the house
   (`icon-build-house`), which can stand on the same bar while the house goes up. Plugs into `PANEL_ICONS` in
   `public/family-panel.js` (`go-inside`), which today draws `icon-build-house`.

**Check.** Beside *Build the house* on one bar at 38 px, the two are told apart without their names.

## Request 2026-10-03 — the family figures' missing poses

**Status: open.** The owner, 2026-10-03: update the art requests freely with what we need. Astra's family figures of 2026-10-02
(docs/FAMILY_ART_2026-10-02.md) are the parents and adolescents of every family with chosen looks: the eight parents
`father-hat`, `father-beard`, `father-moustache`, `father-straw`, `mother-braid`, `mother-loose`, `mother-scarf`, `mother-straw`
(one for each head choice), and the adolescents `youth-boy` and `youth-girl` (ten to seventeen). Written `<family>` below: all
ten. Each has the east, south and north walks, the standing front, east and back, a two-pose work cycle, rest, hurt rest, the
listening front and back and speaking (`FAMILY_POSES` in `public/avatar-identity.js`). Everything else the game asks of a grown
person is drawn today in her nearest pose (`avatarBinding`): a pose with `rest` in it her rest, a hurt one her hurt rest, a
standing one her standing front, carrying her walk, and **every other piece of work her two-pose work cycle** - reading the ground
on a hunt, sowing, mending, nursing, trading, felling, and so on. Surveyed 2026-10-03 against every pose the game asks for (the
work table `STROKES` and `WORK` in `public/work-art.js`, `grownClip`/`littleClip`/`ambientClip` in `public/motion.js`,
`sim/ambient.mjs`, the battle cast poses, the wedding's gestures, the seats on a horse and a wagon). Her old cast (`<cast>`:
`rust`, `teal`, `elder`, `blue`, `rust-woman`, `indigo`, `ochre`, `blue-girl`) is still drawn for anybody whose family chose no
looks, and has these poses or has them asked of it already; this asks for the same poses in her family figures, so a student's
own people are drawn at their work in the figure they chose. The children's own poses are request 2026-10-03, *the children's
own actions* (B17-B19), not here. People contract (request 2026-09-12): the figure's own logical height and foot baseline,
east-facing and mirrored for west, at the scale of her 2026-10-02 sheets; the adolescents at theirs.

1. **The everyday poses her old cast has** (priority 1) - `<family>-search` (looking about, a hand shading the eyes, bent to read
   the ground: the hunter reading sign, the scout), `<family>-sow` (broadcasting seed from a bag at the hip, 2-4 frames),
   `<family>-carry` (walking with a sack or a bundle on the shoulder, 4 frames, east, with `-n`/`-s` if she will), `<family>-repair`
   (seated, mending, 2), `<family>-care` (kneeling, tending somebody or a fire, 2) and `<family>-trade` (standing, offering
   something across a counter, 2). Today: her work cycle, and carrying her walk. `test:hunt` records the hunter reading the ground
   in her work cycle until `-search` lands.
2. **The work poses already asked of the old cast** (priority 2), the same names in her family figures: the felling, notching,
   lifting, digging, splitting, reaping, shooting, fishing, gathering, carpentry, butchering, drill and guard, staking and
   fire-tending of request 2026-09-28 *people at work* (`-chop`, `-notch`, `-lift`, `-dig`, `-dig-well`, `-split`, `-reap`, `-aim`,
   `-fire`, `-fish`, `-gather`, `-carpentry`, `-butcher`, `-drill`, `-guard`, `-stake`, `-tend-fire`; items A1, A3, A4, A6-A10,
   A13-A17); the seated, kneeling and walking idle work of *ambient life* (A5: `-whittle`, `-mend-harness`, `-sew`, `-shell-corn`,
   `-clean-rifle`, `-wash`, `-pipe`, `-cards`, `-sweep`, `-carry-water`); the milking (B15, `-milk`) and pegging the tent (A30,
   `-pitch-tent`). Today: her work cycle, with the stand-in tool in her hands where the work table draws one (`HAFTS`).
3. **Holding and carrying the little ones, and lying sick** (priority 2) - `<family>-hold-baby` and `<family>-carry-baby-walk`
   (`-n`, `-s`) as B3, `<family>-carry-child-walk` (`-n`, `-s`) as B14, and `<family>-sick-rest` (`-e`, `-s`) as B8. Today: her
   walk with the baby beside her, and her hurt rest.
4. **A family's person in a fight** (priority 2) - `<family>-fire-reload` (with `-load` and `-ramrod`), `<family>-injured` and
   `<family>-reclining` as C1. Today: her work cycle while the others fire, her hurt rest.
5. **The wedding's gestures** (priority 2) - `<family>-greet`, `-shy`, `-laugh`, `-vow` as A19. Today: her speaking and standing.
6. **On the horse and the wagon seat** (priority 2) - `<family>-ride-e`, `-ride-n`, `-ride-s` (her own painted horse-and-rider, as
   the eight of 2026-09-21) and `<family>-wagon-driver-e`, `-n`, `-s`, `-w` (as the old cast's). Today: the composite seat - the
   old cast's rider or driver - as her write-up says.

**Plugs into** `FAMILY_POSES` in `public/avatar-identity.js` (add each pose name once it is on disk; nothing else changes - the
work table, the hunt and the battle already ask for `<figure>-<pose>`), `HAFTS` in `public/work-art.js` (retire a figure's row
when its own tool pose lands) and the seat tables in `public/motion.js` (`RIDING_FIGURES`, the drivers). **Check.**
`npm run test:hunt` shows the hunter's own `-search`; `npm run test:work` shows the felling in `-chop`, not the work cycle with
a drawn axe.

## Request 2026-10-03 — the children's own actions

**Status: open.** The owner, 2026-10-03: *"if you need more kid animations, just update the art requests for now."* Astra's child
figures (`boy`, `girl`, `smallchild`; docs/FAMILY_ART_2026-10-02.md) have only walking, standing, resting and hurt poses
(`CHILD_POSES` in `public/avatar-identity.js`), and Astra's rule is *no adult fallback for a child action*: so today a child at a
chore, at play, talking, or sitting indoors out of the weather is drawn standing still. These are the actions the game gives children
(docs/CHILDREN.md; `sim/childhood.mjs`, `sim/milking.mjs`, `sim/shelter.mjs`). People contract (request 2026-09-12), drawn at a
child's size as the existing child sheets are. `boy` and `girl` each; `smallchild` where marked.

1. **Play outdoors** (priority 1) - `<child>-play`: running and skipping, a hoop or a ball, 4 frames, east, with `-n` and `-s`;
   `smallchild` too. The yard's play and auto play (`sim/childhood.mjs`; the fenced yard, docs/CHILDREN.md §14).
2. **Playing indoors, sitting** (priority 1) - `<child>-play-sit`: sitting on the floor with a corn-husk doll, marbles or a whittled
   toy, 2 frames, east; `smallchild` too. Children sheltering from the weather with someone 10 or older (docs/CHILDREN.md §13).
3. **Feeding the hens and gathering eggs** (priority 2) - `<child>-feed-hens` (scattering corn from an apron or a pan, 2 frames,
   east) and `<child>-gather-eggs` (stooping to a nest with a basket, 2 frames, east). The hens and eggs chores.
4. **Milking** - already asked as `<child>-milk` in item B15 (request 2026-10-02, milking); listed here so the set is complete.
5. **Talking to a grown person** (priority 2) - `<child>-listen-s` and `<child>-speak-s` (looking up, 2 frames each); `smallchild`
   too. A child calling a parent aside, and the family's chatter.
6. **Leading the little ones** (priority 3) - `<child>-lead` for `boy` and `girl`: walking with a small child by the hand, 4 frames,
   east, with `-n` and `-s`. The "Keep the little ones walking" job on the road.

**Plugs into** `CHILD_POSES` and `avatarVariant` in `public/avatar-identity.js` (add each pose name once it is on disk) and the
work and play drawing in `drawWorld` (`public/app.js`). **Check.** At 1366x768 on the family's land a girl of eight reads as
playing, feeding hens or sitting at play indoors - not standing still, and never as a grown figure shrunk to her size.

## Request 2026-10-02 — paths and the yard

**Status: open; stand-ins in use since 2026-10-02 (see *Stand-ins in use*).** The owner, 2026-10-02: *"it's weird seeing characters
walk over trees. paths should be cut to facilitate quick, reasonable movement on a families land. there should be an option to fence
in a yard too."* (sim/land-paths.mjs; docs/LAND_GRANTS.md §10, docs/CHILDREN.md §13). Two new works on the family's bar, *Cut a path*
and *Fence a yard*, and paths and a yard drawn on the family's land.

1. **The path icon** (priority 2) - `icon-cut-path`: a narrow trodden path running off between two stumps, an axe leaning on one, in
   the action-icon contract (128×128, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%). It must not be
   taken for cutting the lane (`icon-cut-lane`), which can stand on the same bar. Plugs into `PANEL_ICONS['cut-path']` in
   public/family-panel.js, which today draws `icon-cut-lane`.
2. **The yard icon** (priority 2) - `icon-fence-yard`: a cabin's corner with a low rail fence round its dooryard and a child inside
   it, same contract. Plugs into `PANEL_ICONS['fence-yard']`, which today draws `icon-fence-plot`.
3. **A trodden path** (priority 3) - `ground-path-straight` and `ground-path-bend`: worn earth a person's width across, seen from above
   at the map's scale, tiling along a line, with grass at its edges. Plugs into `drawLandPaths` in public/app.js, which today strokes
   a soft brown verge with a packed line down the middle, as the roads are drawn.

**Check.** At 1366x768 on a family's land, a path through the timber reads as a way somebody walks, between the stumps of the trees
cut for it, and the two icons are told apart from the lane's and the plot fence's on one bar.

## Request 2026-10-02 — the tent, and going in out of the weather

**Status: open; stand-ins in use since 2026-10-02 (see *Stand-ins in use*).** The owner, 2026-10-02: *"families should put up tents to
get out of the rain if their house isn't finished. when there's inclement weather, families that have members that aren't on a
specific task that needs them outdoors, those characters should seek shelter."* (sim/shelter.mjs, docs/SETTLING_IN.md §4c). A family
with no roof puts up its wagon sheet as a tent by the camp, and in rain, a storm or a norther its people with no task and every child
go in: under the tent, into the house once a pen is roofed, or under the wagon.

1. **The tent** (priority 2) - `homestead-tent`: a wagon sheet of worn osnaburg stretched over a ridge pole between two forked posts,
   pegged down at the sides, the front open, a bedroll and a box just inside; the building style of `house-modules`, corner-on, anchored
   at the base centre, about the height of 1.7 people. **Not** a new army tent: a family's cloth off its wagon (`HIST-GONZ-027`,
   `HIST-TEX-1090`). Plugs into the tent drawn at `world.land.tent` (`tentAt` in `drawWorld`, public/app.js), which today draws the
   library's canvas `tent`.
2. **Putting it up** (priority 2) - `icon-pitch-tent`, in the action icon contract (128×128, one silhouette, thin dark outline, reads at
   34–38 CSS px and dimmed to 40%): the sheet half up, a person pegging one side. Plugs into `PANEL_ICONS['pitch-tent']`
   (public/family-panel.js), today a stroked tent.
3. **The shelter mark** (priority 3) - `mark-shelter-house` and `mark-shelter-tent`, in the mark contract (96×96, no text, reads at 22
   CSS px): a roof, and the tent, each with rain slanting past. Plugs into `.panel-shelter-mark` (public/style.css), today a roof and a
   tent drawn as masks.
4. **Pegging it down** (priority 3) - `<cast>-pitch-tent` for the eight cast figures: knelt, driving a peg with a maul, 2 frames, east.
   People contract (request 2026-09-12). Plugs into `WORK['pitch-tent']` (public/work-art.js), today the house's notching stroke.

**Check.** At 1366x768 a family's camp with its tent reads as a family's camp under its own wagon sheet, not as an army's; on a row the
mark tells "in the house" from "under the tent" without words.

## Request 2026-10-02 — a grown person carrying a child of two to five on the road

**Status: open; stand-in in use since 2026-10-02 (see *Stand-ins in use*).** The owner, 2026-10-02: *"Adults carry small kids"* -
when a family goes on foot (leaving or losing its wagon, or with none), each child of two to five without a seat is carried by a
grown person, or a boy or girl of fourteen or more, one child each (`sim/company.mjs`, step 5; docs/SCRAPE.md).

1. **The carrying walk** (priority 2) - `<cast>-carry-child-walk` for each of the eight cast figures: a child of two to five on the
   hip or on the back, arms round the carrier's neck, walking, 4 frames, east, with `-n` and `-s`. The child is bigger than the
   baby of `-carry-baby-walk` (B3): legs hang to the carrier's hip. People contract (request 2026-09-12). Plugs into `roadCarrier`
   and `carriedAt` in `drawWorld` (`public/app.js`), which today draw the child's own figure at the carrier's hip.

**Check.** On the road at 1366x768 a mother carrying her child of three reads as one figure carrying a child, not as a woman with a
baby, and not as two people.

## Request 2026-10-02 — the hunter's first-person field

**Status: open; a stand-in in use since 2026-10-02 (see *Stand-ins in use*).** The owner, 2026-10-02: *"when a character goes hunting,
when they see an animal the player should see an alert. if players click on it in time, then a first person mini game starts where
they have to aim and hit the moving animal. if they miss, the animal runs away."* (docs/WOODS_AND_BUILDING.md §5.2, `public/hunt-aim.js`).
The field is the student's view over the hunter's shoulder for the few seconds an animal crosses it. The animals are Astra's
(`deer-bound`/`deer-alert`, `turkey-bound`, `bear-alert-bound`, `bison-run`, `pronghorn-bound`, `mustang-gallop`, `wild-cattle-run`,
`javelina-alert-run`, `geese-flight`), drawn at the field's scale; what is painted in canvas now is everything else.

1. **The backdrops** (priority 2) - `hunt-field-timber`, `hunt-field-brush`, `hunt-field-open`, each also `-winter` (bare timber, dead
   grass): 1600×900, opaque, at a standing man's eye height looking across a clearing or the open prairie, **the horizon at 51% of the
   height** (the field's own, `VIEW.horizon` 4.6 of 9 in `sim/hunt-aim.mjs`), the far cover along it, and **the middle third of the
   width clear of trunks and brush from the horizon down**, where the animal runs and stops. Nearer cover may frame the two sides and the
   top corners (the hunter is looking out of it). No animal, no people, nothing that reads as a target. Plugs into `paintField`
   (behind the animal) and `paintNear` (the framing cover in front of it, as a second transparent layer if it overlaps the lane).
2. **The rifle** (priority 2) - `hunt-rifle`: a Kentucky long rifle seen from just behind and above the hunter's right shoulder, the
   browned octagonal barrel running up toward the middle of the view, a brass front sight at the muzzle, the cherry stock and the lock
   low at the right edge, cut by the frame. Transparent, the **pivot at the muzzle**, so the page can turn and slide it to follow the
   sights. Plugs into `drawRifle` in `public/hunt-aim.js`.

**Check.** At 1366x768 and 1024x600, a deer stopped at the middle of the field reads at once against the backdrop, and the rifle reads
as a rifle, not a stick.

## Request 2026-10-03 — the herd and the herder

**Status: open; stand-ins in use since 2026-10-03 (see *Stand-ins in use*).** The owner, 2026-10-03: *"when players bring cattle and
hogs, why don't we see their real herds? shouldn't a character that's assigned to tend the herd have appropriate skills and abilities
for that?"* ([STOCK.md](STOCK.md) §10, `sim/stock.mjs`, `public/herd-view.js`). The family's real herd is now drawn on its land, every
head the server counts up to a cap, the young smaller, in near the house at night and gathered about whoever is out after it; the
herder's hand shows as a mark on the row. The owner encourages art requests; these are what would make it look as it plays.

1. **Longhorns walking** (priority 2) - `cattle-longhorn-red-walk`, `-pied-walk`, `-dun-walk`: the delivered range longhorns
   (`cattle-longhorn-*-graze`, `-idle`) walking, 4 frames east (mirrored west), and `-n`, `-s` 2 each. Plugs into `herdFigures`
   (public/herd-view.js), which today walks them as Astra's farmyard `cow-walk`, a milk cow and not a longhorn.
2. **The young** (priority 2) - `calf-graze` (2), `calf-walk` (4): a longhorn calf, about three fifths of the cow, rangy, no horns to
   speak of; `piglet-root` (2), `piglet-walk` (4): a sucking pig of the razorback kind, striped or spotted, three fifths of the hog.
   Today the grown clips are drawn at `YOUNG_SIZE` (0.6) beside one of the grown head.
3. **A group** (priority 3) - `herd-cattle-group`, `herd-hogs-group`: six to eight head grazing close as one sprite, 2 frames, at the
   longhorn's scale. Drawn for the part of a big herd that is not drawn head by head; today one longhorn or hog with "×54" beside it.
4. **The horn mark** (priority 3) - `mark-herd`: a longhorn's head, front on, in the family panel's mark style (`mark-sick`,
   `mark-need`), readable at 16 px on the right of a portrait; the page colours it (bronze, gold, lit green) and draws the notches.
   Today a horned head drawn in the style sheet as a mask (`.panel-herd-mark`).
5. **The herder on horseback working cattle** (priority 2) - for the eight cast figures and `boy`, `girl`: `-ride-herd`, on the
   family's horse at a walk with a coiled rope, turning a cow, 4 frames east, and `-ride-herd-idle` (2). Today the family's horse grazes
   beside the herder, who is drawn on foot at the search stroke, and is not drawn in the yard while out (`rangeHorses`).

**Check.** At the class's own camera on the family's land (about 400 pixels to the mile, a person 8 pixels tall) a cow, a calf, a hog and
a pig are told apart; at 1366x768 the mark on a portrait reads as a longhorn's head, not as the sick mark or the hunger bowl.

## Request 2026-10-02 — the milking icon and the milking pose

**Status: open; a stand-in in use since 2026-10-02 (see *Stand-ins in use*).** The owner's milking of 2026-10-02 (*"yes, but make it a
chore that kids can do. on the road it can be done by adults and set to auto."*; sim/milking.mjs, docs/STOCK.md §9): a new work on the
family's bar, at home and on the road east, done by a child of seven or a grown person.

1. **The milking icon** (priority 2) - `icon-milk-cow`: somebody on a three-legged stool with a pail at a cow's flank, in the action
   icon contract (128×128, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%). Plugs into
   `PANEL_ICONS['milk-cow']` (and `milk-road`) in public/family-panel.js, which today draws the cow on a rope (`icon-flee-cow`).
2. **The milking pose** (priority 3) - for the cast and the children's sheets, `-milk`: sitting on a stool at a cow's flank, the pail
   between the knees, 2 frames, east. Until it is drawn the person is drawn in the tending pose (`care`, public/work-art.js
   `WORK['milk-cow']`); no cow is drawn at home (the herd is on the range and is never drawn).

**Check.** On a row at 1366x768 the icon reads as milking, not as driving a cow or riding the range.

## Request 2026-09-30 — the hunger mark and the food gauge's sack

**Status: open; stand-ins in use since 2026-09-30 (see *Stand-ins in use*).** The owner's hunger of 2026-09-30 ([HUNGER.md](HUNGER.md),
`sim/hunger.mjs`): *"update the ui to better facilitate player awareness of where the family resources stand and the severity of
consequences of running out. do it with highlights, colors, etc. don't use text and over explain."* Two small marks, no text,
nothing of the body: the page colours them by the stage, so each is drawn as one flat silhouette the page can tint (or in the
panel's mark style, with the stage's colour left to the page's ring).

1. **The hunger mark** (priority 1) - `mark-hunger`: an empty wooden bowl, seen a little from above, in the family panel's mark
   style (`mark-sick`, `mark-need`), readable at 18-22 px on a portrait's top-right corner. Plugs into `.panel-hunger-mark` in
   `panelRow` (public/app.js), which today is a bowl drawn in the style sheet as a mask.
2. **The food gauge's sack** (priority 1) - `mark-food`: a tied grain sack, full, readable at 14 px beside "Food 15.5". Plugs into
   `.food-icon` in `paintLarder` (public/app.js), a sack drawn in the style sheet as a mask today.

**Check.** At 1366x768 and 1024x600 the bowl reads as "hungry" and not as "sick" or "idle" beside the other marks, and the sack as
food; both still read when the page tints them amber, ember and red.

## Request 2026-09-29 — the family's start: Tejano and free Black families, and the people of the road east

**Status: open; stand-ins in use since 2026-09-29 (see *Stand-ins in use*).** The owner, 2026-09-29: *"build all of these as
possible starts except for the native american options ... ensure that skin tone options based on the race of the characters is
locked to what is realistic"*, and of the Black family's start, *"Free Black family"* ([FAMILY_CREATION.md](FAMILY_CREATION.md),
*The family's start*; `sim/starts.mjs`, `sim/tejano.mjs`, `sim/start-story.mjs`). A class now deals a Tejano family of De León's
colony at Victoria, a free Black family near Liberty in a class of ten or more, and Anglo-American families everywhere else; each
family's parents may be given only the skin tones realistic for its start, and the children take after them. On the road east in
1836 families pass enslaved people, taken east by those who held them or slipping away toward the Mexican army, who are nobody's
to play. Middle-school classroom: dignified, ordinary people, never a caricature.

1. **The people of the road east** (priority 1) - `road-man`, `road-woman`, `road-elder`, `road-child`: enslaved men, women and
   children of the Brazos plantations in homespun and osnaburg (a plain shirt and trousers, a plain dress and a head wrap, a
   straw hat), bundles tied on their backs or carried; walking east (4 frames), resting by the road (2), standing waiting their
   turn at a ferry (1, south). **No chains, no whips, nobody cowering or shown as property**: people on a road, tired, with
   children beside them. And `planter-wagon-halted`: a loaded covered wagon standing with its oxen out. People contract (request
   2026-09-12). Plugs into `GROUP` in `sim/start-story.mjs` and `crowdDrawables` in `public/ambient.js`. Research: Dilue Rose
   Harris's reminiscences, "the planters from Brazoria and Columbia with their slaves were crossing" at Lynchburg (`HIST-TEX-787`).
2. **A Tejano ranchero family's dress** (priority 2) - `tejano-man` (a low-crowned, wide sombrero, a short jacket, calzoneras open
   down the outer leg over white drawers, a sarape over the shoulder in cold weather) and `tejano-woman` (a rebozo over the head or
   shoulders, a full skirt and a loose white chemise), each in every pose the cast has, in the layered form of A18 so the palette
   dyes skin, hair and clothes. The best contemporary description found is Josiah Gregg's of New Mexico in the 1830s
   (`HIST-TEX-789`): **an interpretation for Texas, not a record of it**. Plugs into `avatarVariant` in `public/avatar-art.js`.
3. **Faces and hair painted for the darker tones** (priority 2) - `dark-man`, `dark-woman`, `dark-girl`, `dark-boy`: a free Black
   family's parents and children in the colonists' same dress (the record gives them no different clothes), with darker skin
   painted as painted rather than dyed, and hair in close curls, short, or braided and wrapped. Until then the palette dyes the
   cast's painted skin, which keeps its light and shade but not a face painted for the tone. Plugs into `public/person-palette.js`
   and `public/avatar-art.js`.
4. **Joining Seguín's company** (priority 2) - `icon-join-seguin`: a Tejano horseman in a wide sombrero riding to join a line.
   Action icon contract. Plugs into `PANEL_ICONS` in `public/family-panel.js`.

5. **The priest at a Tejano wedding** (priority 2) - `priest-read`: a Catholic priest of 1835 in a dark cassock, bareheaded, reading
   from a small book held open in both hands, 2 frames, east-facing; and `priest-idle-s`. Invented and unnamed (`FIC-GONZ-987`), not a
   portrait of anybody. People contract. Plugs into `figureOf` in `public/courtship.js` (the wedding's officiant).

**Check.** At play size (a person 40 px) and in How We Look's preview: the road's people read as people walking and resting, not as
a crowd scene about anything else; the Tejano parents read as ranchero dress; a dark-skinned face keeps its features. Nothing on any
of it is a text or a likeness.
## Request 2026-09-29 — the homecoming's scenes

**Status: open; Claude-drawn stand-ins for items 1 and 2 since 2026-09-29 (see *Claude-drawn stand-ins*), library poses for the rest
(see *Stand-ins in use*).** The owner's decision of 2026-09-29 (docs/audits/2026-09-29-triage.md D10 and D8; docs/FLASHBACK.md §12):
each family's video ends with the family coming home - *"they see their family return home, see what's left, begin to rebuild if
necessary, ceremonially bury lost family members, and then the head of household sits down to count up what they have left"* - and
the intact farm sold to a land agent. The scenes are drawn in the family's own yard over the whole 854 by 480 video, a grown person
about 130 px tall (`drawYard` in `public/flashback.js`), with Astra's cast recoloured to the family's looks as every cast pose is.
Warm and dignified: a classroom watches them. No body, no coffin, no grief acted out; the war's dead were not brought home, so the
family sets up a marker on its own land.

1. **A wooden marker** (priority 2) - `grave-marker`: a plain rounded-top board of weathered pine, about four feet high, no words and
   no symbol, at the head of a low mound of earth with a few wildflowers. Prop contract, a grown person's height as its logical height.
   Several stand side by side for a family that lost more than one.
2. **What the family counts** (priority 3) - `coins-and-paper`: a short stack of silver coins and two loose ones, a folded bill of sale
   with handwriting too small to read, a small leather purse, lying on a table top (her `home-table`). Prop contract, as item 1.
3. **Counting at the table** (priority 2) - `<cast>-count` for the eight cast figures: seated at a table's height, counting coin from one
   hand into a stack, an account book open, 2 frames, east. People contract. Until then the seated rest (`-rest`) sits behind her table.
4. **Remembering** (priority 2) - `<cast>-remember` (kneeling on one knee at the marker, hat against the chest, head bowed, 1 frame, east)
   and `<cast>-mourn` (standing, head bowed, hat in hand, seen from behind and from the front, 1 frame each). Until then the kneeling
   nursing pose (`-care`) and the listening back view (`-listen-n`).
5. **The land agent, and raising the new walls** (priority 3) - `land-agent-idle` and `land-agent-trade`: a townsman buying land after
   the war (a dark frock coat, a tall hat, a satchel of papers), standing, and holding out a purse; invented, not a portrait of anybody.
   And `<cast>-raise-log`: two grown people lifting a log up onto a wall, 2 frames. Until then Astra's `elder` in his `-trade` pose,
   and the carrying cycle and the notching (`-carry`, `-repair`) beside her `house-*-site` and `-walls`.

**Check.** In the scenes at 854 by 480 beside Astra's cast at 130 px: the marker reads as a family's own quiet memorial and not as a
fright; the coin as money on a table; a seated figure behind the table as somebody at it; the agent as a townsman and not a soldier.

---

## Request 2026-09-29 — the lone parent's wedding

**Status: open; Claude-drawn stand-ins in place since 2026-09-29 (see *Claude-drawn stand-ins*), library fallbacks listed under
*Stand-ins in use*.** The owner's decision of 2026-09-29 ([FAMILY_CREATION.md](FAMILY_CREATION.md), *The lone parent's path*;
`sim/courtship.mjs`, `public/courtship.js`): a family rolled with one parent is offered, on reaching its land, a special ability
that takes the parent and the children to two neighbours' farms to ask for help raising a house. Travel is skipped; the student
sees the family talk with the first family, meet the second (whose son or daughter is the parent's own age, and some shy, gentle
flirting), and then both families gathered at the family's own land for a short wedding by bond, and afterwards the family of two
parents beside the house the neighbours raised. The owner (2026-09-29): *"use fades to black to smooth transitions. carefully
build this, and any new placeholder art needed. it should feel special."* The scenes are drawn over the whole screen at about
960 by 540 (a person about 150 to 190 px tall), which is larger than the map ever draws a person, so every piece is checked at
that size as well as at play size. Middle-school classroom: nothing but shy glances, a compliment, a laugh and joined hands.

1. **Four gentle poses for the eight cast figures** (priority 1) - for each of `rust`, `teal`, `elder`, `blue`, `rust-woman`,
   `indigo`, `ochre`, `blue-girl`: `<cast>-greet` (a hand raised in greeting, or a hat touched, 2 frames), `<cast>-shy` (the head
   a little down and turned aside, the hands together in front: a shy glance, 2 frames), `<cast>-laugh` (a hand to the chest or
   mouth, the head tipped back a little, 2 frames), `<cast>-vow` (standing, both hands held forward at the waist as if holding a
   partner's hands, 1 frame). People contract (request 2026-09-12): logical height and foot baseline of the cast, east-facing,
   mirrored for west. Plugs into `scenePose` in `public/courtship.js` (drawn through `drawAvatar`, so a family's chosen colours
   recolour them as they do every cast pose).
2. **The commissioner reading the bond** (priority 1) - `elder-read-paper`: the elder figure in a dark coat, standing, a paper
   held open in both hands and read from, 2 frames, east-facing. Plugs in as item 1. He is an invented local officer
   (`FIC-GONZ-950`), not a portrait of anybody.
3. **Two neighbours' farmsteads** (priority 1) - `farm-neighbour-porch` (a log cabin with a roofed porch along its front, its door
   open, a bench and a water bucket on the porch, a rail fence running off to one side, a chopping block) and
   `farm-neighbour-ramada` (a jacal with a thatched roof, a brush ramada giving shade in front of it, an olla hanging from its
   beam, a small picket corral). Building contract: corner-on three-quarter view, anchored at the base centre, drawn beside the
   cast at their heights. Plugs into `FARM_ART` in `public/courtship.js`.
4. **The wedding supper** (priority 2) - `wedding-table`: planks on two trestles with the neighbours' dishes on them - a pan of
   cornbread, a ham, an iron pot, a coffee pot and tin cups. Prop contract. Plugs into the wedding scene in `public/courtship.js`.
5. **Three yards to stand the scenes in** (priority 2) - `courtship-yard-morning`, `courtship-yard-noon`,
   `courtship-yard-evening`: the ground of a farm yard with trees behind and sky above, 960 by 540, no people and no buildings,
   the light of morning, noon and a warm evening. Plugs in as the scene's backdrop (`BACKDROP` in `public/courtship.js`); until
   then the sky and ground are painted in canvas (see *Stand-ins in use*).
6. **The ability's icon** (priority 1) - `icon-ask-neighbours`: a parent and a child walking up a track toward a neighbour's
   cabin with smoke from its chimney. Action icon contract (128 by 128, one silhouette, the family panel's stroke). Plugs into the
   special button (`#ask-neighbours` in `public/app.js`).
7. **A neighbour with a fiddle** (priority 3) - `rust-fiddle` and `ochre-fiddle`: a farmer standing and playing a fiddle at the
   wedding supper, 2 frames, east-facing. Until then the wedding's fiddler is the Béxar fandango's (`fiddler-play`), a
   townsman's dress at a farm wedding (see *Stand-ins in use*).

**Check.** In the scenes at 960 by 540 and on the map's grass at a person of 40, 77 and 150 px beside Astra's cast: a greeting
reads as a greeting, a shy glance as shy and not as sad, a laugh as a laugh, two people facing each other in the vow pose look
as though their hands meet; the commissioner reads a paper; the farmsteads read as two different families' homes; the table as a
supper laid out of doors. Nothing on any of it is a text or a likeness.

---

## Request 2026-09-28 — ambient life

**Status: open; stand-ins in use since 2026-09-28 (see *Stand-ins in use*).** Owner, 2026-09-28: *"i don't want to see npc just
standing around when they're idle. they should participate in various things to make them appear active."* Every idle person a page
sees is now drawn at an activity ([AMBIENT.md](AMBIENT.md), `sim/ambient.mjs`), and most of them borrow a pose. Delivery contract as
the cast sheets: transparent PNG on the ground anchor, the cast's logical height, east-facing mirrored for west, two to four frames
looping; props as the equipment sheet.

1. **Everyday work in the cast's poses** (priority 1) - for each of `rust`, `rust-woman`, `teal`, `indigo`, `blue`, `blue-girl`,
   `ochre`, `elder`: `-whittle` (seated, a knife at a stick, 2 frames), `-mend-harness` (seated, leather across the knees, 2),
   `-sew` (seated, needle and cloth, 2), `-shell-corn` (seated, an ear over a basket, 2), `-clean-rifle` (seated, a rifle across the
   knees and a rod, 2), `-wash` (kneeling at a tub, 2), `-pipe` (seated, a pipe raised, 2), `-cards` (seated, cards in hand, 2),
   `-sweep` (a broom, 4), `-carry-water` (walking with a bucket in each hand, 4, east). Plugs into `ambientClip` (public/motion.js):
   the server already names the activity (`amb.a`), so each lands by a one-word change to the pose it asks for.
2. **Props** (priority 2) - `washtub` (a wooden tub with a board), `woodpile-frontier` (split rails stacked by a cabin),
   `hens-pecking` (two hens, 2 frames). Plugs into `propItem` (public/ambient.js).
3. **Soldiers at rest** (priority 2) - `volunteer-clean-rifle`, `volunteer-camp-sit`, `volunteer-camp-cook` (2 frames each) and the
   same for `regular-`. Plugs into `CAMP_TEXIAN` / `CAMP_MEXICAN` (sim/ambient.mjs).

**Check.** At a town's street and a family's yard zoomed to a figure of about 40 px, a keeper whittling reads as whittling and not as
somebody mending a hoe; a woman washing reads as washing; a man with a pipe as smoking; at a camp a rifle is being cleaned, not loaded.
## Request 2026-09-28 — the garden — WITHDRAWN 2026-09-28

**Withdrawn the same day**: the owner made crops independent of the seasons ("5 minutes for cotton and 3 for corn"), and the
garden, which existed only because corn and cotton could not go in in the autumn, went with the seasons (`sim/crops.mjs`). No
stand-in is in use. Kept below as it was asked.

**Status: open; stand-in in use since 2026-09-28 (see *Stand-ins in use*).** The farming year (owner, 2026-09-28: "Seasons and a
limited market"; `sim/seasons.mjs`): on the real land the autumn's and the winter's crop is a garden of turnips and greens, planted
on the family's cleared plots and six weeks in the ground. Drawn by the field surface exactly as corn and cotton are
(`public/field-surface.js`, docs/FIELD_ART.md): selected from the projected crop and state, many small plants in rows over a plot.
Delivery contract as `corn-young` / `cotton-young` in the nature atlas: transparent PNG, ground anchor at the stem's foot, the same
size in the sheet as the young corn, with a `-wind` sway if it is cheap.

1. **Young garden** (priority 1) - `garden-young`: a low rosette of turnip and mustard leaves, dark green, a hand high.
2. **Ripe garden** (priority 1) - `garden-mature`: the same, fuller, the white-and-purple shoulder of a turnip showing at the soil.

**Check.** At field zoom a planted garden reads as low leafy greens, not as young cotton, and a ripe one as ready to pull; a
bare field still draws no crop.

## Request 2026-09-28 — the oldest child going for help

**Status: open; stand-in in use since 2026-09-28 (see *Stand-ins in use*).** The owner's decision of 2026-09-28, "The oldest child
steps up" ([FAMILY_PANEL.md](FAMILY_PANEL.md) §20, sim/acting.mjs): a child of seven or more acting for a family with nobody grown
at home may run to the nearest neighbours for help (`child-help`). Delivery contract as the children's icons of 2026-09-26: one
frame in the family icon atlas, 48 px, the family panel's stroke and palette.

1. **Going for help** (priority 2) - `icon-child-help`: a child running along a track toward a neighbour's cabin, an arm out.
   Plugs into `PANEL_ICONS['child-help']` in public/family-panel.js (a stroked glyph now: a running figure and a house).

**Check.** On a child's row among the children's works, the icon reads as a child going somewhere for somebody, not as play.

## Request 2026-09-28 — people at work

**Status: open; stand-ins in use since 2026-09-28 (see *Stand-ins in use*).** Owner, 2026-09-28: *"When someone is working, I
should see them actually working, not just standing near their task."* Every activity the server can report - each chore's id,
and working about the place - is now drawn **at** the work from one table, `WORK` in `public/work-art.js`, and
`tests/work-art.test.mjs` fails if a chore appears in `sim/` that the table does not draw. The cast sheets hold painted cycles of
hoeing (`-work`), sowing, mending, nursing (`-care`), searching, trading and carrying, and those are used as they are. For every
other work the nearest of them stands in, with the tool, a lean or a pace, and chips or earth drawn in code on the pose's own
strike. This asks for the work itself.

**Delivery contract** - the people sheets' (request 2026-09-12, *The delivery contract*): square 1254 by 1254 transparent RGBA,
4 columns by 4 rows, one figure a cell, the same logical height, foot baseline and identity as the figure's existing sheets,
east-facing and mirrored for west. **Each pose is wanted for each of the eight grown cast figures** (`rust`, `teal`, `elder`,
`blue`, `rust-woman`, `indigo`, `ochre`, `blue-girl`), so a four-frame pose is two sheets (four figures a sheet, one figure a
row). Clip names `<figure>-<pose>`; the frame order is the one given, and **the frame on which the tool lands is named in the
delivery note** (the renderer times the chips, the earth and the work sounds to it: `beat` in `STROKES`). Texas 1835 tools
only (`HIST-GONZ-027`/`028`): a felling axe, a maul and wedges, a grubbing hoe or mattock, a spade, a corn knife, a drawknife, a
long rifle, a cane pole. Nothing is ever pointed at a person, and no blood.

1. **Felling with an axe** (priority 1) - `-chop`, 4 frames: the axe back over the shoulder, the swing, the bite (head in the
   trunk at hip height), the pull back; the figure side on to a tree just off the frame's right edge. Felling, cutting the lane,
   clearing timber, the bee tree, fetching logs, cutting a carreta's wheels.
2. **Splitting rails** (priority 2) - `-split`, 4 frames: a maul raised, coming down, on the wedge in a log lying on the ground
   (the log in the frame), and back. Fencing.
3. **Raising the house** (priority 1) - `-notch`, 4 frames: astride or beside a wall log at knee height, notching its end with
   an axe; and `-lift`, 2 frames: stooped with both hands under a log end, then the log end at the shoulder, drawn so two people
   facing each other across the frame's middle read as one log lifted between them. Working on the house and helping raise one.
4. **Digging** (priority 1) - `-dig`, 4 frames: a spade driven in with the foot, levered, the earth thrown to the figure's left
   (behind), and back; and `-dig-well`, the same four drawn waist-deep in a square hole with a low bank of earth round it. The
   well, grubbing out brush and roots (a mattock is acceptable), the trench at Béxar (replaces `rust-work` there, see
   *Stand-ins in use*).
5. **Harvesting corn** (priority 2) - `-reap`, 4 frames: reaching up to an ear, snapping it off, dropping it in a basket or sack
   at the hip, stepping on. Harvesting the field.
6. **Making things** (priority 3) - `-carpentry`, 4 frames: sitting at a shaving horse drawing a drawknife toward the body
   (two frames), then boring with an auger (two). Furniture and a carreta's axle.
7. **A civilian with a rifle** (priority 2) - `-aim` (1 frame: a long rifle at the shoulder, level) and `-fire` (2 frames: the
   recoil, lowering), in the figure's own clothes, not a soldier's. Practice at the mark and the hunt's shot; the smoke stays
   the library's `musket-smoke`.
8. **Fishing** (priority 2) - `-fish`, 2 frames: sitting on the bank with a cane pole out over the water, the line down to a
   float, and the pole twitched up. Fishing at home and on the road.
9. **Stooping to gather** (priority 2) - `-gather`, 2 frames: bent to the ground picking something up, then putting it in a
   basket or an apron. Oysters, kindling and chips, eggs, and tying up a bundle on the Scrape.
10. **Dressing meat** (priority 3) - `-butcher`, 2 frames: at a plank table cutting a joint wrapped in cloth, or salting it
   down in a barrel. Non-graphic: no carcass, no blood.
11. **In the army's camp** (priority 3) - `-drill` (4 frames: stepping out with a rifle at the shoulder, a volunteer in his own
   clothes) and `-guard` (2 frames: standing sentry, rifle sloped, turning the head). The family's man with Houston's army.
12. **Surveying** (priority 3) - `-stake`, 2 frames: a mallet raised over a stake and driving it. Pacing the ground stays the
   walk cycle.
13. **Children's work** (priority 2) - for `girl`, `boy` and `smallchild`: `-shoo` (arms flung up, waving a cloth at birds or
   a cow, 2 frames), `-gather` (2 frames, as item 9) and `-carry-water` (a small pail in each hand, walking, 4 frames east and
   `-n`/`-s`). The hens are the existing request's `-scatter` (request 2026-09-26, item 1).
14. **Keeping a fire** (priority 3) - `-tend-fire`, 2 frames: kneeling, feeding a stick into a small fire (the fire in the
   frame) and blowing on it. The camp's fire on the Scrape.
15. **The work's effects** (priority 2) - small transparent effect sheets on the same ground anchor, 3 frames each, one
   played from the strike: `fx-wood-chips` (pale chips flying from a cut), `fx-earth-toss` (a spadeful of dark earth), `fx-dust`
   (a low puff where a hoe strikes dry ground), `fx-shavings` (curls off a drawknife) and `fx-ripple` (rings round a float); and
   `tree-fall` (4 frames: a hardwood of `-log` size leaning, going over, down, a last bounce), drawn once where a tree is felled.
16. **The wood pile** (priority 1) - felling now drops its logs straight onto the family's one pile by the house (log hauling is
   being removed, 2026-09-28): `wood-pile-1` to `wood-pile-4`, a pile of wall logs seen three-quarter on the ground anchor, at
   about ten, twenty, thirty and forty logs, each about as long as `log-fallen` and no taller than a person's waist; sill logs
   of cedar or live oak may lie in it darker. One sprite a size, not logs laid side by side.

**How it plugs in.** Registered through `npm run build:art` (`SHEETS` and the clips in `scripts/build-atlas-manifest.mjs`, the
`people-` prefix so row heights are measured). Then in `public/work-art.js` the stroke's `pose` becomes the new clip's name,
its `art` becomes `'delivered'`, its `beat` the frame the delivery note names, and its `tool`, `motion` and `effect` are
deleted - `drawWorkLayer` then draws nothing over it. An effect sheet replaces its canvas marks in `EFFECTS`; the wood pile
replaces the `log-fallen` row in `drawWorld` (`window.__logPileDrawn`). `tests/work-art.test.mjs` fails on a pose the library
does not hold, so a misspelt clip is caught.

**Check.** At the family's own land zoomed to the yard (a figure about 40 px), with `npm run test:work`: a man felling is told
from a man hoeing without the words; three people on the house are three people round one house, each facing it; a woman
fishing reads as fishing at 1366 by 768; the chips and earth fly on the frame the tool lands, not a beat late; and a
child shooing birds is not taken for a child playing tag.

## Request 2026-09-27 — Mexican troops after a family on the road

**Status: open; stand-ins in use since 2026-09-27 (see *Stand-ins in use*).** The owner's decisions of 2026-09-27
([SCRAPE.md](SCRAPE.md) §11-§13): a Mexican column's file or a patrol of dragoons comes after a fleeing family, calls on it to halt
and, if it runs, fires. Drawn on the map at the battle figures' size (public/chase-view.js). Delivery contract as the battle-people
sheets: transparent PNG on the ground anchor, east mirrored for west, the regulars' and dragoons' own uniforms.

1. **A dragoon at the gallop** (priority 1) - `dragoon-gallop-e` (4 frames), `-n`, `-s`: the escort dragoon of 1836 riding hard,
   carbine slung. Plugs into the horsemen's clip in `createChaseView` (`dragoon-march` now).
2. **A dragoon firing from the saddle** (priority 1) - `dragoon-carbine-fire` (3 frames: raise, fire, lower), the horse moving.
   Plugs into the shot's moment (a flash at the hands of `dragoon-march` now).
3. **An infantryman running, and kneeling to fire** (priority 2) - `skirmisher-run-e` (4 frames) and `skirmisher-kneel-fire`
   (aim, fire, load; 4 frames), the line's regular. Plugs into the running and loading soldiers (`regular-march`,
   `regular-fire-reload` now).

**Check.** On the road east zoomed so a figure is about 40 px, eight horsemen read as coming at the gallop and firing from the
saddle, a file of infantry as men running and stopping to load, and nobody is drawn hurt.
## Request 2026-09-27 — sickness: the sick badge, the sickness icons, and the sick lying down

**Status: open; stand-ins in use since 2026-09-27 (see *Stand-ins in use*).** The owner's diseases of 2026-09-27
([DISEASE.md](DISEASE.md), `sim/disease.mjs`) put three new things in front of a student: a person who is sick, the new work the
family can give (stop the family on the road to rest a day, camp apart from a crowd, nurse the sick at home), and the sick
resting. Nothing gory and nothing of the body: a blanket, a cup, a bed of blankets on the ground. Delivery contract as the action
icons (request 2026-09-15: a 64 px square frame, transparent, the illustrated icon style) and the cast (people at the cast's
logical height on the ground anchor).

1. **The sick badge** (priority 1) - `mark-sick`: a small round mark in the family panel's mark style (`mark-need`, `mark-idle`):
   a folded blanket and a cup, or a cool cloth, readable at 22 px on a portrait's corner. Plugs into `.panel-sick-mark` in
   `panelRow` (public/app.js), which today draws the road's nursing icon in a disc.
2. **The sickness icons** (priority 1) - `icon-rest-road` (the family's wagon stopped, somebody lying by it under a blanket),
   `icon-camp-apart` (a camp up a bank on its own, away from a crowd of tents), `icon-nurse-home` (somebody sitting by a bed in a
   cabin with a cup). Plug into `PANEL_ICONS` in public/family-panel.js by their keys; registered frames replace the stand-ins
   with no change there.
3. **The sick lying down** (priority 2) - for each cast figure and the children's sheets, `-sick-rest` (lying under a blanket on
   the ground, head on a bundle, 1 frame; `-s` and `-e`), and `infant-sick` (a baby wrapped and lying). Plugs into `restingSick` in
   public/motion.js, which today draws the delivered `-injured-rest`.

**Check.** On a family's row at 1366x768 and 1024x768 the badge reads as "sick" and not as "hurt" or "idle"; on the map at a figure
of about 40 px the resting sick read as resting ill and not as wounded or dead.

## Request 2026-09-27 — the milk cow on the run, and Béxar before the bell

**Status: open; stand-ins in use since 2026-09-27 (see *Stand-ins in use*).** Two owner decisions of 2026-09-27 put new things on
the map ([STOCK.md](STOCK.md) §8, [CHILDREN.md](CHILDREN.md) §7; [surprise-at-bexar.md](battle-research/surprise-at-bexar.md) §6):
a child driving one milk cow behind the family on the Runaway Scrape, and Béxar's Tejano families packing and leaving, fifteen
Tejano volunteers riding out, and a fandango in the plaza, in the days before February 23, 1836. Delivery contract as the wildlife
and battle-people sheets: transparent PNG on the ground anchor, east mirrored for west; cattle at the logical height of the
delivered `cattle-longhorn-*`, people at the cast's.

1. **A milk cow walking on a rope** (priority 1) - `milk-cow-walk-e` (4 frames), `-n`, `-s`, and `milk-cow-graze` (2 frames): a
   gentle dairy cow of the 1830s, smaller and plainer than the range longhorn, a rope from her horns trailing behind (the child
   holding the other end is drawn by the page). Plugs into the cow drawn beside the child in `drawWorld` (public/app.js,
   `window.__cowDrawn`), which then uses the walk while the family travels.
2. **Tejano townspeople of Béxar** (priority 1) - a man, a woman in a rebozo, a girl and a boy, each `walk`, `idle-s`, `carry`
   (loading a cart), `speak`, `listen`, 1830s Béxar dress. Plugs into `BEXAR_CAST` (sim/town-scenes.mjs) as their `figure`.
3. **Tejano volunteers mounted** (priority 2) - `tejano-rider-ride-e`/`-n`/`-s` (4 frames): a Tejano horseman in a short jacket and
   wide hat with a lance or escopeta. Plugs into `bx-tejano-*`.
4. **The fandango** (priority 2) - `dancers-couple` (a couple dancing, 4 frames), `fiddler-play` (2 frames), and a `lantern-post`
   sprite (a lantern hung on a post, lit). Plugs into `bx-dancer-*`, `bx-fiddler` and the `lights` prop (public/town-scenes.js).

**Check.** At Béxar zoomed to the plaza (a figure about 40 px), the families read as Béxar's and not as colonists, the riders as
Tejano horsemen, the dance as a dance and not a crowd standing; on the road east the cow reads as a milk cow led, not as a steer
from the range.

## Request 2026-09-26 — the Esparza family

**Status: open; stand-ins in use since 2026-09-26 (see *Stand-ins in use*).** The owner, 2026-09-26: *"yes, add enrique and his
family"*. Gregorio Esparza's wife Ana and her four children are now named people at the Alamo (`sim/people.mjs`,
`sim/battles/alamo.mjs`; `docs/BATTLES.md` §14.6): going in through a window of the church on the evening of February 23, sheltering
in the sacristy beside Mrs. Dickinson through the siege and the assault, brought out and taken to Músquiz's house, and at Béxar after;
and on the afternoon of March 6 Gregorio's brother Francisco and another brother carry his body, wrapped, to the Campo Santo
(`HIST-TEX-605`-`-609`). Delivery contract as the delivered famous sheets (`scripts/art-deliveries/famous-people.mjs`): a transparent
4×4 atlas per figure, four east, two south and two north walking frames, then the poses; the logical height of `volunteer-*` for
grown people and of the library's `girl`/`boy`/`smallchild` for the children; east mirrored for west; no gore; no likeness claimed
(none survives of any of them but Enrique's photographs as an old man).

1. **Ana Salazar de Esparza** - a Tejana woman of about thirty, 1830s Béxar dress and rebozo: walk, idle, `shelter-with-children`
   (seated on the floor, an arm round a small child), `carry-toddler` (walking with a child of two on her hip), `hold-blanket` (the
   blanket Santa Anna's officers gave each woman).
2. **María de Jesús, about ten** - a Tejana girl: walk, idle, seated huddled.
3. **Enrique, a Tejano boy of about eight** - dark-haired, shirt and trousers: walk, idle, seated huddled, `look` (looking up, for
   the moment he remembered). The library's `boy` is fair-haired and stands in until this lands.
4. **A burial party** - `burial-party-walk-e` (4 frames): two Tejano men of Béxar walking one behind the other, carrying between them
   a body wrapped completely in a blanket or shroud on a litter - no face, no wound, no blood (`VISION.md` §16) - readable at 40 px
   and at 160 px. Replaces `drawBearers`' canvas bundle.
5. **Francisco Esparza** - Gregorio's brother, a man of about thirty in town clothes: walk, idle, `kneel-at-grave`.
6. **Gregorio asleep beside his family** - `esparza-seated` (sitting against a wall, musket beside him), for the night of March 5; his
   delivered sheet (`famous-esparza`) has no seated pose, so he is the volunteer's `volunteer-injured-rest` there until it lands.

**How it plugs in.** `art` in `sim/people.mjs` (`woman`, `girl`, `boy`, `small-child`, `townsman` today) becomes each person's own key,
added to `PERSON_ART` in `public/battle-view.js` with its poses by name; the burial party replaces the bundle and the second bearer in
`drawBearers`. Every `stand-in:` comment naming this request goes.

**Check.** In the sacristy at the siege frame (about 0.5 px a foot) the woman and four children read as one family and as different
people from Mrs. Dickinson and Angelina; the burial party reads at once as men carrying someone wrapped, never as a body.

## Request 2026-09-26 — the bell at Béxar

**Status: open; stand-in in use since 2026-09-26 (see *Stand-ins in use*).** The afternoon of February 23, 1836 is drawn on the
battle engine (`sim/battles/alamo.mjs` `arrival`; `docs/battle-research/surprise-at-bexar.md`): the sentry on San Fernando rings
the bell, two scouts ride out and back, the townspeople leave, the garrison runs into the Alamo. Delivery contract as the battle
people sheets: transparent PNG on the ground anchor, the `volunteer-*` logical height, east mirrored for west.

1. **The sentry ringing the bell** - `sentry-bell-ring-1`..`-4`: a man standing on a flat church roof beside a small bell arch,
   pulling the rope, then pointing west; readable at 30-60 px. Plugs into the `sentry` group of `arrival`.
2. **Townspeople leaving with a cart** - `townsfolk-leave-1`..`-4` (east): a Tejano family, a man leading a laden carreta and a
   woman with a child walking beside it. Plugs into the `townsfolk` group (civilians) of `arrival`.
3. **Dr. John Sutherland** mounted, for the ride out on the Laredo road (with the roster's other riders, request "the famous
   people", item 1).

**Check.** At the battle view's scale the bell reads as rung from the church, not as a man standing in the street.

## Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work

**Status: open; stand-ins in use since 2026-09-26 (see *Stand-ins in use*).** Owner, 2026-09-26: children too small for the farm
must be *seen* doing things - kinds of play, a child with nothing to do going to a parent and talking, babies that crawl, cry and
are held and sung to - and a family on the Runaway Scrape has work of its own ([CHILDREN.md](CHILDREN.md), `sim/children.mjs`,
`sim/childhood.mjs`, `sim/babies.mjs`, `sim/flight-work.mjs`). Delivery contract as the children's sheets of 2026-09-14
(`girl`, `boy`, `smallchild`, `infant`): transparent PNG on the ground anchor, the same logical heights, east mirrored for west;
icons as the children's icons of 2026-09-21 (128 by 128, single silhouette, thin dark outline, reading at 34-38 CSS px).

1. **Children at play** (priority 1) - for each of `girl`, `boy`, `smallchild`: `-play-gallop` (a stick horse between the knees,
   4 frames, east), `-play-run` (running, arms out, 4 frames, east, and `-n`/`-s`), `-play-hide` (crouched behind nothing, peeking,
   1 frame), `-play-kneel` (kneeling, hands at the ground, 2 frames: marbles, the toy cart), `-play-sit-doll` (sitting with a doll in
   the lap, 1 frame), `-play-hoop` (running with a stick at a hoop, 4 frames, the hoop in the frame), `-scatter` (throwing corn from a
   hand, 2 frames, hens optional). Plugs into `littleClip` in `public/motion.js`, which picks the pose from what the server says the
   child is doing; `CHILD_POSES` names what each sheet holds.
2. **A baby** (priority 1) - `infant-crawl` (4 frames, east, and `-w`), `infant-cry` (sitting up, mouth open, fists, 2 frames),
   `infant-sleep` (curled on a blanket, 1 frame).
3. **Holding a baby** (priority 1) - for each cast woman (`rust-woman`, `teal`, `indigo`, `blue-girl`) and, less often seen, each cast
   man: `-hold-baby` (a baby held to the shoulder, swaying, 2 frames, south-facing) and `-carry-baby-walk` (a baby on the hip,
   walking, 4 frames east and `-n`/`-s`). Plugs into `littleClip` (`aside.kind === 'baby'`) and the carried-baby drawing in
   `drawWorld` (`carriedAt`), which then no longer draws the infant beside her.
4. **Talking** (priority 2) - `girl-speak`, `boy-speak`, `smallchild-speak` (2 frames, east) and `-tug` (a child tugging at a grown
   person's sleeve, 2 frames, east). Plugs into `littleClip` (`talk.phase === 'talking'`).
5. **Icons** (priority 2), `icon-<key>`: `child-stick-horse`, `child-doll`, `child-tag`, `child-hide`, `child-cart` (a toy ox cart
   with two round biscuit wheels), `child-hoop`, `child-marbles`, `child-hens`; and the Scrape's `flee-hide` (a chest going into
   a hole in a river bottom), `flee-bundle` (a shawl tied up as a bundle), `road-lookout` (a child looking back down a road),
   `road-sing` (two notes over a walking figure), `road-little-ones` (a bigger child leading a small one by the hand), `camp-fire`
   (a fire of crossed sticks in the rain), `ferry-help` (hands on a ferry's rope), `share-food` (a loaf held out from one hand to
   another), `ford-carry` (a grown figure wading with a child on the back). **The children's rule of 2026-09-21 holds**: a figure in
   a child's icon reads as a child, and nothing holds an edge or a gun. Plugs into `PANEL_ICONS` in `public/family-panel.js`, whose
   entries become `{ sprite: 'icon-<key>' }`.

**Check.** At the family's own land zoomed to the yard (a figure about 40 px), a child at tag reads as running, at marbles as
kneeling, hiding as hiding; a baby crawling is not taken for a baby standing; a woman holding a baby is not taken for a woman
carrying the harvest; and each icon is told from the others at 38 px without its popup.

## Request 2026-09-26 — the Mexican advance

**Status: open; stand-ins in use since 2026-09-26 (see *Stand-ins in use*).** The Mexican columns now march through the
Runaway Scrape on the campaign map with their camps, their foragers and the smoke of the towns and farms they burn
(`sim/advance.mjs`, `public/army-view.js`, `drawWorld` in `public/app.js`; docs/SCRAPE.md). Delivery contract as the
battle people sheets: transparent PNG on the ground anchor, the `regular-*`/`dragoon-*` logical height, east mirrored for west;
no gore, nothing burning drawn close up (`VISION.md` §16).

1. **A foraging party** - `forager-ride-1`..`-4` (east): two or three Mexican horsemen, one leading a pack mule loaded with sacks of
   corn, and `forager-drive-1`..`-4`: two horsemen driving three or four head of cattle ahead of them. Plugs into the parties drawn
   round each column (`foragers` in the projection).
2. **A burning farm seen from afar** - `farm-smoke-rise` (a looping 6-8 frame clip): a tall, dark column of smoke leaning with the
   wind over a low orange glow at its foot, readable at 30-160 px; and `town-smoke-rise`, the same broader for a town. Plugs into
   the `fires` of the projection, drawn in `drawWorld`.
3. **A column on the march** - `regular-march-column` (east, 4 frames): six to eight infantry in files of three with a mounted
   officer at the head and a cart behind, for the column drawn between its camps (`drawArmy` in `public/army-view.js`, `moving`).
4. **The advance's places** (added 2026-09-26, docs/MAP_ACCURACY.md §14), each a map cutout as `public/place-art.js` gives the
   places past the box: `plantation-sugar` (Stafford's: a planter's house, a sugar mill and a gin), `blockhouse-village` (the Old
   Fort: a log blockhouse and a few cabins), `townsite-bay` (New Washington: warehouses on a bluff over the bay) and
   `tavern-house` (Mrs. Powell's: a dog-run house with a stage stop's sheds). Thompson's is a landing and its ferry is drawn as
   every ferry is. Until they come the four are named on the map and nothing more, as the army's houses of the march east are.

**Check.** At the Host's map scale a column reads as men on the march and a camp as a camp; a family's own smoke reads as a farm
burning twenty miles off, never as a campfire.

## Request 2026-09-26 — the famous people: the roster's remaining figures and poses

**Status: partially delivered; remaining stand-ins listed above.** Bonham, Almeron Dickinson and Gregorio Esparza now have their own sheets and battle/map bindings; Crockett has unarmed captive and still art; Travis has a dedicated ramp still, and Joe has doorway firing and wounded poses. The famous people are drawn and named on every
field and on the campaign map (`sim/people.mjs`, `public/battle-view.js` `PERSON_ART` and `drawPerson`, `public/famous-view.js`;
`docs/BATTLES.md` §14). Every one with a sheet of their own is drawn from it; the rest, and the poses the delivered sheets do not
have, stand in. Delivery contract as the delivered famous sheets (`scripts/art-deliveries/famous-people.mjs`): a transparent 4×4
atlas per person, four east, two south and two north walking frames, then eight poses; the logical height of `volunteer-*`; east
mirrored for west; no gore; no likeness claimed.

Castrillón is an incremental two-sheet 2×2 delivery: east idle, two-frame east walk, command, then turn, stumble, kneel and still. His east walk mirrors west; north/south walking and a composite crate rally cycle were delivered 2026-10-03. The scene now selects the scale-matched composite; step-down staging remains optional future work.

1. **Texian named cast** - W. P. Smith delivered 2026-10-03 with directional walking, animated address, listening and book/rest variants; his existing Gonzales address binds his own civilian figure. Smither delivered 2026-10-03 with directional foot movement, dispatch/conversation poses and his own mounted warning arrival at Gonzales; mounted north/south gait delivered 2026-10-03. J. W. Smith, Kimbell, Martin and Horton delivered 2026-10-03 with own directional foot walking, parley/dispatch/rest poses and mounted east walking/idle; all existing roster appearances bind their own art. Mounted north/south walking delivered 2026-10-03; specific action refinements remain open. Johnson, Neill, Hockley, McCulloch, Sherman, Rusk, Lamar and Grant have dedicated sheets; see their delivery records for the actual authored actions. Remaining characters need identity-preserving movement and scene-specific poses; firing or fallen art should only be staged where the record warrants it. Bonham and Almeron Dickinson now have their own gun-service poses. Burleson has walking, command, mounted arrival and sword-reception frames; he is not a fallen character in the current battle record. Moore now has directional walking, parley and command poses for Gonzales; no fallen pose is warranted by the current battle record. Austin now has directional walking, command, speech and document poses for his 1835 army itinerary.
2. **A Tejano defender** - Gregorio Esparza: delivered with walk, idle, serving a gun and still.
3. **Mexican officers** - Condelle delivered 2026-10-02 with directional walking, idle, animated command and map/conversation/rest variants; his existing Béxar Morelos battalion scene binds it. Sánchez Navarro delivered 2026-10-03 with directional walking, parley and document poses, bound to his existing Béxar parley. Barragán delivered 2026-10-03 with directional walking and a protective stop/intervention cycle, bound to his existing Joe rescue scene at the Alamo. Urrea now has directional walking, command, dispatch and mounted travel art; Agua Dulce and Coleto bind his mounted clip. Castañeda now has directional walking, parley and withdrawal gestures, and his own chestnut mount; the Gonzales parley binds his mounted idle. Cos has directional walking, field command, map and capitulation gestures, a prisoner pose and his own mounted movement; his Béxar march-out binds the mounted clip. Almonte has directional walking, open-hand surrender, sword offering and an interpreter gesture; the surrender, sword exchange and interpreter scene are bound at San Jacinto. Castrillón has command, cardinal walking, non-graphic fall and still; the scale-matched crate rally cycle is delivered and bound as of 2026-10-03.
4. **Crockett taken** - delivered: `crockett-captive` is a two-frame unarmed open-hand clip, and `crockett-still-side` is a non-graphic still pose. The game continues to label the fate as one disputed account (docs/BATTLES.md §2c.1).
5. **The famous fallen** - delivered: `travis-still-ramp` (lying on the gun carriage's ramp). Still poses remain for officers above.
6. **Joe** - delivered: `joe-fire-door` (firing from a doorway) and `joe-hurt-e` (hand to his side); an additional south-facing wounded frame is available as `joe-hurt-s`. These support his own account (`HIST-TEX-549`).
7. **Mounted Houston and Santa Anna** - delivered: each has two east walk frames, east idle and a south-facing frame on horseback. East mirrors west. Houston's chestnut horse is an original visual interpretation of Saracen; the existing scene still dismounts/wounds Houston at its historical beat.
8. **Ben** - delivered in `famous-ben`: a man of about thirty in a cook's clothes with directional walks, idle, speech, pot and rest poses for the walk to Gonzales with Mrs. Dickinson and Joe. Appearance is an original interpretation.
9. **The Twin Sisters on the road** - delivered in `twin-sisters-limbered`: a paired rolling clip, halt and turn poses for the two small iron guns as seen with an army's
   camp on the map. The separate field `cannon-sixpounder-*` from request 2026-09-25 "San Jacinto" item 1 is now delivered and bound to the two guns; their crew still uses the existing volunteer gun poses.

**How it plugs in.** Each person's art key is `art` in `sim/people.mjs`; a new sheet is added to `PERSON_ART` in
`public/battle-view.js` with its poses by name, and the stand-in for that person goes. Every `stand-in:` comment in `drawPerson` and
`public/famous-view.js` names this request.

**Check.** At the Alamo's church guns and at the head of San Jacinto's line each named figure reads as a different man; Crockett
taken reads as a man with empty hands; the fallen read as lying still, not hurt; nobody's face is claimed as a likeness.

## Request 2026-09-25 — the storming of Béxar

**Why.** The owner, 2026-09-25: *"go ahead, build it for every conflict. ... it's okay to make battles last longer to show the full
experience as long as it appears correct to the player."* The storming of Béxar (December 5–9, 1835) is now staged on the engine
(`sim/battles/bexar-storming.mjs`, research in docs/battle-research/staging.md §3.9, `HIST-TEX-490` to `-496`). It is street
fighting from inside stone houses, and the library has none of the pieces that make that readable.

**What**, in the frontier-v1 style and scale (people as the `volunteer`/`regular` sheets; props as `stone-tile-house` and
`palisade`), each a transparent sheet anchored at the feet or the base:

1. **A flat-roofed stone house with a parapet about four feet high and loopholes in its walls** ("a pigeon nursery", Lopez),
   one storey, as a prop; and **a man firing through a loophole** - the barrel at the wall, the man half hidden - two to four
   frames, east (mirrored west), `volunteer` and `regular`. Replaces the loophole flashes drawn at the town's own houses.
2. **A street barricade**: a ditch, an earth bank and a post palisade across a street's mouth, with an embrasure for a gun (Field;
   Dance; the 2007 archaeology under Main Plaza). Replaces `palisade` in front of the plaza's defenders.
3. **Generic crowbar reuse** beyond the delivered named Karnes cycle: a volunteer forcing the bar in additional facings (Karnes,
   Johnson's report). Replaces the ramming stroke.
4. **Digging and filling sandbags at night**: a man with a spade in a trench across a street; a low breastwork of filled sacks.
   Replaces `rust-work`/`teal-work` and `sacks`.
5. **A white flag of truce and a bugler**: delivered in `battle-signals.mjs`. A Mexican regular at Béxar and a Texian volunteer at Coleto each carry a plain white flag in idle and walking poses; a Mexican regular has a non-looping four-pose bugle call. These replace the painted canvas cloth and show the already captioned call with a musician. The red or black flag over the Mexican battery remains a separate request.
6. **Townspeople of Béxar in 1835** - women, children, an old man - walking out of a house, unhurt. Replaces the settlers' sheets.
7. **Night and moonlight**: a layer that darkens the ground and leaves flashes and smoke bright, for the entry before daylight and
   the Priest's House under the moon; it must not snap when the pace changes (`docs/MILITARY_EXPERIENCE.md`).

**How it plugs in.** Poses by name in `public/battle-view.js`: the loophole pose in the `cover === 'loophole'` branch of `draw`,
the barricade and sacks in the `cover` figures, the crowbar in `drawBreaches`, the flags in `drawWhiteFlag`, the bugler in `drawLines`, the
townspeople in `TOWNSFOLK`. Delete each `stand-in:` and its row above.

**Check.** `npm run test:battle-bexar` still passes and its screenshots in `test-results/battle-bexar-*.png` read as men fighting
from inside houses, a barricade across a street, a man at a door with a bar, and a white flag on the plaza.
## Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night
**Why.** The owner, 2026-09-25 (docs/BATTLES.md §2b): the Alamo is the longest - the thirteen days of the siege lived and the
assault the longest held fight - and a student may watch their own man fall on the wall. It is built on the engine
(`sim/battles/alamo.mjs`, docs/BATTLES.md §7) with stand-ins for all of this (*Stand-ins in use*, the rows naming this request).
**What**, in the frontier-v1 style, at the figures' scale:
1. **Scaling ladders**: delivered `alamo-scaling-ladders` has two carried-walk frames with four regulars and east/west set-ladder facings; `regular-ladder-climb` has four frames that resolve to an alternating two-step climb. The renderer moves this climber along the existing path (`HIST-TEX-500`, `-501`).
2. **The guns served**: delivered `cannon-18pdr` depicts a heavy iron gun on a garrison carriage in both facings with recoil; delivered `cannon-siege-battery` depicts a Mexican gun behind a low earth bank, both facings with recoil. Delivered `canister-burst` supplies a non-looping cone of smoke and dust for dated canister shots, layered with the existing muzzle flash and live puffs. The 18-pounder art is an interpretive period silhouette, not an exact portrait of a surviving gun.
3. **Men on a wall**: volunteers firing over a parapet - the body from the waist up over the top of a wall - east, west, north and
   south, with a loading frame below the parapet.
4. **Night and dawn**: a night grade and a dawn grade for ground and figures, so the assault from five to half past six reads as
   dark lifting to first light (sunrise 6:20, computed).
5. **The red flag of no quarter** on San Fernando's tower (`HIST-TEX-054`, `-504`): delivered `flag-red-siege` provides still and three wind poses. It draws at the existing town point. Accurate tower art and its placement under the flag remain requested.
6. **Mounted volunteers**: `volunteer-mounted` walking and trotting, east/north/south, for the Gonzales men riding in (`HIST-TEX-057`).
7. **Lancers**: `lancer-march`, `lancer-idle`, lance up, both facings (`HIST-TEX-436`); never a strike.
8. **Travis**: an officer's figure in the volunteer firing cycle, for the north battery (`HIST-TEX-502`).
9. **Smoke at a distance**: delivered `smoke-column-far` now animates over the huts from the existing February 25 ignition. For March 6, delivered `alamo-funeral-pyre` has one unlit frame and three flame/smoke frames, placed at three separated sites in the aftermath scene. These sites are a reconstruction, not located historical coordinates; the forms are fully clothed and non-graphic.
**How it plugs in.** `drawLadders`, `drawGun`, `drawPeople`, `drawPlume` and `drawFlag` in `public/battle-view.js` draw the
stand-ins by these names' places; each is marked `stand-in:`. A delivered sheet registers in the atlas and the renderer draws it
instead; the night grade replaces the wash drawn by `battle.light`.
**Check.** `npm run test:battle-alamo` at 1366x768 and 1024x768: the ladders read as ladders against the north wall at the
compound's zoom, the 18-pounder is visibly the biggest gun, the men on the walls stand behind them, and the dark lifts through the
assault. No blood, no wound shown, no body closer than the compound's framing (VISION.md §16).

## Request 2026-09-25 — San Jacinto

**Status: open; stand-ins in use since 2026-09-25 (see *Stand-ins in use*).** San Jacinto on the battle engine (`sim/battles/san-jacinto.mjs`, `docs/BATTLES.md` §8) draws the formed Texian line walking against a camp at rest, the two six-pounders, the breastwork, the rout into the marsh and Peggy's Lake, and Santa Anna brought before the wounded Houston. Four things are stood in for. Delivery contract as the people sheets: transparent PNG, the figure standing on its ground anchor, the logical height of `volunteer-*` and `regular-*`, east-facing frames mirrored for west.

1. **The Twin Sisters.** Delivered: unpainted `cannon-sixpounder-e`/`-w` and authored recoil clips depict a reusable light iron six-pounder on a field carriage with its trail (`HIST-TEX-522`: "two six-pounders"). The two Twin Sisters themselves draw the separate red-and-blue `twin-sister-painted-*` variant per the owner's visual direction, plus their own `twin-sisters-crew` service sheet. This paint scheme is an artistic identifier, **not historical evidence**. How the guns were brought forward on the field is **not verified**: the field sprites draw the gun alone, no transport team.
2. **A camp at rest, and its breastwork.** `regular-rest-sit` (sitting on the ground, musket across the knees), `regular-sleep` (lying on a blanket, plainly asleep - never to be mistaken for `regular-reclining`, which is a man killed), `volunteer-rest-sit`, and `musket-stack` (three muskets stacked). And `breastwork-packs`: a low wall of packs, saddles, boxes and brush about five feet high, in three or four segments that can be laid end to end with a gap between two for a gun (Houston: "constructed of packs and baggage, leaving an opening in the centre").
3. **A Texian horseman.** `volunteer-mounted` walk (east, north, south, four frames) and idle, in the clothes and hats of `volunteer-*`, with a rifle; and `volunteer-mounted-fire` (two frames: the rifle at the shoulder, the discharge). Plugs into `figureOf` for a Texian `mounted` side or party.
4. **The marsh.** `marsh-edge` (a few tiles of cordgrass and open water, to scatter) and `figure-wading` (a man up to the thighs in water, running, in either side's clothes), so the rout into the marsh can be drawn in it. No blood, no gore, and nobody drawn shot at close range (`VISION.md` §16; `docs/BATTLES.md` §2b.2).

**How it plugs in.** `public/battle-view.js`: `drawCannon` names `cannon-sixpounder-*` for San Jacinto's guns; the `camp` branch of `draw` names `*-rest-sit` and `*-sleep` by the slot's `rest`; `drawWorks` names `breastwork-packs` and `marsh-edge`; `figureOf` names `volunteer-mounted`. Every `stand-in:` comment names this request.

**Check.** In the Host's framing of the advance the Mexican camp reads as men resting, not as men hurt or dead; the breastwork reads as baggage piled into a wall with a gap; the Texian horsemen read as Texians.
## Request 2026-09-25 — Gonzales before the fight

**Status: six props and a three-character sewing cycle delivered and wired 2026-09-26.** `gonzales-cannon-buried`, `gonzales-log-breastwork` and `gonzales-dugout-canoe` replace the canvas mound, earth-rampart and plank skiff. `gonzales-ploughed-earth` replaces orchard canvas furrows. `gonzales-flag-work-cloth` and `gonzales-flag-work-painted` replace the table-top flag drawing; the raised flag keeps its animated wind clip. `people-gonzales-paint` adds two distinct hand-sewing frames for teal, indigo and blue-girl, mirrored west as needed. The two canoe props remain separate instances. A seated painter pose, other character actions, a half-painted stage and the disputed no-star variant remain open.

**Why.** The owner, 2026-09-25: *"when i try to watch a battle, or actions that led to a battle, i see npc's just standing around.
example: there's no one worried at gonzales that the mexicans are coming. there's no group of women making the come and take it
flag."* The town now has dated scenes from September 29 to October 2, 1835 (`sim/town-scenes.mjs`, docs/GONZALES_ART.md, research
in docs/battle-research/gonzales-town.md, `HIST-TEX-460` to `-469`), and several things they show have no art.

**What**, in the frontier-v1 style and scale (people as the `teal`/`indigo`/`elder`/`ochre` sheets; props as `cannon-bronze-e` and
`home-table`), each a transparent sheet with the usual anchor at the feet or the base:

1. **Painting and hemming a flag at a table** — a woman standing (and one seated) at a table, brush or needle in hand, two frames,
   east (mirrored for west), for `teal`, `indigo` and `blue-girl`. Replaces `repair` in `STAND_INS.paint`.
2. **Digging with a spade** — a man thrusting and lifting a spade, four frames, east, for `elder`, `ochre` and `blue`. Replaces
   `work` (the hoe) in `STAND_INS.dig`.
3. **At the forge and anvil** — a smith hammering on an anvil with a small forge beside him, and a man cutting chain with a cold
   chisel, two to four frames, east; the forge and anvil also as a prop. Replaces `repair` in `STAND_INS.forge`.
4. **Pointing across the river** — a man and a woman standing, one arm out, the other shading the eyes, two frames, east and
   south. Replaces `search` in `STAND_INS.point`.
5. **The flag** — "a breadth of white cotton cloth about six feet long" with a black cannon painted on it, a lone star above and
   "COME AND TAKE IT" beneath (Smithwick; the star is disputed, so also one without it), on a pole: still, and a four-frame wave;
   and flat on a table half-painted and finished. Replaces `drawFlag`'s strokes.
6. **The gun on two cart wheels** — a small bronze six-pounder lashed on the axle of a pair of heavy cotton-wagon wheels, no proper
   carriage, east and west; and the same gun half out of a hole in ploughed ground. Replaces the field-carriage `cannon-bronze-e`
   and the canvas mound.
7. **A log breastwork at a ferry landing, and dugout canoes drawn up** — a low wall of laid logs with men able to stand behind it,
   and two or three canoes on the bank. Replace `earth-rampart` and `skiff`.

**How it plugs in.** Poses: register the clips as `<figure>-paint`, `-dig`, `-forge`, `-point` and change the four entries of
`STAND_INS` in `sim/town-scenes.mjs`; nothing else moves (the page asks for `${figure}-${pose}`). Props: the new frame names go
into `drawProp` in `public/town-scenes.js` (`flag`, `flag-work`, `cannon`, `cannon-buried`, `breastwork`, `skiff`).

**Check.** At the Gonzales framing and one wheel-click closer: the women read as making something at the table, the men in the
orchard as digging, the flag as the flag, the gun as a small gun on cart wheels and not an artillery piece; `npm run test:gonzales-town`
still passes and its close pictures are looked at.

## Request 2026-09-25 — the carreta

**Delivered 2026-09-26:** `carreta-solid-wheels.png` supplies the open pole-and-rawhide frame, solid plank wheels, twelve authored cardinal travel frames, three empty parked views and a loaded east view. `ox-packed.png` supplies twelve cardinal walking frames and three idle views of the brown ox with its family packs. `icons-gather-stock-carreta.png` supplies `icon-make-carreta` and seven optional alternate views of existing gathering and stock icons. `miniWagon`, `miniAnimal`, `entityClip` and `PANEL_ICONS` now select the dedicated art; the seven original gathering and stock icons are in `icons-family-subsistence.png`. A separate loaded travel presentation remains desirable; when laden, the carreta currently travels with the same uncovered body cycle. The research note below governs the historical framing, not the generated art itself.

**Why.** The owner, 2026-09-25: *"what was the cart thing that tejanos used? maybe we could use that? have it be something families can
make at home? could work the same, just with reduced carrying capacity?"* A family can now make a carreta from three logs of its pile
and a rawhide (sim/carreta.mjs, docs/WOODS_AND_BUILDING.md §6.6). The record: "Carts with great, clumsy, solid wooden wheels" and
"Rawhide entered into the construction of pretty much everything they used" (Smithwick p. 47); "the unhewn sticks which squeak in the
holes of the plank wheels" (Woodman p. 48) - `HIST-TEX-443`.

**What**, in the frontier-v1 style and the scale of `wagon-covered` and `ox-walk`:

1. **The carreta**: two great solid wooden wheels (each of a round or of two or three thick planks, pegged, no iron tyre), a wooden
   axle, an open frame of poles lashed with rawhide, no cover; `carreta-travel` east (mirrored for west), north and south, four frames
   with the wheels turning, and `carreta-idle`, loaded and empty. **Without its ox** - the team is drawn separately. Smaller than the
   wagon, about a cart's size.
2. **`icon-make-carreta`** for the family panel: the carreta, or a solid wheel being cut from a log, in the action-icon contract.
3. **The ox under packs** (a family with no vehicle carries its tools and seed on its ox, sim/means.mjs): `ox-packed-walk` east, north
   and south, four frames, a pack saddle with the hoe, the axe and sacks lashed on, at the scale of `ox-walk`.

**How it plugs in.** `miniWagon` in `public/app.js` draws `carreta-*` for an entity with `carreta: true` (already on the wire) in place
of the wagon at 0.8; `PANEL_ICONS` in `public/family-panel.js` names `icon-make-carreta` in place of the `carreta` glyph.

**Check.** In the yard and on the road the carreta reads as a two-wheeled ox cart, not a covered wagon; beside a wagon it is plainly
the smaller; the wheels turn as it goes.

## Request 2026-09-25 — riders, walkers and the cart

**Partial delivery 2026-09-26:** the previously registered `cart-open` east/south/north views now draw for `cart: true`. Its wheels remain static, and seated passengers and the carried-infant walk remain requested. The dedicated carreta and packed ox are tracked under their separate request above.

**Art delivery, 2026-09-25:** `cart-open.png` is now in the library as four isolated views:
`cart-open-e`, `cart-open-e-variant`, `cart-open-s`, and `cart-open-n`. It is an uncovered
two-wheel cart without its ox, and its measured frames are in `atlas.json`. The two east
views have almost identical wheel spokes, so they are **not** registered as a travel
animation. The wheel-turning frames, loaded state, seated passengers, and carried-infant
walk remain open. Claude can use the three direction views as static cart art while
the moving rig is completed; do not remove the cart stand-in row yet.

**Why.** The owner, 2026-09-25: *"introduce rolling for starting wealth. tie it into the extra wagons ... if a family doesn't have
enough wagons, older family members walk."* A family's means now give it a cart, one wagon, two or three (sim/means.mjs), and on its
journeys together the server seats the youngest and the sick in them and walks the rest beside them (sim/company.mjs,
docs/SETTLING_IN.md §4b). The record: "my two little sisters rode in the sleigh" while her mother walked "with an infant in her arms"
(Harris, `HIST-TEX-442`). The page can show who rides and who walks only with stand-ins.

**What**, in the frontier-v1 style and the scale of `wagon-covered` and `ox-walk`:

1. **The cart**: a two-wheeled, uncovered ox cart without its ox (the team is drawn separately), `cart-travel` east (mirrored for
   west), north and south, four frames with the wheels turning, and `cart-idle`, loaded and empty. The library's `ox-cart` has its ox
   painted in and does not move.
2. **Riders**: seated figures to sit in the bed of an open wagon and a cart - the original and second casts and the children's
   figures (`girl`, `boy`, `smallchild`), east/north/south - anchored at the hip like the delivered driver layers, and the wagon's
   tail with its cover drawn back so they can be seen in it.
3. **A walker carrying an infant**: the walk cycle of `rust-woman`, `indigo`, `ochre` and `blue-girl` (and one man) with a swaddled
   infant in the arms, cardinal directions as the walk cycles.

**How it plugs in.** `bedLayout` in `public/motion.js` returns where each rider sits; with seated rider layers registered it draws
them whole instead of cut at the waist. `miniWagon` in `public/app.js` draws `cart-*` for an entity with `cart: true` (already on the
wire). A carried baby (`travel.carried`, already on the wire) is not drawn on its own once the carrying walk lands.

**Check.** At the family panel's zoom the riders read as sitting in the wagon, not standing on it; a cart is visibly smaller than a
wagon with its one ox; the carried baby moves with the walker.
## Request 2026-09-24 — one roof over a two-pen house

**Status: open; the pens' own roof over the passage in use (see *Stand-ins in use* above).** Owner, 2026-09-24: *"the
angle of the houses makes it so they don't seem to be connected single buildings. fix this."* A dog-run is two pens and
the open passage between under one roof (`HIST-GONZ-025`, `HIST-GONZ-035`), a saddlebag two pens round one big double
chimney (`HIST-TEX-017`). The house-modules sheet draws one pen corner-on, its ridge on a diagonal, and a passage roof of its
own on four posts. Since 2026-09-24 the page stands a two-pen house's pens one behind the other along their ridge
(`alongRidge` in `public/house-plot.js`), so both ridges lie on one line, and roofs the passage with a third copy of the
pens' own roof laid over the gap between them. It reads as one house; the joins do not quite: each roof picture has its
own end poles and ridge-log ends, which show where one copy lies over the next, and the saddlebag's two roofs stop short at
its chimney.

- **Why.** The passage's own picture, `house-passage-roof`, is drawn at a flatter pitch than the pens' roofs, nearly square
  (about sixteen feet by thirteen, where the passage is twelve feet between the pens - eight until 2026-09-24), and on four posts, so seated between
  the pens it meets neither roof. And the sheet's ridge is not marked: the page reads it by eye (`RIDGE`), steeper than the
  walls' ground under it (slope 0.88 against 0.72), which is why the pens could not simply be laid along their walls.
- **What.** In the house-modules style, at the same scale and corner-on view as the delivered roofs:
  - `house-roof-join`, `house-roof-join-partial`: the clapboard roof over a twelve-foot passage between two pens (a cell and a half of the plot, `PASSAGE_FEET`), at exactly
    the pens' pitch, ridge and eaves, with **no gable ends and no end poles**, so laid between two pen roofs it runs into
    both without a seam; the ridge log and weight poles running through.
  - `house-roof-join-chimney`: the same section with the saddlebag's double chimney rising through its ridge (or the roof
    section alone, drawn so a chimney can stand through it).
  - The ridge line marked on `house-round-roof-partial`, `house-hewn-roof-finished` and the join pieces: the two ends of the
    ridge in frame pixels, delivered with the frames or as a note, so the page lays the pens along it instead of reading it.
  - Optional, and the bigger change: the pen with its long side toward the viewer (its ridge across the screen), for a
    two-pen house at 0 and 180 degrees to run along its own ground as the houses-settling dog-run does.
- **Seats and anchors.** Each join piece carries its eave seat as the roofs do (`seatOf` in
  `scripts/build-atlas-manifest.mjs` measures one from the silhouette), and is drawn so that seated on a pen's full walls it
  covers the eight feet of ridge in front of that pen's front gable.
- **How it plugs in.** Add the frames to the house-modules registration in `scripts/build-atlas-manifest.mjs` and
  `npm run build:art`. In `drawHousePlot` the passage in a row draws `house-roof-join` (or `-partial`) seated as the pens' roof
  is now, and a double chimney in a row draws `house-roof-join-chimney` behind it; the ridge note replaces `RIDGE`. Delete the
  stand-in row. A pen with its long side toward the viewer would let `alongRidge` lay a two-pen house along its ground at 0
  and 180 degrees, and `PICTURE_REACH` (`sim/house-footprint.mjs`) come back down toward `{ up: 1, side: 0.9, down: 0.2 }`.
- **Check.** `tests/house-connected.test.mjs` still passes, its ridges read off the new frames; in the connected montage
  (`HANDOFF.md`, *One building*) no end pole or ridge-log end shows between the pens.

## Request 2026-09-23 — the house from its other sides

**Status: open; the front view, mirrored at a quarter turn - and, since 2026-09-24, for a pen's chimney - in use (see
*Stand-ins in use* above).** A student places a house
on the family's land and turns it a quarter at a time (HANDOFF.md *House placement preview*). Until 2026-09-23 the page turned
the pictures with it, so a house at 90 degrees lay on its side and one at 180 stood on its roof, chimney pointing at the
ground. Now a turn turns the house on the ground - its footprint, which way the long side runs, which piece stands in front
of which - and every piece stays upright, as every tree, person and ox on the map does. The house-modules sheet draws each
pen corner-on from one side only: the gable and door on the face to the left, a window on the face to the right, the ridge
running back to the right. Mirrored, that picture is honestly the pen turned a quarter (gable on the other face, ridge on the
other diagonal); a half turn has the same silhouette. What the sheet cannot show is the back of the pen.

- **Why.** The gable end facing the viewer is the door's in the one picture and in it mirrored, so a chimney against a gable
  toward the viewer stands in front of the door (owner, 2026-09-24: *"fix the chimney standing in front of the door"*). Since
  2026-09-24 a chimney to the side stands against the back gable of whichever picture puts it there (`mirrorPens` in
  `public/house-plot.js`), at the cost of two-pen houses drawn as mirror-image pens; one toward the viewer - the cabins at
  90 degrees, the dog-run's near pen at 90 and 270, the saddlebag's far pen at 90 and 270 - has no picture to stand against,
  and stands in front of the door, covering it whole. A dog-run or saddlebag turned
  90 degrees runs into the screen, where its passage, porch and shed room are still drawn broadside.
- **What.** In the house-modules style, at the same scale, cell size and corner-on view as the delivered pieces:
  - `house-round-back-sill`, `-back-low-walls`, `-back-full-walls` and the same three for `hewn`: the pen with the gable
    face to the left **without** its door (a window or blank logs), so the pen seen from behind. Either of two drawings
    serves: the door in the right-back gable, hidden behind the walls, or the door on a long side (the right-front face,
    where the window is now) - which is where the houses-settling sheet's own cabins and dog-run have it. The roof needs
    no new frame: the delivered roofs, mirrored or not, already lie along either diagonal.
  - `house-passage-floor-end`, `house-passage-roof-end`: the open passage seen end-on, running away from the viewer
    between two pens that stand one behind the other.
  - `house-porch-end`, `house-shed-room-end`: the porch and the shed room seen from their narrow ends, their long side
    running into the screen.
- **Seats and anchors.** Every full-walls frame carries its wall-top seat as `house-*-full-walls` does (the atlas measures
  one from the silhouette, `seatOf` in `scripts/build-atlas-manifest.mjs`); every frame's ground anchor the middle of its
  front edge, as now.
- **How it plugs in.** Add the frames to the house-modules registration in `scripts/build-atlas-manifest.mjs` and
  `npm run build:art`. In `drawHousePlot` (`public/house-plot.js`) a pen whose chimney's gable faces the viewer takes the
  `back` frames in `drawLogPen`, every pen takes the house's mirroring again (delete `mirrorPens`' choice and its
  `ceiling:`), and a passage, porch or shed room at 90 or 270 takes its `-end` frame, unmirrored; delete the stand-in row. Nothing in the server changes: the turn, footprint and envelope are already the server's.
- **Check.** `tests/house-turn.test.mjs`, `tests/house-roof.test.mjs` and `tests/house-chimney.test.mjs` still pass
  (upright, back to front, roof seated, chimney against its gable at every turn - a back full-walls frame needs its ground
  corners measured too: add it to `GROUNDED` in `scripts/build-atlas-manifest.mjs`); `tests/house-chimney.test.mjs` *no …
  chimney is drawn over a door* then fails on the gables toward the viewer, which is its list of stand-ins: drop that
  exception. In `scripts/house-plot-browser-proof.mjs`'s pictures of the built house at
  0/90/180/270 no chimney stands in front of a door, and a dog-run at 90 reads as one house running away from the viewer.

---

## Request 2026-09-21 — the guided start's marks

**Status: on hold 2026-09-28 - the tutorial is removed for now; do not draw these until it comes back.** CSS stand-ins were in use from 2026-09-21. After a real class played on
Chromebooks the owner asked for the tutorial to be "an integrated forced part of the game ... one task at a time, guided by
the ui and unavoidable" ([FAMILY_PANEL.md](FAMILY_PANEL.md) §12). The screen now leads a student to one icon on the ability
bar at the bottom middle. The three marks that do the leading are CSS, not art.

- **Why.** These are the marks a seven-year-old reader looks at instead of the sentence. A CSS triangle and a coloured
  box-shadow read as a web page beside icons Astra painted, and at the bottom of a busy map the ring has to win against
  grass, trees and a wagon without hiding the icon it is round.
- **What.** Three small pieces, transparent, in the illustrated palette with the thin dark outline the action icons have,
  drawn to read over open country (deliver at 96 by 96 unless said otherwise):
  - `lesson-point` — a pointing mark that sits **above** an icon and aims down at it: a small painted hand, a carved
    signpost finger or a feathered dart, in the rust the game already uses for "attend to this", `#c2582c`. It is drawn
    about 20 CSS pixels tall over a 48-pixel icon, and it bobs; the icon under it never moves.
  - `lesson-ring` — a frame that goes **round** a 48-pixel icon without covering it: a painted rope, a rust-tooled border
    or a wreath of rails, transparent inside, delivered as a nine-slice or as a single 72 by 72 frame the icon sits inside.
  - `lesson-pip` and `lesson-pip-done` — the two states of one step-marker in the strip's run of ten, about 10 by 6 CSS
    pixels: a stake in the ground and a stake with a rail on it, say, or a plain unfilled and filled tally mark. No text.
- **How it plugs in.** Registered through `npm run build:art`. The bar's `.panel-icon[data-pointed=true]` takes
  `lesson-ring` in place of its box-shadow and `lesson-point` in place of its `::after` triangle (a canvas over the button,
  as `panelMark` in `public/app.js` already does for the row's marks); `renderLesson` draws the pips from the two frames in
  place of the two `.lesson-pip` colours. The accessible names carry the words either way and do not change.
- **Check.** At 1366 by 768 over grass, over a road and over a wagon, the ring is told apart from the server's own gold glow
  (`data-active`, "doing this now") at a glance, and the pointed icon's own picture is still readable inside it.

## Request 2026-09-20 — the country in a norther: trees and grass bent by the wind

**Status: delivered 2026-09-21.** `weather-norther.png` supplies `oak-broad-wind`, `oak-spreading-wind`, `pecan-wind`, `grass-tuft-wind`, and `smoke-streaming` as genuine-alpha painted sprites. Owner, 2026-09-20: "Weather should be a visual thing...
Players should see the weather. If implemented correctly, no text should be required." The weather is drawn
([docs/WEATHER.md](WEATHER.md), `public/weather-art.js`), and a norther is the kind the record makes most of: Gray at San
Felipe on 25 February 1836, "the wind **chopped suddenly round to the north**, and there commenced what is familiarly
called in this country **a norther**, by which is always understood a hard and cold blow from the north."

- **Why.** A norther has no rain and no cloud to draw (`HIST-TEX-229`; Almonte has "clear" or "clear and pleasant" every
  morning of one), so what carries it is the **wind in the country**: the trees and the grass going over with it. Every
  tree the library has stands straight. The page bends them by shearing the sprite about its own foot, which works — it
  is what the shots in `docs/evidence/weather/` show — but a sheared painting is a leaning silhouette, not a tree in a
  gale: the crown does not stream, the branches do not part, and the leaves do not lift off the windward side. At the
  closest zoom that shows.
- **References.** `HISTORY.md` `HIST-TEX-221`, `HIST-TEX-229`; [docs/WEATHER.md](WEATHER.md) §4.1, which is Gray's own
  paragraph and is worth reading before drawing this.
- **What.** In the frontier-v1 `nature` style, the same three trees the map already scatters, each in one more pose —
  bent hard to the viewer's right, as if the wind came out of the page:
  - `oak-broad-wind`, `oak-spreading-wind`, `pecan-wind` — the trunk leaning about a sixth of its height off vertical,
    the crown pulled downwind and thinned on the windward side, a few leaves leaving the crown to the right.
  - `grass-tuft-wind` — the tuft's blades laid over nearly flat to the right, not merely fanned.
  - `smoke-streaming` — a chimney's or a campfire's smoke lying flat and low instead of rising, about three figure
    widths long, thinning as it goes. Nothing in the library draws smoke; a norther over a house or a camp is the place
    a class will look for it first.
- **Scale and anchor.** Exactly those of the sprites they stand beside (`oak-broad`, `grass-tuft`), so a tree does not
  change size when the wind gets up; `smoke-streaming` anchors at the chimney top or the fire, at its upwind end.
- **How it plugs in.** Add to the `nature` sheet, `npm run build:art`. In `postOak` and the tuft in `drawGroundDetail`
  (`public/app.js`), pick the `-wind` sprite when `windLean(...)` is past about half of `MAX_LEAN` and drop the shear to
  what is left over, so light airs still bend a little and a gale uses the drawn pose. Delete the stand-in row.
  **Keep the rule the stand-in proved**: the lean must be read at each thing's own place on the map
  (`weatherMix(weather, wx, minute)`), not once for the view, or it stops at a region boundary in a straight line.
- **Check.** Beside the upright `oak-broad` at the same height the trunk is the same thickness and the crown the same
  mass; at the county zoom, a stand of them reads as wind and not as a different kind of tree.

---
## Request 2026-09-20 — the launcher's remaining plates — **Delivered 2026-09-20**

**Status: delivered the same day it was asked for; nothing on that window is a stand-in.** The owner drew the launcher window on
2026-09-20 and had the art made for it the same day: the title painting (`launcher/art/background.png`)
and eight cast plates (`launcher/art/button-*.png`), all in hand and all shipping. Two things the window
needs are not among them.

- **Why.** The launcher's "Check for updates" plate becomes **Update to v2026.09.20.2** the moment GitHub
  has a newer build, and there is no plate that says that. It is drawn in code instead, in the same shape
  and in the amber the mockup uses for a warning - which is honest but is not the owner's hand, and it is
  the one button on that window that does not match the rest. The same drawn plate is what the window falls
  back to if a plate cannot be read at all, so it earns its keep either way.
- **What.**
  - `button-update-available.png` - the same cast plate as the other seven (2172 x 724, the sign inside the
    same box: x 136, y 161, 1902 x 348, on a black field), but **amber or brass** rather than slate, with a
    downward arrow into a tray at the left where the others have their mark, a chevron at the right, and
    **no words**: the version changes with every release, so the launcher writes the line itself over the
    plate. If words are wanted in the art instead, "Update available" is the one phrase that is always true.
  - Optional, and only if it is easy: the seven marks as cut art (`icon-people`, `-monitor`, `-person`,
    `-clipboard`, `-link`, `-swords`, `-gear`) for the drawn fallback. Nothing needs them while every plate
    is cast; they exist for the day one cannot be read.
- **Where it goes.** `launcher/art/`, embedded by `launcher/TexasRevolution.Launcher.csproj` like the rest.
  In `launcher/LauncherForm.cs`, `LookForUpdateAsync` sets `_updates.Plate = null` to get the drawn plate;
  point it at the new art instead and let `PlateButton` draw the version over it (the plate has no words, so
  nothing is being covered). Delete the stand-in rows.
- **Check.** Beside "Check for updates" and "Play Solo" at the same width it reads as one of the set.

**Delivered 2026-09-20.** `launcher/art/button-update-available.png` (1536 x 1024): a red badge reading UPDATE
AVAILABLE in gold, with a gold download arrow in a roundel that overhangs its left edge and a red exclamation mark
above the roundel. It carries its own words, so the launcher writes nothing over it and the version stays in the
button's `Text` and in the line of news below - the same arrangement as every other plate.

Two things about it differ from the other nine and are worth keeping in mind if it is ever replaced. It is **RGBA
with a real alpha channel** where the others are opaque pictures on a black field, so it is composited as it is and
must never be flooded or keyed (`FloodBelow` is 0 in `PlateArt.Cuts`). And the roundel **overhangs the badge's left
edge**, so its row is given 80% of the column's width and the overhang is allowed to hang into the margin, the way
the stop sign's torn flag is.

The optional cut marks were **not needed and were not made**. While every plate is cast, nothing draws them; the
stroke marks in `TitleScene.DrawGlyph` exist only for a plate whose art cannot be read, which is a fallback rather
than a stand-in, and they are marked `ceiling:` rather than `stand-in:` for that reason.

## Request 2026-09-19 — the places past the box

**Status: schematic place art delivered and wired 2026-09-26.** Owner, 2026-09-19, by multiple choice: the places past the old box. Five
places outside the colonies stand on the map ([MAP_ACCURACY.md](MAP_ACCURACY.md) §11): **Matamoros** and **Laredo** on the
Rio Grande, the **Presidio del Río Grande** (San Juan Bautista at present Guerrero, Coahuila), **San Patricio** on the Nueces,
and **Gaines's ferry** on the Sabine. Four transparent place-type vignettes are now registered and drawn: the Mexican river-town image serves Matamoros and Laredo; the other three are distinct. They are visual classifications, not exact reconstructions of an 1836 street plan.

- **Why no stand-in.** The library's settlement art is an Anglo colonist's cabin and its town art is the colonies'. A cabin at
  Matamoros or at the presidio would say something false about the place - these are a Mexican river port, a Spanish presidio
  and mission, an Irish colony's village and a ferry landing on the border - and the standing rule is that missing art is never
  left silently wrong. A name alone is honest: the map says a place is there and claims nothing about what it looked like.
- **References.** `HISTORY.md` `HIST-TEX-158` to `-163`.
- **What.** In the frontier-v1 style (the `places` preamble in [art-prompts.json](art-prompts.json)), seen from a little above
  as the towns are, small enough to read at province zoom:
  - `town-mexican-river` — a low adobe and stone town on a river bank: flat-roofed houses, a church tower, a wharf or landing.
  - `presidio-spanish` — a square walled presidio with a corner bastion and a mission church beside it.
  - `village-irish-colony` — a handful of jacales and log houses round a small chapel, on a low bluff over a river.
  - `ferry-landing` — a landing on a big river: a cut bank, a plank ramp, a shed and a rope post, without the boat (the boat is
    the ferry art above).
- **Where it goes.** `public/place-art.js` maps live site IDs to the four frames in `public/assets/frontier-v1/atlases/`; `public/app.js` draws them at those sites and places the labels above them. San Patricio is a `village` and Gaines's ferry a `ferry` in the current map; this binding uses IDs so they receive art without changing those kinds or their routes.
- **Check.** `tests/place-art.test.mjs` confirms the five sites, atlas entries and mapping; the browser map proof passes with no page errors. Keep the researched map location and route behavior independent of these schematic pictures.

## Request 2026-09-19 — the ferry flatboat

**Status: delivered 2026-09-21.** `ferry-flatboat.png` supplies the empty and laden plank flatboats plus the bank post on genuine transparency. Owner, 2026-09-18: "when the various rivers and creeks are
added, we're going to have to have assets ford, or build bridges (where they historically were)"; chosen the same day, every
place a road crosses a river or creek gets a ford, a ferry or a bridge ([MAP_ACCURACY.md](MAP_ACCURACY.md) §10). Twelve of
the map's crossings are ferries - Lynch's, Groce's, the San Felipe ferry, Robinson's, Brigham's, Burnam's (the Colorado
crossing), Beeson's, the Atascosito crossing of the Trinity, the Harrisburg ferry, and the game's own at Victoria, Matagorda
and on the San Jacinto. Each now draws the plank flatboat at the near landing and a `ferry-post` at each bank, with the rope between them still in canvas strokes (it spans whatever width the map's river is here). `ferry-flatboat-laden` is registered and unused: nothing on the map says who is on the water at this moment.

- **Why.** The library's `ferry-raft` is logs lashed together with a rope rail: a raft. The ferries of the colonies were
  flatboats - "a good and substantial ferry flat boat" (San Felipe's lease, 1829), "a flat raft-like barge onto which a wagon
  or cart could be driven" (TSHA, *Ferries*), Lynch's "a flatboat service with a hand-pulled rope for power" (TSHA, *Lynch's
  Ferry*). A raft of round logs reads as something made in a hurry, which is what the army's rafts of April 1836 were, not the
  licensed ferry that took a loaded wagon across for a dollar (`HIST-TEX-140`).
- **References.** `HISTORY.md` `HIST-TEX-140` (the rules, the rates, what a ferry was) and `HIST-TEX-150` (Lynch's).
  https://www.tshaonline.org/handbook/entries/ferries ; https://www.tshaonline.org/handbook/entries/lynchs-ferry
- **What.** In the frontier-v1 style (the `transport` preamble in [art-prompts.json](art-prompts.json)), a plank flatboat of
  the 1830s: flat-bottomed, square-ended, of sawn planks, about twice as long as it is wide, low sides a hand high with an
  apron (a hinged plank ramp) at each end for a wagon to drive on, a pole or two lying on the deck, and a rope running the
  length of the boat through two posts or rings on the upstream side, where it meets the ferry rope. Seen from a little
  above, broadside, as `ferry-raft` is. No painted water beyond a thin water-contact line; no lettering.
  - `ferry-flatboat` — empty, at rest.
  - `ferry-flatboat-laden` — carrying an ox and wagon (the library's `ox-brown` and `wagon-covered` at their own scale, standing
    on the deck), a man at the rope.
  - `ferry-post` — the post a ferry rope is made fast to on the bank: a stout timber a little taller than a man, the rope
    turned about it. The rope itself is drawn by the page, bank to bank.
- **Scale.** Drawn length about three and a half figure heights (a wagon is 1.55): big enough to carry one wagon and team,
  which is what the rates of 1831 priced.
- **Anchor.** The middle of the boat at the waterline.
- **How it plugs in.** Add the sheet to `SHEETS` in `scripts/build-atlas-manifest.mjs` beside `ferry-raft`, `npm run build:art`,
  and in `drawFerry` (`public/landscape-art.js`) draw `ferry-flatboat` where `ferry-raft` is drawn now and `ferry-post` where the
  canvas posts are; delete the stand-in row. The boat stays at its landing: nothing in the simulation moves it yet.
- **Check.** Beside `wagon-covered` at the drawn scale a wagon fits on the deck; at the map's close zoom it reads as a boat and
  not a raft or a bridge; alpha edges clean.

## Request 2026-09-19 — the country of 1836: trees and ground cover

**Status: delivered 2026-09-22.** `biome-ground-bexar.png` supplies palmetto, cypress knees, two cane variants and wind pose, tall grass and wind pose, two thorn-thicket variants, yucca, marsh cordgrass and dune grass. `biome-trees-fields.png` supplies size-specific longleaf, sabal palm and bald cypress, plus medium/large magnolia and beech. Owner, 2026-09-19: the map brought in line with the
natural biomes of Texas (docs/BIOMES.md, built the same day).

- **Why.** The map shows each natural region of 1836. Longleaf pine, the Texas palm, bald cypress, river cane, tall prairie
  grass and the South Texas thicket are what tell a student where they are, and the library has none of them.
- **What.** Transparent, anchored at the base, three-quarter view, in the style of `pine-loblolly-*` and `live-oak-*`:
  `pine-longleaf` at `-pole`, `-log`, `-large` (very tall straight trunk, sparse tufted crown of long needles high up, grass
  at the foot); `palm-sabal` at three sizes (a Texas palm: straight grey trunk, round head of fan leaves, 40-60 ft when large)
  and `palmetto` (a low fan clump, no trunk); `cypress-bald` at three sizes (buttressed flaring base, flat-topped feathery
  crown, with and without Spanish moss) and `cypress-knees`; `cane` (river cane in a dense clump, two variants, with a `-wind`
  frame) about twice a person's height; `grass-tall` (bluestem and Indian grass, waist to shoulder high, golden, with a
  `-wind` frame); `thicket-thorn` (a blackbrush-guajillo-granjeno clump, grey-green, two variants); `yucca` (Spanish dagger);
  `marsh-cordgrass` and `dune-grass` (sea oats on sand); `magnolia` and `beech` at `-log` and `-large` for the thicket.
- **How it plugs in.** `KINDS` in `sim/woods.mjs` names each tree kind's picture, whether it comes at three sizes (`sized`)
  and how tall it is drawn (`scale`, which goes back to 1 when the tree's own art lands); `GROUND_CLASSES` in
  `public/ground-classes.js` names each class's marks. Registering the frames and changing the names is the whole swap.
- **Check.** Beside `oak-broad` at the same size a longleaf reads taller and more open than a loblolly, a palm unlike any
  pine, cane as a solid wall, tall grass above a person's knee; a closed stand still reads closed.

## Request 2026-09-19 — Béxar's fields and acequias

**Status: art delivered 2026-09-22.** `biome-ground-bexar.png` supplies compatible straight, bend and plank-crossing acequia pieces plus the period brush fence. `biome-trees-fields.png` supplies irrigated young/mature crop rows and the fallow-field fill. The researched acequia layout remains implementation work. The owner decided
(2026-09-19, by multiple choice) that the Alamo stood among irrigated fields, not woods; the map now has no woods round it.

- **Why.** The fields need to look like Béxar's labores, not the colonies' log-fenced plots, and the acequias are what made
  them.
- **What.** `acequia` (an earth ditch a yard wide with water, straight and bend pieces, and a plank crossing),
  `field-irrigated` (corn in furrows along a ditch, young and mature, sharing the corn frames' scale), `fence-brush` (a brush
  fence, the kind the Texians crossed in December 1835), and `field-fallow` (grass and weeds on an old field).
- **How it plugs in.** The Béxar layout (`public/bexar-layout.js`) lays the acequias as lines and the fields as plots;
  `drawPlots` draws them. The envelope they fill is `BEXAR_FIELDS` in `scripts/terrain/biomes.mjs`.
- **Check.** At the street zoom the Alamo stands in open fields with ditches and a line of bank trees on the river.

## Request 2026-09-19 — the game of 1836

**Status: delivered 2026-09-21; the mustang is wired into the hunt the same day (`FIC-GONZ-261`), and the rest are still words only.** The wildlife sheets now supply animated deer, turkey, bear, javelina, pronghorn, bison, geese, wild cattle and wild mustang.

- **Why.** The quarry a hunt finds should be the country's (`HIST-TEX-103`, `HIST-TEX-104`): turkey in the bottoms, bear in
  the canebrakes and the thicket, javelina in the chaparral, pronghorn and bison on the western grass, waterfowl on the coast.
  Only the deer is drawn.
- **What.** As the delivered `wildlife-deer` (idle, alert, bound, four frames each, east-facing, anchored at the feet):
  `wildlife-turkey`, `wildlife-bear`, `wildlife-javelina`, `wildlife-pronghorn`, `wildlife-bison`, `wildlife-geese` (a flight
  and a resting flock), `wildlife-mustang` (a wild horse, rougher than the family's), `wildlife-cattle` (a rangy longhorned
  wild cow; added 2026-09-19, when the hunt began to bring the wild cattle of the coastal prairie).
- **How it plugs in.** `miniDeer` in `public/app.js` draws the clip for `chore.quarry`; the quarry's kind picks the sheet.
  Since 2026-09-19 the hunt chooses its quarry (`quarryAt`, `sim/hunting.mjs`) and stores it on the hunting place
  (`chore.ground.quarry`); today only a deer is given a place to be drawn at (`quarryPoint` in `sim/chores.mjs`), and the swap
  is to give every quarry its place with `kind` set to its id once its sheet is registered.
- **Check.** Scale against `wildlife-deer` and `horse-chestnut`.

## Request 2026-09-19 — the logs fetched from the timber

**Status: delivered in `icons-family-service.png`; glyph remains only as a load fallback.** A family with no timber of its own
can take the ox and wagon to the nearest timber and bring six logs home (`fetch-logs`, docs/BIOME_GAMEPLAY.md §3.2). The
order is on the family panel with the registered `icon-fetch-logs` art. **2026-09-28: fetching is folded into felling** (docs/WOODS_AND_BUILDING.md §6.7): *Fell trees* begins it where the family's land has no timber, and it glows on the felling icon, so `icon-fetch-logs` is no longer drawn on a student's panel. Keep the frame: the families nobody plays still send it by name, and a saved class may show it.

- **Why.** One stroke-drawn glyph beside the illustrated icons reads as a placeholder, and it must be told from *Fell trees*
  and *Haul logs to the house* (log hauling is being removed, 2026-09-28: felling puts its logs on the one wood pile).
- **What.** `icon-fetch-logs` in the action-icon contract (request 2026-09-15 — action icons, 128 by 128, one silhouette,
  reading at 38 pixels and dimmed to 40 per cent): logs loaded across an ox wagon's bed, the ox's head at the edge.
- **How it plugs in.** Registered through `npm run build:art`; `drawIcon` in `public/family-panel.js` takes `icon-fetch-logs`
  for a key whose `PANEL_ICONS` entry has only a glyph, with no change to the page.
- **Check.** At 38 CSS pixels it is told apart from `icon-fell-trees`, `icon-haul-logs` and the wagon's travel icon.
## Request 2026-09-19 — the traveller's marker — WITHDRAWN 2026-09-22

**There is no marker any more, so there is nothing to draw.** The sheet was delivered on 2026-09-21
(`travel-markers.png`: rust, ink, grey-green and slate portrait pins, route dots, destination rings and hoofprints; still in
the library and registered) and was never bound, because on 2026-09-22 the owner threw the whole idea out: *"characters are
still seen zipping around. i don't want to see icons. i want to see them walk at a normal pace, then when they've walked a
ways (say if they're going somewhere that isn't their farm) they should fade out… that way they arrive at the correct time,
but no one sees them move unnaturally."*

A traveller too fast to draw now walks a hundred yards, fades out, crosses the middle unseen and fades back in to walk the
last hundred yards (`travelSight` in `public/motion.js`, `sightOf` in `public/app.js`, [MAP_ACCURACY.md](MAP_ACCURACY.md)
§12a). **Its stand-in row is gone with it**, and so is the canvas pin, disc, portrait and destination ring it stood for.

**The one rule it proved, and which is kept:** the road *behind* a traveller is not drawn. The road itself is already on the
ground, and a line behind as well as ahead was two lines to read on a small screen. `drawTravelRoads` draws only the road
still ahead, and says so.

## Request 2026-09-18 — the Alamo's faces seen from the south

**Status: delivered and wired 2026-09-21** (`public/alamo-faces.js`, laid by `public/bexar-art.js`; `FIC-GONZ-262`). `alamo-face-strips.png` supplies distinct straight-on limestone, room-range, gate, convento and roofless-church south elevations. Owner, 2026-09-18: "bring the Alamo complex into the same
art style as the rest of the game. ensure it matches the dimensions of the historical building." The map now draws the
compound at its true footprint (`HIST-TEX-090` to `-092`, [ALAMO_LAYOUT.md](ALAMO_LAYOUT.md) "On the map"): every building a
box on its plan, as tall as its true height times the towns' `DRAWN_HEIGHT`, with a flat parapeted roof, and the face turned
south to the camera painted. The camera looks north, so the church's carved front, which faces west, is edge on and not seen.

- **Why.** The painted faces are one generic stone module cut and repeated, so the low barrack, the long barrack, the west
  range and the church all wear the same wall; the gate is a dark rectangle. The compound reads as stone buildings of the
  game, but not yet as the Alamo's own buildings.
- **What.** Straight-on elevations in the `alamo-modules` style — warm outlined limestone, dark olive-brown ink, light from the
  upper left — with **no top, no perspective and no ground**: a flat strip of wall face from its foot to its parapet, each
  drawn to **tile left to right without a seam**, transparent above the parapet line only where the wall is broken.
  - `alamo-face-limestone` — plain coursed limestone, about 2 : 1 (width : height).
  - `alamo-face-rooms` — a one-storey range front, stone with patched plaster, one plank door and one small barred window per
    tile, beam ends under the parapet, about 2 : 1.
  - `alamo-face-gate` — the low barrack's gate passage: a wide opening under a timber lintel with two heavy plank leaves standing
    open, the stone either side, about 1 : 1, to sit in the low barrack's front where the gate is.
  - `alamo-face-convento` — the long barrack's south end, two storeys: a door below, a small window above, a line of beam ends at
    the floor between, about 1 : 1.
  - `alamo-face-church-south` — the church's south side in 1836, roofless: thick coursed stone to a rough, broken top edge, the
    few small high windows, no roof line, about 3 : 1.
- **Scale.** Whatever the tile's pixels, the renderer scales the strip's height to the face's drawn height and keeps its
  proportion along the face; nothing of the plan changes. A stone course about a twentieth of the strip's height reads as the
  existing module does.
- **Anchor.** None: a strip is laid by its corners, foot at the bottom edge.
- **How it plugs in.** Add the sheet and ids to `SHEETS` in `scripts/build-atlas-manifest.mjs`, `npm run build:art`, then name
  each strip in `FACE_ART` in `public/bexar-art.js` with its crop as `u: [0, 1], v: [0, 1]`, and choose it by building
  (`alamoMassing` in `public/alamo-layout.js` names every block and wall). Remove the stand-in row above.
- **Check.** `node scripts/alamo-style-shots.mjs after` and look at `docs/evidence/alamo-after-bexar-closest.png` beside the
  Gonzales shots: no seam where a strip repeats, the gate where the low barrack's gate is, the church's south side broken at
  the top, the long barrack's two storeys; `node --test tests/alamo-dimensions.test.mjs` still passes (the art changes no
  dimension).

## Request 2026-09-18 — the steamboat Yellow Stone

**Status: delivered 2026-09-21; the laden underway loop is wired (`FIC-GONZ-260`) and the empty-deck loop is knowingly not drawn.** `steamboat-moored.png` supplies four researched Yellow Stone states; `steamboat-steam.png` and `steamboat-laden.png` add empty and army-laden underway paddle/smoke loops. Owner-approved
2026-09-18. On April 12–13, 1836 Houston's army crossed the Brazos at Groce's ferry, above San Felipe, on the steamboat
Yellow Stone, which had come up the river for cotton ([HOUSTON_CAMP.md](HOUSTON_CAMP.md), `sim/houston.mjs`, `HIST-TEX-086`).
A student with a man in the army reads "The army is crossing the Brazos on the steamboat Yellow Stone. She came up the river for cotton under Captain John E. Ross, and General Houston has taken her to carry the men, the horses and the wagons over the flood." **and, since 2026-09-21, sees her**: `steamboat-cotton-moored` at the crossing between Groce's and Bernardo while the army drills there, and `steamboat-laden` — under way with the militia, the horses and one wagon on her deck — from April 12 while she carries it over, gone from the map when it marches east on the 14th (`yellowStone` in `sim/houston.mjs`, carried on the army by `sim/armies.mjs`, drawn in `public/app.js`). `steamboat-gangplank` was drawn for the crossing until the laden loop landed later the same day; the server places her in the middle of the water, which is not a bank, so the plank-out beat now has no moment of its own. `steamboat-steam`, the empty-deck loop, is registered and drawn by nothing: nothing projects her steaming light, and a return trip invented to have something to draw is not in the record at this hour.

- **Why.** The crossing is the moment the retreat turns east toward Harrisburg, and it happened on a named boat a class can
  look up. Nothing in the library is near it — a `skiff` or a `ferry-raft` would put the army on the wrong craft — so until this
  lands the game says it and draws nothing, rather than drawing it wrongly.
- **References.** Read 2026-09-18 through a fetching tool that returns page summaries; the quoted wording is to be checked
  against the pages before it is quoted to a class.
  - TSHA, *Yellow Stone*: built at Louisville in 1831, a "sidewheeler" with a "tonnage of 144"; on April 12, 1836 she "made the
    first of seven trips transporting the Texas army across" at Groce's. https://www.tshaonline.org/handbook/entries/yellow-stone
  - *American Heritage*, "The Short, Dramatic Life of the Steamboat Yellow Stone" (May 1987): 120 feet long, a 20-foot beam,
    "two side wheels, each 18 feet in diameter", "sheet-iron chimneys", a pilothouse on the boiler deck; she carried the
    army's men, horses, wagons and ox teams. https://www.americanheritage.com/short-dramatic-life-steamboat-yellow-stone
  - Wikipedia, *Yellowstone (steamboat)*: three decks — hold, main deck, boiler deck; a second boiler added in 1835; 120 or 130
    feet by 19 or 20, the sources differ. https://en.wikipedia.org/wiki/Yellowstone_(steamboat)
  - **The picture to draw from:** Karl Bodmer's aquatint *The Steamer Yellow-Stone on the 19th April 1833*, drawn from life on
    the Missouri three years before the crossing, called perhaps the most accurate depiction of the boat in existence.
    https://www.nga.gov/artworks/183372-steamer-yellow-stone ; https://www.metmuseum.org/art/collection/search/680742 ;
    https://www.nps.gov/jeff/blogs/karl-bodmer-aquatint-the-steamer-yellowstone-on-the-9th-april-1833-artifact-of-the-month-for-december-2012.htm
    Take the number and place of the chimneys, the paddle boxes, the cabin and the pilothouse from the plate; where it does
    not show something, keep it plain rather than borrow a later, grander steamboat (no gingerbread, no tall texas deck, no
    stern wheel).
- **What.** A small side-wheel river steamer of 1836 in the frontier-v1 style (the `transport` preamble in
  [art-prompts.json](art-prompts.json): warm outlined storybook art, dark olive-brown ink, flat shading, light from the upper
  left, a slightly elevated view that sees the deck as well as the side). Broadside, **bow to screen-right (east; mirrored for
  west)**, the starboard paddle box amidships toward the camera. The Brazos at Groce's runs north–south, so the crossing is
  east–west and no north or south view is needed now. Weathered wood and cream paintwork, black sooty sheet-iron chimneys,
  cotton-bale white; **no lettering** (her name on the paddle box would be text), **no flag**. Nothing below the waterline and
  **no painted water** — the map draws the river; a thin dark water-contact line along the hull is fine, and the moving frames
  may carry white churn at the foot of the paddle box and a small bow wave inside the frame. Three sheets of four frames, each
  sheet square and transparent, read by the builder as **2 by 2** (a sheet of four names is laid out 2 × 2 in
  `scripts/build-atlas-manifest.mjs`, as `wagon-rig` is), one boat per cell, 12 per cent margin, waterline at 86 per cent down
  the cell like every other sprite's base:
  - `steamboat-moored` — lying at the bank with steam up: (1) still, thin smoke; (2) the same, smoke lifting; (3) a gangplank
    run out from the bow to the bank; (4) moored with cotton bales stacked on the main deck. Paddles still in all four.
  - `steamboat-steam` — under way, empty main deck: a four-frame loop, the paddle buckets turning at the foot of the box,
    churn, smoke puffs from the chimneys; the hull steady (the renderer adds a slow rock).
  - `steamboat-laden` — the same four-frame loop with the main deck **crowded with the army**: men standing close in plain
    frontier clothes with their rifles held upright, a few horses, one wagon; no uniforms beyond what the militia figures wear.
- **Scale.** The library compresses big things; this one too. Drawn height, waterline to the chimney tops, **four figure
  heights** (`SIZE` in `public/app.js` draws a person at 1, a wagon at 1.55, a cabin at 3.3); hull length about three times that
  height, so the boat is plainly bigger than any building on the map but not a true 120 feet (about 21 figures). The main-deck
  rail stands about one figure above the waterline, and **every man on the laden deck is one figure tall — a quarter of the
  frame's height** — so the men aboard are the same size as the men waiting on the bank.
- **Anchor.** The waterline at the middle of the hull, beneath the paddle box: the renderer sets that point on the river.
- **How it plugs in.** Put the PNGs in `public/assets/frontier-v1/atlases/`, add the three sheets and their frame ids to
  `SHEETS` in `scripts/build-atlas-manifest.mjs` with clips beside `skiff-float` and `ferry-float` (`steamboat-moored` a slow
  loop with smoke, `steamboat-steam` and `steamboat-laden` 4-frame loops with `rock`), record the prompt and source, then
  `npm run build:art` and `npm test`. The page then draws her on the Brazos at Groce's ferry for the two days of the crossing,
  beside the army (`public/army-view.js`): moored or under way, laden or empty, **as the server's projection says** — the art
  decides nothing, and the page never moves her across the river on its own. The words stay.
- **Possible reuse, not a commitment.** River traffic — the Yellow Stone carrying cotton down the Brazos to Brazoria and
  Velasco, or the Cayuga at Harrisburg — is a later design question. `steamboat-moored` frame 4 is asked for with that in mind;
  a different boat would need its own request and research, and a boat going down the river would need north and south views.
- **Check.** Beside `rust-idle-s` and `wagon-covered` at the drawn scale, a man on the laden deck is a person's height and the
  boat outsizes a cabin; at the map's close zoom she reads as a side-wheel steamboat and not a building; the paddles turn in
  `steam` and `laden` and are still in `moored`; each loop runs without a jump; one paddle box amidships, no stern wheel, no
  text, no flag, no painted water; alpha edges clean, no painted transparency; compared with Bodmer's plate, the chimneys, the
  paddle box and the cabin are where he drew them.

## Request 2026-09-16 — the road's icons

**Status: delivered in `icons-family-service.png`; glyphs remain only as load fallbacks.** The road east
([ROAD_EAST.md](ROAD_EAST.md)) gives a family three things to do while it flees: a hunt from the camp, a day's nursing of the
sick, and buying food among the families camped at a crossing. Each order now has registered icon art on the family panel.

- **Why.** Three stroke-drawn glyphs sat beside the illustrated icons and read as placeholders; the hunt's glyph in
  particular must be told from the two hunts at home.
- **What.** Three icons in the action-icon contract (request 2026-09-15 — action icons, 128 by 128, one silhouette each,
  reading at 38 pixels and dimmed to 40 per cent): `icon-hunt-road` (a rifle leaning over a small campfire beside a halted
  wagon wheel), `icon-tend-sick` (a figure lying under a blanket with a cup or bowl set beside them), `icon-trade-crossing`
  (a coin passed hand to hand over a ferry's rail, water below).
- **How it plugs in.** Registered through `npm run build:art`; `drawIcon` in `public/family-panel.js` takes `icon-<key>` for
  a key whose `PANEL_ICONS` entry has only a glyph, with no change to the page; the glyph stays as the fallback for a sheet
  that has not loaded yet.
- **Check.** At 38 CSS pixels on the panel's dark row each is told apart from the others and from `icon-hunt-timber` and
  `icon-hunt-land`.

## Request 2026-09-16 — the camp's icons

**Status: delivered in `icons-family-service.png`; glyphs remain only as load fallbacks.** A man serving with General Houston's
army in the spring of 1836 has the camp's work on his row of the family panel ([HOUSTON_CAMP.md](HOUSTON_CAMP.md), `sim/camp.mjs`):
drilling, going out for beef and corn, standing guard, riding with the scouts.

- **Why.** The four were canvas strokes (a musket at the shoulder, horns over a corn ear, a bayonet under a crescent moon, a
  horseshoe and a spyglass) beside illustrated icons, and they read as placeholders.
- **What.** Four icons in the action-icon contract (request 2026-09-15 — action icons): `icon-camp-drill` (a file of men
  with muskets at the shoulder, or one man at the position of the soldier), `icon-camp-forage` (a man leading a beef, a sack of
  corn over the saddle), `icon-camp-guard` (a sentry with a fixed bayonet by a fire, night), `icon-camp-scout` (a rider low on
  the horse's neck, looking out over prairie).
- **How it plugs in.** Registered through `npm run build:art`; `drawIcon` in `public/family-panel.js` chooses each
  `icon-camp-<key>` frame when loaded, retaining its glyph as an unloaded-art fallback.
- **Check.** At 38 CSS pixels on the panel's dark row each is told apart from the others, from the winter's eight and from the
  farm icons; the drill and the guard are distinguishable at a glance.

## Request 2026-09-16 — the shops of the towns

**Status: building art delivered 2026-09-26.** All ten requested `shop-*` sprites are distinct transparent cutouts registered in `docs/ART_MANIFEST.md` and drawn on the existing keeper buildings in towns beyond Gonzales. The store retains its already-distinct `trading-house`. Gonzales retains its researched, bespoke buildings; its stock pens are the open shed at the west edge of town (`gonzales-outbuilding-art-2`). The owner asked for towns that feel alive, with a shop per keeper and, in towns not already drawn, each keeper's own building ([TOWNS.md](TOWNS.md) §5a).

- **Why.** A student in town should be able to tell the smithy from the tavern without reading a label.
- **What.** At homestead scale, in the frontier-v1 style and the projection and footprint of `cabin-small`, anchored at the base
  centre: `shop-blacksmith` (an open forge shed, anvil, bellows, smoke), `shop-gunsmith` (a log shop with a rifle-shaped sign
  and a bench under the eave), `shop-doctor` (a small frame or hewn-log office with a shingle), `shop-tavern` (a double log
  house with a gallery and benches), `shop-tanner` (a shed with hides stretched on frames and a bark pit), `shop-wheelwright`
  (a shed with wheels leaning against it), `shop-mill` (a small log gristmill with a millstone by the door; horse-powered, not a
  water wheel, unless a town's research documents one), `shop-weaver` (a cabin with a loom visible through the open door and
  cloth on a line), `shop-carpenter` (a shed with planks and a sawhorse), and `shop-stockman` (added 2026-09-24: a rail pen with a
  horse and cow animated separately inside, a snubbing post and a small shed at one corner). No lettering; a sign may be a picture.
- **How it plugs in.** `SHOP_SPRITES` in `sim/shops.mjs` selects each registered `shop-*` frame. Towns with documented building IDs keep their placement and identity while the trade sprite replaces the visual stand-in. `public/town-art.js` draws the existing horse and cow grazing clips behind the stock pen's front rail; the animals are not frozen into the pen sprite. Gonzales keeps its own drawn buildings.
- **Check.** At the zoom a town's labels appear, each trade is told apart without its label. Ten unique mappings and atlas entries are asserted in `tests/shops.test.mjs`; the browser town proof checks the full town drawing path.

## Request 2026-09-16 — the winter's icons

**Status: delivered in `icons-family-service.png` and selected directly by `PANEL_ICONS`.** The second class period's choices ([COLONIES.md](COLONIES.md) §6n) include enlisting, joining the garrison at Béxar, going south to the Matamoros men, voting and sending for somebody who serves.

- **Why.** A flag, a box and an arrow drawn in canvas strokes read as placeholders beside the illustrated icons, and two
  enlistment orders share one glyph.
- **What.** Six icons in the action-icon contract (request 2026-09-15 — action icons): `icon-enlist-regular` (a recruiting
  table with a roll and a quill), `icon-enlist-auxiliary` (the same with a folded land certificate), `icon-join-garrison`
  (the Alamo church's front or a walled mission gate), `icon-join-matamoros` (a mounted volunteer riding off to the south),
  `icon-go-vote` (a hand putting a folded paper into a wooden box), `icon-winter-recall` (a rider turning back toward a cabin), `icon-join-relief` (riders crossing open ground toward a far church front), `icon-join-houston` (a column of men on the march with a flag). The flight itself has no icon: it is the main person's card, opened by the "!".
- **How it plugs in.** Registered through `npm run build:art`; `PANEL_ICONS` in `public/family-panel.js` names the sprite in
  place of the glyph for each key.
- **Check.** At 38 CSS pixels on the panel's dark row each is told apart from the others and from the farm icons; the two
  enlistments are distinguishable.

## Request 2026-09-16 — the family panel's marks

**Status: open; Claude-drawn stand-ins in use since 2026-09-16 (see *Claude-drawn stand-ins* above); before that, type and CSS.** The owner asked for "an exclamation point there for me to click on" when a person
needs the student, and for one person to be chosen as the main one ([FAMILY_PANEL.md](FAMILY_PANEL.md) §11). Rows now also
show who is idle. None of the three has art; each is a character or a word styled by the page.

- **Why.** The marks are what a student scans the column for. A system-font "!" and "★" look like the web page they are, not
  the illustrated game around them, and "idle" in small capitals is easy to miss on a portrait.
- **What.** Four small marks, transparent, in the illustrated palette with the thin dark outline the icons will have, drawn to
  read at 24 CSS pixels (deliver at 96 by 96): `mark-need` (an exclamation point on a round orange token, the colour of the
  map's own mark over a person, `#c2582c`), `mark-need-rider` (the same token in slate, `#41556b`, for a rider waiting to speak),
  `mark-main` (a gold star or a small brass badge, marking the student's main person), `mark-idle` (a small resting sign, such as
  a hat hung on a peg, laid on the corner of a portrait), and `mark-auto` (a small sign that the person runs by themself —
  a wound clockwork key, say — in two states, off in the panel's dim brown and on in its green `#4f7a3a`; added 2026-09-16
  with the auto switch, [FAMILY_PANEL.md](FAMILY_PANEL.md) §11.7). No text in any of them.
- **How it plugs in.** Registered through `npm run build:art`; `panelRow` in `public/app.js` draws them in place of the
  characters in `.panel-attention`, `.panel-star` and `.panel-idle-mark`. The buttons keep their accessible names, which carry
  the words.
- **Check.** At 24 pixels on the panel's dark row and on a portrait, each is told apart from the others and from the action
  icons; the "!" still reads while it bobs.

## Request 2026-09-15 — face portraits for the family panel

**Status: open; Claude-drawn stand-ins in use since 2026-09-16 (see *Claude-drawn stand-ins* above); before that, the figure's own head and shoulders.** The owner asked for a panel down the left of the screen with "a
small picture of the character's face" for every person in the family ([FAMILY_PANEL.md](FAMILY_PANEL.md) §6). There are no
portraits, so each is the top of the person's map figure drawn large, which is legible but low and soft at 56 pixels.

- **Why.** The portrait is how a student tells their people apart at a glance and the button that takes the camera to them. A
  cropped walking figure is blurred, cut off at the chest, and identical for every small child.
- **What.** A head-and-shoulders portrait, facing the viewer, on a transparent ground, one per figure the renderer draws a
  family member as, **matching the existing cast and children exactly** (same clothes, hat, bonnet, hair and colours as the
  sheet): first cast `rust` (the principal's coat, a man), `teal` (a woman), `elder` (an older man), `blue` (an adolescent boy);
  second cast `rust-woman` (the principal's coat, a woman), `indigo` (a woman), `ochre` (a man), `blue-girl` (an adolescent
  girl); children `girl` and `boy` (5–9), `smallchild` (2–4) and `infant` (under 2, in or out of the basket). Named
  `portrait-<figure>`, square, drawn to read at 44 and 56 CSS pixels (deliver at 192 by 192), the head centred a little above
  the middle with the shoulders to the bottom edge. No background scene; a flat ground is added by the page. One neutral
  expression each; nothing about a person may be inferred from how they look (`VISION.md` §15).
- **How it plugs in.** `drawPortrait` in `public/family-panel.js` receives the figure name `figureOf` (public/motion.js) already
  choose; with the frame registered through `npm run build:art` it draws `portrait-<figure>` fitted to the square instead of
  cropping the idle clip. When layered people art lands (the request below), portraits follow the same layers.
- **Check.** Beside the map figure at the same moment the portrait is recognisably the same person; the principal's rust is
  visible; the four children's portraits are told apart at 44 pixels; alpha edges clean, no painted transparency.

## Request 2026-09-15 — action icons for the family panel

**Status: delivered 2026-09-21.** (2026-09-28: `icon-haul-logs` retires with log hauling; keep the frame while a saved class may show the chore.) Four transparent atlases now supply all 53 current `PANEL_ICONS` keys, including the later service, road, subsistence, gathering and stock actions. See [delivery note](ART_DELIVERY_2026-09-21-FAMILY-ACTION-ICONS.md). Every action a student can give a person is now an
icon on that person's row ([FAMILY_PANEL.md](FAMILY_PANEL.md) §4, §6). The stand-ins are scene sprites shrunk into a square,
so several read poorly at 38 pixels (a barrel, a crate and sacks look alike) and four are plain drawn glyphs.

- **Why.** The owner asked that "each icon will have a picture of an action". A picture of a *thing* (a bucket) is not a
  picture of the *action* (digging a well), and a row of twelve small props is hard to scan.
- **What.** One icon per action, square, transparent, a single strong silhouette in the illustrated palette with a thin dark
  outline so it reads on the panel's light tile and at 34 and 38 CSS pixels (deliver at 128 by 128), and a version that still
  reads dimmed to 40 per cent (a refused action). Named `icon-<key>`:
  `survey-plot` (a stake being driven), `cut-lane` (an axe in brush beside a track), `dig-well` (a spade at a well mouth),
  `plant-field` (a hand dropping seed in a furrow), `harvest-field` (a sickle and a sheaf), `clear-plot` (a grubbing hoe and a
  stump), `fence-plot` (a maul splitting a rail), `build-house` (a log being notched), `help-raise` (two hands lifting a log),
  `hunt-timber` (a rifle among trees), `hunt-land` (a deer's head), `practise-shooting` (a mark with a hole in it),
  `sell-cotton` (a cotton bale and a coin), `fetch-powder` (a powder horn and lead), `fetch-seed` (a seed sack),
  `sell-food` (a barrel of meal and a coin), `mend-hoe` (a hoe blade and a file), `replace-hoe` (a new hoe and a coin),
  `fell-trees` (an axe in a trunk), `haul-logs` (a log on a chain behind an ox yoke), `travel-gonzales` (a signpost, town
  side), `travel-home` (a cabin doorway), `visit` (two cabins and a path), `work` (a hoe and a basket), `rest` (a bedroll),
  `stop-chore` (a hand raised, stop). Period-appropriate tools only (`HIST-GONZ-027`/`028`); no weapon pointed at a person.
- **How it plugs in.** `PANEL_ICONS` in `public/family-panel.js` maps each key to a sprite; registering the frames and naming
  `icon-<key>` there is the whole swap. `tests/family-panel.test.mjs` fails if an icon names a frame the atlas does not have.
- **Check.** All twenty-six side by side at 38 pixels are told apart without their popups by somebody who has not seen them;
  each still reads at 40 per cent opacity and under the yellow glow the panel draws round an action in progress.

## Request 2026-09-15 — the house plot's pieces

**Status: partially delivered 2026-09-15.** `house-modules.png` supplies registered round/hewn sills, low and full walls, partial and finished roofs, passage floor/roof, porch, finished shed room, building/finished stick-and-mud chimneys and a stone chimney. The live plot uses those pieces without changing server stages. Jacal modules, a shed frame, a two-sided double chimney, and separate floor and loft overlays remain open; the combined floor/loft plate is library-only. **Registration, 2026-09-23:** the sheet draws every piece alone in its cell and the delivery carries no footprints or seat points, so nothing said where a roof goes on its walls; drawn at the walls' ground anchor (for a roof, the tip of its eaves) it came down in front of them (student: *"the roof ... slides forward"*). The atlas now measures a seat on the full walls and each roof from the silhouette (`seatOf` in `scripts/build-atlas-manifest.mjs`, a `ceiling:` within about 6% of the walls' width of the seat read by eye). A later delivery that marks each pen piece's wall-top and eave points would replace the measure; the art itself is not wrong. **Chimneys, 2026-09-23** (owner: *"Something looks wrong with the chimneys too"*): nothing said where a pen's walls meet the ground either, so each chimney was drawn at the front of its own plot cell, which is not where the corner-on picture's wall is - it stood on the grass beside the pen. The atlas now also measures the feet of the full walls' three visible corner posts (`ground`, `groundOf` in `scripts/build-atlas-manifest.mjs`, a `ceiling:` within about 3% of the frame's width of the feet read by eye), and each chimney stands against the middle of its gable wall (`standChimneys` in `public/house-plot.js`). A delivery that marks each full-walls frame's four ground corners and each chimney's wall-side foot would replace the measure and the guessed stand-out (`CHIMNEY_STANDS_OUT`).

- **Why:** a pen currently repeats a whole-house silhouette, so additions cannot read as one coherent building.
- **What:** round/hewn 16-foot pen sills and ten stackable wall courses, door/window faces, separate rafters/clapboard roof and chinking overlays; jacal post/wattle/thatch stages; an eight-foot passage roof; stick-and-mud, stone and double chimneys; 16-by-8-foot shed and porch; floor and loft overlays. Match existing illustrated art. Supply grounded anchors, footprints and occlusion masks, with transparent PNGs and manifest entries. Roof and wall layers must support cutaways; construction stages must be independently addressable rather than baked into a single image.
- **Integration:** `public/house-plot.js` consumes the server's piece type, grid position and stage. Art must never decide construction completion, collision, logs or shelter. Keep unstarted pieces as plan presentation only.
- **Acceptance:** five presets and a free-built arrangement join without seams or duplicate roofs; course progression stays anchored; interior additions remain legible; missing/final stages and alpha/cell boundaries pass the art checks. These are construction state layers; no autonomous construction animation should advance authoritative progress.

## Request 2026-09-15 — the trees of the colonies

**Status: substantially delivered 2026-09-21.** `trees-colonies-1.png` supplies loblolly pine, cedar, mesquite, live oak and elm; `trees-colonies-2.png` adds post oak, blackjack, pecan, hackberry and sweetgum at pole/log/large sizes plus a felled hardwood log. Shortleaf pine and later species breadth remain.
at pole, log and large sizes, plus a pine stump. The owner asked for realistic woods (docs/WOODS_AND_BUILDING.md §4). The map now
draws every tree where it stands on the real land, of its kind: loblolly pine round Bastrop and in the east, live oak in the
coastal bottoms, post oak and blackjack on the savanna, pecan, elm and hackberry by the water, cedar in the hills, mesquite
west of the Guadalupe. Post oak and blackjack size variants, additional species-specific hardwoods and the general felled log remain open. Shortleaf uses the delivered loblolly silhouette until its own atlas exists.

- **Why.** A student standing in the Lost Pines sees broadleaf trees; one in the thornscrub sees bushes where the mesquite is
  a small tree. The kind of tree is what tells a family what its timber is good for (felling, step 4).
- **What.** Transparent, anchored at the foot of the trunk, seen from the game's three-quarter view, in the style of
  `oak-broad` and `cottonwood`, each at three sizes (`-pole`, `-log`, `-large`: a young straight tree, a
  mature one, an old wide one): `pine-loblolly` (tall, straight, a high crown of long needles), `cedar` (Ashe juniper,
  a dark bushy cone, often many-stemmed), `mesquite` (low, open, crooked, feathery), `live-oak` (low and very wide,
  dark evergreen), `post-oak` (a rounded crown of lobed leaves, stout crooked limbs), `blackjack` (smaller, darker,
  rougher than post oak), `elm` (vase-shaped). Stumps for pine and pecan to go with `stump-post-oak` and
  `stump-cottonwood`, and a felled log lying on the ground, for step 4. (2026-09-28: log hauling is being removed and felling puts its logs straight on the family's one wood pile, so a felled log lying out by its stump stops being drawn with it; the pile itself is request 2026-09-28 — people at work, item 16.)
- **How it plugs in.** `KINDS` in `sim/woods.mjs` names each kind's picture; the page draws `picture` at the tree's size
  (`TREE_SIZES` in `public/app.js`). Registering the frames and changing the names is the whole swap.
- **Check.** Beside `oak-broad` at the same size the crowns are comparable in width, so a closed stand still reads closed and
  savanna still reads open; a pine is plainly a pine at the size the map draws a tree close up.

## Request 2026-09-14 — game

**Status: delivered and in use 2026-09-15.** Found in play: "when hunting i don't see an animal". A hunt now places a deer
(`HIST-TEX-015`) ahead of the hunter in the timber, nearer if they wait for it.

- **Why.** The hunt's one decision - take the long shot or wait - means little when nothing is there to shoot at.
- **What.** A white-tailed deer, `deer-idle` (four frames, grazing and lifting the head), `deer-alert` (head up, ears
  forward, still) and `deer-bound` (four frames, running away), east-facing (mirrored for west), transparent, anchored at the
  hooves, sized to stand about as tall at the shoulder as a person's waist beside the existing people. No blood, no carcass.
- **How it plugs in.** `miniDeer` in `public/app.js` draws the clip for `chore.quarry`; `alert` while the hunter waits on the
  family's word, `bound` for the tick of a missed shot if that state is ever projected.
- **Check.** Scale against `rust-idle-s` and `horse-chestnut`, alternating legs in the run, no painted transparency.

Delivered in `wildlife-deer`: four-frame idle, alert, bound and drinking cycles. The live quarry uses idle and switches to alert while the hunter awaits the family's answer; the server still supplies the only position and visibility. Bound and drinking are registered for later projected states and never invent behavior.

## Request 2026-09-16 — the buildings the towns' research found

**Status: delivered 2026-09-21.** `town-buildings-researched.png` supplies five frame-building variants, Whiteside Hotel, two Round Top House views, four jacales/ramada, open and closed Mina stockades, and two Liberty court-room views. The six towns drawn from `docs/town-research/` (docs/TOWNS.md
§9) name buildings the library cannot draw. In the frontier-v1 style and the scale of `house-hewn-log` and `trading-house`,
south-facing like the other buildings, with a ground-contact shadow and no painted transparency:

1. **A frame building** — clapboard siding on sawn studs, a shingle roof, glazed sash windows, a plank door; one storey, and a
   storey-and-a-half variant. San Felipe's Cooper & Chieves saloon, the only frame building there in 1828; Columbia's Kelsey
   store; Matagorda's frame town of imported lumber. Stand-in: `trading-house`.
2. **A two-storey frame house**, two rooms below and two above — Columbia's Brown house, where the Senate sat. Stand-in:
   `frame-hall`.
3. **A storey-and-a-half log house with a central passage and a stick-and-mud chimney at each end** — San Felipe's Whiteside
   Hotel. Stand-in: `house-dog-run` drawn taller.
4. **The Round Top House** — a round fortified house with gun slits at first-floor level and a heavy door; Victoria's own
   landmark. Stand-in: `storehouse` drawn taller.
5. **Jacales in variety** — two or three jacal silhouettes and one with a brush ramada, for a town whose houses were mostly
   jacales (Victoria). Stand-in: the one `house-jacal` at varied heights.
6. **A frontier log stockade** — a free-standing square of set vertical logs with a gate, enclosing a cabin (Mina). Stand-in:
   `palisade` pieces run in a square with a `gate` and `house-hewn-log` inside.
7. **A small hewn-log court room, 22 feet square** — Liberty's Casa Consistorial. Stand-in: `cabin-small`.
8. **A circular log-and-sand fort**, ninety feet across, two rows of posts with sand between, a mound with a gun in the middle,
   gapped and derelict — Fort Velasco. Stand-in: `palisade` and `alamo-palisade-broken` pieces in a ring, `cannon-iron-e`.
9. **A steam sawmill on a bayou** — a long plank shed, a boiler house with a stack and smoke, a log deck and stacks of sawn
   pine — the Harrisburg Steam Mills. Stand-in: `timber-hall` and `storehouse`.
10. **A two-storey stone house with a gallery and an outside stair** — the Stone House at Nacogdoches, 70 × 23 ft. Stand-in:
    `stone-tile-house`.

- **How it plugs in.** Each building's `sprite` in `sim/town-layouts.mjs`; the stockade replaces the palisade pieces with one
  building. **Check** in `npm run test:towns`, whose close screenshots show each town.

## Request 2026-09-16 — driving the ox wagon

**Status: partially delivered and wired 2026-09-21** for `rust`, `teal`, `elder` and `blue`; the second cast and the children are still the composite stand-in. `people-wagon-drivers.png` supplies compositing-ready south/east/west/north seated driver layers for the original rust, teal, elder and blue cast. The second cast and child/adolescent coverage remain open. Owner's playtest, 2026-09-16: "characters don't actually
sit on the horse when using it ... Same thing for the Ox and Wagon." Whoever takes the ox and wagon was drawn walking in front
of it; they are now their own standing figure cut off at the waist and put on the front of the wagon, with the ox drawn
separately ahead. Nothing hitches the ox to the wagon, and going north or south the wagon is still side-on.

- **Why.** The person driving should read as driving: on the seat, reins or a goad in hand, the ox yoked to the tongue.
- **What.** In the frontier-v1 style and the scale of `wagon-covered` and `ox-walk`: (1) the covered wagon with one ox yoked to
  its tongue as one rolling rig, facing east (mirrored for west), north (away) and south (toward the camera), four frames each,
  with the wheels turning; loaded and empty covers as the existing `wagon-*-travel` cycles have; (2) a seated driver layer for
  each first- and second-cast figure (`rust`, `teal`, `blue`, `elder`, `rust-woman`, `indigo`, `ochre`, `blue-girl`) that sits
  on the rig's seat in each direction, holding the lines or a goad, anchored to the rig's seat point. A period ox driver often
  walked beside the team with a goad; this request is for the seated driver the owner asked for, and a walking-driver pose is
  welcome beside it.
- **How it plugs in.** `seatLayout('wagon', direction)` in `public/motion.js` returns the parts `drawSeated` draws; with the rig
  and driver layers registered through `npm run build:art`, it returns one `wagon-ox-<direction>` part and a
  `<figure>-drive-<direction>` layer in place of the separate ox, wagon and cut-off figure. `carriedWithRider` keeps the ox and
  wagon from being drawn a second time.
- **Check.** At the portrait's zoom, the driver is recognisably the same person as their walk cycle, the principal's rust coat
  visible; the ox stays hitched through a turn; ground contact matches `wagon-covered`; no painted transparency.

## Request 2026-09-14 — family members on horseback

**Status: delivered and wired 2026-09-21** for all eight identities; a child on the horse is still the composite stand-in. Six `people-mounted-cast*` atlases supply 96 frames and 24 authored east/south/north riding clips for all eight established identities; east mirrors west. The person's own figure now rides the family horse
and the owner saw a stranger riding). Found in play: a person sent on the horse was drawn walking with the horse beside them.
They are now drawn in the saddle as themselves, cut off at the waist over the horse's back, which reads as sitting but has no
legs astride and no hands on the reins.

- **Why.** A mother riding to the store, a son riding to hunt and the principal riding to Gonzales should each be seen as
  themselves on the family's horse, and the principal's rust coat must stay the student's mark even mounted.
- **What.** For each first- and second-cast adult figure (`rust`, `teal`, `blue`, `elder`, `rust-woman`, `indigo`,
  `ochre`) and the adolescent `blue-girl`: mounted on the same chestnut horse as `courier-mounted`, a walk cycle facing east
  (mirrored for west), north (away) and south (toward the camera), four frames each, same cell size and ground anchor as
  `mounted-courier-e`/`-n`/`-s`. Women ride astride or sidesaddle as the period evidence for Texas settlers supports; say which.
- **How it plugs in.** `seatLayout('horse', direction)` in `public/motion.js` returns one `${variant}-ride-${direction}` part in
  place of the horse and the cut-off figure, registered through `npm run build:art`; `carriedWithRider` keeps the horse from
  being drawn twice.
- **Check.** Each figure recognisably the same person as their walk cycle, horse scale identical to the courier's, feet
  alternating, no painted transparency, and the principal's rust coat visible from all three sides.

## Request 2026-09-14 — Béxar civic architecture

**Status: open; premade stand-ins in use.** The owner's San Antonio panorama guides the town composition; it does not establish detailed architectural elevations.

- **Why.** Named San Fernando and Governor's Palace landmarks should become recognizable without borrowing later façades or changing the game's art style.
- **What.** Research the 1836 appearance before production, then deliver `bexar-san-fernando-1836` and `bexar-governors-palace-1836`: warm outlined elevated three-quarter illustrated façades, transparent background, matched to existing `chapel`/`adobe-flat` scale and ground anchors. Preserve uncertainty explicitly where evidence is insufficient. Supply roofs separately if interiors are later required; the initial exterior is intentionally static.
- **How it plugs in.** Replace the two named sprite IDs in `public/bexar-layout.js`, preserve stable placement IDs and the Alamo coordinate transform, and register source, prompt, alpha bounds and anchors through the normal art build. No new scene or world entities are implied.
- **Check.** Compare the researched period reference and rendered town close-up; reject later architectural additions, painted transparency, mismatched perspective and doorways too small for the established person scale.

---

## Request 2026-09-14 — cleared ground

**Status: delivered and in use 2026-09-14.** `land-clearing` supplies four stump variants, cut-brush and ash states, four survey/corner markers and a four-pose smoulder cycle. Own timber plots now keep stumps; worked brush/timber plots show dry brush within the cleared portion. Smoke is catalogued but not inferred from work. See [delivery and checks](ART_DELIVERY_2026-09-14-FIELDS.md). Specified in [LAND_GRANTS.md](LAND_GRANTS.md) §5 and §7 step 4.

- **Why.** A family now clears ten-acre plots out of prairie, brush or timber (`HIST-GONZ-039`: timber three times the work).
  Ground cleared from timber was full of stumps for years; drawn as the same turned earth as prairie, the harder clearing
  leaves no mark on the land.
- **What.** In the frontier-v1 style, at the scale of `scrub` and `rocks`: `stump` (two or three variants, a felled post oak
  and a cottonwood stump), and `clearing-brush` (a pile of cut brush and a smouldering brush pile), for ground being cleared.
- **How it plugs in.** Single sprites on a transparent sheet, anchored at the base, listed in `ART_MANIFEST.md` by
  `npm run build:art`. `drawPlots` scatters stumps over a cleared plot whose `ground` is `timber`, keyed to its position like the
  ground scatter, and brush piles over the part of a staked plot already worked (`plot.work`).
- **Check.** A cleared timber plot and a cleared prairie plot side by side read differently at the closest zoom; the crop rows
  still read over the stumps; nothing is drawn on a neighbour's field.

---

## Request 2026-09-13 — stock and the grant

**Status: delivered and in use 2026-09-14.** The corrected `animal-stock` sheet passes alpha and spacing review with zero overlap trimmed. Three longhorn coats and a rooting hog replace the ox stand-ins, preserving own-land visibility and depth sorting. Survey stakes and corner markers are delivered in `land-clearing`; plot corners use the new stone marker and stake. Original request: [LAND_GRANTS.md](LAND_GRANTS.md) §3.

- **Why.** A family now chooses in the lobby whether it drives cattle and hogs in behind the wagon, which decides how
  much land it holds (`HIST-GONZ-036`). The herd is drawn with oxen until it has figures of its own.
- **What.** In the frontier-v1 style and projection of `ox-brown`: `cattle-longhorn` (idle, grazing; two or three
  coat variants) and `hog` (idle, rooting), at the scale the ox is drawn. Later, with Survey: a surveyor's stake and a
  corner marker (a blazed post or a stone mound), for staked plots and grant corners.
- **How it plugs in.** The same sheet contract as the ox: frames on a transparent sheet, anchored at the feet, listed in
  `ART_MANIFEST.md` by `npm run build:art`. The renderer draws them where it draws the two stand-in oxen now.
- **Check.** A stock family's yard shows cattle and hogs, a family without stock shows none, and they sort in front of
  and behind the house correctly.

---

## Request 2026-09-12 (second) — settling in: houses, interiors, furnishings, and people whose looks can be chosen

**Status: houses delivered and in use 2026-09-14** (`houses-settling`: the four houses and their `-site`, `-walls` and `-roofing` stages, drawn by the stage the server reports). **Interiors and furnishings delivered 2026-09-14** (`home-interiors`, `home-furnishings`), in use in the interior view since 2026-09-16; a saddlebag interior still open (below); the wagon's tools are Claude-drawn stand-ins since 2026-09-16 (see *Claude-drawn stand-ins* above). Parent head variants and age-specific bodies delivered 2026-10-02; semantic layers and task-specific refinements remain open. Specified in [SETTLING_IN.md](SETTLING_IN.md); the exact sheets are to be written
into this request when that chapter's build reaches them, in the contract format of the request below.

- **Layered people.** Students now choose what parents look like (skin tone, hair colour, clothing colour,
  and headwear or hair style), and children take after their parents. The authored cast is now used
  directly by `public/avatar-art.js`, with colour variants cached by `public/person-palette.js`. Needed:
  semantic layers and more reliable colour regions across
  the cast — adults, adolescents and children — drawn as aligned layers
  (body and skin, hair, facial hair or head covering, clothing), or with clean flat colour regions a
  renderer can swap, across idle, walk, vertical and task sheets.

  **Updated 2026-09-26 for the atlas-based appearance renderer** (`sim/look-vocabulary.mjs`,
  `sim/appearance.mjs`, `public/appearance.js`, `public/avatar-art.js`, `public/person-palette.js`).
  What a student can now choose, and so what the art must be able to show:

  | Part | Choices (the server's words, `SKIN`, `HAIR`, `CLOTHING`, `HEAD` in `sim/appearance.mjs`) |
  | --- | --- |
  | Skin | fair, light, warm light, olive, tan, copper, brown, dark brown, deep brown |
  | Hair | black, dark brown, brown, chestnut, auburn, red, sandy, fair, grey |
  | Clothes | rust, indigo, ochre, teal, butternut, grey, cream, forest, clay, plum, navy |
  | A man | felt hat, beard, bareheaded, hat and beard, moustache, straw hat |
  | A woman | bonnet, pinned hair, braid, loose hair, headscarf, straw hat |

  Children take a skin, hair and clothes colour after their parents and wear nothing on their heads.

  - **Format:** for every people sheet that exists now — `civilians`, `people-walk`, `people-vertical`, `people-work`,
    `people-carry`, `people-tasks`, `people-care`, `people-search-trade`, the three `people-children-*` sheets and the
    mounted rider — deliver the same grid, same cells and same frames as **aligned layer PNGs** named
    `<sheet>--<layer>.png`, every layer registered pixel for pixel with the others:
    `--line` (contours, and all shading as greyscale darkening, no hue), `--skin`, `--hair`, `--clothes` (each a
    greyscale value mask of only that region, light where lit, which the renderer tints), and the head items
    `--hat`, `--beard`, `--moustache`, `--straw-hat`, `--bonnet`, `--pinned`,
    `--braid`, `--loose`, and `--headscarf`. Hat and beard are composable together.
    Transparent RGBA; no painted checkerboard, text, borders or shadows. A child has no head option.
  - **One figure per sex and age band, not one per identity:** a man, a woman, an adolescent girl, an adolescent
    boy, and the girl, boy and small child already drawn. The identities in the second-cast request become
    unnecessary once layers exist; identity comes from the chosen colours.
  - **Style and scale** exactly as the second-cast request above (same preamble, line weight, camera, and every
    figure filling its cell the way an adult does).
  - **Tints are the renderer's**, from the words above; the art carries no colour in `--skin`, `--hair` or
    `--clothes`. Draw the masks so that a mid-grey tint reads as a believable mid tone and the lightest and darkest
    choices both keep their shading.
  - **Pose coverage:** idle, directional walking, ordinary work, battle action, seated horse and wagon,
    and reclining/fallen; every option must remain recognizable at map scale and in the family portrait.
  - **What Claude wires on delivery:** replace the current region classifier in `public/person-palette.js` with
    compositing of explicit painted masks. Keep the bounded per-frame cache in `public/art.js` and the
    `entity.appearance` contract, its packed projection, and saved choices. Add exact head silhouettes to every pose.
- **Houses — exteriors, written out 2026-09-13 for step 4, which is built and drawing stand-ins.** Needed for
  the map, at homestead scale, in the frontier-v1 style and the same projection and footprint as `cabin-small`
  (the renderer draws them at the size it draws a cabin now, anchored at the base centre):
  - `house-round-log`: one pen of unhewn logs with the bark on, saddle-notched corners, gaps chinked, a
    clapboard roof held by weight poles, a stick-and-mud chimney at one gable end (`HIST-GONZ-025`, `029`, `030`).
  - `house-hewn-log`: the same single pen with logs hewn flat and tight, squared corners.
  - `house-dog-run`: two log pens under one roof with an open passage between them and a chimney at each end —
    Austin's house at San Felipe is the documented model (`HIST-GONZ-035`).
  - `house-jacal`: posts set upright in the ground, walls of sticks daubed with mud, a thatched roof, one small
    room, eight to ten feet by twenty (`HIST-GONZ-026`).
  - For each, three construction stages drawn over the family's camp: `-site` (felled logs or cut posts
    stacked, a cleared footprint), `-walls` (walls half raised), `-roofing` (walls up, roof frame part-covered).
    The game picks them at 0–40%, 40–80% and 80–100% of the house's work.
  - **Not needed yet:** method variants (stone chimney, thatch on a log house, puncheon floor). Those wait for
    the construction-method choices, which are not built.
  - **Replaces:** the stand-ins listed above. Check: every house and stage draws, and the family figures stand
    in front of and behind it correctly in the back-to-front sort.
- **Interiors.** A single-pen interior, a dog-run's two pens and breezeway, and a jacal interior, drawn as
  rooms a student can place furniture in. **Delivered 2026-09-14 and in use since the interior view was built 2026-09-16**
  (`SETTLING_IN.md` §7.2). **Still open, written out 2026-09-16 — a saddlebag interior and the wagon's tools; stand-ins are
  drawing both (listed above):**
  - **Why.** A saddlebag house (two pens either side of one big central chimney, a fireplace in each, `sim/houseplot.mjs`)
    has its own rooms but is drawn on the dog-run's picture, so a student sees a passage and end chimneys their house does
    not have. The five tools that came in the wagon can be set out, but all five are one picture of a hatchet, axe and spade.
  - **What.** `interior-saddlebag`: in the `home-interiors` style, camera, scale and cutaway exactly as `interior-dog-run`
    (two round-log pens, front walls cut low, back walls with a window each), but the pens stand wall to wall around one
    stone chimney at the centre with a fireplace opening into each pen, a door in each pen's front wall, and no passage.
    Transparent, anchored at the base centre, a wide frame like the dog-run's. And, in the `home-furnishings` style and
    scale, each standing or leaning on the floor as it would in a cabin: `home-hoe` (a broad-bladed grubbing hoe),
    `home-felling-axe` (a long-handled axe), `home-broadaxe` (the wide, short-handled hewing axe), `home-froe` (the L-shaped
    riving blade with its club), `home-auger` (a T-handled auger). Period tools only (`HIST-GONZ-027`/`028`).
  - **How it plugs in.** Registered through `npm run build:art`; `INTERIORS.saddlebag.sprite` and the `tool:*` rows of
    `INTERIOR_ART` in `sim/interior-data.mjs` name the frames. The saddlebag's spots are re-measured on the new picture
    (fractions of its own box, at a thing's feet), the hearths moved to the central chimney; the spot ids stay, so saved rooms
    still open.
  - **Check.** `tests/interior.test.mjs` fails if a sprite named there is not in the atlas; in `npm run test:interior` a pot
    set by each saddlebag hearth stands at a fireplace, and each tool is told apart from the others without its label.
- **Furniture and brought goods.** Table, benches, bedstead, shelves, cradle; bedding, iron pot, chest,
  spinning wheel, clock, looking glass, crockery, rocking chair; a wagon camp.

---

## Request 2026-09-12 — families that look like who they are, and a rider who gets down

**Status: delivered for the requested family cast.** 2026-09-14: children's idle, east walk, rest and injured-rest (`people-children-idle`, `-walk`, `-care`), in use; the rider's vertical dialogue (`courier-encounters-vertical`), in use; the dismount, remount, on-foot and waiting-horse sheet (`courier-dismount`), registered and not yet bound; speaking and listening poses for the first cast (`people-dialogue`), registered and not yet bound. 2026-09-15: children's north/south walk sheet is delivered and in use. The second cast has idle, east/west and north/south walk, work, carry, care, search/trade, dialogue/listening, sowing and repair. See [vertical delivery](ART_DELIVERY_2026-09-21-CAST2-VERTICAL.md), [dialogue delivery](ART_DELIVERY_2026-09-21-CAST2-DIALOGUE.md), and [task delivery](ART_DELIVERY_2026-09-20-CAST2-TASKS.md).

### Why

Two things the game now does are drawn wrongly because the art does not exist.

1. **Rolled families** ([FAMILY_CREATION.md](FAMILY_CREATION.md)). A family is one to ten people (one to six before the twenty-sided die, 2026-09-14), with
   a sex and an age each, and a lone parent may be a mother. The library has one cast of four —
   `rust` (a man in a frontier hat), `teal` (a woman in a blouse and apron), `elder` (a grey-bearded
   man) and `blue` (an adolescent) — and **no children at all**. So a four-year-old and a baby are
   drawn as grown figures, and a lone mother who is her family's principal has to wear `rust`, the
   principal's mark, which is a man's outfit.
2. **News carried by people** ([LIVING_INFORMATION.md](LIVING_INFORMATION.md)). Riders now carry both
   reports in the slice and stop to talk. A rider can only be drawn mounted and facing east or west,
   so a conversation with somebody north or south of the road is drawn sideways, and "never hide a
   teleport with a conversation panel" means a rider cannot get down to talk at all.

### The delivery contract — the same as every existing people sheet

- **Format:** square **1254 × 1254** transparent RGBA PNG, **4 columns × 4 rows**, one full figure per
  cell, generous empty gutters, real alpha (no painted checkerboard), no text, borders, ground
  patches or shadows. A sheet may leave its last row empty; say so in the delivery note.
- **Style:** match `civilians`, `people-walk` and `people-vertical` exactly — the preamble in
  [art-prompts.json](art-prompts.json) for those sheets ("warm outlined storybook farm-game art,
  hand-drawn dark brown contour, moss/rust/cream/ochre palette, simple flat shading, slight elevated
  north-up view"). Same line weight, same camera, same proportions. Texas 1835 everyday clothes; not
  soldiers; no weapons.
- **Identity:** the same person keeps the same face, colours and clothing in every cell of every
  sheet they appear on. Identity drift between sheets is the most common failure in this library.
- **Feet:** constant foot baseline within a row; the figure centred in its cell.
- **Scale:** **draw every figure to fill its cell the way an adult does**, children included. The
  builder normalises each people row to one logical height, so a child drawn small on the sheet
  would still come out adult-sized; the renderer will shrink children by age instead. Keep a
  child's *proportions* a child's — larger head to body, shorter limbs.
- **Pipeline:** put the PNG in `public/assets/frontier-v1/atlases/`, add the sheet and its frame ids
  to `SHEETS` in `scripts/build-atlas-manifest.mjs` (use the `people-` or `courier-` prefix so row
  heights are measured), define the clips in the builder next to the existing ones, record the
  prompt in [art-prompts.json](art-prompts.json) and the source in
  [art-provenance.json](art-provenance.json), then run `npm run build:art` and `npm test`.
  `npm run test:art` checks real browser pixels if Playwright is installed.
- **Clip names** follow the existing pattern `<variant>-<action>[-<facing>]`: `idle-s/-e/-w/-n`,
  `walk` (east, mirrored for west), `walk-s`, `walk-n`, `work`, `carry`, `sow`, `repair`,
  `search`, `trade`, `care`, `rest`, `injured-rest`. New variant names are given below.

### What to draw, in priority order

Deliver in this order; each group is useful on its own.

#### Priority 1 — children (three sheets)

Three new identities. Period detail: in the 1830s small children of either sex commonly wore a
simple gown, so the smallest child is not dressed as a boy or a girl.

| Variant | Who | Clothing |
| --- | --- | --- |
| `girl` | a girl of about 5–9 | faded rose calico dress, cream pinafore, bare feet or small brown shoes, dark braid |
| `boy` | a boy of about 5–9 | undyed linen shirt, brown trousers held by one suspender, bare feet, straw-coloured hair, no hat |
| `smallchild` | a child of about 2–4 | plain cream gown to the shins, bare feet, short hair |

| Sheet | Rows | Columns |
| --- | --- | --- |
| `people-children-idle` | 1 `girl`, 2 `boy`, 3 `smallchild`, 4 the infant (below) | idle facing south, west, east, north. Row 4: a swaddled infant lying in a small woven basket — awake, asleep, basket seen from the west, basket from the east |
| `people-children-walk` | 1 `girl`, 2 `boy`, 3 `smallchild`, 4 empty | a four-frame walk loop facing screen-right, walking in place: left foot forward; passing; right foot forward; passing with the other leg raised. The small child toddles — shorter steps, arms out a little |
| `people-children-vertical` | 1 `girl`, 2 `boy`, 3 `smallchild`, 4 empty | walking toward the camera left leg forward; toward the camera right leg forward; away left leg forward; away right leg forward. Clear front and back views, not side views |

Also, on `people-children-idle` or a fourth sheet if it will not fit: `girl`, `boy` and `smallchild`
**sitting at rest** and **lying hurt** (the equivalents of `rest` and `injured-rest`). Children under
ten are never sent to work, so no work, carry, sow or repair poses are needed.

#### Priority 2 — a second cast, so men and women look like themselves (three sheets first, then five)

Four new identities that sit beside the existing four.

| Variant | Who | Clothing |
| --- | --- | --- |
| `rust-woman` | an adult woman who is her family's principal | **the principal's rust colour** as a rust-red short gown or blouse, tan skirt, cream apron, brown shoes, tan sunbonnet. It must read as the same mark as `rust` at a glance |
| `indigo` | an adult woman | indigo-blue dress, cream kerchief at the neck, brown shoes, dark hair pinned up, no hat |
| `ochre` | an adult man, younger than `elder`, clean-shaven | ochre shirt, dark brown waistcoat, grey trousers, brown boots, no hat, short dark hair |
| `blue-girl` | an adolescent girl of about 10–17 | muted blue dress to the ankle, cream apron, brown shoes, hair in one braid |

First deliver the three sheets that every person on the map uses, laid out exactly like the
existing ones with these four identities as rows 1–4:

| Sheet | Matches |
| --- | --- |
| `people-cast2-idle` | `civilians` — idle south, west, east, north |
| `people-cast2-walk` | `people-walk` — four-frame walk facing screen-right |
| `people-cast2-vertical` | `people-vertical` — toward-camera left/right, away left/right |

Then the task sheets, again row for row as the existing ones: `people-cast2-work` (as
`people-work`), `people-cast2-carry` (as `people-carry`), `people-cast2-tasks` (as `people-tasks`:
sow and repair), `people-cast2-care` (as `people-care`), `people-cast2-search-trade` (as
`people-search-trade`). Each identity also needs `rest` and `injured-rest` wherever the existing
cast has them.

#### Priority 3 — the rider gets down (one sheet)

Same rider and same chestnut horse as `courier-mounted` and `courier-encounters`: brown broad-brim
hat, ochre shirt, dark teal waistcoat, tan trousers, brown boots, brown shoulder dispatch bag; the
horse with black mane and tail and a small white forehead mark. Fixed east-facing elevated
side/three-quarter view in all cells.

| Sheet | Row | Four frames |
| --- | --- | --- |
| `courier-dismount` | 1 Dismount | reins gathered, weight shifts left; right leg swings over; stepping down, left foot still in the stirrup; standing beside the horse, reins in hand |
| | 2 Remount | foot to the stirrup, hand on the saddle; rising; leg swinging over; seated, reins gathered |
| | 3 On foot beside the horse, talking | listening, reins loose in the left hand; small nod; speaking, right palm open; small gesture outward |
| | 4 The horse waiting, no rider | standing tethered at rest; head lowered; head raised, ears forward; tail swish |

#### Priority 4 — talking toward and away from the viewer (two sheets)

Riders stop beside people on every side of a road, so a conversation needs to face south and north
as well as east.

| Sheet | Rows (four frames each) |
| --- | --- |
| `courier-encounters-vertical` | 1 mounted rider **listening, facing the camera** (south): neutral, head tilt, nod, neutral. 2 mounted rider **speaking, facing south**: relaxed, open palm, small outward gesture, near neutral. 3 **listening, facing away** (north): neutral, head turn, nod, neutral. 4 **speaking, facing north**: relaxed, raised hand, gesture, lowering |
| `people-dialogue` | the **existing** cast `rust`, `teal`, `elder`, `blue` as rows 1–4, each: speaking east frame 1 (hand raised a little); speaking east frame 2 (open palm); listening facing south (hands together, head slightly forward); listening facing north (seen from behind, head slightly tilted) |

When the second cast exists, a matching `people-cast2-dialogue` follows the same layout.

### What Claude will do on delivery

The stand-ins above are already in place, so delivery means replacing them:


- Bind children by age: `smallchild` under 5, `girl`/`boy` 5–9, the adolescents 10–17; an infant
  under 2 is drawn as the basket beside whoever of the family is at home.
- Draw children smaller by age: a small child at about 55% of adult height, a child of 5–9 at about
  70%, an adolescent at about 90%.
- Choose each person's figure from their sex and age instead of a hash of their id, keeping the
  principal in rust — `rust` or `rust-woman`. The founding four, who have no stated sex or age,
  keep today's choice. *Superseded 2026-09-24:* keeping the id hash drew a founding mother as a man and a son as a woman
  (the Host's map, `hh-9-elena`), so the founding four are now drawn by the sex their role states and a townsperson by the
  sex authored with their name (`seenAs` in `sim/town.mjs`, `figureOf` in `public/motion.js`). No new art was needed.
- Use `courier-dismount` and the vertical dialogue sheets in encounters, so a rider halts, gets down,
  turns to face the listener, and remounts with the same horse.
- Add clip-binding tests that every new clip name a binding can produce exists in the shipped
  library, as `tests/motion-binding.test.mjs` does for the current cast.

### How it will be checked

- `npm test`: measured bounds, alpha and anchors, every sheet's inventory entry, reproducible
  manifest generation, and the clip-binding tests above.
- The art catalog (`/art-catalog.html`): every new frame on light and dark backgrounds, animation
  played and scrubbed.
- In the running class: a rolled family of six at household scale and on a narrow phone — a mother,
  a father, children of different ages and a baby, each readable as who they are; a lone mother
  picked out as the principal at a glance; a rider stopping north and south of a road.
- Identity: the same person looks like the same person across idle, walk, vertical and task sheets.

## Request 2026-09-20 — the gathering icons

- **Why.** Four new works went on the family panel on 2026-09-20 — small game, a line in the water, the oyster beds and a
  bee tree (`sim/gathering.mjs`, docs/BIOMES.md §17.3) — and the panel's other twenty-odd actions are illustrated icons.
  These four are strokes drawn in code until their frames land, which is the standing practice and is marked `stand-in:`
  in `public/family-panel.js`.
- **What.** One icon per action, square, transparent, a single strong silhouette in the illustrated palette with a thin
  dark outline, reading at 34 and 38 CSS pixels (deliver at 128 by 128) and still at 40 per cent opacity. Named
  `icon-<key>`: `take-small-game` (a squirrel on a branch with its tail up, or a rabbit — the hour's work, not the
  day's), `fish-the-water` (a fish on a line over water), `gather-oysters` (two opened shells on wet sand, water behind),
  `cut-bee-tree` (a hollow trunk with comb in it and a bee). Period-appropriate: a line and a hook, not a rod and reel;
  an axe, not a saw.
- **How it plugs in.** `PANEL_ICONS` in `public/family-panel.js` maps each key to `{ glyph: … }` today; registering the
  frames and naming `{ sprite: 'icon-<key>' }` there is the whole swap. `tests/family-panel.test.mjs` fails if an icon
  names a frame the atlas does not have.
- **Check.** The four beside the hunt's own icons at 38 pixels are told apart without their popups, and the oyster and
  the bee tree read as *food* rather than as *shore* and *tree*.

## Request 2026-09-20 — the stock icons

- **Why.** The family's own stock became a herd on 2026-09-20 ([STOCK.md](STOCK.md)) and put three works on the family
  panel. They are strokes drawn in code until their frames land, marked `stand-in:` in `public/family-panel.js`.
- **What.** One icon per action, square, transparent, a single strong silhouette in the illustrated palette with a thin
  dark outline, reading at 34 and 38 CSS pixels (deliver at 128 by 128) and still at 40 per cent opacity. Named
  `icon-<key>`: `butcher-beef` (a long-horned cow of the period — a Spanish criollo beast, lean and rangy, not a modern
  Hereford), `butcher-hog` (a razorback hog with its snout down in acorns, not a fat pink pig), `look-to-stock` (a rider
  on the range, or a hat and a coiled rope over open grass). **No blood and no butchery**: these name the work, and the
  work is a family feeding itself.
- **How it plugs in.** `PANEL_ICONS` in `public/family-panel.js` maps each key to `{ glyph: … }` today; registering the
  frames and naming `{ sprite: 'icon-<key>' }` there is the whole swap. `tests/family-panel.test.mjs` fails if an icon
  names a frame the atlas does not have.
- **Check.** The cow and the hog are told apart at 38 pixels without their popups, and neither reads as the deer of the
  hunt's own icon.

## Request 2026-09-21 — the children's icons

**Status: delivered 2026-09-22.** `icons-children.png` contains all six illustrated icons on true alpha. The atlas audit
retained every object in full with no cell-overlap trimming. `PANEL_ICONS` now names the frames directly.

- **Why.** A child under ten had an empty action bar until 2026-09-21, when the owner gave them works of their own
  ([FAMILY_CREATION.md](FAMILY_CREATION.md) §3's amendment, `sim/children.mjs`): play, kindling, keeping the birds off the
  corn, the eggs, carrying water, and minding the younger ones. Six new keys on the family panel, drawn today as strokes
  in code and marked `stand-in:` in `public/family-panel.js`.
- **What.** One icon per work, square, transparent, a single strong silhouette in the illustrated palette with a thin dark
  outline, reading at 34 and 38 CSS pixels (deliver at 128 by 128) and still at 40 per cent opacity. Named `icon-<key>`:
  - `child-play` — a stick horse, or a hoop and stick: **the one icon that must not look like a job.**
  - `child-kindling` — an armful of bark, chips and dead sticks. **No axe anywhere in the frame**; that is the rule this
    icon carries, and a hatchet in a child's hand would say the opposite of what the work is.
  - `child-birds` — blackbirds going up off a standing ear of corn.
  - `child-eggs` — two or three eggs in a nest of straw, or a small basket of them.
  - `child-water` — a wooden pail with a bail, water in it.
  - `child-mind` — a bigger child with a smaller one on the hip. **A child minding, not an adult**: the difference in
    height is the whole content of the picture.
- **The rule the set has to keep.** These are **children's** works. Wherever a figure appears it reads as a child — smaller
  head-to-body ratio, the rule the people stand-ins already proved. Nothing in the set holds a tool with an edge, and
  nothing in the set holds a gun.
- **How it plugs in.** `PANEL_ICONS` in `public/family-panel.js` maps each key to `{ sprite: 'icon-<key>' }`.
  `tests/family-panel.test.mjs` fails if an icon
  names a frame the atlas does not have.
- **Check.** `child-play` is told from the five jobs at 38 pixels without its popup, and `child-mind` is not mistaken for
  a mother and baby.

## Request, 2026-09-21 — the Play Solo menu's trash can

**Status: delivered 2026-09-22.** `launcher/art/icon-delete-save.png` is a transparent, tintable frontier stave pail with
its lid open. The Play Solo dialog embeds it and tints the same source for ordinary, selected and warning-red hover states.
See [LAUNCHER_ART.md](LAUNCHER_ART.md) for its exact prompt and provenance.

**What it is for.** The owner: *"When I click Play Solo a menu appears. This menu has the saves. That's where a little
trash can emblem should appear and let me delete the save."* One emblem at the end of each row of the saved-games list in
the launcher's Play Solo dialog (`launcher/SoloGameDialog.cs`). Pressing it asks once and then sets that game aside.

**Name:** `icon-delete-save`.

**Size:** 16×16 and 32×32, PNG with transparency. The row is 30px tall and the emblem is drawn in a 34px-wide cell at the
end of it, so it must read at 16px and stay square.

**Two states, both wanted:** at rest, and under the pointer. At rest it is the colour of the row's own text — near-black
on the pale list, near-white on the selected green row — so it must be supplied as a *shape* that can be tinted, or as
two files. Under the pointer it goes to the game's warning red (`#963420`).

**What it should look like.** A frontier object rather than a modern office bin: a lidded pail or a stave bucket would sit
better with the rest of this launcher than a cylindrical wheelie bin. It has to be unmistakably "throw this away" at 16px,
which is the whole difficulty — a bucket alone reads as water. A lid lifted slightly, or a handle, is probably what
separates them.

**Where it will be drawn:** on a pale parchment list (`#F6F0E1`) and on a selected green row (`#4A6850`). No drop shadow;
it sits inside a row, not on the map.

**Fallback:** if a damaged or unusual package cannot load the embedded PNG, `DrawBin` falls back to its former pen drawing.
A picture of the earlier menu is `evidence/solo-dialog.png`.

## Request 2026-09-25 — Coleto and Goliad

**Status: open; stand-ins in use since 2026-09-25 (see *Stand-ins in use*).** Coleto (March 19–20, 1836) and the Goliad
massacre (March 27) are fought on the battle engine (`sim/battles/coleto.mjs`, `sim/battles/goliad-massacre.mjs`,
`docs/BATTLES.md` §11; staging in `docs/battle-research/staging.md` §6.9 and §7.9). Four things they need are not in the library (a fifth, the white flag, is §7's);
each is drawn now from the nearest art and marked `stand-in:` in the code. The delivery contract is the people sheets' own:
transparent PNG, the figure on its ground anchor, the `volunteer-*`/`regular-*` logical height, east frames mirrored for west.
No blood, no wound shown, no body detail (`VISION.md` §16).

1. **A marksman lying in the grass, firing** - `regular-prone-lie`, `regular-prone-aim`, `regular-prone-fire`, east-facing, a
   Mexican cazador in the tall grass at night. Plugs into the loose parts of Coleto's `dusk`, `night` and `small-hours`.
2. **An unarmed prisoner** - delivered in `goliad-prisoner`: east/south/north walking, calm idle, worried look-back, running, ducking, injured sitting and non-graphic still poses. This figure wears a worn frontier coat and carries no weapon or ammunition belt. It plugs into the three columns, prison yard and kept-back groups with `figure: 'prisoner'`; Goliad's fallen sampled prisoners also keep this unarmed look. Future crowd variety can add more unarmed identities.
3. **Francita Alavez** - delivered in `famous-alavez`: east/south/north walks, idle, speaking/listening, reach, beckon, guide and rest poses. The original costume design uses a rebozo and long skirt; it does not claim a documented likeness. The `alavez` part uses `figure: 'alavez'`.
4. **The baggage carts** - delivered in `coleto-baggage-cart`: a loaded two-wheeled cart without an ox, two tilt frames, and a tipped low breastwork state. `cart-baggage-tip` is a non-looping authored clip during the small hours; the tipped state persists into dawn and surrender. The square's carts now draw these states in `public/battle-view.js`.
5. **A white flag** - the storming of Béxar's own request 2026-09-25 "a white flag, a bugler and the parleying officers" covers Coleto's too (`drawWhiteFlag`, `phase.flags`).

## Request 2026-09-25 — battles: the pieces the engine stands in for

**Art delivery, 2026-09-25:** `cannon-cartwheels.png` now provides east and west rest
and recoil frames of the small brass gun on plain cart wheels. The two authored recoil
clips are `cannon-cartwheels-e-recoil` and `cannon-cartwheels-w-recoil`. The atlas has
measured all four frames with no cell overlap. The battle and town renderers now select
this art for the Gonzales cannon; the matching three-person settler crew and other
battle pieces below remain open. The cannon stand-in row now covers only that crew.

`flag-come-and-take-it.png` also now provides a still flag and three distinct cloth
poses, with a registered `flag-come-and-take-it-wind` loop. All four have readable
`COME AND TAKE IT` lettering under the cannon and star. The battle and town renderers
now choose these frames at the event's own moment. The flag stand-in row is removed;
unfinished cloth work at the town table still uses canvas because it depicts another state.

**Status: open; stand-ins in use since 2026-09-25 (see *Stand-ins in use*).** The owner, watching every conflict: *"i see npc's just standing around ... there's no smoke from the gunfire."* The battle renderer (`public/battle-view.js`, `docs/BATTLES.md` §6) draws every fight from the library's military sheets; five things it needs are not in them. Each is drawn now from the nearest art and marked `stand-in:` in the code. The delivery contract is the same as every existing people sheet: transparent PNG, the figure standing on its ground anchor, the same logical height as the `volunteer-*` and `regular-*` frames, east-facing frames mirrored for west unless a west frame is supplied.

1. **A family's own people firing.** Every cast figure (`rust`, `teal`, `elder`, `blue`, `rust-woman`, `indigo`, `ochre`, `blue-girl`, and the second cast) in four frames: `<cast>-aim`, `<cast>-fire`, `<cast>-load` (kneeling, as `volunteer-load`), `<cast>-ramrod`. Plugs into `memberPose`: the clip `<cast>-fire-reload` is chosen when it exists. Checked by `npm run test:battle-gonzales` (the member's clips) with the cast's own name.
2. **A dragoon firing from the saddle.** `dragoon-fire-1`/`-2` (carbine at the shoulder, then the discharge) east-facing, at the `dragoon-e` height. Plugs into the dragoon branch of `draw`; the flash is drawn at the muzzle the frame's own anchor gives.
3. **The wounded carried.** `bearers-carry-1`..`-4` (two men carrying a third on a blanket, walking east) and `dragoon-wounded-led-1`..`-2` (a man slumped in the saddle, another leading the horse). Plugs into `drawFallen`. No blood, no gore (`VISION.md` §16).
4. **The Gonzales cannon on its wheels.** `cannon-cartwheels-e` and a recoil frame: a small brass six-pounder lashed on a pair of plain cart wheels, no trail carriage (`HIST-TEX-475`), and a crew of three in settlers' clothes (`settler-gun-ram`, `-carry`, `-fire`). Plugs into `drawCannon` when `metal` is `bronze` and the engagement asks for `cartwheels`.
5. **The Come and Take It flag.** `flag-come-and-take-it` still, and a two-frame `-wind` loop: a white field, the cannon in black, a single star over it, the words under it (`HIST-TEX-475`), on a plain pole about twice a man's height. Plugs into `drawFlag`; also wanted by the town before the fight (`sim/town-scenes.mjs`).


## Request 2026-09-25 — the south's fights: San Patricio by night and Agua Dulce Creek

**Status: open; stand-ins in use since 2026-09-25 (see *Stand-ins in use*).** San Patricio and Agua Dulce Creek are drawn on the battle engine where they were fought (`docs/BATTLES.md` §6.14, `sim/battles/san-patricio.mjs`, `sim/battles/agua-dulce.mjs`). The staging sheet (`docs/battle-research/staging.md` §4.9) names what the library lacks. The delivery contract is the same as every existing people and building sheet.

1. **Night.** A night light layer the renderer can lay over a fight (moonless, cold rain: `HIST-TEX-510`), under which lit windows and a fire read. Plugs into `drawNight`.
2. **Lit windows and a campfire at night.** An overlay frame for `adobe-flat` and `house-jacal` with lamplight in a window, and `campfire` at night. Plugs into `drawScenery`.
3. **A volunteer on horseback.** `volunteer-ride-e`/`-s`/`-n`, four frames each, at the `dragoon-e` height, and a frame firing from the saddle. Plugs into the rider branch of `draw` and `memberPose`.
4. **A driven herd.** `herd-drove` (several hundred horses moving as one mass, four frames) and `herd-scatter`. Plugs into `drawHerd`.
5. **A live-oak mott.** One sprite of a grove of live oaks with shade under it. Plugs into `drawScenery` for a `grove`.
6. **A lancer charging.** `lancer-charge` (a dragoon at the gallop, lance held level, never shown striking; `VISION.md` §16). Wanted by Agua Dulce and the Alamo's cavalry; until it lands the dragoons ride in `dragoon-march`.

The lasso that took Reuben Brown (`HIST-TEX-511`) is told in the caption and the account and not drawn.

## Request 2026-09-27 — Seguín, the ashes, and the later church claim

**Art and storyboard delivered; gameplay trigger remains future work.** `famous-seguin-ashes` gives Seguín a four-pose one-shot collection sequence. `alamo-ash-sites-1837` has two small distinct sites, one large site and a scooped close state. `seguin-funeral-props` provides the black 1837 wooden coffin closed, open, set for public honors, and in a church-floor recess. `san-fernando-1936` supplies the intact floor, renovation opening, discovered box and later marble memorial. All assets are transparent atlases with prompt/source provenance in `scripts/art-deliveries/seguin-ashes-cutscene.mjs`; `public/assets/frontier-v1/seguin-ashes-cutscene.json` names their seven intended beats and claim labels. See `docs/SEGUIN_ASHES_CUTSCENE.md` for historical boundaries and integration instructions.

The public 1837 collection and funeral are documented; Seguín alone with a cloth is a dramatized close camera moment, **not a documented secret rescue**. Church-floor placement follows his later recollection and conflicts with an earlier outdoor-interment account. The 1936 discovery's identification with the defenders is disputed. The white marble memorial must never appear as his 1837 container. The current game does not yet reach February 1837: Claude needs to wire a postwar trigger, camera, skip/replay and source note without adding this event to the 1836 battle clock. Four browser storyboard stills in `docs/evidence/seguin-ashes-*.png` show the intended art compositions.

## Request 2026-09-25 — Concepción and the Grass Fight

**Status: open; stand-ins in use since 2026-09-25 (see *Stand-ins in use*).** Concepción (October 28, 1835) and the Grass Fight (November 26) are drawn on the battle engine (`sim/battles/concepcion.mjs`, `sim/battles/grass-fight.mjs`; `docs/battle-research/staging.md` §1.9, §2.9). The contract is the people sheets' own: transparent PNG, figures on their ground anchor at the `volunteer-*`/`regular-*` height; ground pieces drawn from above at the map's scale.

1. **A cut riverbank** `riverbank-cut-e`/`-w`: a bank face five or six feet high with steps cut in it, grass on the lip; and `river-bend`, the bottom 50–100 yards deep in a bend with pecans and cottonwoods. Replaces the `earth-rampart` line in `concepcionScenery`.
2. **The climb-fire-drop cycle** `volunteer-bank-climb-1`..`-6`: step up the cut, aim and fire over the lip, step down, load under the bank. Plugs into the `bank` branch of `draw` (the loading figure's drop is then dropped).
3. **Fog** `fog-bank-dense`, `fog-bank-thin`: low banks lying on the ground, which `drawFog` would lay over the field instead of the veil.
4. **Mission Concepción** `mission-concepcion`: the church with its twin towers and dome, seen from about 500 yards (the lookouts were in its cupola).
5. **A bugler and a drummer** `regular-bugler` is delivered (idle, raise, sound, lower) so the documented charge and retreat calls have a visible source (`HIST-TEX-480`); the call stays captioned. `regular-drummer` is delivered with idle, raise and two-beat poses and registered start/loop clips. It is held for a documented drum cue rather than placed in Concepción on inference alone. No Texian drum or flag (Creed Taylor).
6. **Pack mules under grass** `mule-packed-grass-walk` (east, north, south, four frames) and `grass-bundle-cut` (a pack slit open, grass spilling). Replaces the `packhorse` figure.
7. **A dry creek bed in thick mesquite** `creek-bed-dry` (a ground piece, about 40 yards of bed) and `creek-ford` (water over a crossing, for Jack's men at the trot).
8. **Mules harnessed to a gun or caisson** `limber-mules-walk`, men riding them off ("two or three on a mule", Smithwick), and **a padre with carts** for the Mexican dead and wounded after Concepción: today told in the caption, not drawn.
## Delivered 2026-09-28 — James Grant

The famous-person delivery in `scripts/art-deliveries/famous-grant.mjs` adds sixteen foot frames, four mounted-walk frames and four mounted-gallop frames. Grant's own horse now appears in the existing Agua Dulce approach and pursuit, with the faster gait confined to the visible ambush interval. His later surrender and death remain off-screen as already staged. The clean bandage and arm-sling poses can support his earlier Béxar injury without graphic treatment. The generated manifest lists every frame and animation clip; the source and prompt records are in the art JSON files. Costume, face and horse are interpretive game art, not portrait evidence.


## Delivered 2026-10-03 — mounted carbine and lancer gait

The mounted carbine request now has four authored poses in dragoon-carbine-actions and a live dragoon-fire binding. The lancer-charge request has four registered gallop frames, available for explicit lancer staging; generic dragoons retain their existing movement. See ART_DELIVERY_2026-10-03-CAVALRY.md for integration, animation limits and tests.


## Delivered 2026-10-03 — Coleto prone marksmen

Coleto item 1 now has four transparent prone poses and a registered firing clip, bound to existing Mexican loose formations in dusk/night/small-hours. See ART_DELIVERY_2026-10-03-COLETO-PRONE.md for timing, scaling, provenance and remaining full-reload work.


## Delivered 2026-10-03 — grass-laden pack mules

Concepcion/Grass Fight item 6 now has east/south/north four-pose mule walking, matching idle frames and an opened grass bundle. The Grass Fight pack train uses these sprites. See ART_DELIVERY_2026-10-03-GRASS-MULES.md for integration and remaining unloading/cutting work.


## Delivered 2026-10-03 — live-oak motts

Southern fights item 5 now has dense/open composite oak groves with two-pose foliage loops. Agua Dulce's existing groves use these clips, with the old individual-tree fallback retained. See ART_DELIVERY_2026-10-03-OAK-MOTTS.md for visual scale, provenance and remaining canopy polish.


## Delivered 2026-10-03 — night-lit houses and campfire

Southern fights item 2 now has four authored flame/light loops and sixteen transparent frames. San Patricio's existing projected lights select lit jacal/cabin and fire art. Adobe variant is registered for later staging. These are full building variants; exact window-only overlays remain future work. See ART_DELIVERY_2026-10-03-NIGHT-LIGHTS.md.


## Delivered 2026-10-03 — dense and thin ground fog

Concepcion item 3 now has dense/thin two-pose transparent mist banks. Numeric battle fog selects these layered clips, retaining the old veil as a missing-art fallback. Coleto's separate light=fog wash is unchanged. See ART_DELIVERY_2026-10-03-GROUND-FOG.md for opacity and remaining keyframe smoothing.


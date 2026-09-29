# The Claude art plan

Owner, 2026-09-28: *"Astra wrote this so that you can help make art. make all of the remaining art. yours will be temporary. label yours so astra can replace as it makes the final versions."* Her brief is [ART_STYLE.md](ART_STYLE.md). This is every open art item, divided into six areas small enough for one builder each, with what to deliver, at what size, where it plugs in and how urgent it is. The same table (`scripts/claude-art/plan.mjs`) writes *What Astra still needs to make* in [ART_REQUESTS.md](ART_REQUESTS.md): everything drawn here is temporary, and each item stays on her list after Claude's version lands.

**Generated.** Edit `scripts/claude-art/plan.mjs` and run `node scripts/claude-art/write-plan.mjs`; the status column is read from the Claude manifest, so an item is marked *Claude stand-in in place* the moment its frames are built. `npm test` fails on a stale copy.

## Summary

| Area | Items to make | Priority 1 | With a Claude stand-in | Skipped |
| --- | ---: | ---: | ---: | ---: |
| A — People at work and ambient poses | 18 | 5 | 2 | 0 |
| B — Children, babies and sickness | 11 | 5 | 11 | 2 |
| C — Soldiers, battles and famous people | 19 | 1 | 0 | 1 |
| D — Riders, horses, wagons, carreta, ferry, steamboat | 15 | 2 | 15 | 4 |
| E — Buildings, houses, towns, Béxar, the Alamo, interiors | 15 | 1 | 1 | 3 |
| F — Terrain, trees, the norther, fields, icons, marks and effects | 10 | 1 | 2 | 17 |
| **Total** | **88** | **15** | **31** | **27** |

## How a builder works

1. **Start from the kit.** `scripts/claude-art/kit/`: `style.mjs` (the palette, line and geometry measured from Astra's `civilians`, `people-walk` and `people-vertical` by `measure-style.mjs`), `svg.mjs` (outline, flat shade, frame wrapper), `rig.mjs` (the person rig: every cast figure, the children and four generic figures, posed by joints with IK), `poses.mjs` (the pose library), `horse.mjs` (the horse and `mountedFrame`), `props.mjs` (tools and props). `node scripts/claude-art/proof-rig.mjs <figure>` draws every pose of a figure beside Astra's own (docs/evidence/claude-art/rig-<figure>.png).
2. **Add your own area module**, `scripts/claude-art/areas/<name>.mjs`, exporting `AREA` (your letter's key: `work`, `children`, `battles`, `transport`, `places`, `land`), `DATE`, `SHEETS` and `CLIPS` - see `chop.mjs` (a four-frame clip from the rig) and `wood-pile.mjs` (a procedural prop) - with a written `prompt` for every frame and clip (it is the provenance), and `compare` naming the Astra frames it is judged beside. Never edit another builder's module or a shared list: the build finds modules by reading the folder.
3. **Name frames and clips exactly as the request asks** (`<figure>-<pose>-<n>`, clip `<figure>-<pose>`), so the game's own clip name picks up the stand-in and Astra's of the same name replaces it. A clip is declared as hers are in `animation.json` (frames with durations, `loop`, `motion`, `direction`), plus `beat` for the frame a tool lands on.
4. **Build and look.** `npm run build:standins -- --only <name>` renders your sheets, writes `public/assets/claude-standins/areas/<name>.json` and merges `atlas.json` and `docs/claude-art-provenance.json`. `node scripts/claude-art/compare.mjs <name>` draws your frames beside hers at 40, 77 and 150 px on the map's grass (docs/evidence/claude-art/compare-<name>.png). Look at it before you commit.
5. **Wire it only where the game does not already ask for the name.** Most items plug in with no code: the renderer asks for `<figure>-<pose>` and art.js lets a Claude clip fill the gap. Where the code still draws a stand-in of its own (a canvas tool, a `log-fallen` row), switch it the way `STROKES.chop.drawn` and the wood pile in `drawWorld` do - per figure, falling back when the sheet has not loaded - and keep a `stand-in:` comment naming the request and *Claude-drawn stand-ins*.
6. **Record it.** Add your names to your area's row of *Claude-drawn stand-ins* in ART_REQUESTS.md (one row an area: nobody else edits it), and rerun `node scripts/claude-art/write-plan.mjs` so this plan and Astra's list mark the item. `npm test` (`tests/claude-standins.test.mjs`) fails on a frame without provenance, `madeBy`, a row, or a list item.
7. **After a merge** of two builders' branches, take either side of a conflict in `public/assets/claude-standins/atlas.json`, `docs/claude-art-provenance.json`, `docs/CLAUDE_ART_PLAN.md` or the generated section of ART_REQUESTS.md, then `npm run build:standins -- --merge` and `node scripts/claude-art/write-plan.mjs`: they are pure functions of the per-module files.

**Sizes at a glance.** A person is drawn so that the logical height (300 source px in Claude's people frames) is the height the game asks for; the ground is 0.945 of it; `personFrame` makes a 400×400 cell with the ground at y 372 and room for a raised tool. Soldiers use their own longer build (`BUILD.soldier`), as her military atlases do; the baby its own small drawing (`INFANT_POSES`). A mounted frame is 1.8 of a person (`mountedFrame`, logical 540). A prop or building carries its own `logicalHeight` for the height the page draws it at (the wood pile: 1.2 of a person). Icons are 128×128 and marks 96×96, drawn in pixels.

**Honest limits.** The rig reads as the same person as Astra's figure at play size by silhouette, palette and costume; its proportions (a head about a fifth of the height, a woman's skirt from high on the waist, children a third head) and its swings (a bend at the waist and knees, the tool raised behind the head and landing low) were fitted to her frames on a grid on 2026-09-28. At 150 px it is plainly a different, simpler hand: limbs of even width with no fold or muscle, one flat shade, stiffer joints than her poses, small plain faces, and a horse whose legs are straight tapered sticks. Famous people are original interpretations, never likenesses; nothing gory; Texas 1835 tools only.

## A — People at work and ambient poses

Scope: the eight grown cast figures' action poses at home and in town, ambient life, the Gonzales town scenes, layered people; the wood pile. 18 to make, 0 skipped.

- [ ] **A1** (priority 1) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 1 — **Claude stand-in in place** (`rust-chop`, `teal-chop`, `elder-chop`, `blue-chop`, `rust-woman-chop`, `indigo-chop`, `ochre-chop`, `blue-girl-chop`); Astra's replaces it
  - **Deliver:** `<cast>-chop` (felling with an axe) for each of the eight: `<figure>-chop-1`..`-4`, clip `<figure>-chop`, the axe landing on frame 3
  - **Frames:** 4 frames each, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.chop` (`drawn`) in `public/work-art.js`, drawn by `drawAtWork` in `public/app.js`
  - **Stands in now:** the hoeing cycle (`-work`) with a felling axe drawn over the hoe in canvas, chips on the strike; rust in Claude's `rust-chop` (drawn in code (canvas or CSS))
- [ ] **A2** (priority 1) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 16 — **Claude stand-in in place** (`wood-pile-1`, `wood-pile-2`, `wood-pile-3`, `wood-pile-4`); Astra's replaces it
  - **Deliver:** `wood-pile-1`, `wood-pile-2`, `wood-pile-3`, `wood-pile-4` (about 10, 20, 30, 40 logs)
  - **Frames:** one sprite a size. **Size:** A pile of wall logs three-quarter on the ground anchor, about as long as `log-fallen`, no taller than a person's waist; Claude: 448×320 cell drawn at 1.2 of a person
  - **Plugs into:** the wood pile in `drawWorld`, `public/app.js` (`window.__woodPileSprite`)
  - **Stands in now:** Claude's `wood-pile-1`..`-4`; without the sheet, `log-fallen` laid side by side (Claude-drawn)
- [ ] **A3** (priority 1) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 3
  - **Deliver:** `<cast>-notch` (4 frames: notching a wall log's end with an axe) and `<cast>-lift` (2 frames: stooped under a log end, the log end at the shoulder; two facing across the frame read as one log lifted)
  - **Frames:** 4 and 2 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.notch` in `public/work-art.js`; `workSlot` stands several along the house front
  - **Stands in now:** the hoeing cycle with a drawn axe (drawn in code (canvas or CSS))
- [ ] **A4** (priority 1) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 4
  - **Deliver:** `<cast>-dig` (spade driven in with the foot, levered, earth thrown behind, back) and `<cast>-dig-well` (the same waist-deep in a square hole with a low bank of earth)
  - **Frames:** 4 frames each, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.dig`, `STROKES.grub` in `public/work-art.js`
  - **Stands in now:** the hoeing cycle with dark clods thrown up (drawn in code (canvas or CSS))
- [ ] **A5** (priority 1) — [Request 2026-09-28 — ambient life](ART_REQUESTS.md#request-2026-09-28--ambient-life), item 1
  - **Deliver:** for each of the eight: `-whittle`, `-mend-harness`, `-sew`, `-shell-corn`, `-clean-rifle` (seated, 2 frames each), `-wash` (kneeling at a tub, 2), `-pipe`, `-cards` (seated, 2), `-sweep` (a broom, 4), `-carry-water` (a bucket in each hand, walking, 4, east)
  - **Frames:** 2-4 frames each, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `ambientClip` in `public/motion.js`; `ACTIVITIES` in `sim/ambient.mjs`
  - **Stands in now:** the nearest delivered pose: seated `-repair`, kneeling `-care`, seated `-rest`, the hoe's `-work`, the harvest `-carry` (Astra's library art reused)
- [ ] **A6** (priority 2) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 2
  - **Deliver:** `<cast>-split` (maul raised, coming down, on the wedge in a log on the ground, back)
  - **Frames:** 4 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.split` in `public/work-art.js`
  - **Stands in now:** the hoeing cycle with a drawn maul (drawn in code (canvas or CSS))
- [ ] **A7** (priority 2) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 5
  - **Deliver:** `<cast>-reap` (reaching up to an ear, snapping it, dropping it in a basket or sack, stepping on)
  - **Frames:** 4 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.reap` in `public/work-art.js`
  - **Stands in now:** the hoeing cycle with chaff (drawn in code (canvas or CSS))
- [ ] **A8** (priority 2) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 7
  - **Deliver:** `<cast>-aim` (1 frame, a long rifle level at the shoulder) and `<cast>-fire` (2 frames: recoil, lowering), in the figure's own clothes
  - **Frames:** 1 + 2 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.shoot`, `STROKES.shot` in `public/work-art.js`
  - **Stands in now:** the side-on idle with a rifle line and a flash drawn in canvas (drawn in code (canvas or CSS))
- [ ] **A9** (priority 2) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 8
  - **Deliver:** `<cast>-fish` (sitting on the bank, cane pole out, the pole twitched)
  - **Frames:** 2 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.fish`, `drawWorkLayer` in `public/work-art.js`
  - **Stands in now:** the seated rest with a cane pole, line and bobbing float in canvas (drawn in code (canvas or CSS))
- [ ] **A10** (priority 2) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 9
  - **Deliver:** `<cast>-gather` (bent to the ground picking up, then into a basket or apron)
  - **Frames:** 2 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.gather` in `public/work-art.js`
  - **Stands in now:** the sowing crouch bobbing at the ground (drawn in code (canvas or CSS))
- [ ] **A11** (priority 2) — [Request 2026-09-28 — ambient life](ART_REQUESTS.md#request-2026-09-28--ambient-life), item 2
  - **Deliver:** `washtub` (a wooden tub with a board), `woodpile-frontier` (split rails stacked by a cabin), `hens-pecking` (two hens, 2 frames)
  - **Frames:** 1, 1 and 2 frames. **Size:** Prop: transparent, anchored at its base, at the scale of the sprites it stands beside
  - **Plugs into:** `propItem` in `public/ambient.js`
  - **Stands in now:** the plain `bucket`, the Alamo's `alamo-firewood`, `chicken-idle` (Astra's library art reused)
- [ ] **A12** (priority 2) — [Request 2026-09-25 — Gonzales before the fight](ART_REQUESTS.md#request-2026-09-25--gonzales-before-the-fight), items 1-4
  - **Deliver:** a seated flag painter for `teal`, `indigo`, `blue-girl` (`<figure>-paint-seated`, 2 frames); `elder`, `ochre`, `blue` `-dig` with a spade (4 frames, shared with A4); `-forge` (a smith at the anvil, 2-4 frames) with `forge-anvil` as a prop; `-point` (arm out across the river, the other shading the eyes, 2 frames, east and south)
  - **Frames:** 2-4 frames, east (and south for pointing). **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STAND_INS` in `sim/town-scenes.mjs`; `drawProp` in `public/town-scenes.js`
  - **Stands in now:** the delivered `repair`, `work`, `search` and `speak` poses (Astra's library art reused)
  - **Research first:** the Gonzales scenes of September 29 - October 2, 1835 (docs/battle-research/gonzales-town.md, HIST-TEX-460-469)
- [ ] **A13** (priority 3) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 6
  - **Deliver:** `<cast>-carpentry` (at a shaving horse drawing a drawknife, 2 frames, then boring with an auger, 2)
  - **Frames:** 4 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.whittle` in `public/work-art.js`
  - **Stands in now:** the seated mending cycle with shavings (drawn in code (canvas or CSS))
- [ ] **A14** (priority 3) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 10
  - **Deliver:** `<cast>-butcher` (at a plank table cutting a joint wrapped in cloth, or salting it down in a barrel; no carcass, no blood)
  - **Frames:** 2 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.butcher` in `public/work-art.js`
  - **Stands in now:** the kneeling nursing pose, bobbing (drawn in code (canvas or CSS))
- [ ] **A15** (priority 3) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 11
  - **Deliver:** `<cast>-drill` (stepping out with a rifle at the shoulder, 4 frames) and `<cast>-guard` (sentry, rifle sloped, turning the head, 2)
  - **Frames:** 4 and 2 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.drill`, `STROKES.guard` in `public/work-art.js`
  - **Stands in now:** the walk stepped on the spot; the searching pose with a rifle sloped (drawn in code (canvas or CSS))
- [ ] **A16** (priority 3) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 12
  - **Deliver:** `<cast>-stake` (a mallet raised over a stake and driving it)
  - **Frames:** 2 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.pace` in `public/work-art.js`
  - **Stands in now:** the walk cycle paced to and fro (drawn in code (canvas or CSS))
- [ ] **A17** (priority 3) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 14
  - **Deliver:** `<cast>-tend-fire` (kneeling, feeding a stick into a small fire, blowing on it; the fire in the frame)
  - **Frames:** 2 frames, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.fire` in `public/work-art.js`
  - **Stands in now:** the kneeling nursing pose with a small flame and puffs in canvas (drawn in code (canvas or CSS))
- [ ] **A18** (priority 3) — [Request 2026-09-12 (second) — settling in: houses, interiors, furnishings, and people whose looks can be chosen](ART_REQUESTS.md#request-2026-09-12-second--settling-in-houses-interiors-furnishings-and-people-whose-looks-can-be-chosen), layered people
  - **Deliver:** aligned layer PNGs `<sheet>--line`, `--skin`, `--hair`, `--clothes` and the head items (`--hat`, `--beard`, `--moustache`, `--straw-hat`, `--bonnet`, `--pinned`, `--braid`, `--loose`, `--headscarf`) for every people sheet, one figure per sex and age band
  - **Frames:** every frame of every people sheet. **Size:** Registered pixel for pixel with the sheet they layer; greyscale value masks; see the request
  - **Plugs into:** `public/avatar-art.js`, `public/person-palette.js`, `public/appearance.js`
  - **Stands in now:** the painted cast recoloured by a pixel classifier (`public/person-palette.js`), some head styles the nearest cast silhouette (Astra's library art reused)

## B — Children, babies and sickness

Scope: girl, boy, smallchild and infant poses, holding and carrying a baby, the sick lying down, and their icons and marks. 11 to make, 2 skipped.

- [ ] **B1** (priority 1) — [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](ART_REQUESTS.md#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 1 — **Claude stand-in in place** (`girl-play-run`, `girl-play-run-s`, `girl-play-run-n`, `girl-play-gallop`, `girl-play-hide`, `girl-play-kneel`, `girl-play-sit-doll`, `girl-play-hoop`, `girl-scatter`, `boy-play-run`, `boy-play-run-s`, `boy-play-run-n`, `boy-play-gallop`, `boy-play-hide`, `boy-play-kneel`, `boy-play-sit-doll`, `boy-play-hoop`, `boy-scatter`, `smallchild-play-run`, `smallchild-play-run-s`, `smallchild-play-run-n`, `smallchild-play-gallop`, `smallchild-play-hide`, `smallchild-play-kneel`, `smallchild-play-sit-doll`, `smallchild-play-hoop`, `smallchild-scatter`); Astra's replaces it
  - **Deliver:** for `girl`, `boy`, `smallchild`: `-play-gallop` (stick horse, 4, east), `-play-run` (4, east, and `-n`/`-s`), `-play-hide` (1), `-play-kneel` (2), `-play-sit-doll` (1), `-play-hoop` (4, the hoop in the frame), `-scatter` (throwing corn, 2)
  - **Frames:** 1-4 frames each. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372; drawn to fill the cell as an adult does, a child's proportions (the renderer shrinks them by age)
  - **Plugs into:** `littleClip` and `CHILD_POSES` in `public/motion.js`; `STROKES.scatter`
  - **Stands in now:** the child's walk, sitting rest, side-on rest and back-turned idle; the grown sowing cycle at a child's size for the hens (Astra's library art reused)
- [ ] **B2** (priority 1) — [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](ART_REQUESTS.md#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 2 — **Claude stand-in in place** (`infant-crawl`, `infant-crawl-w`, `infant-cry`, `infant-sleep`); Astra's replaces it
  - **Deliver:** `infant-crawl` (4, east, and `-w`), `infant-cry` (sitting up, mouth open, 2), `infant-sleep` (curled on a blanket, 1)
  - **Frames:** 1-4 frames. **Size:** The infant's logical height (`infant-idle-*`), ground anchor
  - **Plugs into:** `littleClip` in `public/motion.js`
  - **Stands in now:** the infant's standing pose moved over the ground; the front idle with a "(crying)" bubble; `infant-rest` (Astra's library art reused)
- [ ] **B3** (priority 1) — [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](ART_REQUESTS.md#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 3 — **Claude stand-in in place** (`rust-woman-hold-baby`, `rust-woman-carry-baby-walk`, `rust-woman-carry-baby-walk-s`, `rust-woman-carry-baby-walk-n`, `teal-hold-baby`, `teal-carry-baby-walk`, `teal-carry-baby-walk-s`, `teal-carry-baby-walk-n`, `indigo-hold-baby`, `indigo-carry-baby-walk`, `indigo-carry-baby-walk-s`, `indigo-carry-baby-walk-n`, `blue-girl-hold-baby`, `blue-girl-carry-baby-walk`, `blue-girl-carry-baby-walk-s`, `blue-girl-carry-baby-walk-n`, `rust-hold-baby`, `rust-carry-baby-walk`, `rust-carry-baby-walk-s`, `rust-carry-baby-walk-n`, `elder-hold-baby`, `elder-carry-baby-walk`, `elder-carry-baby-walk-s`, `elder-carry-baby-walk-n`, `blue-hold-baby`, `blue-carry-baby-walk`, `blue-carry-baby-walk-s`, `blue-carry-baby-walk-n`, `ochre-hold-baby`, `ochre-carry-baby-walk`, `ochre-carry-baby-walk-s`, `ochre-carry-baby-walk-n`); Astra's replaces it
  - **Deliver:** for each cast woman (`rust-woman`, `teal`, `indigo`, `blue-girl`) and, less often, each man: `-hold-baby` (a baby to the shoulder, swaying, 2, south) and `-carry-baby-walk` (a baby on the hip, walking, 4, east, and `-n`/`-s`); also covers the riders request's walker carrying an infant (item 3)
  - **Frames:** 2 and 4 frames. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `littleClip` (`aside.kind === 'baby'`) in `public/motion.js`; `carriedAt` in `drawWorld`, `public/app.js`
  - **Stands in now:** the harvest carry with the infant drawn at her side; a carried baby drawn at the carrier's hip (Astra's library art reused)
- [ ] **B4** (priority 1) — [Request 2026-09-27 — sickness: the sick badge, the sickness icons, and the sick lying down](ART_REQUESTS.md#request-2026-09-27--sickness-the-sick-badge-the-sickness-icons-and-the-sick-lying-down), item 1 — **Claude stand-in in place** (`mark-sick`); Astra's replaces it
  - **Deliver:** `mark-sick` (a folded blanket and a cup, or a cool cloth, in the panel's mark style)
  - **Frames:** 1. **Size:** Mark: 96×96, transparent, no text, reads at 22–24 CSS px
  - **Plugs into:** `.panel-sick-mark` in `panelRow`, `public/app.js`
  - **Stands in now:** the road's nursing icon `icon-tend-sick` in a cream disc (Astra's library art reused)
- [ ] **B5** (priority 1) — [Request 2026-09-27 — sickness: the sick badge, the sickness icons, and the sick lying down](ART_REQUESTS.md#request-2026-09-27--sickness-the-sick-badge-the-sickness-icons-and-the-sick-lying-down), item 2 — **Claude stand-in in place** (`icon-rest-road`, `icon-camp-apart`, `icon-nurse-home`); Astra's replaces it
  - **Deliver:** `icon-rest-road` (the wagon stopped, somebody lying under a blanket), `icon-camp-apart` (a camp up a bank away from a crowd of tents), `icon-nurse-home` (somebody by a bed in a cabin with a cup)
  - **Frames:** 1 each. **Size:** Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40% (the request says 64 px; deliver at 128 as the other icons)
  - **Plugs into:** `PANEL_ICONS` in `public/family-panel.js`
  - **Stands in now:** `icon-rest`, `icon-tend-sick` and a stroked glyph (Astra's library art reused)
- [ ] **B6** (priority 2) — [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](ART_REQUESTS.md#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 4 — **Claude stand-in in place** (`girl-speak`, `girl-tug`, `boy-speak`, `boy-tug`, `smallchild-speak`, `smallchild-tug`); Astra's replaces it
  - **Deliver:** `girl-speak`, `boy-speak`, `smallchild-speak` (2, east) and `-tug` (tugging at a grown person's sleeve, 2, east)
  - **Frames:** 2 frames each, east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `littleClip` (`talk.phase === 'talking'`) in `public/motion.js`
  - **Stands in now:** the standing idle; the parent in the cast listening pose (Astra's library art reused)
- [ ] **B7** (priority 2) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 13 — **Claude stand-in in place** (`girl-shoo`, `girl-gather`, `girl-carry-water`, `girl-carry-water-s`, `girl-carry-water-n`, `boy-shoo`, `boy-gather`, `boy-carry-water`, `boy-carry-water-s`, `boy-carry-water-n`, `smallchild-shoo`, `smallchild-gather`, `smallchild-carry-water`, `smallchild-carry-water-s`, `smallchild-carry-water-n`); Astra's replaces it
  - **Deliver:** for `girl`, `boy`, `smallchild`: `-shoo` (arms flung up waving a cloth, 2), `-gather` (2), `-carry-water` (a small pail in each hand, walking, 4, east, and `-n`/`-s`)
  - **Frames:** 2-4 frames. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `STROKES.shoo`, `STROKES.carry` with the child scaling of `entityClip`
  - **Stands in now:** the walk paced to and fro; the grown carry at the child's size (Astra's library art reused)
- [ ] **B8** (priority 2) — [Request 2026-09-27 — sickness: the sick badge, the sickness icons, and the sick lying down](ART_REQUESTS.md#request-2026-09-27--sickness-the-sick-badge-the-sickness-icons-and-the-sick-lying-down), item 3 — **Claude stand-in in place** (`rust-sick-rest`, `rust-sick-rest-s`, `rust-sick-rest-e`, `teal-sick-rest`, `teal-sick-rest-s`, `teal-sick-rest-e`, `elder-sick-rest`, `elder-sick-rest-s`, `elder-sick-rest-e`, `blue-sick-rest`, `blue-sick-rest-s`, `blue-sick-rest-e`, `rust-woman-sick-rest`, `rust-woman-sick-rest-s`, `rust-woman-sick-rest-e`, `indigo-sick-rest`, `indigo-sick-rest-s`, `indigo-sick-rest-e`, `ochre-sick-rest`, `ochre-sick-rest-s`, `ochre-sick-rest-e`, `blue-girl-sick-rest`, `blue-girl-sick-rest-s`, `blue-girl-sick-rest-e`, `girl-sick-rest`, `girl-sick-rest-s`, `girl-sick-rest-e`, `boy-sick-rest`, `boy-sick-rest-s`, `boy-sick-rest-e`, `smallchild-sick-rest`, `smallchild-sick-rest-s`, `smallchild-sick-rest-e`, `infant-sick`); Astra's replaces it
  - **Deliver:** for each cast figure and the children: `-sick-rest` (lying under a blanket, head on a bundle, 1 frame, `-s` and `-e`), and `infant-sick` (wrapped and lying)
  - **Frames:** 1 frame, south and east. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `restingSick` and `grownClip` in `public/motion.js`
  - **Stands in now:** the delivered `-injured-rest` pose, as the hurt are; a sick baby as it is (Astra's library art reused)
- [ ] **B9** (priority 2) — [Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work](ART_REQUESTS.md#request-2026-09-26--children-at-play-babies-and-the-runaway-scrapes-own-work), item 5 — **Claude stand-in in place** (`icon-child-stick-horse`, `icon-child-doll`, `icon-child-tag`, `icon-child-hide`, `icon-child-cart`, `icon-child-hoop`, `icon-child-marbles`, `icon-child-hens`, `icon-flee-hide`, `icon-flee-bundle`, `icon-road-lookout`, `icon-road-sing`, `icon-road-little-ones`, `icon-camp-fire`, `icon-ferry-help`, `icon-share-food`, `icon-ford-carry`); Astra's replaces it
  - **Deliver:** `icon-child-stick-horse`, `icon-child-doll`, `icon-child-tag`, `icon-child-hide`, `icon-child-cart`, `icon-child-hoop`, `icon-child-marbles`, `icon-child-hens`; the Scrape's `icon-flee-hide`, `icon-flee-bundle`, `icon-road-lookout`, `icon-road-sing`, `icon-road-little-ones`, `icon-camp-fire`, `icon-ferry-help`, `icon-share-food`, `icon-ford-carry` (a child reads as a child; nothing holds an edge or a gun)
  - **Frames:** 17 icons. **Size:** Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%
  - **Plugs into:** `PANEL_ICONS` and `LITTLE_GLYPHS` in `public/family-panel.js`
  - **Stands in now:** stroked glyphs drawn in code (drawn in code (canvas or CSS))
- [ ] **B10** (priority 2) — [Request 2026-09-28 — the oldest child going for help](ART_REQUESTS.md#request-2026-09-28--the-oldest-child-going-for-help), item 1 — **Claude stand-in in place** (`icon-child-help`); Astra's replaces it
  - **Deliver:** `icon-child-help` (a child running along a track toward a neighbour's cabin, an arm out)
  - **Frames:** 1. **Size:** Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40% (the request says 48 px; deliver at 128 as the others)
  - **Plugs into:** `PANEL_ICONS['child-help']` in `public/family-panel.js`
  - **Stands in now:** a stroked glyph: a running figure and a house (drawn in code (canvas or CSS))
- [ ] **B11** (priority 2) — [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](ART_REQUESTS.md#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 1 (icon) — **Claude stand-in in place** (`icon-flee-cow`); Astra's replaces it
  - **Deliver:** `icon-flee-cow` (a child leading the family's milk cow on a rope)
  - **Frames:** 1. **Size:** Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%
  - **Plugs into:** `PANEL_ICONS` in `public/family-panel.js`
  - **Stands in now:** a stroked glyph (drawn in code (canvas or CSS))

Skipped:
- ~~B12~~ [Request 2026-09-12 — families that look like who they are, and a rider who gets down](ART_REQUESTS.md#request-2026-09-12--families-that-look-like-who-they-are-and-a-rider-who-gets-down) — skipped: covered by B1, B6, B7 and B8; the scaling rule stays
- ~~BS1~~ [Request 2026-09-21 — the children's icons](ART_REQUESTS.md#request-2026-09-21--the-childrens-icons) — skipped: delivered 2026-09-22 (`icons-children.png`)

## C — Soldiers, battles and famous people

Scope: the family's people and the armies fighting, at rest and carrying the wounded; battle works and props; the famous people and the Esparza family. 19 to make, 1 skipped.

- [ ] **C1** (priority 1) — [Request 2026-09-25 — battles: the pieces the engine stands in for](ART_REQUESTS.md#request-2026-09-25--battles-the-pieces-the-engine-stands-in-for), item 1
  - **Deliver:** every cast figure (`rust`, `teal`, `elder`, `blue`, `rust-woman`, `indigo`, `ochre`, `blue-girl`) in `<cast>-aim`, `<cast>-fire`, `<cast>-load` (kneeling), `<cast>-ramrod`, clip `<cast>-fire-reload`; and each cast's `-injured` and `-reclining`
  - **Frames:** 4 frames each, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** `memberPose` and `poseOf` in `public/battle-view.js`
  - **Stands in now:** the volunteer militia's firing cycle and fallen poses, not the person's own figure (Astra's library art reused)
- [ ] **C2** (priority 2) — [Request 2026-09-25 — battles: the pieces the engine stands in for](ART_REQUESTS.md#request-2026-09-25--battles-the-pieces-the-engine-stands-in-for), item 3
  - **Deliver:** `bearers-carry-1`..`-4` (two men carrying a third on a blanket, walking east); no blood
  - **Frames:** 4 frames, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** `drawFallen` in `public/battle-view.js`
  - **Stands in now:** the seated wounded helped back by two walking figures; `*-reclining` with two beside (Astra's library art reused)
- [ ] **C3** (priority 2) — [Request 2026-09-28 — ambient life](ART_REQUESTS.md#request-2026-09-28--ambient-life), item 3
  - **Deliver:** `volunteer-clean-rifle`, `volunteer-camp-sit`, `volunteer-camp-cook` and the same for `regular-` (2 frames each)
  - **Frames:** 2 frames each, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** `CAMP_TEXIAN`, `CAMP_MEXICAN` in `sim/ambient.mjs`; `figureClip` in `public/ambient.js`
  - **Stands in now:** the ramrod's stroke; the cast's civilian men at the fire (Astra's library art reused)
- [ ] **C4** (priority 2) — [Request 2026-09-25 — San Jacinto](ART_REQUESTS.md#request-2026-09-25--san-jacinto), item 2
  - **Deliver:** `regular-rest-sit`, `regular-sleep` (never to be mistaken for `regular-reclining`), `volunteer-rest-sit`, `musket-stack`; `breastwork-packs` in three or four segments about five feet high
  - **Frames:** 1-2 frames. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure; the breastwork as a prop
  - **Plugs into:** the `camp` branch of `draw` and `drawWorks` in `public/battle-view.js`
  - **Stands in now:** the standing idle and seated wounded; `crate`, `sacks`, `barrel`, `packed-belongings` in a line (Astra's library art reused)
  - **Research first:** HIST-TEX-522 (Houston: "packs and baggage, leaving an opening in the centre")
- [ ] **C5** (priority 2) — [Request 2026-09-25 — the storming of Béxar](ART_REQUESTS.md#request-2026-09-25--the-storming-of-béxar), items 1, 3, 4
  - **Deliver:** `volunteer-loophole-fire` and `regular-loophole-fire` (the barrel at the wall, the man half hidden, 2-4 frames); `volunteer-crowbar` (4 frames, forcing a door); `volunteer-dig` (a spade in a trench at night); `barricade-street` (ditch, bank, post palisade, gun embrasure); `sandbag-breastwork`
  - **Frames:** 2-4 frames; props 1. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure; props at `palisade` scale
  - **Plugs into:** `draw` (`cover`), `drawBreaches` in `public/battle-view.js`
  - **Stands in now:** flashes at the town's houses; the ramming stroke; `rust-work`/`teal-work`; `palisade` and `sacks` (Astra's library art reused)
  - **Research first:** Béxar, December 1835 (docs/battle-research/staging.md §3.9, HIST-TEX-490-496)
- [ ] **C6** (priority 2) — [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](ART_REQUESTS.md#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 3
  - **Deliver:** volunteers firing over a parapet, the body from the waist up over a wall top, east, west, north and south, with a loading frame below the parapet (`volunteer-parapet-fire-*`)
  - **Frames:** 2-4 frames a facing. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** `layoutSide` and `draw` in `public/battle-view.js`
  - **Stands in now:** the volunteer firing cycle at the wall's line (Astra's library art reused)
- [ ] **C7** (priority 2) — [Request 2026-09-25 — Coleto and Goliad](ART_REQUESTS.md#request-2026-09-25--coleto-and-goliad), item 1
  - **Deliver:** `regular-prone-lie`, `regular-prone-aim`, `regular-prone-fire` (a cazador in the tall grass at night)
  - **Frames:** 3 frames, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** the `ringed` grass parts of `sim/battles/coleto.mjs`, `draw` in `public/battle-view.js`
  - **Stands in now:** the loose order's standing and kneeling poses (Astra's library art reused)
- [ ] **C8** (priority 2) — [Request 2026-09-27 — Mexican troops after a family on the road](ART_REQUESTS.md#request-2026-09-27--mexican-troops-after-a-family-on-the-road), item 3
  - **Deliver:** `skirmisher-run-e` (4) and `skirmisher-kneel-fire` (aim, fire, load; 4), the line's regular
  - **Frames:** 4 frames each, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** `createChaseView` in `public/chase-view.js`
  - **Stands in now:** `regular-march`, `regular-fire-reload` (Astra's library art reused)
- [ ] **C9** (priority 2) — [Request 2026-09-26 — the Mexican advance](ART_REQUESTS.md#request-2026-09-26--the-mexican-advance), item 3
  - **Deliver:** `regular-march-column` (six to eight infantry in files of three, a mounted officer at the head, a cart behind; 4 frames, east)
  - **Frames:** 4 frames, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** `drawArmy` (`moving`) in `public/army-view.js`
  - **Stands in now:** `regular-march` men in files of three with a `dragoon-march` at the head (Astra's library art reused)
- [ ] **C10** (priority 2) — [Request 2026-09-25 — Concepción and the Grass Fight](ART_REQUESTS.md#request-2026-09-25--concepción-and-the-grass-fight), item 2
  - **Deliver:** `volunteer-bank-climb-1`..`-6` (step up the cut, aim and fire over the lip, step down, load under the bank)
  - **Frames:** 6 frames, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** the `bank` branch of `draw` in `public/battle-view.js`
  - **Stands in now:** `volunteer-load` a third of a figure lower than the men firing (Astra's library art reused)
- [ ] **C11** (priority 2) — [Request 2026-09-25 — San Jacinto](ART_REQUESTS.md#request-2026-09-25--san-jacinto), item 4
  - **Deliver:** `figure-wading` (a man up to the thighs in water, running, in either side's clothes); no blood, nobody shot close
  - **Frames:** 2-4 frames, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** `drawWorks` in `public/battle-view.js`
  - **Stands in now:** nobody drawn wading (nothing)
- [ ] **C12** (priority 2) — [Request 2026-09-25 — battles: the pieces the engine stands in for](ART_REQUESTS.md#request-2026-09-25--battles-the-pieces-the-engine-stands-in-for), item 4
  - **Deliver:** three settlers serving the Gonzales cart-wheel gun: `settler-gun-ram`, `settler-gun-carry`, `settler-gun-fire`
  - **Frames:** 2-4 frames each, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** `drawCannon` in `public/battle-view.js`
  - **Stands in now:** the carriage-gun crew cycles (`volunteer-gun-ram`, `-shot-carry`, `-fire`) (Astra's library art reused)
- [ ] **C13** (priority 2) — [Request 2026-09-26 — the famous people: the roster's remaining figures and poses](ART_REQUESTS.md#request-2026-09-26--the-famous-people-the-rosters-remaining-figures-and-poses), items 1 and 3
  - **Deliver:** a 4×4 sheet each for Austin, J. W. Smith, Kimbell, Martin, Johnson, Neill, Hockley, McCulloch, Sherman, Rusk, Lamar, Horton, W. P. Smith, Smither, Deaf Smith, Grant (Texian officers) and Urrea, Condelle, Sánchez Navarro, Barragán (Mexican officers): walk, idle, command, fire, and a still (lying) pose; named `<person>-*` as `PERSON_ART` keys
  - **Frames:** 16 each (4 east, 2 south, 2 north walking, 8 poses). **Size:** The delivered famous sheets' contract (`scripts/art-deliveries/famous-people.mjs`): the `volunteer-*` logical height
  - **Plugs into:** `PERSON_ART` and `drawPerson` in `public/battle-view.js`, `drawFamous` in `public/famous-view.js`
  - **Stands in now:** the volunteer or regular, riding as the courier or the dragoon, named under the figure (Astra's library art reused)
  - **Research first:** each person's dress, age and rank in 1835-36 (docs/battle-research/famous-people.md); **original interpretations, never a likeness** - no face is claimed, and a Claude stand-in says so in its prompt
- [ ] **C14** (priority 2) — [Request 2026-09-26 — the Esparza family](ART_REQUESTS.md#request-2026-09-26--the-esparza-family), items 1-6
  - **Deliver:** `ana-esparza-*` (walk, idle, `shelter-with-children`, `carry-toddler`, `hold-blanket`), `maria-de-jesus-*` (walk, idle, seated huddled), `enrique-esparza-*` (walk, idle, seated huddled, `look`), `burial-party-walk-e` (4; two men carrying a body wholly wrapped on a litter, never a body shown), `francisco-esparza-*` (walk, idle, `kneel-at-grave`), `esparza-seated`
  - **Frames:** the famous-sheet contract. **Size:** Famous sheets: `volunteer-*` height for grown people, the children's for the children
  - **Plugs into:** `PERSON_ART` in `public/battle-view.js`; `drawBearers`; `drawFamous`
  - **Stands in now:** the second cast's woman, the library's girl, boy and small child; two `rust` figures with a canvas bundle (Astra's library art reused)
  - **Research first:** Tejano dress in Béxar, 1836 (HIST-TEX-605-609); original interpretations, no likeness claimed
- [ ] **C15** (priority 3) — [Request 2026-09-26 — the famous people: the roster's remaining figures and poses](ART_REQUESTS.md#request-2026-09-26--the-famous-people-the-rosters-remaining-figures-and-poses), Castrillón and the rest
  - **Deliver:** Castrillón's north and south walks and a scale-matched ammunition crate under his command pose; Travis in the officer's firing cycle at the north battery (request 2026-09-25 the Alamo, item 8); the remaining Tejano cast
  - **Frames:** as the famous sheets. **Size:** Famous sheets
  - **Plugs into:** `PERSON_ART`
  - **Stands in now:** Castrillón's east walk mirrored; the crate prop at another scale (Astra's library art reused)
  - **Research first:** original interpretations
- [ ] **C16** (priority 3) — [Request 2026-09-25 — Concepción and the Grass Fight](ART_REQUESTS.md#request-2026-09-25--concepción-and-the-grass-fight), items 6 and 8
  - **Deliver:** `grass-bundle-cut` (a pack slit open, grass spilling); a padre with carts for the dead and wounded after Concepción (told in the caption today)
  - **Frames:** 1; 2-4. **Size:** Prop: transparent, anchored at its base, at the scale of the sprites it stands beside
  - **Plugs into:** `draw` in `public/battle-view.js`
  - **Stands in now:** nothing (words) (told in words, not drawn)
  - **Research first:** the padre and carts are in the record only in outline (Smithwick); keep them general
- [ ] **C17** (priority 3) — [Request 2026-09-25 — Gonzales before the fight](ART_REQUESTS.md#request-2026-09-25--gonzales-before-the-fight), item 5
  - **Deliver:** the Come and Take It flag without the star (the star is disputed), and flat on the table half-painted and finished, as more states of `gonzales-flag-work-*`
  - **Frames:** still and a four-frame wave for the flag; one each on the table. **Size:** Prop: transparent, anchored at its base, at the scale of the sprites it stands beside
  - **Plugs into:** `drawFlag`, `drawProp` in `public/town-scenes.js`
  - **Stands in now:** canvas for the unfinished cloth (drawn in code (canvas or CSS))
  - **Research first:** Smithwick's description; the star is disputed (FIC-GONZ-419)
- [ ] **C18** (priority 3) — [Claude-drawn stand-ins (replace with Astra's)](ART_REQUESTS.md#claude-drawn-stand-ins-replace-with-astras), the armies on the map
  - **Deliver:** a camp: three or four wedge tents, a cook fire with a pot, stacked arms and a colour on a pole, `army-camp`, 192×192
  - **Frames:** 1. **Size:** 192×192, in the map art's own light
  - **Plugs into:** `drawArmy` in `public/army-view.js`
  - **Stands in now:** tents, the fire and the flag drawn in canvas by `public/army-view.js` (drawn in code (canvas or CSS))
- [ ] **C19** (priority 3) — [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](ART_REQUESTS.md#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 2
  - **Deliver:** specific art for the Alamo's north-wall and church guns (the 18-pounder and the siege battery are delivered)
  - **Frames:** rest and recoil, both facings. **Size:** Prop: transparent, anchored at its base, at the scale of the sprites it stands beside (the field guns' scale)
  - **Plugs into:** `drawGun` in `public/battle-view.js`
  - **Stands in now:** the reusable field-gun art and existing crews (Astra's library art reused)
  - **Research first:** which guns stood where (docs/ALAMO_LAYOUT.md); interpretive silhouettes

Skipped:
- ~~CS2~~ [Request 2026-09-27 — Seguín, the ashes, and the later church claim](ART_REQUESTS.md#request-2026-09-27--seguín-the-ashes-and-the-later-church-claim) — skipped: art and storyboard delivered; the trigger is code

## D — Riders, horses, wagons, carreta, ferry, steamboat

Scope: everything on a horse, a mule or in a vehicle: mounted cast and children, drivers, riders in the bed, carts and wheels, the milk cow, cavalry, herds. 15 to make, 4 skipped.

- [ ] **D1** (priority 1) — [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](ART_REQUESTS.md#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 1 — **Claude stand-in in place** (`milk-cow-walk-e`, `milk-cow-walk-n`, `milk-cow-walk-s`, `milk-cow-graze`); Astra's replaces it
  - **Deliver:** `milk-cow-walk-e` (4), `milk-cow-walk-n`, `milk-cow-walk-s`, `milk-cow-graze` (2): a gentle dairy cow of the 1830s with a rope trailing from her horns
  - **Frames:** 4 east, 2 each north and south, 2 grazing. **Size:** Cattle at the logical height of `cattle-longhorn-*`, ground anchor, east mirrored for west
  - **Plugs into:** the cow in `drawWorld`, `public/app.js` (`window.__cowDrawn`)
  - **Stands in now:** the range longhorn's `cattle-longhorn-red-idle` and `-graze` (Astra's library art reused)
- [ ] **D2** (priority 1) — [Request 2026-09-27 — Mexican troops after a family on the road](ART_REQUESTS.md#request-2026-09-27--mexican-troops-after-a-family-on-the-road), items 1-2 — **Claude stand-in in place** (`dragoon-gallop-e`, `dragoon-gallop-n`, `dragoon-gallop-s`, `dragoon-carbine-fire`, `dragoon-fire`); Astra's replaces it
  - **Deliver:** `dragoon-gallop-e` (4), `-n`, `-s` (the escort dragoon riding hard, carbine slung) and `dragoon-carbine-fire` (raise, fire, lower; 3); also `dragoon-fire-1`/`-2` for the battles (request 2026-09-25 battles, item 2)
  - **Frames:** 4 + 2 + 2, and 3. **Size:** Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540 (the `dragoon-e` height)
  - **Plugs into:** `createChaseView` in `public/chase-view.js`; the dragoon branch of `draw` in `public/battle-view.js`
  - **Stands in now:** `dragoon-march` with a flash and a puff at his hands; `dragoon-idle-e` (Astra's library art reused)
- [ ] **D3** (priority 2) — [Request 2026-09-14 — family members on horseback](ART_REQUESTS.md#request-2026-09-14--family-members-on-horseback), children — **Claude stand-in in place** (`girl-ride-e`, `girl-ride-s`, `girl-ride-n`, `boy-ride-e`, `boy-ride-s`, `boy-ride-n`, `smallchild-ride-e`, `smallchild-ride-s`, `smallchild-ride-n`, `girl-ride-wagon-e`, `girl-ride-wagon-s`, `girl-ride-wagon-n`, `boy-ride-wagon-e`, `boy-ride-wagon-s`, `boy-ride-wagon-n`, `smallchild-ride-wagon-e`, `smallchild-ride-wagon-s`, `smallchild-ride-wagon-n`); Astra's replaces it
  - **Deliver:** `girl`, `boy`, `smallchild` and `infant` mounted on the family's chestnut: `<child>-ride-e`, `-s`, `-n` as the eight have
  - **Frames:** 4 frames a heading. **Size:** Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540
  - **Plugs into:** `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`; `drawSeated` in `public/app.js`
  - **Stands in now:** the child's idle cut below the waist over the walking horse (Astra's library art reused)
- [ ] **D4** (priority 2) — [Request 2026-09-16 — driving the ox wagon](ART_REQUESTS.md#request-2026-09-16--driving-the-ox-wagon), second cast and children — **Claude stand-in in place** (`rust-woman-wagon-driver-s`, `rust-woman-wagon-driver-e`, `rust-woman-wagon-driver-w`, `rust-woman-wagon-driver-n`, `indigo-wagon-driver-s`, `indigo-wagon-driver-e`, `indigo-wagon-driver-w`, `indigo-wagon-driver-n`, `ochre-wagon-driver-s`, `ochre-wagon-driver-e`, `ochre-wagon-driver-w`, `ochre-wagon-driver-n`, `blue-girl-wagon-driver-s`, `blue-girl-wagon-driver-e`, `blue-girl-wagon-driver-w`, `blue-girl-wagon-driver-n`, `girl-wagon-driver-s`, `girl-wagon-driver-e`, `girl-wagon-driver-w`, `girl-wagon-driver-n`, `boy-wagon-driver-s`, `boy-wagon-driver-e`, `boy-wagon-driver-w`, `boy-wagon-driver-n`, `smallchild-wagon-driver-s`, `smallchild-wagon-driver-e`, `smallchild-wagon-driver-w`, `smallchild-wagon-driver-n`); Astra's replaces it
  - **Deliver:** seated driver layers `rust-woman-drive-<dir>`, `indigo-drive-<dir>`, `ochre-drive-<dir>`, `blue-girl-drive-<dir>` and the four children, on the four headings as the delivered sixteen
  - **Frames:** 4 headings each. **Size:** As `people-wagon-drivers`: anchored at the rig's seat point
  - **Plugs into:** `wagonDriverId`, `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`
  - **Stands in now:** the figure's idle cut below the waist at the front of the wagon (Astra's library art reused)
- [ ] **D5** (priority 2) — [Request 2026-09-25 — riders, walkers and the cart](ART_REQUESTS.md#request-2026-09-25--riders-walkers-and-the-cart), items 1-2 — **Claude stand-in in place** (`rust-ride-wagon-e`, `rust-ride-wagon-s`, `rust-ride-wagon-n`, `teal-ride-wagon-e`, `teal-ride-wagon-s`, `teal-ride-wagon-n`, `elder-ride-wagon-e`, `elder-ride-wagon-s`, `elder-ride-wagon-n`, `blue-ride-wagon-e`, `blue-ride-wagon-s`, `blue-ride-wagon-n`, `rust-woman-ride-wagon-e`, `rust-woman-ride-wagon-s`, `rust-woman-ride-wagon-n`, `indigo-ride-wagon-e`, `indigo-ride-wagon-s`, `indigo-ride-wagon-n`, `ochre-ride-wagon-e`, `ochre-ride-wagon-s`, `ochre-ride-wagon-n`, `blue-girl-ride-wagon-e`, `blue-girl-ride-wagon-s`, `blue-girl-ride-wagon-n`, `girl-ride-wagon-e`, `girl-ride-wagon-s`, `girl-ride-wagon-n`, `boy-ride-wagon-e`, `boy-ride-wagon-s`, `boy-ride-wagon-n`, `smallchild-ride-wagon-e`, `smallchild-ride-wagon-s`, `smallchild-ride-wagon-n`, `cart-travel-e`, `cart-travel-s`, `cart-travel-n`, `cart-travel-loaded-e`, `cart-travel-loaded-s`, `cart-travel-loaded-n`, `cart-idle-e`, `cart-idle-s`, `cart-idle-n`, `cart-idle-loaded-e`, `cart-idle-loaded-s`, `cart-idle-loaded-n`); Astra's replaces it
  - **Deliver:** `cart-travel-e`, `-n`, `-s` (4 frames, the wheels turning) and `cart-idle` loaded and empty; seated riders for the bed of an open wagon and a cart, both casts and the children, east/north/south, anchored at the hip (`<figure>-ride-wagon-<dir>`), and the wagon's tail with its cover drawn back
  - **Frames:** 4 frames a heading. **Size:** The scale of `wagon-covered` and `ox-walk`
  - **Plugs into:** `miniWagon` in `public/app.js`; `bedLayout` in `public/motion.js`
  - **Stands in now:** the delivered static `cart-open` views; riders as their idle cut at the waist on the cover (Astra's library art reused)
- [ ] **D6** (priority 2) — [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](ART_REQUESTS.md#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 3 — **Claude stand-in in place** (`tejano-rider-ride-e`, `tejano-rider-ride-s`, `tejano-rider-ride-n`); Astra's replaces it
  - **Deliver:** `tejano-rider-ride-e`, `-n`, `-s` (4): a Tejano horseman in a short jacket and wide hat with a lance or escopeta
  - **Frames:** 4 frames a heading. **Size:** Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540
  - **Plugs into:** `bx-tejano-*` in `sim/town-scenes.mjs`
  - **Stands in now:** the cast's riders (Astra's library art reused)
  - **Research first:** Tejano horsemen of Béxar, 1836 (Seguín's company); dress is an interpretation
- [ ] **D7** (priority 2) — [Request 2026-09-25 — San Jacinto](ART_REQUESTS.md#request-2026-09-25--san-jacinto), item 3 — **Claude stand-in in place** (`volunteer-mounted-walk-e`, `volunteer-mounted-walk-s`, `volunteer-mounted-walk-n`, `volunteer-mounted`, `volunteer-mounted-trot`, `volunteer-mounted-idle`, `volunteer-mounted-fire`, `volunteer-ride-e`, `volunteer-ride-s`, `volunteer-ride-n`); Astra's replaces it
  - **Deliver:** `volunteer-mounted` walk (east, north, south, 4) and trot and idle, a rifle, and `volunteer-mounted-fire` (2); the same rider serves `volunteer-ride-e`/`-s`/`-n` for the south's fights and the Gonzales men riding into the Alamo
  - **Frames:** 4 frames a heading, 2 firing. **Size:** Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540
  - **Plugs into:** `figureOf`, the rider branch of `draw` and `memberPose` in `public/battle-view.js`
  - **Stands in now:** the mounted courier (`mounted-courier-e`, `-listen`) (Astra's library art reused)
- [ ] **D8** (priority 2) — [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](ART_REQUESTS.md#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 7 — **Claude stand-in in place** (`lancer-march`, `lancer-idle`, `lancer-charge`); Astra's replaces it
  - **Deliver:** `lancer-march`, `lancer-idle` (lance up, both facings) and `lancer-charge` (at the gallop, lance level; never striking)
  - **Frames:** 4 marching, 1 idle, 4 charging. **Size:** Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540
  - **Plugs into:** `draw` in `public/battle-view.js`
  - **Stands in now:** `dragoon-march-*` with no lance (Astra's library art reused)
- [ ] **D9** (priority 2) — [Request 2026-09-26 — the Mexican advance](ART_REQUESTS.md#request-2026-09-26--the-mexican-advance), item 1 — **Claude stand-in in place** (`forager-ride`, `forager-drive`); Astra's replaces it
  - **Deliver:** `forager-ride-1`..`-4` (two or three horsemen, one leading a pack mule of corn sacks) and `forager-drive-1`..`-4` (two horsemen driving three or four cattle)
  - **Frames:** 4 frames each, east. **Size:** Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540
  - **Plugs into:** the parties in `drawWorld`, `public/app.js`
  - **Stands in now:** three `dragoon-march` riders (Astra's library art reused)
- [ ] **D10** (priority 3) — [Request 2026-09-25 — battles: the pieces the engine stands in for](ART_REQUESTS.md#request-2026-09-25--battles-the-pieces-the-engine-stands-in-for), item 3 — **Claude stand-in in place** (`dragoon-wounded-led`); Astra's replaces it
  - **Deliver:** `dragoon-wounded-led-1`..`-2` (a man slumped in the saddle, another leading the horse)
  - **Frames:** 2 frames, east. **Size:** Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540
  - **Plugs into:** `drawFallen` in `public/battle-view.js`
  - **Stands in now:** a dragoon hit in the saddle drawn dismounted (Astra's library art reused)
- [ ] **D11** (priority 3) — [Request 2026-09-25 — the south's fights: San Patricio by night and Agua Dulce Creek](ART_REQUESTS.md#request-2026-09-25--the-souths-fights-san-patricio-by-night-and-agua-dulce-creek), item 4 — **Claude stand-in in place** (`herd-drove`, `herd-scatter`); Astra's replaces it
  - **Deliver:** `herd-drove` (several hundred horses moving as one mass, 4) and `herd-scatter`
  - **Frames:** 4 and 2-4. **Size:** Prop: transparent, anchored at its base, at the scale of the sprites it stands beside (mustangs' scale)
  - **Plugs into:** `drawHerd` in `public/battle-view.js`
  - **Stands in now:** `mustang-gallop`, `mustang-graze` up to twenty-four times (Astra's library art reused)
- [ ] **D12** (priority 3) — [Request 2026-09-25 — Concepción and the Grass Fight](ART_REQUESTS.md#request-2026-09-25--concepción-and-the-grass-fight), items 6 and 8 — **Claude stand-in in place** (`mule-packed-grass-walk`, `mule-packed-grass-walk-e`, `mule-packed-grass-walk-s`, `mule-packed-grass-walk-n`, `limber-mules-walk`); Astra's replaces it
  - **Deliver:** `mule-packed-grass-walk` (east, north, south, 4) and `limber-mules-walk` (mules at a gun or caisson, men riding them off)
  - **Frames:** 4 frames a heading. **Size:** The scale of `horse-walk`
  - **Plugs into:** the `packhorse` figure in `draw`, `public/battle-view.js`
  - **Stands in now:** `horse-walk`/`horse-graze` with `packed-belongings` on its back (Astra's library art reused)
- [ ] **D13** (priority 3) — [Request 2026-09-26 — the famous people: the roster's remaining figures and poses](ART_REQUESTS.md#request-2026-09-26--the-famous-people-the-rosters-remaining-figures-and-poses), mounted — **Claude stand-in in place** (`seguin-ride-e`, `seguin-ride-s`, `seguin-ride-n`, `sutherland-ride-e`, `sutherland-ride-s`, `sutherland-ride-n`); Astra's replaces it
  - **Deliver:** full mounted movement for Seguín (`seguin-ride-*`); Dr. John Sutherland mounted (`sutherland-ride-*`, request 2026-09-26 the bell at Béxar, item 3)
  - **Frames:** 4 frames a heading. **Size:** Mounted: the courier's cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540
  - **Plugs into:** `PERSON_ART`; `sutherland` in `sim/people.mjs`
  - **Stands in now:** Seguín's two mounted key poses; the roster's `rider` (Astra's library art reused)
  - **Research first:** original interpretations; no likeness
- [ ] **D14** (priority 3) — [Request 2026-09-16 — driving the ox wagon](ART_REQUESTS.md#request-2026-09-16--driving-the-ox-wagon), item 1 — **Claude stand-in in place** (`wagon-ox-e`, `wagon-ox-s`, `wagon-ox-n`, `wagon-ox-loaded-e`, `wagon-ox-loaded-s`, `wagon-ox-loaded-n`, `wagon-ox-empty-e`, `wagon-ox-empty-s`, `wagon-ox-empty-n`); Astra's replaces it
  - **Deliver:** the covered wagon with one ox yoked to its tongue as one rolling rig, `wagon-ox-e`/`-n`/`-s`, 4 frames each, loaded and empty covers
  - **Frames:** 4 frames a heading. **Size:** The scale of `wagon-covered` and `ox-walk`
  - **Plugs into:** `seatLayout('wagon', direction)` in `public/motion.js`
  - **Stands in now:** the ox and the side-view wagon drawn apart; north and south the wagon stays side-on (Astra's library art reused)
- [ ] **D15** (priority 3) — [Request 2026-09-25 — the carreta](ART_REQUESTS.md#request-2026-09-25--the-carreta), loaded — **Claude stand-in in place** (`carreta-loaded-travel-e`, `carreta-loaded-travel-s`, `carreta-loaded-travel-n`); Astra's replaces it
  - **Deliver:** a loaded carreta travel presentation (`carreta-loaded-travel-*`)
  - **Frames:** 4 frames a heading. **Size:** The delivered `carreta-*` scale
  - **Plugs into:** `miniWagon` in `public/app.js`
  - **Stands in now:** the uncovered body cycle, laden or not (Astra's library art reused)

Skipped:
- ~~D16~~ [Request 2026-09-12 — families that look like who they are, and a rider who gets down](ART_REQUESTS.md#request-2026-09-12--families-that-look-like-who-they-are-and-a-rider-who-gets-down) — skipped: delivered 2026-09-14; the remaining work is code, not art
- ~~DS3~~ [Request 2026-09-19 — the ferry flatboat](ART_REQUESTS.md#request-2026-09-19--the-ferry-flatboat) — skipped: delivered 2026-09-21 (`ferry-flatboat.png`)
- ~~DS4~~ [Request 2026-09-18 — the steamboat Yellow Stone](ART_REQUESTS.md#request-2026-09-18--the-steamboat-yellow-stone) — skipped: delivered 2026-09-21
- ~~DS5~~ [Request 2026-09-13 — stock and the grant](ART_REQUESTS.md#request-2026-09-13--stock-and-the-grant) — skipped: delivered 2026-09-14 (`animal-stock`)

## E — Buildings, houses, towns, Béxar, the Alamo, interiors

Scope: house pieces from their other sides, roofs, interiors, civic and researched buildings, places, and Béxar's own people and fandango. 15 to make, 3 skipped.

- [ ] **E1** (priority 1) — [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](ART_REQUESTS.md#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 2
  - **Deliver:** Tejano townspeople of Béxar - a man, a woman in a rebozo, a girl and a boy - each `walk`, `idle-s`, `carry` (loading a cart), `speak`, `listen`, in 1830s Béxar dress (`bexar-man-*`, `bexar-woman-*`, `bexar-girl-*`, `bexar-boy-*`); also the storming's townspeople of 1835 walking out of a house (request 2026-09-25 the storming of Béxar, item 6)
  - **Frames:** the people-sheet poses. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372
  - **Plugs into:** `BEXAR_CAST` in `sim/town-scenes.mjs` (`figure`); `TOWNSFOLK` in `public/battle-view.js`
  - **Stands in now:** the colonists' cast figures (`ochre`, `teal`, `elder`, `indigo`, `blue`, `blue-girl`, `girl`, `boy`); `rust-woman`, `indigo`, `elder`, `smallchild` leaving a house (Astra's library art reused)
  - **Research first:** Béxar dress, 1835-36: rebozo, short jacket, sombrero; original interpretations
- [ ] **E2** (priority 2) — [Request 2026-09-23 — the house from its other sides](ART_REQUESTS.md#request-2026-09-23--the-house-from-its-other-sides)
  - **Deliver:** `house-round-back-sill`, `-back-low-walls`, `-back-full-walls` and the same for `hewn` (the pen from behind, no door in the gable toward the viewer); `house-passage-floor-end`, `house-passage-roof-end`, `house-porch-end`, `house-shed-room-end`
  - **Frames:** 1 each. **Size:** Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable
  - **Plugs into:** `drawHousePlot`, `drawLogPen` in `public/house-plot.js`
  - **Stands in now:** the one front view, mirrored at a quarter turn; a chimney toward the viewer covers the door (Astra's library art reused)
- [ ] **E3** (priority 2) — [Request 2026-09-24 — one roof over a two-pen house](ART_REQUESTS.md#request-2026-09-24--one-roof-over-a-two-pen-house)
  - **Deliver:** `house-roof-join`, `house-roof-join-partial`, `house-roof-join-chimney`, and the ridge line marked on the roof frames
  - **Frames:** 1 each. **Size:** Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable
  - **Plugs into:** `drawHousePlot` (`alongRidge`, `RIDGE`) in `public/house-plot.js`
  - **Stands in now:** the pens' own roof laid over the passage (Astra's library art reused)
- [ ] **E4** (priority 2) — [Request 2026-09-15 — the house plot's pieces](ART_REQUESTS.md#request-2026-09-15--the-house-plots-pieces), remaining pieces
  - **Deliver:** jacal modules (post, wattle, thatch stages: `house-jacal-*`), `house-shed-frame`, `house-chimney-double` (two-sided, its foot marked), `house-floor` and `house-loft` overlays
  - **Frames:** a frame a stage. **Size:** Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable
  - **Plugs into:** `drawHousePlot`, `standChimneys` in `public/house-plot.js`
  - **Stands in now:** whole jacal stage sprites; `lean-to`; the single stick chimney drawn double (Astra's library art reused)
- [ ] **E5** (priority 2) — [Request 2026-09-12 (second) — settling in: houses, interiors, furnishings, and people whose looks can be chosen](ART_REQUESTS.md#request-2026-09-12-second--settling-in-houses-interiors-furnishings-and-people-whose-looks-can-be-chosen), a saddlebag interior
  - **Deliver:** `interior-saddlebag` (two round-log pens wall to wall round one central stone chimney, a fireplace into each, no passage)
  - **Frames:** 1. **Size:** The `home-interiors` style, camera and scale exactly as `interior-dog-run`
  - **Plugs into:** `INTERIORS.saddlebag` in `sim/interior-data.mjs`, `public/interior.js`
  - **Stands in now:** the dog-run's picture, drawn wide (Astra's library art reused)
- [ ] **E6** (priority 2) — [Request 2026-09-14 — Béxar civic architecture](ART_REQUESTS.md#request-2026-09-14--béxar-civic-architecture)
  - **Deliver:** `bexar-san-fernando-1836` and `bexar-governors-palace-1836`
  - **Frames:** 1 each. **Size:** Matched to `chapel`/`adobe-flat` scale and ground anchors, three-quarter
  - **Plugs into:** `public/bexar-layout.js`
  - **Stands in now:** the generic `chapel` and `adobe-flat` (Astra's library art reused)
  - **Research first:** **needs research first**: the 1836 appearance of San Fernando and the Governor's Palace; reject later additions and preserve uncertainty
- [ ] **E7** (priority 2) — [Request 2026-09-25 — the storming of Béxar](ART_REQUESTS.md#request-2026-09-25--the-storming-of-béxar), item 1
  - **Deliver:** `house-loopholed` (a flat-roofed stone house, a parapet about four feet high, loopholes in its walls)
  - **Frames:** 1. **Size:** As `stone-tile-house`
  - **Plugs into:** `draw` (`cover: 'loophole'`) in `public/battle-view.js`
  - **Stands in now:** the town's own house with flashes at its wall (Astra's library art reused)
- [ ] **E8** (priority 2) — [Request 2026-09-27 — the milk cow on the run, and Béxar before the bell](ART_REQUESTS.md#request-2026-09-27--the-milk-cow-on-the-run-and-béxar-before-the-bell), item 4
  - **Deliver:** `dancers-couple` (4), `fiddler-play` (2), `lantern-post` (a lantern on a post, lit)
  - **Frames:** 4, 2, 1. **Size:** People contract (request 2026-09-12): the figure's own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372; the lantern as a prop
  - **Plugs into:** `bx-dancer-*`, `bx-fiddler`, the `lights` prop in `public/town-scenes.js`
  - **Stands in now:** the cast figures; `fire-flicker` drawn small for the lanterns (Astra's library art reused)
  - **Research first:** the fandango in Béxar before February 23, 1836 (docs/battle-research/surprise-at-bexar.md §6)
- [ ] **E9** (priority 2) — [Request 2026-09-26 — the bell at Béxar](ART_REQUESTS.md#request-2026-09-26--the-bell-at-béxar), items 1-2
  - **Deliver:** `sentry-bell-ring-1`..`-4` (a man on a flat church roof by a bell arch pulling the rope, then pointing west) and `townsfolk-leave-1`..`-4` (a Tejano family, a man leading a laden carreta, a woman with a child)
  - **Frames:** 4 each, east. **Size:** Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure
  - **Plugs into:** the `sentry` and `townsfolk` groups of `arrival` in `sim/battles/alamo.mjs`
  - **Stands in now:** one standing volunteer at the church; the engine's civilian figures (Astra's library art reused)
- [ ] **E10** (priority 3) — [Request 2026-09-26 — the Mexican advance](ART_REQUESTS.md#request-2026-09-26--the-mexican-advance), item 4
  - **Deliver:** `plantation-sugar`, `blockhouse-village`, `townsite-bay`, `tavern-house`
  - **Frames:** 1 each. **Size:** Map cutout as `public/place-art.js` gives the places past the box
  - **Plugs into:** `public/place-art.js`
  - **Stands in now:** the places named on the map and nothing more (told in words, not drawn)
  - **Research first:** Stafford's, the Old Fort, New Washington and Mrs. Powell's (docs/MAP_ACCURACY.md §14)
- [ ] **E11** (priority 3) — [Request 2026-09-25 — Concepción and the Grass Fight](ART_REQUESTS.md#request-2026-09-25--concepción-and-the-grass-fight), item 4
  - **Deliver:** `mission-concepcion` (the church with twin towers and a dome, seen from about 500 yards)
  - **Frames:** 1. **Size:** Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable
  - **Plugs into:** `concepcionScenery` in `sim/battles/concepcion.mjs`
  - **Stands in now:** `church-generic` (Astra's library art reused)
  - **Research first:** the mission as it stood in 1835
- [ ] **E12** (priority 3) — [Request 2026-09-16 — the buildings the towns' research found](ART_REQUESTS.md#request-2026-09-16--the-buildings-the-towns-research-found), items 8-10
  - **Deliver:** Fort Velasco (a circular log-and-sand fort, gapped and derelict: `fort-velasco`), the Harrisburg steam sawmill (`sawmill-steam`), the two-storey Stone House at Nacogdoches (`stone-house-nacogdoches`)
  - **Frames:** 1 each. **Size:** The scale of `house-hewn-log` and `trading-house`, south-facing
  - **Plugs into:** each building's `sprite` in `sim/town-layouts.mjs`
  - **Stands in now:** `palisade` pieces in a ring; `timber-hall` and `storehouse`; `stone-tile-house` (Astra's library art reused)
  - **Research first:** docs/town-research/ for each
- [ ] **E13** (priority 3) — [Request 2026-09-25 — the south's fights: San Patricio by night and Agua Dulce Creek](ART_REQUESTS.md#request-2026-09-25--the-souths-fights-san-patricio-by-night-and-agua-dulce-creek), item 2
  - **Deliver:** a lit-window overlay for `adobe-flat` and `house-jacal` (`window-lit-*`)
  - **Frames:** 1 each. **Size:** Registered to the building it overlays
  - **Plugs into:** `drawScenery`, `glow` in `public/battle-view.js`
  - **Stands in now:** a warm glow drawn on the canvas (drawn in code (canvas or CSS))
- [ ] **E14** (priority 3) — [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](ART_REQUESTS.md#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 5
  - **Deliver:** San Fernando's tower as the red flag's setting
  - **Frames:** 1. **Size:** Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable
  - **Plugs into:** `drawFlag` in `public/battle-view.js`
  - **Stands in now:** the flag at the town point (nothing)
  - **Research first:** with E6
- [ ] **E15** (priority 3) — [Request 2026-09-12 (second) — settling in: houses, interiors, furnishings, and people whose looks can be chosen](ART_REQUESTS.md#request-2026-09-12-second--settling-in-houses-interiors-furnishings-and-people-whose-looks-can-be-chosen), the wagon's tools — **Claude stand-in in place** (`home-hoe`, `home-felling-axe`, `home-broadaxe`, `home-froe`, `home-auger`); Astra's replaces it
  - **Deliver:** `home-hoe`, `home-felling-axe`, `home-broadaxe`, `home-froe`, `home-auger`
  - **Frames:** 1 each. **Size:** The `home-furnishings` style and scale, standing or leaning as in a cabin
  - **Plugs into:** `INTERIOR_ART` `tool:*` in `sim/interior-data.mjs`
  - **Stands in now:** Claude's `claude-home-tools.png` (Claude-drawn)

Skipped:
- ~~E16~~ [Request 2026-09-16 — the shops of the towns](ART_REQUESTS.md#request-2026-09-16--the-shops-of-the-towns) — skipped: delivered 2026-09-26 (the `stand-in:` comment in sim/shops.mjs is stale)
- ~~ES6~~ [Request 2026-09-19 — the places past the box](ART_REQUESTS.md#request-2026-09-19--the-places-past-the-box) — skipped: delivered 2026-09-26
- ~~ES7~~ [Request 2026-09-18 — the Alamo's faces seen from the south](ART_REQUESTS.md#request-2026-09-18--the-alamos-faces-seen-from-the-south) — skipped: delivered 2026-09-21

## F — Terrain, trees, the norther, fields, icons, marks and effects

Scope: trees and their gale poses, river banks, fog, marsh, night and dawn grades, smoke, work effects, the family panel's marks and portraits, the army camp. 10 to make, 17 skipped.

- [ ] **F1** (priority 1) — [Request 2026-09-15 — face portraits for the family panel](ART_REQUESTS.md#request-2026-09-15--face-portraits-for-the-family-panel) — **Claude stand-in in place** (`portrait-rust`, `portrait-teal`, `portrait-elder`, `portrait-blue`, `portrait-rust-woman`, `portrait-indigo`, `portrait-ochre`, `portrait-blue-girl`, `portrait-girl`, `portrait-boy`, `portrait-smallchild`, `portrait-infant`); Astra's replaces it
  - **Deliver:** `portrait-rust`, `-teal`, `-elder`, `-blue`, `-rust-woman`, `-indigo`, `-ochre`, `-blue-girl`, `-girl`, `-boy`, `-smallchild`, `-infant`
  - **Frames:** 12. **Size:** 192×192, head and shoulders facing the viewer, matching the sheet figure
  - **Plugs into:** `drawPortrait` in `public/family-panel.js`
  - **Stands in now:** Claude's `claude-portraits.png`; without it, the idle clip cropped (Claude-drawn)
- [ ] **F2** (priority 2) — [Request 2026-09-16 — the family panel's marks](ART_REQUESTS.md#request-2026-09-16--the-family-panels-marks) — **Claude stand-in in place** (`mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`, `mark-auto-on`); Astra's replaces it
  - **Deliver:** `mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`, `mark-auto-on`
  - **Frames:** 6. **Size:** Mark: 96×96, transparent, no text, reads at 22–24 CSS px
  - **Plugs into:** `panelMark`/`paintMark` in `public/app.js`, `drawMark` in `public/family-panel.js`
  - **Stands in now:** Claude's `claude-marks.png` (Claude-drawn)
- [ ] **F3** (priority 2) — [Request 2026-09-28 — people at work](ART_REQUESTS.md#request-2026-09-28--people-at-work), item 15
  - **Deliver:** `fx-wood-chips`, `fx-earth-toss`, `fx-dust`, `fx-shavings`, `fx-ripple` (3 frames each, played from the strike) and `tree-fall` (4 frames: a hardwood leaning, going over, down, a bounce)
  - **Frames:** 3 each; 4. **Size:** Effect: 3 frames on the ground anchor of the work, one played from the strike
  - **Plugs into:** `EFFECTS` and `drawWorkLayer` in `public/work-art.js`
  - **Stands in now:** a handful of canvas rectangles and arcs (`EFFECTS` in `public/work-art.js`) (drawn in code (canvas or CSS))
- [ ] **F4** (priority 2) — [Request 2026-09-26 — the Mexican advance](ART_REQUESTS.md#request-2026-09-26--the-mexican-advance), item 2
  - **Deliver:** `farm-smoke-rise` (6-8 frames, a tall dark column leaning with the wind over a low orange glow) and `town-smoke-rise` (broader)
  - **Frames:** 6-8 frames, looping. **Size:** Readable at 30-160 px, anchored at the foot of the column
  - **Plugs into:** the `fires` in `drawWorld`, `public/app.js` (`window.__firesDrawn`)
  - **Stands in now:** the library's `smoke-rise` drawn three to four figures tall; a painted grey plume (Astra's library art reused)
- [ ] **F5** (priority 3) — [Request 2026-09-20 — the country in a norther: trees and grass bent by the wind](ART_REQUESTS.md#request-2026-09-20--the-country-in-a-norther-trees-and-grass-bent-by-the-wind), remaining trees
  - **Deliver:** a gale silhouette for each remaining tree kind and ground mark - pine, cedar, mesquite, live oak, elm, scrub, reeds, prickly pear, and every sized tree of `trees-colonies-1` and `-2` (`<tree>-wind`)
  - **Frames:** 1 each. **Size:** Exactly the scale and anchor of the upright sprite
  - **Plugs into:** `GALE_POSES` and `windLean` in `public/weather-art.js`
  - **Stands in now:** the upright sprite sheared about its foot (Astra's library art reused)
- [ ] **F6** (priority 3) — [Request 2026-09-19 — the country of 1836: trees and ground cover](ART_REQUESTS.md#request-2026-09-19--the-country-of-1836-trees-and-ground-cover), remaining species
  - **Deliver:** anacua, Texas ebony, tupelo, cedar elm, willow, shortleaf pine at `-pole`/`-log`/`-large`, and hardwood stumps (hickory, walnut, ash, the oaks)
  - **Frames:** 3 sizes each. **Size:** The style and scale of `pine-loblolly-*` and `live-oak-*`
  - **Plugs into:** `KINDS` in `sim/woods.mjs`, `drawGroundDetail` in `public/app.js`
  - **Stands in now:** `oak-spreading`, `elm`, `cottonwood`; the loblolly for shortleaf; the post-oak or cottonwood stump (Astra's library art reused)
  - **Research first:** which trees grew where in 1836 (docs/BIOMES.md)
- [ ] **F7** (priority 3) — [Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night](ART_REQUESTS.md#request-2026-09-25--the-alamo-ladders-the-guns-served-the-walls-manned-night), item 4
  - **Deliver:** a night grade and a dawn grade for ground and figures (the Alamo assault), a moonlit night for Béxar's storming, and a moonless rain night for San Patricio under which lit windows and fires read (`night-grade`, `dawn-grade`, `moonlight-grade`)
  - **Frames:** grades. **Size:** A full-view light layer the renderer lays over the ground and figures (not a sprite); must not snap when the pace changes
  - **Plugs into:** `draw` and `drawNight` in `public/battle-view.js`
  - **Stands in now:** a dark blue wash by the phase's `light`; no night at Béxar (drawn in code (canvas or CSS))
  - **Research first:** sunrise 6:20 on March 6, 1836 (computed)
- [ ] **F8** (priority 3) — [Request 2026-09-25 — Concepción and the Grass Fight](ART_REQUESTS.md#request-2026-09-25--concepción-and-the-grass-fight), items 1, 3, 7
  - **Deliver:** `riverbank-cut-e`/`-w` (a bank face with steps), `river-bend`, `fog-bank-dense`, `fog-bank-thin`, `creek-bed-dry`, `creek-ford`
  - **Frames:** 1 each (fog 2-4 drifting). **Size:** Ground piece: seen from above at the map's scale, transparent, tiles or scatters
  - **Plugs into:** `concepcionScenery`, `grassScenery`, `drawFog` in `public/battle-view.js`
  - **Stands in now:** `earth-rampart` along the bank with trees and a drawn ribbon of water; a pale radial veil for fog (Astra's library art reused)
- [ ] **F9** (priority 3) — [Request 2026-09-25 — San Jacinto](ART_REQUESTS.md#request-2026-09-25--san-jacinto), item 4
  - **Deliver:** `marsh-edge` (tiles of cordgrass and open water, to scatter)
  - **Frames:** a few tiles. **Size:** Ground piece: seen from above at the map's scale, transparent, tiles or scatters
  - **Plugs into:** `drawWorks` in `public/battle-view.js`
  - **Stands in now:** the library's cordgrass, reeds and water ripples scattered (Astra's library art reused)
- [ ] **F10** (priority 3) — [Request 2026-09-25 — the south's fights: San Patricio by night and Agua Dulce Creek](ART_REQUESTS.md#request-2026-09-25--the-souths-fights-san-patricio-by-night-and-agua-dulce-creek), items 2 and 5
  - **Deliver:** a campfire burning at night (`campfire-night`) and a live-oak mott as one sprite with shade under it (`live-oak-mott`)
  - **Frames:** 2-4; 1. **Size:** Prop: transparent, anchored at its base, at the scale of the sprites it stands beside
  - **Plugs into:** `drawScenery` in `public/battle-view.js`
  - **Stands in now:** a warm glow in canvas; `live-oak-large` and `mesquite-large` set close (Astra's library art reused)

Skipped:
- ~~F11~~ [Request 2026-09-19 — the country of 1836: trees and ground cover](ART_REQUESTS.md#request-2026-09-19--the-country-of-1836-trees-and-ground-cover) — skipped: delivered 2026-09-22 (the `stand-in:` comment in public/ground-classes.js is stale)
- ~~F12~~ [Request 2026-09-19 — the game of 1836](ART_REQUESTS.md#request-2026-09-19--the-game-of-1836) — skipped: delivered 2026-09-21; the remaining work is code
- ~~F13~~ [Request 2026-09-19 — Béxar's fields and acequias](ART_REQUESTS.md#request-2026-09-19--béxars-fields-and-acequias) — skipped: delivered 2026-09-21; the layout is research and code
- ~~F14~~ [Request 2026-09-21 — the guided start's marks](ART_REQUESTS.md#request-2026-09-21--the-guided-starts-marks) — skipped: on hold 2026-09-28 - the tutorial is removed for now; do not draw until it returns
- ~~F15~~ [Request 2026-09-28 — the garden — WITHDRAWN 2026-09-28](ART_REQUESTS.md#request-2026-09-28--the-garden--withdrawn-2026-09-28) — skipped: withdrawn 2026-09-28 (crops no longer follow the seasons)
- ~~FS8~~ [Request 2026-09-20 — the launcher's remaining plates — Delivered 2026-09-20](ART_REQUESTS.md#request-2026-09-20--the-launchers-remaining-plates--delivered-2026-09-20) — skipped: delivered 2026-09-20
- ~~FS9~~ [Request 2026-09-19 — the logs fetched from the timber](ART_REQUESTS.md#request-2026-09-19--the-logs-fetched-from-the-timber) — skipped: delivered (`icons-family-service.png`)
- ~~FS10~~ [Request 2026-09-19 — the traveller's marker — WITHDRAWN 2026-09-22](ART_REQUESTS.md#request-2026-09-19--the-travellers-marker--withdrawn-2026-09-22) — skipped: withdrawn 2026-09-22: there is no marker any more
- ~~FS11~~ [Request 2026-09-16 — the road's icons](ART_REQUESTS.md#request-2026-09-16--the-roads-icons) — skipped: delivered (`icons-family-service.png`)
- ~~FS12~~ [Request 2026-09-16 — the camp's icons](ART_REQUESTS.md#request-2026-09-16--the-camps-icons) — skipped: delivered (`icons-family-service.png`)
- ~~FS13~~ [Request 2026-09-16 — the winter's icons](ART_REQUESTS.md#request-2026-09-16--the-winters-icons) — skipped: delivered (`icons-family-service.png`)
- ~~FS14~~ [Request 2026-09-15 — action icons for the family panel](ART_REQUESTS.md#request-2026-09-15--action-icons-for-the-family-panel) — skipped: delivered 2026-09-21
- ~~FS15~~ [Request 2026-09-20 — the gathering icons](ART_REQUESTS.md#request-2026-09-20--the-gathering-icons) — skipped: delivered (existing `icons-family-subsistence.png` art wired 2026-09-26)
- ~~FS16~~ [Request 2026-09-20 — the stock icons](ART_REQUESTS.md#request-2026-09-20--the-stock-icons) — skipped: delivered (existing `icons-family-subsistence.png` art wired 2026-09-26)
- ~~FS17~~ [Request 2026-09-14 — game](ART_REQUESTS.md#request-2026-09-14--game) — skipped: delivered 2026-09-15 (`wildlife-deer`)
- ~~FS18~~ [Request 2026-09-14 — cleared ground](ART_REQUESTS.md#request-2026-09-14--cleared-ground) — skipped: delivered 2026-09-14 (`land-clearing`)
- ~~FS19~~ [Request, 2026-09-21 — the Play Solo menu's trash can](ART_REQUESTS.md#request-2026-09-21--the-play-solo-menus-trash-can) — skipped: delivered 2026-09-22


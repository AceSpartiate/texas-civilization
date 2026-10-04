## Redo and edit requests — 2026-10-04

These are pieces of Astra's delivered art that are wrong in a way a player can see. Each one is either redrawn (**Redo**) or a touch-up of the frames she already made (**Edit**). It follows the owner's direction of 2026-10-04, *"if astra needs to redo art, please update the art requests file and explain why each one needs to be redone"*, and the owner's clarification, *"redo or edit"*.

**How this list was made.** Only real defects made the list, each measured, not matters of taste. The audit read `atlas.json`, `animation.json` and the PNGs of all 283 frontier-v1 sheets with the builder's own decoder (`decodeRgba` in `scripts/build-atlas-manifest.mjs`). It measured every frame's box, anchor, logical height and source position in its grid cell, and found the frames of 693 person and animal clips (330 of them walks, rides and runs). It checked: facing (91 wide east clips); how much each frame slides sideways and changes height within its clip; whether a figure stays the same size from one direction or clip to the next; where its foot line falls in the cell; frames that touch the sheet edge or their neighbour; and stray specks. About 150 frames were then looked at by eye. The evidence plates were drawn in Chrome with the game's own `drawSprite` (public/art.js): each frame stands on its measured ground anchor at the size the game draws it. The red line is the ground, the dashed red line the anchor, and the dashed blue line the requested drawing height. The scratch scripts were not committed.

Most of what the measuring found is **not** a fault in her drawing. The builder measures her frames in a way her art was never drawn for. That part is listed below under *Fixed in code instead (no redo needed)*, so nobody redraws good art.

### R1 — the Texian enlistment and drill icons wear the Mexican regular's uniform · **Redo** · priority 1

- **Asset.** `icons-family-service.png`: `icon-enlist-regular` (row 1, column 1; source box 44,46, 251×278) and `icon-camp-drill` (row 3, column 1; source box 89,643, 219×282).
- **What is wrong.** `icon-enlist-regular` shows a tall navy shako with a brass front plate, gold cord and red plume beside a paper and quill. `icon-camp-drill` shows a navy sleeve with a red cuff and white trousers, a musket held at the shoulder. Both are, piece for piece, the uniform of the game's Mexican regular (`regular-e`, `regular-march`, `regular-dig`, the `military` sheets). Nothing else in the library wears it. The prompt that made the sheet (`scripts/art-deliveries/family-action-icons.mjs` line 40) asked for a "shako". The request asked for something else: *"a recruiting table with a roll and a quill"* (request 2026-09-16, the winter's icons) and *"a file of men with muskets at the shoulder"* (request 2026-09-16, the camp's icons).
- **Why it needs redoing.** These icons sit on a Texian family member's row during the second class period. *"Go to San Felipe and enlist in the regular army"* (`HIST-TEX-048`) shows the enemy's hat, and drilling in Houston's camp shows the enemy's coat. A middle-school class learns which side is which from these same pictures, on the battlefield and on the map. HISTORY.md also says no uniform may be drawn without its own checked claim, and none exists for a Texian regular. The garrison's documented state is "short of clothing" (`HIST-TEX-049`, `HIST-TEX-611`). Two enlistment icons that differ only in the hat are also harder to tell apart than the request asked.
- **What the redo should be.** The action-icon contract (request 2026-09-15): one icon each, square, transparent, a single strong silhouette with a thin dark outline, delivered at 128×128 (or in the same 4×4 cell as now), reading at 34 and 38 CSS px and dimmed to 40%. No text.
  - `icon-enlist-regular`: a recruiting table with an open muster roll, a quill and an inkpot, a musket leaning on the table. No uniform or headgear.
  - `icon-camp-drill`: two or three men in a file in everyday clothes (hunting shirt or coat, broad-brim hat, as `volunteer-e`), muskets at the shoulder.
  - `icon-enlist-auxiliary` (paper, quill and brim hat) stays as it is. It must still be told apart from the new `icon-enlist-regular` at 38 px.
  - Redeliver as the same frame names on a corrected `icons-family-service.png`, or on a new sheet that `PANEL_ICONS` names. Record the new prompt and provenance.
- **Code that compensates.** None. `PANEL_ICONS` (public/family-panel.js) picks the frame by name, so the corrected frame drops straight in.
- **Evidence.** [art-redo-uniform-icons.png](evidence/art-redo-uniform-icons.png): both icons beside `regular-e` (the Mexican regular) and `volunteer-e` (a Texian volunteer).

### R2 — Lamar and Joe grow about a tenth when they stop walking · **Edit** · priority 2

- **Asset.** `famous-lamar.png` (1312×1199, 4×4) and `joe-poses.png` (1254×1254, 4×4).
- **What is wrong (measured, source px).**
  - **Lamar.** The east walk is 253–261 tall (median 254). Rows 3–4 are 269–288: `lamar-idle` 288, `-command` 285, `-rest` 285, `-saber-low` 280, `-salute` 279, `-listen` 277, `-withdraw-signal` 276, `-reach` 269. Idle over walk is **1.13**.
  - **Joe.** `joe-walk-1..4` are 300–303. `joe-idle` is 332, `joe-speak-1` 332, `joe-speak-2` 336. Idle over walk is **1.10**.
  - Across the 42 people in the library who have both an idle and an east walk, the median ratio is **1.00**. Only McCulloch comes next, at 1.08, and his walk is drawn stooped.
  - The figure is drawn bigger, not just taller: head, shoulders and coat are all larger. These sheets are drawn at their tallest frame (`logicalHeight` 288 for Lamar and 336 for Joe). So on screen the walking man is drawn at 88% (Lamar) or 90% (Joe) of the man standing still.
- **Why it matters.** Both are staged people the owner asked to have *"carefully recreated"*: Joe from his testimony at the Alamo, Lamar at San Jacinto on April 20. Every time either stops to stand, speak or command (`PERSON_ART` in public/battle-view.js: `joe.stand` is `joe-idle`, `lamar.stand` is `lamar-idle`), he visibly swells by a tenth and shrinks again when he moves off.
- **What the edit should be.** Keep the poses and scale them, as the People contract asks: the same person at one logical height, constant foot baseline.
  - Lamar: scale rows 3–4 of `famous-lamar` down to the walk (a standing figure about 262 px, about 1.02 × the walk median). Keep each foot line where it is now.
  - Joe: scale `joe-idle`, `joe-speak-1` and `joe-speak-2` to about 308 px.
  - Same frame names and cells. Rerun `npm run build:art`.
  - Check: idle over walk between 0.98 and 1.05, and the two figures matching at play size.
- **Code that compensates.** None.
- **Evidence.** [art-redo-idle-taller.png](evidence/art-redo-idle-taller.png): Lamar's walk beside his idle, command and rest, and Joe's walk beside his idle and speak, all at one requested height. Crockett's idle is shown for the median.

### R3 — Grant's gallop: frames 3 and 4 touch across the cell line · **Edit** · priority 3

- **Asset.** `famous-grant-gallop.png` (1254×1254, 2×2): `grant-mounted-gallop-e-3` (source x 11–625) and `-e-4` (source x 613–1244).
- **What is wrong.** The two horses overlap by 13 px across the middle of the sheet. The builder splits the overlap, so it cuts **142 px** from frame 3 and **70 px** from frame 4 (`audit.trimmedPixels` in atlas.json). Each frame also carries a sliver of the other: the tip of frame 4's tail in front of frame 3's nose, and frame 3's muzzle behind frame 4's tail. They are the largest trims on any person or horse in the library. The contract asks for generous empty gutters.
- **Why it matters.** At the gallop's 4-frame loop, a dark fleck flickers in front of and behind Grant's horse twice a cycle, in a horse that is otherwise clean. It is small at play size but always there while he gallops.
- **What the edit should be.**
  - Move the two figures apart in their cells, so each has at least 24 px clear of the cell line, with no pixel changes. Or redeliver the row with the gutters.
  - Same frame names. `npm run build:art` should then report 0 trimmed pixels for both.
- **Code that compensates.** None.
- **Evidence.** [art-redo-sheet-slivers.png](evidence/art-redo-sheet-slivers.png), the first two tiles (the slivers sit just ahead of frame 3's nose and behind frame 4's tail).

### Checked and found sound (nothing to redo)

- **Facing.** None of the 91 wide east clips faces west. Camp, sleep, sick-bed and rest poses face the way their clips say.
- **Transparency and corners.** All 283 sheets pass the builder's own corner and clear-alpha checks, which refuse a matted sheet. Nothing is held back (`HELD` in `scripts/art-deliveries/index.mjs` is empty).
- **Stray specks.** After discounting the seed being sown and leaves blowing, which are meant to be there, no frame has a stray island that grows its box.
- **Clip timing.** No locomotion clip has a repeated frame, an uneven beat (longest frame more than 1.6 × the shortest) or an unintended one-shot.
- **Mismatched sets.** The east, south and north mounted sheets of Houston, Santa Anna, Cos, Urrea, Seguín, Burleson, Castañeda, Deaf Smith, Karnes and Lamar keep the same horse colour, coat and hat. The small tack and marking differences Astra noted in her deliveries do not read at play size.
- **History.** `alamo-church-front-1836` has no later parapet hump. The one generated later façade (`fortifications`, row 1, column 1) is excluded in the builder and never drawn. The "Come and take it" flag, the red no-quarter flag, the regulars' and volunteers' dress and the white flags match their claims. R1 is the one contradiction found.
- **UI art.** No icon has text baked into it. The commerce panels reuse existing sprites, and her under-12px type was a CSS matter, raised in the merge (HANDOFF, *Astra's commerce UI ... merged*).
- **Sheet edges.** `carreta-travel-e-4` reaches the right edge of `carreta-solid-wheels.png` (x 1254) and `icon-cut-bee-tree` the left edge of `icons-family-subsistence.png` (x 0). The tongue's ring and the axe handle are whole at play size (evidence plate, tiles 3–5), so neither needs an edit.
- **The Béxar plaza houses moved 70 ft.** This was a layout change in her street-repair data, not her drawing. The staging moved with the houses in the merge.
- **Size from one direction to the next.** Urrea's east walk (252 px) is 7% shorter than his south and north walks (269–275) on the same sheet. That is within what a side-on stride accounts for, so it is not requested. Susanna's 15% difference east to south comes from the builder (C below), not her drawing.
- **Tests and proofs.** No art test or proof was found skipped or loosened for her art.

### Fixed in code instead (no redo needed)

None of these is fixed on this branch. Each one changes the measured anchors or logical heights of many frames, and with them sizes the browser proofs depend on, so none is trivial. They are described here so that nobody redraws art for them, and so the code workarounds can go when they are fixed.

- **C1 — the anchor lands on one hoof or one foot in a stride.**
  - `anchorOf` (`scripts/build-atlas-manifest.mjs` line 227) puts a frame's ground point at the middle of the widest row in its bottom 7%. In a gallop or a long stride, that row is often a single hoof or boot, so the drawn figure jumps back and forth along its path.
  - Largest jump from one frame to the next, in logical heights: `javelina-alert-run` 0.81, `seguin-mounted-canter-e` 0.47, `bison-run` 0.41, `mustang-gallop` 0.40, `sherman-walk-e` 0.21, `mcculloch-walk-e` 0.20, `hockley-walk-e` 0.17, `grant-mounted-gallop-e` 0.16. 47 of the 330 locomotion clips jump more than 0.08.
  - Her figures barely move within their own cells (Seguín 0.09, Sherman 0.05, Hockley 0.04). The registration is hers and sound; the measure is ours.
  - Way out: anchor each locomotion clip to one clip-wide ground point, for example the clip's median anchor relative to the cell or the upper-body centroid.
  - Evidence: [art-redo-code-anchor.png](evidence/art-redo-code-anchor.png).
- **C2 — sheets with no logical height are drawn at every frame's own height.**
  - The builder gives `logicalHeight` only to sheets named `people-`, `animal-`, `military-`, `courier-` or `famous-` (lines 358 and 365). On the other 52 sheets used by multi-frame clips, every frame is stretched to the requested height whatever its pose.
  - 35 of their 108 clips change size by more than 10% within the clip: `deer-idle` and `pronghorn-idle` shrink about 30% when the head comes up; `bear-alert-bound` 0.69; `volunteer-gun-fire` 0.73; `twin-crew-gun-ram` 0.74; `regular-gun-shot-carry` 0.71; `volunteer-loophole-fire-reload` 0.81.
  - Across clips, a man bent over `volunteer-dig` or `regular-dig`, drawn at the soldier's own size (×1), comes out about 1.4 × the standing man beside him.
  - The code already corrects some of this by hand, with guessed multipliers that should become measured ones: `public/battle-view.js` line 701 (`*-sleep` ×0.7), lines 861 and 868 (`volunteer-loophole-*` ×0.65), line 907 (`*-rest-sit` ×0.7), line 1312 (`settler-gun-rammer-cover` ×0.65) and line 1599 (`crate-command` ×1.18).
  - A sheet of nothing but crouched or seated figures has no standing figure in it to measure against. Such a delivery should name the standing frame it was drawn beside (a reference height in its `scripts/art-deliveries/` module). That is a line in the delivery record, not a redraw.
  - Evidence: [art-redo-code-scale.png](evidence/art-redo-code-scale.png), rows 1–2.
- **C3 — a raised arm shrinks a whole famous figure.**
  - A `famous-` sheet's logical height is its tallest frame in rows 1–3, which can be an action pose. 9 of the 120 famous sheets come out at least 6% small in every pose:
    - `famous-susanna-child-travel`: 1.16 (set by `susanna-child-hold-1`)
    - `famous-hockley`: 1.135 (`hockley-fire-signal`)
    - `famous-sherman`: 1.12 (`sherman-rally`)
    - `famous-lamar`: 1.10 (set by his idle; the art part of that is R2)
    - `famous-johnson`: 1.07 (`johnson-gather`)
    - `famous-cos-mounted`, `famous-martin-mounted`, `famous-grant-mounted` and `famous-santa-anna-mounted`: about 1.06 (their south idle or walk)
  - This is what Astra's delivery notes call *"a raised hand can change the overall silhouette height slightly under the existing sprite sizing system"*.
  - Way out: measure a famous sheet's logical height from its walking frames only.
  - Evidence: [art-redo-code-scale.png](evidence/art-redo-code-scale.png), row 3.


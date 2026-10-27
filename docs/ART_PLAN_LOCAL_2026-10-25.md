# Replacing stand-ins with the local image pipeline: the plan (2026-10-25)

**Status: approved by the owner on 2026-10-25 (see *Decisions*); batch W is done (no GPU). A model bake-off ran on
2026-10-25 (klein 4B against HiDream-O1, [ART_BAKEOFF_2026-10-25.md](ART_BAKEOFF_2026-10-25.md)); the owner picks the model
before batch 0 runs. `scripts/local-art/` (tx_workflows, licence_check, paint) exists from it.** Owner,
2026-10-25: *"check the licence then start replacing stand-ins"* and *"repaint the road tiles first"*. This is step 1 of
the asset-pipeline method: list every image, stage it on paper, and get the owner's OK before painting.

## In plain words

- **The licence.** The pipeline's usual model, FLUX.2 klein 9B, is non-commercial, and the owner may sell the game. Every
  picture here will be painted with **FLUX.2 klein 4B** (Apache-2.0), or with **Z-Image Turbo** (Apache-2.0) for plain
  text-to-image. The road tiles shipped on 2026-10-13 were painted with 9B, so they are repainted first (batch 0). The
  models, sizes and checksums are in [ART_TOOLS.md](ART_TOOLS.md).
- **What the pipeline is good at here:** whole paintings with nobody in them (the rider scenes' backdrops, the hunter's
  view), single props and buildings (the tent, the garden, the wash kettle), and icons. These replace pictures the page
  now draws itself in canvas strokes, which students see every few minutes.
- **What it is not good at:** a person's 4-frame work cycle, which must keep the same face, clothes and hands in every
  frame. It also cannot match the family rig Astra built on 2026-10-13, whose tinted body and head layers the pipeline
  cannot reproduce. Those stay as they are, and §3 says what is proposed for each.
- **Several items on the list need wiring, not painting.** The wagon with its cover drawn back, a parent on horseback
  holding a toddler or a baby, the double chimney, the Alamo parapet firers, and Concepción's mule riders, padre and carts
  are **already drawn by Astra and sit in the library unused** (HANDOFF, *Library-ready, not drawn*). Wiring them needs no
  GPU, so it can start now (batch W).
- **One house fault is fixed best without a model.** Astra's rear walls stand six log courses to the front's seven. Her
  own rows of logs are copied up by one course on the CPU, which keeps her drawing exactly (batch 2).

## Summary

GPU time is an estimate. Nothing has been measured for klein 4B on this machine: the bake-off of 2026-10-11 compared
quality, not speed. Assumed: ~12 s per job (4 steps, about 1 MP, warm, references included) and ~2 min to load the
models per lease. Batch 0 measures the real speed, and this table is corrected after it.

| Batch | Items | Est. GPU jobs | Est. GPU time | Owner sees it |
| --- | --- | ---: | ---: | --- |
| W: wiring only | 8 Astra drawings already in the library; reconcile `plan.mjs` with her 10-13 delivery | 0 | 0 | Done 2026-10-25 |
| **0: road tiles** | `road-tile-wagon`, `-street`, `-path`, `-verge` repainted with klein 4B, same sheet and wiring | 34 | ~10 min | Every map, every minute |
| 1: rider-scene backdrops | 9 `scene-*` paintings + Claude's 3 courtship yards | 108 | ~25 min | Every rider who reaches a family |
| 2: the homestead | rear walls +1 course (CPU), `homestead-tent`, `garden-beds` ×2, `wash-kettle`, `wash-line`, `wood-pile-1..4` | 58 | ~15 min | Beside every family's house |
| 3: the hunter's view | `hunt-field-timber/-brush/-open` summer and winter, `hunt-rifle` | 48 | ~14 min | Every hunt |
| 4: icons and marks the page strokes | 17 icons, 7 marks | 96 | ~21 min | The family panel, always |
| 5: Claude-drawn icons and props | 23 icons + `mark-sick`, farm neighbours, grave marker, coins (house floor and loft went to batch W) | 128 | ~28 min | Panel, wedding, homecoming, interior |
| 6: pilot, edits of Astra's frames | the family's mule (plain and saddled) from her packed mule's frames; Béxar townsfolk stills | 8, then ≤140 if the pilot passes | 4 min, then ≤30 | Only if the 8-job pilot passes |
| **Total** | | **~480 (≤620 with batch 6)** | **~2 h (≤2.5 h)** | |

Batches go in this order, one at a time, through the `comfy.py` lease, in the foreground. One art agent works at a time.
Each batch is reviewed, wired, tested and committed before the next starts.

---

## §0 How every batch is made

### 0.1 Method, as it applies to sprites

1. **Staging on paper** (this file). Each item below gives its facing, what is in each hand, its scale reference and its
   contract size.
2. **References from Astra only.** Each reference edit is fed her frames: style, palette and line from her own sheet,
   and composition from the nearest frame she drew. Nothing painted by klein 9B is used as a reference, including the
   2026-10-13 raw road paintings in `docs/art-sources/ground-roads-2026-10-13/raw/`.
3. **Versions by difficulty:** icons and small props (inserts) 4, a single subject or a backdrop 8, a person 8. No
   multi-person shots are planned.
4. **Filter.** First a contact sheet of every candidate. Then the top 3 at full size through `zoomsheet.py` (CPU), with
   hands, legs, wheels and log ends counted. Then `inspect_art.py` for text and signatures on the finalists only (a heavy
   GPU job, run in the same lease). Mechanical checks: transparent corners, nothing below the ground anchor, no text.
5. **At most one repair per item.** Otherwise it is flagged to the owner. Never loop.
6. **Play-size check.** The chosen image is shown in the game beside her art at the sizes students see. A browser proof
   or `node scripts/claude-art/compare.mjs`-style sheet goes in `docs/evidence/`.

### 0.2 How a Texas job selects klein 4B (never 9B)

The shared toolkit (`E:\VN-Tools\asset-toolkit\`) defaults to klein 9B: `workflows.MODELS`, and the `model='klein9b'`
default of `edit()` and `text_to_image()`. `batch_run.py` and `crop_edit.py` call those defaults. Its `klein4b` entry also
names a text encoder that is no longer on disk (`qwen_3_4b.safetensors`). **The toolkit is not edited.** This repo gets
its own small layer, written in batch 0:

- `scripts/local-art/tx_workflows.py` imports the toolkit's `workflows` and wraps `text_to_image` and `edit` with
  `model='klein4b'`. It then pins node `1` to `UNETLoader flux-2-klein-4b-fp8.safetensors` and node `2`'s `clip_name` to
  `qwen_3_4b_fp8_mixed.safetensors`. Last, `assert_allowed(wf)` refuses any workflow that names `klein-9b`, a `.gguf`, a
  `LoraLoader`, or `refcontrol` (the RefControl LoRAs exist only for 9B). `z_image()` passes through unchanged.
- `scripts/local-art/paint.py <rows.json> --out <dir>` is the Texas painter. It reads rows of
  `{name, prompt, refs[], width, height, seeds[]}`, uploads the references, and runs each job through
  `Comfy()` (the toolkit's lease, used as is) with `tx_workflows` builders. It writes `raw/` and a contact sheet. It is
  the toolkit's `batch_run.py` loop without its 9B default. Culling calls the toolkit's CPU layers (`zoomsheet.py`).
- `scripts/local-art/licence_check.py <dir>` reads the workflow ComfyUI writes into every PNG (`prompt` text chunk) and
  fails unless each `unet_name` is `flux-2-klein-4b-fp8.safetensors` or `z_image_turbo_bf16.safetensors`. It runs on
  every `raw/` folder before anything is chosen, so each candidate's own file proves its model.
- `scripts/road-art/generate.py` changes its import from the toolkit's `workflows` to `tx_workflows`.
- **A test**, `tests/art-licence.test.mjs`: every `docs/art-provenance.json` and `docs/art-prompts.json` entry whose
  `tool` says ComfyUI must name klein 4B or Z-Image and must not name klein 9B. Today it fails on `ground-roads` and passes
  once batch 0 lands. Per CLAUDE.md, it is proved by injection: restore the 9B tool string and only this test fails.

**Smoke jobs first (2 jobs).** One text-to-image and one reference edit at 1024². They prove that klein 4B loads with
the fp8-mixed Qwen3-4B encoder. The encoder is the same Qwen3-4B Z-Image uses, so it is expected to load. If it does
not, the fix is Comfy-Org's `qwen_3_4b.safetensors` (7.49 GB). That is over the 2 GB rule, so it needs the owner's
approval first.

### 0.3 Registering a batch (as the road tiles were)

Each batch is wired and registered in one pass:

1. The sheet goes in `public/assets/frontier-v1/atlases/<sheet>.png`. Each sprite sits in a clear cell with a gutter, as
   her sheets have.
2. The delivery module is `scripts/art-deliveries/local-<sheet>-<date>.mjs`, after `road-textures-2026-10-13.mjs`. It
   holds `SHEETS`, `ANIMATION_CLIPS` if any, and `promptEntries` with each prompt, its seeds, its references and the
   `tool` string `local ComfyUI, FLUX.2 klein 4B fp8 (Apache-2.0), through E:/VN-Tools/asset-toolkit/comfy.py`.
3. The chosen raw paintings and contact sheets go in `docs/art-sources/<sheet>-<date>/`. A write-up goes in
   `docs/ART_DELIVERY_<date>-<NAME>.md`.
4. Build: `node scripts/register-delivered-art.mjs`, then `npm run build:art` (`build-atlas-manifest.mjs` measures the
   anchors and logical heights), then `npm run build:webp`.
5. The stand-in is retired. Its `stand-in:` comment and its row under *Stand-ins in use* or *Claude-drawn stand-ins* are
   deleted. A Claude frame is retired with `scripts/claude-art/kit/retire.mjs` in its area module. Its item in
   `scripts/claude-art/plan.mjs` is marked, then `npm run art:plan` is run.
6. Checks: `npm test`, `npm run test:art` and the feature's own browser proof. The items marked *asks by name* below need
   no code: the page already asks for that sprite name and falls back to the stand-in.

---

## Batch W: wiring only (no GPU, can start now)

| Astra drawing in the library | Replaces | Where it plugs in | What wiring needs |
| --- | --- | --- | --- |
| `wagon-cover-drawn-back` | The closed wagon cover. Its stand-in is in `public/app.js` (request 2026-10-02, *the wagon sheet*) | the ox-wagon rig, `public/motion.js` | HANDOFF: "a rig migration moves the driver and passenger anchors". Measure her anchors and move the seats |
| `infant-with-caregiver-ride-e/n/s`, `smallchild-with-caregiver-ride-e/n/s` | A carried child drawn beside or behind the rider (`public/motion.js`, request 2026-09-14) | `RIDING_FIGURES` and the paired seat | Paired staging: one sprite for two people, and the family's tint on both |
| `house-chimney-double` | The single stick chimney drawn twice. `stand-in:` in `public/house-plot.js` (≈ lines 522 and 662) | `drawHousePlot` | Her frame carries no measured `centre` yet. Measure it in `build-atlas-manifest.mjs`, then `doubleDrawn` takes it |
| `house-floor-loft` (her floor and loft layers) | Claude's `house-floor` and `house-loft` (`public/house-plot.js` line ≈ 217) | the interior | Register her layers, then retire Claude's. **This drops `house-floor` and `house-loft` from batch 5** |
| `volunteer-parapet-*`, `alamo-parapet-service`, `alamo-volunteer-trot` | Firers on the Alamo walls (request 2026-09-25, *the Alamo*, item 3) | `public/battle-view.js` | Occlusion against the parapet (HANDOFF: "wall, seat and breach occlusion ... not wired") |
| `limber-mules-*`, `padre-walk`, `casualty-cart-wounded/-covered` | Concepción's aftercare and the gun's mules (C16, D12) | `sim/battles/concepcion.mjs` phases | A phase that stages them. HANDOFF: "no phase stages them" |
| `bexar-townsfolk` walks (woman, elder, child, older woman) | Claude's `bexar-man-*` and the others' walks (E1) | `BEXAR_CAST` in `sim/town-scenes.mjs` | Walks only. The idle, speak, listen and carry poses are the batch 6 pilot |
| `dragoon-fire`, `dragoon-carbine-rest/-lower` | The chase's "flash and a puff at his hands" (D2) | `public/chase-view.js` | The gallop stays Claude's (§3) |

**Reconcile the generated list first.** `scripts/claude-art/plan.mjs` still lists items Astra delivered on 2026-10-11 to
10-13: F1 the portraits, E2 the house from its other sides, E3 the roof joins, E6 Béxar civic, and part of E4. Mark them
delivered and rerun `npm run art:plan`, so the list the batches are chosen from is true. This is paper work and touches
no art.

### Batch W done (2026-10-25, branch `standins-1025`, not released)

| Drawing | Outcome |
| --- | --- |
| `wagon-cover-drawn-back` | **Wired.** A family wagon with anybody riding in its bed is drawn as her open wagon (`openCoverClip`, `OPEN_WAGON` in `public/motion.js`; `miniWagon`, `drawSeated` in `public/app.js`). The riders sit in the bed before the wagon, so her side boards hide them below the rail; the driver sits on her board ahead of the cover. Seat, rail and bed are read off her pixels and held there by `tests/wagon-open-cover.test.mjs`. Her east view bunches the cover over the tail instead of the driver, so her west view is mirrored for east (`ceiling:`). The wagon stays side-on going north or south, as it was. The next wagon of a train is drawn a whole ox and wagon back while riders sit in the one ahead (`OPEN_TRAIN_GAP`), so its ox does not hide them. |
| `infant-with-caregiver-ride-*` | **Wired, within her restriction**: a baby in the arms of her baseline indigo caregiver (no chosen look) on a horse is her paired rider (`mountedInfantClip`). Every family made at the join has chosen looks, so in a class this almost never shows. **Needs a decision:** `smallchild-with-caregiver-ride-*` - the server never seats a child of two to five in a rider's arms (sim/company.mjs: a small child rides alone or is carried on foot). |
| `house-chimney-double` | **Wired.** Its foot's middle (`centre`) is measured by `scripts/build-atlas-manifest.mjs`. It stands finished between the saddlebag's pens; the tall stick chimney is shown while it is going up. |
| `house-puncheon-floor`, `house-half-loft` | **Floor wired** under a pen's walls where the pen has a finished floor (`floorFit`, fitted to the walls' footprint). Claude's `house-floor` and `house-loft` are retired. **The loft is not drawn.** A loft is laid only under a finished roof, so no view shows it. Showing it needs the room view (`public/interior.js`) to get a registered floor and loft layer, which is a design decision. `house-floor` and `house-loft` leave batch 5. |
| `volunteer-parapet-*` | **Wired.** At the Alamo the garrison's sampled men on the north, west, south-west, south and palisade walls are drawn from the waist up. Each waist sits on that wall's own top (public/alamo-layout.js heights × the compound's drawn factor), facing out over the wall, on the musket's clock. Walls, collision and breaching are untouched. The church platform and the family's own people are unchanged. **`alamo-volunteer-trot` needs a decision:** no phase projects a trot gait. |
| `limber-mules-*`, `padre-walk`, `casualty-cart-*` | **Staged** in `sim/battles/concepcion.mjs` from documented history: three of the six mules ride off with the infantry in `retreat` (`HIST-TEX-480`); the priest and two carts come down from the ford to the line in `main-army` (`HIST-TEX-481`, as civilians). Claude's `limber-mules-walk` is retired. The engine's dead and wounded are not carried off on the field. Whether the carts take them (moving the falls) is a gameplay decision. |
| `bexar-*-walk` (her four townsfolk) | **Not wired further.** The storming has drawn all four since 2026-10-11, and a woman of Béxar walking east or west in a town scene already gets her `bexar-woman-walk` by name. Giving her elder, older woman or child to the town scenes' Claude man, woman, girl and boy would change a person's face between walking and standing. Today's only Béxar town walkers walk south, and she drew no south walk. This waits for the batch 6 pilot (her stills) or a recasting decision. |
| `dragoon-fire` | **Wired** in the chase (`fireClip` in `public/chase-view.js`): her carbine shot from the saddle on the shot's own moment, north and south in her `dragoon-mounted-fire-*`. The page's flash and smoke stay, since her frames have none. The plan's "the gallop stays Claude's" was stale: Claude's gallop was retired on 2026-10-03, so the gallop is the library's `dragoon-march` (D2 stays open). |

The generated list now drops F1, E2, E3, E4, E6, C6, C16 and D12, and D2, D5 and D22 say what is wired.

---

## Batch 0: the road tiles, repainted with klein 4B

**Replaces:** the `ground-roads` sheet (`public/assets/frontier-v1/atlases/ground-roads.png`, 1536², four 516-px frames,
one to a clear 768 cell), painted with klein 9B on 2026-10-13. The sprite names, the sheet layout, `public/ground-texture.js`
and every place that draws a way are unchanged (`drawRoad`, `drawStreets`, `town-art.js` squares, `drawLandPaths`).
**Same prompts:** `scripts/road-art/textures.json`, with its colour targets and `keep` values. **The same finish:**
`scripts/road-art/finish.py` (CPU): flatten, roll, image-quilt seam, colour to target, 512, pack, 3×3 check. Nothing in
it changes but the candidate numbers in `textures.json`.

| Tile | Laid | Jobs | References | Notes |
| --- | --- | ---: | --- | --- |
| `road-tile-wagon` | along | 4 text-only (seeds 1-4) + 4 edits | edits: a 1024 crop of Astra's `biome-ground-bexar` sheet (her packed earth), for palette and brushwork | The ruts must run one way (vertical in the frame), so `along` stays true. Reject tyre-like zigzags in the ruts |
| `road-tile-street` | flat | 4 + 4 | as above | Reject any building, sign or object (the 9B street candidate had a building in its corner) |
| `road-tile-path` | along | 4 + 4 | a crop of her `grass-creek-terrain` or `norther-ground` grass | One trodden line down the middle |
| `road-tile-verge` | flat | 4 + 4 | as for the path | Even density, no focal tuft |

**Jobs:** 2 smoke + 32 = 34. **Choose:** one contact sheet of 32 (the 2026-10-13 review did the same). Run `finish.py`
on the four chosen. Check on the map at the students' zooms, against the 10-13 *after* pictures
(`docs/evidence/roads-after-*.png`). The new pictures are `roads-4b-*.png`.

**Also in this batch:**
- The delivery's `postProcessing` text (`scripts/art-deliveries/road-textures-2026-10-13.mjs`) describes the reference-edit
  seam repair, which was rejected. `finish.py` actually quilts. Correct the text when the tool string changes.
- Move the 9B raw paintings out of `docs/art-sources/ground-roads-2026-10-13/raw/`. They are not shipped, but the repo
  should not carry 9B pictures as the source of a shipped sheet. Delete them from the tree; git history keeps them.
  Replace them with `ground-roads-<date>/raw/` for the 4B set.
- Land `tests/art-licence.test.mjs` and `scripts/local-art/` (§0.2).
- If the 4B tiles are worse than the 9B ones at play size, the fallback is the old flat strokes (remove the sheet). They
  never go back to 9B.

### Batch 0 done (2026-10-26, branch `standins-1025`, not released)

Repainted with klein 4B ([ART_DELIVERY_2026-10-26-ROAD-TILES-4B.md](ART_DELIVERY_2026-10-26-ROAD-TILES-4B.md)): wagon s8, street s8,
path s1, verge s1 of eight candidates each (seeds 1-4 the bake-off's klein 4B reference edits, reused; 5-8 text alone). 16 GPU
jobs at ~4 s each. `generate.py` is on `tx_workflows`, the delivery's text says what `finish.py` does (quilting), the 9B raw
paintings are deleted from the tree, `tests/art-licence.test.mjs` passes and was proved by injection. Measured speed for the
summary: ~4-8 s a picture warm, so the table's estimates stand as upper bounds.

---

## Batch 1: the rider scenes' backdrops (request 2026-10-05, E40-E44) and the courtship yards (E19)

**Replaces:** the map's own ground laid back toward a painted sky, with the library's buildings, tents and trees set on it.
`stand-in:` comments are in `public/rider-scene.js` (lines ≈ 15, 37, 80, 85, 88, 157). Claude's
`courtship-yard-morning/-noon/-evening` come from `public/assets/claude-standins/`.

**Contract (from the request):** 960×540, a whole painting with no people and no text. It is drawn to cover the scene,
anchored at its foot. The horizon sits about a third down (`HORIZON = 0.33`), and people stand on a ground line at 56%
(`SCENE_GROUND`). The cast stands left of the middle, the rider just right of it, and the townspeople behind him on the
right. **Staging for all of them:** eye-level camera, slightly raised. Keep the band between 33% and 75% of the height,
from 15% to 75% across, free of anything tall in the foreground. Even, mild daylight with no sunset and no strong shadow,
because the page grades every backdrop for the hour (the night yard is the one exception). Signboards must be blank.
**Paint at** 1360×768 (both sides divisible by 16), then crop to 16:9 and downscale with Lanczos to 960×540.
**References for every one:** Astra's `public/assets/creation-title-landscape.png` (her painted Texas landscape: palette,
brushwork, oaks, a rutted road). Each item also gets the building or tree sheets of its own place, as below.
**Versions:** 8 each, with at most one repair. **Wiring:** `piecesOf` and `drawBackdrop` in `public/rider-scene.js` ask for
`scene-<place>` through `drawCover` (as `public/courtship.js` does for its yards), falling back to today's assembly. The
courtship yards are *asked for by name* already.

| Sprite | Place | Own references (Astra's frames) | Staging notes |
| --- | --- | --- | --- |
| `scene-street-texian` | An Anglo colonial town's street | `storehouse`, `cabin-wide` (`buildings`); `shop-blacksmith`; `shop-tavern` | Log stores and a smithy on the left, a tavern with a gallery on the right, a rail fence, the wagon track running away up the middle |
| `scene-street-tejano` | Béxar or Goliad | `jacal-broad`, `jacal-ramada` (`town-buildings-researched`); `town-mexican-river`; `church-generic` (`fortifications`) | Flat-roofed stone and adobe houses, a jacal, a church front at the end of the street. No named building is asserted |
| `scene-street-gonzales` | Gonzales, 1835, on its square by the river | `people-gonzales-*` background-free; `cabin-wide`; `gonzales-dugout-canoe` for the ferry road | Read the `HIST-GONZ-` places in HISTORY.md first: a few log houses, a store, the ferry road going down to the Guadalupe. Nothing HISTORY.md does not have |
| `scene-camp-volunteers` | The volunteers' camp | `tent` (`buildings`), `campfire` (`effects`), `camp-cookpot-tripod` (`field-cover-camp-props`), `post-oak-large` | Wagon-sheet tents and brush shelters in post oaks, a kettle over the fire, rifles stacked, horses on a picket line. No rows, no flag |
| `scene-road-prairie` | Open prairie | `creation-title-landscape` alone | A wagon road running to the horizon |
| `scene-road-woods` | Timber | `post-oak-large` (`trees-colonies-2`), `live-oak-large` (`trees-colonies-1`) | The same road through post oak and live oak |
| `scene-ford` | A creek ford | `cottonwood` (`nature`), `cypress-bald-large` (`biome-cypress-gale`) | The road going down a low bank to the water, cottonwoods and cypress on the far side |
| `scene-yard-night` | A farm yard at night | `creation-title-landscape` | The ground before a cabin door, with no house (the page draws the family's own). Stars, a rising moon, a little lamplight from the right. Painted at night, so the page's grade is light |
| `scene-alamo-plaza` | Inside the Alamo | `alamo-facades`, `alamo-interiors`, `alamo-modules`, `alamo-wall-corner`; docs/ALAMO_LAYOUT.md | The plaza, the long barrack, the church front beyond. The request also says "men on the walls", but the contract says no people. **Painted empty** (the page adds people). Owner decision 4 |
| `courtship-yard-morning/-noon/-evening` | A farm yard (E19) | `creation-title-landscape` | Trees behind, sky above, no people or buildings. One noon painting, with morning and evening made by reference edits of the chosen noon (3 + 2×4 jobs instead of 24) |

**Jobs:** 9 × 8 + 8 (noon yard) + 2 × 4 (its edits) + ≤12 repairs, about 100-108.

### Batch 1 done (2026-10-26, branch `standins-1025`, not released)

All twelve painted and wired ([ART_DELIVERY_2026-10-26-LOCAL-SCENES.md](ART_DELIVERY_2026-10-26-LOCAL-SCENES.md)): 88 GPU jobs (plus the
bake-off's four Gonzales streets), one repair round (the ford, flagged), colour moved toward Astra's landscape. `backdropOf` in
`public/rider-scene.js`; Claude's courtship yards retired; E19 and E40-E44 closed.

---

## Batch 2: the homestead

| Item | Replaces | Frames, size, anchor | References | Staging | Versions | Wiring |
| --- | --- | --- | --- | --- | ---: | --- |
| **Rear walls as high as the front** (request 2026-10-13) | Astra's `house-round-back-low-walls`/`-full-walls` and the hewn pair, 6 courses to the front's 7. The `ceiling:` is in `rearFit` | The same 4 frames, same cells, same footprint. The sills are unchanged | Her own frames only | **CPU, no model.** In each frame, mark the course boundary along both wall faces (a two-segment polyline parallel to the base edges). Copy one course band up by one course pitch, so the corner notches and log ends repeat as hers do. The door on the long side grows one course. Measured by `rearFit` afterwards | n/a; ≤1 low-strength klein 4B masked repaint per frame if a seam shows (≤4 jobs) | No code change: `rearFit` reads the new measures. Then delete the "seen from behind whole" rule and its `ceiling:`. Checks: `house-rear`, `house-roof` and `house-connected` tests, as the request says |
| `homestead-tent` (E30) | The library's new-canvas `tent` (`public/app.js` ≈ 1864, *asks by name*) | 1 frame, building contract: corner-on three-quarter, anchored at base centre | `tent` (`buildings`), `house-round-full-walls` (`house-modules`) for the view angle | A wagon sheet stretched over a ridge pole between two forked posts, pegged down at the sides, front open toward the lower left, a bedroll inside. Scale: the ridge at a man's chest | 8 | *asks by name* |
| `garden-beds`, `garden-beds-winter` (F35) | Rows of earth with green dots in a stroked rail (`drawGarden`, `public/app.js` ≈ 466, *asks by name*) | 1 each, ground piece seen from above at the map's scale, transparent | `gonzales-ploughed-earth`, `biome-trees-fields` | Four or five beds in rows, beans on poles, greens, a melon vine, a brush fence round them. The winter one is the chosen summer one, edited: mostly bare, turnips and collards | 8 + 4 | *asks by name* |
| `wash-kettle` ×2 frames, `wash-line` (E21) | Nothing: the washer bends over no tub | Props on their base, at the scale of the sprites beside them | `campfire`, `camp-cookpot-tripod`, `bucket` (`equipment`); `fence-rail` for the line | The kettle: iron, on three stones over a fire. Frame 2 is frame 1 edited with different steam. The line: shirts and a sheet over a rail fence | 4 + 2 + 4 | New: the wash work in `public/work-art.js` draws them beside the washer |
| `wood-pile-1..4` (A2) | `log-fallen` laid side by side (Claude's pile held back by subject) | 448×320 cell, drawn at 1.2 of a person, no taller than the waist | `log-fallen` (`nature`), `timber-felled` | Paint the 40-log pile, then edit it down to 30, 20 and 10 with the chosen 40-log pile as the reference, so all four are one pile | 8 + 3×4 | *asks by name* (`window.__woodPileSprite`) |

**Jobs:** ≤4 + 8 + 12 + 10 + 20 + ≤4 repairs = 58.

### Batch 2 done (2026-10-26, branch `standins-1025`, not released)

[ART_DELIVERY_2026-10-26-LOCAL-HOMESTEAD.md](ART_DELIVERY_2026-10-26-LOCAL-HOMESTEAD.md): all of it but the low rear walls (their
courses fan, so one lifted band broke the seams; left as she drew them). The rear full walls raised on the CPU, the rule deleted;
the tent, garden, kettle, line and piles painted (50 jobs) and keyed out on the CPU; A2, E21, E30, F35 closed.

---

## Batch 3: the hunter's first-person view (request 2026-10-02, F17)

**Replaces:** `paintField`, `paintNear` and `drawRifle` in `public/hunt-aim.js` (`stand-in:` at line ≈ 16): the sky,
timber, brush, prairie and rifle stroked in canvas. **Contract:** 6 backdrops at 1600×900, opaque, horizon at 51% of the
height, the middle third clear of trunks (the animals cross there), eye height, no animal. Plus `hunt-rifle`: transparent,
pivot at the muzzle. **Paint at** 1792×1008, downscaled to 1600×900.

| Sprite | References | Staging | Versions |
| --- | --- | --- | ---: |
| `hunt-field-timber` | `creation-title-landscape`; `post-oak-large`, `live-oak-large` | A clearing seen from its edge, trunks only in the outer thirds | 8 |
| `hunt-field-brush` | the same + her `mesquite-*` brush frames | Low brush and mesquite out to the horizon | 8 |
| `hunt-field-open` | `creation-title-landscape` | Prairie with a few far mottes | 8 |
| `-winter` of each | the chosen summer one | Edited: bare crowns, buff grass | 3 × 4 |
| `hunt-rifle` | the long rifle in her `icon-hunt-timber` (`icons-family-actions-1`) and her `volunteer-*` aim frames | The rifle from behind the right shoulder: stock and lock low at the right, the barrel running up and in, the front sight free. No hands (the page draws none) | 8 |

**Jobs:** 24 + 12 + 8 + ≤4 repairs = 48. **Wiring (new code):** `hunt-aim.js` draws the backdrop in its `back`
layer when the sprite has loaded. Its `near` layer, the trunks and grass in front of the animals, stays as canvas (the
painting is opaque, so it cannot be split into layers). `drawRifle` draws the sprite rotated about its muzzle pivot.
Proof: the hunt browser proof, with its existing pictures.

### Batch 3 done (2026-10-26, branch `standins-1025`, not released)

[ART_DELIVERY_2026-10-26-LOCAL-HUNT.md](ART_DELIVERY_2026-10-26-LOCAL-HUNT.md): six fields and the rifle, 52 jobs, one repair round
(the winters came back snowy). F17 closed.

---

## Batch 4: icons and marks the page now strokes

**Match Astra's sheets, not the 128-px contract number.** Her icons are about 300 px in a 4×4 sheet (`icons-family-actions-1`
is 1254² with ~300 px icons). Her marks are about 320 px (`family-panel-marks`). The game scales both down. **Paint**
each icon at 1024² on a flat cream background. Key the background out on the CPU (her icons have a dark outline), then
downscale to her icon size. Pack in her 4×4 grid. **References for every icon:** two of her icons nearest in subject,
cut out onto cream (for example `icon-build-house` and `icon-fence-plot`). **Versions:** 4 each (inserts).
**Check:** at 34-38 CSS px, and dimmed to 40%, on the panel. Marks at 22-24 px, and at 17-20 px where the contract says.
All are *asks by name* unless marked.

| Sprite | Replaces (`stand-in:` site) | Subject and staging |
| --- | --- | --- |
| `icon-more` | `drawMoreIcon`, `public/short-bar.js` ≈ 117; `public/app.js` ≈ 6904 | Three or four small tiles fanned out, with a hand reaching for them. Not a plus sign |
| `icon-go-inside` | `icon-build-house` (`public/family-panel.js` ≈ 185) | A cabin's open door with the hearth's light inside, a chair by it |
| `icon-join-seguin` | `icon-join-houston` | A Tejano horseman in a wide sombrero, lance upright in his right hand, riding left to right |
| `icon-pitch-tent` | `LITTLE_GLYPHS['pitch-tent']` (`family-panel.js` ≈ 208) | A wagon-sheet tent going up, a hand driving a peg with a mallet |
| `icon-keep-house`, `icon-work-garden`, `icon-wash-clothes` | stroked glyphs (F34) | A pot over the hearth fire; a hoe in a bed of young plants; a washtub with a shirt over its rim and the battling stick |
| `icon-milk-cow` | Claude's `icon-flee-cow` (B15) | A cow's flank and a pail beneath, a hand at the udder |
| `icon-fence-yard` | `icon-fence-plot` (B16) | A cabin's corner with a low rail fence round its dooryard |
| `icon-camp-cook`, `-wood`, `-bullets`, `-shelter`, `-buy`, `-hunt`, `icon-town-wages`, `icon-town-board` (F39) | the nearest library icons (`PANEL_ICONS`) | A pot over a fire; an axe in a log; a bullet mould and ladle; a brush lean-to; a sack and a coin; a rifle and a deer track; a sack on a shoulder and a coin; a bowl before a house |
| `mark-hunger`, `mark-food` (B13) | CSS masks (`.panel-hunger-mark`, `.food-icon`) | An empty bowl; a filled sack. **Wiring:** the CSS mask gives way to the sprite in `panelRow` and `paintLarder` |
| `mark-help` (F37) | inline SVG disc (`public/style.css`) | Two hands clasped, green |
| `mark-cue-house`, `mark-cue-wash` (F38) | the work's icon in a blue disc (`cueMark`) | A pot over the hearth; a washtub with a shirt |
| `mark-shelter-house`, `mark-shelter-tent` (F31) | CSS masks | A cabin roof with rain slanting past; the wagon-sheet tent with rain |

**Jobs:** 24 × 4 = 96. Sheets: `icons-family-local-1.png` and `-2.png`, plus `marks-local-1.png`.

### Batch 4 done (2026-10-26, branch `standins-1025`, not released)

[ART_DELIVERY_2026-10-26-LOCAL-ICONS.md](ART_DELIVERY_2026-10-26-LOCAL-ICONS.md): 24 painted and wired (marks through new
`public/painted-marks.js`), 104 jobs; two flagged after their one repair (the hoe, the deer track).

---

## Batch 5: Claude-drawn stand-ins in the places seen most

Claude's frames come from `public/assets/claude-standins/`. A pipeline frame of the same name in `frontier-v1` wins on its
own (`public/art.js`, `public/art-subjects.js`). Retire each Claude frame with `retire.mjs` in its area module.

| Sprites | Where seen | References | Versions |
| --- | --- | --- | ---: |
| 23 Claude icons: `icon-child-stick-horse`, `-doll`, `-tag`, `-hide`, `-cart`, `-hoop`, `-marbles`, `-hens`, `icon-flee-hide`, `-bundle`, `-cow`, `icon-road-lookout`, `-sing`, `-little-ones`, `icon-camp-fire`, `icon-ferry-help`, `icon-share-food`, `icon-ford-carry`, `icon-child-help`, `icon-ask-neighbours`, `icon-rest-road`, `icon-camp-apart`, `icon-nurse-home` | the family panel: children's play, the Scrape, sickness, the wedding | Her `icons-children` and `icons-family-*`, as batch 4. Claude's own icon is the subject sketch: what it shows, never how | 4 each |
| `mark-sick` | the panel's portraits | `family-panel-marks` | 4 |
| `farm-neighbour-porch`, `farm-neighbour-ramada` (E17) | the lone parent's wedding | `cabin-wide`, `jacal-ramada`, `house-porch` | 8 each |
| `grave-marker`, `coins-and-paper` (E20) | the homecoming | `home-table` (`home-furnishings`) for scale; `bucket` for the prop style | 4 each |

**Jobs:** 24 × 4 + 16 + 8 = 120, plus ≤8 repairs = 128. (`house-floor` and `house-loft` move to batch W, where Astra's
layers replace them.)

### Batch 5 done (2026-10-26, branch `standins-1025`, not released)

[ART_DELIVERY_2026-10-26-LOCAL-CLAUDE-ICONS.md](ART_DELIVERY_2026-10-26-LOCAL-CLAUDE-ICONS.md): 27 painted and wired, Claude's retired;
the stick horse not shipped (flagged). 132 jobs.

### The flags repainted (2026-10-27, branch `fixes-1027`, not released)

[ART_DELIVERY_2026-10-27-LOCAL-FIXES.md](ART_DELIVERY_2026-10-27-LOCAL-FIXES.md): the hoe, the deer tracks, the ferry, the hoop,
the stick horse, the cue and shelter marks and the ford, each painted over a drawn guide sketch. 68 jobs.

---

## Batch 6: pilot, editing Astra's own frames (go or no-go after 8 jobs)

A reference edit of one of her frames keeps its pose, its anchor and her line. Each frame is edited from its own
original, so a 4-frame cycle stays a cycle. This is the one route to animated subjects that might work, so it is
piloted before any of it is planned in full.

- **Pilot (8 jobs):** `mule-packed-grass-walk-e-1` with the grass load removed and a plain halter (4 versions), and
  `bexar-elder-walk-1` edited to standing still, facing the viewer, hands at his sides (4 versions).
- **Pass:** the load is gone with no leftover strap or ghost, the legs and hooves are where hers were, and the edited
  frame sits on her ground line. For the elder: one head, two hands, the same clothes and face, checked with
  `zoomsheet.py` and `facecheck.py --vs`.
- **If it passes**, the full batch:
  - the family's mule, plain: `mule-walk-e/s/n-1..4` and `mule-idle`, replacing Claude's (13 frames × 4);
  - the saddled mule, edited from the chosen plain frames (12 × 4);
  - Béxar townsfolk stills, `idle-s`, `speak` and `listen` for her four figures (12 frames × 4, though the man and boy
    that E1 asks for are not in her sheet, so they stay).
  That is ≤140 jobs. Each cycle is checked playing at speed in the art catalog before it is wired.
- **If it fails**, it stops there and is recorded under §3.

### Tool parts done, and the batch 6 pilot run (2026-10-26, branch `standins-1025`, not released)

**Tool parts:** [ART_DELIVERY_2026-10-26-LOCAL-TOOLS.md](ART_DELIVERY_2026-10-26-LOCAL-TOOLS.md), seven tools, 28 jobs, drawn in the
hoeing cycle's hands by `TOOL_PARTS`.

**Pilot, 8 jobs, report only (owner: do not go past it).** Picture: [evidence/batch6-pilot.jpg](evidence/batch6-pilot.jpg) (her frame,
then the four edits); numbers in `scripts/local-art/records/b6-2026-10-26.json`.
- **The mule: pass.** All four edits of `mule-packed-grass-walk-e-1` lose the grass load, its straps and the pack saddle with no
  ghost, take a plain rope halter, and keep her legs and hooves where they were (the lower third of her silhouette overlaps
  0.97-0.99) on her ground line to the pixel. The family's mule from her packed mule's frames looks feasible.
- **The elder: fail.** All four edits of `bexar-elder-walk-1` stand facing the viewer with one head and two hands in the same coat,
  hat and trousers, but the bundle he carries survives as a white cloth knotted at his chest (a leftover ghost), and his face,
  turned from profile to the front, is a new drawing rather than her line (facecheck nearest his own face in all four, 0.28-0.39,
  under the 0.40 floor). Stills of her townsfolk need a front-facing frame of hers to edit from, or her own drawing.
- **Not continued**, as the owner asked: the full batch (the plain and saddled mule, the townsfolk stills) waits for the owner.

---

## §3 Not suited to the pipeline, and what is proposed

| Stand-ins | Why not | Proposal |
| --- | --- | --- |
| The cast's and the family's work cycles: chop, notch, dig, split, reap, whittle, sew, wash, sweep, carry-water, fish, gather, beat-wash, count, raise-log, fire-reload, the wedding's greet, shy, laugh and vow, and the family's missing poses (A1-A17, A19, A24-A26, A31-A35, C1, C22) | 2-4 frames that must keep one face, costume and grip. The family is now Astra's semantic rig (tinted body and head layers on sockets), which painted frames cannot join | Keep the drawn-tool stand-ins. **Paint the tools instead** as parts (method step 3): a felling axe, a maul, a spade, a broom, a pair of pails, a cane pole and a battling stick. Each is transparent with a grip point, 4 versions, about 28 jobs in all. `drawHaftTool` and the stroked tools in `public/work-art.js` then draw the sprite at the hand instead of strokes. Proposed as a later batch, if the owner wants it |
| Children's play and the Scrape's work (B1-B3, B6, B17-B19), the baby | as above, children's figures | Unchanged, Claude's or the rig's |
| Animal cycles with no Astra original to edit: the longhorn coats walking, the calf, the piglet (F32) | 4-frame cycles | The coats are a CPU recolour of her `cow-walk`/longhorn frames. The calf and piglet stay scaled down |
| Mounted animation: the dragoon's gallop (D2), the herder on horseback (D30), the mule riders | the rider and the horse must agree in every frame | Keep Claude's. Her dragoon's fire frames are wired in batch W |
| Effects: `flies-buzz`, `farm-smoke-rise`, `tree-fall`, ripples, shavings, earth toss | small looping animations, already good in code | Keep the code |
| Famous people, the Esparza family, the priest and the land agent (area C, A26, A27) | named or role likenesses, with identity across poses (docs/BATTLES.md §2c, §14) | Keep Astra's or Claude's |
| Darker tones, layered masks, Tejano dress (A18, A22, A23) | rig tinting work, not painting | Unchanged (`public/person-palette.js`) |
| `ground-path-bend` (B16) | a bend of a seamless tile needs both of its edges to match | Keep the path tile turned along the way |

---

## Decisions for the owner

**Decided by the owner, 2026-10-25:**

- **Order:** batch W first, then 0 → 1 → 2 → 3 → 4 → 5, **plus a batch of painted tool parts** for the animation cycles
  (the felling axe, maul, spade, broom and the others in §3), and **batch 6 only as its 8-job pilot**.
- **Pipeline art counts as finished art.** It lives in `frontier-v1`, closes its request and retires the stand-in. If Astra
  later draws the same subject, her drawing wins.
- **The Alamo plaza backdrop is painted empty.** The page draws the men.
- **The text encoder:** the 7.49 GB `qwen_3_4b.safetensors` may be downloaded only if the on-disk fp8-mixed one fails the
  first klein 4B smoke test.
- **The road tiles:** the 9B tiles stay in place until batch 0 replaces them ("repaint first").

The questions below were asked before those answers and are kept for the record.

1. **Approve the batches and their order:** batch W now (no GPU), then 0 → 1 → 2 → 3 → 4 → 5, and batch 6 only as a pilot.
2. **What pipeline art counts as.** Recommended: it lives in `frontier-v1` like the road tiles, closes its request, and
   retires the stand-in and Claude's frame. Astra's own drawing of a subject still wins if she ever makes one. The
   alternative is to keep it marked temporary on her list, as Claude's art is.
3. **The road tiles that ship now.** They are klein 9B output in released v2026.10.13.1. Should they come out
   immediately? Removing `ground-roads.png` brings back the old flat strokes, which needs no GPU. Or should they stay
   until batch 0 replaces them?
4. **The Alamo plaza backdrop:** paint it empty, as the contract says, with the page adding the men on the walls
   (recommended), or paint the men in as the request's text says?
5. **The text encoder fallback.** If the smoke job shows klein 4B will not run with the on-disk fp8-mixed Qwen3-4B, may
   the 7.49 GB `qwen_3_4b.safetensors` be downloaded (Comfy-Org, Apache-2.0)? Also: should the painted tool parts in §3
   be added as a batch?

# Art model bake-off, 2026-10-25: FLUX.2 klein 4B against HiDream-O1

**Status: done; the owner picks the winner before batch 0 or batch 1 runs.** Nothing here is wired into the game, and the
shipped road tiles (`ground-roads.png`, klein 9B, 2026-10-13) are untouched. Branch `standins-1025`.

Two commercial-safe models ([ART_TOOLS.md](ART_TOOLS.md)) painted the same jobs: the same prompts, the same reference
images and the same four seeds (1-4), each at its own recommended settings.

| | Model | Licence | Settings |
| --- | --- | --- | --- |
| **A** | FLUX.2 klein 4B fp8 + Qwen3-4B fp8-mixed encoder + FLUX.2 VAE | Apache-2.0 | reference edit (ReferenceLatent), 4 steps, CFG 1, euler; 1024² tiles, 1360×768 backdrop |
| **B** | HiDream-O1-Image full, fp8_scaled (one checkpoint) | MIT | ComfyUI's template: ModelNoiseScale 8, patch-seam smoothing, 40 steps, CFG 5, dpmpp_2m_sde_gpu, `HiDreamO1ReferenceImages`; 2048² tiles, 2560×1440 backdrop (its trained ~4 MP sizes). Gemma prompt-refine off |

**Evidence:** [bakeoff-roads.png](evidence/bakeoff-roads.png) and [bakeoff-backdrop.png](evidence/bakeoff-backdrop.png), each
model's best two, labelled. Every job's time and memory: [art-sources/bakeoff-2026-10-25/jobs.json](art-sources/bakeoff-2026-10-25/jobs.json);
the picks shown: [picks.json](art-sources/bakeoff-2026-10-25/picks.json). The 40 raw paintings are kept out of the repo, in
the git-ignored `output/bakeoff-2026-10-25/raw/` of this worktree; `scripts/local-art/bakeoff_2026_10_25.py` remakes the
references, rows and sheets.

## Recommendation: A, FLUX.2 klein 4B

- **It does what the contract asks.** Its tiles are ground only, edge to edge; its ruts and trodden line run down the
  frame as asked, and every one tiles cleanly through `finish.py`. Its backdrops are empty, daylit streets with the
  street up the middle and Astra's own building designs (her storehouse, cabin and open smithy) recognisable in them.
- **B does not.** It treats the references as a picture to rebuild rather than a palette: it painted Astra's creek
  pieces back in a 2×2 grid as a "verge", her wagon and family into a backdrop that must have no people, and the game
  ground's green as bands down both sides of every wagon road. Asked for a street *surface*, it painted an aerial view
  of a town with buildings in all four candidates.
- **About 23 times faster** (8.4 s against 191 s a picture, warm) with less memory. Batches 0-5 (~480 jobs) are about
  70 minutes of GPU on A and about 26 hours on B.
- **Where B is better:** its backdrop colour and brushwork sit closer to Astra's oil-painted landscape
  (`creation-title-landscape.png`) than A's pale ink-and-wash. A's backdrops are lighter and more line-drawn than hers.
  If that matters at play size, the cheap fix is on the CPU: colour-match A's backdrop to her landscape
  (the toolkit's `colormatch.py`), not a 23× slower model. B could be kept for a one-off backdrop where richness matters
  and its picture is checked for copied references; it is not recommended as the batch painter.

## Measured (RTX 4080, through the lease)

| | A klein 4B | B HiDream-O1 |
| --- | --- | --- |
| Jobs / failed jobs | 20 / 0 | 20 / 0 |
| Seconds a picture, warm (median) | **8.4** (8.3-9.5, tiles and backdrop alike) | **190.8** at 2048² (186.8-199.6); **269.7** at 2560×1440 (257.3-280.3, one of 538.1) |
| First jobs of a lease (loading) | smoke 37.1; the main lease's first three 88.1, 73.1, 14.7 | smoke 464.5 (right behind another project's job); each later lease's first 187-259, no slower than warm |
| Card memory, peak (whole card) | 11.9-13.0 GB | 13.7-14.1 GB at 2048²; 14.0-14.8 GB at 2560×1440 |
| Licence check (`licence_check.py`, from each PNG) | 20 / 20 allowed | 20 / 20 allowed |
| Pictures with a hard fault (my review, the quality bar) | 0 of 20 (1 more dropped by the inspector, below) | 10 of 20: street 4/4 (buildings), verge 4/4 (Astra's creek pieces copied, or a road instead of a verge), backdrop 2/4 (s2 copies Astra's wagon and family: people; s4 nonsense cone-shaped objects in the trees) |
| Softer faults | wagon s1 and s4: stick-like objects in the ruts | wagon 4/4 and path s3: the ground reference's green (or black) copied as bands down the sides |

Card memory is nvidia-smi's used memory for the whole 4080, sampled every 0.25 s while each job ran (`paint.py`); the
desktop alone held 0.8-1.1 GB. ComfyUI kept A's model, encoder and VAE all resident. The plan's guess for A
(~12 s a job, ~2 min to load) is now 8.4 s and under 1.5 min.

**GPU jobs run:** 40 paintings (2 smoke jobs, one per model, then 38) in 7 leases (the two smoke jobs in one, A's other 19 in one, B's
one a row so other projects could get in between), then the toolkit's `cull.py` on A's tiles (precheck + inspector, 1 lease) and A's
backdrops (precheck only). The rest of the filter, the inspector on A's backdrops and the whole filter on B's pictures,
was **stopped, not run**: the owner started a game during it (arbiter tier `gaming` at 21:46), and the inspector holds the queue's lock while it waits
out a game, which blocked another project. My own review of every candidate stands in for it here, since the inspector
only breaks ties. To finish it: `python E:/VN-Tools/asset-toolkit/cull.py output/bakeoff-2026-10-25/cull/<model>-<roads|scene> --expect "people=0" [--no-pose]`.

**Filter results so far:** A's 16 tiles: 15 kept, `street-earth s4` dropped by the inspector for "watermark-like text"
(not verified; not a pick). Its weaknesses were "repetitive pattern", which a seamless tile is. A's 4 backdrops: no
precheck flags (no people, no text).

## Test 1: the four road tiles (batch 0)

- **Prompts:** for each tile, `scripts/road-art/textures.json`'s subject and its shared style, with this before it:
  *"Use the reference images only for their colour palette and hand-painted brushwork, not for their shapes, layout or
  objects. Paint a new picture:"*. The two tiles laid along a way also got: wagon *"Two parallel wheel ruts run straight
  down the frame from the top edge to the bottom edge."*; path *"The trodden line runs straight down the middle of the
  frame from the top edge to the bottom edge."* (plan, batch 0: "the ruts must run one way").
- **References (Astra's and the game's, nothing painted by 9B):** wagon and street: `ref-astra-earth` (her four
  path-and-bank pieces from `grass-creek-terrain`, 2×2 on the map's ground colour) and `ref-game-ground` (the map's ground
  with her tufts, cropped from `docs/evidence/roads-before-land.png`, which predates the 9B tiles). Path and verge:
  `ref-astra-grass` (her grassy creek pieces from `concepcion-bank-terrain`) and `ref-game-ground`. The plan named
  `biome-ground-bexar` for the earth, but that sheet is her Béxar plants, not ground, so her earth pieces were used.
- **Finish:** each candidate through `finish.py`'s own `seamless` and `colour` (flatten, roll, quilted seam, colour to
  the tile's target), unchanged; B's 2048² scaled to 1024 first. The sheet shows each pick as painted and as a 3×3 repeat.
- **Picks shown:** A wagon s2, s3; street s1, s2; path s2, s1; verge s1, s3. B wagon s3, s4; street s3, s4; path s2, s4;
  verge s1, s3 (B's least bad; its street and verge picks all carry the faults above, shown so the owner sees them).
- **A against the quality bar and Astra:** no hard fault in the picks. They are plainer and more cartoon-like than
  her painted ground: the street's hoofprints are stamped motifs, the verge is a scatter of yucca-like tufts. After
  the seam-stitch all four read as even ground with no seams at the 3×3. Whether they beat the shipped 9B tiles at the
  students' zoom is the play-size check batch 0 already plans (`roads-4b-*.png`), not done here.
- **B:** richer brushwork, but none of its street or verge candidates is a usable tile, and its wagon roads carry the
  side bands into the repeat as stripes.

## Test 2: one rider-scene backdrop (batch 1): `scene-street-gonzales`

Chosen as the most-seen street: Gonzales is the core town of the active phase, and the home yard has no daytime backdrop
in batch 1 (its yard is drawn from the family's own house). The prompt keeps to HISTORY.md (`HIST-GONZ-007`, `-011`: a small
town of log buildings on the east bank of the Guadalupe; no square is asserted).

- **Prompt (both models):** *"Image 1 is the style reference: match its palette, its detailed hand-painted brushwork and
  the look of its oaks, grass and rutted road, but paint even midday light instead of its sunset. Image 2 shows the kind
  of buildings: small log houses, a log store, an open smithy shed. Paint a new wide landscape picture: the main street of
  Gonzales, a small Anglo-American colonial town in Mexican Texas in 1835, on the east bank of the Guadalupe River, seen
  from eye level with the camera slightly raised. A wide rutted dirt wagon street runs away from the viewer up the middle
  of the picture toward the river. A few single-storey log cabins with shake roofs and stick-and-clay chimneys, a log
  store with a plank porch, and an open-sided blacksmith shed stand well apart along both sides of the street, set back
  behind split-rail fences, with post oaks and live oaks between them. Beyond the far end of the street the road goes down
  to the river, lined with tall pecans and cottonwoods. The horizon sits one third of the way down the picture, under a
  wide summer sky with soft white clouds. The middle of the picture and the near foreground are open, empty street and
  grass with nothing tall in them. Even, mild daylight with soft short shadows, no sunset. Hand-painted storybook game
  art: warm detailed gouache and oil brushwork, muted warm earth palette. No people, no animals, no wagons, no lettering
  on any building, no text, no signature, no watermark."*
- **References:** Astra's `creation-title-landscape.png` (1344×756) and her four Gonzales street buildings
  (`storehouse`, `cabin-wide`, `shop-blacksmith`, `shop-carpenter`, the row `public/rider-scene.js` draws today) on a pale
  ground.
- **Cut:** cropped to 16:9 about the middle and Lanczos-scaled to the contract's 960×540.
- **Picks shown:** A s1, s3; B s1, s3.
- **A:** all four usable. Clean, daylit, the street up the middle, open middle band, her building designs. Paler and more
  line-drawn than her landscape; a prickly pear and boulders in the near corners. The horizon sits nearer 40% than 33%.
- **B:** s1 and s3 usable, closer to her palette and painterly weight, fences running in from both near corners; s3 has
  an odd reddish bush. s2 (her wagon and family copied in) and s4 (cone objects in the trees) fail.

## What was built (kept for the batches)

- `scripts/local-art/tx_workflows.py`: the only workflows a Texas job may run. `build('klein4b' | 'hidream-o1', ...)`;
  anything else raises `Refused`. `assert_allowed` whitelists each loader and its file and refuses any other loader
  (GGUF, LoRA ...) and the template's Gemma prompt rewriter. **Change from plan §0.2:** Z-Image Turbo does not pass
  through; the owner's bake-off brief says a Texas job selects A or B. Re-adding it is one entry if the owner wants it.
- `scripts/local-art/licence_check.py <png|folder>`: reads each PNG's embedded workflow and refuses anything else or a
  PNG with none. Proved both ways: 40/40 bake-off pictures allowed; the four 2026-10-13 road paintings in
  `docs/art-sources/ground-roads-2026-10-13/raw/` refused from their own files (UnetLoaderGGUF, the 8B encoder), and
  Astra's `creation-title-landscape.png` refused (no workflow).
- `scripts/local-art/paint.py <rows.json> --out <dir> [--only rows]`: the plan's Texas painter, with per-job seconds and
  card memory in `_jobs.json`; failed jobs are recorded and the run goes on; resumable.
- `scripts/local-art/bakeoff_2026_10_25.py`: this bake-off's references, rows, review sheets and the two side-by-side sheets.
- [ART_TOOLS.md](ART_TOOLS.md): HiDream-O1's row (bytes and sha256 rechecked on disk), and the builder rule.
- The klein 4B smoke job passed with the on-disk `qwen_3_4b_fp8_mixed` encoder, so the 7.49 GB `qwen_3_4b.safetensors`
  was **not** downloaded.

Not done here (plan, batch 0): `tests/art-licence.test.mjs`, `generate.py`'s switch to `tx_workflows`, moving the 9B raw
paintings out, and the play-size check.

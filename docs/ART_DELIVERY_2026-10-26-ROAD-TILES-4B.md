# Delivery 2026-10-26: the road tiles repainted with FLUX.2 klein 4B (batch 0)

**Status: wired, branch `standins-1025`, not released.** Batch 0 of [ART_PLAN_LOCAL_2026-10-25.md](ART_PLAN_LOCAL_2026-10-25.md).
The four road tiles shipped in v2026.10.13.1 were painted with FLUX.2 klein 9B, whose licence (FLUX Non-Commercial v2.1)
does not allow a game that may be sold. They are repainted here with FLUX.2 klein 4B fp8 (Apache-2.0), the owner's pick of
2026-10-26 after the [bake-off](ART_BAKEOFF_2026-10-25.md). Same sprite names, same sheet (`ground-roads`, four 512-px tiles one
to a clear 768 cell), same wiring (`public/ground-texture.js`), same finish (`scripts/road-art/finish.py`); only the paintings
and the candidate numbers in `scripts/road-art/textures.json` changed.

## How they were painted

- **Builder:** `scripts/road-art/generate.py`, now on `scripts/local-art/tx_workflows.py` (klein 4B only; it refuses klein 9B,
  any GGUF, any LoRA, and since today HiDream-O1 too), through the shared toolkit's lease (`comfy.py`), 1024², 4 steps, CFG 1.
- **Candidates, eight a tile:** seeds 1-4 are reference edits of Astra's own ground pieces (her `grass-creek-terrain` earth for
  the road and street, her `concepcion-bank-terrain` grass for the path and verge) and the map's own ground before any tile,
  for palette and brushwork only. These are the bake-off's own klein 4B paintings: same model, prompt, references and seeds,
  so they were copied in rather than repainted. Seeds 5-8 are text alone, painted today. Nothing painted by klein 9B was a
  reference.
- **Licence, from each file:** `scripts/local-art/licence_check.py` read the workflow inside all 32 candidates: 32 allowed,
  0 refused. The four chosen are kept in [art-sources/ground-roads-2026-10-26/raw/](art-sources/ground-roads-2026-10-26/raw/);
  the 2026-10-13 klein 9B paintings were deleted from the tree (git history keeps them).
- **GPU:** 16 jobs, 12:18:09-12:19:15, about 4 s each, on the RTX 4060 Ti (the arbiter's Parsec tier kept the owner's stream on
  the 4080; ComfyUI was already on the 4060 Ti for another project, and a light job stays where ComfyUI is). The lease waited
  90 minutes in the shared queue behind another project's long upscale. No job moved cards.

## The picks (contact sheet: [contact-candidates.jpg](art-sources/ground-roads-2026-10-26/contact-candidates.jpg))

| Tile | Pick | Why, and what was refused |
| --- | --- | --- |
| `road-tile-wagon` | s8 (text) | Two clean ruts straight down the frame, cracks and grit. Refused: s2 and s3, tyre-like zigzags in the ruts (the plan's own refusal); s1 and s4, stick-like objects in the ruts |
| `road-tile-street` | s8 (text) | Boot and bare-foot prints, grit and straw, even. Refused: s1-s4, prints like clawed paws; s5 and s6, a dark vignette at the edges |
| `road-tile-path` | s1 (edit) | One pale trodden band down the middle, short grass either side. s8's line is a dark crease |
| `road-tile-verge` | s1 (edit) | Even density, no focal tuft. Refused: s2, s4, s5, s6, s8, a path or stripes through them |

No hard fault (text, signature, object, building) in any pick. After `finish.py` all four repeat with no seam
([tiling-3x3.jpg](art-sources/ground-roads-2026-10-26/tiling-3x3.jpg)).

## At play size

[evidence/roads-4b-compare.png](evidence/roads-4b-compare.png) (`scripts/local-art/roads-compare.mjs`, headless Chrome, the
game's own `drawRoad`, `drawStreets` and `paveWay` on the map's ground): the klein 9B tiles beside the klein 4B tiles at the
map's 20 px road, a town's 24 px streets and 46 px road, and a family's 14 px path. They read the same; the new street is a
little smoother. The plan's fallback (the flat strokes) was not needed.

## Checks

- `tests/art-licence.test.mjs` (new): every ComfyUI entry in `docs/art-provenance.json` and `docs/art-prompts.json` names
  klein 4B fp8 (Apache-2.0) and nothing non-commercial. Proved by injection: the 9B tool string put back in the provenance
  record fails that test alone; removed.
- `tests/ground-texture.test.mjs` unchanged and passing: the sheet's layout and names did not move.

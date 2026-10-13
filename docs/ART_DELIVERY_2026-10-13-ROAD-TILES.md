# Road, street and path tiles — 2026-10-13

Owner, 2026-10-13: *"use our new image generation setup to improve roads."* The first art in `frontier-v1` painted with the
owner's local pipeline rather than by Astra: ComfyUI with FLUX.2 klein 9B (Q8_0 GGUF) on this computer, each GPU job through
the shared toolkit's lease (`E:/VN-Tools/asset-toolkit/comfy.py`).

`ground-roads.png` (1536 × 1536, 1.95 MB; one 512 tile in the middle of each clear 768 cell) carries four seamless tiles:

| Frame | Laid | What it is | From |
| --- | --- | --- | --- |
| `road-tile-wagon` | along the road | a dry rutted wagon road: two wheel ruts, hoof-scuffed tan earth, grit, cracks, wisps of straw | seed 1 of 4 |
| `road-tile-street` | flat | a town's trodden packed-earth street: faint footprints and hoofprints, grit, a few stones | seed 4 of 4, its corner (a building) cropped off |
| `road-tile-path` | along the path | a foot path trodden through prairie: a worn line down the middle, short grass either side | seed 1 of 4 |
| `road-tile-verge` | flat | the worn grass verge beside a road: short sage and olive grass with bare earth through it | seed 2 of 4 |

**How they were made.** `scripts/road-art/generate.py` painted four candidates of each (text to image, 1024², 4 steps, CFG 1;
16 jobs) from the prompts in `scripts/road-art/textures.json`, which `docs/art-prompts.json` (`frontier-v1/ground-roads`)
copies. The candidates were judged on one contact sheet
([art-sources/ground-roads-2026-10-13/contact-candidates.jpg](art-sources/ground-roads-2026-10-13/contact-candidates.jpg)): the road
and path candidates all ran their ruts or trodden line one way, so those two are laid along the way rather than as a flat
pattern. `scripts/road-art/finish.py` then made each seamless from its own pixels - broad tone flattened, rolled half its size,
the seam covered by a band cut from the same painting along the line of least difference (image quilting) - moved its mean
to the roads' own colours, halved it to 512 and packed the sheet. It is deterministic: the four chosen paintings, kept as
generated in [art-sources/ground-roads-2026-10-13/raw/](art-sources/ground-roads-2026-10-13/raw/), make this sheet byte for
byte. The 3×3 repeat check is
[art-sources/ground-roads-2026-10-13/tiling-3x3.jpg](art-sources/ground-roads-2026-10-13/tiling-3x3.jpg).

**Tried and rejected.** Healing each seam with a FLUX.2 klein reference edit of the rolled tile (8 jobs, then 8 more): shown
the seam the edit kept the line, and shown it blurred it kept the blur. Both prompts are recorded (`rejectedSeamRepaints`).
32 GPU jobs in all (16 candidates, 16 rejected seam repaints), one batch at a time through the lease.

**Review.** No text, signatures, people, animals or objects in the chosen tiles; no modern tyre marks read at any size the
game draws them (the zigzag inside the wagon ruts is about a pixel across at the widest road the map draws). Seen on the map at the zooms students use:
[before](evidence/roads-before-map.png) / [after](evidence/roads-after-map.png),
[town before](evidence/roads-before-town-close.png) / [after](evidence/roads-after-town-close.png),
[land before](evidence/roads-before-land.png) / [after](evidence/roads-after-land.png).

**Drawn by** `public/ground-texture.js` (docs/LANDSCAPE_ART.md, *Painted road tiles*): `drawRoad` and `drawStreets` in
`public/landscape-art.js`, the squares in `public/town-art.js`, the paths and the yard in `public/app.js` `drawLandPaths`.
Without the sheet every way is drawn in its old flat strokes. The tiles change how a way looks, never where it runs.

**Still open for Astra.** Request 2026-10-02 item 3 (`ground-path-straight`, `ground-path-bend`) stays on her list; the path is
now this painted tile rather than a stroked line.

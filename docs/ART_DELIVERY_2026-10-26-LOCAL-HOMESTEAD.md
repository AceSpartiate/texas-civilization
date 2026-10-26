# Delivery 2026-10-26: the homestead (batch 2, FLUX.2 klein 4B and the CPU)

**Status: wired, branch `standins-1025`, not released.** Batch 2 of [ART_PLAN_LOCAL_2026-10-25.md](ART_PLAN_LOCAL_2026-10-25.md).
Pipeline art counts as finished art (owner, 2026-10-25): the requests are closed, Claude's wood pile is retired, and Astra's own
drawing of any of these would still win.

## What is drawn where

| Sprite | Request | Shown | Pick |
| --- | --- | --- | --- |
| `homestead-tent` | 2026-10-02, the tent, item 1 (E30) | the family's tent until the house has a roof (`drawTent`, asked by name) | s4 of 8 |
| `garden-beds`, `garden-beds-winter` | 2026-10-03, item 8 (F35) | the kitchen garden by the house (`drawGarden`): drawn as wide as the stroked rows were, its foot a little below their middle | s5 of 8; s2 of 4 edits of it |
| `wash-kettle-1`, `-2`, `wash-line` | 2026-10-03, item 10 (E21) | **new**: beside the washer (`drawWashProps`, public/work-art.js): the kettle while the wash is scrubbed or beaten, its steam turning; the line behind her while it is hung | s2 of 4; s2 of 2 edits; s2 of 4 |
| `wood-pile-1` to `-4` | 2026-09-28, people at work, item 16 (A2) | the family's pile by the house, one sprite for every ten logs (`drawWoodPile`, asked by name) | the forty-log pile s8 of 8; thirty s1, twenty s4, ten s3 of 4 edits each |
| `house-round-back-full-walls`, `house-hewn-back-full-walls` | 2026-10-13, the rear walls as high as the front | a pen seen from behind | her own pixels, raised on the CPU |

The winter beds, the kettle's second frame and the three smaller piles are reference edits of the chosen summer beds, kettle and
forty-log pile, so each set is one thing. The kettle's two frames and the four piles are cut at one scale each, and the atlas
build gives each set one logical height (its tallest), so the steam never shrinks the kettle and a smaller pile is drawn smaller.

## The rear walls (no model)

`scripts/local-art/rear_courses.py`: in each of her rear full-wall frames a line is found along one dark seam between courses across
both near faces (parallel to the frame's own ground edges); everything above it - the higher courses, the open top, the far walls
inside and their corner ends - is lifted by one course pitch (measured: 19 px round, 18 px hewn), and the gap filled with a copy of
the course below the line. The corner notches and log ends repeat as hers do, and the door on the long side grows by the course it
is cut through; everything below the line is untouched. Round: one course; hewn: two of its thinner courses. From the ground's
middle to the wall-top seat, in front-sheet pixels: round 117 against the front's 116 (was 99), hewn 130 against 125 (was 97).

So the "seen from behind whole" rule in `drawHousePlot` and its `ceiling:` in `rearFit` are deleted: a dog-run or saddlebag takes
the rear only for the pen with the chimney against its door's gable, and the other pen shows its front. **Not done:** her round low
walls. Their courses fan (19 px at the far corner, 24 at the near), so one lifted band left a broken seam across both faces (tried,
`output/.../rear-courses.png`); the low and sill frames stay as she drew them while a pen goes up (`ceiling:` in rear_courses.py).
Minor craft marks kept: a one-pixel tick on the round rear's door post and two pale specks in the hewn door opening where the band
was cut through them.

## How they were painted

- On a flat pale grey ground in Astra's style, each from a board of her own frames (`tent` and `house-round-full-walls`;
  `gonzales-ploughed-earth` and `corn-young`; `campfire`, `camp-cookpot-tripod`, `bucket`; `fence-rail`; `log-fallen`), 1024²;
  prompts, references, seeds and picks in `scripts/local-art/records/b2-2026-10-26.json`.
- **The ground keyed out on the CPU** (`key_out`): a flood fill from the picture's edges over the ground's own grey and any grey
  shadow cast on it, stopping at her dark outline, so a white shirt or a grey stone inside is never cut; the plain ground inside the
  kettle's bail too. (A first try that also keyed every pixel of the ground's grey anywhere punched holes in the tent's canvas and
  the shirts; it is used only for the kettle.)
- **Licence, from each file:** 50 of 50 candidates allowed. **GPU:** 50 jobs, 507 s; 24 on the RTX 4060 Ti during the owner's game
  (13:37-13:40, ComfyUI already there), the rest on the 4080 after it; no job interrupted or moved mid-job.

## Review and proofs

Contact sheets keyed on a mid green-grey ([contact.jpg](art-sources/homestead-local-2026-10-26/contact.jpg),
[contact-edits.jpg](art-sources/homestead-local-2026-10-26/contact-edits.jpg)); picks looked at full size: no text, no stray
object; the winter beds keep a little snow on the fence. `npm run test:yard-layout` passes before and after: tent, garden and
woodpile each drawn inside its own footprint, none over another, the house or a way. Before and after in the game and the
two-pen houses at every turn: [evidence/homestead-local-compare.png](evidence/homestead-local-compare.png).

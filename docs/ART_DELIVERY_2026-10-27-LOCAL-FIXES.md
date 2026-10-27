# Delivery 2026-10-27: the flagged icons, marks and ford repainted from drawn guides (FLUX.2 klein 4B)

**Status: wired, branch `fixes-1027`, not released.** The flags left by batches 1, 4 and 5 of
[ART_PLAN_LOCAL_2026-10-25.md](ART_PLAN_LOCAL_2026-10-25.md) (owner, 2026-10-27: "fix the flagged icons and the ford backdrop"),
painted with the owner's local pipeline on FLUX.2 klein 4B fp8 (Apache-2.0). Pipeline art counts as finished art (owner, 2026-10-25).

## Why the first rounds failed, and what changed

Words alone lost to the model's habits: told "a hoe, not a spade" it painted a spade; told "split-hoof deer prints" it painted paw
prints; a stick horse came back a real horse every time. The marks failed differently: a wide rim round a small picture, which did
not read at 20 px. This round each item is a **reference edit of a drawn guide**: `scripts/local-art/fixes_2026_10_27.py` draws a
flat sketch on the CPU (PIL) that pins each object's shape, place and size (a hoe's blade across the foot of its handle; two cloven
prints; a pole with only a carved head; a hoop whose top is at the girl's waist; a thin-rimmed badge filled by its picture; the
road straight down the bank, across a pale shallow band of the creek and up the far bank). Image 1 is the sketch, image 2 the board
of Astra's nearest icons (style only), or her oil landscape for the ford. 4 steps, CFG 1.

## What is drawn where

| Sprite | Was | Now | Sheet (cell) |
| --- | --- | --- | --- |
| `icon-work-garden` | a spade | a hoe, its broad blade across the handle, in a bed of young plants (s5) | `icons-family-local-1` (5) |
| `icon-camp-hunt` | paw prints | a flintlock over two cloven deer tracks (s4) | `icons-family-local-1` (14) |
| `icon-ferry-help` | hands on a rope | a man carrying a sack onto a flat ferry under its rope (s4) | `icons-family-local-3` (14) |
| `icon-child-hoop` | a hoop taller than the girl | a hoop no higher than her waist, driven with a stick (s2) | `icons-family-local-3` (4) |
| `icon-child-stick-horse` | Claude's (the pipeline's was a real horse) | a boy astride a pole with a carved head (s4); Claude's retired | **new** `icons-family-local-5` |
| `mark-cue-house`, `mark-cue-wash` | unused (did not read at 20 px) | drawn in the cue (`CUE_MARKS`, public/painted-marks.js) (s1, s1) | `marks-local-1` (0, 1) |
| `mark-shelter-house`, `mark-shelter-tent` | unused | handed to the style sheet (`PAINTED_MARKS`) for `data-at=house` and `=tent`; the wagon and the open keep the drawn tent (s4, s1) | `marks-local-1` (2, 3) |
| `scene-ford` | the road meets a gravel bar | the road crosses the creek through a shallow rippled band (s3) | `scenes-local-2` (2) |

`mark-food` was **not** repainted: it is a 14 px mask tinted by the food level, and a painting would hide that colour.

The delivery modules name these in `redone` (scripts/local-art/delivery.mjs reads their rows from
`scripts/local-art/records/fix-2026-10-27.json`); the sheets, names and wiring of every other sprite are unchanged.

## How they were painted

68 jobs, 378 s on the RTX 4080, one lease (queued behind another project's job first). Icons and marks painted at 1024² on the
sketch's cream ground, keyed out (`key_out`; the hoop, the stick horse and the ferry also keyed where they enclose the ground,
`HOLES`), fitted to 300 px (marks 320) in a 384 cell. The ford at 1360x768, cut to 960x540 and moved toward Astra's landscape as
batch 1 was. **Licence:** 68 of 68 candidates allowed from their own files (`licence_check.py`). Sources, sketches, contact
sheets and the chosen raws: `docs/art-sources/fixes-local-2026-10-27/`.

## Review

Keyed contact sheets, the picks at full size, and the marks at 20 px. **Refused:** a hunt candidate with two rifle stocks (s1);
the first contact sheet showed the sketch's cream inside the hoop, beside the pole and behind the ferry's rope, keyed out before
any pick. **Minor, shipped:** the stick horse's pole trails a red tuft; the boy holds it with one hand. **Flagged:** the ford's
crossing is a hard-edged band straight across, a little like a paved low-water crossing; the other seeds kept the road dry
through the creek (a causeway) or drew a bridge. No repair round was used.

Before and after: [fixes-local-compare.png](evidence/fixes-local-compare.png) (each at 150 and 20 px),
[fixes-local-ford.png](evidence/fixes-local-ford.png).

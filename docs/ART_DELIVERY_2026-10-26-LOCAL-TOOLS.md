# Delivery 2026-10-26: the tools the work cycles hold (FLUX.2 klein 4B)

**Status: wired, branch `standins-1025`, not released.** The owner's added batch of 2026-10-25 ("plus a batch of painted tool parts
for the animation cycles"; [ART_PLAN_LOCAL_2026-10-25.md](ART_PLAN_LOCAL_2026-10-25.md) §3): the felling axe, the maul, the spade,
the broom, a pair of pails, the cane pole and the battling stick, painted with the owner's local pipeline on FLUX.2 klein 4B fp8
(Apache-2.0). The people's work cycles stay as they are (one face, costume and grip across frames is not the pipeline's to keep);
the tools in their hands are painted parts.

## What is drawn where

`public/work-art.js` `TOOL_PARTS`: each tool lies along its sprite's long diagonal, its butt and head read off its pixels as
fractions of its frame. `drawHaftTool` lays the painted tool in the hoeing cycle's hands from just behind the hands to the hoe's head
(the `HAFTS` table), mirrored with a figure facing west; `paintToolPart` turns and scales it. While a sheet loads, the felling axe and
the maul are drawn in strokes as before, and the others leave the hoe.

| Tool | Held by | Pick of 4 |
| --- | --- | --- |
| `tool-felling-axe` | felling, notching, raising the house (`chop`, `notch`) | s2 (s4 refused: a spike on its poll) |
| `tool-maul` | splitting rails (`split`) | s2 |
| `tool-spade` | **new**: digging, the well, grubbing (`dig`, `well`, `grub`) | s1 |
| `tool-broom` | **new**: sweeping the house, a stroke of its own (`sweep`, `WORK['keep-house']`) | s4 |
| `tool-battling-stick` | **new**: beating the wash (`beat`) | s4 |
| `tool-cane-pole` | fishing, at home and on the road (the line and the float still drawn) | s1 |
| `tool-pails` | in the library; no pose holds pails over a hoe (carrying water has its own frames) | s1 |

A figure with its own cycle of the work (Claude's or Astra's `-chop`, `-dig` …) is drawn in it and holds no added tool, as before.
At the classroom's zoom the broom and the stick are thin beside the painted hoe, which still shows under them (minor; the axe's
bit used to cover it).

## How they were painted

On a flat pale grey ground from a board of two of Astra's icons showing the tool (or her bucket), lying along the diagonal; keyed
out on the CPU (the pails also inside their bails), fitted to 460 px. Prompts, references, seeds and picks:
`scripts/local-art/records/tools-2026-10-26.json`. **Licence:** 28 of 28 candidates allowed from their own files. **GPU:** 28 jobs,
215 s, on the RTX 4060 Ti (ComfyUI was there for the owner's game and stayed for light jobs).

## Proofs

`tests/tool-parts.test.mjs` (new): every tool's butt and head are on its sheet's pixels with nothing beyond them along the tool; a tool
in the hoeing hands is the painting once its sheet has come, the strokes before, mirrored facing west; the dig, the well, the
grubbing, the beaten wash and the sweeping each hold theirs. Proved by injection (the axe's head moved inward; the mirror removed),
each failing that test alone. `npm run test:work` passes: its wood-pile step still expected Claude's pile to be held back for
Astra's logs, which batch 2 made untrue (the painted pile is drawn); its expectation is now the painted pile. Before and after:
[evidence/tools-local-compare.png](evidence/tools-local-compare.png).

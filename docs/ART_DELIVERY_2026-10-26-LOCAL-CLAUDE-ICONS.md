# Delivery 2026-10-26: Claude-drawn stand-ins in the places seen most (batch 5, FLUX.2 klein 4B)

**Status: wired, branch `standins-1025`, not released.** Batch 5 of [ART_PLAN_LOCAL_2026-10-25.md](ART_PLAN_LOCAL_2026-10-25.md):
the Claude-drawn icons of children's play, the Scrape, sickness and the courtship, the sick mark, the neighbours' farmsteads and the
homecoming's marker and coins, painted with the owner's local pipeline on FLUX.2 klein 4B fp8 (Apache-2.0). Every one is asked for
by name, so the frontier-v1 painting is drawn and **Claude's frames of those names are retired** (`retire.mjs` in
`children-icons`, `courtship-icon`, `sickness`, `homecoming`, `courtship-places`; the empty modules' area files and their pictures
deleted). Pipeline art counts as finished art (owner, 2026-10-25); Astra's own would still win.

## What is drawn where

| Sprites | Items | Pick (of four; farmsteads of eight) |
| --- | --- | --- |
| `icon-child-doll`, `-tag`, `-hide`, `-cart`, `-hoop`, `-marbles`, `-hens`; `icon-flee-hide`, `-bundle`, `-cow`; `icon-road-lookout`, `-sing`, `-little-ones`; `icon-camp-fire`, `icon-ferry-help`, `icon-share-food`, `icon-ford-carry` | B9 (all but the stick horse), B11 | doll s3, tag s4, hide s3, cart s3, hoop (repair) s2, marbles s1, hens s3, flee-hide s2, bundle s2, flee-cow s1, lookout s3, sing s1, little-ones s1, camp-fire s4, ferry-help s1, share-food s1, ford-carry s1 |
| `icon-child-help`, `icon-ask-neighbours` | B10, F16 | s1, s2 |
| `icon-rest-road`, `icon-camp-apart`, `icon-nurse-home`, `mark-sick` | B5, B4 | s2, s3, s4; s2 |
| `farm-neighbour-porch`, `farm-neighbour-ramada` | E17 | s7, s7 |
| `grave-marker`, `coins-and-paper` | E20 | s2; the repair's s1 |

The farmsteads, the marker and the coins are asked for at a grown person's height, as Claude's were; the atlas build gives each a
logical height so the farmsteads stand as tall as Astra's cabin and jacal beside the cast, the marker to a man's chest and the coins
small on the table (`homecoming-local-1` in `scripts/build-atlas-manifest.mjs`). The first proof drew the jacal a third of its
size; fixed before this commit.

## How they were painted

As batch 4: each at 1024² on a flat pale ground from a board of two of Astra's frames nearest in subject; Claude's icon of each
was the subject sketch, what it shows, never how. Keyed out on the CPU and fitted to her sizes. Prompts, references, seeds and picks:
`scripts/local-art/records/b5-2026-10-26.json`. **Licence:** 132 of 132 candidates allowed from their own files. **GPU:** 132 jobs.
Two of the lookout's jobs timed out on the 4080 while the arbiter's poll stalled for 20 minutes (16:01, its log: "slow poll:
1,200.8 s") and the owner's game had already started; the arbiter then interrupted ComfyUI and the batch went on on the RTX 4060 Ti,
and the two were painted again afterwards. One job took 996 s on the 4080 during that window.

## Review

**Refused:** writing on the bill of sale and on the coins (text: every first-round candidate); a railway under the lookout and a motor
truck as the stopped wagon (anachronism). **Repairs, one each:** the hoop (the first round copied a hobby horse off the board's play
icon), the coins and paper (told plain coins and a blank paper; clean).

**Flagged for the owner:**
- `icon-child-stick-horse` **is not shipped**: all four, and all four of its one repair (told "a toy on a stick, not a real horse"),
  painted a boy riding a horse or a rocking horse. Claude's stick horse stays in use (B9 stays open for it alone).
- `icon-child-hoop`: the repair's hoop is painted taller than the girl.
- `icon-ferry-help`: s1 is two hands on the ferry's rope over the water; the other three passed a coin from hand to hand.

## Proofs

`tests/local-art-wins.test.mjs` (new): every sprite of every local delivery is in the library and no Claude frame of its name is left;
proved by injection (Claude's `mark-sick` put back in its atlas: that test alone fails). `npm run test:lone-parent` and
`npm run test:flashback` pass. Before and after: [evidence/claude-icons-local-compare.png](evidence/claude-icons-local-compare.png)
(the farmsteads at their right size; the homecoming's yard, which now takes the painted courtship yard of batch 1).

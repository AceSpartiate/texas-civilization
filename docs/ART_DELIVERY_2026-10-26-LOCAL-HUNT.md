# Delivery 2026-10-26: the hunter's first-person field and rifle (batch 3, FLUX.2 klein 4B)

**Status: wired, branch `standins-1025`, not released.** Batch 3 of [ART_PLAN_LOCAL_2026-10-25.md](ART_PLAN_LOCAL_2026-10-25.md):
[request 2026-10-02 "the hunter's first-person field"](ART_REQUESTS.md#request-2026-10-02--the-hunters-first-person-field) (F17),
painted with the owner's local pipeline on FLUX.2 klein 4B fp8 (Apache-2.0). The request is closed; Astra's own paintings would still win.

## What is drawn where

| Sprite | Shown | Pick |
| --- | --- | --- |
| `hunt-field-timber`, `-brush`, `-open` | the field behind the animal, March to November | s5, s8, s2 of 8 |
| `hunt-field-timber-winter`, `-brush-winter`, `-open-winter` | December to February | the repair's s3, s2 (timber, brush); s2 of 4 (open) |
| `hunt-rifle` | the long rifle over the hunter's shoulder, turned on its muzzle onto the sights | s7 of 8 |

Wiring (`public/hunt-aim.js`, with `public/hunt-art.js` for what node's tests read): the field's back layer is the painting for the
sighting's cover and season (`fieldSprite`), drawn to cover the canvas about the 16:9 field box; rain, a storm or a norther greys it
and fog hazes it; the waterfowl's strip of water is still drawn across it. The cover nearest the hunter (the trunks and leaves at the
edges, the grass over the animal's feet, the vignette) stays drawn by the page, as planned: the paintings are opaque. The back layer is
repainted once the painting has come. The rifle is turned about its muzzle so the muzzle is on the sights and its butt where the
stroked stock's base was (`RIFLE`: the muzzle and butt plate as fractions of the frame, read off its pixels); the brass bead and
the pale ring stay. While a painting loads, the page's strokes. `window.__huntAim.field` and `.rifle` say which was drawn.

## How they were painted

- The fields at 1792x1008, scaled to the contract's 1600x900, from Astra's `creation-title-landscape.png` and a board of her trees
  (`post-oak-large`, `live-oak-large`; `mesquite-*`): eye height, horizon halfway down, the middle third clear of trunks, no animal.
  Colour moved toward her landscape as the rider scenes were. The winters are reference edits of the chosen summers.
- **One repair:** the timber and brush winters came back under snow and frost (a South Texas winter is dry and brown; the request
  asks for bare crowns and dead grass). One round of four edits each, told "no snow and no frost", gave dry buff grass and bare
  brown crowns with the live oaks still green. The open prairie's winter was already dry (s2).
- The rifle on a flat grey ground from a board of her `icon-hunt-timber` and `volunteer-aim`, keyed out on the CPU. It is a
  percussion rifle (caps were in use by 1835, `HIST-GONZ-020`), painted three-quarter rather than truly over the shoulder; turned
  onto the sights it reads as the rifle the hunter holds.
- Prompts, references, seeds and picks: `scripts/local-art/records/b3-2026-10-26.json`. **Licence:** 52 of 52 candidates allowed
  from their own files. **GPU:** 52 jobs, 414 s: 32 on the 4080 (13:44-13:48), the 12 winter edits on the RTX 4060 Ti while the
  owner played (14:47-14:50, game mode), the 8 repairs on the 4080 after it; no job was interrupted or moved mid-job.

## Review and proofs

Contact sheets in [art-sources/hunt-local-2026-10-26/](art-sources/hunt-local-2026-10-26/). `tests/hunt-art.test.mjs` (new): every
cover and month has its painting, winter is December to February, anything else is timber, and the rifle's muzzle and butt are on
its pixels with nothing beyond them; proved by injection (winter cut to January-February; the butt moved inward), each failing it
alone. `npm run test:hunt-aim` passes (hit, miss, keyboard, touch, less motion; no page errors). Before and after:
[evidence/hunt-local-compare.png](evidence/hunt-local-compare.png).

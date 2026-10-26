# Delivery 2026-10-26: the rider scenes' backdrops and the courtship yards (batch 1, FLUX.2 klein 4B)

**Status: wired, branch `standins-1025`, not released.** Batch 1 of [ART_PLAN_LOCAL_2026-10-25.md](ART_PLAN_LOCAL_2026-10-25.md):
the nine backdrops of [request 2026-10-05](ART_REQUESTS.md#request-2026-10-05--rider-scenes-backdrops) (E40-E44) and the three
yards of the lone parent's wedding ([request 2026-09-29](ART_REQUESTS.md#request-2026-09-29--the-lone-parents-wedding), item 5,
E19), painted with the owner's local pipeline on FLUX.2 klein 4B fp8 (Apache-2.0). Pipeline art counts as finished art (owner,
2026-10-25): the requests are closed, Claude's yards are retired, and Astra's own paintings would still win.

## What is drawn where

| Sprite | Shown | Pick |
| --- | --- | --- |
| `scene-street-gonzales` | a rider met in Gonzales | s8 of 8 (s1-s4 the bake-off's own) |
| `scene-street-texian` | an Anglo colonial town (San Felipe and the rest) | s6 |
| `scene-street-tejano` | Béxar, Goliad, Laredo, Victoria, Presidio, Matamoros | s6 |
| `scene-camp-volunteers` | the volunteers' camp | s8 |
| `scene-road-prairie`, `scene-road-woods` | on the road, without and with timber | s8, s6 |
| `scene-ford` | at a ford | the repair's s4 (flagged, below) |
| `scene-yard-night` | the family's own yard after dark, its house and field still set on it | s6 |
| `scene-alamo-plaza` | inside the Alamo; painted empty, the page draws the men (owner, 2026-10-25) | s8 |
| `courtship-yard-noon`, `-morning`, `-evening` | the lone parent's scenes by the hour (night takes the evening) | s6; s4 and s1 of four edits of the chosen noon, so the three are one yard |

Wiring: `backdropOf(setting)` in `public/rider-scene.js` names the painting; `drawBackdrop` draws it to cover the scene
(`drawCover`, as the courtship yards are) and the page grades it for the hour; a place with its painting drawn sets none of the
library's buildings, tents or trees on it (`piecesOf(setting, { painted })`), but the family's yard keeps its own house and field
on the night yard. The family's yard by day is its own map ground, house and field, as designed (there is no daytime yard
painting to ask for). An Irish colony's town (San Patricio, Refugio) keeps its assembled street: none was asked. A painting not
yet loaded falls back to the assembly. `public/courtship.js` already asked for its yards by name. Opaque paintings are framed to
their exact rectangle by `scripts/build-atlas-manifest.mjs` (`BACKDROP_SHEET`), so no padding shows as a hairline at the screen's
edge.

## How they were painted

- Prompts (the bake-off's Gonzales prompt as the pattern), references (Astra's `creation-title-landscape.png` for palette and
  brushwork, and a board of her own frames of the place's buildings or trees: `storehouse`, `cabin-wide`, `shop-*`, `jacal-*`,
  `town-mexican-river`, `church-generic`, `tent`, `campfire`, `camp-cookpot-tripod`, `post-oak-large`, `live-oak-large`,
  `cottonwood`, `cypress-bald-large`, the Alamo's `alamo-church-front-1836` and walls), seeds and picks:
  `scripts/local-art/records/b1-2026-10-26.json`, from `scripts/local-art/batches_2026_10_26.py`. Painted at 1360x768.
- **Colour toward Astra's landscape** (the bake-off's recommendation: klein 4B's backdrops are lighter and more line-drawn than
  her oil landscape): each pick's spread moved halfway to hers and its mean a sixth of the way, so her sunset does not tint a
  noon street (`colour_toward`). The night yard is left as painted. The difference is small and warmer.
- **Licence, from each file:** 88 of 88 candidates allowed by `licence_check.py`.
- **GPU:** 88 jobs, 906 s in all. 76 on the RTX 4060 Ti (13:14-13:28, 7-29 s each: ComfyUI was there for another project and the
  owner was on Parsec), 12 on the 4080 after the owner's game ended (13:42-13:43, ~3.6 s each). The owner played Enshrouded
  13:29-13:39 while batch 2 ran on the 4060 Ti; no job of this batch was interrupted or moved mid-job. The leases waited about
  50 minutes in all behind another project's upscales.

## Review

Contact sheets: [contact.jpg](art-sources/scenes-local-2026-10-26/contact.jpg) (the eight of each) and
[contact-edits.jpg](art-sources/scenes-local-2026-10-26/contact-edits.jpg) (the yard's hours and the ford's repair). The picks
were looked at full size for people, text, signatures and anachronism: none. Refused on the way: the camp candidates whose fire
sits where the people stand; the Alamo fronts with the 1850 hump (s1, s7: anachronism); night yards with a street lamp or a
cabin wall in them.

**Flagged for the owner:** `scene-ford`. None of the eight painted the road through the water, and the one repair round (four
reference edits of s2) brought the road down to a pale gravel bar across the creek at best. Shipped as that (no hard fault; it
reads as a shallow crossing at play size); it may want a redraw.

In the game: [evidence/scenes-local-compare.png](evidence/scenes-local-compare.png), before and after (the rider in Gonzales's
street; the lone parent's wedding yard, whose after shot fell at night in the proof's own clock: the evening yard graded dark). Browser proofs: `npm run test:rider-scene` (now asserts the town's street is its painting with nothing set on it) and `npm run test:lone-parent`, both passing.

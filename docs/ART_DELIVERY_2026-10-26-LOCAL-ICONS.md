# Delivery 2026-10-26: the family panel's icons and marks the page drew (batch 4, FLUX.2 klein 4B)

**Status: wired, branch `standins-1025`, not released.** Batch 4 of [ART_PLAN_LOCAL_2026-10-25.md](ART_PLAN_LOCAL_2026-10-25.md):
17 icons and 7 marks the page drew in strokes, CSS masks or another subject's picture, painted with the owner's local pipeline on
FLUX.2 klein 4B fp8 (Apache-2.0). Pipeline art counts as finished art (owner, 2026-10-25); Astra's own would still win.

## What is drawn where

| Sprites | Item | Wiring |
| --- | --- | --- |
| `icon-more` | F40 | asked by name in `drawMoreIcon` (public/short-bar.js) |
| `icon-go-inside`, `icon-join-seguin`, `icon-pitch-tent`, `icon-keep-house`, `icon-work-garden`, `icon-wash-clothes`, `icon-milk-cow` (also the road's milking), `icon-fence-yard`, `icon-camp-cook`, `-wood`, `-bullets`, `-shelter`, `-buy`, `-hunt`, `icon-town-wages`, `icon-town-board` | C20, C21, F30, F34, B15 (the icon), B16 (the icon), F39 | asked by name: `drawIcon` takes `icon-<key>` first (public/family-panel.js); the old pictures are now only what shows while a sheet loads |
| `mark-hunger`, `mark-food`, `mark-help`, `mark-shelter-house`, `mark-shelter-tent` | B13, F37, F31 | **new**: public/painted-marks.js draws each into a small canvas once its sheet has come and hands it to the style sheet (`--mark-<name>`, `:root[data-painted-marks~=…]` rules in public/style.css) in place of its mask; under the wagon or in the open keeps its drawn mark |
| `mark-cue-house`, `mark-cue-wash` | F38 | drawn straight into the cue mark's canvas for keeping house and the wash (`CUE_MARKS`, public/app.js) |

Picks (of four each): more s1, go-inside s3, join-seguin s1, pitch-tent s2, keep-house s3, work-garden s1, wash-clothes s1,
milk-cow s1, fence-yard s4, camp-cook s2, camp-wood s2, camp-bullets s1, camp-shelter s4, camp-buy s3, camp-hunt (repair) s2,
town-wages s4, town-board s4; hunger s1, food s2, help s2, cue-house s2, cue-wash s2, shelter-house s2, shelter-tent s2.

## How they were painted

Each at 1024² on a flat pale ground from a board of two of Astra's icons nearest in subject (the marks from her `mark-need`,
`mark-main`, `mark-auto-on`), keyed out on the CPU, fitted to her icon size (300 px; marks 320) and packed one to a clear 384 cell.
Prompts, references, seeds and picks: `scripts/local-art/records/b4-2026-10-26.json`. **Licence:** 104 of 104 candidates allowed
from their own files. **GPU:** 104 jobs, 410 s.

## Review

Contact sheets keyed on green-grey; the picks looked at full size. **Refused as hard faults:** the camp-buy and town-wages coins
with numerals painted on them ("1", "10": text), replaced by the seeds whose coins carry a head. Hands (the More icon) and the
horse's legs (Seguín) counted.

**Flagged for the owner, each after its one repair round (four more):**
- `icon-work-garden`: every candidate, the repair told plainly "a hoe, not a shovel and not a spade", painted a spade. Shipped the
  first round's s1, a spade in a bed of young plants: it reads as working the garden. A hoe wants a redraw.
- `icon-camp-hunt`: the first round painted the rifle over a ring of stones; the repair, told split-hoof deer prints, painted paw
  prints with claws. Shipped the repair's s2, a rifle beside two tracks: it reads as the hunt, with the wrong animal's tracks.
- Seguín's horseman wears a modest felt hat rather than a wide sombrero; minor, shipped.

## Checked again before release (coordinator, 2026-10-26)

- **Portraits: not a regression.** The first compare's BEFORE was the committed `custom-work-cue.png` of 2026-10-05, made before
  the family rig's portraits of 2026-10-13. The same class shot at the same moment with the art loaded, in 5972d453 and in this
  branch (`output/local-2026-10-26/panel-shot.mjs`), draws the same portraits; nothing here touches the portrait canvas.
- **Numerals: none ship.** The two coin icons with "1" and "10" in the first compare were the first picks, swapped in the atlas
  before commit (the sheet in that picture was older than the packed atlas); `icon-camp-buy` and `icon-town-wages` as shipped carry a
  head on a plain coin. Every shipped local icon and prop was looked at: no letters or numerals.
- **AUTO is unchanged.** Its badge is Astra's `mark-auto-off`/`-on` (2026-10-07), the same in both trees; none of these batches
  touched it.
- **Marks at their drawn size.** Seen at 18-20 px, only the hunger bowl and the help hands read. The food sack would hide the gauge's
  colour by level, and the shelter roof and tent and the two cue marks are too small inside their wide rims. Those five stay drawn as
  before (`PAINTED_MARKS`, `CUE_MARKS`), their paintings in the library unused; B13 (the sack), F31 and F38 are open again.
  `tests/painted-marks.test.mjs` holds it (injection: the food sack put back among the painted marks fails it).

## Proofs

`tests/painted-marks.test.mjs` (new): every painted mark is in the library and the style sheet shows each by name; a mark is handed
over only once its sheet has come and it drew, and never twice. Proved by injection (the help mark's rule unhooked from its name:
that test alone fails). `npm run test:custom-work` passes (the cue, the help, the house's work): before and after of the panel, with
the painted sheets, in [evidence/icons-local-compare.png](evidence/icons-local-compare.png).

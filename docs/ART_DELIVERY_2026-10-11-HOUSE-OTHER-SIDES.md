# House other sides — art delivery 2026-10-11

All ten drawings from the September 23 request are delivered, registered and measured. This closes the **artwork** group. Automatic selection and full-house chimney registration remain compositor integration work, explicitly distinct from missing artwork. Existing gameplay house selection is unchanged by this delivery.

## Complete manifest

| Sheet | Sprite | Purpose |
| --- | --- | --- |
| house-back-views | house-round-back-sill | Round-log grounded footprint |
| house-back-views | house-round-back-low-walls | Round-log early wall stage |
| house-back-views | house-round-back-full-walls | Round-log rear gable, doorway on long side |
| house-back-views | house-hewn-back-sill | Squared-beam footprint |
| house-back-views | house-hewn-back-low-walls | Hewn-log early wall stage |
| house-back-views | house-hewn-back-full-walls | Hewn-log rear gable, doorway on long side |
| house-end-views | house-passage-floor-end | Narrow passage floor receding away |
| house-end-views | house-passage-roof-end | Separate open roof and support posts |
| house-end-views | house-porch-end | Narrow open porch end |
| house-end-views | house-shed-room-end | Blank narrow shed end, doorway on long side |

The near gable of both rear wall drawings is blank rather than carrying the existing front-view doorway. All wall stages have open tops. Round and hewn texture, clapboards, perspective and brown outlines follow house-modules.png. These are architectural modules rather than asserted replicas of a particular historical building.

## Motion and cutaways

No looping clips: floors and walls are rigid. Use the individually addressable sill/low/full stages to progress construction. Keep roofs separate and hide them for room cutaways; never animate structural pieces by warping their geometry. End passage floor and roof are independently addressable. The porch and shed are complete end-view illustrations, not separate roof-removal layers; use the existing interior renderer when looking inside them.

## Registration

The builder measures seatX/seatY and left/front/right ground corners on both rear full-wall frames. roofScale normalizes each new full-wall source width to its corresponding original full-wall width, since the new atlas has a different source resolution. public/house-plot.js roofSeat honors this optional multiplier; original frames default to one. Thus existing roof drawings can be seated on either rear wall material, mirrored or not.

Do not substitute new rear walls into the full-house compositor using the original wall dimensions or ground corners: geometry must use the actual selected frame. Stage display heights should be proportional to each stage's measured height at the full-wall pixel scale. Ground placement and construction progress must remain server-owned.

## Claude integration checklist

1. Select rear stages for a pen whose chimney-facing gable would otherwise display the front doorway. Share the house ridge/mirroring policy across both pens.
2. Use the same selected full-wall frame for roof seating, gableFoot and chimney registration; preserve chimney location throughout construction. Handle unloaded-art fallback consistently across geometry and drawing.
3. Use the new end-on addition drawings at the appropriate quarter turns. Preserve the existing connected two-pen roof joins rather than replacing them with the standalone passage roof.
4. Update house-chimney tests to measure the new side doorway and remove the current legacy expectation that a front chimney hides the entire door. Add actual full-house browser proof at all four rotations.
5. Current house-turn/roof/chimney/connected tests exercise existing gameplay selection and must keep passing until this migration is completed. The delivery proof below exercises the new artwork directly with the production sprite renderer and roofSeat, not a migrated full house.

## Provenance and checks

Exact prompts, references and original selected sources: scripts/art-deliveries/house-other-sides-2026-10-11.mjs, docs/art-prompts.json and docs/art-provenance.json. The first rear atlas had 103 low-opacity boundary pixels trimmed; it was rejected. A built-in imagegen gutter refinement produced the selected source. Original and refinement prompts are retained in docs/evidence/house-back-gutter-correction.json. All selected PNGs copied unchanged; no programmatic raster editing.

Final atlas audit requires 100% retained visible pixels and zero trimmed pixels for all ten new frames. Browser evidence: docs/evidence/house-other-sides-art.png and house-other-sides-art.json, covering all ten pieces and four roof assemblies (two materials, mirrored/unmirrored). Existing roofs are reused rather than redrawn.

Run node scripts/house-other-sides-art-proof.mjs with the normal Playwright runtime variables. Focused tests: house-other-sides-art, art-library, house-turn, house-roof, house-chimney and house-connected.

**12 dated parent artwork groups remain.** No deployment performed.


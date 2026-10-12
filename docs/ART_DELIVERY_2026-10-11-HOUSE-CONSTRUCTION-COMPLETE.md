# House construction completion — 2026-10-11

Completes the remaining artwork listed under the September 15 house plot pieces group: jacal construction modules, an unfinished shed frame, a two-sided double chimney and independent floor/loft illustrations. Original round/hewn modules and other-side drawings remain separate deliveries.

## Full manifest

All eight frames are on house-construction-complete.png (four columns, two rows).

| Sprite | Construction use | Nominal occupied footprint |
| --- | --- | --- |
| house-jacal-posts | Posts and wall plates, no walls or roof | 16×16 ft |
| house-jacal-wattle | Open-top woven-stick walls | 16×16 ft |
| house-jacal-daub-walls | Open-top mud-coated walls | 16×16 ft |
| house-jacal-thatch-roof | Separate thatch shell | 16×16 ft |
| house-shed-frame | Joists, posts and sloping rafters | 16×8 ft |
| house-chimney-double | Two flues and back-to-back hearths | 8×16 ft |
| house-puncheon-floor | Ground-floor deck only | 16×16 ft |
| house-half-loft | Partial upper platform, posts and ladder; no lower deck | 16×8 ft |

Footprints describe the existing simulation's occupied construction cells, **not measured historical dimensions of the illustrated masonry or posts**. They are metadata for layout registration; authoritative collision and placement remain in the server catalogue.

The chimney has one visible hearth and the opposite hearth hidden on its far end. The rejected draft had openings on adjacent faces and must not be used. Neither version represents a surveyed historical chimney.

## Construction and motion

These are rigid architectural pieces, so no decorative motion loops are supplied. Construction proceeds through separately addressable pieces; a finished roof can be hidden for a cutaway. Wattle is a visible intermediate drawing during the server's weaving/daubing work, not an additional paid stage. Floor and loft can be toggled independently without making the ground floor disappear when the loft is absent.

Each frame carries rigid:true, footprintFeet and an occlusion contract referencing its own sprite alpha (threshold 40). Alpha is a visual mask, not a navigational wall mesh or door collider. Physics masks must come from the simulation's room geometry. A loft should occlude people behind its raised platform; characters below it require the existing interior/cutaway renderer.

## Live integration

public/house-plot.js now uses the jacal posts at completed stage 1, wattle when stage 1 has positive next-stage progress, daub at stage 2, and the independent roof on the completed stage 3 walls. All four rotations preserve upright drawing. The server's costs, work, capacity and state are unchanged.

The unfinished shed now draws house-shed-frame, falling back to lean-to if its sheet is unavailable. A completed shed continues using its existing completed artwork. Unavailable jacal module art falls back to the previous whole-house illustration.

The builder measures wall seats and ground corners for jacal daub walls and the roof's eave seat. A width ratio with 6% illustrated overhang normalizes roof source scale; roofSeat applies the existing optional roofScale contract. All jacal stages share the full wall frame's pixel scale.

## Claude continuation

The new double chimney, floor and loft are delivered and registered, but are **library-ready rather than automatically selected in gameplay**. They should be adopted alongside the previous delivery's rear-wall migration:

- Use selected-frame gable geometry and door locations when replacing the legacy tall single-chimney substitute. Check the two-sided chimney between both saddlebag pens at all four turns and keep its foot stable through construction.
- Draw the separate floor and half-loft according to the server's actual completed improvements. Convert occupied footprint/room geometry into display scale rather than drawing both to the same arbitrary pixel height.
- Keep roofs removable and implement alpha occlusion in the interior's established draw order; do not interpret alpha as a walkability mask.
- Preserve the original atlas combined floor/loft study for provenance; it is not the new independent-layer source.

No additional paid construction stages, historical building replicas, wall-course animations or night behavior are introduced. This closes the listed missing-art subset, not every possible future construction refinement.

## Provenance and verification

Exact generation and correction prompts, reference and both source paths are recorded in scripts/art-deliveries/house-construction-complete-2026-10-11.mjs, docs/art-prompts.json and docs/art-provenance.json. Selected source PNG copied unchanged; no programmatic image edits.

Final atlas audit: every new frame retains 100% of visible pixels with zero overlap trimming. Tests verify module metadata, jacal state selection at all turns, separate roof seating and unavailable-art fallback. Existing house turn, roof, chimney, connected-house and full-library checks also run.

Browser proof: scripts/house-construction-complete-art-proof.mjs; evidence docs/evidence/house-construction-complete-art.png and .json. It draws all eight frames and sixteen live jacal combinations (four stages × four turns) through production sprite and house rendering, with no browser errors.

**11 dated parent artwork groups remain.** No deployment performed.


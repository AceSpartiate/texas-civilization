# Saddlebag interior delivery — 2026-10-07

The dedicated saddlebag-interior request is complete. The painted, transparent roofless cutaway matches the existing frontier interiors: two adjoining log rooms share one central stone double chimney with inward-facing hearths. There is no open dog-run passage or end chimney.

## Integration and continuation

- `public/assets/frontier-v1/atlases/interior-saddlebag.png` is the unchanged generated source, registered as `interior-saddlebag` in the atlas and manifest.
- `sim/interior-data.mjs` selects the dedicated sprite. All ten furnishing-position IDs remain stable, preserving saved placements. Coordinates are measured against this picture; the west/east hearth positions are at x=.42/.58, y=.70.
- `public/interior.js` gives this two-room picture the existing wide-interior layout and furniture sizing.
- Furniture is separate and movable using the existing controls. This architectural shell is intentionally static; characters, furnishings and future hearth effects remain independent. No movement, fire animation or room navigation is newly implemented by this delivery.
- Other house modules and wagon-tool requests remain separate; this closes only the dedicated saddlebag interior group.

## Validation

`node --test tests/saddlebag-interior-art.test.mjs tests/interior.test.mjs`: seven tests pass, including atlas transparency, dedicated sprite selection, preserved position IDs, central hearth locations and existing interior behavior.

`scripts/saddlebag-interior-art-proof.mjs` loads the actual production art and interior renderer in a browser, verifies ten positions, clicks a pot then the west hearth, and verifies the placement callback and displayed result. It is an isolated renderer fixture, not a full gameplay session. Evidence: `docs/evidence/saddlebag-interior-art.png` and `.json` (PASS).

## Source and reproduction

`scripts/art-deliveries/saddlebag-interior-2026-10-07.mjs` contains the exact prompt, reference, chosen generation path and registration metadata. Master prompt/provenance files and `docs/ART_MANIFEST.md` were regenerated through `scripts/register-delivered-art.mjs` and `scripts/build-atlas-manifest.mjs`. No raster post-processing was applied.

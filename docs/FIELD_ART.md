# Farm plot visual overhaul — 2026-09-25

The flat beige squares are replaced by textured earth with rough turf edges, a shaded soil lip, individual clods, fourteen slightly irregular furrows, and planted rows using the existing corn and cotton sprites. Clearing has disturbed soil without planted rows. Survey stakes and faint dashed boundaries still show the exact ten-acre footprint; the natural-looking edge remains inside it. Fences still follow the actual plot boundary and use the existing sound/broken fence art.

## Art manifest

| Piece | Source | Behavior |
| --- | --- | --- |
| Turf edge, soil lip, soil color patches | `public/field-surface.js` | Seeded by household and plot ID; unchanged across panning and redraws |
| Fine soil grain | Generated once as a 256×256 canvas texture | Cached locally, no download or runtime image generation |
| Furrows and clods | `public/field-surface.js` | Fourteen furrows, bounded detail; no furrows during clearing |
| Young corn / ripe corn | Existing `corn-young` / `corn-mature`, nature atlas | Selected solely from the projected crop/state |
| Young cotton / ripe cotton | Existing `cotton-young` / `cotton-mature`, nature atlas | Same rule; bare fields never invent a crop |
| Distant crop rows | Canvas strokes | Below 70 pixels across, avoids hundreds of subpixel plants |
| Fences, stakes, clearing debris | Existing game art and `public/field-art.js` | Retained; reads known plot fence, ground, and clearing progress |

## Integration and continuation

`public/app.js` routes both map-feature fields and cleared family plots through `drawFieldSurface`. Partially cleared plots use it with `clearing: true`, preserving the existing square-root work-area progression. `server/app.mjs` serves the new module. No simulation, saves, acreage, selection, work time, yields, fog of war, or collision rules changed.

The renderer accepts only already-permitted plot state. It does not fetch world state. Detail is bounded and layouts are cached with a 256-plot limit. Static field art continues to live in the game's cached ground layer; do not add wall-clock wind motion there without a separate animated overlay and performance checks. Growth remains the server's crop-state transition. Crop density is illustrative, not an individual-plant yield simulation.

## Verification

Run `node scripts/field-surface-browser-proof.mjs` with the project's Playwright/browser environment. It renders six states to `docs/evidence/field-surface-contact.png`, compares their actual pixels, verifies deterministic redraws, checks that bare ground draws no crop and ripe cotton requests the correct sprite, and checks distant visibility. Setting `FIELD_SURFACE_INJECT=blank` deliberately removes rendering and must fail the same proof. The existing `scripts/field-art-browser-proof.mjs` covers clearing debris in the actual game; `npm run test:farm` covers field work and cached-ground updates.

This work was added alongside unrelated changes already present in the shared checkout; preserve those changes when preparing the next release.

Executed validation: all 1,160 tests passed (`test-results/field-overhaul-full.log`); the farm browser proof passed with 58 cached-ground comparisons and no stale drawings (`test-results/field-overhaul-farm.log`); field-surface and in-game clearing-art browser proofs passed. The blank-renderer injection failed the pixel comparison as intended, then the real renderer passed again. The contact sheet and actual-game screenshots were visually inspected. These are local browser checks, not physical Chromebook or classroom performance measurements.

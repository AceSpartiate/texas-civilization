# Béxar civic architecture — complete September 14 group

Both requested exterior sprites are delivered and integrated: `bexar-san-fernando-1836` and `bexar-governors-palace-1836`. Separate genuine-alpha PNGs live in `public/assets/frontier-v1/atlases/bexar-san-fernando.png` and `bexar-governors-palace.png`. They match the game's outlined, warm painted masonry style rather than introducing photoreal buildings.

## Research and scope

Read `BEXAR_CIVIC_ART_RESEARCH_2026-10-11.md` before reuse. San Fernando has the earlier plain front, one octagonal bell cupola, buttressed nave and low crossing dome, omitting the later Gothic front. The palace shows a restrained flat-roofed colonial residence façade, not the expanded landscaped museum. These are research-based illustrative reconstructions. Exact 1836 ornament, finishes, openings and some roof details are uncertain; the later church views postdate repairs. No archaeological elevation or courtyard plan is claimed.

This request explicitly called for static initial exteriors. No people or flags are baked in; their independent existing animations remain. Separate roofs/interiors, destruction and navigation are future scene requirements, not implied by this delivery. The church art is available for a future siege flag alignment; the existing battle flag has not been repositioned here.

## Integration and manifest

- `public/bexar-layout.js` selects the two delivered sprite IDs, preserving both placement IDs, coordinates, stylized heights, all roads and the Alamo transform.
- `public/bexar-art.js` retains the prior `chapel`/`adobe-flat` as unloaded/failed-image fallbacks at the exact same coordinates and scale.
- `scripts/art-deliveries/bexar-civic-2026-10-11.mjs` contains complete prompts, source paths, refinements and research links. Normal registry/atlas build updates prompts, provenance, `ART_MANIFEST.md`, atlas and library manifest.
- Selected PNGs were copied unchanged from built-in imagegen; no external raster editing. Alpha measurements retain 100% of each silhouette with zero trimming. Transparent exterior RGB is immaterial; production compositing has no baked backdrop or halo.

## Verification

`node --test tests/bexar-civic-art.test.mjs tests/bexar-layout.test.mjs tests/asset-http.test.mjs tests/art-library.test.mjs`: **10 passing**. Verifies new frames and retirement of generic selection, unchanged placements, Alamo/map geometry, server asset routes and the full library's remeasurement, silhouette and drawing-source audit.

`scripts/bexar-civic-art-proof.mjs`: production loader and town renderer through the classroom server; both façades beside established people, then the existing town composition. A separate browser page blocks the versioned new PNG URLs and proves both fallback renders match the old sprites pixel-for-pixel. No page errors. Reviewed `docs/evidence/bexar-civic-art.png`; JSON evidence alongside. This is a renderer fixture, not a full classroom playthrough.

Broad remaining backlog: **16 dated parent groups**. Complete art batch committed for Claude's next release; no deployment performed here.

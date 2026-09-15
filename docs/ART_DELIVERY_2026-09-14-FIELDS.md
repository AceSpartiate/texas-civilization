# Livestock, field details and second-cast care

The accepted library now has **45 atlases, 663 frames and 283 clips**, including 134 authored pose cycles and four layered rigs. This batch adds 64 registered frames and 29 clips. Every accepted new/corrected sheet has genuine RGBA transparency and zero overlapping pixels trimmed. Built-in image generation was used; originals were copied unchanged. Exact prompts and correction histories are in `art-prompts.json` and `art-provenance.json`.

## Delivered

- **animal-stock:** three longhorn coats and hog, each with four poses. Corrected gutters replace the held atlas. The game now draws grazing longhorns and a smaller rooting hog on the stock family's own land, with stable coat choice and existing depth sorting.
- **land-clearing:** four stumps, four survey/corner markers, four smouldering-brush poses, green/dry brush, cold ash and bundled branches. Timber plots retain small stumps; partly worked brush/timber plots show dry brush inside the worked portion. Survey corners use stone and stake art. The four-frame smoke animation uses a common reference height so changing smoke height does not resize the pile. No burn state is invented from clearing progress.
- **people-cast2-care:** seated rest, injury sling and two care gestures for each of the four second-cast identities.
- **people-cast2-search-trade:** two search and two exchange gestures for each identity. Accepted but the complete second cast remains unbound until its walking, carrying, sow/repair and dialogue sheets are ready.

## Verification and continuation

`npm run build:art` passes. Full test suite: **394 passed**. The new field presentation test was first proved to catch timber stumps appearing on prairie and invented burning, then both injected faults were removed. `scripts/field-art-browser-proof.mjs` verifies seven timber stumps, three brush piles, no prairie stumps and no unrequested smoke in the permitted own-land view. The source corrections are preserved in the delivery modules; central metadata was rebuilt.

Continue with second-cast locomotion/carry/sow-repair/dialogue, children's vertical motion, mounted family identities, layered appearance and researched Béxar civic façades. Some old `cast2.mjs` pending prompt entries are retained as source history: consult registered sheets and the updated request status before regenerating care/search-trade. The previous document's stock hold is superseded by this accepted correction.

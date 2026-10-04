# Redo/edit audit resolution and continued art

The audit was found on Claude's `art-redo` branch at `0b2d018d`, rather than in main. Its exact request text and original evidence are preserved in `ART_REDO_AUDIT_2026-10-04.md` and `evidence/art-redo-*.png`. All three artwork requests are resolved with built-in imagegen edits copied unchanged into their original runtime paths. Frame IDs and existing animation/UI bindings remain compatible.

| Request | Result | Objective check |
| --- | --- | --- |
| R1 Texian service icons | Recruiting desk/roll/quill/inkpot/musket, plus three drilling civilians in brim hats and ordinary clothes. Auxiliary enlistment remains distinct. | Inspected at 34/38px, full and 40% opacity; no Mexican shako/uniform in the two corrected icons. |
| R2 Lamar/Joe scale | Lamar's eight action poses and Joe's idle/speaking poses reduced to walking-body scale. | Idle/walk ratio Lamar 1.044, Joe 0.983; both meet 0.98–1.05 acceptance. Other revised gestures are within 5% of walking height. |
| R3 Grant gallop | Whole composites isolated inside cells; original horse/rider identity and four leg poses retained. | All four frames have zero trimmed pixels, 100% retained silhouettes and at least 24px horizontal gutters. |

`scripts/art-redo-measure.mjs` reproduces the measured ratios and gutters without rewriting the full library. `tests/art-redo.test.mjs` locks the acceptance checks. `scripts/art-redo-browser-proof.mjs` renders all 52 affected frames, exercises nine changing clips, and captures small-icon evidence. Before/after measurements, contact sheet and JSON verdict are in `docs/evidence`. Exact edit prompts, references and selected PNGs are recorded in `scripts/art-deliveries/zz-redo-audit-2026-10-04.mjs`; original generated sources remain referenced in provenance.

The audit's **C1–C3 are separate, still-open renderer measurement work**, not art redraw requests: clip-wide locomotion anchors, reference heights for crouched-only sheets, and walking-only reference heights for famous figures. This delivery does not claim those broad changes are fixed. Preserve the audit for Claude's renderer pass; avoid removing existing size compensations without measured replacements.

Continued production: `people-river-gestures.png` adds eight civilian poses and four authored two-pose clips for teal/elder watching and pointing across the river. Gonzales now projects semantic `point`; its east/west teal/elder scenes select identity-specific pointing. Other cast/facings retain search/idle fallback, moving actors retain walking, and volunteer/named identity paths are unchanged. Watch clips are catalog-ready. No historical dialogue, chronology, geography or visibility changes. Further cast pointing, directional observation, seated flag painting and forge work remain outstanding.

River provenance is `scripts/art-deliveries/gonzales-river-gestures-2026-10-04.mjs`; browser proof and alpha/pose-selection tests document its delivery. All new pieces and revised sheet checksums are included in `ART_MANIFEST.md` and the machine-readable catalog.

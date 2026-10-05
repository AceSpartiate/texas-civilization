# Cloth and bundle walking: 2026-10-05

`people-gonzales-bundle-walk.png` adds sixteen frames, four per existing identity: teal and blue-girl carry folded cotton cloth; indigo and elder carry tied tan parcels. Clips `<figure>-bundle-walk` show contact, passing, opposite contact and opposite passing. East-facing; mirror west. Four 300ms frames; the town renderer already ties walking clip time to distance traveled through `stepTime`, so calendar speed does not invent a new movement pace.

The town clip selector uses these for supported moving actors whose semantic pose is `carry`, in east/west directions. Stationary carrying, north/south walking, mounted actors, unsupported identities and child movement retain existing clips. This delivers the horizontal loaded-walking gap, not all carrying directions or placing/picking-up actions. Parcel contents are illustrative; inventory stays server-authoritative. No new historical outcome, timing, navigation or visibility rule is introduced.

Built-in imagegen generated with existing task sheets as style/identity references. Refinement repairs gutters and alternating steps. Selected PNG copied unchanged. Prompts and original/selected source paths are recorded in `scripts/art-deliveries/gonzales-bundle-walk-2026-10-05.mjs`, `art-prompts.json` and `art-provenance.json`; all sixteen frames and four clips appear in master manifests.

Claude: preserve visible loads across future north/south and pickup/putdown deliveries. Do not reuse these cloth or parcel composites for logs, rifles, infants or unrelated inventory. Only existing town carry poses are connected; broader family travel requires explicit inventory-based selection. Use fixed per-row logical height and existing distance-based gait timing.

Validation: `tests/gonzales-bundle-walk-art.test.mjs` checks full silhouette retention, zero trimmed pixels, transparent corners, fixed identity heights, clip structure and selection/fallback behavior. `scripts/gonzales-bundle-walk-art-proof.mjs` renders every frame through actual browser art APIs and verifies all four clips change pixels. Contact sheet and JSON: `docs/evidence/gonzales-bundle-walk-art.{png,json}`.

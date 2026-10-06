# North-facing river gestures: 2026-10-05

Sixteen transparent rear-view frames in `people-gonzales-river-north.png`: teal, indigo, elder and blue have two watch and two pointing frames each. Eight clips `<figure>-river-watch-n` / `-point-n`, two 650ms frames each. Back-of-head and garment details preserve identity; forward shading hand is partly occluded, and pointing extends diagonally away with a visible silhouette. Each row shares a fixed logical height.

Existing north-facing town `point` now selects matching art. South pointing and teal/elder east/west pointing retain their dedicated clips. Other cast/facings keep search fallback, moving actors walk and children remain idle. Watch clips are catalog-ready for an explicit future watch action, not automatically assigned to idle actors. No historical outcomes, words, visibility or timeline changes.

Built-in imagegen used the existing south gesture atlas as a style/identity reference. Prompts, refinements and original/selected paths are in `scripts/art-deliveries/gonzales-river-north-2026-10-05.mjs`, `art-prompts.json` and `art-provenance.json`. Selected PNG copied unchanged; master manifests include every frame and clip.

Remaining: indigo/blue east/west gestures and other cast identities. North views are authored rear views, not a mirrored front sprite. Preserve server-directed orientation and information asymmetry when staging.

Validation: new art tests plus existing south/river/town regressions require zero clipped silhouette pixels, full retention, transparent corners, fixed row heights and correct directional/fallback selection. Browser proof renders all sixteen frames and verifies eight changing clips: `docs/evidence/gonzales-river-north-art.{png,json}`.

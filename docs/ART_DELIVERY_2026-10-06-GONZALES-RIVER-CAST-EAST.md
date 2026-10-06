# Indigo/blue east-west river gestures: 2026-10-06

Eight transparent frames in `people-gonzales-river-cast-east.png`: two watch and two pointing poses each for indigo and blue. Four authored clips `<figure>-river-watch` and `-river-point`, east-facing, mirrored west, two 650ms frames each. Fixed row logical heights preserve body scale during quiet gesture changes.

Existing east/west town `point` now selects these matching identities. This completes cardinal pointing coverage for teal, indigo, elder and blue, alongside previous north/south deliveries. Watch clips remain registered for explicit future watch actions. Other cast, children and moving actors retain their existing fallback/walk behavior. Historical timing, dialogue and information projection are unchanged.

Built-in imagegen uses the existing south gesture and east gesture sheets as references. Prompts and original/selected sources are recorded in `scripts/art-deliveries/gonzales-river-cast-east-2026-10-06.mjs`, `art-prompts.json` and `art-provenance.json`. Selected PNG copied unchanged. All frames and clips appear in master manifests.

Validation: new art tests and north/south/river/town regressions check full retention, zero trimmed silhouette pixels, transparent corners, constant row heights and all cardinal selections. Browser proof renders all eight frames and verifies four changing animations: `docs/evidence/gonzales-river-cast-east-art.{png,json}`.

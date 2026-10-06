# South-facing river gestures: 2026-10-05

`people-gonzales-river-south.png` contains sixteen transparent frames: teal, indigo, elder and blue each have two watch and two pointing poses. Clips `<figure>-river-watch-s` and `<figure>-river-point-s` are front/south facing, two 650ms frames per quiet loop. Hand shading the eyes distinguishes watching; extended pointing arm distinguishes pointing. Stable row heights prevent scale pumping.

Existing town `point` poses now select these identities' south-facing clip. East/west teal/elder pointing keeps its existing dedicated art; other identities/directions keep the search fallback. Movement still selects walks, and child pointing remains idle. Watch clips are registered for explicit future watch actions; no idle actor is automatically turned into a watcher. No timing, historical claims, dialogue or visibility changes.

Generated with built-in imagegen using existing gesture and task sheets as style/identity references. Refinement corrects facing, missing pointing arms and spacing. Selected PNG is copied unchanged. Full prompts and original/selected paths are in `scripts/art-deliveries/gonzales-river-south-2026-10-05.mjs`, `art-prompts.json` and `art-provenance.json`. All frames and clips are registered in master manifests.

Claude: north-facing gestures and other cast east/west gestures remain art requests. Only select watch clips for explicit watch semantics; preserve exact actor direction and server visibility. Do not mirror south to pretend it is north.

Validation: `tests/gonzales-river-south-art.test.mjs` plus existing river/town regressions verify full silhouette retention, zero trimmed pixels, transparent corners, fixed row heights and direction/child/movement selection. Browser proof `scripts/gonzales-river-south-art-proof.mjs` verifies sixteen renders and eight changing animations. Evidence: `docs/evidence/gonzales-river-south-art.{png,json}`.

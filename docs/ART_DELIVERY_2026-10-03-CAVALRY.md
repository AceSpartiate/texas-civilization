## Mounted firing and lancer gait — delivered 2026-10-03

Two transparent PNG atlases add eight intact measured frames and two authored clips: `dragoon-fire` (aim 360ms, recoil 120ms, lower 220ms, settle 300ms; one-shot) and `lancer-charge` (four 160ms gallop poses; loop). Both face east; west is mirrored. Original interpretive navy/red cavalry costume matches the existing military sheet. No impact, injury or gore is depicted.

Mounted dragoon firing now selects the authored pose around its existing shot clock: aim during the final 360ms of the wait; recoil begins when the existing flash fires. Shot count, routes, speed and timing are unchanged. This does not add mounted reload detail. The lancer clip is ready in the art catalog but deliberately awaits an explicit lancer identity/action from battle projection: generic mounted dragoons must not all become charging lancers. Claude should stage it only in the researched lancer movement intervals, never change march speed simply to match a gait. North/south, turns and mount/dismount remain outstanding.

Exact prompts, initial and selected source PNG paths, refinement, sprite IDs and clip durations are in scripts/art-deliveries/cavalry-actions-2026-10-03.mjs. The selected images were copied unchanged. docs/art-prompts.json and docs/art-provenance.json include both records; ART_MANIFEST.md and the machine inventory include every frame. The alpha audit found zero overlap trimming and retained every measured object; clear alpha is 63.1% and 68.3% respectively. The lancer transparency refinement is recorded.

Verification: tests/cavalry-actions-art.test.mjs plus tests/battle-view.test.mjs passed all ten tests. scripts/cavalry-actions-art-proof.mjs verifies both clips render and change pixels between keyframes, with zero browser errors. Evidence: docs/evidence/cavalry-actions-art.png and .json. These are modest keyframes, not complete animation rigs; horse/prop registration remains artistic polish.


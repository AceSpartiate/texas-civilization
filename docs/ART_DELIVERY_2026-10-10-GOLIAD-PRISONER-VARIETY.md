# Goliad prisoner variety

Completed the second unarmed visual identity requested beside the delivered Goliad prisoner group in ART_REQUESTS.md.

## Delivered assets

`public/assets/frontier-v1/atlases/goliad-prisoner-second.png` is a 4-by-4 transparent painted atlas: a clean-shaven man in an olive coat, off-white shirt, russet trousers and gray hat, distinct from the original bearded tan-coated identity. No pose carries a weapon or ammunition belt. This is an invented generic appearance, not a named historical likeness.

Sixteen sprites use the `prisoner2-` prefix: four east walking frames, two south walking frames, two north walking frames, east/south idle, listen, look-back, run-e, duck, injured sitting and fully clothed non-graphic still. The three authored walking loops use 210 ms per east frame and 300 ms per north/south frame, matching the original prisoner's cadence. East mirrors for west. Other poses are individual held sprites, not complete action animations.

Built-in imagegen produced the artwork from the original prisoner atlas as a style/pose reference. The selected PNG was copied unchanged with its transparency. Exact prompt and reference/source paths are in `scripts/art-deliveries/goliad-prisoner-second-2026-10-10.mjs`, with generated manifest, prompt and provenance records.

## Runtime and Claude continuation

`public/battle-view.js` alternates the two identities by stable sampled slot index for groups projected with `figure: 'prisoner'`. Moving groups select their identity's directional walking loop; stationary groups select their idle pose (north uses a held rear-view walk frame, as before). Pause/reduced motion uses the existing held-frame path.

The fallen-figure cache retains the second identity, so its non-graphic injured/still sprite follows its marching appearance rather than changing costume. Named figures and family members keep their existing art. Missing second-identity assets fall back to the original unarmed prisoner poses.

Both prisoner identities now use shorter drawing heights for seated (55%) and lying (32%) states. The atlas loader sizes by visible height; previously the lying pose could expand to a standing figure's height and become disproportionately wide. These factors preserve the approximate body scale.

Listen, look-back, run and duck are registered for future explicit staging; this delivery does not invent gestures or replace the battle's movement paths. A run sprite is a held pose, not an authored running cycle. No event, fate, count, visibility or timing rules changed.

## Validation

`node --test tests/goliad-prisoner-second-art.test.mjs tests/battle-view.test.mjs`: 11 passing tests covering atlas retention, clips, directional mixing, stable identity, pause, down-pose scale and unarmed fallback alongside battle regressions.

`scripts/goliad-prisoner-second-art-proof.mjs`: production-loader fixture renders 16 distinct poses and all three walking clips without browser errors. Evidence: `docs/evidence/goliad-prisoner-second-art.png` and `.json`. This is an art fixture, not a full massacre playthrough.

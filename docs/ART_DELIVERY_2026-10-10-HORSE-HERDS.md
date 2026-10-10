# Horse drove and scattering groups — 2026-10-10

Completed the driven-herd group: eight painted frames form four-frame compact-drove and loose-scatter loops. Chestnut, dun, dark and gray horses match the existing mustang style. These are illustrative groups with seven visible drove horses and six visible scattering horses, not pictures of every animal in Grant's herd.

## Manifest and runtime

Sheet: `public/assets/frontier-v1/atlases/horse-herds.png`, selected generated PNG copied unchanged. Sprites: `herd-drove-1` through `-4`, `herd-scatter-1` through `-4`. Clips: `herd-drove`, `herd-scatter`; four authored frames at 250 ms each, loop true, motion none. East-facing groups are mirrored for west by the existing renderer. No north/south-specific composite is claimed.

Exact prompts/refinement, original/selected images and provenance are in `scripts/art-deliveries/horse-herds-2026-10-10.mjs` and the generated art records. Atlas, animation and manifest are rebuilt.

`drawHerd` in `public/battle-view.js` selects the compact or scattering group when the projected herd moves/scatters and the existing sampled count is at least eight. The group stays at the herd's existing interpolated world position. Smaller herds and grazing retain individual horse art; missing group art falls back to individual horses. Pause and reduced motion now hold both paths. The evidence count for a successful group draw is seven drove or six scattering horses; the simulation count is never changed.

## Verification

Eleven tests pass across `tests/horse-herd-art.test.mjs` and `tests/battle-view.test.mjs`. Tests cover all eight retained-pixel audits, transparency, both authored loops, actual battle renderer selection, pause, grazing and missing/small-herd fallback. The production Chrome art.js fixture renders all eight animation frames distinctly without page errors. Evidence: `docs/evidence/horse-herds-art.png` and `.json`. The fixture is not a complete Agua Dulce playthrough.

## Claude continuation

The original drove/scatter art group is complete. The composite does not assign persistent horse identities or replace the server's herd record. Keep herd count, date, visibility and movement authoritative. A closer camera can layer several group instances for denser historical mass if required, using deterministic placement and without interpreting painted horses as inventory. The existing grazing sprites remain appropriate when the herd stops. No riders, dust, casualties or new historical events are introduced by this art.

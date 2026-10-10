# Mexican regular crowbar directions

Completed eight painted transparent frames and two authored four-frame loops, matching the existing Mexican engineer's uniform and frontier storybook style.

## Assets and animation

- `public/assets/frontier-v1/atlases/regular-crowbar-vertical.png`: four columns, two rows; south/front above north/back.
- Sprites: `regular-crowbar-s-1` through `-4`, and `regular-crowbar-n-1` through `-4`.
- Clips: `regular-crowbar-s` and `regular-crowbar-n`, 300 ms per frame, 1.2 seconds per loop, authored movement with no synthetic motion.
- Each cycle plants the bar, braces forward, pulls back and recovers. Existing `regular-crowbar` supplies east and mirrored west.

The selected built-in imagegen PNG was copied unchanged; alpha was preserved. Exact prompt, reference paths and generated source are recorded in `scripts/art-deliveries/regular-crowbar-2026-10-10.mjs`, with generated manifest and provenance records.

## Integration for Claude

`drawBreaches` in `public/battle-view.js` already chooses these names when an active breach has `side: 'mexican'` and `facing: 'n'` or `'s'`. No renderer or simulation change was necessary. Without an explicit facing, east remains the default; do not infer historical breach directions from this delivery. No new Mexican breach event has been staged.

Pause and reduced motion hold the pose. Missing directional art falls back to the east crowbar, then the prior gun-ram pose if all crowbar art is unavailable. Named Karnes retains his own animation and suppresses the generic worker at his staged moment.

This completes the generic directional crowbar art for both sides together with the volunteer delivery. Other engineer actions such as digging and sandbag work are separate requests.

## Verification

`node --test tests/regular-crowbar-art.test.mjs tests/volunteer-crowbar-art.test.mjs tests/battle-view.test.mjs`: 17 passing tests. New coverage verifies complete retained silhouettes, clip registration, directional selection, fallback and pause/reduced motion.

`scripts/regular-crowbar-art-proof.mjs` uses the production loader to render all eight poses, checks distinct rendered frames and browser errors. Evidence: `docs/evidence/regular-crowbar-vertical-art.png` and `.json`. This is an art-loading fixture, not a full battle playthrough.

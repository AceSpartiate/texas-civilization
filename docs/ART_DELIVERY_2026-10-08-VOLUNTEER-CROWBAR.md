# Generic volunteer crowbar directions — 2026-10-08

Completed the generic volunteer crowbar direction group: eight painted frames add south/front and north/back views to the existing east action. Warm outlined frontier art matches the existing volunteer engineer costume. Each loop sets the iron bar, braces, levers and resets; no door or wall is baked into the figure.

## Manifest and use

Sheet: `public/assets/frontier-v1/atlases/volunteer-crowbar-vertical.png`, generated PNG copied unchanged. Sprites: `volunteer-crowbar-s-1` through `-4`, `volunteer-crowbar-n-1` through `-4`. Clips: `volunteer-crowbar-s`, `volunteer-crowbar-n`, four frames at 300 ms each, looping, no positional motion. The existing east clip remains `volunteer-crowbar`; west can mirror it. North/south should not be mirrored into each other.

Exact prompt and source provenance are in `scripts/art-deliveries/volunteer-crowbar-2026-10-08.mjs`, art-prompts/art-provenance, and the rebuilt atlas/manifest/animation registry.

`drawBreaches` in `public/battle-view.js` now uses the delivered generic crowbar action instead of gun ramming. An optional `breach.facing` of `n` or `s` selects these new clips; absent a direction, it retains the east view. Current historical stages do not gain invented directions. Missing vertical art falls back to the existing side-facing crowbar clip, then gun ramming. Named Karnes continues to use his own figure and suppresses the generic worker.

## Verification

`node --test tests/volunteer-crowbar-art.test.mjs tests/battle-view.test.mjs`: 12 passing tests. Every new frame has zero trimmed pixels and 100% visible-pixel retention. Tests exercise actual breach rendering in three directions, missing-art fallback and named-actor suppression.

`scripts/volunteer-crowbar-art-proof.mjs` renders all eight new frames using production art.js and the real atlas loader in Chrome. Eight distinct renders, no page errors. Screenshot and JSON: `docs/evidence/volunteer-crowbar-vertical-art.png` and `.json`. This is a production-art fixture, not a complete multiplayer gameplay test.

## Claude continuation

The generic volunteer crowbar request is complete across east/west/south/north using the existing east animation plus this delivery. Place the bar tip against the authored door edge when staging close views; the sprite does not open the door or determine breach timing. The simulation's existing dated breach remains authoritative. Vertical Mexican regular crowbar poses and named Karnes vertical actions are separate possible refinements, not claimed by this group.

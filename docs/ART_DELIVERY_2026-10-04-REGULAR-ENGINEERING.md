# Mexican regular engineering art

Delivered 16 transparent frames in one atlas, with four authored four-pose loops: `regular-dig`, `regular-crowbar`, `regular-sandbag-carry`, and `regular-sandbag-fill`. Navy/red uniforms, pale trousers and black shakos match the existing painted frontier style. Costume is an interpretive game design, not a uniform research claim.

Mexican battle `work` now plays `regular-dig`; Texian work retains `volunteer-dig`. Other clips are catalog-ready for explicit scene actions. No new work orders, terrain changes, combat outcomes or visibility rules are introduced. Named characters retain their own art. Face east; mirror for west. There are no north/south variants. Carry motion is subtle; fine foot and prop registration remains polish.

Exact prompts, reference and untouched generated PNG provenance are in `scripts/art-deliveries/regular-engineering-2026-10-04.mjs`. The generated atlas, animation catalog and `ART_MANIFEST.md` list all pieces. Rebuild with `node scripts/register-delivered-art.mjs` and `node scripts/build-atlas-manifest.mjs`.

Validation: `tests/regular-engineering-art.test.mjs` checks transparent corners, all silhouette pixels retained, and registered clip frames. `scripts/regular-engineering-art-proof.mjs` draws every frame through the real browser renderer and checks changed pixels across each clip; evidence is in `docs/evidence/regular-engineering-art.png` and `.json`.

Remaining military requests include dead-body carrying, family-specific battle/sleep appearances, directional mounted firing/reload and house interior masking/navigation. Add scene bindings for sandbag work and crowbar use only when the simulation exposes those actions.

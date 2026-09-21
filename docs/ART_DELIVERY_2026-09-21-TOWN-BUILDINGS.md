# Researched town buildings — 2026-09-21

Delivered `town-buildings-researched.png`, a strict 4×4 transparent atlas matching the existing frontier-v1 architecture style.

## Coverage

- Four reusable clapboard frame buildings: one storey, storey-and-a-half, two storeys, shop, and residence variants (five frames total).
- San Felipe's broad log `whiteside-hotel`, with the open dog-run passage and two end chimneys visible.
- Victoria's fortified `round-top-house`, plus a weathered variant; both use a round silhouette, heavy door, and gun slits.
- Four distinct jacales, including exposed woven sticks and a brush ramada variant.
- Mina stockade in closed-gate and open-gate states, each a complete palisaded compound with the cabin visible.
- Liberty's 22-foot-square hewn-log court room in front and alternate side-facing arrangements.

These are static architectural sprites. Ownership, access, damage, interiors, and historical state belong to simulation data rather than animation metadata.

## Production and validation

- Generated with built-in `image_gen.imagegen`, using `buildings.png` and `architecture-extra.png` only as visual references.
- The accepted generated PNG was copied unchanged into the runtime atlas directory.
- Genuine RGBA transparency, transparent corners, strict reading-order cells, and overlap retention were verified through the repository's `buildManifest()` measurement.
- Source prompt and generation path are recorded in `scripts/art-deliveries/town-buildings-researched.mjs`; the central registry and generated manifests are intentionally left for the integrating agent.

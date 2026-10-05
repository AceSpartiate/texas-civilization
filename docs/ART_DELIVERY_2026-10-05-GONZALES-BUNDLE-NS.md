# North/south loaded walking: 2026-10-05

`people-gonzales-bundle-ns.png` adds sixteen frames: each row is one identity, first two cells south-facing, final two north-facing. Eight authored clips `<figure>-bundle-walk-s` and `-n` for teal, indigo, blue-girl and elder. South shows a carried folded cloth or tied parcel; north correctly occludes the load behind the torso because it is held in front, not strapped to the back. Rear bun, braid, apron ties and hat maintain identity.

Two 600ms opposite-step frames give each cycle the same 1.2-second duration as its east/west companion. Existing `stepTime` ties cycle playback to distance traveled. Town carrying now selects a dedicated clip in all cardinal directions for these identities. Stationary carry, other activities, mounted actors, unsupported identities and children keep existing behavior. Broader family inventory-based carrying and pickup/putdown are still separate work.

Built-in imagegen used the delivered east/west sheet as identity/style reference. Any refinement and original/selected file paths are recorded in `scripts/art-deliveries/gonzales-bundle-ns-2026-10-05.mjs`, `art-prompts.json` and `art-provenance.json`. Selected PNG copied unchanged; master manifests register every frame and clip.

Claude: directional walking coverage is complete for these four town identities. Keep cloth/parcels specific to these semantic carry scenes; do not substitute for rifles, infants, logs or unrelated cargo. No simulation pace, inventory, visibility, historical dialogue or outcome changes are made.

Validation: `tests/gonzales-bundle-ns-art.test.mjs` plus existing bundle and town tests check zero clipped silhouette pixels, full retention, transparent corners, stable identity heights, clip structure and directional selection/fallbacks. Browser proof `scripts/gonzales-bundle-ns-art-proof.mjs` renders all sixteen frames and verifies all eight animations change pixels. Evidence: `docs/evidence/gonzales-bundle-ns-art.{png,json}`.

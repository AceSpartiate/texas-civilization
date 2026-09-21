# Second-cast north/south walking — 2026-09-21

`people-cast2-vertical.png` completes north/south walking for `rust-woman`, `indigo`, `ochre` and `blue-girl`. Each identity has two south-facing front-view frames and two north-facing back-view frames. The paired frames use opposite footfalls and arm swing so the renderer can animate travel rather than slide an idle figure.

The accepted atlas is a 1254 × 1254 RGBA PNG with 78.6485% fully transparent pixels and no visible pixels on the outer canvas edge. The connected-alpha atlas extractor finds all sixteen required cells without a clipping error. It registers sixteen frames and eight authored two-frame clips.

The first fresh generation preserved the identities and gait but touched the canvas and cell boundaries, so it was rejected. A built-in image edit changed only scale and spacing. The accepted generated PNG was copied into the runtime unchanged. Prompt, source paths, edit history and review measurements are recorded in `scripts/art-deliveries/cast2-vertical.mjs`.

This delivery is presentation only. Movement direction, location and timing remain authoritative simulation state. The older 2026-09-14 vertical candidate remains rejected and is not reused.

The central atlas and documentation build was intentionally not run during concurrent art production. The coordinating agent should register delivered art and rebuild the manifest after all parallel sheets have arrived.

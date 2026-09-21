# Traveller marker art — 2026-09-21

`travel-markers.png` replaces the canvas-drawn fast-travel marker vocabulary with sixteen painted sprites. Rust, ink, grey-green and slate color families each receive a portrait pin, route dot, destination ring and compact hoofprint.

Pin and destination centers remain transparent so the existing renderer can place the traveller's portrait or map beneath them. The accepted built-in ImageGen output was copied unchanged. Travel timing, position, route and selection behavior remain application state.

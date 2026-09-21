# Seated ox-wagon drivers — 2026-09-21

`people-wagon-drivers.png` supplies sixteen transparent compositing layers for the four original adult cast figures. Each row is one established identity (`rust`, `teal`, `elder`, `blue`); columns face south, east, west, and north.

Each sprite is a driver only. The existing wagon and ox remain separate renderer parts. The seated figure holds connected leather reins and a short wooden ox goad, with no bench, vehicle, animal, scenery, or ground painted into the layer. This preserves the current `seatLayout` depth order and allows the wagon, team, driver, and future cargo states to animate independently.

The delivery module registers one frozen breathing clip for every identity and heading (`<figure>-wagon-driver-<s|e|w|n>`). Integration should select these clips for `seatOf(entity) === 'wagon'` while leaving mounted-horse selection unchanged.

The PNG is the unchanged built-in ImageGen output. References were `civilians.png` for identity and style and `wagon-rig.png` for seat geometry only. Provenance, exact prompt, and source location live in `scripts/art-deliveries/wagon-drivers.mjs`.

Read-only `buildManifest()` and `buildAnimations()` validation passed: 1254×1254 RGBA, 63.0167% fully transparent pixels, clear atlas corners, 16 extracted sprites, 16 clips, zero overlap pixels trimmed, and 100% of visible pixels retained in every cell. SHA-256: `ea29de92502021ad58aef7dffaaf2647e8943f81d32ad35062d7ee73a1a3b123`.

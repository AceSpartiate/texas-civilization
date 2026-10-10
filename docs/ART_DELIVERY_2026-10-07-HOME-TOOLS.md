# Household tools — 2026-10-07

The wagon household-tool art group is complete. Five distinct painted props replace the Claude-drawn stand-ins: broad-bladed grubbing hoe, long-handled felling axe, broad short-handled hewing axe, L-shaped froe with wooden club, and T-handled screw auger. A sixth frame supplies the club separately for future composition.

## Integration

`public/assets/frontier-v1/atlases/home-tools.png` contains six registered frames. The existing `INTERIOR_ART` tool bindings keep their names, inventory IDs and relative sizes. The production atlas takes precedence over the old stand-in library automatically; no saved-inventory migration is required.

These are static loose floor props, independent of characters. For future work animation, compose the separate prop with an appropriate actor clip and position it at the hands; this delivery does not claim to add hoeing, chopping, riving or boring animations. The froe-with-club composite is intended for floor/inventory display; `home-froe-club` is available as a separate component. Existing actor action art remains available.

## Verification

- `node --test tests/home-tools-art.test.mjs tests/interior.test.mjs`: seven tests pass. Production frame selection, transparency, full visible-pixel retention, distinct IDs and existing placement/save/visibility behavior are checked.
- `scripts/home-tools-art-proof.mjs`: actual production loader and interior renderer load all five tools from `home-tools`, then place each using the existing buttons. No browser errors. This is an isolated renderer fixture rather than a full gameplay session.
- `docs/evidence/home-tools-art.png` shows the floor placements plus a larger identification strip. Companion JSON records PASS.

## Provenance

Built-in image generation was used. The exact final prompt and selected source path are recorded in `scripts/art-deliveries/home-tools-2026-10-07.mjs`, `docs/art-prompts.json` and `docs/art-provenance.json`. The source PNG was copied unchanged; no raster post-processing was performed. Its fully transparent pixel fraction is approximately 84.5%. Prompt/provenance registration and atlas generation use the existing scripts.

The request list and HANDOFF are updated. This closes the five household-tool request, not other house modules or character work animations.

# Grass Fight creek terrain

Completed the dry creek/ditch and crossing-art group from the September 25 Concepción and Grass Fight request, item 7.

## Artwork and manifest

`public/assets/frontier-v1/atlases/grass-creek-terrain.png` contains eight transparent painted frames:

- `creek-bed-dry`: recessed straight gravel bed.
- `creek-bed-curve`: curved eroded bed.
- `creek-ditch-dry`: narrow brush-screened ditch.
- `creek-bed-end`: dry gravel bowl/end.
- `creek-ford-1` through `-4`: moving creek water between fixed banks.

The `creek-ford` authored loop has four frames at 350 ms each (1.4 seconds). Dry terrain is rigid scenery; it should not breathe or morph. Water animates and holds on pause or reduced motion.

Generated with built-in imagegen using the existing Béxar ground atlas as the style reference. A spacing-only edit provided safe gutters. The selected PNG was copied unchanged, preserving alpha. Exact prompts, reference and source paths are recorded in `scripts/art-deliveries/grass-creek-2026-10-10.mjs` and the generated prompt/provenance JSON. All frames are registered in the art manifest.

## Integration and limits

`grassScenery` in `sim/battles/grass-fight.mjs` now selects the dry modules at the same ten positions previously represented by low `earth-rampart` sprites. Existing mesquite surrounds them. The crossing loop draws at the existing ford point over the original water ribbon; that ribbon continues to show the full creek course and remains if crossing art cannot load. Dry modules have explicit `earth-rampart` fallback.

`drawScenery` in `public/battle-view.js` receives the battle's pause/reduced-motion state for the new crossing clip and supports optional `fallbackSprite` scenery. No path, collision, cover, water depth, clock, casualty or player-knowledge rules changed. These are stylized visual modules at the engagement's existing reconstructed locations, not a surveyed geographic reconstruction. The crossing art does not establish that the historical creek was shallow or safe.

Claude can reuse the dry pieces as scenery and the water loop at explicitly staged crossings. Do not apply them automatically to every world river or imply the whole game's water system has been replaced.

## Verification

`node --test tests/grass-creek-art.test.mjs tests/battle-view.test.mjs tests/battle-grass.test.mjs`: 17 passing tests, including the Grass Fight's participation, fates, visibility and pacing regressions. Art checks verify full retained pixels, clip registration, scene selection, pause/reduced motion and fallback.

`scripts/grass-creek-art-proof.mjs`: production-loader browser fixture renders eight distinct frames without page errors. Evidence: `docs/evidence/grass-creek-terrain-art.png` and `.json`. The fixture verifies art rendering; it is not a full campaign playthrough.

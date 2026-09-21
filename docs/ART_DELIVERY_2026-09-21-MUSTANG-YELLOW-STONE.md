# Mustang and Yellow Stone underway delivery — 2026-09-21

This delivery closes the last requested hunt-animal sheet and the two missing underway states of the *Yellow Stone*. The generated pictures are presentation assets. Server projections remain authoritative for the quarry and vessel identity, position, load, movement, visibility, and outcomes.

## Files

- `public/assets/frontier-v1/atlases/wildlife-mustang.png` — sixteen east-facing frames: four graze, four alert, and eight gallop.
- `public/assets/frontier-v1/atlases/steamboat-steam.png` — four empty-deck underway frames.
- `public/assets/frontier-v1/atlases/steamboat-laden.png` — four underway frames carrying frontier militia, horses, and one wagon.
- `scripts/art-deliveries/mustang-steamboat-motion.mjs` — sprite IDs, five authored clips, prompts, provenance, and authority notes.

West-facing display mirrors the east-facing art. The boat sheets deliberately provide no north/south view because the present Groce's crossing runs east-west. They preserve the accepted `steamboat-moored` silhouette: low side-wheel hull, one visible starboard paddle box, two black chimneys, and plain cabin and pilothouse.

## Animation contract

| Clip | Frames | Frame time | Intent |
| --- | ---: | ---: | --- |
| `mustang-graze` | 4 | 620 ms | calm forage loop |
| `mustang-alert` | 4 | 520 ms | head, ears, and weight shifting |
| `mustang-gallop` | 8 | 135 ms | sustained travel or flight |
| `steamboat-steam` | 4 | 330 ms | empty underway paddle, churn, bow-wave, and smoke loop |
| `steamboat-laden` | 4 | 360 ms | army crossing underway loop |

The renderer may add the declared gentle `rock` motion to the two boat loops. Animation time never advances simulation time.

## Objective validation

Read-only `buildManifest()` and `buildAnimations()` validation passed without writing the central generated manifests:

| Sheet | Canvas | Clear alpha | Frames | Trimmed overlap | Minimum retained |
| --- | --- | ---: | ---: | ---: | ---: |
| `wildlife-mustang` | 1254 × 1254 RGBA | 65.8% | 16 | 0 pixels | 100% |
| `steamboat-steam` | 1254 × 1254 RGBA | 72.0% | 4 | 0 pixels | 100% |
| `steamboat-laden` | 1254 × 1254 RGBA | 69.2% | 4 | 0 pixels | 100% |

All required cells were found, every corner passed the transparent-alpha gate, and all five clips resolved only registered sprite IDs. The first laden generation was rejected because it painted checkerboard blocks beneath three hulls. A built-in edit removed those blocks to real transparency; the accepted image was copied without local pixel processing.

The final generation prompts and source paths live in the delivery module. Art was produced with the built-in `image_gen.imagegen` tool using `wildlife-deer.png`, `animal-motion.png`, and `steamboat-moored.png` as style and identity references.

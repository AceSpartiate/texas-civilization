# Colony hardwood delivery — 2026-10-11

Completes the remaining September 15 colony-tree parent group: seven additional hardwood identities and the requested pecan stump. The original named tree species, size drawings, shortleaf pine and felled timber were delivered in earlier batches.

## Full manifest

| Upright sprite | Authored wind frames | Loop |
| --- | --- | --- |
| tree-water-oak | tree-water-oak-gale-1, tree-water-oak-gale-2 | tree-water-oak-gale |
| tree-bur-oak | tree-bur-oak-gale-1, tree-bur-oak-gale-2 | tree-bur-oak-gale |
| tree-white-oak | tree-white-oak-gale-1, tree-white-oak-gale-2 | tree-white-oak-gale |
| tree-texas-oak | tree-texas-oak-gale-1, tree-texas-oak-gale-2 | tree-texas-oak-gale |
| tree-hickory | tree-hickory-gale-1, tree-hickory-gale-2 | tree-hickory-gale |
| tree-walnut | tree-walnut-gale-1, tree-walnut-gale-2 | tree-walnut-gale |
| tree-ash | tree-ash-gale-1, tree-ash-gale-2 | tree-ash-gale |
| stump-pecan | None: rigid felled stump | None |

22 frames on three sheets: colony-hardwoods (4×2), colony-oak-gales (4×2), colony-compound-gales (2×3). Every wind clip has two authored drawings, 600 ms each, looping, with no procedural motion. Pair logical heights are normalized to prevent crop-height pulsing. The PNGs were generated with the imagegen skill and copied unchanged; exact prompts, references and selected original paths are in scripts/art-deliveries/colony-hardwoods-2026-10-11.mjs and docs/art-prompts.json. Alpha is audited without editing source images.

## Integration and Claude contract

sim/woods.mjs binds seven species to their own sprites and pecan to stump-pecan. Tree kinds retain their ordering, wood yields, uses and felling effort. Distribution, save format and visibility rules are unchanged.

public/weather-art.js selects the first authored wind pose in a hard norther through the existing cached ground renderer. Both poses are available through drawClip for animated close views; this delivery does not invalidate the whole forest cache every animation frame. Missing wind art falls back to the same upright identity with the existing lean. Do not double-shear the authored gust drawings.

These additional breadth sprites use mature silhouettes scaled through the existing pole/log/large display sizes. They are not separate botanical juvenile/old-growth drawings. The original request's seven explicitly named species already have their sized artwork; this delivery replaces the remaining stand-ins listed by the backlog audit. Species-specific stumps other than pecan and seasonal/bare-leaf variants are not implied.

## Botanical grounding and limits

The four oaks use distinct regional identities: water oak (Quercus nigra), bur oak (Q. macrocarpa), white oak (Q. alba), Texas red oak (Q. buckleyi). Texas oak here follows the Central Texas limestone identity, not Q. texana/Nuttall oak. Sources: [USFS water oak](https://research.fs.usda.gov/silvics/water-oak), [USFS bur oak](https://research.fs.usda.gov/silvics/bur-oak), [USFS white oak](https://research.fs.usda.gov/silvics/white-oak), [Texas A&M Texas oak](https://texastreeid.tfs.tamu.edu/content/TreeDetails/?id=90).

Walnut uses a representative black-walnut form; ash a representative green-ash form. The generic simulation categories can include other regional species, so this artwork does not redefine the ecology. Sources: [USFS black walnut](https://research.fs.usda.gov/silvics/black-walnut), [USFS green ash](https://research.fs.usda.gov/silvics/green-ash). Hickory is a representative Carya silhouette; exact regional species identification is not asserted. The stump follows the existing pecan bark palette and broad flared roots; growth rings are stylized. [USFS pecan](https://research.fs.usda.gov/silvics/pecan).

Leaf clusters are an illustration intended to distinguish crowns at game scale, not a botanical identification plate. No fruit/flowers, season switch or new terrain is baked into the sprites.

## Verification

- Strict atlas build: 100% retained visible pixels, zero overlap trimming for all new frames.
- Focused tests cover species identities and unchanged economics, the full art inventory, woodland projection, weather selection, authored clip registration and HTTP assets.
- Production browser proof draws seven upright identities, both authored gusts for each, and the pecan stump beside the established character scale. Both phases differ; fair-weather pixels match direct upright rendering. No browser errors.
- Evidence: docs/evidence/colony-hardwoods-art.png and colony-hardwoods-art.json.
- Reproduce: node scripts/colony-hardwoods-art-proof.mjs with the normal Playwright runtime variables.

Broad remaining backlog after this delivery: **13 dated parent groups**. No deployment performed.


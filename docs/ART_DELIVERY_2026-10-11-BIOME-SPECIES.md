# Regional tree species — complete September 19 country artwork group

The five remaining species stand-ins are replaced: anacua, Texas ebony, water tupelo, cedar elm and black willow. The original longleaf/cypress/palm/beech/magnolia and ground-cover deliveries remain in use. Together they close the September 19 country-of-1836 artwork group.

## Full manifest

| Upright sprite in biome-species.png | Gust sprites in biome-species-gales.png | Authored loop |
| --- | --- | --- |
| tree-anacua | tree-anacua-gale-1, tree-anacua-gale-2 | tree-anacua-gale |
| tree-texas-ebony | tree-texas-ebony-gale-1, tree-texas-ebony-gale-2 | tree-texas-ebony-gale |
| tree-water-tupelo | tree-water-tupelo-gale-1, tree-water-tupelo-gale-2 | tree-water-tupelo-gale |
| tree-cedar-elm | tree-cedar-elm-gale-1, tree-cedar-elm-gale-2 | tree-cedar-elm-gale |
| tree-black-willow | tree-black-willow-gale-1, tree-black-willow-gale-2 | tree-black-willow-gale |
| tree-black-willow-pole | tree-black-willow-pole-gale-1, tree-black-willow-pole-gale-2 | tree-black-willow-pole-gale |

Eighteen frames in two sheets; six two-phase loops, 600 ms per phase / 1.2 seconds per cycle. These are separately authored drawings, not runtime shear claimed as new animation. All are rooted, transparent, complete silhouettes in the existing warm outlined painted style. The gust palette was corrected after visual review to preserve the upright olive foliage.

## Botanical basis

- [Texas A&M–Kingsville wildlife institute: anacua](https://www.ckwri.tamuk.edu/plant/anaqua): rounded semi-evergreen crown and multiple trunks. The sprite uses dense oval-leaf clusters.
- [UF/IFAS: Texas ebony](https://ask.ifas.ufl.edu/publication/ST483): compact rounded evergreen canopy, short trunk, fine dark leaflets and short thorny branches. These cues distinguish it from a generic oak; no seasonal flowers or pods are asserted.
- [US Forest Service: water tupelo](https://research.fs.usda.gov/silvics/water-tupelo): swollen base, long clear tapering trunk, southern swamp/floodplain habitat. The art excludes cypress knees and baked water.
- [Virginia Tech / Texas A&M cedar elm description](https://dendro.cnre.vt.edu/dendrology/carddetail.cfm?ID=912): small rough toothed leaves, furrowed bark and a broadleaf crown. The sprite is an elm, not a cedar conifer.
- [Texas A&M Forest Service: black willow](https://texastreeid.tfs.tamu.edu/content/treedetails/?id=114): upright branching, narrow lanceolate leaves and riverbank habitat. Loose trailing twigs are illustrated; this is not the ornamental weeping willow's ground-length curtain.

These are stylized identifying forms for the map, not taxonomic specimen illustrations or measured historical individuals. The game's existing biome model decides distribution. No new ecological claim, flowering calendar, seasonal leaf loss or spring/winter variant is implied.

## Integration and limits for Claude

sim/woods.mjs KINDS now names the five distinct species sprites. Their order, logs by size, timber use and felling effort remain unchanged. Willow's pole-size uses the new juvenile silhouette; other species use their delivered identity scaled through the existing pole/log/large drawing sizes. Species-specific juvenile sets were not part of this remaining silhouette request. Stumps retain the existing generic hardwood/softwood choices.

public/weather-art.js GALE_POSES selects each species' first authored gust in a norther. It preserves same-identity upright art with wind lean if the gust sheet is unavailable. The kept ground still redraws on weather changes, rather than animating all trees every frame. Six clips are available to animate close views with drawClip and the scene's timeMs; callers should preserve reduced-motion and paused-scene behavior. This delivery does not change the ground-cache policy.

scripts/build-atlas-manifest.mjs gives each gust pair one logicalHeight measured from both poses, preventing alternating source crops from changing scale. Both sheets are generated raster art copied unchanged. The strict overlap/crop builder threshold is retained. Source corners have at most 2/255 alpha rounding residue, essentially clear in the reviewed game composition; every visible sprite retains 100% of its pixels.

## Verification

tests/biome-species-art.test.mjs checks all identities and unchanged wood economics; complete eighteen-frame crops; authored loop registration and equal pair scale; wind selection without double shear; and same-identity unloaded fallback.

All forty tests pass across the new species tests and existing woods, woods-view, weather-art, asset HTTP and full art-library suites. The weather test's explicit allowed-species roster now includes these six delivered identities.

scripts/biome-species-art-proof.mjs uses production art and weather helpers to render six upright identities and twelve gust poses beside a game person. It verifies two distinct images per loop and exact fair-weather pixel preservation. Evidence: evidence/biome-species-art.png and .json.

Prompts, reference images, selected generated paths and palette refinement are recorded in scripts/art-deliveries/biome-species-2026-10-11.mjs, art-prompts.json and art-provenance.json. No deployment performed.

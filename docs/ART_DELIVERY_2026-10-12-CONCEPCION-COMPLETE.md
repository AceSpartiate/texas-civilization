# Concepción and Grass Fight completion — 2026-10-12

Completes the remaining **artwork** listed for the September 25 parent group: cut banks and river bend, Mission Concepción, harnessed retreating mule riders, a padre and separate casualty-cart states. Earlier fog, bank-action, bugler/drummer, grass-pack mules and creek pieces remain in their existing deliveries.

## Full manifest

| Sheet | Sprites | Authored clip / duration |
| --- | --- | --- |
| concepcion-mission | mission-concepcion | Rigid exterior |
| concepcion-bank-terrain | riverbank-cut-e, riverbank-cut-w | Rigid opposing bank faces |
| concepcion-bank-terrain | river-bend-1 through -4 | river-bend, 4×350 ms |
| concepcion-limber-riders | limber-mules-e-1 through -4 | limber-mules-walk-e, 4×220 ms |
| concepcion-limber-riders | limber-mules-s-1 through -4 | limber-mules-walk-s, 4×220 ms |
| concepcion-limber-riders | limber-mules-n-1 through -4 | limber-mules-walk-n, 4×220 ms |
| concepcion-aftercare | padre-walk-1 through -4 | padre-walk, 4×240 ms |
| concepcion-aftercare | casualty-cart-wounded-1 through -4 | casualty-cart-wounded, 4×240 ms |
| concepcion-aftercare | casualty-cart-covered-1 through -4 | casualty-cart-covered, 4×240 ms |

31 transparent frames on four sheets, seven authored loops. Every loop has motion:none: drawing changes provide the gait, wheel movement or water highlights. East sprites mirror west; mule riders have independent north/south headings. Padre and carts are east/west only. The mission and soil do not receive decorative motion.

## Mission research and visual limits

The [National Park Service account](https://www.nps.gov/places/mission-concepcion.htm) describes surviving colonial church/convento fabric, the church completed in 1755, and historical painted decoration. The [NPS National Register nomination](https://npgallery.nps.gov/pdfhost/docs/NRHP/Text/78003147.pdf) provides architectural/historical context.

I visually inspected the NPS photograph linked from its place page and revised the initial generic Baroque draft: removed the scalloped central gable and decorative corner urns, changed the entrance to a restrained triangular pediment, added a central oculus and flanking windows, and reduced the dome's dominance. Final art retains twin square bell towers, pyramidal caps, vaulted body, transept and crossing dome in the established painted game projection.

This is a distant **church exterior** illustration, not a measured reconstruction of the entire mission compound or interior. Buff stone, simplified ornament, bells, dome/window proportions and weathering are interpretive. The source does not establish the precise 1835 extent of exterior fresco survival, so a conservative faded finish is used rather than an invented colorful scheme. Modern fences, signs and landscaping are excluded. No new lookouts or bells ringing are staged.

## Terrain and live integration

sim/battles/concepcion.mjs now binds the dedicated cut bank in its existing nine positions and the mission at its existing point and size. Earth-rampart and church-generic remain unloaded-art fallbacks. No encounter coordinates, historical timings, outcomes or save formats change.

The whole river-bend clip is **library-ready**, not substituted for the live geographic water course. Its C-shaped bottomland is a reusable illustration, not a survey. The existing projected river polyline remains authoritative. Before adoption, register its water/shore footprint to that course or use it in an explicitly schematic scene; do not stretch it across the map or add a second conflicting river.

The cut-bank illustration represents the requested exposed soil lip and rough foot steps. Its drawn size inherits the existing battle's illustrative person/prop scale, not a newly surveyed six-foot wall. Original woodland and geography remain server-owned.

## Retreat and care scenes

Project research records men escaping two or three to a caisson mule and a padre arranging carts for Mexican dead and wounded after speaking with Austin. See HISTORY.md HIST-TEX-480/481 and docs/battle-research/staging.md §1. The new rider illustration chooses **two** anonymous regulars on one harnessed mule, without claiming a unit identity or exact uniform. The second gun's reported six-mule team is a separate formation fact: do not infer twelve riders by copying this illustration six times.

The mule art supplies the harnessed animal/riders; existing gun/limber art can remain separate. Physical trace attachment and team spacing require compositor registration, not invented new historical counts. No attached caisson/gun is baked into this source.

The padre is unnamed; black cassock, appearance and footwear are interpretive, with no claim about a religious order. Wounded-cart art has an alert living passenger with a clean bandage/blanket. Covered-cart art has fully covered anonymous forms; no wounds, exposed remains or blood. These variants must remain semantically separate.

These transport assets are **library-ready rather than newly simulated actors**. A future scene must gate mule riders to the retreat and care actors to the post-fight collection, using the existing projected encounter's visibility. Route motion should use authoritative positions with screen interpolation. Render paused/held frames through the standard animation API. Do not add deaths, move named casualties, alter family fates, or reveal a battle to a distant household through decorative scenery.

## Provenance and verification

Exact prompts, reference paths and selected/rejected source paths: scripts/art-deliveries/concepcion-complete-2026-10-12.mjs, docs/art-prompts.json and docs/art-provenance.json. Mission architecture received a correction after visual comparison. The first cart atlas crossed cell boundaries slightly; the selected spacing refinement is recorded in docs/evidence/concepcion-aftercare-spacing.json. Selected PNGs were copied unchanged, with no programmatic raster editing.

Every final frame retains 100% of visible pixels with zero overlap trimming. Logical heights normalize each mule/care row and all four bend phases to prevent crop-height pulsing. The browser proof verifies 31 drawn frames and four distinct rendered phases for every loop, with zero page errors.

Evidence: docs/evidence/concepcion-complete-art.png and .json. Reproduce with scripts/concepcion-complete-art-proof.mjs and the normal Playwright runtime variables. Focused tests cover catalogue completeness, scale, source alpha, scene bindings/fallbacks, Concepción/Grass Fight staging, existing grass/creek art and HTTP assets.

Final verification: **30 unit checks and all 13 live Concepción browser checks passed**, including zero page errors. Live evidence: docs/evidence/battle-1835-browser.json.

**9 dated parent artwork groups remain.** No deployment performed.


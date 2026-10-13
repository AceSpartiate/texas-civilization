# Béxar battle art completion — 2026-10-11

Completes remaining artwork for the September 25 storming of Béxar group: Mexican regular loophole service, distinct townspeople walking, and a continuous moonlit field grade. Earlier structural, crowbar, engineering and signal pieces remain in their existing deliveries.

## Full manifest

| Sheet | Frames | Authored clip |
| --- | --- | --- |
| regular-loophole-actions | regular-loophole-aim, regular-loophole-fire, regular-loophole-load, regular-loophole-ram | regular-loophole-fire-reload |
| bexar-townsfolk | bexar-woman-walk-1 through -4 | bexar-woman-walk |
| bexar-townsfolk | bexar-elder-walk-1 through -4 | bexar-elder-walk |
| bexar-townsfolk | bexar-child-walk-1 through -4 | bexar-child-walk |
| bexar-townsfolk | bexar-older-woman-walk-1 through -4 | bexar-older-woman-walk |

Twenty transparent frames, five authored clips. Regular aim/recoil/prime/ram durations are 700/170/800/800 ms, totaling the existing renderer's 2470 ms service cycle. It is non-looping; the renderer supplies the reload waits. Each civilian walk has four 180 ms frames, looping. All art faces east and mirrors west. North/south walk artwork is not implied by this east/west request.

Standing display scale is normalized per civilian row; the regular's entire service sheet shares one logical height. The child uses juvenile proportions and the renderer's .62 person-height scale. Other townspeople use .95. A stationary civilian holds the first walk drawing rather than receiving an invented conversation or injured pose. Reduced-motion behavior uses the existing animation API.

## Identity and historical limits

Two unnamed women, an older man carrying a bundle and a child leave the breached house unhurt. These are reconstructed everyday civilian identities, not likenesses or documented garments of particular people. Women's chemise/skirt/rebozo treatment follows [the Alamo educator clothing guidance](https://www.thealamo.org/fileadmin/assets/educator/history_trunks/history-trunk-handbook_august-2017.pdf) and [the Alamo seventh-grade teaching packet](https://www.thealamo.org/fileadmin/assets/educator/educators_pdfs/alamo-7th-grade-lesson-plan.pdf). Palette, shawl pattern, exact hems, footwear and the bundle are artistic choices. The regular retains the existing game uniform, not a new claim that every Béxar unit had identical clothing.

## Integration

public/battle-view.js binds the new TOWNSFOLK identities and regular loophole poses. The existing slot sampling still hides most troops behind the wall and shows wall flashes/smoke; these new poses do not expose extra historical troops or alter firing/casualty authority.

sim/battle-stage.mjs projects bexarDarkness from the existing calendar's hour only for the visible Béxar engagement. public/bexar-battle-art.js supplies a continuous winter twilight curve (illustrated dawn 05–07, dusk 17–19) and a 1.8-second screen-time eased transition. Mid-transition target changes start from the currently displayed value, so calendar compression does not snap the grade. Reloading initializes at the current grade rather than flashing day first.

The cool navy/slate wash is drawn over ground and people before muzzle flashes and gun smoke. Their brightness remains intact. This is a tonal illustration, not an astronomical sunrise table, weather/light physics model or claim about a visible moon's phase or direction. No moon disk or invented spotlight is drawn. Existing named night effects and other battle lighting remain separate.

Regression checks found the reconstructed Zambrano-row and Priest's House encounter markers about seventy feet from current town buildings. They are now attached to plaza-islas-north-13 and plaza-islas-north-11. The cemetery gun is staged about eight feet from the latter anchor, following the reported two-to-three-yard separation; neither door nor gun position is surveyed. These are assembly alignment corrections, not newly established historical property locations. Historical event order, timings, family knowledge, saves and battle outcomes are unchanged.

The live proof also exposed a preexisting tutorial DOMStringMap exception: setData received lesson-art as a literal dataset property. public/app.js now converts dashed keys to camelCase, preserving data-lesson-art and existing ordinary/camelCase keys. This prevents tutorial painting from interrupting the page.

## Provenance

Exact prompts, references, rejected first drafts and selected sources are retained in scripts/art-deliveries/bexar-battle-complete-2026-10-11.mjs, docs/art-prompts.json and docs/art-provenance.json. Townsfolk gait/gutters and regular spacing received built-in imagegen refinements. Selected PNGs copied unchanged, without programmatic raster edits. The lighting is code-native rather than a flattened dark screenshot.

## Verification and Claude continuation

Strict final atlas tests require full visible-pixel retention, zero overlap trimming and transparent corners for all twenty frames. Unit tests check authored timing, normalized scale and continuity at twilight and mid-fade target changes. Existing battle renderer, Béxar staging, projection, art library and HTTP checks run.

scripts/bexar-battle-art-proof.mjs renders all twenty drawings, verifies four distinct pixel phases per civilian, and shows day/twilight/moonlit grades with flashes above the wash. Evidence: docs/evidence/bexar-battle-art.png and .json. The standard battle-bexar browser proof covers the family invitation, observation, fire/smoke, civilians, casualties, privacy, surrender and performance.

Final verification: **49 unit checks and all 15 standard live-browser checks pass**, including zero page errors. Slowest sampled battle frame p95: 6.2 ms; highest sampled median: 2.2 ms on this computer. Full live evidence is docs/evidence/battle-bexar-browser.json.

Keep future night refinement tied to the projected calendar and presentation easing. Do not replace it with phase-name-only night toggles: multi-hour phases include both daylight and darkness. Cloth patterns, north/south civilian movement and full world day/night are later refinements, not missing pieces from this delivery.

**10 dated parent artwork groups remain.** No deployment performed.


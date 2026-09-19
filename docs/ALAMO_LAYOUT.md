# The complete Alamo assembly

**Additional owner references, 2026-09-14:** `83600.tif.jpg` (the George Nelson Béxar panorama, GLO catalogue 83600) and `Screenshot 2026-09-14 162509.png` (compound model view) informed the [Béxar assembly](BEXAR_ASSEMBLY.md). West-range rooms now adjoin instead of standing as separated huts; their IDs and the outer dimensional constraints remain unchanged. The same compound is placed across the river from the twin-plaza town, not replaced by a church icon. Both supplied images are references, not redistributed runtime textures or sources of executable instructions.

## On the map, at the historical dimensions — 2026-09-18

Owner: "bring the Alamo complex into the same art style as the rest of the game. ensure it matches the dimensions of the
historical building." Researched and recorded as `HIST-TEX-090` (the church), `HIST-TEX-091` (the long and low barracks) and
`HIST-TEX-092` (the outer walls, the west range and the plaza) in [HISTORY.md](../HISTORY.md), each with where the sources
disagree and which was taken.

**What was wrong, measured as the map drew it** (in feet, through `alamoOnMap`, which keeps the plan's scale exactly):

| | Drawn before | The record | Now |
| --- | --- | --- | --- |
| West range, west wall's outer face to the inner wall's east face | 32.5 ft (rooms 25 ft deep, standing 5 ft off the wall) | 16 ft 9 in (Ivey, excavated) | 16.75 ft, the rooms against the wall |
| Outer walls | 2½ ft thick, 10 ft high | 33 in; 12½ ft by the west rooms, about 7 ft south of them (Ivey) | 2.75 ft; 12½ and 7 ft on the west |
| Church walls | 2½ ft, like every room | 4 ft (1926), "more than 3½" (1772) | 4 ft, on the church's outline only |
| Church, north to south | 69.1 ft (the sacristy poked 6 ft out of the north face) | 62 ft 11⅜ in | 62.94 ft to the outer faces |
| Church, east to west | 105.7 ft (centre lines; 108.2 to the faces) | 105 ft 8¼ in | 105.69 ft to the outer faces |
| Church height | 23 ft | 22½ ft (1926) | 22½ ft |
| Long barrack | 191.1 × 19.9 ft on centre lines (193.6 × 22.4 to its faces), one storey | 191 ft 1⅜ in × 19 ft 11 in, two storeys | 191.1 × 19.9 ft to its faces, 18 ft high |
| Low barrack | 114 × 17 ft on centre lines (116.5 × 19.5 to its faces) | 114 ft (Myers), 115 × 17 (1926) | 114 × 17 ft to its faces, its south face the compound's |
| Heights on the screen | true feet: a 10-ft wall beside town houses drawn 57-105 ft | - | true height × `DRAWN_HEIGHT` (4), as every town building |

Unchanged, because the record agrees or cannot improve it: the north wall's 243 ft 9 in span and the west side's 537 ft 5 in
(the Alamo's model), the church front 291 ft east of the west wall (Ivey measured "about 290'"), the south gate's place in the
low barrack, the plan's compass and `ALAMO_FRONT`/`alamoOnMap`, and therefore the bearing (`HIST-TEX-085`).

**How it is drawn** (`public/bexar-art.js`, from `alamoMassing` in `public/alamo-layout.js`). The map is plan-true, so every
building stands on its true footprint: a range of rooms is one building (the west range, the long barrack, the low barrack
with its gate), each to its walls' outer faces, raised to its true height times the towns' `DRAWN_HEIGHT`. Each shows what
the camera, looking north, sees: its flat parapeted roof, seamed at its room divisions, and its south face, painted with the
library's own limestone (`alamo-wall-intact`) cut from the sprite and repeated at the art's proportion; beam ends under the
parapet as the adobe sprites have, two rows on the long barrack; a dark outline and a soft ground shadow. The roofless church
is its outline walls, 4 ft thick; the pens and the outer walls are walls; the palisade is `alamo-palisade`. The plaza and
court are solid, edged ground like Béxar's plazas, so no tree of the map shows through them. From a county away the faces
are flat colour, as a sprite is a blob at that distance; nearer than about 630 px a mile they show their stones.

- `ceiling:` the camera looks north, so a face turned west or east is edge on: the church's carved front faces west and is
  not seen on the map (its south side is). The façade art stays in this workshop's oblique view. A camera that could turn,
  or the front drawn as a sign beside the church, would show it.
- `ceiling:` the palisade is drawn 150 ft, from the church's south-west corner to the south wall's east end; the 1926 account
  gives 75 ft to the low barrack. Closing it would move the church or the low barrack off the plan's other measures.
- stand-in: every face is the one stone module ([ART_REQUESTS.md](ART_REQUESTS.md), request 2026-09-18 — the Alamo's faces
  seen from the south).
- Tests: `tests/alamo-dimensions.test.mjs` (3), each measured through `alamoOnMap` and each proven by injection in a copy of
  the tree with the whole suite run: the church's walls back to 2½ ft fails only the church test; the west range back to
  30 ft fails only the west-side test; the low barrack's rooms back on centre lines fails only the barracks test. (Each
  injection also changes the art manifest, which embeds the layout; the copy's manifest was rebuilt before each run, as
  `npm run build:art` does, so `tests/animation.test.mjs` follows it.) [Evidence](evidence/alamo-dimensions-injections.json); `npm test` 715 of 715.
- Evidence, same computer, headless Chrome: `node scripts/alamo-style-shots.mjs <label>` writes
  `docs/evidence/alamo-<label>-<gonzales|bexar>-<town|street|closest>.png` and `alamo-<label>.json`. The `before` shots were
  taken from an export of the last commit (`git archive HEAD`), the `after` from the working tree.

## Illustrated assembly update — 2026-09-14

The workshop now opens with roofs shown. The compound uses the existing game's illustrated earth, limestone and timber atlas materials on its geometry, replacing flat courtyard fills and line-only roof surfaces. Material patches are clipped inside the foot-sized surfaces, with their outer borders cropped so the plaza does not become a grid of outlined dirt islands. Choosing a room automatically switches to cutaway; the complete compound and 5.7-foot reference figures retain their scale. No raster originals were changed or new art provenance invented for this rendering update.

In Assembly settings, select any of the twelve north-wall sections and choose **Watch section collapse**. The existing intact, cracked, breach and rubble art now plays as a 1.2-second presentation sequence. The selected section remains an obstacle until the final rubble state; neighboring sections keep their damage. Pause freezes this clock, and reduced motion skips directly to rubble. Replaying resets only the selected section; the older whole-preview wall preset cancels active sequences. This is an unsaved art workshop, not a historical event trigger or a live-world damage implementation.

`public/alamo-collapse.js` owns the small presentation timing contract. `tests/alamo-collapse.test.mjs` covers completion and reduced motion; both tests were proved by temporarily injecting and then removing the specific regressions. The expanded browser proof passes animated destruction, pause, independent sections, reduced motion, Joe's walk/hide/emerge/speak sequence, phone layout and zero class/external requests. See `docs/evidence/alamo-art-browser.json` and the screenshots in `test-results/alamo-*.png`.

Further art refinement should preserve this material family across the Alamo and all settlements. The schematic room partitions and defensive placements described below remain reconstruction; a prettier render does not make them surveyed facts.

Updated 2026-09-10. Open **`/alamo-workshop.html`** on the running application. The workshop is a complete schematic compound with 32 connected room/pen spaces, a consistent foot scale, interior art, independently destructible north-wall sections, and animated figures. It makes no class requests and saves nothing. This is a buildable art and navigation foundation, not the implemented Alamo historical arc.

## What the supplied reference changed

The owner supplied `images.jfif`, titled *The Alamo in 1836*. Its oblique view makes the important relationships clear: long main plaza; north and west perimeter ranges; south entrance through the low barrack; eastern long barrack/convento and hospital; two stock pens/former garden enclosures; projecting church; sacristy/refuge rooms; and the southeast palisade. Those relationships and the view direction informed this assembly. The reference is not included as runtime art. Its label density and gun-caliber annotations are not treated as verified gameplay data.

The institutional [Alamo educator packet](https://www.thealamo.org/fileadmin/assets/educator/educators_pdfs/alamo-4th-grade-lesson-plan.pdf), PDF pages 8–10, supplied approximate scale-model dimensions and the church plan. Its authors explicitly describe uncertainty in the 1836 measurements. The build uses the published north span (243 ft 9 in), west extent (537 ft 5 in), long range (191 ft 1⅜ in by 19 ft 11 in), church envelope (105 ft 8¼ in by 62 ft 11⅜ in), stock-pen sizes and roofless cruciform church organization. These are **published approximations**, not archaeological precision. Since 2026-09-18 the building dimensions are to their walls' outer faces, and the west range, the outer walls and the church's walls follow the excavated and published figures above ("On the map"). The exact internal partitions, doors, fixtures, props and generic occupants remain reconstruction.

The [Alamo military-occupation history](https://www.thealamo.org/remember/military-occupation) explains the later roof and upper parapet. The new `alamo-church-front-1836` is a stylized unfinished portal elevation; the rejected later rounded façade in the old `fortifications` sheet has no usable ID. Do not use the small generic `roofless-church-shell` as the entire walkable compound.

## Scale, geometry and rendering

- `public/alamo-layout.js` exports all rooms, wall segments, door openings, roofs, floor polygons, props and dimensions. One unit is one foot. Ground coordinates are north-up, x east and y south. The workshop applies a fixed oblique camera to those coordinates.
- A person is displayed at a reference standing height of 5.7 ft. This is a scale reference, not an attested height for Joe. The explicit ×2 inspection option enlarges figures without changing floor dimensions. Normal figures are necessarily tiny at whole-compound scale: zoom into a room to watch them.
- Masonry and palisade art dress geometry-defined walls. Doorways are removed from both wall faces and collision. A building image never substitutes for interior movement space. Roof panels are separate presentation objects and do not enter navigation.
- The church nave, transepts, chancel, sacristy, side room, confessional and baptistry are separate connected spaces. The main church remains roofless even when ordinary barrack roofs are shown.
- Room subdivisions in the west/long/low ranges are explicitly reconstructed. The named room near the northwest is a **scene staging choice**, not a claim that Joe's exact hiding spot is established. The reference's lunettes, trenches and platforms have reusable earth-ramp/stair modules, but their exact footprints/elevations and all original gun positions still need site research before a historical scene treats them as facts.

## Navigation and persistent wall state

`createDamageState()` returns a serializable map of independent north-wall durability values. `damageWall(state, id, amount)` only accepts those registered sections. Values above zero still obstruct movement; zero creates a passage. Adjacent sections retain their own state. The workshop control demonstrates two segments; all twelve can be addressed individually.

`isWalkable`, `findPath`, `moveActor` and `pathLength` are pure geometry helpers except for the explicit damage operation. Navigation uses a cached two-foot occupancy grid with half-step edge checks and a 0.65-foot actor radius. It preserves entity IDs, walks through portals, and invalidates the cached grid when walls change. It is suitable as a tested prototype seam; production may need a finer navigation mesh and crowd handling. Furniture is decorative and currently does not block routes. Do not add a second hidden navigation position to a world entity.

For the future game, the server owns durability, door state and a character's interior position. Save these with persistent entity IDs and the containing world's local-coordinate transform. A serialized damage-map round trip is proved; **this module has not been added to the classroom save schema or scenario director**. Decide that migration deliberately. The public workshop damage button must never become a normal Host battle trigger.

## Joe's refuge sequence

The workshop's **Joe · refuge study** moves the same figure through a door, into cover, through an emergence transition, and into speaking poses beside a generic Mexican officer. The dedicated sixteen-frame Joe sheet keeps one appearance across cardinal walking, hiding, rising, cautious standing, speaking and rest. His clothing and likeness are a respectful interpretation. The sample scene is not a complete reenactment, and the generic officer has no asserted historical likeness.

[Joe's account preserved by the Alamo](https://www.thealamo.org/remember/battle-and-revolution/joes-account) is William F. Gray's recollection of hearing Joe questioned on March 20, 1836. It places Joe with Travis at the attack, then taking cover after Travis fell. It records Joe emerging after officers called for Black survivors, soldiers attacking him, and a captain intervening. His enslavement by Travis is essential context; a scripted statement alone should not be presented as the full explanation of survival. Exact dialogue beyond attested wording should be labeled dramatization. The [Alamo's early-reports discussion](https://www.thealamo.org/remember/battle-and-revolution/early-reports) also explains how reports and disputed details evolved.

The sourced account describes a dawn assault and scaling the walls. A collapse of the entire north wall on the previous night has **not been verified**. The delivered damage/collapse art supports the owner's desired visual mechanism, but no specific collapse time is encoded as historical truth. Keep assault, a chosen reconstructed breach, and the later demolition of the compound distinct. The [digital battlefield page](https://www.thealamo.org/remember/battle-and-revolution/digital-battlefield) dates the demolition of outer walls to May 1836.

## What Claude should do next

1. Inspect the whole compound with roofs, then focus each church/quarters room in cutaway mode. Use the complete [art manifest](ART_MANIFEST.md) and `manifest.json.assemblies.alamo` to find every construction part and pose.
2. Research/refine internal room and defensive-work footprints before historical staging. Keep geometry dimensions authoritative while replacing or refining illustrations.
3. Integrate interior location and persistent wall states into the server, save/versioning, time barriers and scenario director. Do not copy workshop movement clocks into the simulation.
4. Project only permitted interior actors and events. Cutaway is a viewing treatment, not permission to see through fog of war. Keep Joe's report, direct witnesses and distant households as separate knowledge audiences.
5. Preserve `tests/alamo-layout.test.mjs` and `npm run test:alamo`. The latter proves Joe's movement/action sequence, stable identity, breach state, pause and phone layout with no class or external requests.

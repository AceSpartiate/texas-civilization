# The complete Alamo assembly

Updated 2026-09-10. Open **`/alamo-workshop.html`** on the running application. The workshop is a complete schematic compound with 32 connected room/pen spaces, a consistent foot scale, interior art, independently destructible north-wall sections, and animated figures. It makes no class requests and saves nothing. This is a buildable art and navigation foundation, not the implemented Alamo historical arc.

## What the supplied reference changed

The owner supplied `images.jfif`, titled *The Alamo in 1836*. Its oblique view makes the important relationships clear: long main plaza; north and west perimeter ranges; south entrance through the low barrack; eastern long barrack/convento and hospital; two stock pens/former garden enclosures; projecting church; sacristy/refuge rooms; and the southeast palisade. Those relationships and the view direction informed this assembly. The reference is not included as runtime art. Its label density and gun-caliber annotations are not treated as verified gameplay data.

The institutional [Alamo educator packet](https://www.thealamo.org/fileadmin/assets/educator/educators_pdfs/alamo-4th-grade-lesson-plan.pdf), PDF pages 8–10, supplied approximate scale-model dimensions and the church plan. Its authors explicitly describe uncertainty in the 1836 measurements. The build uses the published north span (243 ft 9 in), west extent (537 ft 5 in), long range (191 ft 1⅜ in by 19 ft 11 in), church envelope (105 ft 8¼ in by 62 ft 11⅜ in), stock-pen sizes and roofless cruciform church organization. These are **published approximations**, not archaeological precision. The exact internal partitions, doors, fixtures, props and generic occupants remain reconstruction.

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

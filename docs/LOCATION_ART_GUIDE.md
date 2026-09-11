# Named places and artillery: art assembly guide

Delivery update, 2026-09-10: real sprite IDs for ten location kits are indexed in [manifest.json](../public/assets/frontier-v1/manifest.json). The full Alamo now has a separate 32-space foot-scale assembly, interiors, destructible north wall and animated Joe study; read [ALAMO_LAYOUT.md](ALAMO_LAYOUT.md). Other named places remain modular recipes, not measured completed scenes.

Prepared 2026-09-09. Companion to [ART_COVERAGE_PLAN.md](ART_COVERAGE_PLAN.md). The owner explicitly requested cannons, the Alamo, San Antonio, Goliad, Liberty, Anahuac and other locations involved in the Revolution. This guide translates that request into reusable art components and location-specific assembly rules.

**Status: sourced design guide, not an asset manifest, exact reconstruction, or implemented later arc.** The actual asset catalog determines which pieces are delivered. Recipes below are schematic compositions for the game's illustrated miniature style. Their landmarks are named honestly; undocumented footprints, scales, textures and small buildings remain **PLAUSIBLE RECONSTRUCTION** or **FICTIONAL FOR GAMEPLAY**. Promote checked claims into `HISTORY.md` when the corresponding location is implemented. No source here gives permission to copy a museum photograph, replica, drawing or map as artwork.

## One kit, recognizably different places

Do not make each place a separate game level. A location assembles modular visual parts around its one canonical world position and modeled roads/water/terrain. Persistent people, animals, wagons, artillery and other interactable property remain separate entities, not pixels baked into a town illustration. A location illustration can supply visual scenery, but it must not duplicate a player, reveal unseen activity, or claim a working store/fort/crop that the simulation does not provide.

Source-backed **relationships and building types** are sufficient for a schematic recipe; they are not a surveyed ground plan. Naming a whole diorama "Alamo 1836" is a stronger historical claim than naming a plain reusable piece "roofless stone church." Store the distinction in the asset metadata and assembly documentation. Current museum campuses often combine reconstructed buildings of different dates with modern visitor facilities.

## Named-place recipes

### Gonzales and the cannon

**Assembly:** a modest varied cabin cluster, dirt circulation/commons, nearby scattered farms, Guadalupe bank, the modeled ford, and open oak country. Keep the town east of the Guadalupe; the battle location is a separate upriver place on the opposite bank. Existing `HIST-GONZ-007`–`013` govern these relationships. Keep the already documented modest structure count and avoid inventing a street grid.

**Needed pieces:** varied cabins, rail fences, small utility/cargo parts, river/ford bank accents, oaks, representative field cannon with independent wheels/barrel/smoke where practical. Artillery should remain legible as a physical object, rather than just a formation badge.

**Boundary:** the game's representative Gonzales cannon is not an identification of the museum artifact, caliber, original carriage, or exact number of guns fired. Retain the existing disputed-artillery caution in `HISTORY.md`. [TSHA: Gonzales Come and Take It Cannon](https://www.tshaonline.org/handbook/entries/gonzales-come-and-take-it-cannon).

### San Antonio de Béxar

**Assembly:** a more urban cluster of low masonry/plastered courtyard dwellings and connected building ranges around two open plazas, with a plain older church and adjacent small rooms; river crossings and the Alamo compound form a separate eastern part of the same world. The 1835 siege account locates fortified town plazas west of the San Antonio River and the Alamo east of it. [TSHA: Béxar, Siege of](https://www.tshaonline.org/handbook/entries/bexar-siege-of).

**Needed pieces:** low plastered/masonry dwellings in several widths; continuous street-front wall/door segments; courtyard corners; a long room range; a modest church shell; temporary barricades, trench accents and damaged wall variants. Courtyards and building-to-building movement need visual room that a single "town" sprite cannot provide. Specific material and footprint choices remain schematic until individually checked.

**Boundary:** the two-plaza/river relationship has support; the proposed small-building arrangement does not constitute a verified 1835 map. San Fernando must not inherit its familiar later Gothic façade: the TSHA architecture account dates that extensive remodeling to 1868–1878. Do not use present-day River Walk structures or later urban landmarks. [TSHA: San Antonio de Béxar Presidio](https://www.tshaonline.org/handbook/entries/san-antonio-de-bexar-presidio), [TSHA: Architecture](https://www.tshaonline.org/handbook/entries/architecture).

### The Alamo, 1836

**Assembly:** an irregular enclosed former-mission compound with a **roofless church shell**, a distinct long limestone barrack range, connecting perimeter walls, gate openings and restrained defensive earth/timber components. Keep rooms/walls as modules, with an open court that can contain authorized people and artillery.

**Needed pieces:** roofless church with plain unfinished upper silhouette; long barrack; straight/corner/broken limestone walls; gatehouse/open gate; low room blocks; earth ramp/defensive bank; timber barrier; cannon at ground/ramp-compatible anchors. The church needs interior transparency/open-top treatment rather than a solid brown roof.

**Boundary:** the Alamo's institutional history attributes its first roof and familiar upper parapet to later U.S. Army occupation. Its Long Barrack page also describes later roof/stair additions and substantial changes to the surviving walls. Those modern forms cannot stand in for 1836. Exact wall positions, elevations, room counts, defensive works and gun placements require a dedicated checked plan; the modular recipe is not one. [The Alamo: Military Occupation](https://www.thealamo.org/remember/military-occupation), [The Alamo: Long Barrack](https://www.thealamo.org/visit/whats-at-the-alamo/long-barrack).

### Goliad and Presidio La Bahía

**Assembly:** a masonry presidio enclosing a quadrangle, with barracks/quarters and a distinct chapel; a nearby civilian settlement and the San Antonio River must remain distinguishable from the military enclosure. The THC explicitly identifies La Bahía as a **fort**, with a chapel inside, rather than a mission. [THC: Presidio la Bahía History](https://thc.texas.gov/state-historic-sites/presidio-la-bahia/presidio-la-bahia-history).

**Needed pieces:** connected low masonry room ranges, solid perimeter wall, corner/bastion shapes, gateway, plain chapel, courtyard ground, small civilian dwellings, river approach, rest/captivity and care poses. The enclosure can be repurposed through capture, occupation and captivity without replacing it with a new map. Non-graphic aftermath belongs to state/narration and dignified poses, not a graphic corpse asset set.

**Boundary:** the modern north-bank Goliad townsite should not be copied into 1835–1836. TSHA describes the old town becoming largely deserted and Anglo-American residents moving north of the river after San Jacinto. Modern courthouse-square imagery is therefore especially unsuitable. The restored presidio also needs date-specific review before exact architectural claims. [TSHA: Goliad, TX](https://www.tshaonline.org/handbook/entries/goliad-tx).

### Liberty

**Assembly:** a small Trinity river community with a landing/shore approach, cargo and modest dwellings/working buildings among wooded ground. Keep the navigable river and road approach visually important. The town's role as a shipping point and the arrival of an Alamo appeal in February 1836 support a place where goods, volunteers and information pass through. [TSHA: Liberty, TX](https://www.tshaonline.org/handbook/entries/liberty-tx-liberty-county).

**Needed pieces:** adaptable small dwelling/store/office shells; plain river landing/bank access; crates, sacks and barrels; small boat; road and timber; walking/mounted courier and household/wagon assets. Building materials and specific frontage are generic reconstructions, not verified Liberty houses.

**Boundary:** no courthouse dome, railroad, paved road, large commercial waterfront or exact 1835 street plan. The Atascosito road crossing north of town is not authorization to paint a bridge directly beside every Liberty building. No particular ferry mechanism, named dock or building count is established by this narrow source check.

### Anahuac and the disused fort

**Assembly:** a bay/river-mouth bluff with a **disused, damaged brick fort** and a modest separate port settlement. Reuse brick wall, redoubt/bastion, barrack ruins and burned timber pieces rather than a stone mission façade.

**Critical date distinction:** TSHA describes a permanent brick fort begun in 1831, its dismantling and fire damage in 1832, disrepair during the attempted 1835 reopening, and Tenorio having **no artillery** during the June 1835 confrontation. It was not used again after the garrison left. For this game's September 1835 onward timeline, do not depict an operational cannon-filled fort or silently restore its earlier defenses. [TSHA: Fort Anahuac](https://www.tshaonline.org/handbook/entries/fort-anahuac).

**Needed pieces:** worn reddish brick wall and broken wall, low redoubt corner, ruined room footprint, burned wood fragments, bay bank/bluff accent, shore cargo and small port dwellings. An intact earlier fort can remain a separately dated educational reconstruction if that feature is later authorized. No tunnel, magazine location, wall measurements or gun quantity is implied by this schematic kit.

### San Felipe de Austin

**Assembly:** a modest commercial river town with varied small buildings, a tavern/outbuilding group, printshop cues, dwellings and the Brazos approach. Its evacuation/burning must have persistent damaged/abandoned alternatives. THC's visitor guide discusses a printshop in the Peyton tavern complex and the town's civic/commercial buildings; the history page anchors the March 1836 burning. [THC: San Felipe Visitor Guide](https://thc.texas.gov/public/upload/publications/SFdA_VisitorsGuide_WEB_1.pdf), [THC: San Felipe de Austin History](https://thc.texas.gov/state-historic-sites/san-felipe-de-austin/san-felipe-de-austin-history).

**Needed pieces:** small timber/frame commercial shell, tavern with attached/separate outbuilding, office/storefront alternative, stacked papers/simple press accessory, ordinary house, river landing, fire-damaged versions and carried household goods. A sign can be plain or text supplied by the interface rather than illegible lettering baked into art.

**Boundary:** choose named building placements only from a checked townsite plan. Modern exhibit buildings are interpretations; the whole museum layout is not the 1836 town. The art kit provides plausible building types and condition states, not exact original elevations.

### Washington-on-the-Brazos

**Assembly:** a rough early town grown around a Brazos ferry landing, with a conspicuously **unfinished frame meeting building**, small cabins and working buildings. That unfinished frame structure is the historically appropriate convention setting, rather than a grand capitol. [THC: Washington-on-the-Brazos History](https://thc.texas.gov/washington-brazos-complex/washington-brazos-history).

**Needed pieces:** unfinished timber/frame hall, plain cabin, modest workshop, ferry/landing and rough road; optional long meeting table/papers for a future interior or close view. The hall's silhouette should differ from both a chapel and a cabin.

**Boundary:** the current historic-site complex mixes reconstructed structures and later residences. Its own guide describes buildings covering the 1830s–1850s and Barrington's later history; the present entire campus cannot be copied as March 1836 scenery. Exact hall form/height should be checked against the documentary descriptions before an "accurate reconstruction" label. [THC: Explore Washington-on-the-Brazos](https://thc.texas.gov/washington-brazos-complex/explore-washington-brazos-complex).

### San Jacinto battleground

**Assembly:** open coastal prairie with tall grass, a low intervening ridge, wooded edges, marsh/water and two encampments; troops and guns occupy it only from authorized scenario state. The site guides describe the prairie, ridge and marsh relationship. Keep a shallow ridge rather than dramatic hills. [TPWD: San Jacinto Interpretive Guide](https://tpwd.texas.gov/publications/pwdpubs/media/pwd_br_p4504_0088.pdf), [THC: San Jacinto Site Map](https://www.thc.texas.gov/public/upload/historic_sites/sanjacinto_battleground/San%20Jacinto%20Battleground%20site%20map_final.pdf).

**Needed pieces:** tall grass, marsh reeds/shallow water, broadleaf woodland, low terrain shading, tents/bedrolls/supply bundles, representative artillery, movement/smoke/surrender/aid poses. Do not make this a walled fortress or town.

**Boundary:** no San Jacinto Monument, modern ship, visitor road or industrial shoreline. A modern site map can support historical interpretation but includes modern features; do not trace it wholesale. Exact troop locations, camp extent and timing remain a later Battle Director research task.

## Artillery kit: physical pieces and event bindings

Provide independent **field cannon**, **carriage/wheels**, **tow/limber or supply accessory**, **rammer/crew accessory**, **small muzzle flash** and **smoke** pieces or equivalent separately addressable frames. Artillery needs consistent ground anchors and several usable facings; an icon alone is insufficient for people working around it. A cannon itself is persistent property when the model treats it that way; smoke is a short-lived presentation effect, never a second simulated weapon.

| Binding | Reusable appearance | Source / restriction |
| --- | --- | --- |
| Gonzales | Representative wheeled cannon | Keep current `HISTORY.md` dispute boundary; no exact artifact/caliber claim |
| Béxar / Alamo / Goliad | Shared field-gun and defensive-position assets with event-specific arrangement | This guide does not establish a battery count, caliber, carriage type or precise placement |
| San Jacinto Twin Sisters | Two separately placed iron-gun appearances; optional red-carriage/blue-wheel-stroke variant | The updated [TSHA Twin Sisters entry](https://www.tshaonline.org/handbook/entries/twin-sisters) identifies iron guns and describes these carriage colors; caliber has been debated. Treat this as an appearance preset, not proof of exact surviving dimensions |
| Anahuac, game timeline | No active fort artillery | The 1835/no-further-use condition above overrides the temptation to decorate a fort with cannons |

Do not reuse the Gonzales cannon's identity as the Twin Sisters. Do not use a twentieth-century field-gun silhouette or a ball pile to assert ammunition quantity. Crews should share the civilian/volunteer/regular visual library, with identity and formation-sample rules preserved.

## Other locations already anticipated by the province map

These recipes reuse `HIST-TEX-003`'s settlement/water relationships. They are **generic assembly fallbacks**, not researched town layouts or new population claims. The map label may name the settlement while the appearance metadata remains schematic.

| Place / group | Useful assembly palette | Additional check before detail |
| --- | --- | --- |
| Victoria | Guadalupe bank, small town dwellings, road/cargo, surrounding fields/woodland | De León colony town layout, building forms and relevant households |
| Mina (Bastrop) | Colorado river town, crossing/landing, modest dwellings and woodland | Use the period name already required in HISTORY; verify any named building/crossing |
| Refugio | Mission River, plain mission-room/chapel components, civilian houses and road | Specific surviving/ruined mission condition and 1836 configuration |
| San Patricio | Nueces crossing, small settlement, ranch/cargo/horse assets | Period crossing and settlement layout; no generic stone fort by default |
| Copano | Bay shoreline, small sailing vessel/landing craft, cargo and shore buildings | This was a port used for troops and supplies; dock design/building form need checking. [TSHA: Copano, TX](https://www.tshaonline.org/handbook/entries/copano-tx) |
| Brazoria / Velasco / Matagorda | River-mouth or coastal settlement variants, cargo/landing and shallow-water edges | Keep each on its documented river/bay; a port does not imply the same fort or wharf everywhere |
| Columbia | Modest inland settlement/road/cargo palette | Preserve its between-rivers relationship; do not invent a river directly through the town |
| Harrisburg | Buffalo Bayou riverbank, houses/trade outbuildings, landing/cargo | Date-specific destruction/evacuation and any boat/industrial feature |
| Nacogdoches | East Texas town cluster with broadleaf/pine surroundings and road | No major-river waterfront by default; civic buildings and mission remains require separate checking |
| Named ferries/camps along routes | Shared boat/landing, camp, timber, mud, households and wagons | Place the exact crossing/camp only when researched and present in the world model |

## Required kit checks after generation

These are **requirements to audit against the shipped catalog**, not assertions that another agent's current output is missing them. They extend the generic farm kit for the specifically requested places.

1. **Roofless versus roofed architecture:** a roofless church, long barrack, low stone/plaster room blocks, wall/gate/corner/breach parts. Ordinary fully roofed houses cannot stand in for all of these.
2. **Different construction materials:** log, plain frame, plaster/masonry and red brick. Anahuac brick ruins, Washington's frame hall and La Bahía masonry should be visually distinguishable without huge labels.
3. **Urban composition:** adjoining frontage, courtyard and plain church shapes for Béxar; small commercial/tavern/printshop parts for San Felipe; modest landing/warehouse/cargo forms for river and bay towns.
4. **Condition states:** disused brickwork, roofless ruins, damaged wall/roof, burned/abandoned building remains. The same footprint must survive a state change.
5. **Water logistics:** ford bank, landing, ferry/flatboat, small sailing-vessel or cargo-boat silhouette, shore cargo. Specific boats stay schematic pending vessel research; do not turn every water location into the same ferry.
6. **Battlefield landscape:** low ridge, tall grass and marsh edge; no mountain or castle kit substitutes. Camp objects and people remain separate.
7. **Artillery:** independently usable cannon with facings, supply/crew accessories and separate restrained smoke; a paired San Jacinto appearance preset; do not activate artillery at Anahuac in the game period.
8. **Assembly evidence:** each named-place recipe needs a labeled preview and a machine-readable or clearly documented list of real asset IDs, placement anchors and source/classification before Claude can call it a finished location. A generic sheet alone does not prove Alamo/Goliad/Anahuac coverage.

All external references in this guide were checked 2026-09-09. They are narrow institutional art checks; later historical arcs still require the project's normal deeper research and regression gates. This guide does not itself implement the later historical scenarios.

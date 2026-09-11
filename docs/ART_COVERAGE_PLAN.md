# Reusable art coverage plan

Prepared 2026-09-09 after reading `VISION.md`, `HANDOFF.md`, `GAME.md`, `HISTORY.md`, `docs/ASSETS.md`, and the Claude roadmap, especially §1B, §1D, and the later historical arcs.

The owner has now authorized a broader art library and interface update using the three supplied rustic farm-game references. This expands the **art** scope; it does not silently authorize new historical assertions or imply that later gameplay exists. The intended result is a coherent collection Claude can reuse as the same households progress through 1835–1836.

The owner's follow-up explicitly includes **cannons, the Alamo, San Antonio, Goliad, Liberty, Anahuac and the other involved places**. See [LOCATION_ART_GUIDE.md](LOCATION_ART_GUIDE.md) for named-place assembly recipes, verification references, and additional modular-kit requirements. These are places with different buildings and geography, not the same farm background with different labels.

**A library has been delivered:** 30 sheets, 443 usable sprites and 169 clips, plus a 32-space Alamo assembly. [ART_MANIFEST.md](ART_MANIFEST.md) is the complete generated inventory; [ASSETS.md](ASSETS.md) and [ANIMATION_REQUIREMENTS.md](ANIMATION_REQUIREMENTS.md) distinguish bindings and remaining production work. The new messenger conversation requirements are in [LIVING_INFORMATION.md](LIVING_INFORMATION.md).

**This document is a coverage plan, not a generated-file manifest or completion claim.** The identifiers below are proposed logical families. Inspect the shipped asset catalog and `docs/ASSETS.md` for actual files, frame names, anchors, dimensions, licensing/provenance, and integration status. A preview sheet is not proof that every pictured object is an independently usable sprite.

## Visual target

Use a fixed north-up, elevated oblique view: broad readable tree crowns, compact roof-and-front-wall buildings, recognizable miniature people, worn earth paths, warm ochre grass, muted river blue, wood browns and restrained terracotta. Give objects a consistent dark earthy outline, simple stepped shading and a clear ground-contact point. Match the references' warmth, density and readability rather than copying their windmills, barns, layout or individual artwork.

At near scale the farm should feel inhabited; at regional scale it should retain geographic clarity. Use one style and one persistent identity across both. A recognizable headwear/garment/skin combination should survive walking, work, military absence, injury, evacuation and return. Labels and accessible HTML remain responsible for exact identity and meaning. Pixels alone cannot communicate a person's nationality, politics, legal status or personal history.

Interface material should support that world: compact cream or parchment-colored cards, wood/ink accents, obvious selected-person state, large contextual verb buttons, and quiet news/status overlays. Avoid framing the world as a dashboard, adding instructional strips, or putting artificial resource counters above every object. Keep the existing map-first interaction and keyboard equivalents.

## Coverage inventory

The minimum families below cover the anticipated gameplay without making each historical arc its own art system. **Core** means immediately useful to Gonzales and farming. **Reusable future** means prepare reusable art now and connect it only when the corresponding projected state exists. **Research-dependent** means generic parts are useful now, but their historically named arrangement or detail still needs its own source review.

| Proposed family | Independently usable pieces | State / reuse requirement | Scope |
| --- | --- | --- | --- |
| `ground.prairie` | 3–4 quiet grass patches, sparse tufts, dry tufts, small bare-earth patches | Subtle variation; no checkerboard; never imply a crop or owned field | Core |
| `ground.path` | Packed dirt, soft verge, ruts, mud patch, dust accent | Roads follow modeled geometry rather than baked-in decorative roads | Core |
| `water.river` | Water surface detail, bank edge, reeds, shallows, foam/ripple | River and ford positions come from map data; no invented bridge | Core |
| `vegetation.oak` | At least 3 distinct broad oak silhouettes, sapling, stump, fallen branch/log | Separate ground shadows; tree clusters follow modeled woods | Core |
| `vegetation.region` | Pecan-like river broadleaf, pine, thorny brush, coastal reeds | Schematic regional palette only; deploy within the map's existing ecoregion bands and research boundary | Reusable future |
| `ground.debris` | Small pale rock, rock cluster, log, branch, uneven grass edge | Low contrast and deterministic placement; must not resemble interactive resources unless modeled as such | Core |
| `crop.corn` | Bare cultivated patch, seedlings, growing stalks, standing crop, harvested stubble, neglected/withered crop | The same plot changes state in place; crop identity and work calendar require game data | Core |
| `crop.cotton` | Seedlings, growing plants, open-boll standing crop, harvested/neglected versions | No fake harvest or planted field when the server provides only a land outline | Core |
| `boundary.rail` | Worm-rail straight runs, bends/corners, open gap/gate, broken section | Assemble around an actual modeled enclosure; damage is a state, not a random decoration | Core |
| `building.cabin` | Small and medium log cabins, several roof silhouettes, simple doorway/porch variation | A small stable set can supply a varied modest settlement; avoid a single oversized "town" building | Core |
| `building.utility` | Lean-to/shed, modest workshop/store frontage, stacked split wood | Generic plausible parts; assigning a named trade or building requires corresponding simulation/research | Reusable future |
| `building.masonry` | Plain adobe/plastered dwelling, stone room/barracks, chapel shell, wall straight/corner, gate, low defensive earthwork | Modular schematic reconstruction; no claim to exact Béxar/Alamo/La Bahía ground plans | Research-dependent |
| `building.condition` | Intact base, repair scaffold/materials, damaged roof/wall, abandoned/burned remains | Retain the same building ID/location. No damage, fire or abandonment without authoritative state | Reusable future |
| `property.food` | Sack, crate, barrel, basket, bundled goods | Legible cargo pieces for a modeled store or wagon; no collectible sparkle or score | Core |
| `property.tools` | Hoe, axe, simple hand tool bundle, repair supplies, water bucket | Accessories or work props; no new economy category implied by an illustration | Core |
| `property.household` | Blanket/bedroll, rolled bundle, simple chest, cooking vessel | Reuse at home, camp and evacuation; cargo is visible only when actually carried | Reusable future |
| `transport.wagon` | Unloaded wagon, covered/loaded wagon, detached cargo overlay, damaged wagon | Separate animal/harness if feasible; consistent anchor; same wagon recognizable throughout story | Core / reusable future |
| `animal.ox` | Standing and walking ox; harness/yoke accessory | Current Juniper binding must remain an ox; movement comes from entity travel | Core |
| `animal.domestic` | Horse, cow/cattle variant, pig; standing/walking poses | Same individual or aggregate rules as model; no spontaneously generated livestock | Reusable future |
| `animal.wild` | Buffalo silhouette and optional grazing/movement pose | Existing locality evidence is an 1828 observation, not guaranteed game availability in 1835; other local game remains researched/fictive as documented in HISTORY | Research-dependent |
| `civilian.adult` | Several trouser/long-skirt silhouettes, practical hats/bare heads, several skin tones and garment colors | Household member variants, merchant/laborer/neighbor reuse; no uniform for ethnicity | Core |
| `civilian.age` | Smaller child and adolescent silhouettes, older adult variants | Distinct size/posture without caricature; names and actual ages belong to character data | Core |
| `civilian.activity` | Idle, walk, work, rest, carry, help/aid, leading-animal poses | Prioritize readable key poses and reusable accessories before many animation frames | Core / reusable future |
| `civilian.refugee` | Same civilian bodies carrying bundles, child alongside adult, blanket/rest, walking with wagon | Refugee is a situation of an existing person, not an ethnic costume or replacement character | Reusable future |
| `civilian.condition` | Seated/reclining rest, supported walking, bandage/accessory, carried wounded person | Injury and death must be distinguishable from cosmetic rest by projected status and text; dignified, non-graphic | Reusable future |
| `messenger.courier` | Walking civilian with letter/bag; mounted rider accessory | Letter/bag does not disclose message contents; show only if the observer is allowed to see courier | Reusable future |
| `military.volunteer` | Civilian-clothed volunteer with period long arm, varied headwear, idle/march/fire/withdraw/surrender poses | Same visual vocabulary as civilians, no identical modern uniform; sampled formation members are decorative | Core / reusable future |
| `military.regular` | Schematic regular infantry silhouette with cap/shako and long arm; officer/rider options | Generic visual shorthand only until unit, date, uniform detail and equipment have checked claims | Core / research-dependent |
| `military.mounted` | Horse-and-rider assembly, travel/march and stationary poses | Gonzales involves dragoons; mounted role must not be erased by treating every soldier as infantry | Research-dependent |
| `military.artillery` | Representative wheeled field cannon, limber/supply accessory, smoke/recoil overlay | Do not imply a specific surviving Gonzales artifact, caliber, number of guns or firing sequence | Core / reusable future |
| `camp.shared` | Plain tent/lean-to, bedroll, cooking fire embers, kettle, stacked supplies, hitching arrangement | Reuse for military/civilian camps with modeled occupants; no unearned camp at every crossing | Reusable future |
| `crossing.shared` | Shallow ford treatment, simple ferry/flatboat, landing/rope/post parts | Current Gonzales crossing stays a ford. Later ferry position, vessel and mechanism need their own source/model | Reusable future / research-dependent |
| `battle.shared` | Low earthwork, timber barricade, plain masonry breach/debris, field camp | No scripted battle terrain painted into a civilian view before it is known | Reusable future / research-dependent |
| `fx.shared` | Brief muzzle flash, small musket smoke, larger cannon smoke, dust, water ripple, restrained rain, small fire/smoke | Visual only, bounded and reduced-motion aware; cannot reveal a hidden event | Reusable future |
| `ui.symbol` | Person/family, food, date, home, letter, condition, work/rest, wagon, follow, zoom, news, connection | Pair meaningful icons with labels; no color-only statuses; avoid medal/trophy/patriotism motifs | Core |
| `ui.state` | Selection ring, focus outline, request marker, task/carry indication, uncertainty/age indicators | Cosmetic indicators reflect an allowed snapshot; no invented urgency, reward or private information | Core |

## Arc reuse matrix

| Phase | Already covered by shared families | Additional research before a named depiction |
| --- | --- | --- |
| Gonzales / farm life | Oaks, prairie, river/ford, corn/cotton stages, cabins, household, ox/wagon, supplies, volunteer/regular/cannon | Exact weapon/uniform details; detailed town footprint; any additional fauna or occupation |
| Late 1835 / Béxar | Town masonry, cabins, streets, camp, courier, soldiers, artillery, barricades | Specific streets, buildings, fortifications, forces and clothing for the depicted moment |
| Alamo | Masonry wall/gate/chapel parts, camp, cannon/smoke, couriers, wounded-care poses | 1836 compound/roof/wall appearance and placement; dated military details; no modern landmark silhouette by default |
| Coleto / Goliad | Grassland, wagons, troops, surrender/rest/captivity, masonry enclosure, care poses | Coleto terrain and deployment; La Bahía's fort arrangement; how non-graphic aftermath communicates events |
| Runaway Scrape | Same people, crops, home and wagon, loaded cargo, livestock, damaged property, mud/rain, ferry/landing, camp, aid | Specific crossings/routes, season/weather events and evacuation circumstances; no fresh household sprites that erase identity |
| San Jacinto | Prairie/coastal vegetation, water, camps, volunteer/regular troops, cannon/smoke, surrender/aid | Battlefield terrain and military deployment/equipment for that event |
| Epilogue / revelation | Existing identity portraits/crops/home/property states, route traces, letters and news | No new commemorative monuments or modern flags; display only actual recorded story and the authorized final reveal |

## Period guardrails and source boundaries

1. **Use the references for style, not their period objects.** The existing Gonzales contract excludes windmills, red gambrel barns, painted clapboard farm sets, silos, tractors and wire fences. Keep that local art direction. It does not justify making all of Béxar or Goliad a log-cabin village. `HISTORY.md` already limits detailed settlement depiction outside Gonzales until the appropriate arc is researched.
2. **Present-day Alamo architecture is not an 1836 reference by default.** The Alamo's institutional account explains that its first roof and the familiar upper parapet came during the later U.S. Army occupation. The reusable chapel/masonry kit should therefore remain plain and explicitly schematic until an 1836 arrangement is checked. [The Alamo: Military Occupation](https://www.thealamo.org/remember/military-occupation), checked 2026-09-09.
3. **La Bahía is a presidio, with a chapel, rather than a generic mission.** The Texas Historical Commission makes that distinction explicitly and describes later restoration. Wall, barracks, gate and chapel components are sensible reusable art; a modern photograph does not on its own prove every detail of the 1836 enclosure. [THC: Presidio la Bahía History](https://thc.texas.gov/state-historic-sites/presidio-la-bahia/presidio-la-bahia-history), checked 2026-09-09.
4. **Damage can be a central historical state, but not generic scenery.** The THC account describes San Felipe's evacuation and burning in March 1836. Reusable burned-building and carried-belonging states are therefore useful to prepare; their presence, date and cause must be controlled by the later researched scenario. [THC: San Felipe de Austin History](https://thc.texas.gov/state-historic-sites/san-felipe-de-austin/san-felipe-de-austin-history), checked 2026-09-09.
5. **Do not fill unresolved military details with familiar later imagery.** No Civil War uniform shorthand, twentieth-century weapons or unverified flags. Specific regimental colors, insignia, flags, weapon models and troop counts require a checked event-specific claim. Plain flagpoles or no flag are acceptable until that work is done. Current soldiers and cannon remain schematic rather than identified artifacts.
6. **People retain dignity and individuality.** Mix appropriate skin tones and clothing variation across civilians; do not make nationality synonymous with skin tone. Free Black Texans and enslaved people are people, not resource/unit icons. A generic feathered-headdress sprite is not adequate representation of Indigenous nations; a named nation/person and context need focused research before such depiction. Do not imply every woman is a healer, every man a combatant, or every Tejano a Mexican regular.
7. **No visual reset and no knowledge leak.** A loaded wagon cannot appear because a later chapter started. A burned home cannot appear simply because the renderer knows the historical future. Never load full truth to decide what to draw: bind visible art to the existing server-filtered projection and one persistent entity location.

The three external checks above are narrow art guardrails, not a replacement for `HISTORY.md` or a completed research basis for later arcs. No historical claim IDs are created here. Promote a checked claim into that registry alongside an implementation when the later arc is actually developed.

## Acceptance and handoff standard

- An asset is **usable** when its independent frame/file can be loaded locally, its dimensions and anchor are recorded, and it has clean transparency or an explicitly documented opaque-tile role. Catalog-only concept art does not satisfy this.
- A family is **covered** when the catalog lists the required base assets plus supported states/directions. Distinguish true authored animation from a still image with cosmetic bobbing. Do not claim four-direction animation from a front-facing sheet or mirrored static pose.
- Use feet/ground-contact anchors, deterministic draw order and stable identity selection. Source size is a rendering contract, never world distance or collision size. Follow the actual current asset metadata if it supersedes the former placeholder size targets.
- Check the active Gonzales scene at household scale, on a narrow phone, at projected Host scale, during travel, and during a permitted battle. People, ox, wagon, house, selected person and actions must be legible without reading a developer note.
- Check keyboard focus, accessible names/text, high-contrast text, generous touch targets and reduced-motion behavior. Decorative art must not intercept essential controls.
- Record each family's status as **in game**, **usable library only**, **static pose only**, or **research-dependent**. Keep missing frames and later historical reconstruction work explicit in the asset documentation and `HANDOFF.md`.
- Preserve the authoritative simulation, same-ID travel/save/reconnect, private/public projection boundaries and autonomous Host. Art coverage does not mean later arcs, new work orders or an economy have been implemented.

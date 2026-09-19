# The natural country of the map in 1835-36: biomes, what grew, what could be hunted, and how to draw it

**Status: research, 2026-09-19; built the same day (§13).** This was the research half of the owner's request below; the
second session built §7 from it, and §13 says what was built, where it differs, and what is left. A third session made the
balance and gameplay changes the new biomes call for: [BIOME_GAMEPLAY](BIOME_GAMEPLAY.md). Read it with `docs/WOODS_AND_BUILDING.md` (the woods as built), `docs/MAP_ACCURACY.md` §5 and §8
(the land classes and the country outside the box), and the claims it registers in `HISTORY.md`: `HIST-TEX-094` to
`HIST-TEX-108` and `FIC-GONZ-060` to `FIC-GONZ-063`.

---

## 1. What the owner asked for

> "have a sub agent research the various natural biomes of texas. when it's finished, have another sub agent bring the map
> in line with its findings by adding those new biomes to the game."
>
> "woods should only exist where woods make sense. some families are going to have a harder time hunting because there's no
> woods. thats okay"
>
> — 2026-09-19

| Question | Owner's answer, 2026-09-19 |
| --- | --- |
| The thick woods drawn round the Alamo and Béxar | **Clear them to fields**, by multiple choice: in 1836 the mission stood in open ground among irrigated fields and acequias. The map draws open ground and fields out to where the town's farmland reached, with the source recorded (§5). |
| Families with little timber or game | **Intended.** Woods only where woods make sense; a family on open prairie hunts worse and builds from less (§8). |

The map is **93.5-100.5°W, 25.8-32°N**: the Sabine to the Rio Grande, Matamoros to Eagle Pass, with the colonies' box
(99-94°W, 28-32°N) inside it. The period is **1835-36**, before the changes that made today's land: mesquite and cedar
spreading once the fires stopped and the ranges were overgrazed, the prairies ploughed, the pine logged, the reservoirs filled.

---

## 2. How to read the data for 1836

The game already holds two government maps, and both describe the land **as a model or a modern survey, not as 1836**:

- **LANDFIRE Biophysical Settings (LF 2016)** model "the vegetation that may have been dominant ... prior to Euro-American
  settlement" from today's soils and climate under a reconstructed fire regime. It is the right *pattern* - where prairie,
  savanna, bottom and pine stood - and its attribute table gives each setting's **mean fire return interval**, which is the
  single best key to how open a setting was: blackland prairie 2 years, coastal prairie 3-5, longleaf 2-4, post oak savanna 4,
  Cross Timbers 5, Tamaulipan savanna grassland 5, Edwards Plateau savanna 6, thornscrub 15, floodplain 26-38, swamp 410
  (read 2026-09-19 from `C:\Users\zachw\TexasData\raw\landfire\bps\*.tif.vat.dbf`, field `fri_allfir`).
- **EPA Level IV ecoregions** (`tx_eco_l4`, 2011) are named regions drawn on today's geology, soils and vegetation. They are
  good for *which country a place is in*, not for what grew there.

Where they mislead for 1836, found in this research:

1. **South Texas brush.** LANDFIRE files 13,400 square miles of the map as *Tamaulipan Mixed Deciduous Thornscrub* (13900)
   and 2,400 as *Calcareous Thornscrub* (13920). The travellers of 1828-57 crossed mostly **grass and mesquite prairie with
   thickets**, and watched the mesquite spreading once the fires stopped (§4.9, `HIST-TEX-097`, `HIST-TEX-096`). The data's
   thornscrub is where the thickets *could* stand, not a continuous brush in 1836.
2. **Edwards Plateau cedar.** LANDFIRE's savanna-and-woodland setting (13830) covers 13,000 square miles and the game makes
   40 in 100 of its patches closed woods. In 1836 the Hill Country was **open grassland savanna with oak mottes**; cedar
   (Ashe juniper) stood on the steep breaks and in the canyons, where fire did not reach (§4.7, `HIST-TEX-102`).
3. **Creek timber through prairie.** No dataset says it; the game adds a strip of closed creek timber 0.1 mile either side of
   **every** creek the map draws, intermittent or not, through prairie, savanna, brush and hills. It is 15 to 24 in 100 of the
   ground in most prairie and hill ecoregions (§6.2). Lincecum crossed coastal-prairie creeks in 1835 with "not a bush on
   their banks" (`HIST-TEX-094`).
4. **Floodplains under towns.** Round Béxar, LANDFIRE's floodplain setting (14710) and the creek strip make the ground near the
   Alamo 41 in 100 timber within a quarter mile. In 1834 the town's cultivated land was irrigated fields and its building wood
   came "from a distance" (§5, `HIST-TEX-098`, `HIST-TEX-099`).
5. **Settings filed under the wrong stand.** Cypress swamp as marsh, beech-magnolia forest and wet hardwood flatwoods as post
   oak savanna, juniper shrubland as hill savanna, shrubby clay dunes as prairie, mixed-grass prairie as tallgrass (§6.3).
6. **Mexico** has no LANDFIRE and no EPA ecoregions; the game draws every cell of it as brush (§4.12).
7. **Canebrakes, palm groves and farmland** are in neither dataset. They come from the travellers and must be laid on the
   data (§4.5, §4.11, §5).

`ceiling:` this research reads LANDFIRE's settings, attribute table and pattern. The per-setting model descriptions
(`research.fs.usda.gov/sites/default/files/feis/bps/<model>.pdf`) for 13830 Edwards Plateau, 13900 thornscrub, 14220
blackland, 13380 coastal live oak and 14380 Tamaulipan savanna were **not read**: they are PDFs, and the brief forbids
downloading files. Their succession-class shares are the first thing to read before any trees-per-acre figure here is
claimed as the model's.

---

## 3. The data codes and the biomes they belong to

Areas are from sampling the whole map every 0.02 degrees (about 1.7 square miles a sample) against both datasets,
2026-09-19. "Now" is the stand `scripts/build-woods.mjs` files the setting under. "1836 biome" is the recommendation (§7).

### 3.1 LANDFIRE settings

| BpS model | Setting | Area in the map | Mostly in (EPA IV) | Fire every | Now | 1836 biome |
| --- | --- | --- | --- | --- | --- | --- |
| 14220, 14230 | Southern Blackland Tallgrass Prairie; Southeastern Great Plains Tallgrass Prairie | 8,400 + 1,400 sq mi | 32a, 32b, 33b, 33c, 29d, 29e | 2 yr | prairie | `tallgrass-prairie` |
| 14290 | West Gulf Coastal Plain Southern Calcareous Prairie | 300 | 35f | 4 | prairie | `tallgrass-prairie` |
| 14340 | Texas-Louisiana Coastal Prairie | 11,200 | 34a, 34b | 3-5 | prairie | `coastal-prairie` |
| 14860 | Texas-Louisiana Saline Coastal Prairie | 400 | 34h, 34f | 4 | prairie | `salt-prairie` |
| 14370 | Central and Upper Texas Coast Dune and Coastal Grassland | 200 | 34h, 34i | 3 | prairie | `dunes` |
| 31 | Barren (rock, sand, clay) | 200 | 34i (Padre, Laguna Madre flats) | - | none | `dunes` |
| 11320, 11490, 11480, 10940, 15040 | Central Mixedgrass, Shortgrass, Sand Prairie, Sandhill Steppe; Chihuahuan desert swale grassland | 7,100 + 400 | 30a, 30d, 27j, 27h, 26c, 29c, 31a | 5-52 | prairie | `mixedgrass-prairie` |
| 14380, 14400, 14420 | Tamaulipan Savanna Grassland; Tamaulipan Clay Grassland; South Texas Sand Sheet Grassland | 6,900 + 1,600 | 31c, 34e, 34d | 4-5 | prairie | `mesquite-savanna` |
| 13900, 13920 | Tamaulipan Mixed Deciduous Thornscrub; Tamaulipan Calcareous Thornscrub | 13,400 + 2,400 | 31c, 31a, 34b, 34e, 33b, 32b | 15 | brush | `mesquite-savanna` north-east of the Nueces; `chaparral` in the Nueces Strip and Mexico (§4.9) |
| 14390 | South Texas Lomas | 100 | 34e, 34f, 34i | - | prairie | `chaparral` |
| 11110 | Western Great Plains Mesquite Woodland and Shrubland | 100 | 26c, 27h, 27j | 7 | brush | `chaparral` |
| 15190 | East-Central Texas Plains Post Oak Savanna and Woodland | 7,800 | 33a, 33b, 33c, 32b | 4 | post-oak | `post-oak` |
| 13080 | Crosstimbers Oak Forest and Woodland | 1,000 | 29c, 29b, 29d | 5 | post-oak | `cross-timbers` |
| 14100 | Llano Uplift Acidic Forest-Woodland-Glade | 1,000 | 30b | 5 | post-oak | `post-oak` |
| 13040 | (filed, not met in the map) | - | - | - | post-oak | `post-oak` |
| 13230 | West Gulf Coastal Plain Mesic Hardwood Forest | 1,100 | 35a, 35e | 17 | post-oak | `thicket` |
| 15060 | West Gulf Coastal Plain Nonriverine Wet Hardwood Flatwoods | 200 | 35e, 35f | 27 | post-oak | `thicket` |
| 13710, 13780 | West Gulf Coastal Plain Pine-Hardwood Forest; Sandhill Oak and Shortleaf Pine | 4,200 + 300 | 35a, 35e | 4-5 | pine | `pine` |
| 14580 | West Gulf Coastal Plain Pine-Hardwood Flatwoods | 1,300 | 35f, 35e | 5 | pine | `pine`; `thicket` inside the Big Thicket (§4.1) |
| 13480, 14510 | Upland Longleaf Pine Forest and Woodland; Wet Longleaf Pine Savanna and Flatwoods | 2,000 + 2,500 | 35e, 35f | 2-4 | pine | `longleaf` |
| 13580 | East-Central Texas Plains Southern Pine Forest and Woodland (the Lost Pines) | 600 | 33e, 33b | 6 | pine | `pine` |
| 14730, 14710, 14670 | Gulf and Atlantic Coastal Plain Floodplain; Central Interior Floodplain; Tamaulipan Floodplain | 7,100 + 900 | 34c, 33f, 35b, 32c, 32a | 24-38 | bottomland | `bottomland` (with a canebrake share on the coast, §4.5); `fields` inside a town's farmland (§5) |
| 11620 | Western Great Plains Floodplain Systems | 1,200 | 30a, 27j, 29c | 13 | bottomland | `creek` (a gallery, not a wide bottom) |
| 14950 | Western Great Plains Depressional Wetland | under 50 | 27h | 3-7 | bottomland | `marsh` |
| 14740, 14720 | Coastal Plain Small Stream Riparian; Central Interior Riparian | 2,900 + 400 | 35a, 35e, 33b, 32b | 9-33 | creek | `creek` |
| 15250 | Edwards Plateau Riparian | 400 | 30a, 30c | 25 | creek | `creek` |
| 14760, 11550 | Tamaulipan Riparian Systems; Warm Desert Riparian | 3,300 | 31c, 31d, 34f, 34b | 31 | creek | `thorn-riparian`; `palm-grove` in the delta (§4.11) |
| 13380, 13390 | Central and South Texas Coastal Fringe Forest and Woodland; Chenier and Upper Texas Coastal Fringe | 1,900 + 100 | 34d, 34h, 34i, 34g | 19-81 | live-oak | `live-oak` (mottes) |
| 13830 | Edwards Plateau Limestone Savanna and Woodland | 13,000 | 30a, 30c, 29e, 29d | 6 | hill-savanna | `hill-savanna` (mostly open) |
| 15230, 15240, 13930 | Edwards Plateau Dry-Mesic Slope Forest; Mesic Canyon; Limestone Shrubland | 3,200 + 200 + 2,300 | 30c, 29e, 30a | 20-61 | hill-savanna | `cedar-brake` |
| 14900 | Gulf and Atlantic Coastal Plain Tidal Marsh | 1,200 | 34g, 34h, 34i | 11-27 | marsh | `marsh` |
| 14800 | Gulf and Atlantic Coastal Plain Swamp Systems | 200 | 34g, 35f | 410 | marsh | `cypress-swamp` |
| 11 | Open water | 6,100 | - | - | water | `water` |
| none | Mexico and the Gulf | about 61,000 incl. sea | - | - | brush (Mexico) | §4.12 |

### 3.2 EPA Level III and IV ecoregions in the map, with the 1836 biome each mostly is

| Level III | Level IV | 1836 biome | Where it misleads |
| --- | --- | --- | --- |
| 35 South Central Plains (the Piney Woods) | 35a Tertiary Uplands; 35e Southern Tertiary Uplands; 35f Flatwoods; 35b Floodplains and Low Terraces | `pine`, `longleaf` (35e south, 35f), `thicket` (the Big Thicket, in 35e/35f), `bottomland` (35b) | 35e and 35f hold the Big Thicket, which has no ecoregion of its own |
| 34 Western Gulf Coastal Plain | 34a Northern Humid Gulf Coastal Prairies; 34b Southern Subhumid Gulf Coastal Prairies | `coastal-prairie`; `mesquite-savanna` in the thornscrub parts of 34b | 34b is 28 in 100 thornscrub in LANDFIRE; in 1836 it was grassland with brush (`HIST-TEX-097`) |
| | 34c Floodplains and Low Terraces | `bottomland` with canebrakes | the canebrakes are in no data (`HIST-TEX-100`) |
| | 34d Coastal Sand Plain | `mesquite-savanna` (sand grassland) and `live-oak` mottes | the Wild Horse Desert |
| | 34e Lower Rio Grande Valley; 34f Lower Rio Grande Alluvial Floodplain | `mesquite-savanna`, `chaparral`, `thorn-riparian`, `palm-grove` | palms in no data (`HIST-TEX-105`) |
| | 34g Texas-Louisiana Coastal Marshes; 34h Mid-Coast Barrier Islands and Coastal Marshes; 34i Laguna Madre Barrier Islands and Coastal Marshes | `marsh`, `salt-prairie`, `dunes`, `live-oak` | the game's `sand` is only a quarter-mile beach band (MAP_ACCURACY §5) |
| 33 East Central Texas Plains (the Post Oak Belt) | 33a Northern and 33b Southern Post Oak Savanna; 33c San Antonio Prairie; 33e Bastrop Lost Pines; 33f Floodplains and Low Terraces | `post-oak`, `tallgrass-prairie` (33c and the prairie openings), `pine` (33e), `bottomland` (33f) | 33b is 16 in 100 thornscrub in LANDFIRE (its south-west, toward Goliad); 1836: mesquite savanna |
| 32 Texas Blackland Prairies | 32a Northern Blackland Prairie; 32b Southern Blackland/Fayette Prairie; 32c Floodplains and Low Terraces | `tallgrass-prairie`, `bottomland` (32c) | the creek strip makes 32a 31 in 100 timber (§6.2); Béxar stands in 32a |
| 30 Edwards Plateau (the Hill Country) | 30a Edwards Plateau Woodland; 30b Llano Uplift; 30c Balcones Canyonlands; 30d Semiarid Edwards Plateau | `hill-savanna`, `mixedgrass-prairie` (30a top, 30d), `cedar-brake` (30c breaks and canyons), `post-oak` (30b) | "Woodland" and the canyonlands' cedar are today's; 1836 was grass on the tops |
| 29 Cross Timbers | 29b Eastern Cross Timbers; 29c Western Cross Timbers; 29d Grand Prairie; 29e Limestone Cut Plain | `cross-timbers` (29b, 29c), `tallgrass-prairie` and `hill-savanna` (29d, 29e) | the Eastern Cross Timbers end near Waco on the Brazos (`HIST-TEX-107`) |
| 31 Southern Texas Plains (the Brush Country) | 31a Northern Nueces Alluvial Plains; 31b Semiarid Edwards Bajada; 31c Texas-Tamaulipan Thornscrub; 31d Rio Grande Floodplain and Terraces | `mesquite-savanna`, `chaparral`, `thorn-riparian` | the name "Thornscrub" is today's; 1836 was grassland with thickets (`HIST-TEX-097`) |
| 27 Central Great Plains; 26 Southwestern Tablelands | 27h Red Prairie; 27j Limestone Plains; 26c Caprock Canyons | `mixedgrass-prairie` | a sliver in the north-west corner |
| (Louisiana) | - | LANDFIRE only: `pine`, `longleaf`, `bottomland`, `marsh`, `coastal-prairie` | no EPA Texas ecoregion |
| (Mexico) | - | §4.12 | no data at all |

---

## 4. The biomes, one by one

Each section says where the biome is, what grew there, what could be hunted, what travellers of the time said (quotes under
fifteen words, with the source), and how it should look on the map.

### 4.1 The Piney Woods and the Big Thicket

Claims: `HIST-TEX-101`, `HIST-TEX-016`.

- **Where.** East of the Trinity and north of the coastal prairie: EPA 35a, 35e, 35f, 35b; LANDFIRE 13710, 13780, 14580
  (pine-hardwood), 13480 and 14510 (longleaf), 13230 and 15060 (hardwood), 14730 and 14740 along the streams. Nacogdoches,
  San Augustine and the east of Liberty's country. The **Big Thicket** is the southern part of it, between the Trinity and the
  Neches: all of Hardin County, most of Polk and Tyler, parts of Jasper, Liberty and San Jacinto (Wikipedia, *Big Thicket*),
  about 30.1-30.9°N, 94.0-95.0°W.
- **What grew.** On the dry uplands of the south-east, **longleaf pine** in near-pure open stands with bluestem grass under
  it, burned every two to four years (LANDFIRE 13480: 98 in 100 of its fires are surface fires); TSHA's *Forests* gives
  longleaf 150 feet tall and four to five feet through. Further north and on moister ground **loblolly and shortleaf pine with
  oaks and hickories**. On slopes and along the creeks **beech, magnolia, white oak, water oak**; in the river bottoms
  overcup, willow and water oak, green ash, sweetgum and blackgum; **bald cypress** in the swamps and sloughs (TSHA,
  *Forests*). The Big Thicket was the densest of all: longleaf uplands, beech-magnolia-loblolly slopes, baygalls, palmetto
  flats and cypress sloughs mixed together (Wikipedia, *Big Thicket*; TSHA, *Big Thicket*). Small prairies of 100 to 1,000
  acres broke the pine country (Holley p. 47, `HIST-TEX-016`).
- **Game.** Deer, turkey, **bear** and panther; the Big Thicket held large numbers of deer, bears, panthers and wolves
  before the lumber industry (TSHA, *Big Thicket*). No bison.
- **Travellers.** Lincecum, February 1835, crossing the Angelina: travel "bounded with long leaf pine forests" (SWHQ 53,
  p. 184); near Big Sandy Creek in the Big Thicket, "passed through the thickest woods I ever saw" (p. 185). Olmsted, 1854,
  west of the Sabine: "the timber pine" giving way to "oaks and black-jack" (pp. 80-81). TSHA, *Big Thicket*: "great climax
  stands of yellow pine five and six feet in diameter". Logging of the virgin pine came in the 1880s (TSHA, *Big Thicket*);
  sawmills dotted East Texas "by 1830" (TSHA, *Forests*), so in 1836 the woods were almost uncut.
- **On the map.** `pine`: dark green wash, loblolly and shortleaf at their spacing with oaks among them. `longleaf`: a lighter,
  grassier wash with tall, straight, widely spaced pines - an open woods a rider can see through. `thicket`: the darkest
  wash, closed canopy of mixed hardwood and pine with palmetto and cane under it; slow going. Art: `pine-loblolly-*` exists;
  longleaf, palmetto, cypress, magnolia and beech are requested (§9).

### 4.2 The Post Oak Savannah, the Lost Pines and the Cross Timbers

Claims: `HIST-TEX-095`, `HIST-TEX-101` (the Lost Pines), `HIST-TEX-107` (the Cross Timbers).

- **Where.** A belt from the Red River south-west to the San Antonio River between the blackland and the coastal prairie:
  EPA 33a, 33b, 33c, 33f; LANDFIRE 15190 (7,800 square miles), and 14100 on the Llano uplift. **The Lost Pines**: 33e and
  LANDFIRE 13580, a loblolly forest round Bastrop (Mina) that "stretches some thirteen miles across" and covered some 36,400
  hectares (about 90,000 acres) in 1880 (TSHA, *Lost Pines Forest*), more than 100 miles from the main pine belt. **The Cross
  Timbers** (29b, 29c; LANDFIRE 13080) reach into the north of the map: the Eastern Cross Timbers "disappearing near Waco" at
  the Brazos, no more than fifteen miles wide; the Western in Comanche, Erath and Hood counties (TSHA, *Cross Timbers*).
- **What grew.** **Post oak and blackjack** over tall bunch grasses: a savanna of bunch grasses and forbs "with scattered clumps
  of trees, primarily post oaks", forest kept to the bottoms along the rivers and creeks "or in areas protected from fire"
  (TPWD, *Post Oak Savannah and Blackland Prairie Wildlife Management*).
  Fire every five to ten years on level ground (TPWD, *Oak-Prairie*); LANDFIRE gives four. LANDFIRE 15190's own shares, read
  2026-09-15: open mature 58 in 100 of the land at large widely scattered oaks, closed 18. Hickory, and elm and pecan in the
  draws. The Lost Pines: loblolly with post oak; a sawmill at Bastrop from 1838 (TSHA). Cross Timbers: a denser band of
  blackjack and post oak, "a formidable obstacle to travelers because of the density of growth" (TSHA).
- **Game.** Good: deer and turkey at the edges and in the acorn mast, bear in the bottoms, bison in the western part in the
  1820s (Kuykendall: "the great number of wild horses and buffalo" on the Yegua in 1825, `HIST-TEX-104`).
- **Travellers.** Olmsted, 1854: the post oak "stands in islands in the large prairies" and is "seldom cleared for
  cultivating the soil" (p. 89). Lincecum, February 1835, east of the Colorado: a ten-mile streak of timber "almost entirely
  Black jack and runner post oak from 10 to 15 feet" (SWHQ 53, p. 188); "the ground now in the post oak praries is litterly
  covered with acorns" (p. 192).
- **On the map.** `post-oak` as now: an olive savanna wash, scattered broad oaks over grass with patches of thicket. The Lost
  Pines as `pine`. `cross-timbers` as post oak with a larger closed share. Art: post oak and blackjack at three sizes are still
  open in the 2026-09-15 tree request; stand-in `oak-broad`.

### 4.3 The Blackland Prairie

Claims: `HIST-TEX-095`, `HIST-TEX-096`.

- **Where.** A belt from the Red River to Béxar, west of the post oak: EPA 32a, 32b (and 33c, the San Antonio Prairie inside
  the post oak); LANDFIRE 14220 and 14230, 9,800 square miles. Béxar, Seguin's country, the Gonzales uplands, the upper
  Brazos round Washington's west. Bexar County's "central strip is Blackland Prairie with vegetation consisting of tall
  grasses" (TSHA, *Bexar County*).
- **What grew.** Tallgrass: little and big bluestem, Indian grass, tall dropseed; eastern gamagrass and switchgrass in the
  clay lows; "expansive, virtually open grasslands" with scattered trees or mottes (TSHA, *Grasslands*); a "vast endless sea
  of grasses and wildflowers" with scattered trees or oak mottes (TPWD). Trees along the rivers: pecan, elm, bur oak,
  hackberry, cottonwood. LANDFIRE burns it every two years, the most often of any setting in the map. Heavy black
  "hog-wallow" clay (Olmsted p. 109), which is why it was farmed later than the sandy post-oak lands.
- **Game.** Poor for deer away from the stream timber; bison on the western and northern parts in the 1820s (a herd near
  New Year's Creek in January 1822, and "no more", Kuykendall p. 29); prairie chicken (not modelled). Mustangs.
- **Travellers.** Olmsted near Bastrop: "gently-sloping prairies and wooded creek bottoms" (p. 109). Lincecum on the prairies
  between the Brazos and the Colorado: "Oh! what a pitty it is that there is no timber" (p. 187).
- **On the map.** `tallgrass-prairie`: a warm tawny-gold wash (not the pale green of today's pasture), tall grass tufts, a
  motte in 60 patches, trees only in a narrow gallery on the perennial streams. Art: tall grass tufts are requested (§9);
  stand-in `grass-tuft` scaled up.

### 4.4 The Coastal Prairie, the marshes, the barrier islands and the bays

Claims: `HIST-TEX-094`, `HIST-TEX-106`, `HIST-TEX-016`.

- **Where.** A band along the whole coast, about sixty miles deep on the upper coast (`HIST-TEX-004`) and narrower to the
  south-west, where Almonte gives about four leagues between the Lavaca and the Nueces (p. 188): EPA 34a, 34b; LANDFIRE 14340 (11,200 square miles), 14860 saline prairie on the bays, 14370
  dune grassland, 14900 tidal marsh, and water. San Felipe, Harrisburg, Victoria, Liberty, Matagorda and Anahuac stand on or
  beside it. The **barrier islands** - Galveston, Matagorda, San José, Mustang, Padre - are grass and dunes: Padre "a belt of
  dunes twenty-five to forty feet high" along the Gulf (TSHA, *Padre Island*). **Coastal marsh** in 34g (Sabine to Galveston
  Bay) and 34h/34i round the bays; **cypress swamp** (LANDFIRE 14800) in the Sabine and Neches lowlands.
- **What grew.** Little bluestem, brownseed paspalum, Indian grass; "never a broad, expansive open grassland" but cut by
  wooded stream bottoms (TSHA, *Grasslands*). Between the rivers, open prairie with "points and islands of timber" (Holley
  p. 51, `HIST-TEX-016`): live oak mottes, and ash and linden on the Trinity prairies (Lincecum). The rivers' bottoms made
  "strips of thick forest" every fifteen or twenty miles (Almonte p. 202). **Many small prairie creeks had no timber at
  all.** Cordgrass and saltgrass in the marsh.
- **Game.** Deer at the timber's edge, waterfowl in winter (Almonte lists ducks; not otherwise documented in what was read),
  wild cattle and mustangs in the western part; **bison "seldom seen near the sea coast"** (Holley p. 99).
- **Travellers.** Lincecum, February 1835, between Cypress and Spring creeks: "a vast prarie ... entirely out of Sight of
  Timber", two creeks with "not a bush on their banks to mark their course" (SWHQ 53, p. 187); on the Trinity, "Islands of
  timber" scattered over the prairie, their wood "unfit for use, except it be for firewood" (pp. 185-186). Almonte, 1834:
  the coastal plain where it touches Béxar and the Brazos is "bare of heavy timber for building" (p. 182).
- **On the map.** `coastal-prairie`: a green-gold wash, grass tufts, a live oak motte in 60-80 patches; timber only on the
  rivers and perennial bayous. `salt-prairie`: paler, sparse, salt flats. `marsh`: blue-green with `reeds`. `dunes`: `sand`
  with dune grass. `cypress-swamp`: dark wash over water, cypress. Art: cordgrass, sea oats and bald cypress requested (§9);
  stand-ins `reeds`, `grass-tuft`, `cedar-large` tinted.

### 4.5 The bottomland hardwoods and the canebrakes

Claims: `HIST-TEX-100`, `HIST-TEX-016`.

- **Where.** The alluvial bottoms of the Sabine, Neches, Trinity, San Jacinto, Brazos, San Bernard, Colorado, Lavaca,
  Guadalupe and San Antonio: EPA 34c, 33f, 32c, 35b; LANDFIRE 14730 and 14710 (8,000 square miles). On the coast the Brazos,
  San Bernard and Colorado bottoms were three to twenty miles wide (Holley p. 16). **The canebrakes**: Caney Creek, an old
  channel of the Colorado, ran through "an uninterrupted cane-brake, seventy-five miles long, and from one to three miles
  wide", the Great Prairie Cane-brake, bordered by heavy timber; Oyster Creek east of the Brazos had canebrake "interspersed
  with heavy timber" (Holley pp. 16-17, 36). Cane stood along all the coastal rivers (Smithwick) and in the Trinity bottom
  (Olmsted p. 91).
- **What grew.** Live oak, red and black oak, cedar, pecan, elm, hackberry, mulberry; cottonwood on the banks (Holley, as
  `HIST-TEX-016`); water and willow oak, ash, sweetgum in the east; canopy trees 15-30 an acre (LANDFIRE 14730). Grape vines
  and Spanish moss: "Spanish moss hung thick everywhere" in the Trinity bottom (Olmsted p. 91). Wild oats and wild rye in the
  Brazos and Colorado bottoms in 1821 (Kuykendall p. 51). **River cane** (*Arundinaria*) in dense brakes on the best soil.
- **Game.** The best: deer, turkey, **bear** ("frequents the forests and cane-brakes", Holley p. 95), squirrel; wild hogs.
- **Travellers.** Holley: "Scarcely a tree is to be found in this ocean of cane" (p. 17). Smithwick: near the coast "there were
  vast canebrakes all along the rivers"; "when the cane died down, it was burned off clean" and corn planted with a stick
  (pp. 17-18). Olmsted: "The road had been cut through a cane-brake" (p. 91). Kuykendall, 1903: where "dense and extensive
  cane brakes formerly existed, scarcely a cane can now be found" (p. 51).
- **On the map.** `bottomland` as now, and a **canebrake** share: in the coastal bottoms (34c, and 33f below the post oak) a
  patch class `cane` of 15 in 100 of the patches, and the Caney and Oyster creek brakes as their own `canebrake` stand (§7).
  Cane is dense yellow-green growth ten to twenty feet high: no logs, slow going, the best bear ground, and the easiest
  timber-country clearing because it was burned. Art: `cane` requested (§9); stand-in `reeds` drawn tall.

### 4.6 The creeks

Claim: `HIST-TEX-094`; the rule is `FIC-GONZ-060`.

- **Where.** LANDFIRE 14740, 14720, 15250 and 11620 (a gallery on the western rivers), and the creeks the map draws.
- **What grew.** Pecan, elm, hackberry, walnut, bur oak, cottonwood, sycamore, willow; in the east magnolia and beech.
- **What the travellers show.** Creek timber depended on the creek. Perennial creeks in the post oak and hill country had
  galleries (Olmsted's "wooded creek bottoms", p. 109; "a thin belt of wood, as hack-berry and elm" on the Nueces tributaries,
  p. 445). Intermittent creeks on the coastal and blackland prairies often had none (Lincecum p. 187, `HIST-TEX-094`).
- **On the map.** Keep the creek strip on **perennial** creeks, one patch (a sixteenth of a mile) wide on a small creek; drop
  it on intermittent creeks through `coastal-prairie`, `tallgrass-prairie`, `mixedgrass-prairie` and `mesquite-savanna`; keep
  a thin one (a few trees, not closed woods) on intermittent creeks through post oak and hill country. Measured 2026-09-19 at
  Harrisburg, whose Buffalo Bayou is a "creek" to the data: with no strip at all its timber within three miles falls from 14 in
  100 to none, so the strip must not simply be removed.

### 4.7 The Edwards Plateau and the Hill Country, with the Balcones Escarpment

Claim: `HIST-TEX-102`.

- **Where.** West and north of the Balcones Escarpment, which runs from Del Rio past San Antonio, New Braunfels, San Marcos and
  Austin toward Waco, about 1,000 feet high at Del Rio and 300 at Austin, and from the plains looks "a range of wooded hills"
  (TSHA, *Balcones Escarpment*). EPA 30a, 30b, 30c, 30d, 29e; LANDFIRE 13830 (13,000 square miles), 15230, 15240, 13930
  (cedar), 11320 on the flat tops, 15250 along the streams. The springs at San Antonio, New Braunfels (Comal) and San Marcos
  rise on the fault line.
- **What grew.** "A grassland savannah", kept so by bison and pronghorn grazing and by frequent fires; cedar restricted to shallow soils and "steep canyons where fires did not occur frequently"; the change to
  brushland came with fences, stock and fire control through the later 1800s (TPWD, *Edwards Plateau*). Grasses: little
  bluestem, sideoats grama, curly mesquite; mottes of live oak and cedar elm (TSHA, *Grasslands*). Live oak, Texas oak, shin
  oak, cedar elm, pecan and cypress along the rivers.
- **Game.** Deer mainly in the breaks and along the streams ("white-tailed deer were rarely found in the grasslands", TPWD),
  turkey, **bear** (a hunter near Currie's Creek "had killed sixty bears in the course of two years", Olmsted p. 223), bison
  and pronghorn on the open tops, Comanche hunting country. Berlandier hunted bear and bison with the Comanches "on open lands
  northwest of San Antonio" in the autumn of 1828 (Wikipedia, *Jean-Louis Berlandier*).
- **Travellers.** Olmsted near New Braunfels: wooded heights "with a thick screen of cedars" above prairies with "little belts,
  mottes and groups of live-oak" (pp. 137-138). Holley: hilltops crowned with cedars or oaks and pecans (p. 19,
  `HIST-TEX-016`).
- **On the map.** `hill-savanna`: the existing `hill-country` wash (pale limestone tan), mostly open grass with scattered live
  oak and mottes, rocks; `cedar-brake` on the steep breaks and canyons: dark blue-green, dense cedar and oak; `mixedgrass-
  prairie` on the flat tops. Art: `cedar-*` and `live-oak-*` are delivered.

### 4.8 The Mixed-grass Prairie of the north-west

Claim: `HIST-TEX-104` (bison, pronghorn).

- **Where.** The flat tops of the plateau (30a, 30d), the Limestone Plains and Red Prairie (27j, 27h) and the Caprock breaks
  (26c) in the map's north-west corner; LANDFIRE 11320 (7,100 square miles), 15040.
- **What grew.** Shorter grasses than the blackland: little bluestem, sideoats and blue grama, buffalo grass, curly mesquite;
  scattered mesquite on the deeper soils.
- **Game.** **Bison and pronghorn**: the buffalo "usually did not range farther than the Concho River valley" but came south
  and east in some seasons (TSHA, *Buffalo*). Mustangs. Comanche country, outside any settlement in 1836.
- **On the map.** `mixedgrass-prairie`: a paler, drier wash than the tallgrass, short tufts and rocks, a mesquite in 50
  patches.

### 4.9 The South Texas Plains, or Brush Country: open grassland with mottes, or thick brush, in 1836?

Claims: `HIST-TEX-097`, `HIST-TEX-096`; the Nueces line is `FIC-GONZ-060`.

**Mostly open: grass and mesquite prairie, with thickets on the ridges and denser chaparral toward the Rio Grande.** The brush
of today spread in the second half of the century.

- **Where.** South and west of Béxar and Goliad to the Rio Grande: EPA 31a, 31b, 31c, 31d, 34b, 34d, 34e; LANDFIRE 13900,
  13920 (thornscrub), 14380, 14400, 14420 (grassland), 14760 (riparian). The Nueces Strip, the land between the Nueces and the
  Rio Grande, and the **Wild Horse Desert** of the Coastal Sand Plain (34d).
- **What the evidence says.** TSHA's *Grasslands*: reconstruction is hard after long overgrazing, but "much of the northern and
  central part of the area was probably grassland" with scattered mesquite and shrubs. TPWD, *South Texas Plains*: tall grass
  prairie of little bluestem and switchgrass across the eastern half, short grass further west; brush expanded with
  "overgrazing by livestock, diminished occurrence of natural fire", fire having kept brush to the streams and small patches.
  Inglis (1964, as summarised by the Range Types of North America survey, not read directly): grassland or grass-shrub
  savanna, with dense thickets only on the ridges, and brush increasing steadily through the latter 1800s.
- **What the travellers saw.** Berlandier, February 1828, near Laredo: "endless plains, in which the traveler discovers only a
  visual horizon"; at the Nueces grass two to three feet tall, "numerous mustangs grazing at these spots"; but at the Cañada
  Verde thorny shrubs where the grasses were "completely excluded" (Berlandier, *Journey to Mexico*, as quoted by Sparkman).
  Holley: west of the Guadalupe the pasture is **mesquite grass**, "The Musquit tree also abounds here" for fuel and fencing
  (p. 18); the nopal "forms in places impenetrable thickets" (p. 69). Almonte, 1834, of the Béxar department: "The most common
  tree is the mesquite" (p. 189). Olmsted, 1854, on the coast road: "The country was a mesquit prairie, the grass very fine",
  "the trees in scattered clumps at long intervals" (p. 267); west of San Antonio toward the Frio the mesquite "became
  thicker and more bushy", approaching "the great chaparral desert of the Rio Grande" (p. 284); and, **decisively**, he saw "a
  similar young growth of mesquit trees upon open prairies", explained by fewer fires since the Americans came (p. 447).
  Kuykendall, 1903: the colony's prairies grazed until "weeds and bushes are fast usurping their surface"; "the annual burning
  of the grass prevented the spread of forest vegetation" (pp. 51-52).
- **What grew.** Mesquite, granjeno, blackbrush, guajillo, cenizo, lotebush, prickly pear, tasajillo, yucca in the thickets;
  on the grass, bluestems, Texas grama, curly mesquite; live oak mottes on the sand plain; hackberry, elm, ash, anacua and
  Montezuma cypress along the streams.
- **Game.** Deer abundant ("Numerous herds of deer peacefully traverse these solitudes", Berlandier), **mustangs** in great
  herds (Olmsted: "the resort of immense herds of wild horses", p. 444; Morfi, 1777, via Crosby), **pronghorn** ("one small herd
  of antelope" west of San Antonio, Olmsted p. 313), **javelina** (Holley's "Pecari or Mexican hog" on the frontiers, p. 95),
  turkey along the streams ("wild turkeys (guajolotes) abound", Berlandier), wild cattle, bison in the north in some seasons.
- **On the map.** Two biomes from the one thornscrub. `mesquite-savanna`: a tawny grass wash with scattered mesquite, prickly
  pear and here and there a thicket or a live oak motte - most of the country. `chaparral`: grey-olive, dense thornscrub with
  grass openings - the ridges, the lomas and, more of it, the Nueces Strip toward the Rio Grande and Mexico. **No log timber in
  either**: mesquite is fuel and fence posts (`HIST-TEX-016`), houses of jacal or stone (Almonte, Béxar and Goliad of stone,
  p. 190). Art: `mesquite-*`, `prickly-pear`, `scrub` exist; blackbrush thicket, yucca requested (§9).

### 4.10 The Coastal Sand Plain and the live oak mottes

Claim: `HIST-TEX-106`.

- **Where.** EPA 34d (Kenedy and Brooks country, the Wild Horse Desert) and round the bays (34h, 34i); LANDFIRE 13380
  (1,900 square miles), 14420 sand sheet grassland.
- **What grew.** Seacoast bluestem grassland banded with live oak groves, dense in spots, and smaller mesquite mottes (a
  modern ecological site description, seen only in a search summary and not read); dunes and blowouts.
- **Game.** Mustangs, deer, pronghorn, turkey in the mottes.
- **On the map.** `live-oak` as mottes: grass with dense live oak groves, not a continuous forest. Art: `live-oak-*` delivered.

### 4.11 The Rio Grande delta, the Tamaulipan riparian woods and the palm groves

Claim: `HIST-TEX-105`.

- **Where.** EPA 34f, 34e, 31d; LANDFIRE 14760 (3,300 square miles of riparian along the Rio Grande, the Nueces and every
  South Texas draw), 14670. Matamoros and the delta below it.
- **What grew.** Along the river and its resacas a gallery of sugar hackberry, cedar elm, Mexican ash, anacua, Texas ebony,
  willow and Montezuma cypress (Wikipedia, *Tamaulipan mezquital*). In the delta **groves of the Texas palm** (*Sabal
  mexicana*), 40 to 60 feet tall: "reported along the Rio Grande up to eighty miles inland" as late as 1852 (TSHA, *Texas
  Palm*); the Spanish called the river the Río de las Palmas; the palm forest is put at tens of thousands of acres before
  clearing began in the 1880s, under 30 acres of it left (Sabal Palm Sanctuary, a nonprofit's figures).
- **Game.** Deer, javelina, turkey, waterfowl, ocelot and jaguar (not hunted in the game).
- **On the map.** `thorn-riparian`: a dark gallery along the Rio Grande and the South Texas rivers, not the wide closed
  bottomland of the east. `palm-grove`: in the delta (34f, and the river's banks below about 98°W), palms among the riparian
  trees. Art: `palm-sabal` requested (§9).

### 4.12 The Mexican side, south and west of the Rio Grande

Claim: `HIST-TEX-108`.

- **Where.** Tamaulipas, Nuevo León and Coahuila within the map: 13,547 square miles of land (MAP_ACCURACY §8, measured).
- **What grew.** The same Tamaulipan thornscrub and grassland mosaic as the Nueces Strip, the **Tamaulipan mezquital**
  (Wikipedia): honey mesquite, granjeno, blackbrush, cacti; grassland on sandy soil; riparian woods on the rivers; palms in the
  delta. Berlandier, January 1828, on the road through Lampazos (Nuevo León): "woods of Mimosas, Yuca, Gobernadora ... Cactus"
  (as quoted by Sparkman). Olmsted crossed "The Chaparral Desert in Mexico" (his table of contents, p. 341). **The Sierra de Picachos**
  in the south-west corner is thornscrub below and **oak woodland above about 800 m (2,600 ft), with Arizona and Mexican
  pine** (Wikipedia, *Sierra de Picachos*).
- **On the map.** `chaparral` as the default on land joined to the far bank; `mesquite-savanna` on the delta plain round
  Matamoros; `thorn-riparian` along the Rio Grande's south bank as on the north; `palm-grove` in the delta; `hill-savanna` with
  oaks (not cedar) on the Sierra de Picachos above 800 m. `ceiling:` Mexico has no vegetation data in the game; INEGI's Serie I
  land-use and vegetation maps (1970s) are the way to a truer pattern and were not read.

---

## 5. Farmland in 1836 around the towns

### 5.1 Béxar and the missions

**What is documented** (`HIST-TEX-098`, `HIST-TEX-099`):

- **All the town's cultivated land was irrigated.** Almonte, 1834: "All the land under cultivation around Bexar is irrigated",
  and as much as fourteen leagues square more could be (pp. 187-188). Corn, cotton, sugar-cane, beans; figs and peaches the
  best in Texas.
- **The acequias.** Seven gravity ditches, dams and an aqueduct, a network of about fifteen miles that irrigated about **3,500
  acres** at its height (NPS figures, as given by Wikipedia, *Espada Acequia*). North to south: the **Upper Labor** ditch
  (begun 1776) in the north of the town; the **Alamo madre** (Valero's), from the head of the river at today's Brackenridge
  Park south through the mission compound, a branch on its north side and another east of the compound that "waters fields
  associated with the Barrio de Alamo" (Texas Public Archaeology Network); the **San Pedro** ditch (about 1734-38) from
  San Pedro Springs down the high ground between the creek and the river, watering the town's own fields; the **Concepción**
  (Pajalache) south to that mission; **San José** (about 600 acres west of the river), **San Juan** (over 500 acres on the east
  bank) and **Espada** (about three and a half miles, with its aqueduct over Piedras Creek) to the missions below (University of
  the Incarnate Word, *The San Antonio River and its Seven Acequias*; TSHA, *Acequias*). Each mission was "ringed with
  farmland irrigated by a comprehensive system of acequias" (TSHA, *Bexar County*); Olmsted: "Surrounding each was a large
  farm, irrigated at a great outlay of labor" (p. 155).
- **The fields in 1835-36.** Valero's lands were divided in 1793 among its Indians, the Adaes refugees and townspeople (TSHA,
  *San Antonio de Valero Mission*); irrigated land had declined markedly by 1815. In the siege of November 1835 the
  Texians were told to take corn only from fields east of the river, and in December the storming parties crossed "the
  cornfield" from the old mill north of the town and a brush fence (docs/battle-research, `HIST-TEX-031`, `HIST-TEX-037`).
  Berlandier, March 1828: "farmers cannot work their fields in safety", often not half a league from the town, for fear of
  raids (as quoted by Sparkman) - so the worked fields lay close in.
- **Timber was not close.** Béxar and Goliad built of stone because "the wood must be brought from a distance" (Almonte,
  p. 190); the town "lies basking on the edge of a vast plain" (Olmsted p. 148). Berlandier in 1828 found the surroundings
  still had "leafy forests" but saw them "being destroyed as the population increases" (as quoted by Sparkman). The river kept
  its fringe: the Texians at Concepción fought under pecans in a timbered bend with a bluff (docs/battle-research/concepcion.md,
  `HIST-TEX-020`). Mesquite stood thick in the dry ravines west of town at the Grass Fight (`HIST-TEX-031`).

**How far the farmland reached** (the envelope is `FIC-GONZ-062`, drawn inside these documented bounds):

| Part | From | To | Width | Source for the extent |
| --- | --- | --- | --- | --- |
| Upper Labor and the Alamo madre's head | the head of the river at Brackenridge Park, about 29.46°N (2.5-3 miles north of the plaza) | the town | the ground between the river and the ditch | UIW; Wikipedia, *Acequia Madre de Valero* |
| The town's fields (San Pedro ditch) | San Pedro Springs | south of the town between San Pedro Creek and the river | the creek to the river | UIW; TSHA, *Acequias* |
| The Alamo's fields | north and east of the compound | the Alamo madre's east branch | about three-quarters of a mile east of the church | TxPAN |
| The mission reach | Concepción, 2.3 miles south of the plaza | Espada, 7.6 miles south | about half a mile to three-quarters either side of the river | NPS acreages: San José about 600 acres west, San Juan about 300-500 east |

The whole is an envelope about eleven miles long and one to two and a half miles wide, of which the 3,500 irrigated acres
(5.5 square miles) are about half; in 1836 less than that was in crop.

**Recommended drawing.** Inside the envelope: stand `fields` - no woods at all, no creek strip, the bottomland and floodplain
cells turned to field. A **fringe of bank trees** one patch wide on the river and San Pedro Creek (pecan, cypress, cottonwood,
willow: the `bank-tree-*` Béxar already draws), and none along the ditches unless a source is found. The acequias drawn as thin
water lines from the town's layout (the terrain build removed them, `scripts/build-terrain.mjs`). Fields as the game's plots
already look: corn rows in spring and summer, `crop-stubble` in autumn and winter, some fallow grass; brush fences. Outside the
envelope, the land's own biome: `tallgrass-prairie` to the north and east, `mesquite-savanna` south and west, the river's
`bottomland` again beyond Espada and above the springs.

### 5.2 The other towns

| Town | What is documented about its fields | Recommendation |
| --- | --- | --- |
| **Goliad** (La Bahía) | A stone town because wood came from a distance (Almonte p. 190); the mission Espíritu Santo's wealth was cattle; the fort had a ditch | open ground round the presidio and town, a small field envelope on the river's bottom below the fort; `mesquite-savanna` beyond, the river's gallery kept |
| **Refugio** | Corn Bend, below the town on the river, was the colonists' common farm on ground the mission had farmed; cattle filled the meadows round the town (docs/town-research/refugio.md, Huson) | fields at Corn Bend; open meadow round the town |
| **Gonzales** | The four-league town tract: an inner town of forty-two blocks and "outer town lots ... of various and larger sizes" (Sons of DeWitt Colony, *Town of Gonzales*); labors between the town and the Guadalupe | cleared lots and small fields in the outer town, the river bottom's timber beyond; burned March 13, 1836 (`HIST-TEX-060`) |
| **San Felipe** | Labors of 177 acres spread out from the town along the waterways, where most settlers lived (docs/town-research/san-felipe.md) | the families' own fields are already the game's; no town-wide envelope |
| **Brazoria, Columbia** | Plantations cleared from the Brazos bottom and canebrake (Smithwick pp. 17-18; Groce's clearing, p. 19) | fields cut out of the bottomland round each plantation |
| **Nacogdoches, San Augustine** | Fields round Nacogdoches "very beautiful in the spring"; San Augustine's cotton fields between the town and the Sabine (Almonte pp. 208-209) | a cleared ring in the pine woods |
| **Mina (Bastrop), Washington, Victoria, Liberty, Matagorda, Harrisburg, Velasco** | Not found beyond the grants themselves | a cleared ring of town lots only (`FIC-GONZ-062`) |

**Rule for a cleared ring** (`FIC-GONZ-062`): every town clears its own streets and lots and a ring of gardens and small
fields about a quarter mile beyond its last lot, where no woods stand; Béxar alone has the long irrigated envelope. The
families' own plots stay the game's (`sim/fields.mjs`).

---

## 6. Gap analysis: the game's woods classes against 1836

### 6.1 The classes as built

The simulation's stands (`sim/woods.mjs`, `scripts/build-woods.mjs`): `prairie`, `post-oak`, `bottomland`, `creek`, `pine`,
`live-oak`, `hill-savanna`, `brush`, `marsh`, `water`, and `none` (off the data). The drawn land's washes
(`public/ground-classes.js`, from `scripts/build-land.mjs` and `build-outside.mjs`): `prairie`, `savanna`, `floodplain`,
`pine`, `live-oak`, `brush`, `hill-country`, `marsh`, `sand`, `desert` (unused), `water`.

### 6.2 Measured timber share by ecoregion inside the box, 2026-09-19

Every half mile over the box, the share of ground whose patch is timber (ten or more log trees an acre), and how much of it
only the creek strip makes:

| EPA IV | Timber | From the creek strip | 1836 expectation |
| --- | --- | --- | --- |
| 32a Northern Blackland Prairie | 31 | 16 | under 10: tallgrass with river galleries |
| 32b Southern Blackland/Fayette | 37 | 15 | 10-20 |
| 34a Northern Humid Coastal Prairie | 15 | 9 | about 5-10 outside the river bottoms |
| 34b Southern Subhumid Coastal Prairie | 14 | 8 | under 10 |
| 33b Southern Post Oak Savanna | 41 | 15 | 25-35 |
| 31c Texas-Tamaulipan Thornscrub | 30 | 14 | under 10; brush not timber |
| 31a Northern Nueces Alluvial Plains | 24 | 14 | under 10 |
| 30a Edwards Plateau Woodland | 50 | 23 | 15-25 |
| 30c Balcones Canyonlands | 52 | 21 | 35-50 (the cedar breaks) |
| 29e Limestone Cut Plain | 44 | 17 | 15-25 |
| 35a, 35e, 35f Piney Woods | 80-81 | 1-3 | right |
| 34c, 33f, 32c floodplains | 72-77 | 2-4 | right, less the canebrakes |

### 6.3 Missing, mis-assigned, and where

**Missing biomes.** Canebrake; longleaf pine savanna (it is loblolly `pine` now); the Big Thicket's mesic hardwood and
baygall; cypress swamp; cedar brake as distinct from open hill savanna; mixed-grass prairie (drawn as the same prairie as the
blackland and the coast); mesquite savanna as distinct from thornscrub; salt prairie and dunes (all `prairie`); palm groves;
Tamaulipan riparian woods as distinct from eastern creek timber; town farmland; anything in Mexico but brush.

**Mis-assigned settings** (`scripts/build-woods.mjs` `BY_MODEL`):

| Setting | Filed as | Should be | Why |
| --- | --- | --- | --- |
| 14800 Coastal Plain Swamp Systems | `marsh` (no trees) | `cypress-swamp` | cypress-tupelo swamp; Holley's "cypress" among the eastern timber |
| 13230 Mesic Hardwood Forest | `post-oak` | `thicket` | beech, magnolia, white oak: closed forest, not savanna |
| 15060 Wet Hardwood Flatwoods | `post-oak` | `thicket` | wet oak flatwoods |
| 13930 Edwards Plateau Limestone Shrubland | `hill-savanna` | `cedar-brake` | LANDFIRE calls it conifer: juniper-oak shrubland |
| 15230, 15240 Slope Forest, Mesic Canyon | `hill-savanna` | `cedar-brake` | the canyons and breaks |
| 14390 South Texas Lomas | `prairie` | `chaparral` | shrub-covered clay dunes |
| 14950 Depressional Wetland | `bottomland` | `marsh` | playa and pond |
| 11620 Western Great Plains Floodplain | `bottomland` (closed at 30 an acre over 31 in 100) | `creek` | a gallery on the western rivers, not a wide bottom |
| 11320, 11490, 15040 mixed and short grass | `prairie` (the same as the blackland) | `mixedgrass-prairie` | different grass, game and look |
| 31 Barren | `none` | `dunes` | the sand flats and islands |

**Mis-drawn for 1836, and where.**

1. **Béxar and the Alamo** (29.42°N, 98.49°W): 41 in 100 timber within a quarter mile of the church, 32 within half a mile;
   of it, 62 in 100 is LANDFIRE floodplain (14710) and 31 the creek strip on unnamed perennial lines and San Pedro, Alazán and
   Apache creeks. The screenshot `docs/evidence/alamo-after-bexar-street.png` shows the compound inside closed woods.
   **Clear to fields** (§5.1).
2. **Every prairie crossed by a creek.** The creek strip adds 15-24 points of closed timber in the blackland, the coastal
   prairie, the post oak and the hills (§6.2). Keep it on perennial creeks only, narrower (§4.6).
3. **The Hill Country** is half timber (30a, 30c): `hill-savanna` is 40 in 100 closed patches, an invented share (the
   model 13830 was not read). 1836: open savanna, cedar on the breaks.
4. **The South Texas brush.** Goliad has 38-46 in 100 `brush` within three miles, Refugio 54-55; the Nueces Strip and all
   Mexico are brush. 1836: mostly `mesquite-savanna`, with `chaparral` toward the Rio Grande.
5. **The drawn washes** (`docs/evidence/map-outside/whole.png`, `seam-southwest-close.png`,
   `alamo-after-gonzales-street.png`, looked at 2026-09-19): at every zoom the land reads as one soft green with darker
   blobs; blackland, coastal prairie, post oak and brush are near the same colour, and nothing says *tall grass*,
   *thorn thicket* or *marsh* at a glance. Each biome wants its own wash (§7.2).
6. **Coastal live oak** (13380) is a closed-and-open woods now; on the sand plain it was mottes in grass (§4.10).

---

## 7. Recommended classes

### 7.1 The stands (simulation)

Trees per acre are log-sized trees; every figure not marked LANDFIRE is invented (`FIC-GONZ-061`). "Game" is the 0-1 value
`sim/hunting.mjs` reads; "quarry" is which animals a hunt there may find (`FIC-GONZ-063`), from the documented pattern
(`HIST-TEX-103`, `HIST-TEX-104`).

| Stand | Filed from | Patch classes: share, trees an acre | Trees, most common first | Cover | Game | Quarry |
| --- | --- | --- | --- | --- | --- | --- |
| `tallgrass-prairie` | 14220, 14230, 14290 | grass 59/60 at 0; motte 1/60 at 3 large | bur oak, post oak, elm, hackberry | open | 0.2 | deer at edges; bison (north and west of the Colorado, seasonal, rare) |
| `coastal-prairie` | 14340 | grass 79/80; motte 1/80 at 3 large | live oak; ash, linden on the Trinity | open | 0.25 | deer at edges; waterfowl in winter; wild cattle and mustangs west of the Lavaca |
| `salt-prairie` | 14860 | grass | none | open | 0.15 | waterfowl |
| `dunes` | 14370, 31 | grass and bare sand | none | open (sand) | 0.05 | none |
| `mixedgrass-prairie` | 11320, 11490, 11480, 10940, 15040 | grass 49/50; mesquite 1/50 at 2 pole | mesquite | open | 0.3 | bison, pronghorn, deer on the streams |
| `mesquite-savanna` | 14380, 14400, 14420; 13900 and 13920 north-east of the Nueces | grass 70 at 0; scattered mesquite 18 at 4 pole; thicket 10 (brush); live oak motte 2 at 15 (on sand) | mesquite; live oak on sand | open (thicket patches brush) | 0.5 | deer, mustangs, pronghorn, javelina at thickets, turkey near water |
| `chaparral` | 13900, 13920 in the Nueces Strip and Mexico; 14390, 11110 | thicket 45 (brush); mesquite 25 at 15 pole; grass 30 | mesquite (no logs) | brush | 0.5 | javelina, deer, turkey near water |
| `post-oak` | 15190, 14100, 13040 | as now (LANDFIRE 15190: open mature 58 at 6; closed 18 at 30; early 14; thicket 6; open young 4 at 2) | post oak, blackjack, hickory | as now | 0.7 | deer, turkey, bear in the draws |
| `cross-timbers` | 13080 | closed 40 at 30; open 45 at 8; early 15 | blackjack, post oak | as now | 0.6 | deer, turkey, bison at the western edge |
| `pine` | 13710, 13780, 13580, 14580 outside the Big Thicket | as now | loblolly, shortleaf, post oak, blackjack | as now | 0.7 | deer, turkey, bear |
| `longleaf` | 13480, 14510 | open mature 70 at 12 large; young 20 at 30 pole; gap 10 | longleaf pine; some blackjack | timber/open by density | 0.6 | deer, turkey |
| `thicket` | 13230, 15060; 14580 and 13710 inside the Big Thicket (30.1-30.9°N, 94.0-95.0°W, EPA 35e/35f) | closed 70 at 40; open 20 at 20; baygall 10 (brush) | loblolly, beech, magnolia, white oak, water oak, sweetgum | timber; baygall brush | 0.8 | bear, deer, turkey |
| `bottomland` | 14730, 14710, 14670 | LANDFIRE 14730 as now; in 34c and coastal 33f 15 of the closed middle and gap become `cane` (brush, no trees) | as now | as now | 1 | deer, turkey, bear (canebrake) |
| `canebrake` | Caney Creek (Holley: 75 by 1-3 miles, Matagorda and Wharton country) and Oyster Creek (east of the Brazos) as drawn corridors | cane 85 (brush); large trees 15 at 5 | live oak, pecan, elm at the edges | brush | 1 | bear, deer |
| `cypress-swamp` | 14800 | closed 80 at 40 large; open water 20 | bald cypress, tupelo | timber, wet | 0.6 | bear, waterfowl |
| `creek` | 14740, 14720, 15250, 11620; the creek strip on perennial creeks | as now | as now | as now | 0.9 | deer, turkey |
| `thorn-riparian` | 14760, 11550 outside the delta | closed 55 at 25; open 30 at 10; gap 15 | hackberry, cedar elm, Mexican ash, anacua, cypress by water | timber/open | 0.9 | deer, turkey, javelina |
| `palm-grove` | 14760 in EPA 34f and on the river below about 98°W | palm 45 at 30; riparian 35 at 20; open 20 | Texas palm, ebony, hackberry | timber (palms give no wall logs) | 0.8 | deer, javelina, waterfowl |
| `live-oak` | 13380, 13390 | motte 40 at 25 large; grass 60 | live oak, hackberry | open/timber | 0.6 | deer, turkey, mustangs |
| `hill-savanna` | 13830; Mexico above 800 m (oaks, not cedar) | open 75 at 3 large; motte 20 at 25; cedar 5 at 30 pole | live oak, Texas oak, cedar elm, cedar, pecan by water | open mostly | 0.5 | deer and turkey in the breaks, bison and pronghorn on the tops, bear |
| `cedar-brake` | 15230, 15240, 13930 | closed 60 at 40 pole-log; open 40 at 8 | cedar, Texas oak, cedar elm | timber | 0.8 | deer, turkey, bear |
| `marsh` | 14900, 14950 | marsh | none | marsh | 0.3 | waterfowl |
| `fields` | the town farmland envelopes (§5) | field | none | open | 0.1 | none |
| `water`, `none` | 11; off the data | - | - | - | 0 | - |

**The Nueces line** for the thornscrub: north-east of the Nueces River (the river the map draws, `nueces-river-*`) a 13900 or
13920 cell is `mesquite-savanna`; south-west of it, and in Mexico, `chaparral`. It follows Olmsted's thickening mesquite past
the Frio and Holley's "west of the Guadalupe ... Musquit grass", and is `FIC-GONZ-060`.

**The Big Thicket rectangle** and **the delta** are reading rules, not surveyed lines (`FIC-GONZ-060`).

**Save compatibility.** Hunting, felling, clearing and the going read the woods only on a class whose `map.woods` is
`landfire-2016`. The implementer should record a new value (for example `biomes-1836`) on new classes and keep the old grid
for old saves, rather than bumping `saveVersion` (`CLAUDE.md`: the missing field has a correct old value).

### 7.2 The washes (drawing)

`public/ground-classes.js` gains a class per biome that looks different; colours are proposals (RGB, alpha about 0.3 over the
relief):

| Class | Colour | Marks (scattered detail) |
| --- | --- | --- |
| `tallgrass-prairie` | warm tawny gold, about 206 196 140 | tall grass tufts (new), a few flowers |
| `coastal-prairie` | green-gold, about 196 205 150 | grass tufts, a live oak now and then |
| `mixedgrass-prairie` | pale dry buff, about 214 205 160 | short tufts, rocks, a mesquite |
| `mesquite-savanna` | tawny with grey, about 200 190 140 | `mesquite-pole`, `prickly-pear`, tufts |
| `chaparral` | grey-olive, about 158 160 118 | dense `scrub`, `mesquite-*`, `prickly-pear`, yucca |
| `savanna` (post oak), `cross-timbers` | as now, 169 182 129 | as now |
| `pine` | as now, 86 112 74 | as now |
| `longleaf` | lighter green over grass, about 120 140 90 | grass tufts under tall pines |
| `thicket` | darkest green, about 70 98 64 | palmetto, cane |
| `floodplain` | as now, 111 138 85 | as now |
| `canebrake` | yellow-green, about 150 170 90 | cane clumps |
| `cypress-swamp` | dark wet green, about 90 110 90 | water flecks, cypress knees |
| `hill-country` | as now, 194 184 145 | as now |
| `cedar-brake` | dark blue-green, about 105 120 95 | `cedar-pole`, rocks |
| `live-oak` | as now, 122 145 96 | as now |
| `marsh`, `salt-prairie` | as now; salt paler, about 205 205 175 | `reeds`; salt flats |
| `sand`/`dunes` | as now | dune grass |
| `palm-grove` | green, about 120 150 90 | palms |
| `fields` | tilled brown, about 186 160 110; stubble in winter | the plots' own drawing, `crop-stubble`, brush fences |

---

## 8. Hunting and timber: who loses, and that it is intended

The owner's rule: woods only where woods make sense, and "some families are going to have a harder time hunting because
there's no woods. thats okay". Measured now within three miles of each settlement (2026-09-19; the grid, the creek strip as
built; then the strip on perennial creeks only):

| Settlement | Timber now | Perennial strip only | 1836 biome round it | Consequence |
| --- | --- | --- | --- | --- |
| Béxar (the Alamo) | 18 | 14 (8 with no strip) | fields, tallgrass, mesquite savanna | **Little timber, poor game near town**: wood from a distance, as Almonte says. Intended. |
| Goliad | 22 | 10 | mesquite savanna, river gallery | **No log timber off the river**; jacal or picket houses; deer and mustangs good, the wait short only near the river. |
| Refugio | 24 | 17 | mesquite savanna, coastal prairie | as Goliad. |
| Victoria | 38 | 33 | coastal prairie, Guadalupe bottom | timber only in the bottom; prairie families far from it. |
| San Felipe | 41 | 39 | coastal prairie and Brazos bottom | prairie families hunt poorly away from the bottom. |
| Liberty | 35 | 34 | coastal prairie, Trinity bottom, pine | prairie families as San Felipe. |
| Harrisburg | 14 | 10 | coastal prairie, Buffalo Bayou gallery | keep the bayou's gallery (§4.6). |
| Matagorda | 30 | 30 | marsh, live oak, bottom, canebrake near | unchanged; canebrake adds bear ground. |
| Gonzales | 55 | 46 | post oak, bottomland, blackland | a little less. |
| Washington | 52 | 45 | bottomland, post oak, blackland | a little less. |
| Mina (Bastrop) | 66 | 60 | Lost Pines, bottomland | unchanged. |
| Brazoria, Columbia | 79 | 78 | bottomland, canebrake | unchanged; cane replaces some timber. |
| Nacogdoches | 83 | 82 | pine | unchanged. |

A family on open prairie or mesquite savanna should read, in the hunt's words, why the wait is long ("Open prairie. Deer keep
to the timber on the river, three miles off.") and a felling refusal that says there is no log timber on its land. The game
can offer the documented alternatives: building a jacal (`HIST-GONZ-025`), buying logs or lumber in town (Bastrop pine was
sawn from 1838; `ceiling:` not in 1835), hunting on the bottom off its land when the rules allow.

---

## 9. Art needed, in the format of `docs/ART_REQUESTS.md` (proposed; not written there)

The implementer copies these into `docs/ART_REQUESTS.md` when it builds the biomes, with the stand-ins in *Stand-ins in use*.

#### Request 2026-09-19 — the country of 1836: trees and ground cover

- **Why.** The map is to show each natural region of 1836 (docs/BIOMES.md). Longleaf pine, the Texas palm, bald cypress,
  river cane, tall prairie grass and the South Texas thicket are what tell a student where they are, and the library has
  none of them.
- **What.** Transparent, anchored at the base, three-quarter view, in the style of `pine-loblolly-*` and `live-oak-*`:
  `pine-longleaf` at `-pole`, `-log`, `-large` (very tall straight trunk, sparse tufted crown of long needles high up, grass
  at the foot); `palm-sabal` at three sizes (a Texas palm: straight grey trunk, round head of fan leaves, 40-60 ft when large)
  and `palmetto` (a low fan clump, no trunk); `cypress-bald` at three sizes (buttressed flaring base, flat-topped feathery
  crown, with and without Spanish moss) and `cypress-knees`; `cane` (river cane in a dense clump, two variants, with a `-wind`
  frame) about twice a person's height; `grass-tall` (bluestem and Indian grass, waist to shoulder high, golden, with a
  `-wind` frame); `thicket-thorn` (a blackbrush-guajillo-granjeno clump, grey-green, two variants); `yucca` (Spanish dagger);
  `marsh-cordgrass` and `dune-grass` (sea oats on sand); `magnolia` and `beech` at `-log` and `-large` for the thicket.
- **How it plugs in.** `KINDS` in `sim/woods.mjs` names each tree kind's picture; `GROUND_CLASSES` in
  `public/ground-classes.js` names each class's marks. Registering the frames and changing the names is the whole swap.
- **Check.** Beside `oak-broad` at the same size a longleaf reads taller and more open than a loblolly, a palm unlike any
  pine, cane as a solid wall, tall grass above a person's knee; a closed stand still reads closed.
- **Stand-ins until then.** longleaf as `pine-loblolly-*`; palm as `sapling` scaled tall; palmetto as `scrub` tinted green;
  cypress as `cedar-large` tinted lighter; cane as `reeds` at twice the size; tall grass as `grass-tuft` at 1.4 times;
  thicket as `scrub` and `mesquite-pole` clustered; yucca as `prickly-pear`; cordgrass as `reeds`; magnolia and beech as
  `oak-broad`.

#### Request 2026-09-19 — Béxar's fields and acequias

- **Why.** The owner decided (2026-09-19) that the Alamo stood among irrigated fields, not woods; the fields need to look
  like Béxar's labores, not the colonies' log-fenced plots.
- **What.** `acequia` (an earth ditch a yard wide with water, straight and bend pieces, and a plank crossing),
  `field-irrigated` (corn in furrows along a ditch, young and mature, sharing the corn frames' scale), `fence-brush` (a brush
  fence, the kind the Texians crossed in December 1835), and `field-fallow` (grass and weeds on an old field).
- **How it plugs in.** The Béxar layout (`public/bexar-layout.js`) lays the acequias as lines and the fields as plots;
  `drawPlots` draws them.
- **Check.** At the street zoom the Alamo stands in open fields with ditches and a line of bank trees on the river.
- **Stand-ins until then.** acequias as a thin water stroke; fields as the existing plot drawing with `corn-*` and
  `crop-stubble`; brush fences as `clearing-brush-dry` in a row.

#### Request 2026-09-19 — the game of 1836

- **Why.** The quarry a hunt finds should be the country's (`HIST-TEX-103`, `HIST-TEX-104`): turkey in the bottoms, bear in
  the canebrakes and the thicket, javelina in the chaparral, pronghorn and bison on the western grass, waterfowl on the coast.
  Only the deer is drawn.
- **What.** As the delivered `wildlife-deer` (idle, alert, bound, four frames each, east-facing, anchored at the feet):
  `wildlife-turkey`, `wildlife-bear`, `wildlife-javelina`, `wildlife-pronghorn`, `wildlife-bison`, `wildlife-geese` (a flight
  and a resting flock), `wildlife-mustang` (a wild horse, rougher than the family's).
- **How it plugs in.** `miniDeer` in `public/app.js` draws the clip for `chore.quarry`; the quarry's kind picks the sheet.
- **Check.** Scale against `wildlife-deer` and `horse-chestnut`.
- **Stand-in until then.** **None: words only** for any quarry that is not a deer, as the Yellow Stone is words only - a
  deer drawn where the words say a bear would be a wrong picture. Mustangs may use the family horse's walk tinted.

Already open and still needed: post oak and blackjack at three sizes (Request 2026-09-15, the trees of the colonies).

---

## 10. What is history and what is not

**History** (`HIST-TEX-094` to `HIST-TEX-108`): where each kind of country lay and what grew in it as the travellers and the
institutional references describe; the canebrakes; that prairie creeks could be treeless; that fire kept the prairies open
and brush spread after settlement; that the South Texas plains were mostly grass and mesquite prairie with thickets; the
Hill Country's open savanna and cedar breaks; the palm groves; the Béxar acequias, their irrigated fields and the town's
scarcity of wood; the game of each country; the Cross Timbers' southern end; the Mexican side's thornscrub and the Sierra de
Picachos' oaks.

**Invented** (`FIC-GONZ-060` to `FIC-GONZ-063`): which setting and ecoregion become which biome and every line drawn to
divide them (the Nueces line, the Big Thicket rectangle, the delta, 800 m on the Sierra); every trees-per-acre figure and
patch share not LANDFIRE's; the farmland envelopes and cleared rings; every game value and which quarry each stand holds.

---

## 11. Looked for and not found, or not read

- **General Land Office survey field notes** (bearing trees at grant corners) - not reachable without the GLO archive; they
  remain the way to true densities for particular leagues.
- **LANDFIRE model descriptions** for 13830, 13900, 14220, 13380, 14380 - PDFs, not read under the no-download rule (§2).
- **Berlandier's *Journey to Mexico* (1980)** was read only as quoted by Michael Sparkman's *Texas History Lessons* posts;
  the passages are the translation those posts give. His 1834 "small forests of oaks" in the Wild Horse Desert was seen only
  in a search summary and is not used.
- **Inglis, *A History of Vegetation on the Rio Grande Plain* (TPWD Bulletin 45, 1964)**, the standard reconstruction of the
  South Texas brush - only summaries were read (its host's certificate had expired).
- **Kuykendall's** full *Reminiscences* was read in the July 1903 part only (vol. 7 no. 1); the January and April parts were
  searched for game words.
- **TSHA Handbook entries** on the Piney Woods, the Post Oak Belt, the Blackland Prairie, the Coastal Prairie, the Rio Grande
  Plain and the Wild Horse Desert returned "not found" at the URLs tried; the *Grasslands*, *Forests*, *Big Thicket*, *Cross
  Timbers*, *Lost Pines Forest*, *Balcones Escarpment*, *Edwards Plateau*, *Buffalo*, *Texas Palm*, *Padre Island*,
  *Acequias*, *Bexar County* and *San Antonio de Valero Mission* entries were read.
- **The Labastida map's legend** (1836) for fields round the Alamo - the transcription page carries only the image.
- **How far east bison came in 1835** - no source read gives a line; Holley says seldom near the coast, Kuykendall saw one
  herd near New Year's Creek in 1822 and many on the Yegua in 1825, Berlandier hunted them north-west of Béxar in 1828.
- **Waterfowl on the Texas coast in the 1830s** - only Almonte's list of birds (ducks); the game's winter waterfowl rests on
  the modern pattern.
- **Mexico's vegetation** - INEGI not read.
- **Fields at Mina, Washington, Victoria, Liberty, Matagorda, Harrisburg, Velasco** - nothing beyond the grants.

---

## 12. Sources

Read 2026-09-19 unless stated. Page numbers are the printed pages in the archive texts.

**Travellers and contemporaries**

- Mary Austin Holley, *Texas* (Lexington, 1836), pp. 16-19, 36, 47-51, 69, 95-99: https://archive.org/details/texas00holl
- Noah Smithwick, *The Evolution of a State* (Austin, 1900), pp. 17-19: https://archive.org/details/evolutionofstate00smit
- J. H. Kuykendall, "Reminiscences of Early Texans", *Quarterly of the Texas State Historical Association* 7:1 (July 1903),
  pp. 29, 37, 51-52: https://archive.org/details/sim_southwestern-historical-quarterly_1903-07_7_1
- "Journal of Lincecum's Travels in Texas, 1835", ed. T. N. Campbell, *Southwestern Historical Quarterly* 53:2
  (October 1949), pp. 183-194 cited: https://archive.org/details/sim_southwestern-historical-quarterly_1949-10_53_2
- Juan N. Almonte, "Statistical Report on Texas, 1834", trans. C. E. Castañeda, *Southwestern Historical Quarterly* 28:3
  (January 1925), pp. 182-190, 202, 208-209: https://archive.org/details/sim_southwestern-historical-quarterly_1925-01_28_3
- Frederick Law Olmsted, *A Journey Through Texas* (New York, 1857), pp. 80-91, 109, 137-138, 148, 155, 223-224, 267, 284,
  313, 444-447: https://archive.org/stream/ajourneythrough00olmsgoog/ajourneythrough00olmsgoog_djvu.txt
- Jean Louis Berlandier, *Journey to Mexico During the Years 1826 to 1834* (TSHA, 1980), as quoted by Michael Sparkman:
  https://texashistorylessons.substack.com/p/a-visit-to-texas-in-1828 and
  https://texashistorylessons.substack.com/p/1828-berlandier-in-texas-part-2

**Institutional references**

- TSHA Handbook: *Grasslands* https://www.tshaonline.org/handbook/entries/grasslands ; *Forests*
  https://www.tshaonline.org/handbook/entries/forests ; *Big Thicket* https://www.tshaonline.org/handbook/entries/big-thicket ;
  *Cross Timbers* https://www.tshaonline.org/handbook/entries/cross-timbers ; *Lost Pines Forest*
  https://www.tshaonline.org/handbook/entries/lost-pines-forest ; *Balcones Escarpment*
  https://www.tshaonline.org/handbook/entries/balcones-escarpment ; *Edwards Plateau*
  https://www.tshaonline.org/handbook/entries/edwards-plateau ; *Buffalo* https://www.tshaonline.org/handbook/entries/buffalo ;
  *Texas Palm* https://www.tshaonline.org/handbook/entries/texas-palm ; *Padre Island*
  https://www.tshaonline.org/handbook/entries/padre-island ; *Acequias* https://www.tshaonline.org/handbook/entries/acequias ;
  *Bexar County* https://www.tshaonline.org/handbook/entries/bexar-county ; *San Antonio de Valero Mission*
  https://www.tshaonline.org/handbook/entries/san-antonio-de-valero-mission
- Texas Parks and Wildlife: *Post Oak Savannah and Blackland Prairie Wildlife Management*
  https://tpwd.texas.gov/landwater/land/habitats/post_oak/ ; *Oak-Prairie Wildlife Management*
  https://tpwd.texas.gov/landwater/land/habitats/oak_prairie/ ; *Edwards Plateau*
  https://tpwd.texas.gov/landwater/land/habitats/cross_timbers/ecoregions/edwards_plateau.phtml ; *South Texas Plains*
  https://tpwd.texas.gov/landwater/land/habitats/southtx_plain/
- Texas Public Archaeology Network, *Acequia Madre in 1836*:
  https://txpan.txst.edu/projects/history-of-the-witte-memorial-museum/1719-acequia-madre/acequia-madre-in-1836.html
- University of the Incarnate Word, *The San Antonio River and its Seven Acequias*:
  https://www.uiw.edu/sanantonio/sevenacequias.html
- Sons of DeWitt Colony, *The Acequias of San Antonio* http://www.sonsofdewittcolony.org/adp/archives/glossary/acequia.html ;
  *Town of Gonzales* http://www.sonsofdewittcolony.org/gonzalestown.htm
- Wikipedia: *Big Thicket* https://en.wikipedia.org/wiki/Big_Thicket ; *Espada Acequia*
  https://en.wikipedia.org/wiki/Espada_Acequia ; *Acequia Madre de Valero*
  https://en.wikipedia.org/wiki/Acequia_Madre_de_Valero_(San_Antonio) ; *Tamaulipan mezquital*
  https://en.wikipedia.org/wiki/Tamaulipan_mezquital ; *Sabal mexicana* https://en.wikipedia.org/wiki/Sabal_mexicana ;
  *Sierra de Picachos* https://en.wikipedia.org/wiki/Sierra_de_Picachos ; *Jean-Louis Berlandier*
  https://en.wikipedia.org/wiki/Jean-Louis_Berlandier ; *Nueces Strip*
  https://en.wikipedia.org/wiki/Nueces_Strip
- Sabal Palm Sanctuary, *The Story of Sabal*: https://www.sabalpalmsanctuary.org/contact-us/the-story-of-sabal/

**Data** (already on disk; nothing downloaded for this research)

- LANDFIRE LF2016 Biophysical Settings and its attribute table, `C:\Users\zachw\TexasData\raw\landfire\bps`
  (docs/evidence/outside-data.json).
- EPA Level IV Ecoregions of Texas, `C:\Users\zachw\TexasData\raw\eco\tx_eco_l4` (docs/evidence/woods-data.json).
- The game's own grids, read through `sim/woods.mjs` and `sim/ground.mjs` for §6 and §8.
- The repository's own research: `docs/battle-research/concepcion.md`, `grass-fight.md`, `bexar-storming.md`;
  `docs/town-research/refugio.md`, `san-felipe.md`.

---

## 13. As built, 2026-09-19

The second session built §7 the same day. Same computer only (Windows, headless Chrome); not LAN or district acceptance.

### 13.1 What was built

- **The rules** are one module, `scripts/terrain/biomes.mjs`, read by both builds so the box and the country outside it are
  filed alike: `BY_MODEL` (§3.1 and §7.1, with the ten mis-filed settings of §6.3 filed right), the Nueces line (`nuecesSide`:
  a ray due north crosses the river an odd number of times from the Strip; the river runs on due west from its head), the Big
  Thicket's rectangle, the coastal bottoms' cane (EPA 34c, and 33f below 29.6°N), the delta's palms (14760 in 34f, or within 1.5
  miles of the Rio Grande east of 98°W), the canebrakes of Caney Creek (0.75 mile either side, 28.85-29.35°N) and Oyster Creek
  (0.35 mile, below 29.45°N), Béxar's fields and every other town's ring, and Mexico's zones. All `FIC-GONZ-060`/`-062`.
- **The box's grid** (`public/terrain/colonies-woods.*`, `scripts/build-woods.mjs`) is read from the whole map's LANDFIRE
  raster (the box's own raster of 2026-09-15 is gone; the two differ in cell size, 0.00237° against 0.00236°, so about one
  cell in seven at a stand's edge moves by a cell - the pattern, not the stands, changed by it). Shares of the box: tallgrass
  prairie 12.0, coastal prairie 11.5, post oak 10.2, mesquite prairie 8.3, hill savanna 7.9, bottomland 7.2 (and 1.3 with cane),
  pine 6.5, creek 4.5, longleaf 4.0, cedar brake 3.1, thicket 1.3, mixed-grass 1.3, cross timbers 1.0, thorn riparian 0.9,
  marsh 0.7, live oak 0.5, salt prairie 0.4, chaparral 0.4, cypress 0.2, canebrake 0.2, dunes 0.1, fields 0.05, water 4.4,
  off the data 12.2 (in 100 of the cells).
- **The stands** (`STANDS` in `sim/woods.mjs`) are §7.1's table as written: patch classes, trees an acre, kinds, `game` and
  `quarry`, with three additions the research implies: `bottomland-cane` (the coastal bottoms' cane share, filed on the grid
  so the classes stay per stand), `creek-draw` (§4.6's few trees on an intermittent creek through post oak, cross timbers or
  the hills: 60 in 100 of patches at 6 large trees an acre, open ground) and `bank` (§5.1's line of trees on a river through a
  town's fields: 75 in 100 at 15 an acre). A patch class may carry its own cover (a thicket, cane or chaparral's mesquite is
  brush) and its own kinds (a live oak motte in the mesquite, the palms). Fourteen new kinds of tree, each with logs and use
  (`KINDS`; invented, `FIC-GONZ-061`): bur oak, longleaf, beech, magnolia, white oak, sweetgum, bald cypress, tupelo, cedar elm,
  anacua, Texas ebony, willow, Texas palm, Texas oak.
- **Creeks** (§4.6): through the prairies, the mesquite and the chaparral a creek keeps timber only if it runs all year
  (`CREEK_STRIP_MILES` 0.045, one or two patches; the brush country's is its river woods); an intermittent creek through post
  oak, cross timbers or the hills keeps `creek-draw`; through the prairies none. The strip is worked out as it always was, from
  the creeks the map draws, not written into the grid.
- **Béxar** (§5.1): the San Antonio half a mile either side from its head (29.478°N) to Espada, San Pedro Creek 0.35 mile from its
  springs, the Alamo's fields 0.8 mile round the church, and half a mile round each of the four missions: 20 square miles of
  `fields`. Within a quarter mile of the Alamo, timber fell from 41 in 100 of the ground (the 2016 grid) to under 15, the line
  of bank trees. **Every other town** has a cleared ring of fields 0.7 mile round its middle (§5.2's rule).
- **The washes**: the land file (`colonies-land.*`, `outside-land.*`) carries a class per biome - twenty-six ids, so a cell's
  land class is now five bits and its relief three (`landBits: 5`; the page and the server read either) - and
  `public/ground-classes.js` gives each §7.2's colour (pushed apart) and marks. Every wash was made stronger (alpha about .3 to
  about .5) so the country's colour shows over the relief's green. Relief, water and the data's edge are cell for cell as they
  were.
- **Outside the box** (`scripts/build-outside.mjs`): the same rules; Mexico chaparral, with mesquite prairie on the delta plain
  (east of 98°W under 30 m), river woods on the south bank (palms east of 98°W), oak savanna above 800 m.
- **Old classes**: a class that recorded `landfire-2016` keeps its own grid (`colonies-woods-2016.*`, the old files as they
  were) and its own stands (`STANDS_2016`); new classes record `biomes-1836`. No save version moved.

### 13.2 Where it differs from §7, and why

- `bottomland`'s cane share is a stand of its own on the grid (`bottomland-cane`), not a region test at run time: the patch
  classes are per stand. Its "15 of the closed middle and gap" is read as cane 15, closed middle 6, gap 5 in 100.
- `creek-draw` and `bank` are not in §7.1's table; §4.6 and §5.1 describe them.
- The strip on perennial creeks is 0.045 mile either side of the creek (one or two patches), not exactly one patch.
- Béxar's envelope adds the four missions' rings (Espada lies off the river's line); it is 20 square miles, inside §5.1's
  one to two and a half miles by eleven.
- The mesquite prairie's live oak motte stands in 2 in 100 of its patches everywhere, not only on sand (`ceiling:`).
- The coastal and tallgrass prairie inside EPA 34g, 34h and 34i is drawn as marsh, as since 2026-09-17; the simulation keeps its
  stand.
- The quarry is words only (the hunt's facts: "Deer, turkey and bear keep to it."); the hunt still finds a deer. Which animal a
  hunt brings is the balance session's. **Done the same day** ([BIOME_GAMEPLAY](BIOME_GAMEPLAY.md) §3.1): the hunt brings its
  place's quarry, still drawn only when it is a deer.
- Colours: §7.2's proposals were too close over the relief's green; they are pushed apart and stronger.
- The acequias are not drawn (§5.1's request is open), and nothing of §5.2's particular fields (Corn Bend, the plantations) is
  laid beyond the rings.

### 13.3 Who loses timber and game (measured 2026-09-19)

Within three miles of each town, the share of ground that is timber and the mean game, 2016 grid then biomes: Béxar 18 → 7
(0.36 → 0.22), Goliad 22 → 10 (0.52 → 0.47), Refugio 25 → 14 (0.54 → 0.47), Harrisburg 13 → 5 (0.32 → 0.28), Victoria 39 → 32,
San Felipe 40 → 32, Liberty 37 → 31, Matagorda 40 → 35, Gonzales 57 → 46 (0.73 → 0.66), Washington 54 → 43, Mina 67 → 58,
Brazoria 81 → 67, Columbia 54 → 42, Nacogdoches 82 → 83. Families (three thirty-family classes, ninety families; the starts
are San Felipe, Columbia, Matagorda, Mina, Liberty, Gonzales and Victoria): the median of sound logs standing on a family's land
within a mile of its house fell by half or more on the coast (San Felipe 2,530 → 990, Columbia 3,777 → 1,534, Liberty 3,489 →
1,587, Matagorda 1,747 → 711; Gonzales 3,738 → 2,000; Mina and Victoria about the same); 13 families of 90 have fewer than the
fifty a cabin wants (5 before) and would build a jacal; the best hunting ground within a mile fell from about 0.9 to 0.75 on the
coast and stayed about 0.9-1 inland. No family is stuck: a jacal wants no logs (§8, `tests/biomes.test.mjs`).

### 13.4 Evidence

- Tests: `tests/biomes.test.mjs` (7), and the existing woods, land, felling, hunting and outside tests amended (the 2016 grid's
  tests now name it). Eight injected regressions, each caught; two also fail a second test that reads the same thing (recorded
  in `docs/evidence/biomes/injections.json`).
- Screenshots before and after, `docs/evidence/biomes/{before,after}-*.png` (`scripts/biomes-screenshots.mjs`).
- Performance: `docs/evidence/perf-render-biomes-{after,after-2,before-2}.json`, the same on this computer (§13.5).

### 13.5 What is left

- ~~The balance session: which quarry a hunt brings, the game values, and whether a prairie family wants logs from town.~~
  **Done the same day**, [BIOME_GAMEPLAY](BIOME_GAMEPLAY.md): the quarry by place and season, logs fetched from the nearest
  timber with the ox and wagon (not bought in town), fences as long as their rails are far; the game values left as they are
  (§4 there says why).
- Art (docs/ART_REQUESTS.md, three requests of 2026-09-19).
- The acequias drawn; Corn Bend and the plantations' fields; the LANDFIRE model PDFs (§2) before any trees-an-acre is claimed.
- `colonies-province.json.gz` was not rebuilt: its cover belts are the 2016 land's, drawn only while the land's classes load.

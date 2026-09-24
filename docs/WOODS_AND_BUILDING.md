# The woods on a family's land, hunting it, felling it, and building a house from it

**Status: house plot and staged construction completed 2026-09-15 (§8.1); steps 1 to 4 - the woods, the trees drawn, hunting on the family's land, felling and hauling - built 2026-09-15 (§4.4, §4.5, §5.1, §6.1.1; [evidence](evidence/woods-data.json), [browser](evidence/woods-browser.json), [hunting](evidence/hunt-land.json), [felling](evidence/felling.json)).** Read this in full before changing where timber stands, what a
hunt finds, felling, logs, or how a house is planned and raised. It amends `docs/SETTLING_IN.md` §5–6 (a house is
no longer one of four fixed layouts raised as one bar of work) and `docs/LAND_GRANTS.md` §8.4 (timber is no longer
"within 0.9 miles of a river and 0.2 of a creek" everywhere).

---

## 1. What the owner asked for

> "find resources on forests of Texas locations. I want realistic forest population. players should be able to
> hunt on their own land. players should have to cut down trees to build their houses. construction of a house
> should be more interactive. players can build a prebuilt plan (historically relevant like a dogrun, or they can
> freebuild their house using the construction assets we have."
>
> — 2026-09-15

| Question | Owner's answer, 2026-09-15 |
| --- | --- |
| Where does the woods' pattern come from? | **Download the two government maps**: LANDFIRE's pre-settlement vegetation (Biophysical Settings) and EPA's Level IV ecoregions of Texas, built into a grid the game ships, as the elevation was. The owner's email was given to LANDFIRE's download service, which requires one. |
| How does free building work? | **Rooms on a grid.** A house plot on which the family places period pieces — log pens (round or hewn), an open passage, a chimney, a shed room, a porch, a loft. Every piece states its logs and hours. The historical plans are presets of the same pieces. |
| Real time, or a class-length house? | **Real counts, compressed time.** Real numbers of trees and logs, each tree felled on the family's own land and leaving a stump; minutes of game time a tree and a course of logs, not hours, so a house can stand inside a class. Marked `ceiling:`. |

---

## 2. Resources found

### 2.1 Where the woods stood: data

| Source | What it is | How it is used |
| --- | --- | --- |
| **LANDFIRE Biophysical Settings, LF 2016 (`LF2016_BPS`)**, USGS/USDA, public domain. Requested 2026-09-15 through the LANDFIRE Product Service for 99–94°W, 28–32°N, resampled to 240 m, geographic coordinates; 2,120 × 1,706 cells, 1 MB zipped. | A modelled map of the vegetation that "may have been dominant on the landscape prior to Euro-American settlement". Forty-nine settings occur in the colonies box; by area the largest are Texas-Louisiana Coastal Prairie, Southern Blackland Tallgrass Prairie, East-Central Texas Plains Post Oak Savanna and Woodland, Edwards Plateau Limestone Savanna, Gulf Coastal Plain Floodplain Systems, Tamaulipan Thornscrub, and West Gulf Coastal Plain Pine-Hardwood Forest. It maps the **Lost Pines** (East-Central Texas Plains Southern Pine Forest) round Bastrop, which is Mina. | Which kind of woods stands in each 240 m cell of the real map. Not kept in the repository; `scripts/build-woods.mjs` builds `public/terrain/colonies-woods.bin.gz` from it. |
| **LANDFIRE BpS model descriptions** (Forest Service Fire Effects Information System, `research.fs.usda.gov/sites/default/files/feis/bps/<model>.pdf`), public domain. Read 2026-09-15: 15190 post oak savanna, 14730 floodplain, 14740 small-stream riparian, 13710 pine-hardwood, 13580 southern (Lost) pines, 14340 coastal prairie. | For each setting: its indicator trees, and the share of the land in each **succession class** (open or closed, young or mature) with the largest tree size of each. The floodplain model gives a density outright: **canopy trees 15–30 an acre**, many over 20 inches through. Post oak savanna is 58 in 100 of its land in the open mature class, "large oaks... widely scattered", and 18 in 100 closed thickets. | How many log-sized trees stand per acre in each patch, and which kinds (§4). |
| **EPA Level IV Ecoregions of Texas** (`tx_eco_l4`, 2011), public domain, 4 MB. | Named regions: Northern and Southern Post Oak Savanna, Floodplains and Low Terraces, Northern Humid Gulf Coastal Prairies, and so on. | The region's name in a family's words about its land; a cross-check on the vegetation grid. |
| National Hydrography Dataset flowlines (already in the game, `docs/LAND_GRANTS.md` §8). | Every creek. | 240 m cells miss narrow creek timber, so a creek the map draws keeps a strip of riparian woods through prairie (§4.1). |

### 2.2 Where the woods stood: people who saw them

| Source | What it says | Claim |
| --- | --- | --- |
| Mary Austin Holley, *Texas* (Lexington, 1836), [archive.org](https://archive.org/details/texas00holl), pp. 16–21, 47–51. | Region by region: the Sabine–San Jacinto country "heavily timbered with pine, oak, ash, cedar, cypress", with small prairies of 100–1,000 acres (p. 47); the Brazos, San Bernard and Colorado bottoms three to twenty miles wide and heavily timbered with live oak, red and black oak, cedar, pecan, elm, hackberry and mulberry, with cane-brakes (p. 16); near the coast live oak "of enormous size", from Matagorda Bay to Galveston Bay and seventy miles up the Brazos (pp. 49–50); cottonwood on the river banks, "the least valuable" timber but yielding easily to the axe (pp. 49–50); between the rivers open prairie with "points and islands of timber" (p. 51); the rolling country up the Brazos, Colorado and Guadalupe "diversified with prairie and woodland", the woods round the prairies giving "the best of oak, cedar, ash" for fencing and building, hilltops crowned with cedars or groves of oaks and pecans (pp. 19–20); west of the Guadalupe less timber, and mesquite the size of a peach tree, good for fencing and fuel (pp. 18, 21). | `HIST-TEX-016` |
| Noah Smithwick, *The Evolution of a State* (Austin, 1900), [archive.org](https://archive.org/details/evolutionofstate00smit), p. 232. | A young man with land "could cut down trees and build himself a house"; a proud one built a double cabin "with either a wide passage between or a big double chimney", and later a smoke house. | `HIST-TEX-017` |
| Already registered: `HIST-GONZ-012` (Gonzales country: post oak savannah to live oak, pecan and walnut timber), `HIST-GONZ-025`, `-026`, `-029` to `-035` (log houses, jacal, chimneys, clapboard roofs, dirt and puncheon floors, a house in a week, the dog-run), `HIST-GONZ-039` (clearing timber is three times breaking prairie), `HIST-TEX-015` (deer hunted near the house). | | |

### 2.3 Looked for and not found, or not read

- **A first-hand count of the logs or trees in a Texas cabin**, and how long felling one tree took. Not found in the
  sources read. Every log count and felling time here is invented (`FIC-GONZ-032`). Terry G. Jordan, *Texas Log
  Buildings: A Folk Architecture* (University of Texas Press, 1978) is the standard work on timber choice, notching,
  pen sizes, the dog-run and the saddlebag in Texas; it is in copyright and was not read. It is the first thing to
  read before any number in §6 is claimed as history.
- **General Land Office survey field notes** for the colonies record bearing trees at grant corners (species,
  diameter, distance) and would give real densities and species for particular leagues; the GLO archive holds them.
  Not read.
- The LANDFIRE models for Edwards Plateau savanna (13830), thornscrub (13900), blackland prairie (14220) and the
  coastal fringe live oak woods (13380) were downloaded and not yet read; §4's rows for them are marked so.
- LANDFIRE maps **modelled** vegetation of the present biophysical setting under a reconstructed fire regime, not a
  survey of 1835. Where Holley and the model disagree, the game follows the model's pattern and Holley's trees.

---

## 3. What is history and what is not

**History:** where prairie, savanna, bottomland and pine stood (`HIST-TEX-016` for what travellers saw; the LANDFIRE
grid as the modelled pattern); which trees grew where; that cottonwood is easy to cut and poor timber and mesquite no
building timber; that settlers felled their own trees for their houses (`HIST-TEX-017`); the house pieces that
existed — round and hewn log pens, the passage, stick-and-mud and stone chimneys, clapboard roofs, dirt and puncheon
floors, a double chimney between two pens (`HIST-GONZ-025`, `-029` to `-031`, `-035`, `HIST-TEX-017`).

**Invented, `FIC-GONZ-032` (the woods) and `FIC-GONZ-033` (building):** every trees-per-acre figure except the
floodplain's canopy range; the patch size; how many logs a tree yields and a piece needs; every felling, hauling and
raising time; the grid, its cell size and the rules for placing pieces; every effect a piece has on rest, food and
room; which courses want two people; the jacal's poles.

---

## 4. The woods

### 4.1 Stands

Every point of the real map is one **stand**, read from the vegetation grid:

| Stand | LANDFIRE settings | Log-sized trees | Kinds, most common first | Game in it |
| --- | --- | --- | --- | --- |
| `prairie` | coastal, blackland, saline and calcareous prairies, dune grass, Tamaulipan grassland | none, except a **motte**: 1 patch in 40 is a clump of 3–8 oaks (Holley's "islands of timber") | post oak, live oak (coast) | poor |
| `post-oak` | 15190, 13080 Crosstimbers | patch by patch as the model's classes: open mature 58 in 100 of patches at 6 an acre; closed 18 at 30; young open 4 at 2; thicket 6 and early 14 at none | post oak, blackjack oak, black hickory | good at the edges |
| `bottomland` | 14730, 14710, 11620 floodplains | closed mature 43 at 30 an acre; open mature 31 at 15; closed middle 16 at 40 poles; early 10 at none (**15–30 sourced**) | pecan, elm, ash, hackberry, water and willow oak, cottonwood on the banks; live oak below 70 miles up the Brazos | best |
| `creek` | 14740, 14720, 15250, 14760 riparian; and any creek the map draws through prairie or savanna, within 0.1 mile | closed mature 67 at 30; closed middle 19 at 40 poles; early 14 at none | pecan, elm, hackberry, oak, cottonwood; loblolly and magnolia east of the Brazos | good |
| `pine` | 13580 Lost Pines, 13710, 14580, 13780 pine-hardwood; 13480, 14510 longleaf | open mature 54 at 12; closed 22 (13580) or 4 (13710) at 40; open middle 7–22 at 20; early at none | loblolly pine, shortleaf pine, post oak, blackjack | good |
| `live-oak` | 13380, 13390 coastal fringe | *model not read*: closed 50 at 25, open 50 at 8 | live oak, hackberry, elm | fair |
| `hill-savanna` | 13830, 15230, 15240, 13930 Edwards Plateau | *model not read*: open 60 at 6, closed 40 at 25 | live oak, cedar (Ashe juniper), post oak, pecan by water | fair |
| `brush` | 13900, 13920 thornscrub, 11110 mesquite | mesquite and brush; **no log timber** (Holley p. 21) | mesquite | fair |
| `marsh`, `water`, `barren` | tidal marsh, swamps, open water, barren | none | — | none |

A **patch** is a square about 330 feet (1/16 mile, some 2.5 acres) a side, and its class is drawn by a hash of its
position weighted by the shares above, so every class sees the same patches and the woods are a mosaic, as the
models describe, not an even scatter.

`timber`, `brush` and `open` for the going, clearing and the house site (`sim/ground.mjs` `coverAt`) come from the
stand: timber where the patch has 10 or more log-sized trees an acre, brush in `brush` stands and on steep ground as
now, open elsewhere.

### 4.2 Trees

Inside a patch every tree is **one real tree**, placed by hash on a lattice about 21 feet a side (1/256 mile), so a
tree has a stable id (`t:<column>:<row>`) without being stored. Each has a kind (by the stand's shares), a size
(pole 9–14 inches, log 14–21, large over 21) and so how many logs it gives: pine 3, 2, 3; oak, pecan, elm, ash 1,
2, 2; cottonwood 2, 3, 3 and poor; live oak none (too crooked for walls) but good for sills; cedar 1 and good for
sills; mesquite none. **Only a felled tree is stored**, in `world.woods.felled`.

The invented map keeps its rule — timber within 1.15 miles of water — as one `creek` stand everywhere.

`ceiling:` 240 m cells and 330-foot patches are the grain; a real grove's edge is sharper. The GLO bearing-tree notes
for particular leagues are the way to a truer grain.

### 4.3 Drawn

Close up, the family's map draws each tree from the same function the server uses, fetched for the part of the map
in view (`GET /api/woods?minX&minY&maxX&maxY`, stumps included), with its kind's picture; further out the stand's
tint as now. `stand-in:` post oak and blackjack are `oak-broad`, live oak `oak-spreading`, pecan and elm `pecan`,
cottonwood `cottonwood`, pine and cedar the nearest tree tinted, mesquite `scrub`; stumps are `stump-post-oak` and
`stump-cottonwood`. Pine, cedar, mesquite and cypress are requested in `docs/ART_REQUESTS.md`.

### 4.4 As built: step 1 (2026-09-15)

- **The grid.** `scripts/build-woods.mjs` files LANDFIRE's forty-nine settings in the colonies box into the stands of §4.1 and writes them on the elevation grid (0.63 MB), with the ecoregions on a one-mile grid. Over the whole box: prairie 27 in 100 of the cells, post oak 12, pine 11, hill country 11, bottomland 9, brush 6, creek 5, water 4, marsh 1, live oak under 1, off the data 13. Drawn over the real rivers the floodplains lie on them (checked by eye, 2026-09-15).
- **At the settlements.** Gonzales itself stands in blackland prairie (the grid), its creeks in creek timber; Mina (Bastrop) in floodplain beside the Lost Pines; San Felipe, Victoria, Matagorda and Liberty on coastal prairie, with Liberty's creeks in the eastern pine country; Columbia's Brazos bottom is closed bottomland with live oak.
- **In use.** A class made on the real land records `map.woods: 'landfire-2016'`; its lanes, tracks, fields, survey, clearing, house site facts (the ground and the miles to timber) and the going across country read timber from the patches. A class made before reads timber by the water as it did. The invented map is unchanged.
- The woods polygons a new real-land map still carries are the old bands along the rivers; since step 2 they are not drawn on such a class.
- **Measured:** a thirty-family real-land class with neighbours played 465 ticks in 9.7 s (the old rule: 12.9 s); forty acres of the Lost Pines hold 756 trees and are listed in 3 ms. Tests: `tests/woods.test.mjs` (5); sixteen injected regressions, fifteen caught; the sixteenth (a tree reading its patch at its own point) is the same behaviour, since a patch is always read at its centre.

### 4.5 As built: step 2, the trees drawn (2026-09-15)

- **Tiles** (`sim/woods-view.mjs`, `GET /api/woods?level&tx&ty`, anybody in the class): `shade`, eight miles of one-mile cells, each the share of timber 0-9; `patches`, a mile of its 256 patches as `t`, `b` or `o`; `trees`, a quarter mile of every tree as `[x, y, kind, size]`. Each is worked out from the woods in a millisecond or two and is a few hundred bytes to a few tens of kilobytes. A class that does not read its woods gets a 404. The kinds and tile sizes come once with `/api/chores` (`woods`).
- **The page** (`public/woods-view.js`): close up, when the view covers no more than 0.4 square miles, every tree in view is drawn where it stands, back to front, at a pole's, a log tree's or a large tree's height; at middle distance, out to twelve miles across, timber patches are a canopy wash and brush a paler one under the scattered ground detail, whose trees stand only in timber; further out, to ninety miles, the shade of timber a mile at a time. **Amended 2026-09-17** (owner: *"Rivers and forests pop in and out of their places during zoom"*; [PERFORMANCE_RENDER](PERFORMANCE_RENDER.md) *Zoom*): each layer now hands over across a band instead of at one number (`WOODS_BANDS`, `woodsLayers`) - the trees fade in from 1 square mile to 0.4 over a canopy kept at 45 in 100 under them, the patches hand over to the shade between eight and twelve miles across, and the shade fades out between sixty and ninety - and the patches and the shade are laid down as smoothed pictures of their cells (`smoothCover`) rather than hard squares, so a stand has a soft edge that stays put. The old woods bands along the rivers are not drawn on such a class, and no lone oak stands in prairie the woods have none in. Each tile is fetched once, six at a time, and a new class starts afresh.
- `stand-in:` every kind is drawn as the nearest tree the library has (pine as the cottonwood, cedar as the sapling, mesquite as scrub); requested 2026-09-15 in `docs/ART_REQUESTS.md`.
- `ceiling:` a tree is drawn at the map's symbol size, over a person tall, while it stands at its true spacing, so a closed stand is a solid canopy and savanna of six trees an acre reads a little closer than it is; drawing trees to the ground's scale is the way out if it misleads. `ceiling:` trees are painted with the ground, under people, beasts and houses, so nobody walks behind one; a family's camp in the timber stands among the trees it has not yet felled (step 4).
- **Amended 2026-09-18: the woods past the box** ([MAP_ACCURACY](MAP_ACCURACY.md) §8). The map now reaches the Sabine and the Rio Grande, and its tiles are drawn there too: where the box's grid has no stand, the tiles read one from the country outside the box (`sim/outside-woods.mjs`, `public/terrain/outside-woods.bin.gz`, LANDFIRE filed into the same stands), so the shade, the patches and the trees run on over the box's edge with no seam. Only the tiles do: `standAt` reads the outside only when it is handed `beyond`, which `sim/woods-view.mjs` alone passes, so hunting, felling, clearing, the going and every save see the woods end at the box exactly as before. `ceiling:` no creek strip past the box (the creeks the map draws are the box's), and Mexico, with no LANDFIRE, is mesquite brush (since 2026-09-19 chaparral, delta prairie, river woods and hill oaks, §4.6).
- **Browser** (same computer only, headless Chrome, not LAN): a San Felipe family in the Brazos bottom saw closed timber with gaps round the house and the patches and shade out to twenty-seven miles; a Liberty family in pine woods; a Gonzales family on post oak savanna saw open grass with scattered oaks, thickets and creek timber. No page errors. Tests: `tests/woods-view.test.mjs` (3); fifteen injected regressions, thirteen caught; the other two (a tile's far edge, `- 1e-9`) are the same behaviour, since no tree stands on a tile's edge, and the offset was taken out.

### 4.6 Amended 2026-09-19: the biomes of 1836

Owner, 2026-09-19: *"woods should only exist where woods make sense. some families are going to have a harder time hunting
because there's no woods. thats okay"*; and, by multiple choice, the woods round the Alamo cleared to fields. Built from
[BIOMES](BIOMES.md) §7 (what was built and where it differs: its §13).

- **The stands of a class made since** are the biomes of 1836 (`STANDS` in `sim/woods.mjs`; the grid filed by
  `scripts/build-woods.mjs` through `scripts/terrain/biomes.mjs`): tallgrass, coastal, salt and mixed-grass prairie, dunes,
  mesquite prairie, chaparral, post oak, cross timbers, pine, longleaf, the Big Thicket, bottomland (with cane in the coastal
  bottoms), canebrake, cypress swamp, creek timber, the brush country's river woods, palm groves, live oak mottes, hill country
  savanna, cedar brake, marsh, fields, water. The table in §4.1 is the 2016 grid's and stays true for a class made that week.
- **Creek timber only where a creek runs all year, and as wide as the creek is big**: a running creek big enough to carry a
  name on the map — a bayou or a main creek — keeps a belt 0.14 mile either side through the plains (`CREEK_GALLERY_MILES`,
  `GALLERY_STRIP`, amended 2026-09-19: Almonte's "strips of thick forest" on the Brazos plains, `FIC-GONZ-121`); an unnamed
  running branch, and any running creek in the Hill Country, keeps a fringe one or two patches wide (`CREEK_STRIP_MILES`,
  0.045 either side); an intermittent creek through post oak, cross timbers or the hills a few scattered trees (`creek-draw`,
  open ground); through the prairies and the mesquite, none. A river through a town's fields keeps a line of bank trees
  (`bank`). `ceiling:` whether a creek runs all year is USGS's word for today, not 1835 (`docs/COLONIES.md` §9), and "named
  on the map" is USGS's naming standing in for the size of the stream.
- **Each stand says what may be hunted there** (`quarry`). **Amended the same day** ([BIOME_GAMEPLAY](BIOME_GAMEPLAY.md) §3.1):
  the hunt brings the quarry its place holds, fixed by the patch, its cover and the month, said before the hunter goes, and
  only a deer is drawn. **Amended again 2026-09-19** (§8 there, `FIC-GONZ-120`): a quarry may also have a country of its own —
  the buffalo, the mustang, the wild cow, the antelope and the javelina west of the Lavaca, the ducks and geese within a
  quarter mile of water — so the stand says what could be there and the place says what is. **Amended again 2026-09-20**
  ([BIOMES](BIOMES.md) §16, [BIOME_GAMEPLAY](BIOME_GAMEPLAY.md) §9, `HIST-TEX-260`, `FIC-GONZ-170`, `-171`), when the owner
  asked whether these animals were really in Texas then: a country is now a **share** of a quarry's weight and not a gate, so
  the mustang is thin inside the settlements rather than absent; the **antelope has no country line at all** and is quarry only
  on the chaparral and the mixed-grass prairie, neither of which reaches a settled place; and the buffalo is rare where it
  is at all.
- **A class made from 2026-09-15 to 2026-09-19** recorded `landfire-2016` and keeps reading that grid, byte for byte
  (`public/terrain/colonies-woods-2016.*`, rule `landfire`, `STANDS_2016`): its felled trees are found by their ids where they
  stood. A new class records `biomes-1836`. No save version moved (§7).
- **Timber and game, within three miles of each town** (share of ground that is timber, 2016 grid then biomes): Béxar 18 then 7,
  Goliad 22 then 10, Refugio 25 then 14, Harrisburg 13 then 5, Victoria 39 then 32, San Felipe 40 then 32, Liberty 37 then 31,
  Matagorda 40 then 35, Gonzales 57 then 46, Washington 54 then 43, Mina 67 then 58, Brazoria 81 then 67, Columbia 54 then 42,
  Nacogdoches 82 then 83. Of ninety families in three thirty-family classes, 13 have fewer than fifty sound logs standing on
  their land within a mile of the house (5 on the 2016 grid): a family nobody plays builds them a jacal (§8.1).
- **A family with no timber still builds**: the jacal wants no logs (`pen-jacal`, `sim/houseplot.mjs`); a Matagorda family with no
  timber anywhere on its land raises one (`tests/biomes.test.mjs`). Shops sell no logs (docs/TOWNS.md). **Amended the same
  day** ([BIOME_GAMEPLAY](BIOME_GAMEPLAY.md) §3.2): a family can *Fetch logs from the timber* - the felling axe and the ox and
  wagon to the edge of the nearest timber, off its land if need be, six sound logs a load - at a cost said in hours and miles;
  a family nobody plays does so when that timber is within two miles, and builds a jacal when it is not.

---

## 5. Hunting on the family's own land

- **Anywhere on the grant.** *Hunt* works like *Survey*: pick a person, *Hunt on our land*, tap a place on the family's
  own land, read what is there (*"Bottomland timber a mile north-east of the house, by Peach Creek. Good ground for
  deer."*) or why not, and send them. The old automatic hunting ground stays as the default when nobody taps.
- **What is there depends on the stand.** The chance of a shot and what it brings follow the stand's game column and
  whether the place is within a few hundred feet of a woods edge (deer feed at edges). Prairie is poor; bottomland
  and creek timber best. The deer is placed among the real trees there.
- **Refused:** off the family's land; open water; before the house site; the lobby. Neighbours hunt their own land the
  same way, choosing the best stand within a mile of the house.

### 5.1 As built: step 3 (2026-09-15)

- **`sim/hunting.mjs`.** `huntingPlace(world, point)` reads the stand and cover there (the woods patch on a class whose woods come from the land; creek timber, brush or prairie by `groundAt` on any other), whether it is at an edge of timber (a patch either way whose cover differs), and its game: the stand's game (§4.1), a fifth more at an edge, most 1. `huntFacts` says it in words - *"Creek timber, at the edge of the timber, a quarter mile south-west of the house. Good ground for deer: the wait should not be long."* - or refuses: off the family's land, in the water, in the lobby, before the house site.
- **The chore.** `hunt-land`, *Hunt on our land*, the same stages as `hunt-timber`, sent by its own order with the place (`action: 'hunt-land', x, y`), always on foot. Its two journeys are walks about the family's own land (never the road, never off the place); the stalk stays within a few rods of the place chosen; the deer is placed ahead of the hunter the way from the house; the words say the stand (*"working up through the post oak savanna"*, *"fired in the creek timber"*). **The ground decides the wait, not whether a deer comes:** waiting still takes one tick on the best ground and up to five on the poorest (`stillTicks`), and nothing is left to chance. The old hunt in the timber stays beside it.
- **The page.** *Hunt on our land* opens the same panel as Survey: tap a place inside the dashed line, read what is there, *Hunt there*. The place is ringed. The server's `/api/plot?job=hunt-land` answers.
- **Neighbours** on a class whose woods come from the land hunt their own land: the best ground for game within a mile of the house (`huntPlaces`), the nearer of two as good. On any other class they go to the timber as before.
- **On the channel:** the new chore carries no carry number (on foot, its description says so) and a refusal it shares with the hunt in the timber is sent once; the page reads it there. The lobby is not offered it.
- `ceiling:` on foot only, so a hunt on the family's land brings home what one person carries; taking the wagon out over the family's own land is the way out. `ceiling:` how good the ground is decides only how long the wait is; how many deer a stand holds, and a hunted place growing poorer, are not modelled.
- **Browser** (same computer only, not LAN): *Hunt on our land* on Zadok's panel, the panel *"Where Zadok hunts"*, a tap a sixth of a mile east of the house read *"Prairie beside the house. Open ground that game seldom crosses: the longest wait."*, *Hunt there* sent him walking out, waiting still seven ticks with a deer drawn at the family's line. No page errors. Tests: `tests/hunt-land.test.mjs` (5); twenty-one injected regressions, twenty caught; the twenty-first set the mode inside the chore, which the order already does, and the line was taken out.

---

## 6. Felling, logs and the house

### 6.1 Felling

- *Fell trees* sends a person to a place on the family's land and fells the trees there one by one, nearest the house
  first, choosing kinds good for the house the family plans (logs for walls, cedar or live oak for sills). A felling
  axe is wanted. A tree is **one tick** (twenty minutes) for a pole, two for a log tree and three for a large one, at
  an ordinary hand's pace and strength (`ceiling:` real felling and trimming took far longer; a class is under two
  days).
- A felled tree leaves a **stump** and its logs lie where it fell. **Hauling** brings them to the house plot: a person
  drags one log a trip; the ox, or the wagon with the ox, brings six. Logs on the house plot are the family's
  **log pile** (`household.logs`, by kind: wall logs, sill logs, poor logs).
- Felling on a staked plot is also clearing it: a plot whose trees are all felled needs only the grubbing left.

### 6.1.1 As built: step 4 (2026-09-15)

- **`sim/felling.mjs`.** *Fell trees* (`fell-trees`, sent with a place like the hunt): refused where the trees are not counted one by one (every class but a new real-land one), in the lobby, before the house site, off the family's land, in the water, with no felling axe, or with no timber standing within reach. The family is told what stands: *"Creek timber a quarter mile south-east of the house: 200 trees in reach, 258 logs, 123 of them straight enough for walls. elm, hackberry, pecan."* The person walks out and fells the trees within **260 feet** (`FELL_REACH`) one at a time, wall timber first, then sill, then poor, nearest first; a pole takes one tick, a log tree two, a large tree three, times the kind's effort (cottonwood 0.6, live oak 1.5) at their pace and strength; two people at one place never take the same tree. Each felled tree is stored once, `world.woods.felled[t:column:row] = { by, minute, kind, use, logs, left }`, and the woods drop it; the story says once how many came down and how many logs lie, also when the feller is called in.
- **Hauling** (`haul-logs`, offered only while the family has logs lying out): to the nearest lying logs, a load of six from there and any others within reach behind the ox when the ox is at home and free, or one on the shoulder, to the house and onto the family's log pile (`household.logs = { wall, sill, poor }`), again until none lie out.
- **Seen.** The land line has `logs: { wall, sill, poor, lying }`; the supplies line says *"logs 47 at the house, 12 lying out"*. The trees tile leaves felled trees out and lists `stumps` with the logs still at each; `/api/state` carries `woodsRevision`, and a change makes the page fetch the close-up tiles again, keeping the old ones on screen until the new come. Close up a stump is drawn where each tree stood and a log beside it while any lie there; beside the house a log for every ten on the pile, up to four. `stand-in:` stumps are `stump-post-oak` or `stump-cottonwood`, logs and the pile `log-fallen` (requested 2026-09-15).
- **Old saves:** no `woods` record and no log pile; nothing is offered where the trees are not counted; no save version moved.
- `ceiling:` a tree is felled in one to three ticks, not the hour or more it took. `ceiling:` the ox is not drawn with the hauler nor lent for the trip. `ceiling:` felling does not open a patch for the going or clearing, and clearing a timber plot fells nothing into logs.
- **Browser** (same computer only, not LAN): a colonies family's principal, *Fell trees*, a tap on creek timber read the words above, *Fell there*; twenty seconds later the supplies line read *"logs 0 at the house, 73 lying out"*, the woods revision was 56 and 22 stumps were drawn; watching him, a felled patch of stumps and logs showed in the timber (the stumps were first drawn too small to see, and were made a person's height). No page errors. Tests: `tests/felling.test.mjs` (6) and the chore list test in `tests/chores.test.mjs`; thirty injected regressions, twenty-eight caught; the two not (two fellers reaching for the same tree, and refetching every tile rather than the close-up ones) did not happen in the scenes tested, and the guard against the first is kept.

### 6.2 The house plot and its pieces

The house plot is a grid of **8-foot cells**, 8 wide and 6 deep, round the house site. The family places pieces on it:

| Piece | Cells | Needs | Logs | Work | What it does |
| --- | --- | --- | --- | --- | --- |
| Round-log pen | 2 × 2 (16 ft) | axe | 40 wall | 36 spells | a room for 4; rest 85 in 100; food spoils 1.5 in 100 a day (as `HOUSES` now) |
| Hewn-log pen | 2 × 2 | axe and broadaxe | 40 wall | 58 spells | a room for 4; rest 115 in 100; food keeps |
| Jacal pen | 2 × 2 | none | 0 (30 poles from any stand) | 22 spells | a room for 3; rest 90 in 100; food 1 in 100 |
| Open passage | 1 × 2, between two pens in a row | the two pens | 6 wall | 8 spells | the pens share one roof; food spoils half as fast in the pens beside it (a cool place, `FIC-GONZ-033`) |
| Stick-and-mud chimney | 1 × 1, outside a pen's end wall | a pen | 0 (sticks and clay) | 6 spells | a fire indoors: rest +10 in 100 in that pen. Can catch fire (`HIST-GONZ-029`; weather later) |
| Double chimney | 1 × 2, between two pens | two pens | 0 | 10 spells | both pens warmed (Smithwick's "big double chimney", `HIST-TEX-017`) |
| Stone chimney | 1 × 1 | a pen; rock within a mile | 0 | 14 spells | as stick-and-mud, never catches fire |
| Shed room | 2 × 1, against a pen's back wall | a pen | 12 poor or wall | 10 spells | room for 2; stores kept: food spoils a third less |
| Porch | 2 × 1, along a pen's front | a pen | 8 poor or wall | 8 spells | a shaded place to work; nothing yet (weather later) |
| Loft | inside a pen | the pen's roof on | 6 wall | 6 spells | room for 2 more in that pen |
| Puncheon floor | inside a pen | a pen | 8 wall | 8 spells | rest +5 in 100 in that pen (drier than earth, `HIST-GONZ-031`) |

Every pen and passage needs a **roof** (riven clapboards weighted with poles, `HIST-GONZ-030`), which is the last stage
of the pen and part of its work. A house is **lived in** when one pen stands with its roof on; everything else can
follow. Crowding, rest and food are worked out from the pieces that stand, through the same two hooks as now
(`shelterOf`).

**Plans** are presets, placed at once and changeable until work begins on a piece: *Round-log cabin* (one pen,
stick-and-mud chimney), *Hewn-log cabin*, *Dog-run* (two pens, passage, two chimneys), *Saddlebag* (two pens, double
chimney), *Jacal*. A family can start from a plan and add, or place pieces one by one.

**Refused, in the words on the control:** off the plot; overlapping; a passage not between two pens; a chimney, shed
or porch not against a pen; a loft before the pen's roof; a piece that wants a tool the family has not got; a stone
chimney with no rock near.

### 6.3 Raising it, stage by stage

Each piece goes up in stages a student sees and sends people to: a pen is **sills** (4 logs, cedar or live oak
best), **walls, course by course** (ten courses of 4 logs, each course drawn), **door and window cut**, **roof**
(rafters, then clapboards), **chinked**. A course above the sixth wants **two people on it at once** (skids and forks);
one person alone raises it at a third of the pace — the reason a house-raising helps (`docs/SETTLING_IN.md` §6, still
invented). Logs come off the pile as each course goes up; a course with no logs on the pile waits and says so. Called
away, the work stays.

The panel says **what the next stage wants** before it is begun, beside what the family has: *"Next: laying the sills on
the round-log pen. It wants 4 sill logs and about 2 hours' work; 3 sound and 1 poor at the house, 6 lying out."* Until
2026-09-17 it said only what the whole plan still wanted - "still wants 26 wall logs" - and a family that hauled eleven in
could not tell why the walls still would not go up (owner, playtesting). A stage already begun wants no more logs: they
went onto it when it started. `stageWants` in `sim/houseplot.mjs`, worded by `nextLine` in `public/house-plot.js`.

A neighbour standing on the plot while any pen's walls are going up can help (the raising as now, per course).

**The sky, added 2026-09-21** (`FIC-GONZ-290`, `docs/WEATHER.md` §10.5). Two of those stages want the rain off them: the
ones that **lay mud** — a pen's chinking, a jacal's daubed wall, the stick-and-mud chimney — and the ones that **put a
roof on** — the rafters and clapboards, the thatch, the passage, the shed room, the porch. On a rain day, in a storm, or
under a norther that brought its rain with it, those stages are **passed over**: the family works the next piece it can,
and the house stands still only when the rain is on everything left, with the land line saying which stage of which piece
is waiting. **Felling, hauling, the sills, the ten courses, framing, the floor, the loft and the stone chimney go on in
any weather** — the record is plain that felling did, and `HIST-TEX-390` records honestly that **no source says the mud
and the roof waited for a dry day**: that half is the game's, not the period's.

### 6.4 Drawn

The plot is drawn as its pieces, each at its stage. `stand-in:` a pen is the `house-round-log` / `house-hewn-log` /
`house-jacal` stage picture scaled to its 2 × 2 cells (site for sills, walls for the courses — cropped by courses
done — roofing, finished); a passage is the gap between; chimneys, shed rooms, porches and lofts are drawn from the
`buildings` sheet's chimney, `lean-to` and `shed-open` until modular art lands. Requested: log pen walls by course
(round and hewn, both faces), the passage roof, stick-and-mud, stone and double chimneys, a shed room, a porch, a
puncheon floor, felled logs and a log pile, stumps of pine and pecan.

**Chimneys against their gable walls (2026-09-23).** Owner: *"Something looks wrong with the chimneys too. Are they
positioned correctly?"* They were not. The single-pen house had an exterior chimney centred in one gable wall
(`HIST-GONZ-025`), the saddlebag *"a big double chimney"* between its two pens (`HIST-TEX-017`), the dog-run a chimney at
each end (`HIST-GONZ-035`). The plan data was right — a chimney's cell is beside its pen's east or west end wall — but the
page drew the chimney at the front of that cell, and the house-modules sheet draws a pen corner-on, about 2.6 cells wide and
1.2 deep on the screen, so the cell beside a pen is not where the picture's wall is. The chimney stood on the grass to the
right of a cabin at 0°, in front of it and below it at 90°, rising alone behind it at 270°, and apart from both pens of
the dog-run. Three causes: no measure of where the picture's walls meet the ground (the atlas had only a ground anchor and,
for roofs, a seat); the chimney placed by its cell and drawn in the order of its cell's front edge; and a chimney drawn 1.55
cells high, which against the gable behind the walls is hidden whole under the roof.

Now: the atlas measures the feet of the full walls' three visible corner posts (`ground`, `groundOf` in
`scripts/build-atlas-manifest.mjs`; the fourth corner closes the figure). The sheet's roof puts its gables over the
left-front face (the door's) and the right-back face — mirrored at a quarter turn, right-front and left-back. The plan says
which pen and which end; the turn says which face that gable is:

| | 0° | 90° | 180° | 270° |
|---|---|---|---|---|
| east gable | right-back | right-front | left-front | left-back |
| west gable | left-front | left-back | right-back | right-front |

`standChimneys` in `public/house-plot.js` puts each chimney's foot at the middle of its gable wall on the ground, standing
out `CHIMNEY_STANDS_OUT` (a tenth) of the pen's depth (`ceiling:` a guessed chimney depth), and draws it before its pen when
that gable is behind the walls (the pen hides its foot and it rises over the ridge) and after the pen and its roof when it
faces the viewer. Chimneys are drawn `CHIMNEY_HIGH` (2.1) cells high so one behind the walls clears the ridge. The
saddlebag's double chimney stands at the middle between the west pen's east gable and the east pen's west gable, drawn after
the pen whose gable it is in front of and before the other, 0.6 of a cell wide so at 0° and 180° it touches both pictures;
`stand-in:` still a flat rectangle, and at 90° and 270° the two pens' pictures stand one behind the other with ground
between them, so it rises in front of the far pen and the near pen hides its foot. A chimney whose pen has no measured walls
(a jacal, or no `spriteFrame`) stays at its cell. `stand-in:` the sheet has one pen, its door in the left-front gable, so at
90° and 180° — and on the dog-run's west pen at 0° and 270° — a chimney stands in front of a door that gable should not have
(`docs/ART_REQUESTS.md`, *the house from its other sides*). The chimney's cell is still the plan's ground and the server's
footprint: no plan, footprint or spacing number moved, and every picture still stands inside `PICTURE_REACH`
(`tests/house-spacing.test.mjs`). Test: `tests/house-chimney.test.mjs` holds every plan at every turn, in the chooser, the
preview and the house that stands, to the gable walls read by eye off the sheet.

### 6.5 Where a house may stand, at the size it is drawn (2026-09-23)

Owner: *"fix the overlapping houses so spacing matches the drawings."* A house is drawn at the map's symbol size —
`CABIN_PEOPLE` (3.3) people high, a person `PERSON_MILES` (0.019 miles) of ground, an eight-foot cell of the plot drawn
0.45 of the house's height — and until this date the server placed and checked it in true feet, an 80 by 64 foot envelope.
An eight-foot cell is drawn about **149 feet** of the map (`CELL_MILES`, 18.6 times true), so two houses the server let
stand a hundred feet apart were drawn one over the other, and a house on dry ground beside a creek was drawn over the water.

**One source.** `sim/house-footprint.mjs` (no imports) holds the numbers — `PERSON_MILES`, `CABIN_PEOPLE`, `CELL_SHARE`,
`CELL_MILES`, `PICTURE_REACH` — and the footprint: `turned`, `houseFootprint` (moved from `public/house-plot.js`, which
re-exports them), `houseCells`, `standingAt`, `houseOnGround`, `spacingRefusal`. The page imports the same file
(`public/app.js` from `/sim/house-footprint.mjs`, `public/house-plot.js` as `../sim/house-footprint.mjs`, which is the same
file from node; `server/app.mjs` serves it at that path). `SIZE.cabin` is `CABIN_PEOPLE` and `plotCell` is `CELL_SHARE`, so
the drawing and the check cannot drift.

**The rule** (`sim/house-placement.mjs` `checkHousePlacement(world, household, placement, layout)`), on the plan's drawn
footprint at its quarter turn:
- *The ground* — every rule a house's point had (on the family's land and set back `SITE_MARGIN` from its line, not in the
  water, not steeper than `STEEPEST_SITE`), read at nine points of the footprint (`siteFacts`); **and** no watercourse within
  `IN_THE_WATER` (0.03 miles) of any part of it, exactly (`landAround().waterNear(box, reach)`, sim/ground.mjs), so a creek
  cannot run between the nine points.
- *Not on the field* — the footprint over a staked or cleared plot is refused, *"That would stand on your field."* The other
  way round, Survey refuses ten acres over any house's drawn footprint as it did the yard round the site, *"That would take in
  the house yard."* (sim/survey.mjs `plotRefusal`).
- *Spacing* — a house **claims** its footprint grown by `PICTURE_REACH`: 1 cell up the screen (north) for the roofs and
  chimneys of the three-quarter view that stand above their ground, 0.9 either side for pictures wider than their cells, 0.2
  down the screen. **No two claims may overlap**, *"Leave space between this house and the existing house."* So neither
  house's ground nor its pictures covers the other's: a cabin just south of another is not drawn under that one's roof, and
  two side by side never share a picture's width. It is judged on the ground the pictures stand over, not on the screen, so
  it is the same at every zoom. The reach was measured on every plan at every turn from the house sheets (the saddlebag's
  roofs rise 0.9 of a cell above its back wall, the jacal's picture is 0.86 wider each side than its pen, every foot 0.16
  below); `tests/house-spacing.test.mjs` holds every picture inside the claim.
- *Neighbours* — the claim must lie inside the family's own land. `PICTURE_REACH` × `CELL_MILES` (at most 0.028 miles) is
  less than `SITE_MARGIN` (0.05), so a house set back from its line never stands over a neighbour's ground; holdings do not
  overlap (sim/grants.mjs), so no two families' houses can be drawn over one another.

A second house is judged against every house of the land (the one just finished and the finished ones before it); a first
house changed before work against the finished ones. A house placed nowhere — an old save, a house planned before
placement — is judged where it is drawn: at the site, one cell above the site point (`standingAt`, as `drawLandHouses`
draws it).

**The preview says so.** `placementRefusal` in `public/app.js` runs the same `spacingRefusal` on the same houses while the
student moves the preview: over another house the preview's footprint is tinted red and `#house-placement-note` says the
server's sentence; moved clear, the placing words come back. The ground — water, the line, the slope, the field — is the
server's to read, and its refusal shows in `#house-placement-note` when *Build here* is pressed.

**Is the land still big enough?** Yes, at the drawn size. A round-log cabin (3 × 2 cells) is drawn over about 447 × 298 feet,
3.1 acres, and claims 7.8; a dog-run (7 × 2) about 1,043 × 298 feet, 7.1 acres, and claims 14.3. A labor is 177 acres,
2,777 feet a side, and 116 of them lie set back from its line. Laid out by the rule, a labor holds a dog-run, two round-log
cabins and **eight** ten-acre plots below them (`tests/house-spacing.test.mjs`); the docs promise a house, more houses after
it, and a field of at least the three plots automatic families keep (§5.1 of `LAND_GRANTS.md`). A league and a labor is
2.68 miles a side. On the real land the water, the slope and the family's own field take more of it: on one labor of the
`spacing` seed 35 of 400 evenly spread dog-run sites were taken. Worth knowing: a dog-run's drawn footprint is wider than a
ten-acre field (660 feet a side).

**Old saves.** No `saveVersion` moved. Houses already placed stand where they were, even two now drawn one over the other:
nothing moves them and validation does not judge spacing, so every class saved with houses placed under the old envelope
opens as it was. Only a house still to be placed is held to the rule.

**At every zoom (2026-09-23, owner: *"fix the zoom issue"*).** The rule is judged on the ground, so it holds only while
the page draws a house no bigger than that ground. It did not: the house was drawn with the people, whose figure is floored
at 7 pixels, so from about 370 pixels a mile out every house grew past its ground and two as close as allowed were drawn into
each other. Widening the rule instead would have pushed houses a mile apart. Now (`houseScale` in `public/app.js`, carried
on the camera as `camera.house`):
- **A family's house is never floored.** It is drawn `CABIN_PEOPLE` people of `PERSON_MILES` high at every zoom, exactly the
  ground the server spaced it by (`CELL_MILES`), the placed house, its preview and a house at its site alike. People, the
  camp, the log pile, the stock and a town's cabins keep their floor (`yard` in `drawWorld`).
- **`HOUSE_LEGIBLE` = 16 pixels** is the smallest a house is drawn: the smallest height at which the cabin still reads,
  looked at on the house sheets from 8 to 23 pixels (at 12 and under a finished round-log cabin is a brown blot and a
  dog-run two; at 14 the chimney stands off the pen; at 16 the roof's ridge reads). A house reaches it at **about 255
  pixels a mile** (16 / (0.019 × 3.3)).
- **From there out a family's houses are drawn as one house** (`camera.house.one`): its home — the first it finished, whose
  rooms `sim/interior.mjs` opens, or the one it is raising — 16 pixels high where that house stands. So no house can be drawn
  over another of its family. Only the home answers a tap (`drawLandHouses`, `notePlacedHouse`, `houseAt`); a preview is
  drawn at the same size the family's houses are, so the preview of a first house is the home it becomes.
- **Two families.** Close in none can be drawn over another: each family's houses stand inside its own land, a neighbour's
  house as a family last saw it is drawn at its site, 0.35 miles or more off anybody else's grant (`HOUSE_CLEARANCE`), and a
  house is drawn no bigger than its ground. Zoomed out, each family's one house is 16 pixels whatever the ground, and
  leagues can lie 0.085 miles apart (the closest in ten seeds of both maps), so two houses built by the line between them
  — or a family's house built near the site of the neighbour it borders — would be drawn into each other below about 255
  pixels a mile (another family's homestead is drawn only from `HOMESTEAD_LEGIBLE`, 11 pixels a mile). `keptApart` keeps the
  family's own house first and each other family's only where its house, measured as it will be drawn (`landHomeBox`,
  `drawnBox`), would not be drawn over one already kept; the name over it is still drawn.

`ceiling:` (in the code) — one `PICTURE_REACH` for every plan and turn, the widest, measured on whole frames with their
clear edges, so houses as close as allowed show a gap — a round-log cabin east of another could stand about a cell closer
(`PICTURE_REACH`). A house chosen whole (`{ layout, work }`) claims its plan's pieces, and one with neither pieces nor a known
plan claims the whole plot (`houseCells`). Zoomed out, a neighbour's house over one already kept is left out, first kept
first drawn in the map's site order, so on the Host's map the earlier of two families keeps its house (`keptApart`); the
sites of every class laid out so far stand 2.8 miles or more apart, so only houses built far off their sites can meet, and
shrinking both into their own land is the way out if the Host is shown an empty place where a family lives. Zoomed out, the
preview of a second house is drawn 16 pixels high beside the home it will join, and once built it is not drawn separately
until the camera is in past 255 pixels a mile.

**What it looks like zoomed out.** At 218 pixels a mile the home is 16 pixels high and the people at it keep their 7-pixel
floor, with the oxen (1.45 people) and wagon (1.55) at theirs: a family standing at its house, oxen and wagon in hand,
covers most of it (`test-results/houses-zoom-218.png` from the browser proof). Not redesigned: people keep their floor. At
the country's farthest zoom (3.4 pixels a mile on the colonies map) a town's cabins keep their floor too, and a family
settled near Brazoria and Columbia has its home drawn among theirs (`houses-zoom-3.png`).

**Evidence.** `tests/house-spacing.test.mjs` (9 tests): the server's footprint is the page's drawn footprint for all five
plans at 0/90/180/270; every picture inside its claim; a house over another refused and one just clear (east, and north
under the roof) taken and drawn clear; a picture over the other's ground refused; the page's preview refused exactly where
the server's spacing is; a creek running under a dog-run between its nine dry points refused (dry under the old envelope);
house and field kept off each other; a class saved with two houses drawn over one another opens with both where they stood;
the labor's layout. `scripts/house-spacing-injections.mjs` puts back each old behaviour or takes out each rule through node
load hooks, no file edited — true feet, no spacing, pictures not counted, water at nine points only, house on the field,
field over a house, overlapping houses refused as invalid, the preview predicting nothing — and each fails exactly the tests
written for it ([record](evidence/house-spacing-injections.json)). Browser: `scripts/house-plot-browser-proof.mjs` places a
second house over the first (preview tinted, the note says why, and "Build here" is refused by the server in the same words)
and then just clear of it (built, 5 feet of the map clear in the rule's terms), and shoots the two as close as allowed
([record](evidence/house-plot-browser.json)).

`tests/house-zoom.test.mjs` (4 tests), at 83 zooms from the closest the camera goes to the farthest on both maps (`scaleLimits`
on a 1440 × 1000 map) and either side of 255: two houses as close as the server allows — 3 plan pairs × 2 turns × 4 sides —
never drawn with overlapping picture boxes, each no bigger than its ground while two are drawn; the switch to one house at
`HOUSE_LEGIBLE`, the one drawn at the home at 16 pixels, a tap spot for each house drawn and none for one not drawn; the
preview drawn exactly as the built house (every picture, size, footprint and box) for round-log and dog-run at every turn;
two families' houses 0.185 miles apart kept apart, the family's own kept. Each was failed under injection first: the old
floored size fails all four and nothing else in the suite; against that file, never switching to one house fails the switch and the families'
test; drawing every house when one is drawn fails the overlap and switch tests; families not kept apart fails that test
alone; a tap spot for a house not drawn fails the switch test alone. The browser proof then zooms out step by step (35 wheel
steps, 2,883 to 3.4 pixels a mile) with the two houses as close as allowed: never drawn over one another, both drawn at
their ground's size down to 255 and the home alone from there, a tap spot for each house drawn, and the last step the
country's own scale; a montage of five zooms is `test-results/houses-zoom-montage.png` (or `ZOOM_MONTAGE`).

---

## 7. Old saves

A class saved before this has no `woods`, no log pile and its house as `{ layout, work }`. It keeps exactly that: its
timber rule is the old one (`map.woods` is absent), its house is one of the four layouts at the ordinary one-bar
pace, and `shelterOf` reads it as now. A class made from 2026-09-15 recorded `map.woods: 'landfire-2016'` and
`house.pieces`. No save version moves.

**Amended 2026-09-19.** A class made since records `map.woods: 'biomes-1836'` and reads the biomes (§4.6). A class that
recorded `landfire-2016` keeps its own grid, kept beside the new one as it was (`colonies-woods-2016.*`): its felled trees,
logs lying out, hunting ground and trees drawn are exactly what they were. The map's washes (the land's classes) are the new
ones for every class; they are drawing only.

---

## 8. Build order

1. ~~**The woods grid.**~~ **Done 2026-09-15** (§4.4). `scripts/build-woods.mjs`, `public/terrain/colonies-woods.bin.gz`, `sim/woods.mjs` (stand,
   patch class, trees in a box), `coverAt` reading it on the real map; claims `HIST-TEX-016`, `FIC-GONZ-032`;
   evidence of stands near each settlement.
2. ~~**Trees drawn.**~~ **Done 2026-09-15** (§4.5). `/api/woods`, trees and stumps close up, stand-ins, art requests.
3. ~~**Hunting on our land.**~~ **Done 2026-09-15** (§5.1). The tap, the facts, the stand deciding the hunt, neighbours' choice.
4. ~~**Felling and hauling.**~~ **Done 2026-09-15** (§6.1.1). *Fell trees*, stumps, logs, the log pile, the ox and wagon hauling, felling clearing a plot.
5. **Built 2026-09-15: the house plot.** Pieces, placement rules, five presets and free placement, effects through `shelterOf`; `HIST-TEX-017`, `FIC-GONZ-033`.
6. **Built 2026-09-15 with presentation ceilings: raising by stages.** Sills, courses, roof, chinking, two-person courses, logs consumed, neighbouring helpers and automatic families; drawn per piece using stand-ins. See actual scope below.

### 8.1 Completed house update, 2026-09-15

The new landfire classes plan on the eight-by-six grid. Each piece shows its needs and effect before placement. Students can start with a round-log, hewn-log, dog-run, saddlebag or jacal plan, add pieces, and remove only unstarted pieces without stranding attached additions. A loft or floor is added using its explicit button inside a pen. The server validates every command; the client never grants logs or construction progress. Legacy houses keep their old layout/work record.

Stages consume logs once on starting, preserve partial work when interrupted, stop with a reason when the pile is short, and let a finished pen provide shelter before remaining additions finish. Upper courses slow a lone worker to one third; neighbouring helpers count. Automatic households fell, haul and build, or choose a jacal where usable timber is insufficient. Fixed during completion: a helper's story crashed on the new house shape; interior additions had no reachable placement control; the longer supplies line overflowed a phone.

The earlier table is the design proposal. **Shipped tuning** in `sim/houseplot.mjs` is: round pen 50 sound logs/30 spells (four sills, forty wall-course logs, six roof logs); hewn pen 50/40; jacal 0/14; passage 4/4; stick chimney 0/4; stone chimney 0/10; double chimney 0/7; shed 10 any/7; porch 4 any/4; loft 4 wall/3; floor 6 wall/4. One ordinary spell is one game hour; lone upper courses take longer. All these counts remain invented, not historical measurements.

**Ceilings:** stone availability is not enforced because there is no rock layer; porch/weather/fire effects remain future work. Pens are built before their attached additions; door/window cutting and rafters/clapboards are not separate jobs. Ten wall courses are simulated but share one walls-stage sprite, rather than ten distinct drawn courses. **Amended 2026-09-23** (student: *"the roof doesn't seem to stay where it's supposed to be. It slides forward."*): the modular roof was drawn at the walls' ground anchor, which for a roof is the tip of its eaves, so it sat a third of the pen's width forward and down, covering the walls to the ground; it is now seated on the walls by points the atlas measures (`roofSeat` in `public/house-plot.js`), and every stage of a pen is drawn at its full walls' pixel scale (the sill had come out 28% bigger than the walls). `tests/house-roof.test.mjs`. The passage roof between dog-run pens still stands on its own posts at a hand-chosen size, below the pens' eaves. **Amended 2026-09-23 (turned houses):** a placed house's quarter turn turned the canvas, so its pieces lay on their sides at 90 degrees and upside down at 180; it now turns the house on the ground only - each piece upright in its turned cells, back to front, so a dog-run at 90 runs into the screen - and mirrors every piece at 90 and 270, which is the corner-on pen seen after a quarter turn (`drawHousePlot` `rotation`, `tests/house-turn.test.mjs`). `stand-in:` the pen's back gable and the passage, porch and shed room seen end-on are requested (ART_REQUESTS.md, 2026-09-23). Floor/loft benefits and progress are listed in the panel, with no room interior view. Modular replacement art is requested in `ART_REQUESTS.md`; the renderer and supplied art are not finished production building visuals.

**Evidence:** `tests/house-plot.test.mjs` passes seven tests. `scripts/house-plot-regression-proof.mjs` substitutes seven exact regressions through isolated Node loaders; each selected test fails, without editing production files ([record](evidence/house-plot-regressions.json)). The student browser proof `scripts/house-plot-browser-proof.mjs` passed on the same computer ([record](evidence/house-plot-browser.json)), covering plans, interior additions/removal, refusal, phone layout and construction/shelter through the live server. **Amended 2026-09-23:** the component editor is hidden and a plan opens a placement step, so the proof now goes plan, preview over the land, quarter turn, *Build here*, construction and shelter, and holds the preview to the house that stands: the same size in the people's yardstick, turn and footprint (`tests/house-preview.test.mjs`, HANDOFF.md *House placement preview*).

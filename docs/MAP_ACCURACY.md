# The map's rivers, woods and land where they are

Owner, 2026-09-17: *"I also noticed as i zoomed in and out that rivers and forests aren't in the right places. for
instance: there is supposed to be the san antonio river between the alamo and san antonio. Liberty is on the east side of
the Trinity river. Rivers and forests pop in and out of their places during zoom. their shapes and sizes change too. could
we use this as an opportunity to make this look better, as well as improve performance?"* And the same day: *"there's
also desert and other land styles we need to consider. prairie, buttes, hills, etc."*

This document is **where** the rivers, woods and land are: the data, how it is built and how it is checked. **How** the map
draws it (the popping, the bands, the colours) is the rendering work, which reads the formats in §6.

## 1. What was wrong, and why

**The rivers near the families were right; the country drawn under them was invented.** Every class on the real land
carried the province of `sim/texas.mjs` (`FIC-GONZ-002`): rivers, a coast, belts of country and towns laid out by hand
before the real map existed, "the arrangement anchored, every coordinate invented". The page draws that province under
everything, at every zoom, and draws the real rivers of `world.map.terrain` over it only within thirteen miles of a
settlement with families. So:

| | the invented province | the real land |
|---|---|---|
| Liberty | at (258, -34), on its Trinity | at (161.2, -39.1); the invented Trinity is **98.7 miles** away |
| San Felipe | at (140, -62) | at (82.6, -20.8); the invented Brazos 66.9 miles away |
| Béxar | at (-74, -33) | at (-61.6, 4.6); the invented San Antonio, drawn **a mile and more wide**, lies over the town and the Alamo |
| Victoria, Goliad, Mina, Washington | 31 to 58 miles off | on their rivers |

Zoomed out a student saw the invented rivers and the invented town names; zooming in, the real rivers faded in over them
somewhere else, and the invented ones stayed underneath, a band wider than Béxar. That is the "pop in and out" and the
"shapes and sizes change". At Béxar no family's thirteen miles reached the real San Antonio, so only the invented one was
drawn - east of the town, across the Alamo ([before](evidence/map-accuracy/before-bexar-town.png)).

**Checked and not wrong:** the rivers are the USGS National Hydrography Dataset's flowlines, not derived from the
elevation; the towns, the rivers and the woods share one projection (`milesFrom`, equirectangular about the confluence,
`sim/terrain-data.mjs`), so nothing is offset from anything else. On the real data the San Antonio passes 0.07 miles east
of Béxar's point and west of the Alamo; the Trinity 1.36 miles west of Liberty.

**One place was wrong on the real map: Lynchburg** (`HIST-TEX-084`). `HIST-TEX-025` put it at TSHA's coordinate, which
is the present community at Interstate 10, 2.3 miles north-east of Lynch's ferry and over a mile from either water. It
now stands at the ferry, where Buffalo Bayou meets the San Jacinto.

## 2. Sources

No new data was downloaded. Everything is built from what the game already ships in `public/terrain`:

| Data | Source | Licence | Record |
|---|---|---|---|
| Rivers | USGS National Hydrography Dataset, NHDFlowline, HU4 shapefiles (downloaded 2026-09-14) | public domain | `docs/evidence/terrain-data.json` |
| Heights, the sea and bays | USGS 3DEP 1 arc-second (downloaded 2026-09-14) | public domain | `docs/evidence/terrain-data.json` |
| Vegetation | LANDFIRE LF2016 Biophysical Settings (requested 2026-09-15) | public domain | `docs/evidence/woods-data.json` |
| Ecoregions, the escarpment, coastal marsh | U.S. EPA Level IV Ecoregions of Texas (2011) | public domain | `docs/evidence/woods-data.json` |
| Alamo, Lynch's ferry, the banks | Wikipedia (*Alamo Mission in San Antonio*, *Lynchburg Ferry*), TSHA Handbook entries | cited as facts | `HIST-TEX-084`, `HIST-TEX-085` |

`ceiling:` the province ends at the colonies' box (94-99°W, 28-32°N), which is all the data covers. The invented province
reached the Rio Grande, the Nueces and the Sabine; those rivers are not drawn, rather than drawn in the wrong place. Natural
Earth or NHD for the neighbouring HU4 units would draw them, and would need the owner's approval to download.

## 3. What was built

Build order, each step reading the one before (`public/terrain`):

```
node scripts/build-terrain.mjs <dem> <nhd>     # heights, rivers (unchanged; needs the raw data)
node scripts/build-woods.mjs <bps> <vat> <eco> # woods stands, ecoregions (unchanged; needs the raw data)
node scripts/build-colonies-map.mjs            # places, roads, drawn watercourses (Lynchburg moved)
node scripts/build-land.mjs                    # NEW: land and relief classes, the sea, the escarpment
node scripts/build-province.mjs                # NEW: the real province, every band
```

- **`scripts/terrain/lines.mjs`**: Douglas-Peucker that only keeps points it was given (so bands nest), ring
  simplification, marching-squares contours with interpolation, and `joinReaches` (moved out of the colonies build).
- **`scripts/build-land.mjs` → `colonies-land.bin.gz` (1.1 MB) and `colonies-land.json.gz` (188 KB)**: every
  eighth-of-a-mile cell's land class and relief class, and the same at half a mile, two miles and eight miles with a
  hillshade.
- **`scripts/build-province.mjs` → `colonies-province.json.gz` (172 KB)**: rivers, sea, shore, woods outlines and the
  escarpment at four bands; the towns; a relief grid.
- **`sim/province.mjs`**: `provinceBands()` (the file), `coloniesProvince()` (the province in the shape the map has always
  carried, from a middle band), `mapForPage(map)`.
- **`sim/land.mjs`**: the legends, `landAt(x, y)`, `landBand(i)`.
- **`sim/world.mjs`**: `projectMap` and `projectWorld` send `mapForPage(world.map)`. **A class on the real land no longer
  saves a province**; the page is sent the current one whenever it asks for the map, so a class saved with the invented
  province is drawn with the real one too. `map.bounds` is sent as the box's. No `saveVersion` moved: the province is
  drawing, not state, and its correct value for an old save is the current one.
- **`server/app.mjs`**: `GET /terrain/colonies-province.json` and `GET /terrain/colonies-land.json`, the built files sent
  gzipped as stored (`Content-Encoding: gzip`, `Cache-Control: no-cache`).

### 3.1 Bands

| band | tolerance | for | rivers (points) |
|---|---|---|---|
| 0 | 0.05 mi | a town's streets; exactly the colonies map's own river lines | 12,337 |
| 1 | 0.25 mi | a county | 3,218 |
| 2 | 1 mi | a few counties | 780 |
| 3 | 3 mi | the colonies | 211 |

Each band is simplified from the band finer than it, so every point of band *k* is a point of band *k-1*, and every point
of band *k-1* lies within band *k*'s tolerance of its line (tested). A river drawn at one band lies on the river at the
next: switching bands moves nothing further than the coarser tolerance, which at the zoom that band is for is under a
pixel or two. Outlines too small to see at a band are left out of it (sea: 0.05, 0.5, 4, 30 square miles; woods: -, 0.75,
6, 40). Land cells nest the same way: a band cell is its block's most common class.

## 4. Checks

`tests/geography-truth.test.mjs` (9) and `tests/land.test.mjs` (5). Every one was proven by injecting the regression it
guards and watching that test, and only that test, fail ([evidence/map-accuracy-injections.json](evidence/map-accuracy-injections.json), 13 of 13; the script is [evidence/map-accuracy/injections.mjs](evidence/map-accuracy/injections.mjs)). The Groce's ferry checks of 2026-09-18 were injected the same way - the build script changed, the colonies map rebuilt (the province reads no roads or landings), the file run, everything restored and checked byte for byte - and each has an injection that fails it alone (the table's last column). Moving Béxar across the river fails two tests, both of which hold the river between Béxar and the Alamo, the second on the shape an older page draws:

| check | tolerance | injected |
|---|---|---|
| Liberty east of the Trinity (and a line west crosses it, east never); San Felipe and Washington west of the Brazos; Mina east of the Colorado; Victoria east of the Guadalupe; La Bahía south of the San Antonio - on the colonies map's lines and the province's finest band | 2, 1.5, 0.6, 0.6, 1.2, 0.4 miles | the Colorado drawn 1.5 miles east |
| The San Antonio between Béxar and the Alamo, beside both | 0.3 and 0.5 miles | Béxar set a quarter mile east, maps rebuilt |
| Gonzales across the Guadalupe from Castañeda's camp; the ford on the river; the town by its ford and above the forks | 0.06, 1, 2 miles | the camp set on Gonzales's bank |
| Beeson's on the Colorado; Harrisburg on Buffalo Bayou; Lynchburg at Lynch's ferry, north-east of it, on dry ground | 0.3, 0.5, 0.6 miles | Lynchburg back at TSHA's point, maps rebuilt |
| Bernardo east of the Brazos, near it (2026-09-18, `HIST-TEX-088`), a row of the banks check | 1 mile | Bernardo set 1.2 miles east (fails only this); set on the west bank (fails this and the ferry) |
| Groce's ferry crosses the Brazos from the camp to Bernardo, short, at the crossing opened for it; the Brazos crossings are exactly San Felipe, Washington, Columbia, Brazoria and Bernardo | 3 miles; 0.6 miles | a crossing opened at the camp too (fails only this); the ferry's crossing closed (fails this and the next: the ferry goes 31 miles round) |
| From Groce's, `findPath` to Harrisburg goes by Bernardo, not San Felipe | - | the road east sent round by a detour south of Burnett's |
| Donoho's, McCarley's, Roberts' and Burnett's are places at their markers, and the way from Bernardo to Harrisburg goes by each in order; Donoho's to McCarley's about fifteen miles (Barker), McCarley's to Roberts' about three (marker), Donoho's to Harrisburg Houston's fifty-five | 0.02 miles; 12-18, 2-4, 50-65 miles | the road skipping Roberts' |
| The province's towns are the map's; its finest band is the colonies map's line; the bands nest | exact; tolerance + 0.02 | a band-2 point moved two miles |
| The page is sent the real province whatever a class saved; the classic Trinity passes west of Liberty and the classic San Antonio between Béxar and the Alamo; the coast runs east to west | - | the saved province sent; the classic rivers drawn only at the quarter-mile band |
| The Lost Pines east of Mina are pine; Harrisburg and Lynchburg flat coastal prairie and marsh | over half; over 0.7 | pine read as floodplain |
| South-west of Béxar is brush, Béxar is not; no land class is desert | over half | brush read as savanna; brush named desert scrub |
| North-west of San Antonio is hill country with its escarpment, Béxar flat or rolling, EPA's line between them; the bluff at La Grange | - | the escarpment read as hills |
| Galveston Island's beach and marsh; Galveston Bay water; no beach inland | - | beach read as prairie |
| Each band cell is its block's most common class; the Lost Pines inside the forest outline at every band | 400 sampled cells | band cells taking the lowest class, land rebuilt |

What still holds, from the suite as it was: the crossings and the barrier rivers (`tests/colonies-map.test.mjs`), homes
not in a river and dealt near their settlements (`tests/colonies-deal.test.mjs`, `colonies-world.test.mjs`), the ford and
the camp, the woods on a family's land for hunting and felling (`tests/woods.test.mjs`, `hunting`, `felling`), none of which
reads the land layer. Hunting, felling and the going still read `sim/woods.mjs`.

**Browser** (same computer only, headless Chrome; not a LAN or district test): `npm run test:map-accuracy` takes the Host
to Béxar, Liberty and Gonzales at a town's streets (400 px a mile), a county (45) and the colonies (5), writes a screenshot
of each, and checks the page is sent the real province and both files. Before, taken on the unchanged build:
[Béxar town](evidence/map-accuracy/before-bexar-town.png), [Béxar county](evidence/map-accuracy/before-bexar-county.png),
[Liberty colonies](evidence/map-accuracy/before-liberty-colonies.png), and the rest of `before-*.png`. After, with the
renderer unchanged: [Béxar town](evidence/map-accuracy/after-bexar-town.png), [Béxar county](evidence/map-accuracy/after-bexar-county.png),
[Liberty colonies](evidence/map-accuracy/after-liberty-colonies.png), and `after-*.png`. Looked at: before, the invented
San Antonio lies east of Béxar across the Alamo and the invented Trinity runs a hundred miles east of Liberty; after, the
real San Antonio runs between the plaza and the Alamo, the Trinity passes west of Liberty into Trinity Bay, and Galveston
Bay, the coast and the pine country of the east are where they are. The page still draws its old stroke and the woods
tiles as before: the drawing is the rendering work's.

## 5. The land

Ten land classes and six relief classes on every eighth-of-a-mile cell (`sim/land.mjs`, `FIC-GONZ-057`):

| land | from | share of the box |
|---|---|---|
| water | 3DEP no-data, and ground under 0.3 m joined to the Gulf | 14.6 |
| prairie (tallgrass and coastal) | LANDFIRE coastal, blackland, tallgrass and other prairie settings | 27.4 |
| marsh (coastal marsh and salt prairie) | LANDFIRE marsh, and its prairie inside EPA 34g and 34h | 1.3 |
| sand (sand and beach) | land under 5 m by water that looks out six miles on open water to the SSE | 0.2 |
| savanna (post oak savanna) | LANDFIRE post oak settings | 12.5 |
| floodplain (bottomland and floodplain forest) | LANDFIRE floodplain and riparian settings | 14.5 |
| pine (pine forest) | LANDFIRE pine settings (the Lost Pines at Bastrop, the east) | 10.8 |
| live-oak | LANDFIRE coastal live oak | 0.5 |
| brush (mesquite and thornscrub) | LANDFIRE Tamaulipan and mesquite settings; EPA 31c | 6.4 |
| hill-country (oak and juniper savanna) | LANDFIRE Edwards Plateau settings | 11.1 |

Inland open water (modern reservoirs, wide river beds) and gaps in the vegetation take the class round them.

| relief | rule |
|---|---|
| flat | under 15 m of rise within about a mile and under 1.5 in 100 |
| rolling | to 35 m or 3 in 100 |
| hills | to 70 m or 7 in 100 (Nacogdoches 41 m, the Lost Pines 36 m) |
| steep | beyond (west of Austin 108 m; Helotes 78 m) |
| bluff | 4 in 100 or more within a quarter mile of a river or bayou (Monument Hill at La Grange) |
| escarpment | hills or steep within two miles of EPA's line between the Edwards Plateau and the plains |

**Desert.** There is none in the colonies, and none is drawn. The driest country in the box is the South Texas brush,
south-west of Béxar toward the Nueces (EPA 31c Texas-Tamaulipan Thornscrub; LANDFIRE's Tamaulipan settings), drawn as
brush. Desert begins with the Chihuahuan Deserts (EPA Level III ecoregion 24) beyond the Pecos, some two hundred miles
west of the box's edge at 99°W. **Buttes** likewise: the mesas and buttes of Texas are the Edwards Plateau's western edge
and the Trans-Pecos, outside the box; inside it the hill country's knobs are *steep*.

`ceiling:` LANDFIRE's dune, sand-sheet and saline prairie settings are filed under prairie in the shipped stand grid, so
beach and salt prairie are recovered from the shore and EPA's ecoregions; reading the vegetation raster again would give
them directly. `ceiling:` relief classes are majority-voted into coarser bands, so a narrow bluff disappears zoomed out.
`ceiling:` a pass narrower than a quarter mile through a barrier island closes in the sea outline.

## 6. Formats for the renderer

Coordinates are the game's miles (x east, y south of the confluence). A **flat line** is `[x0, y0, x1, y1, ...]` in
**hundredths of a mile** (integers). A **ring** is a flat line whose last point joins its first (not repeated).

### 6.1 `GET /terrain/colonies-province.json` (`provinceBands()`)

```
{ kind: 'texas-colonies-province', version: 1, units, sources, builtFrom,
  bounds: { minX: -92.14, maxX: 209.15, minY: -172.81, maxY: 102.69 },
  bands: [0.05, 0.25, 1, 3],                                   // tolerance of each band, miles
  rivers: [{ id, name, channelFeet, width, length, levels: [flat|null, flat|null, flat|null, flat|null] }],
           //   width = 2 × channelFeet / 5280 (the old stroke's `width × scale × 0.5` then draws the channel's width)
           //   a river is several pieces (ids name-0, name-1 ...); null where a piece is too short for that band
  sea:   { levels: [[ring, ...] × 4] },                         // the Gulf and bays; fill even-odd, islands are holes
  shore: { levels: [[flat, ...] × 4] },                         // the sea outline minus the box edge; islands closed
  woods: { covers: [{ id: 'savannah'|'plateau'|'brush'|'marsh'|'sand'|'forest', name,
                      levels: [[], [ring, ...], [ring, ...], [ring, ...]] }] },   // even-odd per cover; band 0 empty
  escarpment: { levels: [flat × 4] },                           // band 0 is band 1's line
  settlements: [{ id, name, x, y, weight: 'major'|'minor'|'port', claimId }],
  relief: { columns, rows, minX, minY, cellX, cellY, low, high, values } }   // as `paintRelief` reads it, metres
```

### 6.2 `GET /terrain/colonies-land.json` (`landData().header`)

```
{ kind: 'colonies-land', version: 1, sources, builtFrom,
  cellByte:  'low four bits the land class, high four bits the relief class',
  shadeByte: 'hillshade from the north-west, 0 dark .. 255 bright, 128 level; steps of 8',
  land:   [{ id, name, colour }]  × 11   // index = low nibble: none, water, prairie, marsh, sand, savanna,
                                         //   floodplain, pine, live-oak, brush, hill-country
  relief: [{ id, name, note }]    × 6    // index = high nibble: flat, rolling, hills, steep, bluff, escarpment
  native: { cell: 0.125, columns: 2424, rows: 2208, minX: -93, minY: -173, file: 'colonies-land.bin.gz' },
  bands: [{ cell: 0.5|2|8, columns, rows, minX: -93, minY: -173,
            classes: base64 (one cellByte a cell, row by row from the north-west),
            shade:   base64 (one shadeByte a cell) }],
  escarpment: flat,                      // EPA's line at 0.25 miles
  shares: { ... } }                      // per cent of the native cells in each class
```

A band cell at column `c`, row `r` covers x `minX + c × cell` to `+ cell`, y likewise. The native grid (1.1 MB) is not
served; `landAt(x, y)` reads it on the server, and a tile route like the woods' is the way to send it close up.

### 6.3 `/api/map` for a class on the real land

`map.province` is `coloniesProvince()`: the old shape - `rivers: [{ id, name, width, channelFeet, points: [{x, y}] }]` at
band 1, and band 0 within three miles of a town (both are points of band 0, so the mix nests; a quarter-mile chord across
the bend at Béxar put the river west of the plaza), `coast: [{x, y}]` (the longest shore at band 2, east to west), `belts: [{ id, name, cover, points }]` at band 3
(holes joined into each polygon so a non-zero fill leaves them open), `escarpment` at band 2, `settlements`, `roads: []`,
`relief`, `bounds` - plus `levels: { bands, href: '/terrain/colonies-province.json', land: '/terrain/colonies-land.json' }`.
About 130 KB, where the invented province was 28 KB; the save is 28 KB smaller. `map.bounds` is the box: the camera no
longer zooms out to the invented province's 740 by 510 miles, only to the 301 by 275 the data covers.

## 7. What remains (ceilings)

- The page's province stroke (`drawProvince` in `public/app.js`) still draws every band-1 river at every zoom under the
  colonies map's own rivers, and the woods tiles still arrive in steps: the pop-in is the rendering work, which now has
  bands that nest to draw.
- Rivers outside the box (Rio Grande, Nueces, Sabine) are not drawn (§2).
- ~~The Béxar street layout draws its own reconstructed river.~~ Done 2026-09-17 (`FIC-GONZ-058`): the map's modern line
  through Béxar was the 1920s cut-off channel, running through the town's lots, and the layout was pinned 220 ft west of its
  plaza. The town is now pinned by the Plaza de las Islas on Béxar's point and turned so the Alamo church lies on its true
  bearing; the map's river through the town is the reconstruction's 1836 river, joined to the real line where the town
  ends; the Alamo compound keeps its plan's compass. `ceiling:` the panorama draws the church about 600 ft short of its
  true distance from the plaza. `tests/bexar-layout.test.mjs`.
- The Alamo compound at its historical dimensions, in the towns' style (2026-09-18, `HIST-TEX-090` to `-092`,
  [ALAMO_LAYOUT.md](ALAMO_LAYOUT.md) "On the map"): the church 105 ft 8¼ in by 62 ft 11⅜ in to its outer faces with 4-ft walls
  22½ ft high, the long barrack 191 ft by 20 and two storeys, the low barrack 114 by 17 with the gate through it, a 16 ft 9 in
  west range against 33-inch walls, the church front 290 ft from the west wall; drawn on its true footprint at its true
  height times `DRAWN_HEIGHT`, with the library's painted stone. Placement and bearing are unchanged: nothing read moves the
  church off 29.42583, -98.48611 or turns the plan. The 600-ft `ceiling:` above is not closed by this: it is where the
  town's frame puts the compound relative to the plaza (`FIC-GONZ-058`), not the compound's own dimensions, and moving the
  compound alone would part it from the Plaza de Valero and the road to it. `tests/alamo-dimensions.test.mjs`.
- A creek's timber band and the kept rivers round each settlement in `world.map.terrain` are unchanged, and still carry
  the seed's jitter; since the woods tiles they are not drawn on a real-land class.
- The Lynchburg ferry point is the present crossing; the 1836 landing may have been a few hundred yards off it.

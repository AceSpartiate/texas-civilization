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

Inside the colonies' box (94-99°W, 28-32°N) everything is built from what the game already shipped in `public/terrain`. The
country outside it (§8) is built from data downloaded on 2026-09-18 with the owner's approval, kept outside the repository:

| Data | Source | Licence | Record |
|---|---|---|---|
| Rivers | USGS National Hydrography Dataset, NHDFlowline, HU4 shapefiles (downloaded 2026-09-14) | public domain | `docs/evidence/terrain-data.json` |
| Heights, the sea and bays | USGS 3DEP 1 arc-second (downloaded 2026-09-14) | public domain | `docs/evidence/terrain-data.json` |
| Vegetation | LANDFIRE LF2016 Biophysical Settings (requested 2026-09-15) | public domain | `docs/evidence/woods-data.json` |
| Ecoregions, the escarpment, coastal marsh | U.S. EPA Level IV Ecoregions of Texas (2011) | public domain | `docs/evidence/woods-data.json` |
| Rivers outside the box | USGS NHD NHDFlowline, HU4 0808, 1114, 1201, 1202, 1206, 1208, 1209, 1210, 1211, 1304, 1308, 1309, 1311, 1312 (downloaded 2026-09-18) | public domain | `docs/evidence/outside-data.json` |
| Heights outside the box | USGS 3DEP 1 arc-second, 24 tiles round the box (downloaded 2026-09-18) | public domain | `docs/evidence/outside-data.json` |
| Vegetation outside the box | LANDFIRE LF2016 Biophysical Settings over 100.5-93.5°W, 25.8-32°N (LFPS job 371d8dc9, 2026-09-18) | public domain | `docs/evidence/outside-data.json` |
| Ecoregions outside the box | U.S. EPA Level IV Ecoregions of Texas (2011), downloaded again 2026-09-18 | public domain | `docs/evidence/outside-data.json` |
| Alamo, Lynch's ferry, the banks | Wikipedia (*Alamo Mission in San Antonio*, *Lynchburg Ferry*), TSHA Handbook entries | cited as facts | `HIST-TEX-084`, `HIST-TEX-085` |

Until 2026-09-18 the province ended at the colonies' box, which was all the data covered: the invented province had reached
the Rio Grande, the Nueces and the Sabine, and those rivers were left undrawn rather than drawn in the wrong place.
`ceiling:` the map now ends at 93.5-100.5°W and 25.8-32°N (owner, 2026-09-18, §8) - east to the Sabine, south and west to
the Rio Grande from Matamoros to Eagle Pass - and the camera goes no further. Del Rio, the Devils River and the Pecos lie just
west of it and the Red River country north of 32°N; carrying the map on needs more tiles and units and the owner's word.

## 3. What was built

Build order, each step reading the one before (`public/terrain`):

```
node scripts/build-terrain.mjs <dem> <nhd>     # heights, rivers (unchanged; needs the raw data)
node scripts/build-woods.mjs <bps> <vat> <eco> # woods stands, ecoregions (unchanged; needs the raw data)
node scripts/build-colonies-map.mjs            # places, roads, drawn watercourses (Lynchburg moved)
node scripts/build-land.mjs                    # NEW: land and relief classes, the sea, the escarpment
node scripts/build-province.mjs                # NEW: the real province, every band
node --max-old-space-size=8192 scripts/build-outside.mjs <raw-dir>
                                               # 2026-09-18: the country outside the box (§8); reads the box's
                                               # files and writes only outside-*; needs the raw data (outside-data.json)
```

The first five are the box's, and `build-land` and `build-province`, rerun on 2026-09-18 over the files the game ships, give
their files back byte for byte (§8.4). The box's raw data (its DEM tiles, NHD 1203, 1204 and 1207) is no longer on disk, so
`build-terrain` and `build-woods` cannot be rerun; nothing here needs them to be.

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
  province is drawn with the real one too. `map.bounds` is sent as the box's (since 2026-09-18, the whole map's: §8). No
  `saveVersion` moved: the province is drawing, not state, and its correct value for an old save is the current one.
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

**Amended 2026-09-19: the biomes of 1836** ([BIOMES](BIOMES.md) §7, §13). Since then the land's classes are the woods'
stands read as the country of 1836, one wash each, twenty-three drawn classes (26 ids, five bits of a cell; `prairie` and
`brush` are no longer written) and six relief classes on every eighth-of-a-mile cell (`sim/land.mjs`, `FIC-GONZ-057`,
`FIC-GONZ-060`). Relief, water and the edge of the data are cell for cell what they were (checked by decoding both files).

| land | from | share of the box (2026-09-19) |
|---|---|---|
| water | 3DEP no-data, and ground under 0.3 m joined to the Gulf | 14.6 |
| tallgrass-prairie | LANDFIRE 14220, 14230, 14290 (the blackland and the San Antonio prairie) | 12.0 |
| coastal-prairie | LANDFIRE 14340 | 11.6 |
| mixedgrass-prairie | LANDFIRE 11320, 11490, 11480, 10940, 15040 (the plateau tops) | 1.2 |
| salt-prairie | LANDFIRE 14860, round the bays | 0.4 |
| marsh | LANDFIRE 14900, 14950, and coastal or tallgrass prairie inside EPA 34g, 34h, 34i | 0.9 |
| sand (beach and dunes) | LANDFIRE 14370 and barren; land under 5 m looking out six miles on open water to the SSE | 0.3 |
| mesquite-savanna (mesquite prairie) | LANDFIRE 14380, 14400, 14420; thornscrub 13900, 13920 north-east of the Nueces | 8.3 |
| chaparral | thornscrub south-west of the Nueces; 14390, 11110 | 0.4 |
| savanna (post oak) | LANDFIRE 15190, 14100 | 10.4 |
| cross-timbers | LANDFIRE 13080 | 1.0 |
| pine | LANDFIRE 13710, 13780, 13580 (the Lost Pines), 14580 outside the Big Thicket | 6.5 |
| longleaf | LANDFIRE 13480, 14510 | 4.0 |
| thicket (the Big Thicket) | LANDFIRE 13230, 15060; pine inside 30.1-30.9°N, 94-95°W in EPA 35e/35f | 1.3 |
| floodplain (bottomland and creek timber) | LANDFIRE floodplain (with cane on the coast) and riparian settings | 13.4 |
| canebrake | Caney Creek and Oyster Creek (Holley, `HIST-TEX-100`) | 0.2 |
| cypress-swamp | LANDFIRE 14800 | 0.2 |
| thorn-riparian (river woods of the brush country) | LANDFIRE 14760, 11550 | 0.9 |
| palm-grove | 14760 in EPA 34f or by the Rio Grande east of 98°W (none in the box) | 0 |
| live-oak (mottes) | LANDFIRE 13380, 13390 | 0.5 |
| hill-country (savanna) | LANDFIRE 13830 | 7.9 |
| cedar-brake | LANDFIRE 15230, 15240, 13930 | 3.2 |
| fields | Béxar's farmland and every town's cleared ring (`FIC-GONZ-062`) | 0.05 |

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

Since 2026-09-19 LANDFIRE's dune and saline prairie settings are their own classes (the ceiling that said they were filed
under prairie is gone); the Gulf beach band is still recovered from the shore. `ceiling:` relief classes are majority-voted into coarser bands, so a narrow bluff disappears zoomed out.
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
{ kind: 'colonies-land', version: 2, landBits: 5, sources, builtFrom,   // since 2026-09-19; version 1 had four bits
  cellByte:  'low five bits the land class, the bits above the relief class',
  shadeByte: 'hillshade from the north-west, 0 dark .. 255 bright, 128 level; steps of 8',
  land:   [{ id, name, colour }]  × 26   // index = low five bits: none, water, prairie (unused), marsh, sand, savanna,
                                         //   floodplain, pine, live-oak, brush (unused), hill-country, tallgrass-prairie,
                                         //   coastal-prairie, mixedgrass-prairie, salt-prairie, mesquite-savanna, chaparral,
                                         //   cross-timbers, longleaf, thicket, canebrake, cypress-swamp, cedar-brake,
                                         //   palm-grove, fields, thorn-riparian
  relief: [{ id, name, note }]    × 6    // index = the bits above: flat, rolling, hills, steep, bluff, escarpment
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

**Since 2026-09-18** (§8): `map.bounds` is the whole map, `mapBounds()` - 93.5-100.5°W, 25.8-32°N, x -182.52 to 239.28 and
y -172.81 to 254.22, 422 by 427 miles - whatever a class saved; `province.bounds` stays the box's. `province.rivers` carries
the outside layer's pieces after the box's, at the same band and in the same shape, named alike (the Rio Grande, the Nueces,
the Frio, the Sabine and the ends of the Colorado, Guadalupe, Medina and Neches): about 32 KB more (8 KB gzipped).
`province.levels` adds `outside: '/terrain/outside-province.json'` and `outsideLand: '/terrain/outside-land.json'`.

### 6.4 `GET /terrain/outside-province.json` (`outsideBands()`)

The shape of §6.1, for the country outside the box:

```
{ kind: 'texas-outside-province', version: 1, sources, builtFrom, units,
  bounds: { minX: -182.52, maxX: 239.28, minY: -172.81, maxY: 254.22 },   // the whole map
  box:    { minX: -92.14, maxX: 209.15, minY: -172.81, maxY: 102.69 },    // where the box's own province is drawn
  bands: [0.05, 0.25, 1, 3],                                             // the province's
  rivers: [{ id, name, channelFeet, width, length, from: 'outside'|'box', levels: [flat|null × 4] }],
           //   'outside': a piece past the box, carried one point into it where it crosses the edge
           //   'box': a piece inside the box of a river the box's province does not draw, from the box's own courses
           //   ids go on from the province's pieces of the same river (colorado-river-9 ...), so an id names one piece
  sea:   { levels: [[ring, ...] × 4] },      // the water outside the box, and the box's own for two cells inside its edge
  shore: { levels: [[flat, ...] × 4] },      // not the extent's edge, not the box's
  escarpment: { levels: [[flat, ...] × 4] }, // EPA's line west of the box, in pieces; band 0 is band 1's
  seams: [{ id, name, x, y, miles }],        // where each piece crosses the box's edge, and how far from the box's line
  relief: { columns, rows, minX, minY, cellX, cellY, low, high, values } }   // the province's lattice and tint, carried on
```

### 6.5 `GET /terrain/outside-land.json`

The shape of §6.2: `land`, `relief`, `cellByte`, `shadeByte`, and `bands` of 0.5, 2 and 8 miles on the box's own lattice
(each band's `minX`, `minY` differ from the box's by whole cells), 864, 216 and 54 cells a side. A cell is 0 where the box
draws its own. Inside the box a cell is not 0 only on the box's edge - any cell whose three-by-three neighbourhood reaches
out of the box - and there its class is the box's own band's (`claims`): the page draws those cells from here and not from
the box's band, because the box's hillshade at its edge was worked against heights read as sea level past it.

### 6.6 `outside-woods.json.gz` and `outside-woods.bin.gz` (the server's only)

The stand of every eighth-of-a-mile cell outside the box, on the box's lattice, in the byte order of `colonies-woods.bin`
(`stands` lists it); 0 inside the box and off the map. Read by `sim/outside-woods.mjs` for the woods tiles (§8.2); never sent
to the page and never read by the simulation.

## 7. What remains (ceilings)

- The page's province stroke (`drawProvince` in `public/app.js`) still draws every band-1 river at every zoom under the
  colonies map's own rivers, and the woods tiles still arrive in steps: the pop-in is the rendering work, which now has
  bands that nest to draw.
- ~~Rivers outside the box (Rio Grande, Nueces, Sabine) are not drawn (§2).~~ Done 2026-09-18 (§8): the map reaches the
  Sabine and the Rio Grande, with the country between drawn as the box is. Its own ceilings are §8.5.
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

## 8. The country outside the box (2026-09-18)

Owner, 2026-09-18, by multiple choice: **all three rivers** - the map grows to 93.5-100.5°W and 25.8-32°N, east to the Sabine
and south and west to the Rio Grande from Matamoros to Eagle Pass; **USGS NHD**, including the edge units; outside the box,
**full relief and woods, drawn the way the box is drawn**.

### 8.1 The design: a display layer round a box that does not move

The box's built files (`colonies-*`) feed the simulation - families' land, the woods, felling, travel - so they stay byte for
byte as they were, and no save behaves differently. The country outside is a separate layer, `scripts/build-outside.mjs`,
built from the raw data of §2 (`docs/evidence/outside-data.json`):

- **The same projection, origin and lattice.** The confluence origin and `milesPerLon`/`milesPerLat` of the colonies-water
  header; the box's eighth-of-a-mile grid grown by whole eight-mile cells (3456 by 3456, x -189 to 243, y -173 to 259), so
  every land band's cells, the one-mile ecoregion grid and the relief tint's lattice fall exactly on the box's.
- **The box's data wins where the two overlap.** Inside the box the build reads the box's own heights, classes and water,
  never the new tiles; rivers the box already draws (the Colorado, Guadalupe, Medina, Neches) are drawn only outside it;
  rivers it does not (the Nueces, the Frio, the Sabine) are drawn inside it from the box's own courses.
- **Rivers meet across the edge.** Each piece outside the box is carried one point into it, so it overlaps the box's own line
  rather than meeting it end to end: the Nueces crosses 0.002 and 0.024 miles from the box's line, the Frio 0.019, the Sabine
  0.035, the Colorado 0.014, the Guadalupe 0.009, the Medina 0.001, the Neches 0.008 (`seams` in the file). **The Brazos and
  the San Antonio never leave the box inside the map**: the Brazos leaves it at 32°N, which is the map's edge too, and the San
  Antonio runs from Béxar to its bay inside it. Piece ids go on from the province's (`colorado-river-9` ...) and names are the
  same, so a later item can find each road's crossing of each river.
- **The box's edge.** The box's land bands were worked with the heights past its edge read as sea level, so its hillshade on
  its outer two cells is a false cliff - unseen while the camera stopped at the box, a seam now. The outside's bands carry
  those cells (every cell whose three-by-three neighbourhood reaches out of the box: 4,608 half-mile, 1,144 two-mile, 276
  eight-mile) with the box's own class and a hillshade from real ground on both sides; the page draws them from there and
  takes them out of the box's grids (`withoutClaims`), so each cell is drawn once.
- **The sea** outside the box is filled on its own, under the box's, and runs two cells under the box's edge, so no hairline
  of land shows between the two fills.
- **The woods.** The shade, patches and trees of the map's woods tiles run on past the box: `sim/woods-view.mjs` hands the
  woods `beyond`, the stand of the outside layer's grid (`outside-woods.bin.gz`, LANDFIRE filed as the box's is) wherever the
  box's grid has none. Only the tiles do; `standAt` without `beyond` - hunting, felling, clearing, the going - sees the woods
  end at the box as before.
- **Mexico** has 3DEP heights (the border tiles carry them across) but no LANDFIRE: the land joined to the Rio Grande's far
  bank with no setting is drawn as mesquite and thornscrub brush on its real heights (the Sierra de Picachos rises in the
  south-west corner).
- **Rules.** Relief thresholds, hillshade, the opening of the sea and the beach are `scripts/terrain/land-rules.mjs`, the
  rules of `scripts/build-land.mjs` written out once more (that script must give the box's bytes back, and an old injection
  record edits its text); a test holds them to the box's own hillshade and relief classes on the box's heights.

### 8.2 On the page

`mapForPage` sends `bounds: mapBounds()`, the whole map, and the camera's zoom-out limit follows it: 3.035 pixels a mile at
1280 by 800, where the box alone was 4.248. `public/app.js` loads the two outside files with the box's (`ensureLandLevels`; if
they do not come the box is drawn alone) and draws: the outside's relief tint under the box's; its land grids at the box's
band weights, the half-mile grid cut into four pieces with three cells of margin each (`tileGrid`) so each is smoothed at two
pixels a cell like the box's; the box's grids without their edge cells; the outside's sea under the box's, its escarpment and
its rivers with the box's. The outside's pictures are laid down only around the box's empty middle (`emptyMiddle`,
`aroundHole`), so a view inside the box pays nothing for them. The ground's scattered marks read the outside's classes where
the box's grid has none. The ground cache key (`groundInputs`) is unchanged: the layer is static, and its arrival redraws the
ground (`redrawForArrival`).

### 8.3 Sizes

| file | gzipped | JSON | who reads it |
|---|---|---|---|
| `outside-province.json.gz` | 71 KB | 0.23 MB | the page, once a load (304 after) |
| `outside-land.json.gz` | 170 KB | 2.13 MB | the page, once a load |
| `outside-woods.bin.gz` and `.json.gz` | 420 KB and 0.8 KB | - | the server's woods tiles |

The box's province is 172 KB and its land 185 KB. `/api/map` grows by 32 KB (8 KB gzipped) with the outside rivers.

### 8.4 Checks

`tests/map-outside.test.mjs` (11): the box's eight files hashed; the bounds are the extent and the page is sent them; every
band nests (rivers, sea, escarpment; land bands on the box's lattice); rivers meet across the edge; the Rio Grande passes
Laredo, Rio Grande City and Brownsville and reaches the Gulf, the Nueces and the Sabine reach their bays, all named in
`/api/map`; Mexico is brush and the Gulf water, with no hole; deep in the box the outside is empty and on its edge it has the
box's classes; the outside's rules give the box's hillshade and relief on the box's heights; the page's pieces tile with no
seam and each edge cell is drawn once; the empty middle is empty and the parts round it never overlap; the woods tiles run
past the box while `standAt` does not. Fourteen injected regressions, each failing its own test and no other (the page sent
the box's bounds also fails the geography-truth test, which holds the bounds too; the outside drawn over the box's whole
interior also fails the empty-middle test, the same promise where the page relies on it), everything restored byte for byte:
[evidence/map-outside-injections.json](evidence/map-outside-injections.json), the script
[evidence/map-outside/injections.mjs](evidence/map-outside/injections.mjs). `build-land` and `build-province`, rerun over the
shipped files, give the box's files back byte for byte.

**Browser** (same computer only, headless Chrome; not a LAN or district test). `node scripts/map-outside-browser-proof.mjs`
([record](evidence/map-outside/proof.json)): the bounds and the zoom-out limit, and screenshots, each looked at -
[the whole map, north](evidence/map-outside/whole.png) and [south](evidence/map-outside/whole-south.png), [the colonies' zoom
at the south-west](evidence/map-outside/colonies-southwest.png), [the Sabine](evidence/map-outside/sabine.png), [the mouth of
the Nueces](evidence/map-outside/nueces-mouth.png), the Rio Grande at [Laredo](evidence/map-outside/rio-grande-laredo.png) and
[Matamoros](evidence/map-outside/rio-grande-matamoros.png), the seam at the box's south-west corner at a
[county](evidence/map-outside/seam-southwest-county.png) and [close](evidence/map-outside/seam-southwest-close.png), and
[the Colorado over the west edge](evidence/map-outside/seam-west-colorado.png). No seam shows in relief, classes, woods, sea
or rivers. `node scripts/map-outside-compare.mjs --root <before>` ([record](evidence/map-outside/compare.json)): the same
class drawn by the build before and after with the same camera; inside the box 0.005, 0.000 and 0.000 per cent of the map's
pixels differ at 8.3, 45 and 172 pixels a mile; on the south-west edge the old camera stops at the box and the new one draws
the Nueces and the Frio. `npm run test:farm` with the ground audit on: 52 snapshots checked against a fresh drawing, none
stale. `npm run test:navigation` (13 checks) and `npm run test:map-accuracy` pass.

**Speed** (same computer, CPU throttled six times, headless; not a Chromebook). `scripts/perf-ground-measure.mjs`, the frame
that draws the ground again after a zoom step, median of 16, two runs of each build:

| view | before | after |
|---|---|---|
| all the way out (before 4.25, after 3.03 pixels a mile: twice the ground) | 54.9, 51.2 ms | 61.5, 62.6 ms |
| 4.25 over the box's middle | 54.5, 48.5 ms | 48.9, 52.0 ms |
| 5.95 over Gonzales | 80.1, 82.6 ms | 73.6, 72.3 ms |
| 44.97 over Gonzales | 88.9, 85.2 ms | 85.7, 91.4 ms |

`scripts/perf-render-measure.mjs` (a game standing still, back to back): the painted frame 15.3 and 14.2 ms following the
family, 7.0 and 7.0 ms zoomed out; snapshots 25.8 and 26.1 ms. Records: `evidence/perf-ground-outside-{before,after}-{1,2}.json`,
`evidence/perf-render-outside-{before,after}.json`. Before the outside's pictures were laid down only around the box's middle,
the view over the box's middle cost twice what it had: that is what `aroundHole` is for.

### 8.5 Ceilings

- `ceiling:` the map ends at 93.5-100.5°W, 25.8-32°N (§2); the camera stops there.
- `ceiling:` Mexico has no LANDFIRE; since 2026-09-19 it is chaparral, mesquite prairie on the delta plain round Matamoros
  (east of 98°W, under 30 m), the river woods on the Rio Grande's south bank (palms east of 98°W), and oak savanna above 800 m
  (§9, `HIST-TEX-108`, `FIC-GONZ-060`); its heights are real. INEGI's land-use series, or a vegetation model that crosses the
  border, is the way out.
- `ceiling:` outside the box the woods tiles have no creek strip (the creeks the map draws are the box's), and Louisiana's
  coastal marsh is LANDFIRE's alone (EPA's ecoregions are Texas's).
- `ceiling:` the strip of the box's grid past its edge (under a mile at the west, a third of a mile at the south) is drawn with
  the outside's woods by the tiles while the simulation has none there; a family's land would have to lie on the box's very
  edge to notice.
- `ceiling:` rivers outside the box are the Rio Grande, the Nueces, the Frio, the Sabine and the ends of the box's own; the
  Llano, San Saba, Pedernales, Concho and Devils rise outside it and are not drawn, as the box leaves out its smaller rivers.
- `ceiling:` no settlement outside the box is placed; the towns and ferries of that country are a later item, with claims.
- `ceiling:` the box's relief classes on its edge ring keep the box's majority vote, which counted the empty strip past it as
  flat; the page draws no relief class, so nothing shows it.

## 9. The biomes of 1836 (2026-09-19)

Owner, 2026-09-19: the map brought in line with the natural biomes of Texas; woods only where woods make sense; the woods round
the Alamo cleared to fields. Built from [BIOMES](BIOMES.md) §7; what was built, where it differs and the evidence are its §13.

- **Files.** The box's woods grid and land were rebuilt on purpose (`colonies-woods.bin.gz` 629 → 706 KB, its header 9 → 10 KB;
  `colonies-land.bin.gz` 1,034 → 1,133 KB, its header 185 → 196 KB), and so was the outside layer (`outside-land.json.gz`
  170 → 180 KB, `outside-woods.bin.gz` 420 → 480 KB); `outside-province.json.gz` came out byte for byte as it was. The page
  loads the two land headers (376 KB with the outside's, 21 KB more than before); the woods grids never leave the server. The
  grid of 2026-09-15 is kept beside the new one, `colonies-woods-2016.*` (638 KB), read only by a class made that week. The
  elevation, water, map and province files are byte for byte as they were; `tests/map-outside.test.mjs` holds the new hashes.
- **The land file's cell** is five bits of land class and three of relief (`landBits: 5`, version 2), where it was four and
  four: the biomes are twenty-six ids. `public/land-levels.js` `decodeLand`, `sim/land.mjs` and both builds read either.
- **Speed** (`scripts/perf-render-measure.mjs`, six-times CPU throttle, same computer): the same before and after - painted
  frames 10.2-10.5 a second in every view, a frame 12-14 ms following the family and 5 ms zoomed out, before and after alike
  (`docs/evidence/perf-render-biomes-before-2.json`, `-after.json`, `-after-2.json`). The washes are one picture per grid as
  before (`landPictureData`): more classes cost nothing to draw. A first pair of runs was taken while this computer was loaded
  by other work and is not a comparison (the before run's CPU was 80-90 in 100 busy); it was discarded.
- **Screenshots**, looked at: `docs/evidence/biomes/before-*.png` and `after-*.png` - the whole map (the blackland's gold belt,
  the coast's green-gold, the tawny south-west and the dark pine east now read apart), Béxar and the Alamo close in (the closed
  woods round the compound gone; a tan band of fields along the river; the galleries of Alazán and Apache creeks, which run all
  year, still west of the town), Béxar's fields, Gonzales, Harrisburg's coastal prairie, the Piney Woods and the Big Thicket, the
  Lost Pines, the Hill Country (the cedar breaks darker at the Balcones), South Texas past the Nueces, and pines close up.
- **Amended 2026-09-19** ([BIOMES §14](BIOMES.md#14-criticised-and-corrected-2026-09-19), `FIC-GONZ-121`): a running creek
  big enough to carry a name on the map keeps a belt of timber 0.14 mile either side through the plains, where every running
  creek alike had kept a fringe of 0.045 and Harrisburg had been left with 5 in 100 timber within three miles against the
  2016 grid's 13. **No terrain file changed**: the strip is worked out at run time from the creeks the map draws
  (`standAt`, `sim/woods.mjs`), so `colonies-woods.*`, `colonies-land.*` and the outside layer are byte for byte as §9 left
  them and `tests/map-outside.test.mjs`'s hashes stand. What changes is the woods tiles, which read the strip: before and
  after at `docs/evidence/biomes/crit-{before,after}-buffalo-bayou-harrisburg.png`, looked at. **Known wrong and not mended:**
  the twenty square miles of `fields` round Béxar and the 0.7-mile ring round every other town are three to four times any
  documented acreage (`HIST-TEX-203`, `HIST-TEX-204`), and mending them does want `colonies-woods.*` and `colonies-land.*`
  rebuilt.

## 10. The crossings: a ford, a ferry or a bridge where a road meets water (2026-09-19)

Owner, 2026-09-18: *"when the various rivers and creeks are added, we're going to have to have assets ford, or build bridges
(where they historically were)."* Chosen the same day by multiple choice: every place a road crosses a river or creek gets a
ford, a ferry or a bridge, at the historical crossing where one is known. Research: `HISTORY.md` `HIST-TEX-140` to `-155`;
what is the game's, `FIC-GONZ-090` to `-092`.

### 10.1 What the map has

**138 crossings: 125 fords, 12 ferries, one bridge** (`scripts/build-colonies-map.mjs`, the section *The crossings*). Every road,
and Gonzales's short way to its ford, is intersected with every river and creek the map draws. Each meeting is a crossing:
a place of kind `ford`, `ferry` or `bridge` standing on the road where it meets the water, with the water's name (`water`,
null for open water), `waterKind` (`river` or `creek`), which way it lies (`across`: a ford or bridge straight over the
water, a ferry's rope along its road), and for a ferry met slantwise how much longer it is bank to bank (`oblique`).

| Crossing | Water | Kind | Where | Claim | Confidence |
|---|---|---|---|---|---|
| The ford (Gonzales) | Guadalupe | ford | where it was: the river nearest the town | `HIST-GONZ-007`, `HIST-TEX-141` | documented; the town's ferry of 1832 was gone by 1835 |
| The lower ford | San Antonio | ford | where the roads east meet the river at La Bahía | `HIST-TEX-148` | documented |
| The ford at Béxar | San Antonio | ford | where the road from Gonzales meets the reconstructed river | `HIST-TEX-149` | documented (secondary): a ford for horses and wagons, a footbridge for people |
| The ford at Mina | Colorado | ford | where the road to Gonzales meets the river | `HIST-TEX-147` | documented (Smithwick) |
| The Colorado crossing (Burnam's ferry) | Colorado | ferry, a stage | its place stays at La Grange's point; the ferry is drawn 0.7 mi off where both roads meet the river | `HIST-TEX-145` | documented; its date and the marker's site disputed |
| Beeson's crossing (Beeson's ferry) | Colorado | ferry, a stage | at the 1993 marker in Beason's Park, on the east bank where the army camped (2026-09-19); the road from Gonzales goes over the river to it | `HIST-TEX-146`, `HIST-TEX-157` | documented |
| The lower Colorado crossing | Colorado | ford | the river nearest 29°40' N, 96°27' W, nine miles below Columbus, where the Atascosito road now goes over (2026-09-19) | `HIST-TEX-156` | crossing documented; a ford is the game's (`FIC-GONZ-090`) |
| The ferry at Matagorda | Colorado | ferry | where the road west meets the river | `FIC-GONZ-091` | nothing found at the town |
| The ferry at Victoria | Guadalupe | ferry | where both roads meet the river | `FIC-GONZ-091` | none named before 1839 (`HIST-TEX-154`) |
| The San Felipe ferry | Brazos | ferry | where the road east meets the river | `HIST-TEX-142` | documented; landing not located |
| Robinson's ferry | Brazos | ferry | at Washington | `HIST-TEX-143` | documented for 1830; the year it began disputed |
| Groce's ferry | Brazos | ferry | on the road from the camp to Bernardo | `HIST-TEX-088` | documented |
| Brigham's ferry | Brazos | ferry | at Brazoria | `HIST-TEX-144` | documented for 1831 |
| The Atascosito crossing | Trinity | ferry, a stage | where it was, three miles above Liberty | `HIST-TEX-152` | ferry documented; site likely |
| The Harrisburg ferry | Buffalo Bayou | ferry | opposite the town, where the roads north meet the bayou | `HIST-TEX-151` | documented for 1830 |
| Lynch's ferry | San Jacinto | ferry | the middle of the water the road spans at the present ferry, 0.1 mi from it | `HIST-TEX-150` | documented |
| Vince's bridge | Vince Bayou | bridge | on the road from Harrisburg to Lynchburg, 0.1 mi from the 1912 marker | `HIST-TEX-153` | documented; site disputed by some |
| The ferry on the San Jacinto River | San Jacinto | ferry | where the Atascosito road from Harrisburg meets it, eight miles above Lynch's | `FIC-GONZ-090` | nothing found |
| 123 fords on creeks, bayous, sloughs and the lesser rivers ("The ford on Peach Creek") | | ford | where each road goes over the water most squarely (§10.6) | `FIC-GONZ-090`, `FIC-GONZ-110` | nothing found; the army's camps on Peach, Mill and Cypress creeks are documented, how they crossed is not (`HIST-TEX-155`) |

The counts on this line are the built map's, recounted 2026-09-19 by `scripts/crossings-audit.mjs`. They read 135 (122 fords)
when this section was written, which was five fords short of what the build was already making; §10.6 has the audited numbers.

**The three named crossings are `stage`s.** The Colorado crossing, Beeson's and the Atascosito crossing were `crossing` places;
they are ferries now and keep their ids, names and points, marked `stage: true`, so the expresses still stop there
(`sim/expresses.mjs` `isStop`) and the fleeing families still wait there (`sim/scrape.mjs` `crossingsAlong`). `isStage`
(`sim/colonies-map.mjs`) reads a class saved before, whose places are still `crossing`, the same way. Where a stage's point is
off the water, `over` is where its road meets the water, and the crossing is drawn there.

**Where the record gives the crossing the road goes by it.** Six roads were laid again, each through one point (`layRoad` with a
via point, each leg simplified on its own so the point is on the road): the road to the Colorado and the La Bahía road through
the Colorado crossing's point, the La Bahía road and the Atascosito road through Victoria's, the mail road to Liberty and the
road to Nacogdoches through the Atascosito crossing, and the road to Béxar straight over at Gonzales's ford (it had run half a
mile down the east bank and crossed below). Every other road, every other place and every watercourse the map had is as it was,
checked by decoding the file before and after: 44 of 50 roads byte for byte, the four places the map had given crossing fields
and nothing else moved, 131 places added, 418 watercourses kept in order and 143 creeks added.

**The creeks round the march east.** The map drew named creeks within fourteen miles of a start; it now draws them round the
four houses of the army's march east and round Harrisburg and Lynchburg too, so the creeks the record names on the army's roads
(Cypress Creek at Burnett's, Vince's Bayou) are drawn and their crossings with them. Spring Creek at McCarley's is drawn but the
road east passes south of it and never crosses it. A class keeps a creek for two miles round each ford on it wherever the ford is
(`CREEK_AT_CROSSING`, `sim/colonies-region.mjs`), so a ford is never drawn on dry ground: a class's saved map grows by about
65 KB (a five-family class 286 → 353 KB, a thirty-family one 375 → 436 KB). Creeks draw nothing from the seed, so every class
is dealt as it was.

**Files.** `colonies-map.json.gz` 122 → 149 KB (`tests/map-outside.test.mjs` holds the new hash). The province built from it is
byte for byte the province built from the map before - it reads the towns and the rivers, which did not change. (Rebuilt from
either map it is `4a33a972…`, not the `8ef9b839…` the repository ships: the shipped province predates something else in the
chain, and was left as it is.)

**Beeson's bank and the Atascosito road's own crossing (owner, 2026-09-19).** Two things the crossings left open are mended:

- **Beeson's crossing** stood at Columbus's official point, which is on the *Gonzales* side of the river the map draws, though
  Houston's army camped on the east bank (`HIST-TEX-157`). Its place now stands at the 1993 marker in Beason's Park,
  0.31 miles south-east and over the water, so the army's camp of March 19-26 is on the east bank as the record has it, and
  the road from Gonzales crosses the river by the ferry to reach it. The ferry is drawn at the place, which lies a tenth of a
  mile off the drawn river.
- **The Atascosito road** went over at Beeson's; its own crossing was nine miles below Columbus (`HIST-TEX-156`). That
  crossing is a place now (`lower-colorado-crossing`, *The lower Colorado crossing*), a ford at the river nearest the
  record's point, opened as a window of the Colorado, and the road from Victoria goes over it to San Felipe. Beeson's keeps
  its road east under its own name: **The mail road by Beeson's**, mail route 13 of 1835, "San Felipe, by Beason's and
  Daniel's, to Gonzales" (`HIST-TEX-146`) - the way Houston's army took to San Felipe on March 26-28.

Nothing else moved: the map's other places, roads and waters are as they were, and the three stages are still the three.

### 10.2 What a crossing costs

- **A ferry is an hour's wait** (`FERRY_MINUTES`, `ferryMiles` in `sim/travel.mjs`; `FIC-GONZ-092`): laid on the stretch of road
  it stands on as an hour of the traveller's own going, so a walker, a rider and a wagon each lose an hour, on the watched clock
  and as an hour of the day's road in the long ticks. `findWay` (`sim/ways.mjs`) counts it when choosing the way and returns
  `ferries`. Said on the travel control ("Over a ferry, an hour waiting for the boat.") and in the departure ("The way goes over
  the San Felipe ferry, with a wait for the boat.").
- **A ford is a wade** (`FORD_MINUTES`, `fordMiles`; `FIC-GONZ-094`, owner 2026-09-19): twenty minutes over a river on
  foot, forty with the ox and wagon, a quarter of that over a creek, laid on the road the same way; three times as long when
  the water is up, and one crossing in four goes wrong then. §10.7 has it. A bridge costs nothing.
- **Not for a rider with word** (`findPath`): the mails and public messengers crossed free (`HIST-TEX-140`), and the expresses'
  waits are calibrated on the letters (`HIST-TEX-006`).
- **Not for the flight of the spring**, whose families wait at the flooded crossings by their own rule (`CROSSING_HOURS`,
  `docs/ROAD_EAST.md`) and are given `findWay(..., { ferries: false })`.
- **A ford and a bridge cost what the road costs.** A ford in flood is the flight's rule; nothing else read gives a ford's delay.
- **No ferriage is charged** (`ceiling:` in `sim/travel.mjs`). The rates of 1831 are documented - half a real on foot, a real on
  the horse, eight reales for a loaded wagon - and money is half of the ending; the owner chose (2026-09-19) to leave the ferries free.
- **The army keeps its dates.** Its road goes over Groce's ferry, the Harrisburg ferry and Lynch's ferry, and Beeson's on the way
  from Beeson's to San Felipe; with an hour at each it reaches every camp before it sets out again (`tests/crossings.test.mjs`).

### 10.3 On the page

`drawWorld` (`public/app.js`) draws every `ford`, `ferry` and `bridge` at `over` or its point, from a county's zoom (45 pixels a
mile), a creek's with its creek; Gonzales's ford at every zoom as always. A ford is `drawCrossing` as it was; a bridge is
`drawCrossing`'s timber bridge; a ferry is `drawFerry` (`public/landscape-art.js`): the river laid back over the road between
the landings, a rope bank to bank on two posts, and the library's `ferry-raft` at the near landing - `stand-in:` for a plank
flatboat ([ART_REQUESTS](ART_REQUESTS.md), request 2026-09-19). Named as a landing is (from 45 pixels a mile), the three
stages as before, and a ford the record does not name only from 150. `window.__crossingsDrawn` is the proofs' evidence.

### 10.4 Checks

`tests/crossings.test.mjs` (6), each proven by injecting the regression it guards and watching it fail alone
([evidence/crossings/injections.json](evidence/crossings/injections.json), 6 of 6; the script is
[evidence/crossings/injections.mjs](evidence/crossings/injections.mjs)):

| check | injected |
|---|---|
| Each crossing the record gives is at its place (Lynch's within 0.15 mi of the present ferry, Vince's within 0.15 of the marker, and so on), of its kind and claim, on a road and its water; the places the map had did not move; the stages are exactly the three | Vince's bridge laid four tenths of a mile up the bayou |
| Every meeting of a road with drawn water has a crossing on that road; every crossing is on a road and on its water; the game's kind is a ford but on the San Jacinto and Buffalo Bayou | the road from Roberts' to Burnett's given no crossings |
| A ferry costs an hour, on foot, on the horse and with the wagon, in the pace and to the tick when stepped; the control and the departure say it | the wait reckoned at a walker's pace for every way of going |
| A rider with word and the flight do not wait at the ferries; the flight waits only at the stages and the river towns | the flight made to wait at every ferry |
| The army reaches every dated camp before it sets out again, the ferries' waits on its road | the march east at four hours a day |
| A class saved before opens, plays, and waits at no ferry; its `crossing` places are stages | the old `crossing` places read as ferries |

**Browser** (same computer only, headless Chrome; not a LAN or district test): `node scripts/crossings-browser-proof.mjs` takes
the Host to the ford at Gonzales, Groce's ferry, Lynch's ferry, Beeson's, the Cypress Creek ford at Burnett's and Vince's bridge
at 1,400, 420 and 60 pixels a mile, checks the page drew each as its kind, and writes `docs/evidence/crossings/*.png`, looked
at: the ferry-raft at the landing with its rope over the Brazos at Groce's and over the open water at Lynch's, Beeson's ferry
east of the place, the bridge over Vince's Bayou, the fords at Gonzales and on Cypress Creek.

### 10.5 Ceilings

- `ceiling:` a ferry's wait is an hour by day and by night; the ferryman was bound to cross only from sunrise to ten at night.
- `ceiling:` no ferriage is charged (above).
- `ceiling:` the game's fords are where its roads come down to the water, not where 1835 crossed; the Lavaca, the Navidad and
  the San Bernard crossings of the Atascosito road were not found. Its Colorado crossing and Beeson's bank were mended on
  2026-09-19 (§10.1).
- `ceiling:` the ferries are drawn still: nothing crosses on them, and a family on the road is not drawn waiting for the boat.
- `ceiling:` the road is drawn across a ford and under a bridge as before; at a ferry the river is laid back over it.

### 10.6 The audit: every crossing checked, and two rules mended (2026-09-19)

**Rerun after the merge, the same day.** The places past the box (§11) laid the Old San Antonio Road again over Robbins's
ferry, which took its old southern creek crossings off the map: the audit now reads **125 crossings in the box** (111 fords,
13 ferries, Vince's bridge), 2 flagged - the two grazes below - and 0 meetings uncovered. The six crossings of the country
outside the box are set aside by the audit and checked by their own test, because they stand on rivers this map does not draw
and on roads nobody walks.

Owner: *"dedicate a sub agent to go through all of the bridges and fords. ensure that they're actually placed correctly so
that they cross the rivers."* All 136 crossings were audited against the built map and a good many were looked at on the
page. `FIC-GONZ-110`. **Nothing historical was found or claimed by this pass: no 1835 source was read for it and none is
cited.** What changed is where an invented ford stands, not what was there.

**The audit is a script, and repeatable:** `node scripts/crossings-audit.mjs` (`--flagged` for the findings only, `--json`
for a machine, `--region` to add the class's own map). It reads `public/terrain/colonies-map.json.gz` through
`sim/colonies-map.mjs` and nothing else, so it checks the map a class is served rather than the build's working data, and it
asks six questions of every crossing, one column each:

| | what it asks | tolerance, and why |
|---|---|---|
| water | the drawn point is on the watercourse it names | 0.16 mi: `CONFLUENCE_MILES` (0.15, how far a place may stand from its meeting before the crossing is drawn at `over`) plus the hundredth every coordinate is rounded to. A crossing straight off an intersection should be inside 0.03, and one that is not is reported as such rather than hidden inside the tolerance. Courses under a twentieth of a mile do not count: the map carries 85 two-point leavings of joining and simplifying the reaches, and standing on a dot is not standing on water |
| road | the drawn point is on a road | the same |
| cross | the road goes bank to bank **at** the crossing, not alongside it or over a clipped meander | the road a fifth of a mile either side must lie on opposite sides of the water's own line there, cut back to half the gap to the next meeting so a braided run's neighbour cannot answer for it; and the two lines must meet at 20° or more, since a ford is drawn as an ellipse square across the water and at less than that the road is lying along it |
| names | the water it names is the water it sits on, not a neighbour whose line is nearer | a named water more than 0.03 mi off while another is inside it |
| cover | every meeting of a road with drawn water has a crossing, and every crossing has a meeting | exact |
| once | one crossing where a road crosses one water once, and no two crossings for one meeting | 0.35 mi, past the build's own `CONFLUENCE_MILES` |

The table of all 138, one row each with its verdict, is
[evidence/crossings/audit.txt](evidence/crossings/audit.txt) (and [audit.json](evidence/crossings/audit.json) for a machine),
written by that script over the map as it now stands.

**What it found.** Seven crossings flagged, of 136. Two faults, both in `scripts/build-colonies-map.mjs`:

- **A ford in the middle of a braid.** A road laid over the least effort follows a creek bottom and crosses and recrosses
  it; the crossing was the **middle** meeting of that run, which on a braided stretch is a graze. The ford on Brushy Creek
  stood on a meeting of **three degrees** — drawn square across a creek the road was running *in* — with a meeting of ninety
  a third of a mile away. The crossing is now the **squarest** meeting of its run (`crossingsOf`), ties to the earliest
  along the road. Nine fords moved 0.17 to 1.16 miles: Brushy Creek 3°→90°, Sandy Creek 9°→72°, Little Whiteoak Bayou
  19°→54°, Dry Run 18°→51°, Dry Creek 28°→61°, Reed Creek 35°→49°, Stevens Creek 37°→78°, Garcitas Creek 45°→55°, Lake
  Bayou 57°→61°. The Colorado crossing lost its `oblique` with the direction now read at its own meeting (1.04, under the
  1.05 that earns one).
- **A ford on the tip of a creek that goes nowhere.** Bear Branch ended dead at the road to Nacogdoches and East Branch Mad
  Island Slough at the road from Matagorda, and a ford was drawn on each: the water arrives at the road and vanishes. A
  meeting inside the last twentieth of a mile of a drawn line is the road passing the water's **head**, not going over it
  (`TIP_MILES`, in `meetings`). Those two fords are gone, and a third nick, where the road from Harrisburg to Lynchburg
  passes the head of Little Vince Bayou, no longer counts as a meeting at all.

**What did not change.** Decoded before and after: **all 51 roads byte for byte**, the crossing windows byte for byte, all
561 watercourses byte for byte, and every other place. 179 places → 177; ten crossings changed, nine of them by moving.
`colonies-map.json.gz` `bb08abb6…` → `67a873b7…` (`tests/map-outside.test.mjs` holds the new hash, with the reason).
`saveVersion` is **not** bumped: a class saved before keeps its own map, crossings and all.

**A false alarm worth writing down.** The audit first flagged sixteen crossings as drawn on dry ground, because a class's
own map (`sim/colonies-region.mjs`) keeps a river only within `KEPT_ROUND_SETTLEMENT` of a settled town. It is not so: on
the real land the page draws a **river** from the province's detail levels and skips the class's own river features
entirely (`drawTerrain`, `public/app.js`: `if (feature.kind === 'river' && levelsOf(world)) continue`). Only a **creek**
comes from the class's terrain, and `CREEK_AT_CROSSING` already keeps two miles of it round every ford. Nothing is dry, on
a class of five or of thirty — and the test below now holds that, each kind against the layer that actually draws it.

**Looked at, not only counted** (same computer only, headless Chrome; not a LAN or district test):
`node scripts/crossings-browser-proof.mjs --audit` takes the Host to every flagged crossing, every noted one and a spread
across the map, kinds and waters, at 700, 250 and 90 pixels a mile, and writes `docs/evidence/crossings/audit/*.png` with
`shots.json`. 129 shots of 43 crossings were taken (`shots.json` lists them all); the twenty-four kept in the repository are
the ones actually read by eye, the rest deleted rather than carry sixty megabytes of screenshot - rerun the script for the
whole set. What that showed: Brushy
Creek and Ben Branch drawn *on* the road for a mile with the ford in the middle of it; Bear Branch and the Mad Island
slough stopping dead at the road under their fords; and, on the other side, Groce's, Lynch's, the Harrisburg, San Felipe,
Victoria and Matagorda ferries with the raft on the water and the rope bank to bank, Vince's bridge over its bayou,
Beeson's raft at the east landing, and the ford at Béxar where the road from Gonzales cuts the reconstructed river.

**Checks.** Three tests added to `tests/crossings.test.mjs` (now 10), each proven by injecting the regression it guards and
watching it fail alone ([evidence/crossings/audit-injections.json](evidence/crossings/audit-injections.json), 3 of 3; the
script is [evidence/crossings/audit-injections.mjs](evidence/crossings/audit-injections.mjs)):

| check | injected |
|---|---|
| A crossing stands at the squarest meeting of its run, not the middle one — the five the record places keep their own points | the crossing put back at the middle meeting |
| No crossing stands within `TIP_MILES` of the head or the mouth of the water it names, and nothing stands where a road nicks an end | `TIP_MILES` set to 0 |
| Every crossing has its water drawn under it on the map a class is served: a creek from the class's terrain, a river from the province's levels | `CREEK_AT_CROSSING` set to 0 |

The existing *every place a road meets water has a crossing* test now knows the head rule too, and the `place` injection in
[evidence/crossings/injections.mjs](evidence/crossings/injections.mjs) moves Vince's bridge to 29.72333 rather than
29.72533 — at the old point the injected marker lies off the end of the bayou and the build now **refuses** it instead of
laying a bad bridge, which is the rule working. `npm test` 768 pass; `npm run test:crossings` PASS.

**Left undone.**

- `ceiling:` **a road laid along a creek bottom is still laid along it.** Two crossings are still a graze because their
  road meets that water once and at eight degrees: the ford on Ben Branch (the roads from Gonzales to the Colorado and to
  Beeson's, which run in the branch for half a mile) and the ford on Brushy Creek, whose squarest meeting is on a hairpin
  fifty yards long. The fault is the road, not the crossing: the router charges a creek cell only a quarter mile of extra
  effort, so a valley floor is the cheapest line. Charging more would move roads all over the map, which is a road
  decision and not this pass's. Grep `ceiling:` in `scripts/build-colonies-map.mjs`.
- `ceiling:` **85 watercourses are two points under a fiftieth of a mile long**, left by `joinReaches` and `simplify`; a
  creek one draws a dot of water a dozen metres across, a river one is skipped by the levels. No crossing depends on one
  (checked), and the audit and the tests ignore them. Dropping them is a `build-colonies-map` change that would move the
  `watercourses` array and is left for whoever next rebuilds the water.
- **The Trinity crossing of the Washington–Nacogdoches road is the owner's**, being mended with Robbins' Ferry as a Trinity
  window in the work past the old map box; this pass left it and the `CROSSINGS` window list alone. Its creek crossings
  (Dry Creek, Bear Branch, Arnold Branch, Bowie Creek and the rest) will all move when that road is laid again, and the
  audit should be run over it afterwards.
---

### 10.7 The wade at a ford (owner, 2026-09-19)

Asked by the owner in play - *"to ford a river, shouldn't characters have to wade?"* - and chosen by multiple choice: a ford
should cost **a wade that can go wrong**, and **high water should cost more**. Until then a ford cost nothing at all; only a
ferry's hour was paid.

| | On foot | On the horse | With the ox and wagon |
|---|---:|---:|---:|
| A river's ford | 20 min | 15 min | 40 min |
| A creek's ford | 5 min | 4 min | 10 min |

The wade is laid into the pace of the road the same way the ferry's wait is (`sim/ways.mjs`), so a class plans for it: the
travel control says *"over a ford, a wade, and longer when the water is up"*, and a way that wades ten creeks costs those
minutes. A **bridge costs nothing**, which is what a bridge is for.

**The water being up** is met on the road, not planned for. On a day it rains (`rainyDay`) a ford takes three times as long
and the family is told at the water - *"The water is up at the ford on Mill Creek. Elias waded it slowly."* - and **one
crossing in four goes wrong**: *"Elias was swept off the crossing and had to go up the bank to find a place to get over: an
hour and more lost."* Whoever wades pays in tiredness as well as minutes. The share is hashed from the class, the person, the
crossing and the day, so the same class crosses the same way twice and a reload changes nothing.

**The weather behind it** (`FIC-GONZ-094`). Two things were mended to make this honest. The rain share was one day in two all
year, which is the *spring* of 1836 - "unusually wet and the rivers swollen" (`HIST-TEX-068`) - and far too wet for the
autumn a class opens in: March and April keep it, the rest of the year is one day in five. And the day was hashed straight
into `share`, which is FNV-1a and runs in streaks over keys that differ by one digit: one class had twenty rainy days
together and another none in its first twenty. The day is mixed before it is hashed now. Neither was visible while only the
wagon's bogging on the road east read the weather; a ford reads it on every crossing.

- `ceiling:` only the traveller is held up. Nothing they carry is lost and nobody is turned back to the near bank.
- `ceiling:` the army's dated camps and the word's relays do not wade: the army's marches are dated to the record
  (`tests/crossings.test.mjs`), and a rider with word and the Runaway Scrape's flight keep their own waits.
- `ceiling:` the wade is the same at every ford of its kind: no ford is deeper or easier than another.

Checks: `tests/crossings.test.mjs`, *a ford costs a wade, and the water being up costs more and can go wrong*, proven by five
injections ([wade-injections.json](evidence/crossings/wade-injections.json)) - the ford made free, the wagon made as quick as
a man, high water made ordinary, the wade never going wrong, and the water up whatever the weather.

### 10.8 Brown over the rivers (owner, 2026-09-24)

Owner: *"why can I see brown trail looking things over the rivers?"* Reproduced on the Host's page of a thirty-family class
on the real land at 1,400, 420 and 90 pixels a mile - the San Bernard, the Guadalupe above Victoria and at Gonzales, Piney
Creek - and looked at. Two layers drew brown over the water, neither of them a road:

1. **The high water, laid along chords** (the main one, and at every zoom). A class opens with the Guadalupe up
   (`HIST-TEX-225`, docs/WEATHER.md §10.8), and a river in flood is drawn gone brown (`drawHighWater`, public/weather-art.js)
   into the kept ground over everything under the people. It was stroked with `lineTo` through the course's points - the
   points `weatherCourses` (public/app.js) hands it - while the water under it is `drawWater`'s **curve** through the same
   points (public/curve.js). Close in, a river's points are a hundred pixels and more apart, so the brown cut straight across
   every bend: translucent brown bands, road-coloured, standing off the channel over the grass and crossing the blue at the
   bends. 32 pixels off the water's line at the Guadalupe's bends above Victoria at 1,400 pixels a mile. The fog was banked
   along the same chords (`drawFogShape`). **Mended:** both are laid on `curveThrough`, the water's own curve, so the flood
   is the river and nothing else. **And its colour, second pass the same day:** on its curve the flood was still the
   owner's brown trail - a tan body (`#8a7444`) under a lighter tan crown (`#a78d53`) that, laid over the river, came to
   CIEDE2000 ΔE 10.6-15.3 from the roads' own dirt and only 11-13 L* darker, so the whole flooded river read as a wide dirt
   track. It is water now (`FLOOD`, public/weather-art.js): a soft dark silty edge (`#3c4428`) and a muddy olive body
   (`#5a6a3c`) laid in three strokes, widest and faintest first, so the edge thins out over the bank instead of stopping at a
   kerb; small ripples of current (`#b4c2a6`) scattered across it and bowed downstream, the mark the river's own water is drawn
   with, coming in over 16 to 32 pixels of flood so a narrow flood never carries a dotted line down its middle; and, past the
   level that shuts a ford, sticks of drift (`#3a3226`) scattered across it rather than a dashed line along it. A first try
   with long light streaks along the water drew a paved road with lane markings, and was taken out. The blue core stays
   covered (the reason it was covered on 2026-09-20: a flooded river that shows the ordinary river's blue reads as an
   ordinary river). As seen mid-channel the flood is ΔE ≥ 24.3 from every road surface, 19-35 L* darker than all of them,
   ΔE ≥ 14.7 from the ruts and a lane's stakes, and ΔE ≥ 25 from the ordinary river.
2. **A family's lane, over the water with no ford.** The lane is dealt per class over the easiest ground to the road
   (`sim/colonies-region.mjs`, `sim/homesite.mjs`), kept off the five big rivers (`BARRIER_RIVERS`) and wading the rest,
   "as the roads wade them" - but a road's wade is one of the map's fords (§10.1) and a lane's had nothing, so the lane was
   drawn straight over the creek or the river. On two classes of thirty families the lanes meet drawn water 53 times, 7 of
   them rivers (the San Bernard, the San Marcos, Oyster Creek). **Mended:** `wadesOf` (public/map-base.js) finds each place a
   lane's line meets the water as the page draws it - the class's creeks, and the land's rivers at their finest level - more
   than a quarter mile from any crossing of the map, and the page draws the road's own ford there (`drawCrossing`), from the
   zoom a road's ford is drawn (45 pixels a mile, a creek's with its creek). `window.__wadesDrawn` is the proofs' evidence.
   What a lane wades is the game's, not the record's: a farm lane down to a creek and up the far bank is what an 1835
   holding had, and no lane of the record is on this map.

**Nothing was moved on the server.** No lane, road or crossing changed, no save version: a class saved before draws the
same lanes with their fords.

**What the routing still does, found on the way and not mended** (the built map's and the simulation's, not the page's):

- **The timber tracks and Gonzales's bank path go over the big rivers beside their documented crossings, not at them.**
  In a thirty-family class: the tracks to Gonzales's upper and lower timber and *Along the bank* to Williams's camp cross
  the Guadalupe 0.49 mi below the ford; Victoria's two timber tracks cross the Guadalupe 0.68 and 0.76 mi from the ferry at
  Victoria; Matagorda's lower timber track the Colorado 0.97 mi from its ferry; Liberty's two the Trinity 0.49 and 0.83 mi
  from the Atascosito crossing; Columbia's upper timber track the Brazos 2.5 mi from any crossing. The build routes them
  through the barrier cells each crossing opens for 0.6 mi round it (`CROSSINGS` in `scripts/build-colonies-map.mjs`), and
  simplifying the line cuts a meander. A hunter sent to that timber walks over the river there and pays no ferry and no
  wade. No ford is drawn on them: one there would be an invented crossing a few hundred yards from a real one. Laying the
  tracks again over the crossing points is a rebuild of `colonies-map.json.gz` and a map decision. `ceiling:` in
  `public/app.js`.
- **A lane's wade costs nothing.** A road's ford is a wade (`fordMinutes`, §10.7); a lane's is only drawn. `ceiling:` in
  `public/app.js`; a wade as a place of the map, dealt with the lane, is the way out.
- **A road laid along a creek bottom still meets it more than once** (§10.6's `ceiling:`): 26 meetings of roads with creeks
  stand more than a quarter mile from a crossing, nearly all the other meetings of a braided run whose one ford is within
  1.5 miles. Three more are odd and worth a look when the water is next rebuilt: Coleto Creek's two runs joined across the
  La Bahía road at Goliad by the class's map, Cibolo Creek as the province draws it on the road to Béxar, and the Neches and
  the Angelina on the roads to Nacogdoches past the box, which no audit reads.

**Checks.** `tests/water-overdrawn.test.mjs` (3), each proven by injecting the regression it guards and watching it alone fail
([evidence/water-overdrawn/injections.json](evidence/water-overdrawn/injections.json), 5 of 5; the script is
[evidence/water-overdrawn/injections.mjs](evidence/water-overdrawn/injections.mjs)):

| check | injected |
|---|---|
| The river in flood and the fog on it lie on the water as it is drawn, within two pixels of its curve at the Guadalupe's bends above Victoria, where the chords are 32 pixels off | the high water back on the chords; the fog back on the chords |
| Every place a family's lane goes over drawn water - two classes of thirty, creeks and rivers - has a crossing within a quarter mile or a wade within a tenth | no wade on any lane; a lane wading the creeks but not the rivers |
| A river in flood reads as water: as drawn over the river at five water levels, mid-channel and at the bank, it is CIEDE2000 ΔE ≥ 20 from every road surface (`drawRoad`'s three strokes, read from its source, a ford's ground, the old line styles) and ≥ 15 L* darker; each ripple and stick ΔE ≥ 10 from every road colour and mark; and ΔE ≥ 15 from the ordinary river | the flood back in its old tan |

The floors: ΔE 2000 past 10 is two different colours side by side, so a road's surface is held at twice that, and 15 L* in
value as well, so the flood is not a road in grey either or to a student who does not see colour well; a ripple is a mark a
pixel or two wide and needs only to be another colour.

**Browser** (same computer only, headless Chrome; not a LAN or district test): the San Bernard where a lane crosses it, Piney
Creek, the Guadalupe above Victoria and at Gonzales, the Colorado at Matagorda and Stevens Creek on the road to Béxar, each at
1,400, 420 and 90 pixels a mile, before and after, looked at - and after the colour, in the class's own flood, on an
ordinary day and with a shut river under the morning fog; the crossings (21 shots, PASS), farm and host-view proofs rerun and PASS. The weather proof
fails before its first picture at HEAD too (it waits for a solo game to be running before the family is met) and was not rerun.

## 11. The places past the box (2026-09-19)

Owner, by multiple choice: the places past the old box. The colonies' box is where the game is played; the country round it was
drawn on 2026-09-18 (§8) with no place or road in it at all, so the war arrived from nowhere. Five places, five roads and six
crossings now stand outside it, and one fault inside it is mended.

### 11.1 Robbins's ferry, inside the box

The Trinity could be crossed only at the Atascosito crossing, three miles above Liberty. The Old San Antonio Road crossed it
120 miles higher, at Robbins's ferry (`HIST-TEX-162`), and with no window there the road from Washington to Nacogdoches was
laid the length of the Trinity and back: **199.3 miles, now 141.6**. Robbins's ferry is a window of the Trinity at the 1936
marker, and a ferry like the river's others.

### 11.2 The country outside

| Place | What it is | Claim |
|---|---|---|
| Matamoros | the Mexican army's base on the lower Rio Grande, where Urrea's division set out from | `HIST-TEX-158` |
| San Patricio | the Irish colony on the Nueces, where the Camino Real from Goliad to Laredo crossed; Urrea surprised Johnson there on February 27, 1836 | `HIST-TEX-159` |
| Laredo | the old villa on the north bank of the Rio Grande, the Camino Real's other end | `HIST-TEX-160` |
| The Presidio del Río Grande | San Juan Bautista at present Guerrero, Coahuila, where Santa Anna's army came up to the river | `HIST-TEX-161` |
| Gaines's ferry | the Sabine crossing of the Old San Antonio Road, the way in from the United States | `HIST-TEX-163` |

Their crossings: **Paso de Francia** on the Rio Grande, six miles south-east of the presidio, where Santa Anna crossed into
Texas in February 1836; **the ferry at Matamoros**; **the crossing at San Patricio** on the Nueces; **Gaines's ferry** on the
Sabine; and the fords where the Camino Real from the presidio comes down to **the Nueces** and **the Frio**, which the record
names no crossing for (`FIC-GONZ-090`). Each stands on the river the outside country draws
(`public/terrain/outside-province.json.gz`), not on the box's own water, and each is marked `outside` in the map.

### 11.3 Drawn, never walked

A road outside the box is kind `outside`, and `walked` in `sim/colonies-map.mjs` keeps every one of them out of the graph that
`findWay` and `findPath` build. Nothing about the game changes: no family can walk to Matamoros, no rider carries word to
Laredo, no refuge or shop or express stop moved. A place outside is kind `distant`: its name is drawn on the map and nothing
else, because the library has no art for a Mexican town and a settler's cabin at Matamoros would be a lie.

- `ceiling:` the five roads are straight legs between their places and their crossings (`FIC-GONZ-093`), not least-cost lines:
  the heights and water the routing reads stop at the box's edge.
- `ceiling:` Laredo's own crossing of the Rio Grande is not drawn - the town is on the Texas bank and nothing on the Mexican
  side of it is drawn for a road to reach.
- `ceiling:` Fort Lipantitlán, three miles up the Nueces from San Patricio, is not drawn; nor are Burr's ferry and Niblett's
  Bluff on the Sabine, or Goliad's road south to Refugio's coast.
- `ceiling:` no art for a distant place ([ART_REQUESTS](ART_REQUESTS.md), 2026-09-19).

### 11.4 Checks

`tests/crossings.test.mjs` has the outside country's own test - the places at the record's points, every crossing on the river
that country draws and on a road, no town outside, and `findWay`/`findPath` refusing to reach Matamoros, Gaines's ferry or
Laredo - and `tests/colonies-map.test.mjs` has the Trinity's two windows. Each was proven by injection. A family's lane may no
longer wade a big river even where the easiest ground would (sim/colonies-region.mjs), which is what the Trinity's new window
turned up at Liberty.

## 12. Who a family may watch on this map (2026-09-21)

A real class played the game on Chromebooks on 2026-09-21, and the owner said afterwards:

> "students saw characters moving too fast. i thought we were going to use fog of war for that? if they're moving too fast
> then players shouldn't be able to follow them until they arrive."

He is right, and the second sentence is the rule. This section is what was decided and why. The code is `sim/sight.mjs`;
the claims are `FIC-GONZ-230` (the rule) and `FIC-GONZ-231` (where the line falls). No documented claim was needed: the
paces and the day on the road are unchanged, and go on resting on `HIST-TEX-093` and `FIC-GONZ-059`.

### 12.1 What was already there, and why it was not enough

Nothing about the simulation was wrong. A man walks three miles in an hour of 1835 in every phase, and what changes between
phases is the calendar: a tick stands for twenty minutes, an hour, four hours or twelve (`sim/clock.mjs`). So one tick
carries a walker one mile in the farming day and **ten and a half** in the campaign, and the page draws that stride in the
nine and a half real seconds a Study tick lasts. That is the whole complaint.

Two answers were already in the project:

- **2026-09-17, `outOfSight` in `public/map-base.js`.** The long *middle* of a fast journey was not drawn: a traveller more
  than 2.5 miles from both ends, while a tick carried them more than two miles. It hid the middle and **kept the ends**,
  and at four or twelve hours a tick one tick is longer than the 2.5-mile window - so what a student actually saw was the
  figure appear, jump the entire window in a single step, and vanish. Worse, the page worked it out **for itself**, out of
  a position the server had already sent it. That is the thing `VISION.md` §4 exists to forbid.
- **2026-09-18, the marker (`MARKER_ABOVE`, `public/motion.js`).** Past 1.2 of their own drawn heights a real second a
  traveller was a token on a dotted route instead of a running figure. It was a rule about how close the camera is, and it
  could not help when the ground itself runs out: a token that crosses the country in four ticks is no more followable than
  a skating man. **The marker itself is gone since 2026-09-22** - the owner threw it out ("i don't want to see icons") and
  what stands in its place is §12a below. The *threshold* survives it, as `GAIT_CEILING`.

### 12.2 The rule

> **While one tick would carry a traveller more than `WATCHABLE_MILES_A_TICK` miles of road, that traveller is *away*: the
> server sends no position for them at all, and the family is told where they went, how far is left and roughly when they
> get there. They come back into sight when they arrive.**

Four things are worth saying about it.

**It is the server's.** `sim/world.mjs` `seenTravel` decides it, and somebody away is projected with `location: null` and a
`travel` that carries `from`, `to`, `distance`, `mode`, `away`, `miles`, `due` and `back` - **no `points`, no `progress`,
no `speed`, no `step`**. The page cannot draw what it was not sent, so there is no client rule left to get wrong, and
nothing in a student's payload that they were not entitled to. Every drawing filter on the page is now simply "did the
server send a place for them".

**It is the whole journey, not its middle.** The owner's own words: not followable *until they arrive*. An end window only
makes sense if a tick is shorter than the window, and at the calendars where this rule bites it never is.

**Somebody who is not moving is never away.** A rider reined in to speak with somebody (`travel.halted`) is standing in
front of them; a family bogged in the mud, waiting at a ferry or camped to hunt on the road east sets `halted` too
(`sim/road.mjs`); somebody held on a bank while the water is over a crossing (`travel.waitUntil`, `sim/world.mjs` `wadeAt`)
may sit there for days. None of them jumps anywhere, all of them are worth watching, and all of them stay drawn.

**The Host is not a family.** The teacher's map is unfiltered and always was (`sim/overview.mjs`, `docs/HOST_PAGE.md`):
the Host is sent every traveller's true point and the road under them, and the class panel says "on the road to Gonzales"
in `whereWords` as it always did. This is the first place where the teacher's map and a student's genuinely differ in what
is *on* them, which is exactly what the Host page is for.

### 12.3 Where the line falls, and why it is three miles

The measure is **how far the figure would jump** - the miles the next tick carries *this* traveller, which is their pace
times the calendar (`sim/world.mjs` `milesATick`) - and **never what phase the class is in**. The same four-hour tick
carries an ox wagon 2.3 miles and a courier 31.

Three miles, because that is where this project's own drawing stops sliding a figure and starts jumping it.
`ROAD_WINDOW_MILES` (`sim/overview.mjs`) is three: it is the stretch of road that rides along beside a traveller so the
page can draw them *sliding* down it between two ticks, and it was set at three because "nobody goes further than a rider's
7.8 miles an hour times a twenty-minute tick (2.6 miles), so a window that reaches past that either way loses nothing that
is drawn". Its own `ceiling:` names today's bug in advance: "a traveller put further along than this in one step is drawn
jumping to where they are rather than sliding there". Three miles a tick is also one hour's walking, and an hour a tick
(`WATCHED_TICK_MINUTES`) is the longest tick the travel model still counts hour by hour; past it the clock stops modelling
a journey and starts rationing a day's road across ticks (`sim/travel.mjs` `roadTicks`). `tests/travel-sight.test.mjs`
holds the line equal to `ROAD_WINDOW_MILES`, so the two can never drift apart.

What that lets through, calendar by calendar, in miles of road one tick carries:

| | farming day (20 min) | news (1 hour) | gathering (4 hours) | campaign (12 hours) |
| --- | --- | --- | --- | --- |
| on foot | 1 · watched | 3 · watched | 3.5 · **away** | 10.5 · **away** |
| the family's horse | 1.67 · watched | 5 · **away** | 5.83 · **away** | 17.5 · **away** |
| the ox and wagon | 0.65 · watched | 1.95 · watched | 2.28 · watched | 6.83 · **away** |
| a courier, riding all hours | 2.6 · watched | 7.8 · **away** | 31.2 · **away** | 93.6 · **away** |

**Nothing changes in the farming day**, which is where a class spends its first thirteen minutes and where everything a
student is taught to watch happens: the hunt's walk out to the timber, the wagon coming in on the arrival, a walk across
the family's own land, a ride into Gonzales, and a rider coming up to the door. The walk of the news hour sits exactly on
the line and stays drawn. A courier is only ever hidden on the long open legs; a rider **within sight** of a family is
inside `SIGHT_MILES` and his first tick can never carry him past halfway (`sim/world.mjs` `progressTravel`, the `stretched`
rule), so the approach a conversation needs is untouched.

### 12.4 What a student sees instead

Their person does not disappear from the family; they disappear from the **map**. In three places, all from the server's
own numbers:

- **the card**: `Away on the road to Gonzales · about 96 miles off · should be there about October 8`;
- **their row on the family panel**: `Amos is away on the road to Gonzales, about 96 miles off, and should be there about
  October 8.` (`sim/chores.mjs`, the refusal that row already showed as "is on the road");
- **the page's spoken description**, for a screen reader, in the same words.

`back` is in the family's own terms and never a clock face: "there within the hour", "there in about three hours", or a
date once it is past today's business. The arrival is counted in whole ticks, the way `sim/time.mjs` counts the Host's list
of what is coming, so the two cannot drift apart - and it is an estimate, because a shut ford can hold it a day.

The camera gives the family frame back rather than holding on somebody who is not on the map; pressing the portrait of
somebody away used to leave the frame with nobody to centre on and threw on every painted frame (found by the browser
proof, 2026-09-21).

### 12.5 Nothing is stored

No field of the world changed and `saveVersion` did not move. This is a projection, computed fresh on every tick from the
calendar the class is running; a class saved before 2026-09-21 opens exactly as it did, and a class on the invented
Gonzales country runs one twenty-minute clock and can never reach the line at all.

### 12.6 Checks

`tests/travel-sight.test.mjs` (7) holds the rule, the line, the table above, the carve-outs, the words, the Host's
unfiltered view and that nothing is stored; `tests/map-base.test.mjs` holds that the page no longer decides any of it;
`tests/travel-speed.test.mjs` holds the projection against what the server actually moves. **Twenty-one regressions were
injected one at a time** and each was caught: `node scripts/travel-sight-injections.mjs`,
[docs/evidence/travel-sight-injections.json](evidence/travel-sight-injections.json). The browser proof is `npm run
test:travel-sight` ([record](evidence/travel-sight.json), [screenshots](evidence/travel-sight/)): the same person walking
the same road to Gonzales in two classes, one on the farming day and one at the gathering, with the teacher's page open on
both.

- `ceiling:` one number for people, riders, beasts and the wagon. It is a fact about the drawing rather than about the
  traveller, so one number is right until something is drawn to a different scale from everything else.
- `ceiling:` a neighbour's rider is never put away, because `observedBy` only ever sends one who is already within sight
  and the `stretched` rule keeps his approach watchable. A courier who could be seen from miles off would want the same
  rule applied to `others`.
- `ceiling:` nobody is drawn setting out or walking in at the far end. That is the owner's choice and the simplest thing
  that is true; a two- or three-tick window at each end, once a tick is short enough for a window to mean anything, is the
  way back if a class ever misses the departure.

---

## 12a. Walk, fade, cross, fade, walk — how a traveller who *is* watched is drawn (2026-09-22)

§12 decides who a family may watch at all. This is what the page does with the ones it may.

The owner, playing the day after the marker shipped:

> "characters are still seen zipping around. i don't want to see icons. i want to see them walk at a normal pace, then when
> they've walked a ways (say if they're going somewhere that isn't their farm) they should fade out. then after they travel
> extra fast, they fade back in after arriving close enough to when normally the rest of the way. that way they arrive at
> the correct time, but no one sees them move unnaturally. their icon should say 'Travelling' next to it."

Asked by multiple choice, they chose:

| Question | The answer |
| --- | --- |
| How much normal walking before the fade | **"A short fixed stretch"** — about a hundred yards, the same everywhere, whatever the land looks like |
| What is seen while they are away | **"The road only"** — no figure and no marker, but a faint line showing the road they are on |
| Who it applies to | **"Everyone on the map"** — your family, other families, riders, couriers and armies alike |

And then, the same day, a correction that outranks the first answer wherever the two meet:

> "this shouldn't be a thing on their land. everyone should move at normal speed at all times (unless on horseback or
> wagon) on their land."

### 12a.1 Nothing about when anybody arrives changes

**The server stays authoritative.** The same journeys, the same paces (`sim/travel.mjs`), the same arrival minutes, the
same `saveVersion`. Nothing here is stored and nothing here is sent. This is entirely about what is *drawn*, and the one
thing that makes it safe is that the schedule is a function of the server's own progress along the journey which maps the
journey's end to the journey's end: at the mile the server calls arrival, the figure is drawn at the destination, whole.
`tests/travel-drawn.test.mjs` holds exactly that, and the browser proof measures it on a real journey in a real class.

### 12a.2 The schedule

`travelSight` in `public/motion.js`, asked once a frame per traveller by `sightOf` in `public/app.js`:

1. **A pace nobody exceeds.** A figure is never drawn crossing more ground than its own travel cycle covers at the rate it
   was drawn: `GAIT_CEILING`, 1.2 of its own drawn height a real second. Because it is counted in the figure's *own* height
   it is already the pace of whatever they are on - a rider and horse are drawn 1.8 of a person and may cross 1.8 times the
   ground, a driver the wagon's height. That is the owner's "unless on horseback or wagon", and it needs no second number.
2. **Slow enough already, and nothing happens.** In the family's own view of its farming day a walker is drawn at 0.13 of
   their height a second. Below the gait the journey is drawn exactly where the server has it, whole, all the way - which is
   what a student has always seen of their own farm, and it does not change.
3. **Faster, and the journey is walked at each end and crossed in the middle.** The figure walks the family's own land and
   a hundred yards past it (`SEEN_MILES`) at the gait; fades out over `TRAVEL_FADE_MS` (700 ms); crosses the middle with
   nobody watching, at whatever speed the arrival needs; fades back in a hundred yards short of the end, or short of its own
   land, whichever comes first; and walks the rest at the gait, arriving on the server's own minute.
4. **The road, and nothing else, while they are away.** `drawTravelRoads` draws the road still ahead of them as a faint
   dotted line, coming up as the figure goes and going as the figure comes back. No disc, no pin, no portrait, no
   destination ring: those were the marker, and the marker is gone.
5. **Too short to hold all that, and it is simply walked.** When the two walked ends and the two fades will not fit in the
   journey, there is no fade at all. Pressed close in at a farming tick that falls at about seven hundred yards; the owner's
   own figure for it was "shorter than about 200 yards".
6. **When the road will not pay for everything, the family's own land is paid for first and in full.** A journey has only
   `rate` of its own length to spend on being watched, and walking half a mile of farm at a walk costs about thirteen real
   seconds. The owner's correction is absolute, so the land comes first: a figure may never *begin* to fade while it is
   still on its own land, whatever that costs. The hundred yards off the land are a target and not a promise — they shorten,
   and go to nothing, rather than start a fade a foot inside the family's own line. And where the road cannot pay even for
   the land, **there is no fade at all**: the whole journey is drawn where the server has it, in view, which is the same
   answer §12a.3 gives a journey that never leaves their land. In the farming day there is room for the land *and* the
   hundred yards from about two and a half miles up, which is where a student is looking.

### 12a.3 The family's own land is never sped up and never faded

The land, not a distance, decides where the fade may begin. `landRuns` walks the road against the family's own grant (the
rectangle the server already sends as the grant's `bounds`) and returns where it first leaves that land and where it last
comes back onto it. The walked stretch at the start is *all* of the on-land road plus the hundred yards past the line,
however long that is; the fade-in at the end is finished before the line rather than on it. A journey that never leaves
their own land is never faded at all.

- `ceiling:` **a journey whose own-land stretches the road cannot pay for is drawn at the server's pace, in view, from end
  to end.** That covers both a journey that lies wholly on the family's own land and a short errand at a hurried class pace
  that begins at the house: either can still outrun the gait. It is one rule and not two, and nothing else is possible — on
  their own land nobody may be faded, and the arrival is the server's. The ways out are the class clock
  ([evidence/pace.json](evidence/pace.json)) or fading on the farm too, which the owner refused.
- `ceiling:` only the run at the start and the run at the end are found. A journey that crosses its own land in the
  **middle** - which no road on this map does - is drawn crossing it invisibly.
- `ceiling:` the owner's "(unless on horseback or wagon)" is read here as *the pace you hold them to on their own land is
  the pace of what they are on*, and **not** as *a horse or wagon may still be sped up or faded on their own land*. Nothing
  on their own land is sped up or faded, on foot or otherwise. The other reading is a question for the owner and is in
  `HANDOFF.md`.
- `ceiling:` while they walk the last stretch in, the figure is drawn nearer the destination than the server has them - up
  to about a quarter of a mile at a farming tick pressed close in. It can be no other way if the last hundred yards are to
  be walked *and* the arrival is to be the server's. They are never drawn **at** the destination before the server puts them
  there, which is the part that matters and which is under test.

### 12a.4 Travelling, on the panel

While the server has somebody on a journey their row says **Travelling**, in the same place and by the same rule a refused
row's one line goes (docs/FAMILY_PANEL.md §14.1): in the bar for the main person, on the row for everybody else. When the
bar still has open icons - somebody walking out to a chore can be called off while they walk - the word stands *beside*
them rather than in place of them, which is the owner's "their icon should say 'Travelling' next to it". Somebody carried
away out of sight (§12) is not this, and keeps the server's fuller sentence: where they went, how far off, and when they
should be there.

### 12a.5 Checks

`tests/travel-drawn.test.mjs` (13) holds the pace cap against the library's own cycle rates, the fade curve, the exact
arrival, the own-land case, the too-short case, `landRuns`, and that nothing of the marker is left in the page.
`tests/family-panel.test.mjs` holds the Travelling line, and the order the road is spent in when it will not pay for everything. The browser proof is `npm run test:travel-drawn`
([record](evidence/travel-drawn.json), [screenshots](evidence/travel-drawn/)): one person walking to Gonzales, every painted
frame read off, the drawn speed never past the gait, the figure invisible through the middle, no marker drawn at any frame,
and the drawn arrival on the server's own minute. It is also held to being painted where the schedule walked it and not where the server has it. **Every test was made to fail first, 23 of 23 caught:**
[docs/evidence/travel-drawn-injections.json](evidence/travel-drawn-injections.json).

## 13. South to the Nueces: San Patricio and Agua Dulce Creek walked (2026-09-25)

Owner, 2026-09-25, by multiple choice (docs/BATTLES.md §2b.4): **the map extends south to the Nueces**, so a man who went south
is really at San Patricio and the fights at San Patricio and Agua Dulce are drawn where they happened.

### 13.1 A strip under the box, not a new box

The page already drew this country (§8, the outside layer: relief, land classes, woods tiles, the Nueces). What the simulation
lacked was land to read there - heights for the roads' routing, water, woods - and places and roads to walk. So:

- **`scripts/build-south.mjs <raw-dir>`** builds a strip on the box's own lattice, 27.6-28°N over the box's longitudes (rows 2206
  to 2425: the box's last two rows past 28°N were empty), from the raw data of §2 kept at `C:\Users\zachw\TexasData\raw`:
  heights from 3DEP 1 arc-second (tiles n28w097-n28w099) by `build-terrain`'s rule (each cell the mean of its samples);
  NHD flowlines lying wholly south of 28°N (a flowline reaching 28°N is in the box's own courses already), filtered and
  simplified as `build-terrain` does (2,845 lines, 65 names, Agua Dulce, Banquete and Chiltipin creeks and the Nueces among
  them); and the woods' stand of every cell copied from `outside-woods.bin.gz`, which `build-outside` filed from LANDFIRE by the
  box's own rules for exactly these cells. Writes `public/terrain/south-elevation.bin.gz` (274 KB) and
  `south-water.json.gz` (164 KB). Deterministic.
- **`sim/terrain-data.mjs` `realTerrain()`** lays the strip under the box's grid row for row (heights and courses);
  **`sim/woods.mjs`** does the same for the biomes grid. `boxTerrain()` is the box alone, and `build-land`, `build-province`,
  `build-outside` and `build-woods` read it, so they still give the box's files back byte for byte. **The box's eight files are
  unchanged**; only `colonies-map.json.gz` was rebuilt. The page's files are unchanged: nothing of the strip is sent to it.
- **`scripts/build-colonies-map.mjs`**: San Patricio a `village` at its point (`HIST-TEX-159`), `agua-dulce` a `ground` at
  Wikipedia's point on Agua Dulce Creek (`HIST-TEX-512`) - **moved on 2026-09-26 by the owner's choice to the Handbook of Texas's
  "twenty-six miles below San Patricio"**, the point where the least-effort road south measures 26.0 miles (-97.81, 27.639; §13.6),
  `matamoros-road` where the walked road south ends at 27.62°N
  (`FIC-GONZ-436`); the **Nueces a barrier**, crossed only at San Patricio (`san-patricio-crossing`, the id the outside ford had);
  roads Refugio → San Patricio (39.4 mi), San Patricio → Goliad (56.0 mi, the id of the outside road it replaces), San Patricio →
  Agua Dulce (12.1 mi) → the road's end (16.7 mi), each the least effort over the ground (`FIC-GONZ-027`); the creeks round San
  Patricio and the Agua Dulce ground drawn, so the roads' fords on Papalote, Javelin, Sandy Hollow, Banquete, Agua Dulce and Pintas
  creeks are places. The outside road up from Matamoros now ends at `matamoros-road`; the Camino Real to Laredo goes over the
  Nueces at San Patricio's crossing. **Every other place and road is byte for byte what it was** (checked by decoding both).
- **Old saves** gain the south at the save's door (`sim/south.mjs` `openSouth`, from `server/storage.mjs` `readSave`): the south's
  places, roads and the creeks round their fords, from the built map; San Patricio and its crossing replaced; the two outside roads
  drawn to San Patricio removed; nothing else touched. **No `saveVersion` bump**: an old class's map was not wrong, it lacked
  places; added, it opens the class as it was plus the south. A class on the invented Gonzales country is untouched.

### 13.2 Regenerating (for a merge)

`public/terrain/colonies-map.json.gz` is generated. After merging a branch that also changed `scripts/build-colonies-map.mjs`
(another place, a road), merge the script, then run **`node scripts/build-colonies-map.mjs`** (4 s; reads `realTerrain()`, so the
strip must be on disk) and put the new hash in `tests/map-outside.test.mjs` `BOX_FILES['colonies-map.json.gz']`. The strip's two
files regenerate only with `node scripts/build-south.mjs C:\Users\zachw\TexasData\raw` (about a minute) and need no merge unless
its script changes. Nothing else regenerates.

### 13.3 Sizes and speed (same computer)

`scripts/south-startup-measure.mjs` (`docs/evidence/south-startup-{before,after}.json`) and `scripts/perf-load-measure.mjs`
(`docs/evidence/perf-load-south-{before,after}.json`); the numbers are in HANDOFF.md's entry for this build.

### 13.4 Checks

`tests/south-map.test.mjs` (8): the strip on the box's lattice with the box's own cells unchanged; San Patricio, Agua Dulce and the
road's end at their points with heights and woods; the Nueces crossed only at San Patricio and the roads' lengths; walked and
ridden from Refugio, Goliad and Gonzales, the word carried, never to Matamoros or Laredo; an old save opened at the door with
nothing it had moved; the strip's files as built; the Handbook's twenty-six road miles; an older class's ground moved at the door. `tests/crossings.test.mjs` (the Nueces crossing on the outside country's river
the page draws), `tests/map-outside.test.mjs` (the box's hashes; the new map's). Injections: `scripts/battle-south-injections.mjs`.

### 13.5 Ceilings

- `ceiling:` the strip is the box's longitudes, 27.6-28°N; the simulation's land still stops at 27.6°N, and Matamoros, Laredo
  and the presidio are drawn and never walked (§11.3).
- `ceiling:` the land classes and relief of the strip are the outside layer's (drawn by the page); `landAt` on the server, which
  nothing in the simulation reads, still ends at the box.
- `ceiling:` the ecoregion grid (`ecoregionAt`) ends at the box; nothing south of it asks.
- `ceiling:` a class made on the 2016 woods grid (2026-09-15 to -19) sees no woods in the strip.

### 13.6 Agua Dulce moved to the Handbook's distance (2026-09-26)

Owner, by multiple choice (docs/BATTLES.md §2b.7): Agua Dulce Creek is placed twenty-six miles below San Patricio per the
Handbook of Texas, not at Wikipedia's point near Banquete (-97.84972, 27.8475). One line of `scripts/build-colonies-map.mjs`, found
by building: the road from San Patricio is 26.0 miles (it was 12.1) and on to the road's end 1.3 (16.7). Decoded against the map
before: only `agua-dulce`, the four fords of that road (Sandy Hollow, Agua Dulce, Banquete, Pintas creeks), the two roads through
the ground and the creeks drawn round it changed (Chiltipin, San Diego, El Caro creeks and the Resaca de Enmedio no longer drawn;
San Fernando and Tranquitas creeks drawn) - every other place, road and watercourse is byte for byte. The road still fords the
creek the NHD calls Agua Dulce, about sixteen miles out; the ground is not on it (`HIST-TEX-512` says so). A class saved with the
ground near Banquete is given the new one at the save's door until Grant's drive begins (`sim/south.mjs` `moveAguaDulce`).
**Superseded the same day by §13.7.**

### 13.7 Agua Dulce at the creek crossing (2026-09-26)

Owner, by multiple choice (docs/BATTLES.md §2b.12): "At the creek crossing, 16 mi". One line of `scripts/build-colonies-map.mjs`:
the ground at -97.81428, 27.7886, a quarter mile south of the road's ford on Agua Dulce Creek (`ford-agua-dulce-creek`, found by
projecting the ford onto the road as built at twenty-six miles: 15.36 road miles from San Patricio). Built: the road from San
Patricio is 15.6 miles (it was 26.0) and on to the road's end 11.7 (1.3). Decoded against the map before: only the place
`agua-dulce`, the two roads through it and the creeks drawn round it changed (Chiltipin, San Diego, El Caro and Oso creeks drawn;
Tranquitas Creek no longer) - every ford, crossing, other place, road and watercourse is byte for byte. The new hash is in
`tests/map-outside.test.mjs`. A class saved with the ground near Banquete or at twenty-six miles is given the new one at the save's
door until Grant's drive begins (`moveAguaDulce`, which moves any ground that is not the built map's; its test covers both).


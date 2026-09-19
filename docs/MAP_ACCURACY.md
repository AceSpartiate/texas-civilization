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

## 10. The crossings: a ford, a ferry or a bridge where a road meets water (2026-09-19)

Owner, 2026-09-18: *"when the various rivers and creeks are added, we're going to have to have assets ford, or build bridges
(where they historically were)."* Chosen the same day by multiple choice: every place a road crosses a river or creek gets a
ford, a ferry or a bridge, at the historical crossing where one is known. Research: `HISTORY.md` `HIST-TEX-140` to `-155`;
what is the game's, `FIC-GONZ-090` to `-092`.

### 10.1 What the map has

**135 crossings: 122 fords, 12 ferries, one bridge** (`scripts/build-colonies-map.mjs`, the section *The crossings*). Every road,
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
| Beeson's crossing (Beeson's ferry) | Colorado | ferry, a stage | its place stays at Columbus's point; drawn 0.25 mi east where the road meets the river | `HIST-TEX-146` | documented |
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
| 118 fords on creeks, bayous, sloughs and the lesser rivers ("The ford on Peach Creek") | | ford | where each road comes down to the water | `FIC-GONZ-090` | nothing found; the army's camps on Peach, Mill and Cypress creeks are documented, how they crossed is not (`HIST-TEX-155`) |

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

### 10.2 What a crossing costs

- **A ferry is an hour's wait** (`FERRY_MINUTES`, `ferryMiles` in `sim/travel.mjs`; `FIC-GONZ-092`): laid on the stretch of road
  it stands on as an hour of the traveller's own going, so a walker, a rider and a wagon each lose an hour, on the watched clock
  and as an hour of the day's road in the long ticks. `findWay` (`sim/ways.mjs`) counts it when choosing the way and returns
  `ferries`. Said on the travel control ("Over a ferry, an hour waiting for the boat.") and in the departure ("The way goes over
  the San Felipe ferry, with a wait for the boat.").
- **Not for a rider with word** (`findPath`): the mails and public messengers crossed free (`HIST-TEX-140`), and the expresses'
  waits are calibrated on the letters (`HIST-TEX-006`).
- **Not for the flight of the spring**, whose families wait at the flooded crossings by their own rule (`CROSSING_HOURS`,
  `docs/ROAD_EAST.md`) and are given `findWay(..., { ferries: false })`.
- **A ford and a bridge cost what the road costs.** A ford in flood is the flight's rule; nothing else read gives a ford's delay.
- **No ferriage is charged** (`ceiling:` in `sim/travel.mjs`). The rates of 1831 are documented - half a real on foot, a real on
  the horse, eight reales for a loaded wagon - and money is half of the ending; charging them is the owner's call.
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
  the San Bernard crossings of the Atascosito road were not found. The Atascosito road's own crossing of the Colorado, nine
  miles below Columbus, is not on the map; Beeson's stands at Columbus's official point, west of the river the map draws, where
  Houston's camp of March 1836 was on the east bank.
- `ceiling:` the ferries are drawn still: nothing crosses on them, and a family on the road is not drawn waiting for the boat.
- `ceiling:` the road is drawn across a ford and under a bridge as before; at a ferry the river is laid back over it.

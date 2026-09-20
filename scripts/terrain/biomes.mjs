// How LANDFIRE's settings and EPA's ecoregions are read as the country of 1836: docs/BIOMES.md §3 and §7 (`FIC-GONZ-060`).
//
// Shared by scripts/build-woods.mjs (the colonies' box, which the simulation reads) and scripts/build-outside.mjs (the country
// round it, which only the map's tiles read), so the two file every setting alike and the seam at the box's edge matches.
// sim/woods.mjs holds what each stand is - its patches, trees, game and quarry; this file holds only where each one stands.
//
// What is history and what is not: LANDFIRE's settings and EPA's ecoregions are data (a model of the pre-settlement
// vegetation, and named regions drawn on today's land); the travellers' pattern they are read by is documented (`HIST-TEX-094`
// to `-108`); every rule below that divides one biome from another - the Nueces line, the Big Thicket's rectangle, the coastal
// bottoms' cane, the delta's palms, the canebrakes' corridors, the farmland's envelopes and rings, Mexico's zones - is
// invented for the game (`FIC-GONZ-060`, `FIC-GONZ-062`).

/** The stands in the byte order of the grids. The grids' headers carry this list, and sim/woods.mjs reads the order from them. */
export const STAND_IDS = Object.freeze([
  'none', 'tallgrass-prairie', 'coastal-prairie', 'salt-prairie', 'dunes', 'mixedgrass-prairie', 'mesquite-savanna', 'chaparral',
  'post-oak', 'cross-timbers', 'pine', 'longleaf', 'thicket', 'bottomland', 'bottomland-cane', 'canebrake', 'cypress-swamp', 'creek',
  'thorn-riparian', 'palm-grove', 'live-oak', 'hill-savanna', 'cedar-brake', 'marsh', 'fields', 'water',
]);

/**
 * Each LANDFIRE setting's stand, by its model number (the first five digits of `bps_model`), as docs/BIOMES.md §3.1 and §7.1
 * recommend. The ten settings the week of 2026-09-15 filed under the wrong stand are filed here as the research says (§6.3):
 * 14800 swamp as cypress swamp, 13230 and 15060 hardwood as thicket, 13930, 15230 and 15240 as cedar brake, 14390 lomas as
 * chaparral, 14950 ponds as marsh, 11620 as a creek gallery, the mixed and short grass as mixed-grass prairie, barren as dunes.
 */
export const BY_MODEL = Object.freeze({
  'tallgrass-prairie': ['14220', '14230', '14290'],
  'coastal-prairie': ['14340'],
  'salt-prairie': ['14860'],
  dunes: ['14370', '31'],
  'mixedgrass-prairie': ['11320', '11490', '11480', '10940', '15040'],
  // The thornscrub is mesquite prairie north-east of the Nueces and chaparral south-west of it (`THORNSCRUB`, below).
  'mesquite-savanna': ['14380', '14400', '14420', '13900', '13920'],
  chaparral: ['14390', '11110'],
  'post-oak': ['15190', '14100', '13040'],
  'cross-timbers': ['13080'],
  pine: ['13710', '13780', '13580', '14580'],
  longleaf: ['13480', '14510'],
  thicket: ['13230', '15060'],
  bottomland: ['14730', '14710', '14670'],
  creek: ['14740', '14720', '15250', '11620'],
  'thorn-riparian': ['14760', '11550'],
  'live-oak': ['13380', '13390'],
  'hill-savanna': ['13830'],
  'cedar-brake': ['15230', '15240', '13930'],
  marsh: ['14900', '14950'],
  'cypress-swamp': ['14800'],
  water: ['11'],
  none: ['-9999'],
});
/** Tamaulipan thornscrub: open mesquite prairie with thickets in 1836 north-east of the Nueces, chaparral south-west of it (§4.9). */
export const THORNSCRUB = Object.freeze(['13900', '13920']);
/** The pine settings that are the Big Thicket inside its rectangle (§4.1). */
export const THICKET_PINE = Object.freeze(['14580', '13710']);
/** The Big Thicket: about 30.1-30.9°N, 94.0-95.0°W, in EPA 35e and 35f (Wikipedia, *Big Thicket*; `FIC-GONZ-060`). */
export const BIG_THICKET = Object.freeze({ south: 30.1, north: 30.9, west: -95.0, east: -94.0, ecoregions: ['35e', '35f'] });
/** The coastal bottoms where cane stands in the bottomland: EPA 34c, and 33f below this latitude (§4.5). */
export const CANE_BOTTOMS = Object.freeze({ ecoregions: ['34c'], lower33f: 29.6 });
/** The delta's palm groves: riparian woods in EPA 34f, or by the Rio Grande east of this longitude (§4.11). */
export const PALM_DELTA = Object.freeze({ ecoregion: '34f', east: -98.0, riverMiles: 1.5 });

const standOfModel = new Map();
for (const [stand, models] of Object.entries(BY_MODEL)) for (const model of models) standOfModel.set(model, stand);
/** A LANDFIRE row's model number. */
export const modelOf = row => row.bps_model === '-9999' ? '-9999' : row.bps_model.split('_')[0];

/**
 * The stand a LANDFIRE setting is at a place, or undefined for a setting no rule files. `place`: `{ lon, lat, eco }` (the EPA
 * Level IV code, '' outside Texas), `southWestOfNueces` and `byRioGrande` (within `PALM_DELTA.riverMiles`).
 */
export function standOfSetting(model, place) {
  const stand = standOfModel.get(model);
  if (!stand) return undefined;
  if (THORNSCRUB.includes(model) && place.southWestOfNueces) return 'chaparral';
  if (THICKET_PINE.includes(model) && place.lat >= BIG_THICKET.south && place.lat <= BIG_THICKET.north && place.lon >= BIG_THICKET.west
    && place.lon <= BIG_THICKET.east && BIG_THICKET.ecoregions.includes(place.eco)) return 'thicket';
  if (stand === 'bottomland' && (CANE_BOTTOMS.ecoregions.includes(place.eco) || (place.eco === '33f' && place.lat < CANE_BOTTOMS.lower33f))) return 'bottomland-cane';
  if (stand === 'thorn-riparian' && (place.eco === PALM_DELTA.ecoregion || (place.byRioGrande && place.lon > PALM_DELTA.east))) return 'palm-grove';
  return stand;
}

/**
 * Which side of the Nueces a place lies (`FIC-GONZ-060`, the Nueces line): south-west of it is the Nueces Strip. `lines` are the
 * river's pieces as arrays of `{ lon, lat }`; `head` its northernmost point, from which the line runs on due west off the map,
 * so the country west of its upper course is on the Strip's side too. A ray from the place due north crosses the line an odd
 * number of times from the Strip. ceiling: where two pieces of the river overlap or leave a gap, a ray through it miscounts,
 * a line of cells a cell wide; the counts are printed by the builds.
 */
export function nuecesSide(lines, head) {
  const segments = [];
  for (const line of lines) for (let i = 1; i < line.length; i++) segments.push([line[i - 1], line[i]]);
  if (head) segments.push([{ lon: -180, lat: head.lat }, head]);
  // Where the line crosses each meridian asked about, worked out once a meridian: a grid asks down each of its columns.
  const crossingsAt = new Map();
  return (lon, lat) => {
    let crossings = crossingsAt.get(lon);
    if (!crossings) {
      crossings = [];
      for (const [a, b] of segments) {
        if ((a.lon > lon) === (b.lon > lon)) continue;
        const t = (lon - a.lon) / (b.lon - a.lon);
        crossings.push(a.lat + (b.lat - a.lat) * t);
      }
      crossingsAt.set(lon, crossings);
    }
    let north = 0;
    for (const at of crossings) if (at > lat) north++;
    return north % 2 === 1;
  };
}

/** The canebrakes (§4.5, `HIST-TEX-100`): the creek, the reach of it, and how far either side of it the cane stands, miles. */
export const CANEBRAKES = Object.freeze([
  // Holley pp. 16-17: "an uninterrupted cane-brake, seventy-five miles long, and from one to three miles wide", from within
  // twelve miles of the Gulf toward the Colorado - Caney Creek of Matagorda and Wharton.
  { name: 'Caney Creek', west: -96.25, east: -95.55, south: 28.85, north: 29.35, miles: 0.75 },
  // Holley p. 36: Oyster Creek east of the Brazos, canebrake "interspersed with heavy timber".
  { name: 'Oyster Creek', west: -95.75, east: -95.2, south: 28.95, north: 29.45, miles: 0.35 },
]);
/** The stands a canebrake takes: the prairie and the bottoms it runs through, never the water or the marsh. */
export const CANE_TAKES = Object.freeze(['coastal-prairie', 'tallgrass-prairie', 'bottomland', 'bottomland-cane', 'creek', 'post-oak', 'live-oak']);

/**
 * Béxar's farmland (§5.1, `FIC-GONZ-062` inside `HIST-TEX-098`): the San Antonio from its head to Espada with the ground either
 * side, San Pedro Creek from its springs, and the Alamo's own fields north and east of the compound.
 */
export const BEXAR_FIELDS = Object.freeze({
  // Narrowed 2026-09-20 (owner, by multiple choice: cut them to the record). The seven acequias "extended 15 miles and
  // irrigated 3,500 acres" at their height (`HIST-TEX-203`), and a fifth of a mile either side of fifteen miles of river is
  // about that. It was half a mile either side until then, which made twenty square miles - 12,768 acres - of solid field.
  river: { name: 'San Antonio River', north: 29.478, south: 29.31, miles: 0.12 },
  creek: { name: 'San Pedro Creek', springs: { lon: -98.497, lat: 29.445 }, miles: 0.08 },
  // The Alamo about half a mile east of the plaza; its fields three-quarters of a mile out (TxPAN).
  alamo: { eastOfPlaza: 0.45, miles: 0.25 },
  // Each mission "ringed with farmland irrigated by a comprehensive system of acequias" (TSHA, *Bexar County*): Concepción,
  // San José, San Juan and Espada, half a mile round each (their positions are today's, NPS).
  missions: [
    { name: 'Concepción', lon: -98.4925, lat: 29.3903 }, { name: 'San José', lon: -98.4797, lat: 29.3617 },
    { name: 'San Juan', lon: -98.4553, lat: 29.3344 }, { name: 'Espada', lon: -98.4636, lat: 29.3183 },
  ],
  missionMiles: 0.15,
});
/**
 * Every other town's cleared ring of streets, lots, gardens and small fields, miles from its middle (§5.2, `FIC-GONZ-062`).
 * Cut from 0.7 to a quarter mile on 2026-09-20 (owner, by multiple choice), which is what §5.2 asked for in the first place:
 * 0.7 made 985 acres of solid field at each of sixteen towns, and these were villages of a dozen to fifty cabins with the
 * stumps still standing in their one street in February 1836 (`HIST-TEX-204`).
 */
export const TOWN_RING_MILES = 0.25;

/** Mexico (§4.12, `HIST-TEX-108`): chaparral, but the delta plain round Matamoros, the south bank's river woods, and the Sierra's oaks. */
export const MEXICO = Object.freeze({ deltaEast: -98.0, deltaBelowMetres: 30, riverMiles: 0.25, oaksAboveMetres: 800 });

/**
 * Which drawn class each stand is, for the land's washes (scripts/build-land.mjs, scripts/build-outside.mjs, sim/land.mjs
 * `LAND`). The 2016 stands' ids are kept so an old grid still draws.
 */
export const COVER_OF_STAND = Object.freeze({
  'tallgrass-prairie': 'tallgrass-prairie', 'coastal-prairie': 'coastal-prairie', 'salt-prairie': 'salt-prairie', dunes: 'sand',
  'mixedgrass-prairie': 'mixedgrass-prairie', 'mesquite-savanna': 'mesquite-savanna', chaparral: 'chaparral', 'post-oak': 'savanna',
  'cross-timbers': 'cross-timbers', pine: 'pine', longleaf: 'longleaf', thicket: 'thicket', bottomland: 'floodplain',
  'bottomland-cane': 'floodplain', canebrake: 'canebrake', 'cypress-swamp': 'cypress-swamp', creek: 'floodplain',
  'thorn-riparian': 'thorn-riparian', 'palm-grove': 'palm-grove', 'live-oak': 'live-oak', 'hill-savanna': 'hill-country',
  'cedar-brake': 'cedar-brake', marsh: 'marsh', fields: 'fields',
  prairie: 'prairie', brush: 'brush',
});
/** The prairie a coastal marsh ecoregion's ground is drawn as marsh (EPA 34g, 34h, 34i; as since 2026-09-17). */
export const MARSH_PRAIRIES = Object.freeze(['coastal-prairie', 'tallgrass-prairie', 'prairie']);

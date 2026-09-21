// The towns of the colonies, drawn: docs/TOWNS.md §5b, from the layout sketches in docs/town-research/.
//
// Pure data and arithmetic, with no imports, so the browser loads this same file (served as /town-layouts.js) and the
// server reads it to put each shopkeeper in a drawn building (sim/shops.mjs). One source for both, the way the
// Gonzales buildings and their keepers must agree.
//
// Each layout is in the research's own frame: feet, `+y` "down" the sheet, `+x` bearing `bearing` degrees clockwise
// from north (so `+y` bears `bearing + 90`). `anchor` is the point of the frame the map's own site point stands for.
// What is measured and what is invented is the research's, row by row; every building position finer than a block is
// invented there and registered here as `FIC-GONZ-042`. Rivers, bays and creeks are not drawn from the sketches: the
// map already draws the real watercourses, and a second, invented river would disagree with them.
//
// ceiling: `anchor` is the town's central documented feature (its main square or main corner) set on the site point,
// except at Liberty, where a 1968 marker ties the frame to the ground; elsewhere the offset between the official point
// and the old town's centre is not measured and could be a few hundred feet. Measuring each frame against its markers
// is what would justify undoing this.

export const FEET_PER_MILE = 5280;
/**
 * How much taller a building is drawn than the height the research gives it: a cabin of twenty-odd feet is drawn about as
 * tall as a Gonzales house (public/gonzales-art.js), so a town reads at the zoom a student walks through it; at true
 * height a cabin is a speck (found in the first screenshots, 2026-09-16).
 * ceiling: one factor for every building; a house and a two-storey hall keep their proportion to each other, not to people.
 */
export const DRAWN_HEIGHT = 4;

/** Where a point of a layout falls, in miles east and south of the town's site point. */
export function townPoint(layout, point) {
  const dx = point.x - layout.anchor.x, dy = point.y - layout.anchor.y, b = layout.bearing * Math.PI / 180;
  const round = value => { const fixed = +value.toFixed(4); return fixed === 0 ? 0 : fixed; };
  return { x: round((dx * Math.sin(b) + dy * Math.cos(b)) / FEET_PER_MILE), y: round((-dx * Math.cos(b) + dy * Math.sin(b)) / FEET_PER_MILE) };
}

const DWELLINGS = ['house-round-log', 'cabin-weathered', 'house-hewn-log', 'cabin-small', 'house-dog-run'];
/**
 * The town's ordinary houses, which no source places: on lot centres of a regular grid, nearest a centre first, skipping
 * blocks that are public ground and lots already built on. Repeatable arithmetic only, never Math.random(), as
 * public/bexar-layout.js does. Returns buildings marked `filler`, which a keeper without a documented shop can take.
 */
function dwellings(prefix, { origin, module, block, lots = 2, centre, count, skipBlocks = [], taken = [], sprites = DWELLINGS, height = 22, rows = [0, 12], columns = [0, 12] }) {
  const spots = [];
  for (let row = rows[0]; row < rows[1]; row++) for (let column = columns[0]; column < columns[1]; column++) {
    if (skipBlocks.some(([c, r]) => c === column && r === row)) continue;
    const left = origin.x + column * module + (module - block) / 2, top = origin.y + row * module + (module - block) / 2;
    for (let i = 0; i < lots; i++) for (let j = 0; j < lots; j++) {
      const x = Math.round(left + block * (i + .5) / lots), y = Math.round(top + block * (j + .5) / lots);
      if (taken.some(t => Math.hypot(t.x - x, t.y - y) < block / lots * .8)) continue;
      spots.push({ x, y, d: Math.hypot(x - centre.x, (y - centre.y) * 1.15) });
    }
  }
  spots.sort((a, b) => a.d - b.d || a.x - b.x || a.y - b.y);
  return spots.slice(0, count).map((spot, i) => ({ id: `${prefix}-${i + 1}`, sprite: sprites[((i * 3 + spot.x) % sprites.length + sprites.length) % sprites.length], x: spot.x, y: spot.y, height: height - (i % 3) * 2, filler: true }));
}
const grid = (xs, ys, width) => [
  ...xs.map(([name, x]) => ({ name, width, points: [{ x, y: ys[0][1] }, { x, y: ys.at(-1)[1] }] })),
  ...ys.map(([name, y]) => ({ name, width, points: [{ x: xs[0][1], y }, { x: xs.at(-1)[1], y }] })),
];
// `fill.taken` is ground that holds no building of its own but must still keep the filler off it - the inside of Mina's
// stockade, which used to be held by the palisade pieces themselves.
const withFill = (named, fill) => [...named, ...dwellings(fill.prefix, { ...fill, taken: [...named, ...(fill.taken || [])] })];

// ---------------------------------------------------------------------------------------------- San Felipe de Austin
// docs/town-research/san-felipe.md §7. The frame is invented there, north unresolved; it is turned here so the river side
// of the sheet faces the Brazos on the map (the town stood on the west bank, S3). The built town is a half-mile ribbon
// of log buildings along the road back from McFarland's ferry, in Smithwick's order (§4.2), not a filled grid.
const SF_NAMED = [
  { id: 'sf-austin-house', sprite: 'house-dog-run', x: 300, y: 1600, height: 26, label: 'Austin’s headquarters' },
  { id: 'sf-parker-farm', sprite: 'cabin-weathered', x: 250, y: 1330, height: 22 },
  { id: 'sf-ingram-store', sprite: 'trading-house', x: 470, y: 1700, height: 24, label: 'Ingram brothers’ store' },
  { id: 'sf-league-house', sprite: 'house-hewn-log', x: 560, y: 1560, height: 24 },
  { id: 'sf-league-burnet', sprite: 'cabin-small', x: 640, y: 1700, height: 20, label: 'League & Burnet, law office' },
  { id: 'sf-pettus', sprite: 'house-hewn-log', x: 400, y: 1980, height: 24 },
  { id: 'sf-smithwick-cabin', sprite: 'cabin-small', x: 900, y: 1990, height: 20 },
  { id: 'sf-smithy', sprite: 'shed-open', x: 1010, y: 2000, height: 18, label: 'The smithy', trade: 'blacksmith' },
  { id: 'sf-peyton-tavern', sprite: 'house-dog-run', x: 1180, y: 2010, height: 26, label: 'Peyton’s tavern', trade: 'tavern' },
  // The only frame building in town in 1828 (`town-buildings-researched`, 2026-09-21).
  { id: 'sf-cooper-chieves', sprite: 'building-frame-shop', x: 1330, y: 2000, height: 26, label: 'Cooper & Chieves, saloon' },
  { id: 'sf-dinsmore-store', sprite: 'trading-house', x: 950, y: 1800, height: 24, label: 'Dinsmore’s store' },
  { id: 'sf-white-store', sprite: 'trading-house', x: 1120, y: 1795, height: 24, label: 'White’s store', trade: 'store' },
  { id: 'sf-cotton-plant', sprite: 'cabin-small', x: 1290, y: 1790, height: 20, label: 'The Cotton Plant' },
  { id: 'sf-cotten-house', sprite: 'house-round-log', x: 1380, y: 1785, height: 22 },
  // The Whiteside Hotel: its own broad log building with the open dog-run passage and a chimney at each end, researched
  // and drawn for this spot (`town-buildings-researched`, 2026-09-21). It was `house-dog-run` stretched to 34 feet; the
  // painted building is the right shape, so it goes back to the height the research gives it.
  { id: 'sf-whiteside-hotel', sprite: 'whiteside-hotel', x: 1560, y: 1790, height: 28, label: 'Whiteside Hotel' },
  { id: 'sf-alcalde-office', sprite: 'house-dog-run', x: 1590, y: 1600, height: 26, label: 'The alcalde’s office' },
  { id: 'sf-farmers-hotel', sprite: 'house-dog-run', x: 1800, y: 2050, height: 28, label: 'Farmer’s Hotel' },
  { id: 'sf-huff-store', sprite: 'trading-house', x: 1700, y: 2060, height: 24 },
  { id: 'sf-butler-hotel', sprite: 'house-dog-run', x: 1700, y: 1930, height: 28 },
  { id: 'sf-calvit-house', sprite: 'house-hewn-log', x: 1880, y: 2075, height: 24 },
  { id: 'sf-mcfarland', sprite: 'cabin-weathered', x: 2250, y: 2120, height: 22, label: 'McFarland, the ferryman' },
  { id: 'sf-bake-oven', sprite: 'shed-open', x: 2160, y: 2110, height: 16 },
  { id: 'sf-perry-store', sprite: 'trading-house', x: 1210, y: 1930, height: 26 },
  { id: 'sf-clopper-store', sprite: 'trading-house', x: 1130, y: 1935, height: 24 },
  { id: 'sf-gay-saloon', sprite: 'cabin-weathered', x: 1380, y: 1935, height: 22 },
  { id: 'sf-stewart-drugs', sprite: 'cabin-small', x: 1330, y: 1935, height: 20, label: 'Stewart’s drug store', trade: 'doctor' },
  { id: 'sf-cotten-printshop', sprite: 'cabin-small', x: 1240, y: 1640, height: 20, label: 'Cotten’s print shop' },
  { id: 'sf-wilkins-home', sprite: 'house-round-log', x: 980, y: 1360, height: 22 },
  { id: 'sf-huff-home', sprite: 'house-hewn-log', x: 1120, y: 1360, height: 24 },
  { id: 'sf-spanish-town-1', sprite: 'house-round-log', x: 2620, y: 1840, height: 22 },
  { id: 'sf-spanish-town-2', sprite: 'shed-open', x: 2760, y: 1920, height: 16 },
  { id: 'sf-spanish-town-3', sprite: 'house-round-log', x: 2900, y: 2020, height: 22 },
];
const SAN_FELIPE = {
  name: 'San Felipe de Austin', research: 'docs/town-research/san-felipe.md', bearing: 276, anchor: { x: 1665, y: 1900 },
  streets: [
    { name: 'Calle del Rio', width: 69, points: [{ x: 200, y: 2180 }, { x: 2800, y: 2180 }] },
    { name: 'Calle Comercio', width: 69, points: [{ x: 0, y: 1890 }, { x: 2050, y: 1900 }, { x: 2300, y: 2050 }, { x: 2420, y: 2330 }] },
    { name: 'Calle Primera', width: 55, faint: true, points: [{ x: 200, y: 1600 }, { x: 2800, y: 1600 }] },
    { name: 'Calle Segunda', width: 55, faint: true, points: [{ x: 200, y: 1310 }, { x: 2800, y: 1310 }] },
    { name: 'Calle del Colegio', width: 55, faint: true, points: [{ x: 2800, y: 1310 }, { x: 2800, y: 2180 }] },
  ],
  squares: [
    { label: 'Plaza de Comercio', x: 1500, y: 1930, width: 330, height: 230 },
    { label: 'Plaza de la Constitución', x: 1500, y: 1350, width: 330, height: 230 },
    { label: 'Solar del Hospicio', x: 260, y: 1640, width: 330, height: 230 },
  ],
  buildings: withFill(SF_NAMED, { prefix: 'sf-house', origin: { x: 200, y: 1600 }, module: 290, block: 220, lots: 2, centre: { x: 1250, y: 1950 }, count: 14, rows: [0, 2], columns: [0, 9], skipBlocks: [[4, 1]] }),
};

// ---------------------------------------------------------------------------------------------- Victoria
// docs/town-research/victoria.md §7: the grid, its bearing and its squares measured; a cluster of jacales round Plaza
// de Mercado, thinning north, not a filled grid (I-6, I-8).
const VIC_X = [['Calle Victoria', 4300], ['Calle Bustamante', 4637], ['Calle de los Diez Amigos', 4975], ['Calle Guerrero', 5312], ['Calle Santa Anna', 5649]];
const VIC_Y = [['Calle Libertad', 900], ['Calle Artiaga', 1237], ['Calle Chovel', 1575], ['Calle Ahumada', 1912], ['Calle Terán', 2249], ['Calle Empresario', 2587], ['Calle De León', 2924], ['Calle Manchola', 3261]];
const VIC_NAMED = [
  { id: 'vic-first-church', sprite: 'chapel', x: 5060, y: 2500, height: 28, label: 'The church' },
  { id: 'vic-deleon-house', sprite: 'house-hewn-log', x: 5120, y: 2360, height: 24, label: 'Martín De León’s house' },
  // Victoria's own landmark, painted round with its gun slits and heavy door (`town-buildings-researched`, 2026-09-21).
  { id: 'vic-round-top', sprite: 'round-top-house', x: 4900, y: 2190, height: 26, label: 'Round Top House' },
  { id: 'vic-linn-house', sprite: 'trading-house', x: 4560, y: 2180, height: 24, label: 'Linn’s store', trade: 'store' },
  { id: 'vic-school', sprite: 'cabin-wide', x: 4750, y: 2620, height: 20, label: 'The school' },
  { id: 'vic-ayuntamiento', sprite: 'house-hewn-log', x: 4400, y: 1400, height: 24 },
];
const VICTORIA = {
  name: 'Victoria', research: 'docs/town-research/victoria.md', bearing: 110.7, anchor: { x: 4806, y: 1406 },
  streets: grid(VIC_X, VIC_Y, 59.5),
  squares: [
    { label: 'Plaza de Mercado', x: 4667, y: 2279, width: 278, height: 278 },
    { label: 'Plaza de la Constitución', x: 4667, y: 1267, width: 278, height: 278 },
    { label: 'Square for government buildings', x: 4330, y: 1267, width: 278, height: 278 },
  ],
  // Four jacales in variety and a brush ramada (`town-buildings-researched`, 2026-09-21), for the town whose houses the
  // research found were mostly jacales; one hewn-log house among them, as before.
  buildings: withFill(VIC_NAMED, { prefix: 'vic-jacal', origin: { x: 4300, y: 900 }, module: 337.3, block: 277.8, lots: 2, centre: { x: 4806, y: 2418 }, count: 30, rows: [0, 7], columns: [0, 4], skipBlocks: [[1, 4], [1, 1], [0, 1]], sprites: ['jacal-upright-post', 'jacal-broad', 'house-hewn-log', 'jacal-poor', 'jacal-ramada'], height: 18 }),
};

// ---------------------------------------------------------------------------------------------- Mina
// docs/town-research/mina.md §7: a cardinal grid with the surveyor's street widths; a small cluster round the stockade on
// its documented block, stopping at Farm Street.
const MINA_X = [['Water', 3787], ['Pecan', 4171], ['Jefferson', 4567], ['Hill', 4958], ['Haysel', 5349]];
const MINA_Y = [['Farm', 2804], ['Spring', 3199], ['Chestnut', 3600], ['Pine', 3984], ['Walnut', 4370], ['Austin', 4770], ['Government', 5146]];
// The whole palisaded compound with its cabin standing inside it, as one painted building (`town-buildings-researched`,
// 2026-09-21). It was 27 `palisade` pieces and a `gate` run round a square with a `house-hewn-log` in the middle, which
// read as a fence somebody had left in a field. The gate is drawn open: Mina in 1835 is a town going about its business,
// and `mina-stockade` - the same compound shut - is registered for a day the game ever has one. Nothing shuts it today.
// ceiling: `height` 30 is chosen so the compound is drawn about as wide as its 168 surveyed feet at the town's own
// exaggeration (`DRAWN_HEIGHT` times the frame's own proportion), rather than as tall as a 14-foot palisade would be.
const STOCKADE_LEFT = 3900, STOCKADE_TOP = 4100, STOCKADE_SIDE = 168;
const STOCKADE = [
  { id: 'mina-stockade-house', sprite: 'mina-stockade-open', x: STOCKADE_LEFT + STOCKADE_SIDE / 2, y: STOCKADE_TOP + STOCKADE_SIDE, height: 30, label: 'The stockade' },
];
// The ground inside the palisade, so no house is platted where the pieces used to hold the lots against the filler.
const STOCKADE_GROUND = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]]
  .map(([fx, fy]) => ({ x: STOCKADE_LEFT + fx * STOCKADE_SIDE, y: STOCKADE_TOP + fy * STOCKADE_SIDE }));
const MINA_NAMED = [
  ...STOCKADE,
  { id: 'mina-webber-lot', sprite: 'cabin-small', x: 3440, y: 3650, height: 20 },
  { id: 'mina-gazley-store', sprite: 'trading-house', x: 3900, y: 3900, height: 22, label: 'Dr. Gazley’s store', trade: 'store' },
  { id: 'mina-ayuntamiento', sprite: 'house-hewn-log', x: 4250, y: 4850, height: 24 },
  { id: 'mina-northcross', sprite: 'house-round-log', x: 4300, y: 3800, height: 22 },
];
const MINA = {
  name: 'Mina', research: 'docs/town-research/mina.md', bearing: 90, anchor: { x: 3400, y: 3600 },
  streets: grid(MINA_X, MINA_Y, 55.6),
  squares: [
    { label: 'Plaza de la Constitución', x: 3817, y: 4795, width: 333, height: 333 },
    { label: 'Municipal buildings', x: 4206, y: 4795, width: 333, height: 333 },
  ],
  buildings: withFill(MINA_NAMED, { prefix: 'mina-house', origin: { x: 3787, y: 2804 }, module: 388.9, block: 333.3, lots: 2, centre: { x: 3984, y: 4180 }, count: 22, rows: [0, 6], columns: [0, 4], skipBlocks: [[0, 3], [0, 5], [1, 5]], taken: STOCKADE_GROUND }),
};

// ---------------------------------------------------------------------------------------------- Matagorda
// docs/town-research/matagorda.md §7: a wide square grid on flat ground, turned to N 60.5° E; the built town clustered at
// the water end and empty grid behind it; no church, no plaza de armas.
const MAT_X = [['Orleans Street', -333], ['Thompson Road', 42], ['Saint Mary Street', 496], ['Mulberry Street', 1329], ['Cedar Street', 1730], ['Cypress Street', 2591], ['Caney Street', 2995], ['Catalpa Street', 3409], ['Magnolia Street', 3882], ['Peach Street', 4258], ['Live Oak Road', 4672], ['Bernardo Street', 5074]];
const MAT_Y = [['Burton Street', 1165], ['Austin Street', 1577], ['Center Street', 2057], ['Wightman Street', 2474], ['Lewis Street', 2920], ['Matagorda Avenue', 3718], ['', 4560]];
const MAT_NAMED = [
  { id: 'mat-customhouse', sprite: 'trading-house', x: 1750, y: 4250, height: 26, label: 'The customhouse' },
  { id: 'mat-store-1', sprite: 'trading-house', x: 2050, y: 4270, height: 26, label: 'A store', trade: 'store' },
  { id: 'mat-store-2', sprite: 'storehouse', x: 2350, y: 4290, height: 24 },
  { id: 'mat-warehouse', sprite: 'storehouse', x: 1600, y: 4500, height: 24, label: 'Warehouse' },
  { id: 'mat-committee-room', sprite: 'frame-hall', x: 2600, y: 3900, height: 28, label: 'The Committee Room' },
  { id: 'mat-powder-store', sprite: 'storehouse', x: 2900, y: 4350, height: 22 },
  { id: 'mat-schoolhouse', sprite: 'cabin-wide', x: 6250, y: 1850, height: 20, label: 'The schoolhouse' },
  { id: 'mat-cummins-cabin', sprite: 'house-dog-run', x: 600, y: 3600, height: 26 },
  { id: 'mat-burnham-cabin', sprite: 'house-round-log', x: 1100, y: 4100, height: 22 },
  { id: 'mat-saltworks', sprite: 'shed-open', x: 6800, y: 3600, height: 14, label: 'Salt works' },
];
const MATAGORDA = {
  name: 'Matagorda', research: 'docs/town-research/matagorda.md', bearing: 60.5, anchor: { x: 1100, y: 2696 },
  streets: grid(MAT_X, MAT_Y, 83),
  squares: [
    { label: 'Public Square', x: 2180, y: 2280, width: 833, height: 833 },
    { label: 'Burying Ground', x: 7250, y: 1780, width: 600, height: 600 },
  ],
  // The frame town of imported lumber, now in frame (`town-buildings-researched`, 2026-09-21): clapboard residences and
  // shops of one storey and a storey and a half, with hewn log among them for the older houses.
  buildings: withFill(MAT_NAMED, { prefix: 'mat-house', origin: { x: -333, y: 1165 }, module: 416.7, block: 333, lots: 2, centre: { x: 1900, y: 4300 }, count: 36, rows: [0, 8], columns: [0, 9], skipBlocks: [[6, 2], [6, 3], [7, 2], [7, 3]], sprites: ['building-frame-residence', 'building-frame-one-storey', 'house-hewn-log', 'building-frame-storey-half', 'building-frame-shop'] }),
};

// ---------------------------------------------------------------------------------------------- Columbia
// docs/town-research/columbia.md §7: twenty measured blocks with almost nothing in them, a short row on Brazos Avenue,
// and the broad road out toward Bell's Landing. Marion, two miles off at the landing, is not a place on the map.
const COL_X = [['17th Street', 0], ['16th Street', 407], ['Broad Street', 836], ['15th Street', 1260], ['14th Street', 1657]];
const COL_Y = [['Jefferson Street', 0], ['Hamilton Street', 400], ['Brazos Avenue', 810], ['Clay Street', 1224], ['Bernard Street', 1617], ['Jackson Street', 2011]];
const COL_NAMED = [
  // The Brown house, where the Senate sat: two rooms below and two above (`town-buildings-researched`, 2026-09-21).
  { id: 'col-senate-house', sprite: 'building-frame-two-storey', x: 190, y: 900, height: 26, label: 'Brown house · the Senate' },
  // Kelsey's storey-and-a-half clapboard store, where the House sat.
  { id: 'col-kelsey-store', sprite: 'building-frame-storey-half', x: 190, y: 720, height: 22, label: 'Kelsey’s store · the House', trade: 'store' },
  { id: 'col-bell-hotel', sprite: 'frame-hall', x: 620, y: 760, height: 30, label: 'Bell’s hotel' },
  { id: 'col-courthouse', sprite: 'timber-hall', x: 900, y: 900, height: 24, label: 'The courthouse' },
  { id: 'col-alcalde-office', sprite: 'cabin-small', x: 1030, y: 880, height: 18 },
  { id: 'col-tavern', sprite: 'trading-house', x: 430, y: 900, height: 22, label: 'Fitchett & Gill’s tavern', trade: 'tavern' },
];
const COLUMBIA = {
  name: 'Columbia', research: 'docs/town-research/columbia.md', bearing: 104.8, anchor: { x: 836, y: 810 },
  streets: [
    ...grid(COL_X, COL_Y, 55).map(street => street.name === 'Broad Street' ? { ...street, width: 70 } : street),
    { name: 'The road to Bell’s Landing', width: 60, points: [{ x: 1650, y: 782 }, { x: 2000, y: 708 }, { x: 2645, y: 571 }, { x: 3260, y: 445 }, { x: 4028, y: 276 }] },
  ],
  squares: [],
  buildings: withFill(COL_NAMED, { prefix: 'col-house', origin: { x: 0, y: 0 }, module: 406, block: 351, lots: 2, centre: { x: 400, y: 810 }, count: 12, rows: [0, 5], columns: [0, 4], sprites: ['house-dog-run', 'house-hewn-log', 'house-round-log', 'cabin-wide'] }),
};

// ---------------------------------------------------------------------------------------------- Liberty
// docs/town-research/liberty.md §7: forty-nine measured blocks and five public squares, and in 1835 almost nothing built:
// the log court room on the Casa Consistorial square and about ten houses by the public bar. The frame is tied to the
// ground by the 1968 Plaza Constitucional marker (30.05935, −94.79721, at 1539, 1314): the official point lies about 545
// feet east and 495 feet south of it.
const LIB_X = [['Fonda', 0], ['Crockett', 389], ['Austin', 778], ['Milam', 1167], ['Travis', 1556], ['Main', 1944], ['Fannin', 2333], ['San Jacinto', 2722]];
const LIB_Y = [['Grand', 0], ['Webster', 389], ['Cos', 778], ['Trinity', 1167], ['Liberty', 1556], ['Jefferson', 1944], ['Santa Anna', 2333], ['Washington', 2722]];
const LIB_NAMED = [
  // The 22-foot-square hewn-log court room, researched and drawn for this spot (`town-buildings-researched`, 2026-09-21).
  // `liberty-court-room-side` is the same room seen end on and is registered for a layout that ever wants it turned.
  { id: 'lib-casa-consistorial', sprite: 'liberty-court-room', x: 1750, y: 1361, height: 14, label: 'Casa Consistorial · the court room' },
  { id: 'lib-store', sprite: 'trading-house', x: 2010, y: 1420, height: 18, label: 'The store', trade: 'store' },
  ...[[2010, 1000], [2010, 1180], [2010, 1700], [2010, 1880], [1300, 1050], [1650, 1050], [2000, 1050], [1500, 1300], [1500, 1480]]
    .map(([x, y], i) => ({ id: `lib-house-${i + 1}`, sprite: DWELLINGS[i % DWELLINGS.length], x, y, height: 20 - (i % 3) * 2, filler: true })),
];
const LIBERTY = {
  name: 'Liberty', research: 'docs/town-research/liberty.md', bearing: 88.78, anchor: { x: 2084, y: 1809 },
  streets: [
    ...grid(LIB_X, LIB_Y, 55.5).map(street => ['Main', 'Trinity'].includes(street.name) ? street : { ...street, faint: true }),
    { name: 'The road to Nacogdoches', width: 36, points: [{ x: 1944, y: -1800 }, { x: 1944, y: 0 }] },
    { name: 'The road to the landing', width: 40, points: [{ x: 0, y: 1400 }, { x: -2500, y: 1600 }] },
  ],
  squares: [
    { label: 'Plaza Iglesia Parroquial', x: 806, y: 1195, width: 333, height: 333 },
    { label: 'Plaza Constitucional', x: 1195, y: 1195, width: 333, height: 333 },
    { label: 'Casa Consistorial', x: 1584, y: 1195, width: 333, height: 333 },
    { label: 'Plaza de Cárcel', x: 1972, y: 1195, width: 333, height: 333 },
    { label: 'Plaza de Mercado', x: 1972, y: 1584, width: 333, height: 333 },
  ],
  buildings: LIB_NAMED,
};


// ============================================================================================== the other eight places
// The places on the map families are not dealt to, drawn from the same research (2026-09-16). Several are fortified or
// ruined, so a layout may also carry `walls`: a line of wall pieces (`sprite`, every `spacing` feet, `height`, and a
// `breach` sprite every `breachEvery` pieces where the research says the wall is broken), drawn by public/town-art.js.
// A building marked `onWater` (a ferry, a skiff, a wharf) stands at the water's edge on purpose, and is not held clear of it.

/** Houses strung along a road, alternately either side of it and set back, from its start: a town that is a street. */
function alongRoad(prefix, points, { count, setback = 70, spacing = 120, start = 0, sprites = DWELLINGS, height = 18 }) {
  const out = [];
  let walked = 0, placed = 0, target = start;
  for (let i = 1; i < points.length && placed < count; i++) {
    const a = points[i - 1], b = points[i], span = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ux = (b.x - a.x) / span, uy = (b.y - a.y) / span;
    while (target <= walked + span && placed < count) {
      const t = target - walked, side = placed % 2 ? 1 : -1;
      out.push({ id: `${prefix}-${placed + 1}`, sprite: sprites[placed % sprites.length], x: Math.round(a.x + ux * t - uy * setback * side), y: Math.round(a.y + uy * t + ux * setback * side), height: height - (placed % 3) * 2, filler: true });
      placed++; target += spacing;
    }
    walked += span;
  }
  return out;
}
/** Houses scattered round a centre on the golden angle, thinning outward, skipping any excluded rectangle. Repeatable. */
function scatter(prefix, { centre, radius, count, sprites = DWELLINGS, height = 16, exclude = [], within = () => true }) {
  const out = [];
  for (let i = 0; out.length < count && i < count * 6; i++) {
    const r = radius * Math.sqrt((i + .5) / (count * 1.6)), a = i * 2.39996;
    const x = Math.round(centre.x + r * Math.cos(a)), y = Math.round(centre.y + r * Math.sin(a));
    if (exclude.some(e => x > e.x - 30 && x < e.x + e.width + 30 && y > e.y - 30 && y < e.y + e.height + 30) || !within(x, y)) continue;
    out.push({ id: `${prefix}-${out.length + 1}`, sprite: sprites[out.length % sprites.length], x, y, height: height - (out.length % 3) * 2, filler: true });
  }
  return out;
}
const ring = (centre, radius, pieces) => Array.from({ length: pieces + 1 }, (_, i) => ({ x: Math.round(centre.x + radius * Math.cos(i / pieces * 2 * Math.PI)), y: Math.round(centre.y + radius * Math.sin(i / pieces * 2 * Math.PI)) }));
const faint = streets => streets.map(street => ({ ...street, faint: true }));

// ---------------------------------------------------------------------------------------------- Washington
// docs/town-research/washington.md §8: one street and a handful of buildings, a staked grid with nothing in it (the lots
// were not sold until January 1836), and the ferry on its bench below the bluff. Ferry Street's bearing and the corner
// are measured; the frame's anchor is the map's own point, measured in the research at u −236, v 161.
const WASH_FERRY = [{ x: -250, y: 0 }, { x: 0, y: 0 }, { x: 700, y: 0 }, { x: 1050, y: 0 }, { x: 1300, y: 0 }, { x: 1500, y: 0 }];
const WASHINGTON = {
  name: 'Washington', research: 'docs/town-research/washington.md', bearing: 26.7, anchor: { x: -236, y: 161 },
  streets: [
    { name: 'Ferry Street', width: 80, points: WASH_FERRY },
    { name: 'Main Street', width: 60, points: [{ x: 0, y: -680 }, { x: 0, y: 680 }] },
    ...faint([340, 680, -340].map(v => ({ name: '', width: 60, points: [{ x: -680, y: v }, { x: 340, y: v }] }))),
    ...faint([-340, -680, 340].map(u => ({ name: '', width: 60, points: [{ x: u, y: -340 }, { x: u, y: 680 }] }))),
  ],
  squares: [],
  buildings: [
    // Byars & Mercer's two-storey frame (`town-buildings-researched`, 2026-09-21).
    // ceiling: it is drawn finished. Nothing in the library or the layout says half-built, and a building with its studs
    // still open wants its own frame; the research has it unfinished in March 1836.
    { id: 'wash-frame-unfinished', sprite: 'building-frame-two-storey', x: 40, y: -50, height: 28, label: 'Byars & Mercer’s frame' },
    { id: 'wash-byars-smithy', sprite: 'timber-shop', x: 90, y: 90, height: 16, label: 'Byars’s smithy' },
    { id: 'wash-morris-cabin', sprite: 'house-round-log', x: 300, y: 80, height: 16 },
    { id: 'wash-kenney-house', sprite: 'house-hewn-log', x: -280, y: 120, height: 18 },
    { id: 'wash-robinson-ferry-house', sprite: 'trading-house', x: 1250, y: -120, height: 18, label: 'Robinson’s, at the crossing' },
    { id: 'wash-pecan', sprite: 'pecan', x: 1139, y: 106, height: 40 },
    { id: 'wash-ferry', sprite: 'ferry-raft', x: 1470, y: 0, height: 8, onWater: true, label: 'The ferry' },
    ...[[-340, -340], [340, -340], [-340, 340], [340, 340], [-680, 340], [-340, 680], [340, 680], [-680, -340]].map(([x, y], i) => ({ id: `wash-stake-${i + 1}`, sprite: i % 2 ? 'survey-stake' : 'survey-blazed-post', x, y, height: 5 })),
    ...alongRoad('wash-house', [{ x: 100, y: 0 }, { x: 650, y: 0 }], { count: 8, spacing: 75, setback: 75 }),
  ],
};

// ---------------------------------------------------------------------------------------------- Brazoria
// docs/town-research/brazoria.md §7: a grid lying square along the Brazos, a short dense frontage on Main Street either
// side of Market, and the back of the grid in stumps and garden. The origin, Market × Main, is measured, and the map's
// point is set on it (HIST-TEX-046).
const BRZ_X = [['Walnut Street', -1148], ['Chestnut Street', -882], ['Star Street', -591], ['China Street', -325], ['Market Street', 0], ['Liberty Street', 541], ['Cherry Street', 935]];
const BRZ_Y = [['Main Street', 0], ['Pearl Street', 282], ['Austin Street', 561], ['Camp Street', 840], ['Travis Street', 1119], ['Marion Street', 1391], ['Velasco Street', 1670]];
const BRZ_NAMED = [
  { id: 'brz-mills-store', sprite: 'trading-house', x: 30, y: -40, height: 26, label: 'The Mills brothers’ store' },
  { id: 'brz-long-boarding-house', sprite: 'house-dog-run', x: -190, y: 16, height: 24, label: 'Jane Long’s boarding house' },
  { id: 'brz-long-outbuilding', sprite: 'storehouse', x: -190, y: 120, height: 12 },
  { id: 'brz-hotel', sprite: 'frame-hall', x: 300, y: 20, height: 28, label: 'The Brazoria Hotel' },
  { id: 'brz-printing-office', sprite: 'cabin-small', x: -40, y: 300, height: 18, label: 'The Texas Republican' },
  { id: 'brz-andrews-store', sprite: 'trading-house', x: 160, y: 300, height: 22, label: 'Andrews’s store' },
  { id: 'brz-bennett-sharp-store', sprite: 'trading-house', x: -330, y: 290, height: 22 },
  { id: 'brz-manson-store', sprite: 'timber-shop', x: 480, y: 290, height: 20 },
  { id: 'brz-warehouse-1', sprite: 'storehouse', x: -280, y: -20, height: 22 },
  { id: 'brz-warehouse-2', sprite: 'storehouse', x: 560, y: -20, height: 20 },
  { id: 'brz-doctor-1', sprite: 'cabin-small', x: -520, y: 40, height: 16 },
  { id: 'brz-doctor-2', sprite: 'cabin-small', x: 700, y: 330, height: 16 },
  { id: 'brz-courthouse', sprite: 'timber-hall', x: 270, y: 560, height: 24, label: 'The municipal building' },
  { id: 'brz-masonic-oak', sprite: 'live-oak-large', x: -2201, y: 2188, height: 50, label: 'The Masonic Oak' },
];
const BRAZORIA = {
  name: 'Brazoria', research: 'docs/town-research/brazoria.md', bearing: 133.7, anchor: { x: 0, y: 0 },
  // Main Street runs 130 ft from the top of a 22-ft cut bank, and the Mills store was built out over the water (research §7.4):
  // this town stands nearer its river than any other, so it is held only 100 ft clear of the river's centreline.
  riverClearance: 100,
  streets: grid(BRZ_X, BRZ_Y, 55.6).map(street => ['Main Street', 'Market Street', 'Pearl Street'].includes(street.name) ? street : { ...street, faint: true }),
  squares: [],
  buildings: withFill(BRZ_NAMED, { prefix: 'brz-house', origin: { x: -1148, y: 0 }, module: 278, block: 222, lots: 2, centre: { x: 0, y: 150 }, count: 34, rows: [0, 4], columns: [0, 8], sprites: ['house-dog-run', 'house-hewn-log', 'house-round-log', 'cabin-wide', 'cabin-weathered'] }),
};

// ---------------------------------------------------------------------------------------------- Velasco
// docs/town-research/velasco.md §8: six buildings in two fenced enclosures, measured off Harkort's drawing, and the 1832
// circular fort derelict with a new gun on its mound. The origin is Monument Square, the map's point.
// stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a circular log-and-sand fort. Palisade pieces in a ring, gapped.
const VELASCO = {
  name: 'Velasco', research: 'docs/town-research/velasco.md', bearing: 130.8, anchor: { x: 0, y: 0 },
  streets: [],
  squares: [],
  walls: [
    { name: 'Fort Velasco', points: ring({ x: -420, y: -180 }, 45, 20), sprite: 'palisade', breach: 'alamo-palisade-broken', breachEvery: 3, spacing: 14, height: 8 },
    { name: 'The enclosures', points: [{ x: -900, y: -560 }, { x: -500, y: -560 }, { x: -500, y: -230 }, { x: -900, y: -230 }, { x: -900, y: -560 }], sprite: 'fence-rail', spacing: 40, height: 5 },
    { name: '', points: [{ x: -700, y: -560 }, { x: -700, y: -230 }], sprite: 'fence-rail', spacing: 40, height: 5 },
  ],
  buildings: [
    { id: 'vel-fort-gun', sprite: 'cannon-iron-e', x: -420, y: -180, height: 7, label: 'Fort Velasco' },
    { id: 'vel-brown-hoskins', sprite: 'frame-hall', x: -760, y: -430, height: 28, label: 'Brown & Hoskins’ tavern' },
    { id: 'vel-custom-house', sprite: 'trading-house', x: -620, y: -300, height: 18, label: 'The custom house' },
    { id: 'vel-pilot-house', sprite: 'cabin-wide', x: -560, y: -520, height: 16, label: 'The pilot’s house' },
    { id: 'vel-clokey', sprite: 'timber-shop', x: -880, y: -360, height: 18 },
    { id: 'vel-house-1', sprite: 'cabin-small', x: -700, y: -540, height: 15, filler: true },
    { id: 'vel-house-2', sprite: 'cabin-weathered', x: -840, y: -260, height: 15, filler: true },
  ],
};

// ---------------------------------------------------------------------------------------------- Harrisburg
// docs/town-research/harrisburg.md §8: a measured grid drawn as survey lines, about twenty houses, and the steam mills on
// the bayou, the largest thing in the place. The origin, Broadway × Cypress, is the map's point.
const HARRISBURG = {
  name: 'Harrisburg', research: 'docs/town-research/harrisburg.md', bearing: 88.8, anchor: { x: 0, y: 0 },
  streets: [
    { name: 'Broadway', width: 124, points: [{ x: 0, y: -1300 }, { x: 0, y: 400 }] },
    ...faint([['Medina', -421], ['Colorado', -821], ['Frio', 424]].map(([name, x]) => ({ name, width: 80, points: [{ x, y: -1300 }, { x, y: 400 }] }))),
    ...faint([['Market', -1210], ['Sycamore', -800], ['Walnut', -400], ['Cypress', 0], ['Elm', 396]].map(([name, y]) => ({ name, width: 80, points: [{ x: -1400, y }, { x: 500, y }] }))),
  ],
  squares: [],
  buildings: [
    // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - the buildings the towns' research found. The steam sawmill.
    { id: 'hbg-mill', sprite: 'timber-hall', x: 620, y: -500, height: 24, label: 'Harrisburg Steam Mills' },
    { id: 'hbg-mill-boiler', sprite: 'storehouse', x: 700, y: -470, height: 14 },
    { id: 'hbg-mill-logs', sprite: 'pine-loblolly-log', x: 560, y: -560, height: 6 },
    { id: 'hbg-harris-house', sprite: 'house-dog-run', x: 220, y: -600, height: 20, label: 'The Harris house' },
    { id: 'hbg-dch-store', sprite: 'trading-house', x: 300, y: -1000, height: 18, label: 'D. C. Harris’s store' },
    { id: 'hbg-warehouse', sprite: 'storehouse', x: 560, y: -980, height: 18 },
    { id: 'hbg-moore', sprite: 'frame-hall', x: -380, y: -700, height: 22, label: 'John W. Moore’s house' },
    { id: 'hbg-frame-1', sprite: 'frame-hall', x: 480, y: -700, height: 18 },
    { id: 'hbg-frame-2', sprite: 'timber-shop', x: 420, y: -640, height: 18 },
    { id: 'hbg-cannon-1', sprite: 'cannon-iron-e', x: 520, y: -430, height: 6, label: 'Guns waiting to go west' },
    { id: 'hbg-cannon-2', sprite: 'cannon-iron-e', x: 545, y: -420, height: 6 },
    { id: 'hbg-cannon-3', sprite: 'cannon-iron-e', x: 570, y: -410, height: 6 },
    ...dwellings('hbg-log', { origin: { x: -1221, y: -1610 }, module: 400, block: 320, lots: 2, centre: { x: 100, y: -700 }, count: 14, rows: [0, 5], columns: [0, 4], sprites: ['house-round-log', 'cabin-small', 'cabin-weathered', 'house-hewn-log'], height: 16, taken: [{ x: 220, y: -600 }, { x: 300, y: -1000 }, { x: -380, y: -700 }, { x: 480, y: -700 }, { x: 420, y: -640 }] }),
  ],
};

// ---------------------------------------------------------------------------------------------- Anahuac
// docs/town-research/anahuac.md §8: the 1831 brick fort a robbed ruin on the bluff, empty; a scatter of fifteen houses and
// shops a mile north on the terrace, some empty. North-up; the origin is the 1976 fort marker, and the map's point stands
// at x 1642, y −6287 in it (measured).
const ANAHUAC = {
  name: 'Anahuac', research: 'docs/town-research/anahuac.md', bearing: 90, anchor: { x: 1642, y: -6287 },
  streets: [
    { name: 'The track to Turtle Bayou', width: 12, faint: true, points: [{ x: 1100, y: -4000 }, { x: 1400, y: -6800 }] },
    { name: 'The path to the fort', width: 8, faint: true, points: [{ x: 700, y: -1500 }, { x: -100, y: -100 }] },
  ],
  squares: [],
  buildings: [
    { id: 'anh-fort', sprite: 'brick-fort-ruin', x: -160, y: 0, height: 14, label: 'Fort Anahuac (ruin)' },
    { id: 'anh-fort-davis', sprite: 'brick-bastion', x: -205, y: 40, height: 8 },
    { id: 'anh-fort-barracks', sprite: 'brick-barracks-ruin', x: -168, y: -12, height: 10 },
    { id: 'anh-fort-breach', sprite: 'brick-breach', x: -125, y: 20, height: 6 },
    { id: 'anh-willcox-store', sprite: 'trading-house', x: 900, y: -3600, height: 18, label: 'Willcox’s store' },
    { id: 'anh-briscoe-store', sprite: 'trading-house', x: 620, y: -3000, height: 18, label: 'Briscoe’s store' },
    { id: 'anh-custom-office', sprite: 'storehouse', x: 560, y: -2650, height: 16, label: 'The collector’s office (empty)' },
    { id: 'anh-calaboose', sprite: 'cabin-small', x: 760, y: -2700, height: 12, label: 'The calaboose' },
    { id: 'anh-freeman-house', sprite: 'house-round-log', x: 1300, y: -4200, height: 14 },
    { id: 'anh-labadie', sprite: 'cabin-wide', x: 650, y: -2000, height: 15 },
    { id: 'anh-skiff', sprite: 'skiff', x: 300, y: -3000, height: 4, onWater: true },
    ...scatter('anh-house', { centre: { x: 1100, y: -3400 }, radius: 1700, count: 8, sprites: ['house-round-log', 'cabin-small', 'house-hewn-log'], height: 16, within: (x, y) => x > 600 && x < 1700 && y < -1500 && y > -5200 }),
    ...scatter('anh-empty', { centre: { x: 1200, y: -2600 }, radius: 1200, count: 4, sprites: ['cabin-weathered', 'cabin-ruin'], height: 14, within: (x, y) => x > 600 && x < 1700 && y < -1500 }),
  ],
};

// ---------------------------------------------------------------------------------------------- Nacogdoches
// docs/town-research/nacogdoches.md §9: the Camino Real along the ridge, the irregular Plaza Principal turned thirty
// degrees, the Stone House, and a town that fills Main Street for a third of a mile and thins down the slopes - old houses
// of upright logs and mud, white frame houses among them, log cabins on the outskirts. North-up; the origin is Main × North
// Fredonia, and the map's point stands at x −343, y −224 (measured).
const NAC_CAMINO = [{ x: -1180, y: -730 }, { x: -1090, y: -720 }, { x: -750, y: -530 }, { x: -499, y: -373 }, { x: -259, y: -151 }, { x: -56, y: -13 }, { x: 0, y: 0 }, { x: 324, y: 126 }, { x: 627, y: 239 }, { x: 1224, y: 474 }, { x: 1720, y: 670 }, { x: 2040, y: 800 }];
const NAC_PILAR = [{ x: -634, y: -52 }, { x: -352, y: 54 }, { x: -108, y: 164 }, { x: 249, y: 309 }, { x: 560, y: 440 }, { x: 1148, y: 693 }];
const NACOGDOCHES = {
  name: 'Nacogdoches', research: 'docs/town-research/nacogdoches.md', bearing: 90, anchor: { x: -343, y: -224 },
  streets: [
    { name: 'El Camino Real', width: 40, points: NAC_CAMINO },
    { name: 'La Calle del Norte', width: 30, points: [{ x: -499, y: -373 }, { x: -430, y: -550 }, { x: -363, y: -737 }, { x: -260, y: -1070 }, { x: -170, y: -1380 }] },
    { name: 'Calle del Pilar', width: 30, points: NAC_PILAR },
    { name: '', width: 30, points: [{ x: -56, y: -13 }, { x: -108, y: 164 }, { x: -300, y: 610 }] },
    { name: '', width: 30, points: [{ x: -259, y: -151 }, { x: -352, y: 54 }, { x: -460, y: 280 }] },
    { name: '', width: 30, faint: true, points: [{ x: 0, y: 0 }, { x: 207, y: -554 }, { x: 320, y: -860 }] },
    { name: 'To Liberty', width: 25, faint: true, points: [{ x: -634, y: -52 }, { x: -870, y: 470 }, { x: -1090, y: 920 }] },
  ],
  squares: [
    { label: 'Plaza Principal', points: [{ x: -259, y: -151 }, { x: -56, y: -13 }, { x: -108, y: 164 }, { x: -352, y: 54 }] },
    { label: 'Church plaza', points: [{ x: -640, y: -470 }, { x: -470, y: -420 }, { x: -500, y: -250 }, { x: -660, y: -300 }] },
  ],
  buildings: [
    // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - the buildings the towns' research found. The two-storey Stone House.
    { id: 'nac-stone-house', sprite: 'stone-tile-house', x: -60, y: -60, height: 20, label: 'The Stone House' },
    { id: 'nac-red-house', sprite: 'adobe-flat', x: -470, y: -60, height: 16, label: 'The Red House' },
    { id: 'nac-church-ruin', sprite: 'roofless-church-shell', x: -560, y: -380, height: 18, label: 'The old church' },
    { id: 'nac-sterne', sprite: 'timber-hall', x: 1186, y: 872, height: 22, label: 'Sterne’s house' },
    { id: 'nac-durst', sprite: 'house-dog-run', x: -184, y: -1069, height: 18, label: 'Durst’s house' },
    { id: 'nac-smithy', sprite: 'shed-open', x: 100, y: 260, height: 12, label: 'A smithy' },
    ...alongRoad('nac-store', [{ x: -420, y: -300 }, { x: -56, y: -13 }, { x: 627, y: 239 }], { count: 6, spacing: 190, setback: 55, sprites: ['trading-house', 'timber-shop', 'trading-house'], height: 18 }),
    ...alongRoad('nac-frame', [{ x: 700, y: 270 }, { x: 1224, y: 474 }, { x: 1600, y: 620 }], { count: 8, spacing: 130, setback: 70, sprites: ['timber-hall', 'house-dog-run'], height: 18 }),
    // Houses of upright logs and mud (`town-buildings-researched`, 2026-09-21): the palisado row is the jacal of set
    // upright posts, which is what "palisado" means here, with the poorer and broader kinds among the older street.
    ...alongRoad('nac-palisade', NAC_PILAR, { count: 12, spacing: 150, setback: 60, sprites: ['jacal-upright-post'], height: 14 }),
    ...alongRoad('nac-old', [{ x: -1090, y: -720 }, { x: -750, y: -530 }, { x: -499, y: -373 }], { count: 8, spacing: 90, setback: 60, sprites: ['jacal-broad', 'adobe-flat', 'jacal-poor'], height: 14 }),
    ...scatter('nac-log', { centre: { x: 200, y: 100 }, radius: 1400, count: 10, sprites: ['cabin-small', 'house-hewn-log'], height: 14, within: (x, y) => Math.hypot(x - 200, y - 100) > 800 }),
  ],
};

// ---------------------------------------------------------------------------------------------- Refugio
// docs/town-research/refugio.md §9: the 1834 plat's survey lines on open prairie round an empty plaza, the mission church
// a ruin in its walled churchyard, and about two dozen huts near the church. The origin, the plaza's centre, is the map's
// point (HIST-TEX-025).
const REF_LINES = [-1458.33, -1041.67, -625, -208.33, 208.33, 625, 1041.67, 1458.33];
const REFUGIO_PLAZA = { label: 'Plaza de la Constitución', x: -166.67, y: -166.67, width: 333.33, height: 333.33 };
const REFUGIO = {
  name: 'Refugio', research: 'docs/town-research/refugio.md', bearing: 99.6, anchor: { x: 0, y: 0 },
  streets: faint(REF_LINES.flatMap(v => [
    { name: '', width: 83.33, points: [{ x: -1500, y: v }, { x: 1500, y: v }] },
    { name: '', width: 83.33, points: [{ x: v, y: -1500 }, { x: v, y: 1500 }] },
  ])),
  squares: [REFUGIO_PLAZA],
  walls: [
    { name: 'The churchyard', points: [{ x: -753, y: 1066 }, { x: -770, y: 1066 }, { x: -770, y: 916 }, { x: -720, y: 916 }, { x: -720, y: 1066 }, { x: -737, y: 1066 }], sprite: 'wall-straight', spacing: 16, height: 6 },
  ],
  buildings: [
    { id: 'ref-plaza-rock', sprite: 'survey-stone-corner', x: 0, y: 0, height: 4 },
    { id: 'ref-mission-church', sprite: 'roofless-church-shell', x: -745, y: 898, height: 24, label: 'Mission church (ruinous)' },
    { id: 'ref-sabina-brown', sprite: 'house-jacal', x: -500, y: -333, height: 14, filler: true },
    { id: 'ref-westover', sprite: 'house-jacal', x: -257, y: -757, height: 14, filler: true },
    { id: 'ref-scott', sprite: 'house-jacal', x: -560, y: 760, height: 14, filler: true },
    { id: 'ref-power-town-house', sprite: 'house-jacal', x: -620, y: 1900, height: 15, label: 'Colonel Power’s town house' },
    { id: 'ref-quirk', sprite: 'cabin-small', x: -300, y: 540, height: 16 },
    // The huts round the mission, in the jacal variety delivered 2026-09-21; the named houses above keep the one jacal
    // they have always been drawn as, so a student who knows Colonel Power's town house still knows it.
    ...scatter('ref-hut', { centre: { x: -700, y: 700 }, radius: 1000, count: 20, sprites: ['adobe-flat', 'jacal-broad', 'adobe-flat', 'jacal-poor', 'adobe-tile', 'jacal-ramada'], height: 14, exclude: [REFUGIO_PLAZA, { x: -800, y: 880, width: 110, height: 190 }] }),
  ],
};

// ---------------------------------------------------------------------------------------------- Goliad
// docs/town-research/goliad.md §9: the presidio La Bahía as it stood the night of 9-10 October 1835 - limestone walls with
// breaches, the chapel sound, the officers' quarters and barracks - and the town a scatter of stone houses and jacales
// against its south and west walls, no grid and no plaza; the mission across the river a ruin being quarried. The frame
// is the fort's; the map's point, at the presidio, stands about x 50, y 205 in it (the interpretive markers).
const GOLIAD = {
  name: 'Goliad', research: 'docs/town-research/goliad.md', bearing: 96, anchor: { x: 50, y: 205 },
  streets: [
    { name: 'The road from Refugio', width: 30, faint: true, points: [{ x: 200, y: 358 }, { x: 400, y: 520 }, { x: 900, y: 700 }, { x: 1800, y: 1100 }] },
    { name: 'The road from Victoria, by the ford', width: 30, faint: true, points: [{ x: 200, y: 20 }, { x: 60, y: -400 }, { x: -130, y: -680 }] },
  ],
  squares: [{ label: 'Parade ground', x: 20, y: 20, width: 355, height: 338 }],
  walls: [
    // The number and place of the breaches are invented (research §9.4); that the wall was breached is documented.
    { name: 'Presidio La Bahía', points: [{ x: 20, y: 20 }, { x: 375, y: 20 }, { x: 375, y: 358 }, { x: 20, y: 358 }, { x: 20, y: 20 }], sprite: 'alamo-wall-intact', breach: 'alamo-wall-breach', breachEvery: 11, spacing: 14, height: 8 },
  ],
  buildings: [
    ...[[20, 20], [375, 20], [375, 358], [20, 358]].map(([x, y], i) => ({ id: `gol-bastion-${i + 1}`, sprite: 'alamo-wall-corner', x, y, height: 10 })),
    { id: 'gol-chapel', sprite: 'chapel', x: 135, y: 32, height: 23, label: 'Our Lady of Loreto' },
    { id: 'gol-magazine', sprite: 'storehouse', x: 162, y: 75, height: 10 },
    { id: 'gol-officers-quarters', sprite: 'stone-long-barrack', x: 55, y: 180, height: 12, label: 'Officers’ quarters' },
    { id: 'gol-barracks', sprite: 'stone-long-barrack', x: 268, y: 345, height: 12 },
    { id: 'gol-espiritu-santo', sprite: 'roofless-church-shell', x: -1498, y: -3113, height: 20, label: 'Mission Espíritu Santo (ruin)' },
    { id: 'gol-zaragoza', sprite: 'stone-tile-house', x: -38, y: 420, height: 14, label: 'The Zaragoza house' },
    ...[[-60, 480], [-150, 390], [30, 500], [150, 480], [260, 470], [440, 430]].map(([x, y], i) => ({ id: `gol-stone-${i + 1}`, sprite: 'stone-tile-house', x, y, height: 14, filler: true })),
    // Jacales in variety (`town-buildings-researched`, 2026-09-21), with the flat-roofed adobe among them as before.
    ...scatter('gol-jacal', { centre: { x: 0, y: 500 }, radius: 900, count: 36, sprites: ['jacal-broad', 'jacal-upright-post', 'adobe-flat', 'jacal-poor', 'jacal-ramada'], height: 13, exclude: [{ x: 20, y: 20, width: 355, height: 338 }], within: (x, y) => y > 380 || x < -40 }),
  ],
};

export const TOWN_LAYOUTS = Object.freeze({
  'san-felipe': SAN_FELIPE, victoria: VICTORIA, mina: MINA, matagorda: MATAGORDA, columbia: COLUMBIA, liberty: LIBERTY,
  washington: WASHINGTON, brazoria: BRAZORIA, velasco: VELASCO, harrisburg: HARRISBURG, anahuac: ANAHUAC, nacogdoches: NACOGDOCHES, refugio: REFUGIO, goliad: GOLIAD,
});

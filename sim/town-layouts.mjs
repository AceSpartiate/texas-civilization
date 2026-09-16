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
  return spots.slice(0, count).map((spot, i) => ({ id: `${prefix}-${i + 1}`, sprite: sprites[(i * 3 + spot.x) % sprites.length], x: spot.x, y: spot.y, height: height - (i % 3) * 2, filler: true }));
}
const grid = (xs, ys, width) => [
  ...xs.map(([name, x]) => ({ name, width, points: [{ x, y: ys[0][1] }, { x, y: ys.at(-1)[1] }] })),
  ...ys.map(([name, y]) => ({ name, width, points: [{ x: xs[0][1], y }, { x: xs.at(-1)[1], y }] })),
];
const withFill = (named, fill) => [...named, ...dwellings(fill.prefix, { ...fill, taken: named })];

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
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a frame building. The only frame building in town in 1828.
  { id: 'sf-cooper-chieves', sprite: 'trading-house', x: 1330, y: 2000, height: 26, label: 'Cooper & Chieves, saloon' },
  { id: 'sf-dinsmore-store', sprite: 'trading-house', x: 950, y: 1800, height: 24, label: 'Dinsmore’s store' },
  { id: 'sf-white-store', sprite: 'trading-house', x: 1120, y: 1795, height: 24, label: 'White’s store', trade: 'store' },
  { id: 'sf-cotton-plant', sprite: 'cabin-small', x: 1290, y: 1790, height: 20, label: 'The Cotton Plant' },
  { id: 'sf-cotten-house', sprite: 'house-round-log', x: 1380, y: 1785, height: 22 },
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a storey-and-a-half log house. The Whiteside Hotel, drawn taller.
  { id: 'sf-whiteside-hotel', sprite: 'house-dog-run', x: 1560, y: 1790, height: 34, label: 'Whiteside Hotel' },
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
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - the Round Top House. A round fortified house; a storehouse drawn tall.
  { id: 'vic-round-top', sprite: 'storehouse', x: 4900, y: 2190, height: 30, label: 'Round Top House' },
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
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a jacal row. The one jacal the library has, at varied heights.
  buildings: withFill(VIC_NAMED, { prefix: 'vic-jacal', origin: { x: 4300, y: 900 }, module: 337.3, block: 277.8, lots: 2, centre: { x: 4806, y: 2418 }, count: 30, rows: [0, 7], columns: [0, 4], skipBlocks: [[1, 4], [1, 1], [0, 1]], sprites: ['house-jacal', 'house-jacal', 'house-hewn-log', 'house-jacal', 'shed-open'], height: 18 }),
};

// ---------------------------------------------------------------------------------------------- Mina
// docs/town-research/mina.md §7: a cardinal grid with the surveyor's street widths; a small cluster round the stockade on
// its documented block, stopping at Farm Street.
const MINA_X = [['Water', 3787], ['Pecan', 4171], ['Jefferson', 4567], ['Hill', 4958], ['Haysel', 5349]];
const MINA_Y = [['Farm', 2804], ['Spring', 3199], ['Chestnut', 3600], ['Pine', 3984], ['Walnut', 4370], ['Austin', 4770], ['Government', 5146]];
// stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a frontier log stockade. `palisade` run in a square with a `gate`.
const STOCKADE = (() => {
  const pieces = [], left = 3900, top = 4100, side = 168, step = 28;
  for (let i = 0; i <= side / step; i++) {
    for (const [x, y] of [[left + i * step, top], [left + i * step, top + side], [left, top + i * step], [left + side, top + i * step]]) {
      if (x === left + side / 2 && y === top + side) continue;
      pieces.push({ id: `mina-stockade-${pieces.length + 1}`, sprite: 'palisade', x, y, height: 14 });
    }
  }
  pieces.push({ id: 'mina-stockade-gate', sprite: 'gate', x: left + side / 2, y: top + side, height: 14 });
  pieces.push({ id: 'mina-stockade-house', sprite: 'house-hewn-log', x: left + side / 2, y: top + side / 2 + 20, height: 22, label: 'The stockade' });
  return pieces;
})();
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
  buildings: withFill(MINA_NAMED, { prefix: 'mina-house', origin: { x: 3787, y: 2804 }, module: 388.9, block: 333.3, lots: 2, centre: { x: 3984, y: 4180 }, count: 22, rows: [0, 6], columns: [0, 4], skipBlocks: [[0, 3], [0, 5], [1, 5]] }),
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
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a frame building. The frame town of imported lumber, in log.
  buildings: withFill(MAT_NAMED, { prefix: 'mat-house', origin: { x: -333, y: 1165 }, module: 416.7, block: 333, lots: 2, centre: { x: 1900, y: 4300 }, count: 36, rows: [0, 8], columns: [0, 9], skipBlocks: [[6, 2], [6, 3], [7, 2], [7, 3]], sprites: ['cabin-small', 'house-hewn-log', 'trading-house', 'cabin-weathered', 'house-round-log'] }),
};

// ---------------------------------------------------------------------------------------------- Columbia
// docs/town-research/columbia.md §7: twenty measured blocks with almost nothing in them, a short row on Brazos Avenue,
// and the broad road out toward Bell's Landing. Marion, two miles off at the landing, is not a place on the map.
const COL_X = [['17th Street', 0], ['16th Street', 407], ['Broad Street', 836], ['15th Street', 1260], ['14th Street', 1657]];
const COL_Y = [['Jefferson Street', 0], ['Hamilton Street', 400], ['Brazos Avenue', 810], ['Clay Street', 1224], ['Bernard Street', 1617], ['Jackson Street', 2011]];
const COL_NAMED = [
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a two-storey frame house. The Senate house, in frame-hall.
  { id: 'col-senate-house', sprite: 'frame-hall', x: 190, y: 900, height: 26, label: 'Brown house · the Senate' },
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a frame building. Kelsey's storey-and-a-half clapboard store.
  { id: 'col-kelsey-store', sprite: 'trading-house', x: 190, y: 720, height: 22, label: 'Kelsey’s store · the House', trade: 'store' },
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
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a small hewn-log court room, 22 feet square. `cabin-small`.
  { id: 'lib-casa-consistorial', sprite: 'cabin-small', x: 1750, y: 1361, height: 14, label: 'Casa Consistorial · the court room' },
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

export const TOWN_LAYOUTS = Object.freeze({ 'san-felipe': SAN_FELIPE, victoria: VICTORIA, mina: MINA, matagorda: MATAGORDA, columbia: COLUMBIA, liberty: LIBERTY });
